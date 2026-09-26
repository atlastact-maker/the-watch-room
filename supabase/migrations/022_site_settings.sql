-- Site settings, and the pre-alpha doors. Run once (after 021).
--
-- One small key/value table for switches an admin flips from /admin
-- without a deploy. The first is the pre-alpha doors: while they are
-- closed, accounts on the tester list stay on their standby page (they
-- can sign up, request access and be accepted, and they see they are
-- in), and the desk opens to them the moment the switch is flipped.
-- Admins and assigned operators are never held by it.

create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text not null default ''
);

alter table public.site_settings enable row level security;

-- Signed-in accounts read the switches; only the function below writes.
drop policy if exists "read site settings" on public.site_settings;
create policy "read site settings"
  on public.site_settings for select
  to authenticated
  using (true);

create or replace function public.admin_set_site_setting(p_key text, p_value text)
returns void
language plpgsql volatile security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  insert into public.site_settings (key, value, updated_at, updated_by)
  values (p_key, coalesce(p_value, ''), now(), coalesce((select email from auth.users where id = auth.uid()), ''))
  on conflict (key) do update
    set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by;
end;
$$;

revoke all on function public.admin_set_site_setting(text, text) from public, anon;
grant execute on function public.admin_set_site_setting(text, text) to authenticated;

-- The doors start closed: sign-ups first, the desk when you say so.
insert into public.site_settings (key, value) values ('prealpha_doors', 'closed')
on conflict (key) do nothing;

notify pgrst, 'reload schema';
