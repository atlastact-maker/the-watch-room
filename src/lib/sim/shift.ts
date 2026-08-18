import type { Appliance, ServiceCode, StatusCode } from "./types";

export type ShiftIntensity = "quiet" | "normal" | "busy";

export type PreShiftState = {
  // The override status for this appliance at shift start.
  status: StatusCode;
  // Operator-facing reason shown next to the appliance row.
  reason: string;
  // If set, epoch ms when the appliance returns to Available (status 7).
  availableAt?: number;
};

export const INTENSITY_META: Record<
  ShiftIntensity,
  { label: string; blurb: string; available: number; committed: number; offRun: number }
> = {
  quiet: {
    label: "Quiet shift",
    blurb: "Nearly everything available. Gentle start.",
    available: 0.95,
    committed: 0.03,
    offRun: 0.02,
  },
  normal: {
    label: "Normal shift",
    blurb: "A handful of units already committed or off-run.",
    available: 0.8,
    committed: 0.15,
    offRun: 0.05,
  },
  busy: {
    label: "Busy evening",
    blurb: "About 40% of the patch is already out. Manage scarcity.",
    available: 0.55,
    committed: 0.4,
    offRun: 0.05,
  },
};

const COMMITTED_REASONS: Record<ServiceCode, string[]> = {
  Fire: [
    "Returning from earlier AFA",
    "Returning from RTC",
    "Returning from small fire",
    "Mobile-available after welfare",
  ],
  Ambulance: [
    "Clearing hospital after offload",
    "Returning from cat 2 call",
    "Standing down from ongoing call",
    "Mobile-available on roving patrol",
  ],
  Police: [
    "Returning from earlier shout",
    "Mobile-available after handover",
    "Standing down from custody run",
    "Standing down from foot patrol",
  ],
};

const OFF_RUN_REASONS = ["Defect — workshops", "Crew welfare", "Training", "Equipment replacement"];

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function rand(rnd: () => number, min: number, max: number): number {
  return min + rnd() * (max - min);
}

export function rollPreShiftStates(
  appliances: Appliance[],
  intensity: ShiftIntensity,
  now = Date.now(),
  rnd: () => number = Math.random,
): Record<string, PreShiftState> {
  const meta = INTENSITY_META[intensity];
  const out: Record<string, PreShiftState> = {};
  for (const a of appliances) {
    const r = rnd();
    if (r < meta.available) {
      // default — no override needed
      continue;
    }
    if (r < meta.available + meta.committed) {
      // Committed elsewhere → status 4 (Returning), will flip to 7 at availableAt
      const minutes = rand(rnd, 5, 25);
      out[a.id] = {
        status: 4,
        reason: pick(COMMITTED_REASONS[a.service], rnd),
        availableAt: now + minutes * 60 * 1000,
      };
    } else {
      // Off-run → status 8, persistent until reset
      out[a.id] = {
        status: 8,
        reason: pick(OFF_RUN_REASONS, rnd),
      };
    }
  }
  return out;
}
