// Water rescue, worked out once and read many times.
//
// A person in moving water drifts: their position is a function of the
// time since the call. A rescue is a chain of moments — the crew reach
// the water's edge, launch the boat (or throw a line if the casualty is
// close enough), reach the casualty where the drift has taken them, get
// them aboard, and bring them to the bank. All of it follows from the
// scene's water model, the casualty's start, when the task began and
// where the crew's vehicle is parked, so the plan is computed when the
// task starts and stored on it. The sim, the ground map and the log then
// read the same timeline: nobody has to agree on anything at runtime.
//
// Scene coordinates throughout: metres, x east, y south.

import type { Scene, SceneCasualty, ScenePoint, SceneRect, WaterModel } from "./scene";

export type WaterRescueTimeline = {
  mode: "boat" | "bank";
  /** Where the crew reached the water. */
  edge: ScenePoint;
  atEdgeAt: number;
  /** Boat in the water (bank mode: the line goes out). */
  launchAt: number;
  /** Casualty reached — absent when the weir took them first. */
  interceptAt?: number;
  interceptPos?: ScenePoint;
  /** Aboard / on the line. */
  recoveredAt?: number;
  /** On the bank. */
  landAt?: number;
  landPos?: ScenePoint;
  lost?: boolean;
  lostAt?: number;
};

const WALK_MPS = 1.3;
const RECOVER_SEC = 40;      // getting a cold, heavy casualty over the gunwale
const THROWLINE_SEC = 40;    // first throw, caught, held
const HAUL_SEC = 40;         // hand over hand to the edge and out
const MAX_CHASE_SEC = 30 * 60;

export function waterOf(scene: Scene | undefined): SceneRect | null {
  return scene?.roads.find((r) => r.kind === "water")?.shape ?? null;
}

/** Drift per second as a scene vector for a compass bearing. */
function driftVector(w: WaterModel): ScenePoint {
  const rad = (w.driftBearingDeg * Math.PI) / 180;
  return { x: Math.sin(rad) * w.driftMps, y: -Math.cos(rad) * w.driftMps };
}

/** When the drift reaches the weir, if there is one. */
export function weirReachedAt(w: WaterModel, receivedAt: number): number | null {
  if (!w.weirDistanceM || w.driftMps <= 0) return null;
  return receivedAt + (w.weirDistanceM / w.driftMps) * 1000;
}

/** Where a drifting casualty is at `at`, with nobody having reached them. */
export function driftPosition(c: SceneCasualty, w: WaterModel, receivedAt: number, at: number): ScenePoint {
  const v = driftVector(w);
  let secs = Math.max(0, (at - receivedAt) / 1000);
  if (w.weirDistanceM && w.driftMps > 0) secs = Math.min(secs, w.weirDistanceM / w.driftMps);
  return { x: c.pos.x + v.x * secs, y: c.pos.y + v.y * secs };
}

const dist = (a: ScenePoint, b: ScenePoint) => Math.hypot(a.x - b.x, a.y - b.y);

type Bank = "north" | "south" | "west" | "east";

/** Nearest point on the water's edge to `p`, and which bank it is on. */
export function nearestEdge(water: SceneRect, p: ScenePoint): { point: ScenePoint; bank: Bank } {
  const x1 = water.x, x2 = water.x + water.w, y1 = water.y, y2 = water.y + water.h;
  const cx = Math.min(Math.max(p.x, x1), x2);
  const cy = Math.min(Math.max(p.y, y1), y2);
  const candidates: { point: ScenePoint; bank: Bank }[] = [
    { point: { x: cx, y: y1 }, bank: "north" },
    { point: { x: cx, y: y2 }, bank: "south" },
    { point: { x: x1, y: cy }, bank: "west" },
    { point: { x: x2, y: cy }, bank: "east" },
  ];
  candidates.sort((a, b) => dist(a.point, p) - dist(b.point, p));
  return candidates[0];
}

/** The point on a given bank closest to `p`. */
function pointOnBank(water: SceneRect, bank: Bank, p: ScenePoint): ScenePoint {
  const x1 = water.x, x2 = water.x + water.w, y1 = water.y, y2 = water.y + water.h;
  const cx = Math.min(Math.max(p.x, x1), x2);
  const cy = Math.min(Math.max(p.y, y1), y2);
  switch (bank) {
    case "north": return { x: cx, y: y1 };
    case "south": return { x: cx, y: y2 };
    case "west": return { x: x1, y: cy };
    default: return { x: x2, y: cy };
  }
}

/** Plan the rescue from the moment the task starts. `crewStart` is where
 *  the crew step off (their vehicle, in scene metres). */
export function planWaterRescue(
  scene: Scene,
  casualty: SceneCasualty,
  receivedAt: number,
  startedAt: number,
  crewStart: ScenePoint,
): WaterRescueTimeline | null {
  const authored = waterOf(scene);
  const w = scene.water;
  if (!authored || !w) return null;
  // The scene draws a stretch of the river; the river carries on. Extend
  // the water along the drift so the banks exist wherever the casualty
  // has got to.
  const v = driftVector(w);
  const extend = (w.weirDistanceM ?? 400) + 50;
  const water: SceneRect = Math.abs(v.x) >= Math.abs(v.y)
    ? { x: v.x < 0 ? authored.x - extend : authored.x, y: authored.y, w: authored.w + extend, h: authored.h }
    : { x: authored.x, y: v.y < 0 ? authored.y - extend : authored.y, w: authored.w, h: authored.h + extend };
  const launchSec = w.launchSec ?? 90;
  const boatMps = w.boatMps ?? 3;
  const bankRange = w.bankRescueRangeM ?? 15;
  const lostAt = weirReachedAt(w, receivedAt);

  const lostBefore = (t: number) => lostAt !== null && t >= lostAt;
  const { bank, point: nearest } = nearestEdge(water, crewStart);
  const casNow = driftPosition(casualty, w, receivedAt, startedAt);
  const reach = dist(pointOnBank(water, bank, casNow), casNow);

  if (reach <= bankRange) {
    // Throwline from the bank: no boat. The crew walk the bank to where
    // the casualty is (they outpace the drift) and throw from there.
    const edge = pointOnBank(water, bank, casNow);
    const atEdgeAt = startedAt + Math.max(3, dist(crewStart, edge) / WALK_MPS) * 1000;
    const interceptAt = atEdgeAt + THROWLINE_SEC * 1000;
    if (lostBefore(interceptAt)) return { mode: "bank", edge, atEdgeAt, launchAt: atEdgeAt, lost: true, lostAt: lostAt! };
    const interceptPos = driftPosition(casualty, w, receivedAt, interceptAt);
    const landPos = pointOnBank(water, bank, interceptPos);
    const landAt = interceptAt + HAUL_SEC * 1000;
    return { mode: "bank", edge, atEdgeAt, launchAt: atEdgeAt, interceptAt, interceptPos, recoveredAt: interceptAt, landAt, landPos };
  }

  // Boat: launch at the nearest water to the vehicle and chase the
  // drift downstream — the boat is far quicker than the river.
  const edge = nearest;
  const atEdgeAt = startedAt + Math.max(3, dist(crewStart, edge) / WALK_MPS) * 1000;
  const launchAt = atEdgeAt + launchSec * 1000;
  // Chase the drift: one-second steps, the boat always pointing at the
  // casualty's current position.
  let boat = { ...edge };
  let t = launchAt;
  let interceptAt: number | undefined;
  for (let s = 0; s < MAX_CHASE_SEC; s++) {
    if (lostBefore(t)) break;
    const cas = driftPosition(casualty, w, receivedAt, t);
    const d = dist(boat, cas);
    if (d <= 2) { interceptAt = t; break; }
    const step = Math.min(boatMps, d);
    boat = { x: boat.x + ((cas.x - boat.x) / d) * step, y: boat.y + ((cas.y - boat.y) / d) * step };
    t += 1000;
  }
  if (interceptAt === undefined) return { mode: "boat", edge, atEdgeAt, launchAt, lost: true, lostAt: lostAt ?? t };
  const interceptPos = driftPosition(casualty, w, receivedAt, interceptAt);
  const recoveredAt = interceptAt + RECOVER_SEC * 1000;
  const landPos = pointOnBank(water, bank, interceptPos);
  const landAt = recoveredAt + (dist(interceptPos, landPos) / boatMps) * 1000 + 15_000;
  return { mode: "boat", edge, atEdgeAt, launchAt, interceptAt, interceptPos, recoveredAt, landAt, landPos };
}

/** Where the casualty is at `at`: drifting, in the boat, or on the bank. */
export function casualtyWaterPosition(
  c: SceneCasualty,
  w: WaterModel,
  receivedAt: number,
  tl: WaterRescueTimeline | undefined,
  at: number,
): ScenePoint {
  if (tl?.interceptAt !== undefined && tl.interceptPos && at >= tl.interceptAt) {
    if (tl.landAt === undefined || tl.landPos === undefined) return tl.interceptPos;
    if (at >= tl.landAt) return tl.landPos;
    const from = tl.recoveredAt ?? tl.interceptAt;
    if (at < from) return tl.interceptPos;
    const k = (at - from) / Math.max(1, tl.landAt - from);
    return { x: tl.interceptPos.x + (tl.landPos.x - tl.interceptPos.x) * k, y: tl.interceptPos.y + (tl.landPos.y - tl.interceptPos.y) * k };
  }
  return driftPosition(c, w, receivedAt, at);
}

/** Where the boat is at `at`, or null before launch. It stays on the
 *  bank after landing. */
export function boatPosition(tl: WaterRescueTimeline, at: number): ScenePoint | null {
  if (tl.mode !== "boat" || at < tl.launchAt) return null;
  if (tl.lost || tl.interceptAt === undefined || !tl.interceptPos) {
    // Searched and found nothing: hold mid-water a while, then back.
    const holdUntil = tl.launchAt + 10 * 60_000;
    return at < holdUntil ? { x: tl.edge.x, y: tl.edge.y } : null;
  }
  if (at < tl.interceptAt) {
    const k = (at - tl.launchAt) / Math.max(1, tl.interceptAt - tl.launchAt);
    return { x: tl.edge.x + (tl.interceptPos.x - tl.edge.x) * k, y: tl.edge.y + (tl.interceptPos.y - tl.edge.y) * k };
  }
  const from = tl.recoveredAt ?? tl.interceptAt;
  if (at < from || tl.landAt === undefined || !tl.landPos) return tl.interceptPos;
  if (at >= tl.landAt) return tl.landPos;
  const k = (at - from) / Math.max(1, tl.landAt - from);
  return { x: tl.interceptPos.x + (tl.landPos.x - tl.interceptPos.x) * k, y: tl.interceptPos.y + (tl.landPos.y - tl.interceptPos.y) * k };
}

/** True once the casualty is out of the water. */
export function landedBy(tl: WaterRescueTimeline | undefined, at: number): boolean {
  return !!tl && tl.landAt !== undefined && at >= tl.landAt && !tl.lost;
}
