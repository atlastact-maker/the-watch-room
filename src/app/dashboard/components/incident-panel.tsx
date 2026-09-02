"use client";

import { useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { CAD_VARS } from "./cad-theme";
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

  // Centred on open. The panel is created when the operator double-
  // clicks a job on the stack, so it should appear where they are
  // looking — the middle of the board — not in a corner.
  const panelWidth = 580;
  const panelHeight = typeof window !== "undefined" ? window.innerHeight - 120 : 700;
  const startX =
    typeof window !== "undefined" ? Math.max(0, (window.innerWidth - panelWidth) / 2) : 24;
  const startY =
    typeof window !== "undefined" ? Math.max(0, (window.innerHeight - panelHeight) / 2) : 80;

  return (
    <Rnd
      default={{
        x: startX,
        y: startY,
        width: panelWidth,
        height: panelHeight,
      }}
      minWidth={400}
      minHeight={320}
      bounds="window"
      dragHandleClassName="drag-handle"
      className="z-[1100]"
    >
      {/* Same CAD chassis as the log, stack and resources panels. The
          header takes the job's state as its colour: red while it is
          running, green once it is closed. */}
      <div
        style={CAD_VARS}
        className="flex h-full w-full flex-col overflow-hidden rounded-sm border-2 border-zinc-500 bg-(--color-bg) text-(--color-text) shadow-2xl shadow-black/60"
      >
        <div
          className={
            "drag-handle flex cursor-move items-stretch justify-between font-mono text-[11px] font-bold text-white " +
            (resolved ? "bg-[#15803d]" : "bg-[#dc2626]")
          }
        >
          <div className="flex min-w-0 items-center gap-2 px-3 py-1 tracking-[0.15em]">
            <span className="dot-live size-1.5 shrink-0 rounded-full bg-white" />
            <span className="truncate uppercase">
              {resolved ? "Debrief" : "Incident"} · #{incident.scenario.id}
            </span>
            <span className="shrink-0 bg-black/25 px-1.5 text-[10px]">
              {incident.scenario.severity.toUpperCase()}
            </span>
          </div>
          <div className="flex shrink-0 items-stretch">
            {!resolved && (
              <button
                type="button"
                onClick={onResolve}
                className="flex items-center bg-[#b91c1c] px-3 transition-colors hover:bg-[#15803d]"
              >
                Resolve
              </button>
            )}
            {resolved && (
              <button
                type="button"
                onClick={onDismiss}
                className="flex items-center bg-[#166534] px-3 transition-colors hover:bg-[#dc2626]"
              >
                End Shift Debrief
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={"flex items-center px-3 transition-colors hover:bg-black/30 " + (resolved ? "bg-[#166534]" : "bg-[#b91c1c]")}
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
    <section className="mt-6">
      <h2 className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber-dim)">
        {title}
      </h2>
      <div className="mt-2 rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/40 px-3 py-3">
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
