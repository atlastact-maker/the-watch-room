"use client";

// The MDT — the rugged tablet in the cab, now a patient-care terminal.
// One screen: Patient Care for the unit's own patients, opening the
// CASUALTY CARE record on the tablet itself or in a window of its own.
// Everything else the crew used to do from here (tasking, water, crew,
// vehicle) lives on the desk and the ground; unit placement is on the
// ground view's unit strip.

import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import {
  type Deployment,
  type Incident,
  type IncidentOutcome,
  type LogEntry,
} from "@/lib/sim/incident_types";
import type { StationWithAppliances } from "../page";
import {
  resolveDeployments,
  type Props as IncidentViewProps,
  type ResolvedDeployment,
} from "./incident-view";
import { incidentRef } from "../vector/model";
import { PopoutWindow } from "../vector/popout";
import { PatientCareWorkspace, assignedCasualtyIds } from "../vector/patient-care";
import { MdtTaskWorkspace } from "../vector/mdt-task-workspace";
import type { Eta } from "./deployment-board";
import type { Patch } from "@/lib/sim/areas";

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
  onRecordObservation?: (casualtyId: string, text: string, by: string) => void;
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


export function DraggableIncidentMdt(props: Props) {
  const {
    incident,
    stations,
    deployments,
    outcome,
    onClose,
    sim,
    tasks,
    now,
    unitId: unitIdProp,
    onSetUnitId,
  } = props;
  const resolved = !!outcome;
  // Which committed unit's patients the tablet shows. Controlled by the
  // dashboard when the props are supplied (ground-map clicks open the
  // tablet for that unit); internal state otherwise.
  const [internalUnitId, setInternalUnitId] = useState<string | null>(null);
  const unitId = unitIdProp !== undefined ? unitIdProp : internalUnitId;
  const setUnitId = onSetUnitId ?? setInternalUnitId;
  const [initialFrame] = useState<MdtFrame>(
    () =>
      loadMdtFrame() ?? {
        x: typeof window !== "undefined" ? Math.max(16, window.innerWidth - 760 - 24) : 24,
        y: 110,
        width: 760,
        height: 720,
      },
  );
  const frame = useRef<MdtFrame>(initialFrame);
  useEffect(() => {
    setUnitId(null);
  }, [resolved, incident.id]);

  const sc = incident.scenario;
  const nowMs = now ?? incident.receivedAt;
  const resolvedDeps: ResolvedDeployment[] = resolveDeployments(deployments, stations, nowMs);
  const selectedUnit = unitId ? resolvedDeps.find((r) => r.appliance.id === unitId) ?? null : null;
  const unitRow = selectedUnit ?? resolvedDeps.find((r) => r.phase === "at_incident") ?? resolvedDeps[0] ?? null;
  const unitAppliance = unitRow?.appliance ?? null;
  const unitCallsign = unitAppliance?.callsign ?? "NO UNIT";
  const unitService = unitAppliance?.service ?? sc.pda[0]?.service ?? "Fire";
  const ref = incidentRef(incident);
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
  const assigned = unitAppliance ? assignedCasualtyIds(unitAppliance.id, deployments, tasks ?? []).size : 0;

  const [minimised, setMinimised] = useState(false);
  const [popped, setPopped] = useState(false);
  // The tablet's modules. Casualty care is the medical module; Fire and
  // Police carry the service's tasking for a unit of that service.
  const [module, setModule] = useState<"care" | "fire" | "police">("care");
  const [taskPage, setTaskPage] = useState<"actions" | "water">("actions");
  const onSceneAppliances = resolvedDeps.filter((r) => r.phase === "at_incident").map((r) => r.appliance);
  const pumpOperator = unitAppliance
    ? unitAppliance.crewMembers.find((c) => c.id === unitRow?.deployment.pumpOperatorCrewId) ??
      unitAppliance.crewMembers.find((c) => /Pump|Driver/i.test(c.role)) ??
      unitAppliance.crewMembers[0]
    : undefined;

  function serviceModule(service: "Fire" | "Police") {
    if (resolved) return <div className="vec-tile-empty">Incident closed</div>;
    if (!unitAppliance || !unitRow) return <div className="vec-tile-empty">Commit a {service.toLowerCase()} unit to open this module</div>;
    if (unitAppliance.service !== service) {
      return (
        <div className="vec-tile-empty">
          {unitCallsign} is {unitAppliance.service === "Ambulance" ? "an ambulance" : `a ${unitAppliance.service.toLowerCase()} unit`} — pick a {service.toLowerCase()} unit above for this module
        </div>
      );
    }
    return (
      <>
        {service === "Fire" && unitAppliance.waterLitres > 0 && (
          <div className="vec-patients-filter">
            <span className="lbl">PAGE</span>
            <div className="vec-segments" role="group" aria-label="Page">
              <button type="button" aria-pressed={taskPage === "actions"} onClick={() => setTaskPage("actions")}>Actions</button>
              <button type="button" aria-pressed={taskPage === "water"} onClick={() => setTaskPage("water")}>Water</button>
            </div>
          </div>
        )}
        <div className="vec-mdt-body page vec-tasking">
          <MdtTaskWorkspace
            key={`${taskPage}:${unitAppliance.id}`}
            page={service === "Fire" && unitAppliance.waterLitres > 0 ? taskPage : "actions"}
            incident={incident}
            incidentRef={ref}
            appliance={unitAppliance}
            phase={unitRow.phase}
            onScene={onSceneAppliances}
            tasks={tasks ?? []}
            now={nowMs}
            busyCrewIds={props.busyCrewIds}
            hazards={(sim?.visibleHazards ?? []).map((h) => ({ id: h.id, label: h.label, kind: h.kind }))}
            casualties={(sim?.foundCasualties ?? []).map((c) => ({ id: c.id, label: c.label }))}
            resolved={resolved}
            onStartTask={props.onStartTask}
            onAbortTask={props.onAbortTask}
            onCompleteTask={props.onCompleteTask}
            onSetTaskCrew={props.onSetTaskCrew}
            onBeginRoadClosure={props.onBeginRoadClosure ? (kind, crewIds) => props.onBeginRoadClosure?.(unitAppliance.id, kind, crewIds) : undefined}
            onNote={props.onNote}
            pumpReady={unitRow.deployment.pumpRunning === true && !!unitRow.deployment.pumpOperatorCrewId}
            pumpOperatorName={pumpOperator?.name}
            onStartPump={
              props.onSetPumpOperator && props.onSetPumpRunning && pumpOperator
                ? () => {
                    props.onSetPumpOperator?.(unitAppliance.id, pumpOperator.id);
                    props.onSetPumpRunning?.(unitAppliance.id, true);
                  }
                : undefined
            }
          />
        </div>
      </>
    );
  }

  const tablet = (
    <section className="vec-mdt vec-mdt--care" aria-label="Mobile data terminal · patient care">
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
        <div className="link">{unitService.toUpperCase()} · {ref} · {sc.title}</div>
        <div className="vec-mdt-unit">
          <strong>{unitCallsign}</strong>
          {resolvedDeps.length > 1 && (
            <select
              aria-label="Unit"
              value={unitAppliance?.id ?? ""}
              onChange={(e) => setUnitId(e.target.value || null)}
              title="Which unit's patients this tablet shows"
            >
              {resolvedDeps.map((r) => (
                <option key={r.appliance.id} value={r.appliance.id}>
                  {r.appliance.callsign} · {r.appliance.typeName}
                </option>
              ))}
            </select>
          )}
        </div>
        <small>{unitState} · {assigned ? `${assigned} patient${assigned === 1 ? "" : "s"} assigned` : "No patients assigned"}</small>
      </div>
      <nav className="vec-mdt-modules" aria-label="Modules">
        <button type="button" aria-pressed={module === "care"} onClick={() => setModule("care")}>Casualty care{assigned ? ` · ${assigned}` : ""}</button>
        <button type="button" aria-pressed={module === "fire"} onClick={() => setModule("fire")}>Fire</button>
        <button type="button" aria-pressed={module === "police"} onClick={() => setModule("police")}>Police</button>
      </nav>
      <div className="vec-mdt-body care">
        {module === "fire" ? (
          serviceModule("Fire")
        ) : module === "police" ? (
          serviceModule("Police")
        ) : resolved ? (
          <div className="vec-tile-empty">Incident closed — patient records are in the debrief</div>
        ) : !sim ? (
          <div className="vec-tile-empty">Patient records open once the incident is live</div>
        ) : (
          <PatientCareWorkspace
            key={unitAppliance?.id ?? "none"}
            inline
            sim={sim}
            incident={incident}
            incidentRef={ref}
            focusApplianceId={unitAppliance?.id ?? null}
            deployments={deployments}
            resolved={resolvedDeps}
            tasks={tasks ?? []}
            now={nowMs}
            treatmentByCasualtyId={props.treatmentByCasualtyId}
            resusByCasualtyId={props.resusByCasualtyId}
            onSetTreatingCasualty={props.onSetTreatingCasualty}
            onStartPatientSurvey={props.onStartPatientSurvey}
            onApplyAirway={props.onApplyAirway}
            onApplyBreathing={props.onApplyBreathing}
            onApplyCirculation={props.onApplyCirculation}
            onSetOxygen={props.onSetOxygen}
            onSetResusAirway={props.onSetResusAirway}
            onAttachMonitor={props.onAttachMonitor}
            onToggleCapnography={props.onToggleCapnography}
            onSetCompressor={props.onSetCompressor}
            onFitLucas={props.onFitLucas}
            onDeliverShock={props.onDeliverShock}
            onMovePads={props.onMovePads}
            onArrestAdrenaline={props.onArrestAdrenaline}
            onAmiodarone={props.onAmiodarone}
            onSuspectReversible={props.onSuspectReversible}
            onTreatReversible={props.onTreatReversible}
            onStopResus={props.onStopResus}
            onAdministerDrug={props.onAdministerDrug}
            onApplyPackaging={props.onApplyPackaging}
            onApplyEgress={props.onApplyEgress}
            egressBlocked={incident.scenario.scene?.egressBlocked}
            egressExtraSeconds={incident.scenario.scene?.egressExtraSeconds}
            onRequestClinician={props.onRequestClinician}
            hemsFlyable={props.hemsFlyable}
            onSetTreatmentDestination={props.onSetTreatmentDestination}
            onSendAtmistPrealert={props.onSendAtmistPrealert}
            onConveyCasualtyVia={props.onConveyCasualtyVia}
            onConfirmAllergies={props.onConfirmAllergies}
            onRecordObservation={props.onRecordObservation}
          />
        )}
      </div>
      <footer className="vec-mdt-footer">LOCAL SIMULATION · {unitCallsign} · {ref}</footer>
    </section>
  );

  return (
    <>
      <Rnd
        default={{
          x: initialFrame.x,
          y: initialFrame.y,
          width: initialFrame.width,
          height: initialFrame.height,
        }}
        onDragStop={(_e, d) => {
          frame.current = { ...frame.current, x: d.x, y: d.y };
          saveMdtFrame(frame.current);
        }}
        onResizeStop={(_e, _dir, el, _delta, pos) => {
          frame.current = { x: pos.x, y: pos.y, width: el.offsetWidth, height: el.offsetHeight };
          saveMdtFrame(frame.current);
        }}
        minWidth={560}
        minHeight={540}
        bounds="window"
        dragHandleClassName="vec-mdt-handle"
        className="z-[1250]"
        style={minimised || popped ? { display: "none" } : undefined}
      >
        {tablet}
      </Rnd>
      {popped && (
        <PopoutWindow id="mdt" title={`MDT · ${unitCallsign}`} width={1100} height={800} onClose={() => setPopped(false)}>
          {tablet}
        </PopoutWindow>
      )}
      {minimised && (
        <button type="button" className="vec-mdt-min" onClick={() => setMinimised(false)} title="Restore the MDT">
          MDT · {unitCallsign}
          <span>{assigned ? `${assigned} patient${assigned === 1 ? "" : "s"}` : unitState}</span>
        </button>
      )}
    </>
  );
}

// Kept for the props the desk still passes; the tablet no longer shows them.
export type { Eta, Patch, LogEntry, Deployment, Incident, IncidentOutcome, StationWithAppliances, IncidentViewProps };
