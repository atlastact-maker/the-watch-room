-- Access roles — who can start a shift while the site is in closed
-- development. Run once in the Supabase SQL editor (Dashboard → SQL →
-- New query → paste → Run).
--
-- Assigning a role is then two clicks, no redeploy:
--   Dashboard → Table editor → user_roles → Insert row
--     email: the person's sign-in email
--     role:  operator   (admin for yourself; both open the shift)
-- Delete the row to revoke. Keyed by email so a tester can be
-- pre-authorised before they have signed up.
--
-- This complements OPERATOR_ALLOWLIST (and the hardwired developer
-- default) rather than replacing them — the env path still works even
-- if this table is missing, so access can never be fully locked out by
-- a database problem.

create table if not exists public.user_roles (
  email text primary key,
  role text not null check (role in ('admin', 'operator')),
  -- Free note to yourself: who this is, why they have access.
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

-- Signed-in users may read their own row (the server gate checks it with
-- the user's own session, so RLS applies). Nobody can write from the
-- client at all — rows are created by you in the dashboard.
drop policy if exists "read own role" on public.user_roles;
create policy "read own role"
  on public.user_roles for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
