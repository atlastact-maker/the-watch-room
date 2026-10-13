"use client";

// THE GROUND UNDER THE PATIENT. What is beneath and around someone, seen
// from above: the hall floorboards and the doormat, the kitchen tiles and
// the dropped mug, the pitch with its white line and the ball, the
// pavement with the kerb and the drain, the platform's yellow line and
// the rails beyond, the ward bed, the trolley in the back of the
// ambulance, the car's seat and steering wheel. Each setting is a
// surface pattern in metres, the thing the patient is on, a few props
// that say where this is, and where the crew kneel and the kit goes.

import type { ReactNode } from "react";
import type { SceneSetting } from "@/lib/sim/scene_setting";
import { type Pt, type Rig, P, smooth, capsule, darken, mix, line, lineSoft, INK } from "./plan-figure";

const SOFT = { vectorEffect: "non-scaling-stroke" as const };
const n2 = (v: number) => (Math.round(v * 1000) / 1000).toString();

export type Ambient = { night: boolean; rain: boolean };

export type GroundCtx = {
  r: Rig;
  k: number;
  amb: Ambient;
  title: string;
  type: string;
  /** The patient is sat (on a chair, the stairs, the floor) rather than lying. */
  seated: boolean;
  /** Label words, for the odd thing they say ("sofa", "armchair", "in bed"). */
  label: string;
};

export type CrewArrangement = "sides" | "bedside" | "car" | "water" | "ledge";

export type GroundSpec = {
  ground: (c: GroundCtx) => ReactNode;
  /** What the patient is on: bed, trolley, chair, seat. Drawn under the figure. */
  under?: (c: GroundCtx) => ReactNode;
  /** Drawn over the figure: a wheel over the lap, water over the body, a duvet. */
  over?: (c: GroundCtx) => ReactNode;
  outdoor: boolean;
  /** Head-to-knees, or the whole body. */
  framing?: "upper" | "full";
  crew?: CrewArrangement;
  /** The patient's pose when lying here. */
  lying?: "lying" | "reclined";
  /** Kit positions, in metres from the crown. */
  monitor?: Pt;
  bag?: Pt;
  o2?: Pt;
};

// ---------------------------------------------------------------------------
// Surface patterns (user-space metres)
// ---------------------------------------------------------------------------

export function GroundDefs() {
  return (
    <>
      <pattern id="pg-boards" width="0.58" height="2.4" patternUnits="userSpaceOnUse">
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={i * 0.145} y={0} width={0.145} height={2.4} fill={["#8a6a48", "#7f6142", "#93714e", "#86664a"][i]} />
            <rect x={i * 0.145} y={0} width={0.012} height={2.4} fill="#5a4330" opacity={0.7} />
            <rect x={i * 0.145} y={i % 2 ? 1.2 : 0.4} width={0.145} height={0.012} fill="#5a4330" opacity={0.8} />
            <path d={`M${i * 0.145 + 0.04} 0.2 q0.02 0.6 0 1.4`} stroke="#6b5038" strokeWidth={0.006} fill="none" opacity={0.5} />
          </g>
        ))}
      </pattern>
      <pattern id="pg-carpet" width="0.12" height="0.12" patternUnits="userSpaceOnUse">
        <rect width="0.12" height="0.12" fill="#a08a6e" />
        <circle cx="0.03" cy="0.03" r="0.012" fill="#95805f" />
        <circle cx="0.09" cy="0.09" r="0.012" fill="#ad9777" />
        <circle cx="0.09" cy="0.03" r="0.008" fill="#8d785a" />
        <circle cx="0.03" cy="0.09" r="0.008" fill="#b39d7d" />
      </pattern>
      <pattern id="pg-carpet-blue" width="0.12" height="0.12" patternUnits="userSpaceOnUse">
        <rect width="0.12" height="0.12" fill="#5f6f85" />
        <circle cx="0.03" cy="0.03" r="0.012" fill="#56657a" />
        <circle cx="0.09" cy="0.09" r="0.012" fill="#687892" />
      </pattern>
      <pattern id="pg-tiles" width="0.33" height="0.33" patternUnits="userSpaceOnUse">
        <rect width="0.33" height="0.33" fill="#b9ad9a" />
        <rect x="0.008" y="0.008" width="0.314" height="0.314" fill="#cfc3ae" />
        <rect x="0.02" y="0.02" width="0.29" height="0.29" fill="#d6cbb7" opacity={0.6} />
      </pattern>
      <pattern id="pg-tiles-grey" width="0.4" height="0.4" patternUnits="userSpaceOnUse">
        <rect width="0.4" height="0.4" fill="#7c8288" />
        <rect x="0.008" y="0.008" width="0.384" height="0.384" fill="#9aa1a8" />
      </pattern>
      <pattern id="pg-tiles-sm" width="0.1" height="0.1" patternUnits="userSpaceOnUse">
        <rect width="0.1" height="0.1" fill="#c9d3d6" />
        <rect x="0.005" y="0.005" width="0.09" height="0.09" fill="#eef3f4" />
      </pattern>
      <pattern id="pg-lino" width="0.5" height="0.5" patternUnits="userSpaceOnUse">
        <rect width="0.5" height="0.5" fill="#b9c4bf" />
        <rect x="0.004" y="0.004" width="0.492" height="0.492" fill="#c3cdc8" />
        <circle cx="0.1" cy="0.14" r="0.01" fill="#aab5b0" /><circle cx="0.36" cy="0.3" r="0.01" fill="#aab5b0" /><circle cx="0.22" cy="0.42" r="0.008" fill="#d1dad5" />
      </pattern>
      <pattern id="pg-lino-grey" width="0.5" height="0.5" patternUnits="userSpaceOnUse">
        <rect width="0.5" height="0.5" fill="#9aa0a6" />
        <rect x="0.004" y="0.004" width="0.492" height="0.492" fill="#a7adb3" />
        <circle cx="0.1" cy="0.14" r="0.01" fill="#8f959b" /><circle cx="0.36" cy="0.3" r="0.01" fill="#b7bcc1" /><circle cx="0.22" cy="0.42" r="0.008" fill="#8f959b" />
      </pattern>
      <pattern id="pg-paving" width="0.6" height="0.9" patternUnits="userSpaceOnUse">
        <rect width="0.6" height="0.9" fill="#7d8286" />
        <rect x="0.01" y="0.01" width="0.58" height="0.43" fill="#9a9fa3" />
        <rect x="0.01" y="0.46" width="0.58" height="0.43" fill="#949a9e" />
        <circle cx="0.2" cy="0.2" r="0.012" fill="#878c90" /><circle cx="0.45" cy="0.7" r="0.012" fill="#a3a8ac" />
      </pattern>
      <pattern id="pg-grass" width="2" height="0.6" patternUnits="userSpaceOnUse">
        <rect width="1" height="0.6" fill="#4f8a3c" />
        <rect x="1" width="1" height="0.6" fill="#468035" />
        {[0.1, 0.5, 0.9, 1.3, 1.7].map((x, i) => <path key={x} d={`M${x} ${0.1 + (i % 3) * 0.17} l0.03 -0.05 l0.03 0.05 M${x + 0.2} ${0.35 + (i % 2) * 0.15} l0.03 -0.05 l0.03 0.05`} stroke="#3c7030" strokeWidth={0.01} fill="none" />)}
      </pattern>
      <pattern id="pg-grass-wild" width="0.7" height="0.7" patternUnits="userSpaceOnUse">
        <rect width="0.7" height="0.7" fill="#56883c" />
        <ellipse cx="0.2" cy="0.25" rx="0.16" ry="0.1" fill="#4f7f37" />
        <ellipse cx="0.5" cy="0.55" rx="0.14" ry="0.09" fill="#5f9342" />
        {[[0.1, 0.5], [0.4, 0.15], [0.6, 0.35], [0.25, 0.62]].map(([x, y]) => <path key={`${x}${y}`} d={`M${x} ${y} l0.025 -0.06 l0.025 0.06 M${x + 0.05} ${y} l0.02 -0.045 l0.02 0.045`} stroke="#3f7030" strokeWidth={0.01} fill="none" />)}
      </pattern>
      <pattern id="pg-tarmac" width="0.5" height="0.5" patternUnits="userSpaceOnUse">
        <rect width="0.5" height="0.5" fill="#4b4f54" />
        {[[0.05, 0.08], [0.2, 0.3], [0.38, 0.12], [0.44, 0.42], [0.12, 0.45], [0.3, 0.2]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={0.008} fill={i % 2 ? "#5a5e63" : "#3f4347"} />)}
      </pattern>
      <pattern id="pg-concrete" width="2" height="2" patternUnits="userSpaceOnUse">
        <rect width="2" height="2" fill="#8d9196" />
        <path d="M0 0 H2 M0 0 V2" stroke="#767a7f" strokeWidth={0.015} />
        {[[0.3, 0.4], [1.2, 0.9], [0.7, 1.5], [1.7, 1.7], [1.5, 0.3]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={0.02} fill="#848890" opacity={0.7} />)}
      </pattern>
      <pattern id="pg-mud" width="0.9" height="0.9" patternUnits="userSpaceOnUse">
        <rect width="0.9" height="0.9" fill="#6b5236" />
        <ellipse cx="0.25" cy="0.3" rx="0.2" ry="0.12" fill="#7a5f40" />
        <ellipse cx="0.65" cy="0.65" rx="0.18" ry="0.1" fill="#5c4630" />
        {[[0.1, 0.7], [0.5, 0.15], [0.8, 0.3], [0.4, 0.8]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={0.03} ry={0.02} fill="#9a9a94" />)}
      </pattern>
      <pattern id="pg-heather" width="0.8" height="0.8" patternUnits="userSpaceOnUse">
        <rect width="0.8" height="0.8" fill="#6a6a44" />
        <ellipse cx="0.2" cy="0.25" rx="0.2" ry="0.14" fill="#7a5a74" />
        <ellipse cx="0.6" cy="0.6" rx="0.18" ry="0.12" fill="#5e5a3a" />
        <ellipse cx="0.65" cy="0.15" rx="0.12" ry="0.08" fill="#8a7a4a" />
        <ellipse cx="0.15" cy="0.65" rx="0.1" ry="0.07" fill="#4e4a2e" />
      </pattern>
      <pattern id="pg-shingle" width="0.4" height="0.4" patternUnits="userSpaceOnUse">
        <rect width="0.4" height="0.4" fill="#9a9690" />
        {[[0.05, 0.08, 0.035], [0.18, 0.05, 0.028], [0.3, 0.12, 0.04], [0.1, 0.25, 0.03], [0.25, 0.3, 0.035], [0.37, 0.3, 0.025], [0.2, 0.17, 0.02]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.75} fill={["#b3aea6", "#7f7b74", "#c2bdb4", "#8c8880", "#a39e96", "#6f6b64", "#b9b4ab"][i]} />)}
      </pattern>
      <pattern id="pg-water" width="1.4" height="0.9" patternUnits="userSpaceOnUse">
        <rect width="1.4" height="0.9" fill="#3d6f7a" />
        <path d="M0.1 0.2 q0.2 -0.08 0.4 0 q0.2 0.08 0.4 0 M0.5 0.6 q0.2 -0.08 0.4 0 q0.2 0.08 0.4 0 M-0.2 0.8 q0.2 -0.06 0.4 0" stroke="#5b8f9a" strokeWidth={0.015} fill="none" opacity={0.8} />
        <path d="M0.3 0.4 q0.15 -0.05 0.3 0 M0.9 0.15 q0.15 -0.05 0.3 0" stroke="#2f5c66" strokeWidth={0.012} fill="none" opacity={0.8} />
      </pattern>
      <pattern id="pg-ballast" width="0.3" height="0.3" patternUnits="userSpaceOnUse">
        <rect width="0.3" height="0.3" fill="#6c6f72" />
        {[[0.05, 0.06], [0.16, 0.04], [0.25, 0.1], [0.08, 0.2], [0.2, 0.22], [0.14, 0.13]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={0.03} ry={0.022} fill={i % 2 ? "#7f8286" : "#5a5d60"} transform={`rotate(${i * 37} ${x} ${y})`} />)}
      </pattern>
      <pattern id="pg-tactile" width="0.07" height="0.07" patternUnits="userSpaceOnUse">
        <rect width="0.07" height="0.07" fill="#c9a24a" />
        <circle cx="0.035" cy="0.035" r="0.014" fill="#b48c38" />
        <circle cx="0.03" cy="0.03" r="0.008" fill="#d6b15c" />
      </pattern>
      <pattern id="pg-rock" width="1" height="1" patternUnits="userSpaceOnUse">
        <rect width="1" height="1" fill="#6b6f66" />
        <path d="M0.1 0.2 l0.3 0.1 l0.2 -0.15 M0.5 0.6 l0.25 0.2 l0.2 -0.05 M0.05 0.7 l0.2 0.1" stroke="#4e5249" strokeWidth={0.012} fill="none" />
        <ellipse cx="0.7" cy="0.3" rx="0.12" ry="0.07" fill="#777b72" />
      </pattern>
      <radialGradient id="pg-lamp" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.55" />
        <stop offset="0.5" stopColor="#ffe9a8" stopOpacity="0.18" />
        <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="pg-torch" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#0a1420" stopOpacity="0" />
        <stop offset="0.55" stopColor="#0a1420" stopOpacity="0.25" />
        <stop offset="1" stopColor="#0a1420" stopOpacity="0.82" />
      </radialGradient>
      <radialGradient id="pg-puddle" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#dfe8ef" stopOpacity="0.35" />
        <stop offset="1" stopColor="#dfe8ef" stopOpacity="0.05" />
      </radialGradient>
    </>
  );
}

// ---------------------------------------------------------------------------
// Props, in metres
// ---------------------------------------------------------------------------

const FILL = (id: string) => `url(#${id})`;
const Base = ({ id, fill }: { id?: string; fill?: string }) => <rect x={-4} y={-3} width={8} height={8} fill={id ? FILL(id) : fill} />;

const Mug = ({ x, y, spilt = false, colour = "#e9ecef" }: { x: number; y: number; spilt?: boolean; colour?: string }) => (
  <g>
    {spilt && <path d={smooth([[x + 0.08, y - 0.02], [x + 0.3, y - 0.08], [x + 0.42, y + 0.06], [x + 0.3, y + 0.16], [x + 0.14, y + 0.12]], 0.6)} fill="#6b4a2a" opacity={0.6} />}
    <circle cx={x} cy={y} r={0.045} fill={colour} {...line} />
    <circle cx={x} cy={y} r={0.03} fill={spilt ? colour : "#5a3d26"} />
    <path d={`M${n2(x + 0.04)} ${n2(y - 0.02)} q0.05 0 0.05 0.02 q0 0.02 -0.05 0.02`} fill="none" {...line} />
  </g>
);

const Phone = ({ x, y, a = 20 }: { x: number; y: number; a?: number }) => (
  <g transform={`rotate(${a} ${n2(x)} ${n2(y)})`}>
    <rect x={x - 0.038} y={y - 0.08} width={0.076} height={0.16} rx={0.012} fill="#15191c" {...line} />
    <rect x={x - 0.032} y={y - 0.07} width={0.064} height={0.14} rx={0.008} fill="#2f6fd6" opacity={0.85} />
  </g>
);

const Keys = ({ x, y }: { x: number; y: number }) => (
  <g>
    <circle cx={x} cy={y} r={0.02} fill="none" stroke="#9aa0a6" strokeWidth={1.4} {...SOFT} />
    <path d={`M${n2(x + 0.015)} ${n2(y + 0.012)} l0.06 0.04 l-0.01 0.015 M${n2(x - 0.015)} ${n2(y + 0.012)} l-0.05 0.05`} stroke="#9aa0a6" strokeWidth={1.4} {...SOFT} fill="none" />
  </g>
);

const Handbag = ({ x, y, colour = "#6b3a3a" }: { x: number; y: number; colour?: string }) => (
  <g transform={`rotate(-25 ${n2(x)} ${n2(y)})`}>
    <rect x={x - 0.16} y={y - 0.1} width={0.32} height={0.2} rx={0.03} fill={colour} {...line} />
    <path d={`M${n2(x - 0.08)} ${n2(y - 0.1)} q0.08 -0.1 0.16 0`} fill="none" stroke={darken(colour, 0.3)} strokeWidth={0.015} />
    <rect x={x - 0.16} y={y - 0.1} width={0.32} height={0.2} rx={0.03} fill="url(#ps-round-v)" opacity={0.5} />
  </g>
);

const Shoes = ({ x, y, colour = "#2b2b2b" }: { x: number; y: number; colour?: string }) => (
  <g>
    {[0, 0.11].map((dx) => <path key={dx} d={capsule([x + dx, y], [x + dx + 0.03, y - 0.26], 0.045, 0.05)} fill={colour} {...line} />)}
  </g>
);

const Bottle = ({ x, y, a = 30 }: { x: number; y: number; a?: number }) => (
  <g transform={`rotate(${a} ${n2(x)} ${n2(y)})`}>
    <rect x={x - 0.03} y={y - 0.12} width={0.06} height={0.24} rx={0.028} fill="#cfe9f5" opacity={0.85} {...lineSoft} />
    <rect x={x - 0.015} y={y - 0.15} width={0.03} height={0.04} rx={0.006} fill="#2f6fd6" />
  </g>
);

const Football = ({ x, y }: { x: number; y: number }) => (
  <g>
    <circle cx={x} cy={y} r={0.11} fill="#f4f4f0" {...line} />
    {[0, 72, 144, 216, 288].map((a) => <polygon key={a} points="0,-0.04 0.038,-0.012 0.024,0.032 -0.024,0.032 -0.038,-0.012" fill="#1b2733" transform={`translate(${n2(x + Math.cos((a * Math.PI) / 180) * 0.065)} ${n2(y + Math.sin((a * Math.PI) / 180) * 0.065)}) scale(0.7)`} />)}
    <polygon points="0,-0.04 0.038,-0.012 0.024,0.032 -0.024,0.032 -0.038,-0.012" fill="#1b2733" transform={`translate(${n2(x)} ${n2(y)}) scale(0.75)`} />
    <circle cx={x} cy={y} r={0.11} fill="url(#ps-face-shade)" />
  </g>
);

const Cone = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x - 0.19} y={y - 0.19} width={0.38} height={0.38} rx={0.02} fill="#2b2b2b" {...line} />
    <circle cx={x} cy={y} r={0.14} fill="#e8731f" {...line} />
    <circle cx={x} cy={y} r={0.1} fill="#f4f4f0" />
    <circle cx={x} cy={y} r={0.06} fill="#e8731f" />
    <circle cx={x} cy={y} r={0.02} fill="#2b2b2b" />
  </g>
);

const Drain = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x - 0.22} y={y - 0.17} width={0.44} height={0.34} rx={0.01} fill="#3a3f45" {...line} />
    {[-0.14, -0.07, 0, 0.07, 0.14].map((dx) => <rect key={dx} x={x + dx - 0.02} y={y - 0.13} width={0.04} height={0.26} rx={0.01} fill="#15191c" />)}
  </g>
);

const Kerb = ({ x, side = -1 }: { x: number; side?: 1 | -1 }) => (
  <g>
    <rect x={side === -1 ? x - 0.16 : x} y={-3} width={0.16} height={8} fill="#aeb3b7" />
    {Array.from({ length: 10 }, (_, i) => <rect key={i} x={side === -1 ? x - 0.16 : x} y={-3 + i * 0.9} width={0.16} height={0.012} fill="#7d8286" />)}
    <rect x={side === -1 ? x - 0.015 : x + 0.145} y={-3} width={0.015} height={8} fill="#5f6468" />
  </g>
);

const YellowLines = ({ x }: { x: number }) => (
  <g>
    <rect x={x} y={-3} width={0.04} height={8} fill="#e8c43a" opacity={0.85} />
    <rect x={x + 0.07} y={-3} width={0.04} height={8} fill="#e8c43a" opacity={0.85} />
  </g>
);

const LampBase = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x - 0.2} y={y - 0.2} width={0.4} height={0.4} rx={0.03} fill="#5f6468" {...line} />
    <circle cx={x} cy={y} r={0.1} fill="#3a3f45" {...line} />
    <circle cx={x} cy={y} r={0.06} fill="#2b3139" />
  </g>
);

const Bench = ({ x, y, w = 1.6, a = 0 }: { x: number; y: number; w?: number; a?: number }) => (
  <g transform={`rotate(${a} ${n2(x)} ${n2(y)})`}>
    <rect x={x - w / 2} y={y - 0.25} width={w} height={0.5} rx={0.02} fill="#2b3139" opacity={0.25} />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={x - w / 2} y={y - 0.22 + i * 0.115} width={w} height={0.095} rx={0.012} fill={["#8a5a2b", "#7f5227", "#8a5a2b", "#7a4e24"][i]} {...line} />)}
    <rect x={x - w / 2 + 0.05} y={y - 0.26} width={0.05} height={0.52} fill="#2b3139" />
    <rect x={x + w / 2 - 0.1} y={y - 0.26} width={0.05} height={0.52} fill="#2b3139" />
  </g>
);

const Bin = ({ x, y }: { x: number; y: number }) => (
  <g>
    <circle cx={x} cy={y} r={0.22} fill="#2f4f3f" {...line} />
    <circle cx={x} cy={y} r={0.16} fill="#15191c" />
    <circle cx={x} cy={y} r={0.22} fill="url(#ps-face-shade)" />
  </g>
);

const Chair = ({ x, y, a = 0, colour = "#8a5a2b", seatColour }: { x: number; y: number; a?: number; colour?: string; seatColour?: string }) => (
  <g transform={`rotate(${a} ${n2(x)} ${n2(y)})`}>
    <rect x={x - 0.22} y={y - 0.22} width={0.44} height={0.44} rx={0.03} fill={seatColour ?? colour} {...line} />
    <rect x={x - 0.22} y={y - 0.22} width={0.44} height={0.44} rx={0.03} fill="url(#ps-round-v)" opacity={0.4} />
    <rect x={x - 0.23} y={y - 0.3} width={0.46} height={0.07} rx={0.02} fill={colour} {...line} />
    <rect x={x - 0.23} y={y - 0.3} width={0.46} height={0.07} rx={0.02} fill="url(#ps-round)" opacity={0.5} />
  </g>
);

const Armchair = ({ x, y, colour = "#5b6b8a" }: { x: number; y: number; colour?: string }) => (
  <g>
    <rect x={x - 0.46} y={y - 0.48} width={0.92} height={1.0} rx={0.08} fill={darken(colour, 0.15)} {...line} />
    <rect x={x - 0.46} y={y - 0.48} width={0.2} height={1.0} rx={0.08} fill={colour} {...line} />
    <rect x={x + 0.26} y={y - 0.48} width={0.2} height={1.0} rx={0.08} fill={colour} {...line} />
    <rect x={x - 0.46} y={y - 0.48} width={0.92} height={0.3} rx={0.08} fill={colour} {...line} />
    <rect x={x - 0.26} y={y - 0.2} width={0.52} height={0.68} rx={0.05} fill={mix(colour, "#ffffff", 0.1)} {...lineSoft} />
    <rect x={x - 0.46} y={y - 0.48} width={0.92} height={1.0} rx={0.08} fill="url(#ps-round)" opacity={0.35} />
  </g>
);

const Sofa = ({ x, y, w = 1.9, colour = "#5b6b8a" }: { x: number; y: number; w?: number; colour?: string }) => (
  <g>
    <rect x={x} y={y - 0.5} width={w} height={1.0} rx={0.08} fill={darken(colour, 0.15)} {...line} />
    <rect x={x} y={y - 0.5} width={w} height={0.28} rx={0.08} fill={colour} {...line} />
    {[0, 1, 2].map((i) => <rect key={i} x={x + 0.22 + i * ((w - 0.44) / 3) + 0.02} y={y - 0.2} width={(w - 0.44) / 3 - 0.04} height={0.66} rx={0.05} fill={mix(colour, "#ffffff", 0.1)} {...lineSoft} />)}
    <rect x={x} y={y - 0.5} width={0.22} height={1.0} rx={0.08} fill={colour} {...line} />
    <rect x={x + w - 0.22} y={y - 0.5} width={0.22} height={1.0} rx={0.08} fill={colour} {...line} />
    <rect x={x} y={y - 0.5} width={w} height={1.0} rx={0.08} fill="url(#ps-round-v)" opacity={0.3} />
  </g>
);

const Rug = ({ x, y, w, h, colour = "#7a3b3b" }: { x: number; y: number; w: number; h: number; colour?: string }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={0.02} fill={colour} {...line} />
    <rect x={x + 0.1} y={y + 0.1} width={w - 0.2} height={h - 0.2} fill="none" stroke={mix(colour, "#ffffff", 0.35)} strokeWidth={0.03} />
    <rect x={x + 0.22} y={y + 0.22} width={w - 0.44} height={h - 0.44} fill="none" stroke={mix(colour, "#ffffff", 0.2)} strokeWidth={0.015} />
    {Array.from({ length: Math.floor(w / 0.08) }, (_, i) => <rect key={i} x={x + 0.02 + i * 0.08} y={y - 0.06} width={0.02} height={0.06} fill={mix(colour, "#ffffff", 0.5)} />)}
    {Array.from({ length: Math.floor(w / 0.08) }, (_, i) => <rect key={i} x={x + 0.02 + i * 0.08} y={y + h} width={0.02} height={0.06} fill={mix(colour, "#ffffff", 0.5)} />)}
  </g>
);

const Table = ({ x, y, w, h, colour = "#8a5a2b" }: { x: number; y: number; w: number; h: number; colour?: string }) => (
  <g>
    <rect x={x + 0.04} y={y + 0.05} width={w} height={h} rx={0.03} fill="#000" opacity={0.2} />
    <rect x={x} y={y} width={w} height={h} rx={0.03} fill={colour} {...line} />
    <rect x={x} y={y} width={w} height={h} rx={0.03} fill="url(#ps-round)" opacity={0.3} />
  </g>
);

const Plate = ({ x, y }: { x: number; y: number }) => (
  <g>
    <circle cx={x} cy={y} r={0.13} fill="#f4f4f0" {...line} />
    <circle cx={x} cy={y} r={0.09} fill="none" stroke="#c9ced3" strokeWidth={1} {...SOFT} />
    <ellipse cx={x - 0.02} cy={y + 0.01} rx={0.05} ry={0.035} fill="#b06a3a" />
    <circle cx={x + 0.04} cy={y - 0.03} r={0.025} fill="#5fb55f" />
  </g>
);

const Cutlery = ({ x, y, a = 0 }: { x: number; y: number; a?: number }) => (
  <g transform={`rotate(${a} ${n2(x)} ${n2(y)})`} stroke="#c9ced3" strokeWidth={2} {...SOFT} fill="none">
    <path d={`M${n2(x)} ${n2(y - 0.1)} v0.2`} />
    <path d={`M${n2(x - 0.02)} ${n2(y - 0.1)} v0.04 M${n2(x + 0.02)} ${n2(y - 0.1)} v0.04`} strokeWidth={1.2} />
  </g>
);

const Glass = ({ x, y, over = false }: { x: number; y: number; over?: boolean }) => (
  <g>
    {over && <path d={smooth([[x + 0.05, y - 0.02], [x + 0.3, y - 0.06], [x + 0.36, y + 0.08], [x + 0.2, y + 0.12]], 0.6)} fill="#7a2a3a" opacity={0.6} />}
    <circle cx={x} cy={y} r={0.04} fill="#dfe8ef" opacity={0.8} {...line} />
    <circle cx={x} cy={y} r={0.025} fill={over ? "#dfe8ef" : "#7a2a3a"} opacity={0.8} />
  </g>
);

const Towel = ({ x, y, colour = "#5b8ab5", a = 0 }: { x: number; y: number; colour?: string; a?: number }) => (
  <g transform={`rotate(${a} ${n2(x)} ${n2(y)})`}>
    <path d={smooth([[x - 0.3, y - 0.15], [x + 0.25, y - 0.2], [x + 0.32, y + 0.05], [x + 0.1, y + 0.18], [x - 0.28, y + 0.12]], 0.6)} fill={colour} {...line} />
    <path d={`M${n2(x - 0.2)} ${n2(y - 0.02)} q0.2 0.08 0.42 -0.02`} fill="none" stroke={darken(colour, 0.25)} strokeWidth={0.01} />
  </g>
);

const Radiator = ({ x, y, h = 0.9 }: { x: number; y: number; h?: number }) => (
  <g>
    <rect x={x} y={y} width={0.12} height={h} fill="#e9e6e0" {...line} />
    {Array.from({ length: Math.floor(h / 0.08) }, (_, i) => <rect key={i} x={x + 0.01} y={y + 0.02 + i * 0.08} width={0.1} height={0.05} rx={0.01} fill="#d8d4cc" />)}
  </g>
);

const Doormat = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x - 0.4} y={y - 0.28} width={0.8} height={0.56} rx={0.01} fill="#6b5a3a" {...line} />
    {Array.from({ length: 7 }, (_, i) => <rect key={i} x={x - 0.36} y={y - 0.24 + i * 0.075} width={0.72} height={0.03} fill="#5a4a2e" />)}
    <rect x={x - 0.3} y={y - 0.18} width={0.6} height={0.36} fill="none" stroke="#8a7a52" strokeWidth={0.02} />
  </g>
);

const Letters = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x} y={y} width={0.22} height={0.11} fill="#f4f4f0" {...lineSoft} transform={`rotate(12 ${n2(x)} ${n2(y)})`} />
    <rect x={x + 0.05} y={y + 0.04} width={0.22} height={0.11} fill="#f3e4c6" {...lineSoft} transform={`rotate(-8 ${n2(x)} ${n2(y)})`} />
  </g>
);

const Steps = ({ x0, y0, w = 0.9, rise = 0.26, n = 14, runner = true }: { x0: number; y0: number; w?: number; rise?: number; n?: number; runner?: boolean }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const y = y0 + (i - 4) * rise;
      return (
        <g key={i}>
          <rect x={x0 - w / 2} y={y} width={w} height={rise} fill={i % 2 ? "#a88a62" : "#a2855e"} />
          <rect x={x0 - w / 2} y={y} width={w} height={0.025} fill="#6b5038" />
          <rect x={x0 - w / 2} y={y + 0.025} width={w} height={0.02} fill="#c9ad84" opacity={0.6} />
          {runner && <rect x={x0 - w * 0.3} y={y} width={w * 0.6} height={rise} fill="#8a2f2f" opacity={0.85} />}
          {runner && <rect x={x0 - w * 0.3} y={y} width={w * 0.6} height={0.025} fill="#5a1d1d" />}
        </g>
      );
    })}
    <rect x={x0 + w / 2} y={-3} width={0.06} height={8} fill="#6b5038" />
    {Array.from({ length: 16 }, (_, i) => <circle key={i} cx={x0 + w / 2 + 0.03} cy={-3 + i * 0.4} r={0.025} fill="#e9e4da" {...lineSoft} />)}
    <rect x={x0 - w / 2 - 0.06} y={-3} width={0.06} height={8} fill="#d4c9b8" />
  </g>
);

const Bed = ({ x, y, w = 1.5, l = 2.0 }: { x: number; y: number; w?: number; l?: number }) => (
  <g>
    <rect x={x - w / 2 - 0.05} y={y - 0.35} width={w + 0.1} height={l + 0.4} rx={0.04} fill="#5a3d26" {...line} />
    <rect x={x - w / 2} y={y - 0.3} width={w} height={l} rx={0.03} fill="#f0ede6" {...line} />
    <rect x={x - w / 2 + 0.08} y={y - 0.22} width={w / 2 - 0.12} height={0.42} rx={0.08} fill="#ffffff" {...lineSoft} />
    <rect x={x + 0.04} y={y - 0.22} width={w / 2 - 0.12} height={0.42} rx={0.08} fill="#ffffff" {...lineSoft} />
  </g>
);

const Duvet = ({ x, y, w = 1.5, l = 1.6, colour = "#7a8fb5" }: { x: number; y: number; w?: number; l?: number; colour?: string }) => (
  <g>
    <path d={smooth([[x - w / 2 + 0.02, y], [x - 0.3, y - 0.06], [x + 0.2, y + 0.04], [x + w / 2 - 0.02, y - 0.02], [x + w / 2, y + l], [x - w / 2, y + l]], 0.5)} fill={colour} {...line} />
    <path d={`M${n2(x - w / 2 + 0.1)} ${n2(y + 0.3)} q${n2(w / 2)} 0.1 ${n2(w - 0.2)} 0 M${n2(x - w / 2 + 0.1)} ${n2(y + 0.9)} q${n2(w / 2)} -0.08 ${n2(w - 0.2)} 0`} fill="none" stroke={darken(colour, 0.25)} strokeWidth={0.012} />
    <path d={smooth([[x - w / 2 + 0.02, y], [x - 0.3, y - 0.06], [x + 0.2, y + 0.04], [x + w / 2 - 0.02, y - 0.02], [x + w / 2, y + l], [x - w / 2, y + l]], 0.5)} fill="url(#ps-round)" opacity={0.35} />
  </g>
);

const BedsideTable = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x - 0.25} y={y - 0.2} width={0.5} height={0.4} rx={0.02} fill="#6b4a2a" {...line} />
    <circle cx={x - 0.08} cy={y} r={0.1} fill="#f3e4c6" {...line} />
    <circle cx={x - 0.08} cy={y} r={0.04} fill="#e8c43a" />
    <Glass x={x + 0.12} y={y + 0.08} />
  </g>
);

const HospitalBed = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x - 0.5} y={y - 0.42} width={1.0} height={2.3} rx={0.03} fill="#9aa0a6" {...line} />
    <rect x={x - 0.46} y={y - 0.38} width={0.92} height={2.22} rx={0.03} fill="#f4f6f8" {...line} />
    <rect x={x - 0.3} y={y - 0.3} width={0.6} height={0.38} rx={0.08} fill="#ffffff" {...lineSoft} />
    <rect x={x - 0.56} y={y - 0.2} width={0.07} height={0.9} rx={0.03} fill="#c9ced3" {...line} />
    <rect x={x + 0.49} y={y - 0.2} width={0.07} height={0.9} rx={0.03} fill="#c9ced3" {...line} />
    <rect x={x - 0.56} y={y + 0.95} width={0.07} height={0.8} rx={0.03} fill="#c9ced3" {...line} />
    <rect x={x + 0.49} y={y + 0.95} width={0.07} height={0.8} rx={0.03} fill="#c9ced3" {...line} />
    <rect x={x - 0.5} y={y - 0.52} width={1.0} height={0.1} rx={0.02} fill="#c9ced3" {...line} />
    <rect x={x - 0.46} y={y + 1.45} width={0.92} height={0.4} fill="#4f7fb5" {...line} />
    <path d={`M${n2(x - 0.46)} ${n2(y + 1.6)} h0.92`} stroke="#2f5c8a" strokeWidth={0.01} />
  </g>
);

const Cabinet = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x - 0.25} y={y - 0.25} width={0.5} height={0.5} rx={0.02} fill="#e9e4da" {...line} />
    <rect x={x - 0.25} y={y - 0.25} width={0.5} height={0.5} rx={0.02} fill="url(#ps-round-v)" opacity={0.35} />
    <rect x={x - 0.06} y={y - 0.16} width={0.12} height={0.14} rx={0.01} fill="#dfe8ef" {...lineSoft} />
    <Glass x={x + 0.12} y={y + 0.1} />
    <rect x={x - 0.2} y={y + 0.05} width={0.14} height={0.1} rx={0.01} fill="#f3d35a" {...lineSoft} />
  </g>
);

const DripStandBase = ({ x, y }: { x: number; y: number }) => (
  <g>
    {[0, 72, 144, 216, 288].map((a) => <path key={a} d={`M${n2(x)} ${n2(y)} l${n2(Math.cos((a * Math.PI) / 180) * 0.28)} ${n2(Math.sin((a * Math.PI) / 180) * 0.28)}`} stroke="#8a8f94" strokeWidth={0.035} strokeLinecap="round" />)}
    <circle cx={x} cy={y} r={0.035} fill="#9aa0a6" {...line} />
  </g>
);

const Trolley = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x - 0.36} y={y - 0.4} width={0.72} height={2.15} rx={0.03} fill="#5f6468" {...line} />
    <rect x={x - 0.32} y={y - 0.36} width={0.64} height={2.07} rx={0.04} fill="#2f3d55" {...line} />
    <rect x={x - 0.32} y={y - 0.36} width={0.64} height={0.55} rx={0.04} fill="#3a4a66" />
    <rect x={x - 0.32} y={y - 0.36} width={0.64} height={2.07} rx={0.04} fill="url(#ps-round)" opacity={0.4} />
    <rect x={x - 0.42} y={y - 0.1} width={0.06} height={1.1} rx={0.03} fill="#c9ced3" {...line} />
    <rect x={x + 0.36} y={y - 0.1} width={0.06} height={1.1} rx={0.03} fill="#c9ced3" {...line} />
  </g>
);

const TrolleyStraps = ({ x, y, r }: { x: number; y: number; r: Rig }) => (
  <g>
    <rect x={x - 0.4} y={y + r.waistY + 0.02} width={0.8} height={0.06} rx={0.01} fill="#e8731f" {...lineSoft} />
    <rect x={x - 0.06} y={y + r.waistY} width={0.12} height={0.1} rx={0.01} fill="#1b2733" />
    <rect x={x - 0.4} y={y + r.hipY + 0.5} width={0.8} height={0.06} rx={0.01} fill="#e8731f" {...lineSoft} />
  </g>
);

const AmbulanceSaloon = ({ outside }: { outside: ReactNode }) => (
  <g>
    <Base fill="#8f949a" />
    <rect x={-4} y={2.45} width={8} height={4} fill="#5f6468" />
    <g clipPath="url(#pg-doors-clip)">{outside}</g>
    <rect x={-1.1} y={-3} width={2.2} height={5.45} fill={FILL("pg-lino-grey")} />
    <rect x={-1.1} y={-3} width={0.04} height={5.45} fill="#f3d35a" />
    <rect x={1.06} y={-3} width={0.04} height={5.45} fill="#f3d35a" />
    <rect x={-1.6} y={-3} width={0.5} height={5.45} fill="#e9e4da" {...line} />
    {[-1.2, -0.4, 0.4, 1.2].map((y) => <rect key={y} x={-1.56} y={y} width={0.42} height={0.7} rx={0.02} fill="#dfe8ef" {...lineSoft} />)}
    <rect x={-1.5} y={0.5} width={0.3} height={0.4} rx={0.02} fill="#3b4148" {...lineSoft} />
    <rect x={1.1} y={-3} width={0.5} height={5.45} fill="#2f5c8a" {...line} />
    {[-1.0, -0.3, 0.4].map((y) => <rect key={y} x={1.14} y={y} width={0.42} height={0.62} rx={0.06} fill="#3a6fa5" {...lineSoft} />)}
    <rect x={-1.1} y={2.4} width={2.2} height={0.08} fill="#f3d35a" />
    <rect x={-1.1} y={2.42} width={0.06} height={1.5} fill="#f4f4f0" {...line} transform="rotate(-40 -1.1 2.42)" />
    <rect x={1.04} y={2.42} width={0.06} height={1.5} fill="#f4f4f0" {...line} transform="rotate(40 1.1 2.42)" />
  </g>
);

const CarSeat = ({ x, y, w = 0.58, colour = "#2b2f36" }: { x: number; y: number; w?: number; colour?: string }) => (
  <g>
    <rect x={x - w / 2 - 0.05} y={y - 0.55} width={w + 0.1} height={0.36} rx={0.1} fill={darken(colour, 0.1)} {...line} />
    <rect x={x - 0.16} y={y - 0.62} width={0.32} height={0.22} rx={0.06} fill={colour} {...line} />
    <rect x={x - w / 2} y={y - 0.2} width={w} height={0.95} rx={0.08} fill={colour} {...line} />
    <rect x={x - w / 2 + 0.08} y={y - 0.15} width={w - 0.16} height={0.85} rx={0.06} fill={mix(colour, "#ffffff", 0.08)} {...lineSoft} />
    <rect x={x - w / 2} y={y - 0.2} width={w} height={0.95} rx={0.08} fill="url(#ps-round)" opacity={0.4} />
  </g>
);

const SteeringWheel = ({ x, y, airbag = true, r = 0.19 }: { x: number; y: number; airbag?: boolean; r?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="none" stroke="#1b1f24" strokeWidth={0.045} />
    <circle cx={x} cy={y} r={r} fill="none" stroke="#3a3f45" strokeWidth={0.02} />
    <path d={`M${n2(x - r)} ${n2(y)} H${n2(x + r)} M${n2(x)} ${n2(y)} V${n2(y + r)}`} stroke="#1b1f24" strokeWidth={0.035} />
    <circle cx={x} cy={y} r={0.06} fill="#1b1f24" />
    {airbag && (
      <g>
        <path d={smooth([[x - 0.2, y - 0.08], [x - 0.08, y - 0.23], [x + 0.14, y - 0.2], [x + 0.23, y - 0.02], [x + 0.11, y + 0.18], [x - 0.13, y + 0.15]], 0.6)} fill="#f4f4f0" opacity={0.92} {...line} />
        <path d={`M${n2(x - 0.12)} ${n2(y - 0.04)} q0.12 0.08 0.24 -0.02 M${n2(x - 0.08)} ${n2(y + 0.08)} q0.08 0.05 0.16 0`} fill="none" stroke="#c9ced3" strokeWidth={0.012} />
      </g>
    )}
  </g>
);

const Seatbelt = ({ r }: { r: Rig }) => (
  <path d={`M${n2(r.shoulderW * 0.75)} ${n2(r.shoulderY - 0.02)} L${n2(-r.hipW * 0.8)} ${n2(r.hipY + 0.06)}`} stroke="#2b3139" strokeWidth={0.05} strokeLinecap="round" opacity={0.9} />
);

const CarInterior = ({ lorry = false }: { lorry?: boolean }) => (
  <g>
    <Base fill="#1f2328" />
    {/* Floor carpet */}
    <rect x={-0.9} y={-3} width={1.8} height={8} fill="#2e3238" />
    {/* Door sill and the open door, out to the left */}
    <rect x={-0.98} y={-3} width={0.1} height={8} fill="#8a9399" {...line} />
    <path d={`M-0.98 ${lorry ? -0.9 : -0.6} L-1.9 ${lorry ? -1.4 : -1.1} L-1.9 ${lorry ? 0.5 : 0.7} L-0.98 ${lorry ? 1.0 : 1.0} Z`} fill={lorry ? "#c9532f" : "#6b7a8c"} {...line} />
    <path d={`M-1.05 ${lorry ? -0.75 : -0.5} L-1.8 ${lorry ? -1.2 : -0.95} L-1.8 ${lorry ? 0.35 : 0.55} L-1.05 ${lorry ? 0.8 : 0.85} Z`} fill="#1f2a35" opacity={0.6} />
    <rect x={-1.9} y={-3} width={-2} height={8} fill="#4b4f54" />
    <rect x={-3.9} y={-3} width={2} height={8} fill={FILL("pg-tarmac")} />
    {/* Centre console to the right, then the passenger seat */}
    <rect x={0.34} y={-0.2} width={0.3} height={1.6} rx={0.04} fill="#15191c" {...line} />
    <rect x={0.42} y={0.5} width={0.14} height={0.3} rx={0.03} fill="#3a3f45" {...lineSoft} />
    <circle cx={0.49} cy={0.45} r={0.04} fill="#9aa0a6" />
    <rect x={0.42} y={0.95} width={0.14} height={0.22} rx={0.03} fill="#3a3f45" {...lineSoft} />
    <CarSeat x={0.98} y={0} />
    <rect x={1.28} y={-3} width={0.1} height={8} fill="#8a9399" {...line} />
    {/* Dashboard at the bottom (the front of the car) */}
    <rect x={-0.98} y={1.42} width={2.36} height={0.5} rx={0.05} fill="#15191c" {...line} />
    <rect x={-0.9} y={1.5} width={0.6} height={0.14} rx={0.02} fill="#2b3139" />
    <rect x={0.2} y={1.5} width={0.5} height={0.14} rx={0.02} fill="#2b3139" />
    <rect x={-0.98} y={1.9} width={2.36} height={0.3} fill="#9fc4dd" opacity={0.5} />
    <path d="M-0.98 2.2 h2.36" stroke="#1b2733" strokeWidth={0.02} />
    <path d="M-0.5 1.95 l0.1 0.2 l0.15 -0.3 l0.2 0.25" fill="none" stroke="#1b2733" strokeWidth={0.012} />
  </g>
);

const Rails = ({ x }: { x: number }) => (
  <g>
    <rect x={x - 2.4} y={-3} width={2.4} height={8} fill={FILL("pg-ballast")} />
    {Array.from({ length: 12 }, (_, i) => <rect key={i} x={x - 2.3} y={-3 + i * 0.7} width={2.2} height={0.24} rx={0.01} fill="#5a4a3a" {...lineSoft} />)}
    <rect x={x - 1.95} y={-3} width={0.07} height={8} fill="#9aa0a6" {...line} />
    <rect x={x - 0.55} y={-3} width={0.07} height={8} fill="#9aa0a6" {...line} />
    <rect x={x - 0.1} y={-3} width={0.1} height={8} fill="#5f6468" {...line} />
  </g>
);

const Barrier = ({ x }: { x: number }) => (
  <g>
    <rect x={x} y={-3} width={0.3} height={8} fill="#8a9399" {...line} />
    <rect x={x + 0.1} y={-3} width={0.04} height={8} fill="#6f777c" />
    <rect x={x + 0.18} y={-3} width={0.04} height={8} fill="#aeb3b7" />
    {Array.from({ length: 6 }, (_, i) => <rect key={i} x={x + 0.08} y={-2.5 + i * 1.6} width={0.14} height={0.12} rx={0.02} fill="#5f6468" {...line} />)}
    <rect x={x + 0.3} y={-3} width={4} height={8} fill={FILL("pg-grass-wild")} />
  </g>
);

const Shelf = ({ x }: { x: number }) => (
  <g>
    <rect x={x - 0.6} y={-3} width={0.6} height={8} fill="#d8d4cc" {...line} />
    {Array.from({ length: 16 }, (_, i) => (
      <rect key={i} x={x - 0.55 + (i % 3) * 0.17} y={-2.8 + i * 0.36} width={0.14} height={0.26} rx={0.015} fill={["#e03a3a", "#2f6fd6", "#f3d35a", "#3fae3f", "#e8731f", "#9fc4dd", "#f4f4f0", "#7a5bd6"][i % 8]} {...lineSoft} />
    ))}
    <rect x={x - 0.06} y={-3} width={0.06} height={8} fill="#9aa0a6" />
  </g>
);

const Basket = ({ x, y }: { x: number; y: number }) => (
  <g transform={`rotate(15 ${n2(x)} ${n2(y)})`}>
    <rect x={x - 0.22} y={y - 0.16} width={0.44} height={0.32} rx={0.04} fill="#b5302a" opacity={0.9} {...line} />
    <rect x={x - 0.17} y={y - 0.11} width={0.34} height={0.22} rx={0.03} fill="none" stroke="#7a1f1a" strokeWidth={0.012} />
    <rect x={x - 0.12} y={y - 0.06} width={0.12} height={0.09} rx={0.01} fill="#3fae3f" />
    <rect x={x + 0.02} y={y - 0.04} width={0.1} height={0.07} rx={0.01} fill="#f3d35a" />
  </g>
);

const Pallet = ({ x, y, blocks = false }: { x: number; y: number; blocks?: boolean }) => (
  <g>
    <rect x={x - 0.6} y={y - 0.5} width={1.2} height={1.0} rx={0.02} fill="#8a6a48" {...line} />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={x - 0.58} y={y - 0.48 + i * 0.14} width={1.16} height={0.1} fill="#a08050" {...lineSoft} />)}
    {blocks && [0, 1, 2].map((i) => [0, 1].map((j) => <rect key={`${i}${j}`} x={x - 0.5 + i * 0.36} y={y - 0.4 + j * 0.42} width={0.32} height={0.38} rx={0.01} fill="#9aa0a6" {...line} />))}
  </g>
);

const HardHat = ({ x, y }: { x: number; y: number }) => (
  <g>
    <ellipse cx={x} cy={y} rx={0.17} ry={0.14} fill="#f3d35a" {...line} />
    <ellipse cx={x} cy={y} rx={0.12} ry={0.1} fill="#e8c43a" />
    <ellipse cx={x} cy={y} rx={0.17} ry={0.14} fill="url(#ps-face-shade)" />
  </g>
);

const Rock = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${n2(x)} ${n2(y)}) scale(${s})`}>
    <path d={smooth([[-0.3, -0.1], [-0.1, -0.24], [0.2, -0.2], [0.32, 0.02], [0.15, 0.22], [-0.2, 0.18]], 0.5)} fill="#7f8379" {...line} />
    <path d={smooth([[-0.3, -0.1], [-0.1, -0.24], [0.2, -0.2], [0.32, 0.02], [0.15, 0.22], [-0.2, 0.18]], 0.5)} fill="url(#ps-face-shade)" />
  </g>
);

const LifeRing = ({ x, y }: { x: number; y: number }) => (
  <g>
    <circle cx={x} cy={y} r={0.3} fill="none" stroke="#e8731f" strokeWidth={0.14} />
    {[0, 90, 180, 270].map((a) => <path key={a} d={`M${n2(x + Math.cos((a * Math.PI) / 180) * 0.3)} ${n2(y + Math.sin((a * Math.PI) / 180) * 0.3)} l0 0`} stroke="#f4f4f0" strokeWidth={0.14} strokeLinecap="butt" strokeDasharray="0.12 1" />)}
    <circle cx={x} cy={y} r={0.3} fill="none" stroke={INK} strokeWidth={0.9} {...SOFT} />
    <circle cx={x} cy={y} r={0.16} fill="none" stroke={INK} strokeWidth={0.9} {...SOFT} />
  </g>
);

const Rope = ({ from, to, colour = "#e8731f" }: { from: Pt; to: Pt; colour?: string }) => (
  <path d={`M${P(from)} C${P([from[0] + 0.4, from[1] + 0.3])} ${P([to[0] - 0.3, to[1] - 0.4])} ${P(to)}`} fill="none" stroke={colour} strokeWidth={0.03} strokeLinecap="round" />
);

const Reeds = ({ x, y }: { x: number; y: number }) => (
  <g stroke="#3f6f3a" strokeWidth={0.018} fill="none" strokeLinecap="round">
    {[0, 0.12, 0.22, 0.35, 0.5, 0.6].map((dx, i) => <path key={dx} d={`M${n2(x + dx)} ${n2(y)} q${n2((i % 2 ? 1 : -1) * 0.1)} -0.3 ${n2((i % 2 ? 1 : -1) * 0.05)} -0.55`} />)}
  </g>
);

const GlassFragments = ({ x, y }: { x: number; y: number }) => (
  <g fill="#cfe9f5" opacity={0.85}>
    {[[0, 0, 20], [0.12, 0.08, 60], [-0.1, 0.14, 110], [0.22, -0.06, 150], [-0.2, -0.1, 30], [0.05, 0.25, 80], [-0.28, 0.2, 10]].map(([dx, dy, a], i) => <polygon key={i} points="0,-0.03 0.035,0.01 -0.02,0.03" transform={`translate(${n2(x + dx)} ${n2(y + dy)}) rotate(${a})`} {...lineSoft} />)}
  </g>
);

const Skid = ({ x, y }: { x: number; y: number }) => (
  <g opacity={0.55}>
    <path d={`M${n2(x)} ${n2(y)} q0.3 -1.2 0.5 -2.4`} stroke="#1b1f24" strokeWidth={0.18} fill="none" strokeLinecap="round" />
    <path d={`M${n2(x + 1.35)} ${n2(y)} q0.3 -1.2 0.5 -2.4`} stroke="#1b1f24" strokeWidth={0.18} fill="none" strokeLinecap="round" />
  </g>
);

const CarCorner = ({ x, y, colour = "#6b7a8c" }: { x: number; y: number; colour?: string }) => (
  <g>
    <path d={`M${n2(x)} ${n2(y)} h1.9 v-2.2 q0 -0.3 -0.3 -0.3 h-1.3 q-0.3 0 -0.3 0.3 z`} fill={colour} {...line} />
    <path d={`M${n2(x + 0.15)} ${n2(y - 0.5)} h1.6 l-0.2 -0.5 h-1.2 z`} fill="#1f2a35" opacity={0.85} />
    <rect x={x + 0.2} y={y - 2.3} width={1.5} height={0.3} rx={0.05} fill={darken(colour, 0.2)} />
    <path d={`M${n2(x + 1.0)} ${n2(y - 0.1)} l0.1 -0.3 l-0.2 -0.25 l0.25 -0.2`} fill="none" stroke={INK} strokeWidth={1.4} {...SOFT} />
    <rect x={x - 0.05} y={y - 1.4} width={0.12} height={0.6} rx={0.04} fill="#1e2326" {...line} />
  </g>
);

const Worktop = ({ y }: { y: number }) => (
  <g>
    <rect x={-4} y={y - 0.62} width={8} height={0.62} fill="#4a4f54" {...line} />
    <rect x={-4} y={y - 0.62} width={8} height={0.62} fill="url(#ps-round-v)" opacity={0.3} />
    <rect x={-4} y={y - 0.03} width={8} height={0.03} fill="#2b2f33" />
    <circle cx={-0.9} cy={y - 0.32} r={0.1} fill="#c9ced3" {...line} />
    <circle cx={-0.9} cy={y - 0.32} r={0.04} fill="#2b2f33" />
    <rect x={0.2} y={y - 0.5} width={0.5} height={0.36} rx={0.02} fill="#8a6a48" {...line} />
    <rect x={1.0} y={y - 0.55} width={0.45} height={0.45} rx={0.06} fill="#dfe8ef" {...line} />
    <circle cx={1.22} cy={y - 0.32} r={0.12} fill="#9aa0a6" />
    <Mug x={-0.3} y={y - 0.2} colour="#4f7fb5" />
  </g>
);

const Bath = ({ x }: { x: number }) => (
  <g>
    <rect x={x - 0.75} y={-1.6} width={0.75} height={3.0} rx={0.12} fill="#f4f6f8" {...line} />
    <rect x={x - 0.65} y={-1.5} width={0.55} height={2.8} rx={0.2} fill="#dfe8ef" {...line} />
    <rect x={x - 0.65} y={-1.5} width={0.55} height={2.8} rx={0.2} fill="url(#ps-round)" opacity={0.3} />
    <circle cx={x - 0.37} cy={-1.3} r={0.04} fill="#9aa0a6" {...lineSoft} />
    <circle cx={x - 0.46} cy={-1.52} r={0.035} fill="#c9ced3" {...line} />
    <circle cx={x - 0.28} cy={-1.52} r={0.035} fill="#c9ced3" {...line} />
  </g>
);

const Toilet = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x - 0.22} y={y - 0.42} width={0.44} height={0.2} rx={0.03} fill="#f4f6f8" {...line} />
    <ellipse cx={x} cy={y} rx={0.19} ry={0.24} fill="#f4f6f8" {...line} />
    <ellipse cx={x} cy={y + 0.02} rx={0.13} ry={0.17} fill="#dfe8ef" {...lineSoft} />
  </g>
);

const BathMat = ({ x, y }: { x: number; y: number }) => (
  <rect x={x - 0.4} y={y - 0.25} width={0.8} height={0.5} rx={0.04} fill="#5b8ab5" opacity={0.9} {...lineSoft} />
);

const Locker = ({ x, y, w = 0.9 }: { x: number; y: number; w?: number }) => (
  <g>
    <rect x={x} y={y - 0.45} width={w} height={0.45} fill="#5f6b7a" {...line} />
    {Array.from({ length: Math.floor(w / 0.3) }, (_, i) => <rect key={i} x={x + i * 0.3 + 0.02} y={y - 0.43} width={0.26} height={0.41} fill="#6f7d8c" {...lineSoft} />)}
  </g>
);

const Boots = ({ x, y }: { x: number; y: number }) => (
  <g>
    {[0, 0.14].map((dx, i) => <path key={dx} d={capsule([x + dx, y], [x + dx + (i ? 0.06 : -0.02), y - 0.3], 0.05, 0.055)} fill="#1b1b1b" {...line} />)}
    <path d={capsule([x + 0.14, y - 0.05], [x + 0.2, y - 0.25], 0.03, 0.03)} fill="#f4f4f0" opacity={0.5} />
  </g>
);

const MachineBase = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x} y={y} width={1.6} height={1.3} rx={0.04} fill="#5a6470" {...line} />
    <rect x={x + 0.1} y={y + 0.1} width={1.4} height={1.1} rx={0.03} fill="#6b7682" {...lineSoft} />
    <rect x={x + 0.1} y={y + 0.1} width={1.4} height={0.12} fill="#f3d35a" />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={x + 0.15 + i * 0.2} y={y + 0.1} width={0.1} height={0.12} fill="#1b1b1b" />)}
    <circle cx={x + 1.1} cy={y + 0.7} r={0.2} fill="#3a3f45" {...line} />
    <circle cx={x + 1.1} cy={y + 0.7} r={0.08} fill="#9aa0a6" />
  </g>
);

const OilStain = ({ x, y }: { x: number; y: number }) => (
  <path d={smooth([[x - 0.3, y], [x - 0.1, y - 0.2], [x + 0.25, y - 0.12], [x + 0.32, y + 0.1], [x + 0.05, y + 0.22], [x - 0.2, y + 0.14]], 0.6)} fill="#1b1f24" opacity={0.45} />
);

const Leaves = ({ x, y }: { x: number; y: number }) => (
  <g>
    {[[0, 0, 20, "#b06a3a"], [0.3, 0.2, 70, "#c48a3f"], [-0.25, 0.35, 120, "#8a4a2a"], [0.5, -0.2, 160, "#b5452a"], [-0.4, -0.15, 40, "#c48a3f"], [0.2, 0.55, 90, "#a85a2a"]].map(([dx, dy, a, c], i) => (
      <path key={i} d="M0 -0.06 q0.06 0.03 0 0.08 q-0.06 -0.05 0 -0.08z" fill={c as string} transform={`translate(${n2(x + (dx as number))} ${n2(y + (dy as number))}) rotate(${a}) scale(1.4)`} />
    ))}
  </g>
);

const Path = ({ x, w = 1.2 }: { x: number; w?: number }) => (
  <g>
    <rect x={x} y={-3} width={w} height={8} fill="#7d8286" />
    <rect x={x} y={-3} width={0.06} height={8} fill="#5f6468" />
    <rect x={x + w - 0.06} y={-3} width={0.06} height={8} fill="#5f6468" />
  </g>
);

const Can = ({ x, y }: { x: number; y: number }) => (
  <g transform={`rotate(60 ${n2(x)} ${n2(y)})`}>
    <rect x={x - 0.033} y={y - 0.06} width={0.066} height={0.12} rx={0.012} fill="#e03a3a" {...line} />
    <rect x={x - 0.033} y={y - 0.06} width={0.066} height={0.12} rx={0.012} fill="url(#ps-round)" opacity={0.6} />
  </g>
);

const Lamp = ({ x, y, r = 1.6 }: { x: number; y: number; r?: number }) => <circle cx={x} cy={y} r={r} fill="url(#pg-lamp)" />;

const Puddles = () => (
  <g>
    {[[-0.9, 0.3, 0.3, 0.14], [0.8, 1.1, 0.26, 0.12], [0.3, -0.5, 0.2, 0.09], [-0.5, 1.5, 0.36, 0.14]].map(([x, y, rx, ry], i) => <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="url(#pg-puddle)" />)}
  </g>
);

// ---------------------------------------------------------------------------
// The settings
// ---------------------------------------------------------------------------

const onSofa = (label: string) => /\b(sofa|settee|couch)\b/.test(label);
const inArmchair = (label: string) => /\b(armchair|chair)\b/.test(label);
const inBed = (label: string) => /\b(in bed|bed)\b/.test(label);

export const GROUNDS: Record<SceneSetting, GroundSpec> = {
  lounge: {
    outdoor: false,
    ground: (c) => (
      <g>
        <Base id="pg-carpet" />
        {!(c.seated && inArmchair(c.label)) && !onSofa(c.label) && <Rug x={-0.95} y={-0.35} w={1.9} h={2.6} />}
        {!onSofa(c.label) && <Sofa x={1.0} y={0.5} />}
        <Table x={-2.0} y={1.3} w={0.9} h={0.6} />
        <Mug x={-1.7} y={1.45} />
        <Phone x={-1.5} y={1.7} a={-30} />
        <Mug x={0.9 - 1.7} y={1.6 - 1.9} spilt colour="#9fc4dd" />
      </g>
    ),
    under: (c) => (c.seated && inArmchair(c.label) ? <Armchair x={0} y={0.5} /> : onSofa(c.label) ? <Sofa x={-0.95} y={0.5} /> : null),
  },
  hallway: {
    outdoor: false,
    ground: () => (
      <g>
        <Base id="pg-boards" />
        <rect x={-4} y={-3} width={8} height={2.05} fill="#d4c9b8" {...line} />
        <rect x={-4} y={-0.98} width={8} height={0.05} fill="#8a6a48" />
        <rect x={-0.5} y={-1.02} width={1.0} height={0.08} fill="#5a4330" />
        <Doormat x={0} y={-0.62} />
        <Letters x={-0.2} y={-0.7} />
        <rect x={-4} y={-3} width={2.9} height={8} fill="#d4c9b8" {...line} />
        <Radiator x={-1.1} y={0.3} />
        <Shoes x={-0.95} y={1.75} />
        <Steps x0={1.95} y0={0.2} n={5} />
        <rect x={1.3} y={-3} width={0.2} height={8} fill="#6b5038" />
        <Keys x={0.5} y={-0.45} />
      </g>
    ),
  },
  bedroom: {
    outdoor: false,
    lying: "reclined",
    ground: (c) => (
      <g>
        <Base id="pg-carpet-blue" />
        {!inBed(c.label) && <Bed x={1.6} y={-0.3} />}
        <BedsideTable x={inBed(c.label) ? 1.15 : -1.2} y={-0.5} />
        <Shoes x={-1.1} y={1.6} colour="#8a6a5a" />
      </g>
    ),
    under: (c) => (inBed(c.label) || !c.seated ? <Bed x={0} y={-0.3} w={1.5} l={2.3} /> : null),
    over: (c) => (inBed(c.label) && !c.seated ? <Duvet x={0} y={c.r.waistY} w={1.5} l={1.8} /> : null),
  },
  kitchen: {
    outdoor: false,
    ground: () => (
      <g>
        <Base id="pg-tiles" />
        <Worktop y={-0.85} />
        <Chair x={1.25} y={1.0} a={75} />
        <Mug x={0.7} y={0.35} spilt />
        <Towel x={-1.1} y={1.2} colour="#c9c3b2" a={25} />
      </g>
    ),
    under: (c) => (c.seated ? <Chair x={0} y={c.r.hipY} /> : null),
  },
  bathroom: {
    outdoor: false,
    ground: () => (
      <g>
        <Base id="pg-tiles-sm" />
        <Bath x={-0.55} />
        <BathMat x={0.1} y={0.5} />
        <Toilet x={1.1} y={1.3} />
        <Towel x={0.9} y={-0.5} colour="#dfe8ef" a={-20} />
      </g>
    ),
  },
  stairs: {
    outdoor: false,
    ground: (c) => <Steps x0={0} y0={c.r.hipY - 0.3} />,
  },
  ward: {
    outdoor: false,
    lying: "reclined",
    crew: "bedside",
    framing: "full",
    ground: () => (
      <g>
        <Base id="pg-lino" />
        <Cabinet x={1.05} y={-0.1} />
        <DripStandBase x={-0.95} y={-0.5} />
        <rect x={-4} y={-3} width={8} height={2.3} fill="#e4ebe7" />
        <rect x={-4} y={-0.72} width={8} height={0.04} fill="#9fb3aa" />
      </g>
    ),
    under: () => <HospitalBed x={0} y={0} />,
    monitor: [-1.05, 0.9],
    bag: [1.0, 1.3],
    o2: [0.85, -0.35],
  },
  restaurant: {
    outdoor: false,
    ground: () => (
      <g>
        <Base id="pg-boards" />
        <rect x={-4} y={-3} width={8} height={8} fill="#2b1d14" opacity={0.35} />
        <Table x={-2.2} y={-1.0} w={1.3} h={1.0} colour="#5a3d26" />
        <Plate x={-1.5} y={-0.55} />
        <Cutlery x={-1.3} y={-0.55} />
        <Glass x={-1.8} y={-0.8} />
        <Chair x={1.2} y={0.9} a={100} colour="#5a3d26" />
        <Glass x={0.55} y={0.3} over />
        <Towel x={-0.9} y={1.4} colour="#f4f4f0" a={40} />
      </g>
    ),
    under: (c) => (c.seated ? <Chair x={0} y={c.r.hipY} colour="#5a3d26" /> : null),
  },
  changing_room: {
    outdoor: false,
    ground: () => (
      <g>
        <Base id="pg-tiles-grey" />
        <Bench x={1.3} y={0.3} w={2.2} a={90} />
        <Locker x={-1.9} y={-0.8} w={1.5} />
        <Boots x={-1.0} y={1.3} />
        <Towel x={0.9} y={1.5} colour="#dfe8ef" a={15} />
        <Bottle x={-0.8} y={-0.2} />
      </g>
    ),
    under: (c) => (c.seated ? <Bench x={0} y={c.r.hipY + 0.1} w={1.4} /> : null),
  },
  shop: {
    outdoor: false,
    ground: () => (
      <g>
        <Base id="pg-lino-grey" />
        <Shelf x={-1.0} />
        <Basket x={1.0} y={1.3} />
        <Can x={0.75} y={0.1} />
        <Handbag x={0.9} y={-0.4} />
      </g>
    ),
  },
  pavement: {
    outdoor: true,
    ground: (c) => (
      <g>
        <Base id="pg-paving" />
        <rect x={-4} y={-3} width={3.0} height={8} fill={FILL("pg-tarmac")} />
        <YellowLines x={-1.15} />
        <Kerb x={-1.0} />
        <Drain x={-0.75} y={1.6} />
        <LampBase x={0.95} y={-0.7} />
        <Can x={0.8} y={0.6} />
        <Handbag x={0.9} y={1.4} colour="#2b3139" />
        {c.amb.night && <Lamp x={0.95} y={-0.7} />}
      </g>
    ),
  },
  road_urban: {
    outdoor: true,
    ground: (c) => (
      <g>
        <Base id="pg-tarmac" />
        <Skid x={-1.5} y={0.5} />
        {Array.from({ length: 6 }, (_, i) => <rect key={i} x={0.95} y={-3 + i * 1.5} width={0.12} height={0.8} fill="#f4f4f0" opacity={0.85} />)}
        <Kerb x={1.6} side={1} />
        <rect x={1.76} y={-3} width={3} height={8} fill={FILL("pg-paving")} />
        {/rtc|collision|car|vehicle/.test(c.type + c.title.toLowerCase()) && <CarCorner x={-2.6} y={-0.5} />}
        {/rtc|collision|car|vehicle/.test(c.type + c.title.toLowerCase()) && <GlassFragments x={-0.6} y={0.2} />}
        <Cone x={0.95} y={1.7} />
        {c.amb.night && <Lamp x={-0.3} y={0.6} r={2.2} />}
      </g>
    ),
  },
  motorway: {
    outdoor: true,
    ground: (c) => (
      <g>
        <Base id="pg-tarmac" />
        <rect x={-0.95} y={-3} width={0.14} height={8} fill="#f4f4f0" opacity={0.9} />
        {Array.from({ length: 24 }, (_, i) => <rect key={i} x={-1.05} y={-3 + i * 0.35} width={0.08} height={0.14} fill="#f4f4f0" opacity={0.7} />)}
        <Barrier x={1.35} />
        <Cone x={-0.75} y={1.75} />
        <Cone x={-0.75} y={-0.7} />
        <GlassFragments x={0.6} y={0.3} />
        {c.amb.night && <Lamp x={0.2} y={0.5} r={2.2} />}
      </g>
    ),
  },
  car: {
    outdoor: true,
    crew: "car",
    lying: "reclined",
    ground: () => <CarInterior />,
    under: () => <CarSeat x={0} y={0} />,
    over: (c) => (
      <g>
        <Seatbelt r={c.r} />
        <SteeringWheel x={0} y={c.r.hipY + 0.18} />
      </g>
    ),
    monitor: [-1.5, 1.0],
    bag: [-1.45, 1.75],
    o2: [-1.55, -0.1],
  },
  lorry: {
    outdoor: true,
    crew: "car",
    lying: "reclined",
    ground: () => <CarInterior lorry />,
    under: () => <CarSeat x={0} y={0} w={0.66} colour="#3a3328" />,
    over: (c) => (
      <g>
        <Seatbelt r={c.r} />
        <SteeringWheel x={0} y={c.r.hipY + 0.14} r={0.24} airbag={false} />
      </g>
    ),
    monitor: [-1.5, 1.0],
    bag: [-1.45, 1.75],
    o2: [-1.55, -0.1],
  },
  pitch: {
    outdoor: true,
    ground: () => (
      <g>
        <Base id="pg-grass" />
        <rect x={-0.85} y={-3} width={0.12} height={8} fill="#f4f4f0" opacity={0.9} />
        <rect x={-0.85} y={-0.9} width={4} height={0.12} fill="#f4f4f0" opacity={0.9} />
        <Football x={0.95} y={0.85} />
        <Bottle x={-1.05} y={1.5} a={-40} />
        <Boots x={1.1} y={-0.3} />
      </g>
    ),
  },
  park: {
    outdoor: true,
    ground: (c) => (
      <g>
        <Base id="pg-grass-wild" />
        <Path x={1.0} />
        <Bench x={1.6} y={-0.9} w={1.5} a={90} />
        <Bin x={1.6} y={1.6} />
        <Leaves x={-0.8} y={0.6} />
        <Leaves x={0.6} y={1.7} />
        {c.amb.night && <Lamp x={1.6} y={0.5} />}
      </g>
    ),
  },
  moor: {
    outdoor: true,
    ground: () => (
      <g>
        <Base id="pg-heather" />
        <path d={smooth([[-1.4, -3], [-1.1, -1], [-1.3, 0.6], [-1.0, 2], [-1.2, 4], [-1.8, 4], [-1.7, 1], [-1.9, -3]], 0.5)} fill="#8a7a5a" opacity={0.8} />
        <Rock x={1.0} y={-0.6} s={1.2} />
        <Rock x={1.2} y={1.5} s={0.8} />
        <Rock x={-0.9} y={1.2} s={0.6} />
      </g>
    ),
  },
  lakeside: {
    outdoor: true,
    ground: () => (
      <g>
        <Base id="pg-shingle" />
        <rect x={-4} y={-3} width={3.0} height={8} fill={FILL("pg-water")} />
        <path d={smooth([[-1.0, -3], [-0.9, -1.5], [-1.05, 0], [-0.9, 1.5], [-1.0, 3], [-1.1, 4], [-1.3, 4], [-1.3, -3]], 0.5)} fill="#5b8f9a" opacity={0.5} />
        <Reeds x={-1.2} y={-0.6} />
        <LifeRing x={1.1} y={1.3} />
        <Rope from={[1.1, 1.3]} to={[0.4, 0.3]} />
      </g>
    ),
  },
  platform: {
    outdoor: true,
    ground: (c) => (
      <g>
        <Base id="pg-paving" />
        <rect x={-4} y={-3} width={8} height={8} fill="#6f777c" opacity={0.35} />
        <Rails x={-1.05} />
        <rect x={-1.05} y={-3} width={0.42} height={8} fill={FILL("pg-tactile")} />
        <rect x={-0.63} y={-3} width={0.08} height={8} fill="#f3d35a" />
        <Bench x={1.4} y={0.4} w={1.8} a={90} />
        <Bin x={1.3} y={-1.1} />
        <Mug x={0.8} y={0.9} spilt colour="#f4f4f0" />
        <Phone x={0.6} y={0.5} a={70} />
        {c.amb.night && <Lamp x={0.4} y={0.4} r={2} />}
      </g>
    ),
  },
  factory: {
    outdoor: false,
    ground: () => (
      <g>
        <Base id="pg-concrete" />
        <rect x={-0.95} y={-3} width={0.08} height={8} fill="#f3d35a" />
        <rect x={1.0} y={-3} width={0.08} height={8} fill="#f3d35a" />
        <MachineBase x={-2.7} y={-1.0} />
        <Pallet x={1.9} y={1.2} />
        <OilStain x={0.7} y={-0.6} />
        <HardHat x={0.75} y={0.2} />
      </g>
    ),
  },
  site: {
    outdoor: true,
    ground: (c) => (
      <g>
        <Base id="pg-mud" />
        <rect x={1.2} y={-3} width={0.1} height={8} fill="#9aa0a6" {...line} />
        <rect x={1.45} y={-3} width={0.1} height={8} fill="#9aa0a6" {...line} />
        <Pallet x={-1.9} y={0.8} blocks />
        <HardHat x={0.8} y={-0.2} />
        <rect x={-1.2} y={-1.8} width={0.25} height={2.4} rx={0.02} fill="#a08050" {...line} transform="rotate(-8 -1.2 -1.8)" />
        {c.amb.rain && <Puddles />}
      </g>
    ),
  },
  yard: {
    outdoor: true,
    ground: () => (
      <g>
        <Base id="pg-concrete" />
        <rect x={-4} y={-3} width={8} height={8} fill="#000" opacity={0.15} />
        <Rails x={2.6} />
        <rect x={-4} y={-3} width={2.8} height={8} fill="#8a3f3f" {...line} />
        {Array.from({ length: 12 }, (_, i) => <rect key={i} x={-4} y={-3 + i * 0.7} width={2.8} height={0.3} fill="#7a3535" />)}
        <Pallet x={0.9} y={1.6} />
        <OilStain x={-0.7} y={-0.6} />
      </g>
    ),
  },
  water: {
    outdoor: true,
    crew: "water",
    ground: () => (
      <g>
        <Base id="pg-water" />
        <rect x={-4} y={-3} width={8} height={8} fill="#2f5c66" opacity={0.25} />
        <Rope from={[2.2, 1.6]} to={[0.3, 0.45]} />
      </g>
    ),
    over: (c) => (
      <g className="ps-water-over">
        <rect x={-4} y={c.r.chestY + 0.1} width={8} height={6} fill="#3d6f7a" opacity={0.55} />
        {[0.35, 0.65, 0.95].map((t) => <ellipse key={t} cx={0} cy={c.r.chestY} rx={0.55 + t * 0.9} ry={0.35 + t * 0.6} fill="none" stroke="#9fd0d8" strokeWidth={0.015} opacity={0.5 - t * 0.35} />)}
      </g>
    ),
  },
  height: {
    outdoor: true,
    crew: "ledge",
    ground: () => (
      <g>
        <Base fill="#2b2f33" />
        <rect x={-4} y={-3} width={3.0} height={8} fill="#3a4044" />
        <rect x={-4} y={-3} width={2.4} height={8} fill="#2f3b2f" opacity={0.8} />
        <rect x={-1.0} y={-3} width={5} height={8} fill={FILL("pg-rock")} />
        <path d="M-1.0 -3 l0.1 1 l-0.15 1.2 l0.12 1.5 l-0.1 1.2 l0.08 1.3 l-0.05 1.8" fill="none" stroke="#1b1f24" strokeWidth={0.06} />
        <Rope from={[2.4, -1.4]} to={[0.35, 0.5]} colour="#e03a3a" />
        <Rock x={1.4} y={1.6} s={0.8} />
      </g>
    ),
  },
  ambulance_street: {
    outdoor: false,
    crew: "bedside",
    lying: "reclined",
    framing: "full",
    ground: () => <AmbulanceSaloon outside={<g><rect x={-4} y={2.4} width={8} height={3} fill={FILL("pg-paving")} /><Kerb x={-0.5} side={1} /></g>} />,
    under: () => <Trolley x={0} y={0} />,
    over: (c) => <TrolleyStraps x={0} y={0} r={c.r} />,
    monitor: [-1.0, 0.9],
    bag: [0.95, 1.6],
    o2: [-0.9, -0.6],
  },
  ambulance_motorway: {
    outdoor: false,
    crew: "bedside",
    lying: "reclined",
    framing: "full",
    ground: () => <AmbulanceSaloon outside={<g><rect x={-4} y={2.4} width={8} height={3} fill={FILL("pg-tarmac")} /><rect x={-4} y={3.1} width={8} height={0.14} fill="#f4f4f0" opacity={0.9} /></g>} />,
    under: () => <Trolley x={0} y={0} />,
    over: (c) => <TrolleyStraps x={0} y={0} r={c.r} />,
    monitor: [-1.0, 0.9],
    bag: [0.95, 1.6],
    o2: [-0.9, -0.6],
  },
  ambulance_river: {
    outdoor: false,
    crew: "bedside",
    lying: "reclined",
    framing: "full",
    ground: () => <AmbulanceSaloon outside={<g><rect x={-4} y={2.4} width={8} height={3} fill={FILL("pg-grass-wild")} /><rect x={-4} y={3.3} width={8} height={2} fill={FILL("pg-water")} /></g>} />,
    under: () => <Trolley x={0} y={0} />,
    over: (c) => <TrolleyStraps x={0} y={0} r={c.r} />,
    monitor: [-1.0, 0.9],
    bag: [0.95, 1.6],
    o2: [-0.9, -0.6],
  },
  ambulance_field: {
    outdoor: false,
    crew: "bedside",
    lying: "reclined",
    framing: "full",
    ground: () => <AmbulanceSaloon outside={<rect x={-4} y={2.4} width={8} height={3} fill={FILL("pg-grass-wild")} />} />,
    under: () => <Trolley x={0} y={0} />,
    over: (c) => <TrolleyStraps x={0} y={0} r={c.r} />,
    monitor: [-1.0, 0.9],
    bag: [0.95, 1.6],
    o2: [-0.9, -0.6],
  },
};

/** The clip the ambulance doors look out through; put in defs. */
export function GroundClips() {
  return (
    <clipPath id="pg-doors-clip">
      <rect x={-1.1} y={2.4} width={2.2} height={4} />
    </clipPath>
  );
}

/** Night and rain over the ground: a torch pool on the patient, the rest in the dark; wet streaks. */
export function Weather({ amb, outdoor, centre, k }: { amb: Ambient; outdoor: boolean; centre: Pt; k: number }) {
  return (
    <g>
      {amb.night && (
        <g className={outdoor ? "ps-night outdoor" : "ps-night"}>
          <circle cx={centre[0]} cy={centre[1]} r={2.3 * k} fill="url(#pg-torch)" />
          <rect x={-4} y={-3} width={8} height={8} fill="#0a1420" opacity={outdoor ? 0.55 : 0.3} mask="url(#pg-torch-mask)" />
          {outdoor && <rect x={-4} y={-3} width={8} height={8} fill="#2f8fd6" className="ps-blue-wash" />}
        </g>
      )}
      {amb.rain && outdoor && <Puddles />}
    </g>
  );
}

export function WeatherDefs() {
  return (
    <mask id="pg-torch-mask">
      <rect x={-4} y={-3} width={8} height={8} fill="#fff" />
      <circle cx={0} cy={0.6} r={1.4} fill="#000" />
      <circle cx={0} cy={0.6} r={1.9} fill="#000" opacity={0.5} />
    </mask>
  );
}
