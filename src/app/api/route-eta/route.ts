import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Server-side routing proxy. Primary: OpenRouteService (keyed, 40 req/min
// free tier). Fallback: the public OSRM demo server — keyless, so a burst
// of station-ETA requests that blows the ORS rate limit still comes back
// with real road geometry instead of degrading to straight lines.

type Success = {
  meters: number;
  seconds: number;
  coords: [number, number][]; // [lat, lng] pairs for Leaflet
  source: "ors" | "osrm";
};

type Failure = { error: string; source: "ors" };

export async function GET(request: NextRequest): Promise<Response> {
  // Gate to logged-in users so random visitors can't burn the ORS quota.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized", source: "ors" } satisfies Failure, {
      status: 401,
    });
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

  // Primary: ORS (when keyed and under quota).
  const key = process.env.ORS_API_KEY;
  if (key) {
    const ors = await fetchOrs(key, profile, fromLat, fromLng, toLat, toLng);
    if (ors) return NextResponse.json(ors);
  }

  // Fallback: public OSRM demo server (driving only — its foot profile
  // isn't hosted, so foot requests estimate duration from the driving
  // geometry at walking pace).
  const osrm = await fetchOsrm(fromLat, fromLng, toLat, toLng, mode);
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

const WALKING_MPS = 1.4;

async function fetchOsrm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  mode: "driving" | "foot",
): Promise<Success | null> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${fromLng},${fromLat};${toLng},${toLat}` +
    `?overview=full&geometries=geojson&alternatives=false&steps=false`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(8_000),
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
      seconds: mode === "foot" ? meters / WALKING_MPS : seconds,
      coords: raw.map(([lng, lat]) => [lat, lng] as [number, number]),
      source: "osrm",
    };
  } catch {
    return null;
  }
}
