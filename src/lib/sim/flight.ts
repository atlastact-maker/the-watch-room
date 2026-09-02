// Aircraft flight geometry. Pure maths, no React, no Leaflet.
//
// Three things a helicopter does on a job that a straight line between
// two points cannot show:
//
//   1. Transit. A real flight is not a ruler line — it lifts on a
//      departure heading, settles onto track, and bends round on the way.
//      flightPath() draws a gently curved route between base and scene.
//
//   2. Orbit. Arriving with nowhere to land yet, the aircraft holds in a
//      circle over the scene while the crew look for a site. orbit*()
//      puts it on that circle as a function of time.
//
//   3. Approach. Once a landing zone is picked the pilot runs passes over
//      it to check wires, slope, surface and wind before committing — one
//      pass for an obvious field, more for a road or unverified ground.
//      pattern*() flies a racetrack over the LZ, one lap per pass.
//
// Everything works in local metres via the usual equirectangular
// approximation, which is well within a marker's width at these sizes.
// Positions come back as Leaflet [lat, lng] pairs.

import { haversineMeters } from "./eta";

/** A point on the ground. Structurally the same shape eta.ts takes. */
type Coords = { lat: number; lng: number };

export type LatLng = [number, number];

const M_PER_DEG_LAT = 111_320;
function mPerDegLng(lat: number): number {
  return M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
}

/** Move `metres` from `origin` on `bearingDeg` (0 = north, clockwise). */
export function offset(origin: Coords, bearingDeg: number, metres: number): LatLng {
  const b = (bearingDeg * Math.PI) / 180;
  const dNorth = Math.cos(b) * metres;
  const dEast = Math.sin(b) * metres;
  return [origin.lat + dNorth / M_PER_DEG_LAT, origin.lng + dEast / mPerDegLng(origin.lat)];
}

/** Initial bearing from a to b, degrees clockwise from north. */
export function bearingDeg(a: Coords, b: Coords): number {
  const dNorth = (b.lat - a.lat) * M_PER_DEG_LAT;
  const dEast = (b.lng - a.lng) * mPerDegLng(a.lat);
  return ((Math.atan2(dEast, dNorth) * 180) / Math.PI + 360) % 360;
}

/** Cheap, stable 0–1 from a string, for choices that must not change
 *  between renders or across a save. */
function unit(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}

export function pathLengthMeters(coords: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversineMeters(
      { lat: coords[i - 1][0], lng: coords[i - 1][1] },
      { lat: coords[i][0], lng: coords[i][1] },
    );
  }
  return total;
}

// ---------------------------------------------------------------------------
// 1. Transit
// ---------------------------------------------------------------------------

/** A curved flight line from base to target.
 *
 *  A quadratic curve whose control point sits off the direct line by
 *  8–12 % of the distance, to one side or the other — which side and how
 *  far come from the seed, so the same job always draws the same line.
 *  The first stretch is bent a little further, standing in for the
 *  departure turn out of the airfield. The bulge is capped so a long
 *  sortie does not look like it is routing round something that is not
 *  there. Adds one to two per cent to the distance, so the timing stays
 *  honest if the caller re-prices it from pathLengthMeters(). */
export function flightPath(base: Coords, target: Coords, seed: string): LatLng[] {
  const dist = haversineMeters(base, target);
  if (dist < 200) {
    return [
      [base.lat, base.lng],
      [target.lat, target.lng],
    ];
  }
  const track = bearingDeg(base, target);
  const side = unit(seed + ":side") < 0.5 ? -1 : 1;
  const bulge = Math.min(1200, (0.08 + 0.04 * unit(seed + ":bulge")) * dist);
  const mid: Coords = { lat: (base.lat + target.lat) / 2, lng: (base.lng + target.lng) / 2 };
  const control = offset(mid, track + side * 90, bulge);
  // Departure: leave the pad at a heading skewed further to the same side,
  // so the first leg visibly turns onto track rather than launching
  // straight down the line.
  const departure = offset(base, track + side * 35, Math.min(900, dist * 0.06));

  const pts: LatLng[] = [[base.lat, base.lng], departure];
  const c: LatLng = control;
  const p0: LatLng = departure;
  const p2: LatLng = [target.lat, target.lng];
  const n = 22;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push([
      u * u * p0[0] + 2 * u * t * c[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * c[1] + t * t * p2[1],
    ]);
  }
  return pts;
}

// ---------------------------------------------------------------------------
// 2. Orbit
// ---------------------------------------------------------------------------

/** Holding orbit: 350 m radius, one lap a minute, clockwise — a
 *  right-hand orbit keeps the scene on the pilot's side of an H145. */
export const ORBIT_RADIUS_M = 350;
export const ORBIT_PERIOD_SEC = 60;
/** Seconds to run out from the scene to the ring before turning onto
 *  it — 350 m at roughly the orbit's own speed. Without this the marker
 *  would arrive on the scene and reappear on the ring a tick later. */
export const ORBIT_JOIN_SEC = 10;

/** Where the aircraft joins the ring: straight ahead of it, so the
 *  run-out continues the track it arrived on. `arrivalBearingDeg` is the
 *  direction it was flying when it reached the scene. */
export function orbitEntry(centre: Coords, arrivalBearingDeg: number): LatLng {
  return offset(centre, arrivalBearingDeg, ORBIT_RADIUS_M);
}

export function orbitPosition(
  centre: Coords,
  elapsedSec: number,
  arrivalBearingDeg: number,
): LatLng {
  const entry = orbitEntry(centre, arrivalBearingDeg);
  if (elapsedSec < ORBIT_JOIN_SEC) {
    // Run-out: scene → entry point, straight ahead.
    const k = Math.max(0, elapsedSec / ORBIT_JOIN_SEC);
    return [centre.lat + (entry[0] - centre.lat) * k, centre.lng + (entry[1] - centre.lng) * k];
  }
  const angle = arrivalBearingDeg + (360 * (elapsedSec - ORBIT_JOIN_SEC)) / ORBIT_PERIOD_SEC;
  return offset(centre, angle, ORBIT_RADIUS_M);
}

/** The ring, starting at the entry angle so a trail drawn through it
 *  flows from the run-out onto the circle instead of leaping to north. */
export function orbitRing(centre: Coords, arrivalBearingDeg = 0, n = 36): LatLng[] {
  const ring: LatLng[] = [];
  for (let i = 0; i <= n; i++) {
    ring.push(offset(centre, arrivalBearingDeg + (360 * i) / n, ORBIT_RADIUS_M));
  }
  return ring;
}

// ---------------------------------------------------------------------------
// 3. Approach passes
// ---------------------------------------------------------------------------

export type LzKind = "field" | "carriageway" | "open" | "unknown";

/** How many passes the pilot flies before committing. A clear field is
 *  read in one; open ground gets a second look; a road — wires, lamp
 *  posts, the closure holding — or ground the survey could not classify
 *  gets three. */
export function passesForLz(kind: LzKind): 1 | 2 | 3 {
  switch (kind) {
    case "field":
      return 1;
    case "open":
      return 2;
    default:
      return 3;
  }
}

/** Seconds per pass: a racetrack circuit at approach speed. */
export const PASS_SEC = 35;

// The racetrack: a stadium 420 m long by 220 m wide, its long axis on the
// run-in bearing. The LZ sits on the run-in SIDE of the loop, not at an
// end: the aircraft crosses it flying along the run-in, towards the
// scene — which is what a pass is for. A loop with the LZ at its end
// would cross it side-on.
const PATTERN_HALF_LEN_M = 210;
const PATTERN_HALF_WID_M = 110;

/** Point on the racetrack at `elapsedSec` since the pattern began. The
 *  lap starts 210 m short of the LZ and 110 m to one side, is directly
 *  over the LZ at the quarter mark heading along the run-in, and returns
 *  to its start at the end — which is where the final approach then
 *  begins, converging onto the run-in. */
export function patternPosition(lz: Coords, runInBearingDeg: number, elapsedSec: number): LatLng {
  // A quarter-lap head start puts the LZ overflight at the quarter mark
  // rather than at the very first tick.
  const phase = ((elapsedSec % PASS_SEC) / PASS_SEC) * 2 * Math.PI - Math.PI / 2;
  // Ellipse in pattern-local axes: x along the run-in, y across it,
  // centred at (0, -halfWid) so (0, 0) — the LZ — lies on the run-in side
  // and the tangent there points along the run-in.
  const x = PATTERN_HALF_LEN_M * Math.sin(phase);
  const y = PATTERN_HALF_WID_M * (Math.cos(phase) - 1);
  const along = offset(lz, runInBearingDeg, x);
  return offset({ lat: along[0], lng: along[1] }, runInBearingDeg + 90, y);
}

/** Approach speed used to price the join leg from wherever the aircraft
 *  is when the LZ is confirmed to the start of the pattern. */
const JOIN_SPEED_MPS = 30;

/** Seconds for the join leg from `from` to the pattern's start point —
 *  never so short it reads as a jump, never so long it drags. */
export function joinSecFor(from: LatLng, lz: Coords, runInBearingDeg: number): number {
  const start = patternStart(lz, runInBearingDeg);
  const dist = haversineMeters({ lat: from[0], lng: from[1] }, { lat: start[0], lng: start[1] });
  return Math.min(30, Math.max(4, Math.ceil(dist / JOIN_SPEED_MPS)));
}

export function patternRing(lz: Coords, runInBearingDeg: number, n = 40): LatLng[] {
  const ring: LatLng[] = [];
  for (let i = 0; i <= n; i++) {
    ring.push(patternPosition(lz, runInBearingDeg, (PASS_SEC * i) / n));
  }
  return ring;
}

/** Where the final approach begins: the pattern's start point, which is
 *  also where every lap ends. */
export function patternStart(lz: Coords, runInBearingDeg: number): LatLng {
  return patternPosition(lz, runInBearingDeg, 0);
}
