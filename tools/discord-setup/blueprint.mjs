// The Watch Room — Discord Server Blueprint (data)
// Source: ~/Downloads/discord-blueprint.md (handoff spec, supersedes the PDF).
// Names, colours and copy are verbatim from that document.

import { PermissionFlagsBits as P } from 'discord.js';

// ---------------------------------------------------------------------------
// Roles, top of the hierarchy first. `permissions` are additive to @everyone.
// "Unverified" is not a role — it is the @everyone default state.
// ---------------------------------------------------------------------------
export const ROLES = [
  { name: 'Gold Commander',          color: '#E8C81E', hoist: true,  permissions: [P.Administrator] },
  { name: 'Silver Commander',        color: '#C0C0C8', hoist: true,  permissions: [P.Administrator] },
  { name: 'Bronze Commander',        color: '#CD7F32', hoist: true,  permissions: [P.Administrator] },
  { name: 'Control Room Supervisor', color: '#FBBF24', hoist: true,  permissions: [P.ManageMessages, P.ManageThreads, P.ModerateMembers] },
  // Assigned to Carl-bot once it joins. ManageRoles so it can grant Operator
  // on the ✅ reaction, ManageNicknames for /callsign.
  { name: 'The Duty Officer',        color: '#E2E4DC', hoist: false, permissions: [P.ManageRoles, P.ManageMessages, P.ManageThreads, P.ModerateMembers, P.ManageNicknames, P.ViewAuditLog] },
  { name: 'Advisor',                 color: '#34D399', hoist: true,  permissions: [] },
  { name: 'Pre-Alpha Tester',        color: '#60A5FA', hoist: true,  permissions: [] },
  { name: 'Operator',                color: '#CDCDD4', hoist: false, permissions: [] },
];

// Cosmetic / notification badge roles used by onboarding (Q2–Q4) and the
// Duty Officer's reaction roles. No permissions, no hoist.
export const BADGE_ROLES = [
  { name: 'Fire',      color: '#DC2626' },
  { name: 'Ambulance', color: '#16A34A' },
  { name: 'Police',    color: '#2563EB' },
  { name: 'Dev Diary Pings' },
  { name: 'Pre-Alpha News' },
  { name: 'Events' },
  { name: 'Patch: Scotland' },
  { name: 'Patch: North' },
  { name: 'Patch: Midlands' },
  { name: 'Patch: Wales' },
  { name: 'Patch: South' },
  { name: 'Patch: London' },
  { name: 'Patch: Northern Ireland' },
  { name: 'Patch: Overseas' },
];

// ---------------------------------------------------------------------------
// Channel map. Overwrite entries use role names ('@everyone' for the default
// role); setup.mjs resolves them to IDs. A channel with its own `overwrites`
// is unsynced from its category, so it lists everything it needs.
// `type` defaults to text; 'announcement' and 'forum' need Community, so they
// are created/converted after it is enabled (with a text fallback if not).
// ---------------------------------------------------------------------------
const NO_POSTING = [P.SendMessages, P.SendMessagesInThreads, P.CreatePublicThreads, P.CreatePrivateThreads];

export const CATEGORIES = [
  {
    name: '📡 CONTROL', // members read-only; Commanders (admins) post
    overwrites: [{ role: '@everyone', deny: NO_POSTING }],
    channels: [
      { name: 'announcements', type: 'announcement', topic: 'Dev posts only. Crosspost-enabled (followable).' },
      { name: 'dev-diary', topic: 'Weekly build notes, every Friday. Screenshot + 3 bullets minimum.' },
      { name: 'roadmap', topic: 'Pinned roadmap graphic. Updated per phase.' },
      { name: 'faq', topic: 'What is TWR, platforms, pre-alpha dates, how to become an advisor.' },
      { name: 'rules-of-the-watch', topic: 'Rules of the Watch. Linked from onboarding.' },
    ],
  },
  {
    name: '🚨 CHECK-IN', // visible to all incl. unverified
    overwrites: [
      { role: '@everyone', deny: NO_POSTING },
      { role: 'The Duty Officer', allow: [P.SendMessages] }, // posts the check-in prompt
    ],
    channels: [
      { name: 'verify', topic: 'Read #rules-of-the-watch, then hit ✅ to check in and take your seat on the floor.' },
      {
        name: 'introductions',
        topic: '"Name, patch, and what you\'d run first." One post per member.',
        overwrites: [
          { role: '@everyone', deny: NO_POSTING },
          { role: 'Operator', allow: [P.SendMessages] },
        ],
      },
    ],
  },
  {
    name: '🗣️ THE WATCH FLOOR', // Operator+
    overwrites: [
      { role: '@everyone', deny: [P.ViewChannel] },
      { role: 'Operator', allow: [P.ViewChannel] },
      { role: 'The Duty Officer', allow: [P.ViewChannel] }, // automod coverage
    ],
    channels: [
      { name: 'general', topic: 'Main floor.', rateLimitPerUser: 5 }, // slow mode 5s from day one
      { name: 'incident-talk', topic: 'Real-world control room / CAD / dispatch chat.' },
      { name: 'media-clips', topic: 'Screenshots and clips. Demo videos live here first. Invite links allowed here only.' },
      { name: 'off-duty', topic: 'Off-topic. Keeps #general on mission.' },
    ],
  },
  {
    name: '🧪 PRE-ALPHA', // Pre-Alpha Tester only (invite-only)
    overwrites: [
      { role: '@everyone', deny: [P.ViewChannel] },
      { role: 'Pre-Alpha Tester', allow: [P.ViewChannel] },
      { role: 'The Duty Officer', allow: [P.ViewChannel] },
    ],
    channels: [
      {
        name: 'briefing',
        topic: 'Build access, test focus for the week, known issues. Read-only.',
        overwrites: [
          { role: '@everyone', deny: [P.ViewChannel] },
          { role: 'Pre-Alpha Tester', allow: [P.ViewChannel], deny: NO_POSTING },
          { role: 'The Duty Officer', allow: [P.ViewChannel] },
        ],
      },
      {
        name: 'bug-reports',
        type: 'forum',
        topic: 'Post template: build / steps / expected / actual / screenshot.',
        tags: ['MDT', 'Mapping', 'Resources', 'UI', 'Crash'],
      },
      {
        name: 'feedback',
        type: 'forum',
        topic: 'One thread per topic.',
        tags: ['Balance', 'Realism', 'UX', 'Feature'],
      },
    ],
  },
  {
    name: '🛡️ ADVISORY WING', // Advisor only, hidden from everyone else
    overwrites: [
      { role: '@everyone', deny: [P.ViewChannel] },
      { role: 'Advisor', allow: [P.ViewChannel] },
    ],
    channels: [
      {
        name: 'advisor-briefing',
        topic: "What's being built now and what input is needed. Read-only.",
        overwrites: [
          { role: '@everyone', deny: [P.ViewChannel] },
          { role: 'Advisor', allow: [P.ViewChannel], deny: NO_POSTING },
        ],
      },
      {
        name: 'sop-review',
        type: 'forum',
        topic: 'One thread per SOP/resource.',
        tags: ['Appliances', 'Mobilising', 'BA', 'Clinical', 'Police', 'Control room'],
      },
      { name: 'ask-the-devs', topic: 'Direct line, advisors ↔ devs. Anonymity respected — no service names required.' },
    ],
  },
  {
    name: '🏢 STATION OFFICE', // Commanders + Supervisors only, hidden
    overwrites: [
      { role: '@everyone', deny: [P.ViewChannel] },
      { role: 'Gold Commander', allow: [P.ViewChannel] },
      { role: 'Silver Commander', allow: [P.ViewChannel] },
      { role: 'Bronze Commander', allow: [P.ViewChannel] },
      { role: 'Control Room Supervisor', allow: [P.ViewChannel] },
      { role: 'The Duty Officer', allow: [P.ViewChannel] }, // mod-log destination
    ],
    channels: [
      { name: 'incident-log', topic: "The Duty Officer's mod-log: deletions, timeouts, joins/leaves, filter hits." },
      { name: 'command-channel', topic: 'Mod coordination — escalations, advisor vetting decisions, wave planning.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Paste-ready copy (verbatim). "#rules-of-the-watch" is replaced with a live
// channel mention at post time.
// ---------------------------------------------------------------------------
export const RULES_MESSAGE = `**Rules of the Watch**
1. Respect the floor. No abuse, discrimination or harassment — instant removal.
2. Real incidents stay confidential. Share experience, never identifiable jobs, patients or casework.
3. This is a simulation community. Nothing here is operational advice, and Discord is not a way to reach emergency services.
4. No leaks. Pre-alpha and advisory material stays in its wing until we publish it.
5. Keep it on patch — promo and invite links need a Supervisor's nod first.
6. Listen to The Duty Officer. Automated calls are final unless a Supervisor overrules.`;

export const VERIFY_MESSAGE = `**⌚ Shift change.**
You're in The Watch Room — the control-room simulation where you take the calls and run the board.
Read #rules-of-the-watch, then hit ✅ to check in and take your seat on the floor.`;

// Posted below the check-in message; Carl-bot reaction roles bind to it.
export const PINGS_MESSAGE = `**Optional pings.** React to choose what reaches you:
🔔 — Dev diary
🧪 — Pre-alpha news
📅 — Events`;

export const PINGS_REACTIONS = ['🔔', '🧪', '📅'];

// ---------------------------------------------------------------------------
// Discord native onboarding (Q1–Q7). The API requires every option to grant
// at least one role or channel, so survey-only questions grant #faq.
// `roles` = role names, `channels` = channel names, resolved at run time.
// ---------------------------------------------------------------------------
export const ONBOARDING_PROMPTS = [
  {
    title: 'What brings you to the floor?',
    singleSelect: true,
    options: [
      { title: 'Waiting for the game', roles: ['Dev Diary Pings'] },
      { title: 'Emergency services background', roles: ['Dev Diary Pings'] },
      { title: 'Just curious', roles: ['Dev Diary Pings'] },
    ],
  },
  {
    title: 'Which service would you run first?',
    singleSelect: true,
    options: [
      { title: 'Fire', roles: ['Fire'] },
      { title: 'Ambulance', roles: ['Ambulance'] },
      { title: 'Police', roles: ['Police'] },
    ],
  },
  {
    title: 'Want pings?',
    singleSelect: false,
    options: [
      { title: 'Dev diary', roles: ['Dev Diary Pings'] },
      { title: 'Pre-alpha news', roles: ['Pre-Alpha News'] },
      { title: 'Events', roles: ['Events'] },
    ],
  },
  {
    title: "Where's your patch?",
    singleSelect: true,
    options: [
      { title: 'Scotland', roles: ['Patch: Scotland'] },
      { title: 'North', roles: ['Patch: North'] },
      { title: 'Midlands', roles: ['Patch: Midlands'] },
      { title: 'Wales', roles: ['Patch: Wales'] },
      { title: 'South', roles: ['Patch: South'] },
      { title: 'London', roles: ['Patch: London'] },
      { title: 'Northern Ireland', roles: ['Patch: Northern Ireland'] },
      { title: 'Overseas', roles: ['Patch: Overseas'] },
    ],
  },
  {
    title: 'Played dispatch sims before?',
    singleSelect: true,
    inOnboarding: false, // survey — lives in the Channels & Roles tab
    options: [
      { title: 'Yes, plenty', channels: ['faq'] },
      { title: 'Dabbled', channels: ['faq'] },
      { title: 'First time', channels: ['faq'] },
    ],
  },
  {
    title: 'How did you find us?',
    singleSelect: true,
    inOnboarding: false,
    options: [
      { title: 'TikTok/Reels', channels: ['faq'] },
      { title: 'YouTube', channels: ['faq'] },
      { title: 'Reddit', channels: ['faq'] },
      { title: 'A mate', channels: ['faq'] },
      { title: 'Emergency services word-of-mouth', channels: ['faq'] },
    ],
  },
  {
    title: 'Which platform will you run on?',
    singleSelect: true,
    inOnboarding: false,
    options: [
      { title: 'Browser', channels: ['faq'] },
      { title: 'Mac', channels: ['faq'] },
      { title: 'iPad', channels: ['faq'] },
    ],
  },
];
