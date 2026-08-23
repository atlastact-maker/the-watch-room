"use client";

// Last-shift debrief card on the ops-centre menu — yesterday's paper.

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadLastShift, type LastShift } from "@/lib/sim/stats";

const GRADE_TONE: Record<string, string> = {
  A: "border-(--color-ok) text-(--color-ok)",
  B: "border-(--color-ok)/70 text-(--color-ok)",
  C: "border-(--color-amber) text-(--color-amber)",
  D: "border-(--color-amber-dim) text-(--color-amber-dim)",
  F: "border-(--color-critical) text-(--color-critical)",
};

export function LastShiftCard() {
  const [shift, setShift] = useState<LastShift | null>(null);
  useEffect(() => {
    setShift(loadLastShift());
  }, []);
  if (!shift) return null;

  const when = new Date(shift.resolvedAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface)/40 p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
          Last shift · {when}
        </span>
        <Link
          href="/stats"
          className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:text-(--color-amber)"
        >
          Service record →
        </Link>
      </div>
      <div className="mt-2.5 flex items-center gap-3.5">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-sm border-2 bg-(--color-bg)/60 font-mono text-xl font-bold ${GRADE_TONE[shift.grade] ?? GRADE_TONE.C}`}
        >
          {shift.grade}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-(--color-text)">
            {shift.incidentTitle}
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
            {shift.targetsMet}/{shift.targetsTotal} targets ·{" "}
            {shift.resourcesUsed} resources
            {shift.casualtiesSaved + shift.casualtiesLost > 0 && (
              <>
                {" "}
                · <span className="text-(--color-ok)">{shift.casualtiesSaved} saved</span>
                {shift.casualtiesLost > 0 && (
                  <>
                    {" / "}
                    <span className="text-(--color-critical)">{shift.casualtiesLost} lost</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
