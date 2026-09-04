import type { Scenario } from "../incident_types";

// Scenario 22 — man on the parapet of a multi-storey, Stockport.
//
// A joint job where the fire service is in support and neither of the
// other two is really in charge of the outcome. Police lead — it is their
// negotiator and their power of detention. Ambulance stand off and wait,
// because there is nothing for them to do until there is. Fire bring
// working-at-height equipment and a safety system and otherwise stay out
// of the way.
//
// The operator's job is patience and staging: get the right people there,
// keep them back, and hold a resource on scene for as long as it takes,
// which may be hours. Sending more does not help and a visible approach
// makes it worse.
//
// HANDLED CAREFULLY. Nothing here is graphic, no method is described, and
// the informant is a car park attendant rather than the man himself. The
// job is written from the desk's side: who to send and how to hold it.
//
// FICTIONAL: everyone in it, and the car park. Stockport town centre is
// real; this multi-storey is not.

export const scenario22: Scenario = {
  id: "22",
  slug: "22_mental_health_stockport",
  title: "Concern for safety — multi-storey, Stockport",
  type: "ambulance_mental_health",
  patch: "Southern",
  severity: "high",
  trigger:
    "Male on the wrong side of the parapet on the top deck of a town-centre multi-storey. Car park attendant is talking to him from a distance. Police negotiator requested",

  location: {
    address: "Top deck, Heaton Lane multi-storey car park, Stockport",
    postcode: "SK4 1AR",
    coords: { lat: 53.4098, lng: -2.1652 },
  },

  property: {
    class: "Multi-storey car park — six decks, town centre",
    occupants:
      "Quiet — early evening, few vehicles on the upper decks. Attendant on scene and one member of the public asked to move back",
    vulnerabilities: [
      "Any visible or noisy approach can make this worse — this is a negotiation, not a rescue",
      "Deck is open to the weather and it is cold",
    ],
    access:
      "Vehicle ramp to all decks; a service stair reaches the top deck without coming into his view. Attendant has the barrier key",
    knownHazards: [
      "Working at height for any crew committed to the deck edge",
      "Public still driving up the ramp to park unless the entrance is closed",
    ],
    firstDueStationId: "MP-STK",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — public car park.",
      "Police lead. Negotiator and the power of detention are theirs; fire and ambulance are in support.",
      "Attendant holds the barrier key and can close the entrance ramp.",
    ],
  },

  methane: {
    M: "No",
    E: "Top deck, Heaton Lane multi-storey car park, Stockport, SK4 1AR",
    T: "Concern for safety — one male on the wrong side of the parapet at height",
    H: "Working at height; public still able to drive onto the decks",
    A: "Vehicle ramp to all decks; service stair reaches the top out of his view",
    N: "One — male, conscious and talking to the attendant",
    emergencyServices: "Police leading; ambulance and fire in support",
  },

  pda: [
    {
      id: "police1",
      label: "Police — first response",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      notes: "Police lead. Everything else on this attendance is in support of them",
    },
    {
      id: "police2",
      label: "Police — second unit",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      notes: "Cordon, the ramp, and keeping the public off the decks",
    },
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: [],
      preferredStationId: "G21",
      notes:
        "Working at height equipment and a safety system. Staged out of sight — an appliance arriving noisily on the deck is not help",
    },
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-STK",
      notes: "Stood off at the RVP. There is nothing for them to do until there is",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      {
        metric: "Lead service",
        target: "police mobilised first and identified as leading",
      },
      {
        metric: "Staging",
        target: "fire and ambulance staged out of sight rather than driven onto the deck",
      },
      {
        metric: "Holding",
        target: "resources held on scene — this takes as long as it takes",
      },
    ],
    lesson:
      "You are not going to solve this from the desk and neither is anybody you send. Police lead because it is their negotiator; fire bring height equipment and stay out of the way; ambulance wait for something to do. The mistakes available to control are sending too much, letting it arrive loudly, and standing units down too early. Get them there, keep them back, and hold them.",
  },

  scene: {
    viewBox: { x: -50, y: -40, width: 100, height: 80 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -30, y: -28, w: 60, h: 44 }, kind: "target", label: "Multi-storey — top deck" },
    ],
    roads: [
      { shape: { x: 30, y: -28, w: 12, h: 44 }, kind: "driveway", label: "Vehicle ramp" },
      { shape: { x: -50, y: 20, w: 100, h: 2 }, kind: "pavement" },
      { shape: { x: -50, y: 22, w: 100, h: 10 }, kind: "road", label: "Heaton Lane" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.4102, lng: -2.166 }, street: "Heaton Lane" }],
    landmarks: [
      { pos: { x: -20, y: -6 }, kind: "car" },
      { pos: { x: 6, y: -6 }, kind: "car" },
      { pos: { x: -40, y: 26 }, kind: "lamppost" },
      { pos: { x: 36, y: 26 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "height",
        pos: { x: -26, y: -26 },
        kind: "structural",
        label: "Parapet edge — working at height for anybody committed to it",
        knownFromPri: true,
      },
      {
        id: "public-ramp",
        pos: { x: 34, y: 0 },
        kind: "structural",
        label: "Public still able to drive onto the decks unless the ramp is closed",
        knownFromPri: true,
      },
      {
        id: "service-stair",
        pos: { x: 26, y: -22 },
        kind: "structural",
        label: "Service stair reaches the top deck out of his view",
        discoverAfterMinOnScene: 2,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Heaton Lane / RVP", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Vehicle ramp", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Top deck", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Service stair", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "attendant-first",
      atSec: 6,
      text: "I'm the attendant at the Heaton Lane car park. There's a lad on the top deck who's got over the wall. I'm talking to him from a good way back — he's asked me not to come any closer, so I haven't.",
      tone: "critical",
    },
    {
      id: "keep-back",
      atSec: 55,
      text: "He's still talking to me. He's said he doesn't want a load of people up here. I've moved the one other person who was up here down to the stairs.",
      tone: "urgent",
    },
    {
      id: "ramp",
      atSec: 120,
      probability: 0.85,
      text: "I can shut the entrance ramp if you want — I've got the key. There's still cars coming up to park otherwise.",
      tone: "info",
    },
    {
      id: "talking",
      atSec: 320,
      probability: 0.7,
      text: "He's still there and he's still talking. Your officer's arrived and she's stood where I was, having a word with him. It's quiet up here, which I think is the point.",
      tone: "info",
    },
    {
      id: "long-haul",
      atSec: 700,
      probability: 0.6,
      text: "Nothing's changed. They're still talking. It's been a good while now and it's getting cold up here.",
      tone: "info",
    },
  ],
};
