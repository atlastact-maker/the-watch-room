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
// But it is not a free pass, and that is what the rest of this file is
// for. The commander sends assistance messages — "make pumps six", "get
// me an aerial" — which land on the desk with a deadline, because the
// one thing control never stops doing is finding resources. And WHO took
// command decides how much they ask for and how well it goes: a station
// manager handles a house fire on their own; a pump's senior rider given
// a hazmat release will be back asking for help.
//
// ON THE DURATIONS. Real stop-times run from twenty minutes for an alarm
// to several days for a moorland fire, and the shift clock runs at real
// time — a house fire held for its true ninety minutes would outlast most
// sessions. So these are COMPRESSED, by roughly a factor of five, and
// the ordering and the relative scale are what is faithful: an alarm
// clears in minutes, a hazmat release holds the ground for most of a
// shift. Nothing here is a sourced figure.

import type { ApplianceTypeCode } from "./types";
import type { Deployment, Incident, IncidentTypeCode, PdaSlot } from "./incident_types";

/** An assistance message from the incident commander: something they
 *  need, and by when, before the job starts running late. */
export type MakeUpRequest = {
  id: string;
  /** Epoch ms the commander asked. */
  atMs: number;
  /** Epoch ms by which something matching must be mobilised. */
  dueAtMs: number;
  /** What would satisfy it. */
  wants: ApplianceTypeCode[];
  /** How the commander put it, in the log and on the stack. */
  label: string;
  /** Set once the message has been put in front of the operator. */
  announced?: boolean;
  /** Epoch ms it was met, if it was. */
  metAtMs?: number;
  /** Set once the deadline passed unmet. */
  missed?: boolean;
};

export type Handover = {
  /** The unit that took command. */
  applianceId: string;
  callsign: string;
  /** What rank took it — nothing, a tactical officer, a group or a
   *  strategic commander. Decides how much they ask for. */
  commandRank: 0 | 1 | 2 | 3;
  /** Epoch ms the operator handed over. */
  atMs: number;
  /** Epoch ms the incident is expected to be closed by its commander.
   *  Pushed back each time an assistance message goes unanswered. */
  clearAtMs: number;
  requests: MakeUpRequest[];
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

/** What a job of this severity asks of whoever is commanding it. */
const SEVERITY_DEMAND: Record<Incident["scenario"]["severity"], number> = {
  low: 0,
  moderate: 1,
  high: 2,
  major: 3,
};

/** How senior the unit taking command is.
 *
 *  0 is the senior rider on an appliance — perfectly proper for a small
 *  job, out of their depth on a big one. 1 is a tactical officer, 2 a
 *  group manager, 3 strategic. */
export function commandRank(type: string): 0 | 1 | 2 | 3 {
  if (type === "FIRE_AM" || type === "STRAT_CMD") return 3;
  if (type === "FIRE_GM" || type === "TAC_CMD") return 2;
  if (type === "FIRE_SM" || type === "OD" || type === "DUTY_OFF" || type === "TAC_ADV") return 1;
  return 0;
}

/** Extra minutes, as a multiplier, for a commander out of their depth. */
const SHORTFALL_TIME = [1, 1.12, 1.28, 1.45];
/** How many assistance messages a commander of that shortfall sends. */
const SHORTFALL_REQUESTS = [0, 1, 2, 2];
/** How long the desk gets to answer one. */
export const REQUEST_WINDOW_SEC = 180;
/** What an unanswered assistance message costs, as a share of the base. */
const MISS_PENALTY = 0.2;

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

/** How long the commander will need, in seconds, before any assistance
 *  message goes unanswered.
 *
 *  Resourcing moves it: an attendance that covers the PDA clears faster
 *  than one that is short of it, because the commander is not waiting on
 *  a make-up. Over-mobilising does not speed it up — more crews on a
 *  small job is not a faster job. Rank moves it too: a commander out of
 *  their depth takes longer. */
export function clearSeconds(
  incident: Incident,
  deployments: Deployment[],
  pdaSlots: PdaSlot[],
  rank: 0 | 1 | 2 | 3 = 1,
): number {
  const [lo, hi] = CLEAR_MINUTES[incident.scenario.type] ?? [12, 24];
  const roll = unit(`${incident.id}:clear`);
  const base = lo + (hi - lo) * roll;

  const committed = deployments.filter((d) => d.incidentId === incident.id).length;
  const wanted = Math.max(1, pdaSlots.length);
  const coverage = Math.min(1, committed / wanted);
  // Fully covered: as authored. Half covered: half again as long.
  const shortfallResource = 1 + (1 - coverage) * 0.5;
  const shortfallRank = SHORTFALL_TIME[commandShortfall(incident, rank)];

  const minutes = base * SEVERITY_FACTOR[incident.scenario.severity] * shortfallResource * shortfallRank;
  return Math.round(minutes * 60);
}

/** How far the commander is out of their depth: 0 when the rank matches
 *  the job, up to 3 when a senior rider has a major incident. */
export function commandShortfall(incident: Incident, rank: 0 | 1 | 2 | 3): 0 | 1 | 2 | 3 {
  const demand = SEVERITY_DEMAND[incident.scenario.severity];
  return Math.max(0, Math.min(3, demand - rank)) as 0 | 1 | 2 | 3;
}

/** The assistance messages this commander will send, and when.
 *
 *  They ask for the PDA slot nobody filled first — that is the gap they
 *  are actually standing in — and for a second pump or an aerial after
 *  that. The messages are spread through the first two-thirds of the
 *  job, because a commander asks for help while it can still help. */
export function planRequests(
  incident: Incident,
  deployments: Deployment[],
  pdaSlots: PdaSlot[],
  rank: 0 | 1 | 2 | 3,
  atMs: number,
  clearSec: number,
): MakeUpRequest[] {
  const count = SHORTFALL_REQUESTS[commandShortfall(incident, rank)];
  if (count === 0) return [];

  const committedTypes = new Set<string>();
  for (const d of deployments) {
    if (d.incidentId === incident.id) committedTypes.add(d.slotId);
  }
  const unfilled = pdaSlots.filter((s) => !committedTypes.has(s.id));

  const out: MakeUpRequest[] = [];
  for (let i = 0; i < count; i++) {
    const slot = unfilled[i];
    const wants: ApplianceTypeCode[] = slot
      ? slot.requiredApplianceTypes
      : (["WrL", "WrT", "TRU_pump"] as ApplianceTypeCode[]);
    const label = slot
      ? `${slot.label} — the attendance went without one`
      : i === 0
        ? "Make pumps — another appliance to the incident ground"
        : "Relief crew — the first crews are committed";
    // Spread through the first two-thirds; the first comes early enough
    // that the operator can actually do something about it.
    const at = atMs + Math.round(clearSec * 1000 * (0.2 + 0.3 * i));
    out.push({
      id: `mu:${incident.id}:${i}`,
      atMs: at,
      dueAtMs: at + REQUEST_WINDOW_SEC * 1000,
      wants,
      label,
    });
  }
  return out;
}

/** What an unanswered assistance message adds, in ms. */
export function missPenaltyMs(incident: Incident, pdaSlots: PdaSlot[]): number {
  const [lo, hi] = CLEAR_MINUTES[incident.scenario.type] ?? [12, 24];
  void pdaSlots;
  return Math.round(((lo + hi) / 2) * 60 * 1000 * MISS_PENALTY);
}

/** Has anything matching this request been sent since it was made? */
export function requestMet(
  req: MakeUpRequest,
  incidentId: string,
  deployments: Deployment[],
  typeOf: (applianceId: string) => string | undefined,
): boolean {
  return deployments.some(
    (d) =>
      d.incidentId === incidentId &&
      d.mobilisedAt >= req.atMs &&
      req.wants.includes((typeOf(d.applianceId) ?? "") as ApplianceTypeCode),
  );
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
): { applianceId: string; callsign: string; typeName: string; rank: 0 | 1 | 2 | 3 }[] {
  const out: { applianceId: string; callsign: string; typeName: string; rank: 0 | 1 | 2 | 3 }[] = [];
  for (const d of deployments) {
    if (d.incidentId !== incident.id) continue;
    if (nowMs < d.arrivesAt) continue; // not on scene yet
    const a = applianceOf(d.applianceId);
    if (!a) continue;
    out.push({
      applianceId: d.applianceId,
      callsign: a.callsign,
      typeName: a.typeName,
      rank: commandRank(a.type),
    });
  }
  // Most senior first, then by callsign so the order never wobbles.
  return out.sort((x, y) => y.rank - x.rank || x.callsign.localeCompare(y.callsign));
}

/** Plain words for what handing to this unit means for this job. */
export function commandAdvice(incident: Incident, rank: 0 | 1 | 2 | 3): string {
  switch (commandShortfall(incident, rank)) {
    case 0:
      return "Comfortably within their command — they will close it without troubling you.";
    case 1:
      return "A stretch. Expect an assistance message.";
    case 2:
      return "Above their level. They will be back asking for help, more than once.";
    default:
      return "Well above their level. They will struggle, and the job will run long.";
  }
}
