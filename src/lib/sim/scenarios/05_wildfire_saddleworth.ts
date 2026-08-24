import type { Scenario } from "../incident_types";

// Scenario 05 — Wildfire, Saddleworth Moor. Converted from the approved
// brief at data/research/fire/scenarios/05_wildfire_saddleworth.md.
// Modelled on the 2018 fire (7 sq mi, multi-week, MACA military aid) at
// reduced scale. This is not an "extinguish it" job — it's contain,
// monitor, sustain. Wildfire tasks (beaters, knapsacks, firebreaks) are
// the primary suppression; hose only where a pump can reach.

export const scenario05: Scenario = {
  id: "05",
  slug: "05_wildfire_saddleworth",
  title: "Moorland Fire — Saddleworth, Wessenden Head",
  type: "wildfire_moorland",
  patch: "Eastern",
  severity: "major",
  trigger:
    "Walker calls 999 from the A635 layby — smoke line on the moor above Wessenden Head, flames visible along the heather, spreading with the wind",

  location: {
    address: "Saddleworth Moor, nr Wessenden Head Reservoir, Greenfield",
    postcode: "OL3 7NN",
    coords: { lat: 53.553, lng: -1.974 },
  },

  property: {
    class: "Open moorland — Peak District National Park, SSSI, peat substrate",
    size: "~2 hectares alight at time of call, advancing north",
    materials: "Dry heather and grass over deep peat — peat burns down, not just across",
    occupants:
      "None resident. Walkers possible on the public footpaths; traffic on the A635",
    vulnerabilities: [
      "Deep peat — a surface fire that gets into the peat can re-burn for weeks",
      "Walkers on the Pennine Way corridor may be cut off by a wind shift",
    ],
    access:
      "A635 Greenfield–Holmfirth road for staging (layby). Ground tracks unsuitable for standard pumps — wildfire units and 4×4 only beyond the road",
    knownHazards: [
      "Peat substrate — deep-seated burn risk",
      "Limited water sources on the hill — reservoir draw needs UU liaison",
      "Public footpaths crossing the burn area",
      "Multi-day commitment if not contained in the first hours",
    ],
    firstDueStationId: "G41",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "Local intel: the 2018 Saddleworth fire burned ~7 square miles over multiple weeks; military assistance came via MACA. Do not plan this as a one-shift job.",
      "Peat fires are notoriously hard to extinguish — surface knockdown is not extinction; the peat needs soaking and re-inspection for days.",
      "National Trust + Peak District NPA partnership protocols on file; ranger service can marshal footpaths.",
      "United Utilities own the reservoir group — liaison required before drafting.",
    ],
  },

  methane: {
    M: "Possible — escalates rapidly in summer conditions",
    E: "Saddleworth Moor above Wessenden Head, OL3 — smoke visible from the A635 layby",
    T: "Wildfire — moorland, ~2 hectares burning, advancing northward at moderate pace",
    H: "Peat substrate (deep-seated risk), public footpaths in area, walkers may be in the vicinity",
    A: "A635 layby for staging; appliances transition to wildfire units / 4×4 beyond the road",
    N: "No casualties confirmed — walkers possible on the hill",
    emergencyServices:
      "Fire (lead), GMP for the A635 and walker safety, Mountain Rescue on standby, Peak District rangers, air support if escalation confirmed",
  },

  pda: [
    {
      id: "wfu1",
      label: "Wildfire Unit 1",
      service: "Fire",
      requiredApplianceTypes: ["WFU"],
      requiredCapabilities: ["Wildfire"],
      preferredStationId: "G41",
      notes: "First wildfire team — beaters and knapsacks onto the flanks",
    },
    {
      id: "pump1",
      label: "Pump 1 (water relay base)",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G41",
      notes: "Holds the layby — relay base and crew welfare, hose up the track where it reaches",
    },
    {
      id: "wfu2",
      label: "Wildfire Unit 2",
      service: "Fire",
      requiredApplianceTypes: ["WFU"],
      requiredCapabilities: ["Wildfire"],
      preferredStationId: "G40",
      notes: "Second team — work the head with unit 1, don't chase the smoke",
    },
    {
      id: "wfu3",
      label: "Wildfire Unit 3",
      service: "Fire",
      requiredApplianceTypes: ["WFU"],
      requiredCapabilities: ["Wildfire"],
      preferredStationId: "G31",
      notes: "Reserve / rotation — moorland work burns crews out fast",
    },
    {
      id: "dim",
      label: "DIM unit",
      service: "Fire",
      requiredApplianceTypes: ["DIM"],
      requiredCapabilities: ["HAZMAT_DIM"],
      preferredStationId: "G38",
      notes: "Atmospheric monitoring if anything other than vegetation is burning",
    },
    {
      id: "police-a635",
      label: "Police — A635",
      service: "Police",
      requiredApplianceTypes: ["Police_RPU", "Police_Response"],
      requiredCapabilities: ["Police_Response"],
      notes: "A635 closure at the layby, walker marshalling with the rangers",
    },
    {
      id: "nwas_dca",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      notes: "Standby at the layby — crew welfare and any walker brought off the hill",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Wildfire unit on scene", target: "< 30 minutes (ground transition is slow)" },
      { metric: "Containment line established", target: "< 4 hours of arrival" },
      { metric: "Public safety", target: "footpaths swept + A635 managed before the wind shifts" },
      { metric: "Resource sustainability", target: "crew rotation planned — don't empty the patch on hour one" },
    ],
    lesson:
      "This is a contain, monitor, sustain job — not an extinguish job. Operators who throw the whole patch at rapid suppression score worse than those who pace the response across the multi-day window. Firebreaks ahead of the head beat chasing the flanks; and the peat is still burning after the flames are gone.",
  },

  // Schematic — 360m × 240m of open moor. A635 along the south, layby
  // staging, reservoir NW, the fire line working north-east of centre.
  scene: {
    viewBox: { x: -180, y: -120, width: 360, height: 240 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -150, y: 76, w: 10, h: 8 }, kind: "other", label: "Shooting cabin" },
    ],
    roads: [
      // The moor itself
      { shape: { x: -180, y: -120, w: 360, h: 208 }, kind: "garden", label: "Open moor — heather over peat" },
      // Wessenden Head Reservoir (NW)
      { shape: { x: -180, y: -120, w: 90, h: 54 }, kind: "water", label: "Wessenden Head Reservoir" },
      // Pennine Way / PROW footpaths
      { shape: { x: -60, y: -120, w: 4, h: 208 }, kind: "pavement", label: "Pennine Way" },
      { shape: { x: -60, y: -30, w: 200, h: 3 }, kind: "pavement", label: "PROW footpath" },
      // A635 along the southern edge + layby
      { shape: { x: -180, y: 88, w: 360, h: 12 }, kind: "road", label: "A635 Greenfield–Holmfirth" },
      { shape: { x: -30, y: 78, w: 70, h: 10 }, kind: "driveway", label: "Layby — staging" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -10, y: 82 }, kind: "car", label: "Walker's car (caller)" },
      { pos: { x: 6, y: 82 }, kind: "car" },
      { pos: { x: -120, y: -50 }, kind: "other", label: "Reservoir dam head" },
      { pos: { x: 60, y: 60 }, kind: "other", label: "Boggy ground — no vehicles" },
      { pos: { x: -40, y: 40 }, kind: "tree" },
      { pos: { x: 100, y: -80 }, kind: "other", label: "Grouse butts" },
    ],
    // The fire — ~2 ha alight, head running north with the wind. Beaters,
    // knapsacks and a firebreak ahead of the head are the play; hose only
    // near the road. Growth balanced against the wildfire-task rates.
    fireSeat: {
      pos: { x: 40, y: -20 },
      radiusM: 28,
      growthRateMpm: 1.1,
      suppressionPerBaMpm: 0.02,
      maxRadiusM: 110,
      material: "vegetation",
      unknownMaterial: false,
    },
    hazards: [
      {
        id: "deep-peat",
        pos: { x: 60, y: -40 },
        kind: "structural",
        label: "Deep peat — fire burning DOWN as well as across; re-burn risk for days",
        discoverAfterMinOnScene: 5,
      },
      {
        id: "reservoir-bank",
        pos: { x: -100, y: -62 },
        kind: "structural",
        label: "Reservoir bank — United Utilities asset; liaison before drafting",
        knownFromPri: true,
      },
      {
        id: "footpath-walkers",
        pos: { x: -58, y: -60 },
        kind: "structural",
        label: "Pennine Way corridor — walkers may be north of the fire line",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        // The "public in area" roll from the brief — a walker caught in
        // the smoke on the far side of the fire line, found by crews
        // sweeping the footpath.
        id: "cas-walker",
        pos: { x: -54, y: -70 },
        severity: "serious",
        discoverAfterMinBa: 8,
        label: "Walker (F, ~60) — smoke exposure + exhaustion, found on the Pennine Way",
        clinical: {
          vitals: {
            rr: 24, spo2: 92, hr: 110, bpSys: 138, bpDia: 88,
            gcs: 15, temp: 37.4, bm: 5.5,
          },
          presumedCondition: "Smoke exposure, exhaustion, mild heat stress",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · A635 / staging", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Head (north-east)", face: "right", bearingDeg: 45 },
      { id: 3, label: "Sector 3 · Reservoir flank", face: "left", bearingDeg: 315 },
      { id: 4, label: "Sector 4 · Rear burn area", face: "rear", bearingDeg: 90 },
    ],
  },

  informantScript: [
    {
      id: "walker-first",
      atSec: 6,
      text: "I'm in the layby on the A635 — there's a line of flame going across the moor above the reservoir, must be a hundred metres wide, and the wind's pushing it away from me up the hill.",
      tone: "urgent",
    },
    {
      id: "spreading",
      atSec: 60,
      probability: 0.7,
      text: "It's moving faster than walking pace now — the smoke's gone from white to brown and I can't see the top of the hill any more.",
      tone: "urgent",
      effect: { accelerateGrowthSec: 120 },
    },
    {
      id: "walkers-seen",
      atSec: 130,
      probability: 0.5,
      text: "There were a couple of walkers ahead of me on the Pennine Way earlier — they'd be on the far side of the smoke by now. I can't see them.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "wind-shift",
      atSec: 240,
      delayThresholdSec: 600,
      probability: 0.4,
      text: "The wind's swung round — the smoke's coming across the road now, toward Greenfield. Cars are stopping in it.",
      tone: "critical",
      effect: { accelerateGrowthSec: 150, pulseCritical: true },
    },
    {
      id: "peat-smoulder",
      atSec: 330,
      probability: 0.6,
      text: "Where it's already burned it's still smoking — the ground itself, not the heather. Little white plumes everywhere, like the ground's steaming.",
      tone: "info",
    },
  ],
};
