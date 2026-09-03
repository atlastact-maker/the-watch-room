"use client";

// The 999 call log as a desk panel: the caller's words as they come in,
// the on-the-line state and call clock, and the job's risk lines — the
// same Call Information the ground view's MDT carries, in a movable
// window on the area map. Opened from the tools menu; hidden by default,
// because the operator asked for the desk to stay clear until they want
// something on it.
//
// Same frame behaviour as the dispatch log: draggable, resizable,
// remembered between shifts, never restored off-screen.

import { Rnd } from "react-rnd";
import { useRef, useState } from "react";
import { CAD_VARS } from "./cad-theme";
import type { Incident, InformantMessage } from "@/lib/sim/incident_types";
import { CallInformationBody } from "./incident-view";

type Frame = { x: number; y: number; width: number; height: number };
const FRAME_KEY = "twr:calllog-frame:v1";
const MIN_W = 300;
const MIN_H = 220;

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

export function CallLogPanel({
  incident,
  informantLog,
  informantOnCall,
  onClose,
}: {
  incident: Incident;
  informantLog: InformantMessage[];
  informantOnCall: boolean;
  onClose: () => void;
}) {
  const [frame] = useState<Frame>(() => {
    const saved = loadFrame();
    if (saved) return saved;
    const w = typeof window !== "undefined" ? window.innerWidth : 1400;
    const h = typeof window !== "undefined" ? window.innerHeight : 900;
    // Bottom-right by default — where the old floating box lived.
    return { x: Math.max(16, w - 356), y: Math.max(96, h - 520), width: 340, height: 440 };
  });
  const current = useRef<Frame>(frame);
  const [collapsed, setCollapsed] = useState(false);

  const lines = informantLog.filter((m) => m.text.length > 0).length;

  return (
    <Rnd
      default={frame}
      minWidth={MIN_W}
      minHeight={collapsed ? 0 : MIN_H}
      dragHandleClassName="calllog-drag"
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
      style={{ zIndex: 1185 }}
      className="pointer-events-auto"
    >
      <div
        style={CAD_VARS}
        className="flex h-full w-full flex-col overflow-hidden rounded-sm border-2 border-zinc-500 bg-(--color-bg) text-(--color-text) shadow-2xl shadow-black/60"
      >
        {/* Title bar: red while the caller is on the line, grey once
            they have cleared — the state the operator most needs at a
            glance. */}
        <div
          className={
            "calllog-drag flex cursor-move items-stretch justify-between font-mono text-[11px] font-bold text-white " +
            (informantOnCall ? "bg-[#dc2626]" : "bg-[#52525b]")
          }
        >
          <div className="flex min-w-0 items-center gap-1.5 px-3 py-1 tracking-[0.15em]">
            {informantOnCall && (
              <span className="dot-live size-1.5 shrink-0 rounded-full bg-white" />
            )}
            <span className="truncate uppercase">
              {informantOnCall ? "999 caller · on the line" : "999 call log"}
            </span>
            <span className="shrink-0 text-[10px] tabular-nums opacity-80">{lines}</span>
          </div>
          <div className="flex shrink-0 items-stretch">
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? "Expand" : "Collapse"}
              className={
                "flex items-center px-2.5 transition-colors hover:brightness-125 " +
                (informantOnCall ? "bg-[#b91c1c]" : "bg-[#3f3f46]")
              }
            >
              {collapsed ? "▸" : "▾"}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Hide the call log"
              className={
                "flex items-center px-3 transition-colors hover:bg-black/40 " +
                (informantOnCall ? "bg-[#b91c1c]" : "bg-[#3f3f46]")
              }
            >
              ×
            </button>
          </div>
        </div>
        {!collapsed && (
          <CallInformationBody
            incident={incident}
            informantLog={informantLog}
            informantOnCall={informantOnCall}
          />
        )}
      </div>
    </Rnd>
  );
}
