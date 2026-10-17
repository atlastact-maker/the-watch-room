import type { Metadata } from "next";
import { ConsoleShell } from "@/app/menu/console-shell";
import { consoleSession, consoleUser } from "@/app/menu/console-session";
import { createClient } from "@/lib/supabase/server";
import { loadOperatorProfile, type OperatorProfile } from "@/lib/operators";
import { StatsView } from "./stats-view";

export const metadata: Metadata = { title: "Service record · The Watch Room" };

export default async function StatsPage() {
  const session = await consoleSession();
  // The account's own profile, for the honours and the facts behind them.
  // Best effort: the record itself is read on the client as before.
  let profile: OperatorProfile | null = null;
  try {
    profile = (await loadOperatorProfile(await createClient(), session.userId)).profile;
  } catch {
    profile = null;
  }
  return (
    <ConsoleShell {...consoleUser(session)} active="record" title="Service record">
      <StatsView profile={profile} userId={session.userId} />
    </ConsoleShell>
  );
}
