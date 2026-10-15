// THE COUNTY'S RESOURCES, COUNTED. What the Resources screen and the
// pre-shift resourcing page show, built from the same station list the
// desk mobilises from: how many of each type there are and what state
// they are in, which stations have nobody in the bay, who could cover
// them, and the cover moves under way. Pure: the desk model calls it
// with the live board, the briefing with the roll, the harness with a
// fixture.

import type { Deployment } from "@/lib/sim/incident_types";
import type { Appliance, ApplianceTypeCode, ServiceCode } from "@/lib/sim/types";
import { haversineMeters } from "@/lib/sim/eta";
import { activeStandby, standbyEtaSec, standbyPhase, standbyTravelSec, type Coords, type StandbyMove, type StandbyPhase } from "@/lib/sim/standby";
import type { StationWithAppliances } from "../page";
import type { BayRow } from "./mob-screen";
import { typeChip } from "./model";

export const PUMP_TYPES: ApplianceTypeCode[] = ["WrL", "WrT", "L6P"];
/** The units a station is judged empty without: a pump, a DCA, a response car. */
export const FRONT_LINE: Record<ServiceCode, ApplianceTypeCode[]> = { Fire: PUMP_TYPES, Ambulance: ["DCA"], Police: ["Police_Response"] };
/** How far a donor station is looked for. */
export const DONOR_RANGE_M = 15_000;
/** A station empty this long with a donor in range and nothing sent is a gap the debrief sees. */
export const COVER_GAP_MS = 15 * 60_000;

export type ResourceTypeRow = {
  service: ServiceCode;
  type: ApplianceTypeCode;
  code: string;
  name: string;
  total: number;
  /** Free in the bay, or standing by somewhere. */
  available: number;
  standingBy: number;
  /** Mobilised, in attendance, at hospital. */
  onJobs: number;
  returning: number;
  /** Not free for another reason: a pre-shift commitment, a status the desk set. */
  committed: number;
  offRun: number;
  short: number;
};

export type StandbySuggestion = {
  id: string;
  applianceId: string;
  service: ServiceCode;
  callsign: string;
  from: string;
  to: string;
  toStationId: string;
  toCoords: Coords;
  travel: string;
  travelSec: number;
  reason: string;
  sent: boolean;
};

export type StandbyActiveRow = {
  applianceId: string;
  callsign: string;
  service: ServiceCode;
  type: string;
  from: string;
  to: string;
  phase: StandbyPhase;
  etaSec: number | null;
  reason: string;
};

export type CoverGapRow = {
  stationId: string;
  name: string;
  service: ServiceCode;
  /** When it emptied, when the desk has been keeping count. */
  since: number | null;
  inbound: { callsign: string; etaSec: number | null } | null;
  suggestion: StandbySuggestion | null;
};

export type FreeUnitRow = {
  applianceId: string;
  callsign: string;
  service: ServiceCode;
  type: ApplianceTypeCode;
  typeName: string;
  stationId: string;
  station: string;
  /** Sending it empties its own station. */
  lastInBay: boolean;
};

export type StandbyDestination = { stationId: string; name: string; service: ServiceCode; coords: Coords; cover: number; empty: boolean; distM: number };

export type ResourcePicture = {
  rows: ResourceTypeRow[];
  bays: BayRow[];
  suggestions: StandbySuggestion[];
  active: StandbyActiveRow[];
  gaps: CoverGapRow[];
  freeUnits: FreeUnitRow[];
  destinations: StandbyDestination[];
  /** Front-line cover at every station that has front-line units. */
  coverOf: Record<string, number>;
  /** Where each unit on a cover move is right now. */
  positions: Record<string, Coords>;
  /** Service totals for the strip. */
  totals: Record<ServiceCode, { total: number; available: number; onJobs: number; offRun: number }>;
};

export function isFreeUnit(a: Appliance): boolean {
  return (a.status === 7 || a.status === 6) && a.crew.current >= a.crew.min;
}

const mins = (sec: number) => `${Math.max(1, Math.round(sec / 60))}m`;

export function buildResourcePicture(args: {
  stations: StationWithAppliances[];
  deployments: Deployment[];
  standbyMoves: Record<string, StandbyMove>;
  now: number;
  coverSince?: Record<string, number>;
  positionOf?: (m: StandbyMove) => Coords;
}): ResourcePicture {
  const { stations, deployments, standbyMoves, now } = args;
  const coverSince = args.coverSince ?? {};
  const real = stations.filter((s) => !s.virtual && s.appliances.length > 0);
  const byId = new Map<string, { a: Appliance; s: StationWithAppliances }>();
  for (const s of real) for (const a of s.appliances) byId.set(a.id, { a, s });

  // Committed means on the job or on the way back; home is home.
  const committedIds = new Set<string>();
  const returningIds = new Set<string>();
  for (const d of deployments) {
    const home = d.returnStartedAt && d.returnArrivesAt && now >= d.returnArrivesAt;
    if (home) continue;
    committedIds.add(d.applianceId);
    if (d.returnStartedAt && now >= d.returnStartedAt) returningIds.add(d.applianceId);
  }
  const active = activeStandby(standbyMoves, now).filter((m) => !committedIds.has(m.applianceId));
  const awayIds = new Set(active.map((m) => m.applianceId));
  const positions: Record<string, Coords> = {};
  for (const m of active) positions[m.applianceId] = args.positionOf ? args.positionOf(m) : { lat: m.to.lat, lng: m.to.lng };
  const inBay = (a: Appliance) => isFreeUnit(a) && !committedIds.has(a.id) && !awayIds.has(a.id);
  const front = (s: StationWithAppliances, a: Appliance) => FRONT_LINE[s.service].includes(a.type);

  // Who is standing by at which station, and who is on the way there.
  const standingAt = new Map<string, StandbyMove[]>();
  const inboundTo = new Map<string, StandbyMove[]>();
  for (const m of active) {
    if (!m.to.stationId) continue;
    const phase = standbyPhase(m, now);
    if (phase === "standing") standingAt.set(m.to.stationId, [...(standingAt.get(m.to.stationId) ?? []), m]);
    if (phase === "moving") inboundTo.set(m.to.stationId, [...(inboundTo.get(m.to.stationId) ?? []), m]);
  }

  const coverOf: Record<string, number> = {};
  const hasFront = (s: StationWithAppliances) => s.appliances.some((a) => front(s, a));
  const freeFront = (s: StationWithAppliances) => s.appliances.filter((a) => front(s, a) && inBay(a));
  for (const s of real) {
    if (!hasFront(s)) continue;
    const visiting = (standingAt.get(s.id) ?? []).filter((m) => { const u = byId.get(m.applianceId); return u && FRONT_LINE[s.service].includes(u.a.type); }).length;
    coverOf[s.id] = freeFront(s).length + visiting;
  }

  // Suggested moves: the nearest station of the service with two free
  // front-line units lends its last one to a station with none.
  const suggestionFor = (st: StationWithAppliances): StandbySuggestion | null => {
    const donors = real
      .filter((s) => s.service === st.service && s.id !== st.id)
      .map((s) => ({ s, free: freeFront(s), dist: haversineMeters(s.coords, st.coords) }))
      .filter((d) => d.free.length >= 2 && d.dist <= DONOR_RANGE_M)
      .sort((a, b) => a.dist - b.dist);
    const donor = donors[0];
    if (!donor) return null;
    const unit = donor.free[donor.free.length - 1];
    const committed = st.appliances.filter((a) => front(st, a)).map((a) => a.callsign).join(" and ");
    const travelSec = standbyTravelSec(donor.s.coords, st.coords);
    return {
      id: `${unit.id}->${st.id}`,
      applianceId: unit.id,
      service: st.service,
      callsign: unit.callsign,
      from: donor.s.name,
      to: st.name,
      toStationId: st.id,
      toCoords: st.coords,
      travel: mins(travelSec),
      travelSec,
      reason: `Covers ${st.name} while ${committed} ${committed.includes(" and ") ? "are" : "is"} committed`,
      sent: false,
    };
  };
  const suggestions: StandbySuggestion[] = [];
  const gaps: CoverGapRow[] = [];
  for (const s of real) {
    if (!hasFront(s) || (coverOf[s.id] ?? 0) > 0) continue;
    const inbound = inboundTo.get(s.id)?.[0];
    const suggestion = inbound ? null : suggestionFor(s);
    if (suggestion && suggestions.length < 8) suggestions.push(suggestion);
    gaps.push({
      stationId: s.id,
      name: s.name,
      service: s.service,
      since: coverSince[s.id] ?? null,
      inbound: inbound ? { callsign: byId.get(inbound.applianceId)?.a.callsign ?? inbound.applianceId, etaSec: standbyEtaSec(inbound, now) } : null,
      suggestion,
    });
  }
  gaps.sort((a, b) => (a.since ?? now) - (b.since ?? now));

  const activeRows: StandbyActiveRow[] = active
    .map((m) => {
      const u = byId.get(m.applianceId);
      return {
        applianceId: m.applianceId,
        callsign: u?.a.callsign ?? m.applianceId,
        service: u?.s.service ?? "Fire",
        type: u ? typeChip(u.a.type) : "",
        from: u?.s.name ?? m.fromStationId,
        to: m.to.label,
        phase: standbyPhase(m, now),
        etaSec: standbyEtaSec(m, now),
        reason: m.reason,
      };
    })
    .sort((a, b) => a.callsign.localeCompare(b.callsign));

  // The bays, with the units away on cover marked and the visitors shown.
  const bays: BayRow[] = real.map((s) => ({
    stationId: s.id,
    id: s.id,
    name: s.name,
    service: s.service,
    units: s.appliances.map((a) => ({
      applianceId: a.id,
      callsign: a.callsign,
      state: a.status === 8 ? "off" : awayIds.has(a.id) ? "standby" : inBay(a) ? "in" : "out",
    })),
    visitors: [...(standingAt.get(s.id) ?? []).map((m) => ({ applianceId: m.applianceId, callsign: byId.get(m.applianceId)?.a.callsign ?? m.applianceId, phase: "standing" as const })), ...(inboundTo.get(s.id) ?? []).map((m) => ({ applianceId: m.applianceId, callsign: byId.get(m.applianceId)?.a.callsign ?? m.applianceId, phase: "moving" as const }))],
  }));

  // The counts by type.
  const rowMap = new Map<string, ResourceTypeRow>();
  const totals: ResourcePicture["totals"] = { Fire: { total: 0, available: 0, onJobs: 0, offRun: 0 }, Ambulance: { total: 0, available: 0, onJobs: 0, offRun: 0 }, Police: { total: 0, available: 0, onJobs: 0, offRun: 0 } };
  for (const s of real) {
    for (const a of s.appliances) {
      const key = `${s.service}:${a.type}`;
      const row = rowMap.get(key) ?? { service: s.service, type: a.type, code: typeChip(a.type), name: a.typeName, total: 0, available: 0, standingBy: 0, onJobs: 0, returning: 0, committed: 0, offRun: 0, short: 0 };
      row.total += 1;
      const t = totals[s.service];
      t.total += 1;
      if (a.crew.current < a.crew.min) row.short += 1;
      if (committedIds.has(a.id)) {
        if (returningIds.has(a.id)) row.returning += 1; else row.onJobs += 1;
        t.onJobs += 1;
      } else if (a.status === 8) {
        row.offRun += 1;
        t.offRun += 1;
      } else if (awayIds.has(a.id)) {
        row.standingBy += 1;
        row.available += 1;
        t.available += 1;
      } else if (inBay(a)) {
        row.available += 1;
        t.available += 1;
      } else {
        row.committed += 1;
      }
      rowMap.set(key, row);
    }
  }
  const order: ServiceCode[] = ["Fire", "Ambulance", "Police"];
  const rows = [...rowMap.values()].sort((a, b) => order.indexOf(a.service) - order.indexOf(b.service) || b.total - a.total || a.code.localeCompare(b.code));

  const freeUnits: FreeUnitRow[] = [];
  for (const s of real) {
    const ff = freeFront(s).length;
    for (const a of s.appliances) {
      if (!inBay(a)) continue;
      freeUnits.push({ applianceId: a.id, callsign: a.callsign, service: s.service, type: a.type, typeName: a.typeName, stationId: s.id, station: s.name, lastInBay: front(s, a) && ff === 1 });
    }
  }
  freeUnits.sort((a, b) => order.indexOf(a.service) - order.indexOf(b.service) || a.callsign.localeCompare(b.callsign));
  const centre = { lat: 53.48, lng: -2.24 };
  const destinations: StandbyDestination[] = real
    .filter((s) => hasFront(s))
    .map((s) => ({ stationId: s.id, name: s.name, service: s.service, coords: s.coords, cover: coverOf[s.id] ?? 0, empty: (coverOf[s.id] ?? 0) === 0, distM: haversineMeters(centre, s.coords) }))
    .sort((a, b) => Number(b.empty) - Number(a.empty) || a.cover - b.cover || a.name.localeCompare(b.name));

  return { rows, bays, suggestions, active: activeRows, gaps, freeUnits, destinations, coverOf, positions, totals };
}
