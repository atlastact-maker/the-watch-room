-- The admin lists, uncapped. Run once (after 022).
--
-- admin_list_users was written for a handful of accounts and refused to
-- return more than 200 rows; the Users tab silently showed the newest
-- 200 and the doors-open email read that same list. This gives the tab
-- search and paging, a count for the paging, a plain list of the tester
-- emails for the doors-open email, and raises the ceilings on the
-- application and invitation lists.

-- Users: paged and searchable. The signature changes, so drop first.
drop function if exists public.admin_list_users(int);

create or replace function public.admin_list_users(
  p_limit int default 100,
  p_offset int default 0,
  p_query text default null
)
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
declare
  v_q text := nullif(lower(btrim(coalesce(p_query, ''))), '');
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
    where v_q is null
       or lower(u.email) like '%' || v_q || '%'
       or lower(coalesce(u.raw_user_meta_data ->> 'callsign', '')) like '%' || v_q || '%'
       or lower(coalesce(a.discord, u.raw_user_meta_data ->> 'advisor_discord', '')) like '%' || v_q || '%'
    order by u.created_at desc
    limit greatest(1, least(coalesce(p_limit, 100), 500))
    offset greatest(0, coalesce(p_offset, 0));
end;
$$;

create or replace function public.admin_count_users(p_query text default null)
returns bigint
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_q text := nullif(lower(btrim(coalesce(p_query, ''))), '');
  v_n bigint;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  select count(*) into v_n
  from auth.users u
  left join public.advisors a on a.user_id = u.id
  where v_q is null
     or lower(u.email) like '%' || v_q || '%'
     or lower(coalesce(u.raw_user_meta_data ->> 'callsign', '')) like '%' || v_q || '%'
     or lower(coalesce(a.discord, u.raw_user_meta_data ->> 'advisor_discord', '')) like '%' || v_q || '%';
  return v_n;
end;
$$;

-- Every tester, for the doors-open email. is_admin flags the accounts
-- that hold the admin role, which the email skips.
create or replace function public.admin_list_testers()
returns table (email text, note text, created_at timestamptz, is_admin boolean)
language sql stable security definer
set search_path = public
as $$
  select t.email, t.note, t.created_at,
         exists (select 1 from public.user_roles r where lower(r.email) = lower(t.email) and r.role = 'admin') as is_admin
  from public.testers t
  where public.is_admin()
  order by t.created_at asc;
$$;

-- Applications and invitations: same functions, higher ceilings.
create or replace function public.admin_list_tester_applications(p_limit int default 5000)
returns table (
  user_id uuid, email text, callsign text, discord text, platform text, background text,
  why text, hours text, agreed boolean, status text, note text, created_at timestamptz,
  decided_at timestamptz, tester boolean
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
  limit greatest(1, least(coalesce(p_limit, 5000), 20000));
$$;

create or replace function public.admin_list_tester_invites(p_limit int default 5000)
returns table (
  token uuid, user_id uuid, email text, invited_by text,
  created_at timestamptz, expires_at timestamptz, accepted_at timestamptz
)
language sql stable security definer
set search_path = public
as $$
  select i.token, i.user_id, i.email, i.invited_by, i.created_at, i.expires_at, i.accepted_at
  from public.tester_invites i
  where public.is_admin()
  order by i.created_at desc
  limit greatest(1, least(coalesce(p_limit, 5000), 20000));
$$;

revoke all on function public.admin_list_users(int, int, text) from public, anon;
revoke all on function public.admin_count_users(text) from public, anon;
revoke all on function public.admin_list_testers() from public, anon;
grant execute on function public.admin_list_users(int, int, text) to authenticated;
grant execute on function public.admin_count_users(text) to authenticated;
grant execute on function public.admin_list_testers() to authenticated;

notify pgrst, 'reload schema';
