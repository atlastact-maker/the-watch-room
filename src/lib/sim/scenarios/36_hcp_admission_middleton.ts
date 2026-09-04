import type { Scenario } from "../incident_types";

// Scenario 36 — GP admission, Middleton.
//
// The humblest job on the board. A GP has been out, examined her, decided
// she needs admitting, and rung for an ambulance. Nobody is dying and
// nobody is panicking. She is 83, she has a chest infection, and she has
// a bed waiting on a ward.
//
// It is here for two reasons. It is enormously common — a real ambulance
// service runs a great many of these every day — and it is the job an
// operator is most tempted to keep deferring, because every C1 and C2
// that lands is more urgent than she is. She can wait. And wait. And the
// longer she does, the more likely she is to become a C2 on her own.
//
// A doctor has already assessed her. That is worth something: the
// clinical uncertainty other jobs carry is not here, which makes it easy
// to leave and easy to get wrong.
//
// FICTIONAL: Mrs Openshaw, her GP and the address. Rochdale Road in
// Middleton is real; the bungalow is not.

export const scenario36: Scenario = {
  id: "36",
  slug: "36_hcp_admission_middleton",
  title: "GP admission — female 83, Middleton",
  type: "ambulance_hcp_admission",
  patch: "Eastern",
  severity: "moderate",
  trigger:
    "Category 3 — GP request. 83-year-old female, chest infection, requires admission. Bed arranged on the medical assessment unit. GP has left the address",

  location: {
    address: "12 Bowness Court, off Rochdale Road, Middleton",
    postcode: "M24 2QT",
    coords: { lat: 53.5551, lng: -2.1988 },
  },

  property: {
    class: "Warden-assisted bungalow — single storey, level access",
    occupants: "One — the patient. Warden holds a key and is aware",
    vulnerabilities: [
      "83, frail, chest infection. A doctor has already decided she needs to be in hospital",
      "Alone in the property; the warden checks but does not stay",
    ],
    access: "Level access, front door. Warden's office at the head of the court holds a key",
    knownHazards: ["None"],
    firstDueStationId: "A-MID",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — warden-assisted housing.",
      "GP has attended, examined and referred. Bed arranged on the medical assessment unit; the ward is expecting her.",
      "Warden holds a key. Level access throughout.",
    ],
  },

  methane: {
    M: "No",
    E: "12 Bowness Court, off Rochdale Road, Middleton, M24 2QT",
    T: "GP admission — chest infection, bed arranged on the assessment unit",
    H: "None",
    A: "Level access; warden holds a key at the head of the court",
    N: "One — female, 83, conscious and orientated",
    emergencyServices: "Ambulance only",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-MID",
      notes:
        "One DCA. A doctor has already made the clinical decision — this is a journey, and the journey still takes an hour",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "no target — this is not an emergency" },
      { metric: "C3 response", target: "on scene inside 120 minutes" },
      {
        metric: "Deferral",
        target: "not left indefinitely — a deferred admission becomes an emergency",
      },
      {
        metric: "Proportionate response",
        target: "one DCA, no RRV — a clinician has already seen her",
      },
    ],
    lesson:
      "The job you will be most tempted to keep pushing back, because everything else that lands is more urgent than she is. She can wait — and every hour she waits at home with a chest infection makes it likelier she becomes the C2 you were trying to leave room for. A doctor has already done the difficult part. All that is left is the hour of driving nobody wants to spend.",
  },

  scene: {
    viewBox: { x: -40, y: -30, width: 80, height: 60 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -10, y: -20, w: 20, h: 14 }, kind: "target", label: "No. 12" },
      { shape: { x: -34, y: -20, w: 20, h: 14 }, kind: "neighbour", label: "No. 10" },
      { shape: { x: 14, y: -20, w: 20, h: 14 }, kind: "neighbour", label: "No. 14" },
      { shape: { x: 14, y: 2, w: 20, h: 12 }, kind: "neighbour", label: "Warden's office" },
    ],
    roads: [
      { shape: { x: -40, y: -2, w: 80, h: 8 }, kind: "driveway", label: "Bowness Court" },
      { shape: { x: -40, y: 18, w: 80, h: 9 }, kind: "road", label: "Rochdale Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -24, y: 2 }, kind: "car" },
      { pos: { x: -32, y: 22 }, kind: "lamppost" },
    ],
    hazards: [],
    casualties: [
      {
        id: "cas-36-openshaw",
        label: "Female, 83 — chest infection, for admission",
        pos: { x: 0, y: -13 },
        severity: "walking",
        discoverAfterMinBa: 0,
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Bowness Court", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Warden's office", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 10 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "gp-first",
      atSec: 6,
      text: "It's the surgery — Doctor's been out to Mrs Openshaw at 12 Bowness Court. She's 83, she's got a chest infection and she's not managing at home. He wants her admitting. There's a bed on the assessment unit, they're expecting her.",
      tone: "info",
    },
    {
      id: "warden",
      atSec: 60,
      text: "The warden's got a key and she knows you're coming. Level access all the way in, no steps.",
      tone: "info",
    },
    {
      id: "chasing",
      atSec: 900,
      probability: 0.7,
      text: "Just chasing on Mrs Openshaw. She's sat in her chair with her bag packed. The ward have rung asking where she is.",
      tone: "info",
    },
    {
      id: "worse",
      atSec: 1800,
      probability: 0.35,
      text: "The warden's rung us — she says Mrs Openshaw's breathing has got a lot worse this last hour and she's gone quite drowsy. Can you upgrade it?",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],
};
