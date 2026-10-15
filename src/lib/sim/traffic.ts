// THE LIVE CARRIAGEWAY. What is running past the working area and what
// the crews have done about it, read from the tasks on the job: an
// appliance fended off across the live lanes, lanes coned off at the
// scene, a rolling road block holding the traffic from the junction
// behind a roads policing car, the carriageway shut at that junction
// with a diversion — and National Highways, asked by control, setting
// the signals upstream and sending traffic officers to hold the junction.
// Nothing is protected until the lanes that must be shut have stopped
// running; until then every minute carries the chance of a near miss.

import type { Task, TaskKind } from "./incident_types";
import type { SceneCarriageway } from "./scene";

export type TrafficLevel = "live" | "fend_off" | "lanes_closed" | "held" | "closed";

export type HighwaysStage = "none" | "requested" | "signals" | "on_scene";

export type TrafficState = {
  cw: SceneCarriageway;
  /** Lanes still running past the scene, nearside first. */
  live: number[];
  /** Lanes shut at the scene by cones, over and above the wreck's own. */
  closed: number[];
  blocked: number[];
  fendOff: boolean;
  /** A rolling block holds the carriageway from the upstream junction. */
  held: boolean;
  /** Shut at the upstream junction, by the police or by the traffic officers. */
  closedAtJunction: boolean;
  highways: HighwaysStage;
  /** When the traffic officers are due, once asked. */
  highwaysDueAt: number | null;
  level: TrafficLevel;
  /** Nobody is working beside a running lane. */
  protected: boolean;
  /** When protection came into force. */
  protectedSince: number | null;
  /** Being set up now: a block driving in, cones going out. */
  settingUp: { kind: TaskKind; completesAt: number | null; applianceId: string }[];
  headline: string;
  detail: string;
};

/** The task kinds that change what runs past the scene. */
export const TRAFFIC_KINDS: readonly TaskKind[] = ["fend_off", "lane_closure", "rolling_road_block", "carriageway_closure"];

/** Minutes after control asks before the ROC has the signals set upstream. */
export const HIGHWAYS_SIGNALS_MIN = 2;
/** Minutes for the traffic officers to reach the scene when the scenario says nothing. */
export const HIGHWAYS_ETA_MIN = 15;
/** Minutes after they land before the carriageway is shut and signed at the junction. */
export const HIGHWAYS_CLOSURE_MIN = 5;
/** The scenario's target: the road protected within this of the first arrival. */
export const PROTECTION_TARGET_MIN = 20;

const inForce = (t: Task) => t.state === "completed";

/** "lane 1", "lanes 1 and 2", "lanes 1–3". */
export function laneLabel(lanes: number[]): string {
  const l = [...lanes].sort((a, b) => a - b);
  if (l.length === 0) return "no lanes";
  if (l.length === 1) return `lane ${l[0]}`;
  const contiguous = l.every((v, i) => i === 0 || v === l[i - 1] + 1);
  if (l.length === 2) return `lanes ${l[0]} and ${l[1]}`;
  return contiguous ? `lanes ${l[0]}–${l[l.length - 1]}` : `lanes ${l.slice(0, -1).join(", ")} and ${l[l.length - 1]}`;
}

export function trafficState(cw: SceneCarriageway, tasks: Task[], now: number, highwaysRequestedAt?: number | null): TrafficState {
  const all = Array.from({ length: cw.lanes }, (_, i) => i + 1);
  const blocked = cw.blocked.filter((l) => all.includes(l));
  const laneTasks = tasks.filter((t) => t.kind === "lane_closure");
  const closed = [...new Set(laneTasks.filter(inForce).flatMap((t) => t.lanes ?? []))].filter((l) => all.includes(l)).sort((a, b) => a - b);
  const blocks = tasks.filter((t) => t.kind === "rolling_road_block");
  const closures = tasks.filter((t) => t.kind === "carriageway_closure");
  const held = blocks.some(inForce);
  const hwAt = highwaysRequestedAt ?? null;
  const hwSignalsAt = hwAt !== null ? hwAt + HIGHWAYS_SIGNALS_MIN * 60_000 : null;
  const hwOnSceneAt = hwAt !== null ? hwAt + (cw.highwaysEtaMin ?? HIGHWAYS_ETA_MIN) * 60_000 : null;
  const hwClosedAt = hwOnSceneAt !== null ? hwOnSceneAt + HIGHWAYS_CLOSURE_MIN * 60_000 : null;
  const highways: HighwaysStage = hwAt === null ? "none" : hwOnSceneAt !== null && now >= hwOnSceneAt ? "on_scene" : hwSignalsAt !== null && now >= hwSignalsAt ? "signals" : "requested";
  const closedAtJunction = closures.some(inForce) || (hwClosedAt !== null && now >= hwClosedAt);
  const fendOff = tasks.some((t) => t.kind === "fend_off" && inForce(t));
  const stoppedUpstream = held || closedAtJunction;
  const live = stoppedUpstream ? [] : all.filter((l) => !blocked.includes(l) && !closed.includes(l));
  const must = cw.mustClose.filter((l) => all.includes(l) && !blocked.includes(l));
  const prot = must.every((l) => !live.includes(l));
  const level: TrafficLevel = closedAtJunction ? "closed" : held ? "held" : prot ? "lanes_closed" : fendOff ? "fend_off" : "live";
  // When it came into force: the earliest moment the lanes that matter stopped running.
  let protectedSince: number | null = null;
  if (prot) {
    const candidates: number[] = [];
    for (const t of [...blocks, ...closures]) if (inForce(t)) candidates.push(t.completesAt ?? t.startedAt);
    if (hwClosedAt !== null && now >= hwClosedAt) candidates.push(hwClosedAt);
    if (must.every((l) => closed.includes(l))) {
      const coverAt = must.length === 0 ? 0 : Math.max(...must.map((l) => Math.min(...laneTasks.filter((t) => inForce(t) && (t.lanes ?? []).includes(l)).map((t) => t.completesAt ?? t.startedAt))));
      candidates.push(coverAt);
    }
    protectedSince = candidates.length ? Math.min(...candidates) : now;
  }
  const settingUp = tasks
    .filter((t) => t.state === "active" && TRAFFIC_KINDS.includes(t.kind))
    .map((t) => ({ kind: t.kind, completesAt: t.completesAt ?? null, applianceId: t.applianceId }));
  const running = laneLabel(live);
  const headline = closedAtJunction
    ? `${cw.name.toUpperCase()} CLOSED AT ${cw.upstream}`
    : held
      ? "ROLLING BLOCK IN FORCE"
      : prot
        ? `${laneLabel(must).toUpperCase()} CLOSED AT THE SCENE`
        : fendOff
          ? `FEND-OFF · ${running.toUpperCase()} RUNNING`
          : `${running.toUpperCase()} LIVE`;
  const hw = highways === "on_scene"
    ? (closedAtJunction ? `traffic officers holding ${cw.upstream}` : `traffic officers on scene, closing at ${cw.upstream}`)
    : highways === "signals"
      ? `signals set upstream, traffic officers due ${hwOnSceneAt !== null ? `in ${Math.max(0, Math.ceil((hwOnSceneAt - now) / 60_000))} min` : "soon"}`
      : highways === "requested"
        ? "National Highways asked, signals to follow"
        : "National Highways not yet asked";
  const detail = closedAtJunction
    ? `Nothing coming through from ${cw.upstream} — ${hw}`
    : held
      ? `Traffic stopped behind the roads unit — the block holds while the crews work · ${hw}`
      : prot
        ? `Cones and signs out, ${live.length ? `${running} still running wide of the work` : "nothing running at the scene"} · ${hw}`
        : fendOff
          ? `The appliance takes the hit if something comes through — ${running} still running beside the work · ${hw}`
          : `${cw.flow} traffic past the working area — shut ${laneLabel(must)}, block from ${cw.upstream} or close at the junction · ${hw}`;
  return { cw, live, closed, blocked, fendOff, held, closedAtJunction, highways, highwaysDueAt: hwOnSceneAt, level, protected: prot, protectedSince, settingUp, headline, detail };
}

/** The chance, per minute, that something comes through the working
 *  area while it is not protected: heavier traffic is worse, a fend-off
 *  appliance and the signals upstream take most of it away. */
export function nearMissChancePerMinute(s: TrafficState): number {
  if (s.protected) return 0;
  let p = s.cw.flow === "heavy" ? 0.06 : s.cw.flow === "moderate" ? 0.04 : 0.02;
  if (s.fendOff) p *= 0.35;
  if (s.highways === "signals" || s.highways === "on_scene") p *= 0.5;
  return p;
}

/** What the near miss was, for the log. */
export function nearMissWording(s: TrafficState, roll: number): string {
  const lane = s.live.length ? laneLabel([s.live[0]]) : "the live lane";
  if (s.fendOff) {
    return roll < 0.5
      ? `A car came through ${lane} at speed and swerved round the fend-off appliance — the crew heard it before they saw it`
      : `A van clipped the cones at the fend-off and carried on — nobody hurt, the appliance took the scare`;
  }
  const lines = [
    `NEAR MISS — a lorry came through ${lane} at speed, a metre from the crew working on the wreck`,
    `NEAR MISS — a car braked late in ${lane} and stopped level with the ambulance crew, horn going`,
    `NEAR MISS — a van swerved past the working area in ${lane}; a firefighter stepped back onto the bonnet of the wreck`,
  ];
  return lines[Math.min(lines.length - 1, Math.floor(roll * lines.length))];
}
