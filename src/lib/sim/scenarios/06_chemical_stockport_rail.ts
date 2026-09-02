import type { Scenario } from "../incident_types";

// Scenario 06 — Chemical leak, Stockport rail freight depot. Converted
// from the approved brief at
// data/research/fire/scenarios/06_chemical_stockport_rail.md. The
// terminal is synthetic. Chemical incidents are about waiting for
// information — the first twenty minutes are cordon, intel and setup,
// and the worst operators commit too much too soon.

export const scenario06: Scenario = {
  id: "06",
  slug: "06_chemical_stockport_rail",
  title: "Chemical Leak — Stockport Rail Freight Terminal",
  type: "hazmat_chemical_leak",
  patch: "Southern",
  severity: "high",
  trigger:
    "Site control alarm — tank wagon leaking in siding 4, two staff exposed to vapour; Network Rail paged simultaneously",

  location: {
    address: "Stockport Rail Freight Terminal, Lancashire Hill, Stockport",
    postcode: "SK1 1PE",
    coords: { lat: 53.408, lng: -2.149 },
  },

  property: {
    class: "Rail freight yard — intermodal containers and tank wagons, 25 kV overhead line equipment",
    size: "Six sidings plus reception road; leak in siding 4",
    materials: "Ballast and concrete aprons; steel tank wagons; stacked intermodal boxes",
    occupants:
      "Site staff only — day shift ~14; two exposed to vapour at the leak, both walking but symptomatic",
    vulnerabilities: [
      "Hazchem 3YE on the leaking wagon — inflammable liquid, water-pollutant, consider evacuation",
      "Yard drainage runs to the River Mersey",
    ],
    access:
      "Site security gate on Lancashire Hill — rail authority controls entry; track presence is a hazard until possession confirmed",
    knownHazards: [
      "25 kV OLE traction current — live until Network Rail isolation (15–20 min typical)",
      "Inflammable vapour — ignition control critical",
      "Adjacent passenger line — trains passing at caution until blocked",
      "Drainage to the River Mersey — pollution risk",
    ],
    firstDueStationId: "G23",
    doorType: "steel_security",
  },

  pri: {
    hasFormalPri: true,
    items: [
      "Multi-product handling — specific Hazchem panels per consignment; today's consignment sheet held by the site office.",
      "Hazchem 3YE: normal-protein foam / water-spray, breathing apparatus, spillage risk to watercourses, CONSIDER evacuation.",
      "Site emergency plan integrated with Network Rail incident protocol; isolation of OLE + traction current typically 15–20 minutes from request.",
      "Drain plan annexed — interceptor valve at the yard's south corner; bunding points marked on the apron.",
      "24/7 site liaison at the security gate.",
    ],
  },

  methane: {
    M: "Possible — depends on dispersion and ignition",
    E: "Stockport rail freight terminal, SK1 — siding 4",
    T: "Chemical leak — tank wagon Hazchem 3YE; fluid pooling on ballast; vapour visible",
    H: "Inflammable liquid, ignition control critical, OLE 25 kV overhead, drainage to River Mersey",
    A: "Site security gate on Lancashire Hill; OLE isolation in progress (Network Rail confirm 15–20 min)",
    N: "2 site staff exposed to vapour — walking wounded, both symptomatic",
    emergencyServices:
      "Fire (lead, HAZMAT), NWAS with decon, GMP cordon, Network Rail, Environment Agency, UKHSA advised",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G23",
      notes: "Initial cordon (75 m for unknown inflammable), casualty stand-off, no committal until OLE confirmed dead",
    },
    {
      id: "dim",
      label: "DIM unit (H8)",
      service: "Fire",
      requiredApplianceTypes: ["DIM"],
      requiredCapabilities: ["HAZMAT_DIM"],
      preferredStationId: "G38",
      notes: "Substance verification beyond the Hazchem panel — long transit from Ramsbottom, order early",
    },
    {
      id: "epu",
      label: "Prime Mover — EPU pod",
      service: "Fire",
      requiredApplianceTypes: ["PM"],
      requiredCapabilities: [],
      preferredStationId: "G36",
      notes: "Environmental Protection Unit — bunding, absorbents, drain protection before the Mersey gets it",
    },
    {
      id: "pump2",
      label: "Pump 2",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G14",
      notes: "Second cordon team — Stockport side covered from Withington while G21 committed",
    },
    {
      id: "hart",
      label: "NWAS HART",
      service: "Ambulance",
      requiredApplianceTypes: ["HART_vehicle"],
      requiredCapabilities: ["HART"],
      notes: "Hazardous Area Response Team — casualty decon line before anyone leaves the warm zone",
    },
    {
      id: "nwas_dca",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      notes: "Receives the two exposed staff once through decon",
    },
    {
      id: "police",
      label: "Police — outer cordon",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      notes: "Outer cordon on Lancashire Hill; residential SW is downwind",
    },
  ],

  evaluation: {
    targets: [
      { metric: "DIM on scene", target: "< 40 minutes — the DIM unit crosses the county to reach Stockport" },
      { metric: "Initial cordon", target: "75 m held; expanded only on substance ID" },
      { metric: "Decon established", target: "before the first casualty leaves the warm zone" },
      { metric: "Drain protection", target: "EPU bunding before run-off reaches the Mersey" },
    ],
    lesson:
      "Chemical incidents are about waiting for information. The first twenty minutes are cordon, wind check and intel — operators who commit crews to the pool before the substance is verified either contaminate kit or pick the wrong media. Nothing goes near the wagon until the OLE is confirmed dead.",
  },

  // Schematic — 200m × 120m rail yard. Sidings run east-west; the leaking
  // wagon sits in siding 4, north of the container stacks. Gate south.
  scene: {
    viewBox: { x: -100, y: -60, width: 200, height: 120 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -92, y: 22, w: 20, h: 12 }, kind: "neighbour", label: "Site office + gatehouse" },
      { shape: { x: 10, y: 6, w: 44, h: 12 }, kind: "other", label: "Container stack A" },
      { shape: { x: -60, y: 6, w: 40, h: 12 }, kind: "other", label: "Container stack B" },
      { shape: { x: 62, y: -30, w: 26, h: 10 }, kind: "other", label: "Maintenance shed" },
    ],
    roads: [
      // Sidings (north group) — the passenger line runs along the very top
      { shape: { x: -100, y: -52, w: 200, h: 6 }, kind: "road", label: "Passenger line — trains at caution" },
      { shape: { x: -100, y: -40, w: 200, h: 5 }, kind: "road", label: "Siding 6" },
      { shape: { x: -100, y: -32, w: 200, h: 5 }, kind: "road", label: "Siding 5" },
      { shape: { x: -100, y: -24, w: 200, h: 5 }, kind: "road", label: "Siding 4 — leak" },
      { shape: { x: -100, y: -16, w: 200, h: 5 }, kind: "road", label: "Siding 3" },
      { shape: { x: -100, y: -8, w: 200, h: 5 }, kind: "road", label: "Reception road" },
      // Concrete apron between sidings and stacks
      { shape: { x: -100, y: -2, w: 200, h: 24 }, kind: "driveway", label: "Apron" },
      // Gate + Lancashire Hill along the south
      { shape: { x: -70, y: 26, w: 14, h: 16 }, kind: "driveway", label: "Security gate" },
      { shape: { x: -100, y: 44, w: 200, h: 2 }, kind: "pavement" },
      { shape: { x: -100, y: 46, w: 200, h: 9 }, kind: "road", label: "Lancashire Hill" },
      // The Mersey beyond the southern boundary
      { shape: { x: -100, y: 55, w: 200, h: 5 }, kind: "water", label: "River Mersey (via yard drains)" },
    ],
    hydrants: [
      { label: "H1", coords: { lat: 53.4074, lng: -2.1502 }, street: "Lancashire Hill" },
      { label: "H2", coords: { lat: 53.4087, lng: -2.1477 }, street: "Yard entrance" },
    ],
    landmarks: [
      { pos: { x: -8, y: -22 }, kind: "car", label: "Tank wagon (3YE) — LEAKING" },
      { pos: { x: 8, y: -22 }, kind: "car", label: "Tank wagon" },
      { pos: { x: -40, y: -22 }, kind: "car", label: "Tank wagon" },
      { pos: { x: 30, y: -38 }, kind: "car", label: "Diesel shunter" },
      { pos: { x: -80, y: -46 }, kind: "lamppost", label: "OLE mast" },
      { pos: { x: -20, y: -46 }, kind: "lamppost", label: "OLE mast" },
      { pos: { x: 40, y: -46 }, kind: "lamppost", label: "OLE mast" },
      { pos: { x: -78, y: 30 }, kind: "car", label: "Staff cars" },
    ],
    hazards: [
      {
        id: "leak-pool",
        pos: { x: -8, y: -20 },
        kind: "chemical",
        label: "Hazchem 3YE — inflammable liquid pooling on the ballast, vapour visible",
        discoverAfterMinOnScene: 1,
      },
      {
        id: "ole-live",
        pos: { x: -20, y: -44 },
        kind: "electrical",
        label: "25 kV OLE — traction current LIVE until Network Rail isolation confirmed",
        knownFromPri: true,
      },
      {
        id: "drains-mersey",
        pos: { x: -30, y: 20 },
        kind: "chemical",
        label: "Yard drains run to the River Mersey — interceptor valve at the south corner",
        knownFromPri: true,
      },
      {
        id: "shunter-ignition",
        pos: { x: 30, y: -36 },
        kind: "structural",
        label: "Diesel shunter within 50 m of the vapour — ignition source until shut down",
        discoverAfterMinOnScene: 3,
      },
    ],
    casualties: [
      {
        id: "cas-exposed-1",
        pos: { x: -62, y: 28 },
        severity: "serious",
        discoverAfterMinBa: 0,
        label: "Yard operative (M, ~35) — vapour exposure, worsening breathing",
        clinical: {
          vitals: {
            rr: 26, spo2: 91, hr: 112, bpSys: 134, bpDia: 86,
            gcs: 15, temp: 36.9, bm: 5.7,
          },
          presumedCondition: "Inhalation exposure — wheeze, chest tightness, streaming eyes",
          redFlags: ["severe_asthma"],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen", "salbutamol_neb"],
        },
      },
      {
        id: "cas-exposed-2",
        pos: { x: -58, y: 31 },
        severity: "walking",
        discoverAfterMinBa: 0,
        label: "Yard operative (M, ~52) — vapour exposure, eye + throat irritation",
        clinical: {
          vitals: {
            rr: 20, spo2: 96, hr: 96, bpSys: 142, bpDia: 88,
            gcs: 15, temp: 36.7, bm: 6.0,
          },
          presumedCondition: "Mild inhalation exposure — irritation, anxious",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Gate / decon", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Siding 4 (hot zone)", face: "rear", bearingDeg: 0 },
      { id: 3, label: "Sector 3 · Container stacks", face: "right", bearingDeg: 90 },
      { id: 4, label: "Sector 4 · Drains / Mersey side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "site-control-first",
      atSec: 6,
      text: "Site control here — we've got product coming off wagon four, it's pooling under the tank and you can see the vapour shimmer. Panel on the wagon reads 3YE. I've pulled everyone back to the gate.",
      tone: "urgent",
    },
    {
      id: "casualties-at-gate",
      atSec: 35,
      text: "The two lads who found it are with me at the gatehouse — both coughing, one's wheezing badly. They walked through the vapour before they knew.",
      tone: "urgent",
    },
    {
      id: "isolation-progress",
      atSec: 90,
      text: "Network Rail are on — isolation request is in for the overheads, they're saying fifteen to twenty minutes. The passenger line's been put on caution, not blocked yet.",
      tone: "info",
    },
    {
      id: "isolation-delay",
      atSec: 300,
      probability: 0.3,
      text: "Network Rail update — the isolation's taking longer than they said, control room issue. Could be another twenty minutes. Overheads still LIVE.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "vapour-drift",
      atSec: 180,
      probability: 0.5,
      text: "The wind's taking the vapour across the yard toward Lancashire Hill — you can smell it at the gate now. Solventy, sweet sort of smell.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "worsening-casualty",
      atSec: 240,
      delayThresholdSec: 480,
      probability: 0.6,
      text: "The wheezy one's getting worse — he's fighting for breath now, we've sat him down but he needs someone quick.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "pool-growing",
      atSec: 360,
      probability: 0.5,
      text: "The pool's still growing — it's reached the ballast edge and it's starting to run along the drainage channel beside the apron.",
      tone: "urgent",
    },
  ],
};
