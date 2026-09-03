// The records behind the desk's searches: people, vehicles and places.
//
// A control room does not search "the map". It searches records — the
// caller's details, a PNC person check, a vehicle by its plate, an
// address with its premises risk — and the map is where the answer is
// put. So the searchable thing is a record set: every person a scenario
// names (caller, patient, suspect, witness, keeper), every vehicle it
// involves, every place it touches, plus what the sim already knows —
// the fleet and its crews, the stations, the hospitals, and the jobs
// live on the stack.
//
// Records are authored per scenario in src/lib/sim/records/*.ts and
// merged with the derived ones at runtime by buildRecordIndex(). Person
// and vehicle records are FICTIONAL. Places follow the house rule for
// scenarios: a real street, a fictional number.
//
// Markers follow the shape of the real thing — a PNC person record
// carries warning signals, a vehicle record carries reports — but the
// wording is ours and nothing here is drawn from any real system.

import type { Incident, Scenario } from "./incident_types";
import type { Station } from "./types";
import type { Hospital } from "./hospitals";

// ---------------------------------------------------------------------------
// Record types
// ---------------------------------------------------------------------------

export type PersonRole =
  | "caller"
  | "patient"
  | "suspect"
  | "victim"
  | "witness"
  | "keeper"
  | "occupant"
  | "crew";

/** Warning markers, in the spirit of PNC warning signals. Free text is
 *  allowed but these are the ones the UI colours. */
export type PersonMarker =
  | "VIOLENT"
  | "FIREARMS"
  | "WEAPONS"
  | "DRUGS"
  | "MENTAL HEALTH"
  | "SELF HARM"
  | "MEDICAL"
  | "MISSING"
  | "WANTED"
  | "VULNERABLE"
  | "CHILD"
  | "CONTAGIOUS"
  | "ESCAPER"
  | "ALLERGY"
  | (string & {});

export type PersonRecord = {
  id: string;
  /** "SURNAME, Forename" reads like a record; the UI shows it as typed. */
  name: string;
  sex?: "M" | "F" | "X";
  /** Age at the time of the scenario, or a date of birth. Either. */
  age?: number;
  dob?: string;
  address?: string;
  postcode?: string;
  phone?: string;
  roles: PersonRole[];
  markers?: PersonMarker[];
  /** Short intelligence / history lines, newest first. */
  notes?: string[];
  /** Which scenario put this person on the desk. Absent for derived
   *  records (crew). */
  scenarioId?: string;
  /** Links into the sim, when the person IS something the sim tracks. */
  casualtyId?: string;
  applianceId?: string;
  vehicleIds?: string[];
};

export type VehicleMarker =
  | "STOLEN"
  | "NO INSURANCE"
  | "NO MOT"
  | "NO TAX"
  | "ANPR INTEREST"
  | "PNC MARKER"
  | "DISQUALIFIED KEEPER"
  | "HAZMAT"
  | "ABANDONED"
  | (string & {});

export type VehicleRecord = {
  id: string;
  /** UK VRM as displayed: "BN69 KVD". Search normalises spaces and case. */
  vrm: string;
  make: string;
  model: string;
  colour?: string;
  /** Registered keeper — a PersonRecord id when authored. */
  keeperId?: string;
  keeperName?: string;
  markers?: VehicleMarker[];
  notes?: string[];
  scenarioId?: string;
  /** The sim's own appliance, for fleet vehicles. */
  applianceId?: string;
  /** The CRS schematic id, for a scenario's crashed vehicle. */
  crsId?: string;
};

export type PlaceKind = "station" | "hospital" | "scene" | "premises" | "landmark";

export type PlaceRecord = {
  id: string;
  kind: PlaceKind;
  name: string;
  address: string;
  postcode?: string;
  coords: { lat: number; lng: number };
  /** Premises risk / PRI-style lines. */
  notes?: string[];
  scenarioId?: string;
  stationId?: string;
  hospitalId?: string;
  /** Set when the place is a job currently on the stack. */
  incidentId?: string;
};

/** What a scenario contributes. Authored in src/lib/sim/records/. */
export type RecordSet = {
  scenarioId: string;
  people: PersonRecord[];
  vehicles: VehicleRecord[];
  places: PlaceRecord[];
};

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

export type RecordIndex = {
  people: PersonRecord[];
  vehicles: VehicleRecord[];
  places: PlaceRecord[];
};

/** Normalise a VRM for matching: uppercase, no spaces. */
export function normaliseVrm(v: string): string {
  return v.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Build the searchable index: authored record sets plus what the sim
 *  already knows about. Live incidents become "scene" places so the
 *  operator can search the jobs on the stack by address too. */
export function buildRecordIndex(args: {
  sets: RecordSet[];
  stations: Station[];
  hospitals: Hospital[];
  scenarios: Scenario[];
  incidents: Incident[];
  /** Fleet crews, as (appliance id, callsign, station name, member). */
  crews: { applianceId: string; callsign: string; stationName: string; member: { id: string; name: string; role: string } }[];
  fleet: { applianceId: string; callsign: string; stationName: string; make: string; model: string; vrm: string; typeName: string }[];
}): RecordIndex {
  const people: PersonRecord[] = [];
  const vehicles: VehicleRecord[] = [];
  const places: PlaceRecord[] = [];

  for (const set of args.sets) {
    people.push(...set.people);
    vehicles.push(...set.vehicles);
    places.push(...set.places);
  }

  // Crews: every named rider in the fleet.
  for (const c of args.crews) {
    people.push({
      id: `crew:${c.member.id}`,
      name: c.member.name,
      roles: ["crew"],
      applianceId: c.applianceId,
      notes: [`${c.member.role} · ${c.callsign} · ${c.stationName}`],
    });
  }

  // Fleet vehicles by VRM.
  for (const f of args.fleet) {
    vehicles.push({
      id: `fleet:${f.applianceId}`,
      vrm: f.vrm,
      make: f.make,
      model: f.model,
      applianceId: f.applianceId,
      keeperName: f.stationName,
      notes: [`${f.typeName} · ${f.callsign}`],
    });
  }

  // Stations and hospitals as places.
  for (const s of args.stations) {
    places.push({
      id: `station:${s.id}`,
      kind: "station",
      name: s.name,
      address: [s.address, s.town].filter(Boolean).join(", "),
      postcode: s.postcode,
      coords: s.coords,
      stationId: s.id,
      notes: s.staffing ? [s.staffing] : undefined,
    });
  }
  for (const h of args.hospitals) {
    places.push({
      id: `hospital:${h.id}`,
      kind: "hospital",
      name: h.name,
      address: h.address,
      postcode: h.postcode,
      coords: h.coords,
      hospitalId: h.id,
    });
  }

  // Every scenario's location is a known premises; the ones on the stack
  // are scenes.
  const liveByScenario = new Map<string, Incident>();
  for (const inc of args.incidents) liveByScenario.set(inc.scenarioId, inc);
  for (const sc of args.scenarios) {
    const live = liveByScenario.get(sc.id);
    places.push({
      id: `scenario:${sc.id}`,
      kind: live ? "scene" : "premises",
      name: sc.title,
      address: sc.location.address,
      postcode: sc.location.postcode,
      coords: sc.location.coords,
      scenarioId: sc.id,
      incidentId: live?.id,
      notes: [
        ...sc.property.knownHazards.map((h) => `Hazard: ${h}`),
        ...sc.property.vulnerabilities.map((v) => `Vulnerability: ${v}`),
        ...sc.pri.items,
      ],
    });
  }

  return { people, vehicles, places };
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export type SearchKind = "person" | "vehicle" | "place";

export type SearchHit =
  | { kind: "person"; score: number; record: PersonRecord }
  | { kind: "vehicle"; score: number; record: VehicleRecord }
  | { kind: "place"; score: number; record: PlaceRecord };

function scoreText(query: string, fields: (string | undefined)[]): number {
  const q = norm(query);
  if (!q) return 0;
  const tokens = q.split(" ").filter(Boolean);
  let best = 0;
  for (const f of fields) {
    if (!f) continue;
    const t = norm(f);
    if (t === q) return 100;
    if (t.startsWith(q)) best = Math.max(best, 80);
    else if (t.includes(q)) best = Math.max(best, 60);
    else {
      // Every token present somewhere in the field.
      const all = tokens.every((tok) => t.includes(tok));
      if (all) best = Math.max(best, 40 + Math.min(19, tokens.length * 5));
    }
  }
  return best;
}

export function searchRecords(index: RecordIndex, kind: SearchKind, query: string, limit = 25): SearchHit[] {
  const q = query.trim();
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];

  if (kind === "person") {
    for (const p of index.people) {
      const s = Math.max(
        scoreText(q, [p.name, p.address, p.postcode, p.phone, p.dob]),
        // "surname, forename" and "forename surname" both find them.
        scoreText(q, [p.name.split(",").reverse().join(" ")]),
      );
      if (s > 0) hits.push({ kind: "person", score: s, record: p });
    }
  } else if (kind === "vehicle") {
    const qv = normaliseVrm(q);
    for (const v of index.vehicles) {
      let s = 0;
      if (qv.length >= 2) {
        const nv = normaliseVrm(v.vrm);
        if (nv === qv) s = 100;
        else if (nv.startsWith(qv)) s = 85;
        else if (nv.includes(qv)) s = 65;
      }
      s = Math.max(s, scoreText(q, [`${v.make} ${v.model}`, v.colour, v.keeperName, ...(v.notes ?? [])]) - 10);
      if (s > 0) hits.push({ kind: "vehicle", score: s, record: v });
    }
  } else {
    for (const p of index.places) {
      const s = scoreText(q, [p.name, p.address, p.postcode]);
      if (s > 0) hits.push({ kind: "place", score: s, record: p });
    }
  }

  hits.sort((a, b) => b.score - a.score || labelOf(a).localeCompare(labelOf(b)));
  return hits.slice(0, limit);
}

function labelOf(h: SearchHit): string {
  switch (h.kind) {
    case "person":
      return h.record.name;
    case "vehicle":
      return h.record.vrm;
    default:
      return h.record.name;
  }
}
