// Top-down incident scene — schematic, drone-view-style geometry authored
// per scenario. Units are metres. SVG convention: Y increases southward.

export type ScenePoint = { x: number; y: number };
export type SceneRect = { x: number; y: number; w: number; h: number };

export type SceneBuilding = {
  shape: SceneRect;
  kind: "target" | "neighbour" | "other";
  label?: string;
};

export type SceneRoad = {
  shape: SceneRect;
  kind: "road" | "pavement" | "driveway" | "garden";
  label?: string;
};

export type SceneHydrant = {
  label: string;
  /** Scene-relative metre offset (optional). If `coords` is also supplied,
   *  `coords` wins. */
  pos?: ScenePoint;
  /** Absolute world coordinates \u2014 used when a scenario hand-picks real
   *  kerbside hydrant positions from OSM rather than using schematic offsets. */
  coords?: { lat: number; lng: number };
  /** Optional street-name hint shown under the "H" marker. */
  street?: string;
};

export type SceneLandmark = {
  pos: ScenePoint;
  kind: "tree" | "lamppost" | "car" | "other";
  label?: string;
};

export type SceneHazard = {
  id: string;
  pos: ScenePoint;
  kind: "gas" | "cylinders" | "electrical" | "structural" | "chemical";
  label: string;
  knownFromPri?: boolean;
  /** Minutes of any crew on-scene before this hazard is revealed (identified
   *  by searching crews). Ignored if knownFromPri is true. */
  discoverAfterMinOnScene?: number;
};

/**
 * Fire material — drives the (material × attack mode × equipment) → rate
 * multiplier matrix. Picking the wrong approach can be ineffective or
 * actively counter-productive (water on a flammable-liquid fire spreads
 * the pool; water on a live-electrical fire creates a shock hazard until
 * the supply is isolated).
 */
export type FireMaterial =
  | "structural"        // wood, plaster, furniture, contents — standard UK dwelling fire
  | "electrical"        // live circuit / switchgear — water dangerous until isolated
  | "flammable_liquid"  // oil, fuel, solvents — water spreads the pool, foam required
  | "metal"             // magnesium, titanium — water reacts, dry powder only
  | "lpg_gas"           // LPG / propane / butane — isolate + cool, foam for any pool
  | "bulk_combustible"  // warehouse / industrial stock — needs HVP for scale
  | "vehicle";          // car / HGV — water-foam mix, watch for fuel tank

export type SceneFire = {
  pos: ScenePoint;
  radiusM: number;
  /** Growth rate in metres/minute when unchecked. Default 0.2. */
  growthRateMpm?: number;
  /** Suppression rate per BA wearer on scene, metres/minute. Default 0.05. */
  suppressionPerBaMpm?: number;
  /** Maximum radius before structural collapse / fully involved. Default 15. */
  maxRadiusM?: number;
  /** What's actually burning. Drives the effectiveness matrix + the
   *  tactical-hint UI. Defaults to "structural" when unspecified. */
  material?: FireMaterial;
  /** When true, the material isn't revealed to the operator until a 360
   *  survey completes. Lets scenarios model "the caller said chip-pan but
   *  on arrival it's an electrical cupboard" discovery beats. */
  unknownMaterial?: boolean;
};

/** Clinical presentation on patient assessment — authored on the scene
 *  casualty so every playthrough gets the same "truth" when the operator
 *  runs a primary survey. Missing fields fall back to generic defaults
 *  derived from the casualty's severity grade. */
export type PatientClinical = {
  vitals: {
    rr: number;           // respiratory rate
    spo2: number;         // oxygen saturation %
    hr: number;           // heart rate
    bpSys: number;        // systolic BP
    bpDia: number;        // diastolic BP
    gcs: number;          // Glasgow Coma Scale 3-15
    temp: number;         // °C
    bm: number;           // blood glucose mmol/L
  };
  presumedCondition: string;
  /** Red flags surfaced on the primary survey — drive action gating in the
   *  treatment menu (e.g. `tension_pneumothorax` unlocks Needle Decomp). */
  redFlags: PatientRedFlag[];
  /** Preferred destination type for debrief scoring. Delivering a STEMI
   *  to a generic A&E instead of a PCI centre is penalised. */
  preferredDestination: HospitalDestinationType;
  /** Authored "critical interventions" — actions the patient needs to
   *  stabilise. If not performed before deterioration completes, the
   *  casualty gets worse faster. */
  criticalInterventions: CriticalIntervention[];
};

export type PatientRedFlag =
  | "tension_pneumothorax"
  | "hypovolaemic_shock"
  | "airway_compromise"
  | "head_injury_severe"
  | "spinal_injury_suspected"
  | "cardiac_arrest"
  | "stemi"
  | "stroke_fast_positive"
  | "anaphylaxis"
  | "severe_asthma"
  | "hypoglycaemia"
  | "seizure_active"
  | "major_haemorrhage"
  | "overdose_opioid";

export type HospitalDestinationType =
  | "nearest_a_e"
  | "mtc"          // Major Trauma Centre
  | "pci"          // Primary PCI centre for STEMI
  | "hasu"         // Hyperacute Stroke Unit
  | "paed_ed"     // Paediatric A&E
  | "burns"        // Burns unit
  | "non_convey";

export type CriticalIntervention =
  | "oxygen"
  | "iv_access"
  | "fluids"
  | "tXA"
  | "needle_decomp"
  | "finger_thoracostomy"
  | "rsi"
  | "blood_products"
  | "adrenaline_im"
  | "salbutamol_neb"
  | "aspirin"
  | "gtn"
  | "midazolam"
  | "glucagon"
  | "naloxone"
  | "defib"
  | "cpr"
  | "pelvic_binder"
  | "tourniquet"
  | "spine_board";

export type SceneCasualty = {
  id: string;
  /** Position on the scene (metres). */
  pos: ScenePoint;
  severity: "critical" | "serious" | "walking";
  /** Authored clinical presentation. When omitted the sim generates
   *  sensible defaults from severity. */
  clinical?: PatientClinical;
  /** Minutes of BA committed on scene before this casualty is located.
   *  First casualty should typically be 3–5 min, further ones later. */
  discoverAfterMinBa: number;
  label?: string;
};

export type SceneSector = {
  id: 1 | 2 | 3 | 4;
  label: string;
  /** "front" | "rear" | etc.  Free-form tag for the UI. */
  face: "front" | "rear" | "left" | "right";
  /** Compass bearing (0° = north, clockwise). Used to draw the slice. */
  bearingDeg: number;
};

export type Scene = {
  viewBox: { x: number; y: number; width: number; height: number };
  compassNorth: "up" | "down" | "left" | "right";
  buildings: SceneBuilding[];
  roads: SceneRoad[];
  hydrants: SceneHydrant[];
  landmarks: SceneLandmark[];
  fireSeat?: SceneFire;
  hazards: SceneHazard[];
  casualties?: SceneCasualty[];
  sectors?: SceneSector[];
};

/**
 * Convert a scene-local metre offset (x = east, y = south per SVG convention)
 * to a real-world lat/lng anchored at the given incident coordinates.
 *
 * Uses a small-area flat-Earth approximation — accurate to sub-metre at the
 * 100m scale we care about.
 */
export function metresToLatLng(
  anchor: { lat: number; lng: number },
  offset: ScenePoint,
): { lat: number; lng: number } {
  const LAT_DEG_PER_METRE = 1 / 111000;
  const lngDegPerMetre = 1 / (111000 * Math.cos((anchor.lat * Math.PI) / 180));
  return {
    lat: anchor.lat - offset.y * LAT_DEG_PER_METRE,
    lng: anchor.lng + offset.x * lngDegPerMetre,
  };
}
