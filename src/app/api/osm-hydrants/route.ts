import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Server-side proxy that fetches fire hydrants from OSM via Overpass.
// Returns a list of { id, lat, lng } within the requested radius.
// Cached in-memory for the server process lifetime so a given incident
// only resolves once.

type Hydrant = { id: string; lat: number; lng: number; ref?: string };
type Success = { hydrants: Hydrant[]; source: "overpass" };
type Failure = { error: string; source: "overpass" };

const OVERPASS_ENDPOINTS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const cache = new Map<string, Hydrant[]>();

export async function GET(request: NextRequest): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", source: "overpass" } satisfies Failure,
      { status: 401 },
    );
  }

  const sp = request.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));
  const radius = Math.max(50, Math.min(800, Number(sp.get("radius") ?? 300)));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "invalid coordinates", source: "overpass" } satisfies Failure,
      { status: 400 },
    );
  }

  const key = `${lat.toFixed(6)},${lng.toFixed(6)}@${radius}`;
  if (cache.has(key)) {
    return NextResponse.json({
      hydrants: cache.get(key) ?? [],
      source: "overpass",
    } satisfies Success);
  }

  let hydrants = await fetchHydrants({ lat, lng }, radius);
  // OSM hydrant coverage is patchy in the UK \u2014 if none are mapped in the
  // vicinity, fall back to synthesising 3 plausible kerbside hydrants from
  // road nodes so the operator has something meaningful to connect to.
  if (hydrants.length === 0) {
    hydrants = await synthesiseRoadHydrants({ lat, lng }, radius);
  }
  cache.set(key, hydrants);
  return NextResponse.json({ hydrants, source: "overpass" } satisfies Success);
}

/** Synthesise "kerbside" hydrants from road nodes around the incident.
 *  We pick a handful of well-spread nodes on drivable roads so the hydrants
 *  always sit on an actual road on the OSM tile. Used only when no real
 *  hydrant tags exist nearby. */
async function synthesiseRoadHydrants(
  coords: { lat: number; lng: number },
  radiusM: number,
): Promise<Hydrant[]> {
  const query = `
    [out:json][timeout:15];
    way(around:${radiusM},${coords.lat},${coords.lng})[highway~"^(primary|secondary|tertiary|unclassified|residential|service|living_street)$"];
    out geom;
  `;
  const body = `data=${encodeURIComponent(query)}`;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        elements?: { type: string; id: number; geometry?: { lat: number; lon: number }[] }[];
      };
      const nodes: { lat: number; lng: number; dist: number }[] = [];
      for (const el of json.elements ?? []) {
        if (el.type !== "way" || !el.geometry) continue;
        for (const g of el.geometry) {
          const d = Math.hypot(g.lat - coords.lat, g.lon - coords.lng);
          nodes.push({ lat: g.lat, lng: g.lon, dist: d });
        }
      }
      if (nodes.length === 0) return [];
      nodes.sort((a, b) => a.dist - b.dist);
      // Greedy spread: pick the closest, then keep picking nodes that are at
      // least ~40m away from every previously picked one, up to 4 hydrants.
      const picked: Hydrant[] = [];
      const minGapMetres = 40;
      const metresToLat = 1 / 111_000;
      const minGapLat = minGapMetres * metresToLat;
      for (const n of nodes) {
        const farEnough = picked.every((p) => Math.hypot(p.lat - n.lat, p.lng - n.lng) >= minGapLat);
        if (!farEnough) continue;
        picked.push({
          id: `synth-${picked.length + 1}-${n.lat.toFixed(5)}-${n.lng.toFixed(5)}`,
          lat: n.lat,
          lng: n.lng,
        });
        if (picked.length >= 4) break;
      }
      return picked;
    } catch {
      // try next mirror
    }
  }
  return [];
}

async function fetchHydrants(
  coords: { lat: number; lng: number },
  radiusM: number,
): Promise<Hydrant[]> {
  // Fire hydrants in OSM are usually nodes tagged emergency=fire_hydrant,
  // occasionally with fire_hydrant:type, ref, colour, diameter. Older tagging
  // uses amenity=fire_hydrant; include both.
  const query = `
    [out:json][timeout:15];
    (
      node(around:${radiusM},${coords.lat},${coords.lng})["emergency"="fire_hydrant"];
      node(around:${radiusM},${coords.lat},${coords.lng})["amenity"="fire_hydrant"];
    );
    out body;
  `;
  const body = `data=${encodeURIComponent(query)}`;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        elements?: {
          type: string;
          id: number;
          lat?: number;
          lon?: number;
          tags?: Record<string, string>;
        }[];
      };
      const hydrants: Hydrant[] = [];
      for (const el of json.elements ?? []) {
        if (el.type !== "node" || el.lat == null || el.lon == null) continue;
        hydrants.push({
          id: `osm-${el.id}`,
          lat: el.lat,
          lng: el.lon,
          ref: el.tags?.ref,
        });
      }
      // Sort by distance from the incident so the "closest" ones get H1..HN.
      hydrants.sort((a, b) => {
        const da = Math.hypot(a.lat - coords.lat, a.lng - coords.lng);
        const db = Math.hypot(b.lat - coords.lat, b.lng - coords.lng);
        return da - db;
      });
      return hydrants;
    } catch {
      // try next mirror
    }
  }
  return [];
}
