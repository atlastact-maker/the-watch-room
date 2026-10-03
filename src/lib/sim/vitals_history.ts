// Live vitals over time, per casualty, kept on the client for the patient
// board's trends. Sampled every five seconds at most, forty minutes kept.
// Recorded wherever the vitals are ticked so the trends are there whenever
// the board is opened, not only while it is on screen.

import type { PatientClinical } from "./scene";

export type VitalsSample = { t: number; hr: number; spo2: number; bpSys: number; rr: number };

const HISTORY = new Map<string, VitalsSample[]>();
const EVERY_MS = 5000;
const KEEP = (40 * 60 * 1000) / EVERY_MS;

export function recordVitals(casualtyId: string, now: number, v: PatientClinical["vitals"]): void {
  let hist = HISTORY.get(casualtyId);
  if (!hist) {
    hist = [];
    HISTORY.set(casualtyId, hist);
  }
  const last = hist[hist.length - 1];
  if (last && now - last.t < EVERY_MS) return;
  hist.push({ t: now, hr: v.hr, spo2: v.spo2, bpSys: v.bpSys, rr: v.rr });
  if (hist.length > KEEP) hist.splice(0, hist.length - KEEP);
}

export function vitalsHistory(casualtyId: string): readonly VitalsSample[] {
  return HISTORY.get(casualtyId) ?? [];
}
