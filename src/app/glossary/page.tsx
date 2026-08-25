import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STATIONS, getStationAppliances } from "@/lib/sim/data";
import type { StationWithAppliances } from "@/app/dashboard/page";
import { GlossaryPageView } from "./glossary-page-view";

export default async function GlossaryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Same server-side fleet build as the dashboard, so the Resource
  // directory tab shows the exact modelled fleet.
  const stations: StationWithAppliances[] = STATIONS.map((s) => ({
    ...s,
    appliances: getStationAppliances(s.id),
  }));

  return <GlossaryPageView stations={stations} />;
}
