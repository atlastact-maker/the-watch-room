// ETA helper. Real road routing via our own /api/route-eta endpoint (which
// proxies OpenRouteService), with a haversine fallback if the endpoint
// is unreachable or returns an error.

import type { ApplianceTypeCode } from "./types";

type Coords = { lat: number; lng: number };

const FALLBACK_AVG_MPH = 35;

/**
 * Blue-light time reduction vs. normal driving. UK emergency vehicles save
 * ~30–40% on urban journeys thanks to filtering through junctions, using
 * bus lanes, pace through red signals, etc. This is the FLEET-AVERAGE
 * baseline the station-wide ETA sweep prices with; individual vehicles
 * rescale from it via blueLightFactorFor below.
 */
export const BLUE_LIGHT_FACTOR = 0.65;

/**
 * Per-class blue-light factor vs normal driving. What a vehicle actually
 * does on blues depends on what it is: a traffic bike filters through
 * anything, a 2-tonne response car corners flat, an 18-tonne pump
 * accelerates like a truck, and an aerial barely saves anything.
 */
export function blueLightFactorFor(type: ApplianceTypeCode | undefined): number {
  switch (type) {
    // Motorbikes — filter through stationary traffic.
    case "Police_TraffMot":
      return 0.52;
    // Police cars — best power-to-weight on four wheels.
    case "Police_Response":
    case "Police_ARV":
    case "Police_RPU":
    case "Police_Dog":
    case "Police_SIO":
      return 0.58;
    // Ambulance / doctor rapid-response cars.
    case "RRV":
    case "QR":
    case "CCC":
    case "BASICS":
    case "OD":
      return 0.6;
    // Box-bodied ambulances and medium vans — heavy, top-heavy, cautious.
    case "DCA":
    case "HART_vehicle":
    case "NWAS_IRU":
    case "HART_PCV":
    case "Police_Search":
      return 0.7;
    // HART access vehicles. The Hilux and the RRV are cars; the DAF
    // carrying the Polaris is a 7.5-tonner, and the Polaris itself only
    // moves under its own power once it is off the back of it.
    case "HART_ORIRU":
    case "HART_RRV":
      return 0.85;
    case "HART_carrier":
    case "HART_ATV":
      return 0.6;
    // Fire pumps — 12–18 t appliances.
    case "WrL":
    case "WrT":
    case "L6P":
    case "TRU_pump":
    case "TRU_van":
    case "WFU":
    case "BFU":
    case "WIU":
      return 0.78;
    // The heavies — aerials, prime movers, USAR, command/support units.
    case "TL":
    case "HLP":
    case "PM":
    case "USAR":
    case "ICU":
    case "CSU":
    case "OSU":
    case "FIU":
    case "BASU":
    case "SACU":
    case "WU":
    case "HLL":
    case "SDU":
    case "DIM":
      return 0.85;
    // Aircraft ETAs are computed as flight time — return the baseline so
    // a rescale from the sweep is a no-op.
    case "HEMS":
    case "Police_NPAS":
      return BLUE_LIGHT_FACTOR;
    default:
      return 0.72;
  }
}

/** Rescale a baseline (fleet-average) blue-light ETA in seconds to a
 *  specific vehicle class. */
export function rescaleBlueLightSeconds(
  baselineSeconds: number,
  type: ApplianceTypeCode | undefined,
): number {
  return baselineSeconds * (blueLightFactorFor(type) / BLUE_LIGHT_FACTOR);
}

/** Return a route result scaled to blue-light travel time. Pass the
 *  base (normal driving) ETA result back to a copy with reduced seconds
 *  — everything else (route polyline, metres) is unchanged. */
export function blueLight<T extends { seconds: number }>(result: T): T {
  return { ...result, seconds: result.seconds * BLUE_LIGHT_FACTOR };
}

/** Like blueLight, but for a known vehicle class. */
export function blueLightFor<T extends { seconds: number }>(
  result: T,
  type: ApplianceTypeCode | undefined,
): T {
  return { ...result, seconds: result.seconds * blueLightFactorFor(type) };
}

export type EtaResult = {
  meters: number;
  seconds: number;
  source: "ors" | "fallback";
  /**
   * Polyline of the route as [lat, lng] pairs (Leaflet ordering). `null` if
   * the upstream wasn't available and we've fallen back to haversine.
   */
  coords: [number, number][] | null;
};

const cache = new Map<string, EtaResult>();

function key(a: Coords, b: Coords): string {
  return `${a.lat.toFixed(5)},${a.lng.toFixed(5)}->${b.lat.toFixed(5)},${b.lng.toFixed(5)}`;
}

export function haversineMeters(a: Coords, b: Coords): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function haversineFallback(a: Coords, b: Coords): EtaResult {
  const meters = haversineMeters(a, b);
  const roadMeters = meters * 1.3; // crow-fly → road estimate
  const secondsPerMeter = 3600 / (FALLBACK_AVG_MPH * 1609.344);
  return {
    meters: roadMeters,
    seconds: roadMeters * secondsPerMeter,
    source: "fallback",
    coords: null,
  };
}

export async function routeEta(
  from: Coords,
  to: Coords,
  signal?: AbortSignal,
  mode: "driving" | "foot" = "driving",
): Promise<EtaResult> {
  const k = `${mode}|${key(from, to)}`;
  const cached = cache.get(k);
  if (cached) return cached;

  const url =
    `/api/route-eta?fromLat=${from.lat}&fromLng=${from.lng}` +
    `&toLat=${to.lat}&toLng=${to.lng}&mode=${mode}`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`route-eta ${res.status}`);
    const body = (await res.json()) as {
      meters?: number;
      seconds?: number;
      coords?: [number, number][];
      source?: string;
      error?: string;
    };
    if (
      typeof body.meters !== "number" ||
      typeof body.seconds !== "number" ||
      !Array.isArray(body.coords) ||
      body.coords.length < 2
    ) {
      throw new Error(body.error ?? "route-eta bad response");
    }
    const result: EtaResult = {
      meters: body.meters,
      seconds: body.seconds,
      coords: body.coords,
      source: "ors",
    };
    cache.set(k, result);
    return result;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    console.warn("[route-eta] fallback to haversine:", err);
    return haversineFallback(from, to);
  }
}

/**
 * Interpolate a position along a polyline by fractional progress `t` ∈ [0, 1],
 * weighted by cumulative haversine distance so constant-speed travel maps to
 * roughly constant screen-speed along the path.
 */
export function interpolateAlongRoute(
  coords: [number, number][],
  t: number,
): [number, number] {
  if (coords.length === 0) return [0, 0];
  if (coords.length === 1 || t <= 0) return coords[0];
  if (t >= 1) return coords[coords.length - 1];

  const cum: number[] = [0];
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lat1, lng1] = coords[i - 1];
    const [lat2, lng2] = coords[i];
    total += haversineMeters({ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 });
    cum.push(total);
  }
  if (total === 0) return coords[0];

  const target = t * total;
  let lo = 0;
  let hi = coords.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >>> 1;
    if (cum[mid] <= target) lo = mid;
    else hi = mid;
  }
  const segLen = cum[hi] - cum[lo];
  const segT = segLen === 0 ? 0 : (target - cum[lo]) / segLen;
  const a = coords[lo];
  const b = coords[hi];
  return [a[0] + (b[0] - a[0]) * segT, a[1] + (b[1] - a[1]) * segT];
}
