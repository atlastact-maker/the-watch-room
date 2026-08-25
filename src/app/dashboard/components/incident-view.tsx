"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Appliance, AreaCode } from "@/lib/sim/types";
import type {
  Deployment,
  HoseType,
  Incident,
  KitKind,
  LogEntry,
  PatientTreatmentState,
  Task,
  TaskKind,
} from "@/lib/sim/incident_types";
import { CAPABILITIES_BY_TYPE } from "@/lib/sim/incident_types";
import type { IncidentSimState } from "@/lib/sim/incident_sim";
import type { StationWithAppliances } from "../page";
import { GroundSceneMap } from "./ground-scene-map";
import { DeploymentBoard, type DeployArgs, type Eta } from "./deployment-board";
import type { InformantMessage } from "./informant-panel";
import { RadioFeed } from "./radio-feed";
import { DraggableTreatmentPanel } from "./treatment-panel";
import { ViewSwitch } from "./header";

export type Props = {
  incident: Incident;
  stations: StationWithAppliances[];
  patch?: AreaCode | null;
  deployments: Deployment[];
  etas: Record<string, Eta>;
  log: LogEntry[];
  now: number;
  sim: IncidentSimState;
  tasks: Task[];
  sceneCommanderApplianceId: string | null;
  crewAir: Record<string, number>;
  busyCrewIds: Set<string>;
  vehicleGauges: Record<string, { fuelPct: number; waterPct: number; conditionPct: number }>;
  onSetParkingPos: (applianceId: string, lat: number, lng: number, bearingDeg: number) => void;
  onSetPreCommitBaCrew: (applianceId: string, crewIds: string[]) => void;
  onSetLightState: (applianceId: string, state: import("@/lib/sim/incident_types").LightState) => void;
  onSetPumpRunning: (applianceId: string, running: boolean) => void;
  onSetPumpOperator: (applianceId: string, crewId: string | null) => void;
  onSetFastAttackDeployed: (applianceId: string, deployed: boolean) => void;
  onToggleCrewEquipment: (applianceId: string, crewId: string, item: string) => void;
  onDeploy: (args: DeployArgs) => void;
  onStandDownForWelfare: (applianceId: string) => void;
  onStandDown: (applianceId: string) => void;
  onStartTask: (args: {
    applianceId: string;
    kind: TaskKind;
    assignedCrewIds: string[];
    hydrantId?: string;
    sourceApplianceId?: string;
    hoseType?: HoseType;
    kitKind?: KitKind;
    hazardId?: string;
    mitigationMethod?: string;
    closurePos?: { lat: number; lng: number };
    closureBearingDeg?: number;
  }) => void;
  onAbortTask: (taskId: string) => void;
  onUpdateBaRemarks?: (taskId: string, text: string) => void;
  onUpdateBaEntryPoint?: (taskId: string, label: string) => void;
  onSetTreatingCasualty?: (applianceId: string, casualtyId: string | null) => void;
  informantLog?: InformantMessage[];
  informantOnCall?: boolean;
  tacticalMode?: "offensive" | "defensive" | "transitional" | null;
  onDeclareTacticalMode?: (mode: "offensive" | "defensive" | "transitional") => void;
  fatigueByApplianceId?: Record<string, number>;
  // Patient treatment wiring — passed through to the Treatment tab.
  treatmentByCasualtyId?: Record<string, import("@/lib/sim/incident_types").PatientTreatmentState>;
  onStartPatientSurvey?: (casualtyId: string) => void;
  onApplyAirway?: (
    casualtyId: string,
    action: import("@/lib/sim/incident_types").AirwayAction,
    by: string,
  ) => void;
  onApplyBreathing?: (
    casualtyId: string,
    action: import("@/lib/sim/incident_types").BreathingAction,
    by: string,
  ) => void;
  onApplyCirculation?: (
    casualtyId: string,
    action: import("@/lib/sim/incident_types").CirculationAction,
    by: string,
  ) => void;
  onAdministerDrug?: (
    casualtyId: string,
    drug: import("@/lib/sim/incident_types").DrugName,
    by: string,
  ) => void;
  onApplyPackaging?: (
    casualtyId: string,
    action: import("@/lib/sim/incident_types").PackagingAction,
    by: string,
  ) => void;
  onRequestClinician?: (
    scope: "ap" | "ccc" | "basics" | "hems",
    casualtyId: string,
  ) => void;
  /** Whether the NWAA airframe can fly right now (daylight + weather).
   *  False → the HEMS request row explains the night car responds. */
  hemsFlyable?: boolean;
  /** MDT tablet visibility toggle for the mission bar. */
  mdtVisible?: boolean;
  onToggleMdt?: () => void;
  /** Open the pre-arrival panel for an inbound (not yet on scene) unit —
   *  lets the operator pre-allocate crews to tasks (BA etc.) en route. */
  /** Armed placement from the MDT's Inbound console. */
  placePendingApplianceId?: string | null;
  onClearPlacePending?: () => void;
  /** Ground-map vehicle clicks open the MDT unit-control page — the
   *  dashboard owns which unit is focused (halo on the map). */
  selectedVehicleId?: string | null;
  onVehicleSelect?: (applianceId: string) => void;
  /** Road-closure placement in progress (crew already picked, next map
   *  click drops the cones). Owned by the dashboard so the MDT can start
   *  closures too. */
  pendingClosure: PendingClosure | null;
  onSetPendingClosure: (pc: PendingClosure | null) => void;
  /** Vehicle awaiting a rotate-bearing click on the ground map. */
  rotatePendingApplianceId: string | null;
  onSetRotatePending: (applianceId: string | null) => void;
  /** Casualty muster / evac point — set by clicking the ground map. */
  musterPos?: { lat: number; lng: number } | null;
  pendingMuster?: boolean;
  onSetPendingMuster?: (armed: boolean) => void;
  onPlaceMuster?: (lat: number, lng: number) => void;
  onSetTreatmentDestination?: (
    casualtyId: string,
    type: import("@/lib/sim/scene").HospitalDestinationType,
    name: string,
  ) => void;
  onSendAtmistPrealert?: (casualtyId: string) => void;
  onConveyCasualtyVia?: (applianceId: string, casualtyId: string) => void;
  onClose: () => void;
};

export type ResolvedDeployment = {
  deployment: Deployment;
  appliance: Appliance;
  phase: "mobile" | "at_incident" | "at_hospital" | "returning" | "home";
};

/** A road closure waiting for its placement click on the ground map. */
export type PendingClosure = {
  applianceId: string;
  kind: "close_carriageway" | "close_road";
  crewIds: string[];
};

/** Join deployments to their appliances and movement phase. Shared with the
 *  MDT tablet, which renders the same hazards/casualties bodies. */
export function resolveDeployments(
  deployments: Deployment[],
  stations: StationWithAppliances[],
  now: number,
): ResolvedDeployment[] {
  return deployments
    .map((d): ResolvedDeployment | null => {
      const station = stations.find((s) =>
        s.appliances.some((a) => a.id === d.applianceId),
      );
      const appliance = station?.appliances.find((a) => a.id === d.applianceId);
      if (!appliance) return null;
      return { deployment: d, appliance, phase: phaseOf(d, now) };
    })
    .filter((x): x is ResolvedDeployment => x !== null);
}

const SITREP_FILTERS = [
  { key: "all", label: "All" },
  { key: "ops", label: "Ops" },
  { key: "crews", label: "Crews" },
  { key: "hazards", label: "Hazards" },
  { key: "command", label: "Command" },
  { key: "tasks", label: "Tasks" },
] as const;
type SitrepFilter = (typeof SITREP_FILTERS)[number]["key"];

const FILTER_KINDS: Record<SitrepFilter, LogEntry["kind"][] | null> = {
  all: null,
  ops: [
    "incident_opened",
    "resolved",
    "returning",
    "back_at_station",
    "refuel_complete",
    "fire_stage",
    "setback",
  ],
  crews: ["mobilised", "in_attendance", "welfare_break", "welfare_complete", "ba_committed", "ba_withdrawn"],
  hazards: [
    "hazard_confirmed",
    "casualty_found",
    "casualty_deteriorated",
    "casualty_expectant",
    "fire_stage",
    "setback",
    "at_hospital",
    "offload_complete",
  ],
  command: ["tactical_mode", "make_pumps", "sector_assigned", "annotation", "commander_assigned", "defect"],
  tasks: ["task_started", "task_completed", "hydrant_connected"],
};

export function IncidentView({
  incident,
  stations,
  deployments,
  log,
  now,
  sim,
  tasks,
  sceneCommanderApplianceId,
  crewAir,
  busyCrewIds,
  vehicleGauges,
  onSetParkingPos,
  onStartTask,
  onAbortTask,
  tacticalMode,
  onDeclareTacticalMode,
  mdtVisible,
  onToggleMdt,
  placePendingApplianceId,
  onClearPlacePending,
  selectedVehicleId,
  onVehicleSelect,
  pendingClosure,
  onSetPendingClosure,
  rotatePendingApplianceId,
  onSetRotatePending,
  musterPos,
  pendingMuster,
  onSetPendingMuster,
  onPlaceMuster,
  onClose,
}: Props) {
  const scene = incident.scenario.scene;
  // Road-closure placement + vehicle rotate are owned by the dashboard so
  // both the map action menu AND the MDT can start them; the next
  // ground-map click completes the interaction. Esc cancels a closure.
  useEffect(() => {
    if (!pendingClosure) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSetPendingClosure(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingClosure, onSetPendingClosure]);
  // Bottom feed collapse — the operator can pin it to reclaim screen
  // real-estate for the map. Everything else lives on the MDT tablet.
  const [sitrepCollapsed, setSitrepCollapsed] = useState(false);

  const resolved: ResolvedDeployment[] = resolveDeployments(deployments, stations, now);

  const onSceneDeployments = resolved.filter((r) => r.phase === "at_incident");
  const enRouteDeployments = resolved.filter((r) => r.phase === "mobile");
  const mobileCount = enRouteDeployments.length;
  const returningCount = resolved.filter(
    (r) => r.phase === "returning" || r.phase === "at_hospital",
  ).length;

  const baCommitted = tasks
    .filter((t) => t.kind === "ba_sar" && t.state === "active")
    .reduce((acc, t) => acc + (t.baCrewIds?.length ?? 0), 0);

  const elapsedSec = Math.max(0, (now - incident.receivedAt) / 1000);
  const personsReported = /persons reported/i.test(
    incident.scenario.title + " " + incident.scenario.type,
  );

  return (
    <div className="fixed inset-0 z-[1200] flex flex-col bg-(--color-bg)">
      <MissionBar
        incident={incident}
        elapsedSec={elapsedSec}
        onScene={onSceneDeployments.length}
        mobile={mobileCount}
        returning={returningCount}
        baCommitted={baCommitted}
        personsReported={personsReported}
        sim={sim}
        casualtiesFound={sim.foundCasualties.length}
        plannedCasualties={Math.max(
          0,
          (scene?.casualties?.length ?? 0) - (sim.absentCasualtyIds?.length ?? 0),
        )}
        tacticalMode={tacticalMode ?? null}
        icAssigned={!!sceneCommanderApplianceId}
        onDeclareTacticalMode={onDeclareTacticalMode}
        mdtVisible={mdtVisible}
        onToggleMdt={onToggleMdt}
        musterArmed={!!pendingMuster}
        musterSet={!!musterPos}
        onArmMuster={onSetPendingMuster ? () => onSetPendingMuster(!pendingMuster) : undefined}
        onClose={onClose}
      />

      <div
        className="grid min-h-0 flex-1 overflow-hidden"
        style={{
          gridTemplateColumns: `1fr ${sitrepCollapsed ? "40px" : "320px"}`,
          gridTemplateRows: "1fr",
        }}
      >
        {/* Full map + MDT view: call, hazards, casualties, BA and
            resourcing all live on the MDT tablet — the ground view is
            the scene plus the SITREP/radio feed column on the right. */}
        <div
          className="relative min-h-0 overflow-hidden bg-(--color-bg)"
          style={{ gridRow: "1 / 2", gridColumn: "1 / 2" }}
        >
          <GroundSceneMap
            incident={incident}
            resolved={resolved}
            placePendingApplianceId={placePendingApplianceId}
            onClearPlacePending={onClearPlacePending}
            onScene={onSceneDeployments.map((r) => ({
              deployment: r.deployment,
              appliance: r.appliance,
            }))}
            enRoute={enRouteDeployments.map((r) => ({
              deployment: r.deployment,
              appliance: r.appliance,
            }))}
            sim={sim}
            tasks={tasks}
            sceneCommanderApplianceId={sceneCommanderApplianceId}
            crewAir={crewAir}
            busyCrewIds={busyCrewIds}
            vehicleGauges={vehicleGauges}
            selectedApplianceId={selectedVehicleId ?? null}
            now={now}
            onSetParkingPos={onSetParkingPos}
            rotatePendingApplianceId={rotatePendingApplianceId}
            onClearRotatePending={() => onSetRotatePending(null)}
            onStartTask={onStartTask}
            onAbortTask={onAbortTask}
            onSelectAppliance={(id) => {
              if (id) onVehicleSelect?.(id);
            }}
            closurePick={pendingClosure ? { kind: pendingClosure.kind } : null}
            musterPick={!!pendingMuster}
            musterPos={musterPos ?? null}
            onPlaceMuster={onPlaceMuster}
            onPlaceClosure={(lat, lng, bearingDeg) => {
              if (!pendingClosure) return;
              onStartTask({
                applianceId: pendingClosure.applianceId,
                kind: pendingClosure.kind,
                assignedCrewIds: pendingClosure.crewIds,
                closurePos: { lat, lng },
                closureBearingDeg: bearingDeg,
              });
              onSetPendingClosure(null);
            }}
          />
          <SceneOverlay
            enRouteAwaitingParking={enRouteDeployments.filter((r) => !r.deployment.parkingPos).length}
          />
          {/* Road-closure placement banner */}
          {pendingClosure && (
            <div className="pointer-events-auto absolute left-1/2 top-3 z-[650] -translate-x-1/2 rounded-sm border border-(--color-critical)/60 bg-(--color-bg)/95 px-4 py-2 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="dot-live size-2 rounded-full bg-(--color-critical)" />
                <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-text)">
                  {pendingClosure.kind === "close_road"
                    ? "Click the road to close it"
                    : "Click the carriageway to close it"}
                </span>
                <button
                  type="button"
                  onClick={() => onSetPendingClosure(null)}
                  className="rounded-sm border border-(--color-border) px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:border-(--color-critical) hover:text-(--color-critical)"
                >
                  Cancel · Esc
                </button>
              </div>
            </div>
          )}
          {/* Muster-point placement banner */}
          {pendingMuster && (
            <div className="pointer-events-auto absolute left-1/2 top-3 z-[650] -translate-x-1/2 rounded-sm border border-(--color-ok)/60 bg-(--color-bg)/95 px-4 py-2 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="dot-live size-2 rounded-full bg-(--color-ok)" />
                <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-text)">
                  Click the map to set the casualty muster point
                </span>
                <button
                  type="button"
                  onClick={() => onSetPendingMuster?.(false)}
                  className="rounded-sm border border-(--color-border) px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:border-(--color-ok) hover:text-(--color-ok)"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        <div
          className="min-h-0 overflow-hidden border-l border-(--color-border-subtle)"
          style={{ gridRow: "1 / 2", gridColumn: "2 / 3" }}
        >
          {sitrepCollapsed ? (
            <CollapsedRail title="SITREP / Radio" side="right" onExpand={() => setSitrepCollapsed(false)} />
          ) : (
            <BottomFeedPane
              log={log}
              collapsed={false}
              onToggleCollapse={() => setSitrepCollapsed(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mission bar (incl. fire bar)
// ---------------------------------------------------------------------------

function MissionBar({
  incident,
  elapsedSec,
  onScene,
  mobile,
  returning,
  baCommitted,
  personsReported,
  sim,
  casualtiesFound,
  plannedCasualties,
  tacticalMode,
  icAssigned,
  onDeclareTacticalMode,
  mdtVisible,
  onToggleMdt,
  musterArmed,
  musterSet,
  onArmMuster,
  onClose,
}: {
  incident: Incident;
  elapsedSec: number;
  onScene: number;
  mobile: number;
  returning: number;
  baCommitted: number;
  personsReported: boolean;
  sim: IncidentSimState;
  casualtiesFound: number;
  plannedCasualties: number;
  tacticalMode: "offensive" | "defensive" | "transitional" | null;
  icAssigned: boolean;
  onDeclareTacticalMode?: (mode: "offensive" | "defensive" | "transitional") => void;
  mdtVisible?: boolean;
  onToggleMdt?: () => void;
  musterArmed?: boolean;
  musterSet?: boolean;
  onArmMuster?: () => void;
  onClose: () => void;
}) {
  return (
    <header className="relative flex items-center gap-4 border-b border-(--color-border-subtle) bg-(--color-surface)/80 px-6 py-3">
      <div className="flex flex-1 items-center gap-3 font-mono text-[11px] uppercase tracking-widest">
        <span className="dot-live size-1.5 rounded-full bg-(--color-critical)" />
        <span className="text-(--color-amber)">Ground View</span>
        <span className="text-(--color-border)">/</span>
        <span className="text-(--color-text-dim)">INC</span>
        <span className="text-(--color-text)">#{incident.scenario.id}</span>
        {personsReported && (
          <span className="rounded-sm border border-(--color-critical)/60 bg-(--color-critical)/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-critical)">
            Persons reported
          </span>
        )}
        <TacticalModeChip
          tacticalMode={tacticalMode}
          icAssigned={icAssigned}
          onDeclare={onDeclareTacticalMode}
        />
      </div>

      {/* Centred incident summary \— fire bar, counters, mission clock.
          The fire bar only earns its slot on fire jobs — or on any job
          where something has actually caught (an RTC vehicle smoking).
          A water rescue or chemical leak shows counters only. */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-4">
        {fireBarRelevant(incident, sim) && <FireBar sim={sim} />}
        <Counter label="On scene" value={String(onScene)} tone="ok" />
        <Counter label="Mobile" value={String(mobile)} tone="amber" />
        <Counter label="Rtn" value={String(returning)} tone="info" />
        <Counter label="BA" value={String(baCommitted)} tone="critical" />
        {plannedCasualties > 0 && (
          <Counter
            label="Cas."
            value={`${casualtiesFound}/${plannedCasualties}`}
            tone="critical"
          />
        )}
        <div className="flex flex-col items-end leading-tight">
          <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
            Mission clock
          </div>
          <div className="font-mono text-xl font-semibold tracking-tight text-(--color-amber) tabular-nums">
            {fmtHms(elapsedSec)}
          </div>
          {sim.firstArrivalElapsedSec > 0 && (
            <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
              On scene · <span className="text-(--color-info) tabular-nums">{fmtHms(sim.firstArrivalElapsedSec)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        {onArmMuster && (
          <button
            type="button"
            onClick={onArmMuster}
            className={
              "rounded-sm border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors " +
              (musterArmed
                ? "border-(--color-ok) bg-(--color-ok)/20 text-(--color-ok)"
                : "border-(--color-border) text-(--color-text-dim) hover:border-(--color-ok) hover:text-(--color-ok)")
            }
            title="Designate the casualty muster / evacuation point on the map"
          >
            {musterArmed ? "Click map…" : musterSet ? "Move muster point" : "Muster point"}
          </button>
        )}
        {onToggleMdt && (
          <button
            type="button"
            onClick={onToggleMdt}
            className={
              "rounded-sm border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors " +
              (mdtVisible
                ? "border-(--color-amber) bg-(--color-amber)/15 text-(--color-amber)"
                : "border-(--color-border) text-(--color-text-dim) hover:border-(--color-amber-dim) hover:text-(--color-amber)")
            }
            title={mdtVisible ? "Hide the MDT tablet" : "Show the MDT tablet"}
          >
            MDT
          </button>
        )}
        <ViewSwitch
          mode="ground"
          groundEnabled
          onSelect={(m) => {
            if (m === "area") onClose();
          }}
        />
      </div>
    </header>
  );
}

function TacticalModeChip({
  tacticalMode,
  icAssigned,
  onDeclare,
}: {
  tacticalMode: "offensive" | "defensive" | "transitional" | null;
  icAssigned: boolean;
  onDeclare?: (mode: "offensive" | "defensive" | "transitional") => void;
}) {
  const [open, setOpen] = useState(false);
  if (!icAssigned) {
    return (
      <span
        className="rounded-sm border border-(--color-border) bg-(--color-surface-raised) px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)"
        title="Assign an Incident Commander before declaring tactical mode"
      >
        Tactical mode · IC not assigned
      </span>
    );
  }
  const label = tacticalMode ? `Tactical · ${tacticalMode.charAt(0).toUpperCase() + tacticalMode.slice(1)}` : "Tactical · Not declared";
  const tone =
    tacticalMode === "offensive"
      ? "border-(--color-critical)/60 bg-(--color-critical)/10 text-(--color-critical)"
      : tacticalMode === "defensive"
        ? "border-(--color-info)/60 bg-(--color-info)/10 text-(--color-info)"
        : tacticalMode === "transitional"
          ? "border-(--color-amber)/60 bg-(--color-amber)/10 text-(--color-amber)"
          : "border-(--color-border) bg-(--color-surface-raised) text-(--color-text-muted)";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          "rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest transition-colors " +
          tone
        }
      >
        {label} <span aria-hidden>{open ? "▴" : "▾"}</span>
      </button>
      {open && onDeclare && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-56 rounded-sm border border-(--color-border) bg-(--color-surface) shadow-xl"
          onMouseLeave={() => setOpen(false)}
        >
          {(
            [
              { mode: "offensive", desc: "Interior attack · crews in the risk area" },
              { mode: "transitional", desc: "Switching between offensive / defensive" },
              { mode: "defensive", desc: "No crews in the risk area · exterior only" },
            ] as const
          ).map((o) => (
            <button
              key={o.mode}
              type="button"
              onClick={() => {
                onDeclare(o.mode);
                setOpen(false);
              }}
              className={
                "block w-full border-b border-(--color-border-subtle) px-3 py-2 text-left last:border-b-0 hover:bg-(--color-surface-raised) " +
                (tacticalMode === o.mode ? "bg-(--color-surface-raised)" : "")
              }
            >
              <div className="font-mono text-[11px] uppercase tracking-widest text-(--color-text)">
                {o.mode}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                {o.desc}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const FIRE_STAGE_LABEL: Record<IncidentSimState["fireStage"], string> = {
  none: "No fire",
  incipient: "Incipient",
  developing: "Developing",
  fully_developed: "Fully developed",
  flashover_risk: "FLASHOVER RISK",
  under_control: "Under control",
  extinguished: "Extinguished",
};

function fireStageTone(stage: IncidentSimState["fireStage"]): string {
  switch (stage) {
    case "extinguished":
    case "under_control":
      return "text-(--color-ok)";
    case "incipient":
      return "text-(--color-text-dim)";
    case "developing":
      return "text-(--color-amber)";
    case "fully_developed":
      return "text-(--color-critical)";
    case "flashover_risk":
      return "text-(--color-critical)";
    default:
      return "text-(--color-text-dim)";
  }
}

/** Confirmed-fire scenario types always carry the bar. Everything else —
 *  non-fire jobs (RTC, hazmat, water rescue) AND alarm-investigation
 *  jobs (AFA, hospital alarm) whose whole identity is "probably false"
 *  — only shows it once an actual fire has taken hold, so the bar never
 *  leaks the answer before crews confirm it. */
function fireBarRelevant(incident: Incident, sim: IncidentSimState): boolean {
  if (sim.fireMaterial === null) return false; // no fire seat authored at all
  const confirmedFireTypes: Incident["scenario"]["type"][] = [
    "dwelling_fire_persons_reported",
    "industrial_fire",
    "wildfire_moorland",
    "high_rise_dwelling_fire",
    "education_premises_fire",
  ];
  if (confirmedFireTypes.includes(incident.scenario.type)) return true;
  return sim.fireRadiusM > 0.05;
}

function FireBar({ sim }: { sim: IncidentSimState }) {
  const maxR = 15;
  const pct = Math.max(0, Math.min(100, (sim.fireRadiusM / maxR) * 100));
  const shrinking = sim.fireRateMpm < -0.02;
  const growing = sim.fireRateMpm > 0.02;
  const barColour = shrinking
    ? "bg-(--color-ok)"
    : growing
      ? "bg-(--color-critical)"
      : "bg-(--color-amber)";
  const sign = sim.fireRateMpm > 0 ? "+" : sim.fireRateMpm < 0 ? "−" : "±";
  const rateAbs = Math.abs(sim.fireRateMpm).toFixed(2);
  const stageLabel = FIRE_STAGE_LABEL[sim.fireStage];
  const stageTone = fireStageTone(sim.fireStage);
  const flashover = sim.fireStage === "flashover_risk" && sim.flashoverCountdownSec !== null;
  return (
    <div className="flex min-w-[240px] flex-col">
      <div className="flex items-baseline justify-between font-mono text-[9px] uppercase tracking-widest">
        <span className="flex items-center gap-1.5 text-(--color-text-dim)">
          Fire Ø {sim.fireRadiusM.toFixed(1)} m
          <span className={`${stageTone} ${flashover ? "animate-pulse" : ""}`}>· {stageLabel}</span>
        </span>
        <span
          className={
            shrinking ? "text-(--color-ok)" : growing ? "text-(--color-critical)" : "text-(--color-amber)"
          }
        >
          {sign} {rateAbs} m/min {shrinking ? "↓" : growing ? "↑" : "→"}
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-sm border border-(--color-border-subtle) bg-(--color-bg)">
        <div className={`h-full ${barColour} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
      </div>
      {flashover && (
        <div className="mt-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-(--color-critical)">
          <span className="animate-pulse">Flashover imminent</span>
          <span className="tabular-nums">{fmtHms(sim.flashoverCountdownSec ?? 0)}</span>
        </div>
      )}
    </div>
  );
}

function Counter({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ok" | "amber" | "info" | "critical";
}) {
  const colour =
    tone === "ok"
      ? "text-(--color-ok)"
      : tone === "amber"
        ? "text-(--color-amber)"
        : tone === "info"
          ? "text-(--color-info)"
          : "text-(--color-critical)";
  return (
    <div className="flex flex-col items-end">
      <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
        {label}
      </span>
      <span className={`font-mono text-lg font-semibold tabular-nums ${colour}`}>
        {value}
      </span>
    </div>
  );
}

export function HazardsBody({
  sim,
  incident,
  deployments,
  resolved,
}: {
  sim: IncidentSimState;
  incident: Incident;
  deployments: Deployment[];
  resolved: ResolvedDeployment[];
}) {
  const scene = incident.scenario.scene;
  const totalInScene = scene?.hazards.length ?? 0;
  const discovered = sim.visibleHazards;
  const hiddenCount = Math.max(0, totalInScene - discovered.length);
  const casualties = sim.foundCasualties;
  // Build a map of casualty id → paired ambulance callsign so we can show
  // "· G50-D1 treating" on the casualty card in the left-rail hazards panel.
  const pairingByCasualtyId = new Map<string, string>();
  for (const d of deployments) {
    if (!d.treatingCasualtyId) continue;
    const callsign = resolved.find((r) => r.appliance.id === d.applianceId)?.appliance.callsign;
    if (callsign) pairingByCasualtyId.set(d.treatingCasualtyId, callsign);
  }
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 text-xs">
      <PanelSub label="On-scene hazards" tone="critical">
        {discovered.length === 0 ? (
          <p className="text-(--color-text-dim)">None confirmed yet.</p>
        ) : (
          <ul className="space-y-1">
            {discovered.map((h) => (
              <li
                key={h.id}
                className="rounded-sm border border-(--color-critical)/30 bg-(--color-critical)/5 px-2 py-1.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-(--color-critical)">{h.id}</span>
                  {h.knownFromPri && (
                    <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                      PRI
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-(--color-text)">{h.label}</div>
                <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-(--color-text-muted)">
                  {h.kind}
                </div>
              </li>
            ))}
          </ul>
        )}
      </PanelSub>

      {hiddenCount > 0 && (
        <PanelSub label="Undiscovered" tone="amber">
          <p className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-muted)">
            {hiddenCount} hazard{hiddenCount === 1 ? "" : "s"} may still be on the property — survey
            the building to reveal them.
          </p>
        </PanelSub>
      )}

      {casualties.length > 0 && (
        <PanelSub label={`Casualties · ${casualties.length}`} tone="critical">
          <ul className="space-y-1">
            {casualties.map((c) => {
              const prog = sim.casualtyProgression[c.id];
              const currentSeverity = prog?.severity ?? c.severity;
              const stage = prog?.stage ?? "located";
              const stageLabel = CASUALTY_STAGE_LABEL[stage];
              const stageTone = CASUALTY_STAGE_TONE[stage];
              const deteriorateAt = prog?.deteriorateAt ?? null;
              const secsToDeteriorate =
                deteriorateAt !== null ? Math.max(0, (deteriorateAt - Date.now()) / 1000) : null;
              const urgent = secsToDeteriorate !== null && secsToDeteriorate < 120;
              const treatingCallsign = pairingByCasualtyId.get(c.id);
              return (
                <li
                  key={c.id}
                  className="rounded-sm border border-(--color-critical)/30 bg-(--color-critical)/5 px-2 py-1.5"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-(--color-text)">{c.label ?? c.id}</span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-amber)">
                      {currentSeverity}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-widest">
                    <span className={stageTone}>{stageLabel}</span>
                    {secsToDeteriorate !== null && (
                      <span
                        className={
                          "tabular-nums " +
                          (urgent ? "text-(--color-critical)" : "text-(--color-text-dim)")
                        }
                      >
                        ↓ {fmtHms(secsToDeteriorate)}
                      </span>
                    )}
                  </div>
                  {treatingCallsign && (
                    <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-(--color-ok)">
                      · {treatingCallsign} treating
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </PanelSub>
      )}
    </div>
  );
}

const CASUALTY_STAGE_LABEL: Record<IncidentSimState["casualtyProgression"][string]["stage"], string> = {
  undiscovered: "Undiscovered",
  located: "Located · awaiting medic",
  in_treatment: "In treatment",
  extricated: "Extricated",
  conveying: "En route to hospital",
  at_hospital: "At hospital",
  expectant: "Expectant",
};

const CASUALTY_STAGE_TONE: Record<IncidentSimState["casualtyProgression"][string]["stage"], string> = {
  undiscovered: "text-(--color-text-dim)",
  located: "text-(--color-amber)",
  in_treatment: "text-(--color-info)",
  extricated: "text-(--color-info)",
  conveying: "text-(--color-ok)",
  at_hospital: "text-(--color-ok)",
  expectant: "text-(--color-critical)",
};

export function CasualtiesBody({
  sim,
  deployments,
  resolved,
  tasks,
  now,
  treatmentByCasualtyId,
  onSetTreatingCasualty,
  onStartPatientSurvey,
  onApplyAirway,
  onApplyBreathing,
  onApplyCirculation,
  onAdministerDrug,
  onApplyPackaging,
  onRequestClinician,
  hemsFlyable,
  onSetTreatmentDestination,
  onSendAtmistPrealert,
  onConveyCasualtyVia,
}: {
  sim: IncidentSimState;
  deployments: Deployment[];
  resolved: ResolvedDeployment[];
  tasks: Task[];
  now: number;
  treatmentByCasualtyId?: Record<string, PatientTreatmentState>;
  onSetTreatingCasualty?: (applianceId: string, casualtyId: string | null) => void;
  onStartPatientSurvey?: (casualtyId: string) => void;
  onApplyAirway?: Props["onApplyAirway"];
  onApplyBreathing?: Props["onApplyBreathing"];
  onApplyCirculation?: Props["onApplyCirculation"];
  onAdministerDrug?: Props["onAdministerDrug"];
  onApplyPackaging?: Props["onApplyPackaging"];
  onRequestClinician?: (scope: "ap" | "ccc" | "basics" | "hems", casualtyId: string) => void;
  hemsFlyable?: boolean;
  onSetTreatmentDestination?: Props["onSetTreatmentDestination"];
  onSendAtmistPrealert?: (casualtyId: string) => void;
  onConveyCasualtyVia?: (applianceId: string, casualtyId: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Casualty id whose treatment pop-out is currently open. Null = closed.
  // Several patient windows can be open at once — one per casualty,
  // cascaded like a windowing system. Order = opening order.
  const [openTreatmentIds, setOpenTreatmentIds] = useState<string[]>([]);

  const casualties = sim.foundCasualties
    .map((c) => ({
      casualty: c,
      stage: sim.casualtyProgression?.[c.id]?.stage ?? "located",
      severity: sim.casualtyProgression?.[c.id]?.severity ?? c.severity,
    }))
    .filter((c) => c.stage !== "undiscovered");

  // On-scene medical units, ordered by clinical scope so the first chip
  // offered is the most capable clinician available.
  const onSceneMedical = resolved
    .filter(
      (r) =>
        r.appliance.service === "Ambulance" &&
        (r.phase === "at_incident" || r.phase === "at_hospital"),
    )
    .map((r) => ({
      appliance: r.appliance,
      deployment: r.deployment,
      scope: scopeOfAppliance(r.appliance),
    }))
    .sort((a, b) => SCOPE_RANK[b.scope] - SCOPE_RANK[a.scope]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 text-xs">
      {casualties.length === 0 ? (
        <p className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
          No casualties located yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {casualties.map(({ casualty, stage, severity }) => {
            const tx = treatmentByCasualtyId?.[casualty.id];
            const paired = deployments.filter(
              (d) => d.treatingCasualtyId === casualty.id,
            );
            const isExpanded = expandedId === casualty.id;
            return (
              <li
                key={casualty.id}
                className={
                  "rounded-sm border px-2 py-1.5 transition-colors " +
                  (stage === "expectant"
                    ? "border-(--color-critical)/60 bg-(--color-critical)/5"
                    : severity === "critical"
                      ? "border-(--color-critical)/40 bg-(--color-bg)/40"
                      : "border-(--color-border-subtle) bg-(--color-bg)/40")
                }
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : casualty.id)}
                  className="flex w-full items-start justify-between gap-2 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-(--color-text)">
                      {casualty.label ?? casualty.id}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-baseline gap-1.5 font-mono text-[9px] uppercase tracking-widest">
                      <span className={stageTone(stage)}>{stageLabel(stage)}</span>
                      <span className="text-(--color-text-dim)">·</span>
                      <span className={severityTone(severity)}>{severity}</span>
                      {tx?.revealedCondition && (
                        <>
                          <span className="text-(--color-text-dim)">·</span>
                          <span className="normal-case tracking-normal text-(--color-text-muted)">
                            {tx.revealedCondition}
                          </span>
                        </>
                      )}
                    </div>
                    {paired.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {paired.map((d) => {
                          const r = resolved.find((x) => x.appliance.id === d.applianceId);
                          const name = r?.appliance.callsign ?? d.applianceId;
                          return (
                            <span
                              key={d.applianceId}
                              className="rounded-sm border border-(--color-ok)/40 bg-(--color-ok)/10 px-1.5 py-0 font-mono text-[9px] uppercase tracking-widest text-(--color-ok)"
                            >
                              {name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-(--color-text-dim)">
                    {isExpanded ? "▾" : "▸"}
                  </span>
                </button>
                {isExpanded && onSetTreatingCasualty && (
                  <div className="mt-2 border-t border-(--color-border-subtle) pt-2">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-amber-dim)">
                      Assign medical crews
                    </div>
                    {onSceneMedical.length === 0 ? (
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                        No ambulance on scene yet.
                      </p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {onSceneMedical.map(({ appliance, deployment, scope }) => {
                          const alreadyOnThis = deployment.treatingCasualtyId === casualty.id;
                          const onOther =
                            deployment.treatingCasualtyId !== null &&
                            deployment.treatingCasualtyId !== undefined &&
                            deployment.treatingCasualtyId !== casualty.id;
                          return (
                            <li
                              key={appliance.id}
                              className="flex items-center justify-between gap-2 rounded-sm border border-(--color-border-subtle) bg-(--color-surface-raised) px-2 py-1"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-mono text-[11px] text-(--color-text)">
                                  {appliance.callsign}
                                </div>
                                <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                                  {scope.toUpperCase()}
                                  {onOther ? " · on other patient" : ""}
                                </div>
                              </div>
                              {alreadyOnThis ? (
                                <button
                                  type="button"
                                  onClick={() => onSetTreatingCasualty(appliance.id, null)}
                                  className="rounded-sm border border-(--color-critical)/50 bg-(--color-critical)/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-critical) hover:bg-(--color-critical)/20"
                                >
                                  Release
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSetTreatingCasualty(appliance.id, casualty.id)
                                  }
                                  className="rounded-sm border border-(--color-amber)/60 bg-(--color-amber)/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/20"
                                >
                                  Assign
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {/* Full patient workflow — survey, ABC, drugs,
                        packaging, destination + ATMIST, convey picker.
                        Lives here in the casualty card (not in any
                        ambulance's action menu). */}
                    <div className="mt-3 border-t border-(--color-border-subtle) pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenTreatmentIds((prev) =>
                            prev.includes(casualty.id) ? prev : [...prev, casualty.id],
                          )
                        }
                        className="flex w-full items-center justify-between rounded-sm border border-(--color-ok)/50 bg-(--color-ok)/10 px-3 py-2 text-left transition-colors hover:border-(--color-ok) hover:bg-(--color-ok)/15"
                      >
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-ok)">
                            {openTreatmentIds.includes(casualty.id)
                              ? "Treatment box open"
                              : "Open treatment box"}
                          </div>
                          <div className="mt-0.5 text-[11px] text-(--color-text-muted)">
                            Pop-out clinical workflow · body diagram, ABC,
                            drugs, packaging, ATMIST
                          </div>
                        </div>
                        <span className="font-mono text-[11px] text-(--color-ok)">↗</span>
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {openTreatmentIds.length > 0 &&
        typeof document !== "undefined" &&
        openTreatmentIds.map((openId, idx) => {
          const target = casualties.find((c) => c.casualty.id === openId);
          if (!target) return null;
          const c = target.casualty;
          const pairedForTarget = deployments.filter(
            (d) => d.treatingCasualtyId === c.id,
          );
          const paired = pairedForTarget
            .map((d) => {
              const r = resolved.find((x) => x.appliance.id === d.applianceId);
              return r ? { deployment: d, appliance: r.appliance } : null;
            })
            .filter((x): x is NonNullable<typeof x> => x !== null);
          // Portal to <body>: the casualties body can sit inside the MDT
          // tablet (a transformed react-rnd container), which would otherwise
          // trap and clip this draggable panel.
          return createPortal(
            <DraggableTreatmentPanel
              key={openId}
              index={idx}
              escToClose={idx === openTreatmentIds.length - 1}
              casualty={c}
              treatment={treatmentByCasualtyId?.[c.id] ?? null}
              pairedDeployments={paired}
              extractionRequired={isExtractionRequired(c, tasks)}
              now={now}
              onStartSurvey={(id) => onStartPatientSurvey?.(id)}
              onApplyAirway={(id, a, by) => onApplyAirway?.(id, a, by)}
              onApplyBreathing={(id, a, by) => onApplyBreathing?.(id, a, by)}
              onApplyCirculation={(id, a, by) =>
                onApplyCirculation?.(id, a, by)
              }
              onAdministerDrug={(id, d, by) => onAdministerDrug?.(id, d, by)}
              onApplyPackaging={(id, a, by) => onApplyPackaging?.(id, a, by)}
              onRequestClinician={(s, id) => onRequestClinician?.(s, id)}
              hemsFlyable={hemsFlyable}
              onSetDestination={(id, type, name) =>
                onSetTreatmentDestination?.(id, type, name)
              }
              onSendAtmist={(id) => onSendAtmistPrealert?.(id)}
              onConveyVia={(applianceId, casualtyId) =>
                onConveyCasualtyVia?.(applianceId, casualtyId)
              }
              onClose={() =>
                setOpenTreatmentIds((prev) => prev.filter((x) => x !== openId))
              }
            />,
            document.body,
            `treatment-${openId}`,
          );
        })}
    </div>
  );
}

/**
 * True while this casualty is still inside a fire/BA hazard zone and
 * hasn't been carried out yet. We consider extraction "required" when
 * `discoverAfterMinBa > 0` (authored on the casualty to mean "found
 * during BA search"). Once any extract_casualty task for this id is
 * completed, extraction is done and paramedics can treat them. Scenarios
 * where casualties are outside (RTC, open ground) have
 * discoverAfterMinBa = 0 and never require extraction.
 */
function isExtractionRequired(
  casualty: { id: string; discoverAfterMinBa?: number },
  tasks: Task[],
): boolean {
  if ((casualty.discoverAfterMinBa ?? 0) <= 0) return false;
  const extracted = tasks.some(
    (t) =>
      t.kind === "extract_casualty" &&
      t.state === "completed" &&
      t.casualtyId === casualty.id,
  );
  return !extracted;
}

const SCOPE_RANK: Record<"dca" | "ap" | "ccc" | "basics" | "hems", number> = {
  dca: 1,
  ap: 2,
  ccc: 3,
  basics: 4,
  hems: 5,
};

function scopeOfAppliance(a: Appliance): "dca" | "ap" | "ccc" | "basics" | "hems" {
  const id = a.id.toLowerCase();
  if (id.includes("hems") || id.includes("helimed")) return "hems";
  if (id.includes("basics") || id.includes("dr")) return "basics";
  if (id.includes("ccc")) return "ccc";
  if (id.startsWith("qr-") || id.includes("-qr")) return "ap";
  return "dca";
}

function stageLabel(stage: string): string {
  switch (stage) {
    case "located": return "Located";
    case "in_treatment": return "In treatment";
    case "conveying": return "Conveying";
    case "at_hospital": return "At hospital";
    case "expectant": return "Expectant";
    case "undiscovered": return "Undiscovered";
    default: return stage;
  }
}

function stageTone(stage: string): string {
  switch (stage) {
    case "expectant": return "text-(--color-critical)";
    case "located": return "text-(--color-amber)";
    case "in_treatment": return "text-(--color-amber)";
    case "conveying": return "text-(--color-info)";
    case "at_hospital": return "text-(--color-ok)";
    default: return "text-(--color-text-dim)";
  }
}

function severityTone(severity: string): string {
  switch (severity) {
    case "critical": return "text-(--color-critical)";
    case "expectant": return "text-(--color-critical)";
    case "serious": return "text-(--color-amber)";
    default: return "text-(--color-ok)";
  }
}

export function CallInformationBody({
  incident,
  informantLog,
  informantOnCall,
}: {
  incident: Incident;
  informantLog?: InformantMessage[];
  informantOnCall?: boolean;
}) {
  const sc = incident.scenario;
  const typeLabel = formatIncidentType(sc.type);
  const severityTone = severityToneOf(sc.severity);
  const personsReported = /persons reported/i.test(sc.title + " " + sc.type);
  const visibleLog = (informantLog ?? []).filter((m) => m.text.length > 0);
  const [callElapsed, setCallElapsed] = useState(0);
  useEffect(() => {
    if (!informantOnCall) return;
    const id = setInterval(() => {
      setCallElapsed(Math.max(0, Math.floor((Date.now() - incident.receivedAt) / 1000)));
    }, 1000);
    setCallElapsed(Math.max(0, Math.floor((Date.now() - incident.receivedAt) / 1000)));
    return () => clearInterval(id);
  }, [informantOnCall, incident.receivedAt]);

  // Combined risk lines — hazards (critical), vulnerabilities (amber),
  // PRI intel (neutral). Rendering them in one ordered list keeps the
  // operator's eye on a single "what I need to know" list instead of
  // three separate boxes.
  const riskItems: { text: string; tone: "critical" | "amber" | "neutral" }[] = [
    ...sc.property.knownHazards.map((h) => ({ text: h, tone: "critical" as const })),
    ...sc.property.vulnerabilities.map((v) => ({ text: v, tone: "amber" as const })),
    ...sc.pri.items.map((i) => ({ text: i, tone: "neutral" as const })),
  ];

  // Property reference rows, skipping anything the scenario left blank.
  const propertyRows: [string, string][] = [
    ["Class", sc.property.class] as [string, string],
    ...(sc.property.size ? [["Size", sc.property.size] as [string, string]] : []),
    ...(sc.property.materials
      ? [["Materials", sc.property.materials] as [string, string]]
      : []),
    ["Occupants", sc.property.occupants] as [string, string],
    ["Access", sc.property.access] as [string, string],
  ];

  // Keep the capped caller log pinned to the newest message.
  const callLogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = callLogRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleLog.length]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-3 px-4 py-3 text-xs">
        {/* Summary — the address IS the headline; everything else hangs
            off it in one quiet chip row. */}
        <section className="space-y-1.5">
          <div className="text-base font-semibold leading-snug tracking-tight text-(--color-text)">
            {sc.location.address}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={
                "rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest " +
                severityTone
              }
            >
              {severityLabelOf(sc.severity)}
            </span>
            {personsReported && (
              <span className="rounded-sm border border-(--color-critical)/60 bg-(--color-critical)/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-critical)">
                Persons reported
              </span>
            )}
            <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-muted)">
              {typeLabel}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
              · {sc.location.postcode}
            </span>
          </div>
        </section>

        {/* Caller log — live 999 call feed + originating quote. */}
        <section>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <SectionTitle>Caller log</SectionTitle>
            {informantOnCall !== undefined && (
              <span
                className={
                  "font-mono text-[9px] uppercase tracking-widest " +
                  (informantOnCall
                    ? "text-(--color-critical)"
                    : "text-(--color-text-dim)")
                }
              >
                <span
                  className={
                    "mr-1 inline-block size-1.5 rounded-full align-middle " +
                    (informantOnCall
                      ? "dot-live bg-(--color-critical)"
                      : "bg-(--color-text-dim)")
                  }
                />
                {informantOnCall
                  ? `On the line · ${fmtCallClock(callElapsed)}`
                  : "Line cleared"}
              </span>
            )}
          </div>
          <div className="overflow-hidden rounded-sm border border-(--color-border-subtle)">
            <div className="bg-(--color-bg)/40 px-3 py-2">
              <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                {fmtTime(incident.receivedAt)} · Call answered
              </div>
              <blockquote className="mt-1 text-sm italic leading-snug text-(--color-text)">
                &ldquo;{sc.trigger}&rdquo;
              </blockquote>
            </div>
            {visibleLog.length > 0 && (
              <div
                ref={callLogRef}
                className="max-h-40 overflow-y-auto bg-(--color-bg)/20"
              >
                <ul className="divide-y divide-(--color-border-subtle)/60">
                  {visibleLog.map((m) => {
                    const tone =
                      m.tone === "critical"
                        ? "text-(--color-critical)"
                        : m.tone === "urgent"
                          ? "text-(--color-amber)"
                          : "text-(--color-text)";
                    return (
                      <li key={m.id} className="flex gap-2 px-3 py-1.5 leading-snug">
                        <span className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                          {fmtTime(m.firedAt)}
                        </span>
                        <span className={`text-[12px] ${tone}`}>{m.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {visibleLog.length === 0 && informantOnCall && (
              <div className="border-t border-(--color-border-subtle) bg-(--color-bg)/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                Awaiting further detail from caller…
              </div>
            )}
            {!informantOnCall && visibleLog.length === 0 && (
              <div className="border-t border-(--color-border-subtle) bg-(--color-surface-raised) px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                Caller cleared — first crew on scene
              </div>
            )}
          </div>
        </section>

        {/* Property — collapsed by default; the address card above already
            carries the essentials, so this is reference detail. */}
        <CollapsibleSection
          title="Property"
          count={propertyRows.length}
          defaultOpen={false}
        >
          <dl className="rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/40 px-3 py-1.5">
            {propertyRows.map(([label, value]) => (
              <CallRow key={label} label={label} value={value} />
            ))}
          </dl>
        </CollapsibleSection>

        {/* Risks & intel — open by default; safety-critical. */}
        <CollapsibleSection
          title="Risks & intel"
          count={riskItems.length}
          defaultOpen
          badge={
            sc.pri.hasFormalPri ? (
              <span className="rounded-sm border border-(--color-amber)/40 bg-(--color-amber)/10 px-1 py-0 font-mono text-[9px] uppercase tracking-widest text-(--color-amber)">
                PRI on file
              </span>
            ) : undefined
          }
        >
          <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/40 px-3 py-2">
            {riskItems.length === 0 ? (
              <p className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                Nothing of note recorded.
              </p>
            ) : (
              <ul className="space-y-1 leading-snug">
                {riskItems.map((item, i) => {
                  const tone =
                    item.tone === "critical"
                      ? "text-(--color-critical)"
                      : item.tone === "amber"
                        ? "text-(--color-amber)"
                        : "text-(--color-text-muted)";
                  const glyphColour =
                    item.tone === "critical"
                      ? "text-(--color-critical)"
                      : item.tone === "amber"
                        ? "text-(--color-amber)"
                        : "text-(--color-text-dim)";
                  return (
                    <li
                      key={`${item.tone}-${i}`}
                      className="flex gap-2 text-[12px]"
                    >
                      <span className={`shrink-0 ${glyphColour}`} aria-hidden>
                        ■
                      </span>
                      <span className={tone}>{item.text}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

/** Chevron header that shows/hides its body. Keeps the Call tab short —
 *  reference material stays one click away instead of always expanded. */
function CollapsibleSection({
  title,
  count,
  badge,
  defaultOpen,
  children,
}: {
  title: string;
  count?: number;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-1 flex w-full items-center gap-2 text-left"
        aria-expanded={open}
      >
        <span className="font-mono text-[9px] text-(--color-text-dim)">
          {open ? "▾" : "▸"}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
          {title}
        </span>
        {typeof count === "number" && (
          <span className="font-mono text-[9px] text-(--color-text-dim)/70">
            ({count})
          </span>
        )}
        {badge}
      </button>
      {open && children}
    </section>
  );
}

function fmtCallClock(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function SectionTitle({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "critical" | "amber";
}) {
  const colour =
    tone === "critical"
      ? "text-(--color-critical)"
      : tone === "amber"
        ? "text-(--color-amber)"
        : "text-(--color-text-dim)";
  return (
    <h3 className={`mb-1 font-mono text-[9px] uppercase tracking-widest ${colour}`}>
      {children}
    </h3>
  );
}

function CallRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-baseline gap-3 border-b border-(--color-border-subtle)/50 py-1 last:border-b-0">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
        {label}
      </dt>
      <dd className="text-xs leading-snug text-(--color-text)">{value}</dd>
    </div>
  );
}

function formatIncidentType(code: string): string {
  return code
    .replace(/_/g, " ")
    .replace(/\brtc\b/gi, "RTC")
    .replace(/\busar\b/gi, "USAR")
    .replace(/\bhazmat\b/gi, "HAZMAT")
    .replace(/\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .replace(/\b(Rtc|Usar|Hazmat)\b/g, (w) => w.toUpperCase());
}

function severityToneOf(sev: "low" | "moderate" | "high" | "major"): string {
  switch (sev) {
    case "low":
      return "border-(--color-ok)/50 bg-(--color-ok)/10 text-(--color-ok)";
    case "moderate":
      return "border-(--color-amber)/50 bg-(--color-amber)/10 text-(--color-amber)";
    case "high":
      return "border-(--color-critical)/50 bg-(--color-critical)/10 text-(--color-critical)";
    case "major":
      return "border-(--color-critical) bg-(--color-critical)/20 text-(--color-critical)";
  }
}

function severityLabelOf(sev: "low" | "moderate" | "high" | "major"): string {
  switch (sev) {
    case "low":
      return "Low severity";
    case "moderate":
      return "Moderate severity";
    case "high":
      return "High severity";
    case "major":
      return "Major incident";
  }
}

function CallInformation({
  incident,
  collapsed,
  onToggleCollapse,
}: {
  incident: Incident;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  if (collapsed) {
    return <CollapsedRail title="Call Information" side="left" onExpand={onToggleCollapse} />;
  }
  const sc = incident.scenario;
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden bg-(--color-surface)/30">
      <PanelHeaderWithToggle title="Call Information" collapsed={false} onToggle={onToggleCollapse} />
      <div className="flex-1 overflow-y-auto px-4 py-3 text-xs">
        <PanelSub label="999 caller" tone="muted">
          <p className="text-(--color-text)">“{sc.trigger}”</p>
        </PanelSub>

        <PanelSub label="Address" tone="muted">
          <p className="text-(--color-text)">{sc.location.address}</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
            {sc.location.postcode}
          </p>
        </PanelSub>

        <PanelSub label="Severity" tone="amber">
          <span className="rounded-sm border border-(--color-critical)/50 bg-(--color-critical)/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-critical)">
            {sc.severity}
          </span>
        </PanelSub>

        <Field label="Type" value={sc.type.replace(/_/g, " ")} />
        <Field label="Property" value={sc.property.class} />
        {sc.property.size && <Field label="Size" value={sc.property.size} />}
        {sc.property.materials && <Field label="Materials" value={sc.property.materials} />}
        <Field label="Occupants" value={sc.property.occupants} />
        <Field label="Access" value={sc.property.access} />
        <Field label="First-due" value={sc.property.firstDueStationId} />

        <PanelSub label="Known hazards" tone="critical">
          {sc.property.knownHazards.length === 0 ? (
            <p className="text-(--color-text-dim)">None recorded.</p>
          ) : (
            <ul className="space-y-0.5">
              {sc.property.knownHazards.map((h) => (
                <li key={h} className="text-(--color-critical)">— {h}</li>
              ))}
            </ul>
          )}
        </PanelSub>

        <PanelSub label="Vulnerable persons" tone="amber">
          {sc.property.vulnerabilities.length === 0 ? (
            <p className="text-(--color-text-dim)">None recorded.</p>
          ) : (
            <ul className="space-y-0.5">
              {sc.property.vulnerabilities.map((v) => (
                <li key={v} className="text-(--color-amber)">— {v}</li>
              ))}
            </ul>
          )}
        </PanelSub>

        {sc.severity === "major" && (
          <PanelSub label="METHANE · Major incident" tone="critical">
            <ul className="space-y-1 font-mono text-[10px] uppercase tracking-widest text-(--color-text-muted)">
              <li><span className="text-(--color-amber)">M</span> {sc.methane.M}</li>
              <li><span className="text-(--color-amber)">E</span> {sc.methane.E}</li>
              <li><span className="text-(--color-amber)">T</span> {sc.methane.T}</li>
              <li><span className="text-(--color-amber)">H</span> {sc.methane.H}</li>
              <li><span className="text-(--color-amber)">A</span> {sc.methane.A}</li>
              <li><span className="text-(--color-amber)">N</span> {sc.methane.N}</li>
              <li><span className="text-(--color-amber)">E</span> {sc.methane.emergencyServices}</li>
            </ul>
          </PanelSub>
        )}

        {sc.pri.items.length > 0 && (
          <PanelSub label={sc.pri.hasFormalPri ? "PRI · on file" : "PRI · informal"} tone="muted">
            <ul className="space-y-1">
              {sc.pri.items.map((it) => (
                <li key={it} className="text-(--color-text-muted)">— {it}</li>
              ))}
            </ul>
          </PanelSub>
        )}

        <PanelSub label="Targets" tone="muted">
          <ul className="space-y-1">
            {sc.evaluation.targets.map((t) => (
              <li key={t.metric} className="text-(--color-text-muted)">
                <span className="text-(--color-text)">{t.metric}</span> — {t.target}
              </li>
            ))}
          </ul>
          <p className="mt-2 italic text-(--color-text-dim)">{sc.evaluation.lesson}</p>
        </PanelSub>
      </div>
    </aside>
  );
}
export function ActiveTaskRow({
  task,
  now,
  crewAir,
}: {
  task: Task;
  now: number;
  crewAir: Record<string, number>;
}) {
  const elapsed = (now - task.startedAt) / 1000;
  const pct = task.durationSec
    ? Math.min(100, (elapsed / task.durationSec) * 100)
    : null;
  const lowestAir =
    task.baCrewIds && task.baCrewIds.length > 0
      ? Math.min(...task.baCrewIds.map((c) => crewAir[c] ?? 100))
      : null;
  return (
    <li className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface-raised) px-2 py-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text)">
          {task.applianceId.replace("-", " ")}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
          {task.crsLabel ?? taskLabelShort(task.kind)}
        </span>
      </div>
      {pct !== null && (
        <div className="mt-1 h-1 w-full overflow-hidden rounded-sm bg-(--color-bg)">
          <div
            className="h-full bg-(--color-amber) transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {lowestAir !== null && (
        <div className="mt-1 flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
            BA air
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-sm bg-(--color-bg)">
            <div
              className={
                "h-full transition-all duration-500 " +
                (lowestAir < 30
                  ? "bg-(--color-critical)"
                  : lowestAir < 50
                    ? "bg-(--color-amber)"
                    : "bg-(--color-ok)")
              }
              style={{ width: `${lowestAir}%` }}
            />
          </div>
          <span
            className={
              "font-mono text-[9px] tabular-nums " +
              (lowestAir < 30
                ? "text-(--color-critical)"
                : lowestAir < 50
                  ? "text-(--color-amber)"
                  : "text-(--color-ok)")
            }
          >
            {Math.round(lowestAir)}%
          </span>
        </div>
      )}
    </li>
  );
}

function MethaneLine({
  letter,
  label,
  value,
}: {
  letter: string;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[1.2rem_6rem_1fr] items-baseline gap-2 py-0.5">
      <span className="font-mono font-bold text-(--color-amber)">{letter}</span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
        {label}
      </span>
      <span className="text-(--color-text)">{value}</span>
    </div>
  );
}

export function CrewLine({
  r,
  now,
  isCommander,
  onSetPreCommitBaCrew,
  onSelectAppliance,
}: {
  r: ResolvedDeployment;
  now: number;
  isCommander: boolean;
  onSetPreCommitBaCrew: Props["onSetPreCommitBaCrew"];
  onSelectAppliance: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const colour =
    r.appliance.service === "Fire"
      ? "text-(--color-critical)"
      : r.appliance.service === "Ambulance"
        ? "text-(--color-ok)"
        : "text-(--color-info)";
  const caps = CAPABILITIES_BY_TYPE[r.appliance.type] ?? [];
  const isBaCapable = caps.includes("BA");
  const hemsFlight = r.deployment.hemsFlight;
  const phaseLabel =
    r.phase === "mobile"
      ? hemsFlight && !r.deployment.parkingPos
        ? now >= hemsFlight.overheadAt
          ? "Overhead — LZ required"
          : `Airborne · overhead ${fmtMs(hemsFlight.overheadAt - now)}`
        : hemsFlight
          ? `Landing · crew on foot · ${fmtMs(r.deployment.arrivesAt - now)}`
          : `Mobile · ETA ${fmtMs(r.deployment.arrivesAt - now)}`
      : r.phase === "at_incident"
        ? `On scene · ${fmtMs(now - r.deployment.arrivesAt)}`
        : r.phase === "at_hospital"
          ? "At hospital"
          : r.phase === "returning"
            ? "Returning"
            : "At station";
  const preCommit = r.deployment.preCommitBaCrewIds ?? [];
  // Click behaviour:
  // - On-scene rows → select for the bottom action menu.
  // - En-route BA-capable rows → inline expand for pre-commit picker.
  const onScene = r.phase === "at_incident";
  const canPreCommit = r.phase === "mobile" && isBaCapable;

  function handleClick() {
    if (onScene) {
      onSelectAppliance(r.appliance.id);
    } else if (canPreCommit) {
      setOpen((v) => !v);
    }
  }

  return (
    <li className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface-raised)">
      <button
        type="button"
        onClick={handleClick}
        disabled={!onScene && !canPreCommit}
        className="flex w-full items-center justify-between gap-1 px-2 py-1.5 text-left transition-colors hover:bg-(--color-bg)/40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <div className="flex flex-col">
          <span className={`font-mono text-sm font-semibold ${colour}`}>{r.appliance.callsign}</span>
          <span className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-muted)">
            {phaseLabel}
            {preCommit.length > 0 && (
              <span className="ml-1 text-(--color-amber)">· BA pre-set {preCommit.length}</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isCommander && (
            <span className="rounded-sm border border-(--color-amber) bg-(--color-amber)/10 px-1 py-0 font-mono text-[9px] uppercase tracking-widest text-(--color-amber)">
              IC
            </span>
          )}
          {canPreCommit && (
            <span className="font-mono text-[10px] text-(--color-text-dim)">{open ? "▾" : "▸"}</span>
          )}
          {onScene && (
            <span className="font-mono text-[10px] text-(--color-text-dim)">→</span>
          )}
        </div>
      </button>
      {open && canPreCommit && (
        <div className="border-t border-(--color-border-subtle) bg-(--color-bg)/40 px-2 py-2">
          <PreCommitBaPanel
            appliance={r.appliance}
            preCommit={preCommit}
            onSet={(ids) => onSetPreCommitBaCrew(r.appliance.id, ids)}
          />
        </div>
      )}
    </li>
  );
}

function PreCommitBaPanel({
  appliance,
  preCommit,
  onSet,
}: {
  appliance: Appliance;
  preCommit: string[];
  onSet: (ids: string[]) => void;
}) {
  const baEligible = appliance.crewMembers.filter((c) => /Firefighter|HART/.test(c.role));
  function toggle(id: string) {
    onSet(preCommit.includes(id) ? preCommit.filter((x) => x !== id) : [...preCommit, id]);
  }
  return (
    <div className="text-xs">
      <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber-dim)">
        Pre-commit BA team
      </div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
        Selected wearers rig en route and stage on arrival — commit them from the action menu
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {baEligible.map((m) => {
          const picked = preCommit.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              className={
                "rounded-sm border px-1.5 py-1 text-left font-mono text-[10px] " +
                (picked
                  ? "border-(--color-amber) bg-(--color-amber)/15 text-(--color-amber)"
                  : "border-(--color-border) text-(--color-text) hover:border-(--color-amber-dim)")
              }
            >
              <div className="truncate">{m.name}</div>
              <div className="font-mono text-[8px] uppercase tracking-widest text-(--color-text-dim)">
                {m.role}
              </div>
            </button>
          );
        })}
        {baEligible.length === 0 && (
          <div className="col-span-2 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
            No BA-qualified riders on this appliance.
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SITREP
// ---------------------------------------------------------------------------

function BottomDeploymentBar({
  incident,
  stations,
  etas,
  deployments,
  patch,
  onDeploy,
  onStandDownForWelfare,
  onStandDown,
}: {
  incident: Incident;
  stations: StationWithAppliances[];
  etas: Record<string, Eta>;
  deployments: Deployment[];
  patch?: AreaCode | null;
  onDeploy: (args: DeployArgs) => void;
  onStandDownForWelfare: (applianceId: string) => void;
  onStandDown: (applianceId: string) => void;
}) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden bg-(--color-surface)/40">
      <header className="border-b border-(--color-border-subtle) bg-(--color-surface-raised) px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
        Mobilise more resources
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <DeploymentBoard
          incident={incident}
          stations={stations}
          etas={etas}
          deployments={deployments}
          patch={patch}
          onDeploy={onDeploy}
          onStandDownForWelfare={onStandDownForWelfare}
          onStandDown={onStandDown}
        />
      </div>
    </section>
  );
}

/**
 * Bottom feed pane — toggleable between SITREP (event-log view) and
 * Radio (Airwave-style transcript synthesised from the same log). One
 * collapse chevron in the header collapses the whole pane.
 */
function BottomFeedPane({
  log,
  collapsed,
  onToggleCollapse,
}: {
  log: LogEntry[];
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const [mode, setMode] = useState<"sitrep" | "radio">("sitrep");
  if (collapsed) {
    // Delegate to the SitrepFeed's own collapsed bar.
    return <SitrepFeed log={log} collapsed onToggleCollapse={onToggleCollapse} />;
  }
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-stretch border-b border-(--color-border-subtle) bg-(--color-surface-raised)">
        <button
          type="button"
          onClick={() => setMode("sitrep")}
          className={
            "border-r border-(--color-border-subtle) px-4 py-1 font-mono text-[10px] uppercase tracking-widest " +
            (mode === "sitrep"
              ? "bg-(--color-bg) text-(--color-amber)"
              : "text-(--color-text-dim) hover:bg-(--color-bg)/50 hover:text-(--color-text)")
          }
        >
          SITREP Feed
        </button>
        <button
          type="button"
          onClick={() => setMode("radio")}
          className={
            "border-r border-(--color-border-subtle) px-4 py-1 font-mono text-[10px] uppercase tracking-widest " +
            (mode === "radio"
              ? "bg-(--color-bg) text-(--color-amber)"
              : "text-(--color-text-dim) hover:bg-(--color-bg)/50 hover:text-(--color-text)")
          }
        >
          Radio Comms
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onToggleCollapse}
          className="border-l border-(--color-border-subtle) px-3 font-mono text-[11px] text-(--color-text-dim) hover:bg-(--color-bg) hover:text-(--color-amber)"
          title="Minimise"
        >
          —
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {mode === "sitrep" ? (
          <SitrepFeed log={log} collapsed={false} onToggleCollapse={onToggleCollapse} hideHeader />
        ) : (
          <RadioFeed log={log} />
        )}
      </div>
    </div>
  );
}

function SitrepFeed({
  log,
  collapsed,
  onToggleCollapse,
  hideHeader,
}: {
  log: LogEntry[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  hideHeader?: boolean;
}) {
  const [filter, setFilter] = useState<SitrepFilter>("all");
  const kinds = FILTER_KINDS[filter];
  const filtered = kinds ? log.filter((e) => kinds.includes(e.kind)) : log;
  const latest = filtered.slice(-60).reverse();

  if (collapsed) {
    return (
      <footer className="flex items-center justify-between bg-(--color-surface-raised) px-4">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
          <span className="dot-live size-1.5 rounded-full bg-(--color-amber)" />
          <span>SITREP feed</span>
          <span className="text-(--color-text-dim)">· {filtered.length} events</span>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded-sm border border-(--color-border) px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:border-(--color-amber) hover:text-(--color-amber)"
          title="Expand SITREP"
          aria-label="Expand SITREP"
        >
          ▲
        </button>
      </footer>
    );
  }

  return (
    <footer className="flex h-full min-h-0 flex-col overflow-hidden border-l border-(--color-border-subtle) bg-(--color-surface)/40">
      <div className="flex flex-col gap-1 border-b border-(--color-border-subtle) px-3 py-1.5">
        {!hideHeader && (
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
              SITREP feed
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                {filtered.length}
              </span>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="rounded-sm border border-(--color-border) px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:border-(--color-amber) hover:text-(--color-amber)"
                title="Minimise SITREP"
                aria-label="Minimise SITREP"
              >
                ▼
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {SITREP_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={
                "rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest " +
                (f.key === filter
                  ? "border-(--color-amber) bg-(--color-amber)/10 text-(--color-amber)"
                  : "border-(--color-border) text-(--color-text-dim) hover:border-(--color-amber-dim) hover:text-(--color-amber)")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <ol className="flex-1 overflow-y-auto px-4 py-1.5 font-mono text-[11px]">
        {latest.length === 0 ? (
          <li className="text-(--color-text-dim)">No events in this filter.</li>
        ) : (
          latest.map((e, idx) => (
            <li
              key={e.id}
              className={
                "flex gap-3 py-0.5 " +
                (idx === 0 ? "text-(--color-amber)" : kindColour(e.kind))
              }
            >
              <span className="shrink-0 tabular-nums text-(--color-text-dim)">
                {fmtTime(e.timestamp)}
              </span>
              <span>{e.message}</span>
            </li>
          ))
        )}
      </ol>
    </footer>
  );
}

function kindColour(k: LogEntry["kind"]): string {
  switch (k) {
    case "casualty_found":
    case "hazard_confirmed":
    case "make_pumps":
      return "text-(--color-critical)";
    case "in_attendance":
    case "back_at_station":
    case "offload_complete":
    case "refuel_complete":
    case "task_completed":
      return "text-(--color-ok)";
    case "tactical_mode":
    case "sector_assigned":
    case "annotation":
    case "commander_assigned":
    case "hydrant_connected":
    case "task_started":
      return "text-(--color-info)";
    case "ba_committed":
    case "ba_withdrawn":
      return "text-(--color-amber)";
    case "welfare_break":
    case "welfare_complete":
    case "defect":
      return "text-(--color-text-dim)";
    default:
      return "text-(--color-text)";
  }
}

// ---------------------------------------------------------------------------
// Scene overlay
// ---------------------------------------------------------------------------

function SceneOverlay({
  enRouteAwaitingParking,
}: {
  enRouteAwaitingParking: number;
}) {
  if (enRouteAwaitingParking === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[400]">
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-sm border border-(--color-amber) bg-(--color-amber)/15 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
        Click on the map to park {enRouteAwaitingParking} en-route appliance{enRouteAwaitingParking > 1 ? "s" : ""}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Primitives & helpers
// ---------------------------------------------------------------------------

function PanelHeader({ title }: { title: string }) {
  return (
    <header className="border-b border-(--color-border-subtle) px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
      {title}
    </header>
  );
}

function PanelHeaderWithToggle({
  title,
  collapsed,
  onToggle,
}: {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-(--color-border-subtle) px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
      <span className="truncate">{title}</span>
      <button
        type="button"
        onClick={onToggle}
        className="rounded-sm border border-(--color-border) px-1.5 py-0.5 text-(--color-text-dim) hover:border-(--color-amber) hover:text-(--color-amber)"
        title={collapsed ? "Expand" : "Minimise"}
        aria-label={collapsed ? "Expand" : "Minimise"}
      >
        {collapsed ? "→" : "—"}
      </button>
    </header>
  );
}

function CollapsedRail({
  title,
  side,
  onExpand,
}: {
  title: string;
  side: "left" | "right";
  onExpand: () => void;
}) {
  // Thin vertical rail showing only the title sideways + an expand arrow.
  // Clicking anywhere expands the panel.
  return (
    <aside
      className={
        "flex flex-col items-center justify-between bg-(--color-surface)/40 " +
        (side === "left"
          ? "border-r border-(--color-border-subtle)"
          : "border-l border-(--color-border-subtle)")
      }
    >
      <button
        type="button"
        onClick={onExpand}
        className="mt-2 rounded-sm border border-(--color-border) px-1.5 py-0.5 font-mono text-[12px] text-(--color-text-dim) hover:border-(--color-amber) hover:text-(--color-amber)"
        title={`Expand ${title}`}
        aria-label={`Expand ${title}`}
      >
        {side === "left" ? "→" : "←"}
      </button>
      <span
        className="my-3 flex-1 select-none whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-(--color-amber)"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        {title}
      </span>
      <span className="mb-2 size-1.5 rounded-full bg-(--color-amber) opacity-60" />
    </aside>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
        {label}
      </div>
      <div className="mt-0.5 text-(--color-text)">{value}</div>
    </div>
  );
}

function PanelSub({
  label,
  children,
  tone,
}: {
  label: string;
  children: React.ReactNode;
  tone: "amber" | "critical" | "muted";
}) {
  const colour =
    tone === "amber"
      ? "text-(--color-amber-dim)"
      : tone === "critical"
        ? "text-(--color-critical)"
        : "text-(--color-text-dim)";
  return (
    <div className="mt-4">
      <div className={`font-mono text-[10px] uppercase tracking-widest ${colour}`}>
        {label}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function phaseOf(d: Deployment, now: number): ResolvedDeployment["phase"] {
  if (d.returnArrivesAt && now >= d.returnArrivesAt) return "home";
  if (d.returnStartedAt && now >= d.returnStartedAt) return "returning";
  if (d.offloadEndsAt && d.hospitalArrivesAt && now >= d.hospitalArrivesAt && now < d.offloadEndsAt) {
    return "at_hospital";
  }
  if (d.hospitalLegStartedAt && d.hospitalArrivesAt && now < d.hospitalArrivesAt) {
    return "mobile";
  }
  if (now >= d.arrivesAt) return "at_incident";
  return "mobile";
}

function taskLabelShort(kind: TaskKind): string {
  switch (kind) {
    case "survey": return "360 Survey";
    case "gain_entry": return "Gain Entry";
    case "connect_hydrant": return "Hydrant";
    case "relay_hose": return "Relay Hose";
    case "hose_attack": return "Hose Attack";
    case "ba_sar": return "BA SAR";
    case "commander": return "Commander";
    case "kit_grab": return "Kit Grab";
    case "mitigate_hazard": return "Hazard Mit.";
    case "deploy_stabilisers": return "Stabilisers";
    case "extend_platform": return "Platform up";
    case "aerial_rescue": return "Aerial rescue";
    case "aerial_monitor": return "Aerial monitor";
    case "rtc_extrication": return "RTC Extrication";
    case "rope_rescue": return "Rope Rescue";
    case "water_rescue": return "Water Rescue";
    case "wildfire_beating": return "Wildfire Beating";
    case "wildfire_knapsack": return "Knapsack";
    case "firebreak": return "Firebreak";
    case "cordon": return "Cordon";
    case "close_carriageway": return "C'way Closure";
    case "close_road": return "Road Closure";
    case "traffic_mgmt": return "Traffic Mgmt";
    case "scene_preservation": return "Scene Preserve";
    case "triage_sieve": return "Triage";
    case "extract_casualty": return "Extract";
    case "crs_action": return "CRS Action";
  }
}

function fmtHms(s: number): string {
  const total = Math.max(0, Math.floor(s));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function fmtMs(ms: number): string {
  const s = Math.max(0, ms / 1000);
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}
