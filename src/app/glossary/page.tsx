import type { Metadata } from "next";
import type { StationWithAppliances } from "@/app/dashboard/page";
import { ConsoleShell } from "@/app/menu/console-shell";
import { consoleSession, consoleUser } from "@/app/menu/console-session";
import { STATIONS, getStationAppliances } from "@/lib/sim/data";
import { LibraryView } from "./library-view";

export const metadata: Metadata = { title: "Reference library · The Watch Room" };

export default async function GlossaryPage() {
  const session = await consoleSession();
  // The same server-side fleet build as the dashboard, so the resource
  // directory shows the exact modelled fleet.
  const stations: StationWithAppliances[] = STATIONS.map((s) => ({ ...s, appliances: getStationAppliances(s.id) }));
  return (
    <ConsoleShell {...consoleUser(session)} active="library" title="Reference library">
      <LibraryView stations={stations} />
    </ConsoleShell>
  );
}
