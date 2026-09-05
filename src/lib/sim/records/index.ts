// Every scenario's people, vehicles and places, for the desk's search.
// Authored per scenario alongside the scenario itself; see ../records.ts
// for the model and the house rules (fictional people, real street and
// fictional number, phone numbers in the Ofcom drama range).

import type { RecordSet } from "../records";
import { records01 } from "./01_afa_agecroft";
import { records02 } from "./02_dwelling_fire_wythenshawe";
import { records03 } from "./03_rtc_m60_entrapment";
import { records04 } from "./04_industrial_trafford_park";
import { records05 } from "./05_wildfire_saddleworth";
import { records06 } from "./06_chemical_stockport_rail";
import { records07 } from "./07_high_rise_salford_quays";
import { records08 } from "./08_school_bury";
import { records09 } from "./09_water_rescue_irwell";
import { records10 } from "./10_hospital_royal_bolton";
import { records11 } from "./11_firearms_ashton";
import { records12 } from "./12_cardiac_arrest_hough_end";
import { records13to16 } from "./13_16_volume";
import { records39 } from "./39_domestic_harpurhey";
import { records40 } from "./40_burglary_bramhall";
import { records41 } from "./41_fight_deansgate_locks";
import { records42 } from "./42_pursuit_hyde_road";
import { records43 } from "./43_missing_child_heaton_park";
import { records44 } from "./44_robbery_piccadilly_gardens";
import { records45 } from "./45_welfare_salford_precinct";
import { records46 } from "./46_anpr_hit_a580";
import { records47 } from "./47_shoplifter_trafford_centre";
import { records48 } from "./48_rtc_barton_road_stretford";
import { records49 } from "./49_sudden_death_sale";
import { records50 } from "./50_drink_driver_bury";
import { records51 } from "./51_neighbour_dispute_rochdale";
import { records52 } from "./52_mental_health_rcrp_oldham";
import { records53 } from "./53_abandoned_999_wigan";
import { records54 } from "./54_asb_youths_denton";

export const SCENARIO_RECORDS: RecordSet[] = [
  records01,
  records02,
  records03,
  records04,
  records05,
  records06,
  records07,
  records08,
  records09,
  records10,
  records11,
  records12,
  // The volume jobs ship as a set — each holds a handful of people
  // rather than a casualty board, so one file carries all four.
  ...records13to16,
  // Police volume jobs, one file each.
  records39,
  records40,
  records41,
  records42,
  records43,
  records44,
  records45,
  records46,
  records47,
  records48,
  records49,
  records50,
  records51,
  records52,
  records53,
  records54,
];
