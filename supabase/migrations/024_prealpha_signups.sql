-- Pre-alpha sign-ups switch. Run once (after 022).
--
-- The admin page can close sign-ups for the pre-alpha ahead of the
-- calendar (or reopen them after it): the key is prealpha_signups in
-- site_settings, 'closed', 'open', or empty for the calendar. Signed-in
-- pages read site_settings already (022); the front door and the
-- sign-up page are seen logged out, so this one key is readable
-- without an account. Nothing else in the table is.

drop policy if exists "read prealpha signups switch" on public.site_settings;
create policy "read prealpha signups switch"
  on public.site_settings for select
  to anon
  using (key = 'prealpha_signups');

notify pgrst, 'reload schema';
