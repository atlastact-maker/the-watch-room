import type { Scenario } from "../incident_types";
import { scenario01 } from "./01_afa_agecroft";
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
import { scenario13 } from "./13_fall_elderly_withington";
import { scenario14 } from "./14_lift_release_piccadilly";
import { scenario15 } from "./15_car_fire_a627m";
import { scenario16 } from "./16_effecting_entry_farnworth";
import { scenario17 } from "./17_chest_pain_bury";
import { scenario18 } from "./18_transfer_oldham";
import { scenario19 } from "./19_skip_fire_gorton";
import { scenario20 } from "./20_gas_leak_wigan";
import { scenario21 } from "./21_chimney_fire_marple";
import { scenario22 } from "./22_mental_health_stockport";
import { scenario23 } from "./23_hmo_fire_rusholme";
import { scenario24 } from "./24_ev_fire_sale";
import { scenario25 } from "./25_farm_fire_ramsbottom";
import { scenario26 } from "./26_flooding_littleborough";
import { scenario27 } from "./27_rope_rescue_healey";
import { scenario28 } from "./28_co_exposure_hyde";
import { scenario29 } from "./29_maternity_wythenshawe";
import { scenario30 } from "./30_overdose_leigh";

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
  scenario13,
  scenario14,
  scenario15,
  scenario16,
  scenario17,
  scenario18,
  scenario19,
  scenario20,
  scenario21,
  scenario22,
  scenario23,
  scenario24,
  scenario25,
  scenario26,
  scenario27,
  scenario28,
  scenario29,
  scenario30,
];

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
