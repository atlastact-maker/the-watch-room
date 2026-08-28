-- Admin area plumbing. Run once in the Supabase SQL editor (after 006).
--
-- RLS deliberately lets each user read only their own advisors and
-- user_roles rows, so the in-game admin area works through
-- SECURITY DEFINER functions instead: each one checks the caller holds
-- the admin role before returning anything, and the checks live in the
-- database where the client cannot reach around them. No service-role
-- key is involved anywhere.

-- Bootstrap: the developer's own admin row, so the admin area works the
-- moment this migration runs. (The email is already public in the repo's
-- commit history, so nothing is disclosed here.)
insert into public.user_roles (email, role, note)
values ('atlastact@gmail.com', 'admin', 'developer')
on conflict (email) do update set role = 'admin';

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and role = 'admin'
  );
$$;

-- Every advisor application, joined to the account email (needed to
-- assign a role, since user_roles is keyed by email) and any role
-- already assigned.
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
           r.role,
           r.icon
    from public.advisors a
    join auth.users u on u.id = a.user_id
    left join public.user_roles r on lower(r.email) = lower(u.email)
    order by a.created_at desc;
end;
$$;

create or replace function public.admin_list_roles()
returns setof public.user_roles
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  return query select * from public.user_roles order by created_at desc;
end;
$$;

create or replace function public.admin_upsert_role(
  p_email text,
  p_role public.access_role,
  p_icon public.insignia_key default null,
  p_note text default null
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  insert into public.user_roles (email, role, icon, note)
  values (lower(trim(p_email)), p_role, p_icon, coalesce(p_note, ''))
  on conflict (email) do update
    set role = excluded.role,
        icon = excluded.icon,
        note = coalesce(nullif(excluded.note, ''), user_roles.note);
end;
$$;

create or replace function public.admin_delete_role(p_email text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  delete from public.user_roles where lower(email) = lower(trim(p_email));
end;
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_list_advisors() to authenticated;
grant execute on function public.admin_list_roles() to authenticated;
grant execute on function public.admin_upsert_role(text, public.access_role, public.insignia_key, text) to authenticated;
grant execute on function public.admin_delete_role(text) to authenticated;
