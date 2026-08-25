import Link from "next/link";
import { LATEST, formatEntryDate } from "@/lib/changelog";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingBackdrop } from "./components/landing-backdrop";
import { LiveConsole } from "./components/live-console";
import { STATIONS, getStationAppliances } from "@/lib/sim/data";
import type { ServiceCode } from "@/lib/sim/types";

// Fleet counts computed server-side from the real research data, so the
// client bundle only ships six numbers rather than the station files.
function fleetCounts() {
  const out: Record<ServiceCode, { stations: number; appliances: number }> = {
    Fire: { stations: 0, appliances: 0 },
    Ambulance: { stations: 0, appliances: 0 },
    Police: { stations: 0, appliances: 0 },
  };
  for (const s of STATIONS) {
    out[s.service].stations += 1;
    out[s.service].appliances += getStationAppliances(s.id).length;
  }
  return out;
}

export default async function LandingPage() {
  // A live session goes straight to the ops centre — returning operators
  // shouldn't land on the marketing page.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/menu");

  const fleet = fleetCounts();

  return (
    <>
    <LandingBackdrop />
    <div className="relative z-10 flex flex-1 flex-col">
      {/* status bar */}
      <header className="border-b border-(--color-border-subtle)">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
          <div className="flex items-center gap-2">
            <span className="dot-live size-1.5 rounded-full bg-(--color-amber)" />
            <span>The Watch Room</span>
            <span className="text-(--color-border)">|</span>
            <span className="text-(--color-text-dim)">Multi-Agency Operator</span>
          </div>
          <div className="hidden sm:block">
            Build {process.env.NEXT_PUBLIC_BUILD_STAMP ?? "dev"} · Pre-alpha
          </div>
        </div>
      </header>

      {/* hero */}
      <main className="flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
          <section>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-amber-dim)">
              Emergency Services Incident Management Simulator
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              The Watch Room
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-(--color-text-muted)">
              One operator. Three services. You command Fire, Ambulance and
              Police from a single unified seat — deciding who rolls, where,
              and how fast.
            </p>
            <p className="mt-5 font-mono text-base text-(--color-amber)">
              You&apos;re in command and control.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-sm bg-(--color-amber) px-6 font-mono text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-amber-400"
              >
                Begin Shift
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-sm border border-(--color-border) px-6 font-mono text-sm font-medium uppercase tracking-widest text-(--color-text) transition-colors hover:border-(--color-amber-dim) hover:text-(--color-amber)"
              >
                Log in
              </Link>
            </div>

            <Link
              href="/trailer2"
              className="group mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim) transition-colors hover:text-(--color-amber)"
            >
              <span>▸ Watch the trailer</span>
              <span className="text-(--color-text-dim)/60 group-hover:text-(--color-amber)/60">
                45 sec
              </span>
            </Link>

            {/* Proof of life — newest patch note, title and date only. */}
            <Link
              href="/changelog"
              className="mt-3 block font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim) transition-colors hover:text-(--color-amber)"
            >
              <span className="text-(--color-ok)">Latest</span> · {LATEST.title} —{" "}
              {formatEntryDate(LATEST.date)}
            </Link>

            <div className="mt-10 flex flex-wrap gap-2 border-t border-(--color-border-subtle) pt-6">
              {["Real stations", "Real resources"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-sm border border-(--color-border) bg-(--color-surface)/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)"
                >
                  {chip}
                </span>
              ))}
            </div>
          </section>

          {/* Live console */}
          <aside>
            <LiveConsole
              fire={fleet.Fire}
              ambulance={fleet.Ambulance}
              police={fleet.Police}
            />
          </aside>
        </div>
      </main>

      <footer className="border-t border-(--color-border-subtle)">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
          <span>The Watch Room</span>
          <span>A serious game about decisions under pressure</span>
        </div>
      </footer>
    </div>
    </>
  );
}
