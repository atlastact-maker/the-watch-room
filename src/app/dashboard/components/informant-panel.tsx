"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 999 Informant panel — a floating terminal-style window that appears the
 * moment the operator answers a scenario call and stays "on the phone"
 * until the first committed crew lands on scene. Visible in both the
 * main dashboard and the ground view so the operator never loses the
 * caller's updates when switching panes.
 *
 * Updates arrive via props from dashboard-client's informant tick, which
 * fires scripted beats with delay gates + probability rolls. The panel
 * itself is pure presentation — renders the transcript, the "call
 * active" pulse, and the "caller cleared the line" state.
 */
export type InformantMessage = {
  id: string;
  text: string;
  tone: "info" | "urgent" | "critical";
  firedAt: number;
};

export function InformantPanel({
  active,
  callOpenedAt,
  messages,
  variant = "dashboard",
  onDismiss,
}: {
  /** True while the informant is still on the line. */
  active: boolean;
  /** Epoch ms when the call was answered — used to show the call duration. */
  callOpenedAt: number;
  messages: InformantMessage[];
  /** Layout tweak. "dashboard" floats bottom-right, "ground" embeds bottom-
   *  left above the SITREP feed so it doesn't cover the map centre. */
  variant?: "dashboard" | "ground";
  /** Hand-dismiss the panel (for the "caller cleared the line" state). */
  onDismiss?: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  // Only count visible messages — the informant tick writes a sentinel
  // with empty text for rolled-out updates so the UI doesn't show them.
  const visible = messages.filter((m) => m.text.length > 0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - callOpenedAt) / 1000)));
    }, 1000);
    setElapsed(Math.max(0, Math.floor((Date.now() - callOpenedAt) / 1000)));
    return () => clearInterval(id);
  }, [active, callOpenedAt]);

  // Auto-scroll to latest message.
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [visible.length]);

  // Once the caller has hung up and there are no messages worth showing,
  // there's nothing to display — bow out.
  if (!active && visible.length === 0) return null;

  const pos =
    variant === "ground"
      ? "bottom-48 left-4 w-[340px]"
      : "bottom-4 right-4 w-[320px]";

  return (
    <div
      className={
        "pointer-events-auto fixed z-[1150] " + pos + " " +
        (active
          ? "border-(--color-critical)/60 bg-(--color-surface)/95"
          : "border-(--color-border) bg-(--color-surface)/80")
      }
      style={{
        borderWidth: 1,
        borderStyle: "solid",
        borderRadius: 2,
        boxShadow: active
          ? "0 0 12px rgba(248,113,113,0.35), 0 8px 24px rgba(0,0,0,0.6)"
          : "0 4px 12px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div
        className={
          "flex items-center justify-between gap-2 border-b px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest " +
          (active
            ? "border-(--color-critical)/40 text-(--color-critical)"
            : "border-(--color-border-subtle) text-(--color-text-dim)")
        }
      >
        <div className="flex items-center gap-2">
          <span
            className={
              "size-1.5 rounded-full " +
              (active ? "dot-live bg-(--color-critical)" : "bg-(--color-text-dim)")
            }
          />
          <span>
            {active ? "999 Caller · On the line" : "Caller · Cleared the line"}
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] tabular-nums">
          {active && <span>{fmtClock(elapsed)}</span>}
          {!active && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-sm px-1.5 text-(--color-text-dim) hover:bg-(--color-bg) hover:text-(--color-critical)"
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Transcript */}
      <div
        ref={listRef}
        className="max-h-[220px] overflow-y-auto px-3 py-2"
      >
        {visible.length === 0 ? (
          <p className="font-mono text-[11px] leading-snug text-(--color-text-dim)">
            <span className="mr-1 opacity-60">▌</span>
            Caller connected — awaiting details…
          </p>
        ) : (
          <ul className="space-y-1.5">
            {visible.map((m) => {
              const tone =
                m.tone === "critical"
                  ? "text-(--color-critical)"
                  : m.tone === "urgent"
                    ? "text-(--color-amber)"
                    : "text-(--color-text)";
              return (
                <li key={m.id} className="flex gap-2 leading-snug">
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                    {fmtTime(m.firedAt)}
                  </span>
                  <span className={`text-[12px] ${tone}`}>
                    <span className="mr-1 opacity-60">▌</span>
                    {m.text}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer — subtle instruction while the call is live. */}
      {active && (
        <div className="border-t border-(--color-border-subtle) bg-(--color-surface-raised) px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
          Line closes when first crew lands on scene
        </div>
      )}
    </div>
  );
}

function fmtClock(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}
