"use client";

// THE CRASH, FROM ABOVE. A car (or a van) on the carriageway, nose to
// the left, drawn as a cutaway so the person in the driver's seat is
// never hidden by the roof: the shell, the glass, the seats, the dash
// over their legs. Round it, what the crew have done to it — step blocks
// under the sills, the screen filmed and the side glass out, the doors
// off and lying on the tarmac, the B-pillar out, the roof flapped back
// or lifted clear, the dash rolled off the pedal box with the ram
// footed at the A-pillar — and the firefighters at whichever job is
// running now, the ambulance crew with the casualty, the hydraulic kit
// on its mat, the fuel on the road and the foam that covers it. Night
// darkens it to the working lights; rain wets it.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { CrsVehicle, CrsComponent } from "@/lib/sim/incident_types";
import type { PatientLook } from "@/lib/sim/patient_look";
import { rig, PlanFigure, FigureDefs, darken, smooth, capsule, line, lineSoft, edge, type Pt, type Rig } from "./plan-figure";
import { KitDefs, KitBag } from "./plan-kit";
import { CrewTop, crewWearOf, crewHeadAt } from "./plan-crew";
import { GroundDefs, Weather, WeatherDefs, type Ambient } from "./plan-ground";
import { wearOf, hash, type SceneCrew } from "../patient-scene";

const SOFT = { vectorEffect: "non-scaling-stroke" as const };
const n2 = (v: number) => (Math.round(v * 1000) / 1000).toString();

/** What is running on the vehicle now, and how many pairs of hands are on it. */
export type RtcWork = { key: string; crew: number };

export type RtcSceneProps = {
  vehicle: CrsVehicle;
  /** Action ids completed on this vehicle, the `std-` prefix stripped: "stabilise", "glass", "doors-off", "third-door", "roof-flap", "roof-off", "dash-roll", and the datasheet's own ("isolate-12v", "contain-fuel"…). */
  done: ReadonlySet<string>;
  working: RtcWork[];
  /** The person in the driver's seat. */
  casualty?: { look: PatientLook; trapped: boolean } | null;
  /** Ambulance crew with the casualty. */
  medics: SceneCrew[];
  extrication: "none" | "active" | "done";
  extricationCrew?: number;
  hour?: number;
  rain?: boolean;
  /** Draw the datasheet's safety-critical components on the shell. */
  components?: boolean;
  caption?: string;
  words?: string[];
};

const H = 360;
const STRIP = (id: string) => id.replace(/^std-/, "");

type Shell = {
  L: number; W: number; van: boolean;
  /** The glasshouse along x: windscreen base to rear screen top. */
  cabin: [number, number];
  roof: [number, number];
  frontDoor: [number, number];
  rearDoor: [number, number] | null;
  seat: Pt;
  wheels: number[];
  dash: [number, number];
};

function shellOf(v: CrsVehicle): Shell {
  if (v.body === "van") {
    return { L: 5.6, W: 2.0, van: true, cabin: [-2.3, -1.05], roof: [-1.95, -1.1], frontDoor: [-2.0, -1.05], rearDoor: null, seat: [-1.5, -0.52], wheels: [-1.75, 1.65], dash: [-2.3, -2.0] };
  }
  return { L: 4.4, W: 1.78, van: false, cabin: [-1.0, 1.3], roof: [-0.45, 0.95], frontDoor: [-0.8, 0.25], rearDoor: [0.25, 1.1], seat: [0.0, -0.42], wheels: [-1.35, 1.35], dash: [-1.0, -0.62], };
}

/** Where a schematic component sits on the shell: the datasheet is nose-up with the driver's side on its right; here the nose is left and the driver's side the top. */
function onShell(c: CrsComponent, sh: Shell): { x: number; y: number; w: number; h: number } {
  const x = (c.y / 200 - 0.5) * sh.L;
  const y = -((c.x / 100) - 0.5) * sh.W;
  const w = ((c.h ?? 8) / 200) * sh.L;
  const h = ((c.w ?? 8) / 100) * sh.W;
  return { x, y, w, h };
}

const PAINT: Record<string, string> = { car: "#6b7a8c", van: "#dfe3e6" };

/** The body shell in plan: bonnet, cabin, boot, with the crumple at the nose. */
function bodyPath(sh: Shell, crumpled: boolean): string {
  const { L, W } = sh;
  const nose = -L / 2, tail = L / 2, hw = W / 2;
  if (sh.van) {
    return smooth([[nose + 0.1, -hw + 0.25], [nose + 0.5, -hw + 0.02], [sh.cabin[1] - 0.1, -hw], [tail - 0.1, -hw], [tail, -hw + 0.2], [tail, hw - 0.2], [tail - 0.1, hw], [sh.cabin[1] - 0.1, hw], [nose + 0.5, hw - 0.02], [nose + 0.1, hw - 0.25], [nose + (crumpled ? 0.25 : 0.02), hw * 0.4], [nose + (crumpled ? 0.12 : 0), 0], [nose + (crumpled ? 0.22 : 0.02), -hw * 0.4]], 0.35);
  }
  return smooth([
    [nose + 0.12, -hw + 0.3], [nose + 0.6, -hw + 0.06], [sh.cabin[0] + 0.2, -hw], [sh.cabin[1] - 0.2, -hw], [tail - 0.35, -hw + 0.05], [tail - 0.05, -hw + 0.3],
    [tail, 0], [tail - 0.05, hw - 0.3], [tail - 0.35, hw - 0.05], [sh.cabin[1] - 0.2, hw], [sh.cabin[0] + 0.2, hw], [nose + 0.6, hw - 0.06], [nose + 0.12, hw - 0.3],
    [nose + (crumpled ? 0.3 : 0.02), hw * 0.45], [nose + (crumpled ? 0.14 : 0), 0], [nose + (crumpled ? 0.26 : 0.02), -hw * 0.45],
  ], 0.4);
}

function StepBlock({ x, y, side }: { x: number; y: number; side: 1 | -1 }) {
  // Three steps of a yellow block pushed under the sill, the top step nearest the car.
  return (
    <g>
      {[0, 1, 2].map((i) => <rect key={i} x={x - 0.16 + i * 0.03} y={side > 0 ? y + i * 0.07 : y - 0.07 - i * 0.07} width={0.32 - i * 0.06} height={0.07} fill={i === 0 ? "#e7b31a" : "#c9980f"} {...edge("#e7b31a", 0.5, 0.7, 0.8)} />)}
    </g>
  );
}

function Ram({ from, to }: { from: Pt; to: Pt }) {
  return (
    <g>
      <path d={capsule(from, to, 0.05, 0.05)} fill="#f2c230" {...line} />
      <path d={capsule(from, to, 0.05, 0.05)} fill="url(#ps-round-v)" opacity={0.6} />
      <path d={capsule(from, [from[0] + (to[0] - from[0]) * 0.45, from[1] + (to[1] - from[1]) * 0.45], 0.065, 0.065)} fill="#2b3139" {...lineSoft} />
    </g>
  );
}

/** The hydraulic kit on its mat: cutters, spreaders, the pump and its hoses. */
function ToolMat({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={1.5} height={0.9} rx={0.03} fill="#2a2f36" {...lineSoft} />
      <rect x={x + 0.03} y={y + 0.03} width={1.44} height={0.84} fill="url(#ps-mesh)" />
      {/* Cutters: two curved blades on a body. */}
      <g transform={`translate(${n2(x + 0.3)} ${n2(y + 0.28)}) rotate(-8)`}>
        <rect x={0} y={-0.07} width={0.46} height={0.14} rx={0.03} fill="#c0392b" {...line} />
        <path d="M0.44 -0.07 q0.16 -0.06 0.24 0.03 q-0.1 -0.02 -0.2 0.06 z" fill="#8a9399" {...line} />
        <path d="M0.44 0.07 q0.16 0.06 0.24 -0.03 q-0.1 0.02 -0.2 -0.06 z" fill="#8a9399" {...line} />
        <rect x={0.08} y={-0.12} width={0.1} height={0.24} rx={0.02} fill="#1b1f24" />
      </g>
      {/* Spreaders: a body with two long arms. */}
      <g transform={`translate(${n2(x + 0.25)} ${n2(y + 0.62)}) rotate(5)`}>
        <rect x={0} y={-0.06} width={0.5} height={0.12} rx={0.03} fill="#e67e22" {...line} />
        <path d="M0.48 -0.05 l0.42 -0.06 l0.02 0.04 l-0.4 0.08 z" fill="#8a9399" {...line} />
        <path d="M0.48 0.05 l0.42 0.06 l-0.02 -0.04 l-0.4 -0.08 z" fill="#8a9399" {...line} />
        <rect x={0.1} y={-0.1} width={0.08} height={0.2} rx={0.02} fill="#1b1f24" />
      </g>
      {/* The power unit, hoses coiled beside it. */}
      <rect x={x + 1.08} y={y + 0.12} width={0.34} height={0.42} rx={0.04} fill="#2f6f3a" {...line} />
      <rect x={x + 1.14} y={y + 0.18} width={0.22} height={0.1} rx={0.02} fill="#1b1f24" />
      <circle cx={x + 1.25} cy={y + 0.42} r={0.06} fill="#c0392b" {...lineSoft} />
      <path d={`M${n2(x + 1.1)} ${n2(y + 0.7)} c-0.1 -0.1 -0.2 0.1 -0.3 0 c-0.1 -0.1 -0.2 0.1 -0.3 0 c-0.1 -0.1 -0.2 0.1 -0.3 0`} fill="none" stroke="#c0392b" strokeWidth={0.03} strokeLinecap="round" />
      <path d={`M${n2(x + 1.1)} ${n2(y + 0.78)} c-0.1 -0.1 -0.2 0.1 -0.3 0 c-0.1 -0.1 -0.2 0.1 -0.3 0 c-0.1 -0.1 -0.2 0.1 -0.3 0`} fill="none" stroke="#2b5fb5" strokeWidth={0.03} strokeLinecap="round" />
    </g>
  );
}

function Longboard({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={1.85} height={0.46} rx={0.12} fill="#e8731f" {...line} />
      <rect x={x} y={y} width={1.85} height={0.46} rx={0.12} fill="url(#ps-round-v)" opacity={0.5} />
      {[0.2, 0.55, 0.9, 1.25, 1.6].map((dx) => <g key={dx}><rect x={x + dx} y={y + 0.03} width={0.08} height={0.09} rx={0.02} fill="#2b2b2b" /><rect x={x + dx} y={y + 0.34} width={0.08} height={0.09} rx={0.02} fill="#2b2b2b" /></g>)}
    </g>
  );
}

function Cone({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 0.17} y={y - 0.17} width={0.34} height={0.34} rx={0.02} fill="#1b1f24" opacity={0.85} />
      <circle cx={x} cy={y} r={0.13} fill="#e8731f" {...line} />
      <circle cx={x} cy={y} r={0.08} fill="#f4f4f0" />
      <circle cx={x} cy={y} r={0.035} fill="#e8731f" />
    </g>
  );
}

function GlassBits({ x, y, n = 9, seed = 1 }: { x: number; y: number; n?: number; seed?: number }) {
  return (
    <g fill="#cfe9f5" opacity={0.85}>
      {Array.from({ length: n }, (_, i) => { const a = ((i * 97 + seed * 31) % 360); const dx = (((i * 53 + seed * 17) % 100) / 100 - 0.5) * 0.9; const dy = (((i * 71 + seed * 13) % 100) / 100 - 0.5) * 0.5; return <polygon key={i} points="0,-0.03 0.035,0.01 -0.02,0.03" transform={`translate(${n2(x + dx)} ${n2(y + dy)}) rotate(${a})`} {...lineSoft} />; })}
    </g>
  );
}

const COMP_COLOUR: Record<string, string> = { battery_12v: "#e7b31a", battery_hv: "#e8731f", airbag: "#d13b3b", curtain_airbag: "#d13b3b", pretensioner: "#e67e22", srs_unit: "#8a9399", fuel_tank: "#2f8fd6", gas_strut: "#3ad17f", reinforcement: "#7f1d1d" };
const COMP_LETTER: Record<string, string> = { battery_12v: "12V", battery_hv: "HV", airbag: "AB", curtain_airbag: "CAB", pretensioner: "PT", srs_unit: "SRS", fuel_tank: "FUEL", gas_strut: "GAS", reinforcement: "UHSS" };

export function RtcScene({ vehicle, done, working, casualty, medics, extrication, extricationCrew = 0, hour, rain, components, caption, words }: RtcSceneProps) {
  const box = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(2.2);
  useEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r && r.height > 0) setAspect(r.width / r.height);
    });
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  const W = Math.round(Math.max(600, Math.min(1400, H * aspect)));
  const sh = shellOf(vehicle);
  const amb: Ambient = { night: hour !== undefined && (hour < 7 || hour >= 18.5), rain: !!rain };
  // Metres to picture units: the car (up to a long van's cab and box) across
  // the clear middle between the floating cards, or its width and a crew's
  // depth either side down the height, whichever is the tighter fit.
  const CARD = 150;
  const s = Math.min((H - 24) / (sh.W + 2 * 0.95), Math.max(40, (W - 2 * CARD) / (Math.min(sh.L, 5.6) + 0.8)));
  const ox = W / 2 - 0.1 * s, oy = H / 2;
  const px = (p: Pt): Pt => [ox + p[0] * s, oy + p[1] * s];
  const has = (k: string) => done.has(k);
  const stabilised = has("stabilise"), glass = has("glass"), doorsOff = has("doors-off"), thirdDoor = has("third-door"), roofFlap = has("roof-flap"), roofOff = has("roof-off"), dashRoll = has("dash-roll");
  const roofOpen = roofFlap || roofOff;
  const released = extrication === "done";
  const paint = PAINT[vehicle.body] ?? "#6b7a8c";
  const glassFill = "#9fc4dd";
  const hw = sh.W / 2;
  const crumpled = !!casualty?.trapped || extrication !== "none";
  const kitOut = working.length > 0 || done.size > 0 || extrication !== "none";
  const fuel = vehicle.components.find((c) => c.kind === "fuel_tank" && c.action);
  const fuelContained = !!fuel?.action && has(fuel.action.id);

  // The casualty: in the driver's seat, feet to the pedals, until released onto a board beside the car.
  const a = casualty?.look.appearance;
  const seed = a ? hash(`${a.ageYears}${a.sex}${a.hairColour}${a.topColour}`) : 0;
  const r: Rig | null = casualty && a ? rig({ heightM: a.heightM, sex: a.sex, child: a.child, elderly: a.elderly, pregnant: a.pregnant }, { pose: released ? "lying" : "reclined", cue: "none", headTurn: 0 }) : null;
  const wear = casualty && r ? wearOf(casualty.look, released ? "road_urban" : "car", seed, !!rain) : null;
  const headAt: Pt = released ? [0.1, hw + 0.86] : [sh.seat[0] + 0.4, sh.seat[1]];
  const chestClass = casualty && casualty.look.breathing !== "none" ? "ps-chest breathe" : "ps-chest";
  const breath = casualty ? (casualty.look.breathing === "none" ? 0 : 60 / Math.max(6, casualty.look.rr)) : 0;

  // Where the crew kneel for each job, in metres from the car's centre: the driver's side is the top.
  const sill = hw + 0.7;
  const fd = sh.frontDoor, rd = sh.rearDoor ?? sh.frontDoor;
  const nose = -sh.L / 2, tail = sh.L / 2;
  const spots: Record<string, { at: Pt; facing: Pt; hands?: { left?: Pt; right?: Pt } }[]> = {
    stabilise: [{ at: [sh.wheels[0] - 0.45, -sill + 0.15], facing: [0.3, 0.95], hands: { left: [sh.wheels[0] - 0.4, -hw - 0.02], right: [sh.wheels[0] - 0.1, -hw - 0.02] } }, { at: [sh.wheels[1] + 0.45, sill - 0.15], facing: [-0.3, -0.95], hands: { left: [sh.wheels[1] + 0.1, hw + 0.02], right: [sh.wheels[1] + 0.4, hw + 0.02] } }],
    glass: [{ at: [sh.cabin[0] - 0.75, -sill + 0.25], facing: [0.55, 0.83], hands: { left: [sh.cabin[0] - 0.2, -hw + 0.1], right: [sh.cabin[0] + 0.05, -hw + 0.3] } }],
    "doors-off": [{ at: [fd[0] + 0.15, -sill], facing: [0, 1] }, { at: [fd[1] - 0.15, -sill], facing: [0, 1] }],
    "third-door": [{ at: [rd[0] - 0.1, -sill], facing: [0, 1] }, { at: [rd[1] - 0.2, -sill], facing: [0, 1] }, { at: [rd[1] + 0.45, -sill + 0.3], facing: [-0.4, 0.9] }],
    "roof-flap": [{ at: [sh.roof[0] - 0.1, -sill], facing: [0, 1] }, { at: [sh.roof[1] + 0.1, -sill], facing: [0, 1] }, { at: [sh.roof[0] - 0.1, sill], facing: [0, -1] }, { at: [sh.roof[1] + 0.1, sill], facing: [0, -1] }],
    "roof-off": [{ at: [sh.roof[0] - 0.1, -sill], facing: [0, 1] }, { at: [sh.roof[1] + 0.1, -sill], facing: [0, 1] }, { at: [sh.roof[0] - 0.1, sill], facing: [0, -1] }, { at: [sh.roof[1] + 0.1, sill], facing: [0, -1] }],
    "dash-roll": [{ at: [sh.dash[0] - 0.3, -sill], facing: [0.25, 0.97] }, { at: [fd[0] + 0.3, -sill], facing: [0, 1] }, { at: [sh.dash[0] - 0.3, sill], facing: [0.25, -0.97] }],
    "contain-fuel": [{ at: [tail - 1.0, sill], facing: [0, -1] }, { at: [tail - 0.3, sill - 0.1], facing: [-0.3, -0.95] }],
    "restrain-struts": [{ at: [tail + 0.75, -0.9], facing: [-0.7, 0.7] }],
    extrication: [{ at: [fd[0] + 0.05, -sill - 0.05], facing: [0, 1], hands: { left: [fd[0] + 0.1, -hw + 0.12], right: [fd[0] + 0.45, -hw + 0.1] } }, { at: [fd[1] + 0.2, -sill - 0.05], facing: [0, 1], hands: { left: [fd[1] - 0.1, -hw + 0.15], right: [fd[1] + 0.25, -hw + 0.1] } }, { at: [sh.dash[0] - 0.5, -sill + 0.35], facing: [0.5, 0.85] }, { at: [fd[0] + 0.3, sill], facing: [0, -1] }],
  };
  // A datasheet action on a component: kneel outside the shell nearest it.
  const compSpot = (c: CrsComponent): { at: Pt; facing: Pt } => {
    const p = onShell(c, sh);
    const side: 1 | -1 = p.y < 0 ? -1 : 1;
    if (Math.abs(p.x) > sh.L / 2 - 0.5) { const end: 1 | -1 = p.x < 0 ? -1 : 1; return { at: [end * (sh.L / 2 + 0.75), p.y * 0.5], facing: [-end, 0] }; }
    return { at: [p.x, side * sill], facing: [0, -side] };
  };
  const figures: { at: Pt; facing: Pt; hands?: { left?: Pt; right?: Pt }; service: "Fire" | "Ambulance"; scope?: string; callsign?: string; tag?: string; seed: number }[] = [];
  const taken = new Set<string>();
  const claim = (at: Pt) => { const k = `${Math.round(at[0] * 4)}:${Math.round(at[1] * 4)}`; if (taken.has(k)) return false; taken.add(k); return true; };
  for (const w of working) {
    const key = STRIP(w.key);
    let list = spots[key];
    if (!list) {
      const comp = vehicle.components.find((c) => c.action?.id === w.key);
      list = comp ? [compSpot(comp)] : [{ at: [nose - 0.8, -0.3], facing: [1, 0] }];
    }
    list.slice(0, Math.max(1, w.crew)).forEach((sp, i) => { if (claim(sp.at)) figures.push({ ...sp, service: "Fire", seed: hash(key) + i * 131 }); });
  }
  if (extrication === "active") spots.extrication.slice(0, Math.max(2, Math.min(4, extricationCrew || 4))).forEach((sp, i) => { if (claim(sp.at)) figures.push({ ...sp, service: "Fire", seed: 401 + i * 131 }); });
  // The ambulance crew: one at the casualty's head through the rear door
  // (or kneeling at the board once they are out), one on the far side.
  medics.slice(0, 2).forEach((m, i) => {
    const sp: { at: Pt; facing: Pt; hands?: { left?: Pt; right?: Pt } } = released
      ? (i === 0 ? { at: [headAt[0] + 0.05, headAt[1] - 0.44], facing: [0, 1], hands: { left: [headAt[0] + 0.12, headAt[1] - 0.04], right: [headAt[0] - 0.13, headAt[1] - 0.06] } } : { at: [headAt[0] - 2.15, headAt[1] + 0.05], facing: [1, 0] })
      : (i === 0 ? { at: [headAt[0] + 0.05, headAt[1] - 0.44], facing: [0, 1], hands: { left: [headAt[0] + 0.12, headAt[1] - 0.04], right: [headAt[0] - 0.13, headAt[1] - 0.06] } } : { at: [fd[1] - 0.1, sill], facing: [0, -1] });
    if (claim(sp.at)) figures.push({ ...sp, service: "Ambulance", scope: m.scope, callsign: m.callsign, tag: i > 0 && medics[0]?.callsign === m.callsign && m.name ? m.name.toUpperCase() : m.callsign, seed: hash(m.callsign) + i * 977 });
  });

  // ---- The shell's parts ---------------------------------------------------------
  const body = bodyPath(sh, crumpled);
  const roofRect = { x: sh.roof[0], y: -hw + 0.16, w: sh.roof[1] - sh.roof[0], h: sh.W - 0.32 };
  const screenPath = (x0: number, x1: number, y0: number, y1: number) => `M${n2(x0)} ${n2(y0 + 0.08)} Q${n2(x0)} ${n2(y0)} ${n2(x0 + 0.1)} ${n2(y0)} L${n2(x1)} ${n2(y0 + 0.02)} L${n2(x1)} ${n2(y1 - 0.02)} L${n2(x0 + 0.1)} ${n2(y1)} Q${n2(x0)} ${n2(y1)} ${n2(x0)} ${n2(y1 - 0.08)} Z`;
  const windscreen = screenPath(sh.cabin[0], sh.roof[0] - 0.03, -hw + 0.2, hw - 0.2);
  const rearScreen = sh.van ? null : `M${n2(sh.roof[1] + 0.03)} ${n2(-hw + 0.22)} L${n2(sh.cabin[1])} ${n2(-hw + 0.3)} Q${n2(sh.cabin[1] + 0.05)} 0 ${n2(sh.cabin[1])} ${n2(hw - 0.3)} L${n2(sh.roof[1] + 0.03)} ${n2(hw - 0.22)} Z`;
  const sideWindow = (x0: number, x1: number, side: 1 | -1) => `M${n2(x0 + 0.04)} ${n2(side * (hw - 0.03))} L${n2(x1 - 0.04)} ${n2(side * (hw - 0.03))} L${n2(x1 - 0.1)} ${n2(side * (hw - 0.2))} L${n2(x0 + 0.1)} ${n2(side * (hw - 0.2))} Z`;
  const doorPanel = (x0: number, x1: number, side: 1 | -1) => `M${n2(x0)} ${n2(side * (hw + 0.02))} L${n2(x1)} ${n2(side * (hw + 0.02))} L${n2(x1)} ${n2(side * (hw - 0.26))} L${n2(x0)} ${n2(side * (hw - 0.26))} Z`;
  const driverFront = doorsOff, driverRear = thirdDoor;
  const roofAt: Pt = roofFlap ? [sh.roof[0] + (sh.van ? 1.3 : 1.45), 0] : roofOff ? [tail + 0.45, -0.45] : [sh.roof[0], 0];
  const comps = components ? vehicle.components.map((c) => ({ c, p: onShell(c, sh) })) : [];

  const cap = caption ?? "On the carriageway";

  return (
    <div ref={box} className={`ps-scene ps-set-road_urban pr-scene${amb.night ? " night" : ""} fill`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-label="The crash from above">
        <defs>
          <FigureDefs />
          <KitDefs />
          <GroundDefs />
          <WeatherDefs />
          <filter id="pr-car-shadow" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="0.05" /></filter>
          <linearGradient id="pr-paint" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
            <stop offset="0.35" stopColor="#fff" stopOpacity="0.04" />
            <stop offset="1" stopColor="#000" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="pr-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
            <stop offset="0.4" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="1" stopColor="#000" stopOpacity="0.2" />
          </linearGradient>
          <pattern id="pr-film" width="0.05" height="0.05" patternUnits="userSpaceOnUse"><path d="M0 0.05 L0.05 0 M-0.01 0.01 L0.01 -0.01 M0.04 0.06 L0.06 0.04" stroke="#fff" strokeWidth="0.004" strokeOpacity="0.55" /></pattern>
          <radialGradient id="pr-spill" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#0d1116" stopOpacity="0.9" /><stop offset="0.7" stopColor="#0d1116" stopOpacity="0.6" /><stop offset="1" stopColor="#0d1116" stopOpacity="0" /></radialGradient>
        </defs>
        <g transform={`translate(${n2(ox)} ${n2(oy)}) scale(${s.toFixed(2)})`}>
          {/* The carriageway: tarmac, the lane line, the hard-shoulder edge, skid marks, the glass. */}
          <rect x={-8} y={-4} width={16} height={8} fill="url(#pg-tarmac)" />
          <rect x={-8} y={hw + 1.5} width={16} height={0.14} fill="#f4f4f0" opacity={0.85} />
          {Array.from({ length: 14 }, (_, i) => <rect key={i} x={-8 + i * 1.2} y={-hw - 1.48} width={0.6} height={0.12} fill="#f4f4f0" opacity={0.75} />)}
          <g opacity={0.5}>
            <path d={`M${n2(nose + 0.3)} ${n2(-hw + 0.3)} q-1.6 0.1 -2.6 0.5`} stroke="#1b1f24" strokeWidth={0.18} fill="none" strokeLinecap="round" />
            <path d={`M${n2(nose + 0.3)} ${n2(hw - 0.3)} q-1.6 0.1 -2.6 0.5`} stroke="#1b1f24" strokeWidth={0.18} fill="none" strokeLinecap="round" />
          </g>
          <GlassBits x={nose - 0.7} y={0.2} seed={3} />
          <GlassBits x={nose - 0.2} y={-0.9} n={6} seed={7} />
          {/* Fuel on the road from a split tank, and the foam blanket over it once it is contained. */}
          {fuel && (() => { const p = onShell(fuel, sh); return (
            <g>
              <path d={smooth([[p.x - 0.7, hw + 0.05], [p.x + 0.3, hw - 0.02], [p.x + 1.1, hw + 0.2], [p.x + 1.3, hw + 0.6], [p.x + 0.8, hw + 0.95], [p.x - 0.1, hw + 0.9], [p.x - 0.8, hw + 0.6]], 0.6)} fill="#0d1116" opacity={0.7} />
              <path d={smooth([[p.x - 0.5, hw + 0.15], [p.x + 0.3, hw + 0.08], [p.x + 0.9, hw + 0.3], [p.x + 1.0, hw + 0.6], [p.x + 0.6, hw + 0.8], [p.x - 0.1, hw + 0.75], [p.x - 0.6, hw + 0.5]], 0.6)} fill="url(#ps-sheen)" opacity={0.7} />
              <path d={smooth([[p.x - 0.5, hw + 0.15], [p.x + 0.3, hw + 0.08], [p.x + 0.9, hw + 0.3], [p.x + 1.0, hw + 0.6], [p.x + 0.6, hw + 0.8], [p.x - 0.1, hw + 0.75], [p.x - 0.6, hw + 0.5]], 0.6)} fill="#4cb3ff" opacity={0.08} />
              {fuelContained && (
                <g>
                  <path d={smooth([[p.x - 0.9, hw + 0.1], [p.x + 0.2, hw - 0.05], [p.x + 1.6, hw + 0.15], [p.x + 1.9, hw + 0.7], [p.x + 1.4, hw + 1.25], [p.x + 0.2, hw + 1.3], [p.x - 0.9, hw + 1.0], [p.x - 1.2, hw + 0.55]], 0.6)} fill="#f3efe4" opacity={0.95} {...edge("#f3efe4", 0.3, 0.5, 0.8)} />
                  <path d={smooth([[p.x - 0.9, hw + 0.1], [p.x + 0.2, hw - 0.05], [p.x + 1.6, hw + 0.15], [p.x + 1.9, hw + 0.7], [p.x + 1.4, hw + 1.25], [p.x + 0.2, hw + 1.3], [p.x - 0.9, hw + 1.0], [p.x - 1.2, hw + 0.55]], 0.6)} fill="url(#ps-grain)" />
                  {[[p.x - 0.3, hw + 0.4], [p.x + 0.6, hw + 0.9], [p.x + 1.2, hw + 0.5], [p.x + 0.1, hw + 1.0]].map(([cx, cy], i) => <ellipse key={i} cx={cx} cy={cy} rx={0.18} ry={0.12} fill="#fff" opacity={0.5} />)}
                </g>
              )}
            </g>
          ); })()}
          {/* The hydraulic kit on its mat, out as soon as there is work. */}
          {kitOut && <ToolMat x={nose - 1.0} y={hw + 0.95} />}
          {kitOut && <KitBag at={[tail + 0.55, hw + 1.1]} />}
          {/* Blocks under the sills. */}
          {stabilised && [sh.wheels[0] + 0.45, sh.wheels[1] - 0.45].map((x, i) => <g key={i}><StepBlock x={x} y={-hw + 0.1} side={-1} /><StepBlock x={x} y={hw - 0.1} side={1} /></g>)}
          {/* The car's shadow, then the shell. */}
          <path d={body} fill="#000" opacity={0.45} filter="url(#pr-car-shadow)" transform="translate(0.08 0.1)" />
          <g>
            {/* Wheels and mirrors poke out under the shell. */}
            {sh.wheels.map((x) => [-1, 1].map((side) => <rect key={`${x}${side}`} x={x - 0.33} y={side * (hw - 0.02) - (side > 0 ? 0.12 : 0.14)} width={0.66} height={0.26} rx={0.05} fill="#15191c" {...lineSoft} />))}
            {!doorsOff && <rect x={fd[0] + 0.05} y={-hw - 0.14} width={0.22} height={0.12} rx={0.03} fill={darken(paint, 0.1)} {...lineSoft} />}
            <rect x={fd[0] + 0.05} y={hw + 0.02} width={0.22} height={0.12} rx={0.03} fill={darken(paint, 0.1)} {...lineSoft} />
            <path d={body} fill={paint} {...edge(paint, 0.55, 0.7, 0.9)} />
            <path d={body} fill="url(#pr-paint)" />
            <path d={body} fill="url(#ps-grain)" />
            {/* Bonnet shut lines and the crumple, the boot line, the lights. */}
            <path d={`M${n2(nose + 0.5)} ${n2(-hw + 0.3)} L${n2(sh.cabin[0] - 0.05)} ${n2(-hw + 0.1)} M${n2(nose + 0.5)} ${n2(hw - 0.3)} L${n2(sh.cabin[0] - 0.05)} ${n2(hw - 0.1)}`} fill="none" stroke={darken(paint, 0.5)} strokeWidth={0.8} strokeOpacity={0.6} {...SOFT} />
            {crumpled && <path d={`M${n2(nose + 0.2)} ${n2(-hw + 0.45)} l0.18 0.14 l-0.14 0.2 l0.2 0.18 l-0.1 0.22 l0.16 0.2 M${n2(nose + 0.45)} ${n2(-0.15)} l0.15 0.12 l-0.12 0.16 l0.2 0.14 M${n2(nose + 0.3)} ${n2(hw - 0.5)} l0.16 -0.12 l-0.1 -0.2 l0.2 -0.14`} fill="none" stroke={darken(paint, 0.6)} strokeWidth={1.1} strokeOpacity={0.7} {...SOFT} />}
            {crumpled && <path d={`M${n2(nose)} ${n2(-hw + 0.35)} L${n2(nose + 0.35)} ${n2(-hw + 0.5)} L${n2(nose + 0.2)} ${n2(0)} L${n2(nose + 0.35)} ${n2(hw - 0.5)} L${n2(nose)} ${n2(hw - 0.35)}`} fill="#1b1f24" opacity={0.35} />}
            {!sh.van && <path d={`M${n2(sh.cabin[1] + 0.1)} ${n2(-hw + 0.3)} L${n2(tail - 0.2)} ${n2(-hw + 0.4)} M${n2(sh.cabin[1] + 0.1)} ${n2(hw - 0.3)} L${n2(tail - 0.2)} ${n2(hw - 0.4)}`} fill="none" stroke={darken(paint, 0.5)} strokeWidth={0.8} strokeOpacity={0.6} {...SOFT} />}
            {[-1, 1].map((side) => <g key={side}><rect x={nose + 0.05} y={side * (hw - 0.45) - 0.08} width={0.14} height={0.16} rx={0.03} fill="#f4f4f0" opacity={0.9} /><rect x={tail - 0.2} y={side * (hw - 0.45) - 0.08} width={0.14} height={0.16} rx={0.03} fill="#d13b3b" opacity={0.9} /></g>)}
            {sh.van && (
              <g>
                {/* The box: roof ribs, the gutter line, the sliding door on the nearside, the rear doors' split. */}
                <rect x={sh.cabin[1] + 0.05} y={-hw + 0.12} width={tail - sh.cabin[1] - 0.2} height={sh.W - 0.24} rx={0.08} fill="none" stroke={darken(paint, 0.35)} strokeWidth={0.9} strokeOpacity={0.5} {...SOFT} />
                {Array.from({ length: Math.floor((tail - sh.cabin[1] - 0.4) / 0.55) }, (_, i) => <path key={i} d={`M${n2(sh.cabin[1] + 0.35 + i * 0.55)} ${n2(-hw + 0.16)} V${n2(hw - 0.16)}`} stroke={darken(paint, 0.3)} strokeWidth={0.8} strokeOpacity={0.4} {...SOFT} />)}
                <path d={`M${n2(sh.cabin[1] + 0.2)} ${n2(hw - 0.02)} h1.35`} stroke={darken(paint, 0.5)} strokeWidth={1.2} strokeOpacity={0.6} {...SOFT} />
                <path d={`M${n2(tail - 0.08)} ${n2(-hw + 0.3)} V${n2(hw - 0.3)}`} stroke={darken(paint, 0.5)} strokeWidth={1} strokeOpacity={0.6} {...SOFT} />
                <rect x={sh.cabin[1] + 0.3} y={-0.06} width={tail - sh.cabin[1] - 0.7} height={0.12} rx={0.02} fill={darken(paint, 0.3)} opacity={0.5} />
              </g>
            )}
            {/* The cabin floor and seats seen through the glass. */}
            <rect x={sh.cabin[0]} y={-hw + 0.16} width={sh.cabin[1] - sh.cabin[0]} height={sh.W - 0.32} fill="#2e3238" />
            {[-1, 1].map((side) => (
              <g key={side}>
                <rect x={sh.seat[0] - 0.28} y={side * Math.abs(sh.seat[1]) - 0.27} width={0.9} height={0.54} rx={0.08} fill="#2b2f36" {...line} />
                <rect x={sh.seat[0] - 0.28} y={side * Math.abs(sh.seat[1]) - 0.27} width={0.9} height={0.54} rx={0.08} fill="url(#ps-round)" opacity={0.5} />
                <rect x={sh.seat[0] + 0.38} y={side * Math.abs(sh.seat[1]) - 0.22} width={0.26} height={0.44} rx={0.07} fill="#1f2328" {...lineSoft} />
              </g>
            ))}
            {!sh.van && <rect x={sh.cabin[1] - 0.6} y={-hw + 0.24} width={0.5} height={sh.W - 0.48} rx={0.08} fill="#2b2f36" {...line} />}
            <rect x={sh.seat[0] - 0.3} y={-0.12} width={0.95} height={0.24} rx={0.04} fill="#15191c" {...lineSoft} />
            {/* The casualty in the seat (drawn before the dash, which lies over their legs). */}
            {casualty && r && wear && !released && (
              <g clipPath={`url(#pr-cab-${vehicle.id})`}>
                <clipPath id={`pr-cab-${vehicle.id}`}><rect x={sh.cabin[0] + 0.02} y={-hw + 0.1} width={sh.cabin[1] - sh.cabin[0] - 0.04} height={sh.W - 0.2} /></clipPath>
                <g transform={`translate(${n2(headAt[0])} ${n2(headAt[1])}) rotate(90)`}>
                  <PlanFigure rig={r} w={wear} chestClass={chestClass} chestStyle={breath ? ({ "--ps-breath": `${breath.toFixed(2)}s` } as CSSProperties) : undefined} shadow={false} />
                </g>
              </g>
            )}
            {/* The dash and the steering wheel, rolled forward off the legs once the ram has done its work. */}
            <g transform={dashRoll ? "translate(-0.28 0)" : undefined}>
              <rect x={sh.dash[0] + 0.02} y={-hw + 0.16} width={sh.dash[1] - sh.dash[0]} height={sh.W - 0.32} rx={0.06} fill="#15191c" {...line} />
              <rect x={sh.dash[0] + 0.02} y={-hw + 0.16} width={sh.dash[1] - sh.dash[0]} height={sh.W - 0.32} rx={0.06} fill="url(#ps-round)" opacity={0.5} />
              <g transform={`translate(${n2(sh.dash[1] + 0.2)} ${n2(sh.seat[1])})`}>
                <circle cx={0} cy={0} r={0.19} fill="none" stroke="#1b1f24" strokeWidth={0.045} />
                <circle cx={0} cy={0} r={0.19} fill="none" stroke="#3a3f45" strokeWidth={0.02} />
                <path d="M-0.19 0 H0.19 M0 0 V0.19" stroke="#1b1f24" strokeWidth={0.035} />
                <circle cx={0} cy={0} r={0.06} fill="#1b1f24" />
                {crumpled && <path d={smooth([[-0.17, -0.07], [-0.07, -0.19], [0.12, -0.17], [0.2, -0.02], [0.09, 0.15], [-0.11, 0.13]], 0.6)} fill="#f4f4f0" opacity={0.75} {...lineSoft} />}
              </g>
            </g>
            {dashRoll && <Ram from={[sh.dash[0] - 0.05, -hw + 0.1]} to={[sh.dash[1] + 0.12, -hw + 0.25]} />}
            {/* Glass: the screen (filmed once managed), the rear screen, the side windows (out once managed). */}
            <path d={windscreen} fill={glassFill} opacity={0.55} {...lineSoft} />
            <path d={windscreen} fill="url(#pr-glass)" />
            {glass && <path d={windscreen} fill="url(#pr-film)" opacity={0.9} />}
            {!glass && crumpled && <path d={`M${n2(sh.cabin[0] + 0.15)} ${n2(-hw + 0.5)} l0.12 0.2 l-0.1 0.18 l0.16 0.14 M${n2(sh.cabin[0] + 0.2)} ${n2(-hw + 0.9)} l0.2 0.12 l0.1 0.2`} fill="none" stroke="#fff" strokeWidth={0.8} strokeOpacity={0.6} {...SOFT} />}
            {rearScreen && <path d={rearScreen} fill={glassFill} opacity={0.55} {...lineSoft} />}
            {rearScreen && <path d={rearScreen} fill="url(#pr-glass)" />}
            {[-1, 1].map((side) => (
              <g key={side}>
                {!(side === -1 && driverFront) && !glass && <path d={sideWindow(fd[0], fd[1], side as 1 | -1)} fill={glassFill} opacity={0.5} {...lineSoft} />}
                {sh.rearDoor && !(side === -1 && driverRear) && !glass && <path d={sideWindow(sh.rearDoor[0], sh.rearDoor[1], side as 1 | -1)} fill={glassFill} opacity={0.5} {...lineSoft} />}
              </g>
            ))}
            {/* Doors: shut lines on the shell, or gone from the driver's side. */}
            {[-1, 1].map((side) => (
              <g key={side}>
                {!(side === -1 && driverFront) ? <path d={doorPanel(fd[0], fd[1], side as 1 | -1)} fill="none" stroke={darken(paint, 0.5)} strokeWidth={0.8} strokeOpacity={0.55} {...SOFT} /> : <path d={doorPanel(fd[0], fd[1], -1)} fill="#1f2328" opacity={0.85} />}
                {sh.rearDoor && (!(side === -1 && driverRear) ? <path d={doorPanel(sh.rearDoor[0], sh.rearDoor[1], side as 1 | -1)} fill="none" stroke={darken(paint, 0.5)} strokeWidth={0.8} strokeOpacity={0.55} {...SOFT} /> : <path d={doorPanel(sh.rearDoor[0], sh.rearDoor[1], -1)} fill="#1f2328" opacity={0.85} />)}
                {!(side === -1 && driverFront) && <rect x={fd[1] - 0.3} y={side * (hw - 0.12) - 0.02} width={0.16} height={0.04} rx={0.01} fill="#c9ced3" />}
              </g>
            ))}
            {/* The B-pillar, out on the driver's side after the third door conversion. */}
            {sh.rearDoor && !driverRear && <rect x={fd[1] - 0.04} y={-hw} width={0.08} height={0.3} fill={darken(paint, 0.3)} />}
            {sh.rearDoor && <rect x={fd[1] - 0.04} y={hw - 0.3} width={0.08} height={0.3} fill={darken(paint, 0.3)} />}
            {/* The roof: a cutaway panel in place; flapped back over the boot; or lifted clear onto the road. */}
            {!roofOff && (
              <g transform={roofFlap ? `translate(${n2(roofAt[0] - sh.roof[0])} 0)` : undefined}>
                <rect x={roofRect.x} y={roofRect.y} width={roofRect.w} height={roofRect.h} rx={0.1} fill={paint} opacity={roofFlap ? 0.98 : 0.5} {...edge(paint, 0.55, 0.7, 0.9)} />
                <rect x={roofRect.x} y={roofRect.y} width={roofRect.w} height={roofRect.h} rx={0.1} fill="url(#pr-paint)" opacity={roofFlap ? 1 : 0.7} />
                {roofFlap && <path d={`M${n2(roofRect.x + 0.05)} ${n2(roofRect.y + 0.1)} V${n2(roofRect.y + roofRect.h - 0.1)}`} stroke={darken(paint, 0.6)} strokeWidth={1.2} strokeOpacity={0.7} {...SOFT} />}
                {roofFlap && <path d={`M${n2(roofRect.x + 0.02)} ${n2(roofRect.y)} l-0.14 0.12 l0.1 0.2 l-0.12 0.18 l0.08 0.2 l-0.1 0.2 l0.1 0.18 l-0.08 0.2 l0.14 0.12`} fill="none" stroke={darken(paint, 0.6)} strokeWidth={1} strokeOpacity={0.7} {...SOFT} />}
              </g>
            )}
            {/* The pillar stubs where the roof came off. */}
            {roofOpen && [sh.roof[0], sh.roof[1]].map((x) => [-1, 1].map((side) => <rect key={`${x}${side}`} x={x - 0.05} y={side * (hw - 0.1) - 0.06} width={0.1} height={0.12} rx={0.02} fill={darken(paint, 0.35)} {...lineSoft} />))}
            {/* The datasheet's components, on the shell, when asked for. */}
            {comps.map(({ c, p }, i) => (
              <g key={i} opacity={0.92}>
                <rect x={p.x - Math.max(0.1, p.w) / 2} y={p.y - Math.max(0.1, p.h) / 2} width={Math.max(0.1, p.w)} height={Math.max(0.1, p.h)} rx={0.04} fill={COMP_COLOUR[c.kind] ?? "#8a9399"} fillOpacity={0.35} stroke={COMP_COLOUR[c.kind] ?? "#8a9399"} strokeWidth={1.2} {...SOFT} strokeDasharray={c.action && !has(c.action.id) ? "3 2" : undefined} />
                <text x={p.x} y={p.y + 0.028} textAnchor="middle" className="pr-comp">{COMP_LETTER[c.kind] ?? "?"}</text>
                {c.action && has(c.action.id) && <circle cx={p.x + Math.max(0.1, p.w) / 2} cy={p.y - Math.max(0.1, p.h) / 2} r={0.055} fill="#3ad17f" {...lineSoft} />}
              </g>
            ))}
          </g>
          {/* Parts taken off the car, lying on the tarmac beside it. */}
          {doorsOff && (
            <g transform={`translate(${n2(nose - 1.6)} ${n2(-hw - 0.55)}) rotate(-24)`}>
              <rect x={0} y={0} width={fd[1] - fd[0]} height={0.3} rx={0.05} fill={paint} {...edge(paint, 0.55, 0.7, 0.9)} />
              <rect x={0} y={0} width={fd[1] - fd[0]} height={0.3} rx={0.05} fill="url(#pr-paint)" />
              <rect x={0.08} y={0.04} width={fd[1] - fd[0] - 0.16} height={0.12} rx={0.03} fill={glassFill} opacity={0.5} />
            </g>
          )}
          {thirdDoor && sh.rearDoor && (
            <g transform={`translate(${n2(tail + 0.45)} ${n2(-hw - 0.5)}) rotate(28)`}>
              <rect x={0} y={0} width={sh.rearDoor[1] - sh.rearDoor[0]} height={0.3} rx={0.05} fill={paint} {...edge(paint, 0.55, 0.7, 0.9)} />
              <rect x={0} y={0} width={sh.rearDoor[1] - sh.rearDoor[0]} height={0.3} rx={0.05} fill="url(#pr-paint)" />
              <rect x={-0.4} y={0.08} width={0.3} height={0.1} rx={0.02} fill={darken(paint, 0.3)} {...lineSoft} />
            </g>
          )}
          {roofOff && (
            <g transform={`translate(${n2(roofAt[0])} ${n2(roofAt[1])}) rotate(22)`}>
              <rect x={0} y={-roofRect.h / 2} width={roofRect.w} height={roofRect.h} rx={0.1} fill={paint} {...edge(paint, 0.55, 0.7, 0.9)} />
              <rect x={0} y={-roofRect.h / 2} width={roofRect.w} height={roofRect.h} rx={0.1} fill="url(#pr-paint)" />
              {[0, 1].map((i) => <rect key={i} x={-0.06 + i * roofRect.w} y={-roofRect.h / 2 + 0.1} width={0.06} height={roofRect.h - 0.2} fill={darken(paint, 0.35)} />)}
            </g>
          )}
          {/* Out: on the board beside the car, the ambulance crew's now. */}
          {released && <Longboard x={headAt[0] - 1.62} y={headAt[1] - 0.23} />}
          {released && casualty && r && wear && (
            <g transform={`translate(${n2(headAt[0])} ${n2(headAt[1])}) rotate(90)`}>
              <PlanFigure rig={r} w={wear} chestClass={chestClass} chestStyle={breath ? ({ "--ps-breath": `${breath.toFixed(2)}s` } as CSSProperties) : undefined} />
            </g>
          )}
          {/* Cones along the working edge. */}
          <Cone x={nose - 2.2} y={hw + 1.4} />
          <Cone x={tail + 2.2} y={hw + 1.4} />
          {/* The crew. */}
          {figures.map((f, i) => (
            <CrewTop key={i} at={f.at} facing={f.facing} hands={f.hands ?? {}} style={{ animationDelay: `${((i * 1.7) % 4.4).toFixed(1)}s` }} wear={crewWearOf(f.service, f.scope, f.seed, { jacket: f.service === "Ambulance" || amb.night, role: f.service === "Ambulance" ? "PARAMEDIC" : "" })} />
          ))}
          <Weather amb={amb} outdoor centre={[sh.seat[0], sh.seat[1]]} k={1.6} />
        </g>
        {amb.rain && (
          <g className="ps-rain">
            {Array.from({ length: 30 }, (_, i) => <line key={i} x1={(i * 53) % W} y1={((i * 37) % H) - 20} x2={((i * 53) % W) + 3} y2={((i * 37) % H) - 4} />)}
          </g>
        )}
        {figures.filter((f) => f.tag).map((f, i) => {
          const h = px(crewHeadAt(f.at, f.facing));
          const dx = f.facing[0] !== 0 ? -f.facing[0] * 34 : 0;
          const dy = f.facing[0] !== 0 ? -4 : -28;
          return <text key={i} x={h[0] + dx} y={h[1] + dy} textAnchor="middle" className="ps-tag">{f.tag}</text>;
        })}
      </svg>
      <div className="ps-caption">
        <b>{cap}</b>
        <span>{(words ?? []).join(" · ")}</span>
      </div>
    </div>
  );
}
