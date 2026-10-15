"use client";

// THE SCENE FROM ABOVE, AS MARKS. The tablet's Ground page for a road
// traffic collision: the carriageway — over the junction's aerial
// photograph where the view has one — the traffic still running past,
// the units where they are parked or where a task has put them, the
// wrecks, the cones, and everyone on foot. People are dots in their
// service's colour with their role on them, the casualties dots in their
// triage colour, and the picture moves as the jobs move them: crews
// walking out to a wreck and back, officers along the cones as they are
// placed, clinicians sent to a casualty crossing the ground to them. A
// right-click on a casualty opens the menu that sends one.

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import type { Incident, LogEntry, Task, TaskKind, PatientTreatmentState } from "@/lib/sim/incident_types";
import type { IncidentSimState } from "@/lib/sim/incident_sim";
import type { ResusState } from "@/lib/sim/resus";
import { latLngToMetres, type SceneCasualty, type SceneRect } from "@/lib/sim/scene";
import { trafficState } from "@/lib/sim/traffic";
import { busyOn, crewSent } from "@/lib/sim/crew_assign";
import { walkMs as walkMsFor } from "@/lib/sim/crew_walk";
import type { ResolvedDeployment } from "../../components/incident-view";
import { assignRowsFor, casualtyShortLabel, CrewAssignMenu, type AssignCrewFn } from "../../components/crew-assign-menu";
import { P, len, sub, unit, lerp, type Pt } from "./plan-figure";
import { GroundDefs, WeatherDefs, Tarmac, prng, type Ambient } from "./plan-ground";
import { shellFor, legAt, headingRotate, WALK_MPS, type Mover, type Leg } from "./plan-rtc";
import { unitFootprint } from "./plan-vehicles";
import { hash } from "../patient-scene";
import { rtcJobs } from "../rtc-state";
import type { RtcGroundView, Placing } from "./ground-views";

const n2 = (v: number) => (Math.round(v * 1000) / 1000).toString();

/** How long a crew's walk back to the appliance is followed after a job ends. */
const WALK_BACK_MS = 40_000;
/** The paint on the traffic: the greys and silvers of a motorway, a few colours. */
const CAR_PAINTS = ["#9aa4ad", "#1f2a36", "#c3c9ce", "#5b6670", "#7b1e24", "#1d4f8c", "#d8d9d3", "#2f2f31", "#6d5c4a", "#e9e9e6", "#3f6b3a", "#8c3c1f"];
/** The services' colours, as the desk's map draws its crews. */
type Service = "Fire" | "Ambulance" | "Police";
const SERVICE: Record<Service, string> = { Fire: "#d7263d", Ambulance: "#1f9d55", Police: "#2563eb" };
/** A casualty's dot by triage: P1 red, P2 amber, P3 green. */
const triageColour = (severity: string) => (severity === "critical" ? "#ef4444" : severity === "serious" ? "#f5b324" : "#34d399");
const triageLabel = (severity: string) => (severity === "critical" ? "P1" : severity === "serious" ? "P2" : "P3");
/** What goes on a person's dot: FF, CM, PM, DR, PC … */
function initialsOf(role: string): string {
  const r = role.toLowerCase();
  if (/pilot/.test(r)) return "PLT";
  if (/doctor/.test(r)) return "DR";
  if (/critical care/.test(r)) return "CCP";
  if (/paramedic/.test(r)) return "PM";
  if (/technician|emt/.test(r)) return "EMT";
  if (/hart/.test(r)) return "HRT";
  if (/watch manager/.test(r)) return "WM";
  if (/crew manager/.test(r)) return "CM";
  if (/station manager/.test(r)) return "SM";
  if (/firefighter/.test(r)) return "FF";
  if (/sergeant/.test(r)) return "SGT";
  if (/inspector/.test(r)) return "INS";
  if (/officer|constable/.test(r)) return "PC";
  return role.split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 3).toUpperCase();
}
const serviceOf = (s: string): Service => (s === "Ambulance" || s === "Police" ? s : "Fire");

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
  /** Right-click on a casualty: send one of an ambulance crew to them. */
  onAssignCrewToCasualty?: AssignCrewFn;
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

/** Someone on foot: where they are or are going, and the walk under way if one is. */
type Person = { key: string; at: Pt; service: Service; label: string; mover?: Mover; sent?: boolean };

/** One leg of a walk, drawn at the moment `since` into it: the path is the
 *  element's own custom properties under the shared keyframe rule. */
function DotWalker({ leg, since, children }: { leg: Leg; since: number; children: ReactNode }) {
  return (
    <g className="ps-jog" style={{ "--jx0": `${n2(leg.from[0])}px`, "--jy0": `${n2(leg.from[1])}px`, "--jx1": `${n2(leg.to[0])}px`, "--jy1": `${n2(leg.to[1])}px`, "--jog-dur": `${Math.round(leg.ms)}ms`, animationDelay: `${-Math.round(since)}ms` } as CSSProperties}>
      {children}
    </g>
  );
}

/** A person: a dot in their service's colour, their role on it when there is room. */
function DotMark({ r, colour, label, s, ring }: { r: number; colour: string; label?: string; s: number; ring?: boolean }) {
  return (
    <g>
      {ring && <circle r={r + 0.26} fill="none" stroke="#ffe08a" strokeWidth={0.1} />}
      <circle r={r} fill={colour} stroke="#0b0f14" strokeWidth={r * 0.2} />
      <circle r={r} fill="none" stroke="#fff" strokeWidth={r * 0.14} opacity={0.9} />
      {label && <text className="gv-dot" transform={`scale(${n2(1 / s)})`} y={2.6}>{label}</text>}
    </g>
  );
}

/** A unit: its footprint in its service's colour, nose marked, the blues
 *  on when they are. Click to select it on the tablet. */
function UnitMark({ type, service, at, heading, lights, selected, commander, unplaced, onClick }: { type: string; service: string; at: Pt; heading: number; lights: string; selected: boolean; commander: boolean; unplaced: boolean; onClick?: () => void }) {
  const fp = unitFootprint(type, service);
  const colour = SERVICE[serviceOf(service)];
  const blues = lights !== "off" && lights !== "hazards";
  return (
    <g className={`gv-unit${unplaced ? " unplaced" : ""}`} transform={`translate(${P(at)}) rotate(${n2(heading)})`} onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}>
      {selected && <rect x={-fp.w / 2 - 0.4} y={-fp.l / 2 - 0.4} width={fp.w + 0.8} height={fp.l + 0.8} rx={0.5} fill="none" stroke="#7fd1ff" strokeWidth={0.16} strokeDasharray="0.5 0.3" />}
      <rect x={-fp.w / 2} y={-fp.l / 2} width={fp.w} height={fp.l} rx={0.35} fill={colour} fillOpacity={0.3} stroke={colour} strokeWidth={0.18} />
      <path d={`M ${n2(-fp.w / 2 + 0.3)} ${n2(-fp.l / 2 + 1)} L 0 ${n2(-fp.l / 2 + 0.2)} L ${n2(fp.w / 2 - 0.3)} ${n2(-fp.l / 2 + 1)}`} fill="none" stroke="#fff" strokeWidth={0.14} opacity={0.85} />
      {blues && <circle cy={-fp.l * 0.18} r={0.24} fill="#5ab4ff" className="gv-blues" />}
      {commander && <circle cy={fp.l / 2 - 0.7} r={0.3} fill="#ffe08a" stroke="#0b0f14" strokeWidth={0.06} />}
    </g>
  );
}

/** A vehicle in the traffic, or stopped: a plain shape, its cabin darker. */
function CarMark({ at, heading, paint, kind = "car", lights = false }: { at: Pt; heading: number; paint: string; kind?: "car" | "van" | "artic"; lights?: boolean }) {
  const L = kind === "artic" ? 16.5 : kind === "van" ? 5.6 : 4.4;
  const W = kind === "artic" ? 2.5 : kind === "van" ? 2.0 : 1.8;
  const cab: [number, number] = kind === "artic" ? [-L / 2 + 0.4, -L / 2 + 2.6] : kind === "van" ? [-L / 2 + 0.5, -L / 2 + 2.2] : [-L / 2 + 1.0, L / 2 - 1.4];
  return (
    <g transform={`translate(${P(at)}) rotate(${n2(heading)})`}>
      <rect x={-W / 2} y={-L / 2} width={W} height={L} rx={0.3} fill={paint} stroke="#0b0f14" strokeWidth={0.1} opacity={0.95} />
      <rect x={-W / 2 + 0.15} y={cab[0]} width={W - 0.3} height={cab[1] - cab[0]} rx={0.2} fill="#161a1f" opacity={0.75} />
      {lights && <rect x={-W / 2 + 0.2} y={-L / 2 - 0.1} width={W - 0.4} height={0.18} fill="#fff4c2" opacity={0.9} />}
    </g>
  );
}

/** A casualty: a dot in their triage colour, a bigger ring for the hand. */
function CasualtyMark({ r, severity, s, onMenu }: { r: number; severity: string; s: number; onMenu?: (e: ReactMouseEvent) => void }) {
  return (
    <g onContextMenu={onMenu} style={onMenu ? { cursor: "context-menu" } : undefined}>
      <circle r={r + 0.6} fill="#000" fillOpacity={0.001} />
      <circle r={r} fill={triageColour(severity)} stroke="#0b0f14" strokeWidth={r * 0.2} />
      <circle r={r} fill="none" stroke="#fff" strokeWidth={r * 0.14} opacity={0.9} />
      {r * s >= 7 && <text className="gv-dot dark" transform={`scale(${n2(1 / s)})`} y={2.6}>{triageLabel(severity)}</text>}
    </g>
  );
}

export function RtcGround({ view, incident, resolved, tasks, log, now, sim, hour, rain, selectedUnitId, onSelectUnit, commanderApplianceId, onAssignCrewToCasualty }: RtcGroundProps) {
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
  // The send-a-clinician menu a right-click on a casualty opens, where the click was.
  const [assignMenu, setAssignMenu] = useState<{ casualtyId: string; x: number; y: number } | null>(null);

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
  // The road is drawn crisp over a photograph — a photograph a few pixels
  // to the metre goes soft long before the close framings — right across
  // it, in its own tones, with the tapers and chevrons left to the image.
  const span = photo ? { x: area.x, w: area.w } : null;
  const tones = photo?.tones ?? null;
  const dashes = photo?.dashes ?? { mark: 2, gap: 7, phaseX: 0 };
  const dashPeriod = dashes.mark + dashes.gap;
  const dashOffset = (x0: number) => { const d = (dashes.phaseX - x0) % dashPeriod; return (dashPeriod - ((d + dashPeriod) % dashPeriod)) % dashPeriod; };
  const bandY0 = Math.min(...roads.map((r) => r.shape.y)), bandY1 = Math.max(...roads.map((r) => r.shape.y + r.shape.h));

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
  /** A point in a wreck's own frame — nose to -x, driver's side to -y — on the picture. */
  const toWorld = (w: Placing, l: Pt): Pt => {
    const th = (headingRotate(w.heading) * Math.PI) / 180;
    return [w.at[0] + l[0] * Math.cos(th) - l[1] * Math.sin(th), w.at[1] + l[0] * Math.sin(th) + l[1] * Math.cos(th)];
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
  /** The walk from one point to another at a crew's pace, where it has got to at `now`. */
  const walk = (from: Pt, to: Pt, t0: number, ms = Math.max(600, (len(sub(to, from)) / WALK_MPS) * 1000)): { mover?: Mover; at: Pt; done: boolean } => {
    const since = now - t0;
    if (since >= 0 && since < ms) return { mover: { legs: [{ from, to, ms }], since, clip: "firefighter_walk" }, at: to, done: false };
    return { at: since < 0 ? from : to, done: since >= ms };
  };

  // ---- The people: in the cars, on the hard shoulder, with the crews ---------------------
  const casualties: SceneCasualty[] = sim?.foundCasualties ?? scene.casualties ?? [];
  const near = (a: { x: number; y: number }, b: Pt) => Math.hypot(a.x - b[0], a.y - b[1]) < 2.6;
  const casualtiesOf = (i: number) => {
    const byPos = casualties.filter((c) => near(c.pos, wrecks[i].at));
    if (byPos.length) return byPos;
    return i === 0 ? casualties.filter((c) => c.trappedUntilExtricated) : [];
  };
  const attached = new Set(wrecks.flatMap((_, i) => casualtiesOf(i).map((c) => c.id)));
  const sideOut: Pt = top ? [0, -1] : [0, 1];
  // Where each casualty is: in their seat, sat on the hard shoulder by
  // their car, or where they were found — and where a clinician stands
  // with them: by the door, or either side of them on the ground.
  const casualtyAt = new Map<string, Pt>();
  const medicSpots = new Map<string, Pt[]>();
  // Two people in one car: their plates stack above the car's top seat rather than overprint.
  const plateRow = new Map<string, number>();
  const plateAt = new Map<string, Pt>();
  const trappedStill = (c: SceneCasualty) => !!c.trappedUntilExtricated && jobs.extricationState !== "done";
  wrecks.forEach((w, i) => {
    const sh = shellFor(w.vehicle!.body);
    const vCas = casualtiesOf(i);
    const seatCas = vCas.find((c) => c.trappedUntilExtricated) ?? vCas.find((c) => c.severity !== "walking") ?? null;
    const passenger = vCas.find((c) => c !== seatCas && c.severity !== "walking") ?? null;
    vCas.filter((c) => c !== seatCas && c !== passenger).forEach((c, k) => {
      const at: Pt = [w.at[0] - flow * (2.4 + k * 1.3), hsMid + sideOut[1] * 0.35];
      casualtyAt.set(c.id, at);
      medicSpots.set(c.id, [[at[0] - 0.85, at[1] + sideOut[1] * -0.3], [at[0] + 0.85, at[1] + sideOut[1] * -0.3], [at[0], at[1] + sideOut[1] * -1.0]]);
    });
    const seatOf = (side: 1 | -1): Pt => [sh.seat[0], sh.seat[1] * side];
    const byDoor = (side: 1 | -1): Pt[] => [0, -1.1, 1.1].map((dx) => toWorld(w, [sh.seat[0] + dx, (sh.W / 2 + 0.7) * (sh.seat[1] < 0 ? side : -side) * -1]));
    if (seatCas) { casualtyAt.set(seatCas.id, toWorld(w, seatOf(1))); medicSpots.set(seatCas.id, byDoor(1)); plateRow.set(seatCas.id, 0); }
    if (passenger) { casualtyAt.set(passenger.id, toWorld(w, seatOf(-1))); medicSpots.set(passenger.id, byDoor(-1)); plateRow.set(passenger.id, 1); }
    const seats = [seatCas, passenger].flatMap((c) => (c ? [casualtyAt.get(c.id)!] : []));
    if (seats.length) {
      const anchor: Pt = [seats.reduce((a, q) => a + q[0], 0) / seats.length, Math.min(...seats.map((q) => q[1]))];
      for (const c of [seatCas, passenger]) if (c) plateAt.set(c.id, anchor);
    }
  });
  for (const c of casualties) if (!attached.has(c.id)) {
    const at: Pt = [c.pos.x, c.pos.y];
    casualtyAt.set(c.id, at);
    medicSpots.set(c.id, [[at[0] - 0.85, at[1]], [at[0] + 0.85, at[1]], [at[0], at[1] - 0.85], [at[0], at[1] + 0.85]]);
  }

  // Who is away from their appliance: at a wreck, on the cones, with a casualty, walking back.
  const active = tasks.filter((t) => t.state === "active");
  const awayIds = new Set(active.filter((t) => t.kind === "crs_action" || t.kind === "rtc_extrication" || t.kind === "lane_closure" || t.kind === "fend_off").flatMap((t) => t.assignedCrewIds));
  const people: Person[] = [];

  // The clinicians sent to each casualty, in the order they were sent:
  // walking over from their vehicle, then at the spot by the patient.
  const sentAll = units
    .filter((u) => u.r.appliance.service === "Ambulance" && !u.r.deployment.hospitalLegStartedAt)
    .flatMap((u) => crewSent(u.r.deployment, u.r.appliance.crewMembers, busyOn(tasks, u.r.appliance.id)).map((s) => ({ ...s, u })))
    .sort((a, b) => a.since - b.since);
  const sentIds = new Set(sentAll.map((s) => s.member.id));
  const spotTaken = new Map<string, number>();
  const withCasualty = new Map<string, string[]>();
  for (const s of sentAll) {
    const target = casualtyAt.get(s.casualtyId);
    const spots = medicSpots.get(s.casualtyId) ?? [];
    if (!target || !spots.length) continue;
    const k = spotTaken.get(s.casualtyId) ?? 0;
    spotTaken.set(s.casualtyId, k + 1);
    const to = spots[Math.min(k, spots.length - 1)];
    const from = doorstep(s.u, to);
    const w = walk(from, to, s.since, walkMsFor(len(sub(to, from))));
    if (w.done) withCasualty.set(s.casualtyId, [...(withCasualty.get(s.casualtyId) ?? []), s.u.r.appliance.callsign]);
    people.push({ key: `tx:${s.u.r.appliance.id}:${s.member.id}`, at: w.at, mover: w.mover, service: "Ambulance", label: initialsOf(s.member.role), sent: true });
  }

  // The crews on the wrecks: each job's crew at spots round the shell,
  // walking out from their appliance when the job started, walking back
  // when it ended; the extrication crew on the remaining spots.
  const walkingBack = new Map<string, number>();
  wrecks.forEach((w, wi) => {
    const v = w.vehicle!;
    const sh = shellFor(v.body);
    const o = 0.8;
    const ringLocal: Pt[] = [[-sh.L / 2 - o, 0], [sh.L / 2 + o, 0], [-sh.L / 4, -(sh.W / 2 + o)], [-sh.L / 4, sh.W / 2 + o], [sh.L / 4, -(sh.W / 2 + o)], [sh.L / 4, sh.W / 2 + o], [0, -(sh.W / 2 + o + 1.0)], [0, sh.W / 2 + o + 1.0], [-sh.L / 2 - o - 1.0, 0.9], [sh.L / 2 + o + 1.0, -0.9]];
    const ring = ringLocal.map((l) => toWorld(w, l));
    let next = 0;
    const spot = () => ring[next++ % ring.length];
    const spotFor = (key: string, i: number) => ring[(hash(key) + i) % ring.length];
    const fromOf = (applianceId: string | undefined, to: Pt): Pt | null => {
      const u = applianceId ? unitById.get(applianceId) : undefined;
      return u ? doorstep(u, to) : null;
    };
    for (const job of jobs.workingOn(v)) {
      for (let i = 0; i < Math.max(1, job.crew); i++) {
        const to = spot();
        const from = job.startedAt !== undefined ? fromOf(job.applianceId, to) : null;
        const u: { at: Pt; mover?: Mover } = from ? walk(from, to, job.startedAt!) : { at: to };
        people.push({ key: `job:${wi}:${job.key}:${i}`, at: u.at, mover: u.mover, service: "Fire", label: "FF" });
      }
    }
    if (jobs.extricationState === "active" && jobs.extrication) {
      const ext = jobs.extrication;
      const n = Math.max(2, Math.min(4, ext.assignedCrewIds.length || 4));
      for (let i = 0; i < n; i++) {
        const to = spot();
        const from = fromOf(ext.applianceId, to);
        const u: { at: Pt; mover?: Mover } = from ? walk(from, to, ext.startedAt) : { at: to };
        people.push({ key: `ext:${wi}:${i}`, at: u.at, mover: u.mover, service: "Fire", label: "FF" });
      }
    }
    for (const f of jobs.finishedOn(v, WALK_BACK_MS)) {
      for (let i = 0; i < Math.max(1, f.crew); i++) {
        const from = spotFor(f.key, i);
        const home = fromOf(f.applianceId, from);
        if (!home) continue;
        const u = walk(from, home, f.endedAt);
        if (!u.mover) continue;
        people.push({ key: `back:${wi}:${f.key}:${i}`, at: u.at, mover: u.mover, service: "Fire", label: "FF" });
        if (f.applianceId) walkingBack.set(f.applianceId, (walkingBack.get(f.applianceId) ?? 0) + 1);
      }
    }
  });

  // Everyone standing by their appliance: not away at a job, not sent to
  // a casualty, not walking back, not in the car on a rolling block —
  // along the side nearer the wreck, a step apart.
  const wreckCentre: Pt = wrecks.length ? [wrecks.reduce((a, w) => a + w.at[0], 0) / wrecks.length, wrecks.reduce((a, w) => a + w.at[1], 0) / wrecks.length] : [0, 0];
  for (const u of units) {
    const a = u.r.appliance;
    const service = serviceOf(a.service);
    const inCar = tasks.some((t) => t.kind === "rolling_road_block" && t.applianceId === a.id && live(t)) ? 1 : 0;
    const members = a.crewMembers.filter((m) => !awayIds.has(m.id) && !sentIds.has(m.id)).slice((walkingBack.get(a.id) ?? 0) + inCar);
    const n = Math.min(members.length, 5);
    if (n <= 0) continue;
    const fp = unitFootprint(a.type, a.service);
    const axis = dirOf(u.heading);
    const across: Pt = [-axis[1], axis[0]];
    const toWreck = sub(wreckCentre, u.at);
    const side = toWreck[0] * across[0] + toWreck[1] * across[1] >= 0 ? 1 : -1;
    for (let i = 0; i < n; i++) {
      const along = -fp.l * 0.3 + (i * (fp.l * 0.6)) / Math.max(1, n - 1);
      const at: Pt = [u.at[0] + axis[0] * along + across[0] * side * (fp.w / 2 + 0.7), u.at[1] + axis[1] * along + across[1] * side * (fp.w / 2 + 0.7)];
      people.push({ key: `by:${a.id}:${members[i].id}`, at, service, label: initialsOf(members[i].role) });
    }
  }
  // The fend-off crew member at the back of the appliance with the cones; the officers on the taper.
  const fendUnit = units.find((u) => tasks.some((t) => t.kind === "fend_off" && t.applianceId === u.r.appliance.id && live(t)));
  const fendCones: Pt[] = [];
  if (fendUnit && traffic.fendOff) {
    const fp = unitFootprint(fendUnit.r.appliance.type, fendUnit.r.appliance.service);
    const axis = dirOf(fendUnit.heading);
    const rear: Pt = [fendUnit.at[0] - axis[0] * (fp.l / 2 + 1.0), fendUnit.at[1] - axis[1] * (fp.l / 2 + 1.0)];
    const service = serviceOf(fendUnit.r.appliance.service);
    people.push({ key: `fend:${fendUnit.r.appliance.id}`, at: rear, service, label: service === "Police" ? "PC" : "FF" });
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
      people.push({ key: `cones:${t.id}:${j}:${i}`, at: [p[0] + flow * 0.9, p[1] + (top ? 0.9 : -0.9) * (1 + i * 0.3)], service: "Police", label: "PC" });
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
          <CarMark at={[0, y]} heading={dir > 0 ? 90 : 270} paint={paint} kind={van ? "van" : "car"} lights={amb.night} />
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
  // A person is half a metre across: at the wide framings the dots are
  // drawn larger than life so the crews still read, and the roles go on
  // them once there is room.
  const dotR = Math.max(0.42, 3.5 / s);
  const casR = Math.max(0.38, 3.2 / s);
  const showRoles = dotR * s >= 7;
  const showTags = s >= 12;
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

  // ---- The hand: a right-click on a casualty sends a clinician ----------------------------
  const casualtyLabel = (id: string) => casualties.find((c) => c.id === id)?.label ?? id;
  const casualtyShort = (id: string) => casualtyShortLabel(casualties.find((c) => c.id === id)?.label, id);
  const openMenu = onAssignCrewToCasualty
    ? (casualtyId: string) => (e: ReactMouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const r = box.current?.getBoundingClientRect();
        setAssignMenu({ casualtyId, x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) });
      }
    : null;
  const stageOf = (c: SceneCasualty): string => {
    if (trappedStill(c)) return "trapped";
    const st = sim?.casualtyProgression?.[c.id]?.stage;
    return st ? st.replace(/_/g, " ") : "";
  };

  const drawPerson = (p: Person) => {
    const cur = p.mover ? legAt(p.mover) : null;
    const mark = <DotMark r={dotR} colour={SERVICE[p.service]} label={showRoles ? p.label : undefined} s={s} ring={p.sent} />;
    if (p.mover && cur) return <DotWalker key={`${p.key}:${cur.index}`} leg={cur.leg} since={cur.since}>{mark}</DotWalker>;
    return <g key={p.key} transform={`translate(${P(p.at)})`}>{mark}</g>;
  };

  return (
    <div ref={box} className={`gv-scene${amb.night ? " night" : ""}`}>
      <svg viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none" aria-label="The scene from above">
        <defs>
          <GroundDefs />
          <WeatherDefs />
          <radialGradient id="gv-pool" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#000" /><stop offset="0.55" stopColor="#000" stopOpacity="0.8" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
          <mask id="gv-night" maskUnits="userSpaceOnUse" x={area.x - 20} y={area.y - 20} width={area.w + 40} height={area.h + 40}>
            <rect x={area.x - 20} y={area.y - 20} width={area.w + 40} height={area.h + 40} fill="#fff" />
            {pools.map((p, i) => <circle key={i} cx={p.at[0]} cy={p.at[1]} r={p.r} fill="url(#gv-pool)" />)}
          </mask>
          <linearGradient id="gv-deck" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#000" stopOpacity="0.35" /><stop offset="0.15" stopColor="#fff" stopOpacity="0.08" /><stop offset="0.85" stopColor="#fff" stopOpacity="0.08" /><stop offset="1" stopColor="#000" stopOpacity="0.4" /></linearGradient>
          {photo && photo.cover && <clipPath id="gv-cover">{photo.cover.map((c, i) => <rect key={i} x={c.x} y={area.y} width={c.w} height={area.h} />)}</clipPath>}
          {photo && (photo.keep ?? []).map((k, i) => (
            <linearGradient key={i} id={`gv-keep-${i}`} gradientUnits="userSpaceOnUse" x1={k.x0} y1={0} x2={k.x1} y2={0}>
              <stop offset="0" stopColor={k.fadeIn ? "#fff" : "#000"} />
              <stop offset={Math.min(0.5, (k.fadeIn ?? 0) / Math.max(1, k.x1 - k.x0))} stopColor="#000" />
              <stop offset={Math.max(0.5, 1 - (k.fadeOut ?? 0) / Math.max(1, k.x1 - k.x0))} stopColor="#000" />
              <stop offset="1" stopColor={k.fadeOut ? "#fff" : "#000"} />
            </linearGradient>
          ))}
          {photo && (
            <mask id="gv-road-mask" maskUnits="userSpaceOnUse" x={area.x - 20} y={area.y - 20} width={area.w + 40} height={area.h + 40}>
              <rect x={area.x - 20} y={bandY0} width={area.w + 40} height={bandY1 - bandY0} fill="#fff" />
              {(photo.keep ?? []).map((k, i) => <rect key={i} x={k.x0} y={k.y0} width={k.x1 - k.x0} height={k.y1 - k.y0} fill={`url(#gv-keep-${i})`} />)}
            </mask>
          )}
        </defs>
        <g className="gv-world" transform={`translate(${n2(ox)} ${n2(oy)}) scale(${s.toFixed(3)})`}>
          {photo && (
            <g>
              {/* The place itself: the aerial photograph under everything, the verge's green beyond its edge. */}
              <rect x={area.x - 400} y={area.y - 400} width={area.w + 800} height={area.h + 800} fill="#2f4a2b" />
              <image href={photo.href} x={area.x} y={area.y} width={area.w} height={area.h} preserveAspectRatio="none" />
            </g>
          )}
          <g mask={photo ? "url(#gv-road-mask)" : undefined}>
            <g>
              {/* The verges beyond the road, the road itself. */}
              {!photo && <rect x={area.x - 20} y={area.y - 20} width={area.w + 40} height={area.h + 40} fill="#2f4a2b" />}
              {!photo && (() => { const r = prng(hash(incident.id)); return Array.from({ length: 70 }, (_, i) => <ellipse key={i} cx={vb.x - 20 + r() * (vb.width + 40)} cy={vb.y - 20 + r() * (vb.height + 40)} rx={2 + r() * 7} ry={0.8 + r() * 3} fill={r() > 0.5 ? "#3c5c33" : "#253e23"} opacity={0.6} />); })()}
              {!photo && <rect x={vb.x - 20} y={vb.y - 20} width={vb.width + 40} height={vb.height + 40} fill="url(#pg-grass-wild)" opacity={0.25} />}
              {roads.map((r, i) => {
                const sh = { ...r.shape, x: span?.x ?? r.shape.x, w: span?.w ?? r.shape.w };
                const central = /central/i.test(r.label ?? "");
                const shoulder = r.kind === "pavement" && !central;
                const segs = Math.max(1, Math.ceil(sh.w / 30));
                return (
                  <g key={i}>
                    {Array.from({ length: segs }, (_, k) => <Tarmac key={k} x={sh.x + (k * sh.w) / segs} y={sh.y} w={sh.w / segs + 0.05} h={sh.h} seed={hash(`${r.label ?? r.kind}:${i}:${k}`)} tint={tones?.road} />)}
                    {shoulder && <rect x={sh.x} y={sh.y} width={sh.w} height={sh.h} fill={tones?.shoulder ?? "#fff"} opacity={tones ? 0.82 : 0.07} />}
                    {central && <rect x={sh.x} y={sh.y} width={sh.w} height={sh.h} fill={tones?.reservation ?? "#8c9196"} opacity={tones ? 0.9 : 0.55} />}
                    {central && tones && <rect x={sh.x} y={sh.y} width={sh.w} height={sh.h} fill="url(#pg-concrete)" opacity={0.35} />}
                  </g>
                );
              })}
              {/* Markings: the lane lines, the edge lines, the rumble strip along the hard shoulder; the barrier down the central reservation and along the verges. */}
              {[eb, wb].filter((x): x is SceneRect => !!x).map((cwy0, ci) => {
                const cwy = { ...cwy0, x: span?.x ?? cwy0.x, w: span?.w ?? cwy0.w };
                const n = cw.lanes, h = cwy.h / n;
                return (
                  <g key={ci}>
                    {Array.from({ length: n - 1 }, (_, k) => <line key={k} x1={cwy.x} x2={cwy.x + cwy.w} y1={cwy.y + (k + 1) * h} y2={cwy.y + (k + 1) * h} stroke="#f2f2ee" strokeWidth={0.2} strokeDasharray={`${dashes.mark} ${dashes.gap}`} strokeDashoffset={dashOffset(cwy.x)} opacity={0.92} />)}
                    <line x1={cwy.x} x2={cwy.x + cwy.w} y1={cwy.y + 0.12} y2={cwy.y + 0.12} stroke="#f2f2ee" strokeWidth={0.2} opacity={0.9} />
                    <line x1={cwy.x} x2={cwy.x + cwy.w} y1={cwy.y + cwy.h - 0.12} y2={cwy.y + cwy.h - 0.12} stroke="#f2f2ee" strokeWidth={0.2} opacity={0.9} />
                    <line x1={cwy.x} x2={cwy.x + cwy.w} y1={cwy.y + (cwy0 === eb ? (top ? 0.12 : cwy.h - 0.12) : (top ? cwy.h - 0.12 : 0.12))} y2={cwy.y + (cwy0 === eb ? (top ? 0.12 : cwy.h - 0.12) : (top ? cwy.h - 0.12 : 0.12))} stroke="#000" strokeWidth={0.2} strokeDasharray="0.3 0.3" opacity={0.25} />
                  </g>
                );
              })}
              {roads.filter((r) => r.kind === "pavement").map((r, i) => {
                const sh = { ...r.shape, x: span?.x ?? r.shape.x, w: span?.w ?? r.shape.w };
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
          </g>
          {/* The traffic: what is still running past in each lane, both ways, and the queue a block holds. */}
          {traffic.live.map((l) => stream(`live:${l}`, laneY(l), flow, perLane, eastSpeed))}
          {wb && Array.from({ length: cw.lanes }, (_, k) => stream(`wb:${k}`, wb.y + (k + 0.5) * (wb.h / cw.lanes), flow > 0 ? -1 : 1, perLane, 13 + k * 3.5))}
          {queue.map((q, i) => <CarMark key={`q${i}`} at={q} heading={flow > 0 ? 90 : 270} paint={CAR_PAINTS[(i * 5) % CAR_PAINTS.length]} lights={amb.night} />)}
          {/* Stopped on the hard shoulder: the witness's car, the caller's lorry. */}
          {view.stopped.map((v, i) => <CarMark key={i} at={v.at} heading={v.heading} paint={v.paint ?? (v.kind === "artic" ? "#e8e9ea" : "#9aa4ad")} kind={v.kind} />)}
          {/* The units, parked or put where their task has them. */}
          {units.map((u) => (
            <UnitMark key={u.r.appliance.id} type={u.r.appliance.type} service={u.r.appliance.service} at={u.at} heading={u.heading} lights={u.lights} selected={u.r.appliance.id === selectedUnitId} commander={u.r.appliance.id === commanderApplianceId} unplaced={!u.placed} onClick={onSelectUnit ? () => onSelectUnit(u.r.appliance.id) : undefined} />
          ))}
          {/* The cones: the fend-off's, the taper's as far as it has got. */}
          {[...fendCones, ...conePts.slice(0, coneShown)].map((c, i) => <circle key={`c${i}`} cx={c[0]} cy={c[1]} r={0.26} fill="#ff7a1a" stroke="#fff" strokeWidth={0.07} />)}
          {/* The wrecks: each shell turned the way it came to rest, what has been done to it on its plate. */}
          {wrecks.map((w, i) => {
            const v = w.vehicle!;
            const sh = shellFor(v.body);
            const done = [...jobs.doneKeys(v)].length;
            const working = jobs.workingOn(v).map((j) => j.key.replace(/^std-/, "").replace(/-/g, " "));
            const lines = [{ text: v.body === "van" ? "VAN" : "CAR", cls: "tag" }, ...(working.length ? [{ text: working.join(" · "), cls: "sub" }] : done ? [{ text: `${done} job${done === 1 ? "" : "s"} done`, cls: "sub" }] : [])];
            return (
              <g key={v.id}>
                <g transform={`translate(${P(w.at)}) rotate(${n2(headingRotate(w.heading))})`}>
                  <rect x={-sh.L / 2} y={-sh.W / 2} width={sh.L} height={sh.W} rx={0.3} fill="#3a3f45" stroke="#c9ced2" strokeWidth={0.14} />
                  <rect x={sh.cabin[0]} y={-sh.W / 2 + 0.15} width={sh.cabin[1] - sh.cabin[0]} height={sh.W - 0.3} rx={0.15} fill="#1c2026" opacity={0.85} />
                  {jobs.extricationState === "active" && <rect x={-sh.L / 2 - 0.3} y={-sh.W / 2 - 0.3} width={sh.L + 0.6} height={sh.W + 0.6} rx={0.4} fill="none" stroke="#ffe08a" strokeWidth={0.1} strokeDasharray="0.5 0.3" />}
                </g>
                {showTags && plate(w.at, sh.W / 2 + 2.3, lines)}
                {i === 0 && !showTags && plate(w.at, sh.W / 2 + 1.6, [{ text: "RTC", cls: "tag" }])}
              </g>
            );
          })}
          {/* The casualties: in their seats, sat on the hard shoulder, or where they were found — each in their triage colour, labelled, with a right-click to send a clinician. */}
          {casualties.map((c) => {
            const at = casualtyAt.get(c.id);
            if (!at) return null;
            const severity = sim?.casualtyProgression?.[c.id]?.severity ?? c.severity;
            const stage = stageOf(c);
            const here = withCasualty.get(c.id) ?? [];
            const lines = [{ text: casualtyShortLabel(c.label, c.id) }, ...(stage ? [{ text: here.length ? `${stage} · ${[...new Set(here)].join(", ")}` : stage, cls: "sub" }] : [])];
            const row = plateRow.get(c.id) ?? 0;
            return (
              <g key={c.id}>
                <g transform={`translate(${P(at)})`}>
                  <CasualtyMark r={casR} severity={severity} s={s} onMenu={openMenu ? openMenu(c.id) : undefined} />
                </g>
                {showTags && plate(plateAt.get(c.id) ?? at, -(casR + 4 / s) - ((lines.length - 1) * 11) / s - (row * (lines.length * 11 + 8)) / s, lines)}
              </g>
            );
          })}
          {/* Everyone on foot: by their appliances, on the wrecks, on the cones, with the casualties, and walking between. */}
          {people.map(drawPerson)}
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
      {assignMenu && onAssignCrewToCasualty && (
        <CrewAssignMenu
          casualty={{ id: assignMenu.casualtyId, label: casualtyLabel(assignMenu.casualtyId) }}
          rows={assignRowsFor(onScene.map((r) => ({ deployment: r.deployment, appliance: r.appliance })), tasks, assignMenu.casualtyId, casualtyShort)}
          x={assignMenu.x}
          y={assignMenu.y}
          host={size}
          onAssign={onAssignCrewToCasualty}
          onClose={() => setAssignMenu(null)}
        />
      )}
    </div>
  );
}
