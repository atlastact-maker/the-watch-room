"use client";

// POLICE CONTROLS — the MDT's police module.
//
//   ┌ INCIDENT SUMMARY ┬ RESOURCE ACTIONS               ┬ ACTION DETAILS   ┐
//   │ type · location  │ General · Traffic · People ·   │ action · target  │
//   │ status · brief   │ Vehicles                       │ start            │
//   ├ SELECTED         │ communication · PNC · actions  ├ ACCOUNT          │
//   │ RESOURCE         ├ CURRENT ACTIVITY               │ what they said   │
//   ├ SELECTED PERSON  ├ ACTIVITY LOG                   ├ REQUEST SUPPORT  │
//   └──────────────────┴────────────────────────────────┴──────────────────┘
//    Resource actions · PNC · ANPR · Firearms command
//
// Every action is a simulator task on the unit's crew — details, an
// account, a search, an arrest, a welfare check, a cordon, a closure, a
// vehicle stop — so the officer is busy while it runs and the shift log
// carries the outcome. The people and vehicles are the job's own records
// (src/lib/sim/records), shown as "Person 01" until details are taken and
// confirmed on the PNC. Person and vehicle checks open the LEDS terminal
// pre-filled; support requests go to control on the log.

import { useState, type ReactNode } from "react";
import type { Appliance } from "@/lib/sim/types";
import type { Incident, LogEntry, Task, TaskKind } from "@/lib/sim/incident_types";
import { TASK_MIN_CREW } from "@/lib/sim/incident_types";
import type { IncidentSimState } from "@/lib/sim/incident_sim";
import { dobDisplay, dobOf, type PersonRecord, type RecordIndex, type VehicleRecord } from "@/lib/sim/records";
import type { LedsCheck } from "@/lib/sim/leds";
import type { ResolvedDeployment } from "../components/incident-view";
import { competencyFor, type TaskWorkspaceProps } from "./mdt-task-workspace";
import { PncPage } from "./pnc-page";
import { AnprPage } from "./anpr-page";
import { updatePoliceRecord, usePoliceRecord, type PoliceRecord, type SupportKind, type WelfareOutcome } from "./police-store";

export type { SupportKind } from "./police-store";

type Page = "actions" | "pnc" | "anpr" | "firearms";
type ActionTab = "general" | "traffic" | "people" | "vehicles";

/** What an action button does: a simulator task, a door into LEDS, or a
 *  road-closure placement on the ground map. */
type ActionDef = {
  key: string;
  label: string;
  sub?: string;
  icon: ReactNode;
  target: "person" | "vehicle" | "none";
  kind?: TaskKind;
  leds?: "person" | "vehicle";
  closure?: "close_carriageway" | "close_road";
  /** A request to control rather than a task. */
  support?: SupportKind;
  /** A control on the road the crew records rather than runs as a task. */
  control?: string;
  /** Screen-side actions with no task behind them. */
  run?: "occupants" | "reopen" | "release";
  /** Only for crews with TPAC on their record. */
  tpac?: boolean;
  /** Custody transport needs someone under arrest. */
  requiresArrest?: boolean;
};

type Group = { title: string; icon: ReactNode; actions: ActionDef[] };

const I = {
  card: <Icon d="M3 6h18v12H3zM7 10h4m-4 3h6m5-3h2" />,
  note: <Icon d="M7 3h10v18H7zM10 7h4m-4 4h4m-4 4h2" />,
  person: <Icon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0" />,
  car: <Icon d="M5 13l2-5h10l2 5M4 13h16v5H4zM7 18v2m10-2v2M7 15h2m6 0h2" />,
  cuffs: <Icon d="M8 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm8 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM9 12l3-6 3 6M12 6V4" />,
  search: <Icon d="M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm5 11 5 5" />,
  heart: <Icon d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
  cone: <Icon d="M9 4h6l4 16H5zM7 14h10" />,
  tape: <Icon d="M3 8h18v8H3zM6 8l3 8m3-8 3 8m3-8-1 3" />,
  road: <Icon d="M6 21L9 3h6l3 18M12 6v3m0 3v3m0 3v3" />,
  shield: <Icon d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />,
  eye: <Icon d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
  box: <Icon d="M4 8h16v10H4zM4 8l2-4h12l2 4M8 18v2m8-2v2" />,
  stinger: <Icon d="M3 14h18M6 14l2-6m4 6 0-6m4 6 2-6" />,
  contact: <Icon d="M3 14h7l2-4 3 4h6M6 18v-4m12 4v-4" />,
  chat: <Icon d="M4 5h16v11H9l-5 4z" />,
  phone: <Icon d="M5 4h4l2 5-2 1a11 11 0 0 0 5 5l1-2 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  plus: <Icon d="M12 5v14M5 12h14" />,
  van: <Icon d="M3 7h11l4 4h3v6H3zM7 17v2m10-2v2" />,
  gun: <Icon d="M3 9h14l4-2v5h-4l-2 3H9l-1 4H5l1-4H3z" />,
  dog: <Icon d="M4 14l4-6h6l3 3h4v3l-3 1v5h-3v-3H9v3H6v-4z" />,
  heli: <Icon d="M3 6h18M12 6v3m-5 3h10l2 4H5zM9 16v3h6v-3M20 12h2" />,
  people: <Icon d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm7 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20a7 7 0 0 1 14 0m1-1a5 5 0 0 1 5 1" />,
  tow: <Icon d="M3 15h9l3-6h4l2 6v3H3zM7 18v2m10-2v2M12 9l-4 6" />,
  lane: <Icon d="M6 21L9 3m9 18L15 3M12 5v3m0 4v3m0 4v2" />,
  reopen: <Icon d="M20 12a8 8 0 1 1-3-6.2M20 4v5h-5" />,
  diversion: <Icon d="M12 20V10m0 0l-4 4m4-4 4 4M5 4h14l-7 6z" />,
  hand: <Icon d="M8 12V5a1.5 1.5 0 0 1 3 0v6m0-7a1.5 1.5 0 0 1 3 0v7m0-5a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-12 0v-3l-2-3a1.5 1.5 0 0 1 2.5-1.5z" />,
  play: <Icon d="M7 4l12 8-12 8z" />,
  fwd: <Icon d="M4 6l6 6-6 6m7-12 6 6-6 6" />,
  barrier: <Icon d="M3 9h18v6H3zM6 9l4 6m2-6 4 6M6 15v5m12-5v5" />,
  sign: <Icon d="M6 4h12v9H6zM12 13v7m-3 0h6" />,
  map: <Icon d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14m6-12v14" />,
  clockI: <Icon d="M12 8v5l3 2m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
  info: <Icon d="M12 8h.01M12 11v5m9-4a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
};

const A: Record<string, ActionDef> = {
  request_details: { key: "request_details", label: "Request details", sub: "Name, date of birth, address", icon: I.card, target: "person", kind: "request_details" },
  take_account: { key: "take_account", label: "Take account", sub: "In their own words", icon: I.note, target: "person", kind: "take_account" },
  person_check: { key: "person_check", label: "Person check", sub: "Opens PNC", icon: I.person, target: "person", leds: "person" },
  vehicle_check: { key: "vehicle_check", label: "Vehicle check", sub: "Opens PNC", icon: I.car, target: "vehicle", leds: "vehicle" },
  arrest: { key: "arrest", label: "Arrest", sub: "Caution and detain", icon: I.cuffs, target: "person", kind: "arrest" },
  stop_search: { key: "stop_search", label: "Stop and search", sub: "GOWISELY", icon: I.search, target: "person", kind: "stop_search" },
  welfare_check: { key: "welfare_check", label: "Welfare check", sub: "Safeguarding", icon: I.heart, target: "person", kind: "welfare_check" },
  cordon: { key: "cordon", label: "Cordon", sub: "Inner cordon", icon: I.tape, target: "none", kind: "cordon" },
  traffic_mgmt: { key: "traffic_mgmt", label: "Traffic management", sub: "Direct and hold", icon: I.cone, target: "none", kind: "traffic_mgmt" },
  scene_preservation: { key: "scene_preservation", label: "Scene preservation", sub: "Hold the scene", icon: I.shield, target: "none", kind: "scene_preservation" },
  close_carriageway: { key: "close_carriageway", label: "Close carriageway", sub: "Place cones on the map", icon: I.road, target: "none", closure: "close_carriageway" },
  close_road: { key: "close_road", label: "Close road", sub: "Full closure", icon: I.road, target: "none", closure: "close_road" },
  vehicle_stop: { key: "vehicle_stop", label: "Stop the vehicle", sub: "Compliant stop", icon: I.car, target: "vehicle", kind: "vehicle_stop" },
  follow_contain: { key: "follow_contain", label: "Follow and contain", sub: "No lights · keep obs", icon: I.eye, target: "vehicle", kind: "follow_contain" },
  tpac_box: { key: "tpac_box", label: "TPAC box", sub: "Enforced stop", icon: I.box, target: "vehicle", kind: "tpac_box", tpac: true },
  stinger: { key: "stinger", label: "Stinger", sub: "Deploy ahead", icon: I.stinger, target: "vehicle", kind: "stinger", tpac: true },
  tactical_contact: { key: "tactical_contact", label: "Tactical contact", sub: "Authorised only", icon: I.contact, target: "vehicle", kind: "tactical_contact", tpac: true },
  search_vehicle: { key: "search_vehicle", label: "Search vehicle", icon: I.car, target: "vehicle", kind: "vehicle_search" },
  view_occupants: { key: "view_occupants", label: "View occupants", icon: I.people, target: "vehicle", run: "occupants" },
  request_recovery: { key: "request_recovery", label: "Request recovery", icon: I.tow, target: "vehicle", support: "recovery" },
  close_lane: { key: "close_lane", label: "Close lane", icon: I.lane, target: "none", closure: "close_carriageway" },
  reopen_road: { key: "reopen_road", label: "Reopen road", icon: I.reopen, target: "none", run: "reopen" },
  set_diversion: { key: "set_diversion", label: "Set diversion", icon: I.diversion, target: "none", control: "Diversion in place" },
  hold_traffic: { key: "hold_traffic", label: "Hold traffic", icon: I.hand, target: "none", kind: "traffic_mgmt", control: "Traffic held" },
  release_traffic: { key: "release_traffic", label: "Release traffic", icon: I.play, target: "none", run: "release" },
  direct_traffic: { key: "direct_traffic", label: "Direct traffic", icon: I.fwd, target: "none", kind: "traffic_mgmt", control: "Directing traffic" },
  place_cones: { key: "place_cones", label: "Place cones", icon: I.cone, target: "none", kind: "cordon", control: "Cones placed" },
  place_barrier: { key: "place_barrier", label: "Place barrier", icon: I.barrier, target: "none", control: "Barrier placed" },
  place_sign: { key: "place_sign", label: "Place sign", icon: I.sign, target: "none", control: "Sign placed" },
  custody_transport: { key: "custody_transport", label: "Custody transport", sub: "Van to custody", icon: I.van, target: "person", kind: "convey_custody", support: "custody", requiresArrest: true },
  request_ambulance: { key: "request_ambulance", label: "Request ambulance", icon: I.plus, target: "none", support: "ambulance" },
};

const TABS: { key: ActionTab; label: string; icon: ReactNode }[] = [
  { key: "general", label: "General", icon: I.note },
  { key: "traffic", label: "Traffic", icon: I.car },
  { key: "people", label: "People", icon: I.people },
  { key: "vehicles", label: "Vehicles", icon: I.car },
];

const GENERAL_GROUPS: Group[] = [
  { title: "Communication", icon: I.chat, actions: [A.request_details, A.take_account] },
  { title: "PNC checks", icon: I.search, actions: [A.person_check, A.vehicle_check] },
  { title: "Actions", icon: I.cuffs, actions: [A.arrest, A.stop_search, A.welfare_check] },
];

const SEARCH_REASONS = ["Reported stolen property", "Reported prohibited item", "Linked incident information", "Other — enter reason"];
const SEARCH_POWERS = ["Section 1 PACE 1984 — stolen or prohibited articles", "Section 23 Misuse of Drugs Act 1971", "Section 60 CJPOA 1994 — authorised area", "Section 163 Road Traffic Act 1988 — stop", "Section 32 PACE 1984 — on arrest", "Section 165A RTA 1988 — no insurance, seize"];
const DIRECTIONS = ["Both directions", "Northbound", "Southbound", "Eastbound", "Westbound"];

const SUPPORT: { kind: SupportKind; label: string; icon: ReactNode; wording: string }[] = [
  { kind: "roads", label: "Roads policing", icon: I.car, wording: "requests a roads policing unit" },
  { kind: "highways", label: "Highways", icon: I.lane, wording: "requests Highways to attend" },
  { kind: "recovery", label: "Vehicle recovery", icon: I.tow, wording: "requests vehicle recovery" },
  { kind: "unit", label: "Additional unit", icon: I.car, wording: "requests an additional unit" },
  { kind: "supervisor", label: "Supervisor", icon: I.person, wording: "requests a supervisor to attend" },
  { kind: "ambulance", label: "Ambulance", icon: I.plus, wording: "requests an ambulance to scene" },
  { kind: "custody", label: "Custody transport", icon: I.van, wording: "requests custody transport for a detained person" },
  { kind: "arv", label: "Armed response", icon: I.gun, wording: "requests an ARV" },
  { kind: "dog", label: "Dog unit", icon: I.dog, wording: "requests a dog unit" },
  { kind: "npas", label: "NPAS", icon: I.heli, wording: "requests NPAS overhead" },
];

const GENERAL_SUPPORT: SupportKind[] = ["unit", "supervisor", "ambulance", "custody"];
const TRAFFIC_SUPPORT: SupportKind[] = ["roads", "highways", "recovery", "unit"];
const MORE_SUPPORT: SupportKind[] = ["arv", "dog", "npas"];

const OFFENCES = ["Theft from shop", "Robbery", "Burglary", "Assault", "Affray / public order", "Possession of an offensive weapon", "Possession of drugs", "Drink / drug driving", "Fail to stop", "Taking a vehicle without consent", "Breach of the peace", "On warrant", "Section 136 — mental health"];
const WELFARE: { key: WelfareOutcome; label: string }[] = [
  { key: "ok", label: "No concerns" },
  { key: "concern", label: "Safeguarding concern — refer" },
  { key: "medical", label: "Needs medical attention" },
];
const THREAT = ["Not assessed", "No firearm seen", "Firearm reported — unconfirmed", "Firearm seen", "Shots fired"];
const CONTAINMENT = ["None", "Loose containment", "Contained — armed cover in place", "Subject detained"];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function wall(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false });
}
function stamp(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function typeLabel(code: string): string {
  const special: Record<string, string> = {
    police_firearms_incident: "Firearms incident",
    police_domestic_in_progress: "Domestic in progress",
    police_burglary_in_progress: "Burglary in progress",
    police_fight_night_time_economy: "Fight · night-time economy",
    police_fail_to_stop_pursuit: "Fail to stop · pursuit",
    police_missing_child: "Missing child",
    police_robbery_knife: "Robbery · knife",
    police_concern_for_welfare: "Concern for welfare",
    police_anpr_hit_stolen_vehicle: "ANPR hit · stolen vehicle",
    police_shoplifter_detained: "Shoplifter detained",
    police_rtc_damage_only: "RTC · damage only",
    police_sudden_death_expected: "Sudden death · expected",
    police_drink_driver: "Drink driver",
    police_neighbour_dispute: "Neighbour dispute",
    police_mental_health_rcrp: "Mental health · RCRP",
    police_abandoned_999: "Abandoned 999",
    police_asb_youths: "ASB · youths",
    police_vehicle_stop_no_insurance: "Vehicle stop · no insurance",
    rtc_entrapment: "Road traffic collision · entrapment",
  };
  return special[code] ?? code.replace(/^police_/, "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

const ROLE_ORDER = ["suspect", "victim", "witness", "caller", "occupant", "keeper", "patient"];
function roleLabel(r: string): string {
  return r === "caller" ? "Informant" : r.replace(/^\w/, (c) => c.toUpperCase());
}

/** A person on the job as the officer meets them: a number until they
 *  give their details, a name once they have. */
type Person = { id: string; ref: string; record?: PersonRecord; casualtyId?: string; role: string; roles: string[] };

function personsOnJob(incident: Incident, sim: IncidentSimState | null, index?: RecordIndex): Person[] {
  const scenarioId = incident.scenarioId;
  const recs = (index?.people ?? []).filter((p) => (p.scenarioId === scenarioId || p.alsoScenarioIds?.includes(scenarioId)) && !p.roles.includes("crew"));
  const persons: Person[] = recs
    .map((r) => {
      const role = ROLE_ORDER.find((x) => r.roles.includes(x as PersonRecord["roles"][number])) ?? r.roles[0] ?? "person";
      return { id: r.id, ref: "", record: r, casualtyId: r.casualtyId, role, roles: r.roles as string[] };
    })
    .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
  // Casualties the sim knows that no record describes.
  for (const c of sim?.foundCasualties ?? []) {
    const stage = sim?.casualtyProgression?.[c.id]?.stage ?? "located";
    if (stage === "undiscovered") continue;
    if (persons.some((p) => p.casualtyId === c.id)) continue;
    persons.push({ id: `cas:${c.id}`, ref: "", casualtyId: c.id, role: "patient", roles: ["patient"] });
  }
  return persons.map((p, i) => ({ ...p, ref: `Person ${String(i + 1).padStart(2, "0")}` }));
}

function vehiclesOnJob(incident: Incident, index?: RecordIndex): VehicleRecord[] {
  const own = (index?.vehicles ?? []).filter((v) => v.scenarioId === incident.scenarioId);
  if (own.length) return own;
  // An ANPR-raised job carries its VRM in the trigger text, not a record.
  const m = `${incident.scenario.title} ${incident.scenario.trigger}`.match(/\b[A-Z]{2}\d{2}\s?[A-Z]{3}\b/);
  return m ? [{ id: `vrm:${m[0]}`, vrm: m[0], make: "", model: "", scenarioId: incident.scenarioId }] : [];
}

function nameMatches(query: string, name: string): boolean {
  const q = query.toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter(Boolean);
  const n = name.toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter(Boolean);
  return q.length > 0 && q.every((t) => n.includes(t));
}

/** The account a person gives — their side of it from the record, not
 *  the desk's intelligence lines. Suspects mostly say very little. */
function accountFor(p: Person): string {
  const notes = (p.record?.notes ?? []).filter((n) => !/^[A-Z][A-Z /]{3,} — /.test(n));
  if (p.role === "suspect") {
    const said = notes.find((n) => /says|states|admits|denies|claims/i.test(n));
    return said ? `States: ${said}` : "Declines to give an account beyond confirming details. \"No comment.\" Cautioned; account to be taken in interview.";
  }
  if (notes.length === 0) return "Gives a brief account. No further detail at this time.";
  return notes.slice(0, 3).map((n) => `States: ${n}`).join("\n\n");
}

/** What a search of this vehicle turns up — only what is physically in
 *  it, from the record's own lines. Markers are the PNC's business, not
 *  the search's: a no-insurance car with an empty boot is an empty boot. */
function findingsFor(v: VehicleRecord, persons: Person[]): string[] {
  const out: string[] = [];
  for (const n of v.notes ?? []) {
    if (/knife|blade|machete|weapon|firearm|drugs|cannabis|cocaine|wraps|cash|stolen property|tools|found in|in the boot|glovebox|under the seat/i.test(n)) out.push(n);
  }
  const keeper = persons.find((p) => p.record && (p.record.id === v.keeperId || p.record.vehicleIds?.includes(v.id)));
  if (out.length === 0) out.push(`Nothing found. Cabin, boot and glovebox clear; vehicle in order${keeper ? ` — keeper ${keeper.record!.name}` : ""}. Search recorded.`);
  return out;
}

export type PoliceControlsProps = Pick<TaskWorkspaceProps, "onStartTask" | "onAbortTask" | "onCompleteTask" | "onNote"> & {
  incident: Incident;
  incidentRef: string;
  appliance: Appliance;
  unit: ResolvedDeployment;
  resolved: ResolvedDeployment[];
  tasks: Task[];
  log: LogEntry[];
  now: number;
  sim: IncidentSimState | null;
  busyCrewIds?: Set<string>;
  resolvedIncident: boolean;
  recordIndex?: RecordIndex;
  ledsChecks?: LedsCheck[];
  onBeginRoadClosure?: (applianceId: string, kind: "close_carriageway" | "close_road", crewIds: string[]) => void;
  onOpenLeds?: (query?: string, kind?: "vehicle" | "person" | "address") => void;
  /** An enquiry made on the tablet joins the shift's PNC audit. */
  onLedsCheck?: (c: LedsCheck) => void;
  onOpenAnpr?: () => void;
  onRequestSupport?: (kind: SupportKind, applianceId: string) => void;
  onArmPlacement?: (applianceId: string) => void;
  onClose?: () => void;
  /** A page the desk asked for — the Systems menu's PNC and ANPR open
   *  here. Bumped seq re-opens it. */
  requestedPage?: { page: "pnc" | "anpr"; seq: number } | null;
  /** What the officer has in hand, for the tablet's top strip. */
  onSelectionChange?: (sel: PoliceSelection | null) => void;
};

export type PoliceSelection = {
  vehicle?: { vrm: string; description: string; make: string; model: string; colour: string; markers: string[]; checked: boolean; status: string };
  driver?: { label: string; dob?: string; identity: string; identityTone: "go" | "warn" | "stop"; status: string; markers: string[] };
};

const TAB_DEFAULT: Record<ActionTab, string> = { general: "take_account", traffic: "close_road", people: "request_details", vehicles: "search_vehicle" };

export function PoliceControlsScreen(props: PoliceControlsProps) {
  const { incident, incidentRef, appliance, unit, resolved, tasks, log, now, sim, resolvedIncident } = props;
  const record = usePoliceRecord(incident.id);
  const set = (fn: (r: PoliceRecord) => PoliceRecord) => updatePoliceRecord(incident.id, fn);
  const [page, setPage] = useState<Page>(props.requestedPage?.page ?? "actions");
  const [seenRequest, setSeenRequest] = useState(props.requestedPage?.seq ?? 0);
  if (props.requestedPage && props.requestedPage.seq !== seenRequest) {
    setSeenRequest(props.requestedPage.seq);
    setPage(props.requestedPage.page);
  }
  const [tab, setTabState] = useState<ActionTab>("general");
  const [actionKey, setActionKey] = useState<string>("take_account");
  const [personId, setPersonId] = useState<string>("");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [offence, setOffence] = useState(OFFENCES[0]);
  const [welfare, setWelfare] = useState<WelfareOutcome>("ok");
  const [searchReason, setSearchReason] = useState("");
  const [searchOther, setSearchOther] = useState("");
  const [searchGrounds, setSearchGrounds] = useState("");
  const [searchPower, setSearchPower] = useState("");
  const [direction, setDirection] = useState(DIRECTIONS[0]);
  const [threat, setThreat] = useState<string | null>(null);
  const [containment, setContainment] = useState<string | null>(null);
  const [pncSeed, setPncSeed] = useState<{ query: string; kind: "vehicle" | "person" } | null>(null);
  const openPnc = (query?: string, kind?: "vehicle" | "person") => {
    setPncSeed(query ? { query, kind: kind ?? "vehicle" } : null);
    setPage("pnc");
  };
  const note = (text: string) => props.onNote?.(`${appliance.callsign} · ${text}`);
  const setTab = (t: ActionTab) => {
    setTabState(t);
    setActionKey(TAB_DEFAULT[t]);
  };

  // ---- The job ---------------------------------------------------------------
  const sc = incident.scenario;
  const persons = personsOnJob(incident, sim, props.recordIndex);
  const vehicles = vehiclesOnJob(incident, props.recordIndex);
  const person = persons.find((p) => p.id === personId) ?? persons[0] ?? null;
  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? vehicles[0] ?? null;
  const active = tasks.filter((t) => t.state === "active");
  const mine = active.filter((t) => t.applianceId === appliance.id);
  const done = tasks.filter((t) => t.state === "completed");
  const onScene = unit.phase === "at_incident";
  const canAct = !resolvedIncident && onScene;
  const freeCrew = appliance.crewMembers.filter((c) => !props.busyCrewIds?.has(c.id));
  const tpacTrained = appliance.crewMembers.some((m) => competencyFor(appliance, m).tpac === "Current");
  const policeUnits = resolved.filter((r) => r.appliance.service === "Police");
  const arrested = done.filter((t) => t.kind === "arrest");
  const vanOnScene = resolved.find((r) => r.appliance.type === "Police_Van" && r.phase === "at_incident") ?? (appliance.type === "Police_Van" && onScene ? unit : undefined);
  const carrier = vanOnScene ?? (onScene ? unit : undefined);
  const carrierFree = carrier ? carrier.appliance.crewMembers.filter((c) => !props.busyCrewIds?.has(c.id)) : [];
  const status = resolvedIncident
    ? "Closed"
    : arrested.length
      ? `Arrest made · ${arrested.length}`
      : mine.length
        ? "In progress"
        : onScene
          ? "Initial enquiries"
          : unit.phase === "mobile"
            ? "Unit en route"
            : unit.phase.replace(/_/g, " ");
  const incidentLog = log.filter((e) => e.timestamp >= incident.receivedAt);
  const recentLog = incidentLog.slice(-5).reverse();
  const callsignOf = (applianceId: string) => resolved.find((r) => r.appliance.id === applianceId)?.appliance.callsign ?? applianceId;
  const lastSupport = (kind: SupportKind) => [...record.support].reverse().find((r) => r.kind === kind);

  // ---- The person in front of the officer ---------------------------------
  const detailsTask = (p: Person) => done.find((t) => t.kind === "request_details" && t.personId === p.id);
  const accountTask = (p: Person) => done.find((t) => t.kind === "take_account" && t.personId === p.id);
  const pncChecked = (p: Person) => !!p.record && (props.ledsChecks ?? []).some((c) => c.kind === "person" && nameMatches(c.query, p.record!.name));
  const displayName = (p: Person) => (detailsTask(p) && p.record ? p.record.name : p.ref);
  const displayNameDob = (p: Person) => { const d = detailsTask(p) && p.record ? dobDisplay(dobOf(p.record)) : undefined; return d ? `${displayName(p)} (${d})` : displayName(p); };
  const established = (p: Person) => !!detailsTask(p) || !!accountTask(p);
  const identity = (p: Person): { text: string; tone: "go" | "warn" | "stop" } => {
    if (!detailsTask(p)) return { text: "Not confirmed", tone: "warn" };
    if (!p.record) return { text: "Details given", tone: "go" };
    return pncChecked(p) ? { text: "Confirmed on PNC", tone: "go" } : { text: "Details given · not verified", tone: "warn" };
  };
  const welfareOf = (p: Person): { text: string; tone: "go" | "warn" | "stop" | "off" } => {
    const st = record.persons[p.id];
    const w = st?.welfare ?? (done.some((t) => t.kind === "welfare_check" && t.personId === p.id) ? "ok" : undefined);
    if (!w) return { text: "Not assessed", tone: "off" };
    return w === "ok" ? { text: "No concerns", tone: "go" } : w === "concern" ? { text: "Safeguarding concern", tone: "warn" } : { text: "Needs medical attention", tone: "stop" };
  };
  const accountOf = (p: Person): string | null => {
    const st = record.persons[p.id];
    if (st?.account !== undefined) return st.account;
    return accountTask(p) ? accountFor(p) : null;
  };
  const isArrested = (p: Person) => done.some((t) => t.kind === "arrest" && t.personId === p.id);
  const personStatus = (p: Person): string => {
    if (done.some((t) => t.kind === "convey_custody" && t.personId === p.id)) return "In custody";
    if (active.some((t) => t.kind === "convey_custody" && t.personId === p.id)) return "To custody";
    if (isArrested(p)) return "Arrested";
    const busy = mine.find((t) => t.personId === p.id);
    if (busy) return `${A[busy.kind]?.label ?? busy.kind} in progress`;
    if (accountTask(p)) return "Account available";
    if (detailsTask(p)) return "Details given";
    return "Awaiting details";
  };
  const occupantsOf = (v: VehicleRecord) => persons.filter((p) => p.record && (p.record.id === v.keeperId || p.record.vehicleIds?.includes(v.id)));

  // ---- Vehicles ------------------------------------------------------------------
  const searchTask = (v: VehicleRecord) => tasks.find((t) => t.kind === "vehicle_search" && t.vehicleVrm === v.vrm && t.state !== "aborted");
  const vehicleStatus = (v: VehicleRecord): string => {
    const t = searchTask(v);
    if (t?.state === "active") return "Search in progress";
    if (t?.state === "completed") return "Searched";
    if (record.vehicles[v.id]?.recoveryAt) return "Recovery requested";
    if (active.some((x) => x.vehicleVrm === v.vrm || (x.kind === "vehicle_stop" && !x.vehicleVrm))) return "Stop in progress";
    return "Not searched";
  };
  const describe = (v: VehicleRecord) => [v.colour, v.make, v.model].filter(Boolean).join(" ") || "Unknown vehicle";
  const searchReasonText = searchReason === "Other — enter reason" ? searchOther.trim() : searchReason;
  const searchReady = !!searchReasonText && searchGrounds.trim().length > 0 && !!searchPower;

  // ---- Traffic ---------------------------------------------------------------------
  const closureTasks = active.filter((t) => t.kind === "close_road" || t.kind === "close_carriageway");
  const trafficTasks = active.filter((t) => t.kind === "traffic_mgmt" || t.kind === "cordon");
  const controlRows = [
    ...closureTasks.map((t) => ({ id: t.id, location: t.closurePos ? `${t.closurePos.lat.toFixed(4)}, ${t.closurePos.lng.toFixed(4)}` : sc.location.address, control: t.kind === "close_road" ? "Road closed" : "Lane closed", resource: callsignOf(t.applianceId), taskId: t.id })),
    ...trafficTasks.map((t) => ({ id: t.id, location: sc.location.address, control: t.kind === "cordon" ? "Cones · inner cordon" : record.traffic.find((c) => c.id === `task:${t.id}`)?.control ?? "Traffic management", resource: callsignOf(t.applianceId), taskId: t.id })),
    ...record.traffic.filter((c) => !c.id.startsWith("task:")).map((c) => ({ id: c.id, location: c.location, control: c.control, resource: c.resource, taskId: undefined as string | undefined })),
  ];
  const placedClosure = (kind: "close_road" | "close_carriageway") => closureTasks.find((t) => t.kind === kind && t.applianceId === appliance.id);

  // ---- The selected action ----------------------------------------------------
  const action = A[actionKey] ?? A.take_account;
  const runningOfKind = action.kind
    ? mine.find((t) => t.kind === action.kind && (action.target !== "person" || t.personId === person?.id) && (action.target !== "vehicle" || !t.vehicleVrm || t.vehicleVrm === vehicle?.vrm) && (!action.control || record.traffic.some((c) => c.id === `task:${t.id}` && c.control === action.control) || action.kind === "cordon"))
    : undefined;
  const closureRunning = action.closure ? placedClosure(action.closure) : undefined;
  const minCrew = action.kind ? TASK_MIN_CREW[action.kind] : action.closure ? TASK_MIN_CREW[action.closure] : 1;
  const crewFor = freeCrew.slice(0, minCrew).map((c) => c.id);
  const needsPerson = action.target === "person";
  const needsVehicle = action.target === "vehicle";
  const targetMissing = (needsPerson && !person) || (needsVehicle && !vehicle);
  const tpacBlocked = !!action.tpac && !tpacTrained;
  const arrestBlocked = !!action.requiresArrest && !persons.some(isArrested);
  const isSearch = action.kind === "vehicle_search";
  const conveyRunning = action.kind === "convey_custody" ? active.find((t) => t.kind === "convey_custody" && t.personId === person?.id) : undefined;
  const primaryLabel = action.leds
    ? `Open PNC · ${action.leds === "person" ? (person ? displayName(person) : "person") : vehicle?.vrm ?? "vehicle"}`
    : action.closure
      ? closureRunning ? "Closure in place" : "Apply closure"
      : action.kind === "convey_custody"
      ? conveyRunning ? `To custody · ${mmss((conveyRunning.completesAt ?? now) - now)}` : done.some((t) => t.kind === "convey_custody" && t.personId === person?.id) ? "Booked in at custody" : carrier ? `Convey in ${carrier.appliance.callsign}${carrier.appliance.type === "Police_Van" ? " (van)" : ""}` : "Request custody transport"
    : action.support
        ? lastSupport(action.support) ? `Requested ${wall(lastSupport(action.support)!.at)} · ask again` : action.label
        : action.run === "occupants"
          ? "Occupants shown below"
          : action.run === "reopen"
            ? closureTasks.length ? `Reopen · ${closureTasks.length} closure${closureTasks.length === 1 ? "" : "s"}` : "No closure to reopen"
            : action.run === "release"
              ? trafficTasks.some((t) => t.kind === "traffic_mgmt") ? "Release traffic" : "No traffic held"
              : isSearch
                ? runningOfKind ? `Searching · ${mmss((runningOfKind.completesAt ?? now) - now)}` : searchTask(vehicle ?? { id: "", vrm: "", make: "", model: "" })?.state === "completed" ? "Search again" : "Begin search"
                : runningOfKind
                  ? runningOfKind.completesAt ? `In progress · ${mmss(runningOfKind.completesAt - now)}` : "In progress"
                  : `${action.label}${needsPerson && person ? ` · ${displayName(person)}` : needsVehicle && vehicle ? ` · ${vehicle.vrm}` : ""}`;
  const primaryDisabled = action.leds
    ? targetMissing || (action.leds === "person" && !!person && !detailsTask(person))
    : action.kind === "convey_custody"
      ? resolvedIncident || arrestBlocked || targetMissing || !!conveyRunning || done.some((t) => t.kind === "convey_custody" && t.personId === person?.id)
    : action.support
      ? resolvedIncident || arrestBlocked || targetMissing
      : action.run === "occupants"
        ? true
        : action.run === "reopen"
          ? closureTasks.length === 0 || !props.onAbortTask
          : action.run === "release"
            ? !trafficTasks.some((t) => t.kind === "traffic_mgmt") || !props.onCompleteTask
            : action.control && !action.kind
              ? !canAct
              : !canAct || targetMissing || tpacBlocked || !!runningOfKind || !!closureRunning || crewFor.length < minCrew || !props.onStartTask || (isSearch && !searchReady);

  function requestSupport(kind: SupportKind) {
    const def = SUPPORT.find((s) => s.kind === kind)!;
    set((r) => ({ ...r, support: [...r.support, { kind, at: now, by: appliance.callsign }] }));
    if (kind === "recovery" && vehicle) set((r) => ({ ...r, vehicles: { ...r.vehicles, [vehicle.id]: { ...r.vehicles[vehicle.id], recoveryAt: now } } }));
    props.onRequestSupport?.(kind, appliance.id);
    if (!props.onRequestSupport) note(def.wording);
  }

  function addControl(control: string, taskId?: string) {
    set((r) => ({ ...r, traffic: [...r.traffic, { id: taskId ? `task:${taskId}` : `ctl:${now}:${r.traffic.length}`, control, location: sc.location.address, resource: appliance.callsign, at: now }] }));
  }

  function runAction() {
    if (action.leds === "person" && person) return openPnc(person.record?.name ?? "", "person");
    if (action.leds === "vehicle" && vehicle) return openPnc(vehicle.vrm, "vehicle");
    if (action.kind === "convey_custody" && person) {
      if (!carrier || carrierFree.length === 0) return requestSupport("custody");
      const label = displayNameDob(person);
      props.onStartTask?.({ applianceId: carrier.appliance.id, kind: "convey_custody", assignedCrewIds: carrierFree.slice(0, Math.min(2, carrierFree.length)).map((c) => c.id), personId: person.id, personLabel: label });
      note(`${label} conveyed to custody by ${carrier.appliance.callsign}${carrier.appliance.type === "Police_Van" ? " — in the van" : " — in the car, two up"}`);
      return;
    }
    if (action.support) return requestSupport(action.support);
    if (action.run === "reopen") {
      for (const t of closureTasks) props.onAbortTask?.(t.id);
      set((r) => ({ ...r, traffic: r.traffic.filter((c) => c.control !== "Diversion in place") }));
      note("road reopened — closures lifted, diversion stood down");
      return;
    }
    if (action.run === "release") {
      for (const t of trafficTasks) if (t.kind === "traffic_mgmt") props.onCompleteTask?.(t.id);
      set((r) => ({ ...r, traffic: r.traffic.filter((c) => !c.id.startsWith("task:")) }));
      note("traffic released");
      return;
    }
    if (action.closure) {
      if (props.onBeginRoadClosure) {
        props.onBeginRoadClosure(appliance.id, action.closure, crewFor);
        note(`${action.label.toLowerCase()} · ${direction.toLowerCase()} — choosing the road segment on the incident map`);
      } else {
        props.onStartTask?.({ applianceId: appliance.id, kind: action.closure, assignedCrewIds: crewFor });
      }
      return;
    }
    if (action.control && !action.kind) {
      addControl(action.control);
      note(`${action.control.toLowerCase()} at ${sc.location.address}`);
      return;
    }
    if (!action.kind) return;
    const label = needsPerson && person ? displayNameDob(person) : undefined;
    const findings = isSearch && vehicle ? findingsFor(vehicle, persons) : undefined;
    const id = props.onStartTask?.({
      applianceId: appliance.id,
      kind: action.kind,
      assignedCrewIds: crewFor,
      personId: needsPerson ? person?.id : undefined,
      personLabel: label,
      vehicleVrm: needsVehicle ? vehicle?.vrm : undefined,
      searchFindings: findings?.join("; "),
    });
    if (action.control && typeof id === "string") addControl(action.control, id);
    if (action.kind === "arrest" && person) {
      set((r) => ({ ...r, persons: { ...r.persons, [person.id]: { ...r.persons[person.id], offence } } }));
      note(`${label} arrested — ${offence.toLowerCase()} — cautioned, nothing said in reply`);
    } else if (action.kind === "welfare_check" && person) {
      set((r) => ({ ...r, persons: { ...r.persons, [person.id]: { ...r.persons[person.id], welfare, welfareAt: now } } }));
    } else if (action.kind === "stop_search" && person) {
      note(`stop and search on ${label} — grounds recorded`);
    } else if (isSearch && vehicle) {
      set((r) => ({ ...r, vehicles: { ...r.vehicles, [vehicle.id]: { ...r.vehicles[vehicle.id], reason: searchReasonText, grounds: searchGrounds.trim(), power: searchPower, searchedAt: now, findings } } }));
      note(`search of ${vehicle.vrm} begun — ${searchReasonText.toLowerCase()} · ${searchPower.split(" — ")[0]} · grounds: ${searchGrounds.trim()}`);
    } else if (action.target === "vehicle" && vehicle) {
      note(`${action.label.toLowerCase()} — ${vehicle.vrm} ${describe(vehicle)}`);
    } else if (action.control) {
      note(`${action.control.toLowerCase()} at ${sc.location.address}`);
    }
  }

  function declareFirearms() {
    set((r) => ({ ...r, firearms: { ...r.firearms, declaredAt: now, declaredBy: appliance.callsign } }));
    note("FIREARMS INCIDENT DECLARED — armed response and a tactical firearms commander requested, unarmed officers to hold back");
  }
  function recordFirearms() {
    const t = threat ?? record.firearms.threat;
    const c = containment ?? record.firearms.containment;
    set((r) => ({ ...r, firearms: { ...r.firearms, threat: t, containment: c, recordedAt: now } }));
    setThreat(null);
    setContainment(null);
    note(`firearms assessment — threat: ${t.toLowerCase()} · containment: ${c.toLowerCase()}${record.firearms.notes ? ` · ${record.firearms.notes}` : ""}`);
  }

  const pick = (a: ActionDef) => {
    setActionKey(a.key);
    if (a.target === "person" && !personId && persons[0]) setPersonId(persons[0].id);
    if (a.target === "vehicle" && !vehicleId && vehicles[0]) setVehicleId(vehicles[0].id);
  };

  // ---- Shared pieces -----------------------------------------------------------
  const actionButton = (a: ActionDef, key?: string) => {
    const running = a.kind ? mine.some((t) => t.kind === a.kind && (!a.control || record.traffic.some((c) => c.id === `task:${t.id}` && c.control === a.control) || a.kind === "cordon")) : a.closure ? mine.some((t) => t.kind === a.closure) : false;
    const requested = a.support ? lastSupport(a.support) : undefined;
    const blocked = (!!a.tpac && !tpacTrained) || (!!a.requiresArrest && !persons.some(isArrested));
    return (
      <button key={key ?? a.key} type="button" className={`pc-action${actionKey === a.key ? " on" : ""}${running ? " running" : ""}${requested ? " done" : ""}`} aria-pressed={actionKey === a.key} disabled={blocked} onClick={() => pick(a)}>
        {a.icon}
        <span><strong>{a.label}</strong>{(a.sub || running || requested) && <small>{running ? "In progress" : requested ? `Requested ${wall(requested.at)}` : a.sub}</small>}</span>
        {a.leds && <em aria-hidden="true">↗</em>}
      </button>
    );
  };
  const group = (title: string, icon: ReactNode, actions: ActionDef[], cols = 2, extra?: ReactNode) => (
    <section className="pc-group">
      <header>{icon}<span>{title.toUpperCase()}</span>{extra}</header>
      <div className={`pc-actions n${cols}`}>{actions.map((a) => actionButton(a))}</div>
    </section>
  );
  const infoLine = (text: string, tone?: "warn" | "go") => <p className={`pc-info${tone ? ` ${tone}` : ""}`}>{I.info}<span>{text}</span></p>;

  const summaryCard = (
    <Card title="Incident summary" icon="▤">
      <dl className="pc-facts">
        <dt>Incident type</dt><dd>{typeLabel(sc.type)}</dd>
        <dt>Location</dt><dd>{sc.location.address}</dd>
        <dt>Incident reference</dt><dd>{incidentRef}</dd>
        <dt>Status</dt><dd className={resolvedIncident ? "" : "hi"}>{status}</dd>
        {tab === "general" && (<><dt>Reported at</dt><dd>{stamp(incident.receivedAt)}</dd></>)}
      </dl>
      {tab === "general" && (<><div className="pc-sub">Brief details</div><p className="pc-brief">{sc.trigger}</p></>)}
    </Card>
  );

  const resourceLine = (
    <>
      <label className="pc-field inline"><span>Resource</span><output className="hi">{appliance.callsign} · {appliance.typeName}</output></label>
      <div className="pc-inline-facts">
        <span><i className={`dot ${onScene ? "go" : unit.phase === "mobile" ? "warn" : "off"}`} />{onScene ? (mine.length ? "On scene · working" : "On scene") : unit.phase === "mobile" ? "En route" : unit.phase.replace(/_/g, " ")}</span>
        <span>Officers: <b>{appliance.crewMembers.length}</b>{freeCrew.length < appliance.crewMembers.length ? ` · ${appliance.crewMembers.length - freeCrew.length} committed` : ""}</span>
      </div>
    </>
  );
  const personSelect = (
    <label className="pc-field inline"><span>Person</span>
      <select value={person?.id ?? ""} onChange={(e) => setPersonId(e.target.value)} disabled={persons.length === 0}>
        {persons.length === 0 && <option value="">No one on the job</option>}
        {persons.map((p) => <option key={p.id} value={p.id}>{displayName(p)}{established(p) ? ` · ${roleLabel(p.role)}` : ""}</option>)}
      </select>
    </label>
  );
  const vehicleSelect = (
    <label className="pc-field inline"><span>Vehicle</span>
      <select value={vehicle?.id ?? ""} onChange={(e) => setVehicleId(e.target.value)} disabled={vehicles.length === 0}>
        {vehicles.length === 0 && <option value="">No vehicle on the job</option>}
        {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vrm}{v.make ? ` · ${describe(v)}` : ""}</option>)}
      </select>
    </label>
  );

  const resourceCard = (
    <Card title="Selected resource" icon="▣">
      <dl className="pc-facts">
        <dt>Resource</dt><dd className="hi">{appliance.callsign}<small> · {appliance.typeName}{tpacTrained ? " · TPAC" : ""}</small></dd>
        <dt>Status</dt><dd><i className={`dot ${onScene ? "go" : unit.phase === "mobile" ? "warn" : "off"}`} />{onScene ? (mine.length ? "On scene · working" : "On scene") : unit.phase === "mobile" ? "En route" : unit.phase.replace(/_/g, " ")}<small> · {appliance.crewMembers.length} officer{appliance.crewMembers.length === 1 ? "" : "s"}{freeCrew.length < appliance.crewMembers.length ? `, ${appliance.crewMembers.length - freeCrew.length} committed` : ""}</small></dd>
      </dl>
    </Card>
  );

  const resourcePersonCard = (
    <Card title="Resource & person" icon="●" fill>
      {resourceLine}
      {personSelect}
      <label className="pc-field inline"><span>Identity</span><output>{person ? <><i className={`badge ${identity(person).tone}`}>{identity(person).tone === "go" ? "✓" : "!"}</i><span className={identity(person).tone}>{identity(person).text}</span></> : "—"}</output></label>
    </Card>
  );
  const resourceVehicleCard = (
    <Card title="Resource & vehicle" icon="●" fill>
      {resourceLine}
      {vehicleSelect}
      {personSelect}
    </Card>
  );

  const personCard = (
    <Card title="Selected person" icon="●" fill headerExtra={persons.length > 1 ? <span className="pc-meta">{persons.length} on the job</span> : undefined}>
      {person ? (
        <>
          <div className="pc-person">
            <div className="pc-photo" aria-hidden="true">
              <svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="22" r="12" fill="currentColor" /><path d="M8 60a24 24 0 0 1 48 0z" fill="currentColor" /></svg>
            </div>
            <dl className="pc-facts tight">
              <dt>Name / Ref</dt><dd className="hi">{displayName(person)}{detailsTask(person) && person.record ? <small> · {person.ref}</small> : null}</dd>
              <dt>Role</dt><dd>{established(person) ? roleLabel(person.role) : "Not established"}</dd>
              {detailsTask(person) && person.record && dobOf(person.record) && (<><dt>DOB</dt><dd>{dobDisplay(dobOf(person.record))}{person.record.age ? <small> · age {person.record.age}</small> : null}</dd></>)}
              <dt>Identity</dt><dd><i className={`badge ${identity(person).tone}`}>{identity(person).tone === "go" ? "✓" : "!"}</i><span className={identity(person).tone}>{identity(person).text}</span></dd>
              <dt>Welfare</dt><dd><i className={`badge ${welfareOf(person).tone}`}>{welfareOf(person).tone === "off" ? "?" : welfareOf(person).tone === "go" ? "✓" : "!"}</i>{welfareOf(person).text}</dd>
              {isArrested(person) && (<><dt>Custody</dt><dd className="stop">ARRESTED · {record.persons[person.id]?.offence ?? "offence recorded"}</dd></>)}
            </dl>
          </div>
          {pncChecked(person) && person.record?.markers?.length ? <div className="pc-markers">{person.record.markers.map((m) => <span key={m} className="pc-marker">{m}</span>)}</div> : null}
          {persons.length > 1 && personSelect}
        </>
      ) : (
        <p className="pc-note">No one identified on this job yet.</p>
      )}
    </Card>
  );

  const tabsRow = (
    <div className="pc-tabs" role="tablist">
      {TABS.map((t) => (
        <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>{t.icon}<span>{t.label}</span></button>
      ))}
    </div>
  );

  const peopleTable = (
    <section className="pc-group">
      <header>{I.people}<span>PEOPLE AT INCIDENT</span></header>
      <table className="pc-table select">
        <thead><tr><th>Person</th><th>Role</th><th>Status</th></tr></thead>
        <tbody>
          {persons.length === 0 && <tr><td colSpan={3} className="empty">No one identified on this job yet</td></tr>}
          {persons.map((p) => (
            <tr key={p.id} className={person?.id === p.id ? "on" : ""} onClick={() => setPersonId(p.id)}>
              <td>{displayName(p)}</td>
              <td>{established(p) ? roleLabel(p.role) : "Not established"}</td>
              <td>{personStatus(p)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
  const vehiclesTable = (
    <section className="pc-group">
      <header>{I.car}<span>VEHICLES AT INCIDENT</span></header>
      <table className="pc-table select">
        <thead><tr><th>Registration</th><th>Description</th><th>Status</th></tr></thead>
        <tbody>
          {vehicles.length === 0 && <tr><td colSpan={3} className="empty">No vehicle on this job</td></tr>}
          {vehicles.map((v) => (
            <tr key={v.id} className={vehicle?.id === v.id ? "on" : ""} onClick={() => setVehicleId(v.id)}>
              <td><b>{v.vrm}</b></td>
              <td>{describe(v)}</td>
              <td>{vehicleStatus(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );

  const activityCard = (
    <Card title="Current activity" icon="▶">
      {mine.length === 0 ? (
        <div className="pc-activity">
          <strong>{appliance.callsign} <span>•</span> {onScene ? "Available on scene" : unit.phase === "mobile" ? "En route" : "Not on scene"}</strong>
          <span className="st"><i className={`dot ${canAct ? "go" : "off"}`} />{canAct ? "Ready to begin" : resolvedIncident ? "Incident closed" : "Waiting to arrive"}</span>
        </div>
      ) : (
        mine.map((t) => (
          <div key={t.id} className="pc-activity">
            <strong>{appliance.callsign} <span>•</span> {A[t.kind]?.label ?? t.kind.replace(/_/g, " ")}{t.personLabel ? ` · ${t.personLabel}` : t.vehicleVrm ? ` · ${t.vehicleVrm}` : ""}</strong>
            <span className="st">
              <i className="dot warn" />
              {t.completesAt ? `${mmss(t.completesAt - now)} remaining` : `Ongoing · ${mmss(now - t.startedAt)}`}
              {!t.completesAt && props.onCompleteTask && <button type="button" className="pc-mini" onClick={() => props.onCompleteTask?.(t.id)}>Complete</button>}
              {props.onAbortTask && <button type="button" className="pc-mini" onClick={() => props.onAbortTask?.(t.id)}>Abort</button>}
            </span>
          </div>
        ))
      )}
    </Card>
  );

  const logCard = (
    <Card title="Activity log" icon="≡" fill>
      <div className="pc-log">
        {recentLog.length === 0 && <div className="row"><span /><span>Nothing logged yet</span></div>}
        {recentLog.map((e) => <div key={e.id} className={`row ${e.kind}`}><span>{wall(e.timestamp)}</span><span>{e.message}</span></div>)}
      </div>
    </Card>
  );

  const searchStatusCard = (
    <section className="pc-group">
      <header>{I.note}<span>SEARCH STATUS</span></header>
      <div className="pc-status-row">
        <div className="pc-status-cell">{I.car}<b>{vehicle?.vrm ?? "No vehicle"}</b></div>
        <div className="pc-status-cell">{I.clockI}<span>
          {(() => {
            const t = vehicle ? searchTask(vehicle) : undefined;
            if (t?.state === "active") return <><b>Search in progress</b><small>{mmss((t.completesAt ?? now) - now)} remaining · {record.vehicles[vehicle!.id]?.power?.split(" — ")[0]}</small></>;
            if (t?.state === "completed") return <><b>Search complete</b><small>{wall(t.completesAt ?? t.startedAt)} · {record.vehicles[vehicle!.id]?.reason}</small></>;
            return <><b>Not started</b><small>Select a reason to begin.</small></>;
          })()}
        </span></div>
      </div>
      <div className="pc-status-cell wide">{I.tow}<span><b>RECOVERY STATUS</b><small>{vehicle && record.vehicles[vehicle.id]?.recoveryAt ? `Recovery requested ${wall(record.vehicles[vehicle.id].recoveryAt!)} — awaiting the truck.` : "No recovery requested."}</small></span></div>
    </section>
  );

  const actionsCard = (
    <Card title="Resource actions" icon="⚙" fill={tab !== "general"}>
      {tabsRow}
      {tab === "general" && GENERAL_GROUPS.map((g) => <div key={g.title}>{group(g.title, g.icon, g.actions, g.actions.length >= 3 ? 3 : 2)}</div>)}
      {tab === "people" && (
        <>
          {peopleTable}
          {group("Person actions", I.person, [A.request_details, A.take_account, A.person_check, A.arrest, A.stop_search, A.welfare_check])}
          {group("Transport", I.van, [A.custody_transport, A.request_ambulance], 2, undefined)}
          {infoLine(active.some((t) => t.kind === "convey_custody") ? `${callsignOf(active.find((t) => t.kind === "convey_custody")!.applianceId)} conveying ${active.find((t) => t.kind === "convey_custody")!.personLabel ?? "the detained person"} to custody.` : done.some((t) => t.kind === "convey_custody") ? "Detained person booked in at custody." : lastSupport("custody") ? `Custody transport requested ${wall(lastSupport("custody")!.at)}.` : lastSupport("ambulance") ? `Ambulance requested ${wall(lastSupport("ambulance")!.at)}.` : vanOnScene ? `${vanOnScene.appliance.callsign} (van) on scene for transport.` : "No transport assigned.")}
        </>
      )}
      {tab === "vehicles" && (
        <>
          {vehiclesTable}
          {group("Vehicle actions", I.car, [A.vehicle_check, A.search_vehicle, A.view_occupants, A.request_recovery])}
          {(sc.type.includes("pursuit") || sc.type.includes("anpr") || sc.type.includes("drink") || tpacTrained) && group("Stop & tactics", I.box, [A.vehicle_stop, A.follow_contain, ...(tpacTrained ? [A.tpac_box, A.stinger, A.tactical_contact] : [])], tpacTrained ? 3 : 2, !tpacTrained ? <em>crew not TPAC trained</em> : undefined)}
          {searchStatusCard}
        </>
      )}
      {tab === "traffic" && (
        <>
          {group("Road control", I.road, [A.close_road, A.close_lane, A.reopen_road, A.set_diversion])}
          {group("Traffic flow", I.cone, [A.hold_traffic, A.release_traffic, A.direct_traffic], 3)}
          {group("Scene equipment", I.cone, [A.place_cones, A.place_barrier, A.place_sign], 3)}
          <section className="pc-group">
            <header>{I.note}<span>ACTIVE TRAFFIC CONTROLS</span></header>
            <table className="pc-table">
              <thead><tr><th>Location</th><th>Control</th><th>Resource</th></tr></thead>
              <tbody>
                {controlRows.length === 0 && <tr><td colSpan={3} className="empty">{I.cone} No traffic controls active.</td></tr>}
                {controlRows.map((r) => <tr key={r.id}><td>{r.location}</td><td>{r.control}</td><td>{r.resource}</td></tr>)}
              </tbody>
            </table>
          </section>
        </>
      )}
    </Card>
  );

  const detailsCard = (
    <Card title="Action details" icon="▤">
      <label className="pc-field inline"><span>Selected action</span><output>{action.label}</output></label>
      {needsPerson && personSelect}
      {needsVehicle && vehicleSelect}
      {tab !== "general" && <label className="pc-field inline"><span>Resource</span><output>{appliance.callsign}</output></label>}
      {action.kind === "arrest" && (
        <label className="pc-field inline"><span>Offence</span>
          <select value={offence} onChange={(e) => setOffence(e.target.value)}>{OFFENCES.map((o) => <option key={o} value={o}>{o}</option>)}</select>
        </label>
      )}
      {action.kind === "welfare_check" && (
        <label className="pc-field inline"><span>Outcome</span>
          <select value={welfare} onChange={(e) => setWelfare(e.target.value as WelfareOutcome)}>{WELFARE.map((w) => <option key={w.key} value={w.key}>{w.label}</option>)}</select>
        </label>
      )}
      {isSearch && (
        <>
          <label className="pc-field inline"><span>Reason for search <b>*</b></span>
            <select value={searchReason} onChange={(e) => setSearchReason(e.target.value)}>
              <option value="">Select reason…</option>
              {SEARCH_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          {searchReason === "Other — enter reason" && <label className="pc-field inline"><span>Reason</span><input value={searchOther} onChange={(e) => setSearchOther(e.target.value)} placeholder="Enter the reason" /></label>}
          <label className="pc-field"><span>Grounds / supporting details <b>*</b></span>
            <textarea className="pc-account short" value={searchGrounds} placeholder="Describe the information supporting this search…" onChange={(e) => setSearchGrounds(e.target.value)} />
          </label>
          <label className="pc-field inline"><span>Power / authority <b>*</b></span>
            <select value={searchPower} onChange={(e) => setSearchPower(e.target.value)}>
              <option value="">Select applicable authority</option>
              {SEARCH_POWERS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        </>
      )}
      {action.closure && (
        <>
          <label className="pc-field inline"><span>Road segment</span><output>{closureRunning ? (closureRunning.closurePos ? `Placed · ${closureRunning.closurePos.lat.toFixed(4)}, ${closureRunning.closurePos.lng.toFixed(4)}` : "Placed") : "Select on map"}</output></label>
          <button type="button" className="pc-mini wide" disabled={!canAct || !props.onBeginRoadClosure || !!closureRunning || crewFor.length < minCrew} onClick={() => { props.onBeginRoadClosure?.(appliance.id, action.closure!, crewFor); note(`${action.label.toLowerCase()} · ${direction.toLowerCase()} — choosing the road segment on the incident map`); }}>{I.map}<span>Choose on map</span></button>
          <label className="pc-field inline"><span>Direction</span>
            <select value={direction} onChange={(e) => setDirection(e.target.value)}>{DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}</select>
          </label>
        </>
      )}
      {action.run === "occupants" && vehicle && (
        <div className="pc-occupants">
          {occupantsOf(vehicle).length === 0 ? <p className="pc-note">No occupants on record for {vehicle.vrm} — speak to whoever is with the vehicle.</p> : occupantsOf(vehicle).map((p) => (
            <button key={p.id} type="button" className="pc-row-btn" onClick={() => { setPersonId(p.id); setTab("people"); }}>
              {I.person}<span><b>{displayName(p)}</b><small>{p.record!.id === vehicle.keeperId ? "Registered keeper" : roleLabel(p.role)} · {personStatus(p)}</small></span><em>›</em>
            </button>
          ))}
        </div>
      )}
      {action.leds === "person" && person && !detailsTask(person) && infoLine("Take the person's details first — the PNC needs a name and date of birth.", "warn")}
      {tpacBlocked && infoLine("This crew is not TPAC trained — request a roads policing unit.", "warn")}
      {arrestBlocked && infoLine("Custody transport needs someone under arrest.", "warn")}
      {!canAct && !action.leds && !action.support && infoLine(resolvedIncident ? "The incident is closed." : "Actions start once the unit is on scene.")}
      {canAct && !action.leds && !action.support && !action.run && crewFor.length < minCrew && infoLine("All officers are committed — abort or complete a task first.", "warn")}
      <button type="button" className={`pc-primary${runningOfKind || closureRunning ? " running" : ""}`} disabled={primaryDisabled} onClick={runAction}>
        {action.closure ? <Icon d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM5.6 5.6l12.8 12.8" /> : action.icon}<span>{primaryLabel}</span>
      </button>
      {isSearch && !searchReady && canAct && infoLine("Complete the required fields to continue.")}
      {action.closure && !closureRunning && canAct && infoLine("Select a road segment on the incident map.")}
      {runningOfKind && props.onAbortTask && <button type="button" className="pc-mini" onClick={() => props.onAbortTask?.(runningOfKind.id)}>Abort {action.label.toLowerCase()}</button>}
    </Card>
  );

  const accountCard = (
    <Card title="Account" icon="▤" fill headerExtra={person && accountOf(person) !== null ? <span className="pc-meta">{displayName(person)}</span> : undefined}>
      {person && accountOf(person) !== null ? (
        <textarea className="pc-account" value={accountOf(person) ?? ""} onChange={(e) => { const v = e.target.value; set((r) => ({ ...r, persons: { ...r.persons, [person.id]: { ...r.persons[person.id], account: v } } })); }} />
      ) : (
        <div className="pc-account empty">{person && mine.some((t) => t.kind === "take_account" && t.personId === person.id) ? `Taking ${displayName(person)}\u2019s account…` : "The person\u2019s account will appear here."}</div>
      )}
    </Card>
  );

  const personDetailsCard = (
    <Card title="Person details" icon="●">
      {person ? (
        <>
          <dl className="pc-facts">
            <dt>Name</dt><dd>{detailsTask(person) && person.record ? person.record.name : "Not provided"}</dd>
            <dt>Date of birth</dt><dd>{detailsTask(person) && person.record ? (dobDisplay(dobOf(person.record)) ? `${dobDisplay(dobOf(person.record))}${person.record.age ? ` · age ${person.record.age}` : ""}` : "Not given") : "Not provided"}</dd>
            <dt>Address</dt><dd>{detailsTask(person) && person.record ? person.record.address ?? "No fixed address" : "Not provided"}</dd>
            <dt>Identity status</dt><dd><i className={`badge ${identity(person).tone}`}>{identity(person).tone === "go" ? "✓" : "!"}</i><span className={identity(person).tone}>{identity(person).text}</span></dd>
            {isArrested(person) && (<><dt>Custody</dt><dd className="stop">ARRESTED · {record.persons[person.id]?.offence ?? "offence recorded"}</dd></>)}
          </dl>
          {pncChecked(person) && person.record?.markers?.length ? <div className="pc-markers">{person.record.markers.map((m) => <span key={m} className="pc-marker">{m}</span>)}</div> : null}
          {!detailsTask(person) && infoLine(mine.some((t) => t.kind === "request_details" && t.personId === person.id) ? "Details appear after the person responds." : "Request details to identify the person.")}
          {accountOf(person) !== null && <><div className="pc-sub">Account</div><p className="pc-brief">{accountOf(person)}</p></>}
        </>
      ) : (
        <p className="pc-note">No one identified on this job yet.</p>
      )}
    </Card>
  );

  const findingsCard = (
    <Card title="Search findings" icon="▤" fill>
      {vehicle && searchTask(vehicle)?.state === "completed" ? (
        <>
          <dl className="pc-facts">
            <dt>Vehicle</dt><dd className="hi">{vehicle.vrm} · {describe(vehicle)}</dd>
            <dt>Reason</dt><dd>{record.vehicles[vehicle.id]?.reason ?? "—"}</dd>
            <dt>Power</dt><dd>{record.vehicles[vehicle.id]?.power ?? "—"}</dd>
            <dt>Grounds</dt><dd>{record.vehicles[vehicle.id]?.grounds ?? "—"}</dd>
          </dl>
          <div className="pc-sub">Findings</div>
          <ul className="pc-findings">{(record.vehicles[vehicle.id]?.findings ?? searchTask(vehicle)!.searchFindings?.split("; ") ?? []).map((f) => <li key={f}>{f}</li>)}</ul>
        </>
      ) : (
        <div className="pc-account empty">{I.info}<span>{vehicle && searchTask(vehicle)?.state === "active" ? "Search in progress…" : "No search completed."}</span></div>
      )}
    </Card>
  );

  const supportCard = (kinds: SupportKind[]) => (
    <Card title="Request support" icon="☎">
      <div className="pc-support">
        {kinds.map((k) => {
          const s = SUPPORT.find((x) => x.kind === k)!;
          const last = lastSupport(k);
          return (
            <button key={k} type="button" className={`pc-action${last ? " done" : ""}`} disabled={resolvedIncident || (k === "custody" && !persons.some(isArrested))} onClick={() => requestSupport(k)}>
              {s.icon}<span><strong>{s.label}</strong><small>{last ? `Requested ${wall(last.at)}` : "Ask control"}</small></span>
            </button>
          );
        })}
      </div>
      {tab === "general" && (
        <div className="pc-support-more">
          {MORE_SUPPORT.map((k) => { const s = SUPPORT.find((x) => x.kind === k)!; const last = lastSupport(k); return <button key={k} type="button" className={`pc-mini${last ? " done" : ""}`} disabled={resolvedIncident} onClick={() => requestSupport(k)}>{s.label}{last ? " ✓" : ""}</button>; })}
        </div>
      )}
    </Card>
  );

  // The strip above the modules shows what is in hand. Reported as a
  // string-keyed snapshot so the tablet re-renders only when it changes.
  const vehicleChecked = (v: VehicleRecord) => (props.ledsChecks ?? []).some((c) => c.kind === "vehicle" && c.query.replace(/\s/g, "").toUpperCase() === v.vrm.replace(/\s/g, "").toUpperCase());
  const selection: PoliceSelection | null = vehicle || person
    ? {
        vehicle: vehicle ? { vrm: vehicle.vrm, description: describe(vehicle), make: vehicle.make, model: vehicle.model, colour: vehicle.colour ?? "", markers: vehicleChecked(vehicle) ? (vehicle.markers ?? []) : [], checked: vehicleChecked(vehicle), status: vehicleStatus(vehicle) } : undefined,
        driver: person ? { label: displayName(person), dob: detailsTask(person) && person.record ? dobDisplay(dobOf(person.record)) : undefined, identity: identity(person).text, identityTone: identity(person).tone, status: personStatus(person), markers: pncChecked(person) ? (person.record?.markers ?? []) : [] } : undefined,
      }
    : null;
  const selectionKey = JSON.stringify(selection);
  const [seenSelection, setSeenSelection] = useState("");
  if (selectionKey !== seenSelection) {
    setSeenSelection(selectionKey);
    props.onSelectionChange?.(selection);
  }

  const arvs = resolved.filter((r) => r.appliance.type === "Police_ARV");
  const firearmsPage = (
    <>
      <div className="pc-col">
        <Card title="Firearms incident" icon="!" fill>
          <dl className="pc-facts">
            <dt>Declared</dt><dd className={record.firearms.declaredAt ? "stop" : ""}>{record.firearms.declaredAt ? `${wall(record.firearms.declaredAt)} by ${record.firearms.declaredBy}` : "Not declared"}</dd>
            <dt>Threat</dt><dd>{record.firearms.threat}</dd>
            <dt>Containment</dt><dd>{record.firearms.containment}</dd>
            <dt>Armed units</dt><dd>{arvs.length ? arvs.map((r) => `${r.appliance.callsign} · ${r.phase === "at_incident" ? "on scene" : r.phase === "mobile" ? "en route" : r.phase.replace(/_/g, " ")}`).join(" · ") : "None committed"}</dd>
          </dl>
          <p className="pc-note">Declaring a firearms incident puts armed response on the run and holds unarmed officers back. Tactical firearms command follows in a later module.</p>
          <button type="button" className="pc-primary stop" disabled={!!record.firearms.declaredAt || resolvedIncident} onClick={declareFirearms}>{I.gun}<span>{record.firearms.declaredAt ? "Firearms incident declared" : "Declare a firearms incident"}</span></button>
          <button type="button" className="pc-mini" disabled={resolvedIncident} onClick={() => requestSupport("arv")}>Request ARV{lastSupport("arv") ? " ✓" : ""}</button>
        </Card>
      </div>
      <div className="pc-col">
        <Card title="Threat assessment" icon="▤" fill>
          <label className="pc-field"><span>Threat</span>
            <select value={threat ?? record.firearms.threat} onChange={(e) => setThreat(e.target.value)}>{THREAT.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          </label>
          <label className="pc-field"><span>Containment</span>
            <select value={containment ?? record.firearms.containment} onChange={(e) => setContainment(e.target.value)}>{CONTAINMENT.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          </label>
          <label className="pc-field"><span>Notes</span>
            <textarea className="pc-account short" value={record.firearms.notes} placeholder="Subject description, last seen, weapon, cover…" onChange={(e) => { const v = e.target.value; set((r) => ({ ...r, firearms: { ...r.firearms, notes: v } })); }} />
          </label>
          <button type="button" className="pc-primary" disabled={resolvedIncident} onClick={recordFirearms}>{I.note}<span>{record.firearms.recordedAt ? `Recorded ${wall(record.firearms.recordedAt)} · update` : "Record assessment"}</span></button>
        </Card>
      </div>
      <div className="pc-col">
        <Card title="Armed response" icon="▣">
          {arvs.length === 0 ? <p className="pc-note">No armed response vehicle committed to this job.</p> : (
            <table className="pc-table">
              <thead><tr><th>Unit</th><th>Status</th><th>AFOs</th></tr></thead>
              <tbody>
                {arvs.map((r) => (
                  <tr key={r.appliance.id}>
                    <td><b>{r.appliance.callsign}</b><small>{r.appliance.typeName}</small></td>
                    <td><i className={`dot ${r.phase === "at_incident" ? "go" : r.phase === "mobile" ? "warn" : "off"}`} />{r.phase === "at_incident" ? "On scene" : r.phase === "mobile" ? "En route" : r.phase.replace(/_/g, " ")}</td>
                    <td>{r.appliance.crewMembers.filter((c) => /Firearms/i.test(c.role) || c.quals.some((q) => /AFO/.test(q))).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        {logCard}
      </div>
    </>
  );

  return (
    <div className="pc-screen" role="region" aria-label="Police controls">
      <header className="fc-head">
        <div className="fc-brand">
          <Icon d="M4 10l8-4 8 4-8 3-8-3zm2 3v4c0 2 3 4 6 4s6-2 6-4v-4" />
          <h1>POLICE CONTROLS <span>SIMULATION</span></h1>
        </div>
        <div className="fc-head-right">
          <span className="fc-who">{incidentRef}</span>
          <div className="fc-time"><small>SCENARIO TIME</small><strong>{clock(now - incident.receivedAt)}</strong></div>
          {props.onClose && <button type="button" className="fc-close" onClick={props.onClose}>✕ Close</button>}
        </div>
      </header>

      <main className={`pc-main ${page}`}>
        {page === "actions" ? (
          <>
            <div className="pc-col">
              {summaryCard}
              {tab === "general" ? <>{resourceCard}{personCard}</> : tab === "vehicles" ? resourceVehicleCard : resourcePersonCard}
            </div>
            <div className="pc-col">{actionsCard}{tab === "general" && <>{activityCard}{logCard}</>}</div>
            <div className="pc-col">
              {detailsCard}
              {tab === "general" && <>{accountCard}{supportCard(GENERAL_SUPPORT)}</>}
              {tab === "people" && <>{personDetailsCard}{logCard}</>}
              {tab === "vehicles" && <>{findingsCard}{logCard}</>}
              {tab === "traffic" && <>{supportCard(TRAFFIC_SUPPORT)}{logCard}</>}
            </div>
          </>
        ) : page === "pnc" ? (
          <PncPage
            key={pncSeed ? `${pncSeed.kind}:${pncSeed.query}` : "pnc"}
            index={props.recordIndex}
            incidentId={incident.id}
            incidentRef={incidentRef}
            unitCallsign={appliance.callsign}
            checks={props.ledsChecks ?? []}
            now={now}
            seed={pncSeed}
            context={{ vehicle: vehicle?.vrm, person: person && detailsTask(person) && person.record ? person.record.name : undefined }}
            onCheck={props.onLedsCheck}
            onNote={props.onNote}
          />
        ) : page === "anpr" ? (
          <AnprPage
            appliance={appliance}
            incidentRef={incidentRef}
            now={now}
            index={props.recordIndex}
            jobVehicles={vehicles}
            onOpenPnc={(vrm) => openPnc(vrm, "vehicle")}
            onSelectVehicle={(vrm) => { const v = vehicles.find((x) => x.vrm.replace(/\s/g, "") === vrm.replace(/\s/g, "")); if (v) setVehicleId(v.id); }}
            onNote={props.onNote}
          />
        ) : firearmsPage}
      </main>

      <footer className="fc-foot pc-foot">
        <button type="button" aria-pressed={page === "actions"} onClick={() => setPage("actions")}>{I.note}<span>Resource actions</span>{mine.length > 0 && <em>{mine.length}</em>}</button>
        <button type="button" aria-pressed={page === "pnc"} onClick={() => openPnc()}>{I.search}<span>PNC</span></button>
        <button type="button" aria-pressed={page === "anpr"} onClick={() => setPage("anpr")}>{I.car}<span>ANPR</span></button>
        <button type="button" aria-pressed={page === "firearms"} onClick={() => setPage("firearms")}>{I.people}<span>Firearms command</span>{record.firearms.declaredAt && <em>!</em>}</button>
      </footer>
    </div>
  );
}

function Card({ title, icon, children, fill, headerExtra }: { title: string; icon: string; children: ReactNode; fill?: boolean; headerExtra?: ReactNode }) {
  return (
    <section className={`pc-card${fill ? " fill" : ""}`}>
      <header><b>{icon}</b><span>{title.toUpperCase()}</span>{headerExtra}</header>
      <div className="pc-card-body">{children}</div>
    </section>
  );
}
