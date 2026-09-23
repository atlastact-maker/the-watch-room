// Rescue from height, worked out once and read many times — the same
// shape as water_rescue.ts. The rope team walk in from wherever the
// vehicle could get to, rig at the top of the face, lower a rescuer to
// the casualty, package them, and haul them up (or lower them to the
// floor when that is the easier way out). The plan is made when the task
// starts and stored on it, so the sim, the map and the log read one
// timeline.
//
// Scene coordinates throughout: metres, x east, y south.

import type { RopeModel, Scene, SceneCasualty, ScenePoint } from "./scene";

export type RopeRescueTimeline = {
  /** The path the team walk, from the vehicle to the top of the face. */
  approach: ScenePoint[];
  /** Walk time, from the real approach distance rather than the drawn one. */
  approachMs: number;
  top: ScenePoint;
  casualtyPos: ScenePoint;
  /** Team at the edge. */
  atTopAt: number;
  /** Anchors, edge protection, main and belay lines in. */
  riggedAt: number;
  /** Rescuer on the ledge with the casualty. */
  atCasualtyAt: number;
  /** Casualty in the stretcher / harness. */
  packagedAt: number;
  /** Casualty at the recovery point. */
  recoveredAt: number;
  recoveryPos: ScenePoint;
  recovery: "raise" | "lower";
};

const APPROACH_MPS = 1.0;   // walking with rope kit, uphill, wet
const LOWER_MPS = 0.3;

const dist = (a: ScenePoint, b: ScenePoint) => Math.hypot(a.x - b.x, a.y - b.y);

function pathLength(pts: ScenePoint[]): number {
  let m = 0;
  for (let i = 1; i < pts.length; i++) m += dist(pts[i - 1], pts[i]);
  return m;
}

export function planRopeRescue(
  scene: Scene,
  casualty: SceneCasualty,
  startedAt: number,
  crewStart: ScenePoint,
): RopeRescueTimeline | null {
  const r: RopeModel | undefined = scene.rope;
  if (!r) return null;
  const authored = r.approach && r.approach.length ? r.approach : [r.top];
  // Start from the vehicle; join the authored path at its first point.
  const approach = dist(crewStart, authored[0]) > 1 ? [crewStart, ...authored] : authored;
  if (dist(approach[approach.length - 1], r.top) > 1) approach.push(r.top);
  const drawnM = pathLength(approach);
  const approachM = Math.max(drawnM, r.approachM ?? drawnM);
  const approachMs = Math.max(5000, (approachM / APPROACH_MPS) * 1000);
  const atTopAt = startedAt + approachMs;
  const riggedAt = atTopAt + (r.rigSec ?? 480) * 1000;
  const atCasualtyAt = riggedAt + (r.dropM / LOWER_MPS) * 1000;
  const packagedAt = atCasualtyAt + (r.packageSec ?? 360) * 1000;
  const recovery = r.recovery ?? "raise";
  const haulSec = r.haulSec ?? (recovery === "raise" ? 300 : 120);
  const recoveredAt = packagedAt + haulSec * 1000;
  const recoveryPos = recovery === "lower" && r.floor ? r.floor : r.top;
  return { approach, approachMs, top: r.top, casualtyPos: casualty.pos, atTopAt, riggedAt, atCasualtyAt, packagedAt, recoveredAt, recoveryPos, recovery };
}

/** Where the casualty is at `at`: on the ledge, on the way up, or at the top. */
export function casualtyRopePosition(c: SceneCasualty, tl: RopeRescueTimeline | undefined, at: number): ScenePoint {
  if (!tl || at < tl.packagedAt) return c.pos;
  if (at >= tl.recoveredAt) return tl.recoveryPos;
  const k = (at - tl.packagedAt) / Math.max(1, tl.recoveredAt - tl.packagedAt);
  return { x: c.pos.x + (tl.recoveryPos.x - c.pos.x) * k, y: c.pos.y + (tl.recoveryPos.y - c.pos.y) * k };
}

/** Where the lowered rescuer is at `at`, or null while they are with the
 *  team at the top. */
export function rescuerPosition(tl: RopeRescueTimeline, at: number): ScenePoint | null {
  if (at < tl.riggedAt) return null;
  if (at < tl.atCasualtyAt) {
    const k = (at - tl.riggedAt) / Math.max(1, tl.atCasualtyAt - tl.riggedAt);
    return { x: tl.top.x + (tl.casualtyPos.x - tl.top.x) * k, y: tl.top.y + (tl.casualtyPos.y - tl.top.y) * k };
  }
  if (at < tl.packagedAt) return tl.casualtyPos;
  if (at < tl.recoveredAt) {
    const k = (at - tl.packagedAt) / Math.max(1, tl.recoveredAt - tl.packagedAt);
    return { x: tl.casualtyPos.x + (tl.recoveryPos.x - tl.casualtyPos.x) * k, y: tl.casualtyPos.y + (tl.recoveryPos.y - tl.casualtyPos.y) * k };
  }
  return null;
}

/** True once a rescuer is with the casualty. */
export function reachedBy(tl: RopeRescueTimeline | undefined, at: number): boolean {
  return !!tl && at >= tl.atCasualtyAt;
}

/** True once the casualty is at the recovery point. */
export function recoveredBy(tl: RopeRescueTimeline | undefined, at: number): boolean {
  return !!tl && at >= tl.recoveredAt;
}
