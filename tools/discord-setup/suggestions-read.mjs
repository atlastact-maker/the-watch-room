#!/usr/bin/env node
// Pull the #suggestions forum out of Discord so it can be triaged.
//
// Reads the same .env as the other scripts here (DISCORD_BOT_TOKEN and
// GUILD_ID), or the environment when no file is given. The bot needs
// View Channels + Read Message History on the forum — the setup bot's
// Administrator grant covers it, so re-invite that and kick it after.
//
// Usage: node suggestions-read.mjs [.env] [--json] [--out suggestions.md]
// Prints every thread (open and archived) sorted by 👍 weight: title,
// tags, reactions, reply count and the opening post. --out writes the
// same as Markdown so it can be pasted or dropped in a session.

import fs from "node:fs";

const args = process.argv.slice(2);
const envPath = args.find((a) => !a.startsWith("--") && a !== args[args.indexOf("--out") + 1]);
let token = process.env.DISCORD_BOT_TOKEN;
let guildId = process.env.GUILD_ID;
if (envPath && fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, "utf8");
  token = /DISCORD_BOT_TOKEN=(\S+)/.exec(env)?.[1] ?? token;
  guildId = /GUILD_ID=(\S+)/.exec(env)?.[1] ?? guildId;
}
if (!token) {
  console.error("DISCORD_BOT_TOKEN is not set (pass the .env path or export it)");
  process.exit(2);
}
const asJson = args.includes("--json");
const outPath = args.includes("--out") ? args[args.indexOf("--out") + 1] : null;
const API = "https://discord.com/api/v10";

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
  const guilds = guildId ? [{ id: guildId }] : await api("/users/@me/guilds");
  for (const g of guilds) {
    const channels = await api(`/guilds/${g.id}/channels`);
    const forum = channels.find((c) => c.type === 15 && c.name === "suggestions") ?? channels.find((c) => c.type === 15 && /suggest/i.test(c.name));
    if (forum) return forum;
  }
  throw new Error("No #suggestions forum found — set DISCORD_SUGGESTIONS_CHANNEL_ID");
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

const lines = [`# ${forum.name} — ${rows.length} thread(s)`, ""];
for (const r of rows) {
  lines.push(`## ${r.title}${r.archived ? " (archived)" : ""}`);
  lines.push(`${r.author} · ${r.posted.slice(0, 10)} · ${r.reactions} reaction(s) · ${r.replies} repl${r.replies === 1 ? "y" : "ies"}${r.tags.length ? ` · ${r.tags.join(", ")}` : ""}`);
  lines.push(r.url, "", r.body.trim() || "(no text)", "");
}
const text = asJson ? JSON.stringify({ forum: forum.name, threads: rows }, null, 2) : lines.join("\n");
if (outPath) {
  fs.writeFileSync(outPath, text + "\n");
  console.log(`${rows.length} thread(s) written to ${outPath}`);
} else {
  console.log(text);
}
