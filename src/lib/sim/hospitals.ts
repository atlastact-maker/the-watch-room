import raw from "@/../data/research/ambulance/gm_hospitals.json";

export type Hospital = {
  id: string;
  name: string;
  address: string;
  town: string;
  postcode: string;
  coords: { lat: number; lng: number };
};

export const HOSPITALS: Hospital[] = raw.hospitals;

function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
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

export function nearestHospital(coords: { lat: number; lng: number }): Hospital {
  let best = HOSPITALS[0];
  let bestDist = haversineMeters(coords, best.coords);
  for (let i = 1; i < HOSPITALS.length; i++) {
    const d = haversineMeters(coords, HOSPITALS[i].coords);
    if (d < bestDist) {
      best = HOSPITALS[i];
      bestDist = d;
    }
  }
  return best;
}

/**
 * Random offload duration in seconds (30 min to 3 hrs). Per the design doc,
 * real UK hospital offloads span this range depending on ED pressure. For MVP
 * we roll uniform across the range; a later pass can assign per-hospital
 * pressure indexes so busy EDs consistently hold longer.
 */
export function rollOffloadSeconds(rnd: () => number = Math.random): number {
  return Math.round(30 * 60 + rnd() * (180 - 30) * 60);
}
