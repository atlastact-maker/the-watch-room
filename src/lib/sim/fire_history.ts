// Fire size over time, per incident, kept on the client for the fireground
// board's trace. Recorded wherever the simulation is ticked so the trace
// is there whenever the board is opened, not only while it is on screen.
// One sample a second at most; forty minutes kept.

export type FireSample = { t: number; r: number };

const HISTORY = new Map<string, FireSample[]>();
const KEEP = 40 * 60;

export function recordFire(incidentId: string, now: number, radiusM: number): void {
  let hist = HISTORY.get(incidentId);
  if (!hist) {
    hist = [];
    HISTORY.set(incidentId, hist);
  }
  const last = hist[hist.length - 1];
  if (last && now - last.t < 1000) return;
  hist.push({ t: now, r: radiusM });
  if (hist.length > KEEP) hist.splice(0, hist.length - KEEP);
}

export function fireHistory(incidentId: string): FireSample[] {
  return HISTORY.get(incidentId) ?? [];
}
