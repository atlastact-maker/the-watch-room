import { NextResponse, type NextRequest } from "next/server";
import { shiftGate } from "@/lib/auth/api-guard";

// One request prices a whole station sweep: every origin to one
// destination, road distance and driving time, no geometry. The sweep used
// to cost one routing call per station, which blew the routers' per-minute
// quota the moment a job opened and left every unit after the first forty
// on a straight line. The road line for the unit actually sent comes from
// /api/route-eta when it is mobilised.
//
// Primary: OpenRouteService matrix (keyed). Fallback: the public OSRM demo
// server's table service. Either answers null for a pair it cannot route;
// the client prices those by crow-fly.

type Coords = { lat: number; lng: number };
type Row = { meters: number; seconds: number } | null;
type Success = { rows: Row[]; source: "ors" | "osrm" };
type Failure = { error: string; source: "ors" };

const MAX_ORIGINS = 100;

export async function POST(request: NextRequest): Promise<Response> {
  const gate = await shiftGate();
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.status === 401 ? "unauthorized" : "forbidden", source: "ors" } satisfies Failure,
      { status: gate.status },
    );
  }

  let body: { to?: Coords; from?: Coords[] };
  try {
    body = (await request.json()) as { to?: Coords; from?: Coords[] };
  } catch {
    return NextResponse.json({ error: "invalid body", source: "ors" } satisfies Failure, { status: 400 });
  }
  const to = body.to;
  const from = body.from;
  const finite = (c: Coords | undefined): c is Coords =>
    !!c && Number.isFinite(c.lat) && Number.isFinite(c.lng);
  if (!finite(to) || !Array.isArray(from) || from.length === 0 || from.length > MAX_ORIGINS || !from.every(finite)) {
    return NextResponse.json({ error: "invalid coordinates", source: "ors" } satisfies Failure, { status: 400 });
  }

  const key = process.env.ORS_API_KEY;
  if (key) {
    const ors = await fetchOrsMatrix(key, from, to);
    if (ors) return NextResponse.json(ors);
  }
  const osrm = await fetchOsrmTable(from, to);
  if (osrm) return NextResponse.json(osrm);

  return NextResponse.json(
    { error: "no routing upstream available", source: "ors" } satisfies Failure,
    { status: 502 },
  );
}

function rowsFrom(durations: unknown, distances: unknown, n: number): Row[] | null {
  if (!Array.isArray(durations) || durations.length !== n) return null;
  const dist = Array.isArray(distances) && distances.length === n ? distances : null;
  return durations.map((d, i) => {
    const seconds = Array.isArray(d) ? d[0] : undefined;
    const meters = dist && Array.isArray(dist[i]) ? dist[i][0] : undefined;
    if (typeof seconds !== "number" || !Number.isFinite(seconds)) return null;
    // A table without distances still prices the time; the length is
    // recovered from the time at an urban average.
    const m = typeof meters === "number" && Number.isFinite(meters) ? meters : seconds * 11;
    return { meters: m, seconds };
  });
}

async function fetchOrsMatrix(key: string, from: Coords[], to: Coords): Promise<Success | null> {
  try {
    const res = await fetch("https://api.openrouteservice.org/v2/matrix/driving-car", {
      method: "POST",
      headers: { Authorization: key, "Content-Type": "application/json" },
      body: JSON.stringify({
        locations: [...from.map((c) => [c.lng, c.lat]), [to.lng, to.lat]],
        sources: from.map((_, i) => i),
        destinations: [from.length],
        metrics: ["distance", "duration"],
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { durations?: unknown; distances?: unknown };
    const rows = rowsFrom(body.durations, body.distances, from.length);
    return rows ? { rows, source: "ors" } : null;
  } catch {
    return null;
  }
}

async function fetchOsrmTable(from: Coords[], to: Coords): Promise<Success | null> {
  const coords = [...from, to].map((c) => `${c.lng},${c.lat}`).join(";");
  const sources = from.map((_, i) => i).join(";");
  const url =
    `https://router.project-osrm.org/table/v1/driving/${coords}` +
    `?sources=${sources}&destinations=${from.length}&annotations=duration,distance`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "TheWatchRoom-sim/0.1 (UK ops-room game)" },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { code?: string; durations?: unknown; distances?: unknown };
    if (body.code !== "Ok") return null;
    const rows = rowsFrom(body.durations, body.distances, from.length);
    return rows ? { rows, source: "osrm" } : null;
  } catch {
    return null;
  }
}
