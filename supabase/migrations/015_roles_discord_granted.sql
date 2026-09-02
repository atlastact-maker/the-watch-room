-- A tick against each access role: has this person been given the
-- Discord permission yet? Run once (after 014).
--
-- Granting the site role and granting the Discord role are two separate
-- acts in two separate places, done by hand, often days apart. Nothing
-- recorded whether the second had happened, so the only way to know was
-- to open Discord and look. This is that record: one tick per row, set
-- from the access-roles table on /admin.
--
-- On user_roles rather than advisors, because it is about the ROLE that
-- was granted, not the application — an operator granted by email who
-- never applied still needs the Discord side sorting.

alter table public.user_roles
  add column if not exists discord_granted boolean not null default false;

-- Set or clear the tick. Idempotent; admin-only in the database, like
-- everything else on the console.
create or replace function public.admin_set_discord_granted(
  p_email text,
  p_granted boolean
)
returns void
language plpgsql volatile security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  update public.user_roles
     set discord_granted = coalesce(p_granted, false)
   where lower(email) = lower(trim(p_email));
end;
$$;

grant execute on function public.admin_set_discord_granted(text, boolean) to authenticated;

-- admin_list_roles gains the column. Return type changes, so drop first —
-- as 014 had to. Body otherwise identical to 014. And remember the PostgREST
-- schema cache after running this:  notify pgrst, 'reload schema';
drop function if exists public.admin_list_roles();

create or replace function public.admin_list_roles()
returns table (
  email text,
  role public.access_role,
  icon public.insignia_key,
  note text,
  created_at timestamptz,
  discord text,
  discord_granted boolean
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
           coalesce(
             nullif(btrim(a.discord), ''),
             nullif(btrim(u.raw_user_meta_data ->> 'advisor_discord'), ''),
             ''
           )::text,
           ur.discord_granted
    from public.user_roles ur
    left join auth.users u on lower(u.email) = lower(ur.email)
    left join public.advisors a on a.user_id = u.id
    order by ur.created_at desc;
end;
$$;

grant execute on function public.admin_list_roles() to authenticated;

-- Reload PostgREST's schema cache so the new column reaches the app.
notify pgrst, 'reload schema';
