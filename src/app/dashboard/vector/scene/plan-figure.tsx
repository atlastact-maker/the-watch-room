"use client";

// THE PATIENT FROM ABOVE. The view a crew has kneeling over someone: the
// face looking up, the chest, the arms by the sides, the legs running
// down out of the frame. Everything is in metres from the crown of the
// head, scaled at the last step, so a child is a child and a six-foot
// man is a six-foot man, and the pads, the cuff and the cannula land on
// the same skin whatever the size. Four poses: lying flat, reclined on a
// bed, seated (what sitting looks like from above: the lap, the knees,
// the shoes), and floating. What the hands are doing comes from the
// clinical cue — a hand on the chest, both hands at the throat, an arm
// gone limp.

import type { CSSProperties, ReactNode } from "react";

export type Pt = [number, number];
export const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
export const len = (a: Pt): number => Math.hypot(a[0], a[1]);
export const unit = (a: Pt): Pt => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
export const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** The perpendicular on the clockwise side (screen y down). */
export const perp = (v: Pt): Pt => [-v[1], v[0]];
export const deg = (v: Pt): number => (Math.atan2(v[1], v[0]) * 180) / Math.PI;

const n2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
export const P = (p: Pt) => `${n2(p[0])} ${n2(p[1])}`;

/** A closed Catmull-Rom spline through `pts`, as a path. */
export function smooth(pts: Pt[], tension = 0.5): string {
  const n = pts.length;
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3];
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3];
    d += ` C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return d + " Z";
}

/** A tapered capsule from a to b: half-widths wa and wb, round ends. */
export function capsule(a: Pt, b: Pt, wa: number, wb: number): string {
  const d = unit(sub(b, a));
  const n = perp(d);
  const p1 = add(a, mul(n, wa)), p2 = add(b, mul(n, wb)), p3 = sub(b, mul(n, wb)), p4 = sub(a, mul(n, wa));
  return `M${P(p1)} L${P(p2)} A${n2(wb)} ${n2(wb)} 0 0 0 ${P(p3)} L${P(p4)} A${n2(wa)} ${n2(wa)} 0 0 0 ${P(p1)} Z`;
}

export function darken(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** Mix two hex colours; t = share of b. */
export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

export const INK = "#1b2733";
/** Outline stroke in px, not metres: the scene scales, the line does not. */
export const line = { stroke: INK, strokeWidth: 0.9, vectorEffect: "non-scaling-stroke" as const, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
export const lineSoft = { ...line, strokeOpacity: 0.5 };

// ---------------------------------------------------------------------------
// Build and rig
// ---------------------------------------------------------------------------

export type Build = {
  heightM: number;
  sex: "male" | "female";
  child: boolean;
  elderly: boolean;
  pregnant: boolean;
  /** Trunk and limb thickness, 1 = average adult. */
  bulk?: number;
};

export type Pose = "lying" | "reclined" | "seated" | "floating";

export type Cue = "none" | "hand_on_chest" | "tripod" | "hands_on_throat" | "holding_head" | "holding_arm" | "holding_belly" | "arm_limp";

export type RigOpts = {
  pose: Pose;
  /** Knees drawn up a little (a conscious patient lying comfortably). */
  kneesUp?: boolean;
  cue?: Cue;
  /** Head turned to one side (−1 left, 1 right), as a resting head rolls. */
  headTurn?: number;
};

export type Limb = { a: Pt; b: Pt; c: Pt; d: Pt };

/** Every joint of the figure, in metres from the crown, x to the viewer's right. */
export type Rig = {
  k: number;
  bulk: number;
  build: Build;
  pose: Pose;
  headL: number; headW: number;
  crown: Pt; chin: Pt; headC: Pt;
  neckTop: Pt; neckBase: Pt; neckW: number;
  shoulderW: number; chestW: number; waistW: number; hipW: number;
  shoulderY: number; chestY: number; waistY: number; hipY: number; crotchY: number;
  /** The torso outline, as points down the right-hand side (viewer's), mirrored for the left. */
  torso: string;
  /** Patient's right arm is on the viewer's LEFT. a shoulder, b elbow, c wrist, d fingertips. */
  armR: Limb; armL: Limb;
  legR: Limb; legL: Limb;
  armW: [number, number, number]; legW: [number, number, number];
  /** Visible foot length (foreshortened when the toes point up). */
  footL: number; footW: number;
  /** Which way the toes point (unit) and whether the sole is on the ground (seated). */
  toeR: Pt; toeL: Pt; feetFlat: boolean;
  handFlatR: boolean; handFlatL: boolean;
  /** Palm up (limp arm). */
  palmUpR: boolean; palmUpL: boolean;
  headTurn: number;
  /** Bottom of the drawn figure in metres (toes, or shoes when seated). */
  bottom: number;
};

const F = (k: number, v: number) => v * k;

export function rig(build: Build, o: RigOpts): Rig {
  const k = build.heightM / 1.78;
  const bulk = build.bulk ?? (build.child ? 0.85 : build.sex === "female" ? 0.9 : 1);
  const pose = o.pose;
  const headL = F(k, build.child ? 0.26 : 0.235);
  const headW = F(k, build.child ? 0.19 : 0.165);
  const crown: Pt = [0, 0];
  const chin: Pt = [0, headL];
  const headC: Pt = [0, headL / 2];
  const neckW = F(k, 0.11) * bulk;
  const neckTop: Pt = [0, headL * 0.9];
  const neckBase: Pt = [0, F(k, 0.285)];
  // How much of the trunk's length we see: all of it lying, less reclined,
  // half of it sat up (the chest comes towards the viewer).
  const squash = pose === "lying" ? 1 : pose === "reclined" ? 0.86 : pose === "floating" ? 1 : o.cue === "tripod" ? 0.72 : 0.56;
  const ty = (v: number) => neckBase[1] + (F(k, v) - F(k, 0.285)) * squash;
  const shoulderY = ty(0.30), chestY = ty(0.44), waistY = ty(0.62), hipY = ty(0.80), crotchY = ty(0.89);
  const shoulderW = F(k, build.sex === "female" ? 0.205 : 0.225) * bulk;
  const chestW = F(k, 0.195) * bulk;
  const waistW = F(k, build.pregnant ? 0.235 : build.sex === "female" ? 0.155 : 0.17) * bulk;
  const hipW = F(k, build.sex === "female" ? 0.205 : 0.19) * bulk;
  const right: Pt[] = [
    [F(k, 0.07) * bulk, neckBase[1] - F(k, 0.01)],
    [shoulderW * 0.86, shoulderY - F(k, 0.015)],
    [shoulderW, shoulderY + F(k, 0.03)],
    [chestW * 1.02, ty(0.38)],
    [chestW, chestY],
    [waistW, waistY],
    [hipW, hipY],
    [hipW * 0.7, crotchY],
  ];
  const outline: Pt[] = [...right, ...right.slice().reverse().map((p): Pt => [-p[0], p[1]])];
  const torso = smooth(outline, 0.55);

  // Arms. The shoulder joint sits inside the outline a little.
  const shR: Pt = [-shoulderW * 0.92, shoulderY + F(k, 0.01)];
  const shL: Pt = [shoulderW * 0.92, shoulderY + F(k, 0.01)];
  const upper = F(k, 0.30), fore = F(k, 0.26), hand = F(k, 0.185);
  const armW: [number, number, number] = [F(k, 0.052) * bulk, F(k, 0.043) * bulk, F(k, 0.033) * bulk];
  const byTheSide = (sh: Pt, side: 1 | -1, spread = 1): Limb => {
    const b: Pt = [sh[0] + side * F(k, 0.045) * spread, sh[1] + upper * (pose === "seated" ? 0.4 : 1)];
    const c: Pt = [b[0] + side * F(k, 0.015), b[1] + fore * (pose === "seated" ? 0.95 : 1)];
    const d: Pt = [c[0] + side * F(k, 0.01), c[1] + hand];
    return { a: sh, b, c, d };
  };
  // A hand reaching for a point on the body: the elbow swings out to the side.
  const reach = (sh: Pt, side: 1 | -1, target: Pt, elbowOut: number): Limb => {
    const c = target;
    const mid = lerp(sh, c, 0.5);
    const b: Pt = [mid[0] + side * elbowOut, mid[1] + F(k, 0.04)];
    const d: Pt = add(c, mul(unit(sub(c, b)), hand * 0.75));
    return { a: sh, b, c, d };
  };
  let armR = byTheSide(shR, -1), armL = byTheSide(shL, 1);
  let palmUpR = false, palmUpL = false;
  const handFlatR = true;
  let handFlatL = true;
  const cue = o.cue ?? "none";
  if (pose === "floating") {
    armR = { a: shR, b: [shR[0] - F(k, 0.26), shR[1] + F(k, 0.14)], c: [shR[0] - F(k, 0.48), shR[1] + F(k, 0.26)], d: [shR[0] - F(k, 0.62), shR[1] + F(k, 0.33)] };
    armL = { a: shL, b: [shL[0] + F(k, 0.26), shL[1] + F(k, 0.14)], c: [shL[0] + F(k, 0.48), shL[1] + F(k, 0.26)], d: [shL[0] + F(k, 0.62), shL[1] + F(k, 0.33)] };
    palmUpR = palmUpL = true;
  } else if (pose === "seated") {
    // Forearms on the thighs, hands on the knees.
    const kneeY = crotchY + F(k, 0.42);
    armR = { a: shR, b: [shR[0] - F(k, 0.03), shR[1] + upper * 0.42], c: [-F(k, 0.11) * bulk, kneeY - F(k, 0.08)], d: [-F(k, 0.11) * bulk, kneeY + F(k, 0.1)] };
    armL = { a: shL, b: [shL[0] + F(k, 0.03), shL[1] + upper * 0.42], c: [F(k, 0.11) * bulk, kneeY - F(k, 0.08)], d: [F(k, 0.11) * bulk, kneeY + F(k, 0.1)] };
    if (cue === "hand_on_chest") armR = reach(shR, -1, [-F(k, 0.03), chestY - F(k, 0.01)], F(k, 0.2));
    if (cue === "hands_on_throat") { armR = reach(shR, -1, [-F(k, 0.05), neckBase[1] - F(k, 0.01)], F(k, 0.24)); armL = reach(shL, 1, [F(k, 0.05), neckBase[1] - F(k, 0.01)], F(k, 0.24)); }
    if (cue === "holding_head") armR = reach(shR, -1, [-headW * 0.25, headL * 0.3], F(k, 0.3));
    if (cue === "holding_belly") { armR = reach(shR, -1, [-F(k, 0.05), waistY + F(k, 0.02)], F(k, 0.18)); armL = reach(shL, 1, [F(k, 0.05), waistY + F(k, 0.02)], F(k, 0.18)); }
  } else {
    if (cue === "hand_on_chest") armR = reach(shR, -1, [-F(k, 0.03), chestY - F(k, 0.01)], F(k, 0.2));
    if (cue === "hands_on_throat") { armR = reach(shR, -1, [-F(k, 0.05), neckBase[1] - F(k, 0.015)], F(k, 0.25)); armL = reach(shL, 1, [F(k, 0.05), neckBase[1] - F(k, 0.015)], F(k, 0.25)); }
    if (cue === "holding_head") armR = reach(shR, -1, [-headW * 0.3, headL * 0.28], F(k, 0.32));
    if (cue === "holding_belly") { armR = reach(shR, -1, [-F(k, 0.05), waistY + F(k, 0.03)], F(k, 0.2)); armL = reach(shL, 1, [F(k, 0.05), waistY + F(k, 0.03)], F(k, 0.2)); }
    if (cue === "holding_arm") { armL = byTheSide(shL, 1, 1.4); armR = reach(shR, -1, lerp(armL.b, armL.c, 0.5), F(k, 0.16)); }
    if (cue === "arm_limp") {
      armL = { a: shL, b: [shL[0] + F(k, 0.22), shL[1] + F(k, 0.2)], c: [shL[0] + F(k, 0.42), shL[1] + F(k, 0.36)], d: [shL[0] + F(k, 0.56), shL[1] + F(k, 0.46)] };
      palmUpL = true;
      handFlatL = false;
    }
  }

  // Legs.
  const hipR: Pt = [-F(k, 0.095) * bulk, hipY + F(k, 0.04)];
  const hipL: Pt = [F(k, 0.095) * bulk, hipY + F(k, 0.04)];
  const thigh = F(k, 0.45), shin = F(k, 0.41);
  const legW: [number, number, number] = [F(k, 0.088) * bulk, F(k, 0.064) * bulk, F(k, 0.046) * bulk];
  let footL = F(k, 0.12);
  const footW = F(k, 0.095) * (build.sex === "female" ? 0.92 : 1);
  let feetFlat = false;
  const legOf = (hip: Pt, side: 1 | -1): Limb => {
    if (pose === "seated" || (pose === "lying" && o.kneesUp) || pose === "reclined") {
      // Thighs along the ground (seated) or raised (knees up): the shin
      // drops towards the floor and the shoe lies flat, toes pointing on.
      const t = pose === "seated" ? 1 : 0.8;
      const b: Pt = [hip[0] + side * F(k, 0.02), hip[1] + thigh * t];
      const c: Pt = [b[0] + side * F(k, 0.015), b[1] + shin * (pose === "seated" ? 0.1 : 0.22)];
      const d: Pt = [c[0] + side * F(k, 0.02), c[1] + F(k, 0.26)];
      return { a: hip, b, c, d };
    }
    if (pose === "floating") {
      const b: Pt = [hip[0] + side * F(k, 0.03), hip[1] + thigh * 0.55];
      const c: Pt = [b[0] + side * F(k, 0.01), b[1] + shin * 0.3];
      return { a: hip, b, c, d: [c[0], c[1] + F(k, 0.05)] };
    }
    const b: Pt = [hip[0] + side * F(k, 0.01), hip[1] + thigh];
    const c: Pt = [b[0] - side * F(k, 0.005), b[1] + shin];
    const d: Pt = [c[0] + side * F(k, 0.02), c[1] + footL];
    return { a: hip, b, c, d };
  };
  if (pose === "seated" || (pose === "lying" && o.kneesUp) || pose === "reclined") { footL = F(k, 0.26); feetFlat = true; }
  const legR = legOf(hipR, -1), legL = legOf(hipL, 1);
  const toeR: Pt = feetFlat ? unit([-0.12, 1]) : unit([-0.18, 1]);
  const toeL: Pt = feetFlat ? unit([0.12, 1]) : unit([0.18, 1]);
  const bottom = Math.max(legR.d[1], legL.d[1]) + (feetFlat ? 0 : F(k, 0.02));
  return {
    k, bulk, build, pose, headL, headW, crown, chin, headC, neckTop, neckBase, neckW,
    shoulderW, chestW, waistW, hipW, shoulderY, chestY, waistY, hipY, crotchY, torso,
    armR, armL, legR, legL, armW, legW, footL, footW, toeR, toeL, feetFlat,
    handFlatR, handFlatL, palmUpR, palmUpL, headTurn: o.headTurn ?? 0, bottom,
  };
}

// ---------------------------------------------------------------------------
// Dress
// ---------------------------------------------------------------------------

export type HairStyle = "short" | "long" | "bob" | "bald" | "child";
export type TopKind = "tee" | "shirt" | "jumper" | "hoodie" | "football" | "gown" | "pyjamas" | "workwear" | "fleece";
export type BottomKind = "trousers" | "jeans" | "shorts" | "pyjamas" | "bare" | "joggers";
export type ShoeKind = "trainers" | "shoes" | "boots" | "bare" | "slippers" | "football" | "socks";

export type Wear = {
  skin: string;
  /** Lips: normal, or blue with cyanosis. */
  lips?: "normal" | "blue" | "pale";
  hair: string;
  hairStyle: HairStyle;
  top: string;
  topKind: TopKind;
  sleeves: "short" | "long";
  hiVis?: string | null;
  bottom: string;
  bottomKind: BottomKind;
  shoes: ShoeKind;
  shoeColour: string;
  eyes: "open" | "half" | "closed";
  mouth: "closed" | "open";
  beard?: boolean;
  glasses?: boolean;
  /** A shirt number for the football kit. */
  number?: string;
  /** Wet through: darker cloth, hair flat. */
  wet?: boolean;
  /** Blush on the cheeks. */
  flushed?: boolean;
  /** Lines and thinner lips. */
  elderly?: boolean;
  child?: boolean;
  sweating?: boolean;
};

export type FigureProps = {
  rig: Rig;
  w: Wear;
  /** Class and style on the chest group (breathing, compressions). */
  chestClass?: string;
  chestStyle?: CSSProperties;
  /** Drawn on the trunk, moving with it (pads, electrodes, dressings). */
  onChest?: ReactNode;
  /** Drawn over the whole figure (masks, cuffs, lines). */
  over?: ReactNode;
  shadow?: boolean;
};

const SOFT = { vectorEffect: "non-scaling-stroke" as const };

function Hand({ wrist, tip, w, side, palmUp, flat, skin }: { wrist: Pt; tip: Pt; w: number; side: 1 | -1; palmUp: boolean; flat: boolean; skin: string }) {
  const d = unit(sub(tip, wrist));
  const n = perp(d);
  const L = len(sub(tip, wrist));
  const palmEnd = add(wrist, mul(d, L * 0.55));
  const palmW = w * 1.35;
  const palm = capsule(add(wrist, mul(d, -w * 0.1)), palmEnd, w * 0.95, palmW);
  const fingers = Array.from({ length: 4 }, (_, i) => {
    const t = (i - 1.5) / 1.5;
    const base = add(palmEnd, mul(n, t * palmW * 0.62));
    const lenF = L * (0.42 - Math.abs(t) * 0.08);
    const dir = unit(add(d, mul(n, t * 0.14 * (flat ? 1 : 0.4))));
    return capsule(add(base, mul(dir, -w * 0.05)), add(base, mul(dir, lenF)), w * 0.3, w * 0.24);
  });
  // The thumb: out to the near side of the body when the palm is down.
  const thumbSide = palmUp ? side : -side;
  const tb = add(lerp(wrist, palmEnd, 0.3), mul(n, thumbSide * palmW * 0.75));
  const thumb = capsule(lerp(wrist, palmEnd, 0.35), add(tb, mul(d, w * 0.4)), w * 0.36, w * 0.26);
  const tone = palmUp ? mix(skin, "#ffffff", 0.08) : skin;
  return (
    <g>
      <path d={palm} fill={tone} {...lineSoft} />
      {fingers.map((f, i) => <path key={i} d={f} fill={tone} {...lineSoft} />)}
      <path d={thumb} fill={tone} {...lineSoft} />
      {!palmUp && <path d={`M${P(lerp(wrist, palmEnd, 0.9))} m${n2(-w * 0.5)} 0 l${n2(w)} 0`} stroke={darken(skin, 0.3)} strokeWidth={0.7} opacity={0.4} {...SOFT} fill="none" />}
    </g>
  );
}

function Shoe({ ankle, toe, kind, colour, w, L, flat, skin, side }: { ankle: Pt; toe: Pt; kind: ShoeKind; colour: string; w: number; L: number; flat: boolean; skin: string; side: 1 | -1 }) {
  const d = unit(toe);
  const n = perp(d);
  const heel = add(ankle, mul(d, -(flat ? L * 0.12 : w * 0.3)));
  const tip = add(ankle, mul(d, L));
  if (kind === "bare" || kind === "socks") {
    const fill = kind === "socks" ? "#e9ecef" : skin;
    return (
      <g>
        <path d={capsule(heel, add(tip, mul(d, -w * 0.3)), w * 0.42, w * 0.5)} fill={fill} {...lineSoft} />
        {Array.from({ length: 5 }, (_, i) => {
          const t = (i - 2) / 2;
          const c = add(add(tip, mul(d, -w * 0.3)), mul(n, t * w * 0.42 * side));
          return <circle key={i} cx={c[0]} cy={c[1]} r={w * (0.11 - Math.abs(t) * 0.02)} fill={fill} {...lineSoft} />;
        })}
      </g>
    );
  }
  const body = capsule(heel, tip, w * 0.46, w * 0.5);
  const sole = darken(colour, 0.45);
  return (
    <g>
      <path d={body} fill={colour} {...line} />
      {flat && (
        <g>
          {/* Laces and a toe cap on a shoe seen from the top. */}
          <path d={capsule(lerp(heel, tip, 0.45), lerp(heel, tip, 0.8), w * 0.22, w * 0.18)} fill={darken(colour, 0.12)} opacity={0.9} />
          {[0.5, 0.6, 0.7].map((t) => { const c = lerp(heel, tip, t); return <path key={t} d={`M${P(add(c, mul(n, -w * 0.16)))} L${P(add(c, mul(n, w * 0.16)))}`} stroke={kind === "trainers" ? "#ffffff" : darken(colour, 0.5)} strokeWidth={0.8} {...SOFT} />; })}
          {kind === "trainers" && <path d={`M${P(add(lerp(heel, tip, 0.25), mul(n, w * 0.4)))} Q${P(add(lerp(heel, tip, 0.5), mul(n, w * 0.1)))} ${P(add(lerp(heel, tip, 0.8), mul(n, w * 0.42)))}`} fill="none" stroke={darken(colour, 0.35)} strokeWidth={1.1} {...SOFT} />}
          {kind === "football" && <path d={capsule(lerp(heel, tip, 0.05), lerp(heel, tip, 0.3), w * 0.46, w * 0.46)} fill="#ffffff" opacity={0.55} />}
        </g>
      )}
      {!flat && (
        <g>
          {/* Toes up: we see the sole's edge and the toe box. */}
          <path d={capsule(lerp(heel, tip, 0.5), tip, w * 0.48, w * 0.5)} fill={sole} opacity={0.85} />
          <path d={capsule(lerp(heel, tip, 0.1), lerp(heel, tip, 0.55), w * 0.4, w * 0.44)} fill={colour} />
          {kind === "trainers" && <path d={`M${P(add(lerp(heel, tip, 0.2), mul(n, -w * 0.3)))} L${P(add(lerp(heel, tip, 0.2), mul(n, w * 0.3)))}`} stroke="#ffffff" strokeWidth={1.2} {...SOFT} />}
        </g>
      )}
      {kind === "boots" && <path d={capsule(add(heel, mul(d, -w * 0.1)), lerp(heel, tip, 0.2), w * 0.5, w * 0.5)} fill={darken(colour, 0.2)} {...lineSoft} />}
    </g>
  );
}

/** The face looking up: hair, brow, eyes, nose, mouth, ears. Drawn upright at the crown; turned by the caller. */
function Face({ r, w }: { r: Rig; w: Wear }) {
  const L = r.headL, W = r.headW;
  const cx = 0;
  const skin = w.skin;
  const eyeY = L * 0.5, eyeX = W * 0.21, eyeRx = W * 0.105, eyeRy = W * 0.058;
  const irisR = W * 0.052, pupilR = W * 0.026;
  const browY = L * 0.415;
  const noseTip: Pt = [cx, L * 0.655];
  const mouthY = L * 0.79;
  const lipColour = w.lips === "blue" ? "#5a6f8a" : w.lips === "pale" ? mix(darken(skin, 0.1), "#c9a0a0", 0.3) : mix(darken(skin, 0.25), "#b25a5a", 0.55);
  const headPath = smooth([
    [0, 0], [W * 0.38, L * 0.06], [W * 0.5, L * 0.3], [W * 0.49, L * 0.55], [W * 0.38, L * 0.8], [W * 0.17, L * 0.985], [0, L],
    [-W * 0.17, L * 0.985], [-W * 0.38, L * 0.8], [-W * 0.49, L * 0.55], [-W * 0.5, L * 0.3], [-W * 0.38, L * 0.06],
  ], 0.6);
  const hairColour = w.wet ? darken(w.hair, 0.25) : w.hair;
  const style = w.hairStyle;
  // Hair behind the head (long hair spread on the ground, a bob to the jaw) and the cap on top.
  const hairBack = style === "long"
    ? smooth([[0, -L * 0.08], [W * 0.62, L * 0.02], [W * 0.78, L * 0.4], [W * 0.72, L * 0.9], [W * 0.5, L * 1.25], [0, L * 1.32], [-W * 0.5, L * 1.25], [-W * 0.72, L * 0.9], [-W * 0.78, L * 0.4], [-W * 0.62, L * 0.02]], 0.6)
    : style === "bob"
      ? smooth([[0, -L * 0.06], [W * 0.58, L * 0.05], [W * 0.66, L * 0.45], [W * 0.6, L * 0.85], [W * 0.4, L * 1.0], [0, L * 0.98], [-W * 0.4, L * 1.0], [-W * 0.6, L * 0.85], [-W * 0.66, L * 0.45], [-W * 0.58, L * 0.05]], 0.6)
      : null;
  const hairCap = style === "bald"
    ? null
    : style === "child"
      ? smooth([[0, -L * 0.03], [W * 0.42, L * 0.05], [W * 0.52, L * 0.3], [W * 0.46, L * 0.42], [W * 0.2, L * 0.3], [0, L * 0.33], [-W * 0.2, L * 0.3], [-W * 0.46, L * 0.42], [-W * 0.52, L * 0.3], [-W * 0.42, L * 0.05]], 0.55)
      : style === "short"
        ? smooth([[0, -L * 0.03], [W * 0.4, L * 0.05], [W * 0.52, L * 0.3], [W * 0.5, L * 0.48], [W * 0.38, L * 0.36], [W * 0.1, L * 0.27], [-W * 0.18, L * 0.28], [-W * 0.4, L * 0.38], [-W * 0.5, L * 0.48], [-W * 0.52, L * 0.3], [-W * 0.4, L * 0.05]], 0.55)
        : smooth([[0, -L * 0.04], [W * 0.42, L * 0.04], [W * 0.54, L * 0.3], [W * 0.52, L * 0.5], [W * 0.42, L * 0.3], [W * 0.05, L * 0.24], [-W * 0.3, L * 0.3], [-W * 0.46, L * 0.42], [-W * 0.52, L * 0.5], [-W * 0.54, L * 0.3], [-W * 0.42, L * 0.04]], 0.55);
  const baldFringe = style === "bald" ? smooth([[W * 0.3, L * 0.12], [W * 0.5, L * 0.28], [W * 0.5, L * 0.55], [W * 0.42, L * 0.5], [W * 0.4, L * 0.3]], 0.5) : null;
  const eye = (x: number) => {
    if (w.eyes === "closed") {
      return <path d={`M${n2(x - eyeRx)} ${n2(eyeY)} Q${n2(x)} ${n2(eyeY + eyeRy * 1.3)} ${n2(x + eyeRx)} ${n2(eyeY)}`} fill="none" stroke={darken(skin, 0.55)} strokeWidth={1.1} {...SOFT} strokeLinecap="round" />;
    }
    const half = w.eyes === "half";
    return (
      <g>
        <ellipse cx={x} cy={eyeY} rx={eyeRx} ry={eyeRy} fill="#f7f7f5" {...lineSoft} />
        <circle cx={x} cy={eyeY} r={irisR} fill={w.child ? "#4a7fb5" : "#4a3a2a"} />
        <circle cx={x} cy={eyeY} r={pupilR} fill="#101418" />
        <circle cx={x - irisR * 0.35} cy={eyeY - irisR * 0.35} r={pupilR * 0.45} fill="#ffffff" opacity={0.8} />
        {half && <path d={`M${n2(x - eyeRx * 1.05)} ${n2(eyeY)} Q${n2(x)} ${n2(eyeY - eyeRy * 0.2)} ${n2(x + eyeRx * 1.05)} ${n2(eyeY)} L${n2(x + eyeRx * 1.05)} ${n2(eyeY - eyeRy * 1.4)} L${n2(x - eyeRx * 1.05)} ${n2(eyeY - eyeRy * 1.4)} Z`} fill={skin} />}
        <path d={`M${n2(x - eyeRx)} ${n2(eyeY - eyeRy * 0.2)} Q${n2(x)} ${n2(eyeY - eyeRy * 1.5)} ${n2(x + eyeRx)} ${n2(eyeY - eyeRy * 0.2)}`} fill="none" stroke={darken(skin, 0.5)} strokeWidth={0.9} {...SOFT} />
      </g>
    );
  };
  return (
    <g>
      {hairBack && <path d={hairBack} fill={hairColour} {...lineSoft} />}
      {/* Ears */}
      <ellipse cx={-W * 0.5} cy={L * 0.5} rx={W * 0.07} ry={L * 0.075} fill={skin} {...lineSoft} />
      <ellipse cx={W * 0.5} cy={L * 0.5} rx={W * 0.07} ry={L * 0.075} fill={skin} {...lineSoft} />
      <path d={headPath} fill={skin} {...line} />
      {/* Shade under the brow and along the jaw: the face is a form, not a disc. */}
      <path d={headPath} fill="url(#ps-face-shade)" />
      {w.flushed && <g opacity={0.35}><ellipse cx={-W * 0.27} cy={L * 0.62} rx={W * 0.12} ry={L * 0.06} fill="#e0564d" /><ellipse cx={W * 0.27} cy={L * 0.62} rx={W * 0.12} ry={L * 0.06} fill="#e0564d" /></g>}
      {w.beard && <path d={smooth([[-W * 0.42, L * 0.62], [-W * 0.3, L * 0.9], [0, L * 1.0], [W * 0.3, L * 0.9], [W * 0.42, L * 0.62], [W * 0.3, L * 0.72], [0, L * 0.76], [-W * 0.3, L * 0.72]], 0.5)} fill={hairColour} opacity={0.75} />}
      {/* Brows */}
      <path d={`M${n2(-eyeX - eyeRx * 1.1)} ${n2(browY + L * 0.01)} Q${n2(-eyeX)} ${n2(browY - L * 0.02)} ${n2(-eyeX + eyeRx * 1.1)} ${n2(browY + L * 0.005)}`} fill="none" stroke={darken(hairColour, 0.1)} strokeWidth={w.child ? 1 : 1.6} strokeLinecap="round" {...SOFT} />
      <path d={`M${n2(eyeX - eyeRx * 1.1)} ${n2(browY + L * 0.005)} Q${n2(eyeX)} ${n2(browY - L * 0.02)} ${n2(eyeX + eyeRx * 1.1)} ${n2(browY + L * 0.01)}`} fill="none" stroke={darken(hairColour, 0.1)} strokeWidth={w.child ? 1 : 1.6} strokeLinecap="round" {...SOFT} />
      {eye(-eyeX)}
      {eye(eyeX)}
      {w.glasses && (
        <g fill="none" stroke="#2b3139" strokeWidth={1.1}>
          <ellipse cx={-eyeX} cy={eyeY} rx={eyeRx * 1.5} ry={eyeRy * 2.1} {...SOFT} />
          <ellipse cx={eyeX} cy={eyeY} rx={eyeRx * 1.5} ry={eyeRy * 2.1} {...SOFT} />
          <path d={`M${n2(-eyeX + eyeRx * 1.5)} ${n2(eyeY)} L${n2(eyeX - eyeRx * 1.5)} ${n2(eyeY)}`} {...SOFT} />
        </g>
      )}
      {/* Nose: the bridge and the tip pointing at the viewer, nostrils either side. */}
      <path d={`M${n2(-W * 0.045)} ${n2(L * 0.5)} L${n2(-W * 0.075)} ${n2(noseTip[1] - L * 0.01)} Q${n2(0)} ${n2(noseTip[1] + L * 0.03)} ${n2(W * 0.075)} ${n2(noseTip[1] - L * 0.01)} L${n2(W * 0.045)} ${n2(L * 0.5)}`} fill={mix(skin, "#ffffff", 0.08)} stroke={darken(skin, 0.4)} strokeWidth={0.8} strokeOpacity={0.6} {...SOFT} />
      <ellipse cx={-W * 0.05} cy={noseTip[1] + L * 0.005} rx={W * 0.02} ry={W * 0.014} fill={darken(skin, 0.5)} opacity={0.6} />
      <ellipse cx={W * 0.05} cy={noseTip[1] + L * 0.005} rx={W * 0.02} ry={W * 0.014} fill={darken(skin, 0.5)} opacity={0.6} />
      {w.elderly && (
        <g fill="none" stroke={darken(skin, 0.35)} strokeWidth={0.8} opacity={0.6}>
          <path d={`M${n2(-W * 0.12)} ${n2(L * 0.68)} Q${n2(-W * 0.2)} ${n2(L * 0.78)} ${n2(-W * 0.16)} ${n2(L * 0.86)}`} {...SOFT} />
          <path d={`M${n2(W * 0.12)} ${n2(L * 0.68)} Q${n2(W * 0.2)} ${n2(L * 0.78)} ${n2(W * 0.16)} ${n2(L * 0.86)}`} {...SOFT} />
          <path d={`M${n2(-W * 0.2)} ${n2(L * 0.33)} L${n2(W * 0.2)} ${n2(L * 0.33)}`} opacity={0.6} {...SOFT} />
        </g>
      )}
      {/* Mouth */}
      {w.mouth === "open" ? (
        <g>
          <ellipse cx={0} cy={mouthY + L * 0.015} rx={W * 0.13} ry={L * 0.055} fill="#4a1f22" stroke={lipColour} strokeWidth={1.4} {...SOFT} />
          <path d={`M${n2(-W * 0.09)} ${n2(mouthY - L * 0.02)} h${n2(W * 0.18)}`} stroke="#f3efe6" strokeWidth={1.6} {...SOFT} opacity={0.85} />
        </g>
      ) : (
        <g>
          <path d={`M${n2(-W * 0.15)} ${n2(mouthY)} Q${n2(0)} ${n2(mouthY + L * (w.elderly ? 0.0 : 0.02))} ${n2(W * 0.15)} ${n2(mouthY)}`} fill="none" stroke={lipColour} strokeWidth={w.elderly ? 1.3 : 2.2} strokeLinecap="round" {...SOFT} />
          <path d={`M${n2(-W * 0.15)} ${n2(mouthY)} Q${n2(0)} ${n2(mouthY - L * 0.012)} ${n2(W * 0.15)} ${n2(mouthY)}`} fill="none" stroke={darken(lipColour, 0.3)} strokeWidth={0.9} strokeLinecap="round" {...SOFT} />
        </g>
      )}
      {hairCap && <path d={hairCap} fill={hairColour} {...line} />}
      {hairCap && style !== "child" && <path d={hairCap} fill="url(#ps-hair-shine)" />}
      {baldFringe && <g fill={hairColour} opacity={0.9}><path d={baldFringe} /><path d={baldFringe} transform="scale(-1 1)" /></g>}
      {w.sweating && (
        <g className="ps-sweat">
          <path d={`M${n2(-W * 0.3)} ${n2(L * 0.3)} q-0.012 0.02 0 0.03 q0.012 -0.01 0 -0.03z`} />
          <path d={`M${n2(W * 0.33)} ${n2(L * 0.36)} q-0.012 0.02 0 0.03 q0.012 -0.01 0 -0.03z`} />
          <path d={`M${n2(W * 0.1)} ${n2(L * 0.26)} q-0.012 0.02 0 0.03 q0.012 -0.01 0 -0.03z`} />
        </g>
      )}
    </g>
  );
}

/** Gradients the figure paints with; put once in the scene's defs. */
export function FigureDefs() {
  return (
    <>
      <linearGradient id="ps-round" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.28" />
        <stop offset="0.22" stopColor="#000" stopOpacity="0.05" />
        <stop offset="0.45" stopColor="#fff" stopOpacity="0.12" />
        <stop offset="0.7" stopColor="#000" stopOpacity="0.04" />
        <stop offset="1" stopColor="#000" stopOpacity="0.3" />
      </linearGradient>
      <linearGradient id="ps-round-v" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0.22" />
        <stop offset="0.3" stopColor="#fff" stopOpacity="0.1" />
        <stop offset="1" stopColor="#000" stopOpacity="0.26" />
      </linearGradient>
      <radialGradient id="ps-face-shade" cx="0.5" cy="0.42" r="0.62">
        <stop offset="0.55" stopColor="#fff" stopOpacity="0.1" />
        <stop offset="0.85" stopColor="#000" stopOpacity="0.06" />
        <stop offset="1" stopColor="#000" stopOpacity="0.3" />
      </radialGradient>
      <radialGradient id="ps-hair-shine" cx="0.5" cy="0.25" r="0.6">
        <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
        <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.25" />
      </radialGradient>
      <radialGradient id="ps-shadow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.6" stopColor="#000" stopOpacity="0.35" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
    </>
  );
}

/** A limb segment with its roundness, in the garment's colour. */
function Seg({ a, b, wa, wb, fill, outline = true }: { a: Pt; b: Pt; wa: number; wb: number; fill: string; outline?: boolean }) {
  const d = capsule(a, b, wa, wb);
  const v = sub(b, a);
  // Shade across the limb: the gradient runs across the bounding box, so a
  // limb lying along the body takes the horizontal one and an arm flung out
  // sideways the vertical one.
  const across = Math.abs(v[0]) > Math.abs(v[1]) ? "url(#ps-round-v)" : "url(#ps-round)";
  return (
    <g>
      <path d={d} fill={fill} {...(outline ? line : {})} />
      <path d={d} fill={across} />
    </g>
  );
}

/** The person, from the ground up. */
export function PlanFigure({ rig: r, w, chestClass, chestStyle, onChest, over, shadow = true }: FigureProps) {
  const skin = w.skin;
  const cloth = (c: string) => (w.wet ? darken(c, 0.3) : c);
  const top = cloth(w.top), bottom = cloth(w.bottom);
  const k = r.k;
  const sleeveLong = w.sleeves === "long";
  const bare = w.bottomKind === "bare";
  const shorts = w.bottomKind === "shorts";
  const gown = w.topKind === "gown";
  const armSeg = (arm: Limb, side: 1 | -1, palmUp: boolean, flat: boolean) => {
    const sleeveEnd = lerp(arm.a, arm.b, gown ? 0.45 : 0.62);
    return (
      <g>
        {/* Upper arm: skin, then the sleeve over it. */}
        <Seg a={arm.a} b={arm.b} wa={r.armW[0]} wb={r.armW[1]} fill={skin} />
        {sleeveLong
          ? <g><Seg a={arm.a} b={arm.b} wa={r.armW[0] * 1.08} wb={r.armW[1] * 1.1} fill={top} /><Seg a={arm.b} b={lerp(arm.b, arm.c, 0.93)} wa={r.armW[1] * 1.1} wb={r.armW[2] * 1.15} fill={top} /></g>
          : <Seg a={arm.a} b={sleeveEnd} wa={r.armW[0] * 1.08} wb={r.armW[1] * 1.14} fill={top} />}
        {!sleeveLong && <Seg a={arm.b} b={arm.c} wa={r.armW[1]} wb={r.armW[2]} fill={skin} />}
        {sleeveLong && <Seg a={lerp(arm.b, arm.c, 0.9)} b={arm.c} wa={r.armW[2] * 1.05} wb={r.armW[2]} fill={skin} outline={false} />}
        <Hand wrist={arm.c} tip={arm.d} w={r.armW[2]} side={side} palmUp={palmUp} flat={flat} skin={skin} />
      </g>
    );
  };
  const legSeg = (leg: Limb, side: 1 | -1, toe: Pt) => {
    const trouserEnd = shorts ? lerp(leg.a, leg.b, 0.5) : lerp(leg.b, leg.c, 0.92);
    const flat = r.feetFlat;
    return (
      <g>
        <Seg a={leg.a} b={leg.b} wa={r.legW[0]} wb={r.legW[1]} fill={skin} />
        <Seg a={leg.b} b={leg.c} wa={r.legW[1]} wb={r.legW[2]} fill={skin} />
        {!bare && (
          shorts
            ? <Seg a={add(leg.a, [0, -r.legW[0] * 0.3])} b={trouserEnd} wa={r.legW[0] * 1.12} wb={r.legW[0] * 1.08} fill={bottom} />
            : <g><Seg a={add(leg.a, [0, -r.legW[0] * 0.3])} b={leg.b} wa={r.legW[0] * 1.1} wb={r.legW[1] * 1.12} fill={bottom} /><Seg a={leg.b} b={trouserEnd} wa={r.legW[1] * 1.12} wb={r.legW[2] * 1.25} fill={bottom} /></g>
        )}
        {w.bottomKind === "jeans" && <path d={`M${P(lerp(leg.a, leg.b, 0.05))} L${P(lerp(leg.b, trouserEnd, 0.9))}`} stroke={darken(bottom, 0.35)} strokeWidth={0.8} fill="none" opacity={0.7} {...SOFT} transform={`translate(${n2(side * r.legW[1] * 0.75)} 0)`} />}
        {w.bottomKind === "pyjamas" && [0.25, 0.5, 0.75].map((t) => <path key={t} d={`M${P(lerp(leg.a, leg.c, 0.02))} L${P(lerp(leg.a, trouserEnd, 0.98))}`} stroke="#ffffff" strokeWidth={1} opacity={0.45} fill="none" {...SOFT} transform={`translate(${n2((t - 0.5) * r.legW[0] * 1.6)} 0)`} />)}
        <Shoe ankle={leg.c} toe={toe} kind={w.shoes} colour={w.shoeColour} w={r.footW} L={r.footL} flat={flat} skin={skin} side={side} />
      </g>
    );
  };
  // Trunk: the outline in cloth (or a gown, or skin for the open neck), with its shading.
  const neckline = gown
    ? `M${n2(-r.shoulderW * 0.55)} ${n2(r.shoulderY - 0.01 * k)} L0 ${n2(r.shoulderY + 0.09 * k)} L${n2(r.shoulderW * 0.55)} ${n2(r.shoulderY - 0.01 * k)}`
    : w.topKind === "shirt"
      ? `M${n2(-r.neckW * 0.75)} ${n2(r.neckBase[1] - 0.012 * k)} L${n2(-r.neckW * 0.2)} ${n2(r.neckBase[1] + 0.06 * k)} L0 ${n2(r.neckBase[1] + 0.035 * k)} L${n2(r.neckW * 0.2)} ${n2(r.neckBase[1] + 0.06 * k)} L${n2(r.neckW * 0.75)} ${n2(r.neckBase[1] - 0.012 * k)}`
      : `M${n2(-r.neckW * 0.8)} ${n2(r.neckBase[1] - 0.01 * k)} Q0 ${n2(r.neckBase[1] + 0.05 * k)} ${n2(r.neckW * 0.8)} ${n2(r.neckBase[1] - 0.01 * k)}`;
  const chestCx = 0, chestCy = r.chestY;
  const bellyShade = r.build.pregnant ? <ellipse cx={0} cy={r.waistY + 0.02 * k} rx={r.waistW * 0.85} ry={0.17 * k} fill="url(#ps-shadow)" opacity={0.5} /> : null;
  const shadowRx = r.pose === "seated" ? r.shoulderW * 1.6 : r.shoulderW * 1.5;
  return (
    <g className="ps-fig">
      {shadow && <ellipse cx={0.02 * k} cy={(r.bottom + 0.05 * k) / 2} rx={shadowRx} ry={(r.bottom + 0.1 * k) / 2} fill="url(#ps-shadow)" />}
      {/* Legs */}
      {legSeg(r.legR, -1, r.toeR)}
      {legSeg(r.legL, 1, r.toeL)}
      {/* Arms that lie by the sides go under the trunk's edge; reaching arms come over it. */}
      {r.handFlatR && r.armR.c[0] < -r.chestW * 0.9 && armSeg(r.armR, -1, r.palmUpR, r.handFlatR)}
      {r.handFlatL && r.armL.c[0] > r.chestW * 0.9 && armSeg(r.armL, 1, r.palmUpL, r.handFlatL)}
      {/* Trunk */}
      <g className={chestClass} style={chestStyle}>
        <path d={r.torso} fill={gown ? "#9fc4dd" : top} {...line} />
        <path d={r.torso} fill="url(#ps-round)" />
        {w.topKind === "football" && <g>{[-0.5, 0.5].map((t) => <path key={t} d={`M${n2(t * r.chestW * 0.9)} ${n2(r.shoulderY)} L${n2(t * r.hipW * 0.9)} ${n2(r.hipY)}`} stroke="#ffffff" strokeWidth={0.02 * k} opacity={0.85} />)}</g>}
        {w.topKind === "pyjamas" && <g>{[-0.6, -0.2, 0.2, 0.6].map((t) => <path key={t} d={`M${n2(t * r.chestW)} ${n2(r.shoulderY)} L${n2(t * r.hipW)} ${n2(r.hipY + 0.02 * k)}`} stroke="#ffffff" strokeWidth={0.012 * k} opacity={0.5} />)}</g>}
        {w.topKind === "hoodie" && <path d={`M${n2(-r.chestW * 0.55)} ${n2(r.waistY)} h${n2(r.chestW * 1.1)} v${n2(0.12 * k)} h${n2(-r.chestW * 1.1)} z`} fill={darken(top, 0.12)} {...lineSoft} />}
        {w.topKind === "shirt" && <g>{[0.12, 0.3, 0.48, 0.66].map((t) => <circle key={t} cx={0} cy={r.shoulderY + (r.hipY - r.shoulderY) * t} r={0.009 * k} fill={darken(top, 0.4)} />)}<path d={`M0 ${n2(r.shoulderY + 0.04 * k)} V${n2(r.hipY)}`} stroke={darken(top, 0.25)} strokeWidth={0.8} {...SOFT} /></g>}
        {w.topKind === "jumper" && <path d={`M${n2(-r.hipW * 0.95)} ${n2(r.hipY - 0.03 * k)} h${n2(r.hipW * 1.9)}`} stroke={darken(top, 0.2)} strokeWidth={0.03 * k} />}
        {w.topKind === "football" && w.number && <text x={0} y={r.chestY + 0.02 * k} textAnchor="middle" fontSize={0.12 * k} fontWeight={800} fill="#ffffff" fontFamily="Arial, sans-serif" opacity={0.9}>{w.number}</text>}
        {w.hiVis && (
          <g>
            <path d={smooth([[-r.shoulderW * 0.95, r.shoulderY + 0.01 * k], [-r.neckW * 0.9, r.neckBase[1] + 0.02 * k], [r.neckW * 0.9, r.neckBase[1] + 0.02 * k], [r.shoulderW * 0.95, r.shoulderY + 0.01 * k], [r.chestW * 0.98, r.chestY], [r.waistW * 1.05, r.waistY], [r.hipW * 0.95, r.hipY - 0.03 * k], [-r.hipW * 0.95, r.hipY - 0.03 * k], [-r.waistW * 1.05, r.waistY], [-r.chestW * 0.98, r.chestY]], 0.5)} fill={w.hiVis} {...line} opacity={0.97} />
            {[0.36, 0.52].map((t) => <path key={t} d={`M${n2(-r.chestW * 1.02)} ${n2(r.shoulderY + (r.hipY - r.shoulderY) * t)} h${n2(r.chestW * 2.04)}`} stroke="#d9dee2" strokeWidth={0.045 * k} opacity={0.95} />)}
            <path d={`M${n2(-r.shoulderW * 0.5)} ${n2(r.shoulderY + 0.02 * k)} L${n2(-r.chestW * 0.45)} ${n2(r.hipY - 0.05 * k)} M${n2(r.shoulderW * 0.5)} ${n2(r.shoulderY + 0.02 * k)} L${n2(r.chestW * 0.45)} ${n2(r.hipY - 0.05 * k)}`} stroke="#d9dee2" strokeWidth={0.04 * k} opacity={0.95} fill="none" />
          </g>
        )}
        {bellyShade}
        {/* The open neck shows skin. */}
        <path d={`${neckline} Z`} fill={skin} {...lineSoft} />
        {w.topKind === "shirt" && <path d={neckline} fill="none" {...line} />}
        <g transform={`translate(0 ${n2(chestCy - chestCy)})`}>{onChest}</g>
        <circle cx={chestCx} cy={chestCy} r={0} fill="none" />
      </g>
      {/* Arms over the trunk */}
      {!(r.handFlatR && r.armR.c[0] < -r.chestW * 0.9) && armSeg(r.armR, -1, r.palmUpR, r.handFlatR)}
      {!(r.handFlatL && r.armL.c[0] > r.chestW * 0.9) && armSeg(r.armL, 1, r.palmUpL, r.handFlatL)}
      {/* Neck and head */}
      <path d={capsule(r.neckTop, add(r.neckBase, [0, 0.02 * k]), r.neckW * 0.5, r.neckW * 0.55)} fill={darken(skin, 0.08)} {...lineSoft} />
      <g transform={`rotate(${n2(r.headTurn * 14)} 0 ${n2(r.headL * 0.85)})`}>
        <Face r={r} w={w} />
      </g>
      {over}
    </g>
  );
}

/** Places on the body that kit attaches to, in metres from the crown. Right = the patient's right (viewer's left). */
export function anchors(r: Rig) {
  const k = r.k;
  return {
    sternum: [0, r.chestY - 0.02 * k] as Pt,
    rightUpperChest: [-r.chestW * 0.55, r.shoulderY + 0.07 * k] as Pt,
    leftUpperChest: [r.chestW * 0.55, r.shoulderY + 0.07 * k] as Pt,
    leftLateral: [r.chestW * 0.78, r.chestY + 0.1 * k] as Pt,
    leftLower: [r.waistW * 0.75, r.waistY + 0.05 * k] as Pt,
    rightLower: [-r.waistW * 0.75, r.waistY + 0.05 * k] as Pt,
    abdomen: [0, r.waistY + 0.01 * k] as Pt,
    pelvis: [0, r.hipY - 0.01 * k] as Pt,
    neck: [0, r.neckBase[1] - 0.03 * k] as Pt,
    chin: [0, r.headL] as Pt,
    mouth: [0, r.headL * 0.79] as Pt,
    nose: [0, r.headL * 0.64] as Pt,
    forehead: [0, r.headL * 0.3] as Pt,
    earR: [-r.headW * 0.5, r.headL * 0.5] as Pt,
    earL: [r.headW * 0.5, r.headL * 0.5] as Pt,
    rightUpperArm: lerp(r.armR.a, r.armR.b, 0.5),
    leftUpperArm: lerp(r.armL.a, r.armL.b, 0.5),
    rightForearm: lerp(r.armR.b, r.armR.c, 0.55),
    leftForearm: lerp(r.armL.b, r.armL.c, 0.55),
    rightHandBack: lerp(r.armR.c, r.armR.d, 0.3),
    leftHandBack: lerp(r.armL.c, r.armL.d, 0.3),
    rightFinger: add(r.armR.d, [-r.armW[2] * 0.6, 0]),
    leftFinger: add(r.armL.d, [r.armW[2] * 0.6, 0]),
    rightWrist: r.armR.c,
    leftWrist: r.armL.c,
    rightThigh: lerp(r.legR.a, r.legR.b, 0.4),
    leftThigh: lerp(r.legL.a, r.legL.b, 0.4),
    rightKnee: r.legR.b,
    leftKnee: r.legL.b,
    rightShin: lerp(r.legR.b, r.legR.c, 0.5),
    leftShin: lerp(r.legL.b, r.legL.c, 0.5),
    hips: [0, r.hipY + 0.02 * k] as Pt,
    chestHalfW: r.chestW,
    hipHalfW: r.hipW,
  };
}
