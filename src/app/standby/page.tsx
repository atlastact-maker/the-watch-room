import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth/actions";
import { accessProfile, resolveInsignia } from "@/lib/auth/operator-access";
import { advisorStanding } from "@/lib/auth/advisor-standing";
import { signupOpen } from "@/lib/auth/signup-window";
import { ServiceBadge } from "@/app/components/service-insignia";
import { AdvisorSync } from "@/app/components/advisor-sync";

// Where a signed-in account lands while the game is in closed
// development and the account is not on the operator allowlist. The
// tone matters: these are early supporters and advisor applicants, not
// people being turned away.
//
// Four states, in order of standing (see lib/auth/advisor-standing):
//   accepted  — onto the programme. The page confirms the decision;
//               the Advisor room itself is the closed Discord area they
//               are granted afterwards.
//   pending   — application filed and waiting on a decision.
//   declined  — reviewed and not taken forward. Says so plainly rather
//               than leaving someone on "received" indefinitely.
//   unfiled   — ticked the box, but the application never reached the
//               advisors table. <AdvisorSync /> files it and refreshes;
//               the copy says so rather than claiming it was received.
//   none      — invited to apply.

export const metadata = {
  title: "Standing by — The Watch Room",
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
            {accepted ? "Accepted" : "Standing by"}
          </h1>
          {accepted && (
            <div className="mt-3">
              {insignia ? (
                <ServiceBadge service={insignia} />
              ) : (
                <div className="inline-flex items-center gap-2 rounded-sm border border-(--color-info)/60 bg-(--color-info)/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-(--color-info)">
                  Development advisor
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-(--color-text-muted)">
          {accepted ? (
            /* Set in capitals with a text transform rather than typed
               that way: the underlying text stays sentence case, so a
               screen reader says the words instead of spelling them
               out letter by letter. */
            <div className="space-y-3 uppercase">
              <p>
                You&apos;re on the{" "}
                <span className="text-(--color-info)">DEVELOPMENT ADVISOR
                PROGRAMME</span>{" "}
                — thank you. Your service background is what keeps this
                simulation honest.
              </p>
              <p>
                You will be granted access to the closed Advisor room on
                our Discord and website in due course.
              </p>
              <p className="text-(--color-text-dim)">
                Shifts aren&apos;t open yet. Pre-Alpha testing
                applications open to registered operators in October
                2026.
              </p>
            </div>
          ) : (
            <>
              <p>
                The Watch Room is in its closed development phase so
                shifts aren&apos;t open to operators yet. Your account is
                registered.
              </p>
              {standing === "pending" && (
                <>
                  <p>
                    Your{" "}
                    <span className="text-(--color-info)">ADVISOR
                    APPLICATION</span>{" "}
                    has been received — thank you. We
                    review applications individually; you&apos;ll see your
                    standing change here and you will also receive an
                    email when the application has been reviewed.
                  </p>
                  <p>
                    A member of the team may contact you for further
                    verification on your position if required.
                  </p>
                </>
              )}
              {standing === "declined" && (
                <p>
                  Your{" "}
                  <span className="text-(--color-info)">ADVISOR
                  APPLICATION</span>{" "}
                  has been reviewed, and we&apos;re not
                  taking it forward onto the programme at this stage —
                  thank you for offering. Your account is unaffected, and
                  Pre-Alpha testing opens to registered operators in
                  October 2026.
                </p>
              )}
              {standing === "unfiled" && (
                <p>
                  Your{" "}
                  <span className="text-(--color-info)">ADVISOR
                  APPLICATION</span>{" "}
                  is being filed now — give it a moment
                  and this will say received. If it doesn&apos;t, your
                  answers are safe on your account: open{" "}
                  <Link
                    href="/settings"
                    className="text-(--color-info) underline hover:text-(--color-text)"
                  >
                    Settings → Advisor programme
                  </Link>{" "}
                  and save them again.
                </p>
              )}
              {standing === "none" && (
                <p>
                  Served in Fire, Ambulance, Police or Control? The{" "}
                  <Link
                    href="/signup?advisor=1"
                    className="text-(--color-info) underline hover:text-(--color-text)"
                  >
                    development advisor programme
                  </Link>{" "}
                  {signupOpen()
                    ? "is open — real operational experience shapes what gets built."
                    : "opens Tuesday 1st September — real operational experience shapes what gets built."}
                </p>
              )}
            </>
          )}
        </div>

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
