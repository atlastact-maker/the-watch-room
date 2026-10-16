import type { Metadata } from "next";
import { ConsoleShell } from "@/app/menu/console-shell";
import { consoleSession, consoleUser } from "@/app/menu/console-session";
import { StatsView } from "./stats-view";

export const metadata: Metadata = { title: "Service record · The Watch Room" };

export default async function StatsPage() {
  const session = await consoleSession();
  return (
    <ConsoleShell {...consoleUser(session)} active="record" title="Service record">
      <StatsView />
    </ConsoleShell>
  );
}
