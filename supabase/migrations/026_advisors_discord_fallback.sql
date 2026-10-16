-- The advisor list's Discord handle, wherever it was saved. Run once
-- (after 025) in the Supabase SQL editor.
--
-- An advisor's handle can live in two places: the advisors row (written
-- by the questionnaire and by Settings) and the account's user_metadata
-- (written at signup, before the row exists). admin_list_users already
-- reads both; admin_list_advisors read only the row, so an advisor whose
-- row never caught up showed as having no handle. Same columns as
-- before, so the app needs no change.

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
           coalesce(
             nullif(btrim(a.discord), ''),
             nullif(btrim(u.raw_user_meta_data ->> 'advisor_discord'), ''),
             ''
           )::text,
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
