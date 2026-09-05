import type { Scenario } from "../incident_types";

// Scenario 23 — HMO fire, persons reported, Rusholme.
//
// A house fire where nobody can tell you how many people are inside. That
// is the whole difference between this and scenario 02: a family home has
// a known number of occupants and somebody who can account for them. A
// house in multiple occupation has a landlord who does not live there,
// tenants who do not know each other, and a number that changes.
//
// So the operator never gets a clean "persons accounted for". They get
// "there's normally about eight of us but I don't know who's in", and
// they have to resource the uncertainty rather than the count. That means
// a bigger attendance than the visible fire justifies, and it means
// keeping it there until somebody has been through every room.
//
// FICTIONAL: the house, the landlord and every tenant. Dickenson Road is
// a real Rusholme street; the property is not.

export const scenario23: Scenario = {
  id: "23",
  slug: "23_hmo_fire_rusholme",
  title: "House fire, persons reported — HMO, Rusholme",
  type: "hmo_fire",
  patch: "Southern",
  severity: "high",
  trigger:
    "Fire in a shared house. Tenants out on the street but nobody can say how many were in. Smoke from a first-floor window",

  location: {
    address: "212 Dickenson Road, Rusholme, Manchester",
    postcode: "M14 5HQ",
    coords: { lat: 53.4468, lng: -2.2141 },
  },

  property: {
    class:
      "Large Victorian terrace converted to a house in multiple occupation — eight letting rooms over three floors",
    size: "Three storeys plus a converted cellar room",
    occupants:
      "Unknown. Normally around eight tenants; four are on the street and none can account for the rest",
    vulnerabilities: [
      "Occupancy is unknown and unknowable from outside — nobody here holds a list",
      "Bedroom locks on every door; tenants do not know each other's movements",
      "Converted cellar room with one way out",
    ],
    access:
      "Front door onto Dickenson Road, terraced both sides. Rear yard via a shared entry. Parking heavy on both sides of the road",
    knownHazards: [
      "Room-by-room locks slow any search",
      "Cellar conversion with a single escape route",
      "Compartmentation likely poor — the conversion is old and the last inspection is not on file",
    ],
    firstDueStationId: "G13",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "Licensed HMO per the local authority register, but no fire service PRI on file.",
      "Landlord contact held; landlord does not live at the property.",
      "No occupancy list is held by anybody who is on scene.",
    ],
  },

  methane: {
    M: "No",
    E: "212 Dickenson Road, Rusholme, M14 5HQ",
    T: "House fire in a shared house, persons reported, occupancy unknown",
    H: "Room locks; cellar conversion with one way out; unknown compartmentation",
    A: "Front door on Dickenson Road; rear yard via the shared entry. Heavy on-street parking",
    N: "Unknown — four out, normally around eight in the house",
    emergencyServices: "Fire and ambulance required",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G13",
      notes: "First pump — BA and a search",
    },
    {
      id: "pump2",
      label: "Pump 2",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      notes: "Second BA team. Eight locked rooms take more than one crew to clear",
    },
    {
      id: "pump3",
      label: "Pump 3",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      notes:
        "Resource the uncertainty, not the visible fire. Nobody on that street can tell you the house is empty",
    },
    {
      id: "officer",
      label: "Station Manager",
      service: "Fire",
      requiredApplianceTypes: ["FIRE_SM"],
      requiredCapabilities: ["Command"],
      notes: "Persons reported with an unknown count",
    },
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      notes: "Four out already and an unknown number still inside",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "First attendance", target: "< 8 minutes" },
      {
        metric: "Resourcing the unknown",
        target: "three pumps on the initial attendance — the count is not knowable from outside",
      },
      {
        metric: "Search",
        target: "attendance held until every room has been entered, not until the fire is out",
      },
    ],
    lesson:
      "In a family home somebody can tell you who is still inside. In an HMO nobody can, and that changes what you send. You are resourcing the uncertainty rather than the fire, and you keep the attendance there until every locked door has been opened — the fire being out is not the same as the house being clear.",
  },

  scene: {
    viewBox: { x: -45, y: -40, width: 90, height: 80 },
    compassNorth: "up",
    // Three storeys of Victorian terrace with a half-landing.
    egressExtraSeconds: 180,
    // What this building will not take. Prose above; a locked option
    // with its reason on it here.
    egressBlocked: [
      { action: "trolley", reason: "Victorian terrace stair with a half-landing turn, and a cellar room under it — the trolley stays on Dickenson Road" },
    ],
    buildings: [
      { shape: { x: -10, y: -30, w: 20, h: 32 }, kind: "target", label: "212 — HMO" },
      { shape: { x: -32, y: -30, w: 20, h: 32 }, kind: "neighbour", label: "210" },
      { shape: { x: 12, y: -30, w: 20, h: 32 }, kind: "neighbour", label: "214" },
    ],
    roads: [
      { shape: { x: -45, y: 6, w: 90, h: 2 }, kind: "pavement" },
      { shape: { x: -45, y: 8, w: 90, h: 11 }, kind: "road", label: "Dickenson Road" },
      { shape: { x: 32, y: -34, w: 6, h: 40 }, kind: "driveway", label: "Shared entry" },
    ],
    hydrants: [
      { label: "H1", coords: { lat: 53.4471, lng: -2.2148 }, street: "Dickenson Road" },
      { label: "H2", coords: { lat: 53.4464, lng: -2.2134 }, street: "Dickenson Road" },
    ],
    landmarks: [
      { pos: { x: -24, y: 13 }, kind: "car" },
      { pos: { x: -6, y: 13 }, kind: "car" },
      { pos: { x: 14, y: 13 }, kind: "car" },
      { pos: { x: -38, y: 22 }, kind: "lamppost" },
    ],
    fireSeat: {
      pos: { x: 2, y: -16 },
      radiusM: 2.5,
      growthRateMpm: 0.55,
      suppressionPerBaMpm: 0.8,
      maxRadiusM: 12,
      material: "structural",
    },
    hazards: [
      {
        id: "room-locks",
        pos: { x: -4, y: -22 },
        kind: "structural",
        label: "Locks on every bedroom door — every room is a forced entry",
        knownFromPri: true,
      },
      {
        id: "cellar-room",
        pos: { x: 4, y: -4 },
        kind: "structural",
        label: "Converted cellar room — one way out",
        knownFromPri: true,
      },
      {
        id: "compartmentation",
        pos: { x: -2, y: -26 },
        kind: "structural",
        label: "Conversion compartmentation unverified — fire spread between rooms",
        discoverAfterMinOnScene: 3,
      },
    ],
    casualties: [
      {
        id: "cas-23-top-floor",
        label: "Occupant — top floor rear room",
        pos: { x: 4, y: -27 },
        severity: "serious",
        discoverAfterMinBa: 6,
        presentProbability: 0.55,
        clinical: {
          vitals: { rr: 26, spo2: 91, hr: 118, bpSys: 118, bpDia: 72, gcs: 13, temp: 36.9, bm: 5.7 },
          ageYears: 22,
          presumedCondition: "Smoke inhalation — soot around the mouth, hoarse voice, coughing",
          redFlags: ["airway_compromise"],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen", "iv_access"],
        },
      },
      {
        id: "cas-23-cellar",
        label: "Occupant — cellar room",
        pos: { x: 5, y: -3 },
        severity: "critical",
        discoverAfterMinBa: 9,
        presentProbability: 0.3,
        clinical: {
          // Found last, in the cellar room with one way out. Longest
          // exposure of anyone in the house.
          vitals: { rr: 8, spo2: 76, hr: 138, bpSys: 88, bpDia: 52, gcs: 5, temp: 36.4, bm: 5.2 },
          ageYears: 30,
          presumedCondition: "Severe smoke inhalation, unresponsive — prolonged exposure in the cellar room",
          redFlags: ["airway_compromise", "head_injury_severe"],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen", "rsi", "iv_access", "fluids"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Dickenson Road frontage", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · 214 side / entry", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear yard", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · 210 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "tenant-first",
      atSec: 5,
      text: "The house is on fire — there's smoke coming out the window upstairs. There's four of us out on the street. I don't know who else is in, I only know the lad next door to me.",
      tone: "critical",
    },
    {
      id: "how-many",
      atSec: 45,
      text: "There's normally about eight of us live here. I couldn't tell you who's home. Everyone keeps their door locked, we all just come and go.",
      tone: "urgent",
    },
    {
      id: "cellar-lad",
      atSec: 140,
      probability: 0.5,
      text: "Somebody's just said there's a lad in the cellar room. I've never met him. I don't know if he's in or not — his light was on earlier.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "landlord",
      atSec: 260,
      probability: 0.7,
      text: "I've rung the landlord. He says he'll come down but he's in Chester. He reckons there's nine rooms let, not eight.",
      tone: "urgent",
    },
  ],
};
