// The Watch Room — Discord server builder.
// Builds the server described in blueprint.mjs (from discord-blueprint.md).
//
//   npm run setup          — build/converge (leaves unknown channels alone)
//   npm run setup:reset    — also deletes channels/categories not in the blueprint
//
// Requires .env with DISCORD_BOT_TOKEN and GUILD_ID; the bot must be in the
// guild with Administrator permission. Safe to re-run: existing roles and
// channels are matched by name and updated in place.

import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits as P,
  GuildFeature,
  GuildVerificationLevel,
  GuildExplicitContentFilter,
  GuildDefaultMessageNotifications,
  GuildSystemChannelFlags,
  GuildOnboardingPromptType,
  GuildOnboardingMode,
} from 'discord.js';
import {
  ROLES, BADGE_ROLES, CATEGORIES,
  RULES_MESSAGE, VERIFY_MESSAGE, PINGS_MESSAGE, PINGS_REACTIONS,
  ONBOARDING_PROMPTS,
} from './blueprint.mjs';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const RESET = process.argv.includes('--reset');

if (!TOKEN || TOKEN.includes('paste-')) {
  console.error('Missing DISCORD_BOT_TOKEN. Copy .env.example to .env and fill it in (see README.md).');
  process.exit(1);
}
if (!GUILD_ID) {
  console.error('Missing GUILD_ID in .env.');
  process.exit(1);
}

const log = (msg) => console.log(`  ${msg}`);
const step = (msg) => console.log(`\n== ${msg}`);

const TYPE_MAP = {
  text: ChannelType.GuildText,
  announcement: ChannelType.GuildAnnouncement,
  forum: ChannelType.GuildForum,
};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

try {
  await client.login(TOKEN);
  const guild = await client.guilds.fetch(GUILD_ID);
  await guild.roles.fetch();
  await guild.channels.fetch();
  await guild.members.fetch({ user: client.user.id });

  console.log(`Connected as ${client.user.tag} → building "${guild.name}"${RESET ? ' (reset mode)' : ''}`);

  const me = guild.members.me;
  if (!me.permissions.has(P.Administrator)) {
    throw new Error('The bot needs the Administrator permission in this server. Re-invite it with permissions=8.');
  }

  // -------------------------------------------------------------------------
  step('Roles');
  // -------------------------------------------------------------------------
  const roleByName = new Map([['@everyone', guild.roles.everyone]]);
  const managedOrder = []; // our roles, top-of-hierarchy first

  for (const spec of [...ROLES, ...BADGE_ROLES]) {
    let role = guild.roles.cache.find((r) => r.name === spec.name);
    const data = {
      color: spec.color ?? 0,
      hoist: spec.hoist ?? false,
      mentionable: false,
      permissions: spec.permissions ?? [],
    };
    if (!role) {
      role = await guild.roles.create({ name: spec.name, ...data, reason: 'TWR blueprint' });
      log(`created role  ${spec.name}`);
    } else {
      await role.edit(data);
      log(`updated role  ${spec.name}`);
    }
    roleByName.set(spec.name, role);
    managedOrder.push(role);
  }

  // Hierarchy: our roles in blueprint order. Discord creates new roles just
  // below the bot's own role, so creation order usually already matches —
  // only reorder when the relative order is wrong, and don't die if the API
  // refuses the move (it can be fixed by dragging in Server Settings).
  const desired = managedOrder.slice().reverse(); // bottom-up
  const inOrder = desired
    .slice()
    .sort((a, b) => a.position - b.position)
    .every((role, i) => role === desired[i]);
  if (inOrder) {
    log('hierarchy already in blueprint order');
  } else {
    try {
      await guild.roles.setPositions(desired.map((role, i) => ({ role: role.id, position: i + 1 })));
      log('hierarchy ordered');
    } catch (err) {
      log(`could not reorder roles via API (${err.message}) — drag them in Server Settings → Roles if needed`);
    }
  }

  // Blueprint: "Gold Commander — You. Server owner."
  const owner = await guild.fetchOwner();
  const gold = roleByName.get('Gold Commander');
  if (!owner.roles.cache.has(gold.id)) {
    await owner.roles.add(gold, 'TWR blueprint: owner is Gold Commander');
    log(`Gold Commander → ${owner.user.tag}`);
  }

  // Members shouldn't create invites (invite plan: staff-issued invites only).
  const everyone = guild.roles.everyone;
  if (everyone.permissions.has(P.CreateInstantInvite)) {
    await everyone.setPermissions(everyone.permissions.remove(P.CreateInstantInvite));
    log('@everyone: removed Create Invite');
  }

  // -------------------------------------------------------------------------
  if (RESET) {
    step('Reset — removing channels not in the blueprint');
    const keepNames = new Set();
    for (const cat of CATEGORIES) {
      keepNames.add(cat.name);
      for (const ch of cat.channels) keepNames.add(ch.name);
    }
    for (const channel of [...guild.channels.cache.values()]) {
      if (!keepNames.has(channel.name)) {
        await channel.delete('TWR blueprint reset');
        log(`deleted  ${channel.type === ChannelType.GuildCategory ? 'category ' : '#'}${channel.name}`);
      }
    }
  }

  // -------------------------------------------------------------------------
  step('Categories & text channels');
  // -------------------------------------------------------------------------
  const resolveOverwrites = (specs = []) =>
    specs.map(({ role, allow = [], deny = [] }) => {
      const r = roleByName.get(role);
      if (!r) throw new Error(`Overwrite references unknown role "${role}"`);
      return { id: r.id, allow, deny };
    });

  const channelByName = new Map();
  const deferred = []; // announcement conversions + forum creations (need Community)

  for (const [catIndex, catSpec] of CATEGORIES.entries()) {
    const catOverwrites = resolveOverwrites(catSpec.overwrites);
    let category = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === catSpec.name,
    );
    if (!category) {
      category = await guild.channels.create({
        name: catSpec.name,
        type: ChannelType.GuildCategory,
        permissionOverwrites: catOverwrites,
        position: catIndex,
      });
      log(`created  ${catSpec.name}`);
    } else {
      await category.edit({ permissionOverwrites: catOverwrites, position: catIndex });
      log(`updated  ${catSpec.name}`);
    }

    for (const chSpec of catSpec.channels) {
      const wantedType = TYPE_MAP[chSpec.type ?? 'text'];
      const overwrites = chSpec.overwrites ? resolveOverwrites(chSpec.overwrites) : catOverwrites;
      let channel = guild.channels.cache.find(
        (c) => c.type !== ChannelType.GuildCategory && c.name === chSpec.name,
      );

      if (chSpec.type === 'forum' && !channel) {
        deferred.push({ kind: 'forum', catSpec, chSpec, categoryId: category.id });
        continue; // forums need Community; created in a later pass
      }

      if (!channel) {
        channel = await guild.channels.create({
          name: chSpec.name,
          type: ChannelType.GuildText, // announcement conversion happens post-Community
          parent: category.id,
          topic: chSpec.topic,
          rateLimitPerUser: chSpec.rateLimitPerUser ?? 0,
          permissionOverwrites: overwrites,
        });
        log(`created  #${chSpec.name}`);
      } else {
        await channel.edit({
          parent: category.id,
          topic: chSpec.topic,
          rateLimitPerUser: chSpec.rateLimitPerUser ?? 0,
          permissionOverwrites: overwrites,
          lockPermissions: false,
        });
        log(`updated  #${chSpec.name}`);
      }
      channelByName.set(chSpec.name, channel);

      if (chSpec.type === 'announcement' && channel.type !== ChannelType.GuildAnnouncement) {
        deferred.push({ kind: 'announcement', channelId: channel.id, name: chSpec.name });
      }
    }
  }

  // -------------------------------------------------------------------------
  step('Community settings');
  // -------------------------------------------------------------------------
  const rules = channelByName.get('rules-of-the-watch');
  const incidentLog = channelByName.get('incident-log');
  let communityEnabled = guild.features.includes(GuildFeature.Community);

  try {
    await guild.edit({
      features: [...new Set([...guild.features, GuildFeature.Community])],
      verificationLevel: GuildVerificationLevel.Medium,
      explicitContentFilter: GuildExplicitContentFilter.AllMembers,
      defaultMessageNotifications: GuildDefaultMessageNotifications.OnlyMentions,
      rulesChannel: rules,
      publicUpdatesChannel: incidentLog,
      preferredLocale: 'en-GB',
      reason: 'TWR blueprint',
    });
    communityEnabled = true;
    log('Community enabled; verification Medium, content filter all members, notifications mentions-only');
  } catch (err) {
    log(`could not enable Community via API (${err.message})`);
    log('→ enable it manually: Server Settings → Enable Community (then re-run this script)');
  }

  await guild.edit({
    systemChannel: incidentLog,
    systemChannelFlags: [
      GuildSystemChannelFlags.SuppressGuildReminderNotifications,
      GuildSystemChannelFlags.SuppressJoinNotificationReplies,
    ],
  });
  log('system messages → #incident-log (join/boost messages stay out of #general)');

  // -------------------------------------------------------------------------
  step('Announcement + forum channels');
  // -------------------------------------------------------------------------
  for (const item of deferred) {
    if (item.kind === 'announcement') {
      if (!communityEnabled) {
        log(`#${item.name}: left as text (needs Community) — convert later in channel settings`);
        continue;
      }
      const channel = await guild.channels.fetch(item.channelId);
      await channel.setType(ChannelType.GuildAnnouncement);
      log(`#${item.name} → announcement channel`);
    } else {
      const { catSpec, chSpec, categoryId } = item;
      const overwrites = chSpec.overwrites
        ? resolveOverwrites(chSpec.overwrites)
        : resolveOverwrites(catSpec.overwrites);
      if (!communityEnabled) {
        // Blueprint fallback: create as text channel so the slot exists.
        const channel = await guild.channels.create({
          name: chSpec.name,
          type: ChannelType.GuildText,
          parent: categoryId,
          topic: chSpec.topic,
          permissionOverwrites: overwrites,
        });
        channelByName.set(chSpec.name, channel);
        log(`#${chSpec.name}: created as TEXT fallback (forums need Community)`);
        continue;
      }
      const channel = await guild.channels.create({
        name: chSpec.name,
        type: ChannelType.GuildForum,
        parent: categoryId,
        topic: chSpec.topic, // shown as post guidelines
        availableTags: chSpec.tags.map((name) => ({ name })),
        permissionOverwrites: overwrites,
      });
      channelByName.set(chSpec.name, channel);
      log(`created  #${chSpec.name} (forum: ${chSpec.tags.join(', ')})`);
    }
  }

  // Order channels within each category to match the blueprint.
  for (const catSpec of CATEGORIES) {
    for (const [i, chSpec] of catSpec.channels.entries()) {
      const channel = channelByName.get(chSpec.name);
      if (channel) await channel.edit({ position: i }).catch(() => {});
    }
  }
  log('channel order applied');

  // -------------------------------------------------------------------------
  step('Copy — rules, check-in, pings');
  // -------------------------------------------------------------------------
  const mention = (text) => text.replaceAll('#rules-of-the-watch', `<#${rules.id}>`);
  const verify = channelByName.get('verify');
  const postedIds = {};

  const ensurePosted = async (channel, content, marker, reactions = []) => {
    const recent = await channel.messages.fetch({ limit: 20 });
    let msg = recent.find((m) => m.author.id === client.user.id && m.content.startsWith(marker));
    if (!msg) {
      msg = await channel.send(content);
      for (const emoji of reactions) await msg.react(emoji);
      if (!msg.pinned) await msg.pin().catch(() => {});
      log(`posted in #${channel.name}`);
    } else {
      log(`already posted in #${channel.name} (skipped)`);
    }
    return msg.id;
  };

  postedIds.rules = await ensurePosted(rules, mention(RULES_MESSAGE), '**Rules of the Watch**');
  postedIds.verify = await ensurePosted(verify, mention(VERIFY_MESSAGE), '**⌚ Shift change.**', ['✅']);
  postedIds.pings = await ensurePosted(verify, PINGS_MESSAGE, '**Optional pings.**', PINGS_REACTIONS);

  // -------------------------------------------------------------------------
  step('Native onboarding (best effort)');
  // -------------------------------------------------------------------------
  // Discord requires ≥7 default channels, ≥5 of them sendable by @everyone —
  // a verify-gated server can fail that check, so failure here is expected
  // and the questions are configured manually instead (see README).
  const everyoneVisible = CATEGORIES.slice(0, 2).flatMap((c) => c.channels.map((ch) => channelByName.get(ch.name)?.id)).filter(Boolean);
  const onboardingPayload = (enabled) => ({
    enabled,
    mode: GuildOnboardingMode.OnboardingAdvanced,
    defaultChannels: everyoneVisible,
    prompts: ONBOARDING_PROMPTS.map((prompt) => ({
      type: GuildOnboardingPromptType.MultipleChoice,
      title: prompt.title,
      singleSelect: prompt.singleSelect,
      required: false,
      inOnboarding: prompt.inOnboarding ?? true,
      options: prompt.options.map((opt) => ({
        title: opt.title,
        roles: (opt.roles ?? []).map((n) => roleByName.get(n).id),
        channels: (opt.channels ?? []).map((n) => channelByName.get(n).id),
      })),
    })),
  });
  try {
    await guild.editOnboarding(onboardingPayload(true));
    log('onboarding enabled with Q1–Q7');
  } catch (err) {
    log(`onboarding not enabled via API (${err.message})`);
    try {
      await guild.editOnboarding(onboardingPayload(false));
      log('→ questions saved as a DRAFT in Server Settings → Onboarding (left off: Discord');
      log('  requires 5 @everyone-writable channels to enable it, which conflicts with the verify-gate)');
    } catch {
      log('→ configure manually: Server Settings → Onboarding (questions are in discord-blueprint.md / README)');
    }
  }

  // -------------------------------------------------------------------------
  step('Permanent invite');
  // -------------------------------------------------------------------------
  let inviteUrl = '(reuse an existing invite)';
  const invites = await guild.invites.fetch().catch(() => null);
  const existing = invites?.find((i) => i.maxAge === 0 && i.maxUses === 0);
  if (existing) {
    inviteUrl = existing.url;
  } else {
    const invite = await rules.createInvite({ maxAge: 0, maxUses: 0, unique: true, reason: 'TWR permanent invite' });
    inviteUrl = invite.url;
  }

  // -------------------------------------------------------------------------
  console.log(`
============================================================
 BUILD COMPLETE — ${guild.name}
============================================================
 Permanent invite (signup app + video descriptions):
   ${inviteUrl}

 Message IDs for Carl-bot reaction roles (#verify):
   check-in  ${postedIds.verify}   → bind ✅ → Operator
   pings     ${postedIds.pings}   → bind 🔔 → Dev Diary Pings, 🧪 → Pre-Alpha News, 📅 → Events

 Manual steps that Discord's API cannot do (see README.md):
   1. Server Settings → Moderation → enable "Require 2FA" (owner only)
   2. Invite Carl-bot (carl.gg) → nickname "The Duty Officer", give it
      the "The Duty Officer" role, configure welcome/automod//callsign
   3. Upload icon (TWR mark on #050507); banner needs Boost level 2
   4. Your own privacy settings: disable DMs from server members
   ${communityEnabled ? '' : '5. Enable Community in Server Settings, then RE-RUN this script\n'}
============================================================`);
} finally {
  await client.destroy();
}
