// Roads policing patrols.
//
// An XT or ME unit is not sitting at a base waiting to be sent. It is out
// on its patch, and where it happens to be when a job comes in is what
// decides how fast it gets there. So each roads cover drives a circuit of
// its own ground, continuously, and the desk sees it move.
//
// STICKING TO THE ROAD. The circuits below are lists of WAYPOINTS, not
// lines. The line a unit actually travels is whatever the router hands
// back between consecutive waypoints — real road geometry, hundreds of
// points, every bend of the M60 included. The unit is then placed along
// that polyline BY DISTANCE: at 22 m/s it is 22 metres further round the
// line each second, wherever on the line that falls. It cannot cut a
// corner, drift across a field, or slide between two junctions in a
// straight line, because it is never positioned by anything except
// "how far along this road am I".
//
// That also means imprecise waypoints are harmless. A waypoint a few
// hundred metres off the junction changes WHICH roads the router picks;
// it can never put the car off a road, because the car only ever exists
// at a point on a returned route.
//
// THE QUADRANTS ARE A GUESS. The owner gave us ME areas 1 north, 2 east,
// 4 west and 5 south, and XT areas 1, 5 and 7 — but not which stretch of
// motorway belongs to which quadrant. The waypoints below are chosen so
// the fastest route between them runs round the part of the network the
// quadrant is named for: the north circuit is anchored either side of the
// M60's northern arc, so a router asked to join them sends the car along
// it. That is geography, not GMP's definition. Flagged in gaps.md and
// one edit each to correct.
//
// Anchors are real coordinates lifted from the project's own station
// files, not recalled — see data/research/fire/gmfrs_stations.json.

export type Coords = { lat: number; lng: number };

/** A circuit: the ground a cover works, as points to be joined by road. */
export type PatrolCircuit = {
  /** The cover this belongs to, e.g. "XT1" or "ME4". */
  id: string;
  label: string;
  /** Joined in order, then the last back to the first — patrols loop. */
  waypoints: Coords[];
  /** Cruising speed while patrolling, metres per second. Motorway units
   *  make better progress than a unit working town centres. */
  speedMps: number;
};

const at = (lat: number, lng: number): Coords => ({ lat, lng });

export const PATROL_CIRCUITS: Record<string, PatrolCircuit> = {
  // ---- Road patrol ------------------------------------------------------
  XT1: {
    id: "XT1",
    label: "Bolton, Bury and Wigan",
    waypoints: [at(53.575392, -2.435002), at(53.598177, -2.300484), at(53.540983, -2.650829), at(53.479861, -2.538989)],
    speedMps: 15, // ~34 mph average on A-roads and town centres
  },
  XT5: {
    id: "XT5",
    label: "Salford and Trafford",
    waypoints: [at(53.480591, -2.270887), at(53.482128, -2.356578), at(53.394294, -2.352671), at(53.455013, -2.317078)],
    speedMps: 14,
  },
  XT7: {
    id: "XT7",
    label: "the south district",
    waypoints: [at(53.487102, -2.230614), at(53.424461, -2.165853), at(53.47781, -2.11851), at(53.542125, -2.095465), at(53.624104, -2.143277)],
    speedMps: 15,
  },

  // ---- Motorway ---------------------------------------------------------
  // Anchored so the quickest way between consecutive points is the arc of
  // the network the quadrant is named for.
  ME1: {
    id: "ME1",
    label: "north force motorway network",
    // Whitefield and Bury sit on the M60/M66 north; Rochdale pulls the
    // route out along the M62 north-east.
    waypoints: [at(53.555549, -2.295789), at(53.598177, -2.300484), at(53.624104, -2.143277), at(53.542125, -2.095465)],
    speedMps: 27, // ~60 mph
  },
  ME2: {
    id: "ME2",
    label: "east force motorway network",
    // Oldham round to Hyde by way of Ashton — the M60 east arc and M67.
    waypoints: [at(53.542125, -2.095465), at(53.47781, -2.11851), at(53.448861, -2.08306), at(53.424461, -2.165853)],
    speedMps: 27,
  },
  ME4: {
    id: "ME4",
    label: "west force motorway network",
    // Eccles interchange out to Irlam and up towards Bolton — M60 west,
    // M62 west and the M61.
    waypoints: [at(53.482128, -2.356578), at(53.440321, -2.420253), at(53.479861, -2.538989), at(53.575392, -2.435002)],
    speedMps: 27,
  },
  ME5: {
    id: "ME5",
    label: "south force motorway network",
    // Stockport round the southern arc to the airport and Altrincham.
    waypoints: [at(53.424461, -2.165853), at(53.381559, -2.256729), at(53.394294, -2.352671), at(53.455013, -2.317078)],
    speedMps: 27,
  },
};

/** The circuit a roads callsign works, from its prefix and area digit. */
export function circuitForCallsign(callsign: string): PatrolCircuit | null {
  const m = /^(XT|ME)(\d)/.exec(callsign.toUpperCase());
  return m ? (PATROL_CIRCUITS[`${m[1]}${m[2]}`] ?? null) : null;
}

// ---------------------------------------------------------------------------
// Geometry. Everything below works on the polyline the router returned, so
// a unit is only ever at a point that lies on a real road.
// ---------------------------------------------------------------------------

const R = 6_371_000;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Great-circle metres between two points. */
export function metresBetween(a: Coords, b: Coords): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Cumulative distances along a polyline, and its total length. */
export function measure(line: Coords[]): { cum: number[]; total: number } {
  const cum = [0];
  for (let i = 1; i < line.length; i++) cum.push(cum[i - 1] + metresBetween(line[i - 1], line[i]));
  return { cum, total: cum[cum.length - 1] ?? 0 };
}

/** The point exactly `metres` along the polyline, and the heading there.
 *
 *  Interpolation is BETWEEN TWO ADJACENT ROUTE POINTS ONLY, so the result
 *  lies on the segment the router drew. With a road polyline that is a
 *  point on the road, always. */
export function pointAlong(
  line: Coords[],
  metres: number,
  measured?: { cum: number[]; total: number },
): { coords: Coords; bearing: number } {
  if (line.length === 0) return { coords: at(0, 0), bearing: 0 };
  if (line.length === 1) return { coords: line[0], bearing: 0 };
  const { cum, total } = measured ?? measure(line);
  if (total === 0) return { coords: line[0], bearing: 0 };

  // Loop: a patrol that reaches the end starts round again.
  let d = metres % total;
  if (d < 0) d += total;

  // Which segment is `d` in? Binary search the cumulative table.
  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= d) lo = mid;
    else hi = mid;
  }
  const segLen = cum[lo + 1] - cum[lo];
  const t = segLen > 0 ? (d - cum[lo]) / segLen : 0;
  const a = line[lo];
  const b = line[lo + 1];
  return {
    coords: at(a.lat + (b.lat - a.lat) * t, a.lng + (b.lng - a.lng) * t),
    bearing: bearing(a, b),
  };
}

/** Compass bearing from a to b, degrees. */
export function bearing(a: Coords, b: Coords): number {
  const dLng = rad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(rad(b.lat));
  const x =
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(dLng);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/** Where a patrol is now.
 *
 *  `offset` staggers units that share a circuit so they are not nose to
 *  tail, and is stable per callsign rather than random. */
export function patrolPosition(
  line: Coords[],
  circuit: PatrolCircuit,
  elapsedSec: number,
  offsetMetres = 0,
  measured?: { cum: number[]; total: number },
): { coords: Coords; bearing: number } {
  return pointAlong(line, offsetMetres + elapsedSec * circuit.speedMps, measured);
}

/** A stable 0–1 from a callsign, so a unit starts its circuit at the same
 *  place every time rather than jumping on a re-render. */
export function offsetFor(callsign: string, total: number): number {
  let h = 2166136261;
  for (let i = 0; i < callsign.length; i++) {
    h ^= callsign.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10_000) / 10_000 * total;
}
