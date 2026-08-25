import type { Scenario } from "../incident_types";

export const scenario02: Scenario = {
  id: "02",
  slug: "02_dwelling_fire_wythenshawe",
  title: "House Fire, Persons Reported — Wythenshawe",
  type: "dwelling_fire_persons_reported",
  patch: "Southern",
  severity: "high",
  trigger: "999 call from neighbour at no. 287 reporting smoke and shouting",

  location: {
    // Verified address from OSM — building=house, ref:GB:uprn 200000777677,
    // sits in the M22 4QR residential terrace on Hollyhedge Road. The
    // ground-view highlight will trace this exact OSM building polygon.
    address: "285 Hollyhedge Road, Wythenshawe, Manchester",
    postcode: "M22 4QR",
    coords: { lat: 53.3878415, lng: -2.2448229 },
  },

  property: {
    class: "1950s council-built semi-detached, 2 storeys",
    size: "~95 m²",
    materials: "brick cavity wall, slate roof",
    occupants: "Family of four — adults 38 and 41, children 8 and 5",
    vulnerabilities: ["Child (5) has a hearing impairment — slower to wake to alarm"],
    access:
      "Driveway clear, road access fine, dropped kerb; cars commonly parked both sides of road",
    knownHazards: [
      "Gas meter inside cupboard under stairs",
      "No asbestos register (residential)",
      "Loft converted to bedroom (non-conforming, single staircase)",
    ],
    firstDueStationId: "G15",
    // Council retrofit stock — uPVC multi-point front door. Snap the
    // cylinder; the ram flexes these doors and the multi-point holds.
    doorType: "upvc",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "Local intel: same street had a fatal house fire in 2019; local commanders prefer 4-pump make-up if persons confirmed.",
    ],
  },

  methane: {
    M: "No",
    E: "285 Hollyhedge Road, M22 — neighbour at no. 287 has called",
    T: "House fire — smoke from upper windows, neighbour heard shouting",
    H: "Gas meter believed inside, parked cars on road",
    A: "Driveway clear, no width restriction",
    N: "Unknown — family of 4 believed inside, 02:34 night call",
    emergencyServices: "Fire, ambulance running, police for cordon and traffic",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT", "TRU_pump"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G15",
      notes: "First in attendance — primary BA team",
    },
    {
      id: "pump2",
      label: "Pump 2",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT", "TRU_pump"],
      requiredCapabilities: ["BA"],
      notes: "Second BA team, second jet, search",
    },
    {
      id: "aerial",
      label: "Aerial",
      service: "Fire",
      requiredApplianceTypes: ["HLP", "TL"],
      requiredCapabilities: ["Aerial"],
      notes: "Precaution; rescue platform if upper-floor casualty",
    },
    {
      id: "nwas_dca",
      label: "Ambulance (auto)",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      notes: "NWAS attendance is automatic for persons-reported dwelling fire",
    },
    {
      id: "police",
      label: "Police (auto)",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      notes: "Cordon + traffic on Hollyhedge Road; family welfare on the pavement",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise first pump", target: "< 90 seconds" },
      { metric: "First pump in attendance", target: "< 10 minutes" },
      { metric: "BA in to property", target: "< 14 minutes for survivable casualty" },
    ],
    lesson:
      "The canonical pressure call. Tests time-to-BA and PDA discipline. Persons-reported makes 4-pump make-up usually correct.",
  },

  // Top-down ground-view scene. Schematic — 80m × 60m viewport centred on the
  // target semi. SVG convention: +Y = south, -Y = north. Road runs east-west
  // to the south of the property. Kitchen is at the rear (north).
  scene: {
    viewBox: { x: -40, y: -30, width: 80, height: 60 },
    compassNorth: "up",
    buildings: [
      {
        shape: { x: -4, y: -6, w: 8, h: 12 },
        kind: "target",
        label: "285 Hollyhedge Rd",
      },
      {
        // Attached neighbour (semi-detached partner) — no.287, the caller
        shape: { x: 4, y: -6, w: 8, h: 12 },
        kind: "neighbour",
        label: "287 (semi-attached)",
      },
      {
        // Neighbour on the other side — no.283
        shape: { x: -20, y: -6, w: 8, h: 12 },
        kind: "neighbour",
        label: "283",
      },
      // Row of houses opposite across the road (schematic)
      { shape: { x: -22, y: 22, w: 8, h: 7 }, kind: "other", label: "Opposite" },
      { shape: { x: -12, y: 22, w: 8, h: 7 }, kind: "other" },
      { shape: { x: -2, y: 22, w: 8, h: 7 }, kind: "other" },
      { shape: { x: 8, y: 22, w: 8, h: 7 }, kind: "other" },
      { shape: { x: 18, y: 22, w: 8, h: 7 }, kind: "other" },
    ],
    roads: [
      // Rear gardens (north, behind target + neighbours)
      { shape: { x: -28, y: -22, w: 60, h: 16 }, kind: "garden" },
      // Front gardens / driveways strip
      { shape: { x: -28, y: 6, w: 60, h: 4 }, kind: "garden" },
      // Pavement front of houses
      { shape: { x: -40, y: 10, w: 80, h: 2 }, kind: "pavement" },
      // Road
      { shape: { x: -40, y: 12, w: 80, h: 8 }, kind: "road", label: "Hollyhedge Road" },
      // Pavement opposite
      { shape: { x: -40, y: 20, w: 80, h: 2 }, kind: "pavement" },
      // Driveway in front of target
      { shape: { x: -2, y: 6, w: 4, h: 4 }, kind: "driveway" },
    ],
    // Real kerbside hydrant (v2 real-street coords) locations around 285 Hollyhedge Road. Each one
    // is a verified OSM road position \u2014 the map markers sit on actual
    // streets, not a schematic offset from the incident.
    hydrants: [
      { label: "H1", coords: { lat: 53.3879686, lng: -2.2443274 }, street: "Ogden Grove" },
      { label: "H2", coords: { lat: 53.3872812, lng: -2.2443897 }, street: "Chandler Close" },
      { label: "H3", coords: { lat: 53.3888688, lng: -2.2416452 }, street: "Styal Road" },
    ],
    landmarks: [
      { pos: { x: -18, y: 11 }, kind: "lamppost", label: "Lamp" },
      { pos: { x: 18, y: 11 }, kind: "lamppost", label: "Lamp" },
      { pos: { x: -8, y: 14 }, kind: "car", label: "Parked" },
      { pos: { x: 8, y: 14 }, kind: "car", label: "Parked" },
      { pos: { x: -5, y: 3 }, kind: "tree" },
    ],
    // Kitchen seat of fire — towards the rear (north) of the target house.
    fireSeat: {
      pos: { x: 0, y: -3 },
      radiusM: 2.5,
      growthRateMpm: 0.25,
      suppressionPerBaMpm: 0.08,
      maxRadiusM: 14,
    },
    hazards: [
      {
        id: "gas-meter",
        pos: { x: -2, y: -4 },
        kind: "gas",
        label: "Gas meter (cupboard under stairs)",
        knownFromPri: true,
      },
      {
        id: "loft-conversion",
        pos: { x: 0, y: -5 },
        kind: "structural",
        label: "Non-conforming loft conversion — single staircase",
        discoverAfterMinOnScene: 3,
      },
      {
        id: "meter-cupboard-paint",
        pos: { x: -3, y: 0 },
        kind: "chemical",
        label: "Paint / solvent storage (utility cupboard)",
        discoverAfterMinOnScene: 6,
      },
    ],
    // Persons reality (per the approved brief): ~33% of runs the whole
    // family is out on the pavement; ~67% the boy is still in the back
    // bedroom; and on slow responses his father may go back in after him
    // (the second-casualty beat reveals cas-2). Roughly 33 / 37 / 30
    // across all-out / one-inside / two-inside.
    casualties: [
      {
        id: "cas-1",
        pos: { x: 2, y: -4 },
        severity: "critical",
        discoverAfterMinBa: 4,
        presentProbability: 0.67,
        label: "Child (5) — back bedroom",
        clinical: {
          vitals: {
            rr: 32, spo2: 86, hr: 148, bpSys: 88, bpDia: 52,
            gcs: 9, temp: 37.2, bm: 6.4,
          },
          presumedCondition: "Smoke-inhalation · burns ~ 8% · paediatric trauma",
          redFlags: ["airway_compromise", "major_haemorrhage"],
          preferredDestination: "paed_ed",
          criticalInterventions: ["oxygen", "iv_access", "fluids"],
        },
      },
      {
        id: "cas-2",
        pos: { x: -1, y: -1 },
        severity: "serious",
        discoverAfterMinBa: 7,
        // Only exists when the "second-casualty" beat fires — the father
        // going back in for his son on a slow response.
        presentProbability: 0,
        label: "Adult (38) — hall",
        clinical: {
          vitals: {
            rr: 24, spo2: 91, hr: 118, bpSys: 104, bpDia: 68,
            gcs: 14, temp: 36.9, bm: 5.6,
          },
          presumedCondition: "Smoke-inhalation · superficial burns ~ 4%",
          redFlags: ["airway_compromise"],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen", "iv_access"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Front", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Right", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Left", face: "left", bearingDeg: 270 },
    ],
  },
  informantScript: [
    {
      id: "ack",
      atSec: 4,
      text: "Please hurry, there's thick smoke coming from the kitchen window and the fire's spreading!",
      tone: "urgent",
    },
    {
      id: "child-upstairs",
      atSec: 25,
      requiresCasualtyIds: ["cas-1"],
      text: "My son's upstairs, he was asleep in the back bedroom. I can't get back in — the hallway's black with smoke.",
      tone: "critical",
    },
    {
      // The other side of the persons-reality roll — everyone's out.
      // The house is still going like a train; only the pressure changes.
      id: "all-out",
      atSec: 30,
      requiresAbsentCasualtyIds: ["cas-1"],
      text: "Wait — they're out! They're ALL out — she's got both kids with her at next door's. Everyone's accounted for. The house has properly gone up though, it's through the kitchen roof.",
      tone: "urgent",
    },
    {
      id: "neighbour",
      atSec: 55,
      probability: 0.7,
      text: "The neighbour's banging on their wall — they think there's heat coming through the party wall.",
      tone: "info",
    },
    {
      id: "flames-upstairs",
      atSec: 90,
      delayThresholdSec: 270,
      probability: 0.8,
      requiresCasualtyIds: ["cas-1"],
      text: "There are flames at the upstairs window now, it's really gone up — I can't see my son.",
      tone: "critical",
      effect: { accelerateGrowthSec: 60, pulseCritical: true },
    },
    {
      // Slow response consequence: the father goes back in after his son.
      // This beat CREATES the second casualty (cas-2 is absent until it
      // fires) — fast attendances never generate him.
      id: "second-casualty",
      atSec: 140,
      delayThresholdSec: 330,
      probability: 0.45,
      requiresCasualtyIds: ["cas-1"],
      text: "My husband went back in to get our son — he hasn't come out. They're both in there.",
      tone: "critical",
      effect: { pulseCritical: true, revealCasualty: "cas-2" },
    },
    {
      id: "passer-by",
      atSec: 180,
      probability: 0.5,
      text: "A passer-by's here with a hose from the garden tap, they're trying to wet the front door down.",
      tone: "info",
    },
    {
      id: "gas-supply",
      atSec: 220,
      delayThresholdSec: 360,
      probability: 0.35,
      text: "I can smell gas — strongly — coming from the meter cupboard by the front of the house.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],
};
