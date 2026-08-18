"use client";

// Hot debrief screen — shown once the operator resolves the incident
// (outcome is computed). Presents the shift's decisions as a
// structured, scrollable report: headline grade, timeline, per-casualty
// outcomes, clinical coverage, fire progression, resource efficiency,
// plus the scenario's authored evaluation targets + lesson.

import type {
  Deployment,
  Incident,
  IncidentOutcome,
  LogEntry,
  PatientTreatmentState,
  Task,
} from "@/lib/sim/incident_types";
import type { IncidentSimState } from "@/lib/sim/incident_sim";

export function DebriefScreen({
  incident,
  outcome,
  deployments,
  sim,
  treatmentByCasualtyId,
  log,
  tasks,
  onDismiss,
}: {
  incident: Incident;
  outcome: IncidentOutcome;
  deployments: Deployment[];
  sim: IncidentSimState | null;
  treatmentByCasualtyId: Record<string, PatientTreatmentState>;
  log: LogEntry[];
  tasks: Task[];
  onDismiss: () => void;
}) {
  const casualties = incident.scenario.scene?.casualties ?? [];
  const firstMobile = deployments.reduce<number | null>((acc, d) => {
    if (acc === null || d.mobilisedAt < acc) return d.mobilisedAt;
    return acc;
  }, null);
  const firstArrival = deployments.reduce<number | null>((acc, d) => {
    if (acc === null || d.arrivesAt < acc) return d.arrivesAt;
    return acc;
  }, null);
  const stopMessageAt = incident.resolvedAt ?? null;
  const flashoverEvent = log.find(
    (e) => e.kind === "fire_stage" && /flashover/i.test(e.message),
  );
  const extinguishedAt = log.find(
    (e) => e.kind === "fire_stage" && /extinguished/i.test(e.message),
  )?.timestamp;
  const setbacks = log.filter((e) => e.kind === "setback");
  const commanderAt = log.find((e) => e.kind === "commander_assigned")?.timestamp;
  const tacticalModeEvents = log.filter((e) => e.kind === "tactical_mode");

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-(--color-bg)/95 backdrop-blur-sm">
      <div className="my-8 w-full max-w-5xl space-y-4 px-6 py-6">
        {/* Headline */}
        <header className="rounded-sm border border-(--color-amber)/60 bg-(--color-surface) p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber)">
                Hot debrief · Incident #{incident.scenario.id}
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-(--color-text)">
                {incident.scenario.title}
              </h1>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
                {incident.scenario.location.address} · {incident.scenario.location.postcode}
              </p>
            </div>
            <Grade grade={outcome.grade} passed={outcome.passedCount} total={outcome.totalCount} />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-(--color-text-muted)">
            {outcome.summary}
          </p>
        </header>

        {/* Timeline */}
        <section className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface) p-4">
          <SectionHeader>Timeline</SectionHeader>
          <ol className="space-y-1.5 font-mono text-[12px] leading-snug">
            <TLRow ts={incident.receivedAt} label="Call answered · incident opened" tone="amber" />
            {firstMobile !== null && (
              <TLRow
                ts={firstMobile}
                label={`First appliance mobile · ${elapsedFrom(incident.receivedAt, firstMobile)}`}
                tone="info"
              />
            )}
            {commanderAt && (
              <TLRow
                ts={commanderAt}
                label="Scene commander assigned"
                tone="info"
              />
            )}
            {tacticalModeEvents.map((t) => (
              <TLRow key={t.id} ts={t.timestamp} label={t.message} tone="info" />
            ))}
            {firstArrival !== null && (
              <TLRow
                ts={firstArrival}
                label={`First in attendance · ${elapsedFrom(incident.receivedAt, firstArrival)}`}
                tone="ok"
              />
            )}
            {flashoverEvent && (
              <TLRow
                ts={flashoverEvent.timestamp}
                label={flashoverEvent.message}
                tone="critical"
              />
            )}
            {extinguishedAt && (
              <TLRow
                ts={extinguishedAt}
                label={`Fire extinguished · ${elapsedFrom(incident.receivedAt, extinguishedAt)}`}
                tone="ok"
              />
            )}
            {stopMessageAt && (
              <TLRow
                ts={stopMessageAt}
                label={`Stop message · incident closed · ${elapsedFrom(incident.receivedAt, stopMessageAt)}`}
                tone="amber"
              />
            )}
          </ol>
        </section>

        {/* Metrics */}
        <section className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface) p-4">
          <SectionHeader>Metrics</SectionHeader>
          <ul className="divide-y divide-(--color-border-subtle)">
            {outcome.metrics.map((m, i) => (
              <li
                key={`${m.label}-${i}`}
                className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 py-2"
              >
                <span className="text-[13px] text-(--color-text)">{m.label}</span>
                <span className="font-mono text-[11px] text-(--color-text-dim)">
                  <span className="mr-2 text-(--color-text-dim)">target</span>
                  {m.target}
                </span>
                <MetricBadge
                  passed={m.passed}
                  actual={m.actual}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* Per-casualty outcome */}
        {casualties.length > 0 && (
          <section className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface) p-4">
            <SectionHeader>Casualty outcomes</SectionHeader>
            <ul className="space-y-2">
              {casualties.map((c) => {
                const prog = sim?.casualtyProgression[c.id];
                const tx = treatmentByCasualtyId[c.id];
                return (
                  <li
                    key={c.id}
                    className="rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/40 p-3"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div>
                        <div className="text-[13px] text-(--color-text)">
                          {c.label ?? c.id}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                          Started · {c.severity}
                        </div>
                      </div>
                      <CasualtyOutcome prog={prog ?? null} />
                    </div>
                    {tx && (tx.revealedRedFlags ?? []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(tx.revealedRedFlags ?? []).map((f) => (
                          <span
                            key={f}
                            className="rounded-sm border border-(--color-critical)/40 bg-(--color-critical)/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-(--color-critical)"
                          >
                            {f.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}
                    {tx?.chosenDestination && (
                      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                        Conveyed to · {tx.chosenDestination.name}
                        {tx.preferredDestination &&
                          tx.chosenDestination.type === tx.preferredDestination
                            ? " · match"
                            : tx.preferredDestination
                              ? " · preferred was " + tx.preferredDestination
                              : ""}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Setbacks */}
        {setbacks.length > 0 && (
          <section className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface) p-4">
            <SectionHeader>Setbacks encountered</SectionHeader>
            <ul className="space-y-1 font-mono text-[11px]">
              {setbacks.map((s) => (
                <li key={s.id} className="flex gap-3">
                  <span className="shrink-0 text-(--color-text-dim)">
                    {fmtClock(s.timestamp)}
                  </span>
                  <span className="text-(--color-amber)">{s.message}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Evaluation targets (authored per scenario) */}
        {incident.scenario.evaluation.targets.length > 0 && (
          <section className="rounded-sm border border-(--color-amber)/40 bg-(--color-amber)/5 p-4">
            <SectionHeader>Scenario evaluation targets</SectionHeader>
            <dl className="space-y-1">
              {incident.scenario.evaluation.targets.map((t) => (
                <div
                  key={t.metric}
                  className="grid grid-cols-[1fr_auto] gap-3 border-b border-(--color-border-subtle) py-1 last:border-b-0"
                >
                  <dt className="text-[12px] text-(--color-text)">{t.metric}</dt>
                  <dd className="font-mono text-[11px] text-(--color-amber)">{t.target}</dd>
                </div>
              ))}
            </dl>
            {incident.scenario.evaluation.lesson && (
              <p className="mt-3 text-[12px] italic leading-relaxed text-(--color-text-muted)">
                {incident.scenario.evaluation.lesson}
              </p>
            )}
          </section>
        )}

        {/* CTA */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-sm border border-(--color-amber) bg-(--color-amber)/10 px-5 py-2 font-mono text-[11px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/20"
          >
            End shift debrief
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
      {children}
    </h2>
  );
}

function Grade({
  grade,
  passed,
  total,
}: {
  grade: string;
  passed: number;
  total: number;
}) {
  const tone =
    grade === "A"
      ? "text-(--color-ok) border-(--color-ok)/50 bg-(--color-ok)/10"
      : grade === "B"
        ? "text-(--color-amber) border-(--color-amber)/50 bg-(--color-amber)/10"
        : grade === "C"
          ? "text-(--color-amber) border-(--color-amber)/40 bg-(--color-amber)/5"
          : "text-(--color-critical) border-(--color-critical)/60 bg-(--color-critical)/10";
  return (
    <div
      className={"rounded-sm border px-4 py-3 text-right " + tone}
      style={{ minWidth: 140 }}
    >
      <div className="font-mono text-[9px] uppercase tracking-widest opacity-75">Grade</div>
      <div className="font-mono text-4xl font-bold leading-none">{grade}</div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-widest opacity-75">
        {passed} / {total} targets
      </div>
    </div>
  );
}

function TLRow({
  ts,
  label,
  tone,
}: {
  ts: number;
  label: string;
  tone: "amber" | "info" | "ok" | "critical";
}) {
  const cls =
    tone === "critical"
      ? "text-(--color-critical)"
      : tone === "amber"
        ? "text-(--color-amber)"
        : tone === "ok"
          ? "text-(--color-ok)"
          : "text-(--color-info)";
  return (
    <li className="flex gap-3">
      <span className="shrink-0 tabular-nums text-(--color-text-dim)">
        {fmtClock(ts)}
      </span>
      <span className={cls}>{label}</span>
    </li>
  );
}

function MetricBadge({
  passed,
  actual,
}: {
  passed: boolean | "partial";
  actual: string;
}) {
  const cls =
    passed === true
      ? "border-(--color-ok)/60 bg-(--color-ok)/15 text-(--color-ok)"
      : passed === "partial"
        ? "border-(--color-amber)/60 bg-(--color-amber)/10 text-(--color-amber)"
        : "border-(--color-critical)/60 bg-(--color-critical)/10 text-(--color-critical)";
  return (
    <span
      className={
        "rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest " +
        cls
      }
    >
      {actual}
    </span>
  );
}

function CasualtyOutcome({
  prog,
}: {
  prog: IncidentSimState["casualtyProgression"][string] | null;
}) {
  if (!prog)
    return (
      <span className="rounded-sm border border-(--color-border) px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
        No data
      </span>
    );
  const tone =
    prog.stage === "at_hospital"
      ? "border-(--color-ok)/60 bg-(--color-ok)/15 text-(--color-ok)"
      : prog.stage === "expectant"
        ? "border-(--color-critical)/60 bg-(--color-critical)/15 text-(--color-critical)"
        : prog.stage === "conveying"
          ? "border-(--color-amber)/60 bg-(--color-amber)/10 text-(--color-amber)"
          : "border-(--color-border) bg-(--color-surface-raised) text-(--color-text-muted)";
  const label =
    prog.stage === "at_hospital"
      ? "At hospital"
      : prog.stage === "expectant"
        ? "Expectant"
        : prog.stage === "conveying"
          ? "Conveying"
          : prog.stage === "in_treatment"
            ? "In treatment"
            : prog.stage === "located"
              ? "Located · not treated"
              : "Undiscovered";
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span
        className={
          "rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest " +
          tone
        }
      >
        {label}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
        Final · {prog.severity}
      </span>
    </div>
  );
}

function fmtClock(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function elapsedFrom(start: number, end: number): string {
  const s = Math.max(0, Math.floor((end - start) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
}
