// The hospital data and the routing on top of it, checked the way the
// scenarios are: shape, evidence discipline, and then a set of patients
// sent through the resolver to see whether the real-world rules fire.
//
// The evidence discipline is the point. Every routed-on field carries a
// confidence; "unknown" must have a null value and vice versa; nothing
// with no evidence of a helipad can be flown to. A quiet default of
// false is exactly the failure this file exists to catch.

import {
  HOSPITALS,
  HOSPITAL_NETWORK,
  hasHelipad,
  hospitalById,
  resolveDestination,
  type Confidence,
  type Ev,
  type Hospital,
} from "@/lib/sim/hospitals";
import {
  BASICS_ALERT_RADIUS_M,
  rollBasicsResponse,
  type BasicsResponder,
} from "@/lib/sim/basics";
import { STATIONS, getStationAppliances } from "@/lib/sim/data";
import { SCENARIOS } from "@/lib/sim/scenarios";

type Problem = { where: string; kind: string; detail: string };
const problems: Problem[] = [];
const note = (where: string, kind: string, detail: string) =>
  problems.push({ where, kind, detail });

const CONF: Confidence[] = ["confirmed", "likely", "uncertain", "unknown"];
const GM = { latMin: 53.32, latMax: 53.70, lngMin: -2.75, lngMax: -1.90 };

// ---------------------------------------------------------------------------
// 1. Shape and evidence discipline
// ---------------------------------------------------------------------------
const EV_FIELDS: (keyof Hospital)[] = [
  "ed", "trauma", "ppci", "stroke", "burns", "neuro", "vascular", "cardiothoracic", "helipad", "offSiteHls",
];

for (const h of HOSPITALS) {
  if (!/^H-[A-Z]{3,4}$/.test(h.id)) note(h.id, "BAD ID", h.id);
  if (typeof h.inPatch !== "boolean") note(h.id, "MISSING inPatch", "");
  if (!h.trust) note(h.id, "MISSING trust", "");
  const inBox =
    h.coords.lat >= GM.latMin && h.coords.lat <= GM.latMax &&
    h.coords.lng >= GM.lngMin && h.coords.lng <= GM.lngMax;
  if (h.inPatch && !inBox) note(h.id, "IN-PATCH SITE OUTSIDE GM", JSON.stringify(h.coords));
  if (!h.inPatch && inBox) note(h.id, "OUT-OF-PATCH SITE INSIDE GM", "inPatch should be true");

  for (const f of EV_FIELDS) {
    const e = h[f] as Ev<unknown> | undefined;
    if (!e || typeof e !== "object" || !("confidence" in e)) {
      note(h.id, "FIELD NOT AN EVIDENCE RECORD", String(f));
      continue;
    }
    if (!CONF.includes(e.confidence)) note(h.id, "BAD CONFIDENCE", `${String(f)}: ${e.confidence}`);
    if (!Array.isArray(e.sources)) note(h.id, "SOURCES NOT A LIST", String(f));
    if (e.confidence === "unknown" && e.value !== null) note(h.id, "UNKNOWN WITH A VALUE", String(f));
    if (e.confidence !== "unknown" && e.value === null) note(h.id, "NULL VALUE NOT MARKED UNKNOWN", String(f));
    if (e.confidence === "confirmed" && e.sources.length === 0) {
      note(h.id, "CONFIRMED WITHOUT A SOURCE", String(f));
    }
    if ((e.confidence === "unknown" || e.confidence === "uncertain") && !e.note) {
      note(h.id, "UNCERTAINTY WITHOUT A NOTE", `${String(f)} says ${e.confidence} but does not say why`);
    }
  }

  // Presence fields are three-way, never bare booleans.
  const hp = h.helipad.value;
  if (hp && !["yes", "no_evidence", "unknown"].includes(hp.present)) {
    note(h.id, "HELIPAD PRESENCE NOT THREE-WAY", String(hp.present));
  }
  if (hp && hp.present === "no_evidence" && h.helipad.confidence === "confirmed") {
    note(h.id, "NO-EVIDENCE CANNOT BE CONFIRMED", "absence of evidence is not a confirmed absence");
  }
}

// The network flag has to say the MTC arrangement is provisional.
if (!HOSPITAL_NETWORK.underReview) note("network", "MTC REVIEW NOT FLAGGED", "GM's two-site MTC is under a site-selection review");
if (HOSPITAL_NETWORK.traumaAdultAgeFloor !== 16) note("network", "TRAUMA AGE FLOOR", String(HOSPITAL_NETWORK.traumaAdultAgeFloor));

// ---------------------------------------------------------------------------
// 2. The helipad rule — who can actually be flown to
// ---------------------------------------------------------------------------
const flyable = HOSPITALS.filter((h) => hasHelipad(h)).map((h) => h.id).sort();
const expectedInPatch = ["H-MRI", "H-RMCH", "H-SRH"];
for (const id of expectedInPatch) {
  if (!flyable.includes(id)) note(id, "HELIPAD MISSING", "should be flyable");
}
for (const h of HOSPITALS.filter((h) => h.inPatch)) {
  if (!expectedInPatch.includes(h.id) && flyable.includes(h.id)) {
    note(h.id, "FLYABLE WITHOUT A CONFIRMED PAD", "only MRI, RMCH and Salford Royal have one in patch");
  }
}
// Preston's pad was shut July 2025 – February 2026 and reopened. It has
// to read as flyable today, and as closed for a date inside the window.
const rph = hospitalById("H-RPH");
if (rph && !hasHelipad(rph)) note("H-RPH", "PRESTON PAD STILL CLOSED", "the refurbishment ended February 2026");
if (rph && hasHelipad(rph, new Date("2025-09-15"))) note("H-RPH", "PRESTON PAD OPEN DURING CLOSURE", "September 2025 was inside the refurbishment window");
const wyt = hospitalById("H-WYT");
if (wyt && hasHelipad(wyt)) note("H-WYT", "WYTHENSHAWE FLYABLE", "the only landing footage is another operator's aircraft");
if (wyt && wyt.helipad.value?.present !== "unknown") note("H-WYT", "WYTHENSHAWE PAD NOT UNKNOWN", String(wyt.helipad.value?.present));

// ---------------------------------------------------------------------------
// 3. Routing — real patients through the real rules
// ---------------------------------------------------------------------------
const at = (id: string) => hospitalById(id)!.coords;
const BURY = at("H-FGH");
const STOCKPORT = at("H-SHH");
const ASHTON = { lat: 53.4886, lng: -2.0976 };
const WIGAN = at("H-RAE");
const WYTHENSHAWE = at("H-WYT");
const BOLTON = at("H-RBH");

const route = (
  type: Parameters<typeof resolveDestination>[0],
  scene: { lat: number; lng: number },
  cas: Parameters<typeof resolveDestination>[2],
  hhmm = "14:00",
) => resolveDestination(type, scene, cas, { hhmm });

const expect = (label: string, got: ReturnType<typeof resolveDestination>, ids: string[]) => {
  if (!got) {
    note("routing", "NO DECISION", label);
    return;
  }
  if (!ids.includes(got.hospital.id)) {
    note("routing", "WRONG DESTINATION", `${label}: got ${got.hospital.id} (${got.rule}), expected ${ids.join("/")}`);
  }
};

// STEMI in Bury bypasses Fairfield for a PCI centre.
{
  const d = route("pci", BURY, { redFlags: ["stemi"] });
  expect("STEMI in Bury", d, ["H-MRI", "H-WYT"]);
  if (d && !d.bypassed) note("routing", "NO BYPASS RECORDED", "STEMI in Bury should pass Fairfield");
}
// Stroke: clock-gated.
expect("stroke, Stockport, 03:00", route("hasu", STOCKPORT, { redFlags: ["stroke_fast_positive"] }, "03:00"), ["H-SRH"]);
expect("stroke, Stockport, 14:00", route("hasu", STOCKPORT, { redFlags: ["stroke_fast_positive"] }, "14:00"), ["H-SHH"]);
expect("stroke, Bury, 14:00", route("hasu", BURY, { redFlags: ["stroke_fast_positive"] }, "14:00"), ["H-FGH"]);
expect("thrombectomy-eligible, Stockport, 14:00", route("hasu", STOCKPORT, { redFlags: ["stroke_fast_positive"], thrombectomyEligible: true }), ["H-SRH"]);
// Trauma: the Pathfinder.
expect("child major trauma, Bolton", route("mtc", BOLTON, { ageYears: 8, redFlags: ["hypovolaemic_shock"] }), ["H-RMCH"]);
expect("penetrating trauma, Ashton", route("mtc", ASHTON, { redFlags: ["hypovolaemic_shock"], injuryPattern: ["penetrating"] }), ["H-MRI"]);
expect("blunt major trauma, Ashton", route("mtc", ASHTON, { redFlags: ["hypovolaemic_shock"] }), ["H-SRH"]);
expect("head injury GCS 9, Ashton", route("mtc", ASHTON, { redFlags: ["head_injury_severe"], gcs: 9 }), ["H-SRH"]);
// Pit stop: an unmanageable airway does not make the run to Salford.
{
  const d = route("mtc", WIGAN, { redFlags: ["airway_compromise", "hypovolaemic_shock"] });
  expect("unmanageable airway, Wigan", d, ["H-RAE"]);
  if (d && !d.pitStop) note("routing", "PIT STOP NOT FLAGGED", "airway_compromise on an mtc request should be a RED STANDBY pit stop");
}
// Burns.
expect("adult burns, Wythenshawe", route("burns", WYTHENSHAWE, { redFlags: [] }), ["H-WYT"]);
expect("child burns, Bolton", route("burns", BOLTON, { ageYears: 6, redFlags: [] }), ["H-RMCH"]);
{
  const d = route("burns", WIGAN, { redFlags: [] });
  if (d && d.hospital.id === "H-WHI" && d.warnings.length === 0) note("routing", "WHISTON WITHOUT A WARNING", "out-of-patch burns unit used silently");
}
// Paediatric ED: Wythenshawe is excluded while its provision is unknown,
// and the exclusion is said out loud.
{
  const d = route("paed_ed", WYTHENSHAWE, { ageYears: 7, redFlags: [] });
  if (d?.hospital.id === "H-WYT") note("routing", "CHILD ROUTED TO WYTHENSHAWE", "paediatric provision is unknown there");
  if (d && !d.warnings.some((w) => /Wythenshawe/.test(w))) note("routing", "WYTHENSHAWE EXCLUSION SILENT", d.warnings.join("; ") || "(no warnings)");
}
// Nearest ED never lands on a site without one.
for (const scene of [BURY, STOCKPORT, ASHTON, WIGAN, WYTHENSHAWE, BOLTON, at("H-TRA"), at("H-ROC")]) {
  const d = route("nearest_a_e", scene, { redFlags: [] });
  if (d && !d.hospital.ed.value?.open24h) note("routing", "NEAREST ED HAS NO ED", d.hospital.id);
  if (d && !d.hospital.inPatch) note("routing", "NEAREST ED OUT OF PATCH", d.hospital.id);
}
// Non-convey is nothing.
if (route("non_convey", BURY, { redFlags: [] }) !== null) note("routing", "NON-CONVEY RETURNED A HOSPITAL", "");

// ---------------------------------------------------------------------------
// 4. BASICS — the roster exists, and the answer model has the right shape
// ---------------------------------------------------------------------------
const basicsUnits = STATIONS.flatMap((s) => getStationAppliances(s.id)).filter((a) => a.type === "BASICS");
if (basicsUnits.length === 0) note("basics", "NO RESPONDERS BUILT", "A-BASICS did not survive into STATIONS");
for (const a of basicsUnits) {
  if (!a.homeAnchor) note("basics", "RESPONDER WITHOUT A HOME ANCHOR", a.callsign);
  if (!a.schemeVirtual) note("basics", "RESPONDER NOT VIRTUAL", a.callsign);
  if (a.homeAnchor && a.homeAnchor.lat > 53.53) note("basics", "RESPONDER NORTH OF THE M62", `${a.callsign} at ${a.homeAnchor.label} — the scheme's cover sits south and west`);
}
const responders: BasicsResponder[] = basicsUnits
  .filter((a) => a.homeAnchor)
  .map((a) => ({ applianceId: a.id, callsign: a.callsign, anchor: a.homeAnchor! }));

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const answerRate = (scene: { lat: number; lng: number }, hour: number, n = 4000) => {
  const rnd = seeded(scene.lat * 1e5 + hour);
  let answered = 0;
  for (let i = 0; i < n; i++) if (rollBasicsResponse(scene, responders, hour, rnd).winner) answered++;
  return answered / n;
};
const ALTRINCHAM = { lat: 53.3875, lng: -2.3486 };
const ROCHDALE = at("H-ROC");
const rAlt = answerRate(ALTRINCHAM, 14);
const rAltNight = answerRate(ALTRINCHAM, 3);
const rWigan = answerRate(WIGAN, 14);
const rRoch = answerRate(ROCHDALE, 14);
const rBury = answerRate(BURY, 14);
// The shape that matters: a real chance in the south, a slim one in the
// north, quieter at night, and never a certainty anywhere. Twenty miles
// is a big circle — Wigan sits inside both Warrington's and Altrincham's,
// which is the sourced fact; it is the answer probability that carries
// the geography, not the radius.
if (rAlt < 0.25 || rAlt > 0.55) note("basics", "ANSWER RATE OFF IN SOUTH GM", `Altrincham daytime ${(rAlt * 100).toFixed(0)}% — expected a little under half`);
if (!(rAltNight < rAlt)) note("basics", "NIGHT NOT QUIETER", `Altrincham 03:00 ${(rAltNight * 100).toFixed(0)}% vs 14:00 ${(rAlt * 100).toFixed(0)}%`);
// Greater Manchester is small: Wigan, Bury and Rochdale each sit inside
// two responders' circles at the far end, so the whole northern band
// lands at roughly the same slim figure. What must hold is south > north
// by a wide margin, and north never comfortable.
if (rWigan > 0.22) note("basics", "WIGAN TOO WELL COVERED", `${(rWigan * 100).toFixed(0)}% — nobody is anchored near it`);
if (rRoch > 0.22) note("basics", "ROCHDALE TOO WELL COVERED", `${(rRoch * 100).toFixed(0)}%`);
if (rBury > 0.22) note("basics", "BURY TOO WELL COVERED", `${(rBury * 100).toFixed(0)}%`);
if (!(rWigan < rAlt / 2 && rRoch < rAlt / 2)) note("basics", "NO NORTH-SOUTH GRADIENT", `Altrincham ${(rAlt * 100).toFixed(0)}% · Wigan ${(rWigan * 100).toFixed(0)}% · Rochdale ${(rRoch * 100).toFixed(0)}%`);
// Beyond every circle: Todmorden, just over the county line to the north.
const farNorth = { lat: 53.714, lng: -2.096 };
const farAlerted = rollBasicsResponse(farNorth, responders, 14, seeded(1)).alerted.length;
if (farAlerted > 0) note("basics", "TODMORDEN INSIDE THE ALERT RADIUS", `${farAlerted} handset(s) within ${BASICS_ALERT_RADIUS_M} m — the radius has grown`);

// ---------------------------------------------------------------------------
// 5. Scenarios — the routing inputs are authored where they matter
// ---------------------------------------------------------------------------
for (const s of SCENARIOS) {
  for (const c of s.scene?.casualties ?? []) {
    const cl = c.clinical;
    if (!cl) continue;
    if (cl.ageYears === undefined) note(s.id, "CASUALTY WITHOUT AN AGE", c.id + " — " + c.label);
    if (cl.injuryPattern?.includes("penetrating") && cl.preferredDestination !== "mtc") {
      note(s.id, "PENETRATING BUT NOT MTC", c.id);
    }
    if (/penetrating|\bstab(bed|bing|bings)?\b|gunshot|\bshot\b|\bknife\b/i.test(cl.presumedCondition) && !cl.injuryPattern?.includes("penetrating")) {
      note(s.id, "PENETRATING IN PROSE, NOT IN DATA", c.id + ": " + cl.presumedCondition.slice(0, 60));
    }
    // A child bound for a "mtc" must resolve to RMCH.
    if (cl.ageYears !== undefined && cl.ageYears < 16 && cl.preferredDestination === "mtc") {
      const d = route("mtc", s.location.coords, { ageYears: cl.ageYears, redFlags: cl.redFlags });
      if (d?.hospital.id !== "H-RMCH") note(s.id, "CHILD TRAUMA NOT TO RMCH", c.id + " → " + d?.hospital.id);
    }
  }
}

// ---------------------------------------------------------------------------
console.log(
  `Checked ${HOSPITALS.length} hospitals (${HOSPITALS.filter((h) => h.inPatch).length} in patch, ${flyable.length} flyable), ` +
  `${basicsUnits.length} BASICS responders, ${SCENARIOS.length} scenarios.`,
);
console.log(
  `BASICS answer rates — Altrincham 14:00 ${(rAlt * 100).toFixed(0)}%, 03:00 ${(rAltNight * 100).toFixed(0)}% · Bury ${(rBury * 100).toFixed(0)}% · Wigan ${(rWigan * 100).toFixed(0)}% · Rochdale ${(rRoch * 100).toFixed(0)}%\n`,
);

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
    for (const p of ps) console.log(`   ${p.where.padEnd(10)}${p.detail}`);
    console.log("");
  }
  console.log(`${problems.length} problem(s).`);
}
process.exit(problems.length ? 1 : 0);
