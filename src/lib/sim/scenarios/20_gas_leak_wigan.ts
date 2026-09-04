import type { Scenario } from "../incident_types";

// Scenario 20 — smell of gas, Wigan.
//
// The lesson is restraint, which nothing else here teaches. The fire
// service cannot fix a gas leak. They can cordon it, evacuate it, stop
// anybody creating an ignition source and stand there — and then they
// wait for the gas emergency service, who are the only people who can
// turn it off.
//
// So sending more pumps achieves nothing at all, and the operator's real
// job on this call is the phone: get the gas emergency number rung, get
// the cordon set, and resist the urge to do something visible. It is the
// opposite instinct to every fire job in the sim.
//
// FICTIONAL: the residents and the house numbers. Ormskirk Road is a real
// Wigan road; the addresses are not.

export const scenario20: Scenario = {
  id: "20",
  slug: "20_gas_leak_wigan",
  title: "Smell of gas — Ormskirk Road, Wigan",
  type: "special_service_gas_leak",
  patch: "Western",
  severity: "moderate",
  trigger:
    "Strong smell of gas in the street outside a terraced row. Several callers. One reports hearing hissing near the pavement",

  location: {
    address: "Outside 62–70 Ormskirk Road, Wigan",
    postcode: "WN5 9ED",
    coords: { lat: 53.5457, lng: -2.6541 },
  },

  property: {
    class: "Terraced residential row — the leak is believed to be in the street, not a property",
    occupants:
      "Row occupied. Elderly resident at no. 66 with restricted mobility per the neighbour",
    vulnerabilities: [
      "Nobody can make this safe except the gas emergency service — the attendance is a cordon and a wait",
      "Elderly resident at no. 66 will not self-evacuate quickly",
    ],
    access: "Ormskirk Road both ends. Terraced row, on-street parking both sides",
    knownHazards: [
      "Any ignition source — doorbells, light switches, a vehicle starting inside the cordon",
      "Gas may be tracking through the ground into cellars rather than dispersing",
    ],
    firstDueStationId: "G54",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — residential street.",
      "Gas emergency service holds the network plans and the isolation points. Nobody else can turn it off.",
      "Cellars in this row per the housing stock — gas tracks into them.",
    ],
  },

  methane: {
    M: "No",
    E: "Outside 62–70 Ormskirk Road, Wigan, WN5 9ED",
    T: "Strong smell of gas in the street; hissing reported at pavement level",
    H: "Any ignition source. Possible tracking into cellars",
    A: "Ormskirk Road from either end; cordon required before crews commit",
    N: "None. Row occupied — elderly resident at no. 66 with restricted mobility",
    emergencyServices: "Fire in attendance; gas emergency service required",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G54",
      notes:
        "One pump. A second achieves nothing — the fire service cannot turn gas off, and the only useful call on this job is to the gas emergency service",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "First attendance", target: "< 10 minutes" },
      {
        metric: "Gas emergency service",
        target: "notified immediately — they are the only people who can stop it",
      },
      {
        metric: "Restraint",
        target: "no make-up: more pumps cannot fix a gas leak",
      },
    ],
    lesson:
      "The only job here where doing more is doing worse. The fire service cordons it, evacuates it, keeps every ignition source away and waits — nobody on that appliance can turn the gas off. Ring the gas emergency service first, set the cordon wide, and resist the urge to send something else so it looks like you are doing something.",
  },

  scene: {
    viewBox: { x: -60, y: -35, width: 120, height: 70 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -50, y: -26, w: 20, h: 24 }, kind: "neighbour", label: "62" },
      { shape: { x: -28, y: -26, w: 20, h: 24 }, kind: "neighbour", label: "64" },
      { shape: { x: -6, y: -26, w: 20, h: 24 }, kind: "target", label: "66 — elderly resident" },
      { shape: { x: 16, y: -26, w: 20, h: 24 }, kind: "neighbour", label: "68" },
      { shape: { x: 38, y: -26, w: 20, h: 24 }, kind: "neighbour", label: "70" },
    ],
    roads: [
      { shape: { x: -60, y: 2, w: 120, h: 2 }, kind: "pavement" },
      { shape: { x: -60, y: 4, w: 120, h: 11 }, kind: "road", label: "Ormskirk Road" },
      { shape: { x: -60, y: 15, w: 120, h: 2 }, kind: "pavement" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.5461, lng: -2.6549 }, street: "Ormskirk Road" }],
    landmarks: [
      { pos: { x: -36, y: 9 }, kind: "car" },
      { pos: { x: 4, y: 9 }, kind: "car" },
      { pos: { x: 30, y: 9 }, kind: "car" },
      { pos: { x: -48, y: 20 }, kind: "lamppost" },
      { pos: { x: 44, y: 20 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "leak-point",
        pos: { x: -2, y: 2 },
        kind: "gas",
        label: "Hissing at pavement level — believed leak point",
        knownFromPri: true,
      },
      {
        id: "ignition",
        pos: { x: 12, y: 8 },
        kind: "electrical",
        label: "Any ignition source — doorbells, switches, a vehicle starting in the cordon",
        knownFromPri: true,
      },
      {
        id: "cellars",
        pos: { x: -6, y: -14 },
        kind: "structural",
        label: "Cellars in this row — gas tracks into them rather than dispersing",
        discoverAfterMinOnScene: 3,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Ormskirk Road frontage", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Towards no. 70", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear entries", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Towards no. 62", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "caller-first",
      atSec: 5,
      text: "There's a really strong smell of gas out on the street here. It's not just me, three or four of us have come out. You can hear it hissing somewhere near the kerb.",
      tone: "urgent",
    },
    {
      id: "no66",
      atSec: 60,
      text: "The lady at 66's still inside — she's ninety-odd and she doesn't move quick. Do you want us to get her out? I don't want to be ringing her doorbell if there's gas about.",
      tone: "urgent",
    },
    {
      id: "gas-board-eta",
      atSec: 190,
      probability: 0.8,
      text: "Somebody's got through to the gas people. They're saying within the hour. It's still hissing and it's if anything worse than it was.",
      tone: "info",
    },
    {
      id: "cellar",
      atSec: 300,
      probability: 0.4,
      text: "The fella at 64 says he can smell it in his cellar now, and he's stood in the street with us. It's got in under the houses.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],
};
