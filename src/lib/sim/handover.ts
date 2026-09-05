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
  /** Epoch ms the commander actually takes command — their arrival, or
   *  the moment of handover if they were already on the ground. The
   *  clear clock and the assistance messages both run from here. */
  effectiveAtMs: number;
  /** Epoch ms the incident is expected to be closed by its commander.
   *  Pushed back each time an assistance message goes unanswered. */
  clearAtMs: number;
  requests: MakeUpRequest[];
};

/** Compressed handover-to-stop window, in minutes. Ordered as the real
 *  stop-times are ordered. */
const CLEAR_MINUTES: Record<IncidentTypeCode, [number, number]> = {
  automatic_fire_alarm: [3, 6],
  special_service_lift_release: [4, 8],
  vehicle_fire: [5, 10],
  special_service_effecting_entry: [6, 11],
  ambulance_fall_elderly: [7, 12],
  ambulance_chest_pain: [9, 15],
  secondary_fire_refuse: [4, 9],
  chimney_fire: [11, 19],
  special_service_gas_leak: [14, 26],
  ambulance_mental_health: [22, 40],
  // A transfer is not urgent and not dramatic. It simply takes an
  // ambulance away for most of what is left of the turn, which is how
  // resources actually disappear.
  ambulance_transfer: [40, 62],
  ambulance_overdose: [12, 20],
  ambulance_maternity: [14, 24],
  special_service_co_exposure: [16, 28],
  vehicle_fire_ev: [20, 38],
  special_service_rope_rescue: [24, 42],
  special_service_flooding: [26, 46],
  hmo_fire: [22, 38],
  agricultural_fire: [34, 58],
  // Ambulance work, ordered by how long the crew are tied up rather than
  // by how sick the patient is — a choking that resolves is over in
  // minutes, an admission the GP already arranged is an hour of driving.
  ambulance_choking: [6, 11],
  ambulance_diabetic: [9, 16],
  ambulance_anaphylaxis: [11, 18],
  ambulance_breathing: [13, 22],
  ambulance_assault: [16, 28],
  ambulance_stroke: [17, 27],
  ambulance_hcp_admission: [24, 38],
  ambulance_major_trauma: [26, 44],
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
  // Police work is measured in statements and paperwork, not hose reels.
  // A shoplifter is forty minutes; an expected death is a car gone for
  // most of what is left of the shift.
  police_domestic_in_progress: [35, 70],
  police_burglary_in_progress: [30, 60],
  police_fight_night_time_economy: [25, 50],
  police_fail_to_stop_pursuit: [30, 60],
  police_missing_child: [15, 45],
  police_robbery_knife: [30, 55],
  police_concern_for_welfare: [60, 150],
  police_anpr_hit_stolen_vehicle: [25, 50],
  police_shoplifter_detained: [20, 40],
  police_rtc_damage_only: [25, 45],
  police_sudden_death_expected: [90, 180],
  police_drink_driver: [30, 50],
  police_neighbour_dispute: [20, 40],
  police_mental_health_rcrp: [15, 30],
  police_abandoned_999: [8, 20],
  police_asb_youths: [15, 35],
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

/** Which attendance slots nobody is standing in.
 *
 *  Two passes. First honour any unit mobilised against a named slot from
 *  the PDA checklist, because that is the operator saying what it is for.
 *  Then fill what is left by what the remaining units ARE, in attendance
 *  order — a pump dragged onto the stack still covers the pump slot. One
 *  unit covers at most one slot: four pumps on a four-pump attendance is
 *  a full attendance, four pumps on a six-pump one is not. */
export function slotCoverage(
  incident: Incident,
  deployments: Deployment[],
  pdaSlots: PdaSlot[],
  typeOf?: (applianceId: string) => string | undefined,
): { slot: PdaSlot; applianceId: string | null }[] {
  const pool = deployments.filter((d) => d.incidentId === incident.id);
  const used = new Set<string>();
  const fills = new Map<string, string>();

  for (const s of pdaSlots) {
    const named = pool.find((d) => !used.has(d.applianceId) && d.slotId === s.id);
    if (named) {
      used.add(named.applianceId);
      fills.set(s.id, named.applianceId);
    }
  }
  for (const s of pdaSlots) {
    if (fills.has(s.id)) continue;
    const fit = pool.find((d) => {
      if (used.has(d.applianceId)) return false;
      const t = typeOf?.(d.applianceId);
      return t !== undefined && s.requiredApplianceTypes.includes(t as ApplianceTypeCode);
    });
    if (fit) {
      used.add(fit.applianceId);
      fills.set(s.id, fit.applianceId);
    }
  }
  return pdaSlots.map((s) => ({ slot: s, applianceId: fills.get(s.id) ?? null }));
}

/** The slots nobody is standing in. */
function unfilledSlots(
  incident: Incident,
  deployments: Deployment[],
  pdaSlots: PdaSlot[],
  typeOf?: (applianceId: string) => string | undefined,
): PdaSlot[] {
  return slotCoverage(incident, deployments, pdaSlots, typeOf)
    .filter((c) => c.applianceId === null)
    .map((c) => c.slot);
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
  /** What each committed unit actually is. Without it the match falls
   *  back to slot ids, which only the PDA checklist ever sets. */
  typeOf?: (applianceId: string) => string | undefined,
): MakeUpRequest[] {
  const count = SHORTFALL_REQUESTS[commandShortfall(incident, rank)];
  if (count === 0) return [];
  const unfilled = unfilledSlots(incident, deployments, pdaSlots, typeOf);

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

export type CommandCandidate = {
  applianceId: string;
  callsign: string;
  typeName: string;
  rank: 0 | 1 | 2 | 3;
  /** Epoch ms they reach the incident ground. In the past for a unit
   *  already there. */
  arrivesAt: number;
};

/** Which committed units may take command. In order of who a real
 *  control room would expect to: an officer first, then the senior rider
 *  on the first appliance in attendance.
 *
 *  Includes units still running in — the desk designates a commander
 *  before arrival — but not units that have left the ground. */
export function commandCandidates(
  incident: Incident,
  deployments: Deployment[],
  nowMs: number,
  applianceOf: (id: string) => { callsign: string; type: string; typeName: string } | undefined,
): CommandCandidate[] {
  const out: CommandCandidate[] = [];
  for (const d of deployments) {
    if (d.incidentId !== incident.id) continue;
    // Off the ground: released back to station, or conveying to hospital.
    if (d.returnStartedAt !== undefined && nowMs >= d.returnStartedAt) continue;
    if (d.hospitalLegStartedAt !== undefined && nowMs >= d.hospitalLegStartedAt) continue;
    const a = applianceOf(d.applianceId);
    if (!a) continue;
    out.push({
      applianceId: d.applianceId,
      callsign: a.callsign,
      typeName: a.typeName,
      rank: commandRank(a.type),
      arrivesAt: d.arrivesAt,
    });
  }
  // Most senior first; between equals, whoever gets there soonest. Then
  // by callsign, so the order never wobbles.
  return out.sort(
    (x, y) => y.rank - x.rank || x.arrivesAt - y.arrivesAt || x.callsign.localeCompare(y.callsign),
  );
}

/** When a unit designated now would actually take command. */
export function commandStartsAt(nowMs: number, arrivesAt: number): number {
  return Math.max(nowMs, arrivesAt);
}

/** Plain words for whether this unit is up to this job. The wait for
 *  them to arrive is shown separately — it is a different question. */
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
