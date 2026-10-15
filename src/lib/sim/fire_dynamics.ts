// THE FIRE IN THE BUILDING. Rooms joined by doors, stairs, windows and
// walls; a fire that starts in one of them, grows the way a compartment
// fire grows — slowly at first, then faster, until the air coming in or
// the fuel in the room caps it — flashes the room over when it is hot
// enough, starves when the room is shut up, bursts when a starved room
// is opened, spreads through whatever is open or fails, fills the house
// with smoke, and comes off against the water put on it. Replayed from
// ignition to now on every call, so it is a pure function of the job's
// tasks like everything else in the simulator; the physics stays in
// here and comes out as rooms, times and plain words.
//
// The numbers are the fire engineer's rules of thumb, not a CFD model:
//   growth      Q = α·t²            (NFPA t-squared: slow … ultrafast by fuel)
//   air cap     Q ≤ 1.5 · A√H      (Kawagoe: the openings' area × √height)
//   flashover   Q ≥ 7.8·A_T + 378·A√H   (Thomas; kW, m², m^5/2)
//   water       2.6 MJ a litre, a third of it used by a good crew
// and a closed door is twelve minutes, a party wall an hour.

import type { Deployment, Task } from "./incident_types";
import { ATTACK_EFFECTIVENESS, FAST_ATTACK_FLOW_LPM, HOSE_FLOW_LPM, INTERIOR_BA_DEFAULT_FLOW_LPM } from "./incident_types";
import type { BuildingPlan, Compartment, FireMaterial, FuelClass, Opening } from "./scene";

export type CompartmentPhase =
  | "clear"       // nothing in it
  | "smoke"       // smoke-logged, no fire
  | "growing"     // alight and growing
  | "starved"     // alight, shut up, waiting for air
  | "developed"   // flashed over: the whole room burning
  | "decaying"    // burning out
  | "burnt_out"   // nothing left to burn
  | "knocked";    // put out

export type CompartmentState = {
  id: string;
  phase: CompartmentPhase;
  /** Heat release, megawatts. */
  hrrMw: number;
  /** The hot layer under the ceiling, °C. */
  tempC: number;
  /** How full of smoke, 0 clear to 1 to the floor. */
  smoke: number;
  /** What is left to burn, 1 to 0. */
  fuel: number;
  /** 0 fine, 1 nobody survives in it long. */
  untenable: number;
  /** Seconds to flashover at the present trend, while it is growing towards one. */
  flashoverInSec: number | null;
  /** Hot, shut up and starved: opening it feeds it, and may burst it. */
  backdraughtRisk: boolean;
  /** Water going into it now, litres a minute, and what that is worth. */
  waterLpm: number;
  coolingMw: number;
  ignitedAt: number | null;
  flashoverAt: number | null;
  knockedAt: number | null;
  /** The engine's own words for the room. */
  words: string;
};

export type OpeningState = {
  id: string;
  open: boolean;
  /** Failed in the heat (a window gone, a door burnt through, a ceiling down). */
  failedAt: number | null;
  /** A fan in it. */
  ppv: boolean;
  /** Shut, with fire against it: seconds until it gives way at this heat. Null otherwise. */
  failsInSec: number | null;
};

export type FireEventKind = "ignited" | "flashover" | "window" | "failed" | "backdraught" | "fed" | "spread" | "knocked" | "burnt_out" | "exposure";
export type FireEvent = { at: number; kind: FireEventKind; compartmentId: string; text: string };

export type FireState = {
  plan: BuildingPlan;
  originId: string;
  compartments: CompartmentState[];
  openings: OpeningState[];
  /** The whole building's heat release now, and how it has moved over the last minute. */
  totalMw: number;
  trendMwPerMin: number;
  events: FireEvent[];
  everBurned: boolean;
  /** How far from the seat the fire and the smoke reach, in metres, for the circles the maps draw. */
  fireExtentM: number;
  smokeExtentM: number;
  /** Rooms alight, and rooms with fire or smoke in them. */
  roomsAlight: number;
  roomsInvolved: number;
  /** How far the fire reached a minute ago, for the rate the screens show. */
  fireExtentAgoM: number;
  /** When the way in and up — the hall, the stairs, the landing — was alight, as [from, to] spans; a search cannot pass through it. */
  routeCut: [number, number][];
};

// ---------------------------------------------------------------------------
// Fuel and openings
// ---------------------------------------------------------------------------

/** Growth coefficient (kW/s²), fuel load (MJ/m²), peak output fully involved (MW/m²), and how smoky it burns. */
const FUEL: Record<FuelClass, { alpha: number; load: number; peak: number; smoky: number }> = {
  domestic: { alpha: 0.03, load: 600, peak: 0.25, smoky: 1.0 },
  bedroom: { alpha: 0.025, load: 500, peak: 0.22, smoky: 1.0 },
  kitchen: { alpha: 0.047, load: 500, peak: 0.25, smoky: 1.1 },
  storage: { alpha: 0.1, load: 1500, peak: 0.4, smoky: 1.2 },
  office: { alpha: 0.03, load: 500, peak: 0.25, smoky: 1.0 },
  commercial: { alpha: 0.047, load: 800, peak: 0.3, smoky: 1.1 },
  industrial: { alpha: 0.19, load: 2500, peak: 0.5, smoky: 1.4 },
  plant: { alpha: 0.012, load: 300, peak: 0.15, smoky: 1.3 },
  corridor: { alpha: 0.012, load: 100, peak: 0.08, smoky: 0.8 },
  stair: { alpha: 0.012, load: 60, peak: 0.05, smoky: 0.8 },
  void: { alpha: 0.047, load: 300, peak: 0.2, smoky: 0.9 },
  sparse: { alpha: 0.006, load: 100, peak: 0.08, smoky: 0.7 },
};

const OPENING_SIZE: Record<Opening["kind"], { w: number; h: number }> = {
  door: { w: 0.8, h: 2.0 },
  window: { w: 1.2, h: 1.2 },
  stair: { w: 1.0, h: 2.2 },
  hatch: { w: 0.6, h: 0.6 },
  wall: { w: 0, h: 0 },
  partition: { w: 0, h: 0 },
};
/** Minutes a closed one holds against a developed fire the other side. */
const RESISTANCE_MIN: Record<Opening["kind"], number> = { door: 12, window: 0, stair: 0, hatch: 10, wall: 60, partition: 15 };
/** Seconds of a developed fire at an open one before the room beyond catches. */
const SPREAD_SEC: Record<Opening["kind"], number> = { door: 75, window: 240, stair: 45, hatch: 90, wall: 60, partition: 60 };
/** How readily smoke crosses an open one, per second. */
const SMOKE_K: Record<Opening["kind"], number> = { door: 0.02, window: 0.006, stair: 0.05, hatch: 0.012, wall: 0.004, partition: 0.006 };

const STEP_S = 5;
const WATER_MJ_PER_L = 2.6;
/** How much of the water's cooling a crew actually gets into the fire gases, by the way it is put on. */
const EFFICIENCY: Record<string, number> = { interior_attack: 0.35, exterior_attack: 0.2, exterior_cooling: 0.12, uhpl_lance: 0.3, aerial_monitor: 0.2, ba_firefighting: 0.35 };
/** Glass goes at this hot layer. */
const WINDOW_FAIL_C = 420;
/** A compartment this hot and shut up for this long is a backdraught waiting for a door. */
const BACKDRAUGHT_C = 300;
const BACKDRAUGHT_SHUT_MS = 180_000;
/** A knocked-down room is wet: it does not catch again from next door for this long. */
const REIGNITE_COOLDOWN_MS = 300_000;
/** Moving a line to the next room takes this long before the water counts there. */
const ADVANCE_MS = 45_000;

export const FLASHOVER_WARN_SEC = 180;

type Room = Compartment & { area: number; height: number; surface: number; f: (typeof FUEL)[FuelClass] };
type Link = { o: Opening; a: string; b: string; area: number; sqrtH: number; kind: Opening["kind"]; outside: boolean };

type RoomRun = {
  q: number; // MW
  temp: number;
  smoke: number;
  fuel: number;
  phase: CompartmentPhase;
  ignitedAt: number | null;
  flashoverAt: number | null;
  knockedAt: number | null;
  starvedSince: number | null;
  surgeUntil: number;
  exposure: number; // seconds of a neighbour's fire at an open way in
  /** When a door or window of it was last opened — by a crew or by the fire. */
  ventedAt: number | null;
};
type LinkRun = { open: boolean; failedAt: number | null; ppv: boolean; heat: number; hot: boolean; openedBy: "start" | "crew" | "fire" | null; openedAt: number | null };

export type FireInputs = {
  plan: BuildingPlan;
  material: FireMaterial;
  /** When the fire started, or null for a building with no fire in it. */
  ignitedAt: number | null;
  now: number;
  tasks: Task[];
  deployments?: Deployment[];
  /** Growth multiplier for the wind (a wildfire's, mostly; a little for a building). */
  windMult?: number;
  /** Hazards made safe — an isolated supply lets water on an electrical fire count. */
  isolatedHazardIds?: Set<string>;
  /** The fire seat, for where the extents are measured from. */
  seat?: { x: number; y: number };
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function roomOf(c: Compartment): Room {
  const height = c.heightM ?? 2.4;
  const area = Math.max(1, c.shape.w * c.shape.h);
  return { ...c, area, height, surface: 2 * area + 2 * (c.shape.w + c.shape.h) * height, f: FUEL[c.fuel] };
}

/** The room a point is in, the lowest floor first. */
export function compartmentAt(plan: BuildingPlan, p: { x: number; y: number }, floor?: number): Compartment | null {
  const inside = plan.compartments.filter((c) => p.x >= c.shape.x && p.x <= c.shape.x + c.shape.w && p.y >= c.shape.y && p.y <= c.shape.y + c.shape.h);
  if (!inside.length) return null;
  const onFloor = floor !== undefined ? inside.filter((c) => c.floor === floor) : [];
  return (onFloor[0] ?? inside.sort((a, b) => a.floor - b.floor)[0]) ?? null;
}

/** How fast the building's structure gives, percent a minute, from what
 *  is burning: a room fully involved eats at it, a roof void alight takes
 *  the roof with it. */
export function damageRatePerMin(state: FireState): number {
  let rate = 0;
  for (const s of state.compartments) {
    const c = state.plan.compartments.find((x) => x.id === s.id);
    if (!c || c.exposure) continue;
    const base = s.phase === "developed" ? 0.8 : s.phase === "decaying" ? 0.5 : s.phase === "growing" ? 0.15 : 0;
    rate += base * (c.fuel === "void" ? 2 : 1);
  }
  return rate;
}

/** The way in: the front door, or the first door to the outside. */
export function entryOpening(plan: BuildingPlan): Opening | null {
  const doors = plan.openings.filter((o) => o.kind === "door" && o.between.includes("outside"));
  return doors.find((o) => /front|main|entrance/i.test(o.label ?? o.id)) ?? doors[0] ?? null;
}

/** The opening a ventilation task without one goes for: the burning room's window to the outside. */
export function defaultVentOpening(plan: BuildingPlan, roomId: string): Opening | null {
  const windows = plan.openings.filter((o) => o.kind === "window" && o.between.includes("outside") && o.between.includes(roomId));
  return windows[0] ?? plan.openings.find((o) => o.kind === "window" && o.between.includes("outside")) ?? null;
}

function flowOf(t: Task, deployments: Deployment[] | undefined): number {
  if (t.kind === "aerial_monitor") return HOSE_FLOW_LPM["70mm"];
  const d = deployments?.find((x) => x.applianceId === t.applianceId);
  const riders = t.assignedCrewIds.length ? t.assignedCrewIds : t.baCrewIds ?? [];
  const reel = riders.some((id) => d?.crewEquipment?.[id]?.includes("fast_attack_branch")) && !riders.some((id) => d?.crewEquipment?.[id]?.includes("branch_45mm") || d?.crewEquipment?.[id]?.includes("branch_70mm"));
  if (reel) return FAST_ATTACK_FLOW_LPM;
  if (t.kind === "ba_sar") return INTERIOR_BA_DEFAULT_FLOW_LPM;
  return HOSE_FLOW_LPM[t.hoseType ?? "45mm"];
}

const endOf = (t: Task) => (t.state === "completed" ? t.completesAt ?? Infinity : t.state === "aborted" ? t.endedAt ?? t.startedAt : Infinity);

// ---------------------------------------------------------------------------
// The replay
// ---------------------------------------------------------------------------

export function simulateFire(inp: FireInputs): FireState {
  const { plan, material, now } = inp;
  const rooms = new Map<string, Room>();
  for (const c of plan.compartments) rooms.set(c.id, roomOf(c));
  const originId = plan.originId ?? plan.compartments[0]?.id ?? "";
  const links: Link[] = plan.openings.map((o) => {
    const size = OPENING_SIZE[o.kind];
    const w = o.widthM ?? size.w, h = o.heightM ?? size.h;
    return { o, a: o.between[0], b: o.between[1], area: w * h, sqrtH: Math.sqrt(Math.max(0.01, h)), kind: o.kind, outside: o.between.includes("outside") };
  });
  const byRoom = new Map<string, Link[]>();
  for (const l of links) for (const id of [l.a, l.b]) if (id !== "outside") byRoom.set(id, [...(byRoom.get(id) ?? []), l]);

  const run = new Map<string, RoomRun>();
  for (const c of plan.compartments) run.set(c.id, { q: 0, temp: 20, smoke: 0, fuel: 1, phase: "clear", ignitedAt: null, flashoverAt: null, knockedAt: null, starvedSince: null, surgeUntil: 0, exposure: 0, ventedAt: null });
  const linkRun = new Map<string, LinkRun>();
  for (const l of links) linkRun.set(l.o.id, { open: l.kind === "stair" ? true : !!l.o.open, failedAt: null, ppv: false, heat: 0, hot: false, openedBy: l.o.open || l.kind === "stair" ? "start" : null, openedAt: null });
  const events: FireEvent[] = [];
  const event = (at: number, kind: FireEventKind, compartmentId: string, text: string) => { events.push({ at, kind, compartmentId, text }); };
  const label = (id: string) => rooms.get(id)?.label ?? id;
  const other = (l: Link, id: string) => (l.a === id ? l.b : l.a);

  const ignite = (id: string, at: number, how: FireEventKind, text: string) => {
    const r = run.get(id); const room = rooms.get(id);
    if (!r || !room || r.phase === "growing" || r.phase === "developed" || r.phase === "decaying" || r.phase === "starved" || r.fuel < 0.05) return;
    r.phase = "growing"; r.q = Math.max(r.q, 0.02); r.ignitedAt = at; r.knockedAt = null;
    event(at, how, id, text);
  };

  // Opening something vents the rooms either side of it, and the rooms open to those.
  const vented = (l: Link, t: number) => {
    for (const id of [l.a, l.b]) {
      const rr = run.get(id); if (!rr) continue;
      rr.ventedAt = t;
      for (const l2 of byRoom.get(id) ?? []) { if (!linkRun.get(l2.o.id)?.open) continue; const o = run.get(other(l2, id)); if (o) o.ventedAt = t; }
    }
  };
  // What the crews do to the openings over time, read off the tasks once.
  const entry = entryOpening(plan);
  const ventJobs = inp.tasks.filter((t) => t.kind === "ventilate" && t.state === "completed" && t.completesAt).map((t) => {
    const roomId = inp.tasks.find((h) => h.kind === "hose_attack" && h.targetCompartmentId)?.targetCompartmentId ?? originId;
    const o = (t.openingId ? plan.openings.find((x) => x.id === t.openingId) : null) ?? defaultVentOpening(plan, roomId);
    return o ? { at: t.completesAt!, id: o.id, mode: t.ventMode ?? "open" } : null;
  }).filter((x): x is { at: number; id: string; mode: "open" | "ppv" | "close" } => !!x);
  const entryOpens = [
    ...inp.tasks.filter((t) => t.kind === "gain_entry" && t.state === "completed" && t.completesAt).map((t) => t.completesAt!),
    ...inp.tasks.filter((t) => (t.kind === "ba_sar" || (t.kind === "hose_attack" && (t.attackMode ?? "interior_attack") === "interior_attack")) && t.state !== "aborted").map((t) => t.startedAt),
  ];
  const windMult = inp.windMult ?? 1;
  const isolated = inp.isolatedHazardIds ?? new Set<string>();
  const electricalIsolated = Array.from(isolated).some((id) => /electric|isolat|supply/i.test(id));

  // Water on a room at a moment: the lines working, what they are worth,
  // where they go. A line stays on the room it is on until that room is
  // out, then moves to the next.
  const lineOn = new Map<string, { id: string; since: number }>();
  const waterAt = (t: number): Map<string, { lpm: number; mw: number; holds: boolean }> => {
    const out = new Map<string, { lpm: number; mw: number; holds: boolean }>();
    for (const task of inp.tasks) {
      const fighting = task.kind === "hose_attack" || task.kind === "aerial_monitor" || (task.kind === "ba_sar" && task.baMode === "firefighting");
      if (!fighting || task.state === "aborted" && (task.endedAt ?? task.startedAt) <= t) continue;
      if (t < task.startedAt || t >= endOf(task)) continue;
      const d = inp.deployments?.find((x) => x.applianceId === task.applianceId);
      if (d && d.pumpRunning === false) continue;
      const mode = task.kind === "ba_sar" ? "ba_firefighting" : task.kind === "aerial_monitor" ? "aerial_monitor" : task.attackMode ?? "interior_attack";
      const matMode = mode === "ba_firefighting" ? "interior_attack" : mode === "aerial_monitor" ? "exterior_attack" : mode;
      let mult = ATTACK_EFFECTIVENESS[material][matMode as keyof (typeof ATTACK_EFFECTIVENESS)[FireMaterial]] ?? 1;
      if (material === "electrical" && mult < 0 && electricalIsolated) mult = matMode === "interior_attack" ? 0.9 : 0.6;
      const lpm = flowOf(task, inp.deployments);
      const mw = (lpm / 60) * WATER_MJ_PER_L * (EFFICIENCY[mode] ?? 0.2) * Math.max(0, mult);
      // Where it goes: the room asked for, else the room the way of attack reaches.
      let target = task.targetCompartmentId && rooms.has(task.targetCompartmentId) ? task.targetCompartmentId : null;
      const isBurning = (r: RoomRun | undefined) => !!r && (r.phase === "growing" || r.phase === "developed" || r.phase === "decaying" || r.phase === "starved");
      const burning = [...run.entries()].filter(([, r]) => isBurning(r)).sort((x, y) => y[1].q - x[1].q);
      const kept = lineOn.get(task.id);
      if (!target && kept && isBurning(run.get(kept.id))) target = kept.id;
      if (!target) {
        if (mode === "exterior_attack" || mode === "aerial_monitor" || mode === "uhpl_lance") {
          // Through a window from outside: the hottest room with a way in from the open air.
          const showing = burning.find(([id]) => (byRoom.get(id) ?? []).some((l) => l.outside && (l.kind === "window" || l.kind === "door") && (linkRun.get(l.o.id)?.open || mode === "uhpl_lance")));
          target = showing?.[0] ?? (mode === "uhpl_lance" ? burning[0]?.[0] ?? null : null);
        } else if (mode === "exterior_cooling") {
          target = null; // held back for the exposures below
        } else {
          target = burning.find(([id]) => id === originId)?.[0] ?? burning[0]?.[0] ?? null;
        }
      }
      const holds = mode === "exterior_cooling";
      if (holds) {
        // A covering jet: the rooms next to the fire, and the exposure, kept cool.
        for (const [id, r] of run) {
          if (r.phase === "growing" || r.phase === "developed" || r.phase === "decaying") continue;
          const nextToFire = (byRoom.get(id) ?? []).some((l) => { const o = other(l, id); const rr = run.get(o); return !!rr && (rr.phase === "developed" || rr.phase === "growing"); });
          const exposure = !!rooms.get(id)?.exposure;
          if (nextToFire || exposure) { const cur = out.get(id); out.set(id, { lpm: (cur?.lpm ?? 0) + lpm / 2, mw: (cur?.mw ?? 0) + mw / 2, holds: true }); }
        }
        continue;
      }
      if (!target) continue;
      if (kept?.id !== target) lineOn.set(task.id, { id: target, since: t });
      // A line just moved to this room is still being advanced to it.
      const advancing = (lineOn.get(task.id)?.since ?? t) > t - (mode === "interior_attack" || mode === "ba_firefighting" ? ADVANCE_MS : ADVANCE_MS / 2) && (lineOn.get(task.id)?.since ?? t) > task.startedAt;
      const cur = out.get(target);
      out.set(target, { lpm: (cur?.lpm ?? 0) + lpm, mw: (cur?.mw ?? 0) + (advancing ? 0 : mw), holds: cur?.holds ?? false });
    }
    return out;
  };

  // ---- the clock ----------------------------------------------------------------
  const t0 = inp.ignitedAt;
  const totals: { t: number; mw: number; extent: number }[] = [];
  const seat = inp.seat ?? (() => { const o = rooms.get(originId); return o ? { x: o.shape.x + o.shape.w / 2, y: o.shape.y + o.shape.h / 2 } : { x: 0, y: 0 }; })();
  const reach = (c: Compartment) => Math.max(...[[c.shape.x, c.shape.y], [c.shape.x + c.shape.w, c.shape.y], [c.shape.x, c.shape.y + c.shape.h], [c.shape.x + c.shape.w, c.shape.y + c.shape.h]].map(([x, y]) => Math.hypot(x - seat.x, y - seat.y)));
  const isAlight = (r: RoomRun) => r.phase === "growing" || r.phase === "developed" || r.phase === "decaying" || r.phase === "starved";
  // How far from the seat the fire reaches: a big room counts by how much of it is burning.
  const extentNow = () => { let e = 0; for (const [id, r] of run) { if (!isAlight(r)) continue; const c = rooms.get(id)!; const own = Math.sqrt(Math.max(0.5, r.q) / (c.f.peak * Math.PI)) * 2.2; e = Math.max(e, Math.min(reach(c), r.phase === "growing" || r.phase === "starved" ? Math.max(1.5, own) : reach(c))); } return e; };
  const routeCut: [number, number][] = [];
  let routeOpen: number | null = null;
  if (t0 !== null) {
    ignite(originId, t0, "ignited", `Fire in the ${label(originId).toLowerCase()}`);
    for (let t = t0; t <= now; t += STEP_S * 1000) {
      const dt = STEP_S;
      // The crews' openings at this moment.
      for (const v of ventJobs) if (v.at > t - STEP_S * 1000 && v.at <= t) {
        const lr = linkRun.get(v.id); const l = links.find((x) => x.o.id === v.id);
        if (!lr || !l) continue;
        if (v.mode === "close") { lr.open = false; lr.ppv = false; lr.openedBy = null; }
        else { if (!lr.open) vented(l, t); lr.open = true; lr.ppv = v.mode === "ppv"; lr.openedBy = "crew"; lr.openedAt = t; }
      }
      if (entry) for (const at of entryOpens) if (at > t - STEP_S * 1000 && at <= t) { const lr = linkRun.get(entry.id); const l = links.find((x) => x.o.id === entry.id); if (lr && l && !lr.open) { lr.open = true; lr.openedBy = "crew"; lr.openedAt = t; vented(l, t); } }

      const water = waterAt(t);
      // Each room: its air, its fire, its heat.
      for (const [id, r] of run) {
        const room = rooms.get(id)!;
        const ls = byRoom.get(id) ?? [];
        let vent = 0;
        for (const l of ls) {
          const lr = linkRun.get(l.o.id)!;
          if (!lr.open || l.area <= 0) continue;
          const o = other(l, id);
          const oRun = run.get(o);
          // Air from the open comes straight in; air through another room comes in part.
          const through = l.outside ? 1 : (byRoom.get(o) ?? []).some((x) => x.outside && linkRun.get(x.o.id)?.open) ? 0.5 : 0.25;
          vent += l.area * l.sqrtH * through * (lr.ppv ? 1.6 : 1) * (oRun && (oRun.phase === "developed") ? 0.3 : 1);
        }
        const qVent = 1.5 * vent;
        const qFlash = (7.8 * room.surface + 378 * vent) / 1000;
        const fuelFactor = r.fuel > 0.25 ? 1 : r.fuel / 0.25;
        const qFuel = room.f.peak * room.area * fuelFactor * (room.exposure ? 0.9 : 1);
        const w = water.get(id);
        const cooling = w?.mw ?? 0;
        const burning = r.phase === "growing" || r.phase === "developed" || r.phase === "decaying" || r.phase === "starved";
        if (burning) {
          // A starved room: shut up, the fire waits on its air.
          const sealed = r.phase === "starved" ? vent < 0.32 : vent < 0.22;
          if (sealed && r.fuel > 0.1 && r.phase !== "decaying") {
            if (r.phase !== "starved") { r.starvedSince = t; r.phase = "starved"; }
            r.q = Math.min(r.q, Math.max(0.05, qVent));
          } else if (r.phase === "starved") {
            // Opened up: it takes the air — and bursts, if a door or a window
            // of it was opened after it had sat hot and shut for a minute.
            const opened = r.ventedAt !== null && r.starvedSince !== null && r.ventedAt > r.starvedSince && t - r.starvedSince >= BACKDRAUGHT_SHUT_MS;
            const hot = r.temp >= BACKDRAUGHT_C && r.fuel > 0.3;
            r.phase = "growing";
            if (opened && hot) { r.surgeUntil = t + 20_000; r.q = Math.min(qFuel, Math.max(r.q, 2.5 * qFlash)); r.temp = Math.max(r.temp, 900); event(t, "backdraught", id, `BACKDRAUGHT in the ${label(id).toLowerCase()} — the room went as it was opened up`); }
            else if (opened && cooling <= 0) event(t, "fed", id, `The ${label(id).toLowerCase()} took the air and went up`);
          }
          if (r.phase !== "starved") {
            // Growth: t-squared from where it is, capped by the air and the fuel; water takes it off.
            const alpha = room.f.alpha * windMult * (r.phase === "developed" ? 1.5 : 1);
            const qk = r.q * 1000;
            const grow = (2 * Math.sqrt(alpha * Math.max(qk, 20)) * dt) / 1000;
            const cap = r.phase === "developed" || r.phase === "decaying" ? Math.min(qVent * 1.2, qFuel) : Math.min(qVent, qFuel);
            let q = Math.min(r.q + grow, Math.max(cap, 0.05));
            if (t < r.surgeUntil) q = Math.max(q, Math.min(qFuel, 2.5 * qFlash));
            // Water: a line's worth of cooling knocks its share off every minute and a half.
            if (cooling > 0) q -= (cooling / 90) * dt;
            r.q = Math.max(0, q);
            // Flashover: the room is hot enough for everything in it to go.
            if ((r.phase === "growing") && r.q >= qFlash && vent >= 0.3 && r.fuel > 0.3) {
              r.phase = "developed"; r.flashoverAt = t; event(t, "flashover", id, `FLASHOVER — the ${label(id).toLowerCase()} fully involved`);
            }
            if (r.phase === "developed" && r.fuel <= 0.25) r.phase = "decaying";
            if (r.q <= 0.02 && cooling > 0) { r.phase = "knocked"; r.knockedAt = t; r.q = 0; event(t, "knocked", id, `Fire in the ${label(id).toLowerCase()} knocked down`); }
          }
          // Fuel burns at the rate of the fire.
          r.fuel = Math.max(0, r.fuel - (r.q * dt) / (room.f.load * room.area));
          if (r.fuel <= 0.02 && r.phase !== "knocked") { r.phase = "burnt_out"; r.q = 0; event(t, "burnt_out", id, `The ${label(id).toLowerCase()} burnt out`); }
        }
        // The hot layer: towards what the fire makes of it, and what comes in
        // from the rooms next door through whatever is open — hardest up a
        // stair; up fast and down slowly; water pulls it down hard.
        let heatIn = 0;
        for (const l of ls) {
          const lr = linkRun.get(l.o.id)!;
          if (!lr.open || l.outside) continue;
          const o = run.get(other(l, id)); const oRoom = rooms.get(other(l, id));
          if (!o || !oRoom) continue;
          const up = oRoom.floor < room.floor;
          const k = l.kind === "stair" ? (up ? 0.75 : 0.05) : l.kind === "door" ? (up ? 0.5 : 0.35) : l.kind === "hatch" ? 0.3 : 0.1;
          heatIn = Math.max(heatIn, (o.temp - 20) * k);
        }
        const heatTarget = Math.max(burning ? 20 + 560 * Math.min(1.6, r.q / Math.max(0.2, qFlash)) : 20 + 80 * r.smoke, 20 + heatIn);
        const target = r.phase === "starved" ? Math.max(heatTarget, 380) : heatTarget;
        const tau = target > r.temp ? 45 : cooling > 0 ? 25 : 150;
        r.temp += ((target - r.temp) * dt) / tau;
        // Smoke: made by the fire, shared through what is open, let out of what is open to the air.
        if (burning) r.smoke = clamp(r.smoke + (r.q / Math.max(0.3, qFlash)) * room.f.smoky * 0.025 * dt * (1 - r.smoke), 0, 1);
        for (const l of ls) {
          const lr = linkRun.get(l.o.id)!;
          if (!lr.open) { if (l.kind === "door" || l.kind === "partition" || l.kind === "hatch") { const o = run.get(other(l, id)); if (o && o.smoke > r.smoke) r.smoke += (o.smoke - r.smoke) * 0.003 * dt; } continue; }
          if (l.outside) { r.smoke = Math.max(0, r.smoke - r.smoke * (0.004 + (lr.ppv ? 0.03 : 0)) * (l.area / 1.44) * dt); continue; }
          const o = run.get(other(l, id));
          if (!o) continue;
          const oRoom = rooms.get(other(l, id))!;
          const upward = oRoom.floor < room.floor; // smoke coming up to this room
          const k = SMOKE_K[l.kind] * (l.kind === "stair" ? (upward ? 1.4 : 0.15) : 1) * (lr.ppv ? 2 : 1);
          if (o.smoke > r.smoke) r.smoke += (o.smoke - r.smoke) * k * dt;
        }
        if (!burning) r.smoke = Math.max(0, r.smoke - 0.0004 * dt);
        if (!burning && r.phase !== "knocked" && r.phase !== "burnt_out") r.phase = r.smoke > 0.15 ? "smoke" : "clear";
        if ((r.phase === "knocked" || r.phase === "burnt_out") && r.smoke < 0.05) r.phase = r.phase === "knocked" ? "knocked" : "burnt_out";
      }
      // The fire's reach: through what is open, and through what fails.
      for (const l of links) {
        if (l.a === "outside" || l.b === "outside") {
          const id = l.a === "outside" ? l.b : l.a; const r = run.get(id)!; const lr = linkRun.get(l.o.id)!;
          if (l.kind === "window" && !lr.open && r.temp >= WINDOW_FAIL_C) { lr.open = true; lr.failedAt = t; lr.openedBy = "fire"; lr.openedAt = t; vented(l, t); event(t, "window", id, `${label(id)} window gone — fire showing`); }
          continue;
        }
        const ra = run.get(l.a)!, rb = run.get(l.b)!, lr = linkRun.get(l.o.id)!;
        const [hot, cold, hotId, coldId] = ra.q >= rb.q ? [ra, rb, l.a, l.b] : [rb, ra, l.b, l.a];
        const hotEnough = hot.phase === "developed" || (hot.phase === "decaying" && hot.temp > 380) || (hot.phase === "growing" && hot.temp >= 350);
        lr.hot = hotEnough && !lr.open;
        if (!hotEnough) { if (lr.open) cold.exposure = Math.max(0, cold.exposure - dt * 0.5); continue; }
        if (!lr.open) {
          lr.heat += dt;
          const holds = (l.o.fireResistanceMin ?? RESISTANCE_MIN[l.kind]) * 60;
          if (lr.heat >= holds) { lr.open = true; lr.failedAt = t; lr.openedBy = "fire"; lr.openedAt = t; vented(l, t); event(t, "failed", coldId, `${l.o.label ? `The ${l.o.label.toLowerCase()}` : l.kind === "wall" ? "The wall" : l.kind === "partition" ? "The partition" : l.kind === "hatch" ? "The hatch" : `The door to the ${label(coldId).toLowerCase()}`} has gone — fire into the ${label(coldId).toLowerCase()}`); }
          continue;
        }
        if (cold.phase === "growing" || cold.phase === "developed" || cold.phase === "decaying" || cold.phase === "starved" || cold.phase === "burnt_out") continue;
        if (cold.knockedAt !== null && t - cold.knockedAt < REIGNITE_COOLDOWN_MS) continue;
        const cw = water.get(coldId);
        const upward = rooms.get(coldId)!.floor > rooms.get(hotId)!.floor;
        const down = rooms.get(coldId)!.floor < rooms.get(hotId)!.floor;
        cold.exposure += dt * (upward ? 1.6 : down ? 0.35 : 1) * (cw?.holds ? 0.3 : 1) * (cw && !cw.holds ? 0.5 : 1);
        if (cold.exposure >= SPREAD_SEC[l.kind]) {
          const coldRoom = rooms.get(coldId)!;
          ignite(coldId, t, coldRoom.exposure ? "exposure" : "spread", coldRoom.exposure ? `FIRE INTO ${coldRoom.label.toUpperCase()} — the exposure is involved` : `Fire into the ${coldRoom.label.toLowerCase()}`);
          cold.exposure = 0;
        }
      }
      totals.push({ t, mw: [...run.values()].reduce((n, r) => n + r.q, 0), extent: extentNow() });
      if (totals.length > 14) totals.shift();
      const cut = [...run.entries()].some(([id, r]) => rooms.get(id)?.route && isAlight(r));
      if (cut && routeOpen === null) routeOpen = t;
      if (!cut && routeOpen !== null) { routeCut.push([routeOpen, t]); routeOpen = null; }
    }
    if (routeOpen !== null) routeCut.push([routeOpen, now]);
  }

  // ---- what it adds up to ---------------------------------------------------------
  const water = waterAt(now);
  const compartments: CompartmentState[] = plan.compartments.map((c) => {
    const r = run.get(c.id)!; const room = rooms.get(c.id)!;
    const ls = byRoom.get(c.id) ?? [];
    let vent = 0;
    for (const l of ls) { const lr = linkRun.get(l.o.id)!; if (!lr.open || l.area <= 0) continue; vent += l.area * l.sqrtH * (l.outside ? 1 : 0.4); }
    const qFlash = (7.8 * room.surface + 378 * vent) / 1000;
    const w = water.get(c.id);
    let flashoverInSec: number | null = null;
    if (r.phase === "growing" && vent >= 0.3 && 1.5 * vent >= qFlash && room.f.peak * room.area >= qFlash && r.fuel > 0.3) {
      const alpha = room.f.alpha * (inp.windMult ?? 1);
      const net = (2 * Math.sqrt(alpha * Math.max(r.q * 1000, 20))) / 1000 - (w?.mw ?? 0) / 90;
      flashoverInSec = net > 0 ? Math.max(0, Math.round((qFlash - r.q) / net)) : null;
    }
    const untenable = Math.max(clamp((r.temp - 50) / 100, 0, 1), clamp((r.smoke - 0.35) / 0.45, 0, 1));
    const backdraughtRisk = r.phase === "starved" && r.temp >= BACKDRAUGHT_C && r.fuel > 0.3;
    const words =
      r.phase === "developed" ? "fully involved" :
      r.phase === "decaying" ? "burning out" :
      r.phase === "burnt_out" ? "burnt out" :
      r.phase === "knocked" ? (r.smoke > 0.3 ? "knocked down, smoke clearing" : "knocked down") :
      r.phase === "starved" ? (backdraughtRisk ? "shut up and hot — backdraught risk" : "shut up, smouldering") :
      r.phase === "growing" ? (flashoverInSec !== null && flashoverInSec <= FLASHOVER_WARN_SEC ? `well alight — flashover in ${flashoverInSec} s` : w ? "alight, water on it" : "alight and growing") :
      r.phase === "smoke" ? (untenable >= 0.8 ? "smoke-logged, untenable" : untenable >= 0.4 ? "smoke-logged" : "smoke in it") :
      "clear";
    return { id: c.id, phase: r.phase, hrrMw: r.q, tempC: r.temp, smoke: r.smoke, fuel: r.fuel, untenable, flashoverInSec, backdraughtRisk, waterLpm: w?.lpm ?? 0, coolingMw: w?.mw ?? 0, ignitedAt: r.ignitedAt, flashoverAt: r.flashoverAt, knockedAt: r.knockedAt, words };
  });
  const openings: OpeningState[] = plan.openings.map((o) => {
    const lr = linkRun.get(o.id)!;
    const holds = (o.fireResistanceMin ?? RESISTANCE_MIN[o.kind]) * 60;
    const failsInSec = !lr.open && lr.hot && holds > 0 ? Math.max(0, Math.round(holds - lr.heat)) : null;
    return { id: o.id, open: lr.open, failedAt: lr.failedAt, ppv: lr.ppv, failsInSec };
  });
  const totalMw = compartments.reduce((n, c) => n + c.hrrMw, 0);
  const past = totals.find((s) => s.t <= now - 60_000) ?? totals[0];
  const trendMwPerMin = past ? totalMw - past.mw : 0;
  const alight = (s: CompartmentState) => s.phase === "growing" || s.phase === "developed" || s.phase === "decaying" || s.phase === "starved";
  const fireExtentM = extentNow();
  let smokeExtentM = 0;
  for (const s of compartments) { const c = rooms.get(s.id)!; if (alight(s) || s.smoke > 0.3) smokeExtentM = Math.max(smokeExtentM, reach(c) + 2); }
  return {
    plan, originId, compartments, openings, totalMw, trendMwPerMin, events,
    everBurned: t0 !== null,
    fireExtentM, smokeExtentM,
    roomsAlight: compartments.filter(alight).length,
    roomsInvolved: compartments.filter((s) => alight(s) || s.phase === "smoke" || s.phase === "burnt_out").length,
    fireExtentAgoM: past?.extent ?? fireExtentM,
    routeCut,
  };
}
