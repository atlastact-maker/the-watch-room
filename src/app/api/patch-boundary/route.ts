import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasShiftAccess } from "@/lib/auth/operator-access";
import boundaries from "@/lib/sim/patch_boundaries.json";

/**
 * Real GMFRS / Greater Manchester district boundaries.
 *
 * Served from a static bake (src/lib/sim/patch_boundaries.json) of the
 * OSM admin_level=8 metropolitan borough relations — fetched once via
 * scripts/fetch-patch-boundaries.mjs, threaded into outer rings and
 * simplified to ~15 m tolerance. Baking them in removes the runtime
 * Overpass dependency, which was timing out inside Vercel's function
 * limit and getting rate-limited from cloud IPs (the map then silently
 * rendered no boundary at all).
 *
 * Patch groupings follow the GMFRS command structure visible in
 * `data/research/fire/gmfrs_stations.json`:
 *
 *   Southern → Trafford, Manchester, Stockport
 *   Eastern  → Rochdale, Oldham, Bury, Tameside
 *   Western  → Bolton, Wigan, Salford
 *
 * Data © OpenStreetMap contributors, ODbL. Re-run the script if OSM
 * redraws a borough.
 */

type Success = { rings: [number, number][][]; source: "static-osm" };
type Failure = { error: string; source: "static-osm" };

const RINGS = boundaries as unknown as Record<string, [number, number][][]>;

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
    return NextResponse.json(
      { error: "unauthorized", source: "static-osm" } satisfies Failure,
      { status: 401 },
    );
  }

  const patch = request.nextUrl.searchParams.get("patch") ?? "";
  const rings = RINGS[patch];
  if (!rings) {
    return NextResponse.json(
      { error: `unknown patch: ${patch}`, source: "static-osm" } satisfies Failure,
      { status: 400 },
    );
  }

  return NextResponse.json(
    { rings, source: "static-osm" } satisfies Success,
    { headers: { "Cache-Control": "private, max-age=86400" } },
  );
}
