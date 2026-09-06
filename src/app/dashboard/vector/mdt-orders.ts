"use client";

// Task orders raised on the MDT — the prototype's `rcTasks` list. An order
// is the crew-facing paperwork around a simulator task: Sent → Assigned →
// In progress → Completed / Cancelled, with equipment reserved by asset id,
// issued on start and returned item by item afterwards. Orders live in a
// small external store keyed by incident so they survive the tablet being
// closed, popped out or re-rendered, and a page switch never loses a
// half-configured reservation.

import { useSyncExternalStore } from "react";
import type { TaskKind } from "@/lib/sim/incident_types";

export type Competency =
  | "ba"
  | "water"
  | "aerial"
  | "command"
  | "traffic"
  | "assessment"
  | "movement";

export type OrderStatus =
  | "Sent"
  | "Assigned"
  | "In progress"
  | "Paused"
  | "Completed"
  | "Cancelled";

export type EquipmentState =
  | "Reserved"
  | "Issued"
  | "Released"
  | "Awaiting return"
  | "Returned";

export type Allocation = {
  /** Asset id, e.g. `G15P1-BA-02`. */
  id: string;
  label: string;
  /** Crew id of the wearer, or "Shared task". */
  owner: string;
  ba: boolean;
  returnStatus?: string;
  returnRecordedAt?: number;
};

export type OrderEvent = { at: number; text: string };

/** Everything the simulator needs to start the task, captured at reserve
 *  time so "Confirm issue & start" is a single tap. */
export type SimTarget = {
  hydrantId?: string;
  sourceApplianceId?: string;
  hazardId?: string;
  mitigationMethod?: string;
  casualtyId?: string;
  kitKind?: "aed" | "first_aid" | "trauma" | "extinguisher";
  entryTool?: "halligan" | "lock_snapper" | "red_key" | "recip_saw";
  attackMode?: "exterior_cooling" | "exterior_attack" | "uhpl_lance" | "interior_attack";
  hoseType?: "45mm" | "70mm" | "LDH_150mm";
  baMode?: "search" | "firefighting";
};

export type MdtOrder = {
  id: string;
  /** Appliance id the order belongs to. */
  unit: string;
  kind: TaskKind;
  crewIds: string[];
  method: string;
  location: string;
  target: string;
  brief: string;
  equipmentSources: string[];
  equipmentItemIds: string[];
  equipmentLabels: string[];
  equipmentAllocations: Allocation[];
  equipmentState: EquipmentState;
  requiredAll: Competency[];
  requiredAny: Competency[];
  status: OrderStatus;
  sentAt: number;
  acceptedAt?: number;
  issuedAt?: number;
  startedAt: number;
  finishedAt?: number;
  returnedAt?: number;
  events: OrderEvent[];
  report: string;
  /** The simulator task this order is running as, once issued. */
  simTaskId?: string;
  sim: SimTarget;
};

const EMPTY: MdtOrder[] = [];
const store = new Map<string, MdtOrder[]>();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function readOrders(incidentId: string): MdtOrder[] {
  return store.get(incidentId) ?? EMPTY;
}

export function updateOrders(
  incidentId: string,
  fn: (prev: MdtOrder[]) => MdtOrder[],
): void {
  const prev = readOrders(incidentId);
  const next = fn(prev);
  if (next === prev) return;
  store.set(incidentId, next);
  emit();
}

export function useMdtOrders(incidentId: string): MdtOrder[] {
  return useSyncExternalStore(
    subscribe,
    () => readOrders(incidentId),
    () => EMPTY,
  );
}
