import type { Scenario } from "../incident_types";

// Scenario 09 — Water rescue, person in the River Irwell at the Lowry
// footbridge. Converted from the approved brief at
// data/research/fire/scenarios/09_water_rescue_river_irwell.md. Water
// rescues are time-critical and bystander management is half the job —
// the weir at Mode Wheel is ~12 minutes downstream in moderate flow.

export const scenario09: Scenario = {
  id: "09",
  slug: "09_water_rescue_river_irwell",
  title: "Person in Water — River Irwell, Lowry Footbridge",
  type: "special_service_water_rescue",
  patch: "Western",
  severity: "high",
  trigger:
    "999 from a bystander on the Lowry footbridge — adult male in the water, struggling, drifting downstream toward the locks",

  location: {
    address: "River Irwell at the Lowry footbridge, Salford Quays",
    postcode: "M50 3AH",
    coords: { lat: 53.475, lng: -2.299 },
  },

  property: {
    class: "Open water — River Irwell / Manchester Ship Canal reach at Salford Quays",
    size: "River ~40 m wide at the footbridge; casualty ~30 m out, drifting",
    materials: "Cold water (~8 °C), urban river debris, CSO discharge contamination",
    occupants: "1 adult male in the water; bystanders gathering on the bridge and both quaysides",
    vulnerabilities: [
      "Cold-water shock — the survivable window is minutes, not hours",
      "Mode Wheel Locks weir ~400 m downstream — strong recovery hazard",
      "Well-meaning bystanders may enter the water and become casualty two",
    ],
    access:
      "Quayside walkways both sides; vehicles reach the Imperial War Museum side first; bank constrained in places by railings and moorings",
    knownHazards: [
      "Cold water (~8 °C April) — cold shock and rapid incapacitation",
      "Weir at Mode Wheel Locks 400 m downstream",
      "Debris and contaminated water (CSO discharge)",
      "Tidal influence near the Ship Canal",
    ],
    firstDueStationId: "G61",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "Local intel: the Irwell at the Lowry is a known crisis location — mental-health response matters as much as the rescue; GMP attend for that reason, not just the cordon.",
      "Salford Quays water carries cold-shock risk year-round, not just in winter.",
      "Downstream weir at Mode Wheel Locks ~400 m — in moderate flow a drifting casualty reaches it in ~12 minutes.",
      "Throwline boards mounted on the quayside railings either side of the footbridge.",
    ],
  },

  methane: {
    M: "No",
    E: "River Irwell at the Lowry footbridge, Salford Quays M50",
    T: "Person in water — adult male, struggling, ~30 m from the bridge, drifting downstream",
    H: "Cold-water shock, current toward the weir 400 m downstream, debris in the water",
    A: "Quayside both sides; vehicles reach the Imperial War Museum side first",
    N: "1 in the water; bystanders shouting from the bridge",
    emergencyServices:
      "Fire (water rescue), NWAS with HART for the cold-water casualty, GMP for cordon + mental-health support",
  },

  pda: [
    {
      id: "wiu",
      label: "Water Incident Unit",
      service: "Fire",
      requiredApplianceTypes: ["WIU"],
      requiredCapabilities: ["WaterRescue"],
      preferredStationId: "G61",
      notes: "Primary water-rescue team + boat — Eccles carries the patch's WIU",
    },
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G61",
      notes: "Bank rescue — throwlines from the IWM side, eyes on the casualty",
    },
    {
      id: "pump2",
      label: "Pump 2",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G58",
      notes: "Second bank — Lowry side, downstream intercept point before the weir",
    },
    {
      id: "tru",
      label: "Technical Rescue (R57)",
      service: "Fire",
      requiredApplianceTypes: ["TRU_pump"],
      requiredCapabilities: ["WaterRescue"],
      preferredStationId: "G57",
      notes: "Water-rescue trained crew — shore safety and downstream backstop",
    },
    {
      id: "hart",
      label: "NWAS HART",
      service: "Ambulance",
      requiredApplianceTypes: ["HART_vehicle"],
      requiredCapabilities: ["HART"],
      notes: "Cold-water casualty management — rapid rewarming protocol",
    },
    {
      id: "nwas_dca",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      notes: "Conveyance once the casualty is out and through HART's hands",
    },
    {
      id: "police",
      label: "Police",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      notes: "Bystander control on the bridge + mental-health trained officer requested",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Water Incident Unit on scene", target: "< 12 minutes for a survivable rescue" },
      { metric: "Casualty recovered", target: "before the Mode Wheel weir" },
      { metric: "Bystander control", target: "nobody else enters the water" },
      { metric: "Cold-water care", target: "HART involved; rewarming started on the bank" },
    ],
    lesson:
      "Water rescues are time-critical and bystander management is half the job. The clock is the drift toward the weir, not the incident timer — get the downstream backstop set before the boat launches. And the second casualty you should be planning against is the well-meaning member of the public taking their coat off on the quayside.",
  },

  // Schematic — 160m × 90m. The Irwell runs east-west; Lowry footbridge
  // crosses mid-scene; IWM side south (vehicle access first), Lowry north.
  scene: {
    viewBox: { x: -80, y: -45, width: 160, height: 90 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -74, y: -42, w: 34, h: 18 }, kind: "neighbour", label: "The Lowry" },
      { shape: { x: 30, y: 26, w: 40, h: 16 }, kind: "neighbour", label: "Imperial War Museum North" },
      // The footbridge — spans the river mid-scene
      { shape: { x: -2, y: -14, w: 5, h: 30 }, kind: "other", label: "Lowry footbridge" },
    ],
    roads: [
      // North quayside (Lowry side)
      { shape: { x: -80, y: -22, w: 160, h: 8 }, kind: "pavement", label: "Quayside — Lowry side" },
      // The river
      { shape: { x: -80, y: -14, w: 160, h: 30 }, kind: "water", label: "River Irwell" },
      // South quayside (IWM side)
      { shape: { x: -80, y: 16, w: 160, h: 8 }, kind: "pavement", label: "Quayside — IWM side" },
      // Vehicle access on the IWM side
      { shape: { x: -80, y: 26, w: 100, h: 10 }, kind: "driveway", label: "Trafford Wharf Road access" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -10, y: -2 }, kind: "other", label: "CASUALTY — drifting west" },
      { pos: { x: 0, y: -18 }, kind: "other", label: "Bystanders on bridge" },
      { pos: { x: 24, y: -18 }, kind: "other", label: "Throwline board" },
      { pos: { x: -30, y: 19 }, kind: "other", label: "Throwline board" },
      { pos: { x: -70, y: 0 }, kind: "other", label: "→ Mode Wheel weir 400 m" },
      { pos: { x: 46, y: -18 }, kind: "other", label: "Moorings" },
      { pos: { x: -40, y: 30 }, kind: "car" },
      { pos: { x: -48, y: 30 }, kind: "car" },
      { pos: { x: 8, y: -20 }, kind: "lamppost" },
      { pos: { x: -36, y: 19 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "weir-downstream",
        pos: { x: -74, y: -6 },
        kind: "structural",
        label: "Mode Wheel Locks weir 400 m downstream — ~12 min drift in moderate flow",
        knownFromPri: true,
      },
      {
        id: "cold-water",
        pos: { x: 14, y: -4 },
        kind: "structural",
        label: "Cold water ~8 °C — cold shock; survivable window is minutes",
        knownFromPri: true,
      },
      {
        id: "cso-contamination",
        pos: { x: 40, y: 6 },
        kind: "chemical",
        label: "CSO discharge — contaminated water; PPE + post-immersion decon",
        knownFromPri: true,
      },
      {
        id: "debris",
        pos: { x: -44, y: 2 },
        kind: "structural",
        label: "Submerged debris — snag risk for swimmers and the boat",
        discoverAfterMinOnScene: 2,
      },
    ],
    casualties: [
      {
        id: "cas-water",
        pos: { x: -10, y: -2 },
        severity: "critical",
        discoverAfterMinBa: 0,
        label: "Adult male (~30s) — in the water, cold shock, drifting toward the weir",
        clinical: {
          vitals: {
            rr: 28, spo2: 90, hr: 128, bpSys: 112, bpDia: 74,
            gcs: 13, temp: 33.4, bm: 5.2,
          },
          presumedCondition:
            "Cold-water immersion — cold shock, early hypothermia, aspiration risk; crisis presentation",
          redFlags: ["airway_compromise"],
          preferredDestination: "nearest_a_e",
          criticalInterventions: [
            // 33.4degC. Everything else on this list matters less than
            // getting her dry, wrapped and into a warm saloon.
            "warming","oxygen", "iv_access"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · IWM bank (access)", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Downstream / weir", face: "left", bearingDeg: 270 },
      { id: 3, label: "Sector 3 · Lowry bank", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Upstream", face: "right", bearingDeg: 90 },
    ],
  },

  informantScript: [
    {
      id: "bystander-first",
      atSec: 4,
      text: "He's in the middle of the river, he's splashing about — he went in off the bridge I think. He's shouting but I can't make out what he's saying.",
      tone: "critical",
    },
    {
      id: "drifting",
      atSec: 45,
      text: "The current's taking him — he's past the bridge now, moving toward the big locks down the way. He's not making any ground toward the side.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "bystander-coat",
      atSec: 90,
      probability: 0.5,
      text: "There's a lad here taking his coat and shoes off, he says he's going in after him — I'm telling him not to but he's not listening to me!",
      tone: "urgent",
      effect: { pulseCritical: true },
    },
    {
      id: "going-quiet",
      atSec: 150,
      delayThresholdSec: 300,
      probability: 0.5,
      text: "He's gone quiet — he's stopped splashing. He's face up but his arms have stopped moving, he's just floating with the current now.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "throwline-short",
      atSec: 200,
      probability: 0.4,
      text: "Someone's got the throwline off the railing and had a go — it landed short, he's too far out. He's maybe forty metres from the bridge now.",
      tone: "urgent",
    },
    {
      id: "nearing-weir",
      atSec: 420,
      delayThresholdSec: 600,
      probability: 0.7,
      text: "You can hear the weir from where he is now — he's two hundred metres off it maybe. Please tell me the boat's close.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],
};
