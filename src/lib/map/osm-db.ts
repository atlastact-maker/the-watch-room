// Roads and hydrants from our own copy of OpenStreetMap (migration 019,
// loaded by tools/osm-import), read through the security-definer
// functions so the tables themselves stay closed.
//
// Every reader treats "nothing came back" and "the function is missing"
// the same way: fall back to Overpass. Before the import has run the
// tables are empty, and the desk must keep working exactly as it did.

import type { SupabaseClient } from "@supabase/supabase-js";

export type DbWay = { id: string; coords: [number, number][]; highway?: string; name?: string };
export type DbHydrant = { id: string; lat: number; lng: number; ref?: string };

/** The drivable / parkable classes the roads route has always served.
 *  Motorway and trunk main carriageways stay out (nobody parks an
 *  appliance in lane one of the M60); their slip roads stay in so RTCs
 *  on junctions still work. */
export const PARKABLE_HIGHWAYS = [
  "primary", "secondary", "tertiary", "unclassified", "residential", "service", "living_street",
  "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link",
];

type RoadRow = { id: number; name: string | null; highway: string; coords: [number, number][] | null };
type HydrantRow = { id: string; ref: string | null; source: string; lat: number; lng: number };

/** Roads within `radiusM`, or null when the database cannot answer. An
 *  empty array is a real answer (no roads there), which the caller may
 *  still choose to double-check against Overpass. */
export async function roadsNearFromDb(
  supabase: SupabaseClient,
  coords: { lat: number; lng: number },
  radiusM: number,
  highways: string[] | null = PARKABLE_HIGHWAYS,
): Promise<DbWay[] | null> {
  const { data, error } = await supabase.rpc("roads_near", {
    p_lat: coords.lat,
    p_lng: coords.lng,
    p_radius_m: radiusM,
    p_highways: highways,
  });
  if (error || !Array.isArray(data)) return null;
  const ways: DbWay[] = [];
  for (const r of data as RoadRow[]) {
    if (!r.coords || r.coords.length < 2) continue;
    ways.push({
      id: `osm-${r.id}`,
      coords: r.coords,
      highway: r.highway,
      name: r.name ?? undefined,
    });
  }
  return ways;
}

/** Hydrants within `radiusM`, nearest first, or null when the database
 *  cannot answer. */
export async function hydrantsNearFromDb(
  supabase: SupabaseClient,
  coords: { lat: number; lng: number },
  radiusM: number,
): Promise<DbHydrant[] | null> {
  const { data, error } = await supabase.rpc("hydrants_near", {
    p_lat: coords.lat,
    p_lng: coords.lng,
    p_radius_m: radiusM,
  });
  if (error || !Array.isArray(data)) return null;
  return (data as HydrantRow[]).map((h) => ({
    id: h.id,
    lat: h.lat,
    lng: h.lng,
    ref: h.ref ?? undefined,
  }));
}

/** Kerbside hydrants invented on real roads, for the streets where OSM
 *  has none mapped: the nearest node first, then any node at least
 *  forty metres from every one already picked, up to four. */
export function synthesiseHydrantsOnWays(ways: DbWay[], coords: { lat: number; lng: number }): DbHydrant[] {
  const nodes: { lat: number; lng: number; dist: number }[] = [];
  for (const w of ways) {
    for (const [lat, lng] of w.coords) nodes.push({ lat, lng, dist: Math.hypot(lat - coords.lat, lng - coords.lng) });
  }
  if (nodes.length === 0) return [];
  nodes.sort((a, b) => a.dist - b.dist);
  const picked: DbHydrant[] = [];
  const minGapLat = 40 / 111_000;
  for (const n of nodes) {
    if (!picked.every((p) => Math.hypot(p.lat - n.lat, p.lng - n.lng) >= minGapLat)) continue;
    picked.push({ id: `synth-${picked.length + 1}-${n.lat.toFixed(5)}-${n.lng.toFixed(5)}`, lat: n.lat, lng: n.lng });
    if (picked.length >= 4) break;
  }
  return picked;
}
