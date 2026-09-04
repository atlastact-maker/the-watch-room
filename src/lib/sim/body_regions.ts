// Body-region model for the pre-hospital treatment UI.
//
// Each region has an optional coord on the front and/or back silhouette
// (SVG viewBox 200×400). Regions that are systemic (whole-body, e.g.
// anaphylaxis or opioid overdose) render as a border glow, not a pin.

import type {
  AirwayAction,
  BreathingAction,
  CirculationAction,
  DrugName,
  PackagingAction,
} from "./incident_types";
import type { PatientRedFlag } from "./scene";

export type BodyRegion =
  | "head"
  | "neck"
  | "chest"
  | "abdomen"
  | "pelvis"
  | "back"
  | "left_arm"
  | "right_arm"
  | "left_leg"
  | "right_leg"
  | "systemic";

export type BodyView = "front" | "back";

export type BodyRegionMeta = {
  code: BodyRegion;
  label: string;
  /** Position on the SVG silhouette (front view). Null if not shown here. */
  front?: { x: number; y: number };
  /** Position on the SVG silhouette (back view). Null if not shown here. */
  back?: { x: number; y: number };
};

export const BODY_REGIONS: BodyRegionMeta[] = [
  { code: "head",      label: "Head",      front: { x: 100, y: 46 },  back: { x: 100, y: 46 } },
  { code: "neck",      label: "Neck",      front: { x: 100, y: 82 },  back: { x: 100, y: 82 } },
  { code: "chest",     label: "Chest",     front: { x: 100, y: 130 } },
  { code: "abdomen",   label: "Abdomen",   front: { x: 100, y: 185 } },
  { code: "pelvis",    label: "Pelvis",    front: { x: 100, y: 232 } },
  { code: "back",      label: "Spine / back",                          back: { x: 100, y: 160 } },
  { code: "left_arm",  label: "Left arm",  front: { x: 46,  y: 172 }, back: { x: 154, y: 172 } },
  { code: "right_arm", label: "Right arm", front: { x: 154, y: 172 }, back: { x: 46,  y: 172 } },
  { code: "left_leg",  label: "Left leg",  front: { x: 82,  y: 315 }, back: { x: 118, y: 315 } },
  { code: "right_leg", label: "Right leg", front: { x: 118, y: 315 }, back: { x: 82,  y: 315 } },
  { code: "systemic",  label: "Systemic" },
];

export function regionMeta(code: BodyRegion): BodyRegionMeta | undefined {
  return BODY_REGIONS.find((r) => r.code === code);
}

export function regionsOnView(view: BodyView): BodyRegionMeta[] {
  return BODY_REGIONS.filter((r) => (view === "front" ? r.front : r.back));
}

// ---------------------------------------------------------------------------
// Red-flag → body regions
// ---------------------------------------------------------------------------

export const RED_FLAG_REGIONS: Record<PatientRedFlag, BodyRegion[]> = {
  tension_pneumothorax:    ["chest"],
  hypovolaemic_shock:      ["systemic"],
  airway_compromise:       ["neck", "head"],
  head_injury_severe:      ["head"],
  spinal_injury_suspected: ["back", "neck"],
  cardiac_arrest:          ["chest", "systemic"],
  stemi:                   ["chest"],
  stroke_fast_positive:    ["head"],
  anaphylaxis:             ["systemic"],
  severe_asthma:           ["chest"],
  hypoglycaemia:           ["systemic"],
  seizure_active:          ["head", "systemic"],
  major_haemorrhage:       ["systemic"],
  overdose_opioid:         ["systemic", "head"],
};

// ---------------------------------------------------------------------------
// Intervention → body regions
//
// Used to filter action chips when the operator has a region selected —
// only actions whose region set includes (or intersects) the selection
// stay bright; the rest fade back.
// ---------------------------------------------------------------------------

export const AIRWAY_ACTION_REGIONS: Record<AirwayAction, BodyRegion[]> = {
  position: ["head", "neck"],
  opa:      ["head", "neck"],
  npa:      ["head", "neck"],
  igel:     ["head", "neck"],
  suction:  ["head", "neck"],
  // Back blows land between the shoulder blades and thrusts on the
  // abdomen, so these are the only airway actions that are not a
  // head-and-neck job.
  back_blows:        ["chest", "head"],
  abdominal_thrusts: ["abdomen", "chest"],
  magill_forceps:    ["head", "neck"],
  rsi:      ["head", "neck"],
};

export const BREATHING_ACTION_REGIONS: Record<BreathingAction, BodyRegion[]> = {
  oxygen_15l:          ["head", "chest"],
  bvm:                 ["head", "chest"],
  needle_decomp:       ["chest"],
  finger_thoracostomy: ["chest"],
};

export const CIRCULATION_ACTION_REGIONS: Record<CirculationAction, BodyRegion[]> = {
  iv_access:  ["left_arm", "right_arm"],
  io_access:  ["left_leg", "right_leg"],
  fluids_250: ["systemic"],
  fluids_500: ["systemic"],
  cpr:        ["chest"],
  defib:      ["chest"],
};

export const PACKAGING_ACTION_REGIONS: Record<PackagingAction, BodyRegion[]> = {
  // Warming is a whole-body measure, which is what "systemic" is for.
  warming: ["systemic"],
  assisted_delivery: ["pelvis", "abdomen"],
  spine_board:     ["back", "neck"],
  scoop_stretcher: ["systemic"],
  ked:             ["back", "neck"],
  pelvic_binder:   ["pelvis"],
  tourniquet:      ["left_arm", "right_arm", "left_leg", "right_leg"],
  traction_splint: ["left_leg", "right_leg"],
  dressings:       ["systemic"],
  wound_pack:      ["systemic"],
};

// Drugs — mapped to the region of the condition they typically treat.
// Systemic drugs (given IV/IM for a whole-body problem) get "systemic".
export const DRUG_REGIONS: Record<DrugName, BodyRegion[]> = {
  // Paramedic baseline
  paracetamol:               ["systemic"],
  entonox:                   ["systemic"],
  morphine:                  ["systemic"],
  aspirin_300:               ["chest"],
  gtn_spray:                 ["chest"],
  salbutamol_neb:            ["chest"],
  ipratropium_neb:           ["chest"],
  adrenaline_im_anaphylaxis: ["systemic"],
  adrenaline_cpr:            ["chest", "systemic"],
  midazolam_im:              ["head", "systemic"],
  glucagon_im:               ["systemic"],
  dextrose_iv:               ["systemic"],
  naloxone:                  ["systemic", "head"],
  ondansetron:               ["systemic"],
  tXA_iv:                    ["systemic"],
  // AP (QR) extended
  ketamine_analgesia:        ["systemic"],
  fentanyl:                  ["systemic"],
  amiodarone:                ["chest"],
  magnesium_sulfate:         ["chest", "systemic"],
  hydrocortisone:            ["systemic"],
  chlorphenamine:            ["systemic"],
  calcium_chloride:          ["systemic"],
  // CCC / HEMS advanced
  ketamine_rsi:              ["head", "neck"],
  rocuronium:                ["head", "neck"],
  propofol:                  ["head", "neck"],
  metaraminol:               ["systemic"],
  noradrenaline:             ["systemic"],
  blood_prbc:                ["systemic"],
  blood_plasma:              ["systemic"],
};

/**
 * True if any of the action's regions intersect (or contain systemic /
 * include the selected region). Systemic actions stay visible for any
 * region selection because they act on the whole body.
 */
export function actionMatchesRegion(
  actionRegions: BodyRegion[],
  selected: BodyRegion | null,
): boolean {
  if (!selected) return true;
  if (actionRegions.includes("systemic")) return true;
  if (selected === "systemic") return true;
  return actionRegions.includes(selected);
}
