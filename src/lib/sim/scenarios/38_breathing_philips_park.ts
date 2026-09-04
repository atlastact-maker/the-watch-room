import type { Scenario } from "../incident_types";

// Scenario 38 — acute asthma, Beswick.
//
// The job that changes category while you are looking at it. He starts as
// a breathing difficulty and he can finish as a cardiac arrest, and the
// signal that it is going that way is not more noise — it is less. A
// wheeze means air is moving. A silent chest means it is not.
//
// So the trap is the opposite of the obvious one. The operator hears the
// caller calm down, the patient stop making a fuss, and the temptation is
// to relax. That is exactly the moment to upgrade it.
//
// He is also on the fourth floor of a block with a lift that is out,
// which is a dispatch problem rather than a clinical one: whatever goes
// has to carry its kit up eight flights, and carry him back down them.
//
// FICTIONAL: the patient, his flatmate and the block. Beswick is real;
// this block is not.

export const scenario38: Scenario = {
  id: "38",
  slug: "38_breathing_philips_park",
  title: "Acute asthma — fourth floor, Beswick",
  type: "ambulance_breathing",
  patch: "Southern",
  severity: "high",
  trigger:
    "Category 2 — male 24, known asthmatic, severe attack. Inhaler not helping. Fourth floor, lift out of service",

  location: {
    address: "Flat 14, Ryebank Court, Beswick, Manchester",
    postcode: "M11 3TG",
    coords: { lat: 53.4801, lng: -2.1897 },
  },

  property: {
    class: "Six-storey residential block — patient on the fourth floor",
    occupants: "Two — the patient and his flatmate",
    vulnerabilities: [
      "Lift out of service — eight flights up with kit, and the same back down with him",
      "Known asthmatic with a previous ITU admission on the record",
    ],
    access:
      "Main entrance with a door entry system; flatmate will come down. Stairs only — the lift has been out for a fortnight",
    knownHazards: ["Stair carry, both directions"],
    firstDueStationId: "A-PHP",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — residential block.",
      "Previous intensive care admission for asthma on the ambulance record. That history matters more than today's observations.",
      "Lift out of service. Reported to the housing provider a fortnight ago and still out.",
    ],
  },

  methane: {
    M: "No",
    E: "Flat 14, Ryebank Court, Beswick, M11 3TG",
    T: "Acute asthma — severe, not responding to his own inhaler",
    H: "Stair carry from the fourth floor, both directions",
    A: "Main entrance, door entry; flatmate coming down. Stairs only",
    N: "One — male, 24",
    emergencyServices: "Ambulance only",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-PHP",
      notes: "A DCA. He is going, and carrying him down eight flights is a two-person job at least",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "C2 response", target: "on scene inside 18 minutes" },
      {
        metric: "Escalation",
        target: "upgraded if the caller reports him going quiet — a silent chest is worse, not better",
      },
      {
        metric: "Access",
        target: "lift failure passed to the crew before they arrive with a carry chair",
      },
    ],
    lesson:
      "The one that gets quieter as it gets worse. A wheeze means air is moving; a silent chest means it is not, and the caller telling you he has stopped making a fuss is the moment to upgrade rather than relax. And pass on the lift: a crew who arrive expecting one and find eight flights have lost minutes they will not get back on the way down.",
  },

  scene: {
    viewBox: { x: -45, y: -40, width: 90, height: 80 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -18, y: -32, w: 36, h: 34 }, kind: "target", label: "Ryebank Court — flat 14, 4th" },
      { shape: { x: 22, y: -20, w: 20, h: 18 }, kind: "neighbour", label: "Bin store" },
    ],
    roads: [
      { shape: { x: -45, y: 6, w: 90, h: 10 }, kind: "driveway", label: "Parking court" },
      { shape: { x: -45, y: 20, w: 90, h: 9 }, kind: "road", label: "Access road" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.4805, lng: -2.1904 }, street: "Access road" }],
    landmarks: [
      { pos: { x: -30, y: 10 }, kind: "car" },
      { pos: { x: -14, y: 10 }, kind: "car" },
      { pos: { x: 30, y: 24 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "lift-out",
        pos: { x: -6, y: -14 },
        kind: "structural",
        label: "Lift out of service — eight flights with kit, and the carry down",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-38-asthma",
        label: "Male, 24 — severe asthma, fourth floor",
        pos: { x: 0, y: -24 },
        severity: "critical",
        discoverAfterMinBa: 2,
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Main entrance", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Bin store side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear elevation", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Parking court", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "flatmate-first",
      atSec: 5,
      text: "My flatmate can't breathe — he's asthmatic and he's had his inhaler about six times and it's doing nothing. He's sat forward on the edge of the bed and he can't get a sentence out. You can hear him wheezing from the hall.",
      tone: "critical",
    },
    {
      id: "lift",
      atSec: 45,
      text: "We're on the fourth. The lift's been out a fortnight so it's the stairs, sorry. I'll come down and let them in.",
      tone: "urgent",
    },
    {
      id: "itu",
      atSec: 120,
      probability: 0.7,
      text: "He was in intensive care with his chest a couple of years back. He's scared, he keeps saying it feels like that time.",
      tone: "urgent",
    },
    {
      id: "silent-chest",
      atSec: 230,
      probability: 0.45,
      text: "He's gone quiet — he's not wheezing any more, he's just sat there. I thought that was a good sign but he looks worse, he's gone grey round the mouth.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],
};
