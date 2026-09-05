import type { Scenario } from "../incident_types";

// Scenario 32 — anaphylaxis in a restaurant, Altrincham.
//
// The only ambulance job in the sim where an RRV is the RIGHT first
// answer rather than a compromise. What she needs in the next four
// minutes is adrenaline, not a ride, and a solo responder carries
// adrenaline. Waiting for a DCA because "she'll need transport" is
// solving the second problem before the first.
//
// So it is both: something with a clinician now, and something that can
// take her after. Sending only the DCA is slower to the thing that keeps
// her alive; sending only the RRV strands the crew with a patient they
// cannot move.
//
// FICTIONAL: the diner, her friend and the restaurant. Goose Green in
// Altrincham is real; the premises is not.

export const scenario32: Scenario = {
  id: "32",
  slug: "32_anaphylaxis_altrincham",
  title: "Anaphylaxis — restaurant, Altrincham",
  type: "ambulance_anaphylaxis",
  patch: "Southern",
  severity: "high",
  trigger:
    "Category 1 — female late twenties, known nut allergy, collapsed in a restaurant. Lips and tongue swelling, wheezing. Own auto-injector used once",

  location: {
    address: "Goose Green, Altrincham",
    postcode: "WA14 1DW",
    coords: { lat: 53.3874, lng: -2.3512 },
  },

  property: {
    class: "Restaurant — small dining room over two floors, patient on the ground floor",
    occupants: "Busy — approximately forty covers. Staff clearing a path",
    vulnerabilities: [
      "One auto-injector already used; a second dose may be needed before an ambulance can arrive",
      "Goose Green is pedestrianised — the nearest a vehicle gets is the top of the lane",
    ],
    access:
      "Pedestrianised. Vehicle access from the top of the lane only, then roughly 60 m on foot with a bag",
    knownHazards: ["Crowded dining room; a carry out through tables"],
    firstDueStationId: "A-ALT",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — commercial premises.",
      "Known severe nut allergy on the ambulance record; carries her own auto-injector.",
      "Pedestrianised street — vehicle to the top of the lane, then on foot.",
    ],
  },

  methane: {
    M: "No",
    E: "Goose Green, Altrincham, WA14 1DW",
    T: "Anaphylaxis — airway swelling and wheeze, one auto-injector already given",
    H: "Crowded dining room. Pedestrianised access with a carry out",
    A: "Top of the lane by vehicle, then approximately 60 m on foot",
    N: "One — female, late twenties",
    emergencyServices: "Ambulance only",
  },

  pda: [
    {
      id: "rrv1",
      label: "Rapid response vehicle",
      service: "Ambulance",
      requiredApplianceTypes: ["RRV"],
      requiredCapabilities: [],
      preferredStationId: "A-ALT",
      notes:
        "What she needs in the next four minutes is adrenaline, and an RRV carries it. This is the one job where a solo responder is the right first answer",
    },
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-ALT",
      notes: "And something that can take her afterwards. Both, not either",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "C1 response", target: "first clinician on scene inside 15 minutes" },
      {
        metric: "Nearest clinician",
        target: "RRV sent — the immediate need is a drug, not a vehicle",
      },
      {
        metric: "Transport",
        target: "DCA sent as well — a solo responder cannot move her",
      },
    ],
    lesson:
      "The one job here where a rapid response vehicle is the right answer rather than a compromise. She needs adrenaline in the next few minutes and a solo responder carries it; holding out for an ambulance because she will need transport is solving the second problem first. Send both. And note the street is pedestrianised — the last sixty metres are on foot whatever you send.",
  },

  scene: {
    viewBox: { x: -50, y: -35, width: 100, height: 70 },
    compassNorth: "up",
    // Sixty metres of pedestrianised lane, through forty covers.
    egressExtraSeconds: 180,
    // What this building will not take. Prose above; a locked option
    // with its reason on it here.
    egressBlocked: [
      { action: "trolley", reason: "Pedestrianised, and forty covers between her and the top of the lane — the trolley does not get near" },
    ],
    buildings: [
      { shape: { x: -12, y: -26, w: 24, h: 22 }, kind: "target", label: "Restaurant" },
      { shape: { x: -40, y: -26, w: 26, h: 22 }, kind: "neighbour", label: "Adjoining units" },
      { shape: { x: 14, y: -26, w: 26, h: 22 }, kind: "neighbour", label: "Adjoining units" },
    ],
    roads: [
      { shape: { x: -50, y: -2, w: 100, h: 12 }, kind: "pavement", label: "Goose Green — pedestrianised" },
      { shape: { x: 34, y: 10, w: 16, h: 24 }, kind: "road", label: "Vehicle access — top of the lane" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: 40, y: 22 }, kind: "car" },
      { pos: { x: -30, y: 6 }, kind: "lamppost" },
      { pos: { x: 20, y: 6 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "pedestrianised",
        pos: { x: 20, y: 4 },
        kind: "structural",
        label: "Pedestrianised — approximately 60 m on foot from the nearest vehicle point",
        knownFromPri: true,
      },
      {
        id: "crowded",
        pos: { x: -2, y: -16 },
        kind: "structural",
        label: "Forty covers in a small dining room — carry out through tables",
        discoverAfterMinOnScene: 1,
      },
    ],
    casualties: [
      {
        id: "cas-32-diner",
        label: "Female, late twenties — airway swelling, wheeze",
        pos: { x: -2, y: -15 },
        severity: "critical",
        discoverAfterMinBa: 0,
        clinical: {
          // One auto-injector has already been given and she is rebounding:
          // still tachycardic, still hypotensive, still wheezing.
          vitals: { rr: 30, spo2: 90, hr: 132, bpSys: 84, bpDia: 50, gcs: 14, temp: 36.9, bm: 5.9 },
          ageYears: 28,
          presumedCondition: "Anaphylaxis — airway swelling, wheeze, urticaria, hypotension",
          redFlags: ["anaphylaxis", "airway_compromise"],
          preferredDestination: "nearest_a_e",
          // Adrenaline is the treatment. Everything else supports it.
          criticalInterventions: ["adrenaline_im", "oxygen", "iv_access", "fluids"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Goose Green frontage", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Top of the lane / RVP", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear service", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Adjoining units", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "friend-first",
      atSec: 4,
      text: "My friend's having an allergic reaction — she's got a nut allergy and her lips and tongue have swelled right up. She's wheezing and she's gone blotchy all over. We've used her pen already.",
      tone: "critical",
    },
    {
      id: "one-pen",
      atSec: 45,
      text: "She's only got the one pen with her. It helped for a minute and now she's getting worse again. Should we be doing something else?",
      tone: "critical",
    },
    {
      id: "access",
      atSec: 100,
      probability: 0.85,
      text: "You can't drive down here, it's all pedestrian. If they come to the top of the lane one of the staff will run down and bring them.",
      tone: "info",
    },
    {
      id: "worse",
      atSec: 190,
      probability: 0.5,
      text: "She's struggling to get her breath properly now and she can hardly talk. She's frightened.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],
};
