// Make the Advisory Wing's per-service rooms a real permission boundary.
// Idempotent.
//
// They were built the other way round on purpose: advisor-tags-access.mjs
// gave every advisor tag sight of every room, on the reasoning that the
// split was topical and a fire advisor reading the ambulance room was a
// feature. The owner has since decided otherwise — a fire advisor should
// see the fire room and nothing else — so this closes it.
//
// HOW IT WORKS, because it is not obvious. The category grants VIEW to the
// base `Advisor` role, which is what puts the wing on screen at all. If a
// service room simply dropped the other tags it would still be visible to
// everyone, because that category-level allow would carry through. So each
// service room DENIES the base `Advisor` role and ALLOWS only its own tag.
//
// Discord resolves role overwrites by OR-ing all the denies, applying
// them, then OR-ing all the allows and applying those — so allow wins. An
// advisor holding `Advisor` + `Advisor · Fire` is denied by the first and
// allowed by the second, and sees the room. The same person on #ambulance
// has only the deny, and does not. Somebody holding several tags sees
// several rooms, which is correct.
//
// The shared rooms — briefing, verify-this, the forums, ask-the-devs — are
// deliberately untouched. The wing is still one place; only the five
// service rooms are partitioned.
//
// Commanders are unaffected throughout: Administrator bypasses channel
// overwrites entirely, so they see every room without needing an entry.
//
// Run:  node advisor-service-split.mjs ./.env
//   or: npm run advisor-split
//   Undo: node advisor-service-split.mjs ./.env --open
import fs from "node:fs";

const env = fs.readFileSync(process.argv[2] ?? "./.env", "utf8");
const TOKEN = /DISCORD_BOT_TOKEN=(\S+)/.exec(env)?.[1];
const GUILD = /GUILD_ID=(\S+)/.exec(env)?.[1];
const OPEN = process.argv.includes("--open");
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

const VIEW_CHANNEL = 1n << 10n;
const SEND_MESSAGES = 1n << 11n;
const READ_HISTORY = 1n << 16n;
const CREATE_PUBLIC_THREADS = 1n << 35n;
const SEND_IN_THREADS = 1n << 38n;

/** Room → the one advisor tag that may see it. */
const SERVICE_ROOMS = {
  "fire-rescue": "Advisor · Fire",
  ambulance: "Advisor · Ambulance",
  police: "Advisor · Police",
  "control-room": "Advisor · Control Room",
  "other-services": "Advisor · Other",
};

const roles = await api("GET", `/guilds/${GUILD}/roles`);
if (roles.__err) {
  console.log(`Cannot reach the guild (${roles.__err}) — is the setup bot still in the server?`);
  process.exit(1);
}
const byName = (n) => roles.find((r) => r.name === n);
const everyone = byName("@everyone");
const advisor = byName("Advisor");
const dutyOfficer = byName("The Duty Officer");
if (!everyone || !advisor) {
  console.log("@everyone or the base Advisor role is missing — aborting.");
  process.exit(1);
}

const channels = await api("GET", `/guilds/${GUILD}/channels`);
const cat = channels.find((c) => c.type === 4 && /ADVISORY/i.test(c.name));
if (!cat) {
  console.log("ADVISORY WING category not found — run advisor-wing.mjs first. Aborting.");
  process.exit(1);
}

const ALLOW_FULL = String(
  VIEW_CHANNEL | SEND_MESSAGES | READ_HISTORY | CREATE_PUBLIC_THREADS | SEND_IN_THREADS,
);

let changed = 0;
let missing = 0;
for (const [room, tagName] of Object.entries(SERVICE_ROOMS)) {
  const chan = channels.find((c) => c.parent_id === cat.id && c.name === room);
  if (!chan) {
    console.log(`#${room}: not found — skipped`);
    missing++;
    continue;
  }
  const tag = byName(tagName);
  if (!tag) {
    console.log(`#${room}: role "${tagName}" does not exist — skipped rather than left half-open`);
    missing++;
    continue;
  }

  const overwrites = [{ id: everyone.id, type: 0, allow: "0", deny: String(VIEW_CHANNEL) }];

  if (OPEN) {
    // Undo: every advisor tag sees every room again.
    for (const r of roles.filter((x) => /^Advisor/.test(x.name))) {
      overwrites.push({ id: r.id, type: 0, allow: ALLOW_FULL, deny: "0" });
    }
  } else {
    // The base role is denied so the category's allow cannot carry
    // through; the room's own tag allows it back for the people who
    // hold it.
    overwrites.push({ id: advisor.id, type: 0, allow: "0", deny: String(VIEW_CHANNEL) });
    overwrites.push({ id: tag.id, type: 0, allow: ALLOW_FULL, deny: "0" });
  }
  if (dutyOfficer) {
    overwrites.push({ id: dutyOfficer.id, type: 0, allow: ALLOW_FULL, deny: "0" });
  }

  const res = await api("PATCH", `/channels/${chan.id}`, { permission_overwrites: overwrites });
  if (res.__err) {
    console.log(`#${room}: FAILED ${res.__err} ${res.__body}`);
  } else {
    console.log(
      OPEN
        ? `#${room}: reopened to every advisor tag ✓`
        : `#${room}: ${tagName} only ✓`,
    );
    changed++;
  }
  await sleep(350);
}

console.log(`
${changed} room(s) set${missing ? `, ${missing} skipped` : ""}.

${
  OPEN
    ? "Every advisor tag can see every service room again."
    : `A fire advisor now sees #fire-rescue and not #ambulance or #police.
Somebody holding two tags sees both their rooms. Somebody holding the base
Advisor role and no service tag sees the shared rooms — briefing,
verify-this, the forums, ask-the-devs — but none of the five service
rooms, which is worth knowing when you hand out tags.`
}

Commanders are unaffected either way: Administrator bypasses channel
overwrites, so they see everything.

NOTE: advisor-tags-access.mjs opens these rooms back up to every tag. Do
not run it after this one unless that is what you want.
`);
