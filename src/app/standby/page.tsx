import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth/actions";
import { setViewAs } from "@/app/actions/view-as";
import { effectiveShiftAccess } from "@/lib/auth/view-as";
import { accessProfile, isTester, resolveInsignia } from "@/lib/auth/operator-access";
import { advisorStanding } from "@/lib/auth/advisor-standing";
import { SIGNUP_OPENS_AT, signupOpen } from "@/lib/auth/signup-window";
import { ensurePreAlphaRequest, prealphaDoors, prealphaOpensLabel, prealphaSignups } from "@/lib/prealpha";
import { AdvisorSync } from "@/app/components/advisor-sync";
import { ensureDiscordRoles } from "@/lib/discord/roles";
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
  const [{ tester: onList }, doors, { asTester }] = await Promise.all([isTester(supabase, user.email), prealphaDoors(supabase), effectiveShiftAccess(supabase, user.email)]);
  // A linked Discord account on the list gets its role in the server, once.
  await ensureDiscordRoles(supabase, user);
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
      actions={<>
        {asTester && (
          <form action={setViewAs}>
            <input type="hidden" name="mode" value="admin" />
            <input type="hidden" name="next" value="/menu" />
            <button type="submit" className={styles.textButton} title="Return to the administrator view">Admin view</button>
          </form>
        )}
        <form action={logout}><button type="submit" className={styles.textButton}>Sign out</button></form>
      </>}
    >
      {/* Files an application that only ever reached user_metadata: applicants are held here, so this is where it has to run. */}
      {standing === "unfiled" && <AdvisorSync />}
      <StandbyView
        data={{
          callsign,
          advisor: standing,
          // An admin viewing as a tester stands here as an accepted tester does.
          listed: asTester || onList || prealpha.standing === "accepted",
          doorsOpen: doors.open,
          prealpha: { standing: asTester ? "accepted" : prealpha.standing, tableMissing: prealpha.tableMissing },
          testerView: asTester,
          signups: { open: signups.open, closed: signups.closed, closes: signups.closes, opens: signups.opens || prealphaOpensLabel() },
          insignia,
          programmeOpen: signupOpen(),
          opensOn: new Date(SIGNUP_OPENS_AT).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
        }}
      />
    </PublicShell>
  );
}
