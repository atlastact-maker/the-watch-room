// Read-only audit of The Watch Room Discord server vs the blueprint.
// Never prints the token.
import fs from "node:fs";

const env = fs.readFileSync(process.argv[2], "utf8");
const TOKEN = /DISCORD_BOT_TOKEN=(\S+)/.exec(env)?.[1];
const GUILD = /GUILD_ID=(\S+)/.exec(env)?.[1];
if (!TOKEN || !GUILD) {
  console.log("env missing token or guild id");
  process.exit(1);
}
const H = { Authorization: `Bot ${TOKEN}` };
const api = async (path) => {
  const r = await fetch(`https://discord.com/api/v10${path}`, { headers: H });
  if (!r.ok) return { __err: r.status, __body: (await r.text()).slice(0, 200) };
  return r.json();
};

const guild = await api(`/guilds/${GUILD}?with_counts=true`);
if (guild.__err) {
  console.log("GUILD FETCH FAILED:", guild.__err, guild.__body, "— bot likely kicked or token reset");
  process.exit(0);
}
console.log("== GUILD ==");
console.log("name:", guild.name, "| members:", guild.approximate_member_count, "| online:", guild.approximate_presence_count);
console.log("community:", guild.features.includes("COMMUNITY"), "| verification_level:", guild.verification_level);
console.log("icon set:", !!guild.icon, "| banner:", !!guild.banner);
console.log("rules_channel:", guild.rules_channel_id, "| updates_channel:", guild.public_updates_channel_id, "| system_channel:", guild.system_channel_id);
console.log("features:", guild.features.filter((f) => ["COMMUNITY", "GUILD_ONBOARDING", "GUILD_ONBOARDING_ENABLED", "WELCOME_SCREEN_ENABLED", "DISCOVERABLE"].includes(f)).join(", ") || "(none of interest)");

const channels = await api(`/guilds/${GUILD}/channels`);
console.log("\n== CHANNELS ==", channels.length);
const typeName = { 0: "text", 2: "voice", 4: "category", 5: "announce", 15: "forum" };
const byParent = new Map();
for (const c of channels.sort((a, b) => a.position - b.position)) {
  if (c.type === 4) continue;
  const key = c.parent_id ?? "(root)";
  if (!byParent.has(key)) byParent.set(key, []);
  byParent.get(key).push(`${c.name}[${typeName[c.type] ?? c.type}]`);
}
for (const cat of channels.filter((c) => c.type === 4).sort((a, b) => a.position - b.position)) {
  console.log(` ${cat.name}: ${(byParent.get(cat.id) ?? []).join(", ")}`);
}
if (byParent.has("(root)")) console.log(" (root):", byParent.get("(root)").join(", "));

const roles = await api(`/guilds/${GUILD}/roles`);
console.log("\n== ROLES ==", roles.length);
console.log(roles.sort((a, b) => b.position - a.position).map((r) => r.name).join(" · "));

const invites = await api(`/guilds/${GUILD}/invites`);
console.log("\n== INVITES ==");
if (invites.__err) console.log("cannot list:", invites.__err);
else
  for (const i of invites)
    console.log(` discord.gg/${i.code} — uses ${i.uses}${i.max_uses ? "/" + i.max_uses : ""} · expires ${i.max_age === 0 ? "never" : i.max_age + "s"} · channel #${i.channel?.name}`);

const onboarding = await api(`/guilds/${GUILD}/onboarding`);
console.log("\n== ONBOARDING ==");
if (onboarding.__err) console.log("cannot read:", onboarding.__err);
else console.log("enabled:", onboarding.enabled, "| prompts:", onboarding.prompts?.length ?? 0, "| default channels:", onboarding.default_channel_ids?.length ?? 0);

// Verify channel content + reactions
const verify = channels.find((c) => c.name === "verify");
if (verify) {
  const msgs = await api(`/channels/${verify.id}/messages?limit=10`);
  console.log("\n== #verify MESSAGES ==");
  if (msgs.__err) console.log("cannot read:", msgs.__err);
  else
    for (const m of [...msgs].reverse())
      console.log(
        ` [${m.id}] by ${m.author.username}${m.author.bot ? " (bot)" : ""}: ${m.content.slice(0, 60).replace(/\n/g, " ")}… reactions: ${(m.reactions ?? []).map((r) => `${r.emoji.name}×${r.count}`).join(" ") || "none"}`,
      );
}
const rules = channels.find((c) => c.name === "rules-of-the-watch");
if (rules) {
  const msgs = await api(`/channels/${rules.id}/messages?limit=5`);
  console.log("\n== #rules MESSAGES ==", msgs.__err ? "cannot read" : msgs.length + " message(s)");
}

// Carl-bot present? Try member search (may 403 without privileged intent).
const search = await api(`/guilds/${GUILD}/members/search?query=carl&limit=5`);
const duty = await api(`/guilds/${GUILD}/members/search?query=duty&limit=5`);
console.log("\n== BOTS ==");
const show = (label, res) => {
  if (res.__err) console.log(` ${label}: search failed (${res.__err})`);
  else console.log(` ${label}:`, res.map((m) => `${m.user.username}${m.nick ? " nick:" + m.nick : ""} roles:${m.roles.length}`).join(" | ") || "no match");
};
show("carl*", search);
show("duty*", duty);

// Webhooks (deploy feeds etc.)
const hooks = await api(`/guilds/${GUILD}/webhooks`);
console.log("\n== WEBHOOKS ==", hooks.__err ? "cannot read" : hooks.length);
