// Opening codes — what the call handler keys the job as at the moment it
// is created. Each service has its own list, and each is the one the real
// control rooms use:
//
//   Police     NICL — the National Incident Category List from the National
//              Standard for Incident Recording. Five top-level categories
//              (Crime, Anti-social behaviour, Public safety & welfare,
//              Transport, Administration) and the opening categories under
//              them. The short codes here are the sim's own, laid out the
//              way a force CAD does it (letter for the category, number
//              for the opening code); the category names and the opening
//              categories are the NICL ones.
//   Fire       IRS incident types — the Incident Recording System headings
//              a fire control mobilises against: primary fire, secondary
//              fire, chimney, false alarm, special service.
//   Ambulance  AMPDS chief-complaint cards — the card numbers the triage
//              protocol puts a call on (card 9 is cardiac arrest, 10 chest
//              pain, 17 falls, and so on).
//
// A scenario's nature (IncidentTypeCode) maps to one canonical code and,
// where a call could reasonably open under a neighbour, a set of accepted
// ones. The debrief compares what was keyed against that set.

import type { IncidentTypeCode } from "./incident_types";
import type { ServiceCode } from "./types";

export type OpeningCode = {
  code: string;
  label: string;
  /** The top-level category the code sits under. */
  group: string;
};

export const OPENING_SCHEME: Record<ServiceCode, { name: string; short: string }> = {
  Police: { name: "National Incident Category List", short: "NICL" },
  Fire: { name: "IRS incident type", short: "IRS" },
  Ambulance: { name: "AMPDS chief complaint", short: "AMPDS" },
};

const POLICE: OpeningCode[] = [
  // Crime
  { code: "C01", label: "Violence against the person", group: "Crime" },
  { code: "C02", label: "Sexual offences", group: "Crime" },
  { code: "C03", label: "Robbery", group: "Crime" },
  { code: "C04", label: "Burglary — residential", group: "Crime" },
  { code: "C05", label: "Burglary — business and community", group: "Crime" },
  { code: "C06", label: "Theft of motor vehicle", group: "Crime" },
  { code: "C07", label: "Theft from motor vehicle", group: "Crime" },
  { code: "C08", label: "Theft — shoplifting", group: "Crime" },
  { code: "C09", label: "Theft — other", group: "Crime" },
  { code: "C10", label: "Criminal damage and arson", group: "Crime" },
  { code: "C11", label: "Drugs", group: "Crime" },
  { code: "C12", label: "Possession of weapons", group: "Crime" },
  { code: "C13", label: "Public order", group: "Crime" },
  { code: "C14", label: "Fraud and forgery", group: "Crime" },
  { code: "C15", label: "Harassment / malicious communications", group: "Crime" },
  // Anti-social behaviour
  { code: "A01", label: "ASB — personal", group: "Anti-social behaviour" },
  { code: "A02", label: "ASB — nuisance", group: "Anti-social behaviour" },
  { code: "A03", label: "ASB — environmental", group: "Anti-social behaviour" },
  // Public safety and welfare
  { code: "P01", label: "Abandoned call", group: "Public safety and welfare" },
  { code: "P02", label: "Alarm — intruder / panic", group: "Public safety and welfare" },
  { code: "P03", label: "Animals", group: "Public safety and welfare" },
  { code: "P04", label: "Concern for safety", group: "Public safety and welfare" },
  { code: "P05", label: "Domestic incident", group: "Public safety and welfare" },
  { code: "P06", label: "Firearms", group: "Public safety and welfare" },
  { code: "P07", label: "Hoax call", group: "Public safety and welfare" },
  { code: "P08", label: "Industrial incident / accident", group: "Public safety and welfare" },
  { code: "P09", label: "Licensing", group: "Public safety and welfare" },
  { code: "P10", label: "Missing person", group: "Public safety and welfare" },
  { code: "P11", label: "Absconder / AWOL / wanted", group: "Public safety and welfare" },
  { code: "P12", label: "Protest / demonstration", group: "Public safety and welfare" },
  { code: "P13", label: "Sudden death", group: "Public safety and welfare" },
  { code: "P14", label: "Suspicious package", group: "Public safety and welfare" },
  { code: "P15", label: "Suspicious circumstances", group: "Public safety and welfare" },
  { code: "P16", label: "Civil dispute", group: "Public safety and welfare" },
  { code: "P17", label: "Immigration", group: "Public safety and welfare" },
  { code: "P18", label: "Mental health", group: "Public safety and welfare" },
  { code: "P19", label: "Police generated resource activity", group: "Public safety and welfare" },
  { code: "P20", label: "Community safety / reassurance", group: "Public safety and welfare" },
  { code: "P21", label: "Assist other agency", group: "Public safety and welfare" },
  // Transport
  { code: "T01", label: "Road related traffic offence", group: "Transport" },
  { code: "T02", label: "Fail to stop / pursuit", group: "Transport" },
  { code: "T03", label: "Road traffic collision — injury", group: "Transport" },
  { code: "T04", label: "Road traffic collision — damage only", group: "Transport" },
  { code: "T05", label: "Highway disruption", group: "Transport" },
  { code: "T06", label: "Rail / air / marine incident", group: "Transport" },
  { code: "T07", label: "Abandoned vehicle / recovery", group: "Transport" },
  // Administration
  { code: "X01", label: "Messages", group: "Administration" },
  { code: "X02", label: "Contact record", group: "Administration" },
  { code: "X03", label: "PNC / intelligence check", group: "Administration" },
  { code: "X04", label: "Duplicate", group: "Administration" },
  { code: "X05", label: "Test", group: "Administration" },
];

const FIRE: OpeningCode[] = [
  { code: "F01", label: "Primary fire — dwelling", group: "Fire" },
  { code: "F02", label: "Primary fire — dwelling, persons reported", group: "Fire" },
  { code: "F03", label: "Primary fire — other building", group: "Fire" },
  { code: "F04", label: "Primary fire — road vehicle", group: "Fire" },
  { code: "F05", label: "Primary fire — other outdoor", group: "Fire" },
  { code: "F06", label: "Secondary fire — refuse / grassland", group: "Fire" },
  { code: "F07", label: "Chimney fire", group: "Fire" },
  { code: "F08", label: "AFA — automatic fire alarm", group: "False alarm" },
  { code: "F09", label: "False alarm — good intent", group: "False alarm" },
  { code: "F10", label: "False alarm — malicious", group: "False alarm" },
  { code: "S01", label: "Special service — RTC", group: "Special service" },
  { code: "S02", label: "Special service — effecting entry / exit", group: "Special service" },
  { code: "S03", label: "Special service — lift release", group: "Special service" },
  { code: "S04", label: "Special service — flooding", group: "Special service" },
  { code: "S05", label: "Special service — water rescue", group: "Special service" },
  { code: "S06", label: "Special service — rescue from height", group: "Special service" },
  { code: "S07", label: "Special service — hazardous materials", group: "Special service" },
  { code: "S08", label: "Special service — gas leak", group: "Special service" },
  { code: "S09", label: "Special service — animal rescue", group: "Special service" },
  { code: "S10", label: "Special service — assist other agency", group: "Special service" },
  { code: "S11", label: "Special service — medical / co-responder", group: "Special service" },
  { code: "S12", label: "Special service — making safe / spills", group: "Special service" },
  { code: "S13", label: "Special service — building collapse", group: "Special service" },
];

const AMBULANCE: OpeningCode[] = [
  { code: "01", label: "Abdominal pain", group: "Medical" },
  { code: "02", label: "Allergies / envenomations", group: "Medical" },
  { code: "05", label: "Back pain", group: "Medical" },
  { code: "06", label: "Breathing problems", group: "Medical" },
  { code: "09", label: "Cardiac or respiratory arrest / death", group: "Medical" },
  { code: "10", label: "Chest pain", group: "Medical" },
  { code: "11", label: "Choking", group: "Medical" },
  { code: "12", label: "Convulsions / fitting", group: "Medical" },
  { code: "13", label: "Diabetic problems", group: "Medical" },
  { code: "18", label: "Headache", group: "Medical" },
  { code: "19", label: "Heart problems / AICD", group: "Medical" },
  { code: "26", label: "Sick person", group: "Medical" },
  { code: "28", label: "Stroke (CVA)", group: "Medical" },
  { code: "31", label: "Unconscious / fainting", group: "Medical" },
  { code: "32", label: "Unknown problem (man down)", group: "Medical" },
  { code: "03", label: "Animal bites / attacks", group: "Trauma and environment" },
  { code: "04", label: "Assault / sexual assault", group: "Trauma and environment" },
  { code: "07", label: "Burns / explosion", group: "Trauma and environment" },
  { code: "08", label: "Carbon monoxide / inhalation / hazmat", group: "Trauma and environment" },
  { code: "14", label: "Drowning / diving accident", group: "Trauma and environment" },
  { code: "15", label: "Electrocution", group: "Trauma and environment" },
  { code: "16", label: "Eye problems / injuries", group: "Trauma and environment" },
  { code: "17", label: "Falls", group: "Trauma and environment" },
  { code: "20", label: "Heat / cold exposure", group: "Trauma and environment" },
  { code: "21", label: "Haemorrhage / lacerations", group: "Trauma and environment" },
  { code: "22", label: "Inaccessible incident / entrapment", group: "Trauma and environment" },
  { code: "27", label: "Stab / gunshot / penetrating trauma", group: "Trauma and environment" },
  { code: "29", label: "Traffic / transportation incident", group: "Trauma and environment" },
  { code: "30", label: "Traumatic injuries", group: "Trauma and environment" },
  { code: "23", label: "Overdose / poisoning", group: "Other" },
  { code: "24", label: "Pregnancy / childbirth", group: "Other" },
  { code: "25", label: "Psychiatric / suicide attempt", group: "Other" },
  { code: "33", label: "Transfer / interfacility", group: "Other" },
  { code: "35", label: "HCP admission", group: "Other" },
];

export const OPENING_CODES: Record<ServiceCode, OpeningCode[]> = {
  Police: POLICE,
  Fire: FIRE,
  Ambulance: AMBULANCE,
};

/** The code(s) a job of this nature opens under. The first is the one the
 *  debrief calls canonical; the rest are accepted without comment. */
const EXPECTED: Record<IncidentTypeCode, string[]> = {
  // Fire
  automatic_fire_alarm: ["F08"],
  dwelling_fire_persons_reported: ["F02", "F01"],
  rtc_entrapment: ["S01"],
  industrial_fire: ["F03"],
  wildfire_moorland: ["F05", "F06"],
  hazmat_chemical_leak: ["S07"],
  high_rise_dwelling_fire: ["F02", "F01"],
  education_premises_fire: ["F03"],
  special_service_water_rescue: ["S05"],
  healthcare_premises_fire_alarm: ["F08"],
  special_service_lift_release: ["S03"],
  vehicle_fire: ["F04"],
  special_service_effecting_entry: ["S02"],
  secondary_fire_refuse: ["F06"],
  chimney_fire: ["F07"],
  special_service_gas_leak: ["S08"],
  hmo_fire: ["F02", "F01"],
  vehicle_fire_ev: ["F04"],
  agricultural_fire: ["F03", "F05"],
  special_service_flooding: ["S04"],
  special_service_rope_rescue: ["S06"],
  special_service_co_exposure: ["S07"],
  // Ambulance
  ambulance_cardiac_arrest: ["09"],
  ambulance_fall_elderly: ["17"],
  ambulance_chest_pain: ["10"],
  ambulance_transfer: ["33"],
  ambulance_mental_health: ["25"],
  ambulance_maternity: ["24"],
  ambulance_overdose: ["23"],
  ambulance_stroke: ["28"],
  ambulance_anaphylaxis: ["02", "06"],
  ambulance_breathing: ["06"],
  ambulance_diabetic: ["13"],
  ambulance_major_trauma: ["17", "30"],
  ambulance_assault: ["04", "21", "27"],
  ambulance_hcp_admission: ["35"],
  ambulance_choking: ["11"],
  // Police
  police_firearms_incident: ["P06"],
  police_domestic_in_progress: ["P05"],
  police_burglary_in_progress: ["C04"],
  police_fight_night_time_economy: ["C01", "C13"],
  police_fail_to_stop_pursuit: ["T02", "T01"],
  police_missing_child: ["P10"],
  police_robbery_knife: ["C03"],
  police_concern_for_welfare: ["P04"],
  police_anpr_hit_stolen_vehicle: ["C06", "P11"],
  police_shoplifter_detained: ["C08"],
  police_rtc_damage_only: ["T04"],
  police_sudden_death_expected: ["P13"],
  police_drink_driver: ["T01"],
  police_neighbour_dispute: ["A01", "P16", "A02"],
  police_mental_health_rcrp: ["P18", "P04"],
  police_abandoned_999: ["P01"],
  police_asb_youths: ["A02", "A01"],
  police_vehicle_stop_no_insurance: ["T01", "P19"],
};

export function expectedOpeningCodes(type: IncidentTypeCode): string[] {
  return EXPECTED[type] ?? [];
}

export function openingCodeFor(service: ServiceCode, code: string | null | undefined): OpeningCode | undefined {
  if (!code) return undefined;
  return OPENING_CODES[service].find((c) => c.code === code);
}

/** "P05 Domestic incident" — the way it reads on a log line. */
export function openingCodeLabel(service: ServiceCode, code: string | null | undefined): string {
  const c = openingCodeFor(service, code);
  return c ? `${c.code} ${c.label}` : code ?? "";
}

/** Was the job keyed under a code that fits its nature? */
export function openingCodeFits(type: IncidentTypeCode, code: string | null | undefined): boolean {
  if (!code) return false;
  return expectedOpeningCodes(type).includes(code);
}

/** A short row of quick picks for the call screen: the right code and a
 *  few plausible neighbours, in a stable order for this scenario. The
 *  full list is always a select away; the chips are the ones a handler
 *  reaches for without scrolling. */
export function quickPickOpeningCodes(service: ServiceCode, type: IncidentTypeCode, seed: string): OpeningCode[] {
  const all = OPENING_CODES[service];
  const expected = expectedOpeningCodes(type);
  const canonical = all.find((c) => c.code === expected[0]);
  if (!canonical) return all.slice(0, 5);
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  const rnd = () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 4294967296;
  };
  const shuffle = <T,>(xs: T[]) => {
    const a = xs.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const sameGroup = shuffle(all.filter((c) => c.group === canonical.group && c.code !== canonical.code)).slice(0, 2);
  const others = shuffle(all.filter((c) => c.group !== canonical.group && !c.group.startsWith("Admin"))).slice(0, 2);
  return shuffle([canonical, ...sameGroup, ...others]);
}
