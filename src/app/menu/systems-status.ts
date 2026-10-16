import type { SupabaseClient } from "@supabase/supabase-js";
import { ownOsrmStatus } from "@/lib/map/osrm";
import { prealphaDoors } from "@/lib/prealpha";
import type { SystemsStatus } from "./menu-types";

// The console's own health, as a CAD shows it on its status bar: the
// router, the map data, the account service and the programme. Read once
// per request for the overview. Every read is best effort; a service that
// cannot be reached reports as such rather than failing the page.

export async function systemsStatus(supabase: SupabaseClient): Promise<SystemsStatus> {
  const [routing, mapRes, doors, releasedRes] = await Promise.all([
    ownOsrmStatus().catch(() => ({ configured: false as const })),
    supabase.rpc("osm_map_status").then((r) => r, () => ({ data: null, error: { message: "unreachable" } })),
    prealphaDoors(supabase).catch(() => null),
    supabase.from("released_scenarios").select("scenario_id", { count: "exact", head: true }).then((r) => r, () => ({ count: null, error: { message: "unreachable" } })),
  ]);
  const mapRows = (mapRes.data ?? []) as { kind: string; row_count: number }[];
  return {
    routing: !routing.configured ? "public" : routing.reachable ? "own" : "degraded",
    routingHost: routing.configured ? routing.host : undefined,
    mapData: mapRes.error ? "unavailable" : mapRows.length === 0 ? "empty" : "loaded",
    mapKinds: mapRows.filter((m) => m.row_count > 0).map((m) => m.kind),
    account: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    doorsOpen: doors && !doors.tableMissing ? doors.open : null,
    released: releasedRes.error ? null : (releasedRes.count ?? 0),
  };
}
