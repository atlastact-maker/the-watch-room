import type { Scenario } from "../incident_types";

// Scenario 34 — fall from height on a building site, Salford.
//
// Major trauma, which is a triage decision before it is a clinical one.
// A patient meeting the trauma criteria goes to a major trauma centre and
// bypasses everything nearer, and the operator's part is recognising that
// from the mechanism alone — a fall of four metres onto concrete is
// enough, before anybody has counted a respiratory rate.
//
// It is also the strongest HEMS case in the sim, and not because of the
// flying. HEMS bring a doctor and interventions a road crew cannot do,
// and on a building site with a long carry the aircraft is often the
// faster route to the trauma centre as well.
//
// Fire attend for the extrication rather than the fire: he is on
// scaffolding boards at first-floor level with a leg that will not be
// carried down a ladder.
//
// FICTIONAL: the site, the firm and the casualty. Ordsall Lane is a real
// Salford road; the development is not.

export const scenario34: Scenario = {
  id: "34",
  slug: "34_major_trauma_salford",
  title: "Fall from height — building site, Ordsall Lane",
  type: "ambulance_major_trauma",
  patch: "Western",
  severity: "high",
  trigger:
    "Category 2 major trauma — male fallen approximately four metres onto concrete, then dragged to scaffolding at first-floor level by workmates. Conscious, leg deformed",

  location: {
    address: "Construction site, Ordsall Lane, Salford",
    postcode: "M5 3EN",
    coords: { lat: 53.4731, lng: -2.2698 },
  },

  property: {
    class: "Construction site — partially built frame, scaffolded to three levels",
    occupants: "Around twenty on site. Site manager on scene and controlling access",
    vulnerabilities: [
      "Casualty at first-floor level on scaffolding boards — cannot be carried down a ladder",
      "Workmates have already moved him, which nobody wanted but which has happened",
    ],
    access:
      "Site gates off Ordsall Lane, hard standing inside. Site manager holds the gate and can clear a landing area on the slab",
    knownHazards: [
      "Working at height for the extrication",
      "Live site — plant movements, open edges, materials stacked",
    ],
    firstDueStationId: "A-SAL",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — construction site.",
      "Major trauma triage: mechanism alone (fall over three metres) meets the criteria for a trauma centre.",
      "Site has hard standing and the manager can clear a landing area — HEMS is viable here.",
    ],
  },

  methane: {
    M: "No",
    E: "Construction site, Ordsall Lane, Salford, M5 3EN",
    T: "Fall from height, approximately 4 m onto concrete. One casualty at first-floor level",
    H: "Working at height; live construction site",
    A: "Site gates off Ordsall Lane; manager holding the gate, landing area available on the slab",
    N: "One — male, conscious, obvious lower limb deformity",
    emergencyServices: "Ambulance leading; fire for extrication; HEMS requested",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-SAL",
      notes: "First road resource. Major trauma triage decides where he goes, not how fast he leaves",
    },
    {
      id: "hems",
      label: "HEMS",
      service: "Ambulance",
      requiredApplianceTypes: ["HEMS"],
      requiredCapabilities: [],
      notes:
        "A doctor and interventions a road crew cannot do — and on a site with a long carry, often the faster route to the trauma centre as well",
    },
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: [],
      preferredStationId: "G58",
      notes: "He is on boards at first-floor level. Somebody has to bring him down, and it is not the ambulance crew",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      {
        metric: "Trauma triage",
        target: "recognised from the mechanism — a fall over three metres, before any observations",
      },
      {
        metric: "HEMS",
        target: "requested early; the site has a landing area and the carry is long",
      },
      {
        metric: "Extrication",
        target: "fire mobilised — he cannot come down a ladder",
      },
    ],
    lesson:
      "Major trauma is a triage decision before it is a clinical one, and the mechanism alone decides it: four metres onto concrete meets the criteria before anybody has taken a pulse. So he bypasses everything nearer for a trauma centre. Ask for HEMS early — not for the speed but for the doctor — and send fire, because a man on scaffolding boards with a broken leg is not coming down a ladder.",
  },

  scene: {
    viewBox: { x: -60, y: -45, width: 120, height: 90 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -26, y: -32, w: 52, h: 34 }, kind: "target", label: "Frame — scaffolded" },
      { shape: { x: 30, y: -20, w: 20, h: 14 }, kind: "neighbour", label: "Site cabins" },
    ],
    roads: [
      { shape: { x: -50, y: 6, w: 90, h: 18 }, kind: "driveway", label: "Hard standing / landing area" },
      { shape: { x: -60, y: 26, w: 120, h: 4 }, kind: "driveway", label: "Site gates" },
      { shape: { x: -60, y: 30, w: 120, h: 10 }, kind: "road", label: "Ordsall Lane" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.4736, lng: -2.2706 }, street: "Ordsall Lane" }],
    landmarks: [
      { pos: { x: 36, y: 14 }, kind: "car" },
      { pos: { x: 44, y: 14 }, kind: "car" },
      { pos: { x: -44, y: 34 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "height",
        pos: { x: -4, y: -18 },
        kind: "structural",
        label: "Casualty on scaffolding boards at first-floor level",
        knownFromPri: true,
      },
      {
        id: "live-site",
        pos: { x: 16, y: -6 },
        kind: "structural",
        label: "Live site — plant movements, open edges, stacked materials",
        knownFromPri: true,
      },
      {
        id: "landing",
        pos: { x: -20, y: 14 },
        kind: "structural",
        label: "Hard standing clear enough for an aircraft if the manager moves the plant",
        discoverAfterMinOnScene: 2,
      },
    ],
    casualties: [
      {
        id: "cas-34-worker",
        label: "Male, 30s — fall approximately 4 m, lower limb deformity",
        pos: { x: -4, y: -17 },
        severity: "critical",
        discoverAfterMinBa: 1,
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Gates / hard standing", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Site cabins", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Frame rear", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Scaffold west", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "manager-first",
      atSec: 5,
      text: "Site manager, Ordsall Lane. One of the lads has come off the scaffold — twelve, thirteen foot onto the concrete. He's awake and talking but his leg's the wrong shape. They've moved him up onto the boards, I know they shouldn't have.",
      tone: "critical",
    },
    {
      id: "access",
      atSec: 50,
      text: "I'll hold the gates open. There's hard standing inside if you want to bring anything in — I can shift the telehandler if you need the space clearing.",
      tone: "info",
    },
    {
      id: "deteriorating",
      atSec: 210,
      probability: 0.45,
      text: "He's gone very pale and he's not talking as much now. He was chatting away five minutes ago.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "carry",
      atSec: 300,
      probability: 0.7,
      text: "Your crew are saying they can't get him down the ladder like that. They're asking about a different way off the scaffold.",
      tone: "urgent",
    },
  ],
};
