import Link from "next/link";
import { SignupForm } from "./signup-form";
import { signupOpen } from "@/lib/auth/signup-window";
import { UtcClock } from "./utc-clock";

// Operator-intake signup — styled as a secure control-room terminal.
// Boot-check lines, monospace prompts, and a corner HUD frame the same
// email + password signup flow (plus callsign and consent boxes).

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ advisor?: string }>;
}) {
  const { advisor } = await searchParams;
  const open = signupOpen();
  return (
    <div className="relative z-10 flex flex-1 items-center justify-center p-4 font-mono sm:p-6">
      {/* Vignette — darkens the page edges so the terminal frame glows. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      <div className="relative w-full max-w-[720px] rounded-sm border border-(--color-border) bg-(--color-surface) shadow-2xl shadow-black/70">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-(--color-border-subtle) bg-(--color-surface-raised) px-4 py-3">
          <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.12em] text-(--color-amber) sm:tracking-[0.2em]">
            <span className="dot-live inline-block size-1.5 shrink-0 rounded-full bg-(--color-amber)" />
            NWRC-04 · Operator Intake
          </div>
          <div className="hidden text-[10px] uppercase tracking-[0.3em] text-(--color-text-dim) sm:block">
            Secure Terminal
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 py-7 sm:px-10 sm:py-8">
          {/* Boot-check lines */}
          <div className="flex flex-col gap-1 text-xs text-(--color-text-dim)">
            <BootLine label="SYS CHECK" />
            <BootLine label="CAD LINK" />
            <BootLine label="AIRWAVE NET" />
          </div>

          <div className="h-px bg-(--color-border-subtle)" />

          <div className="text-[15px] uppercase tracking-[0.12em] text-(--color-amber)">
            &gt; New operator registration
          </div>
          {open ? (
            <>
              <p className="text-xs leading-relaxed text-(--color-text-muted)">
                The Watch Room is in closed development. Active in Fire,
                Ambulance, Police or Control? Tick the advisor box below
                and help shape the simulation now.
              </p>

              <SignupForm defaultAdvisorOpen={advisor === "1"} />
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-(--color-text-muted)">
                Registration opens{" "}
                <span className="text-(--color-amber)">
                  Tuesday 1st September
                </span>
                {" "}— alongside the development advisor programme for
                anyone who has served in Fire, Ambulance, Police or a
                control room.
              </p>
              <p className="text-xs leading-relaxed text-(--color-text-muted)">
                Until then, development happens in the open on{" "}
                <a
                  href="https://discord.gg/YBN3sbphs3"
                  target="_blank"
                  rel="noreferrer"
                  className="text-(--color-info) underline hover:text-(--color-text)"
                >
                  the Discord
                </a>
                .
              </p>
            </div>
          )}

          <p className="mt-1 text-center text-[11px] uppercase tracking-[0.2em] text-(--color-text-dim)">
            Existing operator?{" "}
            <Link href="/login" className="text-(--color-amber) hover:text-amber-400">
              Log in
            </Link>
          </p>

          {/* Mobile stand-in for the fixed corner HUD below. */}
          <Link
            href="/"
            className="py-1 text-center text-[10px] uppercase tracking-[0.3em] text-(--color-text-dim) sm:hidden"
          >
            ← The Watch Room
          </Link>
        </div>
      </div>

      {/* Corner HUD */}
      <Link
        href="/"
        className="fixed bottom-5 left-6 hidden text-[10px] uppercase tracking-[0.3em] text-(--color-text-dim) hover:text-(--color-text) sm:block"
      >
        ← The Watch Room
      </Link>
      <div className="fixed bottom-5 right-6 hidden items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-(--color-text-dim) sm:flex">
        <UtcClock />
        <span className="dot-live inline-block size-1.5 rounded-full bg-(--color-critical)" />
      </div>
    </div>
  );
}

function BootLine({ label }: { label: string }) {
  return (
    <div className="flex items-baseline">
      <span>{label}</span>
      <span className="mx-2 flex-1 -translate-y-[3px] border-b border-dotted border-(--color-border)" />
      <span className="text-(--color-ok)">OK</span>
    </div>
  );
}
