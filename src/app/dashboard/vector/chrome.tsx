"use client";

// The VECTOR shell's fixed furniture: brand strip, menu bar, screen tabs,
// workspace bar, alerts strip, the 999 banner, the selected-incident strip
// and the status bar. All presentational — the dashboard client owns the
// state and hands these the values and callbacks.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth/actions";
import { shiftForHour } from "@/lib/sim/police-callsigns";
import type { Severity } from "@/lib/sim/incident_types";
import { CopyButton } from "./copy-button";

export type VectorScreen = "dispatch" | "call" | "mob" | "ground";

export type MenuItem =
  | { sep: true }
  | {
      label: string;
      hint?: string;
      act: () => void;
      disabled?: boolean;
      title?: string;
    };
export type Menu = { label: string; items: MenuItem[] };

/** Shift clock, hh:mm:ss — the time the crews are working to. */
export function useShiftClock(shiftStartedAt: number, shiftStartHour: number) {
  const [time, setTime] = useState("--:--:--");
  const [hour, setHour] = useState(shiftStartHour);
  useEffect(() => {
    const tick = () => {
      const secs = Math.floor((Date.now() - shiftStartedAt) / 1000);
      const shiftSec = shiftStartHour * 3600 + secs;
      const h = Math.floor(shiftSec / 3600) % 24;
      const m = Math.floor((shiftSec % 3600) / 60);
      const s = shiftSec % 60;
      setHour(h);
      setTime([h, m, s].map((n) => String(n).padStart(2, "0")).join(":"));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [shiftStartedAt, shiftStartHour]);
  return { time, hour };
}

/** Operator id from the sign-in — the part before the @, upper-cased,
 *  the way a position label reads on a real desk. */
export function operatorLabel(email: string): string {
  const local = email.split("@")[0] || "OPERATOR";
  return local.replace(/[._-]+/g, " ").toUpperCase().slice(0, 22);
}

export function BrandStrip({
  userEmail,
  clock,
  hour,
  hasLiveIncident,
  shiftSaved,
}: {
  userEmail: string;
  clock: string;
  hour: number;
  hasLiveIncident: boolean;
  shiftSaved: boolean;
}) {
  const router = useRouter();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const shift = shiftForHour(hour).toUpperCase();
  return (
    <div className="vec-brand">
      {confirmLeave && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-[420px] border border-(--vec-border) bg-(--vec-surface) p-5 text-(--vec-text)">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--vec-warn)">
              Leave the shift
            </p>
            <p className="mt-2 text-[13px] leading-snug">
              {shiftSaved ? (
                <>
                  There is a job running. The shift is being saved as you go, so you can
                  pick it up where you left it — but nothing on the ground stops while you
                  are away.
                </>
              ) : (
                <>
                  There is a job running and{" "}
                  <span className="text-(--vec-warn)">it is not being saved</span> — the
                  autosave only runs on the job you have selected. Select the live one
                  before you go, or leave and lose it.
                </>
              )}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmLeave(false)} className="vec-btn">
                Stay on
              </button>
              <button type="button" onClick={() => router.push("/menu")} className="vec-btn solid">
                Ops Room
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="vec-brand-left">
        <span className="vec-wordmark">VECTOR</span>
        <span className="dim">COMMAND &amp; CONTROL</span>
        <span className="sep">|</span>
        <span className="place">GREATER MANCHESTER</span>
        <span className="vec-sim-label">SIMULATION</span>
        <span className="sep">|</span>
        <button
          type="button"
          className="vec-brand-link"
          title="Back to the Ops Room"
          onClick={() => (hasLiveIncident ? setConfirmLeave(true) : router.push("/menu"))}
        >
          ← THE WATCH ROOM
        </button>
      </div>
      <div className="vec-brand-right">
        <span className="pos">
          POS 04 · OP {operatorLabel(userEmail)} · {shift}
        </span>
        <span className="vec-clock">{clock}</span>
      </div>
    </div>
  );
}

export function MenuBar({
  menus,
  lights,
}: {
  menus: Menu[];
  lights: { label: string; tone: "go" | "warn" | "off" | "stop" | "none"; title?: string }[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [left, setLeft] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open === null) return;
    const onDown = (e: PointerEvent) => {
      if (barRef.current?.contains(e.target as Node)) return;
      setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="vec-menubar" ref={barRef}>
      {menus.map((m, i) => (
        <button
          key={m.label}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open === i}
          onClick={(e) => {
            const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
            const b = barRef.current?.getBoundingClientRect();
            setLeft(r.left - (b?.left ?? 0));
            setOpen((o) => (o === i ? null : i));
          }}
          onMouseEnter={(e) => {
            if (open === null || open === i) return;
            const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
            const b = barRef.current?.getBoundingClientRect();
            setLeft(r.left - (b?.left ?? 0));
            setOpen(i);
          }}
        >
          {m.label}
        </button>
      ))}
      <div className="spacer" />
      <div className="vec-syslights">
        {lights.map((l) => (
          <span key={l.label} title={l.title} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span>{l.label}</span>
            {l.tone !== "none" && <i className={l.tone} />}
          </span>
        ))}
      </div>
      {open !== null && menus[open] && (
        <div className="vec-menu-drop" role="menu" style={{ left }}>
          {menus[open].items.map((it, j) =>
            "sep" in it ? (
              <div key={j} className="rule" />
            ) : (
              <button
                key={j}
                type="button"
                role="menuitem"
                disabled={it.disabled}
                title={it.title}
                onClick={() => {
                  setOpen(null);
                  it.act();
                }}
              >
                <span className="lbl">{it.label}</span>
                {it.hint && <span className="hint">{it.hint}</span>}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function ScreenTabs({
  screen,
  onPick,
  tabs,
  deskSummary,
  theme,
  onToggleTheme,
}: {
  screen: VectorScreen;
  onPick: (s: VectorScreen) => void;
  tabs: { id: VectorScreen; label: string; disabled?: boolean; title?: string; badge?: string }[];
  deskSummary: string;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  return (
    <div className="vec-tabsbar" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          className="vec-tab"
          aria-selected={screen === t.id}
          disabled={t.disabled}
          title={t.title}
          onClick={() => onPick(t.id)}
        >
          {t.label}
          {t.badge && <span className="badge">{t.badge}</span>}
        </button>
      ))}
      <div className="vrule" />
      <span className="vec-desk-summary">{deskSummary}</span>
      <button
        type="button"
        className="vec-theme-toggle"
        aria-pressed={theme === "dark"}
        aria-label="Toggle light and dark mode"
        onClick={onToggleTheme}
      >
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </button>
    </div>
  );
}

export type TileButton = { id: string; label: string; on: boolean; disabled?: boolean; title?: string; count?: string };

export function WorkspaceBar({
  tiles,
  onToggleTile,
  onPreset,
  onSaveLayout,
  onRestoreLayout,
  snap,
  onToggleSnap,
  onMapOnly,
  onReset,
}: {
  tiles: TileButton[];
  onToggleTile: (id: string) => void;
  onPreset: (name: "overview" | "resources") => void;
  onSaveLayout: () => void;
  onRestoreLayout: () => void;
  snap: boolean;
  onToggleSnap: () => void;
  onMapOnly: () => void;
  onReset: () => void;
}) {
  return (
    <div className="vec-panelbar">
      <span className="lbl">WORKSPACE</span>
      <button type="button" onClick={() => onPreset("overview")}>
        Overview
      </button>
      <button type="button" onClick={() => onPreset("resources")}>
        Resources
      </button>
      <button type="button" onClick={onSaveLayout}>
        Save layout
      </button>
      <button type="button" onClick={onRestoreLayout}>
        Restore saved
      </button>
      <button type="button" onClick={onToggleSnap} aria-pressed={snap}>
        {snap ? "Snap: on" : "Snap: off"}
      </button>
      <span className="lbl">PANELS</span>
      {tiles.map((t) => (
        <button
          key={t.id}
          type="button"
          aria-pressed={t.on}
          disabled={t.disabled}
          title={t.title}
          onClick={() => onToggleTile(t.id)}
        >
          {t.label}
          {t.count && <span className="cnt">{t.count}</span>}
        </button>
      ))}
      <span className="spacer" />
      <button type="button" onClick={onMapOnly}>
        Map only
      </button>
      <button type="button" onClick={onReset}>
        Reset panels
      </button>
    </div>
  );
}

export function AlertsStrip({
  waiting,
  pastStandard,
  unfilled,
  onViewCalls,
  onViewIncidents,
  onTestCall,
  testCallDisabled,
}: {
  waiting: number;
  pastStandard: number;
  unfilled: number;
  onViewCalls: () => void;
  onViewIncidents: () => void;
  onTestCall: () => void;
  testCallDisabled?: boolean;
}) {
  const callTone = pastStandard > 0 ? "stop" : waiting > 0 ? "warn" : "go";
  return (
    <div className="vec-alerts">
      <span className="lbl">ALERTS</span>
      <button type="button" onClick={onTestCall} disabled={testCallDisabled} title="Put a scenario call on the stack">
        Test call
      </button>
      <button type="button" onClick={onViewCalls}>
        <span className={`stat ${callTone}`}>
          {waiting} CALLS WAITING · {pastStandard} PAST STANDARD
        </span>{" "}
        <span className="link">View calls ↗</span>
      </button>
      <button type="button" onClick={onViewIncidents}>
        <span className={`stat ${unfilled > 0 ? "stop" : "go"}`}>
          {unfilled} ATTENDANCE SLOTS UNFILLED
        </span>{" "}
        <span className="link">View incidents ↗</span>
      </button>
    </div>
  );
}

export function CallBanner({
  title,
  address,
  grade,
  waited,
  onAnswer,
  onOpenStack,
}: {
  title: string;
  address: string;
  grade: string | null;
  waited: string;
  onAnswer: () => void;
  onOpenStack: () => void;
}) {
  return (
    <div className="vec-call-banner" role="alert">
      <span className="ring" aria-hidden />
      <div className="who">
        <span className="meta">NEW 999 CALL</span>
        <span className="title">{title}</span>
        <span className="meta">{address}</span>
        {grade && <span className="grade">{grade}</span>}
      </div>
      <span className="wait">{waited}</span>
      <button type="button" className="vec-btn go" onClick={onAnswer}>
        Answer
      </button>
      <button type="button" className="vec-btn" onClick={onOpenStack}>
        View stack
      </button>
    </div>
  );
}

export function FocusStrip({
  reference,
  severity,
  title,
  address,
  units,
  onPickUnit,
  onClear,
  shortage,
  shortageOk,
  note,
  nextLabel,
  onNext,
  empty,
}: {
  reference: string;
  severity: Severity;
  title: string;
  address: string;
  units: { id: string; label: string }[];
  onPickUnit: (id: string) => void;
  onClear: () => void;
  shortage: string;
  shortageOk: boolean;
  note: string;
  nextLabel: string;
  onNext: () => void;
  empty?: boolean;
}) {
  if (empty) {
    return (
      <div className="vec-focus">
        <div className="main">
          <div className="refline">
            <span style={{ color: "var(--vec-text-muted)" }}>NO INCIDENT SELECTED</span>
          </div>
          <div className="addr">Select a live incident to see its attendance, units and next action.</div>
        </div>
      </div>
    );
  }
  return (
    <div className="vec-focus">
      <div className="main">
        <div className="refline">
          <span>{reference}</span>
          <span className={`sev ${severity}`}>{severity.toUpperCase()}</span>
          <CopyButton text={reference} label="ref" />
        </div>
        <h2>{title}</h2>
        <div className="addr">
          {address} <CopyButton text={address} label="address" />
        </div>
        <div className="vec-focus-units">
          {units.length === 0 ? (
            <span className="empty">No units allocated</span>
          ) : (
            units.map((u) => (
              <button key={u.id} type="button" onClick={() => onPickUnit(u.id)}>
                {u.label}
              </button>
            ))
          )}
        </div>
      </div>
      <div className="side">
        <button type="button" className="clear" onClick={onClear}>
          Clear selection ×
        </button>
        <div className="next">
          <div className={`summary ${shortageOk ? "ok" : ""}`}>{shortage}</div>
          <div className="note">{note}</div>
          <button type="button" className="vec-btn-primary" onClick={onNext}>
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StatusBar({ items, right }: { items: { text: string; tone?: "stop" | "go" | "warn" }[]; right?: ReactNode }) {
  return (
    <div className="vec-statusbar">
      {items.map((it, i) => (
        <span key={i} className={it.tone}>
          {it.text}
        </span>
      ))}
      <span className="spacer" />
      {right}
    </div>
  );
}

/** Sign-out form, used from the File menu. */
export function SignOutForm({ children }: { children: ReactNode }) {
  return <form action={logout}>{children}</form>;
}
