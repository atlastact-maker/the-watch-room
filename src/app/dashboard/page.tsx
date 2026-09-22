import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server";
import { hasShiftAccess } from "@/lib/auth/operator-access";
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
    />
  );
}
