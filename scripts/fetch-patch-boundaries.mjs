// One-off: fetch the GM borough boundaries for each patch from OSM
// (Overpass), assemble + simplify the outer rings, and write them to
// src/lib/sim/patch_boundaries.json so the app serves them statically.
//
//   node scripts/fetch-patch-boundaries.mjs
//
// Mirrors the assembly logic that used to live in
// src/app/api/patch-boundary/route.ts. Boundaries are stable — re-run
// only if OSM redraws a borough.
//
// Data © OpenStreetMap contributors, ODbL — openstreetmap.org/copyright

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PATCH_BOROUGHS = {
  Southern: ["Trafford", "Manchester", "Stockport"],
  Eastern: ["Rochdale", "Oldham", "Bury", "Tameside"],
  Western: ["Bolton", "Wigan", "Salford"],
};

const OVERPASS_ENDPOINTS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

async function fetchBoroughOuterRings(names) {
  const nameFilters = names
    .map(
      (n) =>
        `relation["boundary"="administrative"]["admin_level"="8"]["name"="${n}"](53.30,-2.80,53.75,-1.90);`,
    )
    .join("\n  ");
  const query = `[out:json][timeout:60];
(
  ${nameFilters}
);
out body;
>;
out skel qt;`;
  const body = `data=${encodeURIComponent(query)}`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`  trying ${endpoint}…`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // Overpass mirrors reject anonymous requests (403/406) — identify
          // ourselves per their usage policy.
          "User-Agent": "TheWatchRoom-sim/0.1 (one-off boundary bake; contact: atlastact@gmail.com)",
          Accept: "application/json",
        },
        body,
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) {
        console.log(`  ${endpoint} → HTTP ${res.status}`);
        continue;
      }
      const json = await res.json();
      const rings = assembleOuterRings(json);
      if (rings.length > 0) return rings;
      console.log(`  ${endpoint} → 0 rings assembled`);
    } catch (err) {
      console.log(`  ${endpoint} → ${err?.message ?? err}`);
    }
  }
  return [];
}

function assembleOuterRings(payload) {
  const nodes = new Map();
  const ways = new Map();
  const relations = [];
  for (const el of payload.elements ?? []) {
    if (el.type === "node") nodes.set(el.id, { lat: el.lat, lon: el.lon });
    else if (el.type === "way") ways.set(el.id, el.nodes);
    else if (el.type === "relation") {
      const outerWays = el.members
        .filter((m) => m.type === "way" && m.role === "outer")
        .map((m) => m.ref);
      relations.push({ id: el.id, name: el.tags?.name ?? "", outerWayIds: outerWays });
    }
  }
  const outRings = [];
  for (const rel of relations) {
    const wayLines = rel.outerWayIds
      .map((id) => ways.get(id))
      .filter(Boolean)
      .map((ns) => ns.map((nid) => nodes.get(nid)).filter(Boolean))
      .map((pts) => pts.map((p) => [p.lat, p.lon]))
      .filter((line) => line.length >= 2);
    for (const ring of threadRings(wayLines)) {
      const simplified = simplifyRing(ring, 0.00015);
      if (simplified.length >= 3) {
        // Round to 5 dp (~1 m) to keep the JSON compact.
        outRings.push(simplified.map(([a, b]) => [round5(a), round5(b)]));
      }
    }
  }
  return outRings;
}

function round5(x) {
  return Math.round(x * 1e5) / 1e5;
}

function threadRings(segments) {
  const remaining = segments.slice();
  const rings = [];
  while (remaining.length > 0) {
    const ring = remaining.shift().slice();
    let closed = pointsEqual(ring[0], ring[ring.length - 1]);
    while (!closed) {
      const tail = ring[ring.length - 1];
      const idx = remaining.findIndex(
        (seg) => pointsEqual(seg[0], tail) || pointsEqual(seg[seg.length - 1], tail),
      );
      if (idx === -1) break;
      const seg = remaining.splice(idx, 1)[0];
      if (pointsEqual(seg[seg.length - 1], tail)) seg.reverse();
      for (let i = 1; i < seg.length; i++) ring.push(seg[i]);
      closed = pointsEqual(ring[0], ring[ring.length - 1]);
    }
    if (closed && ring.length >= 4) rings.push(ring);
  }
  return rings;
}

function pointsEqual(a, b) {
  return Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
}

function simplifyRing(ring, tol) {
  if (ring.length <= 4) return ring;
  const keep = new Array(ring.length).fill(false);
  keep[0] = true;
  keep[ring.length - 1] = true;
  const stack = [[0, ring.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let maxD = 0;
    let maxI = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpendicularDistance(ring[i], ring[s], ring[e]);
      if (d > maxD) {
        maxD = d;
        maxI = i;
      }
    }
    if (maxD > tol && maxI !== -1) {
      keep[maxI] = true;
      stack.push([s, maxI], [maxI, e]);
    }
  }
  const out = [];
  for (let i = 0; i < ring.length; i++) if (keep[i]) out.push(ring[i]);
  return out;
}

function perpendicularDistance(p, a, b) {
  const [x, y] = [p[1], p[0]];
  const [x1, y1] = [a[1], a[0]];
  const [x2, y2] = [b[1], b[0]];
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const px = x1 + Math.max(0, Math.min(1, t)) * dx;
  const py = y1 + Math.max(0, Math.min(1, t)) * dy;
  return Math.hypot(x - px, y - py);
}

const out = {};
for (const [patch, boroughs] of Object.entries(PATCH_BOROUGHS)) {
  console.log(`${patch} (${boroughs.join(", ")})…`);
  const rings = await fetchBoroughOuterRings(boroughs);
  console.log(`  → ${rings.length} rings, ${rings.reduce((s, r) => s + r.length, 0)} points`);
  if (rings.length === 0) {
    console.error(`FAILED for ${patch} — aborting without writing.`);
    process.exit(1);
  }
  out[patch] = rings;
}

const dest = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "lib",
  "sim",
  "patch_boundaries.json",
);
writeFileSync(dest, JSON.stringify(out));
console.log(`wrote ${dest}`);
