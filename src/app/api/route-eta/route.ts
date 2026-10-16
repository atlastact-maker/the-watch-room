import { NextResponse, type NextRequest } from "next/server";
import { shiftGate } from "@/lib/auth/api-guard";
import { ownOsrmBase } from "@/lib/map/osrm";

// Server-side routing proxy. First: our own OSRM router (tools/osrm) when
// OSRM_URL is set — no quota, car and foot profiles. Then OpenRouteService
// (keyed, 40 req/min free tier). Last: the public OSRM demo server —
// keyless, so a burst of station-ETA requests that blows the ORS rate
// limit still comes back with real road geometry instead of degrading to
// straight lines.

type Success = {
  meters: number;
  seconds: number;
  coords: [number, number][]; // [lat, lng] pairs for Leaflet
  source: "own" | "ors" | "osrm";
};

type Failure = { error: string; source: "ors" };

export async function GET(request: NextRequest): Promise<Response> {
  // Gate to logged-in users so random visitors can't burn the ORS quota.
  const gate = await shiftGate();
  if (!gate.ok) {
    return NextResponse.json(
      {
        error: gate.status === 401 ? "unauthorized" : "forbidden",
        source: "ors",
      } satisfies Failure,
      { status: gate.status },
    );
  }

  const sp = request.nextUrl.searchParams;
  const fromLat = Number(sp.get("fromLat"));
  const fromLng = Number(sp.get("fromLng"));
  const toLat = Number(sp.get("toLat"));
  const toLng = Number(sp.get("toLng"));
  const mode = sp.get("mode") === "foot" ? "foot" : "driving";
  const profile = mode === "foot" ? "foot-walking" : "driving-car";

  if (
    !Number.isFinite(fromLat) ||
    !Number.isFinite(fromLng) ||
    !Number.isFinite(toLat) ||
    !Number.isFinite(toLng)
  ) {
    return NextResponse.json(
      { error: "invalid coordinates", source: "ors" } satisfies Failure,
      { status: 400 },
    );
  }

  // Areas to keep off — a carriageway closed on another job. Only
  // OpenRouteService takes them; without it the caller prices its own
  // diversion rather than being handed a route through the closure.
  const avoid = parseAvoid(sp.get("avoid"));
  if (avoid === "bad") {
    return NextResponse.json({ error: "invalid avoid areas", source: "ors" } satisfies Failure, { status: 400 });
  }
  if (avoid) {
    const key = process.env.ORS_API_KEY;
    if (key) {
      const ors = await fetchOrsAvoiding(key, profile, fromLat, fromLng, toLat, toLng, avoid);
      if (ors) return NextResponse.json(ors);
    }
    return NextResponse.json(
      { error: "no routing upstream can avoid areas", source: "ors" } satisfies Failure,
      { status: 501 },
    );
  }

  // First: our own router, when the deployment has one.
  const own = ownOsrmBase();
  if (own) {
    const hit = await fetchOsrm(own, fromLat, fromLng, toLat, toLng, mode, true);
    if (hit) return NextResponse.json(hit);
  }

  // Then ORS (when keyed and under quota).
  const key = process.env.ORS_API_KEY;
  if (key) {
    const ors = await fetchOrs(key, profile, fromLat, fromLng, toLat, toLng);
    if (ors) return NextResponse.json(ors);
  }

  // Fallback: public OSRM demo server (driving only — its foot profile
  // isn't hosted, so foot requests estimate duration from the driving
  // geometry at walking pace).
  const osrm = await fetchOsrm("https://router.project-osrm.org", fromLat, fromLng, toLat, toLng, mode, false);
  if (osrm) return NextResponse.json(osrm);

  return NextResponse.json(
    { error: "no routing upstream available", source: "ors" } satisfies Failure,
    { status: 502 },
  );
}

async function fetchOrs(
  key: string,
  profile: string,
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<Success | null> {
  const upstream = new URL(
    `https://api.openrouteservice.org/v2/directions/${profile}`,
  );
  upstream.searchParams.set("api_key", key);
  upstream.searchParams.set("start", `${fromLng},${fromLat}`);
  upstream.searchParams.set("end", `${toLng},${toLat}`);

  try {
    const res = await fetch(upstream.toString(), {
      // ORS responses vary little for fixed coords, so cache aggressively on
      // the server for 10 minutes to reduce quota burn from repeated shifts.
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      features?: {
        geometry?: { coordinates?: [number, number][] };
        properties?: { summary?: { distance?: number; duration?: number } };
      }[];
    };
    const feature = body?.features?.[0];
    const raw = feature?.geometry?.coordinates;
    const meters = feature?.properties?.summary?.distance;
    const seconds = feature?.properties?.summary?.duration;
    if (
      !Array.isArray(raw) ||
      raw.length < 2 ||
      typeof meters !== "number" ||
      typeof seconds !== "number"
    ) {
      return null;
    }
    return {
      meters,
      seconds,
      coords: raw.map(([lng, lat]) => [lat, lng] as [number, number]),
      source: "ors",
    };
  } catch {
    return null;
  }
}

/** Up to eight rings of up to 200 [lat, lng] points, as the client sends them. */
function parseAvoid(raw: string | null): [number, number][][] | null | "bad" {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 8) return "bad";
    const rings: [number, number][][] = [];
    for (const ring of parsed) {
      if (!Array.isArray(ring) || ring.length < 4 || ring.length > 200) return "bad";
      const pts: [number, number][] = [];
      for (const p of ring) {
        if (!Array.isArray(p) || p.length !== 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) return "bad";
        pts.push([Number(p[0]), Number(p[1])]);
      }
      rings.push(pts);
    }
    return rings;
  } catch {
    return "bad";
  }
}

async function fetchOrsAvoiding(
  key: string,
  profile: string,
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  avoid: [number, number][][],
): Promise<Success | null> {
  try {
    const res = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
      method: "POST",
      headers: { Authorization: key, "Content-Type": "application/json" },
      body: JSON.stringify({
        coordinates: [[fromLng, fromLat], [toLng, toLat]],
        options: {
          avoid_polygons: {
            type: "MultiPolygon",
            coordinates: avoid.map((ring) => [ring.map(([lat, lng]) => [lng, lat])]),
          },
        },
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      features?: {
        geometry?: { coordinates?: [number, number][] };
        properties?: { summary?: { distance?: number; duration?: number } };
      }[];
    };
    const feature = body?.features?.[0];
    const raw = feature?.geometry?.coordinates;
    const meters = feature?.properties?.summary?.distance;
    const seconds = feature?.properties?.summary?.duration;
    if (!Array.isArray(raw) || raw.length < 2 || typeof meters !== "number" || typeof seconds !== "number") return null;
    return { meters, seconds, coords: raw.map(([lng, lat]) => [lat, lng] as [number, number]), source: "ors" };
  } catch {
    return null;
  }
}

const WALKING_MPS = 1.4;

/** OSRM's route service. Our own server has a real foot profile; the
 *  public demo server hosts driving only, so foot requests there take
 *  the driving geometry at walking pace. */
async function fetchOsrm(
  base: string,
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  mode: "driving" | "foot",
  own: boolean,
): Promise<Success | null> {
  const profile = own ? mode : "driving";
  const url =
    `${base}/route/v1/${profile}/` +
    `${fromLng},${fromLat};${toLng},${toLat}` +
    `?overview=full&geometries=geojson&alternatives=false&steps=false`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(own ? 5_000 : 8_000),
      headers: { "User-Agent": "TheWatchRoom-sim/0.1 (UK ops-room game)" },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      code?: string;
      routes?: {
        distance?: number;
        duration?: number;
        geometry?: { coordinates?: [number, number][] };
      }[];
    };
    const route = body?.routes?.[0];
    const raw = route?.geometry?.coordinates;
    const meters = route?.distance;
    const seconds = route?.duration;
    if (
      body?.code !== "Ok" ||
      !Array.isArray(raw) ||
      raw.length < 2 ||
      typeof meters !== "number" ||
      typeof seconds !== "number"
    ) {
      return null;
    }
    return {
      meters,
      seconds: mode === "foot" && !own ? meters / WALKING_MPS : seconds,
      coords: raw.map(([lng, lat]) => [lat, lng] as [number, number]),
      source: own ? "own" : "osrm",
    };
  } catch {
    return null;
  }
}
