"use client";

// KIT ON THE PATIENT, FROM ABOVE. Everything the crew put on someone,
// where it really goes: pads below the right collarbone and on the left
// side, electrodes with their colours, the cuff on the upper arm, the
// probe on a finger, a cannula on the back of the hand with its line to a
// bag, a mask with its elastic, the i-gel and the bag on it, a collar, a
// binder across the hips, a tourniquet high on the thigh, a splint, a
// blanket, the LUCAS. Plus the kit on the ground: the monitor the wires
// run to, the bag, the oxygen. All in metres in the figure's frame.

import type { ReactNode } from "react";
import type { PatientLook } from "@/lib/sim/patient_look";
import type { BodyRegion } from "@/lib/sim/body_regions";
import { type Pt, type Rig, add, sub, mul, unit, perp, lerp, len, deg, P, capsule, anchors, line, lineSoft, smooth, smoothOpen, rot } from "./plan-figure";

const SOFT = { vectorEffect: "non-scaling-stroke" as const };
const n2 = (v: number) => (Math.round(v * 1000) / 1000).toString();

/** A rounded rectangle centred at c, `along` its long axis. */
function slab(c: Pt, along: Pt, length: number, width: number, props: Record<string, unknown>, rx = width * 0.3): ReactNode {
  const ang = deg(unit(along));
  return <rect x={c[0] - length / 2} y={c[1] - width / 2} width={length} height={width} rx={rx} transform={`rotate(${n2(ang)} ${P(c)})`} {...props} />;
}

/** Where a wire from a to b bows out to, the way a cable lies. */
function bow(a: Pt, b: Pt, sag: number): Pt {
  return add(lerp(a, b, 0.5), mul(perp(unit(sub(b, a))), sag));
}

/** How close a cable may run to a hand. */
const CLEAR = 0.085;

/** A cable's path: a lazy curve through its waypoints, as a cable lies,
 *  steering round everything in `avoid` (hands, mostly) by `clearance`.
 *  The ends stay where they are attached. */
function route(pts: Pt[], avoid: Pt[], clearance = CLEAR): string {
  const dense: Pt[] = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const n = Math.max(1, Math.round(len(sub(b, a)) / 0.05));
    for (let j = 1; j <= n; j++) dense.push(lerp(a, b, j / n));
  }
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 1; i < dense.length - 1; i++) {
      for (const o of avoid) {
        const v = sub(dense[i], o);
        const d = len(v);
        if (d < clearance) dense[i] = add(o, mul(d < 1e-6 ? perp(unit(sub(dense[i + 1], dense[i - 1]))) : unit(v), clearance));
      }
    }
  }
  return smoothOpen(dense, 0.5);
}

/** A cable drawn at its real width (the class sets it, in metres), with
 *  the shadow it throws on whatever it lies across. */
function Cable({ d, className, colour }: { d: string; className: string; colour?: string }) {
  return (
    <g>
      <path d={d} className={`${className} ps-cable-shade`} transform="translate(0.003 0.004)" />
      <path d={d} className={className} stroke={colour} />
    </g>
  );
}

export type KitPlacement = {
  /** Where the monitor's cable port is, in the figure's metres. */
  monitorPort?: Pt;
  /** Where the oxygen supply is (cylinder regulator). */
  o2At?: Pt;
  /** Where the drip bag hangs — a hand holding it up, or a stand. Absent: it lies on the ground by the arm. */
  ivAt?: Pt;
  /** The hand squeezing the bag: the bag is drawn from the airway towards it. */
  bvmHand?: Pt;
  /** Hands (the crew's) that cables must run round, not under. */
  avoid?: Pt[];
};

export type KitLayers = { under: ReactNode; onChest: ReactNode; over: ReactNode; lines: ReactNode };

export function kitLayers(look: PatientLook, r: Rig, place: KitPlacement): KitLayers {
  const k = r.k;
  const A = anchors(r);
  const kit = look.kit;
  const port = place.monitorPort ?? ([-0.95, 0.9] as Pt);
  const o2 = place.o2At ?? ([0.7, 0.15] as Pt);
  const hurt = new Set<BodyRegion>(look.hurt);
  const regionAt = (reg: BodyRegion): Pt | null => {
    switch (reg) {
      case "head": return [r.headW * 0.3, r.headL * 0.22];
      case "neck": return A.neck;
      case "chest": return [-r.chestW * 0.35, r.chestY];
      case "abdomen": return A.abdomen;
      case "pelvis": return [r.hipW * 0.5, r.hipY];
      case "left_arm": return A.leftForearm;
      case "right_arm": return A.rightForearm;
      case "left_leg": return A.leftThigh;
      case "right_leg": return A.rightThigh;
      default: return null;
    }
  };
  const hurtPts = look.hurt.map(regionAt).filter((p): p is Pt => !!p);
  const dressingAt = hurtPts[0] ?? ([-r.chestW * 0.35, r.chestY] as Pt);
  // Leg kit goes on the hurt leg; the left when nothing says.
  const legR = hurt.has("right_leg") && !hurt.has("left_leg");
  const legA = legR ? r.legR.a : r.legL.a, legB = legR ? r.legR.b : r.legL.b, legC = legR ? r.legR.c : r.legL.c;
  const thighA = legR ? A.rightThigh : A.leftThigh;
  const legSide = legR ? -1 : 1;
  // Where the wires gather before the one cable runs to the monitor: on
  // the ground beyond the arm, clear of the hand.
  const junction: Pt = [port[0] < 0 ? -(r.chestW + 0.24) : r.chestW + 0.24, r.hipY + 0.16 * k];
  // Cables steer round hands: the crew's, and the patient's own (the back
  // of the hand and the fingertips), except the hand a cable is attached to.
  const handR: Pt[] = [A.rightHandBack, A.rightFinger], handL: Pt[] = [A.leftHandBack, A.leftFinger];
  const avoid: Pt[] = [...(place.avoid ?? []), ...handR, ...handL];
  const avoidButL: Pt[] = [...(place.avoid ?? []), ...handR];
  const avoidButR: Pt[] = [...(place.avoid ?? []), ...handL];
  // ECG electrodes where a torso lead set puts them (the positions the
  // road uses): the limb leads under each collarbone and low on each side
  // of the belly, the six chest leads of a 12-lead from the right of the
  // breastbone at the fourth space round the left chest to the side at
  // the fifth. Coloured as the UK's monitors are wired: R red, L yellow,
  // F green, N black; C1 to C6 red, yellow, green, brown, black, violet.
  // With pads on, the limb leads go out to the shoulders to leave the
  // sternal pad its room, and the apex pad sits below the chest leads.
  const bk = k * r.bulk;
  const ra: Pt = kit.pads ? [-r.shoulderW * 0.84, r.shoulderY + 0.015 * k] : [-r.shoulderW * 0.7, r.shoulderY + 0.035 * k];
  type Lead = { key: string; at: Pt; colour: string; to: Pt; sag: number };
  const limb: Lead[] = [
    { key: "ra", at: ra, colour: "#d7322e", to: junction, sag: 0.08 * k },
    { key: "la", at: [-ra[0], ra[1]], colour: "#f2c230", to: junction, sag: -0.05 * k },
    { key: "ll", at: [r.waistW * 0.82, r.waistY + 0.06 * k], colour: "#35a24a", to: junction, sag: 0.02 * k },
    { key: "rl", at: [-r.waistW * 0.82, r.waistY + 0.06 * k], colour: "#262b30", to: junction, sag: 0.06 * k },
  ];
  // The chest leads gather at a yoke by the left ribs before the trunk cable.
  const vYoke: Pt = [r.waistW * 0.35, r.waistY + 0.02 * k];
  const v4y = r.chestY + 0.065 * k, v2y = r.chestY + 0.015 * k;
  const chest: Lead[] = kit.ecg12 ? [
    { key: "v1", at: [-0.032 * bk, v2y], colour: "#d7322e", to: vYoke, sag: 0.05 * k },
    { key: "v2", at: [0.032 * bk, v2y], colour: "#f2c230", to: vYoke, sag: 0.03 * k },
    { key: "v3", at: [0.068 * bk, (v2y + v4y) / 2 + 0.004 * k], colour: "#35a24a", to: vYoke, sag: 0.015 * k },
    { key: "v4", at: [0.105 * bk, v4y], colour: "#8a5a2b", to: vYoke, sag: 0 },
    { key: "v5", at: [r.chestW * 0.76, v4y - 0.005 * k], colour: "#262b30", to: vYoke, sag: -0.015 * k },
    { key: "v6", at: [r.chestW * 0.97, v4y - 0.012 * k], colour: "#6f3fa0", to: vYoke, sag: -0.03 * k },
  ] : [];

  // --- Under the patient: a scoop or board, blood on the ground.
  const under = (
    <g>
      {kit.board && (
        <g>
          <rect x={-r.shoulderW * 1.2} y={-0.1 * k} width={r.shoulderW * 2.4} height={r.bottom + 0.2 * k} rx={0.12 * k} fill="#e8731f" {...line} />
          {[0.15, 0.5, 0.85].map((t) => (
            <g key={t}>
              <rect x={-r.shoulderW * 1.2 + 0.03 * k} y={(r.bottom + 0.2 * k) * t - 0.12 * k - 0.1 * k} width={0.06 * k} height={0.24 * k} rx={0.03 * k} fill="#1b2733" opacity={0.55} />
              <rect x={r.shoulderW * 1.2 - 0.09 * k} y={(r.bottom + 0.2 * k) * t - 0.12 * k - 0.1 * k} width={0.06 * k} height={0.24 * k} rx={0.03 * k} fill="#1b2733" opacity={0.55} />
            </g>
          ))}
          <rect x={-r.shoulderW * 1.2} y={-0.1 * k} width={r.shoulderW * 2.4} height={r.bottom + 0.2 * k} rx={0.12 * k} fill="url(#ps-round)" opacity={0.6} />
        </g>
      )}
      {look.bleeding && (
        <g className="ps-blood-pool">
          <ellipse cx={dressingAt[0] * 1.6 + (dressingAt[0] >= 0 ? 0.18 * k : -0.18 * k)} cy={dressingAt[1] + 0.08 * k} rx={(r.pose === "lying" ? 0.26 : 0.14) * k} ry={(r.pose === "lying" ? 0.17 : 0.09) * k} />
          {r.pose === "lying" && <ellipse cx={dressingAt[0] * 1.6 + (dressingAt[0] >= 0 ? 0.3 * k : -0.3 * k)} cy={dressingAt[1] + 0.2 * k} rx={0.12 * k} ry={0.08 * k} />}
        </g>
      )}
    </g>
  );

  // --- On the chest: moves with the breathing.
  const padR = A.rightUpperChest;
  const padL: Pt = kit.ecg12 ? [r.chestW * 0.8, r.chestY + 0.165 * k] : A.leftLateral;
  // A defibrillation pad: off-white, with the printed placement picture and its tail of cable.
  const pad = (c: Pt, along: Pt, key: string) => {
    const ang = deg(unit(along));
    const w = 0.15 * k, h = 0.105 * k;
    return (
      <g key={key} transform={`rotate(${n2(ang)} ${P(c)})`} filter="url(#pk-drop-sm)">
        <path d={`M${n2(c[0] - w / 2)} ${n2(c[1])} l${n2(-0.04 * k)} ${n2(0.01 * k)}`} stroke="#e9ecef" strokeWidth={0.012 * k} strokeLinecap="round" />
        <rect x={c[0] - w / 2} y={c[1] - h / 2} width={w} height={h} rx={0.02 * k} fill="#f4f3ee" stroke="#b5b9bd" strokeWidth={0.8} {...SW} />
        <rect x={c[0] - w / 2} y={c[1] - h / 2} width={w} height={h} rx={0.02 * k} fill="url(#pk-gloss)" />
        <circle cx={c[0] - 0.03 * k} cy={c[1] - 0.012 * k} r={0.011 * k} fill="none" stroke="#3a6fa8" strokeWidth={0.7} {...SW} />
        <path d={`M${n2(c[0] - 0.052 * k)} ${n2(c[1] + 0.028 * k)} q${n2(0.022 * k)} ${n2(-0.03 * k)} ${n2(0.044 * k)} 0`} fill="none" stroke="#3a6fa8" strokeWidth={0.7} {...SW} />
        <rect x={c[0] - 0.045 * k} y={c[1] + 0.004 * k} width={0.012 * k} height={0.008 * k} fill="#3a6fa8" />
        <rect x={c[0] - 0.022 * k} y={c[1] + 0.012 * k} width={0.012 * k} height={0.008 * k} fill="#3a6fa8" />
        <path d={`M${n2(c[0] + 0.01 * k)} ${n2(c[1] - 0.02 * k)} H${n2(c[0] + 0.06 * k)} M${n2(c[0] + 0.01 * k)} ${n2(c[1] - 0.008 * k)} H${n2(c[0] + 0.05 * k)} M${n2(c[0] + 0.01 * k)} ${n2(c[1] + 0.004 * k)} H${n2(c[0] + 0.056 * k)}`} stroke="#9aa0a6" strokeWidth={0.5} {...SW} />
      </g>
    );
  };
  // An ECG electrode: a foam disc with its stud, the coloured lead clip snapped on.
  const electrode = (c: Pt, colour: string, clipDeg: number, key: string) => (
    <g key={key}>
      <circle cx={c[0]} cy={c[1]} r={0.024 * k} fill="#f1efe6" stroke="#c4bfae" strokeWidth={0.7} {...SW} />
      <circle cx={c[0]} cy={c[1]} r={0.024 * k} fill="url(#pk-gloss)" />
      <circle cx={c[0]} cy={c[1]} r={0.006 * k} fill="#9aa0a6" stroke="#5f6468" strokeWidth={0.5} {...SW} />
      <g transform={`rotate(${clipDeg} ${P(c)})`}>
        <rect x={c[0] - 0.004 * k} y={c[1] - 0.009 * k} width={0.034 * k} height={0.018 * k} rx={0.005 * k} fill={colour} stroke="#1b2733" strokeWidth={0.5} strokeOpacity={0.6} {...SW} />
      </g>
    </g>
  );
  const onChest = (
    <g>
      {kit.pads && (
        <g>
          {pad(padR, [0.55, 1], "padR")}
          {pad(padL, [-0.4, 1], "padL")}
        </g>
      )}
      {kit.leads && (
        <g>
          {[...limb, ...chest].map((e) => electrode(e.at, e.colour, deg(sub(bow(e.at, e.to, e.sag), e.at)), e.key))}
        </g>
      )}
      {kit.dressing && (
        <g>
          <rect x={dressingAt[0] - 0.07 * k} y={dressingAt[1] - 0.055 * k} width={0.14 * k} height={0.11 * k} rx={0.012 * k} fill="url(#pk-gauze)" stroke="#c9c4b4" strokeWidth={0.7} {...SW} />
          <ellipse cx={dressingAt[0] + 0.01 * k} cy={dressingAt[1] + 0.005 * k} rx={0.035 * k} ry={0.025 * k} fill="#a82a2a" opacity={0.55} />
          {[-1, 1].map((s) => <rect key={s} x={dressingAt[0] + s * 0.07 * k - 0.012 * k} y={dressingAt[1] - 0.075 * k} width={0.024 * k} height={0.15 * k} rx={0.004 * k} fill="#f3e4c6" opacity={0.9} />)}
        </g>
      )}
      {kit.pelvicBinder && (
        <g filter="url(#pk-drop-sm)">
          <rect x={-r.hipW * 1.35} y={A.hips[1] - 0.1 * k} width={r.hipW * 2.7} height={0.2 * k} rx={0.03 * k} fill="#e8731f" stroke="#7a3a0c" strokeWidth={0.9} {...SW} />
          <rect x={-r.hipW * 1.35} y={A.hips[1] - 0.1 * k} width={r.hipW * 2.7} height={0.2 * k} rx={0.03 * k} fill="url(#pk-gloss)" />
          <rect x={-r.hipW * 1.3} y={A.hips[1] - 0.03 * k} width={r.hipW * 2.6} height={0.06 * k} fill="#1b1b1b" opacity={0.9} />
          <rect x={-0.06 * k} y={A.hips[1] - 0.045 * k} width={0.12 * k} height={0.09 * k} rx={0.012 * k} fill="#2b3139" stroke="#0e1114" strokeWidth={0.8} {...SW} />
          <rect x={-0.04 * k} y={A.hips[1] - 0.02 * k} width={0.08 * k} height={0.04 * k} rx={0.006 * k} fill="#5a6470" />
          <text x={0} y={A.hips[1] + 0.085 * k} textAnchor="middle" fontSize={0.02 * k} fontWeight={800} fill="#fff" fontFamily="Arial, sans-serif" opacity={0.85}>PELVIC SLING</text>
        </g>
      )}
      {kit.lucas && (
        <g className="ps-lucas" filter="url(#pk-drop)">
          {[-1, 1].map((side) => (
            <g key={side}>
              <path d={`M${n2(side * (r.chestW + 0.1 * k))} ${n2(r.chestY + 0.16 * k)} V${n2(r.chestY - 0.12 * k)} Q${n2(side * (r.chestW + 0.1 * k))} ${n2(r.chestY - 0.17 * k)} ${n2(side * (r.chestW + 0.05 * k))} ${n2(r.chestY - 0.17 * k)} H${n2(side * 0.12 * k)}`} fill="none" stroke="#f0c419" strokeWidth={0.065 * k} strokeLinecap="round" strokeLinejoin="round" />
              <path d={`M${n2(side * (r.chestW + 0.1 * k))} ${n2(r.chestY + 0.16 * k)} V${n2(r.chestY - 0.12 * k)}`} fill="none" stroke="#1b1b1b" strokeWidth={0.018 * k} opacity={0.5} />
              <rect x={side * (r.chestW + 0.1 * k) - 0.04 * k} y={r.chestY + 0.12 * k} width={0.08 * k} height={0.06 * k} rx={0.01 * k} fill="#1b1b1b" stroke="#000" strokeWidth={0.6} {...SW} />
            </g>
          ))}
          <rect x={-0.13 * k} y={r.chestY - 0.19 * k} width={0.26 * k} height={0.24 * k} rx={0.05 * k} fill="#f0c419" stroke="#6b5a0a" strokeWidth={0.9} {...SW} />
          <rect x={-0.13 * k} y={r.chestY - 0.19 * k} width={0.26 * k} height={0.24 * k} rx={0.05 * k} fill="url(#pk-gloss)" />
          <rect x={-0.08 * k} y={r.chestY - 0.15 * k} width={0.16 * k} height={0.065 * k} rx={0.01 * k} fill="#2b3139" stroke="#0e1114" strokeWidth={0.7} {...SW} />
          <circle cx={-0.05 * k} cy={r.chestY - 0.118 * k} r={0.013 * k} fill="#3ad17f" />
          <circle cx={-0.015 * k} cy={r.chestY - 0.118 * k} r={0.013 * k} fill="#f3d35a" />
          <circle cx={0.02 * k} cy={r.chestY - 0.118 * k} r={0.013 * k} fill="#e03a3a" />
          <circle cx={0.055 * k} cy={r.chestY - 0.118 * k} r={0.01 * k} fill="#9aa0a6" />
          <text x={0} y={r.chestY + 0.035 * k} textAnchor="middle" fontSize={0.022 * k} fontWeight={800} fill="#1b1b1b" fontFamily="Arial, sans-serif" opacity={0.8}>CPR</text>
          <circle cx={A.sternum[0]} cy={A.sternum[1] + 0.02 * k} r={0.05 * k} className="ps-plunger cpr" fill="#1b1b1b" />
          <circle cx={A.sternum[0]} cy={A.sternum[1] + 0.02 * k} r={0.03 * k} fill="#3a4046" />
        </g>
      )}
      {hurtPts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={0.08 * k} className="ps-hurt" />)}
    </g>
  );

  // --- Over everything on the figure.
  const cuffArm = A.leftUpperArm;
  const cuffAlong = sub(r.armL.b, r.armL.a);
  const ivHand = A.rightHandBack;
  const ivAlong = sub(r.armR.d, r.armR.c);
  const mouth = A.mouth;
  // A face mask from above: a teardrop over the nose and mouth, the soft
  // cushion round its rim, the clear dome with its highlight and the 22 mm
  // connector at the top of the dome, over the bridge of the nose.
  const hw = r.headW, hl = r.headL;
  const maskPath = `M0 ${n2(hl * 0.52)} C${n2(hw * 0.2)} ${n2(hl * 0.52)} ${n2(hw * 0.36)} ${n2(hl * 0.68)} ${n2(hw * 0.34)} ${n2(hl * 0.83)} C${n2(hw * 0.33)} ${n2(hl * 0.96)} ${n2(hw * 0.16)} ${n2(hl * 1.01)} 0 ${n2(hl * 1.01)} C${n2(-hw * 0.16)} ${n2(hl * 1.01)} ${n2(-hw * 0.33)} ${n2(hl * 0.96)} ${n2(-hw * 0.34)} ${n2(hl * 0.83)} C${n2(-hw * 0.36)} ${n2(hl * 0.68)} ${n2(-hw * 0.2)} ${n2(hl * 0.52)} 0 ${n2(hl * 0.52)} Z`;
  const maskTop: Pt = [0, hl * 0.7];
  const mask = (kind: "bvm" | "simple" | "nrb") => (
    <g>
      <path d={maskPath} fill="url(#pk-clear)" opacity={0.42} />
      <path d={maskPath} fill="none" stroke="rgba(238, 244, 250, 0.92)" strokeWidth={0.02 * k} />
      <path d={maskPath} fill="none" stroke="#8fa8bc" strokeWidth={0.8} {...SW} />
      <path d={maskPath} fill="none" stroke="#9fb4c8" strokeWidth={0.5} opacity={0.8} {...SW} transform={`translate(0 ${n2(hl * 0.78)}) scale(0.86) translate(0 ${n2(-hl * 0.78)})`} />
      <path d={`M${n2(-hw * 0.2)} ${n2(hl * 0.82)} Q${n2(-hw * 0.18)} ${n2(hl * 0.62)} ${n2(-hw * 0.05)} ${n2(hl * 0.57)}`} stroke="#ffffff" strokeWidth={1.4} fill="none" opacity={0.75} {...SOFT} />
      {kind === "simple" && [-1, 1].map((sd) => <g key={sd}>{[0.84, 0.9].map((t) => <circle key={t} cx={sd * hw * 0.22} cy={hl * t} r={0.005 * k} fill="#3b434b" opacity={0.6} />)}</g>)}
      {kind === "nrb" && [-1, 1].map((sd) => <circle key={sd} cx={sd * hw * 0.2} cy={hl * 0.86} r={0.012 * k} fill="#dfe8ef" stroke="#8a9399" strokeWidth={0.6} {...SW} />)}
      <circle cx={0} cy={maskTop[1]} r={0.015 * k} fill="#e3e9ee" stroke="#6f777c" strokeWidth={0.8} {...SW} />
      <circle cx={0} cy={maskTop[1]} r={0.009 * k} fill={kind === "bvm" ? "#9aa0a6" : "#c9ced3"} stroke="#6f777c" strokeWidth={0.5} {...SW} />
    </g>
  );
  // The bag-valve-mask laid out along a line from the valve to the hand
  // that squeezes the bag: the patient valve, the self-inflating bag, the
  // inlet valve with its oxygen nipple, and the reservoir flopping off it.
  const bvm = (() => {
    const valve: Pt = kit.airway === "none" ? maskTop : [0, mouth[1] - 0.012 * k];
    const bagAt = place.bvmHand ?? add(valve, mul(unit([-0.62, -0.78]), 0.19 * k));
    const u = unit(sub(bagAt, valve)), v = perp(u);
    const at = (a: number, c = 0): Pt => add(add(valve, mul(u, a * k)), mul(v, c * k));
    const off = kit.capno ? 0.04 : 0;
    const bagStart = off + 0.078, bagLen = 0.22, bagEnd = bagStart + bagLen, bagW = 0.062;
    const N = 12;
    const edge = (sgn: number, i: number): Pt => { const t = i / N; return at(bagStart + bagLen * t, sgn * (bagW * Math.pow(Math.sin(Math.PI * t), 0.5) + 0.014)); };
    const pts: Pt[] = [];
    for (let i = 0; i <= N; i++) pts.push(edge(1, i));
    for (let i = N; i >= 0; i--) pts.push(edge(-1, i));
    const u2 = rot(u, 0.22 * (u[0] < 0 ? 1 : -1)), v2 = perp(u2);
    const resBase = at(bagEnd + 0.034);
    const resAt = (a: number, c = 0): Pt => add(add(resBase, mul(u2, a * k)), mul(v2, c * k));
    const rp: Pt[] = [];
    for (let i = 0; i <= N; i++) { const t = i / N; rp.push(resAt(0.17 * t, 0.012 + 0.03 * Math.pow(Math.sin(Math.PI * t), 0.7))); }
    for (let i = N; i >= 0; i--) { const t = i / N; rp.push(resAt(0.17 * t, -(0.012 + 0.03 * Math.pow(Math.sin(Math.PI * t), 0.7)))); }
    return { valve, u, v, at, off, bagStart, bagLen, bagEnd, bag: smooth(pts, 0.35), res: smooth(rp, 0.35), resAt };
  })();
  const o2Line = (from: Pt) => <Cable d={route([from, add(from, [0.2 * k, -0.04 * k]), add(o2, [-0.16 * k, 0.12 * k]), o2], avoid)} className="ps-tube o2" />;
  const maskElastic = (
    <path d={`M${n2(-r.headW * 0.3)} ${n2(r.headL * 0.72)} Q${n2(-r.headW * 0.56)} ${n2(r.headL * 0.6)} ${n2(-r.headW * 0.5)} ${n2(r.headL * 0.45)} M${n2(r.headW * 0.3)} ${n2(r.headL * 0.72)} Q${n2(r.headW * 0.56)} ${n2(r.headL * 0.6)} ${n2(r.headW * 0.5)} ${n2(r.headL * 0.45)}`} stroke="#e6eef5" strokeWidth={1} fill="none" {...SOFT} />
  );
  const over = (
    <g>
      {kit.collar && (
        <g filter="url(#pk-drop-sm)">
          <rect x={-r.neckW * 2.0} y={A.neck[1] - 0.055 * k} width={r.neckW * 4.0} height={0.12 * k} rx={0.035 * k} fill="#e3e6e9" stroke="#7d868d" strokeWidth={0.9} {...SW} />
          <rect x={-r.neckW * 2.0} y={A.neck[1] - 0.055 * k} width={r.neckW * 4.0} height={0.12 * k} rx={0.035 * k} fill="url(#pk-gloss)" />
          <path d={`M${n2(-r.neckW * 0.95)} ${n2(A.neck[1] - 0.05 * k)} Q0 ${n2(r.headL * 0.95)} ${n2(r.neckW * 0.95)} ${n2(A.neck[1] - 0.05 * k)}`} fill="#d5d9dd" stroke="#7d868d" strokeWidth={0.8} {...SW} />
          <rect x={-r.neckW * 1.9} y={A.neck[1] + 0.02 * k} width={r.neckW * 3.8} height={0.018 * k} fill="#2f8fd6" opacity={0.9} />
          <circle cx={0} cy={A.neck[1] + 0.0} r={0.018 * k} fill="#c9ced3" stroke="#7d868d" strokeWidth={0.7} {...SW} />
          <rect x={r.neckW * 1.3} y={A.neck[1] - 0.045 * k} width={r.neckW * 0.6} height={0.1 * k} rx={0.006 * k} fill="#9aa0a6" opacity={0.8} />
        </g>
      )}
      {kit.cuff && (
        <g filter="url(#pk-drop-sm)">
          {slab(cuffArm, cuffAlong, 0.15 * k, r.armW[0] * 2.9, { fill: "#1f3a5f", stroke: "#0e1a2b", strokeWidth: 0.8, ...SW }, 0.015 * k)}
          {slab(cuffArm, cuffAlong, 0.15 * k, r.armW[0] * 2.9, { fill: "url(#pk-round)", opacity: 0.6 }, 0.015 * k)}
          {slab(add(cuffArm, mul(unit(cuffAlong), 0.045 * k)), cuffAlong, 0.03 * k, r.armW[0] * 2.9, { fill: "#4a6fa5", opacity: 0.6 }, 0.004 * k)}
          {slab(add(cuffArm, mul(unit(cuffAlong), -0.03 * k)), cuffAlong, 0.05 * k, r.armW[0] * 1.3, { fill: "#f4f6f8", stroke: "#c9ced3", strokeWidth: 0.5, ...SW }, 0.004 * k)}
        </g>
      )}
      {kit.probe && (
        <g>
          <rect x={A.leftFinger[0] - 0.02 * k} y={A.leftFinger[1] - 0.045 * k} width={0.04 * k} height={0.07 * k} rx={0.012 * k} fill="#3b4a5a" stroke="#1b2733" strokeWidth={0.6} {...SW} />
          <rect x={A.leftFinger[0] - 0.02 * k} y={A.leftFinger[1] - 0.045 * k} width={0.04 * k} height={0.07 * k} rx={0.012 * k} fill="url(#pk-gloss)" />
          <rect x={A.leftFinger[0] - 0.012 * k} y={A.leftFinger[1] - 0.038 * k} width={0.024 * k} height={0.02 * k} rx={0.004 * k} fill="#2f6fd6" opacity={0.9} />
          <circle cx={A.leftFinger[0]} cy={A.leftFinger[1] + 0.006 * k} r={0.008 * k} className="ps-probe" />
        </g>
      )}
      {kit.iv && (
        <g>
          {slab(ivHand, ivAlong, 0.09 * k, 0.07 * k, { fill: "#ffffff", opacity: 0.5, stroke: "#dfe8ef", strokeWidth: 0.5, ...SW }, 0.008 * k)}
          {slab(add(ivHand, mul(unit(ivAlong), -0.02 * k)), perp(ivAlong), 0.04 * k, 0.014 * k, { fill: "#e07aa0", stroke: "#1b2733", strokeWidth: 0.5, strokeOpacity: 0.6, ...SW }, 0.004 * k)}
          {slab(add(ivHand, mul(unit(ivAlong), -0.02 * k)), ivAlong, 0.03 * k, 0.012 * k, { fill: "#f4f6f8", stroke: "#9aa0a6", strokeWidth: 0.5, ...SW }, 0.004 * k)}
          <Cable d={route([ivHand, add(ivHand, [-0.12 * k, -0.08 * k]), add(place.ivAt ?? [ivHand[0] - 0.42 * k, ivHand[1] + 0.1 * k], [0.04 * k, 0.08 * k]), place.ivAt ?? [ivHand[0] - 0.42 * k, ivHand[1] + 0.1 * k]], avoidButR)} className="ps-line" />
          {!place.ivAt && <DripBag at={[ivHand[0] - 0.42 * k, ivHand[1] + 0.1 * k]} k={k} lying />}
        </g>
      )}
      {kit.splint && (
        <g filter="url(#pk-drop-sm)">
          {slab(lerp(thighA, legC, 0.55), sub(legC, thighA), len(sub(legC, thighA)) * 1.05, r.legW[0] * 2.7, { fill: "#8a98a8", stroke: "#3e4a56", strokeWidth: 0.9, ...SW }, 0.02 * k)}
          {slab(lerp(thighA, legC, 0.55), sub(legC, thighA), len(sub(legC, thighA)) * 1.0, r.legW[0] * 1.9, { fill: "#6f7d8c", stroke: "#3e4a56", strokeWidth: 0.5, strokeOpacity: 0.5, ...SW }, 0.02 * k)}
          {slab(lerp(thighA, legC, 0.55), sub(legC, thighA), len(sub(legC, thighA)) * 1.05, r.legW[0] * 2.7, { fill: "url(#pk-gloss)" }, 0.02 * k)}
          {[0.2, 0.5, 0.8].map((t) => <g key={t}>{slab(lerp(thighA, legC, t), perp(sub(legC, thighA)), r.legW[0] * 3.0, 0.04 * k, { fill: "#1b1b1b", opacity: 0.9 }, 0.004 * k)}{slab(add(lerp(thighA, legC, t), mul(unit(perp(sub(legC, thighA))), r.legW[0] * 1.2)), perp(sub(legC, thighA)), 0.03 * k, 0.03 * k, { fill: "#5a6470" }, 0.004 * k)}</g>)}
        </g>
      )}
      {kit.tourniquet && (
        <g>
          {slab(lerp(legA, legB, 0.25), sub(legB, legA), 0.065 * k, r.legW[0] * 2.5, { fill: "#1b1b1b", stroke: "#000", strokeWidth: 0.7, ...SW }, 0.006 * k)}
          {slab(lerp(legA, legB, 0.25), sub(legB, legA), 0.065 * k, r.legW[0] * 2.5, { fill: "url(#ps-round)", opacity: 0.5 }, 0.006 * k)}
          <path d={`M${P(add(lerp(legA, legB, 0.25), [legSide * r.legW[0] * 1.15, 0]))} l${n2(legSide * 0.15 * k)} ${n2(-0.03 * k)}`} stroke="#1b1b1b" strokeWidth={0.022 * k} strokeLinecap="round" />
          <path d={`M${P(add(lerp(legA, legB, 0.25), [legSide * r.legW[0] * 1.15, 0]))} l${n2(legSide * 0.15 * k)} ${n2(-0.03 * k)}`} stroke="#4a5057" strokeWidth={0.008 * k} strokeLinecap="round" />
          <rect x={lerp(legA, legB, 0.25)[0] + legSide * r.legW[0] * 1.1 - 0.012 * k} y={lerp(legA, legB, 0.25)[1] - 0.012 * k} width={0.024 * k} height={0.024 * k} rx={0.004 * k} fill="#5a6470" stroke="#000" strokeWidth={0.5} {...SW} />
          <rect x={lerp(legA, legB, 0.25)[0] - legSide * r.legW[0] - 0.02 * k - (legSide === 1 ? 0.03 * k : 0)} y={lerp(legA, legB, 0.25)[1] - 0.05 * k} width={0.05 * k} height={0.028 * k} fill="#ffffff" stroke="#9aa0a6" strokeWidth={0.5} {...SW} />
          <text x={lerp(legA, legB, 0.25)[0] - legSide * r.legW[0] + 0.005 * k - (legSide === 1 ? 0.03 * k : 0)} y={lerp(legA, legB, 0.25)[1] - 0.032 * k} textAnchor="middle" fontSize={0.012 * k} fontWeight={800} fill="#d13b3b" fontFamily="Arial, sans-serif">TIME</text>
        </g>
      )}
      {kit.blanket && (
        <g>
          <path d={`M${n2(-r.hipW * 1.55)} ${n2(r.chestY + 0.06 * k)} Q0 ${n2(r.chestY - 0.02 * k)} ${n2(r.hipW * 1.55)} ${n2(r.chestY + 0.06 * k)} L${n2(r.hipW * 1.6)} ${n2(r.bottom + 0.12 * k)} H${n2(-r.hipW * 1.6)} Z`} fill="url(#pk-cellular)" stroke="#7a2f14" strokeWidth={0.9} {...SW} />
          <path d={`M${n2(-r.hipW * 1.55)} ${n2(r.chestY + 0.06 * k)} Q0 ${n2(r.chestY - 0.02 * k)} ${n2(r.hipW * 1.55)} ${n2(r.chestY + 0.06 * k)} L${n2(r.hipW * 1.6)} ${n2(r.bottom + 0.12 * k)} H${n2(-r.hipW * 1.6)} Z`} fill="url(#ps-round)" opacity={0.35} />
          <path d={`M${n2(-r.hipW * 1.52)} ${n2(r.chestY + 0.085 * k)} Q0 ${n2(r.chestY + 0.005 * k)} ${n2(r.hipW * 1.52)} ${n2(r.chestY + 0.085 * k)}`} fill="none" stroke="#e8a27c" strokeWidth={0.03 * k} opacity={0.9} />
          <path d={`M${n2(-r.hipW * 1.4)} ${n2(r.chestY + 0.3 * k)} q${n2(r.hipW * 0.8)} ${n2(0.08 * k)} ${n2(r.hipW * 2.8)} 0`} stroke="#000" strokeWidth={1} opacity={0.18} fill="none" {...SOFT} />
          <path d={`M${n2(-r.hipW * 1.2)} ${n2(r.chestY + 0.7 * k)} q${n2(r.hipW * 0.9)} ${n2(-0.06 * k)} ${n2(r.hipW * 2.4)} 0`} stroke="#000" strokeWidth={1} opacity={0.18} fill="none" {...SOFT} />
        </g>
      )}
      {/* Airway and oxygen */}
      {kit.oxygen === "nasal" && (
        <g>
          <path d={`M${n2(-r.headW * 0.1)} ${n2(r.headL * 0.68)} H${n2(r.headW * 0.1)} M${n2(-r.headW * 0.05)} ${n2(r.headL * 0.68)} v${n2(-0.012 * k)} M${n2(r.headW * 0.05)} ${n2(r.headL * 0.68)} v${n2(-0.012 * k)}`} className="ps-tube" />
          <path d={`M${n2(-r.headW * 0.1)} ${n2(r.headL * 0.68)} Q${n2(-r.headW * 0.5)} ${n2(r.headL * 0.66)} ${n2(-r.headW * 0.52)} ${n2(r.headL * 0.5)} Q${n2(-r.headW * 0.5)} ${n2(r.headL * 0.9)} 0 ${n2(r.headL * 1.08)} M${n2(r.headW * 0.1)} ${n2(r.headL * 0.68)} Q${n2(r.headW * 0.5)} ${n2(r.headL * 0.66)} ${n2(r.headW * 0.52)} ${n2(r.headL * 0.5)} Q${n2(r.headW * 0.5)} ${n2(r.headL * 0.9)} 0 ${n2(r.headL * 1.08)}`} className="ps-tube" />
          {o2Line([0, r.headL * 1.08])}
        </g>
      )}
      {(kit.oxygen === "mask" || kit.oxygen === "nrb") && (
        <g>
          {maskElastic}
          {mask(kit.oxygen === "nrb" ? "nrb" : "simple")}
          {kit.oxygen === "nrb" && <ellipse cx={0} cy={hl * 1.14} rx={0.045 * k} ry={0.11 * k} fill="url(#pk-clear)" stroke="#8fb0c7" strokeWidth={0.8} className="ps-bag-nrb" {...SW} />}
          {o2Line([0, hl * (kit.oxygen === "nrb" ? 1.25 : 1.01)])}
        </g>
      )}
      {kit.airway === "igel" && (
        <g>
          <path d={`M${n2(-r.headW * 0.28)} ${n2(r.headL * 0.72)} Q${n2(-r.headW * 0.5)} ${n2(r.headL * 0.6)} ${n2(-r.headW * 0.5)} ${n2(r.headL * 0.45)} M${n2(r.headW * 0.28)} ${n2(r.headL * 0.72)} Q${n2(r.headW * 0.5)} ${n2(r.headL * 0.6)} ${n2(r.headW * 0.5)} ${n2(r.headL * 0.45)}`} stroke="#e6eef5" strokeWidth={1} fill="none" {...SOFT} />
          <path d={`M${n2(-r.headW * 0.42)} ${n2(r.headL * 0.76)} Q0 ${n2(r.headL * 0.7)} ${n2(r.headW * 0.42)} ${n2(r.headL * 0.76)}`} fill="none" stroke="#1b1b1b" strokeWidth={0.016 * k} />
          <rect x={-0.034 * k} y={mouth[1] - 0.028 * k} width={0.068 * k} height={0.072 * k} rx={0.014 * k} fill={r.build.child ? "#f3d35a" : "#3fae3f"} stroke="#1b2733" strokeWidth={0.7} strokeOpacity={0.6} {...SW} />
          <rect x={-0.034 * k} y={mouth[1] - 0.028 * k} width={0.068 * k} height={0.072 * k} rx={0.014 * k} fill="url(#pk-gloss)" />
          <circle cx={0} cy={mouth[1] - 0.012 * k} r={0.018 * k} fill="#e6eef5" stroke="#8a9399" strokeWidth={0.7} {...SW} />
          <circle cx={0} cy={mouth[1] - 0.012 * k} r={0.009 * k} fill="#1b2733" opacity={0.7} />
        </g>
      )}
      {kit.airway === "tube" && (
        <g>
          <path d={`M${n2(-r.headW * 0.46)} ${n2(r.headL * 0.78)} Q0 ${n2(r.headL * 0.72)} ${n2(r.headW * 0.46)} ${n2(r.headL * 0.78)}`} fill="none" stroke="#f4f4f0" strokeWidth={0.02 * k} />
          <rect x={-0.012 * k} y={mouth[1] - 0.045 * k} width={0.024 * k} height={0.09 * k} rx={0.008 * k} fill="#e6eef5" stroke="#9fb4c8" strokeWidth={0.7} {...SW} />
          <rect x={-0.016 * k} y={mouth[1] - 0.05 * k} width={0.032 * k} height={0.022 * k} rx={0.004 * k} fill="#2f6fd6" stroke="#1b2733" strokeWidth={0.5} {...SW} />
        </g>
      )}
      {kit.oxygen === "bvm" && (
        <g className="ps-bvm">
          {kit.airway === "none" && mask("bvm")}
          {kit.capno && (
            <g>
              {slab(bvm.at(0.02), bvm.u, 0.036 * k, 0.03 * k, { fill: "#3b434b", stroke: "#15191c", strokeWidth: 0.7, ...SW }, 0.004 * k)}
              <circle cx={bvm.at(0.02, 0.009)[0]} cy={bvm.at(0.02, 0.009)[1]} r={0.003 * k} fill="#7fc4ff" />
            </g>
          )}
          {/* The patient valve: the exhalation ring at the mask, the clear housing, the collar the bag clips into. */}
          <circle cx={bvm.at(bvm.off + 0.014)[0]} cy={bvm.at(bvm.off + 0.014)[1]} r={0.021 * k} fill="#dfe8ef" stroke="#6f777c" strokeWidth={0.7} {...SW} />
          {[-1, 1].map((sd) => <path key={sd} d={`M${P(bvm.at(bvm.off + 0.006, sd * 0.012))} L${P(bvm.at(bvm.off + 0.022, sd * 0.012))}`} stroke="#8a9399" strokeWidth={0.6} fill="none" {...SOFT} />)}
          {slab(bvm.at(bvm.off + 0.045), bvm.u, 0.046 * k, 0.034 * k, { fill: "url(#pk-clear)", stroke: "#7f98ad", strokeWidth: 0.8, ...SW }, 0.006 * k)}
          {slab(bvm.at(bvm.off + 0.07), bvm.u, 0.014 * k, 0.04 * k, { fill: "#2f6fd6", stroke: "#1b2733", strokeWidth: 0.6, ...SW }, 0.004 * k)}
          {/* The bag, clear silicone with its gloss and the grip ridges along it. */}
          <path d={bvm.bag} className="ps-bag-bvm" filter="url(#pk-drop-sm)" />
          <path d={bvm.bag} fill="url(#pk-gloss)" />
          {[-0.5, 0, 0.5].map((t) => <path key={t} d={`M${P(bvm.at(bvm.bagStart + 0.035, t * 0.034))} L${P(bvm.at(bvm.bagEnd - 0.035, t * 0.034))}`} stroke="#7f98ad" strokeWidth={0.5} opacity={0.45} fill="none" {...SOFT} />)}
          {/* The inlet valve, the oxygen nipple on it and the reservoir. */}
          {slab(bvm.at(bvm.bagEnd + 0.016), bvm.u, 0.032 * k, 0.044 * k, { fill: "#4a5560", stroke: "#1b2733", strokeWidth: 0.7, ...SW }, 0.006 * k)}
          {slab(bvm.at(bvm.bagEnd + 0.016, 0.028), bvm.v, 0.014 * k, 0.009 * k, { fill: "#8fcf9a", stroke: "#1b2733", strokeWidth: 0.5, ...SW }, 0.003 * k)}
          <path d={bvm.res} className="ps-bvm-res" />
          <path d={`M${P(bvm.resAt(0.04, 0.012))} Q${P(bvm.resAt(0.08, -0.01))} ${P(bvm.resAt(0.13, 0.014))}`} stroke="#8fa8bc" strokeWidth={0.5} fill="none" opacity={0.6} {...SOFT} />
          {o2Line(bvm.at(bvm.bagEnd + 0.016, 0.036))}
        </g>
      )}
    </g>
  );

  // --- Cables to the monitor: each at its own width, lying across the
  // patient and the ground, steering round hands. Drawn under the crew's
  // gloves, which rest on them.
  const padJunction: Pt = [junction[0] * 0.9, r.hipY - 0.04 * k];
  const leadPath = (e: Lead) => route([e.at, bow(e.at, e.to, e.sag), e.to], avoid);
  const toPort = (from: Pt, sag: number, keepOut: Pt[] = avoid) => route([from, add(lerp(from, port, 0.35), mul(perp(unit(sub(port, from))), sag)), add(lerp(from, port, 0.7), mul(perp(unit(sub(port, from))), -sag * 0.5)), port], keepOut);
  const lines = (
    <g>
      {kit.pads && (
        <g>
          <Cable d={route([add(padR, [0.02 * k, 0.06 * k]), bow(add(padR, [0.02 * k, 0.06 * k]), padJunction, 0.05 * k), padJunction], avoid)} className="ps-wire-pad" />
          <Cable d={route([add(padL, [0.02 * k, 0.06 * k]), bow(add(padL, [0.02 * k, 0.06 * k]), padJunction, -0.02 * k), padJunction], avoid)} className="ps-wire-pad" />
          <Cable d={toPort(padJunction, 0.08 * k)} className="ps-wire-pad" />
        </g>
      )}
      {kit.leads && (
        <g>
          {limb.map((e) => <Cable key={e.key} d={leadPath(e)} className="ps-lead" colour={e.colour} />)}
          {chest.map((e) => <Cable key={e.key} d={leadPath(e)} className="ps-lead-v" colour={e.colour} />)}
          {chest.length > 0 && (
            <g>
              <Cable d={route([vYoke, bow(vYoke, junction, 0.03 * k), junction], avoid)} className="ps-wire-bundle" />
              <rect x={vYoke[0] - 0.022 * k} y={vYoke[1] - 0.015 * k} width={0.044 * k} height={0.03 * k} rx={0.005 * k} fill="#2b3139" {...lineSoft} />
            </g>
          )}
          <circle cx={junction[0]} cy={junction[1]} r={0.022 * k} fill="#2b3139" {...lineSoft} />
          <Cable d={toPort(junction, 0.1 * k)} className="ps-wire-bundle" />
        </g>
      )}
      {kit.cuff && <Cable d={route([add(cuffArm, [r.armW[0] * 1.3, 0]), add(cuffArm, [r.armW[0] * 2.2, 0.06 * k]), add(r.armL.b, [r.armW[1] * 2.4, 0.04 * k]), add(lerp(r.armL.b, port, 0.5), mul(perp(unit(sub(port, r.armL.b))), -0.06 * k)), port], avoid)} className="ps-cuff-tube" />}
      {kit.probe && <Cable d={toPort([A.leftFinger[0], A.leftFinger[1] + 0.03 * k], 0.08 * k, avoidButL)} className="ps-wire" />}
      {kit.capno && kit.oxygen === "bvm" && <Cable d={toPort(bvm.at(0.02, 0.016), 0.1 * k)} className="ps-wire" />}
    </g>
  );
  return { under, onChest, over, lines };
}

// ---------------------------------------------------------------------------
// Kit on the ground, from above
// ---------------------------------------------------------------------------

/** Gradients, patterns and shadows the kit is drawn with; put once in the scene's defs. */
export function KitDefs() {
  return (
    <>
      {/* A cylinder lying left-right: the light catches its upper third. */}
      <linearGradient id="pk-cyl" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0.38" />
        <stop offset="0.3" stopColor="#fff" stopOpacity="0.6" />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0.12" />
        <stop offset="1" stopColor="#000" stopOpacity="0.5" />
      </linearGradient>
      <linearGradient id="pk-screen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#131c26" />
        <stop offset="0.55" stopColor="#070c11" />
        <stop offset="1" stopColor="#0e161f" />
      </linearGradient>
      <linearGradient id="pk-gloss" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.26" />
        <stop offset="0.4" stopColor="#fff" stopOpacity="0.05" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="pk-case" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#555c63" />
        <stop offset="0.12" stopColor="#3b4147" />
        <stop offset="1" stopColor="#1f2428" />
      </linearGradient>
      <linearGradient id="pk-fabric" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2f7a4f" />
        <stop offset="1" stopColor="#153d28" />
      </linearGradient>
      <linearGradient id="pk-clear" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.88" />
        <stop offset="0.5" stopColor="#dfe8ef" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.8" />
      </linearGradient>
      <pattern id="pk-cellular" width="0.028" height="0.028" patternUnits="userSpaceOnUse">
        <rect width="0.028" height="0.028" fill="#c4532c" />
        <path d="M0 0.014 H0.028 M0.014 0 V0.028" stroke="#9c3f1f" strokeWidth="0.0035" />
      </pattern>
      <pattern id="pk-gauze" width="0.012" height="0.012" patternUnits="userSpaceOnUse">
        <rect width="0.012" height="0.012" fill="#f8f7f2" />
        <path d="M0 0.006 H0.012 M0.006 0 V0.012" stroke="#d9d6cc" strokeWidth="0.0012" />
      </pattern>
      <pattern id="pk-mesh" width="0.02" height="0.02" patternUnits="userSpaceOnUse">
        <rect width="0.02" height="0.02" fill="#0f1a14" />
        <circle cx="0.01" cy="0.01" r="0.005" fill="#1c3024" />
      </pattern>
      <filter id="pk-drop" x="-30%" y="-30%" width="170%" height="170%">
        <feDropShadow dx="0.022" dy="0.03" stdDeviation="0.018" floodColor="#000" floodOpacity="0.45" />
      </filter>
      <filter id="pk-drop-sm" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0.008" dy="0.012" stdDeviation="0.007" floodColor="#000" floodOpacity="0.4" />
      </filter>
    </>
  );
}

const SW = { vectorEffect: "non-scaling-stroke" as const, strokeLinejoin: "round" as const };

/** An ECG, a pleth and a resp trace across a screen, in metres. */
function traces(L: number, T: number, w: number, arrest: boolean): { ecg: string; pleth: string; resp: string } {
  let ecg = `M${n2(L)} ${n2(T + 0.028)}`;
  if (arrest) {
    for (let i = 0; i <= 40; i++) {
      const x = L + (w * i) / 40;
      const y = T + 0.028 + Math.sin(i * 1.9) * 0.012 + Math.sin(i * 0.7) * 0.008;
      ecg += ` L${n2(x)} ${n2(y)}`;
    }
  } else {
    const beat = w / 3;
    for (let b = 0; b < 3; b++) {
      const x0 = L + b * beat;
      ecg += ` L${n2(x0 + beat * 0.2)} ${n2(T + 0.028)} q${n2(beat * 0.05)} -0.006 ${n2(beat * 0.1)} 0 L${n2(x0 + beat * 0.42)} ${n2(T + 0.028)} l${n2(beat * 0.03)} 0.006 l${n2(beat * 0.05)} -0.034 l${n2(beat * 0.05)} 0.04 l${n2(beat * 0.03)} -0.012 L${n2(x0 + beat * 0.7)} ${n2(T + 0.028)} q${n2(beat * 0.07)} -0.01 ${n2(beat * 0.14)} 0 L${n2(x0 + beat)} ${n2(T + 0.028)}`;
    }
  }
  let pleth = `M${n2(L)} ${n2(T + 0.062)}`;
  for (let b = 0; b < 3; b++) {
    const x0 = L + (b * w) / 3, bw = w / 3;
    pleth += ` c${n2(bw * 0.1)} -0.02 ${n2(bw * 0.25)} -0.022 ${n2(bw * 0.35)} -0.006 c${n2(bw * 0.1)} 0.012 ${n2(bw * 0.4)} 0.01 ${n2(bw * 0.65)} 0.006`;
    void x0;
  }
  if (arrest) pleth = `M${n2(L)} ${n2(T + 0.062)} H${n2(L + w)}`;
  const resp = arrest ? `M${n2(L)} ${n2(T + 0.092)} H${n2(L + w)}` : `M${n2(L)} ${n2(T + 0.092)} c${n2(w * 0.2)} -0.016 ${n2(w * 0.3)} -0.016 ${n2(w * 0.5)} 0 c${n2(w * 0.2)} 0.014 ${n2(w * 0.3)} 0.014 ${n2(w * 0.5)} 0`;
  return { ecg, pleth, resp };
}

/** The LIFEPAK 15's front panel is 40 cm by 32 cm. */
export const MONITOR_W = 0.4;

/** The monitor-defibrillator on the ground, drawn as the LIFEPAK 15 the
 *  service carries: a grey case with its carry handle, the big colour
 *  screen with three channels and the numbers down its right side, the
 *  green ON button and the SpO₂, NIBP and CO₂ keys down the left, the
 *  speed dial and the soft keys under the screen, the therapy panel on the
 *  right (ENERGY SELECT, the yellow CHARGE, the red SHOCK, ANALYZE, PACER,
 *  SYNC), the printer's paper door and strip at the far right, and the
 *  cable sockets down the side the cables leave. `at` is its centre. */
export function Monitor({ at, k = 1, arrest = false, portSide = -1 }: { at: Pt; k?: number; arrest?: boolean; portSide?: 1 | -1 }) {
  void k;
  const [x, y] = at;
  const W = MONITOR_W, H = 0.32, L = x - W / 2, T = y - H / 2;
  const sx = portSide === -1 ? L - 0.02 : L + W - 0.004;
  // The screen and its waveform area; the numbers take the right-hand column.
  const sl = L + 0.064, st = T + 0.034, sw = 0.215, sh = 0.155;
  const tw = 0.138;
  const tr = traces(sl + 0.006, st + 0.016, tw, arrest);
  const clipId = `pk-screen-${Math.round(x * 1000)}-${Math.round(y * 1000)}`;
  const numX = sl + sw - 0.006;
  const key = (kx: number, ky: number, kw: number, kh: number, fill = "#6b7278", label?: string, labelFill = "#e9ecef") => (
    <g>
      <rect x={kx} y={ky} width={kw} height={kh} rx={0.004} fill={fill} stroke="#1b1f23" strokeWidth={0.6} {...SW} />
      <rect x={kx} y={ky} width={kw} height={kh} rx={0.004} fill="url(#pk-gloss)" />
      {label && <text x={kx + kw / 2} y={ky + kh / 2 + 0.0035} textAnchor="middle" fontSize={0.0085} fontWeight={700} fill={labelFill} fontFamily="Arial, sans-serif">{label}</text>}
    </g>
  );
  const dial: Pt = [L + 0.248, T + 0.255];
  return (
    <g className="ps-monitor" filter="url(#pk-drop)">
      {/* The carry handle along the top edge. */}
      <rect x={x - 0.1} y={T - 0.028} width={0.2} height={0.046} rx={0.02} fill="#3b4147" stroke="#15191c" strokeWidth={0.9} {...SW} />
      <rect x={x - 0.07} y={T - 0.022} width={0.14} height={0.03} rx={0.014} fill="#1f2428" />
      {/* The case. */}
      <rect x={L} y={T} width={W} height={H} rx={0.022} fill="url(#pk-case)" stroke="#0e1114" strokeWidth={1} {...SW} />
      <rect x={L + 0.006} y={T + 0.006} width={W - 0.012} height={H - 0.012} rx={0.018} fill="none" stroke="#7d848b" strokeWidth={0.6} strokeOpacity={0.45} {...SW} />
      <rect x={L + 0.008} y={T + 0.2} width={W - 0.016} height={0.112} rx={0.012} fill="#2a2f34" opacity={0.7} />
      <text x={L + 0.012} y={T + 0.02} fontSize={0.011} fontWeight={800} fill="#e9ecef" fontFamily="Arial, sans-serif" letterSpacing={0.001}>LIFEPAK<tspan fontWeight={400}> 15</tspan></text>
      <text x={L + 0.012} y={T + 0.029} fontSize={0.005} fontWeight={700} fill="#9aa0a6" fontFamily="Arial, sans-serif">MONITOR / DEFIBRILLATOR</text>
      {/* Left column: ON, then the SpO₂, NIBP and CO₂ keys. */}
      <circle cx={L + 0.03} cy={T + 0.055} r={0.013} fill="#2fa85a" stroke="#0f4d2a" strokeWidth={0.8} {...SW} />
      <circle cx={L + 0.03} cy={T + 0.055} r={0.013} fill="url(#pk-gloss)" />
      <text x={L + 0.03} y={T + 0.058} textAnchor="middle" fontSize={0.0075} fontWeight={800} fill="#f4f6f8" fontFamily="Arial, sans-serif">ON</text>
      {[["SpO₂", T + 0.085], ["NIBP", T + 0.125], ["CO₂", T + 0.165]].map(([lab, ky]) => (
        <g key={lab as string}>
          <text x={L + 0.012} y={(ky as number) - 0.003} fontSize={0.0065} fontWeight={700} fill="#c9ced3" fontFamily="Arial, sans-serif">{lab as string}</text>
          {key(L + 0.012, ky as number, 0.038, 0.02)}
          <circle cx={L + 0.031} cy={(ky as number) + 0.01} r={0.004} fill="#1b1f23" />
        </g>
      ))}
      {/* The screen: three channels and the numbers down the right. */}
      <rect x={sl - 0.004} y={st - 0.004} width={sw + 0.008} height={sh + 0.008} rx={0.006} fill="#0b0e11" />
      <rect x={sl} y={st} width={sw} height={sh} rx={0.004} fill="url(#pk-screen)" stroke="#05080b" strokeWidth={1} {...SW} />
      <rect x={sl} y={st} width={sw} height={0.012} fill="#1a2430" />
      <text x={sl + 0.004} y={st + 0.0085} fontSize={0.006} fontWeight={700} fill="#c9ced3" fontFamily="Arial, sans-serif">{arrest ? "VF  ·  CPR" : "ADULT  ·  LEAD II"}</text>
      <text x={sl + sw - 0.004} y={st + 0.0085} textAnchor="end" fontSize={0.006} fontWeight={700} fill="#c9ced3" fontFamily="Arial, sans-serif">14:04</text>
      <g stroke="#1e2a22" strokeWidth={0.4} opacity={0.6}>
        {[0.3, 0.52, 0.74].map((t) => <path key={t} d={`M${n2(sl)} ${n2(st + sh * t)} H${n2(sl + tw + 0.006)}`} {...SW} />)}
      </g>
      <text x={sl + 0.004} y={st + 0.03} fontSize={0.006} fontWeight={700} fill="#3ad17f" fontFamily="Arial, sans-serif">II</text>
      <text x={sl + 0.004} y={st + 0.064} fontSize={0.006} fontWeight={700} fill="#39c6ea" fontFamily="Arial, sans-serif">SpO₂</text>
      <text x={sl + 0.004} y={st + 0.098} fontSize={0.006} fontWeight={700} fill="#f3d35a" fontFamily="Arial, sans-serif">CO₂</text>
      <clipPath id={clipId}><rect x={sl + 0.006} y={st + 0.012} width={tw} height={sh - 0.012} /></clipPath>
      <g clipPath={`url(#${clipId})`}>
        <g className="ps-mon-scroll">
          {[0, 1].map((i) => (
            <g key={i} transform={`translate(${n2(i * tw)} 0)`}>
              <path d={tr.ecg} fill="none" stroke={arrest ? "#4ddc7a" : "#3ad17f"} strokeWidth={1.1} {...SW} />
              <path d={tr.pleth} fill="none" stroke="#39c6ea" strokeWidth={1} {...SW} />
              <path d={tr.resp} fill="none" stroke="#f3d35a" strokeWidth={1} {...SW} />
            </g>
          ))}
        </g>
      </g>
      <path d={`M${n2(sl + tw + 0.012)} ${n2(st + 0.012)} V${n2(st + sh)}`} stroke="#1e2a30" strokeWidth={0.6} {...SW} />
      {[["HR", arrest ? "--" : "96", "#3ad17f", 0.036], ["SpO₂", arrest ? "--" : "95", "#39c6ea", 0.07], ["CO₂", arrest ? "18" : "38", "#f3d35a", 0.104], ["NIBP", arrest ? "--/--" : "128/80", "#e9b4e8", 0.138]].map(([lab, val, col, dy]) => (
        <g key={lab as string}>
          <text x={sl + tw + 0.017} y={st + (dy as number) - 0.011} fontSize={0.0055} fontWeight={700} fill={col as string} fontFamily="Arial, sans-serif">{lab as string}</text>
          <text x={numX} y={st + (dy as number)} textAnchor="end" fontSize={lab === "NIBP" ? 0.011 : 0.017} fontWeight={800} fill={col as string} fontFamily="Arial, sans-serif">{val as string}</text>
        </g>
      ))}
      {arrest && <text x={sl + tw - 0.004} y={st + sh - 0.006} textAnchor="end" fontSize={0.0075} fontWeight={800} fill="#ff5d5d" fontFamily="Arial, sans-serif">VF — SHOCK ADVISED</text>}
      <rect x={sl} y={st} width={sw} height={sh * 0.45} rx={0.004} fill="url(#pk-gloss)" />
      {/* Under the screen: the soft keys and the speed dial. */}
      {["OPTIONS", "EVENT", "ALARMS", "PRINT", "CODE SUM"].map((lab, i) => <g key={lab}>{key(sl + i * 0.038, T + 0.206, 0.032, 0.016, "#5f666d", lab, "#e9ecef")}</g>)}
      {["HOME", "TRANSMIT"].map((lab, i) => <g key={lab}>{key(sl + i * 0.052, T + 0.232, 0.046, 0.016, "#5f666d", lab)}</g>)}
      <circle cx={dial[0]} cy={dial[1]} r={0.03} fill="#111518" />
      <circle cx={dial[0]} cy={dial[1]} r={0.025} fill="url(#pk-case)" stroke="#0e1114" strokeWidth={0.8} {...SW} />
      {Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return <path key={i} d={`M${n2(dial[0] + Math.cos(a) * 0.02)} ${n2(dial[1] + Math.sin(a) * 0.02)} L${n2(dial[0] + Math.cos(a) * 0.026)} ${n2(dial[1] + Math.sin(a) * 0.026)}`} stroke="#8a9199" strokeWidth={0.6} {...SW} />; })}
      <circle cx={dial[0]} cy={dial[1]} r={0.009} fill="#2a2f34" stroke="#8a9199" strokeWidth={0.6} {...SW} />
      <text x={dial[0]} y={dial[1] + 0.044} textAnchor="middle" fontSize={0.005} fontWeight={700} fill="#9aa0a6" fontFamily="Arial, sans-serif">SPEED DIAL</text>
      {/* The therapy panel on the right. */}
      <rect x={L + 0.29} y={T + 0.03} width={0.078} height={0.26} rx={0.008} fill="#2a2f34" stroke="#15191c" strokeWidth={0.7} {...SW} />
      <text x={L + 0.329} y={T + 0.046} textAnchor="middle" fontSize={0.0055} fontWeight={800} fill="#e9ecef" fontFamily="Arial, sans-serif">ENERGY SELECT</text>
      <rect x={L + 0.3} y={T + 0.052} width={0.058} height={0.016} rx={0.003} fill="#0b0e11" />
      <text x={L + 0.329} y={T + 0.064} textAnchor="middle" fontSize={0.009} fontWeight={800} fill="#3ad17f" fontFamily="Arial, sans-serif">200 J</text>
      {key(L + 0.3, T + 0.072, 0.026, 0.016, "#6b7278", "▲")}
      {key(L + 0.332, T + 0.072, 0.026, 0.016, "#6b7278", "▼")}
      <text x={L + 0.329} y={T + 0.104} textAnchor="middle" fontSize={0.0055} fontWeight={800} fill="#e9ecef" fontFamily="Arial, sans-serif">CHARGE</text>
      <rect x={L + 0.306} y={T + 0.108} width={0.046} height={0.034} rx={0.008} fill="#f2c230" stroke="#6b5410" strokeWidth={0.8} {...SW} />
      <rect x={L + 0.306} y={T + 0.108} width={0.046} height={0.034} rx={0.008} fill="url(#pk-gloss)" />
      <text x={L + 0.329} y={T + 0.158} textAnchor="middle" fontSize={0.0055} fontWeight={800} fill="#e9ecef" fontFamily="Arial, sans-serif">SHOCK</text>
      <circle cx={L + 0.329} cy={T + 0.185} r={0.023} fill="#d13b3b" stroke="#5c1313" strokeWidth={0.9} {...SW} />
      <circle cx={L + 0.329} cy={T + 0.185} r={0.023} fill="url(#pk-gloss)" />
      <path d={`M${n2(L + 0.333)} ${n2(T + 0.172)} l-0.01 0.014 h0.007 l-0.006 0.013 l0.013 -0.016 h-0.007 z`} fill="#fff" opacity={0.95} />
      {key(L + 0.298, T + 0.222, 0.03, 0.016, "#4a8a5a", "ANALYZE", "#f4f6f8")}
      {key(L + 0.332, T + 0.222, 0.03, 0.016, "#5f666d", "SYNC")}
      {key(L + 0.298, T + 0.246, 0.064, 0.016, "#5f666d", "PACER")}
      {key(L + 0.298, T + 0.27, 0.064, 0.014, "#5f666d", "CODE SUMMARY")}
      {/* The printer: its door and the strip of paper. */}
      <rect x={L + 0.372} y={T + 0.02} width={0.022} height={0.28} rx={0.004} fill="#4a5056" stroke="#15191c" strokeWidth={0.7} {...SW} />
      <rect x={L + 0.375} y={T + 0.03} width={0.016} height={0.08} rx={0.002} fill="#2a2f34" />
      <rect x={L + 0.376} y={T + 0.014} width={0.014} height={0.07} fill="#f7f5ef" stroke="#c9ced3" strokeWidth={0.5} {...SW} transform={`rotate(-6 ${n2(L + 0.383)} ${n2(T + 0.084)})`} />
      <path d={`M${n2(L + 0.378)} ${n2(T + 0.02)} v0.056 M${n2(L + 0.382)} ${n2(T + 0.02)} v0.056 M${n2(L + 0.386)} ${n2(T + 0.02)} v0.056`} stroke="#e8a0a0" strokeWidth={0.4} {...SW} transform={`rotate(-6 ${n2(L + 0.383)} ${n2(T + 0.084)})`} />
      {/* Speaker. */}
      {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={L + 0.014 + (i % 4) * 0.008} cy={T + 0.2 + Math.floor(i / 4) * 0.008} r={0.0022} fill="#0e1114" />)}
      {/* Sockets down the side the cables leave: ECG, therapy, SpO₂, NIBP, CO₂. */}
      <rect x={sx} y={T + 0.04} width={0.024} height={0.03} rx={0.004} fill="#3ad17f" stroke="#0e1114" strokeWidth={0.7} {...SW} />
      <rect x={sx} y={T + 0.078} width={0.024} height={0.04} rx={0.004} fill="#e9ecef" stroke="#0e1114" strokeWidth={0.7} {...SW} />
      <rect x={sx} y={T + 0.126} width={0.024} height={0.026} rx={0.004} fill="#2f6fd6" stroke="#0e1114" strokeWidth={0.7} {...SW} />
      <rect x={sx} y={T + 0.16} width={0.024} height={0.026} rx={0.004} fill="#8a9399" stroke="#0e1114" strokeWidth={0.7} {...SW} />
      <rect x={sx} y={T + 0.194} width={0.024} height={0.026} rx={0.004} fill="#f3d35a" stroke="#0e1114" strokeWidth={0.7} {...SW} />
    </g>
  );
}

/** The response rucksack, open on the ground: a green bag with webbing and
 *  a reflective band, the lid thrown back, colour-coded modules inside. */
export function KitBag({ at, k = 1, open = true }: { at: Pt; k?: number; open?: boolean; colour?: string }) {
  void k;
  const [x, y] = at;
  const W = 0.6, H = 0.44, L = x - W / 2, T = y - H / 2;
  return (
    <g className="ps-kitbag" filter="url(#pk-drop)">
      {open && (
        <g>
          <rect x={L + 0.02} y={T - 0.2} width={W - 0.04} height={0.22} rx={0.05} fill="url(#pk-fabric)" stroke="#0b2416" strokeWidth={1} {...SW} />
          <rect x={L + 0.07} y={T - 0.17} width={W - 0.14} height={0.13} rx={0.02} fill="url(#pk-mesh)" stroke="#0b2416" strokeWidth={0.6} {...SW} />
          <rect x={L + 0.02} y={T - 0.2} width={W - 0.04} height={0.22} rx={0.05} fill="url(#pk-gloss)" />
        </g>
      )}
      <rect x={L} y={T} width={W} height={H} rx={0.05} fill="url(#pk-fabric)" stroke="#0b2416" strokeWidth={1} {...SW} />
      <rect x={L} y={T + H - 0.1} width={W} height={0.032} fill="#cfd4d8" opacity={0.9} />
      {[L + 0.1, L + W - 0.13].map((sxx) => (
        <g key={sxx}>
          <rect x={sxx} y={T} width={0.03} height={H} fill="#15191c" opacity={0.9} />
          <rect x={sxx - 0.006} y={T + H - 0.15} width={0.042} height={0.02} rx={0.003} fill="#5a6470" stroke="#0e1114" strokeWidth={0.6} {...SW} />
        </g>
      ))}
      <rect x={x - 0.07} y={T - 0.012} width={0.14} height={0.024} rx={0.012} fill="#15191c" stroke="#0e1114" strokeWidth={0.7} {...SW} />
      {open ? (
        <g>
          <rect x={L + 0.045} y={T + 0.04} width={W - 0.09} height={H - 0.15} rx={0.025} fill="#0f1a14" />
          {[["#c0392b", "AIRWAY"], ["#2f6fd6", "CIRC"], ["#e0b321", "DRUGS"]].map(([c, label], i) => (
            <g key={label}>
              <rect x={L + 0.06 + i * 0.165} y={T + 0.055} width={0.15} height={0.22} rx={0.012} fill={c} stroke="#0e1114" strokeWidth={0.7} {...SW} />
              <rect x={L + 0.06 + i * 0.165} y={T + 0.055} width={0.15} height={0.22} rx={0.012} fill="url(#pk-gloss)" />
              <path d={`M${n2(L + 0.07 + i * 0.165)} ${n2(T + 0.075)} H${n2(L + 0.2 + i * 0.165)}`} stroke="#0e1114" strokeWidth={0.9} strokeDasharray="0.006 0.004" {...SW} />
              <rect x={L + 0.085 + i * 0.165} y={T + 0.16} width={0.1} height={0.03} rx={0.004} fill="#f4f6f8" />
              <text x={L + 0.135 + i * 0.165} y={T + 0.181} textAnchor="middle" fontSize={0.016} fontWeight={800} fill="#1b2733" fontFamily="Arial, sans-serif">{label}</text>
            </g>
          ))}
          <circle cx={L + W - 0.085} cy={T + H - 0.14} r={0.028} fill="#e9ecef" stroke="#9aa0a6" strokeWidth={0.7} {...SW} />
          <circle cx={L + W - 0.085} cy={T + H - 0.14} r={0.012} fill="#0f1a14" />
        </g>
      ) : (
        <g>
          <path d={`M${n2(L + 0.05)} ${n2(y)} H${n2(L + W - 0.05)}`} stroke="#0b2416" strokeWidth={1.4} strokeDasharray="0.008 0.005" {...SW} />
        </g>
      )}
      <rect x={L} y={T} width={W} height={H} rx={0.05} fill="url(#pk-gloss)" opacity={0.6} />
    </g>
  );
}

/** A CD-size medical oxygen cylinder lying on the ground: white, with the
 *  integral valve head at the `at` end, its flow dial and on-off wheel. */
export function O2Cylinder({ at, k = 1, angle = 90 }: { at: Pt; k?: number; angle?: number }) {
  void k;
  const [x, y] = at;
  const L = 0.52, D = 0.1;
  return (
    <g transform={`rotate(${n2(angle)} ${n2(x)} ${n2(y)})`} filter="url(#pk-drop)">
      <rect x={x + 0.1} y={y - D / 2} width={L - 0.1} height={D} rx={D / 2} fill="#f2f4f6" stroke="#6f777c" strokeWidth={0.9} {...SW} />
      <rect x={x + 0.1} y={y - D / 2} width={L - 0.1} height={D} rx={D / 2} fill="url(#pk-cyl)" />
      <path d={`M${n2(x + 0.1)} ${n2(y - 0.03)} l-0.03 0.008 v0.044 l0.03 0.008 z`} fill="#dfe3e6" stroke="#6f777c" strokeWidth={0.7} {...SW} />
      <rect x={x - 0.01} y={y - 0.034} width={0.09} height={0.068} rx={0.014} fill="#c9ced3" stroke="#5f6468" strokeWidth={0.8} {...SW} />
      <rect x={x - 0.01} y={y - 0.034} width={0.09} height={0.068} rx={0.014} fill="url(#pk-gloss)" />
      <circle cx={x + 0.055} cy={y + 0.004} r={0.02} fill="#1f8a4c" stroke="#0f4d2a" strokeWidth={0.7} {...SW} />
      <circle cx={x + 0.055} cy={y + 0.004} r={0.008} fill="#f4f6f8" />
      <circle cx={x + 0.012} cy={y - 0.014} r={0.014} fill="#f4f6f8" stroke="#5f6468" strokeWidth={0.7} {...SW} />
      <rect x={x + 0.002} y={y + 0.014} width={0.016} height={0.012} rx={0.003} fill="#5f6468" />
      <rect x={x + 0.16} y={y - D / 2 + 0.004} width={0.03} height={D - 0.008} fill="#8fcf9a" opacity={0.9} />
      <text x={x + 0.35} y={y + 0.01} textAnchor="middle" fontSize={0.026} fontWeight={800} fill="#1f8a4c" fontFamily="Arial, sans-serif" letterSpacing={0.003}>OXYGEN</text>
      <text x={x + 0.35} y={y + 0.034} textAnchor="middle" fontSize={0.012} fontWeight={700} fill="#5f6468" fontFamily="Arial, sans-serif">MEDICAL · CD</text>
    </g>
  );
}

/** A bag of fluid: hanging below its hook, or lying flat; clear, with its label and ports. */
export function DripBag({ at, k = 1, lying = false }: { at: Pt; k?: number; lying?: boolean }) {
  void k;
  const [x, y] = at;
  const W = 0.1, H = 0.17;
  const top = lying ? y - H / 2 : y;
  return (
    <g transform={lying ? `rotate(20 ${n2(x)} ${n2(y)})` : undefined} filter="url(#pk-drop-sm)">
      <rect x={x - 0.012} y={top - 0.016} width={0.024} height={0.018} rx={0.007} fill="none" stroke="#9aa0a6" strokeWidth={1.2} {...SW} />
      <rect x={x - W / 2} y={top} width={W} height={H} rx={0.012} fill="url(#pk-clear)" stroke="#9fb4c8" strokeWidth={0.8} {...SW} />
      <rect x={x - W / 2 + 0.004} y={top + H * 0.28} width={W - 0.008} height={H * 0.72 - 0.004} rx={0.01} fill="#cfe9f5" opacity={0.45} />
      <rect x={x - W / 2 + 0.012} y={top + 0.04} width={W - 0.024} height={0.066} fill="#ffffff" stroke="#c9ced3" strokeWidth={0.5} {...SW} />
      <rect x={x - W / 2 + 0.012} y={top + 0.04} width={W - 0.024} height={0.012} fill="#2f6fd6" />
      {[0.062, 0.074, 0.086].map((dy) => <rect key={dy} x={x - W / 2 + 0.018} y={top + dy} width={W - 0.036 - (dy === 0.086 ? 0.02 : 0)} height={0.004} fill="#4a6fa5" opacity={0.8} />)}
      <rect x={x - 0.02} y={top + H} width={0.012} height={0.028} rx={0.003} fill="#dfe8ef" stroke="#9fb4c8" strokeWidth={0.6} {...SW} />
      <rect x={x + 0.006} y={top + H} width={0.012} height={0.028} rx={0.003} fill="#2f6fd6" stroke="#1b2733" strokeWidth={0.6} {...SW} />
    </g>
  );
}

/** Not a prop: the little blood pool class is in the CSS. Re-exported helpers for the scene. */
export { capsule };
