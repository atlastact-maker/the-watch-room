// Client helper that fetches real OSM fire hydrants via /api/osm-hydrants
// (which proxies Overpass server-side with retries + cache).

type LatLng = { lat: number; lng: number };
export type OsmHydrant = { id: string; lat: number; lng: number; ref?: string };

const cache = new Map<string, Promise<OsmHydrant[]>>();

export function fetchOsmHydrants(coords: LatLng, radiusM = 300): Promise<OsmHydrant[]> {
  const key = `${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}@${radiusM}`;
  const existing = cache.get(key);
  if (existing) return existing;
  const p = doFetch(coords, radiusM);
  cache.set(key, p);
  p.then((r) => {
    if (r.length === 0) cache.delete(key); // allow retry if empty
  });
  return p;
}

async function doFetch(coords: LatLng, radiusM: number): Promise<OsmHydrant[]> {
  try {
    const res = await fetch(`/api/osm-hydrants?lat=${coords.lat}&lng=${coords.lng}&radius=${radiusM}`);
    if (!res.ok) return [];
    const json = (await res.json()) as { hydrants?: OsmHydrant[] };
    return json.hydrants ?? [];
  } catch {
    return [];
  }
}
