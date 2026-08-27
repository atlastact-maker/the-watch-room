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
import type { Appliance, CrewMember, ServiceCode } from "@/lib/sim/types";
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
import {
  APPLIANCE_SINGLETONS,
  HAND_BUDGET,
  applyLoadout,
  canCarry,
  carryClass,
  handsUsed,
  teamCovers,
} from "@/lib/sim/crew_carry";
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
  hretTurret?: boolean;
  /** For ba_sar: tells the sim whether this BA team is inside to search
   *  for casualties or to firefight. Affects what red-flag credit the
   *  run earns and what tasks the committed crew can do next. */
  baMode?: "search" | "firefighting";
  /** For extract_casualty: id of the casualty being moved from fire
   *  zone to safe ground / treatment area. */
  casualtyId?: string;
  /** For gain_entry: the forcible-entry tool being used. */
  entryTool?: EntryTool;
  /** Kit the team must bring between them. */
  requiredEquipment?: CrewEquipment[];
  /** Kit every assigned rider needs personally (a breathing set). */
  requiredEquipmentAll?: CrewEquipment[];
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
  hretTurret?: boolean;
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
  onSetCrewLoadout,
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
  /** Atomic whole-loadout write for riding-position presets. */
  onSetCrewLoadout?: (applianceId: string, crewId: string, items: string[]) => void;
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
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-[13px] leading-tight font-medium text-(--color-text)">
                {appliance.typeName}
              </span>
              {appliance.capabilities?.map((c) => (
                <span
                  key={c}
                  title={
                    c === "UHPL"
                      ? "Ultra High Pressure Lance — cold-cut external attack"
                      : "High Reach Extendable Turret — piercing boom monitor"
                  }
                  className="shrink-0 rounded-sm border border-(--color-info)/60 bg-(--color-info)/10 px-1 py-px font-mono text-[8px] uppercase tracking-widest text-(--color-info)"
                >
                  {c}
                </span>
              ))}
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
            />
          )}
          {tab === "crew" && (
            <CrewTab
              appliance={appliance}
              deployment={deployment}
              busyCrewIds={busyCrewIds}
              crewAir={crewAir}
              onToggleCrewEquipment={onToggleCrewEquipment}
              onSetCrewLoadout={onSetCrewLoadout}
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


function VehicleTab({
  appliance,
  deployment,
  tasks,
  vehicleGauges,
  fatiguePct,
  onSetLightState,
}: {
  appliance: Appliance;
  deployment: Deployment;
  tasks: Task[];
  vehicleGauges: Record<string, { fuelPct: number; waterPct: number; conditionPct: number }>;
  fatiguePct?: number;
  onSetLightState: (applianceId: string, state: LightState) => void;
}) {
  const gauges = vehicleGauges[appliance.id] ?? {
    fuelPct: appliance.fuelPct,
    waterPct: appliance.waterPct,
    conditionPct: appliance.conditionPct,
  };
  return (
    <div className="space-y-4">
      {/* Gauges in one block so the tab fits without scrolling. */}
      <Section title="Status">
        <Gauge label="Fuel" pct={gauges.fuelPct} colour="amber" />
        {appliance.waterLitres > 0 && (
          <Gauge
            label={`Water · ${appliance.waterLitres.toLocaleString()} L`}
            pct={gauges.waterPct}
            colour="info"
          />
        )}
        <Gauge label="Condition" pct={gauges.conditionPct} colour="ok" />
        <Gauge
          label={`Crew fatigue${fatiguePct && fatiguePct > 70 ? " · consider welfare" : ""}`}
          pct={100 - (fatiguePct ?? 0)}
          colour={fatiguePct && fatiguePct > 70 ? "critical" : fatiguePct && fatiguePct > 50 ? "amber" : "ok"}
        />
      </Section>

      {appliance.note && (
        <Section title="Vehicle notes">
          <KV k="Note" v={appliance.note} />
        </Section>
      )}
    </div>
  );
}

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


// ---------------------------------------------------------------------------
// Crew tab — riding-position loadouts.
//
// Left: the full roster, always visible, each rider showing their kit as
// short badges so gaps ("nobody has the TIC") jump out. Right: the
// selected rider's loadout — one-tap riding-position presets on top,
// fine-grain item toggles below. "Standard loadout" kits the whole crew
// by role in one tap. Scarce one-per-appliance items (the fast-attack
// reel) name their current holder instead of silently jumping.
// ---------------------------------------------------------------------------

const EQUIP_SHORT: Partial<Record<CrewEquipment, string>> = {
  ba_set: "BA",
  radio: "RDO",
  thermal_camera: "TIC",
  branch_45mm: "45MM",
  branch_70mm: "70MM",
  fast_attack_branch: "REEL",
  red_key: "KEY",
  standpipe: "PIPE",
  hydraulic_cutters: "CUT",
  hydraulic_spreaders: "SPRD",
  glass_mgmt: "GLAS",
  stabiliser_chocks: "CHKS",
  spine_board: "SPIN",
  first_aid: "F/A",
  aed: "AED",
  trauma: "TRMA",
  hali_tool: "HALI",
  extinguisher: "EXT",
  small_tools: "TOOL",
  foam_branch: "FOAM",
};

function shortEquipLabel(k: CrewEquipment): string {
  return EQUIP_SHORT[k] ?? k.slice(0, 4).toUpperCase();
}

type LoadoutPreset = {
  key: string;
  label: string;
  items: CrewEquipment[];
  services: ServiceCode[];
  /** The item that defines this position. The preset is offered when the
   *  appliance carries THIS; anything else in the list is a nice-to-have
   *  and is simply skipped if it isn't aboard. Without it, a pump that
   *  carries glass management but no recip saw would be offered no glass
   *  position at all. Omit for radio-only positions. */
  requires?: CrewEquipment;
};

const LOADOUT_PRESETS: LoadoutPreset[] = [
  // Fire. Two hands each, and never two heavy tools on one rider — a
  // cutter and a spreader are ~20 kg apiece with a single central handle,
  // so a cutting crew is four riders, not one.
  { key: "officer", label: "Officer / IC", items: ["radio"], services: ["Fire"] },
  { key: "pump_op", label: "Pump Operator", items: ["red_key", "standpipe", "radio"], services: ["Fire"], requires: "red_key" },
  { key: "ba_branch", label: "BA · Branch", items: ["ba_set", "branch_45mm", "radio"], services: ["Fire"], requires: "ba_set" },
  { key: "ba_tic", label: "BA · TIC", items: ["ba_set", "thermal_camera", "radio"], services: ["Fire"], requires: "thermal_camera" },
  { key: "moe", label: "Entry / MOE", items: ["hali_tool", "lock_snapper", "radio"], services: ["Fire"], requires: "hali_tool" },
  { key: "rtc_stab", label: "RTC 1 · Stabilisation", items: ["stabiliser_chocks", "radio"], services: ["Fire"], requires: "stabiliser_chocks" },
  { key: "rtc_glass", label: "RTC 2 · Glass & saw", items: ["glass_mgmt", "reciprocating_saw", "small_tools", "radio"], services: ["Fire"], requires: "glass_mgmt" },
  { key: "rtc_cut", label: "RTC 3 · Cutters", items: ["hydraulic_cutters", "radio"], services: ["Fire"], requires: "hydraulic_cutters" },
  { key: "rtc_spread", label: "RTC 4 · Spreaders", items: ["hydraulic_spreaders", "radio"], services: ["Fire"], requires: "hydraulic_spreaders" },
  { key: "wf_beat", label: "Wildfire · Beater", items: ["knapsack_sprayer", "beater", "radio"], services: ["Fire"], requires: "beater" },
  { key: "wf_blow", label: "Wildfire · Blower", items: ["leaf_blower", "radio"], services: ["Fire"], requires: "leaf_blower" },
  { key: "rope_rig", label: "Rope · Rigger", items: ["rescue_harness", "rope_kit", "pulleys_prusiks", "radio"], services: ["Fire"], requires: "rope_kit" },
  { key: "rope_cas", label: "Rope · Casualty", items: ["rescue_harness", "sked_stretcher", "radio"], services: ["Fire"], requires: "sked_stretcher" },
  { key: "water_wade", label: "Water · Wader", items: ["dry_suit", "pfd", "wading_pole", "throw_line", "radio"], services: ["Fire"], requires: "wading_pole" },
  { key: "water_bank", label: "Water · Bank safety", items: ["pfd", "throw_line", "radio"], services: ["Fire"], requires: "throw_line" },
  // Ambulance
  { key: "attendant", label: "Attendant", items: ["first_aid", "aed", "radio"], services: ["Ambulance"], requires: "first_aid" },
  { key: "critical", label: "Critical Care", items: ["trauma", "first_aid", "radio"], services: ["Ambulance"], requires: "trauma" },
  { key: "packaging", label: "Packaging", items: ["spine_board", "radio"], services: ["Ambulance"], requires: "spine_board" },
  { key: "amb_standby", label: "Standby", items: ["radio"], services: ["Ambulance"] },
  // Police — hands stay free, which is the point.
  { key: "patrol", label: "Patrol", items: ["radio"], services: ["Police"] },
  { key: "roads", label: "Roads Policing", items: ["first_aid", "radio"], services: ["Police"], requires: "first_aid" },
];

/** Preset for a rider's role. `seen` counts how many of each role have
 *  already been assigned, so the four RTC positions go to four different
 *  riders rather than everyone grabbing the cutters. */
function presetKeyForRole(
  role: string,
  service: ServiceCode,
  nth: number,
): string {
  if (service === "Ambulance") {
    if (/Doctor|Critical Care/i.test(role)) return "critical";
    return nth === 0 ? "attendant" : "packaging";
  }
  if (service === "Police") {
    return /Roads Policing/i.test(role) ? "roads" : "patrol";
  }
  if (/Manager|Officer/i.test(role)) return "officer";
  if (/Driver|Pump Op/i.test(role)) return "pump_op";
  if (/Technical Rescue|USAR/i.test(role)) {
    return ["rtc_stab", "rtc_cut", "rtc_spread", "rtc_glass"][nth % 4];
  }
  if (/Wildfire/i.test(role)) return ["wf_beat", "wf_blow"][nth % 2];
  return ["ba_branch", "ba_tic"][nth % 2];
}

export function CrewTab({
  appliance,
  deployment,
  busyCrewIds,
  crewAir,
  onToggleCrewEquipment,
  onSetCrewLoadout,
}: {
  appliance: Appliance;
  deployment: Deployment;
  busyCrewIds: Set<string>;
  crewAir: Record<string, number>;
  onToggleCrewEquipment: (applianceId: string, crewId: string, item: string) => void;
  /** Atomic whole-loadout write — presets use this so they can never
   *  half-apply the way a sequence of toggles can. */
  onSetCrewLoadout?: (applianceId: string, crewId: string, items: string[]) => void;
}) {
  const [selId, setSelId] = useState<string | null>(
    appliance.crewMembers[0]?.id ?? null,
  );
  const caps = CAPABILITIES_BY_TYPE[appliance.type] ?? [];
  const baAllowed = caps.includes("BA");
  const equipMap = deployment.crewEquipment ?? {};

  const itemAvailable = (key: CrewEquipment) =>
    applianceHasEquipment(appliance, key) &&
    (key !== "ba_set" || baAllowed);

  const presets = LOADOUT_PRESETS.filter(
    (p) =>
      p.services.includes(appliance.service) &&
      // Offered when the appliance carries the position's defining item.
      // Extras it doesn't carry are dropped on apply, so a pump with
      // glass management but no recip saw still gets a glass position.
      (p.requires ? itemAvailable(p.requires) : true),
  );

  /** Rig a rider AS a position: their loadout becomes exactly the
   *  preset's available items. */
  function applyPreset(crewId: string, preset: LoadoutPreset) {
    const target = preset.items.filter(itemAvailable);
    if (onSetCrewLoadout) {
      onSetCrewLoadout(appliance.id, crewId, target);
      return;
    }
    // Fallback for surfaces without the atomic setter: clear first so the
    // hand budget is free before the new kit goes on.
    const current = equipMap[crewId] ?? [];
    for (const item of current) {
      if (!target.includes(item as CrewEquipment)) {
        onToggleCrewEquipment(appliance.id, crewId, item);
      }
    }
    for (const item of target) {
      if (!current.includes(item)) {
        onToggleCrewEquipment(appliance.id, crewId, item);
      }
    }
  }

  /** Kit the whole crew by role in one tap. Busy riders keep what they
   *  are holding. */
  function standardLoadout() {
    // Count each role as we go so the RTC positions (stabilisation,
    // cutters, spreaders, glass) land on four different riders.
    const seen: Record<string, number> = {};
    for (const m of appliance.crewMembers) {
      if (busyCrewIds.has(m.id)) continue;
      const bucket = m.role.replace(/[^A-Za-z]/g, "");
      const nth = seen[bucket] ?? 0;
      seen[bucket] = nth + 1;
      const key = presetKeyForRole(m.role, appliance.service, nth);
      const preset =
        LOADOUT_PRESETS.find((p) => p.key === key) ??
        LOADOUT_PRESETS.find((p) => p.key === "officer");
      if (!preset) continue;
      // If the appliance can't equip this position at all, the rider
      // still steps off with a radio rather than being skipped.
      if (preset.requires && !itemAvailable(preset.requires)) {
        applyPreset(m.id, { ...preset, items: ["radio"] });
        continue;
      }
      applyPreset(m.id, preset);
    }
    // A rescue pump carries three Technical Rescue riders but an
    // extrication needs four positions covered, so glass management
    // would never be issued. Hand it to the first rider with a spare
    // hand — in practice the officer.
    if (itemAvailable("glass_mgmt")) {
      const carriers = appliance.crewMembers.filter((m) =>
        (equipMap[m.id] ?? []).includes("glass_mgmt"),
      );
      if (carriers.length === 0) {
        const spare = appliance.crewMembers.find(
          (m) =>
            !busyCrewIds.has(m.id) &&
            canCarry(equipMap[m.id] ?? [], "glass_mgmt").ok,
        );
        if (spare) {
          onToggleCrewEquipment(appliance.id, spare.id, "glass_mgmt");
        }
      }
    }
  }

  const sel = appliance.crewMembers.find((m) => m.id === selId) ?? null;
  const selEquipped = sel ? (equipMap[sel.id] ?? []) : [];

  /** Current holder of a one-per-appliance item, if anyone. */
  function holderOf(item: CrewEquipment): (typeof appliance.crewMembers)[number] | null {
    if (!APPLIANCE_SINGLETONS.has(item)) return null;
    for (const m of appliance.crewMembers) {
      if ((equipMap[m.id] ?? []).includes(item)) return m;
    }
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Whole-crew action */}
      <div className="flex items-center justify-between gap-2 rounded-sm border border-(--color-amber)/40 bg-(--color-amber)/5 px-2.5 py-1.5">
        <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
          Kit the crew by riding position — busy riders keep their gear
        </span>
        <button
          type="button"
          onClick={standardLoadout}
          className="shrink-0 rounded-sm border border-(--color-amber) bg-(--color-amber)/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/25"
        >
          Standard loadout
        </button>
      </div>

      <div className="grid grid-cols-[180px_1fr] gap-2">
        {/* Roster — always visible, badges show each rider's kit */}
        <ul className="space-y-1">
          {appliance.crewMembers.map((m) => {
            const equipped = equipMap[m.id] ?? [];
            const busy = busyCrewIds.has(m.id);
            const air = crewAir[m.id];
            const selected = m.id === selId;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelId(m.id)}
                  className={
                    "w-full rounded-sm border px-2 py-1.5 text-left transition-colors " +
                    (selected
                      ? "border-(--color-amber) bg-(--color-amber)/10"
                      : busy
                        ? "border-(--color-critical)/40 bg-(--color-surface-raised)/40 hover:border-(--color-critical)"
                        : "border-(--color-border-subtle) bg-(--color-surface-raised)/40 hover:border-(--color-amber-dim)")
                  }
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-[12px] font-medium text-(--color-text)">
                      {m.name}
                    </span>
                    {busy && (
                      <span className="shrink-0 font-mono text-[8px] font-bold uppercase text-(--color-critical)">
                        busy
                      </span>
                    )}
                    {air !== undefined && !busy && (
                      <span className="shrink-0 font-mono text-[8px] text-(--color-text-dim)">
                        BA {Math.round(air)}%
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[8.5px] uppercase tracking-widest text-(--color-text-muted)">
                    {m.role}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {equipped.length === 0 ? (
                      <span className="font-mono text-[8px] uppercase tracking-widest text-(--color-text-dim)">
                        — no kit
                      </span>
                    ) : (
                      <>
                        {equipped.slice(0, 4).map((e) => (
                          <span
                            key={e}
                            className="rounded-[2px] border border-(--color-amber)/50 bg-(--color-amber)/10 px-1 font-mono text-[8px] font-bold text-(--color-amber)"
                          >
                            {shortEquipLabel(e as CrewEquipment)}
                          </span>
                        ))}
                        {equipped.length > 4 && (
                          <span className="font-mono text-[8px] text-(--color-text-dim)">
                            +{equipped.length - 4}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Loadout editor for the selected rider */}
        {sel ? (
          <div className="min-w-0 rounded-sm border border-(--color-border-subtle) bg-(--color-surface-raised)/25 p-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-semibold text-(--color-text)">
                {sel.name}
              </span>
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                {selEquipped.length} item{selEquipped.length === 1 ? "" : "s"} ·{" "}
                <span
                  className={
                    handsUsed(selEquipped) >= HAND_BUDGET
                      ? "text-(--color-amber)"
                      : "text-(--color-text-dim)"
                  }
                >
                  {handsUsed(selEquipped)}/{HAND_BUDGET} hands
                </span>
              </span>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-muted)">
              {sel.role}
            </div>

            {presets.length > 0 && (
              <div className="mt-2">
                <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-amber)">
                  Rig as
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {presets.map((p) => {
                    // What this appliance can actually issue for the
                    // position — extras it doesn't carry never count.
                    const target = applyLoadout(p.items.filter(itemAvailable)).items;
                    const matches =
                      target.length > 0 &&
                      target.every((it) => selEquipped.includes(it)) &&
                      selEquipped.length === target.length;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        disabled={busyCrewIds.has(sel.id)}
                        title={
                          busyCrewIds.has(sel.id)
                            ? "Crew member is working — stand them down first"
                            : undefined
                        }
                        onClick={() => applyPreset(sel.id, p)}
                        className={
                          "rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors " +
                          (matches
                            ? "border-(--color-ok) bg-(--color-ok)/10 text-(--color-ok)"
                            : "border-(--color-border) text-(--color-text) hover:border-(--color-amber-dim) hover:text-(--color-amber)")
                        }
                      >
                        {matches ? "✓ " : ""}
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-2 space-y-2 border-t border-(--color-border-subtle) pt-2">
              {EQUIPMENT_GROUPS.map((group) => {
                const items = group.items.filter(
                  (eq) =>
                    (!eq.baOnly || baAllowed) &&
                    applianceHasEquipment(appliance, eq.key),
                );
                if (items.length === 0) return null;
                const equippedCount = items.filter((eq) =>
                  selEquipped.includes(eq.key),
                ).length;
                return (
                  <div key={group.title}>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-amber)">
                      {group.title}
                      {equippedCount > 0 && (
                        <span className="text-(--color-text-dim)"> · {equippedCount}</span>
                      )}
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-1">
                      {items.map((eq) => {
                        const on = selEquipped.includes(eq.key);
                        const holder = holderOf(eq.key);
                        const heldElsewhere = !!holder && holder.id !== sel.id;
                        // A rider working a task keeps what they are
                        // holding — you cannot strip the cutters off the
                        // firefighter running the extrication.
                        const locked = busyCrewIds.has(sel.id);
                        const fit = canCarry(selEquipped, eq.key);
                        const tooHeavy = !on && !fit.ok;
                        const cls = carryClass(eq.key);
                        return (
                          <button
                            key={eq.key}
                            type="button"
                            disabled={locked || tooHeavy}
                            onClick={() =>
                              onToggleCrewEquipment(appliance.id, sel.id, eq.key)
                            }
                            title={
                              locked
                                ? "Crew member is working — stand them down first"
                                : tooHeavy
                                  ? (fit as { reason: string }).reason
                                  : heldElsewhere
                                    ? `One aboard — taking it off ${holder!.name}`
                                    : undefined
                            }
                            className={
                              "rounded-sm border px-2 py-1 text-left font-mono text-[10px] uppercase tracking-widest transition-colors disabled:cursor-not-allowed " +
                              (on
                                ? "border-(--color-amber) bg-(--color-amber)/15 text-(--color-amber)"
                                : tooHeavy || locked
                                  ? "border-(--color-border-subtle) text-(--color-text-dim) opacity-50"
                                  : heldElsewhere
                                    ? "border-(--color-border) text-(--color-text-dim)"
                                    : "border-(--color-border) text-(--color-text) hover:border-(--color-amber-dim)")
                            }
                          >
                            {on ? "✓ " : ""}
                            {eq.label}
                            {cls === "two_hands" && (
                              <span className="ml-1 text-(--color-text-dim)">··</span>
                            )}
                            {cls === "one_hand" && (
                              <span className="ml-1 text-(--color-text-dim)">·</span>
                            )}
                            {heldElsewhere && (
                              <span className="block font-mono text-[8px] normal-case tracking-normal text-(--color-text-dim)">
                                with {holder!.name}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-(--color-text-dim)">No crew aboard.</p>
        )}
      </div>
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
      // Aerials work a monitor from the cage — aerial_monitor requires a
      // 70 mm branch, so a TL or HLP must be able to hold one.
      return appliance.waterLitres > 0 || hasKit(/Hose|Boom monitor/i) || cap("Aerial");
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
      // Ambulances carry a board or scoop as standard — packaging a
      // patient is their job, not the fire service's.
      return (
        hasKit(/Spine board|Heavy rescue|Trolley/i) ||
        cap("RTC_extrication") ||
        cap("Medical")
      );
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
  hretTurret?: boolean;
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
      hretTurret: args.hretTurret,
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
              const effUhpl = knownMaterial
                ? ATTACK_EFFECTIVENESS[knownMaterial].uhpl_lance
                : 1;
              const hasUhpl =
                appliance.capabilities?.includes("UHPL") ||
                appliance.capabilities?.includes("HRET");
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
              const ub = badge(effUhpl);

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
                    {hasUhpl && (
                      <BigBtn
                        label={
                          appliance.capabilities?.includes("HRET")
                            ? "HRET lance · pierce and cut from the turret"
                            : "UHPL lance · pierce and cut from outside"
                        }
                        detail={ub?.text}
                        disabled={hasHoseAttack || !canAttack}
                        tone={ub?.tone === "text-(--color-critical)" ? "critical" : "amber"}
                        onClick={() =>
                          setPendingHoseAttack({ mode: "uhpl_lance", hoseType: "45mm" })
                        }
                      />
                    )}
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
            pendingHoseAttack.mode === "uhpl_lance"
              ? [] // the lance is vehicle-mounted, not a carried branch
              : [pendingHoseAttack.hoseType === "70mm" ? "branch_70mm" : "branch_45mm"]
          }
          requiredEquipmentAll={
            pendingHoseAttack.mode === "interior_attack" ? ["ba_set"] : undefined
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
              hretTurret:
                pendingHoseAttack.mode === "uhpl_lance" &&
                appliance.capabilities?.includes("HRET"),
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
    // A staged pre-select seeds the BA picker — the operator can still
    // untick and swap wearers before confirming.
    setPickedCrew(
      p.kind === "ba_sar" && deployment.baStagedAt !== undefined
        ? (deployment.preCommitBaCrewIds ?? []).filter((id) => !busyCrewIds.has(id))
        : [],
    );
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
        requiredEquipmentAll={pending.requiredEquipmentAll}
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

  // The staged pre-select bypasses the crew picker, so it has to carry
  // the same gate itself: enough wearers free, and every one of them
  // actually wearing a set.
  const stagedAvailable = (deployment.preCommitBaCrewIds ?? []).filter(
    (id) => !busyCrewIds.has(id),
  );
  const stagedEquip = deployment.crewEquipment ?? {};
  const stagedTeamReady =
    stagedAvailable.length >= TASK_MIN_CREW.ba_sar &&
    stagedAvailable.every((id) => (stagedEquip[id] ?? []).includes("ba_set"));

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
            {/* Staged pre-select — rigged on arrival, waiting on the
                operator's commit order. One click sends the staged team
                in to search; the normal buttons below re-pick crew.
                Gated on the same rules as any other BA commit: enough
                wearers, and every one of them actually wearing a set. */}
            {deployment.baStagedAt !== undefined &&
              (deployment.preCommitBaCrewIds?.length ?? 0) > 0 && (
                <div className="rounded-sm border border-(--color-ok)/50 bg-(--color-ok)/10 p-2">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-(--color-ok)">
                    <span className="dot-live size-1.5 rounded-full bg-(--color-ok)" />
                    BA team rigged &amp; staged · {deployment.preCommitBaCrewIds!.length} crew
                  </div>
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                    Pre-selected en route — sets on at the entry point,
                    awaiting your commit order.
                  </p>
                  <button
                    type="button"
                    disabled={!entryComplete || !stagedTeamReady}
                    onClick={() => {
                      if (!stagedTeamReady) return;
                      onStartTask({
                        applianceId: appliance.id,
                        kind: "ba_sar",
                        assignedCrewIds: stagedAvailable,
                        baMode: "search",
                      });
                    }}
                    className="mt-1.5 w-full rounded-sm border border-(--color-ok) bg-(--color-ok)/15 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-(--color-ok) hover:bg-(--color-ok)/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {!entryComplete
                      ? "Commit staged team (entry first)"
                      : stagedAvailable.length < TASK_MIN_CREW.ba_sar
                        ? `Need ${TASK_MIN_CREW.ba_sar} wearers free`
                        : !stagedTeamReady
                          ? "Staged team not all in BA"
                          : "Commit staged team · Search"}
                  </button>
                </div>
              )}
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
                  requiredEquipmentAll: ["ba_set"],
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
                  requiredEquipmentAll: ["ba_set"],
                  requiredEquipment: ["branch_45mm"],
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
                          requiredEquipmentAll: ["ba_set"],
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
                    // Seven hands of kit — one rider on the cutters, one
                    // on the spreaders, one on stabilisation, one on
                    // glass. The spine board comes with the ambulance.
                    requiredEquipment: [
                      "hydraulic_cutters",
                      "hydraulic_spreaders",
                      "stabiliser_chocks",
                      "glass_mgmt",
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
  requiredEquipmentAll,
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
  /** Kit the team must bring BETWEEN them — one rider carrying the
   *  cutters satisfies it. Nobody can carry a whole extrication set. */
  requiredEquipment?: CrewEquipment[];
  /** Kit every assigned rider must have personally (a breathing set). */
  requiredEquipmentAll?: CrewEquipment[];
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
  const nameOf = (id: string) =>
    appliance.crewMembers.find((m) => m.id === id)?.name ?? id;

  // A task's kit is satisfied by the TEAM as a set, not by each person.
  // This is what lets an extrication run: one rider on the cutters, one
  // on the spreaders, one on stabilisation.
  const cover = teamCovers(equipMap, pickedCrew, {
    all: requiredEquipmentAll,
    any: requiredEquipment,
  });
  const shortBy = Math.max(0, minCrew - pickedCrew.length);
  const reasons: string[] = [];
  if (shortBy > 0) reasons.push(`Need ${shortBy} more crew`);
  for (const it of cover.missingAny) {
    reasons.push(`Nobody carrying ${labelForEquipment(it)}`);
  }
  for (const [cid, items] of Object.entries(cover.missingAllBy)) {
    reasons.push(
      `${nameOf(cid)} has no ${items.map(labelForEquipment).join(" / ")}`,
    );
  }
  const enough = reasons.length === 0;
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
            <ul className="mt-1.5 space-y-0.5">
              {requiredEquipment.map((it) => {
                const holder = cover.coverage[it];
                return (
                  <li
                    key={it}
                    className={
                      "font-mono text-[10px] uppercase tracking-widest " +
                      (holder ? "text-(--color-ok)" : "text-(--color-critical)")
                    }
                  >
                    {holder ? "✓" : "✗"} {labelForEquipment(it)}
                    <span className="text-(--color-text-dim)">
                      {holder ? ` · ${nameOf(holder)}` : " · nobody carrying"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {requiredEquipmentAll && requiredEquipmentAll.length > 0 && (
            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-(--color-text-muted)">
              Every rider needs: {requiredEquipmentAll.map(labelForEquipment).join(", ")}
            </div>
          )}
          {!enough && reasons.length > 0 && (
            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
              {reasons[0]}
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
            {enough ? "Confirm" : shortBy > 0 ? `Need ${shortBy}` : "Kit short"}
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
          const picked = pickedCrew.includes(m.id);
          const busy = busyCrewIds.has(m.id) && !picked;
          const air = crewAir?.[m.id];
          // What this rider brings to the required kit, and any
          // per-person item they are missing.
          const brings = (requiredEquipment ?? []).filter((e) =>
            equipped.includes(e),
          );
          const missingAll = (requiredEquipmentAll ?? []).filter(
            (e) => !equipped.includes(e),
          );
          return (
            <CrewChip
              key={m.id}
              member={m}
              picked={picked}
              busy={busy}
              brings={brings}
              missingAll={missingAll}
              equipped={equipped}
              air={air}
              onToggle={() => !busy && onTogglePick(m.id)}
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

function Section({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  /** Title bar becomes a toggle; the body can be collapsed away. */
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const shown = !collapsible || open;
  const barCls =
    (shown ? "border-b border-(--color-border-subtle) " : "") +
    "bg-(--color-surface-raised) px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)";
  return (
    <section className="overflow-hidden rounded-sm border border-(--color-border-subtle) bg-(--color-surface-raised)/25">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={"flex w-full items-center justify-between text-left " + barCls}
        >
          <span>{title}</span>
          <span className="text-(--color-text-dim)">{open ? "▾" : "▸"}</span>
        </button>
      ) : (
        <div className={barCls}>{title}</div>
      )}
      {shown && <div className="space-y-1.5 px-2.5 py-2.5">{children}</div>}
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
  brings,
  missingAll,
  equipped,
  air,
  onToggle,
}: {
  member: CrewMember;
  picked: boolean;
  busy: boolean;
  /** Required kit this rider contributes to the team. */
  brings: CrewEquipment[];
  /** Per-person kit this rider is missing (a breathing set). */
  missingAll: CrewEquipment[];
  equipped: string[];
  air?: number;
  onToggle: () => void;
}) {
  // Only being busy blocks a pick now. A rider carrying nothing is still
  // a valid pair of hands — what gates the task is whether the TEAM has
  // the kit, which the picker header spells out.
  const blocked = busy;
  const short = missingAll.length > 0;
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
          ? short
            ? "border-(--color-critical) bg-(--color-critical)/10 text-(--color-critical)"
            : "border-(--color-amber) bg-(--color-amber)/15 text-(--color-amber)"
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
        ) : short ? (
          <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-critical)">
            no {labelForEquipment(missingAll[0]).toLowerCase()}
          </span>
        ) : null}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-muted)">
        {member.role}
      </div>
      {brings.length > 0 && (
        <div className="mt-0.5 flex flex-wrap gap-0.5">
          {brings.map((b) => (
            <span
              key={b}
              className="rounded-[2px] border border-(--color-ok)/60 bg-(--color-ok)/10 px-1 font-mono text-[8px] font-bold text-(--color-ok)"
            >
              {shortEquipLabel(b)}
            </span>
          ))}
        </div>
      )}
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
    case "uhpl_lance":
      return "UHPL lance";
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
