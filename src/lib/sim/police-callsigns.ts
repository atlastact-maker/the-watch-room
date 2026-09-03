// GMP over-air callsigns.
//
// What was here before was invented — the old comment in data.ts said as
// much ("we synthesise unit numbers"), and it produced things like
// "MP-Trafford 12" and "AR-14" that no GMP officer would recognise. This
// is the real scheme, given to the project by the owner (source U7 in
// data/research/police/sources.md).
//
// TWO SCHEMES, and they do not share a shift code. That is the thing to
// hold on to. A divisional unit counts its shifts 1/2/3; a roads unit
// counts them 1/4/8. Reading a roads callsign with divisional rules gives
// the wrong shift, which is exactly the sort of error this file exists to
// stop.
//
// DIVISIONAL — [division][role][shift][unit]
//
//   KT114  = K (Bolton) · T (taser) · 1 (early) · unit 14
//   AP203  = A (City of Manchester) · P (patrol) · 2 (afternoon) · unit 03
//
// ROADS — [unit type][area][shift]
//
//   XT14   = road patrol · area 1 (Bolton, Bury, Wigan) · 4 (lates)
//   XT51   = road patrol · area 5 (Salford, Trafford) · 1 (early)
//   ME28   = motorway · area 2 · 8 (nights)
//
// The roads callsign identifies a PATCH ON A SHIFT, not a vehicle — it
// says who is covering that ground right now. So two cars can carry the
// same callsign across a handover, and a roads callsign has no unit
// number on the end. That is why they are shorter than divisional ones.

/** GMP territorial division letters. */
export const GMP_DIVISION: Record<string, string> = {
  "City of Manchester": "A",
  Salford: "F",
  Tameside: "G",
  Airport: "I",
  Stockport: "J",
  Bolton: "K",
  Wigan: "L",
  Trafford: "M",
  Bury: "N",
  Rochdale: "P",
  Oldham: "Q",
};

/** Station id in gmp_stations.json → division letter. */
export const DIVISION_BY_STATION: Record<string, string> = {
  "MP-MCR": "A",
  "MP-SAL": "F",
  "MP-TAM": "G",
  "MP-STK": "J",
  "MP-BOL": "K",
  "MP-WIG": "L",
  "MP-TRA": "M",
  "MP-BUR": "N",
  "MP-RCH": "P",
  "MP-OLD": "Q",
  // "I" (Airport) has no station in the sim — GMP's airport division
  // polices Manchester Airport and we do not model it.
};

export type Shift = "early" | "afternoon" | "night";

/** Divisional shift digit: 1 early, 2 afternoon, 3 night. */
const DIVISIONAL_SHIFT: Record<Shift, string> = { early: "1", afternoon: "2", night: "3" };

/** Roads shift digit: 1 early, 4 afternoon/lates, 8 nights. A different
 *  set of numbers from the divisional one, deliberately. */
const ROADS_SHIFT: Record<Shift, string> = { early: "1", afternoon: "4", night: "8" };

/** Role letter inside a divisional callsign. Only the two the owner gave
 *  are here; anything else is a gap, not a guess. */
export const DIVISIONAL_ROLE = {
  patrol: "P",
  taser: "T",
} as const;
export type DivisionalRole = keyof typeof DIVISIONAL_ROLE;

/** Roads unit types. */
export const ROADS_UNIT = {
  /** Road patrol. */
  road: "XT",
  /** Motorway unit. */
  motorway: "ME",
  /** SRTT. */
  srtt: "XB",
} as const;
export type RoadsUnit = keyof typeof ROADS_UNIT;

/** Roads areas we have been told. The numbers are GMP's, and the ones
 *  absent here are absent because nobody has told us — see GAPS. */
export const ROADS_AREA: Record<string, { area: string; covers: string[] }> = {
  "1": { area: "1", covers: ["Bolton", "Bury", "Wigan"] },
  "5": { area: "5", covers: ["Salford", "Trafford"] },
};

/** The road-patrol areas the force covers, in the order the roads
 *  station issues them. ONE XT cover per patch, routinely — so this list
 *  is also the count of XT callsigns in the force.
 *
 *  Only the two areas we have been told are here. The others exist in
 *  reality and are missing from the sim because nobody has given us their
 *  numbers, not because the force has two patches — see GAPS. */
export const XT_AREAS: number[] = [1, 5];

/** Motorway areas. We hold one, from the worked example ME28. */
export const ME_AREAS: number[] = [2];

/** The station that holds the force's road-patrol and motorway cover.
 *  Roads vehicles based at divisional stations are not the patch's XT —
 *  there is only one of those — so they get no roads callsign. */
export const ROADS_STATION = "MP-RPU";

/** A divisional callsign: KT114. */
export function divisionalCallsign(
  division: string,
  role: DivisionalRole,
  shift: Shift,
  unit: number,
): string {
  return `${division}${DIVISIONAL_ROLE[role]}${DIVISIONAL_SHIFT[shift]}${String(unit).padStart(2, "0")}`;
}

/** A roads callsign: XT14. No unit number — it names a patch on a shift. */
export function roadsCallsign(unitType: RoadsUnit, area: string | number, shift: Shift): string {
  return `${ROADS_UNIT[unitType]}${area}${ROADS_SHIFT[shift]}`;
}

/** Read a callsign back. Returns null for anything that does not parse,
 *  rather than guessing at it. */
export function parseCallsign(
  cs: string,
):
  | { kind: "divisional"; division: string; role: string; shift: Shift; unit: number }
  | {
      kind: "roads";
      unitType: string;
      area: string;
      shift: Shift;
      covers?: string[];
    }
  | null {
  const roads = /^(XT|ME|XB)(\d)(\d)$/.exec(cs.toUpperCase());
  if (roads) {
    const shift = (Object.keys(ROADS_SHIFT) as Shift[]).find((s) => ROADS_SHIFT[s] === roads[3]);
    if (!shift) return null;
    return {
      kind: "roads",
      unitType: roads[1],
      area: roads[2],
      shift,
      covers: ROADS_AREA[roads[2]]?.covers,
    };
  }
  const div = /^([AFGIJKLMNPQ])([A-Z])(\d)(\d{1,3})$/.exec(cs.toUpperCase());
  if (div) {
    const shift = (Object.keys(DIVISIONAL_SHIFT) as Shift[]).find(
      (s) => DIVISIONAL_SHIFT[s] === div[3],
    );
    if (!shift) return null;
    return { kind: "divisional", division: div[1], role: div[2], shift, unit: Number(div[4]) };
  }
  return null;
}

/** Plain words for a callsign, for the glossary and the MDT. */
export function describeCallsign(cs: string): string | null {
  const p = parseCallsign(cs);
  if (!p) return null;
  const shiftWord = { early: "early shift", afternoon: "afternoon shift", night: "night shift" };
  if (p.kind === "roads") {
    const type =
      p.unitType === "XT" ? "road patrol" : p.unitType === "ME" ? "motorway unit" : "SRTT";
    const where = p.covers ? p.covers.join(", ") : `area ${p.area}`;
    return `${type}, ${where}, ${shiftWord[p.shift]}`;
  }
  const division =
    Object.entries(GMP_DIVISION).find(([, l]) => l === p.division)?.[0] ?? `division ${p.division}`;
  const role =
    p.role === "P" ? "patrol" : p.role === "T" ? "taser" : `role ${p.role}`;
  return `${division} ${role}, unit ${p.unit}, ${shiftWord[p.shift]}`;
}

/** What we have NOT been told, and so must not write into a callsign.
 *  Mirrors data/research/police/gaps.md — keep the two in step. */
export const GAPS = [
  "Roads areas 2, 3 and 4 (and whether the numbering runs past 5). We hold only area 1 = Bolton/Bury/Wigan and area 5 = Salford/Trafford, plus ME area 2 from the worked example.",
  "Role letters other than P (patrol) and T (taser). Nothing is known for ARV, dog, search, SIO or the roads motorbike, so none of them are given a divisional callsign.",
  "Whether divisional units really do count shifts 1/2/3 while roads units count 1/4/8. The owner said traffic 'follows the same' and then gave 1/4/8 with three worked examples; the worked examples are what this file implements.",
  "What SRTT stands for.",
  "Unit-number ranges per division — whether they restart per shift, and how high they run.",
] as const;
