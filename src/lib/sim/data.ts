import fireJson from "@/../data/research/fire/gmfrs_stations.json";
import typesJson from "@/../data/research/fire/appliance_types.json";
import nwasJson from "@/../data/research/ambulance/nwas_stations.json";
import gmpJson from "@/../data/research/police/gmp_stations.json";
import type {
  Appliance,
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
  return s === "EPU" || s === "HVP" || s === "HVHL" || s === "UTC";
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

export function getStationsByArea(area: AreaCode): Station[] {
  // `ForceWide` stations surface in every patch.
  return STATIONS.filter((s) => s.area === area || s.area === "ForceWide");
}

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
};

function parseApplianceString(raw: string): Parsed[] {
  const trimmed = raw.trim();

  if (trimmed.toLowerCase().startsWith("pods:")) return [];

  // "1x PM (UTC pod)" / "1x PM+EPU"
  const podMatch = /^(\d+)x\s+PM\s*(?:\(([A-Z]+)\s*pod\)|\+([A-Z]+))$/i.exec(trimmed);
  if (podMatch) {
    return [
      {
        count: Number(podMatch[1]),
        type: "PM",
        podType: (podMatch[2] || podMatch[3]) as PodTypeCode,
      },
    ];
  }

  // "3x HART vehicle" (multi-word type) — normalise to HART_vehicle
  const hartVehicle = /^(\d+)x\s+HART\s+vehicle$/i.exec(trimmed);
  if (hartVehicle) {
    return [{ count: Number(hartVehicle[1]), type: "HART_vehicle" }];
  }

  // "1x HEMS helicopter" / "1x IRU" / "1x BASICS volunteer…" — match first capitalised token
  const hemsMatch = /^(\d+)x\s+HEMS/i.exec(trimmed);
  if (hemsMatch) return [{ count: Number(hemsMatch[1]), type: "HEMS" }];

  const cccMatch = /^(\d+)x\s+CCC$/i.exec(trimmed);
  if (cccMatch) return [{ count: Number(cccMatch[1]), type: "CCC" }];

  const qrMatch = /^(\d+)x\s+QR$/i.exec(trimmed);
  if (qrMatch) return [{ count: Number(qrMatch[1]), type: "QR" }];

  const odMatch = /^(\d+)x\s+OD$/i.exec(trimmed);
  if (odMatch) return [{ count: Number(odMatch[1]), type: "OD" }];

  // "1x IRU" — ambulance IRU (ambiguous with fire IRU; we're only using in ambulance context)
  const iruMatch = /^(\d+)x\s+IRU/i.exec(trimmed);
  if (iruMatch) return [{ count: Number(iruMatch[1]), type: "NWAS_IRU" }];

  // "1x WrT (Trial Basis)" — parenthetical as note
  const noteMatch = /^(\d+)x\s+(\w+)\s*\(([^)]+)\)$/.exec(trimmed);
  if (noteMatch) {
    return [
      {
        count: Number(noteMatch[1]),
        type: noteMatch[2] as ApplianceTypeCode,
        note: noteMatch[3],
      },
    ];
  }

  // "1x WrL" / "2x WrL" / "3x DCA" / "1x RRV"
  const simple = /^(\d+)x\s+(\w+)$/.exec(trimmed);
  if (simple) {
    let type = simple[2] as ApplianceTypeCode;
    if ((type as string) === "TRU") type = "TRU_pump";
    return [{ count: Number(simple[1]), type }];
  }

  return [];
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

// NWAS over-air callsigns use a service-wide prefix + 3-digit unit number.
//   A-XXX   — Double-Crewed Ambulance
//   RX-XXX  — Rapid Response Vehicle
//   QR-XXX  — Advanced Paramedic (not currently in the dataset; reserved)
const NWAS_CALLSIGN_PREFIX: Partial<Record<ApplianceTypeCode, string>> = {
  DCA: "A",
  RRV: "RX",
  QR: "QR",
  OD: "OD",
};

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

export function buildAppliances(
  station: Station,
  rawList: string[],
): Appliance[] {
  const out: Appliance[] = [];
  // Short station id for callsign composition. GMFRS keeps the "G" prefix so
  // the callsign reads like real radio traffic: G50 → "G50P1". NWAS strips
  // the "A-" so "A-BOL" → "BOL" before its own NWAS-prefix logic kicks in.
  const stationShort = station.id.replace(/^A-/, "");
  const isForceWide = station.area === "ForceWide";
  const separator = station.service === "Fire" ? "" : "-";

  for (const raw of rawList) {
    for (const parsed of parseApplianceString(raw)) {
      const type = APPLIANCE_TYPES[parsed.type];
      if (!type) continue;
      for (let i = 1; i <= parsed.count; i++) {
        const ordinal = countSoFar(out, parsed.type) + 1;

        const nwasPrefix = NWAS_CALLSIGN_PREFIX[parsed.type];
        const gmpPrefix = GMP_CALLSIGN_PREFIX[parsed.type];
        let designator: string;
        let callsign: string;
        if (nwasPrefix) {
          // NWAS: service-wide unit-number callsign, not tied to the station.
          designator = `${nwasPrefix}-${seeded3(`${station.id}-${parsed.type}-${ordinal}`)}`;
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
            designators[ordinal - 1] ?? `${type.callsignCategory}${ordinal}`;
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
            ? `${type.fullName} (carrying ${POD_TYPES[parsed.podType]?.fullName ?? parsed.podType})`
            : type.fullName,
          podType: parsed.podType,
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
          vrm: generateVrm(),
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
      return buildAppliances(station, s.appliances ?? []);
    }
  }
  for (const area of nwasJson.areas) {
    const s = (area.stations as RawStation[]).find((x) => x.id === stationId);
    if (s) {
      const station = STATIONS.find((st) => st.id === stationId);
      if (!station) return [];
      return buildAppliances(station, s.resources ?? []);
    }
  }
  for (const area of gmpJson.areas) {
    const s = (area.stations as RawStation[]).find((x) => x.id === stationId);
    if (s) {
      const station = STATIONS.find((st) => st.id === stationId);
      if (!station) return [];
      return buildAppliances(station, s.resources ?? []);
    }
  }
  return [];
}
