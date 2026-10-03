"use client";

// THE PATIENT SCENE. A side view of the person being treated: where they
// are (a living room, a kitchen, a pavement, a pitch, a platform, the
// stairs, a car seat, the water, a ledge), how they lie, the colour of
// their skin, how hard they breathe, what the crew have put on them,
// and the crew themselves around them. The counterpart of the
// fireground plan — everything on it is read off the record, so fitting
// a cannula or a mask changes the picture, and a patient going off looks
// like one.

import type { PatientLook, Posture } from "@/lib/sim/patient_look";
import type { SceneSetting } from "@/lib/sim/scene_setting";

type Pt = [number, number];

export type SceneCrew = {
  callsign: string;
  /** "Paramedic", "Technician", "Doctor" … for the label. */
  role: string;
  lead?: boolean;
};

export type PatientSceneProps = {
  look: PatientLook;
  crew: SceneCrew[];
  setting: SceneSetting;
  /** Setting words for the caption, e.g. "Sat on the stairs". */
  caption?: string;
};

const SKIN: Record<PatientLook["skin"], string> = {
  normal: "#e9b58f",
  pale: "#f2ddcc",
  grey: "#b3b9be",
  cyanosed: "#98acc3",
  flushed: "#e58b7a",
};
const INK = "#1b2733";
const HAIR = "#3a2a1f";
const TOP = "#4d6f9f";
const TOP_DARK = "#3b5880";
const TROUSERS = "#3c4653";
const TROUSERS_DARK = "#2c343e";
const SHOES = "#232a30";
const CREW_SKIN = "#d9a983";
const CREW_HAIR = "#2b2320";
const CREW_GREEN = "#1f8a4c";
const CREW_GREEN_DARK = "#166b3a";
const HI_VIS = "#ece84a";
const SILVER = "#dde3e7";
const CREW_TROUSERS = "#1e2a35";
const BOOTS = "#15191c";
const KIT = "#dfe8ef";

type Joints = {
  head: Pt; r: number;
  neck: Pt; hip: Pt;
  knee: Pt; foot: Pt;
  knee2?: Pt; foot2?: Pt;
  elbow: Pt; hand: Pt;
  elbow2?: Pt; hand2?: Pt;
  /** Which way the face points. */
  facing: "up" | "right" | "left";
  /** Kit anchors. */
  chest: Pt; upperArm: Pt; forearm: Pt; thigh: Pt; neckRing: Pt;
};

const GROUND = 206;

function joints(p: Posture): Joints {
  switch (p) {
    case "supine":
      return {
        head: [96, 190], r: 14, neck: [112, 193], hip: [236, 197], knee: [302, 195], foot: [372, 200],
        knee2: [300, 199], foot2: [368, 203],
        elbow: [168, 202], hand: [212, 205], facing: "up",
        chest: [160, 184], upperArm: [146, 203], forearm: [190, 204], thigh: [268, 190], neckRing: [116, 193],
      };
    case "sitting":
      return {
        head: [236, 110], r: 13, neck: [236, 126], hip: [232, 170], knee: [278, 176], foot: [286, GROUND],
        knee2: [268, 180], foot2: [274, GROUND], elbow: [252, 146], hand: [266, 168], facing: "right",
        chest: [243, 140], upperArm: [245, 134], forearm: [259, 158], thigh: [255, 172], neckRing: [236, 128],
      };
    case "in_vehicle":
      return {
        head: [250, 112], r: 13, neck: [250, 128], hip: [240, 172], knee: [288, 170], foot: [300, GROUND],
        elbow: [266, 150], hand: [292, 156], facing: "right",
        chest: [257, 142], upperArm: [258, 136], forearm: [280, 152], thigh: [264, 170], neckRing: [250, 130],
      };
    case "in_water":
      return {
        head: [236, 150], r: 13, neck: [236, 166], hip: [232, 206], knee: [248, 228], foot: [258, 246],
        elbow: [208, 156], hand: [198, 134], elbow2: [264, 156], hand2: [274, 134], facing: "right",
        chest: [240, 180], upperArm: [224, 160], forearm: [204, 146], thigh: [240, 218], neckRing: [236, 168],
      };
    case "at_height":
      return {
        head: [330, 110], r: 13, neck: [330, 126], hip: [326, 170], knee: [364, 182], foot: [370, 228],
        elbow: [346, 148], hand: [360, 168], facing: "right",
        chest: [337, 142], upperArm: [338, 136], forearm: [353, 158], thigh: [345, 176], neckRing: [330, 128],
      };
  }
}

const pt = (p: Pt) => `${p[0]} ${p[1]}`;
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** A tapered limb from a to b: w1 wide at a, w2 at b, rounded at the joints. */
function Limb({ a, b, w1, w2, fill, dark }: { a: Pt; b: Pt; w1: number; w2: number; fill: string; dark?: string }) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const d = `M${a[0] + nx * w1 / 2} ${a[1] + ny * w1 / 2} L${b[0] + nx * w2 / 2} ${b[1] + ny * w2 / 2} L${b[0] - nx * w2 / 2} ${b[1] - ny * w2 / 2} L${a[0] - nx * w1 / 2} ${a[1] - ny * w1 / 2} Z`;
  return (
    <g>
      <circle cx={a[0]} cy={a[1]} r={w1 / 2} fill={fill} />
      <circle cx={b[0]} cy={b[1]} r={w2 / 2} fill={fill} />
      <path d={d} fill={fill} />
      {dark && <path d={`M${a[0] + nx * w1 / 2} ${a[1] + ny * w1 / 2} L${b[0] + nx * w2 / 2} ${b[1] + ny * w2 / 2} L${b[0] + nx * w2 * 0.1} ${b[1] + ny * w2 * 0.1} L${a[0] + nx * w1 * 0.1} ${a[1] + ny * w1 * 0.1} Z`} fill={dark} opacity="0.55" />}
      <path d={d} fill="none" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" opacity="0.7" />
    </g>
  );
}

/** A shoe or boot at a foot, pointing the way the figure faces. */
function Shoe({ at, facing, colour, boot }: { at: Pt; facing: 1 | -1; colour: string; boot?: boolean }) {
  const w = boot ? 18 : 15;
  const h = boot ? 9 : 6;
  const x = facing === 1 ? at[0] - 5 : at[0] - w + 5;
  return <rect x={x} y={at[1] - h + 2} width={w} height={h} rx={3} fill={colour} stroke={INK} strokeWidth="0.8" />;
}

/** A head: skin, a cap of hair, an ear. */
function Head({ at, r, skin, hair, facing }: { at: Pt; r: number; skin: string; hair: string; facing: "up" | "right" | "left" }) {
  const [cx, cy] = at;
  const hairPath = facing === "up"
    ? `M${cx - r} ${cy} a${r} ${r} 0 0 1 ${r * 0.9} ${-r * 0.98} q${r * 0.3} ${r * 0.35} ${r * 0.1} ${r * 0.7} q${-r * 0.6} ${-r * 0.1} ${-r * 0.8} ${r * 0.2} z`
    : facing === "right"
      ? `M${cx - r} ${cy + r * 0.2} a${r} ${r} 0 0 1 ${r * 1.7} ${-r * 0.75} q${-r * 0.5} ${r * 0.1} ${-r * 0.8} ${r * 0.35} q${-r * 0.4} ${r * 0.15} ${-r * 0.9} ${r * 0.2} z`
      : `M${cx + r} ${cy + r * 0.2} a${r} ${r} 0 0 0 ${-r * 1.7} ${-r * 0.75} q${r * 0.5} ${r * 0.1} ${r * 0.8} ${r * 0.35} q${r * 0.4} ${r * 0.15} ${r * 0.9} ${r * 0.2} z`;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={skin} stroke={INK} strokeWidth="0.9" />
      <path d={hairPath} fill={hair} />
      {facing !== "up" && <circle cx={facing === "right" ? cx - r * 0.55 : cx + r * 0.55} cy={cy + r * 0.1} r={r * 0.22} fill={skin} stroke={INK} strokeWidth="0.6" />}
      {facing === "up" && <circle cx={cx + r * 0.1} cy={cy + r * 0.75} r={r * 0.22} fill={skin} stroke={INK} strokeWidth="0.6" />}
    </g>
  );
}

function Setting({ setting, bleeding, j }: { setting: SceneSetting; bleeding: boolean; j: Joints }) {
  const pool = bleeding ? <ellipse cx={j.chest[0] + 10} cy={GROUND + 2} rx={44} ry={6} className="ps-blood" /> : null;
  switch (setting) {
    case "home":
      return (
        <g className="ps-setting">
          <line x1="20" y1="196" x2="460" y2="196" className="ps-skirting" />
          <line x1="20" y1={GROUND + 6} x2="460" y2={GROUND + 6} className="ps-ground" />
          <rect x="60" y="60" width="54" height="42" rx="2" className="ps-frame" />
          <path d="M66 96 l14 -18 l10 12 l8 -8 l14 14" className="ps-frame-art" />
          <path d="M372 150 h78 v56 h-78 z M372 150 q-10 0 -10 10 v46 h10 z M450 150 q10 0 10 10 v46 h-10 z" className="ps-sofa" />
          <rect x="376" y="140" width="70" height="14" rx="6" className="ps-sofa-cushion" />
          <ellipse cx={j.hip[0]} cy={GROUND + 4} rx="110" ry="7" className="ps-rug" />
          <path d="M40 206 v-60 M34 146 h12 l-6 -22 z" className="ps-lamp" />
          <path d="M22 118 h36 l-6 28 h-24 z" className="ps-lampshade" />
          {pool}
        </g>
      );
    case "kitchen":
      return (
        <g className="ps-setting">
          <path d="M20 60 h440" className="ps-tile-line" />
          <path d="M20 100 h440 M20 140 h440" className="ps-tile-line" />
          <rect x="330" y="146" width="130" height="60" className="ps-counter" />
          <rect x="330" y="142" width="130" height="8" rx="1" className="ps-worktop" />
          <path d="M372 146 v60 M416 146 v60 M340 176 h18 M382 176 h18 M426 176 h18" className="ps-cupboard" />
          <path d="M350 142 v-16 q0 -8 8 -8 h14 q8 0 8 8 v16 z M382 128 q8 -6 0 -14" className="ps-kettle" />
          <rect x="400" y="130" width="34" height="12" rx="2" className="ps-kettle" />
          <line x1="20" y1={GROUND + 6} x2="460" y2={GROUND + 6} className="ps-ground" />
          <path d="M20 206 h300" className="ps-tile-floor" strokeDasharray="30 3" />
          {pool}
        </g>
      );
    case "bathroom":
      return (
        <g className="ps-setting">
          <g className="ps-tile-line">
            {[70, 100, 130, 160].map((y) => <line key={y} x1="20" y1={y} x2="460" y2={y} />)}
            {[80, 140, 200, 260, 320, 380, 440].map((x) => <line key={x} x1={x} y1="60" x2={x} y2="176" />)}
          </g>
          <path d="M330 160 h130 v46 h-130 z" className="ps-bath" />
          <path d="M324 156 h142 v8 h-142 z" className="ps-bath-rim" />
          <path d="M448 150 v-40 q0 -6 -6 -6 h-6" className="ps-tap" />
          <rect x="60" y="150" width="40" height="56" rx="4" className="ps-cistern" />
          <ellipse cx="80" cy="190" rx="26" ry="10" className="ps-bath-rim" />
          <line x1="20" y1={GROUND + 6} x2="460" y2={GROUND + 6} className="ps-ground" />
          <rect x="140" y="200" width="150" height="8" rx="3" className="ps-mat" />
          {pool}
        </g>
      );
    case "stairs":
      return (
        <g className="ps-setting">
          <path d="M20 206 H120 V182 H160 V158 H200 V172 H300 V206 H460" className="ps-ground" />
          <path d="M120 206 V182 H160 V158 H200 V172 H300 V206 Z" className="ps-step" />
          <path d="M126 182 v-14 M166 158 v-14 M206 172 v-14 M126 168 l80 -28" className="ps-banister" />
          <line x1="20" y1="196" x2="120" y2="196" className="ps-skirting" />
          {bleeding && <ellipse cx="270" cy={GROUND + 3} rx="40" ry="6" className="ps-blood" />}
        </g>
      );
    case "ward":
      return (
        <g className="ps-setting">
          <line x1="20" y1="54" x2="460" y2="54" className="ps-rail" />
          <path d="M24 54 v100 q6 -6 12 0 v-100 M36 54 v100 q6 -6 12 0 v-100 M48 54 v100 q6 -6 12 0 v-100" className="ps-curtain" />
          <rect x="330" y="150" width="130" height="18" rx="3" className="ps-mattress" />
          <rect x="334" y="140" width="36" height="12" rx="4" className="ps-pillow" />
          <path d="M330 168 v38 M460 168 v38 M330 140 v10 h4 v-10 z M456 128 v22 h4 v-22 z" className="ps-bedframe" />
          <rect x="326" y="128" width="8" height="22" rx="2" className="ps-bedframe" />
          <path d="M300 206 v-80 M292 126 h16 M296 134 v-8 h8 v8 z" className="ps-drip" />
          <rect x="290" y="112" width="12" height="20" rx="2" className="ps-bag" />
          <line x1="20" y1={GROUND + 6} x2="460" y2={GROUND + 6} className="ps-ground" />
          {pool}
        </g>
      );
    case "venue":
      return (
        <g className="ps-setting">
          <line x1="20" y1="196" x2="460" y2="196" className="ps-skirting" />
          <rect x="350" y="150" width="100" height="8" rx="2" className="ps-table" />
          <path d="M360 158 v48 M440 158 v48" className="ps-table-leg" />
          <path d="M20 160 h60 v46 h-60 z M20 160 v-8 h60 v8" className="ps-counter" />
          <path d="M34 160 v-22 M34 138 h20 v22" className="ps-stool" />
          <path d="M414 170 h22 v36 M436 170 v-26 h4 v62" className="ps-chair" />
          <path d="M60 60 h120 v80 h-120 z" className="ps-window" />
          <line x1="20" y1={GROUND + 6} x2="460" y2={GROUND + 6} className="ps-ground" />
          {pool}
        </g>
      );
    case "street":
      return (
        <g className="ps-setting">
          <rect x="300" y="60" width="160" height="146" className="ps-shopfront" />
          <rect x="314" y="90" width="132" height="90" className="ps-window" />
          <path d="M296 72 h168 l-8 12 h-152 z" className="ps-awning" />
          <path d="M40 206 v-150 M34 56 h12 v-14 h-12 z" className="ps-lamppost" />
          <circle cx="40" cy="48" r="6" className="ps-lamp-glow" />
          <rect x="200" y="176" width="22" height="30" rx="2" className="ps-bin" />
          <line x1="20" y1={GROUND + 6} x2="460" y2={GROUND + 6} className="ps-ground" />
          <path d="M20 218 h440" className="ps-kerb" />
          <path d="M20 212 h440" className="ps-kerb-line" strokeDasharray="40 4" />
          {pool}
        </g>
      );
    case "road":
      return (
        <g className="ps-setting">
          <path d="M20 150 h440" className="ps-barrier" />
          <path d="M60 150 v30 M160 150 v30 M260 150 v30 M360 150 v30 M460 150 v30" className="ps-barrier-post" />
          <path d="M20 180 h440" className="ps-kerb" />
          <line x1="20" y1={GROUND + 6} x2="460" y2={GROUND + 6} className="ps-ground" />
          <path d="M20 236 h440" className="ps-road-line" strokeDasharray="28 18" />
          <path d="M70 206 l8 -26 l8 26 z M78 192 h-5 l1 -4 h8 l1 4 z" className="ps-cone" />
          <path d="M420 206 l8 -26 l8 26 z M428 192 h-5 l1 -4 h8 l1 4 z" className="ps-cone" />
          <path d="M60 206 h36 M410 206 h36" className="ps-cone-base" />
          {pool}
        </g>
      );
    case "vehicle":
      return (
        <g className="ps-setting">
          <line x1="20" y1={GROUND + 6} x2="460" y2={GROUND + 6} className="ps-ground" />
          <path d="M150 206 V160 Q150 150 160 150 H330 Q350 150 356 170 L368 206" className="ps-car" />
          <path d="M160 150 L190 86 Q196 76 208 76 H300 Q314 76 320 88 L336 150" className="ps-car" />
          <path d="M196 148 L220 92 H298 L316 148 Z" className="ps-glass" />
          <path d="M224 172 H252 Q262 172 262 162 V118 Q262 110 254 110 H228" className="ps-seat" />
          <circle cx="190" cy={GROUND - 4} r="18" className="ps-wheel" />
          <circle cx="190" cy={GROUND - 4} r="8" className="ps-hub" />
          <circle cx="400" cy={GROUND - 4} r="18" className="ps-wheel" />
          <circle cx="400" cy={GROUND - 4} r="8" className="ps-hub" />
          <path d="M60 206 l8 -26 l8 26 z" className="ps-cone" />
          {bleeding && <ellipse cx="280" cy="184" rx="26" ry="5" className="ps-blood" />}
        </g>
      );
    case "grass":
      return (
        <g className="ps-setting">
          <path d="M20 206 h440" className="ps-turf" />
          <g className="ps-tufts">
            {[30, 70, 130, 190, 250, 320, 380, 430].map((x) => <path key={x} d={`M${x} 206 l3 -9 l3 9 M${x + 8} 206 l2 -7 l3 7`} />)}
          </g>
          <path d="M380 206 v-100 h70 M450 106 v100" className="ps-goal" />
          <path d="M384 110 v92 M392 110 v92 M400 110 v92 M408 110 v92 M416 110 v92 M424 110 v92 M432 110 v92 M440 110 v92" className="ps-net" />
          <path d="M70 206 v-70" className="ps-trunk" />
          <circle cx="70" cy="110" r="36" className="ps-canopy" />
          <circle cx="48" cy="130" r="24" className="ps-canopy" />
          <circle cx="94" cy="128" r="26" className="ps-canopy" />
          {pool}
        </g>
      );
    case "platform":
      return (
        <g className="ps-setting">
          <path d="M20 206 h340" className="ps-ground" />
          <path d="M360 206 v30 h100" className="ps-ground" />
          <path d="M20 200 h340" className="ps-yellow-line" />
          <path d="M360 236 h100 M360 244 h100" className="ps-rail" />
          <path d="M372 236 v8 M392 236 v8 M412 236 v8 M432 236 v8 M452 236 v8" className="ps-sleeper" />
          <path d="M60 206 v-120" className="ps-signpost" />
          <rect x="30" y="70" width="80" height="20" rx="3" className="ps-sign" />
          <rect x="140" y="160" width="60" height="46" rx="3" className="ps-bench" />
          <path d="M20 60 h440" className="ps-canopy-edge" />
          {pool}
        </g>
      );
    case "workplace":
      return (
        <g className="ps-setting">
          <path d="M20 60 h440 M20 60 l40 40 M100 60 l40 40 M180 60 l40 40 M260 60 l40 40 M340 60 l40 40 M420 60 l40 40" className="ps-roof-truss" />
          <rect x="330" y="120" width="130" height="86" rx="2" className="ps-machine" />
          <rect x="344" y="136" width="40" height="26" rx="2" className="ps-machine-panel" />
          <circle cx="430" cy="160" r="18" className="ps-machine-wheel" />
          <path d="M330 196 h130" className="ps-hazard" strokeDasharray="10 10" />
          <rect x="30" y="178" width="70" height="12" rx="1" className="ps-pallet" />
          <rect x="30" y="192" width="70" height="12" rx="1" className="ps-pallet" />
          <rect x="40" y="150" width="50" height="28" rx="1" className="ps-crate" />
          <line x1="20" y1={GROUND + 6} x2="460" y2={GROUND + 6} className="ps-ground" />
          {pool}
        </g>
      );
    case "water":
      return (
        <g className="ps-setting">
          <path d="M20 166 Q50 156 80 166 T140 166 T200 166 T260 166 T320 166 T380 166 T440 166 T500 166 V260 H20 Z" className="ps-water" />
          <path d="M20 166 Q50 156 80 166 T140 166 T200 166 T260 166 T320 166 T380 166 T440 166 T500 166" className="ps-wave" />
          <path d="M20 166 h60 v-10 h-60 z" className="ps-bank" />
          <path d="M400 166 h60 v-10 h-60 z" className="ps-bank" />
        </g>
      );
    case "height":
      return (
        <g className="ps-setting">
          <path d="M20 206 H120 V40" className="ps-ground" />
          <path d="M260 170 H460 V206" className="ps-ground" />
          <path d="M260 170 V260" className="ps-drop" />
          <rect x="260" y="170" width="200" height="90" className="ps-step" />
          <path d="M262 176 q-10 20 0 40 q-8 16 0 32" className="ps-rock" />
        </g>
      );
  }
}

function Patient({ look, j }: { look: PatientLook; j: Joints }) {
  const skin = SKIN[look.skin];
  const breath = look.breathing === "none" ? 0 : 60 / Math.max(6, look.rr);
  const lying = j.facing === "up";
  const f: 1 | -1 = j.facing === "left" ? -1 : 1;
  const torsoStyle = breath ? ({ "--ps-breath": `${breath.toFixed(2)}s` } as React.CSSProperties) : undefined;
  const torsoClass = `ps-torso${breath ? (lying ? " breathe-up" : " breathe-fwd") : ""}${look.compressor ? " cpr" : ""}${look.breathing === "laboured" ? " laboured" : ""}`;
  const shoulder = lerp(j.neck, j.hip, 0.08);
  // The torso: shoulders wider than the hips, a collar at the neck.
  const torsoW1 = lying ? 26 : 24;
  const torsoW2 = lying ? 22 : 20;
  return (
    <g className={`ps-patient${look.seizing ? " seizing" : ""}`}>
      {look.kit.board && lying && <rect x={70} y={j.hip[1] + 4} width={320} height={9} rx={2} className="ps-board" />}
      {/* Far leg and arm first */}
      {j.knee2 && j.foot2 && (
        <g opacity="0.85">
          <Limb a={j.hip} b={j.knee2} w1={14} w2={11} fill={TROUSERS_DARK} />
          <Limb a={j.knee2} b={j.foot2} w1={11} w2={9} fill={TROUSERS_DARK} />
          <Shoe at={j.foot2} facing={f} colour={SHOES} />
        </g>
      )}
      {j.elbow2 && j.hand2 && (
        <g opacity="0.85">
          <Limb a={shoulder} b={j.elbow2} w1={10} w2={8} fill={TOP_DARK} />
          <Limb a={j.elbow2} b={j.hand2} w1={8} w2={6} fill={skin} />
        </g>
      )}
      {/* Near leg */}
      <Limb a={j.hip} b={j.knee} w1={14} w2={11} fill={TROUSERS} dark={TROUSERS_DARK} />
      <Limb a={j.knee} b={j.foot} w1={11} w2={9} fill={TROUSERS} dark={TROUSERS_DARK} />
      <Shoe at={j.foot} facing={f} colour={SHOES} />
      {look.kit.splint && <Limb a={lerp(j.hip, j.knee, 0.1)} b={lerp(j.knee, j.foot, 0.9)} w1={3} w2={3} fill={KIT} />}
      {look.kit.tourniquet && <Limb a={lerp(j.hip, j.knee, 0.35)} b={lerp(j.hip, j.knee, 0.5)} w1={17} w2={17} fill="#e8572a" />}
      {/* Torso, breathing */}
      <g className={torsoClass} style={torsoStyle}>
        <Limb a={j.neck} b={j.hip} w1={torsoW1} w2={torsoW2} fill={TOP} dark={TOP_DARK} />
        <path d={lying ? `M${j.neck[0]} ${j.neck[1] - 10} l10 6 l-10 6` : `M${j.neck[0] - 8} ${j.neck[1] + 2} l8 10 l8 -10`} fill="none" stroke={TOP_DARK} strokeWidth="1.6" />
        {look.kit.pelvicBinder && <Limb a={lerp(j.neck, j.hip, 0.86)} b={j.hip} w1={26} w2={26} fill={KIT} />}
        {look.kit.dressing && <circle cx={j.chest[0] + (lying ? 30 : 4)} cy={j.chest[1] + (lying ? 8 : 28)} r={7} className="ps-dressing" />}
        {look.kit.pads && (lying ? (
          <>
            <rect x={j.chest[0] - 18} y={j.chest[1] - 6} width={14} height={10} rx={2} className="ps-pad" />
            <rect x={j.chest[0] + 22} y={j.chest[1] + 2} width={14} height={10} rx={2} className="ps-pad" />
          </>
        ) : (
          <>
            <rect x={j.chest[0] - 2} y={j.chest[1] - 12} width={10} height={13} rx={2} className="ps-pad" />
            <rect x={j.chest[0] + 2} y={j.chest[1] + 14} width={10} height={13} rx={2} className="ps-pad" />
          </>
        ))}
        {look.kit.leads && (
          <g className="ps-leads">
            {[[-14, -4], [12, -4], [0, 14]].map(([dx, dy], i) => (
              <circle key={i} cx={j.chest[0] + (lying ? dx : dy * 0.5)} cy={j.chest[1] + (lying ? dy * 0.5 : dx)} r={2.6} className="ps-electrode" />
            ))}
            <path d={`M${j.chest[0]} ${j.chest[1]} Q${j.chest[0] - 40} ${j.chest[1] + 10} ${lying ? 60 : j.chest[0] - 110} ${GROUND - 18}`} className="ps-wire" />
          </g>
        )}
        {look.hurt.includes("chest") && <circle cx={j.chest[0]} cy={j.chest[1] + (lying ? 0 : 4)} r={11} className="ps-hurt" />}
        {look.hurt.includes("abdomen") && <circle cx={lerp(j.neck, j.hip, 0.65)[0]} cy={lerp(j.neck, j.hip, 0.65)[1] - (lying ? 10 : 0)} r={10} className="ps-hurt" />}
        {look.hurt.includes("pelvis") && <circle cx={j.hip[0]} cy={j.hip[1] - (lying ? 10 : 0)} r={10} className="ps-hurt" />}
      </g>
      {/* Near arm */}
      <Limb a={shoulder} b={j.elbow} w1={11} w2={9} fill={TOP} dark={TOP_DARK} />
      <Limb a={j.elbow} b={j.hand} w1={9} w2={7} fill={skin} />
      <circle cx={j.hand[0]} cy={j.hand[1]} r={4.5} fill={skin} stroke={INK} strokeWidth="0.8" />
      {(look.hurt.includes("left_arm") || look.hurt.includes("right_arm")) && <circle cx={j.elbow[0]} cy={j.elbow[1]} r={9} className="ps-hurt" />}
      {(look.hurt.includes("left_leg") || look.hurt.includes("right_leg")) && <circle cx={j.knee[0]} cy={j.knee[1]} r={9} className="ps-hurt" />}
      {look.kit.cuff && <Limb a={lerp(j.upperArm, j.elbow, -0.1)} b={lerp(j.upperArm, j.elbow, 0.35)} w1={15} w2={15} fill={KIT} />}
      {look.kit.iv && (
        <g>
          <Limb a={lerp(j.elbow, j.hand, 0.55)} b={lerp(j.elbow, j.hand, 0.8)} w1={4} w2={4} fill="#f4f7f9" />
          <path d={`M${pt(lerp(j.elbow, j.hand, 0.65))} Q${j.hand[0] + 30} ${j.hand[1] - 50} ${j.hand[0] + 56} ${Math.max(40, j.hand[1] - 90)}`} className="ps-line" />
          <rect x={j.hand[0] + 50} y={Math.max(40, j.hand[1] - 90) - 24} width={12} height={24} rx={2} className="ps-bag" />
        </g>
      )}
      {look.kit.probe && <circle cx={j.hand[0] + (lying ? 6 : 2)} cy={j.hand[1] + (lying ? 0 : 6)} r={3.5} className="ps-probe" />}
      {/* Head */}
      {look.kit.collar && <circle cx={j.neckRing[0]} cy={j.neckRing[1]} r={11} className="ps-collar" />}
      <Head at={j.head} r={j.r} skin={skin} hair={HAIR} facing={j.facing} />
      {look.hurt.includes("head") && <circle cx={j.head[0]} cy={j.head[1]} r={j.r + 4} className="ps-hurt" />}
      {look.eyes !== "closed" ? (
        lying ? (
          <>
            <ellipse cx={j.head[0] - 5} cy={j.head[1] - 5} rx={1.8} ry={look.eyes === "half" ? 0.8 : 1.6} className="ps-eye" />
            <ellipse cx={j.head[0] + 5} cy={j.head[1] - 5} rx={1.8} ry={look.eyes === "half" ? 0.8 : 1.6} className="ps-eye" />
          </>
        ) : (
          <ellipse cx={j.head[0] + 6} cy={j.head[1] - 3} rx={1.8} ry={look.eyes === "half" ? 0.8 : 1.6} className="ps-eye" />
        )
      ) : (
        lying ? (
          <>
            <line x1={j.head[0] - 7} y1={j.head[1] - 5} x2={j.head[0] - 3} y2={j.head[1] - 5} className="ps-eye-shut" />
            <line x1={j.head[0] + 3} y1={j.head[1] - 5} x2={j.head[0] + 7} y2={j.head[1] - 5} className="ps-eye-shut" />
          </>
        ) : <line x1={j.head[0] + 4} y1={j.head[1] - 3} x2={j.head[0] + 9} y2={j.head[1] - 3} className="ps-eye-shut" />
      )}
      {/* The mouth: open when struggling, a line otherwise */}
      {!lying && (look.breathing === "laboured" ? <ellipse cx={j.head[0] + 8} cy={j.head[1] + 5} rx={1.6} ry={2.4} className="ps-mouth" /> : <line x1={j.head[0] + 6} y1={j.head[1] + 5} x2={j.head[0] + 10} y2={j.head[1] + 5} className="ps-eye-shut" />)}
      {look.sweating && (
        <g className="ps-sweat">
          <path d={`M${j.head[0] - 10} ${j.head[1] - 12} q-2 4 0 6 q2 -2 0 -6z`} />
          <path d={`M${j.head[0] + 12} ${j.head[1] - 6} q-2 4 0 6 q2 -2 0 -6z`} />
        </g>
      )}
      {look.kit.oxygen === "nasal" && <path d={lying ? `M${j.head[0] - 8} ${j.head[1] - 2} h16 M${j.head[0] - 6} ${j.head[1] - 2} q-30 10 -40 40` : `M${j.head[0] + 10} ${j.head[1] + 2} q-16 2 -24 10 q-10 14 -16 40`} className="ps-tube" />}
      {(look.kit.oxygen === "mask" || look.kit.oxygen === "nrb") && (
        <g>
          {lying ? <path d={`M${j.head[0] - 10} ${j.head[1]} a10 9 0 0 1 20 0 v6 a10 6 0 0 1 -20 0z`} className="ps-mask" /> : <path d={`M${j.head[0] + 4} ${j.head[1] - 4} a9 9 0 0 1 10 10 v4 h-10z`} className="ps-mask" />}
          {look.kit.oxygen === "nrb" && <ellipse cx={lying ? j.head[0] - 22 : j.head[0] + 18} cy={lying ? j.head[1] + 12 : j.head[1] + 22} rx={6} ry={10} className="ps-bag-nrb" />}
          <path d={lying ? `M${j.head[0] - 20} ${j.head[1] + 20} q-10 20 -30 36` : `M${j.head[0] + 18} ${j.head[1] + 30} q6 20 2 50`} className="ps-tube" />
        </g>
      )}
      {look.kit.oxygen === "bvm" && (
        <g className="ps-bvm">
          <path d={lying ? `M${j.head[0] - 10} ${j.head[1]} a10 9 0 0 1 20 0 v6 a10 6 0 0 1 -20 0z` : `M${j.head[0] + 4} ${j.head[1] - 4} a9 9 0 0 1 10 10 v4 h-10z`} className="ps-mask" />
          <ellipse cx={lying ? j.head[0] - 24 : j.head[0] + 28} cy={lying ? j.head[1] - 20 : j.head[1] + 6} rx={lying ? 13 : 14} ry={8} className="ps-bag-bvm" />
          <path d={lying ? `M${j.head[0] - 10} ${j.head[1] - 4} q-4 -10 -2 -14` : `M${j.head[0] + 14} ${j.head[1] + 2} h8`} className="ps-tube" />
        </g>
      )}
      {look.kit.airway === "igel" && <path d={lying ? `M${j.head[0]} ${j.head[1] + 2} v-14 h6` : `M${j.head[0] + 10} ${j.head[1] + 4} h12 v-8`} className="ps-igel" />}
      {look.kit.airway === "tube" && <path d={lying ? `M${j.head[0]} ${j.head[1] + 4} v-24 q0 -8 8 -8 h14` : `M${j.head[0] + 10} ${j.head[1] + 4} h20 q8 0 8 -8 v-14`} className="ps-ett" />}
      {look.kit.capno && look.kit.airway !== "none" && <rect x={lying ? j.head[0] + 16 : j.head[0] + 32} y={lying ? j.head[1] - 34 : j.head[1] - 30} width={10} height={7} rx={1} className="ps-capno" />}
      {look.kit.blanket && lying && <path d={`M${j.neck[0] + 12} ${j.neck[1] - 16} Q${j.hip[0]} ${j.hip[1] - 26} ${j.foot[0] - 8} ${j.foot[1] - 14} V${j.foot[1] + 6} H${j.neck[0] + 12} Z`} className="ps-blanket" />}
      {look.kit.blanket && !lying && <path d={`M${j.neck[0] - 12} ${j.neck[1] + 10} H${j.knee[0] + 10} V${j.knee[1] + 8} H${j.hip[0] - 14} Z`} className="ps-blanket" />}
      {look.kit.lucas && lying && (
        <g className="ps-lucas">
          <path d={`M${j.chest[0] - 30} ${j.chest[1] + 22} V${j.chest[1] - 40} Q${j.chest[0] - 30} ${j.chest[1] - 54} ${j.chest[0] - 16} ${j.chest[1] - 54} H${j.chest[0] + 26} Q${j.chest[0] + 40} ${j.chest[1] - 54} ${j.chest[0] + 40} ${j.chest[1] - 40} V${j.chest[1] + 22}`} />
          <rect x={j.chest[0] - 2} y={j.chest[1] - 54} width={14} height={30} rx={2} className="ps-plunger cpr" />
        </g>
      )}
    </g>
  );
}

/** A crew member kneeling (by a lying patient) or standing (by a seated one),
 *  in green with a hi-vis over it, boots, and a response bag at their side. */
function Crew({ x, y, facing, label, lead, kneel, hands, bag }: { x: number; y: number; facing: 1 | -1; label: string; lead?: boolean; kneel: boolean; hands?: Pt; bag?: boolean }) {
  const f = facing;
  const headY = kneel ? y - 72 : y - 102;
  const hipY = kneel ? y - 26 : y - 48;
  const shoulder: Pt = [x, kneel ? y - 58 : y - 88];
  const hip: Pt = [x, hipY];
  const handTo: Pt = hands ?? [x + f * 24, kneel ? y - 30 : y - 44];
  const elbow: Pt = [x + f * 10, (shoulder[1] + handTo[1]) / 2 + 4];
  const backKnee: Pt = [x - f * 14, y - 5];
  const backFoot: Pt = [x - f * 40, y - 3];
  const frontKnee: Pt = [x + f * 14, y - 5];
  return (
    <g className={`ps-crew${lead ? " lead" : ""}`}>
      {bag && <rect x={x - f * 54 - 14} y={y - 20} width={28} height={18} rx={3} className="ps-kitbag" />}
      {bag && <path d={`M${x - f * 54 - 6} ${y - 20} v-5 h12 v5`} className="ps-kitbag-handle" />}
      {kneel ? (
        <>
          <Limb a={hip} b={backKnee} w1={13} w2={11} fill={CREW_TROUSERS} />
          <Limb a={backKnee} b={backFoot} w1={11} w2={9} fill={CREW_TROUSERS} />
          <Shoe at={[backFoot[0], backFoot[1] + 1]} facing={f} colour={BOOTS} boot />
          <Limb a={hip} b={frontKnee} w1={13} w2={11} fill={CREW_TROUSERS} />
          <Limb a={frontKnee} b={[x + f * 10, y - 3]} w1={11} w2={9} fill={CREW_TROUSERS} />
        </>
      ) : (
        <>
          <Limb a={hip} b={[x - 5, y - 4]} w1={13} w2={10} fill={CREW_TROUSERS} />
          <Shoe at={[x - 5, y]} facing={f} colour={BOOTS} boot />
          <Limb a={hip} b={[x + 7, y - 4]} w1={13} w2={10} fill={CREW_TROUSERS} />
          <Shoe at={[x + 7, y]} facing={f} colour={BOOTS} boot />
        </>
      )}
      <Limb a={shoulder} b={hip} w1={24} w2={20} fill={CREW_GREEN} dark={CREW_GREEN_DARK} />
      {/* Hi-vis: a yellow panel over the chest with two silver bands. */}
      <Limb a={lerp(shoulder, hip, 0.12)} b={lerp(shoulder, hip, 0.78)} w1={22} w2={20} fill={HI_VIS} />
      <Limb a={lerp(shoulder, hip, 0.3)} b={lerp(shoulder, hip, 0.42)} w1={22} w2={21} fill={SILVER} />
      <Limb a={lerp(shoulder, hip, 0.55)} b={lerp(shoulder, hip, 0.67)} w1={21} w2={20} fill={SILVER} />
      {/* Epaulette and radio */}
      <rect x={x - 8} y={shoulder[1] - 6} width={16} height={4} rx={1} fill={CREW_GREEN_DARK} />
      <rect x={x + f * 4} y={shoulder[1] + 2} width={5} height={9} rx={1} fill={INK} />
      <g className={hands ? "ps-arms cpr" : "ps-arms"}>
        <Limb a={shoulder} b={elbow} w1={10} w2={8} fill={CREW_GREEN} dark={CREW_GREEN_DARK} />
        <Limb a={elbow} b={handTo} w1={8} w2={6} fill={CREW_SKIN} />
        <circle cx={handTo[0]} cy={handTo[1]} r={4} fill={CREW_SKIN} stroke={INK} strokeWidth="0.8" />
      </g>
      <Head at={[x, headY]} r={12} skin={CREW_SKIN} hair={CREW_HAIR} facing={f === 1 ? "right" : "left"} />
      <ellipse cx={x + f * 5} cy={headY - 2} rx={1.5} ry={1.4} className="ps-eye" />
      <text x={x} y={headY - 18} textAnchor="middle" className="ps-tag">{label}</text>
    </g>
  );
}

function Monitor({ x, y }: { x: number; y: number }) {
  return (
    <g className="ps-monitor">
      <rect x={x} y={y} width={44} height={30} rx={2} />
      <path d={`M${x + 4} ${y + 18} h8 l3 -8 l4 14 l3 -10 l3 4 h15`} className="ps-mon-trace" />
      <rect x={x + 6} y={y - 6} width={32} height={6} rx={1} className="ps-mon-handle" />
    </g>
  );
}

export function PatientScene({ look, crew, setting, caption }: PatientSceneProps) {
  const j = joints(look.posture);
  const lying = j.facing === "up";
  type Slot = { x: number; y: number; facing: 1 | -1; kneel: boolean; hands?: Pt; bag?: boolean };
  // Crew placement: the lead at the head, the next at the chest or feet,
  // a third behind. In arrest whoever is on the chest kneels over it.
  const floorY = setting === "stairs" && !lying ? GROUND : GROUND;
  const slots: Slot[] = lying
    ? [{ x: 52, y: floorY, facing: 1, kneel: true, bag: true }, { x: 300, y: floorY, facing: -1, kneel: true }, { x: 420, y: floorY, facing: -1, kneel: false }]
    : look.posture === "at_height"
      ? [{ x: 230, y: 170, facing: 1, kneel: true, bag: true }, { x: 420, y: 170, facing: -1, kneel: false }, { x: 60, y: GROUND, facing: 1, kneel: false }]
      : look.posture === "in_water"
        ? [{ x: 60, y: 166, facing: 1, kneel: true }, { x: 420, y: 166, facing: -1, kneel: true }, { x: 120, y: 166, facing: 1, kneel: false }]
        : [{ x: look.posture === "in_vehicle" ? 120 : 160, y: GROUND, facing: 1, kneel: look.posture === "sitting", bag: true }, { x: 360, y: GROUND, facing: -1, kneel: false }, { x: 60, y: GROUND, facing: 1, kneel: false }];
  const compressorIx = look.compressor && !look.kit.lucas ? crew.findIndex((c) => c.callsign === look.compressor || (look.compressor ?? "").startsWith(c.callsign)) : -1;
  const compressorSlot: Slot = { x: j.chest[0] + 34, y: GROUND, facing: -1, kneel: true, hands: [j.chest[0] + 2, j.chest[1] - 2] };
  const placed: { c: SceneCrew; s: Slot }[] = crew.slice(0, 3).map((c, i) => {
    const isComp = look.compressor && !look.kit.lucas && (compressorIx === i || (compressorIx === -1 && i === (crew.length > 1 ? 1 : 0)));
    const s: Slot = isComp ? compressorSlot : slots[i];
    return { c, s };
  });
  const monitorAt: Pt = lying ? [16, GROUND - 30] : look.posture === "in_water" ? [16, 136] : look.posture === "at_height" ? [268, 140] : [j.chest[0] - 150, GROUND - 30];
  return (
    <div className={`ps-scene ps-set-${setting} ${look.arrest ? "arrest" : ""}`}>
      <svg viewBox="0 0 480 260" preserveAspectRatio="xMidYMid meet" aria-label="Patient scene">
        <Setting setting={setting} bleeding={look.bleeding} j={j} />
        {(look.kit.leads || look.kit.pads) && <Monitor x={monitorAt[0]} y={monitorAt[1]} />}
        {placed.filter(({ s }) => !lying || s.x < j.head[0] || s === compressorSlot).map(({ c, s }, i) => <Crew key={c.callsign + i} x={s.x} y={s.y} facing={s.facing} label={c.callsign} lead={c.lead} kneel={s.kneel} hands={s.hands} bag={s.bag} />)}
        <Patient look={look} j={j} />
        {placed.filter(({ s }) => lying && s.x >= j.head[0] && s !== compressorSlot).map(({ c, s }, i) => <Crew key={c.callsign + "b" + i} x={s.x} y={s.y} facing={s.facing} label={c.callsign} lead={c.lead} kneel={s.kneel} bag={s.bag} />)}
        {crew.length === 0 && <text x="240" y="40" textAnchor="middle" className="ps-empty">NO CREW WITH THE PATIENT</text>}
      </svg>
      <div className="ps-caption">
        {caption && <b>{caption}</b>}
        <span>{look.words.join(" · ")}</span>
      </div>
    </div>
  );
}
