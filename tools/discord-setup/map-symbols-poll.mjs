// Dev poll for #suggestions: sprites or blips on the dispatcher map.
// Opens one forum thread, tagged UI / UX + Realism, with a native poll
// attached. Idempotent — if the thread is already there it prints the
// link and changes nothing (Discord won't let a live poll be edited).
import fs from "node:fs";

const env = fs.readFileSync(process.argv[2] ?? "./.env", "utf8");
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

const TITLE = "Map symbols — appliance sprites or CAD blips?";
const TAGS = ["UI / UX", "Realism"];

const BODY = `Two ways to draw a resource on the dispatcher map, and we'd sooner you picked than us.

**Blips — what's on the map today.** A service-coloured block carrying the resource code (P · AL · DC · RV · PC · HT), the status roundel notched into it (6 available, 1 mobile, 2 in attendance, BA committed, 3 returning, 0 off the run), the callsign on a plate beside it, and a dot on the exact position. It sheds parts as you pull back rather than shrinking past legible, it's what a real mobilising screen puts in front of a dispatcher, and every appliance is covered the day it's added — no new artwork per type.

**Sprites — the appliance art from the ground view, up on the map.** A pump looks like a pump and an ALP looks like an ALP, and the light fittings are live, so the blues flash where the unit actually is. You read the picture instead of decoding it. The cost is honest: slower to cover the fleet, cluttered at patch-wide zoom, and callsign and status still have to ride alongside the art.

It comes down to what the map is for — a mobilising screen you read in a glance, or your patch as a picture you can watch.

Vote below, and if you've got a view on it, put it in the thread:
· at what zoom would you want which?
· is status colour worth more to you than knowing it's a pump?
· twenty units on screen at once — does the art still hold up?

Poll runs a week. It settles the default, not the only way it can ever look.`;

const POLL = {
  question: { text: "How should resources read on the dispatcher map?" },
  answers: [
    { poll_media: { text: "Sprites — appliance art, blues that flash", emoji: { name: "🚒" } } },
    { poll_media: { text: "Blips — CAD symbol, code, status, callsign", emoji: { name: "📟" } } },
    { poll_media: { text: "Both — sprites up close, blips pulled back", emoji: { name: "🔎" } } },
  ],
  duration: 168, // hours — one week
  allow_multiselect: false,
  layout_type: 1,
};

const channels = await api("GET", `/guilds/${GUILD}/channels`);
if (channels.__err) {
  console.log(
    `Cannot reach the guild (${channels.__err}) — the bot isn't in the server yet. Authorise the re-invite URL, then re-run.`,
  );
  process.exit(0);
}

const forum = channels.find((c) => c.type === 15 && c.name === "suggestions");
if (!forum) {
  console.log("#suggestions forum not found — run suggestions-forum.mjs first.");
  process.exit(1);
}

// Already posted? Check live threads and the public archive both.
const active = await api("GET", `/guilds/${GUILD}/threads/active`);
const archived = await api("GET", `/channels/${forum.id}/threads/archived/public?limit=100`);
const existing = [...(active.threads ?? []), ...(archived.threads ?? [])].find(
  (t) => t.parent_id === forum.id && t.name === TITLE,
);
if (existing) {
  console.log("Poll thread already open — nothing to do.");
  console.log(`  https://discord.com/channels/${GUILD}/${existing.id}`);
  process.exit(0);
}

const applied_tags = TAGS.map((name) => forum.available_tags?.find((t) => t.name === name)?.id).filter(Boolean);
if (applied_tags.length !== TAGS.length) {
  console.log(`Warning: only matched ${applied_tags.length}/${TAGS.length} tags — re-run suggestions-forum.mjs.`);
}

// Polls on a forum starter message aren't guaranteed by the API. Try it,
// and fall back to the thread plus the poll as its first reply.
let thread = await api("POST", `/channels/${forum.id}/threads`, {
  name: TITLE,
  applied_tags,
  auto_archive_duration: 10080,
  message: { content: BODY, poll: POLL },
});
let pollInStarter = !thread.__err;

if (thread.__err) {
  thread = await api("POST", `/channels/${forum.id}/threads`, {
    name: TITLE,
    applied_tags,
    auto_archive_duration: 10080,
    message: { content: BODY },
  });
  if (thread.__err) {
    console.log(`Thread FAILED ${thread.__err} ${thread.__body}`);
    process.exit(1);
  }
  const poll = await api("POST", `/channels/${thread.id}/messages`, { poll: POLL });
  if (poll.__err) {
    console.log(`Thread posted, but the poll FAILED ${poll.__err} ${poll.__body}`);
    console.log(`  add it by hand: https://discord.com/channels/${GUILD}/${thread.id}`);
    process.exit(1);
  }
}

console.log("Poll thread: posted ✓", pollInStarter ? "(poll on the opening post)" : "(poll as the first reply)");
console.log(`  https://discord.com/channels/${GUILD}/${thread.id}`);
console.log("  tags:", TAGS.join(" · "), "· closes in 7 days");

// Pin it to the top of the forum. Not fatal if the bot can't.
const pinned = await api("PATCH", `/channels/${thread.id}`, { flags: 2 });
console.log("  pinned:", pinned.__err ? `no (${pinned.__err})` : "yes");

const general = channels.find((c) => c.name === "general");
if (general) {
  console.log("\nDrop this in #general:");
  console.log(
    `  Map symbols are up for a vote — appliance sprites or CAD blips. A week to have your say: https://discord.com/channels/${GUILD}/${thread.id}`,
  );
}
