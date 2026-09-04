import type { Scenario } from "../incident_types";

// Scenario 15 — car fire on a live carriageway, A627(M) Chadderton.
//
// A car fire in a car park is one pump and a quiet twenty minutes. The
// same car fire on a live carriageway is a road closure, a police unit, a
// tailback and an hour, and the operator's job is to notice which one they
// have been given before they mobilise.
//
// The second thing it teaches is that a burning car on a motorway is not
// only a fire. Traffic is still passing it at seventy, the crew have to
// work with their backs to it, and roads policing exist for that. This is
// where the XT and ME patrols earn their keep — the nearest ME unit is
// almost certainly closer than anything else.
//
// FICTIONAL: the vehicle, its occupants and the recovery firm. The
// A627(M) and Chadderton are real; the incident is not.

export const scenario15: Scenario = {
  id: "15",
  slug: "15_car_fire_a627m",
  title: "Car fire — A627(M) northbound, Chadderton",
  type: "vehicle_fire",
  patch: "Eastern",
  severity: "moderate",
  trigger:
    "Car well alight on the hard shoulder of the A627(M) northbound. Occupants out and stood on the verge. Multiple callers passing",

  location: {
    address: "A627(M) northbound, between J20 and Chadderton, Oldham",
    postcode: "OL9 8EJ",
    coords: { lat: 53.5507, lng: -2.1229 },
  },

  property: {
    class: "Motor vehicle on a live motorway carriageway — hatchback, well alight",
    occupants:
      "Driver and one passenger, both out of the vehicle and on the nearside verge behind the barrier",
    vulnerabilities: [
      "Live carriageway — traffic passing the incident at speed while the crew work",
      "Occupants are stood on the verge with nowhere to go if a vehicle leaves the carriageway",
    ],
    access:
      "Northbound carriageway only — an appliance overshooting has a long way round. Nearest access from J20",
    knownHazards: [
      "Fuel tank and gas struts",
      "Traffic passing at speed; closure or lane restriction needed before crews work",
      "Smoke across both carriageways if the wind is across",
    ],
    firstDueStationId: "G35",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — highway incident.",
      "Motorway incident: roads policing and National Highways both have an interest.",
      "Recovery required before the carriageway reopens.",
    ],
  },

  methane: {
    M: "No",
    E: "A627(M) northbound between J20 and Chadderton",
    T: "Single vehicle well alight on the hard shoulder, live carriageway",
    H: "Fuel, gas struts, passing traffic at speed",
    A: "Northbound only — nearest access J20. No cross-carriageway access",
    N: "Two out and uninjured on the nearside verge",
    emergencyServices: "Fire and police required; roads policing for the carriageway",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: [],
      preferredStationId: "G35",
      notes: "One pump extinguishes a car. The rest of this attendance is about the road, not the fire",
    },
    {
      id: "roads1",
      label: "Roads policing",
      service: "Police",
      requiredApplianceTypes: ["Police_RPU"],
      requiredCapabilities: [],
      notes:
        "A crew cannot work a carriageway with traffic passing at seventy. The nearest ME unit is usually closer than anything divisional",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "First attendance", target: "< 12 minutes" },
      {
        metric: "Carriageway",
        target: "roads policing mobilised — crews do not work a live carriageway unprotected",
      },
      {
        metric: "Proportionate response",
        target: "one pump — a car fire is a car fire",
      },
    ],
    lesson:
      "Read where it is, not just what it is. The same car burning in a car park is one pump and twenty quiet minutes; on a live carriageway it needs the road shut before anybody gets off the appliance. Send the road protection with the pump, not after somebody asks for it.",
  },

  scene: {
    viewBox: { x: -70, y: -40, width: 140, height: 80 },
    compassNorth: "up",
    buildings: [],
    roads: [
      { shape: { x: -70, y: -22, w: 140, h: 12 }, kind: "road", label: "A627(M) southbound" },
      { shape: { x: -70, y: -8, w: 140, h: 3 }, kind: "pavement", label: "Central reserve" },
      { shape: { x: -70, y: -5, w: 140, h: 12 }, kind: "road", label: "A627(M) northbound" },
      { shape: { x: -70, y: 7, w: 140, h: 6 }, kind: "driveway", label: "Hard shoulder" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -4, y: 10 }, kind: "car", label: "Vehicle involved" },
      { pos: { x: -40, y: 0 }, kind: "car" },
      { pos: { x: 34, y: -16 }, kind: "car" },
      { pos: { x: 52, y: 0 }, kind: "car" },
      { pos: { x: -58, y: 18 }, kind: "lamppost" },
      { pos: { x: 26, y: 18 }, kind: "lamppost" },
    ],
    fireSeat: {
      pos: { x: -4, y: 10 },
      radiusM: 2,
      growthRateMpm: 0.4,
      suppressionPerBaMpm: 0.9,
      maxRadiusM: 5,
      material: "vehicle",
    },
    hazards: [
      {
        id: "live-carriageway",
        pos: { x: 10, y: 0 },
        kind: "structural",
        label: "Live carriageway — traffic passing at speed behind the crew",
        knownFromPri: true,
      },
      {
        id: "fuel-tank",
        pos: { x: -6, y: 11 },
        kind: "chemical",
        label: "Fuel tank and gas struts",
        knownFromPri: true,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Nearside verge", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Northbound approach", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Central reserve", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Ahead of the vehicle", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "passing-caller",
      atSec: 4,
      text: "I'm on the A627 heading north, there's a car on the hard shoulder absolutely blazing. Flames right up over the roof of it. I've gone past it now, I can't stop.",
      tone: "urgent",
    },
    {
      id: "driver-safe",
      atSec: 40,
      text: "This is the driver — it's my car. Me and my mate are out, we're stood behind the barrier on the grass. It just started smoking and then went up. No, nobody's hurt.",
      tone: "info",
    },
    {
      id: "traffic",
      atSec: 110,
      probability: 0.85,
      text: "There's traffic still coming past us really close and the smoke's blowing right across the road. Somebody's going to go into the back of something.",
      tone: "urgent",
    },
    {
      id: "spread-verge",
      atSec: 240,
      probability: 0.35,
      text: "It's caught the grass on the banking now — there's a line of it running up the verge away from the car.",
      tone: "urgent",
      effect: { pulseCritical: true },
    },
  ],
};
