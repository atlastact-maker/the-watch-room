import type { Scenario } from "../incident_types";

// Scenario 25 — agricultural building fire, above Ramsbottom.
//
// Everything the sim's urban jobs take for granted is missing here. There
// is no hydrant. The nearest one is a mile and a half down the lane, so
// water is a relay or it is nothing, and a relay is pumps and hose and
// time rather than a decision you make once. The lane will take one
// appliance at a time. And there is livestock in the shed, which is not a
// casualty on any board but is the reason a farmer will go back in.
//
// The operator's job is water and access, decided in the first two
// minutes, because both get harder the longer you leave them.
//
// FICTIONAL: the farm and the family. Holcombe and the moor road above
// Ramsbottom are real; this farm is not.

export const scenario25: Scenario = {
  id: "25",
  slug: "25_farm_fire_ramsbottom",
  title: "Farm building fire — Holcombe, Ramsbottom",
  type: "agricultural_fire",
  patch: "Eastern",
  severity: "high",
  trigger:
    "Large agricultural building well alight — hay and machinery stored. Livestock in the adjoining shed. No hydrant at the premises",

  location: {
    address: "Higher Croft Farm, off Moor Road, Holcombe, Ramsbottom",
    postcode: "BL8 4NN",
    coords: { lat: 53.6489, lng: -2.3312 },
  },

  property: {
    class: "Steel-framed agricultural building — hay store and machinery, adjoining livestock shed",
    size: "Approximately 40 m × 18 m, open-sided at one end",
    occupants: "Farmer and his son on scene. No dwelling involved at this time",
    vulnerabilities: [
      "Farmhouse is 30 m from the building and downwind",
      "Around forty head of cattle in the adjoining shed — the farmer will go back for them",
      "Diesel tank and a red diesel bowser in the yard",
    ],
    access:
      "Single-track lane off Moor Road, roughly 600 m, passing places only. One appliance at a time and no turning space at the top except the yard",
    knownHazards: [
      "No hydrant on the premises — nearest is 1.5 miles at the village",
      "Baled hay: deep-seated, will burn for hours and needs turning out",
      "Diesel tank and bowser in the yard",
      "Asbestos cement roof sheets on the older span",
    ],
    firstDueStationId: "G38",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI, but the water situation is on file: NO HYDRANT at the premises.",
      "Nearest hydrant 1.5 miles at Holcombe village. Open water — a reservoir feed — is closer but needs light portable pumps and a crew to set it.",
      "Single-track access. One appliance at a time; the yard is the only turning point.",
    ],
  },

  methane: {
    M: "No",
    E: "Higher Croft Farm, off Moor Road, Holcombe, BL8 4NN",
    T: "Agricultural building well alight — hay and machinery, livestock adjoining",
    H: "No hydrant; deep-seated hay; diesel tank and bowser; asbestos roof sheets",
    A: "Single-track lane 600 m off Moor Road, passing places only, yard is the only turning space",
    N: "None — farmer and son on scene and out",
    emergencyServices: "Fire; ambulance to stand by",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G38",
      notes: "First pump, and its tank is all the water on this incident until a relay is set",
    },
    {
      id: "pump2",
      label: "Pump 2",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      notes: "Second pump for the relay. On a farm the water decision is the whole incident",
    },
    {
      id: "pump3",
      label: "Pump 3",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: [],
      notes: "Relay from the village hydrant, or open water if somebody can get to the reservoir",
    },
    {
      id: "officer",
      label: "Station Manager",
      service: "Fire",
      requiredApplianceTypes: ["FIRE_SM"],
      requiredCapabilities: ["Command"],
      notes: "Protracted, remote, and a water problem before it is a fire problem",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "First attendance", target: "< 15 minutes — rural" },
      {
        metric: "Water",
        target: "relay ordered on the initial attendance, not after the first tank runs out",
      },
      {
        metric: "Access",
        target: "single-track lane recognised — appliances staged rather than queued up it",
      },
    ],
    lesson:
      "Everything the town takes for granted is missing. There is no hydrant, the lane holds one appliance, and baled hay burns for hours whatever you do to it. Order the water relay with the first attendance — if you wait until the first tank is empty you have already lost half an hour, and half an hour is what a hay barn needs to become a total loss.",
  },

  scene: {
    viewBox: { x: -70, y: -50, width: 140, height: 100 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -30, y: -34, w: 58, h: 24 }, kind: "target", label: "Hay store / machinery" },
      { shape: { x: -30, y: -8, w: 40, h: 16 }, kind: "neighbour", label: "Livestock shed" },
      { shape: { x: 34, y: -6, w: 24, h: 20 }, kind: "neighbour", label: "Farmhouse" },
    ],
    roads: [
      { shape: { x: -8, y: 12, w: 12, h: 38 }, kind: "driveway", label: "Single-track lane" },
      { shape: { x: -70, y: 42, w: 140, h: 8 }, kind: "road", label: "Moor Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: 20, y: 16 }, kind: "car", label: "Diesel bowser" },
      { pos: { x: 28, y: 20 }, kind: "car" },
    ],
    fireSeat: {
      pos: { x: 0, y: -22 },
      radiusM: 6,
      growthRateMpm: 0.8,
      // Deep-seated baled hay. Water on the outside does very little.
      suppressionPerBaMpm: 0.2,
      maxRadiusM: 30,
      material: "bulk_combustible",
    },
    hazards: [
      {
        id: "no-water",
        pos: { x: -20, y: 16 },
        kind: "structural",
        label: "NO HYDRANT — nearest 1.5 miles at the village",
        knownFromPri: true,
      },
      {
        id: "diesel",
        pos: { x: 20, y: 15 },
        kind: "chemical",
        label: "Diesel tank and red diesel bowser in the yard",
        knownFromPri: true,
      },
      {
        id: "livestock",
        pos: { x: -10, y: 0 },
        kind: "structural",
        label: "Around forty head in the adjoining shed — the farmer will go back for them",
        knownFromPri: true,
      },
      {
        id: "asbestos",
        pos: { x: 12, y: -30 },
        kind: "chemical",
        label: "Asbestos cement roof sheets on the older span",
        discoverAfterMinOnScene: 4,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Yard / lane head", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Farmhouse side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Open field", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Livestock shed", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "farmer-first",
      atSec: 6,
      text: "The big shed's well away — that's all the hay in there and the machinery. It's going up like nothing I've seen. Me and my lad are out in the yard. There's no water up here, I'll tell you that now.",
      tone: "critical",
    },
    {
      id: "cattle",
      atSec: 60,
      text: "The cattle are in the shed next to it. Forty-odd head. I'm not leaving them in there — tell your lads I'm going to start letting them out.",
      tone: "urgent",
    },
    {
      id: "lane",
      atSec: 130,
      probability: 0.85,
      text: "Your engine'll only get one at a time up our lane, and there's nowhere to turn till the yard. Don't send them all up or you'll block it solid.",
      tone: "urgent",
    },
    {
      id: "wind",
      atSec: 300,
      probability: 0.5,
      text: "Wind's got up and it's blowing the sparks straight at the house. There's bits landing on the roof.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],
  // The call as John has it: on his mobile in the yard at Higher Croft,
  // upwind of a hay store he has already written off, with the lad beside
  // him and forty head of cattle in the next shed. He is not frightened.
  // He knows where the water is not, and he says so before he is asked.
  call: {
    caller: {
      name: "John Haworth",
      phone: "07700 900825",
      relation: "The farmer — Higher Croft is his",
      where: "The yard at Higher Croft Farm, at the lane head with his son, upwind of the shed",
      line: "mobile",
      state: "calm",
    },
    opening:
      "Fire brigade. It's Higher Croft Farm, up off Moor Road at Holcombe, above Ramsbottom — the big shed's gone up. That's the hay store, and the machinery's in there with it. It's well alight, the whole length of it. Nobody's hurt, me and the lad are in the yard. I'll tell you now, there's no water up here — you'll need to bring it.",
    deflection: "I've told you what it is. It's a hay barn and it's going. Are you sending them or not?",
    reassurance: {
      text: "John, they are on their way, and I've told them about the water. Stay in the yard and keep talking to me — every bit of it helps them.",
      reply: "Aye. Go on, then.",
    },
    answers: {
      f_seen: {
        text: "The hay store — it's a steel shed, forty yard long, and it's alight end to end. Flames through the roof at the far end and the whole inside's orange. Smoke's going straight up, you'll see it from Bury.",
        tone: "urgent",
        effect: { regrade: "EMERGENCY", basis: "Large agricultural building well alight, livestock and diesel adjoining, no hydrant" },
      },
      f_where: {
        text: "It started at the hay end, the back. It's in the machinery now at the front — the tractor's in there, the baler, the trailer. It's the lot. There's nowt to save in that shed.",
      },
      f_spread: {
        text: "It's moving. The cattle shed's joined on to the side of it — that's the one I'm bothered about. The house is thirty yard off on the other side and the wind's on that side — there's not much of it yet, but the smoke's going over the house roof. It's a moor. It'll get up.",
        tone: "urgent",
      },
      f_started: {
        text: "Ten minutes since the lad saw the glow from the house window, and it was through the roof by the time we'd got our boots on. It'd have been going a while before that — hay does, it smoulders in the middle of the stack and then it goes all at once.",
      },
      f_building: {
        text: "Farm building. Steel frame, tin sides, open at one end. Forty yard by twenty, near enough. The old span at the road end has got the asbestos sheet roof on it, you'll want to know that.",
      },
      f_inside: {
        text: "No. Nobody. It's me and my son and we're stood in the yard. There's nobody else lives up here — the wife's at her sister's in Bury.",
        followUps: [
          {
            id: "f_inside_animals",
            text: "Are there animals in any of the buildings?",
            answer: {
              text: "Forty-odd head of cattle in the shed joined on to it. They're not happy, you can hear them from here. Nowt in the hay store bar the machinery.",
              tone: "urgent",
            },
          },
        ],
      },
      f_hurt: {
        text: "No. The lad's singed his eyebrows getting the quad out and that's the height of it. He's alright. He's stood here.",
      },
      f_vulnerable: {
        text: "No. Just the two of us and we're out. It's the beasts in the next shed I'm bothered about, not us.",
      },
      f_hazards: {
        text: "Diesel. There's the tank in the yard — the big green one, two thousand litre — and the red diesel bowser stood next to it. That's twenty yard from the shed, if that. And the old span's got asbestos on the roof. No gas up here, we're on oil for the house.",
        tone: "urgent",
        followUps: [
          {
            id: "f_hazards_water",
            text: "Is there any water on the farm at all — a tank, a pond, a trough supply?",
            answer: {
              text: "Not a hydrant, no — nearest is down in the village, mile and a half. There's the reservoir feed over the top field, a good bit of water in that if they can get a pump to it — it's two hundred yard over rough ground. The cattle trough's off the mains but that's a half-inch pipe, it's nowt.",
            },
          },
        ],
      },
      f_danger: {
        text: "The overhead line comes across the top field to the house, it's clear of the shed. Ground's soft either side of the yard, they'll bog anything heavy if they go off the concrete. That's about it.",
      },
      f_access: {
        text: "Up the lane off Moor Road — there's a sign for Higher Croft at the bottom, by the cattle grid. It's six hundred yard of single track with passing places, and it comes out in the yard. The lad's going down to the road end on the quad to wave them in — he'll be there in his hi-vis.",
        tone: "urgent",
      },
      f_safe: {
        text: "Aye. I'm at the top of the lane, the yard gate, with the wind at my back. I'm not daft.",
      },
      f_stay: {
        text: "I'll stay on while I can. I've beasts to see to, and the signal's not great up here — if I go, I go.",
      },
      f_details: {
        text: "John Haworth. Higher Croft. This is my mobile — 07700 900825.",
      },
    },
    interjections: [
      {
        atSec: 50,
        text: "That's the roof going at the road end. Sheets coming down. Tell your lads to keep off that end, that's the asbestos.",
        tone: "urgent",
      },
      {
        atSec: 120,
        text: "Lad's gone down to the road end on the quad. He'll be at the bottom of the lane in his hi-vis, they can't miss him.",
      },
      {
        atSec: 190,
        text: "I can hear them, down on Moor Road. Long way off yet — it's a long lane.",
        requiresOpened: true,
      },
      {
        atSec: 235,
        text: "Are they coming or not? Every minute that's another bale gone, and it's twenty yard off the diesel.",
        tone: "urgent",
        requiresOpened: false,
      },
    ],
    drops: {
      atSec: 300,
      text: "Right, that's enough talking. I'm getting them beasts out before it gets to their shed — I'm putting this in my pocket. Your lads know where I am.",
    },
    onDispatch: "Right. Good. Tell them the lane, and tell them there's no water. I'll have the gate open.",
  },
};
