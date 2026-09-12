"use client";

// The MDT task workspace — the Actions and Water pages of the VECTOR
// tablet, rebuilt from the prototype's `rcTaskWorkspace` template:
//
//   UNIT TASKING          active order cards with Accept / Confirm issue /
//                         Report complete / Unable to complete, crew
//                         updates, handovers and a timeline
//   AVAILABLE TASKS       the catalogue for this unit (WATER SUPPLY &
//                         FIREFIGHTING on the Water page)
//   TASK ORDER            01 TASK · 02 EQUIPMENT · 03 WORKING LOCATION ·
//                         04 CREW · 05 EQUIPMENT ALLOCATION · summary
//   Task history          finished orders and item-by-item returns
//
// Every order here drives the real simulator: "Reserve task & equipment"
// raises the paperwork, "Confirm issue & start" starts the sim task, and
// the sim completing or failing the task closes the order.

import { useEffect, useState } from "react";
import {
  type Appliance,
  type CrewMember,
} from "@/lib/sim/types";
import {
  ENTRY_TOOL_LABEL,
  TASK_MIN_CREW,
  TASK_SERVICES,
  type EntryTool,
  type HoseAttackMode,
  type Incident,
  type KitKind,
  type Task,
  type TaskKind,
} from "@/lib/sim/incident_types";
import { mitigationOptionsFor } from "@/lib/sim/mitigation";
import type { StartTaskFn } from "../components/bottom-action-menu";
import {
  readOrders,
  updateOrders,
  useMdtOrders,
  type Allocation,
  type Competency,
  type MdtOrder,
  type OrderStatus,
  type SimTarget,
} from "./mdt-orders";

// ---------------------------------------------------------------------------
// Task catalogue — the prototype's MDT_TASK_CONFIG / MDT_TASK_DETAIL /
// TASK_LABEL, with equipment named the way this simulator's appliance
// loadouts name it and the sim's extra kinds added in the same voice.
// ---------------------------------------------------------------------------

export const TASK_LABEL: Record<TaskKind, string> = {
  survey: "Survey",
  gain_entry: "Gain entry",
  connect_hydrant: "Connect hydrant",
  relay_hose: "Relay hose",
  hose_attack: "Hose attack",
  ba_sar: "BA search and rescue",
  commander: "Command",
  kit_grab: "Get kit",
  mitigate_hazard: "Make the hazard safe",
  deploy_stabilisers: "Deploy stabilisers",
  extend_platform: "Extend the platform",
  aerial_rescue: "Aerial rescue",
  aerial_monitor: "Aerial monitor",
  rtc_extrication: "Vehicle extrication",
  rope_rescue: "Rope rescue",
  water_rescue: "Water rescue",
  wildfire_beating: "Beat the fire front",
  wildfire_knapsack: "Knapsack suppression",
  firebreak: "Cut a firebreak",
  cordon: "Cordon",
  traffic_mgmt: "Traffic management",
  close_carriageway: "Close a carriageway",
  close_road: "Close the road",
  scene_preservation: "Preserve the scene",
  vehicle_stop: "Stop the vehicle",
  request_details: "Request details",
  take_account: "Take account",
  stop_search: "Stop and search",
  arrest: "Arrest",
  welfare_check: "Welfare check",
  vehicle_search: "Search vehicle",
  convey_custody: "Convey to custody",
  area_search: "Area search",
  ventilate: "Ventilate",
  bridgehead: "BA bridgehead",
  firefighting_lift: "Firefighting lift",
  evacuate_floors: "Evacuate floors",
  hazmat_identify: "Hazmat identification",
  decontaminate: "Decontamination",
  follow_contain: "Follow and contain",
  tpac_box: "TPAC enforced stop",
  stinger: "Stinger",
  tactical_contact: "Tactical contact",
  triage_sieve: "Triage sieve",
  extract_casualty: "Extract casualty",
  crs_action: "Crash recovery action",
};

/** [methods, equipment sources, equipment required] */
type TaskConfig = [string[], string[], boolean];

const TASK_CONFIG: Record<TaskKind, TaskConfig> = {
  survey: [["Initial assessment", "Reassessment", "Access survey"], ["Thermal imaging camera", "Comms", "Mapping"], false],
  gain_entry: [["Establish access", "Assist access"], ["Hali tool", "Lock snapper", "Red key / standpipe", "Hydraulic cutters", "Hydraulic spreaders"], true],
  connect_hydrant: [["Establish supply", "Change supply point"], ["Red key / standpipe", "Hose"], true],
  relay_hose: [["Supply relay", "Extend existing relay"], ["Hose"], true],
  hose_attack: [["Exterior attack", "Interior attack", "Covering jet", "UHPL lance"], ["Hose", "BA sets"], true],
  ba_sar: [["Search assignment", "Rescue assignment"], ["BA sets", "Thermal imaging camera"], true],
  commander: [["Initial command", "Command support", "Command handover"], ["Incident command kit", "Command support", "Mapping", "Comms", "Major incident comms"], false],
  kit_grab: [["Deliver to crew", "Stage at incident"], [], true],
  mitigate_hazard: [["Hazard assessment", "Assigned mitigation", "Monitor hazard"], ["Hali tool", "Thermal imaging camera", "Hydraulic cutters", "Hydraulic spreaders", "Gas detection", "Foam concentrate"], false],
  deploy_stabilisers: [["Appliance setup"], ["32m turntable ladder", "Hydraulic platform"], false],
  extend_platform: [["Platform positioning"], ["32m turntable ladder", "Hydraulic platform"], true],
  aerial_rescue: [["Rescue assignment"], ["32m turntable ladder", "Hydraulic platform", "Cage rescue", "Rescue cage"], true],
  aerial_monitor: [["Monitor deployment"], ["Boom monitor", "32m turntable ladder", "Hydraulic platform"], true],
  rtc_extrication: [["Stabilise and cut", "Assist extrication"], ["Hydraulic cutters", "Hydraulic spreaders", "Stabiliser chocks", "Glass management"], true],
  rope_rescue: [["Specialist rescue assignment"], ["Rope rescue", "Rope / water / confined-space kit"], false],
  water_rescue: [["Bank-side rescue", "In-water rescue"], ["Boat", "Powered craft", "Throwlines", "Dry suits", "Water rescue"], true],
  wildfire_beating: [["Flank attack", "Head attack"], ["Wildfire beaters"], true],
  wildfire_knapsack: [["Flank suppression", "Spot fires"], ["Knapsack sprayers"], true],
  firebreak: [["Cut ahead of the head"], ["Wildfire beaters", "Leaf blowers"], false],
  cordon: [["Establish cordon", "Maintain cordon", "Handover cordon"], ["Tactical aids", "Comms", "Scene lighting"], false],
  traffic_mgmt: [["Establish control point", "Maintain control point", "Handover control point"], ["Tactical aids", "Comms", "Cones + signage"], false],
  close_carriageway: [["Establish closure", "Maintain closure", "Handover closure"], ["Cones + signage", "Road closure kit", "Scene lighting"], false],
  close_road: [["Establish closure", "Maintain closure", "Handover closure"], ["Cones + signage", "Road closure kit", "Scene lighting"], false],
  scene_preservation: [["Establish scene boundary", "Control scene access", "Scene handover"], ["Tactical aids", "Comms", "Investigation kit"], false],
  vehicle_stop: [["Routine stop", "Stop and search", "Stop on a marker"], ["Comms", "Tactical aids"], false],
  request_details: [["Name and address", "Identity check"], ["Comms", "Pocket notebook"], false],
  take_account: [["First account", "Witness account", "Victim account"], ["Pocket notebook", "Body-worn video"], false],
  stop_search: [["Section 1 PACE", "Section 23 MDA", "Section 60"], ["Body-worn video", "Search record"], false],
  arrest: [["Arrest and caution", "Arrest on warrant"], ["Handcuffs", "Body-worn video"], false],
  welfare_check: [["Welfare check", "Safeguarding check"], ["Comms", "Body-worn video"], false],
  vehicle_search: [["Section 1 PACE", "Section 23 MDA", "Section 163 RTA"], ["Body-worn video", "Search record"], false],
  convey_custody: [["Van — cage", "Car — rear seat, two up"], ["Prisoner cage", "Handcuffs", "Body-worn video"], false],
  area_search: [["Drive the ground", "Hold a junction", "Sit on a camera site"], ["Comms", "ANPR-linked"], false],
  ventilate: [["Positive pressure ventilation", "Natural ventilation — open up", "Tactical ventilation at the top"], ["PPV fan", "Ceiling hook", "Ladder"], true],
  bridgehead: [["Establish bridgehead", "Move bridgehead"], ["BA board", "Dry riser kit", "Comms"], true],
  firefighting_lift: [["Take lift under control", "Release lift"], ["Lift key"], true],
  evacuate_floors: [["Evacuate fire floor and above", "Full evacuation", "Stay put — reassure"], ["Comms", "Loudhailer"], false],
  hazmat_identify: [["Detection and identification", "Size the cordon", "Chemdata check"], ["DIM kit", "Gas-tight suits"], true],
  decontaminate: [["Emergency decontamination", "Mass decontamination", "Crew decontamination"], ["Decon tent", "Water supply"], true],
  follow_contain: [["Follow at distance", "Keep observations", "Contain to the area"], ["Comms", "ANPR-linked"], false],
  tpac_box: [["Rolling box", "Static box at a hold point"], ["Comms"], false],
  stinger: [["Deploy ahead", "Deploy at a junction"], ["Stinger"], true],
  tactical_contact: [["Contact to stop", "Pin and detain"], ["Comms"], false],
  triage_sieve: [["Casualty assessment", "Reassessment", "Report casualty overview"], ["Paramedic kit", "Triage kit", "Solo paramedic response"], true],
  extract_casualty: [["Casualty movement", "Assist receiving crew"], ["Spine board", "Trolley bed", "Stretcher", "Carry chair", "Rescue cage"], true],
  crs_action: [["Make safe"], [], false],
};

/** [objective, equipment note, milestones] */
const TASK_DETAIL: Record<TaskKind, [string, string, string]> = {
  survey: ["Build an initial picture of the incident and report findings to control.", "Assessment and communications", "Identify the assigned area|Record observed hazards and access|Send findings to control"],
  gain_entry: ["Record an access task for the nominated entry point.", "Entry equipment listed on the vehicle", "Confirm entry point and task brief|Record access progress|Report access established or obstruction"],
  connect_hydrant: ["Assign a crew member to establish the selected water supply in the scenario.", "Hydrant and supply equipment", "Identify the selected water source|Record connection progress|Report supply status"],
  relay_hose: ["Coordinate a hose relay between the nominated source and appliance.", "Hose and couplings", "Identify start and end points|Record relay deployment|Report relay status"],
  hose_attack: ["Assign a firefighting team to a specified sector and objective.", "Firefighting equipment listed on the appliance", "Confirm sector and objective|Record team deployment|Report progress against the objective"],
  ba_sar: ["Track a nominated search team, search area and reported outcome.", "BA and search equipment", "Record team and search area|Record search progress|Report search outcome and team status"],
  commander: ["Coordinate the incident objectives, resource requests and handover.", "Communications equipment", "Record current objectives|Review resource requirements|Record command update or handover"],
  kit_grab: ["Bring the equipment requested by a crew to a named location.", "Select from the vehicle equipment record", "Record requested equipment|Record collection|Confirm delivery to the crew"],
  mitigate_hazard: ["Track the response to a named hazard and record its reported status.", "Equipment appropriate to the assigned hazard", "Identify the hazard and task owner|Record mitigation progress|Report remaining restrictions"],
  deploy_stabilisers: ["Track the aerial appliance setup task at the nominated position.", "Aerial appliance equipment", "Confirm assigned setup position|Record setup progress|Report setup status"],
  extend_platform: ["Track the platform positioning task against the assigned objective.", "Aerial platform", "Record nominated working position|Record positioning progress|Report platform status"],
  aerial_rescue: ["Coordinate the simulated aerial rescue assignment and receiving team.", "Aerial rescue equipment", "Record rescue location and receiving team|Record rescue progress|Report handover outcome"],
  aerial_monitor: ["Track the aerial monitor assignment and reported effectiveness.", "Aerial monitor and supply equipment", "Record assigned sector|Record deployment progress|Report effectiveness and supply status"],
  rtc_extrication: ["Stabilise the vehicle, create space and release the trapped casualty.", "Hydraulic rescue equipment listed on the appliance", "Record stabilisation|Record cutting progress|Confirm casualty released to the receiving crew"],
  rope_rescue: ["Track a specialist rescue assignment and its handover.", "Specialist rescue equipment", "Record rescue location and team|Record rescue progress|Report casualty handover"],
  water_rescue: ["Recover a casualty from the water and hand over to the receiving crew.", "Water rescue equipment listed on the vehicle", "Record entry point and team|Record rescue progress|Confirm casualty handover"],
  wildfire_beating: ["Work the fire front with beaters on the assigned flank.", "Wildfire beaters", "Record assigned flank|Record progress along the front|Report fire behaviour"],
  wildfire_knapsack: ["Suppress the flank and spot fires with knapsack sprayers.", "Knapsack sprayers", "Record assigned sector|Record water use|Report suppression status"],
  firebreak: ["Cut a break ahead of the fire head to check its run.", "Beaters and blowers", "Record the break line|Record progress|Report the break holding or breached"],
  cordon: ["Assign a team to a named boundary and maintain its status.", "Cordon equipment", "Record boundary and access points|Record cordon establishment|Report access restrictions and handover"],
  traffic_mgmt: ["Coordinate a team at nominated traffic control points.", "Traffic equipment listed on the vehicle", "Record assigned control points|Record traffic management in place|Report traffic conditions and handover"],
  close_carriageway: ["Cone off one carriageway and keep traffic moving on the other.", "Road closure equipment", "Record closure limits|Record closure status|Report restrictions and handover"],
  close_road: ["Track a road closure assignment, limits and reported status.", "Road closure equipment", "Record closure limits and assignment|Record closure status|Report restrictions and handover"],
  scene_preservation: ["Track scene boundaries, access and handover to the nominated team.", "Scene recording and barrier equipment", "Record assigned scene boundary|Record access observations|Record scene handover"],
  vehicle_stop: ["Stop the vehicle, speak to the occupants and run the checks.", "Comms and tactical aids", "Signal the stop|Speak to the driver|Run PNC and driver checks"],
  request_details: ["Take the person's name, date of birth and address, and confirm them.", "Pocket notebook", "Ask for details|Check any identification|Record in the notebook"],
  take_account: ["Take a first account in the person's own words.", "Notebook and body-worn video", "Explain why|Take the account|Read it back and sign"],
  stop_search: ["Search the person with grounds, GOWISELY, and give the record.", "Body-worn video and search record", "Give GOWISELY|Conduct the search|Issue the record"],
  arrest: ["Arrest, caution and detain the person, then arrange transport to custody.", "Handcuffs and body-worn video", "Arrest and caution|Search on arrest|Request custody transport"],
  welfare_check: ["Check the person's welfare and any safeguarding concerns.", "Comms", "Speak to the person|Assess risk|Record and refer"],
  vehicle_search: ["Search the vehicle with grounds and a power, and record what is found.", "Body-worn video and search record", "Give the grounds|Search the vehicle|Record the findings"],
  convey_custody: ["Convey the detained person to the custody suite and book them in.", "Prisoner cage and handcuffs", "Search and secure|Convey|Book in at custody"],
  area_search: ["Drive the ground where the subject vehicle was last read, eyes open, until it is sighted.", "Comms, ANPR", "Get to the last read|Cover the likely route|Call the sighting"],
  ventilate: ["Clear the smoke — only once water is on the fire; ventilating an unattacked fire feeds it.", "PPV fan and door management", "Confirm a jet is working|Set the fan and the opening|Confirm the smoke lifting"],
  bridgehead: ["Set the BA bridgehead two floors below the fire, off the dry riser, with the board.", "BA board, dry riser kit", "Charge the riser|Board up on the landing|Teams away from the bridgehead"],
  firefighting_lift: ["Take the firefighting lift under control before anyone rides it.", "Lift key", "Key the lift|Check it answers|Crew and kit up"],
  evacuate_floors: ["The block's residents: stay put, evacuate the fire floor and above, or the lot.", "Comms and a loudhailer", "Decide the strategy|Knock the doors|Account for the flats"],
  hazmat_identify: ["Detection, identification and monitoring: name the substance and size the cordon.", "DIM kit and gas-tight suits", "Detect|Identify|Set the cordon"],
  decontaminate: ["Decontaminate the contaminated — casualties first, then crews — before anyone leaves the inner cordon.", "Decon tent and water", "Tent up|Casualties through|Crews through"],
  follow_contain: ["Follow without lights, keep observations and wait for the tactical option — no pursuit without one.", "Comms, ANPR", "Get behind the vehicle|Call direction and speed|Hold until the second car is in"],
  tpac_box: ["A TPAC enforced stop — two cars box the vehicle to a halt. Needs the training and a second roads car.", "Comms", "Position the second car|Box and slow|Detain the occupants"],
  stinger: ["Deploy the stinger ahead of the vehicle's line. Needs the training and the kit.", "Stinger", "Choose the deployment point|Deploy on approach|Recover the stinger"],
  tactical_contact: ["End a pursuit by contact — TPAC trained crews only, authorised by control.", "Comms", "Confirm authorisation|Make contact|Detain the occupants"],
  triage_sieve: ["Record a casualty assessment assignment and its summary for control.", "Assessment equipment listed on the vehicle", "Record casualty group and location|Record assessment progress|Report assessment summary and resource requests"],
  extract_casualty: ["Coordinate a casualty movement task and the receiving crew.", "Casualty movement equipment", "Record casualty location and destination|Record movement progress|Confirm handover to receiving crew"],
  crs_action: ["Make the vehicle safe before cutting, following the crash recovery sheet.", "Crash recovery equipment", "Identify the component|Record the action|Confirm made safe"],
};

const COMPETENCY_LABELS: Record<Competency, string> = {
  ba: "BA wearer",
  water: "Water supply",
  aerial: "Aerial operator",
  command: "Incident command",
  traffic: "Traffic management",
  assessment: "Casualty assessment",
  movement: "Casualty movement",
  tpac: "TPAC trained",
};

const TASK_COMPETENCIES: Partial<Record<TaskKind, { all?: Competency[]; any?: Competency[] }>> = {
  connect_hydrant: { all: ["water"] },
  relay_hose: { all: ["water"] },
  ba_sar: { all: ["ba"] },
  deploy_stabilisers: { any: ["aerial"] },
  extend_platform: { any: ["aerial"] },
  aerial_rescue: { any: ["aerial"] },
  aerial_monitor: { any: ["aerial"] },
  commander: { any: ["command"] },
  traffic_mgmt: { all: ["traffic"] },
  close_road: { all: ["traffic"] },
  close_carriageway: { all: ["traffic"] },
  triage_sieve: { all: ["assessment"] },
  extract_casualty: { all: ["movement"] },
  tpac_box: { all: ["tpac"] },
  stinger: { all: ["tpac"] },
  tactical_contact: { all: ["tpac"] },
};

/** Scenario stock per loadout line. Everything else carries one. */
const STOCK_COUNTS: Record<string, number> = {
  "BA set": 4,
  "45 mm delivery hose": 6,
  "70 mm delivery hose": 4,
};

const LOCATIONS = ["Incident address", "Front", "Rear", "Left side", "Right side", "Appliance position"];
const UPDATES = ["Assistance required", "Access blocked", "Task delayed", "Task progressing", "Ready for reassignment"];
const RETURN_OUTCOMES = ["Returned — serviceable", "Damaged", "Missing", "Awaiting checks"];
const WATER_KINDS: TaskKind[] = ["connect_hydrant", "relay_hose", "hose_attack"];
const TERMINAL: OrderStatus[] = ["Completed", "Cancelled"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function hhmmss(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false });
}

function isAerial(a: Appliance): boolean {
  return /^(TL|HLP)$/.test(a.type) || a.kit.some((k) => /turntable ladder|Hydraulic platform/i.test(k));
}

function carries(a: Appliance, source: string): boolean {
  const s = source.toLowerCase();
  return a.kit.some((k) => k.toLowerCase() === s || k.toLowerCase().includes(s));
}

/** The task kinds this unit can be given, in the prototype's order. */
export function catalogueKinds(a: Appliance, incident: Incident): TaskKind[] {
  let kinds: TaskKind[];
  if (a.service === "Fire") {
    if (isAerial(a)) {
      kinds = ["survey", "commander", "deploy_stabilisers", "extend_platform", "aerial_rescue", "aerial_monitor"];
    } else if (a.waterLitres > 0) {
      kinds = ["survey", "gain_entry", "connect_hydrant", "relay_hose", "hose_attack", "ba_sar", "kit_grab", "mitigate_hazard", "extract_casualty", "commander"];
    } else {
      kinds = ["survey", "commander"];
      if (carries(a, "BA sets")) kinds.push("ba_sar", "kit_grab");
    }
    if (carries(a, "Rope rescue")) kinds.push("rope_rescue");
    if (carries(a, "Water rescue") || carries(a, "Boat")) kinds.push("water_rescue");
    if (carries(a, "Wildfire beaters")) kinds.push("wildfire_beating", "firebreak");
    if (carries(a, "Knapsack sprayers")) kinds.push("wildfire_knapsack");
    if (carries(a, "Hydraulic cutters") && (incident.scenario.crs?.length ?? 0) > 0) kinds.push("rtc_extrication");
    if (a.waterLitres > 0 && incident.scenario.scene?.fireSeat) kinds.push("ventilate");
    if (incident.scenario.scene?.highRise) kinds.push("bridgehead", "evacuate_floors");
    if (incident.scenario.scene?.highRise?.firefightingLift) kinds.push("firefighting_lift");
    if (incident.scenario.scene?.hazards.some((h) => h.kind === "chemical")) kinds.push("hazmat_identify", "decontaminate");
  } else if (a.service === "Police") {
    const vehicleJob = /anpr|pursuit|fail_to_stop|drink_driver|vehicle|rtc/i.test(incident.scenario.type);
    kinds = ["cordon", "traffic_mgmt", "scene_preservation", "survey", "commander"];
    if (a.type === "Police_RPU" || carries(a, "Road closure kit")) kinds.splice(2, 0, "close_carriageway", "close_road");
    // Vehicle work: any car can stop a compliant driver or follow; the
    // pre-emptive tactics belong to the TPAC-trained roads crews.
    const tpac = a.crewMembers.some((m) => /TPAC|Tactical Pursuit/i.test(m.quals.join(" ")));
    if (vehicleJob || a.type === "Police_RPU" || a.type === "Police_TraffMot") kinds.unshift("vehicle_stop", "follow_contain");
    if (tpac) kinds.splice(2, 0, "tpac_box", "stinger", "tactical_contact");
  } else {
    kinds = ["triage_sieve", "kit_grab", "survey", "commander"];
  }
  return [...new Set(kinds)].filter((k) => TASK_SERVICES[k].includes(a.service));
}

/** Scenario competency record for a crew member, read off their recorded
 *  qualifications. A deliberate roster, not real-world inference. */
export function competencyFor(a: Appliance, m: CrewMember): Partial<Record<Competency, string>> {
  const q = m.quals.join(" · ");
  const c: Partial<Record<Competency, string>> = { movement: "Current" };
  const commandLike = /Incident Command|Command Support|Commander|Gold|Silver|SIO/i.test(q) || /Manager|Officer|Sergeant|Inspector|Commander/i.test(m.role);
  if (a.service === "Fire") {
    c.water = "Current";
    c.ba = /\bBA\b|Breathing Apparatus/i.test(q) ? "Current" : "Not recorded";
    if (commandLike) c.command = "Current";
    if (/Aerial/i.test(q) || (isAerial(a) && /Driver|Operator/i.test(m.role))) c.aerial = "Current";
  }
  if (a.service === "Police") {
    c.traffic = /Advanced Driver|Emergency Driving|Roads Policing|Speed Detection|Motorcycle|Traffic/i.test(q) ? "Current" : "Not recorded";
    c.tpac = /TPAC|Tactical Pursuit/i.test(q) ? "Current" : "Not recorded";
    if (commandLike) c.command = "Current";
  }
  if (a.service === "Ambulance") {
    c.assessment = /Paramedic|Technician|EMT|MBBS|Clinical|Nurse|First Aid|Life Support/i.test(q) ? "Current" : "Not recorded";
    if (commandLike) c.command = "Current";
  }
  return c;
}

type StockItem = { id: string; status: string; owner: string; task: string };
type StockLine = {
  id: string;
  label: string;
  source: string;
  total: number;
  items: StockItem[];
  free: StockItem[];
  deployed: number;
  reserved: number;
  issued: number;
  awaiting: number;
};

/** Item-level stock for this appliance: every loadout line expanded to
 *  asset ids, marked by the orders holding them and by simulator tasks
 *  started from elsewhere on the desk. */
export function inventoryFor(a: Appliance, orders: MdtOrder[], tasks: Task[]): StockLine[] {
  const holding = orders.filter(
    (o) => o.unit === a.id && (!TERMINAL.includes(o.status) || o.equipmentState === "Awaiting return"),
  );
  const linked = new Set(holding.map((o) => o.simTaskId).filter(Boolean));
  // Tasks started from other panels commit their implied kit.
  const deployedBySim: Record<string, number> = {};
  for (const t of tasks) {
    if (t.applianceId !== a.id || t.state !== "active" || linked.has(t.id)) continue;
    const add = (label: string, n = 1) => {
      deployedBySim[label] = (deployedBySim[label] ?? 0) + n;
    };
    if (t.kind === "ba_sar") add("BA set", t.assignedCrewIds.length);
    if (t.kind === "hose_attack") add(t.hoseType === "70mm" ? "70 mm delivery hose" : "45 mm delivery hose");
    if (t.kind === "relay_hose") add("70 mm delivery hose");
    if (t.kind === "connect_hydrant") {
      add("70 mm delivery hose");
      add("Red key / standpipe");
    }
  }
  return a.kit.flatMap((source, group) => {
    const labels = /^Hose$/i.test(source)
      ? ["45 mm delivery hose", "70 mm delivery hose"]
      : [/^BA sets/i.test(source) ? "BA set" : source];
    return labels.map((label, part) => {
      const total = STOCK_COUNTS[label] ?? 1;
      const deployed = Math.min(total, deployedBySim[label] ?? 0);
      const code = label === "BA set" ? "BA" : label === "45 mm delivery hose" ? "H45" : label === "70 mm delivery hose" ? "H70" : `EQ${group + 1}-${part}`;
      const items: StockItem[] = Array.from({ length: total }, (_, i) => {
        const id = `${a.callsign}-${code}-${String(i + 1).padStart(2, "0")}`;
        const order = holding.find(
          (o) => o.equipmentItemIds.includes(id) && o.equipmentAllocations.find((x) => x.id === id)?.returnStatus !== "Returned",
        );
        const alloc = order?.equipmentAllocations.find((x) => x.id === id);
        return {
          id,
          status: i < deployed ? "Deployed" : order ? alloc?.returnStatus || order.equipmentState || "Reserved" : "Available",
          owner: alloc?.owner ?? "",
          task: order ? TASK_LABEL[order.kind] : "",
        };
      });
      return {
        id: `${source}:${label}`,
        label,
        source,
        total,
        items,
        free: items.filter((i) => i.status === "Available"),
        deployed: items.filter((i) => i.status === "Deployed").length,
        reserved: items.filter((i) => i.status === "Reserved").length,
        issued: items.filter((i) => i.status === "Issued").length,
        awaiting: items.filter((i) => ["Awaiting return", "Awaiting checks", "Damaged", "Missing"].includes(i.status)).length,
      };
    });
  });
}

function attackModeFor(method: string): HoseAttackMode {
  switch (method) {
    case "Interior attack":
      return "interior_attack";
    case "Covering jet":
      return "exterior_cooling";
    case "UHPL lance":
      return "uhpl_lance";
    default:
      return "exterior_attack";
  }
}

const ATTACK_METHOD: Record<HoseAttackMode, string> = {
  exterior_attack: "Exterior attack",
  interior_attack: "Interior attack",
  exterior_cooling: "Covering jet",
  uhpl_lance: "UHPL lance",
};

function entryToolFor(labels: string[]): EntryTool {
  const s = labels.join(" ").toLowerCase();
  if (s.includes("lock snapper")) return "lock_snapper";
  if (s.includes("red key")) return "red_key";
  if (s.includes("cutters") || s.includes("saw")) return "recip_saw";
  return "halligan";
}

function kitKindFor(labels: string[]): KitKind {
  const s = labels.join(" ");
  if (/AED|Defib/i.test(s)) return "aed";
  if (/Trauma|Critical care/i.test(s)) return "trauma";
  if (/Extinguisher/i.test(s)) return "extinguisher";
  return "first_aid";
}

/** Hydrants known to this scene — the authored list, or the OSM lookup the
 *  Water panel already uses, labelled H1… in the same order. */
function useSceneHydrants(incident: Incident, enabled: boolean): { label: string; street?: string }[] {
  const authored = (incident.scenario.scene?.hydrants ?? []).filter((h) => !!h.coords);
  const [osm, setOsm] = useState<{ label: string }[] | null>(null);
  useEffect(() => {
    if (!enabled || authored.length > 0) return;
    let cancelled = false;
    import("@/lib/sim/osm_hydrants").then(({ fetchOsmHydrants }) =>
      fetchOsmHydrants(incident.scenario.location.coords).then((list) => {
        if (cancelled || list.length === 0) return;
        setOsm(list.slice(0, 8).map((_, i) => ({ label: `H${i + 1}` })));
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [enabled, authored.length, incident.scenario.location.coords]);
  if (authored.length > 0) return authored.map((h) => ({ label: h.label, street: h.street }));
  return osm ?? (incident.scenario.scene?.hydrants ?? []).map((h) => ({ label: h.label }));
}

/** An order view of a simulator task started from somewhere other than the
 *  MDT (the CRS sheet, the BA board, the ground map) so the crew can still
 *  update, hand over and close it here. */
function orderFromTask(t: Task, a: Appliance, incident: Incident): MdtOrder {
  const sim: SimTarget = {
    hydrantId: t.hydrantId,
    sourceApplianceId: t.sourceApplianceId,
    hazardId: t.hazardId,
    mitigationMethod: t.mitigationMethod,
    casualtyId: t.casualtyId,
    kitKind: t.kitKind,
    entryTool: t.entryTool,
    attackMode: t.attackMode,
    hoseType: t.hoseType,
    baMode: t.baMode,
  };
  const method =
    t.crsLabel ??
    (t.attackMode ? ATTACK_METHOD[t.attackMode] : t.entryTool ? ENTRY_TOOL_LABEL[t.entryTool] : t.mitigationMethod ?? (t.baMode === "firefighting" ? "Rescue assignment" : TASK_CONFIG[t.kind][0][0] ?? ""));
  const target = t.hydrantId
    ? `Hydrant ${t.hydrantId}`
    : t.sourceApplianceId
      ? `Relay from ${t.sourceApplianceId}`
      : t.hazardId
        ? `Hazard ${t.hazardId}`
        : t.casualtyId
          ? `Casualty ${t.casualtyId}`
          : t.entryPoint ?? `Incident address · ${incident.scenario.location.address}`;
  return {
    id: `sim:${t.id}`,
    unit: a.id,
    kind: t.kind,
    crewIds: t.assignedCrewIds,
    method,
    location: "Incident address",
    target,
    brief: method,
    equipmentSources: [],
    equipmentItemIds: [],
    equipmentLabels: t.hoseType ? [`${t.hoseType} hose`] : [],
    equipmentAllocations: [],
    equipmentState: "Released",
    requiredAll: TASK_COMPETENCIES[t.kind]?.all ?? [],
    requiredAny: TASK_COMPETENCIES[t.kind]?.any ?? [],
    status: t.state === "active" ? "In progress" : t.state === "completed" ? "Completed" : "Cancelled",
    sentAt: t.startedAt,
    issuedAt: t.startedAt,
    startedAt: t.startedAt,
    finishedAt: t.state === "active" ? undefined : t.completesAt ?? t.startedAt,
    events: [{ at: t.startedAt, text: "Task started from the desk" }],
    report: t.state === "completed" ? "Task completed" : t.state === "aborted" ? "Crew reported unable to complete" : "",
    simTaskId: t.id,
    sim,
  };
}

/** Fold the simulator's verdict into an order: a task that has completed or
 *  failed closes the paperwork whatever the crew last tapped. */
function withSim(o: MdtOrder, tasks: Task[]): MdtOrder {
  if (TERMINAL.includes(o.status)) return o;
  const t = o.simTaskId
    ? tasks.find((x) => x.id === o.simTaskId)
    : o.status === "In progress"
      ? tasks.find((x) => x.applianceId === o.unit && x.kind === o.kind && x.startedAt >= (o.issuedAt ?? o.startedAt) - 1500)
      : undefined;
  if (!t) return o;
  const linked = o.simTaskId ? o : { ...o, simTaskId: t.id };
  if (t.state === "active") return linked;
  const at = t.completesAt ?? Date.now();
  const completed = t.state === "completed";
  return {
    ...linked,
    status: completed ? "Completed" : "Cancelled",
    report: completed ? "Task completed" : "Crew reported unable to complete",
    finishedAt: at,
    equipmentState: linked.equipmentState === "Issued" ? "Awaiting return" : "Released",
    events: [...linked.events, { at, text: completed ? "Task completed" : "Task cancelled" }],
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Form = {
  kind: TaskKind;
  method: string;
  location: string;
  equipmentIds: string[];
  quantities: Record<string, number>;
  owners: Record<string, string>;
  chosen: string[];
  target: string;
  mitigation: string;
};

export type TaskWorkspaceProps = {
  page: "actions" | "water";
  incident: Incident;
  incidentRef: string;
  appliance: Appliance;
  phase: string;
  onScene: Appliance[];
  tasks: Task[];
  now: number;
  busyCrewIds?: Set<string>;
  hazards: { id: string; label: string; kind: string }[];
  casualties: { id: string; label?: string }[];
  resolved: boolean;
  onStartTask?: StartTaskFn;
  onAbortTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onSetTaskCrew?: (taskId: string, crewIds: string[]) => void;
  onBeginRoadClosure?: (kind: "close_carriageway" | "close_road", crewIds: string[]) => void;
  /** A line for the shift log, already worded for control. */
  onNote?: (text: string) => void;
  /** The simulator stops any jet whose pump is not running with an
   *  operator; the order form offers the one-tap fix. */
  pumpReady?: boolean;
  pumpOperatorName?: string;
  onStartPump?: () => void;
};

export function MdtTaskWorkspace({
  page,
  incident,
  incidentRef,
  appliance,
  phase,
  onScene,
  tasks,
  now,
  busyCrewIds,
  hazards,
  casualties,
  resolved,
  onStartTask,
  onAbortTask,
  onCompleteTask,
  onSetTaskCrew,
  onBeginRoadClosure,
  onNote,
  pumpReady = true,
  pumpOperatorName,
  onStartPump,
}: TaskWorkspaceProps) {
  const storedOrders = useMdtOrders(incident.id);
  const [form, setForm] = useState<Form | null>(null);
  const [handovers, setHandovers] = useState<Record<string, string>>({});
  const [returnChoices, setReturnChoices] = useState<Record<string, string>>({});
  const hydrants = useSceneHydrants(incident, appliance.service === "Fire" && appliance.waterLitres > 0);

  const crew = appliance.crewMembers;
  const nameOf = (id: string) => crew.find((c) => c.id === id)?.name ?? id;
  const memberOf = (id: string) => crew.find((c) => c.id === id);
  const compOf = (id: string) => {
    const m = memberOf(id);
    return m ? competencyFor(appliance, m) : {};
  };

  // Orders for this unit, with the simulator's verdicts folded in, plus
  // views of sim tasks this unit is running that no order raised.
  const own = storedOrders.filter((o) => o.unit === appliance.id).map((o) => withSim(o, tasks));
  const linkedIds = new Set(own.map((o) => o.simTaskId).filter(Boolean));
  const fromSim = tasks
    .filter((t) => t.applianceId === appliance.id && !linkedIds.has(t.id))
    .map((t) => orderFromTask(t, appliance, incident));
  const all = [...own, ...fromSim];
  const active = all.filter((o) => !TERMINAL.includes(o.status));
  const history = all.filter((o) => TERMINAL.includes(o.status)).slice().reverse();

  const busy = (crewId: string) =>
    active.some((o) => o.crewIds.includes(crewId)) || !!busyCrewIds?.has(crewId);
  const free = crew.filter((c) => !busy(c.id)).length;
  const allowed = !resolved && phase === "at_incident" && crew.length > 0;
  const kinds = catalogueKinds(appliance, incident);
  const catalogue = page === "water" ? WATER_KINDS.filter((k) => kinds.includes(k)) : kinds.filter((k) => !WATER_KINDS.includes(k));

  /** Mutate an order, adopting a sim-only view into the store first. */
  function mutate(id: string, fn: (o: MdtOrder) => MdtOrder) {
    updateOrders(incident.id, (prev) => {
      const current = prev.find((o) => o.id === id);
      if (current) return prev.map((o) => (o.id === id ? fn(withSim(o, tasks)) : o));
      const view = all.find((o) => o.id === id);
      return view ? [...prev, fn(view)] : prev;
    });
  }
  function event(o: MdtOrder, text: string, patch: Partial<MdtOrder> = {}): MdtOrder {
    return { ...o, ...patch, events: [...o.events, { at: now, text }] };
  }
  const label = (k: TaskKind) => TASK_LABEL[k] ?? k;

  // ---- Order lifecycle ---------------------------------------------------

  function accept(id: string) {
    mutate(id, (o) => (o.status === "Sent" ? event(o, "Task accepted by crew", { status: "Assigned", acceptedAt: now }) : o));
  }

  function rosterValid(o: MdtOrder): boolean {
    return (
      o.crewIds.every((c) => o.requiredAll.every((q) => compOf(c)[q] === "Current")) &&
      o.requiredAny.every((q) => o.crewIds.some((c) => compOf(c)[q] === "Current")) &&
      o.equipmentAllocations.filter((x) => x.ba).every((x) => compOf(x.owner).ba === "Current")
    );
  }

  function issue(id: string) {
    const o = all.find((x) => x.id === id);
    if (!o || o.status !== "Assigned") return;
    if (!rosterValid(o)) {
      mutate(id, (x) => ({ ...x, report: "Issue blocked: scenario competency has changed. Cancel and reconfigure." }));
      return;
    }
    const at = now;
    let simTaskId: string | undefined;
    if (o.kind === "close_road" || o.kind === "close_carriageway") {
      onBeginRoadClosure?.(o.kind, o.crewIds);
    } else if (onStartTask) {
      const r = onStartTask({
        applianceId: appliance.id,
        kind: o.kind,
        assignedCrewIds: o.crewIds,
        ...o.sim,
        hretTurret: o.sim.attackMode === "uhpl_lance" && appliance.capabilities?.includes("HRET"),
      });
      // The simulator returns no id when a commitment is refused (for
      // example by defensive mode). Do not mark the order started or issue
      // its equipment in that case; the crew must still be able to retry
      // after the incident state changes.
      if (typeof r === "string") simTaskId = r;
      else {
        mutate(id, (x) => event(x, "Start refused by simulator", { report: "Start refused — review tactical mode, arrival and crew assignment." }));
        return;
      }
    }
    mutate(id, (x) =>
      event(x, "Task started · equipment issue confirmed", {
        status: "In progress",
        equipmentState: x.equipmentItemIds.length ? "Issued" : "Released",
        issuedAt: at,
        startedAt: at,
        simTaskId,
        report: o.kind === "close_road" || o.kind === "close_carriageway" ? "Place the closure on the ground map to start the task." : "",
      }),
    );
    onNote?.(`${appliance.callsign} · Equipment issue confirmed · ${label(o.kind)}`);
  }

  function finish(id: string, status: "Completed" | "Cancelled") {
    const o = all.find((x) => x.id === id);
    if (!o || TERMINAL.includes(o.status) || (status === "Completed" && o.status !== "In progress")) return;
    const sim = o.simTaskId ? tasks.find((t) => t.id === o.simTaskId) : undefined;
    if (sim && sim.state === "active") {
      if (status === "Completed") onCompleteTask?.(sim.id);
      else onAbortTask?.(sim.id);
    }
    const report = status === "Completed" ? "Crew reported task complete" : "Crew reported unable to complete";
    mutate(id, (x) =>
      event(x, `Task ${status.toLowerCase()}`, {
        status,
        report,
        finishedAt: now,
        equipmentState: x.equipmentState === "Issued" ? "Awaiting return" : "Released",
      }),
    );
    onNote?.(`${appliance.callsign} · ${label(o.kind)} · ${report}`);
  }

  function pause(id: string) {
    mutate(id, (o) =>
      o.status === "Paused" ? event(o, "Task resumed", { status: "In progress" }) : o.status === "In progress" ? event(o, "Task paused", { status: "Paused" }) : o,
    );
  }

  function sendUpdate(o: MdtOrder, text: string) {
    if (TERMINAL.includes(o.status)) return;
    mutate(o.id, (x) => event(x, `Crew update · ${text}`));
    onNote?.(`${appliance.callsign} → CONTROL: ${label(o.kind)} · ${text}`);
  }

  function handoverEligible(o: MdtOrder, oldId: string, newId: string): boolean {
    if (!newId || TERMINAL.includes(o.status) || !o.crewIds.includes(oldId) || o.crewIds.includes(newId) || !memberOf(newId)) return false;
    if (busy(newId)) return false;
    const q = compOf(newId);
    const next = o.crewIds.map((c) => (c === oldId ? newId : c));
    return (
      o.requiredAll.every((k) => q[k] === "Current") &&
      o.requiredAny.every((k) => next.some((c) => compOf(c)[k] === "Current")) &&
      (!o.equipmentAllocations.some((a) => a.ba && a.owner === oldId) || q.ba === "Current")
    );
  }

  function confirmHandover(o: MdtOrder, oldId: string) {
    const key = `${o.id}:${oldId}`;
    const newId = handovers[key] ?? "";
    if (!handoverEligible(o, oldId, newId)) return;
    const nextCrew = o.crewIds.map((c) => (c === oldId ? newId : c));
    const sim = o.simTaskId ? tasks.find((t) => t.id === o.simTaskId) : undefined;
    if (sim && sim.state === "active") onSetTaskCrew?.(sim.id, nextCrew);
    mutate(o.id, (x) =>
      event(x, `Handover confirmed · ${nameOf(oldId)} → ${nameOf(newId)} · equipment ownership transferred`, {
        crewIds: nextCrew,
        equipmentAllocations: x.equipmentAllocations.map((a) => (a.owner === oldId ? { ...a, owner: newId } : a)),
      }),
    );
    setHandovers((p) => ({ ...p, [key]: "" }));
  }

  function recordReturn(o: MdtOrder, item: Allocation) {
    const key = `${o.id}:${item.id}`;
    const outcome = returnChoices[key] ?? "";
    if (!TERMINAL.includes(o.status) || o.equipmentState !== "Awaiting return" || item.returnStatus === "Returned" || !RETURN_OUTCOMES.includes(outcome)) return;
    mutate(o.id, (x) => {
      const equipmentAllocations = x.equipmentAllocations.map((i) =>
        i.id === item.id ? { ...i, returnStatus: outcome === "Returned — serviceable" ? "Returned" : outcome, returnRecordedAt: now } : i,
      );
      const allReturned = equipmentAllocations.every((i) => i.returnStatus === "Returned");
      return event(x, `${item.id} · ${outcome}`, {
        equipmentAllocations,
        equipmentState: allReturned ? "Returned" : "Awaiting return",
        ...(allReturned ? { returnedAt: now } : {}),
      });
    });
    setReturnChoices((p) => ({ ...p, [key]: "" }));
  }

  // ---- Task order form ---------------------------------------------------

  const pick = (kind: TaskKind) =>
    setForm({ kind, method: "", location: "", equipmentIds: [], quantities: {}, owners: {}, chosen: [], target: "", mitigation: "" });
  const patchForm = (p: Partial<Form>) => setForm((f) => (f ? { ...f, ...p } : f));

  const stock = inventoryFor(appliance, storedOrders.map((o) => withSim(o, tasks)), tasks);
  const kind = form?.kind ?? null;
  const config: TaskConfig = kind ? TASK_CONFIG[kind] : [[], [], false];
  const detail = kind ? TASK_DETAIL[kind] : ["Select a task.", "", ""];
  const minimum = kind ? TASK_MIN_CREW[kind] : 1;
  const method = form?.method ?? "";
  const location = form?.location ?? "";
  const chosen = form?.chosen ?? [];
  const selectedEquipment = form?.equipmentIds ?? [];
  const quantities = form?.quantities ?? {};
  const countFor = (id: string) => quantities[id] || 1;
  const methods = config[0].filter((m) => m !== "UHPL lance" || appliance.capabilities?.some((c) => /UHPL|HRET/i.test(c)));

  const equipment = stock
    .filter((line) => kind === "kit_grab" || config[1].some((src) => line.source.toLowerCase().includes(src.toLowerCase()) || src.toLowerCase().includes(line.source.toLowerCase())))
    .map((line) => ({
      ...line,
      disabled: line.free.length === 0,
      availability: `${line.free.length} available / ${line.total} total · ${line.deployed} deployed · ${line.reserved} reserved · ${line.issued} issued · ${line.awaiting} awaiting return`,
    }));
  const equipmentValid =
    selectedEquipment.length > 0 &&
    new Set(selectedEquipment).size === selectedEquipment.length &&
    selectedEquipment.every((id) =>
      id === "none" ? !config[2] && selectedEquipment.length === 1 : equipment.some((e) => e.id === id && countFor(id) > 0 && countFor(id) <= e.free.length),
    );
  const baNeeded = kind === "ba_sar" || (kind === "hose_attack" && method === "Interior attack");
  const requiredSources: string[][] =
    kind === "hose_attack"
      ? [["Hose"], ...(method === "Interior attack" ? [["BA sets"]] : [])]
      : kind === "ba_sar"
        ? [["BA sets"]]
        : kind === "aerial_rescue" || kind === "extend_platform"
          ? [["32m turntable ladder", "Hydraulic platform"]]
          : [];
  const selectedLines = equipment.filter((e) => selectedEquipment.includes(e.id));
  const mandatoryValid =
    requiredSources.every((group) => selectedLines.some((e) => group.some((g) => e.source.toLowerCase().includes(g.toLowerCase())))) &&
    (!baNeeded || selectedLines.filter((e) => e.label === "BA set").reduce((n, e) => n + countFor(e.id), 0) >= Math.max(minimum, chosen.length));
  const competencies = baNeeded ? { all: ["ba"] as Competency[] } : kind ? TASK_COMPETENCIES[kind] ?? {} : {};
  const missingFor = (crewId: string) => (competencies.all ?? []).filter((q) => compOf(crewId)[q] !== "Current");
  const teamMissing = (competencies.any ?? []).filter((q) => !chosen.some((c) => compOf(c)[q] === "Current"));
  const qualificationValid = chosen.every((c) => missingFor(c).length === 0) && teamMissing.length === 0;
  const qualificationRequirement =
    [
      ...(competencies.all ?? []).map((q) => `Each crew member: ${COMPETENCY_LABELS[q]}`),
      ...(competencies.any ?? []).map((q) => `At least one: ${COMPETENCY_LABELS[q]}`),
    ].join(" · ") || "No specialist competency required by this scenario task.";
  const allocations: Allocation[] = selectedLines.flatMap((e) =>
    e.free.slice(0, countFor(e.id)).map((i) => ({
      id: i.id,
      label: e.label,
      ba: e.label === "BA set",
      owner: form?.owners[i.id] ?? (e.label === "BA set" ? "" : "Shared task"),
    })),
  );
  const baAllocations = allocations.filter((a) => a.ba);
  const allocationValid =
    allocations.every((a) => (a.ba ? chosen.includes(a.owner) && compOf(a.owner).ba === "Current" : a.owner === "Shared task" || chosen.includes(a.owner))) &&
    new Set(baAllocations.map((a) => a.owner)).size === baAllocations.length &&
    (!baNeeded || chosen.every((c) => baAllocations.some((a) => a.owner === c)));

  // Simulator targets — what the task acts on.
  const hydrantCount = new Map<string, number>();
  for (const t of tasks) {
    if (t.kind === "connect_hydrant" && t.state !== "aborted" && t.hydrantId) hydrantCount.set(t.hydrantId, (hydrantCount.get(t.hydrantId) ?? 0) + 1);
  }
  const relaySources = onScene.filter((a) => a.id !== appliance.id && a.service === "Fire" && a.waterLitres > 0);
  const hazardDone = new Set(tasks.filter((t) => t.kind === "mitigate_hazard" && t.state !== "aborted").map((t) => t.hazardId));
  const casualtyDone = new Set(tasks.filter((t) => t.kind === "extract_casualty" && t.state !== "aborted").map((t) => t.casualtyId));
  const targetHazard = hazards.find((h) => h.id === form?.target);
  const mitigations = targetHazard ? mitigationOptionsFor(targetHazard.kind) : [];
  const targetNeeded =
    kind === "connect_hydrant" ? "Select a supply point." :
    kind === "relay_hose" ? "Select the source appliance." :
    kind === "mitigate_hazard" ? "Select the hazard and its mitigation." :
    kind === "extract_casualty" ? "Select the casualty." : "";
  const targetValid =
    kind === "connect_hydrant" ? hydrants.some((h) => h.label === form?.target) :
    kind === "relay_hose" ? relaySources.some((a) => a.id === form?.target) :
    kind === "mitigate_hazard" ? !!targetHazard && mitigations.some((m) => m.method === form?.mitigation) :
    kind === "extract_casualty" ? casualties.some((c) => c.id === form?.target) : true;
  const stabilisersDone = tasks.some((t) => t.applianceId === appliance.id && t.kind === "deploy_stabilisers" && t.state === "completed");
  const platformOut = tasks.some((t) => t.applianceId === appliance.id && t.kind === "extend_platform" && t.state === "active");
  const prerequisite =
    kind === "extend_platform" && !stabilisersDone ? "Deploy stabilisers first." :
    (kind === "aerial_rescue" || kind === "aerial_monitor") && !platformOut ? "Extend the platform first." :
    kind === "hose_attack" && !pumpReady ? "Start the pump with an operator first." : "";

  const crewValid = chosen.length >= minimum && !chosen.some(busy) && new Set(chosen).size === chosen.length && chosen.every((c) => !!memberOf(c));
  const ready =
    allowed && !!kind && kinds.includes(kind) && methods.includes(method) && LOCATIONS.includes(location) &&
    equipmentValid && mandatoryValid && targetValid && !prerequisite && crewValid && qualificationValid && allocationValid;
  const gate = !allowed
    ? (phase !== "at_incident" ? "Unit must be in attendance." : resolved ? "Incident closed." : "Crew roster unavailable.")
    : !methods.includes(method)
      ? "Select a task option."
      : !targetValid
        ? targetNeeded
        : prerequisite
          ? prerequisite
          : !equipmentValid
            ? `Select available equipment${config[2] ? "." : " or no additional equipment."}`
            : !mandatoryValid
              ? (baNeeded ? "Select one available BA set per assigned crew member." : `Required: ${requiredSources.map((g) => g[0]).join(", ")}`)
              : !LOCATIONS.includes(location)
                ? "Select a working location."
                : !crewValid
                  ? `Select ${minimum} available crew.`
                  : !qualificationValid
                    ? `Competency required · ${qualificationRequirement}`
                    : !allocationValid
                      ? "Allocate each BA set to a different current wearer; check equipment owners are selected crew."
                      : "Ready to reserve · confirm equipment issue before starting.";

  const address = `${incident.scenario.location.address}, ${incident.scenario.location.postcode}`;
  const targetText =
    kind === "connect_hydrant" ? `Hydrant ${form?.target}` :
    kind === "relay_hose" ? `Relay from ${onScene.find((a) => a.id === form?.target)?.callsign ?? form?.target}` :
    kind === "mitigate_hazard" ? `${targetHazard?.label ?? ""} · ${form?.mitigation ?? ""}` :
    kind === "extract_casualty" ? (casualties.find((c) => c.id === form?.target)?.label ?? form?.target ?? "") : "";
  const orderSummary = [
    method || "Task not selected",
    selectedEquipment.length
      ? selectedLines.map((e) => `${countFor(e.id)} × ${e.label}`).join(", ") || (selectedEquipment.includes("none") ? "No additional equipment" : "Equipment unavailable")
      : "Equipment not selected",
    location || "Location not selected",
    chosen.length ? chosen.map(nameOf).join(", ") : "Crew not selected",
  ].join(" · ");

  function reserve() {
    if (!form || !kind || !ready) return;
    const at = now;
    const selectedLabels = selectedLines.map((e) => e.label);
    const sim: SimTarget = {};
    if (kind === "hose_attack") {
      sim.attackMode = attackModeFor(method);
      sim.hoseType = selectedLabels.includes("70 mm delivery hose") && !selectedLabels.includes("45 mm delivery hose") ? "70mm" : "45mm";
    }
    if (kind === "ba_sar") sim.baMode = "search";
    if (kind === "gain_entry") sim.entryTool = entryToolFor(selectedLabels);
    if (kind === "kit_grab") sim.kitKind = kitKindFor(selectedLabels);
    if (kind === "connect_hydrant") sim.hydrantId = form.target;
    if (kind === "relay_hose") {
      sim.sourceApplianceId = form.target;
      sim.hoseType = selectedLabels.includes("45 mm delivery hose") && !selectedLabels.includes("70 mm delivery hose") ? "45mm" : "70mm";
    }
    if (kind === "mitigate_hazard") {
      sim.hazardId = form.target;
      sim.mitigationMethod = form.mitigation;
    }
    if (kind === "extract_casualty") sim.casualtyId = form.target;
    const order: MdtOrder = {
      id: `${at}-${appliance.callsign}-${storedOrders.length}`,
      unit: appliance.id,
      kind,
      crewIds: [...chosen],
      method,
      location,
      target: `${location} · ${targetText ? `${targetText} · ` : ""}${incident.scenario.location.address}`,
      brief: method,
      equipmentSources: [...new Set(selectedLines.map((e) => e.source))],
      equipmentItemIds: allocations.map((a) => a.id),
      equipmentAllocations: allocations.map(({ id, label, owner, ba }) => ({ id, label, owner, ba })),
      equipmentLabels: selectedLines.map((e) => `${countFor(e.id)} × ${e.label}`),
      equipmentState: allocations.length ? "Reserved" : "Released",
      requiredAll: competencies.all ?? [],
      requiredAny: competencies.any ?? [],
      status: "Sent",
      sentAt: at,
      startedAt: at,
      events: [{ at, text: "Task sent · crew and equipment reserved" }],
      report: "",
      sim,
    };
    updateOrders(incident.id, (prev) => [...prev, order]);
    onNote?.(`${appliance.callsign} — ${label(kind)} · ${method} · ${selectedLabels.join(", ") || "Personal equipment"} · ${chosen.map(nameOf).join(", ")}`);
    setForm(null);
  }

  // ---- Render ------------------------------------------------------------

  const finishNote = (o: MdtOrder) =>
    o.report ||
    (o.status === "Sent"
      ? "Awaiting crew acceptance. Crew and equipment reserved."
      : o.status === "Assigned"
        ? "Equipment reserved. Confirm physical issue to start the task."
        : o.status === "Paused"
          ? "Paused · equipment remains issued."
          : "Completion releases crew. Issued equipment requires a separate return confirmation.");
  const simOf = (o: MdtOrder) => (o.simTaskId ? tasks.find((t) => t.id === o.simTaskId) : undefined);
  const elapsed = (o: MdtOrder) => {
    const t = simOf(o);
    const base = t?.startedAt ?? o.issuedAt ?? o.startedAt;
    const running = mmss(now - base);
    return t?.completesAt && t.state === "active" ? `${running} · completes ${hhmmss(t.completesAt)}` : running;
  };
  const returnNote = (o: MdtOrder) =>
    o.equipmentState === "Awaiting return"
      ? "Equipment awaiting return — unavailable for allocation"
      : o.returnedAt !== undefined
        ? "All equipment returned and available"
        : "Reservations released";
  const historyNeedsReturns = all.some((o) => o.equipmentState === "Awaiting return");

  return (
    <>
      {!form && (
        <>
          <div className="rc-caption">UNIT TASKING</div>
          <p>{active.length ? `${active.length} active assignment(s) · ${free} crew available` : "No active assignments for this unit."}</p>
          {active.map((o) => {
            const sim = simOf(o);
            return (
              <article key={o.id} className="mdt-task-card">
                <header>
                  <strong>{label(o.kind)}</strong>
                  <span>{o.status} · {elapsed(o)}</span>
                </header>
                <dl>
                  <dt>Tasking</dt><dd>{o.brief || "No additional instructions"}</dd>
                  <dt>Location</dt><dd>{o.target || "Not recorded"}</dd>
                  <dt>Equipment</dt><dd>{o.equipmentLabels.join(", ") || "No additional equipment"}</dd>
                  <dt>Crew</dt><dd>{o.crewIds.map(nameOf).join(", ")}</dd>
                </dl>
                <div className="equipment-manifest">
                  {o.equipmentAllocations.map((a) => (
                    <p key={a.id}>{a.label} · {a.id} → {a.owner === "Shared task" ? a.owner : nameOf(a.owner)}</p>
                  ))}
                </div>
                <div className="mdt-task-controls">
                  {o.status === "Sent" && <button type="button" className="rc-primary" onClick={() => accept(o.id)}>Accept task</button>}
                  {o.status === "Assigned" && <button type="button" className="rc-primary" onClick={() => issue(o.id)}>Confirm issue &amp; start</button>}
                  <button
                    type="button"
                    disabled={!["In progress", "Paused"].includes(o.status) || !!sim}
                    title={sim ? "A running simulator task cannot be paused" : undefined}
                    onClick={() => pause(o.id)}
                  >
                    {o.status === "Paused" ? "Resume" : "Pause"}
                  </button>
                  <button type="button" disabled={o.status !== "In progress"} onClick={() => finish(o.id, "Completed")}>Report complete</button>
                  <button type="button" onClick={() => finish(o.id, "Cancelled")}>Unable to complete</button>
                </div>
                <small>{finishNote(o)}</small>
                <details className="mdt-workflow">
                  <summary>Update / hand over task</summary>
                  <p>Select an operational update</p>
                  <div className="mdt-update-grid">
                    {UPDATES.map((u) => (
                      <button key={u} type="button" onClick={() => sendUpdate(o, u)}>{u}</button>
                    ))}
                  </div>
                  <p>Replace crew member · equipment ownership follows the handover</p>
                  {o.crewIds.map((cid) => {
                    const key = `${o.id}:${cid}`;
                    const value = handovers[key] ?? "";
                    return (
                      <label key={cid} className="equipment-owner">
                        <strong>{nameOf(cid)}</strong>
                        <select aria-label={`Replace ${nameOf(cid)}`} value={value} onChange={(e) => setHandovers((p) => ({ ...p, [key]: e.target.value }))}>
                          <option value="">Select replacement</option>
                          {crew.filter((c) => !o.crewIds.includes(c.id)).map((c) => {
                            const ok = handoverEligible(o, cid, c.id);
                            return (
                              <option key={c.id} value={c.id} disabled={!ok}>
                                {c.name} · {c.role}{ok ? "" : " · Unavailable / competency required"}
                              </option>
                            );
                          })}
                        </select>
                        <button type="button" disabled={!handoverEligible(o, cid, value)} onClick={() => confirmHandover(o, cid)}>Confirm handover</button>
                      </label>
                    );
                  })}
                </details>
                <details className="mdt-workflow">
                  <summary>Task timeline</summary>
                  {o.events.map((ev, i) => (
                    <p key={i}><time>{hhmmss(ev.at)}</time> · {ev.text}</p>
                  ))}
                </details>
              </article>
            );
          })}
          <div className="rc-caption">{page === "water" ? "WATER SUPPLY & FIREFIGHTING" : "AVAILABLE TASKS"}</div>
          {catalogue.length === 0 && <p>No {page === "water" ? "water" : ""} tasks are available to this unit.</p>}
          <div className="rc-action-grid">
            {catalogue.map((k) => (
              <button key={k} type="button" onClick={() => pick(k)}>
                <strong>{label(k)}</strong>
                <span>{TASK_DETAIL[k][0]}</span>
                <small>
                  {!allowed
                    ? (phase !== "at_incident" ? "Requires arrival at scene" : "Crew roster unavailable")
                    : free < TASK_MIN_CREW[k]
                      ? `Insufficient free crew · ${TASK_MIN_CREW[k]} required`
                      : `${TASK_MIN_CREW[k]} crew · Configure task`}
                </small>
              </button>
            ))}
          </div>
        </>
      )}

      {form && kind && (
        <section className="rc-selection mdt-task-detail">
          <header className="task-order-head">
            <span>TASK ORDER</span>
            <strong>{label(kind)}</strong>
            <small>{appliance.callsign} · {incidentRef}</small>
          </header>
          <p>{detail[0]}</p>

          <fieldset className="task-choices">
            <legend>01 · TASK</legend>
            <div>
              {methods.map((m) => (
                <button key={m} type="button" aria-pressed={method === m} onClick={() => patchForm({ method: m })}>{m}</button>
              ))}
            </div>
            {kind === "connect_hydrant" && (
              <>
                <p>Supply point</p>
                <div>
                  {hydrants.length === 0 && <small>No hydrants are known on this scene yet.</small>}
                  {hydrants.map((h) => {
                    const n = hydrantCount.get(h.label) ?? 0;
                    return (
                      <button key={h.label} type="button" aria-pressed={form.target === h.label} disabled={n >= 2} onClick={() => patchForm({ target: h.label })}>
                        <strong>{h.label}</strong>
                        <small>{h.street ? `${h.street} · ` : ""}{n === 0 ? "No pumps connected" : `${n} pump${n === 1 ? "" : "s"} connected`}</small>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            {kind === "hose_attack" && (
              <>
                <p>Pump</p>
                <div>
                  <button type="button" aria-pressed={pumpReady} disabled={pumpReady || !onStartPump} onClick={onStartPump}>
                    <strong>{pumpReady ? "Pump running" : "Start the pump"}</strong>
                    <small>{pumpOperatorName ? `Operator · ${pumpOperatorName}` : "Nominates the driver as pump operator"}</small>
                  </button>
                </div>
              </>
            )}
            {kind === "relay_hose" && (
              <>
                <p>Source appliance</p>
                <div>
                  {relaySources.length === 0 && <small>No other pump is on the ground to relay from.</small>}
                  {relaySources.map((a) => (
                    <button key={a.id} type="button" aria-pressed={form.target === a.id} onClick={() => patchForm({ target: a.id })}>
                      <strong>{a.callsign}</strong>
                      <small>{a.typeName} · {Math.round(a.waterPct)}% water</small>
                    </button>
                  ))}
                </div>
              </>
            )}
            {kind === "mitigate_hazard" && (
              <>
                <p>Hazard</p>
                <div>
                  {hazards.length === 0 && <small>No hazards have been identified on this scene yet.</small>}
                  {hazards.map((h) => (
                    <button key={h.id} type="button" aria-pressed={form.target === h.id} disabled={hazardDone.has(h.id)} onClick={() => patchForm({ target: h.id, mitigation: "" })}>
                      <strong>{h.label}</strong>
                      <small>{hazardDone.has(h.id) ? "Already being made safe" : h.kind}</small>
                    </button>
                  ))}
                </div>
                {targetHazard && (
                  <>
                    <p>Mitigation</p>
                    <div>
                      {mitigations.map((m) => (
                        <button key={m.method} type="button" aria-pressed={form.mitigation === m.method} onClick={() => patchForm({ mitigation: m.method })}>
                          <strong>{m.method}</strong>
                          <small>{Math.round(m.durationSec / 60)} min{m.needsBA ? " · BA" : ""}</small>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
            {kind === "extract_casualty" && (
              <>
                <p>Casualty</p>
                <div>
                  {casualties.length === 0 && <small>No casualty has been located yet.</small>}
                  {casualties.map((c) => (
                    <button key={c.id} type="button" aria-pressed={form.target === c.id} disabled={casualtyDone.has(c.id)} onClick={() => patchForm({ target: c.id })}>
                      <strong>{c.label ?? c.id}</strong>
                      <small>{casualtyDone.has(c.id) ? "Already being moved" : "Located"}</small>
                    </button>
                  ))}
                </div>
              </>
            )}
          </fieldset>

          <fieldset className="task-choices">
            <legend>02 · EQUIPMENT</legend>
            <p>
              {equipment.length
                ? `${config[2] ? "Select equipment for this task. " : "Select equipment, or choose no additional equipment. "}Choose the quantity to reserve. Stock counts are scenario values.`
                : config[2]
                  ? "No compatible equipment is recorded on this vehicle."
                  : "No additional task equipment is recorded."}
            </p>
            <div>
              {[...equipment, ...(!config[2] ? [{ id: "none", label: "No additional equipment", source: "", disabled: false, availability: "No vehicle equipment reserved", free: [] as StockItem[] }] : [])].map((e) => {
                const selected = selectedEquipment.includes(e.id);
                return (
                  <div key={e.id} className="stock-choice">
                    <button
                      type="button"
                      aria-pressed={selected}
                      disabled={e.disabled}
                      onClick={() => {
                        if (e.disabled) return;
                        patchForm({
                          equipmentIds: e.id === "none" ? ["none"] : selected ? selectedEquipment.filter((id) => id !== e.id) : [...selectedEquipment.filter((id) => id !== "none"), e.id],
                        });
                      }}
                    >
                      <strong>{e.label}</strong>
                      <small>{e.availability}</small>
                    </button>
                    {e.id !== "none" && selected && (
                      <div className="stock-quantity">
                        <span>Quantity</span>
                        <button type="button" aria-label="Reduce quantity" disabled={countFor(e.id) <= 1} onClick={() => patchForm({ quantities: { ...quantities, [e.id]: countFor(e.id) - 1 } })}>−</button>
                        <output>{countFor(e.id)}</output>
                        <button type="button" aria-label="Increase quantity" disabled={countFor(e.id) >= e.free.length} onClick={() => patchForm({ quantities: { ...quantities, [e.id]: countFor(e.id) + 1 } })}>+</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="task-choices">
            <legend>03 · WORKING LOCATION</legend>
            <p>{address}</p>
            <div>
              {LOCATIONS.map((l) => (
                <button key={l} type="button" aria-pressed={location === l} onClick={() => patchForm({ location: l })}>{l}</button>
              ))}
            </div>
            <small>Left and right are viewed from the front of the incident.</small>
          </fieldset>

          <fieldset className="task-choices">
            <legend>04 · CREW · {chosen.length} selected / {minimum} required</legend>
            <p>{minimum} crew minimum in this scenario</p>
            <p>{qualificationRequirement}</p>
            <small>Scenario qualification roster</small>
            <div>
              {crew.map((c) => {
                const q = competencyFor(appliance, c);
                const missing = missingFor(c.id);
                const isBusy = busy(c.id);
                const blocked = isBusy || missing.length > 0;
                const selected = chosen.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={blocked}
                    aria-pressed={selected}
                    onClick={() => {
                      if (blocked) return;
                      patchForm({ chosen: selected ? chosen.filter((id) => id !== c.id) : [...chosen, c.id] });
                    }}
                  >
                    <strong>{c.name}</strong>
                    <span>{c.role}</span>
                    <small>{Object.entries(q).map(([k, v]) => `${COMPETENCY_LABELS[k as Competency]}: ${v}`).join(" · ") || "Qualifications not recorded"}</small>
                    <small>
                      {isBusy
                        ? "Already assigned"
                        : missing.length
                          ? missing.map((k) => `${COMPETENCY_LABELS[k]} · ${q[k] ?? "Not recorded"}`).join(", ")
                          : selected
                            ? "Selected"
                            : "Available"}
                    </small>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="task-choices">
            <legend>05 · EQUIPMENT ALLOCATION</legend>
            <p>
              {allocations.length
                ? "Each item is reserved by asset ID. Select a wearer for every BA set; shared equipment can remain with the task."
                : "Select equipment above to configure its allocation."}
            </p>
            {allocations.map((a) => (
              <label key={a.id} className="equipment-owner">
                <strong>{a.label}</strong>
                <small>{a.id}</small>
                <select aria-label={a.id} value={a.owner} onChange={(e) => patchForm({ owners: { ...form.owners, [a.id]: e.target.value } })}>
                  <option value="" disabled>{a.ba ? "Select wearer" : "Select owner"}</option>
                  {!a.ba && <option value="Shared task">Shared task</option>}
                  {chosen.map((cid) => (
                    <option key={cid} value={cid} disabled={a.ba && compOf(cid).ba !== "Current"}>{nameOf(cid)}</option>
                  ))}
                </select>
              </label>
            ))}
          </fieldset>

          <div className="task-order-summary">
            <strong>ASSIGNMENT SUMMARY</strong>
            <p>{orderSummary}</p>
            <span role="status">{gate}</span>
          </div>
          <div className="mdt-task-controls">
            <button type="button" className="rc-primary" disabled={!ready} onClick={reserve}>Reserve task &amp; equipment</button>
            <button type="button" onClick={() => setForm(null)}>Back to tasks</button>
          </div>
        </section>
      )}

      {!form && (
        <details className="mdt-task-history" open={historyNeedsReturns}>
          <summary>Task history · {history.length}</summary>
          {history.map((o) => (
            <article key={o.id}>
              <strong>{label(o.kind)} · {o.status}</strong>
              <p>{o.target} · {o.crewIds.map(nameOf).join(", ")}</p>
              <p>{[o.brief, o.equipmentLabels.join(", "), o.report || "No outcome recorded"].filter(Boolean).join(" · ")}</p>
              {o.equipmentAllocations.map((a) => (
                <p key={a.id}>{a.id} → {a.owner === "Shared task" ? a.owner : nameOf(a.owner)}</p>
              ))}
              <strong>{returnNote(o)}</strong>
              {o.equipmentState === "Awaiting return" && (
                <div className="mdt-item-returns">
                  {o.equipmentAllocations.map((item) => {
                    const key = `${o.id}:${item.id}`;
                    const choice = returnChoices[key] ?? "";
                    return (
                      <label key={item.id} className="equipment-owner">
                        <strong>{item.label}</strong>
                        <small>{item.id} · {item.owner === "Shared task" ? item.owner : nameOf(item.owner)}</small>
                        <span>{item.returnStatus ?? "Awaiting return"}</span>
                        <select aria-label={item.id} value={choice} onChange={(e) => setReturnChoices((p) => ({ ...p, [key]: e.target.value }))}>
                          <option value="">Select return outcome</option>
                          {RETURN_OUTCOMES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button type="button" disabled={item.returnStatus === "Returned" || !RETURN_OUTCOMES.includes(choice)} onClick={() => recordReturn(o, item)}>Record item outcome</button>
                      </label>
                    );
                  })}
                </div>
              )}
              <details className="mdt-workflow">
                <summary>Task timeline</summary>
                {o.events.map((ev, i) => (
                  <p key={i}><time>{hhmmss(ev.at)}</time> · {ev.text}</p>
                ))}
              </details>
            </article>
          ))}
        </details>
      )}
    </>
  );
}

/** Stock lines for the Vehicle page's item register. */
export function stockRegister(appliance: Appliance, incidentId: string, tasks: Task[]) {
  return inventoryFor(appliance, readOrders(incidentId), tasks);
}
