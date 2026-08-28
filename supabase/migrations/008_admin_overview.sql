-- Admin overview functions. Run once in the SQL editor (after 007).
--
-- Same shape as 007: SECURITY DEFINER, is_admin() checked inside the
-- database, no service-role key anywhere.

-- Headline numbers for the admin dashboard.
create or replace function public.admin_overview()
returns table (
  total_accounts bigint,
  new_accounts_7d bigint,
  newsletter_opt_ins bigint,
  applications_total bigint,
  applications_pending bigint,
  advisors_accepted bigint,
  operators_granted bigint,
  calls_answered bigint,
  incidents_resolved bigint
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  return query select
    (select count(*) from auth.users),
    (select count(*) from auth.users where created_at > now() - interval '7 days'),
    (select count(*) from auth.users
       where (raw_user_meta_data ->> 'newsletter_opt_in')::boolean is true),
    (select count(*) from public.advisors),
    (select count(*) from public.advisors a
       join auth.users u on u.id = a.user_id
       left join public.user_roles r on lower(r.email) = lower(u.email)
       where r.email is null),
    (select count(*) from public.user_roles where role = 'advisor'),
    (select count(*) from public.user_roles where role = 'operator'),
    (select coalesce(sum(cs.calls_answered), 0)::bigint from public.career_stats cs),
    (select coalesce(sum(cs.incidents_resolved), 0)::bigint from public.career_stats cs);
end;
$$;

-- Recent registrations: who signed up, when, and what standing they hold.
create or replace function public.admin_list_users(p_limit int default 25)
returns table (
  email text,
  callsign text,
  created_at timestamptz,
  newsletter boolean,
  is_advisor_applicant boolean,
  assigned_role public.access_role
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  return query
    select u.email::text,
           coalesce(u.raw_user_meta_data ->> 'callsign', '')::text,
           u.created_at,
           coalesce((u.raw_user_meta_data ->> 'newsletter_opt_in')::boolean, false),
           exists (select 1 from public.advisors a where a.user_id = u.id),
           r.role
    from auth.users u
    left join public.user_roles r on lower(r.email) = lower(u.email)
    order by u.created_at desc
    limit greatest(1, least(p_limit, 200));
end;
$$;

grant execute on function public.admin_overview() to authenticated;
grant execute on function public.admin_list_users(int) to authenticated;
