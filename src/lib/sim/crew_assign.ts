// WHO IS WITH WHOM. A vehicle's pairing names the patient it will convey;
// its crew assignments name which of its people are at which casualty,
// and since when. The desk's map and the tablet's ground view draw the
// walk each implies, the clinical screens gate on it, the patient list
// reads it, and the send-a-clinician menu writes it.
//
// A pairing made before anyone was named — a saved game, the desk's
// pairing buttons on a vehicle whose assignments were never managed —
// stands for its first two clinicians not on a job. The moment one of
// them is sent somewhere by name, that becomes explicit.

import type { Deployment, Task } from "./incident_types";

export type CrewAssignment = { casualtyId: string; since: number };
export type CrewMemberLike = { id: string; name: string; role: string };
export type Sent<M extends CrewMemberLike = CrewMemberLike> = { member: M; casualtyId: string; since: number };

/** Whether a crew member is on a job that keeps them from a patient. */
export function busyOn(tasks: readonly Task[], applianceId: string): (crewId: string) => boolean {
  const ids = new Set(
    tasks
      .filter((t) => t.state === "active" && t.applianceId === applianceId && t.kind !== "commander")
      .flatMap((t) => t.assignedCrewIds),
  );
  return (id) => ids.has(id);
}

const isPilot = (role: string) => /pilot/i.test(role);

/** Everyone this vehicle has with a casualty, and since when (never
 *  before it arrived): by name when its assignments are managed; else
 *  the first `fallback` of its clinicians not on a job, from the pairing. */
export function crewSent<M extends CrewMemberLike>(
  d: Deployment,
  members: readonly M[],
  isBusy: (id: string) => boolean,
  fallback = 2,
): Sent<M>[] {
  if (d.crewAssignments) {
    const sent = d.crewAssignments;
    return members.flatMap((m) => {
      const a = sent[m.id];
      return a && !isBusy(m.id) ? [{ member: m, casualtyId: a.casualtyId, since: Math.max(d.arrivesAt, a.since) }] : [];
    });
  }
  const casualtyId = d.treatingCasualtyId;
  if (!casualtyId) return [];
  const since = Math.max(d.arrivesAt, d.treatingSince ?? d.arrivesAt);
  return members
    .filter((m) => !isPilot(m.role) && !isBusy(m.id))
    .slice(0, fallback)
    .map((member) => ({ member, casualtyId, since }));
}

/** Those of this vehicle's crew with one casualty. */
export function crewSentTo<M extends CrewMemberLike>(
  d: Deployment,
  members: readonly M[],
  casualtyId: string,
  isBusy: (id: string) => boolean,
  fallback = 2,
): Sent<M>[] {
  return crewSent(d, members, isBusy, fallback).filter((s) => s.casualtyId === casualtyId);
}

/** Whether this vehicle has anything to do with the casualty: paired to
 *  them, or someone of its crew sent to them by name. */
export function hasCrewWith(d: Deployment, casualtyId: string): boolean {
  if (d.treatingCasualtyId === casualtyId) return true;
  return Object.values(d.crewAssignments ?? {}).some((a) => a.casualtyId === casualtyId);
}

/** When the first of this vehicle's people stepped out towards the
 *  casualty: the earliest named sending, else the pairing, never before
 *  the vehicle arrived. */
export function sentSince(d: Deployment, casualtyId: string): number {
  const named = Object.values(d.crewAssignments ?? {})
    .filter((a) => a.casualtyId === casualtyId)
    .map((a) => a.since);
  const since = named.length ? Math.min(...named) : d.treatingSince ?? d.arrivesAt;
  return Math.max(d.arrivesAt, since);
}

/** The vehicle's assignments made explicit, ready to change. */
function explicit<M extends CrewMemberLike>(d: Deployment, members: readonly M[], isBusy: (id: string) => boolean): Record<string, CrewAssignment> {
  if (d.crewAssignments) return { ...d.crewAssignments };
  return Object.fromEntries(crewSent(d, members, isBusy).map((s) => [s.member.id, { casualtyId: s.casualtyId, since: s.since }]));
}

/** Send one of the crew to a casualty, or stand them down (`casualtyId`
 *  null). The vehicle's own patient follows its people: paired by the
 *  first sending if it had none, and when its patient is left with
 *  nobody, re-paired to whoever its crew are with, or released. */
export function withCrewAssignment<M extends CrewMemberLike>(
  d: Deployment,
  members: readonly M[],
  isBusy: (id: string) => boolean,
  crewId: string,
  casualtyId: string | null,
  at: number,
): Deployment {
  const sent = explicit(d, members, isBusy);
  if (casualtyId) sent[crewId] = { casualtyId, since: at };
  else delete sent[crewId];
  const next: Deployment = { ...d, crewAssignments: sent };
  const anyWith = (id: string | null | undefined) => !!id && Object.values(sent).some((a) => a.casualtyId === id);
  if (casualtyId && !d.treatingCasualtyId) {
    next.treatingCasualtyId = casualtyId;
    next.treatingSince = at;
  } else if (d.treatingCasualtyId && !anyWith(d.treatingCasualtyId) && !d.hospitalLegStartedAt) {
    const other = Object.values(sent).sort((a, b) => a.since - b.since)[0];
    if (other) {
      next.treatingCasualtyId = other.casualtyId;
      next.treatingSince = other.since;
    } else {
      next.treatingCasualtyId = null;
      delete next.treatingSince;
    }
  }
  return next;
}

/** Pair the vehicle with a patient — up to two of its clinicians go over,
 *  counting any already there — or release it (`casualtyId` null):
 *  everyone it had with that patient stands down. */
export function withVehiclePairing<M extends CrewMemberLike>(
  d: Deployment,
  members: readonly M[],
  isBusy: (id: string) => boolean,
  casualtyId: string | null,
  at: number,
): Deployment {
  const sent = explicit(d, members, isBusy);
  if (casualtyId) {
    const there = members.filter((m) => sent[m.id]?.casualtyId === casualtyId).length;
    const free = members.filter((m) => !isPilot(m.role) && !isBusy(m.id) && sent[m.id]?.casualtyId !== casualtyId);
    for (const m of free.slice(0, Math.max(0, 2 - there))) sent[m.id] = { casualtyId, since: at };
    return { ...d, treatingCasualtyId: casualtyId, treatingSince: at, crewAssignments: sent };
  }
  if (d.treatingCasualtyId) {
    for (const [id, a] of Object.entries(sent)) if (a.casualtyId === d.treatingCasualtyId) delete sent[id];
  }
  return { ...d, treatingCasualtyId: null, treatingSince: at, crewAssignments: sent };
}

/** Everyone goes with the vehicle when it leaves for hospital: only the
 *  patient aboard keeps anyone. */
export function assignmentsForConveying(d: Deployment): Deployment["crewAssignments"] {
  if (!d.crewAssignments) return d.crewAssignments;
  const kept = Object.fromEntries(Object.entries(d.crewAssignments).filter(([, a]) => a.casualtyId === d.treatingCasualtyId));
  return kept;
}
