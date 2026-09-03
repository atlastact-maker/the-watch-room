// British National Grid → latitude/longitude. Pure maths, no imports.
//
// Two stages, kept separate so each can be checked against its own
// reference. First the inverse Transverse Mercator on the Airy 1830
// ellipsoid, which turns eastings/northings into OSGB36 latitude and
// longitude — the OS's own worked example (Caister Water Tower) pins this
// stage to the millimetre. Then a Helmert transformation OSGB36 → WGS84
// with the OS published parameters, good to a few metres across Great
// Britain — a marker's width, and all a control room's map needs.

export type LatLon = { lat: number; lng: number };

/** Inverse Transverse Mercator: BNG (E, N) → OSGB36 lat/lon in degrees. */
export function bngToOsgb36(E: number, N: number): LatLon {
  // Airy 1830 ellipsoid and the National Grid projection constants.
  const a = 6377563.396;
  const b = 6356256.909;
  const F0 = 0.9996012717;
  const lat0 = (49 * Math.PI) / 180;
  const lon0 = (-2 * Math.PI) / 180;
  const N0 = -100000;
  const E0 = 400000;
  const e2 = 1 - (b * b) / (a * a);
  const n = (a - b) / (a + b);

  let lat = lat0;
  let M = 0;
  // Sane inputs converge in a handful of passes. The cap is for inputs
  // so large that a double's resolution exceeds the tolerance and the
  // residual would oscillate for ever.
  let passes = 0;
  do {
    if (++passes > 24) break;
    lat = (N - N0 - M) / (a * F0) + lat;
    const Ma = (1 + n + (5 / 4) * n * n + (5 / 4) * n * n * n) * (lat - lat0);
    const Mb = (3 * n + 3 * n * n + (21 / 8) * n * n * n) * Math.sin(lat - lat0) * Math.cos(lat + lat0);
    const Mc =
      ((15 / 8) * n * n + (15 / 8) * n * n * n) * Math.sin(2 * (lat - lat0)) * Math.cos(2 * (lat + lat0));
    const Md = (35 / 24) * n * n * n * Math.sin(3 * (lat - lat0)) * Math.cos(3 * (lat + lat0));
    M = b * F0 * (Ma - Mb + Mc - Md);
  } while (Math.abs(N - N0 - M) >= 0.00001);

  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const tanLat = Math.tan(lat);
  const nu = (a * F0) / Math.sqrt(1 - e2 * sinLat * sinLat);
  const rho = (a * F0 * (1 - e2)) / Math.pow(1 - e2 * sinLat * sinLat, 1.5);
  const eta2 = nu / rho - 1;

  const t2 = tanLat * tanLat;
  const t4 = t2 * t2;
  const t6 = t4 * t2;
  const VII = tanLat / (2 * rho * nu);
  const VIII = (tanLat / (24 * rho * nu ** 3)) * (5 + 3 * t2 + eta2 - 9 * t2 * eta2);
  const IX = (tanLat / (720 * rho * nu ** 5)) * (61 + 90 * t2 + 45 * t4);
  const X = 1 / (cosLat * nu);
  const XI = (1 / (cosLat * 6 * nu ** 3)) * (nu / rho + 2 * t2);
  const XII = (1 / (cosLat * 120 * nu ** 5)) * (5 + 28 * t2 + 24 * t4);
  const XIIA = (1 / (cosLat * 5040 * nu ** 7)) * (61 + 662 * t2 + 1320 * t4 + 720 * t6);

  const dE = E - E0;
  const latOsgb = lat - VII * dE ** 2 + VIII * dE ** 4 - IX * dE ** 6;
  const lonOsgb = lon0 + X * dE - XI * dE ** 3 + XII * dE ** 5 - XIIA * dE ** 7;
  return { lat: (latOsgb * 180) / Math.PI, lng: (lonOsgb * 180) / Math.PI };
}

/** OSGB36 lat/lon (degrees) → WGS84 lat/lon (degrees), by Helmert. */
export function osgb36ToWgs84(p: LatLon): LatLon {
  // Airy 1830 → geocentric.
  const a = 6377563.396;
  const b = 6356256.909;
  const e2 = 1 - (b * b) / (a * a);
  const phi = (p.lat * Math.PI) / 180;
  const lam = (p.lng * Math.PI) / 180;
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const nu = a / Math.sqrt(1 - e2 * sinPhi * sinPhi);
  const x1 = nu * cosPhi * Math.cos(lam);
  const y1 = nu * cosPhi * Math.sin(lam);
  const z1 = (1 - e2) * nu * sinPhi;

  // OS published OSGB36 → WGS84 parameters.
  const tx = 446.448;
  const ty = -125.157;
  const tz = 542.06;
  const rx = (0.1502 / 3600) * (Math.PI / 180);
  const ry = (0.247 / 3600) * (Math.PI / 180);
  const rz = (0.8421 / 3600) * (Math.PI / 180);
  const s = -20.4894 / 1e6;

  const x2 = tx + (1 + s) * x1 - rz * y1 + ry * z1;
  const y2 = ty + rz * x1 + (1 + s) * y1 - rx * z1;
  const z2 = tz - ry * x1 + rx * y1 + (1 + s) * z1;

  // Geocentric → WGS84 geodetic.
  const a2 = 6378137;
  const b2 = 6356752.3142;
  const e22 = 1 - (b2 * b2) / (a2 * a2);
  const pr = Math.sqrt(x2 * x2 + y2 * y2);
  let latW = Math.atan2(z2, pr * (1 - e22));
  for (let i = 0; i < 12; i++) {
    const nuW = a2 / Math.sqrt(1 - e22 * Math.sin(latW) ** 2);
    const next = Math.atan2(z2 + e22 * nuW * Math.sin(latW), pr);
    if (Math.abs(next - latW) < 1e-12) {
      latW = next;
      break;
    }
    latW = next;
  }
  const lonW = Math.atan2(y2, x2);
  return { lat: (latW * 180) / Math.PI, lng: (lonW * 180) / Math.PI };
}

/** BNG (E, N) → WGS84 lat/lon in degrees. */
export function bngToWgs84(E: number, N: number): LatLon {
  return osgb36ToWgs84(bngToOsgb36(E, N));
}
