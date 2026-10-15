"use client";

// THE FLOOR PLAN. The building's rooms, floor by floor, coloured by what
// the fire engine says is in them: alight, fully involved, burning out,
// knocked down, smoke-logged or clear, with the doors and windows as they
// stand (shut, open, gone, a fan in them), the stairs, the water going
// into each room, the casualties the crews have found and the clocks
// that matter — a room on its way to flashover, a door about to give.
// Everything on it is read off the fire state; nothing here is decorative.

import type { Compartment, Opening, SceneCasualty } from "@/lib/sim/scene";
import type { CompartmentPhase, CompartmentState, FireState, OpeningState } from "@/lib/sim/fire_dynamics";
import { FLASHOVER_WARN_SEC } from "@/lib/sim/fire_dynamics";
import type { CasualtyProgression } from "@/lib/sim/incident_sim";

export type FloorPlanProps = {
  fire: FireState;
  /** The casualties to mark: the ones the crews have found. */
  casualties?: SceneCasualty[];
  progression?: Record<string, CasualtyProgression>;
  /** Smaller: no words in the rooms, no legend. */
  compact?: boolean;
  /** A room picked as a target, and the pick. */
  selectedRoomId?: string | null;
  onPickRoom?: (id: string) => void;
};

const GAP = 1.6;
const TITLE_H = 0.9;
const EXPOSURE_BAND = 1.5;

const PHASE_FILL: Record<CompartmentPhase, string> = {
  clear: "#1c2d3d",
  smoke: "#1c2d3d",
  growing: "#b5521c",
  starved: "#7d3914",
  developed: "#e84a1e",
  decaying: "#8b2f12",
  burnt_out: "#2a2325",
  knocked: "#2b4a5f",
};

const PHASE_WORD: Record<CompartmentPhase, string> = {
  clear: "clear",
  smoke: "smoke",
  growing: "alight",
  starved: "shut up, hot",
  developed: "fully involved",
  decaying: "burning out",
  burnt_out: "burnt out",
  knocked: "knocked down",
};

const SEVERITY_FILL: Record<CasualtyProgression["severity"], string> = {
  minor: "#3ddc84",
  serious: "#ffb020",
  critical: "#ff5a3c",
  expectant: "#9ca3af",
};

type Box = { x: number; y: number; w: number; h: number };

function bboxOf(rooms: Compartment[]): Box {
  const x0 = Math.min(...rooms.map((c) => c.shape.x));
  const y0 = Math.min(...rooms.map((c) => c.shape.y));
  const x1 = Math.max(...rooms.map((c) => c.shape.x + c.shape.w));
  const y1 = Math.max(...rooms.map((c) => c.shape.y + c.shape.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** The exposure drawn as a band along the side of the building it touches. */
function exposureBand(c: Compartment, house: Box): Box {
  const s = c.shape;
  const eps = 0.3;
  if (s.x >= house.x + house.w - eps) return { x: house.x + house.w, y: Math.max(house.y, s.y), w: EXPOSURE_BAND, h: Math.min(house.y + house.h, s.y + s.h) - Math.max(house.y, s.y) };
  if (s.x + s.w <= house.x + eps) return { x: house.x - EXPOSURE_BAND, y: Math.max(house.y, s.y), w: EXPOSURE_BAND, h: Math.min(house.y + house.h, s.y + s.h) - Math.max(house.y, s.y) };
  if (s.y >= house.y + house.h - eps) return { x: Math.max(house.x, s.x), y: house.y + house.h, w: Math.min(house.x + house.w, s.x + s.w) - Math.max(house.x, s.x), h: EXPOSURE_BAND };
  return { x: Math.max(house.x, s.x), y: house.y - EXPOSURE_BAND, w: Math.min(house.x + house.w, s.x + s.w) - Math.max(house.x, s.x), h: EXPOSURE_BAND };
}

function floorTitle(floor: number, rooms: Compartment[]): string {
  if (rooms.length && rooms.every((c) => c.fuel === "void")) return "Roof void";
  if (rooms.some((c) => c.fuel === "void")) return floor === 0 ? "Ground floor" : "Loft";
  return floor === 0 ? "Ground floor" : floor === 1 ? "First floor" : floor === 2 ? "Second floor" : `Floor ${floor}`;
}

/** Whether an opening at a point sits on a vertical wall of its room. */
function vertical(o: Opening, rooms: Map<string, Compartment>): boolean {
  if (!o.at) return false;
  if (o.face) return o.face === "E" || o.face === "W";
  for (const id of o.between) {
    const c = rooms.get(id);
    if (!c) continue;
    if (Math.abs(o.at.x - c.shape.x) < 0.2 || Math.abs(o.at.x - (c.shape.x + c.shape.w)) < 0.2) return true;
    if (Math.abs(o.at.y - c.shape.y) < 0.2 || Math.abs(o.at.y - (c.shape.y + c.shape.h)) < 0.2) return false;
  }
  return false;
}

/** The side of the room the outside is on, as a unit step outwards. */
function outward(o: Opening, rooms: Map<string, Compartment>): { dx: number; dy: number } {
  if (o.face === "N") return { dx: 0, dy: -1 };
  if (o.face === "S") return { dx: 0, dy: 1 };
  if (o.face === "E") return { dx: 1, dy: 0 };
  if (o.face === "W") return { dx: -1, dy: 0 };
  const c = rooms.get(o.between[0] === "outside" ? o.between[1] : o.between[0]);
  if (!c || !o.at) return { dx: 0, dy: 1 };
  const cx = c.shape.x + c.shape.w / 2;
  const cy = c.shape.y + c.shape.h / 2;
  return Math.abs(o.at.x - cx) > Math.abs(o.at.y - cy) ? { dx: Math.sign(o.at.x - cx) || 1, dy: 0 } : { dx: 0, dy: Math.sign(o.at.y - cy) || 1 };
}

/** A room's label over one or two lines, so it fits the room's width. */
function labelLines(label: string, widthM: number): string[] {
  const fits = (s: string) => s.length * 0.24 <= widthM - 0.4;
  if (fits(label)) return [label];
  const i = label.lastIndexOf(" ", Math.floor(label.length / 2) + 3);
  if (i <= 0) return [label];
  return [label.slice(0, i), label.slice(i + 1)];
}

function mmss(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.max(0, Math.round(sec - m * 60));
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s} s`;
}

export function FloorPlan({ fire, casualties, progression, compact, selectedRoomId, onPickRoom }: FloorPlanProps) {
  const plan = fire.plan;
  const byId = new Map(plan.compartments.map((c) => [c.id, c] as const));
  const stateOf = new Map(fire.compartments.map((s) => [s.id, s] as const));
  const openingState = new Map(fire.openings.map((o) => [o.id, o] as const));

  // Floors, each laid out in its own cell; two cells to a row.
  const floorNos = [...new Set(plan.compartments.filter((c) => !c.exposure).map((c) => c.floor))].sort((a, b) => a - b);
  const floors = floorNos.map((floor) => {
    const rooms = plan.compartments.filter((c) => c.floor === floor && !c.exposure).sort((a, b) => b.shape.w * b.shape.h - a.shape.w * a.shape.h);
    const house = bboxOf(rooms);
    const exposures = plan.compartments.filter((c) => c.exposure && c.floor === floor).map((c) => ({ c, band: exposureBand(c, house) }));
    const all = bboxOf([...rooms, ...exposures.map((e) => ({ ...e.c, shape: e.band }))]);
    return { floor, rooms, house, exposures, box: all, title: floorTitle(floor, rooms) };
  });
  const cellW = Math.max(...floors.map((f) => f.box.w)) + 0.6;
  const cellH = Math.max(...floors.map((f) => f.box.h)) + TITLE_H + 0.5;
  const cols = floors.length <= 1 ? 1 : 2;
  const rows = Math.ceil(floors.length / cols);
  const totalW = cols * cellW + (cols - 1) * GAP + 0.6;
  const totalH = rows * cellH + (rows - 1) * GAP * 0.6 + 0.4;

  const roomLabel = (c: Compartment, s: CompartmentState | undefined) => {
    if (!s) return "";
    if (s.phase === "growing" && s.flashoverInSec !== null && s.flashoverInSec <= FLASHOVER_WARN_SEC) return `FLASHOVER ${mmss(s.flashoverInSec)}`;
    if (s.backdraughtRisk) return "BACKDRAUGHT RISK";
    if (s.phase === "smoke") return s.untenable >= 0.8 ? "smoke-logged · untenable" : s.untenable >= 0.4 ? "smoke-logged" : "smoke";
    if (s.phase === "knocked") return s.smoke > 0.3 ? "knocked · clearing" : "knocked down";
    return PHASE_WORD[s.phase];
  };

  const markers = (casualties ?? []).map((cas) => {
    const roomId = cas.compartmentId ?? plan.compartments.find((c) => !c.exposure && cas.pos.x >= c.shape.x && cas.pos.x <= c.shape.x + c.shape.w && cas.pos.y >= c.shape.y && cas.pos.y <= c.shape.y + c.shape.h)?.id;
    const room = roomId ? byId.get(roomId) : undefined;
    if (!room) return null;
    const inside = cas.pos.x >= room.shape.x && cas.pos.x <= room.shape.x + room.shape.w && cas.pos.y >= room.shape.y && cas.pos.y <= room.shape.y + room.shape.h;
    const p = inside ? cas.pos : { x: room.shape.x + room.shape.w / 2, y: room.shape.y + room.shape.h * 0.7 };
    const prog = progression?.[cas.id];
    const sev = prog?.severity ?? (cas.severity === "walking" ? "minor" : (cas.severity as CasualtyProgression["severity"] | undefined) ?? "serious");
    return { cas, floor: room.floor, p, sev, stage: prog?.stage ?? "located" };
  }).filter((m): m is NonNullable<typeof m> => m !== null);

  return (
    <div className={`fp${compact ? " compact" : ""}`}>
      <svg viewBox={`0 0 ${totalW.toFixed(2)} ${totalH.toFixed(2)}`} preserveAspectRatio="xMidYMid meet" aria-label="Floor plan with the fire on it">
        {floors.map((f, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const ox = 0.3 + col * (cellW + GAP) - f.box.x + (cellW - 0.6 - f.box.w) / 2;
          const oy = 0.2 + row * (cellH + GAP * 0.6) + TITLE_H - f.box.y;
          const openings = plan.openings.filter((o) => o.at && o.between.some((id) => byId.get(id)?.floor === f.floor) && (o.kind !== "stair" || true));
          return (
            <g key={f.floor} transform={`translate(${ox.toFixed(2)} ${oy.toFixed(2)})`}>
              <text className="fp-title" x={f.box.x} y={f.box.y - 0.3}>{f.title.toUpperCase()}</text>
              {f.exposures.map(({ c, band }) => {
                const s = stateOf.get(c.id);
                const alight = s && (s.phase === "growing" || s.phase === "developed" || s.phase === "decaying" || s.phase === "starved");
                return (
                  <g key={c.id} className={`fp-exposure${alight ? " alight" : ""}`}>
                    <rect x={band.x} y={band.y} width={band.w} height={band.h} />
                    <text x={band.x + band.w / 2} y={band.y + band.h / 2} transform={band.w < band.h ? `rotate(-90 ${band.x + band.w / 2} ${band.y + band.h / 2})` : undefined}>{c.label}{alight ? " · ALIGHT" : ""}</text>
                  </g>
                );
              })}
              {f.rooms.map((c) => {
                const s = stateOf.get(c.id);
                const phase = s?.phase ?? "clear";
                const flash = !!s && s.phase === "growing" && s.flashoverInSec !== null && s.flashoverInSec <= FLASHOVER_WARN_SEC;
                const smoke = s?.smoke ?? 0;
                const water = (s?.waterLpm ?? 0) > 0;
                const cls = ["fp-room", phase, flash ? "flash" : "", s?.backdraughtRisk ? "backdraught" : "", selectedRoomId === c.id ? "picked" : "", onPickRoom ? "pickable" : ""].filter(Boolean).join(" ");
                const sh = c.shape;
                return (
                  <g key={c.id} className={cls} onClick={onPickRoom ? () => onPickRoom(c.id) : undefined}>
                    <title>{c.label} — {s?.words ?? "clear"}{s ? ` · ${Math.round(s.tempC)} °C · smoke ${Math.round(s.smoke * 100)}%` : ""}</title>
                    <rect className="floor" x={sh.x} y={sh.y} width={sh.w} height={sh.h} style={{ fill: PHASE_FILL[phase] }} />
                    {phase === "developed" && <rect className="flame" x={sh.x} y={sh.y} width={sh.w} height={sh.h} />}
                    {smoke > 0.12 && <rect className="smoke" x={sh.x} y={sh.y} width={sh.w} height={sh.h} style={{ opacity: phase === "growing" || phase === "developed" || phase === "decaying" || phase === "starved" ? Math.min(0.22, 0.1 + 0.6 * smoke) : 0.1 + 0.6 * smoke }} />}
                    {water && <rect className="water" x={sh.x + 0.18} y={sh.y + 0.18} width={Math.max(0.2, sh.w - 0.36)} height={Math.max(0.2, sh.h - 0.36)} style={{ strokeDasharray: (s?.coolingMw ?? 0) > 0 ? undefined : "0.3 0.2" }} />}
                    <rect className="wall" x={sh.x} y={sh.y} width={sh.w} height={sh.h} />
                  </g>
                );
              })}
              <rect className="fp-outer" x={f.house.x} y={f.house.y} width={f.house.w} height={f.house.h} />
              {openings.map((o) => {
                const st = openingState.get(o.id);
                if (!o.at || !st) return null;
                const vert = vertical(o, byId);
                const len = o.widthM ?? (o.kind === "window" ? 1.2 : o.kind === "stair" ? 1 : 0.8);
                const half = len / 2;
                if (o.kind === "stair") {
                  const lower = Math.min(...o.between.map((id) => byId.get(id)?.floor ?? Infinity));
                  const up = f.floor === lower;
                  const w = vert ? 0.7 : len;
                  const h = vert ? len : 0.7;
                  const x = o.at.x - w / 2;
                  const y = o.at.y - h / 2;
                  return (
                    <g key={o.id} className="fp-stair">
                      <title>{o.label ?? "Stairs"} — {up ? "up" : "down"}</title>
                      <rect x={x} y={y} width={w} height={h} />
                      {[0.2, 0.4, 0.6, 0.8].map((t) => (vert ? <line key={t} x1={x} x2={x + w} y1={y + h * t} y2={y + h * t} /> : <line key={t} x1={x + w * t} x2={x + w * t} y1={y} y2={y + h} />))}
                      <text x={o.at.x} y={o.at.y + 0.12}>{up ? "UP" : "DN"}</text>
                    </g>
                  );
                }
                const failed = st.failedAt !== null;
                const state = failed ? "gone" : st.open ? "open" : "shut";
                const cls = `fp-opening ${o.kind} ${state}${st.ppv ? " ppv" : ""}`;
                const x1 = vert ? o.at.x : o.at.x - half;
                const x2 = vert ? o.at.x : o.at.x + half;
                const y1 = vert ? o.at.y - half : o.at.y;
                const y2 = vert ? o.at.y + half : o.at.y;
                const out = o.between.includes("outside") ? outward(o, byId) : null;
                const fan = st.ppv && out ? { x: o.at.x + out.dx * 0.75, y: o.at.y + out.dy * 0.75 } : null;
                const timer = st.failsInSec !== null && !st.open ? { x: o.at.x + (vert ? 0 : 0), y: o.at.y + (vert ? -half - 0.2 : -0.32) } : null;
                return (
                  <g key={o.id} className={cls}>
                    <title>{o.label ?? o.id} — {failed ? (o.kind === "window" ? "gone, fire showing" : "burnt through") : st.ppv ? "fan in it" : st.open ? "open" : "shut"}{st.failsInSec !== null ? ` · gives way in ${mmss(st.failsInSec)}` : ""}</title>
                    <line className="gap" x1={x1} y1={y1} x2={x2} y2={y2} />
                    <line className="leaf" x1={x1} y1={y1} x2={x2} y2={y2} />
                    {fan && (
                      <g className="fp-fan" transform={`translate(${fan.x} ${fan.y})`}>
                        <circle r="0.34" />
                        <path d="M0 -0.24 L0.14 0 L0 0.24 L-0.14 0 Z" />
                        <path d="M-0.24 0 L0 0.14 L0.24 0 L0 -0.14 Z" />
                        <line x1={-out!.dx * 0.5} y1={-out!.dy * 0.5} x2={-out!.dx * 0.95} y2={-out!.dy * 0.95} className="blow" />
                      </g>
                    )}
                    {timer && <text className="fp-timer" x={timer.x} y={timer.y}>{mmss(st.failsInSec!)}</text>}
                  </g>
                );
              })}
              {f.rooms.map((c) => {
                const s = stateOf.get(c.id);
                const sh = c.shape;
                const flash = !!s && s.phase === "growing" && s.flashoverInSec !== null && s.flashoverInSec <= FLASHOVER_WARN_SEC;
                const water = (s?.waterLpm ?? 0) > 0;
                const words = roomLabel(c, s);
                const lines = labelLines(c.label, sh.w);
                const x = sh.x + 0.2;
                const y0 = sh.y + 0.55;
                return (
                  <g key={`t-${c.id}`} className="fp-text">
                    {lines.map((l, i) => <text key={i} className="fp-label" x={x} y={y0 + i * 0.46}>{l}</text>)}
                    {!compact && words && <text className={`fp-words${flash ? " flash" : ""}`} x={x} y={y0 + lines.length * 0.46 - 0.04}>{words}</text>}
                    {water && <text className="fp-water" x={sh.x + sh.w - 0.2} y={sh.y + sh.h - 0.22}>{Math.round(s?.waterLpm ?? 0)} L/min</text>}
                  </g>
                );
              })}
              {markers.filter((m) => m.floor === f.floor).map((m) => (
                <g key={m.cas.id} className={`fp-casualty ${m.sev}`} transform={`translate(${m.p.x} ${m.p.y})`}>
                  <title>{m.cas.label ?? m.cas.id} — {m.stage.replace(/_/g, " ")} · {m.sev}</title>
                  <circle r="0.36" style={{ fill: SEVERITY_FILL[m.sev] }} />
                  <circle r="0.13" cy="-0.1" className="head" />
                  <path d="M-0.2 0.26 Q0 0.02 0.2 0.26 Z" className="body" />
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      {!compact && (
        <div className="fp-key">
          <span><i style={{ background: PHASE_FILL.growing }} />alight</span>
          <span><i style={{ background: PHASE_FILL.developed }} />fully involved</span>
          <span><i style={{ background: PHASE_FILL.knocked }} />knocked</span>
          <span><i className="smoke" />smoke</span>
          <span><i className="door shut" />shut</span>
          <span><i className="door open" />open</span>
          <span><i className="door gone" />gone</span>
          <span><i className="water" />water on</span>
          <span><i className="cas" />casualty</span>
        </div>
      )}
    </div>
  );
}

/** The engine's state of a room with its label, for lists. */
export function roomRows(fire: FireState): { id: string; label: string; floor: number; state: CompartmentState; tone: "go" | "warn" | "stop" | "" }[] {
  return fire.plan.compartments
    .map((c) => {
      const state = fire.compartments.find((s) => s.id === c.id);
      if (!state) return null;
      const tone: "go" | "warn" | "stop" | "" =
        state.phase === "developed" || state.phase === "decaying" || state.backdraughtRisk || (state.flashoverInSec !== null && state.flashoverInSec <= FLASHOVER_WARN_SEC) ? "stop"
        : state.phase === "growing" || state.phase === "starved" || (state.phase === "smoke" && state.untenable >= 0.4) ? "warn"
        : state.phase === "knocked" ? "go"
        : "";
      return { id: c.id, label: c.label, floor: c.floor, state, tone };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
}

export type { OpeningState };
