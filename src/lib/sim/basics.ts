// A BASICS doctor in Greater Manchester is a rare, geographically biased,
// non-guaranteed asset. The scheme whose area reaches GM — the North West
// Pre-hospital Critical Care Charity, Warrington-based — did roughly 384
// incidents in 2024 across four counties, against NWAA's 3,862 missions.
// So the honest mechanic is one where the most common answer is no answer,
// and the request is an alert, not a dispatch.
//
// How it actually works in the North West (NWPCCC clinician, Aug 2023):
// an automated text alert reaches every responder handset within 20 miles
// of the incident; if a responder is needed the NWAS Complex Incident Hub
// phones them, checks availability and formally dispatches. Not a pager —
// no current North West source mentions one.
//
// Every NUMBER below is a modelling judgement. No North West scheme
// publishes activation-to-scene times or answer rates; both the research
// and its adversarial checker looked and found nothing. The two volume
// signals the probabilities are calibrated against are NWPCCC's ~384/yr
// over four counties and BEEP Doctors' 183 callouts with 13 doctors in
// Cumbria in 2025.

export type BasicsResponder = {
  applianceId: string;
  callsign: string;
  /** Where they mobilise from — home or work, not a station. */
  anchor: { lat: number; lng: number; label: string };
};

export type BasicsRoll = {
  /** Every responder inside the 20-mile broadcast radius. Empty means no
   *  alert is sent at all — the honest outcome for Wigan or Rochdale. */
  alerted: BasicsResponder[];
  /** Seconds the Complex Incident Hub takes to interrogate the call. */
  cihSec: number;
  /** The hub chose another asset instead — no broadcast. */
  cihDeclined: boolean;
  /** Seconds from broadcast to the answer, or to the timeout. */
  answerSec: number;
  /** Who answered. null is the common case. */
  winner: BasicsResponder | null;
  /** Seconds to leave home or work and reach the car. */
  turnoutSec: number;
};

/** 20 miles. "We receive a text about any high acuity call within a 20
 *  mile radius of the handset." */
export const BASICS_ALERT_RADIUS_M = 32_187;

/** JUDGEMENT — per-responder answer probability by straight-line
 *  distance from their anchor. Responders roll independently, so with
 *  three on the roster a job in Altrincham or Stockport (two near, one
 *  far) gets a doctor a little under half the time by day; Wigan, inside
 *  20 miles of Warrington and Altrincham but near neither, about one
 *  request in seven; Rochdale, reached only from Stockport, one in
 *  twelve. The gradient is the point — the scheme's cover sits south and
 *  west of Manchester and thins to almost nothing across the M62. */
export const BASICS_ANSWER_P = { near: 0.2, far: 0.08 } as const;
export const BASICS_NEAR_M = 15_000;
/** JUDGEMENT — they are asleep. */
export const BASICS_NIGHT_MULT = 0.6;
/** JUDGEMENT — the hub picks the NWAA car instead, one time in ten. */
export const BASICS_CIH_DECLINE_P = 0.1;
/** JUDGEMENT — timings, seconds. Uniform ranges. */
export const BASICS_TIMING = {
  cih: [30, 90],
  answer: [30, 120],
  timeout: 240,
  turnout: [240, 600],
} as const;

function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const between = (rnd: () => number, [lo, hi]: readonly [number, number]) =>
  Math.round(lo + rnd() * (hi - lo));

/** Roll the whole request up front, so the timeline the operator then
 *  watches is fixed and honest rather than re-rolled every tick. */
export function rollBasicsResponse(
  scene: { lat: number; lng: number },
  responders: BasicsResponder[],
  hourOfDay: number,
  rnd: () => number = Math.random,
): BasicsRoll {
  const alerted = responders
    .map((r) => ({ r, d: haversineMeters(scene, r.anchor) }))
    .filter((x) => x.d <= BASICS_ALERT_RADIUS_M)
    .sort((a, b) => a.d - b.d);

  const cihSec = between(rnd, BASICS_TIMING.cih);
  const cihDeclined = alerted.length > 0 && rnd() < BASICS_CIH_DECLINE_P;
  const night = hourOfDay < 8;

  let winner: BasicsResponder | null = null;
  if (!cihDeclined) {
    for (const { r, d } of alerted) {
      const base = d <= BASICS_NEAR_M ? BASICS_ANSWER_P.near : BASICS_ANSWER_P.far;
      const p = base * (night ? BASICS_NIGHT_MULT : 1);
      if (rnd() < p) {
        winner = r;
        break; // nearest answerer takes it
      }
    }
  }

  return {
    alerted: alerted.map((x) => x.r),
    cihSec,
    cihDeclined,
    answerSec: winner ? between(rnd, BASICS_TIMING.answer) : BASICS_TIMING.timeout,
    winner,
    turnoutSec: between(rnd, BASICS_TIMING.turnout),
  };
}
