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
import type { Incident, LogEntry, Task, TaskKind } from "@/lib/sim/incident_types";
import { hasWaterSupplyChain } from "@/lib/sim/incident_types";
import type { IncidentSimState } from "@/lib/sim/incident_sim";
import type { ResolvedDeployment } from "../components/incident-view";
import { SceneCanvas } from "../components/scene-canvas";
import { BaControlBoard } from "../components/ba-control-board";
import { MdtTaskWorkspace, type TaskWorkspaceProps } from "./mdt-task-workspace";
import { updatePlan, useCommandPlan, type CommandPlan } from "./command-store";

type Tab = "overview" | "assessment" | "crews" | "appliances" | "water" | "ba" | "log";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "assessment", label: "Assessment" },
  { key: "crews", label: "Crews" },
  { key: "appliances", label: "Appliances" },
  { key: "water", label: "Water supply" },
  { key: "ba", label: "BA control" },
  { key: "log", label: "Incident log" },
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
        <dt>Persons reported</dt><dd className={located.length || personsReported ? "warn" : ""}>{personsText}</dd>
        <dt>Utilities</dt><dd className={/LIVE/.test(utilities) ? "stop" : ""}>{utilities}</dd>
        <dt>Fire</dt><dd className={fireStage === "flashover_risk" ? "stop" : fireStage === "under_control" || fireStage === "extinguished" ? "go" : ""}>{STAGE_LABEL[fireStage]}{sim && sim.fireRadiusM > 0 ? ` · ${sim.fireRadiusM.toFixed(0)} m` : ""}{sim?.flashoverCountdownSec != null ? ` · flashover in ${sim.flashoverCountdownSec}s` : ""}</dd>
      </dl>
      <div className="fc-map">
        {sc.scene ? (
          <SceneCanvas
            scene={sc.scene}
            deployments={onScene.map((r) => ({ deployment: r.deployment, callsign: r.appliance.callsign, service: r.appliance.service }))}
          />
        ) : (
          <div className="vec-tile-empty">No scene plan for this incident</div>
        )}
      </div>
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
      <button type="button" className="fc-primary" onClick={() => setTab("ba")}><Icon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0" /> Open entry control</button>
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
      </div>

      <main className={`fc-main ${tab}`}>
        {tab === "overview" && (
          <>
            <div className="fc-col">{summaryCard}{assessmentCard()}</div>
            <div className="fc-col">{planCard}{taskingCard}{logCard()}</div>
            <div className="fc-col">{appliancesCard()}{waterCard()}{baCard}</div>
          </>
        )}
        {tab === "assessment" && <div className="fc-col wide">{assessmentCard(true)}</div>}
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
        {tab === "appliances" && <div className="fc-col wide">{appliancesCard(true)}</div>}
        {tab === "water" && <div className="fc-col wide">{waterCard(true)}</div>}
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
