import type { Scenario } from "../incident_types";

// Scenario 29 — imminent birth at home, Wythenshawe.
//
// The only job in the sim with a deadline nobody set. It is not a target
// or a policy window: the baby comes when it comes, and every other clock
// in the building is irrelevant to that.
//
// What makes it a control-room problem rather than a clinical one is that
// the right answer changes as it goes. Early on, this is a transport job
// — get her to the unit. Once the head is visible it is not a transport
// job at all, it is a birth in a front room, and the resource that
// matters becomes a second crew for the baby rather than a faster ride
// for the mother. An operator who keeps pushing for a hospital when the
// crew is telling them otherwise is solving yesterday's problem.
//
// FICTIONAL: the family and the address. Brownley Road is a real
// Wythenshawe road; the house is not. A-SHA is real from
// nwas_stations.json.

export const scenario29: Scenario = {
  id: "29",
  slug: "29_maternity_wythenshawe",
  title: "Imminent birth — Brownley Road, Wythenshawe",
  type: "ambulance_maternity",
  patch: "Southern",
  severity: "high",
  trigger:
    "39 weeks, contractions two minutes apart, waters gone. Partner says she is pushing. First baby, no complications recorded",

  location: {
    address: "74 Brownley Road, Wythenshawe, Manchester",
    postcode: "M22 4PU",
    coords: { lat: 53.3903, lng: -2.2634 },
  },

  property: {
    class: "Semi-detached house — patient in the front room downstairs",
    occupants: "Three — the patient, her partner, and her mother",
    vulnerabilities: [
      "First baby, at home, not planned as a home birth",
      "Front room is small and the sofa is against the wall — poor access all round the patient",
    ],
    access: "Front door onto Brownley Road, driveway. Partner watching for the ambulance",
    knownHazards: ["None"],
    firstDueStationId: "A-SHA",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "Booked at Wythenshawe. Midwifery unit aware and expecting her.",
      "No complications recorded in the pregnancy.",
    ],
  },

  methane: {
    M: "No",
    E: "74 Brownley Road, Wythenshawe, M22 4PU",
    T: "Imminent birth — 39 weeks, contractions two minutes apart, patient pushing",
    H: "None. Restricted working space in the front room",
    A: "Front door and driveway; partner watching out for the crew",
    N: "One patient, one baby imminent",
    emergencyServices: "Ambulance only",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-SHA",
      notes: "The crew who will either drive her or deliver the baby, depending on what they find",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "Response", target: "on scene inside 18 minutes" },
      {
        metric: "Second crew",
        target: "ordered once birth is imminent — a baby is a second patient",
      },
      {
        metric: "Changing the plan",
        target: "transport abandoned once the crew report the head is visible",
      },
    ],
    lesson:
      "The deadline on this one was not set by a policy and will not wait for you. And the right answer changes while you are working it: early on this is a ride to the midwifery unit, and the moment the crew say the head is visible it stops being a transport job and becomes a delivery with two patients in it. Send a second crew when that happens, and stop trying to solve the problem you had ten minutes ago.",
  },

  scene: {
    viewBox: { x: -40, y: -32, width: 80, height: 64 },
    compassNorth: "up",
    // What this building will not take. Prose above; a locked option
    // with its reason on it here.
    egressBlocked: [
      { action: "trolley", reason: "Small front room with the sofa against the wall — there is no line to bring a trolley in" },
    ],
    buildings: [
      { shape: { x: -12, y: -24, w: 22, h: 24 }, kind: "target", label: "No. 74" },
      { shape: { x: 12, y: -24, w: 20, h: 24 }, kind: "neighbour", label: "No. 76" },
      { shape: { x: -36, y: -24, w: 20, h: 24 }, kind: "neighbour", label: "No. 72" },
    ],
    roads: [
      { shape: { x: -6, y: 0, w: 9, h: 12 }, kind: "driveway", label: "Drive" },
      { shape: { x: -40, y: 12, w: 80, h: 2 }, kind: "pavement" },
      { shape: { x: -40, y: 14, w: 80, h: 10 }, kind: "road", label: "Brownley Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -2, y: 5 }, kind: "car" },
      { pos: { x: -28, y: 18 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "space",
        pos: { x: -4, y: -14 },
        kind: "structural",
        label: "Front room — sofa against the wall, restricted access around the patient",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-29-mother",
        label: "Female, 27 — 39 weeks, second stage",
        pos: { x: -4, y: -13 },
        severity: "serious",
        discoverAfterMinBa: 0,
        clinical: {
          // Second stage of labour. Tachycardic and breathing hard because
          // she is pushing, not because anything is wrong.
          vitals: { rr: 24, spo2: 98, hr: 108, bpSys: 126, bpDia: 74, gcs: 15, temp: 37.2, bm: 5.8 },
          ageYears: 27,
          presumedCondition: "Second stage of labour — 39 weeks, imminent delivery",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          // Once the head is visible she is not going anywhere, and the
          // job stops being a journey and becomes a delivery.
          criticalInterventions: ["assisted_delivery", "oxygen"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Brownley Road / drive", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 76 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear garden", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 72 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "partner-first",
      atSec: 5,
      text: "My partner's in labour — she's 39 weeks and her waters went about an hour ago. The pains are coming every couple of minutes now. She's saying she needs to push. It's our first.",
      tone: "critical",
    },
    {
      id: "mother-here",
      atSec: 45,
      text: "Her mum's here with her. She's had three herself and she reckons it's coming. Do I need to be doing something? I don't know what I'm doing here.",
      tone: "urgent",
    },
    {
      id: "crowning",
      atSec: 165,
      probability: 0.6,
      suppressesIds: ["holding-on"],
      text: "Her mum says she can see the head. It's coming now. She's not getting in any ambulance, it's happening here.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "holding-on",
      atSec: 165,
      suppressesIds: ["crowning"],
      text: "The pains have eased off a bit and she's got her breath back. Her mum reckons there's a while in it yet. She wants to get to the hospital.",
      tone: "urgent",
    },
    {
      id: "baby-here",
      atSec: 330,
      probability: 0.85,
      requiresFiredIds: ["crowning"],
      text: "The baby's here. Your crew arrived just in time. They're asking for another ambulance — something about the baby needing its own.",
      tone: "urgent",
    },
  ],

  // The call as Jordan has it: kneeling on the front-room carpet at 74
  // Brownley Road with the phone on speaker and Chloe on the sofa
  // shouting at him. It is their first. He has never been so frightened.
  call: {
    caller: {
      name: "Jordan Kaye",
      phone: "07700 900829",
      relation: "The patient's partner — the baby's father",
      where: "On the floor by the sofa in the front room at 74 Brownley Road, phone on speaker",
      line: "mobile",
      state: "panicking",
    },
    opening:
      "Hi — hi, I need an ambulance, my girlfriend's having the baby. Like now, she's having it now. 74 Brownley Road, Wythenshawe. She's — Chloe, breathe, breathe — she's pushing, she says she can't stop it, we were meant to go to Wythenshawe and there's no time, there's no — please.",
    deflection: "I don't know — I don't know, I don't know what I'm doing, please just get someone here, she's having it!",
    reassurance: {
      text: "Jordan, listen. An ambulance is coming. Babies come on their own more often than not, and you're not on your own with this — I'm staying with you. Take a breath and answer me.",
      reply: "Okay. Okay. Okay. Sorry. I'm here. Chloe, they're coming. Go on.",
    },
    answers: {
      a_conscious: {
        text: "Yeah — yes, she's awake, she's — God, she's very awake, she's shouting at me. She knows what's going on, she's just in agony. Every couple of minutes she goes again.",
        tone: "urgent",
      },
      a_breathing: {
        text: "She's breathing, yeah — it's like panting, really fast, and then she sort of holds it and grunts and goes red. That's when she's pushing. Then it eases off and she's breathing normal again. Is that right? Is that what's meant to happen?",
        tone: "urgent",
      },
      a_happened: {
        text: "She's 39 weeks, she's due next week. Her waters went about an hour ago, in the kitchen, all over the floor, and I said right let's go, and she said wait, and then the pains came on really fast, and now they're coming all the time and she's saying she needs to push. She's on the sofa on her side. I tried to get her to the car and she couldn't stand up.",
        tone: "urgent",
        effect: {
          regrade: "CAT 2",
          basis: "Imminent birth — 39 weeks, waters gone, contractions two minutes apart and pushing; first baby, no complications recorded",
        },
        followUps: [
          {
            id: "a_happened_see",
            text: "Can you see anything — any part of the baby?",
            answer: {
              text: "I've not — I've not looked, she's — hang on. Chloe, I need to — no. No, I can't see anything, there's nothing, it's just — there's a lot of — I don't know what I'm looking at. I can't see a head or anything.",
              tone: "urgent",
            },
          },
          {
            id: "a_happened_contractions",
            text: "How far apart are the pains — from the start of one to the start of the next?",
            answer: {
              text: "They're — there's one now. Okay. Okay, it's gone. That was — two minutes? Not even. They just keep coming, there's barely a gap. And they're long, it's like a minute each one.",
              tone: "urgent",
            },
          },
        ],
      },
      a_when: {
        text: "The waters went about an hour ago — sixish, quarter past six. The pains started properly maybe forty minutes ago. She'd been having twinges all afternoon and she said they were nothing. It's gone so fast.",
      },
      a_now: {
        text: "She's red in the face, she's sweating, her hair's stuck to her. She's talking in between them — telling me to shut up, mostly — but when one comes she can't say anything, she just grabs my arm and bears down. She's on her side with her knees up.",
        tone: "urgent",
        needsCalm: true,
      },
      a_bleeding: {
        text: "There's — there's some blood, a bit, mixed in with the water on the towel. Pinky. Not loads. Not pouring. Is that bad? Tell me that's normal.",
        needsCalm: true,
      },
      a_age: {
        text: "She's 27. Chloe's 27. I'm 28. The baby's — it's a girl, we know it's a girl.",
      },
      a_history: {
        text: "Nothing. She's healthy, she's been fine the whole way through — all the scans were fine, they said everything's normal. She's booked in at Wythenshawe, the midwife unit. No diabetes or anything. She's not on anything, just the vitamins. Not allergic to anything. It's her first.",
        followUps: [
          {
            id: "a_history_notes",
            text: "Has she got her maternity notes — the folder?",
            answer: {
              text: "Yeah — it's in the hospital bag by the door. Her folder. Do you want me to get it? I don't want to leave her. I'll get it after.",
            },
          },
        ],
      },
      a_count: {
        text: "Just Chloe — well, Chloe and the baby, when it — is that two? It's going to be two, isn't it.",
        tone: "urgent",
      },
      a_danger: {
        text: "It's our front room. It's fine, it's just — small. She's on the sofa and the sofa's up against the wall, and there's the telly and the coffee table — I've shoved the table out. There's not much room round her.",
      },
      a_access: {
        text: "Front door, straight off Brownley Road. There's a drive, my car's on it — I'll leave it, they can pull up on the road. The door's on the latch, I'll put the hall light on. The front room's first on the left as you come in. I've got you on speaker so I'll hear them.",
      },
      a_with: {
        text: "I'm right next to her, I'm on the floor by the sofa. She's got hold of my hand, she's not letting go. I've got you on speaker.",
      },
      a_instructions: {
        text: "Yes. Yes. Tell me. Tell me what to do, I'll do anything, just tell me slowly.",
        tone: "urgent",
      },
      a_details: {
        text: "Jordan Kaye. It's my mobile — 07700 900829. She's Chloe Dennett, if you need her name.",
      },
    },
    interjections: [
      {
        atSec: 40,
        text: "I've put towels down — I've got towels, is that right? Do I need to boil water or is that just off the telly? Tell me what to get.",
        tone: "urgent",
      },
      {
        atSec: 90,
        text: "Are they coming? Have you sent them? You've not said — please, I can't do this on my own — you've not said if they're coming.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 140,
        text: "She wants to get on the floor — she's getting off the sofa, onto her hands and knees — is that alright? Chloe, wait — can she do that?",
        tone: "urgent",
      },
      {
        atSec: 210,
        text: "I can hear it — is that them? That's a siren. I'm going to open the door — no, I can't leave her — Chloe, I'm just going to the door. Two seconds.",
        tone: "urgent",
        requiresOpened: true,
      },
    ],
    onDispatch: "Thank you — thank you. How long? Chloe, they're coming, babe, they're on their way. What do I do till then? Stay on. Please stay on with me.",
  },
};
