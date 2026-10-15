"use client";

// THE CRASH, FROM ABOVE. A car (or a van) on the carriageway, nose to
// the left, drawn as a cutaway so the person in the driver's seat is
// never hidden by the roof: the shell with its clearcoat and panel gaps,
// the tyres in their arches, the lamps, the glass with the sky in it,
// the seats, the dash over their legs. Round it, what the crew have done
// to it — step chocks under the sills, the screen filmed and the side
// glass out, the doors off and lying on the tarmac, the B-pillar out,
// the roof flapped back or lifted clear, the dash rolled off the pedal
// box with the ram footed at the A-pillar — and the firefighters at
// whichever job is running now with the hydraulic tool for it, its
// hoses run back to the power unit on the salvage sheet, the ambulance
// crew with the casualty, the fuel on the road and the foam that covers
// it. Night darkens it to the working lights; rain wets it.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { CrsVehicle, CrsComponent } from "@/lib/sim/incident_types";
import type { PatientLook } from "@/lib/sim/patient_look";
import { rig, PlanFigure, FigureDefs, darken, smooth, smoothOpen, capsule, lineSoft, edge, add, mul, sub, unit, perp, lerp, len, deg, P, type Pt, type Rig } from "./plan-figure";
import { KitDefs, KitBag, Bevel, Screw } from "./plan-kit";
import { CrewTop, crewWearOf, crewHeadAt } from "./plan-crew";
import { GroundDefs, Weather, WeatherDefs, CarSeat, SteeringWheel, Tarmac, prng, type Ambient } from "./plan-ground";
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

// ---------------------------------------------------------------------------
// The shell's materials
// ---------------------------------------------------------------------------

/** A panel gap in a painted shell: the dark line of the gap, and the light catching the edge beside it. */
function Seam({ d, dark = 0.5, light = 0.22, w = 0.9 }: { d: string; dark?: number; light?: number; w?: number }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke="#fff" strokeWidth={w} strokeOpacity={light} transform="translate(0.007 0.009)" {...SOFT} />
      <path d={d} stroke="#000" strokeWidth={w} strokeOpacity={dark} {...SOFT} />
    </g>
  );
}

/** A painted panel: the colour, the body's curve across it, the clearcoat's gleam and the grain. */
function Painted({ d, paint, opacity = 1, gleam = true }: { d: string; paint: string; opacity?: number; gleam?: boolean }) {
  return (
    <g opacity={opacity}>
      <path d={d} fill={paint} {...edge(paint, 0.55, 0.75, 0.9)} />
      <path d={d} fill="url(#pr-body-v)" />
      {gleam && <path d={d} fill="url(#pr-gleam)" />}
      <path d={d} fill="url(#ps-grain)" opacity={0.55} />
    </g>
  );
}

/** A headlamp wrapped round the nose's corner: the lens, the projector in it, the daytime light along its edge. */
function HeadLamp({ nose, side, hw, van, cracked }: { nose: number; side: 1 | -1; hw: number; van: boolean; cracked: boolean }) {
  const s = side;
  const pts: Pt[] = van
    ? [[nose + 0.12, s * (hw - 0.3)], [nose + 0.26, s * (hw - 0.12)], [nose + 0.4, s * (hw - 0.08)], [nose + 0.4, s * (hw - 0.16)], [nose + 0.3, s * (hw - 0.22)], [nose + 0.2, s * (hw - 0.38)]]
    : [[nose + 0.08, s * (hw - 0.44)], [nose + 0.2, s * (hw - 0.27)], [nose + 0.5, s * (hw - 0.13)], [nose + 0.5, s * (hw - 0.2)], [nose + 0.26, s * (hw - 0.34)], [nose + 0.15, s * (hw - 0.52)]];
  const d = smooth(pts, 0.25);
  const proj: Pt = van ? [nose + 0.26, s * (hw - 0.2)] : [nose + 0.2, s * (hw - 0.37)];
  return (
    <g>
      <path d={d} fill="#0b0e11" opacity={0.6} transform="translate(0.006 0.008)" />
      <path d={d} fill="#d9e1e8" stroke="#0b0e11" strokeWidth={0.8} {...SOFT} />
      <path d={d} fill="url(#pr-lamp)" />
      <circle cx={proj[0]} cy={proj[1]} r={0.036} fill="#0e1318" stroke="url(#pk-chrome)" strokeWidth={0.01} />
      <circle cx={proj[0] - 0.01} cy={proj[1] - 0.01} r={0.009} fill="#fff" opacity={0.8} />
      <path d={`M${P(pts[0])} Q${P(pts[1])} ${P(pts[2])}`} fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={1.4} strokeLinecap="round" {...SOFT} />
      {cracked && <path d={`M${P(lerp(pts[0], pts[3], 0.3))} l0.06 0.05 l-0.03 0.06 l0.08 0.04 M${P(lerp(pts[1], pts[4], 0.5))} l0.05 -0.04 l0.04 0.05`} fill="none" stroke="#fff" strokeOpacity={0.75} strokeWidth={0.8} {...SOFT} />}
    </g>
  );
}

/** A rear lamp cluster: red, with the amber indicator and the clear reverse lamp in it. */
function RearLamp({ tail, side, hw, van }: { tail: number; side: 1 | -1; hw: number; van: boolean }) {
  const s = side;
  if (van) {
    const x = tail - 0.14, y0 = s * (hw - 0.3) - 0.17;
    return (
      <g>
        <rect x={x} y={y0} width={0.1} height={0.34} rx={0.02} fill="#0b0e11" />
        <rect x={x + 0.012} y={y0 + 0.012} width={0.076} height={0.1} rx={0.008} fill="#c8102e" />
        <rect x={x + 0.012} y={y0 + 0.12} width={0.076} height={0.1} rx={0.008} fill="#f0a020" />
        <rect x={x + 0.012} y={y0 + 0.228} width={0.076} height={0.1} rx={0.008} fill="#e9ecef" />
        <rect x={x} y={y0} width={0.1} height={0.34} rx={0.02} fill="url(#pr-lamp)" opacity={0.7} />
      </g>
    );
  }
  const pts: Pt[] = [[tail - 0.07, s * (hw - 0.42)], [tail - 0.14, s * (hw - 0.27)], [tail - 0.38, s * (hw - 0.14)], [tail - 0.4, s * (hw - 0.21)], [tail - 0.22, s * (hw - 0.32)], [tail - 0.13, s * (hw - 0.48)]];
  const d = smooth(pts, 0.25);
  return (
    <g>
      <path d={d} fill="#0b0e11" opacity={0.6} transform="translate(0.006 0.008)" />
      <path d={d} fill="#b5101f" stroke="#0b0e11" strokeWidth={0.8} {...SOFT} />
      <rect x={tail - 0.35} y={s * (hw - 0.19) - 0.022} width={0.08} height={0.044} rx={0.01} fill="#e9ecef" opacity={0.85} />
      <rect x={tail - 0.25} y={s * (hw - 0.26) - 0.022} width={0.07} height={0.044} rx={0.01} fill="#f0a020" opacity={0.85} />
      <path d={d} fill="url(#pr-lamp)" opacity={0.55} />
    </g>
  );
}

/** A door mirror on its stalk, the indicator repeater along its outer edge. */
function Mirror({ x, side, hw, paint }: { x: number; side: 1 | -1; hw: number; paint: string }) {
  const y = side * (hw + 0.09);
  const edgeY = side * (hw - 0.03);
  return (
    <g>
      <ellipse cx={x + 0.15} cy={y + 0.05} rx={0.15} ry={0.07} fill="#000" opacity={0.35} filter="url(#ps-blur-sm)" />
      <rect x={x + 0.03} y={Math.min(y, edgeY)} width={0.07} height={Math.abs(y - edgeY)} fill={darken(paint, 0.35)} />
      <rect x={x} y={y - 0.065} width={0.25} height={0.13} rx={0.05} fill={paint} {...edge(paint, 0.55, 0.7, 0.8)} />
      <rect x={x} y={y - 0.065} width={0.25} height={0.13} rx={0.05} fill="url(#pr-body-v)" />
      <rect x={x} y={y - 0.065} width={0.25} height={0.13} rx={0.05} fill="url(#ps-grain)" opacity={0.6} />
      <path d={`M${n2(x + 0.05)} ${n2(y + side * 0.048)} H${n2(x + 0.22)}`} stroke="#f0a020" strokeWidth={1.2} strokeOpacity={0.8} {...SOFT} />
    </g>
  );
}

/** The crush at the nose: the panels folded in shade, the creases catching the light, the bonnet buckled up in a ridge behind it. */
function Crumple({ nose, hw, seed }: { nose: number; hw: number; seed: number }) {
  const r = prng(seed);
  const creases = Array.from({ length: 6 }, (_, i) => {
    const y0 = -hw + 0.22 + (i / 5) * (2 * hw - 0.44);
    let x = nose + 0.02 + r() * 0.1, y = y0;
    const pts: Pt[] = [[x, y]];
    for (let k = 0; k < 4; k++) { x += 0.08 + r() * 0.1; y += (r() - 0.5) * 0.22; pts.push([x, y]); }
    return pts;
  });
  return (
    <g>
      <path d={smooth([[nose - 0.1, -hw + 0.2], [nose + 0.55, -hw + 0.2], [nose + 0.42, 0], [nose + 0.55, hw - 0.2], [nose - 0.1, hw - 0.2]], 0.4)} fill="#000" opacity={0.42} filter="url(#ps-blur-md)" />
      {creases.map((pts, i) => (
        <g key={i} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={smoothOpen(pts, 0.3)} stroke="#fff" strokeOpacity={0.35} strokeWidth={1.1} transform="translate(-0.008 -0.01)" {...SOFT} />
          <path d={smoothOpen(pts, 0.3)} stroke="#000" strokeOpacity={0.55} strokeWidth={1.1} {...SOFT} />
        </g>
      ))}
      <path d={`M${n2(nose + 0.58)} ${n2(-hw + 0.34)} Q${n2(nose + 0.66)} 0 ${n2(nose + 0.58)} ${n2(hw - 0.34)}`} fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={2} {...SOFT} />
      <path d={`M${n2(nose + 0.61)} ${n2(-hw + 0.34)} Q${n2(nose + 0.69)} 0 ${n2(nose + 0.61)} ${n2(hw - 0.34)}`} fill="none" stroke="#000" strokeOpacity={0.4} strokeWidth={2} {...SOFT} />
    </g>
  );
}

/** A door the crew have taken off, lying flat on the tarmac, outer face up: the panel below the belt line, the window frame above it with the glass in it or gone. */
function DoorOff({ w, paint, glass }: { w: number; paint: string; glass: boolean }) {
  const h = 0.92, belt = 0.52;
  const frame = `M0.03 ${n2(h - belt)} L0.16 0.03 H${n2(w - 0.07)} V${n2(h - belt)}`;
  const panel = `M0 ${n2(h - belt + 0.04)} q0 -0.04 0.04 -0.04 H${n2(w - 0.04)} q0.04 0 0.04 0.04 V${n2(h - 0.05)} q0 0.05 -0.05 0.05 H0.05 q-0.05 0 -0.05 -0.05 Z`;
  return (
    <g>
      <rect x={0.05} y={0.06} width={w} height={h} rx={0.05} fill="#000" opacity={0.45} filter="url(#ps-blur-md)" />
      <path d={`${frame} Z`} fill={glass ? "none" : "url(#pr-screen)"} opacity={glass ? 1 : 0.8} stroke="#15181c" strokeWidth={0.03} strokeLinejoin="round" />
      {!glass && <path d={`${frame} Z`} fill="url(#pk-glass-refl)" />}
      <Painted d={panel} paint={paint} />
      <path d={`M0.08 ${n2(h - belt + 0.3)} H${n2(w - 0.08)}`} stroke="#fff" strokeOpacity={0.25} strokeWidth={1.2} {...SOFT} />
      <rect x={w - 0.3} y={h - belt + 0.1} width={0.18} height={0.05} rx={0.015} fill="#000" opacity={0.45} />
      <rect x={w - 0.29} y={h - belt + 0.105} width={0.16} height={0.036} rx={0.012} fill="url(#pk-chrome)" stroke="#2b2f33" strokeWidth={0.4} {...SOFT} />
      {[h - belt + 0.08, h - 0.14].map((y) => <rect key={y} x={-0.035} y={y} width={0.07} height={0.08} rx={0.01} fill="url(#pk-steel)" stroke="#2b2f33" strokeWidth={0.5} {...SOFT} />)}
    </g>
  );
}

/** A roof the crew have cut off, lying on the road: the panel with its gutters, the pillar stubs bright where the cutters went through. */
function RoofPanel({ w, h, paint }: { w: number; h: number; paint: string }) {
  const d = `M0 ${n2(-h / 2 + 0.1)} q0 -0.1 0.1 -0.1 H${n2(w - 0.1)} q0.1 0 0.1 0.1 V${n2(h / 2 - 0.1)} q0 0.1 -0.1 0.1 H0.1 q-0.1 0 -0.1 -0.1 Z`;
  return (
    <g>
      <rect x={0.06} y={-h / 2 + 0.08} width={w} height={h} rx={0.1} fill="#000" opacity={0.45} filter="url(#ps-blur-md)" />
      <Painted d={d} paint={paint} />
      <Seam d={`M0.08 ${n2(-h / 2 + 0.08)} H${n2(w - 0.08)} M0.08 ${n2(h / 2 - 0.08)} H${n2(w - 0.08)}`} />
      {[0, 1].map((i) => [-1, 1].map((s) => <rect key={`${i}${s}`} x={-0.03 + i * (w - 0.04)} y={s * (h / 2 - 0.22) - 0.06} width={0.07} height={0.12} rx={0.01} fill="url(#pk-steel)" stroke="#2b2f33" strokeWidth={0.5} {...SOFT} />))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// The fire kit
// ---------------------------------------------------------------------------

/** A yellow polymer step chock pushed under the sill: three treads, the holes through them, the strap. */
function StepChock({ x, y, side }: { x: number; y: number; side: 1 | -1 }) {
  const w = 0.32, t = 0.075;
  const top = side > 0 ? y : y - 3 * t;
  return (
    <g>
      <rect x={x - w / 2 + 0.02} y={top + 0.03} width={w} height={3 * t} rx={0.02} fill="#000" opacity={0.4} filter="url(#ps-blur-sm)" />
      <rect x={x - w / 2} y={top} width={w} height={3 * t} rx={0.015} fill="#e3b118" {...edge("#e7b31a", 0.55, 0.8, 0.8)} />
      <rect x={x - w / 2} y={top} width={w} height={3 * t} rx={0.015} fill="url(#ps-grain)" opacity={0.6} />
      {[0, 1, 2].map((i) => {
        const sy = top + i * t;
        return (
          <g key={i}>
            <rect x={x - w / 2} y={sy} width={w} height={t} fill="url(#pk-gloss)" />
            <Bevel x={x - w / 2} y={sy} w={w} h={t} d={0.006} light={0.5} dark={0.55} />
            {[-1, 1].map((k) => <ellipse key={k} cx={x + k * w * 0.26} cy={sy + t / 2} rx={0.03} ry={0.015} fill="#5a4409" opacity={0.85} />)}
          </g>
        );
      })}
      <path d={`M${n2(x)} ${n2(top - 0.02)} V${n2(top + 3 * t + 0.02)}`} stroke="#15181c" strokeWidth={0.028} />
      <rect x={x - 0.025} y={top + 1.5 * t - 0.02} width={0.05} height={0.04} rx={0.006} fill="url(#pk-steel)" stroke="#2b2f33" strokeWidth={0.4} {...SOFT} />
    </g>
  );
}

/** A hydraulic ram footed between the A-pillar and the sill: the cylinder, the chrome piston run out, the serrated feet. */
function Ram({ from, to }: { from: Pt; to: Pt }) {
  const u = unit(sub(to, from)), L = len(sub(to, from)), a = deg(u);
  return (
    <g transform={`translate(${P(from)}) rotate(${n2(a)})`}>
      <rect x={0.02} y={-0.03} width={L} height={0.12} rx={0.04} fill="#000" opacity={0.4} filter="url(#ps-blur-sm)" />
      <rect x={0} y={-0.055} width={L * 0.56} height={0.11} rx={0.025} fill="#1b1f23" {...edge("#1b1f23", 0.3, 0.8, 0.8)} />
      <rect x={0.07} y={-0.05} width={L * 0.4} height={0.1} rx={0.02} fill="#e8651a" />
      <rect x={0} y={-0.055} width={L * 0.56} height={0.11} rx={0.025} fill="url(#pk-cyl)" opacity={0.55} />
      <rect x={0} y={-0.055} width={L * 0.56} height={0.11} rx={0.025} fill="url(#ps-grain)" opacity={0.5} />
      <rect x={L * 0.56} y={-0.03} width={L * 0.44 - 0.03} height={0.06} fill="url(#pk-chrome)" stroke="#2b2f33" strokeWidth={0.5} {...SOFT} />
      {[-0.04, L - 0.04].map((x, i) => (
        <g key={i}>
          <rect x={x} y={-0.075} width={0.05} height={0.15} rx={0.008} fill="url(#pk-steel)" stroke="#2b2f33" strokeWidth={0.5} {...SOFT} />
          <path d={`M${n2(x + (i ? 0.05 : 0))} -0.06 ${i ? "l0.01 0.015 l-0.01 0.015 l0.01 0.015 l-0.01 0.015 l0.01 0.015 l-0.01 0.015 l0.01 0.015 l-0.01 0.015" : "l-0.01 0.015 l0.01 0.015 l-0.01 0.015 l0.01 0.015 l-0.01 0.015 l0.01 0.015 l-0.01 0.015 l0.01 0.015"}`} fill="none" stroke="#2b2f33" strokeWidth={0.6} {...SOFT} />
        </g>
      ))}
      <rect x={0.1} y={-0.1} width={0.09} height={0.045} rx={0.012} fill="url(#pk-rubber)" stroke="#0b0e11" strokeWidth={0.5} {...SOFT} />
      <circle cx={-0.03} cy={-0.028} r={0.012} fill="#c0392b" />
      <circle cx={-0.03} cy={0.028} r={0.012} fill="#2b5fb5" />
    </g>
  );
}

/** Hydraulic cutters: the black-and-orange body with its carry handle and control, the steel yoke and the two curved blades on their pivot. Drawn with the hoses at -x and the blades at +x. */
function Cutters({ at, a }: { at: Pt; a: number }) {
  return (
    <g transform={`translate(${P(at)}) rotate(${n2(a)})`}>
      <rect x={-0.04} y={-0.08} width={0.84} height={0.2} rx={0.06} fill="#000" opacity={0.42} filter="url(#ps-blur-sm)" />
      <path d="M-0.06 -0.03 h-0.1 M-0.06 0.03 h-0.1" stroke="#1b1f23" strokeWidth={0.03} strokeLinecap="round" />
      <path d="M-0.06 -0.03 h-0.1" stroke="#c0392b" strokeWidth={0.02} strokeLinecap="round" />
      <path d="M-0.06 0.03 h-0.1" stroke="#2b5fb5" strokeWidth={0.02} strokeLinecap="round" />
      <rect x={-0.07} y={-0.09} width={0.5} height={0.18} rx={0.045} fill="#1b1f23" {...edge("#1b1f23", 0.3, 0.8, 0.8)} />
      <rect x={0.03} y={-0.08} width={0.32} height={0.16} rx={0.035} fill="#e8651a" />
      <rect x={0.03} y={-0.08} width={0.32} height={0.16} rx={0.035} fill="url(#pk-dome)" />
      <rect x={-0.07} y={-0.09} width={0.5} height={0.18} rx={0.045} fill="url(#ps-grain)" opacity={0.5} />
      <Bevel x={-0.07} y={-0.09} w={0.5} h={0.18} rx={0.045} d={0.006} light={0.35} dark={0.5} />
      <rect x={0.12} y={-0.15} width={0.055} height={0.3} rx={0.025} fill="url(#pk-grip)" stroke="#0b0e11" strokeWidth={0.6} {...SOFT} />
      <rect x={0.12} y={-0.15} width={0.055} height={0.3} rx={0.025} fill="url(#pk-gloss)" />
      <circle cx={-0.02} cy={0} r={0.05} fill="url(#pk-rubber)" stroke="#0b0e11" strokeWidth={0.6} {...SOFT} />
      <circle cx={-0.02} cy={0} r={0.028} fill="#2b5fb5" stroke="#0b0e11" strokeWidth={0.5} {...SOFT} />
      <rect x={0.36} y={-0.072} width={0.17} height={0.144} rx={0.015} fill="url(#pk-steel)" stroke="#2b2f33" strokeWidth={0.6} {...SOFT} />
      <path d="M0.48 -0.06 Q0.64 -0.16 0.8 -0.012 Q0.62 -0.06 0.5 -0.005 Z" fill="url(#pk-steel-h)" stroke="#2b2f33" strokeWidth={0.6} strokeLinejoin="round" {...SOFT} />
      <path d="M0.48 0.06 Q0.64 0.16 0.8 0.012 Q0.62 0.06 0.5 0.005 Z" fill="url(#pk-steel-h)" stroke="#2b2f33" strokeWidth={0.6} strokeLinejoin="round" {...SOFT} />
      <path d="M0.52 -0.03 Q0.64 -0.08 0.78 -0.015 M0.52 0.03 Q0.64 0.08 0.78 0.015" fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={1} strokeLinecap="round" {...SOFT} />
      <Screw x={0.5} y={0} r={0.028} />
    </g>
  );
}

/** Hydraulic spreaders: the same body, with two long steel arms opening to serrated tips. */
function Spreaders({ at, a }: { at: Pt; a: number }) {
  return (
    <g transform={`translate(${P(at)}) rotate(${n2(a)})`}>
      <rect x={-0.04} y={-0.1} width={1.06} height={0.24} rx={0.06} fill="#000" opacity={0.42} filter="url(#ps-blur-sm)" />
      <path d="M-0.06 -0.03 h-0.1 M-0.06 0.03 h-0.1" stroke="#1b1f23" strokeWidth={0.03} strokeLinecap="round" />
      <path d="M-0.06 -0.03 h-0.1" stroke="#c0392b" strokeWidth={0.02} strokeLinecap="round" />
      <path d="M-0.06 0.03 h-0.1" stroke="#2b5fb5" strokeWidth={0.02} strokeLinecap="round" />
      <rect x={-0.07} y={-0.085} width={0.52} height={0.17} rx={0.045} fill="#1b1f23" {...edge("#1b1f23", 0.3, 0.8, 0.8)} />
      <rect x={0.03} y={-0.075} width={0.34} height={0.15} rx={0.035} fill="#e8651a" />
      <rect x={0.03} y={-0.075} width={0.34} height={0.15} rx={0.035} fill="url(#pk-dome)" />
      <rect x={-0.07} y={-0.085} width={0.52} height={0.17} rx={0.045} fill="url(#ps-grain)" opacity={0.5} />
      <Bevel x={-0.07} y={-0.085} w={0.52} h={0.17} rx={0.045} d={0.006} light={0.35} dark={0.5} />
      <rect x={0.13} y={-0.15} width={0.055} height={0.3} rx={0.025} fill="url(#pk-grip)" stroke="#0b0e11" strokeWidth={0.6} {...SOFT} />
      <rect x={0.13} y={-0.15} width={0.055} height={0.3} rx={0.025} fill="url(#pk-gloss)" />
      <circle cx={-0.02} cy={0} r={0.05} fill="url(#pk-rubber)" stroke="#0b0e11" strokeWidth={0.6} {...SOFT} />
      <circle cx={-0.02} cy={0} r={0.028} fill="#2b5fb5" stroke="#0b0e11" strokeWidth={0.5} {...SOFT} />
      <rect x={0.38} y={-0.07} width={0.16} height={0.14} rx={0.015} fill="url(#pk-steel)" stroke="#2b2f33" strokeWidth={0.6} {...SOFT} />
      <path d="M0.48 -0.055 L0.98 -0.15 l0.012 0.012 l-0.012 0.012 l0.012 0.012 l-0.012 0.012 l0.012 0.012 L0.52 0 Z" fill="url(#pk-steel-h)" stroke="#2b2f33" strokeWidth={0.6} strokeLinejoin="round" {...SOFT} />
      <path d="M0.48 0.055 L0.98 0.15 l0.012 -0.012 l-0.012 -0.012 l0.012 -0.012 l-0.012 -0.012 l0.012 -0.012 L0.52 0 Z" fill="url(#pk-steel-h)" stroke="#2b2f33" strokeWidth={0.6} strokeLinejoin="round" {...SOFT} />
      <path d="M0.54 -0.04 L0.95 -0.125 M0.54 0.04 L0.95 0.125" fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={0.9} strokeLinecap="round" {...SOFT} />
      <Screw x={0.5} y={0} r={0.028} />
    </g>
  );
}

/** The hydraulic power unit: the petrol engine in its tube frame, the recoil starter, the tank, the exhaust, the manifold the hoses run from, the spare hose coiled beside it. */
function PowerUnit({ at }: { at: Pt }) {
  return (
    <g transform={`translate(${P(at)})`}>
      <rect x={0.04} y={0.05} width={0.56} height={0.44} rx={0.06} fill="#000" opacity={0.45} filter="url(#ps-blur-md)" />
      <circle cx={0.74} cy={0.26} r={0.19} fill="#000" opacity={0.35} filter="url(#ps-blur-sm)" />
      <rect x={0} y={0} width={0.56} height={0.44} rx={0.06} fill="none" stroke="url(#pk-steel)" strokeWidth={0.028} />
      <rect x={0} y={0} width={0.56} height={0.44} rx={0.06} fill="none" stroke="#2b2f33" strokeWidth={0.5} {...SOFT} />
      <rect x={0.07} y={0.06} width={0.27} height={0.32} rx={0.03} fill="#1b1f23" {...edge("#1b1f23", 0.3, 0.8, 0.8)} />
      <rect x={0.07} y={0.06} width={0.27} height={0.32} rx={0.03} fill="url(#ps-grain)" opacity={0.5} />
      <Bevel x={0.07} y={0.06} w={0.27} h={0.32} rx={0.03} d={0.006} light={0.35} dark={0.5} />
      {[0.1, 0.14, 0.18, 0.22, 0.26, 0.3].map((x) => <path key={x} d={`M${n2(x)} 0.3 V0.36`} stroke="#3a3f45" strokeWidth={0.6} {...SOFT} />)}
      <circle cx={0.205} cy={0.19} r={0.085} fill="url(#pk-chrome)" stroke="#2b2f33" strokeWidth={0.5} {...SOFT} />
      <circle cx={0.205} cy={0.19} r={0.06} fill="#1b1f23" />
      <circle cx={0.205} cy={0.19} r={0.06} fill="url(#pk-dome)" />
      <rect x={0.26} y={0.165} width={0.06} height={0.05} rx={0.01} fill="#c0392b" stroke="#0b0e11" strokeWidth={0.4} {...SOFT} />
      <rect x={0.36} y={0.06} width={0.15} height={0.2} rx={0.025} fill="#c0392b" {...edge("#c0392b", 0.5, 0.8, 0.8)} />
      <rect x={0.36} y={0.06} width={0.15} height={0.2} rx={0.025} fill="url(#pk-dome)" />
      <circle cx={0.435} cy={0.11} r={0.03} fill="#1b1f23" stroke="#5a1d1d" strokeWidth={0.4} {...SOFT} />
      <rect x={0.36} y={0.3} width={0.15} height={0.06} rx={0.02} fill="url(#pk-steel-h)" stroke="#2b2f33" strokeWidth={0.4} {...SOFT} />
      <rect x={0.5} y={0.14} width={0.07} height={0.16} rx={0.01} fill="url(#pk-steel)" stroke="#2b2f33" strokeWidth={0.5} {...SOFT} />
      <circle cx={0.57} cy={0.18} r={0.02} fill="#c0392b" stroke="#0b0e11" strokeWidth={0.4} {...SOFT} />
      <circle cx={0.57} cy={0.26} r={0.02} fill="#2b5fb5" stroke="#0b0e11" strokeWidth={0.4} {...SOFT} />
      <g transform="translate(0.74 0.26)">
        {[0.17, 0.145, 0.12, 0.095, 0.07].map((r, i) => <circle key={r} r={r} fill="none" stroke={i % 2 ? "#2b5fb5" : "#c0392b"} strokeWidth={0.024} />)}
        {[0.17, 0.145, 0.12, 0.095, 0.07].map((r) => <path key={r} d={`M${n2(-r * 0.7)} ${n2(-r * 0.7)} A${n2(r)} ${n2(r)} 0 0 1 ${n2(r * 0.2)} ${n2(-r * 0.98)}`} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={0.6} {...SOFT} />)}
      </g>
    </g>
  );
}

/** The salvage sheet the tools are laid out on: heavy PVC, its creases and its eyelets. */
function SalvageSheet({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x + 0.03} y={y + 0.03} width={w} height={h} rx={0.03} fill="#000" opacity={0.3} filter="url(#ps-blur-sm)" />
      <rect x={x} y={y} width={w} height={h} rx={0.02} fill="#2a333c" {...edge("#2a333c", 0.5, 0.8, 0.9)} />
      <rect x={x} y={y} width={w} height={h} rx={0.02} fill="url(#pk-weave)" />
      <rect x={x} y={y} width={w} height={h} rx={0.02} fill="url(#ps-grain)" opacity={0.6} />
      <g filter="url(#ps-blur-md)">
        <path d={`M${n2(x + 0.2)} ${n2(y + h)} L${n2(x + w * 0.45)} ${n2(y)}`} stroke="#fff" strokeOpacity={0.09} strokeWidth={0.05} />
        <path d={`M${n2(x + w * 0.6)} ${n2(y + h)} L${n2(x + w * 0.9)} ${n2(y + 0.1)}`} stroke="#fff" strokeOpacity={0.07} strokeWidth={0.04} />
        <path d={`M${n2(x)} ${n2(y + h * 0.6)} L${n2(x + w)} ${n2(y + h * 0.5)}`} stroke="#000" strokeOpacity={0.18} strokeWidth={0.04} />
      </g>
      <path d={`M${n2(x + 0.04)} ${n2(y + h - 0.04)} H${n2(x + w - 0.04)}`} stroke="#fff" strokeOpacity={0.12} strokeWidth={1.2} {...SOFT} />
      {[[x + 0.06, y + 0.06], [x + w - 0.06, y + 0.06], [x + 0.06, y + h - 0.06], [x + w - 0.06, y + h - 0.06], [x + w / 2, y + 0.06], [x + w / 2, y + h - 0.06]].map(([ex, ey], i) => (
        <circle key={i} cx={ex} cy={ey} r={0.018} fill="#0d1116" stroke="url(#pk-chrome)" strokeWidth={0.009} />
      ))}
    </g>
  );
}

/** The twin hydraulic hoses run from the power unit to the tool in use, with slack in them. */
function Hoses({ from, to }: { from: Pt; to: Pt }) {
  const d0 = sub(to, from);
  const u = unit(d0), n = perp(u), L = len(d0);
  const pts: Pt[] = [from, add(add(from, mul(u, L * 0.3)), mul(n, 0.35)), add(add(from, mul(u, L * 0.7)), mul(n, -0.15)), to];
  const off = (k: number) => pts.map((p) => add(p, mul(n, k)));
  return (
    <g fill="none" strokeLinecap="round">
      <path d={smoothOpen(pts, 0.5)} stroke="#000" strokeWidth={0.07} strokeOpacity={0.25} transform="translate(0.02 0.03)" />
      {[[0.016, "#c0392b"], [-0.016, "#2b5fb5"]].map(([k, c]) => (
        <g key={c as string}>
          <path d={smoothOpen(off(k as number), 0.5)} stroke={darken(c as string, 0.45)} strokeWidth={0.028} />
          <path d={smoothOpen(off(k as number), 0.5)} stroke={c as string} strokeWidth={0.02} />
          <path d={smoothOpen(off((k as number) - 0.005), 0.5)} stroke="#fff" strokeWidth={0.005} strokeOpacity={0.35} />
        </g>
      ))}
    </g>
  );
}

/** A long board: the orange shell, the handholds through it, the pins, the straps lying across it. */
function Longboard({ x, y }: { x: number; y: number }) {
  const w = 1.85, h = 0.46;
  return (
    <g>
      <rect x={x + 0.04} y={y + 0.05} width={w} height={h} rx={0.12} fill="#000" opacity={0.42} filter="url(#ps-blur-md)" />
      <rect x={x} y={y} width={w} height={h} rx={0.12} fill="#e8731f" {...edge("#e8731f", 0.5, 0.8, 0.9)} />
      <rect x={x} y={y} width={w} height={h} rx={0.12} fill="url(#ps-round-v)" opacity={0.55} />
      <rect x={x} y={y} width={w} height={h} rx={0.12} fill="url(#ps-grain)" opacity={0.6} />
      <rect x={x + 0.1} y={y + 0.15} width={w - 0.2} height={h - 0.3} rx={0.06} fill="#fff" opacity={0.07} />
      {[0.22, 0.56, 0.9, 1.24, 1.58].map((dx) => [0.035, h - 0.1].map((dy) => (
        <g key={`${dx}${dy}`}>
          <rect x={x + dx} y={y + dy} width={0.1} height={0.065} rx={0.03} fill="#4a2208" opacity={0.9} />
          <rect x={x + dx + 0.006} y={y + dy + 0.006} width={0.088} height={0.053} rx={0.026} fill="#1b1b1b" />
        </g>
      )))}
      {[0.45, 1.0, 1.45].map((dx) => (
        <g key={dx}>
          <rect x={x + dx} y={y - 0.03} width={0.05} height={h + 0.06} fill="#15181c" />
          <rect x={x + dx - 0.004} y={y + h / 2 - 0.03} width={0.058} height={0.06} rx={0.006} fill="url(#pk-steel)" stroke="#2b2f33" strokeWidth={0.4} {...SOFT} />
        </g>
      ))}
    </g>
  );
}

/** A traffic cone from above: its rubber base, the orange cone lit from the top left, the reflective collar round it. */
function Cone({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 0.15} y={y - 0.14} width={0.36} height={0.36} rx={0.03} fill="#000" opacity={0.4} filter="url(#ps-blur-sm)" />
      <rect x={x - 0.18} y={y - 0.18} width={0.36} height={0.36} rx={0.03} fill="url(#pk-rubber)" stroke="#0b0e11" strokeWidth={0.8} {...SOFT} />
      <Bevel x={x - 0.18} y={y - 0.18} w={0.36} h={0.36} rx={0.03} d={0.01} light={0.25} dark={0.5} />
      <circle cx={x} cy={y} r={0.145} fill="url(#pr-cone)" stroke="#5a2408" strokeWidth={0.6} {...SOFT} />
      <circle cx={x} cy={y} r={0.1} fill="#f1efe8" />
      <circle cx={x} cy={y} r={0.1} fill="url(#ps-grain)" />
      <circle cx={x} cy={y} r={0.1} fill="url(#pr-cone-shade)" />
      <circle cx={x} cy={y} r={0.062} fill="url(#pr-cone)" />
      <circle cx={x} cy={y} r={0.02} fill="#2b1206" />
      <ellipse cx={x - 0.05} cy={y - 0.055} rx={0.035} ry={0.018} fill="#fff" opacity={0.35} transform={`rotate(-45 ${n2(x)} ${n2(y)})`} />
    </g>
  );
}

/** Tempered glass on the road: cubes of it, each catching a glint. */
function GlassBits({ x, y, n = 9, seed = 1 }: { x: number; y: number; n?: number; seed?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const a = ((i * 97 + seed * 31) % 360);
        const dx = (((i * 53 + seed * 17) % 100) / 100 - 0.5) * 0.9;
        const dy = (((i * 71 + seed * 13) % 100) / 100 - 0.5) * 0.5;
        return (
          <g key={i} transform={`translate(${n2(x + dx)} ${n2(y + dy)}) rotate(${a})`}>
            <polygon points="0.004,-0.026 0.039,0.014 -0.016,0.034" fill="#000" opacity={0.3} />
            <polygon points="0,-0.03 0.035,0.01 -0.02,0.03" fill="#d6ebf5" opacity={0.85} stroke="#8fb0c4" strokeWidth={0.5} {...SOFT} />
            <circle cx={0.004} cy={0} r={0.006} fill="#fff" opacity={0.9} />
          </g>
        );
      })}
    </g>
  );
}

/** The foam blanket over the fuel: a mass of bubbles, its edges thinning. */
function FoamBlanket({ d, seed, clip }: { d: string; seed: number; clip: string }) {
  const r = prng(seed);
  const clusters = Array.from({ length: 14 }, () => [r(), r(), 0.08 + r() * 0.16] as const);
  return (
    <g>
      <path d={d} fill="#e4ddcd" opacity={0.85} filter="url(#ps-blur-md)" />
      <path d={d} fill="url(#pr-foam)" />
      <path d={d} fill="url(#ps-grain)" opacity={0.55} />
      <g clipPath={`url(#${clip})`}>
        {clusters.map(([u, v, rr], i) => <circle key={i} cx={-1.2 + u * 3.2} cy={0.1 + v * 1.3} r={rr} fill="#fff" opacity={0.3} />)}
      </g>
      <path d={d} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={1.2} {...SOFT} />
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
  const hw = sh.W / 2;
  const crumpled = !!casualty?.trapped || extrication !== "none";
  const kitOut = working.length > 0 || done.size > 0 || extrication !== "none";
  const fuel = vehicle.components.find((c) => c.kind === "fuel_tank" && c.action);
  const fuelContained = !!fuel?.action && has(fuel.action.id);
  const seedV = hash(vehicle.id);
  const jobs = new Set(working.map((w) => STRIP(w.key)));

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

  // ---- The kit on the road ---------------------------------------------------------
  // The salvage sheet forward of the nose, the tools on it until one is in
  // use at the car, the power unit's hoses run to whichever it is.
  const sheet = { x: nose - 2.35, y: 0.15, w: 2.1, h: 1.05 };
  const unitAt: Pt = [sheet.x + 1.15, sheet.y + 0.3];
  const coupling: Pt = [unitAt[0] + 0.57, unitAt[1] + 0.22];
  const toolUse: { kind: "spreaders" | "cutters"; at: Pt; a: number } | null =
    jobs.has("doors-off") ? { kind: "spreaders", at: [fd[1] - 0.5, -hw - 0.34], a: 52 }
      : jobs.has("third-door") && sh.rearDoor ? { kind: "spreaders", at: [rd[1] - 0.5, -hw - 0.34], a: 52 }
        : jobs.has("roof-flap") || jobs.has("roof-off") ? { kind: "cutters", at: [sh.roof[0] - 0.62, -hw - 0.3], a: 32 }
          : null;
  const ramAt: [Pt, Pt] | null = dashRoll || jobs.has("dash-roll") ? [[sh.dash[0] - 0.05, -hw + 0.1], [sh.dash[1] + 0.12, -hw + 0.25]] : null;
  const hoseTo: Pt | null = toolUse ? add(toolUse.at, mul([Math.cos((toolUse.a * Math.PI) / 180), Math.sin((toolUse.a * Math.PI) / 180)], -0.16)) : ramAt ? add(ramAt[0], [-0.05, 0]) : null;

  // ---- The shell's parts ---------------------------------------------------------
  const body = bodyPath(sh, crumpled);
  const clipId = `pr-body-${vehicle.id}`;
  const roofRect = { x: sh.roof[0], y: -hw + 0.16, w: sh.roof[1] - sh.roof[0], h: sh.W - 0.32 };
  const roofPath = `M${n2(roofRect.x + 0.1)} ${n2(roofRect.y)} H${n2(roofRect.x + roofRect.w - 0.1)} q0.1 0 0.1 0.1 V${n2(roofRect.y + roofRect.h - 0.1)} q0 0.1 -0.1 0.1 H${n2(roofRect.x + 0.1)} q-0.1 0 -0.1 -0.1 V${n2(roofRect.y + 0.1)} q0 -0.1 0.1 -0.1 Z`;
  const screenPath = (x0: number, x1: number, y0: number, y1: number) => `M${n2(x0)} ${n2(y0 + 0.08)} Q${n2(x0)} ${n2(y0)} ${n2(x0 + 0.1)} ${n2(y0)} L${n2(x1)} ${n2(y0 + 0.02)} L${n2(x1)} ${n2(y1 - 0.02)} L${n2(x0 + 0.1)} ${n2(y1)} Q${n2(x0)} ${n2(y1)} ${n2(x0)} ${n2(y1 - 0.08)} Z`;
  const windscreen = screenPath(sh.cabin[0], sh.roof[0] - 0.03, -hw + 0.2, hw - 0.2);
  const rearScreen = sh.van ? null : `M${n2(sh.roof[1] + 0.03)} ${n2(-hw + 0.22)} L${n2(sh.cabin[1])} ${n2(-hw + 0.3)} Q${n2(sh.cabin[1] + 0.05)} 0 ${n2(sh.cabin[1])} ${n2(hw - 0.3)} L${n2(sh.roof[1] + 0.03)} ${n2(hw - 0.22)} Z`;
  const sideWindow = (x0: number, x1: number, side: 1 | -1) => `M${n2(x0 + 0.04)} ${n2(side * (hw - 0.03))} L${n2(x1 - 0.04)} ${n2(side * (hw - 0.03))} L${n2(x1 - 0.1)} ${n2(side * (hw - 0.2))} L${n2(x0 + 0.1)} ${n2(side * (hw - 0.2))} Z`;
  const doorPanel = (x0: number, x1: number, side: 1 | -1) => `M${n2(x0)} ${n2(side * (hw + 0.02))} L${n2(x1)} ${n2(side * (hw + 0.02))} L${n2(x1)} ${n2(side * (hw - 0.26))} L${n2(x0)} ${n2(side * (hw - 0.26))} Z`;
  const driverFront = doorsOff, driverRear = thirdDoor;
  const roofAt: Pt = roofFlap ? [sh.roof[0] + (sh.van ? 1.3 : 1.45), 0] : roofOff ? [tail + 0.45, -0.45] : [sh.roof[0], 0];
  const comps = components ? vehicle.components.map((c) => ({ c, p: onShell(c, sh) })) : [];
  const pillar = (p: Pt, q: Pt, wa: number, wb: number, key: string) => (
    <g key={key}>
      <path d={capsule(p, q, wa, wb)} fill={darken(paint, 0.12)} {...edge(paint, 0.6, 0.75, 0.8)} />
      <path d={capsule(p, q, wa, wb)} fill="url(#pk-gloss)" />
    </g>
  );
  const fuelAt = fuel ? onShell(fuel, sh) : null;
  const foamPath = fuelAt ? smooth([[fuelAt.x - 0.9, hw + 0.1], [fuelAt.x + 0.2, hw - 0.05], [fuelAt.x + 1.6, hw + 0.15], [fuelAt.x + 1.9, hw + 0.7], [fuelAt.x + 1.4, hw + 1.25], [fuelAt.x + 0.2, hw + 1.3], [fuelAt.x - 0.9, hw + 1.0], [fuelAt.x - 1.2, hw + 0.55]], 0.6) : null;
  const foamClip = `pr-foam-${vehicle.id}`;

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
          {/* Paint: the body's curve across its width, the sky's gleam down its crown, a lamp's lens, the sky in the glass, a cone's shading, the bubbles of foam. */}
          <linearGradient id="pr-body-v" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0.42" />
            <stop offset="0.1" stopColor="#000" stopOpacity="0.12" />
            <stop offset="0.3" stopColor="#fff" stopOpacity="0.14" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.24" />
            <stop offset="0.7" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="0.9" stopColor="#000" stopOpacity="0.14" />
            <stop offset="1" stopColor="#000" stopOpacity="0.46" />
          </linearGradient>
          <linearGradient id="pr-gleam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.37" stopColor="#fff" stopOpacity="0.22" />
            <stop offset="0.43" stopColor="#fff" stopOpacity="0.06" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pr-slope-x" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity="0.32" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pr-slope-xr" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity="0.28" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="pr-lamp" cx="0.35" cy="0.4" r="0.7">
            <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="0.35" stopColor="#fff" stopOpacity="0.2" />
            <stop offset="1" stopColor="#000" stopOpacity="0.45" />
          </radialGradient>
          <linearGradient id="pr-screen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#cfdbe4" stopOpacity="0.62" />
            <stop offset="0.5" stopColor="#8aa0b1" stopOpacity="0.5" />
            <stop offset="0.86" stopColor="#3f5566" stopOpacity="0.72" />
            <stop offset="1" stopColor="#1e2b36" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="pr-screen-r" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor="#cfdbe4" stopOpacity="0.62" />
            <stop offset="0.5" stopColor="#8aa0b1" stopOpacity="0.5" />
            <stop offset="0.86" stopColor="#3f5566" stopOpacity="0.72" />
            <stop offset="1" stopColor="#1e2b36" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="pr-side-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#b7c8d4" stopOpacity="0.7" />
            <stop offset="0.5" stopColor="#6f8899" stopOpacity="0.55" />
            <stop offset="1" stopColor="#3b4f5e" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="pr-tyre" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity="0.55" />
            <stop offset="0.3" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.22" />
            <stop offset="0.7" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="1" stopColor="#000" stopOpacity="0.55" />
          </linearGradient>
          <pattern id="pr-tread" width="0.03" height="0.016" patternUnits="userSpaceOnUse">
            <path d="M0.008 0 V0.016 M0.02 0 V0.016" stroke="#07090b" strokeWidth="0.004" />
            <path d="M0.014 0.002 V0.006 M0.026 0.009 V0.014" stroke="#30353a" strokeWidth="0.0015" />
          </pattern>
          <radialGradient id="pr-cone" cx="0.36" cy="0.34" r="0.7">
            <stop offset="0" stopColor="#ffb880" />
            <stop offset="0.35" stopColor="#f26d1f" />
            <stop offset="0.75" stopColor="#c44a0d" />
            <stop offset="1" stopColor="#6e2606" />
          </radialGradient>
          <radialGradient id="pr-cone-shade" cx="0.36" cy="0.34" r="0.7">
            <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.45" />
          </radialGradient>
          <pattern id="pr-foam" width="0.14" height="0.14" patternUnits="userSpaceOnUse">
            <rect width="0.14" height="0.14" fill="#ece6d8" />
            {[[0.03, 0.03, 0.024], [0.09, 0.02, 0.018], [0.12, 0.07, 0.022], [0.06, 0.08, 0.03], [0.02, 0.11, 0.016], [0.1, 0.12, 0.02]].map(([cx, cy, rr], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r={rr} fill="#f6f2ea" stroke="#d3cab7" strokeWidth="0.0025" />
                <circle cx={cx - rr * 0.35} cy={cy - rr * 0.35} r={rr * 0.3} fill="#fff" fillOpacity="0.8" />
              </g>
            ))}
          </pattern>
          <pattern id="pr-film" width="0.05" height="0.05" patternUnits="userSpaceOnUse"><path d="M0 0.05 L0.05 0 M-0.01 0.01 L0.01 -0.01 M0.04 0.06 L0.06 0.04" stroke="#fff" strokeWidth="0.004" strokeOpacity="0.55" /></pattern>
          <radialGradient id="pr-spill" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#0d1116" stopOpacity="0.9" /><stop offset="0.7" stopColor="#0d1116" stopOpacity="0.6" /><stop offset="1" stopColor="#0d1116" stopOpacity="0" /></radialGradient>
          <clipPath id={clipId}><path d={body} /></clipPath>
          {foamPath && <clipPath id={foamClip}><path d={foamPath} /></clipPath>}
        </defs>
        <g transform={`translate(${n2(ox)} ${n2(oy)}) scale(${s.toFixed(2)})`}>
          {/* The carriageway: tarmac, the lane line, the hard-shoulder edge, skid marks, the glass, the coolant from the split radiator. */}
          <Tarmac x={-8} y={-4} w={16} h={8} seed={seedV} lanes={[0]} />
          <rect x={-8} y={hw + 1.5} width={16} height={0.14} fill="#f4f4f0" opacity={0.8} />
          <rect x={-8} y={hw + 1.5} width={16} height={0.14} fill="url(#ps-grain)" />
          {Array.from({ length: 14 }, (_, i) => <rect key={i} x={-8 + i * 1.2} y={-hw - 1.48} width={0.6} height={0.12} fill="#f4f4f0" opacity={0.7} />)}
          <g opacity={0.5}>
            <path d={`M${n2(nose + 0.3)} ${n2(-hw + 0.3)} q-1.6 0.1 -2.6 0.5`} stroke="#1b1f24" strokeWidth={0.18} fill="none" strokeLinecap="round" />
            <path d={`M${n2(nose + 0.3)} ${n2(hw - 0.3)} q-1.6 0.1 -2.6 0.5`} stroke="#1b1f24" strokeWidth={0.18} fill="none" strokeLinecap="round" />
            <path d={`M${n2(nose + 0.3)} ${n2(-hw + 0.3)} q-1.6 0.1 -2.6 0.5 M${n2(nose + 0.3)} ${n2(hw - 0.3)} q-1.6 0.1 -2.6 0.5`} stroke="#000" strokeWidth={0.18} fill="none" strokeLinecap="round" strokeDasharray="0.05 0.08" opacity={0.5} />
          </g>
          {crumpled && <path d={smooth([[nose - 0.5, -0.3], [nose - 0.1, -0.5], [nose + 0.25, -0.2], [nose + 0.2, 0.3], [nose - 0.2, 0.55], [nose - 0.6, 0.2]], 0.6)} fill="#5fb597" opacity={0.14} />}
          {crumpled && <path d={smooth([[nose - 0.5, -0.3], [nose - 0.1, -0.5], [nose + 0.25, -0.2], [nose + 0.2, 0.3], [nose - 0.2, 0.55], [nose - 0.6, 0.2]], 0.6)} fill="url(#ps-sheen)" opacity={0.35} />}
          <GlassBits x={nose - 0.7} y={0.2} seed={3} />
          <GlassBits x={nose - 0.2} y={-0.9} n={6} seed={7} />
          {/* Fuel on the road from a split tank, and the foam blanket over it once it is contained. */}
          {fuelAt && foamPath && (
            <g>
              <path d={smooth([[fuelAt.x - 0.7, hw + 0.05], [fuelAt.x + 0.3, hw - 0.02], [fuelAt.x + 1.1, hw + 0.2], [fuelAt.x + 1.3, hw + 0.6], [fuelAt.x + 0.8, hw + 0.95], [fuelAt.x - 0.1, hw + 0.9], [fuelAt.x - 0.8, hw + 0.6]], 0.6)} fill="#0d1116" opacity={0.7} />
              <path d={smooth([[fuelAt.x - 0.5, hw + 0.15], [fuelAt.x + 0.3, hw + 0.08], [fuelAt.x + 0.9, hw + 0.3], [fuelAt.x + 1.0, hw + 0.6], [fuelAt.x + 0.6, hw + 0.8], [fuelAt.x - 0.1, hw + 0.75], [fuelAt.x - 0.6, hw + 0.5]], 0.6)} fill="url(#ps-sheen)" opacity={0.7} />
              <path d={smooth([[fuelAt.x - 0.5, hw + 0.15], [fuelAt.x + 0.3, hw + 0.08], [fuelAt.x + 0.9, hw + 0.3], [fuelAt.x + 1.0, hw + 0.6], [fuelAt.x + 0.6, hw + 0.8], [fuelAt.x - 0.1, hw + 0.75], [fuelAt.x - 0.6, hw + 0.5]], 0.6)} fill="#4cb3ff" opacity={0.08} />
              {fuelContained && <g transform={`translate(${n2(fuelAt.x)} ${n2(hw)})`}><g transform={`translate(${n2(-fuelAt.x)} ${n2(-hw)})`}><FoamBlanket d={foamPath} seed={seedV} clip={foamClip} /></g></g>}
            </g>
          )}
          {/* The salvage sheet forward of the nose, the tools on it, the power unit and its hoses run to the tool in use. */}
          {kitOut && (
            <g>
              <SalvageSheet x={sheet.x} y={sheet.y} w={sheet.w} h={sheet.h} />
              {toolUse?.kind !== "cutters" && <Cutters at={[sheet.x + 0.2, sheet.y + 0.3]} a={-6} />}
              {toolUse?.kind !== "spreaders" && <Spreaders at={[sheet.x + 0.12, sheet.y + 0.76]} a={4} />}
              <PowerUnit at={unitAt} />
              {hoseTo && <Hoses from={coupling} to={hoseTo} />}
              {toolUse?.kind === "cutters" && <Cutters at={toolUse.at} a={toolUse.a} />}
              {toolUse?.kind === "spreaders" && <Spreaders at={toolUse.at} a={toolUse.a} />}
            </g>
          )}
          {kitOut && <KitBag at={[tail + 0.55, hw + 1.1]} />}
          {/* Chocks under the sills. */}
          {stabilised && [sh.wheels[0] + 0.45, sh.wheels[1] - 0.45].map((x, i) => <g key={i}><StepChock x={x} y={-hw + 0.1} side={-1} /><StepChock x={x} y={hw - 0.1} side={1} /></g>)}
          {/* The car's shadow, then the shell. */}
          <path d={body} fill="#000" opacity={0.45} filter="url(#pr-car-shadow)" transform="translate(0.08 0.1)" />
          <path d={body} fill="#000" opacity={0.4} filter="url(#ps-blur-md)" transform="translate(0.02 0.03)" />
          <g>
            {/* Tyres under the shell, their tread crowns catching the light. */}
            {sh.wheels.map((x) => [-1, 1].map((side) => {
              const y = side * (hw - 0.02) - (side > 0 ? 0.12 : 0.14);
              return (
                <g key={`${x}${side}`}>
                  <rect x={x - 0.33} y={y} width={0.66} height={0.26} rx={0.06} fill="#121518" />
                  <rect x={x - 0.33} y={y} width={0.66} height={0.26} rx={0.06} fill="url(#pr-tread)" />
                  <rect x={x - 0.33} y={y} width={0.66} height={0.26} rx={0.06} fill="url(#pr-tyre)" />
                  <rect x={x - 0.33} y={y} width={0.66} height={0.26} rx={0.06} fill="none" stroke="#3a3f45" strokeWidth={0.8} strokeOpacity={0.7} {...SOFT} />
                </g>
              );
            }))}
            {/* Mirrors poke out from the doors. */}
            {!doorsOff && <Mirror x={fd[0] + 0.05} side={-1} hw={hw} paint={paint} />}
            <Mirror x={fd[0] + 0.05} side={1} hw={hw} paint={paint} />
            {/* The shell: paint, the curve of the body across it, the bonnet and the boot sloping away, the clearcoat's gleam. */}
            <Painted d={body} paint={paint} gleam={false} />
            <g clipPath={`url(#${clipId})`}>
              <rect x={nose} y={-hw} width={sh.cabin[0] - nose} height={sh.W} fill="url(#pr-slope-x)" />
              {!sh.van && <rect x={sh.cabin[1]} y={-hw} width={tail - sh.cabin[1]} height={sh.W} fill="url(#pr-slope-xr)" />}
              <ellipse cx={(nose + sh.cabin[0]) / 2} cy={-hw * 0.3} rx={(sh.cabin[0] - nose) * 0.42} ry={0.12} fill="#fff" opacity={0.2} filter="url(#ps-blur-md)" />
              <ellipse cx={(nose + sh.cabin[0]) / 2} cy={-hw * 0.3} rx={(sh.cabin[0] - nose) * 0.36} ry={0.025} fill="#fff" opacity={0.3} filter="url(#ps-blur-sm)" />
              {!sh.van && <ellipse cx={(tail + sh.cabin[1]) / 2} cy={-hw * 0.3} rx={(tail - sh.cabin[1]) * 0.4} ry={0.1} fill="#fff" opacity={0.18} filter="url(#ps-blur-md)" />}
              {sh.van && <ellipse cx={(tail + sh.cabin[1]) / 2} cy={-hw * 0.35} rx={(tail - sh.cabin[1]) * 0.44} ry={0.16} fill="#fff" opacity={0.16} filter="url(#ps-blur-md)" />}
              {sh.van && <ellipse cx={(tail + sh.cabin[1]) / 2} cy={-hw * 0.35} rx={(tail - sh.cabin[1]) * 0.4} ry={0.03} fill="#fff" opacity={0.3} filter="url(#ps-blur-sm)" />}
              {/* The wheel arches: the dark gap round each tyre, the tread showing in it. */}
              {sh.wheels.map((x) => [-1, 1].map((side) => (
                <g key={`${x}${side}`}>
                  <rect x={x - 0.37} y={side < 0 ? -hw - 0.02 : hw - 0.13} width={0.74} height={0.15} rx={0.06} fill="#07090b" />
                  <rect x={x - 0.3} y={side < 0 ? -hw + 0.015 : hw - 0.115} width={0.6} height={0.1} rx={0.03} fill="#121518" />
                  <rect x={x - 0.3} y={side < 0 ? -hw + 0.015 : hw - 0.115} width={0.6} height={0.1} rx={0.03} fill="url(#pr-tread)" />
                  <rect x={x - 0.3} y={side < 0 ? -hw + 0.015 : hw - 0.115} width={0.6} height={0.1} rx={0.03} fill="url(#pr-tyre)" />
                  <path d={`M${n2(x - 0.36)} ${n2(side < 0 ? -hw + 0.13 : hw - 0.13)} H${n2(x + 0.36)}`} stroke="#fff" strokeOpacity={0.22} strokeWidth={1} {...SOFT} />
                </g>
              )))}
              {/* The crush. */}
              {crumpled && <Crumple nose={nose} hw={hw} seed={seedV} />}
            </g>
            {/* Panel gaps: the bonnet, the doors, the boot; the van's box and its doors. */}
            <Seam d={`M${n2(nose + 0.5)} ${n2(-hw + 0.3)} L${n2(sh.cabin[0] - 0.05)} ${n2(-hw + 0.1)} M${n2(nose + 0.5)} ${n2(hw - 0.3)} L${n2(sh.cabin[0] - 0.05)} ${n2(hw - 0.1)} M${n2(nose + 0.5)} ${n2(-hw + 0.3)} Q${n2(nose + 0.38)} 0 ${n2(nose + 0.5)} ${n2(hw - 0.3)}`} />
            {!sh.van && <Seam d={`M${n2(sh.cabin[1] + 0.1)} ${n2(-hw + 0.3)} L${n2(tail - 0.2)} ${n2(-hw + 0.4)} M${n2(sh.cabin[1] + 0.1)} ${n2(hw - 0.3)} L${n2(tail - 0.2)} ${n2(hw - 0.4)} M${n2(tail - 0.2)} ${n2(-hw + 0.4)} Q${n2(tail - 0.12)} 0 ${n2(tail - 0.2)} ${n2(hw - 0.4)}`} />}
            {!sh.van && <Seam d={`M${n2(sh.cabin[1] + 0.12)} ${n2(-hw + 0.3)} Q${n2(sh.cabin[1] + 0.2)} 0 ${n2(sh.cabin[1] + 0.12)} ${n2(hw - 0.3)}`} dark={0.35} light={0.18} />}
            {/* The bumper's dark plastic across the crushed nose. */}
            {crumpled && <path d={`M${n2(nose)} ${n2(-hw + 0.35)} L${n2(nose + 0.35)} ${n2(-hw + 0.5)} L${n2(nose + 0.2)} 0 L${n2(nose + 0.35)} ${n2(hw - 0.5)} L${n2(nose)} ${n2(hw - 0.35)}`} fill="#1b1f24" opacity={0.4} />}
            {sh.van && (
              <g>
                {/* The box: the step down to the cab's roof, the roof's ribs, the gutter, the sliding door's track, the rear doors' split and their hinges, the roof vent. */}
                <rect x={sh.cabin[1]} y={-hw} width={0.14} height={sh.W} fill="url(#pr-slope-x)" clipPath={`url(#${clipId})`} />
                <Seam d={`M${n2(sh.cabin[1] + 0.05)} ${n2(-hw + 0.1)} V${n2(hw - 0.1)}`} dark={0.6} light={0.3} w={1.1} />
                <rect x={sh.cabin[1] + 0.12} y={-hw + 0.12} width={tail - sh.cabin[1] - 0.26} height={sh.W - 0.24} rx={0.08} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={0.9} {...SOFT} />
                {Array.from({ length: Math.floor((tail - sh.cabin[1] - 0.4) / 0.55) }, (_, i) => <Seam key={i} d={`M${n2(sh.cabin[1] + 0.42 + i * 0.55)} ${n2(-hw + 0.16)} V${n2(hw - 0.16)}`} dark={0.28} light={0.22} />)}
                <Seam d={`M${n2(sh.cabin[1] + 0.2)} ${n2(hw - 0.03)} h1.35`} dark={0.6} light={0.25} w={1.2} />
                <Seam d={`M${n2(tail - 0.1)} ${n2(-hw + 0.32)} V${n2(hw - 0.32)}`} dark={0.6} light={0.25} w={1.1} />
                {[-1, 1].map((side) => [0.4, 0.75].map((dy) => <rect key={`${side}${dy}`} x={tail - 0.06} y={side * (hw - dy) - 0.03} width={0.05} height={0.06} rx={0.008} fill={darken(paint, 0.4)} />))}
                <rect x={sh.cabin[1] + 0.9} y={-0.14} width={0.28} height={0.28} rx={0.03} fill={darken(paint, 0.12)} stroke="#000" strokeOpacity={0.35} strokeWidth={0.8} {...SOFT} />
                <rect x={sh.cabin[1] + 0.9} y={-0.14} width={0.28} height={0.28} rx={0.03} fill="url(#pk-dome)" />
              </g>
            )}
            {/* The cabin: carpet, seats, the console between them, the back seat. */}
            <rect x={sh.cabin[0]} y={-hw + 0.16} width={sh.cabin[1] - sh.cabin[0]} height={sh.W - 0.32} fill="#26292e" />
            <rect x={sh.cabin[0]} y={-hw + 0.16} width={sh.cabin[1] - sh.cabin[0]} height={sh.W - 0.32} fill="url(#ps-grain)" />
            {[-1, 1].map((side) => (
              <g key={side} transform={`rotate(90 ${n2(sh.seat[0])} ${n2(side * Math.abs(sh.seat[1]))})`}>
                <CarSeat x={sh.seat[0]} y={side * Math.abs(sh.seat[1])} w={0.54} colour="#2b2f36" />
              </g>
            ))}
            {!sh.van && (
              <g>
                <rect x={sh.cabin[1] - 0.62} y={-hw + 0.24} width={0.52} height={sh.W - 0.48} rx={0.08} fill="#2b2f36" {...edge("#2b2f36", 0.5, 0.7, 0.8)} />
                <rect x={sh.cabin[1] - 0.62} y={-hw + 0.24} width={0.52} height={sh.W - 0.48} rx={0.08} fill="url(#ps-round)" opacity={0.5} />
                <rect x={sh.cabin[1] - 0.62} y={-hw + 0.24} width={0.52} height={sh.W - 0.48} rx={0.08} fill="url(#ps-grain)" />
                {[-1, 1].map((side) => <rect key={side} x={sh.cabin[1] - 0.38} y={side * 0.42 - 0.13} width={0.24} height={0.26} rx={0.06} fill="#1f2328" {...edge("#1f2328", 0.4, 0.7, 0.8)} />)}
              </g>
            )}
            <rect x={sh.seat[0] - 0.3} y={-0.12} width={0.95} height={0.24} rx={0.04} fill="#15191c" {...edge("#15191c", 0.3, 0.8, 0.8)} />
            <rect x={sh.seat[0] - 0.3} y={-0.12} width={0.95} height={0.24} rx={0.04} fill="url(#pk-gloss)" />
            <circle cx={sh.seat[0] + 0.02} cy={0} r={0.035} fill="url(#pk-chrome)" stroke="#2b2f33" strokeWidth={0.5} {...SOFT} />
            <circle cx={sh.seat[0] + 0.02} cy={0} r={0.016} fill="#15191c" />
            <rect x={sh.seat[0] + 0.14} y={-0.03} width={0.2} height={0.06} rx={0.02} fill="#2b3139" {...lineSoft} />
            {[0.42, 0.52].map((dx) => <circle key={dx} cx={sh.seat[0] + dx} cy={0} r={0.035} fill="#0e1114" />)}
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
              <rect x={sh.dash[0] + 0.02} y={-hw + 0.16} width={sh.dash[1] - sh.dash[0]} height={sh.W - 0.32} rx={0.06} fill="#15191c" {...edge("#15191c", 0.3, 0.8, 0.9)} />
              <rect x={sh.dash[0] + 0.02} y={-hw + 0.16} width={sh.dash[1] - sh.dash[0]} height={sh.W - 0.32} rx={0.06} fill="url(#ps-round)" opacity={0.45} />
              <rect x={sh.dash[0] + 0.02} y={-hw + 0.16} width={sh.dash[1] - sh.dash[0]} height={sh.W - 0.32} rx={0.06} fill="url(#ps-grain)" />
              <path d={`M${n2(sh.dash[1] - 0.02)} ${n2(-hw + 0.22)} V${n2(hw - 0.22)}`} stroke="#fff" strokeOpacity={0.18} strokeWidth={1.2} {...SOFT} />
              <rect x={sh.dash[1] - 0.3} y={sh.seat[1] - 0.17} width={0.26} height={0.34} rx={0.05} fill="#0e1114" {...edge("#0e1114", 0.2, 0.8, 0.8)} />
              <rect x={sh.dash[1] - 0.3} y={sh.seat[1] - 0.17} width={0.26} height={0.34} rx={0.05} fill="url(#pk-gloss)" />
              <rect x={sh.dash[1] - 0.24} y={-0.09} width={0.14} height={0.18} rx={0.01} fill="url(#pk-screen)" stroke="#05080b" strokeWidth={0.6} {...SOFT} />
              <rect x={sh.dash[1] - 0.24} y={-0.09} width={0.14} height={0.18} rx={0.01} fill="url(#pk-glass-refl)" />
              {[-1, 1].map((side) => <rect key={side} x={sh.dash[1] - 0.2} y={side * (hw - 0.32) - 0.03} width={0.1} height={0.06} rx={0.01} fill="#0a0c0e" />)}
              <g transform={`translate(${n2(sh.dash[1] + 0.2)} ${n2(sh.seat[1])}) rotate(90)`}>
                <SteeringWheel x={0} y={0} airbag={crumpled} r={0.19} />
              </g>
            </g>
            {ramAt && <Ram from={ramAt[0]} to={ramAt[1]} />}
            {/* Glass: the screen with the sky in it (filmed once managed), the cowl and the wipers, the rear screen with its demister, the side windows (out once managed). */}
            <path d={windscreen} fill="url(#pr-screen)" />
            <path d={windscreen} fill="url(#pk-glass-refl)" />
            <path d={`M${n2(sh.cabin[0] + 0.12)} ${n2(hw - 0.22)} L${n2(sh.roof[0] - 0.16)} ${n2(-hw + 0.4)} L${n2(sh.roof[0] - 0.06)} ${n2(-hw + 0.38)} L${n2(sh.cabin[0] + 0.3)} ${n2(hw - 0.22)} Z`} fill="#fff" opacity={0.1} />
            <path d={windscreen} fill="none" stroke="#0b0e11" strokeWidth={1.1} strokeOpacity={0.9} {...SOFT} />
            {glass && <path d={windscreen} fill="url(#pr-film)" opacity={0.9} />}
            {!glass && crumpled && <path d={`M${n2(sh.cabin[0] + 0.15)} ${n2(-hw + 0.5)} l0.12 0.2 l-0.1 0.18 l0.16 0.14 M${n2(sh.cabin[0] + 0.2)} ${n2(-hw + 0.9)} l0.2 0.12 l0.1 0.2`} fill="none" stroke="#fff" strokeWidth={0.8} strokeOpacity={0.6} {...SOFT} />}
            <rect x={sh.cabin[0] - 0.05} y={-hw + 0.22} width={0.07} height={sh.W - 0.44} rx={0.01} fill="#15181c" />
            {[[-0.1, -hw + 0.32], [0.5, 0.0]].map(([by, ty], i) => (
              <g key={i}>
                <path d={`M${n2(sh.cabin[0] + 0.01)} ${n2(by)} L${n2(sh.cabin[0] + 0.15)} ${n2(ty)}`} stroke="#0e1114" strokeWidth={0.012} strokeLinecap="round" />
                <path d={`M${n2(sh.cabin[0] + 0.05)} ${n2(by - 0.02)} L${n2(sh.cabin[0] + 0.16)} ${n2(ty - 0.06)}`} stroke="#15181c" strokeWidth={0.02} strokeLinecap="round" />
              </g>
            ))}
            {rearScreen && <path d={rearScreen} fill="url(#pr-screen-r)" />}
            {rearScreen && <path d={rearScreen} fill="url(#pk-glass-refl)" />}
            {rearScreen && [0.3, 0.42, 0.54, 0.66, 0.78].map((t) => <path key={t} d={`M${n2(sh.roof[1] + 0.06)} ${n2(-hw + 0.25 + (sh.W - 0.5) * t)} L${n2(sh.cabin[1] - 0.03)} ${n2(-hw + 0.32 + (sh.W - 0.64) * t)}`} stroke="#e8a0a0" strokeWidth={0.5} strokeOpacity={0.45} {...SOFT} />)}
            {rearScreen && <path d={rearScreen} fill="none" stroke="#0b0e11" strokeWidth={1.1} strokeOpacity={0.9} {...SOFT} />}
            {[-1, 1].map((side) => (
              <g key={side}>
                {!(side === -1 && driverFront) && !glass && <path d={sideWindow(fd[0], fd[1], side as 1 | -1)} fill="url(#pr-side-glass)" stroke="#0b0e11" strokeWidth={0.9} strokeOpacity={0.9} {...SOFT} />}
                {!(side === -1 && driverFront) && glass && <path d={sideWindow(fd[0], fd[1], side as 1 | -1)} fill="#0b0e11" opacity={0.6} />}
                {sh.rearDoor && !(side === -1 && driverRear) && !glass && <path d={sideWindow(sh.rearDoor[0], sh.rearDoor[1], side as 1 | -1)} fill="url(#pr-side-glass)" stroke="#0b0e11" strokeWidth={0.9} strokeOpacity={0.9} {...SOFT} />}
                {sh.rearDoor && !(side === -1 && driverRear) && glass && <path d={sideWindow(sh.rearDoor[0], sh.rearDoor[1], side as 1 | -1)} fill="#0b0e11" opacity={0.6} />}
              </g>
            ))}
            {/* Doors: their gaps and handles on the shell, or gone from the driver's side. */}
            {[-1, 1].map((side) => (
              <g key={side}>
                {!(side === -1 && driverFront) ? <Seam d={doorPanel(fd[0], fd[1], side as 1 | -1)} /> : <path d={doorPanel(fd[0], fd[1], -1)} fill="#15181c" opacity={0.9} />}
                {sh.rearDoor && (!(side === -1 && driverRear) ? <Seam d={doorPanel(sh.rearDoor[0], sh.rearDoor[1], side as 1 | -1)} /> : <path d={doorPanel(sh.rearDoor[0], sh.rearDoor[1], -1)} fill="#15181c" opacity={0.9} />)}
                {!(side === -1 && driverFront) && (
                  <g>
                    <rect x={fd[1] - 0.32} y={side * (hw - 0.12) - 0.028} width={0.2} height={0.056} rx={0.012} fill="#000" opacity={0.4} />
                    <rect x={fd[1] - 0.31} y={side * (hw - 0.12) - 0.02} width={0.17} height={0.04} rx={0.012} fill="url(#pk-chrome)" stroke="#2b2f33" strokeWidth={0.4} {...SOFT} />
                  </g>
                )}
                {sh.rearDoor && !(side === -1 && driverRear) && (
                  <g>
                    <rect x={sh.rearDoor[1] - 0.32} y={side * (hw - 0.12) - 0.028} width={0.2} height={0.056} rx={0.012} fill="#000" opacity={0.4} />
                    <rect x={sh.rearDoor[1] - 0.31} y={side * (hw - 0.12) - 0.02} width={0.17} height={0.04} rx={0.012} fill="url(#pk-chrome)" stroke="#2b2f33" strokeWidth={0.4} {...SOFT} />
                  </g>
                )}
              </g>
            ))}
            {/* The pillars: A at the screen's corners, B between the doors (cut away on the driver's side after the third door), C at the rear screen. */}
            {[-1, 1].map((side) => pillar([sh.cabin[0] + 0.06, side * (hw - 0.08)], [sh.roof[0] + 0.02, side * (hw - 0.16)], 0.03, 0.045, `a${side}`))}
            {!sh.van && [-1, 1].map((side) => pillar([sh.cabin[1] - 0.04, side * (hw - 0.1)], [sh.roof[1] - 0.02, side * (hw - 0.16)], 0.035, 0.045, `c${side}`))}
            {sh.rearDoor && !driverRear && <rect x={fd[1] - 0.045} y={-hw} width={0.09} height={0.3} rx={0.01} fill={darken(paint, 0.3)} {...edge(paint, 0.6, 0.7, 0.8)} />}
            {sh.rearDoor && driverRear && <rect x={fd[1] - 0.045} y={-hw + 0.2} width={0.09} height={0.1} rx={0.01} fill="url(#pk-steel)" stroke="#2b2f33" strokeWidth={0.5} {...SOFT} />}
            {sh.rearDoor && <rect x={fd[1] - 0.045} y={hw - 0.3} width={0.09} height={0.3} rx={0.01} fill={darken(paint, 0.3)} {...edge(paint, 0.6, 0.7, 0.8)} />}
            {/* The roof: a cutaway panel in place; flapped back over the boot; or lifted clear onto the road. */}
            {!roofOff && (
              <g transform={roofFlap ? `translate(${n2(roofAt[0] - sh.roof[0])} 0)` : undefined}>
                <Painted d={roofPath} paint={paint} opacity={roofFlap ? 1 : 0.42} />
                {!roofFlap && <path d={roofPath} fill="none" stroke={darken(paint, 0.55)} strokeWidth={1} strokeOpacity={0.8} {...SOFT} />}
                <Seam d={`M${n2(roofRect.x + 0.08)} ${n2(roofRect.y + 0.07)} H${n2(roofRect.x + roofRect.w - 0.08)} M${n2(roofRect.x + 0.08)} ${n2(roofRect.y + roofRect.h - 0.07)} H${n2(roofRect.x + roofRect.w - 0.08)}`} dark={roofFlap ? 0.5 : 0.3} light={roofFlap ? 0.22 : 0.12} />
                {roofFlap && <path d={`M${n2(roofRect.x + 0.05)} ${n2(roofRect.y + 0.1)} V${n2(roofRect.y + roofRect.h - 0.1)}`} stroke="#fff" strokeWidth={2} strokeOpacity={0.4} {...SOFT} />}
                {roofFlap && <path d={`M${n2(roofRect.x + 0.08)} ${n2(roofRect.y + 0.1)} V${n2(roofRect.y + roofRect.h - 0.1)}`} stroke="#000" strokeWidth={2} strokeOpacity={0.45} {...SOFT} />}
                {roofFlap && <path d={`M${n2(roofRect.x + 0.02)} ${n2(roofRect.y)} l-0.14 0.12 l0.1 0.2 l-0.12 0.18 l0.08 0.2 l-0.1 0.2 l0.1 0.18 l-0.08 0.2 l0.14 0.12`} fill="none" stroke={darken(paint, 0.6)} strokeWidth={1} strokeOpacity={0.7} {...SOFT} />}
              </g>
            )}
            {/* The pillar stubs where the roof came off, bright at the cut. */}
            {roofOpen && [sh.roof[0], sh.roof[1]].map((x) => [-1, 1].map((side) => <rect key={`${x}${side}`} x={x - 0.05} y={side * (hw - 0.1) - 0.06} width={0.1} height={0.12} rx={0.015} fill="url(#pk-steel)" stroke="#2b2f33" strokeWidth={0.5} {...SOFT} />))}
            {/* Lamps. */}
            {[-1, 1].map((side) => <HeadLamp key={side} nose={nose} side={side as 1 | -1} hw={hw} van={sh.van} cracked={crumpled} />)}
            {[-1, 1].map((side) => <RearLamp key={side} tail={tail} side={side as 1 | -1} hw={hw} van={sh.van} />)}
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
            <g transform={`translate(${n2(nose - 1.7)} ${n2(-hw - 1.0)}) rotate(-24)`}>
              <DoorOff w={fd[1] - fd[0]} paint={paint} glass={glass} />
            </g>
          )}
          {thirdDoor && sh.rearDoor && (
            <g transform={`translate(${n2(tail + 0.5)} ${n2(-hw - 1.15)}) rotate(28)`}>
              <DoorOff w={sh.rearDoor[1] - sh.rearDoor[0]} paint={paint} glass={glass} />
            </g>
          )}
          {roofOff && (
            <g transform={`translate(${n2(roofAt[0])} ${n2(roofAt[1])}) rotate(22)`}>
              <RoofPanel w={roofRect.w} h={roofRect.h} paint={paint} />
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
