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

/** An open Catmull-Rom spline through `pts`, as a path. */
export function smoothOpen(pts: Pt[], tension = 0.5): string {
  const n = pts.length;
  if (n < 2) return "";
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3];
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3];
    d += ` C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return d;
}

/** One outline round a two-segment limb, a to b to c, the joint blended
 *  rather than two tubes butted together: half-widths at each end and at
 *  the joint, the ends rounded. */
export function limbPath(a: Pt, b: Pt, c: Pt, wa: number, wb: number, wc: number): string {
  const d1 = unit(sub(b, a)), d2 = unit(sub(c, b));
  const n1 = perp(d1), n2 = perp(d2);
  const nb = unit(add(n1, n2));
  const m = wb / Math.max(0.6, nb[0] * n1[0] + nb[1] * n1[1]);
  const ab = lerp(a, b, 0.5), bc = lerp(b, c, 0.5);
  const right: Pt[] = [add(a, mul(n1, wa * 0.9)), add(ab, mul(n1, (wa + wb) / 2)), add(b, mul(nb, m)), add(bc, mul(n2, (wb + wc) / 2)), add(c, mul(n2, wc * 0.9))];
  const left: Pt[] = [add(c, mul(n2, -wc * 0.9)), add(bc, mul(n2, -(wb + wc) / 2)), add(b, mul(nb, -m)), add(ab, mul(n1, -(wa + wb) / 2)), add(a, mul(n1, -wa * 0.9))];
  return smooth([...right, add(c, mul(d2, wc)), ...left, add(a, mul(d1, -wa))], 0.5);
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
/** An outline in the thing's own colour, darkened: skin edged in a warm brown, cloth in its own shade, not ink. */
export const edge = (colour: string, amount = 0.5, opacity = 0.7, width = 0.8) => ({ stroke: darken(colour, amount), strokeWidth: width, strokeOpacity: opacity, vectorEffect: "non-scaling-stroke" as const, strokeLinejoin: "round" as const, strokeLinecap: "round" as const });

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
    [shoulderW * 0.8, shoulderY - F(k, 0.002)],
    [shoulderW * 0.98, shoulderY + F(k, 0.035)],
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
  /** The chest bared for pads or electrodes: the top cut up the front with
   *  shears and laid open, unbuttoned and laid open, or pushed up to the armpits. */
  exposed?: "cut" | "open" | "lifted";
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

// ---------------------------------------------------------------------------
// Hands
// ---------------------------------------------------------------------------

export type HandSpec = {
  /** The wrist centre and the direction the fingers point. */
  wrist: Pt; dir: Pt;
  /** Hand length, wrist to the middle fingertip, in metres. */
  L: number;
  /** Half-width at the wrist, in metres. */
  wW: number;
  /** Which side of `dir` the thumb lies: 1 the clockwise side on screen, -1 the other. */
  thumb: 1 | -1;
  /** How far the fingers are flexed: 0 flat, 1 a loose fist. From above a bent finger is a shorter one. */
  curl?: number;
  /** How far the fingers spread, 1 = a hand at rest. */
  splay?: number;
};

type Finger = { prox: string; dist: string; base: Pt; pip: Pt; dip: Pt; tip: Pt; dir: Pt; w: number };

export type HandParts = {
  palm: string;
  fingers: Finger[];
  thumb: { meta: string; prox: string; dist: string; cmc: Pt; mcp: Pt; ip: Pt; tip: Pt; dir: Pt; w: number };
  /** A point in the hand's frame: along the hand and across it, in hand lengths; across is positive on the thumb side. */
  at: (along: number, across: number) => Pt;
  L: number;
  dir: Pt;
};

export const rot = (v: Pt, a: number): Pt => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];

/** The shape of a hand seen from above, in the proportions of a real one:
 *  the palm just over half the length, widest at the knuckles and
 *  narrowing to the wrist, the heel of the hand bulging on the little-finger
 *  side; four fingers of different lengths that spread a little and bend
 *  at the knuckles; the thumb set off the heel of the hand at an angle,
 *  reaching about the index finger's first joint. */
export function handParts(h: HandSpec): HandParts {
  const d = unit(h.dir), n = perp(d), L = h.L, tS = h.thumb;
  const curl = Math.max(0, Math.min(1, h.curl ?? 0.15));
  const splay = h.splay ?? 1;
  const at = (a: number, c: number): Pt => add(add(h.wrist, mul(d, a * L)), mul(n, c * L * tS));
  const wW = Math.min(0.2, Math.max(0.14, h.wW / L));
  // The thumb tucks in towards the fingers as the hand closes.
  const tuck = 1 - 0.3 * curl - 0.15 * (1 - splay);
  const palm = smooth([
    at(0.0, -wW), at(0.18, -(wW + 0.04)), at(0.42, -0.225), at(0.5, -0.19),
    at(0.53, -0.07), at(0.55, 0.04), at(0.53, 0.15), at(0.49, 0.215),
    at(0.41, 0.24), at(0.3, 0.3 * tuck), at(0.16, 0.27 * tuck), at(0.05, wW + 0.03), at(-0.01, wW),
  ], 0.5);
  const spec = [
    { c: 0.165, b: 0.52, l: 0.40, s: 8 },
    { c: 0.055, b: 0.55, l: 0.45, s: 2 },
    { c: -0.055, b: 0.53, l: 0.42, s: -4 },
    { c: -0.165, b: 0.48, l: 0.33, s: -11 },
  ];
  const fingers: Finger[] = spec.map((f) => {
    const base = at(f.b, f.c);
    const ang = ((f.s * splay) * Math.PI) / 180;
    const fd = rot(d, ang * tS);
    const fd2 = rot(d, ang * 1.3 * tS);
    const l = f.l * L * (1 - 0.12 * curl);
    const pip = add(base, mul(fd, l * 0.5));
    const distL = l * 0.5 * (1 - 0.45 * curl);
    const tip = add(pip, mul(fd2, distL));
    const dip = add(pip, mul(fd2, distL * 0.6));
    const w = 0.05 * L;
    return {
      prox: capsule(add(base, mul(fd, -0.07 * L)), pip, w, w * 0.93),
      dist: capsule(add(pip, mul(fd2, -w * 0.4)), tip, w * 0.93, w * 0.8),
      base, pip, dip, tip, dir: fd2, w,
    };
  });
  const cmc = at(0.1, 0.16);
  const mcp = at(0.35, 0.33 * tuck);
  const ip = at(0.5 - 0.03 * curl, 0.42 * tuck);
  const tip = at(0.62 - 0.08 * curl, 0.47 * tuck);
  const tw = 0.065 * L;
  const td = unit(sub(tip, ip));
  const thumb = {
    meta: capsule(cmc, mcp, tw * 1.25, tw),
    prox: capsule(mcp, ip, tw, tw * 0.9),
    dist: capsule(add(ip, mul(td, -tw * 0.35)), tip, tw * 0.9, tw * 0.78),
    cmc, mcp, ip, tip, dir: td, w: tw,
  };
  return { palm, fingers, thumb, at, L, dir: d };
}

export type HandShapeProps = {
  parts: HandParts;
  fill: string;
  /** Lines on the back of the hand (knuckles, nails) or on the palm (creases), or none (a glove). */
  detail: "back" | "palm" | "glove";
  /** The nail colour, when the back of the hand shows. */
  nail?: string;
  /** Outline and crease ink. */
  ink?: string;
  /** A band at the wrist: a glove's cuff. */
  cuff?: string;
  /** A glossy surface: a nitrile glove. */
  sheen?: boolean;
  opacity?: number;
};

/** A hand drawn as one shape: the parts are outlined first and then
 *  filled over, so the line runs round the outside only, with the joints
 *  and the nails on top. */
export function HandShape({ parts, fill, detail, nail, ink = INK, cuff, sheen, opacity }: HandShapeProps) {
  const { palm, fingers, thumb, at, L } = parts;
  const all = [palm, ...fingers.flatMap((f) => [f.prox, f.dist]), thumb.meta, thumb.prox, thumb.dist];
  const outline = { stroke: ink, strokeWidth: 1.8, strokeOpacity: 0.5, vectorEffect: "non-scaling-stroke" as const, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const across = (v: Pt) => (Math.abs(v[0]) > Math.abs(v[1]) ? "url(#ps-round-v)" : "url(#ps-round)");
  const crease = { stroke: ink, strokeWidth: 0.7, strokeOpacity: 0.28, fill: "none", vectorEffect: "non-scaling-stroke" as const, strokeLinecap: "round" as const };
  const tick = (c: Pt, dir: Pt, w: number, bow = 0.25) => {
    const nn = perp(dir);
    const a = add(c, mul(nn, -w)), b = add(c, mul(nn, w)), m = add(c, mul(dir, w * bow));
    return `M${P(a)} Q${P(m)} ${P(b)}`;
  };
  return (
    <g opacity={opacity}>
      {all.map((d, i) => <path key={`o${i}`} d={d} fill={fill} {...outline} />)}
      {all.map((d, i) => <path key={`f${i}`} d={d} fill={fill} />)}
      {/* Roundness: across each finger, and a soft dome on the back of the hand. */}
      {fingers.map((f, i) => <g key={`s${i}`}><path d={capsule(f.base, f.pip, f.w, f.w * 0.93)} fill={across(f.dir)} opacity={0.7} /><path d={f.dist} fill={across(f.dir)} opacity={0.7} /></g>)}
      <path d={thumb.prox} fill={across(thumb.dir)} opacity={0.6} />
      <path d={thumb.dist} fill={across(thumb.dir)} opacity={0.6} />
      <path d={palm} fill="url(#ps-face-shade)" opacity={detail === "palm" ? 0.35 : 0.7} />
      {all.map((d, i) => <path key={`g${i}`} d={d} fill="url(#ps-grain)" opacity={0.8} />)}
      {sheen && all.map((d, i) => <path key={`h${i}`} d={d} fill="url(#ps-sheen)" opacity={0.85} />)}
      {detail === "back" && (
        <g>
          {/* The tendons fanning over the back of the hand, the knuckles, the joints and the nails. */}
          {fingers.map((f, i) => <path key={`t${i}`} d={`M${P(at(0.12, 0))} L${P(add(f.base, mul(f.dir, -0.04 * L)))}`} {...crease} strokeOpacity={0.1} />)}
          {fingers.map((f, i) => <path key={`k${i}`} d={tick(add(f.base, mul(f.dir, 0.015 * L)), f.dir, f.w * 0.62, 0.5)} {...crease} />)}
          {fingers.map((f, i) => <path key={`p${i}`} d={tick(f.pip, f.dir, f.w * 0.55)} {...crease} />)}
          {fingers.map((f, i) => <path key={`d${i}`} d={tick(f.dip, f.dir, f.w * 0.48)} {...crease} strokeOpacity={0.2} />)}
          <path d={tick(thumb.mcp, thumb.dir, thumb.w * 0.6, 0.5)} {...crease} />
          <path d={tick(thumb.ip, thumb.dir, thumb.w * 0.55)} {...crease} />
          {nail && fingers.map((f, i) => {
            const c = add(f.tip, mul(f.dir, -0.045 * L));
            return <rect key={`n${i}`} x={c[0] - 0.032 * L} y={c[1] - 0.028 * L} width={0.064 * L} height={0.056 * L} rx={0.02 * L} fill={nail} stroke={ink} strokeWidth={0.6} strokeOpacity={0.35} vectorEffect="non-scaling-stroke" transform={`rotate(${n2(deg(f.dir))} ${P(c)})`} />;
          })}
          {nail && (() => {
            const c = add(thumb.tip, mul(thumb.dir, -0.05 * L));
            return <rect x={c[0] - 0.036 * L} y={c[1] - 0.032 * L} width={0.072 * L} height={0.064 * L} rx={0.022 * L} fill={nail} stroke={ink} strokeWidth={0.6} strokeOpacity={0.35} vectorEffect="non-scaling-stroke" transform={`rotate(${n2(deg(thumb.dir))} ${P(c)})`} />;
          })()}
        </g>
      )}
      {detail === "palm" && (
        <g>
          {/* The creases of the palm and the fingers' flexion lines. */}
          <path d={`M${P(at(0.44, -0.2))} Q${P(at(0.51, -0.02))} ${P(at(0.5, 0.14))}`} {...crease} />
          <path d={`M${P(at(0.3, -0.19))} Q${P(at(0.39, 0))} ${P(at(0.44, 0.1))}`} {...crease} />
          <path d={`M${P(at(0.1, 0.1))} Q${P(at(0.3, 0.11))} ${P(at(0.42, 0.23))}`} {...crease} />
          {fingers.map((f, i) => <path key={`b${i}`} d={tick(add(f.base, mul(f.dir, 0.02 * L)), f.dir, f.w * 0.6, -0.3)} {...crease} />)}
          {fingers.map((f, i) => <path key={`p${i}`} d={tick(f.pip, f.dir, f.w * 0.58, -0.2)} {...crease} />)}
          {fingers.map((f, i) => <path key={`d${i}`} d={tick(f.dip, f.dir, f.w * 0.5, -0.2)} {...crease} strokeOpacity={0.2} />)}
          <path d={tick(thumb.ip, thumb.dir, thumb.w * 0.55, -0.2)} {...crease} />
        </g>
      )}
      {detail === "glove" && (
        <g>
          {/* A glove's slack gathers at the knuckles and the joints. */}
          {fingers.map((f, i) => <path key={`k${i}`} d={tick(add(f.base, mul(f.dir, 0.02 * L)), f.dir, f.w * 0.6, 0.5)} {...crease} strokeOpacity={0.22} />)}
          {fingers.map((f, i) => <path key={`p${i}`} d={tick(f.pip, f.dir, f.w * 0.55)} {...crease} strokeOpacity={0.22} />)}
          <path d={tick(thumb.ip, thumb.dir, thumb.w * 0.55)} {...crease} strokeOpacity={0.22} />
        </g>
      )}
      {cuff && <path d={capsule(at(-0.11, 0), at(-0.015, 0), parts.L * 0.175, parts.L * 0.165)} fill={cuff} {...outline} strokeWidth={0.9} strokeOpacity={0.35} />}
    </g>
  );
}

function Hand({ wrist, tip, w, side, palmUp, flat, skin, k }: { wrist: Pt; tip: Pt; w: number; side: 1 | -1; palmUp: boolean; flat: boolean; skin: string; k: number }) {
  const L = len(sub(tip, wrist));
  // Lying palm down, the thumb is on the side nearest the body; palm up it
  // is on the outside. Seen from above with the fingers pointing away, a
  // right hand's thumb is on its left and a left hand's on its right.
  const thumb: 1 | -1 = palmUp ? (side === 1 ? -1 : 1) : side;
  // A hand reaching to hold something is drawn shorter by the rig: it grips.
  const gripping = L < k * 0.17;
  const curl = palmUp && !flat ? 0.5 : gripping ? 0.4 : 0.15;
  const parts = handParts({ wrist, dir: sub(tip, wrist), L, wW: w, thumb, curl, splay: gripping ? 0.5 : 1 });
  const tone = palmUp ? mix(skin, "#ffffff", 0.08) : skin;
  return <HandShape parts={parts} fill={tone} detail={palmUp ? "palm" : "back"} nail={mix(mix(skin, "#ffffff", 0.3), "#f3c6c0", 0.25)} ink={darken(skin, 0.55)} />;
}

// ---------------------------------------------------------------------------
// Small strokes the body is detailed with
// ---------------------------------------------------------------------------

const SW = { ...SOFT, strokeLinecap: "round" as const };

/** A bowed line from a to b, bowing `bow` metres to the clockwise side. */
function bowed(a: Pt, b: Pt, bow: number): string {
  return `M${P(a)} Q${P(add(lerp(a, b, 0.5), mul(perp(unit(sub(b, a))), bow)))} ${P(b)}`;
}

/** A crease in cloth or skin: a soft dark line with a lighter ridge beside it. */
function Crease({ a, b, bow, k, o = 0.14, light = true }: { a: Pt; b: Pt; bow: number; k: number; o?: number; light?: boolean }) {
  const n = perp(unit(sub(b, a)));
  const off = mul(n, -0.004 * k);
  return (
    <g fill="none">
      <path d={bowed(a, b, bow)} stroke="#000" strokeWidth={1} strokeOpacity={o} {...SW} />
      {light && <path d={bowed(add(a, off), add(b, off), bow)} stroke="#fff" strokeWidth={0.8} strokeOpacity={o * 0.7} {...SW} />}
    </g>
  );
}

/** A point on a cubic Bézier. */
function cubicAt(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

/** The outline of a foot or a shoe from above: heel, the hollow of the
 *  arch on the inside, the ball, and the toe fuller on the big-toe side.
 *  `medial` is the unit vector towards the other foot. */
function footPath(heel: Pt, d: Pt, medial: Pt, L: number, w: number, scale = 1): string {
  const at = (t: number, across: number): Pt => add(add(heel, mul(d, t * L)), mul(medial, across * w * scale));
  return smooth([
    at(-0.02, 0), at(0.02, 0.33), at(0.2, 0.4), at(0.45, 0.37), at(0.72, 0.5), at(0.9, 0.47), at(1.0, 0.28), at(1.03, 0.08),
    at(1.0, -0.14), at(0.9, -0.36), at(0.72, -0.48), at(0.45, -0.44), at(0.2, -0.42), at(0.02, -0.33),
  ], 0.55);
}

function Shoe({ ankle, toe, kind, colour, w, L, flat, skin, side, k }: { ankle: Pt; toe: Pt; kind: ShoeKind; colour: string; w: number; L: number; flat: boolean; skin: string; side: 1 | -1; k: number }) {
  const d = unit(toe);
  const n = perp(d);
  const medial = mul(n, side);
  const heel = add(ankle, mul(d, -(flat ? L * 0.14 : w * 0.35)));
  const at = (t: number, across: number): Pt => add(add(heel, mul(d, t * L)), mul(medial, across * w));
  const outline = footPath(heel, d, medial, L, w);
  const across = Math.abs(d[0]) > Math.abs(d[1]) ? "url(#ps-round-v)" : "url(#ps-round)";
  const lace = (pairs: number[], colourL: string, width = 0.9, spread = 0.2) => (
    <g stroke={colourL} strokeWidth={width} fill="none">
      {pairs.slice(0, -1).map((t, i) => <g key={t}><path d={`M${P(at(t, -spread))} L${P(at(pairs[i + 1], spread))}`} {...SW} /><path d={`M${P(at(t, spread))} L${P(at(pairs[i + 1], -spread))}`} {...SW} /></g>)}
    </g>
  );
  const eyelets = (pairs: number[], spread = 0.2) => pairs.map((t) => [-1, 1].map((s) => { const c = at(t, s * spread); return <circle key={`${t}${s}`} cx={c[0]} cy={c[1]} r={w * 0.028} fill="#1b1b1b" opacity={0.7} />; }));
  if (kind === "bare") {
    // Toes along the front, the big toe inside; the ball and the ankle bones.
    const toes = [[0.95, 0.3, 0.13], [0.98, 0.09, 0.09], [0.96, -0.08, 0.08], [0.93, -0.23, 0.075], [0.88, -0.37, 0.065]];
    return (
      <g>
        <path d={footPath(heel, d, medial, L * 0.95, w)} fill={skin} {...lineSoft} />
        <path d={footPath(heel, d, medial, L * 0.95, w)} fill={across} opacity={0.8} />
        {toes.map(([t, c, rr], i) => {
          const p = at(t, c);
          const tip = add(p, mul(d, w * rr * 0.9));
          return (
            <g key={i}>
              <path d={capsule(add(p, mul(d, -w * rr * 1.2)), tip, w * rr, w * rr * 0.9)} fill={skin} {...lineSoft} />
              <ellipse cx={tip[0] - d[0] * w * rr * 0.45} cy={tip[1] - d[1] * w * rr * 0.45} rx={w * rr * 0.5} ry={w * rr * 0.42} fill={mix(skin, "#ffffff", 0.3)} stroke={darken(skin, 0.35)} strokeWidth={0.5} {...SOFT} transform={`rotate(${n2(deg(d))} ${n2(tip[0] - d[0] * w * rr * 0.45)} ${n2(tip[1] - d[1] * w * rr * 0.45)})`} />
            </g>
          );
        })}
        <ellipse cx={at(0.68, 0.05)[0]} cy={at(0.68, 0.05)[1]} rx={w * 0.3} ry={w * 0.16} fill="#fff" opacity={0.1} transform={`rotate(${n2(deg(d))} ${P(at(0.68, 0.05))})`} />
        {[-1, 1].map((s) => <circle key={s} cx={at(0.08, s * 0.3)[0]} cy={at(0.08, s * 0.3)[1]} r={w * 0.06} fill="#fff" opacity={0.18} />)}
      </g>
    );
  }
  if (kind === "socks") {
    return (
      <g>
        <path d={outline} fill="#e9ecef" {...lineSoft} />
        <path d={outline} fill={across} opacity={0.7} />
        <path d={capsule(at(-0.02, 0), at(0.2, 0), w * 0.36, w * 0.42)} fill="#c9ced3" opacity={0.6} />
        <path d={bowed(at(0.84, 0.42), at(0.84, -0.4), 0.004 * k)} fill="none" stroke="#9aa0a6" strokeWidth={0.7} {...SW} />
        <path d={capsule(at(-0.06, 0), at(0.06, 0), w * 0.38, w * 0.38)} fill="url(#ps-rib)" />
      </g>
    );
  }
  const soleColour = kind === "trainers" ? "#dfdbd3" : kind === "boots" ? "#5a3f28" : kind === "slippers" ? "#6b5a4a" : kind === "football" ? "#1b1b1b" : darken(colour, 0.4);
  return (
    <g>
      {/* The sole shows as a rim round the upper. */}
      <path d={footPath(heel, d, medial, L, w, 1.1)} fill={soleColour} {...line} />
      <path d={outline} fill={colour} stroke={darken(colour, 0.5)} strokeWidth={0.6} {...SOFT} />
      <path d={outline} fill={across} opacity={0.8} />
      {kind === "trainers" && (
        <g>
          <path d={smooth([at(0.74, 0.5), at(0.9, 0.47), at(1.0, 0.28), at(1.03, 0.08), at(1.0, -0.14), at(0.9, -0.36), at(0.74, -0.46), at(0.78, 0)], 0.5)} fill="url(#ps-mesh)" />
          <path d={bowed(at(0.76, 0.5), at(0.76, -0.47), -0.006 * k)} fill="none" stroke={darken(colour, 0.35)} strokeWidth={0.7} {...SW} />
          <path d={capsule(at(0.4, 0), at(0.8, 0), w * 0.17, w * 0.15)} fill={mix(colour, "#ffffff", 0.18)} />
          {flat ? <g>{eyelets([0.46, 0.56, 0.66, 0.76])}{lace([0.46, 0.56, 0.66, 0.76], "#f7f7f5")}</g> : lace([0.45, 0.62, 0.8], "#f7f7f5", 1.1, 0.24)}
          <path d={capsule(at(-0.01, 0), at(0.2, 0), w * 0.33, w * 0.41)} fill={darken(colour, 0.22)} opacity={0.9} />
          <path d={`M${P(at(0.22, -0.4))} Q${P(at(0.5, -0.15))} ${P(at(0.8, -0.42))}`} fill="none" stroke={darken(colour, 0.35)} strokeWidth={1.1} {...SW} />
        </g>
      )}
      {kind === "shoes" && (
        <g>
          <path d={bowed(at(0.72, 0.5), at(0.72, -0.47), -0.006 * k)} fill="none" stroke={darken(colour, 0.6)} strokeWidth={0.6} strokeOpacity={0.8} {...SW} />
          <path d={`M${P(at(0.42, 0.3))} L${P(at(0.7, 0.2))} M${P(at(0.42, -0.3))} L${P(at(0.7, -0.2))}`} fill="none" stroke={darken(colour, 0.6)} strokeWidth={0.6} strokeOpacity={0.7} {...SW} />
          {eyelets([0.48, 0.58, 0.68], 0.14)}
          {lace([0.48, 0.58, 0.68], darken(colour, 0.6), 0.7, 0.14)}
          <ellipse cx={at(0.6, 0.1)[0]} cy={at(0.6, 0.1)[1]} rx={w * 0.14} ry={w * 0.05} fill="#fff" opacity={0.22} transform={`rotate(${n2(deg(d))} ${P(at(0.6, 0.1))})`} />
        </g>
      )}
      {kind === "boots" && (
        <g>
          <path d={footPath(heel, d, medial, L, w, 1.1)} fill="none" stroke="#c9a46a" strokeWidth={0.6} strokeOpacity={0.7} {...SOFT} />
          <path d={capsule(at(-0.04, 0), at(0.24, 0), w * 0.42, w * 0.44)} fill={darken(colour, 0.15)} {...lineSoft} />
          <path d={capsule(at(0.0, 0), at(0.18, 0), w * 0.26, w * 0.3)} fill="#1b1b1b" opacity={0.85} />
          <path d={bowed(at(0.74, 0.5), at(0.74, -0.47), -0.006 * k)} fill="none" stroke={darken(colour, 0.5)} strokeWidth={0.7} {...SW} />
          {eyelets([0.3, 0.42, 0.54, 0.66], 0.18)}
          {lace([0.3, 0.42, 0.54, 0.66], "#3a2a1c", 1.0, 0.18)}
        </g>
      )}
      {kind === "slippers" && (
        <g>
          <path d={capsule(at(0.08, 0), at(0.5, 0), w * 0.3, w * 0.34)} fill="#f1e8d8" {...lineSoft} />
          <path d={capsule(at(0.08, 0), at(0.5, 0), w * 0.3, w * 0.34)} fill="url(#ps-mesh)" opacity={0.6} />
          <path d={bowed(at(0.52, 0.42), at(0.52, -0.42), 0.006 * k)} fill="none" stroke={darken(colour, 0.4)} strokeWidth={0.8} {...SW} />
        </g>
      )}
      {kind === "football" && (
        <g>
          <path d={`M${P(at(0.1, -0.42))} Q${P(at(0.5, -0.2))} ${P(at(0.92, -0.38))}`} fill="none" stroke="#ffffff" strokeWidth={1.4} strokeOpacity={0.85} {...SW} />
          <path d={`M${P(at(0.1, -0.32))} Q${P(at(0.5, -0.1))} ${P(at(0.9, -0.28))}`} fill="none" stroke="#ffffff" strokeWidth={0.8} strokeOpacity={0.6} {...SW} />
          {lace([0.45, 0.58, 0.71], "#f7f7f5", 0.8, 0.14)}
        </g>
      )}
    </g>
  );
}

/** The face looking up: hair, brow, eyes, nose, mouth, ears. Drawn upright at the crown; turned by the caller. */
function Face({ r, w }: { r: Rig; w: Wear }) {
  const L = r.headL, W = r.headW;
  const skin = w.skin;
  const child = !!w.child, elderly = !!w.elderly, female = r.build.sex === "female";
  const ink = darken(skin, 0.55);
  // Landmarks: a child's features sit lower on a rounder head.
  const eyeY = L * (child ? 0.55 : 0.5), eyeX = W * (child ? 0.21 : 0.2), eyeRx = W * (child ? 0.105 : 0.1), eyeRy = W * (child ? 0.065 : 0.056);
  const irisR = W * (child ? 0.057 : 0.047), pupilR = irisR * 0.45;
  const browY = eyeY - L * (child ? 0.075 : 0.09);
  const noseTipY = L * (child ? 0.68 : 0.655), noseW = W * (child ? 0.07 : 0.085);
  const mouthY = L * (child ? 0.815 : 0.8), mouthW = W * (child ? 0.12 : 0.15);
  const lip = w.lips === "blue" ? "#5a6f8a" : w.lips === "pale" ? mix(darken(skin, 0.1), "#c9a0a0", 0.3) : mix(darken(skin, 0.22), "#b25a5a", female ? 0.6 : 0.45);
  const chinW = child ? 0.14 : female ? 0.11 : 0.17;
  const headPath = headOutline(r, child);
  const faceClip = `ps-face-${Math.round(W * 1000)}-${Math.round(L * 1000)}-${child ? 1 : 0}${female ? 1 : 0}`;
  // Blood in the cheeks, unless the skin has gone grey or blue.
  const sat = (() => { const v = parseInt(skin.slice(1), 16); const c = [(v >> 16) & 255, (v >> 8) & 255, v & 255]; const mx = Math.max(...c); return mx ? (mx - Math.min(...c)) / mx : 0; })();
  const blush = sat > 0.2 && w.lips !== "blue";
  const hairColour = w.wet ? darken(w.hair, 0.25) : w.hair;
  const hairDark = darken(hairColour, 0.35), hairLight = mix(hairColour, "#ffffff", 0.3);
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
  // Strands of hair: from the parting out to the edge of the hair, each with a little wave.
  const strands = (n: number, centre: Pt, rx: number, ry: number, a0: number, a1: number, from: Pt, thick: number, keyBase: string) =>
    Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n;
      const a = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
      const end: Pt = [centre[0] + Math.cos(a) * rx, centre[1] + Math.sin(a) * ry];
      const start = lerp(from, end, 0.1 + 0.06 * ((i * 7) % 3));
      const v = sub(end, start);
      const c = add(lerp(start, end, 0.5), mul(perp(unit(v)), (i % 2 ? 1 : -1) * len(v) * 0.12));
      const light = i % 3 === 1;
      return <path key={`${keyBase}${i}`} d={`M${P(start)} Q${P(c)} ${P(end)}`} fill="none" stroke={light ? hairLight : hairDark} strokeWidth={thick * (light ? 0.7 : 1)} strokeOpacity={w.wet ? 0.55 : light ? 0.35 : 0.42} {...SW} />;
    });
  const eye = (x: number) => {
    const sd = x < 0 ? 1 : -1; // towards the nose
    const inner: Pt = [x + sd * eyeRx, eyeY + eyeRy * 0.15], outer: Pt = [x - sd * eyeRx * 1.02, eyeY - eyeRy * 0.1];
    const open = w.eyes === "open" ? 1 : w.eyes === "half" ? 0.42 : 0;
    const up = eyeRy * (0.25 + 1.2 * open);
    const u1: Pt = [x + sd * eyeRx * 0.5, eyeY - up * 1.3], u2: Pt = [x - sd * eyeRx * 0.35, eyeY - up * 1.35];
    const upper = `M${P(inner)} C${P(u1)} ${P(u2)} ${P(outer)}`;
    const lowerC = `C${n2(x - sd * eyeRx * 0.45)} ${n2(eyeY + eyeRy * 1.15)} ${n2(x + sd * eyeRx * 0.4)} ${n2(eyeY + eyeRy * 1.05)} ${P(inner)}`;
    const shape = `${upper} ${lowerC} Z`;
    const crease = `M${P(add(inner, [-sd * eyeRx * 0.1, -eyeRy * 1.3]))} C${n2(x + sd * eyeRx * 0.5)} ${n2(eyeY - eyeRy * 2.6)} ${n2(x - sd * eyeRx * 0.5)} ${n2(eyeY - eyeRy * 2.5)} ${P(add(outer, [-sd * eyeRx * 0.08, -eyeRy * 1.0]))}`;
    const id = `ps-eye-${sd}-${Math.round(W * 1000)}-${Math.round(L * 1000)}`;
    const lashes = child ? null : [0.72, 0.84, 0.94].map((t) => {
      const p = cubicAt(inner, u1, u2, outer, t);
      const q = cubicAt(inner, u1, u2, outer, t + 0.02);
      const dir = unit(sub(q, p));
      const out = add(p, add(mul(dir, eyeRy * 0.5), mul(perp(dir), -sd * eyeRy * 0.45)));
      return <path key={t} d={`M${P(p)} L${P(out)}`} stroke={ink} strokeWidth={0.7} fill="none" {...SW} />;
    });
    if (open === 0) {
      return (
        <g>
          <path d={`M${P(inner)} C${n2(x + sd * eyeRx * 0.4)} ${n2(eyeY + eyeRy * 1.15)} ${n2(x - sd * eyeRx * 0.4)} ${n2(eyeY + eyeRy * 1.05)} ${P(outer)}`} fill="none" stroke={ink} strokeWidth={1.2} {...SW} />
          <path d={crease} fill="none" stroke={ink} strokeWidth={0.6} strokeOpacity={0.3} {...SW} />
        </g>
      );
    }
    return (
      <g>
        <clipPath id={id}><path d={shape} /></clipPath>
        <path d={shape} fill="url(#ps-sclera)" />
        <g clipPath={`url(#${id})`}>
          <g className={open === 1 ? "ps-gaze" : undefined}>
            <circle cx={x} cy={eyeY + eyeRy * 0.05} r={irisR} fill={w.child ? "#4a7fb5" : "#4a3a2a"} />
            <circle cx={x} cy={eyeY + eyeRy * 0.05} r={irisR} fill="url(#ps-iris)" />
            <circle cx={x} cy={eyeY + eyeRy * 0.05} r={pupilR} fill="#0b0d10" />
            <circle cx={x - irisR * 0.32} cy={eyeY - irisR * 0.3} r={pupilR * 0.42} fill="#ffffff" opacity={0.75} />
          </g>
          <path d={upper} fill="none" stroke="#000" strokeWidth={3} strokeOpacity={0.16} {...SOFT} />
          <path d={shape} fill={skin} className="ps-lid" style={{ transformBox: "fill-box", transformOrigin: "top", transform: "scaleY(0)" }} />
        </g>
        <path d={upper} fill="none" stroke={ink} strokeWidth={1.3} {...SW} />
        <path d={`M${P(outer)} ${lowerC}`} fill="none" stroke={ink} strokeWidth={0.6} strokeOpacity={0.45} {...SW} />
        {!child && <path d={crease} fill="none" stroke={ink} strokeWidth={0.6} strokeOpacity={0.28} {...SW} />}
        <circle cx={inner[0] + sd * eyeRx * 0.02} cy={inner[1]} r={eyeRy * 0.2} fill="#d98a8a" opacity={0.7} />
        {lashes}
      </g>
    );
  };
  const brow = (x: number) => {
    const sd = x < 0 ? 1 : -1;
    const thick = L * (child ? 0.012 : female ? 0.014 : 0.02);
    const inner: Pt = [x + sd * W * 0.13, browY + L * 0.012];
    const peak: Pt = [x - sd * W * 0.02, browY - L * (female ? 0.02 : 0.012)];
    const outer: Pt = [x - sd * W * 0.15, browY + L * (female ? 0.012 : 0.006)];
    return <path d={`M${P(inner)} Q${P(add(peak, [0, -thick * 0.4]))} ${P(outer)} Q${P(add(peak, [0, thick * 0.7]))} ${P(add(inner, [0, thick]))} Z`} fill={darken(hairColour, 0.15)} opacity={elderly ? 0.75 : 0.92} />;
  };
  const ear = (sd: 1 | -1) => {
    const p = (dx: number, dy: number): Pt => [sd * W * (0.5 + dx), L * dy];
    return (
      <g key={sd}>
        <path d={`M${P(p(-0.03, 0.4))} C${P(p(0.08, 0.36))} ${P(p(0.13, 0.47))} ${P(p(0.1, 0.55))} C${P(p(0.08, 0.61))} ${P(p(0.03, 0.63))} ${P(p(-0.03, 0.6))} Z`} fill={darken(skin, 0.05)} {...lineSoft} />
        <path d={`M${P(p(0.0, 0.43))} C${P(p(0.08, 0.42))} ${P(p(0.09, 0.5))} ${P(p(0.05, 0.56))}`} fill="none" stroke={ink} strokeWidth={0.6} strokeOpacity={0.45} {...SW} />
        <path d={`M${P(p(0.02, 0.5))} C${P(p(0.05, 0.5))} ${P(p(0.05, 0.56))} ${P(p(0.02, 0.59))}`} fill="none" stroke={ink} strokeWidth={0.5} strokeOpacity={0.3} {...SW} />
      </g>
    );
  };
  const openLip = w.mouth === "open";
  const lipDepth = elderly ? 0.012 : 0.02;
  return (
    <g>
      {hairBack && <path d={hairBack} fill={hairColour} {...lineSoft} />}
      {hairBack && strands(style === "long" ? 14 : 10, [0, L * (style === "long" ? 0.6 : 0.45)], W * (style === "long" ? 0.76 : 0.64), L * (style === "long" ? 0.7 : 0.53), style === "long" ? 190 : 200, style === "long" ? 350 : 340, [0, L * 0.1], 1.1, "hb")}
      {hairBack && style === "long" && strands(8, [0, L * 0.62], W * 0.74, L * 0.68, 15, 165, [0, L * 0.55], 1.1, "hl")}
      {ear(-1)}
      {ear(1)}
      <path d={headPath} fill={skin} {...edge(skin, 0.55, 0.55, 0.8)} />
      {/* The face is a form: shade under the brows, in the hollows of the cheeks and under the lip; light on the forehead and chin. */}
      <path d={headPath} fill="url(#ps-face-shade)" />
      <path d={headPath} fill="url(#ps-grain)" opacity={0.8} />
      <clipPath id={faceClip}><path d={headPath} /></clipPath>
      <g clipPath={`url(#${faceClip})`}>
        <g filter="url(#ps-blur-sm)">
          {/* Soft shadows: the hair's on the forehead, the brow ridge over the eyes, the temples and the hollows of the cheeks (deeper on the side away from the light), the side of the nose, under it, under the lower lip, and the jaw's underside. */}
          {hairCap && <path d={hairCap} fill="#000" opacity={0.26} transform={`translate(0 ${n2(L * 0.04)})`} />}
          {hairBack && !hairCap && <ellipse cx={0} cy={L * 0.08} rx={W * 0.5} ry={L * 0.08} fill="#000" opacity={0.2} />}
          <ellipse cx={-eyeX} cy={browY + L * 0.03} rx={W * 0.2} ry={L * 0.035} fill="#2a1208" opacity={0.2} />
          <ellipse cx={eyeX} cy={browY + L * 0.03} rx={W * 0.2} ry={L * 0.035} fill="#2a1208" opacity={0.26} />
          <ellipse cx={-W * 0.42} cy={L * 0.4} rx={W * 0.1} ry={L * 0.12} fill="#2a1208" opacity={0.12} />
          <ellipse cx={W * 0.42} cy={L * 0.4} rx={W * 0.1} ry={L * 0.12} fill="#2a1208" opacity={0.22} />
          {!child && <ellipse cx={-W * 0.37} cy={L * 0.67} rx={W * 0.13} ry={L * 0.11} fill="#2a1208" opacity={elderly ? 0.3 : 0.16} />}
          {!child && <ellipse cx={W * 0.38} cy={L * 0.66} rx={W * 0.14} ry={L * 0.12} fill="#2a1208" opacity={elderly ? 0.4 : 0.28} />}
          <ellipse cx={W * 0.065} cy={noseTipY - L * 0.05} rx={W * 0.045} ry={L * 0.07} fill="#2a1208" opacity={0.22} />
          <ellipse cx={0} cy={noseTipY + L * 0.052} rx={W * 0.075} ry={L * 0.016} fill="#2a1208" opacity={0.24} />
          <ellipse cx={0} cy={mouthY + L * 0.078} rx={W * 0.12} ry={L * 0.02} fill="#2a1208" opacity={0.26} />
          <path d={`M${n2(-W * chinW * 2.4)} ${n2(L * 0.9)} Q${n2(-W * 0.05)} ${n2(L * 1.04)} ${n2(W * chinW * 2.6)} ${n2(L * 0.9)} Q${n2(W * 0.18)} ${n2(L * 1.0)} 0 ${n2(L * 1.02)} Q${n2(-W * 0.2)} ${n2(L * 1.0)} ${n2(-W * chinW * 2.4)} ${n2(L * 0.9)} Z`} fill="#2a1208" opacity={0.3} />
          <path d={`M${n2(W * 0.3)} ${n2(L * 0.1)} Q${n2(W * 0.56)} ${n2(L * 0.5)} ${n2(W * 0.2)} ${n2(L * 0.96)} Q${n2(W * 0.5)} ${n2(L * 0.55)} ${n2(W * 0.3)} ${n2(L * 0.1)} Z`} fill="#2a1208" opacity={0.22} />
          {/* Light: the forehead, the bridge and tip of the nose, the cheekbone nearest the light, the chin. */}
          <ellipse cx={-W * 0.1} cy={L * 0.27} rx={W * 0.22} ry={L * 0.07} fill="#fff" opacity={0.16} />
          <ellipse cx={-W * 0.012} cy={L * 0.56} rx={W * 0.03} ry={L * 0.1} fill="#fff" opacity={0.14} />
          <ellipse cx={-W * 0.3} cy={L * 0.57} rx={W * 0.1} ry={L * 0.035} fill="#fff" opacity={0.12} />
          <ellipse cx={-W * 0.03} cy={L * 0.9} rx={W * 0.1} ry={L * 0.03} fill="#fff" opacity={0.12} />
          {blush && <ellipse cx={-W * 0.3} cy={L * 0.61} rx={W * 0.14} ry={L * 0.065} fill="#c8503c" opacity={child ? 0.16 : 0.09} />}
          {blush && <ellipse cx={W * 0.3} cy={L * 0.61} rx={W * 0.14} ry={L * 0.065} fill="#c8503c" opacity={child ? 0.16 : 0.09} />}
          {blush && <ellipse cx={0} cy={noseTipY} rx={W * 0.07} ry={L * 0.04} fill="#c8503c" opacity={0.1} />}
        </g>
      </g>
      <ellipse cx={-eyeX} cy={eyeY + L * 0.01} rx={W * 0.17} ry={L * 0.085} fill="url(#ps-socket)" opacity={elderly ? 0.8 : 0.5} />
      <ellipse cx={eyeX} cy={eyeY + L * 0.01} rx={W * 0.17} ry={L * 0.085} fill="url(#ps-socket)" opacity={elderly ? 0.8 : 0.5} />
      {w.flushed && <g opacity={0.35}><ellipse cx={-W * 0.27} cy={L * 0.62} rx={W * 0.12} ry={L * 0.06} fill="#e0564d" /><ellipse cx={W * 0.27} cy={L * 0.62} rx={W * 0.12} ry={L * 0.06} fill="#e0564d" /></g>}
      {w.beard && (
        <g>
          <path d={smooth([[-W * 0.44, L * 0.6], [-W * 0.32, L * 0.9], [0, L * 1.0], [W * 0.32, L * 0.9], [W * 0.44, L * 0.6], [W * 0.3, L * 0.72], [0, L * 0.76], [-W * 0.3, L * 0.72]], 0.5)} fill={hairColour} opacity={0.3} />
          <path d={smooth([[-W * 0.4, L * 0.66], [-W * 0.3, L * 0.88], [0, L * 0.96], [W * 0.3, L * 0.88], [W * 0.4, L * 0.66], [W * 0.28, L * 0.74], [0, L * 0.78], [-W * 0.28, L * 0.74]], 0.5)} fill={hairColour} opacity={0.4} />
          <path d={`M${n2(-W * 0.1)} ${n2(L * 0.73)} Q0 ${n2(L * 0.745)} ${n2(W * 0.1)} ${n2(L * 0.73)}`} fill="none" stroke={hairColour} strokeWidth={2} strokeOpacity={0.5} {...SW} />
        </g>
      )}
      {brow(-eyeX)}
      {brow(eyeX)}
      {eye(-eyeX)}
      {eye(eyeX)}
      {w.glasses && (
        <g fill="none" stroke="#2b3139" strokeWidth={1.1}>
          <rect x={-eyeX - eyeRx * 1.45} y={eyeY - eyeRy * 2.1} width={eyeRx * 2.9} height={eyeRy * 4.2} rx={eyeRx * 0.5} {...SW} />
          <rect x={eyeX - eyeRx * 1.45} y={eyeY - eyeRy * 2.1} width={eyeRx * 2.9} height={eyeRy * 4.2} rx={eyeRx * 0.5} {...SW} />
          <path d={`M${n2(-eyeX + eyeRx * 1.45)} ${n2(eyeY - eyeRy * 0.6)} Q0 ${n2(eyeY - eyeRy * 1.2)} ${n2(eyeX - eyeRx * 1.45)} ${n2(eyeY - eyeRy * 0.6)}`} {...SW} />
          <path d={`M${n2(-eyeX - eyeRx * 1.45)} ${n2(eyeY - eyeRy * 1.2)} L${n2(-W * 0.5)} ${n2(L * 0.46)} M${n2(eyeX + eyeRx * 1.45)} ${n2(eyeY - eyeRy * 1.2)} L${n2(W * 0.5)} ${n2(L * 0.46)}`} strokeOpacity={0.7} {...SW} />
          <path d={`M${n2(-eyeX - eyeRx * 1.1)} ${n2(eyeY + eyeRy * 1.4)} L${n2(-eyeX - eyeRx * 0.2)} ${n2(eyeY - eyeRy * 1.6)} M${n2(eyeX - eyeRx * 1.1)} ${n2(eyeY + eyeRy * 1.4)} L${n2(eyeX - eyeRx * 0.2)} ${n2(eyeY - eyeRy * 1.6)}`} stroke="#ffffff" strokeWidth={1.4} strokeOpacity={0.35} {...SW} />
        </g>
      )}
      {/* The nose: the bridge catching the light, one side in shadow, the tip and its wings, the nostrils beneath. */}
      <path d={`M${n2(-W * 0.03)} ${n2(eyeY - L * 0.03)} Q0 ${n2(noseTipY - L * 0.08)} ${n2(-W * 0.022)} ${n2(noseTipY - L * 0.03)} L${n2(W * 0.022)} ${n2(noseTipY - L * 0.03)} Q0 ${n2(noseTipY - L * 0.08)} ${n2(W * 0.03)} ${n2(eyeY - L * 0.03)} Z`} fill="#fff" opacity={0.12} />
      <path d={`M${n2(W * 0.028)} ${n2(eyeY - L * 0.01)} Q${n2(W * 0.07)} ${n2(noseTipY - L * 0.06)} ${n2(W * 0.09)} ${n2(noseTipY)} Q${n2(W * 0.045)} ${n2(noseTipY + L * 0.02)} ${n2(W * 0.025)} ${n2(noseTipY - L * 0.025)} Z`} fill="#000" opacity={0.1} />
      <ellipse cx={0} cy={noseTipY} rx={W * 0.066} ry={L * 0.04} fill={mix(skin, "#ffffff", 0.05)} />
      <ellipse cx={0} cy={noseTipY} rx={W * 0.066} ry={L * 0.04} fill="url(#ps-sphere)" opacity={0.7} />
      {[-1, 1].map((sd) => (
        <g key={sd}>
          <path d={`M${n2(sd * W * 0.05)} ${n2(noseTipY - L * 0.035)} Q${n2(sd * noseW * 1.1)} ${n2(noseTipY - L * 0.01)} ${n2(sd * W * 0.055)} ${n2(noseTipY + L * 0.025)}`} fill="none" stroke={ink} strokeWidth={0.7} strokeOpacity={0.45} {...SW} />
          <ellipse cx={sd * W * 0.045} cy={noseTipY + L * 0.022} rx={W * 0.024} ry={W * 0.013} fill={darken(skin, 0.6)} opacity={0.55} transform={`rotate(${sd * 25} ${n2(sd * W * 0.045)} ${n2(noseTipY + L * 0.022)})`} />
        </g>
      ))}
      <path d={`M${n2(-W * 0.05)} ${n2(noseTipY + L * 0.032)} Q0 ${n2(noseTipY + L * 0.046)} ${n2(W * 0.05)} ${n2(noseTipY + L * 0.032)}`} fill="none" stroke={ink} strokeWidth={0.8} strokeOpacity={0.3} {...SW} />
      <path d={`M${n2(-W * 0.03)} ${n2(noseTipY + L * 0.05)} L${n2(-W * 0.04)} ${n2(mouthY - L * 0.025)} M${n2(W * 0.03)} ${n2(noseTipY + L * 0.05)} L${n2(W * 0.04)} ${n2(mouthY - L * 0.025)}`} fill="none" stroke={ink} strokeWidth={0.6} strokeOpacity={0.14} {...SW} />
      {elderly && (
        <g fill="none" stroke={ink} strokeWidth={0.7} strokeOpacity={0.35}>
          <path d={`M${n2(-W * 0.12)} ${n2(L * 0.68)} Q${n2(-W * 0.22)} ${n2(L * 0.78)} ${n2(-W * 0.18)} ${n2(L * 0.88)}`} {...SW} />
          <path d={`M${n2(W * 0.12)} ${n2(L * 0.68)} Q${n2(W * 0.22)} ${n2(L * 0.78)} ${n2(W * 0.18)} ${n2(L * 0.88)}`} {...SW} />
          <path d={`M${n2(-W * 0.22)} ${n2(L * 0.3)} Q0 ${n2(L * 0.28)} ${n2(W * 0.22)} ${n2(L * 0.3)} M${n2(-W * 0.18)} ${n2(L * 0.35)} Q0 ${n2(L * 0.335)} ${n2(W * 0.18)} ${n2(L * 0.35)}`} strokeOpacity={0.25} {...SW} />
          <path d={`M${n2(-W * 0.34)} ${n2(L * 0.48)} l${n2(-W * 0.05)} ${n2(-L * 0.02)} M${n2(-W * 0.34)} ${n2(L * 0.52)} l${n2(-W * 0.05)} ${n2(L * 0.02)} M${n2(W * 0.34)} ${n2(L * 0.48)} l${n2(W * 0.05)} ${n2(-L * 0.02)} M${n2(W * 0.34)} ${n2(L * 0.52)} l${n2(W * 0.05)} ${n2(L * 0.02)}`} strokeOpacity={0.3} {...SW} />
          <path d={`M${n2(-W * 0.16)} ${n2(L * 0.82)} Q${n2(-W * 0.2)} ${n2(L * 0.9)} ${n2(-W * 0.15)} ${n2(L * 0.95)} M${n2(W * 0.16)} ${n2(L * 0.82)} Q${n2(W * 0.2)} ${n2(L * 0.9)} ${n2(W * 0.15)} ${n2(L * 0.95)}`} strokeOpacity={0.22} {...SW} />
        </g>
      )}
      {/* The mouth: the bow of the upper lip, the fuller lower lip and its light, the line between, the corners. */}
      {openLip ? (
        <g>
          <ellipse cx={0} cy={mouthY + L * 0.022} rx={mouthW * 0.85} ry={L * 0.05} fill="#3a1518" />
          <path d={`M${n2(-mouthW * 0.62)} ${n2(mouthY - L * 0.016)} Q0 ${n2(mouthY + L * 0.004)} ${n2(mouthW * 0.62)} ${n2(mouthY - L * 0.016)} Q0 ${n2(mouthY - L * 0.03)} ${n2(-mouthW * 0.62)} ${n2(mouthY - L * 0.016)} Z`} fill="#f3efe6" opacity={0.92} />
          <ellipse cx={0} cy={mouthY + L * 0.048} rx={mouthW * 0.45} ry={L * 0.018} fill="#8a3038" opacity={0.8} />
          <path d={`M${n2(-mouthW)} ${n2(mouthY)} Q${n2(-mouthW * 0.5)} ${n2(mouthY - L * 0.032)} ${n2(-W * 0.045)} ${n2(mouthY - L * 0.028)} Q0 ${n2(mouthY - L * 0.018)} ${n2(W * 0.045)} ${n2(mouthY - L * 0.028)} Q${n2(mouthW * 0.5)} ${n2(mouthY - L * 0.032)} ${n2(mouthW)} ${n2(mouthY)} Q${n2(mouthW * 0.5)} ${n2(mouthY - L * 0.012)} ${n2(W * 0.045)} ${n2(mouthY - L * 0.008)} Q0 ${n2(mouthY - L * 0.002)} ${n2(-W * 0.045)} ${n2(mouthY - L * 0.008)} Q${n2(-mouthW * 0.5)} ${n2(mouthY - L * 0.012)} ${n2(-mouthW)} ${n2(mouthY)} Z`} fill={lip} />
          <path d={`M${n2(-mouthW)} ${n2(mouthY)} Q${n2(-mouthW * 0.6)} ${n2(mouthY + L * 0.075)} 0 ${n2(mouthY + L * 0.08)} Q${n2(mouthW * 0.6)} ${n2(mouthY + L * 0.075)} ${n2(mouthW)} ${n2(mouthY)} Q${n2(mouthW * 0.6)} ${n2(mouthY + L * 0.05)} 0 ${n2(mouthY + L * 0.056)} Q${n2(-mouthW * 0.6)} ${n2(mouthY + L * 0.05)} ${n2(-mouthW)} ${n2(mouthY)} Z`} fill={mix(lip, "#ffffff", 0.12)} />
        </g>
      ) : (
        <g>
          <path d={`M${n2(-mouthW)} ${n2(mouthY)} Q${n2(-mouthW * 0.55)} ${n2(mouthY - L * (lipDepth + 0.002))} ${n2(-W * 0.045)} ${n2(mouthY - L * lipDepth)} Q0 ${n2(mouthY - L * lipDepth * 0.5)} ${n2(W * 0.045)} ${n2(mouthY - L * lipDepth)} Q${n2(mouthW * 0.55)} ${n2(mouthY - L * (lipDepth + 0.002))} ${n2(mouthW)} ${n2(mouthY)} Q0 ${n2(mouthY + L * 0.008)} ${n2(-mouthW)} ${n2(mouthY)} Z`} fill={lip} />
          <path d={`M${n2(-mouthW)} ${n2(mouthY)} Q0 ${n2(mouthY + L * 0.008)} ${n2(mouthW)} ${n2(mouthY)} Q${n2(mouthW * 0.6)} ${n2(mouthY + L * (elderly ? 0.026 : 0.046))} 0 ${n2(mouthY + L * (elderly ? 0.03 : 0.052))} Q${n2(-mouthW * 0.6)} ${n2(mouthY + L * (elderly ? 0.026 : 0.046))} ${n2(-mouthW)} ${n2(mouthY)} Z`} fill={mix(lip, "#ffffff", 0.14)} />
          <ellipse cx={0} cy={mouthY + L * (elderly ? 0.016 : 0.026)} rx={mouthW * 0.35} ry={L * 0.007} fill="#fff" opacity={0.25} />
          <path d={`M${n2(-mouthW)} ${n2(mouthY)} Q0 ${n2(mouthY + L * 0.01)} ${n2(mouthW)} ${n2(mouthY)}`} fill="none" stroke={darken(lip, 0.45)} strokeWidth={0.9} {...SW} />
          {!child && [-1, 1].map((sd) => <circle key={sd} cx={sd * mouthW * 1.03} cy={mouthY + L * 0.003} r={W * 0.012} fill="#000" opacity={0.16} />)}
        </g>
      )}
      {hairCap && <path d={hairCap} fill={hairColour} {...line} />}
      {hairCap && style !== "child" && <path d={hairCap} fill="url(#ps-hair-shine)" />}
      {hairCap && style === "short" && strands(w.wet ? 8 : 14, [0, L * 0.28], W * 0.47, L * 0.3, 190, 350, [-W * 0.12, L * 0.06], w.wet ? 1.3 : 0.8, "hs")}
      {hairCap && (style === "bob" || style === "long") && strands(w.wet ? 8 : 12, [0, L * 0.28], W * 0.48, L * 0.3, 190, 350, [0, L * 0.02], w.wet ? 1.3 : 0.8, "hc")}
      {hairCap && style === "child" && strands(7, [0, L * 0.2], W * 0.42, L * 0.2, 200, 340, [0, L * 0.02], 0.8, "hk")}
      {baldFringe && <g fill={hairColour} opacity={0.9}><path d={baldFringe} /><path d={baldFringe} transform="scale(-1 1)" /></g>}
      {style === "bald" && <ellipse cx={-W * 0.08} cy={L * 0.16} rx={W * 0.22} ry={L * 0.09} fill="#fff" opacity={0.16} />}
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

/** The outline of the head from above: the brow broad, the cheekbones the
 *  widest, the jaw tapering to the chin. For the face and for its shadow. */
export function headOutline(r: Rig, child = !!r.build.child): string {
  const L = r.headL, W = r.headW;
  const female = r.build.sex === "female";
  const jaw = child ? 0.41 : female ? 0.35 : 0.38;
  const chinW = child ? 0.14 : female ? 0.11 : 0.17;
  return smooth([
    [0, 0], [W * 0.36, L * 0.05], [W * 0.5, L * 0.3], [W * 0.49, L * 0.55], [W * jaw, L * 0.8], [W * chinW, L * 0.975], [0, L],
    [-W * chinW, L * 0.975], [-W * jaw, L * 0.8], [-W * 0.49, L * 0.55], [-W * 0.5, L * 0.3], [-W * 0.36, L * 0.05],
  ], 0.6);
}

/** Specks for the grain over skin and cloth: fixed pseudo-random positions
 *  in a 5 cm tile, so every render is the same. */
const GRAIN: [number, number, number, boolean][] = (() => {
  let s = 1234567;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  return Array.from({ length: 150 }, (_, i) => [rnd() * 0.04, rnd() * 0.04, 0.0004 + rnd() * 0.0007, i % 2 === 0] as [number, number, number, boolean]);
})();

/** Gradients and patterns the figure paints with; put once in the scene's defs. */
export function FigureDefs() {
  return (
    <>
      {/* One light, over the viewer's left shoulder: every rounded form is
          lit a little left of its middle and falls off into shadow on its
          right and its lower side. */}
      <linearGradient id="ps-round" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.2" />
        <stop offset="0.14" stopColor="#000" stopOpacity="0.03" />
        <stop offset="0.34" stopColor="#fff" stopOpacity="0.14" />
        <stop offset="0.6" stopColor="#000" stopOpacity="0.03" />
        <stop offset="0.86" stopColor="#000" stopOpacity="0.22" />
        <stop offset="1" stopColor="#000" stopOpacity="0.4" />
      </linearGradient>
      <linearGradient id="ps-round-v" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0.16" />
        <stop offset="0.26" stopColor="#fff" stopOpacity="0.12" />
        <stop offset="0.62" stopColor="#000" stopOpacity="0.04" />
        <stop offset="1" stopColor="#000" stopOpacity="0.36" />
      </linearGradient>
      <radialGradient id="ps-face-shade" cx="0.44" cy="0.4" r="0.64">
        <stop offset="0.45" stopColor="#fff" stopOpacity="0.1" />
        <stop offset="0.8" stopColor="#5a2e18" stopOpacity="0.08" />
        <stop offset="1" stopColor="#4a2412" stopOpacity="0.36" />
      </radialGradient>
      {/* Skin rounds off warm, not grey: the shadow side of a limb goes towards brown. */}
      <linearGradient id="ps-skin" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#4a2412" stopOpacity="0.22" />
        <stop offset="0.14" stopColor="#4a2412" stopOpacity="0.04" />
        <stop offset="0.34" stopColor="#fff" stopOpacity="0.14" />
        <stop offset="0.6" stopColor="#4a2412" stopOpacity="0.03" />
        <stop offset="0.86" stopColor="#4a2412" stopOpacity="0.24" />
        <stop offset="1" stopColor="#4a2412" stopOpacity="0.42" />
      </linearGradient>
      <linearGradient id="ps-skin-v" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4a2412" stopOpacity="0.16" />
        <stop offset="0.26" stopColor="#fff" stopOpacity="0.12" />
        <stop offset="0.62" stopColor="#4a2412" stopOpacity="0.03" />
        <stop offset="1" stopColor="#4a2412" stopOpacity="0.38" />
      </linearGradient>
      {/* A sheen across synthetic cloth: a band of light, then matte, then shade. */}
      <linearGradient id="ps-sheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.3" stopColor="#fff" stopOpacity="0.1" />
        <stop offset="0.42" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.12" />
      </linearGradient>
      <radialGradient id="ps-hair-shine" cx="0.5" cy="0.25" r="0.6">
        <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
        <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.25" />
      </radialGradient>
      {/* A dome lit from above: a knee, a shoulder, the tip of a nose, a belly. */}
      <radialGradient id="ps-sphere" cx="0.42" cy="0.36" r="0.62">
        <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0.04" />
        <stop offset="1" stopColor="#000" stopOpacity="0.32" />
      </radialGradient>
      <radialGradient id="ps-socket" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#000" stopOpacity="0.2" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="ps-sclera" cx="0.5" cy="0.5" r="0.6">
        <stop offset="0.5" stopColor="#f0eee8" />
        <stop offset="1" stopColor="#c4bfb9" />
      </radialGradient>
      <radialGradient id="ps-iris" cx="0.4" cy="0.35" r="0.65">
        <stop offset="0" stopColor="#fff" stopOpacity="0.25" />
        <stop offset="0.6" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.5" />
      </radialGradient>
      {/* Light at the end nearest the camera, dark at the far end: a back sloping away. */}
      <linearGradient id="ps-slope-r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#000" stopOpacity="0.5" /><stop offset="0.7" stopColor="#000" stopOpacity="0.08" /><stop offset="1" stopColor="#fff" stopOpacity="0.12" /></linearGradient>
      <linearGradient id="ps-slope-l" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#000" stopOpacity="0.5" /><stop offset="0.7" stopColor="#000" stopOpacity="0.08" /><stop offset="1" stopColor="#fff" stopOpacity="0.12" /></linearGradient>
      <linearGradient id="ps-slope-d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="0.5" /><stop offset="0.7" stopColor="#000" stopOpacity="0.08" /><stop offset="1" stopColor="#fff" stopOpacity="0.12" /></linearGradient>
      <linearGradient id="ps-slope-u" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#000" stopOpacity="0.5" /><stop offset="0.7" stopColor="#000" stopOpacity="0.08" /><stop offset="1" stopColor="#fff" stopOpacity="0.12" /></linearGradient>
      <radialGradient id="ps-shadow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.6" stopColor="#000" stopOpacity="0.35" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      {/* Cloth: knit, ribbing, the diamonds of a hospital gown, the mesh of a trainer, denim's weave. */}
      <pattern id="ps-knit" width="0.012" height="0.012" patternUnits="userSpaceOnUse"><path d="M0 0.012 L0.012 0" stroke="#000" strokeWidth="0.0015" strokeOpacity="0.07" /></pattern>
      <pattern id="ps-rib" width="0.008" height="0.008" patternUnits="userSpaceOnUse"><path d="M0.004 0 V0.008" stroke="#000" strokeWidth="0.0016" strokeOpacity="0.18" /></pattern>
      <pattern id="ps-gown" width="0.03" height="0.03" patternUnits="userSpaceOnUse"><path d="M0.015 0.005 L0.025 0.015 L0.015 0.025 L0.005 0.015 Z" fill="none" stroke="#2f6fa8" strokeWidth="0.0015" strokeOpacity="0.45" /></pattern>
      <pattern id="ps-mesh" width="0.006" height="0.006" patternUnits="userSpaceOnUse"><circle cx="0.003" cy="0.003" r="0.0012" fill="#000" fillOpacity="0.14" /></pattern>
      <pattern id="ps-denim" width="0.006" height="0.006" patternUnits="userSpaceOnUse"><path d="M0 0.006 L0.006 0" stroke="#fff" strokeWidth="0.0008" strokeOpacity="0.14" /></pattern>
      {/* Grain: specks of light and dark over every surface, so nothing is flat vector colour. */}
      <pattern id="ps-grain" width="0.04" height="0.04" patternUnits="userSpaceOnUse">
        {GRAIN.map(([x, y, rr, light], i) => <circle key={i} cx={x} cy={y} r={rr} fill={light ? "#fff" : "#000"} fillOpacity={light ? 0.13 : 0.11} />)}
      </pattern>
      {/* Soft edges: the blur of a cast shadow, and smaller ones for shading painted onto a form. */}
      <filter id="ps-soft-shadow" x="-30%" y="-15%" width="160%" height="130%"><feGaussianBlur stdDeviation="0.016" /></filter>
      <filter id="ps-blur-sm" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="0.006" /></filter>
      <filter id="ps-blur-md" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="0.012" /></filter>
    </>
  );
}

/** The roundness across a limb: the gradient runs across the bounding box,
 *  so a limb lying along the body takes the horizontal one and an arm flung
 *  out sideways the vertical one. */
const roundness = (v: Pt, skin: boolean) => (Math.abs(v[0]) > Math.abs(v[1]) ? (skin ? "url(#ps-skin-v)" : "url(#ps-round-v)") : skin ? "url(#ps-skin)" : "url(#ps-round)");

/** A limb segment with its roundness, in the garment's colour or the skin's. */
function Seg({ a, b, wa, wb, fill, outline = true, skin = false, shade = 1 }: { a: Pt; b: Pt; wa: number; wb: number; fill: string; outline?: boolean; skin?: boolean; shade?: number }) {
  const d = capsule(a, b, wa, wb);
  return (
    <g>
      <path d={d} fill={fill} {...(outline ? edge(fill, skin ? 0.5 : 0.55, skin ? 0.5 : 0.6) : {})} />
      <path d={d} fill={roundness(sub(b, a), skin)} opacity={shade} />
      <path d={d} fill="url(#ps-grain)" />
    </g>
  );
}

/** A whole limb in one piece: the outline round both segments, the joint
 *  blended, each half shaded for its own roundness, and a soft dome on the
 *  joint so the two halves read as one limb. */
function Limb({ a, b, c, w, fill, skin = false, outline = true }: { a: Pt; b: Pt; c: Pt; w: [number, number, number]; fill: string; skin?: boolean; outline?: boolean }) {
  return (
    <g>
      <path d={limbPath(a, b, c, w[0], w[1], w[2])} fill={fill} {...(outline ? edge(fill, skin ? 0.5 : 0.55, skin ? 0.5 : 0.6) : {})} />
      <path d={capsule(a, b, w[0], w[1])} fill={roundness(sub(b, a), skin)} opacity={0.75} />
      <path d={capsule(b, c, w[1], w[2])} fill={roundness(sub(c, b), skin)} opacity={0.75} />
      <ellipse cx={b[0]} cy={b[1]} rx={w[1] * 0.9} ry={w[1] * 0.9} fill="url(#ps-sphere)" opacity={0.3} />
      <path d={limbPath(a, b, c, w[0], w[1], w[2])} fill="url(#ps-grain)" />
    </g>
  );
}

/** The person, from the ground up. */
export function PlanFigure({ rig: r, w, chestClass, chestStyle, onChest, over, shadow = true }: FigureProps) {
  const skin = w.skin;
  const cloth = (c: string) => (w.wet ? darken(c, 0.3) : c);
  const top = cloth(w.top), bottom = cloth(w.bottom);
  const k = r.k, bulk = r.bulk;
  const child = r.build.child, female = r.build.sex === "female";
  const sleeveLong = w.sleeves === "long";
  const bare = w.bottomKind === "bare";
  const shorts = w.bottomKind === "shorts";
  const gown = w.topKind === "gown";
  const tk = w.topKind, bk = w.bottomKind;
  const ink = darken(skin, 0.55);
  const topInk = darken(top, 0.45), bottomInk = darken(bottom, 0.45);
  const seed = (parseInt(w.top.slice(1), 16) ^ parseInt(w.hair.slice(1), 16)) >>> 0;
  const ribbed = tk === "jumper" || tk === "hoodie" || tk === "fleece";
  const belt = !child && (bk === "jeans" || bk === "trousers");
  const elastic = bk === "joggers" || bk === "pyjamas" || bk === "shorts";
  const trim = tk === "football" ? (bottom === "#f4f4f0" && top === "#f4f4f0" ? "#1b2733" : bottom) : null;
  // Where the top ends: a tee rides up on the hips, a jumper covers them, a gown reaches the thighs.
  const hemY = gown ? r.hipY + 0.14 * k : ribbed || tk === "workwear" ? r.hipY + 0.02 * k : tk === "shirt" || tk === "pyjamas" ? r.hipY - 0.015 * k : tk === "football" ? r.hipY - 0.03 * k : r.hipY - 0.045 * k;
  // The trunk's outline again, as points, so the top can stop at its hem.
  const squash = (r.chestY - r.neckBase[1]) / (0.155 * k);
  const ty = (v: number) => r.neckBase[1] + (v * k - 0.285 * k) * squash;
  const right: Pt[] = [
    [0.07 * k * bulk, r.neckBase[1] - 0.01 * k], [r.shoulderW * 0.8, r.shoulderY - 0.002 * k], [r.shoulderW * 0.98, r.shoulderY + 0.035 * k],
    [r.chestW * 1.02, ty(0.38)], [r.chestW, r.chestY], [r.waistW, r.waistY], [r.hipW, r.hipY], [r.hipW * 0.7, r.crotchY],
  ];
  const halfAt = (y: number): number => {
    for (let i = 0; i < right.length - 1; i++) {
      const [x0, y0] = right[i], [x1, y1] = right[i + 1];
      if (y >= y0 && y <= y1) return x0 + (x1 - x0) * ((y - y0) / (y1 - y0));
    }
    return y < right[0][1] ? right[0][0] : right[right.length - 1][0];
  };
  const hemHalf = gown ? r.hipW * 0.98 : halfAt(hemY) * 1.01;
  const upperPts = gown ? right.filter((p) => p[1] <= r.hipY) : right.filter((p) => p[1] < hemY - 0.01 * k);
  const topPath = smooth([...upperPts, [hemHalf, hemY], [-hemHalf, hemY], ...upperPts.slice().reverse().map((p): Pt => [-p[0], p[1]])], 0.55);
  const pelvis = smooth([[r.waistW, r.waistY - 0.02 * k], [r.hipW, r.hipY], [r.hipW * 0.7, r.crotchY], [-r.hipW * 0.7, r.crotchY], [-r.hipW, r.hipY], [-r.waistW, r.waistY - 0.02 * k]], 0.5);
  const wbTop = r.hipY - 0.035 * k, wbBot = r.hipY + 0.005 * k;
  const bandPath = (y0: number, y1: number, inset = 0) => `M${n2(-halfAt(y0) + inset)} ${n2(y0)} L${n2(halfAt(y0) - inset)} ${n2(y0)} L${n2(halfAt(y1) - inset)} ${n2(y1)} L${n2(-halfAt(y1) + inset)} ${n2(y1)} Z`;

  const legSeg = (leg: Limb, side: 1 | -1, toe: Pt) => {
    const trouserEnd = shorts ? lerp(leg.a, leg.b, 0.5) : lerp(leg.b, leg.c, 0.92);
    const flat = r.feetFlat;
    const thighDir = unit(sub(leg.b, leg.a)), shinDir = unit(sub(leg.c, leg.b));
    const lateral = (v: Pt) => mul(perp(v), -side);
    const sock = w.shoes === "football" ? (top === "#f4f4f0" ? "#1b2733" : "#f4f4f0") : null;
    const hemDir = shorts ? thighDir : shinDir;
    const hemW = shorts ? r.legW[0] * 1.08 : r.legW[2] * 1.25;
    const hemBand = capsule(add(trouserEnd, mul(hemDir, -0.022 * k)), trouserEnd, hemW, bk === "joggers" && !shorts ? r.legW[2] * 1.05 : hemW);
    return (
      <g>
        {/* Skin: the thigh and the shin in one piece, the cap of the knee, the shin bone's light. */}
        <Limb a={leg.a} b={leg.b} c={leg.c} w={r.legW} fill={skin} skin />
        {(bare || shorts) && (
          <g>
            <ellipse cx={leg.b[0]} cy={leg.b[1]} rx={r.legW[1] * 0.8} ry={r.legW[1] * 0.9} fill="url(#ps-sphere)" opacity={flat ? 0.75 : 0.45} />
            <path d={bowed(add(leg.b, mul(perp(shinDir), r.legW[1] * 0.45)), add(leg.b, mul(perp(shinDir), -r.legW[1] * 0.45)), 0.006 * k)} fill="none" stroke={ink} strokeWidth={0.7} strokeOpacity={0.25} {...SW} />
            <path d={`M${P(add(lerp(leg.b, leg.c, 0.15), mul(perp(shinDir), r.legW[2] * 0.2)))} L${P(add(lerp(leg.b, leg.c, 0.85), mul(perp(shinDir), r.legW[2] * 0.15)))}`} stroke="#fff" strokeWidth={1.4} strokeOpacity={0.1} fill="none" {...SW} />
          </g>
        )}
        {sock && !bare && (
          <g>
            <Seg a={add(leg.b, mul(shinDir, 0.03 * k))} b={lerp(leg.b, leg.c, 0.98)} wa={r.legW[1] * 1.05} wb={r.legW[2] * 1.1} fill={sock} outline={false} />
            <path d={capsule(add(leg.b, mul(shinDir, 0.03 * k)), add(leg.b, mul(shinDir, 0.075 * k)), r.legW[1] * 1.08, r.legW[1] * 1.06)} fill={darken(sock, 0.2)} opacity={0.8} />
            <ellipse cx={lerp(leg.b, leg.c, 0.45)[0]} cy={lerp(leg.b, leg.c, 0.45)[1]} rx={r.legW[1] * 0.5} ry={0.08 * k} fill="#fff" opacity={0.14} />
          </g>
        )}
        {!bare && (
          shorts
            ? <Seg a={add(leg.a, [0, -r.legW[0] * 0.3])} b={trouserEnd} wa={r.legW[0] * 1.12} wb={r.legW[0] * 1.08} fill={bottom} />
            : <Limb a={add(leg.a, [0, -r.legW[0] * 0.3])} b={leg.b} c={trouserEnd} w={[r.legW[0] * 1.1, r.legW[1] * 1.12, r.legW[2] * 1.25]} fill={bottom} />
        )}
        {!bare && (
          <g>
            {/* Seams down the outside of the leg, the creases at the knee, the hem turned at the ankle. */}
            {bk === "jeans" && <path d={capsule(add(leg.a, [0, -r.legW[0] * 0.3]), lerp(leg.a, leg.b, 0.98), r.legW[0] * 1.1, r.legW[1] * 1.12)} fill="url(#ps-denim)" />}
            {bk === "jeans" && <path d={`M${P(add(lerp(leg.a, leg.b, 0.05), mul(lateral(thighDir), r.legW[0] * 0.88)))} L${P(add(leg.b, mul(lateral(thighDir), r.legW[1] * 0.9)))} L${P(add(trouserEnd, mul(lateral(shinDir), r.legW[2] * 1.02)))}`} fill="none" stroke="#c8a56a" strokeWidth={0.6} strokeOpacity={0.55} {...SW} />}
            {bk === "trousers" && <path d={`M${P(lerp(leg.a, leg.b, 0.12))} L${P(leg.b)} L${P(lerp(leg.b, trouserEnd, 0.95))}`} fill="none" stroke="#fff" strokeWidth={0.9} strokeOpacity={0.12} {...SW} />}
            {bk === "trousers" && <path d={`M${P(add(lerp(leg.a, leg.b, 0.1), mul(lateral(thighDir), r.legW[0] * 0.95)))} L${P(add(leg.b, mul(lateral(thighDir), r.legW[1] * 0.95)))} L${P(add(trouserEnd, mul(lateral(shinDir), r.legW[2] * 1.1)))}`} fill="none" stroke={bottomInk} strokeWidth={0.6} strokeOpacity={0.35} {...SW} />}
            {bk === "joggers" && seed % 2 === 0 && <path d={`M${P(add(lerp(leg.a, leg.b, 0.08), mul(lateral(thighDir), r.legW[0] * 0.8)))} L${P(add(leg.b, mul(lateral(thighDir), r.legW[1] * 0.82)))} L${P(add(trouserEnd, mul(lateral(shinDir), r.legW[2] * 0.9)))}`} fill="none" stroke="#ffffff" strokeWidth={1.4} strokeOpacity={0.55} {...SW} />}
            {!shorts && (
              <g>
                <Crease a={add(add(leg.b, mul(thighDir, -0.04 * k)), mul(perp(thighDir), r.legW[1] * 0.85))} b={add(add(leg.b, mul(thighDir, -0.04 * k)), mul(perp(thighDir), -r.legW[1] * 0.85))} bow={0.009 * k} k={k} o={0.13} />
                <Crease a={add(add(leg.b, mul(shinDir, 0.05 * k)), mul(perp(shinDir), r.legW[1] * 0.8))} b={add(add(leg.b, mul(shinDir, 0.05 * k)), mul(perp(shinDir), -r.legW[1] * 0.8))} bow={-0.009 * k} k={k} o={0.12} />
                <Crease a={add(add(leg.b, mul(shinDir, 0.3 * k)), mul(perp(shinDir), r.legW[2] * 0.9))} b={add(add(leg.b, mul(shinDir, 0.36 * k)), mul(perp(shinDir), -r.legW[2] * 0.4))} bow={0.004 * k} k={k} o={0.08} light={false} />
              </g>
            )}
            <path d={hemBand} fill={darken(bottom, 0.18)} opacity={0.9} />
            {bk === "joggers" && !shorts && <path d={hemBand} fill="url(#ps-rib)" />}
            {bk === "pyjamas" && <path d={capsule(add(trouserEnd, mul(hemDir, -0.008 * k)), trouserEnd, hemW, hemW)} fill="#ffffff" opacity={0.6} />}
          </g>
        )}
        {bk === "pyjamas" && [0.25, 0.5, 0.75].map((t) => <path key={t} d={`M${P(lerp(leg.a, leg.c, 0.02))} L${P(lerp(leg.a, trouserEnd, 0.98))}`} stroke="#ffffff" strokeWidth={1} opacity={0.45} fill="none" {...SOFT} transform={`translate(${n2((t - 0.5) * r.legW[0] * 1.6)} 0)`} />)}
        <Shoe ankle={leg.c} toe={toe} kind={w.shoes} colour={w.shoeColour} w={r.footW} L={r.footL} flat={flat} skin={skin} side={side} k={k} />
      </g>
    );
  };

  const armSeg = (arm: Limb, side: 1 | -1, palmUp: boolean, flat: boolean, tucked = false) => {
    const upDir = unit(sub(arm.b, arm.a)), foreDir = unit(sub(arm.c, arm.b));
    // An arm lying by the side goes under the trunk's edge, so it starts
    // below the shoulder: the shoulder itself is the trunk's own outline.
    const a0 = tucked ? add(arm.a, mul(upDir, Math.min(0.075 * k, len(sub(arm.b, arm.a)) * 0.35))) : arm.a;
    const sleeveEnd = lerp(arm.a, arm.b, gown ? 0.45 : tk === "football" ? 0.55 : 0.62);
    const cuffColour = tk === "shirt" || tk === "pyjamas" ? top : darken(top, 0.12);
    const cuffLen = (tk === "shirt" ? 0.05 : 0.035) * k;
    const cuff = capsule(add(arm.c, mul(foreDir, -cuffLen)), lerp(arm.b, arm.c, 0.97), r.armW[2] * 1.18, r.armW[2] * 1.12);
    const buttonAt = add(add(arm.c, mul(foreDir, -cuffLen * 0.5)), mul(perp(foreDir), -side * r.armW[2] * 0.7));
    return (
      <g>
        <Limb a={a0} b={arm.b} c={arm.c} w={r.armW} fill={skin} skin />
        {sleeveLong ? (
          <g>
            <Limb a={a0} b={arm.b} c={lerp(arm.b, arm.c, 0.93)} w={[r.armW[0] * 1.08, r.armW[1] * 1.1, r.armW[2] * 1.15]} fill={top} />
            {tk === "jumper" && <path d={capsule(a0, lerp(arm.b, arm.c, 0.93), r.armW[0] * 1.08, r.armW[2] * 1.15)} fill="url(#ps-knit)" />}
            {/* Cloth bunching at the elbow. */}
            {[-0.04, -0.015, 0.012].map((o, i) => <Crease key={i} a={add(add(arm.b, mul(upDir, o * k)), mul(perp(upDir), r.armW[1] * 0.95))} b={add(add(arm.b, mul(upDir, o * k)), mul(perp(upDir), -r.armW[1] * 0.95))} bow={(i % 2 ? -1 : 1) * 0.007 * k} k={k} o={0.12} />)}
            <path d={cuff} fill={cuffColour} {...lineSoft} />
            {ribbed && <path d={cuff} fill="url(#ps-rib)" />}
            {tk === "shirt" && <circle cx={buttonAt[0]} cy={buttonAt[1]} r={0.005 * k} fill={darken(top, 0.4)} />}
            {tk === "pyjamas" && <path d={capsule(add(arm.c, mul(foreDir, -cuffLen * 0.3)), add(arm.c, mul(foreDir, -cuffLen * 0.15)), r.armW[2] * 1.18, r.armW[2] * 1.18)} fill="#ffffff" opacity={0.6} />}
          </g>
        ) : (
          <g>
            <Seg a={a0} b={sleeveEnd} wa={r.armW[0] * 1.08} wb={r.armW[1] * 1.14} fill={top} shade={0.8} />
            <path d={capsule(add(sleeveEnd, mul(upDir, -0.018 * k)), sleeveEnd, r.armW[1] * 1.14, r.armW[1] * 1.14)} fill={trim ?? darken(top, 0.15)} opacity={trim ? 0.95 : 0.85} />
            {gown && <path d={capsule(add(sleeveEnd, mul(upDir, -0.018 * k)), sleeveEnd, r.armW[1] * 1.14, r.armW[1] * 1.14)} fill="url(#ps-gown)" />}
          </g>
        )}
        {sleeveLong && <Seg a={lerp(arm.b, arm.c, 0.9)} b={arm.c} wa={r.armW[2] * 1.05} wb={r.armW[2]} fill={skin} outline={false} skin />}
        {!sleeveLong && (
          <g>
            {/* The elbow: a crease over the joint, the point of it catching the light. */}
            <path d={bowed(add(arm.b, mul(perp(foreDir), r.armW[1] * 0.55)), add(arm.b, mul(perp(foreDir), -r.armW[1] * 0.55)), (palmUp ? 1 : -1) * 0.006 * k)} fill="none" stroke={ink} strokeWidth={0.7} strokeOpacity={0.3} {...SW} />
            <ellipse cx={arm.b[0]} cy={arm.b[1]} rx={r.armW[1] * 0.55} ry={r.armW[1] * 0.6} fill="url(#ps-sphere)" opacity={0.35} />
            <path d={`M${P(add(lerp(arm.b, arm.c, 0.2), mul(perp(foreDir), -side * r.armW[1] * 0.25)))} L${P(add(lerp(arm.b, arm.c, 0.9), mul(perp(foreDir), -side * r.armW[2] * 0.3)))}`} stroke="#fff" strokeWidth={1.2} strokeOpacity={0.1} fill="none" {...SW} />
          </g>
        )}
        {!gown && <path d={bowed(add(add(a0, mul(upDir, 0.014 * k)), mul(perp(upDir), r.armW[0] * 1.02)), add(add(a0, mul(upDir, 0.014 * k)), mul(perp(upDir), -r.armW[0] * 1.02)), 0.012 * k)} fill="none" stroke={topInk} strokeWidth={0.6} strokeOpacity={0.4} {...SW} />}
        <Hand wrist={arm.c} tip={arm.d} w={r.armW[2]} side={side} palmUp={palmUp} flat={flat} skin={skin} k={k} />
      </g>
    );
  };

  // Necklines: a tee's ribbed round neck, a shirt's collar, a gown's V, a fleece's stand collar.
  const nb = r.neckBase[1];
  const roundNeck = (depth: number) => `M${n2(-r.neckW * 0.8)} ${n2(nb - 0.01 * k)} Q0 ${n2(nb + depth)} ${n2(r.neckW * 0.8)} ${n2(nb - 0.01 * k)}`;
  const neckline = gown
    ? `M${n2(-r.shoulderW * 0.55)} ${n2(r.shoulderY - 0.01 * k)} L0 ${n2(r.shoulderY + 0.09 * k)} L${n2(r.shoulderW * 0.55)} ${n2(r.shoulderY - 0.01 * k)}`
    : tk === "shirt" || tk === "pyjamas" || tk === "workwear"
      ? `M${n2(-r.neckW * 0.75)} ${n2(nb - 0.012 * k)} L${n2(-r.neckW * 0.2)} ${n2(nb + 0.06 * k)} L0 ${n2(nb + 0.035 * k)} L${n2(r.neckW * 0.2)} ${n2(nb + 0.06 * k)} L${n2(r.neckW * 0.75)} ${n2(nb - 0.012 * k)}`
      : roundNeck((tk === "football" ? 0.07 : 0.05) * k);
  const collar = (tk === "shirt" || tk === "pyjamas" || tk === "workwear") && (
    <g>
      {[-1, 1].map((sd) => (
        <path key={sd} d={`M${n2(sd * r.neckW * 0.78)} ${n2(nb - 0.022 * k)} L${n2(sd * r.neckW * (tk === "workwear" ? 1.0 : 1.15))} ${n2(nb + 0.055 * k)} L${n2(sd * r.neckW * 0.24)} ${n2(nb + 0.062 * k)} Z`} fill={tk === "pyjamas" ? mix(top, "#ffffff", 0.08) : top} {...edge(top, 0.5, 0.7)} />
      ))}
      {tk === "pyjamas" && [-1, 1].map((sd) => <path key={sd} d={`M${n2(sd * r.neckW * 1.15)} ${n2(nb + 0.055 * k)} L${n2(sd * r.neckW * 0.24)} ${n2(nb + 0.062 * k)}`} stroke="#ffffff" strokeWidth={1.4} strokeOpacity={0.7} fill="none" {...SW} />)}
    </g>
  );
  const placket = (tk === "shirt" || tk === "pyjamas") && (
    <g>
      <path d={`M${n2(-0.012 * k)} ${n2(nb + 0.06 * k)} V${n2(hemY)} M${n2(0.012 * k)} ${n2(nb + 0.06 * k)} V${n2(hemY)}`} stroke={topInk} strokeWidth={0.6} strokeOpacity={0.4} fill="none" {...SW} />
      {[0.1, 0.26, 0.42, 0.58, 0.74].map((t) => { const y = nb + 0.08 * k + (hemY - nb - 0.1 * k) * t; return <g key={t}><circle cx={0} cy={y} r={0.0065 * k} fill={tk === "pyjamas" ? "#ffffff" : darken(top, 0.4)} stroke={topInk} strokeWidth={0.5} {...SOFT} /><circle cx={0} cy={y} r={0.002 * k} fill={topInk} opacity={0.6} /></g>; })}
    </g>
  );
  const pocket = (tk === "shirt" || tk === "workwear") && !child && (
    <g>
      <path d={`M${n2(-r.chestW * 0.75)} ${n2(r.chestY - 0.07 * k)} h${n2(r.chestW * 0.4)} v${n2(0.1 * k)} l${n2(-r.chestW * 0.2)} ${n2(0.015 * k)} l${n2(-r.chestW * 0.2)} ${n2(-0.015 * k)} z`} fill={top} stroke={topInk} strokeWidth={0.6} strokeOpacity={0.5} {...SOFT} />
      {tk === "workwear" && <rect x={-r.chestW * 0.62} y={r.chestY - 0.085 * k} width={0.008 * k} height={0.06 * k} rx={0.003 * k} fill="#1b2733" />}
    </g>
  );
  const hood = tk === "hoodie" && (
    <g>
      <path d={smooth([[-r.shoulderW * 0.7, r.shoulderY], [-r.headW * 1.15, r.headL * 0.75], [-r.headW * 0.95, r.headL * 0.1], [0, -r.headL * 0.16], [r.headW * 0.95, r.headL * 0.1], [r.headW * 1.15, r.headL * 0.75], [r.shoulderW * 0.7, r.shoulderY]], 0.5)} fill={darken(top, 0.1)} {...line} />
      <path d={smooth([[-r.shoulderW * 0.7, r.shoulderY], [-r.headW * 1.15, r.headL * 0.75], [-r.headW * 0.95, r.headL * 0.1], [0, -r.headL * 0.16], [r.headW * 0.95, r.headL * 0.1], [r.headW * 1.15, r.headL * 0.75], [r.shoulderW * 0.7, r.shoulderY]], 0.5)} fill="url(#ps-round)" opacity={0.6} />
      {[-1, 1].map((sd) => <path key={sd} d={`M${n2(sd * r.headW * 0.8)} ${n2(r.headL * 0.2)} Q${n2(sd * r.headW * 1.0)} ${n2(r.headL * 0.5)} ${n2(sd * r.headW * 0.85)} ${n2(r.headL * 0.75)}`} fill="none" stroke="#000" strokeWidth={1} strokeOpacity={0.14} {...SW} />)}
    </g>
  );
  const hoodieFront = tk === "hoodie" && (
    <g>
      {/* Drawstrings from the neck, the kangaroo pocket across the belly. */}
      {[-1, 1].map((sd) => <g key={sd}><path d={`M${n2(sd * 0.03 * k)} ${n2(nb + 0.055 * k)} Q${n2(sd * 0.045 * k)} ${n2(r.chestY - 0.06 * k)} ${n2(sd * 0.035 * k)} ${n2(r.chestY + 0.01 * k)}`} fill="none" stroke="#e9ecef" strokeWidth={1.3} strokeOpacity={0.9} {...SW} /><rect x={sd * 0.035 * k - 0.004 * k} y={r.chestY + 0.005 * k} width={0.008 * k} height={0.018 * k} rx={0.002 * k} fill="#9aa0a6" /></g>)}
      <path d={`M${n2(-r.waistW * 0.95)} ${n2(r.waistY - 0.02 * k)} L${n2(-r.waistW * 0.7)} ${n2(r.waistY - 0.055 * k)} L${n2(r.waistW * 0.7)} ${n2(r.waistY - 0.055 * k)} L${n2(r.waistW * 0.95)} ${n2(r.waistY - 0.02 * k)} L${n2(r.hipW * 0.95)} ${n2(hemY - 0.03 * k)} L${n2(-r.hipW * 0.95)} ${n2(hemY - 0.03 * k)} Z`} fill="#000" opacity={0.06} />
      <path d={`M${n2(-r.waistW * 0.95)} ${n2(r.waistY - 0.02 * k)} L${n2(-r.waistW * 0.7)} ${n2(r.waistY - 0.055 * k)} M${n2(r.waistW * 0.7)} ${n2(r.waistY - 0.055 * k)} L${n2(r.waistW * 0.95)} ${n2(r.waistY - 0.02 * k)} M${n2(-r.waistW * 0.7)} ${n2(r.waistY - 0.055 * k)} H${n2(r.waistW * 0.7)}`} fill="none" stroke={topInk} strokeWidth={0.7} strokeOpacity={0.45} {...SW} />
    </g>
  );
  const fleeceFront = tk === "fleece" && (
    <g>
      <path d={capsule([-r.neckW * 0.85, nb + 0.0], [r.neckW * 0.85, nb + 0.0], 0.03 * k, 0.03 * k)} fill={darken(top, 0.12)} {...lineSoft} />
      <path d={`M${n2(-0.006 * k)} ${n2(nb + 0.03 * k)} V${n2(hemY - 0.01 * k)} M${n2(0.006 * k)} ${n2(nb + 0.03 * k)} V${n2(hemY - 0.01 * k)}`} stroke={darken(top, 0.5)} strokeWidth={0.8} strokeOpacity={0.6} fill="none" {...SW} />
      <path d={`M0 ${n2(nb + 0.035 * k)} V${n2(hemY - 0.012 * k)}`} stroke="#c9ced3" strokeWidth={0.6} strokeDasharray="1 1" fill="none" {...SOFT} />
      <rect x={-0.006 * k} y={nb + 0.04 * k} width={0.012 * k} height={0.018 * k} rx={0.002 * k} fill="#9aa0a6" stroke="#1b2733" strokeWidth={0.5} {...SOFT} />
      <path d={`M${n2(-r.chestW * 0.75)} ${n2(r.chestY - 0.05 * k)} L${n2(-r.chestW * 0.35)} ${n2(r.chestY - 0.05 * k)}`} stroke={darken(top, 0.5)} strokeWidth={1.2} strokeOpacity={0.6} fill="none" {...SW} />
    </g>
  );
  const ribNeck = ribbed && tk !== "fleece" && (
    <g>
      <path d={`${roundNeck(0.05 * k)} Q0 ${n2(nb + 0.075 * k)} ${n2(-r.neckW * 0.8)} ${n2(nb - 0.01 * k)} Z`} fill={darken(top, 0.1)} {...lineSoft} />
      <path d={`${roundNeck(0.05 * k)} Q0 ${n2(nb + 0.075 * k)} ${n2(-r.neckW * 0.8)} ${n2(nb - 0.01 * k)} Z`} fill="url(#ps-rib)" />
    </g>
  );
  const teeNeck = (tk === "tee" || tk === "football") && (
    <path d={`${roundNeck((tk === "football" ? 0.07 : 0.05) * k)} Q0 ${n2(nb + (tk === "football" ? 0.085 : 0.065) * k)} ${n2(-r.neckW * 0.8)} ${n2(nb - 0.01 * k)} Z`} fill={trim ?? darken(top, 0.12)} opacity={0.95} {...lineSoft} />
  );
  const gownTies = gown && [-1, 1].map((sd) => <path key={sd} d={`M${n2(sd * r.shoulderW * 0.55)} ${n2(r.shoulderY - 0.01 * k)} l${n2(sd * 0.03 * k)} ${n2(0.03 * k)} m${n2(-sd * 0.03 * k)} ${n2(-0.03 * k)} l${n2(sd * 0.01 * k)} ${n2(0.04 * k)}`} fill="none" stroke="#2f6fa8" strokeWidth={0.8} strokeOpacity={0.7} {...SW} />);
  const hem = (
    <g>
      <path d={bandPath(hemY - 0.016 * k, hemY, 0.002 * k)} fill={darken(top, 0.14)} opacity={0.85} />
      {ribbed && <path d={bandPath(hemY - 0.016 * k, hemY, 0.002 * k)} fill="url(#ps-rib)" />}
    </g>
  );
  const folds = !gown && (
    <g>
      {[-1, 1].map((sd) => (
        <g key={sd}>
          <ellipse cx={sd * r.shoulderW * 0.84} cy={r.shoulderY + 0.1 * k} rx={0.05 * k} ry={0.04 * k} fill="url(#ps-socket)" opacity={0.7} />
          <Crease a={[sd * r.shoulderW * 0.92, r.shoulderY + 0.07 * k]} b={[sd * r.chestW * 0.25, r.chestY + 0.04 * k]} bow={sd * 0.02 * k} k={k} o={0.1} />
          <Crease a={[sd * r.chestW * 0.97, r.chestY + 0.07 * k]} b={[sd * r.waistW * 0.3, r.waistY - 0.02 * k]} bow={-sd * 0.015 * k} k={k} o={0.09} />
          <path d={`M${n2(sd * r.shoulderW * 0.98)} ${n2(r.shoulderY + 0.05 * k)} Q${n2(sd * r.chestW * 1.02)} ${n2(r.chestY)} ${n2(sd * halfAt(hemY - 0.02 * k) * 0.97)} ${n2(hemY - 0.02 * k)}`} fill="none" stroke={topInk} strokeWidth={0.6} strokeOpacity={0.25} {...SW} />
        </g>
      ))}
      <Crease a={[-r.waistW * 0.9, r.waistY + 0.03 * k]} b={[r.waistW * 0.85, r.waistY + 0.045 * k]} bow={0.01 * k} k={k} o={0.1} />
      {hemY > r.waistY + 0.12 * k && <Crease a={[-r.waistW * 0.95, r.waistY + 0.09 * k]} b={[r.waistW * 0.9, r.waistY + 0.075 * k]} bow={-0.012 * k} k={k} o={0.09} />}
    </g>
  );
  const bust = female && !child && (
    <g>
      {[-1, 1].map((sd) => (
        <g key={sd}>
          <ellipse cx={sd * r.chestW * 0.42} cy={r.chestY - 0.01 * k} rx={r.chestW * 0.34} ry={0.062 * k} fill="url(#ps-sphere)" opacity={0.16} />
          <path d={bowed([sd * r.chestW * 0.72, r.chestY + 0.045 * k], [sd * r.chestW * 0.1, r.chestY + 0.06 * k], sd * 0.012 * k)} fill="none" stroke="#000" strokeWidth={1} strokeOpacity={0.1} {...SW} />
        </g>
      ))}
    </g>
  );
  const belly = r.build.pregnant ? <ellipse cx={0} cy={r.waistY + 0.03 * k} rx={r.waistW * 0.95} ry={0.19 * k} fill="url(#ps-sphere)" opacity={0.6} /> : null;
  const hiVis = w.hiVis && (
    <g>
      <path d={smooth([[-r.shoulderW * 0.95, r.shoulderY + 0.01 * k], [-r.neckW * 0.9, nb + 0.02 * k], [r.neckW * 0.9, nb + 0.02 * k], [r.shoulderW * 0.95, r.shoulderY + 0.01 * k], [r.chestW * 0.98, r.chestY], [r.waistW * 1.05, r.waistY], [r.hipW * 0.95, r.hipY - 0.03 * k], [-r.hipW * 0.95, r.hipY - 0.03 * k], [-r.waistW * 1.05, r.waistY], [-r.chestW * 0.98, r.chestY]], 0.5)} fill={w.hiVis} {...line} opacity={0.97} />
      {[0.36, 0.52].map((t) => { const y = r.shoulderY + (r.hipY - r.shoulderY) * t; return <g key={t}><path d={`M${n2(-r.chestW * 1.02)} ${n2(y)} h${n2(r.chestW * 2.04)}`} stroke="#8a9399" strokeWidth={0.05 * k} /><path d={`M${n2(-r.chestW * 1.02)} ${n2(y)} h${n2(r.chestW * 2.04)}`} stroke="#dfe3e6" strokeWidth={0.034 * k} /></g>; })}
      <path d={`M${n2(-r.shoulderW * 0.5)} ${n2(r.shoulderY + 0.02 * k)} L${n2(-r.chestW * 0.45)} ${n2(r.hipY - 0.05 * k)} M${n2(r.shoulderW * 0.5)} ${n2(r.shoulderY + 0.02 * k)} L${n2(r.chestW * 0.45)} ${n2(r.hipY - 0.05 * k)}`} stroke="#8a9399" strokeWidth={0.05 * k} opacity={0.95} fill="none" />
      <path d={`M${n2(-r.shoulderW * 0.5)} ${n2(r.shoulderY + 0.02 * k)} L${n2(-r.chestW * 0.45)} ${n2(r.hipY - 0.05 * k)} M${n2(r.shoulderW * 0.5)} ${n2(r.shoulderY + 0.02 * k)} L${n2(r.chestW * 0.45)} ${n2(r.hipY - 0.05 * k)}`} stroke="#dfe3e6" strokeWidth={0.034 * k} opacity={0.95} fill="none" />
      <path d={`M0 ${n2(nb + 0.05 * k)} V${n2(r.hipY - 0.03 * k)}`} stroke="#1b2733" strokeWidth={0.8} strokeOpacity={0.5} strokeDasharray="1.5 1" fill="none" {...SOFT} />
    </g>
  );
  const waistband = !bare && (
    <g>
      <path d={bandPath(wbTop, wbBot)} fill={darken(bottom, elastic ? 0.08 : 0.15)} />
      {elastic && <path d={bandPath(wbTop, wbBot)} fill="url(#ps-rib)" />}
      {belt && (
        <g>
          <path d={bandPath(wbTop + 0.006 * k, wbTop + 0.028 * k)} fill="#2b241f" {...lineSoft} />
          <path d={bandPath(wbTop + 0.006 * k, wbTop + 0.028 * k)} fill="url(#ps-round)" opacity={0.5} />
          {[-0.78, -0.32, 0.32, 0.78].map((t) => <rect key={t} x={t * r.hipW - 0.006 * k} y={wbTop + 0.002 * k} width={0.012 * k} height={0.032 * k} rx={0.002 * k} fill={darken(bottom, 0.22)} stroke={bottomInk} strokeWidth={0.5} {...SOFT} />)}
          <rect x={-0.02 * k} y={wbTop + 0.003 * k} width={0.04 * k} height={0.028 * k} rx={0.004 * k} fill="#b8b2a8" stroke="#5a554d" strokeWidth={0.7} {...SOFT} />
          <rect x={-0.003 * k} y={wbTop + 0.006 * k} width={0.006 * k} height={0.022 * k} fill="#8a857c" />
        </g>
      )}
      {elastic && bk !== "pyjamas" && [-1, 1].map((sd) => <path key={sd} d={`M${n2(sd * 0.012 * k)} ${n2(wbBot - 0.01 * k)} Q${n2(sd * 0.02 * k)} ${n2(wbBot + 0.03 * k)} ${n2(sd * 0.028 * k)} ${n2(wbBot + 0.05 * k)}`} fill="none" stroke="#e9ecef" strokeWidth={1.2} strokeOpacity={0.85} {...SW} />)}
      {(bk === "jeans" || bk === "trousers") && (
        <g fill="none">
          <path d={`M0 ${n2(wbBot)} V${n2(r.crotchY - 0.015 * k)}`} stroke={bottomInk} strokeWidth={0.8} strokeOpacity={0.5} {...SW} />
          {bk === "jeans" && <path d={`M${n2(0.012 * k)} ${n2(wbBot + 0.01 * k)} Q${n2(0.03 * k)} ${n2(r.crotchY - 0.04 * k)} ${n2(0.005 * k)} ${n2(r.crotchY - 0.015 * k)}`} stroke="#c8a56a" strokeWidth={0.6} strokeOpacity={0.7} {...SW} />}
          {[-1, 1].map((sd) => <path key={sd} d={`M${n2(sd * halfAt(wbBot) * 0.98)} ${n2(wbBot + 0.015 * k)} Q${n2(sd * r.hipW * 0.6)} ${n2(wbBot + 0.03 * k)} ${n2(sd * r.hipW * 0.45)} ${n2(wbBot + 0.08 * k)}`} stroke={bk === "jeans" ? "#c8a56a" : bottomInk} strokeWidth={0.6} strokeOpacity={0.6} {...SW} />)}
        </g>
      )}
    </g>
  );
  const neckClip = `ps-neck-${Math.round(r.neckW * 1000)}-${Math.round(nb * 1000)}`;
  const neckPath = capsule(r.neckTop, add(r.neckBase, [0, 0.02 * k]), r.neckW * 0.47, r.neckW * 0.56);
  const neck = (
    <g>
      <path d={neckPath} fill={darken(skin, 0.08)} />
      <path d={neckPath} fill="url(#ps-skin)" />
      {[-1, 1].map((sd) => <path key={sd} d={`M${n2(sd * r.neckW * 0.47)} ${n2(r.neckTop[1] + 0.01 * k)} L${n2(sd * r.neckW * 0.56)} ${n2(nb + 0.01 * k)}`} fill="none" {...edge(skin, 0.5, 0.45)} />)}
      <path d={neckPath} fill="url(#ps-grain)" />
      <clipPath id={neckClip}><path d={neckPath} /></clipPath>
      <g clipPath={`url(#${neckClip})`}>
        <g filter="url(#ps-blur-sm)">
          {/* The chin's shadow across the top of the neck; the hollow of the throat above the collarbones; the sides falling away. */}
          <path d={capsule([0, r.headL - 0.02 * k], [0, r.headL + 0.035 * k], r.neckW * 0.62, r.neckW * 0.5)} fill="#2a1208" opacity={0.42} />
          <path d={`M${n2(-r.neckW * 0.3)} ${n2(nb - 0.01 * k)} Q0 ${n2(nb - 0.03 * k)} ${n2(r.neckW * 0.3)} ${n2(nb - 0.01 * k)} L${n2(r.neckW * 0.2)} ${n2(nb + 0.03 * k)} L${n2(-r.neckW * 0.2)} ${n2(nb + 0.03 * k)} Z`} fill="#2a1208" opacity={0.3} />
          <path d={capsule([r.neckW * 0.5, r.headL], [r.neckW * 0.56, nb + 0.02 * k], r.neckW * 0.12, r.neckW * 0.14)} fill="#2a1208" opacity={0.3} />
          <path d={capsule([-r.neckW * 0.5, r.headL], [-r.neckW * 0.56, nb + 0.02 * k], r.neckW * 0.1, r.neckW * 0.12)} fill="#2a1208" opacity={0.14} />
        </g>
      </g>
      {/* The two muscles from behind the ears down to the notch. */}
      {!child && [-1, 1].map((sd) => <path key={sd} d={`M${n2(sd * r.neckW * 0.44)} ${n2(r.headL + 0.005 * k)} Q${n2(sd * r.neckW * 0.32)} ${n2(nb - 0.012 * k)} ${n2(sd * r.neckW * 0.13)} ${n2(nb + 0.012 * k)}`} fill="none" stroke="#2a1208" strokeWidth={1.3} strokeOpacity={0.14} {...SW} />)}
      {!child && !female && <ellipse cx={0} cy={r.headL + 0.025 * k} rx={r.neckW * 0.11} ry={0.014 * k} fill="url(#ps-sphere)" opacity={0.5} />}
      <path d={`M${n2(-r.neckW * 0.06)} ${n2(r.headL + 0.012 * k)} V${n2(nb - 0.025 * k)}`} stroke="#fff" strokeWidth={2.2} strokeOpacity={0.08} fill="none" {...SW} />
    </g>
  );
  const clavicles = !child && [-1, 1].map((sd) => (
    <g key={sd}>
      <path d={`M${n2(sd * 0.13 * k * bulk)} ${n2(nb + 0.024 * k)} Q${n2(sd * 0.05 * k)} ${n2(nb + 0.05 * k)} ${n2(sd * 0.012 * k)} ${n2(nb + 0.036 * k)}`} fill="none" stroke="#fff" strokeWidth={1.4} strokeOpacity={0.12} {...SW} />
      <path d={`M${n2(sd * 0.13 * k * bulk)} ${n2(nb + 0.028 * k)} Q${n2(sd * 0.05 * k)} ${n2(nb + 0.054 * k)} ${n2(sd * 0.012 * k)} ${n2(nb + 0.04 * k)}`} fill="none" stroke={ink} strokeWidth={0.8} strokeOpacity={0.3} {...SW} />
    </g>
  ));
  // The chest bared for pads or electrodes: the top cut up the front with
  // shears and laid open, its shoulders still on, the two halves lying out
  // over the arms, cut edges outermost; the skin beneath with its
  // collarbones, breastbone, the swell of the chest and the navel.
  const exposed = !!w.exposed;
  const lifted = w.exposed === "lifted";
  const bandY = r.shoulderY + 0.07 * k;
  const topColour = gown ? "#9fc4dd" : top;
  const flap = (sd: number) => {
    const h = (y: number) => halfAt(y);
    return smooth([
      [sd * h(bandY), bandY], [sd * h(r.chestY), r.chestY], [sd * h(r.waistY), r.waistY], [sd * h(hemY) * 1.02, hemY],
      [sd * h(hemY) * 1.85, hemY + 0.025 * k], [sd * h(r.waistY) * 2.0, r.waistY + 0.03 * k], [sd * h(r.chestY) * 1.95, r.chestY - 0.03 * k], [sd * r.shoulderW * 1.45, bandY + 0.03 * k],
    ], 0.45);
  };
  const flapEdge = (sd: number) => smoothOpen([[sd * r.shoulderW * 1.45, bandY + 0.03 * k], [sd * halfAt(r.chestY) * 1.9, r.chestY - 0.01 * k], [sd * halfAt(r.chestY) * 1.97, r.chestY + 0.09 * k], [sd * halfAt(r.waistY) * 1.96, r.waistY + 0.03 * k], [sd * halfAt(hemY) * 1.85, hemY + 0.025 * k]], 0.5);
  const shoulderPts = right.filter((p) => p[1] < bandY - 0.01 * k);
  const shoulderBand = smooth([...shoulderPts, [halfAt(bandY), bandY], [-halfAt(bandY), bandY], ...shoulderPts.slice().reverse().map((p): Pt => [-p[0], p[1]])], 0.5);
  // The body under the cloth, soft-edged: shadow down the far side and
  // under the chest, light where the chest rises nearest the lamp.
  const trunkClip = `ps-trunk-${Math.round(r.chestW * 1000)}-${Math.round(hemY * 1000)}-${Math.round(r.shoulderY * 1000)}`;
  const sideShade = (sd: number, inner: number) => smooth([
    [sd * r.shoulderW * 0.6, r.shoulderY + 0.02 * k], [sd * r.chestW * 1.05, r.chestY], [sd * r.waistW * 1.05, r.waistY], [sd * r.hipW * 1.0, hemY + 0.01 * k],
    [sd * r.hipW * inner, hemY + 0.01 * k], [sd * r.waistW * inner, r.waistY], [sd * r.chestW * (inner + 0.04), r.chestY + 0.02 * k], [sd * r.shoulderW * (inner - 0.15), r.shoulderY + 0.08 * k],
  ], 0.5);
  // The deltoids: a dome on each shoulder, lit from the left, falling into shade on the right.
  const shoulderDomes = (dark: string, light: string) => [-1, 1].map((sd) => (
    <g key={sd}>
      <ellipse cx={sd * r.shoulderW * 0.84 - 0.02 * k} cy={r.shoulderY + 0.015 * k} rx={0.055 * k} ry={0.04 * k} fill={light} opacity={0.14} />
      <ellipse cx={sd * r.shoulderW * 0.84 + 0.025 * k} cy={r.shoulderY + 0.06 * k} rx={0.06 * k} ry={0.035 * k} fill={dark} opacity={0.16} />
    </g>
  ));
  const clothShade = (
    <g clipPath={`url(#${trunkClip})`}>
      <g filter="url(#ps-blur-md)">
        <path d={sideShade(1, 0.6)} fill="#000" opacity={0.2} />
        <path d={sideShade(-1, 0.76)} fill="#000" opacity={0.07} />
        <ellipse cx={0} cy={r.chestY + 0.1 * k} rx={r.chestW * 0.8} ry={0.028 * k} fill="#000" opacity={0.12} />
        <ellipse cx={0} cy={r.shoulderY + 0.02 * k} rx={r.neckW * 1.2} ry={0.04 * k} fill="#000" opacity={0.14} />
        <ellipse cx={-r.chestW * 0.2} cy={r.chestY - 0.03 * k} rx={r.chestW * 0.4} ry={0.09 * k} fill="#fff" opacity={0.12} />
        <ellipse cx={0} cy={r.waistY + 0.04 * k} rx={r.waistW * 0.55} ry={0.05 * k} fill="#fff" opacity={0.06} />
        {shoulderDomes("#000", "#fff")}
      </g>
    </g>
  );
  const skinShade = (
    <g clipPath={`url(#${trunkClip})`}>
      <g filter="url(#ps-blur-md)">
        {/* The ribcage's far side in shadow, the hollow under each pec, the costal margin, light on the breastbone. */}
        <path d={sideShade(1, 0.62)} fill="#2a1208" opacity={0.22} />
        <path d={sideShade(-1, 0.78)} fill="#2a1208" opacity={0.08} />
        {!child && [-1, 1].map((sd) => <ellipse key={sd} cx={sd * r.chestW * 0.45} cy={r.chestY + (female ? 0.075 : 0.065) * k} rx={r.chestW * 0.38} ry={0.022 * k} fill="#2a1208" opacity={0.2} />)}
        {!child && [-1, 1].map((sd) => <path key={sd} d={`M${n2(sd * r.chestW * 0.95)} ${n2(r.chestY + 0.1 * k)} Q${n2(sd * r.chestW * 0.55)} ${n2(r.chestY + 0.16 * k)} ${n2(sd * 0.03 * k)} ${n2(r.waistY - 0.02 * k)}`} fill="none" stroke="#2a1208" strokeWidth={0.02 * k} strokeOpacity={0.14} />)}
        <path d={`M0 ${n2(nb + 0.06 * k)} V${n2(r.chestY + 0.08 * k)}`} stroke="#2a1208" strokeWidth={0.016 * k} strokeOpacity={0.12} fill="none" />
        <ellipse cx={0} cy={r.shoulderY + 0.02 * k} rx={r.neckW * 1.1} ry={0.035 * k} fill="#2a1208" opacity={0.16} />
        <ellipse cx={-r.chestW * 0.25} cy={r.chestY - 0.03 * k} rx={r.chestW * 0.3} ry={0.08 * k} fill="#fff" opacity={0.12} />
        <ellipse cx={0} cy={r.waistY + 0.02 * k} rx={r.waistW * 0.5} ry={0.07 * k} fill="#fff" opacity={0.07} />
        {shoulderDomes("#2a1208", "#fff")}
      </g>
    </g>
  );
  const bareTrunk = (
    <g>
      <path d={topPath} fill={skin} {...edge(skin, 0.55, 0.55, 0.8)} />
      <path d={topPath} fill="url(#ps-skin)" />
      <path d={topPath} fill="url(#ps-grain)" />
      {skinShade}
      {!lifted && [-1, 1].map((sd) => (
        <g key={sd}>
          <path d={flap(sd)} fill={topColour} {...edge(topColour, 0.55, 0.6, 0.8)} />
          <path d={flap(sd)} fill={sd === 1 ? "url(#ps-slope-r)" : "url(#ps-slope-l)"} opacity={0.35} />
          <path d={flap(sd)} fill="url(#ps-grain)" />
          {gown && <path d={flap(sd)} fill="url(#ps-gown)" />}
          {w.exposed === "cut" && <path d={flapEdge(sd)} fill="none" stroke={darken(topColour, 0.5)} strokeWidth={0.8} strokeOpacity={0.6} strokeDasharray="2 1.2" {...SW} />}
          {(tk === "shirt" || tk === "pyjamas") && sd === 1 && [0.2, 0.42, 0.64, 0.86].map((t) => { const y = bandY + (hemY - bandY) * t; const x = halfAt(y) * 1.82; return <circle key={t} cx={x} cy={y} r={0.0065 * k} fill={tk === "pyjamas" ? "#ffffff" : darken(top, 0.4)} stroke={topInk} strokeWidth={0.5} {...SOFT} />; })}
        </g>
      ))}
      {!lifted && <path d={shoulderBand} fill={topColour} {...edge(topColour, 0.55, 0.6, 0.8)} />}
      {!lifted && <path d={shoulderBand} fill="url(#ps-round)" />}
      {!lifted && <path d={shoulderBand} fill="url(#ps-grain)" />}
      {!lifted && hiVis && <path d={shoulderBand} fill={w.hiVis ?? topColour} opacity={0.9} />}
      {/* Pushed up: the top rolled under the armpits in a thick band across the top of the chest. */}
      {lifted && (
        <g>
          <path d={capsule([-r.shoulderW * 0.96, r.shoulderY - 0.012 * k], [r.shoulderW * 0.96, r.shoulderY - 0.012 * k], 0.032 * k, 0.032 * k)} fill={topColour} {...edge(topColour, 0.55, 0.6, 0.8)} />
          <path d={capsule([-r.shoulderW * 0.96, r.shoulderY - 0.012 * k], [r.shoulderW * 0.96, r.shoulderY - 0.012 * k], 0.032 * k, 0.032 * k)} fill="url(#ps-round-v)" opacity={0.7} />
          {[-0.7, -0.4, -0.1, 0.2, 0.5, 0.8].map((t) => <Crease key={t} a={[t * r.shoulderW, r.shoulderY - 0.04 * k]} b={[(t + 0.12) * r.shoulderW, r.shoulderY + 0.016 * k]} bow={0.004 * k} k={k} o={0.14} />)}
        </g>
      )}
      {/* The chest itself. */}
      {!child && [-1, 1].map((sd) => <path key={sd} d={`M${n2(sd * 0.03 * k)} ${n2(nb + 0.035 * k)} Q${n2(sd * 0.1 * k * bulk)} ${n2(nb + 0.055 * k)} ${n2(sd * r.shoulderW * 0.85)} ${n2(r.shoulderY + 0.02 * k)}`} fill="none" stroke={ink} strokeWidth={0.8} strokeOpacity={0.22} {...SW} />)}
      <path d={`M0 ${n2(nb + 0.06 * k)} V${n2(r.chestY + 0.09 * k)}`} stroke={ink} strokeWidth={0.8} strokeOpacity={0.12} fill="none" {...SW} />
      {female && !child ? (
        [-1, 1].map((sd) => (
          <g key={sd}>
            <ellipse cx={sd * r.chestW * 0.42} cy={r.chestY - 0.01 * k} rx={r.chestW * 0.36} ry={0.075 * k} fill="url(#ps-sphere)" opacity={0.4} />
            <path d={bowed([sd * r.chestW * 0.75, r.chestY + 0.05 * k], [sd * r.chestW * 0.08, r.chestY + 0.065 * k], sd * 0.014 * k)} fill="none" stroke={ink} strokeWidth={1} strokeOpacity={0.18} {...SW} />
          </g>
        ))
      ) : (
        [-1, 1].map((sd) => (
          <g key={sd}>
            <ellipse cx={sd * r.chestW * 0.46} cy={r.chestY - 0.03 * k} rx={r.chestW * 0.4} ry={0.085 * k} fill="url(#ps-sphere)" opacity={child ? 0.15 : 0.28} />
            {!child && <path d={bowed([sd * r.chestW * 0.85, r.chestY + 0.045 * k], [sd * r.chestW * 0.12, r.chestY + 0.055 * k], sd * 0.012 * k)} fill="none" stroke={ink} strokeWidth={1} strokeOpacity={0.12} {...SW} />}
            {!child && <circle cx={sd * r.chestW * 0.5} cy={r.chestY + 0.01 * k} r={0.011 * k} fill={darken(skin, 0.3)} opacity={0.45} />}
          </g>
        ))
      )}
      {belly}
      {!r.build.pregnant && <ellipse cx={0} cy={r.waistY + 0.05 * k} rx={0.006 * k} ry={0.009 * k} fill={darken(skin, 0.5)} opacity={0.4} />}
      {(r.build.elderly || bulk < 0.95) && !child && [-1, 1].map((sd) => <g key={sd}>{[0.08, 0.13, 0.18].map((dy) => <path key={dy} d={bowed([sd * r.chestW * 0.9, r.chestY + dy * k], [sd * r.chestW * 0.3, r.chestY + (dy + 0.03) * k], -sd * 0.01 * k)} fill="none" stroke={ink} strokeWidth={0.8} strokeOpacity={0.07} {...SW} />)}</g>)}
    </g>
  );
  // The figure's own shadow on the ground: every part as one dark shape,
  // blurred and thrown a little down and to the right of the body, the
  // light being over the viewer's left shoulder.
  const silhouette = (
    <>
      <path d={headOutline(r, child)} />
      <path d={capsule(r.neckTop, add(r.neckBase, [0, 0.02 * k]), r.neckW * 0.5, r.neckW * 0.55)} />
      <path d={topPath} />
      <path d={pelvis} />
      {[r.armR, r.armL].map((arm, i) => <g key={i}><path d={limbPath(arm.a, arm.b, arm.c, r.armW[0] * 1.08, r.armW[1] * 1.1, r.armW[2] * 1.1)} /><path d={capsule(arm.c, arm.d, r.armW[2] * 1.05, r.armW[2] * 0.7)} /></g>)}
      {([[r.legR, r.toeR, -1], [r.legL, r.toeL, 1]] as [Limb, Pt, number][]).map(([leg, toe, side], i) => {
        const d = unit(toe);
        const heel = add(leg.c, mul(d, -(r.feetFlat ? r.footL * 0.14 : r.footW * 0.35)));
        return <g key={i}><path d={limbPath(leg.a, leg.b, leg.c, r.legW[0] * 1.1, r.legW[1] * 1.12, r.legW[2] * 1.2)} /><path d={footPath(heel, d, mul(perp(d), side), r.footL, r.footW)} /></g>;
      })}
    </>
  );
  const shadowRx = r.pose === "seated" ? r.shoulderW * 1.6 : r.shoulderW * 1.5;
  const armByTheSideR = r.handFlatR && r.armR.c[0] < -r.chestW * 0.9;
  const armByTheSideL = r.handFlatL && r.armL.c[0] > r.chestW * 0.9;
  return (
    <g className="ps-fig">
      {shadow && <ellipse cx={0.02 * k} cy={(r.bottom + 0.05 * k) / 2} rx={shadowRx} ry={(r.bottom + 0.1 * k) / 2} fill="url(#ps-shadow)" opacity={0.6} />}
      {shadow && (
        <g filter="url(#ps-soft-shadow)" opacity={0.46} transform={`translate(${n2(0.026 * k)} ${n2(0.03 * k)})`} fill="#000">
          {silhouette}
        </g>
      )}
      {hood}
      {/* Legs */}
      {legSeg(r.legR, -1, r.toeR)}
      {legSeg(r.legL, 1, r.toeL)}
      {/* Arms that lie by the sides go under the trunk's edge; reaching arms come over it. */}
      {armByTheSideR && armSeg(r.armR, -1, r.palmUpR, r.handFlatR, true)}
      {armByTheSideL && armSeg(r.armL, 1, r.palmUpL, r.handFlatL, true)}
      {/* Trunk */}
      <g className={chestClass} style={chestStyle}>
        <path d={pelvis} fill={bare ? skin : bottom} {...edge(bare ? skin : bottom, 0.5, 0.55)} />
        <path d={pelvis} fill={bare ? "url(#ps-skin)" : "url(#ps-round)"} />
        <path d={pelvis} fill="url(#ps-grain)" />
        <clipPath id={trunkClip}><path d={topPath} /></clipPath>
        {waistband}
        {exposed ? bareTrunk : (
          <g>
            <path d={topPath} fill={gown ? "#9fc4dd" : top} {...edge(gown ? "#9fc4dd" : top, 0.55, 0.6, 0.8)} />
            <path d={topPath} fill="url(#ps-round)" />
            <path d={topPath} fill="url(#ps-grain)" />
            {(tk === "football" || tk === "fleece") && <path d={topPath} fill="url(#ps-sheen)" />}
            {gown && <path d={topPath} fill="url(#ps-gown)" />}
            {tk === "jumper" && <path d={topPath} fill="url(#ps-knit)" />}
            {clothShade}
            {bust}
            {belly}
            {tk === "football" && <g>{[-0.5, 0.5].map((t) => <path key={t} d={`M${n2(t * r.chestW * 0.9)} ${n2(r.shoulderY)} L${n2(t * r.hipW * 0.9)} ${n2(r.hipY)}`} stroke="#ffffff" strokeWidth={0.02 * k} opacity={0.85} />)}</g>}
            {tk === "pyjamas" && <g>{[-0.6, -0.2, 0.2, 0.6].map((t) => <path key={t} d={`M${n2(t * r.chestW)} ${n2(r.shoulderY)} L${n2(t * r.hipW)} ${n2(r.hipY + 0.02 * k)}`} stroke="#ffffff" strokeWidth={0.012 * k} opacity={0.5} />)}</g>}
            {tk === "football" && w.number && <text x={0} y={r.chestY + 0.02 * k} textAnchor="middle" fontSize={0.12 * k} fontWeight={800} fill="#ffffff" fontFamily="Arial, sans-serif" opacity={0.9}>{w.number}</text>}
            {folds}
            {hiVis}
            {hoodieFront}
            {fleeceFront}
            {pocket}
            {placket}
            {!gown && hem}
          </g>
        )}
        {/* The open neck shows skin. */}
        <path d={`${neckline} Z`} fill={skin} {...edge(skin, 0.45, 0.4)} />
        <path d={`${neckline} Z`} fill="url(#ps-skin)" opacity={0.6} />
        {clavicles}
        {!lifted && teeNeck}
        {!lifted && ribNeck}
        {!lifted && collar}
        {!lifted && gownTies}
        {onChest}
      </g>
      {/* Where parts meet, the light cannot get in: the groove between the chest and each arm, the fold under the waistband, the crease between the legs. */}
      <g filter="url(#ps-blur-sm)" fill="none" stroke="#000" strokeLinecap="round">
        {[-1, 1].map((sd) => <path key={sd} d={`M${n2(sd * r.shoulderW * 0.96)} ${n2(r.shoulderY + 0.05 * k)} Q${n2(sd * r.chestW * 1.04)} ${n2(r.chestY - 0.02 * k)} ${n2(sd * r.chestW * 0.98)} ${n2(r.chestY + 0.09 * k)}`} strokeWidth={0.018 * k} strokeOpacity={0.22} />)}
        {!bare && <path d={`M${n2(-r.hipW * 0.9)} ${n2(wbBot + 0.012 * k)} Q0 ${n2(wbBot + 0.022 * k)} ${n2(r.hipW * 0.9)} ${n2(wbBot + 0.012 * k)}`} strokeWidth={0.016 * k} strokeOpacity={0.16} />}
        <path d={`M0 ${n2(r.crotchY + 0.01 * k)} L${n2((r.legR.b[0] + r.legL.b[0]) / 2)} ${n2((r.legR.b[1] + r.legL.b[1]) / 2 - 0.06 * k)}`} strokeWidth={0.02 * k} strokeOpacity={0.14} />
      </g>
      {/* Arms over the trunk */}
      {!armByTheSideR && armSeg(r.armR, -1, r.palmUpR, r.handFlatR)}
      {!armByTheSideL && armSeg(r.armL, 1, r.palmUpL, r.handFlatL)}
      {/* Neck and head */}
      {neck}
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
