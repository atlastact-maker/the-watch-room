// THE CLOSED SECTION. A wreck on a dual carriageway shuts more road than
// the lanes it lies in. Behind it the traffic queues back towards the
// junction it came from; once the police hold that junction, or the
// traffic officers shut it, the stretch from the junction to the scene is
// empty tarmac. Ahead of it, from the moment nothing passes the scene,
// the carriageway down to the next junction is empty too — and a unit
// that would otherwise go the long way round to join behind the queue
// can turn in at that junction and come up the empty carriageway against
// the flow. It is only safe once nothing is coming the other way; before
// that it is a fire engine driving at seventy-mile-an-hour traffic.
//
// The section's geography comes from the router when the job opens
// (upstream junction → scene → downstream junction along the real road);
// what runs on it comes from traffic.ts; what each unit should do about
// it is planned here, the same way for the cards on the desk and for the
// unit actually sent.

import type { SceneCarriageway } from "./scene";
import type { TrafficState } from "./traffic";
import { laneLabel } from "./traffic";
import { haversineMeters } from "./eta";

export type LatLng = { lat: number; lng: number };
export type Junction = { name: string; lat: number; lng: number };

/** The junctions of a carriageway scene, when the scenario placed them —
 *  the only kind of road a closed section can be drawn for. */
export function carriagewayJunctions(cw: SceneCarriageway | null | undefined): { upstream: Junction; downstream: Junction } | null {
  if (!cw?.upstreamCoords || !cw.downstreamCoords) return null;
  return {
    upstream: { name: cw.upstream, lat: cw.upstreamCoords.lat, lng: cw.upstreamCoords.lng },
    downstream: { name: cw.downstream, lat: cw.downstreamCoords.lat, lng: cw.downstreamCoords.lng },
  };
}

export type ClosedSection = {
  incidentId: string;
  /** "M60 eastbound" */
  name: string;
  upstream: Junction;
  downstream: Junction;
  scene: LatLng;
  /** Upstream junction → scene along the carriageway; null until the router answers. */
  approach: [number, number][] | null;
  approachMeters: number;
  /** Scene → downstream junction along the carriageway. */
  exit: [number, number][] | null;
  exitMeters: number;
  /** Downstream junction → scene the legal way, round the block: the
   *  router's own driving seconds, before blue lights and weather. Null
   *  until it answers, or when it could only guess. */
  legalFromDownstreamSec: number | null;
};

/** A section with its junctions placed and no geometry yet. */
export function newSection(incidentId: string, cw: SceneCarriageway, scene: LatLng): ClosedSection | null {
  const j = carriagewayJunctions(cw);
  if (!j) return null;
  return { incidentId, name: cw.name, upstream: j.upstream, downstream: j.downstream, scene, approach: null, approachMeters: 0, exit: null, exitMeters: 0, legalFromDownstreamSec: null };
}

/** 30 mph: against the flow on a stopped carriageway, with care. */
export const CONTRAFLOW_MPS = 13.4;
/** Through the closure point at the junction and onto the wrong carriageway. */
export const CONTRAFLOW_ENTRY_SEC = 45;
/** The approach is offered when it saves at least this. */
export const CONTRAFLOW_MARGIN_SEC = 90;
/** Waved through a rolling block or a closure point by the police. */
export const CLOSURE_POINT_SEC = 30;
/** Per minute: a unit coming in against the flow meets what is still running. */
export const CONTRAFLOW_LIVE_NEAR_MISS_PER_MIN = 0.12;
/** A diversion round a closed carriageway when no router can plot one. */
export const DIVERSION_FALLBACK_SEC = 420;
/** A route lying this close to the closed section is on it. */
export const ON_SECTION_M = 45;

/** Metres of carriageway from the scene to the downstream junction: the
 *  route when there is one, else the crow-fly with a road factor. */
export function exitLegMeters(s: Pick<ClosedSection, "exit" | "exitMeters" | "scene" | "downstream">): number {
  if (s.exit && s.exitMeters > 0) return s.exitMeters;
  return haversineMeters(s.scene, s.downstream) * 1.15;
}

export function approachLegMeters(s: Pick<ClosedSection, "approach" | "approachMeters" | "scene" | "upstream">): number {
  if (s.approach && s.approachMeters > 0) return s.approachMeters;
  return haversineMeters(s.scene, s.upstream) * 1.15;
}

/** Seconds from the junction ahead to the scene, against the flow. */
export function contraflowLegSec(s: Pick<ClosedSection, "exit" | "exitMeters" | "scene" | "downstream">): number {
  return CONTRAFLOW_ENTRY_SEC + exitLegMeters(s) / CONTRAFLOW_MPS;
}

/** Nothing passes the scene: every lane blocked or coned, or the road
 *  held or shut behind it. The carriageway ahead of the wreck is empty. */
export function isStopped(t: Pick<TrafficState, "live">): boolean {
  return t.live.length === 0;
}

/** How long the road has been blocked: the wreck was there a few minutes
 *  before anyone rang. */
export function minutesBlocked(receivedAt: number, now: number): number {
  return Math.max(0, (now - receivedAt) / 60_000) + 3;
}

/** Seconds a unit coming in behind the scene loses to the queue. Nothing
 *  but the police waving it through once the road is held or shut from
 *  the junction — the stretch is empty. While traffic still reaches the
 *  scene the queue grows with the flow, with how long the wreck has been
 *  there and with how much of the road it and the cones have taken; a
 *  hard shoulder halves it, because that is what the unit drives up. */
export function queuePenaltySec(t: TrafficState, minutesSinceBlocked: number): number {
  if (t.held || t.closedAtJunction) return CLOSURE_POINT_SEC;
  const cw = t.cw;
  const taken = new Set([...t.blocked, ...t.closed]).size;
  const share = cw.lanes > 0 ? Math.min(1, taken / cw.lanes) : 0;
  const growth = cw.flow === "heavy" ? 24 : cw.flow === "moderate" ? 14 : 6;
  const cap = cw.flow === "heavy" ? 600 : cw.flow === "moderate" ? 360 : 180;
  let sec = Math.min(cap, growth * Math.max(0, minutesSinceBlocked)) * (0.35 + 0.65 * share);
  if (cw.hardShoulder) sec *= 0.5;
  return Math.round(sec);
}

export type ApproachKind = "direct" | "queue" | "through_closure" | "contraflow" | "contraflow_offer";

export type ApproachPlan = {
  kind: ApproachKind;
  /** Seconds the unit is priced at. */
  etaSec: number;
  /** By the legal route, as the router gave it. */
  legalSec: number;
  /** In from the junction ahead against the flow, when that is a route at all. */
  contraflowSec: number | null;
  savesSec: number;
  extraSec: number;
  /** Against the flow with nothing coming the other way. */
  safe: boolean;
  junction: string;
  /** For the card. */
  chip: string;
  tone: "go" | "warn" | "stop" | "off";
  /** A sentence for the tooltip and the log. */
  detail: string;
};

export type ApproachInput = {
  legalSec: number;
  /** To the junction ahead of the scene, priced like legalSec. */
  toDownstreamSec: number | null;
  fromDownstream: boolean;
  section: ClosedSection | null | undefined;
  traffic: TrafficState | null | undefined;
  /** The desk has authorised approaches against the flow on this job. */
  authorised: boolean;
  minutesSinceBlocked: number;
};

const fmtMin = (sec: number) => `${Math.max(1, Math.round(sec / 60))} min`;

export function directPlan(legalSec: number): ApproachPlan {
  return { kind: "direct", etaSec: legalSec, legalSec, contraflowSec: null, savesSec: 0, extraSec: 0, safe: true, junction: "", chip: "", tone: "off", detail: "" };
}

export function planApproach(a: ApproachInput): ApproachPlan {
  const { legalSec, section, traffic } = a;
  if (!section || !traffic) return directPlan(legalSec);
  const stopped = isStopped(traffic);
  if (a.fromDownstream) {
    // The far side with no time to the junction ahead: nothing to plan on.
    if (a.toDownstreamSec === null) return directPlan(legalSec);
    const contra = a.toDownstreamSec + contraflowLegSec(section);
    const saves = legalSec - contra;
    const j = section.downstream.name;
    if (saves >= CONTRAFLOW_MARGIN_SEC) {
      if (a.authorised) {
        return {
          kind: "contraflow", etaSec: contra, legalSec, contraflowSec: contra, savesSec: saves, extraSec: 0, safe: stopped, junction: j,
          chip: stopped ? `IN FROM ${j} AGAINST THE FLOW · SAVES ${fmtMin(saves).toUpperCase()}` : `AGAINST THE FLOW FROM ${j} · ${laneLabel(traffic.live).toUpperCase()} STILL RUNNING`,
          tone: stopped ? "go" : "stop",
          detail: stopped
            ? `In from ${j} against the flow on the closed carriageway — ${fmtMin(contra)} instead of ${fmtMin(legalSec)} the long way round by ${section.upstream.name}`
            : `Authorised against the flow from ${j} with ${laneLabel(traffic.live)} still running past the scene — the unit meets whatever comes through`,
        };
      }
      return {
        kind: "contraflow_offer", etaSec: legalSec, legalSec, contraflowSec: contra, savesSec: saves, extraSec: 0, safe: stopped, junction: j,
        chip: stopped ? `LONG WAY ROUND BY ${section.upstream.name} · ${fmtMin(contra).toUpperCase()} FROM ${j} AGAINST THE FLOW IF AUTHORISED` : `LONG WAY ROUND BY ${section.upstream.name} · FROM ${j} AGAINST THE FLOW ONCE THE ROAD IS STOPPED`,
        tone: "warn",
        detail: stopped
          ? `Nothing passing the scene — authorise approaches against the flow and this unit comes in from ${j} in ${fmtMin(contra)} instead of ${fmtMin(legalSec)}`
          : `From ${j} against the flow this would be ${fmtMin(contra)}, but ${laneLabel(traffic.live)} still runs past the scene — stop the road first`,
      };
    }
    return directPlan(legalSec);
  }
  const q = queuePenaltySec(traffic, a.minutesSinceBlocked);
  const j = section.upstream.name;
  if (traffic.held || traffic.closedAtJunction) {
    return {
      kind: "through_closure", etaSec: legalSec + q, legalSec, contraflowSec: null, savesSec: 0, extraSec: q, safe: true, junction: j,
      chip: `THROUGH THE ${traffic.closedAtJunction ? "CLOSURE" : "BLOCK"} AT ${j} · EMPTY ROAD`,
      tone: "go",
      detail: `Waved through at ${j} — nothing on the carriageway between the junction and the scene`,
    };
  }
  if (q >= 60) {
    return {
      kind: "queue", etaSec: legalSec + q, legalSec, contraflowSec: null, savesSec: 0, extraSec: q, safe: true, junction: j,
      chip: `QUEUE BACK FROM THE SCENE · +${fmtMin(q).toUpperCase()}${traffic.cw.hardShoulder ? " UP THE HARD SHOULDER" : ""}`,
      tone: "warn",
      detail: `${traffic.cw.flow[0].toUpperCase()}${traffic.cw.flow.slice(1)} traffic queuing back from the wreck towards ${j}${traffic.cw.hardShoulder ? " — the unit comes up the hard shoulder" : " — no hard shoulder to come up"}; a block from ${j} or a closure empties the road`,
    };
  }
  return directPlan(legalSec);
}

/** Whether a unit's legal route comes in by the junction ahead — the long
 *  way round — read from the router's times: to the scene, to that
 *  junction, and from that junction to the scene the legal way. All three
 *  priced alike. */
export function comesFromDownstream(toSceneSec: number, toDownstreamSec: number, legalFromDownstreamSec: number): boolean {
  if (!(toSceneSec > 0)) return false;
  return toDownstreamSec + legalFromDownstreamSec <= toSceneSec * 1.15 + 60;
}

/** When the router could not say: from where the unit stands. Nearer the
 *  junction ahead than the junction behind, and nearer it than the scene. */
export function comesFromDownstreamByPosition(from: LatLng, s: Pick<ClosedSection, "upstream" | "downstream" | "scene">): boolean {
  const dDown = haversineMeters(from, s.downstream);
  return dDown < haversineMeters(from, s.upstream) && dDown < haversineMeters(from, s.scene);
}

/** The line for the road panel. */
export function approachSummary(t: TrafficState, authorised: boolean): string {
  const cw = t.cw;
  const stopped = isStopped(t);
  if (authorised) {
    return stopped
      ? `units coming in from ${cw.downstream} against the flow on the closed carriageway`
      : `AGAINST THE FLOW AUTHORISED FROM ${cw.downstream} WITH ${laneLabel(t.live).toUpperCase()} RUNNING — stop the road or withdraw it`;
  }
  if (stopped) return `nothing passing the scene — control can authorise an approach from ${cw.downstream} against the flow`;
  return `with the flow from ${cw.upstream} only, ${laneLabel(t.live)} still running — the far side is the long way round`;
}

/** Whether approaches against the flow stand authorised on a job, from
 *  the shift log — the tablets read the log, not the desk's state. */
export function contraflowFromLog(log: { id: string; timestamp: number }[], incidentId: string): { on: boolean; at: number | null } {
  const on = `contraflow:on:${incidentId}:`;
  const off = `contraflow:off:${incidentId}:`;
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (e.id.startsWith(on)) return { on: true, at: e.timestamp };
    if (e.id.startsWith(off)) return { on: false, at: e.timestamp };
  }
  return { on: false, at: null };
}

export function contraflowNearMissWording(callsign: string, t: TrafficState, roll: number): string {
  const lane = t.live.length ? laneLabel([t.live[0]]) : "the live lane";
  const lines = [
    `NEAR MISS — ${callsign}, coming in from ${t.cw.downstream} against the flow, met a car head-on in ${lane}; both stopped a length apart`,
    `NEAR MISS — a van came through ${lane} at speed and swerved round ${callsign} on the wrong carriageway, horn going`,
    `NEAR MISS — ${callsign} pulled onto the hard shoulder as a lorry came through ${lane} towards it; the crew felt it pass`,
  ];
  return lines[Math.min(lines.length - 1, Math.floor(roll * lines.length))];
}

/* ---- geometry: a route against the section, and the section as an area to keep off ---- */

type Pt = [number, number];

/** Metres and a projection around the scene, good enough across a county. */
function projector(origin: LatLng) {
  const kx = 111_320 * Math.cos((origin.lat * Math.PI) / 180);
  const ky = 110_540;
  return {
    toXY: (p: Pt): Pt => [(p[1] - origin.lng) * kx, (p[0] - origin.lat) * ky],
    toLatLng: (xy: Pt): Pt => [origin.lat + xy[1] / ky, origin.lng + xy[0] / kx],
  };
}

function segDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  const x = a[0] + t * dx - p[0];
  const y = a[1] + t * dy - p[1];
  return Math.hypot(x, y);
}

/** Metres of a route that lie on the closed section — the approach from
 *  the junction behind and the carriageway on to the junction ahead. */
export function routeRunsAlong(coords: [number, number][], s: Pick<ClosedSection, "approach" | "exit" | "scene">): number {
  const lines = [s.approach, s.exit].filter((l): l is [number, number][] => !!l && l.length >= 2);
  if (!lines.length || coords.length < 2) return 0;
  const { toXY } = projector(s.scene);
  const segs: [Pt, Pt][] = [];
  for (const l of lines) {
    const xy = l.map(toXY);
    for (let i = 1; i < xy.length; i++) segs.push([xy[i - 1], xy[i]]);
  }
  // A coarse box round the section first, so a route nowhere near it costs nothing.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [a, b] of segs) {
    for (const p of [a, b]) { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  }
  const pad = ON_SECTION_M * 2;
  const near = (p: Pt) => {
    if (p[0] < minX - pad || p[0] > maxX + pad || p[1] < minY - pad || p[1] > maxY + pad) return false;
    for (const [a, b] of segs) if (segDist(p, a, b) <= ON_SECTION_M) return true;
    return false;
  };
  const xy = coords.map(toXY);
  let metres = 0;
  let prevNear = near(xy[0]);
  for (let i = 1; i < xy.length; i++) {
    const n = near(xy[i]);
    if (n && prevNear) metres += Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]);
    prevNear = n;
  }
  return metres;
}

/** The section as thin strips either side of the carriageway, for a
 *  router that takes areas to avoid. Few enough points to go in a URL. */
export function sectionAvoidPolygons(s: Pick<ClosedSection, "approach" | "exit" | "scene">, halfWidthM = 40, maxPoints = 28): [number, number][][] {
  const { toXY, toLatLng } = projector(s.scene);
  const out: [number, number][][] = [];
  for (const line of [s.approach, s.exit]) {
    if (!line || line.length < 2) continue;
    const step = Math.max(1, Math.ceil(line.length / maxPoints));
    const pts: Pt[] = [];
    for (let i = 0; i < line.length; i += step) pts.push(toXY(line[i]));
    const last = toXY(line[line.length - 1]);
    if (pts[pts.length - 1][0] !== last[0] || pts[pts.length - 1][1] !== last[1]) pts.push(last);
    if (pts.length < 2) continue;
    const left: Pt[] = [];
    const right: Pt[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * halfWidthM;
      const ny = (dx / len) * halfWidthM;
      left.push([pts[i][0] + nx, pts[i][1] + ny]);
      right.push([pts[i][0] - nx, pts[i][1] - ny]);
    }
    const ring = [...left, ...right.reverse()].map(toLatLng);
    ring.push(ring[0]);
    out.push(ring);
  }
  return out;
}

export function reverseLine(coords: [number, number][]): [number, number][] {
  return coords.slice().reverse();
}

/** The sweep's answer for a station, or a unit standing by: how long to
 *  the junction ahead of the scene, priced like its ETA to the scene, and
 *  whether its legal route comes in that way — the long way round. */
export type StationApproach = { toDownstreamSec: number; fromDownstream: boolean };
