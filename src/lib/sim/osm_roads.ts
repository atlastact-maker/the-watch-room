// Client helper that fetches road polylines from OSM (via /api/osm-roads)
// and snaps a lat/lng to the nearest point on any of those polylines.
// Used by the ground-view parking workflow so vehicles land on the road
// rather than wherever the operator happened to click.

type LatLng = { lat: number; lng: number };
export type OsmRoadWay = {
  id: string;
  coords: [number, number][];
  highway?: string;
};

const cache = new Map<string, Promise<OsmRoadWay[]>>();

export function fetchOsmRoads(coords: LatLng, radiusM = 250): Promise<OsmRoadWay[]> {
  const key = `${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}@${radiusM}`;
  const existing = cache.get(key);
  if (existing) return existing;
  const p = doFetch(coords, radiusM);
  cache.set(key, p);
  p.then((r) => {
    if (r.length === 0) cache.delete(key); // allow retry if the first call failed
  });
  return p;
}

async function doFetch(coords: LatLng, radiusM: number): Promise<OsmRoadWay[]> {
  try {
    const res = await fetch(
      `/api/osm-roads?lat=${coords.lat}&lng=${coords.lng}&radius=${radiusM}`,
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { ways?: OsmRoadWay[] };
    return json.ways ?? [];
  } catch {
    return [];
  }
}

/**
 * Snap a click point to the closest point on any of the given road ways.
 * Returns the snapped `LatLng` plus the great-circle distance in metres
 * from the original point. If `maxSnapM` is set and no segment is within
 * that distance, returns `null` so callers can fall back to the original
 * click (e.g. the operator really meant to park on a verge).
 */
export function snapToNearestRoad(
  click: LatLng,
  ways: OsmRoadWay[],
  maxSnapM = 25,
): { lat: number; lng: number; distanceM: number } | null {
  let best: { lat: number; lng: number; distanceM: number } | null = null;
  for (const way of ways) {
    for (let i = 1; i < way.coords.length; i++) {
      const [aLat, aLng] = way.coords[i - 1];
      const [bLat, bLng] = way.coords[i];
      const snapped = closestPointOnSegment(
        click,
        { lat: aLat, lng: aLng },
        { lat: bLat, lng: bLng },
      );
      const d = haversineM(click, snapped);
      if (!best || d < best.distanceM) {
        best = { lat: snapped.lat, lng: snapped.lng, distanceM: d };
      }
    }
  }
  if (!best || best.distanceM > maxSnapM) return null;
  return best;
}

/** Like snapToNearestRoad, but also reports the road's bearing at the
 *  snapped segment (compass degrees, 0 = north). Used by road-closure
 *  placement so the cone line can render square across the carriageway. */
export function snapToNearestRoadWithBearing(
  click: LatLng,
  ways: OsmRoadWay[],
  maxSnapM = 25,
): { lat: number; lng: number; distanceM: number; bearingDeg: number } | null {
  let best:
    | { lat: number; lng: number; distanceM: number; bearingDeg: number }
    | null = null;
  for (const way of ways) {
    for (let i = 1; i < way.coords.length; i++) {
      const [aLat, aLng] = way.coords[i - 1];
      const [bLat, bLng] = way.coords[i];
      const snapped = closestPointOnSegment(
        click,
        { lat: aLat, lng: aLng },
        { lat: bLat, lng: bLng },
      );
      const d = haversineM(click, snapped);
      if (!best || d < best.distanceM) {
        const bearingDeg =
          ((Math.atan2(bLng - aLng, bLat - aLat) * 180) / Math.PI + 360) % 360;
        best = { lat: snapped.lat, lng: snapped.lng, distanceM: d, bearingDeg };
      }
    }
  }
  if (!best || best.distanceM > maxSnapM) return null;
  return best;
}

/** Project `p` onto segment `a`→`b`. Uses equirectangular approximation
 *  — negligible error over the metre-scale segments we care about. */
function closestPointOnSegment(p: LatLng, a: LatLng, b: LatLng): LatLng {
  // Convert to a local tangent-plane (metre-like) frame anchored at `a`.
  const lat0 = (a.lat * Math.PI) / 180;
  const mx = (ll: LatLng): [number, number] => [
    (ll.lng - a.lng) * 111320 * Math.cos(lat0),
    (ll.lat - a.lat) * 110540,
  ];
  const [px, py] = mx(p);
  const [bx, by] = mx(b);
  const len2 = bx * bx + by * by;
  if (len2 === 0) return a;
  const t = Math.max(0, Math.min(1, (px * bx + py * by) / len2));
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

function haversineM(a: LatLng, b: LatLng): number {
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

/**
 * The stretch of road either side of a point — for painting a road
 * closure along the actual carriageway geometry rather than tinting a
 * circle over it. Finds the nearest way, then walks its polyline both
 * directions from the snapped point, clipping the final segments so the
 * stretch is `spanM` metres each way (shorter where the way itself ends,
 * e.g. a cul-de-sac closed at its mouth).
 *
 * Returns null when no way is within `maxSnapM` — the caller keeps its
 * point-marker rendering and simply has no stretch to paint.
 */
export function roadStretchAround(
  point: LatLng,
  ways: OsmRoadWay[],
  spanM = 60,
  maxSnapM = 60,
): [number, number][] | null {
  let best: {
    way: OsmRoadWay;
    segIdx: number;
    snapped: LatLng;
    distanceM: number;
  } | null = null;
  for (const way of ways) {
    for (let i = 1; i < way.coords.length; i++) {
      const a = { lat: way.coords[i - 1][0], lng: way.coords[i - 1][1] };
      const b = { lat: way.coords[i][0], lng: way.coords[i][1] };
      const snapped = closestPointOnSegment(point, a, b);
      const d = haversineM(point, snapped);
      if (!best || d < best.distanceM) {
        best = { way, segIdx: i, snapped, distanceM: d };
      }
    }
  }
  if (!best || best.distanceM > maxSnapM) return null;

  const { way, segIdx, snapped } = best;
  const clip = (from: LatLng, to: LatLng, keepM: number): LatLng => {
    const segM = haversineM(from, to);
    if (segM <= keepM || segM === 0) return to;
    const t = keepM / segM;
    return {
      lat: from.lat + (to.lat - from.lat) * t,
      lng: from.lng + (to.lng - from.lng) * t,
    };
  };

  // Walk forward from the snapped point towards the way's end.
  const forward: LatLng[] = [];
  {
    let remaining = spanM;
    let prev = snapped;
    for (let i = segIdx; i < way.coords.length && remaining > 0; i++) {
      const next = { lat: way.coords[i][0], lng: way.coords[i][1] };
      const stepM = haversineM(prev, next);
      forward.push(clip(prev, next, remaining));
      remaining -= stepM;
      prev = next;
    }
  }
  // And backward towards its start.
  const backward: LatLng[] = [];
  {
    let remaining = spanM;
    let prev = snapped;
    for (let i = segIdx - 1; i >= 0 && remaining > 0; i--) {
      const next = { lat: way.coords[i][0], lng: way.coords[i][1] };
      const stepM = haversineM(prev, next);
      backward.push(clip(prev, next, remaining));
      remaining -= stepM;
      prev = next;
    }
  }

  const path: LatLng[] = [...backward.reverse(), snapped, ...forward];
  if (path.length < 2) return null;
  return path.map((p) => [p.lat, p.lng]);
}
