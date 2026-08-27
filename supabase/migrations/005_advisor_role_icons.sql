-- Advisor as an assignable role, and profile icons. Run once in the
-- Supabase SQL editor (after 004_user_roles.sql).
--
-- The signup tick box means APPLIED (a row in public.advisors, written
-- by the applicant). Assigning role 'advisor' here means ACCEPTED onto
-- the programme — your call, made in the Table editor. Advisors do not
-- get shift access; flip an individual's role to 'operator' when you
-- want them playtesting.
--
-- icon: shown on their standby badge and beside the callsign in the
-- menu strip. Type an emoji straight into the column — 🚒 ⭐ 🩺 — or
-- leave it empty for none.

alter table public.user_roles
  drop constraint if exists user_roles_role_check;

alter table public.user_roles
  add constraint user_roles_role_check
  check (role in ('admin', 'operator', 'advisor'));

alter table public.user_roles
  add column if not exists icon text not null default '';
