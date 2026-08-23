-- Career statistics, synced per account. Run once in the Supabase SQL
-- editor (Dashboard → SQL → New query → paste → Run).
--
-- Every operator gets one row. All signed-in players can READ every row
-- (that's the leaderboard — callsigns and game stats only, no emails);
-- players can only write their own row.

create table if not exists public.career_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  callsign text not null default 'OPERATOR',
  -- Command points: A=5 B=4 C=3 D=2 F=1 per resolved incident.
  score int not null default 0,
  calls_answered int not null default 0,
  incidents_resolved int not null default 0,
  grades jsonb not null default '{}'::jsonb,
  resources_allocated int not null default 0,
  first_alloc_sum_sec double precision not null default 0,
  first_alloc_count int not null default 0,
  targets_met int not null default 0,
  targets_total int not null default 0,
  casualties_saved int not null default 0,
  casualties_lost int not null default 0,
  by_type jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.career_stats enable row level security;

drop policy if exists "leaderboard read" on public.career_stats;
create policy "leaderboard read"
  on public.career_stats for select
  to authenticated
  using (true);

drop policy if exists "insert own stats" on public.career_stats;
create policy "insert own stats"
  on public.career_stats for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "update own stats" on public.career_stats;
create policy "update own stats"
  on public.career_stats for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists career_stats_score_idx
  on public.career_stats (score desc);
