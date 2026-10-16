import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { hasAdminAccess, hasShiftAccess, isTester } from "@/lib/auth/operator-access";
import { PREALPHA_ACCESS, PREALPHA_ASKS, PREALPHA_FOCUS, PREALPHA_NOT_YET, ensurePreAlphaRequest, prealphaOpensLabel, prealphaSignups } from "@/lib/prealpha";
import { SCENARIO_META } from "@/lib/sim/scenarios/meta";
import { ConsoleShell, PlainShell } from "@/app/menu/console-shell";
import { consoleSession, consoleUser } from "@/app/menu/console-session";
import { PreAlphaBriefing, type BriefingData } from "./briefing";

// The pre-alpha, explained once for everyone. Operators and
// administrators read it inside the console; visitors, applicants and
// testers waiting for the doors get the same page without the sidebar.

export const metadata: Metadata = {
  title: "Pre-alpha briefing · The Watch Room",
  description: "The Watch Room's closed pre-alpha: live incidents across fire, ambulance and police, one operator, one county. Request access to test it.",
};

export default async function PreAlphaPage({ searchParams }: { searchParams: Promise<{ invited?: string }> }) {
  const { invited } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const signups = await prealphaSignups(supabase);
  const { standing, application, tableMissing } = await ensurePreAlphaRequest(supabase, user);
  const inAlready = user ? await hasShiftAccess(supabase, user.email) : false;
  const admin = user ? await hasAdminAccess(supabase, user.email) : false;
  const onList = user ? (await isTester(supabase, user.email)).tester : false;
  const accepted = standing === "accepted" || onList || inAlready || admin;
  const operator = inAlready || admin;
  // On the list, but the doors are closed: the briefing without the door.
  const waiting = accepted && !operator;

  // Which scenarios are open right now. Admins see every scenario;
  // testers the released set. The list is the briefing's headline.
  let openJobs: BriefingData["openJobs"] = [];
  if (accepted) {
    const { data } = await supabase.from("released_scenarios").select("scenario_id");
    const ids = new Set((data ?? []).map((r) => String(r.scenario_id)));
    openJobs = SCENARIO_META.filter((s) => ids.has(s.id)).map((s) => ({ id: s.id, title: s.title, service: s.pda[0]?.service ?? "Fire" }));
  }

  const data: BriefingData = {
    accepted,
    waiting,
    operator,
    invited: invited === "1",
    standing,
    signedIn: !!user,
    signups: { open: signups.open, closed: signups.closed, closes: signups.closes, opens: signups.opens || prealphaOpensLabel() },
    tableMissing,
    appliedOn: application ? new Date(application.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long" }) : null,
    openJobs,
    access: PREALPHA_ACCESS,
    focus: PREALPHA_FOCUS,
    asks: PREALPHA_ASKS,
    notYet: PREALPHA_NOT_YET,
  };

  if (operator) {
    const session = await consoleSession();
    return (
      <ConsoleShell {...consoleUser(session)} active="briefing" title="Pre-alpha briefing">
        <PreAlphaBriefing data={data} />
      </ConsoleShell>
    );
  }
  return (
    <PlainShell title={accepted ? "Pre-alpha briefing" : "Closed pre-alpha"} chip="Closed pre-alpha" back={user ? { href: "/standby", label: "Your standing" } : { href: "/login", label: "Log in" }}>
      <PreAlphaBriefing data={data} />
    </PlainShell>
  );
}
