import type { Scenario } from "../incident_types";

// Scenario 33 — diabetic hypoglycaemia, Urmston.
//
// The job that teaches an operator that not every incident ends at a
// hospital. Give him glucose and in ten minutes he is himself again,
// apologetic, and refusing to go anywhere — and that is the correct
// outcome, not a failure to convey.
//
// Which matters on the board, because this resource comes BACK. Nothing
// else in the sim does that inside the hour. An operator who has learned
// that every ambulance they commit is gone for the shift will hold this
// job unnecessarily; one who knows it is a twenty-minute round trip will
// use it to fill a gap.
//
// The complication is that "treat and leave" is a clinical decision, not
// a dispatch one, and sometimes he does need to go.
//
// FICTIONAL: Mr Ferris and the address. Flixton Road is a real Urmston
// road; the house is not.

export const scenario33: Scenario = {
  id: "33",
  slug: "33_diabetic_urmston",
  title: "Diabetic emergency — male 46, Urmston",
  type: "ambulance_diabetic",
  patch: "Southern",
  severity: "moderate",
  trigger:
    "Category 2 — 46-year-old male, type 1 diabetic, confused and sweating. Wife has tried a sugary drink without success. Conscious",

  location: {
    address: "119 Flixton Road, Urmston, Manchester",
    postcode: "M41 5AN",
    coords: { lat: 53.4471, lng: -2.3548 },
  },

  property: {
    class: "Terraced house — patient in the kitchen",
    occupants: "Two — the patient and his wife",
    vulnerabilities: [
      "Confused and not co-operating with his wife, which is the illness rather than the man",
      "Known type 1 diabetic; this has happened before",
    ],
    access: "Front door onto Flixton Road. Wife will be at the door",
    knownHazards: ["None"],
    firstDueStationId: "A-URM",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "Type 1 diabetic. Three previous hypoglycaemic episodes attended in two years; none conveyed.",
      "A treated hypo often does not go to hospital. This crew may well be clear in twenty minutes.",
    ],
  },

  methane: {
    M: "No",
    E: "119 Flixton Road, Urmston, M41 5AN",
    T: "Diabetic emergency — confused, sweating, not responding to oral glucose",
    H: "None",
    A: "Front door onto Flixton Road; wife at the door",
    N: "One — male, 46, conscious",
    emergencyServices: "Ambulance only",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-URM",
      notes:
        "A DCA, and expect it back. A treated hypo frequently stays at home — this is one of the few jobs that returns a resource inside the hour",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "C2 response", target: "on scene inside 40 minutes" },
      {
        metric: "Proportionate response",
        target: "one resource — this is a drug and twenty minutes, not a convoy",
      },
      {
        metric: "Resource planning",
        target: "the crew treated as returning, not written off for the shift",
      },
    ],
    lesson:
      "Not every job ends at a hospital, and this is the one that proves it. Treat him and in ten minutes he is himself again and refusing to go anywhere, which is the right outcome rather than a failure. On the board that makes this the rare job that gives a resource back inside the hour — worth knowing when you are deciding what you can afford to send.",
  },

  scene: {
    viewBox: { x: -40, y: -30, width: 80, height: 60 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -9, y: -22, w: 18, h: 24 }, kind: "target", label: "No. 119" },
      { shape: { x: -29, y: -22, w: 18, h: 24 }, kind: "neighbour", label: "No. 117" },
      { shape: { x: 11, y: -22, w: 18, h: 24 }, kind: "neighbour", label: "No. 121" },
    ],
    roads: [
      { shape: { x: -40, y: 6, w: 80, h: 2 }, kind: "pavement" },
      { shape: { x: -40, y: 8, w: 80, h: 10 }, kind: "road", label: "Flixton Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -20, y: 12 }, kind: "car" },
      { pos: { x: 8, y: 12 }, kind: "car" },
      { pos: { x: -32, y: 20 }, kind: "lamppost" },
    ],
    hazards: [],
    casualties: [
      {
        id: "cas-33-ferris",
        label: "Male, 46 — hypoglycaemic, confused",
        pos: { x: 0, y: -14 },
        severity: "serious",
        discoverAfterMinBa: 0,
        clinical: {
          // BM 2.1. The generic fallback gave him 5.8, which is a normal
          // blood sugar on a hypoglycaemia job — the single most obviously
          // wrong number the missing clinical data produced.
          vitals: { rr: 20, spo2: 97, hr: 112, bpSys: 138, bpDia: 84, gcs: 12, temp: 36.2, bm: 2.1 },
          presumedCondition: "Hypoglycaemia — sweating, confusion, combative, not taking oral glucose",
          redFlags: ["hypoglycaemia"],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["glucagon", "iv_access"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Flixton Road frontage", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 121 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear yard", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 117 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "wife-first",
      atSec: 5,
      text: "It's my husband — he's diabetic and he's gone hypo. He's clammy and he's not making sense. I've tried getting a Lucozade into him but he won't have it, he's fighting me off. He's never like this normally.",
      tone: "urgent",
    },
    {
      id: "history",
      atSec: 50,
      text: "He's type one, has been since he was a lad. It's happened before — you came out to him last winter. He'd been out on his bike and not eaten.",
      tone: "info",
    },
    {
      id: "coming-round",
      atSec: 200,
      probability: 0.75,
      suppressesIds: ["not-rousing"],
      text: "He's had a bit of the drink now and he's starting to come round — he's answering me properly. He's saying he doesn't want to go to hospital, he just wants to sit down.",
      tone: "info",
    },
    {
      id: "not-rousing",
      atSec: 200,
      suppressesIds: ["coming-round"],
      text: "He's gone quiet on me now — he's still breathing but he's not answering at all. I can't rouse him.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],
};
