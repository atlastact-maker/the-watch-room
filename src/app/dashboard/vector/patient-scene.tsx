"use client";

// THE PATIENT SCENE. A side view of the person being treated: where they
// are (the floor, the stairs, the car seat, the water), how they lie,
// the colour of their skin, how hard they breathe, what the crew have put
// on them, and the crew themselves around them. The counterpart of the
// fireground plan — everything on it is read off the record, so fitting
// a cannula or a mask changes the picture, and a patient going off looks
// like one.

import type { PatientLook, Posture } from "@/lib/sim/patient_look";

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
  /** Setting words for the caption, e.g. "sat on the stairs". */
  caption?: string;
};

const SKIN: Record<PatientLook["skin"], string> = {
  normal: "#e9b58f",
  pale: "#f2ddcc",
  grey: "#b3b9be",
  cyanosed: "#98acc3",
  flushed: "#e58b7a",
};
const CLOTHES = "#3c4d5e";
const CLOTHES_DARK = "#2b3947";
const CREW_GREEN = "#1f8a4c";
const HI_VIS = "#f3e04a";
const CREW_SKIN = "#d9a983";
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

function Setting({ posture, bleeding }: { posture: Posture; bleeding: boolean }) {
  return (
    <g className="ps-setting">
      {posture === "supine" && (
        <>
          <line x1="20" y1={GROUND + 6} x2="460" y2={GROUND + 6} className="ps-ground" />
          {bleeding && <ellipse cx="150" cy={GROUND + 3} rx="52" ry="7" className="ps-blood" />}
        </>
      )}
      {posture === "sitting" && (
        <>
          {/* A short flight of stairs, the patient on the third tread. */}
          <path d="M20 206 H120 V182 H160 V158 H200 V172 H300 V206 H460" className="ps-ground" />
          <path d="M120 206 V182 H160 V158 H200 V172 H300 V206 Z" className="ps-step" />
          {bleeding && <ellipse cx="270" cy={GROUND + 3} rx="40" ry="6" className="ps-blood" />}
        </>
      )}
      {posture === "in_vehicle" && (
        <>
          <line x1="20" y1={GROUND + 6} x2="460" y2={GROUND + 6} className="ps-ground" />
          {/* The car in section: sill, seat, A-pillar and screen. */}
          <path d="M150 206 V160 Q150 150 160 150 H330 Q350 150 356 170 L368 206" className="ps-car" />
          <path d="M160 150 L190 86 Q196 76 208 76 H300 Q314 76 320 88 L336 150" className="ps-car" />
          <path d="M224 172 H252 Q262 172 262 162 V118 Q262 110 254 110 H228" className="ps-seat" />
          <circle cx="190" cy={GROUND - 4} r="18" className="ps-wheel" />
          <circle cx="400" cy={GROUND - 4} r="18" className="ps-wheel" />
          {bleeding && <ellipse cx="280" cy="184" rx="26" ry="5" className="ps-blood" />}
        </>
      )}
      {posture === "in_water" && (
        <>
          <path d="M20 166 Q50 156 80 166 T140 166 T200 166 T260 166 T320 166 T380 166 T440 166 T500 166 V260 H20 Z" className="ps-water" />
          <path d="M20 166 Q50 156 80 166 T140 166 T200 166 T260 166 T320 166 T380 166 T440 166 T500 166" className="ps-wave" />
        </>
      )}
      {posture === "at_height" && (
        <>
          <path d="M20 206 H120 V40" className="ps-ground" />
          <path d="M260 170 H460 V206" className="ps-ground" />
          <path d="M260 170 V260" className="ps-drop" />
          <rect x="260" y="170" width="200" height="90" className="ps-step" />
        </>
      )}
    </g>
  );
}

function Limb({ a, b, w, colour, className }: { a: Pt; b: Pt; w: number; colour: string; className?: string }) {
  return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={colour} strokeWidth={w} strokeLinecap="round" className={className} />;
}

function Patient({ look, j }: { look: PatientLook; j: Joints }) {
  const skin = SKIN[look.skin];
  const breath = look.breathing === "none" ? 0 : 60 / Math.max(6, look.rr);
  const lying = j.facing === "up";
  const torsoStyle = breath ? ({ "--ps-breath": `${breath.toFixed(2)}s` } as React.CSSProperties) : undefined;
  const torsoClass = `ps-torso${breath ? (lying ? " breathe-up" : " breathe-fwd") : ""}${look.compressor ? " cpr" : ""}${look.breathing === "laboured" ? " laboured" : ""}`;
  return (
    <g className={`ps-patient${look.seizing ? " seizing" : ""}`}>
      {/* Board or stretcher under them. */}
      {look.kit.board && lying && <rect x={70} y={j.hip[1] + 4} width={320} height={9} rx={2} className="ps-board" />}
      {/* Legs */}
      <Limb a={j.hip} b={j.knee} w={13} colour={CLOTHES_DARK} />
      <Limb a={j.knee} b={j.foot} w={11} colour={CLOTHES_DARK} />
      {j.knee2 && j.foot2 && (<><Limb a={j.hip} b={j.knee2} w={13} colour={CLOTHES} /><Limb a={j.knee2} b={j.foot2} w={11} colour={CLOTHES} /></>)}
      {look.kit.splint && <Limb a={lerp(j.hip, j.knee, 0.1)} b={lerp(j.knee, j.foot, 0.9)} w={3} colour={KIT} />}
      {look.kit.tourniquet && <Limb a={lerp(j.hip, j.knee, 0.35)} b={lerp(j.hip, j.knee, 0.5)} w={16} colour="#e8572a" />}
      {/* Torso, breathing */}
      <g className={torsoClass} style={torsoStyle}>
        <Limb a={j.neck} b={j.hip} w={lying ? 24 : 22} colour={CLOTHES} />
        {look.kit.pelvicBinder && <Limb a={lerp(j.neck, j.hip, 0.88)} b={j.hip} w={26} colour={KIT} />}
        {look.kit.dressing && <circle cx={j.chest[0] + (lying ? 30 : 4)} cy={j.chest[1] + (lying ? 8 : 28)} r={7} className="ps-dressing" />}
        {/* Pads: one upper right, one lower left. */}
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
        {/* ECG electrodes and leads to the monitor. */}
        {look.kit.leads && (
          <g className="ps-leads">
            {[[-14, -4], [12, -4], [0, 14]].map(([dx, dy], i) => (
              <g key={i}>
                <circle cx={j.chest[0] + (lying ? dx : dy * 0.5)} cy={j.chest[1] + (lying ? dy * 0.5 : dx)} r={2.6} className="ps-electrode" />
              </g>
            ))}
            <path d={`M${j.chest[0]} ${j.chest[1]} Q${j.chest[0] - 40} ${j.chest[1] + 10} ${lying ? 60 : j.chest[0] - 110} ${GROUND - 18}`} className="ps-wire" />
          </g>
        )}
        {/* Hurt regions on the trunk */}
        {look.hurt.includes("chest") && <circle cx={j.chest[0]} cy={j.chest[1] + (lying ? 0 : 4)} r={11} className="ps-hurt" />}
        {look.hurt.includes("abdomen") && <circle cx={lerp(j.neck, j.hip, 0.65)[0]} cy={lerp(j.neck, j.hip, 0.65)[1] - (lying ? 10 : 0)} r={10} className="ps-hurt" />}
        {look.hurt.includes("pelvis") && <circle cx={j.hip[0]} cy={j.hip[1] - (lying ? 10 : 0)} r={10} className="ps-hurt" />}
      </g>
      {/* Arm (nearest) */}
      <Limb a={lerp(j.neck, j.hip, 0.08)} b={j.elbow} w={10} colour={CLOTHES} />
      <Limb a={j.elbow} b={j.hand} w={9} colour={skin} />
      {j.elbow2 && j.hand2 && (<><Limb a={lerp(j.neck, j.hip, 0.08)} b={j.elbow2} w={10} colour={CLOTHES} /><Limb a={j.elbow2} b={j.hand2} w={9} colour={skin} /></>)}
      {(look.hurt.includes("left_arm") || look.hurt.includes("right_arm")) && <circle cx={j.elbow[0]} cy={j.elbow[1]} r={9} className="ps-hurt" />}
      {(look.hurt.includes("left_leg") || look.hurt.includes("right_leg")) && <circle cx={j.knee[0]} cy={j.knee[1]} r={9} className="ps-hurt" />}
      {look.kit.cuff && <Limb a={lerp(j.upperArm, j.elbow, -0.1)} b={lerp(j.upperArm, j.elbow, 0.35)} w={14} colour={KIT} />}
      {look.kit.iv && (
        <g>
          <Limb a={lerp(j.elbow, j.hand, 0.55)} b={lerp(j.elbow, j.hand, 0.8)} w={4} colour="#f4f7f9" />
          <path d={`M${pt(lerp(j.elbow, j.hand, 0.65))} Q${j.hand[0] + 30} ${j.hand[1] - 50} ${j.hand[0] + 56} ${Math.max(40, j.hand[1] - 90)}`} className="ps-line" />
          <rect x={j.hand[0] + 50} y={Math.max(40, j.hand[1] - 90) - 24} width={12} height={24} rx={2} className="ps-bag" />
        </g>
      )}
      {look.kit.probe && <circle cx={j.hand[0] + (lying ? 6 : 2)} cy={j.hand[1] + (lying ? 0 : 6)} r={3.5} className="ps-probe" />}
      {/* Head */}
      {look.kit.collar && <circle cx={j.neckRing[0]} cy={j.neckRing[1]} r={11} className="ps-collar" />}
      <circle cx={j.head[0]} cy={j.head[1]} r={j.r} fill={skin} stroke={CLOTHES_DARK} strokeWidth="1" />
      {look.hurt.includes("head") && <circle cx={j.head[0]} cy={j.head[1]} r={j.r + 4} className="ps-hurt" />}
      {/* Eyes */}
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
      {/* Sweat */}
      {look.sweating && (
        <g className="ps-sweat">
          <path d={`M${j.head[0] - 10} ${j.head[1] - 12} q-2 4 0 6 q2 -2 0 -6z`} />
          <path d={`M${j.head[0] + 12} ${j.head[1] - 6} q-2 4 0 6 q2 -2 0 -6z`} />
        </g>
      )}
      {/* Airway: mask, cannula, bag, tube */}
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
          <ellipse cx={lying ? j.head[0] - 24 : j.head[0] + 28} cy={lying ? j.head[1] - 20 : j.head[1] + 6} rx={lying ? 13 : 14} ry={lying ? 8 : 8} className="ps-bag-bvm" />
          <path d={lying ? `M${j.head[0] - 10} ${j.head[1] - 4} q-4 -10 -2 -14` : `M${j.head[0] + 14} ${j.head[1] + 2} h8`} className="ps-tube" />
        </g>
      )}
      {look.kit.airway === "igel" && <path d={lying ? `M${j.head[0]} ${j.head[1] + 2} v-14 h6` : `M${j.head[0] + 10} ${j.head[1] + 4} h12 v-8`} className="ps-igel" />}
      {look.kit.airway === "tube" && <path d={lying ? `M${j.head[0]} ${j.head[1] + 4} v-24 q0 -8 8 -8 h14` : `M${j.head[0] + 10} ${j.head[1] + 4} h20 q8 0 8 -8 v-14`} className="ps-ett" />}
      {look.kit.capno && look.kit.airway !== "none" && <rect x={lying ? j.head[0] + 16 : j.head[0] + 32} y={lying ? j.head[1] - 34 : j.head[1] - 30} width={10} height={7} rx={1} className="ps-capno" />}
      {/* Blanket over the trunk and legs */}
      {look.kit.blanket && lying && <path d={`M${j.neck[0] + 12} ${j.neck[1] - 16} Q${j.hip[0]} ${j.hip[1] - 26} ${j.foot[0] - 8} ${j.foot[1] - 14} V${j.foot[1] + 6} H${j.neck[0] + 12} Z`} className="ps-blanket" />}
      {look.kit.blanket && !lying && <path d={`M${j.neck[0] - 12} ${j.neck[1] + 10} H${j.knee[0] + 10} V${j.knee[1] + 8} H${j.hip[0] - 14} Z`} className="ps-blanket" />}
      {/* LUCAS over the chest */}
      {look.kit.lucas && lying && (
        <g className="ps-lucas">
          <path d={`M${j.chest[0] - 30} ${j.chest[1] + 22} V${j.chest[1] - 40} Q${j.chest[0] - 30} ${j.chest[1] - 54} ${j.chest[0] - 16} ${j.chest[1] - 54} H${j.chest[0] + 26} Q${j.chest[0] + 40} ${j.chest[1] - 54} ${j.chest[0] + 40} ${j.chest[1] - 40} V${j.chest[1] + 22}`} />
          <rect x={j.chest[0] - 2} y={j.chest[1] - 54} width={14} height={30} rx={2} className="ps-plunger cpr" />
        </g>
      )}
    </g>
  );
}

/** A crew member kneeling (by a lying patient) or standing (by a seated one). */
function Crew({ x, y, facing, label, lead, kneel, hands }: { x: number; y: number; facing: 1 | -1; label: string; lead?: boolean; kneel: boolean; hands?: Pt }) {
  const f = facing;
  const headY = kneel ? y - 72 : y - 102;
  const hipY = kneel ? y - 26 : y - 48;
  const shoulder: Pt = [x, kneel ? y - 58 : y - 88];
  const hip: Pt = [x, hipY];
  const handTo: Pt = hands ?? [x + f * 24, kneel ? y - 30 : y - 44];
  const elbow: Pt = [x + f * 10, (shoulder[1] + handTo[1]) / 2 + 4];
  return (
    <g className={`ps-crew${lead ? " lead" : ""}`}>
      {kneel ? (
        <>
          <Limb a={hip} b={[x - f * 14, y - 5]} w={12} colour={CLOTHES_DARK} />
          <Limb a={[x - f * 14, y - 5]} b={[x - f * 40, y - 3]} w={10} colour={CLOTHES_DARK} />
          <Limb a={hip} b={[x + f * 14, y - 5]} w={12} colour={CLOTHES_DARK} />
        </>
      ) : (
        <>
          <Limb a={hip} b={[x - 5, y - 4]} w={12} colour={CLOTHES_DARK} />
          <Limb a={hip} b={[x + 7, y - 4]} w={12} colour={CLOTHES_DARK} />
        </>
      )}
      <Limb a={shoulder} b={hip} w={20} colour={CREW_GREEN} />
      <Limb a={lerp(shoulder, hip, 0.35)} b={lerp(shoulder, hip, 0.5)} w={20} colour={HI_VIS} />
      <g className={hands ? "ps-arms cpr" : "ps-arms"}>
        <Limb a={shoulder} b={elbow} w={9} colour={CREW_GREEN} />
        <Limb a={elbow} b={handTo} w={8} colour={CREW_SKIN} />
      </g>
      <circle cx={x} cy={headY} r={12} fill={CREW_SKIN} stroke={CLOTHES_DARK} strokeWidth="1" />
      <text x={x} y={headY - 17} textAnchor="middle" className="ps-tag">{label}</text>
    </g>
  );
}

function Monitor({ x, y }: { x: number; y: number }) {
  return (
    <g className="ps-monitor">
      <rect x={x} y={y} width={44} height={30} rx={2} />
      <path d={`M${x + 4} ${y + 18} h8 l3 -8 l4 14 l3 -10 l3 4 h15`} className="ps-mon-trace" />
    </g>
  );
}

export function PatientScene({ look, crew, caption }: PatientSceneProps) {
  const j = joints(look.posture);
  const lying = j.facing === "up";
  // Crew placement: the lead at the head, the next at the chest or feet,
  // a third behind. In arrest whoever is on the chest kneels over it.
  const slots: { x: number; y: number; facing: 1 | -1; kneel: boolean }[] = lying
    ? [{ x: 52, y: GROUND, facing: 1, kneel: true }, { x: 300, y: GROUND, facing: -1, kneel: true }, { x: 420, y: GROUND, facing: -1, kneel: false }]
    : look.posture === "at_height"
      ? [{ x: 230, y: 170, facing: 1, kneel: true }, { x: 420, y: 170, facing: -1, kneel: false }, { x: 60, y: GROUND, facing: 1, kneel: false }]
      : look.posture === "in_water"
        ? [{ x: 60, y: 166, facing: 1, kneel: true }, { x: 420, y: 166, facing: -1, kneel: true }, { x: 120, y: 166, facing: 1, kneel: false }]
        : [{ x: look.posture === "in_vehicle" ? 120 : 160, y: GROUND, facing: 1, kneel: look.posture === "sitting" }, { x: 360, y: GROUND, facing: -1, kneel: false }, { x: 60, y: GROUND, facing: 1, kneel: false }];
  const compressorIx = look.compressor && !look.kit.lucas ? crew.findIndex((c) => c.callsign === look.compressor || (look.compressor ?? "").startsWith(c.callsign)) : -1;
  type Slot = { x: number; y: number; facing: 1 | -1; kneel: boolean; hands?: Pt };
  const compressorSlot: Slot = { x: j.chest[0] + 34, y: GROUND, facing: -1, kneel: true, hands: [j.chest[0] + 2, j.chest[1] - 2] };
  const placed: { c: SceneCrew; s: Slot }[] = crew.slice(0, 3).map((c, i) => {
    const isComp = look.compressor && !look.kit.lucas && (compressorIx === i || (compressorIx === -1 && i === (crew.length > 1 ? 1 : 0)));
    const s: Slot = isComp ? compressorSlot : slots[i];
    return { c, s };
  });
  const monitorAt: Pt = lying ? [16, GROUND - 30] : look.posture === "in_water" ? [16, 136] : look.posture === "at_height" ? [268, 140] : [j.chest[0] - 150, GROUND - 30];
  return (
    <div className={`ps-scene ${look.arrest ? "arrest" : ""}`}>
      <svg viewBox="0 0 480 260" preserveAspectRatio="xMidYMid meet" aria-label="Patient scene">
        <Setting posture={look.posture} bleeding={look.bleeding} />
        {(look.kit.leads || look.kit.pads) && <Monitor x={monitorAt[0]} y={monitorAt[1]} />}
        {placed.filter(({ s }) => !lying || s.x < j.head[0] || s === compressorSlot).map(({ c, s }, i) => <Crew key={c.callsign + i} x={s.x} y={s.y} facing={s.facing} label={c.callsign} lead={c.lead} kneel={s.kneel} hands={s.hands} />)}
        <Patient look={look} j={j} />
        {placed.filter(({ s }) => lying && s.x >= j.head[0] && s !== compressorSlot).map(({ c, s }, i) => <Crew key={c.callsign + "b" + i} x={s.x} y={s.y} facing={s.facing} label={c.callsign} lead={c.lead} kneel={s.kneel} />)}
        {crew.length === 0 && <text x="240" y="40" textAnchor="middle" className="ps-empty">NO CREW WITH THE PATIENT</text>}
      </svg>
      <div className="ps-caption">
        {caption && <b>{caption}</b>}
        <span>{look.words.join(" · ")}</span>
      </div>
    </div>
  );
}
