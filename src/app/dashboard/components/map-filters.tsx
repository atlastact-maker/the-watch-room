"use client";

// What the operator wants to see on the map, and nothing else.
//
// A force-wide board carries a lot at once: forty-odd stations, every
// appliance moving anywhere, three roads patrols and four motorway ones
// going round their circuits, and the job in hand. Most of the time the
// operator is working one service and wants the rest out of the way.
//
// The type list is built from what is ACTUALLY on the map right now, not
// from the full catalogue of appliance types — a filter offering to hide
// a DIM when no DIM is out is noise, and a filter that silently omits
// something that IS out is worse.

import { useState } from "react";
import { CAD_VARS } from "./cad-theme";
import type { ServiceCode } from "@/lib/sim/types";

export type MapFilter = {
  services: Record<ServiceCode, boolean>;
  stations: boolean;
  units: boolean;
  /** The route line trailing a unit that is running somewhere. */
  routes: boolean;
  /** Roads cars out on their patch. */
  patrols: boolean;
  /** The circuits those cars are driving, drawn as lines. */
  patrolRoutes: boolean;
  incident: boolean;
  patchOutline: boolean;
  /** Appliance type code → shown. Absent means shown. */
  types: Record<string, boolean>;
};

export const DEFAULT_MAP_FILTER: MapFilter = {
  services: { Fire: true, Ambulance: true, Police: true },
  stations: true,
  units: true,
  routes: true,
  patrols: true,
  patrolRoutes: false, // off by default: seven circuits is a lot of ink
  incident: true,
  patchOutline: true,
  types: {},
};

const SERVICE_COLOUR: Record<ServiceCode, string> = {
  Fire: "#dc2626",
  Ambulance: "#15803d",
  Police: "#1d4ed8",
};

function Row({
  label,
  hint,
  on,
  onToggle,
  disabled,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={
        "flex w-full items-center gap-2 px-2 py-[3px] text-left disabled:opacity-40 " +
        (disabled ? "" : "hover:bg-(--color-surface-raised)")
      }
    >
      <span
        aria-hidden
        className={
          "h-2.5 w-2.5 shrink-0 border " +
          (on
            ? "border-(--color-amber) bg-(--color-amber)"
            : "border-(--color-border) bg-transparent")
        }
      />
      <span
        className={
          "min-w-0 flex-1 truncate font-mono text-[10px] uppercase tracking-widest " +
          (on ? "text-(--color-text)" : "text-(--color-text-dim)")
        }
      >
        {label}
      </span>
      {hint && (
        <span className="shrink-0 font-mono text-[9px] tabular-nums text-(--color-text-dim)">
          {hint}
        </span>
      )}
    </button>
  );
}

export function MapFilters({
  filter,
  onChange,
  /** Appliance types actually on the map, with how many of each. */
  typesPresent,
  /** Units on the map per service, for the counts beside each service. */
  countsByService,
}: {
  filter: MapFilter;
  onChange: (next: MapFilter) => void;
  typesPresent: { code: string; label: string; count: number }[];
  countsByService: Record<ServiceCode, number>;
}) {
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<MapFilter>) => onChange({ ...filter, ...patch });
  const hiddenTypes = typesPresent.filter((t) => filter.types[t.code] === false).length;
  const hiddenServices = (Object.keys(filter.services) as ServiceCode[]).filter(
    (s) => !filter.services[s],
  ).length;
  const anyHidden =
    hiddenTypes > 0 ||
    hiddenServices > 0 ||
    !filter.stations ||
    !filter.units ||
    !filter.patrols ||
    !filter.incident;

  return (
    <div
      style={CAD_VARS}
      className="pointer-events-auto w-[190px] border border-(--color-border) bg-(--color-bg)/95 text-(--color-text) shadow-lg backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 border-b border-(--color-border-subtle) px-2 py-1 text-left"
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-(--color-text-dim)">
          Map layers
        </span>
        <span
          className={
            "font-mono text-[9px] uppercase tracking-widest " +
            (anyHidden ? "text-(--color-amber)" : "text-(--color-text-dim)")
          }
        >
          {anyHidden ? "filtered" : open ? "hide" : "all"}
        </span>
      </button>

      {open && (
        <div className="max-h-[52vh] overflow-y-auto py-0.5">
          <div className="px-2 pt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-(--color-text-dim)">
            Service
          </div>
          {(Object.keys(filter.services) as ServiceCode[]).map((svc) => (
            <button
              key={svc}
              type="button"
              onClick={() =>
                set({ services: { ...filter.services, [svc]: !filter.services[svc] } })
              }
              className="flex w-full items-center gap-2 px-2 py-[3px] text-left hover:bg-(--color-surface-raised)"
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 border"
                style={{
                  borderColor: SERVICE_COLOUR[svc],
                  background: filter.services[svc] ? SERVICE_COLOUR[svc] : "transparent",
                }}
              />
              <span
                className={
                  "min-w-0 flex-1 truncate font-mono text-[10px] uppercase tracking-widest " +
                  (filter.services[svc] ? "text-(--color-text)" : "text-(--color-text-dim)")
                }
              >
                {svc}
              </span>
              <span className="shrink-0 font-mono text-[9px] tabular-nums text-(--color-text-dim)">
                {countsByService[svc] ?? 0}
              </span>
            </button>
          ))}

          <div className="mt-1 border-t border-(--color-border-subtle)/60 px-2 pt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-(--color-text-dim)">
            Layers
          </div>
          <Row label="Stations" on={filter.stations} onToggle={() => set({ stations: !filter.stations })} />
          <Row label="Units" on={filter.units} onToggle={() => set({ units: !filter.units })} />
          <Row
            label="Unit routes"
            on={filter.routes}
            onToggle={() => set({ routes: !filter.routes })}
            disabled={!filter.units}
          />
          <Row label="Patrols" on={filter.patrols} onToggle={() => set({ patrols: !filter.patrols })} />
          <Row
            label="Patrol circuits"
            hint="lines"
            on={filter.patrolRoutes}
            onToggle={() => set({ patrolRoutes: !filter.patrolRoutes })}
          />
          <Row label="Incident" on={filter.incident} onToggle={() => set({ incident: !filter.incident })} />
          <Row
            label="Patch outline"
            on={filter.patchOutline}
            onToggle={() => set({ patchOutline: !filter.patchOutline })}
          />

          {typesPresent.length > 0 && (
            <>
              <div className="mt-1 flex items-baseline justify-between gap-2 border-t border-(--color-border-subtle)/60 px-2 pt-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-(--color-text-dim)">
                  On the map now
                </span>
                {hiddenTypes > 0 && (
                  <button
                    type="button"
                    onClick={() => set({ types: {} })}
                    className="font-mono text-[9px] uppercase tracking-widest text-(--color-amber) hover:underline"
                  >
                    all
                  </button>
                )}
              </div>
              {typesPresent.map((t) => (
                <Row
                  key={t.code}
                  label={t.label}
                  hint={String(t.count)}
                  on={filter.types[t.code] !== false}
                  onToggle={() =>
                    set({
                      types: { ...filter.types, [t.code]: filter.types[t.code] === false },
                    })
                  }
                />
              ))}
            </>
          )}

          {anyHidden && (
            <div className="mt-1 border-t border-(--color-border-subtle)/60 p-1">
              <button
                type="button"
                onClick={() => onChange({ ...DEFAULT_MAP_FILTER, patrolRoutes: filter.patrolRoutes })}
                className="w-full border border-(--color-amber)/60 bg-(--color-amber)/10 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/20"
              >
                Show everything
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
