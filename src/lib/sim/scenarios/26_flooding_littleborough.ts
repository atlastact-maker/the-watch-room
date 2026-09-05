import type { Scenario } from "../incident_types";

// Scenario 26 — flooding of homes, Littleborough.
//
// No fire, no casualty, no clock — and an incident that will run all
// shift and eat every pump you give it. Flooding is the job that breaks
// an operator's instinct to resolve things, because there is nothing to
// resolve: the water goes down when the rain stops.
//
// So the decisions are triage and endurance. Which properties get a pump
// and which get told to go upstairs. Whether to commit the high-volume
// pump, which is a force asset that then is not available anywhere else
// for hours. When to stop pumping out a cellar that is refilling from the
// ground faster than you can empty it.
//
// The right answer is often to do less than the callers want, which is a
// hard thing to hold on the phone.
//
// FICTIONAL: the households and the numbers. Littleborough and the
// Rochdale Canal are real; these properties are not.

export const scenario26: Scenario = {
  id: "26",
  slug: "26_flooding_littleborough",
  title: "Flooding — homes on Canal Street, Littleborough",
  type: "special_service_flooding",
  patch: "Eastern",
  severity: "high",
  trigger:
    "Water entering ground floors of a terrace after prolonged rain. Multiple callers. One elderly resident refusing to leave",

  location: {
    address: "Canal Street, Littleborough, Rochdale",
    postcode: "OL15 8AA",
    coords: { lat: 53.6449, lng: -2.0968 },
  },

  property: {
    class: "Terraced housing beside a watercourse — around fourteen properties affected",
    occupants:
      "Occupied. Most residents upstairs or out with family. One elderly resident at no. 9 will not leave",
    vulnerabilities: [
      "Elderly resident refusing to leave a property with water in the ground floor",
      "Cellars filling from the ground — pumping them out achieves nothing while the level is up",
      "Electricity still on in several properties with water at socket height",
    ],
    access:
      "Canal Street from the main road, but the far end is impassable to an appliance. Approach from the north end only",
    knownHazards: [
      "Standing water of unknown depth over unknown ground — covers, kerbs, a culvert",
      "Live electrics at socket height",
      "Contaminated water — foul drainage surcharging",
    ],
    firstDueStationId: "G31",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — residential street.",
      "Known flood-risk street; has flooded twice in the last decade per the local knowledge file.",
      "High-volume pump is a force asset. Committing it here means it is not available anywhere else for the rest of the shift.",
    ],
  },

  methane: {
    M: "No",
    E: "Canal Street, Littleborough, OL15 8AA",
    T: "Flooding — water entering ground floors of around fourteen terraced properties",
    H: "Standing water over unknown ground; live electrics; contaminated water",
    A: "North end of Canal Street only — the far end is impassable",
    N: "None injured. One elderly resident refusing to leave no. 9",
    emergencyServices: "Fire; local authority and the water company both have an interest",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: [],
      preferredStationId: "G31",
      notes: "First pump — assessment and the resident at no. 9 before any pumping starts",
    },
    {
      id: "pump2",
      label: "Pump 2",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: [],
      notes: "Light portable pumps and the door-to-door. Fourteen properties is a lot of doors",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "First attendance", target: "< 12 minutes" },
      {
        metric: "Triage",
        target: "life risk at no. 9 addressed before any property is pumped",
      },
      {
        metric: "Force assets",
        target: "high-volume pump committed only if it will change the outcome",
      },
    ],
    lesson:
      "There is nothing here to put out and nothing that ends because you did something well. The water goes down when the rain stops. Your decisions are triage — the resident who will not leave comes before anybody's carpet — and endurance, because a high-volume pump committed here is a force asset that is not available anywhere else tonight. Doing less than the callers want is often the right answer, and it is a hard one to hold on the phone.",
  },

  scene: {
    viewBox: { x: -70, y: -40, width: 140, height: 80 },
    compassNorth: "up",
    // Wading out over ground nobody can see.
    egressExtraSeconds: 240,
    // What this building will not take. Prose above; a locked option
    // with its reason on it here.
    egressBlocked: [
      { action: "trolley", reason: "Standing water of unknown depth over unknown ground — nothing on wheels goes down Canal Street" },
      { action: "wheelchair", reason: "Standing water over kerbs, covers and a culvert. Wheels find the hole first" },
    ],
    buildings: [
      { shape: { x: -60, y: -28, w: 18, h: 20 }, kind: "neighbour", label: "1–5" },
      { shape: { x: -40, y: -28, w: 18, h: 20 }, kind: "neighbour", label: "7" },
      { shape: { x: -20, y: -28, w: 18, h: 20 }, kind: "target", label: "9 — resident refusing" },
      { shape: { x: 0, y: -28, w: 18, h: 20 }, kind: "neighbour", label: "11–15" },
      { shape: { x: 20, y: -28, w: 18, h: 20 }, kind: "neighbour", label: "17–21" },
      { shape: { x: 40, y: -28, w: 18, h: 20 }, kind: "neighbour", label: "23–27" },
    ],
    roads: [
      { shape: { x: -70, y: -6, w: 140, h: 12 }, kind: "road", label: "Canal Street — flooded" },
      { shape: { x: -70, y: 8, w: 140, h: 10 }, kind: "driveway", label: "Watercourse" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.6455, lng: -2.0978 }, street: "Canal Street north" }],
    landmarks: [
      { pos: { x: -52, y: 0 }, kind: "car" },
      { pos: { x: 8, y: 0 }, kind: "car" },
      { pos: { x: -64, y: 12 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "unknown-depth",
        pos: { x: 10, y: 0 },
        kind: "structural",
        label: "Standing water of unknown depth — covers, kerbs and a culvert beneath",
        knownFromPri: true,
      },
      {
        id: "live-electrics",
        pos: { x: -18, y: -20 },
        kind: "electrical",
        label: "Electricity still on with water at socket height",
        knownFromPri: true,
      },
      {
        id: "foul-water",
        pos: { x: 30, y: 0 },
        kind: "chemical",
        label: "Foul drainage surcharging — contaminated water",
        discoverAfterMinOnScene: 3,
      },
      {
        id: "far-end",
        pos: { x: 56, y: 0 },
        kind: "structural",
        label: "Far end of the street impassable to an appliance",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-26-no9",
        label: "Elderly resident, no. 9 — refusing to leave",
        pos: { x: -13, y: -18 },
        severity: "walking",
        discoverAfterMinBa: 0,
        clinical: {
          // Not injured. Cold, stubborn, and standing in water — which is
          // a life risk rather than a clinical one, and the reason he
          // comes before anybody's carpet.
          vitals: { rr: 18, spo2: 96, hr: 88, bpSys: 138, bpDia: 82, gcs: 15, temp: 35.1, bm: 5.4 },
          ageYears: 79,
          presumedCondition: "Cold and immersed to the ankles — refusing to leave the property",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          // Once he does come out, this is the whole of his treatment.
          criticalInterventions: ["warming"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · North end / access", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Far end", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Watercourse", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Terrace frontage", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "resident-first",
      atSec: 6,
      text: "The water's coming in the front door. It's up over the step and it's across the whole street — you can't tell where the kerb is any more. There's about a dozen houses of us down here.",
      tone: "urgent",
    },
    {
      id: "no9",
      atSec: 60,
      text: "The old chap at number nine won't come out. He's stood in his hallway with water round his ankles saying he's not leaving the house. He's on his own.",
      tone: "critical",
    },
    {
      id: "electrics",
      atSec: 140,
      probability: 0.8,
      text: "Somebody's said their sockets are under. Nobody's turned the electric off — I wouldn't know how to get at the box with water in there.",
      tone: "urgent",
    },
    {
      id: "cellar",
      atSec: 320,
      probability: 0.7,
      text: "They're asking if you'll pump their cellars out. I've told them yours are busy but they keep asking. It's filling back up as fast as it goes down anyway from what I can see.",
      tone: "info",
    },
    {
      id: "still-raining",
      atSec: 600,
      probability: 0.75,
      text: "It's still hammering down. It's not going anywhere while this keeps up.",
      tone: "info",
    },
  ],
};
