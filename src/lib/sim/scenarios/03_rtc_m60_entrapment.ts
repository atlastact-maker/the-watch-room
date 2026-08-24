import type { Scenario } from "../incident_types";

/**
 * RTC with entrapment — M60 westbound between Junction 17 and 18,
 * Prestwich. Two cars plus a light goods van: front vehicle a Ford
 * Transit with the driver trapped by the steering column; rear car a
 * Kia hatchback, two adult casualties (one conscious, one serious head
 * injury). Hard shoulder + traffic running in live lanes.
 *
 * Tests: TRU (R2 / R4) extrication, HART or Advanced Paramedic support,
 * police rolling roadblock, NWAS trauma handling with correct MTC
 * selection (Salford Royal). Night call so HEMS may be grounded.
 */
export const scenario03: Scenario = {
  id: "03",
  slug: "03_rtc_m60_entrapment",
  title: "RTC, Persons Trapped — M60 J17→J18",
  type: "rtc_entrapment",
  patch: "Western",
  severity: "high",
  trigger:
    "999 from a lorry driver — three cars piled up on the westbound carriageway, smoke, someone still in the cab",

  location: {
    // M60 westbound, between Junction 17 (Whitefield) and Junction 18
    // (Simister Island) — near the Heaton Park overbridge. Coordinates
    // sit in the westbound running lane.
    address: "M60 westbound between J17 and J18, near Heaton Park overbridge",
    postcode: "M25 0UA",
    coords: { lat: 53.5478, lng: -2.2824 },
  },

  property: {
    class: "Three-lane motorway carriageway",
    size: "RTC footprint ~35 m long, blocking lanes 2–3",
    materials: "Tarmac carriageway, concrete central reservation, steel Armco",
    occupants:
      "Ford Transit LGV driver (M, ~55) trapped by steering column; Kia Ceed driver (F, ~34) + front passenger (M, ~32) conscious with injuries; VW Polo driver (M, ~22) walking wounded",
    vulnerabilities: [
      "LGV driver trapped — extended extrication likely",
      "Fuel spillage suspected from the LGV's split tank",
    ],
    access:
      "Hard shoulder clear initially but will narrow once rolling block imposed. Lane 1 must stay trafficable for approach. Overbridge approach from the east (J17)",
    knownHazards: [
      "Live carriageway — running traffic at 55 mph until rolling block in place",
      "Possible diesel spillage from LGV",
      "Overbridge constrains helicopter landing on immediate scene",
    ],
    firstDueStationId: "G37", // Whitefield
  },

  pri: {
    hasFormalPri: false,
    items: [
      "Highways England / National Highways on the main scheme — request rolling road block via control.",
      "Salford Royal is the designated MTC for the north-west; direct conveyance for the LGV driver once extricated.",
      "HEMS usually off-duty by 23:00 unless NWAA H145 is night-qualified — check availability before requesting.",
    ],
  },

  methane: {
    M: "Stand-by — declaration depends on casualty count once scene confirmed",
    E: "M60 westbound between J17 Whitefield and J18 Simister, ~1.3 km west of J17",
    T: "Three-car RTC with entrapment, one LGV (split fuel tank suspected), motorway",
    H: "Running traffic, fuel spillage, confined working space against Armco",
    A: "Westbound approach from J17; live carriageway — need rolling block",
    N: "4 casualties confirmed — 1 entrapped critical, 2 serious, 1 walking",
    emergencyServices: "Fire, ambulance, police (Roads Policing) all required",
  },

  // Crash Recovery System datasheets — the three involved vehicles.
  // Component positions are schematic percentages (nose-up); guidance
  // follows real CRS conventions (isolation points, SRS hazards,
  // ultra-high-strength steel cutting restrictions).
  crs: [
    {
      id: "veh-transit",
      make: "Ford",
      model: "Transit 350 L3",
      years: "2019–2024",
      vrm: "BN69 KVD",
      fuel: "diesel",
      body: "van",
      notes: [
        "12V battery beneath the DRIVER'S SEAT — isolation is restricted while the driver is trapped; cut both leads as soon as access allows",
        "Diesel tank ruptured in this collision — foam blanket and containment before any cutting or sharp work",
        "Steering-column entrapment: column relocation with a ram footed on the A-pillar base, not dash roll alone",
        "Conventional diesel — no high-voltage system on board",
      ],
      components: [
        // RHD — driver's side is the right of the nose-up schematic.
        {
          kind: "battery_12v",
          label: "12V under driver's seat",
          x: 68,
          y: 92,
          action: {
            id: "isolate-12v",
            label: "Isolate 12V battery",
            detail: "Under the driver's seat — cut and tape both leads",
            durationSec: 90,
            minCrew: 1,
            requiredEquipment: ["small_tools"],
            critical: true,
            done: "BN69 KVD electrically isolated — both 12V leads cut and taped",
          },
        },
        { kind: "airbag", label: "Driver airbag", x: 68, y: 72 },
        { kind: "airbag", label: "Passenger airbag", x: 32, y: 72 },
        { kind: "pretensioner", label: "Pretensioner", x: 16, y: 84 },
        { kind: "pretensioner", label: "Pretensioner", x: 84, y: 84 },
        { kind: "srs_unit", label: "SRS control unit", x: 50, y: 80 },
        {
          kind: "fuel_tank",
          label: "Diesel tank (ruptured)",
          x: 60,
          y: 128,
          w: 24,
          h: 34,
          action: {
            id: "contain-fuel",
            label: "Foam blanket fuel spill",
            detail: "Blanket the ruptured tank and running fuel, dam the drain",
            durationSec: 180,
            minCrew: 2,
            requiredEquipment: ["foam_branch"],
            critical: true,
            done: "Fuel spill blanketed and contained — BN69 KVD tank no longer feeding the carriageway",
          },
        },
      ],
      actions: [
        {
          id: "stabilise",
          label: "Stabilise vehicle",
          detail: "Step blocks and chocks under the sills — kill suspension movement",
          durationSec: 120,
          minCrew: 2,
          requiredEquipment: ["stabiliser_chocks"],
          critical: true,
          done: "BN69 KVD stabilised on blocks and chocks — no movement on the shell",
        },
        {
          id: "glass",
          label: "Glass management",
          detail: "Film the screen, take the side glass out controlled",
          durationSec: 90,
          minCrew: 1,
          requiredEquipment: ["glass_mgmt"],
          done: "BN69 KVD glass managed — screen filmed, side glass removed",
        },
      ],
    },
    {
      id: "veh-ceed",
      make: "Kia",
      model: "Ceed 1.4 T-GDi",
      years: "2018–2023",
      vrm: "MT68 XRF",
      fuel: "petrol",
      body: "car",
      notes: [
        "Hot-formed ultra-high-strength steel at the B-pillar root — cut HIGH or LOW, never mid-pillar",
        "Curtain airbag inflators in both C-pillars — strip the trim before any roof cut",
        "12V battery nearside engine bay; single isolation point",
        "Petrol tank under the rear bench — no cutting below the rear doors",
      ],
      components: [
        {
          kind: "battery_12v",
          label: "12V battery",
          x: 32,
          y: 26,
          action: {
            id: "isolate-12v",
            label: "Isolate 12V battery",
            detail: "Nearside engine bay — single isolation point",
            durationSec: 90,
            minCrew: 1,
            requiredEquipment: ["small_tools"],
            critical: true,
            done: "MT68 XRF electrically isolated — 12V supply cut at the nearside terminal",
          },
        },
        { kind: "airbag", label: "Driver airbag", x: 66, y: 84 },
        { kind: "airbag", label: "Passenger airbag", x: 34, y: 84 },
        { kind: "curtain_airbag", label: "Curtain airbag", x: 12, y: 74, h: 62 },
        { kind: "curtain_airbag", label: "Curtain airbag", x: 88, y: 74, h: 62 },
        { kind: "srs_unit", label: "SRS control unit", x: 50, y: 102 },
        { kind: "pretensioner", label: "Pretensioner", x: 16, y: 112 },
        { kind: "pretensioner", label: "Pretensioner", x: 84, y: 112 },
        { kind: "reinforcement", label: "UHSS B-pillar", x: 10, y: 92, w: 6, h: 40 },
        { kind: "reinforcement", label: "UHSS B-pillar", x: 84, y: 92, w: 6, h: 40 },
        { kind: "fuel_tank", label: "Petrol tank", x: 50, y: 140, w: 32, h: 18 },
      ],
      actions: [
        {
          id: "stabilise",
          label: "Stabilise vehicle",
          detail: "Step blocks under the sills before any cutting on the shell",
          durationSec: 120,
          minCrew: 2,
          requiredEquipment: ["stabiliser_chocks"],
          critical: true,
          done: "MT68 XRF stabilised — blocks in, shell solid for the cut",
        },
        {
          id: "glass",
          label: "Glass management",
          detail: "Screen filmed and side glass out ahead of the pillar cuts",
          durationSec: 90,
          minCrew: 1,
          requiredEquipment: ["glass_mgmt"],
          done: "MT68 XRF glass managed — casualty protected for the cut",
        },
      ],
    },
    {
      id: "veh-polo",
      make: "Volkswagen",
      model: "Polo 1.0 TSI",
      years: "2018–2024",
      vrm: "DK20 HZE",
      fuel: "petrol",
      body: "car",
      notes: [
        "Driver out and walking — vehicle secondary; confirm ignition off and handbrake applied",
        "Undeployed passenger and curtain airbags — maintain clearance from deployment zones",
        "12V battery nearside engine bay",
        "Tailgate gas struts — restrain before cutting rearward",
      ],
      components: [
        {
          kind: "battery_12v",
          label: "12V battery",
          x: 34,
          y: 28,
          action: {
            id: "isolate-12v",
            label: "Isolate 12V battery",
            detail: "Nearside engine bay — vehicle secondary, make dead when hands allow",
            durationSec: 90,
            minCrew: 1,
            requiredEquipment: ["small_tools"],
            done: "DK20 HZE electrically isolated — secondary vehicle made dead",
          },
        },
        { kind: "airbag", label: "Driver airbag", x: 65, y: 86 },
        { kind: "airbag", label: "Passenger airbag", x: 35, y: 86 },
        { kind: "curtain_airbag", label: "Curtain airbag", x: 12, y: 76, h: 56 },
        { kind: "curtain_airbag", label: "Curtain airbag", x: 88, y: 76, h: 56 },
        { kind: "srs_unit", label: "SRS control unit", x: 50, y: 100 },
        { kind: "fuel_tank", label: "Petrol tank", x: 50, y: 136, w: 30, h: 16 },
        // The strut pair shares one action — a single task restrains both.
        {
          kind: "gas_strut",
          label: "Tailgate struts",
          x: 22,
          y: 172,
          action: {
            id: "restrain-struts",
            label: "Restrain tailgate struts",
            detail: "Strap both struts before any rearward cutting",
            durationSec: 120,
            minCrew: 1,
            requiredEquipment: ["small_tools"],
            done: "DK20 HZE tailgate struts restrained — safe to work rearward",
          },
        },
        {
          kind: "gas_strut",
          label: "Tailgate struts",
          x: 78,
          y: 172,
          action: {
            id: "restrain-struts",
            label: "Restrain tailgate struts",
            detail: "Strap both struts before any rearward cutting",
            durationSec: 120,
            minCrew: 1,
            requiredEquipment: ["small_tools"],
            done: "DK20 HZE tailgate struts restrained — safe to work rearward",
          },
        },
      ],
    },
  ],

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT", "TRU_pump"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G37",
      notes: "First in attendance — initial scene safety, fuel containment",
    },
    {
      id: "tru_r2",
      label: "Technical Rescue Pump (R2)",
      service: "Fire",
      requiredApplianceTypes: ["TRU_pump"],
      requiredCapabilities: ["RTC_extrication"],
      notes: "Primary extrication — hydraulic cutters / spreaders / stabilisers",
    },
    {
      id: "tru_r4",
      label: "Technical Rescue Van (R4)",
      service: "Fire",
      requiredApplianceTypes: ["TRU_van"],
      requiredCapabilities: ["RTC_extrication", "Rope"],
      notes: "Specialist rescue support — KED, spine boards, specialist tooling",
    },
    {
      id: "nwas_dca_1",
      label: "Ambulance 1",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      notes: "Primary — serious casualty from rear car",
    },
    {
      id: "nwas_dca_2",
      label: "Ambulance 2",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      notes: "Second — walking wounded + front passenger, plus standby",
    },
    {
      id: "ccc",
      label: "Critical Care Car",
      service: "Ambulance",
      requiredApplianceTypes: ["CCC"],
      requiredCapabilities: ["Trauma"],
      notes: "Doctor-led care for entrapped LGV driver",
    },
    {
      id: "police_response",
      label: "Police — initial scene",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      notes: "Scene protection, traffic direction while rolling block set",
    },
    {
      id: "police_rpu",
      label: "Roads Policing",
      service: "Police",
      requiredApplianceTypes: ["Police_Response", "Police_TraffMot"],
      requiredCapabilities: ["Police_Traffic"],
      notes: "Rolling roadblock coordination, accident investigation",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise first pump + TRU", target: "< 3 minutes" },
      { metric: "First appliance in attendance", target: "< 12 minutes" },
      { metric: "Entrapped driver extricated + conveyed", target: "< 45 minutes" },
      { metric: "Rolling roadblock in place before primary rescue", target: "< 20 minutes" },
      { metric: "LGV driver conveyed to MTC (Salford Royal)", target: "destination correct" },
    ],
    lesson:
      "Classic platinum-ten / golden-hour trauma RTC. Tests tri-service integration — Fire for extrication + fuel, NWAS for trauma care, police for scene. Don't scoop-and-run the entrapped casualty before stabilisation; don't stay-and-play past the extrication window. Correct MTC choice for the critical casualty; nearest A&E for the walking wounded.",
  },

  informantScript: [
    {
      id: "initial",
      atSec: 3,
      text: "The van driver's not moving, I think he's trapped, his door's pushed right in.",
      tone: "critical",
    },
    {
      id: "fuel-smell",
      atSec: 20,
      text: "I can smell diesel — there's a pool forming under the van, it's running down the camber.",
      tone: "urgent",
      effect: { pulseCritical: true },
    },
    {
      id: "second-car",
      atSec: 45,
      text: "The woman in the Kia's bleeding badly from her head, her passenger's holding her up.",
      tone: "urgent",
    },
    {
      id: "traffic-squeeze",
      atSec: 80,
      probability: 0.7,
      text: "Traffic's still running past us in the offside lane — someone's going to go into the back of us.",
      tone: "urgent",
    },
    {
      id: "van-smoking",
      atSec: 150,
      delayThresholdSec: 360,
      probability: 0.5,
      text: "The van's starting to smoke — I think it's from the engine, not a proper fire yet, but it's getting worse.",
      tone: "critical",
      effect: { accelerateGrowthSec: 90, pulseCritical: true },
    },
    {
      id: "driver-deteriorating",
      atSec: 210,
      delayThresholdSec: 420,
      probability: 0.6,
      text: "The van driver's gone quiet, he was groaning before, now he's not responding when we shout.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "near-miss",
      atSec: 300,
      delayThresholdSec: 540,
      probability: 0.4,
      text: "A lorry just came through at speed — nearly took out one of the walking wounded on the hard shoulder.",
      tone: "critical",
    },
  ],

  // Top-down scene — 120 m wide × 40 m deep motorway section. SVG +Y = south.
  // Carriageway runs east-to-west with three westbound lanes + hard shoulder.
  // Wreckage in lane 2/3 with the LGV nose-on to the central reservation.
  scene: {
    viewBox: { x: -60, y: -20, width: 120, height: 40 },
    compassNorth: "up",
    buildings: [
      // Overbridge (Heaton Park Road over the motorway) — shown as a
      // rectangle spanning the carriageway at the eastern edge.
      {
        shape: { x: 42, y: -18, w: 8, h: 36 },
        kind: "other",
        label: "Heaton Park Rd overbridge",
      },
    ],
    roads: [
      // Hard shoulder (north side)
      { shape: { x: -60, y: -12, w: 120, h: 3 }, kind: "pavement", label: "Hard shoulder" },
      // Westbound carriageway — three lanes
      { shape: { x: -60, y: -9, w: 120, h: 11 }, kind: "road", label: "M60 westbound" },
      // Central reservation
      { shape: { x: -60, y: 2, w: 120, h: 2 }, kind: "pavement", label: "Central res." },
      // Eastbound carriageway — runs opposite direction, shown as bleed
      { shape: { x: -60, y: 4, w: 120, h: 11 }, kind: "road", label: "M60 eastbound" },
      // Hard shoulder (south)
      { shape: { x: -60, y: 15, w: 120, h: 3 }, kind: "pavement", label: "Hard shoulder" },
    ],
    // No hydrants on a motorway — fire cover relies on pump tank water +
    // relay from the nearest hydrant on the slip-road (we don't model
    // that distance here; the scenario tests tank-only firefighting if
    // the LGV engine fire develops).
    hydrants: [],
    landmarks: [
      // The wreckage — three vehicles roughly in lanes 2/3
      { pos: { x: -2, y: -4 }, kind: "car", label: "LGV (trapped)" },
      { pos: { x: 8, y: -2 }, kind: "car", label: "Kia Ceed" },
      { pos: { x: 18, y: 0 }, kind: "car", label: "VW Polo" },
      // Debris field
      { pos: { x: 4, y: -6 }, kind: "tree" },
      { pos: { x: 12, y: -4 }, kind: "tree" },
      // Cones for the rolling block
      { pos: { x: 32, y: -8 }, kind: "lamppost", label: "Advance warning" },
    ],
    // No structural fire seat on the RTC — the van may develop an engine
    // fire via the informant's "van smoking" beat, but authored as zero
    // initially. Setting fireSeat with small radius + low growth so the
    // sim has something to tick against if the informant beat fires.
    fireSeat: {
      pos: { x: -2, y: -4 },
      radiusM: 0,
      growthRateMpm: 0.0,
      maxRadiusM: 4,
      material: "vehicle",
    },
    hazards: [
      {
        id: "fuel-spill",
        pos: { x: -2, y: -3 },
        kind: "chemical",
        label: "Diesel spillage — LGV split tank",
        knownFromPri: false,
        discoverAfterMinOnScene: 1,
      },
      {
        id: "live-traffic",
        pos: { x: -20, y: -2 },
        kind: "structural",
        label: "Running traffic in lane 1 — rolling block required",
        knownFromPri: true,
      },
      {
        id: "overbridge-height",
        pos: { x: 46, y: 0 },
        kind: "structural",
        label: "Low overbridge — no helicopter overhead approach",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-1",
        pos: { x: -2, y: -4 },
        severity: "critical",
        discoverAfterMinBa: 0,
        label: "LGV driver (M, ~55) — trapped, steering column impingement",
        clinical: {
          vitals: {
            rr: 30,
            spo2: 88,
            hr: 132,
            bpSys: 86,
            bpDia: 52,
            gcs: 12,
            temp: 35.8,
            bm: 6.1,
          },
          presumedCondition:
            "Crushing lower-limb injury, suspected pelvic fracture, hypovolaemic",
          redFlags: ["major_haemorrhage", "hypovolaemic_shock", "spinal_injury_suspected"],
          preferredDestination: "mtc",
          criticalInterventions: ["oxygen", "iv_access", "fluids", "tXA", "pelvic_binder"],
        },
      },
      {
        id: "cas-2",
        pos: { x: 8, y: -2 },
        severity: "serious",
        discoverAfterMinBa: 0,
        label: "Kia driver (F, ~34) — scalp laceration, ?C-spine",
        clinical: {
          vitals: {
            rr: 22,
            spo2: 95,
            hr: 104,
            bpSys: 118,
            bpDia: 76,
            gcs: 14,
            temp: 36.7,
            bm: 5.8,
          },
          presumedCondition: "Head lac + whiplash, minor shock",
          redFlags: ["spinal_injury_suspected"],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen", "iv_access", "spine_board"],
        },
      },
      {
        id: "cas-3",
        pos: { x: 10, y: -1 },
        severity: "serious",
        discoverAfterMinBa: 0,
        label: "Kia front-seat passenger (M, ~32) — chest pain, ?sternal fracture",
        clinical: {
          vitals: {
            rr: 24,
            spo2: 93,
            hr: 110,
            bpSys: 122,
            bpDia: 80,
            gcs: 15,
            temp: 36.6,
            bm: 5.4,
          },
          presumedCondition: "Blunt chest trauma, seatbelt bruising",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen", "iv_access"],
        },
      },
      {
        id: "cas-4",
        pos: { x: 18, y: 0 },
        severity: "walking",
        discoverAfterMinBa: 0,
        label: "VW Polo driver (M, ~22) — walking wounded, shock",
        clinical: {
          vitals: {
            rr: 18,
            spo2: 99,
            hr: 94,
            bpSys: 128,
            bpDia: 82,
            gcs: 15,
            temp: 36.9,
            bm: 5.6,
          },
          presumedCondition: "Abrasions, shaken up, no major injury",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          criticalInterventions: [],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Wreckage", face: "front", bearingDeg: 270 },
      { id: 2, label: "Sector 2 · Traffic block east", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Offload / CCS", face: "rear", bearingDeg: 180 },
      { id: 4, label: "Sector 4 · Fuel / Hazmat", face: "left", bearingDeg: 0 },
    ],
  },
};
