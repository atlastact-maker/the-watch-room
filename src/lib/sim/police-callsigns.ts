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

// ---------------------------------------------------------------------------
// Reliefs
// ---------------------------------------------------------------------------
// A GMP callsign carries the turn, so the whole board changes at a relief
// change: KP101 goes home and KP401 comes on, XT11 becomes XT14. The
// outgoing relief is not simply deleted — it makes its way back to the
// station first, goes off the run there, and is gone when the incoming
// relief books on.
//
// Times from the owner: 07:00, 15:00, 21:00. Unequal turns — earlies get
// eight hours, lates six, nights ten — which is the owner's answer and
// not a mistake in the arithmetic.

/** The hour each relief books on. */
export const RELIEF_START: Record<Shift, number> = {
  early: 7,
  afternoon: 15,
  night: 21,
};

/** In relief order round the clock. */
const RELIEF_ORDER: { shift: Shift; from: number }[] = [
  { shift: "early", from: 7 },
  { shift: "afternoon", from: 15 },
  { shift: "night", from: 21 },
];

/** How long before the change the outgoing relief starts making its way
 *  back. They are still on the air, but the desk should not be sending
 *  them to anything new. */
export const HANDOVER_LEAD_MIN = 30;

/** Which relief is on at this hour of the clock. Nights run over
 *  midnight, so anything before 07:00 belongs to the turn that booked on
 *  at 21:00 the day before. */
export function shiftForHour(hour: number): Shift {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 21 || h < 7) return "night";
  if (h >= 15) return "afternoon";
  return "early";
}

/** Hours until the next relief change, as a fraction. */
export function hoursToRelief(hour: number, minute = 0): number {
  const now = (((hour % 24) + 24) % 24) + minute / 60;
  let best = Infinity;
  for (const { from } of RELIEF_ORDER) {
    let d = from - now;
    if (d <= 0) d += 24;
    best = Math.min(best, d);
  }
  return best;
}

/** True inside the run-back window before a change. */
export function inHandover(hour: number, minute = 0): boolean {
  return hoursToRelief(hour, minute) * 60 <= HANDOVER_LEAD_MIN;
}

/** The relief coming on next. */
export function nextShift(hour: number, minute = 0): Shift {
  const h = ((hour % 24) + 24) % 24 + minute / 60;
  let bestShift: Shift = "early";
  let best = Infinity;
  for (const { shift, from } of RELIEF_ORDER) {
    let d = from - h;
    if (d <= 0) d += 24;
    if (d < best) {
      best = d;
      bestShift = shift;
    }
  }
  return bestShift;
}

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

// Road patrol and motorway areas are SEPARATE NUMBERINGS. XT area 1 is
// Bolton, Bury and Wigan; ME area 1 is the north motorway network. They
// share nothing but a digit, so they get a table each — reading an ME
// callsign off the XT table would name the wrong ground entirely.

/** Road-patrol areas. Three patches, three shifts each: nine XT covers. */
export const XT_AREA: Record<string, string[]> = {
  "1": ["Bolton", "Bury", "Wigan"],
  "5": ["Salford", "Trafford"],
  // The owner's words: "the south district, whatever is left". DERIVED:
  // that is everything areas 1 and 5 do not hold — listed here so the
  // glossary can name it, but the derivation is ours, not GMP's.
  "7": ["Manchester", "Stockport", "Tameside", "Oldham", "Rochdale"],
};

/** Motorway areas. Four quadrants of the force network — note there is
 *  no area 3. */
export const ME_AREA: Record<string, string[]> = {
  "1": ["North force motorway network"],
  "2": ["East force motorway network"],
  "4": ["West force motorway network"],
  "5": ["South force motorway network"],
};

/** The road-patrol patches. One XT cover per patch on any given shift. */
export const XT_AREAS: number[] = Object.keys(XT_AREA).map(Number);

/** The motorway quadrants, likewise one ME per quadrant per shift. */
export const ME_AREAS: number[] = Object.keys(ME_AREA).map(Number);

/** Which covers each roads base puts out.
 *
 *  The three bases are the owner's — Eccles, Whitefield and Ashton. WHICH
 *  COVER SITS AT WHICH BASE IS INFERRED, by nearest ground: Whitefield in
 *  the north takes the northern road patch and the north motorway, Ashton
 *  in the east takes the east motorway, Eccles in the west keeps its own
 *  patch and the western network. It is one line each to correct — see
 *  gaps.md. */
export const ROADS_BASE_COVERS: Record<
  string,
  { unit: "road" | "motorway"; area: number }[]
> = {
  "MP-RPU": [
    { unit: "road", area: 5 }, // Salford, Trafford — the base's own ground
    { unit: "motorway", area: 4 }, // west
    { unit: "motorway", area: 5 }, // south
  ],
  "MP-RPU-WHI": [
    { unit: "road", area: 1 }, // Bolton, Bury, Wigan
    { unit: "motorway", area: 1 }, // north
  ],
  "MP-RPU-ASH": [
    { unit: "road", area: 7 }, // the south district
    { unit: "motorway", area: 2 }, // east
  ],
};

/** Every roads base. */
export const ROADS_STATIONS = Object.keys(ROADS_BASE_COVERS);

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
      covers: (roads[1] === "ME" ? ME_AREA : XT_AREA)[roads[2]],
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
