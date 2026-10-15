"use client";

// THE UNITS ON THE GROUND. An appliance parked on a scene from above:
// the ground map's own sprite art for the types that have it (the pumps,
// the aerials, the rescue units, the police cars), an ambulance drawn
// here for the ones that do not, a car in the service's colour for the
// rest. Each is laid in a scene's metre space at a compass heading, with
// the shadow everything on the ground gets, and tagged the way the map
// tags its markers so the lamp CSS in globals.css runs the blues.

import { useMemo } from "react";
import { VEHICLE_SPRITES, spriteKeyForType, type VehicleSpriteKey } from "../../components/vehicle-sprites";
import { P, edge, darken, type Pt } from "./plan-figure";
import { PlanCar } from "./plan-rtc";

const SOFT = { vectorEffect: "non-scaling-stroke" as const };
const n2 = (v: number) => (Math.round(v * 1000) / 1000).toString();

/** The width each sprite is drawn at, in metres; its length follows the art. */
const SPRITE_WIDTH_M: Record<VehicleSpriteKey, number> = {
  pump: 2.55, alp: 2.55, tru: 2.55, truvan: 2.25, pm: 2.55, hll: 2.55, decon: 2.55,
  pol_estate: 2.0, pol_rpu: 2.0, pol_arv: 2.0, pol_unm_saloon: 1.95, pol_unm: 1.95,
  bay_pump: 2.55, bay_alp: 2.55,
};

const AMBULANCE_TYPES = new Set(["DCA", "UCA", "HART_vehicle", "NWAS_IRU", "HART_PCV", "HART_ORIRU", "HART_carrier", "MIV"]);

/** How much road a unit takes up: its width across and its length along its heading. */
export function unitFootprint(type: string, service: string): { w: number; l: number } {
  const key = spriteKeyForType(type);
  if (key) { const sp = VEHICLE_SPRITES[key]; const w = SPRITE_WIDTH_M[key]; return { w, l: (w * sp.h) / sp.w }; }
  if (AMBULANCE_TYPES.has(type)) return { w: 2.3, l: 6.4 };
  void service;
  return { w: 1.78, l: 4.4 };
}

export type UnitSpriteProps = {
  type: string;
  service: string;
  at: Pt;
  /** Compass degrees, 0 north, 90 east. */
  heading: number;
  /** The map's light state: 999, at_scene, rear_blues, rear_reds, hazards, off. */
  lights?: string;
  selected?: boolean;
  commander?: boolean;
  /** Arrived but not yet parked on the map: drawn where the scene holds it, marked as such. */
  unplaced?: boolean;
  onClick?: () => void;
};

export function UnitSprite({ type, service, at, heading, lights = "at_scene", selected = false, commander = false, unplaced = false, onClick }: UnitSpriteProps) {
  const key = spriteKeyForType(type);
  const { w, l } = unitFootprint(type, service);
  const cls = `gv-unit veh ls-${lights}${selected ? " sel" : ""}${unplaced ? " unplaced" : ""}`;
  const ring = (selected || commander) && (
    <rect x={-w / 2 - 0.45} y={-l / 2 - 0.45} width={w + 0.9} height={l + 0.9} rx={0.5} fill="none" stroke={selected ? "#7fd1ff" : "#fbbf24"} strokeWidth={selected ? 2 : 1.5} strokeDasharray={selected ? undefined : "4 3"} {...SOFT} />
  );
  if (key) {
    return (
      <g className={cls} transform={`translate(${P(at)}) rotate(${n2(heading)})`} onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}>
        <rect x={-w / 2 + 0.12} y={-l / 2 + 0.16} width={w} height={l} rx={0.3} fill="#000" opacity={0.45} filter="url(#ps-blur-md)" />
        <SpriteArt spriteKey={key} w={w} l={l} />
        {ring}
      </g>
    );
  }
  if (AMBULANCE_TYPES.has(type)) {
    return (
      <g className={cls} transform={`translate(${P(at)}) rotate(${n2(heading)})`} onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}>
        <PlanAmbulance w={w} l={l} />
        {ring}
      </g>
    );
  }
  const paint = service === "Fire" ? "#c0181f" : service === "Police" ? "#d9dde2" : service === "Ambulance" ? "#f2d23b" : "#6b7a8c";
  return (
    <g className={cls} onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}>
      <PlanCar at={at} heading={heading} paint={paint} />
      {ring && <g transform={`translate(${P(at)}) rotate(${n2(heading)})`}>{ring}</g>}
    </g>
  );
}

/** The ground map's sprite, nose up, scaled to its width in metres. */
function SpriteArt({ spriteKey, w, l }: { spriteKey: VehicleSpriteKey; w: number; l: number }) {
  const sp = VEHICLE_SPRITES[spriteKey];
  const inner = useMemo(() => sp.svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, ""), [sp]);
  return <svg x={-w / 2} y={-l / 2} width={w} height={l} viewBox={`0 0 ${sp.w} ${sp.h}`} preserveAspectRatio="xMidYMid meet" dangerouslySetInnerHTML={{ __html: inner }} />;
}

/** A UK ambulance from above, nose up: the yellow box with the battenburg
 *  along its sides, the cab's screen and bonnet, the light bar, the roof's
 *  vents and the rear doors; the lamps tagged for the map's light CSS. */
export function PlanAmbulance({ w = 2.3, l = 6.4 }: { w?: number; l?: number }) {
  const hw = w / 2, hl = l / 2;
  const yellow = "#f3d13a", green = "#2fa84f";
  const cabTop = -hl + 1.75;
  const body = `M${n2(-hw + 0.2)} ${n2(-hl)} H${n2(hw - 0.2)} q0.2 0 0.2 0.2 V${n2(hl - 0.15)} q0 0.15 -0.15 0.15 H${n2(-hw + 0.15)} q-0.15 0 -0.15 -0.15 V${n2(-hl + 0.2)} q0 -0.2 0.2 -0.2 Z`;
  const blocks = Math.floor((l - 2.2) / 0.55);
  return (
    <g>
      <rect x={-hw + 0.12} y={-hl + 0.16} width={w} height={l} rx={0.3} fill="#000" opacity={0.45} filter="url(#ps-blur-md)" />
      {[-hl + 0.9, hl - 1.1].map((y) => [-1, 1].map((side) => <rect key={`${y}${side}`} x={side * (hw - 0.05) - (side > 0 ? 0.3 : 0.0)} y={y - 0.33} width={0.3} height={0.66} rx={0.06} fill="#121518" />))}
      <path d={body} fill={yellow} {...edge(yellow, 0.55, 0.75, 0.9)} />
      <path d={body} fill="url(#pr-body-h)" />
      <path d={body} fill="url(#ps-grain)" opacity={0.5} />
      {/* The battenburg down each side: green and yellow squares the full height of the box. */}
      {[-1, 1].map((side) => Array.from({ length: blocks }, (_, i) => (
        <rect key={`${side}${i}`} x={side > 0 ? hw - 0.24 : -hw + 0.02} y={cabTop + 0.3 + i * 0.55} width={0.22} height={0.5} fill={i % 2 ? yellow : green} opacity={0.95} />
      )))}
      {/* The cab: the bonnet's seam, the screen, the wipers' sweep, the light bar across its roof. */}
      <path d={`M${n2(-hw + 0.2)} ${n2(-hl + 0.55)} H${n2(hw - 0.2)}`} stroke="#000" strokeOpacity={0.4} strokeWidth={0.9} {...SOFT} />
      <path d={`M${n2(-hw + 0.25)} ${n2(-hl + 0.6)} L${n2(hw - 0.25)} ${n2(-hl + 0.6)} L${n2(hw - 0.4)} ${n2(-hl + 1.25)} L${n2(-hw + 0.4)} ${n2(-hl + 1.25)} Z`} fill="url(#pr-screen)" stroke="#0b0e11" strokeWidth={1} strokeOpacity={0.9} {...SOFT} />
      <path d={`M${n2(-hw + 0.25)} ${n2(-hl + 0.6)} L${n2(hw - 0.25)} ${n2(-hl + 0.6)} L${n2(hw - 0.4)} ${n2(-hl + 1.25)} L${n2(-hw + 0.4)} ${n2(-hl + 1.25)} Z`} fill="url(#pk-glass-refl)" />
      <rect x={-hw + 0.3} y={-hl + 1.32} width={w - 0.6} height={0.22} rx={0.05} fill="#1b1f23" {...edge("#1b1f23", 0.3, 0.8, 0.8)} />
      {[-1, 1].map((side) => <rect key={side} className={`lt lt-blue ${side < 0 ? "lt-l" : "lt-r"} lt-f`} x={side < 0 ? -hw + 0.36 : 0.12} y={-hl + 1.35} width={hw - 0.48} height={0.16} rx={0.03} fill="#3b82f6" />)}
      {/* The box's roof: the step up from the cab, the vents, the ribs. */}
      <path d={`M${n2(-hw + 0.1)} ${n2(cabTop)} H${n2(hw - 0.1)}`} stroke="#000" strokeOpacity={0.35} strokeWidth={1.2} {...SOFT} />
      <path d={`M${n2(-hw + 0.1)} ${n2(cabTop + 0.03)} H${n2(hw - 0.1)}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={1} {...SOFT} />
      {[cabTop + 1.2, cabTop + 2.6].map((y) => <rect key={y} x={-0.28} y={y} width={0.56} height={0.42} rx={0.05} fill={darken(yellow, 0.18)} {...edge(yellow, 0.5, 0.7, 0.8)} />)}
      {Array.from({ length: 4 }, (_, i) => <path key={i} d={`M${n2(-hw + 0.35)} ${n2(cabTop + 0.7 + i * 1.0)} H${n2(hw - 0.35)}`} stroke="#000" strokeOpacity={0.12} strokeWidth={0.8} {...SOFT} />)}
      {/* The rear: the doors' split, the lamps, the step. */}
      <path d={`M0 ${n2(hl - 0.6)} V${n2(hl - 0.05)}`} stroke="#000" strokeOpacity={0.45} strokeWidth={1} {...SOFT} />
      {[-1, 1].map((side) => <rect key={side} className={`lt lt-red ${side < 0 ? "lt-l" : "lt-r"} lt-b`} x={side < 0 ? -hw + 0.22 : hw - 0.36} y={hl - 0.3} width={0.14} height={0.2} rx={0.03} fill="#c8102e" />)}
      {[-1, 1].map((side) => <rect key={`b${side}`} className={`lt lt-blue ${side < 0 ? "lt-l" : "lt-r"} lt-b`} x={side < 0 ? -hw + 0.4 : hw - 0.54} y={hl - 0.3} width={0.14} height={0.2} rx={0.03} fill="#3b82f6" />)}
      <rect x={-hw + 0.3} y={hl - 0.06} width={w - 0.6} height={0.1} rx={0.02} fill="#2b2f33" />
    </g>
  );
}
