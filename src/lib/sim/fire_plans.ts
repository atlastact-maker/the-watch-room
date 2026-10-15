// THE BUILDING AS ROOMS, when the scenario has not drawn it. A fire job
// without an authored plan gets one made from its building's footprint
// and what the property is: a house laid out as a house, a block of
// flats as flats off a corridor round a core, a school or a hospital as
// rooms off a corridor with a stair at each end, a shed or a warehouse
// as one great compartment with an office in the corner and a roof that
// goes. Good enough for the fire to develop the way that kind of
// building burns; the jobs that matter author their own.

import type { BuildingPlan, Compartment, FuelClass, Opening, Scene, SceneRect } from "./scene";
import { compartmentAt } from "./fire_dynamics";

type Shape = SceneRect;
const rect = (x: number, y: number, w: number, h: number): Shape => ({ x, y, w, h });
const mid = (s: Shape) => ({ x: s.x + s.w / 2, y: s.y + s.h / 2 });

function touches(a: Shape, b: Shape): boolean {
  const gapX = Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w);
  const gapY = Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h);
  return gapX <= 0.6 && gapY <= 0.6;
}

function floorsFrom(cls: string, size: string): number {
  const text = `${cls} ${size}`.toLowerCase();
  const m = text.match(/(\d+)[- ](storey|floor)/) ?? text.match(/(single|one|two|three|four|five)[- ](storey|floor)/);
  if (m) { const words: Record<string, number> = { single: 1, one: 1, two: 2, three: 3, four: 4, five: 5 }; return words[m[1]] ?? parseInt(m[1], 10) ?? 2; }
  if (/bungalow|single storey|single-storey/.test(text)) return 1;
  if (/cottage|semi|terrace|house|detached/.test(text)) return 2;
  return 2;
}

/** A house: the hall and the stairs by the front door, the lounge beside
 *  it, the kitchen and the dining room at the back; bedrooms, a landing
 *  and the bathroom on each floor above; the roof void over the top. */
function dwellingPlan(b: Shape, floors: number, labels: { front: string; back: string } = { front: "Front", back: "Back" }): BuildingPlan {
  const comps: Compartment[] = [];
  const opens: Opening[] = [];
  const left = b.w * 0.57, right = b.w - left;
  const frontH = b.h * 0.47, backH = b.h - frontH;
  const lx = b.x, rx = b.x + left, by = b.y, fy = b.y + backH;
  const room = (id: string, label: string, floor: number, shape: Shape, fuel: FuelClass, extra: Partial<Compartment> = {}) => { comps.push({ id, label, floor, shape, fuel, ...extra }); };
  const door = (id: string, a: string, bb: string, label: string, extra: Partial<Opening> = {}) => { opens.push({ id, kind: "door", between: [a, bb], label, ...extra }); };
  const window = (id: string, a: string, label: string, at: { x: number; y: number }, face: Opening["face"], extra: Partial<Opening> = {}) => { opens.push({ id, kind: "window", between: [a, "outside"], label, at, face, ...extra }); };
  // Ground floor.
  room("hall", "Hall", 0, rect(rx, fy, right, frontH), "corridor", { route: true });
  room("lounge", "Lounge", 0, rect(lx, fy, left, frontH), "domestic");
  room("kitchen", "Kitchen", 0, rect(lx, by, left, backH), "kitchen");
  room("dining", "Dining room", 0, rect(rx, by, right, backH), "domestic");
  door("front-door", "hall", "outside", "Front door", { at: { x: rx + right / 2, y: b.y + b.h }, face: "S" });
  door("lounge-door", "lounge", "hall", "Lounge door", { open: true, at: { x: rx, y: fy + frontH / 2 } });
  door("kitchen-door", "kitchen", "hall", "Kitchen door", { open: true, at: { x: rx, y: fy + 0.5 } });
  door("kitchen-arch", "kitchen", "dining", "Kitchen arch", { open: true, widthM: 1.2, at: { x: rx, y: by + backH / 2 } });
  door("dining-door", "dining", "hall", "Dining room door", { at: { x: rx + right / 2, y: fy } });
  door("back-door", "kitchen", "outside", "Back door", { at: { x: lx + left / 2, y: by }, face: "N" });
  window("lounge-window", "lounge", "Lounge window", { x: lx + left / 2, y: b.y + b.h }, "S", { widthM: 1.8 });
  window("kitchen-window", "kitchen", "Kitchen window", { x: lx, y: by + backH / 2 }, "W");
  window("dining-window", "dining", "Dining room window", { x: rx + right / 2, y: by }, "N");
  let below = "hall";
  for (let f = 1; f < floors; f++) {
    const p = f === 1 ? "" : `-${f}`;
    const landing = `landing${p}`;
    room(landing, floors > 2 ? `Landing ${f}` : "Landing", f, rect(rx, fy - 0.5, right, frontH * 0.55), "corridor", { route: true });
    room(`bed-front${p}`, `${labels.front} bedroom${floors > 2 ? ` ${f}` : ""}`, f, rect(lx, fy, left, frontH), "bedroom");
    room(`bed-rear${p}`, `Rear bedroom${floors > 2 ? ` ${f}` : ""}`, f, rect(lx, by, left, backH), "bedroom");
    room(`bed-back${p}`, `${labels.back} bedroom${floors > 2 ? ` ${f}` : ""}`, f, rect(rx, by, right, backH * 0.75), "bedroom");
    room(`bathroom${p}`, floors > 2 ? `Bathroom ${f}` : "Bathroom", f, rect(rx, fy + frontH * 0.55 - 0.5, right, frontH * 0.45 + 0.5), "sparse");
    opens.push({ id: `stairs${p}`, kind: "stair", between: [below, landing], label: floors > 2 ? `Stairs to floor ${f}` : "Stairs", at: { x: rx + right / 2, y: fy } });
    door(`bed-front${p}-door`, `bed-front${p}`, landing, "Front bedroom door", { at: { x: rx, y: fy + 0.4 } });
    door(`bed-rear${p}-door`, `bed-rear${p}`, landing, "Rear bedroom door", { at: { x: rx, y: fy - 0.3 } });
    door(`bed-back${p}-door`, `bed-back${p}`, landing, "Back bedroom door", { at: { x: rx + right / 2, y: fy - 0.5 } });
    door(`bathroom${p}-door`, `bathroom${p}`, landing, "Bathroom door", { open: true, at: { x: rx + right / 2, y: fy + frontH * 0.55 - 0.5 } });
    window(`bed-front${p}-window`, `bed-front${p}`, "Front bedroom window", { x: lx + left / 2, y: b.y + b.h }, "S", { widthM: 1.5 });
    window(`bed-rear${p}-window`, `bed-rear${p}`, "Rear bedroom window", { x: lx + left / 2, y: by }, "N");
    window(`bed-back${p}-window`, `bed-back${p}`, "Back bedroom window", { x: rx + right / 2, y: by }, "N");
    window(`bathroom${p}-window`, `bathroom${p}`, "Bathroom window", { x: rx + right / 2, y: b.y + b.h }, "S", { widthM: 0.6, heightM: 0.6 });
    below = landing;
  }
  // The roof void over the top floor, into which every ceiling eventually goes.
  const top = floors - 1;
  room("roof", "Roof void", floors, rect(b.x, b.y, b.w, b.h), "void", { heightM: 1.2 });
  for (const c of comps.filter((c) => c.floor === top && c.id !== "roof")) opens.push({ id: `ceiling-${c.id}`, kind: "wall", between: [c.id, "roof"], label: "Ceiling", fireResistanceMin: c.route ? 15 : 20 });
  return { compartments: comps, openings: opens, headStartSec: 300 };
}

/** A block: the corridor down the middle, rooms either side with a door
 *  each and a window, a stair at each end, a floor at a time. Fire doors
 *  to the corridor, as a school or a ward has. */
function blockPlan(b: Shape, floors: number, fuel: FuelClass, roomLabel: string, fireDoorMin: number): BuildingPlan {
  const comps: Compartment[] = [];
  const opens: Opening[] = [];
  const along = b.w >= b.h;
  const L = along ? b.w : b.h, W = along ? b.h : b.w;
  const corridorW = Math.min(2.4, W * 0.2);
  const stairL = Math.min(4, L * 0.12);
  const n = Math.max(1, Math.min(6, Math.floor((L - 2 * stairL) / 7)));
  const roomL = (L - 2 * stairL) / n;
  const sideW = (W - corridorW) / 2;
  // Local (u along the length, v across) to scene.
  const place = (u: number, v: number, lu: number, lv: number): Shape => (along ? rect(b.x + u, b.y + v, lu, lv) : rect(b.x + v, b.y + u, lv, lu));
  let belowStairA = "", belowStairB = "";
  for (let f = 0; f < floors; f++) {
    const p = floors > 1 ? `-${f}` : "";
    const corridor = `corridor${p}`;
    comps.push({ id: corridor, label: floors > 1 ? `Corridor · floor ${f}` : "Corridor", floor: f, shape: place(stairL, sideW, L - 2 * stairL, corridorW), fuel: "corridor", route: true });
    const stairA = `stair-a${p}`, stairB = `stair-b${p}`;
    comps.push({ id: stairA, label: floors > 1 ? `Stair A · floor ${f}` : "Stair A", floor: f, shape: place(0, 0, stairL, W), fuel: "stair", route: true });
    comps.push({ id: stairB, label: floors > 1 ? `Stair B · floor ${f}` : "Stair B", floor: f, shape: place(L - stairL, 0, stairL, W), fuel: "stair", route: true });
    opens.push({ id: `${stairA}-door`, kind: "door", between: [stairA, corridor], label: "Stair door", fireResistanceMin: 30, at: mid(place(stairL, sideW + corridorW / 2, 0, 0)) });
    opens.push({ id: `${stairB}-door`, kind: "door", between: [stairB, corridor], label: "Stair door", fireResistanceMin: 30, at: mid(place(L - stairL, sideW + corridorW / 2, 0, 0)) });
    if (f === 0) {
      opens.push({ id: "front-door", kind: "door", between: [stairA, "outside"], label: "Main entrance", at: mid(place(0, W, stairL, 0)), face: "S" });
      opens.push({ id: "rear-door", kind: "door", between: [stairB, "outside"], label: "Rear exit", at: mid(place(L - stairL, 0, stairL, 0)), face: "N" });
    } else {
      opens.push({ id: `${stairA}-up`, kind: "stair", between: [belowStairA, stairA], label: `Stair A to floor ${f}` });
      opens.push({ id: `${stairB}-up`, kind: "stair", between: [belowStairB, stairB], label: `Stair B to floor ${f}` });
    }
    for (let i = 0; i < n; i++) {
      for (const side of [0, 1]) {
        const id = `room-${f}-${i}-${side ? "b" : "a"}`;
        const v = side ? sideW + corridorW : 0;
        const shape = place(stairL + i * roomL, v, roomL, sideW);
        comps.push({ id, label: `${roomLabel} ${f > 0 ? `${f}` : "G"}${String.fromCharCode(65 + i)}${side ? " (far side)" : ""}`, floor: f, shape, fuel });
        opens.push({ id: `${id}-door`, kind: "door", between: [id, corridor], label: `${roomLabel} door`, fireResistanceMin: fireDoorMin, at: along ? { x: shape.x + shape.w / 2, y: side ? shape.y : shape.y + shape.h } : { x: side ? shape.x : shape.x + shape.w, y: shape.y + shape.h / 2 } });
        opens.push({ id: `${id}-window`, kind: "window", between: [id, "outside"], label: `${roomLabel} window`, widthM: 2, at: along ? { x: shape.x + shape.w / 2, y: side ? shape.y + shape.h : shape.y } : { x: side ? shape.x + shape.w : shape.x, y: shape.y + shape.h / 2 }, face: along ? (side ? "S" : "N") : side ? "E" : "W" });
      }
    }
    belowStairA = stairA; belowStairB = stairB;
  }
  comps.push({ id: "roof", label: "Roof void", floor: floors, shape: rect(b.x, b.y, b.w, b.h), fuel: "void", heightM: 1.0 });
  for (const c of comps.filter((c) => c.floor === floors - 1)) opens.push({ id: `ceiling-${c.id}`, kind: "wall", between: [c.id, "roof"], label: "Ceiling", fireResistanceMin: 30 });
  return { compartments: comps, openings: opens, headStartSec: 240 };
}

/** A shed: one great compartment, an office in the corner, a plant
 *  room, roller shutters and high windows, and a roof that vents once
 *  the heat gets to it. */
function hallPlan(b: Shape, fuel: FuelClass, label: string): BuildingPlan {
  const office = rect(b.x, b.y + b.h - Math.min(8, b.h * 0.25), Math.min(12, b.w * 0.25), Math.min(8, b.h * 0.25));
  const plant = rect(b.x + b.w - Math.min(6, b.w * 0.12), b.y, Math.min(6, b.w * 0.12), Math.min(6, b.h * 0.2));
  const comps: Compartment[] = [
    { id: "hall", label, floor: 0, shape: b, fuel, heightM: 8 },
    { id: "office", label: "Office", floor: 0, shape: office, fuel: "office", heightM: 2.6 },
    { id: "plant", label: "Plant room", floor: 0, shape: plant, fuel: "plant", heightM: 3 },
    { id: "roof", label: "Roof", floor: 1, shape: b, fuel: "void", heightM: 1.0 },
  ];
  const opens: Opening[] = [
    { id: "front-door", kind: "door", between: ["office", "outside"], label: "Main entrance", at: { x: office.x + office.w / 2, y: office.y + office.h }, face: "S" },
    { id: "office-door", kind: "door", between: ["office", "hall"], label: "Office door", fireResistanceMin: 30, at: { x: office.x + office.w, y: office.y + office.h / 2 } },
    { id: "plant-door", kind: "door", between: ["plant", "hall"], label: "Plant room door", fireResistanceMin: 30, at: { x: plant.x, y: plant.y + plant.h / 2 } },
    { id: "shutter-1", kind: "door", between: ["hall", "outside"], label: "Roller shutter 1", widthM: 4, heightM: 4, at: { x: b.x + b.w * 0.5, y: b.y + b.h }, face: "S" },
    { id: "shutter-2", kind: "door", between: ["hall", "outside"], label: "Roller shutter 2", widthM: 4, heightM: 4, at: { x: b.x + b.w * 0.75, y: b.y + b.h }, face: "S" },
    { id: "fire-exit", kind: "door", between: ["hall", "outside"], label: "Fire exit", at: { x: b.x + b.w * 0.3, y: b.y }, face: "N" },
    { id: "high-windows", kind: "window", between: ["hall", "outside"], label: "High-level windows", widthM: 12, heightM: 1, open: true, at: { x: b.x + b.w * 0.6, y: b.y }, face: "N" },
    { id: "office-window", kind: "window", between: ["office", "outside"], label: "Office window", widthM: 2, at: { x: office.x + office.w / 2, y: office.y + office.h }, face: "S" },
    { id: "roof-vent", kind: "window", between: ["hall", "outside"], label: "Roof", widthM: 10, heightM: 6, at: { x: b.x + b.w / 2, y: b.y + b.h / 2 } },
    { id: "ceiling-hall", kind: "wall", between: ["hall", "roof"], label: "Roof deck", fireResistanceMin: 15 },
    { id: "ceiling-office", kind: "wall", between: ["office", "roof"], label: "Ceiling", fireResistanceMin: 20 },
  ];
  return { compartments: comps, openings: opens, headStartSec: 420 };
}

/** Flats off a corridor round the core, the fire floor with the floor
 *  above and below it; flat doors are fire doors and the compartmentation
 *  holds while they do. */
function flatsPlan(b: Shape, hr: { fireFloor: number; flatsPerFloor: number }): BuildingPlan {
  const comps: Compartment[] = [];
  const opens: Opening[] = [];
  const n = Math.max(3, Math.min(8, hr.flatsPerFloor));
  const core = rect(b.x + b.w * 0.35, b.y + b.h * 0.35, b.w * 0.3, b.h * 0.3);
  const ring = rect(core.x - 1.8, core.y - 1.8, core.w + 3.6, core.h + 3.6);
  const floorsHere = [hr.fireFloor - 1, hr.fireFloor, hr.fireFloor + 1].filter((f) => f >= 0);
  let belowStair = "", belowLobby = "";
  for (const f of floorsHere) {
    const stair = `stair-${f}`, lobby = `lobby-${f}`;
    comps.push({ id: stair, label: `Stair · floor ${f}`, floor: f, shape: rect(core.x, core.y, core.w * 0.45, core.h), fuel: "stair", route: true });
    comps.push({ id: lobby, label: `Lobby · floor ${f}`, floor: f, shape: ring, fuel: "corridor", route: true });
    opens.push({ id: `${stair}-door`, kind: "door", between: [stair, lobby], label: "Stair door", fireResistanceMin: 30, at: { x: core.x + core.w * 0.45, y: core.y + core.h / 2 } });
    if (belowStair) opens.push({ id: `${stair}-up`, kind: "stair", between: [belowStair, stair], label: `Stair to floor ${f}` });
    if (belowLobby) opens.push({ id: `${lobby}-riser`, kind: "wall", between: [belowLobby, lobby], label: "Riser", fireResistanceMin: 45 });
    if (f === hr.fireFloor) {
      // The flats round the lobby: a strip each round the outside.
      for (let i = 0; i < n; i++) {
        const id = `flat-${f}-${i}`;
        const angle = (i / n) * Math.PI * 2;
        const cx = b.x + b.w / 2 + Math.cos(angle) * b.w * 0.32, cy = b.y + b.h / 2 + Math.sin(angle) * b.h * 0.32;
        const shape = rect(cx - b.w * 0.14, cy - b.h * 0.14, b.w * 0.28, b.h * 0.28);
        comps.push({ id, label: `Flat ${f}${String.fromCharCode(65 + i)}`, floor: f, shape, fuel: "domestic" });
        opens.push({ id: `${id}-door`, kind: "door", between: [id, lobby], label: `Flat ${f}${String.fromCharCode(65 + i)} door`, fireResistanceMin: 30, at: { x: cx - Math.cos(angle) * b.w * 0.14, y: cy - Math.sin(angle) * b.h * 0.14 } });
        opens.push({ id: `${id}-window`, kind: "window", between: [id, "outside"], label: `Flat ${f}${String.fromCharCode(65 + i)} window`, widthM: 2.4, at: { x: cx + Math.cos(angle) * b.w * 0.14, y: cy + Math.sin(angle) * b.h * 0.14 }, face: Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle)) ? (Math.cos(angle) > 0 ? "E" : "W") : Math.sin(angle) > 0 ? "S" : "N" });
      }
    }
    belowStair = stair; belowLobby = lobby;
  }
  if (floorsHere[0] === hr.fireFloor - 1) opens.push({ id: "stair-ground", kind: "door", between: [`stair-${floorsHere[0]}`, "outside"], label: "Stair to the ground", open: true, at: { x: core.x, y: core.y + core.h / 2 }, face: "S" });
  return { compartments: comps, openings: opens, headStartSec: 360 };
}

function nearest(plan: BuildingPlan, p: { x: number; y: number }): Compartment {
  return [...plan.compartments].filter((c) => !c.exposure && c.id !== "roof").sort((a, b) => { const ma = mid(a.shape), mb = mid(b.shape); return Math.hypot(ma.x - p.x, ma.y - p.y) - Math.hypot(mb.x - p.x, mb.y - p.y); })[0];
}

/** The plan a fire job runs on: the scene's own, or one made for the
 *  kind of building it is; null for a fire with no building (a car, a
 *  skip, the moor). */
export function buildingPlanFor(scene: Scene, scenario: { type: string; property: { class: string; size?: string } }): BuildingPlan | null {
  const seat = scene.fireSeat;
  if (!seat) return null;
  const material = seat.material ?? "structural";
  if (material === "vehicle" || material === "vegetation") return scene.plan ?? null;
  const target = scene.buildings.find((b) => b.kind === "target") ?? scene.buildings[0];
  let plan: BuildingPlan;
  if (scene.plan) plan = { ...scene.plan, compartments: [...scene.plan.compartments], openings: [...scene.plan.openings] };
  else {
    if (!target) return null;
    const t = scenario.type;
    const cls = scenario.property.class;
    const floors = floorsFrom(cls, scenario.property.size ?? "");
    if (/high_rise/.test(t) && scene.highRise) plan = flatsPlan(target.shape, scene.highRise);
    else if (/industrial|agricultural|refuse|warehouse/.test(t) || /portal frame|warehouse|agricultural|barn|hay/i.test(cls)) plan = hallPlan(target.shape, material === "bulk_combustible" ? "industrial" : /agricultur|hay|farm/i.test(cls) ? "storage" : "commercial", /agricultur|hay|farm/i.test(cls) ? "Hay store" : "Production floor");
    else if (/school|hospital|healthcare|education|automatic_fire_alarm|commercial/.test(t) || /school|hospital|office|commercial unit|trade/i.test(cls)) plan = blockPlan(target.shape, Math.max(1, Math.min(4, floors)), /hospital|healthcare/.test(t) ? "office" : /school|education/.test(t) ? "office" : "commercial", /hospital|healthcare/.test(t) ? "Ward" : /school|education/.test(t) ? "Classroom" : "Unit", 30);
    else plan = dwellingPlan(target.shape, Math.max(1, Math.min(4, floors)), /hmo/.test(t) ? { front: "Front", back: "Back" } : { front: "Front", back: "Back" });
    // The attached neighbour is the exposure, through the party wall and the roof.
    const neighbour = scene.buildings.find((b) => b.kind === "neighbour" && target && touches(b.shape, target.shape));
    if (neighbour) {
      plan.compartments.push({ id: "exposure", label: neighbour.label ?? "Next door", floor: 0, shape: neighbour.shape, fuel: "domestic", exposure: true });
      const shared = plan.compartments.filter((c) => c.floor === 0 && !c.exposure && c.id !== "roof" && touches(c.shape, neighbour.shape)).slice(0, 2);
      for (const c of shared) plan.openings.push({ id: `party-${c.id}`, kind: "wall", between: [c.id, "exposure"], label: "Party wall", fireResistanceMin: 60 });
      if (plan.compartments.some((c) => c.id === "roof")) plan.openings.push({ id: "party-roof", kind: "wall", between: ["roof", "exposure"], label: "Roof void party wall", fireResistanceMin: 40 });
    }
  }
  const origin = (seat.compartmentId && plan.compartments.find((c) => c.id === seat.compartmentId)) || (plan.originId && !seat.compartmentId && plan.compartments.find((c) => c.id === plan.originId)) || compartmentAt(plan, seat.pos) || nearest(plan, seat.pos);
  plan.originId = origin?.id ?? plan.compartments[0]?.id;
  return plan;
}
