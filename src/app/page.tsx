import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signupOpen } from "@/lib/auth/signup-window";
import { prealphaOpen, prealphaOpensLabel } from "@/lib/prealpha";

// The front door. Same face as the trailer and the share card: the
// wordmark, the strapline, the dispatch feed, sign up / log in. Wide
// enough for a monitor, with the pre-alpha and the advisor programme
// as two doors underneath rather than the whole page.
//
// It deliberately links nowhere else on the site. Everything but signup,
// the auth flow and /prealpha is gated, so a trailer or changelog link
// here would dead-end the first thing a visitor touches.

export const metadata = {
  title: "The Watch Room — Emergency Services Incident Management Simulator",
  description:
    "Command Fire, Ambulance and Police from one seat. Real stations, real resources, real roads. Now in closed pre-alpha.",
};

const FEED: { time: string; service: "F" | "A" | "P"; text: string }[] = [
  { time: "19:42:11", service: "A", text: "Cat 2 · chest pain · Salford M6" },
  { time: "19:42:38", service: "P", text: "Grade 1 · RTC · damage only · Bury BL9" },
  { time: "19:43:02", service: "F", text: "AFA · commercial premises · Stockport SK1" },
  { time: "19:43:47", service: "F", text: "Persons reported · house fire · Wythenshawe M22" },
  { time: "19:44:20", service: "A", text: "Cat 1 · cardiac arrest · Oldham OL1" },
  { time: "19:45:05", service: "P", text: "Grade 1 · fail to stop · Hyde Road M18" },
];
const SERVICE_COLOUR = { F: "var(--color-critical)", A: "var(--color-ok)", P: "var(--color-info)" } as const;

const wrap = "mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10";
const btnPrimary =
  "inline-flex min-h-12 items-center justify-center rounded-sm bg-(--color-amber) px-7 py-3 text-center font-mono text-sm font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-amber-400";
const btnGhost =
  "inline-flex min-h-12 items-center justify-center rounded-sm border border-(--color-border) px-7 py-3 text-center font-mono text-sm uppercase tracking-[0.2em] text-(--color-text) transition-colors hover:border-(--color-amber-dim) hover:text-(--color-amber)";
const tag = "rounded-sm border border-(--color-border) px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-text-dim)";
const label = "font-mono text-[11px] uppercase tracking-[0.25em]";

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
      <header className="border-b border-(--color-border-subtle)">
        <div className={`${wrap} flex items-center justify-between gap-3 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-(--color-text-dim) sm:tracking-widest`}>
          <div className="flex items-center gap-2">
            <span className="dot-live size-1.5 shrink-0 rounded-full bg-(--color-amber)" />
            <span className="text-(--color-text)">The Watch Room</span>
          </div>
          <nav className="flex items-center gap-5">
            <Link href="/prealpha" className="-my-2 hidden py-2 hover:text-(--color-text) sm:inline">Pre-alpha</Link>
            <Link href="/login" className="-my-2 py-2 text-(--color-text) hover:text-(--color-amber)">Log in</Link>
            {open && (
              <Link href="/signup?prealpha=1" className="-my-1 rounded-sm bg-(--color-amber) px-3 py-1.5 font-bold text-black hover:bg-amber-400">Sign up</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero: the wordmark on the left, the desk on the right. */}
        <section className={`${wrap} grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14 lg:py-20`}>
          <div>
            <p className={`${label} flex items-center gap-2.5 text-(--color-amber-dim)`}>
              <span className="size-1.5 rounded-full bg-(--color-amber)" />
              Emergency Services Incident Management Simulator
            </p>
            <h1 className="mt-6 font-mono text-[44px] font-bold uppercase leading-[0.95] tracking-tight text-(--color-text) sm:text-6xl lg:text-7xl">
              The Watch
              <br />
              Room
            </h1>
            <p className="mt-5 font-mono text-sm font-bold uppercase tracking-[0.22em] text-(--color-amber) sm:text-base">
              You&apos;re in command and control.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className={tag}>Real stations</span>
              <span className={tag}>Real resources</span>
              <span className={`${tag} border-(--color-critical)/50 text-(--color-critical)`}>Fire · Ambulance · Police</span>
            </div>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-(--color-text-muted) sm:text-[17px]">
              One operator, one county. Take the 999 call, mobilise from real Greater Manchester stations, and take command on the ground when the job needs it.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              {open ? (
                <Link href="/signup?prealpha=1" className={btnPrimary}>Sign up</Link>
              ) : (
                <span className="inline-flex min-h-12 items-center justify-center rounded-sm border border-(--color-border) px-7 py-3 font-mono text-sm uppercase tracking-[0.2em] text-(--color-text-dim)">
                  Registration opens 1st September
                </span>
              )}
              <Link href="/login" className={btnGhost}>Log in</Link>
            </div>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.15em] text-(--color-text-dim)">
              {testing ? "Closed pre-alpha · access open · granted by hand" : `Closed pre-alpha · access opens ${prealphaOpensLabel()}`}
            </p>
          </div>

          {/* The dispatch feed, as the desk shows it. */}
          <div className="rounded-sm border border-(--color-border) bg-(--color-surface)/90 shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between border-b border-(--color-border-subtle) px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.25em] text-(--color-text-dim)">
              <span className="flex items-center gap-2">
                <span className="size-1.5 animate-pulse rounded-full bg-(--color-critical)" />
                NWRC
              </span>
              <span>Dispatch feed · simulation</span>
            </div>
            <ul className="space-y-2 px-4 py-4 font-mono text-[12px] sm:text-[13px]">
              {FEED.map((l) => (
                <li key={l.time} className="flex items-baseline gap-3">
                  <span className="tabular-nums text-(--color-text-dim)/70">{l.time}</span>
                  <span style={{ color: SERVICE_COLOUR[l.service] }}>▌</span>
                  <span className="text-(--color-text-muted)">{l.text}</span>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-3 divide-x divide-(--color-border-subtle) border-t border-(--color-border-subtle) font-mono text-[10px] uppercase tracking-[0.18em]">
              <div className="px-4 py-3">
                <p className="text-(--color-text-dim)">County</p>
                <p className="mt-1 text-(--color-text)">Greater Manchester</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-(--color-text-dim)">Seat</p>
                <p className="mt-1 text-(--color-text)">One operator</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-(--color-text-dim)">Build</p>
                <p className="mt-1 text-(--color-amber)">Pre-alpha</p>
              </div>
            </div>
          </div>
        </section>

        {/* The desk, in three columns. */}
        <section className="border-t border-(--color-border-subtle)">
          <div className={`${wrap} grid gap-8 py-12 sm:grid-cols-3 sm:gap-10 lg:py-16`}>
            <div>
              <p className={`${label} text-(--color-text-dim)`}><span className="text-(--color-amber)">01</span>&nbsp;&nbsp;The call</p>
              <p className="mt-3 text-[15px] leading-relaxed text-(--color-text-muted)">
                The 999 call as the caller tells it. Confirm the address, ask what matters, key the opening code, send. Then the pre-arrival advice while the crews run.
              </p>
            </div>
            <div>
              <p className={`${label} text-(--color-text-dim)`}><span className="text-(--color-amber)">02</span>&nbsp;&nbsp;The board</p>
              <p className="mt-3 text-[15px] leading-relaxed text-(--color-text-muted)">
                The county board with real stations and real appliances. Pick the attendance, watch it run on real roads, and hold enough back for the next job.
              </p>
            </div>
            <div>
              <p className={`${label} text-(--color-text-dim)`}><span className="text-(--color-amber)">03</span>&nbsp;&nbsp;The ground</p>
              <p className="mt-3 text-[15px] leading-relaxed text-(--color-text-muted)">
                Crews on foot on the map, the mobile data terminal, casualty care, pursuits. The debrief scores the job when you close it.
              </p>
            </div>
          </div>
        </section>

        {/* Two doors: testers and advisors. */}
        <section className="border-t border-(--color-border-subtle)">
          <div className={`${wrap} grid gap-10 py-12 lg:grid-cols-2 lg:gap-14 lg:py-16`}>
            <div>
              <p className={`${label} text-(--color-amber)`}>Closed pre-alpha</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Nine live jobs. The whole desk. Tell us what&apos;s wrong with it.</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-(--color-text-muted)">
                Three fire, three ambulance, three police, each playing out differently from shift to shift. Testers get the desk from the call to the debrief, a bug report one click away, and a private room on the Discord with the developer and the advisors.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-(--color-text-muted)">
                Tick &ldquo;Join the pre-alpha&rdquo; when you sign up, or request access from your account if you already have one. Access is granted by hand and you get an email when the desk is open to you.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                {open && <Link href="/signup?prealpha=1" className={btnPrimary}>Create an account</Link>}
                <Link href="/prealpha" className="font-mono text-[12px] uppercase tracking-[0.2em] text-(--color-info) hover:text-(--color-text)">
                  Read the briefing →
                </Link>
              </div>
            </div>
            <div className="lg:border-l lg:border-(--color-border-subtle) lg:pl-14">
              <p className={`${label} text-(--color-info)`}>Development advisor programme</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Done the job for real? Help us get it right.</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-(--color-text-muted)">
                Serving or retired Fire, Ambulance, Police and control room staff keep the simulation honest: the occasional question, or reviewing features as they are built. Unpaid and informal, with a say in how your job is portrayed and the advisor mark against your callsign.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-(--color-text-muted)">
                Advisors test the pre-alpha too.
              </p>
              <div className="mt-6">
                {open ? (
                  <Link href="/signup?advisor=1" className="font-mono text-[12px] uppercase tracking-[0.2em] text-(--color-info) hover:text-(--color-text)">
                    Apply to the advisor programme →
                  </Link>
                ) : (
                  <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-(--color-text-dim)">Applications open 1st September</span>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-(--color-border-subtle)">
        <div className={`${wrap} flex flex-wrap items-center justify-between gap-2 py-4 font-mono text-[10px] uppercase tracking-[0.15em] text-(--color-text-dim) sm:tracking-[0.2em]`}>
          <span>The Watch Room · Pre-alpha</span>
          <div className="flex gap-5">
            <a href="https://discord.gg/YBN3sbphs3" target="_blank" rel="noreferrer" className="-my-2 py-2 hover:text-(--color-text)">Discord</a>
            <Link href="/prealpha" className="-my-2 py-2 hover:text-(--color-text)">Pre-alpha</Link>
            <Link href="/terms" className="-my-2 py-2 hover:text-(--color-text)">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
