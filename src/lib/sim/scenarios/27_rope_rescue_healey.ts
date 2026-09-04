import type { Scenario } from "../incident_types";

// Scenario 27 — walker fallen down a quarry face, Healey Dell.
//
// A specialist rescue where the specialist resource is a long way away and
// the ordinary resources cannot substitute for it. Three pumps standing at
// the top of a quarry are three pumps standing at the top of a quarry —
// what this needs is a line rescue team, and the operator's decision is to
// order that immediately rather than after the first crew confirms what
// the caller already told them.
//
// The second problem is finding him. "Healey Dell" is several square
// kilometres of wooded clough with three access points, and picking the
// wrong one costs twenty minutes on foot. The caller can see him but
// cannot describe where they are.
//
// FICTIONAL: the walker and his friend. Healey Dell is a real nature
// reserve above Rochdale; the incident is not.

export const scenario27: Scenario = {
  id: "27",
  slug: "27_rope_rescue_healey",
  title: "Rescue from height — Healey Dell, Rochdale",
  type: "special_service_rope_rescue",
  patch: "Eastern",
  severity: "high",
  trigger:
    "Male fallen approximately 12 metres down a disused quarry face. Conscious, friend at the top with him. Access on foot only",

  location: {
    address: "Disused quarry face, Healey Dell nature reserve, Rochdale",
    postcode: "OL12 6BG",
    coords: { lat: 53.6501, lng: -2.1798 },
  },

  property: {
    class: "Wooded clough and disused quarry — nature reserve, no vehicular access to the face",
    occupants: "Two walkers. One fallen, one at the top",
    vulnerabilities: [
      "Casualty is on a ledge with a further drop below him",
      "Access on foot only — the nearest an appliance gets is the reserve car park, then roughly 800 m of path",
      "Light is going and the clough is under tree cover",
    ],
    access:
      "Three ways into the reserve and only one of them is right. Nearest vehicle point is the Broadley car park, then on foot",
    knownHazards: [
      "Loose quarry face above and below the casualty",
      "Further drop beneath the ledge he is on",
      "Steep, wet, wooded ground for the carry out",
    ],
    firstDueStationId: "G30",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — open ground.",
      "Line rescue is a specialist resource and is not on any pump. Ordering it late is the whole failure mode of this incident.",
      "Three access points to the reserve; the Broadley car park is the right one for the quarry face.",
    ],
  },

  methane: {
    M: "No",
    E: "Disused quarry face, Healey Dell, Rochdale, OL12 6BG",
    T: "Male fallen approximately 12 m down a quarry face, conscious, on a ledge",
    H: "Loose face above and below; further drop beneath the ledge; steep wet ground",
    A: "Broadley car park then approximately 800 m on foot — no vehicular access to the face",
    N: "One — male, conscious, friend with him at the top",
    emergencyServices: "Fire with line rescue; ambulance; HEMS if the carry is long",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: [],
      preferredStationId: "G30",
      notes: "First pump to locate and hold. They cannot bring him up and should not try",
    },
    {
      id: "line",
      label: "Line rescue",
      service: "Fire",
      requiredApplianceTypes: ["TRU_pump", "TRU_van"],
      requiredCapabilities: ["Rope"],
      notes:
        "Order it now. It is a long way away and nothing on the first attendance can do its job",
    },
    {
      id: "officer",
      label: "Station Manager",
      service: "Fire",
      requiredApplianceTypes: ["FIRE_SM"],
      requiredCapabilities: ["Command"],
      notes: "Technical rescue at height, in failing light, with a long carry",
    },
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      notes: "At the car park. They are not getting to him either until he comes up",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      {
        metric: "Specialist resource",
        target: "line rescue ordered on the initial attendance, not after confirmation",
      },
      {
        metric: "Access point",
        target: "crews sent to the Broadley car park — the wrong entrance costs twenty minutes on foot",
      },
      { metric: "Proportionate response", target: "no additional pumps — they cannot help" },
    ],
    lesson:
      "Sending more of what cannot help is the failure here. Three pumps at the top of a quarry are three pumps at the top of a quarry. The one resource that matters is a long way off, so it goes on the initial attendance — you order it on what the caller has told you, not after a crew has stood there and confirmed it. And get the access point right first time: on foot, in a wooded clough, the wrong gate is twenty minutes you cannot get back.",
  },

  scene: {
    viewBox: { x: -60, y: -50, width: 120, height: 100 },
    compassNorth: "up",
    buildings: [],
    roads: [
      { shape: { x: -56, y: 30, w: 30, h: 14 }, kind: "driveway", label: "Broadley car park" },
      { shape: { x: -30, y: 34, w: 86, h: 6 }, kind: "road", label: "Access road" },
      { shape: { x: -26, y: -10, w: 4, h: 44 }, kind: "pavement", label: "Footpath — 800 m" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -46, y: 36 }, kind: "car" },
      { pos: { x: -38, y: 36 }, kind: "car" },
    ],
    hazards: [
      {
        id: "loose-face",
        pos: { x: 4, y: -26 },
        kind: "structural",
        label: "Loose quarry face above and below the casualty",
        knownFromPri: true,
      },
      {
        id: "further-drop",
        pos: { x: 6, y: -14 },
        kind: "structural",
        label: "Further drop beneath the ledge he is on",
        knownFromPri: true,
      },
      {
        id: "carry-out",
        pos: { x: -14, y: 6 },
        kind: "structural",
        label: "Steep wet wooded ground — the carry out is longer than the rescue",
        discoverAfterMinOnScene: 5,
      },
    ],
    casualties: [
      {
        id: "cas-27-walker",
        label: "Male — on a ledge approximately 12 m down",
        pos: { x: 4, y: -20 },
        severity: "serious",
        discoverAfterMinBa: 4,
        clinical: {
          // A twelve-metre fall onto a ledge, then a long wait in the cold
          // and wet under tree cover. The hypothermia is the part that
          // gets worse while everybody waits for line rescue.
          vitals: { rr: 24, spo2: 94, hr: 112, bpSys: 102, bpDia: 64, gcs: 14, temp: 34.6, bm: 5.0 },
          presumedCondition: "Fall from height — lower limb injury, prolonged exposure on the ledge",
          redFlags: ["spinal_injury_suspected", "hypovolaemic_shock"],
          // Twelve metres meets the trauma criteria on mechanism alone.
          preferredDestination: "mtc",
          criticalInterventions: ["oxygen", "iv_access", "fluids", "spine_board", "warming"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Top of the face", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Downstream", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Quarry floor", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Footpath / car park", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "friend-first",
      atSec: 6,
      text: "My mate's gone over the edge of the quarry. He's on a bit of a ledge about — I don't know, forty foot down? He's talking to me but he says his leg's bad and he can't move. There's more of a drop underneath him.",
      tone: "critical",
    },
    {
      id: "where",
      atSec: 55,
      text: "I don't know how to tell you where we are. We're in the woods, there's a viaduct thing back that way. We came in past a car park but I couldn't tell you which one.",
      tone: "urgent",
    },
    {
      id: "light",
      atSec: 200,
      probability: 0.8,
      text: "It's getting dark down here under the trees. I've got my phone torch on him but the battery's going.",
      tone: "urgent",
    },
    {
      id: "moving",
      atSec: 340,
      probability: 0.4,
      text: "He's trying to shift himself and stuff's coming loose under him. I've shouted at him to stay still. He's not answering me as much now.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],
};
