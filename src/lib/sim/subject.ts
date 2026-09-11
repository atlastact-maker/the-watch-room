// A SUBJECT VEHICLE — the car the job is about, moving on real roads.
//
// The ANPR network reads it as it passes fixed sites; a unit's own camera
// reads it when it passes the car; a crew on an area search or NPAS
// overhead can sight it. Until somebody has, the operator sees only the
// breadcrumb of reads and a direction of travel. Once sighted the track
// is live on the map for as long as a unit stays with it, and the
// tactics — a stop, follow and contain, a TPAC box, a stinger, tactical
// contact — act on the live track. Lose it and it is back to cameras.
//
// Pure functions over a plain record. The dashboard owns the record,
// ticks it once a second with the units' positions, and writes the
// events to the shift log.

import { ANPR_SITES, type AnprHit } from "./anpr";
import { haversineMeters } from "./eta";
import type { VehicleRecord } from "./records";
import type { Task } from "./incident_types";

export type LatLng = { lat: number; lng: number };

/** How a scenario authors its subject. The route is fetched when the
 *  job opens; until it lands the vehicle sits at its start. */
export type SubjectSpec = {
  vrm: string;
  start: LatLng;
  destination: LatLng;
  /** Cruising speed on the road, before any pursuit. */
  speedKph?: number;
  /** The driver, when the records know them — for the arrest. */
  driverPersonId?: string;
  /** How likely the driver is to stop for blue lights, 0–1. A stolen car
   *  or a wanted driver makes this low. */
  compliance?: number;
  /** Seconds after the job opens before the car moves off — it was read
   *  at the camera a moment ago and is already past it. */
  headStartSec?: number;
};

export type SubjectState = "moving" | "pursuit" | "stopped" | "contained" | "gone";

export type SubjectPing = {
  at: number;
  pos: LatLng;
  /** A fixed site, or a unit's callsign. */
  siteId?: string;
  unitCallsign?: string;
  label: string;
  direction: "NB" | "SB" | "EB" | "WB";
};

export type SubjectEvent = { at: number; kind: "ping" | "sighted" | "lost" | "stopped" | "failed_to_stop" | "contained" | "gone" | "stinger"; text: string };

export type SubjectVehicle = {
  id: string;
  incidentId: string;
  vrm: string;
  vehicle: VehicleRecord;
  driverPersonId?: string;
  compliance: number;
  /** The road line, [lat, lng]. Straight line until the router answers. */
  route: [number, number][];
  routeReady: boolean;
  totalM: number;
  /** Metres travelled along the route. */
  progressM: number;
  speedKph: number;
  baseSpeedKph: number;
  movesAt: number;
  lastTickAt: number;
  state: SubjectState;
  /** Live tracking: a unit has eyes on it now. */
  trackLive: boolean;
  trackHeldBy: string[];
  sightedAt?: number;
  lastSeenAt?: number;
  lastSeenPos?: LatLng;
  lastSeenHeading?: number;
  pings: SubjectPing[];
  events: SubjectEvent[];
  /** Site ids pinged in the last few minutes, so a pass reads once. */
  recentSites: Record<string, number>;
  stoppedAt?: number;
  stoppedPos?: LatLng;
  outcome?: string;
  /** A stinger deflated the tyres: rolling to a stop. */
  stingerAt?: number;
};

const PURSUIT_FACTOR = 1.45;
const SITE_READ_M = 220;
const UNIT_READ_M = 180;
const SEARCH_SIGHT_M = 550;
const NPAS_SIGHT_M = 2600;
const TRACK_HOLD_M = 750;
const TRACK_LOSS_MS = 45_000;

export function cumulative(route: [number, number][]): number[] {
  const cum = [0];
  for (let i = 1; i < route.length; i++) {
    cum.push(cum[i - 1] + haversineMeters({ lat: route[i - 1][0], lng: route[i - 1][1] }, { lat: route[i][0], lng: route[i][1] }));
  }
  return cum;
}

export function bearing(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function compass(deg: number): "NB" | "SB" | "EB" | "WB" {
  if (deg >= 315 || deg < 45) return "NB";
  if (deg < 135) return "EB";
  if (deg < 225) return "SB";
  return "WB";
}

/** Where along the route a distance lands, and which way it is facing. */
export function positionAt(route: [number, number][], progressM: number): { pos: LatLng; heading: number } {
  if (route.length === 0) return { pos: { lat: 0, lng: 0 }, heading: 0 };
  if (route.length === 1) return { pos: { lat: route[0][0], lng: route[0][1] }, heading: 0 };
  const cum = cumulative(route);
  const total = cum[cum.length - 1];
  const d = Math.max(0, Math.min(total, progressM));
  let i = 1;
  while (i < cum.length - 1 && cum[i] < d) i++;
  const segLen = cum[i] - cum[i - 1];
  const t = segLen > 0 ? (d - cum[i - 1]) / segLen : 0;
  const a = { lat: route[i - 1][0], lng: route[i - 1][1] };
  const b = { lat: route[i][0], lng: route[i][1] };
  return { pos: { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }, heading: bearing(a, b) };
}

export function subjectPosition(s: SubjectVehicle): { pos: LatLng; heading: number } {
  if (s.stoppedPos) return { pos: s.stoppedPos, heading: s.lastSeenHeading ?? 0 };
  return positionAt(s.route, s.progressM);
}

export function createSubject(incidentId: string, spec: SubjectSpec, vehicle: VehicleRecord, now: number): SubjectVehicle {
  const route: [number, number][] = [[spec.start.lat, spec.start.lng], [spec.destination.lat, spec.destination.lng]];
  return {
    id: `subj:${incidentId}`,
    incidentId,
    vrm: spec.vrm,
    vehicle,
    driverPersonId: spec.driverPersonId,
    compliance: spec.compliance ?? 0.7,
    route,
    routeReady: false,
    totalM: cumulative(route)[1],
    progressM: 0,
    speedKph: spec.speedKph ?? 46,
    baseSpeedKph: spec.speedKph ?? 46,
    movesAt: now + (spec.headStartSec ?? 0) * 1000,
    lastTickAt: now,
    state: "moving",
    trackLive: false,
    trackHeldBy: [],
    pings: [],
    events: [],
    recentSites: {},
  };
}

/** The router answered: swap the straight line for the road, keeping
 *  the share of the journey already driven. */
export function withRoute(s: SubjectVehicle, route: [number, number][]): SubjectVehicle {
  const total = cumulative(route)[route.length - 1];
  const share = s.totalM > 0 ? s.progressM / s.totalM : 0;
  return { ...s, route, routeReady: true, totalM: total, progressM: share * total };
}

/** A unit as the engine sees it this tick. */
export type Sensor = {
  applianceId: string;
  callsign: string;
  pos: LatLng;
  /** Police units read plates; only police can sight and hold a track. */
  police: boolean;
  npas: boolean;
  /** Area search running: driving the ground with eyes open. */
  searching: boolean;
  /** Following or boxing: attached to the track. */
  attached: boolean;
  tpac: boolean;
};

export type TickResult = { subject: SubjectVehicle; events: SubjectEvent[]; hits: AnprHit[]; sensorsAttached: string[] };

function seeded(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0;
  return (h % 10000) / 10000;
}

export function tickSubject(prev: SubjectVehicle, now: number, sensors: Sensor[], tasks: Task[]): TickResult {
  const events: SubjectEvent[] = [];
  const hits: AnprHit[] = [];
  let s: SubjectVehicle = { ...prev, recentSites: { ...prev.recentSites }, trackHeldBy: [...prev.trackHeldBy] };
  const dt = Math.max(0, (now - s.lastTickAt) / 1000);
  s.lastTickAt = now;
  const done = s.state === "stopped" || s.state === "contained" || s.state === "gone";

  // ---- Drive ---------------------------------------------------------------
  if (!done && now >= s.movesAt) {
    if (s.stingerAt) {
      // Tyres going down: bleeding speed to nothing over half a minute.
      const gone = (now - s.stingerAt) / 30_000;
      s.speedKph = Math.max(0, s.baseSpeedKph * (1 - gone));
      if (s.speedKph <= 1) {
        const { pos, heading } = positionAt(s.route, s.progressM);
        s = { ...s, state: "stopped", stoppedAt: now, stoppedPos: pos, lastSeenHeading: heading, lastSeenPos: pos, lastSeenAt: now, trackLive: true, outcome: "Stopped on deflated tyres — occupants detained" };
        events.push({ at: now, kind: "stopped", text: `${s.vrm} has stopped on deflated tyres — occupants detained` });
      }
    } else {
      s.speedKph = s.state === "pursuit" ? s.baseSpeedKph * PURSUIT_FACTOR : s.baseSpeedKph;
    }
    s.progressM = Math.min(s.totalM, s.progressM + (s.speedKph * 1000 / 3600) * dt);
    if (s.progressM >= s.totalM && s.routeReady && s.state !== "stopped") {
      const { pos, heading } = positionAt(s.route, s.progressM);
      const decamp = s.state === "pursuit" || s.trackLive;
      s = { ...s, state: "gone", stoppedAt: now, stoppedPos: pos, lastSeenPos: pos, lastSeenHeading: heading, lastSeenAt: now, trackLive: false, trackHeldBy: [], outcome: decamp ? "Abandoned — occupants decamped on foot" : "Parked up and gone — last read is all there is" };
      events.push({ at: now, kind: "gone", text: decamp ? `${s.vrm} abandoned — occupants decamped on foot, area search for the driver` : `${s.vrm} has gone to ground — parked up beyond the cameras` });
      return { subject: s, events, hits, sensorsAttached: [] };
    }
  }

  const { pos, heading } = subjectPosition(s);
  const dir = compass(heading);

  // ---- Cameras -----------------------------------------------------------------
  if (!done || s.state === "stopped") {
    for (const site of ANPR_SITES) {
      const d = haversineMeters(pos, site.coords);
      const last = s.recentSites[site.id] ?? 0;
      if (d < SITE_READ_M && now - last > 240_000 && s.state !== "stopped") {
        s.recentSites[site.id] = now;
        const ping: SubjectPing = { at: now, pos: site.coords, siteId: site.id, label: `${site.name} ${dir}`, direction: dir };
        s.pings = [...s.pings, ping];
        s.lastSeenAt = now;
        s.lastSeenPos = site.coords;
        s.lastSeenHeading = heading;
        events.push({ at: now, kind: "ping", text: `ANPR · ${s.vrm} read at ${site.name} ${dir}` });
        hits.push({ id: `subj-${s.id}-${site.id}-${Math.floor(now / 1000)}`, atMs: now, siteId: site.id, vrm: s.vrm, direction: dir, markers: (s.vehicle.markers ?? []).map(String), make: s.vehicle.make, model: s.vehicle.model, colour: s.vehicle.colour });
      }
    }
  }

  // ---- Eyes on --------------------------------------------------------------------
  const holders: string[] = [];
  let sightedBy: Sensor | null = null;
  for (const u of sensors) {
    if (!u.police) continue;
    const d = haversineMeters(pos, u.pos);
    if (u.attached && s.trackLive) { holders.push(u.callsign); continue; }
    const radius = u.npas ? NPAS_SIGHT_M : u.searching ? SEARCH_SIGHT_M : UNIT_READ_M;
    if (d < radius) {
      // A read is certain inside camera range; a sighting on a search is a
      // roll each second, better the closer they are, near-certain for NPAS.
      const p = d < UNIT_READ_M ? 1 : u.npas ? 0.35 : Math.max(0.04, 0.18 * (1 - d / radius));
      if (p >= 1 || seeded(`${s.id}:${u.applianceId}:${Math.floor(now / 1000)}`) < p) {
        holders.push(u.callsign);
        if (!sightedBy) sightedBy = u;
        if (d < UNIT_READ_M && now - (s.recentSites[`unit:${u.applianceId}`] ?? 0) > 180_000) {
          s.recentSites[`unit:${u.applianceId}`] = now;
          s.pings = [...s.pings, { at: now, pos: u.pos, unitCallsign: u.callsign, label: `${u.callsign} camera`, direction: dir }];
        }
      }
    }
    if (d < TRACK_HOLD_M && s.trackLive && !holders.includes(u.callsign)) holders.push(u.callsign);
  }
  if (holders.length > 0 && !done) {
    if (!s.trackLive) {
      events.push({ at: now, kind: "sighted", text: `${s.vrm} SIGHTED by ${sightedBy?.callsign ?? holders[0]} — ${sightedBy?.npas ? "NPAS overhead, " : ""}track live` });
      s.sightedAt = now;
    }
    s.trackLive = true;
    s.trackHeldBy = holders;
    s.lastSeenAt = now;
    s.lastSeenPos = pos;
    s.lastSeenHeading = heading;
  } else if (s.trackLive && !done) {
    if (now - (s.lastSeenAt ?? 0) > TRACK_LOSS_MS) {
      s.trackLive = false;
      s.trackHeldBy = [];
      events.push({ at: now, kind: "lost", text: `${s.vrm} LOST — last seen ${dir} ${Math.round(now - (s.lastSeenAt ?? now)) / 1000 | 0}s ago` });
    }
  }
  if (s.trackLive) { s.lastSeenPos = pos; s.lastSeenHeading = heading; }

  // ---- Tactics that finished this tick ----------------------------------------------
  for (const t of tasks) {
    if (t.state !== "completed" || !t.completesAt || t.completesAt <= prev.lastTickAt || t.completesAt > now) continue;
    if (t.vehicleVrm && t.vehicleVrm.replace(/\s/g, "") !== s.vrm.replace(/\s/g, "")) continue;
    const unit = sensors.find((u) => u.applianceId === t.applianceId);
    const cs = unit?.callsign ?? t.applianceId;
    if (done) continue;
    if (!s.trackLive) { events.push({ at: now, kind: "lost", text: `${cs} — ${t.kind.replace(/_/g, " ")}: no vehicle in sight, nothing to act on` }); continue; }
    if (t.kind === "vehicle_stop") {
      const roll = seeded(`${s.id}:stop:${t.id}`);
      if (roll < s.compliance) {
        s = { ...s, state: "stopped", stoppedAt: now, stoppedPos: pos, outcome: `Compliant stop by ${cs}` };
        events.push({ at: now, kind: "stopped", text: `${s.vrm} STOPPED for ${cs} — compliant, occupants spoken to` });
      } else {
        s = { ...s, state: "pursuit" };
        events.push({ at: now, kind: "failed_to_stop", text: `${s.vrm} FAILED TO STOP for ${cs} — making off ${dir}, pursuit authority with the control room` });
      }
    } else if (t.kind === "tpac_box") {
      const tpacCars = sensors.filter((u) => u.tpac && (u.attached || haversineMeters(pos, u.pos) < TRACK_HOLD_M)).length;
      if (tpacCars >= 2) {
        s = { ...s, state: "contained", stoppedAt: now, stoppedPos: pos, outcome: `TPAC box by ${cs} — vehicle immobilised` };
        events.push({ at: now, kind: "contained", text: `${s.vrm} BOXED by ${cs} and a second TPAC car — immobilised, occupants detained` });
      } else {
        events.push({ at: now, kind: "failed_to_stop", text: `${cs} — TPAC box needs a second trained car on the track; ${s.vrm} still running ${dir}` });
      }
    } else if (t.kind === "stinger") {
      const roll = seeded(`${s.id}:sting:${t.id}`);
      if (roll < 0.8) {
        s = { ...s, stingerAt: now };
        events.push({ at: now, kind: "stinger", text: `${cs} — stinger deployed, ${s.vrm} over it, tyres going down` });
      } else {
        events.push({ at: now, kind: "failed_to_stop", text: `${cs} — stinger missed, ${s.vrm} swerved it and is still running ${dir}` });
      }
    } else if (t.kind === "tactical_contact") {
      s = { ...s, state: "contained", stoppedAt: now, stoppedPos: pos, outcome: `Tactical contact by ${cs}` };
      events.push({ at: now, kind: "contained", text: `${s.vrm} — tactical contact by ${cs}, vehicle immobilised, occupants detained` });
    }
  }

  return { subject: s, events, hits, sensorsAttached: holders };
}

/** The next fixed site the car will pass, from where it is now — the
 *  intercept the desk should be thinking about. */
export function nextSite(s: SubjectVehicle): { id: string; name: string; road: string; coords: LatLng; inM: number } | null {
  if (!s.routeReady || s.stoppedPos) return null;
  const cum = cumulative(s.route);
  let best: { id: string; name: string; road: string; coords: LatLng; inM: number } | null = null;
  for (const site of ANPR_SITES) {
    for (let i = 0; i < s.route.length; i += Math.max(1, Math.floor(s.route.length / 200))) {
      if (cum[i] <= s.progressM) continue;
      const d = haversineMeters({ lat: s.route[i][0], lng: s.route[i][1] }, site.coords);
      if (d < SITE_READ_M * 1.5) {
        const inM = cum[i] - s.progressM;
        if (!best || inM < best.inM) best = { id: site.id, name: site.name, road: site.road, coords: site.coords, inM };
        break;
      }
    }
  }
  return best;
}

/** Pick a destination for a car read at a site heading a given way: the
 *  farthest site that lies roughly in that direction, so the breadcrumb
 *  makes sense and the chase has somewhere to go. */
export function destinationFor(from: LatLng, direction: "NB" | "SB" | "EB" | "WB"): LatLng {
  const want = { NB: 0, EB: 90, SB: 180, WB: 270 }[direction];
  let best: { coords: LatLng; score: number } | null = null;
  for (const site of ANPR_SITES) {
    const d = haversineMeters(from, site.coords);
    if (d < 4000) continue;
    const diff = Math.abs(((bearing(from, site.coords) - want + 540) % 360) - 180);
    if (diff > 70) continue;
    const score = d / 1000 - diff / 30;
    if (!best || score > best.score) best = { coords: site.coords, score };
  }
  return best?.coords ?? { lat: from.lat + (direction === "NB" ? 0.08 : direction === "SB" ? -0.08 : 0), lng: from.lng + (direction === "EB" ? 0.12 : direction === "WB" ? -0.12 : 0) };
}
