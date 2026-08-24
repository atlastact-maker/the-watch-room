import type { Scenario } from "../incident_types";

// Scenario 04 — Industrial fire, plastics warehouse, Trafford Park.
// Converted from the approved brief at
// data/research/fire/scenarios/04_industrial_trafford_park.md. The company
// is synthetic; Trafford Park, the station grounds and the appliance
// logic are real. Bulk polypropylene burns hot, runs molten, and eats
// water — this is the HVP + foam job.

export const scenario04: Scenario = {
  id: "04",
  slug: "04_industrial_trafford_park",
  title: "Industrial Fire — Albright Plastics, Trafford Park",
  type: "industrial_fire",
  patch: "Southern",
  severity: "major",
  trigger:
    "999 from the neighbouring unit — heavy smoke through the roof vents of the plastics factory; plume visible from the M60",

  location: {
    address: "Albright Plastics Ltd, Mosley Road, Trafford Park, Manchester",
    postcode: "M17 1FE",
    coords: { lat: 53.4694, lng: -2.3284 },
  },

  property: {
    class: "Large industrial unit — ~8,000 m² portal frame, 12 m roof clearance, plastic injection moulding",
    size: "~8,000 m² production + raw material storage",
    materials: "Steel portal frame, composite panel cladding, ~1,500 t polypropylene granulate + PU foam stock",
    occupants:
      "Two-shift operation — night shift 12 staff, day shift 80. Duty manager reports evacuation under way; two not yet accounted for",
    vulnerabilities: [
      "Two shift workers unaccounted — last seen near the dispatch office",
      "Nitrogen + acetylene cylinders in the maintenance bay — BLEVE window if fire spreads",
    ],
    access:
      "Yard with HGV turning circle off Trafford Wharf Road; one main roller door, two emergency egresses; second appliance route via Mosley Road",
    knownHazards: [
      "Bulk polypropylene granulate — high calorific value, runs molten when burning",
      "Hydraulic oil (2,000 L) + plant oil (800 L) in bunded plant room",
      "Nitrogen and acetylene cylinders — maintenance bay, north-east corner",
      "Sprinklers rated ordinary hazard only — not bulk plastic",
    ],
    firstDueStationId: "G10",
    doorType: "roller_shutter",
  },

  pri: {
    hasFormalPri: true,
    items: [
      "Bulk polypropylene granulate storage — high calorific load; sprinklers are Class A ordinary-hazard, expect them to be overwhelmed by a developed stock fire.",
      "Compressed nitrogen + acetylene in the identified maintenance bay (NE corner) — cylinder register annexed.",
      "Hydraulic fluid and plant oil tanks in the bunded plant room — bunding drains to the yard interceptor.",
      "Roof smoke vents automatic with manual override at the panel by the main office.",
      "24/7 emergency contact via the duty manager; site plan annexed. Yard drainage runs toward the Bridgewater Canal — run-off control matters.",
    ],
  },

  methane: {
    M: "Possible — large smoke plume visible from the M60",
    E: "Albright Plastics, Mosley Road, Trafford Park, M17 1FE",
    T: "Working fire — heavy smoke from roof vents; sprinklers activated; fire reported in raw material storage",
    H: "Bulk plastics, hydraulic oil, gas cylinders in maintenance bay; egress routes need confirming",
    A: "Yard access via Trafford Wharf Road; second appliance route Mosley Road",
    N: "2 shift workers unaccounted — last seen in the dispatch office",
    emergencyServices:
      "Fire (large attendance), NWAS precaution, GMP smoke-plume cordon, Environment Agency for run-off, local authority",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G10",
      notes: "First-attack BA team — search toward the dispatch office",
    },
    {
      id: "pump2",
      label: "Pump 2",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G13",
      notes: "Second BA team + rapid-intervention cover",
    },
    {
      id: "aerial",
      label: "Aerial (TL)",
      service: "Fire",
      requiredApplianceTypes: ["TL", "HLP"],
      requiredCapabilities: ["Aerial"],
      preferredStationId: "G10",
      notes: "Roof and smoke-vent management; water tower if the roof goes",
    },
    {
      id: "hvp",
      label: "Prime Mover — HVP pod",
      service: "Fire",
      requiredApplianceTypes: ["PM"],
      requiredCapabilities: [],
      preferredStationId: "G10",
      notes: "High Volume Pump — sustained water for the bulk plastic fire",
    },
    {
      id: "bfu",
      label: "Bulk Foam Unit",
      service: "Fire",
      requiredApplianceTypes: ["BFU"],
      requiredCapabilities: ["Foam"],
      notes: "Foam for the plastic and oil involvement — water alone spreads it",
    },
    {
      id: "pump3",
      label: "Pump 3 (make-up)",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G14",
      notes: "Make pumps 4 — commit on confirmation of a developed stock fire",
    },
    {
      id: "pump4",
      label: "Pump 4 (make-up)",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G15",
      notes: "Make pumps 6 likely if the sprinklers fail — pre-flagged",
    },
    {
      id: "nwas_dca",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      notes: "Precaution — unaccounted staff + BA welfare",
    },
    {
      id: "police",
      label: "Police — plume cordon",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      notes: "Smoke-plume cordon and traffic on Trafford Wharf Road",
    },
  ],

  evaluation: {
    targets: [
      { metric: "First attendance", target: "< 10 minutes" },
      { metric: "HVP in operation", target: "< 35 minutes" },
      { metric: "BA snatch (if staff inside)", target: "< 18 minutes of arrival" },
      { metric: "Cylinder cordon", target: "200 m before the BLEVE window opens" },
    ],
    lesson:
      "Cylinder management first — get the cordon right early and keep crews out of the blast zone once the BLEVE clock is running. Bulk plastic needs volume (HVP) and foam (BFU), not more jets of plain water; and the run-off is an incident of its own — the Environment Agency will ask where your water went.",
  },

  // Schematic — 200m × 140m. Portal-frame factory centre, maintenance bay
  // NE, dispatch office SW corner, yard south to Mosley Road.
  scene: {
    viewBox: { x: -100, y: -70, width: 200, height: 140 },
    compassNorth: "up",
    buildings: [
      {
        shape: { x: -45, y: -50, w: 90, h: 55 },
        kind: "target",
        label: "Production + raw material store",
      },
      {
        shape: { x: 45, y: -50, w: 22, h: 24 },
        kind: "target",
        label: "Maintenance bay (cylinders)",
      },
      {
        shape: { x: -45, y: 5, w: 26, h: 12 },
        kind: "target",
        label: "Dispatch office",
      },
      {
        shape: { x: -96, y: -50, w: 36, h: 40 },
        kind: "neighbour",
        label: "Neighbouring unit (caller)",
      },
      {
        shape: { x: 72, y: -46, w: 26, h: 36 },
        kind: "neighbour",
        label: "Distribution shed",
      },
    ],
    roads: [
      // Yard with HGV turning circle
      { shape: { x: -50, y: 17, w: 116, h: 26 }, kind: "driveway", label: "Yard — HGV turning" },
      // Access from Trafford Wharf Road (west)
      { shape: { x: -100, y: 22, w: 50, h: 10 }, kind: "driveway", label: "Trafford Wharf Rd access" },
      // Mosley Road along the south
      { shape: { x: -100, y: 47, w: 200, h: 2 }, kind: "pavement" },
      { shape: { x: -100, y: 49, w: 200, h: 10 }, kind: "road", label: "Mosley Road" },
      { shape: { x: -100, y: 59, w: 200, h: 2 }, kind: "pavement" },
    ],
    hydrants: [
      { label: "H1", coords: { lat: 53.4688, lng: -2.3297 }, street: "Mosley Road" },
      { label: "H2", coords: { lat: 53.4701, lng: -2.3268 }, street: "Trafford Wharf Road" },
      { label: "H3", coords: { lat: 53.4682, lng: -2.3258 }, street: "Praed Road" },
    ],
    landmarks: [
      { pos: { x: -30, y: 24 }, kind: "car", label: "Staff cars" },
      { pos: { x: -22, y: 24 }, kind: "car" },
      { pos: { x: 30, y: 28 }, kind: "car", label: "HGV trailer" },
      { pos: { x: -70, y: 20 }, kind: "lamppost" },
      { pos: { x: 60, y: 20 }, kind: "lamppost" },
      { pos: { x: 90, y: -52 }, kind: "tree" },
    ],
    // Seat — raw material storage, west end of the main shed. Bulk
    // combustible: the HVP supply-chain boost in the sim is the intended
    // counter, with the BFU for the molten pool.
    fireSeat: {
      pos: { x: -20, y: -30 },
      radiusM: 6,
      growthRateMpm: 0.5,
      suppressionPerBaMpm: 0.05,
      maxRadiusM: 30,
      material: "bulk_combustible",
      unknownMaterial: false,
    },
    hazards: [
      {
        id: "cylinders-maintenance",
        pos: { x: 56, y: -38 },
        kind: "cylinders",
        label: "Nitrogen + acetylene cylinders — maintenance bay (BLEVE risk if involved)",
        knownFromPri: true,
      },
      {
        id: "oil-bund",
        pos: { x: 20, y: -46 },
        kind: "chemical",
        label: "Hydraulic + plant oil tanks — bunded plant room",
        knownFromPri: true,
      },
      {
        id: "runoff-interceptor",
        pos: { x: 0, y: 30 },
        kind: "chemical",
        label: "Yard interceptor — run-off heads for the Bridgewater Canal",
        discoverAfterMinOnScene: 6,
      },
      {
        id: "site-electrical",
        pos: { x: -38, y: -8 },
        kind: "electrical",
        label: "Site intake — plant supply live until isolated",
        discoverAfterMinOnScene: 4,
      },
    ],
    casualties: [
      {
        id: "cas-worker-1",
        pos: { x: -34, y: 9 },
        severity: "serious",
        discoverAfterMinBa: 5,
        label: "Shift worker (M, ~40) — found by dispatch office, smoke inhalation",
        clinical: {
          vitals: {
            rr: 26, spo2: 90, hr: 118, bpSys: 128, bpDia: 84,
            gcs: 14, temp: 37.0, bm: 5.9,
          },
          presumedCondition: "Smoke inhalation — sooty sputum, hoarse voice",
          redFlags: ["airway_compromise"],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen", "iv_access"],
        },
      },
      {
        id: "cas-worker-2",
        pos: { x: -26, y: 12 },
        severity: "walking",
        discoverAfterMinBa: 7,
        label: "Shift worker (F, ~28) — self-extricated to the yard, coughing",
        clinical: {
          vitals: {
            rr: 20, spo2: 96, hr: 98, bpSys: 132, bpDia: 86,
            gcs: 15, temp: 36.8, bm: 5.2,
          },
          presumedCondition: "Light smoke exposure, anxiety",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Yard / Mosley Rd", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Maintenance bay", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear / rail side", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Neighbour unit", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "neighbour-first",
      atSec: 5,
      text: "I'm the manager next door — smoke's pouring out of their roof vents, thick and black. Their staff are coming out into the yard now.",
      tone: "urgent",
    },
    {
      id: "unaccounted",
      atSec: 45,
      probability: 0.75,
      text: "Their duty manager's with me — he's done a headcount and he's two short. Last seen near the dispatch office at the front corner.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "sprinklers-losing",
      atSec: 120,
      probability: 0.45,
      text: "You can hear the sprinklers running but it's not touching it — the smoke's getting worse, it's coming out the eaves now, not just the vents.",
      tone: "urgent",
      effect: { accelerateGrowthSec: 120 },
    },
    {
      id: "molten-run",
      atSec: 200,
      delayThresholdSec: 420,
      probability: 0.5,
      text: "There's burning plastic running out under the roller door like wax — it's setting fire to the pallets in the yard.",
      tone: "critical",
      effect: { accelerateGrowthSec: 90, pulseCritical: true },
    },
    {
      id: "cylinder-anxiety",
      atSec: 300,
      delayThresholdSec: 600,
      probability: 0.5,
      text: "The duty manager says the maintenance bay's got gas bottles in it — acetylene he thinks — and the fire's working down that end of the shed.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "m60-plume",
      atSec: 380,
      probability: 0.4,
      text: "The plume's right across the M60 now — traffic's slowing to look at it, it's drifting toward the houses on the far side.",
      tone: "urgent",
    },
  ],
};
