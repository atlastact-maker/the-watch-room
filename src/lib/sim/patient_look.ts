// HOW THE PATIENT LOOKS. The scene draws a person, not a form: where
// they are, how they are lying, the colour of their skin, how hard they
// are breathing, what is on them, and who they are — age, sex, build,
// hair, what they are doing with their hands. All of it is read off the
// treatment record and the casualty, so the picture changes as the crew
// work, and a seven-year-old is not drawn as a man of fifty.

import type { DrugName, PackagingAction, PatientTreatmentState } from "./incident_types";
import { DRUG_LABEL } from "./incident_types";
import type { PatientRedFlag, SceneCasualty } from "./scene";
import type { ResusState } from "./resus";
import type { BodyRegion } from "./body_regions";
import { RED_FLAG_REGIONS } from "./body_regions";

export type Posture = "supine" | "sitting" | "in_vehicle" | "in_water" | "at_height";
export type Skin = "normal" | "pale" | "grey" | "cyanosed" | "flushed";
export type Breathing = "calm" | "fast" | "laboured" | "slow" | "none";
export type Eyes = "open" | "half" | "closed";
export type OxygenDeviceLook = "none" | "nasal" | "mask" | "nrb" | "bvm";
export type HairStyle = "short" | "long" | "bob" | "bald" | "child";
/** What the patient is doing with themselves, when conscious. */
export type Cue = "none" | "hand_on_chest" | "tripod" | "hands_on_throat" | "holding_head" | "holding_arm" | "holding_belly" | "arm_limp";

export type Appearance = {
  ageYears: number;
  sex: "male" | "female";
  /** Standing height in metres. */
  heightM: number;
  child: boolean;
  elderly: boolean;
  pregnant: boolean;
  hair: HairStyle;
  hairColour: string;
  /** Skin at rest; the scene tints it by state. */
  skinBase: string;
  /** Two clothing colours, stable for this patient. */
  topColour: string;
  bottomColour: string;
  cue: Cue;
};

export type PatientLook = {
  posture: Posture;
  skin: Skin;
  sweating: boolean;
  breathing: Breathing;
  /** Breaths per minute, for the animation. */
  rr: number;
  eyes: Eyes;
  /** Where it hurts — regions to mark. */
  hurt: BodyRegion[];
  bleeding: boolean;
  seizing: boolean;
  kit: {
    leads: boolean;
    /** The six chest electrodes of a 12-lead are on as well. */
    ecg12: boolean;
    probe: boolean;
    cuff: boolean;
    pads: boolean;
    capno: boolean;
    oxygen: OxygenDeviceLook;
    /** Something in the airway: an adjunct, an i-gel or a tube. */
    airway: "none" | "adjunct" | "igel" | "tube";
    iv: boolean;
    collar: boolean;
    board: boolean;
    pelvicBinder: boolean;
    tourniquet: boolean;
    dressing: boolean;
    blanket: boolean;
    splint: boolean;
    lucas: boolean;
  };
  /** Whose hands are on the chest, when someone's are. */
  compressor?: string;
  arrest: boolean;
  appearance: Appearance;
  /** Short words for the caption: "sat on the stairs · pale, sweaty · breathing fast". */
  words: string[];
  /** What is being done to the patient at this moment, for the scene to animate. */
  fx: SceneFx;
};

export type LookOpts = {
  /** Out of the water, off the face, out of the car: at the vehicle now. */
  landed?: boolean;
  /** The clock. Without it the look has no "right now": nothing animates. */
  now?: number;
};

/** One thing a clinician is doing at this moment, and where on the patient. */
export type SceneAct = {
  kind: "cannula" | "syringe" | "tablet" | "spray" | "neb";
  /** The cannula site on the back of the hand, the thigh for an intramuscular dose, the mouth. */
  site: "iv" | "thigh" | "mouth";
  at: number;
  label: string;
};

export type SceneFx = {
  acts: SceneAct[];
  /** The pouches of the kit bag that are open, by what is being got out of them. */
  pouches: { airway: boolean; circ: boolean; drugs: boolean };
  /** Kit that has just gone on, drawn settling into place. */
  fresh: (keyof PatientLook["kit"])[];
};

/** How long each thing takes to show. A cannula slides in and is dressed;
 *  a dose is pushed; a pouch stays open while the crew have their hands in it. */
const ACT_MS = 4500;
const CANNULA_MS = 5200;
const POUCH_MS = 7000;
const FRESH_MS = 2500;

const IM_DRUGS = new Set<DrugName>(["adrenaline_im_anaphylaxis", "midazolam_im", "glucagon_im"]);
const ORAL_DRUGS = new Set<DrugName>(["paracetamol", "aspirin_300"]);
const NEB_DRUGS = new Set<DrugName>(["salbutamol_neb", "ipratropium_neb", "entonox"]);
const MONITOR_KIT = { ecg_leads: "leads", ecg_12: "ecg12", spo2_probe: "probe", nibp_cuff: "cuff", defib_pads: "pads", capnography: "capno" } as const;
const PACKAGING_KIT: Partial<Record<PackagingAction, keyof PatientLook["kit"]>> = {
  warming: "blanket", spine_board: "board", scoop_stretcher: "board", ked: "collar", pelvic_binder: "pelvicBinder",
  tourniquet: "tourniquet", traction_splint: "splint", dressings: "dressing", wound_pack: "dressing",
};

/** What the last few seconds of the record say is happening to the patient. */
function sceneFx(tx: PatientTreatmentState | null | undefined, kit: PatientLook["kit"], now: number | undefined): SceneFx {
  const acts: SceneAct[] = [];
  const pouches = { airway: false, circ: false, drugs: false };
  const fresh = new Set<keyof PatientLook["kit"]>();
  if (tx && now !== undefined) {
    // The record is chronological: only its tail can be this recent.
    for (let i = tx.events.length - 1; i >= 0; i--) {
      const e = tx.events[i];
      const age = now - e.at;
      if (age > POUCH_MS) break;
      if (age < 0) continue;
      switch (e.kind) {
        case "circulation":
          if (e.action === "iv_access" || e.action === "io_access") {
            pouches.circ = true;
            if (age <= CANNULA_MS) acts.push({ kind: "cannula", site: "iv", at: e.at, label: e.action === "io_access" ? "IO access" : "Cannula" });
            if (age <= FRESH_MS) fresh.add("iv");
          }
          break;
        case "drug": {
          pouches.drugs = true;
          if (age > ACT_MS) break;
          const label = DRUG_LABEL[e.drug];
          if (ORAL_DRUGS.has(e.drug)) acts.push({ kind: "tablet", site: "mouth", at: e.at, label });
          else if (e.drug === "gtn_spray") acts.push({ kind: "spray", site: "mouth", at: e.at, label });
          else if (NEB_DRUGS.has(e.drug)) acts.push({ kind: "neb", site: "mouth", at: e.at, label });
          else if (IM_DRUGS.has(e.drug) || !kit.iv) acts.push({ kind: "syringe", site: "thigh", at: e.at, label });
          else acts.push({ kind: "syringe", site: "iv", at: e.at, label });
          break;
        }
        case "airway":
          if (e.action !== "position" && e.action !== "back_blows" && e.action !== "abdominal_thrusts") pouches.airway = true;
          if (age <= FRESH_MS && (e.action === "opa" || e.action === "npa" || e.action === "igel" || e.action === "rsi")) fresh.add("airway");
          break;
        case "breathing":
          if (e.action === "bvm") pouches.airway = true;
          if (age <= FRESH_MS && (e.action === "bvm" || e.action === "oxygen_15l")) fresh.add("oxygen");
          break;
        case "monitoring":
          if (age <= FRESH_MS && !e.off) fresh.add(MONITOR_KIT[e.device]);
          break;
        case "packaging": {
          if (e.action === "dressings" || e.action === "wound_pack" || e.action === "tourniquet") pouches.circ = true;
          const key = PACKAGING_KIT[e.action];
          if (key && age <= FRESH_MS) fresh.add(key);
          break;
        }
      }
    }
  }
  return { acts, pouches, fresh: [...fresh] };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Age and sex from a label like "Male, 58", "(F, ~29)", "Child (5)", "Girl, 7", "twenties". */
function parseWho(label: string): { age?: number; sex?: "male" | "female" } {
  const l = label.toLowerCase();
  let age: number | undefined;
  let sex: "male" | "female" | undefined;
  const paren = /\((m|f),?\s*~?(\d{1,3})\)/.exec(l);
  const named = /\b(male|female|girl|boy|man|woman|child|adult)\b[^0-9]{0,12}(\d{1,3})\b/.exec(l);
  const bare = /\b(\d{1,3})\s*(?:y|yrs|years)?\b/.exec(l.replace(/\d+\s*m\b/g, ""));
  if (paren) { age = Number(paren[2]); sex = paren[1] === "f" ? "female" : "male"; }
  else if (named) { age = Number(named[2]); }
  else if (/\btwenties\b/.test(l)) age = 25;
  else if (/\b(thirties|30s)\b/.test(l)) age = 35;
  else if (/\b(forties|40s)\b/.test(l)) age = 45;
  else if (/\b(fifties|50s)\b/.test(l)) age = 55;
  else if (/\b(sixties|60s)\b/.test(l)) age = 65;
  else if (/\b(seventies|70s)\b/.test(l)) age = 75;
  else if (/\b(eighties|80s)\b/.test(l)) age = 85;
  else if (/\belderly\b/.test(l)) age = 80;
  else if (/\b(toddler)\b/.test(l)) age = 2;
  else if (/\b(baby|infant|newborn)\b/.test(l)) age = 1;
  else if (/\b(child|girl|boy)\b/.test(l)) age = 7;
  else if (/\bteen/.test(l)) age = 15;
  else if (bare && Number(bare[1]) >= 1 && Number(bare[1]) <= 105 && /\b(male|female|girl|boy|resident|patient|driver|walker|worker)\b/.test(l)) age = Number(bare[1]);
  if (!sex) {
    if (/\b(female|girl|woman|mother|wife|daughter|lady|pregnan|weeks)\b/.test(l)) sex = "female";
    else if (/\b(male|boy|man|father|husband|son)\b/.test(l)) sex = "male";
  }
  return { age, sex };
}

function appearanceOf(c: SceneCasualty, tx: PatientTreatmentState | null | undefined, cue: Cue): Appearance {
  const seed = hash(c.id);
  const pick = <T,>(xs: T[], n: number) => xs[(seed >>> n) % xs.length];
  const parsed = parseWho(c.label ?? "");
  const profile = tx?.profile;
  const ageYears = profile?.ageYears ?? parsed.age ?? c.clinical?.ageYears ?? 40;
  const sex = profile?.sex ?? parsed.sex ?? (seed % 2 ? "female" : "male");
  const child = ageYears <= 12;
  const elderly = ageYears >= 70;
  const pregnant = !!profile?.pregnant || /pregnan|weeks|second stage|labour/i.test((c.label ?? "") + (c.clinical?.presumedCondition ?? ""));
  const heightM = child
    ? Math.min(1.5, 0.74 + ageYears * 0.06)
    : ageYears <= 16
      ? (sex === "male" ? 1.62 : 1.58)
      : (sex === "male" ? 1.76 : 1.63) - (elderly ? 0.04 : 0);
  const greys = ["#c9ccd0", "#b7bbc0", "#e6e3dc"];
  const colours = ["#2b1d14", "#4a3220", "#8a5a2b", "#c48a3f", "#1b1b1b", "#6b4a2a", "#b5452a"];
  const hairColour = elderly ? pick(greys, 3) : ageYears >= 55 && seed % 3 === 0 ? "#9a9da2" : pick(colours, 5);
  const hair: HairStyle = child
    ? (sex === "female" && seed % 3 !== 0 ? "bob" : "child")
    : sex === "female"
      ? pick(["long", "bob", "long", "short"] as HairStyle[], 7)
      : ageYears >= 50 && seed % 4 === 0 ? "bald" : "short";
  const skins = ["#f1c9a5", "#e8b894", "#d9a079", "#b67a4e", "#8c5a36", "#5f3d25"];
  const skinBase = pick(skins, 9);
  const tops = child
    ? ["#e2473a", "#3b86d8", "#f2b63c", "#5fb55f", "#e86aa3", "#7a5bd6"]
    : elderly
      ? ["#8c7b6a", "#6d7f8c", "#a67c7c", "#7c8c6d", "#9c8f6b", "#5f6e7f"]
      : ["#4d6f9f", "#5b5f6b", "#8a3f3f", "#3f6f5a", "#6b4f8a", "#b06a3a", "#2f4f6f", "#7a7a7a"];
  const bottoms = child ? ["#3b4a6b", "#5a5a5a", "#2e5c8a", "#7a4f3a"] : ["#3c4653", "#2c3e55", "#555a60", "#6b5a4a", "#1f2a35", "#4a4f57"];
  return {
    ageYears, sex, heightM, child, elderly, pregnant, hair, hairColour, skinBase,
    topColour: pick(tops, 11), bottomColour: pick(bottoms, 13), cue,
  };
}

function postureOf(c: SceneCasualty, gcs: number, arrest: boolean, flags: Set<PatientRedFlag>, landed: boolean): Posture {
  if (c.inWater && !landed) return "in_water";
  if (c.atHeight && !landed) return "at_height";
  if (c.trappedUntilExtricated && !landed) return "in_vehicle";
  if (arrest || gcs < 9) return "supine";
  const l = (c.label ?? "").toLowerCase();
  if (/\b(sat|sitting|seated|chair|sofa|bench|stairs|propped|choking|upright)\b/.test(l)) return "sitting";
  if (/\b(lying|collapsed|floor|ground|supine|prone|unresponsive|fallen|on the road|deformity)\b/.test(l)) return "supine";
  if (!landed && /\b(car|vehicle|driver|passenger|cab)\b/.test(l)) return "in_vehicle";
  // Someone fighting for breath sits up; a gunshot or a bad fall does not.
  if (flags.has("severe_asthma") || flags.has("anaphylaxis") || flags.has("airway_compromise")) return "sitting";
  if (flags.has("major_haemorrhage") || flags.has("spinal_injury_suspected") || flags.has("hypovolaemic_shock")) return "supine";
  return c.severity === "critical" ? "supine" : "sitting";
}

function cueOf(c: SceneCasualty, flags: Set<PatientRedFlag>, eyes: Eyes, posture: Posture, hurt: Set<BodyRegion>, pregnant: boolean, breathing: Breathing): Cue {
  if (eyes !== "open") return "none";
  const l = (c.label ?? "").toLowerCase() + " " + (c.clinical?.presumedCondition ?? "").toLowerCase();
  if (flags.has("airway_compromise") || flags.has("anaphylaxis") || /chok/.test(l)) return "hands_on_throat";
  if (flags.has("stemi") || /chest pain/.test(l)) return posture === "sitting" ? "hand_on_chest" : "none";
  if (flags.has("severe_asthma") || (breathing === "laboured" && posture === "sitting")) return "tripod";
  if (pregnant && /second stage|labour|contraction|birth/.test(l)) return "holding_belly";
  if (flags.has("stroke_fast_positive")) return "arm_limp";
  if (flags.has("head_injury_severe") || hurt.has("head")) return "holding_head";
  if (hurt.has("left_arm") || hurt.has("right_arm") || /forearm|hand\b|wrist|arm\b/.test(l)) return "holding_arm";
  return "none";
}

export function patientLook(c: SceneCasualty, tx: PatientTreatmentState | null | undefined, resus: ResusState | undefined, opts: LookOpts = {}): PatientLook {
  const landed = !!opts.landed;
  const arrest = !!resus && resus.roscAt === undefined && resus.roleAt === undefined;
  const v = tx?.liveVitals ?? tx?.revealedVitals ?? c.clinical?.vitals;
  const flags = new Set<PatientRedFlag>(tx?.activeRedFlags ?? tx?.revealedRedFlags ?? c.clinical?.redFlags ?? []);
  const gcs = arrest ? 3 : v?.gcs ?? (c.severity === "critical" ? 8 : 15);
  const spo2 = v?.spo2 ?? 97;
  const sys = v?.bpSys ?? 120;
  const rr = arrest ? 0 : v?.rr ?? 16;
  const pain = tx?.physio?.pain ?? 0;

  let skin: Skin = "normal";
  if (arrest || resus?.roleAt !== undefined) skin = "grey";
  else if (spo2 < 88) skin = "cyanosed";
  else if (flags.has("hypovolaemic_shock") || flags.has("major_haemorrhage") || sys < 90) skin = "grey";
  else if (flags.has("anaphylaxis")) skin = "flushed";
  else if (flags.has("stemi") || flags.has("hypoglycaemia") || spo2 < 92 || sys < 100 || pain >= 7) skin = "pale";

  const sweating = !arrest && (flags.has("stemi") || flags.has("hypoglycaemia") || flags.has("hypovolaemic_shock") || pain >= 7 || (skin === "grey"));
  const breathing: Breathing = arrest || rr === 0 ? "none" : rr <= 8 ? "slow" : flags.has("severe_asthma") || flags.has("tension_pneumothorax") || flags.has("airway_compromise") || rr >= 28 ? "laboured" : rr >= 21 ? "fast" : "calm";
  const eyes: Eyes = arrest ? "closed" : gcs >= 14 ? "open" : gcs >= 9 ? "half" : "closed";

  const hurt = new Set<BodyRegion>();
  for (const f of flags) for (const r of RED_FLAG_REGIONS[f] ?? []) if (r !== "systemic") hurt.add(r);
  const label = (c.label ?? "").toLowerCase();
  if (/head injur|head wound|skull/.test(label)) hurt.add("head");
  if (/lower limb|femur|leg\b|ankle|knee/.test(label)) hurt.add("left_leg");
  if (/forearm|wrist|hand\b|arm\b|shoulder/.test(label)) hurt.add("left_arm");
  if (/pelvi/.test(label)) hurt.add("pelvis");
  const bleeding = flags.has("major_haemorrhage") && !(tx?.physio?.bleedControlled ?? false);

  const mon = tx?.monitoring ?? {};
  const o2 = tx?.oxygen?.device ?? "none";
  const oxygen: OxygenDeviceLook = tx?.breathing.bvm || (resus && resus.airway === "none" && arrest) ? "bvm" : o2 === "nrb" ? "nrb" : o2 === "simple_mask" || o2 === "venturi" ? "mask" : o2 === "nasal_cannula" ? "nasal" : "none";
  const aw = tx?.airway ?? {};
  const airway: PatientLook["kit"]["airway"] = aw.rsi || resus?.airway === "ett" ? "tube" : aw.igel || resus?.airway === "igel" ? "igel" : aw.opa || aw.npa ? "adjunct" : "none";
  const pk = tx?.packaging ?? {};
  const kit: PatientLook["kit"] = {
    leads: !!mon.ecg_leads || !!mon.ecg_12 || (resus?.monitor === "lead_3" || resus?.monitor === "lead_12"),
    ecg12: !!mon.ecg_12 || resus?.monitor === "lead_12",
    probe: !!mon.spo2_probe,
    cuff: !!mon.nibp_cuff,
    pads: !!mon.defib_pads || resus?.monitor === "pads" || (resus?.shocks ?? 0) > 0,
    capno: !!mon.capnography || !!resus?.capnographyOn,
    oxygen,
    airway,
    iv: !!(tx?.circulation.iv_access || tx?.circulation.io_access),
    collar: !!(pk.spine_board || pk.scoop_stretcher || pk.ked) || flags.has("spinal_injury_suspected") && !!pk.spine_board,
    board: !!(pk.spine_board || pk.scoop_stretcher),
    pelvicBinder: !!pk.pelvic_binder,
    tourniquet: !!pk.tourniquet,
    dressing: !!(pk.dressings || pk.wound_pack),
    blanket: !!pk.warming,
    splint: !!pk.traction_splint,
    lucas: resus?.lucasFittedAt !== undefined,
  };
  const compressor = arrest && resus?.cyclePausedAt === undefined ? (resus?.lucasFittedAt !== undefined ? "LUCAS" : resus?.compressorName ?? "crew") : undefined;

  const posture = postureOf(c, gcs, arrest, flags, landed);
  const pregnant = !!tx?.profile?.pregnant || /pregnan|weeks|second stage|labour/.test(label);
  const cue = cueOf(c, flags, eyes, posture, hurt, pregnant, breathing);
  const appearance = appearanceOf(c, tx, cue);

  const words: string[] = [];
  words.push(posture === "in_water" ? "in the water" : posture === "at_height" ? "at height" : posture === "in_vehicle" ? "still in the vehicle" : posture === "sitting" ? "sat up" : "lying flat");
  if (arrest) words.push("no output");
  else {
    const look: string[] = [];
    if (skin === "cyanosed") look.push("blue"); else if (skin === "grey") look.push("grey"); else if (skin === "pale") look.push("pale"); else if (skin === "flushed") look.push("flushed");
    if (sweating) look.push("sweaty");
    if (look.length) words.push(look.join(", "));
    words.push(breathing === "none" ? "not breathing" : breathing === "laboured" ? "struggling to breathe" : breathing === "fast" ? "breathing fast" : breathing === "slow" ? "breathing slowly" : eyes === "open" ? "talking" : "quiet");
    if (eyes !== "open") words.push(eyes === "half" ? "drowsy" : "unresponsive");
  }
  if (bleeding) words.push("bleeding");
  if (tx?.physio?.seizing) words.push("fitting");

  return { posture, skin, sweating, breathing, rr, eyes, hurt: [...hurt], bleeding, seizing: !!tx?.physio?.seizing, kit, compressor, arrest, appearance, words, fx: sceneFx(tx, kit, opts.now) };
}
