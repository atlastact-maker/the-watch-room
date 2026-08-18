// Fetches the closest OSM building footprint to a given lat/lng via our
// own /api/osm-building proxy (which talks to Overpass server-side with
// retries + cache). Used by the ground view to highlight the actual
// incident premises instead of a schematic rectangle.

type LatLng = { lat: number; lng: number };

const cache = new Map<string, Promise<[number, number][] | null>>();

/** Returns a polygon ([lat, lng] pairs) for the closest OSM building within
 *  ~40m of the given coords, or null if none found / the request fails. */
export function fetchOsmBuildingPolygon(
  coords: LatLng,
  radiusM = 40,
): Promise<[number, number][] | null> {
  const key = `${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}@${radiusM}`;
  const existing = cache.get(key);
  if (existing) return existing;
  const p = doFetch(coords, radiusM);
  cache.set(key, p);
  // If the request fails, drop the cached failure so a later attempt can retry.
  p.then((result) => {
    if (result === null) cache.delete(key);
  });
  return p;
}

async function doFetch(coords: LatLng, radiusM: number): Promise<[number, number][] | null> {
  const url = `/api/osm-building?lat=${coords.lat}&lng=${coords.lng}&radius=${radiusM}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as { polygon?: [number, number][] | null };
    const poly = json.polygon ?? null;
    if (!poly || poly.length < 3) return null;
    return poly;
  } catch {
    return null;
  }
}
