"use client";

// Crew on foot. While a task runs, the people assigned to it are out of
// the vehicle: walking from the cab to wherever the work is, working there
// for the task's life, and walking back when it ends. Each figure is a
// small disc in its service colour with the rider's role and name, so an
// operator can see at a glance who is on the branch, who is at the
// hydrant, who is inside in BA, and who is still sat in the cab.
//
// The layer self-ticks at 4 Hz so the walk is smooth while the rest of
// the map stays on its 1 Hz clock. Positions are derived, not stored:
// the figure's whereabouts at any moment follow from the task's start,
// its end, and the walk between the vehicle and the work.

import { useEffect, useState } from "react";
import L from "leaflet";
import { Marker } from "react-leaflet";
import type { ServiceCode } from "@/lib/sim/types";

export type LatLng = { lat: number; lng: number };

export type CrewFigure = {
  /** Stable per rider per task, so the DOM node survives re-renders. */
  id: string;
  name: string;
  role: string;
  service: ServiceCode;
  /** Where the walk starts: the vehicle's parking position. */
  from: LatLng;
  /** Where the work is. */
  to: LatLng;
  /** Optional path to walk instead of a straight line, [lat, lng] pairs
   *  from `from` to `to` — a hose run, for instance. */
  path?: [number, number][];
  /** When the rider stepped out. */
  startAt: number;
  /** When the task ended, if it has; the rider walks back from then. */
  endAt?: number;
  /** Shown beside the figure while at the work: "BA", "BRANCH", "IC". */
  badge?: string;
  /** The work is inside the building — the figure fades at the entry. */
  inside?: boolean;
  /** Small offset at the work position so several riders do not stack. */
  spreadIndex?: number;
};

const WALK_MPS = 1.3;

const SERVICE_COLOUR: Record<ServiceCode, { fill: string; text: string }> = {
  Fire: { fill: "#d7263d", text: "#ffb3bd" },
  Ambulance: { fill: "#1f9d55", text: "#a8f0c4" },
  Police: { fill: "#2563eb", text: "#bfdbfe" },
};

/** "Firefighter" → FF, "Crew Manager" → CM, "Paramedic" → PM … */
export function roleShort(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("watch manager")) return "WM";
  if (r.includes("crew manager")) return "CM";
  if (r.includes("station manager")) return "SM";
  if (r.includes("firefighter")) return "FF";
  if (r.includes("advanced paramedic") || r.includes("specialist paramedic")) return "AP";
  if (r.includes("critical care")) return "CCP";
  if (r.includes("paramedic")) return "PM";
  if (r.includes("technician") || r === "emt") return "T";
  if (r.includes("doctor")) return "DR";
  if (r.includes("pilot")) return "PLT";
  if (r.includes("sergeant")) return "PS";
  if (r.includes("inspector")) return "INSP";
  if (r.includes("constable") || r === "pc" || r.includes("officer")) return "PC";
  if (r.includes("pcso")) return "PCSO";
  const words = role.split(/\s+/).filter(Boolean);
  return (words.length >= 2 ? words[0][0] + words[1][0] : role.slice(0, 2)).toUpperCase();
}

function haversine(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function pathMetres(path: [number, number][]): number {
  let m = 0;
  for (let i = 1; i < path.length; i++) m += haversine({ lat: path[i - 1][0], lng: path[i - 1][1] }, { lat: path[i][0], lng: path[i][1] });
  return m;
}

/** A point `k` (0..1) of the way along a path. */
function alongPath(path: [number, number][], k: number): LatLng {
  if (path.length < 2) return { lat: path[0]?.[0] ?? 0, lng: path[0]?.[1] ?? 0 };
  const total = pathMetres(path);
  let want = Math.max(0, Math.min(1, k)) * total;
  for (let i = 1; i < path.length; i++) {
    const a = { lat: path[i - 1][0], lng: path[i - 1][1] };
    const b = { lat: path[i][0], lng: path[i][1] };
    const seg = haversine(a, b);
    if (want <= seg || i === path.length - 1) {
      const f = seg > 0 ? Math.min(1, want / seg) : 1;
      return { lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f };
    }
    want -= seg;
  }
  return { lat: path[path.length - 1][0], lng: path[path.length - 1][1] };
}

function offsetMetres(p: LatLng, dxM: number, dyM: number): LatLng {
  return { lat: p.lat + dyM / 111000, lng: p.lng + dxM / (111000 * Math.cos((p.lat * Math.PI) / 180)) };
}

/** Where a figure stands at `now`, or null once it is back in the cab. */
export function figurePosition(f: CrewFigure, now: number): { pos: LatLng; phase: "out" | "working" | "back" } | null {
  const walkable = f.path && f.path.length >= 2 ? f.path : null;
  const metres = walkable ? pathMetres(walkable) : haversine(f.from, f.to);
  const walkMs = Math.max(3000, (metres / WALK_MPS) * 1000);
  const at = (k: number): LatLng => (walkable ? alongPath(walkable, k) : { lat: f.from.lat + (f.to.lat - f.from.lat) * k, lng: f.from.lng + (f.to.lng - f.from.lng) * k });
  const spread = f.spreadIndex ?? 0;
  const ring = [
    [0, 0], [1.4, 0.6], [-1.4, 0.6], [0.7, -1.4], [-0.7, -1.4], [2.2, -0.4], [-2.2, -0.4], [0, 2],
  ][spread % 8];
  const work = offsetMetres(f.to, ring[0], ring[1]);
  if (now < f.startAt) return null;
  if (f.endAt !== undefined && now >= f.endAt) {
    // Walking back from wherever the rider was when the task ended.
    const reachedBy = f.startAt + walkMs;
    const fromK = f.endAt >= reachedBy ? 1 : (f.endAt - f.startAt) / walkMs;
    const backMs = walkMs * fromK;
    const k = backMs > 0 ? (now - f.endAt) / backMs : 1;
    if (k >= 1) return null;
    return { pos: at(fromK * (1 - k)), phase: "back" };
  }
  const k = (now - f.startAt) / walkMs;
  if (k < 1) return { pos: at(k), phase: "out" };
  return { pos: work, phase: "working" };
}

const ICONS = new Map<string, L.DivIcon>();
function figureIcon(service: ServiceCode, initials: string, label: string, badge: string | undefined, inside: boolean, showLabel: boolean): L.DivIcon {
  const key = `${service}|${initials}|${label}|${badge ?? ""}|${inside ? 1 : 0}|${showLabel ? 1 : 0}`;
  const hit = ICONS.get(key);
  if (hit) return hit;
  const c = SERVICE_COLOUR[service];
  const icon = L.divIcon({
    className: "",
    iconSize: [140, 30],
    iconAnchor: [70, 7],
    html: `
      <div style="position:relative;width:140px;height:30px;pointer-events:none;opacity:${inside ? 0.55 : 1};">
        <div style="position:absolute;left:70px;top:7px;transform:translate(-50%,-50%);width:10px;height:10px;border-radius:50%;background:${c.fill};border:2px solid #0a0a0c;box-shadow:0 0 0 1.5px rgba(255,255,255,0.9);"></div>
        ${showLabel ? `<div style="position:absolute;left:78px;top:0;padding:1px 4px;background:rgba(10,10,12,0.9);border:1px solid ${c.fill};border-radius:2px;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:8px;line-height:1.35;letter-spacing:0.06em;color:${c.text};white-space:nowrap;"><b style="color:#fff">${initials}</b> ${label}${badge ? ` · <b style="color:#fff">${badge}</b>` : ""}</div>` : ""}
      </div>`,
  });
  ICONS.set(key, icon);
  return icon;
}

export function CrewFigureLayer({ figures, showLabels }: { figures: CrewFigure[]; showLabels: boolean }) {
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    if (figures.length === 0) return;
    const id = setInterval(() => setTick(Date.now()), 250);
    return () => clearInterval(id);
  }, [figures.length]);
  return (
    <>
      {figures.map((f) => {
        const p = figurePosition(f, tick);
        if (!p) return null;
        const surname = f.name.split(/\s+/).pop() ?? f.name;
        const inside = !!f.inside && p.phase === "working";
        return (
          <Marker
            key={f.id}
            position={[p.pos.lat, p.pos.lng]}
            icon={figureIcon(f.service, roleShort(f.role), surname, p.phase === "working" ? f.badge : p.phase === "back" ? "RTN" : undefined, inside, showLabels)}
            interactive={false}
            zIndexOffset={650}
          />
        );
      })}
    </>
  );
}
