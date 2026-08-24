"use client";

// Vehicle action menu shown as an overlay on the right third of the ground
// map when the operator selects an appliance. Vertical tab rail on the left
// switches between four pages:
//
//   Vehicle  — emergency-light state, on-scene info
//   Crew     — per-rider equipment loadout
//   Water    — tank gauge, pump start/stop, hydrant + relay + fast-attack
//   Actions  — task assignment, filtered by what crew has equipped

import { useEffect, useState } from "react";
import type { Appliance, CrewMember } from "@/lib/sim/types";
import {
  ATTACK_EFFECTIVENESS,
  CAPABILITIES_BY_TYPE,
  DOOR_TYPE_LABEL,
  ENTRY_TABLE,
  ENTRY_TOOL_LABEL,
  FIRE_MATERIAL_LABEL,
  FIRE_MATERIAL_TACTIC,
  TASK_MIN_CREW,
  doorTypeForScenario,
  hasWaterSupplyChain,
  type CrewEquipment,
  type EntryTool,
  type Deployment,
  type HoseAttackMode,
  type HoseType,
  type Incident,
  type KitKind,
  type LightState,
  type Task,
  type TaskKind,
} from "@/lib/sim/incident_types";
import type { IncidentSimState } from "@/lib/sim/incident_sim";
import { mitigationOptionsFor } from "@/lib/sim/mitigation";
import { BaControlBoard } from "./ba-control-board";
import type {
  AirwayAction as TxAirwayAction,
  BreathingAction as TxBreathingAction,
  CirculationAction as TxCirculationAction,
  DrugName as TxDrugName,
  PackagingAction as TxPackagingAction,
  PatientTreatmentState,
} from "@/lib/sim/incident_types";
import type { HospitalDestinationType } from "@/lib/sim/scene";

type Pending = {
  kind: TaskKind;
  label: string;
  hydrantId?: string;
  sourceApplianceId?: string;
  hoseType?: HoseType;
  kitKind?: KitKind;
  hazardId?: string;
  mitigationMethod?: string;
  attackMode?: HoseAttackMode;
  /** For ba_sar: tells the sim whether this BA team is inside to search
   *  for casualties or to firefight. Affects what red-flag credit the
   *  run earns and what tasks the committed crew can do next. */
  baMode?: "search" | "firefighting";
  /** For extract_casualty: id of the casualty being moved from fire
   *  zone to safe ground / treatment area. */
  casualtyId?: string;
  /** For gain_entry: the forcible-entry tool being used. */
  entryTool?: EntryTool;
  /** Equipment the crew need carrying to be selectable for this task. */
  requiredEquipment?: CrewEquipment[];
};

export type StartTaskFn = (args: {
  applianceId: string;
  kind: TaskKind;
  assignedCrewIds: string[];
  hydrantId?: string;
  sourceApplianceId?: string;
  hoseType?: HoseType;
  kitKind?: KitKind;
  hazardId?: string;
  mitigationMethod?: string;
  attackMode?: HoseAttackMode;
  baMode?: "search" | "firefighting";
  casualtyId?: string;
  entryTool?: EntryTool;
  closurePos?: { lat: number; lng: number };
  closureBearingDeg?: number;
  crsVehicleId?: string;
  crsActionId?: string;
  crsDurationSec?: number;
  crsLabel?: string;
  crsDoneMessage?: string;
}) => void;

type Tab = "vehicle" | "crew" | "water" | "treatment" | "actions";

const FIRE_TABS: { key: Tab; label: string; letter: string }[] = [
  { key: "vehicle", label: "Vehicle", letter: "V" },
  { key: "crew", label: "Crew", letter: "C" },
  { key: "water", label: "Water", letter: "W" },
  { key: "actions", label: "Actions", letter: "A" },
];

const AMBULANCE_TABS: { key: Tab; label: string; letter: string }[] = [
  { key: "vehicle", label: "Vehicle", letter: "V" },
  { key: "crew", label: "Crew", letter: "C" },
  { key: "actions", label: "Actions", letter: "A" },
  // Treatment workflow moved to the left-rail Casualties panel — the
  // operator works patient-first from there, so there's no longer a
  // per-ambulance Treatment tab here.
];

const POLICE_TABS: { key: Tab; label: string; letter: string }[] = [
  { key: "vehicle", label: "Vehicle", letter: "V" },
  { key: "crew", label: "Crew", letter: "C" },
  { key: "actions", label: "Actions", letter: "A" },
];

export function BottomActionMenu({
  appliance,
  deployment,
  allOnSceneAppliances,
  tasks,
  incident,
  visibleHazards,
  isCommander,
  crewAir,
  busyCrewIds,
  vehicleGauges,
  now,
  onStartTask,
  onAbortTask,
  onBeginRoadClosure,
  onClose,
  onSceneSeconds,
  onSetLightState,
  onSetPumpRunning,
  onSetPumpOperator,
  onSetFastAttackDeployed,
  onToggleCrewEquipment,
  onUpdateBaRemarks,
  onUpdateBaEntryPoint,
  onSetTreatingCasualty,
  onRequestRotate,
  scenarioCasualties,
  casualtyProgression,
  sim,
  tacticalMode,
  fatigueByApplianceId,
  treatmentByCasualtyId,
  onScenePatientDeployments,
  onStartPatientSurvey,
  onApplyAirway,
  onApplyBreathing,
  onApplyCirculation,
  onAdministerDrug,
  onApplyPackaging,
  onRequestClinician,
  onSetTreatmentDestination,
  onSendAtmistPrealert,
  onConveyCasualtyVia,
}: {
  appliance: Appliance | null;
  deployment: Deployment | null;
  allOnSceneAppliances: Appliance[];
  tasks: Task[];
  incident: Incident;
  sim?: IncidentSimState;
  tacticalMode?: "offensive" | "defensive" | "transitional" | null;
  fatigueByApplianceId?: Record<string, number>;
  treatmentByCasualtyId?: Record<string, PatientTreatmentState>;
  onScenePatientDeployments?: Deployment[];
  onStartPatientSurvey?: (casualtyId: string) => void;
  onApplyAirway?: (casualtyId: string, action: TxAirwayAction, by: string) => void;
  onApplyBreathing?: (casualtyId: string, action: TxBreathingAction, by: string) => void;
  onApplyCirculation?: (casualtyId: string, action: TxCirculationAction, by: string) => void;
  onAdministerDrug?: (casualtyId: string, drug: TxDrugName, by: string) => void;
  onApplyPackaging?: (casualtyId: string, action: TxPackagingAction, by: string) => void;
  onRequestClinician?: (
    scope: "ap" | "ccc" | "basics" | "hems",
    casualtyId: string,
  ) => void;
  onSetTreatmentDestination?: (
    casualtyId: string,
    type: HospitalDestinationType,
    name: string,
  ) => void;
  onSendAtmistPrealert?: (casualtyId: string) => void;
  /** Operator picks the on-scene ambulance to convey this casualty to
   *  hospital. Flips that deployment into a hospital leg immediately. */
  onConveyCasualtyVia?: (applianceId: string, casualtyId: string) => void;
  visibleHazards: { id: string; label: string; kind: string }[];
  isCommander: boolean;
  crewAir: Record<string, number>;
  busyCrewIds: Set<string>;
  vehicleGauges: Record<string, { fuelPct: number; waterPct: number; conditionPct: number }>;
  now: number;
  onStartTask: StartTaskFn;
  onAbortTask: (taskId: string) => void;
  /** Road-closure placement: crew picked here, the closure point is then
   *  clicked on the ground map (handled by the incident view). */
  onBeginRoadClosure?: (
    kind: "close_carriageway" | "close_road",
    crewIds: string[],
  ) => void;
  onClose: () => void;
  onSceneSeconds: number | null;
  onSetLightState: (applianceId: string, state: LightState) => void;
  onSetPumpRunning: (applianceId: string, running: boolean) => void;
  onSetPumpOperator: (applianceId: string, crewId: string | null) => void;
  onSetFastAttackDeployed: (applianceId: string, deployed: boolean) => void;
  onToggleCrewEquipment: (applianceId: string, crewId: string, item: string) => void;
  onUpdateBaRemarks?: (taskId: string, text: string) => void;
  onUpdateBaEntryPoint?: (taskId: string, label: string) => void;
  onSetTreatingCasualty?: (applianceId: string, casualtyId: string | null) => void;
  onRequestRotate?: (applianceId: string) => void;
  scenarioCasualties?: import("@/lib/sim/scene").SceneCasualty[];
  casualtyProgression?: import("@/lib/sim/incident_sim").IncidentSimState["casualtyProgression"];
}) {
  const [tab, setTab] = useState<Tab>("vehicle");

  // Reset to Vehicle whenever the operator picks a different appliance.
  useEffect(() => {
    setTab("vehicle");
  }, [appliance?.id]);

  if (!appliance || !deployment) {
    return (
      <aside className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
          Action menu
        </div>
        <p className="text-sm text-(--color-text-muted)">
          Click a vehicle on the map or in the Committed Crews panel.
        </p>
      </aside>
    );
  }

  const serviceColour =
    appliance.service === "Fire"
      ? "border-(--color-critical) bg-(--color-critical)/10 text-(--color-critical)"
      : appliance.service === "Ambulance"
        ? "border-(--color-ok) bg-(--color-ok)/10 text-(--color-ok)"
        : "border-(--color-info) bg-(--color-info)/10 text-(--color-info)";
  // Tab rail varies by service — ambulances get a Treatment tab instead
  // of Water; police get neither for now.
  const tabs =
    appliance.service === "Ambulance"
      ? AMBULANCE_TABS
      : appliance.service === "Police"
        ? POLICE_TABS
        : FIRE_TABS;

  const serviceHex =
    appliance.service === "Fire"
      ? "#dc2626"
      : appliance.service === "Ambulance"
        ? "#15803d"
        : "#1d4ed8";
  const lightState = deployment.lightState ?? "off";
  const lightChip =
    lightState === "999"
      ? { label: "999 Response", cls: "border-(--color-critical)/60 bg-(--color-critical)/10 text-(--color-critical)" }
      : lightState === "at_scene"
        ? { label: "At scene", cls: "border-(--color-amber)/60 bg-(--color-amber)/10 text-(--color-amber)" }
        : lightState === "off"
          ? { label: "Lights off", cls: "border-(--color-border) text-(--color-text-dim)" }
          : { label: lightState.replace(/_/g, " "), cls: "border-(--color-info)/60 bg-(--color-info)/10 text-(--color-info)" };

  return (
    <aside className="flex h-full flex-col overflow-hidden bg-(--color-surface)">
      {/* Service accent strip */}
      <div className="h-[3px] w-full shrink-0" style={{ background: serviceHex }} />
      {/* Identity header — callsign plate, type + VRM, light state, meta. */}
      <header className="border-b border-(--color-border-subtle) bg-(--color-surface-raised) px-3 py-2.5">
        <div className="flex items-center gap-3">
          <span
            className={`shrink-0 rounded-sm border px-2.5 py-1 font-mono text-[13px] font-bold tracking-widest ${serviceColour}`}
          >
            {appliance.callsign}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] leading-tight font-medium text-(--color-text)">
              {appliance.typeName}
            </div>
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
              {appliance.make} {appliance.model} · {appliance.vrm}
            </div>
          </div>
          <span
            className={`shrink-0 rounded-sm border px-2 py-1 font-mono text-[9px] uppercase tracking-widest ${lightChip.cls}`}
          >
            {lightChip.label}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-sm border border-(--color-border) px-1.5 py-0.5 font-mono text-[11px] text-(--color-text-dim) hover:border-(--color-critical) hover:text-(--color-critical)"
            title="Close"
            aria-label="Close action menu"
          >
            ✕
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-(--color-border-subtle) pt-2 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
          <span>
            Crew <span className="text-(--color-text)">{appliance.crew.current}/{appliance.crew.min}</span>
          </span>
          {onSceneSeconds !== null && (
            <span>
              On scene <span className="tabular-nums text-(--color-text)">{fmtMs(onSceneSeconds)}</span>
            </span>
          )}
          {isCommander && (
            <span className="rounded-sm border border-(--color-amber) bg-(--color-amber)/10 px-1.5 py-0 text-(--color-amber)">
              Incident Commander
            </span>
          )}
        </div>
      </header>

      {/* Horizontal tab rail — matches the LeftRail style and frees up
          the full panel width for content. */}
      <nav className="flex items-stretch border-b border-(--color-border-subtle) bg-(--color-surface-raised)">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={
                "relative flex-1 px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors " +
                (active
                  ? "text-(--color-amber) bg-(--color-bg)"
                  : "text-(--color-text-dim) hover:bg-(--color-bg)/40 hover:text-(--color-text)")
              }
            >
              {t.label}
              {active && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 bg-(--color-amber)" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
          {tab === "vehicle" && (
            <VehicleTab
              appliance={appliance}
              deployment={deployment}
              tasks={tasks}
              vehicleGauges={vehicleGauges}
              fatiguePct={fatigueByApplianceId?.[appliance.id] ?? 0}
              onSetLightState={onSetLightState}
              onRequestRotate={onRequestRotate}
            />
          )}
          {tab === "crew" && (
            <CrewTab
              appliance={appliance}
              deployment={deployment}
              busyCrewIds={busyCrewIds}
              crewAir={crewAir}
              onToggleCrewEquipment={onToggleCrewEquipment}
            />
          )}
          {tab === "water" && (
            <WaterTab
              appliance={appliance}
              deployment={deployment}
              tasks={tasks}
              incident={incident}
              allOnSceneAppliances={allOnSceneAppliances}
              vehicleGauges={vehicleGauges}
              busyCrewIds={busyCrewIds}
              onStartTask={onStartTask}
              onAbortTask={onAbortTask}
              onSetPumpRunning={onSetPumpRunning}
              onSetFastAttackDeployed={onSetFastAttackDeployed}
              onSetPumpOperator={onSetPumpOperator}
              sim={sim}
              tacticalMode={tacticalMode ?? null}
            />
          )}
          {tab === "actions" && (
            <ActionsTab
              appliance={appliance}
              deployment={deployment}
              tasks={tasks}
              incident={incident}
              visibleHazards={visibleHazards}
              isCommander={isCommander}
              busyCrewIds={busyCrewIds}
              crewAir={crewAir}
              now={now}
              onStartTask={onStartTask}
              onAbortTask={onAbortTask}
              onBeginRoadClosure={onBeginRoadClosure}
              onUpdateBaRemarks={onUpdateBaRemarks}
              onUpdateBaEntryPoint={onUpdateBaEntryPoint}
              onSetTreatingCasualty={onSetTreatingCasualty}
              scenarioCasualties={scenarioCasualties}
              casualtyProgression={casualtyProgression}
            />
          )}
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Vehicle tab — light state + summary gauges
// ---------------------------------------------------------------------------

const LIGHT_OPTIONS: { state: LightState; label: string; tone: string }[] = [
  { state: "999", label: "999 Response", tone: "border-(--color-critical) text-(--color-critical) bg-(--color-critical)/15" },
  { state: "at_scene", label: "At scene", tone: "border-(--color-amber) text-(--color-amber) bg-(--color-amber)/15" },
  { state: "rear_blues", label: "Rear blues", tone: "border-(--color-info) text-(--color-info) bg-(--color-info)/15" },
  { state: "rear_reds", label: "Rear reds", tone: "border-(--color-critical) text-(--color-critical) bg-(--color-critical)/10" },
  { state: "hazards", label: "Hazard lights", tone: "border-(--color-amber) text-(--color-amber) bg-(--color-amber)/10" },
  { state: "off", label: "All off", tone: "border-(--color-border) text-(--color-text-dim)" },
];

function VehicleTab({
  appliance,
  deployment,
  tasks,
  vehicleGauges,
  fatiguePct,
  onSetLightState,
  onRequestRotate,
}: {
  appliance: Appliance;
  deployment: Deployment;
  tasks: Task[];
  vehicleGauges: Record<string, { fuelPct: number; waterPct: number; conditionPct: number }>;
  fatiguePct?: number;
  onSetLightState: (applianceId: string, state: LightState) => void;
  onRequestRotate?: (applianceId: string) => void;
}) {
  const current = deployment.lightState ?? "at_scene";
  const gauges = vehicleGauges[appliance.id] ?? {
    fuelPct: appliance.fuelPct,
    waterPct: appliance.waterPct,
    conditionPct: appliance.conditionPct,
  };
  // Rotation lock-out: we don't want the operator spinning a vehicle while
  // its crew are actively working or there's a hose attached (the hose would
  // teleport with the vehicle, which is nonsense). Re-enable once every
  // task on this appliance is completed/aborted AND no hose lines connect
  // to or from it.
  const hasActiveTask = tasks.some(
    (t) => t.applianceId === appliance.id && t.state === "active",
  );
  const hasHoseConnection = tasks.some(
    (t) =>
      t.state !== "aborted" &&
      (t.kind === "connect_hydrant" || t.kind === "relay_hose") &&
      (t.applianceId === appliance.id || t.sourceApplianceId === appliance.id),
  );
  const parked = !!deployment.parkingPos;
  const canRotate = parked && !hasActiveTask && !hasHoseConnection;
  const lockReason = !parked
    ? "Not parked yet"
    : hasActiveTask
      ? "Crew working"
      : hasHoseConnection
        ? "Hose connected"
        : null;
  return (
    <div className="space-y-4">
      {onRequestRotate && (
        <Section title="Vehicle heading">
          <button
            type="button"
            disabled={!canRotate}
            onClick={() => onRequestRotate(appliance.id)}
            className={
              "w-full rounded-sm border px-3 py-2 text-left font-mono text-[11px] uppercase tracking-widest transition-colors " +
              (canRotate
                ? "border-(--color-amber) bg-(--color-amber)/10 text-(--color-amber) hover:bg-(--color-amber)/20"
                : "cursor-not-allowed border-(--color-border) bg-(--color-surface-raised)/40 text-(--color-text-dim)")
            }
          >
            <div>Rotate vehicle</div>
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest">
              {canRotate
                ? "Click map to set new facing direction"
                : `Locked · ${lockReason}`}
            </div>
          </button>
        </Section>
      )}
      <Section title="Emergency lights">
        <div className="grid grid-cols-2 gap-1.5">
          {LIGHT_OPTIONS.map((opt) => {
            const active = current === opt.state;
            return (
              <button
                key={opt.state}
                type="button"
                onClick={() => onSetLightState(appliance.id, opt.state)}
                className={
                  "rounded-sm border px-2 py-2 text-left font-mono text-[11px] uppercase tracking-widest transition-colors " +
                  (active
                    ? opt.tone
                    : "border-(--color-border) text-(--color-text) hover:border-(--color-amber-dim)")
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Crew status">
        <Gauge
          label={`Fatigue${fatiguePct && fatiguePct > 70 ? " · consider welfare" : ""}`}
          pct={100 - (fatiguePct ?? 0)}
          colour={fatiguePct && fatiguePct > 70 ? "critical" : fatiguePct && fatiguePct > 50 ? "amber" : "ok"}
        />
      </Section>

      <Section title="Vehicle status">
        <Gauge label="Fuel" pct={gauges.fuelPct} colour="amber" />
        {appliance.waterLitres > 0 && (
          <Gauge
            label={`Water (${appliance.waterLitres.toLocaleString()} L tank)`}
            pct={gauges.waterPct}
            colour="info"
          />
        )}
        <Gauge label="Condition" pct={gauges.conditionPct} colour="ok" />
      </Section>

      {appliance.note && (
        <Section title="Vehicle notes">
          <KV k="Note" v={appliance.note} />
        </Section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Crew tab — per-rider equipment loadout
// ---------------------------------------------------------------------------

type EquipDef = { key: CrewEquipment; label: string; baOnly?: boolean };
type EquipGroup = { title: string; items: EquipDef[] };

const EQUIPMENT_GROUPS: EquipGroup[] = [
  {
    title: "Firefighting",
    items: [
      { key: "ba_set", label: "BA set", baOnly: true },
      { key: "branch_45mm", label: "45mm branch" },
      { key: "branch_70mm", label: "70mm branch" },
      { key: "fast_attack_branch", label: "Fast attack reel" },
      { key: "thermal_camera", label: "TIC" },
      { key: "extinguisher", label: "Extinguisher" },
      { key: "foam_branch", label: "Foam branch" },
    ],
  },
  {
    title: "Water supply",
    items: [
      { key: "red_key", label: "Red key" },
      { key: "standpipe", label: "Standpipe" },
    ],
  },
  {
    title: "Method of entry",
    items: [
      { key: "hali_tool", label: "Hali tool" },
      { key: "lock_snapper", label: "Lock snapper" },
    ],
  },
  {
    title: "Heavy rescue / RTC",
    items: [
      { key: "hydraulic_cutters", label: "Hyd. cutters" },
      { key: "hydraulic_spreaders", label: "Hyd. spreaders" },
      { key: "combi_tool", label: "Combi tool" },
      { key: "hydraulic_ram", label: "Hyd. ram" },
      { key: "airbag_lifting", label: "Lifting airbags" },
      { key: "stabiliser_chocks", label: "Stabiliser chocks" },
      { key: "stab_struts", label: "Rescue struts" },
      { key: "glass_mgmt", label: "Glass management" },
      { key: "spine_board", label: "Spine board" },
      { key: "ked_extrication", label: "KED" },
      { key: "reciprocating_saw", label: "Recip saw" },
      { key: "disc_cutter", label: "Disc cutter" },
      { key: "chainsaw", label: "Chainsaw" },
      { key: "concrete_breaker", label: "Concrete breaker" },
      { key: "search_camera", label: "Search camera" },
      { key: "area_lighting", label: "Area lighting" },
      { key: "airline_ba", label: "Airline BA" },
      { key: "small_tools", label: "Small tools" },
    ],
  },
  {
    title: "Rope rescue",
    items: [
      { key: "rope_kit", label: "Rope kit" },
      { key: "rescue_harness", label: "Rescue harness" },
      { key: "sked_stretcher", label: "SKED stretcher" },
      { key: "tripod_anchor", label: "Tripod / anchors" },
      { key: "edge_roller", label: "Edge roller" },
      { key: "pulleys_prusiks", label: "Pulleys / prusiks" },
    ],
  },
  {
    title: "Water rescue",
    items: [
      { key: "water_rescue_kit", label: "Water rescue kit" },
      { key: "dry_suit", label: "Dry suit" },
      { key: "pfd", label: "PFD" },
      { key: "throw_line", label: "Throw line" },
      { key: "rescue_sled", label: "Rescue sled" },
      { key: "wading_pole", label: "Wading pole" },
    ],
  },
  {
    title: "Wildfire",
    items: [
      { key: "beater", label: "Beater" },
      { key: "knapsack_sprayer", label: "Knapsack sprayer" },
      { key: "leaf_blower", label: "Leaf blower" },
      { key: "drip_torch", label: "Drip torch" },
    ],
  },
  {
    title: "Medical",
    items: [
      { key: "aed", label: "AED" },
      { key: "first_aid", label: "First aid" },
      { key: "trauma", label: "Trauma" },
    ],
  },
  {
    title: "Comms",
    items: [{ key: "radio", label: "Radio" }],
  },
];

const ALL_EQUIPMENT: EquipDef[] = EQUIPMENT_GROUPS.flatMap((g) => g.items);

function CrewTab({
  appliance,
  deployment,
  busyCrewIds,
  crewAir,
  onToggleCrewEquipment,
}: {
  appliance: Appliance;
  deployment: Deployment;
  busyCrewIds: Set<string>;
  crewAir: Record<string, number>;
  onToggleCrewEquipment: (applianceId: string, crewId: string, item: string) => void;
}) {
  const [openCrewId, setOpenCrewId] = useState<string | null>(null);
  const caps = CAPABILITIES_BY_TYPE[appliance.type] ?? [];
  const baAllowed = caps.includes("BA");
  return (
    <div className="space-y-2">
      {appliance.crewMembers.map((m) => {
        const equipped = deployment.crewEquipment?.[m.id] ?? [];
        const busy = busyCrewIds.has(m.id);
        const air = crewAir[m.id];
        const isOpen = openCrewId === m.id;
        return (
          <div
            key={m.id}
            className={
              "rounded-sm border bg-(--color-surface-raised) " +
              (busy
                ? "border-(--color-critical)/40"
                : isOpen
                  ? "border-(--color-amber)/60"
                  : "border-(--color-border-subtle)")
            }
          >
            <button
              type="button"
              onClick={() => setOpenCrewId(isOpen ? null : m.id)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-(--color-text)">{m.name}</span>
                  {busy && (
                    <span className="rounded-sm border border-(--color-critical)/50 bg-(--color-critical)/10 px-1 py-0 font-mono text-[9px] uppercase tracking-widest text-(--color-critical)">
                      busy
                    </span>
                  )}
                  {air !== undefined && (
                    <span
                      className={
                        "font-mono text-[10px] " +
                        (air < 30
                          ? "text-(--color-critical)"
                          : air < 50
                            ? "text-(--color-amber)"
                            : "text-(--color-ok)")
                      }
                    >
                      BA {Math.round(air)}%
                    </span>
                  )}
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-muted)">
                  {m.role} · {m.yearsService}y
                </div>
                {equipped.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {equipped.map((e) => (
                      <span
                        key={e}
                        className="rounded-sm border border-(--color-amber)/50 bg-(--color-amber)/10 px-1.5 py-0 font-mono text-[9px] uppercase tracking-widest text-(--color-amber)"
                      >
                        {labelForEquipment(e)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="font-mono text-[10px] text-(--color-text-dim)">{isOpen ? "▾" : "▸"}</span>
            </button>
            {isOpen && (
              <div className="space-y-2 border-t border-(--color-border-subtle) px-3 py-2">
                {EQUIPMENT_GROUPS.map((group) => {
                  const items = group.items.filter(
                    (eq) =>
                      (!eq.baOnly || baAllowed) && applianceHasEquipment(appliance, eq.key),
                  );
                  if (items.length === 0) return null;
                  return (
                    <div key={group.title}>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-amber)">
                        {group.title}
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-1">
                        {items.map((eq) => {
                          const on = equipped.includes(eq.key);
                          return (
                            <button
                              key={eq.key}
                              type="button"
                              onClick={() => onToggleCrewEquipment(appliance.id, m.id, eq.key)}
                              className={
                                "rounded-sm border px-2 py-1 text-left font-mono text-[10px] uppercase tracking-widest transition-colors " +
                                (on
                                  ? "border-(--color-amber) bg-(--color-amber)/15 text-(--color-amber)"
                                  : "border-(--color-border) text-(--color-text) hover:border-(--color-amber-dim)")
                              }
                            >
                              {on ? "✓ " : ""}{eq.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function labelForEquipment(key: string): string {
  return ALL_EQUIPMENT.find((e) => e.key === key)?.label ?? key;
}

/**
 * Whether the given appliance physically carries the equipment a crew
 * member might want to pick up. Drives the Crew-tab filter so a rider on
 * a Welfare Unit can't equip hydraulic cutters and a WrL crewmate can't
 * equip a knapsack sprayer.
 *
 * We match against two signals:
 *  • The appliance's free-text `kit` array (from appliance_types.json)
 *  • Its capability tags (CAPABILITIES_BY_TYPE) — so "Heavy rescue" /
 *    "Rope rescue" / "Water rescue" kit lines unlock whole tool groups
 *    on the TRU without us listing every tool string individually.
 */
function applianceHasEquipment(appliance: Appliance, key: CrewEquipment): boolean {
  const kit = appliance.kit.join(" ");
  const caps = CAPABILITIES_BY_TYPE[appliance.type] ?? [];
  const hasKit = (re: RegExp) => re.test(kit);
  const cap = (c: string) => caps.includes(c as (typeof caps)[number]);

  switch (key) {
    // Comms — everyone has a radio.
    case "radio":
      return true;

    // Firefighting
    case "ba_set":
      return cap("BA") || hasKit(/BA sets?/i);
    case "branch_45mm":
    case "branch_70mm":
    case "fast_attack_branch":
      return appliance.waterLitres > 0 || hasKit(/Hose|Boom monitor/i);
    case "thermal_camera":
      return hasKit(/Thermal imaging|TIC/i) || cap("RTC_extrication") || cap("USAR");
    case "extinguisher":
      return hasKit(/Extinguisher/i) || appliance.waterLitres > 0;

    // Water supply — only pumping appliances carry a standpipe.
    case "red_key":
    case "standpipe":
      return hasKit(/Red key|standpipe/i) || appliance.waterLitres > 0;

    // Method of entry
    case "hali_tool":
      return hasKit(/Hali/i);
    case "lock_snapper":
      return hasKit(/Lock snapper/i);
    case "forcible_entry":
      // Retired as an equip option — the entry TOOL choice covers it.
      // Kept in the union so older saves with it equipped still load.
      return false;
    // RTC / heavy rescue — gated by specific kit OR the RTC/USAR capability.
    case "hydraulic_cutters":
    case "hydraulic_spreaders":
      return hasKit(/Hydraulic cutter|Hydraulic spreader|Heavy rescue/i) || cap("RTC_extrication");
    case "combi_tool":
    case "hydraulic_ram":
    case "ked_extrication":
    case "stab_struts":
      return hasKit(/Heavy rescue/i) || cap("RTC_extrication");
    case "stabiliser_chocks":
      return hasKit(/Stabiliser|Heavy rescue/i) || cap("RTC_extrication") || cap("Aerial");
    case "glass_mgmt":
      return hasKit(/Glass management|Heavy rescue/i) || cap("RTC_extrication");
    case "spine_board":
      return hasKit(/Spine board|Heavy rescue/i) || cap("RTC_extrication");
    case "airbag_lifting":
    case "reciprocating_saw":
    case "disc_cutter":
      return hasKit(/Heavy rescue|Concrete cutting|Lifting/i) || cap("RTC_extrication") || cap("USAR");
    case "chainsaw":
      return hasKit(/Heavy rescue|Concrete cutting/i) || cap("RTC_extrication") || cap("USAR") || cap("Wildfire");
    case "concrete_breaker":
    case "search_camera":
      return hasKit(/Shoring|Concrete|Search camera/i) || cap("USAR");
    case "area_lighting":
      return cap("RTC_extrication") || cap("USAR") || cap("Command") || appliance.waterLitres > 0;
    case "airline_ba":
      return cap("USAR") || cap("HAZMAT_DIM");
    // Every fire appliance stows a small-gear locker; foam-making kit
    // rides on anything that pumps (AFFF pickup + FB branch).
    case "small_tools":
      return appliance.waterLitres > 0 || cap("RTC_extrication") || cap("USAR") || hasKit(/tool/i);
    case "foam_branch":
      return hasKit(/foam/i) || cap("Foam") || appliance.waterLitres > 0;

    // Rope rescue
    case "rope_kit":
    case "rescue_harness":
    case "tripod_anchor":
    case "edge_roller":
    case "pulleys_prusiks":
      return cap("Rope") || hasKit(/Rope/i);
    case "sked_stretcher":
      return cap("Rope") || cap("USAR") || cap("HART") || hasKit(/Rope/i);

    // Water rescue
    case "water_rescue_kit":
    case "pfd":
    case "throw_line":
    case "rescue_sled":
    case "wading_pole":
      return cap("WaterRescue") || hasKit(/Water rescue|Throwline|Boat/i);
    case "dry_suit":
      return cap("WaterRescue") || hasKit(/Dry suits?|Water rescue/i);

    // Wildfire
    case "beater":
    case "leaf_blower":
    case "knapsack_sprayer":
    case "drip_torch":
      return cap("Wildfire") || hasKit(/beater|Leaf blower|Knapsack/i);

    // Medical
    case "aed":
      return hasKit(/AED|Defib/i) || cap("Medical");
    case "first_aid":
      return hasKit(/Paramedic kit|First|Oxygen|Airway/i) || cap("Medical");
    case "trauma":
      return hasKit(/Trauma|Critical care|Blood/i) || cap("Trauma") || cap("HEMS");
  }
}

// ---------------------------------------------------------------------------
// Water tab — tank gauge, pump start/stop, supply chains, fast attack
// ---------------------------------------------------------------------------

function WaterTab({
  appliance,
  deployment,
  tasks,
  incident,
  allOnSceneAppliances,
  vehicleGauges,
  busyCrewIds,
  onStartTask,
  onAbortTask,
  onSetPumpRunning,
  onSetFastAttackDeployed,
  onSetPumpOperator,
  sim,
  tacticalMode,
}: {
  appliance: Appliance;
  deployment: Deployment;
  tasks: Task[];
  incident: Incident;
  allOnSceneAppliances: Appliance[];
  vehicleGauges: Record<string, { fuelPct: number; waterPct: number; conditionPct: number }>;
  busyCrewIds: Set<string>;
  onStartTask: StartTaskFn;
  onAbortTask: (taskId: string) => void;
  onSetPumpRunning: (applianceId: string, running: boolean) => void;
  onSetFastAttackDeployed: (applianceId: string, deployed: boolean) => void;
  onSetPumpOperator: (applianceId: string, crewId: string | null) => void;
  sim?: IncidentSimState;
  tacticalMode?: "offensive" | "defensive" | "transitional" | null;
}) {
  const [pendingHydrant, setPendingHydrant] = useState<string | null>(null);
  const [pendingRelay, setPendingRelay] = useState<string | null>(null);
  const [pendingHoseAttack, setPendingHoseAttack] = useState<{
    mode: HoseAttackMode;
    hoseType: HoseType;
  } | null>(null);
  const [pickedCrew, setPickedCrew] = useState<string[]>([]);
  const [osmHydrants, setOsmHydrants] = useState<{ label: string; street?: string }[] | null>(null);
  // Canonical hydrant list shown on the map is authored per scenario with
  // real kerbside coords. Mirror that here so Connect Hydrant chips use the
  // same labels and street hints.
  const scenarioAuthored = (incident.scenario.scene?.hydrants ?? []).filter(
    (h) => !!h.coords,
  );
  useEffect(() => {
    if (scenarioAuthored.length > 0) {
      setOsmHydrants(null);
      return;
    }
    let cancelled = false;
    import("@/lib/sim/osm_hydrants").then(({ fetchOsmHydrants }) => {
      fetchOsmHydrants(incident.scenario.location.coords).then((list) => {
        if (cancelled) return;
        if (list.length === 0) {
          setOsmHydrants(null);
          return;
        }
        setOsmHydrants(list.slice(0, 8).map((_, i) => ({ label: `H${i + 1}` })));
      });
    });
    return () => {
      cancelled = true;
    };
  }, [incident.scenario.location.coords, scenarioAuthored.length]);

  // All hooks above — safe to early-return below.
  if (appliance.waterLitres === 0) {
    return (
      <div className="font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
        This vehicle has no water tank.
      </div>
    );
  }

  const waterPct = vehicleGauges[appliance.id]?.waterPct ?? appliance.waterPct;
  const pumpOn = deployment.pumpRunning === true;
  const fastAttackOut = deployment.fastAttackDeployed === true;
  const supplied = hasWaterSupplyChain(appliance.id, tasks);
  const hydrants: { label: string; street?: string }[] =
    scenarioAuthored.length > 0
      ? scenarioAuthored.map((h) => ({ label: h.label, street: h.street }))
      : osmHydrants ?? (incident.scenario.scene?.hydrants ?? []).map((h) => ({ label: h.label }));
  // Count active connections per hydrant — UK doctrine caps two pumps per
  // hydrant (primary + secondary outlets). Past that the water pressure
  // isn't there for a third jet, so the sim refuses the connection.
  const hydrantConnectCount = new Map<string, number>();
  for (const t of tasks) {
    if (t.kind !== "connect_hydrant" || t.state === "aborted" || !t.hydrantId) continue;
    hydrantConnectCount.set(t.hydrantId, (hydrantConnectCount.get(t.hydrantId) ?? 0) + 1);
  }
  const HYDRANT_MAX_PUMPS = 2;
  const relayCandidates = allOnSceneAppliances.filter(
    (a) => a.id !== appliance.id && hasWaterSupplyChain(a.id, tasks),
  );
  const hasHydrantTask = tasks.some(
    (t) => t.kind === "connect_hydrant" && t.state !== "aborted" && t.applianceId === appliance.id,
  );
  const hasHoseAttack = tasks.some(
    (t) => t.kind === "hose_attack" && t.state === "active" && t.applianceId === appliance.id,
  );

  function startTask(args: {
    kind: TaskKind;
    label: string;
    hydrantId?: string;
    sourceApplianceId?: string;
    hoseType?: HoseType;
    attackMode?: HoseAttackMode;
  }) {
    if (pickedCrew.length < TASK_MIN_CREW[args.kind]) return;
    onStartTask({
      applianceId: appliance.id,
      kind: args.kind,
      assignedCrewIds: pickedCrew,
      hydrantId: args.hydrantId,
      sourceApplianceId: args.sourceApplianceId,
      hoseType: args.hoseType,
      attackMode: args.attackMode,
    });
    setPendingHydrant(null);
    setPendingRelay(null);
    setPendingHoseAttack(null);
    setPickedCrew([]);
  }

  // Subgroup: a pending task waiting on crew assignment.
  const pendingMode = pendingHydrant !== null || pendingRelay !== null || pendingHoseAttack !== null;

  // Active water connections owned by this appliance — shown first with
  // Disconnect buttons so the operator can cancel them cleanly.
  const activeHydrantTasks = tasks.filter(
    (t) => t.kind === "connect_hydrant" && t.state !== "aborted" && t.applianceId === appliance.id,
  );
  const activeRelayTasks = tasks.filter(
    (t) => t.kind === "relay_hose" && t.state !== "aborted" && t.applianceId === appliance.id,
  );
  const activeAttackTasks = tasks.filter(
    (t) => t.kind === "hose_attack" && t.state === "active" && t.applianceId === appliance.id,
  );

  return (
    <div className="space-y-4">
      {(activeHydrantTasks.length > 0 || activeRelayTasks.length > 0 || activeAttackTasks.length > 0) && (
        <Section title="Current water supplies">
          <ul className="space-y-1">
            {activeHydrantTasks.map((t) => (
              <ConnectionRow
                key={t.id}
                title={`Hydrant · ${t.hydrantId ?? ""}`}
                subtitle="Supply from kerbside hydrant"
                onDisconnect={() => onAbortTask(t.id)}
              />
            ))}
            {activeRelayTasks.map((t) => {
              const src = allOnSceneAppliances.find((a) => a.id === t.sourceApplianceId);
              return (
                <ConnectionRow
                  key={t.id}
                  title={`Relay · from ${src?.callsign ?? t.sourceApplianceId ?? "\u2014"}`}
                  subtitle={`${t.hoseType ?? "70mm"} supply line`}
                  onDisconnect={() => onAbortTask(t.id)}
                />
              );
            })}
            {activeAttackTasks.map((t) => (
              <ConnectionRow
                key={t.id}
                title={`Jet · ${attackModeLabel(t.attackMode ?? "interior_attack")}`}
                subtitle={`${t.hoseType ?? "45mm"} branch in use`}
                tone="critical"
                onDisconnect={() => onAbortTask(t.id)}
              />
            ))}
          </ul>
        </Section>
      )}

      {/* Live water gauge */}
      <Section title="Water tank">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-muted)">
              {appliance.waterLitres.toLocaleString()} L max
            </span>
            <span
              className={
                "font-mono text-sm tabular-nums " +
                (waterPct < 25
                  ? "text-(--color-critical)"
                  : waterPct < 60
                    ? "text-(--color-amber)"
                    : "text-(--color-info)")
              }
            >
              {Math.round(waterPct)}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-sm border border-(--color-border) bg-(--color-bg)">
            <div
              className={
                "h-full transition-all duration-700 " +
                (waterPct < 25
                  ? "bg-(--color-critical)"
                  : waterPct < 60
                    ? "bg-(--color-amber)"
                    : "bg-(--color-info)")
              }
              style={{ width: `${Math.max(0, Math.min(100, waterPct))}%` }}
            />
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-muted)">
            {pumpOn
              ? supplied
                ? "Pump running · supplied (holding)"
                : hasHoseAttack
                  ? "Pump running · unsupplied (draining)"
                  : "Pump running · idle"
              : "Pump not running"}
          </div>
        </div>
      </Section>

      {!pendingMode && (
        <>
          <Section title="Pump">
            <PumpOperatorRow
              appliance={appliance}
              deployment={deployment}
              onSetPumpOperator={onSetPumpOperator}
            />
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <BigBtn
                label={pumpOn ? "Stop pump" : "Start pump"}
                onClick={() => onSetPumpRunning(appliance.id, !pumpOn)}
                tone={pumpOn ? "critical" : "ok"}
                disabled={!pumpOn && !deployment.pumpOperatorCrewId}
                title={
                  !pumpOn && !deployment.pumpOperatorCrewId
                    ? "Assign a pump operator first"
                    : undefined
                }
              />
              <BigBtn
                label={fastAttackOut ? "Stow fast attack" : "Pull fast attack reel"}
                onClick={() => onSetFastAttackDeployed(appliance.id, !fastAttackOut)}
                tone={fastAttackOut ? "amber" : "muted"}
              />
            </div>
          </Section>

          <Section title="Connect hydrant">
            {hydrants.length === 0 ? (
              <p className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                No hydrants on this scene.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-1.5">
                {hydrants.map((h) => {
                  const count = hydrantConnectCount.get(h.label) ?? 0;
                  const full = count >= HYDRANT_MAX_PUMPS;
                  const label = full
                    ? `${h.label} (${count}/${HYDRANT_MAX_PUMPS} full)`
                    : count > 0
                      ? `${h.label} (${count}/${HYDRANT_MAX_PUMPS})`
                      : h.label;
                  return (
                    <Chip
                      key={h.label}
                      label={label}
                      detail={h.street}
                      disabled={full || hasHydrantTask}
                      onClick={() => setPendingHydrant(h.label)}
                    />
                  );
                })}
              </div>
            )}
          </Section>

          {relayCandidates.length > 0 && (
            <Section title="Relay supply from">
              <div className="grid grid-cols-2 gap-1.5">
                {relayCandidates.map((src) => {
                  const linked = tasks.some(
                    (t) =>
                      t.kind === "relay_hose" &&
                      t.state !== "aborted" &&
                      t.applianceId === appliance.id &&
                      t.sourceApplianceId === src.id,
                  );
                  return (
                    <Chip
                      key={src.id}
                      label={linked ? `${src.callsign} (linked)` : `${src.callsign} · 70mm`}
                      disabled={linked}
                      onClick={() => setPendingRelay(src.id)}
                    />
                  );
                })}
              </div>
            </Section>
          )}

          <Section title="Firefighting posture">
            {(() => {
              const tankCapable = appliance.waterLitres > 0;
              const tankHasWater = waterPct > 0;
              // Water source: either a hydrant/relay (supplied) or tank
              // water that hasn't run dry yet. A pump with 0 L tank and no
              // supply cannot pump air onto the fire.
              const hasWaterSource = supplied || (tankCapable && tankHasWater);
              const pumpOperatorAssigned = !!deployment.pumpOperatorCrewId;
              const pumpReady = pumpOn && pumpOperatorAssigned;
              const canAttack = hasWaterSource && pumpReady;
              // Collect blocking reasons so the operator can see what's
              // missing at a glance.
              const attackReasons: string[] = [];
              if (!hasWaterSource) {
                if (tankCapable && !tankHasWater) attackReasons.push("tank empty");
                else attackReasons.push("no water supply");
              }
              if (!pumpOperatorAssigned) attackReasons.push("no pump operator assigned");
              else if (!pumpOn) attackReasons.push("pump not running");
              // Interior attack gating — must have entry made on scene AND
              // a BA crew currently committed. Also requires the attacker
              // to have a 45mm branch equipped on at least one rider.
              const entryMadeAnywhere = tasks.some(
                (t) => t.kind === "gain_entry" && t.state === "completed",
              );
              const baCommittedAnywhere = tasks.some(
                (t) => t.kind === "ba_sar" && t.state === "active",
              );
              const have45mm = Object.values(deployment.crewEquipment ?? {}).some((items) =>
                items.includes("branch_45mm"),
              );
              const interiorReasons: string[] = [...attackReasons];
              if (!entryMadeAnywhere) interiorReasons.push("entry not made");
              if (!baCommittedAnywhere) interiorReasons.push("no BA team committed");
              if (!have45mm) interiorReasons.push("no 45 mm branch equipped");
              if (tacticalMode === "defensive") interiorReasons.push("tactical mode = Defensive");
              const interiorAllowed =
                canAttack && interiorReasons.length === 0;

              // Material-aware effectiveness. If the operator hasn't done a
              // 360 survey on a scenario with unknown material, we show the
              // buttons but don't pre-announce the mismatch.
              const knownMaterial =
                sim?.fireMaterialKnown && sim.fireMaterial ? sim.fireMaterial : null;
              const effCooling = knownMaterial
                ? ATTACK_EFFECTIVENESS[knownMaterial].exterior_cooling
                : 1;
              const effExterior = knownMaterial
                ? ATTACK_EFFECTIVENESS[knownMaterial].exterior_attack
                : 1;
              const effInterior = knownMaterial
                ? ATTACK_EFFECTIVENESS[knownMaterial].interior_attack
                : 1;
              const badge = (eff: number) => {
                if (!knownMaterial) return null;
                if (eff < 0)
                  return { text: "Counter-productive", tone: "text-(--color-critical)" };
                if (eff < 0.3)
                  return { text: "Ineffective", tone: "text-(--color-amber)" };
                if (eff < 0.7)
                  return { text: "Partial", tone: "text-(--color-amber)" };
                return null;
              };
              const cb = badge(effCooling);
              const xb = badge(effExterior);
              const ib = badge(effInterior);

              return (
                <>
                  <div className="grid grid-cols-1 gap-1.5">
                    <BigBtn
                      label={
                        hasHoseAttack
                          ? "✓ Jet on scene"
                          : "Exterior cooling · hold exposures"
                      }
                      detail={cb?.text}
                      disabled={hasHoseAttack || !canAttack}
                      tone={cb?.tone === "text-(--color-critical)" ? "critical" : "ok"}
                      onClick={() =>
                        setPendingHoseAttack({ mode: "exterior_cooling", hoseType: "70mm" })
                      }
                    />
                    <BigBtn
                      label="Exterior attack · knock down from outside"
                      detail={xb?.text}
                      disabled={hasHoseAttack || !canAttack}
                      tone={xb?.tone === "text-(--color-critical)" ? "critical" : "amber"}
                      onClick={() =>
                        setPendingHoseAttack({ mode: "exterior_attack", hoseType: "45mm" })
                      }
                    />
                    <BigBtn
                      label="Interior attack · BA crew advance"
                      detail={
                        interiorReasons.length > 0
                          ? `Blocked · ${interiorReasons.join(" · ")}`
                          : ib?.text
                      }
                      disabled={hasHoseAttack || !interiorAllowed}
                      tone="critical"
                      onClick={() =>
                        setPendingHoseAttack({ mode: "interior_attack", hoseType: "45mm" })
                      }
                    />
                  </div>
                  {attackReasons.length > 0 ? (
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-(--color-critical)">
                      Cannot pump · {attackReasons.join(" · ")}
                    </p>
                  ) : !supplied ? (
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
                      Tank supply only — {appliance.waterLitres.toLocaleString()} L
                      will deplete fast. Set up hydrant / relay before it runs out.
                    </p>
                  ) : null}
                  {knownMaterial ? (
                    <div className="mt-2 rounded-sm border border-(--color-border-subtle) bg-(--color-surface-raised)/60 p-2">
                      <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-amber)">
                        Fire material · {FIRE_MATERIAL_LABEL[knownMaterial]}
                      </div>
                      <p className="mt-1 font-mono text-[10px] leading-snug text-(--color-text-muted)">
                        {FIRE_MATERIAL_TACTIC[knownMaterial]}
                      </p>
                    </div>
                  ) : sim?.fireMaterial ? (
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                      Material unknown — run a 360 survey to confirm what's
                      burning before committing to a posture.
                    </p>
                  ) : null}
                </>
              );
            })()}
          </Section>
        </>
      )}

      {pendingHydrant !== null && (
        <CrewPickerInline
          appliance={appliance}
          deployment={deployment}
          minCrew={TASK_MIN_CREW.connect_hydrant}
          requiredEquipment={["red_key"]}
          pickedCrew={pickedCrew}
          busyCrewIds={busyCrewIds}
          title={`Connect to hydrant ${pendingHydrant}`}
          onTogglePick={(id) =>
            setPickedCrew((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
          }
          onCancel={() => {
            setPendingHydrant(null);
            setPickedCrew([]);
          }}
          onConfirm={() =>
            startTask({ kind: "connect_hydrant", label: "Connect hydrant", hydrantId: pendingHydrant })
          }
        />
      )}

      {pendingRelay !== null && (
        <CrewPickerInline
          appliance={appliance}
          deployment={deployment}
          minCrew={TASK_MIN_CREW.relay_hose}
          requiredEquipment={["branch_70mm"]}
          pickedCrew={pickedCrew}
          busyCrewIds={busyCrewIds}
          title="Relay 70mm hose"
          onTogglePick={(id) =>
            setPickedCrew((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
          }
          onCancel={() => {
            setPendingRelay(null);
            setPickedCrew([]);
          }}
          onConfirm={() =>
            startTask({
              kind: "relay_hose",
              label: "Relay hose",
              sourceApplianceId: pendingRelay,
              hoseType: "70mm",
            })
          }
        />
      )}

      {pendingHoseAttack !== null && (
        <CrewPickerInline
          appliance={appliance}
          deployment={deployment}
          minCrew={TASK_MIN_CREW.hose_attack}
          requiredEquipment={
            pendingHoseAttack.mode === "interior_attack"
              ? ["ba_set", pendingHoseAttack.hoseType === "70mm" ? "branch_70mm" : "branch_45mm"]
              : [pendingHoseAttack.hoseType === "70mm" ? "branch_70mm" : "branch_45mm"]
          }
          pickedCrew={pickedCrew}
          busyCrewIds={busyCrewIds}
          title={attackModeLabel(pendingHoseAttack.mode)}
          onTogglePick={(id) =>
            setPickedCrew((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
          }
          onCancel={() => {
            setPendingHoseAttack(null);
            setPickedCrew([]);
          }}
          onConfirm={() =>
            startTask({
              kind: "hose_attack",
              label: attackModeLabel(pendingHoseAttack.mode),
              hoseType: pendingHoseAttack.hoseType,
              attackMode: pendingHoseAttack.mode,
            })
          }
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Actions tab — task assignment, filtered by equipment loadout
// ---------------------------------------------------------------------------

function ActionsTab({
  appliance,
  deployment,
  tasks,
  incident,
  visibleHazards,
  isCommander,
  busyCrewIds,
  crewAir,
  now,
  onStartTask,
  onAbortTask,
  onBeginRoadClosure,
  onUpdateBaRemarks,
  onUpdateBaEntryPoint,
  onSetTreatingCasualty,
  scenarioCasualties,
  casualtyProgression,
}: {
  appliance: Appliance;
  deployment: Deployment;
  tasks: Task[];
  incident: Incident;
  visibleHazards: { id: string; label: string; kind: string }[];
  isCommander: boolean;
  busyCrewIds: Set<string>;
  crewAir: Record<string, number>;
  now: number;
  onStartTask: StartTaskFn;
  onAbortTask: (taskId: string) => void;
  onBeginRoadClosure?: (
    kind: "close_carriageway" | "close_road",
    crewIds: string[],
  ) => void;
  onUpdateBaRemarks?: (taskId: string, text: string) => void;
  onUpdateBaEntryPoint?: (taskId: string, label: string) => void;
  onSetTreatingCasualty?: (applianceId: string, casualtyId: string | null) => void;
  scenarioCasualties?: import("@/lib/sim/scene").SceneCasualty[];
  casualtyProgression?: import("@/lib/sim/incident_sim").IncidentSimState["casualtyProgression"];
}) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [pickedCrew, setPickedCrew] = useState<string[]>([]);
  const [baBoardOpen, setBaBoardOpen] = useState(true);

  const ownActive = tasks.filter((t) => t.applianceId === appliance.id && t.state === "active");
  const ownCompleted = tasks.filter((t) => t.applianceId === appliance.id && t.state === "completed");
  const has = (k: TaskKind) =>
    ownActive.some((t) => t.kind === k) || ownCompleted.some((t) => t.kind === k);

  const caps = CAPABILITIES_BY_TYPE[appliance.type] ?? [];
  const isBA = caps.includes("BA");
  const isAerial = caps.includes("Aerial");
  const isRTC = caps.includes("RTC_extrication");
  const isRope = caps.includes("Rope");
  const isWaterRescue = caps.includes("WaterRescue");
  const isWildfire = caps.includes("Wildfire");
  // Service-level gates. Fire-only task groups (BA, aerial, tech rescue,
  // wildfire, hazard mitigation) are already caps-guarded because the
  // CAPABILITIES_BY_TYPE map doesn't assign those caps to ambulance or
  // police types — but we use these booleans to toggle the police /
  // ambulance-specific groups below, and to harden the hazard section
  // (which would otherwise show on any service with visible hazards).
  const isFire = appliance.service === "Fire";
  const isAmbulance = appliance.service === "Ambulance";
  const isPolice = appliance.service === "Police";
  const stabilisersDown = ownActive.some((t) => t.kind === "deploy_stabilisers" && t.state === "active")
    || ownCompleted.some((t) => t.kind === "deploy_stabilisers");
  const platformUp = ownActive.some((t) => t.kind === "extend_platform");
  // Scene-global: once any appliance completes gain_entry, every BA team
  // after that can commit without re-forcing the door. Mirrors the same
  // check used in the right-rail action panel and firefighting posture.
  const entryComplete = tasks.some(
    (t) => t.kind === "gain_entry" && t.state === "completed",
  );
  const entryByOther =
    entryComplete && !ownCompleted.some((t) => t.kind === "gain_entry");

  const kitAvailable: { kind: KitKind; label: string }[] = [];
  if (appliance.kit.some((k) => /AED|Defib/i.test(k))) kitAvailable.push({ kind: "aed", label: "AED" });
  if (appliance.kit.some((k) => /First|Paramedic kit|Oxygen/i.test(k)))
    kitAvailable.push({ kind: "first_aid", label: "First aid" });
  if (appliance.kit.some((k) => /Trauma|Critical care/i.test(k)))
    kitAvailable.push({ kind: "trauma", label: "Trauma bag" });
  if (appliance.kit.some((k) => /Extinguisher/i.test(k)))
    kitAvailable.push({ kind: "extinguisher", label: "Extinguisher" });

  function start(p: Pending) {
    setPending(p);
    setPickedCrew([]);
  }
  function cancel() {
    setPending(null);
    setPickedCrew([]);
  }
  function confirm() {
    if (!pending) return;
    if (pickedCrew.length < TASK_MIN_CREW[pending.kind]) return;
    // Road closures need a point on the map: hand the picked crew back
    // to the incident view, which arms click-to-place on the ground map.
    if (
      (pending.kind === "close_carriageway" || pending.kind === "close_road") &&
      onBeginRoadClosure
    ) {
      onBeginRoadClosure(pending.kind, pickedCrew);
      cancel();
      return;
    }
    onStartTask({
      applianceId: appliance.id,
      kind: pending.kind,
      assignedCrewIds: pickedCrew,
      hydrantId: pending.hydrantId,
      sourceApplianceId: pending.sourceApplianceId,
      hoseType: pending.hoseType,
      kitKind: pending.kitKind,
      hazardId: pending.hazardId,
      mitigationMethod: pending.mitigationMethod,
      attackMode: pending.attackMode,
      baMode: pending.baMode,
      casualtyId: pending.casualtyId,
      entryTool: pending.entryTool,
    });
    cancel();
  }

  if (pending) {
    return (
      <CrewPickerInline
        appliance={appliance}
        deployment={deployment}
        minCrew={TASK_MIN_CREW[pending.kind]}
        requiredEquipment={pending.requiredEquipment}
        pickedCrew={pickedCrew}
        busyCrewIds={busyCrewIds}
        crewAir={pending.kind === "ba_sar" ? crewAir : undefined}
        baOnly={pending.kind === "ba_sar"}
        title={pending.label}
        onTogglePick={(id) =>
          setPickedCrew((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
        }
        onCancel={cancel}
        onConfirm={confirm}
      />
    );
  }

  const activeBaTasks = ownActive.filter((t) => t.kind === "ba_sar");

  // Per-casualty treatment pairing panel — only shown for ambulance-type
  // appliances that are on scene (not generic medical roles on a fire
  // pump). The operator picks a discovered casualty from the list and
  // pairs them with this crew; deterioration pauses for the paired
  // casualty, and the pairing is carried onto the hospital leg.
  const treatingCasualtyId = deployment.treatingCasualtyId ?? null;
  const pairedCasualty = treatingCasualtyId
    ? scenarioCasualties?.find((c) => c.id === treatingCasualtyId) ?? null
    : null;
  const pairedProgression = treatingCasualtyId
    ? casualtyProgression?.[treatingCasualtyId]
    : null;
  // Candidates: every located but un-paired casualty.
  const treatmentCandidates = (scenarioCasualties ?? []).filter((c) => {
    if (c.id === treatingCasualtyId) return false;
    const stage = casualtyProgression?.[c.id]?.stage;
    return stage === "located";
  });

  return (
    <div className="space-y-4">
      {activeBaTasks.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setBaBoardOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-sm border border-(--color-amber) bg-(--color-amber)/10 px-3 py-2 text-left font-mono text-[11px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/20"
          >
            <span>
              BA Entry Control Board · {activeBaTasks.length} team
              {activeBaTasks.length === 1 ? "" : "s"} under air
            </span>
            <span aria-hidden>{baBoardOpen ? "▾" : "▸"}</span>
          </button>
          {baBoardOpen && (
            <BaControlBoard
              appliance={appliance}
              baTasks={activeBaTasks}
              now={now}
              onUpdateRemarks={onUpdateBaRemarks}
              onUpdateEntryPoint={onUpdateBaEntryPoint}
              onWithdrawTeam={(taskId) => onAbortTask(taskId)}
            />
          )}
        </div>
      )}

      {isAmbulance && onSetTreatingCasualty && (
        <Section title="Casualty treatment">
          {pairedCasualty ? (
            <div className="rounded-sm border border-(--color-ok)/50 bg-(--color-ok)/10 p-2">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-ok)">
                    Treating · {pairedProgression?.stage.replace(/_/g, " ") ?? "on scene"}
                  </div>
                  <div className="mt-0.5 text-[13px] text-(--color-text)">
                    {pairedCasualty.label ?? pairedCasualty.id}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                    {(pairedProgression?.severity ?? pairedCasualty.severity)} · timer paused
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSetTreatingCasualty(appliance.id, null)}
                  className="rounded-sm border border-(--color-critical)/60 bg-(--color-critical)/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-(--color-critical) hover:bg-(--color-critical)/20"
                >
                  Release
                </button>
              </div>
            </div>
          ) : treatmentCandidates.length === 0 ? (
            <p className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
              No located casualties awaiting treatment.
            </p>
          ) : (
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                Pair this crew with a casualty to pause deterioration and
                carry them on the hospital leg.
              </p>
              {treatmentCandidates.map((c) => {
                const sev = casualtyProgression?.[c.id]?.severity ?? c.severity;
                const sevTone =
                  sev === "expectant" || sev === "critical"
                    ? "text-(--color-critical)"
                    : sev === "serious"
                      ? "text-(--color-amber)"
                      : "text-(--color-ok)";
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSetTreatingCasualty(appliance.id, c.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-sm border border-(--color-border-subtle) bg-(--color-surface-raised) px-2 py-1.5 text-left hover:border-(--color-amber-dim)"
                  >
                    <span className="text-[13px] text-(--color-text)">
                      {c.label ?? c.id}
                    </span>
                    <span className={`font-mono text-[10px] uppercase tracking-widest ${sevTone}`}>
                      {sev}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {ownActive.length > 0 && (
        <Section title="Active tasks">
          <ul className="space-y-1">
            {ownActive.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2 rounded-sm border border-(--color-border-subtle) bg-(--color-surface-raised) px-2 py-1.5"
              >
                <span className="font-mono text-[11px] text-(--color-text)">
                  {t.crsLabel ?? taskShortLabel(t.kind)}
                  {t.hydrantId ? ` · ${t.hydrantId}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => onAbortTask(t.id)}
                  className="rounded-sm border border-(--color-critical)/50 px-1.5 font-mono text-[9px] uppercase tracking-widest text-(--color-critical) hover:bg-(--color-critical)/10"
                >
                  abort
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Command & survey">
        <div className="grid grid-cols-1 gap-1.5">
          <BigBtn
            label={has("survey") ? "✓ 360 survey done" : "Initial 360 survey · 60s"}
            disabled={has("survey")}
            onClick={() => start({ kind: "survey", label: "360 survey" })}
          />
          <BigBtn
            label={isCommander ? "✓ Scene commander" : "Take scene command"}
            disabled={isCommander}
            onClick={() => start({ kind: "commander", label: "Scene commander" })}
          />
        </div>
      </Section>

      {isBA && (
        <Section title="Entry & search">
          <div className="grid grid-cols-1 gap-1.5">
            {(() => {
              const entryDone = has("gain_entry") || entryByOther;
              const entryWorking = ownActive.some((t) => t.kind === "gain_entry");
              const surveyDone = tasks.some(
                (t) => t.kind === "survey" && t.state === "completed",
              );
              const doorType = doorTypeForScenario(incident.scenario);
              if (entryDone) {
                return (
                  <BigBtn
                    label={has("gain_entry") ? "✓ Entry made" : "✓ Entry already made"}
                    disabled
                    title={entryByOther ? "Another BA team has already forced entry — commit BA directly" : undefined}
                    onClick={() => {}}
                  />
                );
              }
              return (
                <>
                  <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/40 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest">
                    {surveyDone ? (
                      <span className="text-(--color-amber)">
                        Door: {DOOR_TYPE_LABEL[doorType]}
                      </span>
                    ) : (
                      <span className="text-(--color-text-dim)">
                        Door type unknown — a 360 survey identifies it
                      </span>
                    )}
                  </div>
                  {entryWorking ? (
                    <BigBtn label="Working the door…" disabled onClick={() => {}} />
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.keys(ENTRY_TOOL_LABEL) as EntryTool[]).map((tool) => {
                        const cell = ENTRY_TABLE[tool][doorType];
                        return (
                          <Chip
                            key={tool}
                            label={ENTRY_TOOL_LABEL[tool]}
                            detail={
                              surveyDone
                                ? `${cell.sec}s · ~${cell.pct}%`
                                : "time & odds unknown"
                            }
                            onClick={() =>
                              start({
                                kind: "gain_entry",
                                label: ENTRY_TOOL_LABEL[tool],
                                entryTool: tool,
                              })
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
            <BigBtn
              label={
                hasActiveBaMode(ownActive, "search")
                  ? "✓ BA team · Search"
                  : entryComplete
                    ? "Commit BA · Search for casualties"
                    : "Commit BA · Search (entry first)"
              }
              detail="primary search — locate casualties"
              disabled={!entryComplete || hasActiveBaMode(ownActive, "search")}
              onClick={() =>
                start({
                  kind: "ba_sar",
                  label: "BA SAR · Search",
                  requiredEquipment: ["ba_set"],
                  baMode: "search",
                })
              }
            />
            <BigBtn
              label={
                hasActiveBaMode(ownActive, "firefighting")
                  ? "✓ BA team · Firefighting"
                  : entryComplete
                    ? "Commit BA · Interior firefighting"
                    : "Commit BA · Firefighting (entry first)"
              }
              detail="interior attack — suppress fire"
              tone="critical"
              disabled={!entryComplete || hasActiveBaMode(ownActive, "firefighting")}
              onClick={() =>
                start({
                  kind: "ba_sar",
                  label: "BA SAR · Firefighting",
                  requiredEquipment: ["ba_set", "branch_45mm"],
                  baMode: "firefighting",
                })
              }
            />
          </div>
          {/* Extract casualty — one button per located casualty still on
              scene, enabled once a BA team is committed. */}
          {(() => {
            const locatedOnScene = (scenarioCasualties ?? []).filter((c) => {
              const stage = casualtyProgression?.[c.id]?.stage;
              return stage === "located";
            });
            if (locatedOnScene.length === 0) return null;
            const baCommittedAnywhere = tasks.some(
              (t) => t.kind === "ba_sar" && t.state === "active",
            );
            return (
              <div className="mt-2 space-y-1">
                <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-amber-dim)">
                  Extract located casualties
                </div>
                {locatedOnScene.map((c) => {
                  const already = tasks.some(
                    (t) =>
                      t.kind === "extract_casualty" &&
                      t.state !== "aborted" &&
                      t.casualtyId === c.id,
                  );
                  return (
                    <BigBtn
                      key={c.id}
                      label={
                        already
                          ? `✓ ${c.label ?? c.id} extracted`
                          : `Extract ${c.label ?? c.id} · 90s`
                      }
                      detail={!baCommittedAnywhere ? "BA team needed" : "carry to RVP / safe area"}
                      tone="amber"
                      disabled={already || !baCommittedAnywhere}
                      onClick={() =>
                        start({
                          kind: "extract_casualty",
                          label: `Extract ${c.label ?? c.id}`,
                          requiredEquipment: ["ba_set"],
                          casualtyId: c.id,
                        })
                      }
                    />
                  );
                })}
              </div>
            );
          })()}
        </Section>
      )}

      {isAerial && (
        <Section title="Aerial operations">
          <div className="grid grid-cols-1 gap-1.5">
            <BigBtn
              label={stabilisersDown ? "✓ Stabilisers set" : "Deploy stabilisers · 90s"}
              detail="levelled + chocked"
              disabled={stabilisersDown}
              tone="amber"
              onClick={() =>
                start({
                  kind: "deploy_stabilisers",
                  label: "Deploy stabilisers",
                  requiredEquipment: ["stabiliser_chocks"],
                })
              }
            />
            <BigBtn
              label={platformUp ? "✓ Platform / ladder extended" : "Extend platform / ladder"}
              detail={stabilisersDown ? "ongoing" : "needs stabilisers"}
              disabled={!stabilisersDown || platformUp}
              tone="amber"
              onClick={() => start({ kind: "extend_platform", label: "Platform / ladder up" })}
            />
            <BigBtn
              label="Rescue from height"
              detail="2 crew, cage"
              disabled={!platformUp}
              tone="critical"
              onClick={() => start({ kind: "aerial_rescue", label: "Aerial rescue" })}
            />
            <BigBtn
              label="Aerial water monitor"
              detail={platformUp ? "from the cage" : "platform up first"}
              disabled={!platformUp}
              tone="critical"
              onClick={() =>
                start({
                  kind: "aerial_monitor",
                  label: "Aerial water monitor",
                  requiredEquipment: ["branch_70mm"],
                })
              }
            />
          </div>
          {!stabilisersDown && (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
              Stabilisers must be set before the cage / ladder can be extended.
            </p>
          )}
        </Section>
      )}

      {(isRTC || isRope || isWaterRescue) && (
        <Section title="Technical rescue">
          <div className="grid grid-cols-1 gap-1.5">
            {isRTC && (
              <BigBtn
                label={has("rtc_extrication") ? "✓ RTC extrication done" : "RTC extrication · 10m"}
                detail="cutters + spreaders + glass mgmt"
                disabled={has("rtc_extrication")}
                tone="critical"
                onClick={() =>
                  start({
                    kind: "rtc_extrication",
                    label: "RTC extrication",
                    requiredEquipment: [
                      "hydraulic_cutters",
                      "hydraulic_spreaders",
                      "stabiliser_chocks",
                      "glass_mgmt",
                      "spine_board",
                    ],
                  })
                }
              />
            )}
            {isRope && (
              <BigBtn
                label={has("rope_rescue") ? "✓ Rope rescue ongoing" : "Rope rescue · ongoing"}
                detail="working at height"
                disabled={has("rope_rescue")}
                tone="amber"
                onClick={() =>
                  start({
                    kind: "rope_rescue",
                    label: "Rope rescue",
                    requiredEquipment: ["rope_kit"],
                  })
                }
              />
            )}
            {isWaterRescue && (
              <BigBtn
                label={has("water_rescue") ? "✓ Water rescue ongoing" : "Water rescue · ongoing"}
                detail="swiftwater / flood"
                disabled={has("water_rescue")}
                tone="amber"
                onClick={() =>
                  start({
                    kind: "water_rescue",
                    label: "Water rescue",
                    requiredEquipment: ["water_rescue_kit"],
                  })
                }
              />
            )}
          </div>
        </Section>
      )}

      {isWildfire && (
        <Section title="Wildfire operations">
          <div className="grid grid-cols-1 gap-1.5">
            <BigBtn
              label={has("wildfire_beating") ? "✓ Beating line ongoing" : "Beating line · ongoing"}
              detail="knock flame front down"
              disabled={has("wildfire_beating")}
              tone="amber"
              onClick={() =>
                start({
                  kind: "wildfire_beating",
                  label: "Wildfire beating",
                  requiredEquipment: ["beater"],
                })
              }
            />
            <BigBtn
              label={has("wildfire_knapsack") ? "✓ Knapsack spraying" : "Knapsack spraying · ongoing"}
              detail="wet flame edge"
              disabled={has("wildfire_knapsack")}
              tone="amber"
              onClick={() =>
                start({
                  kind: "wildfire_knapsack",
                  label: "Knapsack sprayer",
                  requiredEquipment: ["knapsack_sprayer"],
                })
              }
            />
            <BigBtn
              label={has("firebreak") ? "✓ Firebreak cut" : "Cut firebreak · 10m"}
              detail="blower / drip torch"
              disabled={has("firebreak")}
              tone="critical"
              onClick={() =>
                start({
                  kind: "firebreak",
                  label: "Cut firebreak",
                  requiredEquipment: ["leaf_blower"],
                })
              }
            />
          </div>
        </Section>
      )}

      {isFire && visibleHazards.length > 0 && (
        <Section title="Hazard mitigation">
          {visibleHazards.map((h) => {
            const already = tasks.some(
              (t) => t.kind === "mitigate_hazard" && t.state !== "aborted" && t.hazardId === h.id,
            );
            return (
              <div key={h.id} className="rounded-sm border border-(--color-border-subtle) p-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-muted)">
                  {h.id} · {h.label}
                </div>
                <div className="mt-1 grid grid-cols-1 gap-1">
                  {mitigationOptionsFor(h.kind).map((opt) => (
                    <Chip
                      key={opt.method}
                      label={opt.method}
                      detail={fmtDur(opt.durationSec)}
                      disabled={already}
                      onClick={() =>
                        start({
                          kind: "mitigate_hazard",
                          label: `${h.label} · ${opt.method}`,
                          hazardId: h.id,
                          mitigationMethod: opt.method,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </Section>
      )}

      {isPolice && (
        <Section title="Police actions">
          <div className="grid grid-cols-1 gap-1.5">
            <BigBtn
              label={has("cordon") ? "✓ Cordon set" : "Establish cordon · 180s"}
              detail="inner / outer cordon tape + cones"
              disabled={has("cordon")}
              tone="amber"
              onClick={() => start({ kind: "cordon", label: "Cordon" })}
            />
            {(CAPABILITIES_BY_TYPE[appliance.type] ?? []).includes("Police_Roads") &&
              (
                [
                  {
                    kind: "close_carriageway" as const,
                    verb: "Close carriageway",
                    done: "Carriageway closed",
                    detail: "cone off one carriageway · 120s",
                  },
                  {
                    kind: "close_road" as const,
                    verb: "Close road",
                    done: "Road closed",
                    detail: "full closure + diversion signage · 180s",
                  },
                ]
              ).map((c) => {
                const existing = tasks.find(
                  (t) =>
                    t.applianceId === appliance.id &&
                    t.kind === c.kind &&
                    t.state !== "aborted",
                );
                if (existing?.state === "completed") {
                  return (
                    <div key={c.kind} className="grid grid-cols-[1fr_auto] gap-1.5">
                      <BigBtn
                        label={`✓ ${c.done}`}
                        detail="closure in force"
                        disabled
                        tone="amber"
                        onClick={() => {}}
                      />
                      <button
                        type="button"
                        onClick={() => onAbortTask(existing.id)}
                        className="rounded-sm border border-(--color-border) px-3 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:border-(--color-ok) hover:text-(--color-ok)"
                        title="Lift the closure and recover the cones"
                      >
                        Reopen
                      </button>
                    </div>
                  );
                }
                if (existing) {
                  return (
                    <BigBtn
                      key={c.kind}
                      label="Cones going out…"
                      detail={c.verb.toLowerCase()}
                      disabled
                      tone="muted"
                      onClick={() => {}}
                    />
                  );
                }
                return (
                  <BigBtn
                    key={c.kind}
                    label={c.verb}
                    detail={`${c.detail} · then click the road`}
                    tone="amber"
                    onClick={() => start({ kind: c.kind, label: c.verb })}
                  />
                );
              })}
            <BigBtn
              label={
                ownActive.some((t) => t.kind === "traffic_mgmt")
                  ? "✓ Traffic management"
                  : "Traffic management · ongoing"
              }
              detail="lane closure / direction"
              disabled={ownActive.some((t) => t.kind === "traffic_mgmt")}
              tone="muted"
              onClick={() => start({ kind: "traffic_mgmt", label: "Traffic management" })}
            />
            <BigBtn
              label={
                ownActive.some((t) => t.kind === "scene_preservation")
                  ? "✓ Scene preservation"
                  : "Scene preservation · ongoing"
              }
              detail="evidence / SIO-led"
              disabled={ownActive.some((t) => t.kind === "scene_preservation")}
              tone="muted"
              onClick={() => start({ kind: "scene_preservation", label: "Scene preservation" })}
            />
          </div>
        </Section>
      )}

      {isAmbulance && (
        <Section title="Ambulance actions">
          <div className="grid grid-cols-1 gap-1.5">
            <BigBtn
              label={has("triage_sieve") ? "✓ Triage sieve" : "Triage sieve · 240s"}
              detail="MCI primary triage sweep"
              disabled={has("triage_sieve")}
              tone="amber"
              onClick={() => start({ kind: "triage_sieve", label: "Triage sieve" })}
            />
          </div>
        </Section>
      )}

      {kitAvailable.length > 0 && (
        <Section title="Grab kit">
          <div className="grid grid-cols-2 gap-1.5">
            {kitAvailable.map((k) => {
              const already = tasks.some(
                (t) =>
                  t.kind === "kit_grab" &&
                  t.state !== "aborted" &&
                  t.applianceId === appliance.id &&
                  t.kitKind === k.kind,
              );
              return (
                <Chip
                  key={k.kind}
                  label={already ? `✓ ${k.label}` : k.label}
                  detail="30s"
                  disabled={already}
                  onClick={() => start({ kind: "kit_grab", label: `Grab ${k.label}`, kitKind: k.kind })}
                />
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline crew picker shared by Water + Actions tabs
// ---------------------------------------------------------------------------

export function CrewPickerInline({
  appliance,
  deployment,
  minCrew,
  requiredEquipment,
  pickedCrew,
  busyCrewIds,
  crewAir,
  baOnly,
  title,
  onTogglePick,
  onCancel,
  onConfirm,
}: {
  appliance: Appliance;
  deployment: Deployment;
  minCrew: number;
  requiredEquipment?: CrewEquipment[];
  pickedCrew: string[];
  busyCrewIds: Set<string>;
  crewAir?: Record<string, number>;
  baOnly?: boolean;
  title: string;
  onTogglePick: (id: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const candidates = baOnly
    ? appliance.crewMembers.filter((c) => /Firefighter|Paramedic|HART/.test(c.role))
    : appliance.crewMembers;
  const equipMap = deployment.crewEquipment ?? {};
  const enough = pickedCrew.length >= minCrew;
  return (
    <div className="rounded-sm border border-(--color-amber)/40 bg-(--color-amber)/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
            Assign crew
          </div>
          <div className="mt-0.5 text-sm font-medium text-(--color-text)">{title}</div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-muted)">
            Need {minCrew}+ · selected {pickedCrew.length}
          </div>
          {requiredEquipment && requiredEquipment.length > 0 && (
            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-(--color-text-muted)">
              Equipment needed: {requiredEquipment.map(labelForEquipment).join(", ")}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!enough}
            className={
              "rounded-sm border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-40 " +
              (enough
                ? "border-(--color-ok) bg-(--color-ok)/15 text-(--color-ok) hover:bg-(--color-ok)/25"
                : "border-(--color-border) text-(--color-text-dim)")
            }
          >
            {enough ? "Confirm" : `Need ${minCrew - pickedCrew.length}`}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm border border-(--color-border) px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:border-(--color-text) hover:text-(--color-text)"
          >
            Cancel
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {candidates.length === 0 && (
          <div className="col-span-2 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
            No suitable crew on this {appliance.service === "Fire" ? "appliance" : "vehicle"}.
          </div>
        )}
        {candidates.map((m) => {
          const equipped = equipMap[m.id] ?? [];
          const hasEquip =
            !requiredEquipment || requiredEquipment.every((e) => equipped.includes(e));
          const picked = pickedCrew.includes(m.id);
          const busy = busyCrewIds.has(m.id) && !picked;
          const air = crewAir?.[m.id];
          return (
            <CrewChip
              key={m.id}
              member={m}
              picked={picked}
              busy={busy}
              hasEquip={hasEquip}
              equipped={equipped}
              air={air}
              onToggle={() => !busy && hasEquip && onTogglePick(m.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tiny presentational components
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-sm border border-(--color-border-subtle) bg-(--color-surface-raised)/25">
      <div className="border-b border-(--color-border-subtle) bg-(--color-surface-raised) px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
        {title}
      </div>
      <div className="space-y-1.5 px-2.5 py-2.5">{children}</div>
    </section>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-baseline gap-2 text-xs">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-muted)">{k}</dt>
      <dd className="text-(--color-text)">{v}</dd>
    </div>
  );
}

function Gauge({
  label,
  pct,
  colour,
}: {
  label: string;
  pct: number;
  colour: "amber" | "info" | "ok" | "critical";
}) {
  const v = Math.max(0, Math.min(100, pct));
  const cls =
    colour === "amber"
      ? "bg-(--color-amber)"
      : colour === "info"
        ? "bg-(--color-info)"
        : colour === "critical"
          ? "bg-(--color-critical)"
          : "bg-(--color-ok)";
  return (
    <div>
      <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-(--color-text-muted)">
        <span>{label}</span>
        <span className="tabular-nums text-(--color-text)">{Math.round(v)}%</span>
      </div>
      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-sm border border-(--color-border-subtle) bg-(--color-bg)">
        <div className={`h-full ${cls}`} style={{ width: `${v}%`, transition: "width 500ms ease-out" }} />
      </div>
    </div>
  );
}

/** True when this appliance has an active BA SAR task of the given mode.
 *  Used by the Actions tab to show distinct Search / Firefighting chips
 *  and stop the operator committing a second identical team. */
function hasActiveBaMode(tasks: Task[], mode: "search" | "firefighting"): boolean {
  return tasks.some(
    (t) => t.kind === "ba_sar" && t.state === "active" && (t.baMode ?? "search") === mode,
  );
}

function PumpOperatorRow({
  appliance,
  deployment,
  onSetPumpOperator,
}: {
  appliance: Appliance;
  deployment: Deployment;
  onSetPumpOperator: (applianceId: string, crewId: string | null) => void;
}) {
  // Only Driver / Pump Op. roles can operate the pump panel.
  const candidates = appliance.crewMembers.filter((c) =>
    /Driver|Pump Op/i.test(c.role),
  );
  const current = deployment.pumpOperatorCrewId
    ? appliance.crewMembers.find((c) => c.id === deployment.pumpOperatorCrewId)
    : null;
  if (candidates.length === 0) {
    return (
      <div className="rounded-sm border border-(--color-critical)/40 bg-(--color-critical)/5 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-(--color-critical)">
        No qualified pump operator on this appliance
      </div>
    );
  }
  return (
    <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface-raised) px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
          Pump operator
        </span>
        {current ? (
          <button
            type="button"
            onClick={() => onSetPumpOperator(appliance.id, null)}
            className="rounded-sm border border-(--color-ok)/50 bg-(--color-ok)/10 px-1.5 py-0 font-mono text-[10px] uppercase tracking-widest text-(--color-ok) hover:bg-(--color-ok)/20"
            title="Release pump operator (pump will auto-stop)"
          >
            ✓ {current.name} ✕
          </button>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-critical)">
            Not assigned
          </span>
        )}
      </div>
      {!current && (
        <div className="mt-1 grid grid-cols-1 gap-1">
          {candidates.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSetPumpOperator(appliance.id, m.id)}
              className="rounded-sm border border-(--color-amber)/40 bg-(--color-amber)/5 px-2 py-1 text-left font-mono text-[10px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/15"
            >
              Assign {m.name} · {m.role}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BigBtn({
  label,
  detail,
  disabled,
  onClick,
  tone = "amber",
  title,
}: {
  label: string;
  detail?: string;
  disabled?: boolean;
  onClick: () => void;
  tone?: "amber" | "ok" | "critical" | "muted";
  title?: string;
}) {
  const cls = disabled
    ? "border-(--color-border) bg-(--color-surface) text-(--color-text-dim)"
    : tone === "ok"
      ? "border-(--color-ok)/60 bg-(--color-ok)/15 text-(--color-ok) hover:bg-(--color-ok)/25"
      : tone === "critical"
        ? "border-(--color-critical)/60 bg-(--color-critical)/15 text-(--color-critical) hover:bg-(--color-critical)/25"
        : tone === "muted"
          ? "border-(--color-border) text-(--color-text) hover:border-(--color-amber-dim)"
          : "border-(--color-amber)/50 bg-(--color-amber)/10 text-(--color-amber) hover:bg-(--color-amber)/20";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={
        "flex items-center justify-between gap-3 rounded-sm border px-3 py-2 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 " +
        cls
      }
    >
      <span>{label}</span>
      {detail && (
        <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-muted)">
          {detail}
        </span>
      )}
    </button>
  );
}

function ConnectionRow({
  title,
  subtitle,
  tone = "default",
  onDisconnect,
}: {
  title: string;
  subtitle: string;
  tone?: "default" | "critical";
  onDisconnect: () => void;
}) {
  const border =
    tone === "critical" ? "border-(--color-critical)/40" : "border-(--color-info)/40";
  const titleColour = tone === "critical" ? "text-(--color-critical)" : "text-(--color-info)";
  return (
    <li className={`flex items-center justify-between gap-2 rounded-sm border ${border} bg-(--color-surface-raised) px-2 py-1.5`}>
      <div className="min-w-0">
        <div className={`font-mono text-[11px] font-semibold uppercase tracking-widest ${titleColour}`}>
          {title}
        </div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-muted)">
          {subtitle}
        </div>
      </div>
      <button
        type="button"
        onClick={onDisconnect}
        className="shrink-0 rounded-sm border border-(--color-critical)/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-critical) hover:bg-(--color-critical)/10"
      >
        Disconnect
      </button>
    </li>
  );
}

function Chip({
  label,
  detail,
  disabled,
  onClick,
}: {
  label: string;
  detail?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "rounded-sm border px-2 py-1 text-left font-mono text-[10px] uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-40 " +
        (disabled
          ? "border-(--color-border) text-(--color-text-dim)"
          : "border-(--color-amber)/50 bg-(--color-amber)/10 text-(--color-amber) hover:bg-(--color-amber)/20")
      }
    >
      {label}
      {detail && <span className="ml-1 text-(--color-text-muted)">· {detail}</span>}
    </button>
  );
}

function CrewChip({
  member,
  picked,
  busy,
  hasEquip,
  equipped,
  air,
  onToggle,
}: {
  member: CrewMember;
  picked: boolean;
  busy: boolean;
  hasEquip: boolean;
  equipped: string[];
  air?: number;
  onToggle: () => void;
}) {
  const blocked = busy || !hasEquip;
  const showAir = air !== undefined;
  const airPct = air ?? 100;
  const airColour =
    airPct < 30 ? "text-(--color-critical)" : airPct < 50 ? "text-(--color-amber)" : "text-(--color-ok)";
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={blocked}
      title={`${member.name} · ${member.role}${equipped.length > 0 ? "\nEquipped: " + equipped.map(labelForEquipment).join(", ") : ""}`}
      className={
        "flex flex-col gap-0.5 rounded-sm border px-2 py-1.5 text-left transition-colors disabled:cursor-not-allowed " +
        (picked
          ? "border-(--color-amber) bg-(--color-amber)/15 text-(--color-amber)"
          : blocked
            ? "border-(--color-border) text-(--color-text-dim)"
            : "border-(--color-border) text-(--color-text) hover:border-(--color-amber-dim)")
      }
    >
      <div className="flex items-center justify-between gap-2 text-sm font-medium">
        <span className="truncate">{member.name}</span>
        {showAir ? (
          <span className={`font-mono text-[10px] ${airColour}`}>{Math.round(airPct)}%</span>
        ) : busy ? (
          <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-critical)">busy</span>
        ) : !hasEquip ? (
          <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">no kit</span>
        ) : null}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-muted)">
        {member.role}
      </div>
    </button>
  );
}

function taskShortLabel(k: TaskKind): string {
  switch (k) {
    case "survey":
      return "360 Survey";
    case "gain_entry":
      return "Gain Entry";
    case "connect_hydrant":
      return "Hydrant";
    case "relay_hose":
      return "Relay Hose";
    case "hose_attack":
      return "Hose Attack";
    case "ba_sar":
      return "BA SAR";
    case "commander":
      return "Commander";
    case "kit_grab":
      return "Kit Grab";
    case "mitigate_hazard":
      return "Hazard Mit.";
    case "deploy_stabilisers":
      return "Stabilisers";
    case "extend_platform":
      return "Platform up";
    case "aerial_rescue":
      return "Aerial rescue";
    case "aerial_monitor":
      return "Aerial monitor";
    case "rtc_extrication":
      return "RTC Extrication";
    case "rope_rescue":
      return "Rope Rescue";
    case "water_rescue":
      return "Water Rescue";
    case "wildfire_beating":
      return "Wildfire Beating";
    case "wildfire_knapsack":
      return "Knapsack";
    case "firebreak":
      return "Firebreak";
    case "cordon":
      return "Cordon";
    case "close_carriageway":
      return "C'way Closure";
    case "close_road":
      return "Road Closure";
    case "traffic_mgmt":
      return "Traffic Mgmt";
    case "scene_preservation":
      return "Scene Preserve";
    case "triage_sieve":
      return "Triage";
    case "extract_casualty":
      return "Extract";
    case "crs_action":
      return "CRS Action";
  }
}

function attackModeLabel(m: HoseAttackMode): string {
  switch (m) {
    case "exterior_cooling":
      return "Exterior cooling";
    case "exterior_attack":
      return "Exterior attack";
    case "interior_attack":
      return "Interior attack";
  }
}

function fmtDur(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec === 0 ? `${m}m` : `${m}m ${sec}s`;
}

function fmtMs(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}
