"use client";

import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/auth/actions";
import type { AreaCode } from "@/lib/sim/types";
import type { Scenario } from "@/lib/sim/incident_types";
import { SCENARIOS } from "@/lib/sim/scenarios";
import { scenarioCovered } from "@/lib/sim/coverage";
import type { WeatherState } from "@/lib/sim/weather";
import { WeatherChip } from "./weather-chip";

/** Area ↔ Ground segmented switch. Ground is only selectable while a
 *  live incident exists; the ground view renders the same switch in its
 *  mission bar so the operator can flip back. */
export function ViewSwitch({
  mode,
  groundEnabled,
  onSelect,
}: {
  mode: "area" | "ground";
  groundEnabled: boolean;
  onSelect: (mode: "area" | "ground") => void;
}) {
  const base =
    "px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors";
  return (
    <div className="flex items-center overflow-hidden rounded-sm border border-(--color-border)">
      <button
        type="button"
        onClick={() => onSelect("area")}
        className={
          base +
          (mode === "area"
            ? " bg-(--color-amber)/15 text-(--color-amber)"
            : " text-(--color-text-dim) hover:text-(--color-text)")
        }
      >
        Area
      </button>
      <button
        type="button"
        disabled={!groundEnabled}
        onClick={() => groundEnabled && onSelect("ground")}
        title={groundEnabled ? undefined : "No live incident — ground view opens when one is running"}
        className={
          base +
          (mode === "ground"
            ? " bg-(--color-amber)/15 text-(--color-amber)"
            : groundEnabled
              ? " text-(--color-text-dim) hover:text-(--color-text)"
              : " cursor-not-allowed text-(--color-text-dim) opacity-40")
        }
      >
        Ground
      </button>
    </div>
  );
}

type Props = {
  userEmail: string;
  patch: AreaCode;
  weather?: WeatherState;
  audioMuted?: boolean;
  onToggleAudio?: () => void;
  onOpenGlossary?: () => void;
  onChangePatch: () => void;
  resourcesVisible: boolean;
  onToggleResources: () => void;
  incidentPanelVisible: boolean;
  onToggleIncidentPanel: () => void;
  hasActiveIncident: boolean;
  onTriggerScenario: (s: Scenario) => void;
  /** Services covered this shift — scenarios needing others are hidden. */
  coveredServices: import("@/lib/sim/types").ServiceCode[];
  /** Area ↔ Ground view switch. Ground selectable only with a live incident. */
  viewMode?: "area" | "ground";
  groundViewEnabled?: boolean;
  onSelectView?: (mode: "area" | "ground") => void;
};

export function DashboardHeader({
  userEmail,
  patch,
  weather,
  audioMuted,
  onToggleAudio,
  onOpenGlossary,
  onChangePatch,
  resourcesVisible,
  onToggleResources,
  incidentPanelVisible,
  onToggleIncidentPanel,
  hasActiveIncident,
  onTriggerScenario,
  coveredServices,
  viewMode,
  groundViewEnabled,
  onSelectView,
}: Props) {
  const [time, setTime] = useState<string>("--:--:--");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        [now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()]
          .map((n) => String(n).padStart(2, "0"))
          .join(":"),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const scenariosForPatch = SCENARIOS.filter(
    (s) => s.patch === patch && scenarioCovered(s, coveredServices),
  );

  return (
    <header className="border-b border-(--color-border-subtle) bg-(--color-surface)/60">
      <div className="flex items-center justify-between px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
        <div className="flex items-center gap-3">
          <span className="dot-live size-1.5 rounded-full bg-(--color-amber)" />
          <span className="text-(--color-text)">The Watch Room</span>
          <span className="text-(--color-border)">/</span>
          <span>Multi-Agency</span>
          <span className="text-(--color-border)">/</span>
          <button
            type="button"
            onClick={onChangePatch}
            className="text-(--color-amber) hover:text-amber-400"
          >
            {patch} Patch
          </button>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <span>UTC {time}</span>
          {weather && <WeatherChip weather={weather} />}
          <span className="text-(--color-border)">|</span>
          {onSelectView && (
            <>
              <ViewSwitch
                mode={viewMode ?? "area"}
                groundEnabled={!!groundViewEnabled}
                onSelect={onSelectView}
              />
              <span className="text-(--color-border)">|</span>
            </>
          )}
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
              className="rounded-sm border border-(--color-border) px-2 py-1 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim) hover:border-(--color-amber-dim) hover:text-(--color-amber)"
              title="Open glossary (shortcut: ?)"
              aria-label="Open glossary"
            >
              ? Help
            </button>
          )}
          <ScenarioMenu scenarios={scenariosForPatch} onTrigger={onTriggerScenario} />
          {hasActiveIncident && (
            <button
              type="button"
              onClick={onToggleIncidentPanel}
              className="rounded-sm border border-(--color-amber)/50 bg-(--color-amber)/10 px-3 py-1 text-(--color-amber) hover:border-(--color-amber)"
            >
              {incidentPanelVisible ? "Hide Incident" : "Show Incident"}
            </button>
          )}
          <button
            type="button"
            onClick={onToggleResources}
            className="rounded-sm border border-(--color-border) px-3 py-1 hover:border-(--color-amber-dim) hover:text-(--color-amber)"
          >
            {resourcesVisible ? "Hide Resources" : "Show Resources"}
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * Hoverable user-menu dropdown. Sits where the raw email used to render —
 * operator sees their own ID, hovers to reveal a menu (Change patch /
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
            Change patch
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
        className="rounded-sm border border-(--color-border) px-3 py-1 hover:border-(--color-amber-dim) hover:text-(--color-amber)"
      >
        ▶ Trigger Scenario
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[1500] mt-1 w-80 rounded-sm border border-(--color-border) bg-(--color-surface) p-2 shadow-2xl shadow-black/60">
          {scenarios.length === 0 ? (
            <p className="px-2 py-3 text-(--color-text-dim)">
              No scenarios in this patch yet.
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
