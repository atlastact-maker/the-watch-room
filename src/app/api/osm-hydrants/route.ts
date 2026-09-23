import { NextResponse, type NextRequest } from "next/server";
import { shiftGate } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { hydrantsNearFromDb, roadsNearFromDb, synthesiseHydrantsOnWays, type DbHydrant, type DbWay } from "@/lib/map/osm-db";

// Fire hydrants around an incident, as { id, lat, lng, ref? } within the
// requested radius. Our own copy of the county's hydrants (migration
// 019, tools/osm-import) answers first; the public Overpass mirrors are
// only asked while that copy is empty or unreachable. Cached in-memory
// for the server process lifetime so a given incident only resolves once.

type Hydrant = DbHydrant;
type Source = "supabase" | "overpass";
type Success = { hydrants: Hydrant[]; source: Source };
type Failure = { error: string; source: Source };

const OVERPASS_ENDPOINTS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

// A found set is kept for the process; an empty answer for a minute, so a
// mirror that timed out does not cost the incident its hydrants.
const cache = new Map<string, { at: number; hydrants: Hydrant[]; source: Source }>();
const EMPTY_TTL_MS = 60_000;

export async function GET(request: NextRequest): Promise<Response> {
  const gate = await shiftGate();
  if (!gate.ok) {
    return NextResponse.json(
      {
        error: gate.status === 401 ? "unauthorized" : "forbidden",
        source: "overpass",
      } satisfies Failure,
      { status: gate.status },
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
  const hit = cache.get(key);
  if (hit && (hit.hydrants.length > 0 || Date.now() - hit.at < EMPTY_TTL_MS)) {
    return NextResponse.json({ hydrants: hit.hydrants, source: hit.source } satisfies Success);
  }

  const supabase = await createClient();
  const fromDb = await hydrantsNearFromDb(supabase, { lat, lng }, radius);
  if (fromDb && fromDb.length > 0) {
    cache.set(key, { at: Date.now(), hydrants: fromDb, source: "supabase" });
    return NextResponse.json({ hydrants: fromDb, source: "supabase" } satisfies Success);
  }

  let source: Source = "overpass";
  let hydrants = await fetchHydrants({ lat, lng }, radius);
  // OSM hydrant coverage is patchy in the UK — if none are mapped in the
  // vicinity, fall back to synthesising a few plausible kerbside hydrants
  // from road nodes so the operator has something meaningful to connect
  // to. Our own roads first, the mirrors only if those are missing too.
  if (hydrants.length === 0) {
    const dbRoads = await roadsNearFromDb(supabase, { lat, lng }, radius);
    if (dbRoads && dbRoads.length > 0) {
      hydrants = synthesiseHydrantsOnWays(dbRoads, { lat, lng });
      source = "supabase";
    } else {
      hydrants = synthesiseHydrantsOnWays(await fetchOverpassRoads({ lat, lng }, radius), { lat, lng });
    }
  }
  cache.set(key, { at: Date.now(), hydrants, source });
  return NextResponse.json({ hydrants, source } satisfies Success);
}

/** Drivable roads from the Overpass mirrors, for synthesising hydrants
 *  when neither our own tables nor OSM's hydrant nodes have anything. */
async function fetchOverpassRoads(
  coords: { lat: number; lng: number },
  radiusM: number,
): Promise<DbWay[]> {
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
        elements?: { type: string; id: number; tags?: Record<string, string>; geometry?: { lat: number; lon: number }[] }[];
      };
      const ways: DbWay[] = [];
      for (const el of json.elements ?? []) {
        if (el.type !== "way" || !el.geometry || el.geometry.length < 2) continue;
        ways.push({ id: `osm-${el.id}`, coords: el.geometry.map((g) => [g.lat, g.lon] as [number, number]), highway: el.tags?.highway, name: el.tags?.name });
      }
      return ways;
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
