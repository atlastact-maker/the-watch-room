"use client";

// THE CREW FROM ABOVE. Someone kneeling over a patient, seen from where a
// camera on the ceiling would see them: the top of the head leaning in,
// the shoulders and the hi-vis back behind it, two arms reaching to the
// work, blue gloves on the hands, the soles of the boots poking out at
// the far end. The service shows in the colours and the headgear — a
// yellow fire helmet, a chequered police cap, the orange of a HEMS team.

import type { ReactNode } from "react";
import { type Pt, add, sub, mul, unit, perp, lerp, len, deg, P, capsule, smooth, darken, line, lineSoft } from "./plan-figure";

const SOFT = { vectorEffect: "non-scaling-stroke" as const };
const n2 = (v: number) => (Math.round(v * 1000) / 1000).toString();

export type CrewHat = "none" | "fire_helmet" | "police_cap" | "white_helmet";

export type CrewWear = {
  uniform: string;
  hiVis: string | null;
  hat: CrewHat;
  skin: string;
  hair: string;
  hairStyle: "short" | "long" | "bob" | "bald";
};

export type CrewTopProps = {
  /** The shoulder midpoint, in the figure's metres. */
  at: Pt;
  /** Unit vector from the shoulders towards the work. */
  facing: Pt;
  /** Where the hands go. Left/right are the person's own. */
  hands: { left?: Pt; right?: Pt };
  wear: CrewWear;
  kneeling?: boolean;
  /** A class on the arms group, for the compressions animation. */
  armsClass?: string;
  children?: ReactNode;
};

/** Two-bone IK: the elbow for an arm from `root` to `target`, bending to `bend` side (+1 clockwise on screen). */
function elbow(root: Pt, target: Pt, l1: number, l2: number, bend: 1 | -1): Pt {
  const d0 = sub(target, root);
  const dist = Math.min(Math.max(len(d0), Math.abs(l1 - l2) + 0.005), l1 + l2 - 0.005);
  const u = unit(d0);
  const a = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist))));
  const cos = Math.cos(a), sin = Math.sin(a) * bend;
  return [root[0] + l1 * (u[0] * cos - u[1] * sin), root[1] + l1 * (u[0] * sin + u[1] * cos)];
}

/** Where this crew member's head is, for a tag. */
export function crewHeadAt(at: Pt, facing: Pt): Pt {
  return add(at, mul(unit(facing), 0.08));
}

function Glove({ wrist, dir, colour }: { wrist: Pt; dir: Pt; colour: string }) {
  const d = unit(dir);
  const n = perp(d);
  const w = 0.036;
  const palmEnd = add(wrist, mul(d, 0.075));
  const fingers = Array.from({ length: 4 }, (_, i) => {
    const t = (i - 1.5) / 1.5;
    const base = add(palmEnd, mul(n, t * w * 1.15));
    const f = unit(add(d, mul(n, t * 0.12)));
    return capsule(base, add(base, mul(f, 0.065 - Math.abs(t) * 0.012)), w * 0.28, w * 0.22);
  });
  const thumbBase = add(lerp(wrist, palmEnd, 0.3), mul(n, -w * 1.35));
  return (
    <g>
      <path d={capsule(add(wrist, mul(d, -0.01)), palmEnd, w * 0.9, w * 1.3)} fill={colour} {...lineSoft} />
      {fingers.map((f, i) => <path key={i} d={f} fill={colour} {...lineSoft} />)}
      <path d={capsule(lerp(wrist, palmEnd, 0.35), add(thumbBase, mul(d, 0.02)), w * 0.36, w * 0.26)} fill={colour} {...lineSoft} />
      <path d={capsule(add(wrist, mul(d, -0.035)), add(wrist, mul(d, -0.005)), w * 0.95, w * 0.95)} fill={darken(colour, 0.35)} opacity={0.9} />
    </g>
  );
}

function Hat({ c, f, hat }: { c: Pt; f: Pt; hat: CrewHat }) {
  const [cx, cy] = c;
  const ang = deg(f);
  if (hat === "fire_helmet" || hat === "white_helmet") {
    const colour = hat === "fire_helmet" ? "#f2d33c" : "#f4f4f0";
    return (
      <g transform={`rotate(${n2(ang)} ${n2(cx)} ${n2(cy)})`}>
        <ellipse cx={cx} cy={cy} rx={0.15} ry={0.135} fill={colour} {...line} />
        <ellipse cx={cx} cy={cy} rx={0.15} ry={0.135} fill="url(#ps-face-shade)" />
        <path d={`M${n2(cx - 0.1)} ${n2(cy)} H${n2(cx + 0.11)}`} stroke={darken(colour, 0.25)} strokeWidth={0.03} strokeLinecap="round" />
        <path d={`M${n2(cx + 0.07)} ${n2(cy - 0.12)} q0.08 0.12 0 0.24`} fill="none" stroke="#1b2733" strokeWidth={1.2} {...SOFT} opacity={0.6} />
        <rect x={cx - 0.03} y={cy - 0.11} width={0.06} height={0.025} fill="#e04b2a" />
        <rect x={cx - 0.03} y={cy + 0.085} width={0.06} height={0.025} fill="#e04b2a" />
      </g>
    );
  }
  if (hat === "police_cap") {
    return (
      <g transform={`rotate(${n2(ang)} ${n2(cx)} ${n2(cy)})`}>
        <circle cx={cx} cy={cy} r={0.115} fill="#15202b" {...line} />
        <circle cx={cx} cy={cy} r={0.1} fill="none" stroke="#e9ecef" strokeWidth={0.03} />
        <circle cx={cx} cy={cy} r={0.1} fill="none" stroke="#15202b" strokeWidth={0.03} strokeDasharray="0.03 0.03" />
        <circle cx={cx} cy={cy} r={0.075} fill="#1b2a38" />
        <path d={`M${n2(cx + 0.08)} ${n2(cy - 0.08)} a0.11 0.11 0 0 1 0 0.16 L${n2(cx + 0.16)} ${n2(cy + 0.05)} a0.17 0.17 0 0 0 0 -0.1 Z`} fill="#0d141b" {...lineSoft} />
        <circle cx={cx} cy={cy} r={0.02} fill="#c9ced3" />
      </g>
    );
  }
  return null;
}

function HeadTop({ c, f, wear, r = 0.13 }: { c: Pt; f: Pt; wear: CrewWear; r?: number }) {
  const [cx, cy] = c;
  const ang = deg(f);
  const hair = wear.hairStyle;
  const s = perp(unit(f));
  return (
    <g>
      {[-1, 1].map((side) => { const e = add(c, mul(s, side * r * 0.98)); return <ellipse key={side} cx={e[0]} cy={e[1]} rx={r * 0.16} ry={r * 0.24} fill={wear.skin} {...lineSoft} transform={`rotate(${n2(ang)} ${n2(e[0])} ${n2(e[1])})`} />; })}
      <circle cx={cx} cy={cy} r={r} fill={wear.skin} {...line} />
      {hair !== "bald" && (
        <g transform={`rotate(${n2(ang)} ${n2(cx)} ${n2(cy)})`}>
          {/* The crown of the head from above: hair all over, the forehead (towards f) showing. */}
          <path d={smooth([[cx + r * 0.75, cy - r * 0.6], [cx + r * 0.2, cy - r * 0.95], [cx - r * 0.5, cy - r * 0.85], [cx - r * 0.98, cy - r * 0.2], [cx - r * 0.98, cy + r * 0.2], [cx - r * 0.5, cy + r * 0.85], [cx + r * 0.2, cy + r * 0.95], [cx + r * 0.75, cy + r * 0.6], [cx + r * 0.55, cy]], 0.6)} fill={wear.hair} {...lineSoft} />
          <path d={`M${n2(cx + r * 0.5)} ${n2(cy - r * 0.1)} L${n2(cx - r * 0.7)} ${n2(cy - r * 0.25)}`} stroke={darken(wear.hair, 0.35)} strokeWidth={0.9} {...SOFT} opacity={0.6} />
          {(hair === "long" || hair === "bob") && <circle cx={cx - r * 0.85} cy={cy} r={r * 0.45} fill={wear.hair} {...lineSoft} />}
        </g>
      )}
      {hair === "bald" && <circle cx={cx} cy={cy} r={r} fill="url(#ps-face-shade)" />}
      {hair !== "bald" && <circle cx={cx} cy={cy} r={r} fill="url(#ps-hair-shine)" />}
      <g transform={`translate(${n2(cx)} ${n2(cy)}) scale(${n2(r / 0.105)}) translate(${n2(-cx)} ${n2(-cy)})`}>
        <Hat c={c} f={f} hat={wear.hat} />
      </g>
    </g>
  );
}

export function CrewTop({ at, facing, hands, wear, kneeling = true, armsClass, children }: CrewTopProps) {
  const f = unit(facing);
  const s = perp(f);
  const jacket = wear.hiVis ?? wear.uniform;
  const glove = "#4a78b5";
  const ang = deg(f);
  const head = crewHeadAt(at, f);
  // Points along the body axis: positive is towards the work.
  const axis = (d: number, across = 0): Pt => add(add(at, mul(f, d)), mul(s, across));
  // From a camera over the patient, someone kneeling and leaning in is a
  // head, a pair of shoulders and two arms reaching down. The trunk slopes
  // away under the head and shows as a short back behind the shoulders;
  // the legs are tucked under it, so only the boot soles peep out behind.
  const shL = axis(-0.02, -0.2);
  const shR = axis(-0.02, 0.2);
  const arm = (sh: Pt, target: Pt | undefined, bend: 1 | -1) => {
    const t = target ?? axis(0.24, bend * 0.26);
    const el = elbow(sh, t, 0.2, 0.19, bend);
    return (
      <g>
        <path d={capsule(sh, el, 0.052, 0.04)} fill={jacket} {...line} />
        <path d={capsule(sh, el, 0.052, 0.04)} fill="url(#ps-round)" opacity={0.6} />
        <path d={capsule(el, t, 0.04, 0.03)} fill={jacket} {...line} />
        {wear.hiVis && <path d={capsule(lerp(el, t, 0.5), lerp(el, t, 0.66), 0.037, 0.035)} fill="#d0d4d8" opacity={0.95} />}
        <Glove wrist={t} dir={sub(t, el)} colour={glove} />
      </g>
    );
  };
  const back = smooth([axis(-0.04, -0.21), axis(-0.04, 0.21), axis(-0.16, 0.16), axis(-0.22, 0.1), axis(-0.22, -0.1), axis(-0.16, -0.16)], 0.45);
  const slope = Math.abs(f[0]) > Math.abs(f[1]) ? (f[0] > 0 ? "ps-slope-r" : "ps-slope-l") : f[1] > 0 ? "ps-slope-d" : "ps-slope-u";
  return (
    <g className="ps-crew">
      <ellipse cx={axis(-0.1, 0.08)[0] + 0.05} cy={axis(-0.1, 0.08)[1] + 0.07} rx={0.3} ry={0.24} fill="url(#ps-shadow)" opacity={0.9} />
      {kneeling && [-1, 1].map((side) => {
        const heel = axis(-0.26, side * 0.12);
        const toe = axis(-0.4, side * 0.135);
        return (
          <g key={side} opacity={0.9}>
            <path d={capsule(heel, toe, 0.045, 0.04)} fill="#121518" {...line} />
            <path d={capsule(lerp(heel, toe, 0.25), lerp(heel, toe, 0.85), 0.028, 0.025)} fill="#30353b" />
          </g>
        );
      })}
      <path d={back} fill={jacket} {...line} />
      {wear.hiVis && <path d={`M${P(axis(-0.12, -0.19))} L${P(axis(-0.12, 0.19))}`} stroke="#d0d4d8" strokeWidth={0.04} />}
      <path d={back} fill={`url(#${slope})`} />
      {/* Shoulders */}
      <path d={capsule(shL, shR, 0.1, 0.1)} fill={jacket} {...line} />
      <path d={capsule(shL, shR, 0.1, 0.1)} fill="url(#ps-round-v)" opacity={0.4} />
      {wear.hiVis && <path d={`M${P(axis(-0.02, -0.12))} L${P(axis(-0.02, 0.12))}`} stroke="#d0d4d8" strokeWidth={0.035} opacity={0.9} />}
      {[shL, shR].map((sh, i) => <rect key={i} x={sh[0] - 0.045} y={sh[1] - 0.018} width={0.09} height={0.036} rx={0.007} fill={darken(wear.uniform, 0.45)} transform={`rotate(${n2(ang + 90)} ${n2(sh[0])} ${n2(sh[1])})`} />)}
      <g className={armsClass}>
        {arm(shL, hands.left, -1)}
        {arm(shR, hands.right, 1)}
      </g>
      <HeadTop c={head} f={f} wear={wear} r={0.125} />
      {children}
    </g>
  );
}

/** Uniform and headgear by service and clinical scope. */
export function crewWearOf(service: "Fire" | "Ambulance" | "Police" | undefined, scope: string | undefined, seed: number): CrewWear {
  const skins = ["#f1c9a5", "#e8b894", "#d9a079", "#b67a4e", "#8c5a36"];
  const hairs = ["#2b1d14", "#4a3220", "#1b1b1b", "#8a5a2b", "#6b4a2a"];
  const skin = skins[(seed >>> 2) % skins.length];
  const hair = hairs[(seed >>> 5) % hairs.length];
  const female = (seed >>> 7) % 3 === 0;
  const hairStyle: CrewWear["hairStyle"] = female ? ((seed >>> 9) % 2 ? "bob" : "long") : (seed >>> 11) % 7 === 0 ? "bald" : "short";
  const common = { skin, hair, hairStyle };
  if (service === "Fire") return { ...common, uniform: "#2b3a48", hiVis: null, hat: "fire_helmet" };
  if (service === "Police") return { ...common, uniform: "#15202b", hiVis: "#e3df55", hat: "police_cap" };
  if (scope === "hems") return { ...common, uniform: "#e8701b", hiVis: null, hat: "none" };
  if (scope === "basics" || scope === "ccc") return { ...common, uniform: "#1f7a45", hiVis: "#9fe06a", hat: "none" };
  return { ...common, uniform: "#1f7a45", hiVis: "#e3df55", hat: "none" };
}
