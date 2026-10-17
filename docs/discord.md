# Discord: sign-in, linking and the server's roles

The site can sign people in with Discord, connect an existing account to
its Discord account, show the real Discord handle to admins, and, with a
bot in the server, put a linked account in the server and give it the
tester or advisor role by itself. Each piece is independent; nothing here
is required for the site to run.

## 1. Sign in with Discord, and Connect Discord in Settings

Supabase does the OAuth. Once the provider is on, the buttons appear on
the sign-in page, the registration page and in Settings on their own —
the site reads the project's public auth settings (five-minute cache).
`NEXT_PUBLIC_AUTH_DISCORD=1` forces the buttons on and `0` off; leave it
empty to follow the project.

1. **Discord Developer Portal** → New Application → *OAuth2*. Add the
   redirect `https://ktsvdvqdmltedveflsud.supabase.co/auth/v1/callback`.
   Copy the Client ID and a Client Secret.
2. **Supabase dashboard** → Authentication → Sign In / Providers →
   Discord: enable it and paste the Client ID and Secret.
3. **Supabase dashboard** → Authentication → URL Configuration: the Site
   URL is `https://thewtchroom.co.uk` and the redirect allow list carries
   `https://thewtchroom.co.uk/auth/confirm (the www host redirects to the bare domain, so no second entry is needed)` (and the Vercel preview
   pattern if previews should work).
4. For **Connect Discord** on an existing account, also turn on
   Authentication → Sign In / Providers → *Allow manual linking*. Without
   it the button returns to Settings with the reason "connecting an
   existing account is not switched on".

What happens on the way back (`/auth/confirm`): the Discord user id,
username, display name and avatar are copied onto the account's metadata
(`discord_id`, `discord_username`, `discord_display`, `discord_avatar`),
the programme handle (`advisor_discord`) is set to the real username
unless one was typed by hand, and an account with no callsign yet is
given the username as one. Settings shows the linked account, and
Disconnect removes it (refused while Discord is the only way in; set a
password first via Forgotten password).

Same email, two accounts: Supabase links a Discord sign-in to an existing
account with the same verified email address automatically, so a tester
who registered by email and later presses Continue with Discord lands in
the same account.

## 2. Admins see the real handle

Run `supabase/migrations/027_discord_identity.sql` in the SQL editor,
then `notify pgrst, 'reload schema';`. The Accounts list, the advisor
list and the profile page then read the handle from the linked Discord
identity when there is one, mark it ✓, and carry the Discord id.

## 3. The bot: roles without the admin's hands

1. In the same Discord application → *Bot*: add a bot and copy its token.
   Under *Installation* / OAuth2 URL generator, invite the bot to the
   server with the `bot` scope and the **Manage Roles** and **Create
   Invite** permissions.
2. In the server, drag the bot's own role **above** the tester and
   advisor roles, or it cannot assign them.
3. Set on the host (Vercel → Settings → Environment Variables):

   | Variable | Value |
   |---|---|
   | `DISCORD_BOT_TOKEN` | the bot token |
   | `DISCORD_GUILD_ID` | the server id (Developer Mode → right-click the server → Copy ID) |
   | `DISCORD_TESTER_ROLE_ID` | the tester role id |
   | `DISCORD_ADVISOR_ROLE_ID` | the advisor role id (optional) |

With those set, the sign-in asks Discord for `guilds.join` as well, and:

- an account that links Discord (or signs in with it) and is on the
  Pre-Alpha list gets the tester role; an accepted advisor gets the
  advisor role; an account not yet in the server is put in it on the way;
- an account accepted later gets its role the next time it opens the
  standby page or the briefing;
- the Accounts tab in Admin shows the bot's status and a *Grant Discord
  role* button per linked account.

Failures are logged on the server and never shown as errors to the
person; the manual "Discord granted" tick on the Roles tab remains.
