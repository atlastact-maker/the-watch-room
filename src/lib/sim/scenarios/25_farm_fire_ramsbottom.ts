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
};
