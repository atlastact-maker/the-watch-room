"use client";

// THE GROUND VIEW OF A ROAD TRAFFIC COLLISION — the whole scene from
// above on the tablet's Incident app. The carriageway and what is still
// running on it; the wrecks, each drawn the way the Fire module's stage
// draws the one it frames; the appliances where the operator parked them
// on the map, or where a fend-off or a rolling block has put them; the
// crews running from the appliance to a job, walking between jobs and
// back; the cones going out across a lane; the ambulance crews with the
// casualties; the witness's car and the caller's lorry on the hard
// shoulder; the overbridge. It reads the same deployments, tasks, log and
// sim state as every other screen and stores nothing of its own. It is
// for watching: tapping a unit picks it on the tablet, and that is all.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Incident, LogEntry, Task, TaskKind, PatientTreatmentState } from "@/lib/sim/incident_types";
import { scopeOfApplianceType } from "@/lib/sim/incident_types";
import type { IncidentSimState } from "@/lib/sim/incident_sim";
import type { ResusState } from "@/lib/sim/resus";
import { latLngToMetres, type SceneCasualty, type SceneRect } from "@/lib/sim/scene";
import { trafficState } from "@/lib/sim/traffic";
import { patientLook } from "@/lib/sim/patient_look";
import type { ResolvedDeployment } from "../../components/incident-view";
import { FigureDefs, rig, PlanFigure, P, len, sub, unit, lerp, deg, type Pt, type Rig } from "./plan-figure";
import { KitDefs } from "./plan-kit";
import { CrewTop, crewWearOf } from "./plan-crew";
import { GroundDefs, WeatherDefs, Tarmac, prng, type Ambient } from "./plan-ground";
import { RtcWreck, RtcDefs, Cone, PlanCar, PlanArtic, Walker, legAt, headingRotate, WALK_MPS, type Mover } from "./plan-rtc";
import { ModelSprite } from "./model-sprite";
import { UnitSprite, unitFootprint } from "./plan-vehicles";
import { wearOf, hash, type SceneCrew } from "../patient-scene";
import { rtcJobs } from "../rtc-state";
import type { RtcGroundView, Placing } from "./ground-views";

const n2 = (v: number) => (Math.round(v * 1000) / 1000).toString();

/** How long a crew's walk back to the appliance is followed after a job ends. */
const WALK_BACK_MS = 40_000;
/** Crews standing by go on an errand to the wreck's kit now and then: one
 *  of each appliance's crew at a time, each taking their turn once in
 *  this long, a few seconds there. */
const ERRAND_CYCLE_MS = 150_000;
const ERRAND_PAUSE_MS = 4_500;
/** The paint on the traffic: the greys and silvers of a motorway, a few colours. */
const CAR_PAINTS = ["#9aa4ad", "#1f2a36", "#c3c9ce", "#5b6670", "#7b1e24", "#1d4f8c", "#d8d9d3", "#2f2f31", "#6d5c4a", "#e9e9e6", "#3f6b3a", "#8c3c1f"];

export type Frame = "wide" | "work" | "wreck";

export type RtcGroundProps = {
  view: RtcGroundView;
  incident: Incident;
  resolved: ResolvedDeployment[];
  tasks: Task[];
  log: LogEntry[];
  now: number;
  sim: IncidentSimState | null;
  treatmentByCasualtyId?: Record<string, PatientTreatmentState>;
  resusByCasualtyId?: Record<string, ResusState>;
  hour?: number;
  rain?: boolean;
  selectedUnitId?: string | null;
  onSelectUnit?: (applianceId: string) => void;
  commanderApplianceId?: string | null;
};

/** A compass heading's direction on the picture: north is up. */
const dirOf = (heading: number): Pt => [Math.sin((heading * Math.PI) / 180), -Math.cos((heading * Math.PI) / 180)];
/** Between two headings the short way round. */
function turn(a: number, b: number, t: number): number {
  const d = ((b - a + 540) % 360) - 180;
  return a + d * t;
}
const live = (t: Task) => t.state !== "aborted";

type Unit = {
  r: ResolvedDeployment;
  at: Pt;
  heading: number;
  /** Parked by the operator or put somewhere by a task; else held where the scene keeps the unplaced. */
  placed: boolean;
  /** What the unit is doing where it is, for its plate. */
  role: string | null;
  lights: string;
};

type Stander = { at: Pt; facing: Pt; service: "Fire" | "Ambulance" | "Police"; scope?: string; seed: number; role?: string; kneeling?: boolean; hands?: { left?: Pt; right?: Pt }; /** On an errand: the walk under way. */ mover?: Mover };

export function RtcGround({ view, incident, resolved, tasks, log, now, sim, treatmentByCasualtyId, resusByCasualtyId, hour, rain, selectedUnitId, onSelectUnit, commanderApplianceId }: RtcGroundProps) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 520 });
  useEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r && r.width > 0 && r.height > 0) setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  const [frame, setFrame] = useState<Frame>("work");

  const sc = incident.scenario;
  const scene = sc.scene;
  const cw = scene?.carriageway;
  if (!scene || !cw) return <div className="gv-empty">No ground view for this job</div>;

  // ---- The road -----------------------------------------------------------------
  const vb = scene.viewBox;
  const roads = scene.roads;
  const eb: SceneRect = roads.find((r) => r.kind === "road" && r.label === cw.name)?.shape ?? roads.find((r) => r.kind === "road")!.shape;
  const wb = roads.find((r) => r.kind === "road" && r.shape !== eb)?.shape ?? null;
  const lh = eb.h / cw.lanes;
  const top = view.nearside === "top";
  const flow = view.flow;
  /** A lane's centre line, and the edge between lane k and k+1 — edge 0 being the nearside edge. */
  const laneY = (l: number) => (top ? eb.y + (l - 0.5) * lh : eb.y + eb.h - (l - 0.5) * lh);
  const laneEdge = (k: number) => (top ? eb.y + k * lh : eb.y + eb.h - k * lh);
  const hs = roads.find((r) => r.kind === "pavement" && (top ? Math.abs(r.shape.y + r.shape.h - eb.y) < 0.05 : Math.abs(r.shape.y - (eb.y + eb.h)) < 0.05))?.shape ?? null;
  const hsMid = hs ? hs.y + hs.h / 2 : top ? eb.y - 1.5 : eb.y + eb.h + 1.5;
  const amb: Ambient = { night: hour !== undefined && (hour < 7 || hour >= 18.5), rain: !!rain };
  // The ground: the aerial photograph where there is one, else the scene's box.
  const photo = view.photo ?? null;
  const area = photo
    ? { x: -photo.origin[0] / photo.ppm, y: -photo.origin[1] / photo.ppm, w: photo.size[0] / photo.ppm, h: photo.size[1] / photo.ppm }
    : { x: vb.x, y: vb.y, w: vb.width, h: vb.height };

  // ---- What is running past, and what the crews have done ---------------------------
  const highwaysAskedAt = log.filter((e) => e.id.startsWith(`hw-ask:${incident.id}:`)).map((e) => e.timestamp)[0] ?? null;
  const traffic = trafficState(cw, tasks, now, highwaysAskedAt);
  const jobs = rtcJobs(tasks, now);
  const progress = (t: Task) => (t.state === "completed" ? 1 : t.completesAt ? Math.max(0, Math.min(1, (now - t.startedAt) / Math.max(1, t.completesAt - t.startedAt))) : 1);

  // ---- The units: where each one is ----------------------------------------------------
  const here = sc.location.coords;
  const onScene = resolved.filter((r) => r.phase === "at_incident").slice().sort((a, b) => a.deployment.arrivesAt - b.deployment.arrivesAt);
  let held = 0;
  const units: Unit[] = onScene.map((r) => {
    const d = r.deployment;
    const parked: Placing | null = d.parkingPos ? { at: (({ x, y }) => [x, y] as Pt)(latLngToMetres(here, d.parkingPos)), heading: d.parkingBearingDeg ?? (flow > 0 ? 90 : 270) } : null;
    const base: Placing = parked ?? view.holding[Math.min(held++, view.holding.length - 1)];
    const mine = (kind: TaskKind) => tasks.find((t) => t.kind === kind && t.applianceId === r.appliance.id && live(t));
    const fend = mine("fend_off"), block = mine("rolling_road_block"), closure = mine("carriageway_closure");
    const target: { p: Placing; task: Task; role: string } | null = block
      ? { p: view.block, task: block, role: `Rolling block from ${block.junction ?? cw.upstream}` }
      : closure
        ? { p: view.junction, task: closure, role: `Closed at ${closure.junction ?? cw.upstream}` }
        : fend
          ? { p: view.fendOff, task: fend, role: "Fend-off" }
          : null;
    const t = target ? progress(target.task) : 0;
    const at = target ? lerp(base.at, target.p.at, t) : base.at;
    const heading = target ? turn(base.heading, target.p.heading, t) : base.heading;
    const lights = !d.lightState || d.lightState === "999" ? "at_scene" : d.lightState;
    return { r, at, heading, placed: !!parked || !!target, role: target ? (target.task.state === "active" ? `${target.role} · setting up` : target.role) : parked ? null : "not yet placed on the map", lights };
  });
  const unitById = new Map(units.map((u) => [u.r.appliance.id, u]));

  // ---- The wrecks, and the way from each appliance to them ------------------------------
  const crs = sc.crs ?? [];
  const wrecks = view.wrecks.map((w) => ({ ...w, vehicle: crs.find((v) => v.id === w.vehicleId) ?? null })).filter((w) => w.vehicle);
  const toLocal = (w: Placing, p: Pt): Pt => {
    const th = (headingRotate(w.heading) * Math.PI) / 180;
    const dx = p[0] - w.at[0], dy = p[1] - w.at[1];
    return [dx * Math.cos(th) + dy * Math.sin(th), -dx * Math.sin(th) + dy * Math.cos(th)];
  };
  // A crew's doorstep: just off their appliance on the side nearer where they are going.
  const doorstep = (u: Unit, towards: Pt): Pt => {
    const fp = unitFootprint(u.r.appliance.type, u.r.appliance.service);
    const dir = unit(sub(towards, u.at));
    const axis = dirOf(u.heading);
    const along = Math.abs(dir[0] * axis[0] + dir[1] * axis[1]);
    const reach = (fp.l / 2) * along + (fp.w / 2) * (1 - along) + 0.9;
    return [u.at[0] + dir[0] * reach, u.at[1] + dir[1] * reach];
  };
  const fromFor = (w: Placing) => (applianceId?: string) => {
    const u = applianceId ? unitById.get(applianceId) : undefined;
    return u ? toLocal(w, doorstep(u, w.at)) : null;
  };

  // ---- The people: in the cars, on the hard shoulder, with the crews ---------------------
  const casualties: SceneCasualty[] = sim?.foundCasualties ?? scene.casualties ?? [];
  const near = (a: { x: number; y: number }, b: Pt) => Math.hypot(a.x - b[0], a.y - b[1]) < 2.6;
  const casualtiesOf = (i: number) => {
    const byPos = casualties.filter((c) => near(c.pos, wrecks[i].at));
    if (byPos.length) return byPos;
    return i === 0 ? casualties.filter((c) => c.trappedUntilExtricated) : [];
  };
  const lookOf = (c: SceneCasualty) => patientLook(c, treatmentByCasualtyId?.[c.id], resusByCasualtyId?.[c.id], { landed: false });
  const medicsWith = (casualtyId: string): SceneCrew[] => units
    .filter((u) => u.r.appliance.service === "Ambulance" && u.r.deployment.treatingCasualtyId === casualtyId)
    .flatMap((u) => u.r.appliance.crewMembers.slice(0, 2).map((m, i) => ({ callsign: u.r.appliance.callsign, role: m.role, service: "Ambulance" as const, scope: scopeOfApplianceType(u.r.appliance.type), name: i > 0 ? m.name : undefined })));
  const seated = new Set<string>();
  const attached = new Set(wrecks.flatMap((_, i) => casualtiesOf(i).map((c) => c.id)));
  const sideOut: Pt = top ? [0, -1] : [0, 1];

  // Who is away from their appliance: at a wreck, on the cones, with a casualty, walking back.
  const active = tasks.filter((t) => t.state === "active");
  const awayIds = new Set(active.filter((t) => t.kind === "crs_action" || t.kind === "rtc_extrication" || t.kind === "lane_closure" || t.kind === "fend_off").flatMap((t) => t.assignedCrewIds));
  // Crews walking back from a job that just ended are on the road, not by
  // the appliance yet: away for as long as the walk takes.
  const walkingBack = new Map<string, number>();
  for (const w of wrecks) for (const f of jobs.finishedOn(w.vehicle!, WALK_BACK_MS)) {
    const u = f.applianceId ? unitById.get(f.applianceId) : undefined;
    if (!u) continue;
    const walkMs = (len(sub(w.at, u.at)) / 1.4) * 1000 + 600;
    if (now - f.endedAt < walkMs) walkingBack.set(u.r.appliance.id, (walkingBack.get(u.r.appliance.id) ?? 0) + f.crew);
  }

  const standers: Stander[] = [];
  const wreckCentre: Pt = wrecks.length ? [wrecks.reduce((a, w) => a + w.at[0], 0) / wrecks.length, wrecks.reduce((a, w) => a + w.at[1], 0) / wrecks.length] : [0, 0];
  // Where an errand goes: the kit laid out beyond the first wreck's nose.
  const kitAt: Pt | null = wrecks.length ? (() => { const w = wrecks[0]; const th = (headingRotate(w.heading) * Math.PI) / 180; const l: Pt = [-5.8, 1.5]; return [w.at[0] + l[0] * Math.cos(th) - l[1] * Math.sin(th), w.at[1] + l[0] * Math.sin(th) + l[1] * Math.cos(th)]; })() : null;
  // A fire crew member standing by goes to the kit and back now and then:
  // where they are in that at this moment — walking out, there, walking
  // back, or standing by — from the clock alone.
  const errand = (unitKey: string, i: number, n: number, from: Pt): { mover?: Mover; at: Pt } => {
    if (!kitAt) return { at: from };
    const ms = Math.max(2000, (len(sub(kitAt, from)) / WALK_MPS) * 1000);
    const tU = now + (hash(unitKey) % ERRAND_CYCLE_MS);
    // Whose turn it is this cycle; the rest stand by.
    if (Math.floor(tU / ERRAND_CYCLE_MS) % n !== i) return { at: from };
    const t = tU % ERRAND_CYCLE_MS;
    if (t < ms) return { mover: { legs: [{ from, to: kitAt, ms }], since: t, clip: "firefighter_walk" }, at: kitAt };
    if (t < ms + ERRAND_PAUSE_MS) return { at: kitAt };
    if (t < 2 * ms + ERRAND_PAUSE_MS) return { mover: { legs: [{ from: kitAt, to: from, ms }], since: t - ms - ERRAND_PAUSE_MS, clip: "firefighter_walk" }, at: from };
    return { at: from };
  };
  for (const u of units) {
    const a = u.r.appliance;
    const service = a.service === "Fire" || a.service === "Ambulance" || a.service === "Police" ? a.service : "Fire";
    const treating = a.service === "Ambulance" && !!u.r.deployment.treatingCasualtyId;
    const inCar = tasks.some((t) => t.kind === "rolling_road_block" && t.applianceId === a.id && live(t)) ? 1 : 0;
    const idle = a.crewMembers.filter((m) => !awayIds.has(m.id)).length - (walkingBack.get(a.id) ?? 0) - (treating ? 2 : 0) - inCar;
    if (idle <= 0) continue;
    // Along the side of the vehicle nearer the wreck, a step apart, facing it.
    const fp = unitFootprint(a.type, a.service);
    const axis = dirOf(u.heading);
    const across: Pt = [-axis[1], axis[0]];
    const toWreck = sub(wreckCentre, u.at);
    const side = toWreck[0] * across[0] + toWreck[1] * across[1] >= 0 ? 1 : -1;
    const n = Math.min(idle, 5);
    for (let i = 0; i < n; i++) {
      const along = -fp.l * 0.3 + (i * (fp.l * 0.6)) / Math.max(1, n - 1);
      const at: Pt = [u.at[0] + axis[0] * along + across[0] * side * (fp.w / 2 + 0.55), u.at[1] + axis[1] * along + across[1] * side * (fp.w / 2 + 0.55)];
      const e = service === "Fire" ? errand(`${a.id}:errand`, i, n, at) : { at };
      standers.push({ at: e.at, facing: e.at === at ? unit(toWreck) : unit(sub(at, e.at)), mover: e.mover, service, scope: scopeOfApplianceType(a.type), seed: hash(`${a.id}:${i}`), role: service === "Ambulance" ? "PARAMEDIC" : service === "Police" ? "POLICE" : undefined });
    }
  }
  // The fend-off crew member at the back of the appliance with the cones; the officers on the taper.
  const fendUnit = units.find((u) => tasks.some((t) => t.kind === "fend_off" && t.applianceId === u.r.appliance.id && live(t)));
  const fendCones: Pt[] = [];
  if (fendUnit && traffic.fendOff) {
    const fp = unitFootprint(fendUnit.r.appliance.type, fendUnit.r.appliance.service);
    const axis = dirOf(fendUnit.heading);
    const rear: Pt = [fendUnit.at[0] - axis[0] * (fp.l / 2 + 1.0), fendUnit.at[1] - axis[1] * (fp.l / 2 + 1.0)];
    standers.push({ at: rear, facing: [-flow, 0], service: fendUnit.r.appliance.service === "Police" ? "Police" : "Fire", seed: hash(`${fendUnit.r.appliance.id}:fend`) });
    for (let i = 0; i < 4; i++) fendCones.push([rear[0] - flow * (2.2 + i * 2.1), rear[1] + (top ? -1 : 1) * (1.2 - i * 0.9)]);
  }
  // The cones across a lane: from the carriageway's edge diagonally to the
  // lane's far edge, then along it to the wreck, placed in that order as
  // the officers work along it.
  const laneTasks = tasks.filter((t) => t.kind === "lane_closure" && live(t));
  const coneLanes = [...new Set(laneTasks.flatMap((t) => t.lanes ?? []))].filter((l) => l >= 1 && l <= cw.lanes);
  const conePts: Pt[] = [];
  let coneShown = 0;
  if (coneLanes.length) {
    const fromNear = coneLanes.includes(1);
    const k = fromNear ? Math.max(...coneLanes) : cw.lanes - Math.min(...coneLanes) + 1;
    const inset = 0.4;
    const a = fromNear ? laneEdge(0) + (top ? inset : -inset) : laneEdge(cw.lanes) + (top ? -inset : inset);
    const b = fromNear ? laneEdge(k) + (top ? -inset : inset) : laneEdge(cw.lanes - k) + (top ? inset : -inset);
    const { from, to, until } = view.taper;
    const steps = 7;
    for (let i = 0; i <= steps; i++) conePts.push([from + ((to - from) * i) / steps, a + ((b - a) * i) / steps]);
    const run = Math.abs(until - to);
    for (let x = 6; x <= run; x += 6) conePts.push([to + Math.sign(until - to) * x, b]);
    const prog = Math.max(...laneTasks.map(progress));
    coneShown = Math.round(conePts.length * prog);
    laneTasks.forEach((t, j) => t.assignedCrewIds.slice(0, 3).forEach((_, i) => {
      const p = conePts[Math.max(0, Math.min(conePts.length - 1, coneShown - 1 - i))];
      standers.push({ at: [p[0] + flow * 0.9, p[1] + (top ? 0.9 : -0.9) * (1 + i * 0.3)], facing: [-flow, 0], service: "Police", seed: hash(`${t.id}:${j}:${i}`), role: "POLICE" });
    }));
  }

  // ---- The traffic ------------------------------------------------------------------------
  const x0 = area.x - 8, x1 = area.x + area.w + 8;
  const stream = (key: string, y: number, dir: 1 | -1, n: number, mps: number): ReactNode => {
    const r = prng(hash(key));
    const dur = (x1 - x0) / mps;
    return Array.from({ length: n }, (_, i) => {
      const delay = (i / n) * dur + r() * (dur / n) * 0.6;
      const paint = CAR_PAINTS[Math.floor(r() * CAR_PAINTS.length)];
      const van = r() > 0.82;
      return (
        <g key={`${key}:${i}`} className="gv-car" style={{ "--x0": `${n2(dir > 0 ? x0 : x1)}px`, "--x1": `${n2(dir > 0 ? x1 : x0)}px`, "--dur": `${dur.toFixed(2)}s`, animationDelay: `${(-delay).toFixed(2)}s` } as CSSProperties}>
          <PlanCar at={[0, y]} heading={dir > 0 ? 90 : 270} paint={paint} van={van} lights={amb.night} />
        </g>
      );
    });
  };
  const eastSpeed = traffic.fendOff || traffic.closed.length || traffic.settingUp.length ? 11 : cw.flow === "heavy" ? 16 : 21;
  const perLane = cw.flow === "heavy" ? 4 : cw.flow === "light" ? 2 : 3;
  const queue: Pt[] = [];
  if (traffic.held) for (let l = 1; l <= cw.lanes; l++) for (let i = 0; i < 3; i++) queue.push([view.block.at[0] - flow * (7.5 + i * 6.8 + (l % 2) * 1.5), laneY(l)]);

  // ---- The frame: what the picture shows, and the metres per pixel -------------------------
  const wx = wrecks.map((w) => w.at[0]);
  const aspect = size.w / Math.max(1, size.h);
  const roadMid = (Math.min(eb.y, wb?.y ?? eb.y) + Math.max(eb.y + eb.h, wb ? wb.y + wb.h : eb.y + eb.h)) / 2;
  const wideH = Math.min(area.h, area.w / aspect);
  const boxes: Record<Frame, { x0: number; x1: number; y0: number; y1: number }> = {
    wide: { x0: area.x, x1: area.x + area.w, y0: Math.max(area.y, Math.min(area.y + area.h - wideH, roadMid - wideH / 2)), y1: 0 },
    work: view.focus,
    wreck: { x0: Math.min(...wx) - 9, x1: Math.max(...wx) + 9, y0: eb.y - (top ? 5 : 3), y1: eb.y + eb.h + (top ? 3 : 5) },
  };
  boxes.wide.y1 = boxes.wide.y0 + wideH;
  const fb = boxes[frame];
  const s = Math.min(size.w / (fb.x1 - fb.x0), size.h / (fb.y1 - fb.y0));
  const ox = size.w / 2 - ((fb.x0 + fb.x1) / 2) * s, oy = size.h / 2 - ((fb.y0 + fb.y1) / 2) * s;
  // People are half a metre across from above: at the wide framings they
  // are drawn larger than life so the crews still read as crews.
  const K = Math.max(1, Math.min(1.8, 26 / s));
  const scaled = (at: Pt, node: ReactNode) => (K === 1 ? node : <g transform={`translate(${P(at)}) scale(${n2(K)}) translate(${n2(-at[0])} ${n2(-at[1])})`}>{node}</g>);
  const plate = (at: Pt, dy: number, lines: { text: string; cls?: string }[]) => (
    <g transform={`translate(${n2(at[0])} ${n2(at[1] + dy)}) scale(${n2(1 / s)})`}>
      {lines.map((l, i) => <text key={i} className={`gv-plate${l.cls ? ` ${l.cls}` : ""}`} y={i * 11} textAnchor="middle">{l.text}</text>)}
    </g>
  );

  // ---- The light pools at night -------------------------------------------------------------
  const pools: { at: Pt; r: number }[] = [...units.map((u) => ({ at: u.at, r: 9 })), ...wrecks.map((w) => ({ at: w.at, r: 8 })), ...(conePts.length ? [{ at: conePts[Math.max(0, coneShown - 1)], r: 4 }] : [])];

  const running = active.filter((t) => t.kind === "crs_action" || t.kind === "rtc_extrication");
  const words = [
    `${units.length} unit${units.length === 1 ? "" : "s"} on scene`,
    running.length ? `${running.length} job${running.length === 1 ? "" : "s"} on the vehicles` : jobs.extricationState === "done" ? "casualty released" : "nothing on the vehicles yet",
    traffic.protected ? "road protected" : traffic.detail,
  ];

  return (
    <div ref={box} className={`gv-scene${amb.night ? " night" : ""}`}>
      <svg viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none" aria-label="The scene from above">
        <defs>
          <FigureDefs />
          <KitDefs />
          <GroundDefs />
          <WeatherDefs />
          <RtcDefs />
          <radialGradient id="gv-pool" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#000" /><stop offset="0.55" stopColor="#000" stopOpacity="0.8" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
          <mask id="gv-night" maskUnits="userSpaceOnUse" x={area.x - 20} y={area.y - 20} width={area.w + 40} height={area.h + 40}>
            <rect x={area.x - 20} y={area.y - 20} width={area.w + 40} height={area.h + 40} fill="#fff" />
            {pools.map((p, i) => <circle key={i} cx={p.at[0]} cy={p.at[1]} r={p.r} fill="url(#gv-pool)" />)}
          </mask>
          <linearGradient id="gv-deck" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#000" stopOpacity="0.35" /><stop offset="0.15" stopColor="#fff" stopOpacity="0.08" /><stop offset="0.85" stopColor="#fff" stopOpacity="0.08" /><stop offset="1" stopColor="#000" stopOpacity="0.4" /></linearGradient>
          {photo && photo.cover && <clipPath id="gv-cover">{photo.cover.map((c, i) => <rect key={i} x={c.x} y={area.y} width={c.w} height={area.h} />)}</clipPath>}
        </defs>
        <g className="gv-world" transform={`translate(${n2(ox)} ${n2(oy)}) scale(${s.toFixed(3)})`}>
          {photo ? (
            <g>
              {/* The place itself: the aerial photograph under everything, the verge's green beyond its edge. */}
              <rect x={area.x - 400} y={area.y - 400} width={area.w + 800} height={area.h + 800} fill="#2f4a2b" />
              <image href={photo.href} x={area.x} y={area.y} width={area.w} height={area.h} preserveAspectRatio="none" />
            </g>
          ) : (
            <g>
              {/* The verges beyond the road, the road itself. */}
              <rect x={area.x - 20} y={area.y - 20} width={area.w + 40} height={area.h + 40} fill="#2f4a2b" />
              {(() => { const r = prng(hash(incident.id)); return Array.from({ length: 70 }, (_, i) => <ellipse key={i} cx={vb.x - 20 + r() * (vb.width + 40)} cy={vb.y - 20 + r() * (vb.height + 40)} rx={2 + r() * 7} ry={0.8 + r() * 3} fill={r() > 0.5 ? "#3c5c33" : "#253e23"} opacity={0.6} />); })()}
              <rect x={vb.x - 20} y={vb.y - 20} width={vb.width + 40} height={vb.height + 40} fill="url(#pg-grass-wild)" opacity={0.25} />
              {roads.map((r, i) => {
                const sh = r.shape;
                const segs = Math.max(1, Math.ceil(sh.w / 30));
                return (
                  <g key={i}>
                    {Array.from({ length: segs }, (_, k) => <Tarmac key={k} x={sh.x + (k * sh.w) / segs} y={sh.y} w={sh.w / segs + 0.05} h={sh.h} seed={hash(`${r.label ?? r.kind}:${i}:${k}`)} />)}
                    {r.kind === "pavement" && <rect x={sh.x} y={sh.y} width={sh.w} height={sh.h} fill={/central/i.test(r.label ?? "") ? "#8c9196" : "#fff"} opacity={/central/i.test(r.label ?? "") ? 0.55 : 0.07} />}
                  </g>
                );
              })}
              {/* Markings: the lane lines, the edge lines, the rumble strip along the hard shoulder; the barrier down the central reservation and along the verges. */}
              {[eb, wb].filter((x): x is SceneRect => !!x).map((cwy, ci) => {
                const n = cw.lanes, h = cwy.h / n;
                return (
                  <g key={ci}>
                    {Array.from({ length: n - 1 }, (_, k) => <line key={k} x1={cwy.x} x2={cwy.x + cwy.w} y1={cwy.y + (k + 1) * h} y2={cwy.y + (k + 1) * h} stroke="#f2f2ee" strokeWidth={0.15} strokeDasharray="2 7" opacity={0.85} />)}
                    <line x1={cwy.x} x2={cwy.x + cwy.w} y1={cwy.y + 0.12} y2={cwy.y + 0.12} stroke="#f2f2ee" strokeWidth={0.2} opacity={0.9} />
                    <line x1={cwy.x} x2={cwy.x + cwy.w} y1={cwy.y + cwy.h - 0.12} y2={cwy.y + cwy.h - 0.12} stroke="#f2f2ee" strokeWidth={0.2} opacity={0.9} />
                    <line x1={cwy.x} x2={cwy.x + cwy.w} y1={cwy.y + (cwy === eb ? (top ? 0.12 : cwy.h - 0.12) : (top ? cwy.h - 0.12 : 0.12))} y2={cwy.y + (cwy === eb ? (top ? 0.12 : cwy.h - 0.12) : (top ? cwy.h - 0.12 : 0.12))} stroke="#000" strokeWidth={0.2} strokeDasharray="0.3 0.3" opacity={0.25} />
                  </g>
                );
              })}
              {roads.filter((r) => r.kind === "pavement").map((r, i) => {
                const sh = r.shape;
                const central = /central/i.test(r.label ?? "");
                const y = central ? sh.y + sh.h / 2 : top === (sh.y < eb.y) ? sh.y + 0.25 : sh.y + sh.h - 0.25;
                if (!central && !(top === (sh.y < eb.y))) return null;
                return (
                  <g key={i}>
                    <line x1={sh.x} x2={sh.x + sh.w} y1={y} y2={y} stroke="#6f7478" strokeWidth={0.32} />
                    <line x1={sh.x} x2={sh.x + sh.w} y1={y - 0.09} y2={y - 0.09} stroke="#c9ced2" strokeWidth={0.06} opacity={0.8} />
                    {Array.from({ length: Math.floor(sh.w / 4) }, (_, k) => <rect key={k} x={sh.x + 2 + k * 4} y={y - 0.2} width={0.14} height={0.4} fill="#4a4f53" />)}
                  </g>
                );
              })}
            </g>
          )}
          {/* The traffic: what is still running past in each lane, both ways, and the queue a block holds. */}
          {traffic.live.map((l) => stream(`live:${l}`, laneY(l), flow, perLane, eastSpeed))}
          {wb && Array.from({ length: cw.lanes }, (_, k) => stream(`wb:${k}`, wb.y + (k + 0.5) * (wb.h / cw.lanes), flow > 0 ? -1 : 1, perLane, 13 + k * 3.5))}
          {queue.map((q, i) => <PlanCar key={`q${i}`} at={q} heading={flow > 0 ? 90 : 270} paint={CAR_PAINTS[(i * 5) % CAR_PAINTS.length]} lights={amb.night} />)}
          {/* Stopped on the hard shoulder: the witness's car, the caller's lorry. */}
          {view.stopped.map((v, i) => v.kind === "artic" ? <PlanArtic key={i} at={v.at} heading={v.heading} /> : <PlanCar key={i} at={v.at} heading={v.heading} paint={v.paint ?? "#9aa4ad"} van={v.kind === "van"} />)}
          {/* The units, parked or put where their task has them. */}
          {units.map((u) => (
            <g key={u.r.appliance.id} className="gv-unit-move">
              <UnitSprite type={u.r.appliance.type} service={u.r.appliance.service} at={u.at} heading={u.heading} lights={u.lights} selected={u.r.appliance.id === selectedUnitId} commander={u.r.appliance.id === commanderApplianceId} unplaced={!u.placed} onClick={onSelectUnit ? () => onSelectUnit(u.r.appliance.id) : undefined} />
            </g>
          ))}
          {/* The cones: the fend-off's, the taper's as far as it has got. */}
          {fendCones.map((c, i) => <Cone key={`fc${i}`} x={c[0]} y={c[1]} />)}
          {conePts.slice(0, coneShown).map((c, i) => <Cone key={`tc${i}`} x={c[0]} y={c[1]} />)}
          {/* The wrecks: each as the stage draws it, turned the way it came to rest, its crews coming and going from their appliances. */}
          {wrecks.map((w, i) => {
            const v = w.vehicle!;
            const vCas = casualtiesOf(i);
            const seatCas = vCas.find((c) => c.trappedUntilExtricated) ?? vCas.find((c) => c.severity !== "walking") ?? null;
            const passenger = vCas.find((c) => c !== seatCas && c.severity !== "walking") ?? null;
            const walking = vCas.filter((c) => c !== seatCas && c !== passenger);
            walking.forEach((c) => seated.add(c.id));
            const trapped = !!seatCas?.trappedUntilExtricated && jobs.extricationState !== "done";
            const ext = jobs.extrication;
            return (
              <g key={v.id} transform={`translate(${P(w.at)}) rotate(${n2(headingRotate(w.heading))})`}>
                <RtcWreck
                  vehicle={v}
                  done={jobs.doneKeys(v)}
                  working={jobs.workingOn(v)}
                  finished={jobs.finishedOn(v, WALK_BACK_MS)}
                  casualty={seatCas ? { look: lookOf(seatCas), trapped } : null}
                  passenger={passenger ? { look: lookOf(passenger) } : null}
                  medics={seatCas ? medicsWith(seatCas.id) : []}
                  extrication={seatCas?.trappedUntilExtricated ? jobs.extricationState : "none"}
                  extricationCrew={ext?.assignedCrewIds.length}
                  extricationStartedAt={jobs.extricationState === "active" ? ext?.startedAt : undefined}
                  extricationPrev={jobs.extricationState === "active" && ext ? jobs.cameFrom(ext.applianceId, ext.startedAt) : undefined}
                  extricationApplianceId={ext?.applianceId}
                  night={amb.night}
                  rain={rain}
                  now={now}
                  tagScale={s}
                  tagRotate={headingRotate(w.heading)}
                  figureScale={K}
                  cones={false}
                  from={fromFor(w)}
                />
              </g>
            );
          })}
          {/* The people out of the cars: the walking wounded sat on the hard shoulder by their car, anyone found elsewhere on the scene where they are, a clinician kneeling with them once one has them. */}
          {[
            ...wrecks.flatMap((w, i) => casualtiesOf(i).filter((c) => seated.has(c.id)).map((c, k) => ({ c, at: [w.at[0] - flow * (2.4 + k * 1.3), hsMid + sideOut[1] * 0.35] as Pt }))),
            ...casualties.filter((c) => !attached.has(c.id)).map((c) => ({ c, at: [c.pos.x, c.pos.y] as Pt })),
          ].map(({ c, at }) => {
            const look = lookOf(c);
            const a = look.appearance;
            const seed = hash(`${c.id}:${a.ageYears}`);
            const sitting = c.severity === "walking";
            const r: Rig = rig({ heightM: a.heightM, sex: a.sex, child: a.child, elderly: a.elderly, pregnant: a.pregnant }, { pose: sitting ? "seated" : "lying", cue: "none", headTurn: 0 });
            const wear = wearOf(look, "road_urban", seed, !!rain);
            const medics = medicsWith(c.id);
            return (
              <g key={c.id}>
                {scaled(at, (
                  <g>
                    <g transform={`translate(${P(at)}) rotate(${top ? 0 : 180})`}>
                      <PlanFigure rig={r} w={wear} chestClass={look.breathing !== "none" ? "ps-chest breathe" : "ps-chest"} />
                    </g>
                    {medics.slice(0, 2).map((m, j) => {
                      const mAt: Pt = [at[0] + (j === 0 ? -0.75 : 0.75), at[1] + sideOut[1] * -0.25];
                      return <CrewTop key={j} at={mAt} facing={[j === 0 ? 1 : -1, 0]} hands={{ left: [at[0], at[1] + sideOut[1] * -0.15], right: [at[0] + (j === 0 ? -0.1 : 0.1), at[1] + sideOut[1] * -0.3] }} wear={crewWearOf("Ambulance", m.scope, hash(m.callsign) + j * 977, { jacket: true, role: "PARAMEDIC" })} />;
                    })}
                  </g>
                ))}
                {medics.length > 0 && plate([at[0], at[1]], sideOut[1] * -0.9 * K, [{ text: medics[0].callsign, cls: "tag" }])}
              </g>
            );
          })}
          {/* Everyone standing by: the crews at their appliances, the fend-off's, the officers on the cones. */}
          {standers.map((f, i) => {
            const cur = f.mover ? legAt(f.mover) : null;
            if (f.mover && cur) return <Walker key={`${i}:${cur.index}`} leg={cur.leg} since={cur.since} clip={f.mover.clip} scale={K} />;
            if (f.service === "Fire") return <g key={i}>{scaled(f.at, <ModelSprite id="firefighter_stand" at={f.at} a={deg(f.facing)} />)}</g>;
            return <g key={i}>{scaled(f.at, <CrewTop at={f.at} facing={f.facing} hands={f.hands ?? {}} kneeling={!!f.kneeling} style={{ animationDelay: `${((i * 1.3) % 4.4).toFixed(1)}s` }} wear={crewWearOf(f.service, f.scope, f.seed, { jacket: true, role: f.role ?? "" })} />)}</g>;
          })}
          {/* The overbridge, over everything under it: the photograph's own decks, or a drawn one. */}
          {photo && photo.cover && (
            <g clipPath="url(#gv-cover)">
              <image href={photo.href} x={area.x} y={area.y} width={area.w} height={area.h} preserveAspectRatio="none" />
            </g>
          )}
          {!photo && view.bridge && (
            <g>
              <rect x={view.bridge.x + 0.6} y={vb.y - 20} width={view.bridge.w} height={vb.height + 40} fill="#000" opacity={0.38} filter="url(#ps-blur-md)" />
              <rect x={view.bridge.x} y={vb.y - 20} width={view.bridge.w} height={vb.height + 40} fill="#8d9094" />
              <rect x={view.bridge.x} y={vb.y - 20} width={view.bridge.w} height={vb.height + 40} fill="url(#pg-concrete)" opacity={0.7} />
              <rect x={view.bridge.x} y={vb.y - 20} width={view.bridge.w} height={vb.height + 40} fill="url(#gv-deck)" />
              <rect x={view.bridge.x + 0.35} y={vb.y - 20} width={0.45} height={vb.height + 40} fill="#5d6166" />
              <rect x={view.bridge.x + view.bridge.w - 0.8} y={vb.y - 20} width={0.45} height={vb.height + 40} fill="#5d6166" />
              <line x1={view.bridge.x + view.bridge.w / 2} x2={view.bridge.x + view.bridge.w / 2} y1={vb.y - 20} y2={vb.y + vb.height + 20} stroke="#f2f2ee" strokeWidth={0.12} strokeDasharray="1 2" opacity={0.6} />
            </g>
          )}
          {/* Night, with the scene lighting and the units' own light pooling on the road. */}
          {amb.night && <rect x={area.x - 20} y={area.y - 20} width={area.w + 40} height={area.h + 40} fill="#071020" opacity={0.62} mask="url(#gv-night)" />}
          {/* The plates: who each unit is and what it is doing where it is. */}
          {units.map((u) => {
            const fp = unitFootprint(u.r.appliance.type, u.r.appliance.service);
            const lines = [{ text: u.r.appliance.callsign, cls: u.r.appliance.id === selectedUnitId ? "sel" : u.r.appliance.id === commanderApplianceId ? "ic" : undefined }, ...(u.role ? [{ text: u.role, cls: "sub" }] : [])];
            // On the verge side of the carriageway the plate goes above the unit, off the road.
            const ext = Math.max(fp.l, fp.w) / 2;
            const up = top ? u.at[1] < eb.y : u.at[1] > eb.y + eb.h;
            return <g key={`p${u.r.appliance.id}`}>{plate(u.at, up ? -(ext + 0.5) - ((lines.length - 1) * 11) / s : ext + 1.1, lines)}</g>;
          })}
          {frame !== "wreck" && view.stopped.map((v) => <g key={v.label}>{plate(v.at, 2.2, [{ text: v.label, cls: "sub" }])}</g>)}
          {frame === "wide" && (
            <g>
              {plate([area.x + 10, laneY(Math.ceil(cw.lanes / 2))], 0, [{ text: `${cw.upstream} →`, cls: "road" }])}
              {plate([area.x + area.w - 10, laneY(Math.ceil(cw.lanes / 2))], 0, [{ text: `→ ${cw.downstream}`, cls: "road" }])}
            </g>
          )}
        </g>
        {amb.rain && (
          <g className="ps-rain">
            {Array.from({ length: 70 }, (_, i) => <line key={i} x1={(i * 97) % size.w} y1={((i * 61) % size.h) - 20} x2={((i * 97) % size.w) + 3} y2={((i * 61) % size.h) - 4} />)}
          </g>
        )}
      </svg>
      <div className="gv-frames" role="group" aria-label="Framing">
        {(["wide", "work", "wreck"] as Frame[]).map((f) => (
          <button key={f} type="button" aria-pressed={frame === f} onClick={() => setFrame(f)}>{f === "wide" ? "Wide" : f === "work" ? "Scene" : "Wreck"}</button>
        ))}
      </div>
      <div className={`gv-caption ${traffic.level}`}>
        <b>{traffic.headline}</b>
        <span>{words.join(" · ")}</span>
      </div>
    </div>
  );
}
