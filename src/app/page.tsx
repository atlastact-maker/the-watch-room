import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signupOpen } from "@/lib/auth/signup-window";
import { prealphaOpen, prealphaOpensLabel } from "@/lib/prealpha";
import { ADVISOR_SERVICES } from "@/lib/auth/schemas";

// The front door. It introduces the simulator, says where it is (a
// closed pre-alpha), and gets a visitor to one of two places: an account
// or the login. The advisor programme is a strand of the same thing, for
// people who have done the job for real, so it gets one section near the
// bottom rather than the whole page.
//
// It deliberately links nowhere else on the site. Everything but signup,
// the auth flow and /prealpha is gated, so a trailer or changelog link
// here would dead-end the first thing a visitor touches.

export const metadata = {
  title: "The Watch Room — emergency services incident management simulator",
  description:
    "One operator taking the 999 call, mobilising across real Greater Manchester stations and commanding Fire, Ambulance and Police on the ground. Now in closed pre-alpha.",
};

const h2Cls = "font-mono text-[11px] uppercase tracking-[0.2em] text-(--color-info) sm:tracking-[0.25em]";
const btnPrimary =
  "inline-flex min-h-12 items-center justify-center rounded-sm bg-(--color-amber) px-6 py-3 text-center font-mono text-sm font-medium uppercase tracking-[0.15em] text-black transition-colors hover:bg-amber-400";
const btnGhost =
  "inline-flex min-h-12 items-center justify-center rounded-sm border border-(--color-border) px-6 py-3 text-center font-mono text-sm uppercase tracking-[0.15em] text-(--color-text) transition-colors hover:border-(--color-amber-dim) hover:text-(--color-amber)";
const btnInfo =
  "inline-flex min-h-12 items-center justify-center rounded-sm border border-(--color-info)/60 px-6 py-3 text-center font-mono text-sm uppercase tracking-[0.15em] text-(--color-info) transition-colors hover:bg-(--color-info)/10";
const chipCls =
  "rounded-sm border border-(--color-border) bg-(--color-surface)/60 px-2.5 py-1.5 font-mono text-[11px] text-(--color-text-muted)";

// The desk in three parts. The page is a doorway, not the briefing;
// /prealpha has the full list.
const DESK = [
  {
    title: "Take the call",
    body: "The 999 call as the caller tells it: confirm the address, ask the questions that matter, key the opening code, send.",
  },
  {
    title: "Mobilise the county",
    body: "Real Greater Manchester stations and resources on the county board. Pick the attendance, watch it run on real roads.",
  },
  {
    title: "Command the ground",
    body: "Crews on foot on the map, the mobile data terminal, casualty care, and a debrief that scores the job when you close it.",
  },
] as const;

const STEPS = [
  { n: "01", text: "Create an account: a callsign and an email, confirmed by link." },
  { n: "02", text: "Apply for the pre-alpha from your account. Five questions, a couple of minutes." },
  { n: "03", text: "Applications are reviewed by hand. You get an email when yours has been, and the desk opens." },
] as const;

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  // Supabase sends the confirmation link to the project's Site URL, which
  // is the site root unless the link carries a redirect of its own — so a
  // confirmation can land here as /?code=…
  //
  // It cannot be exchanged here: this is a Server Component, where the
  // Supabase client's cookie writes are swallowed (see lib/supabase/
  // server), so the session would never persist. /auth/confirm is a route
  // handler and can set cookies, so hand the code to it.
  const { code } = await searchParams;
  if (code) {
    redirect(`/auth/confirm?code=${encodeURIComponent(code)}`);
  }

  // A live session belongs on its own standing, not the front door. The
  // admin gate on /menu passes administrators through and sends everyone
  // else to /standby.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/menu");

  const open = signupOpen();
  const testing = prealphaOpen();

  return (
    <div className="relative z-10 flex flex-1 flex-col">
      {/* Status strip */}
      <header className="border-b border-(--color-border-subtle)">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-(--color-text-dim) sm:px-6 sm:tracking-widest">
          <div className="flex items-center gap-2">
            <span className="dot-live size-1.5 shrink-0 rounded-full bg-(--color-amber)" />
            <span className="text-(--color-text)">The Watch Room</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden shrink-0 sm:inline">Closed pre-alpha</span>
            <Link href="/login" className="-my-2 shrink-0 py-2 text-(--color-text) hover:text-(--color-amber)">
              Log in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-6 sm:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-(--color-amber-dim) sm:tracking-[0.3em]">
          Emergency services incident management simulator
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
          One county.
          <br />
          Your command.
        </h1>

        <div className="mt-6 space-y-4 text-base leading-relaxed text-(--color-text-muted)">
          <p>
            The Watch Room puts one operator in the seat for Fire, Ambulance
            and Police: taking the 999 call, mobilising across real Greater
            Manchester stations, and taking command on the ground when the
            job needs it.
          </p>
          <p>
            It is in closed pre-alpha. Nine live jobs, the whole desk from
            the call to the debrief, and a small group of testers who tell
            us what is wrong with it.{" "}
            {testing ? "Applications are open now." : `Applications open on ${prealphaOpensLabel()}.`}
          </p>
        </div>

        {/* Primary actions, high on the page. */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {open ? (
            <Link href="/signup?prealpha=1" className={btnPrimary}>
              Create an account
            </Link>
          ) : (
            <span className="inline-flex min-h-12 items-center justify-center rounded-sm border border-(--color-border) px-6 py-3 text-center font-mono text-sm uppercase tracking-[0.15em] text-(--color-text-dim)">
              Registration opens Tuesday 1st September
            </span>
          )}
          <Link href="/login" className={btnGhost}>
            Log in
          </Link>
          <Link
            href="/prealpha"
            className="inline-flex min-h-12 items-center justify-center px-2 py-3 text-center font-mono text-[13px] uppercase tracking-[0.15em] text-(--color-info) hover:text-(--color-text)"
          >
            Read the pre-alpha briefing →
          </Link>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-(--color-text-dim)">
          Already have an account? Log in to apply, or to see where your application stands.
        </p>

        {/* The desk */}
        <section className="mt-10 border-t border-(--color-border-subtle) pt-6">
          <h2 className={h2Cls}>What you sit in front of</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {DESK.map((d) => (
              <li key={d.title} className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface)/50 px-4 py-3">
                <p className="text-sm font-medium text-(--color-text)">{d.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-(--color-text-muted)">{d.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Getting in */}
        <section className="mt-9 border-t border-(--color-border-subtle) pt-6">
          <h2 className={h2Cls}>Getting in</h2>
          <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-(--color-text-muted)">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-3">
                <span className="shrink-0 font-mono text-(--color-amber)">{s.n}</span>
                <span>{s.text}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[13px] leading-relaxed text-(--color-text-dim)">
            The pre-alpha is small on purpose and unfinished by definition. Testers keep it in the room: bugs through the in-game form, talk on the Discord, nothing public until the doors open.
          </p>
        </section>

        {/* The advisor programme: the second door, for people who have
            done the job for real. */}
        <section className="mt-9 rounded-sm border border-(--color-info)/30 bg-(--color-info)/5 px-5 py-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-(--color-info)">Development advisor programme</p>
          <p className="mt-2 text-sm leading-relaxed text-(--color-text-muted)">
            Served in one of these, or in a control room? Advisors keep the simulation honest: the occasional question, or reviewing features as they are built. Unpaid, informal, and you get a say in how your job is portrayed.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {ADVISOR_SERVICES.filter((s) => s !== "Other").map((s) => (
              <li key={s} className={chipCls}>
                {s}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            {open ? (
              <Link href="/signup?advisor=1" className={btnInfo}>
                Apply to the advisor programme
              </Link>
            ) : (
              <span className="text-[13px] text-(--color-text-dim)">Applications open Tuesday 1st September.</span>
            )}
            <span className="text-[13px] text-(--color-text-dim)">Reviewed case by case. Advisors can test the pre-alpha too.</span>
          </div>
        </section>
      </main>

      <footer className="border-t border-(--color-border-subtle)">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 px-5 py-4 font-mono text-[10px] uppercase tracking-[0.15em] text-(--color-text-dim) sm:px-6 sm:tracking-[0.2em]">
          <span>The Watch Room · Pre-alpha</span>
          <div className="flex gap-4">
            <Link href="/prealpha" className="-my-2 py-2 hover:text-(--color-text)">
              Pre-alpha
            </Link>
            <Link href="/terms" className="-my-2 py-2 hover:text-(--color-text)">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
