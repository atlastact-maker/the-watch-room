// THE SCENE ON THE MAP. A scene's geometry — its lanes, where the
// casualties lie, the cone taper — is authored in metres on a frame of
// its own: x along the road, y across it, the call at the origin. On the
// desk's real map that frame has to sit on the real road. Where the map
// holds the carriageway's own geometry, the frame is turned to the
// carriageway's bearing and shifted so the scene's running lanes lie
// along it; where it does not, the frame lies east–west on the call's
// coordinates, as the plain conversion always had it.

import type { OsmRoadWay } from "./osm_roads";
import { metresToLatLng } from "./scene";

type LatLng = { lat: number; lng: number };

export type SceneFrame = {
  /** The scene's origin on the map. */
  origin: LatLng;
  /** The compass bearing (0 north, 90 east) the scene's +x runs along. */
  bearingDeg: number;
  /** From the road's geometry, or the plain east–west fallback. */
  snapped: boolean;
};

/** The frame a scene has without the road: east–west on the call. */
export function plainFrame(origin: LatLng): SceneFrame {
  return { origin, bearingDeg: 90, snapped: false };
}

/** A scene point on the map through a frame: x along the bearing, y to
 *  the right of it — which on an east–west frame is the plain east and
 *  south the scene's metres always meant. */
export function framePoint(frame: SceneFrame, p: { x: number; y: number }): LatLng {
  const th = (frame.bearingDeg * Math.PI) / 180;
  const east = p.x * Math.sin(th) + p.y * Math.cos(th);
  const north = p.x * Math.cos(th) - p.y * Math.sin(th);
  return metresToLatLng(frame.origin, { x: east, y: -north });
}

/** The frame a carriageway's geometry gives a scene: the nearest way to
 *  the call that runs the scene's way (`flow` +1 is +x, so the ways
 *  running against it — the other carriageway — and the slip roads
 *  crossing it are passed over), its bearing where the call projects onto
 *  it, and the origin placed so the scene's running lanes, centred
 *  `centreY` across the frame, lie along the way. Null when no such way
 *  is within `maxSnapM`. */
export function carriagewayFrame(
  call: LatLng,
  ways: readonly OsmRoadWay[],
  flow: 1 | -1,
  centreY: number,
  maxSnapM = 80,
): SceneFrame | null {
  const want = flow > 0 ? 90 : 270;
  const lat0 = (call.lat * Math.PI) / 180;
  const mPerDegLng = 111320 * Math.cos(lat0);
  const mx = (ll: LatLng): [number, number] => [(ll.lng - call.lng) * mPerDegLng, (ll.lat - call.lat) * 110540];
  let best: { p: LatLng; bearingDeg: number; d: number } | null = null;
  for (const w of ways) {
    for (let i = 1; i < w.coords.length; i++) {
      const [ax, ay] = mx({ lat: w.coords[i - 1][0], lng: w.coords[i - 1][1] });
      const [bx, by] = mx({ lat: w.coords[i][0], lng: w.coords[i][1] });
      const dx = bx - ax, dy = by - ay;
      const len2 = dx * dx + dy * dy;
      if (len2 === 0) continue;
      const bearingDeg = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
      const off = Math.abs(((bearingDeg - want + 540) % 360) - 180);
      if (off > 75) continue;
      const t = Math.max(0, Math.min(1, (-ax * dx - ay * dy) / len2));
      const px = ax + dx * t, py = ay + dy * t;
      const d = Math.hypot(px, py);
      if (!best || d < best.d) best = { p: { lat: call.lat + py / 110540, lng: call.lng + px / mPerDegLng }, bearingDeg, d };
    }
  }
  if (!best || best.d > maxSnapM) return null;
  // The origin sits back from the way's point by the lanes' centre, across the road.
  const th = (best.bearingDeg * Math.PI) / 180;
  const origin = metresToLatLng(best.p, { x: -centreY * Math.cos(th), y: -centreY * Math.sin(th) });
  return { origin, bearingDeg: best.bearingDeg, snapped: true };
}
