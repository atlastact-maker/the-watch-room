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
import { scenario31 } from "./31_stroke_stockport";
import { scenario32 } from "./32_anaphylaxis_altrincham";
import { scenario33 } from "./33_diabetic_urmston";
import { scenario34 } from "./34_major_trauma_salford";
import { scenario35 } from "./35_assault_ashton";
import { scenario36 } from "./36_hcp_admission_middleton";
import { scenario37 } from "./37_choking_cheadle";
import { scenario38 } from "./38_breathing_philips_park";
import { scenario39 } from "./39_domestic_harpurhey";
import { scenario40 } from "./40_burglary_bramhall";
import { scenario41 } from "./41_fight_deansgate_locks";
import { scenario42 } from "./42_pursuit_hyde_road";
import { scenario43 } from "./43_missing_child_heaton_park";
import { scenario44 } from "./44_robbery_piccadilly_gardens";
import { scenario45 } from "./45_welfare_salford_precinct";
import { scenario46 } from "./46_anpr_hit_a580";
import { scenario47 } from "./47_shoplifter_trafford_centre";
import { scenario48 } from "./48_rtc_barton_road_stretford";
import { scenario49 } from "./49_sudden_death_sale";
import { scenario50 } from "./50_drink_driver_bury";
import { scenario51 } from "./51_neighbour_dispute_rochdale";
import { scenario52 } from "./52_mental_health_rcrp_oldham";
import { scenario53 } from "./53_abandoned_999_wigan";
import { scenario54 } from "./54_asb_youths_denton";

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
  scenario31,
  scenario32,
  scenario33,
  scenario34,
  scenario35,
  scenario36,
  scenario37,
  scenario38,
  scenario39,
  scenario40,
  scenario41,
  scenario42,
  scenario43,
  scenario44,
  scenario45,
  scenario46,
  scenario47,
  scenario48,
  scenario49,
  scenario50,
  scenario51,
  scenario52,
  scenario53,
  scenario54,
];

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
