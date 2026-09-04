import type { Scenario } from "../incident_types";

// Scenario 29 — imminent birth at home, Wythenshawe.
//
// The only job in the sim with a deadline nobody set. It is not a target
// or a policy window: the baby comes when it comes, and every other clock
// in the building is irrelevant to that.
//
// What makes it a control-room problem rather than a clinical one is that
// the right answer changes as it goes. Early on, this is a transport job
// — get her to the unit. Once the head is visible it is not a transport
// job at all, it is a birth in a front room, and the resource that
// matters becomes a second crew for the baby rather than a faster ride
// for the mother. An operator who keeps pushing for a hospital when the
// crew is telling them otherwise is solving yesterday's problem.
//
// FICTIONAL: the family and the address. Brownley Road is a real
// Wythenshawe road; the house is not. A-SHA is real from
// nwas_stations.json.

export const scenario29: Scenario = {
  id: "29",
  slug: "29_maternity_wythenshawe",
  title: "Imminent birth — Brownley Road, Wythenshawe",
  type: "ambulance_maternity",
  patch: "Southern",
  severity: "high",
  trigger:
    "39 weeks, contractions two minutes apart, waters gone. Partner says she is pushing. First baby, no complications recorded",

  location: {
    address: "74 Brownley Road, Wythenshawe, Manchester",
    postcode: "M22 4PU",
    coords: { lat: 53.3903, lng: -2.2634 },
  },

  property: {
    class: "Semi-detached house — patient in the front room downstairs",
    occupants: "Three — the patient, her partner, and her mother",
    vulnerabilities: [
      "First baby, at home, not planned as a home birth",
      "Front room is small and the sofa is against the wall — poor access all round the patient",
    ],
    access: "Front door onto Brownley Road, driveway. Partner watching for the ambulance",
    knownHazards: ["None"],
    firstDueStationId: "A-SHA",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "Booked at Wythenshawe. Midwifery unit aware and expecting her.",
      "No complications recorded in the pregnancy.",
    ],
  },

  methane: {
    M: "No",
    E: "74 Brownley Road, Wythenshawe, M22 4PU",
    T: "Imminent birth — 39 weeks, contractions two minutes apart, patient pushing",
    H: "None. Restricted working space in the front room",
    A: "Front door and driveway; partner watching out for the crew",
    N: "One patient, one baby imminent",
    emergencyServices: "Ambulance only",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-SHA",
      notes: "The crew who will either drive her or deliver the baby, depending on what they find",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "Response", target: "on scene inside 18 minutes" },
      {
        metric: "Second crew",
        target: "ordered once birth is imminent — a baby is a second patient",
      },
      {
        metric: "Changing the plan",
        target: "transport abandoned once the crew report the head is visible",
      },
    ],
    lesson:
      "The deadline on this one was not set by a policy and will not wait for you. And the right answer changes while you are working it: early on this is a ride to the midwifery unit, and the moment the crew say the head is visible it stops being a transport job and becomes a delivery with two patients in it. Send a second crew when that happens, and stop trying to solve the problem you had ten minutes ago.",
  },

  scene: {
    viewBox: { x: -40, y: -32, width: 80, height: 64 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -12, y: -24, w: 22, h: 24 }, kind: "target", label: "No. 74" },
      { shape: { x: 12, y: -24, w: 20, h: 24 }, kind: "neighbour", label: "No. 76" },
      { shape: { x: -36, y: -24, w: 20, h: 24 }, kind: "neighbour", label: "No. 72" },
    ],
    roads: [
      { shape: { x: -6, y: 0, w: 9, h: 12 }, kind: "driveway", label: "Drive" },
      { shape: { x: -40, y: 12, w: 80, h: 2 }, kind: "pavement" },
      { shape: { x: -40, y: 14, w: 80, h: 10 }, kind: "road", label: "Brownley Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -2, y: 5 }, kind: "car" },
      { pos: { x: -28, y: 18 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "space",
        pos: { x: -4, y: -14 },
        kind: "structural",
        label: "Front room — sofa against the wall, restricted access around the patient",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-29-mother",
        label: "Female, 27 — 39 weeks, second stage",
        pos: { x: -4, y: -13 },
        severity: "serious",
        discoverAfterMinBa: 0,
        clinical: {
          // Second stage of labour. Tachycardic and breathing hard because
          // she is pushing, not because anything is wrong.
          vitals: { rr: 24, spo2: 98, hr: 108, bpSys: 126, bpDia: 74, gcs: 15, temp: 37.2, bm: 5.8 },
          presumedCondition: "Second stage of labour — 39 weeks, imminent delivery",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          // Once the head is visible she is not going anywhere, and the
          // job stops being a journey and becomes a delivery.
          criticalInterventions: ["assisted_delivery", "oxygen"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Brownley Road / drive", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 76 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear garden", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 72 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "partner-first",
      atSec: 5,
      text: "My partner's in labour — she's 39 weeks and her waters went about an hour ago. The pains are coming every couple of minutes now. She's saying she needs to push. It's our first.",
      tone: "critical",
    },
    {
      id: "mother-here",
      atSec: 45,
      text: "Her mum's here with her. She's had three herself and she reckons it's coming. Do I need to be doing something? I don't know what I'm doing here.",
      tone: "urgent",
    },
    {
      id: "crowning",
      atSec: 165,
      probability: 0.6,
      suppressesIds: ["holding-on"],
      text: "Her mum says she can see the head. It's coming now. She's not getting in any ambulance, it's happening here.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "holding-on",
      atSec: 165,
      suppressesIds: ["crowning"],
      text: "The pains have eased off a bit and she's got her breath back. Her mum reckons there's a while in it yet. She wants to get to the hospital.",
      tone: "urgent",
    },
    {
      id: "baby-here",
      atSec: 330,
      probability: 0.85,
      requiresFiredIds: ["crowning"],
      text: "The baby's here. Your crew arrived just in time. They're asking for another ambulance — something about the baby needing its own.",
      tone: "urgent",
    },
  ],
};
