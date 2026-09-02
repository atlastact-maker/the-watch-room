import type { ApplianceTypeCode, AreaCode, ServiceCode } from "./types";
import type { Scene } from "./scene";

export type IncidentTypeCode =
  | "automatic_fire_alarm"
  | "dwelling_fire_persons_reported"
  | "rtc_entrapment"
  | "industrial_fire"
  | "wildfire_moorland"
  | "hazmat_chemical_leak"
  | "high_rise_dwelling_fire"
  | "education_premises_fire"
  | "special_service_water_rescue"
  | "healthcare_premises_fire_alarm"
  | "police_firearms_incident"
  | "ambulance_cardiac_arrest";

export type Severity = "low" | "moderate" | "high" | "major";

/** Emergency-light state of an on-scene appliance. */
export type LightState =
  | "999"          // responding — front+rear blues+reds + sirens
  | "at_scene"     // rear blues + reds for scene marking (typical UK on-scene)
  | "rear_blues"   // rear blues only
  | "rear_reds"    // rear reds only
  | "hazards"      // 4-way hazard flashers (no emergency lights)
  | "off";         // all off

/** Equipment a single crew member can carry. */
export type CrewEquipment =
  // Firefighting
  | "ba_set"
  | "branch_45mm"
  | "branch_70mm"
  | "fast_attack_branch"
  | "thermal_camera"
  // Water supply
  | "red_key"          // hydrant T-bar (red key)
  | "standpipe"        // standpipe + adapter
  // Method of entry (MOE)
  | "hali_tool"        // Hali-gan / Hooligan bar
  | "lock_snapper"     // Euro cylinder snapper
  | "forcible_entry"   // generic forcible-entry kit (sledge + axe)
  // RTC / heavy rescue
  | "hydraulic_cutters"
  | "hydraulic_spreaders"
  | "combi_tool"
  | "hydraulic_ram"
  | "airbag_lifting"
  | "stabiliser_chocks"
  | "stab_struts"          // Paratech / Res-Q-Jack rescue struts
  | "glass_mgmt"
  | "spine_board"
  | "ked_extrication"      // Kendrick extrication device
  | "reciprocating_saw"    // Sabre / recip saw
  | "disc_cutter"          // cut-off saw / abrasive disc
  | "chainsaw"
  | "concrete_breaker"
  | "search_camera"        // probe / pole camera
  | "area_lighting"
  | "airline_ba"           // airline breathing apparatus for confined spaces
  | "small_tools"          // small gear kit — spanners, pliers, lead cutters, straps
  // Firefighting media
  | "foam_branch"          // foam-making branch (FB5X/FB10X) + AFFF pickup
  // Rope rescue
  | "rope_kit"
  | "rescue_harness"
  | "sked_stretcher"       // SKED / Paraguard / basket stretcher
  | "tripod_anchor"        // tripod + anchor kit
  | "edge_roller"
  | "pulleys_prusiks"
  // Water rescue
  | "water_rescue_kit"
  | "dry_suit"
  | "pfd"                  // personal flotation device
  | "throw_line"
  | "rescue_sled"          // inflatable rescue sledge / path
  | "wading_pole"
  // Wildfire
  | "beater"
  | "leaf_blower"
  | "knapsack_sprayer"
  | "drip_torch"
  // Medical
  | "aed"
  | "first_aid"
  | "trauma"
  | "extinguisher"
  // Comms
  | "radio";

export type CapabilityTag =
  | "BA"
  | "RTC_extrication"
  | "WaterRescue"
  | "Rope"
  | "USAR"
  | "HAZMAT_DIM"
  | "Wildfire"
  | "Aerial"
  | "Foam"
  | "Command"
  // Ambulance (NWAS)
  | "Medical"
  | "Trauma"
  | "HEMS"
  | "HART"
  // Police (GMP)
  | "Police_Response"
  | "Police_Armed"
  | "Police_Air"
  | "Police_Dog"
  | "Police_Traffic"
  | "Police_Roads"
  | "Police_Search"
  | "Police_Investigation";

// Capability defaults per appliance type. Keep this engine-side rather than
// in the physical-appliance data so the realism research file stays focused
// on what the appliance physically is, not what the sim does with it.
export const CAPABILITIES_BY_TYPE: Record<ApplianceTypeCode, CapabilityTag[]> = {
  WrL: ["BA"],
  WrT: ["BA", "Aerial"],
  L6P: ["BA"],
  ATV: [],
  TL: ["Aerial"],
  HLP: ["Aerial"],
  WIU: ["WaterRescue"],
  ICU: ["Command"],
  CSU: ["Command"],
  OSU: ["Command"],
  FIU: [],
  BASU: ["BA"],
  BFU: ["Foam"],
  SACU: [],
  WU: [],
  WFU: ["Wildfire"],
  HLL: [],
  PM: [],
  TRU_pump: ["BA", "RTC_extrication", "Rope", "WaterRescue"],
  TRU_van: ["RTC_extrication", "Rope"],
  USAR: ["USAR", "Rope"],
  SDU: [],
  DIM: ["HAZMAT_DIM"],

  // Ambulance (NWAS)
  DCA: ["Medical"],
  RRV: ["Medical"],
  // HART. The IRU is the capability-carrying vehicle — safe access/safe
  // egress, inland water, working at height, confined space and CBRN all
  // ride on it. The access vehicles carry the team to ground the IRU
  // cannot reach; the carrier and multi-casualty unit are logistics.
  HART_vehicle: ["Medical", "HART", "Rope", "WaterRescue", "HAZMAT_DIM"],
  HART_PCV: ["Medical", "HART"],
  HART_ORIRU: ["Medical", "HART", "Rope"],
  HART_ATV: ["Medical", "HART"],
  HART_carrier: ["HART"],
  HART_RRV: ["Medical"],
  NWAS_IRU: ["HAZMAT_DIM"],
  HEMS: ["Medical", "Trauma", "HEMS"],
  BASICS: ["Medical", "Trauma"],
  QR: ["Medical", "Trauma"],
  OD: ["Command", "Medical"],
  CCC: ["Medical", "Trauma"],

  // Police (GMP)
  Police_Response: ["Police_Response"],
  Police_ARV: ["Police_Response", "Police_Armed"],
  Police_NPAS: ["Police_Response", "Police_Air"],
  Police_Dog: ["Police_Response", "Police_Dog"],
  Police_TraffMot: ["Police_Response", "Police_Traffic", "Police_Roads"],
  Police_RPU: ["Police_Response", "Police_Traffic", "Police_Roads"],
  Police_Search: ["Police_Search"],
  Police_SIO: ["Police_Investigation", "Command"],
};

export type PdaSlot = {
  id: string;
  label: string; // e.g. "Pump 1"
  service: ServiceCode;
  requiredApplianceTypes: ApplianceTypeCode[];
  requiredCapabilities: CapabilityTag[];
  preferredStationId?: string;
  notes?: string;
};

export type Methane = {
  M: string;
  E: string;
  T: string;
  H: string;
  A: string;
  N: string;
  emergencyServices: string;
};

export type Scenario = {
  id: string;
  slug: string;
  title: string;
  type: IncidentTypeCode;
  patch: AreaCode;
  severity: Severity;
  trigger: string;

  location: {
    address: string;
    postcode: string;
    coords: { lat: number; lng: number };
  };

  property: {
    class: string;
    size?: string;
    materials?: string;
    occupants: string;
    vulnerabilities: string[];
    access: string;
    knownHazards: string[];
    firstDueStationId: string;
    /** Front-door construction — drives forcible-entry tool odds.
     *  Revealed to the operator by the 360 survey. When not authored,
     *  a heuristic on `class` picks a plausible default. */
    doorType?: DoorType;
  };

  pri: {
    hasFormalPri: boolean;
    items: string[];
  };

  methane: Methane;

  pda: PdaSlot[];

  evaluation: {
    targets: { metric: string; target: string }[];
    lesson: string;
  };

  /** Optional hand-authored top-down incident scene. Present for scenarios
   *  that have a ground-view authored; absent scenarios render a generic
   *  placeholder when the ground view is opened. */
  scene?: Scene;

  /** Crash Recovery System datasheets — present on vehicle-based
   *  scenarios (RTCs). Mirrors the Moditech CRS crews use on real MDTs:
   *  a top-down schematic per involved vehicle with safety-critical
   *  components (batteries, SRS, fuel, reinforcements) and cutting
   *  guidance. The MDT shows a CRS tab whenever this is authored. */
  crs?: CrsVehicle[];

  /** Optional call-handler → informant script. Each entry is a message the
   *  999 informant (the caller) passes to the operator while crews are en
   *  route. The informant "hangs up" once the first crew lands on scene.
   *  Updates can be delay-gated (only fire if crews haven't arrived by
   *  time X) and probabilistic — scenarios can escalate naturally when
   *  attendance is slow without always firing every beat. */
  informantScript?: InformantUpdate[];
};

// ---------------------------------------------------------------------------
// Patient treatment — per-casualty clinical state, driven by the Treatment
// tab in the ambulance action menu. Captures the operator's survey,
// interventions, drugs, packaging choices, destination and ATMIST
// pre-alert. Directly feeds back into casualty deterioration in the sim.
// ---------------------------------------------------------------------------

/** Clinical scope tiers. Higher tier = more actions unlocked in the
 *  Treatment tab. Computed per-patient from the set of clinicians
 *  currently paired to the casualty. */
export type ClinicianScope =
  | "none"       // no ambulance on scene yet
  | "dca"        // standard Double-Crewed Ambulance paramedic
  | "ap"         // Advanced Paramedic (QR)
  | "ccc"        // Critical Care Car (paramedic + doctor)
  | "basics"     // BASICS volunteer doctor
  | "hems";      // HEMS doctor-paramedic team

/** What each scope unlocks. Stacks — HEMS also has everything below it. */
export const SCOPE_LEVEL: Record<ClinicianScope, number> = {
  none: 0,
  dca: 1,
  ap: 2,
  ccc: 3,
  basics: 3,
  hems: 4,
};

/**
 * Clinical scope by appliance type — the single source of truth.
 *
 * This used to be guessed from the appliance id string, which was both
 * fragile (`id.includes("dr")` matched any id containing "dr") and wrong
 * the moment a callsign changed: the critical care car now carries an
 * NWAS `H` callsign, which the old check read as HEMS. The type is
 * authoritative and is always to hand at the call sites.
 *
 * Anything not listed carries no clinician — a fire appliance's AED does
 * not make its crew paramedics.
 */
export const SCOPE_BY_TYPE: Partial<Record<ApplianceTypeCode, ClinicianScope>> = {
  DCA: "dca",
  RRV: "dca",
  HART_vehicle: "dca",
  HART_ORIRU: "dca",
  HART_ATV: "dca",
  HART_PCV: "dca",
  HART_RRV: "dca",
  HART_carrier: "dca",
  NWAS_IRU: "dca",   // multi-casualty vehicle — HART-crewed like the rest
  QR: "ap",        // Advanced Paramedic (QX)
  OD: "ap",        // Duty Officer (BX) — Band 7 paramedic commander
  CCC: "ccc",
  BASICS: "basics",
  HEMS: "hems",
};

/** Scope an appliance type brings to a patient, "none" if it brings none. */
export function scopeOfApplianceType(type: ApplianceTypeCode): ClinicianScope {
  return SCOPE_BY_TYPE[type] ?? "none";
}

/** Drugs the operator can administer. Split by scope — the Treatment tab
 *  filters the list by the highest clinician available on scene. */
export type DrugName =
  // Paramedic baseline
  | "paracetamol"
  | "entonox"
  | "morphine"
  | "aspirin_300"
  | "gtn_spray"
  | "salbutamol_neb"
  | "ipratropium_neb"
  | "adrenaline_im_anaphylaxis"
  | "adrenaline_cpr"
  | "midazolam_im"
  | "glucagon_im"
  | "dextrose_iv"
  | "naloxone"
  | "ondansetron"
  | "tXA_iv"
  // AP (QR) extended
  | "ketamine_analgesia"
  | "fentanyl"
  | "amiodarone"
  | "magnesium_sulfate"
  | "hydrocortisone"
  | "chlorphenamine"
  | "calcium_chloride"
  // CCC / HEMS advanced
  | "ketamine_rsi"
  | "rocuronium"
  | "propofol"
  | "metaraminol"
  | "noradrenaline"
  | "blood_prbc"
  | "blood_plasma";

/** Minimum scope required to administer each drug. */
export const DRUG_MIN_SCOPE: Record<DrugName, ClinicianScope> = {
  paracetamol: "dca",
  entonox: "dca",
  morphine: "dca",
  aspirin_300: "dca",
  gtn_spray: "dca",
  salbutamol_neb: "dca",
  ipratropium_neb: "dca",
  adrenaline_im_anaphylaxis: "dca",
  adrenaline_cpr: "dca",
  midazolam_im: "dca",
  glucagon_im: "dca",
  dextrose_iv: "dca",
  naloxone: "dca",
  ondansetron: "dca",
  tXA_iv: "dca",
  ketamine_analgesia: "ap",
  fentanyl: "ap",
  amiodarone: "ap",
  magnesium_sulfate: "ap",
  hydrocortisone: "ap",
  chlorphenamine: "ap",
  calcium_chloride: "ap",
  ketamine_rsi: "ccc",
  rocuronium: "ccc",
  propofol: "ccc",
  metaraminol: "ccc",
  noradrenaline: "ccc",
  blood_prbc: "ccc",
  blood_plasma: "ccc",
};

export const DRUG_LABEL: Record<DrugName, string> = {
  paracetamol: "Paracetamol PO",
  entonox: "Entonox",
  morphine: "Morphine IV",
  aspirin_300: "Aspirin 300 mg PO",
  gtn_spray: "GTN spray SL",
  salbutamol_neb: "Salbutamol neb",
  ipratropium_neb: "Ipratropium neb",
  adrenaline_im_anaphylaxis: "Adrenaline 500 µg IM",
  adrenaline_cpr: "Adrenaline 1 mg IV (arrest)",
  midazolam_im: "Midazolam IM",
  glucagon_im: "Glucagon IM",
  dextrose_iv: "10 % Dextrose IV",
  naloxone: "Naloxone IM/IV",
  ondansetron: "Ondansetron",
  tXA_iv: "TXA 1 g IV",
  ketamine_analgesia: "Ketamine (analgesic)",
  fentanyl: "Fentanyl IV",
  amiodarone: "Amiodarone",
  magnesium_sulfate: "Magnesium sulfate",
  hydrocortisone: "Hydrocortisone",
  chlorphenamine: "Chlorphenamine",
  calcium_chloride: "Calcium chloride",
  ketamine_rsi: "Ketamine (RSI)",
  rocuronium: "Rocuronium",
  propofol: "Propofol",
  metaraminol: "Metaraminol",
  noradrenaline: "Noradrenaline",
  blood_prbc: "Blood · PRBC",
  blood_plasma: "Blood · Plasma",
};

/** Airway / breathing / circulation interventions. */
export type AirwayAction = "position" | "opa" | "npa" | "igel" | "suction" | "rsi";
export type BreathingAction =
  | "oxygen_15l"
  | "bvm"
  | "needle_decomp"
  | "finger_thoracostomy";
export type CirculationAction = "iv_access" | "io_access" | "fluids_250" | "fluids_500" | "cpr" | "defib";
export type PackagingAction =
  | "spine_board"
  | "scoop_stretcher"
  | "ked"
  | "pelvic_binder"
  | "tourniquet"
  | "traction_splint"
  | "dressings"
  | "wound_pack";

/** Scope gates on interventions (not just drugs). */
export const AIRWAY_MIN_SCOPE: Record<AirwayAction, ClinicianScope> = {
  position: "dca",
  opa: "dca",
  npa: "dca",
  igel: "dca",
  suction: "dca",
  rsi: "ccc",      // needs doctor (CCC w/ doctor, BASICS, or HEMS)
};
export const BREATHING_MIN_SCOPE: Record<BreathingAction, ClinicianScope> = {
  oxygen_15l: "dca",
  bvm: "dca",
  needle_decomp: "dca",
  finger_thoracostomy: "ccc",
};

/** A single logged treatment event. Stored in the order applied so the
 *  Treatment tab can show a running timeline. */
export type TreatmentEvent =
  | { kind: "survey_started"; at: number }
  | { kind: "survey_completed"; at: number }
  | { kind: "airway"; action: AirwayAction; at: number; by: string }
  | { kind: "breathing"; action: BreathingAction; at: number; by: string }
  | { kind: "circulation"; action: CirculationAction; at: number; by: string }
  | { kind: "drug"; drug: DrugName; at: number; by: string }
  | { kind: "packaging"; action: PackagingAction; at: number; by: string }
  | { kind: "clinician_requested"; scope: ClinicianScope; at: number }
  | { kind: "clinician_on_scene"; scope: ClinicianScope; at: number }
  | { kind: "destination_set"; destination: import("./scene").HospitalDestinationType; name: string; at: number }
  | { kind: "atmist_sent"; at: number };

/** Full treatment state for one casualty. Persisted in dashboard-client
 *  state keyed by casualty id; survives ambulance hand-off (if HEMS takes
 *  over the patient, the same record keeps growing). */
export type PatientTreatmentState = {
  casualtyId: string;
  surveyStartedAt?: number;
  surveyCompletedAt?: number;
  /** Once the survey completes, these fields are populated from the
   *  scene's authored `clinical` (or sensible defaults). */
  revealedVitals?: import("./scene").PatientClinical["vitals"];
  revealedCondition?: string;
  revealedRedFlags?: import("./scene").PatientRedFlag[];
  preferredDestination?: import("./scene").HospitalDestinationType;
  /** Vitals that move over time in response to active red flags (they
   *  degrade) and interventions (they recover). Seeded from
   *  revealedVitals at survey completion, then ticked by the sim. Shown
   *  on the treatment tab as the "live" numbers the operator watches. */
  liveVitals?: import("./scene").PatientClinical["vitals"];
  /** Epoch ms of the last liveVitals tick — used so an N-second tick is
   *  idempotent even when React re-renders at a faster cadence. */
  liveVitalsLastTickAt?: number;
  /** Red flags the sim currently considers "active" on this patient.
   *  Starts as a copy of revealedRedFlags; an intervention can clear a
   *  flag (e.g. needle decomp clears tension_pneumothorax), which stops
   *  that flag's vitals degradation. */
  activeRedFlags?: import("./scene").PatientRedFlag[];
  /** Previous liveVitals for trend-arrow display. Updated each tick. */
  prevLiveVitals?: import("./scene").PatientClinical["vitals"];
  /** Interventions applied so far, keyed by action for idempotent lookup. */
  airway: Partial<Record<AirwayAction, number>>;
  breathing: Partial<Record<BreathingAction, number>>;
  circulation: Partial<Record<CirculationAction, number>>;
  /** Drugs administered — unordered set with timestamps (one per drug at most). */
  drugs: Partial<Record<DrugName, number>>;
  packaging: Partial<Record<PackagingAction, number>>;
  /** Chosen destination (the actual receiving hospital). */
  chosenDestination?: {
    type: import("./scene").HospitalDestinationType;
    name: string;
    at: number;
  };
  atmistSentAt?: number;
  /** Full chronological event log for the UI timeline. */
  events: TreatmentEvent[];
};

/** A single scripted update the informant gives while waiting for crews
 *  to arrive. Authored per scenario and triggered by the dashboard
 *  informant tick. */
export type InformantUpdate = {
  id: string;
  /** Seconds from incident-opened (call answered) when this update would
   *  fire at the earliest. */
  atSec: number;
  /** If set, this update only fires when the first crew still hasn't
   *  arrived by this many seconds after call-open. Lets scenarios
   *  author escalation beats that *only* happen on slow responses. */
  delayThresholdSec?: number;
  /** 0–1 probability this update actually fires when triggered. Default
   *  1 (certain). Lower values produce varied playthroughs — the same
   *  scenario might escalate in one shift and not in another. */
  probability?: number;
  /** What the informant says, in first-person call-handler phrasing. */
  text: string;
  /** Visual tone for the update in the informant panel. */
  tone?: "info" | "urgent" | "critical";
  /** When this update COMMITS (fires with text), the listed beat ids are
   *  silently skipped — lets scenarios author mutually-exclusive
   *  outcomes ("it's a false alarm" vs "it's a working fire") without
   *  both ever landing in one playthrough. */
  suppressesIds?: string[];
  /** This update can only fire after every listed beat id has COMMITTED.
   *  If any listed beat was rolled and skipped, this one is skipped too —
   *  follow-on beats never orphan ("evacuation started" can't fire when
   *  the fire itself never happened). */
  requiresFiredIds?: string[];
  /** Only fires when every listed casualty is PRESENT this run (persons
   *  reality roll) — "my son's upstairs" can't play on an all-out night.
   *  Silently skipped otherwise. */
  requiresCasualtyIds?: string[];
  /** Only fires when every listed casualty is ABSENT this run — the
   *  relief beat ("they're all out!") on the other side of the roll. */
  requiresAbsentCasualtyIds?: string[];
  /** Optional hard sim effects to apply when the update fires. */
  effect?: {
    /** Push the incident receivedAt back by this many seconds so the fire
     *  growth integration adds an immediate radius chunk — models a
     *  "fire has spread to another room" escalation. */
    accelerateGrowthSec?: number;
    /** Flash a persistent high-priority banner on the informant panel. */
    pulseCritical?: boolean;
    /** Start (or grow) a REAL fire at the scene's fire seat from the
     *  moment this beat fires. This is how "probably false" alarm
     *  scenarios (AFA, hospital) roll their reality per playthrough:
     *  the seat is authored at zero radius / zero growth, and the
     *  confirmed-fire beat's probability decides whether tonight is the
     *  night. Additive — a later escalation beat can add radius and
     *  raise the growth rate. */
    igniteFire?: { radiusM: number; growthRateMpm: number };
    /** Make an absent casualty (presentProbability 0 or a failed roll)
     *  PRESENT from this beat onward — "my husband went back in for him".
     *  The casualty then discovers, progresses and scores as normal. */
    revealCasualty?: string;
  };
};

/** Runtime fire started by an informant beat's igniteFire effect —
 *  tracked by the dashboard and fed into simulateIncident. */
export type FireIgnition = {
  atMs: number;
  radiusM: number;
  growthRateMpm: number;
};

// Active runtime incident — instantiated when the player triggers a scenario.
export type Incident = {
  id: string;          // unique per playthrough
  scenarioId: string;
  scenario: Scenario;
  receivedAt: number;  // epoch ms
  resolvedAt?: number; // set when the operator resolves (stop message)
};

// Deployment of a single appliance to an incident.
export type Deployment = {
  applianceId: string;
  incidentId: string;
  slotId: string;            // which PDA slot this fills
  mobilisedAt: number;       // epoch ms
  etaSeconds: number;        // seconds from mobilisation to in-attendance
  arrivesAt: number;         // mobilisedAt + etaSeconds * 1000
  routeMeters?: number;      // route distance from OSRM
  /** Outbound route polyline, [lat, lng] pairs. */
  routeCoords?: [number, number][];

  /** Operator-chosen parking position on the ground scene. Until set, the
   *  appliance is not yet rendered on the scene — the operator must place it. */
  parkingPos?: { lat: number; lng: number };
  /** Operator-chosen parking bearing in degrees clockwise from north. */
  parkingBearingDeg?: number;
  /** Crew members the operator pre-selected as the BA team while en route.
   *  On arrival they rig in BA and STAGE at the entry point — they do NOT
   *  commit to SAR automatically; the operator still gives the commit
   *  order from the action menu. Only meaningful for BA-capable pumps. */
  preCommitBaCrewIds?: string[];
  /** Epoch ms the pre-selected BA team rigged + staged on arrival. Set by
   *  the staging effect (idempotence marker) and cleared when the team
   *  actually commits to a BA task. */
  baStagedAt?: number;
  /** Emergency-light state. "999" while responding (front + rear blues +
   *  reds + sirens), "at_scene" for rear visibility lights, etc. */
  lightState?: LightState;
  /** Whether the appliance pump is engaged (water can flow through hoses). */
  pumpRunning?: boolean;
  /** Crew member id assigned to operate the pump — required for any
   *  hose-attack / relay task. Without an operator on the pump, the
   *  pump can't run even if the panel says it's on. */
  pumpOperatorCrewId?: string;
  /** Whether the rapid-deployment hose reel has been pulled out. */
  fastAttackDeployed?: boolean;
  /** Per-crew-member equipment loadout, by crew member id → set of
   *  equipment keys (BA set, branch, hydrant key, AED, etc.). */
  crewEquipment?: Record<string, string[]>;
  /** For Prime Movers: the pod the operator chose to carry to this incident.
   *  Overrides any default podType baked into the appliance definition. */
  selectedPodType?: import("./types").PodTypeCode;

  // Hospital leg (ambulance only — populated on resolve when conveying).
  // Lifecycle: at-incident → mobile-to-hospital → at-hospital (offloading) →
  // mobile-to-station → at-station (rehab) → available.
  hospitalId?: string;
  hospitalName?: string;
  hospitalCoords?: { lat: number; lng: number };
  hospitalLegStartedAt?: number;
  hospitalEtaSeconds?: number;
  hospitalArrivesAt?: number;
  hospitalRouteCoords?: [number, number][];
  offloadSeconds?: number;
  offloadEndsAt?: number;

  // Return leg (populated once the incident is resolved).
  // For ambulance: hospital → station (starts at offloadEndsAt).
  // For fire: incident → station (starts at resolvedAt).
  returnStartedAt?: number;
  returnEtaSeconds?: number;
  returnArrivesAt?: number;
  returnRouteCoords?: [number, number][];
  returnRouteMeters?: number;

  // Post-return rehab window (refuel, rehab, kit replacement).
  // appliance is Off-run (status 8) between returnArrivesAt and rehabUntil.
  rehabSeconds?: number;
  rehabUntil?: number;

  // Welfare break — operator action while the appliance is on scene. Sets the
  // appliance Off-run for a fixed 15 min then reverts to In attendance.
  welfareCount?: number;       // how many welfare breaks taken
  welfareStartedAt?: number;
  welfareEndsAt?: number;
  lastWelfareAt?: number;      // for UI warnings on extended stays without rest

  /** Per-casualty treatment pairing. When an ambulance on scene is paired
   *  with a casualty (operator action in the action menu), that casualty's
   *  deterioration clock pauses. The pairing is carried onto the hospital
   *  leg so the casualty arrives with the crew that treated them.
   *  One pairing per ambulance (1:1). */
  treatingCasualtyId?: string | null;

  /** HEMS flight leg — set only when the NWAA airframe was dispatched
   *  (daylight, weather permitting). The aircraft flies a straight line
   *  to the scene, then holds overhead until the operator confirms a
   *  landing zone on the ground view; `arrivesAt` stays far in the
   *  future until the LZ is set, at which point it becomes
   *  touchdown + walk time (doctor + CCP proceed on foot). */
  hemsFlight?: {
    /** Epoch ms the aircraft is overhead the scene. */
    overheadAt: number;
    /** Seconds to put the aircraft down once an LZ is confirmed. */
    landingSec: number;
    /** Walk time LZ → casualty in seconds. Set when the LZ is confirmed. */
    walkSec?: number;
    /** Epoch ms the operator confirmed the LZ. */
    lzConfirmedAt?: number;
  };
  /** True when this deployment is the NWAA critical-care car standing in
   *  for a grounded helicopter (night / weather) — same doctor + critical
   *  care paramedic team, responding by road. */
  hemsNightCar?: boolean;
};

// Operator-visible event log entry.
export type LogEntry = {
  id: string;
  timestamp: number;
  kind:
    | "incident_opened"
    | "mobilised"
    | "in_attendance"
    | "resolved"
    | "returning"
    | "back_at_station"
    | "refuel_complete"
    | "at_hospital"
    | "offload_complete"
    | "welfare_break"
    | "welfare_complete"
    | "defect"
    | "tactical_mode"
    | "make_pumps"
    | "hazard_confirmed"
    | "casualty_found"
    | "sector_assigned"
    | "annotation"
    | "task_started"
    | "task_completed"
    | "commander_assigned"
    | "hydrant_connected"
    | "relay_connected"
    | "ba_committed"
    | "ba_withdrawn"
    | "kit_deployed"
    | "hazard_mitigated"
    | "fire_stage"
    | "casualty_deteriorated"
    | "casualty_expectant"
    | "casualty_treatment_started"
    | "casualty_treatment_ended"
    | "setback";
  message: string;
};

// ---------------------------------------------------------------------------
// Task / action system — operator assigns work orders to on-scene appliances.
// Fire suppression, casualty discovery, and entry all flow through tasks.
// ---------------------------------------------------------------------------

export type TaskKind =
  | "survey"              // initial 360 walkaround, timed (3 min)
  | "gain_entry"          // forcible entry, timed (3 min)
  | "connect_hydrant"     // instant — ties appliance to hydrant for supply
  | "relay_hose"          // instant — pumps water from another appliance to this one
  | "hose_attack"         // ongoing — suppresses fire from outside
  | "ba_sar"              // ongoing — BA search & rescue inside
  | "commander"           // assignment — this appliance's officer is IC
  | "kit_grab"            // short timed — crew deploys a piece of kit
  | "mitigate_hazard"     // timed — resolves a specific hazard on scene
  // Aerial appliances (TL / HLP)
  | "deploy_stabilisers"  // extend jacks/outriggers; prerequisite for platform
  | "extend_platform"     // ongoing — cage/ladder in use (rescue or monitor)
  | "aerial_rescue"       // ongoing — rescue casualty from height
  | "aerial_monitor"      // ongoing — water monitor from cage (needs supply);
  // Technical rescue (TRU_pump / TRU_van / USAR)
  | "rtc_extrication"     // timed — vehicle stabilisation + cutting + casualty out
  | "rope_rescue"         // ongoing — rope access / working at height
  | "water_rescue"        // ongoing — water-borne casualty recovery
  // Wildfire (WFU / L6P)
  | "wildfire_beating"    // ongoing — beaters on the fire front
  | "wildfire_knapsack"   // ongoing — knapsack sprayer suppression
  | "firebreak"           // timed — cut a break ahead of the fire
  // Police
  | "cordon"              // timed — establish inner or outer cordon
  | "traffic_mgmt"        // ongoing — lane closure / traffic direction
  | "close_carriageway"   // timed setup, then held — one carriageway coned off
  | "close_road"          // timed setup, then held — full road closure + diversion
  | "scene_preservation"  // ongoing — evidence preservation (SIO)
  // Ambulance
  | "triage_sieve"        // timed — MCI primary triage sweep
  // BA follow-on
  | "extract_casualty"    // timed — move a located casualty to safe ground
  // Crash Recovery System
  | "crs_action";         // timed — a make-safe action from the MDT CRS tab

export type HoseType = "45mm" | "70mm" | "LDH_150mm";
export type KitKind = "aed" | "first_aid" | "trauma" | "extinguisher";

// ---------------------------------------------------------------------------
// Forcible entry — tool vs door matrix
// ---------------------------------------------------------------------------

/** Front-door construction classes common on UK premises. */
// ---------------------------------------------------------------------------
// Crash Recovery System (CRS) — per-vehicle rescue datasheets for RTCs
// ---------------------------------------------------------------------------

export type CrsComponentKind =
  | "battery_12v"
  | "battery_hv"
  | "airbag"
  | "curtain_airbag"
  | "srs_unit"
  | "pretensioner"
  | "fuel_tank"
  | "gas_strut"
  | "reinforcement";

/** A make-safe action the operator can run from the CRS tab. Becomes a
 *  real `crs_action` task: crew assigned, timed, logged on completion.
 *  Two components may share an action id (e.g. a pair of gas struts) —
 *  one task completes both glyphs. */
export type CrsAction = {
  id: string;             // stable within the vehicle, e.g. "isolate-12v"
  label: string;          // "Isolate 12V battery"
  detail?: string;        // one-liner shown under the label
  durationSec: number;
  minCrew: number;
  requiredEquipment?: CrewEquipment[];
  /** Counts toward "vehicle made safe" — completing every critical action
   *  across the CRS vehicles unlocks a faster, controlled extrication. */
  critical?: boolean;
  /** Log line when the task completes — author it self-contained
   *  (include the VRM), it lands in the incident log verbatim. */
  done: string;
};

/** One safety-critical component on the schematic. Coordinates are
 *  percentages of the schematic canvas (0–100 across, 0–200 down,
 *  vehicle drawn nose-up). */
export type CrsComponent = {
  kind: CrsComponentKind;
  label: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  /** Present when crews can act on this component (isolate / contain /
   *  restrain). Absent = information only (avoid, keep clear). */
  action?: CrsAction;
};

export type CrsVehicle = {
  id: string;
  make: string;
  model: string;
  years: string;
  vrm: string;
  fuel: "petrol" | "diesel" | "hybrid" | "phev" | "bev";
  body: "car" | "van";
  /** Safety-critical guidance lines shown beside the schematic. */
  notes: string[];
  components: CrsComponent[];
  /** Whole-vehicle actions (stabilisation, glass management) that aren't
   *  tied to one schematic component. */
  actions?: CrsAction[];
};

export type DoorType =
  | "timber"          // traditional timber door, rim/mortice lock
  | "upvc"            // uPVC multi-point with euro cylinder — most UK dwellings
  | "composite"       // modern composite slab, multi-point euro cylinder
  | "steel_security"  // steel door-set (commercial / secured premises)
  | "roller_shutter"; // commercial roller shutter

export type EntryTool = "halligan" | "lock_snapper" | "red_key" | "recip_saw";

export const DOOR_TYPE_LABEL: Record<DoorType, string> = {
  timber: "Timber door",
  upvc: "uPVC multi-point",
  composite: "Composite multi-point",
  steel_security: "Steel security door",
  roller_shutter: "Roller shutter",
};

export const ENTRY_TOOL_LABEL: Record<EntryTool, string> = {
  halligan: "Halligan bar",
  lock_snapper: "Lock snapper",
  red_key: "Red key (Enforcer)",
  recip_saw: "Recip saw",
};

/** Setup time + chance the attempt defeats the door. Mirrors real UK
 *  practice: snap the euro cylinder on uPVC/composite, ram timber,
 *  cut steel and shutters. The wrong tool wastes time AND can fail. */
export const ENTRY_TABLE: Record<EntryTool, Record<DoorType, { sec: number; pct: number }>> = {
  halligan: {
    timber: { sec: 45, pct: 90 },
    upvc: { sec: 60, pct: 75 },
    composite: { sec: 75, pct: 70 },
    steel_security: { sec: 150, pct: 35 },
    roller_shutter: { sec: 150, pct: 25 },
  },
  lock_snapper: {
    timber: { sec: 60, pct: 40 },        // usually no euro cylinder to snap
    upvc: { sec: 45, pct: 95 },
    composite: { sec: 60, pct: 90 },
    steel_security: { sec: 90, pct: 50 },
    roller_shutter: { sec: 90, pct: 10 },
  },
  red_key: {
    timber: { sec: 20, pct: 95 },
    upvc: { sec: 40, pct: 60 },          // door flexes, multi-point holds
    composite: { sec: 45, pct: 75 },
    steel_security: { sec: 120, pct: 30 },
    roller_shutter: { sec: 120, pct: 5 },
  },
  recip_saw: {
    timber: { sec: 90, pct: 95 },
    upvc: { sec: 90, pct: 85 },
    composite: { sec: 100, pct: 85 },
    steel_security: { sec: 180, pct: 80 },
    roller_shutter: { sec: 150, pct: 90 },
  },
};

/** Resolve the door type for a scenario — authored value first, else a
 *  plausible heuristic from the property class. */
export function doorTypeForScenario(sc: Scenario): DoorType {
  if (sc.property.doorType) return sc.property.doorType;
  const cls = sc.property.class.toLowerCase();
  if (/(warehouse|industrial|unit|factory|plant)/.test(cls)) return "steel_security";
  if (/(shop|retail|commercial)/.test(cls)) return "roller_shutter";
  if (/(victorian|edwardian|1900s|1910s|1920s|1930s|terrace)/.test(cls)) return "timber";
  if (/(new.?build|modern|2000s|2010s|apartment|flat)/.test(cls)) return "composite";
  return "upvc"; // most retro-fitted UK housing stock
}

/** Tactical firefighting posture for a running jet. uhpl_lance is the
 *  Ultra High Pressure Lance (cold-cut): pierces the building skin from
 *  outside and cuts/cools the compartment with a fine high-pressure mist
 *  — deep-fire effect without committing BA, tiny water usage. Only
 *  appliances carrying the UHPL or HRET fit can run it. */
export type HoseAttackMode =
  | "exterior_cooling"
  | "exterior_attack"
  | "uhpl_lance"
  | "interior_attack";

/** Fire-suppression rate (metres/minute reduction) per attack mode.
 *  Interior attack is the most effective but needs BA crew under air.
 *  Exterior attack is limited — knocks down visible flame but won't reach
 *  deep-seated fire. Exterior cooling mostly holds exposures, minimal knock-down. */
export const SUPPRESSION_MPM_BY_MODE: Record<HoseAttackMode, number> = {
  exterior_cooling: 0.08,
  exterior_attack: 0.18,
  // Between an exterior and an interior attack: reaches seated fire the
  // exterior jet cannot, without BA committal. HRET turrets boost this
  // further in the sim (piercing tip + far greater flow).
  uhpl_lance: 0.28,
  interior_attack: 0.35,
};

/**
 * (material × attack mode) → effectiveness multiplier applied on top of the
 * base suppression rate. Values mean:
 *
 *    1.0  — full effect
 *    0.5  — partial, works but slow
 *    0.0  — no effect, wasting water
 *   -1.0  — counter-productive, actively making it worse (fire grows)
 *
 * The matrix captures the "don't use water on this" doctrine without
 * punishing the operator for picking generic water on a standard
 * structural fire. For truly specialist materials (metal, chemical) the
 * operator has to mobilise the right kit (BFU foam pod, DIM, etc.).
 */
export const ATTACK_EFFECTIVENESS: Record<
  import("./scene").FireMaterial,
  Record<HoseAttackMode, number>
> = {
  structural: {
    exterior_cooling: 1.0,
    exterior_attack: 1.0,
    uhpl_lance: 1.0,
    interior_attack: 1.0,
  },
  electrical: {
    // Water on a live circuit is dangerous *and* ineffective; an exterior
    // attack while the supply is still live can create a back-arc hazard.
    // Once isolated (mitigate_hazard on the electrical hazard), a later
    // pass should work — the sim checks hazard mitigation separately.
    exterior_cooling: 0.2,
    exterior_attack: -0.2,
    // The lance's fine mist at distance is the one water option that is
    // defensible on a live supply — reduced effect, not counter-productive.
    uhpl_lance: 0.3,
    interior_attack: -0.3,
  },
  flammable_liquid: {
    // Water spreads burning liquid. Foam (BFU) required for real effect;
    // until the operator mobilises a BFU, exterior cooling of exposures
    // is the only sane option.
    exterior_cooling: 0.3,
    exterior_attack: -0.5,
    // Mist won't spread burning liquid the way a jet does, but it isn't
    // foam either.
    uhpl_lance: 0.2,
    interior_attack: -0.5,
  },
  metal: {
    // Water reacts with burning metals, dry powder or sand only. Any
    // water is counter-productive; exterior cooling of surroundings is
    // mildly useful to protect exposures.
    exterior_cooling: 0.15,
    exterior_attack: -0.4,
    uhpl_lance: -0.2,
    interior_attack: -0.4,
  },
  lpg_gas: {
    // Jet on the flame is useless — you need to isolate the cylinder /
    // valve. Exterior cooling on the cylinder is critical to prevent
    // BLEVE. Interior attack without isolation is suicidal.
    exterior_cooling: 0.8,
    exterior_attack: 0.0,
    uhpl_lance: 0.1,
    interior_attack: -0.2,
  },
  bulk_combustible: {
    // Standard hose can work but you need volume — the sim treats generic
    // water on bulk as half-effective; operator should mobilise a HVP
    // (High Volume Pump pod on a Prime Mover) for full rate.
    exterior_cooling: 0.4,
    exterior_attack: 0.5,
    // Deep-seated bulk fire is the lance's home ground.
    uhpl_lance: 0.6,
    interior_attack: 0.6,
  },
  vehicle: {
    // Water-foam mix ideal; plain water works at reduced rate.
    exterior_cooling: 0.7,
    exterior_attack: 0.8,
    // Cold-cut through bodywork is close to the ideal vehicle-fire tool.
    uhpl_lance: 0.9,
    interior_attack: 0.6,
  },
  vegetation: {
    // Hose lines work where the ground allows a pump to reach, but the
    // real moorland tools are the wildfire tasks (beaters, knapsacks,
    // firebreaks). "Interior" attack has no meaning on open moor.
    exterior_cooling: 0.5,
    exterior_attack: 0.7,
    // No compartment to pierce on open moor.
    uhpl_lance: 0.2,
    interior_attack: 0.3,
  },
};

/** Short operator-facing label for each material. */
export const FIRE_MATERIAL_LABEL: Record<import("./scene").FireMaterial, string> = {
  structural: "Structural",
  electrical: "Electrical",
  flammable_liquid: "Flammable liquid",
  metal: "Metal",
  lpg_gas: "LPG / gas",
  bulk_combustible: "Bulk combustible",
  vehicle: "Vehicle",
  vegetation: "Vegetation / moorland",
};

/** Plain-English recommended tactic per material — shown in the Water tab
 *  once the material is known to the operator. */
export const FIRE_MATERIAL_TACTIC: Record<import("./scene").FireMaterial, string> = {
  structural: "Standard structural attack — BA interior advance preferred once entry is made.",
  electrical: "Isolate the electrical supply (mitigate hazard) before any water. Water on live kit is counter-productive.",
  flammable_liquid: "Foam required — mobilise a BFU (Bulk Foam Unit). Water spreads the pool; hold exposures only.",
  metal: "Dry powder or sand — water reacts with burning metal. Do not apply water.",
  lpg_gas: "Cool the cylinder from cover, isolate the valve. Do not extinguish the flame while gas is flowing.",
  bulk_combustible: "High Volume Pump (HVP) for scale. Standard hose works but slow on warehouse-scale loads.",
  vehicle: "Water-foam mix ideal. Watch for fuel tank / lithium battery involvement.",
  vegetation:
    "Beaters and knapsacks on the flanks, firebreak ahead of the head. Water where a pump can reach — peat needs soaking, not knocking, and can re-burn for days.",
};

export type Task = {
  id: string;
  applianceId: string;
  kind: TaskKind;
  startedAt: number;      // epoch ms
  durationSec?: number;   // for timed tasks
  completesAt?: number;   // startedAt + durationSec*1000 (timed only)
  state: "active" | "completed" | "aborted";
  /** Crew members (from the appliance's crewMembers) assigned to this task.
   *  For ba_sar, these are also the BA wearers (their air ticks down). */
  assignedCrewIds: string[];
  // Per-kind metadata
  hydrantId?: string;           // connect_hydrant
  baCrewIds?: string[];         // ba_sar (alias of assignedCrewIds, kept for compat)
  /** For relay_hose — the source appliance pumping water to this one. */
  sourceApplianceId?: string;
  hoseType?: HoseType;           // relay_hose
  kitKind?: KitKind;             // kit_grab
  hazardId?: string;             // mitigate_hazard
  /** Tactical method picked for mitigate_hazard (e.g. "Isolate at meter"). */
  mitigationMethod?: string;
  /** For hose_attack: exterior cooling / exterior attack / interior attack.
   *  Affects suppression rate and safety posture. */
  attackMode?: HoseAttackMode;
  /** Set when a uhpl_lance attack runs from an HRET-fitted appliance —
   *  the piercing turret flows far more water than the handheld lance. */
  hretTurret?: boolean;
  /** Hose polyline following a real foot-walking route (for
   *  connect_hydrant + relay_hose). */
  hosePath?: [number, number][];

  /** For ba_sar: mode the crew is committed for — search-for-casualties
   *  or interior firefighting. The sim treats a "search" commitment as
   *  casualty-discovery-credit; a "firefighting" commitment contributes
   *  to suppression rate via the associated interior hose_attack. */
  baMode?: "search" | "firefighting";
  /** For extract_casualty: which casualty this crew is moving out. */
  casualtyId?: string;
  /** For gain_entry: which forcible-entry tool the crew is using —
   *  duration and success odds come from ENTRY_TABLE vs the door type. */
  entryTool?: EntryTool;
  /** For close_carriageway / close_road: where the cone line sits,
   *  snapped to the nearest OSM road when the operator placed it. */
  closurePos?: { lat: number; lng: number };
  /** Road bearing at the closure point (compass degrees) — the cone
   *  line renders perpendicular to this. */
  closureBearingDeg?: number;
  // ---- Crash Recovery System (crs_action only) ---------------------------
  /** Which CRS vehicle + action this task executes. Component status on
   *  the CRS schematic is derived from tasks matching these ids. */
  crsVehicleId?: string;
  crsActionId?: string;
  /** Snapshot of the action's label/done-line at start time, so the task
   *  list and completion log read correctly without a scenario lookup. */
  crsLabel?: string;
  crsDoneMessage?: string;
  // ---- BA Entry Control Board (ba_sar only) ------------------------------
  /** Entry-point label, e.g. "EP1" / "Front door" / "Stairwell A". */
  entryPoint?: string;
  /** Free-text remarks written on the board at entry time. */
  baRemarks?: string;
  /** Starting cylinder pressure in bar for each BA wearer (crewId → bar).
   *  Real UK sets: full 300 bar twin-cylinder ≈ 2 × 6.8L = 4080L of air;
   *  simpler single 300 bar 6.8L ≈ 2040L. We default wearers to 300 bar. */
  baStartPressure?: Record<string, number>;
  /** Current cylinder pressure in bar (crewId → bar), ticked down over time. */
  baPressure?: Record<string, number>;
  /** Epoch ms each wearer committed — used to time the entry stamp. */
  baEntryAt?: Record<string, number>;
  /** Time-of-Whistle: epoch ms each wearer must be recalled by.
   *  Calculated at entry as entryAt + workingDurationSec(startPressure). */
  baWhistleAt?: Record<string, number>;
  /** Entry Control Officer crew id (firefighter running the board). */
  entryControlOfficerId?: string;
};

/** Default minimum crew required for each task kind. */
export const TASK_MIN_CREW: Record<TaskKind, number> = {
  survey: 1,
  gain_entry: 2,
  connect_hydrant: 1,
  relay_hose: 1,
  hose_attack: 2,
  ba_sar: 2,
  commander: 1,
  kit_grab: 1,
  mitigate_hazard: 1,
  deploy_stabilisers: 1,
  extend_platform: 1,
  aerial_rescue: 2,
  aerial_monitor: 1,
  rtc_extrication: 4, // cutters + spreaders + chocks + glass = 7 hands
  rope_rescue: 2,
  water_rescue: 2,
  wildfire_beating: 2,
  wildfire_knapsack: 1,
  firebreak: 2,
  cordon: 2,
  traffic_mgmt: 1,
  close_carriageway: 1,
  close_road: 2,
  scene_preservation: 1,
  triage_sieve: 1,
  extract_casualty: 2,
  crs_action: 1, // per-action minimums come from the CrsAction itself
};

/** Which service(s) may perform this task kind. `commander` and `survey` are
 *  cross-service — an IC can come from any service — everything else is
 *  gated so fire crews don't see ambulance tasks and vice versa. */
export const TASK_SERVICES: Record<TaskKind, import("./types").ServiceCode[]> = {
  survey: ["Fire", "Ambulance", "Police"],
  commander: ["Fire", "Ambulance", "Police"],
  kit_grab: ["Fire", "Ambulance"],
  gain_entry: ["Fire"],
  connect_hydrant: ["Fire"],
  relay_hose: ["Fire"],
  hose_attack: ["Fire"],
  ba_sar: ["Fire"],
  mitigate_hazard: ["Fire"],
  deploy_stabilisers: ["Fire"],
  extend_platform: ["Fire"],
  aerial_rescue: ["Fire"],
  aerial_monitor: ["Fire"],
  rtc_extrication: ["Fire"],
  rope_rescue: ["Fire"],
  water_rescue: ["Fire"],
  wildfire_beating: ["Fire"],
  wildfire_knapsack: ["Fire"],
  firebreak: ["Fire"],
  cordon: ["Police"],
  traffic_mgmt: ["Police"],
  close_carriageway: ["Police"],
  close_road: ["Police"],
  scene_preservation: ["Police"],
  triage_sieve: ["Ambulance"],
  extract_casualty: ["Fire"],
  crs_action: ["Fire"],
};

/** BA Entry Control Board — working-duration table.
 *  Figures are the "safe working duration" (minutes) a wearer should plan
 *  for at a given starting cylinder pressure, matching the Dräger table
 *  pinned to UK BA control boards:
 *    300 bar → 35 min    250 → 30 min
 *    200 bar → 30 min    190 → 28 min
 *    180 bar → 28 min    170 → 26 min
 *    160 bar → 26 min    … reduced if hard work.
 *  For pressures between table rows we linear-interpolate. Twin-cylinder
 *  (4080L) sets roughly double the single-cylinder duration. */
export function baWorkingDurationMin(startBar: number, twinCylinder = false): number {
  const table: [number, number][] = [
    [300, 35],
    [250, 30],
    [200, 30],
    [190, 28],
    [180, 28],
    [170, 26],
    [160, 26],
  ];
  const clamped = Math.max(50, Math.min(300, startBar));
  let mins = 5;
  for (let i = 0; i < table.length - 1; i++) {
    const [p1, m1] = table[i];
    const [p2, m2] = table[i + 1];
    if (clamped <= p1 && clamped >= p2) {
      const frac = (p1 - clamped) / (p1 - p2 || 1);
      mins = m1 + (m2 - m1) * frac;
      break;
    }
  }
  if (clamped < 160) mins = Math.max(5, 26 - ((160 - clamped) / 30) * 10);
  return Math.round((twinCylinder ? mins * 2 : mins) * 10) / 10;
}

/** Pressure-drop rate (bar/minute) while a BA wearer is committed.
 *  Based on 40 L/min consumption, 6.8 L cylinder → ~5.9 bar/min at work
 *  rate. We round to 6 bar/min for simplicity. */
export const BA_BAR_PER_MINUTE = 6;

/**
 * Walk the supply graph to determine whether an appliance currently has a
 * water-supply chain that terminates at a hydrant. Returns true for direct
 * hydrant connections and for any chain of relay_hose tasks that eventually
 * reaches one.
 */
export function hasWaterSupplyChain(applianceId: string, tasks: Task[]): boolean {
  return rootWaterSource(applianceId, tasks).type === "hydrant";
}

/**
 * Walk the supply graph and return the ultimate water source for this
 * appliance. One of:
 *   • `hydrant` — relay chain terminates at a live hydrant; tank never
 *     depletes from consumption (infinite supply).
 *   • `tank` — the chain terminates at a pump's own tank (its own or a
 *     relay source that isn't itself hydrant-backed). That tank is what
 *     actually depletes when consumers draw water from this appliance.
 *   • `none` — there's no water pathway at all (no hydrant, no relay,
 *     and no tank water on this appliance).
 */
export function rootWaterSource(
  applianceId: string,
  tasks: Task[],
):
  | { type: "hydrant" }
  | { type: "tank"; applianceId: string }
  | { type: "none" } {
  const seen = new Set<string>();
  const stack = [applianceId];
  // The "deepest" relay-source we've seen — if no hydrant is found, the
  // tank that ultimately supplies the chain is this one.
  let deepest = applianceId;
  while (stack.length > 0) {
    const cur = stack.pop()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    // Direct hydrant?
    if (
      tasks.some(
        (t) => t.kind === "connect_hydrant" && t.state !== "aborted" && t.applianceId === cur,
      )
    ) {
      return { type: "hydrant" };
    }
    for (const t of tasks) {
      if (t.kind !== "relay_hose" || t.state === "aborted") continue;
      if (t.applianceId === cur && t.sourceApplianceId) {
        deepest = t.sourceApplianceId;
        stack.push(t.sourceApplianceId);
      }
    }
  }
  return { type: "tank", applianceId: deepest };
}

/** Flow rate in litres-per-minute for the hoses the sim knows about.
 *  Values sit at the realistic-working-jet end of UK doctrine:
 *  45mm hand line ≈ 450 L/min (standard interior / initial attack),
 *  70mm trunk ≈ 900 L/min (exterior defensive / trunk for monitor /
 *  relay supply), LDH 150mm ≈ 2500 L/min (high-volume relay only).
 *  Fast-attack reels are a low-volume rapid response — ~150 L/min, good
 *  for 2–3 minutes of knock-down before a proper line is laid. */
export const HOSE_FLOW_LPM: Record<HoseType, number> = {
  "45mm": 450,
  "70mm": 900,
  LDH_150mm: 2500,
};

/** Flow rate for a fast-attack reel (not strictly a HoseType — it runs
 *  from a small-bore pre-connected reel rather than a laid-out delivery
 *  line). */
export const FAST_ATTACK_FLOW_LPM = 150;

/** Default flow for a BA-committed interior attack when the task didn't
 *  specify a hose type — crews interior would typically take a 45mm. */
export const INTERIOR_BA_DEFAULT_FLOW_LPM = HOSE_FLOW_LPM["45mm"];

// Scoring output produced when the operator resolves the incident.
export type OutcomeMetric = {
  label: string;
  target: string;
  actual: string;
  passed: boolean | "partial";
};

export type IncidentOutcome = {
  metrics: OutcomeMetric[];
  passedCount: number;
  totalCount: number;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
};
