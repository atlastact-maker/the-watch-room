"use client";

// The call stack — the spine of a CAD.
//
// Two lists in one panel. Above the line: calls that have come in and
// nobody has picked up, with the wait time ticking. Below it: the jobs
// you are actually running, with what is committed to each.
//
// The waiting time is the whole point. In a real control room the
// pressure does not come from the job you are working, it comes from the
// one nobody has answered yet — so an unanswered call gets louder the
// longer it sits, and the panel never lets you forget it is there.
//
// Resources drag onto the running jobs: pick a unit up in the resources
// panel, drop it on a call, and it mobilises to that incident.

import { Rnd } from "react-rnd";
import { useState } from "react";
import type { Incident } from "@/lib/sim/incident_types";
import type { Scenario, Severity } from "@/lib/sim/incident_types";

export type PendingCall = {
  id: string;
  scenario: Scenario;
  receivedAt: number;
};

export const DRAG_MIME = "application/x-twr-appliance";

type Frame = { x: number; y: number; width: number; height: number };
const FRAME_KEY = "twr:callstack-frame:v1";

function loadFrame(): Frame | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FRAME_KEY);
    if (!raw) return null;
    const f = JSON.parse(raw) as Frame;
    if (typeof f.x !== "number" || typeof f.y !== "number") return null;
    return {
      width: Math.max(280, Math.min(f.width, window.innerWidth)),
      height: Math.max(160, Math.min(f.height, window.innerHeight)),
      x: Math.max(0, Math.min(f.x, window.innerWidth - 160)),
      y: Math.max(0, Math.min(f.y, window.innerHeight - 100)),
    };
  } catch {
    return null;
  }
}
function saveFrame(f: Frame) {
  try {
    window.localStorage.setItem(FRAME_KEY, JSON.stringify(f));
  } catch {
    /* best effort */
  }
}

function waitLabel(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

/** How hard the panel shouts about a call nobody has picked up. */
function waitTone(sec: number): { cls: string; bar: string } {
  if (sec >= 120) return { cls: "text-(--color-critical)", bar: "bg-(--color-critical)" };
  if (sec >= 45) return { cls: "text-(--color-amber)", bar: "bg-(--color-amber)" };
  return { cls: "text-(--color-ok)", bar: "bg-(--color-ok)" };
}

const SEV_CLS: Record<Severity, string> = {
  low: "bg-(--color-ok) text-black",
  moderate: "bg-(--color-amber) text-black",
  high: "bg-(--color-critical) text-white",
  major: "bg-(--color-critical) text-white",
};

export function CallStack({
  pending,
  incidents,
  selectedIncidentId,
  now,
  resourceCount,
  isResolved,
  onAnswer,
  onDecline,
  onSelectIncident,
  onDropAppliance,
  onClose,
}: {
  pending: PendingCall[];
  incidents: Incident[];
  selectedIncidentId: string | null;
  now: number;
  /** Committed units per incident id. */
  resourceCount: Record<string, number>;
  isResolved: (incidentId: string) => boolean;
  onAnswer: (call: PendingCall) => void;
  onDecline: (call: PendingCall) => void;
  onSelectIncident: (incidentId: string) => void;
  onDropAppliance: (incidentId: string, applianceId: string, stationId: string) => void;
  onClose?: () => void;
}) {
  const [frame] = useState<Frame>(() => {
    const saved = loadFrame();
    if (saved) return saved;
    const w = typeof window !== "undefined" ? window.innerWidth : 1400;
    return { x: Math.max(16, w - 360), y: 96, width: 330, height: 380 };
  });
  const [dragOver, setDragOver] = useState<string | null>(null);

  return (
    <Rnd
      default={frame}
      minWidth={280}
      minHeight={160}
      dragHandleClassName="stack-drag"
      onDragStop={(_e, d) => saveFrame({ ...frame, x: d.x, y: d.y })}
      onResizeStop={(_e, _dir, ref, _delta, pos) =>
        saveFrame({ x: pos.x, y: pos.y, width: ref.offsetWidth, height: ref.offsetHeight })
      }
      style={{ zIndex: 1190 }}
      className="pointer-events-auto"
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-sm border border-(--color-border) bg-(--color-surface)/95 shadow-2xl shadow-black/60 backdrop-blur-sm">
        <div className="stack-drag flex cursor-move items-center justify-between gap-2 border-b border-(--color-border) bg-(--color-surface-raised) px-2 py-1">
          <div className="flex min-w-0 items-center gap-1.5">
            {pending.length > 0 && (
              <span className="dot-live size-1.5 shrink-0 rounded-full bg-(--color-critical)" />
            )}
            <span className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-(--color-text)">
              Call stack
            </span>
            {pending.length > 0 && (
              <span className="shrink-0 rounded-[2px] bg-(--color-critical) px-1 font-mono text-[9px] font-bold text-white">
                {pending.length} waiting
              </span>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-(--color-border) px-1.5 font-mono text-[10px] leading-4 text-(--color-text-dim) hover:border-(--color-critical) hover:text-(--color-critical)"
            >
              ✕
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* ---- Waiting to be answered ---- */}
          {pending.length > 0 && (
            <div>
              <div className="sticky top-0 border-b border-(--color-border-subtle) bg-(--color-bg) px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-(--color-critical)">
                Unanswered
              </div>
              <ul>
                {pending.map((c) => {
                  const waited = Math.max(0, (now - c.receivedAt) / 1000);
                  const tone = waitTone(waited);
                  return (
                    <li
                      key={c.id}
                      className="border-b border-(--color-border-subtle)/60 bg-(--color-critical)/5"
                    >
                      <div className="flex items-stretch">
                        <div className={`w-[3px] shrink-0 ${tone.bar}`} />
                        <button
                          type="button"
                          onClick={() => onAnswer(c)}
                          className="min-w-0 flex-1 px-2 py-1.5 text-left hover:bg-(--color-critical)/10"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate font-mono text-[11px] font-bold text-(--color-text)">
                              {c.scenario.title}
                            </span>
                            <span
                              className={`shrink-0 font-mono text-[10px] tabular-nums ${tone.cls}`}
                            >
                              {waitLabel(waited)}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className={`px-1 font-mono text-[8px] font-bold uppercase tracking-widest ${SEV_CLS[c.scenario.severity]}`}
                            >
                              {c.scenario.severity}
                            </span>
                            <span className="truncate font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                              {c.scenario.location.address}
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDecline(c)}
                          title="Discard this call"
                          className="shrink-0 px-1.5 font-mono text-[10px] text-(--color-text-dim) hover:bg-(--color-critical)/20 hover:text-(--color-critical)"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* ---- Running jobs ---- */}
          <div>
            <div className="sticky top-0 border-b border-(--color-border-subtle) bg-(--color-bg) px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-(--color-text-dim)">
              Live incidents
            </div>
            {incidents.length === 0 ? (
              <p className="px-2 py-3 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                Nothing running
              </p>
            ) : (
              <ul>
                {incidents.map((inc) => {
                  const selected = inc.id === selectedIncidentId;
                  const resolved = isResolved(inc.id);
                  const units = resourceCount[inc.id] ?? 0;
                  const mins = Math.floor((now - inc.receivedAt) / 60000);
                  const hot = dragOver === inc.id;
                  return (
                    <li key={inc.id}>
                      <button
                        type="button"
                        onClick={() => onSelectIncident(inc.id)}
                        onDragOver={(e) => {
                          if (resolved) return;
                          if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (dragOver !== inc.id) setDragOver(inc.id);
                        }}
                        onDragLeave={() => setDragOver((d) => (d === inc.id ? null : d))}
                        onDrop={(e) => {
                          setDragOver(null);
                          if (resolved) return;
                          const raw = e.dataTransfer.getData(DRAG_MIME);
                          if (!raw) return;
                          e.preventDefault();
                          try {
                            const { applianceId, stationId } = JSON.parse(raw);
                            if (applianceId && stationId) {
                              onDropAppliance(inc.id, applianceId, stationId);
                            }
                          } catch {
                            /* malformed payload — ignore */
                          }
                        }}
                        className={`flex w-full items-stretch text-left transition-colors ${
                          hot
                            ? "bg-(--color-amber)/20 ring-1 ring-inset ring-(--color-amber)"
                            : selected
                              ? "bg-(--color-amber)/10"
                              : "hover:bg-(--color-surface-raised)"
                        }`}
                      >
                        <div
                          className={`w-[3px] shrink-0 ${
                            resolved
                              ? "bg-(--color-text-dim)"
                              : selected
                                ? "bg-(--color-amber)"
                                : "bg-(--color-border)"
                          }`}
                        />
                        <div className="min-w-0 flex-1 border-b border-(--color-border-subtle)/60 px-2 py-1.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <span
                              className={`truncate font-mono text-[11px] ${
                                selected
                                  ? "font-bold text-(--color-amber)"
                                  : "text-(--color-text)"
                              }`}
                            >
                              {inc.scenario.title}
                            </span>
                            <span className="shrink-0 font-mono text-[10px] tabular-nums text-(--color-text-dim)">
                              {mins}m
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest">
                            {resolved ? (
                              <span className="px-1 bg-(--color-text-dim)/30 text-(--color-text-dim)">
                                Closed
                              </span>
                            ) : (
                              <span
                                className={`px-1 font-bold ${SEV_CLS[inc.scenario.severity]}`}
                              >
                                {inc.scenario.severity}
                              </span>
                            )}
                            <span
                              className={
                                units === 0 && !resolved
                                  ? "text-(--color-critical)"
                                  : "text-(--color-text-dim)"
                              }
                            >
                              {units === 0 && !resolved
                                ? "NO RESOURCES"
                                : `${units} committed`}
                            </span>
                          </div>
                          {hot && (
                            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-(--color-amber)">
                              Release to mobilise here
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="border-t border-(--color-border) px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
          Drag a unit from Resources onto a job
        </div>
      </div>
    </Rnd>
  );
}
