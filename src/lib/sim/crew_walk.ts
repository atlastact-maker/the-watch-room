// THE WALK TO THE PATIENT. A crew is not with the patient the moment the
// wheels stop: they get out, grab the bags and cross the ground. The map
// draws that walk, and nothing clinical can start until it is done — the
// same clock for both, so the screen and the picture agree.

import type { Deployment } from "./incident_types";
import type { SceneCasualty } from "./scene";
import { latLngToMetres, metresToLatLng } from "./scene";

/** Walking pace with kit, metres per second. */
export const WALK_MPS = 1.3;
/** Even a patient at the back doors takes a moment to reach. */
export const WALK_MIN_MS = 3000;

export function walkMs(metres: number): number {
  return Math.max(WALK_MIN_MS, (metres / WALK_MPS) * 1000);
}

/** When this crew steps out towards the patient: on arrival, or when the
 *  pairing was made if that came later. */
export function crewStepsOutAt(d: Deployment): number {
  return Math.max(d.arrivesAt, d.treatingSince ?? d.arrivesAt);
}

/**
 * When this crew is at the patient's side. `atVehicle` is for a patient
 * who was brought to the vehicle by someone else — carried out of the
 * building, cut out of the car, landed from the water or the face — so
 * the walk is the few metres to the back doors.
 */
export function crewWithPatientAt(
  d: Deployment,
  casualty: SceneCasualty,
  incidentCoords: { lat: number; lng: number },
  opts: { atVehicle?: boolean } = {},
): number {
  const start = crewStepsOutAt(d);
  if (opts.atVehicle || !d.parkingPos) return start + WALK_MIN_MS;
  const where = metresToLatLng(incidentCoords, casualty.pos);
  const o = latLngToMetres(d.parkingPos, where);
  return start + walkMs(Math.hypot(o.x, o.y));
}

/** Whether the patient is beside the vehicle rather than where they fell. */
export function patientAtVehicle(
  casualty: SceneCasualty,
  stage: string,
  tasks: readonly { kind: string; casualtyId?: string; state: string }[],
): boolean {
  if (casualty.inWater || casualty.atHeight) return true;
  if (stage === "extricated") return true;
  return tasks.some((t) => t.kind === "extract_casualty" && t.casualtyId === casualty.id && t.state === "completed");
}
