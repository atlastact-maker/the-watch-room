import type { Scenario } from "../incident_types";
import { scenario01 } from "./01_afa_trafford_centre";
import { scenario02 } from "./02_dwelling_fire_wythenshawe";
import { scenario03 } from "./03_rtc_m60_entrapment";
import { scenario04 } from "./04_industrial_trafford_park";
import { scenario05 } from "./05_wildfire_saddleworth";
import { scenario06 } from "./06_chemical_stockport_rail";
import { scenario07 } from "./07_high_rise_salford_quays";
import { scenario08 } from "./08_school_bury";
import { scenario09 } from "./09_water_rescue_irwell";
import { scenario10 } from "./10_hospital_royal_bolton";
import { scenario11 } from "./11_firearms_ashton";
import { scenario12 } from "./12_cardiac_arrest_hough_end";

// Registry of available scenarios — the ten approved fire jobs converted
// from data/research/fire/scenarios/*.md, plus the police-led firearms
// job and the ambulance-led arrest.
export const SCENARIOS: Scenario[] = [
  scenario01,
  scenario02,
  scenario03,
  scenario04,
  scenario05,
  scenario06,
  scenario07,
  scenario08,
  scenario09,
  scenario10,
  scenario11,
  scenario12,
];

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
