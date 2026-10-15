"use client";

// THE CREW FROM ABOVE. Someone kneeling over a patient, seen from where a
// camera on the ceiling would see them: the top of the head leaning in,
// the shoulders behind it, two arms reaching to the work, blue gloves on
// the hands, the soles of the boots poking out at the far end. Dressed
// as they are: the ambulance service's bottle-green shirt and trousers,
// role slides on the shoulders, a radio on the strap, the hi-vis jacket
// only where it would be worn — on the road, the platform, the site, out
// at night — and then with its green yoke uppermost. A yellow fire
// helmet, a chequered police cap, the orange of a HEMS team.

import type { CSSProperties, ReactNode } from "react";
import { type Pt, add, sub, mul, unit, perp, lerp, len, deg, P, capsule, smooth, darken, edge, line, lineSoft, handParts, HandShape, limbPath } from "./plan-figure";

const SOFT = { vectorEffect: "non-scaling-stroke" as const };
const n2 = (v: number) => (Math.round(v * 1000) / 1000).toString();

export type CrewHat = "none" | "fire_helmet" | "police_cap" | "white_helmet";

export type CrewWear = {
  /** The shirt or tunic. */
  uniform: string;
  trousers: string;
  /** The hi-vis jacket's colour, if the service has one. */
  hiVis: string | null;
  /** Wearing the jacket now. */
  jacket: boolean;
  /** What the shoulders show: a jacket's yoke, or the shirt. */
  yoke: string;
  sleeves: "short" | "long";
  /** The role slide on each shoulder, in capitals; empty for none. */
  role: string;
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
  /** A class on each glove: "squeeze" for the hand working a bag. */
  handClass?: { left?: string; right?: string };
  /** Compressions: `hands.left` is the point pressed. The heel of the left
   *  hand lands on it, the right hand lies over the left with its fingers
   *  laced through and lifted, both pointing across the patient. */
  grip?: "cpr";
  /** On the whole figure: an animation delay, so the crew do not sway in step. */
  style?: CSSProperties;
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

function Glove({ wrist, dir, colour, hand, curl = 0.08, splay = 1.1 }: { wrist: Pt; dir: Pt; colour: string; hand: "left" | "right"; curl?: number; splay?: number }) {
  // A nitrile glove on a hand pressed flat to the work, fingers a little
  // apart; the cuff loose at the wrist. Palm down, a right hand's thumb is
  // on its left as the fingers point away, a left hand's on its right.
  const parts = handParts({ wrist, dir, L: 0.19, wW: 0.034, thumb: hand === "right" ? -1 : 1, curl, splay });
  return <HandShape parts={parts} fill={colour} detail="glove" ink="#17304f" cuff={darken(colour, 0.16)} sheen />;
}

function Hat({ c, f, hat }: { c: Pt; f: Pt; hat: CrewHat }) {
  const [cx, cy] = c;
  const ang = deg(f);
  if (hat === "fire_helmet" || hat === "white_helmet") {
    const colour = hat === "fire_helmet" ? "#f2d33c" : "#f4f4f0";
    return (
      <g transform={`rotate(${n2(ang)} ${n2(cx)} ${n2(cy)})`}>
        {/* The neck curtain hanging behind, the brim, the dome with its comb, the visor's edge at the front, the service flashes. */}
        <path d={`M${n2(cx - 0.05)} ${n2(cy - 0.125)} L${n2(cx - 0.19)} ${n2(cy - 0.105)} Q${n2(cx - 0.235)} ${n2(cy)} ${n2(cx - 0.19)} ${n2(cy + 0.105)} L${n2(cx - 0.05)} ${n2(cy + 0.125)} Z`} fill="#2b2f36" {...edge("#2b2f36", 0.5, 0.6, 0.8)} />
        <path d={`M${n2(cx - 0.05)} ${n2(cy - 0.125)} L${n2(cx - 0.19)} ${n2(cy - 0.105)} Q${n2(cx - 0.235)} ${n2(cy)} ${n2(cx - 0.19)} ${n2(cy + 0.105)} L${n2(cx - 0.05)} ${n2(cy + 0.125)} Z`} fill="url(#ps-slope-l)" opacity={0.5} />
        <ellipse cx={cx} cy={cy} rx={0.165} ry={0.15} fill={darken(colour, 0.22)} {...edge(colour, 0.6, 0.6, 0.8)} />
        <ellipse cx={cx} cy={cy} rx={0.165} ry={0.15} fill="url(#ps-round)" opacity={0.5} />
        <ellipse cx={cx} cy={cy} rx={0.138} ry={0.123} fill={colour} />
        <ellipse cx={cx} cy={cy} rx={0.138} ry={0.123} fill="url(#ps-sphere)" opacity={0.95} />
        <ellipse cx={cx} cy={cy} rx={0.138} ry={0.123} fill="url(#ps-grain)" />
        <path d={`M${n2(cx - 0.1)} ${n2(cy)} H${n2(cx + 0.11)}`} stroke={darken(colour, 0.3)} strokeWidth={0.03} strokeLinecap="round" />
        <path d={`M${n2(cx - 0.1)} ${n2(cy - 0.008)} H${n2(cx + 0.11)}`} stroke="#fff" strokeWidth={0.006} strokeOpacity={0.35} strokeLinecap="round" />
        <path d={`M${n2(cx + 0.09)} ${n2(cy - 0.11)} Q${n2(cx + 0.2)} ${n2(cy)} ${n2(cx + 0.09)} ${n2(cy + 0.11)}`} fill="none" stroke="#1b2733" strokeWidth={0.012} strokeOpacity={0.7} strokeLinecap="round" />
        <rect x={cx - 0.03} y={cy - 0.12} width={0.06} height={0.025} fill="#e04b2a" />
        <rect x={cx - 0.03} y={cy + 0.095} width={0.06} height={0.025} fill="#e04b2a" />
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
  const cap = smooth([[cx + r * 0.75, cy - r * 0.6], [cx + r * 0.2, cy - r * 0.95], [cx - r * 0.5, cy - r * 0.85], [cx - r * 0.98, cy - r * 0.2], [cx - r * 0.98, cy + r * 0.2], [cx - r * 0.5, cy + r * 0.85], [cx + r * 0.2, cy + r * 0.95], [cx + r * 0.75, cy + r * 0.6], [cx + r * 0.55, cy]], 0.6);
  const headClip = `ps-crew-hd-${Math.round(cx * 1000)}-${Math.round(cy * 1000)}`;
  return (
    <g>
      {[-1, 1].map((side) => { const e = add(c, mul(s, side * r * 0.98)); return <g key={side} transform={`rotate(${n2(ang)} ${n2(e[0])} ${n2(e[1])})`}><ellipse cx={e[0]} cy={e[1]} rx={r * 0.16} ry={r * 0.24} fill={wear.skin} {...lineSoft} /><ellipse cx={e[0]} cy={e[1]} rx={r * 0.08} ry={r * 0.14} fill="none" stroke={darken(wear.skin, 0.4)} strokeWidth={0.6} strokeOpacity={0.5} {...SOFT} /></g>; })}
      {/* The brow and the tip of the nose show past the forehead of a head bowed to the work. */}
      <ellipse cx={cx + r * 1.0} cy={cy} rx={r * 0.14} ry={r * 0.2} fill={wear.skin} {...lineSoft} transform={`rotate(${n2(ang)} ${n2(cx)} ${n2(cy)})`} />
      <circle cx={cx} cy={cy} r={r} fill={wear.skin} {...edge(wear.skin, 0.55, 0.55, 0.8)} />
      <circle cx={cx} cy={cy} r={r} fill="url(#ps-sphere)" opacity={0.5} />
      <circle cx={cx} cy={cy} r={r} fill="url(#ps-grain)" />
      {hair !== "bald" && (
        <g>
          {/* The hair's shadow on the forehead and the ears, soft. */}
          <clipPath id={headClip}><circle cx={cx} cy={cy} r={r} /></clipPath>
          <g clipPath={`url(#${headClip})`}>
            <path d={cap} fill="#000" opacity={0.3} filter="url(#ps-blur-sm)" transform={`translate(0.012 0.012) rotate(${n2(ang)} ${n2(cx)} ${n2(cy)})`} />
          </g>
        </g>
      )}
      {hair !== "bald" && (
        <g transform={`rotate(${n2(ang)} ${n2(cx)} ${n2(cy)})`}>
          {/* The crown of the head from above: hair all over, the forehead (towards f) showing, the strands turning from the whorl at the crown. */}
          <path d={cap} fill={wear.hair} {...edge(wear.hair, 0.45, 0.6, 0.8)} />
          <path d={cap} fill="url(#ps-grain)" />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2 + 0.3;
            const whorl: Pt = [cx - r * 0.25, cy - r * 0.05];
            const reach = 0.5 + 0.3 * Math.abs(Math.sin(a * 1.7 + 1)) + 0.04 * (i % 3);
            const end: Pt = [whorl[0] + Math.cos(a) * r * reach * (Math.cos(a) > 0 ? 0.8 : 1.05), whorl[1] + Math.sin(a) * r * reach];
            const start: Pt = [whorl[0] + Math.cos(a) * r * (0.1 + 0.04 * (i % 2)), whorl[1] + Math.sin(a) * r * (0.1 + 0.04 * (i % 2))];
            const c = add(lerp(start, end, 0.5), mul(perp(unit(sub(end, start))), r * (0.07 + 0.03 * (i % 2))));
            const light = i % 4 === 1;
            return <path key={i} d={`M${P(start)} Q${P(c)} ${P(end)}`} fill="none" stroke={light ? "#ffffff" : darken(wear.hair, 0.4)} strokeWidth={light ? 0.5 : 0.55 + 0.25 * (i % 3)} strokeOpacity={light ? 0.2 : 0.3 + 0.08 * (i % 3)} {...SOFT} strokeLinecap="round" />;
          })}
          {(hair === "long" || hair === "bob") && (
            <g>
              <circle cx={cx - r * 0.85} cy={cy} r={r * 0.46} fill={wear.hair} {...lineSoft} />
              <circle cx={cx - r * 0.85} cy={cy} r={r * 0.46} fill="url(#ps-sphere)" opacity={0.7} />
              <path d={`M${n2(cx - r * 0.85 + r * 0.3)} ${n2(cy)} a${n2(r * 0.3)} ${n2(r * 0.3)} 0 1 1 ${n2(-r * 0.3)} ${n2(-r * 0.28)} a${n2(r * 0.16)} ${n2(r * 0.16)} 0 1 1 ${n2(r * 0.1)} ${n2(r * 0.2)}`} fill="none" stroke={darken(wear.hair, 0.4)} strokeWidth={0.8} strokeOpacity={0.5} {...SOFT} strokeLinecap="round" />
            </g>
          )}
        </g>
      )}
      {hair === "bald" && <circle cx={cx} cy={cy} r={r} fill="url(#ps-face-shade)" />}
      {hair === "bald" && <ellipse cx={cx - r * 0.2} cy={cy - r * 0.15} rx={r * 0.3} ry={r * 0.2} fill="#fff" opacity={0.16} />}
      {hair !== "bald" && <circle cx={cx} cy={cy} r={r} fill="url(#ps-hair-shine)" />}
      <g transform={`translate(${n2(cx)} ${n2(cy)}) scale(${n2(r / 0.105)}) translate(${n2(-cx)} ${n2(-cy)})`}>
        <Hat c={c} f={f} hat={wear.hat} />
      </g>
    </g>
  );
}

export function CrewTop({ at, facing, hands, wear, kneeling = true, armsClass, handClass, grip, style, children }: CrewTopProps) {
  const f = unit(facing);
  const s = perp(f);
  // Where the wrists go for compressions: stacked on the point pressed.
  const press = grip === "cpr" && hands.left ? hands.left : undefined;
  const wristL = press ? add(press, mul(f, -0.035)) : hands.left;
  const wristR = press ? add(add(press, mul(f, -0.055)), mul(s, 0.014)) : hands.right;
  const glove = "#4a78b5";
  const ang = deg(f);
  const head = crewHeadAt(at, f);
  const jacket = wear.jacket && wear.hiVis ? wear.hiVis : null;
  const sleeve = jacket ?? wear.uniform;
  const forearm = jacket ?? (wear.sleeves === "short" ? wear.skin : wear.uniform);
  const band = "#cfd4d8";
  // Points along the body axis: positive is towards the work.
  const axis = (d: number, across = 0): Pt => add(add(at, mul(f, d)), mul(s, across));
  // From a camera over the patient, someone kneeling and leaning in is a
  // head, a pair of shoulders and two arms reaching down. The trunk slopes
  // away under the head and shows as a short back behind the shoulders;
  // the legs are tucked under it, so only the boot soles peep out behind.
  const shL = axis(-0.02, -0.2);
  const shR = axis(-0.02, 0.2);
  const arm = (sh: Pt, target: Pt | undefined, bend: 1 | -1, hand: "left" | "right") => {
    const t = target ?? axis(0.24, bend * 0.26);
    const el = elbow(sh, t, 0.2, 0.19, bend);
    const up = unit(sub(el, sh)), fore = unit(sub(t, el));
    const longSleeve = forearm !== wear.skin;
    const crease = (c: Pt, dir: Pt, w: number, bow: number, o: number) => {
      const n = perp(dir);
      const a = add(c, mul(n, w)), b = add(c, mul(n, -w));
      return <path d={`M${P(a)} Q${P(add(lerp(a, b, 0.5), mul(dir, bow)))} ${P(b)}`} fill="none" stroke="#000" strokeWidth={1} strokeOpacity={o} {...SOFT} strokeLinecap="round" />;
    };
    const cls = hand === "left" ? handClass?.left : handClass?.right;
    return (
      <g>
        {longSleeve ? (
          <g>
            {/* One sleeve from shoulder to wrist, the elbow blended. */}
            <path d={limbPath(sh, el, t, 0.052, 0.04, 0.03)} fill={sleeve} {...edge(sleeve, 0.55, 0.6, 0.8)} />
            <path d={capsule(sh, el, 0.052, 0.04)} fill="url(#ps-round)" opacity={0.6} />
            <path d={capsule(el, t, 0.04, 0.03)} fill="url(#ps-round)" opacity={0.35} />
            <path d={limbPath(sh, el, t, 0.052, 0.04, 0.03)} fill="url(#ps-grain)" />
          </g>
        ) : (
          <g>
            <path d={capsule(sh, el, 0.052, 0.04)} fill={sleeve} {...edge(sleeve, 0.55, 0.6, 0.8)} />
            <path d={capsule(sh, el, 0.052, 0.04)} fill="url(#ps-round)" opacity={0.6} />
            <path d={capsule(sh, el, 0.052, 0.04)} fill="url(#ps-grain)" />
            {/* The sleeve's hem at the elbow. */}
            <path d={capsule(lerp(sh, el, 0.86), el, 0.042, 0.04)} fill={darken(sleeve, 0.18)} opacity={0.85} />
          </g>
        )}
        <ellipse cx={sh[0]} cy={sh[1]} rx={0.065} ry={0.055} fill="url(#ps-socket)" opacity={0.8} />
        <ellipse cx={el[0]} cy={el[1]} rx={0.04} ry={0.034} fill="url(#ps-socket)" opacity={0.5} />
        {crease(lerp(sh, el, 0.72), up, 0.04, 0.008, 0.12)}
        {!longSleeve && <path d={capsule(el, t, 0.04, 0.03)} fill={forearm} stroke={darken(forearm, 0.5)} strokeWidth={0.8} strokeOpacity={0.65} {...SOFT} strokeLinejoin="round" />}
        {!longSleeve && <path d={capsule(el, t, 0.04, 0.03)} fill="url(#ps-skin)" opacity={0.8} />}
        {!longSleeve && <path d={capsule(el, t, 0.04, 0.03)} fill="url(#ps-grain)" />}
        {longSleeve && crease(lerp(el, t, 0.12), fore, 0.036, -0.007, 0.12)}
        {longSleeve && crease(lerp(el, t, 0.24), fore, 0.034, 0.006, 0.1)}
        {longSleeve && <path d={capsule(lerp(el, t, 0.85), lerp(el, t, 0.98), 0.033, 0.031)} fill={darken(forearm, 0.18)} opacity={0.9} />}
        {!longSleeve && <ellipse cx={el[0]} cy={el[1]} rx={0.02} ry={0.022} fill="url(#ps-sphere)" opacity={0.4} />}
        {!longSleeve && <path d={`M${P(add(lerp(el, t, 0.2), mul(perp(fore), bend * 0.008)))} L${P(add(lerp(el, t, 0.85), mul(perp(fore), bend * 0.006)))}`} stroke="#fff" strokeWidth={1.2} strokeOpacity={0.1} fill="none" {...SOFT} />}
        {jacket && <path d={capsule(lerp(el, t, 0.5), lerp(el, t, 0.66), 0.037, 0.035)} fill="#8a9399" opacity={0.95} />}
        {jacket && <path d={capsule(lerp(el, t, 0.52), lerp(el, t, 0.64), 0.037, 0.035)} fill={band} opacity={0.95} />}
        {hand === "left" && !jacket && (
          <g>
            <path d={capsule(lerp(el, t, 0.88), lerp(el, t, 0.94), 0.032, 0.031)} fill="#1b1b1b" opacity={0.9} />
            <circle cx={add(lerp(el, t, 0.91), mul(perp(fore), -0.012))[0]} cy={add(lerp(el, t, 0.91), mul(perp(fore), -0.012))[1]} r={0.013} fill="#2b3139" stroke="#c9ced3" strokeWidth={0.8} {...SOFT} />
          </g>
        )}
        <g className={`ps-glove${cls ? ` ${cls}` : ""}`}>
          <Glove wrist={t} dir={press ? f : sub(t, el)} colour={glove} hand={hand} curl={press ? (hand === "right" ? 0.7 : 0.15) : undefined} splay={press ? (hand === "right" ? 0.45 : 0.8) : undefined} />
        </g>
      </g>
    );
  };
  const back = smooth([axis(-0.04, -0.21), axis(-0.04, 0.21), axis(-0.16, 0.16), axis(-0.22, 0.1), axis(-0.22, -0.1), axis(-0.16, -0.16)], 0.45);
  const slope = Math.abs(f[0]) > Math.abs(f[1]) ? (f[0] > 0 ? "ps-slope-r" : "ps-slope-l") : f[1] > 0 ? "ps-slope-d" : "ps-slope-u";
  const slide = (sh: Pt, side: 1 | -1) => {
    const c = add(sh, mul(s, side * 0.01));
    return (
      <g key={side} transform={`rotate(${n2(ang + 90)} ${n2(c[0])} ${n2(c[1])})`}>
        <rect x={c[0] - 0.045} y={c[1] - 0.019} width={0.09} height={0.038} rx={0.006} fill={darken(wear.uniform, 0.35)} {...lineSoft} />
        <rect x={c[0] - 0.045} y={c[1] - 0.019} width={0.09} height={0.038} rx={0.006} fill="url(#ps-round)" opacity={0.4} />
        {wear.role && <text x={c[0]} y={c[1] + 0.008} textAnchor="middle" fontSize={0.021} fontWeight={700} fontFamily="Arial, sans-serif" fill="#f4f6f8" textLength={Math.min(0.078, wear.role.length * 0.0125)} lengthAdjust="spacingAndGlyphs" transform={`rotate(${side === -1 ? 180 : 0} ${n2(c[0])} ${n2(c[1])})`}>{wear.role}</text>}
      </g>
    );
  };
  const radioAt = add(add(shL, mul(f, 0.06)), mul(s, 0.07));
  const yoke = capsule(shL, shR, 0.1, 0.1);
  const bodyClip = `ps-crew-body-${Math.round(at[0] * 1000)}-${Math.round(at[1] * 1000)}-${Math.round(ang)}`;
  // The back and the shoulders as forms, soft-edged: the spine's groove
  // with a shoulder blade either side, the belt's shadow, the far end of
  // the back falling away, and each shoulder a dome lit from the upper
  // left of the screen.
  const bodyShade = (
    <g>
      <clipPath id={bodyClip}><path d={back} /><path d={yoke} /></clipPath>
      <g clipPath={`url(#${bodyClip})`}>
        <g filter="url(#ps-blur-sm)">
          <path d={`M${P(axis(-0.1, 0))} L${P(axis(-0.21, 0))}`} stroke="#000" strokeWidth={0.018} strokeOpacity={0.24} fill="none" strokeLinecap="round" />
          {[-1, 1].map((side) => { const c = axis(-0.13, side * 0.085); return <ellipse key={side} cx={c[0]} cy={c[1]} rx={0.04} ry={0.028} fill="#fff" opacity={0.1} transform={`rotate(${n2(ang)} ${n2(c[0])} ${n2(c[1])})`} />; })}
          <path d={`M${P(axis(-0.172, -0.16))} L${P(axis(-0.172, 0.16))}`} stroke="#000" strokeWidth={0.016} strokeOpacity={0.2} fill="none" />
          <path d={`M${P(axis(-0.215, -0.1))} L${P(axis(-0.215, 0.1))}`} stroke="#000" strokeWidth={0.03} strokeOpacity={0.2} fill="none" />
          {[shL, shR].map((sh, i) => <g key={i}><ellipse cx={sh[0] - 0.025} cy={sh[1] - 0.025} rx={0.05} ry={0.04} fill="#fff" opacity={0.14} /><ellipse cx={sh[0] + 0.03} cy={sh[1] + 0.03} rx={0.055} ry={0.04} fill="#000" opacity={0.16} /></g>)}
        </g>
      </g>
    </g>
  );
  // The figure's shadow on the floor: back, shoulders, head and both arms as
  // one soft dark shape thrown down and to the right.
  const armShadow = (sh: Pt, target: Pt | undefined, bend: 1 | -1) => {
    const t = target ?? axis(0.24, bend * 0.26);
    const el = elbow(sh, t, 0.2, 0.19, bend);
    const dir = press ? f : unit(sub(t, el));
    return `${limbPath(sh, el, t, 0.052, 0.04, 0.03)} ${capsule(t, add(t, mul(dir, 0.16)), 0.036, 0.03)}`;
  };
  return (
    <g className="ps-crew" style={style}>
      <ellipse cx={axis(-0.1, 0.08)[0] + 0.05} cy={axis(-0.1, 0.08)[1] + 0.07} rx={0.3} ry={0.24} fill="url(#ps-shadow)" opacity={0.6} />
      <g filter="url(#ps-soft-shadow)" opacity={0.42} transform="translate(0.03 0.036)" fill="#000">
        <path d={back} />
        <path d={capsule(shL, shR, 0.1, 0.1)} />
        <circle cx={head[0]} cy={head[1]} r={0.125} />
        <path d={armShadow(shL, wristL, -1)} />
        <path d={armShadow(shR, wristR, 1)} />
      </g>
      {kneeling && [-1, 1].map((side) => {
        const heel = axis(-0.26, side * 0.12);
        const toe = axis(-0.4, side * 0.135);
        const dir = unit(sub(toe, heel));
        return (
          <g key={side} opacity={0.92}>
            <path d={capsule(heel, toe, 0.045, 0.04)} fill="#121518" {...edge("#3a3f46", 0.5, 0.7, 0.8)} />
            <path d={capsule(heel, toe, 0.045, 0.04)} fill="url(#ps-round)" opacity={0.5} />
            <path d={capsule(lerp(heel, toe, 0.25), lerp(heel, toe, 0.85), 0.028, 0.025)} fill="#30353b" />
            {/* The tread of the sole and the heel block. */}
            {[0.3, 0.42, 0.54, 0.66, 0.78].map((u) => { const c = lerp(heel, toe, u); const n = perp(dir); return <path key={u} d={`M${P(add(c, mul(n, 0.024)))} L${P(add(c, mul(n, -0.024)))}`} stroke="#121518" strokeWidth={0.8} fill="none" {...SOFT} />; })}
            <path d={`M${P(add(lerp(heel, toe, 0.18), mul(perp(dir), 0.04)))} L${P(add(lerp(heel, toe, 0.18), mul(perp(dir), -0.04)))}`} stroke="#4a5057" strokeWidth={1} fill="none" {...SOFT} />
          </g>
        );
      })}
      <path d={back} fill={jacket ?? wear.uniform} {...edge(jacket ?? wear.uniform, 0.55, 0.6, 0.8)} />
      {/* The seam down the back, the belt with its pouch where the back slopes away. */}
      <path d={`M${P(axis(-0.05, 0))} L${P(axis(-0.2, 0))}`} stroke={darken(jacket ?? wear.uniform, 0.3)} strokeWidth={0.7} strokeOpacity={0.45} fill="none" {...SOFT} />
      {!jacket && <path d={capsule(axis(-0.185, -0.13), axis(-0.185, 0.13), 0.012, 0.012)} fill="#2b241f" {...lineSoft} />}
      {!jacket && <rect x={axis(-0.185, 0.09)[0] - 0.02} y={axis(-0.185, 0.09)[1] - 0.016} width={0.04} height={0.032} rx={0.004} fill="#15191c" {...lineSoft} transform={`rotate(${n2(ang + 90)} ${P(axis(-0.185, 0.09))})`} />}
      {jacket && <path d={`M${P(axis(-0.12, -0.19))} L${P(axis(-0.12, 0.19))}`} stroke="#8a9399" strokeWidth={0.046} />}
      {jacket && <path d={`M${P(axis(-0.12, -0.19))} L${P(axis(-0.12, 0.19))}`} stroke={band} strokeWidth={0.03} />}
      {wear.hat === "fire_helmet" && <path d={`M${P(axis(-0.12, -0.19))} L${P(axis(-0.12, 0.19))}`} stroke="#d8cf5a" strokeWidth={0.035} />}
      <path d={back} fill={`url(#${slope})`} />
      <path d={back} fill="url(#ps-grain)" />
      {/* Shoulders: the jacket's yoke, or the shirt; the collar standing behind the head. */}
      <path d={yoke} fill={wear.yoke} {...edge(wear.yoke, 0.55, 0.6, 0.8)} />
      <path d={yoke} fill="url(#ps-round-v)" opacity={0.4} />
      <path d={yoke} fill="url(#ps-grain)" />
      {bodyShade}
      {/* The head's shadow on the shoulders. */}
      <circle cx={head[0] + 0.02} cy={head[1] + 0.03} r={0.13} fill="#000" opacity={0.3} filter="url(#ps-blur-sm)" />
      <path d={capsule(axis(0.0, -0.085), axis(0.0, 0.085), 0.016, 0.016)} fill={darken(wear.yoke, 0.2)} {...lineSoft} />
      <path d={capsule(axis(-0.004, -0.08), axis(-0.004, 0.08), 0.008, 0.008)} fill={darken(wear.yoke, 0.35)} opacity={0.8} />
      {jacket && <path d={`M${P(axis(-0.02, -0.11))} L${P(axis(-0.02, 0.11))}`} stroke={band} strokeWidth={0.035} opacity={0.9} />}
      {wear.hat !== "fire_helmet" && slide(shL, -1)}
      {wear.hat !== "fire_helmet" && slide(shR, 1)}
      {/* The radio, clipped to the strap by the left shoulder, aerial back. */}
      <g transform={`rotate(${n2(ang)} ${n2(radioAt[0])} ${n2(radioAt[1])})`}>
        <path d={`M${n2(radioAt[0] - 0.02)} ${n2(radioAt[1])} l-0.07 0`} stroke="#15191c" strokeWidth={0.008} />
        <rect x={radioAt[0] - 0.02} y={radioAt[1] - 0.018} width={0.045} height={0.036} rx={0.005} fill="#15191c" {...lineSoft} />
        <rect x={radioAt[0] - 0.012} y={radioAt[1] - 0.01} width={0.02} height={0.012} rx={0.002} fill="#4cb3ff" opacity={0.8} />
      </g>
      <g className={armsClass}>
        {arm(shL, wristL, -1, "left")}
        {arm(shR, wristR, 1, "right")}
      </g>
      <g className="ps-crew-head">
        <HeadTop c={head} f={f} wear={wear} r={0.125} />
      </g>
      {children}
    </g>
  );
}

/** Uniform and headgear by service and clinical scope. */
export function crewWearOf(service: "Fire" | "Ambulance" | "Police" | undefined, scope: string | undefined, seed: number, opts: { jacket?: boolean; role?: string } = {}): CrewWear {
  const skins = ["#f1c9a5", "#e8b894", "#d9a079", "#b67a4e", "#8c5a36"];
  const hairs = ["#2b1d14", "#4a3220", "#1b1b1b", "#8a5a2b", "#6b4a2a"];
  const skin = skins[(seed >>> 2) % skins.length];
  const hair = hairs[(seed >>> 5) % hairs.length];
  const female = (seed >>> 7) % 3 === 0;
  const hairStyle: CrewWear["hairStyle"] = female ? ((seed >>> 9) % 2 ? "bob" : "long") : (seed >>> 11) % 7 === 0 ? "bald" : "short";
  const jacket = !!opts.jacket;
  const role = (opts.role ?? "").toUpperCase();
  const common = { skin, hair, hairStyle, jacket, role };
  // The ambulance service's bottle green; the jacket's yellow kept quiet.
  const green = "#245239", greenDark = "#1b3d2b", hiVis = "#cfc63d";
  if (service === "Fire") return { ...common, uniform: "#2b3139", trousers: "#2b3139", hiVis: null, jacket: false, yoke: "#2b3139", sleeves: "long", role: "", hat: "fire_helmet" };
  if (service === "Police") return { ...common, uniform: "#15202b", trousers: "#15202b", hiVis, yoke: jacket ? hiVis : "#15202b", sleeves: "long", hat: "police_cap" };
  if (scope === "hems") return { ...common, uniform: "#d9641c", trousers: "#d9641c", hiVis: null, jacket: false, yoke: "#d9641c", sleeves: "long", hat: "none" };
  if (scope === "basics") return { ...common, uniform: green, trousers: greenDark, hiVis: "#7fb86a", yoke: jacket ? "#7fb86a" : green, sleeves: "short", hat: "none" };
  return { ...common, uniform: green, trousers: greenDark, hiVis, yoke: green, sleeves: "short", hat: "none" };
}
