import type { Scenario } from "../incident_types";

// Scenario 13 — elderly faller, Withington. Category 3.
//
// The commonest ambulance job in the country, and the one nothing in this
// sim expressed until now. Every other scenario here is a set-piece where
// the answer is "send everything quickly". This one's answer is that it
// WAITS, and the operator has to sit on it while higher categories keep
// landing.
//
// That is the whole design. A C3 has a ninety-minute target at the 90th
// centile, so holding it is correct — but the person on the floor is 81,
// she has been there since she fell, and the longer she lies the worse
// the outcome gets whatever the category says. Long lies cause pressure
// injuries, rhabdomyolysis and hypothermia; that is why "she is not
// injured" and "this can wait indefinitely" are different statements.
//
// The operator can hand this to the first crew that arrives and never
// think about it again, which is often the right call. The point is that
// it is a call.
//
// FICTIONAL: Mrs Ashworth, her neighbour, the house number and the
// keysafe code. Wilmslow Road and Burton Road are real Withington
// streets; the specific address is not. First-due A-CEN is real from
// nwas_stations.json.

export const scenario13: Scenario = {
  id: "13",
  slug: "13_fall_elderly_withington",
  title: "Fall — elderly female, Withington",
  type: "ambulance_fall_elderly",
  patch: "Southern",
  severity: "moderate",
  trigger:
    "Category 3 — 81-year-old female, fallen at home, conscious and breathing, no obvious injury. Neighbour called; unable to lift her",

  location: {
    address: "26 Burton Road, Withington, Manchester",
    postcode: "M20 3EB",
    coords: { lat: 53.4322, lng: -2.2295 },
  },

  property: {
    class: "Terraced house — two up two down, single occupancy",
    occupants:
      "One — Mrs Doreen Ashworth, 81, lives alone. Neighbour has a key and is on scene",
    vulnerabilities: [
      "Lives alone; daughter is in Leeds and has been rung",
      "On the floor since she fell — she is not sure how long, and that matters more than the category does",
    ],
    access:
      "Front door onto Burton Road. Neighbour at no. 28 holds a key and is waiting at the door. Keysafe by the meter box if she is not",
    knownHazards: [
      "Narrow hallway and a tight stair — no room to work a carry chair at the foot of the stairs",
      "Loose rug at the hall/kitchen threshold, which is probably what did it",
    ],
    firstDueStationId: "A-CEN",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — a private dwelling.",
      "Flagged on the ambulance system as a previous faller: two calls in the last eight months, neither conveyed.",
      "Keysafe fitted at the request of the falls team.",
    ],
  },

  methane: {
    M: "No",
    E: "26 Burton Road, Withington, M20 3EB",
    T: "Fall at home — one patient on the floor, conscious and talking",
    H: "None on scene. Narrow hallway restricts working space",
    A: "Front door; neighbour holding a key. On-street parking, terraced row",
    N: "One — female, 81. Conscious, breathing, denies injury",
    emergencyServices: "Ambulance only at this time",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-CEN",
      notes:
        "Category 3 — one double-crewed ambulance. No RRV: a solo responder cannot lift her, and sending one only starts a clock somebody else has to finish",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 3 minutes" },
      { metric: "C3 response", target: "on scene inside 120 minutes" },
      {
        metric: "Proportionate response",
        target: "no RRV committed — a solo responder cannot lift her",
      },
      {
        metric: "Long lie",
        target: "recognised: this is not the same as an uninjured patient who can wait",
      },
    ],
    lesson:
      "A category is a target, not a diagnosis. Holding a C3 while C1s land is exactly right and you will do it all shift — but a long lie is its own injury, and the clock the category gives you is not the clock she is on. If you are going to hold it, hold it knowingly.",
  },

  // Small scene. She is in the hallway; the work is space, not fire.
  scene: {
    viewBox: { x: -40, y: -30, width: 80, height: 60 },
    compassNorth: "up",
    // What this building will not take. Prose above; a locked option
    // with its reason on it here.
    egressBlocked: [
      { action: "carry_chair", reason: "No room to work a carry chair at the foot of that stair — the neighbour said as much on the phone" },
      { action: "trolley", reason: "Narrow hallway — the trolley comes no further than the front door" },
    ],
    buildings: [
      { shape: { x: -8, y: -20, w: 16, h: 26 }, kind: "target", label: "No. 26" },
      { shape: { x: -26, y: -20, w: 16, h: 26 }, kind: "neighbour", label: "No. 24" },
      { shape: { x: 10, y: -20, w: 16, h: 26 }, kind: "neighbour", label: "No. 28 — keyholder" },
    ],
    roads: [
      { shape: { x: -40, y: 10, w: 80, h: 2 }, kind: "pavement" },
      { shape: { x: -40, y: 12, w: 80, h: 9 }, kind: "road", label: "Burton Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -20, y: 16 }, kind: "car" },
      { pos: { x: 6, y: 16 }, kind: "car" },
      { pos: { x: 22, y: 16 }, kind: "car" },
      { pos: { x: -34, y: 8 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "narrow-hall",
        pos: { x: 0, y: -8 },
        kind: "structural",
        label: "Narrow hallway — no room for a carry chair at the stair foot",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-13-ashworth",
        label: "Female, 81 — on the hallway floor",
        pos: { x: -2, y: -6 },
        // Conscious, talking, not trapped. The problem is that she cannot
        // get up and has been down an unknown time, not that she is badly
        // hurt — and a long lie is its own injury whatever this says.
        severity: "walking",
        // She is in the hallway with the neighbour standing over her.
        // Nobody has to search for her.
        discoverAfterMinBa: 0,
        clinical: {
          // The observations of a long lie rather than an injury: cold,
          // slightly dry, a bit tachycardic. Nothing here is dramatic and
          // that is exactly why she keeps getting left.
          vitals: { rr: 18, spo2: 95, hr: 96, bpSys: 112, bpDia: 68, gcs: 15, temp: 35.4, bm: 5.1 },
          presumedCondition: "Fall with a prolonged lie — cold, no obvious injury, unable to self-rise",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          // The only thing to do for her, and the whole reason a long lie
          // is its own injury rather than a delay.
          criticalInterventions: ["warming"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Front / Burton Road", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 28 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear yard", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 24 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "neighbour-first",
      atSec: 5,
      text: "It's the lady next door, Doreen — she's on the floor in her hall. I've got a key so I've let myself in. She's talking to me, she just can't get up. I've tried but I can't lift her on my own.",
      tone: "info",
    },
    {
      id: "how-long",
      atSec: 50,
      text: "She says she's been down a while. I don't think she knows how long, love — she went to put the bin out after her programme and that finished at half eight.",
      tone: "info",
    },
    {
      id: "no-injury",
      atSec: 120,
      probability: 0.75,
      suppressesIds: ["hip-pain"],
      text: "She says nothing hurts, she's just cold and a bit embarrassed. I've put a blanket over her. She's chatting away as normal.",
      tone: "info",
    },
    {
      id: "hip-pain",
      atSec: 120,
      suppressesIds: ["no-injury"],
      text: "She's started saying her hip's hurting now she's tried to move. Her leg looks a funny way round to me — turned out, sort of. She's gone very quiet.",
      tone: "urgent",
    },
    {
      id: "still-waiting",
      atSec: 900,
      probability: 0.85,
      text: "Sorry to ring again — is anybody coming? She's still on the floor and she's shivering now. I've put the heating on.",
      tone: "urgent",
    },
  ],
};
