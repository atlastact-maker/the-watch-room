import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth/actions";
import { accessProfile, isTester, resolveInsignia } from "@/lib/auth/operator-access";
import { advisorStanding } from "@/lib/auth/advisor-standing";
import { SIGNUP_OPENS_AT, signupOpen } from "@/lib/auth/signup-window";
import { ensurePreAlphaRequest, prealphaDoors, prealphaOpensLabel, prealphaSignups } from "@/lib/prealpha";
import { AdvisorSync } from "@/app/components/advisor-sync";
import { PublicShell } from "@/app/menu/console-shell";
import styles from "@/app/menu/watch-menu.module.css";
import { StandbyView } from "./standby-view";

// Advisor standing (see lib/auth/advisor-standing):
//   accepted  — onto the programme; the insignia and the closed room.
//   pending   — application filed and waiting on a decision.
//   declined  — reviewed and not taken forward. Said plainly.
//   unfiled   — ticked the box, but the application never reached the
//               advisors table. <AdvisorSync /> files it and refreshes.
//   none      — not an applicant.

export const metadata: Metadata = { title: "Standing by · The Watch Room" };

export default async function StandbyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Signed-in accounts only. The proxy redirects anonymous visitors too,
  // but it fails open if its Supabase call throws, and this page reports
  // an account's standing, so it checks for itself.
  if (!user) redirect("/login");

  const { role, icon: assignedIcon } = await accessProfile(supabase, user.email);
  const standing = await advisorStanding(supabase, user, role);
  const prealpha = await ensurePreAlphaRequest(supabase, user);
  const signups = await prealphaSignups(supabase);
  const [{ tester: onList }, doors] = await Promise.all([isTester(supabase, user.email), prealphaDoors(supabase)]);
  const metadata = user.user_metadata ?? {};
  const callsign = typeof metadata.callsign === "string" ? metadata.callsign : "";
  // Accepted advisors wear the insignia of the service off their
  // application, unless a different key sits in their user_roles row.
  const insignia = standing === "accepted" ? await resolveInsignia(supabase, user.id, assignedIcon) : null;

  return (
    <PublicShell
      brandLine="Standing by"
      chip="Closed Pre-Alpha"
      links={[{ href: "/prealpha", label: "Pre-Alpha briefing" }, { href: "/settings", label: "Account settings", button: true }]}
      actions={<form action={logout}><button type="submit" className={styles.textButton}>Log out</button></form>}
    >
      {/* Files an application that only ever reached user_metadata: applicants are held here, so this is where it has to run. */}
      {standing === "unfiled" && <AdvisorSync />}
      <StandbyView
        data={{
          callsign,
          advisor: standing,
          listed: onList || prealpha.standing === "accepted",
          doorsOpen: doors.open,
          prealpha: { standing: prealpha.standing, tableMissing: prealpha.tableMissing },
          signups: { open: signups.open, closed: signups.closed, closes: signups.closes, opens: signups.opens || prealphaOpensLabel() },
          insignia,
          programmeOpen: signupOpen(),
          opensOn: new Date(SIGNUP_OPENS_AT).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
        }}
      />
    </PublicShell>
  );
}
