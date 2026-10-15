// WHAT THE CREWS HAVE DONE TO THE VEHICLES, read from the tasks on the
// job. The RTC stage reads it for the one vehicle it frames; the ground
// view reads it for every vehicle on the carriageway. Nothing here is
// stored: a crs_action completed is a thing done, one active is a crew
// at work, and the one that ended just before it started on the same
// appliance is where that crew walked over from.

import type { CrsVehicle, Task } from "@/lib/sim/incident_types";
import type { RtcWork, RtcFinished } from "./scene/plan-rtc";

/** A datasheet action's id without the standard set's `std-` prefix. */
export const stripStd = (id: string) => id.replace(/^std-/, "");

/** When a task ended: a completed one at its completesAt, an aborted one when it stopped. */
export const endOfTask = (t: Task) => (t.state === "completed" ? t.completesAt ?? t.startedAt : t.endedAt ?? t.startedAt);

export type RtcJobs = {
  crsJobs: Task[];
  /** The job the same appliance's crew came from — the one that ended in the two minutes before this started. */
  cameFrom: (applianceId: string, startedAt: number) => { key: string; endedAt: number } | undefined;
  doneKeys: (v: CrsVehicle) => Set<string>;
  workingOn: (v: CrsVehicle) => RtcWork[];
  /** Jobs on the vehicle that ended within `windowMs` with nothing following on the same appliance — their crews are walking off. */
  finishedOn: (v: CrsVehicle, windowMs: number) => RtcFinished[];
  extrication: Task | undefined;
  extricationState: "none" | "active" | "done";
};

export function rtcJobs(tasks: Task[], now: number): RtcJobs {
  const crsJobs = tasks.filter((t) => t.kind === "crs_action" && t.crsActionId);
  const cameFrom = (applianceId: string, startedAt: number) => {
    const prev = crsJobs.filter((p) => p.applianceId === applianceId && p.state !== "active" && endOfTask(p) <= startedAt && startedAt - endOfTask(p) < 120_000).sort((a, b) => endOfTask(b) - endOfTask(a))[0];
    return prev ? { key: prev.crsActionId!, endedAt: endOfTask(prev) } : undefined;
  };
  const doneKeys = (v: CrsVehicle) => new Set(crsJobs.filter((t) => t.crsVehicleId === v.id && t.state === "completed").map((t) => stripStd(t.crsActionId!)));
  const workingOn = (v: CrsVehicle): RtcWork[] => crsJobs.filter((t) => t.crsVehicleId === v.id && t.state === "active").map((t) => ({ key: t.crsActionId!, crew: t.assignedCrewIds.length, startedAt: t.startedAt, applianceId: t.applianceId, prev: cameFrom(t.applianceId, t.startedAt) }));
  const finishedOn = (v: CrsVehicle, windowMs: number): RtcFinished[] => crsJobs
    .filter((t) => t.crsVehicleId === v.id && t.state !== "active" && now - endOfTask(t) >= 0 && now - endOfTask(t) < windowMs)
    .filter((t) => !tasks.some((n) => (n.kind === "crs_action" || n.kind === "rtc_extrication") && n.state === "active" && n.applianceId === t.applianceId && n.startedAt >= endOfTask(t)))
    .map((t) => ({ key: t.crsActionId!, crew: t.assignedCrewIds.length, endedAt: endOfTask(t), applianceId: t.applianceId }));
  const extrication = tasks.find((t) => t.kind === "rtc_extrication" && t.state === "active") ?? tasks.find((t) => t.kind === "rtc_extrication" && t.state === "completed");
  const extricationState: RtcJobs["extricationState"] = extrication ? (extrication.state === "completed" ? "done" : "active") : "none";
  return { crsJobs, cameFrom, doneKeys, workingOn, finishedOn, extrication, extricationState };
}
