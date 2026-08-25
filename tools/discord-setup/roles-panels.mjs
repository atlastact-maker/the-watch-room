// Self-select role system for The Watch Room. Idempotent: safe to re-run.
//
// Design rule: self-select roles NEVER grant access or imply credentials.
// Operator comes from the ✅ check-in gate, Pre-Alpha Tester is invite-only,
// Advisor is vetted at sign-up on the site. These panels are identity and
// notification only.
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- 1. New self-select roles --------------------------------------------
const NEW_ROLES = [
  { name: "Pre-Alpha Waitlist", color: 0x60a5fa },
  { name: "Content Creator", color: 0xa855f7 },
];
let roles = await api("GET", `/guilds/${GUILD}/roles`);
for (const r of NEW_ROLES) {
  if (roles.some((x) => x.name === r.name)) {
    console.log(`role "${r.name}": exists ✓`);
    continue;
  }
  const res = await api("POST", `/guilds/${GUILD}/roles`, {
    name: r.name,
    color: r.color,
    hoist: false,
    mentionable: false,
    permissions: "0",
  });
  console.log(`role "${r.name}":`, res.__err ? `FAILED ${res.__err} ${res.__body}` : "created ✓");
  await sleep(300);
}
roles = await api("GET", `/guilds/${GUILD}/roles`);

// --- 2. #roles channel, in CHECK-IN, right after #verify ------------------
let channels = await api("GET", `/guilds/${GUILD}/channels`);
const checkIn = channels.find((c) => c.type === 4 && c.name.includes("CHECK-IN"));
let rolesChan = channels.find((c) => c.name === "roles" && c.parent_id === checkIn.id);
if (!rolesChan) {
  rolesChan = await api("POST", `/guilds/${GUILD}/channels`, {
    name: "roles",
    type: 0,
    parent_id: checkIn.id,
    position: 1, // between #verify and #introductions
    topic: "Pick your service, your patch and your pings. Nothing here unlocks channels — that's the ✅ check-in next door.",
    // No overwrites: syncs with CHECK-IN (everyone reads + reacts, nobody posts).
  });
  console.log("#roles:", rolesChan.__err ? `FAILED ${rolesChan.__err} ${rolesChan.__body}` : "created ✓");
} else {
  console.log("#roles: exists ✓");
}

// --- 3. Panels ------------------------------------------------------------
const PANELS = [
  {
    key: "service",
    content: `**🎛️ Which service pulls you?**
Flag what you'd run first — take as many as you like.

🚒 — **Fire**
🚑 — **Ambulance**
🚓 — **Police**`,
    reactions: ["🚒", "🚑", "🚓"],
    map: { "🚒": "Fire", "🚑": "Ambulance", "🚓": "Police" },
  },
  {
    key: "patch",
    content: `**🗺️ Where's your patch?**
Whereabouts are you watching from? One's plenty.

🏔️ — **Scotland**
🏭 — **North**
🎯 — **Midlands**
🐉 — **Wales**
🌊 — **South**
🎡 — **London**
🧭 — **Northern Ireland**
🌍 — **Overseas**`,
    reactions: ["🏔️", "🏭", "🎯", "🐉", "🌊", "🎡", "🧭", "🌍"],
    map: {
      "🏔️": "Patch: Scotland",
      "🏭": "Patch: North",
      "🎯": "Patch: Midlands",
      "🐉": "Patch: Wales",
      "🌊": "Patch: South",
      "🎡": "Patch: London",
      "🧭": "Patch: Northern Ireland",
      "🌍": "Patch: Overseas",
    },
  },
  {
    key: "interests",
    content: `**📌 Anything else?**

🎫 — **Pre-Alpha Waitlist** — you want a seat when test waves open
🎥 — **Content Creator** — you stream or make videos

*A note on the roles you can't pick here: **Operator** is the ✅ check-in next door — that's what opens the floor. **Pre-Alpha Tester** is invited from the waitlist above. **Advisor** is for serving and former emergency services personnel, and is verified when you register on the site.*`,
    reactions: ["🎫", "🎥"],
    map: { "🎫": "Pre-Alpha Waitlist", "🎥": "Content Creator" },
  },
];

const existing = await api("GET", `/channels/${rolesChan.id}/messages?limit=50`);
const already = existing.__err ? [] : existing;

console.log("\n== PANELS ==");
for (const panel of PANELS) {
  const head = panel.content.split("\n")[0];
  const found = already.find((m) => m.content.startsWith(head));
  let msg = found;
  if (!msg) {
    msg = await api("POST", `/channels/${rolesChan.id}/messages`, { content: panel.content });
    if (msg.__err) {
      console.log(`panel ${panel.key}: FAILED ${msg.__err} ${msg.__body}`);
      continue;
    }
    await sleep(400);
    for (const emoji of panel.reactions) {
      const res = await api(
        "PUT",
        `/channels/${rolesChan.id}/messages/${msg.id}/reactions/${encodeURIComponent(emoji)}/@me`,
      );
      if (res.__err) console.log(`  reaction ${emoji}: FAILED ${res.__err}`);
      await sleep(320);
    }
  }
  console.log(`\npanel ${panel.key} — message id ${msg.id} ${found ? "(existing)" : "(posted ✓)"}`);
  for (const [emoji, roleName] of Object.entries(panel.map)) {
    const role = roles.find((r) => r.name === roleName);
    console.log(`   ${emoji}  →  ${roleName}${role ? "" : "   ⚠ ROLE MISSING"}`);
  }
}

console.log("\n#roles channel id:", rolesChan.id);
