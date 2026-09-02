"use client";

// "Shift in progress" banner on the ops-centre menu. Reads the local
// shift save; if one exists, offers the resume path (the dashboard
// shows its own Resume/Discard prompt on arrival).

import { PATCH_LABEL } from "@/lib/sim/areas";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadSave, summariseSave } from "@/lib/sim/save";

export function MenuResumeBanner() {
  const [summary, setSummary] = useState<ReturnType<typeof summariseSave> | null>(null);
  useEffect(() => {
    const save = loadSave();
    if (save) setSummary(summariseSave(save));
  }, []);

  if (!summary) return null;

  const when =
    summary.minutesAgo === 0
      ? "moments ago"
      : summary.minutesAgo < 60
        ? `${summary.minutesAgo} min ago`
        : `${Math.round(summary.minutesAgo / 60)} h ago`;

  return (
    <Link
      href="/dashboard"
      className="group flex items-center justify-between gap-4 rounded-sm border border-(--color-critical)/50 bg-(--color-critical)/10 px-5 py-4 transition-colors hover:border-(--color-critical)"
    >
      <div className="flex items-center gap-3">
        <span className="dot-live size-2 rounded-full bg-(--color-critical)" />
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-(--color-critical)">
            Shift in progress · saved {when}
          </div>
          <div className="mt-0.5 text-sm text-(--color-text)">
            {summary.incidentTitle ?? "No active incident"} — {PATCH_LABEL} ·{" "}
            {summary.intensity}
          </div>
        </div>
      </div>
      <span className="font-mono text-sm uppercase tracking-widest text-(--color-critical) group-hover:translate-x-0.5">
        Resume →
      </span>
    </Link>
  );
}
