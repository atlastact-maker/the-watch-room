-- Which scenarios the pre-alpha testers can be given. Run once (after 017).
--
-- One tick per scenario on /admin. The desk only draws a tester's calls
-- from the ticked set — the call stack, the test call and the Scenarios
-- menu all read it — so a wave of jobs can be opened or closed without a
-- deploy. Admins see every scenario regardless. Seeded with wave one:
-- three fire, three ambulance, three police.

create table if not exists public.released_scenarios (
  scenario_id text primary key,
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.released_scenarios enable row level security;

-- Any signed-in account may read the list — the desk needs it to know
-- what to offer — and nobody writes from the client.
drop policy if exists "read released scenarios" on public.released_scenarios;
create policy "read released scenarios"
  on public.released_scenarios for select
  to authenticated
  using (true);

create or replace function public.admin_set_scenario_released(
  p_scenario_id text,
  p_released boolean
)
returns void
language plpgsql volatile security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if coalesce(p_released, false) then
    insert into public.released_scenarios (scenario_id)
    values (trim(p_scenario_id))
    on conflict (scenario_id) do nothing;
  else
    delete from public.released_scenarios where scenario_id = trim(p_scenario_id);
  end if;
end;
$$;

grant execute on function public.admin_set_scenario_released(text, boolean) to authenticated;

-- Wave one.
insert into public.released_scenarios (scenario_id, note) values
  ('02', 'wave 1 · fire'),
  ('03', 'wave 1 · fire'),
  ('23', 'wave 1 · fire'),
  ('12', 'wave 1 · ambulance'),
  ('34', 'wave 1 · ambulance'),
  ('32', 'wave 1 · ambulance'),
  ('39', 'wave 1 · police'),
  ('42', 'wave 1 · police'),
  ('47', 'wave 1 · police')
on conflict (scenario_id) do nothing;

notify pgrst, 'reload schema';
