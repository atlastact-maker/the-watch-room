"use client";

// Incident MDT — styled after the rugged CAD tablets mounted in UK
// appliance cabs (Getac/Panasonic class): landscape chassis with corner
// screws, a green sync bar, boxy CAD tabs (active = yellow), a dense
// incident strip, tabbed pages (Overview / Property / Prop View / PRI /
// Targets / Log) and a persistent ALERTS row. The screen deliberately
// runs a light "CAD app" theme so it reads as a separate device sitting
// on top of the dark ops-room UI.

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Rnd } from "react-rnd";
import {
  type Deployment,
  type Incident,
  type IncidentOutcome,
  type LogEntry,
} from "@/lib/sim/incident_types";
import type { StationWithAppliances } from "../page";
import {
  CallInformationBody,
  HazardsBody,
  resolveDeployments,
  type Props as IncidentViewProps,
  type ResolvedDeployment,
} from "./incident-view";
import { BaControlBoard } from "./ba-control-board";
import { BottomActionMenu, type UnitControlPage } from "./bottom-action-menu";
import { CAD_VARS } from "./cad-theme";
import { incidentRef } from "../vector/model";
import { CopyButton } from "../vector/copy-button";
import { PopoutFrame, PopoutWindow } from "../vector/popout";
import { PatientCareWorkspace, assignedCasualtyIds } from "../vector/patient-care";
import { MdtTaskWorkspace } from "../vector/mdt-task-workspace";
import { CrsPanel } from "./crs-panel";
import { PreArrivalBody } from "./pre-arrival-panel";
import type { Eta } from "./deployment-board";
import type { Patch } from "@/lib/sim/areas";

// Aerial property view — Leaflet must not run on the server.
const PropertyAerial = dynamic(
  () => import("./property-aerial").then((m) => m.PropertyAerial),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-zinc-300 font-mono text-[11px] uppercase tracking-widest text-zinc-600">
        Loading imagery…
      </div>
    ),
  },
);

type Props = {
  incident: Incident;
  stations: StationWithAppliances[];
  deployments: Deployment[];
  log: LogEntry[];
  outcome: IncidentOutcome | null;
  onDeploy: (args: {
    applianceId: string;
    slotId: string;
    etaSeconds: number;
    routeMeters?: number;
    routeCoords?: [number, number][];
  }) => void;
  onStandDownForWelfare: (applianceId: string) => void;
  onResolve: () => void;
  onDismiss: () => void;
  onClose: () => void;

  // Ground-view extras — the MDT carries Call / Hazards / Casualties / BA
  // as tabs so the scene needs no separate rail boxes for them.
  sim?: IncidentViewProps["sim"] | null;
  tasks?: IncidentViewProps["tasks"];
  now?: number;
  informantLog?: IncidentViewProps["informantLog"];
  informantOnCall?: boolean;
  treatmentByCasualtyId?: IncidentViewProps["treatmentByCasualtyId"];
  onSetTreatingCasualty?: IncidentViewProps["onSetTreatingCasualty"];
  onStartPatientSurvey?: IncidentViewProps["onStartPatientSurvey"];
  onApplyAirway?: IncidentViewProps["onApplyAirway"];
  onApplyBreathing?: IncidentViewProps["onApplyBreathing"];
  onApplyCirculation?: IncidentViewProps["onApplyCirculation"];
  resusByCasualtyId?: IncidentViewProps["resusByCasualtyId"];
  onSetOxygen?: IncidentViewProps["onSetOxygen"];
  onSetResusAirway?: IncidentViewProps["onSetResusAirway"];
  onAttachMonitor?: IncidentViewProps["onAttachMonitor"];
  onToggleCapnography?: IncidentViewProps["onToggleCapnography"];
  onSetCompressor?: IncidentViewProps["onSetCompressor"];
  onFitLucas?: IncidentViewProps["onFitLucas"];
  onDeliverShock?: IncidentViewProps["onDeliverShock"];
  onMovePads?: IncidentViewProps["onMovePads"];
  onArrestAdrenaline?: IncidentViewProps["onArrestAdrenaline"];
  onAmiodarone?: IncidentViewProps["onAmiodarone"];
  onSuspectReversible?: IncidentViewProps["onSuspectReversible"];
  onTreatReversible?: IncidentViewProps["onTreatReversible"];
  onStopResus?: IncidentViewProps["onStopResus"];
  onAdministerDrug?: IncidentViewProps["onAdministerDrug"];
  onApplyPackaging?: IncidentViewProps["onApplyPackaging"];
  onApplyEgress?: IncidentViewProps["onApplyEgress"];
  onRequestClinician?: IncidentViewProps["onRequestClinician"];
  hemsFlyable?: boolean;
  onSetTreatmentDestination?: IncidentViewProps["onSetTreatmentDestination"];
  onSendAtmistPrealert?: IncidentViewProps["onSendAtmistPrealert"];
  onConveyCasualtyVia?: IncidentViewProps["onConveyCasualtyVia"];
  onConfirmAllergies?: (casualtyId: string, by: string) => void;
  onUpdateBaRemarks?: IncidentViewProps["onUpdateBaRemarks"];
  onUpdateBaEntryPoint?: IncidentViewProps["onUpdateBaEntryPoint"];
  onAbortTask?: IncidentViewProps["onAbortTask"];

  // Resourcing tab — committed crews + available fleet with mobilise.
  etas?: Record<string, Eta>;
  patch?: Patch | null;
  onStandDown?: (applianceId: string) => void;
  onSetPreCommitBaCrew?: IncidentViewProps["onSetPreCommitBaCrew"];
  sceneCommanderApplianceId?: string | null;
  crewAir?: Record<string, number>;

  // Unit control from the tablet — clicking a committed callsign swaps the
  // Available pane for the full vehicle/crew/water/actions menu.
  busyCrewIds?: IncidentViewProps["busyCrewIds"];
  vehicleGauges?: IncidentViewProps["vehicleGauges"];
  onStartTask?: IncidentViewProps["onStartTask"];
  onSetLightState?: IncidentViewProps["onSetLightState"];
  onSetPumpRunning?: IncidentViewProps["onSetPumpRunning"];
  onSetPumpOperator?: IncidentViewProps["onSetPumpOperator"];
  onSetFastAttackDeployed?: IncidentViewProps["onSetFastAttackDeployed"];
  onToggleCrewEquipment?: IncidentViewProps["onToggleCrewEquipment"];
  onSetCrewLoadout?: IncidentViewProps["onSetCrewLoadout"];
  tacticalMode?: IncidentViewProps["tacticalMode"];
  fatigueByApplianceId?: IncidentViewProps["fatigueByApplianceId"];
  /** Start a road-closure placement (next ground-map click drops cones). */
  onBeginRoadClosure?: (applianceId: string, kind: "close_carriageway" | "close_road", crewIds: string[]) => void;
  onRequestRotate?: (applianceId: string) => void;
  /** Arm the two-click map placement flow for an arrived-unplaced unit
   *  (or an LZ pick for a holding helicopter). The ground map shows the
   *  step banner and takes the clicks; the MDT is just the console. */
  onArmPlacement?: (applianceId: string) => void;
  /** Controlled unit-control selection — when provided, the dashboard owns
   *  which unit's control page fills the Resourcing pane (ground-map
   *  vehicle clicks land here). Omit for internal state (demo page). */
  unitId?: string | null;
  onSetUnitId?: (applianceId: string | null) => void;
  /** A local message from the unit to control — goes on the shift log. */
  onSendMessage?: (callsign: string, text: string) => void;
  /** The crew reports an ongoing task complete from the tablet. */
  onCompleteTask?: (taskId: string) => void;
  /** A handover on the tablet swaps the crew carrying a task. */
  onSetTaskCrew?: (taskId: string, crewIds: string[]) => void;
  /** A worded line for the shift log (task orders, crew updates). */
  onNote?: (text: string) => void;
};

// Remembered tablet frame — survives the MDT being collapsed/reopened
// (component unmount) and full reloads. Best-effort localStorage.
type MdtFrame = { x: number; y: number; width: number; height: number };
const MDT_FRAME_KEY = "twr:mdt-frame:v1";

function loadMdtFrame(): MdtFrame | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MDT_FRAME_KEY);
    if (!raw) return null;
    const f = JSON.parse(raw) as MdtFrame;
    if (
      typeof f.x !== "number" ||
      typeof f.y !== "number" ||
      typeof f.width !== "number" ||
      typeof f.height !== "number"
    ) {
      return null;
    }
    // Never restore a frame that's drifted off the visible screen.
    return {
      width: Math.max(560, Math.min(f.width, window.innerWidth)),
      height: Math.max(540, Math.min(f.height, window.innerHeight)),
      x: Math.max(0, Math.min(f.x, window.innerWidth - 200)),
      y: Math.max(0, Math.min(f.y, window.innerHeight - 120)),
    };
  } catch {
    return null;
  }
}

function saveMdtFrame(f: MdtFrame): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MDT_FRAME_KEY, JSON.stringify(f));
  } catch {
    // best-effort
  }
}

// The six pages of the VECTOR tablet.
type TabKey = "incident" | "actions" | "messages" | "crew" | "vehicle" | "water" | "patients";

export function DraggableIncidentMdt({
  incident,
  stations,
  deployments,
  log,
  outcome,
  onResolve,
  onDismiss,
  onClose,
  sim,
  tasks,
  now,
  informantLog,
  informantOnCall,
  treatmentByCasualtyId,
  onSetTreatingCasualty,
  onStartPatientSurvey,
  onApplyAirway,
  onApplyBreathing,
  onApplyCirculation,
  resusByCasualtyId,
  onSetOxygen,
  onSetResusAirway,
  onAttachMonitor,
  onToggleCapnography,
  onSetCompressor,
  onFitLucas,
  onDeliverShock,
  onMovePads,
  onArrestAdrenaline,
  onAmiodarone,
  onSuspectReversible,
  onTreatReversible,
  onStopResus,
  onAdministerDrug,
  onApplyPackaging,
  onApplyEgress,
  onRequestClinician,
  hemsFlyable,
  onSetTreatmentDestination,
  onSendAtmistPrealert,
  onConveyCasualtyVia,
  onConfirmAllergies,
  onUpdateBaRemarks,
  onUpdateBaEntryPoint,
  onAbortTask,
  onSetPreCommitBaCrew,
  sceneCommanderApplianceId,
  crewAir,
  busyCrewIds,
  vehicleGauges,
  onStartTask,
  onSetLightState,
  onSetPumpRunning,
  onSetPumpOperator,
  onSetFastAttackDeployed,
  onToggleCrewEquipment,
  onSetCrewLoadout,
  tacticalMode,
  fatigueByApplianceId,
  onBeginRoadClosure,
  onRequestRotate,
  onArmPlacement,
  unitId: unitIdProp,
  onSetUnitId,
  onSendMessage,
  onCompleteTask,
  onSetTaskCrew,
  onNote,
}: Props) {
  const resolved = !!outcome;
  const [tab, setTab] = useState<TabKey>("incident");
  // Committed unit whose control page fills the Resourcing right pane.
  // Controlled by the dashboard when the props are supplied (ground-map
  // clicks open the tablet's unit page); internal state otherwise.
  const [internalUnitId, setInternalUnitId] = useState<string | null>(null);
  const unitId = unitIdProp !== undefined ? unitIdProp : internalUnitId;
  const setUnitId = onSetUnitId ?? setInternalUnitId;
  // An externally focused unit jumps the tablet to its control page.
  useEffect(() => {
    if (unitIdProp) setTab("actions");
  }, [unitIdProp]);
  // Tablet frame — restored from the last drag/resize so collapsing and
  // reopening the MDT keeps the operator's chosen size and position.
  // The prototype's tablet: 700 × 680, parked at the right of the ground.
  const frame = useRef<MdtFrame>(
    loadMdtFrame() ?? {
      x: typeof window !== "undefined" ? Math.max(16, window.innerWidth - 700 - 24) : 24,
      y: 110,
      width: 700,
      height: 680,
    },
  );
  useEffect(() => {
    setTab("incident");
    setUnitId(null);
  }, [resolved, incident.id]);

  const sc = incident.scenario;
  const nowMs = now ?? Date.now();

  // Scene data for the Resourcing / Hazards / Casualties / BA tabs.
  const resolvedDeps: ResolvedDeployment[] = resolveDeployments(deployments, stations, nowMs);
  const activeTaskList = (tasks ?? []).filter((t) => t.state === "active");
  const hazardCount = sim?.visibleHazards.length ?? 0;
  const locatedCount = sim
    ? sim.foundCasualties.filter((c) => {
        const stage = sim.casualtyProgression?.[c.id]?.stage;
        return stage && stage !== "undiscovered" && stage !== "at_hospital";
      }).length
    : 0;
  const baByAppliance: {
    applianceId: string;
    appliance: ResolvedDeployment["appliance"];
    tasks: NonNullable<IncidentViewProps["tasks"]>;
  }[] = [];
  for (const t of tasks ?? []) {
    if (t.kind !== "ba_sar" || t.state !== "active") continue;
    const r = resolvedDeps.find((x) => x.appliance.id === t.applianceId);
    if (!r) continue;
    const existing = baByAppliance.find((b) => b.applianceId === t.applianceId);
    if (existing) existing.tasks.push(t);
    else baByAppliance.push({ applianceId: t.applianceId, appliance: r.appliance, tasks: [t] });
  }
  const totalBaTeams = baByAppliance.reduce((n, b) => n + b.tasks.length, 0);

  // Unit-control page state for the Resourcing tab.
  const selectedUnit = unitId
    ? resolvedDeps.find((r) => r.appliance.id === unitId) ?? null
    : null;
  const canControl = !!(
    onStartTask &&
    onSetLightState &&
    onSetPumpRunning &&
    onSetPumpOperator &&
    onSetFastAttackDeployed &&
    onToggleCrewEquipment &&
    busyCrewIds &&
    vehicleGauges
  );
  const onSceneList = resolvedDeps.filter((r) => r.phase === "at_incident");

  const unitActive = activeTaskList.filter((t) => !selectedUnit || t.applianceId === selectedUnit.appliance.id);
  const assignedPatients = selectedUnit ? assignedCasualtyIds(selectedUnit.appliance.id, deployments, tasks ?? []).size : 0;
  const tabs: { key: TabKey; label: string }[] = [
    { key: "incident", label: "Incident" },
    { key: "actions", label: unitActive.length > 0 ? `Actions · ${unitActive.length}` : "Actions" },
    { key: "messages", label: "Messages" },
    { key: "crew", label: "Crew" },
    { key: "vehicle", label: "Vehicle" },
    { key: "water", label: "Water" },
    { key: "patients", label: assignedPatients > 0 ? `Patient care · ${assignedPatients}` : "Patient care" },
  ];

  const alerts = [
    ...sc.property.knownHazards,
    ...sc.property.vulnerabilities,
  ];

  const [minimised, setMinimised] = useState(false);
  const [popped, setPopped] = useState(false);
  // Patient Care lifted into its own window from the tablet.
  const [patientsPopped, setPatientsPopped] = useState(false);
  const ref = incidentRef(incident);
  const unitAppliance = selectedUnit?.appliance ?? onSceneList[0]?.appliance ?? resolvedDeps[0]?.appliance ?? null;
  const unitRow = selectedUnit ?? onSceneList[0] ?? resolvedDeps[0] ?? null;
  const unitCallsign = unitAppliance?.callsign ?? "NO UNIT";
  const unitType = unitAppliance ? unitAppliance.typeName : "Pick a unit on the ground or in Scene units";
  const unitService = unitAppliance?.service ?? sc.pda[0]?.service ?? "Fire";
  const unitOnScene = unitRow?.phase === "at_incident";
  const unitState = resolved
    ? "Incident closed"
    : !unitRow
      ? "No unit selected"
      : unitRow.phase === "at_incident"
        ? "In attendance"
        : unitRow.phase === "mobile"
          ? "Mobile to incident"
          : unitRow.phase === "at_hospital"
            ? "At hospital"
            : "Returning";
  const instruction = resolved
    ? "Incident closed — review the debrief and the log."
    : !unitRow
      ? "Select a committed unit to task its crew."
      : unitRow.phase === "mobile"
        ? "Mobile — rig BA and pre-pair crews on the pre-arrival sheet before landing."
        : "Review hazards and select an available crew task.";

  const latest = log.slice(-8).reverse();
  const [draft, setDraft] = useState("");
  const messages = [
    ...(informantLog ?? []).map((m) => ({ id: `inf:${m.id}`, at: m.firedAt, from: "CALLER", text: m.text })),
    ...log
      .filter((e) => e.kind === "annotation" || e.kind === "commander_assigned" || e.kind === "tactical_mode" || e.kind === "make_pumps")
      .filter((e) => !unitAppliance || e.message.includes(unitAppliance.callsign) || e.kind !== "annotation")
      .map((e) => ({ id: e.id, at: e.timestamp, from: unitAppliance && e.message.startsWith(unitAppliance.callsign) ? unitAppliance.callsign : "CONTROL", text: e.message })),
  ]
    .sort((x, y) => y.at - x.at)
    .slice(0, 20);

  function unitControl(page: UnitControlPage) {
    if (!selectedUnit || !canControl) return null;
    return (
      <BottomActionMenu
        page={page}
        appliance={selectedUnit.appliance}
        deployment={selectedUnit.deployment}
        allOnSceneAppliances={onSceneList.map((r) => r.appliance)}
        tasks={tasks ?? []}
        incident={incident}
        visibleHazards={(sim?.visibleHazards ?? []).map((h) => ({ id: h.id, label: h.label, kind: h.kind }))}
        isCommander={sceneCommanderApplianceId === selectedUnit.appliance.id}
        crewAir={crewAir ?? {}}
        busyCrewIds={busyCrewIds!}
        vehicleGauges={vehicleGauges!}
        now={nowMs}
        onStartTask={onStartTask!}
        onAbortTask={onAbortTask ?? (() => {})}
        onBeginRoadClosure={onBeginRoadClosure ? (kind, crewIds) => onBeginRoadClosure(selectedUnit.appliance.id, kind, crewIds) : undefined}
        onClose={() => setUnitId(null)}
        onSceneSeconds={selectedUnit.phase === "at_incident" ? Math.max(0, (nowMs - selectedUnit.deployment.arrivesAt) / 1000) : null}
        onSetLightState={onSetLightState!}
        onSetPumpRunning={onSetPumpRunning!}
        onSetPumpOperator={onSetPumpOperator!}
        onSetFastAttackDeployed={onSetFastAttackDeployed!}
        onToggleCrewEquipment={onToggleCrewEquipment!}
        onSetCrewLoadout={onSetCrewLoadout}
        onUpdateBaRemarks={onUpdateBaRemarks}
        onUpdateBaEntryPoint={onUpdateBaEntryPoint}
        onSetTreatingCasualty={onSetTreatingCasualty}
        onRequestRotate={onRequestRotate}
        scenarioCasualties={sim?.foundCasualties}
        casualtyProgression={sim?.casualtyProgression}
        sim={sim ?? undefined}
        tacticalMode={tacticalMode ?? null}
        fatigueByApplianceId={fatigueByApplianceId}
        treatmentByCasualtyId={treatmentByCasualtyId}
        onScenePatientDeployments={onSceneList.map((r) => r.deployment)}
        onStartPatientSurvey={onStartPatientSurvey}
        onApplyAirway={onApplyAirway}
        onApplyBreathing={onApplyBreathing}
        onApplyCirculation={onApplyCirculation}
        onAdministerDrug={onAdministerDrug}
        onApplyPackaging={onApplyPackaging}
        onRequestClinician={onRequestClinician}
        onSetTreatmentDestination={onSetTreatmentDestination}
        onSendAtmistPrealert={onSendAtmistPrealert}
        onConveyCasualtyVia={onConveyCasualtyVia}
      />
    );
  }

  // The prototype's task workspace — Actions and Water pages share it.
  function workspace(page: "actions" | "water") {
    if (!selectedUnit) return null;
    const crewList = selectedUnit.appliance.crewMembers;
    const pumpOperator =
      crewList.find((c) => c.id === selectedUnit.deployment.pumpOperatorCrewId) ??
      crewList.find((c) => /Pump|Driver/i.test(c.role)) ??
      crewList[0];
    return (
      <MdtTaskWorkspace
        key={`${page}:${selectedUnit.appliance.id}`}
        page={page}
        incident={incident}
        incidentRef={ref}
        appliance={selectedUnit.appliance}
        phase={selectedUnit.phase}
        onScene={onSceneList.map((r) => r.appliance)}
        tasks={tasks ?? []}
        now={nowMs}
        busyCrewIds={busyCrewIds}
        hazards={(sim?.visibleHazards ?? []).map((h) => ({ id: h.id, label: h.label, kind: h.kind }))}
        casualties={(sim?.foundCasualties ?? []).map((c) => ({ id: c.id, label: c.label }))}
        resolved={resolved}
        onStartTask={onStartTask}
        onAbortTask={onAbortTask}
        onCompleteTask={onCompleteTask}
        onSetTaskCrew={onSetTaskCrew}
        onBeginRoadClosure={onBeginRoadClosure ? (kind, crewIds) => onBeginRoadClosure(selectedUnit.appliance.id, kind, crewIds) : undefined}
        onNote={onNote}
        pumpReady={selectedUnit.deployment.pumpRunning === true && !!selectedUnit.deployment.pumpOperatorCrewId}
        pumpOperatorName={pumpOperator?.name}
        onStartPump={
          onSetPumpOperator && onSetPumpRunning && pumpOperator
            ? () => {
                onSetPumpOperator(selectedUnit.appliance.id, pumpOperator.id);
                onSetPumpRunning(selectedUnit.appliance.id, true);
              }
            : undefined
        }
      />
    );
  }

  // Patient Care — the same workspace control opens from the desk, here
  // filtered to this unit's own patients.
  const patientCare = sim ? (
    <PatientCareWorkspace
      key={unitAppliance?.id ?? "none"}
      sim={sim}
      incident={incident}
      incidentRef={ref}
      focusApplianceId={selectedUnit?.appliance.id ?? null}
      deployments={deployments}
      resolved={resolvedDeps}
      tasks={tasks ?? []}
      now={nowMs}
      treatmentByCasualtyId={treatmentByCasualtyId}
      onSetTreatingCasualty={onSetTreatingCasualty}
      onStartPatientSurvey={onStartPatientSurvey}
      onApplyAirway={onApplyAirway}
      onApplyBreathing={onApplyBreathing}
      onApplyCirculation={onApplyCirculation}
      resusByCasualtyId={resusByCasualtyId}
      onSetOxygen={onSetOxygen}
      onSetResusAirway={onSetResusAirway}
      onAttachMonitor={onAttachMonitor}
      onToggleCapnography={onToggleCapnography}
      onSetCompressor={onSetCompressor}
      onFitLucas={onFitLucas}
      onDeliverShock={onDeliverShock}
      onMovePads={onMovePads}
      onArrestAdrenaline={onArrestAdrenaline}
      onAmiodarone={onAmiodarone}
      onSuspectReversible={onSuspectReversible}
      onTreatReversible={onTreatReversible}
      onStopResus={onStopResus}
      onAdministerDrug={onAdministerDrug}
      onApplyPackaging={onApplyPackaging}
      onApplyEgress={onApplyEgress}
      egressBlocked={incident.scenario.scene?.egressBlocked}
      egressExtraSeconds={incident.scenario.scene?.egressExtraSeconds}
      onRequestClinician={onRequestClinician}
      hemsFlyable={hemsFlyable}
      onSetTreatmentDestination={onSetTreatmentDestination}
      onSendAtmistPrealert={onSendAtmistPrealert}
      onConveyCasualtyVia={onConveyCasualtyVia}
      onConfirmAllergies={onConfirmAllergies}
    />
  ) : null;

  const tablet = (
    <>
      {/* The rugged tablet: dark frame, pale bezel, blue-grey screen with
          the navigation down the left — the VECTOR MDT. */}
      <section className="vec-mdt" aria-label="Mobile data terminal" data-task-workspace={tab !== "incident"}>
        <header className="vec-mdt-handle" title="Drag to move the tablet">
          <span>MOBILE DATA TERMINAL</span>
          {!popped && <button type="button" title="Minimise MDT" onClick={() => setMinimised(true)}>−</button>}
          <button type="button" title="Close MDT" onClick={onClose}>×</button>
          {popped ? (
            <button type="button" title="Dock the MDT back on the desk" onClick={() => setPopped(false)}>⤶</button>
          ) : (
            <button type="button" title="Pop out into its own window" onClick={() => setPopped(true)}>↗</button>
          )}
        </header>
        <div className="vec-mdt-identity">
          <div className="link">MOBILE DATA TERMINAL · {unitService.toUpperCase()} · LOCAL SIM</div>
          <strong>{unitCallsign}</strong>
          <span>{unitType}</span>
          <small>{unitState} · {ref}</small>
        </div>
        <div className="vec-mdt-brief">
          <div className="eyebrow">{ref} · {sc.severity.toUpperCase()}</div>
          <strong>{sc.title}</strong>
          <div>{sc.location.address}, {sc.location.postcode}</div>
          {alerts.length > 0 && !resolved && (
            <div className="hazard"><b>HAZARDS</b> {alerts.join(" · ")}</div>
          )}
          <div className="instruction"><b>CURRENT INSTRUCTION</b><span>{instruction}</span></div>
        </div>
        <nav className="vec-mdt-tabs" aria-label="MDT pages">
          {tabs.map((t) => (
            <button key={t.key} type="button" aria-pressed={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="vec-mdt-body page">
          {tab === "incident" && (
            <>
              {resolved && outcome && (
                <>
                  <div className="rc-caption">DEBRIEF · {ref}</div>
                  <div className="vec-mdt-embed light"><OutcomeView outcome={outcome} /></div>
                </>
              )}
              <div className="rc-caption">ASSIGNED INCIDENT · {ref}</div>
              <h3>{sc.title}</h3>
              <div className="mdt-address">
                <CopyButton text={`${sc.location.address}, ${sc.location.postcode}`} label={`${sc.location.address}, ${sc.location.postcode}`} />
              </div>
              <p className="mdt-sev">
                {sc.severity.toUpperCase()}
                <CopyButton text={ref} label={ref} />
                <CopyButton text={sc.location.postcode} label={sc.location.postcode} />
                <CopyButton text={`${sc.location.coords.lat.toFixed(5)}, ${sc.location.coords.lng.toFixed(5)}`} label="Lat / long" />
              </p>
              <div className="rc-caption">LATEST INCIDENT UPDATES</div>
              {latest.length === 0 ? (
                <p>No updates yet.</p>
              ) : (
                latest.map((e) => (
                  <article key={e.id} className="mdt-message">
                    <small>{fmtTime(e.timestamp)} · {e.kind.replace(/_/g, " ").toUpperCase()}</small>
                    <p>{e.message}</p>
                  </article>
                ))
              )}
              <details className="mdt-workflow" open>
                <summary>Property record &amp; premises risk</summary>
                <div className="vec-mdt-embed light">
                  <p className="mt-1 font-mono text-[11px] text-zinc-600">Caller: &ldquo;{sc.trigger}&rdquo;</p>
                  {sc.severity === "major" && (
                    <CadCard title="METHANE · Major incident">
                      <MethaneTable methane={sc.methane} />
                    </CadCard>
                  )}
                  <CadCard title="Property record">
                    <KeyVal k="Class" v={sc.property.class} />
                    {sc.property.size && <KeyVal k="Size" v={sc.property.size} />}
                    {sc.property.materials && <KeyVal k="Materials" v={sc.property.materials} />}
                    <KeyVal k="Occupants" v={sc.property.occupants} />
                    <KeyVal k="Access" v={sc.property.access} />
                    {sc.property.vulnerabilities.length > 0 && (
                      <ListRows k="Vulnerabilities" items={sc.property.vulnerabilities} tone="amber" />
                    )}
                    {sc.property.knownHazards.length > 0 && (
                      <ListRows k="Hazards" items={sc.property.knownHazards} tone="critical" />
                    )}
                  </CadCard>
                  <CadCard title="Premises risk information">
                    <p className="font-mono text-[11px] text-zinc-600">
                      {sc.pri.hasFormalPri ? "FORMAL PRI ON FILE." : "NO FORMAL PRI (RESIDENTIAL / OPEN)."}
                    </p>
                    {sc.pri.items.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {sc.pri.items.map((it) => (
                          <li key={it} className="border-l-4 border-amber-400 bg-amber-50 px-2 py-1 text-[12px] leading-snug">{it}</li>
                        ))}
                      </ul>
                    )}
                  </CadCard>
                  <CadCard title="Dispatch targets">
                    <ul className="space-y-1 text-[12px]">
                      {sc.evaluation.targets.map((t) => (
                        <li key={t.metric} className="border-b border-zinc-200 pb-1">
                          <span className="font-bold">{t.metric}</span>
                          <span className="text-zinc-600"> — {t.target}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[11px] italic text-zinc-500">{sc.evaluation.lesson}</p>
                  </CadCard>
                </div>
              </details>
              {sim && !resolved && (
                <details className="mdt-workflow" open={hazardCount > 0}>
                  <summary>Hazards · {hazardCount}</summary>
                  <div className="vec-mdt-embed tall" style={CAD_VARS}>
                    <HazardsBody sim={sim} incident={incident} deployments={deployments} resolved={resolvedDeps} />
                  </div>
                </details>
              )}
              {sim && !resolved && (
                <div className="mdt-task-controls">
                  <button type="button" className={locatedCount > 0 ? "rc-primary" : ""} onClick={() => setTab("patients")}>
                    Patient care · {locatedCount} located
                  </button>
                </div>
              )}
              {!resolved && incident.scenario.crs && (
                <details className="mdt-workflow">
                  <summary>Crash recovery system</summary>
                  <div className="vec-mdt-embed tall" style={CAD_VARS}>
                    <CrsPanel
                      vehicles={incident.scenario.crs}
                      onScene={onSceneList.filter((r) => r.appliance.service === "Fire")}
                      tasks={tasks}
                      busyCrewIds={busyCrewIds}
                      now={now}
                      onStartTask={onStartTask}
                    />
                  </div>
                </details>
              )}
              <details className="mdt-workflow">
                <summary>Property view · aerial</summary>
                <div className="vec-mdt-embed aerial">
                  <PropertyAerial lat={sc.location.coords.lat} lng={sc.location.coords.lng} />
                </div>
              </details>
              <details className="mdt-workflow">
                <summary>Full incident log · {log.length}</summary>
                <div className="vec-mdt-embed light"><LogList log={log} /></div>
              </details>
            </>
          )}

          {tab === "actions" && (
            <>
              {!selectedUnit ? (
                <>
                  <div className="rc-caption">UNIT TASKING</div>
                  <p>{resolvedDeps.length === 0 ? "No crews committed yet — mobilise the attendance from Dispatch." : "Select a committed unit to task its crew."}</p>
                  <div className="rc-action-grid">
                    {resolvedDeps.map((r) => (
                      <button key={r.appliance.id} type="button" onClick={() => setUnitId(r.appliance.id)}>
                        <strong>{r.appliance.callsign}</strong>
                        <span>{r.appliance.typeName}</span>
                        <small>{r.phase === "at_incident" ? "In attendance" : r.phase === "mobile" ? "Mobile to incident" : r.phase.replace(/_/g, " ")}</small>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {workspace("actions")}
                  {selectedUnit.phase === "mobile" && (
                    <details className="mdt-workflow" open>
                      <summary>Pre-arrival sheet · rig BA and pair crews</summary>
                      <div className="vec-mdt-embed tall" style={CAD_VARS}>
                        <PreArrivalBody
                          appliance={selectedUnit.appliance}
                          deployment={selectedUnit.deployment}
                          now={nowMs}
                          casualties={sim?.foundCasualties ?? []}
                          onSetPreCommitBaCrew={onSetPreCommitBaCrew ?? (() => {})}
                          onSetTreatingCasualty={onSetTreatingCasualty ?? (() => {})}
                        />
                      </div>
                    </details>
                  )}
                  {baByAppliance.length > 0 && (
                    <>
                      <div className="rc-caption">BA ENTRY CONTROL · {totalBaTeams}</div>
                      <div className="vec-mdt-embed light" style={CAD_VARS}>
                        {baByAppliance.map(({ appliance, tasks: bt }) => (
                          <BaControlBoard
                            key={appliance.id}
                            appliance={appliance}
                            baTasks={bt}
                            now={nowMs}
                            onUpdateRemarks={onUpdateBaRemarks}
                            onUpdateEntryPoint={onUpdateBaEntryPoint}
                            onWithdrawTeam={onAbortTask}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {tab === "messages" && (
            <>
              <div className="rc-caption">UNIT MESSAGES · {unitCallsign}</div>
              {messages.length === 0 ? (
                <p>No messages for this unit yet.</p>
              ) : (
                messages.map((m) => (
                  <article key={m.id} className="mdt-message">
                    <small>{fmtTime(m.at)} · {m.from}</small>
                    <p>{m.text}</p>
                  </article>
                ))
              )}
              <label className="mdt-compose">
                MESSAGE TO CONTROL
                <textarea aria-label="Message to control" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Enter a situation update…" />
              </label>
              <button
                type="button"
                className="rc-primary"
                disabled={!draft.trim() || !onSendMessage}
                onClick={() => {
                  if (!draft.trim()) return;
                  onSendMessage?.(unitCallsign, draft.trim());
                  setDraft("");
                }}
              >
                Send local message
              </button>
              <details className="mdt-workflow" open={!!informantOnCall}>
                <summary>999 call information {informantOnCall ? "· caller on the line" : ""}</summary>
                <div className="vec-mdt-embed tall" style={CAD_VARS}>
                  <CallInformationBody incident={incident} informantLog={informantLog} informantOnCall={informantOnCall} />
                </div>
              </details>
            </>
          )}

          {tab === "crew" && (
            <>
              <div className="rc-caption">CREW · QUALIFICATIONS</div>
              {!unitAppliance ? (
                <p>Select a committed unit to see its crew.</p>
              ) : (
                <>
                  {unitAppliance.crewMembers.map((c) => {
                    const onTask = (tasks ?? []).find((t) => t.state === "active" && t.assignedCrewIds.includes(c.id));
                    const air = crewAir?.[c.id];
                    return (
                      <div key={c.id} className="rc-crew">
                        <strong>{c.name}</strong>
                        <span>{c.role} · {c.yearsService} yrs</span>
                        <small>{c.quals.length ? c.quals.join(" · ") : "No recorded competencies"}</small>
                        <small className={onTask ? "on" : ""}>
                          {onTask ? `On task · ${onTask.kind.replace(/_/g, " ")}` : busyCrewIds?.has(c.id) ? "Committed" : "Available"}
                          {typeof air === "number" ? ` · BA ${Math.round(air)} bar` : ""}
                        </small>
                      </div>
                    );
                  })}
                  <p>
                    Crew {unitAppliance.crew.current}/{unitAppliance.crew.max}
                    {fatigueByApplianceId?.[unitAppliance.id] ? ` · fatigue ${Math.round(fatigueByApplianceId[unitAppliance.id])}%` : ""}
                    . Competencies are scenario records, not real qualifications.
                  </p>
                  {selectedUnit && canControl && selectedUnit.phase === "at_incident" && (
                    <>
                      <div className="rc-caption">EQUIPMENT &amp; LOADOUT</div>
                      <div className="vec-mdt-embed tall" style={CAD_VARS}>{unitControl("crew")}</div>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {tab === "vehicle" && (
            <>
              <div className="rc-caption">VEHICLE DETAILS</div>
              {!unitAppliance ? (
                <p>Select a committed unit to see its vehicle.</p>
              ) : (
                <>
                  <dl className="rc-details">
                    <dt>Callsign</dt><dd><CopyButton text={unitAppliance.callsign} label={unitAppliance.callsign} /></dd>
                    <dt>Type</dt><dd>{unitAppliance.typeName}{unitAppliance.capabilities?.length ? ` · ${unitAppliance.capabilities.join(", ")}` : ""}</dd>
                    <dt>Station</dt><dd>{stations.find((st) => st.id === unitAppliance.stationId)?.name ?? unitAppliance.stationId}</dd>
                    <dt>Make</dt><dd>{unitAppliance.make} {unitAppliance.model}</dd>
                    <dt>Registration</dt><dd><CopyButton text={unitAppliance.vrm} label={unitAppliance.vrm} /></dd>
                    <dt>Status</dt><dd>{unitState}</dd>
                    <dt>Fuel · water</dt><dd>{Math.round(unitAppliance.fuelPct)}% · {Math.round(unitAppliance.waterPct)}% ({unitAppliance.waterLitres.toLocaleString()} L)</dd>
                  </dl>
                  <button type="button" className="rc-primary" disabled={!selectedUnit || !onArmPlacement || resolved} onClick={() => selectedUnit && onArmPlacement?.(selectedUnit.appliance.id)}>
                    Place / move on map
                  </button>
                  {selectedUnit && canControl && (
                    <>
                      <div className="rc-caption">LIGHTS · GAUGES · CONDITION</div>
                      <div className="vec-mdt-embed tall" style={CAD_VARS}>{unitControl("vehicle")}</div>
                    </>
                  )}
                  <div className="rc-caption">ITEM REGISTER · KIT CARRIED</div>
                  <details className="stock-register" open>
                    <summary>Kit · {unitAppliance.kit.length} lines</summary>
                    {unitAppliance.kit.map((k) => (
                      <div key={k}>{k}</div>
                    ))}
                  </details>
                </>
              )}
            </>
          )}

          {tab === "patients" && (
            <>
              <div className="rc-caption">PATIENT CARE · {unitCallsign}</div>
              {!sim || resolved ? (
                <p>{resolved ? "Incident closed — patient records are in the debrief." : "Patient records open once the incident is live."}</p>
              ) : patientsPopped ? (
                <>
                  <p>Patient care is open in its own window.</p>
                  <div className="mdt-task-controls">
                    <button type="button" className="rc-primary" onClick={() => setPatientsPopped(false)}>Bring it back to the tablet</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mdt-task-controls">
                    <button type="button" onClick={() => setPatientsPopped(true)} title="Open Patient care on another screen">↗ Open in its own window</button>
                  </div>
                  <div className="vec-mdt-embed patients">{patientCare}</div>
                </>
              )}
            </>
          )}

          {tab === "water" && (
            <>
              {!selectedUnit ? (
                <>
                  <div className="rc-caption">WATER SUPPLY &amp; FIREFIGHTING</div>
                  <p>Select a committed fire appliance to work its water.</p>
                </>
              ) : selectedUnit.appliance.service !== "Fire" || selectedUnit.appliance.waterLitres === 0 ? (
                <>
                  <div className="rc-caption">WATER SUPPLY &amp; FIREFIGHTING</div>
                  <p>{selectedUnit.appliance.callsign} carries no pump or water systems.</p>
                </>
              ) : (
                <>
                  {workspace("water")}
                  {canControl && selectedUnit.phase === "at_incident" && (
                    <details className="mdt-workflow">
                      <summary>Pump, tank &amp; fast attack</summary>
                      <div className="vec-mdt-embed tall" style={CAD_VARS}>{unitControl("water")}</div>
                    </details>
                  )}
                </>
              )}
            </>
          )}
        </div>
        <div className="vec-mdt-status">
          <button type="button" disabled className={unitOnScene ? "go" : ""}>{unitState.toUpperCase()}</button>
          <button type="button" onClick={() => setTab("messages")}>Contact control</button>
          <button
            type="button"
            disabled={!selectedUnit || !onArmPlacement || resolved}
            title={selectedUnit ? "Place or move this unit on the ground" : "Pick a unit first"}
            onClick={() => selectedUnit && onArmPlacement?.(selectedUnit.appliance.id)}
          >
            Map position
          </button>
          {!resolved ? (
            <button type="button" className="stop" onClick={onResolve}>Stop message</button>
          ) : (
            <button type="button" className="stop" onClick={onDismiss}>End debrief</button>
          )}
        </div>
        <footer className="vec-mdt-footer">LOCAL SIMULATION · {unitCallsign} · {ref}</footer>
      </section>
    </>
  );

  return (
    <>
    <Rnd
      default={{
        x: frame.current.x,
        y: frame.current.y,
        width: frame.current.width,
        height: frame.current.height,
      }}
      onDragStop={(_e, d) => {
        frame.current = { ...frame.current, x: d.x, y: d.y };
        saveMdtFrame(frame.current);
      }}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        frame.current = {
          x: pos.x,
          y: pos.y,
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        };
        saveMdtFrame(frame.current);
      }}
      minWidth={560}
      minHeight={540}
      bounds="window"
      dragHandleClassName="vec-mdt-handle"
      // Sits above the ground view (z-1200).
      className="z-[1250]"
      style={minimised || popped ? { display: "none" } : undefined}
    >
      {tablet}
    </Rnd>
    {popped && (
      <PopoutWindow id="mdt" title={`MDT · ${unitCallsign}`} width={700} height={720} onClose={() => setPopped(false)}>
        {tablet}
      </PopoutWindow>
    )}
    {patientsPopped && patientCare && (
      <PopoutWindow id="patients-mdt" title={`Patient care · ${unitCallsign}`} width={560} height={760} onClose={() => setPatientsPopped(false)}>
        <PopoutFrame title={`Patient care · ${unitCallsign}`} onDock={() => setPatientsPopped(false)}>
          {patientCare}
        </PopoutFrame>
      </PopoutWindow>
    )}
    {minimised && (
      <button type="button" className="vec-mdt-min" onClick={() => setMinimised(false)} title="Restore the MDT">
        MDT · {unitCallsign} <span>{unitState}</span> ↗
      </button>
    )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components (light CAD theme)
// ---------------------------------------------------------------------------

function CadCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-2.5 border border-zinc-400 bg-white first:mt-0">
      <h2 className="border-b border-zinc-300 bg-[#e7e7ea] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-700">
        {title}
      </h2>
      <div className="px-2.5 py-2">{children}</div>
    </section>
  );
}

function OutcomeView({ outcome }: { outcome: IncidentOutcome }) {
  return (
    <section>
      <div className="flex items-center gap-4 border border-zinc-400 bg-white p-3">
        <div className="flex size-16 items-center justify-center border-2 border-green-700 bg-green-50 font-mono text-3xl font-bold text-green-700">
          {outcome.grade}
        </div>
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Dispatch grade · {outcome.passedCount}/{outcome.totalCount} targets met
          </p>
          <p className="mt-1 text-sm">{outcome.summary}</p>
        </div>
      </div>

      <ul className="mt-2.5 space-y-1.5">
        {outcome.metrics.map((m) => (
          <li key={m.label} className="border border-zinc-300 bg-white px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{m.label}</span>
              <span
                className={
                  "px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] " +
                  (m.passed === true
                    ? "bg-green-600 text-white"
                    : m.passed === "partial"
                      ? "bg-amber-400 text-black"
                      : "bg-red-600 text-white")
                }
              >
                {m.passed === true ? "Met" : m.passed === "partial" ? "Partial" : "Missed"}
              </span>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-zinc-500">
              <div>
                Target <span className="text-zinc-900">{m.target}</span>
              </div>
              <div>
                Actual <span className="text-zinc-900">{m.actual}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">
        Appliances returning to station — end the debrief when all are back.
      </p>
    </section>
  );
}

function LogList({ log }: { log: LogEntry[] }) {
  return (
    <ol className="space-y-0.5 font-mono text-[11px] leading-snug">
      {[...log].reverse().map((e) => (
        <li key={e.id} className="flex gap-2 border-b border-zinc-200 py-0.5">
          <span className="shrink-0 tabular-nums text-zinc-500">
            {fmtTime(e.timestamp)}
          </span>
          <span
            className={
              e.kind === "incident_opened" || e.kind === "setback"
                ? "font-bold text-red-700"
                : e.kind === "mobilised"
                  ? "text-amber-700"
                  : e.kind === "in_attendance"
                    ? "text-blue-700"
                    : e.kind === "resolved"
                      ? "font-bold text-green-700"
                      : "text-zinc-800"
            }
          >
            {e.message}
          </span>
        </li>
      ))}
      {log.length === 0 && <li className="text-zinc-500">No events yet.</li>}
    </ol>
  );
}

function MethaneTable({ methane }: { methane: Incident["scenario"]["methane"] }) {
  const rows: [string, string, string][] = [
    ["M", "Major incident", methane.M],
    ["E", "Exact location", methane.E],
    ["T", "Type", methane.T],
    ["H", "Hazards", methane.H],
    ["A", "Access", methane.A],
    ["N", "Number of casualties", methane.N],
    ["E", "Emergency services", methane.emergencyServices],
  ];
  return (
    <dl className="text-[12px]">
      {rows.map(([letter, label, val], i) => (
        <div
          key={`${letter}-${i}`}
          className="grid grid-cols-[1.5rem_8rem_1fr] items-baseline gap-2 border-b border-zinc-200 py-1 last:border-b-0"
        >
          <dt className="text-center font-mono font-bold text-red-700">{letter}</dt>
          <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-500">
            {label}
          </dt>
          <dd>{val}</dd>
        </div>
      ))}
    </dl>
  );
}

function KeyVal({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] items-baseline gap-2 border-b border-zinc-200 py-1 text-[12px] last:border-b-0">
      <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-500">
        {k}
      </dt>
      <dd>{v}</dd>
    </div>
  );
}

function ListRows({
  k,
  items,
  tone,
}: {
  k: string;
  items: string[];
  tone: "amber" | "critical";
}) {
  const cls =
    tone === "amber"
      ? "border-l-4 border-amber-400 bg-amber-50"
      : "border-l-4 border-red-500 bg-red-50";
  return (
    <div className="py-1">
      <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-500">
        {k}
      </dt>
      <ul className="mt-1 space-y-1">
        {items.map((it) => (
          <li key={it} className={`px-2 py-1 text-[12px] leading-snug ${cls}`}>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}


function fmtTime(ts: number): string {
  const d = new Date(ts);
  return [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}


