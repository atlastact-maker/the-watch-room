-- Advisor programme — players who've served in the emergency services
-- and volunteered to advise on development. Run once in the Supabase
-- SQL editor (Dashboard → SQL → New query → paste → Run).
--
-- Players can register/update their own advisor profile; review the
-- list yourself in Dashboard → Table editor → advisors.

create table if not exists public.advisors (
  user_id uuid primary key references auth.users (id) on delete cascade,
  callsign text not null default '',
  -- Fire & Rescue / Ambulance / Police / Fire Control · 999 / Other
  service text not null,
  background text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.advisors enable row level security;

drop policy if exists "advisors select own" on public.advisors;
create policy "advisors select own"
  on public.advisors for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "advisors insert own" on public.advisors;
create policy "advisors insert own"
  on public.advisors for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "advisors update own" on public.advisors;
create policy "advisors update own"
  on public.advisors for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
