import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isOperator } from "@/lib/auth/operator-access";
import { STATIONS, getStationAppliances } from "@/lib/sim/data";
import type { Appliance, AreaCode, Station } from "@/lib/sim/types";
import { DashboardClient } from "./dashboard-client";

export type StationWithAppliances = Station & { appliances: Appliance[] };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Same lock as the menu — the dashboard is the shift, so it holds too.
  if (!isOperator(user.email)) redirect("/standby");

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
