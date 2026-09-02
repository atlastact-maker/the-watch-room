// Live weather for the operator's patch.
//
// The shift weather used to be rolled from a plausible Greater Manchester
// distribution. That was fine, but the real thing is free and better: if
// it is blowing a gale over Manchester tonight, the wind should be
// pushing the fire the way it actually is, HEMS should be grounded for
// the reason it actually would be, and the operator should recognise the
// weather out of their own window.
//
// Open-Meteo needs no API key and no attribution beyond good manners, so
// there is nothing for the operator to configure and no secret to leak.
// Cached at the edge for ten minutes — weather does not move faster than
// that, and a shift should not hammer it.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UPSTREAM = "https://api.open-meteo.com/v1/forecast";

export async function GET(request: Request) {
  // Auth-gated like the other proxies — no open relay.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  const url =
    `${UPSTREAM}?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
    "&current=temperature_2m,relative_humidity_2m,precipitation,weather_code," +
    "wind_speed_10m,wind_direction_10m,is_day" +
    "&wind_speed_unit=mph&timezone=Europe%2FLondon";

  try {
    const res = await fetch(url, {
      // Ten minutes at the edge; a shift is not a weather station.
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `upstream ${res.status}` },
        { status: 502 },
      );
    }
    const body = await res.json();
    const c = body?.current;
    if (!c) {
      return NextResponse.json({ error: "no current block" }, { status: 502 });
    }
    return NextResponse.json(
      {
        tempC: c.temperature_2m,
        humidityPct: c.relative_humidity_2m,
        precipMm: c.precipitation,
        weatherCode: c.weather_code,
        windMph: c.wind_speed_10m,
        windFromDeg: c.wind_direction_10m,
        isDay: c.is_day === 1,
        observedAt: c.time ?? null,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=1800",
        },
      },
    );
  } catch {
    // Caller falls back to the rolled weather — a flaky forecast API must
    // never stop a shift starting.
    return NextResponse.json({ error: "unreachable" }, { status: 502 });
  }
}
