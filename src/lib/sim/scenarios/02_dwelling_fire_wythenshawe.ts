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
      "Local intel: previous fatal house fire on the estate; local commanders prefer 4-pump make-up if persons confirmed.",
    ],
  },

  methane: {
    M: "No",
    E: "285 Hollyhedge Road, M22 — neighbour at no. 287 has called",
    T: "House fire — smoke from upper windows, neighbour heard shouting",
    H: "Gas meter believed inside, parked cars on road",
    A: "Driveway clear, no width restriction",
    N: "Unknown — family of 4 believed inside",
    emergencyServices: "Fire, ambulance running, police informed for cordon and traffic",
  },

  // Slot ids match the standard persons-reported attendance (pda-standard
  // pump1/pump2/pump3/officer/ambulance) so the desk's fill and the
  // debrief's conformance read the same list. The aerial and police are
  // make-up, not PDA: an HLP/TL on persons confirmed at an upper floor,
  // and GMP informed for cordon, traffic and family welfare on the
  // pavement — neither is mobilised on the initial call.
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
      id: "pump3",
      label: "Pump 3",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT", "TRU_pump"],
      requiredCapabilities: ["BA"],
      notes: "Persons-reported uplift — BA relief and the exposure at 287. Make-up to 4 on persons confirmed; aerial then, not before",
    },
    {
      id: "officer",
      label: "Station Manager",
      service: "Fire",
      requiredApplianceTypes: ["FIRE_SM"],
      requiredCapabilities: ["Command"],
      notes: "Nearest Station Manager — persons reported brings the officer",
    },
    {
      id: "ambulance",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      notes: "One DCA with the PDA when persons are reported; police informed, not mobilised",
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
    // Stairs from the back bedroom, in a fire.
    egressExtraSeconds: 120,
    // What this building will not take. Prose above; a locked option
    // with its reason on it here.
    egressBlocked: [
      { action: "trolley", reason: "Stairs to the back bedroom with a loft conversion above them — the trolley waits on the drive" },
    ],
    buildings: [
      {
        // 7 × 8 m footprint — ~56 m² a floor, the ~95 m² over two storeys.
        shape: { x: -3.5, y: -5, w: 7, h: 8 },
        kind: "target",
        label: "285 Hollyhedge Rd",
      },
      {
        // Attached neighbour (semi-detached partner) — no.287, the caller
        shape: { x: 3.5, y: -5, w: 7, h: 8 },
        kind: "neighbour",
        label: "287 (attached)",
      },
      {
        // Neighbour on the other side — no.283
        shape: { x: -19, y: -5, w: 7, h: 8 },
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
      { shape: { x: -28, y: -22, w: 60, h: 17 }, kind: "garden" },
      // Front gardens / driveways strip
      { shape: { x: -28, y: 3, w: 60, h: 7 }, kind: "garden" },
      // Pavement front of houses
      { shape: { x: -40, y: 10, w: 80, h: 2 }, kind: "pavement" },
      // Road
      { shape: { x: -40, y: 12, w: 80, h: 8 }, kind: "road", label: "Hollyhedge Road" },
      // Pavement opposite
      { shape: { x: -40, y: 20, w: 80, h: 2 }, kind: "pavement" },
      // Driveway in front of target
      { shape: { x: -2, y: 3, w: 4, h: 7 }, kind: "driveway" },
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
    // Default seat — kitchen chip-pan at the rear (north). Half of runs
    // keep it; the origin roll below can move the seat to the lounge
    // (electrical — isolate before water) or the upstairs bedroom
    // (cigarette — right next to where the boy sleeps). The material is
    // hidden until a 360 survey confirms it.
    fireSeat: {
      pos: { x: 0, y: -3 },
      radiusM: 2.5,
      // Below the exterior-attack rate (0.18) only just: a jet from outside
      // holds it, and only an interior attack or BA on the search shrinks it.
      growthRateMpm: 0.18,
      suppressionPerBaMpm: 0.08,
      maxRadiusM: 14,
      material: "structural",
      unknownMaterial: true,
    },
    fireOriginVariants: [
      {
        probability: 0.3,
        label: "Lounge — electrical fault",
        pos: { x: -2, y: 1 },
        material: "electrical",
      },
      {
        probability: 0.2,
        label: "Upstairs bedroom — cigarette",
        pos: { x: 1, y: -4 },
        material: "structural",
        radiusM: 2,
        growthRateMpm: 0.22,
      },
    ],
    // The attached semi at no. 287 — the fire is through the party wall
    // once it reaches ~6 m (about 19 unsuppressed minutes from the
    // kitchen seat). Breaching it is a scored failure.
    exposureRisk: { atRadiusM: 6, label: "No. 287 (attached neighbour)" },
    hazards: [
      {
        id: "gas-meter",
        pos: { x: -2, y: -4 },
        kind: "gas",
        label: "Gas meter (cupboard under stairs)",
        knownFromPri: true,
      },
      {
        // On the property record and in the caller's own words — the
        // desk knows it before anyone is on scene.
        id: "loft-conversion",
        pos: { x: 0, y: -4 },
        kind: "structural",
        label: "Non-conforming loft conversion — single staircase",
        knownFromPri: true,
      },
      {
        id: "utility-paint",
        pos: { x: -3, y: 0 },
        kind: "chemical",
        label: "Paint / solvent storage (utility cupboard)",
        discoverAfterMinOnScene: 6,
      },
      {
        // Isolating this restores water effectiveness on lounge-origin
        // (electrical) runs; on other origins it's good practice anyway.
        id: "house-supply",
        pos: { x: -2, y: -2 },
        kind: "electrical",
        label: "Consumer unit — cupboard under stairs, isolate the house supply",
        discoverAfterMinOnScene: 2,
      },
    ],
    // Persons reality (per the approved brief): ~33% of runs the whole
    // family is out on the pavement; ~67% the boy is still in the back
    // bedroom; and on slow responses his father may go back in after him
    // (the second-casualty beat reveals cas-2). Roughly 33 / 37 / 30
    // across all-out / one-inside / two-inside.
    casualties: [
      {
        // "serious" on the sim's clock, not the vitals: the engine drops a
        // grade every 600 s from the call (480 s while he is unfound in
        // the smoke), so a critical five-year-old is lost before the
        // 14-minute BA target the job sets. Serious keeps him survivable
        // to a BA team that is in on time and an ambulance paired with him.
        id: "cas-1",
        pos: { x: 2, y: -4 },
        severity: "serious",
        discoverAfterMinBa: 2,
        presentProbability: 0.67,
        label: "Child (5) — back bedroom",
        clinical: {
          vitals: {
            rr: 32, spo2: 86, hr: 148, bpSys: 88, bpDia: 52,
            gcs: 9, temp: 37.2, bm: 6.4,
          },
          ageYears: 5,
          presumedCondition: "Smoke-inhalation · burns ~ 8% · paediatric trauma",
          // Shocked, not bleeding. A burn loses fluid; it does not
          // haemorrhage, and tXA is a drug for traumatic bleeding.
          redFlags: ["airway_compromise", "hypovolaemic_shock"],
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
          ageYears: 38,
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
  // Every beat is Pauline, the neighbour, on her own step — relaying what
  // Kelly and Graham tell her. She never hands the phone over.
  informantScript: [
    {
      // Origin-neutral — the seat of fire varies per run and the caller
      // wouldn't reliably know it anyway.
      id: "ack",
      atSec: 4,
      text: "Please hurry, the house is full of smoke — it's pouring out of the windows and I can see the glow inside!",
      tone: "urgent",
    },
    {
      id: "child-upstairs",
      atSec: 25,
      requiresCasualtyIds: ["cas-1"],
      text: "Kelly's here — she's got Ella, and Dan's out with her, they got out the back. But Theo's still upstairs, in the back bedroom. Nobody can get back in — the hallway's black with smoke.",
      tone: "critical",
    },
    {
      // The other side of the persons-reality roll — everyone's out.
      // The house is still going like a train; only the pressure changes.
      id: "all-out",
      atSec: 30,
      requiresAbsentCasualtyIds: ["cas-1"],
      text: "Wait — they're out! They're ALL out — Kelly's got both kids with her, here on my step, and Dan's out. Everyone's accounted for. The house has properly gone up though, the whole back of it.",
      tone: "urgent",
    },
    {
      // Graham is Pauline's husband, next door at 287. Someone at the back
      // window only when someone is actually in the building this run.
      id: "back-window",
      atSec: 40,
      requiresCasualtyIds: ["cas-1"],
      text: "My husband Graham's gone round the back — he says there's someone at the back bedroom window, banging on it.",
      tone: "critical",
    },
    {
      // Heat through the party wall — 287 is Pauline's own house. Only on
      // a slow attendance, when the fire has had time to reach it.
      id: "neighbour",
      atSec: 400,
      delayThresholdSec: 400,
      probability: 0.7,
      text: "Graham says our wall's getting warm in the back bedroom — it's coming through the party wall.",
      tone: "info",
    },
    {
      id: "flames-upstairs",
      atSec: 90,
      delayThresholdSec: 270,
      probability: 0.8,
      requiresCasualtyIds: ["cas-1"],
      text: "There are flames at the upstairs window now, it's really gone up — I can't see Theo.",
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
      text: "Dan's gone back in for Theo — he hasn't come out. They're both in there.",
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

  // The call as Pauline has it: on the house phone at 287, on her front
  // step, watching the top windows of the semi next door. She knows the
  // family; she knows the little one will not have heard the alarm.
  // Her answers are origin-neutral — the seat is rolled per run and she
  // can only see smoke and a glow from the step.
  call: {
    caller: {
      name: "Pauline Hargreaves",
      phone: "0161 496 0287",
      relation: "Neighbour at no. 287",
      where: "Her own front step, the attached semi at 287",
      line: "landline",
      state: "anxious",
    },
    opening:
      "It's next door — 285, Hollyhedge Road — there's smoke coming out the top windows and I can hear the kids shouting. It's Kelly and Dan's, there's four of them in there. Please, quick.",
    deflection: "I don't know, I don't know — just get them here, please!",
    reassurance: {
      text: "Pauline, listen to me. Help is coming. Stay on your step, and just tell me what you can see.",
      reply: "Okay. Okay. I'm here. I'm looking.",
    },
    answers: {
      f_seen: {
        text: "Thick grey smoke, pouring out of the upstairs windows — both of them. And there's an orange glow inside somewhere, I can see it flickering on the curtains.",
        tone: "urgent",
      },
      f_where: {
        text: "I can't tell — upstairs is where the smoke's coming out, but it's everywhere. The lights are off, I can't see anything downstairs.",
      },
      f_spread: {
        text: "It's getting worse. It's darker than when I first looked, it's coming out faster. It's not my side yet.",
        tone: "urgent",
      },
      f_started: {
        text: "I don't know — the smoke alarm's been going five minutes, maybe. I thought it was a false one. Then I heard the shouting.",
      },
      f_building: {
        text: "A semi, council house, same as mine. Two floors. They had the loft done out as a bedroom for the eldest.",
      },
      f_inside: {
        text: "Yes — all of them, I think. Kelly and Dan, and Ella and Theo. Theo's only five and he's deaf in one ear, he won't have heard the alarm.",
        tone: "critical",
        followUps: [
          {
            id: "f_inside_rooms",
            text: "Which rooms would they be in?",
            answer: {
              text: "Theo's at the back, over the kitchen. Kelly and Dan are at the front. Ella's up in the loft.",
              tone: "urgent",
            },
          },
          {
            id: "f_inside_window",
            text: "Can you see anyone at a window?",
            answer: {
              text: "No. Nobody. I banged on the door and nobody came.",
              tone: "urgent",
            },
          },
        ],
      },
      f_hurt: {
        text: "I can't see anyone to tell you. I can't hear the shouting any more.",
        tone: "urgent",
        needsCalm: true,
      },
      f_vulnerable: {
        text: "Theo, the little one — he's five, and his hearing. And Ella's in the loft, there's only the one stair up to it.",
      },
      f_hazards: {
        text: "There's a gas meter, same as mine, in the cupboard under the stairs. No cylinders or anything like that — Dan doesn't even barbecue.",
      },
      f_danger: {
        text: "Cars parked both sides, it's always tight down here. Nothing else. No one's being funny.",
      },
      f_access: {
        text: "The front door's shut, it's a uPVC one, it'll be locked — they always lock it. The drive's clear, Dan's car is out on the road, the grey Focus. The side gate's bolted from the inside.",
      },
      f_safe: {
        text: "I'm on my own step. I'm not going anywhere near it.",
      },
      f_stay: {
        text: "Yes. Yes, I'll stay on.",
      },
      f_details: {
        text: "Pauline Hargreaves. This is the house phone — 0161 496 0287.",
      },
    },
    interjections: [
      {
        // The flames themselves are the informant's to report after the
        // send (flames-upstairs) — here the window is only going.
        atSec: 50,
        text: "Oh God — the window's cracking, I can hear it going. The smoke's black now, it's black.",
        tone: "critical",
        effect: { state: "panicking" },
      },
      {
        atSec: 150,
        text: "I can hear sirens. Is that them? Is that them coming?",
        requiresOpened: true,
      },
      {
        atSec: 170,
        text: "Where are they? It's been ages — is anyone actually coming?",
        tone: "urgent",
        requiresOpened: false,
      },
    ],
    onDispatch: "Thank you. Oh, thank you. Tell them to hurry.",
  },
};
