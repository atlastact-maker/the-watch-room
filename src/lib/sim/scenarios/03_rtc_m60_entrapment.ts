import type { Scenario } from "../incident_types";

/**
 * RTC with entrapment — M60 eastbound (clockwise) between Junction 17
 * and 18, Prestwich. Two cars plus a light goods van: front vehicle a Ford
 * Transit with the driver trapped by the steering column; rear car a
 * Kia hatchback, two adult casualties (one conscious, one serious head
 * injury). Hard shoulder + traffic running in live lanes.
 *
 * Tests: TRU (R2 / R4) extrication, HART or Advanced Paramedic support,
 * police rolling roadblock, NWAS trauma handling with correct MTC
 * selection (Salford Royal). The aircraft may be grounded — the
 * Critical Care Car is the fallback.
 */
export const scenario03: Scenario = {
  id: "03",
  slug: "03_rtc_m60_entrapment",
  title: "RTC, Persons Trapped — M60 J17→J18",
  type: "rtc_entrapment",
  patch: "Western",
  severity: "high",
  trigger:
    "999 from a lorry driver — a van and two cars piled up on the eastbound carriageway, smoke, someone still in the cab",

  location: {
    // M60 eastbound (clockwise), between Junction 17 (Whitefield) and
    // Junction 18 (Simister Island) — ~1 km east of J17, just short of an
    // overbridge. Coordinates sit in the eastbound running lane.
    address: "M60 eastbound (clockwise) between J17 and J18, Prestwich",
    postcode: "M25 0UA",
    coords: { lat: 53.5478, lng: -2.2824 },
  },

  property: {
    class: "Three-lane motorway carriageway",
    size: "RTC footprint ~35 m long, blocking lanes 2–3",
    materials: "Tarmac carriageway, concrete central reservation, steel Armco",
    occupants:
      "Ford Transit LGV driver (M, ~55) trapped by steering column; Kia Ceed driver (F, ~34) scalp laceration, ?C-spine + front passenger (M, ~32) chest pain, seatbelt bruising; VW Polo driver (M, ~22) walking wounded",
    vulnerabilities: [
      "LGV driver trapped — extended extrication likely",
      "Fuel spillage suspected from the LGV's split tank",
    ],
    access:
      "Hard shoulder clear initially but will narrow once rolling block imposed. Lane 1 must stay trafficable for approach. Approach eastbound from J17 (upstream, to the west); the overbridge is beyond the wreck",
    knownHazards: [
      "Live carriageway — running traffic at 60–70 mph (no variable limit set yet) until rolling block in place",
      "Possible diesel spillage from LGV",
      "Overbridge constrains helicopter landing on immediate scene",
    ],
    firstDueStationId: "G37", // Whitefield
  },

  pri: {
    hasFormalPri: false,
    items: [
      "National Highways on the main scheme — request rolling road block from the J17 on-slip via control.",
      "Salford Royal is the GM MTC for blunt and cranial major trauma (Pathfinder); direct conveyance for the LGV driver once extricated.",
      "NWAA may be grounded overnight or by weather — request the Critical Care Car (HX) from Barton and check aircraft availability before asking for HEMS.",
    ],
  },

  methane: {
    M: "Stand-by — declaration depends on casualty count once scene confirmed",
    E: "M60 eastbound (clockwise) between J17 Whitefield and J18 Simister, ~1 km east of J17, 1.6 km west of J18",
    T: "Three-vehicle RTC (LGV + two cars) with entrapment, LGV split fuel tank suspected, motorway",
    H: "Running traffic, fuel spillage, confined working space against Armco",
    A: "Eastbound approach from J17 (upstream); live carriageway — need rolling block from the J17 on-slip",
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
        "12V battery beneath the DRIVER'S SEAT — reach it from the passenger side; isolate before any cutting near the column",
        "Diesel tank ruptured in this collision — foam blanket and containment before any cutting or sharp work",
        "Steering-column entrapment: dash roll with the ram footed at the A-pillar base to lift the column off the driver",
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
            detail: "Under the driver's seat, from the passenger side — cut and tape both leads",
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
      notes: "Rolling roadblock coordination, collision investigation",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise first pump + TRU", target: "< 3 minutes" },
      { metric: "First appliance in attendance", target: "< 12 minutes" },
      { metric: "Entrapped LGV driver released", target: "Controlled release — every critical CRS action done before cutting" },
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
      text: "The Astra fella's shouting back — the woman in the Kia's bleeding from her head, her passenger's holding her up.",
      tone: "urgent",
    },
    {
      id: "traffic-squeeze",
      atSec: 80,
      probability: 0.7,
      text: "Traffic's still coming through in lane one, right past the shoulder — someone's going to go into the back of us.",
      tone: "urgent",
    },
    {
      id: "van-smoking",
      atSec: 150,
      delayThresholdSec: 360,
      probability: 0.5,
      text: "The van's starting to smoke — I think it's from the engine, not a proper fire yet, but it's getting worse.",
      tone: "critical",
      effect: { igniteFire: { radiusM: 0.5, growthRateMpm: 0.3 }, pulseCritical: true },
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
      text: "A lorry just came through at speed — nearly took out the Astra fella crossing back to his car on the shoulder.",
      tone: "critical",
    },
  ],

  // Top-down scene — 120 m wide × 40 m deep motorway section. SVG +Y = south.
  // Carriageway runs west-to-east: three eastbound lanes with the hard
  // shoulder on the north (nearside) edge and the central reservation to
  // the south, westbound beyond that. Traffic arrives from the west (J17).
  // Wreckage in lane 2/3 with the LGV at the front (east), nose-on to the
  // central reservation; the overbridge is downstream of the wreck.
  scene: {
    viewBox: { x: -60, y: -20, width: 120, height: 40 },
    compassNorth: "up",
    buildings: [
      // Overbridge — shown as a rectangle spanning the carriageway at the
      // eastern edge, downstream of the wreck.
      {
        shape: { x: 42, y: -18, w: 8, h: 36 },
        kind: "other",
        label: "Overbridge",
      },
    ],
    roads: [
      // Hard shoulder (north side — nearside for eastbound)
      { shape: { x: -60, y: -12, w: 120, h: 3 }, kind: "pavement", label: "Hard shoulder" },
      // Eastbound carriageway — three lanes
      { shape: { x: -60, y: -9, w: 120, h: 11 }, kind: "road", label: "M60 eastbound" },
      // Central reservation
      { shape: { x: -60, y: 2, w: 120, h: 2 }, kind: "pavement", label: "Central res." },
      // Westbound carriageway — runs opposite direction, shown as bleed
      { shape: { x: -60, y: 4, w: 120, h: 11 }, kind: "road", label: "M60 westbound" },
      // Hard shoulder (south)
      { shape: { x: -60, y: 15, w: 120, h: 3 }, kind: "pavement", label: "Hard shoulder" },
    ],
    // No hydrants on a motorway — fire cover relies on pump tank water +
    // relay from the nearest hydrant on the slip-road (we don't model
    // that distance here; the scenario tests tank-only firefighting if
    // the LGV engine fire develops).
    hydrants: [],
    landmarks: [
      // The wreckage — three vehicles roughly in lanes 2/3, LGV at the front
      { pos: { x: 18, y: -4 }, kind: "car", label: "LGV (trapped)" },
      { pos: { x: 8, y: -2 }, kind: "car", label: "Kia Ceed" },
      { pos: { x: -2, y: 0 }, kind: "car", label: "VW Polo" },
      // Stopped behind the wreck on the hard shoulder — the witness's Astra
      // and the caller's artic
      { pos: { x: -12, y: -10 }, kind: "car", label: "Astra (witness)" },
      { pos: { x: -45, y: -10 }, kind: "car", label: "HGV (caller)" },
      // Debris field
      { pos: { x: 4, y: -6 }, kind: "other", label: "Debris" },
      { pos: { x: 12, y: -4 }, kind: "other", label: "Debris" },
      // Cones for the rolling block — upstream, west of the wreck
      { pos: { x: -32, y: -8 }, kind: "other", label: "Cones — advance warning" },
    ],
    // No fire on the RTC as authored — the seat sits at zero radius and
    // zero growth, and the informant's "van smoking" beat ignites it
    // (effect.igniteFire) on the runs where it fires.
    fireSeat: {
      pos: { x: 18, y: -4 },
      radiusM: 0,
      growthRateMpm: 0.0,
      maxRadiusM: 4,
      material: "vehicle",
    },
    hazards: [
      {
        id: "fuel-spill",
        pos: { x: 18, y: -3 },
        kind: "chemical",
        label: "Diesel spillage — LGV split tank",
        knownFromPri: false,
        discoverAfterMinOnScene: 1,
      },
      {
        id: "live-traffic",
        pos: { x: -30, y: -7 },
        kind: "structural",
        label: "Running traffic in lane 1 from the west — rolling block required",
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
        pos: { x: 18, y: -4 },
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
          ageYears: 55,
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
          ageYears: 34,
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
          ageYears: 32,
          presumedCondition: "Blunt chest trauma, seatbelt bruising",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen", "iv_access"],
        },
      },
      {
        id: "cas-4",
        pos: { x: -40, y: -10 },
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
          ageYears: 22,
          presumedCondition: "Abrasions, shaken up, no major injury",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          criticalInterventions: [],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Wreckage", face: "front", bearingDeg: 90 },
      { id: 2, label: "Sector 2 · Traffic block west", face: "right", bearingDeg: 270 },
      { id: 3, label: "Sector 3 · Offload / CCS", face: "rear", bearingDeg: 180 },
      { id: 4, label: "Sector 4 · Fuel / Hazmat", face: "left", bearingDeg: 0 },
    ],
  },
  // The call as Darren has it: stood by the cab of a forty-four-tonner
  // on the hard shoulder, fifty yards back from the wreck, beacons going,
  // lane one still live beside him. He drives this road every night. He
  // will not walk up the carriageway, and he says so.
  call: {
    caller: {
      name: "Darren Brennan",
      phone: "07700 900184",
      relation: "HGV driver — two vehicles behind the Polo, stopped clear of the debris",
      where: "Hard shoulder, M60 eastbound, about 50 m west of the wreckage, beside his artic",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "There's been a crash on the M60 — eastbound, clockwise, between seventeen and eighteen, just before the bridge. Three of them, a van and two cars, all gone into each other. There's smoke coming off the van and the driver's still in it, he's not moving. You need to get everyone — fire, ambulance, the lot.",
    deflection: "I've told you — there's a bloke trapped in a van on the M60! What else d'you need to know?",
    reassurance: {
      text: "Darren, they're on their way — fire, ambulance and police. I need you to stay behind your barrier and keep telling me what you can see. Can you do that?",
      reply: "…Yeah. Yeah. Sorry. Go on.",
    },
    answers: {
      f_seen: {
        text: "Three vehicles gone into each other across lanes two and three. White Transit at the front with its nose in the central barrier — a grey Kia's gone into the back of it, and a little red Polo's into the back of the Kia. There's white smoke or steam coming off the front of the van. Glass and bits all over the road.",
        tone: "urgent",
      },
      f_where: {
        text: "It's not a building, love, it's the motorway. M60 eastbound, clockwise, between seventeen and eighteen — they've gone into each other just short of the bridge, fifty yards before it. Lanes two and three are blocked. Lane one's still open and they're still coming through it.",
      },
      f_spread: {
        text: "The smoke off the van's not got any worse that I can see — it's whitish, I think it's the radiator. There's a smell of diesel, though. Strong. I'll tell you if it changes.",
      },
      f_started: {
        text: "Two, three minutes. It happened right in front of me — I was two back from the Polo. I've got the wagon on the hard shoulder and rung you straight off.",
      },
      f_building: {
        text: "There's no building. Three lanes and a hard shoulder, steel barrier down the middle, a bridge over the top just past them. I'm on the hard shoulder about fifty yards back from it with my beacons going.",
      },
      f_inside: {
        text: "The van driver — he's still in his cab and he's not moving. His door's pushed right in on him. The two in the Kia are still sat in it, a woman driving and a fella next to her. The Polo lad's out, he's stood here with me.",
        tone: "critical",
        followUps: [
          {
            id: "f_inside_van",
            text: "The van driver — is he conscious? Is he breathing?",
            answer: {
              text: "I can't tell you from here, I've not been up to him. There's a fella from an Astra up there, he's been shouting at him through the window — he shouted back to me that he's groaning, so he's breathing, but he's not answering. I'm not walking up the live lane to check, I'll be under the next lorry.",
              tone: "urgent",
            },
          },
          {
            id: "f_inside_kia",
            text: "The two in the Kia — can they get themselves out?",
            answer: {
              text: "The fella in the passenger seat's moving, he's turned round to the woman. I can't see her properly from here. The Astra bloke's gone over to them.",
            },
          },
        ],
      },
      f_hurt: {
        text: "The van driver, for definite — he's not moved since. The woman in the Kia, the fella with her's shouting for help, so I'd say yes. The lad from the Polo's cut his hands and he's shaking, but he's on his feet.",
        tone: "urgent",
      },
      f_vulnerable: {
        text: "The van driver, if he's trapped — he's not getting himself out of that. The rest are grown-ups — no kids that I've seen or heard, and nobody's shouting about any.",
      },
      f_hazards: {
        text: "Diesel — I can smell it from here, and that Transit'll have a good tank on it. The cars'll be petrol. No load on the van that I know of, it's a courier van, parcels.",
        followUps: [
          {
            id: "f_hazards_fuel",
            text: "Can you see where the diesel is coming from?",
            answer: {
              text: "Not from here. It's under the van somewhere, the smell's coming from that end. I'm not going up to look.",
            },
          },
        ],
      },
      f_danger: {
        text: "The traffic. That's the danger. Lane one's live and they're coming through at sixty, seventy, right past us. Nobody's slowing down. And the diesel.",
        tone: "urgent",
        needsCalm: true,
      },
      f_access: {
        text: "Eastbound — clockwise — from seventeen. The hard shoulder's clear up to my wagon — I'm fifty yards back from it, then there's a silver Astra just behind the Polo. Nothing's getting past in two and three. Come up the shoulder and I'll shift the wagon back if you need me to.",
        needsCalm: true,
        followUps: [
          {
            id: "f_access_bridge",
            text: "Are you before or after the bridge?",
            answer: {
              text: "Before it — coming clockwise from seventeen you're on them fifty yards short of the bridge. I'm behind them on the shoulder, so the bridge is past the lot of us.",
            },
          },
        ],
      },
      f_safe: {
        text: "I'm on the hard shoulder by my cab, behind the barrier when I can be. It's not safe, love, it's the M60. But I'm as far off the road as I can get.",
      },
      f_stay: {
        text: "Yeah. I'm not going anywhere, I've a wagon on the shoulder. I'll stay on.",
      },
      f_details: {
        text: "Darren Brennan. I'm on my mobile — 07700 900184. I drive for Pennine Reach — the artic's KX70 RVJ, it's on the shoulder behind me.",
      },
    },
    interjections: [
      {
        atSec: 60,
        text: "I've got my beacons on and I've put the triangle out behind the wagon. That's all I can do from here.",
      },
      {
        atSec: 130,
        text: "Where are you? It's been five minutes. There's a bloke dying in that van and there's nothing coming — nothing!",
        tone: "urgent",
        requiresOpened: false,
        effect: { state: "hostile" },
      },
      {
        atSec: 200,
        text: "I can hear sirens — somewhere back towards Whitefield. Is that yours? Tell me that's yours.",
        requiresOpened: true,
        effect: { state: "anxious" },
      },
      {
        atSec: 280,
        text: "The Polo lad's stood here with me on the shoulder, I've got him behind the barrier. He's shaking like a leaf, keeps saying it weren't his fault.",
      },
    ],
    onDispatch: "Right. Good. Tell them to come up the hard shoulder — I'll keep my beacons on so they can see where we are.",
  },
};
