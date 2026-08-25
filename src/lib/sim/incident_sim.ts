// Derived state for an active incident: fire radius, discovered hazards and
// casualties. Fire suppression and casualty discovery are now driven by
// operator-assigned tasks, not raw on-scene time.

import {
  ATTACK_EFFECTIVENESS,
  SUPPRESSION_MPM_BY_MODE,
  type Deployment,
  type Incident,
  type PatientTreatmentState,
  type Task,
} from "./incident_types";
import type {
  FireMaterial,
  PatientRedFlag,
  SceneCasualty,
  SceneHazard,
} from "./scene";

/** Fire-stage classification. Drives SITREP colouring + tactical mode
 *  guidance + flashover risk countdown. Purely derived from the current
 *  and historical fire radius. */
export type FireStage =
  | "none"             // no fire seat (non-fire incidents)
  | "incipient"        // small, contained, early
  | "developing"       // spreading, room-scale
  | "fully_developed"  // involves the whole compartment
  | "flashover_risk"   // imminent flashover if not knocked down
  | "under_control"    // being suppressed, shrinking
  | "extinguished";    // back to zero radius

/** Per-casualty progression through treatment. Captures where each
 *  casualty is on the golden-hour timeline — undiscovered, located but
 *  untreated, being treated, en route to hospital, or deteriorated past
 *  viability. */
export type CasualtyStage =
  | "undiscovered"
  | "located"
  | "in_treatment"
  | "extricated"
  | "conveying"
  | "at_hospital"
  | "expectant";

/** Deterioration clock per casualty — seconds until they drop one
 *  severity grade (critical → expectant, etc.). Null when paused (e.g.
 *  in treatment, at hospital). Tied to the casualty's `id`. */
export type CasualtyProgression = {
  stage: CasualtyStage;
  /** Epoch ms at which they deteriorate next (or null if paused / final). */
  deteriorateAt: number | null;
  /** Effective severity right now (may be worse than scenario-authored if
   *  time has passed untreated). */
  severity: "minor" | "serious" | "critical" | "expectant";
};

export type IncidentSimState = {
  fireRadiusM: number;
  /** Rate of change in metres per minute — + growing, − shrinking, 0 stable. */
  fireRateMpm: number;
  fireStage: FireStage;
  /** When `fireStage === "flashover_risk"`, seconds until flashover occurs
   *  if the fire isn't knocked down. Null otherwise. */
  flashoverCountdownSec: number | null;
  /** What's burning. Null if the scenario has no fire seat. */
  fireMaterial: FireMaterial | null;
  /** Whether the operator has confirmed the material via a 360 survey.
   *  Until then, the Water tab can show placeholder text rather than the
   *  authored material (scenarios with `unknownMaterial: true`). */
  fireMaterialKnown: boolean;
  visibleHazards: SceneHazard[];
  mitigatedHazardIds: string[];
  foundCasualties: SceneCasualty[];
  /** Per-casualty progression, keyed by casualty id. Includes every
   *  scenario casualty (even undiscovered ones) so the operator's
   *  MissionBar can show the full count + timers. */
  casualtyProgression: Record<string, CasualtyProgression>;
  /** Casualty ids removed from this run by the persons-reality roll.
   *  Downstream consumers (scoring, planned-count displays) subtract
   *  these from the authored scene list. */
  absentCasualtyIds: string[];
  /** True while the fire radius is at/beyond the scene's authored
   *  exposure threshold (fire into the attached neighbour / adjacent
   *  unit). The dashboard logs the breach on the rising edge; scoring
   *  reads that log entry so a later knock-down doesn't erase it. */
  exposureBreached: boolean;
  firstArrivalElapsedSec: number;
  baMinutesOnScene: number;
  baSarMinutes: number;
};

// --- Progression cadence constants --------------------------------------

/** Flashover countdown (seconds from the moment the fire enters "flashover
 *  risk" stage). An unsuppressed compartment fire at full involvement can
 *  flash over in as little as 2–3 minutes once at the threshold. */
const FLASHOVER_COUNTDOWN_SEC = 180;

/** Seconds per severity stage without treatment. Casualties drop one
 *  grade (serious → critical → expectant) every window this long unless
 *  a medical resource reaches them. */
const CASUALTY_DETERIORATION_SEC = 600; // 10 min per grade

const SEVERITY_ORDER: CasualtyProgression["severity"][] = [
  "minor",
  "serious",
  "critical",
  "expectant",
];

function isOnScene(d: Deployment, now: number): boolean {
  if (d.returnStartedAt && now >= d.returnStartedAt) return false;
  if (d.hospitalLegStartedAt && now >= d.hospitalLegStartedAt) return false;
  return now >= d.arrivesAt;
}

function taskDurationSec(t: Task, now: number): number {
  const end = t.state === "completed" ? t.completesAt ?? now : now;
  return Math.max(0, (end - t.startedAt) / 1000);
}

/** Suppression rate (metres/minute) for a task given its current mode and
 *  the fire material + any relevant hazard-mitigation state. Positive =
 *  shrinking the fire, negative = the posture is making it worse. */
function suppressionRateFor(
  t: Task,
  material: FireMaterial,
  isolatedHazards: Set<string>,
  tasks: Task[],
): number {
  if (t.kind === "hose_attack") {
    const mode = t.attackMode ?? "interior_attack";
    const base = SUPPRESSION_MPM_BY_MODE[mode];
    let mult = ATTACK_EFFECTIVENESS[material][mode];
    // Electrical fires — water effectiveness returns to partial once the
    // operator has isolated the supply via a mitigate_hazard task.
    if (material === "electrical" && mult < 0) {
      const electricalIsolated = Array.from(isolatedHazards).some((id) =>
        /electric|isolat|supply/i.test(id),
      );
      if (electricalIsolated) mult = mode === "interior_attack" ? 0.9 : 0.6;
    }
    // Bulk combustible — boost if any HVP-bearing Prime Mover is on the
    // supply chain feeding this attacker.
    if (material === "bulk_combustible") {
      const hvpSupplying = tasks.some(
        (x) =>
          x.kind === "connect_hydrant" &&
          x.state !== "aborted" &&
          /hvp|pm/i.test(x.applianceId),
      );
      if (hvpSupplying) mult = Math.min(1, mult + 0.4);
    }
    return base * mult;
  }
  if (t.kind === "ba_sar") return 0.12;
  // Wildfire tools — the primary suppression mechanism on vegetation
  // fires, near-useless against anything structural.
  if (t.kind === "wildfire_beating")
    return material === "vegetation" ? 0.1 : 0.02;
  if (t.kind === "wildfire_knapsack")
    return material === "vegetation" ? 0.08 : 0.02;
  // A completed firebreak removes a solid chunk of fire front — the
  // integration over its (fixed) duration models the cut-off line.
  if (t.kind === "firebreak")
    return material === "vegetation" ? 0.5 : 0.05;
  return 0;
}

export function simulateIncident(
  incident: Incident,
  deployments: Deployment[],
  baCrewsById: Record<string, number>,
  tasks: Task[],
  now: number,
  treatmentByCasualtyId?: Record<string, PatientTreatmentState>,
  windGrowthMultiplier: number = 1,
  /** A real fire started mid-incident by an informant beat (igniteFire) —
   *  adds radius and growth on top of the authored seat, integrating
   *  from its own start time. How "probably false" alarm scenarios roll
   *  their reality per playthrough. */
  fireIgnition?: import("./incident_types").FireIgnition | null,
  /** Casualty ids the persons-reality roll (or an unrevealed
   *  presentProbability: 0) has removed from this run — never discovered,
   *  never progress, never scored. */
  absentCasualtyIds?: Set<string> | null,
): IncidentSimState {
  const absent = absentCasualtyIds ?? new Set<string>();
  const scene = incident.scenario.scene;

  let firstArrival: number | null = null;
  for (const d of deployments) {
    if (now < d.arrivesAt) continue;
    if (firstArrival === null || d.arrivesAt < firstArrival) {
      firstArrival = d.arrivesAt;
    }
  }

  let baMinutesOnScene = 0;
  let secondsAnyOnScene = 0;
  for (const d of deployments) {
    if (!isOnScene(d, now)) continue;
    const onSceneSec = Math.max(0, (now - d.arrivesAt) / 1000);
    secondsAnyOnScene = Math.max(secondsAnyOnScene, onSceneSec);
    const ba = baCrewsById[d.applianceId] ?? 0;
    baMinutesOnScene += (ba * onSceneSec) / 60;
  }

  // --- Fire model (task-driven) --------------------------------------------
  let fireRadiusM = 0;
  let fireRateMpm = 0;
  const material: FireMaterial = scene?.fireSeat?.material ?? "structural";
  // Hazards that are already mitigated — affects electrical isolation logic.
  const isolatedHazards = new Set(
    tasks
      .filter((t) => t.kind === "mitigate_hazard" && t.state === "completed" && t.hazardId)
      .map((t) => t.hazardId as string),
  );
  // Instantaneous suppression from all currently-active tasks. Lifted out
  // so both the rate calc and the fire-stage classifier can reference it.
  let activeSuppressionNow = 0;
  for (const t of tasks) {
    if (t.state !== "active") continue;
    activeSuppressionNow += suppressionRateFor(t, material, isolatedHazards, tasks);
  }
  if (scene?.fireSeat) {
    const seat = scene.fireSeat;
    const growth = (seat.growthRateMpm ?? 0.2) * windGrowthMultiplier;
    const maxR = seat.maxRadiusM ?? 15;

    // Integrate growth over incident lifetime.
    const receivedAtSec = Math.max(0, (now - incident.receivedAt) / 1000);
    let growthAdd = growth * (receivedAtSec / 60);

    // A mid-incident ignition (informant beat) integrates from its own
    // start time on top of the authored seat — for alarm scenarios the
    // seat itself is zero and this IS the fire.
    let ignitionGrowthNow = 0;
    let ignitionRadius = 0;
    if (fireIgnition && now >= fireIgnition.atMs) {
      ignitionRadius = fireIgnition.radiusM;
      ignitionGrowthNow = fireIgnition.growthRateMpm * windGrowthMultiplier;
      growthAdd += ignitionGrowthNow * ((now - fireIgnition.atMs) / 1000 / 60);
    }

    // Suppression from active tasks, integrated over their active duration.
    // Rate depends on hose-attack mode: interior attack is most effective,
    // exterior attack limited, exterior cooling mostly holds exposures.
    // BA SAR doing internal attack while searching adds a smaller bump.
    let suppressionSub = 0;
    for (const t of tasks) {
      if (t.state === "aborted") continue;
      const rate = suppressionRateFor(t, material, isolatedHazards, tasks);
      if (rate === 0) continue;
      suppressionSub += rate * (taskDurationSec(t, now) / 60);
    }

    fireRadiusM = Math.min(
      maxR,
      Math.max(0, seat.radiusM + ignitionRadius + growthAdd - suppressionSub),
    );

    // Current instantaneous rate: growth minus active-task suppression.
    fireRateMpm = growth + ignitionGrowthNow - activeSuppressionNow;
    // Once at zero radius, cap rate at 0 (out).
    if (fireRadiusM <= 0) fireRateMpm = Math.max(0, fireRateMpm);
  }

  // --- Fire stage classification ------------------------------------------
  // Derived from current radius (as a fraction of the scenario's modelled
  // maximum) and whether the fire is currently growing or shrinking. Used
  // for SITREP colouring, tactical guidance and flashover risk.
  let fireStage: FireStage = "none";
  let flashoverCountdownSec: number | null = null;
  if (scene?.fireSeat) {
    const maxR = scene.fireSeat.maxRadiusM ?? 15;
    const pct = maxR > 0 ? fireRadiusM / maxR : 0;
    const shrinking = fireRateMpm < -0.01;
    // Alarm scenarios author a dormant seat (radius 0, growth 0) that only
    // an informant ignition lights — until then there is genuinely no
    // fire, which must read as "none", never "extinguished".
    const neverBurned =
      scene.fireSeat.radiusM <= 0 &&
      (scene.fireSeat.growthRateMpm ?? 0.2) <= 0 &&
      !fireIgnition;
    if (neverBurned) {
      fireStage = "none";
    } else if (fireRadiusM <= 0.1) {
      fireStage = shrinking || firstArrival !== null ? "extinguished" : "incipient";
    } else if (shrinking) {
      fireStage = "under_control";
    } else if (pct >= 0.9) {
      fireStage = "flashover_risk";
    } else if (pct >= 0.6) {
      fireStage = "fully_developed";
    } else if (pct >= 0.3) {
      fireStage = "developing";
    } else {
      fireStage = "incipient";
    }

    // Flashover countdown: once we enter the risk band, tick down from
    // FLASHOVER_COUNTDOWN_SEC. Reset the clock if the fire is being
    // knocked down (rate negative) so aggressive interior attack buys
    // the operator time.
    if (fireStage === "flashover_risk") {
      // Approximate how long we've been at flashover-risk by the overshoot
      // beyond the 90% threshold, divided by growth rate. Cap at the
      // configured window so the display shows a sensible countdown.
      const overshootM = fireRadiusM - maxR * 0.9;
      const growRateMpm = Math.max(0.05, (scene.fireSeat.growthRateMpm ?? 0.2) - activeSuppressionNow);
      const atRiskSec = Math.max(0, (overshootM / growRateMpm) * 60);
      flashoverCountdownSec = Math.max(0, FLASHOVER_COUNTDOWN_SEC - atRiskSec);
    }
  }

  // --- Hazard reveal + mitigation ------------------------------------------
  const mitigatedHazardIds = tasks
    .filter((t) => t.kind === "mitigate_hazard" && t.state === "completed" && t.hazardId)
    .map((t) => t.hazardId!) as string[];
  const visibleHazards: SceneHazard[] = [];
  if (scene) {
    const onSceneMinutes = secondsAnyOnScene / 60;
    for (const h of scene.hazards) {
      if (mitigatedHazardIds.includes(h.id)) continue;
      if (h.knownFromPri) {
        visibleHazards.push(h);
        continue;
      }
      if (h.discoverAfterMinOnScene !== undefined && onSceneMinutes >= h.discoverAfterMinOnScene) {
        visibleHazards.push(h);
      }
    }
  }

  // --- Casualty discovery (BA SAR-driven) ----------------------------------
  // Cumulative (BA wearer × minute) from ba_sar tasks.
  let baSarMinutes = 0;
  for (const t of tasks) {
    if (t.kind !== "ba_sar") continue;
    if (t.state === "aborted") continue;
    const secs = taskDurationSec(t, now);
    const crewSize = t.baCrewIds?.length ?? 2;
    baSarMinutes += (crewSize * secs) / 60;
  }

  const foundCasualties: SceneCasualty[] = [];
  if (scene?.casualties) {
    for (const c of scene.casualties) {
      if (absent.has(c.id)) continue; // not in the building this run
      if (baSarMinutes >= c.discoverAfterMinBa) {
        foundCasualties.push(c);
      }
    }
  }

  // --- Casualty progression ----------------------------------------------
  // Each casualty ticks through a stage machine:
  //   undiscovered → located (once BA SAR crosses their discovery threshold)
  //   located     → in_treatment  (paired ambulance is on scene with them)
  //   in_treatment→ conveying     (paired ambulance departs for hospital)
  //   conveying   → at_hospital   (paired ambulance arrives at hospital)
  //   (any non-final stage) → expectant if flashover happens or deterioration
  //                                       clock reaches 'expectant' severity.
  //
  // Pairings are explicit: each ambulance can treat one casualty at a time.
  // The deterioration clock keeps ticking on any casualty that isn't paired
  // with an on-scene ambulance. An ambulance simply being on scene no
  // longer counts — the operator has to actively pair it with a casualty.
  const casualtyProgression: Record<string, CasualtyProgression> = {};
  if (scene?.casualties) {
    // Index casualty → deployment treating them. Honours pairings where
    // the ambulance is either on scene, en route to hospital, at hospital,
    // or has already dropped them at hospital (in which case the casualty
    // stays "at_hospital" even after the ambulance returns to station —
    // the pairing record itself is the source of truth that this casualty
    // was conveyed here by this crew).
    // Multi-unit pairing: any number of deployments may be paired to the
    // same casualty. For severity/stage we collapse to one "winning"
    // pairing per casualty, ranked by lifecycle:
    //   at-hospital > conveying > on-scene > en-route.
    // That keeps downstream stage logic (conveying / at_hospital) right
    // even when e.g. a DCA conveys while an AP stays on scene for the
    // next casualty.
    const pairingByCasualtyId: Record<string, Deployment> = {};
    const rank = (d: Deployment): number => {
      if (d.hospitalArrivesAt !== undefined && now >= d.hospitalArrivesAt) return 3;
      if (d.hospitalLegStartedAt) return 2;
      if (now >= d.arrivesAt) return 1;
      return 0;
    };
    for (const d of deployments) {
      if (!d.treatingCasualtyId) continue;
      if (now < d.arrivesAt && !d.hospitalLegStartedAt) continue;
      if (d.returnStartedAt && !d.hospitalArrivesAt) continue;
      const existing = pairingByCasualtyId[d.treatingCasualtyId];
      if (!existing || rank(d) > rank(existing)) {
        pairingByCasualtyId[d.treatingCasualtyId] = d;
      }
    }

    for (const c of scene.casualties) {
      if (absent.has(c.id)) continue; // not in the building this run
      const located = baSarMinutes >= c.discoverAfterMinBa;
      const paired = pairingByCasualtyId[c.id];
      // Treatment is paused while paired with an on-scene ambulance OR
      // while conveying. Once delivered to hospital, the casualty stays
      // "at_hospital" for the rest of the incident.
      const inTreatmentOnScene =
        paired !== undefined &&
        !paired.hospitalLegStartedAt &&
        isOnScene(paired, now);
      const conveying =
        paired !== undefined &&
        paired.hospitalLegStartedAt !== undefined &&
        (paired.hospitalArrivesAt === undefined || now < paired.hospitalArrivesAt);
      const atHospital =
        paired !== undefined &&
        paired.hospitalArrivesAt !== undefined &&
        now >= paired.hospitalArrivesAt;

      const treated = inTreatmentOnScene || conveying || atHospital;

      // Compute effective severity by deteriorating the authored severity
      // one grade per CASUALTY_DETERIORATION_SEC the incident has been
      // running untreated. Cap at "expectant". Clinical treatment
      // reshapes this: each relevant intervention buys the operator
      // extra time, while *missed* critical red-flag interventions cut
      // the deterioration window in half.
      const incidentSec = Math.max(0, (now - incident.receivedAt) / 1000);
      const initialSeverity = (c.severity as CasualtyProgression["severity"]) ?? "serious";
      let effectiveIdx = SEVERITY_ORDER.indexOf(initialSeverity);
      if (!treated) {
        const tx = treatmentByCasualtyId?.[c.id];
        const { windowSec, savedGrades } = treatmentModifiers(tx, incidentSec);
        const worseningRaw = Math.floor(incidentSec / windowSec);
        const worsening = Math.max(0, worseningRaw - savedGrades);
        effectiveIdx = Math.min(SEVERITY_ORDER.length - 1, effectiveIdx + worsening);
      }
      const severity = SEVERITY_ORDER[effectiveIdx];

      let stage: CasualtyStage;
      if (atHospital) stage = "at_hospital";
      else if (conveying) stage = "conveying";
      else if (inTreatmentOnScene) stage = "in_treatment";
      else if (!located) stage = "undiscovered";
      else stage = "located";

      // Flashover eats any casualty still inside.
      if (
        fireStage === "flashover_risk" &&
        flashoverCountdownSec === 0 &&
        (stage === "undiscovered" || stage === "located")
      ) {
        stage = "expectant";
      }

      const finalStage = severity === "expectant" ? "expectant" : stage;
      const paused =
        finalStage === "in_treatment" ||
        finalStage === "conveying" ||
        finalStage === "at_hospital" ||
        finalStage === "expectant";
      const nextDeteriorationAt = paused
        ? null
        : incident.receivedAt + (effectiveIdx + 1) * CASUALTY_DETERIORATION_SEC * 1000;

      casualtyProgression[c.id] = {
        stage: finalStage,
        deteriorateAt: nextDeteriorationAt,
        severity,
      };
    }
  }

  return {
    fireRadiusM,
    fireRateMpm,
    fireStage,
    flashoverCountdownSec,
    fireMaterial: scene?.fireSeat ? material : null,
    fireMaterialKnown:
      !scene?.fireSeat?.unknownMaterial ||
      tasks.some((t) => t.kind === "survey" && t.state === "completed"),
    visibleHazards,
    mitigatedHazardIds,
    foundCasualties,
    casualtyProgression,
    absentCasualtyIds: Array.from(absent),
    exposureBreached:
      !!scene?.exposureRisk && fireRadiusM >= scene.exposureRisk.atRadiusM,
    firstArrivalElapsedSec:
      firstArrival === null ? 0 : Math.max(0, (now - firstArrival) / 1000),
    baMinutesOnScene,
    baSarMinutes,
  };
}

/**
 * Compute the effect of treatment on casualty deterioration. Returns a
 * modified deterioration window plus a count of "saved grades" — each
 * survived grade reverses one step of worsening (so good treatment can
 * effectively *rewind* the clock). Missed critical interventions shrink
 * the window, speeding decay.
 *
 * Rules:
 *  • Running a primary survey and giving oxygen each save 1 grade.
 *  • IV access saves 1 grade.
 *  • Each correct intervention for a present red flag saves 2 grades.
 *  • Each MISSED critical intervention (flag present, action not done
 *    more than 4 minutes after survey) halves the window.
 *  • ATMIST sent to the right destination is worth 1 grade (improves
 *    outcome at hospital; scored at debrief).
 */
function treatmentModifiers(
  tx: PatientTreatmentState | undefined,
  incidentSec: number,
): { windowSec: number; savedGrades: number } {
  if (!tx) return { windowSec: CASUALTY_DETERIORATION_SEC, savedGrades: 0 };
  let savedGrades = 0;
  let windowMult = 1;

  if (tx.surveyCompletedAt) savedGrades += 1;
  if (tx.breathing.oxygen_15l !== undefined) savedGrades += 1;
  if (tx.circulation.iv_access !== undefined) savedGrades += 1;

  const redFlags = tx.revealedRedFlags ?? [];
  const has = (f: PatientRedFlag) => redFlags.includes(f);

  // Correct-intervention credit + missed-intervention penalty.
  const credits: { flag: PatientRedFlag; done: boolean }[] = [
    { flag: "tension_pneumothorax", done: tx.breathing.needle_decomp !== undefined || tx.breathing.finger_thoracostomy !== undefined },
    { flag: "major_haemorrhage", done: tx.drugs.tXA_iv !== undefined || tx.packaging.tourniquet !== undefined || tx.packaging.wound_pack !== undefined || tx.packaging.pelvic_binder !== undefined },
    { flag: "hypovolaemic_shock", done: tx.circulation.fluids_500 !== undefined || tx.circulation.fluids_250 !== undefined || tx.drugs.blood_prbc !== undefined },
    { flag: "cardiac_arrest", done: tx.circulation.cpr !== undefined || tx.drugs.adrenaline_cpr !== undefined },
    { flag: "airway_compromise", done: tx.airway.igel !== undefined || tx.airway.opa !== undefined || tx.airway.rsi !== undefined },
    { flag: "stemi", done: tx.drugs.aspirin_300 !== undefined },
    { flag: "anaphylaxis", done: tx.drugs.adrenaline_im_anaphylaxis !== undefined },
    { flag: "severe_asthma", done: tx.drugs.salbutamol_neb !== undefined },
    { flag: "hypoglycaemia", done: tx.drugs.glucagon_im !== undefined || tx.drugs.dextrose_iv !== undefined },
    { flag: "seizure_active", done: tx.drugs.midazolam_im !== undefined },
    { flag: "overdose_opioid", done: tx.drugs.naloxone !== undefined },
    { flag: "head_injury_severe", done: tx.packaging.spine_board !== undefined },
    { flag: "spinal_injury_suspected", done: tx.packaging.spine_board !== undefined || tx.packaging.scoop_stretcher !== undefined || tx.packaging.ked !== undefined },
  ];

  // Post-survey grace period — operator gets 4 min from survey completion
  // before "missed" penalties kick in.
  const survey = tx.surveyCompletedAt;
  const elapsedSinceSurveySec = survey ? Math.max(0, (Date.now() - survey) / 1000) : 0;
  const graceActive = !survey || elapsedSinceSurveySec < 240;

  for (const { flag, done } of credits) {
    if (!has(flag)) continue;
    if (done) {
      savedGrades += 2;
    } else if (!graceActive) {
      // Missed critical intervention — each one halves the window,
      // stacking multiplicatively.
      windowMult *= 0.5;
    }
  }

  // ATMIST pre-alert sent — 1-grade credit (improves handover / outcome).
  if (tx.atmistSentAt) savedGrades += 1;

  // Destination correctness — delivering to the preferred destination
  // buys another grade. Wrong destination (e.g. STEMI to generic A&E)
  // loses a saved grade. Only evaluated once a destination is chosen.
  if (tx.chosenDestination && tx.preferredDestination) {
    if (tx.chosenDestination.type === tx.preferredDestination) savedGrades += 1;
    else if (tx.preferredDestination !== "nearest_a_e") savedGrades = Math.max(0, savedGrades - 1);
  }

  const windowSec = CASUALTY_DETERIORATION_SEC * windowMult;
  // Cap saved grades at what the incident clock could have produced so
  // the sim never reports "better than starting state".
  const maxPossible = Math.floor(incidentSec / Math.max(60, windowSec));
  return { windowSec, savedGrades: Math.min(savedGrades, maxPossible + 4) };
}
