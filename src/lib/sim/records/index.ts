// Every scenario's people, vehicles and places, for the desk's search.
// Authored per scenario alongside the scenario itself; see ../records.ts
// for the model and the house rules (fictional people, real street and
// fictional number, phone numbers in the Ofcom drama range).

import type { RecordSet } from "../records";
import { records01 } from "./01_afa_trafford_centre";
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
];
