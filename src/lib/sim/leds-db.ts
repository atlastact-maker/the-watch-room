// The population behind the enquiry terminal.
//
// The authored records hold about thirty vehicles and seventy people —
// the ones the scenarios actually name. That is far too few for a system
// the operator can type anything into: nine enquiries in ten came back NO
// TRACE, which trains the wrong instinct and gives ANPR nothing to hit.
//
// So this generates the rest. Not a stored database — a DETERMINISTIC one.
// Every plate, name and address is derived from a hash of the query
// itself, which means:
//
//   * anything the operator types returns something plausible,
//   * the same plate returns the same vehicle every time, this shift and
//     next year, without a byte being stored,
//   * and the authored records always win, so a scenario's vehicle keeps
//     the detail its author gave it.
//
// EVERYTHING GENERATED HERE IS FICTIONAL. The names are common British
// forenames and surnames combined at random; the streets are ordinary
// British street names attached to a district; the plates follow the
// current UK format but are not checked against anything real. No
// generated record is intended to correspond to a real person, vehicle or
// household, and the marker rates below are the sim's own.
//
// RATES. Most people and most cars are of no interest whatever, and the
// generator is weighted so — roughly six vehicles in seven come back
// clean. That matters: a system that flags something every other enquiry
// teaches an operator to ignore flags.

import type { PersonRecord, VehicleRecord, PlaceRecord } from "./records";
import { squash, norm } from "./records";

/** FNV-1a over a string, then a small xorshift so successive draws from
 *  one seed are not correlated. Deterministic, and no state anywhere. */
function seed(s: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let x = h >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5;
    x >>>= 0;
    return x / 4294967296;
  };
}

const pick = <T,>(rnd: () => number, xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
const int = (rnd: () => number, lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));

// ---------------------------------------------------------------------------
// Tables. Ordinary British names and cars — nothing here is picked to be
// distinctive, which is the point.
// ---------------------------------------------------------------------------

const SURNAMES = [
  "SMITH","JONES","TAYLOR","BROWN","WILLIAMS","WILSON","JOHNSON","DAVIES","ROBINSON","WRIGHT",
  "THOMPSON","EVANS","WALKER","WHITE","ROBERTS","GREEN","HALL","WOOD","JACKSON","CLARKE",
  "HUGHES","EDWARDS","TURNER","MARTIN","COOPER","HILL","WARD","MORRIS","MOORE","CLARK",
  "LEE","KING","BAKER","HARRISON","MORGAN","ALLEN","JAMES","SCOTT","PHILLIPS","WATSON",
  "DAVIDSON","PARKER","PRICE","BENNETT","YOUNG","GRIFFITHS","MITCHELL","KELLY","COOK","CARTER",
  "RICHARDSON","BAILEY","COLLINS","BELL","SHAW","MURPHY","MILLER","COX","RILEY","MURRAY",
  "AHMED","KHAN","PATEL","BEGUM","HUSSAIN","ALI","IQBAL","RAHMAN","SHAH","MAHMOOD",
  "O'BRIEN","O'CONNOR","KOWALSKI","NOWAK","DUFFY","GALLAGHER","MCDONALD","CAMPBELL","STEWART","GRAHAM",
] as const;

const FORENAMES_M = [
  "JAMES","JOHN","DAVID","MICHAEL","PAUL","ANDREW","MARK","ROBERT","STEPHEN","CHRISTOPHER",
  "SIMON","PETER","RICHARD","THOMAS","DANIEL","MATTHEW","LEE","CRAIG","GARY","NEIL",
  "LIAM","JACK","OLIVER","HARRY","CALLUM","JORDAN","KYLE","RYAN","NATHAN","AARON",
  "MOHAMMED","IMRAN","TARIQ","YUSUF","RAJ","AMIR","OMAR","HASSAN","BILAL","ZAIN",
  "SEAN","DECLAN","PATRICK","BRENDAN","TOMASZ","PIOTR","MAREK","ADAM","LUKE","JOSEPH",
] as const;

const FORENAMES_F = [
  "SARAH","EMMA","LOUISE","CLAIRE","LISA","NICOLA","REBECCA","HELEN","JULIE","KAREN",
  "AMY","LAUREN","CHLOE","JESSICA","HANNAH","SOPHIE","CHARLOTTE","MEGAN","OLIVIA","GEORGIA",
  "SUSAN","JANE","CAROL","LINDA","MARGARET","PATRICIA","ANGELA","DEBORAH","TRACEY","SHARON",
  "AISHA","FATIMA","ZAINAB","SAIRA","NADIA","YASMIN","AMINA","SANA","MARIAM","LAYLA",
  "SIOBHAN","BRIDGET","AGNIESZKA","KATARZYNA","MAGDALENA","GRACE","ELLIE","POPPY","ISLA","RUBY",
] as const;

const MAKES: readonly (readonly [string, readonly string[]])[] = [
  ["FORD", ["FIESTA", "FOCUS", "TRANSIT", "KUGA", "PUMA", "MONDEO", "TRANSIT CUSTOM"]],
  ["VAUXHALL", ["CORSA", "ASTRA", "MOKKA", "INSIGNIA", "VIVARO", "CROSSLAND"]],
  ["VOLKSWAGEN", ["GOLF", "POLO", "TIGUAN", "PASSAT", "TRANSPORTER", "T-ROC"]],
  ["BMW", ["1 SERIES", "3 SERIES", "5 SERIES", "X1", "X3", "X5"]],
  ["AUDI", ["A1", "A3", "A4", "Q2", "Q3", "Q5"]],
  ["MERCEDES-BENZ", ["A CLASS", "C CLASS", "E CLASS", "SPRINTER", "VITO", "GLA"]],
  ["TOYOTA", ["YARIS", "COROLLA", "RAV4", "AYGO", "HILUX", "C-HR"]],
  ["NISSAN", ["QASHQAI", "JUKE", "MICRA", "X-TRAIL", "LEAF"]],
  ["HYUNDAI", ["I10", "I20", "I30", "TUCSON", "KONA"]],
  ["KIA", ["PICANTO", "RIO", "CEED", "SPORTAGE", "NIRO"]],
  ["PEUGEOT", ["208", "308", "2008", "3008", "PARTNER", "BOXER"]],
  ["RENAULT", ["CLIO", "CAPTUR", "MEGANE", "KADJAR", "TRAFIC"]],
  ["SKODA", ["FABIA", "OCTAVIA", "KAROQ", "SUPERB", "KODIAQ"]],
  ["SEAT", ["IBIZA", "LEON", "ARONA", "ATECA"]],
  ["HONDA", ["JAZZ", "CIVIC", "CR-V", "HR-V"]],
  ["LAND ROVER", ["DISCOVERY SPORT", "RANGE ROVER EVOQUE", "DEFENDER", "FREELANDER"]],
  ["MINI", ["COOPER", "ONE", "COUNTRYMAN"]],
  ["CITROEN", ["C1", "C3", "C4", "BERLINGO", "RELAY"]],
  ["FIAT", ["500", "PANDA", "TIPO", "DUCATO"]],
  ["MAZDA", ["2", "3", "CX-5", "CX-30"]],
] as const;

const COLOURS = [
  "BLACK","SILVER","WHITE","GREY","BLUE","RED","GREEN","BRONZE","BEIGE","YELLOW","ORANGE","PURPLE",
] as const;
/** Weighted the way a car park actually looks. */
const COLOUR_WEIGHTS = [22, 20, 18, 14, 10, 7, 3, 2, 1, 1, 1, 1] as const;

const STREET_NAMES = [
  "CHURCH","STATION","VICTORIA","ALBERT","QUEENS","KINGS","MILL","SCHOOL","PARK","GEORGE",
  "HIGH","MANCHESTER","BOLTON","OLDHAM","CHESTER","LIVERPOOL","WELLINGTON","GRANGE","ASHFIELD","BEECH",
  "OAK","ELM","SYCAMORE","WILLOW","CEDAR","BIRCH","HAWTHORN","CHESTNUT","LIME","MAPLE",
  "BRIAR","MEADOW","BROOK","SPRING","WOODLAND","HEATHER","CLOVER","FERNDALE","ROSEBANK","LARKHILL",
] as const;
const STREET_TYPES = [
  "ROAD","STREET","AVENUE","CLOSE","DRIVE","LANE","GROVE","WAY","CRESCENT","PLACE","TERRACE","WALK",
] as const;

/** Districts and a plausible postcode district for each. Real places —
 *  the sim is set in Greater Manchester — with generated streets in them. */
const DISTRICTS: readonly (readonly [string, string])[] = [
  ["MANCHESTER", "M"],["SALFORD", "M"],["STOCKPORT", "SK"],["BOLTON", "BL"],["BURY", "BL"],
  ["ROCHDALE", "OL"],["OLDHAM", "OL"],["WIGAN", "WN"],["ALTRINCHAM", "WA"],["ASHTON-UNDER-LYNE", "OL"],
  ["ECCLES", "M"],["SWINTON", "M"],["PRESTWICH", "M"],["WHITEFIELD", "M"],["DENTON", "M"],
  ["SALE", "M"],["URMSTON", "M"],["STRETFORD", "M"],["HYDE", "SK"],["LEIGH", "WN"],
] as const;

// ---------------------------------------------------------------------------
// Markers, at rates that make a flag mean something.
// ---------------------------------------------------------------------------

/** Cumulative bands. A draw below the first is clean. */
const VEHICLE_MARKER_BANDS: readonly (readonly [number, string])[] = [
  [0.855, ""],                  // nothing at all
  [0.915, "NO MOT"],
  [0.955, "NO INSURANCE"],
  [0.978, "NO TAX"],
  [0.99, "ANPR INTEREST"],
  [0.997, "PNC MARKER"],
  [1.0, "STOLEN"],
] as const;

const PERSON_MARKER_BANDS: readonly (readonly [number, string])[] = [
  [0.9, ""],
  [0.94, "DRUGS"],
  [0.962, "VIOLENT"],
  [0.976, "MENTAL HEALTH"],
  [0.986, "WANTED"],
  [0.993, "MISSING"],
  [0.997, "WEAPONS"],
  [1.0, "FIREARMS"],
] as const;

function band(rnd: () => number, bands: readonly (readonly [number, string])[]): string[] {
  const r = rnd();
  for (const [ceiling, code] of bands) if (r < ceiling) return code ? [code] : [];
  return [];
}

function weighted(rnd: () => number, xs: readonly string[], w: readonly number[]): string {
  const total = w.reduce((a, b) => a + b, 0);
  let r = rnd() * total;
  for (let i = 0; i < xs.length; i++) {
    r -= w[i];
    if (r <= 0) return xs[i];
  }
  return xs[xs.length - 1];
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

function personName(rnd: () => number): { name: string; sex: "M" | "F" } {
  const sex = rnd() < 0.5 ? "M" : "F";
  const fore = pick(rnd, sex === "M" ? FORENAMES_M : FORENAMES_F);
  return { name: `${pick(rnd, SURNAMES)}, ${fore.charAt(0)}${fore.slice(1).toLowerCase()}`, sex };
}

function address(rnd: () => number): { address: string; postcode: string; district: string } {
  const [district, pcArea] = pick(rnd, DISTRICTS);
  const street = `${pick(rnd, STREET_NAMES)} ${pick(rnd, STREET_TYPES)}`;
  const postcode = `${pcArea}${int(rnd, 1, 45)} ${int(rnd, 0, 9)}${pick(rnd, ["AA","AB","AD","AE","AF","BB","BD","BE","DA","DB","EA","EB","HA","HB","JA","JB","LA","LB","NA","NB","PA","PB","QA","RA","SA","SB","TA","WA","XA","YA"])}`;
  return { address: `${int(rnd, 1, 180)} ${street}, ${district}`, postcode, district };
}

/** The plate a generated vehicle carries — current UK format. */
function makeVrm(rnd: () => number): string {
  const L = "ABCDEFGHJKLMNOPRSTUVWXY";
  const a = pick(rnd, L.split("")) + pick(rnd, L.split(""));
  // Age identifier: March plates 05-75, September plates 55-75.
  const yr = int(rnd, 5, 25);
  const age = rnd() < 0.5 ? String(yr).padStart(2, "0") : String(yr + 50);
  const b = pick(rnd, L.split("")) + pick(rnd, L.split("")) + pick(rnd, L.split(""));
  return `${a}${age} ${b}`;
}

/** A vehicle for any plate. Stable: the same plate always gives this. */
export function generateVehicle(vrm: string): VehicleRecord {
  const key = squash(vrm);
  const rnd = seed(`veh:${key}`);
  const [make, models] = pick(rnd, MAKES);
  const keeper = personName(rnd);
  const where = address(rnd);
  const markers = band(rnd, VEHICLE_MARKER_BANDS);
  return {
    id: `gen-veh-${key}`,
    vrm: vrm.toUpperCase(),
    make,
    model: pick(rnd, models),
    colour: weighted(rnd, COLOURS, COLOUR_WEIGHTS),
    keeperName: `${keeper.name} — ${where.address} ${where.postcode}`,
    markers: markers as VehicleRecord["markers"],
    notes: [],
  };
}

/** A person for any name typed. */
export function generatePerson(name: string): PersonRecord {
  const key = norm(name);
  const rnd = seed(`per:${key}`);
  const where = address(rnd);
  const markers = band(rnd, PERSON_MARKER_BANDS);
  const sex = rnd() < 0.5 ? "M" : "F";
  return {
    id: `gen-per-${key.replace(/\s+/g, "-")}`,
    // Keep what was typed — the operator asked about this name.
    name: name.trim().toUpperCase(),
    sex,
    age: int(rnd, 17, 84),
    address: where.address,
    postcode: where.postcode,
    roles: [],
    markers: markers as PersonRecord["markers"],
    notes: [],
  };
}

/** An address, with who is at it. */
export function generateAddress(query: string): PlaceRecord & {
  occupants: PersonRecord[];
  vehicles: VehicleRecord[];
} {
  const key = norm(query);
  const rnd = seed(`adr:${key}`);
  const where = address(rnd);
  const occupantCount = int(rnd, 1, 4);
  const occupants: PersonRecord[] = [];
  for (let i = 0; i < occupantCount; i++) {
    const p = generatePerson(`${pick(seed(`adr:${key}:o${i}`), SURNAMES)}, ${pick(seed(`adr:${key}:f${i}`), rnd() < 0.5 ? FORENAMES_M : FORENAMES_F)}`);
    occupants.push({ ...p, address: query.trim().toUpperCase(), postcode: where.postcode });
  }
  const vehicleCount = int(rnd, 0, 2);
  const vehicles: VehicleRecord[] = [];
  for (let i = 0; i < vehicleCount; i++) {
    vehicles.push(generateVehicle(makeVrm(seed(`adr:${key}:v${i}`))));
  }
  return {
    id: `gen-adr-${key.replace(/\s+/g, "-")}`,
    kind: "premises",
    name: query.trim().toUpperCase(),
    address: query.trim().toUpperCase(),
    postcode: where.postcode,
    coords: { lat: 0, lng: 0 },
    notes: [],
    occupants,
    vehicles,
  };
}

/** A plausible plate for a camera to read, from any seed string. Used by
 *  ANPR to populate the traffic passing a site. */
export function randomVrm(seedStr: string): string {
  return makeVrm(seed(`vrm:${seedStr}`));
}
