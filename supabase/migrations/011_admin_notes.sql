-- Admin notes on user profiles. Run once in the SQL editor (after 010).
--
-- Notes an admin writes about an account: why an advisor application was
-- accepted, what somebody's background actually turned out to be, a
-- conduct note, a reminder that this person is the fire control advisor
-- worth asking about mobilising. The kind of thing that currently lives
-- in somebody's head and is lost the moment they are not the one reading
-- the application.
--
-- Append-only by design, with an author and a timestamp on every entry.
-- A single editable field would let one admin quietly rewrite another's
-- assessment; a log cannot. Deleting is possible but explicit.
--
-- STRICTLY ADMIN-ONLY. RLS denies everything to everybody; the only way
-- in is the SECURITY DEFINER functions below, each of which checks
-- is_admin() in the database. That means a note can never leak to the
-- user it is about, however the client is manipulated — the subject has
-- no policy that would ever return a row.

create table if not exists public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  -- The account the note is ABOUT.
  subject_user_id uuid not null references auth.users (id) on delete cascade,
  note text not null,
  -- Who wrote it. Email rather than a user id so a note still reads
  -- sensibly if that admin's account is later removed.
  author_email text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_notes_subject_idx
  on public.admin_notes (subject_user_id, created_at desc);

alter table public.admin_notes enable row level security;

-- No policies at all. Not an oversight: with RLS on and no policy, every
-- direct client read and write is refused, including the subject's own.
-- The definer functions below are the only door.

-- Every note on one account, newest first.
create or replace function public.admin_list_notes(p_user_id uuid)
returns table (
  id uuid,
  note text,
  author_email text,
  created_at timestamptz
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  return query
    select n.id, n.note, n.author_email, n.created_at
    from public.admin_notes n
    where n.subject_user_id = p_user_id
    order by n.created_at desc;
end;
$$;

-- Every note on the server, so the admin page can render notes inline
-- against its user list in one call rather than twenty-five. Bounded
-- because this is an admin console over a modest dataset, not a feed.
create or replace function public.admin_notes_all(p_limit int default 500)
returns table (
  id uuid,
  subject_user_id uuid,
  note text,
  author_email text,
  created_at timestamptz
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  return query
    select n.id, n.subject_user_id, n.note, n.author_email, n.created_at
    from public.admin_notes n
    order by n.created_at desc
    limit greatest(1, least(p_limit, 2000));
end;
$$;

-- Add a note. The author is taken from the JWT rather than the client,
-- so an admin cannot write a note under somebody else's name.
create or replace function public.admin_add_note(p_user_id uuid, p_note text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if coalesce(btrim(p_note), '') = '' then
    raise exception 'note is empty';
  end if;
  insert into public.admin_notes (subject_user_id, note, author_email)
  values (
    p_user_id,
    btrim(p_note),
    coalesce(auth.jwt() ->> 'email', 'unknown')
  );
end;
$$;

-- Remove a note. Any admin can delete any note: this is a shared record,
-- not private correspondence, and a note nobody can remove is a note
-- nobody will write honestly.
create or replace function public.admin_delete_note(p_note_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  delete from public.admin_notes where id = p_note_id;
end;
$$;

grant execute on function public.admin_list_notes(uuid) to authenticated;
grant execute on function public.admin_notes_all(int) to authenticated;
grant execute on function public.admin_add_note(uuid, text) to authenticated;
grant execute on function public.admin_delete_note(uuid) to authenticated;
