"use client";

import { applyDirectorParam, rollBeat, rollPresent } from "@/lib/sim/director";
import type { OxygenDevice } from "@/lib/sim/oxygen";
import {
  CYCLE_SEC,
  LUCAS_FIT_SEC,
  RHYTHM_LABEL,
  amiodaroneDoseMg,
  ANALYSE_MAX_SEC,
  ANALYSE_MIN_SEC,
  compressionQuality,
  isAnalysing,
  expectedEtco2,
  newResusState,
  postRoscIssues,
  reArrestChancePerMin,
  rhythmAfterFailedShock,
  roscChance,
  secondsIntoCycle,
  shockJoules,
  type ArrestRhythm,
  type MonitorMode,
  type ResusState,
  type ReversibleCause,
} from "@/lib/sim/resus";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Appliance, AreaCode, StatusCode } from "@/lib/sim/types";
import {
  isSpecialistAppliance,
  type ApplianceTypeCode,
  type ServiceCode,
} from "@/lib/sim/types";
import {
  ALL_SERVICES,
  COVERED_SERVICES_KEY,
  parseCoveredServices,
} from "@/lib/sim/coverage";
import type {
  AirwayAction,
  BreathingAction,
  CirculationAction,
  ClinicianScope,
  Deployment,
  DrugName,
  Incident,
  IncidentOutcome,
  LogEntry,
  PackagingAction,
  PatientTreatmentState,
  Scenario,
  Task,
  TaskKind,
  TreatmentEvent,
} from "@/lib/sim/incident_types";
import type { HospitalDestinationType } from "@/lib/sim/scene";
import {
  blueLight,
  blueLightFor,
  haversineMeters,
  rescaleBlueLightSeconds,
  routeEta,
} from "@/lib/sim/eta";
import { pagerDelaySec } from "@/lib/sim/turnout";
import { scoreIncident } from "@/lib/sim/scoring";
import { rollPreShiftStates, type PreShiftState, type ShiftIntensity } from "@/lib/sim/shift";
import { nearestHospital, rollOffloadSeconds } from "@/lib/sim/hospitals";
import { advanceLiveVitals } from "@/lib/sim/vitals";
import {
  baDurationMultiplier,
  etaPrecipMultiplier,
  etaTrafficMultiplier,
  fireGrowthWindMultiplier,
  hemsAvailable,
  rollWeather,
  type WeatherState,
} from "@/lib/sim/weather";
import { simulateIncident } from "@/lib/sim/incident_sim";
import {
  BA_BAR_PER_MINUTE,
  CAPABILITIES_BY_TYPE,
  DOOR_TYPE_LABEL,
  ENTRY_TABLE,
  ENTRY_TOOL_LABEL,
  baWorkingDurationMin,
  doorTypeForScenario,
  hasWaterSupplyChain,
  rootWaterSource,
  HOSE_FLOW_LPM,
  INTERIOR_BA_DEFAULT_FLOW_LPM,
  type FireIgnition,
} from "@/lib/sim/incident_types";
import {
  APPLIANCE_SINGLETONS,
  addEquipment,
  applyLoadout,
} from "@/lib/sim/crew_carry";
import { MITIGATION_OPTIONS } from "@/lib/sim/mitigation";
import {
  airwaveClick,
  alertTone,
  baLowPressure,
  dispatchBeep,
  incomingCall,
  isMuted,
  setMuted,
  unlockAudio,
} from "@/lib/audio/sim-audio";
import type { StationWithAppliances } from "./page";
import { DashboardHeader } from "./components/header";
import { PatchPicker } from "./components/patch-picker";
import { EmbeddedMap } from "./components/map-panel";
import { DraggableResourcesPanel } from "./components/resources-panel";
import { DraggableIncidentPanel } from "./components/incident-panel";
import { DraggableIncidentMdt } from "./components/incident-mdt";
import { InformantPanel } from "./components/informant-panel";
import { DispatchLog } from "./components/dispatch-log";
import { DraggableVehiclePanel } from "./components/vehicle-panel";
import { PreArrivalPanel } from "./components/pre-arrival-panel";
import { StationBayPanel } from "./components/station-bay-panel";
import { IncidentView, type PendingClosure } from "./components/incident-view";
import { IncomingCallModal } from "./components/incoming-call";
import { DebriefScreen } from "./components/debrief-screen";
import { GlossaryOverlay } from "./components/glossary-overlay";
import { ResumePrompt } from "./components/resume-prompt";
import {
  applyResumeOffset,
  clearSave,
  loadSave,
  writeSave,
  type ShiftSave,
} from "@/lib/sim/save";
import { bumpStats, saveLastShift } from "@/lib/sim/stats";
import { syncCareerStats } from "@/lib/sim/stats-sync";

const PATCH_STORAGE_KEY = "watch-room.patch";
const INTENSITY_STORAGE_KEY = "watch-room.intensity";

type Patch = Exclude<AreaCode, "ForceWide">;

/** Human label for each fire-stage transition. Used when emitting SITREP
 *  log entries so the operator sees "Fully developed" rather than the raw
 *  enum name. */
const FIRE_STAGE_LOG_LABEL: Record<string, string> = {
  incipient: "Incipient",
  developing: "Developing",
  fully_developed: "Fully developed",
  flashover_risk: "Flashover risk",
  under_control: "Under control",
  extinguished: "Extinguished",
  none: "No fire",
};

/** Ordering used to detect "did this casualty get worse?". Higher = worse. */
const SEVERITY_WORSE: Record<string, number> = {
  minor: 0,
  serious: 1,
  critical: 2,
  expectant: 3,
};

type Props = {
  userEmail: string;
  stationsByArea: Record<AreaCode, StationWithAppliances[]>;
};

export function DashboardClient({ userEmail, stationsByArea }: Props) {
  const [patch, setPatch] = useState<Patch | null | undefined>(null);
  const [intensity, setIntensity] = useState<ShiftIntensity>("normal");
  // Director mode: pick up ?director=loud|quiet|off once on mount.
  useEffect(() => {
    applyDirectorParam();
  }, []);
  // Glossary / training overlay — toggled with `?`, shown as a modal.
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Avoid firing while the user is typing in an input / textarea.
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "?") {
        e.preventDefault();
        setGlossaryOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  // Audio mute state — persisted across sessions so the operator doesn't
  // have to toggle each time they sign in. AudioContext must be unlocked
  // inside a user gesture (any click/keypress on the page counts), so we
  // attach a one-shot listener on mount that unlocks on first interaction.
  const [audioMuted, setAudioMutedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("watch-room.muted") === "1";
  });
  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      setMuted(audioMuted);
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [audioMuted]);
  function toggleAudioMuted() {
    const next = !isMuted();
    setMuted(next);
    setAudioMutedState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("watch-room.muted", next ? "1" : "0");
    }
  }
  const [resourcesVisible, setResourcesVisible] = useState(true);
  const [incidentPanelVisible, setIncidentPanelVisible] = useState(true);

  // ---------------------------------------------------------------------
  // The call stack.
  //
  // The sim used to hold exactly one incident, and triggering a second
  // one called clearIncidentState() first — silently destroying the
  // first job's deployments, treatment records and log. Incidents are now
  // a list, with one selected; `activeIncident` is DERIVED from that
  // selection, which is what lets the sixty-odd places that read it carry
  // on working untouched.
  //
  // State that belongs to a job rather than to the shift lives in a
  // per-incident runtime slice. Each is exposed under its old name as a
  // derived value with a setter of the same shape, so existing call sites
  // read and write the SELECTED incident without knowing the stack
  // exists.
  //
  // Deliberately NOT per-incident: deployments (already carry incidentId
  // and must stay global so a unit can't be double-dispatched), the
  // treatment and resus records (keyed by casualty, so a patient keeps
  // their record while you work another job), and the log — a control
  // room keeps one log for the whole shift.
  // ---------------------------------------------------------------------
  type FiredInformantUpdate = {
    id: string;
    text: string;
    tone: "info" | "urgent" | "critical";
    firedAt: number;
  };
  type IncidentRuntime = {
    tasks: Task[];
    outcome: IncidentOutcome | null;
    informantLog: FiredInformantUpdate[];
    informantOnCall: boolean;
    fireIgnition: FireIgnition | null;
    absentCasualtyIds: string[];
    tacticalMode: "offensive" | "defensive" | "transitional" | null;
    sceneCommanderApplianceId: string | null;
    muster: { lat: number; lng: number; radiusM: number } | null;
  };
  const emptyRuntime = (): IncidentRuntime => ({
    tasks: [],
    outcome: null,
    informantLog: [],
    informantOnCall: false,
    fireIgnition: null,
    absentCasualtyIds: [],
    tacticalMode: null,
    sceneCommanderApplianceId: null,
    muster: null,
  });

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [runtimes, setRuntimes] = useState<Record<string, IncidentRuntime>>({});

  const activeIncident = useMemo(
    () => incidents.find((i) => i.id === selectedIncidentId) ?? null,
    [incidents, selectedIncidentId],
  );

  /** Selected incident id, readable from inside timers without making them
   *  re-subscribe on every selection change. */
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedIncidentId;

  const runtime = selectedIncidentId
    ? runtimes[selectedIncidentId] ?? emptyRuntime()
    : emptyRuntime();

  /** Mutate one incident's runtime slice. */
  const updateRuntime = useCallback(
    (incidentId: string | null, fn: (rt: IncidentRuntime) => IncidentRuntime) => {
      if (!incidentId) return;
      setRuntimes((prev) => {
        const cur = prev[incidentId] ?? emptyRuntime();
        const next = fn(cur);
        if (next === cur) return prev;
        return { ...prev, [incidentId]: next };
      });
    },
    [],
  );

  /** Build a setState-shaped setter for one field of the selected
   *  incident's runtime, so existing `setX(v)` and `setX(prev => …)` call
   *  sites keep working unchanged. */
  function runtimeSetter<K extends keyof IncidentRuntime>(key: K) {
    return (value: IncidentRuntime[K] | ((prev: IncidentRuntime[K]) => IncidentRuntime[K])) => {
      updateRuntime(selectedIdRef.current, (rt) => {
        const next =
          typeof value === "function"
            ? (value as (p: IncidentRuntime[K]) => IncidentRuntime[K])(rt[key])
            : value;
        return next === rt[key] ? rt : { ...rt, [key]: next };
      });
    };
  }

  /** Replace the selected incident record itself (resolvedAt, receivedAt
   *  rewinds). Shaped like the old setActiveIncident. */
  const setActiveIncident = useCallback(
    (value: Incident | null | ((prev: Incident | null) => Incident | null)) => {
      setIncidents((prev) => {
        const id = selectedIdRef.current;
        if (!id) return prev;
        const idx = prev.findIndex((i) => i.id === id);
        if (idx < 0) return prev;
        const next =
          typeof value === "function"
            ? (value as (p: Incident | null) => Incident | null)(prev[idx])
            : value;
        if (!next) return prev.filter((i) => i.id !== id);
        if (next === prev[idx]) return prev;
        const out = [...prev];
        out[idx] = next;
        return out;
      });
    },
    [],
  );

  const informantLog = runtime.informantLog;
  const setInformantLog = runtimeSetter("informantLog");
  const informantOnCall = runtime.informantOnCall;
  const setInformantOnCall = runtimeSetter("informantOnCall");
  const fireIgnition = runtime.fireIgnition;
  const setFireIgnition = runtimeSetter("fireIgnition");
  const absentCasualtyIds = runtime.absentCasualtyIds;
  const setAbsentCasualtyIds = runtimeSetter("absentCasualtyIds");
  // Armed map placement — set by the Place / LZ button on a unit's row
  // in the MDT; the ground map performs the two-click flow and clears it.
  const [placePendingApplianceId, setPlacePendingApplianceId] = useState<string | null>(null);

  // Per-casualty clinical treatment state. Keyed by casualty id so it
  // survives ambulance hand-off. Grows as the operator runs a primary
  // survey, applies A-B-C interventions, administers drugs, picks a
  // destination, and sends ATMIST.
  const [resusByCasualtyId, setResusByCasualtyId] = useState<
    Record<string, ResusState>
  >({});
  const [treatmentByCasualtyId, setTreatmentByCasualtyId] = useState<
    Record<string, PatientTreatmentState>
  >({});
  // Which services the operator covers this shift — drives scenario
  // availability in the trigger menu. Chosen on the patch picker.
  const [coveredServices, setCoveredServices] = useState<ServiceCode[]>([
    ...ALL_SERVICES,
  ]);
  // Held scenario awaiting operator answer-or-decline from the 999 call modal.
  const [pendingCall, setPendingCall] = useState<Scenario | null>(null);
  // Audible 999 ring when a call comes in.
  useEffect(() => {
    if (pendingCall) incomingCall();
  }, [pendingCall]);
  // Status-change airwave click, fire-stage alert tone, and BA low-pressure
  // whistle are all hoisted below the state declarations they depend on —
  // see the useEffect blocks near the bottom of this component.
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, StatusCode>>({});
  /** Only the selected job's committed units. The map deliberately shows
   *  ALL deployments — an operator wants to see every appliance moving,
   *  on every job — but the incident view, MDT and debrief must only ever
   *  see their own. */
  const incidentDeployments = useMemo(
    () => deployments.filter((d) => d.incidentId === selectedIncidentId),
    [deployments, selectedIncidentId],
  );


  const [preShiftStates, setPreShiftStates] = useState<Record<string, PreShiftState>>({});
  const [log, setLog] = useState<LogEntry[]>([]);
  const outcome = runtime.outcome;
  const setOutcome = runtimeSetter("outcome");
  // The dispatch log sits on the map by default; the operator can hide it.
  const [showDispatchLog, setShowDispatchLog] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [selectedApplianceId, setSelectedApplianceId] = useState<string | null>(null);
  // Ground-view map interactions started from either the map action menu or
  // the MDT: a road closure awaiting its placement click, and a parked
  // vehicle awaiting a rotate-bearing click.
  const [pendingClosure, setPendingClosure] = useState<PendingClosure | null>(null);
  const [rotatePendingApplianceId, setRotatePendingApplianceId] = useState<string | null>(null);
  // Casualty muster / evacuation area — drawn on the ground map as a
  // circle; casualties and walking wounded RV inside it.
  const muster = runtime.muster;
  const setMuster = runtimeSetter("muster");
  // Unit whose control page fills the MDT Resourcing pane — set by MDT
  // clicks AND ground-map vehicle clicks (the map-side menu is gone).
  const [mdtUnitId, setMdtUnitId] = useState<string | null>(null);
  const [pendingMuster, setPendingMuster] = useState(false);
  const [groundViewOpen, setGroundViewOpen] = useState(false);
  // Where the ground view should open. Set when the operator zooms into
  // it (continue from their view); null when they enter via the header
  // switch (centre the incident, as before).
  const [groundEntryView, setGroundEntryView] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);
  // Fire station whose appliance-bay view is open (from the map popup).
  const [bayStationId, setBayStationId] = useState<string | null>(null);
  const [newlyFoundCasualties, setNewlyFoundCasualties] = useState<Set<string>>(new Set());
  // Progression tracking: memoised last-known fire stage + per-casualty
  // severity so we only emit a SITREP entry when these actually change,
  // not on every sim recompute.
  const [lastFireStage, setLastFireStage] = useState<string>("none");
  const [lastCasualtySeverity, setLastCasualtySeverity] = useState<Record<string, string>>({});
  const [newlyConfirmedHazards, setNewlyConfirmedHazards] = useState<Set<string>>(new Set());

  // Task + scene commander + crew BA air state.
  const tasks = runtime.tasks;
  const setTasks = runtimeSetter("tasks");
  const sceneCommanderApplianceId = runtime.sceneCommanderApplianceId;
  const setSceneCommanderApplianceId = runtimeSetter("sceneCommanderApplianceId");
  // Weather + time of day — rolled when the shift starts and re-rolled on
  // patch change. Feeds into blue-light ETAs, HEMS availability, BA
  // cylinder duration and fire growth inside the sim.
  const [weather, setWeather] = useState<WeatherState>(() => rollWeather());
  // Per-appliance crew-fatigue percentage (0 = fresh, 100 = exhausted).
  // Accumulates with on-scene time + active task load; welfare breaks
  // reset it. Past ~70 % it extends task durations and raises the odds
  // of fatigue-related error setbacks.
  const [fatigueByApplianceId, setFatigueByApplianceId] = useState<Record<string, number>>({});
  const [lastFatigueTickAt, setLastFatigueTickAt] = useState<number>(0);
  // Tactical mode declared by the IC. Null until an IC is in place + a mode
  // is set. Gates Interior Attack and is required on any SITREP going to
  // control at a major incident.
  const tacticalMode = runtime.tacticalMode;
  const setTacticalMode = runtimeSetter("tacticalMode");
  // crewMemberId → airPct (0–100). Only tracked for members in a ba_sar task.
  const [crewAir, setCrewAir] = useState<Record<string, number>>({});
  const [lastAirTickAt, setLastAirTickAt] = useState<number>(0);
  // Mutable vehicle gauges keyed on applianceId. Overlays the base Appliance data.
  const [vehicleGauges, setVehicleGauges] = useState<
    Record<string, { fuelPct: number; waterPct: number; conditionPct: number }>
  >({});

  // Per-station ETA from station to incident. Computed once when an incident
  // opens and shared between the incident panel + the ground-view deployment
  // board.
  const [etas, setEtas] = useState<Record<string, import("./components/deployment-board").Eta>>({});

  // If a shift save was found on mount, hold it here until the operator
  // picks Resume or Discard via the ResumePrompt modal.
  const [pendingSave, setPendingSave] = useState<ShiftSave | null>(null);

  useEffect(() => {
    // "Start Shift" from the main menu links here with ?new=1 — that
    // means always start clean, ignoring any patch we cached AND any
    // shift save that might be sitting in localStorage.
    const url = new URL(window.location.href);
    const forceNew = url.searchParams.get("new") === "1";
    if (forceNew) {
      clearSave();
      localStorage.removeItem(PATCH_STORAGE_KEY);
      url.searchParams.delete("new");
      window.history.replaceState({}, "", url.toString());
    }

    // Check for a fresh shift save first — if present, the modal will
    // gate the flow until the operator decides.
    if (!forceNew) {
      const save = loadSave();
      if (save) {
        setPendingSave(save);
        // Keep patch=null (loading state) so the briefing/shift UI
        // doesn't render behind the modal.
        setPatch(null);
        return;
      }
    }

    const storedPatch = forceNew ? null : localStorage.getItem(PATCH_STORAGE_KEY);
    const storedIntensity = localStorage.getItem(INTENSITY_STORAGE_KEY);
    if (
      storedIntensity === "quiet" ||
      storedIntensity === "normal" ||
      storedIntensity === "busy"
    ) {
      setIntensity(storedIntensity);
    }
    if (storedPatch === "Southern" || storedPatch === "Eastern" || storedPatch === "Western") {
      setPatch(storedPatch);
    } else {
      setPatch(undefined);
    }
    setCoveredServices(
      parseCoveredServices(localStorage.getItem(COVERED_SERVICES_KEY)),
    );
  }, []);

  // ---- Save / resume handlers ------------------------------------------
  // Called from the ResumePrompt modal.

  const hydrateFromSave = useCallback((save: ShiftSave) => {
    const shifted = applyResumeOffset(save);
    setPatch(shifted.patch);
    setIntensity(shifted.intensity);
    setWeather(shifted.weather);
    setPreShiftStates(shifted.preShiftStates);
    setActiveIncident(shifted.activeIncident);
    setDeployments(shifted.deployments);
    setStatusOverrides(shifted.statusOverrides);
    setTasks(shifted.tasks);
    setCrewAir(shifted.crewAir);
    setVehicleGauges(shifted.vehicleGauges);
    setFatigueByApplianceId(shifted.fatigueByApplianceId);
    setTreatmentByCasualtyId(shifted.treatmentByCasualtyId);
    setSceneCommanderApplianceId(shifted.sceneCommanderApplianceId);
    setTacticalMode(shifted.tacticalMode);
    setLog(shifted.log);
    setInformantLog(shifted.informantLog);
    setInformantOnCall(shifted.informantOnCall);
    setFireIgnition(shifted.fireIgnition ?? null);
    setAbsentCasualtyIds(shifted.absentCasualtyIds ?? []);
    setCoveredServices(shifted.coveredServices ?? [...ALL_SERVICES]);
    setNewlyFoundCasualties(new Set(shifted.newlyFoundCasualties));
    setNewlyConfirmedHazards(new Set(shifted.newlyConfirmedHazards));
    setLastFireStage(shifted.lastFireStage);
    setLastCasualtySeverity(shifted.lastCasualtySeverity);
    setLastAirTickAt(shifted.lastAirTickAt);
    setLastFatigueTickAt(shifted.lastFatigueTickAt);
    setPendingSave(null);
  }, []);

  const discardSave = useCallback(() => {
    clearSave();
    setPendingSave(null);
    // Fall back to the ordinary patch-picker briefing flow.
    const storedPatch = localStorage.getItem(PATCH_STORAGE_KEY);
    if (
      storedPatch === "Southern" ||
      storedPatch === "Eastern" ||
      storedPatch === "Western"
    ) {
      setPatch(storedPatch);
    } else {
      setPatch(undefined);
    }
  }, []);

  // Generate pre-shift state whenever the patch/intensity combo is first set.
  useEffect(() => {
    if (!patch) return;
    if (Object.keys(preShiftStates).length > 0) return; // already rolled
    const patchAppliances = [
      ...stationsByArea[patch],
      ...stationsByArea.ForceWide,
    ].flatMap((s) => s.appliances);
    setPreShiftStates(rollPreShiftStates(patchAppliances, intensity));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patch, intensity]);

  // Auto-save the shift snapshot every 3 s while an incident is live so
  // a reload / crash doesn't lose progress. Writes are cheap
  // (JSON.stringify to localStorage) but throttled anyway. Cleared when
  // the incident resolves (see the outcome effect further down).
  useEffect(() => {
    if (!patch || !activeIncident || outcome) return;
    const id = setInterval(() => {
      writeSave({
        patch,
        intensity,
        weather,
        preShiftStates,
        activeIncident,
        deployments,
        statusOverrides,
        tasks,
        crewAir,
        vehicleGauges,
        fatigueByApplianceId,
        treatmentByCasualtyId,
        sceneCommanderApplianceId,
        tacticalMode,
        log,
        informantLog,
        informantOnCall,
        fireIgnition,
        absentCasualtyIds,
        coveredServices,
        newlyFoundCasualties: Array.from(newlyFoundCasualties),
        newlyConfirmedHazards: Array.from(newlyConfirmedHazards),
        lastFireStage,
        lastCasualtySeverity,
        lastAirTickAt,
        lastFatigueTickAt,
      });
    }, 3000);
    return () => clearInterval(id);
  }, [
    patch,
    intensity,
    weather,
    preShiftStates,
    activeIncident,
    outcome,
    deployments,
    statusOverrides,
    tasks,
    crewAir,
    vehicleGauges,
    fatigueByApplianceId,
    treatmentByCasualtyId,
    sceneCommanderApplianceId,
    tacticalMode,
    log,
    informantLog,
    informantOnCall,
    fireIgnition,
    absentCasualtyIds,
    coveredServices,
    newlyFoundCasualties,
    newlyConfirmedHazards,
    lastFireStage,
    lastCasualtySeverity,
    lastAirTickAt,
    lastFatigueTickAt,
  ]);

  // On outcome (shift resolved), drop the save — nothing to resume.
  useEffect(() => {
    if (outcome) clearSave();
  }, [outcome]);

  // 1 Hz wall clock.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Live-vitals tick. Runs at 2 Hz so the numbers move continuously
  // rather than sitting still and then leaping every few seconds — the
  // deltas are per-second rates, so a shorter tick just means smaller,
  // more frequent steps. The trend ARROWS still compare against a
  // several-second baseline (see TREND_BASELINE_SEC), because an arrow
  // drawn against half a second ago would be noise.
  //
  // Advance each casualty's live vitals based
  // on active red flags (degrade) and interventions (recover / clear
  // flags). Casualties who haven't had a primary survey yet have no
  // liveVitals and are skipped. Once the patient is conveying (paired
  // deployment has hospitalLegStartedAt), vitals keep ticking — the crew
  // is still working on them en route.
  useEffect(() => {
    const id = setInterval(() => {
      setTreatmentByCasualtyId((prev) => {
        let changed = false;
        const nowMs = Date.now();
        const next: typeof prev = {};
        for (const [cid, tx] of Object.entries(prev)) {
          if (!tx.liveVitals || !tx.liveVitalsLastTickAt) {
            next[cid] = tx;
            continue;
          }
          const dtSec = (nowMs - tx.liveVitalsLastTickAt) / 1000;
          if (dtSec < 0.35) {
            next[cid] = tx;
            continue;
          }
          const advanced = advanceLiveVitals(tx, dtSec, nowMs);
          if (advanced !== tx) changed = true;
          next[cid] = advanced;
        }
        return changed ? next : prev;
      });
    }, 500);
    return () => clearInterval(id);
  }, []);

  // Mirror of the treatment records, so the resus tick can read a
  // patient's current vitals without re-subscribing the interval on every
  // 3-second vitals update.
  const treatmentRef = useRef<Record<string, PatientTreatmentState>>({});
  useEffect(() => {
    treatmentRef.current = treatmentByCasualtyId;
  }, [treatmentByCasualtyId]);

  // Mirror of the resus records so the tick can DECIDE synchronously.
  // This matters more than it looks: the previous version pushed ROSC
  // decisions into an array from inside a setState updater and read that
  // array immediately afterwards. React makes no promise to run an
  // updater synchronously, so the array was still empty when it was read
  // — the arrest flag never cleared and the patient's vitals were never
  // restored. A patient could reach ROSC on the board and stay pulseless
  // on the monitor for ever.
  const resusRef = useRef<Record<string, ResusState>>({});
  useEffect(() => {
    resusRef.current = resusByCasualtyId;
  }, [resusByCasualtyId]);

  // Resuscitation tick. Runs the ALS clock: end-tidal CO2 chases whatever
  // the current compressions justify, and every two minutes the cycle
  // rolls over into a rhythm check where ROSC is decided. It is also the
  // only place the cardiac_arrest flag is ever cleared or put back.
  useEffect(() => {
    const id = setInterval(() => {
      const nowMs = Date.now();
      const current = resusRef.current;
      const ids = Object.keys(current);
      if (ids.length === 0) return;

      const nextResus: Record<string, ResusState> = {};
      const achieved: string[] = [];
      const reArrested: string[] = [];
      // Compression quality per patient, published onto the treatment
      // record so the vitals engine can reflect how good the CPR is.
      const quality: Record<string, number> = {};
      let changed = false;

      for (const cid of ids) {
        const r = current[cid];
        if (r.roleAt !== undefined) {
          nextResus[cid] = r;
          continue;
        }
        let s = r;
        quality[cid] = compressionQuality(s, nowMs);

        const roscAt = s.roscAt;
        if (roscAt !== undefined) {
          // --- Post-ROSC: fragile, and it can go back the other way ---
          const target = expectedEtco2(s, nowMs);
          const eased = s.etco2 + (target - s.etco2) * 0.12;
          if (Math.abs(eased - s.etco2) > 0.02) {
            s = { ...s, etco2: Math.round(eased * 10) / 10 };
            changed = true;
          }
          const sinceCheck = (nowMs - (s.lastPostRoscCheckAt ?? roscAt)) / 1000;
          if (sinceCheck >= 60) {
            const issues = postRoscIssues(s, treatmentRef.current[cid]?.liveVitals);
            if (rollBeat(reArrestChancePerMin(s, nowMs, issues))) {
              reArrested.push(cid);
              s = {
                ...s,
                roscAt: undefined,
                reArrests: s.reArrests + 1,
                cycle: 0,
                cycleStartedAt: nowMs,
                rhythm: Math.random() < 0.35 ? "vf" : "pea",
                lastPostRoscCheckAt: undefined,
                events: [
                  ...s.events,
                  { at: nowMs, text: "RE-ARREST — output lost again", tone: "critical" },
                ],
              };
            } else {
              s = { ...s, lastPostRoscCheckAt: nowMs };
            }
            changed = true;
          }
          nextResus[cid] = s;
          continue;
        }

        // --- Still in arrest ---
        const target = expectedEtco2(s, nowMs);
        const eased = s.etco2 + (target - s.etco2) * 0.2;
        if (Math.abs(eased - s.etco2) > 0.02) {
          s = { ...s, etco2: Math.round(eased * 10) / 10 };
          changed = true;
        }
        // A rhythm check is two phases: the monitor analyses with hands
        // off the chest for 7-10 seconds, and only then does the result
        // come back. Instant results made the most important moment of
        // the whole loop pass without being noticed.
        if (s.analysingSince === undefined && secondsIntoCycle(s, nowMs) >= CYCLE_SEC) {
          s = {
            ...s,
            analysingSince: nowMs,
            analyseSec:
              ANALYSE_MIN_SEC + Math.random() * (ANALYSE_MAX_SEC - ANALYSE_MIN_SEC),
            events: [
              ...s.events,
              { at: nowMs, text: 'Stand clear — analysing rhythm', tone: 'info' },
            ],
          };
          changed = true;
        } else if (s.analysingSince !== undefined && !isAnalysing(s, nowMs)) {
          s = { ...s, analysingSince: undefined, analyseSec: undefined };
          if (rollBeat(roscChance(s, nowMs))) {
            achieved.push(cid);
            s = {
              ...s,
              roscAt: nowMs,
              cycle: s.cycle + 1,
              cycleStartedAt: nowMs,
              events: [
                ...s.events,
                { at: nowMs, text: "ROSC — output restored", tone: "good" },
              ],
            };
          } else {
            const degenerated = rhythmAfterFailedShock(s, nowMs, Math.random());
            s = {
              ...s,
              cycle: s.cycle + 1,
              cycleStartedAt: nowMs,
              rhythm: degenerated,
              events: [
                ...s.events,
                {
                  at: nowMs,
                  text: `Rhythm check — ${RHYTHM_LABEL[degenerated]}`,
                  tone: "info",
                },
              ],
            };
          }
          changed = true;
        }
        nextResus[cid] = s;
      }

      if (changed) setResusByCasualtyId(nextResus);

      // Everything below acts on plain values computed above, so it
      // happens exactly once and in the right order.
      setTreatmentByCasualtyId((prev) => {
        let touched = false;
        const nx = { ...prev };
        for (const cid of ids) {
          const tx = nx[cid];
          if (!tx) continue;
          let t = tx;
          const q = quality[cid];
          if (q !== undefined && Math.abs((t.cprQuality ?? -1) - q) > 0.01) {
            t = { ...t, cprQuality: q };
            touched = true;
          }
          if (achieved.includes(cid)) {
            // Clearing the flag is not enough on its own: the arrest left
            // the numbers at zero and nothing drives a heart rate back up.
            // Seed the post-ROSC picture — deliberately an UNWELL one,
            // because that is what a freshly resuscitated patient is.
            const v = t.liveVitals ?? t.revealedVitals;
            t = {
              ...t,
              activeRedFlags: (t.activeRedFlags ?? []).filter(
                (f) => f !== "cardiac_arrest",
              ),
              liveVitals: v
                ? { ...v, hr: 112, bpSys: 92, bpDia: 58, spo2: 90, rr: 12, gcs: 3 }
                : v,
              prevLiveVitals: v,
              prevLiveVitalsAt: nowMs,
              liveVitalsLastTickAt: nowMs,
            };
            touched = true;
          }
          if (reArrested.includes(cid)) {
            const v = t.liveVitals ?? t.revealedVitals;
            const flags = t.activeRedFlags ?? [];
            t = {
              ...t,
              activeRedFlags: flags.includes("cardiac_arrest")
                ? flags
                : [...flags, "cardiac_arrest"],
              liveVitals: v ? { ...v, hr: 0, bpSys: 0, bpDia: 0, gcs: 3 } : v,
              prevLiveVitals: v,
              prevLiveVitalsAt: nowMs,
              liveVitalsLastTickAt: nowMs,
            };
            touched = true;
          }
          if (t !== tx) nx[cid] = t;
        }
        return touched ? nx : prev;
      });

      if (achieved.length > 0) {
        setLog((prev) => [
          ...prev,
          {
            id: `rosc:${nowMs}`,
            timestamp: nowMs,
            kind: "annotation",
            message:
              "ROSC achieved — output restored. Post-ROSC care and a PPCI pre-alert.",
          },
        ]);
      }
      if (reArrested.length > 0) {
        setLog((prev) => [
          ...prev,
          {
            id: `rearrest:${nowMs}`,
            timestamp: nowMs,
            kind: "annotation",
            message: "RE-ARREST — output lost, resuscitation resumed.",
          },
        ]);
      }
    }, 500);
    return () => clearInterval(id);
  }, []);

  // Open an arrest record as soon as a patient is found to be in cardiac
  // arrest. Keys off activeRedFlags rather than revealedRedFlags so a
  // patient who arrests AFTER the primary survey still gets a board.
  useEffect(() => {
    for (const [cid, tx] of Object.entries(treatmentByCasualtyId)) {
      const flags = tx.activeRedFlags ?? tx.revealedRedFlags ?? [];
      if (flags.includes("cardiac_arrest") && !resusByCasualtyId[cid]) {
        ensureResus(cid);
      }
    }
  }, [treatmentByCasualtyId, resusByCasualtyId]);

  // Sweep expired pre-shift commitments so appliances return to Available.
  useEffect(() => {
    setPreShiftStates((prev) => {
      let changed = false;
      const next: typeof prev = {};
      for (const [id, s] of Object.entries(prev)) {
        if (s.availableAt && now >= s.availableAt) {
          changed = true;
          continue; // drop — appliance now Available
        }
        next[id] = s;
      }
      return changed ? next : prev;
    });
  }, [now]);

  // Abort any hose_attack whose ultimate water source has dried up, or
  // whose appliance has lost its pump operator. Walks the relay graph
  // via rootWaterSource so a pump relaying from an empty upstream tank
  // stops correctly — the sim was previously only checking the
  // attacker's own tank, which let relayed consumers keep spraying air.
  useEffect(() => {
    setTasks((prev) => {
      let changed = false;
      const next = prev.map((t) => {
        if (t.kind !== "hose_attack" || t.state !== "active") return t;
        const d = deployments.find((x) => x.applianceId === t.applianceId);
        if (!d) return t;
        const pumpReady = d.pumpRunning === true && !!d.pumpOperatorCrewId;
        const root = rootWaterSource(t.applianceId, prev);
        const hasWaterSource =
          root.type === "hydrant" ||
          (root.type === "tank" &&
            (vehicleGauges[root.applianceId]?.waterPct ?? 100) > 0);
        if (pumpReady && hasWaterSource) return t;
        changed = true;
        setLog((L) => [
          ...L,
          {
            id: `attack-stop:${t.id}:${Date.now()}`,
            timestamp: Date.now(),
            kind: "annotation",
            message: `${applianceLabel(t.applianceId)} hose attack stopped · ${!pumpReady ? "pump not running" : "water supply lost"}`,
          },
        ]);
        return { ...t, state: "aborted" as const };
      });
      return changed ? next : prev;
    });
  }, [vehicleGauges, deployments]);

  // Status overrides derive from (a) active deployments, (b) pre-shift state.
  // Active deployments win if present.
  useEffect(() => {
    setStatusOverrides(() => {
      const next: Record<string, StatusCode> = {};
      for (const [id, s] of Object.entries(preShiftStates)) {
        next[id] = s.status;
      }
      for (const d of deployments) {
        let desired: StatusCode;
        if (d.returnStartedAt && d.returnArrivesAt && now >= d.returnArrivesAt) {
          // Back at station — may be in post-incident rehab window.
          if (d.rehabUntil && now < d.rehabUntil) {
            desired = 8; // Refuel / rehab — Off-run
          } else {
            desired = 7; // Fully available
          }
        } else if (d.returnStartedAt && now >= d.returnStartedAt) {
          desired = 4;
        } else if (d.offloadEndsAt && now < d.offloadEndsAt && d.hospitalArrivesAt && now >= d.hospitalArrivesAt) {
          desired = 5;
        } else if (d.hospitalLegStartedAt && d.hospitalArrivesAt && now >= d.hospitalLegStartedAt && now < d.hospitalArrivesAt) {
          desired = 1;
        } else if (
          d.welfareStartedAt &&
          d.welfareEndsAt &&
          now >= d.welfareStartedAt &&
          now < d.welfareEndsAt
        ) {
          desired = 8; // Welfare break — Off-run
        } else if (now >= d.arrivesAt) {
          desired = 2;
        } else {
          desired = 1;
        }
        next[d.applianceId] = desired;
      }
      return next;
    });
  }, [now, deployments, preShiftStates]);

  useEffect(() => {
    const newEntries: LogEntry[] = [];
    for (const d of deployments) {
      const arrivedKey = `arrived:${d.applianceId}`;
      const hospitalKey = `hospital:${d.applianceId}`;
      const offloadKey = `offload:${d.applianceId}`;
      const returnedKey = `returned:${d.applianceId}`;
      const refuelKey = `refuel:${d.applianceId}`;
      const welfareCompleteKey = d.welfareEndsAt
        ? `welfare-done:${d.applianceId}:${d.welfareEndsAt}`
        : null;
      if (
        welfareCompleteKey &&
        d.welfareEndsAt &&
        now >= d.welfareEndsAt &&
        !log.some((e) => e.id === welfareCompleteKey)
      ) {
        newEntries.push({
          id: welfareCompleteKey,
          timestamp: d.welfareEndsAt,
          kind: "welfare_complete",
          message: `${applianceLabel(d.applianceId)} welfare break complete · back in attendance`,
        });
      }
      if (
        now >= d.arrivesAt &&
        !d.returnStartedAt &&
        !d.hospitalLegStartedAt &&
        !log.some((e) => e.id === arrivedKey)
      ) {
        newEntries.push({
          id: arrivedKey,
          timestamp: d.arrivesAt,
          kind: "in_attendance",
          message: `${applianceLabel(d.applianceId)} in attendance`,
        });
      }
      if (
        d.hospitalArrivesAt &&
        now >= d.hospitalArrivesAt &&
        !log.some((e) => e.id === hospitalKey)
      ) {
        newEntries.push({
          id: hospitalKey,
          timestamp: d.hospitalArrivesAt,
          kind: "at_hospital",
          message: `${applianceLabel(d.applianceId)} at ${d.hospitalName ?? "hospital"} — offloading ~${fmtSec(d.offloadSeconds ?? 0)}`,
        });
      }
      if (
        d.offloadEndsAt &&
        now >= d.offloadEndsAt &&
        !log.some((e) => e.id === offloadKey)
      ) {
        newEntries.push({
          id: offloadKey,
          timestamp: d.offloadEndsAt,
          kind: "offload_complete",
          message: `${applianceLabel(d.applianceId)} offload complete · clearing for station`,
        });
      }
      if (
        d.returnArrivesAt &&
        now >= d.returnArrivesAt &&
        !log.some((e) => e.id === returnedKey)
      ) {
        const msg = d.rehabUntil
          ? `${applianceLabel(d.applianceId)} back at station · refuel / rehab ${fmtSec((d.rehabUntil - d.returnArrivesAt) / 1000)}`
          : `${applianceLabel(d.applianceId)} back at station · available`;
        newEntries.push({
          id: returnedKey,
          timestamp: d.returnArrivesAt,
          kind: "back_at_station",
          message: msg,
        });
      }
      if (
        d.rehabUntil &&
        now >= d.rehabUntil &&
        !log.some((e) => e.id === refuelKey)
      ) {
        newEntries.push({
          id: refuelKey,
          timestamp: d.rehabUntil,
          kind: "refuel_complete",
          message: `${applianceLabel(d.applianceId)} refuel complete · available`,
        });
      }
    }
    if (newEntries.length > 0) setLog((prev) => [...prev, ...newEntries]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, deployments]);

  function selectPatch(
    area: Patch,
    newIntensity: ShiftIntensity,
    startHour?: number,
    services?: ServiceCode[],
  ) {
    localStorage.setItem(PATCH_STORAGE_KEY, area);
    localStorage.setItem(INTENSITY_STORAGE_KEY, newIntensity);
    if (services && services.length > 0) {
      localStorage.setItem(COVERED_SERVICES_KEY, JSON.stringify(services));
      setCoveredServices(services);
    }
    setPatch(area);
    setIntensity(newIntensity);
    setPreShiftStates({}); // force a re-roll on first render after selection
    // Fresh weather for the new shift, pinned to the operator's chosen
    // start time so time-of-day effects (HEMS grounding, rush hour,
    // darkness) match the briefing hints.
    setWeather(rollWeather(undefined, startHour));
  }

  function changePatch() {
    localStorage.removeItem(PATCH_STORAGE_KEY);
    setPatch(undefined);
    setPreShiftStates({});
    clearIncidentState();
  }

  /** Whole-shift wipe — used when the operator changes patch. Closing a
   *  single job is dismissIncident(), which leaves the rest of the stack
   *  standing. */
  function clearIncidentState() {
    setIncidents([]);
    setSelectedIncidentId(null);
    setRuntimes({});
    setDeployments([]);
    setStatusOverrides({});
    setLog([]);
    setOutcome(null);
    setNewlyFoundCasualties(new Set());
    setNewlyConfirmedHazards(new Set());
    setTasks([]);
    setSceneCommanderApplianceId(null);
    setCrewAir({});
    setLastAirTickAt(0);
    setInformantLog([]);
    setInformantOnCall(false);
    setFireIgnition(null);
    setAbsentCasualtyIds([]);
    setTreatmentByCasualtyId({});
    setTacticalMode(null);
    setFatigueByApplianceId({});
    setLastFatigueTickAt(0);
    setMuster(null);
    setPendingMuster(false);
    setMdtUnitId(null);
    setPlacePendingApplianceId(null);
  }

  /** Declare / change tactical mode. IC must be assigned first — the
   *  caller is responsible for checking, but we short-circuit here as a
   *  safety net. Emits a SITREP entry that's visible under the Command
   *  filter in the feed. */
  function declareTacticalMode(mode: "offensive" | "defensive" | "transitional") {
    if (!sceneCommanderApplianceId) return;
    if (mode === tacticalMode) return;
    setTacticalMode(mode);
    setLog((prev) => [
      ...prev,
      {
        id: `tac:${mode}:${Date.now()}`,
        timestamp: Date.now(),
        kind: "tactical_mode",
        message: `Tactical mode declared · ${mode.charAt(0).toUpperCase() + mode.slice(1)} · ${applianceLabel(sceneCommanderApplianceId)} IC`,
      },
    ]);
  }

  function triggerScenario(scenario: Scenario) {
    // A scenario can only be live once at a time. Casualty ids are
    // authored per scenario ('cas-player'), and the treatment and resus
    // records are keyed by casualty id — running the same job twice
    // concurrently would have the two patients share one record.
    if (incidents.some((i) => i.scenarioId === scenario.id && !runtimes[i.id]?.outcome)) {
      setSelectedIncidentId(
        incidents.find((i) => i.scenarioId === scenario.id)!.id,
      );
      return;
    }
    bumpStats((s) => {
      s.callsAnswered += 1;
      s.byType[scenario.type] = (s.byType[scenario.type] ?? 0) + 1;
    });
    const t = Date.now();
    // Persons-reality roll — decided once, at call time. Casualties with
    // presentProbability < 1 may simply not be there tonight; a beat with
    // effect.revealCasualty can still put one back mid-call.
    const absentRoll: string[] = [];
    for (const c of scenario.scene?.casualties ?? []) {
      if (c.presentProbability === undefined) continue;
      if (!rollPresent(c.presentProbability)) absentRoll.push(c.id);
    }
    // Fire-origin roll — one draw across the authored variants; the
    // winner is baked into this incident's own scenario copy so the sim,
    // scene canvas, maps and the 360 material reveal all see the rolled
    // seat without any extra plumbing. The remainder probability keeps
    // the authored default seat.
    let liveScenario = scenario;
    const variants = scenario.scene?.fireOriginVariants;
    if (scenario.scene?.fireSeat && variants && variants.length > 0) {
      const draw = Math.random();
      let acc = 0;
      for (const v of variants) {
        acc += v.probability;
        if (draw < acc) {
          liveScenario = {
            ...scenario,
            scene: {
              ...scenario.scene,
              fireSeat: {
                ...scenario.scene.fireSeat,
                pos: v.pos,
                material: v.material ?? scenario.scene.fireSeat.material,
                radiusM: v.radiusM ?? scenario.scene.fireSeat.radiusM,
                growthRateMpm:
                  v.growthRateMpm ?? scenario.scene.fireSeat.growthRateMpm,
                maxRadiusM: v.maxRadiusM ?? scenario.scene.fireSeat.maxRadiusM,
              },
            },
          };
          break;
        }
      }
    }
    const newId = `INC-${t}`;
    setIncidents((prev) => [
      ...prev,
      { id: newId, scenarioId: scenario.id, scenario: liveScenario, receivedAt: t },
    ]);
    setRuntimes((prev) => ({
      ...prev,
      [newId]: {
        ...emptyRuntime(),
        absentCasualtyIds: absentRoll,
        // The caller stays on the line from answering until the first
        // crew lands. Seeded here rather than through the shadowed setter
        // below, which would still be writing to the previous selection.
        informantOnCall: true,
      },
    }));
    setSelectedIncidentId(newId);
    // The log belongs to the SHIFT, not the job — a control room keeps one.
    setLog((prev) => [
      ...prev,
      {
        id: `open:${t}`,
        timestamp: t,
        kind: "incident_opened",
        message: `Incident opened — ${scenario.title}`,
      },
    ]);
    setIncidentPanelVisible(true);
    // Caller stays on the line from the moment we answer the call until
    // the first crew lands on scene. Scenarios with no authored script
    // still get the banner briefly, since informantOnCall drives the UI.
  }

  function refuel(applianceId: string) {
    setVehicleGauges((prev) => ({
      ...prev,
      [applianceId]: {
        fuelPct: 100,
        waterPct: prev[applianceId]?.waterPct ?? 100,
        conditionPct: prev[applianceId]?.conditionPct ?? 100,
      },
    }));
  }

  function refillWater(applianceId: string) {
    setVehicleGauges((prev) => ({
      ...prev,
      [applianceId]: {
        fuelPct: prev[applianceId]?.fuelPct ?? 100,
        waterPct: 100,
        conditionPct: prev[applianceId]?.conditionPct ?? 100,
      },
    }));
  }

  function sendToMaintenance(applianceId: string) {
    const startedAt = Date.now();
    const durationSec = 30 * 60;
    setPreShiftStates((prev) => ({
      ...prev,
      [applianceId]: {
        status: 8,
        reason: "Maintenance — workshops",
        availableAt: startedAt + durationSec * 1000,
      },
    }));
    // Restore gauges at the start of maintenance.
    setVehicleGauges((prev) => ({
      ...prev,
      [applianceId]: { fuelPct: 100, waterPct: 100, conditionPct: 100 },
    }));
    setLog((prev) => [
      ...prev,
      {
        id: `maint:${applianceId}:${startedAt}`,
        timestamp: startedAt,
        kind: "refuel_complete",
        message: `${applianceLabel(applianceId)} to workshops for maintenance · 30 min off the run`,
      },
    ]);
  }

  function standDownForWelfare(applianceId: string) {
    const startedAt = Date.now();
    const durationSec = 15 * 60;
    const endsAt = startedAt + durationSec * 1000;
    setDeployments((prev) =>
      prev.map((d) =>
        d.applianceId === applianceId
          ? {
              ...d,
              welfareStartedAt: startedAt,
              welfareEndsAt: endsAt,
              welfareCount: (d.welfareCount ?? 0) + 1,
              lastWelfareAt: startedAt,
            }
          : d,
      ),
    );
    // Welfare break resets crew fatigue for this appliance — the whole
    // point of standing down is to recover.
    setFatigueByApplianceId((prev) => ({ ...prev, [applianceId]: 0 }));
    setLog((prev) => [
      ...prev,
      {
        id: `welfare:${applianceId}:${startedAt}`,
        timestamp: startedAt,
        kind: "welfare_break",
        message: `${applianceLabel(applianceId)} stood down for welfare · 15 min`,
      },
    ]);
  }

  /** Stand down a deployed appliance — cancel its participation in this
   *  incident and send it back to station. Works en route (turn around) or
   *  at scene (leave the incident). Any active tasks the appliance owns are
   *  aborted. The ambulance hospital leg is NOT triggered here — this is
   *  "not needed", not "conveying". For that, resolve the incident.
   *
   *  Divert-to-other-incident will reuse this function's plumbing once the
   *  sim supports multiple active incidents. */
  async function standDownAppliance(applianceId: string) {
    if (!activeIncident) return;
    const d = deployments.find((x) => x.applianceId === applianceId);
    if (!d) return;
    if (d.returnStartedAt) return; // already returning
    const station = findStationForAppliance(applianceId);
    if (!station) return;
    const now = Date.now();
    // Turn-around estimate: routed ETA from incident to station. For an
    // en-route appliance this slightly overshoots reality (they'd turn
    // around mid-trip), but it's a tolerable simplification — the operator
    // still sees a live countdown.
    const r = await routeEta(activeIncident.scenario.location.coords, station.coords);
    const returnArrivesAt = now + r.seconds * 1000;
    const rehabSeconds = Math.round(10 * 60 + Math.random() * 5 * 60);
    setDeployments((prev) =>
      prev.map((x) =>
        x.applianceId === applianceId
          ? {
              ...x,
              returnStartedAt: now,
              returnEtaSeconds: r.seconds,
              returnArrivesAt,
              returnRouteMeters: r.meters,
              returnRouteCoords: r.coords ?? undefined,
              rehabSeconds,
              rehabUntil: returnArrivesAt + rehabSeconds * 1000,
            }
          : x,
      ),
    );
    // Abort any active tasks this appliance owns so the scene state stays
    // consistent (e.g. BA wearers withdrawn, hydrant freed).
    setTasks((prev) =>
      prev.map((t) =>
        t.applianceId === applianceId && t.state === "active"
          ? { ...t, state: "aborted" }
          : t,
      ),
    );
    setLog((prev) => [
      ...prev,
      {
        id: `sd:${applianceId}:${now}`,
        timestamp: now,
        kind: "returning",
        message: `${applianceLabel(applianceId)} stood down · RTB`,
      },
    ]);
  }

  function findStationForAppliance(applianceId: string) {
    for (const area of ["Southern", "Eastern", "Western", "ForceWide"] as const) {
      for (const s of stationsByArea[area]) {
        if (s.appliances.some((a) => a.id === applianceId)) return s;
      }
    }
    return undefined;
  }

  /** Pair an ambulance with a casualty for treatment — or pass casualtyId
   *  = null to break an existing pairing. Each ambulance can treat one
   *  casualty at a time, but a single casualty can be paired to many
   *  ambulances simultaneously (a DCA already treating can have an AP /
   *  CCC / HEMS join them). The highest scope on the patient unlocks its
   *  intervention set. Deterioration pauses as soon as *any* paramedic
   *  is paired. */
  function setTreatingCasualty(applianceId: string, casualtyId: string | null) {
    setDeployments((prev) =>
      prev.map((d) =>
        d.applianceId === applianceId ? { ...d, treatingCasualtyId: casualtyId } : d,
      ),
    );
    if (casualtyId) {
      // First time we pair this casualty, seed an empty treatment record
      // so the Treatment tab can start mutating state immediately.
      setTreatmentByCasualtyId((prev) =>
        prev[casualtyId]
          ? prev
          : {
              ...prev,
              [casualtyId]: emptyTreatmentState(casualtyId),
            },
      );
      setLog((prev) => [
        ...prev,
        {
          id: `tx:${applianceId}:${casualtyId}:${Date.now()}`,
          timestamp: Date.now(),
          kind: "casualty_treatment_started",
          message: `${applianceLabel(applianceId)} treating casualty ${casualtyId}`,
        },
      ]);
    } else {
      setLog((prev) => [
        ...prev,
        {
          id: `txu:${applianceId}:${Date.now()}`,
          timestamp: Date.now(),
          kind: "casualty_treatment_ended",
          message: `${applianceLabel(applianceId)} released casualty pairing`,
        },
      ]);
    }
  }

  // ---- Treatment handlers ------------------------------------------------
  // Each handler appends to the casualty's treatment record and emits a
  // SITREP entry. Scope checks are done in the UI; these just persist.

  function updateTreatment(
    casualtyId: string,
    mutator: (prev: PatientTreatmentState) => PatientTreatmentState,
  ) {
    setTreatmentByCasualtyId((prev) => {
      const current = prev[casualtyId] ?? emptyTreatmentState(casualtyId);
      return { ...prev, [casualtyId]: mutator(current) };
    });
  }

  function startPatientSurvey(casualtyId: string) {
    const at = Date.now();
    updateTreatment(casualtyId, (p) => ({
      ...p,
      surveyStartedAt: at,
      events: [...p.events, { kind: "survey_started", at }],
    }));
    // Survey completes after 60 s — scheduled via a timeout so the sim
    // doesn't have to poll. On completion we reveal the authored clinical.
    setTimeout(() => {
      if (!activeIncident) return;
      const casualty = activeIncident.scenario.scene?.casualties?.find(
        (c) => c.id === casualtyId,
      );
      const clinical = casualty?.clinical ?? defaultClinicalFor(casualty?.severity ?? "serious");
      const completedAt = Date.now();
      updateTreatment(casualtyId, (p) => ({
        ...p,
        surveyCompletedAt: completedAt,
        revealedVitals: clinical.vitals,
        revealedCondition: clinical.presumedCondition,
        revealedRedFlags: clinical.redFlags,
        preferredDestination: clinical.preferredDestination,
        liveVitals: { ...clinical.vitals },
        prevLiveVitals: { ...clinical.vitals },
        liveVitalsLastTickAt: completedAt,
        activeRedFlags: [...clinical.redFlags],
        events: [...p.events, { kind: "survey_completed", at: completedAt }],
      }));
    }, 60_000);
  }

  function applyAirway(casualtyId: string, action: AirwayAction, by: string) {
    const at = Date.now();
    updateTreatment(casualtyId, (p) => ({
      ...p,
      airway: { ...p.airway, [action]: at },
      events: [...p.events, { kind: "airway", action, at, by }],
    }));
  }
  function applyBreathing(casualtyId: string, action: BreathingAction, by: string) {
    const at = Date.now();
    updateTreatment(casualtyId, (p) => ({
      ...p,
      breathing: { ...p.breathing, [action]: at },
      events: [...p.events, { kind: "breathing", action, at, by }],
    }));
  }
  function applyCirculation(casualtyId: string, action: CirculationAction, by: string) {
    const at = Date.now();
    updateTreatment(casualtyId, (p) => ({
      ...p,
      circulation: { ...p.circulation, [action]: at },
      events: [...p.events, { kind: "circulation", action, at, by }],
    }));
  }

  // --- Resuscitation ------------------------------------------------------
  // The arrest board. Each of these is a single, deliberate act on the
  // patient, so they all stamp the resus event log; the ALS clock itself
  // is advanced by the tick above.

  /** Open a resus record for a casualty in arrest. The underlying rhythm
   *  is rolled once, here, and stays hidden until a monitor goes on. */
  function ensureResus(casualtyId: string) {
    setResusByCasualtyId((prev) => {
      if (prev[casualtyId]) return prev;
      // Roughly 40% of out-of-hospital arrests present shockable when a
      // crew first gets a monitor on. Director mode forces the dramatic
      // side for filming.
      const shockableRoll = rollBeat(0.4);
      const rhythm: ArrestRhythm = shockableRoll
        ? Math.random() < 0.85
          ? "vf"
          : "pvt"
        : Math.random() < 0.6
          ? "asystole"
          : "pea";
      return { ...prev, [casualtyId]: newResusState(casualtyId, Date.now(), rhythm) };
    });
  }

  function updateResus(casualtyId: string, fn: (s: ResusState) => ResusState) {
    setResusByCasualtyId((prev) => {
      const cur = prev[casualtyId];
      if (!cur) return prev;
      return { ...prev, [casualtyId]: fn(cur) };
    });
  }

  function resusEvent(s: ResusState, text: string, tone: ResusState["events"][number]["tone"]) {
    return [...s.events, { at: Date.now(), text, tone }];
  }

  function attachMonitor(casualtyId: string, monitor: MonitorMode) {
    updateResus(casualtyId, (s) => ({
      ...s,
      monitor,
      events: resusEvent(s, `${monitor === "pads" ? "Defib pads" : monitor === "lead_3" ? "3-lead ECG" : "12-lead ECG"} attached`, "action"),
    }));
  }

  /** Set the oxygen delivery. Recorded on the treatment state so the
   *  vitals engine drives the saturation toward what that device and flow
   *  can hold, in both directions. */
  function setOxygen(
    casualtyId: string,
    device: OxygenDevice,
    flowLpm: number,
    by: string,
  ) {
    const at = Date.now();
    updateTreatment(casualtyId, (p) => ({
      ...p,
      oxygen: { device, flowLpm, at },
      // Keep the legacy A-B-C tick in step so the timeline and debrief
      // still register that oxygen was given at all.
      breathing:
        device === "none"
          ? p.breathing
          : { ...p.breathing, oxygen_15l: p.breathing.oxygen_15l ?? at },
      events: [
        ...p.events,
        {
          kind: "breathing" as const,
          action: "oxygen_15l" as const,
          at,
          by,
        },
      ],
    }));
  }

  function setResusAirway(casualtyId: string, airway: "igel" | "ett", by: string) {
    updateResus(casualtyId, (s) => ({
      ...s,
      airway,
      events: resusEvent(
        s,
        airway === "igel"
          ? "i-gel inserted — continuous compressions, ventilate at 10/min"
          : "Intubated — continuous compressions, ventilate at 10/min",
        "action",
      ),
    }));
    // Keep the A-B-C record in step so the rest of the treatment tab and
    // the debrief see the airway too.
    applyAirway(casualtyId, airway === "igel" ? "igel" : "rsi", by);
  }

  function toggleCapnography(casualtyId: string) {
    updateResus(casualtyId, (s) => ({
      ...s,
      capnographyOn: !s.capnographyOn,
      events: resusEvent(
        s,
        s.capnographyOn ? "Capnography removed" : "Waveform capnography attached",
        "action",
      ),
    }));
  }

  function setCompressor(
    casualtyId: string,
    crew: { id: string; name: string; role: string },
  ) {
    updateResus(casualtyId, (s) => {
      if (s.compressorCrewId === crew.id) return s;
      const swapping = s.compressorCrewId !== undefined;
      return {
        ...s,
        compressorCrewId: crew.id,
        compressorName: crew.name,
        compressorSinceAt: Date.now(),
        events: resusEvent(
          s,
          swapping
            ? `Compressor swapped — ${crew.name} (${crew.role}) on the chest`
            : `${crew.name} (${crew.role}) on the chest`,
          "action",
        ),
      };
    });
  }

  function fitLucas(casualtyId: string) {
    updateResus(casualtyId, (s) => ({
      ...s,
      lucasFittedAt: Date.now(),
      events: resusEvent(
        s,
        `LUCAS being fitted — compressions paused ~${LUCAS_FIT_SEC}s`,
        "action",
      ),
    }));
  }

  function deliverShock(casualtyId: string) {
    updateResus(casualtyId, (s) => {
      const j = shockJoules(s.shocks + 1);
      return {
        ...s,
        shocks: s.shocks + 1,
        lastShockAt: Date.now(),
        events: resusEvent(s, `Shock ${s.shocks + 1} delivered — ${j} J`, "critical"),
      };
    });
  }

  function movePads(casualtyId: string) {
    updateResus(casualtyId, (s) => ({
      ...s,
      padPosition: "antero_posterior",
      events: resusEvent(s, "Fresh pads — anterior-posterior for refractory VF", "action"),
    }));
  }

  function giveArrestAdrenaline(casualtyId: string, by: string) {
    updateResus(casualtyId, (s) => ({
      ...s,
      adrenalineDoses: s.adrenalineDoses + 1,
      lastAdrenalineAt: Date.now(),
      events: resusEvent(s, `Adrenaline 1 mg IV — dose ${s.adrenalineDoses + 1}`, "action"),
    }));
    administerDrug(casualtyId, "adrenaline_cpr", by);
  }

  function giveAmiodarone(casualtyId: string, by: string) {
    updateResus(casualtyId, (s) => ({
      ...s,
      amiodaroneDoses: s.amiodaroneDoses + 1,
      events: resusEvent(s, `Amiodarone ${amiodaroneDoseMg(s)} mg IV`, "action"),
    }));
    administerDrug(casualtyId, "amiodarone", by);
  }

  function suspectReversible(casualtyId: string, cause: ReversibleCause) {
    updateResus(casualtyId, (s) => ({
      ...s,
      reversibles: { ...s.reversibles, [cause]: "suspected" },
      events: resusEvent(s, `Reversible cause suspected — ${cause.replace(/_/g, " ")}`, "info"),
    }));
  }

  function treatReversible(casualtyId: string, cause: ReversibleCause) {
    updateResus(casualtyId, (s) => ({
      ...s,
      reversibles: { ...s.reversibles, [cause]: "treated" },
      events: resusEvent(s, `Reversible cause treated — ${cause.replace(/_/g, " ")}`, "good"),
    }));
  }

  function stopResus(casualtyId: string) {
    updateResus(casualtyId, (s) => ({
      ...s,
      roleAt: Date.now(),
      events: resusEvent(s, "Resuscitation discontinued — life recognised extinct", "critical"),
    }));
  }
  function administerDrug(casualtyId: string, drug: DrugName, by: string) {
    const at = Date.now();
    updateTreatment(casualtyId, (p) => ({
      ...p,
      drugs: { ...p.drugs, [drug]: at },
      events: [...p.events, { kind: "drug", drug, at, by }],
    }));
  }
  function applyPackaging(casualtyId: string, action: PackagingAction, by: string) {
    const at = Date.now();
    updateTreatment(casualtyId, (p) => ({
      ...p,
      packaging: { ...p.packaging, [action]: at },
      events: [...p.events, { kind: "packaging", action, at, by }],
    }));
  }
  function setTreatmentDestination(
    casualtyId: string,
    type: HospitalDestinationType,
    name: string,
  ) {
    const at = Date.now();
    updateTreatment(casualtyId, (p) => ({
      ...p,
      chosenDestination: { type, name, at },
      events: [...p.events, { kind: "destination_set", destination: type, name, at }],
    }));
  }
  /** Request an additional clinician (AP/CCC/BASICS/HEMS) for a specific
   *  casualty. Finds the closest-available appliance whose type maps to
   *  that scope and deploys it via the normal deployAppliance path, so
   *  it inherits ETAs, blue-light factor, pairing carry-through. */
  function requestClinician(
    scope: "ap" | "ccc" | "basics" | "hems",
    casualtyId: string,
  ) {
    if (!activeIncident) return;
    // HEMS has two response modes, mirroring how NWAA actually covers
    // the region:
    //   • Daylight + flyable weather → the airframe launches from Barton.
    //     It holds overhead until the operator confirms a landing zone on
    //     the ground view; only then does it land and the doctor + CCP
    //     walk in.
    //   • Darkness / grounding weather → the NWAA critical-care car
    //     responds by road from the same base — same doctor-paramedic
    //     team, no aircraft, no LZ needed.
    if (scope === "hems") {
      const hemsStation = allDeployableStations.find((s) => s.id === "A-HEMS");
      const flyable = hemsAvailable(weather);
      const isFree = (a: Appliance) =>
        a.status === 7 && !deployments.some((d) => d.applianceId === a.id);

      if (!flyable) {
        const car = hemsStation?.appliances.find(
          (a) => a.type === "CCC" && isFree(a),
        );
        if (!car) {
          setLog((prev) => [
            ...prev,
            {
              id: `reqc:hemsgrd:${Date.now()}`,
              timestamp: Date.now(),
              kind: "annotation",
              message: `HEMS grounded (${weather.summary}) and the NWAA critical care car is unavailable — consider BASICS.`,
            },
          ]);
          return;
        }
        const eta = etas["A-HEMS"];
        if (!eta) {
          setLog((prev) => [
            ...prev,
            {
              id: `reqc:noeta:${Date.now()}`,
              timestamp: Date.now(),
              kind: "annotation",
              message: "NWAA car ETA not yet computed — try again in a moment",
            },
          ]);
          return;
        }
        deployAppliance({
          applianceId: car.id,
          slotId: "clinician:hems",
          etaSeconds: eta.seconds,
          routeMeters: eta.meters,
          routeCoords: eta.coords ?? undefined,
        });
        setDeployments((prev) =>
          prev.map((d) =>
            d.applianceId === car.id
              ? { ...d, treatingCasualtyId: casualtyId, hemsNightCar: true }
              : d,
          ),
        );
        updateTreatment(casualtyId, (p) => ({
          ...p,
          events: [...p.events, { kind: "clinician_requested", scope, at: Date.now() }],
        }));
        setLog((prev) => [
          ...prev,
          {
            id: `reqc:hemscar:${Date.now()}`,
            timestamp: Date.now(),
            kind: "annotation",
            message: `HEMS aircraft grounded (${weather.summary}) — NWAA critical care car ${car.callsign} responding by road, doctor + critical care paramedic on board · ETA ${Math.round(eta.seconds / 60)} min`,
          },
        ]);
        return;
      }

      const heli = hemsStation?.appliances.find(
        (a) => a.type === "HEMS" && isFree(a),
      );
      if (!heli || !hemsStation) {
        setLog((prev) => [
          ...prev,
          {
            id: `reqc:noavail:${Date.now()}`,
            timestamp: Date.now(),
            kind: "annotation",
            message: "No HEMS airframe available to request",
          },
        ]);
        return;
      }
      const base = hemsStation.coords;
      const target = activeIncident.scenario.location.coords;
      const meters = haversineMeters(base, target);
      // H145: ~3 min lift, ~130 kt cruise (≈67 m/s).
      const flightSec = Math.round(180 + meters / 67);
      const now = Date.now();
      deployAppliance({
        applianceId: heli.id,
        slotId: "clinician:hems",
        etaSeconds: flightSec,
        routeMeters: Math.round(meters),
        routeCoords: [
          [base.lat, base.lng],
          [target.lat, target.lng],
        ],
      });
      setDeployments((prev) =>
        prev.map((d) =>
          d.applianceId === heli.id
            ? {
                ...d,
                treatingCasualtyId: casualtyId,
                // Block "in attendance" until the operator confirms an LZ —
                // the aircraft holds overhead from overheadAt onwards.
                arrivesAt: now + flightSec * 1000 + 6 * 3600 * 1000,
                hemsFlight: { overheadAt: now + flightSec * 1000, landingSec: 90 },
              }
            : d,
        ),
      );
      updateTreatment(casualtyId, (p) => ({
        ...p,
        events: [...p.events, { kind: "clinician_requested", scope, at: Date.now() }],
      }));
      setLog((prev) => [
        ...prev,
        {
          id: `reqc:hemsair:${Date.now()}`,
          timestamp: Date.now(),
          kind: "annotation",
          message: `${heli.callsign} lifting from Barton — overhead in ~${Math.max(1, Math.round(flightSec / 60))} min. Select a landing zone on the ground view before it can land.`,
        },
      ]);
      return;
    }
    const wantedTypes: import("@/lib/sim/types").ApplianceTypeCode[] =
      scope === "ap"
        ? ["QR"]
        : scope === "ccc"
          ? ["CCC"]
          : ["BASICS"]; // basics
    // Find the closest free appliance of the wanted type with an ETA.
    const candidates = allDeployableStations
      .flatMap((s) =>
        s.appliances
          .filter((a) => wantedTypes.includes(a.type))
          .filter((a) => a.status === 7 && a.crew.current >= a.crew.min)
          .map((a) => ({ appliance: a, stationId: s.id })),
      )
      .filter(({ appliance }) =>
        !deployments.some((d) => d.applianceId === appliance.id),
      );
    if (candidates.length === 0) {
      setLog((prev) => [
        ...prev,
        {
          id: `reqc:noavail:${Date.now()}`,
          timestamp: Date.now(),
          kind: "annotation",
          message: `No ${scope.toUpperCase()} available to request`,
        },
      ]);
      return;
    }
    // Use the already-computed ETAs if available; otherwise take the
    // first candidate and let the dispatch ETA path fill in later.
    const sorted = candidates.sort((a, b) => {
      const ea = etas[a.stationId]?.seconds ?? 9999;
      const eb = etas[b.stationId]?.seconds ?? 9999;
      return ea - eb;
    });
    const picked = sorted[0];
    const eta = etas[picked.stationId];
    if (!eta) {
      setLog((prev) => [
        ...prev,
        {
          id: `reqc:noeta:${Date.now()}`,
          timestamp: Date.now(),
          kind: "annotation",
          message: `${scope.toUpperCase()} ETA not yet computed — try again in a moment`,
        },
      ]);
      return;
    }
    deployAppliance({
      applianceId: picked.appliance.id,
      slotId: `clinician:${scope}`,
      etaSeconds: eta.seconds,
      routeMeters: eta.meters,
      routeCoords: eta.coords ?? undefined,
    });
    // Auto-pair the clinician with the same casualty so their scope
    // unlocks in the Treatment tab the moment they arrive.
    setDeployments((prev) =>
      prev.map((d) =>
        d.applianceId === picked.appliance.id
          ? { ...d, treatingCasualtyId: casualtyId }
          : d,
      ),
    );
    updateTreatment(casualtyId, (p) => ({
      ...p,
      events: [...p.events, { kind: "clinician_requested", scope, at: Date.now() }],
    }));
    setLog((prev) => [
      ...prev,
      {
        id: `reqc:${scope}:${Date.now()}`,
        timestamp: Date.now(),
        kind: "annotation",
        message: `${scope.toUpperCase()} requested for casualty ${casualtyId} — ${picked.appliance.callsign} mobilising · ETA ${Math.round(eta.seconds)}s`,
      },
    ]);
  }

  function sendAtmistPrealert(casualtyId: string) {
    const at = Date.now();
    updateTreatment(casualtyId, (p) => ({
      ...p,
      atmistSentAt: at,
      events: [...p.events, { kind: "atmist_sent", at }],
    }));
    setLog((prev) => [
      ...prev,
      {
        id: `atmist:${casualtyId}:${at}`,
        timestamp: at,
        kind: "annotation",
        message: `ATMIST pre-alert sent · casualty ${casualtyId}`,
      },
    ]);
  }

  /** Convey a specific casualty to hospital using the chosen on-scene
   *  ambulance. Flips that deployment into its hospital leg immediately —
   *  independent of resolveIncident (which handles the end-of-incident
   *  mass wrap-up). Use after ATMIST has been sent.
   *
   *  Other deployments paired to the same casualty are unpaired — the
   *  patient is physically leaving the scene with one crew; any AP / CCC
   *  left behind can re-pair to a different casualty. */
  async function conveyCasualtyVia(applianceId: string, casualtyId: string) {
    if (!activeIncident) return;
    const d = deployments.find((x) => x.applianceId === applianceId);
    if (!d) return;
    if (d.hospitalLegStartedAt) return; // already conveying
    const station = findStationForAppliance(applianceId);
    if (!station) return;
    // Stretcher rule — only a DCA or the air ambulance can convey. An RRV
    // or critical-care car brings the clinician, never the ride.
    const conveyor = station.appliances.find((a) => a.id === applianceId);
    if (!conveyor || (conveyor.type !== "DCA" && conveyor.type !== "HEMS")) {
      setLog((prev) => [
        ...prev,
        {
          id: `noconvey:${Date.now()}`,
          timestamp: Date.now(),
          kind: "setback",
          message: `${applianceLabel(applianceId)} cannot convey — no stretcher. Pair a DCA (or the air ambulance) for the hospital leg.`,
        },
      ]);
      return;
    }
    const incidentCoords = activeIncident.scenario.location.coords;
    const hospital = nearestHospital(incidentCoords);
    const now = Date.now();
    const [toHosp, toStation] = await Promise.all([
      // Hospital leg runs on blues at ambulance (box-body) pace.
      routeEta(incidentCoords, hospital.coords).then((r) => blueLightFor(r, "DCA")),
      routeEta(hospital.coords, station.coords),
    ]);
    const offloadSec = rollOffloadSeconds();
    const hospitalArrivesAt = now + toHosp.seconds * 1000;
    const offloadEndsAt = hospitalArrivesAt + offloadSec * 1000;
    const returnArrivesAt = offloadEndsAt + toStation.seconds * 1000;
    const rehabSeconds = Math.round(20 * 60 + Math.random() * 10 * 60);
    setDeployments((prev) =>
      prev.map((x) => {
        // This is the conveying vehicle — start hospital leg, keep pairing.
        if (x.applianceId === applianceId) {
          return {
            ...x,
            hospitalId: hospital.id,
            hospitalName: hospital.name,
            hospitalCoords: hospital.coords,
            hospitalLegStartedAt: now,
            hospitalEtaSeconds: toHosp.seconds,
            hospitalArrivesAt,
            hospitalRouteCoords: toHosp.coords ?? undefined,
            offloadSeconds: offloadSec,
            offloadEndsAt,
            returnStartedAt: offloadEndsAt,
            returnEtaSeconds: toStation.seconds,
            returnArrivesAt,
            returnRouteMeters: toStation.meters,
            returnRouteCoords: toStation.coords ?? undefined,
            rehabSeconds,
            rehabUntil: returnArrivesAt + rehabSeconds * 1000,
            treatingCasualtyId: casualtyId,
          };
        }
        // Other deployments paired to this casualty — patient is gone from
        // scene, release them to pair with someone else.
        if (x.treatingCasualtyId === casualtyId) {
          return { ...x, treatingCasualtyId: null };
        }
        return x;
      }),
    );
    setLog((prev) => [
      ...prev,
      {
        id: `convey:${applianceId}:${casualtyId}:${now}`,
        timestamp: now,
        kind: "casualty_treatment_ended",
        message: `${applianceLabel(applianceId)} conveying casualty to ${hospital.name} · ETA ${Math.round(toHosp.seconds / 60)}m`,
      },
    ]);
  }

  function deployAppliance(args: {
    applianceId: string;
    slotId: string;
    etaSeconds: number;
    routeMeters?: number;
    routeCoords?: [number, number][];
    selectedPodType?: import("@/lib/sim/types").PodTypeCode;
  }) {
    if (!activeIncident) return;
    const mobilisedAt = Date.now();
    dispatchBeep();
    bumpStats((s) => {
      s.resourcesAllocated += 1;
      if (deployments.length === 0) {
        s.firstAllocSumSec += Math.max(0, (mobilisedAt - activeIncident.receivedAt) / 1000);
        s.firstAllocCount += 1;
      }
    });
    // Find the appliance so we can pre-populate a sensible default crew
    // loadout by role — the operator can swap kit in the Crew tab later.
    // Use the full deployable pool so out-of-patch specialists resolve too.
    const appliance = allDeployableStations
      .flatMap((s) => s.appliances)
      .find((a) => a.id === args.applianceId);
    const crewEquipment: Record<string, string[]> = {};
    if (appliance) {
      // Seed only what this vehicle actually carries, one holder per
      // one-per-appliance item, and within each rider's hand budget —
      // otherwise a rider steps off holding phantom kit that has no
      // toggle in the Crew tab and no way to put down.
      const claimed = new Set<string>();
      for (const m of appliance.crewMembers) {
        const wanted = defaultLoadoutFor(m.role).filter((item) => {
          if (!applianceCarries(appliance, item)) return false;
          if (APPLIANCE_SINGLETONS.has(item)) {
            if (claimed.has(item)) return false;
            claimed.add(item);
          }
          return true;
        });
        crewEquipment[m.id] = applyLoadout(wanted).items;
      }
    }
    // The board's ETAs are priced at the fleet-average blue-light factor;
    // rescale to what THIS vehicle class actually does on blues (bike <
    // car < ambulance < pump < aerial). Aircraft rescale as a no-op.
    let etaSeconds = appliance
      ? rescaleBlueLightSeconds(args.etaSeconds, appliance.type)
      : args.etaSeconds;

    // Day-crewed stations: outside crewed hours the crew respond from
    // home on alerters before the vehicle turns a wheel.
    const mobStation = appliance ? findStationForAppliance(appliance.id) : undefined;
    const pagerSec = pagerDelaySec(mobStation?.staffing, mobilisedAt, appliance?.id);
    if (pagerSec > 0) etaSeconds += pagerSec;

    // Aircraft fly direct — never hand them the road polyline the station
    // ETA sweep priced. Replace route + timing with the flight model, and
    // for HEMS gate arrival on the operator confirming a landing zone.
    let routeMeters = args.routeMeters;
    let routeCoords = args.routeCoords;
    let arrivesAt = mobilisedAt + etaSeconds * 1000;
    let hemsFlight: Deployment["hemsFlight"];
    const isAircraft = appliance?.type === "HEMS" || appliance?.type === "Police_NPAS";
    if (isAircraft && appliance) {
      const base = findStationForAppliance(appliance.id)?.coords;
      const target = activeIncident.scenario.location.coords;
      if (base) {
        const meters = haversineMeters(base, target);
        // H145 / EC135: ~3 min lift, ~130 kt cruise (≈67 m/s).
        etaSeconds = Math.round(180 + meters / 67);
        routeMeters = Math.round(meters);
        routeCoords = [
          [base.lat, base.lng],
          [target.lat, target.lng],
        ];
        arrivesAt = mobilisedAt + etaSeconds * 1000;
        if (appliance.type === "HEMS") {
          // Hold overhead until an LZ is confirmed via the placement flow.
          hemsFlight = { overheadAt: arrivesAt, landingSec: 90 };
          arrivesAt += 6 * 3600 * 1000;
        }
      }
    }
    setDeployments((prev) => [
      ...prev,
      {
        applianceId: args.applianceId,
        incidentId: activeIncident.id,
        slotId: args.slotId,
        mobilisedAt,
        etaSeconds,
        arrivesAt,
        routeMeters,
        routeCoords,
        lightState: "999",
        crewEquipment,
        selectedPodType: args.selectedPodType,
        hemsFlight,
      },
    ]);
    setStatusOverrides((prev) => ({ ...prev, [args.applianceId]: 1 }));
    setLog((prev) => [
      ...prev,
      {
        id: `mob:${args.applianceId}:${mobilisedAt}`,
        timestamp: mobilisedAt,
        kind: "mobilised",
        message: `Mobilised ${applianceLabel(args.applianceId)}${
          args.selectedPodType ? ` carrying ${args.selectedPodType}` : ""
        } · ETA ${fmtSec(etaSeconds)}${
          pagerSec > 0
            ? ` — day-crewed station, crew responding on alerters (+${fmtSec(pagerSec)} turnout)`
            : ""
        }`,
      },
    ]);

    // Just-in-time road geometry. The station-wide ETA sweep degrades to
    // straight-line estimates when the routing provider rate-limits, so a
    // unit could otherwise animate point-to-point across the map. Any
    // deployment that mobilised without a real polyline fetches its own
    // route now (a single request, so it's never rate-limited away) and
    // patches the geometry in — timing is left untouched to avoid ETA
    // jumps mid-run. Aircraft are excluded — their straight line IS the route.
    if (!isAircraft && (!args.routeCoords || args.routeCoords.length < 2)) {
      const station = findStationForAppliance(args.applianceId);
      const target = activeIncident.scenario.location.coords;
      if (station) {
        void routeEta(station.coords, target)
          .then((r) => {
            if (!r.coords || r.coords.length < 2) return;
            setDeployments((prev) =>
              prev.map((d) =>
                d.applianceId === args.applianceId && d.mobilisedAt === mobilisedAt
                  ? { ...d, routeCoords: r.coords!, routeMeters: r.meters }
                  : d,
              ),
            );
          })
          .catch(() => {});
      }
    }
  }

  async function resolveIncident() {
    if (!activeIncident || outcome) return;
    const resolvedAt = Date.now();
    const incidentCoords = activeIncident.scenario.location.coords;
    // Include every station (all patches + ForceWide) so return legs for
    // out-of-patch specialists can still be computed — they still go home.
    const stations = patch
      ? [
          ...stationsByArea.Southern,
          ...stationsByArea.Eastern,
          ...stationsByArea.Western,
          ...stationsByArea.ForceWide,
        ]
      : [];

    // For each deployment, compute the return leg. Ambulances go via the
    // nearest hospital (route incident → hospital, offload window, route
    // hospital → station). Other services return direct.
    type Leg = {
      id: string;
      service: "Fire" | "Ambulance" | "Police";
      hospital?: {
        id: string;
        name: string;
        coords: { lat: number; lng: number };
        toSeconds: number;
        toCoords: [number, number][] | null;
        offloadSec: number;
      };
      returnSeconds: number;
      returnMeters: number;
      returnCoords: [number, number][] | null;
    };
    const legs: Leg[] = await Promise.all(
      deployments.map(async (d): Promise<Leg> => {
        const station = stations.find((s) =>
          s.appliances.some((a) => a.id === d.applianceId),
        );
        const appliance = station?.appliances.find((a) => a.id === d.applianceId);
        const service = appliance?.service ?? "Fire";

        if (!station) {
          return {
            id: d.applianceId,
            service,
            returnSeconds: 60,
            returnMeters: 0,
            returnCoords: null,
          };
        }

        if (service === "Ambulance") {
          const hospital = nearestHospital(incidentCoords);
          // Conveying a patient — blue lights on the incident → hospital leg
          // at ambulance (box-body) pace. Return to station is a normal
          // driving leg once the crew clear.
          const [toHosp, toStation] = await Promise.all([
            routeEta(incidentCoords, hospital.coords).then((r) => blueLightFor(r, "DCA")),
            routeEta(hospital.coords, station.coords),
          ]);
          return {
            id: d.applianceId,
            service,
            hospital: {
              id: hospital.id,
              name: hospital.name,
              coords: hospital.coords,
              toSeconds: toHosp.seconds,
              toCoords: toHosp.coords,
              offloadSec: rollOffloadSeconds(),
            },
            returnSeconds: toStation.seconds,
            returnMeters: toStation.meters,
            returnCoords: toStation.coords,
          };
        }

        const r = await routeEta(incidentCoords, station.coords);
        return {
          id: d.applianceId,
          service,
          returnSeconds: r.seconds,
          returnMeters: r.meters,
          returnCoords: r.coords,
        };
      }),
    );
    const byId = new Map(legs.map((l) => [l.id, l]));
    setDeployments((prev) =>
      prev.map((d) => {
        const l = byId.get(d.applianceId);
        if (!l) return d;
        const rehabSeconds = Math.round(20 * 60 + Math.random() * 10 * 60);
        if (l.hospital) {
          const hospitalArrivesAt = resolvedAt + l.hospital.toSeconds * 1000;
          const offloadEndsAt = hospitalArrivesAt + l.hospital.offloadSec * 1000;
          const returnStartedAt = offloadEndsAt;
          const returnArrivesAt = returnStartedAt + l.returnSeconds * 1000;
          return {
            ...d,
            hospitalId: l.hospital.id,
            hospitalName: l.hospital.name,
            hospitalCoords: l.hospital.coords,
            hospitalLegStartedAt: resolvedAt,
            hospitalEtaSeconds: l.hospital.toSeconds,
            hospitalArrivesAt,
            hospitalRouteCoords: l.hospital.toCoords ?? undefined,
            offloadSeconds: l.hospital.offloadSec,
            offloadEndsAt,
            returnStartedAt,
            returnEtaSeconds: l.returnSeconds,
            returnArrivesAt,
            returnRouteMeters: l.returnMeters,
            returnRouteCoords: l.returnCoords ?? undefined,
            rehabSeconds,
            rehabUntil: returnArrivesAt + rehabSeconds * 1000,
          };
        }
        // Fire / other: direct return
        const returnArrivesAt = resolvedAt + l.returnSeconds * 1000;
        return {
          ...d,
          returnStartedAt: resolvedAt,
          returnEtaSeconds: l.returnSeconds,
          returnArrivesAt,
          returnRouteMeters: l.returnMeters,
          returnRouteCoords: l.returnCoords ?? undefined,
          rehabSeconds,
          rehabUntil: returnArrivesAt + rehabSeconds * 1000,
        };
      }),
    );
    // Apply wear-and-tear per deployed appliance: fuel -20%, water -20% (if
    // pump), condition -3%. Refuel/refill/maintenance actions reset these.
    setVehicleGauges((prev) => {
      const next = { ...prev };
      for (const d of deployments) {
        const current = next[d.applianceId] ?? { fuelPct: 100, waterPct: 100, conditionPct: 100 };
        next[d.applianceId] = {
          fuelPct: Math.max(0, current.fuelPct - 20),
          waterPct: Math.max(0, current.waterPct - 20),
          conditionPct: Math.max(0, current.conditionPct - 3),
        };
      }
      return next;
    });

    setActiveIncident((inc) => (inc ? { ...inc, resolvedAt } : inc));
    setLog((prev) => [
      ...prev,
      {
        id: `res:${resolvedAt}`,
        timestamp: resolvedAt,
        kind: "resolved",
        message: "Stop message sent — incident resolved",
      },
      ...deployments.map(
        (d): LogEntry => ({
          id: `ret:${d.applianceId}:${resolvedAt}`,
          timestamp: resolvedAt,
          kind: "returning",
          message: `${applianceLabel(d.applianceId)} returning to station`,
        }),
      ),
    ]);
    const scored = scoreIncident(
      activeIncident,
      deployments,
      incidentSim,
      treatmentByCasualtyId,
      log,
      tasks,
    );
    setOutcome(scored);
    // Career record: grade, targets and the casualty balance at close.
    const stages = Object.values(incidentSim?.casualtyProgression ?? {}).map((c) => c.stage);
    bumpStats((s) => {
      s.incidentsResolved += 1;
      s.grades[scored.grade] = (s.grades[scored.grade] ?? 0) + 1;
      s.targetsMet += scored.passedCount;
      s.targetsTotal += scored.totalCount;
      s.casualtiesSaved += stages.filter((st) => st === "at_hospital").length;
      s.casualtiesLost += stages.filter((st) => st === "expectant").length;
    });
    saveLastShift({
      incidentTitle: activeIncident.scenario.title,
      typeCode: activeIncident.scenario.type,
      grade: scored.grade,
      targetsMet: scored.passedCount,
      targetsTotal: scored.totalCount,
      casualtiesSaved: stages.filter((st) => st === "at_hospital").length,
      casualtiesLost: stages.filter((st) => st === "expectant").length,
      resourcesUsed: deployments.length,
      summary: scored.summary,
      resolvedAt,
    });
    // Push the updated record to the account (best-effort, non-blocking).
    void syncCareerStats();
  }

  /** Close one job and drop it off the stack, leaving everything else
   *  running. Selection falls through to whatever is still open so the
   *  operator is never left staring at nothing with calls outstanding. */
  function dismissIncident() {
    const id = selectedIncidentId;
    if (!id) return;
    setIncidents((prev) => {
      const rest = prev.filter((i) => i.id !== id);
      setSelectedIncidentId(rest.length > 0 ? rest[rest.length - 1].id : null);
      return rest;
    });
    setRuntimes((prev) => {
      const nx = { ...prev };
      delete nx[id];
      return nx;
    });
    // Units committed to the closed job are released.
    setDeployments((prev) => prev.filter((d) => d.incidentId !== id));
  }

  // The "embellish" step applies shared runtime state (gauges, status
  // overrides, deployment notes, pre-shift state) to a set of raw stations.
  // Shared between `myStations` (patch + force-wide) and the expanded
  // `allDeployableStations` list that also exposes specialist assets from
  // other patches for dispatch.
  const embellishStations = useCallback(
    (raw: StationWithAppliances[]): StationWithAppliances[] => {
      return raw.map((s) => ({
        ...s,
        appliances: s.appliances.map((a): Appliance => {
          const override = statusOverrides[a.id];
          const ps = preShiftStates[a.id];
          const activeDeployment = deployments.find((d) => d.applianceId === a.id);
          const g = vehicleGauges[a.id];
          const out: Appliance = g ? { ...a, ...g } : { ...a };
          if (override !== undefined) out.status = override;
          if (activeDeployment) {
            const d = activeDeployment;
            if (d.rehabUntil && d.returnArrivesAt && now >= d.returnArrivesAt && now < d.rehabUntil) {
              out.note = `Refuel / rehab · ETA ${fmtSec((d.rehabUntil - now) / 1000)}`;
            } else if (d.offloadEndsAt && d.hospitalArrivesAt && now >= d.hospitalArrivesAt && now < d.offloadEndsAt) {
              out.note = `At ${d.hospitalName ?? "hospital"} · offload ETA ${fmtSec((d.offloadEndsAt - now) / 1000)}`;
            } else if (d.hospitalLegStartedAt && d.hospitalArrivesAt && now < d.hospitalArrivesAt) {
              out.note = `Mobile to ${d.hospitalName ?? "hospital"} · ETA ${fmtSec((d.hospitalArrivesAt - now) / 1000)}`;
            }
          } else if (ps) {
            out.note = ps.availableAt
              ? `${ps.reason} · ETA ${fmtSec((ps.availableAt - now) / 1000)}`
              : ps.reason;
          }
          return out;
        }),
      }));
    },
    [statusOverrides, preShiftStates, deployments, vehicleGauges, now],
  );

  // Stations the operator owns on the map — patch plus ForceWide assets.
  // Renders on the main map and in the side resources panel.
  const myStations = useMemo<StationWithAppliances[]>(() => {
    if (!patch) return [];
    return embellishStations([...stationsByArea[patch], ...stationsByArea.ForceWide]);
  }, [patch, stationsByArea, embellishStations]);

  // Full dispatch pool. On top of `myStations`, the operator can also
  // mobilise *specialist* assets from stations outside their patch — e.g.
  // a BFU, USAR, HVP, HART, aerial etc. parked in another borough — but
  // without those stations appearing on the map. Out-of-patch stations
  // are trimmed to specialist appliances only (no neighbouring WrL pumps
  // or DCAs poaching the patch's frontline demand).
  const allDeployableStations = useMemo<StationWithAppliances[]>(() => {
    if (!patch) return [];
    const outsideAreas: AreaCode[] = (["Southern", "Eastern", "Western"] as AreaCode[]).filter(
      (a) => a !== patch,
    );
    const outside: StationWithAppliances[] = [];
    for (const area of outsideAreas) {
      for (const s of stationsByArea[area]) {
        const specialists = s.appliances.filter((a) => isSpecialistAppliance(a.type));
        if (specialists.length === 0) continue;
        outside.push({ ...s, appliances: specialists });
      }
    }
    return [...myStations, ...embellishStations(outside)];
  }, [patch, stationsByArea, myStations, embellishStations]);

  const selectedAppliance = useMemo<Appliance | null>(() => {
    if (!selectedApplianceId) return null;
    for (const s of allDeployableStations) {
      const a = s.appliances.find((a) => a.id === selectedApplianceId);
      if (a) return a;
    }
    return null;
  }, [allDeployableStations, selectedApplianceId]);

  // Crew members currently assigned to any active task — disable in pickers.
  const busyCrewIds = useMemo(() => {
    const s = new Set<string>();
    for (const t of tasks) {
      if (t.state !== "active") continue;
      for (const c of t.assignedCrewIds ?? []) s.add(c);
    }
    return s;
  }, [tasks]);

  // Derived incident simulation state (fire radius, hazards, casualties).
  const incidentSim = useMemo(() => {
    if (!activeIncident) return null;
    const baById: Record<string, number> = {};
    for (const s of allDeployableStations) {
      for (const a of s.appliances) {
        const caps = CAPABILITIES_BY_TYPE[a.type] ?? [];
        if (caps.includes("BA")) baById[a.id] = Math.max(0, a.crew.min - 1);
      }
    }
    return simulateIncident(
      activeIncident,
      deployments,
      baById,
      tasks,
      now,
      treatmentByCasualtyId,
      fireGrowthWindMultiplier(weather.windMph),
      fireIgnition,
      new Set(absentCasualtyIds),
    );
  }, [activeIncident, deployments, allDeployableStations, tasks, now, treatmentByCasualtyId, weather.windMph, fireIgnition, absentCasualtyIds]);

  // Auto-resolve a job that is genuinely finished.
  //
  // Resolution was manual only, so an ambulance-led incident never closed
  // itself: the patient could be handed over at hospital and the job would
  // sit open indefinitely. Scoped deliberately to scenarios with NO fire —
  // a medical or police-led job is over once the patients are dealt with,
  // whereas a fire job still has damping down, investigation and cordons
  // to run and must stay the operator's call.
  //
  // The trigger is HANDOVER, not arrival: an ambulance pulling onto the
  // hospital ramp has not finished, it finishes when the offload window
  // closes. A patient who died on scene counts as dealt with too.
  const autoResolvedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeIncident || outcome || !incidentSim) return;
    if (autoResolvedRef.current === activeIncident.id) return;
    const seat = activeIncident.scenario.scene?.fireSeat;
    const fireJob = (seat?.maxRadiusM ?? 0) > 0 || (seat?.radiusM ?? 0) > 0;
    if (fireJob) return;
    const found = incidentSim.foundCasualties;
    if (found.length === 0) return;
    const allDealtWith = found.every((c) => {
      const st = incidentSim.casualtyProgression?.[c.id]?.stage;
      return st === "at_hospital" || st === "expectant";
    });
    if (!allDealtWith) return;
    // Every conveying ambulance must have finished its handover.
    const conveying = deployments.filter((d) => d.offloadEndsAt !== undefined);
    const handedOver = conveying.every((d) => now >= (d.offloadEndsAt ?? 0));
    if (!handedOver) return;
    autoResolvedRef.current = activeIncident.id;
    setLog((prev) => [
      ...prev,
      {
        id: `autoresolve:${Date.now()}`,
        timestamp: Date.now(),
        kind: "annotation",
        message:
          "All patients dealt with and handed over — incident resolved.",
      },
    ]);
    void resolveIncident();
  }, [activeIncident, outcome, incidentSim, deployments, now]);

  // Exposure breach — log ONCE the moment the fire radius crosses the
  // scene's authored exposure threshold (fire into the attached
  // neighbour). The log entry is the durable record: scoring reads it at
  // debrief, so knocking the fire back down later doesn't unhappen it.
  useEffect(() => {
    if (!activeIncident || !incidentSim?.exposureBreached) return;
    const risk = activeIncident.scenario.scene?.exposureRisk;
    if (!risk) return;
    const id = `exposure:${activeIncident.id}`;
    setLog((prev) =>
      prev.some((e) => e.id === id)
        ? prev
        : [
            ...prev,
            {
              id,
              timestamp: Date.now(),
              kind: "setback",
              message: `Fire into the exposure — ${risk.label}. Make-up and a second jet on the party wall now.`,
            },
          ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentSim?.exposureBreached, activeIncident]);

  // Airwave click on Status change — every time statusOverrides updates
  // for an already-tracked appliance, click once. Skips the initial
  // population to avoid a burst on incident open.
  const lastStatusRef = useRef<Record<string, number>>({});
  useEffect(() => {
    for (const [id, st] of Object.entries(statusOverrides)) {
      if (lastStatusRef.current[id] !== undefined && lastStatusRef.current[id] !== st) {
        airwaveClick();
      }
      lastStatusRef.current[id] = st;
    }
  }, [statusOverrides]);

  // Alert tone on fire-stage transition. Low tone for under-control /
  // extinguished, high tone for flashover risk.
  const lastFireStageRef = useRef<string>("");
  useEffect(() => {
    const cur = incidentSim?.fireStage;
    if (!cur) return;
    if (cur !== lastFireStageRef.current && lastFireStageRef.current !== "") {
      if (cur === "flashover_risk") alertTone("high");
      else if (cur === "extinguished" || cur === "under_control") alertTone("low");
      else alertTone("med");
    }
    lastFireStageRef.current = cur;
  }, [incidentSim?.fireStage]);

  // BA low-pressure whistle — fires once per wearer when any of them
  // crosses below 60 bar.
  const baLowFiredRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const t of tasks) {
      if (t.kind !== "ba_sar" || t.state !== "active") continue;
      for (const [cid, bar] of Object.entries(t.baPressure ?? {})) {
        if ((bar as number) < 60 && !baLowFiredRef.current.has(cid)) {
          baLowFiredRef.current.add(cid);
          baLowPressure();
        }
      }
    }
  }, [tasks]);

  // Per-station ETA — computed once when an incident opens, shared by the
  // initial deployment panel and the in-shift ground-view deployment board.
  // Includes out-of-patch specialist stations so the operator can see their
  // realistic blue-light response time when mobilising. Blue-light base
  // plus weather/time-of-day multipliers (rush hour + precipitation).
  useEffect(() => {
    if (!activeIncident) {
      setEtas({});
      return;
    }
    const ctrl = new AbortController();
    const target = activeIncident.scenario.location.coords;
    const traffic = etaTrafficMultiplier(weather.hourOfDay);
    const precip = etaPrecipMultiplier(weather.precip);
    const envMult = traffic * precip;
    Promise.all(
      allDeployableStations.map((s) =>
        routeEta(s.coords, target, ctrl.signal)
          .then(blueLight)
          .then((r) => ({
            stationId: s.id,
            ...r,
            seconds: r.seconds * envMult,
          })),
      ),
    )
      .then((rows) => {
        setEtas(Object.fromEntries(rows.map((r) => [r.stationId, r])));
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [activeIncident, allDeployableStations, weather.hourOfDay, weather.precip]);

  // Auto-complete timed tasks (survey, gain_entry, kit_grab, mitigate_hazard).
  // Two-phase to avoid duplicate log entries under React StrictMode / Turbo
  // where a setState *updater* may run more than once. Phase 1 reads the
  // current `tasks` to find which ones just crossed their completesAt
  // threshold; phase 2 updates tasks + appends log entries at the top
  // level (single append per tick).
  useEffect(() => {
    const justCompleted: Task[] = [];
    for (const t of tasks) {
      if (t.state !== "active") continue;
      if (!t.completesAt) continue;
      if (now >= t.completesAt) justCompleted.push(t);
    }
    if (justCompleted.length === 0) return;
    // Forcible entry rolls against the tool-vs-door odds when its timer
    // lands. The "roll" is a deterministic hash of the task id so
    // StrictMode double-invokes, HMR replays, and save/resume all agree
    // on the outcome. Failures flip to aborted — door held, try again.
    const doorType = activeIncident
      ? doorTypeForScenario(activeIncident.scenario)
      : null;
    const entryFailedIds = new Set(
      justCompleted
        .filter(
          (t) =>
            t.kind === "gain_entry" &&
            t.entryTool &&
            doorType &&
            hashPct(t.id) >= ENTRY_TABLE[t.entryTool][doorType].pct,
        )
        .map((t) => t.id),
    );
    const completedIds = new Set(
      justCompleted.filter((t) => !entryFailedIds.has(t.id)).map((t) => t.id),
    );
    setTasks((prev) =>
      prev.map((t) =>
        t.state === "active" && completedIds.has(t.id)
          ? { ...t, state: "completed" as const }
          : t.state === "active" && entryFailedIds.has(t.id)
            ? { ...t, state: "aborted" as const }
            : t,
      ),
    );
    setLog((lg) => {
      // Dedupe: if a previous tick already logged any of these (StrictMode
      // double-invoke, HMR replay), skip them.
      const existingIds = new Set(lg.map((e) => e.id));
      const toAppend: LogEntry[] = [];
      for (const t of justCompleted) {
        const id = `taskc:${t.id}`;
        if (existingIds.has(id)) continue;
        if (entryFailedIds.has(t.id)) {
          toAppend.push({
            id,
            timestamp: t.completesAt ?? Date.now(),
            kind: "setback",
            message: `${applianceLabel(t.applianceId)} — ${ENTRY_TOOL_LABEL[t.entryTool!]} attempt failed, ${doorType ? DOOR_TYPE_LABEL[doorType].toLowerCase() : "door"} holding. Go again or switch tools.`,
          });
          continue;
        }
        if (t.kind === "gain_entry" && t.entryTool) {
          toAppend.push({
            id,
            timestamp: t.completesAt ?? Date.now(),
            kind: "task_completed",
            message: `${applianceLabel(t.applianceId)} — door forced with the ${ENTRY_TOOL_LABEL[t.entryTool]}${doorType ? ` (${DOOR_TYPE_LABEL[doorType].toLowerCase()})` : ""}`,
          });
          continue;
        }
        if (t.kind === "kit_grab") {
          toAppend.push({
            id,
            timestamp: t.completesAt ?? Date.now(),
            kind: "kit_deployed",
            message: `${applianceLabel(t.applianceId)} — ${kitLabel(t.kitKind!)} deployed`,
          });
        } else if (t.kind === "mitigate_hazard") {
          toAppend.push({
            id,
            timestamp: t.completesAt ?? Date.now(),
            kind: "hazard_mitigated",
            message: `Hazard mitigated · ${t.hazardId}`,
          });
        } else if (t.kind === "crs_action") {
          toAppend.push({
            id,
            timestamp: t.completesAt ?? Date.now(),
            kind: "task_completed",
            message: t.crsDoneMessage ?? `${applianceLabel(t.applianceId)} — ${t.crsLabel ?? "CRS action"} complete`,
          });
        } else {
          toAppend.push({
            id,
            timestamp: t.completesAt ?? Date.now(),
            kind: "task_completed",
            message: `${applianceLabel(t.applianceId)} — ${taskLabel(t.kind)} complete`,
          });
        }
      }
      return toAppend.length > 0 ? [...lg, ...toAppend] : lg;
    });
  }, [now, tasks]);

  // Stage pre-selected BA teams the moment their appliance lands. The
  // en-route pre-select means "rig in BA on the way" — so on arrival the
  // team stands ready at the entry point with sets on, but they do NOT
  // enter automatically: committing to search and rescue is the
  // operator's order, given from the action menu (where the staged team
  // gets a one-click commit).
  useEffect(() => {
    for (const d of deployments) {
      const stagedCrew = d.preCommitBaCrewIds;
      if (!stagedCrew || stagedCrew.length === 0) continue;
      if (now < d.arrivesAt) continue;
      if (d.baStagedAt) continue; // already rigged + logged
      const stagedAt = Date.now();
      setDeployments((prev) =>
        prev.map((x) => {
          if (x.applianceId !== d.applianceId) return x;
          // Rig the team — BA sets on for every pre-selected wearer.
          const crewEquipment = { ...(x.crewEquipment ?? {}) };
          for (const cid of stagedCrew) {
            const cur = crewEquipment[cid] ?? [];
            if (!cur.includes("ba_set")) crewEquipment[cid] = [...cur, "ba_set"];
          }
          return { ...x, crewEquipment, baStagedAt: stagedAt };
        }),
      );
      setLog((prev) => [
        ...prev,
        {
          id: `bastage:${d.applianceId}`,
          timestamp: stagedAt,
          kind: "annotation",
          message: `${applianceLabel(d.applianceId)} in attendance — BA team of ${stagedCrew.length} rigged and staged at the entry point, awaiting commit order`,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, deployments]);

  // Water-tank tick — consumer-driven drain using realistic hose flow
  // rates. Each running hose_attack is a consumer at HOSE_FLOW_LPM for
  // its hose type. An interior BA team committed in "firefighting" mode
  // is a consumer at the 45mm rate. The drain lands on whichever tank
  // the supply chain ultimately terminates at: a hydrant means
  // effectively unlimited (no drain), a tank further up the relay chain
  // drains as if the final branch were on it directly, and if no supply
  // exists the consumer's own tank drains.
  const [lastWaterTickAt, setLastWaterTickAt] = useState<number>(0);
  useEffect(() => {
    if (!lastWaterTickAt) {
      setLastWaterTickAt(now);
      return;
    }
    const deltaSec = (now - lastWaterTickAt) / 1000;
    if (deltaSec < 0.5) return;

    // Gather consumers. Each contributes a flow rate (L/min) that
    // ultimately draws from one tank (or the hydrant).
    type Consumer = { applianceId: string; flowLpm: number };
    const consumers: Consumer[] = [];
    for (const t of tasks) {
      if (t.state !== "active") continue;
      if (t.kind === "hose_attack") {
        const flow = HOSE_FLOW_LPM[t.hoseType ?? "70mm"];
        consumers.push({ applianceId: t.applianceId, flowLpm: flow });
      } else if (t.kind === "ba_sar" && t.baMode === "firefighting") {
        consumers.push({
          applianceId: t.applianceId,
          flowLpm: INTERIOR_BA_DEFAULT_FLOW_LPM,
        });
      }
    }
    if (consumers.length === 0) {
      setLastWaterTickAt(now);
      return;
    }

    // Sum demand at each tank. Relay chains collapse into the root tank
    // (or hydrant, which has no tank to drain).
    const drainLpmByTank = new Map<string, number>();
    for (const c of consumers) {
      const root = rootWaterSource(c.applianceId, tasks);
      if (root.type === "hydrant") continue; // hydrant-supplied → no drain
      if (root.type === "none") continue; // nothing to drain anyway
      drainLpmByTank.set(
        root.applianceId,
        (drainLpmByTank.get(root.applianceId) ?? 0) + c.flowLpm,
      );
    }
    if (drainLpmByTank.size === 0) {
      setLastWaterTickAt(now);
      return;
    }

    setVehicleGauges((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [applianceId, flowLpm] of drainLpmByTank) {
        // Find the pump's nominal tank size so we can convert L/s to %/s.
        const station = allDeployableStations.find((s) =>
          s.appliances.some((a) => a.id === applianceId),
        );
        const app = station?.appliances.find((a) => a.id === applianceId);
        const tankL = app?.waterLitres ?? 1800;
        if (tankL <= 0) continue;
        const pctPerMin = (flowLpm / tankL) * 100;
        const drop = (pctPerMin / 60) * deltaSec;
        const cur = next[applianceId] ?? { fuelPct: 100, waterPct: 100, conditionPct: 100 };
        const newPct = Math.max(0, cur.waterPct - drop);
        if (newPct !== cur.waterPct) {
          next[applianceId] = { ...cur, waterPct: newPct };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setLastWaterTickAt(now);
  }, [now, tasks, lastWaterTickAt, allDeployableStations]);

  // Informant tick — while the operator has answered the call but no
  // crew has yet landed on scene, scripted updates from the 999 caller
  // fire in real time. Once any committed deployment arrives on scene,
  // the caller "hangs up" and no further updates fire.
  useEffect(() => {
    if (!activeIncident) return;
    const script = activeIncident.scenario.informantScript;
    if (!script || script.length === 0) {
      // Still track first-arrival to flip the "on call" flag — even when
      // there's no script the banner should disappear on arrival.
      const firstOnScene = deployments.some((d) => now >= d.arrivesAt);
      if (firstOnScene && informantOnCall) {
        setInformantOnCall(false);
        setLog((prev) => [
          ...prev,
          {
            id: `inf:end:${Date.now()}`,
            timestamp: Date.now(),
            kind: "annotation",
            message: "Caller cleared the line — first crew on scene",
          },
        ]);
      }
      return;
    }
    const firstOnScene = deployments.some((d) => now >= d.arrivesAt);
    const sinceOpenSec = (now - activeIncident.receivedAt) / 1000;

    if (firstOnScene) {
      if (informantOnCall) {
        setInformantOnCall(false);
        setLog((prev) => [
          ...prev,
          {
            id: `inf:end:${Date.now()}`,
            timestamp: Date.now(),
            kind: "annotation",
            message: "Caller cleared the line — first crew on scene",
          },
        ]);
      }
      return;
    }

    // Find any update whose atSec has passed and that hasn't fired yet.
    // Walk in order so earlier beats fire before later ones.
    const firedIds = new Set(informantLog.map((e) => e.id));
    const committedIds = new Set(
      informantLog.filter((e) => e.text.length > 0).map((e) => e.id),
    );
    for (const update of script) {
      if (firedIds.has(update.id)) continue;
      if (sinceOpenSec < update.atSec) continue;
      // Delay-gated beats: only fire if the response is actually slow.
      if (
        update.delayThresholdSec !== undefined &&
        sinceOpenSec < update.delayThresholdSec
      ) {
        continue;
      }
      // Persons-reality gates: beats about a casualty only play when that
      // casualty is actually in the building this run — and the relief
      // beat ("they're all out") only on runs where they aren't.
      if (
        update.requiresCasualtyIds?.some((id) => absentCasualtyIds.includes(id)) ||
        update.requiresAbsentCasualtyIds?.some((id) => !absentCasualtyIds.includes(id))
      ) {
        setInformantLog((prev) => [
          ...prev,
          { id: update.id, text: "", tone: "info", firedAt: Date.now() },
        ]);
        continue;
      }
      // Dependency gate: follow-on beats wait for their prerequisites to
      // COMMIT. If a prerequisite was rolled and skipped, this beat can
      // never happen — mark it silently skipped.
      if (update.requiresFiredIds && update.requiresFiredIds.length > 0) {
        const deadPrereq = update.requiresFiredIds.some(
          (id) => firedIds.has(id) && !committedIds.has(id),
        );
        if (deadPrereq) {
          setInformantLog((prev) => [
            ...prev,
            { id: update.id, text: "", tone: "info", firedAt: Date.now() },
          ]);
          continue;
        }
        const allCommitted = update.requiresFiredIds.every((id) =>
          committedIds.has(id),
        );
        if (!allCommitted) continue; // prerequisites still pending
      }
      // Probability roll — single chance per update. Fire the dice the
      // first time the window opens; either we commit it, or we skip it
      // permanently by marking it fired with no visible message.
      const prob = update.probability ?? 1;
      if (!rollBeat(prob)) {
        setInformantLog((prev) => [
          ...prev,
          {
            id: update.id,
            text: "",        // skipped roll — not rendered
            tone: "info",
            firedAt: Date.now(),
          },
        ]);
        continue;
      }
      // Fire — and silently retire any mutually-exclusive beats so the
      // other side of an either/or outcome can never land as well.
      const suppressed = (update.suppressesIds ?? [])
        .filter((id) => !firedIds.has(id))
        .map((id) => ({
          id,
          text: "",
          tone: "info" as const,
          firedAt: Date.now(),
        }));
      setInformantLog((prev) => [
        ...prev,
        ...suppressed,
        {
          id: update.id,
          text: update.text,
          tone: update.tone ?? "info",
          firedAt: Date.now(),
        },
      ]);
      // Apply any hard sim effects.
      if (update.effect?.accelerateGrowthSec) {
        setActiveIncident((prev) =>
          prev
            ? { ...prev, receivedAt: prev.receivedAt - update.effect!.accelerateGrowthSec! * 1000 }
            : prev,
        );
      }
      if (update.effect?.igniteFire) {
        const ig = update.effect.igniteFire;
        setFireIgnition((prev) =>
          prev
            ? {
                atMs: prev.atMs,
                radiusM: prev.radiusM + ig.radiusM,
                growthRateMpm: Math.max(prev.growthRateMpm, ig.growthRateMpm),
              }
            : { atMs: Date.now(), radiusM: ig.radiusM, growthRateMpm: ig.growthRateMpm },
        );
      }
      if (update.effect?.revealCasualty) {
        const revealed = update.effect.revealCasualty;
        setAbsentCasualtyIds((prev) => prev.filter((id) => id !== revealed));
      }
      setLog((prev) => [
        ...prev,
        {
          id: `inf:${update.id}:${Date.now()}`,
          timestamp: Date.now(),
          kind: "annotation",
          message: `Informant: ${update.text}`,
        },
      ]);
      // One update per tick so the operator sees beats land sequentially,
      // not as a wall of text.
      break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, activeIncident, deployments, informantOnCall]);

  // Crew fatigue tick — every on-scene deployment accumulates fatigue
  // over time. Accrual rate increases when the appliance is mid-task
  // (physical graft), and when it's in a welfare break the timer pauses
  // (we already reset on welfare start, no need to reduce further here).
  useEffect(() => {
    if (!activeIncident) return;
    if (!lastFatigueTickAt) {
      setLastFatigueTickAt(now);
      return;
    }
    const deltaSec = (now - lastFatigueTickAt) / 1000;
    if (deltaSec < 1) return;
    setLastFatigueTickAt(now);
    setFatigueByApplianceId((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const d of deployments) {
        if (now < d.arrivesAt) continue; // not on scene yet
        if (d.returnStartedAt && now >= d.returnStartedAt) continue; // gone home
        // Welfare break — skip accrual.
        if (
          d.welfareEndsAt !== undefined &&
          d.welfareStartedAt !== undefined &&
          now >= d.welfareStartedAt &&
          now < d.welfareEndsAt
        ) {
          continue;
        }
        const hasActiveTask = tasks.some(
          (t) => t.applianceId === d.applianceId && t.state === "active",
        );
        // Base 0.25 %/min idle on scene, 0.7 %/min with an active task.
        const ratePerMinPct = hasActiveTask ? 0.7 : 0.25;
        const delta = (ratePerMinPct / 60) * deltaSec;
        const cur = next[d.applianceId] ?? 0;
        const updated = Math.min(100, cur + delta);
        if (updated !== cur) {
          next[d.applianceId] = updated;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [now, deployments, tasks, activeIncident, lastFatigueTickAt]);




  // BA air tick: deplete air for members inside active ba_sar tasks.
  // ~3% per minute (≈33 min total) — realistic for a 45-min BA set at work rate.
  useEffect(() => {
    if (!lastAirTickAt) {
      setLastAirTickAt(now);
      return;
    }
    const deltaSec = (now - lastAirTickAt) / 1000;
    if (deltaSec < 0.5) return;
    const baSarActive = tasks.filter((t) => t.kind === "ba_sar" && t.state === "active");
    if (baSarActive.length === 0) {
      setLastAirTickAt(now);
      return;
    }
    // Cold weather raises consumption — divide by the multiplier so
    // cylinders empty faster when it's < 15°C.
    const coldMult = 1 / baDurationMultiplier(weather.tempC);
    const perMemberDrop = (3 / 60) * deltaSec * coldMult; // pct
    const barDropPerMember = (BA_BAR_PER_MINUTE / 60) * deltaSec * coldMult; // bar
    setCrewAir((prev) => {
      const next = { ...prev };
      for (const t of baSarActive) {
        for (const cid of t.baCrewIds ?? []) {
          next[cid] = Math.max(0, (next[cid] ?? 100) - perMemberDrop);
        }
      }
      return next;
    });
    // Tick each wearer's cylinder bar gauge on the task record.
    setTasks((prev) =>
      prev.map((t) => {
        if (t.kind !== "ba_sar" || t.state !== "active" || !t.baPressure) return t;
        const nextBar: Record<string, number> = { ...t.baPressure };
        for (const cid of t.baCrewIds ?? []) {
          nextBar[cid] = Math.max(0, (nextBar[cid] ?? 300) - barDropPerMember);
        }
        return { ...t, baPressure: nextBar };
      }),
    );
    setLastAirTickAt(now);
  }, [now, tasks, lastAirTickAt]);

  // Emit log entries for newly-found casualties, confirmed hazards,
  // fire-stage transitions and casualty deterioration events.
  useEffect(() => {
    if (!incidentSim) return;
    const newEntries: LogEntry[] = [];
    for (const c of incidentSim.foundCasualties) {
      if (newlyFoundCasualties.has(c.id)) continue;
      newEntries.push({
        id: `cas:${c.id}`,
        timestamp: Date.now(),
        kind: "casualty_found",
        message: `Casualty located · ${c.label ?? c.id} (${c.severity})`,
      });
    }
    for (const h of incidentSim.visibleHazards) {
      if (h.knownFromPri) continue;
      if (newlyConfirmedHazards.has(h.id)) continue;
      newEntries.push({
        id: `hzc:${h.id}`,
        timestamp: Date.now(),
        kind: "hazard_confirmed",
        message: `Hazard confirmed on scene · ${h.label}`,
      });
    }

    // Fire stage transitions — one entry per change, with the most
    // tactically relevant line depending on the direction of travel.
    if (incidentSim.fireStage !== lastFireStage && incidentSim.fireStage !== "none") {
      const prev = lastFireStage;
      const cur = incidentSim.fireStage;
      const label = FIRE_STAGE_LOG_LABEL[cur];
      let message = `Fire · ${label}`;
      if (cur === "flashover_risk") message = `⚠ Flashover risk · knock down immediately`;
      else if (cur === "under_control") message = `Fire under control · holding`;
      else if (cur === "extinguished") message = `Fire extinguished`;
      else if (prev === "flashover_risk") message = `Fire backed off flashover risk`;
      newEntries.push({
        id: `fs:${cur}:${Date.now()}`,
        timestamp: Date.now(),
        kind: "fire_stage",
        message,
      });
    }

    // Casualty deterioration + expectant transitions.
    const nextSev: Record<string, string> = { ...lastCasualtySeverity };
    for (const [cid, prog] of Object.entries(incidentSim.casualtyProgression)) {
      const prev = lastCasualtySeverity[cid];
      if (prev === prog.severity) continue;
      // Only log transitions for casualties that have been discovered (or
      // just went expectant while still trapped). Spamming deterioration
      // for undiscovered ones would be noise the operator can't act on.
      if (prog.stage === "undiscovered" && prog.severity !== "expectant") {
        nextSev[cid] = prog.severity;
        continue;
      }
      if (prog.severity === "expectant") {
        newEntries.push({
          id: `cex:${cid}:${prog.severity}`,
          timestamp: Date.now(),
          kind: "casualty_expectant",
          message: `Casualty ${cid} · expectant · progression halted`,
        });
      } else if (prev && SEVERITY_WORSE[prog.severity] > (SEVERITY_WORSE[prev] ?? -1)) {
        newEntries.push({
          id: `cdt:${cid}:${prog.severity}`,
          timestamp: Date.now(),
          kind: "casualty_deteriorated",
          message: `Casualty ${cid} · deteriorated to ${prog.severity}`,
        });
      }
      nextSev[cid] = prog.severity;
    }

    if (newEntries.length > 0) {
      setLog((prev) => [...prev, ...newEntries]);
      setNewlyFoundCasualties((prev) => {
        const next = new Set(prev);
        for (const c of incidentSim.foundCasualties) next.add(c.id);
        return next;
      });
      setNewlyConfirmedHazards((prev) => {
        const next = new Set(prev);
        for (const h of incidentSim.visibleHazards) if (!h.knownFromPri) next.add(h.id);
        return next;
      });
    }
    if (incidentSim.fireStage !== lastFireStage) setLastFireStage(incidentSim.fireStage);
    // Only sync the severity map when it's actually different from the
    // last snapshot — a naive setState every render would trip React's
    // update-depth guard because `nextSev` is a fresh object each time
    // and would re-trigger this effect via the dependency array.
    let sevChanged = false;
    const prevKeys = Object.keys(lastCasualtySeverity);
    const nextKeys = Object.keys(nextSev);
    if (prevKeys.length !== nextKeys.length) {
      sevChanged = true;
    } else {
      for (const k of nextKeys) {
        if (lastCasualtySeverity[k] !== nextSev[k]) {
          sevChanged = true;
          break;
        }
      }
    }
    if (sevChanged) setLastCasualtySeverity(nextSev);
  }, [incidentSim, newlyFoundCasualties, newlyConfirmedHazards, lastFireStage, lastCasualtySeverity]);

  function setParkingPos(applianceId: string, lat: number, lng: number, bearingDeg: number) {
    // HEMS landing-zone confirmation. The helicopter's "parking" IS its
    // LZ. No minimum stand-off — a close-in LZ is fine when the surface
    // suits (field, park, or the closed carriageway of the incident
    // itself); suitability is surveyed against OSM (buildings, water,
    // woodland, power lines) before the aircraft commits.
    const dep = deployments.find((d) => d.applianceId === applianceId);
    if (dep?.hemsFlight && activeIncident) {
      const inc = activeIncident.scenario.location.coords;
      const dist = haversineMeters({ lat, lng }, inc);
      const logLine = (message: string) => {
        setLog((prev) => [
          ...prev,
          {
            id: `lz:${Date.now()}:${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            kind: "annotation",
            message,
          },
        ]);
      };
      if (dist > 600) {
        logLine(
          `LZ rejected — ${Math.round(dist)} m from the scene: too far, the walk would cost the team ${Math.round(dist / 1.4 / 60)} min. Pick somewhere inside 600 m.`,
        );
        return;
      }
      logLine(
        `${applianceLabel(applianceId)} — surveying LZ surface ${Math.round(dist)} m from the scene…`,
      );
      const overheadAt = dep.hemsFlight.overheadAt;
      const landingSec = dep.hemsFlight.landingSec;
      void (async () => {
        // Surface classification from OSM. On survey failure we land
        // anyway with a "crew will visual-check" caveat — the public
        // Overpass mirrors are not reliable enough to gate gameplay.
        let kind: "field" | "carriageway" | "open" | "unknown" = "unknown";
        let unsuitable: string | null = null;
        try {
          const res = await fetch(
            `/api/lz-check?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
          );
          if (res.ok) {
            const body = (await res.json()) as {
              verdict?: string;
              kind?: "field" | "carriageway" | "open";
              reason?: string;
            };
            if (body.verdict === "unsuitable") {
              unsuitable = body.reason ?? "obstructed ground";
            } else if (body.verdict === "suitable" && body.kind) {
              kind = body.kind;
            }
          }
        } catch {
          // fall through with kind = "unknown"
        }
        if (unsuitable) {
          logLine(
            `LZ rejected — ${unsuitable}. Pick a field, park, or the closed carriageway.`,
          );
          return;
        }
        const walkSec = Math.max(20, Math.round(dist / 1.4)); // brisk walk with kit
        const now = Date.now();
        const touchdownAt = Math.max(now, overheadAt) + landingSec * 1000;
        const arrivesAt = touchdownAt + walkSec * 1000;
        setDeployments((prev) =>
          prev.map((d) =>
            d.applianceId === applianceId && d.hemsFlight
              ? {
                  ...d,
                  parkingPos: { lat, lng },
                  parkingBearingDeg: bearingDeg,
                  arrivesAt,
                  hemsFlight: { ...d.hemsFlight, walkSec, lzConfirmedAt: now },
                }
              : d,
          ),
        );
        const surface =
          kind === "field"
            ? "grass / open field"
            : kind === "carriageway"
              ? "the carriageway — confirm the police closure holds"
              : kind === "open"
                ? "open ground"
                : "unverified ground (survey offline) — crew will visual-check on approach";
        logLine(
          `LZ confirmed ${Math.round(dist)} m from the scene on ${surface} — ${applianceLabel(applianceId)} landing; doctor + CCP proceeding on foot, with casualty in ~${Math.max(1, Math.round((arrivesAt - now) / 60000))} min`,
        );
      })();
      return;
    }
    setDeployments((prev) =>
      prev.map((d) =>
        d.applianceId === applianceId
          ? { ...d, parkingPos: { lat, lng }, parkingBearingDeg: bearingDeg }
          : d,
      ),
    );
  }

  /** Set a rider's whole loadout in one write — used by the riding-
   *  position presets. Capacity-aware, so a preset can never half-apply
   *  the way a sequence of toggles could. */
  function setCrewLoadout(
    applianceId: string,
    crewId: string,
    target: readonly string[],
  ) {
    const { items } = applyLoadout(target);
    setDeployments((prev) =>
      prev.map((d) => {
        if (d.applianceId !== applianceId) return d;
        const eq = { ...(d.crewEquipment ?? {}) };
        // Never strip a one-per-appliance item off a rider who is
        // working — drop it from this loadout instead.
        const granted: string[] = [];
        for (const item of items) {
          if (!APPLIANCE_SINGLETONS.has(item)) {
            granted.push(item);
            continue;
          }
          const holder = Object.entries(eq).find(
            ([other, held]) => other !== crewId && held.includes(item),
          );
          if (holder && busyCrewIds.has(holder[0])) continue; // in use
          if (holder) eq[holder[0]] = holder[1].filter((x) => x !== item);
          granted.push(item);
        }
        eq[crewId] = granted;
        return { ...d, crewEquipment: eq };
      }),
    );
  }

  function setPreCommitBaCrew(applianceId: string, crewIds: string[]) {
    setDeployments((prev) =>
      prev.map((d) => {
        if (d.applianceId !== applianceId) return d;
        // Rigging en route is literal: ticking a wearer puts their BA set
        // on right away (visible on the MDT Crew screen), unticking takes
        // it back off.
        const eq = { ...(d.crewEquipment ?? {}) };
        for (const cid of crewIds) {
          const cur = eq[cid] ?? [];
          if (!cur.includes("ba_set")) eq[cid] = [...cur, "ba_set"];
        }
        for (const cid of d.preCommitBaCrewIds ?? []) {
          if (crewIds.includes(cid)) continue;
          eq[cid] = (eq[cid] ?? []).filter((x) => x !== "ba_set");
        }
        return { ...d, preCommitBaCrewIds: crewIds, crewEquipment: eq };
      }),
    );
  }

  function setLightState(applianceId: string, state: import("@/lib/sim/incident_types").LightState) {
    setDeployments((prev) =>
      prev.map((d) =>
        d.applianceId === applianceId ? { ...d, lightState: state } : d,
      ),
    );
  }

  function setPumpRunning(applianceId: string, running: boolean) {
    setDeployments((prev) =>
      prev.map((d) => {
        if (d.applianceId !== applianceId) return d;
        // Refuse to start the pump without an operator assigned. Real
        // crews don't leave a running pump unattended.
        if (running && !d.pumpOperatorCrewId) return d;
        return { ...d, pumpRunning: running };
      }),
    );
  }

  /** Assign a crew member (must be a Driver / Pump Op.) to the pump
   *  panel. Passing null releases them. Releasing while the pump is
   *  running auto-shuts the pump — nobody's watching it. */
  function setPumpOperator(applianceId: string, crewId: string | null) {
    setDeployments((prev) =>
      prev.map((d) => {
        if (d.applianceId !== applianceId) return d;
        if (!crewId) {
          return { ...d, pumpOperatorCrewId: undefined, pumpRunning: false };
        }
        return { ...d, pumpOperatorCrewId: crewId };
      }),
    );
  }

  function setFastAttackDeployed(applianceId: string, deployed: boolean) {
    setDeployments((prev) =>
      prev.map((d) =>
        d.applianceId === applianceId ? { ...d, fastAttackDeployed: deployed } : d,
      ),
    );
  }

  function toggleCrewEquipment(applianceId: string, crewId: string, item: string) {
    setDeployments((prev) =>
      prev.map((d) => {
        if (d.applianceId !== applianceId) return d;
        const eq = { ...(d.crewEquipment ?? {}) };
        const current = eq[crewId] ?? [];
        const adding = !current.includes(item);
        // One-per-appliance kit: if this rider is taking the cutters,
        // nobody else on the pump is still holding them — unless that
        // someone is working a task with it, in which case the transfer
        // is refused rather than robbing them mid-job.
        if (adding && APPLIANCE_SINGLETONS.has(item)) {
          const holder = Object.entries(eq).find(
            ([other, items]) => other !== crewId && items.includes(item),
          );
          if (holder && busyCrewIds.has(holder[0])) return d;
          if (holder) eq[holder[0]] = holder[1].filter((x) => x !== item);
        }
        // addEquipment returns the list unchanged when the rider has no
        // hand free — a refusal, not a silent overload.
        eq[crewId] = adding
          ? addEquipment(current, item)
          : current.filter((x) => x !== item);
        return { ...d, crewEquipment: eq };
      }),
    );
  }

  function startTask(args: {
    applianceId: string;
    kind: TaskKind;
    assignedCrewIds: string[];
    hydrantId?: string;
    sourceApplianceId?: string;
    hoseType?: import("@/lib/sim/incident_types").HoseType;
    kitKind?: import("@/lib/sim/incident_types").KitKind;
    hazardId?: string;
    mitigationMethod?: string;
    attackMode?: import("@/lib/sim/incident_types").HoseAttackMode;
    hretTurret?: boolean;
    baMode?: "search" | "firefighting";
    casualtyId?: string;
    entryTool?: import("@/lib/sim/incident_types").EntryTool;
    closurePos?: { lat: number; lng: number };
    closureBearingDeg?: number;
    crsVehicleId?: string;
    crsActionId?: string;
    crsDurationSec?: number;
    crsLabel?: string;
    crsDoneMessage?: string;
  }) {
    const startedAt = Date.now();
    // Realistic per-task timings. Forcible entry gets its duration from
    // the tool-vs-door matrix instead of the generic roll.
    let durationSec =
      args.kind === "gain_entry" && args.entryTool && activeIncident
        ? ENTRY_TABLE[args.entryTool][doorTypeForScenario(activeIncident.scenario)].sec
        : taskDurationSecFor(args);
    // CRS payoff: an extrication on vehicles that have been made safe
    // (every critical CRS action complete) runs controlled and faster;
    // cutting with safety actions outstanding stays at the full duration
    // and gets called out in the log.
    let crsOutstanding: string[] | null = null;
    if (args.kind === "rtc_extrication" && activeIncident?.scenario.crs?.length) {
      const critical = activeIncident.scenario.crs.flatMap((v) => [
        ...(v.actions ?? []).filter((a) => a.critical).map((a) => ({ v, a })),
        ...v.components
          .map((c) => c.action)
          .filter((a): a is NonNullable<typeof a> => !!a && !!a.critical)
          .map((a) => ({ v, a })),
      ]);
      const doneIds = new Set(
        tasks
          .filter((t) => t.kind === "crs_action" && t.state === "completed")
          .map((t) => `${t.crsVehicleId}:${t.crsActionId}`),
      );
      const outstanding = critical.filter(({ v, a }) => !doneIds.has(`${v.id}:${a.id}`));
      if (outstanding.length === 0) {
        durationSec = durationSec ? Math.round(durationSec * 0.75) : durationSec;
        crsOutstanding = [];
      } else {
        crsOutstanding = [...new Set(outstanding.map(({ a }) => a.label))];
      }
    }
    const task: Task = {
      id: `${args.applianceId}:${args.kind}:${startedAt}`,
      applianceId: args.applianceId,
      kind: args.kind,
      startedAt,
      durationSec,
      completesAt: durationSec ? startedAt + durationSec * 1000 : undefined,
      state: "active",
      assignedCrewIds: args.assignedCrewIds,
      hydrantId: args.hydrantId,
      baCrewIds: args.kind === "ba_sar" ? args.assignedCrewIds : undefined,
      sourceApplianceId: args.sourceApplianceId,
      hoseType: args.hoseType,
      kitKind: args.kitKind,
      hazardId: args.hazardId,
      mitigationMethod: args.mitigationMethod,
      attackMode: args.attackMode,
      hretTurret: args.hretTurret,
      baMode: args.baMode,
      casualtyId: args.casualtyId,
      entryTool: args.entryTool,
      closurePos: args.closurePos,
      closureBearingDeg: args.closureBearingDeg,
      crsVehicleId: args.crsVehicleId,
      crsActionId: args.crsActionId,
      crsLabel: args.crsLabel,
      crsDoneMessage: args.crsDoneMessage,
    };
    setTasks((prev) => [...prev, task]);

    // A BA commitment consumes any staged pre-select on this appliance —
    // whether it used the staged crew or a fresh pick.
    if (args.kind === "ba_sar") {
      setDeployments((prev) =>
        prev.map((x) =>
          x.applianceId === args.applianceId
            ? { ...x, preCommitBaCrewIds: undefined, baStagedAt: undefined }
            : x,
        ),
      );
    }

    if (args.kind === "crs_action") {
      setLog((prev) => [
        ...prev,
        {
          id: `crs:${startedAt}`,
          timestamp: startedAt,
          kind: "task_started",
          message: `${applianceLabel(args.applianceId)} — ${args.crsLabel ?? "CRS action"} underway`,
        },
      ]);
    }

    if (args.kind === "rtc_extrication" && crsOutstanding !== null) {
      setLog((prev) => [
        ...prev,
        crsOutstanding.length === 0
          ? {
              id: `crssafe:${startedAt}`,
              timestamp: startedAt,
              kind: "task_started",
              message:
                "Vehicles made safe per CRS — controlled extrication, cutting time reduced",
            }
          : {
              id: `crsrisk:${startedAt}`,
              timestamp: startedAt,
              kind: "setback",
              message: `Cutting commenced with CRS actions outstanding: ${crsOutstanding.join(", ")}`,
            },
      ]);
    }

    if (args.kind === "gain_entry" && args.entryTool) {
      setLog((prev) => [
        ...prev,
        {
          id: `entry:${startedAt}`,
          timestamp: startedAt,
          kind: "task_started",
          message: `${applianceLabel(args.applianceId)} working the door — ${ENTRY_TOOL_LABEL[args.entryTool!]}`,
        },
      ]);
    }

    if (args.kind === "close_carriageway" || args.kind === "close_road") {
      setLog((prev) => [
        ...prev,
        {
          id: `closure:${startedAt}`,
          timestamp: startedAt,
          kind: "task_started",
          message:
            args.kind === "close_road"
              ? `${applianceLabel(args.applianceId)} closing the road — cones and diversion signage going out`
              : `${applianceLabel(args.applianceId)} closing the carriageway — cones going out`,
        },
      ]);
    }

    // Kick off a foot-route fetch for hose-laying tasks and attach when it lands.
    if (
      (args.kind === "connect_hydrant" && activeIncident) ||
      (args.kind === "relay_hose" && args.sourceApplianceId && activeIncident)
    ) {
      fetchAndAttachHosePath({
        taskId: task.id,
        kind: args.kind,
        applianceId: args.applianceId,
        hydrantId: args.hydrantId,
        sourceApplianceId: args.sourceApplianceId,
      });
    }

    // Side-effects / logs
    if (args.kind === "relay_hose") {
      setLog((prev) => [
        ...prev,
        {
          id: `rh:${startedAt}`,
          timestamp: startedAt,
          kind: "relay_connected",
          message: `${applianceLabel(args.applianceId)} on relay from ${applianceLabel(args.sourceApplianceId ?? "")} · ${args.hoseType ?? "70mm"}`,
        },
      ]);
    } else if (args.kind === "kit_grab") {
      setLog((prev) => [
        ...prev,
        {
          id: `kg:${startedAt}`,
          timestamp: startedAt,
          kind: "task_started",
          message: `${applianceLabel(args.applianceId)} — grabbing ${kitLabel(args.kitKind!)}`,
        },
      ]);
    } else if (args.kind === "mitigate_hazard") {
      setLog((prev) => [
        ...prev,
        {
          id: `mh:${startedAt}`,
          timestamp: startedAt,
          kind: "task_started",
          message: `${applianceLabel(args.applianceId)} — ${args.mitigationMethod ?? "mitigating"} (${args.hazardId})`,
        },
      ]);
    } else if (args.kind === "commander") {
      setSceneCommanderApplianceId(args.applianceId);
      setLog((prev) => [
        ...prev,
        {
          id: `cmd:${startedAt}`,
          timestamp: startedAt,
          kind: "commander_assigned",
          message: `Scene commander · ${applianceLabel(args.applianceId)}`,
        },
      ]);
    } else if (args.kind === "connect_hydrant") {
      setLog((prev) => [
        ...prev,
        {
          id: `hyd:${startedAt}`,
          timestamp: startedAt,
          kind: "hydrant_connected",
          message: `${applianceLabel(args.applianceId)} connected to hydrant ${args.hydrantId}`,
        },
      ]);
    } else if (args.kind === "ba_sar") {
      setCrewAir((prev) => {
        const next = { ...prev };
        for (const c of args.assignedCrewIds) if (next[c] === undefined) next[c] = 100;
        return next;
      });
      // Stamp the entry-control board fields so the BA board can show
      // real pressure gauges + time-of-whistle countdowns.
      const startPressure: Record<string, number> = {};
      const curPressure: Record<string, number> = {};
      const entryAt: Record<string, number> = {};
      const whistleAt: Record<string, number> = {};
      for (const c of args.assignedCrewIds) {
        startPressure[c] = 300;
        curPressure[c] = 300;
        entryAt[c] = startedAt;
        whistleAt[c] = startedAt + baWorkingDurationMin(300) * 60_000;
      }
      task.baStartPressure = startPressure;
      task.baPressure = curPressure;
      task.baEntryAt = entryAt;
      task.baWhistleAt = whistleAt;
      // Entry Control Officer: pick the first non-BA crew member on the same
      // appliance (typically the pump operator / driver). If every crew
      // member is inside, fall back to the first wearer as a nominal ECO.
      const appliance = allDeployableStations
        .flatMap((s) => s.appliances)
        .find((a) => a.id === args.applianceId);
      const eco = appliance?.crewMembers.find((m) => !args.assignedCrewIds.includes(m.id));
      task.entryControlOfficerId = eco?.id ?? args.assignedCrewIds[0];
      setLog((prev) => [
        ...prev,
        {
          id: `ba:${startedAt}`,
          timestamp: startedAt,
          kind: "ba_committed",
          message: `${applianceLabel(args.applianceId)} BA crew under air · ${args.assignedCrewIds.length} wearers · ECO ${eco?.name ?? "—"}`,
        },
      ]);
    } else {
      setLog((prev) => [
        ...prev,
        {
          id: `tsk:${startedAt}`,
          timestamp: startedAt,
          kind: "task_started",
          message: `${applianceLabel(args.applianceId)} — ${taskLabel(args.kind)} started`,
        },
      ]);
    }
  }

  async function fetchAndAttachHosePath(args: {
    taskId: string;
    kind: TaskKind;
    applianceId: string;
    hydrantId?: string;
    sourceApplianceId?: string;
  }) {
    if (!activeIncident || !patch) return;
    // Resolve the appliance across the full force so out-of-patch
    // specialists doing hose work (water rescue unit, aerial monitor, etc.)
    // still have their geometry linked up.
    const thisAppliance = allDeployableStations
      .flatMap((s) => s.appliances)
      .find((a) => a.id === args.applianceId);
    const thisDeployment = deployments.find((d) => d.applianceId === args.applianceId);
    if (!thisAppliance || !thisDeployment?.parkingPos) return;

    let from: { lat: number; lng: number } | null = null;
    if (args.kind === "connect_hydrant" && args.hydrantId) {
      const scenarioHyd = activeIncident.scenario.scene?.hydrants.find(
        (x) => x.label === args.hydrantId,
      );
      if (scenarioHyd?.coords) {
        from = scenarioHyd.coords;
      } else {
        // Fall back to OSM set (by H1..HN proximity order).
        const { fetchOsmHydrants } = await import("@/lib/sim/osm_hydrants");
        const osm = await fetchOsmHydrants(activeIncident.scenario.location.coords);
        const osmList = osm.slice(0, 8);
        const idx = parseInt(args.hydrantId.replace(/^H/, ""), 10) - 1;
        const osmMatch = Number.isFinite(idx) && idx >= 0 ? osmList[idx] : undefined;
        if (osmMatch) {
          from = { lat: osmMatch.lat, lng: osmMatch.lng };
        } else if (scenarioHyd?.pos) {
          from = (await import("@/lib/sim/scene")).metresToLatLng(
            activeIncident.scenario.location.coords,
            scenarioHyd.pos,
          );
        } else {
          return;
        }
      }
    } else if (args.kind === "relay_hose" && args.sourceApplianceId) {
      const src = deployments.find((d) => d.applianceId === args.sourceApplianceId);
      if (!src?.parkingPos) return;
      from = src.parkingPos;
    }
    if (!from) return;
    const { routeEta } = await import("@/lib/sim/eta");
    const r = await routeEta(from, thisDeployment.parkingPos, undefined, "foot");
    if (!r.coords || r.coords.length < 2) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === args.taskId ? { ...t, hosePath: r.coords ?? undefined } : t)),
    );
  }

  function abortTask(taskId: string) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, state: "aborted" } : t)));
    const t = tasks.find((x) => x.id === taskId);
    if (t?.kind === "ba_sar") {
      setLog((prev) => [
        ...prev,
        {
          id: `baw:${Date.now()}`,
          timestamp: Date.now(),
          kind: "ba_withdrawn",
          message: `${applianceLabel(t.applianceId)} BA crew withdrawn`,
        },
      ]);
    }
  }

  function updateBaRemarks(taskId: string, text: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, baRemarks: text } : t)),
    );
  }

  function updateBaEntryPoint(taskId: string, label: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, entryPoint: label } : t)),
    );
  }

  if (pendingSave) {
    return (
      <ResumePrompt
        save={pendingSave}
        onResume={() => hydrateFromSave(pendingSave)}
        onDiscard={discardSave}
      />
    );
  }
  if (patch === null) return <div className="flex flex-1" />;
  if (patch === undefined) {
    return (
      <div className="relative z-10 flex flex-1">
        <PatchPicker
          stationsByArea={stationsByArea}
          onSelect={selectPatch}
        />
      </div>
    );
  }

  return (
    <div className="relative z-10 flex flex-1 flex-col">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <DashboardHeader
        userEmail={userEmail}
        patch={patch}
        weather={weather}
        audioMuted={audioMuted}
        onToggleAudio={toggleAudioMuted}
        onOpenGlossary={() => setGlossaryOpen(true)}
        onChangePatch={changePatch}
        resourcesVisible={resourcesVisible}
        onToggleResources={() => setResourcesVisible((v) => !v)}
        incidentPanelVisible={incidentPanelVisible}
        onToggleIncidentPanel={() => setIncidentPanelVisible((v) => !v)}
        hasActiveIncident={!!activeIncident}
        onTriggerScenario={setPendingCall}
        coveredServices={coveredServices}
        viewMode={groundViewOpen && activeIncident ? "ground" : "area"}
        groundViewEnabled={!!activeIncident && !outcome}
        onSelectView={(mode) => {
          setGroundEntryView(null);
          setGroundViewOpen(mode === "ground" && !!activeIncident);
        }}
      />

      <main id="main-content" className="relative flex-1 overflow-hidden" aria-label="Dispatch map and panels">
        <EmbeddedMap
          stations={myStations}
          activeIncident={activeIncident}
          deployments={deployments}
          patch={patch ?? null}
          onSelectAppliance={setSelectedApplianceId}
          selectedApplianceId={selectedApplianceId}
          onOpenStationBays={setBayStationId}
          onZoomIntoGround={
            activeIncident && !outcome
              ? (view) => {
                  setGroundEntryView(view);
                  setGroundViewOpen(true);
                }
              : undefined
          }
        />
        {/* Station bay view — top-down look inside a fire station. */}
        {bayStationId && (() => {
          const st = allDeployableStations.find((s) => s.id === bayStationId);
          if (!st) return null;
          return (
            <StationBayPanel
              station={st}
              onClose={() => setBayStationId(null)}
              onSelectAppliance={setSelectedApplianceId}
              deployments={deployments}
              activeIncident={activeIncident}
              now={now}
              incidentActive={!!activeIncident && !outcome}
              onMobilise={(applianceId) => {
                const eta = etas[st.id];
                if (!eta) return;
                deployAppliance({
                  applianceId,
                  slotId: "extra",
                  etaSeconds: eta.seconds,
                  routeMeters: eta.meters,
                  routeCoords: eta.coords ?? undefined,
                });
              }}
            />
          );
        })()}
        {resourcesVisible && (
          <DraggableResourcesPanel
            stations={allDeployableStations}
            onSelectAppliance={setSelectedApplianceId}
            onClose={() => setResourcesVisible(false)}
            incidentActive={!!activeIncident && !outcome}
            deployedIds={new Set(deployments.map((d) => d.applianceId))}
            etas={etas}
            onMobilise={({ applianceId, stationId }) => {
              const eta = etas[stationId];
              if (!eta) return;
              deployAppliance({
                applianceId,
                slotId: "extra",
                etaSeconds: eta.seconds,
                routeMeters: eta.meters,
                routeCoords: eta.coords ?? undefined,
              });
            }}
          />
        )}
        {selectedAppliance && (() => {
          // En-route units get the pre-arrival instructions panel instead
          // of the static vehicle sheet — the operator can rig BA crews or
          // pre-pair a medical unit to a casualty before it lands.
          const enRoute = deployments.find(
            (d) =>
              d.applianceId === selectedAppliance.id &&
              !d.returnStartedAt &&
              !d.hospitalLegStartedAt &&
              now < d.arrivesAt,
          );
          if (enRoute) {
            return (
              <PreArrivalPanel
                appliance={selectedAppliance}
                deployment={enRoute}
                now={now}
                casualties={incidentSim?.foundCasualties ?? []}
                onSetPreCommitBaCrew={setPreCommitBaCrew}
                onSetTreatingCasualty={setTreatingCasualty}
                onClose={() => setSelectedApplianceId(null)}
              />
            );
          }
          return (
            <DraggableVehiclePanel
              appliance={selectedAppliance}
              onClose={() => setSelectedApplianceId(null)}
              onRefuel={refuel}
              onRefillWater={refillWater}
              onSendToMaintenance={sendToMaintenance}
              onStandDownForWelfare={standDownForWelfare}
            />
          );
        })()}
        {/* Area view keeps the classic dark call-information box; the
            rugged MDT tablet takes over inside ground view (rendered
            further down so it stacks above the fullscreen overlay). */}
        {activeIncident && incidentPanelVisible && !groundViewOpen && (
          <DraggableIncidentPanel
            incident={activeIncident}
            stations={allDeployableStations}
            deployments={incidentDeployments}
            log={log}
            outcome={outcome}
            onDeploy={deployAppliance}
            onStandDownForWelfare={standDownForWelfare}
            onResolve={resolveIncident}
            onDismiss={dismissIncident}
            onClose={() => setIncidentPanelVisible(false)}
          />
        )}
        {activeIncident && groundViewOpen && incidentSim && (
          <IncidentView
            incident={activeIncident}
            stations={allDeployableStations}
            patch={patch}
            deployments={incidentDeployments}
            etas={etas}
            log={log}
            now={now}
            sim={incidentSim}
            tasks={tasks}
            sceneCommanderApplianceId={sceneCommanderApplianceId}
            crewAir={crewAir}
            busyCrewIds={busyCrewIds}
            vehicleGauges={vehicleGauges}
            onSetParkingPos={setParkingPos}
            onSetPreCommitBaCrew={setPreCommitBaCrew}
            onSetLightState={setLightState}
            onSetPumpRunning={setPumpRunning}
            onSetPumpOperator={setPumpOperator}
            onSetFastAttackDeployed={setFastAttackDeployed}
            onToggleCrewEquipment={toggleCrewEquipment}
            onSetCrewLoadout={setCrewLoadout}
            onDeploy={deployAppliance}
            onStandDownForWelfare={standDownForWelfare}
            onStandDown={standDownAppliance}
            onStartTask={startTask}
            onAbortTask={abortTask}
            onUpdateBaRemarks={updateBaRemarks}
            onUpdateBaEntryPoint={updateBaEntryPoint}
            onSetTreatingCasualty={setTreatingCasualty}
            informantLog={informantLog}
            informantOnCall={informantOnCall}
            tacticalMode={tacticalMode}
            onDeclareTacticalMode={declareTacticalMode}
            fatigueByApplianceId={fatigueByApplianceId}
            treatmentByCasualtyId={treatmentByCasualtyId}
            onStartPatientSurvey={startPatientSurvey}
            onApplyAirway={applyAirway}
            onApplyBreathing={applyBreathing}
            onApplyCirculation={applyCirculation}
            resusByCasualtyId={resusByCasualtyId}
            onSetOxygen={setOxygen}
            onSetResusAirway={setResusAirway}
            onAttachMonitor={attachMonitor}
            onToggleCapnography={toggleCapnography}
            onSetCompressor={setCompressor}
            onFitLucas={fitLucas}
            onDeliverShock={deliverShock}
            onMovePads={movePads}
            onArrestAdrenaline={giveArrestAdrenaline}
            onAmiodarone={giveAmiodarone}
            onSuspectReversible={suspectReversible}
            onTreatReversible={treatReversible}
            onStopResus={stopResus}
            onAdministerDrug={administerDrug}
            onApplyPackaging={applyPackaging}
            onRequestClinician={requestClinician}
            hemsFlyable={hemsAvailable(weather)}
            onSetTreatmentDestination={setTreatmentDestination}
            onSendAtmistPrealert={sendAtmistPrealert}
            onConveyCasualtyVia={conveyCasualtyVia}
            mdtVisible={incidentPanelVisible}
            onToggleMdt={() => setIncidentPanelVisible((v) => !v)}
            placePendingApplianceId={placePendingApplianceId}
            onClearPlacePending={() => setPlacePendingApplianceId(null)}
            selectedVehicleId={mdtUnitId}
            onVehicleSelect={(id) => {
              setMdtUnitId(id);
              setIncidentPanelVisible(true);
            }}
            pendingClosure={pendingClosure}
            onSetPendingClosure={setPendingClosure}
            muster={muster}
            groundEntryView={groundEntryView}
            pendingMuster={pendingMuster}
            onSetPendingMuster={setPendingMuster}
            onPlaceMuster={(lat, lng, radiusM) => {
              setMuster({ lat, lng, radiusM });
              setPendingMuster(false);
              setLog((prev) => [
                ...prev,
                {
                  id: `ccp:${Date.now()}`,
                  timestamp: Date.now(),
                  kind: "annotation",
                  message: `Casualty muster area designated, ${Math.round(radiusM)} m radius — walking wounded and casualties to RV`,
                },
              ]);
            }}
            rotatePendingApplianceId={rotatePendingApplianceId}
            onSetRotatePending={setRotatePendingApplianceId}
            onClose={() => setGroundViewOpen(false)}
          />
        )}
        {/* Rugged MDT tablet — ground view's incident terminal. */}
        {activeIncident && groundViewOpen && incidentPanelVisible && (
          <DraggableIncidentMdt
            incident={activeIncident}
            stations={allDeployableStations}
            deployments={incidentDeployments}
            log={log}
            outcome={outcome}
            onDeploy={deployAppliance}
            onStandDownForWelfare={standDownForWelfare}
            onResolve={resolveIncident}
            onDismiss={dismissIncident}
            onClose={() => setIncidentPanelVisible(false)}
            sim={incidentSim}
            tasks={tasks}
            now={now}
            informantLog={informantLog}
            informantOnCall={informantOnCall}
            treatmentByCasualtyId={treatmentByCasualtyId}
            onSetTreatingCasualty={setTreatingCasualty}
            onStartPatientSurvey={startPatientSurvey}
            onApplyAirway={applyAirway}
            onApplyBreathing={applyBreathing}
            onApplyCirculation={applyCirculation}
            resusByCasualtyId={resusByCasualtyId}
            onSetOxygen={setOxygen}
            onSetResusAirway={setResusAirway}
            onAttachMonitor={attachMonitor}
            onToggleCapnography={toggleCapnography}
            onSetCompressor={setCompressor}
            onFitLucas={fitLucas}
            onDeliverShock={deliverShock}
            onMovePads={movePads}
            onArrestAdrenaline={giveArrestAdrenaline}
            onAmiodarone={giveAmiodarone}
            onSuspectReversible={suspectReversible}
            onTreatReversible={treatReversible}
            onStopResus={stopResus}
            onAdministerDrug={administerDrug}
            onApplyPackaging={applyPackaging}
            onRequestClinician={requestClinician}
            hemsFlyable={hemsAvailable(weather)}
            onSetTreatmentDestination={setTreatmentDestination}
            onSendAtmistPrealert={sendAtmistPrealert}
            onConveyCasualtyVia={conveyCasualtyVia}
            onUpdateBaRemarks={updateBaRemarks}
            onUpdateBaEntryPoint={updateBaEntryPoint}
            onAbortTask={abortTask}
            etas={etas}
            patch={patch}
            onStandDown={standDownAppliance}
            onSetPreCommitBaCrew={setPreCommitBaCrew}
            sceneCommanderApplianceId={sceneCommanderApplianceId}
            crewAir={crewAir}
            busyCrewIds={busyCrewIds}
            vehicleGauges={vehicleGauges}
            onStartTask={startTask}
            onSetLightState={setLightState}
            onSetPumpRunning={setPumpRunning}
            onSetPumpOperator={setPumpOperator}
            onSetFastAttackDeployed={setFastAttackDeployed}
            onToggleCrewEquipment={toggleCrewEquipment}
            onSetCrewLoadout={setCrewLoadout}
            tacticalMode={tacticalMode}
            fatigueByApplianceId={fatigueByApplianceId}
            onBeginRoadClosure={(applianceId, kind, crewIds) =>
              setPendingClosure({ applianceId, kind, crewIds })
            }
            onRequestRotate={setRotatePendingApplianceId}
            onArmPlacement={setPlacePendingApplianceId}
            unitId={mdtUnitId}
            onSetUnitId={setMdtUnitId}
          />
        )}
        {pendingCall && (
          <IncomingCallModal
            scenario={pendingCall}
            onAnswer={() => {
              const s = pendingCall;
              setPendingCall(null);
              triggerScenario(s);
            }}
            onDecline={() => setPendingCall(null)}
          />
        )}
        <GlossaryOverlay
          open={glossaryOpen}
          onClose={() => setGlossaryOpen(false)}
          stations={[
            ...stationsByArea.Southern,
            ...stationsByArea.Eastern,
            ...stationsByArea.Western,
            ...stationsByArea.ForceWide,
          ]}
        />
        {activeIncident && outcome && (
          <DebriefScreen
            incident={activeIncident}
            outcome={outcome}
            deployments={incidentDeployments}
            sim={incidentSim}
            treatmentByCasualtyId={treatmentByCasualtyId}
            log={log}
            tasks={tasks}
            onDismiss={dismissIncident}
          />
        )}
        {/* Dispatch log — the running record of the shift: timestamped,
            typed, and never reordered. Movable and resizable, docked to
            the left of the map. Hidden while the ground view is open,
            which carries its own rails. */}
        {!groundViewOpen && showDispatchLog && (
          <DispatchLog log={log} onClose={() => setShowDispatchLog(false)} />
        )}
        {!groundViewOpen && !showDispatchLog && (
          <button
            type="button"
            onClick={() => setShowDispatchLog(true)}
            title="Show the dispatch log"
            className="pointer-events-auto absolute left-3 top-24 z-[1180] rounded-sm border border-(--color-border) bg-(--color-surface)/95 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) shadow-lg hover:border-(--color-amber) hover:text-(--color-amber)"
          >
            Log
          </button>
        )}
        {/* 999 Informant panel — floats on the main dashboard while the
            operator is still at the command desk. Once the ground view is
            open, the Call Information tab carries the live caller log in
            the left rail, so the floating version is hidden to keep the
            ground view uncluttered. */}
        {!groundViewOpen &&
          activeIncident &&
          (informantOnCall || informantLog.some((e) => e.text.length > 0)) && (
            <InformantPanel
              active={informantOnCall}
              callOpenedAt={activeIncident.receivedAt}
              messages={informantLog}
              variant="dashboard"
              onDismiss={() => setInformantLog([])}
            />
          )}
      </main>
    </div>
  );
}

/** Deterministic 0–99 "percentile roll" from a string. Used where an
 *  outcome must be random-feeling but stable across re-renders, StrictMode
 *  double-invokes and save/resume (e.g. forcible-entry success). */
function hashPct(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 100;
}

function applianceLabel(id: string): string {
  return id.replace("-", " ");
}

/** Default kit pre-populated on a crew member at the point of deployment.
 *  Driver always takes the red key + thermal camera (they set up water
 *  supply); officer-in-charge takes the TIC + radio; rear crew just get a
 *  radio so the operator can decide what they carry into the scene. */
/** Does this vehicle physically carry the item? Mirrors the Crew tab's
 *  rule so a rider is never seeded kit the tab cannot show. */
function applianceCarries(
  a: { kit: string[]; type: ApplianceTypeCode; waterLitres: number },
  key: string,
): boolean {
  const kit = a.kit.join(" ");
  const caps: string[] =
    (CAPABILITIES_BY_TYPE as Record<string, string[]>)[a.type] ?? [];
  const hasKit = (re: RegExp) => re.test(kit);
  const cap = (c: string) => caps.includes(c);
  switch (key) {
    case "radio":
      return true;
    case "ba_set":
      return cap("BA") || hasKit(/BA sets?/i);
    case "branch_45mm":
    case "branch_70mm":
    case "fast_attack_branch":
      return a.waterLitres > 0 || hasKit(/Hose|Boom monitor/i) || cap("Aerial");
    case "thermal_camera":
      return hasKit(/Thermal imaging|TIC/i) || cap("RTC_extrication") || cap("USAR");
    case "red_key":
    case "standpipe":
      return hasKit(/Red key|standpipe/i) || a.waterLitres > 0;
    case "stabiliser_chocks":
      return hasKit(/Stabiliser|Heavy rescue/i) || cap("RTC_extrication") || cap("Aerial");
    case "rope_kit":
    case "rescue_harness":
      return cap("Rope") || hasKit(/Rope/i);
    case "beater":
    case "leaf_blower":
    case "knapsack_sprayer":
    case "drip_torch":
      return cap("Wildfire") || hasKit(/beater|Leaf blower|Knapsack/i);
    case "aed":
      return hasKit(/AED|Defib/i) || cap("Medical");
    case "first_aid":
      return hasKit(/Paramedic kit|First|Oxygen|Airway/i) || cap("Medical");
    case "trauma":
      return hasKit(/Trauma|Critical care|Blood/i) || cap("Trauma") || cap("HEMS");
    default:
      return true; // permissive for anything not gated above
  }
}

function defaultLoadoutFor(role: string): string[] {
  if (/Driver|Pump Op/i.test(role)) {
    // Key and standpipe is both hands — the TIC belongs to the BA team.
    return ["red_key", "standpipe", "radio"];
  }
  if (/Watch Manager|Crew Manager/i.test(role)) {
    return ["thermal_camera", "radio"];
  }
  if (/Technical Rescue/i.test(role)) {
    // R2 / R4 crews step off with just a radio. They're carrying a van-ful
    // of kit — the operator issues the right tools from the vehicle for the
    // task at hand (heavy rescue / rope / water) rather than turning up in
    // full loadout regardless of the job. Specialist task buttons are
    // kit-gated, so starting rtc_extrication / rope_rescue / water_rescue
    // will fail until the operator has issued the relevant equipment from
    // the Crew tab.
    return ["radio"];
  }
  if (/USAR/i.test(role)) {
    // USAR teams step off with just a radio — kit is issued from the R6 on
    // a task-by-task basis (same rule as R2 / R4 Technical Rescue crews).
    return ["radio"];
  }
  if (/Wildfire/i.test(role)) {
    // Sprayer is worn, beater is one hand. The blower is issued from the
    // vehicle for a firebreak — nobody walks the moor carrying both.
    return ["radio", "knapsack_sprayer", "beater"];
  }
  if (/Aerial/i.test(role)) {
    return ["radio", "rope_kit", "thermal_camera"];
  }
  if (/Firefighter/i.test(role)) {
    return ["radio"];
  }
  if (/Paramedic|EMT|Doctor|HART/i.test(role)) {
    return ["first_aid", "aed", "radio"];
  }
  return ["radio"];
}

function taskDurationSecFor(args: {
  kind: TaskKind;
  hazardId?: string;
  mitigationMethod?: string;
  crsDurationSec?: number;
}): number | undefined {
  switch (args.kind) {
    case "survey":
      return 60;
    case "gain_entry":
      return Math.round(60 + Math.random() * 120); // 60–180s
    case "connect_hydrant":
      return 120;
    case "relay_hose":
      return 180;
    case "kit_grab":
      return 30;
    case "mitigate_hazard": {
      // Prefer the duration from the explicitly chosen mitigation method.
      if (args.mitigationMethod) {
        for (const opts of Object.values(MITIGATION_OPTIONS)) {
          const match = opts.find((o) => o.method === args.mitigationMethod);
          if (match) return match.durationSec;
        }
      }
      // Fall back to a hazard-id heuristic.
      if (!args.hazardId) return 180;
      const h = args.hazardId.toLowerCase();
      if (h.includes("gas")) return 45;
      if (h.includes("electric")) return 60;
      if (h.includes("cylinder")) return 180;
      if (h.includes("chemical") || h.includes("paint") || h.includes("solvent")) return 300;
      if (h.includes("structural") || h.includes("loft")) return 600;
      return 180;
    }
    case "deploy_stabilisers":
      return 90; // set jacks + levels
    case "close_carriageway":
      return 120; // cone the running lane(s) off one carriageway
    case "close_road":
      return 180; // full closure — cones both ends + diversion signage
    case "rtc_extrication":
      return 600; // average "golden hour" for a full extrication evolution
    case "firebreak":
      return 600; // wildfire break-cutting takes real effort
    case "cordon":
      return 180; // walk & tape / cones for an inner cordon
    case "triage_sieve":
      return 240; // primary triage sweep at an MCI
    case "extract_casualty":
      return 90; // BA team carries casualty out to safe ground
    case "aerial_rescue":
    case "extend_platform":
    case "aerial_monitor":
    case "hose_attack":
    case "ba_sar":
    case "commander":
    case "rope_rescue":
    case "water_rescue":
    case "wildfire_beating":
    case "wildfire_knapsack":
    case "traffic_mgmt":
    case "scene_preservation":
      return undefined; // ongoing (no auto-completion)
    case "crs_action":
      return args.crsDurationSec ?? 120; // authored per-action on the datasheet
  }
}

function taskLabel(kind: TaskKind): string {
  switch (kind) {
    case "survey": return "360 survey";
    case "gain_entry": return "Gain entry";
    case "connect_hydrant": return "Hydrant connection";
    case "relay_hose": return "Relay hose";
    case "hose_attack": return "Hose attack";
    case "ba_sar": return "BA search & rescue";
    case "commander": return "Scene commander";
    case "kit_grab": return "Kit grab";
    case "mitigate_hazard": return "Hazard mitigation";
    case "deploy_stabilisers": return "Deploy stabilisers";
    case "extend_platform": return "Platform / ladder up";
    case "aerial_rescue": return "Aerial rescue";
    case "aerial_monitor": return "Aerial water monitor";
    case "rtc_extrication": return "RTC extrication";
    case "rope_rescue": return "Rope rescue";
    case "water_rescue": return "Water rescue";
    case "wildfire_beating": return "Wildfire beating";
    case "wildfire_knapsack": return "Knapsack sprayer";
    case "firebreak": return "Cut firebreak";
    case "cordon": return "Cordon";
    case "close_carriageway": return "Carriageway closure";
    case "close_road": return "Road closure";
    case "traffic_mgmt": return "Traffic management";
    case "scene_preservation": return "Scene preservation";
    case "triage_sieve": return "Triage sieve";
    case "extract_casualty": return "Extract casualty";
    case "crs_action": return "CRS action";
  }
}

function kitLabel(k: import("@/lib/sim/incident_types").KitKind): string {
  switch (k) {
    case "aed": return "AED";
    case "first_aid": return "First Aid kit";
    case "trauma": return "Trauma bag";
    case "extinguisher": return "Fire extinguisher";
  }
}

function fmtSec(s: number): string {
  if (s < 60) return `${Math.max(0, Math.round(s))}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

function emptyTreatmentState(casualtyId: string): PatientTreatmentState {
  return {
    casualtyId,
    airway: {},
    breathing: {},
    circulation: {},
    drugs: {},
    packaging: {},
    events: [],
  };
}

/** Fallback clinical presentation when a scenario hasn't authored one.
 *  Keeps the Treatment tab usable for any scene — vitals scale with
 *  severity; critical flags are only set for the "critical" grade so the
 *  operator isn't surprised by a tension pneumo on a walking wounded. */
function defaultClinicalFor(
  severity: "critical" | "serious" | "walking",
): import("@/lib/sim/scene").PatientClinical {
  if (severity === "critical") {
    return {
      vitals: { rr: 28, spo2: 89, hr: 128, bpSys: 92, bpDia: 58, gcs: 11, temp: 36.4, bm: 6.2 },
      presumedCondition: "Critically unwell — multiple injuries suspected",
      redFlags: ["major_haemorrhage", "head_injury_severe"],
      preferredDestination: "mtc",
      criticalInterventions: ["oxygen", "iv_access", "fluids", "tXA"],
    };
  }
  if (severity === "serious") {
    return {
      vitals: { rr: 22, spo2: 94, hr: 108, bpSys: 108, bpDia: 70, gcs: 14, temp: 36.8, bm: 5.8 },
      presumedCondition: "Serious injury — conveyance required",
      redFlags: [],
      preferredDestination: "nearest_a_e",
      criticalInterventions: ["oxygen", "iv_access"],
    };
  }
  return {
    vitals: { rr: 18, spo2: 98, hr: 90, bpSys: 124, bpDia: 78, gcs: 15, temp: 37.0, bm: 5.5 },
    presumedCondition: "Walking wounded — minor injuries",
    redFlags: [],
    preferredDestination: "nearest_a_e",
    criticalInterventions: [],
  };
}
