import type {
  Deployment,
  Incident,
  IncidentOutcome,
  LogEntry,
  OutcomeMetric,
  PatientTreatmentState,
  Task,
} from "./incident_types";
import type { IncidentSimState } from "./incident_sim";

const MOBILISE_TARGET_SEC = 90;
const ATTENDANCE_TARGET_SEC = 10 * 60;

function fmtSecs(s: number | null | undefined): string {
  if (s === null || s === undefined || !Number.isFinite(s)) return "—";
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}m ${r}s`;
}

export function scoreIncident(
  incident: Incident,
  deployments: Deployment[],
  sim?: IncidentSimState | null,
  treatmentByCasualtyId?: Record<string, PatientTreatmentState>,
  log?: LogEntry[],
  tasks?: Task[],
  /** Set when command was handed to an on-scene commander. Only the
   *  mobilising decisions are the operator's to answer for. */
  delegatedTo?: string | null,
): IncidentOutcome {
  const metrics: OutcomeMetric[] = [];

  // 1. Time to mobilise first appliance
  const firstMobilised = deployments.reduce<number | null>((acc, d) => {
    if (acc === null || d.mobilisedAt < acc) return d.mobilisedAt;
    return acc;
  }, null);
  const mobiliseSec =
    firstMobilised !== null ? (firstMobilised - incident.receivedAt) / 1000 : null;
  metrics.push({
    label: "Time to mobilise first appliance",
    target: `< ${fmtSecs(MOBILISE_TARGET_SEC)}`,
    actual: mobiliseSec !== null ? fmtSecs(mobiliseSec) : "not mobilised",
    passed: mobiliseSec !== null && mobiliseSec <= MOBILISE_TARGET_SEC,
  });

  // 2. First in attendance
  const firstArrival = deployments.reduce<number | null>((acc, d) => {
    if (acc === null || d.arrivesAt < acc) return d.arrivesAt;
    return acc;
  }, null);
  const attendanceSec =
    firstArrival !== null ? (firstArrival - incident.receivedAt) / 1000 : null;
  metrics.push({
    label: "First appliance in attendance",
    target: `< ${fmtSecs(ATTENDANCE_TARGET_SEC)}`,
    actual: attendanceSec !== null ? fmtSecs(attendanceSec) : "none arrived",
    passed: attendanceSec !== null && attendanceSec <= ATTENDANCE_TARGET_SEC,
  });

  // 3. PDA conformance
  const pdaSlots = incident.scenario.pda;
  const filledSlotIds = new Set(deployments.map((d) => d.slotId));
  const filled = pdaSlots.filter((s) => filledSlotIds.has(s.id)).length;
  const pdaComplete = filled === pdaSlots.length;
  metrics.push({
    label: "PDA conformance",
    target: `${pdaSlots.length} of ${pdaSlots.length} slots filled`,
    actual: `${filled} of ${pdaSlots.length}`,
    passed: pdaComplete ? true : filled > 0 ? "partial" : false,
  });

  // 4. Over-mobilisation (soft signal, not a hard fail)
  const over = deployments.length - pdaSlots.length;
  metrics.push({
    label: "Discipline — committed vs PDA",
    target: `= ${pdaSlots.length}`,
    actual: `${deployments.length}${over > 0 ? ` (+${over})` : ""}`,
    passed: over <= 0 ? true : "partial",
  });

  // Command was handed over: the mobilising is scored, the ground is
  // the commander's, and the debrief says so rather than marking a row
  // of failures against work the operator gave away.
  if (delegatedTo) {
    const passedCount = metrics.filter((m) => m.passed === true).length;
    const partialCount = metrics.filter((m) => m.passed === "partial").length;
    const totalCount = metrics.length;
    const ratio = totalCount === 0 ? 0 : (passedCount + partialCount * 0.5) / totalCount;
    const grade: IncidentOutcome["grade"] =
      ratio >= 0.95 ? "A" : ratio >= 0.75 ? "B" : ratio >= 0.5 ? "C" : ratio >= 0.25 ? "D" : "F";
    metrics.push({
      label: "Command",
      target: "Incident commander appointed",
      actual: `Handed to ${delegatedTo}`,
      passed: true,
    });
    return {
      metrics,
      passedCount: passedCount + 1,
      totalCount: totalCount + 1,
      grade,
      summary:
        `Command handed to ${delegatedTo}; the incident closed on their word. ` +
        (grade === "A"
          ? "The mobilising was exemplary."
          : grade === "B"
            ? "The mobilising was sound, with small margins missed."
            : grade === "C"
              ? "The mobilising had notable gaps."
              : grade === "D"
                ? "The mobilising missed several targets."
                : "The mobilising fell well short."),
    };
  }

  // 5. Fire outcome — did we extinguish / did it flash over?
  if (sim && incident.scenario.scene?.fireSeat) {
    const extinguished = sim.fireStage === "extinguished" || sim.fireRadiusM <= 0.1;
    const flashoverReached = !!log?.some(
      (e) => e.kind === "fire_stage" && /flashover/i.test(e.message),
    );
    metrics.push({
      label: "Fire outcome",
      target: "Extinguished before stop message",
      actual: extinguished
        ? flashoverReached
          ? "Extinguished (flashover reached)"
          : "Extinguished"
        : flashoverReached
          ? "Flashover reached, still burning"
          : `Not extinguished · ${sim.fireStage.replace(/_/g, " ")}`,
      passed: extinguished && !flashoverReached
        ? true
        : extinguished
          ? "partial"
          : false,
    });
  }

  // 5b. Exposure protection — did the fire get into the attached
  //     neighbour / adjacent unit? The breach log entry is the durable
  //     record (written on the rising edge), so a later knock-down
  //     doesn't erase the failure.
  const exposureRisk = incident.scenario.scene?.exposureRisk;
  if (exposureRisk && incident.scenario.scene?.fireSeat) {
    const breached = !!log?.some((e) => e.id.startsWith("exposure:"));
    metrics.push({
      label: `Exposure held — ${exposureRisk.label}`,
      target: "Fire kept out of the exposure",
      actual: breached ? "Fire spread into the exposure" : "Exposure protected",
      passed: !breached,
    });
  }

  // 6. Casualty outcomes — each scene casualty is evaluated individually
  //    based on progression stage + destination choice. Casualties the
  //    persons-reality roll removed from this run don't count against
  //    the operator — nobody can rescue someone who wasn't there.
  const absentIds = new Set(sim?.absentCasualtyIds ?? []);
  const casualties = (incident.scenario.scene?.casualties ?? []).filter(
    (c) => !absentIds.has(c.id),
  );
  if (casualties.length > 0) {
    let delivered = 0;
    let expectant = 0;
    let undiscovered = 0;
    for (const c of casualties) {
      const prog = sim?.casualtyProgression[c.id];
      if (!prog) continue;
      if (prog.stage === "at_hospital") delivered++;
      else if (prog.stage === "expectant") expectant++;
      else if (prog.stage === "undiscovered") undiscovered++;
    }
    metrics.push({
      label: "Casualties · delivered to hospital",
      target: `${casualties.length} of ${casualties.length}`,
      actual: `${delivered} of ${casualties.length}`,
      passed: delivered === casualties.length
        ? true
        : delivered > 0
          ? "partial"
          : false,
    });
    if (expectant > 0) {
      metrics.push({
        label: "Casualties · expectant",
        target: "0",
        actual: `${expectant}`,
        passed: false,
      });
    }
    if (undiscovered > 0) {
      metrics.push({
        label: "Casualties · undiscovered",
        target: "0",
        actual: `${undiscovered}`,
        passed: "partial",
      });
    }
  }

  // 7. Treatment quality — for every casualty discovered, measure whether
  //    the critical red-flag interventions were actually applied.
  if (treatmentByCasualtyId && casualties.length > 0) {
    let applied = 0;
    let required = 0;
    for (const c of casualties) {
      const tx = treatmentByCasualtyId[c.id];
      if (!tx || !tx.revealedRedFlags) continue;
      required += tx.revealedRedFlags.length;
      for (const f of tx.revealedRedFlags) {
        if (wasHandled(f, tx)) applied += 1;
      }
    }
    if (required > 0) {
      metrics.push({
        label: "Clinical interventions vs red flags",
        target: `${required} of ${required}`,
        actual: `${applied} of ${required}`,
        passed: applied === required
          ? true
          : applied >= required / 2
            ? "partial"
            : false,
      });
    }
  }

  // 8. Destination correctness — delivering patients to the right place.
  if (treatmentByCasualtyId) {
    let correct = 0;
    let total = 0;
    for (const c of casualties) {
      const tx = treatmentByCasualtyId[c.id];
      if (!tx?.preferredDestination || !tx.chosenDestination) continue;
      total += 1;
      if (tx.chosenDestination.type === tx.preferredDestination) correct += 1;
    }
    if (total > 0) {
      metrics.push({
        label: "Destination match",
        target: `${total} of ${total}`,
        actual: `${correct} of ${total}`,
        passed: correct === total
          ? true
          : correct > 0
            ? "partial"
            : false,
      });
    }
  }

  // 9. Setbacks incurred (informational — each one is a blip, stack them up).
  const setbackCount = (log ?? []).filter((e) => e.kind === "setback").length;
  if (setbackCount > 0) {
    metrics.push({
      label: "Setbacks incurred",
      target: "Minimise",
      actual: `${setbackCount}`,
      passed: setbackCount <= 1 ? true : setbackCount <= 3 ? "partial" : false,
    });
  }

  // 10. BA TOW discipline — if any wearer went overdue (whistle time
  //     passed before they were withdrawn), flag it.
  if (tasks) {
    let overdue = 0;
    for (const t of tasks) {
      if (t.kind !== "ba_sar") continue;
      for (const [, whistleAt] of Object.entries(t.baWhistleAt ?? {})) {
        const wAt = whistleAt as number;
        // If task was aborted/completed, check against completion time.
        const end =
          t.state === "aborted" || t.state === "completed"
            ? (t.completesAt ?? Date.now())
            : Date.now();
        if (end > wAt + 30_000) overdue += 1;
      }
    }
    if (overdue > 0) {
      metrics.push({
        label: "BA TOW discipline",
        target: "All withdrawn before whistle",
        actual: `${overdue} wearer${overdue === 1 ? "" : "s"} overdue`,
        passed: false,
      });
    }
  }

  const passedCount = metrics.filter((m) => m.passed === true).length;
  const partialCount = metrics.filter((m) => m.passed === "partial").length;
  const totalCount = metrics.length;
  const ratio = (passedCount + partialCount * 0.5) / totalCount;

  const grade: IncidentOutcome["grade"] =
    ratio >= 0.95 ? "A" : ratio >= 0.75 ? "B" : ratio >= 0.5 ? "C" : ratio >= 0.25 ? "D" : "F";

  const summary =
    grade === "A"
      ? "Exemplary dispatch — meets every target."
      : grade === "B"
        ? "Solid dispatch; small margins missed."
        : grade === "C"
          ? "Adequate but notable gaps."
          : grade === "D"
            ? "Poor outcome — multiple targets missed."
            : "Failed dispatch — significant reassessment needed.";

  return { metrics, passedCount, totalCount, grade, summary };
}

/** Whether a given red flag had its matching treatment action applied. */
function wasHandled(
  flag: import("./scene").PatientRedFlag,
  tx: PatientTreatmentState,
): boolean {
  switch (flag) {
    case "tension_pneumothorax":
      return !!(tx.breathing.needle_decomp || tx.breathing.finger_thoracostomy);
    case "major_haemorrhage":
      return !!(
        tx.drugs.tXA_iv ||
        tx.packaging.tourniquet ||
        tx.packaging.wound_pack ||
        tx.packaging.pelvic_binder
      );
    case "hypovolaemic_shock":
      return !!(tx.circulation.fluids_500 || tx.circulation.fluids_250 || tx.drugs.blood_prbc);
    case "cardiac_arrest":
      return !!(tx.circulation.cpr || tx.drugs.adrenaline_cpr);
    case "airway_compromise":
      return !!(tx.airway.igel || tx.airway.opa || tx.airway.rsi);
    case "stemi":
      return !!tx.drugs.aspirin_300;
    case "anaphylaxis":
      return !!tx.drugs.adrenaline_im_anaphylaxis;
    case "severe_asthma":
      return !!tx.drugs.salbutamol_neb;
    case "hypoglycaemia":
      return !!(tx.drugs.glucagon_im || tx.drugs.dextrose_iv);
    case "seizure_active":
      return !!tx.drugs.midazolam_im;
    case "overdose_opioid":
      return !!tx.drugs.naloxone;
    case "head_injury_severe":
      return !!tx.packaging.spine_board;
    case "spinal_injury_suspected":
      return !!(tx.packaging.spine_board || tx.packaging.scoop_stretcher || tx.packaging.ked);
    case "stroke_fast_positive":
      return !!tx.chosenDestination && tx.chosenDestination.type === "hasu";
  }
}
