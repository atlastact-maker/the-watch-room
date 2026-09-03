import fireJson from "@/../data/research/fire/gmfrs_stations.json";
import typesJson from "@/../data/research/fire/appliance_types.json";
import nwasJson from "@/../data/research/ambulance/nwas_stations.json";
import gmpJson from "@/../data/research/police/gmp_stations.json";
import type {
  Appliance,
  ApplianceCapability,
  ApplianceType,
  ApplianceTypeCode,
  AreaCode,
  PodType,
  PodTypeCode,
  ServiceCode,
  Station,
} from "./types";
import { MAKE_MODEL, generateVrm } from "./vehicles";
import { buildCrewMembers } from "./crew";

const APPLIANCE_TYPES = typesJson.types as Record<ApplianceTypeCode, ApplianceType>;
const POD_TYPES = typesJson.pods as Record<PodTypeCode, PodType>;

type RawStation = {
  id: string;
  name: string;
  staffing?: string;
  appliances?: string[]; // fire file
  resources?: string[];  // ambulance file
  address?: string | null;
  town?: string | null;
  postcode?: string | null;
  coords?: { lat: number; lng: number; approximate?: boolean } | null;
  notes?: string;
  closedSince2021?: boolean;
  pts_only?: boolean;
  /** Exact callsigns, per type code — the real over-air identities where
   *  the project knows them. An authored list also SETS the count for
   *  that type, so it can add a type the resources line never mentioned.
   *  See NWAS_CALLSIGN_PREFIX for the scheme the numbers sit in. */
  callsigns?: Record<string, string[] | undefined>;
};

/** Parse a "pods: 2x HVP/HVHL" line from the raw station data into a list
 *  of pod codes kept at this station. */
function extractAvailablePods(rawList: string[] | undefined): PodTypeCode[] | undefined {
  if (!rawList) return undefined;
  const out = new Set<PodTypeCode>();
  for (const line of rawList) {
    const m = /^pods?:\s*(.+)$/i.exec(line.trim());
    if (!m) continue;
    // After the "pods:" prefix we expect tokens like "2x HVP/HVHL" or "HVP, UTC".
    // Strip counts and split by slash / comma / whitespace.
    const body = m[1].replace(/\d+x\s*/gi, "");
    for (const tok of body.split(/[\s,\/]+/)) {
      const t = tok.trim().toUpperCase();
      if (t && isPodCode(t)) out.add(t);
    }
  }
  return out.size > 0 ? Array.from(out) : undefined;
}

function isPodCode(s: string): s is PodTypeCode {
  return s === "EPU" || s === "HVP" || s === "HVHL" || s === "UTC" || s === "MDU";
}

function buildStationList(
  raw: { areas: { name: string; stations: RawStation[] }[] },
  service: ServiceCode,
): Station[] {
  return raw.areas.flatMap((area) =>
    area.stations
      .filter((s) => !s.closedSince2021 && s.coords)
      .map(
        (s): Station => ({
          id: s.id,
          name: s.name,
          area: area.name as AreaCode,
          service,
          staffing: s.staffing,
          address: s.address ?? undefined,
          town: s.town ?? undefined,
          postcode: s.postcode ?? undefined,
          coords: { lat: s.coords!.lat, lng: s.coords!.lng },
          notes: s.notes,
          coordsApproximate: s.coords!.approximate === true,
          ptsOnly: s.pts_only === true,
          availablePods: extractAvailablePods(s.appliances ?? s.resources),
        }),
      ),
  );
}

export const STATIONS: Station[] = [
  ...buildStationList(fireJson, "Fire"),
  ...buildStationList(nwasJson, "Ambulance"),
  ...buildStationList(gmpJson, "Police"),
];

export function getApplianceType(code: ApplianceTypeCode): ApplianceType | undefined {
  return APPLIANCE_TYPES[code];
}

export function getPodType(code: PodTypeCode): PodType | undefined {
  return POD_TYPES[code];
}

type Parsed = {
  count: number;
  type: ApplianceTypeCode;
  podType?: PodTypeCode;
  note?: string;
  /** "@P2"-style pin from the raw string — the real designator where the
   *  type's default sequence would generate the wrong callsign. */
  designatorOverride?: string;
  /** "+UHPL"/"+HRET" flags from the raw string. */
  capabilities?: ApplianceCapability[];
};

function parseApplianceString(raw: string): Parsed[] {
  let trimmed = raw.trim();

  // Strip designator pins and capability flags before the type regexes
  // run: "1x WFU @M6", "1x WrT @P1 +HRET". "+EPU"-style pod suffixes are
  // left alone — only known capability tokens are consumed.
  let designatorOverride: string | undefined;
  const capabilities: ApplianceCapability[] = [];
  trimmed = trimmed.replace(/\s@([A-Z]\d+)\b/g, (_, d: string) => {
    designatorOverride = d;
    return "";
  });
  trimmed = trimmed.replace(/\s\+(UHPL|HRET)\b/g, (_, c: string) => {
    capabilities.push(c as ApplianceCapability);
    return "";
  });
  const decorate = (list: Parsed[]): Parsed[] =>
    list.map((p) => ({
      ...p,
      designatorOverride,
      capabilities: capabilities.length > 0 ? capabilities : undefined,
    }));

  if (trimmed.toLowerCase().startsWith("pods:")) return [];

  // "1x PM (UTC pod)" / "1x PM+EPU"
  const podMatch = /^(\d+)x\s+PM\s*(?:\(([A-Z]+)\s*pod\)|\+([A-Z]+))$/i.exec(trimmed);
  if (podMatch) {
    return decorate([
      {
        count: Number(podMatch[1]),
        type: "PM",
        podType: (podMatch[2] || podMatch[3]) as PodTypeCode,
      },
    ]);
  }

  // HART fleet, written out in NWAS's own vehicle-role language (FOI24477)
  // rather than type codes, so the station file still reads like the
  // source document. Longest phrases first — "ATV carrier" must win over
  // "ATV", and "off-road IRU" over "IRU".
  const HART_RESOURCE: [RegExp, ApplianceTypeCode][] = [
    [/^(\d+)x\s+HART\s+(?:off-road\s+IRU|4x4)$/i, "HART_ORIRU"],
    [/^(\d+)x\s+HART\s+ATV\s+carrier$/i, "HART_carrier"],
    [/^(\d+)x\s+HART\s+ATV$/i, "HART_ATV"],
    [/^(\d+)x\s+HART\s+personnel\s+carrier$/i, "HART_PCV"],
    [/^(\d+)x\s+HART\s+(?:multi-casualty|ISU)$/i, "NWAS_IRU"],
    [/^(\d+)x\s+HART\s+RRV$/i, "HART_RRV"],
    [/^(\d+)x\s+HART\s+(?:IRU|vehicle)$/i, "HART_vehicle"],
  ];
  for (const [re, type] of HART_RESOURCE) {
    const m = re.exec(trimmed);
    if (m) return decorate([{ count: Number(m[1]), type }]);
  }

  // "1x HEMS helicopter" / "1x IRU" / "1x BASICS volunteer…" — match first capitalised token
  const hemsMatch = /^(\d+)x\s+HEMS/i.exec(trimmed);
  if (hemsMatch) return decorate([{ count: Number(hemsMatch[1]), type: "HEMS" }]);

  const cccMatch = /^(\d+)x\s+CCC$/i.exec(trimmed);
  if (cccMatch) return decorate([{ count: Number(cccMatch[1]), type: "CCC" }]);

  const qrMatch = /^(\d+)x\s+QR$/i.exec(trimmed);
  if (qrMatch) return decorate([{ count: Number(qrMatch[1]), type: "QR" }]);

  const odMatch = /^(\d+)x\s+OD$/i.exec(trimmed);
  if (odMatch) return decorate([{ count: Number(odMatch[1]), type: "OD" }]);

  // "1x IRU" — ambulance IRU (ambiguous with fire IRU; we're only using in ambulance context)
  const iruMatch = /^(\d+)x\s+IRU/i.exec(trimmed);
  if (iruMatch) return decorate([{ count: Number(iruMatch[1]), type: "NWAS_IRU" }]);

  // "1x WrT (Trial Basis)" — parenthetical as note
  const noteMatch = /^(\d+)x\s+(\w+)\s*\(([^)]+)\)$/.exec(trimmed);
  if (noteMatch) {
    return decorate([
      {
        count: Number(noteMatch[1]),
        type: noteMatch[2] as ApplianceTypeCode,
        note: noteMatch[3],
      },
    ]);
  }

  // "1x WrL" / "2x WrL" / "3x DCA" / "1x RRV"
  const simple = /^(\d+)x\s+(\w+)$/.exec(trimmed);
  if (simple) {
    let type = simple[2] as ApplianceTypeCode;
    if ((type as string) === "TRU") type = "TRU_pump";
    return decorate([{ count: Number(simple[1]), type }]);
  }

  return [];
}

// A small seeded generator, so anything "random" about an appliance —
// its plate, for one — is the same on every render and every reload.
// A plate the operator noted from the vehicle sheet must still find the
// vehicle after the page has been refreshed.
function seededRng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic 3-digit pseudo-random from a string seed. Keeps NWAS callsigns
// stable across server renders while still looking "picked" rather than sequential.
function seeded3(seed: string): string {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  }
  return String(100 + (Math.abs(h) % 900));
}

// 2-digit variant for GMP unit numbers (smaller fleet per division than
// NWAS's service-wide pool).
function seeded2(seed: string): string {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  }
  return String(10 + (Math.abs(h) % 90));
}

// NWAS over-air callsigns: a service-wide prefix followed immediately by a
// unit number — no separator. Real examples from the Southport Inquiry
// evidence (NWAS001083): A611, A645 (emergency ambulances), R646 (a Senior
// Paramedic Team Leader solo on an RRV), QX616 / QX617 (Advanced
// Paramedics), BX1792 (Operational Commander), MX5877 (a MERIT doctor),
// H08 / H58 (HEMS assets).
//
// The prefix table is NWAS's own, published in FOI2376 (3 June 2021):
//   A  Ambulance (Emergency)          R   Rapid Response Vehicle
//   QX Advanced Paramedic             MX  Medical / Consultant Paramedic
//   BX Operational Commander          SX  Tactical Commander
//   GX Strategic Commander            Z   Hazardous Area Response Team
//   H  HEMS Vehicle                   MA  Medical Advisor / MERIT
//
// BX carries the Duty Officer — the Band 7 post NWAS created in its
// 2024/25 leadership review, trained to NARU Operational Commander level
// and fielded as the "first line operational leadership response to
// incidents" (NWAS Annual Report 2024/25). That is this sim's incident
// officer.
//
// The NUMBERS are ours: NWAS withholds the callsign-number-to-area mapping
// under s24 (national security), refused in FOI24459 and FOI25042. They are
// seeded off the station id so they stay stable across renders.
// The NWAS callsign scheme in full, as supplied by the project owner
// (U6). Two entries changed with it: BASICS moves from MA to MX, because
// MA is the Medical Advisor / MERIT series; and the critical care car
// moves from H to HX, because H is the helicopter and HX is the HEMS
// response car. Both were the sim's own guesses before.
const NWAS_CALLSIGN_PREFIX: Partial<Record<ApplianceTypeCode, string>> = {
  DCA: "A",          // Ambulance (emergency)
  UCA: "U",          // Urgent Care Ambulance
  RRV: "R",          // Rapid Response Vehicle
  CYC: "C",          // Cycle Responder
  QR: "QX",          // Advanced Paramedic
  DUTY_OFF: "DX",    // Duty Officer
  BASICS: "MX",      // BASICS
  CHAP: "CX",        // Clinical Hub Advanced Practitioner
  MIV: "M",          // Major Incident Vehicle
  MERIT: "MA",       // Medical Advisor / MERIT
  OD: "BX",          // Operational Commander
  TAC_CMD: "SX",     // Tactical Commander
  STRAT_CMD: "GX",   // Strategic Commander
  TAC_ADV: "TX",     // Tactical Advisor
  CCC: "HX",         // HEMS RRV — the NWAA critical care car
  CFR: "FR",         // Community First Responder
  STAFF_RESP: "SR",  // Staff Responder
  // HART runs a single Z series across the whole team, whatever the
  // vehicle — Z is the published prefix; the 3xx block is enthusiast
  // observation (Z301 / Z304), not an NWAS disclosure.
  HART_vehicle: "Z",
  NWAS_IRU: "Z",
  HART_PCV: "Z",
  HART_ORIRU: "Z",
  HART_ATV: "Z",
  HART_carrier: "Z",
  HART_RRV: "Z",
};

/** Types whose unit numbers come from the HART 3xx block rather than the
 *  general 100-999 pool. */
const HART_TYPES = new Set<ApplianceTypeCode>([
  "HART_vehicle",
  "NWAS_IRU",
  "HART_PCV",
  "HART_ORIRU",
  "HART_ATV",
  "HART_carrier",
  "HART_RRV",
]);

// GMP over-air callsigns follow a typical UK police pattern: a division
// letter code (MP = Manchester P-division / Greater Manchester) plus a
// numeric unit. We synthesise unit numbers from a deterministic seed so
// they stay stable across renders without needing to author every one.
//   MPx-XXX  — Response vehicle
//   AR-XX   — Armed Response Vehicle (Tactical Aid / specialist)
//   NPAS    — Helicopter (fixed designator)
//   PD-XX   — Dog unit
//   RPU-XX  — Roads Policing motorbike
//   POLSA-X — Specialist search team
//   SIO-X   — Senior Investigating Officer car
const GMP_CALLSIGN_PREFIX: Partial<Record<ApplianceTypeCode, string>> = {
  Police_Response: "MP",
  Police_ARV: "AR",
  Police_Dog: "PD",
  Police_TraffMot: "RPU",
  Police_RPU: "RP",
  Police_Search: "POLSA",
};

/** Real pod callsigns from the GMFRS fleet register (F3). A pod is
 *  demountable, so its callsign belongs to the station that holds it and
 *  not to the Prime Mover that happens to be carrying it: Stretford's
 *  high volume pump is G10N981 whoever lifts it. The register's own form
 *  is station id + number, which is what podCallsign returns.
 *
 *  N591 is the register's number for the Farnworth mass decontamination
 *  pod. The owner's list gives N570 for the MDU; one of the two is
 *  wrong and the register wins until that is settled — see gaps.md. */
const POD_CALLSIGN_SUFFIX: Record<string, Partial<Record<PodTypeCode, string>>> = {
  G10: { HVP: "N981", HVHL: "N991" },
  G50: { HVP: "N982", HVHL: "N992" },
  G36: { EPU: "N851" },
  G53: { MDU: "N591", UTC: "N755" },
};

/** The pod's real callsign at this station, e.g. "G53N755". */
export function podCallsign(stationId: string, pod: PodTypeCode): string | undefined {
  const suffix = POD_CALLSIGN_SUFFIX[stationId]?.[pod];
  return suffix ? `${stationId}${suffix}` : undefined;
}

/** Every callsign the station files author by hand. Generated numbers
 *  steer around these. */
const RESERVED_CALLSIGNS: Set<string> = (() => {
  const out = new Set<string>();
  const files = [fireJson, nwasJson, gmpJson] as unknown as {
    areas: { stations: RawStation[] }[];
  }[];
  for (const file of files) {
    for (const area of file.areas) {
      for (const s of area.stations) {
        for (const list of Object.values(s.callsigns ?? {})) {
          for (const cs of list ?? []) out.add(cs);
        }
      }
    }
  }
  return out;
})();

export function buildAppliances(
  station: Station,
  rawList: string[],
  authored?: Record<string, string[] | undefined>,
): Appliance[] {
  const out: Appliance[] = [];
  // Short station id for callsign composition. GMFRS keeps the "G" prefix so
  // the callsign reads like real radio traffic: G50 → "G50P1". NWAS strips
  // the "A-" so "A-BOL" → "BOL" before its own NWAS-prefix logic kicks in.
  const stationShort = station.id.replace(/^A-/, "");
  const isForceWide = station.area === "ForceWide";
  const separator = station.service === "Fire" ? "" : "-";

  // What this station holds: the resources line, then any authored
  // callsign list, which sets the count for its type and can introduce a
  // type the resources line never mentioned.
  const plan: Parsed[] = [];
  for (const raw of rawList) plan.push(...parseApplianceString(raw));
  if (authored) {
    for (const [key, list] of Object.entries(authored)) {
      if (!Array.isArray(list) || list.length === 0) continue;
      const t = key as ApplianceTypeCode;
      const existing = plan.find((p) => p.type === t);
      if (existing) existing.count = list.length;
      else plan.push({ count: list.length, type: t });
    }
  }

  for (const parsed of plan) {
    {
      const type = APPLIANCE_TYPES[parsed.type];
      if (!type) continue;
      for (let i = 1; i <= parsed.count; i++) {
        const ordinal = countSoFar(out, parsed.type) + 1;
        const authoredCallsign = authored?.[parsed.type]?.[ordinal - 1];

        const nwasPrefix = NWAS_CALLSIGN_PREFIX[parsed.type];
        const gmpPrefix = GMP_CALLSIGN_PREFIX[parsed.type];
        let designator: string;
        let callsign: string;
        if (authoredCallsign) {
          // A real over-air identity the project knows. It is the
          // callsign and the designator both — nothing is composed.
          designator = authoredCallsign;
          callsign = authoredCallsign;
        } else if (nwasPrefix) {
          // NWAS: service-wide unit-number callsign, not tied to the
          // station, and no separator — "A645", not "A-645".
          const unitFor = (seed: string): string =>
            HART_TYPES.has(parsed.type)
              ? // HART runs a 3xx block — Z302, Z304 in the wild.
                String(300 + (Number(seeded3(seed)) % 90))
              : parsed.type === "CCC"
                ? // NWAA assets carry short numbers: HX03, HX58, HX75.
                  String(Number(seeded3(seed)) % 100).padStart(2, "0")
                : seeded3(seed);
          const baseSeed = `${station.id}-${parsed.type}-${ordinal}`;
          let unit = unitFor(baseSeed);
          // Steer off any callsign the station files author by hand.
          for (let salt = 1; salt <= 64 && RESERVED_CALLSIGNS.has(`${nwasPrefix}${unit}`); salt++) {
            unit = unitFor(`${baseSeed}#${salt}`);
          }
          designator = `${nwasPrefix}${unit}`;
          callsign = designator;
        } else if (gmpPrefix) {
          // GMP: divisional unit number. Response cars get a division
          // letter ("MP"/station-stub) + 2-digit unit. Specialist cars
          // (ARV/Dog/RPU/POLSA) get a flat prefix + unit.
          if (parsed.type === "Police_Response") {
            // Use a short station stub so callsigns read like "MP-Trafford 12".
            const stub = station.id.replace(/^MP-/, "");
            designator = `${gmpPrefix}${stub}-${seeded2(`${station.id}-${parsed.type}-${ordinal}`)}`;
          } else {
            designator = `${gmpPrefix}-${seeded2(`${station.id}-${parsed.type}-${ordinal}`)}`;
          }
          callsign = designator;
        } else {
          const designators = type.designators ?? [];
          designator =
            parsed.designatorOverride ??
            designators[ordinal - 1] ??
            `${type.callsignCategory}${ordinal}`;
          // Force-wide stations (HART base, NWAA Barton, BASICS) use the
          // designator alone — the designator is already a full over-air
          // callsign (e.g. "Z301", "HELIMED 72"), so stapling the station
          // id in front would read awkwardly.
          callsign = isForceWide
            ? designator
            : `${stationShort}${separator}${designator}`;
        }
        const mm = MAKE_MODEL[parsed.type] ?? { make: "—", model: type.fullName };
        const applianceId = `${station.id}-${designator}`;
        out.push({
          id: applianceId,
          callsign,
          stationId: station.id,
          service: station.service,
          type: parsed.type,
          typeName: parsed.podType
            ? `${type.fullName} (carrying ${[podCallsign(station.id, parsed.podType), POD_TYPES[parsed.podType]?.fullName ?? parsed.podType].filter(Boolean).join(" ")})`
            : type.fullName,
          podType: parsed.podType,
          capabilities: parsed.capabilities,
          status: 7,
          crew: { current: type.crew.max, min: type.crew.min, max: type.crew.max },
          crewMembers: buildCrewMembers(applianceId, parsed.type, station.service, designator),
          waterLitres: type.waterLitres,
          kit: parsed.podType
            ? [...type.kit, ...(POD_TYPES[parsed.podType]?.kit ?? [])]
            : type.kit,
          note: parsed.note,
          make: mm.make,
          model: mm.model,
          vrm: generateVrm(seededRng(`${applianceId}:vrm`)),
          fuelPct: 100,
          waterPct: 100,
          conditionPct: 100,
        });
      }
    }
  }
  return out;

  function countSoFar(arr: Appliance[], t: ApplianceTypeCode) {
    return arr.filter((a) => a.type === t).length;
  }
}

export function getStationAppliances(stationId: string): Appliance[] {
  for (const area of fireJson.areas) {
    const s = (area.stations as RawStation[]).find((x) => x.id === stationId);
    if (s) {
      const station = STATIONS.find((st) => st.id === stationId);
      if (!station) return [];
      return buildAppliances(station, s.appliances ?? [], s.callsigns);
    }
  }
  for (const area of nwasJson.areas) {
    const s = (area.stations as RawStation[]).find((x) => x.id === stationId);
    if (s) {
      const station = STATIONS.find((st) => st.id === stationId);
      if (!station) return [];
      return buildAppliances(station, s.resources ?? [], s.callsigns);
    }
  }
  for (const area of gmpJson.areas) {
    const s = (area.stations as RawStation[]).find((x) => x.id === stationId);
    if (s) {
      const station = STATIONS.find((st) => st.id === stationId);
      if (!station) return [];
      return buildAppliances(station, s.resources ?? [], s.callsigns);
    }
  }
  return [];
}
