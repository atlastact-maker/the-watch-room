import type { Scenario } from "../incident_types";

// Scenario 01 — AFA, Trafford Centre. Converted from the approved brief at
// data/research/fire/scenarios/01_afa_trafford_centre.md. The premises is
// real (major commercial); the fire, panel zones and PRI content are
// synthetic per the design decisions. Most playthroughs this is a false
// alarm — the 5% that aren't are why we go.

export const scenario01: Scenario = {
  id: "01",
  slug: "01_afa_trafford_centre",
  title: "AFA — Trafford Centre, Zone N3",
  type: "automatic_fire_alarm",
  patch: "Southern",
  severity: "low",
  trigger:
    "Zone activation on the mall fire panel — N3, above the food court. Security investigating; NWFC mobilising the standard AFA attendance",

  location: {
    address: "The Trafford Centre, Barton Dock Road, Manchester",
    postcode: "M17 8AA",
    coords: { lat: 53.4663, lng: -2.3486 },
  },

  property: {
    class: "Super-regional shopping mall — ~190,000 m² retail + leisure, multi-occupier",
    size: "~190,000 m² across malls, anchor stores and leisure",
    materials: "Steel frame, concrete decks, large open atriums with domed rooflights",
    occupants:
      "Trading hours — thousands of shoppers and staff; 24/7 security on site with a designated fire liaison",
    vulnerabilities: [
      "Phased evacuation only — a full public evacuation is itself a major event",
      "Food court kitchens sit directly under the activated zone",
    ],
    access:
      "Service road off Barton Dock Road to the N3 service corridor; security meeting crews at the fire panel (Orient entrance)",
    knownHazards: [
      "Multiple commercial kitchens in the food court zone",
      "Large open atriums — smoke travel across zones if anything is real",
      "Anchor stores carry deep-seated stock fire risk",
    ],
    firstDueStationId: "G10",
    doorType: "steel_security",
  },

  pri: {
    hasFormalPri: true,
    items: [
      "Sprinklers throughout; wet and dry risers in the mall cores; multi-zone L1 detection.",
      "24/7 keyholder — mall security control room; designated fire liaison meets crews at the panel.",
      "Phased evacuation pre-planned; the mall runs its own incident response framework integrated with NWFC.",
      "Zone N3 covers the food court ceiling void and service corridor above John Lewis.",
    ],
  },

  methane: {
    M: "No",
    E: "Trafford Centre, panel zone N3 — above the food court, M17 8AA",
    T: "AFA — single zone activation; security investigating, nothing showing on CCTV yet",
    H: "Public premises occupied; commercial kitchens in the activated zone",
    A: "Service road from Barton Dock Road; security at the Orient panel with keys and zone plans",
    N: "None reported",
    emergencyServices: "Fire only at this time",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G10",
      notes: "Standard AFA attendance — investigate with security, BA rigged as a precaution",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "First attendance", target: "< 10 minutes" },
      {
        metric: "Proportionate response",
        target: "no second pump committed on a confirmed false",
      },
    ],
    lesson:
      "Trust the panel information, but the small fraction of AFAs that are real are why the pump still goes. Over-committing to a confirmed false leaves a coverage gap; under-reacting to a confirmed working fire in a mall this size is far worse. Listen to security — they know the building.",
  },

  // Schematic — the N3 corner of the mall: food court block, service
  // corridor and the Barton Dock Road service approach. 160m × 100m.
  scene: {
    viewBox: { x: -80, y: -50, width: 160, height: 100 },
    compassNorth: "up",
    buildings: [
      {
        shape: { x: -20, y: -34, w: 52, h: 30 },
        kind: "target",
        label: "Food court block (zone N3 over)",
      },
      {
        shape: { x: -74, y: -34, w: 50, h: 44 },
        kind: "neighbour",
        label: "Mall — Peel Avenue",
      },
      {
        shape: { x: 36, y: -34, w: 38, h: 44 },
        kind: "neighbour",
        label: "Anchor store",
      },
      {
        shape: { x: -20, y: 0, w: 52, h: 12 },
        kind: "neighbour",
        label: "Orient entrance + fire panel",
      },
    ],
    roads: [
      // Service road behind the food court block
      { shape: { x: -80, y: -46, w: 160, h: 10 }, kind: "driveway", label: "Service road" },
      // Public approach + car park to the south
      { shape: { x: -80, y: 16, w: 160, h: 18 }, kind: "driveway", label: "Car park" },
      { shape: { x: -80, y: 36, w: 160, h: 2 }, kind: "pavement" },
      { shape: { x: -80, y: 38, w: 160, h: 9 }, kind: "road", label: "Barton Dock Road" },
    ],
    hydrants: [
      { label: "H1", coords: { lat: 53.4671, lng: -2.3497 }, street: "Barton Dock Road" },
      { label: "H2", coords: { lat: 53.4655, lng: -2.3466 }, street: "Service road" },
    ],
    landmarks: [
      { pos: { x: -2, y: -40 }, kind: "car", label: "Security patrol" },
      { pos: { x: 8, y: 22 }, kind: "car" },
      { pos: { x: 16, y: 22 }, kind: "car" },
      { pos: { x: -12, y: 22 }, kind: "car" },
      { pos: { x: -40, y: 20 }, kind: "lamppost" },
      { pos: { x: 40, y: 20 }, kind: "lamppost" },
    ],
    // Almost always nothing — a possible smoulder above the food court
    // kitchens. Slow growth; the informant beats either stand it down or
    // confirm a working kitchen fire.
    fireSeat: {
      pos: { x: 6, y: -22 },
      radiusM: 0.5,
      growthRateMpm: 0.05,
      suppressionPerBaMpm: 0.12,
      maxRadiusM: 6,
      material: "electrical",
      unknownMaterial: true,
    },
    hazards: [
      {
        id: "kitchens-n3",
        pos: { x: 14, y: -26 },
        kind: "gas",
        label: "Food court kitchens — gas interlocks under zone N3",
        knownFromPri: true,
      },
      {
        id: "atrium-travel",
        pos: { x: -30, y: -20 },
        kind: "structural",
        label: "Open atrium — smoke travel across zones if fire confirmed",
        knownFromPri: true,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Orient / panel", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Anchor store", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Service road", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Peel Avenue mall", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "security-first",
      atSec: 8,
      text: "Mall security here — panel's showing zone N3, that's the ceiling void over the food court. I've sent a patrol up, nothing on CCTV so far.",
      tone: "info",
    },
    {
      id: "liaison-meet",
      atSec: 40,
      text: "Your crews want the Orient entrance — I'll have the fire liaison at the panel with the zone plans and a radio.",
      tone: "info",
    },
    {
      id: "likely-false",
      atSec: 95,
      probability: 0.7,
      text: "Patrol's up there now — they reckon it's steam off the dishwasher extract in one of the kitchen units. No smoke, no smell. We'll hold the zone until your crews confirm.",
      tone: "info",
    },
    {
      id: "working-fire",
      atSec: 150,
      probability: 0.25,
      text: "Update from the patrol — there IS smoke in the service corridor, they can smell burning. Looks like it's coming off a kitchen extract fan. We're pulling the shutters on the food court units now.",
      tone: "critical",
      effect: { accelerateGrowthSec: 240, pulseCritical: true },
    },
    {
      id: "phased-evac",
      atSec: 210,
      delayThresholdSec: 420,
      probability: 0.4,
      text: "We've started the phased evacuation announcement for the food court and upper mall — shoppers are moving, it's orderly so far.",
      tone: "urgent",
    },
  ],
};
