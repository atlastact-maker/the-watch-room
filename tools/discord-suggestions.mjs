#!/usr/bin/env node
// Pull the suggestion forum out of Discord so it can be triaged here.
//
// Needs a bot in the server with View Channels + Read Message History on
// the forum, and:
//   DISCORD_BOT_TOKEN              the bot token (environment secret)
//   DISCORD_SUGGESTIONS_CHANNEL_ID the forum channel id (optional — when
//                                  unset, the first forum channel whose
//                                  name contains "suggest" is used)
//
// Usage: node tools/discord-suggestions.mjs [--json]
// Prints every thread (open and archived): title, tags, reaction count,
// opening post, and the number of replies.

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("DISCORD_BOT_TOKEN is not set");
  process.exit(2);
}
const API = "https://discord.com/api/v10";
const asJson = process.argv.includes("--json");

async function api(path) {
  for (;;) {
    const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bot ${token}` } });
    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      await new Promise((r) => setTimeout(r, Math.ceil((body.retry_after ?? 1) * 1000)));
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}: ${await res.text()}`);
    return res.json();
  }
}

async function findForum() {
  const wanted = process.env.DISCORD_SUGGESTIONS_CHANNEL_ID;
  if (wanted) return api(`/channels/${wanted}`);
  const guilds = await api("/users/@me/guilds");
  for (const g of guilds) {
    const channels = await api(`/guilds/${g.id}/channels`);
    const forum = channels.find((c) => c.type === 15 && /suggest/i.test(c.name));
    if (forum) return forum;
  }
  throw new Error("No forum channel with 'suggest' in its name — set DISCORD_SUGGESTIONS_CHANNEL_ID");
}

async function listThreads(forum) {
  const out = [];
  const active = await api(`/guilds/${forum.guild_id}/threads/active`);
  out.push(...active.threads.filter((t) => t.parent_id === forum.id));
  let before = "";
  for (;;) {
    const page = await api(`/channels/${forum.id}/threads/archived/public?limit=100${before}`);
    out.push(...page.threads);
    if (!page.has_more || page.threads.length === 0) break;
    before = `&before=${page.threads[page.threads.length - 1].thread_metadata.archive_timestamp}`;
  }
  return out;
}

const forum = await findForum();
const tagNames = new Map((forum.available_tags ?? []).map((t) => [t.id, t.name]));
const threads = await listThreads(forum);
const rows = [];
for (const t of threads) {
  const first = await api(`/channels/${t.id}/messages/${t.id}`).catch(() => null);
  const reactions = (first?.reactions ?? []).reduce((n, r) => n + r.count, 0);
  rows.push({
    id: t.id,
    title: t.name,
    tags: (t.applied_tags ?? []).map((id) => tagNames.get(id) ?? id),
    archived: !!t.thread_metadata?.archived,
    replies: t.message_count ?? 0,
    reactions,
    author: first?.author?.username ?? "",
    posted: first?.timestamp ?? "",
    body: first?.content ?? "",
    url: `https://discord.com/channels/${forum.guild_id}/${t.id}`,
  });
}
rows.sort((a, b) => b.reactions - a.reactions || a.posted.localeCompare(b.posted));

if (asJson) {
  console.log(JSON.stringify({ forum: forum.name, threads: rows }, null, 2));
} else {
  console.log(`# ${forum.name} — ${rows.length} thread(s)\n`);
  for (const r of rows) {
    console.log(`## ${r.title}${r.archived ? " (archived)" : ""}`);
    console.log(`${r.author} · ${r.posted.slice(0, 10)} · ${r.reactions} reaction(s) · ${r.replies} repl${r.replies === 1 ? "y" : "ies"}${r.tags.length ? ` · ${r.tags.join(", ")}` : ""}`);
    console.log(r.url);
    console.log();
    console.log(r.body.trim() || "(no text)");
    console.log();
  }
}
