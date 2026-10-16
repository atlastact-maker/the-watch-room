"use client";

// THE PATIENT, FROM ABOVE. The view a crew has kneeling over someone:
// the patient large in the frame, face up, with what has been put on
// them where it really goes; the ground they are on — hall floor,
// kitchen tiles, the pitch, the pavement, a hospital bed, the trolley in
// the back of the ambulance, the driver's seat — changing with the job;
// the crew kneeling in from the sides with their hands on the work; the
// monitor, the bag and the oxygen on the ground where they were dropped.
// Night darkens it to a torch pool; rain wets it. Overlaid, the numbers
// the monitor is reading and the time.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { PatientLook, Skin } from "@/lib/sim/patient_look";
import type { SceneSetting } from "@/lib/sim/scene_setting";
import {
  rig, PlanFigure, FigureDefs, anchors, mix, add, mul, unit, type Rig, type Wear, type Pt, type Pose, type TopKind, type BottomKind, type ShoeKind,
} from "./scene/plan-figure";
import { kitLayers, KitDefs, Monitor, MONITOR_W, KitBag, O2Cylinder, DripBag } from "./scene/plan-kit";
import { CrewTop, crewWearOf, crewHeadAt, type CrewWear } from "./scene/plan-crew";
import { Acts, actSite } from "./scene/plan-acts";
import { GROUNDS, GroundDefs, GroundClips, Weather, WeatherDefs, type Ambient, type GroundCtx } from "./scene/plan-ground";

export type SceneCrew = {
  callsign: string;
  /** "Paramedic", "Technician", "Doctor" … for the label. */
  role: string;
  lead?: boolean;
  service?: "Fire" | "Ambulance" | "Police";
  /** Clinician scope: dca, ap, ccc, basics, hems. */
  scope?: string;
  /** The person's name, when the second of a crew needs telling from the first. */
  name?: string;
};

export type SceneVitals = { hr?: number; bpSys?: number; bpDia?: number; rr?: number; spo2?: number };

export type PatientSceneProps = {
  look: PatientLook;
  crew: SceneCrew[];
  setting: SceneSetting;
  /** Words for the caption: where they are. */
  caption?: string;
  /** Hour of the day, fractional, for the light. */
  hour?: number;
  rain?: boolean;
  ctx?: { type: string; title: string };
  /** The casualty's label, for the odd word it carries ("sofa", "in bed"). */
  label?: string;
  /** What the monitor is reading, for the overlay card. */
  vitals?: SceneVitals;
  /** "stage": the scene fills its box and carries no vitals card or clock — the board around it does. */
  chrome?: "full" | "stage";
};

/** The numbers the monitor is reading, as a small card. Only what is attached shows. */
export function VitalsCard({ look, vitals, className = "ps-ovl ps-vitals" }: { look: PatientLook; vitals: SceneVitals; className?: string }) {
  return (
    <div className={className}>
      {(look.kit.leads || look.kit.pads || look.kit.probe) && vitals.hr !== undefined && <div><b>{look.arrest ? "--" : Math.round(vitals.hr)}</b><span>HR</span></div>}
      {look.kit.probe && vitals.spo2 !== undefined && <div className="spo2"><b>{look.arrest ? "--" : Math.round(vitals.spo2)}</b><span>SpO₂</span></div>}
      {look.kit.cuff && vitals.bpSys !== undefined && <div className="bp"><b>{look.arrest ? "--/--" : `${Math.round(vitals.bpSys)}/${vitals.bpDia !== undefined ? Math.round(vitals.bpDia) : "--"}`}</b><span>BP</span></div>}
      {vitals.rr !== undefined && <div className="rr"><b>{look.arrest ? "0" : Math.round(vitals.rr)}</b><span>RR</span></div>}
    </div>
  );
}

const H = 320;

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function skinColour(base: string, state: Skin): string {
  switch (state) {
    case "pale": return mix(base, "#f3efe8", 0.35);
    case "grey": return mix(mix(base, "#9aa0a6", 0.5), "#c9c3c8", 0.2);
    case "cyanosed": return mix(base, "#7a8fb5", 0.35);
    case "flushed": return mix(base, "#e0564d", 0.2);
    default: return base;
  }
}

/** What the patient has on: the setting dresses them, the seed picks within it. */
export function wearOf(look: PatientLook, setting: SceneSetting, seed: number, wet: boolean): Wear {
  const a = look.appearance;
  const pick = <T,>(xs: T[], n: number) => xs[(seed >>> n) % xs.length];
  const skin = skinColour(a.skinBase, look.skin);
  let topKind: TopKind = a.child ? pick(["tee", "hoodie", "tee"] as TopKind[], 3) : a.elderly ? pick(["jumper", "shirt", "fleece"] as TopKind[], 3) : pick(["tee", "shirt", "jumper", "hoodie", "fleece", "tee"] as TopKind[], 3);
  let bottomKind: BottomKind = a.child ? pick(["joggers", "jeans"] as BottomKind[], 5) : pick(["jeans", "trousers", "joggers", "jeans"] as BottomKind[], 5);
  let shoes: ShoeKind = a.child ? "trainers" : a.elderly ? pick(["shoes", "slippers", "shoes"] as ShoeKind[], 7) : pick(["trainers", "shoes", "trainers"] as ShoeKind[], 7);
  let top = a.topColour, bottom = a.bottomColour;
  let hiVis: string | null = null;
  let number: string | undefined;
  if (setting === "pitch") { topKind = "football"; top = pick(["#c0392b", "#2f6fd6", "#f4f4f0", "#f3d35a"], 9); bottomKind = "shorts"; bottom = top === "#f4f4f0" ? "#1b2733" : "#f4f4f0"; shoes = "football"; number = String(2 + ((seed >>> 4) % 10)); }
  else if (setting === "site" || setting === "factory" || setting === "yard") { topKind = "workwear"; top = "#2f4f6f"; hiVis = "#f2b63c"; bottomKind = "trousers"; bottom = "#3b4a5a"; shoes = "boots"; }
  else if (setting === "ward") { topKind = "gown"; top = "#9fc4dd"; bottomKind = "bare"; shoes = "socks"; }
  else if (setting === "bedroom") { topKind = "pyjamas"; top = pick(["#8fa8c8", "#c9a0a0", "#9fc4dd"], 9); bottomKind = "pyjamas"; bottom = top; shoes = pick(["bare", "slippers"] as ShoeKind[], 11); }
  else if (setting === "bathroom") { topKind = "tee"; bottomKind = "pyjamas"; shoes = "bare"; }
  else if (setting === "changing_room") { topKind = "football"; top = pick(["#c0392b", "#2f6fd6"], 9); bottomKind = "shorts"; bottom = "#f4f4f0"; shoes = "socks"; number = String(2 + ((seed >>> 4) % 10)); }
  const sleeves: Wear["sleeves"] = topKind === "tee" || topKind === "football" || topKind === "gown" ? "short" : "long";
  const shoeColour = shoes === "trainers" ? pick(["#e9ecef", "#1b1b1b", "#e9ecef"], 13) : shoes === "boots" ? "#5a3d26" : shoes === "slippers" ? "#8a6a5a" : shoes === "football" ? "#1b1b1b" : "#2b2b2b";
  return {
    skin,
    lips: look.arrest || look.skin === "cyanosed" ? "blue" : look.skin === "pale" || look.skin === "grey" ? "pale" : "normal",
    hair: a.hairColour, hairStyle: a.hair,
    top, topKind, sleeves, hiVis, bottom, bottomKind, shoes, shoeColour,
    eyes: look.eyes, mouth: look.breathing === "laboured" || look.arrest || look.breathing === "fast" ? "open" : "closed",
    beard: a.sex === "male" && !a.child && a.ageYears >= 22 && (seed >>> 15) % 3 === 0,
    glasses: (a.elderly && (seed >>> 17) % 2 === 0) || (!a.child && (seed >>> 17) % 9 === 0),
    number, wet, flushed: look.skin === "flushed", elderly: a.elderly, child: a.child, sweating: look.sweating,
    // Pads and electrodes go on skin. Pads mean shears: the top cut up the
    // front and laid open. Leads alone: a shirt unbuttoned and laid open, a
    // tee or jumper pushed up to the armpits.
    exposed: look.kit.pads ? "cut" : look.kit.leads || look.kit.ecg12 ? (topKind === "shirt" || topKind === "pyjamas" || topKind === "fleece" || topKind === "workwear" || topKind === "gown" ? "open" : "lifted") : undefined,
  };
}

type Slot = { at: Pt; facing: Pt; hands: { left?: Pt; right?: Pt }; kneeling: boolean; armsClass?: string; handClass?: { left?: string; right?: string }; grip?: "cpr"; wear?: Partial<CrewWear> };

/** Where the hi-vis jacket goes on: roads, platforms, sites, the water's edge, anywhere outdoors after dark. */
const JACKET_SETTINGS = new Set<SceneSetting>(["road_urban", "motorway", "car", "lorry", "pavement", "platform", "site", "yard", "moor", "height", "water", "lakeside", "ambulance_motorway", "ambulance_street", "ambulance_river", "ambulance_field"]);

/** The role slide's word, from what the crew list calls the person. */
function roleWord(c: SceneCrew | undefined): string {
  if (!c) return "";
  const r = c.role.toLowerCase();
  if (c.service === "Fire") return "";
  if (c.service === "Police") return /sergeant/.test(r) ? "PS" : "PC";
  if (/hems/.test(r)) return /\bdr\b/i.test(c.name ?? "") ? "DOCTOR" : "PARAMEDIC";
  if (/basics|doctor/.test(r)) return "DOCTOR";
  if (/critical care/.test(r)) return "CRITICAL CARE";
  if (/advanced/.test(r)) return "ADV PARAMEDIC";
  if (/paramedic/.test(r)) return "PARAMEDIC";
  if (/technician|emt/.test(r)) return "TECHNICIAN";
  if (/eca|care assistant|assistant/.test(r)) return "ECA";
  if (/pilot/.test(r)) return "PILOT";
  return c.role.toUpperCase().slice(0, 12);
}

/** Upper case for a tag, keeping the µ of a microgram dose (whose upper case is a Greek capital). */
const shout = (s: string) => s.toUpperCase().replace(/\u039cG\b/g, "µg");

const hhmm = (hour: number) => `${String(Math.floor(hour) % 24).padStart(2, "0")}:${String(Math.floor((hour % 1) * 60)).padStart(2, "0")}`;

export function PatientScene({ look, crew, setting, caption, hour, rain, ctx, label, vitals, chrome = "full" }: PatientSceneProps) {
  // On the stage the picture fills whatever box it is given, so the view
  // widens with the box rather than cropping the patient's head off.
  const box = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(1.5);
  useEffect(() => {
    if (chrome !== "stage" || !box.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r && r.height > 0) setAspect(r.width / r.height);
    });
    ro.observe(box.current);
    return () => ro.disconnect();
  }, [chrome]);
  const W = chrome === "stage" ? Math.round(Math.max(480, Math.min(1100, H * aspect))) : 480;
  const spec = GROUNDS[setting];
  const amb: Ambient = { night: hour !== undefined && (hour < 7 || hour >= 18.5), rain: !!rain };
  const a = look.appearance;
  const seed = hash(`${a.ageYears}${a.sex}${a.hairColour}${a.topColour}`);
  const conscious = look.eyes !== "closed" && !look.arrest;
  const pose: Pose = look.posture === "in_water" ? "floating"
    : look.posture === "sitting" || look.posture === "at_height" || look.posture === "in_vehicle"
      ? (spec.lying === "reclined" && look.posture === "sitting" ? "reclined" : "seated")
      : spec.lying ?? "lying";
  const r: Rig = rig({ heightM: a.heightM, sex: a.sex, child: a.child, elderly: a.elderly, pregnant: a.pregnant }, {
    pose,
    kneesUp: pose === "lying" && conscious && !look.kit.board && !look.kit.splint && !look.kit.pelvicBinder,
    cue: conscious ? a.cue : "none",
    // A resting head rolls a little to one side, unless someone is holding it or an airway is in.
    headTurn: pose === "lying" && look.kit.oxygen !== "bvm" && !look.kit.collar && !look.kit.board && look.kit.airway === "none" ? (((seed >>> 6) % 3) - 1) * 0.6 : 0,
  });
  const k = r.k;
  const A = anchors(r);
  const wet = look.posture === "in_water" || setting === "water" || setting === "lakeside" || (!!rain && spec.outdoor);
  const wear = wearOf(look, setting, seed, wet);

  // Framing: head to the knees unless the legs matter (or the place says the whole body).
  const legsMatter = look.kit.tourniquet || look.kit.splint || look.hurt.some((h) => /leg/.test(h)) || pose === "floating";
  const framing = spec.framing ?? (legsMatter ? "full" : "upper");
  const sRaw = spec.extent ? (H - 28) / (spec.extent[1] - spec.extent[0]) : framing === "full" ? 254 / (r.bottom + 0.12) : 254 / (Math.max(r.legR.b[1], r.legL.b[1]) + 0.06);
  const s = Math.max(100, Math.min(262, sRaw));
  const ox = W / 2 - (spec.centreX ?? 0) * s + (spec.crew === "car" ? 70 : spec.crew === "ledge" ? 40 : 0);
  const oy = spec.extent ? 14 - spec.extent[0] * s : 56;
  const px = (p: Pt): Pt => [ox + p[0] * s, oy + p[1] * s];

  // Kit on the ground.
  const monitorAt: Pt = spec.monitor ?? [r.chestW + 0.6, r.hipY + 0.5];
  const bagAt: Pt = spec.bag ?? [-(r.chestW + 0.68), r.hipY + 0.62];
  const o2At: Pt = spec.o2 ?? [r.headW + 0.58, -0.04];
  const port: Pt = [monitorAt[0] + (monitorAt[0] < 0 ? MONITOR_W / 2 : -MONITOR_W / 2), monitorAt[1] - 0.04];

  // The crew: where they kneel and what their hands are doing.
  const arrangement = spec.crew ?? "sides";
  const side = r.chestW + 0.3;
  const compressorIx = look.arrest && !look.kit.lucas
    ? Math.max(0, crew.findIndex((c) => !!look.compressor && (c.callsign === look.compressor || look.compressor.startsWith(c.callsign) || (!!c.name && look.compressor.includes(c.name)))))
    : -1;
  const slots: Slot[] = [];
  // The bag-valve-mask: the valve sits on the mask over the nose and mouth
  // (or on the i-gel or tube at the mouth), the bag runs up and away over
  // the patient's right temple to the hand that squeezes it; the other hand
  // holds the mask on, thumb and finger round the connector.
  const valveAt: Pt = look.kit.airway === "none" ? [0, r.headL * 0.7] : [0, A.mouth[1] - 0.012 * k];
  const bvmHand: Pt = add(valveAt, mul(unit([-0.62, -0.78]), (0.075 + (look.kit.capno ? 0.04 : 0) + 0.11) * k));
  const maskHand: Pt = [r.headW * 0.62, r.headL * 0.66];
  // Compressions: the point pressed is the centre of the chest; the crew
  // figure stacks its hands on it.
  const cprHands = { left: [A.sternum[0], A.sternum[1] + 0.01 * k] as Pt, right: [A.sternum[0], A.sternum[1] + 0.01 * k] as Pt };
  // Intubated in the back of the ambulance, the patient goes on the ventilator: no bag to squeeze.
  const onVent = spec.crew === "saloon" && (look.kit.airway === "tube" || look.kit.airway === "igel") && !!spec.vent;
  const needsAirway = look.kit.oxygen === "bvm" && !onVent;
  const holdHead = (look.kit.collar || look.kit.board) && !needsAirway;
  if (arrangement === "sides" || arrangement === "ledge") {
    const compressor: Slot = { at: [-(r.chestW + 0.2), r.chestY + 0.04], facing: [1, 0], kneeling: true, hands: cprHands, armsClass: "ps-arms cpr", grip: "cpr" };
    const airway: Slot = { at: [0, -(r.headL + 0.28)], facing: [0, 1], kneeling: true, hands: { left: maskHand, right: bvmHand }, handClass: { right: "squeeze" } };
    const headHold: Slot = { at: [0, -(r.headL + 0.28)], facing: [0, 1], kneeling: true, hands: { left: [A.earL[0] + 0.03, A.earL[1] - 0.02], right: [A.earR[0] - 0.03, A.earR[1] - 0.02] } };
    const lead: Slot = { at: [side, r.chestY + 0.2], facing: [-1, 0], kneeling: true, hands: { left: [A.leftWrist[0] + 0.01, A.leftWrist[1] + 0.02], right: [A.leftUpperChest[0] + 0.04, A.leftUpperChest[1] - 0.02] } };
    const second: Slot = { at: [-side, r.hipY + 0.15], facing: [1, 0], kneeling: true, hands: { right: [A.rightWrist[0] - 0.01, A.rightWrist[1] + 0.02], left: [A.rightThigh[0] - 0.04, A.rightThigh[1]] } };
    const feet: Slot = { at: [side - 0.05, r.bottom + 0.2], facing: [-0.6, -0.8], kneeling: true, hands: { left: [A.leftKnee[0] + 0.02, A.leftKnee[1] + 0.02], right: [A.rightKnee[0] + 0.06, A.rightKnee[1] + 0.04] } };
    if (arrangement === "ledge") { second.at = [side, r.hipY + 0.55]; second.facing = [-1, 0]; second.hands = { left: [A.leftWrist[0] + 0.01, A.leftWrist[1] + 0.02], right: [A.leftThigh[0] + 0.02, A.leftThigh[1]] }; }
    crew.slice(0, 3).forEach((c, i) => {
      if (look.arrest && !look.kit.lucas && i === (compressorIx === -1 ? 0 : compressorIx)) { slots.push(compressor); return; }
      if (needsAirway && !slots.includes(airway)) { slots.push(airway); return; }
      if (holdHead && !slots.includes(headHold)) { slots.push(headHold); return; }
      if (!slots.includes(lead)) { slots.push(lead); return; }
      if (!slots.includes(second) && arrangement === "sides") { slots.push(second); return; }
      slots.push(feet);
    });
  } else if (arrangement === "bedside") {
    const leftSide: Slot = { at: [-(r.chestW + 0.38), r.chestY + 0.1], facing: [1, 0], kneeling: false, hands: { right: [A.rightWrist[0] - 0.02, A.rightWrist[1]], left: [A.rightUpperChest[0] - 0.06, A.rightUpperChest[1] - 0.02] } };
    const rightSide: Slot = { at: [r.chestW + 0.38, r.chestY + 0.3], facing: [-1, 0], kneeling: false, hands: { left: [A.leftWrist[0] + 0.02, A.leftWrist[1]], right: [A.leftForearm[0] + 0.04, A.leftForearm[1]] } };
    const headEnd: Slot = { at: [0, -(r.headL + 0.26)], facing: [0, 1], kneeling: false, hands: needsAirway ? { left: maskHand, right: bvmHand } : { left: [A.earL[0] + 0.03, A.earL[1] - 0.02], right: [A.earR[0] - 0.03, A.earR[1] - 0.02] }, handClass: needsAirway ? { right: "squeeze" } : undefined };
    const compressor: Slot = { ...leftSide, hands: cprHands, armsClass: "ps-arms cpr", grip: "cpr" };
    crew.slice(0, 3).forEach((c, i) => {
      if (look.arrest && !look.kit.lucas && i === (compressorIx === -1 ? 0 : compressorIx)) { slots.push(compressor); return; }
      if (needsAirway && !slots.includes(headEnd)) { slots.push(headEnd); return; }
      if (!slots.includes(rightSide)) { slots.push(rightSide); return; }
      if (!slots.includes(leftSide) && !slots.includes(compressor)) { slots.push(leftSide); return; }
      slots.push(headEnd);
    });
  } else if (arrangement === "saloon") {
    // In the back of the ambulance the stretcher is against the nearside
    // wall: the crew work from the offside and the head end only.
    // The attendant squeezes the bag, or secures the tube on the ventilator, or steadies the head.
    const attendant: Slot = { at: [0.1, -(r.headL + 0.3)], facing: [0, 1], kneeling: false, hands: needsAirway ? { left: maskHand, right: bvmHand } : onVent ? { left: [A.mouth[0] + 0.06, A.mouth[1] - 0.03], right: [A.earR[0] - 0.03, A.earR[1] - 0.02] } : { left: [A.earL[0] + 0.03, A.earL[1] - 0.02], right: [A.earR[0] - 0.03, A.earR[1] - 0.02] }, handClass: needsAirway ? { right: "squeeze" } : undefined };
    const side: Slot = { at: [r.chestW + 0.42, r.chestY + 0.12], facing: [-1, 0], kneeling: false, hands: { left: [A.leftWrist[0] + 0.02, A.leftWrist[1]], right: [A.leftUpperChest[0] + 0.06, A.leftUpperChest[1] - 0.02] } };
    const foot: Slot = { at: [r.chestW + 0.42, r.hipY + 0.5], facing: [-1, 0], kneeling: false, hands: { left: [A.leftKnee[0] + 0.03, A.leftKnee[1] - 0.06], right: [A.leftThigh[0] + 0.05, A.leftThigh[1]] } };
    const compressor: Slot = { ...side, hands: cprHands, armsClass: "ps-arms cpr", grip: "cpr" };
    crew.slice(0, 3).forEach((c, i) => {
      if (look.arrest && !look.kit.lucas && i === (compressorIx === -1 ? 0 : compressorIx)) { slots.push(compressor); return; }
      if ((needsAirway || onVent) && !slots.includes(attendant)) { slots.push(attendant); return; }
      if (!slots.includes(side) && !slots.includes(compressor)) { slots.push(side); return; }
      if (!slots.includes(foot)) { slots.push(foot); return; }
      slots.push(attendant);
    });
  } else if (arrangement === "car") {
    const door: Slot = { at: [-(r.chestW + 0.5), r.chestY + 0.15], facing: [1, 0], kneeling: false, hands: { right: [A.rightWrist[0] - 0.02, A.rightWrist[1] - 0.02], left: [A.rightUpperChest[0] - 0.05, A.rightUpperChest[1]] } };
    const behind: Slot = { at: [0.05, -(r.headL + 0.28)], facing: [0, 1], kneeling: false, hands: needsAirway ? { left: maskHand, right: bvmHand } : { left: [A.earL[0] + 0.03, A.earL[1] - 0.02], right: [A.earR[0] - 0.03, A.earR[1] - 0.02] }, handClass: needsAirway ? { right: "squeeze" } : undefined };
    crew.slice(0, 2).forEach((c, i) => slots.push(i === 0 ? door : behind));
  } else if (arrangement === "water") {
    const dry: Partial<CrewWear> = { uniform: "#c0392b", trousers: "#c0392b", yoke: "#c0392b", hiVis: null, jacket: false, sleeves: "long", role: "", hat: "white_helmet" };
    const right: Slot = { at: [r.chestW + 0.4, r.chestY + 0.05], facing: [-1, 0], kneeling: false, hands: { left: [A.leftUpperChest[0] + 0.08, A.leftUpperChest[1] - 0.06], right: [A.chin[0] + 0.06, A.chin[1] + 0.04] }, wear: dry };
    const left: Slot = { at: [-(r.chestW + 0.4), r.chestY + 0.2], facing: [1, 0], kneeling: false, hands: { right: [A.rightUpperChest[0] - 0.08, A.rightUpperChest[1] - 0.02], left: [A.rightWrist[0] - 0.05, A.rightWrist[1] - 0.1] }, wear: dry };
    crew.slice(0, 2).forEach((c, i) => slots.push(i === 0 ? right : left));
  }
  // While the cannula is going in, the kit layer leaves the site to the
  // act being drawn over it; the dressed cannula and its line follow.
  const cannulating = look.fx.acts.some((a) => a.kind === "cannula");
  const kitLook = cannulating ? { ...look, kit: { ...look.kit, iv: false } } : look;
  // Someone holds the drip up: a free hand on the side crew, else a stand, else it lies by the arm.
  let ivAt: Pt | undefined;
  if (kitLook.kit.iv) {
    if (setting === "ward") ivAt = [-0.95, -0.42];
    else if (/^ambulance/.test(setting)) ivAt = [0.46, -0.3];
    else {
      const holder = slots.find((sl, i) => !sl.armsClass && sl.facing[0] !== 0 && (i > 0 || slots.length === 1));
      if (holder) {
        const out: Pt = [holder.at[0] - holder.facing[0] * 0.05, holder.at[1] - 0.42];
        if (holder.facing[0] < 0) holder.hands.right = out; else holder.hands.left = out;
        ivAt = [out[0] + (holder.facing[0] < 0 ? 0.06 : -0.06), out[1] + 0.04];
      }
    }
  }
  // Cables run round the crew's hands, not under them.
  const avoid: Pt[] = slots.flatMap((sl) => [sl.hands.left, sl.hands.right].filter((h): h is Pt => !!h));
  const kit = kitLayers(kitLook, r, { monitorPort: port, o2At, bvmHand: needsAirway ? bvmHand : undefined, ivAt, avoid, ventAt: onVent ? spec.vent : undefined });

  const gctx: GroundCtx = { r, k, amb, title: ctx?.title ?? "", type: ctx?.type ?? "", seated: pose === "seated", label: (label ?? "").toLowerCase(), lucas: look.kit.lucas, vent: onVent };
  const breath = look.breathing === "none" ? 0 : 60 / Math.max(6, look.rr);
  const chestStyle = breath ? ({ "--ps-breath": `${breath.toFixed(2)}s` } as CSSProperties) : undefined;
  const chestClass = `ps-chest${breath ? " breathe" : ""}${look.compressor ? " cpr" : ""}${look.breathing === "laboured" ? " laboured" : ""}`;
  const monitored = look.kit.leads || look.kit.pads || look.kit.probe || look.kit.cuff;
  const tagFor = (c: SceneCrew | undefined, i: number) => (c ? (i > 0 && crew[i - 1]?.callsign === c.callsign && c.name ? c.name.toUpperCase() : c.callsign) : "");

  return (
    <div ref={box} className={`ps-scene ps-set-${setting}${look.arrest ? " arrest" : ""}${amb.night ? " night" : ""}${chrome === "stage" ? " fill" : ""}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-label="Patient from above">
        <defs>
          <FigureDefs />
          <KitDefs />
          <GroundDefs />
          <GroundClips />
          <WeatherDefs />
        </defs>
        <g transform={`translate(${ox} ${oy}) scale(${s.toFixed(2)})`}>
          {spec.ground(gctx)}
          {spec.under?.(gctx)}
          {kit.under}
          <g className={look.seizing ? "ps-patient seizing" : "ps-patient"}>
            <PlanFigure rig={r} w={wear} chestClass={chestClass} chestStyle={chestStyle} onChest={kit.onChest} over={kit.over} shadow={pose !== "floating"} />
          </g>
          {spec.over?.(gctx)}
          {monitored && <Monitor at={monitorAt} arrest={look.arrest} portSide={monitorAt[0] < 0 ? 1 : -1} />}
          {crew.length > 0 && arrangement !== "water" && <KitBag at={bagAt} pouches={look.fx.pouches} />}
          {look.kit.oxygen !== "none" && arrangement !== "water" && <O2Cylinder at={o2At} angle={spec.o2 ? 90 : 78} />}
          {kit.lines}
          {slots.map((sl, i) => (
            <CrewTop key={i} at={sl.at} facing={sl.facing} hands={sl.hands} kneeling={sl.kneeling} armsClass={sl.armsClass} handClass={sl.handClass} grip={sl.grip} style={{ animationDelay: `${((i * 1.7) % 4.4).toFixed(1)}s` }} wear={{ ...crewWearOf(crew[i]?.service ?? "Ambulance", crew[i]?.scope, hash(crew[i]?.callsign ?? "x") + i * 977, { jacket: JACKET_SETTINGS.has(setting) || (spec.outdoor && amb.night), role: roleWord(crew[i]) }), ...sl.wear }} />
          ))}
          {kitLook.kit.iv && ivAt && <DripBag at={ivAt} />}
          <Acts look={look} r={r} />
          <Weather amb={amb} outdoor={spec.outdoor} centre={[0, r.chestY]} k={k} />
        </g>
        {amb.rain && spec.outdoor && (
          <g className="ps-rain">
            {Array.from({ length: 26 }, (_, i) => <line key={i} x1={(i * 53) % W} y1={((i * 37) % H) - 20} x2={((i * 53) % W) + 3} y2={((i * 37) % H) - 4} />)}
          </g>
        )}
        {slots.map((sl, i) => {
          const h = px(crewHeadAt(sl.at, sl.facing));
          const dx = sl.facing[0] !== 0 ? -sl.facing[0] * 34 : 0;
          const dy = sl.facing[0] !== 0 ? -4 : -28;
          return <text key={i} x={h[0] + dx} y={h[1] + dy} textAnchor="middle" className={crew[i]?.lead ? "ps-tag lead" : "ps-tag"}>{tagFor(crew[i], i)}</text>;
        })}
        {look.fx.acts.map((a) => {
          const p = px(actSite(r, a));
          return <text key={`${a.kind}-${a.at}`} x={p[0]} y={p[1] - 22} textAnchor="middle" className="ps-tag act">{shout(a.label)}</text>;
        })}
        {crew.length === 0 && <text x={W / 2} y={H - 46} textAnchor="middle" className="ps-empty">NO CREW WITH THE PATIENT</text>}
      </svg>
      {chrome === "full" && monitored && vitals && <VitalsCard look={look} vitals={vitals} />}
      {chrome === "full" && hour !== undefined && <div className="ps-ovl ps-clock">{hhmm(hour)}</div>}
      <div className="ps-caption">
        {caption && <b>{caption}</b>}
        <span>{look.words.join(" · ")}</span>
      </div>
    </div>
  );
}
