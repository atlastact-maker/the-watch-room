"use client";

import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/auth/actions";
import type { Patch } from "@/lib/sim/areas";
import type { Scenario } from "@/lib/sim/incident_types";
import { SCENARIOS } from "@/lib/sim/scenarios";
import { scenarioCovered } from "@/lib/sim/coverage";
import { CAD_VARS } from "./cad-theme";
import type { WeatherState } from "@/lib/sim/weather";
import { WeatherChip } from "./weather-chip";

type Props = {
  userEmail: string;
  patch: Patch;
  weather?: WeatherState;
  audioMuted?: boolean;
  onToggleAudio?: () => void;
  onOpenGlossary?: () => void;
  onChangePatch: () => void;
  onTriggerScenario: (s: Scenario) => void;
  /** Services covered this shift — scenarios needing others are hidden. */
  coveredServices: import("@/lib/sim/types").ServiceCode[];
  /** Real time the shift began, and the in-world hour it began at. */
  shiftStartedAt: number;
  shiftStartHour: number;
};

export function DashboardHeader({
  userEmail,
  patch,
  weather,
  audioMuted,
  onToggleAudio,
  onOpenGlossary,
  onChangePatch,
  onTriggerScenario,
  coveredServices,
  shiftStartedAt,
  shiftStartHour,
}: Props) {
  // The SHIFT clock, not the wall clock. It starts at the hour the
  // operator chose on the briefing screen and runs forward in real time
  // from there, so the time on the bar is the time the crews are working
  // — which is what drives darkness, HEMS grounding and day-crewed
  // turnout. Nothing on the bar reports real-world time any more — the
  // only clock the operator sees is the one their crews are working to.
  const [time, setTime] = useState<string>("--:--:--");
  useEffect(() => {
    const tick = () => {
      const ranMs = Date.now() - shiftStartedAt;
      const secs = Math.floor(ranMs / 1000);
      const shiftSec = shiftStartHour * 3600 + secs;
      const h = Math.floor(shiftSec / 3600) % 24;
      const m = Math.floor((shiftSec % 3600) / 60);
      const sec = shiftSec % 60;
      setTime(
        [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":"),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [shiftStartedAt, shiftStartHour]);

  // Every scenario is on the patch now; only service coverage gates it.
  void patch;
  const scenariosForPatch = SCENARIOS.filter((s) => scenarioCovered(s, coveredServices));

  return (
    // Top bar on the CAD palette, matching the panels beneath it. The
    // area/ground switch is gone — zooming the map past the detail
    // threshold opens the ground view on its own, so the buttons were a
    // second way to do something the map already does.
    <header
      style={CAD_VARS}
      className="border-b-2 border-zinc-500 bg-(--color-surface-raised) text-(--color-text)"
    >
      <div className="flex items-center justify-between px-6 py-2 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
        <div className="flex items-center gap-3">
          <span className="dot-live size-1.5 rounded-full bg-(--color-amber)" />
          <span className="font-bold text-(--color-text)">The Watch Room</span>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <span className="tabular-nums text-(--color-text)">{time}</span>
          {weather && <WeatherChip weather={weather} />}
          <span className="text-(--color-border)">|</span>
          <UserMenu
            userEmail={userEmail}
            audioMuted={audioMuted}
            onToggleAudio={onToggleAudio}
            onChangePatch={onChangePatch}
          />
        </div>

        <div className="flex items-center gap-2">
          {onOpenGlossary && (
            <button
              type="button"
              onClick={onOpenGlossary}
              className="rounded-sm border border-(--color-border) bg-(--color-surface) px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-(--color-text-dim) transition-colors hover:bg-(--color-amber) hover:text-white"
              title="Open glossary (shortcut: ?)"
              aria-label="Open glossary"
            >
              ? Help
            </button>
          )}
          {/* Panel toggles moved to the Tools menu on the map. */}
          <ScenarioMenu scenarios={scenariosForPatch} onTrigger={onTriggerScenario} />
        </div>
      </div>
    </header>
  );
}

/**
 * Hoverable user-menu dropdown. Sits where the raw email used to render —
 * operator sees their own ID, hovers to reveal a menu (New shift /
 * Settings / End shift). Opens on hover, stays open while the mouse is
 * inside the dropdown, and closes when focus leaves.
 */
function UserMenu({
  userEmail,
  audioMuted,
  onToggleAudio,
  onChangePatch,
}: {
  userEmail: string;
  audioMuted?: boolean;
  onToggleAudio?: () => void;
  onChangePatch: () => void;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Hover-open with a small grace period so transitioning from the
  // trigger to the dropdown doesn't flicker the menu closed.
  function scheduleClose() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 150);
  }
  function cancelClose() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  // Document-click to close when interacting outside the widget.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-sm border border-transparent px-2 py-0.5 text-(--color-text-dim) hover:border-(--color-amber-dim) hover:text-(--color-amber)"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="font-mono">{userEmail}</span>
        <span aria-hidden className="opacity-60">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-[1000] mt-1 w-56 rounded-sm border border-(--color-border) bg-(--color-surface) shadow-2xl shadow-black/70"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {/* Identity row — passive, shows who's signed in. */}
          <div className="border-b border-(--color-border-subtle) px-3 py-2">
            <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
              Signed in
            </div>
            <div className="mt-0.5 truncate font-mono text-[11px] text-(--color-text)">
              {userEmail}
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onChangePatch();
              setOpen(false);
            }}
            className="block w-full px-3 py-2 text-left font-mono text-[11px] uppercase tracking-widest text-(--color-text) hover:bg-(--color-surface-raised) hover:text-(--color-amber)"
          >
            New shift
          </button>
          {onToggleAudio && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onToggleAudio();
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left font-mono text-[11px] uppercase tracking-widest text-(--color-text) hover:bg-(--color-surface-raised) hover:text-(--color-amber)"
            >
              <span>{audioMuted ? "Unmute audio" : "Mute audio"}</span>
              <span className="ml-2 font-mono text-[9px] text-(--color-text-dim)">
                {audioMuted ? "Off" : "On"}
              </span>
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            disabled
            className="block w-full cursor-not-allowed px-3 py-2 text-left font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)"
            title="Settings — coming soon"
          >
            Settings
            <span className="ml-2 font-mono text-[9px] text-(--color-text-dim)">
              (soon)
            </span>
          </button>
          <div className="border-t border-(--color-border-subtle)">
            <form action={logout}>
              <button
                type="submit"
                role="menuitem"
                className="block w-full px-3 py-2 text-left font-mono text-[11px] uppercase tracking-widest text-(--color-critical) hover:bg-(--color-critical)/10"
              >
                End shift · sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ScenarioMenu({
  scenarios,
  onTrigger,
}: {
  scenarios: Scenario[];
  onTrigger: (s: Scenario) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-sm border border-(--color-border) bg-(--color-surface) px-3 py-1 font-bold transition-colors hover:bg-(--color-amber) hover:text-white"
      >
        ▶ Trigger Scenario
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[1500] mt-1 w-80 rounded-sm border border-(--color-border) bg-(--color-surface) p-2 shadow-2xl shadow-black/60">
          {scenarios.length === 0 ? (
            <p className="px-2 py-3 text-(--color-text-dim)">
              No scenarios available for the services you cover.
            </p>
          ) : (
            scenarios.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onTrigger(s);
                  setOpen(false);
                }}
                className="block w-full rounded-sm px-2 py-2 text-left hover:bg-(--color-surface-raised)"
              >
                <div className="font-mono text-[10px] tracking-widest text-(--color-text-dim)">
                  #{s.id} · {s.severity.toUpperCase()}
                </div>
                <div className="mt-0.5 text-sm normal-case tracking-normal text-(--color-text)">
                  {s.title}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
