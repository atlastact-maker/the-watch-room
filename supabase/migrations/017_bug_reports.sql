-- Bug reports from inside the game. Run once (after 016).
--
-- A tester hits "Report a problem" on the desk, or the feedback form on
-- the ops centre, and the report lands here with the context the desk
-- knew at the time: the scenario, the incident reference, which screen
-- was up, the version, the browser, and the tail of the incident log.
-- Nothing goes out by email any more.
--
-- The reporter may insert their own row and read it back; nobody edits
-- from the client. Triage — status and a note — is admin-only, through
-- the SECURITY DEFINER functions below, like the rest of the console.

create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null default '',
  callsign text not null default '',
  category text not null default 'broken'
    check (category in ('broken', 'realism', 'suggestion', 'accessibility')),
  severity text not null default 'minor'
    check (severity in ('blocker', 'major', 'minor')),
  summary text not null check (char_length(summary) between 1 and 140),
  detail text not null check (char_length(detail) between 1 and 4000),
  -- What the desk knew: scenario, incidentRef, screen, page, version,
  -- viewport, userAgent, logTail.
  context jsonb not null default '{}'::jsonb,
  status text not null default 'open'
    check (status in ('open', 'looking', 'fixed', 'closed')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bug_reports_status_idx
  on public.bug_reports (status, created_at desc);

alter table public.bug_reports enable row level security;

drop policy if exists "file own bug report" on public.bug_reports;
create policy "file own bug report"
  on public.bug_reports for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "read own bug reports" on public.bug_reports;
create policy "read own bug reports"
  on public.bug_reports for select
  to authenticated
  using (user_id = auth.uid());

-- Every report, newest first, for the admin console.
create or replace function public.admin_list_bug_reports(p_limit int default 200)
returns table (
  id uuid,
  user_id uuid,
  email text,
  callsign text,
  category text,
  severity text,
  summary text,
  detail text,
  context jsonb,
  status text,
  admin_note text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  return query
    select b.id, b.user_id, b.email, b.callsign, b.category, b.severity,
           b.summary, b.detail, b.context, b.status, b.admin_note,
           b.created_at, b.updated_at
    from public.bug_reports b
    order by
      case b.status when 'open' then 0 when 'looking' then 1 when 'fixed' then 2 else 3 end,
      b.created_at desc
    limit greatest(1, least(p_limit, 2000));
end;
$$;

-- Triage: set the status and the note in one go. A null note leaves the
-- note as it was.
create or replace function public.admin_set_bug_report(
  p_id uuid,
  p_status text,
  p_note text default null
)
returns void
language plpgsql volatile security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if p_status not in ('open', 'looking', 'fixed', 'closed') then
    raise exception 'bad status';
  end if;
  update public.bug_reports
     set status = p_status,
         admin_note = coalesce(p_note, admin_note),
         updated_at = now()
   where id = p_id;
end;
$$;

grant execute on function public.admin_list_bug_reports(int) to authenticated;
grant execute on function public.admin_set_bug_report(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
