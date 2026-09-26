import type { Scenario, ScenarioMeta } from "../incident_types";
import { SCENARIO_META } from "./meta";

// The client-safe face of the scenario registry. index.ts holds every
// body in one static list for the server pages and the sim checks; the
// desk imports THIS module instead, so the first download carries only
// the generated meta, and a job's call script, informant script, scene
// and records arrive when that job is queued.
//
// One dynamic import per scenario, keyed by id, so Next splits each
// body into its own chunk. `node tools/sim-check/run.cjs meta` checks
// that every scenario in index.ts has a loader here that resolves to it.
export const SCENARIO_LOADERS: Record<string, () => Promise<Scenario>> = {
  "01": () => import("./01_afa_agecroft").then((m) => m.scenario01),
  "02": () => import("./02_dwelling_fire_wythenshawe").then((m) => m.scenario02),
  "03": () => import("./03_rtc_m60_entrapment").then((m) => m.scenario03),
  "04": () => import("./04_industrial_trafford_park").then((m) => m.scenario04),
  "05": () => import("./05_wildfire_saddleworth").then((m) => m.scenario05),
  "06": () => import("./06_chemical_stockport_rail").then((m) => m.scenario06),
  "07": () => import("./07_high_rise_salford_quays").then((m) => m.scenario07),
  "08": () => import("./08_school_bury").then((m) => m.scenario08),
  "09": () => import("./09_water_rescue_irwell").then((m) => m.scenario09),
  "10": () => import("./10_hospital_royal_bolton").then((m) => m.scenario10),
  "11": () => import("./11_firearms_ashton").then((m) => m.scenario11),
  "12": () => import("./12_cardiac_arrest_hough_end").then((m) => m.scenario12),
  "13": () => import("./13_fall_elderly_withington").then((m) => m.scenario13),
  "14": () => import("./14_lift_release_piccadilly").then((m) => m.scenario14),
  "15": () => import("./15_car_fire_a627m").then((m) => m.scenario15),
  "16": () => import("./16_effecting_entry_farnworth").then((m) => m.scenario16),
  "17": () => import("./17_chest_pain_bury").then((m) => m.scenario17),
  "18": () => import("./18_transfer_oldham").then((m) => m.scenario18),
  "19": () => import("./19_skip_fire_gorton").then((m) => m.scenario19),
  "20": () => import("./20_gas_leak_wigan").then((m) => m.scenario20),
  "21": () => import("./21_chimney_fire_marple").then((m) => m.scenario21),
  "22": () => import("./22_mental_health_stockport").then((m) => m.scenario22),
  "23": () => import("./23_hmo_fire_rusholme").then((m) => m.scenario23),
  "24": () => import("./24_ev_fire_sale").then((m) => m.scenario24),
  "25": () => import("./25_farm_fire_ramsbottom").then((m) => m.scenario25),
  "26": () => import("./26_flooding_littleborough").then((m) => m.scenario26),
  "27": () => import("./27_rope_rescue_healey").then((m) => m.scenario27),
  "28": () => import("./28_co_exposure_hyde").then((m) => m.scenario28),
  "29": () => import("./29_maternity_wythenshawe").then((m) => m.scenario29),
  "30": () => import("./30_overdose_leigh").then((m) => m.scenario30),
  "31": () => import("./31_stroke_stockport").then((m) => m.scenario31),
  "32": () => import("./32_anaphylaxis_altrincham").then((m) => m.scenario32),
  "33": () => import("./33_diabetic_urmston").then((m) => m.scenario33),
  "34": () => import("./34_major_trauma_salford").then((m) => m.scenario34),
  "35": () => import("./35_assault_ashton").then((m) => m.scenario35),
  "36": () => import("./36_hcp_admission_middleton").then((m) => m.scenario36),
  "37": () => import("./37_choking_cheadle").then((m) => m.scenario37),
  "38": () => import("./38_breathing_philips_park").then((m) => m.scenario38),
  "39": () => import("./39_domestic_harpurhey").then((m) => m.scenario39),
  "40": () => import("./40_burglary_bramhall").then((m) => m.scenario40),
  "41": () => import("./41_fight_deansgate_locks").then((m) => m.scenario41),
  "42": () => import("./42_pursuit_hyde_road").then((m) => m.scenario42),
  "43": () => import("./43_missing_child_heaton_park").then((m) => m.scenario43),
  "44": () => import("./44_robbery_piccadilly_gardens").then((m) => m.scenario44),
  "45": () => import("./45_welfare_salford_precinct").then((m) => m.scenario45),
  "46": () => import("./46_anpr_hit_a580").then((m) => m.scenario46),
  "47": () => import("./47_shoplifter_trafford_centre").then((m) => m.scenario47),
  "48": () => import("./48_rtc_barton_road_stretford").then((m) => m.scenario48),
  "49": () => import("./49_sudden_death_sale").then((m) => m.scenario49),
  "50": () => import("./50_drink_driver_bury").then((m) => m.scenario50),
  "51": () => import("./51_neighbour_dispute_rochdale").then((m) => m.scenario51),
  "52": () => import("./52_mental_health_rcrp_oldham").then((m) => m.scenario52),
  "53": () => import("./53_abandoned_999_wigan").then((m) => m.scenario53),
  "54": () => import("./54_asb_youths_denton").then((m) => m.scenario54),
  "55": () => import("./55_vehicle_stop_sale").then((m) => m.scenario55),
};

const inflight = new Map<string, Promise<Scenario>>();

/** The full scenario for an id, fetched on first use and shared after.
 *  Rejects for an id that is not a scenario. */
export function loadScenario(id: string): Promise<Scenario> {
  const known = inflight.get(id);
  if (known) return known;
  const load = SCENARIO_LOADERS[id];
  if (!load) return Promise.reject(new Error(`No scenario with id "${id}"`));
  const p = load().catch((err: unknown) => {
    // A failed fetch must not poison the id — the next call retries.
    inflight.delete(id);
    throw err;
  });
  inflight.set(id, p);
  return p;
}

/** The light face of a scenario, from the generated index. */
export function scenarioMeta(id: string): ScenarioMeta | undefined {
  return SCENARIO_META.find((s) => s.id === id);
}
