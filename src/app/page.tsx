import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signupOpen } from "@/lib/auth/signup-window";
import { ADVISOR_SERVICES, ADVISOR_TOPICS } from "@/lib/auth/schemas";

// The front door. While the site is closed, the advisor programme is the
// only thing open, so this page has one job: explain the programme to
// someone who has done the job for real, and get them to the form.
//
// It deliberately links nowhere else on the site. Everything but signup
// and the auth flow is administrator-only (lib/auth/require-admin), so a
// trailer or changelog link here would dead-end the first thing a
// visitor touches.

export const metadata = {
  title: "Development Advisor Programme — The Watch Room",
  description:
    "The Watch Room is an emergency services incident management simulator in closed development. If you've served in Fire, Ambulance, Police or a control room, help keep it honest.",
};

const chipCls =
  "rounded-sm border border-(--color-border) bg-(--color-surface)/60 px-2.5 py-1.5 font-mono text-[11px] text-(--color-text-muted)";

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

  return (
    <div className="relative z-10 flex flex-1 flex-col">
      {/* Status strip */}
      <header className="border-b border-(--color-border-subtle)">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-(--color-text-dim) sm:px-6 sm:tracking-widest">
          <div className="flex items-center gap-2">
            <span className="dot-live size-1.5 shrink-0 rounded-full bg-(--color-amber)" />
            <span className="text-(--color-text)">The Watch Room</span>
          </div>
          <span className="shrink-0 text-(--color-text-dim)">
            Closed development
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-6 sm:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-(--color-amber-dim) sm:tracking-[0.3em]">
          Development Advisor Programme
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
          You&apos;ve done the job.
          <br />
          Help us get it right.
        </h1>

        <div className="mt-6 space-y-4 text-base leading-relaxed text-(--color-text-muted)">
          <p>
            The Watch Room is an emergency services incident management
            simulator — one operator commanding Fire, Ambulance and Police
            from a single seat, across real stations with real resources.
          </p>
          <p>
            The Watch Room is currently in closed development,
            opportunities to test will be available in the Pre-Alpha
            testing phase in October 2026.
          </p>
        </div>

        {/* Primary action, high on the page — most visitors arrive
            already knowing whether this is them. */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {open ? (
            <Link
              href="/signup?advisor=1"
              className="inline-flex min-h-12 items-center justify-center rounded-sm bg-(--color-amber) px-6 py-3 text-center font-mono text-sm font-medium uppercase tracking-[0.15em] text-black transition-colors hover:bg-amber-400"
            >
              Apply to the programme
            </Link>
          ) : (
            <span className="inline-flex min-h-12 items-center justify-center rounded-sm border border-(--color-border) px-6 py-3 text-center font-mono text-sm uppercase tracking-[0.15em] text-(--color-text-dim)">
              Applications open Tuesday 1st September
            </span>
          )}
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-sm border border-(--color-border) px-6 py-3 text-center font-mono text-sm uppercase tracking-[0.15em] text-(--color-text) transition-colors hover:border-(--color-amber-dim) hover:text-(--color-amber)"
          >
            Log in
          </Link>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-(--color-text-dim)">
          Already applied? Log in to see where your application stands.
        </p>

        {/* Who it's for */}
        <section className="mt-9 border-t border-(--color-border-subtle) pt-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-(--color-info) sm:tracking-[0.25em]">
            Who we&apos;re looking for
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {ADVISOR_SERVICES.filter((s) => s !== "Other").map((s) => (
              <li key={s} className={chipCls}>
                {s}
              </li>
            ))}
          </ul>
        </section>

        {/* What advising actually involves. Chips rather than a row
            apiece: nine full-width tiles was most of a phone screen. */}
        <section className="mt-9 border-t border-(--color-border-subtle) pt-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-(--color-info) sm:tracking-[0.25em]">
            What you&apos;d be advising on
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {ADVISOR_TOPICS.map((t) => (
              <li key={t} className={`${chipCls} leading-snug`}>
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* Commitment — the question everyone actually has */}
        <section className="mt-9 border-t border-(--color-border-subtle) pt-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-(--color-info) sm:tracking-[0.25em]">
            What it asks of you
          </h2>
          <div className="mt-2.5 space-y-2.5 text-sm leading-relaxed text-(--color-text-muted)">
            <p>
              As much or as little as you want — the occasional question,
              or reviewing features as they are built. You choose on the
              form, and can change it later in your settings.
            </p>
            <p>
              Unpaid and informal. You get a say in how your job is
              portrayed, and the advisor mark against your callsign.
            </p>
            <p className="text-(--color-text-dim)">
              Applications are reviewed on a case-by-case basis, so there
              is a wait — your standing updates on the site when yours has
              been reviewed.
            </p>
          </div>
        </section>

        {/* Closing action */}
        <section className="mt-10 border-t border-(--color-border-subtle) pt-8">
          {open ? (
            <p className="text-sm leading-relaxed text-(--color-text-muted)">
              Registration takes a couple of minutes — a callsign, an
              email, and the advisor questions.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-(--color-text-muted)">
              The programme opens on{" "}
              <span className="text-(--color-amber)">
                Tuesday 1st September
              </span>
              . Come back then.
            </p>
          )}
        </section>
      </main>

      <footer className="border-t border-(--color-border-subtle)">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 px-5 py-4 font-mono text-[10px] uppercase tracking-[0.15em] text-(--color-text-dim) sm:px-6 sm:tracking-[0.2em]">
          <span>The Watch Room · Pre-alpha</span>
          <Link href="/terms" className="-my-2 py-2 hover:text-(--color-text)">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
