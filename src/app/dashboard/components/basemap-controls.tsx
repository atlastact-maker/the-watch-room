"use client";

import { useState } from "react";
import { CAD_VARS } from "./cad-theme";
import {
  BASEMAP_STORAGE_KEY,
  OS_ERRORS_URL,
  OS_TERMS_URL,
  basemapById,
  groundBasemaps,
  type Basemap,
  type BasemapId,
} from "@/lib/map-basemaps";

/**
 * The operator's base-map choice, remembered between shifts and shared by
 * every map in the app — the dispatch map and the incident map read the
 * same key, so switching on one and coming back to the other does not
 * hand you a different-looking world.
 */
export function useBasemapChoice(): {
  options: Basemap[];
  basemap: Basemap;
  id: BasemapId;
  choose: (id: BasemapId) => void;
} {
  const options = groundBasemaps();
  const [id, setId] = useState<BasemapId>(() => {
    if (typeof window === "undefined") return options[0].id;
    try {
      const saved = window.localStorage.getItem(BASEMAP_STORAGE_KEY);
      if (saved && options.some((o) => o.id === saved)) return saved as BasemapId;
    } catch {
      // best-effort — a blocked localStorage just means no memory
    }
    return options[0].id;
  });

  function choose(next: BasemapId) {
    setId(next);
    try {
      window.localStorage.setItem(BASEMAP_STORAGE_KEY, next);
    } catch {
      // best-effort
    }
  }

  return { options, basemap: basemapById(id), id, choose };
}

/** Base-map switch — top-right, clear of the placement banner. */
export function BasemapToggle({
  options,
  current,
  onChoose,
}: {
  options: { id: BasemapId; label: string }[];
  current: BasemapId;
  onChoose: (id: BasemapId) => void;
}) {
  if (options.length < 2) return null;
  return (
    // Same CAD treatment as the floating panels — a segmented control with
    // the live option as a solid block rather than a tinted highlight.
    <div
      style={CAD_VARS}
      className="pointer-events-auto absolute right-3 top-3 z-[600] flex overflow-hidden rounded-sm border-2 border-zinc-500 bg-(--color-bg) shadow-lg"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChoose(o.id)}
          className={
            "px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors " +
            (o.id === current
              ? "bg-[#b45309] text-white"
              : "text-(--color-text-dim) hover:bg-(--color-surface-raised) hover:text-(--color-text)")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Attribution block. Ordnance Survey require the copyright statement,
 * their logo, and links to the errors tool and the terms — all inside the
 * map — so this is rendered here rather than in Leaflet's own attribution
 * control, which is why the maps disable it.
 */
export function MapAttribution({
  basemap,
}: {
  basemap: { id: BasemapId; attribution: string };
}) {
  const isOs = basemap.id === "os" || basemap.id === "os_outdoor";
  return (
    <div className="pointer-events-auto absolute bottom-1 left-1 z-[600] flex items-center gap-1.5 rounded-sm bg-(--color-bg)/75 px-1.5 py-0.5 font-mono text-[8px] leading-tight text-(--color-text-dim)">
      {isOs && (
        <span
          className="shrink-0 rounded-[2px] bg-white px-1 py-px text-[7px] font-bold tracking-tight text-black"
          aria-label="Ordnance Survey"
          title="Ordnance Survey"
        >
          OS
        </span>
      )}
      <span>{basemap.attribution}</span>
      {isOs && (
        <>
          <a
            href={OS_ERRORS_URL}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-(--color-amber)"
          >
            Report an error
          </a>
          <a
            href={OS_TERMS_URL}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-(--color-amber)"
          >
            Terms
          </a>
        </>
      )}
    </div>
  );
}
