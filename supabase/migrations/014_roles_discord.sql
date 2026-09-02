-- Discord handle on the access-roles table. Run once (after 013).
--
-- 013 put the handle on the registered-users list. The access-roles
-- table is the other place it is wanted, and arguably the more useful of
-- the two: it is the list of people who have actually been granted
-- something, so it is the one you read when working out who in the
-- Discord server holds what on the site.
--
-- admin_list_roles returned `setof public.user_roles`, which cannot carry
-- a column the table does not have. It becomes an explicit return type
-- instead — and because that changes the function's return type, it has
-- to be dropped first, exactly as 009 and 013 had to do.
--
-- user_roles is keyed by email rather than user id, so the handle is
-- reached the long way round: role email -> auth.users -> advisors.
-- A role row whose email has never signed up simply gets an empty
-- string, as does anyone who never filed an advisor application.

drop function if exists public.admin_list_roles();

create or replace function public.admin_list_roles()
returns table (
  email text,
  role public.access_role,
  icon public.insignia_key,
  note text,
  created_at timestamptz,
  discord text
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  return query
    select ur.email,
           ur.role,
           ur.icon,
           ur.note,
           ur.created_at,
           -- Same source and same precedence as 013, so the two lists can
           -- never disagree about somebody's handle: the advisors row
           -- first, then the account metadata it is written alongside.
           coalesce(
             nullif(btrim(a.discord), ''),
             nullif(btrim(u.raw_user_meta_data ->> 'advisor_discord'), ''),
             ''
           )::text
    from public.user_roles ur
    left join auth.users u on lower(u.email) = lower(ur.email)
    left join public.advisors a on a.user_id = u.id
    order by ur.created_at desc;
end;
$$;

grant execute on function public.admin_list_roles() to authenticated;
