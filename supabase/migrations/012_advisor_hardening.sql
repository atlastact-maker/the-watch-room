-- Hardening before external advisors are let in. Run once in the SQL
-- editor (after 011).
--
-- Everything up to now assumed every account was the owner's. The advisor
-- programme breaks that assumption: real people outside the project are
-- about to hold a live session, and RLS policies written for a single
-- trusted user become a different thing when the user is a stranger.
--
-- Two holes, both found by auditing the row-level policies rather than
-- the app. Neither grants access to anything — they let an advisor
-- rewrite records ABOUT themselves.

-- 1. A declined applicant could un-decline themselves.
--
-- 002 gave advisors a whole-row UPDATE on their own row:
--   using (auth.uid() = user_id) with check (auth.uid() = user_id)
-- and 010 later added declined_at to that same table. Nothing restricted
-- the columns, so a declined applicant could PATCH declined_at back to
-- null straight through PostgREST with nothing but devtools: their
-- standing flips from Declined to In review, admin_list_advisors shows
-- them as pending again, and the decision quietly vanishes from the
-- console. They could equally decline themselves.
--
-- NOT a column-level revoke. The obvious
--   revoke update (declined_at) on public.advisors from authenticated;
-- is a no-op here, and a dangerous one because it reports success.
-- Postgres checks the table ACL first and only consults per-column ACLs
-- for privileges the table level did not already supply; Supabase's
-- bootstrap grants table-wide UPDATE on public schema tables to
-- authenticated, so there is nothing for a column revoke to subtract and
-- it merely warns. Making column privileges bite would mean revoking the
-- table grant and re-granting every column the questionnaire writes —
-- which silently breaks the moment a column is added.
--
-- A trigger instead: it does not care how PostgREST generates its
-- upsert, and it needs no maintenance when the form gains a field.
create or replace function public.advisors_pin_declined_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- auth.uid() is null when there is no JWT — the SQL editor, a service
  -- role, a migration — so the owner can still fix a row by hand.
  if new.declined_at is distinct from old.declined_at
     and auth.uid() is not null
     and not public.is_admin()
  then
    new.declined_at := old.declined_at;
  end if;
  return new;
end;
$$;

drop trigger if exists advisors_pin_declined_at on public.advisors;
create trigger advisors_pin_declined_at
  before update on public.advisors
  for each row
  execute function public.advisors_pin_declined_at();

-- admin_set_advisor_decline (010) is unaffected: SECURITY DEFINER does
-- not change request.jwt.claims, so is_admin() still sees the admin who
-- called it and the trigger lets the write through.
--
-- To confirm it works, as a declined applicant's own session:
--   update public.advisors set declined_at = null where user_id = auth.uid();
-- reports UPDATE 1 and leaves declined_at exactly as it was.

-- 2. Fabricated career statistics reached the admin dashboard.
--
-- career_stats is written from the browser (src/lib/sim/stats-sync.ts)
-- under an "own row" policy with no value validation, so any authenticated
-- account can POST whatever numbers it likes for itself. That was
-- tolerable while every account was an operator. It is not tolerable now
-- that admin_overview sums those columns into the two figures on the
-- admin dashboard: an advisor who has never taken a shift could move the
-- numbers the owner uses to judge whether the game is being played.
--
-- The sums now count only accounts that can actually take a shift — an
-- admin or operator role in user_roles. An advisor has neither, so their
-- row is ignored however it was written. Identical to 010 in every other
-- respect.
--
-- Residual, deliberately not fixed here: the /stats leaderboard still
-- reads every career_stats row, so a fabricated score could still appear
-- there. /stats is admin-only, so the only person who would see it is the
-- owner. Closing it properly means moving the write behind a SECURITY
-- DEFINER function that rejects callers without shift access and enforces
-- monotonic increments — a change to how the game saves, not to access
-- control, so it does not belong in this migration.
create or replace function public.admin_overview()
returns table (
  total_accounts bigint,
  new_accounts_7d bigint,
  newsletter_opt_ins bigint,
  applications_total bigint,
  applications_pending bigint,
  advisors_accepted bigint,
  operators_granted bigint,
  calls_answered bigint,
  incidents_resolved bigint
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  return query select
    (select count(*) from auth.users),
    (select count(*) from auth.users where created_at > now() - interval '7 days'),
    (select count(*) from auth.users
       where (raw_user_meta_data ->> 'newsletter_opt_in')::boolean is true),
    (select count(*) from public.advisors),
    (select count(*) from public.advisors a
       join auth.users u on u.id = a.user_id
       left join public.user_roles r on lower(r.email) = lower(u.email)
       where r.email is null and a.declined_at is null),
    (select count(*) from public.user_roles where role = 'advisor'),
    (select count(*) from public.user_roles where role = 'operator'),
    (select coalesce(sum(cs.calls_answered), 0)::bigint
       from public.career_stats cs
       join auth.users u on u.id = cs.user_id
       join public.user_roles r on lower(r.email) = lower(u.email)
       where r.role in ('admin', 'operator')),
    (select coalesce(sum(cs.incidents_resolved), 0)::bigint
       from public.career_stats cs
       join auth.users u on u.id = cs.user_id
       join public.user_roles r on lower(r.email) = lower(u.email)
       where r.role in ('admin', 'operator'));
end;
$$;

grant execute on function public.admin_overview() to authenticated;
