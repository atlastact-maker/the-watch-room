-- Discord handle on the registered-users list. Run once (after 012).
--
-- The handle was already on the advisor application card, but that only
-- helps for somebody who applied and only while you are looking at their
-- application. The users list is where roles are granted and bans are
-- handed out, and matching a row there to a person in the Discord server
-- meant scrolling back up to the applications section to find them.
--
-- Read from the advisors row, falling back to the account's own metadata.
-- Both are written in the same save (advisorMetadata and advisorRow in
-- src/lib/auth/actions.ts), but they are two writes and the advisors
-- upsert can fail on its own — which is exactly what the AdvisorSync
-- repair on /standby exists to patch up. So when the two disagree, the
-- metadata is the one that is more likely to be there.
--
-- Empty string for an account that never filed an application: a Discord
-- handle is only ever collected on the advisor questionnaire, so most
-- registered users will not have one.
--
-- The return type changes, and Postgres will not alter a function's
-- return type in place — hence the drop, exactly as 009 had to do.

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
  banned boolean
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
           -- nullif so a row saved with an empty handle falls through to
           -- the other source rather than winning with a blank.
           coalesce(
             nullif(btrim(a.discord), ''),
             nullif(btrim(u.raw_user_meta_data ->> 'advisor_discord'), ''),
             ''
           )::text,
           u.created_at,
           coalesce((u.raw_user_meta_data ->> 'newsletter_opt_in')::boolean, false),
           exists (select 1 from public.advisors ax where ax.user_id = u.id),
           r.role,
           coalesce(u.banned_until > now(), false)
    from auth.users u
    left join public.user_roles r on lower(r.email) = lower(u.email)
    left join public.advisors a on a.user_id = u.id
    order by u.created_at desc
    limit greatest(1, least(p_limit, 200));
end;
$$;

grant execute on function public.admin_list_users(int) to authenticated;
