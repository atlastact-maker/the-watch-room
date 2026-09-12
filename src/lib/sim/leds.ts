// LEDS — the police enquiry terminal.
//
// WHAT THIS IS AND IS NOT. The Law Enforcement Data Service is the Home
// Office programme replacing the Police National Computer and the Police
// National Database. Its actual screens, field names and response formats
// are not public, and nothing here is transcribed from them. What IS
// modelled is the SHAPE of a police data enquiry, which is well
// understood and is the part that matters for the sim:
//
//   1. You cannot look somebody up because you are curious. Every check
//      needs a policing purpose, and that purpose is recorded.
//   2. Every access is audited against the person who made it. Misuse of
//      police systems is a criminal offence, and the audit is how it is
//      found. In the sim this is the interesting mechanic, not paperwork:
//      the debrief can look at what the operator checked and why.
//   3. A check returns a STRUCTURED RETURN, not a list of search results.
//      The search panel answers "where is Hollyhedge Road". This answers
//      "what does the system hold on BN69 KVD, and am I allowed to ask".
//   4. Most checks come back with nothing of interest. That is realistic
//      and it is important — a system that only ever returns hits trains
//      the wrong instinct.
//
// Everything below is tagged MODELLED in the research notes. It is not a
// claim about how LEDS actually presents anything.

import type { PersonRecord, RecordIndex, VehicleRecord } from "./records";
import { dobDisplay, dobOf, norm, squash } from "./records";
import { generateAddress, generatePerson, generateVehicle } from "./leds-db";

/** Why the check is being made. A check without one is refused.
 *
 *  MODELLED. Real forces run a longer list tied to their information
 *  sharing agreements; these are the ones a control room operator in this
 *  sim would plausibly be choosing between. */
export const POLICING_PURPOSES = {
  incident: "Responding to an incident",
  stop: "Vehicle stop / roadside check",
  collision: "Road traffic collision",
  missing: "Missing person enquiry",
  wanted: "Tracing a wanted person",
  safeguarding: "Safeguarding / welfare concern",
  intelligence: "Intelligence development",
} as const;
export type PolicingPurpose = keyof typeof POLICING_PURPOSES;

export type LedsMarker = { code: string; detail?: string };

export type VehicleReturn = {
  kind: "vehicle";
  /** As queried, tidied for display. */
  vrm: string;
  trace: boolean;
  make?: string;
  model?: string;
  colour?: string;
  keeperName?: string;
  keeperId?: string;
  /** Derived from the record's markers — a vehicle with NO TAX is untaxed. */
  taxed?: boolean;
  mot?: boolean;
  insured?: boolean;
  markers: LedsMarker[];
  notes: string[];
};

export type PersonReturn = {
  kind: "person";
  name: string;
  trace: boolean;
  sex?: "M" | "F" | "X";
  age?: number;
  dob?: string;
  address?: string;
  postcode?: string;
  /** PNC-style warning signals. The vocabulary already lives on the
   *  record; LEDS is just where an operator reads it. */
  warnings: LedsMarker[];
  wanted: boolean;
  missing: boolean;
  notes: string[];
  vehicleIds: string[];
};

export type AddressReturn = {
  kind: "address";
  address: string;
  trace: boolean;
  postcode?: string;
  /** Who the system holds at it. */
  occupants: { name: string; age?: number; markers: LedsMarker[] }[];
  /** Vehicles kept there. */
  vehicles: { vrm: string; make?: string; model?: string; markers: LedsMarker[] }[];
  notes: string[];
};

export type LedsReturn = VehicleReturn | PersonReturn | AddressReturn;

/** One entry in the audit. Written whether the check found anything or
 *  not — an enquiry that came back no-trace is still an enquiry. */
export type LedsCheck = {
  id: string;
  atMs: number;
  kind: "vehicle" | "person" | "address";
  /** What was typed. */
  query: string;
  purpose: PolicingPurpose;
  /** The job it was run for, when there was one. */
  incidentId?: string | null;
  /** Free text the operator added. */
  reason?: string;
  result: LedsReturn;
};

/** Markers that mean the vehicle should be stopped, not merely noted. */
const VEHICLE_HOT = new Set(["STOLEN", "ANPR INTEREST", "PNC MARKER"]);
/** Warning signals that change how a unit approaches. */
const PERSON_HOT = new Set(["VIOLENT", "FIREARMS", "WEAPONS", "ESCAPER", "WANTED"]);

export function isHot(r: LedsReturn): boolean {
  if (!r.trace) return false;
  if (r.kind === "vehicle") return r.markers.some((m) => VEHICLE_HOT.has(m.code));
  if (r.kind === "person") return r.warnings.some((m) => PERSON_HOT.has(m.code)) || r.wanted;
  // An address is hot if somebody at it is, or something on the drive is.
  return (
    r.occupants.some((o) => o.markers.some((m) => PERSON_HOT.has(m.code))) ||
    r.vehicles.some((v) => v.markers.some((m) => VEHICLE_HOT.has(m.code)))
  );
}

/** Tidy a typed plate into display form: "bn69kvd" → "BN69 KVD".
 *  Anything that is not a recognisable current-format plate is upper-cased
 *  and left alone rather than being forced into a shape it is not. */
export function formatVrm(raw: string): string {
  const s = squash(raw).toUpperCase();
  return /^[A-Z]{2}\d{2}[A-Z]{3}$/.test(s) ? `${s.slice(0, 4)} ${s.slice(4)}` : raw.trim().toUpperCase();
}

function vehicleFrom(v: VehicleRecord, vrm: string): VehicleReturn {
  const markers = (v.markers ?? []).map((m) => ({ code: String(m) }));
  const has = (code: string) => markers.some((m) => m.code === code);
  return {
    kind: "vehicle",
    vrm: formatVrm(vrm),
    trace: true,
    make: v.make,
    model: v.model,
    colour: v.colour,
    keeperName: v.keeperName,
    keeperId: v.keeperId,
    // Absence of a "NO x" marker is taken as in order. The records hold
    // exceptions, not a full DVLA position, so this is the honest reading
    // of what is there.
    taxed: !has("NO TAX"),
    mot: !has("NO MOT"),
    insured: !has("NO INSURANCE"),
    markers,
    notes: v.notes ?? [],
  };
}

function personFrom(p: PersonRecord, typed: string): PersonReturn {
  const warnings = (p.markers ?? []).map((m) => ({ code: String(m) }));
  const code = (c: string) => warnings.some((w) => w.code === c);
  return {
    kind: "person",
    name: p.name || typed,
    trace: true,
    sex: p.sex,
    age: p.age,
    dob: dobOf(p),
    address: p.address,
    postcode: p.postcode,
    warnings,
    wanted: code("WANTED"),
    missing: code("MISSING"),
    notes: p.notes ?? [],
    vehicleIds: p.vehicleIds ?? [],
  };
}

/** A vehicle enquiry. Matches on the plate with spacing and case ignored,
 *  so "bn69 kvd" and "BN69KVD" are the same enquiry. */
export function vehicleCheck(index: RecordIndex, vrm: string): VehicleReturn {
  const want = squash(vrm);
  if (want.length < 2) {
    return { kind: "vehicle", vrm: formatVrm(vrm), trace: false, markers: [], notes: [] };
  }
  // The authored records always win: a scenario's vehicle keeps the detail
  // its author gave it. Anything else is generated, deterministically, so
  // the operator can type any plate and the same plate always answers the
  // same way.
  const hit = index.vehicles.find((v) => squash(v.vrm) === want);
  return vehicleFrom(hit ?? generateVehicle(vrm), vrm);
}

/** A person enquiry by name. A real terminal would want a date of birth
 *  to narrow it; this returns the single unambiguous match or no trace,
 *  rather than guessing between several people with the same surname. */
/** A names enquiry the way it is typed on the real terminal:
 *  `SURNAME/FORENAME:DDMMYYYY`. The forename and the date of birth are
 *  each optional — `DEAKIN`, `DEAKIN/CALLUM`, `DEAKIN:01011995` and
 *  `DEAKIN/CALLUM JOHN:01011995` all parse. Anything without a slash or
 *  a colon is taken as a free-text name ("Callum Deakin", "DEAKIN,
 *  Callum") as before. */
export function parsePersonQuery(raw: string): { name: string; dob?: string; structured: boolean } {
  const t = raw.trim();
  if (!/[/:]/.test(t)) return { name: t, structured: false };
  const [namePart, ...dobParts] = t.split(":");
  const dobRaw = dobParts.join(":").trim();
  const [surname = "", ...forenames] = namePart.split("/").map((x) => x.trim()).filter(Boolean);
  const name = [surname, forenames.join(" ")].filter(Boolean).join(", ");
  return { name, dob: dobRaw || undefined, structured: true };
}

/** A record as the terminal would be asked for it — "DEAKIN/CALLUM:04031995". */
export function personQueryFor(p: Pick<PersonRecord, "name" | "age" | "dob">): string {
  const n = p.name.trim();
  let surname: string;
  let forenames: string;
  if (n.includes(",")) {
    const [s, ...rest] = n.split(",");
    surname = s.trim();
    forenames = rest.join(" ").trim();
  } else {
    const parts = n.split(/\s+/);
    surname = parts[parts.length - 1];
    forenames = parts.slice(0, -1).join(" ");
  }
  const dob = dobOf(p);
  const ddmmyyyy = dob ? `${dob.slice(8, 10)}${dob.slice(5, 7)}${dob.slice(0, 4)}` : "";
  return `${surname}${forenames ? `/${forenames}` : ""}${ddmmyyyy ? `:${ddmmyyyy}` : ""}`.toUpperCase();
}

export function personCheck(
  index: RecordIndex,
  name: string,
  /** A date of birth, "1995-03-04", "04/03/1995" or the terminal's
   *  DDMMYYYY, narrows the enquiry the way a real terminal insists on. */
  dob?: string,
): PersonReturn & { ambiguous?: PersonRecord[] } {
  // The real syntax carries the date of birth inside the query.
  const parsed = parsePersonQuery(name);
  if (parsed.structured) {
    name = parsed.name;
    dob = dob?.trim() ? dob : parsed.dob;
  }
  const q = norm(name);
  if (q.length < 2) {
    return { kind: "person", name: name.trim(), trace: false, warnings: [], wanted: false, missing: false, notes: [], vehicleIds: [] };
  }
  const wantDob = normaliseDob(dob);
  // "DEAKIN, Callum", "Callum Deakin" and "deakin callum" are the same
  // enquiry: every word typed has to be in the record's name, in any
  // order. A surname alone matches everyone of that surname, and the
  // date of birth picks between them.
  const words = q.replace(/,/g, " ").split(/\s+/).filter(Boolean);
  const nameWords = (n: string) => norm(n).replace(/,/g, " ").split(/\s+/).filter(Boolean);
  let hits = index.people.filter((p) => {
    const nw = nameWords(p.name);
    return words.every((w) => nw.includes(w)) || norm(p.name).includes(q);
  });
  if (wantDob && hits.length > 0) {
    const byDob = hits.filter((p) => dobOf(p) === wantDob);
    if (byDob.length) hits = byDob;
    else {
      // A name on file with a different date of birth is not that
      // person. No trace — with the nearest record named, as the
      // terminal does, so the operator can re-check the details.
      const near = hits.slice(0, 3).map((p) => `${p.name} ${dobDisplay(dobOf(p)) ?? "DOB not held"}`);
      return { kind: "person", name: name.trim(), trace: false, warnings: [], wanted: false, missing: false, notes: [`NO TRACE ON THAT DATE OF BIRTH — similar: ${near.join("; ")}`], vehicleIds: [] };
    }
  }
  if (hits.length === 1) return personFrom(hits[0], name);
  if (hits.length > 1) {
    const exact = hits.filter((p) => nameWords(p.name).length === words.length);
    if (exact.length === 1) return personFrom(exact[0], name);
    return {
      ...personFrom(hits[0], name),
      trace: false,
      name: name.trim(),
      ambiguous: hits.slice(0, 8),
    };
  }
  // Nobody authored under that name, so the system holds a generated one.
  // A name typed with no surname is still ambiguous in reality, but the
  // sim answers it rather than stonewalling the operator.
  return personFrom(generatePerson(name), name);
}

/** "04/03/1995", "4.3.95" or "1995-03-04" → "1995-03-04". */
export function normaliseDob(dob: string | undefined): string | undefined {
  if (!dob) return undefined;
  const t = dob.trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  // The terminal's own form: DDMMYYYY, no separators.
  m = t.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = t.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/);
  if (!m) return undefined;
  const y = m[3].length === 2 ? (Number(m[3]) > 26 ? `19${m[3]}` : `20${m[3]}`) : m[3];
  return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

/** An address enquiry: who is there, and what is kept there. */
export function addressCheck(index: RecordIndex, query: string): AddressReturn {
  const q = norm(query);
  if (q.length < 3) {
    return { kind: "address", address: query.trim(), trace: false, occupants: [], vehicles: [], notes: [] };
  }
  // An authored place first — a scenario's premises carries its own notes.
  const authored = index.places.find(
    (p) => norm(p.address ?? "").includes(q) || norm(p.name).includes(q) || squash(p.postcode ?? "") === squash(query),
  );
  const gen = generateAddress(query);
  const occupants = gen.occupants.map((o) => ({
    name: o.name,
    age: o.age,
    markers: (o.markers ?? []).map((m) => ({ code: String(m) })),
  }));
  const vehicles = gen.vehicles.map((v) => ({
    vrm: v.vrm,
    make: v.make,
    model: v.model,
    markers: (v.markers ?? []).map((m) => ({ code: String(m) })),
  }));
  return {
    kind: "address",
    address: (authored?.address ?? query).trim(),
    trace: true,
    postcode: authored?.postcode ?? gen.postcode,
    occupants,
    vehicles,
    notes: authored?.notes ?? [],
  };
}

/** One line for the audit, and for the dispatch log. */
export function auditLine(c: LedsCheck): string {
  const what =
    c.kind === "vehicle"
      ? `vehicle ${(c.result as VehicleReturn).vrm}`
      : c.kind === "address"
        ? `address ${c.query.trim()}`
        : `person ${c.query.trim()}`;
  const outcome = !c.result.trace
    ? "no trace"
    : isHot(c.result)
      ? "MARKERS — see return"
      : "trace, nothing of note";
  return `LEDS check — ${what} · ${POLICING_PURPOSES[c.purpose]} · ${outcome}`;
}

/** Checks run without a job on the desk and without a written reason.
 *
 *  Not an accusation — there are proper reasons to run one, and the sim
 *  does not block it. But a control room audit would pick these out, and
 *  so does the debrief, which is the point of modelling the purpose at
 *  all. */
export function unexplainedChecks(checks: LedsCheck[]): LedsCheck[] {
  return checks.filter((c) => !c.incidentId && !c.reason?.trim());
}
