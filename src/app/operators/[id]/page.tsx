import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConsoleShell } from "@/app/menu/console-shell";
import { consoleSession, consoleUser } from "@/app/menu/console-session";
import { createClient } from "@/lib/supabase/server";
import { evaluateHonours } from "@/lib/awards";
import { isUuid, loadOperatorProfile } from "@/lib/operators";
import { ProfileMissing, ProfileView } from "./profile-view";

export const metadata: Metadata = { title: "Operator profile · The Watch Room" };

// One operator as the others see them. The database function decides
// what this viewer gets (migration 028); the page only lays it out.
export default async function OperatorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string | string[] }> }) {
  const { id } = await params;
  const { notice } = await searchParams;
  if (!isUuid(id)) notFound();
  const session = await consoleSession();
  const supabase = await createClient();
  const { profile, missing } = await loadOperatorProfile(supabase, id);
  const own = profile?.relation === "self";
  return (
    <ConsoleShell {...consoleUser(session)} active={own ? "record" : "colleagues"} title={profile ? profile.callsign.toUpperCase() : "Operator profile"}>
      {profile ? <ProfileView profile={profile} honours={evaluateHonours(profile.facts, profile.awards)} notice={typeof notice === "string" ? notice : undefined} /> : <ProfileMissing missing={missing} />}
    </ConsoleShell>
  );
}
