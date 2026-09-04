import type { Scenario } from "../incident_types";

// Scenario 37 — child choking, Cheadle.
//
// The shortest job in the sim and the one with the least room in it. A
// choking either clears in the next two minutes or it becomes a cardiac
// arrest, and nothing the operator sends will arrive inside those two
// minutes. What decides it is the person already in the room.
//
// So this is the job where the CALL is the intervention. The nearest
// resource still goes, immediately and without deliberation, but the
// operator is not really dispatching — they are keeping a frightened
// grandmother on the line and telling her what to do with her hands.
//
// It is also the sharpest test of the "nearest, now" instinct. Anything
// with a clinician in it, whatever it is, whoever it belongs to.
//
// FICTIONAL: the child and her grandmother. Cheadle village is real; the
// house is not.

export const scenario37: Scenario = {
  id: "37",
  slug: "37_choking_cheadle",
  title: "Child choking — Cheadle",
  type: "ambulance_choking",
  patch: "Southern",
  severity: "high",
  trigger:
    "Category 1 — child of three choking, coughing weakly, grandmother on the line. Back blows started under instruction",

  location: {
    address: "9 Ashfield Grove, Cheadle, Stockport",
    postcode: "SK8 1BL",
    coords: { lat: 53.3924, lng: -2.2137 },
  },

  property: {
    class: "Semi-detached house — child in the kitchen",
    occupants: "Two — the child and her grandmother",
    vulnerabilities: [
      "Three years old; the margin between coughing and not breathing is very short",
      "Grandmother is alone with her and is the only intervention available in the next two minutes",
    ],
    access: "Front door, driveway. Front door on the latch at the call taker's request",
    knownHazards: ["None"],
    firstDueStationId: "A-CHE",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "The call is the intervention here. Nothing dispatched arrives inside the window that decides it.",
      "Nearest clinical resource of any kind, immediately — this is not a job for waiting on the right vehicle.",
    ],
  },

  methane: {
    M: "No",
    E: "9 Ashfield Grove, Cheadle, SK8 1BL",
    T: "Child choking — three years old, weak cough, partially obstructed",
    H: "None",
    A: "Front door on the latch; driveway",
    N: "One — female child, three",
    emergencyServices: "Ambulance only",
  },

  pda: [
    {
      id: "rrv1",
      label: "Rapid response vehicle",
      service: "Ambulance",
      requiredApplianceTypes: ["RRV"],
      requiredCapabilities: [],
      preferredStationId: "A-CHE",
      notes: "Whatever is nearest with a clinician in it. Do not deliberate about vehicle type",
    },
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-CHE",
      notes: "Because if this does not clear, she needs taking, and quickly",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 60 seconds — nothing to weigh up" },
      { metric: "C1 response", target: "first clinician on scene inside 15 minutes" },
      {
        metric: "Nearest resource",
        target: "sent immediately, whatever type it is",
      },
      {
        metric: "The call",
        target: "caller kept on the line and instructed — she is the only help in the room",
      },
    ],
    lesson:
      "Nothing you send will arrive inside the two minutes that decide this. The grandmother is the intervention and the call taker is the one directing her, so the dispatch decision is simply: nearest thing with a clinician, now, and an ambulance behind it. This is the job where deliberating about which vehicle is the wrong instinct entirely.",
  },

  scene: {
    viewBox: { x: -35, y: -28, width: 70, height: 56 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -11, y: -20, w: 22, h: 20 }, kind: "target", label: "No. 9" },
      { shape: { x: 13, y: -20, w: 20, h: 20 }, kind: "neighbour", label: "No. 11" },
      { shape: { x: -33, y: -20, w: 20, h: 20 }, kind: "neighbour", label: "No. 7" },
    ],
    roads: [
      { shape: { x: -5, y: 0, w: 9, h: 10 }, kind: "driveway", label: "Drive" },
      { shape: { x: -35, y: 10, w: 70, h: 2 }, kind: "pavement" },
      { shape: { x: -35, y: 12, w: 70, h: 9 }, kind: "road", label: "Ashfield Grove" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -1, y: 4 }, kind: "car" },
      { pos: { x: -26, y: 16 }, kind: "lamppost" },
    ],
    hazards: [],
    casualties: [
      {
        id: "cas-37-child",
        label: "Female child, 3 — partially obstructed airway",
        pos: { x: -2, y: -12 },
        severity: "critical",
        discoverAfterMinBa: 0,
        clinical: {
          // Three years old: paediatric numbers, not adult ones. A heart
          // rate of 150 is normal for her and would be alarming in a man
          // of fifty.
          vitals: { rr: 38, spo2: 86, hr: 150, bpSys: 92, bpDia: 56, gcs: 14, temp: 37.1, bm: 5.2 },
          presumedCondition: "Partial airway obstruction — foreign body, weak ineffective cough",
          redFlags: ["airway_compromise"],
          preferredDestination: "paed_ed",
          criticalInterventions: ["oxygen"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Ashfield Grove / drive", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 11 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear garden", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 7 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "gran-first",
      atSec: 3,
      text: "She's choking — my granddaughter, she's three, she's got something stuck. She's going red and she's coughing but nothing's coming up. Please help me, I don't know what to do.",
      tone: "critical",
    },
    {
      id: "instructed",
      atSec: 30,
      text: "Right — I've got her over my arm like you said. I'm doing it between her shoulders. She's still coughing.",
      tone: "critical",
    },
    {
      id: "cleared",
      atSec: 95,
      probability: 0.7,
      suppressesIds: ["not-cleared"],
      text: "It's come up! It's come out — she's crying, she's really crying. Oh, thank God. She's breathing, she's just upset.",
      tone: "info",
    },
    {
      id: "not-cleared",
      atSec: 95,
      suppressesIds: ["cleared"],
      text: "She's stopped coughing and she's gone floppy on me. She's not making any noise at all now. Please tell me what to do.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],
};
