import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ensureDiscordRoles } from "@/lib/discord/roles";
import { isTester } from "@/lib/auth/operator-access";
import { effectiveShiftAccess } from "@/lib/auth/view-as";
import { ensurePreAlphaRequest, prealphaOpensLabel, prealphaSignups, programmeClock } from "@/lib/prealpha";
import { PREALPHA_ACCESS_STEPS, PREALPHA_ASKS, PREALPHA_FOCUS, PREALPHA_KEY_DATES, PREALPHA_NOT_YET, PREALPHA_OPENING_SCENARIOS, PREALPHA_RELEASE_AT, PREALPHA_RELEASE_LABEL } from "@/lib/prealpha-programme";
import { SCENARIO_META } from "@/lib/sim/scenarios/meta";
import { ConsoleShell, PublicShell } from "@/app/menu/console-shell";
import { consoleSession, consoleUser } from "@/app/menu/console-session";
import { PreAlphaBriefing, type BriefingData } from "./briefing";

// The Pre-Alpha, explained once for everyone. Operators and
// administrators read it inside the console; visitors, applicants and
// testers waiting for the doors get the same page without the sidebar.

export const metadata: Metadata = {
  title: "Pre-Alpha briefing · The Watch Room",
  description: "The Watch Room's closed Pre-Alpha: live incidents across fire, ambulance and police, one operator, one county. Request access to test it.",
};

export default async function PreAlphaPage({ searchParams }: { searchParams: Promise<{ invited?: string }> }) {
  const { invited } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const signups = await prealphaSignups(supabase);
  const { standing, application, tableMissing } = await ensurePreAlphaRequest(supabase, user);
  // An admin viewing as a tester reads the briefing as an accepted
  // tester does: on the list, and through the door only when it is open.
  const access = user ? await effectiveShiftAccess(supabase, user.email) : null;
  const asTester = access?.asTester ?? false;
  const inAlready = access?.hasShift ?? false;
  const admin = (access?.realAdmin ?? false) && !asTester;
  const onList = user ? (await isTester(supabase, user.email)).tester : false;
  if (user) await ensureDiscordRoles(supabase, user);
  const accepted = standing === "accepted" || onList || inAlready || admin || asTester;
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
    keyDates: PREALPHA_KEY_DATES,
    accessSteps: PREALPHA_ACCESS_STEPS,
    opening: PREALPHA_OPENING_SCENARIOS,
    releaseLabel: PREALPHA_RELEASE_LABEL,
    releaseAt: PREALPHA_RELEASE_AT,
    now: programmeClock(),
    focus: PREALPHA_FOCUS,
    asks: PREALPHA_ASKS,
    notYet: PREALPHA_NOT_YET,
  };

  if (operator) {
    const session = await consoleSession();
    return (
      <ConsoleShell {...consoleUser(session)} active="briefing" title="Pre-Alpha briefing">
        <PreAlphaBriefing data={data} />
      </ConsoleShell>
    );
  }
  return (
    <PublicShell brandLine="Closed Pre-Alpha" links={user ? [{ href: "/standby", label: "Your standing", button: true }] : [{ href: "/login", label: "Sign in" }, { href: "/signup?prealpha=1", label: "Create an account", primary: true }]}>
      <PreAlphaBriefing data={data} />
    </PublicShell>
  );
}
