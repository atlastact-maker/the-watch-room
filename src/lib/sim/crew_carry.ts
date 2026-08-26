// What one person can physically carry from the appliance to the scene.
//
// A firefighter in full kit moves roughly 20–25 kg per trip over kerbs,
// barriers and broken glass, and needs a hand free for balance. So the
// model is hands, not kilograms: two hands per person, and the heavy
// hydraulic tools take both.
//
// That single rule is what makes the important thing true — hydraulic
// cutters (18.8–25.0 kg) and spreaders (19.5–24.9 kg) each have one
// central handle on an 800–1000 mm front-heavy body, so nobody carries
// both. Getting a full hydraulic set to the dump is three or four
// firefighters, which is exactly what a UK cutting crew is.
//
// Deliberately abstracted into their tool's single item, because
// modelling them separately turns every rescue into a fetch-quest: the
// hydraulic power unit and hose runs, the airbag controller and air
// supply, the ram's accessory pack, the lighting cable drum, and the
// airline BA trolley. The two_hands class is where that cost is priced.
//
// Tool weights above are published Holmatro Pentheon and Weber figures,
// used as generic — which make and model GMFRS actually run, and
// whether they are battery or hose-fed, is not verified here.

import type { CrewEquipment } from "./incident_types";

/** How an item travels: on the body, in a pocket, or in hands. */
export type CarryClass = "worn" | "pocket" | "one_hand" | "two_hands";

/** Hands available to one person. */
export const HAND_BUDGET = 2;
/** Pouches / belt loops / tally slots. */
export const POCKET_BUDGET = 3;

export const CARRY_CLASS: Record<CrewEquipment, CarryClass> = {
  // --- Firefighting ---
  ba_set: "worn", // ~11–12 kg carbon set, on the back
  branch_45mm: "one_hand",
  branch_70mm: "two_hands", // two-man line
  fast_attack_branch: "one_hand",
  thermal_camera: "one_hand",
  extinguisher: "one_hand", // 9 L water ext ~14 kg, by the handle
  foam_branch: "two_hands", // branch + pickup tube

  // --- Water supply ---
  red_key: "one_hand",
  standpipe: "one_hand", // key in one hand, standpipe in the other

  // --- Method of entry ---
  hali_tool: "one_hand",
  lock_snapper: "one_hand",
  forcible_entry: "two_hands", // retired option; kept so old saves load

  // --- RTC / heavy rescue ---
  hydraulic_cutters: "two_hands", // 18.8–25.0 kg, one central handle
  hydraulic_spreaders: "two_hands", // 19.5–24.9 kg, same
  combi_tool: "two_hands", // 13.7–23.5 kg
  hydraulic_ram: "two_hands", // 14.1–21.5 kg + accessory pack
  airbag_lifting: "one_hand", // bags stacked under one arm
  stabiliser_chocks: "two_hands", // nest of 4–6 step blocks, 12–20 kg
  stab_struts: "two_hands",
  glass_mgmt: "one_hand", // 5–10 kg bag
  spine_board: "two_hands", // not heavy, but 1.8 m and awkward
  ked_extrication: "one_hand", // 2.5–3.5 kg, slung
  reciprocating_saw: "one_hand", // 3.5–4.5 kg + blade wallet
  disc_cutter: "two_hands", // 9.6–11.6 kg, unbalanced
  chainsaw: "one_hand", // 4.9–6.0 kg, scabbard on
  concrete_breaker: "two_hands",
  search_camera: "one_hand",
  area_lighting: "two_hands",
  airline_ba: "worn", // set worn; trolley abstracted
  small_tools: "pocket",

  // --- Rope ---
  rope_kit: "one_hand", // rope bag by the haul loop
  rescue_harness: "worn",
  sked_stretcher: "two_hands",
  tripod_anchor: "two_hands",
  edge_roller: "one_hand",
  pulleys_prusiks: "pocket",

  // --- Water rescue ---
  water_rescue_kit: "two_hands",
  dry_suit: "worn",
  pfd: "worn",
  throw_line: "one_hand",
  rescue_sled: "two_hands",
  wading_pole: "one_hand",

  // --- Wildfire ---
  beater: "one_hand", // flail on a pole, 2–3 kg
  leaf_blower: "two_hands",
  knapsack_sprayer: "worn", // 15–20 L backpack
  drip_torch: "one_hand",

  // --- Medical ---
  aed: "one_hand",
  first_aid: "one_hand",
  trauma: "one_hand",

  // --- Comms ---
  radio: "pocket",
};

/** One-per-appliance items. Two riders cannot both hold the pump's
 *  only set of cutters. */
export const APPLIANCE_SINGLETONS = new Set<string>([
  "fast_attack_branch",
  "thermal_camera",
  "hydraulic_cutters",
  "hydraulic_spreaders",
  "combi_tool",
  "hydraulic_ram",
  "reciprocating_saw",
  "disc_cutter",
  "chainsaw",
  "concrete_breaker",
  "search_camera",
  "area_lighting",
  "stab_struts",
  "sked_stretcher",
  "tripod_anchor",
  "rescue_sled",
  "water_rescue_kit",
  "spine_board",
]);

/** Breathing sets — a rider wears one or the other, never both. */
const BA_SETS = new Set<string>(["ba_set", "airline_ba"]);

/** Never throws on an unknown key — crewEquipment persists as string[]
 *  and old saves carry retired items. */
export function carryClass(item: string): CarryClass {
  return CARRY_CLASS[item as CrewEquipment] ?? "one_hand";
}

export function handCost(item: string): 0 | 1 | 2 {
  const c = carryClass(item);
  return c === "two_hands" ? 2 : c === "one_hand" ? 1 : 0;
}

export function handsUsed(items: readonly string[]): number {
  return items.reduce((n, it) => n + handCost(it), 0);
}

export function pocketsUsed(items: readonly string[]): number {
  return items.filter((it) => carryClass(it) === "pocket").length;
}

/** Can this rider pick this item up as well as what they already hold? */
export function canCarry(
  items: readonly string[],
  item: string,
): { ok: true } | { ok: false; reason: string } {
  if (items.includes(item)) return { ok: true }; // already held
  const cls = carryClass(item);
  if (BA_SETS.has(item) && items.some((i) => BA_SETS.has(i))) {
    return { ok: false, reason: "Already wearing a breathing set" };
  }
  if (cls === "worn") return { ok: true };
  if (cls === "pocket") {
    return pocketsUsed(items) >= POCKET_BUDGET
      ? { ok: false, reason: "Pockets full" }
      : { ok: true };
  }
  const need = handCost(item);
  const free = HAND_BUDGET - handsUsed(items);
  if (need > free) {
    return {
      ok: false,
      reason:
        free === 0
          ? `Hands full (${HAND_BUDGET}/${HAND_BUDGET})`
          : "Needs both hands — one already carrying",
    };
  }
  return { ok: true };
}

/** Pure add. Returns the array unchanged when the rider can't take it. */
export function addEquipment(
  items: readonly string[],
  item: string,
): string[] {
  if (items.includes(item)) return [...items];
  return canCarry(items, item).ok ? [...items, item] : [...items];
}

/**
 * Set a rider's loadout to `target`, atomically and within budget.
 * Worn and pocketed items go on first (they cost no hands), then
 * carried items in the order given until the hands run out.
 */
export function applyLoadout(target: readonly string[]): {
  items: string[];
  dropped: string[];
} {
  const order = (it: string) => {
    const c = carryClass(it);
    return c === "worn" ? 0 : c === "pocket" ? 1 : 2;
  };
  const sorted = [...new Set(target)].sort((a, b) => order(a) - order(b));
  const items: string[] = [];
  const dropped: string[] = [];
  for (const it of sorted) {
    if (canCarry(items, it).ok) items.push(it);
    else dropped.push(it);
  }
  return { items, dropped };
}

/** Trim an over-budget loadout — used when resuming a shift saved
 *  before carry limits existed. Keeps worn and pocketed kit, then
 *  carried items in their existing order until the hands are full. */
export function sanitiseLoadout(items: readonly string[]): {
  items: string[];
  dropped: string[];
} {
  return applyLoadout(items);
}

/** What a task needs. `all` = every assigned rider must hold it
 *  personally (a BA set); `any` = the team collectively must bring it
 *  (the cutters — one rider carries them). */
export type TaskKitReq = {
  all?: readonly CrewEquipment[];
  any?: readonly CrewEquipment[];
};

/**
 * Does the picked team, between them, carry what the task needs?
 *
 * This is the rule that makes an extrication possible: the kit is
 * checked against the team as a set, not against each person, because
 * no single firefighter can carry cutters and spreaders and chocks.
 */
export function teamCovers(
  equipMap: Record<string, string[]>,
  pickedCrewIds: readonly string[],
  req: TaskKitReq | undefined,
): {
  ok: boolean;
  missingAny: CrewEquipment[];
  missingAllBy: Record<string, CrewEquipment[]>;
  coverage: Partial<Record<CrewEquipment, string>>;
} {
  const missingAny: CrewEquipment[] = [];
  const missingAllBy: Record<string, CrewEquipment[]> = {};
  const coverage: Partial<Record<CrewEquipment, string>> = {};
  if (!req) return { ok: true, missingAny, missingAllBy, coverage };

  for (const item of req.any ?? []) {
    const holder = pickedCrewIds.find((id) =>
      (equipMap[id] ?? []).includes(item),
    );
    if (holder) coverage[item] = holder;
    else missingAny.push(item);
  }
  for (const item of req.all ?? []) {
    for (const id of pickedCrewIds) {
      if (!(equipMap[id] ?? []).includes(item)) {
        (missingAllBy[id] ??= []).push(item);
      }
    }
  }
  const ok =
    missingAny.length === 0 && Object.keys(missingAllBy).length === 0;
  return { ok, missingAny, missingAllBy, coverage };
}
