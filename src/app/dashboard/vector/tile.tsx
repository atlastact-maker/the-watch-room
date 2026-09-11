"use client";

// A VECTOR tile — the movable, edge-resizable panel the Dispatch workspace
// is built from. Dark-blue handle, close and pop-out controls, and a
// geometry that is remembered per tile on this device. Workspace presets
// (Overview / Resources) place the tiles the way the prototype did; Save
// layout / Restore saved keep a whole arrangement.

import { Rnd, type RndResizeCallback, type RndDragCallback } from "react-rnd";
import { useCallback, useState, useSyncExternalStore, type ReactNode } from "react";
import { PopoutFrame, PopoutWindow } from "./popout";

export type TileRect = { x: number; y: number; w: number; h: number };
export type TileId =
  | "calls"
  | "live"
  | "incident"
  | "units"
  | "log"
  | "attendance"
  | "available"
  | "cover"
  | "standby"
  | "hospitals"
  | "patients"
  | "tasking"
  | "calllog"
  | "search"
  | "leds"
  | "anpr"
  | "vehicle"
  | "subject"
  | "resources";

const LAYOUT_KEY = "vector-panel-layout-v2";
const WORKSPACE_KEY = "vector-workspace-saved-v2";
const SNAP_KEY = "vector-panel-snap";

type Saved = Partial<Record<TileId, TileRect>>;

function readSaved(): Saved {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(LAYOUT_KEY) || "{}") as Saved;
  } catch {
    return {};
  }
}
function writeSaved(s: Saved) {
  try {
    window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(s));
  } catch {
    /* best effort */
  }
}

/** Where a tile lands by default in a given workspace, for an area of
 *  the given size. Mirrors the prototype's rectFor(). */
export function presetRect(
  preset: "overview" | "resources",
  id: TileId,
  area: { w: number; h: number },
): TileRect | null {
  const { w, h } = area;
  const g = 12;
  const col = Math.min(330, Math.max(240, w * 0.25));
  const right = Math.min(540, Math.max(280, w * 0.43));
  if (preset === "resources") {
    if (id === "live") return { x: g, y: g, w: col, h: h - 2 * g };
    if (id === "available") return { x: Math.max(g, w - right - g), y: g, w: right, h: h - 2 * g };
  }
  if (id === "calls") return { x: g, y: g, w: col, h: (h - 3 * g) / 2 };
  if (id === "live") return { x: g, y: (h + g) / 2, w: col, h: (h - 3 * g) / 2 };
  if (id === "units") return { x: Math.max(g, w - col - g), y: g, w: col, h: Math.min(h - 2 * g, 360) };
  if (id === "incident") return { x: Math.max(g, w - 400 - g), y: g, w: 400, h: Math.min(h - 2 * g, 300) };
  if (id === "log") return { x: g, y: Math.max(g, h - 260 - g), w: col, h: 260 };
  if (id === "attendance") return { x: col + 2 * g, y: Math.max(g, h - 300 - g), w: Math.max(400, w - 2 * col - 4 * g), h: 300 };
  if (id === "available") return { x: Math.max(g, w - right - g), y: g, w: right, h: h - 2 * g };
  if (id === "patients") return { x: Math.max(g, w - right - g), y: g, w: right, h: h - 2 * g };
  if (id === "tasking") return { x: Math.max(g, w - right - g), y: g, w: right, h: h - 2 * g };
  if (id === "subject") return { x: Math.max(g, w - right - g), y: g, w: right, h: Math.min(h - 2 * g, 560) };
  if (id === "cover") return { x: Math.max(g, w - col - g), y: g, w: col, h: Math.min(h - 2 * g, 380) };
  if (id === "standby") return { x: Math.max(g, w - col - g), y: (h + g) / 2, w: col, h: (h - 3 * g) / 2 };
  if (id === "hospitals") return { x: Math.max(g, w - col - 60 - g), y: g, w: col + 60, h: Math.min(h - 2 * g, 360) };
  if (id === "calllog") return { x: col + 2 * g, y: g, w: 360, h: Math.min(h - 2 * g, 420) };
  if (id === "search") return { x: col + 2 * g, y: g, w: 420, h: Math.min(h - 2 * g, 460) };
  if (id === "leds") return { x: col + 2 * g, y: g, w: 520, h: Math.min(h - 2 * g, 520) };
  if (id === "anpr") return { x: col + 2 * g, y: g, w: 520, h: Math.min(h - 2 * g, 480) };
  if (id === "vehicle") return { x: Math.max(g, w - 420 - g), y: g, w: 420, h: Math.min(h - 2 * g, 500) };
  if (id === "resources") return { x: Math.max(g, w - right - g), y: g, w: right, h: h - 2 * g };
  return null;
}

function clamp(r: TileRect, area: { w: number; h: number }, min: { w: number; h: number }): TileRect {
  const w = Math.min(area.w, Math.max(min.w, r.w));
  const h = Math.min(area.h, Math.max(min.h, r.h));
  const x = Math.max(0, Math.min(area.w - w, r.x));
  const y = Math.max(0, Math.min(area.h - h, r.y));
  return { x, y, w, h };
}

/* The layout store — the remembered geometry, the active preset and the
   snap switch — lives outside React and is subscribed to, so the tiles
   and the workspace bar read one source of truth without copying it
   into state. */
type Store = { saved: Saved; preset: "overview" | "resources"; snap: boolean; version: number; loaded: boolean };
const store: Store = { saved: {}, preset: "overview", snap: false, version: 0, loaded: false };
const listeners = new Set<() => void>();
function emit() {
  store.version += 1;
  for (const l of listeners) l();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!store.loaded) {
    store.loaded = true;
    store.saved = readSaved();
    try {
      store.snap = window.localStorage.getItem(SNAP_KEY) === "true";
    } catch {
      /* ignore */
    }
    queueMicrotask(emit);
  }
  return () => {
    listeners.delete(cb);
  };
}
const getVersion = () => store.version;
const getServerVersion = () => -1;

/** The layout store hook: one place the workspace bar and the tiles share. */
export function useTileLayout() {
  const version = useSyncExternalStore(subscribe, getVersion, getServerVersion);

  const rectFor = useCallback((id: TileId): TileRect | undefined => store.saved[id], []);
  const remember = useCallback((id: TileId, r: TileRect) => {
    store.saved = { ...store.saved, [id]: r };
    writeSaved(store.saved);
  }, []);
  const applyPreset = useCallback((name: "overview" | "resources") => {
    store.preset = name;
    store.saved = {};
    writeSaved(store.saved);
    emit();
  }, []);
  const reset = useCallback(() => {
    store.preset = "overview";
    store.saved = {};
    writeSaved(store.saved);
    emit();
  }, []);
  const save = useCallback((tiles: Record<string, boolean>): boolean => {
    try {
      window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ tiles, panels: store.saved }));
      return true;
    } catch {
      return false;
    }
  }, []);
  const restore = useCallback((): Record<string, boolean> | null => {
    try {
      const v = JSON.parse(window.localStorage.getItem(WORKSPACE_KEY) || "null") as {
        tiles: Record<string, boolean>;
        panels: Saved;
      } | null;
      if (!v || !v.tiles || !v.panels) return null;
      store.saved = v.panels;
      writeSaved(store.saved);
      emit();
      return v.tiles;
    } catch {
      return null;
    }
  }, []);
  const toggleSnap = useCallback(() => {
    store.snap = !store.snap;
    try {
      window.localStorage.setItem(SNAP_KEY, String(store.snap));
    } catch {
      /* ignore */
    }
    emit();
  }, []);

  return {
    version,
    preset: store.preset,
    rectFor,
    remember,
    applyPreset,
    reset,
    save,
    restore,
    snap: store.snap,
    toggleSnap,
  };
}

export type TileLayout = ReturnType<typeof useTileLayout>;

let zTop = 1100;

export function VectorTile({
  id,
  title,
  count,
  flag,
  layout,
  area,
  onClose,
  headerExtra,
  minWidth = 220,
  minHeight = 120,
  children,
  zIndex,
  popped,
  onPopOut,
  onDock,
}: {
  id: TileId;
  title: string;
  count?: string;
  flag?: string;
  layout: TileLayout;
  /** The workspace the tile lives in — its size decides presets. */
  area: { w: number; h: number };
  onClose?: () => void;
  headerExtra?: ReactNode;
  minWidth?: number;
  minHeight?: number;
  children: ReactNode;
  zIndex?: number;
  /** Lifted into its own window — see popout.tsx. */
  popped?: boolean;
  onPopOut?: () => void;
  onDock?: () => void;
}) {
  const [z, setZ] = useState(zIndex ?? ++zTop);
  if (popped && onDock) {
    return (
      <PopoutWindow id={id} title={title} onClose={onDock}>
        <PopoutFrame title={title} onDock={onDock}>
          {children}
        </PopoutFrame>
      </PopoutWindow>
    );
  }
  const min = { w: minWidth, h: minHeight };
  const initial =
    layout.rectFor(id) ??
    presetRect(layout.preset, id, area) ??
    { x: 12, y: 12, w: 350, h: 300 };
  const rect = clamp(initial, area, min);

  const onDragStop: RndDragCallback = (_e, d) => {
    let x = d.x;
    let y = d.y;
    const cur = { x: d.x, y: d.y, w: d.node.offsetWidth, h: d.node.offsetHeight };
    if (layout.snap) {
      const dist = 18;
      if (x < dist) x = 0;
      if (y < dist) y = 0;
      if (Math.abs(area.w - x - cur.w) < dist) x = area.w - cur.w;
      if (Math.abs(area.h - y - cur.h) < dist) y = area.h - cur.h;
    }
    layout.remember(id, clamp({ ...cur, x, y }, area, min));
  };
  const onResizeStop: RndResizeCallback = (_e, _dir, ref, _delta, pos) => {
    layout.remember(
      id,
      clamp({ x: pos.x, y: pos.y, w: ref.offsetWidth, h: ref.offsetHeight }, area, min),
    );
  };

  return (
    <Rnd
      key={`${id}:${layout.version}:${area.w}x${area.h}`}
      default={{ x: rect.x, y: rect.y, width: rect.w, height: rect.h }}
      minWidth={minWidth}
      minHeight={minHeight}
      bounds="parent"
      dragHandleClassName={`vec-handle-${id}`}
      onDragStop={onDragStop}
      onResizeStop={onResizeStop}
      onMouseDown={() => setZ(++zTop)}
      style={{ zIndex: z }}
      className="vec-tile pointer-events-auto"
    >
      <div className={`vec-tile-handle vec-handle-${id}`} title="Drag to move panel">
        <span className="t">
          <span>{title}</span>
          {count && <span className="cnt">{count}</span>}
          {flag && <span className="flag">{flag}</span>}
        </span>
        {headerExtra}
        {onPopOut && (
          <button type="button" onClick={onPopOut} title="Pop out into its own window" aria-label={`Pop out ${title}`}>
            ↗
          </button>
        )}
        {onClose && (
          <button type="button" onClick={onClose} title="Close panel" aria-label={`Close ${title}`}>
            ×
          </button>
        )}
      </div>
      <div className="vec-tile-body">{children}</div>
    </Rnd>
  );
}
