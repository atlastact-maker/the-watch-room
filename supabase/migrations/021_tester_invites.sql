-- Pre-alpha invitations. Run once (after 020).
--
-- An admin ticks "Invite to pre-alpha" against an account on the Users
-- tab. That mints a token, emails the account a link, and clicking the
-- link while logged in as that account ticks them as a tester (016) and
-- records the invite as accepted. The link is the grant; nothing else to
-- approve.

create table if not exists public.tester_invites (
  token uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  email text not null,
  invited_by text not null default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  accepted_at timestamptz
);

create index if not exists tester_invites_email_idx on public.tester_invites (lower(email));

-- Nobody reads or writes the table directly; the functions below do.
alter table public.tester_invites enable row level security;

-- Mint (or re-use) an invite for an account. Returns the token the link
-- carries. An open, unexpired invite is returned again rather than
-- duplicated, so "re-send" sends the same link.
create or replace function public.admin_invite_tester(p_email text)
returns uuid
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_user uuid;
  v_token uuid;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  select id into v_user from auth.users where lower(email) = v_email limit 1;
  select token into v_token
  from public.tester_invites
  where lower(email) = v_email and accepted_at is null and expires_at > now()
  order by created_at desc
  limit 1;
  if v_token is null then
    insert into public.tester_invites (user_id, email, invited_by)
    values (v_user, v_email, coalesce((select email from auth.users where id = auth.uid()), ''))
    returning token into v_token;
  end if;
  return v_token;
end;
$$;

-- The invites, newest first, for the Users tab.
create or replace function public.admin_list_tester_invites(p_limit int default 500)
returns table (
  token uuid,
  user_id uuid,
  email text,
  invited_by text,
  created_at timestamptz,
  expires_at timestamptz,
  accepted_at timestamptz
)
language sql stable security definer
set search_path = public
as $$
  select i.token, i.user_id, i.email, i.invited_by, i.created_at, i.expires_at, i.accepted_at
  from public.tester_invites i
  where public.is_admin()
  order by i.created_at desc
  limit greatest(1, least(coalesce(p_limit, 500), 1000));
$$;

-- Accept an invite as the logged-in account. The link works for the
-- account it was sent to (by id, or by email address for an account
-- that did not exist when it was sent). Returns 'ok', 'invalid',
-- 'expired' or 'wrong_account'. Accepting twice is 'ok' again.
create or replace function public.accept_tester_invite(p_token uuid)
returns text
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_invite public.tester_invites%rowtype;
  v_email text;
  v_callsign text;
begin
  if auth.uid() is null then
    raise exception 'log in first';
  end if;
  select email, coalesce(raw_user_meta_data ->> 'callsign', '')
    into v_email, v_callsign
  from auth.users where id = auth.uid();
  select * into v_invite from public.tester_invites where token = p_token;
  if v_invite.token is null then
    return 'invalid';
  end if;
  if v_invite.accepted_at is null and v_invite.expires_at < now() then
    return 'expired';
  end if;
  if not (v_invite.user_id = auth.uid() or lower(v_invite.email) = lower(v_email)) then
    return 'wrong_account';
  end if;
  insert into public.testers (email) values (lower(trim(v_email))) on conflict (email) do nothing;
  insert into public.tester_applications (user_id, email, callsign, agreed, status, note, decided_at, updated_at)
  values (auth.uid(), v_email, v_callsign, true, 'accepted', 'Invited', now(), now())
  on conflict (user_id) do update
    set status = 'accepted',
        note = case when public.tester_applications.note = '' then 'Invited' else public.tester_applications.note end,
        decided_at = coalesce(public.tester_applications.decided_at, now()),
        updated_at = now();
  update public.tester_invites
  set accepted_at = coalesce(accepted_at, now()), user_id = coalesce(user_id, auth.uid())
  where token = p_token;
  return 'ok';
end;
$$;

revoke all on function public.admin_invite_tester(text) from public, anon;
revoke all on function public.admin_list_tester_invites(int) from public, anon;
revoke all on function public.accept_tester_invite(uuid) from public, anon;
grant execute on function public.admin_invite_tester(text) to authenticated;
grant execute on function public.admin_list_tester_invites(int) to authenticated;
grant execute on function public.accept_tester_invite(uuid) to authenticated;

notify pgrst, 'reload schema';
