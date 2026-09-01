-- Stop an applicant editing their own review decision. Run once in the
-- Supabase SQL editor (after 010).
--
-- The RLS policy on public.advisors is row level: "you may update your
-- own row". Postgres row policies say nothing about columns, so it also
-- let an applicant write declined_at — the column that records the
-- decision. With their own session and the public anon key, someone
-- turned down could clear it from a browser and put themselves back in
-- the pending queue as IN REVIEW.
--
-- Not an escalation: roles live in user_roles, which has no write policy
-- at all, so this could never have granted anyone advisor. It is an
-- integrity hole rather than a privilege one.
--
-- Column-level grants are the fix. A table-level UPDATE grant covers
-- every column and cannot be narrowed by revoking one, so the grant is
-- dropped and re-issued per column. declined_at is simply not in the
-- list; only admin_set_advisor_decline (SECURITY DEFINER, is_admin
-- guarded) writes it.

revoke update on public.advisors from authenticated;

grant update (
  -- user_id is in the list because the app upserts the whole row, and
  -- PostgREST puts every supplied column in the ON CONFLICT DO UPDATE
  -- set — including the key. Leaving it out fails a Settings save with
  -- "permission denied for column user_id". It is safe: the row policy's
  -- WITH CHECK still pins user_id to auth.uid(), so it cannot be pointed
  -- at somebody else's account.
  user_id,
  callsign,
  service,
  status,
  background,
  force_area,
  topics,
  involvement,
  contact_ok,
  discord,
  notes,
  updated_at
) on public.advisors to authenticated;

-- Insert is unchanged: a new application has no decision on it yet, and
-- the row policy already pins user_id to the caller.
