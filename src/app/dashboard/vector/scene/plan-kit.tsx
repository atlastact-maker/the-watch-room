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
import { type Pt, type Rig, add, sub, mul, unit, perp, lerp, len, deg, P, capsule, anchors, line, lineSoft } from "./plan-figure";

const SOFT = { vectorEffect: "non-scaling-stroke" as const };
const n2 = (v: number) => (Math.round(v * 1000) / 1000).toString();

/** A rounded rectangle centred at c, `along` its long axis. */
function slab(c: Pt, along: Pt, length: number, width: number, props: Record<string, unknown>, rx = width * 0.3): ReactNode {
  const ang = deg(unit(along));
  return <rect x={c[0] - length / 2} y={c[1] - width / 2} width={length} height={width} rx={rx} transform={`rotate(${n2(ang)} ${P(c)})`} {...props} />;
}

/** A wire from a to b that sags sideways a little, the way a cable lies. */
function wire(a: Pt, b: Pt, className: string, sag = 0.12): ReactNode {
  const m = lerp(a, b, 0.5);
  const n = perp(unit(sub(b, a)));
  const c = add(m, mul(n, sag));
  return <path d={`M${P(a)} Q${P(c)} ${P(b)}`} className={className} fill="none" {...SOFT} />;
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
  const padL = A.leftLateral;
  const onChest = (
    <g>
      {kit.pads && (
        <g>
          {slab(padR, [0.55, 1], 0.14 * k, 0.1 * k, { className: "ps-pad" }, 0.02 * k)}
          {slab(padL, [-0.4, 1], 0.14 * k, 0.1 * k, { className: "ps-pad" }, 0.02 * k)}
          <text x={padR[0]} y={padR[1] + 0.012 * k} textAnchor="middle" fontSize={0.035 * k} fontWeight={700} fill="#4f7fa8" fontFamily="Arial, sans-serif" transform={`rotate(${n2(deg([0.55, 1]))} ${P(padR)})`}>+</text>
        </g>
      )}
      {kit.leads && (
        <g>
          <circle cx={padR[0] - 0.05 * k} cy={padR[1] - 0.01 * k} r={0.024 * k} className="ps-electrode" />
          <circle cx={padR[0] - 0.05 * k} cy={padR[1] - 0.01 * k} r={0.011 * k} fill="#e03a3a" />
          <circle cx={A.leftUpperChest[0] + 0.03 * k} cy={A.leftUpperChest[1] - 0.01 * k} r={0.024 * k} className="ps-electrode" />
          <circle cx={A.leftUpperChest[0] + 0.03 * k} cy={A.leftUpperChest[1] - 0.01 * k} r={0.011 * k} fill="#f2c94c" />
          <circle cx={A.leftLower[0]} cy={A.leftLower[1]} r={0.024 * k} className="ps-electrode" />
          <circle cx={A.leftLower[0]} cy={A.leftLower[1]} r={0.011 * k} fill="#3fae3f" />
          <circle cx={A.rightLower[0]} cy={A.rightLower[1]} r={0.024 * k} className="ps-electrode" />
          <circle cx={A.rightLower[0]} cy={A.rightLower[1]} r={0.011 * k} fill="#1b2733" />
        </g>
      )}
      {kit.dressing && (
        <g>
          <rect x={dressingAt[0] - 0.07 * k} y={dressingAt[1] - 0.055 * k} width={0.14 * k} height={0.11 * k} rx={0.012 * k} className="ps-dressing" />
          <ellipse cx={dressingAt[0] + 0.01 * k} cy={dressingAt[1] + 0.005 * k} rx={0.035 * k} ry={0.025 * k} fill="#a82a2a" opacity={0.55} />
          {[-1, 1].map((s) => <rect key={s} x={dressingAt[0] + s * 0.07 * k - 0.012 * k} y={dressingAt[1] - 0.075 * k} width={0.024 * k} height={0.15 * k} rx={0.004 * k} fill="#f3e4c6" opacity={0.9} />)}
        </g>
      )}
      {kit.pelvicBinder && (
        <g>
          <rect x={-r.hipW * 1.35} y={A.hips[1] - 0.1 * k} width={r.hipW * 2.7} height={0.2 * k} rx={0.03 * k} className="ps-binder" />
          <rect x={-0.07 * k} y={A.hips[1] - 0.04 * k} width={0.14 * k} height={0.08 * k} rx={0.01 * k} fill="#1b2733" />
          <path d={`M${n2(-r.hipW * 1.3)} ${n2(A.hips[1])} H${n2(r.hipW * 1.3)}`} stroke="#8a9aa8" strokeWidth={1} {...SOFT} />
        </g>
      )}
      {kit.lucas && (
        <g className="ps-lucas">
          <path d={`M${n2(-r.chestW - 0.08 * k)} ${n2(r.chestY + 0.16 * k)} V${n2(r.chestY - 0.16 * k)} M${n2(r.chestW + 0.08 * k)} ${n2(r.chestY + 0.16 * k)} V${n2(r.chestY - 0.16 * k)}`} stroke="#f7d04b" strokeWidth={0.05 * k} strokeLinecap="round" />
          <path d={`M${n2(-r.chestW - 0.08 * k)} ${n2(r.chestY - 0.02 * k)} H${n2(r.chestW + 0.08 * k)}`} stroke="#f7d04b" strokeWidth={0.07 * k} strokeLinecap="round" />
          <path d={`M${n2(-r.chestW - 0.08 * k)} ${n2(r.chestY - 0.02 * k)} H${n2(r.chestW + 0.08 * k)}`} stroke="#1b2733" strokeWidth={0.02 * k} opacity={0.5} />
          <circle cx={A.sternum[0]} cy={A.sternum[1]} r={0.075 * k} className="ps-plunger cpr" fill="#2b3139" />
          <circle cx={A.sternum[0]} cy={A.sternum[1]} r={0.045 * k} fill="#f7d04b" />
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
  const bagAt = place.bvmHand ?? ([r.headW * 0.9, -0.02 * k] as Pt);
  const o2Line = (from: Pt) => <path d={`M${P(from)} C${P(add(from, [0.25 * k, -0.05 * k]))} ${P(add(o2, [-0.2 * k, 0.15 * k]))} ${P(o2)}`} className="ps-tube" fill="none" {...SOFT} />;
  const maskElastic = (
    <path d={`M${n2(-r.headW * 0.3)} ${n2(r.headL * 0.72)} Q${n2(-r.headW * 0.56)} ${n2(r.headL * 0.6)} ${n2(-r.headW * 0.5)} ${n2(r.headL * 0.45)} M${n2(r.headW * 0.3)} ${n2(r.headL * 0.72)} Q${n2(r.headW * 0.56)} ${n2(r.headL * 0.6)} ${n2(r.headW * 0.5)} ${n2(r.headL * 0.45)}`} stroke="#e6eef5" strokeWidth={1} fill="none" {...SOFT} />
  );
  const over = (
    <g>
      {kit.collar && (
        <g>
          <rect x={-r.neckW * 1.9} y={A.neck[1] - 0.05 * k} width={r.neckW * 3.8} height={0.11 * k} rx={0.03 * k} className="ps-collar" />
          <path d={`M${n2(-r.neckW * 0.9)} ${n2(A.neck[1] - 0.05 * k)} Q0 ${n2(r.headL * 0.93)} ${n2(r.neckW * 0.9)} ${n2(A.neck[1] - 0.05 * k)}`} className="ps-collar" />
          <path d={`M${n2(-r.neckW * 1.8)} ${n2(A.neck[1] + 0.01 * k)} H${n2(r.neckW * 1.8)}`} stroke="#5fb4ff" strokeWidth={1.2} {...SOFT} fill="none" />
        </g>
      )}
      {kit.cuff && (
        <g>
          {slab(cuffArm, cuffAlong, 0.15 * k, r.armW[0] * 2.9, { className: "ps-cuff" }, 0.015 * k)}
          {slab(add(cuffArm, mul(unit(cuffAlong), 0.045 * k)), cuffAlong, 0.03 * k, r.armW[0] * 2.9, { fill: "#2b3139", opacity: 0.35 }, 0.004 * k)}
        </g>
      )}
      {kit.probe && (
        <g>
          <rect x={A.leftFinger[0] - 0.02 * k} y={A.leftFinger[1] - 0.045 * k} width={0.04 * k} height={0.07 * k} rx={0.012 * k} fill="#2b3139" {...lineSoft} />
          <circle cx={A.leftFinger[0]} cy={A.leftFinger[1] - 0.025 * k} r={0.009 * k} className="ps-probe" />
        </g>
      )}
      {kit.iv && (
        <g>
          {slab(ivHand, ivAlong, 0.09 * k, 0.07 * k, { fill: "#ffffff", opacity: 0.55 }, 0.008 * k)}
          {slab(add(ivHand, mul(unit(ivAlong), -0.02 * k)), ivAlong, 0.035 * k, 0.018 * k, { fill: "#e07aa0", ...lineSoft }, 0.006 * k)}
          <path d={`M${P(ivHand)} C${P(add(ivHand, [-0.15 * k, -0.1 * k]))} ${P(add(place.ivAt ?? [ivHand[0] - 0.42 * k, ivHand[1] + 0.1 * k], [0.05 * k, 0.1 * k]))} ${P(place.ivAt ?? [ivHand[0] - 0.42 * k, ivHand[1] + 0.1 * k])}`} className="ps-line" fill="none" {...SOFT} />
          {!place.ivAt && <DripBag at={[ivHand[0] - 0.42 * k, ivHand[1] + 0.1 * k]} k={k} lying />}
        </g>
      )}
      {kit.splint && (
        <g>
          {slab(lerp(thighA, legC, 0.55), sub(legC, thighA), len(sub(legC, thighA)) * 1.05, r.legW[0] * 2.6, { className: "ps-splint" }, 0.02 * k)}
          {[0.25, 0.75].map((t) => <g key={t}>{slab(lerp(thighA, legC, t), perp(sub(legC, thighA)), r.legW[0] * 2.9, 0.035 * k, { fill: "#1b2733", opacity: 0.8 }, 0.004 * k)}</g>)}
        </g>
      )}
      {kit.tourniquet && (
        <g>
          {slab(lerp(legA, legB, 0.25), sub(legB, legA), 0.06 * k, r.legW[0] * 2.5, { className: "ps-tourniquet" }, 0.006 * k)}
          <path d={`M${P(add(lerp(legA, legB, 0.25), [legSide * r.legW[0] * 1.25, 0]))} l${n2(legSide * 0.14 * k)} ${n2(-0.03 * k)}`} stroke="#1b2733" strokeWidth={0.02 * k} strokeLinecap="round" />
          <rect x={lerp(legA, legB, 0.25)[0] - legSide * r.legW[0] - 0.02 * k - (legSide === 1 ? 0.03 * k : 0)} y={lerp(legA, legB, 0.25)[1] - 0.05 * k} width={0.05 * k} height={0.03 * k} fill="#ffffff" {...lineSoft} />
        </g>
      )}
      {kit.blanket && (
        <g>
          <path d={`M${n2(-r.hipW * 1.55)} ${n2(r.chestY + 0.06 * k)} Q0 ${n2(r.chestY - 0.02 * k)} ${n2(r.hipW * 1.55)} ${n2(r.chestY + 0.06 * k)} L${n2(r.hipW * 1.6)} ${n2(r.bottom + 0.12 * k)} H${n2(-r.hipW * 1.6)} Z`} className="ps-blanket" />
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
          <path d={`M${n2(-r.headW * 0.3)} ${n2(r.headL * 0.72)} Q${n2(-r.headW * 0.32)} ${n2(r.headL * 0.52)} 0 ${n2(r.headL * 0.5)} Q${n2(r.headW * 0.32)} ${n2(r.headL * 0.52)} ${n2(r.headW * 0.3)} ${n2(r.headL * 0.72)} Q${n2(r.headW * 0.28)} ${n2(r.headL * 0.95)} 0 ${n2(r.headL * 0.98)} Q${n2(-r.headW * 0.28)} ${n2(r.headL * 0.95)} ${n2(-r.headW * 0.3)} ${n2(r.headL * 0.72)} Z`} className="ps-mask" />
          <path d={`M${n2(-r.headW * 0.1)} ${n2(r.headL * 0.6)} Q0 ${n2(r.headL * 0.56)} ${n2(r.headW * 0.1)} ${n2(r.headL * 0.6)}`} stroke="#ffffff" strokeWidth={1} fill="none" opacity={0.7} {...SOFT} />
          {kit.oxygen === "nrb" && <ellipse cx={0} cy={r.headL * 1.12} rx={0.045 * k} ry={0.11 * k} className="ps-bag-nrb" />}
          {o2Line([0, r.headL * (kit.oxygen === "nrb" ? 1.23 : 0.98)])}
        </g>
      )}
      {kit.airway === "igel" && (
        <g>
          <path d={`M${n2(-r.headW * 0.28)} ${n2(r.headL * 0.72)} Q${n2(-r.headW * 0.5)} ${n2(r.headL * 0.6)} ${n2(-r.headW * 0.5)} ${n2(r.headL * 0.45)} M${n2(r.headW * 0.28)} ${n2(r.headL * 0.72)} Q${n2(r.headW * 0.5)} ${n2(r.headL * 0.6)} ${n2(r.headW * 0.5)} ${n2(r.headL * 0.45)}`} stroke="#e6eef5" strokeWidth={1} fill="none" {...SOFT} />
          <rect x={-0.03 * k} y={mouth[1] - 0.03 * k} width={0.06 * k} height={0.07 * k} rx={0.012 * k} className="ps-igel" />
          <rect x={-0.014 * k} y={mouth[1] - 0.045 * k} width={0.028 * k} height={0.03 * k} fill="#e6eef5" {...lineSoft} />
        </g>
      )}
      {kit.airway === "tube" && (
        <g>
          <rect x={-0.012 * k} y={mouth[1] - 0.04 * k} width={0.024 * k} height={0.09 * k} rx={0.008 * k} className="ps-ett" />
          <path d={`M${n2(-r.headW * 0.5)} ${n2(r.headL * 0.78)} H${n2(r.headW * 0.5)}`} stroke="#f3d35a" strokeWidth={1.3} {...SOFT} fill="none" />
        </g>
      )}
      {kit.oxygen === "bvm" && (
        <g className="ps-bvm">
          {kit.airway === "none" && (
            <path d={`M${n2(-r.headW * 0.3)} ${n2(r.headL * 0.72)} Q${n2(-r.headW * 0.32)} ${n2(r.headL * 0.52)} 0 ${n2(r.headL * 0.5)} Q${n2(r.headW * 0.32)} ${n2(r.headL * 0.52)} ${n2(r.headW * 0.3)} ${n2(r.headL * 0.72)} Q${n2(r.headW * 0.28)} ${n2(r.headL * 0.95)} 0 ${n2(r.headL * 0.98)} Q${n2(-r.headW * 0.28)} ${n2(r.headL * 0.95)} ${n2(-r.headW * 0.3)} ${n2(r.headL * 0.72)} Z`} className="ps-mask" />
          )}
          {kit.capno && <rect x={lerp(mouth, bagAt, 0.22)[0] - 0.03 * k} y={lerp(mouth, bagAt, 0.22)[1] - 0.02 * k} width={0.06 * k} height={0.04 * k} rx={0.006 * k} className="ps-capno" />}
          <path d={`M${P(add(mouth, [0, -0.04 * k]))} L${P(lerp(mouth, bagAt, 0.35))}`} className="ps-tube" fill="none" {...SOFT} strokeWidth={2} />
          {slab(lerp(mouth, bagAt, 0.68), sub(bagAt, mouth), 0.24 * k, 0.13 * k, { className: "ps-bag-bvm" }, 0.06 * k)}
          {slab(lerp(mouth, bagAt, 0.98), sub(bagAt, mouth), 0.14 * k, 0.07 * k, { fill: "#dfe8ef", opacity: 0.6, ...lineSoft }, 0.035 * k)}
          {o2Line(lerp(mouth, bagAt, 1.05))}
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
          {wire([padR[0] - 0.05 * k, padR[1] - 0.01 * k], junction, "ps-wire", 0.08 * k)}
          {wire([A.leftUpperChest[0] + 0.03 * k, A.leftUpperChest[1] - 0.01 * k], junction, "ps-wire", -0.05 * k)}
          {wire(A.leftLower, junction, "ps-wire", 0.02 * k)}
          {wire(A.rightLower, junction, "ps-wire", 0.06 * k)}
          <circle cx={junction[0]} cy={junction[1]} r={0.022 * k} fill="#2b3139" {...lineSoft} />
          {wire(junction, port, "ps-wire-bundle", 0.1 * k)}
        </g>
      )}
      {kit.cuff && wire(add(cuffArm, [r.armW[0] * 1.3, 0]), port, "ps-cuff-tube", 0.12 * k)}
      {kit.probe && wire([A.leftFinger[0], A.leftFinger[1] + 0.03 * k], port, "ps-wire", 0.08 * k)}
    </g>
  );
  return { under, onChest, over, lines };
}

// ---------------------------------------------------------------------------
// Kit on the ground, from above
// ---------------------------------------------------------------------------

/** The monitor-defibrillator: a case with its screen and the cable side. `at` is its centre. */
export function Monitor({ at, k = 1, arrest = false }: { at: Pt; k?: number; arrest?: boolean }) {
  const [x, y] = at;
  const W = 0.32 * k, H = 0.3 * k;
  return (
    <g className="ps-monitor">
      <ellipse cx={x + 0.02 * k} cy={y + 0.03 * k} rx={W * 0.6} ry={H * 0.6} fill="url(#ps-shadow)" />
      <rect x={x - W / 2} y={y - H / 2} width={W} height={H} rx={0.03 * k} fill="#3b4148" {...line} />
      <rect x={x - W / 2 + 0.02 * k} y={y - H / 2 + 0.02 * k} width={W - 0.04 * k} height={0.05 * k} rx={0.01 * k} fill="#f3d35a" />
      <rect x={x - W / 2 + 0.03 * k} y={y - H / 2 + 0.09 * k} width={W - 0.06 * k} height={0.13 * k} rx={0.008 * k} fill="#0b1620" />
      <path d={`M${n2(x - W / 2 + 0.045 * k)} ${n2(y - H / 2 + 0.16 * k)} h${n2(0.03 * k)} l${n2(0.012 * k)} ${n2(-0.03 * k)} l${n2(0.018 * k)} ${n2(0.055 * k)} l${n2(0.014 * k)} ${n2(-0.04 * k)} l${n2(0.012 * k)} ${n2(0.015 * k)} h${n2(0.05 * k)} l${n2(0.012 * k)} ${n2(-0.025 * k)} l${n2(0.016 * k)} ${n2(0.045 * k)} l${n2(0.012 * k)} ${n2(-0.035 * k)} h${n2(0.04 * k)}`} className={`ps-mon-trace${arrest ? " vf" : ""}`} fill="none" />
      <text x={x + W / 2 - 0.04 * k} y={y - H / 2 + 0.135 * k} textAnchor="end" fontSize={0.028 * k} fontWeight={700} fill="#3ad17f" fontFamily="monospace">{arrest ? "VF" : "HR"}</text>
      {[0, 1, 2, 3].map((i) => <rect key={i} x={x - W / 2 + 0.035 * k + i * 0.06 * k} y={y + H / 2 - 0.055 * k} width={0.04 * k} height={0.025 * k} rx={0.004 * k} fill={i === 3 ? "#e03a3a" : i === 2 ? "#f3d35a" : "#5a6470"} />)}
      <rect x={x - W / 2 - 0.02 * k} y={y - 0.04 * k} width={0.025 * k} height={0.09 * k} rx={0.006 * k} fill="#1b2733" />
      <rect x={x - 0.06 * k} y={y - H / 2 - 0.035 * k} width={0.12 * k} height={0.03 * k} rx={0.012 * k} fill="#2b3139" {...lineSoft} />
    </g>
  );
}

/** The response bag, open on the ground, `at` its centre; `along` the direction it points. */
export function KitBag({ at, k = 1, open = true, colour = "#1f8a4c" }: { at: Pt; k?: number; open?: boolean; colour?: string }) {
  const [x, y] = at;
  const W = 0.62 * k, H = 0.4 * k;
  return (
    <g className="ps-kitbag">
      <ellipse cx={x + 0.02 * k} cy={y + 0.03 * k} rx={W * 0.58} ry={H * 0.62} fill="url(#ps-shadow)" />
      <rect x={x - W / 2} y={y - H / 2} width={W} height={H} rx={0.05 * k} fill={colour} {...line} />
      <rect x={x - W / 2} y={y - H / 2} width={W} height={H} rx={0.05 * k} fill="url(#ps-round)" opacity={0.5} />
      {open ? (
        <g>
          <rect x={x - W / 2 + 0.03 * k} y={y - H / 2 + 0.03 * k} width={W - 0.06 * k} height={H - 0.06 * k} rx={0.03 * k} fill="#2b3139" />
          {[[0, 0, "#4a78b5"], [1, 0, "#e9ecef"], [2, 0, "#e03a3a"], [0, 1, "#f3d35a"], [1, 1, "#9fc4dd"], [2, 1, "#e9ecef"]].map(([i, j, c]) => (
            <rect key={`${i}${j}`} x={x - W / 2 + 0.05 * k + (i as number) * 0.18 * k} y={y - H / 2 + 0.05 * k + (j as number) * 0.16 * k} width={0.15 * k} height={0.13 * k} rx={0.015 * k} fill={c as string} opacity={0.95} {...lineSoft} />
          ))}
          <rect x={x - W / 2 - 0.02 * k} y={y - H / 2 - 0.12 * k} width={W + 0.04 * k} height={0.12 * k} rx={0.03 * k} fill={colour} {...line} />
          <rect x={x - W / 2 + 0.06 * k} y={y - H / 2 - 0.08 * k} width={W - 0.12 * k} height={0.04 * k} rx={0.01 * k} fill="#f3d35a" opacity={0.8} />
        </g>
      ) : (
        <g>
          <rect x={x - W / 2 + 0.05 * k} y={y - 0.03 * k} width={W - 0.1 * k} height={0.06 * k} rx={0.01 * k} fill="#f3d35a" opacity={0.8} />
          <path d={`M${n2(x - 0.12 * k)} ${n2(y - H / 2)} v${n2(H)} M${n2(x + 0.12 * k)} ${n2(y - H / 2)} v${n2(H)}`} stroke="#0f4d2a" strokeWidth={1.2} {...SOFT} fill="none" />
        </g>
      )}
    </g>
  );
}

/** A portable oxygen cylinder lying on the ground with its regulator at the `at` end. */
export function O2Cylinder({ at, k = 1, angle = 90 }: { at: Pt; k?: number; angle?: number }) {
  const [x, y] = at;
  const L = 0.48 * k, D = 0.12 * k;
  return (
    <g transform={`rotate(${n2(angle)} ${n2(x)} ${n2(y)})`}>
      <ellipse cx={x + L / 2} cy={y + 0.03 * k} rx={L * 0.55} ry={D * 0.7} fill="url(#ps-shadow)" />
      <rect x={x + 0.06 * k} y={y - D / 2} width={L} height={D} rx={D / 2} fill="#e9ecef" {...line} />
      <rect x={x + 0.06 * k} y={y - D / 2} width={L} height={D} rx={D / 2} fill="url(#ps-round-v)" opacity={0.7} />
      <rect x={x + 0.06 * k} y={y - D / 2} width={0.16 * k} height={D} rx={D / 2} fill="#3fae3f" opacity={0.9} />
      <rect x={x - 0.02 * k} y={y - 0.035 * k} width={0.09 * k} height={0.07 * k} rx={0.01 * k} fill="#2b3139" {...lineSoft} />
      <circle cx={x - 0.01 * k} cy={y - 0.045 * k} r={0.022 * k} fill="#e9ecef" {...lineSoft} />
      <text x={x + 0.33 * k} y={y + 0.012 * k} textAnchor="middle" fontSize={0.035 * k} fontWeight={800} fill="#2b3139" fontFamily="Arial, sans-serif" opacity={0.7}>O₂</text>
    </g>
  );
}

/** A bag of fluid: hanging (drawn as the bag hangs below the hook) or lying flat. */
export function DripBag({ at, k = 1, lying = false }: { at: Pt; k?: number; lying?: boolean }) {
  const [x, y] = at;
  const W = 0.1 * k, H = 0.17 * k;
  return (
    <g transform={lying ? `rotate(20 ${n2(x)} ${n2(y)})` : undefined}>
      <rect x={x - W / 2} y={lying ? y - H / 2 : y} width={W} height={H} rx={0.015 * k} className="ps-bag" />
      <rect x={x - W / 2 + 0.015 * k} y={(lying ? y - H / 2 : y) + 0.04 * k} width={W - 0.03 * k} height={0.05 * k} fill="#ffffff" opacity={0.7} />
      <rect x={x - 0.008 * k} y={(lying ? y - H / 2 : y) + H} width={0.016 * k} height={0.03 * k} fill="#9aa0a6" />
    </g>
  );
}

/** Not a prop: the little blood pool class is in the CSS. Re-exported helpers for the scene. */
export { capsule };
