// THE CREW DEALING. A control room does not work every job to its end:
// once a crew is at a shoplifter, a damage-only RTC or an abandoned 999,
// the job is theirs — they deal, they book clear with a result, and the
// desk's part was getting them there. This is that clock: it starts when
// the first unit is in attendance on a job with nothing burning, nobody
// to treat and no car still running, it runs for the compressed window
// the delegation model already gives each type of job, it stretches when
// the crew ask for something and the desk does not send it, and the job
// closes with the crew's result on the log. The job stays live
// throughout — the desk can still work it, or stop it early.
//
// A pursuit ends here too. When the car stops, crashes, is boxed or is
// dumped, what the officer needs next lands as assistance messages — a
// second unit and a van for a prisoner at the roadside, an ambulance for
// a crash, the dog and the aircraft for a driver who ran — and the clock
// runs from the end of the run, for the shorter windows below.

import type { Deployment, Incident, IncidentTypeCode, PdaSlot, Scenario } from "./incident_types";
import type { ApplianceTypeCode } from "./types";
import { REQUEST_WINDOW_SEC, clearSeconds, planRequests, type MakeUpRequest } from "./handover";
import type { SubjectVehicle } from "./subject";

export type DealingCause = "attendance" | "stopped" | "contained" | "crashed" | "decamped" | "lost";

export type Dealing = {
  /** The unit whose arrival started the clock, or who ended the pursuit. */
  applianceId: string;
  callsign: string;
  sinceAt: number;
  /** When the crew book clear, as it stands. Pushed back by an unanswered request. */
  clearAtMs: number;
  /** Asks still to come. Each moves onto the job's assistance list, announced,
   *  when its time arrives. */
  requests: MakeUpRequest[];
  /** Assistance messages whose miss has already cost the clock. */
  penalised: string[];
  cause: DealingCause;
  /** Set the moment the crew book clear; the job closes on it. */
  clearedAt?: number;
};

/** A job the crew finish by themselves once they are there: nothing
 *  burning or growing, nobody present to treat, and no car still running. */
export function selfClearing(scenario: Scenario, absentIds: ReadonlySet<string>, subject: SubjectVehicle | undefined, fireIgnition: unknown): boolean {
  const seat = scenario.scene?.fireSeat;
  if (seat && ((seat.radiusM ?? 0) > 0 || (seat.growthRateMpm ?? 0) > 0)) return false;
  if (fireIgnition) return false;
  if ((scenario.scene?.casualties ?? []).some((c) => !absentIds.has(c.id))) return false;
  if (subject && !(subject.state === "stopped" || subject.state === "contained" || subject.state === "gone")) return false;
  return true;
}

export function dealingCause(subject: SubjectVehicle | undefined): DealingCause {
  if (!subject) return "attendance";
  if (subject.crashed) return "crashed";
  if (subject.state === "contained") return "contained";
  if (subject.state === "stopped") return "stopped";
  if (subject.state === "gone") return subject.decamped ? "decamped" : "lost";
  return "attendance";
}

export const CAUSE_WORDS: Record<DealingCause, string> = {
  attendance: "crew dealing",
  stopped: "driver detained at the stop",
  contained: "vehicle boxed, occupants detained",
  crashed: "crash scene",
  decamped: "car dumped, driver on foot",
  lost: "vehicle lost to the cameras",
};

/** What the crew put on the log when they book clear. */
const RESULT: Partial<Record<IncidentTypeCode, string>> = {
  automatic_fire_alarm: "alarm investigated, no fire — a faulty detector head; premises left with the keyholder",
  special_service_lift_release: "persons released from the lift unharmed; the building has called its engineer",
  special_service_gas_leak: "property ventilated, gas isolated at the meter, handed to the gas emergency service",
  ambulance_mental_health: "talked down and brought to safety; handed to the mental health team",
  police_burglary_in_progress: "premises searched, no trace of offenders; scene secured and the occupier updated",
  police_robbery_knife: "victim safe and first account taken, descriptions circulated, area search complete",
  police_concern_for_welfare: "entry gained, occupant found safe and well, next of kin informed",
  police_anpr_hit_stolen_vehicle: "vehicle recovered and the driver dealt with",
  police_shoplifter_detained: "shoplifter dealt with by community resolution, store statement taken",
  police_rtc_damage_only: "details exchanged, vehicles moved, road cleared and reopened",
  police_sudden_death_expected: "death confirmed as expected; GP and undertaker attending, family supported",
  police_drink_driver: "driver breathalysed and over the limit — arrested and taken to custody",
  police_neighbour_dispute: "both parties spoken to and words of advice given; no offences",
  police_abandoned_999: "call-back made and the phone located; no trace of any emergency",
  police_vehicle_stop_no_insurance: "vehicle seized under section 165A, driver reported",
  police_criminal_damage_report: "damage recorded, CCTV enquiries made, crime report completed",
  police_vehicle_interference: "area searched, no trace; vehicle owner updated",
  police_asb_youths: "youths moved on and words of advice given",
  police_mental_health_rcrp: "welfare confirmed, referred to the mental health team",
  police_welfare_partner_referral: "occupant seen, safe and well; housing officer updated",
  ambulance_111_sick_child: "child assessed and advice given; left in the care of the parents",
  ambulance_fall_no_injury: "resident lifted and checked, no injury; care home staff updated",
  police_fail_to_stop_pursuit: "pursuit concluded",
};

export function resultLine(type: IncidentTypeCode, cause: DealingCause, subject?: SubjectVehicle): string {
  const vrm = subject?.vrm ?? "the vehicle";
  if (cause === "stopped" || cause === "contained") return `driver detained and conveyed to custody, ${vrm} recovered`;
  if (cause === "crashed") return `crash scene cleared, ${vrm} recovered`;
  if (cause === "decamped") return `driver not found; ${vrm} recovered for forensics, enquiries continue`;
  if (cause === "lost") return `${vrm} not located — marker refreshed, enquiries continue`;
  return RESULT[type] ?? "dealt with by the crew, no further action required";
}

/** The compressed window after a pursuit ends, in minutes: a prisoner to
 *  custody and a car to recover, a crash scene to clear, a track and an
 *  area search for a driver who ran. Shorter than the delegation windows
 *  because the pursuit itself was the job; this is its tail. */
const CONCLUSION_MINUTES: Partial<Record<DealingCause, [number, number]>> = {
  stopped: [10, 18],
  contained: [10, 18],
  crashed: [14, 24],
  decamped: [14, 26],
  lost: [6, 12],
};

function roll(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  return (h % 10_000) / 10_000;
}

/** How long the crew will be, in seconds. A plain attendance uses the
 *  delegation model's window for the type of job; the end of a pursuit
 *  uses its own. Either way an attendance short of its slots takes
 *  longer — the crew are waiting on something. */
export function dealingSeconds(incident: Incident, deployments: Deployment[], slots: PdaSlot[], rank: 0 | 1 | 2 | 3, cause: DealingCause): number {
  const window = CONCLUSION_MINUTES[cause];
  if (!window) return clearSeconds(incident, deployments, slots, rank);
  const [lo, hi] = window;
  const base = lo + (hi - lo) * roll(`${incident.id}:dealing`);
  const committed = deployments.filter((d) => d.incidentId === incident.id && d.returnStartedAt === undefined).length;
  const coverage = Math.min(1, committed / Math.max(1, slots.length));
  return Math.round(base * (1 + (1 - coverage) * 0.5) * 60);
}

const CARS = ["Police_Response", "Police_RPU", "Police_ARV", "Police_TraffMot"];

/** The asks a crew out of their depth will make while dealing. The
 *  delegation planner asks for the unfilled slot first and for pumps
 *  after that; a police or ambulance crew asks for their own kind. */
export function planDealingRequests(
  incident: Incident,
  deployments: Deployment[],
  slots: PdaSlot[],
  rank: 0 | 1 | 2 | 3,
  atMs: number,
  clearSec: number,
  typeOf: (applianceId: string) => string | undefined,
  service: "Fire" | "Ambulance" | "Police",
): MakeUpRequest[] {
  return planRequests(incident, deployments, slots, rank, atMs, clearSec, typeOf).map((req) => {
    const fallback = req.label.startsWith("Make pumps") || req.label.startsWith("Relief crew");
    if (!fallback || service === "Fire") return req;
    if (service === "Police") return { ...req, wants: ["Police_Response", "Police_RPU"] as ApplianceTypeCode[], label: "Another unit — the crew want a second pair of hands" };
    return { ...req, wants: ["DCA", "RRV"] as ApplianceTypeCode[], label: "A second crew — the first is tied up with the patient" };
  });
}

function serviceFor(wants: readonly string[]): "Fire" | "Ambulance" | "Police" {
  if (wants.some((w) => w.startsWith("Police"))) return "Police";
  if (wants.some((w) => ["DCA", "RRV", "HEMS", "CCC"].includes(w))) return "Ambulance";
  return "Fire";
}

/** The attendance slot an assistance message adds, so the Resourcing
 *  tab shows what the crew asked for and who asked. */
export function slotForRequest(req: MakeUpRequest, by: string): PdaSlot {
  const short = req.label.split(" — ")[0];
  return { id: req.id, label: `${short} · asked for by ${by}`, service: serviceFor(req.wants), requiredApplianceTypes: req.wants, requiredCapabilities: [], notes: req.label };
}

/** What the officer at the end of a pursuit asks the desk for: a second
 *  unit and a van for a prisoner at the roadside, an ambulance for a
 *  crash, the dog and the aircraft for a driver who ran. Each comes with
 *  the three-minute window an assistance message gets and a slot on the
 *  attendance so the Resourcing tab shows what is wanted. */
export function conclusionRequests(
  incident: Incident,
  subject: SubjectVehicle,
  deployments: Deployment[],
  typeOf: (applianceId: string) => string | undefined,
  atMs: number,
  by: string,
): { requests: MakeUpRequest[]; slots: PdaSlot[]; note: string | null } {
  const mine = deployments.filter((d) => d.incidentId === incident.id && d.returnStartedAt === undefined);
  const types = mine.map((d) => typeOf(d.applianceId) ?? "");
  const count = (ts: readonly string[]) => types.filter((t) => ts.includes(t)).length;
  // The story's own following unit (AP214 behind the Golf) is a car at
  // the scene too, though it is not on the board.
  const cars = count(CARS) + (subject.pursuit?.narrativeHolder ? 1 : 0);
  const requests: MakeUpRequest[] = [];
  const slots: PdaSlot[] = [];
  const add = (key: string, wants: ApplianceTypeCode[], label: string, slotLabel: string, service: "Police" | "Ambulance", notes: string) => {
    const id = `end:${key}:${atMs}`;
    requests.push({ id, atMs, dueAtMs: atMs + REQUEST_WINDOW_SEC * 1000, wants, label, announced: true });
    slots.push({ id, label: `${slotLabel} · asked for by ${by}`, service, requiredApplianceTypes: wants, requiredCapabilities: [], notes });
  };
  let note: string | null = null;
  if (subject.crashed) {
    if (count(["DCA", "RRV", "HEMS", "CCC"]) === 0) add("ambulance", ["DCA", "RRV"], "Ambulance required — the driver is injured and still in the seat", "Ambulance", "Ambulance", "Unrestrained driver, head injury, noisy airway — the patient is the job now");
    if (cars < 2) add("second", ["Police_Response", "Police_RPU", "Police_ARV"], "Second unit — a crash scene on a live road and one officer on it", "Second unit", "Police", "Scene protection and the road until recovery");
    note = `recovery requested for ${subject.vrm} — it is not driveable`;
  } else if (subject.state === "stopped" || subject.state === "contained") {
    if (cars < 2) add("second", ["Police_Response", "Police_RPU", "Police_ARV"], "Second unit to the stop — one officer, a prisoner and a stolen car at the roadside", "Second unit", "Police", "A single-crewed unit cannot hold a prisoner and a scene");
    if (count(["Police_Van"]) === 0) add("van", ["Police_Van"], "Custody transport — a van for the prisoner", "Custody transport", "Police", "The prisoner goes to custody in a cell van, not in the back of the car that stopped him");
    note = `recovery requested for ${subject.vrm} at the stop`;
  } else if (subject.state === "gone" && subject.decamped) {
    if (count(["Police_Dog"]) === 0) add("dog", ["Police_Dog"], "Dog unit — a track from the abandoned car while it is warm", "Dog unit", "Police", "A track from the car is what finds him; officers through back gardens is not");
    if (count(["Police_NPAS"]) === 0) add("npas", ["Police_NPAS"], "NPAS — the aircraft over the area search", "NPAS", "Police", "Thermal imaging over the gardens and the railway line");
    note = `scene on ${subject.vrm} — recovery for forensics once it has been searched`;
  }
  return { requests, slots, note };
}
