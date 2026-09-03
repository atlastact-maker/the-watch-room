# The Watch Room — Discord server builder

Builds the entire server from `discord-blueprint.md` (roles, categories,
channels, permissions, community settings, rules/check-in copy, onboarding)
in one run, via the Discord API.

## One-time setup (~3 minutes)

1. **Create a bot application**
   - Go to <https://discord.com/developers/applications> → **New Application** → name it `TWR Setup`.
   - Left sidebar → **Bot** → **Reset Token** → copy the token.
     *Treat the token like a password. If it ever leaks, reset it on that same page.*
   - Optional: turn **Public Bot** off (nobody else can invite it).

2. **Invite the bot to The Watch Room** (you must be the server owner/admin).
   Copy your **Application ID** from the **General Information** tab, then open:

   ```
   https://discord.com/oauth2/authorize?client_id=YOUR_APPLICATION_ID&scope=bot&permissions=8
   ```

   Pick **The Watch Room** → Authorise. (`permissions=8` = Administrator —
   needed for roles, permission overwrites and server settings.)

3. **Configure and run**

   ```bash
   cd tools/discord-setup
   copy .env.example .env      # then paste your token into .env
   npm install
   npm run setup:reset
   ```

   `setup:reset` also deletes the hand-made channels from the earlier manual
   attempt (they're empty). Plain `npm run setup` never deletes anything.
   The script is idempotent — re-running it converges the server to the
   blueprint instead of duplicating things.

The script ends with a summary: the permanent invite URL, and the message IDs
in `#verify` that Carl-bot's reaction roles bind to.

## What stays manual (Discord doesn't expose these to bots)

| Step | Where |
|---|---|
| Require 2FA for moderation | Server Settings → Moderation (owner only) |
| Enable Community, if the API attempt failed | Server Settings → Enable Community, then **re-run the script** so it can create the forum + announcement channels |
| Onboarding questions, if the API attempt failed | Server Settings → Onboarding — questions are listed in `discord-blueprint.md`. Note: Discord requires ≥5 channels writable by `@everyone` before it enables onboarding, which conflicts with the verify-gate; it's fine to skip onboarding at launch. |
| Carl-bot ("The Duty Officer") | Invite from <https://carl.gg>, then: nickname it **The Duty Officer**, assign it the *The Duty Officer* role, set the TWR mark as its server avatar. Configure: welcome DM + `#verify` prompt, reaction roles bound to the two message IDs the script printed (✅ → Operator; 🔔/🧪/📅 → ping roles), automod (anti-spam 5 msgs/5s → timeout, invite-link filter everywhere except `#media-clips`, banned words), mod-log → `#incident-log`, and a `/callsign` custom command (random callsign like `OSCAR-42`, reply "OSCAR-42, you are cleared on channel."). |
| Icon & banner | Icon: TWR mark on `#050507`. Server banner requires Boost level 2. |
| Your privacy settings | Disable DMs from server members; advise advisors to do the same. |

When the build is done you can kick the `TWR Setup` bot — it's only needed to
run this script.

## Follow-up scripts (added 2026-08-25)

Run each as `node <script>.mjs ./.env` from this folder. All are idempotent
and read the same `.env` as `setup.mjs`.

| Script | What it does |
|---|---|
| `audit.mjs` | Read-only health check — channels, roles, invites, onboarding, #verify messages, bots, webhooks. Run this first when something looks wrong. |
| `config-welcome-automod.mjs` | Sets the Community welcome screen and creates the native AutoMod rules (invite-link filter exempting `#media-clips`, alerts to `#incident-log`). |
| `roles-panels.mjs` | Creates the self-select roles and the Operator-gated `#roles` channel, posts the service / patch / interests panels and seeds their reactions. Prints the message IDs that Carl-bot's reaction roles bind to. |
| `suggestions-forum.mjs` | Creates the `#suggestions` forum with topic tags, mod-only status tags (Planned / Shipped / Not now) and 👍 as the default reaction. |
| `advisor-tags.mjs` | Creates the five per-service advisor tags (Fire, Ambulance, Police, Control Room, Other) in the site's insignia colours, hoisted and sat above the Advisor role so the member list groups by service. Deliberately NOT self-select — assign by hand on acceptance. |
| `advisor-tags-access.mjs` | Gives every per-service advisor tag the same view of the Advisory Wing that the Advisor role has — copies the Advisor role's allow/deny onto each tag, per wing channel and on the category, by per-overwrite PUT so nothing else on a channel is touched. Run it after `advisor-tags.mjs` and again whenever a wing channel's Advisor permissions change; a member holding only a tag then sees the whole wing. |
| `advisor-wing.mjs` | Builds out the Advisory Wing: `#verify-this`, one room per service (`#fire-rescue`, `#ambulance`, `#police`, `#control-room`, `#other-services`), the `#scenario-sign-off` and `#reference-library` forums, the read-only `#you-said-we-did` log and a locked *Advisor Watch Room* voice channel (`--unlock-voice` / `--lock-voice`). Retags `#sop-review` to the nine topics the advisor application actually asks about, posts and pins the channel prompts, and orders the wing. |

The bot is not left in the server. To re-run anything, re-invite it first:
`https://discord.com/oauth2/authorize?client_id=<APPLICATION_ID>&scope=bot&permissions=8`
(the application ID is the first dot-separated segment of the bot token,
base64-decoded), then kick it again when you're done.
