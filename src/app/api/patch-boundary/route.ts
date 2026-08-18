import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Real GMFRS / Greater Manchester district boundaries.
 *
 * Fetched from the OSM Overpass API — we query the admin_level=8
 * (metropolitan borough) relations for each district in the requested
 * patch, parse their outer rings, and return one ring per borough.
 *
 * Patch groupings follow the GMFRS command structure visible in
 * `data/research/fire/gmfrs_stations.json`:
 *
 *   Southern → Trafford, Manchester, Stockport
 *   Eastern  → Rochdale, Oldham, Bury, Tameside
 *   Western  → Bolton, Wigan, Salford
 *
 * Result is cached in-memory per-patch so the expensive Overpass call is
 * made at most once per patch per server process.
 */

const PATCH_BOROUGHS: Record<string, string[]> = {
  Southern: ["Trafford", "Manchester", "Stockport"],
  Eastern: ["Rochdale", "Oldham", "Bury", "Tameside"],
  Western: ["Bolton", "Wigan", "Salford"],
};

type Success = { rings: [number, number][][]; source: "overpass" };
type Failure = { error: string; source: "overpass" };

const OVERPASS_ENDPOINTS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const cache = new Map<string, [number, number][][]>();

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

  const patch = request.nextUrl.searchParams.get("patch") ?? "";
  const boroughs = PATCH_BOROUGHS[patch];
  if (!boroughs) {
    return NextResponse.json(
      { error: `unknown patch: ${patch}`, source: "overpass" } satisfies Failure,
      { status: 400 },
    );
  }

  if (cache.has(patch)) {
    return NextResponse.json({
      rings: cache.get(patch)!,
      source: "overpass",
    } satisfies Success);
  }

  const rings = await fetchBoroughOuterRings(boroughs);
  if (rings.length > 0) cache.set(patch, rings);
  return NextResponse.json({ rings, source: "overpass" } satisfies Success);
}

/**
 * Fetch the outer rings of the admin_level=8 metropolitan borough relations
 * for a list of borough names. Returns one ring per borough (or multiple if
 * a borough has disjoint parts — rare but possible).
 */
async function fetchBoroughOuterRings(names: string[]): Promise<[number, number][][]> {
  // One Overpass query for every borough. We filter by name + admin level +
  // the "boundary=administrative" tag to avoid matching ward / parish
  // relations that share a name. Bounding-box the search to Greater
  // Manchester so a stray "Manchester" relation in the US can't match.
  const nameFilters = names
    .map((n) => `relation["boundary"="administrative"]["admin_level"="8"]["name"="${n}"](53.30,-2.80,53.75,-1.90);`)
    .join("\n  ");
  const query = `[out:json][timeout:30];
(
  ${nameFilters}
);
out body;
>;
out skel qt;`;
  const body = `data=${encodeURIComponent(query)}`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(25_000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as OverpassPayload;
      return assembleOuterRings(json);
    } catch {
      // try next mirror
    }
  }
  return [];
}

type OverpassPayload = {
  elements: OverpassElement[];
};
type OverpassElement =
  | { type: "node"; id: number; lat: number; lon: number }
  | { type: "way"; id: number; nodes: number[] }
  | {
      type: "relation";
      id: number;
      tags?: { name?: string };
      members: { type: "way" | "node"; ref: number; role: string }[];
    };

/**
 * For each relation in the Overpass payload, thread its outer member ways
 * into a closed ring. A borough's outer boundary is a single closed ring
 * in the vast majority of cases; disjoint exclaves would produce more than
 * one ring, which we preserve as separate entries.
 */
function assembleOuterRings(payload: OverpassPayload): [number, number][][] {
  const nodes = new Map<number, { lat: number; lon: number }>();
  const ways = new Map<number, number[]>();
  const relations: {
    id: number;
    name: string;
    outerWayIds: number[];
  }[] = [];
  for (const el of payload.elements) {
    if (el.type === "node") nodes.set(el.id, { lat: el.lat, lon: el.lon });
    else if (el.type === "way") ways.set(el.id, el.nodes);
    else if (el.type === "relation") {
      const outerWays = el.members
        .filter((m) => m.type === "way" && m.role === "outer")
        .map((m) => m.ref);
      relations.push({ id: el.id, name: el.tags?.name ?? "", outerWayIds: outerWays });
    }
  }

  const outRings: [number, number][][] = [];
  for (const rel of relations) {
    // Materialise each way's node sequence into [lat, lng] pairs.
    const wayLines = rel.outerWayIds
      .map((id) => ways.get(id))
      .filter((x): x is number[] => !!x)
      .map((ns) => ns.map((nid) => nodes.get(nid)).filter((n): n is { lat: number; lon: number } => !!n))
      .map((pts) => pts.map((p) => [p.lat, p.lon] as [number, number]))
      .filter((line) => line.length >= 2);
    // Thread ways end-to-end until each ring closes.
    for (const ring of threadRings(wayLines)) {
      // Simplify aggressively — borough boundaries can have thousands of
      // vertices. We target a tolerance (~15 m) that keeps the shape
      // recognisable but renders cheaply.
      const simplified = simplifyRing(ring, 0.00015);
      if (simplified.length >= 3) outRings.push(simplified);
    }
  }
  return outRings;
}

function threadRings(segments: [number, number][][]): [number, number][][] {
  const remaining = segments.slice();
  const rings: [number, number][][] = [];
  while (remaining.length > 0) {
    const ring = remaining.shift()!.slice();
    let closed = pointsEqual(ring[0], ring[ring.length - 1]);
    while (!closed) {
      const tail = ring[ring.length - 1];
      // Find a segment starting or ending at `tail` and splice it on.
      const idx = remaining.findIndex(
        (seg) => pointsEqual(seg[0], tail) || pointsEqual(seg[seg.length - 1], tail),
      );
      if (idx === -1) break; // dangling chain — give up
      const seg = remaining.splice(idx, 1)[0];
      if (pointsEqual(seg[seg.length - 1], tail)) seg.reverse();
      for (let i = 1; i < seg.length; i++) ring.push(seg[i]);
      closed = pointsEqual(ring[0], ring[ring.length - 1]);
    }
    if (closed && ring.length >= 4) rings.push(ring);
  }
  return rings;
}

function pointsEqual(a: [number, number], b: [number, number]): boolean {
  return Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
}

/** Ramer–Douglas–Peucker in lat/lng space. Tolerance in degrees. */
function simplifyRing(ring: [number, number][], tol: number): [number, number][] {
  if (ring.length <= 4) return ring;
  const keep = new Array<boolean>(ring.length).fill(false);
  keep[0] = true;
  keep[ring.length - 1] = true;
  const stack: [number, number][] = [[0, ring.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop()!;
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
  const out: [number, number][] = [];
  for (let i = 0; i < ring.length; i++) if (keep[i]) out.push(ring[i]);
  return out;
}

function perpendicularDistance(
  p: [number, number],
  a: [number, number],
  b: [number, number],
): number {
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
