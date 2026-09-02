"use client";

// The dispatch log — the running record of everything the shift has done.
//
// A control room's log is not decoration: it is the thing you scroll back
// through when someone asks what time a unit went mobile, and the thing an
// investigation reads afterwards. So it is timestamped to the second,
// typed by event, and never reorders — entries drop in at the bottom and
// stay where they landed.
//
// Draggable and resizable, docked to the left of the map by default, with
// its frame remembered between shifts the same way the MDT's is.

import { Rnd } from "react-rnd";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LogEntry } from "@/lib/sim/incident_types";

type Frame = { x: number; y: number; width: number; height: number };
const FRAME_KEY = "twr:dispatchlog-frame:v1";
const MIN_W = 260;
const MIN_H = 180;

function loadFrame(): Frame | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FRAME_KEY);
    if (!raw) return null;
    const f = JSON.parse(raw) as Frame;
    if (
      typeof f.x !== "number" ||
      typeof f.y !== "number" ||
      typeof f.width !== "number" ||
      typeof f.height !== "number"
    ) {
      return null;
    }
    // Never restore a frame that has drifted off the visible screen.
    return {
      width: Math.max(MIN_W, Math.min(f.width, window.innerWidth)),
      height: Math.max(MIN_H, Math.min(f.height, window.innerHeight)),
      x: Math.max(0, Math.min(f.x, window.innerWidth - 160)),
      y: Math.max(0, Math.min(f.y, window.innerHeight - 100)),
    };
  } catch {
    return null;
  }
}

function saveFrame(f: Frame): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FRAME_KEY, JSON.stringify(f));
  } catch {
    // best-effort
  }
}

/** Event families, so a glance down the left edge reads as colour before
 *  it reads as words. */
type Tone = "mobilise" | "arrive" | "clinical" | "command" | "hazard" | "clear" | "info";

const TONE_CLASS: Record<Tone, string> = {
  mobilise: "text-(--color-amber)",
  arrive: "text-(--color-ok)",
  clinical: "text-(--color-info)",
  command: "text-(--color-critical)",
  hazard: "text-(--color-critical)",
  clear: "text-(--color-text-muted)",
  info: "text-(--color-text-dim)",
};

const TONE_BAR: Record<Tone, string> = {
  mobilise: "bg-(--color-amber)",
  arrive: "bg-(--color-ok)",
  clinical: "bg-(--color-info)",
  command: "bg-(--color-critical)",
  hazard: "bg-(--color-critical)",
  clear: "bg-(--color-text-dim)",
  info: "bg-(--color-border)",
};

/** Short code shown in the gutter — the way a real log is skim-read. */
function classify(kind: LogEntry["kind"]): { tone: Tone; code: string } {
  switch (kind) {
    case "incident_opened":
      return { tone: "command", code: "INC" };
    case "mobilised":
      return { tone: "mobilise", code: "MOB" };
    case "in_attendance":
      return { tone: "arrive", code: "IA" };
    case "at_hospital":
      return { tone: "clinical", code: "HOSP" };
    case "offload_complete":
      return { tone: "clinical", code: "H/O" };
    case "casualty_found":
      return { tone: "clinical", code: "CAS" };
    case "hazard_confirmed":
      return { tone: "hazard", code: "HAZ" };
    case "hazard_mitigated":
      return { tone: "arrive", code: "HAZ" };
    case "tactical_mode":
    case "make_pumps":
    case "commander_assigned":
    case "sector_assigned":
      return { tone: "command", code: "CMD" };
    case "resolved":
      return { tone: "arrive", code: "STOP" };
    case "returning":
    case "back_at_station":
    case "refuel_complete":
    case "welfare_break":
    case "welfare_complete":
      return { tone: "clear", code: "AVL" };
    case "defect":
      return { tone: "hazard", code: "DEF" };
    case "ba_committed":
    case "ba_withdrawn":
      return { tone: "command", code: "BA" };
    case "task_started":
      return { tone: "mobilise", code: "TSK" };
    case "task_completed":
      return { tone: "arrive", code: "TSK" };
    default:
      return { tone: "info", code: "LOG" };
  }
}

function hhmmss(ts: number): string {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

export function DispatchLog({
  log,
  onClose,
}: {
  log: LogEntry[];
  onClose?: () => void;
}) {
  const [frame] = useState<Frame>(() => {
    const saved = loadFrame();
    if (saved) return saved;
    const h = typeof window !== "undefined" ? window.innerHeight : 900;
    return { x: 16, y: 96, width: 330, height: Math.min(460, h - 180) };
  });
  const current = useRef<Frame>(frame);
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState("");
  const [pinned, setPinned] = useState(true);
  const scroller = useRef<HTMLDivElement | null>(null);

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = q
      ? log.filter(
          (e) =>
            e.message.toLowerCase().includes(q) ||
            classify(e.kind).code.toLowerCase().includes(q),
        )
      : log;
    // Newest at the bottom — a log reads downwards, like the real thing.
    return list;
  }, [log, filter]);

  // Follow the tail while pinned. If the operator scrolls up to read
  // something, stop yanking them back down.
  useEffect(() => {
    if (!pinned) return;
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [rows.length, pinned, collapsed]);

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    if (atBottom !== pinned) setPinned(atBottom);
  }

  return (
    <Rnd
      default={frame}
      minWidth={MIN_W}
      minHeight={collapsed ? 0 : MIN_H}
      dragHandleClassName="log-drag"
      enableResizing={!collapsed}
      onDragStop={(_e, d) => {
        current.current = { ...current.current, x: d.x, y: d.y };
        saveFrame(current.current);
      }}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        current.current = {
          x: pos.x,
          y: pos.y,
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        };
        saveFrame(current.current);
      }}
      // Above the map and its controls, below the MDT so the tablet still
      // wins when they overlap.
      style={{ zIndex: 1180 }}
      className="pointer-events-auto"
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-sm border border-(--color-border) bg-(--color-surface)/95 shadow-2xl shadow-black/60 backdrop-blur-sm">
        {/* Title bar / drag handle */}
        <div className="log-drag flex cursor-move items-center justify-between gap-2 border-b border-(--color-border) bg-(--color-surface-raised) px-2 py-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="dot-live size-1.5 shrink-0 rounded-full bg-(--color-amber)" />
            <span className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-(--color-text)">
              Dispatch log
            </span>
            <span className="shrink-0 font-mono text-[9px] tabular-nums text-(--color-text-dim)">
              {log.length}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? "Expand" : "Collapse"}
              className="rounded-sm border border-(--color-border) px-1.5 font-mono text-[10px] leading-4 text-(--color-text-dim) hover:border-(--color-amber) hover:text-(--color-amber)"
            >
              {collapsed ? "▸" : "▾"}
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="Hide the log"
                className="rounded-sm border border-(--color-border) px-1.5 font-mono text-[10px] leading-4 text-(--color-text-dim) hover:border-(--color-critical) hover:text-(--color-critical)"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {!collapsed && (
          <>
            <div className="border-b border-(--color-border-subtle) px-2 py-1">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter — callsign, code, text"
                className="w-full rounded-sm border border-(--color-border) bg-(--color-bg) px-1.5 py-0.5 font-mono text-[10px] text-(--color-text) placeholder:text-(--color-text-dim)/70 focus:border-(--color-amber) focus:outline-none"
              />
            </div>

            <div
              ref={scroller}
              onScroll={onScroll}
              className="min-h-0 flex-1 overflow-y-auto bg-(--color-bg)/60"
            >
              {rows.length === 0 ? (
                <p className="px-2 py-3 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                  {log.length === 0 ? "No traffic yet" : "Nothing matches that filter"}
                </p>
              ) : (
                <ul>
                  {rows.map((e) => {
                    const { tone, code } = classify(e.kind);
                    return (
                      <li
                        key={e.id}
                        className="flex items-start gap-1.5 border-b border-(--color-border-subtle)/60 px-1.5 py-1 last:border-b-0"
                      >
                        <span className={`mt-[3px] h-[9px] w-[2px] shrink-0 ${TONE_BAR[tone]}`} />
                        <span className="shrink-0 font-mono text-[9px] tabular-nums leading-4 text-(--color-text-dim)">
                          {hhmmss(e.timestamp)}
                        </span>
                        <span
                          className={`w-[30px] shrink-0 font-mono text-[9px] font-bold uppercase leading-4 ${TONE_CLASS[tone]}`}
                        >
                          {code}
                        </span>
                        <span className="min-w-0 flex-1 font-mono text-[10px] leading-4 text-(--color-text-muted)">
                          {e.message}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Tail indicator — says plainly whether you are seeing live
                traffic or reading back through history. */}
            <button
              type="button"
              onClick={() => setPinned(true)}
              className={`flex items-center justify-between border-t border-(--color-border) px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${
                pinned
                  ? "cursor-default text-(--color-text-dim)"
                  : "text-(--color-amber) hover:bg-(--color-amber)/10"
              }`}
            >
              <span>{pinned ? "Following live" : "Scrolled back — click to follow"}</span>
              <span className="tabular-nums">{rows.length}</span>
            </button>
          </>
        )}
      </div>
    </Rnd>
  );
}
