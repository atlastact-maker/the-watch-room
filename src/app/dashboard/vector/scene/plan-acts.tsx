"use client";

// WHAT IS BEING DONE RIGHT NOW. The record says a cannula went in or a
// dose was given; for the seconds it takes, the scene shows it happening
// where it happens: the cannula sliding into the back of the hand and its
// dressing going on, a syringe pushed through the port or into the thigh,
// a tablet to the mouth, a spray under the tongue, a nebuliser misting.
// Each plays once from the moment of the event, then the kit it leaves
// behind — drawn by plan-kit — takes over.

import type { CSSProperties, ReactNode } from "react";
import type { PatientLook, SceneAct } from "@/lib/sim/patient_look";
import { type Pt, type Rig, anchors, sub, add, mul, unit, deg, P } from "./plan-figure";

const SW = { vectorEffect: "non-scaling-stroke" as const, strokeLinejoin: "round" as const };
const n2 = (v: number) => (Math.round(v * 10000) / 10000).toString();

/** The cannula site: the back of the right hand, the line running up the arm. */
export function ivSite(r: Rig): { at: Pt; along: Pt } {
  const A = anchors(r);
  return { at: A.rightHandBack, along: sub(r.armR.d, r.armR.c) };
}

/** Where an act is drawn, for the label over it. */
export function actSite(r: Rig, act: SceneAct): Pt {
  const A = anchors(r);
  if (act.site === "iv") return ivSite(r).at;
  if (act.site === "thigh") return A.rightThigh;
  return A.mouth;
}

/** A cannula sliding in from beyond the knuckles to the hub plan-kit draws
 *  once it is in, 2 cm up the arm from the site; the flashback shows in
 *  the chamber as it finds the vein, then the dressing goes over it. */
function Cannula({ k }: { k: number }) {
  const hubX = -0.02 * k;
  return (
    <g>
      <g className="ps-act-cannula" style={{ "--ps-slide": `${n2(0.09 * k)}px` } as CSSProperties}>
        <path d={`M${n2(hubX - 0.03 * k)} 0 H${n2(hubX)}`} stroke="#dfe8ef" strokeWidth={1} strokeOpacity={0.9} {...SW} />
        <rect x={hubX} y={-0.007 * k} width={0.014 * k} height={0.014 * k} rx={0.002 * k} fill="#e07aa0" stroke="#1b2733" strokeWidth={0.5} strokeOpacity={0.6} {...SW} />
        <rect x={hubX + 0.002 * k} y={-0.02 * k} width={0.009 * k} height={0.04 * k} rx={0.002 * k} fill="#e07aa0" opacity={0.9} />
        <rect x={hubX + 0.014 * k} y={-0.005 * k} width={0.024 * k} height={0.01 * k} rx={0.002 * k} fill="rgba(255,255,255,0.9)" stroke="#9aa0a6" strokeWidth={0.5} {...SW} />
        <circle className="ps-act-flash" cx={hubX + 0.021 * k} cy={0} r={0.0035 * k} fill="#c0392b" />
        <rect x={hubX + 0.038 * k} y={-0.004 * k} width={0.008 * k} height={0.008 * k} fill="#f4f6f8" stroke="#9aa0a6" strokeWidth={0.5} {...SW} />
      </g>
      <g className="ps-act-dress">
        <rect x={-0.045 * k} y={-0.035 * k} width={0.09 * k} height={0.07 * k} rx={0.008 * k} fill="#ffffff" opacity={0.5} stroke="#dfe8ef" strokeWidth={0.5} {...SW} />
      </g>
    </g>
  );
}

/** A 10 ml syringe lying along +x with its tip at the origin: the barrel
 *  with its graduations, the fluid, and the plunger pushed home over the
 *  act. With `needle`, the needle runs on from the tip. */
function Syringe({ k, needle }: { k: number; needle: boolean }) {
  const L = 0.11 * k, w = 0.02 * k;
  return (
    <g>
      {needle && <path d={`M${n2(-0.03 * k)} 0 H0`} stroke="#c9ced3" strokeWidth={0.9} {...SW} />}
      <rect x={0} y={-0.004 * k} width={0.012 * k} height={0.008 * k} fill="#dfe8ef" stroke="#9aa0a6" strokeWidth={0.5} {...SW} />
      <rect x={0.012 * k} y={-w / 2} width={L} height={w} rx={0.003 * k} fill="rgba(255,255,255,0.86)" stroke="#9aa0a6" strokeWidth={0.6} {...SW} />
      <g className="ps-act-fluid"><rect x={0.012 * k} y={-w / 2 + 0.002 * k} width={0.085 * k} height={w - 0.004 * k} fill="#9fd3ff" opacity={0.55} /></g>
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${n2(0.02 * k + i * 0.011 * k)} ${n2(-w / 2)} v${n2(i % 2 ? 0.005 * k : 0.008 * k)}`} stroke="#5f666d" strokeWidth={0.5} {...SW} />)}
      <g className="ps-act-plunger" style={{ "--ps-push": `${n2(-0.065 * k)}px` } as CSSProperties}>
        <rect x={0.097 * k} y={-w / 2 + 0.002 * k} width={0.012 * k} height={w - 0.004 * k} rx={0.002 * k} fill="#2f3e4e" />
        <path d={`M${n2(0.109 * k)} 0 H${n2(0.16 * k)}`} stroke="#3b6fb0" strokeWidth={1.6} {...SW} />
        <rect x={0.16 * k} y={-w * 0.7} width={0.007 * k} height={w * 1.4} rx={0.002 * k} fill="#3b6fb0" />
      </g>
      <rect x={0.12 * k} y={-w * 0.8} width={0.006 * k} height={w * 1.6} rx={0.002 * k} fill="#dfe8ef" stroke="#9aa0a6" strokeWidth={0.5} {...SW} />
    </g>
  );
}

/** A tablet carried to the mouth. */
function Tablet({ k }: { k: number }) {
  return (
    <g className="ps-act-tablet" style={{ "--ps-dx": `${n2(0.12 * k)}px`, "--ps-dy": `${n2(-0.07 * k)}px` } as CSSProperties}>
      <circle r={0.011 * k} fill="#f4f6f8" stroke="#9aa0a6" strokeWidth={0.6} {...SW} />
      <path d={`M${n2(-0.008 * k)} 0 H${n2(0.008 * k)}`} stroke="#c9ced3" strokeWidth={0.6} {...SW} />
    </g>
  );
}

/** A GTN spray at the lips, and the puff under the tongue. */
function Spray({ k }: { k: number }) {
  return (
    <g>
      <g className="ps-act-spray">
        <g transform={`translate(${n2(0.05 * k)} ${n2(-0.045 * k)}) rotate(35)`}>
          <rect x={-0.009 * k} y={0} width={0.018 * k} height={0.055 * k} rx={0.004 * k} fill="#c0392b" stroke="#5c1313" strokeWidth={0.5} {...SW} />
          <rect x={-0.005 * k} y={-0.012 * k} width={0.01 * k} height={0.014 * k} rx={0.002 * k} fill="#f4f6f8" stroke="#9aa0a6" strokeWidth={0.5} {...SW} />
        </g>
      </g>
      {[0, 1, 2].map((i) => (
        <circle key={i} className="ps-act-mist" style={{ animationDelay: `${(0.5 + i * 0.12).toFixed(2)}s` }} cx={0.012 * k - i * 0.006 * k} cy={-0.012 * k + i * 0.004 * k} r={0.008 * k + i * 0.004 * k} fill="#dfe8ef" />
      ))}
    </g>
  );
}

/** Mist off a nebuliser, rising from the mask while it runs. */
function Mist({ k }: { k: number }) {
  return (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} className="ps-act-puff" style={{ animationDelay: `${(i * 0.4).toFixed(1)}s`, "--ps-dy": `${n2(-0.06 * k)}px` } as CSSProperties} cx={(i - 1.5) * 0.014 * k} cy={-0.01 * k} r={0.01 * k + (i % 2) * 0.004 * k} fill="#dfe8ef" />
      ))}
    </g>
  );
}

export function Acts({ look, r }: { look: PatientLook; r: Rig }): ReactNode {
  const acts = look.fx.acts;
  if (!acts.length) return null;
  const k = r.k;
  const A = anchors(r);
  const iv = ivSite(r);
  const ivDeg = deg(iv.along);
  return (
    <g className="ps-acts">
      {acts.map((a) => {
        const key = `${a.kind}-${a.at}`;
        if (a.kind === "cannula") {
          return <g key={key} className="ps-act long" transform={`translate(${P(iv.at)}) rotate(${n2(ivDeg)})`}><Cannula k={k} /></g>;
        }
        if (a.kind === "syringe" && a.site === "iv") {
          // Through the port on the cannula, the barrel lying down the hand.
          const tip = add(iv.at, mul(unit(iv.along), -0.006 * k));
          return <g key={key} className="ps-act" transform={`translate(${P(tip)}) rotate(${n2(ivDeg)})`}><Syringe k={k} needle={false} /></g>;
        }
        if (a.kind === "syringe") {
          // Into the outer thigh, from the patient's right side.
          return (
            <g key={key} className="ps-act" transform={`translate(${P(A.rightThigh)}) rotate(160)`}>
              <g className="ps-act-jab" style={{ "--ps-slide": `${n2(0.035 * k)}px` } as CSSProperties}>
                <g transform={`translate(${n2(0.03 * k)} 0)`}><Syringe k={k} needle /></g>
              </g>
            </g>
          );
        }
        const mouth = `translate(${P(A.mouth)})`;
        if (a.kind === "tablet") return <g key={key} className="ps-act" transform={mouth}><Tablet k={k} /></g>;
        if (a.kind === "spray") return <g key={key} className="ps-act" transform={mouth}><Spray k={k} /></g>;
        return <g key={key} className="ps-act" transform={mouth}><Mist k={k} /></g>;
      })}
    </g>
  );
}
