-- Testers — the closed pre-alpha list. Run once (after 015).
--
-- A tick per person on the registered-users list of /admin. A ticked
-- account can open the game (the menu, a shift, the glossary, the
-- service record and the patch notes) without holding an access role;
-- the admin area, the trailers and the demo stay admin-only. Separate
-- from user_roles on purpose: a tester is not an operator or an advisor,
-- and an advisor can be a tester as well. Keyed by email, like
-- user_roles, so someone can be ticked before they have signed up.

create table if not exists public.testers (
  email text primary key,
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.testers enable row level security;

-- The server gate checks the row with the person's own session, so RLS
-- applies: a signed-in account may read its own row, nobody may write.
drop policy if exists "read own tester row" on public.testers;
create policy "read own tester row"
  on public.testers for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Tick or clear. Idempotent; admin-only in the database like the rest
-- of the console.
create or replace function public.admin_set_tester(
  p_email text,
  p_tester boolean
)
returns void
language plpgsql volatile security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if coalesce(p_tester, false) then
    insert into public.testers (email)
    values (lower(trim(p_email)))
    on conflict (email) do nothing;
  else
    delete from public.testers where lower(email) = lower(trim(p_email));
  end if;
end;
$$;

grant execute on function public.admin_set_tester(text, boolean) to authenticated;

-- admin_list_users gains the tick. Return type changes, so drop first —
-- as 009 and 013 had to. Body otherwise identical to 013.
drop function if exists public.admin_list_users(int);

create or replace function public.admin_list_users(p_limit int default 25)
returns table (
  user_id uuid,
  email text,
  callsign text,
  discord text,
  created_at timestamptz,
  newsletter boolean,
  is_advisor_applicant boolean,
  assigned_role public.access_role,
  banned boolean,
  tester boolean
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  return query
    select u.id,
           u.email::text,
           coalesce(u.raw_user_meta_data ->> 'callsign', '')::text,
           coalesce(
             nullif(btrim(a.discord), ''),
             nullif(btrim(u.raw_user_meta_data ->> 'advisor_discord'), ''),
             ''
           )::text,
           u.created_at,
           coalesce((u.raw_user_meta_data ->> 'newsletter_opt_in')::boolean, false),
           exists (select 1 from public.advisors ax where ax.user_id = u.id),
           r.role,
           coalesce(u.banned_until > now(), false),
           exists (select 1 from public.testers t where lower(t.email) = lower(u.email))
    from auth.users u
    left join public.user_roles r on lower(r.email) = lower(u.email)
    left join public.advisors a on a.user_id = u.id
    order by u.created_at desc
    limit greatest(1, least(p_limit, 200));
end;
$$;

grant execute on function public.admin_list_users(int) to authenticated;

-- Reload PostgREST's schema cache so the new function shape and the new
-- table reach the app.
notify pgrst, 'reload schema';
