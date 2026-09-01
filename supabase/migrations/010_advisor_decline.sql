-- Declining an advisor application. Run once in the Supabase SQL editor
-- (after 009).
--
-- Accepting an application was already recorded — it is the 'advisor'
-- role in user_roles. Declining had nowhere to live, so an application
-- that was reviewed and turned down was indistinguishable from one
-- nobody had looked at: the applicant sat on "received" forever, and
-- there was no decision to send an email about.
--
-- declined_at is that record. Null means not declined, which covers both
-- "still waiting" and "accepted" — acceptance is the role, and standing
-- checks the role first.

alter table public.advisors
  add column if not exists declined_at timestamptz;

-- Set or clear the decline. Returns true when this call actually changed
-- the decision, so the app knows whether to send the applicant an email
-- — pressing Decline twice must not mail them twice.
create or replace function public.admin_set_advisor_decline(
  p_user_id uuid,
  p_declined boolean
)
returns boolean
language plpgsql volatile security definer
set search_path = public
as $$
declare
  was_declined boolean;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  select declined_at is not null into was_declined
  from public.advisors
  where user_id = p_user_id;

  if was_declined is null then
    raise exception 'no advisor application for that account';
  end if;

  if was_declined = p_declined then
    return false;
  end if;

  update public.advisors
  set declined_at = case when p_declined then now() else null end,
      updated_at = now()
  where user_id = p_user_id;

  return true;
end;
$$;

grant execute on function public.admin_set_advisor_decline(uuid, boolean) to authenticated;

-- admin_list_advisors grows a column, and Postgres will not alter a
-- function's return type in place — same dance as 009.
drop function if exists public.admin_list_advisors();

create or replace function public.admin_list_advisors()
returns table (
  user_id uuid,
  email text,
  callsign text,
  service text,
  status text,
  force_area text,
  topics jsonb,
  involvement text,
  contact_ok boolean,
  discord text,
  background text,
  notes text,
  applied_at timestamptz,
  declined_at timestamptz,
  assigned_role public.access_role,
  assigned_icon public.insignia_key
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  return query
    select a.user_id,
           u.email::text,
           a.callsign,
           a.service,
           a.status,
           a.force_area,
           a.topics,
           a.involvement,
           a.contact_ok,
           a.discord,
           a.background,
           a.notes,
           a.created_at,
           a.declined_at,
           r.role,
           r.icon
    from public.advisors a
    join auth.users u on u.id = a.user_id
    left join public.user_roles r on lower(r.email) = lower(u.email)
    order by a.created_at desc;
end;
$$;

grant execute on function public.admin_list_advisors() to authenticated;

-- The overview's "pending" count should mean awaiting a decision, so a
-- declined application no longer sits in it.
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
    -- The only change from 008: a declined application is no longer
    -- awaiting review.
    (select count(*) from public.advisors a
       join auth.users u on u.id = a.user_id
       left join public.user_roles r on lower(r.email) = lower(u.email)
       where r.email is null and a.declined_at is null),
    (select count(*) from public.user_roles where role = 'advisor'),
    (select count(*) from public.user_roles where role = 'operator'),
    (select coalesce(sum(cs.calls_answered), 0)::bigint from public.career_stats cs),
    (select coalesce(sum(cs.incidents_resolved), 0)::bigint from public.career_stats cs);
end;
$$;

grant execute on function public.admin_overview() to authenticated;
