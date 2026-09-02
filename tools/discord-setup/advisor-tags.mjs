// Per-service advisor tags for The Watch Room. Idempotent.
//
// The wing has one Advisor role, which grants access. It says somebody
// has been vetted; it does not say what they were vetted FOR. In a room
// where the whole point is expertise, "which service?" is the first thing
// anyone wants to know — so these five tags carry it in the member list.
//
// DELIBERATELY NOT SELF-SELECT. Every other identity role on this server
// is picked from a panel in #roles, but an advisor tag is a claim about
// somebody's career. It is assigned by a Commander after the application
// is accepted, the same way the Advisor role itself is. Putting these on
// a reaction panel would hand out the one badge that is supposed to mean
// something.
//
// Colours match the service insignia the site already draws on advisor
// profiles (src/app/components/service-insignia.tsx), so a fire advisor
// is the same red in Discord as on the website.
//
// Run: node advisor-tags.mjs ./.env
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

// Mirrors ADVISOR_SERVICES on the application form, in the order the form
// offers them. Control room is its own tag rather than being folded into
// "other" — it is a distinct service on the form, and for an operator
// game it is arguably the most relevant expertise in the building.
const TAGS = [
  { name: "Advisor · Fire", colour: 0xdc2626, note: "Fire & Rescue" },
  { name: "Advisor · Ambulance", colour: 0x15803d, note: "Ambulance" },
  { name: "Advisor · Police", colour: 0x1d4ed8, note: "Police" },
  { name: "Advisor · Control Room", colour: 0x7c3aed, note: "Control Room / 999" },
  { name: "Advisor · Other", colour: 0x52525b, note: "Other service" },
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

const created = [];
for (const t of TAGS) {
  const existing = roles.find((r) => r.name === t.name);
  if (existing) {
    // Converge the colour in case the palette moved, but never touch
    // anyone's membership.
    if (existing.color !== t.colour) {
      const res = await api("PATCH", `/guilds/${GUILD}/roles/${existing.id}`, {
        color: t.colour,
      });
      console.log(
        `${t.name}: exists ✓${res.__err ? ` (recolour FAILED ${res.__err})` : " — recoloured"}`,
      );
    } else {
      console.log(`${t.name}: exists ✓`);
    }
    created.push({ ...t, id: existing.id });
    continue;
  }
  const res = await api("POST", `/guilds/${GUILD}/roles`, {
    name: t.name,
    color: t.colour,
    // Hoisted so the member list groups advisors by service — the whole
    // reason for having them.
    hoist: true,
    mentionable: true,
    permissions: "0",
  });
  console.log(
    `${t.name}:`,
    res.__err ? `FAILED ${res.__err} ${res.__body}` : "created ✓",
  );
  if (!res.__err) created.push({ ...t, id: res.id });
  await sleep(350);
}

// Sit the tags directly ABOVE the Advisor role, so Discord hoists members
// under their service rather than under the generic Advisor heading.
if (created.length > 0) {
  const positions = created.map((t, i) => ({
    id: t.id,
    position: advisor.position + created.length - i,
  }));
  const res = await api("PATCH", `/guilds/${GUILD}/roles`, positions);
  console.log(
    "\nOrder:",
    res.__err
      ? `reposition FAILED ${res.__err} ${res.__body} (drag them above Advisor by hand)`
      : "tags sit above Advisor ✓",
  );
}

console.log(`
Advisor tags:
${created.map((t) => `  ${t.name.padEnd(26)} ${t.note}`).join("\n")}

These are NOT self-select. Assign one by hand when you accept an
application — the applicant's service is on their application in /admin,
so the right tag is already recorded. They sit alongside the Advisor
role, which is what actually opens the wing; the tag only says what for.
`);
