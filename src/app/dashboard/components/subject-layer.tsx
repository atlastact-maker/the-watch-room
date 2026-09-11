"use client";

// The subject vehicle on the desk map: an amber car with its plate while
// the track is live, a grey ghost at the last read when it is not, the
// breadcrumb of camera reads behind it, and the units holding a point
// on the patch waiting for it.

import L from "leaflet";
import { CircleMarker, Marker, Polyline, Tooltip } from "react-leaflet";

export type SubjectView = {
  id: string;
  vrm: string;
  description: string;
  markers: string[];
  state: "moving" | "pursuit" | "stopped" | "contained" | "gone";
  trackLive: boolean;
  pos: { lat: number; lng: number } | null;
  heading: number;
  lastSeenPos: { lat: number; lng: number } | null;
  lastSeenAt: number | null;
  pings: { at: number; pos: { lat: number; lng: number }; label: string }[];
  heldBy: string[];
  /** The road ahead, drawn only while the track is live. */
  routeAhead: [number, number][];
};

export type HoldingUnit = { applianceId: string; callsign: string; coords: { lat: number; lng: number }; label: string; arrived: boolean };

function carIcon(v: SubjectView): L.DivIcon {
  const body = v.state === "stopped" || v.state === "contained" ? "#16a34a" : v.state === "pursuit" ? "#dc2626" : "#f59e0b";
  const ring = v.state === "pursuit" ? "#dc2626" : "#f59e0b";
  return L.divIcon({
    className: "",
    iconSize: [60, 60],
    iconAnchor: [30, 30],
    html: `
      <div style="position:relative;width:60px;height:60px;pointer-events:none;font-family:var(--vec-mono,monospace);">
        <div style="position:absolute;left:30px;top:30px;width:36px;height:36px;transform:translate(-50%,-50%);border-radius:50%;border:2px solid ${ring};animation:vec-amber-pulse 1.4s ease-out infinite;"></div>
        <svg viewBox="0 0 24 44" width="14" height="26" style="position:absolute;left:30px;top:30px;transform:translate(-50%,-50%) rotate(${v.heading}deg);filter:drop-shadow(0 1px 2px rgba(0,0,0,0.7));">
          <rect x="3" y="2" width="18" height="40" rx="5" fill="${body}" stroke="#111" stroke-width="1.4"/>
          <rect x="5" y="10" width="14" height="8" rx="1.5" fill="#1f2937" opacity="0.8"/>
          <rect x="5" y="28" width="14" height="6" rx="1.5" fill="#1f2937" opacity="0.6"/>
        </svg>
        <div style="position:absolute;left:30px;top:50px;transform:translateX(-50%);background:#f5c400;color:#111;border:1.5px solid #111;border-radius:2px;padding:0 5px;font-size:9px;font-weight:700;letter-spacing:0.08em;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.5);">${v.vrm}${v.state === "pursuit" ? " · PURSUIT" : v.state === "stopped" ? " · STOPPED" : v.state === "contained" ? " · CONTAINED" : ""}</div>
      </div>`,
  });
}

function ghostIcon(v: SubjectView, ago: string): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [60, 44],
    iconAnchor: [30, 14],
    html: `
      <div style="position:relative;width:60px;height:44px;pointer-events:none;font-family:var(--vec-mono,monospace);">
        <div style="position:absolute;left:30px;top:14px;width:22px;height:22px;transform:translate(-50%,-50%);border-radius:50%;border:2px dashed #f59e0b;opacity:0.8;"></div>
        <div style="position:absolute;left:30px;top:30px;transform:translateX(-50%);background:rgba(10,10,12,0.9);color:#fbbf24;border:1px solid #f59e0b;border-radius:2px;padding:0 5px;font-size:9px;font-weight:700;letter-spacing:0.06em;white-space:nowrap;">${v.vrm} · ${v.state === "gone" ? "GONE" : "LAST SEEN"} ${ago}</div>
      </div>`,
  });
}

function holdIcon(u: HoldingUnit): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [80, 30],
    iconAnchor: [8, 8],
    html: `
      <div style="position:relative;font-family:var(--vec-mono,monospace);pointer-events:none;">
        <div style="position:absolute;left:0;top:0;width:16px;height:16px;border-radius:50%;background:${u.arrived ? "#1d4ed8" : "transparent"};border:2px solid #1d4ed8;box-shadow:0 0 0 2px rgba(255,255,255,0.7);"></div>
        <div style="position:absolute;left:20px;top:0;background:#1d4ed8;color:#fff;border-radius:2px;padding:1px 5px;font-size:9px;font-weight:700;letter-spacing:0.06em;white-space:nowrap;">${u.callsign} · ${u.arrived ? "HOLDING" : "TO"} ${u.label.toUpperCase()}</div>
      </div>`,
  });
}

function ago(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function SubjectLayer({ subjects, holding, now }: { subjects: SubjectView[]; holding: HoldingUnit[]; now: number }) {
  return (
    <>
      {holding.map((u) => (
        <Marker key={`hold-${u.applianceId}`} position={[u.coords.lat, u.coords.lng]} icon={holdIcon(u)} interactive={false} zIndexOffset={600} />
      ))}
      {subjects.map((v) => (
        <div key={v.id}>
          {v.pings.length > 1 && (
            <Polyline positions={v.pings.map((p) => [p.pos.lat, p.pos.lng] as [number, number])} pathOptions={{ color: "#f59e0b", weight: 2, opacity: 0.55, dashArray: "4 6" }} interactive={false} />
          )}
          {v.pings.map((p, i) => (
            <CircleMarker key={`${v.id}-ping-${i}`} center={[p.pos.lat, p.pos.lng]} radius={5} pathOptions={{ color: "#111", weight: 1, fillColor: "#f59e0b", fillOpacity: 0.95 }} interactive>
              <Tooltip direction="top" offset={[0, -6]}>{p.label} · {new Date(p.at).toLocaleTimeString("en-GB", { hour12: false })}</Tooltip>
            </CircleMarker>
          ))}
          {v.trackLive && v.pos && v.routeAhead.length > 1 && (
            <Polyline positions={v.routeAhead} pathOptions={{ color: v.state === "pursuit" ? "#dc2626" : "#f59e0b", weight: 3, opacity: 0.35 }} interactive={false} />
          )}
          {(v.trackLive || v.state === "stopped" || v.state === "contained") && v.pos ? (
            <Marker position={[v.pos.lat, v.pos.lng]} icon={carIcon(v)} interactive={false} zIndexOffset={950} />
          ) : v.lastSeenPos ? (
            <Marker position={[v.lastSeenPos.lat, v.lastSeenPos.lng]} icon={ghostIcon(v, v.lastSeenAt ? ago(now - v.lastSeenAt) : "")} interactive={false} zIndexOffset={940} />
          ) : null}
        </div>
      ))}
    </>
  );
}
