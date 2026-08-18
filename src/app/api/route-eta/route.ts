import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Server-side proxy for OpenRouteService driving directions. Keeps ORS_API_KEY
// off the client and gives us a single place to cache / rate-limit / swap
// providers later. Returns a stable shape regardless of upstream response.

type Success = {
  meters: number;
  seconds: number;
  coords: [number, number][]; // [lat, lng] pairs for Leaflet
  source: "ors";
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

  const key = process.env.ORS_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "ORS_API_KEY not configured", source: "ors" } satisfies Failure,
      { status: 503 },
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

  const upstream = new URL(
    `https://api.openrouteservice.org/v2/directions/${profile}`,
  );
  upstream.searchParams.set("api_key", key);
  upstream.searchParams.set("start", `${fromLng},${fromLat}`);
  upstream.searchParams.set("end", `${toLng},${toLat}`);

  let body: unknown;
  try {
    const res = await fetch(upstream.toString(), {
      // ORS responses vary little for fixed coords, so cache aggressively on
      // the server for 10 minutes to reduce quota burn from repeated shifts.
      next: { revalidate: 600 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `ORS upstream ${res.status}`, source: "ors" } satisfies Failure,
        { status: 502 },
      );
    }
    body = await res.json();
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "fetch failed",
        source: "ors",
      } satisfies Failure,
      { status: 502 },
    );
  }

  const feature = (body as {
    features?: {
      geometry?: { coordinates?: [number, number][] };
      properties?: { summary?: { distance?: number; duration?: number } };
    }[];
  })?.features?.[0];

  const raw = feature?.geometry?.coordinates;
  const meters = feature?.properties?.summary?.distance;
  const seconds = feature?.properties?.summary?.duration;

  if (
    !Array.isArray(raw) ||
    raw.length < 2 ||
    typeof meters !== "number" ||
    typeof seconds !== "number"
  ) {
    return NextResponse.json(
      { error: "ORS returned no route", source: "ors" } satisfies Failure,
      { status: 502 },
    );
  }

  const coords: [number, number][] = raw.map(([lng, lat]) => [lat, lng]);

  return NextResponse.json({ meters, seconds, coords, source: "ors" } satisfies Success);
}
