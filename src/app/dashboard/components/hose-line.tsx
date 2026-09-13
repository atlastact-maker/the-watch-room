"use client";

// HOSE ON THE GROUND. A run of hose is laid out at a crew's pace from
// its source to where it is wanted, a coupling every twenty-five metres
// because that is how long a length is, a standpipe at the hydrant, and
// once the pump is running the water shows moving through it. A jet ends
// at the branch with the spray on the fire. The desk's clock ticks once
// a second; the laying runs between ticks on the frame clock so the hose
// unrolls rather than jumps.

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { CircleMarker, Marker, Polyline } from "react-leaflet";
import { haversineMeters } from "@/lib/sim/eta";
import type { HoseType } from "@/lib/sim/incident_types";

export type HoseKind = "supply" | "relay" | "jet";

export type HoseLineProps = {
  /** Source to destination — the hydrant to the pump, the feeding pump to
   *  the fed one, the pump to the branch. */
  path: [number, number][];
  hoseType: HoseType;
  kind: HoseKind;
  /** When the crew started running it out, and how long the run takes. */
  layStartedAt: number;
  laySeconds: number;
  /** Water in it — the pump feeding it is running. */
  charged: boolean;
  /** The desk clock, once a second. */
  now: number;
};

const LENGTH_M = 25;

const CORE: Record<HoseType, { colour: string; weight: number }> = {
  "45mm": { colour: "#f2b705", weight: 3.5 },
  "70mm": { colour: "#d62828", weight: 4.5 },
  LDH_150mm: { colour: "#2f9bd6", weight: 6 },
};

/** Cumulative distance along the path, in metres. */
function cumulative(path: [number, number][]): number[] {
  const out = [0];
  for (let i = 1; i < path.length; i++) {
    out.push(out[i - 1] + haversineMeters({ lat: path[i - 1][0], lng: path[i - 1][1] }, { lat: path[i][0], lng: path[i][1] }));
  }
  return out;
}

/** The point `d` metres along the path. */
function pointAt(path: [number, number][], cum: number[], d: number): [number, number] {
  if (d <= 0) return path[0];
  const total = cum[cum.length - 1];
  if (d >= total) return path[path.length - 1];
  let i = 1;
  while (i < cum.length && cum[i] < d) i++;
  const a = path[i - 1];
  const b = path[i];
  const span = cum[i] - cum[i - 1] || 1;
  const t = (d - cum[i - 1]) / span;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function bearingDeg(a: [number, number], b: [number, number]): number {
  const dLng = (b[1] - a[1]) * Math.cos((a[0] * Math.PI) / 180);
  const dLat = b[0] - a[0];
  return ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;
}

function standpipeIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    html: `<div style="position:relative;width:14px;height:14px;pointer-events:none;">
      <div style="position:absolute;left:5px;top:0;width:4px;height:14px;background:#9ca3af;border:1px solid #111827;border-radius:1px;"></div>
      <div style="position:absolute;left:0;top:4px;width:14px;height:4px;background:#9ca3af;border:1px solid #111827;border-radius:1px;"></div>
      <div style="position:absolute;left:4px;top:3px;width:6px;height:6px;background:#d62828;border:1px solid #111827;border-radius:50%;"></div>
    </div>`,
  });
}

function branchIcon(bearing: number, charged: boolean, colour: string): L.DivIcon {
  // The branch points the way the hose runs; the spray fans out ahead of it.
  const spray = charged
    ? `<div class="gsm-spray" style="position:absolute;left:14px;top:-16px;width:44px;height:44px;transform-origin:0 50%;clip-path:polygon(0 50%,100% 0,100% 100%);background:radial-gradient(ellipse at left,rgba(224,242,254,0.95),rgba(147,197,253,0.55) 45%,rgba(147,197,253,0));"></div>`
    : "";
  return L.divIcon({
    className: "",
    iconSize: [60, 12],
    iconAnchor: [6, 6],
    html: `<div style="position:relative;width:60px;height:12px;pointer-events:none;transform:rotate(${bearing - 90}deg);transform-origin:6px 6px;">
      ${spray}
      <div style="position:absolute;left:0;top:3px;width:14px;height:6px;background:${colour};border:1px solid #111827;border-radius:2px;"></div>
      <div style="position:absolute;left:12px;top:1px;width:5px;height:10px;background:#374151;border:1px solid #111827;border-radius:1px;"></div>
    </div>`,
  });
}

export function HoseLine({ path, hoseType, kind, layStartedAt, laySeconds, charged, now }: HoseLineProps) {
  const cum = useMemo(() => cumulative(path), [path]);
  const total = cum[cum.length - 1];
  const layMs = Math.max(1, laySeconds) * 1000;
  const [frac, setFrac] = useState(() => Math.max(0, Math.min(1, (now - layStartedAt) / layMs)));

  // Unroll it between the desk's ticks. Nothing to do once it is out.
  useEffect(() => {
    if (frac >= 1) return;
    let raf = 0;
    const tick = () => {
      const f = Math.max(0, Math.min(1, (Date.now() - layStartedAt) / layMs));
      setFrac(f);
      if (f < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [frac, layStartedAt, layMs]);

  const laidM = total * frac;
  const laid = useMemo<[number, number][]>(() => {
    if (path.length < 2) return path;
    const pts: [number, number][] = [path[0]];
    for (let i = 1; i < path.length; i++) {
      if (cum[i] <= laidM) pts.push(path[i]);
      else {
        pts.push(pointAt(path, cum, laidM));
        break;
      }
    }
    return pts;
  }, [path, cum, laidM]);

  const couplings = useMemo(() => {
    const out: [number, number][] = [];
    for (let d = LENGTH_M; d < laidM; d += LENGTH_M) out.push(pointAt(path, cum, d));
    return out;
  }, [path, cum, laidM]);

  const core = CORE[hoseType];
  const end = laid[laid.length - 1];
  const endBearing = laid.length >= 2 ? Math.round(bearingDeg(laid[laid.length - 2], end) / 5) * 5 : 0;
  const standpipe = useMemo(() => standpipeIcon(), []);
  const branch = useMemo(() => branchIcon(endBearing, charged && frac >= 1, core.colour), [endBearing, charged, frac, core.colour]);

  if (laid.length < 2) return null;
  return (
    <>
      <Polyline positions={laid} pathOptions={{ color: "#0b0f14", weight: core.weight + 3, opacity: 0.55, lineCap: "round", lineJoin: "round" }} interactive={false} />
      <Polyline positions={laid} pathOptions={{ color: core.colour, weight: core.weight, opacity: 1, lineCap: "round", lineJoin: "round" }} interactive={false} />
      {charged && frac >= 1 && (
        <Polyline positions={laid} pathOptions={{ color: "#dbeafe", weight: Math.max(1.5, core.weight - 2), opacity: 0.9, dashArray: "6 16", lineCap: "round", className: "gsm-hose-flow" }} interactive={false} />
      )}
      {couplings.map((c, i) => (
        <CircleMarker key={i} center={c} radius={3} pathOptions={{ color: "#111827", weight: 1.5, fillColor: "#9ca3af", fillOpacity: 1 }} interactive={false} />
      ))}
      {frac < 1 && <CircleMarker center={end} radius={4} pathOptions={{ color: "#111827", weight: 1.5, fillColor: "#e5e7eb", fillOpacity: 1 }} interactive={false} />}
      {kind === "supply" && frac > 0.02 && <Marker position={path[0]} icon={standpipe} interactive={false} zIndexOffset={650} />}
      {kind === "jet" && frac >= 1 && <Marker position={end} icon={branch} interactive={false} zIndexOffset={660} />}
    </>
  );
}
