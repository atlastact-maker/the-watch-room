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
import { FireCommandScreen } from "../vector/fire-command";
import { PoliceControlsScreen, type SupportKind, type PoliceSelection } from "../vector/police-controls";
import { VitalMonitorPanel } from "../vector/vital-monitor";
import { MdtNotepad } from "../vector/mdt-notepad";
import { scopeOfApplianceType } from "@/lib/sim/incident_types";
import type { RecordIndex } from "@/lib/sim/records";
import type { LedsCheck } from "@/lib/sim/leds";
import type { SubjectVehicle } from "@/lib/sim/subject";
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

  // Police module — the people and vehicles on the job, the desk's PNC
  // audit, and the doors into the LEDS terminal and the ANPR console.
  recordIndex?: RecordIndex;
  ledsChecks?: LedsCheck[];
  onOpenLeds?: (query?: string, kind?: "vehicle" | "person" | "address") => void;
  onLedsCheck?: (c: LedsCheck) => void;
  onOpenAnpr?: () => void;
  /** A support request from the crew to control — logged and flagged.
   *  Police kinds are typed; fire assistance messages come through the
   *  same door as strings (make_pumps with the number as detail). */
  onRequestSupport?: (kind: SupportKind | string, applianceId: string, detail?: string) => void;
  onDeclareTacticalMode?: (mode: "offensive" | "defensive" | "transitional") => void;
  /** The desk's Systems menu opening PNC or ANPR on the tablet. */
  policePage?: { page: "pnc" | "anpr"; seq: number } | null;
  /** The car the job is chasing, when there is one. */
  subject?: SubjectVehicle | null;
};

// Remembered tablet frame — survives the MDT being collapsed/reopened
// (component unmount) and full reloads. Best-effort localStorage.
type MdtFrame = { x: number; y: number; width: number; height: number };
const MDT_FRAME_KEY = "twr:mdt-frame:v3";
/** The tablet is one fixed size — a device, not a window. It moves, it
 *  pops out, it hides; it does not resize. Clamped to the screen it is
 *  on so a laptop still gets the whole thing. */
const MDT_WIDTH = 1400;
const MDT_HEIGHT = 920;

/** As big as the screen allows up to the preset — the police and fire
 *  modules are laid out to fit the tablet without the page scrolling,
 *  so the tablet takes the room it can get. */
function presetMdtSize(): { width: number; height: number } {
  if (typeof window === "undefined") return { width: MDT_WIDTH, height: MDT_HEIGHT };
  return {
    width: Math.min(MDT_WIDTH, Math.max(640, window.innerWidth - 24)),
    height: Math.min(MDT_HEIGHT, Math.max(560, window.innerHeight - 70)),
  };
}

function loadMdtFrame(): MdtFrame | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MDT_FRAME_KEY);
    if (!raw) return null;
    const f = JSON.parse(raw) as { x: number; y: number };
    if (typeof f.x !== "number" || typeof f.y !== "number") return null;
    const size = presetMdtSize();
    // Never restore a position that has drifted off the visible screen.
    return {
      ...size,
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
    window.localStorage.setItem(MDT_FRAME_KEY, JSON.stringify({ x: f.x, y: f.y }));
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
  const [initialFrame] = useState<MdtFrame>(() => {
    const size = presetMdtSize();
    return (
      loadMdtFrame() ?? {
        ...size,
        x: typeof window !== "undefined" ? Math.max(8, window.innerWidth - size.width - 12) : 24,
        y: typeof window !== "undefined" ? Math.max(8, Math.min(90, window.innerHeight - size.height - 8)) : 90,
      }
    );
  });
  const frame = useRef<MdtFrame>(initialFrame);
  // The tablet's position is controlled: it goes wherever it is dragged,
  // off the edges included, and a drop that would lose the grab strip is
  // pulled back just far enough to reach it.
  const [pos, setPos] = useState({ x: initialFrame.x, y: initialFrame.y });
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
  const [notepad, setNotepad] = useState(false);
  const [policeSel, setPoliceSel] = useState<PoliceSelection | null>(null);
  // The tablet's modules. Casualty care is the medical module; Fire and
  // Police carry the service's tasking for a unit of that service.
  const [module, setModule] = useState<"care" | "fire" | "police">(props.policePage ? "police" : "care");
  const [seenPolicePage, setSeenPolicePage] = useState(props.policePage?.seq ?? 0);
  if (props.policePage && props.policePage.seq !== seenPolicePage) {
    setSeenPolicePage(props.policePage.seq);
    setModule("police");
  }
  // The patient pinned in the top strip: the one open on the care screen,
  // else the first this unit is responsible for.
  const [openCasualtyId, setOpenCasualtyId] = useState<string | null>(null);
  const unitCasualtyIds = unitAppliance ? assignedCasualtyIds(unitAppliance.id, deployments, tasks ?? []) : new Set<string>();
  const stripCasualtyId = openCasualtyId && sim?.foundCasualties.some((c) => c.id === openCasualtyId) ? openCasualtyId : [...unitCasualtyIds][0] ?? null;
  const stripCasualty = stripCasualtyId ? sim?.foundCasualties.find((c) => c.id === stripCasualtyId) ?? null : null;
  const stripPaired = stripCasualtyId
    ? deployments.filter((d) => d.treatingCasualtyId === stripCasualtyId && nowMs >= d.arrivesAt && scopeOfApplianceType(resolvedDeps.find((r) => r.appliance.id === d.applianceId)?.appliance.type ?? "Police_Response") !== "none").length
    : 0;
  function serviceModule(service: "Fire" | "Police") {
    if (resolved) return <div className="vec-tile-empty">Incident closed</div>;
    if (!unitAppliance || !unitRow) return <div className="vec-tile-empty">Commit a {service.toLowerCase()} unit to open this module</div>;
    // PNC and ANPR are any unit's to use from the tablet; the rest of
    // the police module wants a police unit.
    if (unitAppliance.service !== service && !(service === "Police" && props.policePage)) {
      return (
        <div className="vec-tile-empty">
          {unitCallsign} is {unitAppliance.service === "Ambulance" ? "an ambulance" : `a ${unitAppliance.service.toLowerCase()} unit`} — pick a {service.toLowerCase()} unit above for this module
        </div>
      );
    }
    if (service === "Fire") {
      return (
        <FireCommandScreen
          key={unitAppliance.id}
          incident={incident}
          incidentRef={ref}
          appliance={unitAppliance}
          unit={unitRow}
          resolved={resolvedDeps}
          tasks={tasks ?? []}
          log={props.log}
          now={nowMs}
          sim={sim ?? null}
          vehicleGauges={props.vehicleGauges}
          sceneCommanderApplianceId={props.sceneCommanderApplianceId}
          busyCrewIds={props.busyCrewIds}
          resolvedIncident={resolved}
          onStartTask={props.onStartTask}
          onAbortTask={props.onAbortTask}
          onCompleteTask={props.onCompleteTask}
          onSetTaskCrew={props.onSetTaskCrew}
          onNote={props.onNote}
          onBeginRoadClosure={props.onBeginRoadClosure}
          onSetPumpRunning={props.onSetPumpRunning}
          onSetPumpOperator={props.onSetPumpOperator}
          onUpdateBaRemarks={props.onUpdateBaRemarks}
          onUpdateBaEntryPoint={props.onUpdateBaEntryPoint}
          onArmPlacement={props.onArmPlacement}
          tacticalMode={props.tacticalMode}
          onDeclareTacticalMode={props.onDeclareTacticalMode}
          onRequestSupport={props.onRequestSupport}
        />
      );
    }
    return (
      <PoliceControlsScreen
        key={`police:${unitAppliance.id}`}
        incident={incident}
        incidentRef={ref}
        appliance={unitAppliance}
        unit={unitRow}
        resolved={resolvedDeps}
        tasks={tasks ?? []}
        log={props.log}
        now={nowMs}
        sim={sim ?? null}
        busyCrewIds={props.busyCrewIds}
        resolvedIncident={resolved}
        recordIndex={props.recordIndex}
        ledsChecks={props.ledsChecks}
        onStartTask={props.onStartTask}
        onAbortTask={props.onAbortTask}
        onCompleteTask={props.onCompleteTask}
        onNote={props.onNote}
        onBeginRoadClosure={props.onBeginRoadClosure}
        onOpenLeds={props.onOpenLeds}
        onLedsCheck={props.onLedsCheck}
        onOpenAnpr={props.onOpenAnpr}
        onRequestSupport={props.onRequestSupport}
        onArmPlacement={props.onArmPlacement}
        requestedPage={props.policePage}
        subject={props.subject}
        onSelectionChange={setPoliceSel}
      />
    );
  }

  const tablet = (
    <section className="vec-mdt vec-mdt--care" aria-label="Mobile data terminal · patient care">
      <header className="vec-mdt-handle" title="Drag to move the tablet">
        <span>MOBILE DATA TERMINAL</span>
        <div className="vec-mdt-handle-btns">
          <button type="button" className="txt" title="Notebook" aria-pressed={notepad} onClick={() => setNotepad((v) => !v)}>✎ Notebook</button>
          {!popped && <button type="button" title="Minimise MDT" aria-label="Minimise" onClick={() => setMinimised(true)}>−</button>}
          {popped ? (
            <button type="button" title="Dock the MDT back on the desk" aria-label="Dock" onClick={() => setPopped(false)}>⤶</button>
          ) : (
            <button type="button" title="Pop out into its own window" aria-label="Pop out" onClick={() => setPopped(true)}>↗</button>
          )}
          <button type="button" title="Close MDT" aria-label="Close" onClick={onClose}>×</button>
        </div>
      </header>
      <div className="vec-mdt-identity">
        <div className="vec-mdt-me">
          <div className="link">{unitService.toUpperCase()} · {ref} · {sc.title}</div>
          <div className="vec-mdt-unit">
            <strong>{unitCallsign}</strong>
            {resolvedDeps.length > 1 && (
              <select
                aria-label="Unit"
                value={unitAppliance?.id ?? ""}
                onChange={(e) => setUnitId(e.target.value || null)}
                title="Which unit this tablet is controlling"
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
        <div className="vec-mdt-vitals">
          {module === "police" ? (
            policeSel && (policeSel.vehicle || policeSel.driver) ? (
              <div className="vec-mdt-inhand">
                {policeSel.vehicle ? (
                  <div className="vec-mdt-inhand-veh">
                    <span className="anpr-plate">{policeSel.vehicle.vrm}</span>
                    <div>
                      <b>{policeSel.vehicle.description}</b>
                      <span>{policeSel.vehicle.colour || "Colour —"} · {policeSel.vehicle.make || "Make —"} {policeSel.vehicle.model}</span>
                      <span className={policeSel.vehicle.markers.length ? "stop" : policeSel.vehicle.checked ? "go" : ""}>{policeSel.vehicle.checked ? (policeSel.vehicle.markers.length ? policeSel.vehicle.markers.join(" · ") : "PNC clear") : "PNC not checked"} · {policeSel.vehicle.status}</span>
                    </div>
                  </div>
                ) : (
                  <div className="vec-mdt-inhand-veh dim"><span className="anpr-plate">— — —</span><div><b>No vehicle</b></div></div>
                )}
                {policeSel.driver ? (
                  <div className="vec-mdt-inhand-drv">
                    <small>DRIVER / PERSON</small>
                    <b>{policeSel.driver.label}{policeSel.driver.dob ? <em> · {policeSel.driver.dob}</em> : null}</b>
                    <span className={policeSel.driver.identityTone}>{policeSel.driver.identity}</span>
                    <span className={policeSel.driver.markers.length ? "stop" : ""}>{policeSel.driver.markers.length ? policeSel.driver.markers.join(" · ") : policeSel.driver.status}</span>
                  </div>
                ) : (
                  <div className="vec-mdt-inhand-drv dim"><small>DRIVER / PERSON</small><b>No one in hand</b></div>
                )}
              </div>
            ) : (
              <div className="vec-mdt-vitals-empty">NO VEHICLE OR PERSON IN HAND</div>
            )
          ) : stripCasualty && !resolved ? (
            <>
              <div className="vec-mdt-vitals-who">
                <b>{(stripCasualty.label ?? stripCasualty.id).toUpperCase()}</b>
                <span>{props.treatmentByCasualtyId?.[stripCasualty.id]?.revealedCondition ?? "Vital signs"}</span>
              </div>
              <VitalMonitorPanel
                casualtyId={stripCasualty.id}
                treatment={props.treatmentByCasualtyId?.[stripCasualty.id] ?? null}
                resus={props.resusByCasualtyId?.[stripCasualty.id]}
                paired={stripPaired}
                now={nowMs}
                by={unitCallsign}
                compact
                onRecordObservation={props.onRecordObservation}
                onAttachMonitor={props.onAttachMonitor}
              />
            </>
          ) : (
            <div className="vec-mdt-vitals-empty">NO PATIENT ON THE MONITOR{unitAppliance && !resolved ? " · OPEN A CASUALTY" : ""}</div>
          )}
        </div>
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
            onOpenChange={setOpenCasualtyId}
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
      <MdtNotepad key={incident.id} incidentId={incident.id} incidentRef={ref} unitCallsign={unitCallsign} open={notepad} onClose={() => setNotepad(false)} onNote={props.onNote} />
    </section>
  );

  return (
    <>
      <Rnd
        size={{ width: initialFrame.width, height: initialFrame.height }}
        position={pos}
        onDrag={(_e, d) => setPos({ x: d.x, y: d.y })}
        onDragStop={(_e, d) => {
          const maxX = typeof window !== "undefined" ? window.innerWidth - 120 : d.x;
          const maxY = typeof window !== "undefined" ? window.innerHeight - 40 : d.y;
          const x = Math.max(-(frame.current.width - 120), Math.min(maxX, d.x));
          const y = Math.max(0, Math.min(maxY, d.y));
          frame.current = { ...frame.current, x, y };
          saveMdtFrame(frame.current);
          setPos({ x, y });
        }}
        enableResizing={false}
        dragHandleClassName="vec-mdt-handle"
        className="z-[1250]"
        style={minimised || popped ? { display: "none" } : undefined}
      >
        {tablet}
      </Rnd>
      {popped && (
        <PopoutWindow id="mdt" title={`MDT · ${unitCallsign}`} width={MDT_WIDTH} height={MDT_HEIGHT + 40} onClose={() => setPopped(false)}>
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
