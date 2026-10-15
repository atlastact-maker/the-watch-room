// COVER MOVES. A unit sent to stand by somewhere other than its own
// station — the next station along when that one has emptied, or a
// standby point — stays available the whole way: mobile and available
// on the board, mobilised from wherever it is when a job comes in. The
// move is at normal road speed, not on blue lights; a recall drives it
// home the same way, and a job cancels either leg on the spot.

import { haversineMeters, interpolateAlongRoute } from "./eta";

export type Coords = { lat: number; lng: number };

export type StandbyMove = {
  applianceId: string;
  /** The station it belongs to, and where that is — a recall goes here. */
  fromStationId: string;
  home: Coords;
  /** Where this leg started: the station, or where it stood when re-sent. */
  from: Coords;
  to: { stationId: string | null; lat: number; lng: number; label: string };
  startedAt: number;
  arrivesAt: number;
  /** The road line out, once the router has handed it back. */
  routeCoords?: [number, number][];
  reason: string;
  /** Recalled home: when it turned, from where, and when it is back. */
  recalledAt?: number;
  recalledFrom?: Coords;
  homeArrivesAt?: number;
  returnRouteCoords?: [number, number][];
};

export type StandbyPhase = "moving" | "standing" | "returning" | "home";

/** Normal road speed across the county for a cover move: no blue lights. */
export const STANDBY_MPS = 11;

export function standbyTravelSec(from: Coords, to: Coords): number {
  return Math.max(60, (haversineMeters(from, to) * 1.3) / STANDBY_MPS);
}

export function standbyPhase(m: StandbyMove, now: number): StandbyPhase {
  if (m.recalledAt !== undefined) return m.homeArrivesAt !== undefined && now >= m.homeArrivesAt ? "home" : "returning";
  return now >= m.arrivesAt ? "standing" : "moving";
}

const clamp = (t: number) => Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0));

function along(route: [number, number][] | undefined, a: Coords, b: Coords, t: number): Coords {
  if (route && route.length >= 2) {
    const p = interpolateAlongRoute(route, t);
    return { lat: p[0], lng: p[1] };
  }
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

/** Where the unit is at this moment: on the road out, at the point, on
 *  the road home, or home. */
export function standbyPosition(m: StandbyMove, now: number): Coords {
  const phase = standbyPhase(m, now);
  const dest = { lat: m.to.lat, lng: m.to.lng };
  if (phase === "standing") return dest;
  if (phase === "moving") return along(m.routeCoords, m.from, dest, clamp((now - m.startedAt) / Math.max(1, m.arrivesAt - m.startedAt)));
  if (phase === "returning") {
    const t0 = m.recalledAt ?? now;
    const t1 = m.homeArrivesAt ?? now;
    return along(m.returnRouteCoords, m.recalledFrom ?? dest, m.home, clamp((now - t0) / Math.max(1, t1 - t0)));
  }
  return m.home;
}

/** The moves still under way or holding: everything but the ones home. */
export function activeStandby(moves: Record<string, StandbyMove>, now: number): StandbyMove[] {
  return Object.values(moves).filter((m) => standbyPhase(m, now) !== "home");
}

/** Seconds until the leg under way ends — arrival at the point, or home.
 *  Null while standing. */
export function standbyEtaSec(m: StandbyMove, now: number): number | null {
  const phase = standbyPhase(m, now);
  if (phase === "moving") return Math.max(0, (m.arrivesAt - now) / 1000);
  if (phase === "returning" && m.homeArrivesAt !== undefined) return Math.max(0, (m.homeArrivesAt - now) / 1000);
  return null;
}

/** For a resumed shift: every clock on the move slid forward together. */
export function shiftStandbyMove(m: StandbyMove, offset: number): StandbyMove {
  return {
    ...m,
    startedAt: m.startedAt + offset,
    arrivesAt: m.arrivesAt + offset,
    recalledAt: m.recalledAt === undefined ? undefined : m.recalledAt + offset,
    homeArrivesAt: m.homeArrivesAt === undefined ? undefined : m.homeArrivesAt + offset,
  };
}
