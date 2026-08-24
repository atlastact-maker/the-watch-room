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
  CasualtiesBody,
  CrewLine,
  ActiveTaskRow,
  resolveDeployments,
  type Props as IncidentViewProps,
  type ResolvedDeployment,
} from "./incident-view";
import { BaControlBoard } from "./ba-control-board";
import { BottomActionMenu } from "./bottom-action-menu";
import { DeploymentBoard, type Eta } from "./deployment-board";
import type { AreaCode } from "@/lib/sim/types";

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
  onAdministerDrug?: IncidentViewProps["onAdministerDrug"];
  onApplyPackaging?: IncidentViewProps["onApplyPackaging"];
  onRequestClinician?: IncidentViewProps["onRequestClinician"];
  hemsFlyable?: boolean;
  onSetTreatmentDestination?: IncidentViewProps["onSetTreatmentDestination"];
  onSendAtmistPrealert?: IncidentViewProps["onSendAtmistPrealert"];
  onConveyCasualtyVia?: IncidentViewProps["onConveyCasualtyVia"];
  onUpdateBaRemarks?: IncidentViewProps["onUpdateBaRemarks"];
  onUpdateBaEntryPoint?: IncidentViewProps["onUpdateBaEntryPoint"];
  onAbortTask?: IncidentViewProps["onAbortTask"];

  // Resourcing tab — committed crews + available fleet with mobilise.
  etas?: Record<string, Eta>;
  patch?: AreaCode | null;
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
  tacticalMode?: IncidentViewProps["tacticalMode"];
  fatigueByApplianceId?: IncidentViewProps["fatigueByApplianceId"];
  /** Start a road-closure placement (next ground-map click drops cones). */
  onBeginRoadClosure?: (applianceId: string, kind: "close_carriageway" | "close_road", crewIds: string[]) => void;
  onRequestRotate?: (applianceId: string) => void;
  /** Clicking a still-mobile callsign opens its pre-arrival panel. */
  onSelectInbound?: (applianceId: string) => void;
  /** Controlled unit-control selection — when provided, the dashboard owns
   *  which unit's control page fills the Resourcing pane (ground-map
   *  vehicle clicks land here). Omit for internal state (demo page). */
  unitId?: string | null;
  onSetUnitId?: (applianceId: string | null) => void;
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
      width: Math.max(640, Math.min(f.width, window.innerWidth)),
      height: Math.max(460, Math.min(f.height, window.innerHeight)),
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

// Light CAD palette (grey / red / yellow, matching the Overview tab) —
// re-skins the shared ops-room bodies by overriding their design tokens
// inside the tablet screen, so every tab reads as the same CAD app.
const CAD_VARS = {
  "--color-bg": "#f4f4f5",
  "--color-surface": "#ffffff",
  "--color-surface-raised": "#e7e7ea",
  "--color-border": "#a1a1aa",
  "--color-border-subtle": "#d4d4d8",
  "--color-text": "#18181b",
  "--color-text-dim": "#52525b",
  "--color-text-muted": "#71717a",
  "--color-amber": "#a16207",
  "--color-amber-dim": "#b45309",
  "--color-critical": "#dc2626",
  "--color-ok": "#15803d",
  "--color-info": "#1d4ed8",
} as React.CSSProperties;

type TabKey =
  | "overview"
  | "call"
  | "resourcing"
  | "property"
  | "view"
  | "pri"
  | "targets"
  | "hazards"
  | "casualties"
  | "ba"
  | "log"
  | "debrief";

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
  onAdministerDrug,
  onApplyPackaging,
  onRequestClinician,
  hemsFlyable,
  onSetTreatmentDestination,
  onSendAtmistPrealert,
  onConveyCasualtyVia,
  onUpdateBaRemarks,
  onUpdateBaEntryPoint,
  onAbortTask,
  onDeploy,
  onStandDownForWelfare,
  etas,
  patch,
  onStandDown,
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
  tacticalMode,
  fatigueByApplianceId,
  onBeginRoadClosure,
  onRequestRotate,
  onSelectInbound,
  unitId: unitIdProp,
  onSetUnitId,
}: Props) {
  const resolved = !!outcome;
  const [tab, setTab] = useState<TabKey>("overview");
  // Committed unit whose control page fills the Resourcing right pane.
  // Controlled by the dashboard when the props are supplied (ground-map
  // clicks open the tablet's unit page); internal state otherwise.
  const [internalUnitId, setInternalUnitId] = useState<string | null>(null);
  const unitId = unitIdProp !== undefined ? unitIdProp : internalUnitId;
  const setUnitId = onSetUnitId ?? setInternalUnitId;
  // An externally focused unit jumps the tablet to its control page.
  useEffect(() => {
    if (unitIdProp) setTab("resourcing");
  }, [unitIdProp]);
  // Tablet frame — restored from the last drag/resize so collapsing and
  // reopening the MDT keeps the operator's chosen size and position.
  const frame = useRef<MdtFrame>(
    loadMdtFrame() ?? { x: 24, y: 90, width: 880, height: 620 },
  );
  useEffect(() => {
    setTab(resolved ? "debrief" : "overview");
    setUnitId(null);
  }, [resolved, incident.id]);

  // Clocks for the sync bar: UTC wall clock + incident elapsed.
  const [clock, setClock] = useState("--:--:--");
  const [elapsed, setElapsed] = useState("00:00");
  useEffect(() => {
    const tick = () => {
      setClock(fmtTime(Date.now()));
      setElapsed(fmtHms(Math.max(0, (Date.now() - incident.receivedAt) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [incident.receivedAt]);

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
  // If BA ops wind down while the BA tab is open, fall back to Overview.
  if (tab === "ba" && totalBaTeams === 0) {
    setTab("overview");
  }

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

  const tabs: { key: TabKey; label: string }[] = resolved
    ? [
        { key: "debrief", label: "Debrief" },
        { key: "log", label: "Log" },
      ]
    : [
        { key: "overview", label: "Overview" },
        { key: "call", label: "Call" },
        {
          key: "resourcing",
          label: resolvedDeps.length > 0 ? `Resourcing·${resolvedDeps.length}` : "Resourcing",
        },
        { key: "property", label: "Property" },
        { key: "view", label: "Prop View" },
        { key: "pri", label: "PRI" },
        { key: "targets", label: "Targets" },
        ...(sim
          ? ([
              { key: "hazards", label: hazardCount > 0 ? `Hazards·${hazardCount}` : "Hazards" },
              {
                key: "casualties",
                label: locatedCount > 0 ? `Casualties·${locatedCount}` : "Casualties",
              },
            ] as { key: TabKey; label: string }[])
          : []),
        ...(totalBaTeams > 0
          ? ([{ key: "ba", label: `BA·${totalBaTeams}` }] as { key: TabKey; label: string }[])
          : []),
        { key: "log", label: "Log" },
      ];

  // Tabs that render the dark ops-theme scene bodies edge-to-edge.
  const darkTab =
    tab === "call" ||
    tab === "resourcing" ||
    tab === "hazards" ||
    tab === "casualties" ||
    tab === "ba";

  const alerts = [
    ...sc.property.knownHazards,
    ...sc.property.vulnerabilities,
  ];

  return (
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
      minWidth={640}
      minHeight={460}
      bounds="window"
      dragHandleClassName="drag-handle"
      // Sits above the fullscreen ground view (z-1200).
      className="z-[1250]"
    >
      {/* Rugged chassis */}
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[16px] border-[12px] border-[#26262b] bg-[#26262b] shadow-2xl shadow-black/70 ring-1 ring-[#3d3d45]">
        {/* Corner screws */}
        <Screw className="left-[-9px] top-[-9px]" />
        <Screw className="right-[-9px] top-[-9px]" />
        <Screw className="bottom-[-9px] left-[-9px]" />
        <Screw className="bottom-[-9px] right-[-9px]" />
        {/* Camera bar */}
        <span
          aria-hidden
          className="absolute left-1/2 top-[-9px] z-10 flex h-[6px] w-16 -translate-x-1/2 items-center justify-center rounded-full bg-[#1b1b1f]"
        >
          <span className="size-[4px] rounded-full bg-[#0b0b0e] ring-1 ring-[#3d3d45]" />
        </span>

        {/* Screen — light CAD app */}
        <div className="flex h-full w-full flex-col overflow-hidden rounded-[6px] bg-[#e7e7ea] text-zinc-900">
          {/* Sync bar (drag handle) */}
          <div className="drag-handle flex cursor-move items-stretch justify-between bg-[#16a34a] font-mono text-[11px] font-bold text-white">
            <span className="flex items-center px-3 py-1 tracking-[0.15em]">
              SYNCHRONIZED.
            </span>
            <span className="flex items-stretch">
              <span className="flex items-center bg-[#dc2626] px-3 tabular-nums tracking-[0.1em]">
                T+{elapsed}
              </span>
              <span className="flex items-center bg-[#15803d] px-3 tabular-nums tracking-[0.1em]">
                {clock} UTC
              </span>
            </span>
          </div>

          {/* Tab row + device buttons */}
          <div className="flex items-stretch justify-between border-b-2 border-zinc-400 bg-[#d9d9de]">
            <div className="flex flex-wrap items-stretch">
              {tabs.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={
                      "border-r border-zinc-400 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition-colors " +
                      (active
                        ? "bg-[#fde047] text-black"
                        : "bg-[#e7e7ea] text-zinc-600 hover:bg-[#f1f1f4] hover:text-zinc-900")
                    }
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-stretch">
              {!resolved && (
                <button
                  type="button"
                  onClick={onResolve}
                  className="border-l border-zinc-400 bg-[#e7e7ea] px-3 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-green-800 hover:bg-green-100"
                >
                  Resolve
                </button>
              )}
              {resolved && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="border-l border-zinc-400 bg-[#e7e7ea] px-3 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-red-700 hover:bg-red-100"
                >
                  End Debrief
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="border-l border-zinc-400 bg-[#e7e7ea] px-3 font-mono text-[11px] font-bold text-zinc-600 hover:bg-red-100 hover:text-red-700"
                title="Close panel"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Dense incident strip — always visible, CAD style */}
          <div className="border-b border-zinc-400 bg-white px-3 py-1.5 font-mono text-[11px] leading-snug">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-bold">#{sc.id}</span>
              <span>{fmtTime(incident.receivedAt)}</span>
              <span
                className={
                  "px-1.5 font-bold uppercase " +
                  (sc.severity === "major" || sc.severity === "high"
                    ? "bg-red-600 text-white"
                    : "bg-amber-400 text-black")
                }
              >
                {sc.severity}
              </span>
              <span className="uppercase text-zinc-700">
                {sc.type.replace(/_/g, " ")}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 text-zinc-800">
              <span className="font-bold uppercase">{sc.location.address}</span>
              <span>{sc.location.postcode}</span>
              <span className="text-zinc-500">
                1st due: {sc.property.firstDueStationId}
              </span>
            </div>
          </div>

          {/* Tab content */}
          <div
            className={
              "min-h-0 flex-1 " +
              (tab === "view" || darkTab ? "" : "overflow-y-auto bg-[#f4f4f5] px-3 py-2.5")
            }
          >
            {tab === "debrief" && outcome && <OutcomeView outcome={outcome} />}

            {tab === "call" && !resolved && (
              <div className="flex h-full min-h-0 flex-col bg-(--color-bg) text-(--color-text)" style={CAD_VARS}>
                <CallInformationBody
                  incident={incident}
                  informantLog={informantLog}
                  informantOnCall={informantOnCall}
                />
              </div>
            )}

            {tab === "resourcing" && !resolved && (
              <div className="flex h-full min-h-0 bg-(--color-bg) text-(--color-text)" style={CAD_VARS}>
                {/* Committed side — who's assigned, their tasks, pre-allocation */}
                <div className="flex min-h-0 w-[46%] flex-col border-r border-(--color-border-subtle)">
                  <div className="border-b border-(--color-border-subtle) px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
                    Committed · {resolvedDeps.length}
                  </div>
                  {activeTaskList.length > 0 && (
                    <div className="border-b border-(--color-border-subtle) px-3 py-2 text-xs">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
                        Active tasks · {activeTaskList.length}
                      </div>
                      <ul className="mt-1 space-y-1.5">
                        {activeTaskList.map((t) => (
                          <ActiveTaskRow key={t.id} task={t} now={nowMs} crewAir={crewAir ?? {}} />
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto px-3 py-2 text-xs">
                    {resolvedDeps.length === 0 ? (
                      <p className="text-(--color-text-dim)">No crews committed yet.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {resolvedDeps.map((r) => (
                          <CrewLine
                            key={r.deployment.applianceId}
                            r={r}
                            now={nowMs}
                            isCommander={sceneCommanderApplianceId === r.deployment.applianceId}
                            onSetPreCommitBaCrew={onSetPreCommitBaCrew ?? (() => {})}
                            onSelectAppliance={(id) => {
                              if (!id) return;
                              const target = resolvedDeps.find((x) => x.appliance.id === id);
                              // Still driving in → pre-arrival panel; on scene
                              // (or beyond) → full control page in this pane.
                              if (target?.phase === "mobile") onSelectInbound?.(id);
                              else setUnitId(id);
                            }}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {/* Right pane — unit control page when a committed callsign
                    is selected, otherwise the available fleet. */}
                {selectedUnit && canControl ? (
                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex items-center justify-between border-b border-(--color-border-subtle) px-3 py-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
                        Unit control · {selectedUnit.appliance.callsign}
                      </span>
                      <button
                        type="button"
                        onClick={() => setUnitId(null)}
                        className="rounded-sm border border-(--color-border) px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim) hover:border-(--color-amber) hover:text-(--color-amber)"
                      >
                        ← Available fleet
                      </button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-hidden">
                      <BottomActionMenu
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
                        onBeginRoadClosure={
                          onBeginRoadClosure
                            ? (kind, crewIds) => onBeginRoadClosure(selectedUnit.appliance.id, kind, crewIds)
                            : undefined
                        }
                        onClose={() => setUnitId(null)}
                        onSceneSeconds={
                          selectedUnit.phase === "at_incident"
                            ? Math.max(0, (nowMs - selectedUnit.deployment.arrivesAt) / 1000)
                            : null
                        }
                        onSetLightState={onSetLightState!}
                        onSetPumpRunning={onSetPumpRunning!}
                        onSetPumpOperator={onSetPumpOperator!}
                        onSetFastAttackDeployed={onSetFastAttackDeployed!}
                        onToggleCrewEquipment={onToggleCrewEquipment!}
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
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="border-b border-(--color-border-subtle) px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
                      Available
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                      {etas ? (
                        <DeploymentBoard
                          incident={incident}
                          stations={stations}
                          etas={etas}
                          deployments={deployments}
                          patch={patch}
                          onDeploy={onDeploy}
                          onStandDownForWelfare={onStandDownForWelfare}
                          onStandDown={onStandDown ?? (() => {})}
                        />
                      ) : (
                        <p className="px-2 text-xs text-(--color-text-dim)">
                          Station ETAs still calculating…
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "hazards" && !resolved && sim && (
              <div className="flex h-full min-h-0 flex-col bg-(--color-bg) text-(--color-text)" style={CAD_VARS}>
                <HazardsBody
                  sim={sim}
                  incident={incident}
                  deployments={deployments}
                  resolved={resolvedDeps}
                />
              </div>
            )}

            {tab === "casualties" && !resolved && sim && (
              <div className="flex h-full min-h-0 flex-col bg-(--color-bg) text-(--color-text)" style={CAD_VARS}>
                <CasualtiesBody
                  sim={sim}
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
                  onAdministerDrug={onAdministerDrug}
                  onApplyPackaging={onApplyPackaging}
                  onRequestClinician={onRequestClinician}
                  hemsFlyable={hemsFlyable}
                  onSetTreatmentDestination={onSetTreatmentDestination}
                  onSendAtmistPrealert={onSendAtmistPrealert}
                  onConveyCasualtyVia={onConveyCasualtyVia}
                />
              </div>
            )}

            {tab === "ba" && !resolved && (
              <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto bg-(--color-bg) px-3 py-3 text-(--color-text)" style={CAD_VARS}>
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
            )}

            {tab === "overview" && !resolved && (
              <>
                <h1 className="text-lg font-bold leading-snug">{sc.title}</h1>
                <p className="mt-1 font-mono text-[11px] text-zinc-600">
                  Caller: &ldquo;{sc.trigger}&rdquo;
                </p>
                {sc.severity === "major" && (
                  <CadCard title="METHANE · Major incident">
                    <MethaneTable methane={sc.methane} />
                  </CadCard>
                )}
                <CadCard title="Occupancy & access">
                  <KeyVal k="Occupants" v={sc.property.occupants} />
                  <KeyVal k="Access" v={sc.property.access} />
                </CadCard>
              </>
            )}

            {tab === "property" && !resolved && (
              <CadCard title="Property record">
                <KeyVal k="Class" v={sc.property.class} />
                {sc.property.size && <KeyVal k="Size" v={sc.property.size} />}
                {sc.property.materials && (
                  <KeyVal k="Materials" v={sc.property.materials} />
                )}
                <KeyVal k="Occupants" v={sc.property.occupants} />
                <KeyVal k="Access" v={sc.property.access} />
                {sc.property.vulnerabilities.length > 0 && (
                  <ListRows
                    k="Vulnerabilities"
                    items={sc.property.vulnerabilities}
                    tone="amber"
                  />
                )}
                {sc.property.knownHazards.length > 0 && (
                  <ListRows
                    k="Hazards"
                    items={sc.property.knownHazards}
                    tone="critical"
                  />
                )}
              </CadCard>
            )}

            {tab === "view" && !resolved && (
              <div className="relative h-full w-full bg-zinc-800">
                <PropertyAerial
                  lat={sc.location.coords.lat}
                  lng={sc.location.coords.lng}
                />
                <div className="pointer-events-none absolute bottom-2 left-1/2 z-[500] -translate-x-1/2 border border-zinc-500 bg-white/95 px-3 py-1 font-mono text-[11px] font-bold text-zinc-900 shadow">
                  {sc.location.address}
                </div>
              </div>
            )}

            {tab === "pri" && !resolved && (
              <CadCard title="Premises risk information">
                <p className="font-mono text-[11px] text-zinc-600">
                  {sc.pri.hasFormalPri
                    ? "FORMAL PRI ON FILE."
                    : "NO FORMAL PRI (RESIDENTIAL / OPEN)."}
                </p>
                {sc.pri.items.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {sc.pri.items.map((it) => (
                      <li
                        key={it}
                        className="border-l-4 border-amber-400 bg-amber-50 px-2 py-1 text-[12px] leading-snug"
                      >
                        {it}
                      </li>
                    ))}
                  </ul>
                )}
              </CadCard>
            )}

            {tab === "targets" && !resolved && (
              <CadCard title="Dispatch targets">
                <ul className="space-y-1 text-[12px]">
                  {sc.evaluation.targets.map((t) => (
                    <li key={t.metric} className="border-b border-zinc-200 pb-1">
                      <span className="font-bold">{t.metric}</span>
                      <span className="text-zinc-600"> — {t.target}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] italic text-zinc-500">
                  {sc.evaluation.lesson}
                </p>
              </CadCard>
            )}

            {tab === "log" && <LogList log={log} />}
          </div>

          {/* Persistent ALERTS strip */}
          {alerts.length > 0 && !resolved && (
            <div className="flex items-stretch border-t-2 border-zinc-400 bg-[#fef08a]">
              <span className="flex items-center bg-[#dc2626] px-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                Alerts
              </span>
              <div className="max-h-12 flex-1 overflow-y-auto px-2 py-1 font-mono text-[10px] font-bold uppercase leading-snug text-zinc-900">
                {alerts.join(" · ")}
              </div>
            </div>
          )}
        </div>

        {/* Bottom bezel branding */}
        <div className="pointer-events-none absolute bottom-[-11px] left-1/2 -translate-x-1/2 font-mono text-[8px] font-bold uppercase tracking-[0.5em] text-[#4c4c55]">
          Watchpad
        </div>
      </div>
    </Rnd>
  );
}

// ---------------------------------------------------------------------------
// Sub-components (light CAD theme)
// ---------------------------------------------------------------------------

function Screw({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={
        "absolute z-10 size-[7px] rounded-full bg-[#3d3d45] shadow-inner ring-1 ring-[#4c4c55] " +
        className
      }
    >
      <span className="absolute left-1/2 top-1/2 h-[1px] w-[5px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#1b1b1f]" />
    </span>
  );
}

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

function fmtHms(totalSec: number): string {
  const s = Math.floor(totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
