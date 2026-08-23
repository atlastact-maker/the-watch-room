"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Appliance, AreaCode, StatusCode } from "@/lib/sim/types";
import { isSpecialistAppliance } from "@/lib/sim/types";
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
} from "@/lib/sim/incident_types";
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

  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  // Informant transcript — scripted updates from the 999 caller that fire
  // while crews are en route. Shape mirrors InformantUpdate with a
  // firedAt timestamp so the UI can timestamp each message.
  type FiredInformantUpdate = {
    id: string;
    text: string;
    tone: "info" | "urgent" | "critical";
    firedAt: number;
  };
  const [informantLog, setInformantLog] = useState<FiredInformantUpdate[]>([]);
  // Whether the caller is still "on the phone". Flips to false the moment
  // the first committed crew arrives on scene.
  const [informantOnCall, setInformantOnCall] = useState(false);

  // Per-casualty clinical treatment state. Keyed by casualty id so it
  // survives ambulance hand-off. Grows as the operator runs a primary
  // survey, applies A-B-C interventions, administers drugs, picks a
  // destination, and sends ATMIST.
  const [treatmentByCasualtyId, setTreatmentByCasualtyId] = useState<
    Record<string, PatientTreatmentState>
  >({});
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
  const [preShiftStates, setPreShiftStates] = useState<Record<string, PreShiftState>>({});
  const [log, setLog] = useState<LogEntry[]>([]);
  const [outcome, setOutcome] = useState<IncidentOutcome | null>(null);
  const [now, setNow] = useState(Date.now());
  const [selectedApplianceId, setSelectedApplianceId] = useState<string | null>(null);
  // Ground-view map interactions started from either the map action menu or
  // the MDT: a road closure awaiting its placement click, and a parked
  // vehicle awaiting a rotate-bearing click.
  const [pendingClosure, setPendingClosure] = useState<PendingClosure | null>(null);
  const [rotatePendingApplianceId, setRotatePendingApplianceId] = useState<string | null>(null);
  const [groundViewOpen, setGroundViewOpen] = useState(false);
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sceneCommanderApplianceId, setSceneCommanderApplianceId] = useState<string | null>(null);
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
  const [tacticalMode, setTacticalMode] = useState<
    "offensive" | "defensive" | "transitional" | null
  >(null);
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

  // Live-vitals tick. Every 3 s, advance each casualty's live vitals based
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
          if (dtSec < 2.5) {
            next[cid] = tx;
            continue;
          }
          const advanced = advanceLiveVitals(tx, dtSec, nowMs);
          if (advanced !== tx) changed = true;
          next[cid] = advanced;
        }
        return changed ? next : prev;
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

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

  function selectPatch(area: Patch, newIntensity: ShiftIntensity, startHour?: number) {
    localStorage.setItem(PATCH_STORAGE_KEY, area);
    localStorage.setItem(INTENSITY_STORAGE_KEY, newIntensity);
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

  function clearIncidentState() {
    setActiveIncident(null);
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
    setTreatmentByCasualtyId({});
    setTacticalMode(null);
    setFatigueByApplianceId({});
    setLastFatigueTickAt(0);
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
    clearIncidentState();
    const t = Date.now();
    setActiveIncident({
      id: `INC-${t}`,
      scenarioId: scenario.id,
      scenario,
      receivedAt: t,
    });
    setLog([
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
    setInformantOnCall(true);
    setInformantLog([]);
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
    // Find the appliance so we can pre-populate a sensible default crew
    // loadout by role — the operator can swap kit in the Crew tab later.
    // Use the full deployable pool so out-of-patch specialists resolve too.
    const appliance = allDeployableStations
      .flatMap((s) => s.appliances)
      .find((a) => a.id === args.applianceId);
    const crewEquipment: Record<string, string[]> = {};
    if (appliance) {
      for (const m of appliance.crewMembers) {
        crewEquipment[m.id] = defaultLoadoutFor(m.role);
      }
    }
    // The board's ETAs are priced at the fleet-average blue-light factor;
    // rescale to what THIS vehicle class actually does on blues (bike <
    // car < ambulance < pump < aerial). Aircraft rescale as a no-op.
    let etaSeconds = appliance
      ? rescaleBlueLightSeconds(args.etaSeconds, appliance.type)
      : args.etaSeconds;

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
        } · ETA ${fmtSec(etaSeconds)}`,
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
    setOutcome(
      scoreIncident(activeIncident, deployments, incidentSim, treatmentByCasualtyId, log, tasks),
    );
  }

  function dismissIncident() {
    clearIncidentState();
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
    );
  }, [activeIncident, deployments, allDeployableStations, tasks, now, treatmentByCasualtyId, weather.windMph]);

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

  // Auto-fire pre-committed BA tasks once their appliance has arrived AND
  // entry has been made (or there's no entry needed). The user pre-selected
  // these wearers from the en-route Crews panel so the BA team commits as
  // soon as it's tactically possible.
  useEffect(() => {
    for (const d of deployments) {
      if (!d.preCommitBaCrewIds || d.preCommitBaCrewIds.length === 0) continue;
      if (now < d.arrivesAt) continue;
      const alreadyBaSar = tasks.some(
        (t) => t.applianceId === d.applianceId && t.kind === "ba_sar" && t.state !== "aborted",
      );
      if (alreadyBaSar) continue;
      const entryDone = tasks.some(
        (t) =>
          t.applianceId === d.applianceId &&
          t.kind === "gain_entry" &&
          t.state === "completed",
      );
      if (!entryDone) continue;
      // Fire the BA task and clear the pre-commit so we don't re-trigger.
      startTask({
        applianceId: d.applianceId,
        kind: "ba_sar",
        assignedCrewIds: d.preCommitBaCrewIds,
      });
      setDeployments((prev) =>
        prev.map((x) =>
          x.applianceId === d.applianceId ? { ...x, preCommitBaCrewIds: undefined } : x,
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, deployments, tasks]);

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
      // Probability roll — single chance per update. Fire the dice the
      // first time the window opens; either we commit it, or we skip it
      // permanently by marking it fired with no visible message.
      const prob = update.probability ?? 1;
      if (Math.random() > prob) {
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
      // Fire.
      setInformantLog((prev) => [
        ...prev,
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

  function setPreCommitBaCrew(applianceId: string, crewIds: string[]) {
    setDeployments((prev) =>
      prev.map((d) =>
        d.applianceId === applianceId ? { ...d, preCommitBaCrewIds: crewIds } : d,
      ),
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
        // Items that physically exist as one-per-appliance (the pre-
        // connected fast-attack reel) — if one crew member is taking it,
        // no one else on this pump can have it at the same time.
        const SINGLETONS = new Set(["fast_attack_branch"]);
        if (adding && SINGLETONS.has(item)) {
          for (const [otherCrew, items] of Object.entries(eq)) {
            if (otherCrew === crewId) continue;
            if (items.includes(item)) {
              eq[otherCrew] = items.filter((x) => x !== item);
            }
          }
        }
        eq[crewId] = adding
          ? [...current, item]
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
    baMode?: "search" | "firefighting";
    casualtyId?: string;
    entryTool?: import("@/lib/sim/incident_types").EntryTool;
    closurePos?: { lat: number; lng: number };
    closureBearingDeg?: number;
  }) {
    const startedAt = Date.now();
    // Realistic per-task timings. Forcible entry gets its duration from
    // the tool-vs-door matrix instead of the generic roll.
    const durationSec =
      args.kind === "gain_entry" && args.entryTool && activeIncident
        ? ENTRY_TABLE[args.entryTool][doorTypeForScenario(activeIncident.scenario)].sec
        : taskDurationSecFor(args);
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
      baMode: args.baMode,
      casualtyId: args.casualtyId,
      entryTool: args.entryTool,
      closurePos: args.closurePos,
      closureBearingDeg: args.closureBearingDeg,
    };
    setTasks((prev) => [...prev, task]);

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
        viewMode={groundViewOpen && activeIncident ? "ground" : "area"}
        groundViewEnabled={!!activeIncident && !outcome}
        onSelectView={(mode) => setGroundViewOpen(mode === "ground" && !!activeIncident)}
      />

      <main id="main-content" className="relative flex-1 overflow-hidden" aria-label="Dispatch map and panels">
        <EmbeddedMap
          stations={myStations}
          activeIncident={activeIncident}
          deployments={deployments}
          patch={patch ?? null}
          onSelectAppliance={setSelectedApplianceId}
          onOpenStationBays={setBayStationId}
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
            deployments={deployments}
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
            deployments={deployments}
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
            onAdministerDrug={administerDrug}
            onApplyPackaging={applyPackaging}
            onRequestClinician={requestClinician}
            hemsFlyable={hemsAvailable(weather)}
            onSetTreatmentDestination={setTreatmentDestination}
            onSendAtmistPrealert={sendAtmistPrealert}
            onConveyCasualtyVia={conveyCasualtyVia}
            mdtVisible={incidentPanelVisible}
            onToggleMdt={() => setIncidentPanelVisible((v) => !v)}
            onSelectInbound={setSelectedApplianceId}
            pendingClosure={pendingClosure}
            onSetPendingClosure={setPendingClosure}
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
            deployments={deployments}
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
            tacticalMode={tacticalMode}
            fatigueByApplianceId={fatigueByApplianceId}
            onBeginRoadClosure={(applianceId, kind, crewIds) =>
              setPendingClosure({ applianceId, kind, crewIds })
            }
            onRequestRotate={setRotatePendingApplianceId}
            onSelectInbound={setSelectedApplianceId}
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
        <GlossaryOverlay open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
        {activeIncident && outcome && (
          <DebriefScreen
            incident={activeIncident}
            outcome={outcome}
            deployments={deployments}
            sim={incidentSim}
            treatmentByCasualtyId={treatmentByCasualtyId}
            log={log}
            tasks={tasks}
            onDismiss={dismissIncident}
          />
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
function defaultLoadoutFor(role: string): string[] {
  if (/Driver|Pump Op/i.test(role)) {
    return ["red_key", "standpipe", "thermal_camera", "radio"];
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
    return ["radio", "beater", "knapsack_sprayer", "leaf_blower"];
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
