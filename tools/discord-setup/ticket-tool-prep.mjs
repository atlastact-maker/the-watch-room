// Server-side preparation for Ticket Tool. Idempotent.
//
// Ticket Tool creates a channel per ticket. Left to itself it drops them
// wherever its dashboard is pointed, and if that place is visible to
// @everyone then every ticket is public — which defeats the point. So
// this builds the two things the dashboard needs to be pointed AT, with
// the permissions already correct:
//
//   🎫 TICKETS   a category @everyone cannot see at all. Ticket Tool can
//                create and manage channels inside it; the Commanders and
//                the Control Room Supervisor can read and reply. A ticket
//                channel inherits this, so it is private the moment it
//                exists, before Ticket Tool adds the opener to it.
//
//   #support     the panel channel, under 📡 CONTROL where members already
//                look. They can see it and read it but not post — the only
//                thing to do there is press the button. Ticket Tool can
//                post and pin the panel itself.
//
// This script does NOT touch the Ticket Tool role's position or its
// server-wide permissions. Both are owner decisions and both are wrong at
// the time of writing — see the warnings it prints.
//
// Run:  node ticket-tool-prep.mjs ./.env
//   or: npm run ticket-prep
import fs from "node:fs";

const env = fs.readFileSync(process.argv[2] ?? "./.env", "utf8");
const TOKEN = /DISCORD_BOT_TOKEN=(\S+)/.exec(env)?.[1];
const GUILD = /GUILD_ID=(\S+)/.exec(env)?.[1];
const H = { Authorization: `Bot ${TOKEN}`, "Content-Type": "application/json" };

const api = async (method, path, body, retried = false) => {
  const r = await fetch(`https://discord.com/api/v10${path}`, {
    method,
    headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (r.status === 429 && !retried) {
    let wait = Number(r.headers.get("retry-after")) || 1;
    try {
      const j = JSON.parse(text);
      if (typeof j.retry_after === "number") wait = j.retry_after;
    } catch {
      /* header value stands */
    }
    console.log(`  rate limited — waiting ${wait.toFixed(1)}s`);
    await new Promise((res) => setTimeout(res, wait * 1000 + 250));
    return api(method, path, body, true);
  }
  if (!r.ok) return { __err: r.status, __body: text.slice(0, 300) };
  return text ? JSON.parse(text) : {};
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Permission bits (Discord API v10).
const ADD_REACTIONS = 1n << 6n;
const MANAGE_CHANNELS = 1n << 4n;
const VIEW_CHANNEL = 1n << 10n;
const SEND_MESSAGES = 1n << 11n;
const MANAGE_MESSAGES = 1n << 13n;
const EMBED_LINKS = 1n << 14n;
const ATTACH_FILES = 1n << 15n;
const READ_HISTORY = 1n << 16n;
const MENTION_EVERYONE = 1n << 17n;
const MANAGE_ROLES = 1n << 28n;
const MANAGE_WEBHOOKS = 1n << 29n;
const USE_APP_COMMANDS = 1n << 31n;
const CREATE_PUBLIC_THREADS = 1n << 35n;
const CREATE_PRIVATE_THREADS = 1n << 36n;

const CAT = "🎫 TICKETS";
const PANEL_CHANNEL = "support";
const PANEL_TOPIC =
  "Support desk. Press the button to open a ticket — it becomes a private channel with the Commanders. Account problems, Discord access, anything you would rather not raise in the open.";

/** Who answers tickets. Everything here gets read/write inside the category. */
const SUPPORT_ROLES = [
  "Gold Commander",
  "Silver Commander",
  "Bronze Commander",
  "Control Room Supervisor",
];

// --- Guild lookup ---------------------------------------------------------
const roles = await api("GET", `/guilds/${GUILD}/roles`);
if (roles.__err) {
  console.log(
    `Cannot reach the guild (${roles.__err}) — the setup bot isn't in the server. Re-authorise the invite URL, then re-run.`,
  );
  process.exit(1);
}
const byName = (n) => roles.find((r) => r.name === n);
const everyone = byName("@everyone");
if (!everyone) {
  console.log("@everyone role not found — aborting.");
  process.exit(1);
}
const ticketTool = roles.find((r) => r.managed && /ticket ?tool/i.test(r.name));
if (!ticketTool) {
  console.log(
    "Ticket Tool's role isn't in this server. Invite it from https://tickettool.xyz first, then re-run.",
  );
  process.exit(1);
}

const support = SUPPORT_ROLES.map(byName).filter(Boolean);
const missingRoles = SUPPORT_ROLES.filter((n) => !byName(n));

// --- Overwrites -----------------------------------------------------------
// The category: invisible to members, workable by Ticket Tool, readable by
// the people who answer tickets.
const catOverwrites = [
  { id: everyone.id, type: 0, allow: "0", deny: String(VIEW_CHANNEL) },
  {
    id: ticketTool.id,
    type: 0,
    allow: String(
      VIEW_CHANNEL | MANAGE_CHANNELS | MANAGE_ROLES | SEND_MESSAGES | MANAGE_MESSAGES |
        EMBED_LINKS | ATTACH_FILES | READ_HISTORY | MENTION_EVERYONE | MANAGE_WEBHOOKS |
        ADD_REACTIONS | USE_APP_COMMANDS,
    ),
    deny: "0",
  },
  ...support.map((r) => ({
    id: r.id,
    type: 0,
    allow: String(
      VIEW_CHANNEL | SEND_MESSAGES | MANAGE_MESSAGES | EMBED_LINKS | ATTACH_FILES | READ_HISTORY,
    ),
    deny: "0",
  })),
];

// The panel channel: members look but do not touch. The only interaction
// is the button, and a button press needs no Send Messages.
const panelOverwrites = [
  {
    id: everyone.id,
    type: 0,
    allow: String(VIEW_CHANNEL | READ_HISTORY | USE_APP_COMMANDS),
    deny: String(SEND_MESSAGES | CREATE_PUBLIC_THREADS | CREATE_PRIVATE_THREADS | ADD_REACTIONS),
  },
  {
    id: ticketTool.id,
    type: 0,
    allow: String(
      VIEW_CHANNEL | SEND_MESSAGES | MANAGE_MESSAGES | EMBED_LINKS | ATTACH_FILES |
        READ_HISTORY | ADD_REACTIONS | USE_APP_COMMANDS,
    ),
    deny: "0",
  },
  ...support.map((r) => ({
    id: r.id,
    type: 0,
    allow: String(VIEW_CHANNEL | SEND_MESSAGES | EMBED_LINKS | READ_HISTORY),
    deny: "0",
  })),
];

// --- Build ----------------------------------------------------------------
const channels = await api("GET", `/guilds/${GUILD}/channels`);

let cat = channels.find((c) => c.type === 4 && c.name === CAT);
if (cat) {
  const res = await api("PATCH", `/channels/${cat.id}`, { permission_overwrites: catOverwrites });
  console.log(`${CAT}: exists — permissions converged${res.__err ? ` (FAILED ${res.__err} ${res.__body})` : " ✓"}`);
} else {
  const res = await api("POST", `/guilds/${GUILD}/channels`, {
    name: CAT,
    type: 4,
    permission_overwrites: catOverwrites,
  });
  if (res.__err) {
    console.log(`${CAT}: CREATE FAILED ${res.__err} ${res.__body}`);
    process.exit(1);
  }
  cat = res;
  console.log(`${CAT}: created ✓`);
}
await sleep(400);

const control = channels.find((c) => c.type === 4 && c.name.includes("CONTROL"));
let panel = channels.find((c) => c.type === 0 && c.name === PANEL_CHANNEL);
if (panel) {
  const res = await api("PATCH", `/channels/${panel.id}`, {
    topic: PANEL_TOPIC,
    permission_overwrites: panelOverwrites,
    ...(control ? { parent_id: control.id } : {}),
  });
  console.log(`#${PANEL_CHANNEL}: exists — permissions converged${res.__err ? ` (FAILED ${res.__err} ${res.__body})` : " ✓"}`);
} else {
  const res = await api("POST", `/guilds/${GUILD}/channels`, {
    name: PANEL_CHANNEL,
    type: 0,
    ...(control ? { parent_id: control.id } : {}),
    topic: PANEL_TOPIC,
    permission_overwrites: panelOverwrites,
  });
  if (res.__err) {
    console.log(`#${PANEL_CHANNEL}: CREATE FAILED ${res.__err} ${res.__body}`);
    process.exit(1);
  }
  panel = res;
  console.log(`#${PANEL_CHANNEL}: created under ${control ? control.name : "no category"} ✓`);
}

// --- What the owner still has to do ---------------------------------------
const warn = [];
const above = roles.filter((r) => !r.managed && r.position > ticketTool.position);
const blockedBy = support.filter((r) => r.position > ticketTool.position);
if (blockedBy.length) {
  warn.push(
    `Ticket Tool's role sits at position ${ticketTool.position}, BELOW ${blockedBy.length} of your support roles ` +
      `(${blockedBy.map((r) => r.name).join(", ")}). Manage Roles only reaches roles beneath it, so it may fail to ` +
      `grant them access to a new ticket. Drag the Ticket Tool role up in Server Settings > Roles until it sits ` +
      `just under Bronze Commander. ${above.length} non-bot roles are above it right now.`,
  );
}
const p = BigInt(ticketTool.permissions);
const wantServerWide = [
  ["Add Reactions", ADD_REACTIONS],
  ["Mention Everyone", MENTION_EVERYONE],
  ["Manage Webhooks", MANAGE_WEBHOOKS],
];
const lacking = wantServerWide.filter(([, b]) => (p & b) !== b).map(([n]) => n);
if (lacking.length) {
  warn.push(
    `Ticket Tool lacks these server-wide: ${lacking.join(", ")}. The channel overwrites above grant them where it ` +
      `matters, so tickets will work — but re-inviting it with the preset from tickettool.xyz is tidier than ` +
      `leaving the gap.`,
  );
}
if (missingRoles.length) {
  warn.push(`These support roles were named but do not exist, so they got no access: ${missingRoles.join(", ")}.`);
}

console.log(`
Ready for the dashboard at https://tickettool.xyz

  Panel channel      #${panel.name}      id ${panel.id}
  Ticket category    ${cat.name}     id ${cat.id}
  Support roles      ${support.map((r) => r.name).join(", ") || "(none found)"}

In the dashboard: point the panel at #${panel.name}, set the ticket category
to ${cat.name}, and add those roles as support. Transcripts have a natural
home in #incident-log.
`);
for (const w of warn) console.log(`!  ${w}\n`);
if (!warn.length) console.log("Nothing left for you to do on the server side.\n");
