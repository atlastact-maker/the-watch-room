import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth/actions";
import { accessProfile, isTester, resolveInsignia } from "@/lib/auth/operator-access";
import {
  advisorStanding,
  type AdvisorStanding,
} from "@/lib/auth/advisor-standing";
import { signupOpen } from "@/lib/auth/signup-window";
import { ensurePreAlphaRequest, prealphaDoors, prealphaOpen, prealphaOpensLabel } from "@/lib/prealpha";
import { RequestPreAlphaButton } from "@/app/prealpha/request-button";
import { ServiceBadge } from "@/app/components/service-insignia";
import { AdvisorSync } from "@/app/components/advisor-sync";

// Where a signed-in account lands when it cannot open the desk: a new
// account, a tester with the doors closed, an advisor. It is the
// account's own page, so the pre-alpha comes first (that is what most
// accounts are here for), and the advisor programme is shown where the
// account has applied to it — and only offered, in a line, where it has
// not.
//
// Advisor standing (see lib/auth/advisor-standing):
//   accepted  — onto the programme; the insignia and the closed room.
//   pending   — application filed and waiting on a decision.
//   declined  — reviewed and not taken forward. Said plainly.
//   unfiled   — ticked the box, but the application never reached the
//               advisors table. <AdvisorSync /> files it and refreshes.
//   none      — not an applicant.

export const metadata = {
  title: "Standing by — The Watch Room",
};

// The advisor decision, in the colour it carries elsewhere.
const ADVISOR_LINE: Record<AdvisorStanding, { text: string; tone: string }> = {
  accepted: { text: "Accepted", tone: "text-(--color-ok)" },
  pending: { text: "In review", tone: "text-(--color-amber)" },
  declined: { text: "Not this time", tone: "text-(--color-critical)" },
  unfiled: { text: "Filing", tone: "text-(--color-text-dim)" },
  none: { text: "", tone: "" },
};

export default async function StandbyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed-in accounts only. The proxy redirects anonymous visitors too,
  // but it fails open if its Supabase call throws, and this page reports
  // an account's standing — so it checks for itself.
  if (!user) redirect("/login");

  const { role, icon: assignedIcon } = await accessProfile(supabase, user.email);
  const standing = await advisorStanding(supabase, user, role);
  const accepted = standing === "accepted";
  const prealpha = await ensurePreAlphaRequest(supabase, user);
  const testingOpen = prealphaOpen();
  // On the list (accepted, invited or ticked) but on this page: the
  // doors are closed. Say so, rather than offering the request again.
  const [{ tester: onList }, doors] = await Promise.all([isTester(supabase, user.email), prealphaDoors(supabase)]);
  const listed = onList || prealpha.standing === "accepted";
  const advisorLine = ADVISOR_LINE[standing];
  const metadata = user.user_metadata ?? {};
  const callsign = typeof metadata.callsign === "string" ? metadata.callsign : "";
  // Accepted advisors wear the insignia of the service off their
  // application, unless a different key sits in their user_roles row.
  const insignia = accepted
    ? await resolveInsignia(supabase, user.id, assignedIcon)
    : null;

  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-6">
      {/* Files an application that only ever reached user_metadata —
          applicants are held here, so this is where it has to run. */}
      {standing === "unfiled" && <AdvisorSync />}
      <div className="w-full max-w-lg space-y-6 border border-(--color-border) bg-(--color-bg)/90 p-8">
        <div className="space-y-1">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-(--color-amber-dim)">
            The Watch Room
          </div>
          <h1 className="font-mono text-xl uppercase tracking-[0.15em] text-(--color-text)">
            {callsign ? `Standing by, ${callsign}` : "Standing by"}
          </h1>
          <p className="pt-1 text-sm leading-relaxed text-(--color-text-muted)">
            Your account is registered. The Watch Room is in closed pre-alpha: the desk opens to testers when the doors do.
          </p>
        </div>

        {/* The pre-alpha: where this account stands with it, and the door. */}
        <div className="rounded-sm border border-(--color-amber)/40 bg-(--color-amber)/5 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-amber)">Closed pre-alpha</p>
          {listed ? (
            <>
              <p className="mt-1.5 font-mono text-[11px] uppercase tracking-widest text-(--color-ok)">✓ You&apos;re on the pre-alpha</p>
              <p className="mt-1.5 text-sm leading-relaxed text-(--color-text-muted)">
                {doors.open
                  ? "The desk is open to you. If the Ops Centre does not open, log out and back in."
                  : "The doors aren't open yet. They open to every tester at once, and you will get an email the moment they do. The briefing says what is coming and how a shift will run."}
              </p>
            </>
          ) : prealpha.standing === "pending" ? (
            <>
              <p className="mt-1.5 font-mono text-[11px] uppercase tracking-widest text-(--color-amber)">Request received</p>
              <p className="mt-1.5 text-sm leading-relaxed text-(--color-text-muted)">
                Access is granted by hand; you will get an email when you are on the list, and another when the doors open.
              </p>
            </>
          ) : prealpha.standing === "declined" ? (
            <p className="mt-1.5 text-sm leading-relaxed text-(--color-text-muted)">
              Reviewed, and not this time. There will be a wider test after the pre-alpha.
            </p>
          ) : !testingOpen ? (
            <p className="mt-1.5 text-sm leading-relaxed text-(--color-text-muted)">Access opens {prealphaOpensLabel()}.</p>
          ) : prealpha.tableMissing ? (
            <p className="mt-1.5 text-sm leading-relaxed text-(--color-text-muted)">Pre-alpha access is being set up. Try again shortly.</p>
          ) : (
            <>
              <p className="mt-1.5 text-sm leading-relaxed text-(--color-text-muted)">
                Live jobs across Fire, Ambulance and Police, the whole desk, and a tester room on the Discord. One press to ask for access.
              </p>
              <div className="mt-3">
                <RequestPreAlphaButton compact />
              </div>
            </>
          )}
          <Link
            href="/prealpha"
            className="mt-3 inline-flex border border-(--color-amber)/60 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-(--color-amber) transition-colors hover:bg-(--color-amber)/10"
          >
            {listed ? "Read the briefing" : prealpha.standing === "pending" ? "Your standing" : "About the pre-alpha"}
          </Link>
        </div>

        {/* The advisor programme: the account's application, where there
            is one; otherwise a line. */}
        {standing !== "none" ? (
          <div className="rounded-sm border border-(--color-info)/30 bg-(--color-info)/5 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-info)">Development advisor programme</p>
              <span className={`font-mono text-[10px] uppercase tracking-widest ${advisorLine.tone}`}>{advisorLine.text}</span>
            </div>
            {accepted && (
              <div className="mt-2">
                {insignia ? (
                  <ServiceBadge service={insignia} />
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-sm border border-(--color-info)/60 bg-(--color-info)/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-(--color-info)">
                    Development advisor
                  </div>
                )}
              </div>
            )}
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-(--color-text-muted)">
              {accepted && (
                <>
                  <p>
                    You&apos;re on the programme — thank you. Your service background is what keeps this simulation honest. You will be given the closed Advisor room on the Discord in due course.
                  </p>
                  <p className="text-(--color-text-dim)">
                    If you haven&apos;t given us your Discord handle, add it in your account settings; it is how we match you to the room.
                  </p>
                </>
              )}
              {standing === "pending" && (
                <p>
                  Your application has been received. We review applications individually; your standing changes here and you get an email when it has been reviewed. A member of the team may contact you to verify your position.
                </p>
              )}
              {standing === "declined" && (
                <p>
                  Reviewed, and not taken forward onto the programme at this stage — thank you for offering. Your account is unaffected, and the pre-alpha above is open to you like anyone else.
                </p>
              )}
              {standing === "unfiled" && (
                <p>
                  Your application is being filed now — give it a moment and this will say received. If it doesn&apos;t, your answers are safe on your account: open{" "}
                  <Link href="/settings" className="text-(--color-info) underline hover:text-(--color-text)">Settings → Advisor programme</Link>{" "}
                  and save them again.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-[13px] leading-relaxed text-(--color-text-dim)">
            Served in Fire, Ambulance, Police or a control room? The development advisor programme{" "}
            {signupOpen() ? "is open" : "opens Tuesday 1st September"}: apply from{" "}
            <Link href="/settings" className="text-(--color-info) underline hover:text-(--color-text)">Settings → Advisor programme</Link>.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://discord.gg/YBN3sbphs3"
            target="_blank"
            rel="noreferrer"
            className="border border-(--color-info)/60 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-(--color-info) transition-colors hover:bg-(--color-info)/10"
          >
            Join the Discord
          </a>
          {user && (
            <Link
              href="/settings"
              className="border border-(--color-border) px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-(--color-text) transition-colors hover:border-(--color-info)/60 hover:text-(--color-info)"
            >
              Account settings
            </Link>
          )}
          {user && (
            <form action={logout}>
              <button
                type="submit"
                className="px-2 py-2 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim) underline-offset-4 hover:underline"
              >
                Sign out
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
