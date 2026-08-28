-- Admin user management. Run once in the SQL editor (after 008).
--
-- Same shape as 007/008: SECURITY DEFINER, is_admin() checked in the
-- database, no service-role key. These functions touch auth.users
-- directly (ban and delete), so they carry extra guards: an admin can
-- never ban or delete another admin, and never themselves.

-- admin_list_users grows columns (user id, ban state), and Postgres will
-- not alter a function's return type in place.
drop function if exists public.admin_list_users(int);

create or replace function public.admin_list_users(p_limit int default 25)
returns table (
  user_id uuid,
  email text,
  callsign text,
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
           u.created_at,
           coalesce((u.raw_user_meta_data ->> 'newsletter_opt_in')::boolean, false),
           exists (select 1 from public.advisors a where a.user_id = u.id),
           r.role,
           coalesce(u.banned_until > now(), false)
    from auth.users u
    left join public.user_roles r on lower(r.email) = lower(u.email)
    order by u.created_at desc
    limit greatest(1, least(p_limit, 200));
end;
$$;

/** True when the target account holds the admin role — used to stop
 *  admins acting on each other through these functions. */
create or replace function public.target_is_admin(p_user_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    join public.user_roles r on lower(r.email) = lower(u.email)
    where u.id = p_user_id and r.role = 'admin'
  );
$$;

create or replace function public.admin_set_ban(p_user_id uuid, p_banned boolean)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'cannot ban yourself';
  end if;
  if public.target_is_admin(p_user_id) then
    raise exception 'cannot ban an admin';
  end if;
  update auth.users
  set banned_until = case when p_banned then now() + interval '100 years' else null end
  where id = p_user_id;
end;
$$;

-- Permanent removal. Cascades take the advisor application, career
-- stats and sessions with it; the user_roles row (keyed by email) is
-- cleaned up explicitly.
create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_email text;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'cannot delete yourself';
  end if;
  if public.target_is_admin(p_user_id) then
    raise exception 'cannot delete an admin';
  end if;
  select u.email::text into v_email from auth.users u where u.id = p_user_id;
  delete from auth.users where id = p_user_id;
  if v_email is not null then
    delete from public.user_roles where lower(email) = lower(v_email);
  end if;
end;
$$;

grant execute on function public.admin_list_users(int) to authenticated;
grant execute on function public.target_is_admin(uuid) to authenticated;
grant execute on function public.admin_set_ban(uuid, boolean) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
