/**
 * Live vitals — the numbers on the monitor, moved on every tick.
 *
 * The engine itself lives in physiology.ts: a hidden patient state (blood
 * volume, airway patency, bronchospasm, drug levels, …) from which the
 * target vitals are derived, with every drug and intervention acting on
 * that state with an onset, a peak and a wear-off. This module keeps the
 * entry point the dashboard has always called.
 */

import type { PatientTreatmentState } from "./incident_types";
import { advancePhysiology } from "./physiology";

/** How far back the trend arrows compare. Fast enough to feel live,
 *  slow enough that an arrow means something. */
export const TREND_BASELINE_SEC = 4;

/**
 * Advance live vitals by `dtSec` seconds. Returns the new treatment state
 * (liveVitals + prevLiveVitals + activeRedFlags + physiology updated); all
 * other fields pass through unchanged.
 */
export function advanceLiveVitals(
  tx: PatientTreatmentState,
  dtSec: number,
  nowMs: number,
): PatientTreatmentState {
  return advancePhysiology(tx, dtSec, nowMs);
}
