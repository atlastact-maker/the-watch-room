import type { Scenario } from "../incident_types";

// Scenario 08 — School fire, Bury (evening). Converted from the approved
// brief at data/research/fire/scenarios/08_school_bury.md. The school is
// synthetic (per the design decision: real stations, synthetic target
// premises where a real one would be inappropriate); station grounds,
// appliance types and PDA logic are real GMFRS.

export const scenario08: Scenario = {
  id: "08",
  slug: "08_school_bury",
  title: "School Fire — Hawthorne Brook High, Bury",
  type: "education_premises_fire",
  patch: "Eastern",
  severity: "moderate",
  trigger:
    "Caretaker activates the alarm and calls 999 — smoke from the tech block; sprinkler activation showing in the main panel",

  location: {
    // Synthetic secondary school placed on Manchester Road, Bury —
    // coordinates from the approved brief.
    address: "Hawthorne Brook High School, Manchester Road, Bury",
    postcode: "BL9 9XX",
    coords: { lat: 53.591, lng: -2.305 },
  },

  property: {
    class: "1970s secondary school complex — 3-storey main block, separate sports hall and tech block",
    size: "~9,000 m² footprint",
    materials: "concrete frame, brick infill, flat felt roofs; older tech block timber-floored",
    occupants:
      "Out of hours — caretaker on site; evening swimming club in the sports hall (~25 swimmers + 2 instructors)",
    vulnerabilities: [
      "Swimming club includes children — evacuation into a dark car park",
      "Parents will begin arriving as word spreads — welfare and traffic pressure",
    ],
    access:
      "Main car park at the front; service yard to the rear (locked — caretaker holds keys); fire panel in main reception",
    knownHazards: [
      "Chemistry lab on second floor of main block — acids and flammables (inventory annexed to PRI)",
      "IT server room adjacent to design tech",
      "Pool plant room — chlorine; emergency stop and isolation valve in plant room",
      "Sprinklers in main block only — NOT in the older tech block",
    ],
    firstDueStationId: "G36",
    // Commercial steel door-set on the tech block service entrance.
    doorType: "steel_security",
  },

  pri: {
    hasFormalPri: true,
    items: [
      "Sprinklers: main block only — tech block is NOT covered.",
      "Wet rising main at main entrance; dry rising main serves the tech block.",
      "Caretaker holds all keys; local authority emergency contact via switchboard.",
      "Chemistry lab inventory annexed — acids, flammables, second floor main block.",
      "Pool plant: chlorine store; emergency stop and isolation valve inside plant room.",
    ],
  },

  methane: {
    M: "No",
    E: "Hawthorne Brook High School, Manchester Road BL9 — tech block, ground-floor design tech room",
    T: "Smoke from tech block; fire visible in design tech room — caretaker activated alarm and called",
    H: "Chemistry lab in main block (separate compartment); IT server room adjacent; chlorine in pool plant room",
    A: "Main car park clear; tech block reached from rear service yard — caretaker meeting crews on arrival",
    N: "25 swimmers + 2 instructors evacuating sports hall as a precaution; caretaker accounted for",
    emergencyServices:
      "Fire (lead), NWAS precaution, GMP for traffic and arriving parents, LA duty officer being contacted",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT", "TRU_pump"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G36",
      notes: "First attack into the tech block — BA + jet off the dry riser",
    },
    {
      id: "pump2",
      label: "Pump 2",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT", "TRU_pump"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G37",
      notes: "Support pump — second jet, cover the chemistry block exposure",
    },
    {
      id: "aerial",
      label: "Aerial",
      service: "Fire",
      requiredApplianceTypes: ["HLP", "TL"],
      requiredCapabilities: ["Aerial"],
      preferredStationId: "G50",
      notes: "Long ETA from Bolton Central — order early if the roof is threatened",
    },
    {
      id: "nwas_dca",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      notes: "Precaution for the swimming club — children evacuating at night",
    },
    {
      id: "police",
      label: "Police — welfare & traffic",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      notes: "Parents arriving; keep the car park moving and the welfare job off the fire crews",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Everyone accounted for", target: "swimmers + staff confirmed clear < 15 minutes" },
      { metric: "Tech block knocked down", target: "before chemistry-block exposure" },
      { metric: "Welfare handled by police", target: "fire crews stay on firefighting" },
    ],
    lesson:
      "Out-of-hours school fires are mostly about controlling the people response — parents, staff, governors. Operators who let fire crews get dragged into welfare instead of firefighting score worse.",
  },

  // Schematic campus — 140m × 100m. Tech block (target) sits east of the
  // main block; sports hall west; car park along the southern road frontage.
  scene: {
    viewBox: { x: -70, y: -50, width: 140, height: 100 },
    compassNorth: "up",
    buildings: [
      {
        shape: { x: 18, y: -20, w: 26, h: 16 },
        kind: "target",
        label: "Tech block",
      },
      {
        shape: { x: -26, y: -30, w: 38, h: 20 },
        kind: "neighbour",
        label: "Main block (3 storeys)",
      },
      {
        shape: { x: -62, y: -18, w: 24, h: 28 },
        kind: "neighbour",
        label: "Sports hall + pool",
      },
      // Houses opposite the school on Manchester Road
      { shape: { x: -50, y: 38, w: 10, h: 8 }, kind: "other" },
      { shape: { x: -36, y: 38, w: 10, h: 8 }, kind: "other" },
      { shape: { x: -22, y: 38, w: 10, h: 8 }, kind: "other" },
      { shape: { x: -8, y: 38, w: 10, h: 8 }, kind: "other" },
      { shape: { x: 6, y: 38, w: 10, h: 8 }, kind: "other" },
      { shape: { x: 20, y: 38, w: 10, h: 8 }, kind: "other" },
    ],
    roads: [
      // Playing field north of the campus
      { shape: { x: -70, y: -50, w: 140, h: 16 }, kind: "garden" },
      // Rear service yard behind the tech block
      { shape: { x: 14, y: -34, w: 34, h: 12 }, kind: "driveway", label: "Service yard" },
      // Front car park
      { shape: { x: -30, y: 4, w: 64, h: 18 }, kind: "driveway", label: "Car park" },
      // Access road from the gate
      { shape: { x: 34, y: 4, w: 8, h: 24 }, kind: "driveway" },
      // Pavement + Manchester Road along the southern edge
      { shape: { x: -70, y: 26, w: 140, h: 2 }, kind: "pavement" },
      { shape: { x: -70, y: 28, w: 140, h: 8 }, kind: "road", label: "Manchester Road" },
      { shape: { x: -70, y: 36, w: 140, h: 2 }, kind: "pavement" },
    ],
    // Synthetic hydrants (per design decision) on plausible surrounding
    // streets around the Manchester Road frontage.
    hydrants: [
      { label: "H1", coords: { lat: 53.5905, lng: -2.3043 }, street: "Manchester Road" },
      { label: "H2", coords: { lat: 53.5916, lng: -2.3062 }, street: "School approach" },
      { label: "H3", coords: { lat: 53.5902, lng: -2.3071 }, street: "Estate road west" },
    ],
    landmarks: [
      { pos: { x: 38, y: 15 }, kind: "lamppost", label: "Lamp" },
      { pos: { x: -28, y: 15 }, kind: "lamppost", label: "Lamp" },
      { pos: { x: -14, y: 12 }, kind: "car", label: "Staff car" },
      { pos: { x: -6, y: 12 }, kind: "car", label: "Caretaker" },
      { pos: { x: 54, y: -8 }, kind: "tree" },
      { pos: { x: 60, y: 8 }, kind: "tree" },
      { pos: { x: -66, y: 20 }, kind: "tree" },
    ],
    // Seat of fire — ground-floor design tech room, east end of the tech
    // block. Evening rolls favour an electrical origin (lathe / kiln) —
    // material hidden until the 360 confirms it.
    fireSeat: {
      pos: { x: 36, y: -12 },
      radiusM: 3,
      growthRateMpm: 0.3,
      suppressionPerBaMpm: 0.08,
      maxRadiusM: 18,
      material: "electrical",
      unknownMaterial: true,
    },
    hazards: [
      {
        id: "chemistry-lab",
        pos: { x: -10, y: -24 },
        kind: "chemical",
        label: "Chemistry lab — acids + flammables (2nd floor main block)",
        knownFromPri: true,
      },
      {
        id: "pool-chlorine",
        pos: { x: -54, y: -6 },
        kind: "chemical",
        label: "Pool plant room — chlorine store",
        knownFromPri: true,
      },
      {
        id: "server-room",
        pos: { x: 24, y: -16 },
        kind: "electrical",
        label: "IT server room adjacent to design tech — live supply",
        discoverAfterMinOnScene: 4,
      },
      {
        id: "kiln-cylinder",
        pos: { x: 40, y: -16 },
        kind: "cylinders",
        label: "Gas cylinder by the kiln — design tech store",
        discoverAfterMinOnScene: 3,
      },
      {
        // The design-tech fire is electrical (lathe / kiln origin) —
        // isolating the block's supply restores water effectiveness.
        id: "tech-block-supply",
        pos: { x: 20, y: -10 },
        kind: "electrical",
        label: "Tech block electrical intake — isolate at the switch room by the service yard",
        discoverAfterMinOnScene: 3,
      },
    ],
    casualties: [
      {
        // The brief's "one missing in changing rooms" roll — absent until
        // the swimmer-missing beat reveals him (slow responses only).
        id: "cas-swimmer",
        pos: { x: -56, y: 2 },
        severity: "serious",
        discoverAfterMinBa: 6,
        presentProbability: 0,
        label: "Swimmer (14) — collapsed in changing rooms",
        clinical: {
          vitals: {
            rr: 22, spo2: 93, hr: 116, bpSys: 102, bpDia: 64,
            gcs: 13, temp: 36.8, bm: 5.1,
          },
          presumedCondition: "Faint / smoke anxiety · mild smoke exposure",
          redFlags: [],
          preferredDestination: "paed_ed",
          criticalInterventions: ["oxygen"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Front (car park)", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Right (tech block)", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear (service yard)", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Left (sports hall)", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "caretaker-first",
      atSec: 6,
      text: "It's the caretaker — the design tech room's well alight, I can see it through the window. I've got the swimmers coming out of the pool now.",
      tone: "urgent",
    },
    {
      id: "no-sprinklers",
      atSec: 30,
      text: "The panel's showing the tech block — there's no sprinklers over there, only the main building's covered.",
      tone: "info",
    },
    {
      id: "keys-ready",
      atSec: 55,
      text: "I'll meet your crews at the service yard gate with the keys — tell them to come round the back.",
      tone: "info",
    },
    {
      id: "parents-arriving",
      atSec: 120,
      probability: 0.6,
      text: "Parents are starting to turn up for the swimmers — there's cars pulling onto the front already and they're getting in the way.",
      tone: "info",
    },
    {
      id: "swimmer-missing",
      atSec: 160,
      probability: 0.45,
      delayThresholdSec: 300,
      text: "One of the instructors can't find a lad from the swim squad — they think he went back into the changing rooms for his phone.",
      tone: "critical",
      effect: { pulseCritical: true, revealCasualty: "cas-swimmer" },
    },
    {
      id: "smoke-spreading",
      atSec: 210,
      delayThresholdSec: 330,
      probability: 0.7,
      text: "The smoke's coming across to the main building now — it's near the science floor windows.",
      tone: "critical",
      effect: { accelerateGrowthSec: 45, pulseCritical: true },
    },
  ],
};
