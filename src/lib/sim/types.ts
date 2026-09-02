// Core sim types for The Watch Room.
// Status codes are real UK fire service mobilising codes.

export type AreaCode = "Southern" | "Eastern" | "Western" | "ForceWide";

export type ServiceCode = "Fire" | "Ambulance" | "Police";

export type ApplianceTypeCode =
  // Fire (GMFRS)
  | "WrL" | "WrT" | "L6P" | "TL" | "HLP"
  | "WIU" | "ICU" | "CSU" | "OSU" | "FIU"
  | "BASU" | "BFU" | "SACU" | "WU" | "WFU"
  | "ATV"
  | "HLL" | "PM"
  | "TRU_pump" | "TRU_van" | "USAR" | "SDU" | "DIM"
  // Ambulance (NWAS)
  | "DCA" | "RRV" | "HEMS" | "BASICS"
  | "QR" | "OD" | "CCC"
  // HART (Trafford Park). Vehicle roles are NWAS's own, from FOI24477
  // (9 Apr 2025); the register behind them is FOI24474 (14 Apr 2025).
  // HART_vehicle is the Incident Response Unit and NWAS_IRU the
  // multi-casualty vehicle — both kept under their original codes because
  // scenarios 06 and 09 mobilise HART_vehicle by name.
  | "HART_vehicle" | "NWAS_IRU"
  | "HART_PCV" | "HART_ORIRU" | "HART_ATV" | "HART_carrier" | "HART_RRV"
  // Police (GMP)
  | "Police_Response"   // single-crew response car
  | "Police_ARV"        // Armed Response Vehicle (typically 3-crew)
  | "Police_NPAS"       // National Police Air Service helicopter
  | "Police_Dog"        // Dog unit — PD handler + specialist dog
  | "Police_TraffMot"   // Roads policing motorbike
  | "Police_RPU"        // Roads policing car — closures, ANPR, collision scene
  | "Police_Search"     // POLSA-led specialist search team
  | "Police_SIO";       // Senior Investigating Officer car

export type PodTypeCode = "EPU" | "HVP" | "HVHL" | "UTC" | "MDU";

/** Vehicle-mounted capability flags from the fleet reference — UHPL
 *  (Ultra High Pressure Lance / cold-cut) on roughly half the pumps,
 *  HRET (High Reach Extendable Turret) on Salford's P1. */
export type ApplianceCapability = "UHPL" | "HRET";

/** Non-specialist front-line types — a generic pump or a regular double-
 *  crewed ambulance / RRV. Anything outside this set counts as a specialist
 *  asset (aerial, TRU, HART, USAR, HVP, BFU, HEMS, CCC, etc.) and should
 *  be mobilisable force-wide, even if the station sits outside the
 *  operator's chosen patch. */
const FRONTLINE_TYPES = new Set<ApplianceTypeCode>([
  "WrL",
  "DCA",
  "RRV",
  "Police_Response",
]);

/** Whether an appliance type counts as a specialist resource for dispatch
 *  purposes. Drives the "out-of-patch specialist mobilise" rule in the
 *  dashboard — specialists show up in the dispatch list regardless of
 *  patch, generic pumps / DCAs do not. */
export function isSpecialistAppliance(type: ApplianceTypeCode): boolean {
  return !FRONTLINE_TYPES.has(type);
}

export type StatusCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const STATUS_LABELS: Record<StatusCode, string> = {
  1: "Mobile to incident",
  2: "In attendance",
  3: "Stop message sent",
  4: "Returning to station",
  5: "At hospital",
  6: "Mobile and available",
  7: "Available at station",
  8: "Off the run",
};

export type ApplianceType = {
  fullName: string;
  callsignCategory: string;
  /** Ordered real (or sim-synthetic) designators per unit of this type at a station. */
  designators?: string[];
  crew: { min: number; max: number };
  waterLitres: number;
  kit: string[];
};

export type PodType = {
  fullName: string;
  kit: string[];
};

export type Station = {
  id: string;          // "G50" for fire, "A-BOL" for ambulance
  name: string;        // "Bolton Central"
  area: AreaCode;
  service: ServiceCode;
  staffing?: string;
  address?: string;
  town?: string;
  postcode?: string;
  coords: { lat: number; lng: number };
  notes?: string;
  closedSince2021?: boolean;
  coordsApproximate?: boolean; // true when coords are a town-centre approximation
  ptsOnly?: boolean;            // Patient Transport Service only — no 999 resources
  /** Podded equipment kept at this station (carried by PM appliances). */
  availablePods?: PodTypeCode[];
};

export type CrewMember = {
  id: string;          // stable per appliance + position
  name: string;        // "J. Shaw"
  role: string;        // "Paramedic", "Firefighter", "Doctor", "Pilot", "Advanced Paramedic", …
  quals: string[];     // e.g. ["HCPC Paramedic", "ALS", "Mentor"]
  yearsService: number;
};

export type Appliance = {
  id: string;          // "G50-P1"
  callsign: string;    // "50P1" for fire, "A-547" for NWAS DCA
  stationId: string;
  service: ServiceCode;
  type: ApplianceTypeCode;
  typeName: string;
  podType?: PodTypeCode;
  /** UHPL / HRET fits carried by this specific vehicle. */
  capabilities?: ApplianceCapability[];     // if this is a PM carrying a pod
  status: StatusCode;
  crew: { current: number; min: number; max: number };
  crewMembers: CrewMember[];
  waterLitres: number;
  kit: string[];
  note?: string;

  // Vehicle detail — generated once at build time and persisted in state.
  make: string;        // e.g. "Volvo FL"
  model: string;       // e.g. "Pump Ladder"
  vrm: string;         // UK VRM, e.g. "VX26 ABC"
  fuelPct: number;     // 0–100
  waterPct: number;    // 0–100 (mirrors waterLitres; 100 until consumed)
  conditionPct: number; // 0–100, drops with use, restored by maintenance
};
