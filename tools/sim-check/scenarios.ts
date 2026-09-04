// Every scenario, put through the sim's own logic looking for the things
// that only bite mid-shift: an attendance nobody in the county can fill, a
// caller branch that never fires, a casualty who can never be found, a
// fire that cannot be put out.

import { SCENARIOS } from "@/lib/sim/scenarios";
import { STATIONS, getStationAppliances } from "@/lib/sim/data";
import { STANDARD_PDA } from "@/lib/sim/pda";
import { clearSeconds } from "@/lib/sim/handover";
import type { Incident, Scenario } from "@/lib/sim/incident_types";

type Problem = { id: string; title: string; kind: string; detail: string };
const problems: Problem[] = [];
const note = (s: Scenario, kind: string, detail: string) =>
  problems.push({ id: s.id, title: s.title, kind, detail });

// ---------------------------------------------------------------------------
// The whole county's fleet, once.
// ---------------------------------------------------------------------------
const fleet = STATIONS.flatMap((st) =>
  getStationAppliances(st.id).map((a) => ({ ...a, stationId: st.id, area: st.area })),
);
const byStation = new Map<string, typeof fleet>();
for (const a of fleet) {
  const arr = byStation.get(a.stationId) ?? [];
  arr.push(a);
  byStation.set(a.stationId, arr);
}

// Greater Manchester, generously bounded.
const GM = { latMin: 53.32, latMax: 53.70, lngMin: -2.75, lngMax: -1.90 };

for (const s of SCENARIOS) {
  const slots = STANDARD_PDA[s.type]?.slots ?? s.pda;

  // -- 1. Can this attendance actually be mobilised? ------------------------
  for (const slot of slots) {
    const matches = fleet.filter(
      (a) =>
        slot.requiredApplianceTypes.includes(a.type),
    );
    if (matches.length === 0) {
      note(
        s,
        "UNFILLABLE SLOT",
        `"${slot.label}" wants ${slot.requiredApplianceTypes.join("/")}` +
          ((slot.requiredCapabilities ?? []).length
            ? ` with ${(slot.requiredCapabilities ?? []).join("+")}`
            : "") +
          " — nothing in the county matches",
      );
    }
    // A preferred station that cannot supply the slot is not an error, but
    // it is a lie the checklist tells the operator.
    if (slot.preferredStationId) {
      const at = byStation.get(slot.preferredStationId) ?? [];
      const ok = at.some(
        (a) =>
          slot.requiredApplianceTypes.includes(a.type),
      );
      if (!ok) {
        note(
          s,
          "PREFERRED STATION CANNOT SUPPLY",
          `"${slot.label}" prefers ${slot.preferredStationId}, which holds nothing matching`,
        );
      }
    }
  }
  const dupSlot = slots.map((x) => x.id).filter((v, i, a) => a.indexOf(v) !== i);
  if (dupSlot.length) note(s, "DUPLICATE SLOT ID", dupSlot.join(", "));

  // -- 2. Does the caller script hold together? -----------------------------
  const beats = s.informantScript ?? [];
  const ids = new Set(beats.map((b) => b.id));
  if (beats.length !== ids.size) note(s, "DUPLICATE BEAT ID", "informant beats share an id");

  for (const b of beats) {
    for (const r of b.requiresFiredIds ?? []) {
      if (!ids.has(r)) note(s, "DANGLING requiresFiredIds", `${b.id} requires ${r}, which does not exist`);
    }
    for (const r of b.suppressesIds ?? []) {
      if (!ids.has(r)) note(s, "DANGLING suppressesIds", `${b.id} suppresses ${r}, which does not exist`);
    }
    if (b.probability !== undefined && (b.probability <= 0 || b.probability > 1)) {
      note(s, "BAD PROBABILITY", `${b.id} has probability ${b.probability}`);
    }
    // A beat that depends on a beat that can never fire is dead.
    for (const r of b.requiresFiredIds ?? []) {
      const parent = beats.find((x) => x.id === r);
      if (parent && parent.probability === 0) {
        note(s, "DEAD BRANCH", `${b.id} requires ${r}, which can never fire`);
      }
    }
  }

  // The AFA bug: two beats that suppress each other, both probabilistic,
  // leaving a share of runs where NEITHER fires and the caller never
  // resolves the question they raised.
  for (const a of beats) {
    for (const bId of a.suppressesIds ?? []) {
      const b = beats.find((x) => x.id === bId);
      if (!b) continue;
      if (!(b.suppressesIds ?? []).includes(a.id)) continue;
      if (a.id > b.id) continue; // consider each pair once
      const pa = a.probability ?? 1;
      const pb = b.probability ?? 1;
      if (pa < 1 && pb < 1) {
        const dead = Math.round((1 - pa) * (1 - pb) * 100);
        if (dead > 0) {
          note(
            s,
            "MUTUAL SUPPRESSION HOLE",
            `${a.id} (${pa}) and ${b.id} (${pb}) suppress each other — ${dead}% of runs hear neither`,
          );
        }
      }
    }
  }

  // -- 3. Geography ---------------------------------------------------------
  const c = s.location.coords;
  if (c.lat < GM.latMin || c.lat > GM.latMax || c.lng < GM.lngMin || c.lng > GM.lngMax) {
    note(s, "OUTSIDE GREATER MANCHESTER", `${c.lat}, ${c.lng}`);
  }
  if (!/^[A-Z]{1,2}\d{1,2}[A-Z]?( \d[A-Z]{2})?$/.test(s.location.postcode)) {
    note(s, "MALFORMED POSTCODE", s.location.postcode);
  }

  // -- 4. The scene ---------------------------------------------------------
  const sc = s.scene;
  if (sc) {
    const v = sc.viewBox;
    const inBox = (p: { x: number; y: number }) =>
      p.x >= v.x && p.x <= v.x + v.width && p.y >= v.y && p.y <= v.y + v.height;

    for (const h of sc.hazards ?? []) {
      if (!inBox(h.pos)) note(s, "HAZARD OFF-SCENE", `${h.id} at ${h.pos.x},${h.pos.y}`);
    }
    for (const cas of sc.casualties ?? []) {
      if (!inBox(cas.pos)) note(s, "CASUALTY OFF-SCENE", `${cas.id} at ${cas.pos.x},${cas.pos.y}`);
    }
    if (sc.fireSeat && !inBox(sc.fireSeat.pos)) note(s, "FIRE SEAT OFF-SCENE", "");

    const hIds = (sc.hazards ?? []).map((h) => h.id);
    const dupH = hIds.filter((x, i) => hIds.indexOf(x) !== i);
    if (dupH.length) note(s, "DUPLICATE HAZARD ID", dupH.join(", "));

    const cIds = (sc.casualties ?? []).map((x) => x.id);
    const dupC = cIds.filter((x, i) => cIds.indexOf(x) !== i);
    if (dupC.length) note(s, "DUPLICATE CASUALTY ID", dupC.join(", "));

    const sIds = (sc.sectors ?? []).map((x) => x.id);
    if (new Set(sIds).size !== sIds.length) note(s, "DUPLICATE SECTOR ID", sIds.join(", "));
    if (sIds.length && sIds.length !== 4) note(s, "SECTOR COUNT", `${sIds.length} sectors, expected 4`);

    // -- 5. Fire physics ---------------------------------------------------
    const f = sc.fireSeat;
    if (f) {
      // Same defaults incident_sim.ts applies, so the check sees the fire
      // the sim will actually run rather than the fire as authored.
      const radius = f.radiusM ?? 0;
      const maxRadius = f.maxRadiusM ?? 15;
      const suppression = f.suppressionPerBaMpm ?? 0;
      if (maxRadius < radius) note(s, "FIRE CANNOT EXIST", "maxRadiusM below its starting radius");
      if (radius > 0 && suppression <= 0) {
        note(s, "FIRE CANNOT BE EXTINGUISHED", "burning on arrival with no suppression rate");
      }
      // Growth outpacing suppression is NOT a fault. The fire is capped
      // at maxRadiusM, growth stops there, and suppression then wins — a
      // major incident is supposed to get big before it gets better. What
      // WOULD be a fault is a cap the scene cannot contain, because then
      // the fire covers everything drawn and there is nothing to work
      // around.
      const halfSpan = Math.min(v.width, v.height) / 2;
      if (maxRadius > halfSpan * 1.5) {
        note(
          s,
          "FIRE OUTGROWS ITS SCENE",
          "caps at " + maxRadius + " m on a scene " + v.width + "x" + v.height + " m",
        );
      }
    }

    // -- 6. Can every casualty be found? ------------------------------------
    const inc = { id: "i", scenarioId: s.id, scenario: s, receivedAt: 0 } as Incident;
    const clearMin = clearSeconds(inc, [], slots, 1) / 60;
    for (const cas of sc.casualties ?? []) {
      if (cas.discoverAfterMinBa > clearMin) {
        note(
          s,
          "CASUALTY FOUND TOO LATE",
          `${cas.id} needs ${cas.discoverAfterMinBa} min of BA but the job clears in ${clearMin.toFixed(0)}`,
        );
      }
      if (cas.presentProbability !== undefined && (cas.presentProbability < 0 || cas.presentProbability > 1)) {
        note(s, "BAD presentProbability", `${cas.id}: ${cas.presentProbability}`);
      }
    }

    // A persons-reported job with nobody in it is a contradiction.
    const saysPersons = /persons reported|unwell|casualt|patient|trapped/i.test(
      s.trigger + " " + s.methane.N,
    );
    const hasNobody = (sc.casualties ?? []).length === 0;
    const noneCertain =
      (sc.casualties ?? []).length > 0 &&
      (sc.casualties ?? []).every((x) => (x.presentProbability ?? 1) === 0);
    if (saysPersons && (hasNobody || noneCertain) && !/none|nobody|no persons/i.test(s.methane.N)) {
      note(s, "SAYS PERSONS, SCENE HAS NONE", s.methane.N.slice(0, 60));
    }
  }

  // -- 7. Casualty care -----------------------------------------------------
  for (const cas of sc?.casualties ?? []) {
    const cl = cas.clinical;
    if (!cl) {
      // The sim falls back to a generic patient by severity. That is fine
      // for a walking-wounded extra and wrong for anything the scenario is
      // actually about, and it is silent either way.
      note(s, "NO CLINICAL DETAIL", cas.id + " falls back to the generic " + cas.severity + " patient");
      continue;
    }

    const v = cl.vitals;
    const range = (name: string, val: number, lo: number, hi: number) => {
      if (val < lo || val > hi) {
        note(s, "IMPLAUSIBLE VITAL", cas.id + " " + name + "=" + val + " (expected " + lo + "-" + hi + ")");
      }
    };
    // A patient in cardiac arrest has no pulse and no blood pressure.
    // Zero is not an implausible reading there, it is the diagnosis.
    const arrested = cl.redFlags.includes("cardiac_arrest");
    range("rr", v.rr, arrested ? 0 : 4, 60);
    range("spo2", v.spo2, arrested ? 0 : 40, 100);
    range("gcs", v.gcs, 3, 15);
    range("temp", v.temp, 24, 43);
    range("bm", v.bm, 0.5, 40);
    if (!arrested) {
      range("hr", v.hr, 20, 220);
      range("bpSys", v.bpSys, 40, 260);
      range("bpDia", v.bpDia, 20, 160);
      if (v.bpDia >= v.bpSys) {
        note(s, "BP INVERTED", cas.id + " diastolic " + v.bpDia + " is not below systolic " + v.bpSys);
      }
    } else if (v.hr !== 0 || v.bpSys !== 0) {
      note(s, "ARREST WITH OUTPUT", cas.id + " flags cardiac_arrest but has a pulse and a pressure");
    }

    // A red flag with no matching treatment is a flag the crew cannot act
    // on; the treatment menu gates its actions on these.
    const NEEDS: Record<string, string> = {
      anaphylaxis: "adrenaline_im",
      hypoglycaemia: "glucagon",
      overdose_opioid: "naloxone",
      severe_asthma: "salbutamol_neb",
      cardiac_arrest: "defib",
      seizure_active: "midazolam",
      major_haemorrhage: "tXA",
      tension_pneumothorax: "needle_decomp",
    };
    for (const [flag, needed] of Object.entries(NEEDS)) {
      if (cl.redFlags.includes(flag as never) && !cl.criticalInterventions.includes(needed as never)) {
        note(s, "FLAG WITHOUT ITS TREATMENT", cas.id + " flags " + flag + " but does not list " + needed);
      }
    }

    // The specific-destination flags exist so the debrief can mark the
    // choice. A STEMI bound for the nearest A&E scores the opposite of
    // what the scenario teaches.
    const DEST: Record<string, string> = {
      stemi: "pci",
      stroke_fast_positive: "hasu",
    };
    for (const [flag, dest] of Object.entries(DEST)) {
      if (cl.redFlags.includes(flag as never) && cl.preferredDestination !== dest) {
        note(
          s,
          "FLAG AGAINST ITS DESTINATION",
          cas.id + " flags " + flag + " but is bound for " + cl.preferredDestination,
        );
      }
    }

    if (!cl.presumedCondition || cl.presumedCondition.length < 12) {
      note(s, "THIN PRESUMED CONDITION", cas.id + ": " + cl.presumedCondition);
    }
    // A critical patient with nothing to do for them is a scene with no
    // treatment in it.
    if (cas.severity === "critical" && cl.criticalInterventions.length === 0) {
      note(s, "CRITICAL WITH NO INTERVENTIONS", cas.id);
    }
  }

  // A scenario whose evaluation talks about a destination must have a
  // casualty that actually wants one, or the target cannot be scored.
  const destTarget = s.evaluation.targets.find((t) => /destination/i.test(t.metric));
  if (destTarget) {
    const wants = (sc?.casualties ?? []).some(
      (c) => c.clinical && c.clinical.preferredDestination !== "nearest_a_e",
    );
    if (!wants) {
      note(
        s,
        "DESTINATION TARGET UNSCORABLE",
        'evaluation asks for "' + destTarget.target.slice(0, 44) + '" but no casualty prefers anywhere',
      );
    }
  }

  // -- 8. Evaluation --------------------------------------------------------
  const metrics = s.evaluation.targets.map((t) => t.metric);
  if (new Set(metrics).size !== metrics.length) note(s, "DUPLICATE METRIC", metrics.join(", "));
}

// ---------------------------------------------------------------------------
console.log(`Ran ${SCENARIOS.length} scenarios against ${fleet.length} appliances at ${STATIONS.length} stations.\n`);

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
    for (const p of ps) console.log(`   ${p.id.padStart(2)}  ${p.title.slice(0, 40).padEnd(42)}${p.detail}`);
    console.log("");
  }
  console.log(`${problems.length} problem(s) across ${new Set(problems.map((p) => p.id)).size} scenario(s).`);
}
process.exit(problems.length ? 1 : 0);
