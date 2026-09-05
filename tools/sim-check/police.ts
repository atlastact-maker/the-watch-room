// The police volume jobs, checked for the things the general scenario
// harness does not know to look for: that a police call carries a THRIVE
// grade and says where its minutes came from, that a Grade 4 really is a
// no-deployment job and vice versa, that the attendance is sized like a
// real one, and that the records behind it obey the house rules —
// fictional people, drama-range phone numbers, ids that say which job
// they belong to.

import { SCENARIOS } from "@/lib/sim/scenarios";
import { SCENARIO_RECORDS } from "@/lib/sim/records/index";
import type { Scenario } from "@/lib/sim/incident_types";

type Problem = { id: string; kind: string; detail: string };
const problems: Problem[] = [];
const note = (s: { id: string }, kind: string, detail: string) =>
  problems.push({ id: s.id, kind, detail });

const police = SCENARIOS.filter((s) => s.type.startsWith("police_"));
const isStub = (s: Scenario) => s.trigger.startsWith("Placeholder");

// The stations that hold each police type, so a slot can be checked
// against what is actually there.
const POLICE_TYPES_AT: Record<string, string[]> = {
  "MP-TRA": ["Police_Response", "Police_Dog"],
  "MP-TAC": ["Police_ARV", "Police_Dog"],
  "MP-RPU": ["Police_RPU"],
  "MP-RPU-ASH": ["Police_RPU"],
  "MP-RPU-WHI": ["Police_RPU"],
  "MP-NPAS": ["Police_NPAS"],
  "MP-SIO": ["Police_SIO"],
  "MP-POLSA": ["Police_Search"],
};

const DRAMA_MOBILE = /^07700\s?900\d{3}$/;
const DRAMA_LANDLINE = /^0161\s?496\s?0\d{3}$/;

for (const s of police) {
  if (isStub(s)) {
    note(s, "STILL A STUB", s.title);
    continue;
  }

  // -- Grading ---------------------------------------------------------------
  const g = s.callGrade;
  if (!g) {
    note(s, "NO CALL GRADE", "police scenario without callGrade");
  } else {
    if (g.scale !== "police_thrive") note(s, "WRONG GRADING SCALE", g.scale);
    if (!g.basis || g.basis.length < 20 || /placeholder/i.test(g.basis)) {
      note(s, "GRADE WITHOUT A BASIS", g.basis ?? "(none)");
    }
    if (g.scale === "police_thrive") {
      // GMP: 1 Immediate (15), 2 Priority (60), C Central Resolution,
      // L Local Resolution, P Police Generated. The letters carry no
      // attendance clock; a disposal job is a Grade C and nothing else.
      if (g.grade === 1 && g.standardMinutes !== 15) note(s, "GRADE 1 STANDARD IS 15 MIN", String(g.standardMinutes));
      if (g.grade === 2 && g.standardMinutes !== 60) note(s, "GRADE 2 STANDARD IS 60 MIN", String(g.standardMinutes));
      if (typeof g.grade === "string" && g.standardMinutes !== null) note(s, "RESOLUTION GRADE WITH A CLOCK", `grade ${g.grade} carries ${g.standardMinutes} min`);
      if (g.grade === "C" && !s.disposal) note(s, "GRADE C WITHOUT DISPOSAL", "Central Resolution means no car — it needs `disposal`");
      if (s.disposal && g.grade !== "C") note(s, "DISPOSAL NOT GRADED C", `noDeployment on a grade ${g.grade}`);
      if (!/FOI|Regulation 28|GMCA|gmp\.police\.uk|judiciary\.uk/i.test(g.basis)) note(s, "GRADE BASIS NOT GMP-SOURCED", g.basis.slice(0, 80));
    }
  }

  // -- Attendance ----------------------------------------------------------
  const policeSlots = s.pda.filter((p) => p.service === "Police");
  if (policeSlots.length === 0) note(s, "NO POLICE ON A POLICE JOB", "");
  if (s.disposal && policeSlots.length > 1) {
    note(s, "NO-DEPLOYMENT JOB WITH A CREW LIST", `${policeSlots.length} police slots on a disposal job`);
  }
  const arv = s.pda.some((p) => p.requiredApplianceTypes.includes("Police_ARV"));
  if (arv && !/firearm|gun|shot|weapon/i.test(s.trigger + " " + s.property.knownHazards.join(" "))) {
    note(s, "ARV WITHOUT A FIREARM", "an ARV on the PDA and nothing in the call to justify it");
  }
  // A firearms containment is a set-piece and six slots is what it takes;
  // the size check is for the volume work.
  const setPiece = s.type === "police_firearms_incident";
  if (!setPiece && policeSlots.length > 4) note(s, "OVERSIZED ATTENDANCE", `${policeSlots.length} police slots on a volume job`);
  for (const slot of s.pda) {
    if (!slot.preferredStationId) continue;
    const held = POLICE_TYPES_AT[slot.preferredStationId];
    if (held && !slot.requiredApplianceTypes.some((t) => held.includes(t))) {
      note(s, "PREFERRED STATION LACKS THE TYPE", `${slot.label} prefers ${slot.preferredStationId} for ${slot.requiredApplianceTypes.join("/")}`);
    }
    if (!slot.notes) note(s, "SLOT WITHOUT A REASON", slot.label);
  }

  // (Clear-down minutes are an exhaustive Record keyed on the type, so a
  // missing entry is a type error, not a runtime one — tsc has it.)

  // -- Informant script has the shape a volume job needs ------------------
  const beats = s.informantScript ?? [];
  if (beats.length < 4) note(s, "THIN INFORMANT SCRIPT", `${beats.length} beats`);
  if (!beats.some((b) => (b.probability ?? 1) < 1)) note(s, "NO PROBABILISTIC BRANCH", "every beat fires every time");
  if (!beats.some((b) => b.delayThresholdSec !== undefined)) note(s, "NO SLOW-RESPONSE ESCALATION", "nothing punishes a late attendance");

  // -- Records -------------------------------------------------------------
  const rec = SCENARIO_RECORDS.find((r) => r.scenarioId === s.id);
  if (!rec) {
    note(s, "NO RECORDS", "");
    continue;
  }
  if (rec.people.length === 0) note(s, "NO PEOPLE ON RECORD", "a police job names people");
  for (const p of rec.people) {
    if (!p.id.startsWith(`p${s.id}-`)) note(s, "PERSON ID NOT PREFIXED", p.id);
    if (p.phone && !DRAMA_MOBILE.test(p.phone) && !DRAMA_LANDLINE.test(p.phone)) {
      note(s, "PHONE OUTSIDE DRAMA RANGE", `${p.name}: ${p.phone}`);
    }
    if (!/^[A-Z' -]+, [A-Z]/.test(p.name)) note(s, "NAME NOT SURNAME-FIRST", p.name);
    if (p.scenarioId !== s.id) note(s, "PERSON WITHOUT SCENARIO ID", p.id);
  }
  for (const v of rec.vehicles) {
    if (!v.id.startsWith(`v${s.id}-`)) note(s, "VEHICLE ID NOT PREFIXED", v.id);
    if (!/^[A-Z]{2}\d{2} ?[A-Z]{3}$|^[A-Z]\d{1,3} ?[A-Z]{3}$|^[A-Z]{3} ?\d{1,3}[A-Z]$/.test(v.vrm)) {
      note(s, "VRM NOT A UK FORMAT", v.vrm);
    }
    if (v.keeperId && !rec.people.some((p) => p.id === v.keeperId)) note(s, "KEEPER NOT ON RECORD", `${v.vrm} → ${v.keeperId}`);
  }
  for (const pl of rec.places) {
    if (!pl.id.startsWith(`pl${s.id}-`)) note(s, "PLACE ID NOT PREFIXED", pl.id);
  }
  // Every VRM the informant mentions should be searchable.
  const vrmsInScript = beats.flatMap((b) => b.text.match(/\b[A-Z]{2}\d{2}\s?[A-Z]{3}\b/g) ?? []);
  for (const vrm of vrmsInScript) {
    const squash = vrm.replace(/\s/g, "");
    if (!rec.vehicles.some((v) => v.vrm.replace(/\s/g, "") === squash)) {
      note(s, "VRM IN SCRIPT NOT ON RECORD", vrm);
    }
  }
}

// The set as a whole: the grades should spread, not cluster.
const grades = police.filter((s) => !isStub(s)).map((s) => (s.callGrade?.scale === "police_thrive" ? String(s.callGrade.grade) : "?"));
const count = (g: string) => grades.filter((x) => x === g).length;
console.log(`Checked ${police.length} police scenarios (${police.filter(isStub).length} still stubs). GMP grade spread — 1 Immediate ${count("1")} · 2 Priority ${count("2")} · C ${count("C")} · L ${count("L")} · P ${count("P")}\n`);
if (police.length && !police.every(isStub) && count("1") === grades.length) {
  problems.push({ id: "set", kind: "EVERYTHING IS IMMEDIATE", detail: "a shift is not all Grade 1s" });
}

if (problems.length === 0) {
  console.log("No problems found.");
} else {
  const byKind = new Map<string, Problem[]>();
  for (const p of problems) {
    const arr = byKind.get(p.kind) ?? [];
    arr.push(p);
    byKind.set(p.kind, arr);
  }
  for (const [kind, ps] of [...byKind.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`${kind}  (${ps.length})`);
    for (const p of ps) console.log(`   ${p.id.padStart(3)}  ${p.detail}`);
    console.log("");
  }
  console.log(`${problems.length} problem(s).`);
}
process.exit(problems.length ? 1 : 0);
