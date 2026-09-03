// Maps every appliance type code to a user-facing category. Used by the
// resources panel and the deployment UI to group fleet by purpose rather
// than by station.
//
// Naming rule:
// - Fire pumps are called "appliances" (the conventional word).
// - Everything else is a "vehicle" in copy.

import type { ApplianceTypeCode, ServiceCode } from "./types";

export type VehicleCategory =
  // Fire (GMFRS)
  | "fire_appliances"
  | "fire_aerial"
  | "fire_rescue"
  | "fire_specialist"
  | "fire_command"
  | "fire_support"
  // Ambulance (NWAS)
  | "amb_ambulances"
  | "amb_response"
  | "amb_specialist"
  | "amb_critical_care"
  // Police (GMP)
  | "pol_response"
  | "pol_armed"
  | "pol_air"
  | "pol_specialist"
  | "pol_command";

const TYPE_TO_CATEGORY: Record<ApplianceTypeCode, VehicleCategory> = {
  // Fire pumps — the canonical "appliances".
  WrL: "fire_appliances",
  WrT: "fire_appliances",
  L6P: "fire_appliances",
  ATV: "fire_appliances",
  // Aerial.
  TL: "fire_aerial",
  HLP: "fire_aerial",
  // Rescue.
  TRU_pump: "fire_rescue",
  TRU_van: "fire_rescue",
  USAR: "fire_rescue",
  SDU: "fire_rescue",
  // Specialist environment / detection.
  WIU: "fire_specialist",
  WFU: "fire_specialist",
  DIM: "fire_specialist",
  // Command + investigation.
  ICU: "fire_command",
  CSU: "fire_command",
  OSU: "fire_command",
  FIU: "fire_command",
  // Logistics / welfare / carriers.
  BASU: "fire_support",
  BFU: "fire_support",
  SACU: "fire_support",
  WU: "fire_support",
  HLL: "fire_support",
  PM: "fire_support",
  // NWAS.
  DCA: "amb_ambulances",
  RRV: "amb_response",
  QR: "amb_response",
  OD: "amb_response",
  HART_vehicle: "amb_specialist",
  NWAS_IRU: "amb_specialist",
  HART_PCV: "amb_specialist",
  HART_ORIRU: "amb_specialist",
  HART_ATV: "amb_specialist",
  HART_carrier: "amb_specialist",
  HART_RRV: "amb_specialist",
  HEMS: "amb_critical_care",
  BASICS: "amb_critical_care",
  RCV: "fire_support",
  MTA: "fire_specialist",
  CCC: "amb_critical_care",
  UCA: "amb_ambulances",
  CYC: "amb_response",
  DUTY_OFF: "amb_response",
  CHAP: "amb_response",
  MIV: "amb_specialist",
  MERIT: "amb_critical_care",
  TAC_CMD: "amb_response",
  STRAT_CMD: "amb_response",
  TAC_ADV: "amb_response",
  CFR: "amb_response",
  STAFF_RESP: "amb_response",
  // GMP.
  Police_Response: "pol_response",
  Police_TraffMot: "pol_response",
  Police_RPU: "pol_response",
  Police_ARV: "pol_armed",
  Police_NPAS: "pol_air",
  Police_Dog: "pol_specialist",
  Police_Search: "pol_specialist",
  Police_SIO: "pol_command",
};

export function categoryOf(type: ApplianceTypeCode): VehicleCategory {
  return TYPE_TO_CATEGORY[type] ?? "pol_response";
}

export type CategoryDef = {
  key: VehicleCategory;
  service: ServiceCode;
  label: string;
};

const ALL_CATEGORIES: CategoryDef[] = [
  { key: "fire_appliances", service: "Fire", label: "Appliances" },
  { key: "fire_aerial", service: "Fire", label: "Aerial" },
  { key: "fire_rescue", service: "Fire", label: "Rescue" },
  { key: "fire_specialist", service: "Fire", label: "Specialist" },
  { key: "fire_command", service: "Fire", label: "Command" },
  { key: "fire_support", service: "Fire", label: "Support" },
  { key: "amb_ambulances", service: "Ambulance", label: "Ambulances" },
  { key: "amb_response", service: "Ambulance", label: "Response" },
  { key: "amb_specialist", service: "Ambulance", label: "HART / IRU" },
  { key: "amb_critical_care", service: "Ambulance", label: "Critical Care" },
  { key: "pol_response", service: "Police", label: "Response" },
  { key: "pol_armed", service: "Police", label: "Armed Response" },
  { key: "pol_air", service: "Police", label: "Air Support" },
  { key: "pol_specialist", service: "Police", label: "Dog / Search" },
  { key: "pol_command", service: "Police", label: "SIO / CID" },
];

export function categoriesForService(service: ServiceCode): CategoryDef[] {
  return ALL_CATEGORIES.filter((c) => c.service === service);
}

/** Word for a single unit, given its service. Fire → "appliance", else "vehicle". */
export function unitNoun(service: ServiceCode, plural = false): string {
  if (service === "Fire") return plural ? "appliances" : "appliance";
  return plural ? "vehicles" : "vehicle";
}

/** Short brand label per service — used in the service tabs. */
export const SERVICE_LABEL: Record<ServiceCode, string> = {
  Fire: "Fire & Rescue",
  Ambulance: "Ambulance",
  Police: "Police",
};
