"use client";

import { useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import {
  type Deployment,
  type Incident,
  type IncidentOutcome,
  type LogEntry,
} from "@/lib/sim/incident_types";
import { blueLight, routeEta } from "@/lib/sim/eta";
import type { StationWithAppliances } from "../page";
import { type Eta } from "./deployment-board";

type Props = {
  incident: Incident;
  stations: StationWithAppliances[];
  deployments: Deployment[];
  log: LogEntry[];
  outcome: IncidentOutcome | null;
  onDeploy: (args: {
    applianceId: string;
    slotId: string;
    etaSeconds: number;
    routeMeters?: number;
    routeCoords?: [number, number][];
  }) => void;
  onStandDownForWelfare: (applianceId: string) => void;
  onResolve: () => void;
  onDismiss: () => void;
  onClose: () => void;
};

export function DraggableIncidentPanel({
  incident,
  stations,
  deployments,
  log,
  outcome,
  onDeploy,
  onStandDownForWelfare,
  onResolve,
  onDismiss,
  onClose,
}: Props) {
  const [etas, setEtas] = useState<Record<string, Eta>>({});

  useEffect(() => {
    const ctrl = new AbortController();
    Promise.all(
      stations.map((s) =>
        routeEta(s.coords, incident.scenario.location.coords, ctrl.signal)
          .then(blueLight)
          .then((r) => ({
            stationId: s.id,
            ...r,
          })),
      ),
    )
      .then((rows) => {
        setEtas(Object.fromEntries(rows.map((r) => [r.stationId, r])));
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [incident.id, stations, incident.scenario.location.coords]);

  const resolved = !!outcome;

  // Live status-bar clock, MDT style.
  const [clock, setClock] = useState("--:--:--");
  useEffect(() => {
    const tick = () => setClock(fmtTime(Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Rnd
      default={{
        x: 24,
        y: 80,
        width: 600,
        height: typeof window !== "undefined" ? window.innerHeight - 120 : 700,
      }}
      minWidth={420}
      minHeight={340}
      bounds="window"
      dragHandleClassName="drag-handle"
      className="z-[1100]"
    >
      {/* Tablet shell — dark bezel with a camera dot, screen inside. */}
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[22px] border-[10px] border-[#17171c] bg-[#17171c] shadow-2xl shadow-black/70 ring-1 ring-[#2c2c34]">
        <span
          aria-hidden
          className="absolute left-1/2 top-[-7px] z-10 size-1.5 -translate-x-1/2 rounded-full bg-[#0b0b0e] ring-1 ring-[#33333c]"
        />
        <div className="flex h-full w-full flex-col overflow-hidden rounded-[12px] bg-(--color-bg)">
          {/* Status bar — also the drag handle. */}
          <div className="drag-handle flex cursor-move items-center justify-between bg-black/60 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
            <div className="flex items-center gap-2">
              <span className="text-(--color-text)">NWRC CAD</span>
              <span className="opacity-50">·</span>
              <span>MDT-4</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="tabular-nums">{clock}</span>
              {/* Signal bars */}
              <svg viewBox="0 0 16 12" width="16" height="12" aria-hidden="true">
                <rect x="0" y="8" width="3" height="4" rx="0.5" fill="currentColor" />
                <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" fill="currentColor" />
                <rect x="9" y="3" width="3" height="9" rx="0.5" fill="currentColor" />
                <rect x="13.5" y="0.5" width="2.5" height="11.5" rx="0.5" fill="currentColor" opacity="0.35" />
              </svg>
              {/* Battery */}
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 24 12" width="22" height="11" aria-hidden="true">
                  <rect x="0.5" y="0.5" width="20" height="11" rx="2.5" fill="none" stroke="currentColor" />
                  <rect x="2" y="2" width="14" height="8" rx="1.5" fill="#34d399" />
                  <rect x="21.5" y="3.5" width="2" height="5" rx="1" fill="currentColor" />
                </svg>
                <span>82%</span>
              </span>
            </div>
          </div>

          {/* App header */}
          <div
            className={
              "flex items-center justify-between border-b border-(--color-border-subtle) px-4 py-2 font-mono text-[10px] uppercase tracking-widest " +
              (resolved ? "bg-(--color-ok)/10" : "bg-(--color-amber)/10")
            }
          >
            <div
              className={
                "flex items-center gap-2 " + (resolved ? "text-(--color-ok)" : "text-(--color-amber)")
              }
            >
              <span
                className={
                  "dot-live size-1.5 rounded-full " +
                  (resolved ? "bg-(--color-ok)" : "bg-(--color-critical)")
                }
              />
              <span>
                {resolved ? "Debrief" : "Live incident"} · #{incident.scenario.id}
              </span>
              <span className="opacity-60">|</span>
              <span>{incident.scenario.severity.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              {!resolved && (
                <button
                  type="button"
                  onClick={onResolve}
                  className="rounded-full border border-(--color-border) px-3 py-0.5 text-(--color-text-dim) hover:border-(--color-ok) hover:text-(--color-ok)"
                >
                  Resolve
                </button>
              )}
              {resolved && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="rounded-full border border-(--color-border) px-3 py-0.5 text-(--color-text-dim) hover:border-(--color-critical) hover:text-(--color-critical)"
                >
                  End Shift Debrief
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-2 py-0.5 text-(--color-text-dim) hover:bg-(--color-bg) hover:text-(--color-critical)"
                title="Close panel"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
          <h1 className="text-xl font-semibold tracking-tight">
            {incident.scenario.title}
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
            {incident.scenario.type.replace(/_/g, " ")} · received {fmtTime(incident.receivedAt)}
          </p>
          <p className="mt-4 text-sm text-(--color-text)">
            {incident.scenario.location.address}, {incident.scenario.location.postcode}
          </p>
          <p className="mt-1 text-xs text-(--color-text-dim)">
            First-due: {incident.scenario.property.firstDueStationId}
          </p>

          {resolved && outcome && <OutcomeView outcome={outcome} />}

          {!resolved && (
            <>
              {incident.scenario.severity === "major" && (
                <Section title="METHANE · Major incident">
                  <MethaneTable methane={incident.scenario.methane} />
                </Section>
              )}

              <Section title="Property">
                <KeyVal k="Class" v={incident.scenario.property.class} />
                {incident.scenario.property.size && (
                  <KeyVal k="Size" v={incident.scenario.property.size} />
                )}
                {incident.scenario.property.materials && (
                  <KeyVal k="Materials" v={incident.scenario.property.materials} />
                )}
                <KeyVal k="Occupants" v={incident.scenario.property.occupants} />
                <KeyVal k="Access" v={incident.scenario.property.access} />
                {incident.scenario.property.vulnerabilities.length > 0 && (
                  <KeyValList
                    k="Vulnerabilities"
                    items={incident.scenario.property.vulnerabilities}
                    tone="amber"
                  />
                )}
                {incident.scenario.property.knownHazards.length > 0 && (
                  <KeyValList
                    k="Hazards on premises"
                    items={incident.scenario.property.knownHazards}
                    tone="critical"
                  />
                )}
              </Section>

              <Section title="PRI">
                <p className="text-xs text-(--color-text-dim)">
                  {incident.scenario.pri.hasFormalPri
                    ? "Formal PRI on file."
                    : "No formal PRI (residential / open)."}
                </p>
                {incident.scenario.pri.items.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-(--color-text)">
                    {incident.scenario.pri.items.map((it) => (
                      <li key={it} className="leading-snug">— {it}</li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Game targets">
                <ul className="space-y-1 text-xs text-(--color-text-muted)">
                  {incident.scenario.evaluation.targets.map((t) => (
                    <li key={t.metric}>
                      <span className="text-(--color-text)">{t.metric}</span> — {t.target}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs italic text-(--color-text-dim)">
                  {incident.scenario.evaluation.lesson}
                </p>
              </Section>
            </>
          )}

          <Section title="Action log">
            <ol className="space-y-1.5 text-xs">
              {log.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                    {fmtTime(e.timestamp)}
                  </span>
                  <span
                    className={
                      e.kind === "incident_opened"
                        ? "text-(--color-critical)"
                        : e.kind === "mobilised"
                          ? "text-(--color-amber)"
                          : e.kind === "in_attendance"
                            ? "text-(--color-info)"
                            : e.kind === "resolved"
                              ? "text-(--color-ok)"
                              : "text-(--color-text)"
                    }
                  >
                    {e.message}
                  </span>
                </li>
              ))}
              {log.length === 0 && (
                <li className="text-(--color-text-dim)">No events yet.</li>
              )}
            </ol>
          </Section>
          </div>

          {/* Home indicator */}
          <div className="flex items-center justify-center bg-black/40 py-1.5">
            <span className="h-1 w-24 rounded-full bg-white/25" />
          </div>
        </div>
      </div>
    </Rnd>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function OutcomeView({ outcome }: { outcome: IncidentOutcome }) {
  return (
    <section className="mt-6">
      <div className="flex items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-sm border border-(--color-ok)/40 bg-(--color-ok)/10 font-mono text-3xl font-bold text-(--color-ok)">
          {outcome.grade}
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
            Dispatch grade · {outcome.passedCount}/{outcome.totalCount} targets met
          </p>
          <p className="mt-1 text-sm text-(--color-text)">{outcome.summary}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {outcome.metrics.map((m) => (
          <li
            key={m.label}
            className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface-raised) px-3 py-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">{m.label}</span>
              <span
                className={
                  "rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest " +
                  (m.passed === true
                    ? "border-(--color-ok)/40 bg-(--color-ok)/10 text-(--color-ok)"
                    : m.passed === "partial"
                      ? "border-(--color-amber)/40 bg-(--color-amber)/10 text-(--color-amber)"
                      : "border-(--color-critical)/40 bg-(--color-critical)/10 text-(--color-critical)")
                }
              >
                {m.passed === true ? "Met" : m.passed === "partial" ? "Partial" : "Missed"}
              </span>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
              <div>
                Target <span className="text-(--color-text)">{m.target}</span>
              </div>
              <div>
                Actual <span className="text-(--color-text)">{m.actual}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
        Appliances returning to station — close this debrief when all are back.
      </p>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="px-1 font-mono text-[11px] uppercase tracking-widest text-(--color-amber-dim)">
        {title}
      </h2>
      {/* Tablet-app grouped card */}
      <div className="mt-1.5 rounded-xl border border-(--color-border-subtle) bg-(--color-surface-raised)/70 px-4 py-3">
        {children}
      </div>
    </section>
  );
}

function MethaneTable({ methane }: { methane: Incident["scenario"]["methane"] }) {
  const rows: [string, string, string][] = [
    ["M", "Major incident", methane.M],
    ["E", "Exact location", methane.E],
    ["T", "Type", methane.T],
    ["H", "Hazards", methane.H],
    ["A", "Access", methane.A],
    ["N", "Number of casualties", methane.N],
    ["E", "Emergency services", methane.emergencyServices],
  ];
  return (
    <dl className="space-y-1.5 text-xs">
      {rows.map(([letter, label, val]) => (
        <div key={label} className="grid grid-cols-[1.5rem_8rem_1fr] items-baseline gap-2">
          <dt className="text-center font-mono font-bold text-(--color-amber)">{letter}</dt>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
            {label}
          </dt>
          <dd className="text-(--color-text)">{val}</dd>
        </div>
      ))}
    </dl>
  );
}

function KeyVal({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] items-baseline gap-2 text-xs">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">{k}</dt>
      <dd className="text-(--color-text)">{v}</dd>
    </div>
  );
}

function KeyValList({
  k,
  items,
  tone,
}: {
  k: string;
  items: string[];
  tone: "amber" | "critical";
}) {
  const cls = tone === "amber" ? "text-(--color-amber)" : "text-(--color-critical)";
  return (
    <div className="mt-1 grid grid-cols-[8rem_1fr] items-baseline gap-2 text-xs">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">{k}</dt>
      <dd>
        <ul className="space-y-0.5">
          {items.map((it) => (
            <li key={it} className={cls}>— {it}</li>
          ))}
        </ul>
      </dd>
    </div>
  );
}


function fmtTime(ts: number): string {
  const d = new Date(ts);
  return [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

function fmtSecs(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}m ${r}s`;
}
