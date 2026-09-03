// Shift save / resume. A single "shift in progress" snapshot lives in
// localStorage; the dashboard auto-saves every few seconds while an
// incident is active, and on next load offers the operator to resume
// exactly where they left off — with every stored timestamp shifted
// forward by the pause duration, so no sim time passes while paused.

import type {
  Deployment,
  FireIgnition,
  Incident,
  LogEntry,
  PatientTreatmentState,
  Task,
  TreatmentEvent,
} from "./incident_types";
import { sanitiseLoadout } from "./crew_carry";
import type { PreShiftState, ShiftIntensity } from "./shift";
import type { WeatherState } from "./weather";
import type { StatusCode } from "./types";
import type { Patch } from "./areas";

/** Same shape dashboard-client uses inline. Kept public here so save.ts
 *  can type the informantLog snapshot without cross-importing UI code. */
export type FiredInformant = {
  id: string;
  text: string;
  tone: "info" | "urgent" | "critical";
  firedAt: number;
};

export const SHIFT_SAVE_KEY = "watch-room.shift-save";
// 2: the patch collapsed to Greater Manchester. A v1 save carries a
// borough patch and station lists that no longer match; loadSave drops it.
export const SHIFT_SAVE_VERSION = 2;
/** Saves older than 48 hours are dropped on load — a stale shift is
 *  almost never what the operator wants to resume. */
export const SAVE_MAX_AGE_MS = 48 * 60 * 60 * 1000;

export type ShiftSave = {
  version: number;
  savedAt: number;
  patch: Patch;
  intensity: ShiftIntensity;
  weather: WeatherState;
  preShiftStates: Record<string, PreShiftState>;
  activeIncident: Incident | null;
  deployments: Deployment[];
  statusOverrides: Record<string, StatusCode>;
  tasks: Task[];
  crewAir: Record<string, number>;
  vehicleGauges: Record<
    string,
    { fuelPct: number; waterPct: number; conditionPct: number }
  >;
  fatigueByApplianceId: Record<string, number>;
  treatmentByCasualtyId: Record<string, PatientTreatmentState>;
  sceneCommanderApplianceId: string | null;
  tacticalMode: "offensive" | "defensive" | "transitional" | null;
  /** Command handed to an on-scene unit. Optional — absent in saves
   *  written before delegation existed, which resume as ordinary jobs. */
  handover?: {
    applianceId: string;
    callsign: string;
    commandRank: 0 | 1 | 2 | 3;
    atMs: number;
    /** When the commander takes command. Optional — a save written
     *  before command could be allocated en route has none, and resumes
     *  as a commander who was already there. */
    effectiveAtMs?: number;
    clearAtMs: number;
    requests: {
      id: string;
      atMs: number;
      dueAtMs: number;
      wants: import("./types").ApplianceTypeCode[];
      label: string;
      metAtMs?: number;
      missed?: boolean;
    }[];
  } | null;
  log: LogEntry[];
  informantLog: FiredInformant[];
  informantOnCall: boolean;
  /** Mid-incident fire started by an informant beat. Optional — absent in
   *  saves written before the ignition mechanic existed. */
  fireIgnition?: FireIgnition | null;
  /** Persons-reality roll — casualty ids not present this run. Optional
   *  for saves written before the mechanic existed. */
  absentCasualtyIds?: string[];
  /** Services the operator covers this shift. Optional for old saves. */
  coveredServices?: import("./types").ServiceCode[];
  newlyFoundCasualties: string[];
  newlyConfirmedHazards: string[];
  lastFireStage: string;
  lastCasualtySeverity: Record<string, string>;
  lastAirTickAt: number;
  lastFatigueTickAt: number;
};

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export function loadSave(): ShiftSave | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SHIFT_SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ShiftSave;
    if (parsed.version !== SHIFT_SAVE_VERSION) return null;
    if (Date.now() - parsed.savedAt > SAVE_MAX_AGE_MS) {
      window.localStorage.removeItem(SHIFT_SAVE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeSave(state: Omit<ShiftSave, "version" | "savedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const save: ShiftSave = {
      ...state,
      version: SHIFT_SAVE_VERSION,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(SHIFT_SAVE_KEY, JSON.stringify(save));
  } catch {
    // localStorage may throw when full or when the page is running in a
    // privacy mode that blocks writes — silently ignore.
  }
}

export function clearSave(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SHIFT_SAVE_KEY);
  } catch {}
}

// ---------------------------------------------------------------------------
// Time-offset helpers — shift every stored timestamp forward by `offset`
// milliseconds so the sim continues exactly where the operator left off.
// ---------------------------------------------------------------------------

function shift(t: number | undefined, offset: number): number | undefined {
  return t === undefined ? undefined : t + offset;
}

function shiftMap(
  m: Record<string, number> | undefined,
  offset: number,
): Record<string, number> | undefined {
  if (!m) return m;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(m)) out[k] = v + offset;
  return out;
}

function shiftDeployment(d: Deployment, offset: number): Deployment {
  // Shifts saved before carry limits existed can hold more than two
  // hands' worth of kit. Trim to what the rider could actually carry,
  // keeping worn and pocketed items first.
  let crewEquipment = d.crewEquipment;
  if (crewEquipment) {
    const trimmed: Record<string, string[]> = {};
    let changed = false;
    for (const [crewId, items] of Object.entries(crewEquipment)) {
      const res = sanitiseLoadout(items);
      trimmed[crewId] = res.items;
      if (res.dropped.length > 0) changed = true;
    }
    if (changed) crewEquipment = trimmed;
  }
  return {
    ...d,
    crewEquipment,
    mobilisedAt: d.mobilisedAt + offset,
    arrivesAt: d.arrivesAt + offset,
    baStagedAt: shift(d.baStagedAt, offset),
    hospitalLegStartedAt: shift(d.hospitalLegStartedAt, offset),
    hospitalArrivesAt: shift(d.hospitalArrivesAt, offset),
    offloadEndsAt: shift(d.offloadEndsAt, offset),
    returnStartedAt: shift(d.returnStartedAt, offset),
    returnArrivesAt: shift(d.returnArrivesAt, offset),
    rehabUntil: shift(d.rehabUntil, offset),
    welfareStartedAt: shift(d.welfareStartedAt, offset),
    welfareEndsAt: shift(d.welfareEndsAt, offset),
    lastWelfareAt: shift(d.lastWelfareAt, offset),
    hemsFlight: d.hemsFlight
      ? {
          ...d.hemsFlight,
          overheadAt: d.hemsFlight.overheadAt + offset,
          lzConfirmedAt: shift(d.hemsFlight.lzConfirmedAt, offset),
        }
      : undefined,
  };
}

function shiftTask(t: Task, offset: number): Task {
  return {
    ...t,
    startedAt: t.startedAt + offset,
    completesAt: shift(t.completesAt, offset),
    baEntryAt: shiftMap(t.baEntryAt as Record<string, number> | undefined, offset) as
      | Record<string, number>
      | undefined,
    // Note: baPressure / baStartPressure are bar values, not timestamps.
  };
}

function shiftActionMap<K extends string>(
  m: Partial<Record<K, number>>,
  offset: number,
): Partial<Record<K, number>> {
  const out: Partial<Record<K, number>> = {};
  for (const [k, v] of Object.entries(m)) {
    if (typeof v === "number") out[k as K] = v + offset;
  }
  return out;
}

function shiftTreatmentEvent(e: TreatmentEvent, offset: number): TreatmentEvent {
  return { ...e, at: e.at + offset };
}

function shiftTreatment(
  tx: PatientTreatmentState,
  offset: number,
): PatientTreatmentState {
  return {
    ...tx,
    surveyStartedAt: shift(tx.surveyStartedAt, offset),
    surveyCompletedAt: shift(tx.surveyCompletedAt, offset),
    liveVitalsLastTickAt: shift(tx.liveVitalsLastTickAt, offset),
    atmistSentAt: shift(tx.atmistSentAt, offset),
    chosenDestination: tx.chosenDestination
      ? { ...tx.chosenDestination, at: tx.chosenDestination.at + offset }
      : undefined,
    airway: shiftActionMap(tx.airway, offset),
    breathing: shiftActionMap(tx.breathing, offset),
    circulation: shiftActionMap(tx.circulation, offset),
    drugs: shiftActionMap(tx.drugs, offset),
    packaging: shiftActionMap(tx.packaging, offset),
    events: tx.events.map((e) => shiftTreatmentEvent(e, offset)),
  };
}

/** Apply an offset to every timestamp in the save so the resumed shift
 *  picks up exactly where it left off. Non-timestamp fields (gauges,
 *  air pressure, statuses, etc.) pass through unchanged. */
export function applyResumeOffset(
  save: ShiftSave,
  resumeAt: number = Date.now(),
): ShiftSave {
  const offset = resumeAt - save.savedAt;
  if (offset <= 0) return save;
  return {
    ...save,
    savedAt: resumeAt,
    activeIncident: save.activeIncident
      ? { ...save.activeIncident, receivedAt: save.activeIncident.receivedAt + offset }
      : null,
    deployments: save.deployments.map((d) => shiftDeployment(d, offset)),
    tasks: save.tasks.map((t) => shiftTask(t, offset)),
    treatmentByCasualtyId: Object.fromEntries(
      Object.entries(save.treatmentByCasualtyId).map(([id, tx]) => [
        id,
        shiftTreatment(tx, offset),
      ]),
    ),
    log: save.log.map((e) => ({ ...e, timestamp: e.timestamp + offset })),
    informantLog: save.informantLog.map((e) => ({
      ...e,
      firedAt: e.firedAt + offset,
    })),
    handover: save.handover
      ? {
          ...save.handover,
          atMs: save.handover.atMs + offset,
          effectiveAtMs: (save.handover.effectiveAtMs ?? save.handover.atMs) + offset,
          clearAtMs: save.handover.clearAtMs + offset,
          requests: (save.handover.requests ?? []).map((r) => ({
            ...r,
            atMs: r.atMs + offset,
            dueAtMs: r.dueAtMs + offset,
            metAtMs: r.metAtMs === undefined ? undefined : r.metAtMs + offset,
          })),
        }
      : save.handover,
    fireIgnition: save.fireIgnition
      ? { ...save.fireIgnition, atMs: save.fireIgnition.atMs + offset }
      : save.fireIgnition,
    lastAirTickAt: save.lastAirTickAt ? save.lastAirTickAt + offset : 0,
    lastFatigueTickAt: save.lastFatigueTickAt
      ? save.lastFatigueTickAt + offset
      : 0,
  };
}

// ---------------------------------------------------------------------------
// UI-friendly summary — used by the resume-prompt card.
// ---------------------------------------------------------------------------

export function summariseSave(save: ShiftSave): {
  patch: Patch;
  intensity: ShiftIntensity;
  incidentTitle: string | null;
  minutesAgo: number;
} {
  return {
    patch: save.patch,
    intensity: save.intensity,
    incidentTitle: save.activeIncident?.scenario.title ?? null,
    minutesAgo: Math.max(0, Math.round((Date.now() - save.savedAt) / 60000)),
  };
}
