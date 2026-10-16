import { AdvisorSync } from "@/app/components/advisor-sync";
import { createClient } from "@/lib/supabase/server";
import { systemsStatus } from "./systems-status";
import { consoleSession, consoleUser } from "./console-session";
import { countyFacts, plateStations } from "./county-facts";
import type { MenuView } from "./menu-types";
import { WatchMenu } from "./watch-menu";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const session = await consoleSession();
  const params = await searchParams;
  const systems = await systemsStatus(await createClient());
  const view: MenuView = params.view === "shift" || params.view === "guide" || params.view === "updates" ? params.view : "overview";
  return <>
    <AdvisorSync />
    <WatchMenu
      key={view}
      view={view}
      userId={session.userId}
      {...consoleUser(session)}
      facts={countyFacts()}
      stations={plateStations()}
      systems={systems}
    />
  </>;
}
