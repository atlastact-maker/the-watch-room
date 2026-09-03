// SUPERSEDED for the five per-service rooms, 2026-09-03. The owner's
// decision changed: a fire advisor should NOT see the ambulance or police
// rooms. advisor-service-split.mjs partitions them. Running THIS script
// afterwards reopens all five to every advisor tag and undoes that.
//
// Give every per-service advisor tag the same view of the Advisory Wing
// that the Advisor role has. Idempotent.
//
// The five tags (advisor-tags.mjs) were created with no permissions of
// their own — they say WHAT someone was vetted for, and the Advisor role
// was meant to say THAT they were. That leaves a trap: a member given a
// tag without the Advisor role sees nothing. So each tag now carries,
// on every wing channel, an exact copy of whatever the Advisor role is
// allowed and denied there — read-only stays read-only, the locked voice
// room stays locked, and any change made to the Advisor overwrite later
// is picked up by re-running this.
//
// Per-overwrite PUTs, not a channel PATCH, so nothing else on a channel
// is touched. Channels that inherit from the category (no overwrites of
// their own) are left to inherit — the category gets the copy too.
//
// Run:  node advisor-tags-access.mjs ./.env
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

// The tags, exactly as advisor-tags.mjs names them.
const TAG_NAMES = [
  "Advisor · Fire",
  "Advisor · Ambulance",
  "Advisor · Police",
  "Advisor · Control Room",
  "Advisor · Other",
];

const roles = await api("GET", `/guilds/${GUILD}/roles`);
if (roles.__err) {
  console.log(
    `Cannot reach the guild (${roles.__err}) — the bot isn't in the server. Re-authorise the invite URL, then re-run.`,
  );
  process.exit(0);
}
const advisor = roles.find((r) => r.name === "Advisor");
if (!advisor) {
  console.log("No Advisor role found — run setup.mjs first. Aborting.");
  process.exit(1);
}
const tags = TAG_NAMES.map((n) => roles.find((r) => r.name === n)).filter(Boolean);
if (tags.length === 0) {
  console.log("No advisor tags found — run advisor-tags.mjs first. Aborting.");
  process.exit(1);
}
if (tags.length < TAG_NAMES.length) {
  console.log(
    `Only ${tags.length} of ${TAG_NAMES.length} tags found (${tags.map((t) => t.name).join(", ")}) — carrying on with those.`,
  );
}

const channels = await api("GET", `/guilds/${GUILD}/channels`);
const wing = channels.find((c) => c.type === 4 && c.name.includes("ADVISORY WING"));
if (!wing) {
  console.log("ADVISORY WING category not found — run advisor-wing.mjs first. Aborting.");
  process.exit(1);
}
const targets = [wing, ...channels.filter((c) => c.parent_id === wing.id)];
console.log(`Advisory Wing: ${wing.name} — ${targets.length - 1} channels\n`);

let written = 0;
let unchanged = 0;
let inherited = 0;
let failed = 0;

for (const ch of targets) {
  const ows = ch.permission_overwrites ?? [];
  const src = ows.find((o) => o.id === advisor.id && o.type === 0);
  const label = ch.type === 4 ? `[category] ${ch.name}` : `#${ch.name}`;
  if (!src) {
    // No Advisor overwrite here: the channel inherits the category's,
    // and so will the tags once the category carries the copy.
    inherited++;
    console.log(`${label}: inherits from category`);
    continue;
  }
  for (const tag of tags) {
    const have = ows.find((o) => o.id === tag.id && o.type === 0);
    if (have && have.allow === src.allow && have.deny === src.deny) {
      unchanged++;
      continue;
    }
    const res = await api("PUT", `/channels/${ch.id}/permissions/${tag.id}`, {
      type: 0,
      allow: src.allow,
      deny: src.deny,
    });
    if (res.__err) {
      failed++;
      console.log(`${label} ← ${tag.name}: FAILED ${res.__err} ${res.__body}`);
    } else {
      written++;
      console.log(`${label} ← ${tag.name}: copied Advisor's overwrite ✓`);
    }
    await sleep(300);
  }
}

console.log(`
Done. ${written} overwrite${written === 1 ? "" : "s"} written, ${unchanged} already right, ${inherited} channel${inherited === 1 ? "" : "s"} inheriting from the category${failed ? `, ${failed} FAILED` : ""}.

Every advisor tag now sees exactly what the Advisor role sees across the
wing. Re-run after changing any wing channel's Advisor permissions and
the tags follow.
`);
