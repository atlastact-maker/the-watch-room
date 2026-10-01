import type { PatientTreatmentState, EgressAction } from "./incident_types";
import type { PatientClinical, PatientRedFlag } from "./scene";

type Vitals = PatientClinical["vitals"];
import type { ResusState } from "./resus";

// Moving a patient who is not yet stable. The desk lets the operator do
// it — the way out is sometimes the treatment — but it is never free:
// compressions on the move are worse, bleeding and a tension get worse
// with the handling, pressure in a head goes up, and the first minutes
// after ROSC are the worst time to be bumped across a field. The costs
// here are what the physiology and the resus engine apply while the
// treatment's move window is open; the warnings are what the care pane
// shows before the operator presses Move.

/** Is the patient on the move right now. */
export function isMoving(tx: PatientTreatmentState | undefined, now: number): boolean {
  return tx?.moveEndsAt !== undefined && now < tx.moveEndsAt;
}

/** How much of the compression quality survives the carry. A LUCAS keeps
 *  all of it — that is the device's case. A trolley or vacuum mattress
 *  is flat and steady; a scoop or carry sheet is worse; a manual carry
 *  is a pair of hands on a chest that is going up a bank. */
export function movingCprFactor(action: EgressAction | undefined): number {
  switch (action) {
    case "trolley":
    case "vacuum_mattress":
      return 0.8;
    case "carry_sheet":
      return 0.6;
    case "manual_carry":
      return 0.45;
    default:
      return 0.7;
  }
}

export type MovingRisk = {
  flag: PatientRedFlag | "post_rosc" | "unstable_obs";
  /** What moving now does, in the crew's words. */
  cost: string;
  /** What would make it safe, or safer. */
  fix: string;
};

/** Why moving this patient now will cost something. Empty means stable
 *  enough to move. `lucas` is whether mechanical CPR is on the chest. */
export function movingRisks(
  flags: readonly PatientRedFlag[],
  vitals: Vitals | undefined,
  resus: ResusState | undefined,
  now: number,
): MovingRisk[] {
  const out: MovingRisk[] = [];
  const lucasOn = resus?.lucasFittedAt !== undefined && now >= resus.lucasFittedAt + 20_000;
  const inArrest = flags.includes("cardiac_arrest") || (resus !== undefined && resus.roscAt === undefined && resus.roleAt === undefined);
  if (inArrest) {
    if (!lucasOn) {
      out.push({
        flag: "cardiac_arrest",
        cost: "Compressions on the move are half as good, and the chance of getting him back drops with them",
        fix: "Fit the LUCAS first if there is one, or stay and work the arrest where he lies",
      });
    }
  } else if (resus?.roscAt !== undefined && now - resus.roscAt < 10 * 60_000) {
    out.push({
      flag: "post_rosc",
      cost: "Minutes after ROSC the heart is at its most fragile — handling him now makes a re-arrest more likely",
      fix: "Hold ten minutes, settle the airway and the pressure, then move",
    });
  }
  if (flags.includes("tension_pneumothorax")) {
    out.push({ flag: "tension_pneumothorax", cost: "An undecompressed tension gets worse with every jolt", fix: "Needle decompression or thoracostomy before the carry" });
  }
  if (flags.includes("major_haemorrhage") || (flags.includes("hypovolaemic_shock") && (vitals?.bpSys ?? 120) < 90)) {
    out.push({ flag: "major_haemorrhage", cost: "Uncontrolled bleeding bleeds faster when the patient is handled", fix: "Tourniquet, wound pack or pelvic binder on first" });
  }
  if (flags.includes("airway_compromise")) {
    out.push({ flag: "airway_compromise", cost: "An unsecured airway is lost on a stretcher, and nobody can suction on the move", fix: "Secure the airway before moving" });
  }
  if (flags.includes("head_injury_severe") && (vitals?.gcs ?? 15) < 9) {
    out.push({ flag: "head_injury_severe", cost: "Pressure in the head rises with the handling", fix: "Airway and ventilation managed, then a flat, steady carry" });
  }
  if (flags.includes("spinal_injury_suspected")) {
    out.push({ flag: "spinal_injury_suspected", cost: "An unprotected spine moved is a cord injury waiting to happen", fix: "Immobilise fully before the move" });
  }
  if (!inArrest && vitals && (vitals.spo2 < 88 || vitals.bpSys < 80)) {
    out.push({ flag: "unstable_obs", cost: "The numbers are not holding — a carry is the wrong moment to find out how far they fall", fix: "Oxygen, fluids, a reason found; move when the trend turns" });
  }
  return out;
}
