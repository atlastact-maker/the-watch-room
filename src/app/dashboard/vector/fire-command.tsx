"use client";

// FIRE & RESCUE COMMAND — the MDT's fire module, in the same scheme as
// the police module: three columns, an action grid with icon tabs, the
// details of the picked action on the right, the pages along the foot.
//
//   ┌ INCIDENT SUMMARY ┬ RESOURCE ACTIONS               ┬ ACTION DETAILS   ┐
//   │ type · location  │ General · Firefighting ·       │ action · target  │
//   │ status · brief   │ Rescue · Water · Scene         │ options · crew   │
//   ├ SELECTED         │ groups of actions              │ start            │
//   │ RESOURCE         ├ CURRENT ACTIVITY               ├ COMMAND          │
//   ├ FIRE PICTURE     ├ ACTIVITY LOG                   ├ ASSISTANCE       │
//   └──────────────────┴────────────────────────────────┴──────────────────┘
//    Resource actions · Fire command · BA control · RTC · Log
//
// Every action is a simulator task on the unit's crew — a jet, a BA
// team, a hydrant, a hazard made safe, a casualty out — so the crew is
// busy while it runs and the shift log carries the outcome. The
// commander's own record (objectives, assessment, sectors, roles, the
// water picture) lives on the Fire command page in command-store.ts.

import { useState, type ReactNode } from "react";
import type { Appliance } from "@/lib/sim/types";
import type { CrsAction, CrsVehicle, EntryTool, HoseAttackMode, HoseType, Incident, KitKind, LogEntry, Task, TaskKind } from "@/lib/sim/incident_types";
import { ENTRY_TOOL_LABEL, TASK_MIN_CREW, hasWaterSupplyChain } from "@/lib/sim/incident_types";
import { mitigationOptionsFor } from "@/lib/sim/mitigation";
import type { IncidentSimState } from "@/lib/sim/incident_sim";
import type { ResolvedDeployment } from "../components/incident-view";
import { SceneCanvas } from "../components/scene-canvas";
import { BaControlBoard } from "../components/ba-control-board";
import { TASK_LABEL, catalogueKinds, competencyFor, useSceneHydrants, type TaskWorkspaceProps } from "./mdt-task-workspace";
import { updatePlan, useCommandPlan, type CommandPlan } from "./command-store";

type Page = "actions" | "command" | "ba" | "rtc" | "log";
type ActionTab = "general" | "fire" | "rescue" | "water" | "scene";

/** What an action button does: a simulator task, a request to control,
 *  a road-closure placement, or a screen-side thing with no task. */
type ActionDef = {
  key: string;
  label: string;
  sub?: string;
  icon: ReactNode;
  kind?: TaskKind;
  /** What the task acts on, picked in the details card. */
  target?: "hazard" | "casualty" | "hydrant" | "source";
  closure?: "close_carriageway" | "close_road";
  run?: "evacuate" | "pump" | "rtc" | "command";
};

type Group = { title: string; icon: ReactNode; actions: ActionDef[] };

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const I = {
  flame: <Icon d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z" />,
  hose: <Icon d="M3 14a4 4 0 0 1 4-4h6a4 4 0 0 1 0 8H9M13 10V6h6l2 2-2 2h-6" />,
  ba: <Icon d="M7 9a5 5 0 0 1 10 0v4a5 5 0 0 1-10 0zM9 20v-3m6 3v-3M10 11h4" />,
  search: <Icon d="M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm5 11 5 5" />,
  person: <Icon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0" />,
  hydrant: <Icon d="M9 6h6v14H9zM7 10h10M7 14h10M10 3h4" />,
  relay: <Icon d="M3 12h5m8 0h5M8 8v8m8-8v8M8 12h8" />,
  pump: <Icon d="M4 10h16v8H4zM8 10V6h8v4M12 13v2" />,
  ladder: <Icon d="M7 3v18m10-18v18M7 7h10M7 12h10M7 17h10" />,
  aerial: <Icon d="M3 19h18M6 19l6-14 6 14M9 12h6" />,
  door: <Icon d="M6 3h12v18H6zM14 12h.01" />,
  kit: <Icon d="M4 8h16v12H4zM9 8V5h6v3M12 11v5m-2.5-2.5h5" />,
  cone: <Icon d="M9 4h6l4 16H5zM7 14h10" />,
  tape: <Icon d="M3 8h18v8H3zM6 8l3 8m3-8 3 8m3-8-1 3" />,
  shield: <Icon d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />,
  road: <Icon d="M6 21L9 3h6l3 18M12 6v3m0 3v3m0 3v3" />,
  exit: <Icon d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10" />,
  fan: <Icon d="M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M12 10V4a3 3 0 0 1 3 3M14 12h6a3 3 0 0 1-3 3M12 14v6a3 3 0 0 1-3-3M10 12H4a3 3 0 0 1 3-3" />,
  tree: <Icon d="M12 3l5 7h-3l4 5h-5v6h-2v-6H6l4-5H7z" />,
  rope: <Icon d="M6 3v18M6 6c4 0 4 4 8 4s4-4 4-4M6 14c4 0 4 4 8 4s4-4 4-4" />,
  wave: <Icon d="M3 8c3 0 3 3 6 3s3-3 6-3 3 3 6 3M3 15c3 0 3 3 6 3s3-3 6-3 3 3 6 3" />,
  car: <Icon d="M5 13l2-5h10l2 5M4 13h16v5H4zM7 18v2m10-2v2M7 15h2m6 0h2" />,
  tower: <Icon d="M7 21V4h10v17M10 7h1m2 0h1m-4 3h1m2 0h1m-4 3h1m2 0h1m-4 3h1m2 0h1" />,
  lift: <Icon d="M5 3h14v18H5zM10 8l2-2 2 2M10 16l2 2 2-2" />,
  hazmat: <Icon d="M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0M12 3a9 9 0 0 1 8 5l-5 3M4 8a9 9 0 0 1 8-5M4 8l5 3m-1 7-3 4M12 21a9 9 0 0 1-8-5M12 21a9 9 0 0 0 8-5l-4-3" />,
  shower: <Icon d="M6 8a6 6 0 0 1 12 0v2H6zM8 14v2m4-2v2m4-2v2M8 19v1m4-1v1m4-1v1" />,
  command: <Icon d="M4 4h16v6H4zM4 14h16v6H4z" />,
  phone: <Icon d="M5 4h4l2 5-2 1a11 11 0 0 0 5 5l1-2 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  plus: <Icon d="M12 5v14M5 12h14" />,
  note: <Icon d="M7 3h10v18H7zM10 7h4m-4 4h4m-4 4h2" />,
  clockI: <Icon d="M12 8v5l3 2m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
  info: <Icon d="M12 8h.01M12 11v5m9-4a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
  eye: <Icon d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
  people: <Icon d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm7 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20a7 7 0 0 1 14 0m1-1a5 5 0 0 1 5 1" />,
  drop: <Icon d="M12 3s5 6 5 10a5 5 0 0 1-10 0c0-4 5-10 5-10z" />,
  warn: <Icon d="M12 3l9 16H3zM12 10v4m0 3h.01" />,
  cut: <Icon d="M6 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM8.5 10.5 20 4M8.5 13.5 20 20" />,
  truck: <Icon d="M3 7h11l4 4h3v6H3zM7 17v2m10-2v2" />,
  bolt: <Icon d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  gas: <Icon d="M8 3h8v6a4 4 0 0 1-8 0zM10 13v8m4-8v8M7 21h10" />,
};

const A: Record<string, ActionDef> = {
  take_command: { key: "take_command", label: "Take command", sub: "Incident commander", icon: I.command, run: "command" },
  survey: { key: "survey", label: "360 survey", sub: "All four sides", icon: I.eye, kind: "survey" },
  evacuate: { key: "evacuate", label: "Evacuate", sub: "Whistles — everyone out", icon: I.exit, run: "evacuate" },
  gain_entry: { key: "gain_entry", label: "Gain entry", sub: "Tool on the door", icon: I.door, kind: "gain_entry" },
  kit_grab: { key: "kit_grab", label: "Get kit", sub: "From the appliance", icon: I.kit, kind: "kit_grab" },
  cordon: { key: "cordon", label: "Cordon", sub: "Inner cordon", icon: I.tape, kind: "cordon" },
  traffic_mgmt: { key: "traffic_mgmt", label: "Traffic management", sub: "Hold and direct", icon: I.cone, kind: "traffic_mgmt" },
  scene_preservation: { key: "scene_preservation", label: "Preserve the scene", sub: "For the investigator", icon: I.shield, kind: "scene_preservation" },
  close_carriageway: { key: "close_carriageway", label: "Close carriageway", sub: "Place on the map", icon: I.road, closure: "close_carriageway" },
  close_road: { key: "close_road", label: "Close road", sub: "Full closure", icon: I.road, closure: "close_road" },
  hose_attack: { key: "hose_attack", label: "Hose attack", sub: "Get a jet to work", icon: I.hose, kind: "hose_attack" },
  aerial_monitor: { key: "aerial_monitor", label: "Aerial monitor", sub: "From the cage", icon: I.aerial, kind: "aerial_monitor" },
  ventilate: { key: "ventilate", label: "Ventilate", sub: "Once water is on it", icon: I.fan, kind: "ventilate" },
  deploy_stabilisers: { key: "deploy_stabilisers", label: "Deploy stabilisers", sub: "Jacks down, level", icon: I.ladder, kind: "deploy_stabilisers" },
  extend_platform: { key: "extend_platform", label: "Extend platform", sub: "Ladder or cage up", icon: I.aerial, kind: "extend_platform" },
  aerial_rescue: { key: "aerial_rescue", label: "Aerial rescue", sub: "From the cage", icon: I.aerial, kind: "aerial_rescue" },
  wildfire_beating: { key: "wildfire_beating", label: "Beat the front", sub: "Beaters on the flank", icon: I.tree, kind: "wildfire_beating" },
  wildfire_knapsack: { key: "wildfire_knapsack", label: "Knapsack", sub: "Spot fires", icon: I.drop, kind: "wildfire_knapsack" },
  firebreak: { key: "firebreak", label: "Cut a firebreak", sub: "Ahead of the head", icon: I.cut, kind: "firebreak" },
  ba_sar: { key: "ba_sar", label: "BA search and rescue", sub: "Two under air", icon: I.ba, kind: "ba_sar" },
  extract_casualty: { key: "extract_casualty", label: "Extract casualty", sub: "Out to safe ground", icon: I.person, kind: "extract_casualty", target: "casualty" },
  rope_rescue: { key: "rope_rescue", label: "Rope rescue", sub: "Line rescue", icon: I.rope, kind: "rope_rescue" },
  water_rescue: { key: "water_rescue", label: "Water rescue", sub: "Bank or boat", icon: I.wave, kind: "water_rescue" },
  rtc_extrication: { key: "rtc_extrication", label: "Vehicle extrication", sub: "Opens the RTC page", icon: I.car, run: "rtc" },
  bridgehead: { key: "bridgehead", label: "Set up bridgehead", sub: "Two floors below", icon: I.tower, kind: "bridgehead" },
  firefighting_lift: { key: "firefighting_lift", label: "Firefighting lift", sub: "Take it under control", icon: I.lift, kind: "firefighting_lift" },
  evacuate_floors: { key: "evacuate_floors", label: "Evacuate floors", sub: "Knock the doors", icon: I.people, kind: "evacuate_floors" },
  connect_hydrant: { key: "connect_hydrant", label: "Connect hydrant", sub: "Standpipe and key", icon: I.hydrant, kind: "connect_hydrant", target: "hydrant" },
  relay_hose: { key: "relay_hose", label: "Relay hose", sub: "From another pump", icon: I.relay, kind: "relay_hose", target: "source" },
  start_pump: { key: "start_pump", label: "Start the pump", sub: "Driver on the pump", icon: I.pump, run: "pump" },
  mitigate_hazard: { key: "mitigate_hazard", label: "Make hazard safe", sub: "Isolate · contain", icon: I.warn, kind: "mitigate_hazard", target: "hazard" },
  hazmat_identify: { key: "hazmat_identify", label: "Identify substance", sub: "DIM · size the cordon", icon: I.hazmat, kind: "hazmat_identify" },
  decontaminate: { key: "decontaminate", label: "Decontamination", sub: "Tent up", icon: I.shower, kind: "decontaminate" },
};

const TABS: { key: ActionTab; label: string; icon: ReactNode }[] = [
  { key: "general", label: "General", icon: I.note },
  { key: "fire", label: "Firefighting", icon: I.flame },
  { key: "rescue", label: "Rescue", icon: I.ba },
  { key: "water", label: "Water", icon: I.drop },
  { key: "scene", label: "Scene", icon: I.cone },
];

const GROUPS: Record<ActionTab, Group[]> = {
  general: [
    { title: "Command", icon: I.command, actions: [A.take_command, A.survey, A.evacuate] },
    { title: "Access and kit", icon: I.door, actions: [A.gain_entry, A.kit_grab] },
    { title: "Scene control", icon: I.tape, actions: [A.cordon, A.traffic_mgmt, A.scene_preservation] },
  ],
  fire: [
    { title: "Attack", icon: I.flame, actions: [A.hose_attack, A.ventilate, A.aerial_monitor] },
    { title: "Aerial", icon: I.aerial, actions: [A.deploy_stabilisers, A.extend_platform, A.aerial_rescue] },
    { title: "Wildfire", icon: I.tree, actions: [A.wildfire_beating, A.wildfire_knapsack, A.firebreak] },
  ],
  rescue: [
    { title: "Search and rescue", icon: I.ba, actions: [A.ba_sar, A.extract_casualty, A.aerial_rescue] },
    { title: "Specialist", icon: I.rope, actions: [A.rope_rescue, A.water_rescue, A.rtc_extrication] },
    { title: "High-rise", icon: I.tower, actions: [A.bridgehead, A.firefighting_lift, A.evacuate_floors] },
  ],
  water: [
    { title: "Supply", icon: I.hydrant, actions: [A.connect_hydrant, A.relay_hose, A.start_pump] },
  ],
  scene: [
    { title: "Hazards", icon: I.warn, actions: [A.mitigate_hazard, A.hazmat_identify, A.decontaminate] },
    { title: "Road", icon: I.road, actions: [A.close_carriageway, A.close_road, A.traffic_mgmt] },
    { title: "Cordon", icon: I.tape, actions: [A.cordon, A.scene_preservation] },
  ],
};

const TAB_DEFAULT: Record<ActionTab, string[]> = {
  general: ["survey", "take_command"],
  fire: ["hose_attack", "wildfire_beating", "aerial_monitor"],
  rescue: ["ba_sar", "extract_casualty", "water_rescue", "rope_rescue"],
  water: ["connect_hydrant", "start_pump"],
  scene: ["mitigate_hazard", "close_road", "cordon"],
};

/** The assistance messages a commander sends to control. Make pumps
 *  carries a number; the rest are one request each. */
const ASSISTANCE: { kind: string; label: string; icon: ReactNode; wording: string }[] = [
  { kind: "ambulance", label: "Ambulance", icon: I.plus, wording: "requests an ambulance to scene" },
  { kind: "police", label: "Police", icon: I.shield, wording: "requests police for cordon and traffic" },
  { kind: "aerial", label: "Aerial appliance", icon: I.aerial, wording: "requests an aerial appliance" },
  { kind: "water_carrier", label: "Water carrier", icon: I.truck, wording: "requests a water carrier / high volume pump" },
  { kind: "hazmat", label: "Hazmat / DIM", icon: I.hazmat, wording: "requests the hazardous materials unit" },
  { kind: "command_unit", label: "Command unit", icon: I.command, wording: "requests the incident command unit" },
];
const MORE_ASSISTANCE: { kind: string; label: string; wording: string }[] = [
  { kind: "gas_board", label: "Gas board", wording: "requests the gas emergency service" },
  { kind: "electricity", label: "Electricity", wording: "requests the DNO to isolate" },
];

const TACTICAL: { mode: "offensive" | "defensive" | "transitional"; label: string; hint: string }[] = [
  { mode: "offensive", label: "Offensive", hint: "Crews committed inside — BA and interior attack" },
  { mode: "defensive", label: "Defensive", hint: "Nobody inside — exterior attack, protect exposures" },
  { mode: "transitional", label: "Transitional", hint: "Changing from one to the other — everyone out or everyone in" },
];

const ATTACK: { mode: HoseAttackMode; label: string; hint: string }[] = [
  { mode: "exterior_attack", label: "Exterior attack", hint: "Jet through the opening from outside" },
  { mode: "interior_attack", label: "Interior attack", hint: "BA crew takes the jet in — needs offensive mode" },
  { mode: "exterior_cooling", label: "Covering jet", hint: "Cool the exposure, hold the spread" },
  { mode: "uhpl_lance", label: "UHPL lance", hint: "Ultra high pressure lance through the fabric" },
];
const HOSES: { type: HoseType; label: string }[] = [
  { type: "45mm", label: "45 mm" },
  { type: "70mm", label: "70 mm" },
];
const KITS: { kind: KitKind; label: string }[] = [
  { kind: "first_aid", label: "First aid kit" },
  { kind: "aed", label: "AED" },
  { kind: "trauma", label: "Trauma kit" },
  { kind: "extinguisher", label: "Extinguisher" },
];

const OBJECTIVES: { key: string; label: string; detail: string }[] = [
  { key: "life", label: "Protect life", detail: "Prioritise the safety of the public and emergency service personnel." },
  { key: "rescue", label: "Locate and rescue persons reported", detail: "Search and rescue before firefighting where persons are reported." },
  { key: "spread", label: "Limit fire spread", detail: "Prevent further spread of fire to adjoining areas." },
  { key: "property", label: "Protect surrounding property", detail: "Minimise damage to nearby buildings and infrastructure." },
  { key: "water", label: "Establish water supply", detail: "Hydrant or relay before the tank runs dry." },
  { key: "environment", label: "Protect the environment", detail: "Contain run-off and smoke plume; inform the agencies." },
];

const LIFE_RISK = ["Under assessment", "Persons reported — search in progress", "All persons accounted for", "No life risk"];
const FIRE_SPREAD = ["Unknown", "Contained to room of origin", "Spreading within the building", "Involving adjoining property", "Under control", "Extinguished"];
const STRUCTURAL = ["Not assessed", "Sound", "Compromised — restrict entry", "Collapse risk — withdraw"];
const HAZARDS = ["Review required", "None identified", "Identified — see hazard list", "Isolated and controlled"];
const APPLIANCE_ROLES = ["Firefighting", "Water supply", "Search & rescue", "BA support", "Command support", "Safety", "Public safety", "Aerial", "Standby / relief"];
const SUPPLY_STATUS = ["Pending", "Establishing", "Established", "Failing", "Lost"];
const SECTOR_TASKS = ["Firefighting", "Search and rescue", "Water supply", "Exposure protection", "Ventilation", "Salvage", "Cordon and safety"];

/** The standard space-creation set on any vehicle at an RTC. The
 *  datasheet's own make-safe actions come first; these follow, each
 *  behind the one it depends on — nobody cuts a roof before the glass
 *  is managed or rolls a dash on a car that is still rocking. Ids are
 *  `std-*` so a datasheet's own "stabilise" or "glass" replaces them. */
type SpaceAction = {
  id: string;
  label: string;
  detail: string;
  durationSec: number;
  minCrew: number;
  after?: string[];
  kit?: string;
  critical?: boolean;
  done: (vrm: string) => string;
};
const SPACE_CREATION: SpaceAction[] = [
  { id: "std-stabilise", label: "Stabilise vehicle", detail: "Blocks and chocks under the sills — kill the movement before anyone leans in", durationSec: 120, minCrew: 2, critical: true, done: (v) => `${v} stabilised on blocks and chocks — no movement on the shell` },
  { id: "std-glass", label: "Glass management", detail: "Film the screen, take the side glass out under control", durationSec: 90, minCrew: 1, done: (v) => `${v} glass managed — screen filmed, side glass removed` },
  { id: "std-doors-off", label: "Doors off", detail: "Spread the hinges, pop the latch — driver's door first, then the rear", durationSec: 180, minCrew: 2, after: ["stabilise"], kit: "Hydraulic", done: (v) => `${v} doors off — side access to the casualty` },
  { id: "std-third-door", label: "Third door conversion", detail: "B-pillar out with the rear door — full side access for the board", durationSec: 240, minCrew: 3, after: ["doors-off"], kit: "Hydraulic", done: (v) => `${v} third door conversion complete — B-pillar out, full side access` },
  { id: "std-roof-flap", label: "Roof flap", detail: "Cut the A- and B-pillars, fold the roof back over the boot", durationSec: 240, minCrew: 3, after: ["glass", "stabilise"], kit: "Hydraulic", done: (v) => `${v} roof flapped back — access from above` },
  { id: "std-roof-off", label: "Roof off", detail: "All pillars cut, roof lifted clear — full access from above", durationSec: 300, minCrew: 4, after: ["glass", "stabilise"], kit: "Hydraulic", done: (v) => `${v} roof off and clear — full access from above` },
  { id: "std-dash-roll", label: "Dash roll", detail: "Relief cuts at the A-pillar base, ram footed on the sill — lift the dash off the legs", durationSec: 240, minCrew: 3, after: ["stabilise", "doors-off"], kit: "Hydraulic", done: (v) => `${v} dash rolled — legs free of the pedal box` },
];

/** Every distinct make-safe action on a datasheet — whole-vehicle first,
 *  then the components', deduped by id (a shared id is one job). */
function datasheetActions(v: CrsVehicle): CrsAction[] {
  const out: CrsAction[] = [];
  const seen = new Set<string>();
  for (const a of [...(v.actions ?? []), ...v.components.map((c) => c.action).filter((a): a is CrsAction => !!a)]) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    out.push(a);
  }
  return out;
}

function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function wall(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false });
}
function stamp(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function typeLabel(code: string): string {
  const special: Record<string, string> = {
    automatic_fire_alarm: "Automatic fire alarm",
    dwelling_fire_persons_reported: "Dwelling fire · persons reported",
    rtc_entrapment: "Road traffic collision · entrapment",
    industrial_fire: "Industrial fire",
    wildfire_moorland: "Moorland wildfire",
    hazmat_chemical_leak: "Hazmat · chemical leak",
    high_rise_dwelling_fire: "High-rise dwelling fire",
    education_premises_fire: "Fire · education premises",
    special_service_water_rescue: "Special service · water rescue",
    healthcare_premises_fire_alarm: "Fire alarm · healthcare premises",
  };
  return special[code] ?? code.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

const STAGE_LABEL: Record<IncidentSimState["fireStage"], string> = {
  none: "No fire",
  incipient: "Incipient",
  developing: "Developing",
  fully_developed: "Fully developed",
  flashover_risk: "FLASHOVER RISK",
  under_control: "Under control",
  extinguished: "Extinguished",
};

export type FireCommandProps = Pick<TaskWorkspaceProps, "onStartTask" | "onAbortTask" | "onCompleteTask" | "onSetTaskCrew" | "onNote"> & {
  incident: Incident;
  incidentRef: string;
  appliance: Appliance;
  unit: ResolvedDeployment;
  resolved: ResolvedDeployment[];
  tasks: Task[];
  log: LogEntry[];
  now: number;
  sim: IncidentSimState | null;
  vehicleGauges?: Record<string, { fuelPct: number; waterPct: number; conditionPct: number }>;
  sceneCommanderApplianceId?: string | null;
  busyCrewIds?: Set<string>;
  resolvedIncident: boolean;
  onBeginRoadClosure?: (applianceId: string, kind: "close_carriageway" | "close_road", crewIds: string[]) => void;
  onSetPumpRunning?: (applianceId: string, running: boolean) => void;
  onSetPumpOperator?: (applianceId: string, crewId: string | null) => void;
  onUpdateBaRemarks?: (taskId: string, text: string) => void;
  onUpdateBaEntryPoint?: (taskId: string, label: string) => void;
  onArmPlacement?: (applianceId: string) => void;
  onClose?: () => void;
  /** The declared tactical mode, and the desk's hook to declare one. */
  tacticalMode?: "offensive" | "defensive" | "transitional" | null;
  onDeclareTacticalMode?: (mode: "offensive" | "defensive" | "transitional") => void;
  /** An assistance message to control — make pumps, ambulance, aerial. */
  onRequestSupport?: (kind: string, applianceId: string, detail?: string) => void;
  structural?: { integrity: number; collapsedAt: number | null; evacuatedAt: number | null; injured: number };
  onEvacuate?: () => void;
  waterClock?: Record<string, number | null>;
  /** Crew fatigue 0–100 by appliance, for the relief picture. */
  fatigueByApplianceId?: Record<string, number>;
  /** What the fireground looks like, for the tablet's top strip. */
  onSelectionChange?: (sel: FireSelection | null) => void;
};

export type FireSelection = {
  stage: string;
  stageTone: "go" | "warn" | "stop" | "";
  detail: string;
  mode: string;
  modeTone: "go" | "warn" | "stop" | "";
  structure: string;
  structureTone: "go" | "warn" | "stop" | "";
  ba: string;
  water: string;
  waterTone: "go" | "warn" | "stop" | "";
};

export function FireCommandScreen(props: FireCommandProps) {
  const { incident, incidentRef, appliance, unit, resolved, tasks, log, now, sim, sceneCommanderApplianceId, resolvedIncident } = props;
  const plan = useCommandPlan(incident.id);
  const [page, setPage] = useState<Page>("actions");
  const [tab, setTabState] = useState<ActionTab>("general");
  const [actionKey, setActionKey] = useState<string>("survey");
  const [attackMode, setAttackMode] = useState<HoseAttackMode>("exterior_attack");
  const [hose, setHose] = useState<HoseType>("45mm");
  const [baMode, setBaMode] = useState<"search" | "firefighting">("search");
  const [entryTool, setEntryTool] = useState<EntryTool>("halligan");
  const [kitKind, setKitKind] = useState<KitKind>("first_aid");
  const [hydrantPick, setHydrantPick] = useState("");
  const [sourcePick, setSourcePick] = useState("");
  const [hazardPick, setHazardPick] = useState("");
  const [mitigationPick, setMitigationPick] = useState("");
  const [casualtyPick, setCasualtyPick] = useState("");
  const [crewPick, setCrewPick] = useState<string[] | null>(null);
  const [assignAppliance, setAssignAppliance] = useState("");
  const [assignRole, setAssignRole] = useState("");
  const [supportPick, setSupportPick] = useState("");
  const [safetyPick, setSafetyPick] = useState("");
  const [waterSource, setWaterSource] = useState<string | null>(null);
  const [waterStatus, setWaterStatus] = useState<string | null>(null);
  const [draftAssessment, setDraftAssessment] = useState<Partial<CommandPlan["assessment"]>>({});
  const [makePumps, setMakePumps] = useState(0);
  const [reliefN, setReliefN] = useState(1);
  const [sectorPick, setSectorPick] = useState<Record<string, string>>({});
  const [emergPick, setEmergPick] = useState<string[]>([]);
  const [rtcVehicleId, setRtcVehicleId] = useState<string | null>(null);
  const sc = incident.scenario;
  const set = (fn: (p: CommandPlan) => CommandPlan) => updatePlan(incident.id, fn);
  const note = (text: string) => props.onNote?.(`${appliance.callsign} · ${text}`);
  const hydrants = useSceneHydrants(incident, appliance.service === "Fire" && appliance.waterLitres > 0);

  // ---- Who is on the ground -----------------------------------------------
  const committed = resolved.filter((r) => r.phase === "at_incident" || r.phase === "mobile");
  const onScene = committed.filter((r) => r.phase === "at_incident");
  const fireOnScene = onScene.filter((r) => r.appliance.service === "Fire");
  const active = tasks.filter((t) => t.state === "active");
  const mine = active.filter((t) => t.applianceId === appliance.id);
  const commanderUnit = sceneCommanderApplianceId ? resolved.find((r) => r.appliance.id === sceneCommanderApplianceId) : null;
  const isCommander = sceneCommanderApplianceId === appliance.id;
  const officer = appliance.crewMembers.find((c) => /Manager|Officer/i.test(c.role)) ?? appliance.crewMembers[0];
  const here = unit.phase === "at_incident";
  const canAct = !resolvedIncident && here;
  const freeCrew = appliance.crewMembers.filter((c) => !props.busyCrewIds?.has(c.id));
  const baCrew = (ids: typeof freeCrew) => ids.filter((c) => competencyFor(appliance, c).ba === "Current");
  const kinds = catalogueKinds(appliance, incident);
  const callsignOf = (applianceId: string) => resolved.find((r) => r.appliance.id === applianceId)?.appliance.callsign ?? applianceId;
  const pumpsOnScene = committed.filter((r) => r.appliance.service === "Fire" && r.appliance.waterLitres > 0).length;

  // ---- The fire, the people, the hazards ----------------------------------
  const fireStage = sim?.fireStage ?? "none";
  const stageTone: "go" | "warn" | "stop" | "" = fireStage === "flashover_risk" || fireStage === "fully_developed" ? "stop" : fireStage === "developing" ? "warn" : fireStage === "under_control" || fireStage === "extinguished" ? "go" : "";
  const located = sim ? sim.foundCasualties.filter((c) => (sim.casualtyProgression[c.id]?.stage ?? "located") !== "undiscovered") : [];
  const plannedCasualties = sim ? Object.keys(sim.casualtyProgression).filter((id) => !sim.absentCasualtyIds.includes(id)).length : 0;
  const personsReported = sc.type.includes("persons_reported") || plannedCasualties > 0;
  const personsText = located.length
    ? `${located.length} located${plannedCasualties > located.length ? ` · ${plannedCasualties - located.length} unaccounted` : ""}`
    : personsReported
      ? `Reported · ${sc.property.occupants}`
      : "None reported";
  const hazards = sim?.visibleHazards ?? [];
  const isolated = (id: string) => !!sim?.mitigatedHazardIds.includes(id);
  const utilities = (() => {
    const gas = hazards.find((h) => h.kind === "gas");
    const elec = hazards.find((h) => h.kind === "electrical");
    const parts: string[] = [];
    if (gas) parts.push(`Gas ${isolated(gas.id) ? "isolated" : "LIVE"}`);
    if (elec) parts.push(`Electric ${isolated(elec.id) ? "isolated" : "LIVE"}`);
    if (!gas && !elec && sc.property.knownHazards.length) parts.push(sc.property.knownHazards[0]);
    return parts.length ? parts.join(" · ") : "Unknown";
  })();
  const suppressing = active.filter((t) => ["hose_attack", "aerial_monitor", "wildfire_beating", "wildfire_knapsack"].includes(t.kind));
  const integrity = props.structural?.integrity ?? 100;
  const collapsed = !!props.structural?.collapsedAt;
  const structureTone: "go" | "warn" | "stop" = collapsed ? "stop" : integrity < 25 ? "stop" : integrity < 55 ? "warn" : "go";
  const structureText = collapsed ? "COLLAPSED" : integrity < 25 ? "Collapse imminent — withdraw" : integrity < 55 ? "Compromised — restrict entry" : integrity < 85 ? "Fire-damaged — monitor" : "Sound";
  const isStructure = !!sim?.fireMaterial && sim.fireMaterial !== "vegetation";

  // ---- Water ----------------------------------------------------------------
  const gauge = props.vehicleGauges?.[appliance.id];
  const tankPct = Math.round(gauge?.waterPct ?? appliance.waterPct);
  const supplied = hasWaterSupplyChain(appliance.id, tasks);
  const pumpOn = unit.deployment.pumpRunning === true;
  const pumpOperator = appliance.crewMembers.find((c) => c.id === unit.deployment.pumpOperatorCrewId);
  const waterSources = ["Tank water", ...hydrants.map((h) => `Hydrant ${h.label}`), ...fireOnScene.filter((r) => r.appliance.id !== appliance.id && r.appliance.waterLitres > 0).map((r) => `Relay from ${r.appliance.callsign}`), "Open water", "Not confirmed"];
  const supplyStatusLive = supplied ? "Established" : plan.water.status;
  const waterActive = mine.filter((t) => t.kind === "connect_hydrant" || t.kind === "relay_hose");
  const waterLeft = props.waterClock?.[appliance.id];
  const waterText = appliance.waterLitres === 0 ? "No tank" : supplied ? "On the hydrant" : waterLeft != null ? (waterLeft <= 0 ? "TANK DRY" : `Tank ${tankPct}% · ${mmss(waterLeft * 1000)} left`) : `Tank ${tankPct}%`;
  const waterTone: "go" | "warn" | "stop" | "" = appliance.waterLitres === 0 ? "" : supplied ? "go" : waterLeft != null ? (waterLeft < 120 ? "stop" : waterLeft < 300 ? "warn" : "") : tankPct < 30 ? "stop" : tankPct < 60 ? "warn" : "";
  const hydrantCount = new Map<string, number>();
  for (const t of tasks) if (t.kind === "connect_hydrant" && t.state !== "aborted" && t.hydrantId) hydrantCount.set(t.hydrantId, (hydrantCount.get(t.hydrantId) ?? 0) + 1);
  const relaySources = fireOnScene.filter((r) => r.appliance.id !== appliance.id && r.appliance.waterLitres > 0);

  // ---- BA ---------------------------------------------------------------------
  const baTasks = active.filter((t) => t.kind === "ba_sar");
  const baByAppliance = onScene
    .map((r) => ({ appliance: r.appliance, teams: baTasks.filter((t) => t.applianceId === r.appliance.id) }))
    .filter((x) => x.teams.length > 0);
  const baCapable = onScene.filter((r) => r.appliance.service === "Fire").flatMap((r) => r.appliance.crewMembers.filter((c) => /\bBA\b|Breathing Apparatus/i.test(c.quals.join(" "))).map((c) => ({ c, callsign: r.appliance.callsign })));

  // ---- Log --------------------------------------------------------------------
  const incidentLog = log.filter((e) => e.timestamp >= incident.receivedAt);
  const recentLog = incidentLog.slice(-5).reverse();

  // ---- Command plan -----------------------------------------------------------
  const chosen = OBJECTIVES.filter((o) => plan.objectives[o.key]);
  const reviewLeft = plan.reviewDueAt ? plan.reviewDueAt - now : null;
  const reviewOverdue = reviewLeft !== null && reviewLeft <= 0;
  const assessment = { ...plan.assessment, ...draftAssessment };
  const assessmentDirty = Object.keys(draftAssessment).length > 0;
  const sectors = sc.scene?.sectors ?? [];
  const allCrew = committed.flatMap((r) => r.appliance.crewMembers.map((c) => ({ c, callsign: r.appliance.callsign })));

  function recordPlan() {
    const at = now;
    set((p) => ({ ...p, recordedAt: at, reviewDueAt: at + p.reviewMin * 60000 }));
    note(`Command plan recorded · ${chosen.map((o) => o.label).join(", ") || "no objectives"}${plan.notes.trim() ? ` · ${plan.notes.trim()}` : ""} · review in ${plan.reviewMin} min`);
  }
  function updateAssessment() {
    set((p) => ({ ...p, assessment: { ...p.assessment, ...draftAssessment }, assessedAt: now }));
    setDraftAssessment({});
    note(`Assessment · life risk: ${assessment.lifeRisk} · fire: ${assessment.fireSpread} · structure: ${assessment.structural} · hazards: ${assessment.hazards}`);
  }
  function assignResource() {
    const target = committed.find((r) => r.appliance.id === assignAppliance);
    if (!target || !assignRole) return;
    set((p) => ({ ...p, applianceRoles: { ...p.applianceRoles, [target.appliance.id]: assignRole } }));
    note(`${target.appliance.callsign} assigned · ${assignRole}`);
    setAssignAppliance("");
    setAssignRole("");
  }
  function assignOfficer(kind: "commandSupport" | "safetyOfficer", crewId: string) {
    const c = appliance.crewMembers.find((x) => x.id === crewId);
    if (!c) return;
    set((p) => ({ ...p, [kind]: { crewId: c.id, name: c.name, callsign: appliance.callsign } }));
    note(`${kind === "commandSupport" ? "Command support" : "Safety officer"} · ${c.name}`);
    if (kind === "commandSupport") setSupportPick("");
    else setSafetyPick("");
  }
  function updateWater() {
    const source = waterSource ?? plan.water.source;
    const status = waterStatus ?? supplyStatusLive;
    set((p) => ({ ...p, water: { source, status, updatedAt: now } }));
    note(`Water supply · ${source} · ${status}`);
    setWaterSource(null);
    setWaterStatus(null);
  }
  function takeCommand() {
    if (!officer) return;
    props.onStartTask?.({ applianceId: appliance.id, kind: "commander", assignedCrewIds: [officer.id] });
  }
  function setSectorCommander(sectorId: string, crewId: string) {
    const hit = allCrew.find((x) => x.c.id === crewId);
    if (!hit) return;
    set((p) => ({ ...p, sectors: { ...p.sectors, [sectorId]: { ...(p.sectors[sectorId] ?? { applianceIds: [] }), commander: { crewId: hit.c.id, name: hit.c.name, callsign: hit.callsign } } } }));
    props.onNote?.(`[sector-cmd] ${appliance.callsign} · ${sectors.find((x) => String(x.id) === sectorId)?.label ?? `Sector ${sectorId}`} · commander ${hit.c.name} (${hit.callsign})`);
  }
  function toggleSectorAppliance(sectorId: string, applianceId: string) {
    const cs = callsignOf(applianceId);
    let added = false;
    set((p) => {
      const cur = p.sectors[sectorId] ?? { applianceIds: [] };
      const has = cur.applianceIds.includes(applianceId);
      added = !has;
      const next: Record<string, typeof cur> = { ...p.sectors };
      for (const k of Object.keys(next)) next[k] = { ...next[k], applianceIds: next[k].applianceIds.filter((id) => id !== applianceId) };
      next[sectorId] = { ...cur, applianceIds: has ? cur.applianceIds.filter((id) => id !== applianceId) : [...cur.applianceIds, applianceId] };
      return { ...p, sectors: next };
    });
    note(`${cs} ${added ? "to" : "released from"} ${sectors.find((x) => String(x.id) === sectorId)?.label ?? `Sector ${sectorId}`}`);
  }
  function setSectorTask(sectorId: string, task: string) {
    set((p) => ({ ...p, sectors: { ...p.sectors, [sectorId]: { ...(p.sectors[sectorId] ?? { applianceIds: [] }), task } } }));
    note(`${sectors.find((x) => String(x.id) === sectorId)?.label ?? `Sector ${sectorId}`} · ${task.toLowerCase()}`);
  }
  function sendAssistance(kind: string, label: string, detail?: string) {
    set((p) => ({ ...p, assistance: [...p.assistance, { id: `${kind}:${now}`, label, at: now }] }));
    props.onRequestSupport?.(kind, appliance.id, detail);
    if (!props.onRequestSupport) note(`ASSISTANCE MESSAGE — ${label}`);
  }
  const lastAssistance = (kind: string) => [...plan.assistance].reverse().find((x) => x.id.startsWith(`${kind}:`));
  function nominateEmergencyTeam() {
    const picked = baCapable.filter((x) => emergPick.includes(x.c.id));
    if (picked.length < 2) return;
    set((p) => ({ ...p, emergencyTeam: { crewIds: picked.map((x) => x.c.id), names: picked.map((x) => x.c.name), callsign: picked[0].callsign, at: now } }));
    props.onNote?.(`[ba-emerg-team] ${appliance.callsign} · BA emergency team nominated at entry control — ${picked.map((x) => x.c.name).join(" and ")} (${picked[0].callsign})`);
    setEmergPick([]);
  }
  function startPump() {
    const op = pumpOperator ?? appliance.crewMembers.find((c) => /Pump|Driver/i.test(c.role)) ?? appliance.crewMembers[0];
    if (!op || !props.onSetPumpOperator || !props.onSetPumpRunning) return;
    props.onSetPumpOperator(appliance.id, op.id);
    props.onSetPumpRunning(appliance.id, true);
  }

  // ---- The selected action -----------------------------------------------------
  const available = (a: ActionDef) => (a.kind ? kinds.includes(a.kind) : a.run === "pump" ? appliance.waterLitres > 0 : a.run === "rtc" ? (sc.crs?.length ?? 0) > 0 : a.run === "evacuate" ? !!props.onEvacuate && isStructure : a.closure ? kinds.includes("cordon") : true);
  const groupsFor = (t: ActionTab) => GROUPS[t].map((g) => ({ ...g, actions: g.actions.filter(available) })).filter((g) => g.actions.length > 0);
  const setTab = (t: ActionTab) => {
    setTabState(t);
    const first = TAB_DEFAULT[t].find((k) => available(A[k])) ?? groupsFor(t)[0]?.actions[0]?.key;
    if (first) setActionKey(first);
    setCrewPick(null);
  };
  const pick = (a: ActionDef) => {
    setActionKey(a.key);
    setCrewPick(null);
  };
  const action = A[actionKey] ?? A.survey;
  const kind = action.kind;
  const interior = kind === "ba_sar" || (kind === "hose_attack" && attackMode === "interior_attack");
  const baNeeded = interior;
  const minCrew = kind ? TASK_MIN_CREW[kind] : action.closure ? TASK_MIN_CREW[action.closure] : 1;
  const eligible = baNeeded ? baCrew(freeCrew) : freeCrew;
  const crewFor = (crewPick ? crewPick.filter((id) => eligible.some((c) => c.id === id)) : eligible.slice(0, minCrew).map((c) => c.id));
  const targetHazard = hazards.find((h) => h.id === hazardPick) ?? (action.target === "hazard" ? hazards.find((h) => !isolated(h.id)) : undefined);
  const mitigations = targetHazard ? mitigationOptionsFor(targetHazard.kind) : [];
  const mitigation = mitigations.find((m) => m.method === mitigationPick) ?? mitigations[0];
  const casualtyDone = new Set(tasks.filter((t) => t.kind === "extract_casualty" && t.state !== "aborted").map((t) => t.casualtyId));
  const targetCasualty = located.find((c) => c.id === casualtyPick) ?? located.find((c) => !casualtyDone.has(c.id));
  const targetHydrant = hydrants.find((h) => h.label === hydrantPick) ?? hydrants.find((h) => (hydrantCount.get(h.label) ?? 0) < 2);
  const targetSource = relaySources.find((r) => r.appliance.id === sourcePick) ?? relaySources[0];
  const targetMissing = (action.target === "hazard" && !targetHazard) || (action.target === "casualty" && !targetCasualty) || (action.target === "hydrant" && !targetHydrant) || (action.target === "source" && !targetSource);
  const runningOfKind = kind
    ? mine.find((t) => t.kind === kind && (action.target !== "hazard" || t.hazardId === targetHazard?.id) && (action.target !== "casualty" || t.casualtyId === targetCasualty?.id) && (action.target !== "hydrant" || t.hydrantId === targetHydrant?.label))
    : action.closure
      ? mine.find((t) => t.kind === action.closure)
      : undefined;
  const doneOfKind = kind ? tasks.find((t) => t.applianceId === appliance.id && t.kind === kind && t.state === "completed" && (action.target !== "hazard" || t.hazardId === targetHazard?.id) && (action.target !== "casualty" || t.casualtyId === targetCasualty?.id)) : undefined;
  const mode = props.tacticalMode ?? null;
  const modeRefused = interior && (mode === "defensive" || mode === "transitional");
  const stabilisersDone = tasks.some((t) => t.applianceId === appliance.id && t.kind === "deploy_stabilisers" && t.state === "completed");
  const platformOut = tasks.some((t) => t.applianceId === appliance.id && t.kind === "extend_platform" && t.state === "active");
  const prerequisite =
    kind === "extend_platform" && !stabilisersDone ? "Deploy the stabilisers first." :
    (kind === "aerial_rescue" || kind === "aerial_monitor") && !platformOut ? "Extend the platform first." :
    kind === "hose_attack" && !pumpOn ? "Start the pump with an operator first." :
    kind === "hose_attack" && !supplied && appliance.waterLitres > 0 && tankPct <= 0 ? "The tank is dry — get a supply in." :
    (kind === "decontaminate" && !sim?.hazmatIdentified) ? "Identify the substance first." :
    interior && collapsed ? "The structure has failed — nobody goes back in." : "";
  const warnings: string[] = [];
  if (interior && mode === null && !prerequisite) warnings.push("No tactical mode declared — the IC declares offensive before crews go in.");
  if (kind === "ba_sar" && !plan.emergencyTeam) warnings.push("No BA emergency team nominated at entry control — nominate one on BA control.");
  if (kind === "ba_sar" && sc.scene?.highRise && !tasks.some((t) => t.kind === "bridgehead" && t.state === "completed")) warnings.push("No bridgehead established — set it up two floors below the fire first.");
  if (kind === "ventilate" && suppressing.length === 0) warnings.push("No jet on the fire — ventilating now feeds it.");
  if (kind === "hose_attack" && !supplied && appliance.waterLitres > 0 && tankPct < 40) warnings.push(`Tank at ${tankPct}% with no supply — a hydrant or relay before it runs dry.`);
  const crewShort = crewFor.length < minCrew;
  const isOngoing = !!runningOfKind && !runningOfKind.completesAt;
  const primaryLabel = action.run === "command"
    ? isCommander ? "You have command" : commanderUnit ? `${commanderUnit.appliance.callsign} has command` : "Take command"
    : action.run === "evacuate"
      ? props.structural?.evacuatedAt ? `Evacuated ${mmss(now - props.structural.evacuatedAt)} ago · sound again` : "EVACUATE — everyone out"
      : action.run === "pump"
        ? pumpOn ? `Pump running · ${pumpOperator?.name ?? "operator"}` : "Start the pump"
        : action.run === "rtc"
          ? "Open the RTC page"
          : action.closure
            ? runningOfKind ? "Closure in place" : "Choose the road on the map"
            : runningOfKind
              ? runningOfKind.completesAt ? `In progress · ${mmss(runningOfKind.completesAt - now)}` : `Ongoing · ${mmss(now - runningOfKind.startedAt)}`
              : `Start · ${action.label}${action.target === "hazard" && targetHazard ? ` · ${targetHazard.label}` : action.target === "hydrant" && targetHydrant ? ` · ${targetHydrant.label}` : action.target === "source" && targetSource ? ` · ${targetSource.appliance.callsign}` : action.target === "casualty" && targetCasualty ? ` · ${targetCasualty.label ?? targetCasualty.id}` : ""}`;
  const primaryDisabled = action.run === "command"
    ? !canAct || isCommander || !!commanderUnit || !officer || !props.onStartTask
    : action.run === "evacuate"
      ? resolvedIncident || collapsed || !props.onEvacuate
      : action.run === "pump"
        ? !canAct || pumpOn || !props.onSetPumpRunning
        : action.run === "rtc"
          ? false
          : action.closure
            ? !canAct || !!runningOfKind || crewShort || !props.onBeginRoadClosure
            : !canAct || !!runningOfKind || targetMissing || !!prerequisite || modeRefused || crewShort || !props.onStartTask;

  function runAction() {
    if (action.run === "command") return takeCommand();
    if (action.run === "evacuate") {
      if (window.confirm("Sound the evacuation whistles — every crew out of the building?")) props.onEvacuate?.();
      return;
    }
    if (action.run === "pump") return startPump();
    if (action.run === "rtc") return setPage("rtc");
    if (action.closure) {
      props.onBeginRoadClosure?.(appliance.id, action.closure, crewFor);
      note(`${action.label.toLowerCase()} — choosing the road segment on the incident map`);
      return;
    }
    if (!kind) return;
    props.onStartTask?.({
      applianceId: appliance.id,
      kind,
      assignedCrewIds: crewFor,
      hydrantId: kind === "connect_hydrant" ? targetHydrant?.label : undefined,
      sourceApplianceId: kind === "relay_hose" ? targetSource?.appliance.id : undefined,
      hoseType: kind === "hose_attack" ? hose : kind === "relay_hose" ? "70mm" : undefined,
      attackMode: kind === "hose_attack" ? attackMode : undefined,
      hretTurret: kind === "hose_attack" && attackMode === "uhpl_lance" && appliance.capabilities?.includes("HRET"),
      baMode: kind === "ba_sar" ? baMode : undefined,
      hazardId: kind === "mitigate_hazard" ? targetHazard?.id : undefined,
      mitigationMethod: kind === "mitigate_hazard" ? mitigation?.method : undefined,
      casualtyId: kind === "extract_casualty" ? targetCasualty?.id : undefined,
      entryTool: kind === "gain_entry" ? entryTool : undefined,
      kitKind: kind === "kit_grab" ? kitKind : undefined,
    });
    setCrewPick(null);
  }

  // ---- The tablet's top strip --------------------------------------------------
  const selection: FireSelection | null = here || committed.some((r) => r.appliance.id === appliance.id)
    ? {
        stage: STAGE_LABEL[fireStage],
        stageTone,
        detail: sim && sim.fireRadiusM > 0 ? `${sim.fireRadiusM.toFixed(0)} m · ${sim.fireRateMpm > 0.05 ? `growing ${sim.fireRateMpm.toFixed(1)} m/min` : sim.fireRateMpm < -0.05 ? `knocking down` : "holding"} · ${suppressing.length} jet${suppressing.length === 1 ? "" : "s"}` : sc.type.includes("rtc") ? `${sc.crs?.length ?? 0} vehicle${(sc.crs?.length ?? 0) === 1 ? "" : "s"} · ${personsText}` : personsText,
        mode: mode ? TACTICAL.find((t) => t.mode === mode)?.label ?? mode : "Mode not declared",
        modeTone: mode === "offensive" ? "go" : mode === "defensive" ? "warn" : mode === "transitional" ? "warn" : "stop",
        structure: isStructure ? (collapsed ? "STRUCTURE FAILED" : `Structure ${Math.round(integrity)}%`) : sim?.fireMaterial === "vegetation" ? "Open ground" : "No structure",
        structureTone: isStructure ? structureTone : "",
        ba: baTasks.length ? `${baTasks.length} BA team${baTasks.length === 1 ? "" : "s"} under air${plan.emergencyTeam ? "" : " · no emergency team"}` : plan.emergencyTeam ? "Emergency team ready" : "No BA committed",
        water: waterText,
        waterTone,
      }
    : null;
  const selectionKey = JSON.stringify(selection);
  const [seenSelection, setSeenSelection] = useState("");
  if (selectionKey !== seenSelection) {
    setSeenSelection(selectionKey);
    props.onSelectionChange?.(selection);
  }

  // ---- Shared pieces -----------------------------------------------------------
  const actionButton = (a: ActionDef) => {
    const running = a.kind ? mine.some((t) => t.kind === a.kind) : a.closure ? mine.some((t) => t.kind === a.closure) : a.run === "pump" ? pumpOn : a.run === "command" ? isCommander : false;
    const done = a.kind ? tasks.some((t) => t.applianceId === appliance.id && t.kind === a.kind && t.state === "completed") : a.run === "evacuate" ? !!props.structural?.evacuatedAt : false;
    return (
      <button key={a.key} type="button" className={`pc-action${actionKey === a.key ? " on" : ""}${running ? " running" : ""}${done && !running ? " done" : ""}`} aria-pressed={actionKey === a.key} onClick={() => pick(a)}>
        {a.icon}
        <span><strong>{a.label}</strong>{(a.sub || running || done) && <small>{running ? (a.run === "pump" ? "Running" : a.run === "command" ? "In command" : "In progress") : done ? "Done" : a.sub}</small>}</span>
        {a.run === "rtc" && <em aria-hidden="true">↗</em>}
      </button>
    );
  };
  const group = (g: Group) => (
    <section key={g.title} className="pc-group">
      <header>{g.icon}<span>{g.title.toUpperCase()}</span></header>
      <div className={`pc-actions n${g.actions.length >= 3 ? 3 : g.actions.length}`}>{g.actions.map(actionButton)}</div>
    </section>
  );
  const infoLine = (text: string, tone?: "warn" | "go") => <p key={text} className={`pc-info${tone ? ` ${tone}` : ""}`}>{I.info}<span>{text}</span></p>;
  const statusText = resolvedIncident ? "Closed" : fireStage !== "none" ? `${STAGE_LABEL[fireStage]}${mine.length ? " · working" : ""}` : mine.length ? "In progress" : here ? "In attendance" : unit.phase === "mobile" ? "Unit en route" : unit.phase.replace(/_/g, " ");

  const summaryCard = (
    <Card title="Incident summary" icon="▤">
      <dl className="pc-facts">
        <dt>Incident type</dt><dd>{typeLabel(sc.type)}</dd>
        <dt>Location</dt><dd>{sc.location.address}</dd>
        <dt>Incident reference</dt><dd>{incidentRef}</dd>
        <dt>Status</dt><dd className={resolvedIncident ? "" : stageTone || "hi"}>{statusText}</dd>
        {tab === "general" && (<><dt>Reported at</dt><dd>{stamp(incident.receivedAt)}</dd></>)}
        <dt>Attendance</dt><dd>{committed.length} committed · {onScene.length} on scene{pumpsOnScene ? ` · ${pumpsOnScene} pump${pumpsOnScene === 1 ? "" : "s"}` : ""}</dd>
      </dl>
      {tab === "general" && (<><div className="pc-sub">Brief details</div><p className="pc-brief">{sc.trigger}</p></>)}
    </Card>
  );

  const resourceCard = (
    <Card title="Selected resource" icon="▣">
      <dl className="pc-facts">
        <dt>Resource</dt><dd className="hi">{appliance.callsign}<small> · {appliance.typeName}</small></dd>
        <dt>Status</dt><dd><i className={`dot ${here ? "go" : unit.phase === "mobile" ? "warn" : "off"}`} />{here ? (mine.length ? "On scene · working" : "On scene") : unit.phase === "mobile" ? "En route" : unit.phase.replace(/_/g, " ")}<small> · {appliance.crewMembers.length} crew{freeCrew.length < appliance.crewMembers.length ? `, ${appliance.crewMembers.length - freeCrew.length} committed` : ""}</small></dd>
        {appliance.waterLitres > 0 && (<><dt>Pump</dt><dd className={pumpOn ? "go" : ""}>{pumpOn ? `Running · ${pumpOperator?.name ?? "operator"}` : "Not running"}<small> · {waterText.toLowerCase()}</small></dd></>)}
        <dt>Command</dt><dd className={isCommander ? "go" : commanderUnit ? "" : "warn"}>{isCommander ? `You · ${officer?.name ?? appliance.callsign}` : commanderUnit ? commanderUnit.appliance.callsign : "Not assigned"}</dd>
        <dt>Mode</dt><dd className={mode ? "hi" : "stop"}>{mode ? TACTICAL.find((t) => t.mode === mode)?.label : "Not declared"}</dd>
      </dl>
    </Card>
  );

  const fireCard = (
    <Card title="Fire picture" icon="🔥" fill headerExtra={sim ? <span className="pc-meta">{sim.fireMaterialKnown ? sim.fireMaterial ?? "" : "material not confirmed"}</span> : undefined}>
      <div className="fc-fire">
        <div className={`fc-fire-stage ${stageTone}`}>
          <b>{STAGE_LABEL[fireStage]}</b>
          <span>{sim && sim.fireRadiusM > 0 ? `${sim.fireRadiusM.toFixed(0)} m · ${sim.fireRateMpm > 0.05 ? `growing ${sim.fireRateMpm.toFixed(1)} m/min` : sim.fireRateMpm < -0.05 ? `knocking down ${Math.abs(sim.fireRateMpm).toFixed(1)} m/min` : "holding"}` : "No fire on the ground"}</span>
        </div>
        {sim && sim.fireRadiusM > 0 && (
          <div className="fc-involve">
            {([["Room", sim.involvement.room], ["Floor", sim.involvement.floor], ["Roof", sim.involvement.roof]] as const).map(([k, v]) => (
              <div key={k} className={v >= 0.99 ? "stop" : v > 0 ? "warn" : ""}><span>{k}</span><i style={{ width: `${Math.round(v * 100)}%` }} /><b>{v >= 0.99 ? "involved" : v > 0 ? `${Math.round(v * 100)}%` : "clear"}</b></div>
            ))}
            <div className="smoke"><span>Smoke</span><b>{sim.smokeRadiusM.toFixed(0)} m from the seat</b></div>
          </div>
        )}
        {sim?.flashoverCountdownSec != null && <div className="fc-fire-alert">FLASHOVER IN {sim.flashoverCountdownSec}s — GET THEM OUT OR GET WATER ON IT</div>}
        {sim?.exposureBreached && <div className="fc-fire-alert warn">FIRE INTO THE EXPOSURE — the neighbour is involved</div>}
        {collapsed && <div className="fc-fire-alert">STRUCTURAL COLLAPSE — nobody goes back in</div>}
        <dl className="pc-facts tight">
          <dt>Jets</dt><dd className={suppressing.length ? "go" : ""}>{suppressing.length ? `${suppressing.length} working · ${[...new Set(suppressing.map((t) => callsignOf(t.applianceId)))].join(", ")}` : "None in play"}</dd>
          <dt>BA</dt><dd className={baTasks.length ? "warn" : ""}>{baTasks.length ? `${baTasks.length} team${baTasks.length === 1 ? "" : "s"} under air` : "Nobody committed"}</dd>
          <dt>Persons</dt><dd className={located.length || personsReported ? "warn" : ""}>{personsText}</dd>
          <dt>Utilities</dt><dd className={/LIVE/.test(utilities) ? "stop" : ""}>{utilities}</dd>
          {isStructure && (<><dt>Structure</dt><dd className={structureTone}>{structureText}{props.structural?.injured ? ` · ${props.structural.injured} injured` : ""}</dd></>)}
        </dl>
        {props.structural && isStructure && (
          <div className={`fc-structure ${structureTone}`} title="Structural integrity — damage accrues while the fire is developed">
            <i style={{ width: `${Math.max(0, Math.min(100, integrity))}%` }} />
            <span>{collapsed ? "STRUCTURE FAILED" : `Structure ${Math.round(integrity)}%`}</span>
          </div>
        )}
        <div className="fc-map">
          {sc.scene ? (
            <SceneCanvas
              scene={sc.scene}
              deployments={onScene.map((r) => ({ deployment: r.deployment, callsign: r.appliance.callsign, service: r.appliance.service }))}
              live={sim ? { fireRadiusM: sim.fireRadiusM, smokeRadiusM: sim.smokeRadiusM, frontOffset: sim.frontOffset } : null}
            />
          ) : (
            <div className="pc-map-empty">NO SCENE PLAN FOR THIS INCIDENT</div>
          )}
        </div>
      </div>
    </Card>
  );

  const tabsRow = (
    <div className="pc-tabs" role="tablist">
      {TABS.map((t) => (
        <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>{t.icon}<span>{t.label}</span></button>
      ))}
    </div>
  );

  const activityCard = (
    <Card title="Current activity" icon="▶">
      {mine.length === 0 ? (
        <div className="pc-activity">
          <strong>{appliance.callsign} <span>•</span> {here ? "Available on scene" : unit.phase === "mobile" ? "En route" : "Not on scene"}</strong>
          <span className="st"><i className={`dot ${canAct ? "go" : "off"}`} />{canAct ? "Ready to begin" : resolvedIncident ? "Incident closed" : "Waiting to arrive"}</span>
        </div>
      ) : (
        mine.map((t) => (
          <div key={t.id} className="pc-activity">
            <strong>{appliance.callsign} <span>•</span> {t.crsLabel ?? TASK_LABEL[t.kind] ?? t.kind.replace(/_/g, " ")}{t.attackMode ? ` · ${ATTACK.find((a) => a.mode === t.attackMode)?.label.toLowerCase() ?? ""}` : t.hydrantId ? ` · hydrant ${t.hydrantId}` : t.hazardId ? ` · ${hazards.find((h) => h.id === t.hazardId)?.label ?? t.hazardId}` : ""}</strong>
            <span className="st">
              <i className="dot warn" />
              {t.completesAt ? `${mmss(t.completesAt - now)} remaining` : `Ongoing · ${mmss(now - t.startedAt)}`} · {t.assignedCrewIds.map((id) => appliance.crewMembers.find((c) => c.id === id)?.name.split(" ").pop() ?? id).join(", ")}
              {!t.completesAt && props.onCompleteTask && t.kind !== "ba_sar" && <button type="button" className="pc-mini" onClick={() => props.onCompleteTask?.(t.id)}>Complete</button>}
              {props.onAbortTask && <button type="button" className="pc-mini" onClick={() => props.onAbortTask?.(t.id)}>{t.kind === "ba_sar" ? "Withdraw" : "Abort"}</button>}
            </span>
          </div>
        ))
      )}
    </Card>
  );

  const logCard = (full = false) => (
    <Card title={full ? "Incident log" : "Activity log"} icon="≡" fill>
      <div className="pc-log">
        {(full ? incidentLog.slice().reverse() : recentLog).length === 0 && <div className="row"><span /><span>Nothing logged yet</span></div>}
        {(full ? incidentLog.slice().reverse() : recentLog).map((e) => <div key={e.id} className={`row ${e.kind}`}><span>{wall(e.timestamp)}</span><span>{e.message}</span></div>)}
      </div>
    </Card>
  );

  const actionsCard = (
    <Card title="Resource actions" icon="⚙" fill={tab !== "general"}>
      {tabsRow}
      {groupsFor(tab).map(group)}
      {groupsFor(tab).length === 0 && <p className="pc-note">Nothing on this page for {appliance.callsign} — {appliance.typeName}.</p>}
    </Card>
  );

  const crewChips = (
    <div className="fc-sector-units">
      {eligible.map((c) => (
        <button key={c.id} type="button" className={`fc-chip${crewFor.includes(c.id) ? " on" : ""}`} disabled={!canAct} title={`${c.name} · ${c.role}`} onClick={() => setCrewPick((p) => { const cur = p ?? crewFor; return cur.includes(c.id) ? cur.filter((id) => id !== c.id) : [...cur, c.id]; })}>{c.name.split(" ").pop()}</button>
      ))}
      {crewPick && <button type="button" className="fc-chip" onClick={() => setCrewPick(null)}>Auto</button>}
      {eligible.length === 0 && <span className="pc-note">{baNeeded ? "No free BA wearers on this appliance." : "Everyone is committed."}</span>}
    </div>
  );

  const detailsCard = (
    <Card title="Action details" icon="▤">
      <label className="pc-field inline"><span>Selected action</span><output>{action.label}</output></label>
      {tab !== "general" && <label className="pc-field inline"><span>Resource</span><output>{appliance.callsign}</output></label>}
      {kind === "hose_attack" && (
        <>
          <label className="pc-field inline"><span>Attack</span>
            <select value={attackMode} onChange={(e) => { setAttackMode(e.target.value as HoseAttackMode); setCrewPick(null); }}>
              {ATTACK.filter((a) => a.mode !== "uhpl_lance" || appliance.capabilities?.some((c) => /UHPL|HRET/i.test(c))).map((a) => <option key={a.mode} value={a.mode}>{a.label}</option>)}
            </select>
          </label>
          <label className="pc-field inline"><span>Hose</span>
            <select value={hose} onChange={(e) => setHose(e.target.value as HoseType)}>{HOSES.map((h) => <option key={h.type} value={h.type}>{h.label}</option>)}</select>
          </label>
          <label className="pc-field inline"><span>Pump</span><output className={pumpOn ? "hi" : ""}>{pumpOn ? `Running · ${pumpOperator?.name ?? "operator"}` : "Not running"}{!pumpOn && <button type="button" className="pc-mini" disabled={!canAct || !props.onSetPumpRunning} onClick={startPump}>Start pump</button>}</output></label>
        </>
      )}
      {kind === "ba_sar" && (
        <label className="pc-field inline"><span>Assignment</span>
          <select value={baMode} onChange={(e) => setBaMode(e.target.value as "search" | "firefighting")}>
            <option value="search">Search and rescue</option>
            <option value="firefighting">Firefighting — take a jet in</option>
          </select>
        </label>
      )}
      {kind === "gain_entry" && (
        <label className="pc-field inline"><span>Tool</span>
          <select value={entryTool} onChange={(e) => setEntryTool(e.target.value as EntryTool)}>{(Object.keys(ENTRY_TOOL_LABEL) as EntryTool[]).map((t) => <option key={t} value={t}>{ENTRY_TOOL_LABEL[t]}</option>)}</select>
        </label>
      )}
      {kind === "kit_grab" && (
        <label className="pc-field inline"><span>Kit</span>
          <select value={kitKind} onChange={(e) => setKitKind(e.target.value as KitKind)}>{KITS.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}</select>
        </label>
      )}
      {action.target === "hydrant" && (
        <label className="pc-field inline"><span>Supply point</span>
          <select value={targetHydrant?.label ?? ""} disabled={hydrants.length === 0} onChange={(e) => setHydrantPick(e.target.value)}>
            {hydrants.length === 0 && <option value="">No hydrant known on this scene</option>}
            {hydrants.map((h) => { const n = hydrantCount.get(h.label) ?? 0; return <option key={h.label} value={h.label} disabled={n >= 2}>{h.label}{h.street ? ` · ${h.street}` : ""} · {n === 0 ? "free" : `${n} pump${n === 1 ? "" : "s"} on it`}</option>; })}
          </select>
        </label>
      )}
      {action.target === "source" && (
        <label className="pc-field inline"><span>Source pump</span>
          <select value={targetSource?.appliance.id ?? ""} disabled={relaySources.length === 0} onChange={(e) => setSourcePick(e.target.value)}>
            {relaySources.length === 0 && <option value="">No other pump on the ground</option>}
            {relaySources.map((r) => <option key={r.appliance.id} value={r.appliance.id}>{r.appliance.callsign} · {Math.round(props.vehicleGauges?.[r.appliance.id]?.waterPct ?? r.appliance.waterPct)}% water</option>)}
          </select>
        </label>
      )}
      {action.target === "hazard" && (
        <>
          <label className="pc-field inline"><span>Hazard</span>
            <select value={targetHazard?.id ?? ""} disabled={hazards.length === 0} onChange={(e) => { setHazardPick(e.target.value); setMitigationPick(""); }}>
              {hazards.length === 0 && <option value="">No hazard identified yet</option>}
              {hazards.map((h) => <option key={h.id} value={h.id} disabled={isolated(h.id)}>{h.label}{isolated(h.id) ? " · made safe" : ""}</option>)}
            </select>
          </label>
          {targetHazard && (
            <label className="pc-field inline"><span>Method</span>
              <select value={mitigation?.method ?? ""} onChange={(e) => setMitigationPick(e.target.value)}>
                {mitigations.map((m) => <option key={m.method} value={m.method}>{m.method} · {Math.round(m.durationSec / 60)} min{m.needsBA ? " · BA" : ""}</option>)}
              </select>
            </label>
          )}
        </>
      )}
      {action.target === "casualty" && (
        <label className="pc-field inline"><span>Casualty</span>
          <select value={targetCasualty?.id ?? ""} disabled={located.length === 0} onChange={(e) => setCasualtyPick(e.target.value)}>
            {located.length === 0 && <option value="">No casualty located yet</option>}
            {located.map((c) => <option key={c.id} value={c.id} disabled={casualtyDone.has(c.id)}>{c.label ?? c.id}{casualtyDone.has(c.id) ? " · being moved" : ""}</option>)}
          </select>
        </label>
      )}
      {(kind || action.closure) && (
        <div className="pc-field">
          <span>Crew · {crewFor.length} of {minCrew} needed{baNeeded ? " · BA wearers" : ""}</span>
          {crewChips}
        </div>
      )}
      {!canAct && !action.run && infoLine(resolvedIncident ? "The incident is closed." : "Actions start once the unit is on scene.")}
      {modeRefused && infoLine(`Refused — ${mode} mode declared. ${mode === "transitional" ? "No new commitments until the IC settles it." : "Nobody goes inside."}`, "warn")}
      {prerequisite && canAct && infoLine(prerequisite, "warn")}
      {warnings.map((w) => infoLine(w, "warn"))}
      {canAct && crewShort && (kind || action.closure) && infoLine(baNeeded ? `${minCrew} BA wearers needed — ${eligible.length} free.` : "Not enough free crew — abort or complete a task first.", "warn")}
      {action.closure && canAct && !runningOfKind && infoLine("Pick the road segment on the incident map after you start.")}
      {doneOfKind && !runningOfKind && infoLine(`Done at ${wall(doneOfKind.completesAt ?? doneOfKind.startedAt)} — start again if it needs doing again.`, "go")}
      <button type="button" className={`pc-primary${runningOfKind ? " running" : ""}${action.run === "evacuate" ? " stop" : ""}`} disabled={primaryDisabled} onClick={runAction}>
        {action.icon}<span>{primaryLabel}</span>
      </button>
      {runningOfKind && props.onAbortTask && <button type="button" className="pc-mini" onClick={() => props.onAbortTask?.(runningOfKind.id)}>{kind === "ba_sar" ? "Withdraw the team" : `Abort ${action.label.toLowerCase()}`}</button>}
      {isOngoing && props.onCompleteTask && kind !== "ba_sar" && <button type="button" className="pc-mini" onClick={() => props.onCompleteTask?.(runningOfKind!.id)}>Report complete</button>}
    </Card>
  );

  const rolePicker = (kind: "commandSupport" | "safetyOfficer", label: string, value: string, setValue: (v: string) => void) => {
    const role = plan[kind];
    return (
      <label className="pc-field inline"><span>{label}</span>
        {role ? <output className="hi"><i className="dot go" />{role.name}</output> : (
          <select value={value} disabled={!canAct} onChange={(e) => { setValue(e.target.value); if (e.target.value) assignOfficer(kind, e.target.value); }}>
            <option value="">Not assigned · pick</option>
            {appliance.crewMembers.map((c) => <option key={c.id} value={c.id} disabled={props.busyCrewIds?.has(c.id)}>{c.name} · {c.role}</option>)}
          </select>
        )}
      </label>
    );
  };

  const commandCard = (
    <Card title="Command" icon="◆" headerExtra={plan.reviewDueAt ? <span className={`pc-meta${reviewOverdue ? " stop" : ""}`}>{reviewOverdue ? "REVIEW OVERDUE" : `review in ${mmss(reviewLeft ?? 0)}`}</span> : undefined}>
      <label className="pc-field inline"><span>Incident commander</span>
        <output className={isCommander ? "hi" : ""}>{isCommander ? <><i className="dot go" />You · {officer?.name}</> : commanderUnit ? <><i className="dot warn" />{commanderUnit.appliance.callsign}</> : <>Not assigned<button type="button" className="pc-mini" disabled={!canAct || !props.onStartTask} onClick={takeCommand}>Take command</button></>}</output>
      </label>
      {rolePicker("commandSupport", "Command support", supportPick, setSupportPick)}
      {rolePicker("safetyOfficer", "Safety officer", safetyPick, setSafetyPick)}
      <div className="pc-field"><span>Tactical mode</span>
        <div className="pc-tabs" role="group" aria-label="Tactical mode">
          {TACTICAL.map((t) => (
            <button key={t.mode} type="button" role="tab" aria-selected={mode === t.mode} disabled={!props.onDeclareTacticalMode || (!isCommander && !commanderUnit) || resolvedIncident} title={!isCommander && !commanderUnit ? "Take command first" : t.hint} onClick={() => props.onDeclareTacticalMode?.(t.mode)}>{t.label}</button>
          ))}
        </div>
      </div>
      {!mode && infoLine("Declare a mode before anyone goes inside — the debrief scores it.", "warn")}
      <button type="button" className="pc-mini wide" onClick={() => setPage("command")}>{I.note}<span>Command plan, assessment and sectors</span></button>
    </Card>
  );

  const supportCard = (
    <Card title="Assistance messages" icon="☎" headerExtra={<span className="pc-meta">{pumpsOnScene} pump{pumpsOnScene === 1 ? "" : "s"} on the job</span>}>
      <div className="fc-assist-pumps">
        <span className="lbl">Make pumps</span>
        <div className="fc-stepper">
          <button type="button" disabled={!canAct} onClick={() => setMakePumps((n) => Math.max(0, (n || pumpsOnScene) - 1))}>−</button>
          <output>{makePumps || pumpsOnScene + 1}</output>
          <button type="button" disabled={!canAct} onClick={() => setMakePumps((n) => (n || pumpsOnScene + 1) + 1)}>+</button>
        </div>
        <button type="button" className="pc-primary" disabled={!canAct || (makePumps || pumpsOnScene + 1) <= pumpsOnScene} onClick={() => { const n = makePumps || pumpsOnScene + 1; sendAssistance("make_pumps", `Make pumps ${n}`, String(n)); }}>{I.phone}<span>Make pumps {makePumps || pumpsOnScene + 1}</span></button>
      </div>
      <div className="pc-support">
        {ASSISTANCE.map((a) => {
          const sent = lastAssistance(a.kind);
          return (
            <button key={a.kind} type="button" className={`pc-action${sent ? " done" : ""}`} disabled={!canAct} title={a.wording} onClick={() => sendAssistance(a.kind, a.label)}>
              {a.icon}<span><strong>{a.label}</strong><small>{sent ? `Requested ${wall(sent.at)}` : "Ask control"}</small></span>
            </button>
          );
        })}
      </div>
      <div className="pc-support-more">
        {MORE_ASSISTANCE.map((a) => { const sent = lastAssistance(a.kind); return <button key={a.kind} type="button" className={`pc-mini${sent ? " done" : ""}`} disabled={!canAct} title={a.wording} onClick={() => sendAssistance(a.kind, a.label)}>{a.label}{sent ? " ✓" : ""}</button>; })}
        <button type="button" className={`pc-mini${lastAssistance("relief") ? " done" : ""}`} disabled={!canAct} title="A fresh pump stands the most tired crew down when it lands" onClick={() => sendAssistance("relief", "Relief pumps 1", "1")}>Relief pump{lastAssistance("relief") ? " ✓" : ""}</button>
      </div>
    </Card>
  );

  const baCard = (
    <Card title="BA entry control" icon="◉">
      <table className="pc-table">
        <thead><tr><th>Team</th><th>Status</th></tr></thead>
        <tbody>
          {baTasks.length === 0 && <tr><td colSpan={2} className="empty">{baCrew(freeCrew).length >= 2 ? "BA team ready — commit from Rescue" : "No BA team available"}</td></tr>}
          {baTasks.map((t, i) => {
            const entry = t.baEntryAt ? Math.min(...Object.values(t.baEntryAt)) : t.startedAt;
            const whistle = t.baWhistleAt ? Math.min(...Object.values(t.baWhistleAt)) : null;
            const late = whistle !== null && now > whistle;
            return (
              <tr key={t.id}>
                <td><b>BA Team {String(i + 1).padStart(2, "0")}</b><small>{callsignOf(t.applianceId)} · {t.assignedCrewIds.length} wearers{t.entryPoint ? ` · ${t.entryPoint}` : ""}</small></td>
                <td><i className={`dot ${late ? "stop" : "go"}`} />{late ? "WHISTLE PASSED" : `Under air ${mmss(now - entry)}`}{whistle ? <small>{late ? "Withdraw now" : `Whistle in ${mmss(whistle - now)}`}</small> : null}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <label className="pc-field inline"><span>Emergency team</span><output className={plan.emergencyTeam ? "hi" : ""}>{plan.emergencyTeam ? <><i className="dot go" />{plan.emergencyTeam.names.join(" · ")}</> : <><i className="dot stop" />Not nominated</>}</output></label>
      {!plan.emergencyTeam && (
        baCapable.length < 2 ? <p className="pc-note">Two BA-capable wearers on scene are needed for an emergency team.</p> : (
          <>
            <div className="fc-sector-units">
              {baCapable.map((x) => (
                <button key={x.c.id} type="button" className={`fc-chip${emergPick.includes(x.c.id) ? " on" : ""}`} disabled={props.busyCrewIds?.has(x.c.id) || (!emergPick.includes(x.c.id) && emergPick.length >= 2)} title={`${x.c.name} · ${x.callsign}`} onClick={() => setEmergPick((p) => (p.includes(x.c.id) ? p.filter((id) => id !== x.c.id) : [...p, x.c.id]))}>{x.c.name.split(" ").pop()} · {x.callsign}</button>
              ))}
            </div>
            <button type="button" className="pc-mini wide" disabled={emergPick.length !== 2 || !canAct} onClick={nominateEmergencyTeam}>{I.ba}<span>Nominate emergency team</span></button>
          </>
        )
      )}
      {page !== "ba" && <button type="button" className="pc-mini wide" onClick={() => setPage("ba")}>{I.ba}<span>Open entry control</span></button>}
    </Card>
  );

  const personsCard = (
    <Card title="Persons" icon="●" headerExtra={<span className="pc-meta">{personsText}</span>}>
      {located.length === 0 ? <p className="pc-note">{personsReported ? `Persons reported — ${sc.property.occupants}. Nobody located yet: BA search and rescue finds them.` : "No persons reported on this job."}</p> : (
        <table className="pc-table">
          <thead><tr><th>Casualty</th><th>Status</th></tr></thead>
          <tbody>
            {located.map((c) => {
              const stage = sim?.casualtyProgression[c.id]?.stage ?? "located";
              const moving = active.find((t) => t.kind === "extract_casualty" && t.casualtyId === c.id);
              return (
                <tr key={c.id}>
                  <td><b>{c.label ?? c.id}</b></td>
                  <td><i className={`dot ${stage === "located" ? "warn" : "go"}`} />{moving ? `Being moved · ${mmss((moving.completesAt ?? now) - now)}` : stage.replace(/_/g, " ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );

  const waterCard = (
    <Card title="Water supply" icon="💧">
      <dl className="pc-facts">
        <dt>Tank</dt><dd className={tankPct < 30 ? "stop" : tankPct < 60 ? "warn" : ""}>{appliance.waterLitres > 0 ? `${tankPct}% · ${Math.round(appliance.waterLitres * tankPct / 100).toLocaleString()} L` : "No tank on this appliance"}</dd>
        <dt>Pump</dt><dd className={pumpOn ? "go" : ""}>{pumpOn ? `Running · ${pumpOperator?.name ?? "operator"}` : "Not running"}</dd>
        <dt>Supply chain</dt><dd className={supplied ? "go" : waterActive.length ? "warn" : ""}>{supplied ? "Established — hydrant or relay feeding the pump" : waterActive.length ? "Being established" : "Tank only"}</dd>
        <dt>Water clock</dt><dd className={supplied ? "go" : waterLeft != null ? (waterLeft < 120 ? "stop" : waterLeft < 300 ? "warn" : "") : ""}>{supplied ? "Unlimited on the hydrant" : waterLeft != null ? (waterLeft <= 0 ? "TANK DRY" : `Tank empty in ${mmss(waterLeft * 1000)} at this draw`) : "No draw on the tank"}</dd>
      </dl>
      <label className="pc-field inline"><span>Source</span>
        <select value={waterSource ?? plan.water.source} onChange={(e) => setWaterSource(e.target.value)}>
          {waterSources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="pc-field inline"><span>Supply status</span>
        <select value={waterStatus ?? supplyStatusLive} onChange={(e) => setWaterStatus(e.target.value)}>
          {SUPPLY_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <button type="button" className="pc-mini wide" disabled={resolvedIncident} onClick={updateWater}>{I.drop}<span>Record the supply picture</span></button>
    </Card>
  );

  const hazardsCard = (
    <Card title="Hazards" icon="!" headerExtra={<span className="pc-meta">{hazards.length ? `${hazards.filter((h) => isolated(h.id)).length} of ${hazards.length} made safe` : "none identified"}</span>}>
      {hazards.length === 0 ? <p className="pc-note">No hazard identified yet — a 360 survey finds them.</p> : (
        <table className="pc-table">
          <thead><tr><th>Hazard</th><th>Status</th></tr></thead>
          <tbody>
            {hazards.map((h) => {
              const working = active.find((t) => t.kind === "mitigate_hazard" && t.hazardId === h.id);
              return (
                <tr key={h.id}>
                  <td><b>{h.label}</b><small>{h.kind}</small></td>
                  <td><i className={`dot ${isolated(h.id) ? "go" : working ? "warn" : "stop"}`} />{isolated(h.id) ? "Made safe" : working ? `${callsignOf(working.applianceId)} · ${mmss((working.completesAt ?? now) - now)}` : "LIVE"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );

  // ---- High-rise and hazmat ---------------------------------------------------
  const hr = sc.scene?.highRise;
  const kindState = (k: TaskKind) => {
    const done = tasks.find((t) => t.kind === k && t.state === "completed");
    const running = active.find((t) => t.kind === k);
    return done ? "done" : running ? "active" : "none";
  };
  const highRiseCard = hr ? (
    <Card title="High-rise" icon="▮" headerExtra={<span className="pc-meta">fire on floor {hr.fireFloor} of {hr.floors}</span>}>
      <dl className="pc-facts">
        <dt>Building</dt><dd>{hr.floors} floors · {hr.flatsPerFloor} flats a floor · {hr.firefightingLift ? "firefighting lift" : "no firefighting lift — stairs"}</dd>
        <dt>Bridgehead</dt><dd className={kindState("bridgehead") === "done" ? "go" : "stop"}>{kindState("bridgehead") === "done" ? `Established on floor ${hr.bridgeheadFloor}` : kindState("bridgehead") === "active" ? `Setting up on floor ${hr.bridgeheadFloor}` : `Not established — belongs on floor ${hr.bridgeheadFloor}`}</dd>
        <dt>Lift</dt><dd className={kindState("firefighting_lift") === "done" ? "go" : ""}>{!hr.firefightingLift ? "None" : kindState("firefighting_lift") === "done" ? "Under control" : "Not taken"}</dd>
        <dt>Residents</dt><dd className={plan.highRise ? "hi" : "warn"}>{plan.highRise ? `${plan.highRise.strategy === "stay_put" ? "Stay put" : plan.highRise.strategy === "phased" ? "Phased evacuation" : "Simultaneous evacuation"} · ${wall(plan.highRise.at)}` : "No strategy set — stay put holds"}</dd>
      </dl>
      <div className="pc-tabs" role="group" aria-label="Evacuation strategy">
        {([["stay_put", "Stay put"], ["phased", "Phased"], ["simultaneous", "Simultaneous"]] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={plan.highRise?.strategy === k} disabled={resolvedIncident} onClick={() => { set((p) => ({ ...p, highRise: { strategy: k, at: now } })); props.onNote?.(`[evac-strategy] ${appliance.callsign} · residents: ${l.toLowerCase()}${k === "stay_put" ? " — fire floor and the one above cleared, everyone else stays behind their doors" : k === "phased" ? " — fire floor, above and below first, then floor by floor" : " — whole block out, police on the stair"}`); }}>{l}</button>
        ))}
      </div>
    </Card>
  ) : null;

  const chem = sc.scene?.hazards.find((h) => h.kind === "chemical" && h.substance);
  const chemKnown = !!sim?.hazmatIdentified;
  const hazmatCard = chem?.substance ? (
    <Card title="Hazardous materials" icon="☣" headerExtra={<span className="pc-meta">{chemKnown ? chem.substance.name : "not identified"}</span>}>
      <dl className="pc-facts">
        <dt>Substance</dt><dd className={chemKnown ? "hi" : "stop"}>{chemKnown ? `${chem.substance.name}${chem.substance.unNumber ? ` · ${chem.substance.unNumber}` : ""}` : `Unknown — placard reads ${chem.substance.unNumber ?? "nothing legible"}${chem.substance.hazchem ? `, Hazchem ${chem.substance.hazchem}` : ""}`}</dd>
        <dt>Cordon</dt><dd className="warn">{chemKnown ? `${chem.substance.cordonM} m inner cordon — upwind, uphill` : "75 m initial cordon until it is identified"}</dd>
        <dt>Decon</dt><dd className={sim?.decontaminated ? "go" : chem.substance.decontamination ? "stop" : ""}>{sim?.decontaminated ? "Established — warm zone, everyone through it" : chem.substance.decontamination ? (chemKnown ? "Required — nobody leaves the warm zone unwashed" : "Assume required until identified") : "Not required"}</dd>
      </dl>
      <button type="button" className={`pc-mini wide${lastAssistance("hazmat") ? " done" : ""}`} disabled={!canAct} onClick={() => sendAssistance("hazmat", "Hazmat / DIM")}>{I.hazmat}<span>{lastAssistance("hazmat") ? "Hazmat / DIM requested ✓" : "Request Hazmat / DIM"}</span></button>
    </Card>
  ) : null;

  // ---- Fire command page: the IC's paperwork ---------------------------------
  const planCard = (
    <Card title="Command plan" icon="◆" fill headerExtra={plan.recordedAt ? <span className={`pc-meta${reviewOverdue ? " stop" : ""}`}>{reviewOverdue ? "REVIEW OVERDUE" : `recorded ${wall(plan.recordedAt)} · review in ${mmss(reviewLeft ?? 0)}`}</span> : undefined}>
      <div className="pc-sub">Objectives</div>
      <div className="fc-objectives">
        {OBJECTIVES.map((o) => (
          <button key={o.key} type="button" className={`fc-objective${plan.objectives[o.key] ? " on" : ""}`} onClick={() => set((p) => ({ ...p, objectives: { ...p.objectives, [o.key]: !p.objectives[o.key] } }))}>
            <i>{plan.objectives[o.key] ? "✓" : ""}</i>
            <div><strong>{o.label}</strong><span>{o.detail}</span></div>
          </button>
        ))}
      </div>
      <label className="pc-field"><span>Notes</span>
        <textarea className="pc-account short" value={plan.notes} placeholder="Plan notes, sector tasking, anything for the next IC…" onChange={(e) => { const v = e.target.value; set((p) => ({ ...p, notes: v })); }} />
      </label>
      <label className="pc-field inline"><span>Review every</span>
        <select value={plan.reviewMin} onChange={(e) => set((p) => ({ ...p, reviewMin: Number(e.target.value) }))}>{[5, 10, 15, 20].map((m) => <option key={m} value={m}>{m} min</option>)}</select>
      </label>
      <button type="button" className="pc-primary" disabled={resolvedIncident} onClick={recordPlan}>{I.note}<span>{plan.recordedAt ? "Record the plan again" : "Record the command plan"}</span></button>
    </Card>
  );

  const assessmentCard = (
    <Card title="Incident assessment" icon="▤" headerExtra={plan.assessedAt ? <span className="pc-meta">assessed {wall(plan.assessedAt)}</span> : undefined}>
      {([["lifeRisk", "Life risk", LIFE_RISK], ["fireSpread", "Fire spread", FIRE_SPREAD], ["structural", "Structure", STRUCTURAL], ["hazards", "Hazards", HAZARDS]] as const).map(([key, label, options]) => (
        <label key={key} className="pc-field inline"><span>{label}</span>
          <select value={assessment[key]} onChange={(e) => setDraftAssessment((d) => ({ ...d, [key]: e.target.value }))}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
        </label>
      ))}
      <button type="button" className="pc-mini wide" disabled={!assessmentDirty || resolvedIncident} onClick={updateAssessment}>{I.note}<span>Record the assessment</span></button>
    </Card>
  );

  const sectorsCard = (
    <Card title="Sectors" icon="◔" fill headerExtra={<span className="pc-meta">{Object.values(plan.sectors).filter((x) => x.commander).length} of {sectors.length} commanded</span>}>
      {sectors.length === 0 ? <p className="pc-note">No sector plan on this scene — a single-sector job.</p> : (
        <div className="fc-sectors">
          {sectors.map((sec) => {
            const a = plan.sectors[String(sec.id)] ?? { applianceIds: [] };
            return (
              <div key={sec.id} className={`fc-sector${a.commander ? " on" : ""}`}>
                <div className="fc-sector-head"><b>{sec.label}</b><small>{sec.face} · {sec.bearingDeg}°</small></div>
                <label className="pc-field inline"><span>Commander</span>
                  {a.commander ? <output className="hi"><i className="dot go" />{a.commander.name} · {a.commander.callsign}</output> : (
                    <select value={sectorPick[String(sec.id)] ?? ""} disabled={!canAct} onChange={(e) => { setSectorPick((m) => ({ ...m, [String(sec.id)]: e.target.value })); if (e.target.value) setSectorCommander(String(sec.id), e.target.value); }}>
                      <option value="">Not assigned · pick</option>
                      {allCrew.filter((x) => /Manager|Officer|Commander/i.test(x.c.role)).map((x) => <option key={x.c.id} value={x.c.id} disabled={props.busyCrewIds?.has(x.c.id)}>{x.c.name} · {x.c.role} · {x.callsign}</option>)}
                    </select>
                  )}
                </label>
                <label className="pc-field inline"><span>Task</span>
                  <select value={a.task ?? ""} disabled={!canAct} onChange={(e) => e.target.value && setSectorTask(String(sec.id), e.target.value)}>
                    <option value="">Not set</option>
                    {SECTOR_TASKS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <div className="fc-sector-units">
                  {committed.filter((r) => r.appliance.service === "Fire").map((r) => (
                    <button key={r.appliance.id} type="button" className={`fc-chip${a.applianceIds.includes(r.appliance.id) ? " on" : ""}`} disabled={!canAct} onClick={() => toggleSectorAppliance(String(sec.id), r.appliance.id)}>{r.appliance.callsign}</button>
                  ))}
                  {committed.filter((r) => r.appliance.service === "Fire").length === 0 && <span className="pc-note">No appliances committed</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );

  const roleOf = (a: Appliance) => plan.applianceRoles[a.id] ?? (active.some((t) => t.applianceId === a.id) ? TASK_LABEL[active.find((t) => t.applianceId === a.id)!.kind] : null) ?? "Unassigned";
  const appliancesCard = (
    <Card title="Appliances and crews" icon="▣" fill headerExtra={<span className="pc-meta">{committed.length} committed</span>}>
      <table className="pc-table">
        <thead><tr><th>Appliance</th><th>Status</th><th>Role</th></tr></thead>
        <tbody>
          {committed.length === 0 && <tr><td colSpan={3} className="empty">No appliances committed yet</td></tr>}
          {committed.map((r) => (
            <tr key={r.appliance.id}>
              <td><b>{r.appliance.callsign}</b><small>{r.appliance.typeName} · {r.appliance.crewMembers.length} crew</small></td>
              <td><i className={`dot ${r.phase === "at_incident" ? (active.some((t) => t.applianceId === r.appliance.id) ? "work" : "go") : "warn"}`} />{r.phase === "at_incident" ? (active.some((t) => t.applianceId === r.appliance.id) ? "Working" : "On scene") : "En route"}</td>
              <td>{roleOf(r.appliance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pc-sub">Assign a role</div>
      <label className="pc-field inline"><span>Appliance</span>
        <select value={assignAppliance} onChange={(e) => setAssignAppliance(e.target.value)}>
          <option value="">Pick an appliance</option>
          {committed.map((r) => <option key={r.appliance.id} value={r.appliance.id}>{r.appliance.callsign} · {r.appliance.typeName}</option>)}
        </select>
      </label>
      <label className="pc-field inline"><span>Role</span>
        <select value={assignRole} onChange={(e) => setAssignRole(e.target.value)}>
          <option value="">Pick a role</option>
          {APPLIANCE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>
      <button type="button" className="pc-mini wide" disabled={!assignAppliance || !assignRole || resolvedIncident} onClick={assignResource}>{I.note}<span>Assign</span></button>
    </Card>
  );

  const fatigue = props.fatigueByApplianceId ?? {};
  const fatigueRows = onScene.filter((r) => r.appliance.service === "Fire").map((r) => ({ r, f: Math.round(fatigue[r.appliance.id] ?? 0) })).sort((a, b) => b.f - a.f);
  const tired = fatigueRows.filter((x) => x.f >= 60);
  const reliefsSent = plan.assistance.filter((x) => x.id.startsWith("relief:"));
  const reliefCard = (
    <Card title="Reliefs" icon="⏱" headerExtra={<span className="pc-meta">{tired.length ? `${tired.length} crew${tired.length === 1 ? "" : "s"} spent` : "crews fresh"}</span>}>
      {fatigueRows.length === 0 ? <p className="pc-note">No fire crews on the ground yet.</p> : (
        <div className="fc-fatigue">
          {fatigueRows.map(({ r, f }) => (
            <div key={r.appliance.id} className={f >= 75 ? "stop" : f >= 60 ? "warn" : ""}>
              <span>{r.appliance.callsign}</span>
              <i style={{ width: `${Math.max(0, Math.min(100, f))}%` }} />
              <b>{f >= 75 ? `${f}% · relieve now` : f >= 60 ? `${f}% · tiring` : `${f}%`}</b>
            </div>
          ))}
        </div>
      )}
      <div className="fc-assist-pumps">
        <span className="lbl">Relief pumps</span>
        <div className="fc-stepper">
          <button type="button" disabled={!canAct} onClick={() => setReliefN((n) => Math.max(1, n - 1))}>−</button>
          <output>{reliefN}</output>
          <button type="button" disabled={!canAct} onClick={() => setReliefN((n) => Math.min(6, n + 1))}>+</button>
        </div>
        <button type="button" className="pc-primary" disabled={!canAct} title="A fresh pump stands the most tired crew down when it lands" onClick={() => sendAssistance("relief", `Relief pumps ${reliefN}`, String(reliefN))}>{I.phone}<span>Request relief · {reliefN}</span></button>
      </div>
      {reliefsSent.length > 0 && <p className="pc-note">Asked for: {reliefsSent.slice(-3).map((x) => `${x.label} (${wall(x.at)})`).join(" · ")}</p>}
    </Card>
  );

  // ---- RTC page: the vehicles, made safe and opened up -------------------------
  const crsVehicles = sc.crs ?? [];
  const rtcVehicle = crsVehicles.find((v) => v.id === rtcVehicleId) ?? crsVehicles[0] ?? null;
  const crsState = (vehicleId: string, actionId: string): { state: "ready" } | { state: "active"; task: Task } | { state: "done"; task: Task } => {
    const list = tasks.filter((t) => t.kind === "crs_action" && t.crsVehicleId === vehicleId && t.crsActionId === actionId && t.state !== "aborted");
    const done = list.find((t) => t.state === "completed");
    if (done) return { state: "done", task: done };
    const running = list.find((t) => t.state === "active");
    return running ? { state: "active", task: running } : { state: "ready" };
  };
  const keyDone = (v: CrsVehicle, key: string) => crsState(v.id, key).state === "done" || crsState(v.id, `std-${key}`).state === "done";
  const carriesKit = (needle: string) => appliance.kit.some((k) => k.toLowerCase().includes(needle.toLowerCase()));
  const criticalOf = (v: CrsVehicle) => [...datasheetActions(v).filter((a) => a.critical).map((a) => a.id), ...SPACE_CREATION.filter((a) => a.critical && !datasheetActions(v).some((d) => `std-${d.id}` === a.id)).map((a) => a.id)];
  const madeSafe = (v: CrsVehicle) => criticalOf(v).every((id) => crsState(v.id, id).state === "done");
  const criticalDone = (v: CrsVehicle) => criticalOf(v).filter((id) => crsState(v.id, id).state === "done").length;
  const extrication = tasks.find((t) => t.kind === "rtc_extrication" && t.state === "active") ?? tasks.find((t) => t.kind === "rtc_extrication" && t.state === "completed");
  const crsRunningHere = mine.filter((t) => t.kind === "crs_action").length;
  function startCrs(v: CrsVehicle, a: { id: string; label: string; durationSec: number; minCrew: number }, doneMessage: string) {
    const crew = freeCrew.slice(0, a.minCrew).map((c) => c.id);
    if (crew.length < a.minCrew) return;
    props.onStartTask?.({ applianceId: appliance.id, kind: "crs_action", assignedCrewIds: crew, crsVehicleId: v.id, crsActionId: a.id, crsDurationSec: a.durationSec, crsLabel: `${a.label} · ${v.vrm}`, crsDoneMessage: doneMessage });
  }
  const rtcActionRow = (v: CrsVehicle, a: { id: string; label: string; detail?: string; durationSec: number; minCrew: number; critical?: boolean }, doneMessage: string, blockedBy: string | null) => {
    const st = crsState(v.id, a.id);
    const short = freeCrew.length < a.minCrew;
    const disabled = !canAct || st.state !== "ready" || short || !!blockedBy;
    const hint = blockedBy ?? (short ? `${a.minCrew} needed · ${freeCrew.length} free on ${appliance.callsign}` : `${a.minCrew} crew · ${Math.round(a.durationSec / 60)} min`);
    return (
      <div key={a.id} className={`fc-rtc-action${st.state === "done" ? " done" : st.state === "active" ? " on" : ""}${a.critical ? " critical" : ""}`}>
        <div className="txt">
          <b>{a.label}{a.critical ? <em title="Counts toward the vehicle being made safe">CRITICAL</em> : null}</b>
          <small>{st.state === "done" ? doneMessage : a.detail ?? ""}</small>
          <span className="meta">{st.state === "done" ? `Done ${wall(st.task.completesAt ?? st.task.startedAt)}` : st.state === "active" ? `${callsignOf(st.task.applianceId)} · ${mmss(Math.max(0, (st.task.completesAt ?? now) - now))} to go` : hint}</span>
        </div>
        {st.state === "ready" && <button type="button" className="pc-mini" disabled={disabled} title={hint} onClick={() => startCrs(v, a, doneMessage)}>Start</button>}
        {st.state === "active" && <button type="button" className="pc-mini" onClick={() => props.onAbortTask?.(st.task.id)}>Abort</button>}
        {st.state === "done" && <span className="fc-rtc-tick">✓</span>}
      </div>
    );
  };
  const rtcPage = (
    <>
      <div className="pc-col">
        <Card title="Vehicles" icon="▣" fill headerExtra={<span className="pc-meta">{crsVehicles.length ? `${crsVehicles.filter(madeSafe).length} of ${crsVehicles.length} made safe` : "no vehicles"}</span>}>
          {crsVehicles.length === 0 ? <p className="pc-note">No vehicles on this job. When a job carries a crash, the vehicles sit here with their datasheets and the crew makes them safe and opens them up from this page.</p> : (
            <div className="fc-rtc-vehicles column">
              {crsVehicles.map((v) => {
                const safe = madeSafe(v);
                return (
                  <button key={v.id} type="button" className={`fc-rtc-veh${rtcVehicle?.id === v.id ? " on" : ""}${safe ? " safe" : ""}`} aria-pressed={rtcVehicle?.id === v.id} onClick={() => setRtcVehicleId(v.id)}>
                    <span className="anpr-plate">{v.vrm}</span>
                    <b>{v.make} {v.model}</b>
                    <small>{v.years} · {v.body} · {v.fuel === "bev" ? "ELECTRIC · HV" : v.fuel === "phev" ? "PLUG-IN HYBRID" : v.fuel.toUpperCase()}</small>
                    <em className={safe ? "go" : "warn"}>{safe ? "MADE SAFE" : `${criticalDone(v)}/${criticalOf(v).length} critical done`}</em>
                  </button>
                );
              })}
            </div>
          )}
          {rtcVehicle && (
            <>
              <div className="pc-sub">Datasheet · {rtcVehicle.make} {rtcVehicle.model}</div>
              <ul className="pc-findings">{rtcVehicle.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
              <div className="pc-sub">On the schematic</div>
              <div className="fc-rtc-comps">{rtcVehicle.components.map((c, i) => <span key={i} className={`fc-chip ${c.kind}`}>{c.label}</span>)}</div>
            </>
          )}
        </Card>
      </div>
      <div className="pc-col">
        <Card title={rtcVehicle ? `Make safe · ${rtcVehicle.vrm}` : "Make safe"} icon="⚙" fill headerExtra={<span className="pc-meta">{freeCrew.length} free on {appliance.callsign}{!carriesKit("Hydraulic") ? " · no hydraulic kit" : ""}</span>}>
          {!rtcVehicle ? <p className="pc-note">Pick a vehicle.</p> : (
            <>
              <div className="fc-rtc-actions">{datasheetActions(rtcVehicle).map((a) => rtcActionRow(rtcVehicle, a, a.done, null))}</div>
              <div className="pc-sub">Space creation · in the order the car allows</div>
              <div className="fc-rtc-actions">
                {SPACE_CREATION.filter((a) => !datasheetActions(rtcVehicle).some((d) => `std-${d.id}` === a.id)).map((a) => {
                  const missingKit = a.kit && !carriesKit(a.kit) ? `Needs ${a.kit.toLowerCase()} rescue kit — not on ${appliance.callsign}` : null;
                  const waiting = (a.after ?? []).filter((k) => !keyDone(rtcVehicle, k));
                  const blocked = missingKit ?? (waiting.length ? `After ${waiting.map((k) => k.replace(/-/g, " ")).join(" and ")}` : null);
                  return rtcActionRow(rtcVehicle, a, a.done(rtcVehicle.vrm), blocked);
                })}
              </div>
            </>
          )}
        </Card>
      </div>
      <div className="pc-col">
        <Card title="Extrication" icon="●">
          <label className="pc-field inline"><span>Vehicles</span><output className={crsVehicles.length && crsVehicles.every(madeSafe) ? "hi" : ""}>{crsVehicles.length === 0 ? "—" : crsVehicles.every(madeSafe) ? "All made safe — controlled release" : crsVehicles.map((v) => `${v.vrm}: ${criticalOf(v).filter((id) => crsState(v.id, id).state !== "done").length} outstanding`).join(" · ")}</output></label>
          <label className="pc-field inline"><span>Crew</span><output>{freeCrew.length} free · 4 needed{!carriesKit("Hydraulic") ? " · no hydraulic kit" : ""}</output></label>
          {extrication ? (
            <div className={`fc-rtc-action${extrication.state === "completed" ? " done" : " on"}`}>
              <div className="txt"><b>Release the casualty</b><small>{extrication.state === "completed" ? "Casualty released to the ambulance crew" : `${callsignOf(extrication.applianceId)} cutting · ${mmss(Math.max(0, (extrication.completesAt ?? now) - now))} to go`}</small></div>
              {extrication.state === "active" && <button type="button" className="pc-mini" onClick={() => props.onAbortTask?.(extrication.id)}>Abort</button>}
              {extrication.state === "completed" && <span className="fc-rtc-tick">✓</span>}
            </div>
          ) : (
            <>
              {crsVehicles.length > 0 && !crsVehicles.every(madeSafe) && infoLine("Cutting on a vehicle that is not made safe goes in the log and the debrief.", "warn")}
              <button type="button" className={`pc-primary${crsVehicles.length && crsVehicles.every(madeSafe) ? "" : " running"}`} disabled={!canAct || crsVehicles.length === 0 || freeCrew.length < 4 || !carriesKit("Hydraulic")} title={!carriesKit("Hydraulic") ? "Hydraulic rescue kit needed" : freeCrew.length < 4 ? `Four hands needed · ${freeCrew.length} free` : ""} onClick={() => props.onStartTask?.({ applianceId: appliance.id, kind: "rtc_extrication", assignedCrewIds: freeCrew.slice(0, 4).map((c) => c.id) })}>
                {I.cut}<span>{crsVehicles.every(madeSafe) ? "Release the casualty — controlled" : "Release the casualty now"}</span>
              </button>
            </>
          )}
        </Card>
        {personsCard}
        {logCard()}
      </div>
    </>
  );

  // ---- Screen ---------------------------------------------------------------------
  return (
    <div className="pc-screen" role="region" aria-label="Fire and rescue command">
      <header className="fc-head">
        <div className="fc-brand">
          <Icon d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z" />
          <h1>FIRE & RESCUE COMMAND <span>SIMULATION</span></h1>
        </div>
        <div className="fc-head-right">
          <span className="fc-who">{incidentRef}</span>
          <div className="fc-time"><small>SCENARIO TIME</small><strong>{clock(now - incident.receivedAt)}</strong></div>
          {props.onClose && <button type="button" className="fc-close" onClick={props.onClose}>✕ Close</button>}
        </div>
      </header>

      <main className={`pc-main ${page}`}>
        {page === "actions" && (
          <>
            <div className="pc-col">
              {summaryCard}
              {resourceCard}
              {fireCard}
            </div>
            <div className="pc-col">{actionsCard}{tab === "general" && <>{activityCard}{logCard()}</>}</div>
            <div className="pc-col">
              {detailsCard}
              {tab === "general" && <>{commandCard}{supportCard}</>}
              {tab === "fire" && <>{baCard}{logCard()}</>}
              {tab === "rescue" && <>{personsCard}{highRiseCard}{baCard}</>}
              {tab === "water" && <>{waterCard}{logCard()}</>}
              {tab === "scene" && <>{hazardsCard}{hazmatCard}{logCard()}</>}
            </div>
          </>
        )}
        {page === "command" && (
          <>
            <div className="pc-col">{commandCard}{planCard}</div>
            <div className="pc-col">{assessmentCard}{sectorsCard}</div>
            <div className="pc-col">{appliancesCard}{reliefCard}{supportCard}</div>
          </>
        )}
        {page === "ba" && (
          <>
            <div className="pc-col">{baCard}{fireCard}</div>
            <div className="pc-col wide2">
              {baByAppliance.length === 0 ? (
                <Card title="Entry control board" icon="◉" fill>
                  <p className="pc-note">No BA team committed. Commit a team from Rescue — BA search and rescue — and the board opens here.</p>
                </Card>
              ) : (
                baByAppliance.map(({ appliance: a, teams }) => (
                  <Card key={a.id} title={`Entry control · ${a.callsign}`} icon="◉">
                    <div className="cc-legacy">
                      <BaControlBoard appliance={a} baTasks={teams} now={now} onUpdateRemarks={props.onUpdateBaRemarks} onUpdateEntryPoint={props.onUpdateBaEntryPoint} onWithdrawTeam={props.onAbortTask} />
                    </div>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
        {page === "rtc" && rtcPage}
        {page === "log" && (
          <>
            <div className="pc-col">{summaryCard}{resourceCard}</div>
            <div className="pc-col wide2">{logCard(true)}</div>
          </>
        )}
      </main>

      <footer className="fc-foot pc-foot">
        <button type="button" aria-pressed={page === "actions"} onClick={() => setPage("actions")}>{I.note}<span>Resource actions</span>{mine.length > 0 && <em>{mine.length}</em>}</button>
        <button type="button" aria-pressed={page === "command"} onClick={() => setPage("command")}>{I.command}<span>Fire command</span>{reviewOverdue && <em>!</em>}</button>
        <button type="button" aria-pressed={page === "ba"} onClick={() => setPage("ba")}>{I.ba}<span>BA control</span>{baTasks.length > 0 && <em>{baTasks.length}</em>}</button>
        <button type="button" aria-pressed={page === "rtc"} onClick={() => setPage("rtc")}>{I.car}<span>RTC</span>{crsRunningHere > 0 && <em>{crsRunningHere}</em>}</button>
        <button type="button" aria-pressed={page === "log"} onClick={() => setPage("log")}>{I.clockI}<span>Log</span></button>
      </footer>
    </div>
  );
}

function Card({ title, icon, children, fill, headerExtra }: { title: string; icon: string; children: ReactNode; fill?: boolean; headerExtra?: ReactNode }) {
  return (
    <section className={`pc-card${fill ? " fill" : ""}`}>
      <header><b>{icon}</b><span>{title.toUpperCase()}</span>{headerExtra}</header>
      <div className="pc-card-body">{children}</div>
    </section>
  );
}
