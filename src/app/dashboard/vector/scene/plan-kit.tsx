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
import { type Pt, type Rig, add, sub, mul, unit, perp, lerp, len, deg, P, capsule, anchors, line, lineSoft, smooth, rot } from "./plan-figure";

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

/** A wire from a to b that sags sideways a little, the way a cable lies. */
function wire(a: Pt, b: Pt, className: string, sag = 0.12): ReactNode {
  return <path d={`M${P(a)} Q${P(bow(a, b, sag))} ${P(b)}`} className={className} fill="none" {...SOFT} />;
}

/** A lead wire in its own colour. */
function lead(a: Pt, b: Pt, colour: string, sag: number, className: string, key: string): ReactNode {
  return <path key={key} d={`M${P(a)} Q${P(bow(a, b, sag))} ${P(b)}`} className={className} stroke={colour} fill="none" {...SOFT} />;
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
  // Where the wires gather before the one cable runs to the monitor.
  const junction: Pt = [port[0] < 0 ? -(r.chestW + 0.1) : r.chestW + 0.1, r.waistY + 0.08 * k];
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
  const o2Line = (from: Pt) => <path d={`M${P(from)} C${P(add(from, [0.25 * k, -0.05 * k]))} ${P(add(o2, [-0.2 * k, 0.15 * k]))} ${P(o2)}`} className="ps-tube o2" fill="none" {...SOFT} />;
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
          <path d={`M${P(ivHand)} C${P(add(ivHand, [-0.15 * k, -0.1 * k]))} ${P(add(place.ivAt ?? [ivHand[0] - 0.42 * k, ivHand[1] + 0.1 * k], [0.05 * k, 0.1 * k]))} ${P(place.ivAt ?? [ivHand[0] - 0.42 * k, ivHand[1] + 0.1 * k])}`} className="ps-line" fill="none" {...SOFT} />
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
          <path d={`M${n2(-r.headW * 0.1)} ${n2(r.headL * 0.68)} H${n2(r.headW * 0.1)} M${n2(-r.headW * 0.05)} ${n2(r.headL * 0.68)} v${n2(-0.012 * k)} M${n2(r.headW * 0.05)} ${n2(r.headL * 0.68)} v${n2(-0.012 * k)}`} className="ps-tube" fill="none" {...SOFT} />
          <path d={`M${n2(-r.headW * 0.1)} ${n2(r.headL * 0.68)} Q${n2(-r.headW * 0.5)} ${n2(r.headL * 0.66)} ${n2(-r.headW * 0.52)} ${n2(r.headL * 0.5)} Q${n2(-r.headW * 0.5)} ${n2(r.headL * 0.9)} 0 ${n2(r.headL * 1.08)} M${n2(r.headW * 0.1)} ${n2(r.headL * 0.68)} Q${n2(r.headW * 0.5)} ${n2(r.headL * 0.66)} ${n2(r.headW * 0.52)} ${n2(r.headL * 0.5)} Q${n2(r.headW * 0.5)} ${n2(r.headL * 0.9)} 0 ${n2(r.headL * 1.08)}`} className="ps-tube" fill="none" {...SOFT} />
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

  // --- Lines to the monitor, drawn over the crew's hands so they read as on top.
  const padJunction: Pt = [junction[0], r.chestY + 0.16 * k];
  const lines = (
    <g>
      {kit.pads && (
        <g>
          {wire(add(padR, [0.02 * k, 0.06 * k]), padJunction, "ps-wire-pad", 0.05 * k)}
          {wire(add(padL, [0.02 * k, 0.06 * k]), padJunction, "ps-wire-pad", -0.02 * k)}
          {wire(padJunction, port, "ps-wire-pad", 0.08 * k)}
        </g>
      )}
      {kit.leads && (
        <g>
          {limb.map((e) => lead(e.at, e.to, e.colour, e.sag, "ps-lead", e.key))}
          {chest.map((e) => lead(e.at, e.to, e.colour, e.sag, "ps-lead-v", e.key))}
          {chest.length > 0 && (
            <g>
              {wire(vYoke, junction, "ps-wire-bundle", 0.03 * k)}
              <rect x={vYoke[0] - 0.022 * k} y={vYoke[1] - 0.015 * k} width={0.044 * k} height={0.03 * k} rx={0.005 * k} fill="#2b3139" {...lineSoft} />
            </g>
          )}
          <circle cx={junction[0]} cy={junction[1]} r={0.022 * k} fill="#2b3139" {...lineSoft} />
          {wire(junction, port, "ps-wire-bundle", 0.1 * k)}
        </g>
      )}
      {kit.capno && kit.oxygen === "bvm" && wire(bvm.at(0.02, 0.016), port, "ps-wire", 0.1 * k)}
      {kit.cuff && wire(add(cuffArm, [r.armW[0] * 1.3, 0]), port, "ps-cuff-tube", 0.12 * k)}
      {kit.probe && wire([A.leftFinger[0], A.leftFinger[1] + 0.03 * k], port, "ps-wire", 0.08 * k)}
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

/** The monitor-defibrillator on the ground: a charcoal case with its carry
 *  handle, a glossy three-channel screen, the mode dial, the charge and shock
 *  buttons, the printer slot and the cable sockets down one side. `at` is
 *  its centre; `portSide` the side the cables leave. */
export function Monitor({ at, k = 1, arrest = false, portSide = -1 }: { at: Pt; k?: number; arrest?: boolean; portSide?: 1 | -1 }) {
  void k;
  const [x, y] = at;
  const W = 0.36, H = 0.31, L = x - W / 2, T = y - H / 2;
  const sx = portSide === -1 ? L - 0.02 : L + W - 0.004;
  const sl = L + 0.022, st = T + 0.034, sw = 0.2, sh = 0.15;
  const tr = traces(sl + 0.008, st + 0.004, sw - 0.062, arrest);
  const dial: Pt = [L + 0.295, T + 0.08];
  return (
    <g className="ps-monitor" filter="url(#pk-drop)">
      <rect x={x - 0.11} y={T - 0.03} width={0.22} height={0.05} rx={0.022} fill="#e0b321" stroke="#6b5410" strokeWidth={0.9} {...SW} />
      <rect x={x - 0.11} y={T - 0.03} width={0.22} height={0.05} rx={0.022} fill="url(#pk-gloss)" />
      <rect x={L} y={T} width={W} height={H} rx={0.024} fill="url(#pk-case)" stroke="#0e1114" strokeWidth={1} {...SW} />
      <rect x={L + 0.007} y={T + 0.007} width={W - 0.014} height={H - 0.014} rx={0.02} fill="none" stroke="#6a7178" strokeWidth={0.6} strokeOpacity={0.5} {...SW} />
      {/* Screen */}
      <rect x={sl} y={st} width={sw} height={sh} rx={0.006} fill="url(#pk-screen)" stroke="#05080b" strokeWidth={1} {...SW} />
      <g stroke="#2a3a2a" strokeWidth={0.4} opacity={0.5}>
        {[0.25, 0.5, 0.75].map((t) => <path key={t} d={`M${n2(sl)} ${n2(st + sh * t)} H${n2(sl + sw)}`} {...SW} />)}
      </g>
      <path d={tr.ecg} fill="none" stroke={arrest ? "#4ddc7a" : "#3ad17f"} strokeWidth={1.1} {...SW} />
      <path d={tr.pleth} fill="none" stroke="#39c6ea" strokeWidth={1} {...SW} />
      <path d={tr.resp} fill="none" stroke="#f3d35a" strokeWidth={1} {...SW} />
      <text x={sl + sw - 0.006} y={st + 0.03} textAnchor="end" fontSize={0.028} fontWeight={800} fill="#3ad17f" fontFamily="Arial, sans-serif">{arrest ? "--" : "96"}</text>
      <text x={sl + sw - 0.006} y={st + 0.066} textAnchor="end" fontSize={0.024} fontWeight={800} fill="#39c6ea" fontFamily="Arial, sans-serif">{arrest ? "--" : "95"}</text>
      <text x={sl + sw - 0.006} y={st + 0.098} textAnchor="end" fontSize={0.016} fontWeight={700} fill="#e6eef5" fontFamily="Arial, sans-serif">--/--</text>
      <text x={sl + sw - 0.006} y={st + sh - 0.01} textAnchor="end" fontSize={0.012} fontWeight={700} fill={arrest ? "#ff5d5d" : "#9fb4c8"} fontFamily="Arial, sans-serif">{arrest ? "VF" : "II"}</text>
      <rect x={sl} y={st} width={sw} height={sh * 0.45} rx={0.006} fill="url(#pk-gloss)" />
      {/* Mode dial */}
      <circle cx={dial[0]} cy={dial[1]} r={0.04} fill="#111518" />
      <circle cx={dial[0]} cy={dial[1]} r={0.033} fill="url(#pk-case)" stroke="#0e1114" strokeWidth={0.8} {...SW} />
      {[-60, -30, 0, 30, 60, 90].map((a) => <path key={a} d={`M${n2(dial[0] + Math.cos(((a - 90) * Math.PI) / 180) * 0.044)} ${n2(dial[1] + Math.sin(((a - 90) * Math.PI) / 180) * 0.044)} l${n2(Math.cos(((a - 90) * Math.PI) / 180) * 0.006)} ${n2(Math.sin(((a - 90) * Math.PI) / 180) * 0.006)}`} stroke="#c9ced3" strokeWidth={0.8} {...SW} />)}
      <path d={`M${n2(dial[0])} ${n2(dial[1])} l0 -0.026`} stroke="#e9ecef" strokeWidth={1.6} strokeLinecap="round" {...SW} />
      {/* Charge and shock */}
      <rect x={L + 0.255} y={T + 0.138} width={0.08} height={0.03} rx={0.006} fill="#e0b321" stroke="#6b5410" strokeWidth={0.7} {...SW} />
      <rect x={L + 0.255} y={T + 0.138} width={0.08} height={0.03} rx={0.006} fill="url(#pk-gloss)" />
      <circle cx={L + 0.295} cy={T + 0.215} r={0.03} fill="#d13b3b" stroke="#5c1313" strokeWidth={0.9} {...SW} />
      <circle cx={L + 0.295} cy={T + 0.215} r={0.03} fill="url(#pk-gloss)" />
      <path d={`M${n2(L + 0.3)} ${n2(T + 0.2)} l-0.012 0.016 h0.009 l-0.008 0.016 l0.016 -0.019 h-0.009 z`} fill="#fff" opacity={0.9} />
      {/* Speaker grille and printer */}
      {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={L + 0.03 + (i % 6) * 0.012} cy={T + 0.2 + Math.floor(i / 6) * 0.012} r={0.003} fill="#0e1114" />)}
      <rect x={L + 0.11} y={T + H - 0.058} width={0.115} height={0.016} rx={0.004} fill="#05080b" />
      <rect x={L + 0.115} y={T + H - 0.056} width={0.105} height={0.005} fill="#e9ecef" opacity={0.8} />
      {/* Sockets */}
      <rect x={sx} y={T + 0.045} width={0.024} height={0.036} rx={0.004} fill="#e9ecef" stroke="#0e1114" strokeWidth={0.7} {...SW} />
      <rect x={sx} y={T + 0.095} width={0.024} height={0.03} rx={0.004} fill="#4a5057" stroke="#0e1114" strokeWidth={0.7} {...SW} />
      <rect x={sx} y={T + 0.138} width={0.024} height={0.024} rx={0.004} fill="#2f6fd6" stroke="#0e1114" strokeWidth={0.7} {...SW} />
      <rect x={sx} y={T + 0.175} width={0.024} height={0.024} rx={0.004} fill="#8a9399" stroke="#0e1114" strokeWidth={0.7} {...SW} />
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
