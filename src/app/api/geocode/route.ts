import { NextResponse, type NextRequest } from "next/server";
import { shiftGate } from "@/lib/auth/api-guard";
import { bngToWgs84 } from "@/lib/geo/bng";

// Address lookup for the desk's search — the live half, behind the
// records the sim already holds. Ordnance Survey's Names API: every
// settlement, street and postcode in Great Britain, on the same Data Hub
// key the tiles use. It needs the "OS Names API" product added to that
// key's project; until it is, this answers 502 and the panel says so.
//
// Names returns British National Grid eastings and northings; the
// conversion to WGS84 is in lib/geo/bng — inverse Transverse Mercator
// then a Helmert shift, good to a few metres, which is a marker's width.

type Hit = {
  name: string;
  type: string;
  address: string;
  postcode?: string;
  lat: number;
  lng: number;
};
type Success = { results: Hit[]; source: "os-names" };
type Failure = { error: string; source: "os-names" };

// Greater Manchester, generously, in BNG metres. `bounds` steers the
// ranking upstream; the hard filter is ours, below, so a Whitehall in
// Westminster never comes back for a Whitehall in Bury.
const GM = { minX: 340000, minY: 375000, maxX: 415000, maxY: 425000 };
const GM_BBOX = `${GM.minX},${GM.minY},${GM.maxX},${GM.maxY}`;

// The local types worth a control room's time — only ones in the OS
// Open Names codelist. Metrolink stops, the Trafford Centre and the
// industrial estates are not in Names at all; the authored places cover
// those.
const LOCAL_TYPES = [
  "Named_Road",
  "Section_Of_Named_Road",
  "Numbered_Road",
  "Postcode",
  "City",
  "Town",
  "Village",
  "Hamlet",
  "Suburban_Area",
  "Other_Settlement",
  "Hospital",
  "Higher_or_University_Education",
  "Secondary_Education",
  "Primary_Education",
  "Railway_Station",
  "Airport",
];

export async function GET(request: NextRequest): Promise<Response> {
  const gate = await shiftGate();
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.status === 401 ? "unauthorized" : "forbidden", source: "os-names" } satisfies Failure,
      { status: gate.status },
    );
  }

  const key = process.env.OS_DATA_HUB_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OS mapping not configured", source: "os-names" } satisfies Failure,
      { status: 502 },
    );
  }

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 3) {
    return NextResponse.json({ results: [], source: "os-names" } satisfies Success, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  }

  const upstream = new URL("https://api.os.uk/search/names/v1/find");
  upstream.searchParams.set("query", q);
  upstream.searchParams.set("maxresults", "8");
  upstream.searchParams.set("bounds", GM_BBOX);
  upstream.searchParams.set("fq", LOCAL_TYPES.map((t) => `LOCAL_TYPE:${t}`).join(" "));
  upstream.searchParams.set("format", "JSON");
  upstream.searchParams.set("key", key);

  let body: unknown;
  try {
    const res = await fetch(upstream, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) {
      // Say why in the server log: a 400 here almost always means the
      // Names product is not on the key, or a filter the API rejects.
      const detail = (await res.text().catch(() => "")).slice(0, 200);
      console.warn(`[geocode] OS Names ${res.status}: ${detail}`);
      return NextResponse.json(
        { error: `OS Names upstream ${res.status}`, source: "os-names" } satisfies Failure,
        { status: 502 },
      );
    }
    body = await res.json();
  } catch {
    return NextResponse.json(
      { error: "OS Names unreachable", source: "os-names" } satisfies Failure,
      { status: 502 },
    );
  }

  // Shape defensively: a body that is valid JSON but not the shape the
  // API promises is a 502 to the panel, not a crash.
  const rawResults =
    body && typeof body === "object" ? (body as { results?: unknown }).results : undefined;
  if (rawResults !== undefined && !Array.isArray(rawResults)) {
    return NextResponse.json(
      { error: "OS Names returned an unexpected body", source: "os-names" } satisfies Failure,
      { status: 502 },
    );
  }
  const rows: Record<string, unknown>[] = [];
  for (const r of (rawResults ?? []) as unknown[]) {
    const e = r && typeof r === "object" ? (r as { GAZETTEER_ENTRY?: unknown }).GAZETTEER_ENTRY : undefined;
    if (e && typeof e === "object") rows.push(e as Record<string, unknown>);
  }

  const results: Hit[] = [];
  for (const e of rows) {
    const x = Number(e.GEOMETRY_X);
    const y = Number(e.GEOMETRY_Y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    // Inside the county, or not at all.
    if (x < GM.minX || x > GM.maxX || y < GM.minY || y > GM.maxY) continue;
    const { lat, lng } = bngToWgs84(x, y);
    const name = String(e.NAME1 ?? "");
    const type = String(e.LOCAL_TYPE ?? "").replace(/_/g, " ");
    const parts = [
      e.POPULATED_PLACE,
      e.DISTRICT_BOROUGH,
      e.COUNTY_UNITARY,
    ]
      .map((p) => (p ? String(p) : ""))
      .filter((p) => p && p !== name);
    results.push({
      name,
      type,
      address: parts.join(", "),
      postcode: e.POSTCODE_DISTRICT ? String(e.POSTCODE_DISTRICT) : undefined,
      lat,
      lng,
    });
  }

  return NextResponse.json({ results, source: "os-names" } satisfies Success, {
    // Private: gated bytes; cached in the browser for a minute so
    // retyping the same street does not re-hit the upstream.
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
