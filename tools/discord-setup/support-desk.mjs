// A support ticket desk for The Watch Room, with no bot to host.
// Idempotent.
//
// Discord already has the mechanism: a PRIVATE THREAD is visible only to
// the person who opened it, anyone they add, and anyone who can manage
// threads. So a #support channel where members cannot post to the
// channel itself but CAN open private threads is a ticket desk — every
// ticket its own private room with the Commanders, nothing public, no
// third-party ticket bot to invite and trust.
//
// This builds #support under 📡 CONTROL with those permissions, posts the
// "how to open a ticket" prompt and pins it. Commanders hold
// Administrator and see every thread; The Duty Officer gets Manage
// Threads so automod and moderation reach inside tickets too.
//
// Run:  node support-desk.mjs ./.env
import fs from "node:fs";

const env = fs.readFileSync(process.argv[2], "utf8");
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
const VIEW_CHANNEL = 1n << 10n;
const SEND_MESSAGES = 1n << 11n;
const MANAGE_MESSAGES = 1n << 13n;
const READ_HISTORY = 1n << 16n;
const MANAGE_THREADS = 1n << 34n;
const CREATE_PUBLIC_THREADS = 1n << 35n;
const CREATE_PRIVATE_THREADS = 1n << 36n;
const SEND_IN_THREADS = 1n << 38n;

const CHANNEL = "support";
const TOPIC =
  "Support desk. Open a private thread here — only you and the Commanders can see it. Account problems, Discord access, anything you would rather not post in the open.";
const PIN_MARKER = "How to open a support ticket";

const PROMPT = `**${PIN_MARKER}**

Need a hand with your account, your advisor application, Discord access, or anything you would rather not raise in the open?

1. Click **Create Thread** (the **#** with a **+**) at the top of this channel — or hover this message and choose **Create Thread**.
2. Pick **Private Thread**, give it a short title, and write what is up.
3. That thread is visible only to you and the Commanders. Nobody else can see it exists.

A Commander will pick it up. When it is sorted, say so in the thread and it will be archived.

*Nothing in this channel is public: members cannot post here, only open threads.*`;

// --- Guild lookup ---------------------------------------------------------
const roles = await api("GET", `/guilds/${GUILD}/roles`);
if (roles.__err) {
  console.log(
    `Cannot reach the guild (${roles.__err}) — the bot isn't in the server. Re-authorise the invite URL, then re-run.`,
  );
  process.exit(0);
}
const everyone = roles.find((r) => r.name === "@everyone");
const dutyOfficer = roles.find((r) => r.name === "The Duty Officer");
if (!everyone) {
  console.log("@everyone role not found — aborting.");
  process.exit(1);
}

const channels = await api("GET", `/guilds/${GUILD}/channels`);
const control = channels.find((c) => c.type === 4 && c.name.includes("CONTROL"));
if (!control) {
  console.log("CONTROL category not found — run setup.mjs first. Aborting.");
  process.exit(1);
}

// Members see the channel and its history, cannot post to it, cannot
// open public threads, CAN open private threads and talk inside them.
const overwrites = [
  {
    id: everyone.id,
    type: 0,
    allow: String(VIEW_CHANNEL | READ_HISTORY | CREATE_PRIVATE_THREADS | SEND_IN_THREADS),
    deny: String(SEND_MESSAGES | CREATE_PUBLIC_THREADS),
  },
];
if (dutyOfficer) {
  overwrites.push({
    id: dutyOfficer.id,
    type: 0,
    allow: String(VIEW_CHANNEL | READ_HISTORY | SEND_MESSAGES | MANAGE_MESSAGES | MANAGE_THREADS | SEND_IN_THREADS),
    deny: "0",
  });
}

// --- The channel ----------------------------------------------------------
let chan = channels.find((c) => c.type === 0 && c.name === CHANNEL && c.parent_id === control.id);
if (chan) {
  const res = await api("PATCH", `/channels/${chan.id}`, {
    topic: TOPIC,
    permission_overwrites: overwrites,
  });
  console.log(`#${CHANNEL}: exists — permissions and topic converged${res.__err ? ` (PATCH FAILED ${res.__err} ${res.__body})` : " ✓"}`);
} else {
  const res = await api("POST", `/guilds/${GUILD}/channels`, {
    name: CHANNEL,
    type: 0,
    parent_id: control.id,
    topic: TOPIC,
    permission_overwrites: overwrites,
    // Tickets go quiet once sorted; a day's inactivity archives them.
    default_auto_archive_duration: 1440,
  });
  if (res.__err) {
    console.log(`#${CHANNEL}: CREATE FAILED ${res.__err} ${res.__body}`);
    process.exit(1);
  }
  chan = res;
  console.log(`#${CHANNEL}: created under ${control.name} ✓`);
}
await sleep(400);

// --- The prompt, posted once and pinned ------------------------------------
// Fail closed: if the pin check itself fails, do not post a duplicate.
const pins = await api("GET", `/channels/${chan.id}/messages/pins`);
if (pins.__err) {
  console.log(`Could not read pins (${pins.__err}) — leaving the prompt alone rather than risk posting it twice.`);
} else {
  const items = Array.isArray(pins) ? pins : (pins.items ?? []).map((p) => p.message ?? p);
  const already = items.find((m) => typeof m?.content === "string" && m.content.includes(PIN_MARKER));
  if (already) {
    console.log("Prompt: already posted and pinned ✓");
  } else {
    const msg = await api("POST", `/channels/${chan.id}/messages`, { content: PROMPT });
    if (msg.__err) {
      console.log(`Prompt: POST FAILED ${msg.__err} ${msg.__body}`);
    } else {
      await sleep(300);
      const pin = await api("PUT", `/channels/${chan.id}/messages/pins/${msg.id}`);
      console.log(`Prompt: posted${pin.__err ? ` (PIN FAILED ${pin.__err} — pin it by hand)` : " and pinned ✓"}`);
    }
  }
}

console.log(`
Support desk ready: #${CHANNEL} under ${control.name}.

Members open a Private Thread there; only they and the Commanders (and
The Duty Officer, for moderation) can see it. Archive a thread when it
is sorted. Re-run any time — nothing here is created twice.
`);
