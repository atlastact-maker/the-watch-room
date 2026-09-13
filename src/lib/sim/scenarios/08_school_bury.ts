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
          ageYears: 14,
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

  // The call as Malcolm has it: on his mobile on the front car park, the
  // sports hall fire doors banging open behind him and the DT room
  // windows lit orange at the far end of the site. Thirty years on this
  // patch — he wants two engines and he wants them round the back.
  call: {
    caller: {
      name: "Malcolm Parry",
      phone: "07700 900445",
      relation: "Site caretaker — sole keyholder",
      where: "Front car park, Hawthorne Brook High — by the staff bays, the tech block windows lit at the far end of the site",
      line: "mobile",
      state: "calm",
    },
    opening:
      "Right — it's Malcolm Parry, I'm the caretaker at Hawthorne Brook High on Manchester Road, Bury. We've got a fire in the tech block, the design technology room at the far end. I've hit the alarm and I'm getting the swimming club out of the pool. You'll want a couple of engines, it's going well.",
    deflection: "I've told you what it is. Are they on their way or not?",
    reassurance: {
      text: "Malcolm, they're coming. Stay with me and give me what you can see, and I'll get it straight to the crews.",
      reply: "Aye. Go on.",
    },
    answers: {
      f_seen: {
        text: "Flames in the design tech room — the big workshop at the end of the tech block, ground floor. I can see them through the windows from the car park, orange, up to the ceiling. There's black smoke coming out of the roof vents, proper black.",
        tone: "urgent",
      },
      f_where: {
        text: "The tech block — it's the separate building on the east side of the site, the old one. Ground floor, the east end, the DT workshop. Not the main block — that's a separate building, but it's only a few yards off it, there's just the path between them.",
      },
      f_spread: {
        text: "It's building. When I first came past it was one bench going, now it's the whole end of the room. It's timber floors in there, the old block, it'll go through that. Nothing's touched the main block, not yet.",
        tone: "urgent",
      },
      f_started: {
        text: "I set the alarm off five minutes ago, when I saw it — I was doing my lock-up round. The block's been empty since half four though, so it could've been going a while in there before I came past.",
      },
      f_building: {
        text: "Secondary school. Seventies build. Three buildings — the main block's three storeys, concrete frame; the sports hall with the pool, that's the west end; and the tech block, which is the one going. That's the old bit — brick, timber floors, flat felt roof.",
      },
      f_inside: {
        text: "Not in the tech block, no — it's locked, it's been locked since half four, I've got the only keys. The swimming club's in the sports hall, that's the other side of the site — twenty-five kids and two instructors. They're coming out now, Chidi's bringing them out the fire doors onto the car park.",
        followUps: [
          {
            id: "f_inside_count",
            text: "Are all of the swimmers accounted for?",
            answer: {
              text: "They're doing the register now — Chidi's got the list. They were all in the pool when I went in. I'll tell you the minute they've counted them.",
            },
          },
          {
            id: "f_inside_staff",
            text: "Any other staff on site — cleaners, anyone in the main block?",
            answer: {
              text: "No. Cleaners finish at six. It's me and the swim club, that's your lot. The Head's not here — I'll ring her once I'm off to you.",
            },
          },
        ],
      },
      f_hurt: {
        text: "No. Nobody's hurt. The kids are wet and it's cold and dark, that's the worst of it at the minute. I've had them go to the far end of the car park, away from it.",
      },
      f_vulnerable: {
        text: "The swimmers are all kids — eleven up to fifteen or so. They can all walk, there's nothing like that. It's just they're stood in their cossies in the dark, and once word gets round you'll have parents turning up.",
      },
      f_hazards: {
        text: "Yes — listen. The chemistry lab's on the second floor of the main block, acids and solvents, that's a separate building though. The pool plant room's got the chlorine in it, sports hall side. And the IT server room's next door to the DT room, that's all live. What the DT lot keep in their store I couldn't tell you — there's a kiln in there and the machines. It's all on the plan you've got for us.",
      },
      f_danger: {
        text: "Not really. The yard round the back's dark, there's no lights on back there — I'll get them on. There's a live supply into the tech block, the switch room's by the yard.",
      },
      f_access: {
        text: "Main gate off Manchester Road, the car park's at the front and it's open, that's clear. The tech block you get at from the service yard round the back — the yard's locked, I've got the keys.",
        followUps: [
          {
            id: "f_access_yard",
            text: "Will a fire engine get into that yard?",
            answer: {
              text: "Aye, it's a double gate, the bin wagon gets in. Come off the access road on the right-hand side of the site, past the tech block, and the gate's at the top.",
            },
          },
        ],
      },
      f_safe: {
        text: "I'm fine. I'm on the car park, well back from it — there's the whole width of the car park between me and it, a good fifty yards.",
      },
      f_stay: {
        text: "I can, but I need to get over to the sports hall and see they've all got out. I'll walk over while I'm talking to you.",
      },
      f_details: {
        text: "Malcolm Parry. P-A-R-R-Y. This is my mobile, 07700 900445. Site caretaker.",
      },
    },
    interjections: [
      {
        atSec: 40,
        text: "Hang on — one of the windows has just gone, I heard it go. There's a lot more flame now, it's coming out the window.",
        tone: "urgent",
      },
      {
        atSec: 95,
        text: "Have you got somebody coming, or what? I've got twenty-odd kids in swimming costumes stood on a car park.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 140,
        text: "I can hear them — sirens, coming up Manchester Road. I'll get down the yard and have the gate open for them.",
        requiresOpened: true,
      },
      {
        atSec: 200,
        text: "Chidi's got the Head on his phone — she's on her way in. She'll want to know who's in charge when she gets here, tell your officer.",
      },
    ],
    onDispatch: "Right. Good. Manchester Road, the main gate — I'll be on the car park where they can see me.",
  },
};
