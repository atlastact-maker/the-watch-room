import type { Scenario } from "../incident_types";

// Scenario 34 — fall from height on a building site, Salford.
//
// Major trauma, which is a triage decision before it is a clinical one.
// A patient meeting the trauma criteria goes to a major trauma centre and
// bypasses everything nearer, and the operator's part is recognising that
// from the mechanism alone — a fall of four metres onto concrete is
// enough, before anybody has counted a respiratory rate.
//
// It is also the strongest HEMS case in the sim, and not because of the
// flying. HEMS bring a doctor and interventions a road crew cannot do,
// and on a building site with a long carry the aircraft is often the
// faster route to the trauma centre as well.
//
// Fire attend for the extrication rather than the fire: he is on
// scaffolding boards at first-floor level with a leg that will not be
// carried down a ladder.
//
// FICTIONAL: the site, the firm and the casualty. Ordsall Lane is a real
// Salford road; the development is not.

export const scenario34: Scenario = {
  id: "34",
  slug: "34_major_trauma_salford",
  title: "Fall from height — building site, Ordsall Lane",
  type: "ambulance_major_trauma",
  patch: "Western",
  severity: "high",
  trigger:
    "Category 2 major trauma — male fallen approximately four metres onto concrete, then dragged to scaffolding at first-floor level by workmates. Conscious, leg deformed",

  location: {
    address: "Construction site, Ordsall Lane, Salford",
    postcode: "M5 3EN",
    coords: { lat: 53.4731, lng: -2.2698 },
  },

  property: {
    class: "Construction site — partially built frame, scaffolded to three levels",
    occupants: "Around twenty on site. Site manager on scene and controlling access",
    vulnerabilities: [
      "Casualty at first-floor level on scaffolding boards — cannot be carried down a ladder",
      "Workmates have already moved him, which nobody wanted but which has happened",
    ],
    access:
      "Site gates off Ordsall Lane, hard standing inside. Site manager holds the gate and can clear a landing area on the slab",
    knownHazards: [
      "Working at height for the extrication",
      "Live site — plant movements, open edges, materials stacked",
    ],
    firstDueStationId: "A-SAL",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — construction site.",
      "Major trauma triage: mechanism alone (fall over three metres) meets the criteria for a trauma centre.",
      "Site has hard standing and the manager can clear a landing area — HEMS is viable here.",
    ],
  },

  methane: {
    M: "No",
    E: "Construction site, Ordsall Lane, Salford, M5 3EN",
    T: "Fall from height, approximately 4 m onto concrete. One casualty at first-floor level",
    H: "Working at height; live construction site",
    A: "Site gates off Ordsall Lane; manager holding the gate, landing area available on the slab",
    N: "One — male, conscious, obvious lower limb deformity",
    emergencyServices: "Ambulance leading; fire for extrication; HEMS requested",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-SAL",
      notes: "First road resource. Major trauma triage decides where he goes, not how fast he leaves",
    },
    {
      id: "hems",
      label: "HEMS",
      service: "Ambulance",
      requiredApplianceTypes: ["HEMS"],
      requiredCapabilities: [],
      notes:
        "A doctor and interventions a road crew cannot do — and on a site with a long carry, often the faster route to the trauma centre as well",
    },
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: [],
      preferredStationId: "G58",
      notes: "He is on boards at first-floor level. Somebody has to bring him down, and it is not the ambulance crew",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      {
        metric: "Trauma triage",
        target: "recognised from the mechanism — a fall over three metres, before any observations",
      },
      {
        metric: "HEMS",
        target: "requested early; the site has a landing area and the carry is long",
      },
      {
        metric: "Extrication",
        target: "fire mobilised — he cannot come down a ladder",
      },
    ],
    lesson:
      "Major trauma is a triage decision before it is a clinical one, and the mechanism alone decides it: four metres onto concrete meets the criteria before anybody has taken a pulse. So he bypasses everything nearer for a trauma centre. Ask for HEMS early — not for the speed but for the doctor — and send fire, because a man on scaffolding boards with a broken leg is not coming down a ladder.",
  },

  scene: {
    viewBox: { x: -60, y: -45, width: 120, height: 90 },
    compassNorth: "up",
    // First-floor scaffold — he has to come down before he goes anywhere.
    egressExtraSeconds: 420,
    // What this building will not take. Prose above; a locked option
    // with its reason on it here.
    egressBlocked: [
      { action: "walked", reason: "First-floor scaffold boards. Nobody walks off that, and he could not if he wanted to" },
      { action: "carry_chair", reason: "A chair on a scaffold ladder is how you make a second casualty" },
      { action: "trolley", reason: "He is at first-floor level on boards — the trolley cannot be got to him" },
      { action: "wheelchair", reason: "He is at first-floor level on boards — the trolley cannot be got to him" },
    ],
    buildings: [
      { shape: { x: -26, y: -32, w: 52, h: 34 }, kind: "target", label: "Frame — scaffolded" },
      { shape: { x: 30, y: -20, w: 20, h: 14 }, kind: "neighbour", label: "Site cabins" },
    ],
    roads: [
      { shape: { x: -50, y: 6, w: 90, h: 18 }, kind: "driveway", label: "Hard standing / landing area" },
      { shape: { x: -60, y: 26, w: 120, h: 4 }, kind: "driveway", label: "Site gates" },
      { shape: { x: -60, y: 30, w: 120, h: 10 }, kind: "road", label: "Ordsall Lane" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.4736, lng: -2.2706 }, street: "Ordsall Lane" }],
    landmarks: [
      { pos: { x: 36, y: 14 }, kind: "car" },
      { pos: { x: 44, y: 14 }, kind: "car" },
      { pos: { x: -44, y: 34 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "height",
        pos: { x: -4, y: -18 },
        kind: "structural",
        label: "Casualty on scaffolding boards at first-floor level",
        knownFromPri: true,
      },
      {
        id: "live-site",
        pos: { x: 16, y: -6 },
        kind: "structural",
        label: "Live site — plant movements, open edges, stacked materials",
        knownFromPri: true,
      },
      {
        id: "landing",
        pos: { x: -20, y: 14 },
        kind: "structural",
        label: "Hard standing clear enough for an aircraft if the manager moves the plant",
        discoverAfterMinOnScene: 2,
      },
    ],
    casualties: [
      {
        id: "cas-34-worker",
        label: "Male, 30s — fall approximately 4 m, lower limb deformity",
        pos: { x: -4, y: -17 },
        severity: "critical",
        discoverAfterMinBa: 1,
        clinical: {
          // Talking on arrival and quietly bleeding into his pelvis and
          // thigh. The blood pressure is the thing to watch, not the leg.
          vitals: { rr: 26, spo2: 94, hr: 124, bpSys: 96, bpDia: 58, gcs: 14, temp: 36.1, bm: 6.0 },
          ageYears: 34,
          presumedCondition: "Fall from height approximately 4 m — open lower limb deformity, pelvic pain",
          redFlags: ["hypovolaemic_shock", "spinal_injury_suspected", "major_haemorrhage"],
          preferredDestination: "mtc",
          criticalInterventions: ["oxygen", "iv_access", "tXA", "pelvic_binder", "spine_board"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Gates / hard standing", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Site cabins", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Frame rear", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Scaffold west", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "manager-first",
      atSec: 5,
      text: "Site manager, Ordsall Lane. One of the lads has come off the scaffold — twelve, thirteen foot onto the concrete. He's awake and talking but his leg's the wrong shape. They've moved him up onto the boards, I know they shouldn't have.",
      tone: "critical",
    },
    {
      id: "access",
      atSec: 50,
      text: "I'll hold the gates open. There's hard standing inside if you want to bring anything in — I can shift the telehandler if you need the space clearing.",
      tone: "info",
    },
    {
      id: "deteriorating",
      atSec: 210,
      probability: 0.45,
      text: "He's gone very pale and he's not talking as much now. He was chatting away five minutes ago.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "carry",
      atSec: 300,
      probability: 0.7,
      text: "Your crew are saying they can't get him down the ladder like that. They're asking about a different way off the scaffold.",
      tone: "urgent",
    },
  ],

  // The call as Dean has it: on his work mobile at the foot of the scaffold
  // ladder, looking up at the boards where the lads have put Tomek, with
  // the site stopped behind him and the gates already open. He saw the
  // landing, not the fall. He knows exactly how far it was.
  call: {
    caller: {
      name: "Dean Prescott",
      phone: "07700 900834",
      relation: "Site manager, Pendleton Frame — the casualty is one of his bricklayers",
      where: "On the slab at the foot of the scaffold ladder, Ordsall Lane site, looking up at the first-lift boards",
      line: "mobile",
      state: "calm",
    },
    opening:
      "Ambulance. Ordsall Lane, Salford — the building site, Pendleton Frame, just down from the Regent Road lights. I'm the site manager. One of my bricklayers has come off the scaffold onto a concrete slab — four metres, near enough. He's awake and he's talking to us, but his leg's badly broken, it's bent the wrong way, and he's saying his hip. And he's up on the first-floor boards — the lads moved him before I got to him. I need you here quick.",
    deflection: "Hang on. — Kev, keep him flat, don't let him — sorry. Go on.",
    reassurance: {
      text: "Dean, you've got this well in hand. Help is coming. Keep everyone off him and keep talking to me.",
      reply: "Yeah. Yeah, I'm here. Go on.",
    },
    answers: {
      a_conscious: {
        text: "Yes. He's awake, he's talking to me — he knows where he is, he knows what's happened. He's in a lot of pain, he's shouting when anyone goes near the leg. But he's with us.",
        tone: "urgent",
      },
      a_breathing: {
        text: "Breathing's alright. Fast, but he's talking in sentences. He's not short of breath — he's swearing at the lads that moved him, so there's nothing wrong with his lungs.",
        followUps: [
          {
            id: "a_breathing_chest",
            text: "Any pain in his chest, or trouble getting a breath in?",
            answer: {
              text: "He says his side hurts when he breathes in — the right side, low down. That's the side he landed on, the lads say. He's not gasping. It's the hip and the leg he's shouting about.",
              tone: "urgent",
            },
          },
        ],
      },
      a_happened: {
        text: "He was on the top lift of the scaffold, the third, laying blocks. Either a board's gone or he's stepped back off the edge — I've not got to the bottom of it yet. He's gone off backwards, about four metres, onto the first-floor slab. Concrete. He's landed on his right side with his leg under him. Before I got there two of the lads had dragged him off the slab onto the scaffold boards at that level, God knows why, they panicked. So he's on the first lift now, flat on his back on the boards, and I've told everyone he doesn't move again till you say.",
        tone: "urgent",
      },
      a_when: {
        text: "Four, five minutes. I was in the cabin — the shout went up, I've run over, and I rang you as soon as I'd seen him.",
      },
      a_now: {
        text: "A bit pale, and he's sweating, but he's with it — chatting away, swearing at the lads that moved him. He says his hip's killing him, more than the leg. He can't move the leg at all. He's asked for his missus twice.",
      },
      a_bleeding: {
        text: "There's blood on his trouser leg, the right shin — the trousers are torn and it's wet through, and I think the bone's come through. It's soaking, not spurting. Nothing from his head that I can see, and he had his hat on.",
        tone: "urgent",
        followUps: [
          {
            id: "a_bleeding_pressure",
            text: "Is anyone putting pressure on it?",
            answer: {
              text: "Kev's got a clean towel from the cabin on it and he's leaning on it. He's our first aider, he's done the three-day course. He's told the lads nobody straightens that leg.",
            },
          },
        ],
      },
      a_age: {
        text: "Thirty-four. Tomasz Wozniak — Tomek. He's one of the brickies, been with us two years.",
      },
      a_history: {
        text: "Nothing I know of. He's fit, he's a big lad. His induction form's in the cabin — there's next of kin and medical on it, I'll get it pulled. No allergies on it that I remember, I'd have flagged it. He's not on anything as far as I know.",
      },
      a_count: {
        text: "Just him. Nobody else was on that lift. The two that moved him are fine — shaken up, but fine.",
      },
      a_danger: {
        text: "It's a live site but I've stopped it — nothing's moving now. The telehandler's parked up on the slab and the keys are in my pocket. There's open edges on the first-floor slab and the hatch on that lift's got no cover. Everyone's in hats and boots. Your crew'll want hats — I've got spares in the cabin.",
        followUps: [
          {
            id: "a_danger_height",
            text: "How high up is he, and how do you get to him?",
            answer: {
              text: "First lift — about three metres off the ground. The scaffold ladder up through the hatch, that's the only way. There's no stair tower on this side of the frame, it's not gone up yet.",
              tone: "urgent",
            },
          },
        ],
      },
      a_access: {
        text: "The site gates on Ordsall Lane — green hoarding, big double gates, the crane's on the site so you can't miss it. The gates are open now, I've put a lad on them, and I'll be stood in them myself in the orange hi-vis. Come straight in — it's concrete inside, hard standing, you can drive right up to the frame.",
        followUps: [
          {
            id: "a_access_slab",
            text: "How much clear space is there on the hard standing inside the gates?",
            answer: {
              text: "The slab out front's about forty by twenty and it's flat. The telehandler's on it, and a couple of pallets of blocks by the cabins. What do you need it for?",
            },
          },
        ],
      },
      a_with: {
        text: "I'm at the bottom of the ladder looking up at him. Kev's up there with him, and one of the other lads holding his head still. I can go up if you want me to.",
      },
      a_instructions: {
        text: "Yes. Go on. Kev's first-aid trained — I'll shout it up to him, he'll do it.",
      },
      a_details: {
        text: "Dean Prescott, site manager, Pendleton Frame. It's my work mobile — 07700 900834.",
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "Hang on — GET OFF HIM. Leave him where he is — don't — sorry. They keep wanting to sit him up. I've told them twice.",
        tone: "urgent",
      },
      {
        atSec: 100,
        text: "Can you tell me what's coming, and how long? I've a man on the boards with a leg like that and twenty lads stood round looking at me. I need to tell him something.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 160,
        text: "The lads are saying he went off backwards, arms out. The board he was stood on's still up there — it's cracked clean through. I'll leave it where it is for the HSE.",
      },
      {
        atSec: 220,
        text: "I can hear you — that's a siren on Regent Road. Gates are open, I'm stood in them, orange vest, white hat. Tell them straight onto the slab, and tell them he's on the first lift, not the ground.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Right. Good. Gates are open — I'll be in them. Tell them to come straight onto the slab, and tell them he's up on the boards, not on the deck. They'll need to think about how they're getting him down.",
  },
};
