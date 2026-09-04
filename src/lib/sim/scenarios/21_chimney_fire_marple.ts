import type { Scenario } from "../incident_types";

// Scenario 21 — chimney fire, Marple.
//
// Chimney fires have their own category in the national statistics, which
// tells you how many of them there are. One pump, half an hour, a lot of
// mess and almost never anything worse.
//
// What makes this one worth having is WHERE it is. Marple is day-crewed,
// so outside 08:00–18:00 the pump does not roll in ninety seconds — the
// crew are alerted at home and turn out from there, and the operator
// watches several minutes go by before the appliance moves. This is the
// only scenario in the sim that puts that in front of them, and a chimney
// fire on a cold January night is exactly when it happens.
//
// FICTIONAL: the cottage and its occupants. Church Lane is a real Marple
// street; the property is not.

export const scenario21: Scenario = {
  id: "21",
  slug: "21_chimney_fire_marple",
  title: "Chimney fire — Church Lane, Marple",
  type: "chimney_fire",
  patch: "Southern",
  severity: "low",
  trigger:
    "Chimney fire at a stone cottage. Occupants out. Caller reports flames and sparks from the chimney pot and a roaring noise from the breast",

  location: {
    address: "4 Church Lane, Marple, Stockport",
    postcode: "SK6 7AY",
    coords: { lat: 53.3961, lng: -2.0619 },
  },

  property: {
    class: "Stone-built cottage — two storey, solid fuel stove, thatched-adjacent terrace of three",
    occupants: "Two — both out of the property and at a neighbour's",
    vulnerabilities: [
      "Terrace of three: the chimney stack is shared with next door",
      "Timber lintel over the fireplace opening, common in this stock",
    ],
    access:
      "Church Lane is narrow with parking both sides. An appliance may struggle past the bend; the turning circle is at the church",
    knownHazards: [
      "Shared stack — fire can extend into the neighbouring flue and roof void",
      "Timber lintel over the opening; heat transfer into the roof space",
      "Narrow lane restricting access and any second appliance",
    ],
    firstDueStationId: "G24",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "G24 Marple is DAY CREWED — outside 08:00 to 18:00 the crew are alerted from home and turn out from there.",
      "Terrace of three with a shared stack; the neighbouring flue is in use.",
    ],
  },

  methane: {
    M: "No",
    E: "4 Church Lane, Marple, SK6 7AY",
    T: "Chimney fire — flames from the pot, roaring in the breast",
    H: "Shared stack with the adjoining property; timber lintel; narrow lane",
    A: "Church Lane — narrow, parked both sides, turning circle at the church",
    N: "None — both occupants out at a neighbour's",
    emergencyServices: "Fire only",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G24",
      notes:
        "One pump. Note the station: day crewed, so outside 08:00–18:00 the turnout is from home and the clock runs before anything moves",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds from the desk" },
      {
        metric: "Turnout",
        target: "day-crewed turnout recognised — the appliance will not move for several minutes at night",
      },
      { metric: "First attendance", target: "< 15 minutes, allowing for the turnout" },
      {
        metric: "Extension",
        target: "second pump only if fire extends beyond the flue",
      },
    ],
    lesson:
      "Your mobilising time and your attendance time are different problems. You can get this away in sixty seconds and still watch nothing move for five minutes, because the nearest crew are getting out of bed. Knowing which of your stations are day crewed is knowing what your map actually means after six o'clock.",
  },

  scene: {
    viewBox: { x: -40, y: -35, width: 80, height: 70 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -8, y: -24, w: 17, h: 22 }, kind: "target", label: "No. 4" },
      { shape: { x: -27, y: -24, w: 17, h: 22 }, kind: "neighbour", label: "No. 2 — shared stack" },
      { shape: { x: 11, y: -24, w: 17, h: 22 }, kind: "neighbour", label: "No. 6" },
    ],
    roads: [
      { shape: { x: -40, y: 0, w: 80, h: 2 }, kind: "pavement" },
      { shape: { x: -40, y: 2, w: 80, h: 7 }, kind: "road", label: "Church Lane" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.3958, lng: -2.0627 }, street: "Church Lane" }],
    landmarks: [
      { pos: { x: -22, y: 5 }, kind: "car" },
      { pos: { x: 2, y: 5 }, kind: "car" },
      { pos: { x: 20, y: 5 }, kind: "car" },
      { pos: { x: -34, y: 12 }, kind: "lamppost" },
    ],
    fireSeat: {
      pos: { x: 0, y: -18 },
      radiusM: 1,
      growthRateMpm: 0.12,
      suppressionPerBaMpm: 0.5,
      maxRadiusM: 4,
      material: "structural",
    },
    hazards: [
      {
        id: "shared-stack",
        pos: { x: -6, y: -22 },
        kind: "structural",
        label: "Shared stack with no. 2 — extension into the neighbouring flue",
        knownFromPri: true,
      },
      {
        id: "lintel",
        pos: { x: 0, y: -12 },
        kind: "structural",
        label: "Timber lintel over the fireplace opening",
        discoverAfterMinOnScene: 2,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Church Lane frontage", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 6 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear garden", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 2 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "caller-first",
      atSec: 6,
      text: "It's the chimney — there's flames coming out the top of the pot and sparks going all over. You can hear it roaring in the wall. We've come out, we're next door at number six.",
      tone: "urgent",
    },
    {
      id: "stove",
      atSec: 55,
      text: "We'd had the stove going all day, it's been that cold. I've not had it swept since we moved in, I'll be honest with you.",
      tone: "info",
    },
    {
      id: "settling",
      atSec: 210,
      probability: 0.8,
      suppressesIds: ["extending"],
      text: "It's calming down a bit now — not as many sparks. Still a bit of smoke out the top but it's not roaring like it was.",
      tone: "info",
    },
    {
      id: "extending",
      atSec: 210,
      suppressesIds: ["settling"],
      text: "There's smoke coming out from under the roof tiles now, not just the chimney. And next door say they can smell it upstairs in theirs.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "access",
      atSec: 140,
      probability: 0.5,
      text: "I don't know how your engine's going to get down here, it's parked both sides. There's a turning bit up by the church.",
      tone: "info",
    },
  ],
};
