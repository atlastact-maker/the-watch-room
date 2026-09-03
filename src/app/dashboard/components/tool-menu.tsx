"use client";

// The tools menu — one place on the map to bring a panel up or put it
// away. Before this, each panel had its own way back: a stub button
// where the stack had been, another where the log had been, two more in
// the header for the resources and the incident card. Now there is one
// button, in the same CAD chassis as the basemap switch beside it, and
// a checklist under it.
//
// Every entry is a toggle, so the menu doubles as a glance at what is
// open. Entries that do not exist yet are listed dimmed rather than
// left out — the menu is also the plan for what the desk will hold.

import { useEffect, useRef, useState } from "react";
import { CAD_VARS } from "./cad-theme";

export type ToolEntry = {
  id: string;
  label: string;
  /** Short qualifier shown after the label — a count, a state. */
  hint?: string;
  on: boolean;
  onToggle: () => void;
  /** Listed but not yet built. Shown dimmed, cannot be toggled. */
  disabled?: boolean;
  disabledNote?: string;
};

export function ToolMenu({ tools }: { tools: ToolEntry[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openCount = tools.filter((t) => t.on && !t.disabled).length;

  return (
    <div
      ref={ref}
      style={CAD_VARS}
      // Under the basemap switch, same right edge, same chassis.
      className="pointer-events-auto absolute right-3 top-12 z-[1195]"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Tools — show or hide panels"
        className={
          "flex items-center gap-2 overflow-hidden rounded-sm border-2 border-zinc-500 bg-(--color-bg) px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest shadow-lg transition-colors " +
          (open ? "text-(--color-text)" : "text-(--color-text-dim) hover:text-(--color-text)")
        }
      >
        <span aria-hidden className="text-[11px] leading-none">⚙</span>
        Tools
        <span className="rounded-sm bg-(--color-surface-raised) px-1.5 py-0.5 text-[9px] tabular-nums text-(--color-text-dim)">
          {openCount}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-64 overflow-hidden rounded-sm border-2 border-zinc-500 bg-(--color-bg) shadow-2xl shadow-black/60"
        >
          <div className="bg-[#b45309] px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white">
            Desk tools
          </div>
          <ul className="py-1">
            {tools.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={t.on}
                  disabled={t.disabled}
                  onClick={() => {
                    if (t.disabled) return;
                    t.onToggle();
                  }}
                  title={t.disabled ? t.disabledNote : t.on ? "Hide" : "Show"}
                  className={
                    "flex w-full items-center gap-2.5 px-3 py-1.5 text-left font-mono text-[11px] uppercase tracking-widest transition-colors " +
                    (t.disabled
                      ? "cursor-not-allowed text-(--color-text-dim) opacity-50"
                      : "text-(--color-text) hover:bg-(--color-surface-raised)")
                  }
                >
                  {/* The tick box. Drawn, not an <input>, so it sits in the
                      button and the whole row is the target. */}
                  <span
                    aria-hidden
                    className={
                      "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border text-[11px] leading-none " +
                      (t.on && !t.disabled
                        ? "border-(--color-ok) bg-(--color-ok)/15 text-(--color-ok)"
                        : "border-(--color-border) text-transparent")
                    }
                  >
                    ✓
                  </span>
                  <span className="min-w-0 flex-1 truncate">{t.label}</span>
                  {t.hint && (
                    <span className="shrink-0 text-[9px] tabular-nums text-(--color-text-dim)">
                      {t.hint}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
