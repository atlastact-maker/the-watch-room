import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasAdminAccess, hasShiftAccess } from "@/lib/auth/operator-access";
import { PREALPHA_ACCESS, PREALPHA_ASKS, PREALPHA_NOT_YET, preAlphaApplication, prealphaOpen, prealphaOpensLabel } from "@/lib/prealpha";
import { SCENARIO_META } from "@/lib/sim/scenarios/meta";
import { PreAlphaForm } from "./prealpha-form";

// The pre-alpha, explained once for everyone: what it is, what a tester
// gets, what we ask, and what is not there yet. The bottom of the page
// depends on who is reading:
//
//   visitor      — create an account, or log in, then apply.
//   signed in    — the application form.
//   pending      — received; the form again, in case they want to add to it.
//   declined     — reviewed and not this time.
//   accepted     — the tester briefing: which jobs are open, how to start,
//                  how to report, and the door to the Ops Centre.

export const metadata = {
  title: "Pre-alpha — The Watch Room",
  description:
    "The Watch Room's closed pre-alpha: nine live jobs across Fire, Ambulance and Police, one operator, one county. Apply to test it.",
};

const h2Cls = "font-mono text-[11px] uppercase tracking-[0.2em] text-(--color-info) sm:tracking-[0.25em]";
const btnPrimary =
  "inline-flex min-h-12 items-center justify-center rounded-sm bg-(--color-amber) px-6 py-3 text-center font-mono text-sm font-medium uppercase tracking-[0.15em] text-black transition-colors hover:bg-amber-400";
const btnGhost =
  "inline-flex min-h-12 items-center justify-center rounded-sm border border-(--color-border) px-6 py-3 text-center font-mono text-sm uppercase tracking-[0.15em] text-(--color-text) transition-colors hover:border-(--color-amber-dim) hover:text-(--color-amber)";

export default async function PreAlphaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const open = prealphaOpen();
  const { standing, application, tableMissing } = await preAlphaApplication(supabase, user?.id);
  const inAlready = user ? await hasShiftAccess(supabase, user.email) : false;
  const admin = user ? await hasAdminAccess(supabase, user.email) : false;
  const accepted = standing === "accepted" || (inAlready && !admin) || admin;

  // Which jobs are open right now. Admins see every scenario; testers
  // the released set. The list is the briefing's headline.
  let openIds: string[] | null = null;
  if (accepted) {
    const { data } = await supabase.from("released_scenarios").select("scenario_id");
    openIds = (data ?? []).map((r) => String(r.scenario_id));
  }
  const openJobs = openIds ? SCENARIO_META.filter((s) => openIds!.includes(s.id)) : [];
  const serviceOf = (s: (typeof SCENARIO_META)[number]) => s.pda[0]?.service ?? "Fire";

  return (
    <div className="relative z-10 flex flex-1 flex-col">
      <header className="border-b border-(--color-border-subtle)">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-(--color-text-dim) sm:px-6 sm:tracking-widest">
          <Link href={user ? (inAlready ? "/menu" : "/standby") : "/"} className="flex items-center gap-2 hover:text-(--color-text)">
            <span className="dot-live size-1.5 shrink-0 rounded-full bg-(--color-amber)" />
            <span className="text-(--color-text)">The Watch Room</span>
          </Link>
          <span className="shrink-0">Closed pre-alpha</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-6 sm:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-(--color-amber-dim) sm:tracking-[0.3em]">
          {accepted ? "Tester briefing" : "Closed pre-alpha"}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
          {accepted ? (
            <>You&apos;re in.<br />Here&apos;s the watch.</>
          ) : (
            <>One county.<br />Your command. Not finished.</>
          )}
        </h1>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-(--color-text-muted)">
          {accepted ? (
            <p>
              Your account opens the Ops Centre. Below is what is live, what is not, how a shift runs and how to tell us what broke. Read it once; the desk has a glossary and a how-to-play for the rest.
            </p>
          ) : (
            <>
              <p>
                The Watch Room is an emergency services incident management simulator: one operator taking the 999 call, mobilising across real Greater Manchester stations, and taking command on the ground when the job needs it. Fire, Ambulance and Police from one seat.
              </p>
              <p>
                The pre-alpha is the first time anyone outside the team sits in that seat. It is small on purpose, unfinished by definition, and run with the people who have done the job for real.
              </p>
            </>
          )}
        </div>

        {accepted && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/menu" className={btnPrimary}>Open the Ops Centre</Link>
            <a href="https://discord.gg/YBN3sbphs3" target="_blank" rel="noreferrer" className={btnGhost}>Tester room on Discord</a>
          </div>
        )}

        {accepted && (
          <section className="mt-9 border-t border-(--color-border-subtle) pt-6">
            <h2 className={h2Cls}>Jobs open to you now</h2>
            {openJobs.length === 0 ? (
              <p className="mt-3 text-sm text-(--color-text-muted)">
                Nothing is released to testers yet. When a job is opened it appears here and in the Scenarios menu on the desk.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-(--color-border-subtle)/60 rounded-sm border border-(--color-border-subtle)">
                {openJobs.map((s) => (
                  <li key={s.id} className="flex items-baseline gap-3 px-3 py-2 text-sm">
                    <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">{serviceOf(s)}</span>
                    <span className="min-w-0 text-(--color-text)">{s.title}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[13px] leading-relaxed text-(--color-text-dim)">
              Each one plays out differently from shift to shift: who is home, where the fire is, whether the driver stops. Play them more than once.
            </p>
          </section>
        )}

        <section className="mt-9 border-t border-(--color-border-subtle) pt-6">
          <h2 className={h2Cls}>{accepted ? "What you have" : "What testers get"}</h2>
          <ul className="mt-3 space-y-3">
            {PREALPHA_ACCESS.map((a) => (
              <li key={a.title} className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface)/50 px-4 py-3">
                <p className="text-sm font-medium text-(--color-text)">{a.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-(--color-text-muted)">{a.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {accepted && (
          <section className="mt-9 border-t border-(--color-border-subtle) pt-6">
            <h2 className={h2Cls}>How a shift runs</h2>
            <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-(--color-text-muted)">
              <li><span className="font-mono text-(--color-amber)">01</span>&nbsp; Ops Centre → New shift. Pick a patch and an intensity; the calls start.</li>
              <li><span className="font-mono text-(--color-amber)">02</span>&nbsp; Take the 999 call: confirm the address, ask the key questions, key the opening code, send. Read the pre-arrival advice while the crews run.</li>
              <li><span className="font-mono text-(--color-amber)">03</span>&nbsp; Mobilise from the county board, then open the job. Place each unit on the ground map when it arrives.</li>
              <li><span className="font-mono text-(--color-amber)">04</span>&nbsp; Command from the MDT: task crews, work the patients, watch the log. The debrief scores you when you close it.</li>
              <li><span className="font-mono text-(--color-amber)">05</span>&nbsp; Something wrong? Help → Report a problem, from any screen. It attaches the job and the last minute of the log.</li>
            </ol>
          </section>
        )}

        <section className="mt-9 border-t border-(--color-border-subtle) pt-6">
          <h2 className={h2Cls}>What we ask</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-(--color-text-muted)">
            {PREALPHA_ASKS.map((a) => (
              <li key={a} className="flex gap-3"><span className="text-(--color-amber)">—</span><span>{a}</span></li>
            ))}
          </ul>
        </section>

        <section className="mt-9 border-t border-(--color-border-subtle) pt-6">
          <h2 className={h2Cls}>Not there yet</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-(--color-text-muted)">
            {PREALPHA_NOT_YET.map((a) => (
              <li key={a} className="flex gap-3"><span className="text-(--color-text-dim)">—</span><span>{a}</span></li>
            ))}
          </ul>
        </section>

        {!accepted && (
          <section className="mt-10 border-t border-(--color-border-subtle) pt-8">
            <h2 className={h2Cls}>{standing === "pending" ? "Your application" : standing === "declined" ? "Your application" : "Apply"}</h2>
            {!open ? (
              <p className="mt-3 text-sm leading-relaxed text-(--color-text-muted)">
                Applications open on <span className="text-(--color-amber)">{prealphaOpensLabel()}</span>. Create an account now and you can apply the moment they do.
              </p>
            ) : tableMissing ? (
              <p className="mt-3 text-sm leading-relaxed text-(--color-text-muted)">Applications are being set up. Try again shortly.</p>
            ) : !user ? (
              <>
                <p className="mt-3 text-sm leading-relaxed text-(--color-text-muted)">
                  Applying takes a couple of minutes: an account, then five questions. Applications are reviewed by hand; you will see your standing here and get an email when yours has been looked at.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href="/signup?prealpha=1" className={btnPrimary}>Create an account</Link>
                  <Link href="/login" className={btnGhost}>Log in</Link>
                </div>
              </>
            ) : standing === "declined" ? (
              <p className="mt-3 text-sm leading-relaxed text-(--color-text-muted)">
                Reviewed, and not this time. Thank you for offering. The pre-alpha is deliberately small; there will be a wider test after it, and your account is ready for that.
              </p>
            ) : (
              <>
                {standing === "pending" && (
                  <div className="mt-3 rounded-sm border border-(--color-amber)/50 bg-(--color-amber)/10 px-4 py-3">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber)">In review</p>
                    <p className="mt-1 text-sm leading-relaxed text-(--color-text-muted)">
                      Received {application ? new Date(application.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long" }) : ""}. Applications are reviewed by hand; you will get an email when yours has been. You can add to your answers below.
                    </p>
                  </div>
                )}
                <div className="mt-5">
                  <PreAlphaForm existing={application} />
                </div>
              </>
            )}
          </section>
        )}
      </main>

      <footer className="border-t border-(--color-border-subtle)">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 px-5 py-4 font-mono text-[10px] uppercase tracking-[0.15em] text-(--color-text-dim) sm:px-6 sm:tracking-[0.2em]">
          <span>The Watch Room · Pre-alpha</span>
          <div className="flex gap-4">
            <Link href="/" className="-my-2 py-2 hover:text-(--color-text)">Home</Link>
            <Link href="/terms" className="-my-2 py-2 hover:text-(--color-text)">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
