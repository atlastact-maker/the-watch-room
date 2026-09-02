import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasShiftAccess } from "@/lib/auth/operator-access";

// HEMS landing-zone surface check. Classifies the ground at a picked
// LZ point from OSM via Overpass:
//
//   unsuitable — buildings under the approach, water, woodland, or
//                overhead power lines
//   field      — grass / park / farmland / recreation ground
//   carriageway— on or beside a road (assumed closed by the incident;
//                the client warns the operator to confirm closure)
//   open       — nothing mapped either way; treated as clear ground
//
// If every Overpass mirror fails we return verdict "unknown" — the
// client proceeds with a "surface unverified" caveat rather than
// blocking gameplay on a flaky public API.

type Verdict =
  | { verdict: "unsuitable"; reason: string; source: "overpass" }
  | { verdict: "suitable"; kind: "field" | "carriageway" | "open"; source: "overpass" }
  | { verdict: "unknown"; source: "overpass" };

const OVERPASS_ENDPOINTS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const cache = new Map<string, Verdict>();

const FIELD_LANDUSE = /^(grass|meadow|farmland|recreation_ground|village_green|greenfield)$/;
const FIELD_LEISURE = /^(park|pitch|garden|common|golf_course)$/;
const FIELD_NATURAL = /^(grassland|heath)$/;
const ROAD_HIGHWAY =
  /^(motorway|motorway_link|trunk|trunk_link|primary|secondary|tertiary|unclassified|residential|service)$/;

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
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "invalid coordinates" }, { status: 400 });
  }

  const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const hit = cache.get(key);
  if (hit) return NextResponse.json(hit);

  const verdict = await classify(lat, lng);
  if (verdict.verdict !== "unknown") cache.set(key, verdict);
  return NextResponse.json(verdict);
}

async function classify(lat: number, lng: number): Promise<Verdict> {
  // Separate radii per hazard class: a building 18 m away fouls the
  // rotor disc; a power line deserves a wider berth; a road only counts
  // if the point is basically on it.
  const query = `
    [out:json][timeout:15];
    (
      way(around:18,${lat},${lng})["building"];
      way(around:30,${lat},${lng})["power"~"^(line|minor_line)$"];
      way(around:15,${lat},${lng})["natural"="water"];
      way(around:15,${lat},${lng})["landuse"="reservoir"];
      way(around:15,${lat},${lng})["natural"="wood"];
      way(around:15,${lat},${lng})["landuse"="forest"];
      way(around:20,${lat},${lng})["landuse"];
      way(around:20,${lat},${lng})["leisure"];
      way(around:20,${lat},${lng})["natural"];
      way(around:12,${lat},${lng})["highway"];
    );
    out tags;
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
        elements?: { tags?: Record<string, string> }[];
      };
      let field = false;
      let road = false;
      for (const el of json.elements ?? []) {
        const t = el.tags ?? {};
        if (t.building) {
          return {
            verdict: "unsuitable",
            reason: "structures under the approach",
            source: "overpass",
          };
        }
        if (t.power === "line" || t.power === "minor_line") {
          return {
            verdict: "unsuitable",
            reason: "overhead power lines",
            source: "overpass",
          };
        }
        if (t.natural === "water" || t.landuse === "reservoir") {
          return { verdict: "unsuitable", reason: "open water", source: "overpass" };
        }
        if (t.natural === "wood" || t.landuse === "forest") {
          return { verdict: "unsuitable", reason: "woodland", source: "overpass" };
        }
        if (
          (t.landuse && FIELD_LANDUSE.test(t.landuse)) ||
          (t.leisure && FIELD_LEISURE.test(t.leisure)) ||
          (t.natural && FIELD_NATURAL.test(t.natural))
        ) {
          field = true;
        }
        if (t.highway && ROAD_HIGHWAY.test(t.highway)) {
          road = true;
        }
      }
      if (field) return { verdict: "suitable", kind: "field", source: "overpass" };
      if (road) return { verdict: "suitable", kind: "carriageway", source: "overpass" };
      return { verdict: "suitable", kind: "open", source: "overpass" };
    } catch {
      // try next mirror
    }
  }
  return { verdict: "unknown", source: "overpass" };
}
