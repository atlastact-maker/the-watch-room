"use client";

// The response officer's own record of a job on the MDT — what each
// person said, their welfare, the support asked for and the firearms
// declaration. Kept per incident in a small external store, like the
// commander's plan, so the tablet can be closed, popped out or switched
// to another module without losing a half-typed account.

import { useSyncExternalStore } from "react";

export type SupportKind = "unit" | "supervisor" | "ambulance" | "custody" | "arv" | "dog" | "npas" | "recovery" | "roads" | "highways";

export type WelfareOutcome = "ok" | "concern" | "medical";

export type PersonState = {
  /** The officer's edit of the account, over the one the person gave. */
  account?: string;
  welfare?: WelfareOutcome;
  welfareAt?: number;
  /** The offence recorded at arrest. */
  offence?: string;
};

export type SupportRequest = { kind: SupportKind; at: number; by: string };

export type FirearmsRecord = {
  declaredAt?: number;
  declaredBy?: string;
  threat: string;
  containment: string;
  notes: string;
  recordedAt?: number;
};

export type VehicleState = {
  /** The search form as it was begun. */
  reason?: string;
  grounds?: string;
  power?: string;
  searchedAt?: number;
  findings?: string[];
  recoveryAt?: number;
};

/** A control the crew has put on the road that the simulator does not
 *  model as a task — a diversion, a barrier, a sign. */
export type TrafficControl = { id: string; control: string; location: string; resource: string; at: number };

export type PoliceRecord = {
  persons: Record<string, PersonState>;
  vehicles: Record<string, VehicleState>;
  traffic: TrafficControl[];
  support: SupportRequest[];
  firearms: FirearmsRecord;
};

export const EMPTY_POLICE: PoliceRecord = {
  persons: {},
  vehicles: {},
  traffic: [],
  support: [],
  firearms: { threat: "Not assessed", containment: "None", notes: "" },
};

const store = new Map<string, PoliceRecord>();
const listeners = new Set<() => void>();

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function readPoliceRecord(incidentId: string): PoliceRecord {
  return store.get(incidentId) ?? EMPTY_POLICE;
}

export function updatePoliceRecord(incidentId: string, fn: (prev: PoliceRecord) => PoliceRecord): void {
  const prev = readPoliceRecord(incidentId);
  const next = fn(prev);
  if (next === prev) return;
  store.set(incidentId, next);
  for (const l of listeners) l();
}

export function usePoliceRecord(incidentId: string): PoliceRecord {
  return useSyncExternalStore(subscribe, () => readPoliceRecord(incidentId), () => EMPTY_POLICE);
}
