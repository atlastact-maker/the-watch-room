import type { Scenario } from "../incident_types";

// Scenario 28 — carbon monoxide, multiple casualties, Hyde.
//
// The hazard is invisible, odourless, and has already had four people
// before anybody rang. That is what makes it different from every other
// job in the sim: by the time it is reported, the harm is done and the
// question is how many more.
//
// Two traps for the operator. The first is that it presents as an
// ambulance job — four people unwell in a house — and the ambulance
// service cannot make a house safe. The second is that a crew who walk in
// without monitoring become casualties themselves, which is exactly how
// responders die at these.
//
// So it is joint from the first minute, the fire service goes for the
// atmosphere rather than the patients, and somebody has to think about
// the houses either side, because a shared flue does not respect a party
// wall.
//
// FICTIONAL: the family and the address. Gee Cross and Hyde are real; the
// house is not.

export const scenario28: Scenario = {
  id: "28",
  slug: "28_co_exposure_hyde",
  title: "Carbon monoxide — four unwell, Gee Cross, Hyde",
  type: "special_service_co_exposure",
  patch: "Eastern",
  severity: "high",
  trigger:
    "Four occupants of one house unwell — headaches, nausea, one collapsed. Neighbour reports the same symptoms next door. CO suspected",

  location: {
    address: "31 Higham Lane, Gee Cross, Hyde",
    postcode: "SK14 5LX",
    coords: { lat: 53.4362, lng: -2.0703 },
  },

  property: {
    class: "Semi-detached house — gas central heating, back boiler in the living room chimney breast",
    occupants:
      "Four in the property: two adults, two children. One adult collapsed. Neighbours at no. 33 also reporting headaches",
    vulnerabilities: [
      "Two children in the property",
      "Adjoining house reporting the same symptoms — a shared flue does not respect a party wall",
      "Nobody should enter without monitoring, including the ambulance crew",
    ],
    access: "Front door onto Higham Lane. Driveway. Neighbours at 33 out on the pavement",
    knownHazards: [
      "Carbon monoxide — invisible, odourless, and already at a level that has affected four people",
      "Ignition risk if the source is an unburnt gas escape rather than incomplete combustion",
      "Adjoining property potentially affected through the shared stack",
    ],
    firstDueStationId: "G42",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "Back boiler in the chimney breast; the stack is shared with no. 33.",
      "Gas emergency service required — the fire service can ventilate and monitor but not condemn or isolate the appliance.",
    ],
  },

  methane: {
    M: "No",
    E: "31 Higham Lane, Gee Cross, Hyde, SK14 5LX",
    T: "Suspected carbon monoxide — four casualties in one property, symptoms next door",
    H: "CO at unknown concentration. Shared stack with no. 33. No entry without monitoring",
    A: "Front door and driveway off Higham Lane",
    N: "Four confirmed, one collapsed. Two more reporting symptoms at no. 33",
    emergencyServices: "Fire and ambulance; gas emergency service required",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G42",
      notes:
        "Monitoring and ventilation. The fire service goes for the atmosphere — nobody enters, including the ambulance crew, until it is read",
    },
    {
      id: "pump2",
      label: "Pump 2",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      notes: "No. 33 needs monitoring too, and that is a second crew's job",
    },
    {
      id: "dca1",
      label: "Ambulance 1",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      notes: "Four casualties in one house — one ambulance does not move four people",
    },
    {
      id: "dca2",
      label: "Ambulance 2",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      notes: "Two children among them, and two more symptomatic next door",
    },
    {
      id: "officer",
      label: "Station Manager",
      service: "Fire",
      requiredApplianceTypes: ["FIRE_SM"],
      requiredCapabilities: ["Command"],
      notes: "Multiple casualties across two properties with an invisible hazard",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      {
        metric: "Joint response",
        target: "fire and ambulance together — this is not an ambulance job with a fire footnote",
      },
      {
        metric: "Casualty count",
        target: "two ambulances for four casualties, before anybody asks",
      },
      {
        metric: "Adjoining property",
        target: "no. 33 monitored — a shared flue does not respect a party wall",
      },
    ],
    lesson:
      "By the time this is reported the harm has already happened, and the only question left is how many more. It looks like an ambulance job and it is not: the ambulance service cannot make a house safe, and a crew walking into an unmonitored atmosphere becomes the fifth casualty. Send both, send enough transport for the count you have been given, and think about next door before somebody rings from it.",
  },

  scene: {
    viewBox: { x: -45, y: -35, width: 90, height: 70 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -12, y: -26, w: 22, h: 24 }, kind: "target", label: "No. 31" },
      { shape: { x: 12, y: -26, w: 22, h: 24 }, kind: "neighbour", label: "No. 33 — symptoms" },
      { shape: { x: -38, y: -26, w: 22, h: 24 }, kind: "neighbour", label: "No. 29" },
    ],
    roads: [
      { shape: { x: -6, y: -2, w: 9, h: 12 }, kind: "driveway", label: "Drive" },
      { shape: { x: -45, y: 10, w: 90, h: 2 }, kind: "pavement" },
      { shape: { x: -45, y: 12, w: 90, h: 10 }, kind: "road", label: "Higham Lane" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.4366, lng: -2.0711 }, street: "Higham Lane" }],
    landmarks: [
      { pos: { x: -2, y: 4 }, kind: "car" },
      { pos: { x: 22, y: 16 }, kind: "car" },
      { pos: { x: -32, y: 18 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "co-atmosphere",
        pos: { x: -2, y: -14 },
        kind: "gas",
        label: "Carbon monoxide — invisible, odourless, concentration unknown until monitored",
        knownFromPri: true,
      },
      {
        id: "back-boiler",
        pos: { x: 2, y: -18 },
        kind: "gas",
        label: "Back boiler in the chimney breast — likely source",
        knownFromPri: true,
      },
      {
        id: "shared-stack",
        pos: { x: 11, y: -22 },
        kind: "gas",
        label: "Stack shared with no. 33 — the adjoining house may be affected too",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-28-adult-1",
        label: "Adult — collapsed in the living room",
        pos: { x: -4, y: -16 },
        severity: "critical",
        discoverAfterMinBa: 1,
      },
      {
        id: "cas-28-adult-2",
        label: "Adult — confused, in the hallway",
        pos: { x: 0, y: -10 },
        severity: "serious",
        discoverAfterMinBa: 1,
      },
      {
        id: "cas-28-child-1",
        label: "Child — headache and vomiting",
        pos: { x: -6, y: -21 },
        severity: "serious",
        discoverAfterMinBa: 2,
      },
      {
        id: "cas-28-child-2",
        label: "Child — drowsy, upstairs",
        pos: { x: 2, y: -23 },
        severity: "serious",
        discoverAfterMinBa: 3,
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Higham Lane frontage", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 33", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear garden", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 29", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "neighbour-first",
      atSec: 5,
      text: "Something's wrong with the family at 31. She's rung me because they've all got splitting headaches and the little one's been sick, and now her husband's gone down on the living room floor. I've been in there and I've come over funny myself.",
      tone: "critical",
    },
    {
      id: "next-door",
      atSec: 60,
      text: "I'm at 33, next door to them. I've had a headache since yesterday and so has my wife. We thought it was a bug going round. It's not, is it?",
      tone: "urgent",
    },
    {
      id: "boiler",
      atSec: 140,
      probability: 0.75,
      text: "She says the fire in the living room's been playing up — it's one of them back boilers behind the gas fire. It's been going all week with the cold.",
      tone: "urgent",
    },
    {
      id: "drowsy-child",
      atSec: 260,
      probability: 0.55,
      text: "The older one's upstairs and they can't get her to wake up properly. She's breathing but she's not with it.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],
};
