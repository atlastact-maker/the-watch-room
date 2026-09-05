import type { Scenario } from "../incident_types";

// Scenario 35 — assault outside licensed premises, Ashton-under-Lyne.
//
// The scene-safety job. There is an injured man on the pavement and the
// people who assaulted him have not gone far, and an ambulance crew who
// arrive first are two more people in the middle of it.
//
// So the sequence matters more than the speed. Police first and the
// ambulance staged nearby — not sent away, staged, because the moment it
// is safe they need to be seconds away rather than minutes. An operator
// who sends the DCA straight in has not saved any time; they have
// created a second incident.
//
// The counterpoint to scenario 30, where police would have driven the
// witness off. Same question — do police go? — with the opposite answer,
// and the difference is whether the danger is to the patient or from him.
//
// FICTIONAL: everyone involved and the premises. Old Street in Ashton is
// real; the bar is not.

export const scenario35: Scenario = {
  id: "35",
  slug: "35_assault_ashton",
  title: "Assault — Old Street, Ashton-under-Lyne",
  type: "ambulance_assault",
  patch: "Eastern",
  severity: "high",
  trigger:
    "Male on the pavement outside licensed premises, head injury, in and out of consciousness. Those responsible still in the area. Door staff with him",

  location: {
    address: "Old Street, Ashton-under-Lyne",
    postcode: "OL6 7SB",
    coords: { lat: 53.4864, lng: -2.0949 },
  },

  property: {
    class: "Town centre street outside licensed premises — patient on the pavement",
    occupants:
      "Busy. Door staff with the patient; a group nearby who are believed to be involved",
    vulnerabilities: [
      "Those responsible are still in the immediate area",
      "Crowd of onlookers, several of whom have been drinking",
      "Head injury with fluctuating consciousness",
    ],
    access:
      "Old Street both ends. A staging point one street back keeps the ambulance close without putting it in the middle",
    knownHazards: [
      "Ongoing risk of violence — the scene is not safe for an unaccompanied crew",
      "Alcohol; crowd; confined street",
    ],
    firstDueStationId: "A-ASH",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — public highway.",
      "Scene is not safe for ambulance until police are in place. Stage, do not stand down.",
      "Repeat location for weekend assaults per the local knowledge file.",
    ],
  },

  methane: {
    M: "No",
    E: "Old Street, Ashton-under-Lyne, OL6 7SB",
    T: "Assault — one casualty with a head injury, offenders still in the area",
    H: "Ongoing violence; crowd; alcohol",
    A: "Old Street both ends. Ambulance staging one street back until police confirm the scene",
    N: "One confirmed. Others may present once the scene is controlled",
    emergencyServices: "Police first; ambulance staged and committed on their word",
  },

  pda: [
    {
      id: "police1",
      label: "Police — first response",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      notes: "First, and before the ambulance. The scene is not safe until they say it is",
    },
    {
      id: "police2",
      label: "Police — second unit",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      notes: "The group nearby, and the crowd. One unit cannot do both",
    },
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-ASH",
      notes:
        "Staged one street back, not stood down. The moment police have it they want to be seconds away",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      {
        metric: "Sequence",
        target: "police committed before the ambulance, not alongside it",
      },
      {
        metric: "Staging",
        target: "ambulance held close rather than stood down — seconds away when it is safe",
      },
      {
        metric: "Head injury",
        target: "fluctuating consciousness treated as time-critical once access is gained",
      },
    ],
    lesson:
      "The opposite answer to the man in the park, and the difference is who the danger is to. Here the threat is still standing there, so a crew who arrive first are two more casualties waiting to happen. Police first, ambulance STAGED — not stood down, staged, one street back — so that the moment the scene is safe they are seconds away rather than minutes. Sending the ambulance straight in saves nothing and can cost you a second incident.",
  },

  scene: {
    viewBox: { x: -60, y: -35, width: 120, height: 70 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -20, y: -26, w: 34, h: 20 }, kind: "target", label: "Licensed premises" },
      { shape: { x: -54, y: -26, w: 30, h: 20 }, kind: "neighbour", label: "Retail units" },
      { shape: { x: 18, y: -26, w: 30, h: 20 }, kind: "neighbour", label: "Retail units" },
    ],
    roads: [
      { shape: { x: -60, y: -4, w: 120, h: 3 }, kind: "pavement" },
      { shape: { x: -60, y: -1, w: 120, h: 11 }, kind: "road", label: "Old Street" },
      { shape: { x: -60, y: 18, w: 40, h: 9 }, kind: "road", label: "Staging — one street back" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -34, y: 4 }, kind: "car" },
      { pos: { x: 24, y: 4 }, kind: "car" },
      { pos: { x: -46, y: 14 }, kind: "lamppost" },
      { pos: { x: 34, y: 14 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "offenders",
        pos: { x: 18, y: -2 },
        kind: "structural",
        label: "Group believed responsible still in the immediate area",
        knownFromPri: true,
      },
      {
        id: "crowd",
        pos: { x: -12, y: -2 },
        kind: "structural",
        label: "Crowd of onlookers, several having been drinking",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-35-male",
        label: "Male, 20s — head injury, consciousness fluctuating",
        pos: { x: -4, y: -3 },
        severity: "critical",
        discoverAfterMinBa: 0,
        clinical: {
          // Bradycardic and hypertensive with a falling GCS — the picture
          // of rising intracranial pressure, not of shock.
          vitals: { rr: 12, spo2: 95, hr: 54, bpSys: 168, bpDia: 96, gcs: 9, temp: 36.5, bm: 5.9 },
          ageYears: 24,
          presumedCondition: "Head injury with fluctuating consciousness — assault",
          redFlags: ["head_injury_severe", "airway_compromise"],
          preferredDestination: "mtc",
          criticalInterventions: ["oxygen", "iv_access", "rsi", "spine_board"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Old Street / patient", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · East end", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Premises frontage", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Staging point", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "door-staff-first",
      atSec: 5,
      text: "Door staff on Old Street. We've a lad on the floor outside — he's taken a bad one to the head. He's opening his eyes then going again. The ones that did it are still stood up the road, they've not gone anywhere.",
      tone: "critical",
    },
    {
      id: "still-there",
      atSec: 45,
      text: "They're still there and they're shouting the odds. There's a crowd building. I'd not want your ambulance crew stood here on their own, if I'm honest.",
      tone: "urgent",
    },
    {
      id: "police-arrive",
      atSec: 200,
      probability: 0.8,
      text: "Police are here. They've moved that lot up the street and it's calmed right down. You can get your ambulance in now.",
      tone: "info",
    },
    {
      id: "worse",
      atSec: 260,
      probability: 0.4,
      text: "He's stopped responding to us altogether now. He's breathing but he's not with us at all.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],
};
