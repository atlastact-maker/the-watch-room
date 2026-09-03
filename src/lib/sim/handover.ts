// Handing the incident to its commander.
//
// A control room does not work every job to the end. Once the right
// resources are on the way and an officer has taken command, the desk's
// part is done: the incident is the incident commander's, and the
// operator goes back to the stack. This is that — allocate, hand over,
// and the job clears itself in its own time.
//
// The operator gives up the ground view for it. That is the trade: you
// cannot delegate command and still direct the crews.
//
// ON THE DURATIONS. Real stop-times run from twenty minutes for an alarm
// to several days for a moorland fire, and the shift clock runs at real
// time — a house fire held for its true ninety minutes would outlast most
// sessions. So these are COMPRESSED, by roughly a factor of five, and
// the ordering and the relative scale are what is faithful: an alarm
// clears in minutes, a hazmat release holds the ground for most of a
// shift. Nothing here is a sourced figure.

import type { Deployment, Incident, IncidentTypeCode, PdaSlot } from "./incident_types";

export type Handover = {
  /** The unit that took command. */
  applianceId: string;
  callsign: string;
  /** Epoch ms the operator handed over. */
  atMs: number;
  /** Epoch ms the incident is expected to be closed by its commander. */
  clearAtMs: number;
};

/** Compressed handover-to-stop window, in minutes. Ordered as the real
 *  stop-times are ordered. */
const CLEAR_MINUTES: Record<IncidentTypeCode, [number, number]> = {
  automatic_fire_alarm: [3, 6],
  healthcare_premises_fire_alarm: [5, 9],
  ambulance_cardiac_arrest: [8, 13],
  rtc_entrapment: [9, 16],
  special_service_water_rescue: [10, 18],
  dwelling_fire_persons_reported: [13, 22],
  education_premises_fire: [16, 28],
  police_firearms_incident: [18, 34],
  high_rise_dwelling_fire: [24, 40],
  hazmat_chemical_leak: [26, 44],
  industrial_fire: [30, 50],
  wildfire_moorland: [38, 62],
};

const SEVERITY_FACTOR: Record<Incident["scenario"]["severity"], number> = {
  low: 0.8,
  moderate: 1,
  high: 1.15,
  major: 1.35,
};

/** Cheap, stable 0–1 from a string — the same job hands over to the same
 *  clear time however many times the component re-renders. */
function unit(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}

/** How long the commander will need, in seconds.
 *
 *  Resourcing moves it: an attendance that covers the PDA clears faster
 *  than one that is short of it, because the commander is not waiting on
 *  a make-up. Over-mobilising does not speed it up — more crews on a
 *  small job is not a faster job. */
export function clearSeconds(
  incident: Incident,
  deployments: Deployment[],
  pdaSlots: PdaSlot[],
): number {
  const [lo, hi] = CLEAR_MINUTES[incident.scenario.type] ?? [12, 24];
  const roll = unit(`${incident.id}:clear`);
  const base = lo + (hi - lo) * roll;

  const committed = deployments.filter((d) => d.incidentId === incident.id).length;
  const wanted = Math.max(1, pdaSlots.length);
  const coverage = Math.min(1, committed / wanted);
  // Fully covered: as authored. Half covered: half again as long.
  const shortfall = 1 + (1 - coverage) * 0.5;

  const minutes = base * SEVERITY_FACTOR[incident.scenario.severity] * shortfall;
  return Math.round(minutes * 60);
}

/** Which committed units may take command. In order of who a real
 *  control room would expect to: an officer first, then the senior rider
 *  on the first appliance in attendance. Only units already ON SCENE —
 *  nobody takes command of a job they have not reached. */
export function commandCandidates(
  incident: Incident,
  deployments: Deployment[],
  nowMs: number,
  applianceOf: (id: string) => { callsign: string; type: string; typeName: string } | undefined,
): { applianceId: string; callsign: string; typeName: string; rank: number }[] {
  const OFFICER = new Set(["FIRE_AM", "FIRE_GM", "FIRE_SM", "OD", "DUTY_OFF", "TAC_CMD", "STRAT_CMD"]);
  const out: { applianceId: string; callsign: string; typeName: string; rank: number }[] = [];
  for (const d of deployments) {
    if (d.incidentId !== incident.id) continue;
    if (nowMs < d.arrivesAt) continue; // not on scene yet
    const a = applianceOf(d.applianceId);
    if (!a) continue;
    out.push({
      applianceId: d.applianceId,
      callsign: a.callsign,
      typeName: a.typeName,
      // Officers first, then anything else, earliest arrival breaking ties.
      rank: OFFICER.has(a.type) ? 0 : 1,
    });
  }
  return out.sort((x, y) => x.rank - y.rank || x.callsign.localeCompare(y.callsign));
}
