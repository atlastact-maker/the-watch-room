// HOW THE PATIENT LOOKS. The scene draws a person, not a form: where
// they are, how they are lying, the colour of their skin, how hard they
// are breathing, what is on them. All of it is read off the treatment
// record and the casualty, so the picture changes as the crew work.

import type { PatientTreatmentState } from "./incident_types";
import type { PatientRedFlag, SceneCasualty } from "./scene";
import type { ResusState } from "./resus";
import type { BodyRegion } from "./body_regions";
import { RED_FLAG_REGIONS } from "./body_regions";

export type Posture = "supine" | "sitting" | "in_vehicle" | "in_water" | "at_height";
export type Skin = "normal" | "pale" | "grey" | "cyanosed" | "flushed";
export type Breathing = "calm" | "fast" | "laboured" | "slow" | "none";
export type Eyes = "open" | "half" | "closed";
export type OxygenDeviceLook = "none" | "nasal" | "mask" | "nrb" | "bvm";

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
  /** Short words for the caption: "sat on the stairs · pale, sweaty · breathing fast". */
  words: string[];
};

function postureOf(c: SceneCasualty, gcs: number, arrest: boolean): Posture {
  if (c.inWater) return "in_water";
  if (c.atHeight) return "at_height";
  if (c.trappedUntilExtricated) return "in_vehicle";
  if (arrest || gcs < 9) return "supine";
  const l = (c.label ?? "").toLowerCase();
  if (/\b(sat|sitting|seated|chair|sofa|bench|stairs|propped)\b/.test(l)) return "sitting";
  if (/\b(lying|collapsed|floor|ground|supine|prone|unresponsive|fallen|on the road)\b/.test(l)) return "supine";
  if (/\b(car|vehicle|driver|passenger|cab)\b/.test(l)) return "in_vehicle";
  return c.severity === "critical" ? "supine" : "sitting";
}

export function patientLook(c: SceneCasualty, tx: PatientTreatmentState | null | undefined, resus: ResusState | undefined): PatientLook {
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
  const bleeding = flags.has("major_haemorrhage") && !(tx?.physio?.bleedControlled ?? false);

  const mon = tx?.monitoring ?? {};
  const o2 = tx?.oxygen?.device ?? "none";
  const oxygen: OxygenDeviceLook = tx?.breathing.bvm || (resus && resus.airway === "none" && arrest) ? "bvm" : o2 === "nrb" ? "nrb" : o2 === "simple_mask" || o2 === "venturi" ? "mask" : o2 === "nasal_cannula" ? "nasal" : "none";
  const aw = tx?.airway ?? {};
  const airway: PatientLook["kit"]["airway"] = aw.rsi || resus?.airway === "ett" ? "tube" : aw.igel || resus?.airway === "igel" ? "igel" : aw.opa || aw.npa ? "adjunct" : "none";
  const pk = tx?.packaging ?? {};
  const kit: PatientLook["kit"] = {
    leads: !!mon.ecg_leads || (resus?.monitor === "lead_3" || resus?.monitor === "lead_12"),
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

  const posture = postureOf(c, gcs, arrest);
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

  return { posture, skin, sweating, breathing, rr, eyes, hurt: [...hurt], bleeding, seizing: !!tx?.physio?.seizing, kit, compressor, arrest, words };
}
