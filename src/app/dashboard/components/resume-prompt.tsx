"use client";

// Modal shown on dashboard mount when a shift save exists. Offers a
// resume-from-where-you-left-off or a discard-and-start-fresh path.

import { PATCH_LABEL } from "@/lib/sim/areas";
import { useEffect } from "react";
import { summariseSave, type ShiftSave } from "@/lib/sim/save";

type Props = {
  save: ShiftSave;
  onResume: () => void;
  onDiscard: () => void;
};

export function ResumePrompt({ save, onResume, onDiscard }: Props) {
  const s = summariseSave(save);

  // Esc = discard, Enter = resume — the two obvious keyboard defaults.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onDiscard();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onResume();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onResume, onDiscard]);

  const whenLabel =
    s.minutesAgo === 0
      ? "moments ago"
      : s.minutesAgo === 1
        ? "1 minute ago"
        : s.minutesAgo < 60
          ? `${s.minutesAgo} minutes ago`
          : `${Math.round(s.minutesAgo / 60)} hours ago`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shift in progress"
      className="fixed inset-0 z-[3500] flex items-center justify-center bg-(--color-bg)/90 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-sm border border-(--color-amber)/50 bg-(--color-surface) p-6 shadow-2xl shadow-black/70">
        <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber)">
          Shift in progress
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-(--color-text)">
          Resume last shift?
        </h1>

        <dl className="mt-5 space-y-2 text-sm">
          <Row label="Patch" value={`${PATCH_LABEL} · ${s.intensity} intensity`} />
          <Row
            label="Incident"
            value={s.incidentTitle ?? "No active incident yet"}
          />
          <Row label="Saved" value={whenLabel} />
        </dl>

        <p className="mt-4 text-xs text-(--color-text-muted)">
          Resuming picks up exactly where you left off — every timer, ETA
          and casualty state shifts forward by the pause, so no sim time
          passes while you were away.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onResume}
            className="inline-flex h-11 w-full items-center justify-center rounded-sm bg-(--color-amber) font-mono text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-amber-400"
          >
            ▸ Resume shift
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="inline-flex h-10 w-full items-center justify-center rounded-sm border border-(--color-border) font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim) transition-colors hover:border-(--color-critical) hover:text-(--color-critical)"
          >
            Discard &amp; start fresh
          </button>
        </div>

        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)/70">
          Enter = resume · Esc = discard
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-(--color-border-subtle) pb-1.5 last:border-b-0">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
        {label}
      </dt>
      <dd className="text-right text-sm text-(--color-text)">{value}</dd>
    </div>
  );
}
