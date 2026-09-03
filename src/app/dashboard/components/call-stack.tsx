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
import { CAD_VARS } from "./cad-theme";
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

/** Time until the commander expects to close the job. */
function StopIn({ at, now }: { at: number; now: number }) {
  const left = Math.max(0, Math.round((at - now) / 1000));
  if (left === 0) return <>stop due</>;
  const m = Math.floor(left / 60);
  const s = left % 60;
  return <>{m > 0 ? `${m}m` : `${s}s`}</>;
}

/** The pre-determined attendance: one row per slot the incident type
 *  calls for, and the unit standing in it. Red for a slot nobody is
 *  covering — that is the line the operator is working to close. */
function Attendance({
  rows,
}: {
  rows: { label: string; callsign: string | null; tone: "missing" | "onscene" | "mobile"; etaSeconds: number }[];
}) {
  if (rows.length === 0) return null;
  const short = rows.filter((r) => r.tone === "missing").length;
  return (
    <div className="border-b border-(--color-border-subtle)/60 pb-1">
      <div className="flex items-baseline justify-between gap-2 px-2 pt-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-(--color-text-dim)">
          Attendance
        </span>
        <span
          className={
            "font-mono text-[9px] uppercase tracking-widest " +
            (short > 0 ? "text-(--color-critical)" : "text-(--color-ok)")
          }
        >
          {short > 0 ? short + " short" : "Complete"}
        </span>
      </div>
      <ul className="mt-0.5">
        {rows.map((r, i) => (
          <li key={r.label + i} className="flex items-baseline justify-between gap-2 px-2 py-[2px]">
            <span
              className={
                "min-w-0 truncate font-mono text-[9px] uppercase tracking-widest " +
                (r.tone === "missing" ? "text-(--color-critical)" : "text-(--color-text-dim)")
              }
            >
              {r.label}
            </span>
            <span
              className={
                "shrink-0 font-mono text-[10px] " +
                (r.tone === "missing"
                  ? "text-(--color-critical)"
                  : r.tone === "mobile"
                    ? "text-(--color-amber)"
                    : "text-(--color-ok)")
              }
            >
              {r.callsign === null
                ? "NOT SENT"
                : r.tone === "mobile"
                  ? r.callsign + " · " + Math.max(1, Math.round(r.etaSeconds / 60)) + "m"
                  : r.callsign}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Handing command from the stack itself.
 *
 *  Sits under the committed units in the expanded row, because those are
 *  the units it is choosing between: the drawer answers "what have I got
 *  on this" and then "who can I give it to". */
function HandOverInStack({
  incidentId,
  options,
  onHandOver,
}: {
  incidentId: string;
  options: {
    applianceId: string;
    callsign: string;
    typeName: string;
    advice?: string;
    comfortable?: boolean;
    etaSeconds?: number;
  }[];
  onHandOver: (incidentId: string, applianceId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (options.length === 0) {
    return (
      <div className="border-t border-(--color-border-subtle)/60 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
        Nothing mobilised to take command
      </div>
    );
  }
  return (
    <div className="border-t border-(--color-border-subtle)/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Give the incident to a commander on scene and clear the desk"
        className="flex w-full items-center justify-between gap-2 px-2 py-1 text-left font-mono text-[9px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/10"
      >
        <span>Hand over command</span>
        <span className="shrink-0 text-(--color-text-dim)">{open ? "Cancel" : "Choose"}</span>
      </button>
      {open && (
        <ul className="pb-1">
          <li className="px-2 pb-1 text-[10px] leading-snug text-(--color-text-muted)">
            They take command on arrival. The incident closes on their word, and you lose the
            ground view for it.
          </li>
          {options.map((o) => (
            <li key={o.applianceId}>
              <button
                type="button"
                onClick={() => onHandOver(incidentId, o.applianceId)}
                className="block w-full px-2 py-1 text-left hover:bg-(--color-amber)/10"
              >
                <span className="flex items-baseline gap-1.5">
                  <span className="font-mono text-[10px] font-bold text-(--color-text)">
                    {o.callsign}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                    {o.typeName}
                  </span>
                  <span
                    className={
                      "shrink-0 font-mono text-[9px] uppercase tracking-widest " +
                      (o.etaSeconds ? "text-(--color-amber)" : "text-(--color-ok)")
                    }
                  >
                    {o.etaSeconds
                      ? "in " + Math.max(1, Math.round(o.etaSeconds / 60)) + "m"
                      : "On scene"}
                  </span>
                </span>
                {o.advice && (
                  <span
                    className={
                      "mt-0.5 block text-[10px] leading-snug " +
                      (o.comfortable ? "text-(--color-ok)" : "text-(--color-amber)")
                    }
                  >
                    {o.advice}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CallStack({
  pending,
  incidents,
  selectedIncidentId,
  now,
  unitsByIncident,
  isResolved,
  handoverOf,
  commandOptionsOf,
  pdaOf,
  onHandCommandTo,
  onAnswer,
  onDecline,
  onSelectIncident,
  onOpenIncident,
  onDropAppliance,
  onClose,
  ready,
  onToggleReady,
}: {
  pending: PendingCall[];
  incidents: Incident[];
  selectedIncidentId: string | null;
  now: number;
  /** Committed units per incident id — shown when a job is expanded. */
  unitsByIncident: Record<
    string,
    { id: string; callsign: string; typeName: string; label: string; tone: "mobile" | "onscene" | "other" }[]
  >;
  isResolved: (incidentId: string) => boolean;
  /** Units on scene that could take command of this job, most senior
   *  first. Empty once command has been handed over. */
  commandOptionsOf?: (incidentId: string) => {
    applianceId: string;
    callsign: string;
    typeName: string;
    advice?: string;
    comfortable?: boolean;
  }[];
  onHandCommandTo?: (incidentId: string, applianceId: string) => void;
  /** The pre-determined attendance for this job, and who is covering
   *  each slot. */
  pdaOf?: (incidentId: string) => {
    label: string;
    callsign: string | null;
    tone: "missing" | "onscene" | "mobile";
    etaSeconds: number;
  }[];
  /** Set for a job whose command has been handed over: who has it, and
   *  when they expect to close it. */
  handoverOf?: (
    incidentId: string,
  ) => {
    callsign: string;
    clearAtMs: number;
    /** When they take command — their arrival. Until then the job is
     *  allocated, not commanded. */
    effectiveAtMs: number;
    /** The commander is waiting on something, and by when. */
    pending?: { label: string; dueAtMs: number } | null;
  } | null;
  onAnswer: (call: PendingCall) => void;
  onDecline: (call: PendingCall) => void;
  onSelectIncident: (incidentId: string) => void;
  /** Double-click — open the incident screen for this job. */
  onOpenIncident: (incidentId: string) => void;
  onDropAppliance: (incidentId: string, applianceId: string, stationId: string) => void;
  onClose?: () => void;
  /** Ready to take calls. Not Ready holds the queue — nothing new is
   *  offered until the operator comes back. */
  ready: boolean;
  onToggleReady: () => void;
}) {
  const [frame] = useState<Frame>(() => {
    const saved = loadFrame();
    if (saved) return saved;
    const w = typeof window !== "undefined" ? window.innerWidth : 1400;
    return { x: Math.max(16, w - 360), y: 96, width: 330, height: 380 };
  });
  const [dragOver, setDragOver] = useState<string | null>(null);
  // Which job has its resource list dropped down. Independent of
  // selection, so you can peek at another job without switching to it.
  const [expanded, setExpanded] = useState<string | null>(null);

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
      <div
        style={CAD_VARS}
        className="flex h-full w-full flex-col overflow-hidden rounded-sm border-2 border-zinc-500 bg-(--color-bg) text-(--color-text) shadow-2xl shadow-black/60"
      >
        <style>{`@keyframes call-flash { 0%,100% { background-color: rgba(220,38,38,0.10);} 50% { background-color: rgba(220,38,38,0.28);} }`}</style>
        <div className="stack-drag flex cursor-move items-stretch justify-between bg-[#1d4ed8] font-mono text-[11px] font-bold text-white">
          <div className="flex min-w-0 items-center gap-1.5 px-3 py-1 tracking-[0.15em]">
            {pending.length > 0 && (
              <span className="dot-live size-1.5 shrink-0 rounded-full bg-(--color-critical)" />
            )}
            <span className="truncate uppercase">Call stack</span>
            {pending.length > 0 && (
              <span className="shrink-0 bg-[#dc2626] px-1.5 text-[10px]">{pending.length} WAITING</span>
            )}
          </div>
          <div className="flex shrink-0 items-stretch">
            {/* Ready / Not Ready. Solid green when taking calls, solid amber
                when holding them — the state must read from across the
                room, so it is a block of colour, not a tinted chip. */}
            <button
              type="button"
              role="switch"
              aria-checked={ready}
              onClick={onToggleReady}
              title={
                ready
                  ? "Ready — taking calls. Click to hold incoming calls."
                  : "Not ready — incoming calls held. Click to take calls again."
              }
              className={
                "flex items-center gap-1.5 px-3 text-[10px] tracking-[0.2em] transition-colors " +
                (ready
                  ? "bg-[#15803d] hover:bg-[#166534]"
                  : "bg-[#b45309] hover:bg-[#92400e]")
              }
            >
              <span
                aria-hidden
                className={"size-1.5 rounded-full " + (ready ? "dot-live bg-white" : "bg-white/70")}
              />
              {ready ? "READY" : "NOT READY"}
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center bg-[#1e40af] px-3 transition-colors hover:bg-[#dc2626]"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {!ready && (
          <div className="flex items-center gap-2 border-b border-(--color-border-subtle) bg-[#b45309]/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#b45309]">
            <span aria-hidden>⏸</span>
            Not ready — incoming calls held
          </div>
        )}

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
                      <div className="flex items-stretch" style={{ animation: "call-flash 1.1s ease-in-out infinite" }}>
                        <div className={`w-[3px] shrink-0 ${tone.bar}`} />
                        <div className="min-w-0 flex-1 px-2 py-1.5 text-left">
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
                          {/* Answer or decline in place. A 999 call used to
                              take the whole screen; a control room does not
                              stop for one, it picks it up off the stack. */}
                          <div className="mt-1.5 flex items-stretch gap-1">
                            <button
                              type="button"
                              onClick={() => onAnswer(c)}
                              className="flex-1 bg-(--color-ok) px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-white hover:brightness-110"
                            >
                              Answer
                            </button>
                            <button
                              type="button"
                              onClick={() => onDecline(c)}
                              title="Discard this call"
                              className="border border-(--color-border) px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-(--color-text-dim) hover:border-(--color-critical) hover:text-(--color-critical)"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
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
                  const delegated = resolved ? null : handoverOf?.(inc.id) ?? null;
                  const unitList = unitsByIncident[inc.id] ?? [];
                  const units = unitList.length;
                  const open = expanded === inc.id;
                  const mins = Math.floor((now - inc.receivedAt) / 60000);
                  const hot = dragOver === inc.id;
                  return (
                    <li key={inc.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectIncident(inc.id);
                          setExpanded((e) => (e === inc.id ? null : inc.id));
                        }}
                        onDoubleClick={() => onOpenIncident(inc.id)}
                        title="Click to select and see resources · double-click to open the incident"
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
                              : delegated
                                ? "bg-(--color-ok)"
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
                          {delegated?.pending && (
                          <div className="mt-0.5 truncate text-[11px] leading-snug text-(--color-critical)">
                            {delegated.callsign}: {delegated.pending.label}
                          </div>
                        )}
                        <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest">
                            {resolved ? (
                              <span className="px-1 bg-(--color-text-dim)/30 text-(--color-text-dim)">
                                Closed
                              </span>
                            ) : delegated?.pending ? (
                              <span
                                className="px-1 font-bold bg-(--color-critical) text-white"
                                style={{ animation: "call-flash 1s ease-in-out infinite" }}
                                title={`${delegated.callsign}: ${delegated.pending.label}`}
                              >
                                Assistance · <StopIn at={delegated.pending.dueAtMs} now={now} />
                              </span>
                            ) : delegated && now < delegated.effectiveAtMs ? (
                              <span
                                className="px-1 bg-(--color-amber)/20 text-(--color-amber)"
                                title={`${delegated.callsign} designated incident commander — takes command on arrival`}
                              >
                                {delegated.callsign} designated ·{" "}
                                <StopIn at={delegated.effectiveAtMs} now={now} />
                              </span>
                            ) : delegated ? (
                              <span
                                className="px-1 bg-(--color-ok)/20 text-(--color-ok)"
                                title={`${delegated.callsign} has command — control is clear of this incident`}
                              >
                                {delegated.callsign} has command ·{" "}
                                <StopIn at={delegated.clearAtMs} now={now} />
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

                      {/* What is committed to this job. Dropped down from
                          the row rather than hidden in another panel, so
                          the stack answers "what have I got on this?"
                          without leaving it. */}
                      {open && (
                        <div className="border-b border-(--color-border-subtle) bg-(--color-bg)/60 pl-[3px]">
                          {pdaOf && <Attendance rows={pdaOf(inc.id)} />}
                          <div className="px-2 pt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-(--color-text-dim)">
                            Committed
                          </div>
                          {unitList.length === 0 ? (
                            <p className="px-2 py-1.5 font-mono text-[9px] uppercase tracking-widest text-(--color-critical)">
                              Nothing committed — this job has no resources
                            </p>
                          ) : (
                            <ul className="py-0.5">
                              {unitList.map((u) => (
                                <li
                                  key={u.id}
                                  className="flex items-baseline justify-between gap-2 px-2 py-[3px]"
                                >
                                  <span className="min-w-0 truncate">
                                    <span className="font-mono text-[10px] font-bold text-(--color-text)">
                                      {u.callsign}
                                    </span>
                                    <span className="ml-1.5 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                                      {u.typeName}
                                    </span>
                                  </span>
                                  <span
                                    className={`shrink-0 font-mono text-[9px] uppercase tracking-widest ${
                                      u.tone === "onscene"
                                        ? "text-(--color-ok)"
                                        : u.tone === "mobile"
                                          ? "text-(--color-amber)"
                                          : "text-(--color-text-dim)"
                                    }`}
                                  >
                                    {u.label}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {!resolved && !delegated && commandOptionsOf && onHandCommandTo && (
                            <HandOverInStack
                              incidentId={inc.id}
                              options={commandOptionsOf(inc.id)}
                              onHandOver={onHandCommandTo}
                            />
                          )}
                        </div>
                      )}
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
