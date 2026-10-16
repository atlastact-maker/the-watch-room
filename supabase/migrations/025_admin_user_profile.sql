-- Per-account profile for the admin console. Run once (after 024).
--
-- One call behind the Users, Pre-alpha and Advisors lists: the account
-- and its standing, its advisor application, its pre-alpha request, its
-- service record with its place on the leaderboard, the admin notes on
-- it and the bug reports it filed. SECURITY DEFINER with is_admin()
-- checked inside, like every other admin_* function; no service-role
-- key anywhere.

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
  bugs jsonb
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
           ), '[]'::jsonb)
    from auth.users u
    left join public.user_roles r on lower(r.email) = lower(u.email)
    left join public.advisors a on a.user_id = u.id
    left join public.tester_applications ta on ta.user_id = u.id
    left join public.career_stats cs on cs.user_id = u.id
    where u.id = p_user_id;
end;
$$;

revoke all on function public.admin_user_profile(uuid) from public, anon;
grant execute on function public.admin_user_profile(uuid) to authenticated;

notify pgrst, 'reload schema';
