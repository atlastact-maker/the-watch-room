-- The Discord account behind a user, where one is linked. Run once
-- (after 026) in the Supabase SQL editor, then
--   notify pgrst, 'reload schema';
--
-- An account that signed in with Discord, or connected it in Settings,
-- carries a Discord identity in auth.identities: the Discord user id and
-- the username, straight from Discord. The admin lists so far read only
-- the handle typed on the advisor questionnaire, which is a guess at
-- best. Here the identity wins when it exists: the handle shown is the
-- real one, and the lists say so (discord_verified) and carry the id
-- (discord_id) so the site's bot can hand out roles.
--
-- Return types change for admin_list_users and admin_user_profile, so
-- they are dropped first, as 013 and 025 had to. admin_list_advisors
-- keeps its shape and is replaced in place.

create or replace function public.discord_identity_of(p_user_id uuid)
returns table (discord_id text, username text)
language sql stable security definer
set search_path = public
as $$
  select coalesce(i.provider_id, i.id::text),
         coalesce(
           nullif(btrim(i.identity_data ->> 'preferred_username'), ''),
           nullif(regexp_replace(btrim(coalesce(i.identity_data ->> 'name', '')), '#0$', ''), ''),
           nullif(btrim(i.identity_data ->> 'full_name'), '')
         )
  from auth.identities i
  where i.user_id = p_user_id and i.provider = 'discord'
  order by i.created_at
  limit 1;
$$;
revoke all on function public.discord_identity_of(uuid) from public, anon, authenticated;

drop function if exists public.admin_list_users(int, int, text);

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
  tester boolean,
  discord_id text,
  discord_verified boolean
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
             nullif(btrim(di.username), ''),
             nullif(btrim(a.discord), ''),
             nullif(btrim(u.raw_user_meta_data ->> 'advisor_discord'), ''),
             ''
           )::text,
           u.created_at,
           coalesce((u.raw_user_meta_data ->> 'newsletter_opt_in')::boolean, false),
           exists (select 1 from public.advisors ax where ax.user_id = u.id),
           r.role,
           coalesce(u.banned_until > now(), false),
           exists (select 1 from public.testers t where lower(t.email) = lower(u.email)),
           di.discord_id,
           (di.discord_id is not null)
    from auth.users u
    left join public.user_roles r on lower(r.email) = lower(u.email)
    left join public.advisors a on a.user_id = u.id
    left join lateral public.discord_identity_of(u.id) di on true
    where v_q is null
       or lower(u.email) like '%' || v_q || '%'
       or lower(coalesce(u.raw_user_meta_data ->> 'callsign', '')) like '%' || v_q || '%'
       or lower(coalesce(di.username, a.discord, u.raw_user_meta_data ->> 'advisor_discord', '')) like '%' || v_q || '%'
    order by u.created_at desc
    limit greatest(1, least(coalesce(p_limit, 100), 500))
    offset greatest(0, coalesce(p_offset, 0));
end;
$$;
revoke all on function public.admin_list_users(int, int, text) from public, anon;
grant execute on function public.admin_list_users(int, int, text) to authenticated;

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
  left join lateral public.discord_identity_of(u.id) di on true
  where v_q is null
     or lower(u.email) like '%' || v_q || '%'
     or lower(coalesce(u.raw_user_meta_data ->> 'callsign', '')) like '%' || v_q || '%'
     or lower(coalesce(di.username, a.discord, u.raw_user_meta_data ->> 'advisor_discord', '')) like '%' || v_q || '%';
  return v_n;
end;
$$;
revoke all on function public.admin_count_users(text) from public, anon;
grant execute on function public.admin_count_users(text) to authenticated;

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
             nullif(btrim(di.username), ''),
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
    left join lateral public.discord_identity_of(u.id) di on true
    order by a.created_at desc;
end;
$$;

drop function if exists public.admin_user_profile(uuid);

create or replace function public.admin_user_profile(p_user_id uuid)
returns table (
  user_id uuid,
  email text,
  callsign text,
  discord text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  newsletter boolean,
  banned boolean,
  tester boolean,
  assigned_role public.access_role,
  role_icon public.insignia_key,
  role_note text,
  advisor jsonb,
  application jsonb,
  stats jsonb,
  rank bigint,
  players bigint,
  notes jsonb,
  bugs jsonb,
  discord_id text,
  discord_verified boolean
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
             nullif(btrim(di.username), ''),
             nullif(btrim(a.discord), ''),
             nullif(btrim(u.raw_user_meta_data ->> 'advisor_discord'), ''),
             nullif(btrim(ta.discord), ''),
             ''
           )::text,
           u.created_at,
           u.last_sign_in_at,
           u.email_confirmed_at,
           coalesce((u.raw_user_meta_data ->> 'newsletter_opt_in')::boolean, false),
           coalesce(u.banned_until > now(), false),
           exists (select 1 from public.testers t where lower(t.email) = lower(u.email)),
           r.role,
           r.icon,
           coalesce(r.note, '')::text,
           case when a.user_id is null then null else to_jsonb(a) end,
           case when ta.user_id is null then null else to_jsonb(ta) end,
           case when cs.user_id is null then null else to_jsonb(cs) end,
           case when cs.user_id is null then null
                else (select count(*) + 1 from public.career_stats x where x.score > cs.score) end,
           (select count(*) from public.career_stats),
           coalesce((
             select jsonb_agg(jsonb_build_object('id', n.id, 'note', n.note, 'author_email', n.author_email, 'created_at', n.created_at) order by n.created_at desc)
             from public.admin_notes n where n.subject_user_id = u.id
           ), '[]'::jsonb),
           coalesce((
             select jsonb_agg(jsonb_build_object('id', b.id, 'category', b.category, 'severity', b.severity, 'summary', b.summary, 'status', b.status, 'created_at', b.created_at) order by b.created_at desc)
             from public.bug_reports b where b.user_id = u.id
           ), '[]'::jsonb),
           di.discord_id,
           (di.discord_id is not null)
    from auth.users u
    left join public.user_roles r on lower(r.email) = lower(u.email)
    left join public.advisors a on a.user_id = u.id
    left join public.tester_applications ta on ta.user_id = u.id
    left join public.career_stats cs on cs.user_id = u.id
    left join lateral public.discord_identity_of(u.id) di on true
    where u.id = p_user_id;
end;
$$;

revoke all on function public.admin_user_profile(uuid) from public, anon;
grant execute on function public.admin_user_profile(uuid) to authenticated;

-- PostgREST picks the new functions up on the next request.
notify pgrst, 'reload schema';
