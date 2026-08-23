import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth/actions";
import { LiveConsole } from "@/app/components/live-console";
import { STATIONS, getStationAppliances } from "@/lib/sim/data";
import type { ServiceCode } from "@/lib/sim/types";
import { MenuResumeBanner } from "./menu-resume";

// Ops-centre main menu — operator strip up top, action tiles on the
// left, the live NWRC console on the right, and a resume banner when a
// saved shift is waiting.

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

export default async function MenuPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const callsign =
    (user.user_metadata as { callsign?: string } | null)?.callsign ?? null;
  const fleet = fleetCounts();

  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-1 flex-col">
      {/* Operator strip */}
      <header className="border-b border-(--color-border-subtle) bg-(--color-surface)/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
          <div className="flex items-center gap-3">
            <span className="dot-live size-1.5 rounded-full bg-(--color-amber)" />
            <span className="text-(--color-text)">The Watch Room</span>
            <span className="text-(--color-border)">/</span>
            <span>Ops Centre</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-(--color-amber)">
              {callsign ? callsign.toUpperCase() : "Operator"}
            </span>
            <span className="hidden text-(--color-text-dim) sm:inline">{user.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-sm border border-(--color-border) px-2.5 py-1 uppercase tracking-widest text-(--color-text-dim) transition-colors hover:border-(--color-critical) hover:text-(--color-critical)"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-6 py-10 lg:grid-cols-[1.35fr_1fr]">
        {/* Left: actions */}
        <section className="flex flex-col gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-amber-dim)">
              {callsign ? `Welcome back, ${callsign}` : "Welcome back"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Take the chair.
            </h1>
          </div>

          <MenuResumeBanner />

          <Link
            href="/dashboard?new=1"
            className="group rounded-sm border border-(--color-amber)/60 bg-(--color-amber)/10 p-6 transition-colors hover:border-(--color-amber) hover:bg-(--color-amber)/15"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm uppercase tracking-widest text-(--color-amber)">
                Start Shift
              </span>
              <span className="font-mono text-sm text-(--color-amber) transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </div>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-(--color-text-muted)">
              One scored, self-contained shift. Pick your patch and start
              time, take the 999 calls, run the board.
            </p>
          </Link>

          <div className="grid gap-4 sm:grid-cols-2">
            <div
              aria-disabled
              className="cursor-not-allowed rounded-sm border border-(--color-border-subtle) p-5 opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] uppercase tracking-widest text-(--color-text-dim)">
                  Campaign
                </span>
                <span className="rounded-sm border border-(--color-border) px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                  Coming soon
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-(--color-text-muted)">
                Persistent state between shifts — the ground you leave is the
                ground you inherit.
              </p>
            </div>

            <Link
              href="/glossary"
              className="group rounded-sm border border-(--color-border) p-5 transition-colors hover:border-(--color-amber)"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] uppercase tracking-widest text-(--color-text-dim) group-hover:text-(--color-amber)">
                  Glossary &amp; Reference
                </span>
                <span className="font-mono text-[12px] text-(--color-text-dim) group-hover:text-(--color-amber)">
                  →
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-(--color-text-muted)">
                Status codes, METHANE, JESIP, callsigns, clinical scope.
              </p>
            </Link>

            <Link
              href="/stats"
              className="group rounded-sm border border-(--color-border) p-5 transition-colors hover:border-(--color-amber) sm:col-span-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] uppercase tracking-widest text-(--color-text-dim) group-hover:text-(--color-amber)">
                  Service Record
                </span>
                <span className="font-mono text-[12px] text-(--color-text-dim) group-hover:text-(--color-amber)">
                  →
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-(--color-text-muted)">
                Calls answered, grade breakdown, casualties saved and lost,
                allocation speed — your career on the patch.
              </p>
            </Link>
          </div>

          <Link
            href="/trailer2"
            className="group flex items-center justify-between rounded-sm border border-(--color-border-subtle) px-5 py-3 transition-colors hover:border-(--color-amber-dim)"
          >
            <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim) group-hover:text-(--color-amber)">
              ▸ Watch the trailer
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)/70">
              45 sec
            </span>
          </Link>
        </section>

        {/* Right: live console */}
        <aside>
          <LiveConsole
            fire={fleet.Fire}
            ambulance={fleet.Ambulance}
            police={fleet.Police}
          />
        </aside>
      </main>
    </div>
  );
}
