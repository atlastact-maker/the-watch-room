// #suggestions forum for The Watch Room. Idempotent.
// Lives in THE WATCH FLOOR (Operator-gated, inherits category perms).
// Topic tags are open; status tags are moderated (mods only).
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

const GUIDELINES = `**Got an idea for the watch? Put it here.**

One idea per thread — give it a clear title, tag it, and say what you'd want and why it'd make the job feel right. If someone's already suggested it, back theirs with 👍 instead of starting a second thread; the ones with weight behind them get looked at first.

Every suggestion gets read. The ones that land get tagged **📌 Planned**, and **✅ Shipped** when they're in the build — so you can see where your idea got to.

This isn't the place for bugs — those go to the pre-alpha wing once you're testing.`;

const TAGS = [
  // Topic tags — anyone can apply
  { name: "Gameplay", emoji_name: "🎮", moderated: false },
  { name: "MDT", emoji_name: "🖥️", moderated: false },
  { name: "Fleet", emoji_name: "🚒", moderated: false },
  { name: "Scenarios", emoji_name: "📋", moderated: false },
  { name: "UI / UX", emoji_name: "🎨", moderated: false },
  { name: "Audio", emoji_name: "🔊", moderated: false },
  { name: "Realism", emoji_name: "🎯", moderated: false },
  // Status tags — mods only
  { name: "Planned", emoji_name: "📌", moderated: true },
  { name: "Shipped", emoji_name: "✅", moderated: true },
  { name: "Not now", emoji_name: "🚫", moderated: true },
];

const channels = await api("GET", `/guilds/${GUILD}/channels`);
if (channels.__err) {
  console.log(
    `Cannot reach the guild (${channels.__err}) — the bot isn't in the server yet. Authorise the re-invite URL, then re-run.`,
  );
  process.exit(0);
}

const floor = channels.find((c) => c.type === 4 && c.name.includes("WATCH FLOOR"));
if (!floor) {
  console.log("THE WATCH FLOOR category not found — aborting.");
  process.exit(1);
}

let sugg = channels.find((c) => c.name === "suggestions");
if (sugg) {
  const res = await api("PATCH", `/channels/${sugg.id}`, {
    topic: GUIDELINES,
    available_tags: TAGS,
    default_reaction_emoji: { emoji_id: null, emoji_name: "👍" },
  });
  console.log("#suggestions:", res.__err ? `update FAILED ${res.__err} ${res.__body}` : "updated ✓");
  sugg = res.__err ? sugg : res;
} else {
  sugg = await api("POST", `/guilds/${GUILD}/channels`, {
    name: "suggestions",
    type: 15, // forum
    parent_id: floor.id, // inherits Operator-only view from the category
    topic: GUIDELINES,
    available_tags: TAGS,
    default_reaction_emoji: { emoji_id: null, emoji_name: "👍" },
    default_sort_order: 0, // latest activity
    default_forum_layout: 1, // list view
    rate_limit_per_user: 30,
  });
  console.log("#suggestions:", sugg.__err ? `FAILED ${sugg.__err} ${sugg.__body}` : "created ✓");
}

if (!sugg.__err) {
  console.log("  id:", sugg.id);
  console.log(
    "  tags:",
    (sugg.available_tags ?? []).map((t) => `${t.emoji_name} ${t.name}${t.moderated ? " (mods)" : ""}`).join(" · "),
  );
  console.log("  default reaction:", sugg.default_reaction_emoji?.emoji_name ?? "(none)");
  console.log("  slow mode:", sugg.rate_limit_per_user + "s between new threads");
  const parent = channels.find((c) => c.id === sugg.parent_id);
  console.log("  category:", parent?.name, "(Operator-gated, inherited)");
}
