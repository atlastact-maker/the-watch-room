import type { Scenario } from "../incident_types";

// Scenario 19 — skip fire against a building, Gorton.
//
// A skip fire is one pump and ten quiet minutes. A skip fire ALIGHT
// AGAINST A BUILDING is a building fire that has not started yet, and the
// difference is about four feet.
//
// So the operator gets a routine-sounding call and has to hear the one
// detail that changes it. "There's a skip on fire" is a secondary fire.
// "There's a skip on fire up against the back of the shop" is not, and
// the second pump wants ordering before somebody rings back to say the
// soffit has gone.
//
// The reality roll decides whether it takes hold. Most of the time the
// first pump gets there and it is a skip.
//
// FICTIONAL: the businesses and the caller. Hyde Road is a real Gorton
// road; the parade is not.

export const scenario19: Scenario = {
  id: "19",
  slug: "19_skip_fire_gorton",
  title: "Skip fire — rear of Hyde Road, Gorton",
  type: "secondary_fire_refuse",
  patch: "Southern",
  severity: "moderate",
  trigger:
    "Builders' skip well alight in the rear service yard of a shop parade. Caller says it is up against the back wall of the units",

  location: {
    address: "Service yard rear of 480–492 Hyde Road, Gorton, Manchester",
    postcode: "M18 7EE",
    coords: { lat: 53.4631, lng: -2.1749 },
  },

  property: {
    class: "Shop parade — six single-storey retail units with a shared rear service yard",
    occupants:
      "Evening — units closed. A takeaway at the end of the parade is still trading",
    vulnerabilities: [
      "Skip is against the rear wall of the units, under a timber soffit and a run of plastic guttering",
      "Takeaway at the end is open, with staff and customers inside",
    ],
    access:
      "Service yard entered from the side street. Yard is narrow and part-blocked by parked cars and bins",
    knownHazards: [
      "Gas meters on the rear elevation of two of the units",
      "Unknown skip contents — builders' waste, possibly cylinders",
      "Timber soffit and plastic guttering directly above the skip",
    ],
    firstDueStationId: "G19",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — retail parade.",
      "Rear yard shared by all six units; no separate compartmentation between the roof voids per the last inspection note.",
      "Hydrant on the side street at the yard entrance.",
    ],
  },

  methane: {
    M: "No",
    E: "Service yard rear of 480–492 Hyde Road, Gorton, M18 7EE",
    T: "Skip well alight against the rear wall of a shop parade",
    H: "Gas meters on the rear elevation; unknown skip contents; timber soffit above",
    A: "Service yard from the side street — narrow, part-blocked by parked cars",
    N: "None reported. Takeaway at the end of the parade still trading",
    emergencyServices: "Fire at this time",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G19",
      notes:
        "A skip is one pump. A skip against a building is not — but you send the first one either way and decide on what you are told next",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "First attendance", target: "< 8 minutes" },
      {
        metric: "Hearing the call",
        target: "second pump ordered if the fire is reported against the building",
      },
      {
        metric: "Proportionate response",
        target: "no make-up if it is a skip in the open and stays one",
      },
    ],
    lesson:
      "The difference between a secondary fire and a building fire is about four feet, and it is in the words the caller used rather than in the incident type on your screen. A skip in the middle of a yard is one pump. A skip against a timber soffit with gas meters on the wall is a building fire that has not started yet.",
  },

  scene: {
    viewBox: { x: -55, y: -40, width: 110, height: 80 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -40, y: -30, w: 80, h: 22 }, kind: "target", label: "Shop parade 480–492" },
      { shape: { x: 40, y: -30, w: 14, h: 22 }, kind: "neighbour", label: "Takeaway (open)" },
    ],
    roads: [
      { shape: { x: -55, y: -6, w: 110, h: 16 }, kind: "driveway", label: "Service yard" },
      { shape: { x: -55, y: 12, w: 12, h: 26 }, kind: "driveway", label: "Side street" },
      { shape: { x: -55, y: 30, w: 110, h: 9 }, kind: "road", label: "Hyde Road" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.4634, lng: -2.1756 }, street: "Side street" }],
    landmarks: [
      { pos: { x: -18, y: 2 }, kind: "car" },
      { pos: { x: -6, y: 2 }, kind: "car" },
      { pos: { x: 24, y: 34 }, kind: "lamppost" },
    ],
    fireSeat: {
      pos: { x: 2, y: -6 },
      radiusM: 2.5,
      growthRateMpm: 0.5,
      suppressionPerBaMpm: 0.7,
      maxRadiusM: 9,
      // Builders waste burns like contents until somebody finds out
      // otherwise, which is what unknownMaterial is for.
      material: "structural",
      unknownMaterial: true,
    },
    hazards: [
      {
        id: "gas-meters",
        pos: { x: 8, y: -9 },
        kind: "gas",
        label: "Gas meters on the rear elevation",
        knownFromPri: true,
      },
      {
        id: "soffit",
        pos: { x: 2, y: -9 },
        kind: "structural",
        label: "Timber soffit and plastic guttering directly above the skip",
        knownFromPri: true,
      },
      {
        id: "cylinders",
        pos: { x: 0, y: -5 },
        kind: "gas",
        label: "Cylinders in the skip — builders' waste, contents unconfirmed",
        discoverAfterMinOnScene: 2,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Service yard", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Takeaway end", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Parade frontage", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Side street", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "caller-first",
      atSec: 5,
      text: "There's a skip on fire round the back of the shops on Hyde Road. It's going well, flames a good six foot up. It's right up against the back wall of the units — it's not out in the middle or anything.",
      tone: "urgent",
    },
    {
      id: "takeaway",
      atSec: 60,
      text: "The chippy on the end's still open, there's people in there eating. Do you want me to tell them? The smoke's blowing that way.",
      tone: "info",
    },
    {
      id: "just-a-skip",
      atSec: 170,
      probability: 0.72,
      suppressesIds: ["taking-hold"],
      text: "It's burning itself down a bit now, it's not as high as it was. The wall's just black, I can't see anything actually alight on the building.",
      tone: "info",
    },
    {
      id: "taking-hold",
      atSec: 170,
      suppressesIds: ["just-a-skip"],
      text: "It's got the plastic guttering above it — that's dripping and burning and the wooden bit under the roof has caught. It's going up into the roof.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "bangs",
      atSec: 260,
      probability: 0.4,
      text: "There's been a couple of bangs from inside the skip. Sounds like tins going off, or bottles. I've moved back to the street.",
      tone: "urgent",
    },
  ],
};
