-- Notifications: the bell on the console. Run once (after 028) in the
-- Supabase SQL editor.
--
-- One row per thing an operator should hear about: a colleague request
-- made to them, a request of theirs accepted, an honour added to their
-- rack. The row is written by the database functions that do those
-- things, as a side effect, so nothing in the app has to remember to.
-- The operator reads and marks their own rows under RLS; the table is
-- in the realtime publication so an open console hears a new row at
-- once and shows it as a pop-up.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null
    check (kind in ('colleague_request', 'colleague_accepted', 'honour_granted', 'programme')),
  actor_id uuid references auth.users (id) on delete set null,
  title text not null check (char_length(title) between 1 and 140),
  body text not null default '' check (char_length(body) <= 400),
  href text not null default '' check (char_length(href) <= 200),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "own notifications" on public.notifications;
create policy "own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "mark own notifications read" on public.notifications;
create policy "mark own notifications read"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Realtime: an open console subscribes to its own rows (RLS applies to
-- the subscription too).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- The one writer. An unread notification of the same kind from the same
-- actor is not repeated, so a request asked twice is one line.
create or replace function public.notify_user(
  p_user_id uuid,
  p_kind text,
  p_actor_id uuid,
  p_title text,
  p_body text default '',
  p_href text default ''
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_user_id = p_actor_id then
    return;
  end if;
  if p_actor_id is not null and exists (
    select 1 from public.notifications n
    where n.user_id = p_user_id and n.kind = p_kind and n.actor_id = p_actor_id and n.read_at is null
  ) then
    return;
  end if;
  insert into public.notifications (user_id, kind, actor_id, title, body, href)
  values (p_user_id, p_kind, p_actor_id, left(p_title, 140), left(coalesce(p_body, ''), 400), left(coalesce(p_href, ''), 200));
end;
$$;
revoke all on function public.notify_user(uuid, text, uuid, text, text, text) from public, anon, authenticated;

-- ---- the colleague functions, now telling the other side ---------------

create or replace function public.colleague_request(p_user_id uuid)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_row public.colleagues%rowtype;
  v_name text;
begin
  if v_me is null then
    raise exception 'sign in first';
  end if;
  if p_user_id is null or p_user_id = v_me then
    raise exception 'not a colleague';
  end if;
  if not exists (select 1 from auth.users u where u.id = p_user_id and u.email_confirmed_at is not null) then
    raise exception 'no such account';
  end if;
  v_name := public.operator_callsign(v_me);
  select * into v_row
  from public.colleagues c
  where least(c.requester_id, c.addressee_id) = least(v_me, p_user_id)
    and greatest(c.requester_id, c.addressee_id) = greatest(v_me, p_user_id);
  if found then
    if v_row.status = 'accepted' then
      return 'colleague';
    end if;
    if v_row.requester_id = v_me then
      return 'requested';
    end if;
    -- They asked first, or were turned down before: asking back is agreeing.
    update public.colleagues
       set status = 'accepted', responded_at = now()
     where requester_id = v_row.requester_id and addressee_id = v_row.addressee_id;
    update public.notifications
       set read_at = now()
     where user_id = v_me and kind = 'colleague_request' and actor_id = p_user_id and read_at is null;
    perform public.notify_user(p_user_id, 'colleague_accepted', v_me, v_name || ' is now your colleague', 'They answered your request by asking you back.', '/operators/' || v_me::text);
    return 'colleague';
  end if;
  if public.operator_visibility(p_user_id) = 'private' then
    raise exception 'not accepting requests';
  end if;
  if (select count(*) from public.colleagues c where c.requester_id = v_me and c.status = 'pending') >= 50 then
    raise exception 'too many open requests';
  end if;
  insert into public.colleagues (requester_id, addressee_id) values (v_me, p_user_id);
  perform public.notify_user(p_user_id, 'colleague_request', v_me, v_name || ' asked to be your colleague', 'Accept or decline on the Colleagues page.', '/colleagues');
  return 'requested';
end;
$$;

create or replace function public.colleague_respond(p_user_id uuid, p_accept boolean)
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'sign in first';
  end if;
  update public.colleagues
     set status = case when p_accept then 'accepted' else 'declined' end,
         responded_at = now()
   where requester_id = p_user_id and addressee_id = v_me and status = 'pending';
  if not found then
    return false;
  end if;
  -- The request is answered either way; the line about it is done with.
  update public.notifications
     set read_at = now()
   where user_id = v_me and kind = 'colleague_request' and actor_id = p_user_id and read_at is null;
  if p_accept then
    perform public.notify_user(p_user_id, 'colleague_accepted', v_me, public.operator_callsign(v_me) || ' accepted your colleague request', 'Their record is open to you where they keep it to colleagues.', '/operators/' || v_me::text);
  end if;
  return true;
end;
$$;

create or replace function public.colleague_remove(p_user_id uuid)
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'sign in first';
  end if;
  delete from public.colleagues c
   where least(c.requester_id, c.addressee_id) = least(v_me, p_user_id)
     and greatest(c.requester_id, c.addressee_id) = greatest(v_me, p_user_id);
  if found then
    -- A withdrawn request leaves no line waiting on the other side.
    update public.notifications
       set read_at = now()
     where user_id = p_user_id and kind = 'colleague_request' and actor_id = v_me and read_at is null;
  end if;
  return found;
end;
$$;

-- ---- honours: the recipient hears, by the honour's name ------------------

drop function if exists public.admin_grant_award(uuid, text, text);

create or replace function public.admin_grant_award(p_user_id uuid, p_award_key text, p_citation text default '', p_award_name text default '')
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_me uuid := auth.uid();
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  insert into public.user_awards (user_id, award_key, citation, granted_by)
  values (p_user_id, lower(btrim(p_award_key)), left(btrim(coalesce(p_citation, '')), 280), coalesce(auth.jwt() ->> 'email', ''))
  returning id into v_id;
  perform public.notify_user(
    p_user_id, 'honour_granted', v_me,
    coalesce(nullif(btrim(p_award_name), ''), 'An honour') || ' has been added to your rack',
    coalesce(nullif(btrim(p_citation), ''), 'Granted by the programme.'),
    '/stats'
  );
  return v_id;
end;
$$;
revoke all on function public.admin_grant_award(uuid, text, text, text) from public, anon;
grant execute on function public.admin_grant_award(uuid, text, text, text) to authenticated;

-- ---- marking read ---------------------------------------------------------------

create or replace function public.notifications_mark_read(p_ids uuid[] default null)
returns int
language plpgsql security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_n int;
begin
  if v_me is null then
    raise exception 'sign in first';
  end if;
  update public.notifications
     set read_at = now()
   where user_id = v_me and read_at is null
     and (p_ids is null or id = any (p_ids));
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
revoke all on function public.notifications_mark_read(uuid[]) from public, anon;
grant execute on function public.notifications_mark_read(uuid[]) to authenticated;

-- PostgREST picks the new functions up on the next request.
notify pgrst, 'reload schema';
