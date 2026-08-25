// Approved config: welcome screen + native AutoMod safety net. Idempotent.
import fs from "node:fs";

const env = fs.readFileSync(process.argv[2], "utf8");
const TOKEN = /DISCORD_BOT_TOKEN=(\S+)/.exec(env)?.[1];
const GUILD = /GUILD_ID=(\S+)/.exec(env)?.[1];
const H = { Authorization: `Bot ${TOKEN}`, "Content-Type": "application/json" };
const api = async (method, path, body) => {
  const r = await fetch(`https://discord.com/api/v10${path}`, {
    method,
    headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) return { __err: r.status, __body: text.slice(0, 300) };
  return text ? JSON.parse(text) : {};
};

const channels = await api("GET", `/guilds/${GUILD}/channels`);
const roles = await api("GET", `/guilds/${GUILD}/roles`);
const chan = (name) => channels.find((c) => c.name === name)?.id;
const role = (name) => roles.find((r) => r.name === name)?.id;

// --- Welcome screen -------------------------------------------------------
const ws = await api("PATCH", `/guilds/${GUILD}/welcome-screen`, {
  enabled: true,
  description:
    "The control-room simulation — take the calls, run the board. Check in and take your seat on the floor.",
  welcome_channels: [
    { channel_id: chan("rules-of-the-watch"), description: "Read the Rules of the Watch", emoji_id: null, emoji_name: "📜" },
    { channel_id: chan("verify"), description: "Check in — hit ✅ to join the floor", emoji_id: null, emoji_name: "✅" },
    { channel_id: chan("faq"), description: "What The Watch Room is", emoji_id: null, emoji_name: "❓" },
  ],
});
console.log("welcome screen:", ws.__err ? `FAILED ${ws.__err} ${ws.__body}` : "set ✓");

// --- AutoMod --------------------------------------------------------------
const existing = await api("GET", `/guilds/${GUILD}/auto-moderation/rules`);
const have = new Set((existing.__err ? [] : existing).map((r) => r.name));
const incidentLog = chan("incident-log");
const alert = incidentLog
  ? [{ type: 2, metadata: { channel_id: incidentLog } }]
  : [];

const rules = [
  {
    name: "Keyword presets (profanity / sexual / slurs)",
    event_type: 1,
    trigger_type: 4,
    trigger_metadata: { presets: [1, 2, 3], allow_list: [] },
    actions: [{ type: 1, metadata: {} }, ...alert],
    enabled: true,
  },
  {
    name: "Anti-spam",
    event_type: 1,
    trigger_type: 3,
    trigger_metadata: {},
    actions: [{ type: 1, metadata: {} }, ...alert],
    enabled: true,
  },
  {
    name: "Invite links (allowed in media-clips only)",
    event_type: 1,
    trigger_type: 1,
    trigger_metadata: {
      keyword_filter: [],
      regex_patterns: ["(?:discord\\.gg|discord\\.com/invite)/"],
      allow_list: [],
    },
    actions: [
      {
        type: 1,
        metadata: {
          custom_message:
            "Invite links need a Supervisor's nod — they're allowed in #media-clips only.",
        },
      },
      ...alert,
    ],
    exempt_channels: [chan("media-clips")].filter(Boolean),
    exempt_roles: [role("The Duty Officer")].filter(Boolean),
    enabled: true,
  },
];

for (const rule of rules) {
  if (have.has(rule.name)) {
    console.log(`automod "${rule.name}": already present ✓`);
    continue;
  }
  const res = await api("POST", `/guilds/${GUILD}/auto-moderation/rules`, rule);
  console.log(
    `automod "${rule.name}":`,
    res.__err ? `FAILED ${res.__err} ${res.__body}` : "created ✓",
  );
}
