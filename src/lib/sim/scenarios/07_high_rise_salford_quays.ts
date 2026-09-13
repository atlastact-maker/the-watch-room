import type { Scenario } from "../incident_types";

// Scenario 07 — High-rise dwelling fire, Salford Quays. Converted from the
// approved brief at data/research/fire/scenarios/07_high_rise_salford_quays.md.
// The tower is synthetic (post-Grenfell compliant cladding). High-rise
// discipline is the opposite of dwelling-fire instinct: methodical
// bridgehead, BA rotation, trust the building until it stops being
// trustworthy.

export const scenario07: Scenario = {
  id: "07",
  slug: "07_high_rise_salford_quays",
  title: "High-Rise Flat Fire — Quay Heights, Salford Quays",
  type: "high_rise_dwelling_fire",
  patch: "Western",
  severity: "major",
  trigger:
    "999 from a resident trapped in Flat 12B — fire in the flat, smoke logging the 12th-floor lobby; concierge confirms the alarm",

  location: {
    address: "Quay Heights, The Quays, Salford",
    postcode: "M50 3AZ",
    coords: { lat: 53.473, lng: -2.292 },
  },

  property: {
    class: "22-storey residential tower — ~150 flats, single staircase, post-Grenfell compliant (A2 limited-combustibility cladding)",
    size: "22 storeys; ~150 flats; ~300 residents",
    materials: "Concrete frame and core; A2 cladding; sealed glazing units",
    occupants:
      "~300 residents, mixed demographic. One confirmed trapped in Flat 12B (on the phone to control); unknown others on adjacent floors",
    vulnerabilities: [
      "Single staircase — the bridgehead owns it",
      "Vulnerable persons register held by the managing agent — request via concierge",
      "Sealed glazing reduces natural ventilation",
    ],
    access:
      "Front entrance off The Quays for the BA bridgehead; rear service yard for the aerial; appliance access on three sides; helipad 200 m away",
    knownHazards: [
      "Lift in fire mode — fire service override only",
      "Dry rising main inlet at ground floor north corner",
      "Stay-put policy in force for unaffected flats while compartmentation holds",
    ],
    firstDueStationId: "G58",
    doorType: "composite",
  },

  pri: {
    hasFormalPri: true,
    items: [
      "Statutory high-rise PRI. Building plans on file at NWFC; lift override controls at the ground-floor fire panel.",
      "Dry rising main inlet — ground floor, north corner (annexed plan). Outlet on every floor lobby.",
      "STAY-PUT policy for unaffected flats while compartmentation holds; pre-planned evacuation chain if it is compromised.",
      "24/7 concierge; vulnerable persons register held by the managing agent — request on arrival.",
      "Bridgehead convention: two floors below the fire floor (floor 10 for a 12th-floor fire).",
    ],
  },

  methane: {
    M: "Possible — depends on compartmentation",
    E: "Quay Heights, Salford Quays M50 — Flat 12B, 12th floor",
    T: "Flat fire — smoke logging the 12th-floor lobby; resident trapped in the flat on the phone to control",
    H: "High-rise; single staircase; dry rising main available; lift override needed; vulnerable persons register with concierge",
    A: "Main entrance for the BA bridgehead; rear service yard for aerial setup",
    N: "1 confirmed trapped in Flat 12B; unknown others on adjacent floors",
    emergencyServices:
      "Fire (lead), NWAS multiple standby, GMP cordon and traffic, local authority housing",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G58",
      notes: "First BA team to the bridgehead — floor 10, off the dry riser",
    },
    {
      id: "pump2",
      label: "Pump 2",
      service: "Fire",
      requiredApplianceTypes: ["WrT", "WrL"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G58",
      notes: "Second BA team + dry riser pumping at the north-corner inlet",
    },
    {
      id: "pump3",
      label: "Pump 3",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G59",
      notes: "Bridgehead support + rapid-intervention cover",
    },
    {
      id: "alp",
      label: "Aerial (HLP)",
      service: "Fire",
      requiredApplianceTypes: ["HLP", "TL"],
      requiredCapabilities: ["Aerial"],
      preferredStationId: "G50",
      notes: "Primary aerial — rear service yard; external rescue option up to its working height",
    },
    {
      id: "basu",
      label: "BA Support Unit",
      service: "Fire",
      requiredApplianceTypes: ["BASU"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G31",
      notes: "Cylinder resupply for sustained BA ops — long run from Littleborough, order early",
    },
    {
      id: "nwas_dca_1",
      label: "Ambulance 1",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      notes: "For the Flat 12B resident — smoke inhalation likely",
    },
    {
      id: "nwas_dca_2",
      label: "Ambulance 2",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      notes: "Standby — assisted evacuations and BA welfare",
    },
    {
      id: "police",
      label: "Police — cordon",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      notes: "Cordon + resident marshalling at the assembly point",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Bridgehead established", target: "< 20 minutes from arrival" },
      { metric: "BA management", target: "rotation planned; BASU staged before cylinders run down" },
      {
        metric: "Stay-put discipline",
        target: "maintained while compartmentation holds — no premature full evacuation",
      },
      { metric: "Firefighter safety", target: "no BA emergency; bridgehead discipline held" },
    ],
    lesson:
      "High-rise discipline is the opposite of dwelling-fire instinct. Methodical bridgehead two floors below, BA rotation, and trust the building until it stops being trustworthy. Operators who rush to evacuate 300 people down a single smoke-logged staircase score worse than those who pace it and escalate on evidence.",
  },

  // Schematic — 140m × 100m. Tower centre-north with the dock edge to the
  // east, service yard rear (north), The Quays road along the south.
  scene: {
    viewBox: { x: -70, y: -50, width: 140, height: 100 },
    compassNorth: "up",
    highRise: { floors: 18, fireFloor: 12, bridgeheadFloor: 10, firefightingLift: true, flatsPerFloor: 6 },
    // Twelfth floor, single staircase, bridgehead on it.
    egressExtraSeconds: 600,
    // What this building will not take. Prose above; a locked option
    // with its reason on it here.
    egressBlocked: [
      { action: "trolley", reason: "Lift in fire mode and a single staircase with the bridgehead on it — nothing on wheels leaves the twelfth floor" },
      { action: "wheelchair", reason: "Twelve floors of stairs. A wheelchair is a way of not carrying somebody, and here you are carrying them" },
    ],
    buildings: [
      {
        shape: { x: -16, y: -24, w: 28, h: 28 },
        kind: "target",
        label: "Quay Heights — 22 storeys",
      },
      {
        shape: { x: -16, y: 4, w: 40, h: 10 },
        kind: "neighbour",
        label: "Podium — concierge + fire panel",
      },
      {
        shape: { x: -62, y: -30, w: 24, h: 34 },
        kind: "neighbour",
        label: "Neighbour tower",
      },
    ],
    roads: [
      // Dock water east of the tower
      { shape: { x: 34, y: -50, w: 36, h: 76 }, kind: "water", label: "Salford Quays basin" },
      // Rear service yard
      { shape: { x: -16, y: -42, w: 40, h: 16 }, kind: "driveway", label: "Service yard (aerial)" },
      // Front plaza + visitor parking
      { shape: { x: -34, y: 14, w: 58, h: 12 }, kind: "driveway", label: "Front plaza / drop-off" },
      // The Quays road along the south
      { shape: { x: -70, y: 28, w: 140, h: 2 }, kind: "pavement" },
      { shape: { x: -70, y: 30, w: 140, h: 9 }, kind: "road", label: "The Quays" },
      { shape: { x: -70, y: 39, w: 140, h: 2 }, kind: "pavement" },
      // Quayside walkway
      { shape: { x: 24, y: -50, w: 10, h: 76 }, kind: "pavement", label: "Quayside walk" },
    ],
    hydrants: [
      { label: "H1", coords: { lat: 53.4726, lng: -2.2928 }, street: "The Quays" },
      { label: "H2", coords: { lat: 53.4736, lng: -2.2912 }, street: "Service yard" },
      { label: "H3", coords: { lat: 53.4722, lng: -2.2941 }, street: "Neighbour plaza" },
    ],
    landmarks: [
      { pos: { x: -13, y: -27 }, kind: "other", label: "Dry riser inlet (N corner)" },
      { pos: { x: -20, y: 18 }, kind: "car", label: "Concierge" },
      { pos: { x: -28, y: 18 }, kind: "car" },
      { pos: { x: 14, y: 18 }, kind: "car" },
      { pos: { x: -40, y: 16 }, kind: "lamppost" },
      { pos: { x: 20, y: 16 }, kind: "lamppost" },
      { pos: { x: -50, y: 8 }, kind: "tree" },
      { pos: { x: 58, y: -46 }, kind: "other", label: "Helipad 200 m NE" },
    ],
    // Flat 12B — south-east corner of the tower on the schematic. Slow,
    // compartment-limited growth; the informant's breach beat is the 20%
    // roll that turns this into a different night.
    fireSeat: {
      pos: { x: 6, y: -4 },
      radiusM: 2.5,
      growthRateMpm: 0.22,
      suppressionPerBaMpm: 0.09,
      maxRadiusM: 10,
      material: "structural",
      unknownMaterial: true,
    },
    hazards: [
      {
        id: "single-stair",
        pos: { x: -2, y: -10 },
        kind: "structural",
        label: "Single staircase — bridgehead discipline; keep it clear for BA + evacuation",
        knownFromPri: true,
      },
      {
        id: "lift-fire-mode",
        pos: { x: -8, y: -6 },
        kind: "electrical",
        label: "Lifts in fire mode — fire service override only",
        knownFromPri: true,
      },
      {
        id: "sealed-glazing",
        pos: { x: 10, y: -16 },
        kind: "structural",
        label: "Sealed glazing — limited natural ventilation; smoke holds in lobbies",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-12b",
        pos: { x: 8, y: -2 },
        severity: "critical",
        discoverAfterMinBa: 4,
        label: "Flat 12B resident (F, ~29) — trapped, smoke inhalation, on phone to control",
        clinical: {
          vitals: {
            rr: 30, spo2: 87, hr: 126, bpSys: 108, bpDia: 70,
            gcs: 14, temp: 37.1, bm: 5.6,
          },
          ageYears: 29,
          presumedCondition: "Significant smoke inhalation — stridor developing, sooty airway",
          redFlags: ["airway_compromise"],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen", "iv_access"],
        },
      },
      {
        id: "cas-14th",
        pos: { x: -4, y: -14 },
        severity: "serious",
        discoverAfterMinBa: 9,
        label: "Resident (M, ~81) — 14th floor, mobility-restricted, assisted evacuation",
        clinical: {
          vitals: {
            rr: 22, spo2: 92, hr: 104, bpSys: 146, bpDia: 90,
            gcs: 15, temp: 36.6, bm: 6.4,
          },
          ageYears: 81,
          presumedCondition: "Light smoke exposure + exhaustion; frail, COPD history",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Front / bridgehead", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Dock side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Service yard (aerial)", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Neighbour tower side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "resident-first",
      atSec: 5,
      text: "It's the kitchen — the whole worktop's alight and the smoke's filling the flat. I can't get to the front door, it's between me and the fire. I'm in the bedroom.",
      tone: "critical",
    },
    {
      id: "coach-to-bathroom",
      atSec: 50,
      text: "Control have told me to get in the bathroom, towel under the door. I'm in there now. The smoke alarm's going in the lobby too, I can hear it.",
      tone: "urgent",
    },
    {
      id: "concierge-parallel",
      atSec: 85,
      text: "The concierge is on the other line — panel shows 12th floor, he's holding the lifts at ground in fire mode and he's got the vulnerable persons register out for your crews.",
      tone: "info",
    },
    {
      id: "smoke-under-door",
      atSec: 150,
      probability: 0.6,
      text: "Smoke's starting to come under the bathroom door — I've wet the towel but I can taste it. How far away are they?",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "stay-put-holding",
      atSec: 220,
      probability: 0.75,
      text: "Concierge again — neighbours either side of 12B are reporting smells but no smoke in their flats. Compartment looks like it's holding. Stay-put stands for everyone else.",
      tone: "info",
    },
    {
      id: "compartment-breach",
      atSec: 260,
      delayThresholdSec: 480,
      probability: 0.2,
      text: "It's got worse — 12th floor lobby's fully logged and there's smoke showing on 13 now, coming through the riser cupboard they think. That's more than one flat.",
      tone: "critical",
      effect: { accelerateGrowthSec: 120, pulseCritical: true },
    },
    {
      id: "caller-fading",
      atSec: 330,
      delayThresholdSec: 540,
      probability: 0.5,
      text: "She's gone quiet on the line — control can hear her coughing but she's stopped answering questions.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  // The call as Tolu has it: on her mobile on the bedroom floor of 12B,
  // the door shut, the kitchen going on the other side of it and the
  // front door beyond that. She knows the windows do not open. Everything
  // she says, she says between coughs.
  call: {
    caller: {
      name: "Tolu Adeyemi",
      phone: "07700 900429",
      relation: "Resident of Flat 12B — trapped in the fire flat",
      where: "Bedroom floor of Flat 12B, 12th floor, door shut against the smoke",
      line: "mobile",
      state: "panicking",
    },
    opening:
      "There's a fire in my flat — my kitchen's on fire and I can't get out, I can't get to the door. Quay Heights, Salford Quays, the twelfth floor, flat 12B. Please, I'm stuck in here, please.",
    deflection: "I can't — I can't get out, I can't breathe properly, please just get them here!",
    reassurance: {
      text: "Tolu, listen to me. The fire engines are on their way to you right now. Get down low, keep that door shut, and stay talking to me.",
      reply: "Okay. Okay. I'm on the floor. I'm here.",
    },
    answers: {
      f_seen: {
        text: "The kitchen. The alarm went and I opened the bedroom door and the whole worktop was on fire, right up the cupboards, and the smoke was black, it was all along the ceiling. I shut the door again. I can't see it now — I can hear it.",
        tone: "critical",
      },
      f_where: {
        text: "The kitchen — it's open plan, the kitchen and the living room's all one, and the front door comes off that. I'm in the bedroom at the other end. It's between me and the door.",
        tone: "urgent",
        followUps: [
          {
            id: "f_where_side",
            text: "Which side of the building is your flat on?",
            answer: {
              text: "The corner — the water side, I look out over the dock. Twelfth floor. 12B, it's the corner one.",
            },
          },
        ],
      },
      f_spread: {
        text: "I don't know, I can't see it, I've got the door shut. It's louder than it was. There's a crackling, things keep popping. And the smoke's coming in round the door frame, at the top — I've put a jumper along the bottom.",
        tone: "urgent",
        needsCalm: true,
      },
      f_started: {
        text: "I don't know how it started. I was in the bedroom on my laptop, the alarm went off and I opened the door and it was already — the worktop was already going. Five minutes? Less. It's so fast.",
      },
      f_building: {
        text: "It's a tower — Quay Heights, it's twenty-odd floors of flats, a new one, concrete. There's a concierge downstairs, Faisal, he'll be on the desk.",
      },
      f_inside: {
        text: "Just me in here. I live on my own. But there's people all along the floor — there's a little girl next door in 12A — and there's the whole building, there's hundreds of people in here.",
        tone: "critical",
        followUps: [
          {
            id: "f_inside_floor",
            text: "Do you know if anyone else on your floor has got out?",
            answer: {
              text: "I don't know. I can't hear anyone. I banged on the wall for Justyna next door but I don't know if she heard me.",
              tone: "urgent",
            },
          },
          {
            id: "f_inside_window",
            text: "Can you get to a window?",
            answer: {
              text: "I'm at the window. It doesn't open — none of them open, they're sealed, there's only a little vent thing at the top. I can't get any air.",
              tone: "critical",
            },
          },
        ],
      },
      f_hurt: {
        text: "I'm — I'm coughing, I can't stop coughing, my throat's burning. I'm not burnt. I don't think I'm burnt.",
        tone: "urgent",
        needsCalm: true,
      },
      f_vulnerable: {
        text: "There's an old man up on fourteen, Dennis, he's got a walking frame, he can't do stairs. And next door's got a little girl, she's about three.",
      },
      f_hazards: {
        text: "No — I don't think there's gas, I've got an electric hob. There's nothing, no cylinders or anything, it's a flat. Cleaning stuff under the sink, that's all.",
      },
      f_danger: {
        text: "No. Nothing like that. The lifts go off when the alarm goes, they'll be sat at the bottom. It's the stairs — there's only the one stairs in the whole building.",
      },
      f_access: {
        text: "The front entrance, off the Quays — the plaza at the front. The doors are on fobs but Faisal's on the desk, he'll let them in, he's got all the keys. Twelfth floor, 12B — the corner flat, the dock side.",
        followUps: [
          {
            id: "f_access_door",
            text: "Is your front door locked?",
            answer: {
              text: "Yes — it locks itself when it shuts, it's on the latch. It's a heavy door, one of them composite ones. My keys are in the kitchen. I can't get to them.",
              tone: "urgent",
            },
          },
        ],
      },
      f_safe: {
        text: "No! No, I'm not — I'm in the flat, I'm in the bedroom with the door shut. I'm on the floor by the window. I can't get out of here.",
        tone: "critical",
      },
      f_stay: {
        text: "Yes — don't go. Please don't go. Don't leave me on my own.",
      },
      f_details: {
        text: "Tolu. Tolu Adeyemi. It's my mobile — 07700 900429. Twelve B.",
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "Something's just gone — a bang, through the door, like glass going. Oh God. Oh God, it's getting louder.",
        tone: "critical",
        effect: { state: "panicking" },
      },
      {
        atSec: 100,
        text: "Is anyone coming? You've not said — are they coming? How long, how long is it going to be?",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 160,
        text: "There's blue lights — I can see blue lights on the water, they're reflecting on the water. Is that them? Is that them?",
        tone: "urgent",
        requiresOpened: true,
      },
      {
        atSec: 215,
        text: "It's so hot in here. The door's hot — I can feel it from the floor. I can't stop coughing. Please.",
        tone: "critical",
      },
    ],
    onDispatch: "Thank you. Oh, thank you. Tell them to be quick. Twelve B — tell them twelve B.",
  },
};
