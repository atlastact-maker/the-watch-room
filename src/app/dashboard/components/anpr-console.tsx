"use client";

// The ANPR console.
//
// Not a list of reads. Reads go past in their thousands and nobody looks
// at them — what reaches a controller is a hit, and the counter underneath
// is what makes a hit feel like one. Eighteen thousand plates an hour, and
// these six are why you are here.
//
// A hit is a thing to be acted on, so each one carries the two actions a
// controller actually has: send it to the terminal for the full return, or
// mark it dealt with. An unactioned hit stays lit.

import { Rnd } from "react-rnd";
import { useEffect, useMemo, useState } from "react";
import { CAD_VARS } from "./cad-theme";
import { ANPR_SITES, hitTone, hitsBetween, readCount, siteById, type AnprHit } from "@/lib/sim/anpr";

type Frame = { x: number; y: number; width: number; height: number };
const FRAME_KEY = "twr:anpr-frame:v1";
const MIN_W = 360;
const MIN_H = 260;

function loadFrame(): Frame | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FRAME_KEY);
    if (!raw) return null;
    const f = JSON.parse(raw) as Frame;
    if (typeof f.x !== "number" || typeof f.y !== "number") return null;
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
  try {
    window.localStorage.setItem(FRAME_KEY, JSON.stringify(f));
  } catch {
    /* best effort */
  }
}

const MONO = "font-mono text-[11px] leading-[1.45] tracking-tight";
const hhmmss = (ms: number) => {
  const d = new Date(ms);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
};

export function AnprConsole({
  shiftStartedAt,
  now,
  actioned,
  onAction,
  onEnquire,
  onLocate,
  onClose,
}: {
  /** The feed runs from the start of the shift, so the console is not
   *  empty the moment it is opened. */
  shiftStartedAt: number;
  now: number;
  /** Hit ids the operator has dealt with. */
  actioned: Record<string, boolean>;
  onAction: (hitId: string) => void;
  /** Send the plate to the LEDS terminal for the full return. */
  onEnquire?: (vrm: string) => void;
  /** Put the map on the camera site. */
  onLocate?: (coords: { lat: number; lng: number }) => void;
  onClose?: () => void;
}) {
  const [frame] = useState<Frame>(() => {
    const saved = loadFrame();
    if (saved) return saved;
    const w = typeof window !== "undefined" ? window.innerWidth : 1400;
    return { width: 420, height: 360, x: Math.max(12, w - 860), y: 90 };
  });
  const [onlyOpen, setOnlyOpen] = useState(false);

  // Recompute on the minute rather than every tick — the feed only
  // changes when a minute rolls over, and rebuilding an hour of hits at
  // 1 Hz would be wasted work.
  const minute = Math.floor(now / 60_000);
  const hits = useMemo(
    () => hitsBetween(shiftStartedAt, minute * 60_000 + 60_000),
    [shiftStartedAt, minute],
  );
  const reads = readCount(shiftStartedAt, now);

  const open = hits.filter((h) => !actioned[h.id]);
  const shown = onlyOpen ? open : hits;

  // A new hit while the console is closed should still be countable when
  // it opens, so nothing is announced here — the tool menu carries it.
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    const newest = hits[0];
    if (!newest || actioned[newest.id]) return;
    setFlash(newest.id);
    const t = setTimeout(() => setFlash(null), 6000);
    return () => clearTimeout(t);
  }, [hits, actioned]);

  return (
    <Rnd
      default={frame}
      minWidth={MIN_W}
      minHeight={MIN_H}
      bounds="parent"
      dragHandleClassName="anpr-drag"
      onDragStop={(_e, d) => saveFrame({ ...frame, x: d.x, y: d.y })}
      onResizeStop={(_e, _dir, ref, _delta, pos) =>
        saveFrame({ x: pos.x, y: pos.y, width: ref.offsetWidth, height: ref.offsetHeight })
      }
      style={{ ...CAD_VARS, zIndex: 1200 }}
      className="pointer-events-auto"
    >
      <div className="flex h-full w-full flex-col border border-(--color-border) bg-(--color-bg) text-(--color-text) shadow-2xl">
        <div className="anpr-drag flex cursor-move items-center justify-between gap-2 border-b border-(--color-border) px-2 py-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-(--color-text-dim)">
            ANPR · {ANPR_SITES.length} SITES
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:text-(--color-text)"
            >
              Close
            </button>
          )}
        </div>

        {/* The counter. The whole reason a hit reads as a hit. */}
        <div className="flex items-baseline justify-between gap-2 border-b border-(--color-border-subtle) px-2 py-1">
          <span className={MONO + " text-(--color-text-dim)"}>
            {reads.toLocaleString()} READS THIS SHIFT
          </span>
          <button
            type="button"
            onClick={() => setOnlyOpen((v) => !v)}
            className={
              MONO +
              " uppercase " +
              (open.length > 0 ? "font-bold text-(--color-critical)" : "text-(--color-text-dim)")
            }
          >
            {open.length} OPEN {onlyOpen ? "· ONLY" : ""}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {shown.length === 0 ? (
            <p className={MONO + " px-2 py-3 text-(--color-text-dim)"}>
              {onlyOpen ? "NOTHING OUTSTANDING." : "NO HITS THIS SHIFT."}
            </p>
          ) : (
            <ul>
              {shown.map((h) => (
                <Hit
                  key={h.id}
                  h={h}
                  done={!!actioned[h.id]}
                  flashing={flash === h.id && !actioned[h.id]}
                  onAction={() => onAction(h.id)}
                  onEnquire={onEnquire ? () => onEnquire(h.vrm) : undefined}
                  onLocate={onLocate}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </Rnd>
  );
}

function Hit({
  h,
  done,
  flashing,
  onAction,
  onEnquire,
  onLocate,
}: {
  h: AnprHit;
  done: boolean;
  flashing: boolean;
  onAction: () => void;
  onEnquire?: () => void;
  onLocate?: (coords: { lat: number; lng: number }) => void;
}) {
  const site = siteById(h.siteId);
  const tone = hitTone(h);
  return (
    <li
      className={
        "border-b border-(--color-border-subtle)/60 px-2 py-1 " +
        (done ? "opacity-45" : tone === "critical" ? "bg-(--color-critical)/8" : "")
      }
      style={flashing ? { animation: "call-flash 1s ease-in-out 4" } : undefined}
    >
      <div className={MONO + " flex items-baseline gap-2"}>
        <span className="shrink-0 text-(--color-text-dim)">{hhmmss(h.atMs)}</span>
        <span className="shrink-0 font-bold text-(--color-text)">{h.vrm}</span>
        <span className="shrink-0 text-(--color-text-dim)">{h.direction}</span>
        <span
          className={
            "ml-auto shrink-0 px-1 font-bold uppercase " +
            (tone === "critical"
              ? "bg-(--color-critical) text-white"
              : "bg-(--color-amber) text-white")
          }
        >
          {h.markers.join(" / ")}
        </span>
      </div>
      <div className={MONO + " mt-0.5 flex items-baseline gap-2 text-(--color-text-muted)"}>
        <span className="min-w-0 truncate">
          {[h.colour, h.make, h.model].filter(Boolean).join(" ")?.toUpperCase()}
        </span>
        <span className="ml-auto min-w-0 shrink-0 truncate text-(--color-text-dim)">
          {site?.name.toUpperCase()}
        </span>
      </div>
      {!done && (
        <div className="mt-1 flex gap-1">
          {onEnquire && (
            <button
              type="button"
              onClick={onEnquire}
              className={
                MONO +
                " rounded-none border border-(--color-border) px-1.5 py-[1px] uppercase text-(--color-text) hover:bg-(--color-surface-raised)"
              }
            >
              Enquire
            </button>
          )}
          {site && onLocate && (
            <button
              type="button"
              onClick={() => onLocate(site.coords)}
              className={
                MONO +
                " rounded-none border border-(--color-border) px-1.5 py-[1px] uppercase text-(--color-text) hover:bg-(--color-surface-raised)"
              }
            >
              Site
            </button>
          )}
          <button
            type="button"
            onClick={onAction}
            className={
              MONO +
              " ml-auto rounded-none border border-(--color-text) bg-(--color-text) px-1.5 py-[1px] uppercase text-(--color-bg) hover:bg-(--color-text-dim)"
            }
          >
            Dealt with
          </button>
        </div>
      )}
    </li>
  );
}
