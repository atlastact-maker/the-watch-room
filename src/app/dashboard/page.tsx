import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server";
import { hasAdminAccess, hasShiftAccess } from "@/lib/auth/operator-access";
import { viewingAsTester } from "@/lib/auth/view-as";
import { STATIONS, getStationAppliances } from "@/lib/sim/data";
import type { Appliance, AreaCode, Station } from "@/lib/sim/types";
import { DashboardClient } from "./dashboard-client";

export type StationWithAppliances = Station & { appliances: Appliance[] };

export default async function DashboardPage() {
  // The layout already fetched the user for this request; this is the
  // same answer, not a second round trip.
  const { supabase, user } = await currentUser();
  if (!user) redirect("/login");
  // Same lock as the menu — the dashboard is the shift, so it holds too.
  if (!(await hasShiftAccess(supabase, user.email))) redirect("/standby");

  // A tester's desk only draws from the released scenarios; an admin's
  // draws from all of them. Before migration 018 the table is missing and
  // the query errors, which reads as "nothing released" for a tester —
  // the safe way round.
  const realAdmin = await hasAdminAccess(supabase, user.email);
  const asTester = realAdmin && (await viewingAsTester());
  const admin = realAdmin && !asTester;
  let releasedScenarioIds: string[] | null = null;
  if (!admin) {
    const { data } = await supabase.from("released_scenarios").select("scenario_id");
    releasedScenarioIds = (data ?? []).map((r) => String(r.scenario_id));
  }

  // Pre-compute appliances per station server-side so the client bundle stays lean.
  const stationsByArea: Record<AreaCode, StationWithAppliances[]> = {
    Southern: [],
    Eastern: [],
    Western: [],
    ForceWide: [],
  };
  for (const s of STATIONS) {
    stationsByArea[s.area].push({ ...s, appliances: getStationAppliances(s.id) });
  }

  return (
    <DashboardClient
      userEmail={user.email ?? ""}
      stationsByArea={stationsByArea}
      releasedScenarioIds={releasedScenarioIds}
      viewAs={realAdmin ? (asTester ? "tester" : "admin") : null}
    />
  );
}
