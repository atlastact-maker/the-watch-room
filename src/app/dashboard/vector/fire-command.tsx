"use client";

// FIRE & RESCUE COMMAND — the MDT's fire module.
//
//   roles strip: incident commander · command support · safety officer
//   ┌ INCIDENT SUMMARY ┬ COMMAND PLAN            ┬ APPLIANCES & CREWS ┐
//   │ type · location  │ objectives · notes ·    │ table · assign     │
//   │ scene map        │ review · record plan    ├ WATER SUPPLY       │
//   ├ INCIDENT         ├ CREW TASKING            │ source · status    │
//   │ ASSESSMENT       │ four functions          ├ BA ENTRY CONTROL   │
//   └──────────────────┴ INCIDENT LOG ───────────┴ teams              ┘
//    Overview · Assessment · Crews · Appliances · Water supply · BA control · Incident log
//
// Everything on it is the simulator's: units, tasks, the fire, hazards,
// casualties, BA teams and water come from the incident; objectives,
// assessment, roles and the supply picture are the commander's own
// record (command-store.ts) and go to the shift log when recorded.

import { useState, type ReactNode } from "react";
import type { Appliance } from "@/lib/sim/types";
import type { CrsAction, CrsVehicle, Incident, LogEntry, Task, TaskKind } from "@/lib/sim/incident_types";
import { hasWaterSupplyChain } from "@/lib/sim/incident_types";
import type { IncidentSimState } from "@/lib/sim/incident_sim";
import type { ResolvedDeployment } from "../components/incident-view";
import { SceneCanvas } from "../components/scene-canvas";
import { BaControlBoard } from "../components/ba-control-board";
import { MdtTaskWorkspace, type TaskWorkspaceProps } from "./mdt-task-workspace";
import { updatePlan, useCommandPlan, type CommandPlan } from "./command-store";

type Tab = "overview" | "assessment" | "sectors" | "crews" | "appliances" | "water" | "rtc" | "ba" | "log";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "assessment", label: "Assessment" },
  { key: "sectors", label: "Sectors" },
  { key: "crews", label: "Crews" },
  { key: "appliances", label: "Appliances" },
  { key: "water", label: "Water" },
  { key: "rtc", label: "RTC" },
  { key: "ba", label: "BA control" },
  { key: "log", label: "Log" },
];

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
  /** Generic keys — "stabilise", "glass", "doors-off" — satisfied by the
   *  datasheet's action of that id or the std- one. */
  after?: string[];
  /** Kit the appliance has to carry, matched loosely against its list. */
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

const SECTOR_TASKS = ["Firefighting", "Search and rescue", "Water supply", "Exposure protection", "Ventilation", "Salvage", "Cordon and safety"];

/** The assistance messages a commander sends to control. Make pumps
 *  carries a number; the rest are one request each. */
const ASSISTANCE: { kind: string; label: string; wording: string }[] = [
  { kind: "ambulance", label: "Ambulance", wording: "requests an ambulance to scene" },
  { kind: "police", label: "Police", wording: "requests police for cordon and traffic" },
  { kind: "aerial", label: "Aerial", wording: "requests an aerial appliance" },
  { kind: "water_carrier", label: "Water carrier", wording: "requests a water carrier / high volume pump" },
  { kind: "hazmat", label: "Hazmat", wording: "requests the hazardous materials unit" },
  { kind: "command_unit", label: "Command unit", wording: "requests the incident command unit" },
  { kind: "gas_board", label: "Gas board", wording: "requests the gas emergency service" },
  { kind: "electricity", label: "Electricity", wording: "requests the DNO to isolate" },
];

const TACTICAL: { mode: "offensive" | "defensive" | "transitional"; label: string; hint: string }[] = [
  { mode: "offensive", label: "Offensive", hint: "Crews committed inside — BA and interior attack" },
  { mode: "defensive", label: "Defensive", hint: "Nobody inside — exterior attack, protect exposures" },
  { mode: "transitional", label: "Transitional", hint: "Changing from one to the other — everyone out or everyone in" },
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

const FUNCTIONS: { key: string; label: string; kinds: TaskKind[]; tab: Tab; icon: ReactNode }[] = [
  { key: "firefighting", label: "Firefighting", kinds: ["hose_attack", "aerial_monitor", "wildfire_beating", "wildfire_knapsack", "firebreak"], tab: "crews", icon: <Icon d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z" /> },
  { key: "sar", label: "Search & rescue", kinds: ["ba_sar", "survey", "extract_casualty", "aerial_rescue", "rope_rescue", "water_rescue", "rtc_extrication"], tab: "crews", icon: <Icon d="M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm5 11 5 5" /> },
  { key: "water", label: "Water supply", kinds: ["connect_hydrant", "relay_hose"], tab: "water", icon: <Icon d="M12 3s5 6 5 10a5 5 0 0 1-10 0c0-4 5-10 5-10z" /> },
  { key: "safety", label: "Public safety", kinds: ["cordon", "traffic_mgmt", "close_road", "close_carriageway", "mitigate_hazard", "scene_preservation"], tab: "crews", icon: <Icon d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /> },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
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
  /** The declared tactical mode and the way to change it. */
  tacticalMode?: "offensive" | "defensive" | "transitional" | null;
  onDeclareTacticalMode?: (mode: "offensive" | "defensive" | "transitional") => void;
  /** An assistance message to control: make pumps N, ambulance, police… */
  onRequestSupport?: (kind: string, applianceId: string, detail?: string) => void;
  structural?: { integrity: number; collapsedAt: number | null; evacuatedAt: number | null; injured: number };
  onEvacuate?: () => void;
  waterClock?: Record<string, number | null>;
  /** Crew fatigue 0–100 by appliance, for the relief picture. */
  fatigueByApplianceId?: Record<string, number>;
};

export function FireCommandScreen(props: FireCommandProps) {
  const { incident, incidentRef, appliance, unit, resolved, tasks, log, now, sim, sceneCommanderApplianceId, resolvedIncident } = props;
  const plan = useCommandPlan(incident.id);
  const [tab, setTab] = useState<Tab>("overview");
  const [taskPage, setTaskPage] = useState<"actions" | "water">("actions");
  const [assignAppliance, setAssignAppliance] = useState("");
  const [assignRole, setAssignRole] = useState("");
  const [supportPick, setSupportPick] = useState("");
  const [safetyPick, setSafetyPick] = useState("");
  const [waterSource, setWaterSource] = useState<string | null>(null);
  const [waterStatus, setWaterStatus] = useState<string | null>(null);
  const [draftAssessment, setDraftAssessment] = useState<Partial<CommandPlan["assessment"]>>({});
  const [makePumps, setMakePumps] = useState(0);
  const [sectorPick, setSectorPick] = useState<Record<string, string>>({});
  const [rtcVehicleId, setRtcVehicleId] = useState<string | null>(null);
  const [reliefN, setReliefN] = useState(1);
  const sc = incident.scenario;
  const set = (fn: (p: CommandPlan) => CommandPlan) => updatePlan(incident.id, fn);
  const note = (text: string) => props.onNote?.(`${appliance.callsign} · ${text}`);

  // ---- Who is on the ground -----------------------------------------------
  const committed = resolved.filter((r) => r.phase === "at_incident" || r.phase === "mobile");
  const onScene = committed.filter((r) => r.phase === "at_incident");
  const fireOnScene = onScene.filter((r) => r.appliance.service === "Fire");
  const active = tasks.filter((t) => t.state === "active");
  const commanderUnit = sceneCommanderApplianceId ? resolved.find((r) => r.appliance.id === sceneCommanderApplianceId) : null;
  const isCommander = sceneCommanderApplianceId === appliance.id;
  const officer = appliance.crewMembers.find((c) => /Manager|Officer/i.test(c.role)) ?? appliance.crewMembers[0];
  const canAct = !resolvedIncident && unit.phase === "at_incident";

  const derivedRole = (a: Appliance): string | null => {
    const mine = active.filter((t) => t.applianceId === a.id);
    for (const f of FUNCTIONS) if (mine.some((t) => f.kinds.includes(t.kind))) return f.label;
    if (mine.some((t) => t.kind === "commander")) return "Command";
    return null;
  };
  const roleOf = (a: Appliance) => plan.applianceRoles[a.id] ?? derivedRole(a) ?? "Unassigned";
  const statusOf = (r: ResolvedDeployment) =>
    r.phase === "at_incident" ? (active.some((t) => t.applianceId === r.appliance.id) ? "Working" : "On scene") : r.phase === "mobile" ? "En route" : r.phase.replace(/_/g, " ");

  // ---- The fire, the people, the hazards ----------------------------------
  const fireStage = sim?.fireStage ?? "none";
  const located = sim ? sim.foundCasualties.filter((c) => (sim.casualtyProgression[c.id]?.stage ?? "located") !== "undiscovered") : [];
  const plannedCasualties = sim ? Object.keys(sim.casualtyProgression).filter((id) => !sim.absentCasualtyIds.includes(id)).length : 0;
  const personsReported = sc.type.includes("persons_reported") || plannedCasualties > 0;
  const personsText = located.length
    ? `${located.length} located${plannedCasualties > located.length ? ` · ${plannedCasualties - located.length} unaccounted` : ""}`
    : personsReported
      ? `Reported · ${sc.property.occupants}`
      : "None reported";
  const hazards = sim?.visibleHazards ?? [];
  const utilities = (() => {
    const gas = hazards.find((h) => h.kind === "gas");
    const elec = hazards.find((h) => h.kind === "electrical");
    const iso = (h: { id: string } | undefined) => h && sim?.mitigatedHazardIds.includes(h.id);
    const parts: string[] = [];
    if (gas) parts.push(`Gas ${iso(gas) ? "isolated" : "LIVE"}`);
    if (elec) parts.push(`Electric ${iso(elec) ? "isolated" : "LIVE"}`);
    if (!gas && !elec && sc.property.knownHazards.length) parts.push(sc.property.knownHazards[0]);
    return parts.length ? parts.join(" · ") : "Unknown";
  })();

  // ---- Water ----------------------------------------------------------------
  const gauge = props.vehicleGauges?.[appliance.id];
  const tankPct = Math.round(gauge?.waterPct ?? appliance.waterPct);
  const supplied = hasWaterSupplyChain(appliance.id, tasks);
  const pumpOn = unit.deployment.pumpRunning === true;
  const hydrantLabels = (sc.scene?.hydrants ?? []).map((h) => h.label);
  const waterSources = ["Tank water", ...hydrantLabels.map((l) => `Hydrant ${l}`), ...fireOnScene.filter((r) => r.appliance.id !== appliance.id && r.appliance.waterLitres > 0).map((r) => `Relay from ${r.appliance.callsign}`), "Open water", "Not confirmed"];
  const supplyStatusLive = supplied ? "Established" : plan.water.status;
  const waterActive = active.filter((t) => t.applianceId === appliance.id && (t.kind === "connect_hydrant" || t.kind === "relay_hose"));

  // ---- BA ---------------------------------------------------------------------
  const baTasks = active.filter((t) => t.kind === "ba_sar");
  const baByAppliance = onScene
    .map((r) => ({ appliance: r.appliance, teams: baTasks.filter((t) => t.applianceId === r.appliance.id) }))
    .filter((x) => x.teams.length > 0);
  const freeCrew = appliance.crewMembers.filter((c) => !props.busyCrewIds?.has(c.id));

  // ---- Log --------------------------------------------------------------------
  const incidentLog = log.filter((e) => e.timestamp >= incident.receivedAt);
  const recent = incidentLog.slice(-4).reverse();

  // ---- Command plan -----------------------------------------------------------
  const chosen = OBJECTIVES.filter((o) => plan.objectives[o.key]);
  const reviewLeft = plan.reviewDueAt ? plan.reviewDueAt - now : null;
  const reviewOverdue = reviewLeft !== null && reviewLeft <= 0;
  const assessment = { ...plan.assessment, ...draftAssessment };
  const assessmentDirty = Object.keys(draftAssessment).length > 0;

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
  function assignRole2(kind: "commandSupport" | "safetyOfficer", crewId: string) {
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
  const sectors = sc.scene?.sectors ?? [];
  const allCrew = committed.flatMap((r) => r.appliance.crewMembers.map((c) => ({ c, callsign: r.appliance.callsign })));
  function setSectorCommander(sectorId: string, crewId: string) {
    const hit = allCrew.find((x) => x.c.id === crewId);
    if (!hit) return;
    set((p) => ({ ...p, sectors: { ...p.sectors, [sectorId]: { ...(p.sectors[sectorId] ?? { applianceIds: [] }), commander: { crewId: hit.c.id, name: hit.c.name, callsign: hit.callsign } } } }));
    props.onNote?.(`[sector-cmd] ${appliance.callsign} · ${sectors.find((x) => String(x.id) === sectorId)?.label ?? `Sector ${sectorId}`} · commander ${hit.c.name} (${hit.callsign})`);
  }
  function toggleSectorAppliance(sectorId: string, applianceId: string) {
    const cs = committed.find((r) => r.appliance.id === applianceId)?.appliance.callsign ?? applianceId;
    let added = false;
    set((p) => {
      const cur = p.sectors[sectorId] ?? { applianceIds: [] };
      const has = cur.applianceIds.includes(applianceId);
      added = !has;
      const next: Record<string, typeof cur> = { ...p.sectors };
      // An appliance works one sector at a time.
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
  const pumpsOnScene = committed.filter((r) => r.appliance.service === "Fire" && r.appliance.waterLitres > 0).length;
  const [emergPick, setEmergPick] = useState<string[]>([]);
  const baCapable = onScene.filter((r) => r.appliance.service === "Fire").flatMap((r) => r.appliance.crewMembers.filter((c) => /\bBA\b|Breathing Apparatus/i.test(c.quals.join(" "))).map((c) => ({ c, callsign: r.appliance.callsign })));
  function nominateEmergencyTeam() {
    const picked = baCapable.filter((x) => emergPick.includes(x.c.id));
    if (picked.length < 2) return;
    set((p) => ({ ...p, emergencyTeam: { crewIds: picked.map((x) => x.c.id), names: picked.map((x) => x.c.name), callsign: picked[0].callsign, at: now } }));
    props.onNote?.(`[ba-emerg-team] ${appliance.callsign} · BA emergency team nominated at entry control — ${picked.map((x) => x.c.name).join(" and ")} (${picked[0].callsign})`);
    setEmergPick([]);
  }
  const integrity = props.structural?.integrity ?? 100;
  const collapsed = !!props.structural?.collapsedAt;
  const structureTone = collapsed ? "stop" : integrity < 25 ? "stop" : integrity < 55 ? "warn" : "go";
  const structureText = collapsed ? "COLLAPSED" : integrity < 25 ? "Collapse imminent — withdraw" : integrity < 55 ? "Compromised — restrict entry" : integrity < 85 ? "Fire-damaged — monitor" : "Sound";
  const waterLeft = props.waterClock?.[appliance.id];

  // ---- Pieces ---------------------------------------------------------------
  const tasking = (page: "actions" | "water") => (
    <div className="vec-mdt-body page vec-tasking fc-tasking">
      <MdtTaskWorkspace
        key={`${page}:${appliance.id}`}
        page={page}
        incident={incident}
        incidentRef={incidentRef}
        appliance={appliance}
        phase={unit.phase}
        onScene={onScene.map((r) => r.appliance)}
        tasks={tasks}
        now={now}
        busyCrewIds={props.busyCrewIds}
        hazards={hazards.map((h) => ({ id: h.id, label: h.label, kind: h.kind }))}
        casualties={(sim?.foundCasualties ?? []).map((c) => ({ id: c.id, label: c.label }))}
        resolved={resolvedIncident}
        onStartTask={props.onStartTask}
        onAbortTask={props.onAbortTask}
        onCompleteTask={props.onCompleteTask}
        onSetTaskCrew={props.onSetTaskCrew}
        onNote={props.onNote}
        onBeginRoadClosure={props.onBeginRoadClosure ? (kind, crewIds) => props.onBeginRoadClosure?.(appliance.id, kind, crewIds) : undefined}
        pumpReady={pumpOn && !!unit.deployment.pumpOperatorCrewId}
        pumpOperatorName={appliance.crewMembers.find((c) => c.id === unit.deployment.pumpOperatorCrewId)?.name}
        onStartPump={
          props.onSetPumpOperator && props.onSetPumpRunning
            ? () => {
                const op = appliance.crewMembers.find((c) => c.id === unit.deployment.pumpOperatorCrewId) ?? appliance.crewMembers.find((c) => /Pump|Driver/i.test(c.role)) ?? appliance.crewMembers[0];
                if (!op) return;
                props.onSetPumpOperator?.(appliance.id, op.id);
                props.onSetPumpRunning?.(appliance.id, true);
              }
            : undefined
        }
      />
    </div>
  );

  const summaryCard = (
    <Card title="Incident summary" icon="▤" fill>
      <dl className="fc-facts">
        <dt>Type</dt><dd className="hi">{typeLabel(sc.type)}</dd>
        <dt>Location</dt><dd>{sc.location.address}</dd>
        <dt>Attendance</dt><dd>{committed.length} committed · {onScene.length} on scene{pumpsOnScene ? ` · ${pumpsOnScene} pump${pumpsOnScene === 1 ? "" : "s"}` : ""}</dd>
        <dt>Commander</dt><dd className={isCommander ? "go" : commanderUnit ? "" : "stop"}>{isCommander ? `You · ${officer?.name ?? appliance.callsign}` : commanderUnit ? commanderUnit.appliance.callsign : "Not assigned"}</dd>
      </dl>
      <div className="fc-map">
        {sc.scene ? (
          <SceneCanvas
            scene={sc.scene}
            deployments={onScene.map((r) => ({ deployment: r.deployment, callsign: r.appliance.callsign, service: r.appliance.service }))}
            live={sim ? { fireRadiusM: sim.fireRadiusM, smokeRadiusM: sim.smokeRadiusM, frontOffset: sim.frontOffset } : null}
          />
        ) : (
          <div className="vec-tile-empty">No scene plan for this incident</div>
        )}
      </div>
    </Card>
  );

  const suppressing = active.filter((t) => ["hose_attack", "aerial_monitor", "wildfire_beating", "wildfire_knapsack"].includes(t.kind));
  const fireCard = (
    <Card title="Fire picture" icon="🔥" headerExtra={sim ? <span className="fc-meta">{sim.fireMaterialKnown ? sim.fireMaterial ?? "" : "material not confirmed"}</span> : undefined}>
      <div className="fc-fire">
        <div className={`fc-fire-stage ${fireStage === "flashover_risk" || fireStage === "fully_developed" ? "stop" : fireStage === "developing" ? "warn" : fireStage === "under_control" || fireStage === "extinguished" ? "go" : ""}`}>
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
        <dl className="fc-facts">
          <dt>Jets</dt><dd className={suppressing.length ? "go" : ""}>{suppressing.length ? `${suppressing.length} working · ${[...new Set(suppressing.map((t) => resolved.find((r) => r.appliance.id === t.applianceId)?.appliance.callsign ?? t.applianceId))].join(", ")}` : "None in play"}</dd>
          <dt>BA</dt><dd className={baTasks.length ? "warn" : ""}>{baTasks.length ? `${baTasks.length} team${baTasks.length === 1 ? "" : "s"} under air` : "Nobody committed"}</dd>
          <dt>Persons</dt><dd className={located.length || personsReported ? "warn" : ""}>{personsText}</dd>
          <dt>Utilities</dt><dd className={/LIVE/.test(utilities) ? "stop" : ""}>{utilities}</dd>
          <dt>Mode</dt><dd className={props.tacticalMode ? "hi" : "stop"}>{props.tacticalMode ? TACTICAL.find((t) => t.mode === props.tacticalMode)?.label : "Not declared"}</dd>
          <dt>Structure</dt><dd className={structureTone}>{structureText}{props.structural?.injured ? ` · ${props.structural.injured} firefighter${props.structural.injured === 1 ? "" : "s"} injured` : ""}</dd>
        </dl>
        {props.structural && sim?.fireMaterial && sim.fireMaterial !== "vegetation" && (
          <div className={`fc-structure ${structureTone}`} title="Structural integrity — damage accrues while the fire is developed">
            <i style={{ width: `${Math.max(0, Math.min(100, integrity))}%` }} />
            <span>{collapsed ? "STRUCTURE FAILED" : `Structure ${Math.round(integrity)}%`}</span>
          </div>
        )}
        {collapsed && <div className="fc-fire-alert">STRUCTURAL COLLAPSE — nobody goes back in</div>}
        {props.onEvacuate && (
          <button type="button" className="fc-primary stop" disabled={resolvedIncident || collapsed} onClick={() => { if (window.confirm("Sound the evacuation whistles — every crew out of the building?")) props.onEvacuate?.(); }}>
            <Icon d="M12 3l9 16H3zM12 10v4m0 3h.01" /> {props.structural?.evacuatedAt ? `Evacuated ${mmss(now - props.structural.evacuatedAt)} ago · sound again` : "EVACUATE — everyone out"}
          </button>
        )}
      </div>
    </Card>
  );

  const sectorsCard = (full = false) => (
    <Card title="Sectors" icon="◔" fill={full} headerExtra={<span className="fc-meta">{Object.values(plan.sectors).filter((x) => x.commander).length} of {sectors.length} commanded</span>}>
      {sectors.length === 0 ? <p className="fc-note">No sector plan on this scene — a single-sector job.</p> : (
        <div className="fc-sectors">
          {sectors.map((sec) => {
            const a = plan.sectors[String(sec.id)] ?? { applianceIds: [] };
            return (
              <div key={sec.id} className={`fc-sector${a.commander ? " on" : ""}`}>
                <div className="fc-sector-head">
                  <b>{sec.label}</b>
                  <small>{sec.face} · {sec.bearingDeg}°</small>
                </div>
                <label className="fc-field inline"><span>Commander</span>
                  {a.commander ? <span className="val go"><i className="dot go" />{a.commander.name} · {a.commander.callsign}</span> : (
                    <select value={sectorPick[String(sec.id)] ?? ""} disabled={!canAct} onChange={(e) => { setSectorPick((m) => ({ ...m, [String(sec.id)]: e.target.value })); if (e.target.value) setSectorCommander(String(sec.id), e.target.value); }}>
                      <option value="">Not assigned · pick</option>
                      {allCrew.filter((x) => /Manager|Officer|Commander/i.test(x.c.role)).map((x) => <option key={x.c.id} value={x.c.id} disabled={props.busyCrewIds?.has(x.c.id)}>{x.c.name} · {x.c.role} · {x.callsign}</option>)}
                    </select>
                  )}
                </label>
                <label className="fc-field inline"><span>Task</span>
                  <select value={a.task ?? ""} disabled={!canAct} onChange={(e) => e.target.value && setSectorTask(String(sec.id), e.target.value)}>
                    <option value="">Not set</option>
                    {SECTOR_TASKS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <div className="fc-sector-units">
                  {committed.filter((r) => r.appliance.service === "Fire").map((r) => (
                    <button key={r.appliance.id} type="button" className={`fc-chip${a.applianceIds.includes(r.appliance.id) ? " on" : ""}`} disabled={!canAct} onClick={() => toggleSectorAppliance(String(sec.id), r.appliance.id)}>{r.appliance.callsign}</button>
                  ))}
                  {committed.filter((r) => r.appliance.service === "Fire").length === 0 && <span className="fc-note">No appliances committed</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );

  const assistanceCard = (
    <Card title="Assistance messages" icon="☎" headerExtra={<span className="fc-meta">{pumpsOnScene} pump{pumpsOnScene === 1 ? "" : "s"} on the job</span>}>
      <div className="fc-assist-pumps">
        <span className="lbl">Make pumps</span>
        <div className="fc-stepper">
          <button type="button" disabled={!canAct} onClick={() => setMakePumps((n) => Math.max(0, (n || pumpsOnScene) - 1))}>−</button>
          <output>{makePumps || pumpsOnScene + 1}</output>
          <button type="button" disabled={!canAct} onClick={() => setMakePumps((n) => (n || pumpsOnScene + 1) + 1)}>+</button>
        </div>
        <button type="button" className="fc-primary accent" disabled={!canAct || (makePumps || pumpsOnScene + 1) <= pumpsOnScene} onClick={() => { const n = makePumps || pumpsOnScene + 1; sendAssistance("make_pumps", `Make pumps ${n}`, String(n)); }}>Send · Make pumps {makePumps || pumpsOnScene + 1}</button>
      </div>
      <div className="fc-assist">
        {ASSISTANCE.map((a) => {
          const sent = [...plan.assistance].reverse().find((x) => x.id.startsWith(`${a.kind}:`));
          return <button key={a.kind} type="button" className={`fc-mini${sent ? " sent" : ""}`} disabled={!canAct} title={a.wording} onClick={() => sendAssistance(a.kind, a.label)}>{a.label}{sent ? ` ✓ ${mmss(now - sent.at)}` : ""}</button>;
        })}
      </div>
      {plan.assistance.length > 0 && <p className="fc-note">Sent: {plan.assistance.slice(-4).map((x) => `${x.label} (${clock(x.at - incident.receivedAt)})`).join(" · ")}</p>}
    </Card>
  );

  const assessmentCard = (full = false) => (
    <Card title="Incident assessment" icon="!" fill={full}>
      <div className="fc-form">
        {([["lifeRisk", "Life risk", LIFE_RISK], ["fireSpread", "Fire spread", FIRE_SPREAD], ["structural", "Structural condition", STRUCTURAL], ["hazards", "Hazards", HAZARDS]] as const).map(([k, label, opts]) => (
          <label key={k} className="fc-field">
            <span>{label}</span>
            <select value={assessment[k]} onChange={(e) => setDraftAssessment((d) => ({ ...d, [k]: e.target.value }))}>
              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        ))}
      </div>
      {full && (
        <>
          <div className="fc-sub">Hazards on scene · {hazards.length}</div>
          {hazards.length === 0 ? <p className="fc-note">None identified yet — a survey reveals them.</p> : (
            <ul className="fc-list">
              {hazards.map((h) => <li key={h.id}><b className={sim?.mitigatedHazardIds.includes(h.id) ? "go" : "stop"}>{sim?.mitigatedHazardIds.includes(h.id) ? "SAFE" : h.kind.toUpperCase()}</b>{h.label}</li>)}
            </ul>
          )}
          <div className="fc-sub">Premises</div>
          <dl className="fc-facts">
            <dt>Class</dt><dd>{sc.property.class}</dd>
            {sc.property.size && (<><dt>Size</dt><dd>{sc.property.size}</dd></>)}
            {sc.property.materials && (<><dt>Materials</dt><dd>{sc.property.materials}</dd></>)}
            <dt>Occupants</dt><dd>{sc.property.occupants}</dd>
            <dt>Access</dt><dd>{sc.property.access}</dd>
            {sc.property.vulnerabilities.length > 0 && (<><dt>Vulnerable</dt><dd className="warn">{sc.property.vulnerabilities.join(" · ")}</dd></>)}
            {sc.pri.items.length > 0 && (<><dt>PRI</dt><dd>{sc.pri.items.join(" · ")}</dd></>)}
          </dl>
          <div className="fc-sub">Casualties · {located.length} located</div>
          {located.length === 0 ? <p className="fc-note">{personsReported ? "Persons reported — none located yet." : "None reported."}</p> : (
            <ul className="fc-list">
              {located.map((c) => { const pr = sim?.casualtyProgression[c.id]; return <li key={c.id}><b className={pr?.severity === "critical" || pr?.severity === "expectant" ? "stop" : pr?.severity === "serious" ? "warn" : "go"}>{(pr?.severity ?? c.severity).toUpperCase()}</b>{c.label ?? c.id} · {(pr?.stage ?? "located").replace(/_/g, " ")}</li>; })}
            </ul>
          )}
        </>
      )}
      <button type="button" className="fc-primary" disabled={!assessmentDirty && !!plan.assessedAt} onClick={updateAssessment}>
        <Icon d="M4 12a8 8 0 0 1 14-5l2-2v6h-6l2-2a5 5 0 1 0 1 6" /> {plan.assessedAt && !assessmentDirty ? `Assessed ${mmss(now - plan.assessedAt)} ago` : "Update assessment"}
      </button>
    </Card>
  );

  const planCard = (
    <Card title="Command plan" icon="✓" fill headerExtra={<span className="fc-meta">Authorising commander: {isCommander ? "You" : commanderUnit ? commanderUnit.appliance.callsign : "Not assigned"}</span>}>
      <div className="fc-sub">Operational objectives</div>
      <p className="fc-note">Set the key objectives for this incident.</p>
      <div className="fc-objectives">
        {OBJECTIVES.filter((o) => o.key !== "rescue" || personsReported).map((o) => (
          <button key={o.key} type="button" className={`fc-objective${plan.objectives[o.key] ? " on" : ""}`} aria-pressed={!!plan.objectives[o.key]} onClick={() => set((p) => ({ ...p, objectives: { ...p.objectives, [o.key]: !p.objectives[o.key] } }))}>
            <i>{plan.objectives[o.key] ? "✓" : ""}</i>
            <div><strong>{o.label}</strong><span>{o.detail}</span></div>
          </button>
        ))}
      </div>
      <div className="fc-sub">Command notes</div>
      <textarea className="fc-notes" value={plan.notes} placeholder="Record objectives and decisions…" onChange={(e) => { const v = e.target.value; set((p) => ({ ...p, notes: v })); }} />
      <div className="fc-plan-foot">
        <label className="fc-field inline">
          <span>Review in</span>
          <select value={plan.reviewMin} onChange={(e) => { const v = Number(e.target.value); set((p) => ({ ...p, reviewMin: v })); }}>
            {[5, 10, 15, 20, 30].map((m) => <option key={m} value={m}>{m} minutes</option>)}
          </select>
        </label>
        {reviewLeft !== null && <span className={`fc-review${reviewOverdue ? " stop" : ""}`}>{reviewOverdue ? "REVIEW OVERDUE" : `Review due in ${mmss(reviewLeft)}`}</span>}
        <button type="button" className="fc-primary" disabled={resolvedIncident} onClick={recordPlan}><Icon d="M6 3h9l4 4v14H6V3zm3 8h6m-6 4h6" /> {plan.recordedAt ? "Record review" : "Record plan"}</button>
      </div>
    </Card>
  );

  const taskingCard = (
    <Card title="Crew tasking" icon="⚙">
      <p className="fc-note">Assign crews to key functions for this incident.</p>
      <div className="fc-functions">
        {FUNCTIONS.map((f) => {
          const mine = active.filter((t) => f.kinds.includes(t.kind));
          const units = [...new Set(mine.map((t) => resolved.find((r) => r.appliance.id === t.applianceId)?.appliance.callsign ?? t.applianceId))];
          const crew = mine.reduce((n, t) => n + t.assignedCrewIds.length, 0);
          return (
            <div key={f.key} className={`fc-function${mine.length ? " on" : ""}`}>
              {f.icon}
              <strong>{f.label}</strong>
              <span>{mine.length ? `${crew} crew · ${units.join(", ")}` : "Unassigned"}</span>
              <button type="button" className="fc-mini primary" disabled={!canAct} onClick={() => { setTaskPage(f.tab === "water" ? "water" : "actions"); setTab(f.tab); }}>+ Assign crew</button>
            </div>
          );
        })}
      </div>
    </Card>
  );

  const appliancesCard = (full = false) => (
    <Card title="Appliances & crews" icon="▣" fill={full}>
      <p className="fc-note">Manage and assign appliances and crews.</p>
      <table className="fc-table">
        <thead><tr><th>Appliance</th><th>Role</th><th>Status</th>{full && <th>Crew</th>}{full && <th />}</tr></thead>
        <tbody>
          {committed.length === 0 && <tr><td colSpan={full ? 5 : 3} className="empty">No appliances committed</td></tr>}
          {committed.map((r) => {
            const st = statusOf(r);
            return (
              <tr key={r.appliance.id} className={r.appliance.id === appliance.id ? "me" : ""}>
                <td><b>{r.appliance.callsign}</b>{full ? <small>{r.appliance.typeName}</small> : null}</td>
                <td>{roleOf(r.appliance)}</td>
                <td><i className={`dot ${st === "On scene" || st === "Working" ? "go" : st === "En route" ? "warn" : "off"}`} />{st}</td>
                {full && <td>{r.appliance.crewMembers.length} · {r.appliance.crewMembers.filter((c) => props.busyCrewIds?.has(c.id)).length} committed</td>}
                {full && <td>{props.onArmPlacement && r.phase === "at_incident" ? <button type="button" className="fc-mini" onClick={() => props.onArmPlacement?.(r.appliance.id)}>{r.deployment.parkingPos ? "Move" : "Place"}</button> : null}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="fc-sub">Assign resource</div>
      <div className="fc-assign">
        <label className="fc-field"><span>Appliance</span>
          <select value={assignAppliance} onChange={(e) => setAssignAppliance(e.target.value)}>
            <option value="">Select appliance</option>
            {committed.map((r) => <option key={r.appliance.id} value={r.appliance.id}>{r.appliance.callsign} · {r.appliance.typeName}</option>)}
          </select>
        </label>
        <label className="fc-field"><span>Role</span>
          <select value={assignRole} onChange={(e) => setAssignRole(e.target.value)}>
            <option value="">Select role</option>
            {APPLIANCE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
      </div>
      <button type="button" className="fc-primary accent" disabled={!assignAppliance || !assignRole || resolvedIncident} onClick={assignResource}><Icon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0M19 8v6m-3-3h6" /> Assign resource</button>
    </Card>
  );

  const waterCard = (full = false) => (
    <Card title="Water supply" icon="💧" fill={full}>
      <dl className="fc-facts">
        <dt>Tank</dt><dd className={tankPct < 30 ? "stop" : tankPct < 60 ? "warn" : ""}>{tankPct}% · {Math.round(appliance.waterLitres * tankPct / 100).toLocaleString()} L</dd>
        <dt>Pump</dt><dd className={pumpOn ? "go" : ""}>{pumpOn ? `Running · ${appliance.crewMembers.find((c) => c.id === unit.deployment.pumpOperatorCrewId)?.name ?? "operator"}` : "Not running"}</dd>
        <dt>Supply chain</dt><dd className={supplied ? "go" : waterActive.length ? "warn" : ""}>{supplied ? "Established — hydrant or relay feeding the pump" : waterActive.length ? "Being established" : "Tank only"}</dd>
        <dt>Water clock</dt><dd className={supplied ? "go" : waterLeft != null ? (waterLeft < 120 ? "stop" : waterLeft < 300 ? "warn" : "") : ""}>{supplied ? "Unlimited on the hydrant" : waterLeft != null ? (waterLeft <= 0 ? "TANK DRY" : `Tank empty in ${mmss(waterLeft * 1000)} at this draw`) : "No draw on the tank"}</dd>
      </dl>
      <label className="fc-field inline"><span>Source</span>
        <select value={waterSource ?? plan.water.source} onChange={(e) => setWaterSource(e.target.value)}>
          {waterSources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="fc-field inline"><span>Supply status</span>
        <select value={waterStatus ?? supplyStatusLive} onChange={(e) => setWaterStatus(e.target.value)}>
          {SUPPLY_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <button type="button" className="fc-primary" disabled={resolvedIncident} onClick={updateWater}><Icon d="M12 3s5 6 5 10a5 5 0 0 1-10 0c0-4 5-10 5-10z" /> Update supply</button>
      {full && appliance.waterLitres > 0 && tasking("water")}
    </Card>
  );

  const baCard = (
    <Card title="BA entry control" icon="◉">
      <table className="fc-table">
        <thead><tr><th>Team</th><th>Status</th></tr></thead>
        <tbody>
          {baTasks.length === 0 && <tr><td colSpan={2} className="empty">{freeCrew.length >= 2 ? "BA team ready — commit from Crews" : "No BA team available"}</td></tr>}
          {baTasks.map((t, i) => {
            const cs = resolved.find((r) => r.appliance.id === t.applianceId)?.appliance.callsign ?? t.applianceId;
            const entry = t.baEntryAt ? Math.min(...Object.values(t.baEntryAt)) : t.startedAt;
            const whistle = t.baWhistleAt ? Math.min(...Object.values(t.baWhistleAt)) : null;
            const late = whistle !== null && now > whistle;
            return (
              <tr key={t.id}>
                <td><b>BA Team {String(i + 1).padStart(2, "0")}</b><small>{cs} · {t.assignedCrewIds.length} wearers{t.entryPoint ? ` · ${t.entryPoint}` : ""}</small></td>
                <td><i className={`dot ${late ? "stop" : "go"}`} />{late ? "WHISTLE PASSED" : `Under air ${mmss(now - entry)}`}{whistle ? <small>{late ? "Withdraw now" : `Whistle in ${mmss(whistle - now)}`}</small> : null}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="fc-sub row"><span>Emergency team</span>{plan.emergencyTeam ? <span className="go">✓ {plan.emergencyTeam.names.join(" · ")}</span> : <span className="stop">Not nominated</span>}</div>
      {!plan.emergencyTeam && (
        <div className="fc-emerg">
          {baCapable.length < 2 ? <p className="fc-note">Two BA-capable wearers on scene are needed for an emergency team.</p> : (
            <>
              <div className="fc-sector-units">
                {baCapable.map((x) => (
                  <button key={x.c.id} type="button" className={`fc-chip${emergPick.includes(x.c.id) ? " on" : ""}`} disabled={props.busyCrewIds?.has(x.c.id) || (!emergPick.includes(x.c.id) && emergPick.length >= 2)} title={`${x.c.name} · ${x.callsign}`} onClick={() => setEmergPick((p) => (p.includes(x.c.id) ? p.filter((id) => id !== x.c.id) : [...p, x.c.id]))}>{x.c.name.split(" ").pop()} · {x.callsign}</button>
                ))}
              </div>
              <button type="button" className="fc-mini primary" disabled={emergPick.length !== 2 || !canAct} onClick={nominateEmergencyTeam}>Nominate emergency team</button>
            </>
          )}
        </div>
      )}
      <button type="button" className="fc-primary" onClick={() => setTab("ba")}><Icon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0" /> Open entry control</button>
    </Card>
  );

  // ---- RTC: the vehicles, made safe and opened up ---------------------------
  const crsVehicles = sc.crs ?? [];
  const rtcVehicle = crsVehicles.find((v) => v.id === rtcVehicleId) ?? crsVehicles[0] ?? null;
  const crsTasksFor = (vehicleId: string, actionId: string) => tasks.filter((t) => t.kind === "crs_action" && t.crsVehicleId === vehicleId && t.crsActionId === actionId && t.state !== "aborted");
  const crsState = (vehicleId: string, actionId: string): { state: "ready" } | { state: "active"; task: Task } | { state: "done"; task: Task } => {
    const list = crsTasksFor(vehicleId, actionId);
    const done = list.find((t) => t.state === "completed");
    if (done) return { state: "done", task: done };
    const running = list.find((t) => t.state === "active");
    return running ? { state: "active", task: running } : { state: "ready" };
  };
  const keyDone = (v: CrsVehicle, key: string) => crsState(v.id, key).state === "done" || crsState(v.id, `std-${key}`).state === "done";
  const carriesKit = (needle: string) => appliance.kit.some((k) => k.toLowerCase().includes(needle.toLowerCase()));
  const criticalOf = (v: CrsVehicle) => {
    const authored = datasheetActions(v).filter((a) => a.critical).map((a) => a.id);
    const std = SPACE_CREATION.filter((a) => a.critical && !datasheetActions(v).some((d) => `std-${d.id}` === a.id)).map((a) => a.id);
    return [...authored, ...std];
  };
  const madeSafe = (v: CrsVehicle) => criticalOf(v).every((id) => crsState(v.id, id).state === "done");
  const criticalDone = (v: CrsVehicle) => criticalOf(v).filter((id) => crsState(v.id, id).state === "done").length;
  const extrication = tasks.find((t) => t.kind === "rtc_extrication" && t.state === "active") ?? tasks.find((t) => t.kind === "rtc_extrication" && t.state === "completed");
  const crsRunningHere = active.filter((t) => t.kind === "crs_action").length;
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
          <span className="meta">{st.state === "done" ? `Done ${clock(st.task.completesAt ? st.task.completesAt - incident.receivedAt : 0)}` : st.state === "active" ? `${resolved.find((r) => r.appliance.id === st.task.applianceId)?.appliance.callsign ?? ""} · ${mmss(Math.max(0, (st.task.completesAt ?? now) - now))} to go` : hint}</span>
        </div>
        {st.state === "ready" && <button type="button" className="fc-mini primary" disabled={disabled} title={hint} onClick={() => startCrs(v, a, doneMessage)}>Start</button>}
        {st.state === "active" && <button type="button" className="fc-mini" onClick={() => props.onAbortTask?.(st.task.id)}>Abort</button>}
        {st.state === "done" && <span className="fc-rtc-tick">✓</span>}
      </div>
    );
  };
  const rtcCard = (
    <Card title="Road traffic collision" icon="🚗" fill headerExtra={<span className="fc-meta">{crsVehicles.length ? `${crsVehicles.filter(madeSafe).length} of ${crsVehicles.length} made safe` : "no vehicles"}</span>}>
      {crsVehicles.length === 0 ? (
        <p className="fc-note">No vehicles on this job. When a job carries a crash — the M60 entrapment, a car into a wall — the vehicles sit here with their datasheets, and the crew makes them safe and opens them up from this tab.</p>
      ) : (
        <div className="fc-rtc">
          <div className="fc-rtc-vehicles">
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
          {rtcVehicle && (
            <div className="fc-rtc-body">
              <div className="fc-rtc-notes">
                <div className="fc-sub"><span>Datasheet · {rtcVehicle.make} {rtcVehicle.model}</span></div>
                <ul>{rtcVehicle.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
                <div className="fc-sub"><span>On the schematic</span></div>
                <div className="fc-rtc-comps">
                  {rtcVehicle.components.map((c, i) => <span key={i} className={`fc-chip ${c.kind}`}>{c.label}</span>)}
                </div>
              </div>
              <div className="fc-rtc-work">
                <div className="fc-sub row"><span>Make safe</span><small>{freeCrew.length} free on {appliance.callsign}{!carriesKit("Hydraulic") ? " · no hydraulic rescue kit on this appliance" : ""}</small></div>
                <div className="fc-rtc-actions">
                  {datasheetActions(rtcVehicle).map((a) => rtcActionRow(rtcVehicle, a, a.done, null))}
                </div>
                <div className="fc-sub row"><span>Space creation</span><small>in the order the car allows</small></div>
                <div className="fc-rtc-actions">
                  {SPACE_CREATION.filter((a) => !datasheetActions(rtcVehicle).some((d) => `std-${d.id}` === a.id)).map((a) => {
                    const missingKit = a.kit && !carriesKit(a.kit) ? `Needs ${a.kit.toLowerCase()} rescue kit — not on ${appliance.callsign}` : null;
                    const waiting = (a.after ?? []).filter((k) => !keyDone(rtcVehicle, k));
                    const blocked = missingKit ?? (waiting.length ? `After ${waiting.map((k) => k.replace(/-/g, " ")).join(" and ")}` : null);
                    return rtcActionRow(rtcVehicle, a, a.done(rtcVehicle.vrm), blocked);
                  })}
                </div>
                <div className="fc-sub row"><span>Extrication</span><small>{crsVehicles.every(madeSafe) ? "every vehicle made safe — controlled release, cutting time down" : `${crsVehicles.map((v) => `${v.vrm}: ${criticalOf(v).filter((id) => crsState(v.id, id).state !== "done").length} critical outstanding`).join(" · ")}`}</small></div>
                {extrication ? (
                  <div className={`fc-rtc-action${extrication.state === "completed" ? " done" : " on"}`}>
                    <div className="txt"><b>Release the casualty</b><small>{extrication.state === "completed" ? "Casualty released to the ambulance crew" : `${resolved.find((r) => r.appliance.id === extrication.applianceId)?.appliance.callsign ?? ""} cutting · ${mmss(Math.max(0, (extrication.completesAt ?? now) - now))} to go`}</small></div>
                    {extrication.state === "active" && <button type="button" className="fc-mini" onClick={() => props.onAbortTask?.(extrication.id)}>Abort</button>}
                    {extrication.state === "completed" && <span className="fc-rtc-tick">✓</span>}
                  </div>
                ) : (
                  <button type="button" className={`fc-primary${crsVehicles.every(madeSafe) ? "" : " accent"}`} disabled={!canAct || freeCrew.length < 4 || !carriesKit("Hydraulic")} title={!carriesKit("Hydraulic") ? "Hydraulic rescue kit needed" : freeCrew.length < 4 ? `Four hands needed · ${freeCrew.length} free` : crsVehicles.every(madeSafe) ? "Controlled extrication" : "Cutting on a vehicle that is not made safe — it will be in the log"} onClick={() => props.onStartTask?.({ applianceId: appliance.id, kind: "rtc_extrication", assignedCrewIds: freeCrew.slice(0, 4).map((c) => c.id) })}>
                    <Icon d="M4 12h16M12 4v16" /> {crsVehicles.every(madeSafe) ? "Release the casualty — controlled" : "Release the casualty now — not made safe"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );

  // ---- High-rise: the stair, the bridgehead, the residents ------------------
  const hr = sc.scene?.highRise;
  const kindState = (kind: TaskKind) => {
    const done = tasks.find((t) => t.kind === kind && t.state === "completed");
    const running = active.find((t) => t.kind === kind);
    return done ? { state: "done" as const, task: done } : running ? { state: "active" as const, task: running } : { state: "none" as const, task: null };
  };
  const startKind = (kind: TaskKind, n: number) => {
    const crew = freeCrew.slice(0, n).map((c) => c.id);
    if (crew.length < n) return;
    props.onStartTask?.({ applianceId: appliance.id, kind, assignedCrewIds: crew });
  };
  const kindButton = (kind: TaskKind, n: number, label: string, ongoing = false) => {
    const st = kindState(kind);
    if (st.state === "done") return <span className="go">✓ {label}</span>;
    if (st.state === "active") return <button type="button" className="fc-mini" onClick={() => props.onAbortTask?.(st.task.id)}>{label} · {ongoing ? "running" : mmss(Math.max(0, (st.task.completesAt ?? now) - now))} ✕</button>;
    return <button type="button" className="fc-mini primary" disabled={!canAct || freeCrew.length < n} title={freeCrew.length < n ? `${n} crew needed · ${freeCrew.length} free` : `${n} crew`} onClick={() => startKind(kind, n)}>{label}</button>;
  };
  const highRiseCard = hr ? (
    <Card title="High-rise" icon="🏢" headerExtra={<span className="fc-meta">fire on floor {hr.fireFloor} of {hr.floors}</span>}>
      <dl className="fc-facts">
        <dt>Building</dt><dd>{hr.floors} floors · {hr.flatsPerFloor} flats a floor · {hr.firefightingLift ? "firefighting lift" : "no firefighting lift — stairs"}</dd>
        <dt>Bridgehead</dt><dd className={kindState("bridgehead").state === "done" ? "go" : "stop"}>{kindState("bridgehead").state === "done" ? `Established on floor ${hr.bridgeheadFloor}` : kindState("bridgehead").state === "active" ? `Setting up on floor ${hr.bridgeheadFloor}` : `Not established — belongs on floor ${hr.bridgeheadFloor}, two below the fire`}</dd>
        <dt>Residents</dt><dd className={plan.highRise ? "hi" : "warn"}>{plan.highRise ? `${plan.highRise.strategy === "stay_put" ? "Stay put" : plan.highRise.strategy === "phased" ? "Phased evacuation" : "Simultaneous evacuation"} · ${clock(plan.highRise.at - incident.receivedAt)}` : "No strategy set — stay put holds until you say otherwise"}</dd>
      </dl>
      <div className="fc-sector-units">
        {kindButton("bridgehead", 2, "Set up bridgehead")}
        {hr.firefightingLift && kindButton("firefighting_lift", 1, "Take the firefighting lift")}
        {kindButton("evacuate_floors", 2, "Evacuate floors", true)}
      </div>
      <div className="fc-sub row"><span>Evacuation strategy</span></div>
      <div className="vec-segments" role="group" aria-label="Evacuation strategy">
        {([["stay_put", "Stay put"], ["phased", "Phased"], ["simultaneous", "Simultaneous"]] as const).map(([k, l]) => (
          <button key={k} type="button" aria-pressed={plan.highRise?.strategy === k} disabled={resolvedIncident} onClick={() => { set((p) => ({ ...p, highRise: { strategy: k, at: now } })); props.onNote?.(`[evac-strategy] ${appliance.callsign} · residents: ${l.toLowerCase()}${k === "stay_put" ? " — fire floor and the one above cleared, everyone else stays behind their doors" : k === "phased" ? " — fire floor, above and below first, then floor by floor" : " — whole block out, police on the stair"}`); }}>{l}</button>
        ))}
      </div>
    </Card>
  ) : null;

  // ---- Hazmat: what it is, how far back, who gets washed ---------------------
  const chem = sc.scene?.hazards.find((h) => h.kind === "chemical" && h.substance);
  const chemKnown = !!sim?.hazmatIdentified;
  const hazmatCard = chem?.substance ? (
    <Card title="Hazardous materials" icon="☣" headerExtra={<span className="fc-meta">{chemKnown ? chem.substance.name : "not identified"}</span>}>
      <dl className="fc-facts">
        <dt>Substance</dt><dd className={chemKnown ? "hi" : "stop"}>{chemKnown ? `${chem.substance.name}${chem.substance.unNumber ? ` · ${chem.substance.unNumber}` : ""}` : `Unknown — placard reads ${chem.substance.unNumber ?? "nothing legible"}${chem.substance.hazchem ? `, Hazchem ${chem.substance.hazchem}` : ""}`}</dd>
        <dt>Cordon</dt><dd className="warn">{chemKnown ? `${chem.substance.cordonM} m inner cordon for ${chem.substance.name} — upwind, uphill` : "75 m initial cordon until it is identified"}</dd>
        <dt>Decon</dt><dd className={sim?.decontaminated ? "go" : chem.substance.decontamination ? "stop" : ""}>{sim?.decontaminated ? "Established — warm zone, everyone through it" : chem.substance.decontamination ? (chemKnown ? "Required — nobody leaves the warm zone unwashed" : "Assume required until identified") : "Not required"}</dd>
      </dl>
      <div className="fc-sector-units">
        {kindButton("hazmat_identify", 2, "Identify the substance")}
        {chem.substance.decontamination && (chemKnown ? kindButton("decontaminate", 2, "Set up decontamination") : <button type="button" className="fc-mini" disabled title="Identify it first">Set up decontamination</button>)}
        <button type="button" className={`fc-mini${plan.assistance.some((x) => x.id.startsWith("hazmat:")) ? " sent" : ""}`} disabled={!canAct} onClick={() => sendAssistance("hazmat", "Hazmat")}>{plan.assistance.some((x) => x.id.startsWith("hazmat:")) ? "Hazmat / DIM requested ✓" : "Request Hazmat / DIM"}</button>
      </div>
    </Card>
  ) : null;

  // ---- Reliefs: who is spent, and the pumps to replace them ------------------
  const fatigue = props.fatigueByApplianceId ?? {};
  const fatigueRows = onScene.filter((r) => r.appliance.service === "Fire").map((r) => ({ r, f: Math.round(fatigue[r.appliance.id] ?? 0) })).sort((a, b) => b.f - a.f);
  const tired = fatigueRows.filter((x) => x.f >= 60);
  const reliefsSent = plan.assistance.filter((x) => x.id.startsWith("relief:"));
  const reliefCard = (
    <Card title="Reliefs" icon="⏱" headerExtra={<span className="fc-meta">{tired.length ? `${tired.length} crew${tired.length === 1 ? "" : "s"} spent` : "crews fresh"}</span>}>
      {fatigueRows.length === 0 ? <p className="fc-note">No fire crews on the ground yet.</p> : (
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
        <button type="button" className="fc-primary accent" disabled={!canAct} title="A fresh pump stands the most tired crew down when it lands" onClick={() => sendAssistance("relief", `Relief pumps ${reliefN}`, String(reliefN))}>Request relief · {reliefN} pump{reliefN === 1 ? "" : "s"}</button>
      </div>
      {reliefsSent.length > 0 && <p className="fc-note">Asked for: {reliefsSent.slice(-3).map((x) => `${x.label} (${clock(x.at - incident.receivedAt)})`).join(" · ")}</p>}
    </Card>
  );

  const logCard = (full = false) => (
    <Card title="Incident log" icon="▤" fill={full}>
      <div className={`fc-log${full ? " full" : ""}`}>
        <div className="row head"><span>Time</span><span>Event</span></div>
        {(full ? incidentLog.slice().reverse() : recent).map((e) => (
          <div key={e.id} className={`row ${e.kind}`}><span>{clock(e.timestamp - incident.receivedAt)}</span><span>{e.message}</span></div>
        ))}
        {incidentLog.length === 0 && <div className="row"><span /><span>Nothing logged yet</span></div>}
      </div>
    </Card>
  );

  const rolePicker = (kind: "commandSupport" | "safetyOfficer", value: string, setValue: (v: string) => void) => {
    const current = plan[kind];
    return (
      <div className="fc-role">
        <Icon d={kind === "commandSupport" ? "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21a8 8 0 0 1 16 0" : "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"} />
        <span className="lbl">{kind === "commandSupport" ? "Command support" : "Safety officer"}</span>
        {current ? (
          <span className="val go"><i className="dot go" />{current.name} · {current.callsign}</span>
        ) : (
          <select value={value} onChange={(e) => { setValue(e.target.value); if (e.target.value) assignRole2(kind, e.target.value); }} disabled={!canAct}>
            <option value="">Not assigned · pick</option>
            {appliance.crewMembers.map((c) => <option key={c.id} value={c.id} disabled={props.busyCrewIds?.has(c.id) || plan.commandSupport?.crewId === c.id || plan.safetyOfficer?.crewId === c.id}>{c.name} · {c.role}</option>)}
          </select>
        )}
      </div>
    );
  };

  return (
    <div className="fc-screen" role="region" aria-label="Fire and rescue command">
      <header className="fc-head">
        <div className="fc-brand">
          <Icon d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z" />
          <h1>FIRE &amp; RESCUE COMMAND <span>SIMULATION</span></h1>
        </div>
        <div className="fc-head-right">
          <span className="fc-who">{appliance.callsign}</span>
          <div className="fc-time"><small>SCENARIO TIME</small><strong>{clock(now - incident.receivedAt)}</strong></div>
          {props.onClose && <button type="button" className="fc-close" onClick={props.onClose}>✕ Close</button>}
        </div>
      </header>
      <div className="fc-roles">
        <div className="fc-role">
          <Icon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0" />
          <span className="lbl">Incident commander</span>
          {isCommander ? (
            <span className="val go"><i className="dot go" />You · {officer?.name}</span>
          ) : commanderUnit ? (
            <span className="val"><i className="dot warn" />{commanderUnit.appliance.callsign}</span>
          ) : (
            <button type="button" className="fc-mini primary" disabled={!canAct || !props.onStartTask} onClick={takeCommand}>Take command</button>
          )}
        </div>
        {rolePicker("commandSupport", supportPick, setSupportPick)}
        {rolePicker("safetyOfficer", safetyPick, setSafetyPick)}
        <div className="fc-role fc-tactical">
          <Icon d="M4 4h16v6H4zM4 14h16v6H4z" />
          <span className="lbl">Tactical mode</span>
          <div className="vec-segments" role="group" aria-label="Tactical mode">
            {TACTICAL.map((t) => (
              <button key={t.mode} type="button" aria-pressed={props.tacticalMode === t.mode} disabled={!props.onDeclareTacticalMode || !isCommander && !commanderUnit || resolvedIncident} title={!isCommander && !commanderUnit ? "Take command first" : t.hint} onClick={() => props.onDeclareTacticalMode?.(t.mode)}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <main className={`fc-main ${tab}`}>
        {tab === "overview" && (
          <>
            <div className="fc-col">{fireCard}{highRiseCard}{hazmatCard}{summaryCard}</div>
            <div className="fc-col">{planCard}{taskingCard}{logCard()}</div>
            <div className="fc-col">{appliancesCard()}{tired.length > 0 && reliefCard}{assistanceCard}{waterCard()}{baCard}</div>
          </>
        )}
        {tab === "assessment" && <div className="fc-col wide">{fireCard}{highRiseCard}{hazmatCard}{assessmentCard(true)}</div>}
        {tab === "sectors" && <div className="fc-col wide">{sectorsCard(true)}</div>}
        {tab === "crews" && (
          <div className="fc-col wide">
            <div className="fc-sub row">
              <span>Crew tasking · {appliance.callsign}</span>
              {appliance.waterLitres > 0 && (
                <div className="vec-segments" role="group" aria-label="Page">
                  <button type="button" aria-pressed={taskPage === "actions"} onClick={() => setTaskPage("actions")}>Actions</button>
                  <button type="button" aria-pressed={taskPage === "water"} onClick={() => setTaskPage("water")}>Water</button>
                </div>
              )}
            </div>
            {tasking(appliance.waterLitres > 0 ? taskPage : "actions")}
          </div>
        )}
        {tab === "appliances" && <div className="fc-col wide">{appliancesCard(true)}{reliefCard}</div>}
        {tab === "water" && <div className="fc-col wide">{waterCard(true)}</div>}
        {tab === "rtc" && <div className="fc-col wide">{rtcCard}</div>}
        {tab === "ba" && (
          <div className="fc-col wide">
            {baByAppliance.length === 0 ? (
              <Card title="BA entry control" icon="◉" fill>
                <p className="fc-note">No BA team committed. Commit a team from Crews — BA search and rescue — and the board opens here.</p>
                {baCard}
              </Card>
            ) : (
              baByAppliance.map(({ appliance: a, teams }) => (
                <Card key={a.id} title={`BA entry control · ${a.callsign}`} icon="◉">
                  <div className="cc-legacy">
                    <BaControlBoard appliance={a} baTasks={teams} now={now} onUpdateRemarks={props.onUpdateBaRemarks} onUpdateEntryPoint={props.onUpdateBaEntryPoint} onWithdrawTeam={props.onAbortTask} />
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
        {tab === "log" && <div className="fc-col wide">{logCard(true)}</div>}
      </main>

      <footer className="fc-foot">
        {TABS.map((t) => (
          <button key={t.key} type="button" aria-pressed={tab === t.key} onClick={() => setTab(t.key)}>
            {t.label}
            {t.key === "ba" && baTasks.length > 0 && <em>{baTasks.length}</em>}
            {t.key === "rtc" && crsRunningHere > 0 && <em>{crsRunningHere}</em>}
            {t.key === "crews" && active.filter((x) => x.applianceId === appliance.id).length > 0 && <em>{active.filter((x) => x.applianceId === appliance.id).length}</em>}
          </button>
        ))}
      </footer>
    </div>
  );
}

function Card({ title, icon, children, fill, headerExtra }: { title: string; icon: string; children: ReactNode; fill?: boolean; headerExtra?: ReactNode }) {
  return (
    <section className={`fc-card${fill ? " fill" : ""}`}>
      <header><b>{icon}</b><span>{title.toUpperCase()}</span>{headerExtra}</header>
      <div className="fc-card-body">{children}</div>
    </section>
  );
}
