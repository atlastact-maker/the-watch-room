"use client";

// The incident commander's paperwork on the MDT — objectives, notes,
// the review clock, the assessment, roles, appliance roles and the water
// supply picture. Kept per incident in a small external store, like the
// task orders, so the tablet can be closed, popped out or re-rendered
// without losing the plan.

import { useSyncExternalStore } from "react";

export type Assessment = {
  lifeRisk: string;
  fireSpread: string;
  structural: string;
  hazards: string;
};

export type CommandRole = { crewId: string; name: string; callsign: string };

export type CommandPlan = {
  objectives: Record<string, boolean>;
  notes: string;
  reviewMin: number;
  recordedAt?: number;
  reviewDueAt?: number;
  assessment: Assessment;
  assessedAt?: number;
  commandSupport?: CommandRole;
  safetyOfficer?: CommandRole;
  /** Role given to each appliance by the commander. */
  applianceRoles: Record<string, string>;
  water: { source: string; status: string; updatedAt?: number };
};

export const EMPTY_PLAN: CommandPlan = {
  objectives: {},
  notes: "",
  reviewMin: 5,
  assessment: { lifeRisk: "Under assessment", fireSpread: "Unknown", structural: "Not assessed", hazards: "Review required" },
  applianceRoles: {},
  water: { source: "Not confirmed", status: "Pending" },
};

const store = new Map<string, CommandPlan>();
const listeners = new Set<() => void>();

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function readPlan(incidentId: string): CommandPlan {
  return store.get(incidentId) ?? EMPTY_PLAN;
}

export function updatePlan(incidentId: string, fn: (prev: CommandPlan) => CommandPlan): void {
  const prev = readPlan(incidentId);
  const next = fn(prev);
  if (next === prev) return;
  store.set(incidentId, next);
  for (const l of listeners) l();
}

export function useCommandPlan(incidentId: string): CommandPlan {
  return useSyncExternalStore(subscribe, () => readPlan(incidentId), () => EMPTY_PLAN);
}
