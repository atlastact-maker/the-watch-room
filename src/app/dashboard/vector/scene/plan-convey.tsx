"use client";

// HOW THE PATIENT LEAVES. What they are moved on, drawn under them from
// above: the Stryker trolley, the carry chair, the carry sheet, the
// vacuum mattress. It comes in beside the patient when the move starts,
// the crew lift them onto it, and it stays under them until the scene
// moves to the back of the vehicle.

import type { CSSProperties, ReactNode } from "react";
import type { EgressAction } from "@/lib/sim/incident_types";
import { type Rig, line } from "./plan-figure";
import { Trolley } from "./plan-ground";

const SW = { vectorEffect: "non-scaling-stroke" as const, strokeLinejoin: "round" as const };
const n2 = (v: number) => (Math.round(v * 10000) / 10000).toString();

/** The folding carry chair: a seat under the hips, the back bar across the
 *  shoulders, the two handles up past the head, the wheels behind, the
 *  footrest under the heels. A wheelchair is the same with big wheels. */
function Chair({ r, wheelchair }: { r: Rig; wheelchair: boolean }): ReactNode {
  const k = r.k;
  const hw = r.hipW + 0.08 * k, sw = r.shoulderW + 0.1 * k;
  const seatY = r.hipY - 0.2 * k, seatH = 0.5 * k;
  const wheelR = wheelchair ? 0.3 * k : 0.09 * k, wheelY = wheelchair ? r.hipY + 0.05 * k : r.hipY + 0.32 * k;
  return (
    <g>
      {/* Wheels first, under everything. */}
      {[-1, 1].map((side) => (
        <g key={side}>
          <circle cx={side * (hw + 0.1 * k)} cy={wheelY} r={wheelR} fill="#1f2326" {...line} />
          <circle cx={side * (hw + 0.1 * k)} cy={wheelY} r={wheelR * 0.6} fill="#3a4046" />
          <circle cx={side * (hw + 0.1 * k)} cy={wheelY} r={wheelR * 0.18} fill="#9aa0a6" />
        </g>
      ))}
      {/* Handles, up past the head. */}
      {[-1, 1].map((side) => (
        <g key={side}>
          <rect x={side * sw - 0.03 * k} y={-0.34 * k} width={0.06 * k} height={0.5 * k} rx={0.02 * k} fill="#15191c" {...line} />
          <rect x={side * sw - 0.035 * k} y={-0.34 * k} width={0.07 * k} height={0.16 * k} rx={0.03 * k} fill="#f0b90b" stroke="#6b5a0a" strokeWidth={0.6} {...SW} />
        </g>
      ))}
      {/* The back bar and the seat. */}
      <rect x={-sw} y={r.shoulderY - 0.07 * k} width={sw * 2} height={0.12 * k} rx={0.03 * k} fill="#15191c" {...line} />
      <rect x={-hw} y={seatY} width={hw * 2} height={seatH} rx={0.05 * k} fill="#15191c" {...line} />
      <rect x={-hw + 0.03 * k} y={seatY + 0.03 * k} width={hw * 2 - 0.06 * k} height={seatH - 0.06 * k} rx={0.04 * k} fill="#2b3035" />
      <rect x={-hw + 0.03 * k} y={seatY + 0.03 * k} width={hw * 2 - 0.06 * k} height={seatH - 0.06 * k} rx={0.04 * k} fill="url(#ps-round)" opacity={0.5} />
      {/* Footrest under the heels. */}
      <rect x={-0.2 * k} y={r.bottom - 0.04 * k} width={0.4 * k} height={0.09 * k} rx={0.02 * k} fill="#3a4046" {...line} />
      <path d={`M${n2(-0.16 * k)} ${n2(r.bottom + 0.005 * k)} H${n2(0.16 * k)}`} stroke="#f0b90b" strokeWidth={0.8} {...SW} />
    </g>
  );
}

/** The orange carry sheet with its handles along both edges. */
function Sheet({ r }: { r: Rig }): ReactNode {
  const k = r.k;
  const w = r.shoulderW * 1.3, top = -0.12 * k, h = r.bottom + 0.24 * k;
  return (
    <g>
      {[0.12, 0.38, 0.64, 0.9].map((t) => (
        <g key={t}>
          <rect x={-w - 0.13 * k} y={top + h * t - 0.025 * k} width={0.14 * k} height={0.05 * k} rx={0.02 * k} fill="#1b2733" />
          <rect x={w - 0.01 * k} y={top + h * t - 0.025 * k} width={0.14 * k} height={0.05 * k} rx={0.02 * k} fill="#1b2733" />
        </g>
      ))}
      <rect x={-w} y={top} width={w * 2} height={h} rx={0.06 * k} fill="#e8731f" {...line} />
      <rect x={-w} y={top} width={w * 2} height={h} rx={0.06 * k} fill="url(#pk-weave)" />
      <path d={`M${n2(-w + 0.05 * k)} ${n2(top + 0.05 * k)} V${n2(top + h - 0.05 * k)} M${n2(w - 0.05 * k)} ${n2(top + 0.05 * k)} V${n2(top + h - 0.05 * k)}`} stroke="#9a4a10" strokeWidth={0.6} strokeDasharray="0.02 0.012" {...SW} />
    </g>
  );
}

/** The vacuum mattress: a grey slab moulded round the patient, strapped across. */
function Mattress({ r }: { r: Rig }): ReactNode {
  const k = r.k;
  const w = r.shoulderW * 1.4, top = -0.18 * k, h = r.bottom + 0.36 * k;
  return (
    <g>
      <rect x={-w} y={top} width={w * 2} height={h} rx={0.2 * k} fill="#4f5d6b" {...line} />
      <rect x={-w + 0.04 * k} y={top + 0.04 * k} width={w * 2 - 0.08 * k} height={h - 0.08 * k} rx={0.17 * k} fill="#5b6a79" />
      <rect x={-w} y={top} width={w * 2} height={h} rx={0.2 * k} fill="url(#ps-round)" opacity={0.6} />
      {[0.2, 0.42, 0.64, 0.86].map((t) => (
        <g key={t}>
          <rect x={-w - 0.02 * k} y={top + h * t - 0.03 * k} width={w * 2 + 0.04 * k} height={0.06 * k} fill="#1b1b1b" opacity={0.9} />
          <rect x={-0.06 * k} y={top + h * t - 0.035 * k} width={0.12 * k} height={0.07 * k} rx={0.01 * k} fill="#3a4046" stroke="#0e1114" strokeWidth={0.5} {...SW} />
        </g>
      ))}
      <circle cx={0.3 * k} cy={top + h - 0.1 * k} r={0.03 * k} fill="#c0392b" stroke="#1b1b1b" strokeWidth={0.6} {...SW} />
    </g>
  );
}

export function Conveyance({ action, r, loading }: { action: EgressAction; r: Rig; loading: boolean }): ReactNode {
  let body: ReactNode = null;
  if (action === "trolley") body = <Trolley x={0} y={0} />;
  else if (action === "carry_chair" || action === "wheelchair") body = <Chair r={r} wheelchair={action === "wheelchair"} />;
  else if (action === "carry_sheet") body = <Sheet r={r} />;
  else if (action === "vacuum_mattress") body = <Mattress r={r} />;
  if (!body) return null;
  // It comes in from the patient's left while the crew lift.
  return <g className={loading ? "ps-convey ps-convey-in" : "ps-convey"} style={{ "--ps-dx": `${n2(0.9 * r.k)}px` } as CSSProperties}>{body}</g>;
}
