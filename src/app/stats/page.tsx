"use client";

// Service record — career statistics accumulated across every shift on
// this device, in the same ops-centre styling as the main menu.

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadCareerStats, type CareerStats, type Grade } from "@/lib/sim/stats";

const GRADE_ORDER: Grade[] = ["A", "B", "C", "D", "F"];
const GRADE_TONE: Record<Grade, string> = {
  A: "bg-(--color-ok)",
  B: "bg-(--color-ok)/70",
  C: "bg-(--color-amber)",
  D: "bg-(--color-amber-dim)",
  F: "bg-(--color-critical)",
};

function fmtDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

function typeLabel(code: string): string {
  return code.replace(/[_-]+/g, " ").toUpperCase();
}

export default function StatsPage() {
  // Load on the client only — localStorage isn't there for the server pass.
  const [stats, setStats] = useState<CareerStats | null>(null);
  useEffect(() => {
    setStats(loadCareerStats());
  }, []);

  const avgFirstAlloc =
    stats && stats.firstAllocCount > 0 ? stats.firstAllocSumSec / stats.firstAllocCount : 0;
  const targetPct =
    stats && stats.targetsTotal > 0 ? Math.round((stats.targetsMet / stats.targetsTotal) * 100) : null;
  const gradeMax = stats ? Math.max(1, ...GRADE_ORDER.map((g) => stats.grades[g] ?? 0)) : 1;
  const busiest = stats
    ? Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).slice(0, 5)
    : [];

  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-1 flex-col">
      <header className="border-b border-(--color-border-subtle) bg-(--color-surface)/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
          <div className="flex items-center gap-3">
            <span className="dot-live size-1.5 rounded-full bg-(--color-amber)" />
            <span className="text-(--color-text)">The Watch Room</span>
            <span className="text-(--color-border)">/</span>
            <span>Service Record</span>
          </div>
          <Link
            href="/menu"
            className="rounded-sm border border-(--color-border) px-2.5 py-1 uppercase tracking-widest text-(--color-text-dim) transition-colors hover:border-(--color-amber) hover:text-(--color-amber)"
          >
            ← Ops Centre
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-amber-dim)">
          Career statistics · this device
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Service record.</h1>

        {stats && stats.callsAnswered === 0 ? (
          <div className="mt-8 rounded-sm border border-(--color-border-subtle) p-8 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
              No shift history yet
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-(--color-text-muted)">
              Statistics build as you take 999 calls, allocate resources and
              close incidents. Start a shift and the record starts writing.
            </p>
            <Link
              href="/dashboard?new=1"
              className="mt-4 inline-block rounded-sm border border-(--color-amber)/60 bg-(--color-amber)/10 px-4 py-2 font-mono text-[12px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/20"
            >
              Start Shift →
            </Link>
          </div>
        ) : (
          <>
            {/* Headline tiles */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="999 calls answered" value={stats ? String(stats.callsAnswered) : "—"} />
              <StatTile label="Incidents resolved" value={stats ? String(stats.incidentsResolved) : "—"} />
              <StatTile label="Resources allocated" value={stats ? String(stats.resourcesAllocated) : "—"} />
              <StatTile
                label="Avg time to first mobilisation"
                value={stats ? fmtDuration(avgFirstAlloc) : "—"}
                hint="Call open → first asset assigned"
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label="Casualties saved"
                value={stats ? String(stats.casualtiesSaved) : "—"}
                tone="ok"
                hint="Handed over at hospital"
              />
              <StatTile
                label="Casualties lost"
                value={stats ? String(stats.casualtiesLost) : "—"}
                tone="critical"
                hint="Triaged expectant at close"
              />
              <StatTile
                label="Dispatch targets met"
                value={targetPct !== null ? `${targetPct}%` : "—"}
                hint={stats && stats.targetsTotal > 0 ? `${stats.targetsMet}/${stats.targetsTotal} assessed` : undefined}
              />
              <StatTile
                label="Resources per incident"
                value={
                  stats && stats.incidentsResolved > 0
                    ? (stats.resourcesAllocated / Math.max(1, stats.callsAnswered)).toFixed(1)
                    : "—"
                }
                hint="Average allocation per call"
              />
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              {/* Grade breakdown */}
              <section className="rounded-sm border border-(--color-border-subtle) p-5">
                <h2 className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber)">
                  Dispatch grade breakdown
                </h2>
                <div className="mt-4 space-y-2.5">
                  {GRADE_ORDER.map((g) => {
                    const n = stats?.grades[g] ?? 0;
                    return (
                      <div key={g} className="flex items-center gap-3">
                        <span className="w-4 shrink-0 font-mono text-sm font-bold text-(--color-text)">
                          {g}
                        </span>
                        <div className="h-3 flex-1 overflow-hidden rounded-sm bg-(--color-surface)">
                          <div
                            className={`h-full ${GRADE_TONE[g]}`}
                            style={{ width: `${(n / gradeMax) * 100}%` }}
                          />
                        </div>
                        <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-(--color-text-dim)">
                          {n}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {stats && stats.incidentsResolved === 0 && (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                    Resolve an incident to earn your first grade
                  </p>
                )}
              </section>

              {/* Incident mix */}
              <section className="rounded-sm border border-(--color-border-subtle) p-5">
                <h2 className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber)">
                  Incident mix
                </h2>
                {busiest.length === 0 ? (
                  <p className="mt-3 text-sm text-(--color-text-muted)">No incidents yet.</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {busiest.map(([type, n]) => (
                      <li key={type} className="flex items-baseline justify-between gap-3 border-b border-(--color-border-subtle) pb-1.5 last:border-b-0">
                        <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-text)">
                          {typeLabel(type)}
                        </span>
                        <span className="font-mono text-xs tabular-nums text-(--color-text-dim)">
                          ×{n}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "ok" | "critical";
}) {
  const valueColour =
    tone === "ok"
      ? "text-(--color-ok)"
      : tone === "critical"
        ? "text-(--color-critical)"
        : "text-(--color-text)";
  return (
    <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface)/40 p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
        {label}
      </div>
      <div className={`mt-1.5 font-mono text-3xl font-bold tabular-nums ${valueColour}`}>{value}</div>
      {hint && (
        <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)/70">
          {hint}
        </div>
      )}
    </div>
  );
}
