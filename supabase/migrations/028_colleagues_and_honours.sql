-- Colleagues, public profiles and honours. Run once (after 027) in the
-- Supabase SQL editor, then
--   notify pgrst, 'reload schema';
--
-- Three things for the operators themselves rather than for the admin:
--
--   · a profile per operator, open to every signed-in account
--     (operator_profile): callsign, standing, service record and honours,
--     never the email. An operator can keep the record to colleagues or
--     to themselves (profile_visibility in the account's own metadata:
--     open, colleagues, private).
--   · colleagues: one row per pair, asked by one and answered by the
--     other (colleagues, colleague_request / colleague_respond /
--     colleague_remove, my_colleagues, search_operators). Nobody writes
--     the table from the client; the functions do, as the caller, after
--     checking what the caller may do.
--   · honours granted by hand (user_awards, admin_grant_award /
--     admin_revoke_award). The automatic honours — long service, the
--     operational record and the rest — are worked out in the app from
--     the figures operator_profile returns, so they need no table.

-- ---- colleagues ---------------------------------------------------------

create table if not exists public.colleagues (
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- One row per pair, whichever of the two asked.
create unique index if not exists colleagues_pair_idx
  on public.colleagues (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists colleagues_addressee_idx
  on public.colleagues (addressee_id, status);

alter table public.colleagues enable row level security;

drop policy if exists "own colleague rows" on public.colleagues;
create policy "own colleague rows"
  on public.colleagues for select
  to authenticated
  using (auth.uid() in (requester_id, addressee_id));
-- No insert, update or delete policies on purpose.

-- ---- honours granted by hand --------------------------------------------

create table if not exists public.user_awards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  award_key text not null check (award_key ~ '^[a-z_]{2,40}$'),
  citation text not null default '' check (char_length(citation) <= 280),
  granted_by text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists user_awards_user_idx
  on public.user_awards (user_id, created_at);

alter table public.user_awards enable row level security;

-- Honours are worn in public; the citation is part of the honour.
drop policy if exists "honours are public" on public.user_awards;
create policy "honours are public"
  on public.user_awards for select
  to authenticated
  using (true);

-- ---- helpers: the few facts about another account the site shows -------

-- The callsign another operator sees: the one on the account, else the
-- one the service record was last synced with, else OPERATOR.
create or replace function public.operator_callsign(p_user_id uuid)
returns text
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'callsign'), ''),
    nullif(btrim(cs.callsign), ''),
    'OPERATOR'
  )
  from auth.users u
  left join public.career_stats cs on cs.user_id = u.id
  where u.id = p_user_id;
$$;
revoke all on function public.operator_callsign(uuid) from public, anon, authenticated;

-- open (the default): anyone signed in sees the record. colleagues: the
-- record is for colleagues; others see the name, the standing and the
-- honours. private: as colleagues, and no requests either.
create or replace function public.operator_visibility(p_user_id uuid)
returns text
language sql stable security definer
set search_path = public
as $$
  select case
    when u.raw_user_meta_data ->> 'profile_visibility' in ('open', 'colleagues', 'private')
      then u.raw_user_meta_data ->> 'profile_visibility'
    else 'open' end
  from auth.users u
  where u.id = p_user_id;
$$;
revoke all on function public.operator_visibility(uuid) from public, anon, authenticated;

-- Where two accounts stand: self, none, colleague, requested (p_me asked
-- and waits), pending (p_other asked p_me), declined (p_me turned p_other
-- down). A refusal is not announced: the one refused still sees
-- "requested".
create or replace function public.colleague_relation(p_me uuid, p_other uuid)
returns text
language sql stable security definer
set search_path = public
as $$
  select case
    when p_me = p_other then 'self'
    when c.status = 'accepted' then 'colleague'
    when c.status = 'pending' and c.requester_id = p_me then 'requested'
    when c.status = 'pending' then 'pending'
    when c.status = 'declined' and c.requester_id = p_me then 'requested'
    when c.status = 'declined' then 'declined'
    else 'none' end
  from (select 1) one
  left join public.colleagues c
    on least(c.requester_id, c.addressee_id) = least(p_me, p_other)
   and greatest(c.requester_id, c.addressee_id) = greatest(p_me, p_other);
$$;
revoke all on function public.colleague_relation(uuid, uuid) from public, anon, authenticated;

-- ---- the colleague functions ---------------------------------------------

-- Ask someone to be a colleague. Returns the standing afterwards:
-- requested, or colleague when they had already asked (asking back is
-- agreeing) or the two already were.
create or replace function public.colleague_request(p_user_id uuid)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_row public.colleagues%rowtype;
begin
  if v_me is null then
    raise exception 'sign in first';
  end if;
  if p_user_id is null or p_user_id = v_me then
    raise exception 'not a colleague';
  end if;
  if not exists (select 1 from auth.users u where u.id = p_user_id and u.email_confirmed_at is not null) then
    raise exception 'no such account';
  end if;
  select * into v_row
  from public.colleagues c
  where least(c.requester_id, c.addressee_id) = least(v_me, p_user_id)
    and greatest(c.requester_id, c.addressee_id) = greatest(v_me, p_user_id);
  if found then
    if v_row.status = 'accepted' then
      return 'colleague';
    end if;
    if v_row.requester_id = v_me then
      return 'requested';
    end if;
    -- They asked first, or were turned down before: asking back is agreeing.
    update public.colleagues
       set status = 'accepted', responded_at = now()
     where requester_id = v_row.requester_id and addressee_id = v_row.addressee_id;
    return 'colleague';
  end if;
  if public.operator_visibility(p_user_id) = 'private' then
    raise exception 'not accepting requests';
  end if;
  if (select count(*) from public.colleagues c where c.requester_id = v_me and c.status = 'pending') >= 50 then
    raise exception 'too many open requests';
  end if;
  insert into public.colleagues (requester_id, addressee_id) values (v_me, p_user_id);
  return 'requested';
end;
$$;
revoke all on function public.colleague_request(uuid) from public, anon;
grant execute on function public.colleague_request(uuid) to authenticated;

-- Answer a request made to the caller. True when there was one to answer.
create or replace function public.colleague_respond(p_user_id uuid, p_accept boolean)
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'sign in first';
  end if;
  update public.colleagues
     set status = case when p_accept then 'accepted' else 'declined' end,
         responded_at = now()
   where requester_id = p_user_id and addressee_id = v_me and status = 'pending';
  return found;
end;
$$;
revoke all on function public.colleague_respond(uuid, boolean) from public, anon;
grant execute on function public.colleague_respond(uuid, boolean) to authenticated;

-- Part company, or take back a request. Either side may.
create or replace function public.colleague_remove(p_user_id uuid)
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'sign in first';
  end if;
  delete from public.colleagues c
   where least(c.requester_id, c.addressee_id) = least(v_me, p_user_id)
     and greatest(c.requester_id, c.addressee_id) = greatest(v_me, p_user_id);
  return found;
end;
$$;
revoke all on function public.colleague_remove(uuid) from public, anon;
grant execute on function public.colleague_remove(uuid) to authenticated;

-- The caller's colleagues, the requests waiting for them (pending) and
-- the ones they have made (requested). A request someone declined stays
-- "requested" for the one who made it.
create or replace function public.my_colleagues()
returns table (
  user_id uuid,
  callsign text,
  relation text,
  since timestamptz,
  insignia public.insignia_key,
  assigned_role public.access_role,
  score int,
  incidents_resolved int,
  last_active timestamptz
)
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'sign in first';
  end if;
  return query
    select x.other_id, x.other_callsign, x.standing, x.since_at, x.icon, x.role, x.points, x.resolved, x.active_at
    from (
      select o.id as other_id,
             public.operator_callsign(o.id) as other_callsign,
             case when c.status = 'accepted' then 'colleague'
                  when c.requester_id = v_me then 'requested'
                  else 'pending' end as standing,
             coalesce(c.responded_at, c.created_at) as since_at,
             r.icon as icon,
             r.role as role,
             coalesce(cs.score, 0) as points,
             coalesce(cs.incidents_resolved, 0) as resolved,
             cs.updated_at as active_at,
             c.status as status
      from public.colleagues c
      join auth.users o on o.id = case when c.requester_id = v_me then c.addressee_id else c.requester_id end
      left join public.user_roles r on lower(r.email) = lower(o.email)
      left join public.career_stats cs on cs.user_id = o.id
      where v_me in (c.requester_id, c.addressee_id)
        and (c.status in ('pending', 'accepted') or c.requester_id = v_me)
    ) x
    order by case x.status when 'pending' then 0 else 1 end, x.other_callsign;
end;
$$;
revoke all on function public.my_colleagues() from public, anon;
grant execute on function public.my_colleagues() to authenticated;

-- Find operators by callsign; with nothing typed, the operators most
-- recently on shift. Private profiles are not listed; the caller is not.
create or replace function public.search_operators(p_query text default null, p_limit int default 24)
returns table (
  user_id uuid,
  callsign text,
  relation text,
  insignia public.insignia_key,
  assigned_role public.access_role,
  tester boolean,
  score int,
  incidents_resolved int,
  last_active timestamptz
)
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_q text := nullif(lower(btrim(coalesce(p_query, ''))), '');
begin
  if v_me is null then
    raise exception 'sign in first';
  end if;
  return query
    select x.other_id, x.other_callsign, public.colleague_relation(v_me, x.other_id), x.icon, x.role, x.is_tester, x.points, x.resolved, x.active_at
    from (
      select u.id as other_id,
             public.operator_callsign(u.id) as other_callsign,
             r.icon as icon,
             r.role as role,
             exists (select 1 from public.testers t where lower(t.email) = lower(u.email)) as is_tester,
             coalesce(cs.score, 0) as points,
             coalesce(cs.incidents_resolved, 0) as resolved,
             cs.updated_at as active_at,
             u.created_at as made_at
      from auth.users u
      left join public.user_roles r on lower(r.email) = lower(u.email)
      left join public.career_stats cs on cs.user_id = u.id
      where u.id <> v_me
        and u.email_confirmed_at is not null
        and (u.banned_until is null or u.banned_until < now())
        and public.operator_visibility(u.id) <> 'private'
        and (v_q is not null or cs.user_id is not null)
    ) x
    where v_q is null or lower(x.other_callsign) like '%' || v_q || '%'
    order by x.active_at desc nulls last, x.made_at desc
    limit greatest(1, least(coalesce(p_limit, 24), 60));
end;
$$;
revoke all on function public.search_operators(text, int) from public, anon;
grant execute on function public.search_operators(text, int) to authenticated;

-- ---- the profile ------------------------------------------------------------

-- One operator as another signed-in account may see them. The service
-- record (stats, rank) comes only when the profile is open to the caller;
-- the figures the honours are read from (facts) always do, since honours
-- are worn in public. Never the email.
create or replace function public.operator_profile(p_user_id uuid)
returns table (
  user_id uuid,
  callsign text,
  joined_at timestamptz,
  assigned_role public.access_role,
  insignia public.insignia_key,
  advisor_service text,
  advisor boolean,
  tester boolean,
  visibility text,
  relation text,
  visible boolean,
  stats jsonb,
  rank bigint,
  players bigint,
  colleagues bigint,
  awards jsonb,
  discord text,
  facts jsonb
)
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_vis text;
  v_rel text;
  v_admin boolean;
  v_visible boolean;
begin
  if v_me is null then
    raise exception 'sign in first';
  end if;
  v_vis := public.operator_visibility(p_user_id);
  v_rel := public.colleague_relation(v_me, p_user_id);
  v_admin := public.is_admin();
  v_visible := v_rel = 'self' or v_admin or v_vis = 'open' or (v_vis = 'colleagues' and v_rel = 'colleague');
  return query
    select u.id,
           public.operator_callsign(u.id),
           u.created_at,
           r.role,
           r.icon,
           a.service,
           (a.user_id is not null and r.role in ('advisor', 'admin')),
           exists (select 1 from public.testers t where lower(t.email) = lower(u.email)),
           v_vis,
           v_rel,
           v_visible,
           case when v_visible and cs.user_id is not null then to_jsonb(cs) - 'user_id' - 'callsign' end,
           case when v_visible and cs.user_id is not null
                then (select count(*) + 1 from public.career_stats x where x.score > cs.score) end,
           (select count(*) from public.career_stats),
           (select count(*) from public.colleagues c where c.status = 'accepted' and u.id in (c.requester_id, c.addressee_id)),
           coalesce((
             select jsonb_agg(jsonb_build_object('id', w.id, 'key', w.award_key, 'citation', w.citation, 'granted_at', w.created_at) order by w.created_at)
             from public.user_awards w where w.user_id = u.id
           ), '[]'::jsonb),
           case when v_rel in ('self', 'colleague') or v_admin
                then coalesce(nullif(btrim(u.raw_user_meta_data ->> 'discord_username'), ''), nullif(btrim(u.raw_user_meta_data ->> 'advisor_discord'), ''))
                end,
           jsonb_build_object(
             'incidents', coalesce(cs.incidents_resolved, 0),
             'calls', coalesce(cs.calls_answered, 0),
             'conveyed', coalesce(cs.casualties_saved, 0),
             'grade_a', coalesce((cs.grades ->> 'A')::int, 0),
             'graded', (select coalesce(sum(e.value::int), 0) from jsonb_each_text(coalesce(cs.grades, '{}'::jsonb)) e),
             'mean_first_alloc', case when coalesce(cs.first_alloc_count, 0) > 0 then cs.first_alloc_sum_sec / cs.first_alloc_count end,
             'targets_met', coalesce(cs.targets_met, 0),
             'targets_total', coalesce(cs.targets_total, 0),
             'types', (select count(*) from jsonb_object_keys(coalesce(cs.by_type, '{}'::jsonb))),
             'bug_reports', (select count(*) from public.bug_reports b where b.user_id = u.id),
             'last_active', cs.updated_at
           )
    from auth.users u
    left join public.user_roles r on lower(r.email) = lower(u.email)
    left join public.advisors a on a.user_id = u.id
    left join public.career_stats cs on cs.user_id = u.id
    where u.id = p_user_id
      and (v_rel = 'self' or v_admin or u.banned_until is null or u.banned_until < now());
end;
$$;
revoke all on function public.operator_profile(uuid) from public, anon;
grant execute on function public.operator_profile(uuid) to authenticated;

-- ---- honours, from the admin console -----------------------------------------

create or replace function public.admin_grant_award(p_user_id uuid, p_award_key text, p_citation text default '')
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  insert into public.user_awards (user_id, award_key, citation, granted_by)
  values (p_user_id, lower(btrim(p_award_key)), left(btrim(coalesce(p_citation, '')), 280), coalesce(auth.jwt() ->> 'email', ''))
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.admin_grant_award(uuid, text, text) from public, anon;
grant execute on function public.admin_grant_award(uuid, text, text) to authenticated;

create or replace function public.admin_revoke_award(p_id uuid)
returns boolean
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  delete from public.user_awards where id = p_id;
  return found;
end;
$$;
revoke all on function public.admin_revoke_award(uuid) from public, anon;
grant execute on function public.admin_revoke_award(uuid) to authenticated;

-- PostgREST picks the new functions up on the next request.
notify pgrst, 'reload schema';
