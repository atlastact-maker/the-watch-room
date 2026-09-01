import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasShiftAccess } from "@/lib/auth/operator-access";

// Server-side proxy for OSM road polylines around an incident. Used by
// the ground map to snap operator parking clicks onto the nearest road.
// Returns a list of ways with their geometry (lat/lng pairs). Cached
// per-(coords, radius) for the lifetime of the server process so a
// given incident only resolves once.

type Way = { id: string; coords: [number, number][]; highway?: string };
type Success = { ways: Way[]; source: "overpass" };
type Failure = { error: string; source: "overpass" };

const OVERPASS_ENDPOINTS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const cache = new Map<string, Way[]>();

export async function GET(request: NextRequest): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Session alone is not enough: these proxy paid or rate-limited
  // upstreams (OS Maps, OpenRouteService, Overpass), and anyone at
  // all can register. Only accounts that can actually run a shift
  // have a page that calls them.
  if (!user || !(await hasShiftAccess(supabase, user.email))) {
    return NextResponse.json(
      { error: "unauthorized", source: "overpass" } satisfies Failure,
      { status: 401 },
    );
  }

  const sp = request.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));
  const radius = Math.max(50, Math.min(600, Number(sp.get("radius") ?? 250)));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "invalid coordinates", source: "overpass" } satisfies Failure,
      { status: 400 },
    );
  }

  const key = `${lat.toFixed(6)},${lng.toFixed(6)}@${radius}`;
  if (cache.has(key)) {
    return NextResponse.json({
      ways: cache.get(key) ?? [],
      source: "overpass",
    } satisfies Success);
  }

  const ways = await fetchRoads({ lat, lng }, radius);
  cache.set(key, ways);
  return NextResponse.json({ ways, source: "overpass" } satisfies Success);
}

async function fetchRoads(
  coords: { lat: number; lng: number },
  radiusM: number,
): Promise<Way[]> {
  // Drivable / parkable public ways. Exclude motorway main carriageway
  // (operators don't park an appliance in lane 1 of the M60), but keep
  // slip roads so RTC scenarios on motorway junctions still work.
  const query = `
    [out:json][timeout:15];
    way(around:${radiusM},${coords.lat},${coords.lng})[highway~"^(primary|secondary|tertiary|unclassified|residential|service|living_street|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$"];
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
        elements?: {
          type: string;
          id: number;
          tags?: Record<string, string>;
          geometry?: { lat: number; lon: number }[];
        }[];
      };
      const ways: Way[] = [];
      for (const el of json.elements ?? []) {
        if (el.type !== "way" || !el.geometry || el.geometry.length < 2) continue;
        ways.push({
          id: `osm-${el.id}`,
          coords: el.geometry.map((g) => [g.lat, g.lon] as [number, number]),
          highway: el.tags?.highway,
        });
      }
      return ways;
    } catch {
      // try next mirror
    }
  }
  return [];
}
