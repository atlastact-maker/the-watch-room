-- Pre-alpha applications. Run once (after 019).
--
-- A registered account applies from /prealpha; the application lands
-- on the Pre-alpha tab of /admin. Accepting it ticks the account as a
-- tester (migration 016), which is what opens the game to them; the
-- applicant sees their standing on /prealpha and /standby and gets an
-- email. Declining records the decision so "reviewed and not this time"
-- never looks like "nobody has looked".

create table if not exists public.tester_applications (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  callsign text not null default '',
  discord text not null default '',
  -- What they will test on: device, browser, screen.
  platform text not null default '',
  -- Service background, if any, or the games / control-room experience
  -- they bring.
  background text not null default '',
  -- Why they want in and what they hope to break.
  why text not null default '',
  -- Roughly how much time a week.
  hours text not null default '',
  -- They agree to keep the pre-alpha inside the programme: bugs to the
  -- form, talk to the Discord, no public footage until told otherwise.
  agreed boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  decided_at timestamptz
);

alter table public.tester_applications enable row level security;

-- Applicants read and write their own row; nobody else's.
drop policy if exists "tester applications select own" on public.tester_applications;
create policy "tester applications select own"
  on public.tester_applications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "tester applications insert own" on public.tester_applications;
create policy "tester applications insert own"
  on public.tester_applications for insert
  to authenticated
  with check (auth.uid() = user_id and status = 'pending');

-- An applicant may correct their answers while it is still pending.
drop policy if exists "tester applications update own pending" on public.tester_applications;
create policy "tester applications update own pending"
  on public.tester_applications for update
  to authenticated
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status = 'pending');

-- The admin list. Newest first, pending ahead of decided.
create or replace function public.admin_list_tester_applications(p_limit int default 200)
returns table (
  user_id uuid,
  email text,
  callsign text,
  discord text,
  platform text,
  background text,
  why text,
  hours text,
  agreed boolean,
  status text,
  note text,
  created_at timestamptz,
  decided_at timestamptz,
  tester boolean
)
language sql stable security definer
set search_path = public
as $$
  select
    a.user_id, a.email, a.callsign, a.discord, a.platform, a.background, a.why, a.hours,
    a.agreed, a.status, a.note, a.created_at, a.decided_at,
    exists (select 1 from public.testers t where lower(t.email) = lower(a.email)) as tester
  from public.tester_applications a
  where public.is_admin()
  order by (a.status = 'pending') desc, a.created_at desc
  limit greatest(1, least(coalesce(p_limit, 200), 500));
$$;

-- The decision. Accepting ticks the tester row; declining or resetting
-- to pending clears it. Returns true when the status actually changed,
-- so the acceptance email goes once.
create or replace function public.admin_decide_tester_application(
  p_user_id uuid,
  p_status text,
  p_note text default null
)
returns boolean
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_prev text;
  v_email text;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if p_status not in ('pending', 'accepted', 'declined') then
    raise exception 'unknown status %', p_status;
  end if;
  select status, email into v_prev, v_email from public.tester_applications where user_id = p_user_id;
  if v_email is null then
    return false;
  end if;
  update public.tester_applications
  set status = p_status,
      note = coalesce(p_note, note),
      decided_at = case when p_status = 'pending' then null else now() end,
      updated_at = now()
  where user_id = p_user_id;
  if p_status = 'accepted' then
    insert into public.testers (email) values (lower(trim(v_email))) on conflict (email) do nothing;
  else
    delete from public.testers where lower(email) = lower(trim(v_email));
  end if;
  return v_prev is distinct from p_status;
end;
$$;

revoke all on function public.admin_list_tester_applications(int) from public, anon;
revoke all on function public.admin_decide_tester_application(uuid, text, text) from public, anon;
grant execute on function public.admin_list_tester_applications(int) to authenticated;
grant execute on function public.admin_decide_tester_application(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
