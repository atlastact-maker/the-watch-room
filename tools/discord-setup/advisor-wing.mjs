// Advisory Wing build-out for The Watch Room. Idempotent.
//
// The wing shipped with three channels: a read-only briefing, one SOP
// forum and a chat room. That covers advisors talking TO the dev, but
// not the dev asking a direct question, not per-scenario sign-off (the
// standing rule that no scenario ships unsigned), and not the loop that
// keeps expert volunteers around — proof their input landed.
//
// Layout: a common floor (#roll-call, #verify-this) that every advisor
// reads, then one room per service for the detail that only that service
// cares about, mirroring the five services the advisor application asks
// about. Service rooms are visible to ALL advisors, not gated per
// service — a paramedic reading the fire room is how the JESIP-shaped
// mistakes get caught, and it saves assigning a service role to every
// advisor. (To gate them instead, give each room the matching badge role
// and deny @everyone — one overwrite per channel.)
//
// The voice room is LOCKED by default: advisors can see it but not
// connect, so it reads as "sessions happen here" rather than sitting
// open. Commanders hold Administrator and bypass the lock, so they can
// always drop in and open it for a session.
//
// Run:  node advisor-wing.mjs ./.env
//       node advisor-wing.mjs ./.env --unlock-voice   (open for a session)
//       node advisor-wing.mjs ./.env --lock-voice     (close it again)
import fs from "node:fs";

const env = fs.readFileSync(process.argv[2], "utf8");
const MODE = process.argv.includes("--unlock-voice")
  ? "unlock"
  : process.argv.includes("--lock-voice")
    ? "lock"
    : "build";
const TOKEN = /DISCORD_BOT_TOKEN=(\S+)/.exec(env)?.[1];
const GUILD = /GUILD_ID=(\S+)/.exec(env)?.[1];
const H = { Authorization: `Bot ${TOKEN}`, "Content-Type": "application/json" };
// Retries once on 429 using Discord's own retry_after rather than trusting
// the fixed sleeps — a swallowed 429 would skip a channel or a pin while
// the run still reported success.
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
      // header value stands
    }
    console.log(`  rate limited — waiting ${wait.toFixed(1)}s`);
    await new Promise((res) => setTimeout(res, wait * 1000 + 250));
    return api(method, path, body, true);
  }
  if (!r.ok) return { __err: r.status, __body: text.slice(0, 300) };
  return text ? JSON.parse(text) : {};
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Discord treats `available_tags` as a FULL REPLACEMENT keyed on tag id.
 * Sending tag objects without ids deletes every existing tag and creates
 * fresh ones — which silently strips the tags off every thread that had
 * them. So carry each existing tag's id forward by name, and return null
 * when the set already matches so the PATCH can be skipped entirely.
 */
function mergeTags(current, wanted) {
  const have = new Map((current ?? []).map((t) => [t.name, t]));
  const merged = wanted.map((w) => {
    const hit = have.get(w.name);
    return hit ? { ...w, id: hit.id } : { ...w };
  });
  const same =
    (current ?? []).length === merged.length &&
    merged.every((m) => {
      const hit = have.get(m.name);
      return (
        hit &&
        hit.moderated === m.moderated &&
        (hit.emoji_name ?? null) === (m.emoji_name ?? null)
      );
    });
  return same ? null : merged;
}

// --- Permission bits (raw REST wants decimal strings) ---------------------
const VIEW_CHANNEL = 1n << 10n;
const SEND_MESSAGES = 1n << 11n;
const CONNECT = 1n << 20n;
const SPEAK = 1n << 21n;
const CREATE_PUBLIC_THREADS = 1n << 35n;
const CREATE_PRIVATE_THREADS = 1n << 36n;
const SEND_IN_THREADS = 1n << 38n;
const NO_POSTING =
  SEND_MESSAGES | CREATE_PUBLIC_THREADS | CREATE_PRIVATE_THREADS | SEND_IN_THREADS;
const NO_VOICE = CONNECT | SPEAK;

// --- Copy ----------------------------------------------------------------
const ROLL_CALL_PROMPT = `**Roll call.**

You're in this wing because you've done the job. Post once so everyone knows who's on the watch:

• Service and role — e.g. *Crew Manager, 12 years*
• The patch you know best
• The first thing in the sim you'd change

Serving, retired and previously served all carry the same weight in here. You don't have to name your station, your force or yourself — "control room, north west, 8 years" is a perfectly good introduction.

**Two rules, and they matter more in this wing than anywhere else on the server:**
• Nothing protectively marked, restricted, or that isn't already public.
• No identifiable jobs, patients, colleagues or casework. Ever.`;

const VERIFY_PROMPT = `**Ground truth, fast.**

This is the channel I'll use most. When something in the build hangs on a detail I can't verify from public sources, it gets posted here — usually a screenshot and one direct question:

• "Is this the right PDA for a persons-reported at 03:00?"
• "Would you actually stage there, or is that a nonsense position?"
• "What does the mobilising screen say at this point in the call?"

A one-line answer is worth more than an essay. "No, that's wrong, here's why" is exactly what I need. If you disagree with another advisor, say so — services do things differently and the differences are the useful part.

Nothing in here is urgent. Answer when you're off shift.`;

const SIGN_OFF_GUIDELINES = `Scenario sign-off — one thread per scenario. No scenario ships until someone who has been to one has read it.

Each thread carries the incident, the pre-determined attendance, the caller's script and what the debrief marks the operator on.

Worth flagging: resources (right type, right number, right order) · timings (turnout, travel, how long the job actually takes) · language (what a caller says, what control says, what crews say) · the lesson (is what it teaches actually true?).

Tag your service so I can see who has covered it, and say plainly when you're happy with it.`;

const LIBRARY_GUIDELINES = `Source documents that keep the sim honest — the things I can't get right by guessing.

Useful: published fleet and callsign lists, station lists, public SOPs and policy, mobilising terminology, publicly available clinical guidance, anything already in the public domain.

DO NOT POST: anything protectively marked, restricted or internal-only. Anything carrying names, addresses, incident numbers or patient detail. If you aren't certain it's public, don't post it — describe it instead and I'll work from that.

Always say where it came from. Citing the source is the standing rule for everything in this build.`;

const YOU_SAID_PROMPT = `**You said, we did.**

Every change made to The Watch Room because an advisor said so — logged here with who called it.

Read-only. This is the receipt.`;

// One room per service, mirroring ADVISOR_SERVICES on the application
// form (src/lib/auth/schemas.ts). Visible to every advisor — the split
// is topical, not a permission boundary.
const SERVICE_CHANNELS = [
  {
    name: "fire-rescue",
    topic:
      "Fire & rescue ground — appliances and kit, BA and firefighting, RTCs and technical rescue, wildfire and specialist ops, PDAs and what actually turns out.",
  },
  {
    name: "ambulance",
    topic:
      "Ambulance ground — clinical and casualty care, triage, conveyance and destinations, HEMS tasking, offload and resourcing reality.",
  },
  {
    name: "police",
    topic:
      "Police ground — scene management and cordons, firearms and public order, road policing and closures, NPAS, and the command structure around it.",
  },
  {
    name: "control-room",
    topic:
      "Control room ground — fire control, ambulance EOC and police FCC alike. Call handling, triage, mobilising, and the words that actually get said down the line.",
  },
  {
    name: "other-services",
    topic:
      "Everyone else who turns up — coastguard, mountain and lowland rescue, HART, military aid, local authority, utilities, voluntary aid.",
  },
];

// Forum tags. Sign-off status tags are mod-only so the state of a
// scenario can't be flipped by anyone who fancies it.
const SIGN_OFF_TAGS = [
  { name: "Fire", emoji_name: "🚒", moderated: false },
  { name: "Ambulance", emoji_name: "🚑", moderated: false },
  { name: "Police", emoji_name: "🚓", moderated: false },
  { name: "Control room", emoji_name: "🎧", moderated: false },
  { name: "Aviation", emoji_name: "🚁", moderated: false },
  { name: "Awaiting review", emoji_name: "⏳", moderated: true },
  { name: "Signed off", emoji_name: "✅", moderated: true },
  { name: "Changes needed", emoji_name: "🔧", moderated: true },
];

const LIBRARY_TAGS = [
  { name: "Fleet & callsigns", emoji_name: "🚒", moderated: false },
  { name: "Stations", emoji_name: "🏢", moderated: false },
  { name: "SOPs & policy", emoji_name: "📕", moderated: false },
  { name: "Mobilising", emoji_name: "📟", moderated: false },
  { name: "Clinical", emoji_name: "🩺", moderated: false },
  { name: "Kit & equipment", emoji_name: "🧰", moderated: false },
  { name: "Maps & geography", emoji_name: "🗺", moderated: false },
];

// #sop-review shipped with six ad-hoc tags. Realign them to the nine
// topics the advisor application actually asks about, so a thread can be
// routed to the people who ticked that box on the form.
// Forum tag names are capped at 20 characters, hence the abbreviations.
const SOP_TAGS = [
  { name: "Control & mobilising", emoji_name: "🎧", moderated: false },
  { name: "Command & JESIP", emoji_name: "🎖", moderated: false },
  { name: "BA & firefighting", emoji_name: "🔥", moderated: false },
  { name: "RTC & rescue", emoji_name: "🚗", moderated: false },
  { name: "Clinical & casualty", emoji_name: "🩺", moderated: false },
  { name: "Police ops & scenes", emoji_name: "🚓", moderated: false },
  { name: "Aviation (HEMS/NPAS)", emoji_name: "🚁", moderated: false },
  { name: "Appliances & kit", emoji_name: "🧰", moderated: false },
  { name: "Wildfire & spec ops", emoji_name: "🌾", moderated: false },
];

// --- Guild lookup ---------------------------------------------------------
const channels = await api("GET", `/guilds/${GUILD}/channels`);
if (channels.__err) {
  console.log(
    `Cannot reach the guild (${channels.__err}) — the bot isn't in the server. Re-authorise the invite URL, then re-run.`,
  );
  process.exit(0);
}
const roles = await api("GET", `/guilds/${GUILD}/roles`);
const advisorRole = Array.isArray(roles) ? roles.find((r) => r.name === "Advisor") : null;
const everyoneRole = Array.isArray(roles) ? roles.find((r) => r.name === "@everyone") : null;
if (!advisorRole || !everyoneRole) {
  console.log("Advisor / @everyone role not found — aborting.");
  process.exit(1);
}

const wing = channels.find((c) => c.type === 4 && c.name.includes("ADVISORY WING"));
if (!wing) {
  console.log("ADVISORY WING category not found — run setup.mjs first. Aborting.");
  process.exit(1);
}
console.log(`Advisory Wing: ${wing.name} (${wing.id})\n`);

// Read-only overwrites. Any overwrite unsyncs the channel from its
// category, so the set must restate the category's own gate.
const READ_ONLY = [
  { id: everyoneRole.id, type: 0, deny: String(VIEW_CHANNEL) },
  {
    id: advisorRole.id,
    type: 0,
    allow: String(VIEW_CHANNEL),
    deny: String(NO_POSTING),
  },
];

// Voice, shut. Advisors see the room but cannot connect until a
// Commander opens it; Administrator bypasses overwrites, so Commanders
// are never locked out of their own room.
const VOICE_LOCKED = [
  { id: everyoneRole.id, type: 0, deny: String(VIEW_CHANNEL | NO_VOICE) },
  {
    id: advisorRole.id,
    type: 0,
    allow: String(VIEW_CHANNEL),
    deny: String(NO_VOICE),
  },
];
const VOICE_OPEN = [
  { id: everyoneRole.id, type: 0, deny: String(VIEW_CHANNEL | NO_VOICE) },
  {
    id: advisorRole.id,
    type: 0,
    allow: String(VIEW_CHANNEL | NO_VOICE),
    deny: "0",
  },
];

// --- Lock / unlock mode: flip the voice room and exit ---------------------
if (MODE !== "build") {
  const vc = channels.find(
    (c) => c.type === 2 && c.parent_id === wing.id && /advisor watch room/i.test(c.name),
  );
  if (!vc) {
    console.log("Advisor Watch Room not found — run the build first (no flags).");
    process.exit(1);
  }
  const res = await api("PATCH", `/channels/${vc.id}`, {
    permission_overwrites: MODE === "unlock" ? VOICE_OPEN : VOICE_LOCKED,
  });
  console.log(
    res.__err
      ? `Voice ${MODE} FAILED ${res.__err} ${res.__body}`
      : MODE === "unlock"
        ? "Advisor Watch Room UNLOCKED — advisors can connect. Lock it again with --lock-voice."
        : "Advisor Watch Room LOCKED — advisors can see it but not connect.",
  );
  process.exit(res.__err ? 1 : 0);
}

// --- Channel definitions, in wing order ----------------------------------
const WANTED = [
  {
    name: "roll-call",
    type: 0,
    topic:
      "Who's on the watch. One post each: service and role, the patch you know best, and the first thing you'd change. No identifiable jobs, nothing not already public.",
    prompt: ROLL_CALL_PROMPT,
  },
  {
    name: "verify-this",
    type: 0,
    topic:
      "Dev questions that need a real answer. Screenshot in, ground truth out — one-line replies are perfect. Never urgent; answer when you're off shift.",
    prompt: VERIFY_PROMPT,
  },
  {
    name: "scenario-sign-off",
    type: 15,
    topic: SIGN_OFF_GUIDELINES,
    tags: SIGN_OFF_TAGS,
    rate_limit_per_user: 30,
  },
  {
    name: "reference-library",
    type: 15,
    topic: LIBRARY_GUIDELINES,
    tags: LIBRARY_TAGS,
    rate_limit_per_user: 30,
  },
  // One room per service — see SERVICE_CHANNELS.
  ...SERVICE_CHANNELS.map((s) => ({ name: s.name, type: 0, topic: s.topic })),
  {
    name: "you-said-we-did",
    type: 0,
    topic: "Changes made because an advisor said so. Read-only — this is the receipt.",
    overwrites: READ_ONLY,
    prompt: YOU_SAID_PROMPT,
  },
  {
    name: "Advisor Watch Room",
    type: 2,
    voice: true,
    overwrites: VOICE_LOCKED,
  },
];

const results = [];

for (const want of WANTED) {
  // Case-insensitive: Discord lowercases text channel names on create but
  // leaves voice names as typed, so a strict compare would miss the voice
  // room on a re-run and duplicate it.
  const existing = channels.find(
    (c) =>
      c.name.toLowerCase() === want.name.toLowerCase() && c.parent_id === wing.id,
  );

  if (existing) {
    // Converge the existing channel rather than duplicating it. Only send
    // what actually differs: renaming or re-topicking a channel is capped
    // at 2 changes per 10 minutes, so an unconditional PATCH would 429 on
    // a third run inside that window.
    const patch = {};
    if (!want.voice && want.topic && existing.topic !== want.topic) {
      patch.topic = want.topic;
    }
    if (want.tags) {
      const merged = mergeTags(existing.available_tags, want.tags);
      if (merged) patch.available_tags = merged;
    }
    // Restore the gate if someone re-synced the channel to its category
    // in the Discord UI — otherwise a read-only room silently becomes
    // writable and every later run still prints "exists ✓".
    if (want.overwrites) patch.permission_overwrites = want.overwrites;
    if (want.rate_limit_per_user && existing.rate_limit_per_user !== want.rate_limit_per_user) {
      patch.rate_limit_per_user = want.rate_limit_per_user;
    }
    const res = Object.keys(patch).length
      ? await api("PATCH", `/channels/${existing.id}`, patch)
      : existing;
    console.log(
      `#${want.name}: exists ✓${
        res.__err
          ? ` (update FAILED ${res.__err} ${res.__body})`
          : Object.keys(patch).length
            ? " — updated"
            : ""
      }`,
    );
    results.push({ want, chan: res.__err ? existing : res, created: false });
    await sleep(300);
    continue;
  }

  // Voice channels reject `topic`, but do take permission overwrites —
  // which is how the room ships locked.
  const body = { name: want.name, type: want.type, parent_id: wing.id };
  if (!want.voice && want.topic) body.topic = want.topic;
  if (want.overwrites) body.permission_overwrites = want.overwrites;
  if (want.tags) {
    body.available_tags = want.tags;
    body.default_sort_order = 0; // latest activity
    body.default_forum_layout = 1; // list view
  }
  if (want.rate_limit_per_user) body.rate_limit_per_user = want.rate_limit_per_user;

  const chan = await api("POST", `/guilds/${GUILD}/channels`, body);
  console.log(
    `#${want.name}:`,
    chan.__err ? `FAILED ${chan.__err} ${chan.__body}` : "created ✓",
  );
  results.push({ want, chan, created: !chan.__err });
  await sleep(400);
}

// --- Retag #sop-review to the application's own topic taxonomy -----------
const sop = channels.find((c) => c.name === "sop-review" && c.parent_id === wing.id);
if (sop) {
  const merged = mergeTags(sop.available_tags, SOP_TAGS);
  if (!merged) {
    console.log("\n#sop-review tags: already aligned ✓");
  } else {
    const res = await api("PATCH", `/channels/${sop.id}`, { available_tags: merged });
    console.log(
      "\n#sop-review tags:",
      res.__err
        ? `update FAILED ${res.__err} ${res.__body}`
        : "realigned to the advisor application topics ✓",
    );
  }
} else {
  console.log("\n#sop-review: not found (skipped retag)");
}

// --- Pinned prompts, only where the channel has no pins yet --------------
console.log("");
for (const { want, chan } of results) {
  if (!want.prompt || chan.__err || !chan.id) continue;
  const pins = await api("GET", `/channels/${chan.id}/messages/pins`);
  // Fail CLOSED: if the pin check itself errors we must not fall through
  // and post a second copy of the prompt.
  if (pins.__err) {
    console.log(`#${want.name}: pin check FAILED ${pins.__err} — skipping prompt`);
    continue;
  }
  const pinned = Array.isArray(pins) ? pins : pins?.items;
  if (!Array.isArray(pinned)) {
    console.log(`#${want.name}: unexpected pins response — skipping prompt`);
    continue;
  }
  if (pinned.length > 0) {
    console.log(`#${want.name}: already pinned ✓`);
    continue;
  }
  const msg = await api("POST", `/channels/${chan.id}/messages`, {
    content: want.prompt,
  });
  if (msg.__err) {
    console.log(`#${want.name}: prompt FAILED ${msg.__err} ${msg.__body}`);
    continue;
  }
  const pin = await api("PUT", `/channels/${chan.id}/messages/pins/${msg.id}`);
  console.log(
    `#${want.name}: prompt posted${pin.__err ? ` (pin FAILED ${pin.__err} ${pin.__body})` : " + pinned ✓"}`,
  );
  await sleep(400);
}

// --- Order the wing ------------------------------------------------------
const ORDER = [
  "advisor-briefing",
  "roll-call",
  "verify-this",
  "fire-rescue",
  "ambulance",
  "police",
  "control-room",
  "other-services",
  "sop-review",
  "scenario-sign-off",
  "reference-library",
  "ask-the-devs",
  "you-said-we-did",
];
const after = await api("GET", `/guilds/${GUILD}/channels`);
if (Array.isArray(after)) {
  const positions = ORDER.map((name, i) => {
    const c = after.find((x) => x.name === name && x.parent_id === wing.id);
    return c ? { id: c.id, position: i } : null;
  }).filter(Boolean);
  if (positions.length) {
    const res = await api("PATCH", `/guilds/${GUILD}/channels`, positions);
    console.log(
      "\nWing order:",
      res.__err ? `reorder FAILED ${res.__err} ${res.__body}` : "set ✓",
    );
  }
}

console.log(`
Advisory Wing now runs:
  #advisor-briefing    what's being built, what input is needed   (read-only)
  #roll-call           who's on the watch
  #verify-this         dev -> advisors, ground truth fast
  #fire-rescue         fire & rescue ground
  #ambulance           ambulance ground
  #police              police ground
  #control-room        fire control / EOC / FCC
  #other-services      coastguard, MR, HART, military aid, LA
  #sop-review          forum, retagged to the application topics
  #scenario-sign-off   forum, one thread per scenario
  #reference-library   forum, source documents only
  #ask-the-devs        advisors -> dev
  #you-said-we-did     changes made because an advisor said so    (read-only)
  Advisor Watch Room   voice, LOCKED until a Commander opens it

The service rooms are visible to every advisor — the split is topical,
not a permission boundary.

Opening the voice room for a session:
  node advisor-wing.mjs ./.env --unlock-voice     then --lock-voice after
Or in Discord: Advisor Watch Room -> Edit Channel -> Permissions ->
Advisor -> turn Connect green. Commanders can always join regardless.
`);
