import Link from "next/link";
import { SignupForm } from "./signup-form";
import { UtcClock } from "./utc-clock";

// Operator-intake signup — styled as a secure control-room terminal.
// Boot-check lines, monospace prompts, and a corner HUD frame the same
// email + password signup flow (plus callsign and consent boxes).

export default function SignupPage() {
  return (
    <div className="relative z-10 flex flex-1 items-center justify-center p-6 font-mono">
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
          <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.2em] text-(--color-amber)">
            <span className="dot-live inline-block size-1.5 rounded-full bg-(--color-amber)" />
            NWRC-04 · Operator Intake
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-(--color-text-dim)">
            Secure Terminal
          </div>
        </div>

        <div className="flex flex-col gap-4 px-6 py-8 sm:px-10">
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
          <p className="text-xs leading-relaxed text-(--color-text-muted)">
            Account required to save campaign progress between shifts.
          </p>

          <SignupForm />

          <p className="mt-1 text-center text-[11px] uppercase tracking-[0.2em] text-(--color-text-dim)">
            Existing operator?{" "}
            <Link href="/login" className="text-(--color-amber) hover:text-amber-400">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Corner HUD */}
      <Link
        href="/"
        className="fixed bottom-5 left-6 text-[10px] uppercase tracking-[0.3em] text-(--color-text-dim) hover:text-(--color-text)"
      >
        ← The Watch Room
      </Link>
      <div className="fixed bottom-5 right-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-(--color-text-dim)">
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
