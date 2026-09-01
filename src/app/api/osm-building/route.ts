import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasShiftAccess } from "@/lib/auth/operator-access";

// Server-side proxy for Overpass API. Public Overpass mirrors regularly
// return 504 / hang when called from the browser, so we proxy here with a
// retry across mirrors and a long-lived in-memory cache. The result is the
// closest building polygon's [lat, lng] pairs, or null if none found.

type Success = { polygon: [number, number][] | null; source: "overpass" };
type Failure = { error: string; source: "overpass" };

// Ordered by recent reliability — the .de main is regularly overloaded and
// returns 504, .kumi sometimes hangs from UK hosts. .fr has been the most
// responsive in testing.
const OVERPASS_ENDPOINTS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

// In-memory cache for the lifetime of the server process. Keys are
// "lat,lng@radius" — same coords always resolve to the same polygon.
const cache = new Map<string, [number, number][] | null>();

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
  const radius = Math.max(5, Math.min(120, Number(sp.get("radius") ?? 40)));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "invalid coordinates", source: "overpass" } satisfies Failure,
      { status: 400 },
    );
  }

  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}@${radius}`;
  if (cache.has(cacheKey)) {
    return NextResponse.json({
      polygon: cache.get(cacheKey) ?? null,
      source: "overpass",
    } satisfies Success);
  }

  const polygon = await fetchClosestBuilding({ lat, lng }, radius);
  cache.set(cacheKey, polygon);
  return NextResponse.json({ polygon, source: "overpass" } satisfies Success);
}

async function fetchClosestBuilding(
  coords: { lat: number; lng: number },
  radiusM: number,
): Promise<[number, number][] | null> {
  const query = `[out:json][timeout:15];way(around:${radiusM},${coords.lat},${coords.lng})[building];out geom;`;
  const body = `data=${encodeURIComponent(query)}`;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        // Per-mirror timeout. Overpass can take a few seconds for a warm
        // building query; 12s is generous enough for a small bounding box
        // without making total wait absurd if all mirrors are sad.
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        elements?: { type: string; geometry?: { lat: number; lon: number }[] }[];
      };
      const polygons: [number, number][][] = [];
      for (const el of json.elements ?? []) {
        if (el.type !== "way" || !el.geometry || el.geometry.length < 3) continue;
        polygons.push(el.geometry.map((p) => [p.lat, p.lon] as [number, number]));
      }
      if (polygons.length === 0) return null;
      let best: { dist: number; poly: [number, number][] } | null = null;
      for (const poly of polygons) {
        let cLat = 0;
        let cLng = 0;
        for (const [lat, lng] of poly) {
          cLat += lat;
          cLng += lng;
        }
        cLat /= poly.length;
        cLng /= poly.length;
        const dist = Math.hypot(cLat - coords.lat, cLng - coords.lng);
        if (!best || dist < best.dist) best = { dist, poly };
      }
      return best?.poly ?? null;
    } catch {
      // Try the next mirror.
    }
  }
  return null;
}
