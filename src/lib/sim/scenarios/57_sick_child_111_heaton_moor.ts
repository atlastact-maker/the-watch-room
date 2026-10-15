import type { Scenario } from "../incident_types";

// Scenario 57 — feverish child on the 111 line, Heaton Moor. Category
// nothing.
//
// Hannah Birtles has a three-year-old with a temperature of 38.6, a
// streaming nose and a cough, who was up half the night and is now on
// the sofa watching the telly, grizzling between episodes. She has given
// Calpol, it worked for a few hours, and she rang the GP at eight and
// gave up at twelfth in the queue. She is a first-time parent, she has
// read the word "sepsis" on the internet, and she would like somebody to
// come and look at her daughter.
//
// Nobody needs to. Isla is alert, drinking, passing urine, breathing
// without effort, pink, with no rash and a neck she will happily bend to
// look at the telly. That is a viral illness in a well child, and the
// NHS Pathways disposition is primary care today — the GP in hours, with
// fever advice and a clear list of what to ring back for. An ambulance
// takes a crew off the road for an hour and puts a toddler on a trolley
// in a waiting room full of other people's viruses.
//
// The job is the safety net, not the disposal. Closing it right means
// the mother knows exactly what "worse" looks like: a rash that does not
// fade under a glass, breathing that gets fast or noisy, going floppy or
// hard to wake, not drinking, no wet nappy in twelve hours.
//
// One run in ten, that happens on the call. The rash comes up on her
// tummy while her mother is on the phone and she goes floppy on the
// sofa, and the same call is a Category 1 with the crew mobilised
// inside ninety seconds. The disposal does not hold for that run —
// `unlessVariantIds` — so closing it at the desk that night is the
// setback, and the adviser who asked about the rash and listened to the
// interjection is the one who hears it.
//
// FICTIONAL: the family, the house and the number. Shaw Road, Heaton
// Moor, is real; no. 14 is not. A-STK is real from nwas_stations.json.

export const scenario57: Scenario = {
  id: "57",
  slug: "57_sick_child_111_heaton_moor",
  title: "Feverish child on 111 — female 3, Heaton Moor",
  type: "ambulance_111_sick_child",
  patch: "Southern",
  severity: "low",
  trigger:
    "NHS 111 — female, 3, temperature 38.6 since last night, runny nose and a cough. Alert, drinking, playing on the sofa between grizzles. No rash, breathing normally. Mother ringing; could not get through to the GP",

  location: {
    address: "14 Shaw Road, Heaton Moor, Stockport",
    postcode: "SK4 4AG",
    coords: { lat: 53.4228, lng: -2.186 },
  },

  property: {
    class: "Terraced house — two storey",
    occupants: "Two — the child and her mother. Father at work",
    vulnerabilities: [
      "Child aged three — the age where parents are right to worry and usually wrong to panic",
      "First-time parent who has read about sepsis online and is frightened of missing it",
    ],
    access: "Front door straight onto Shaw Road; mother will answer",
    knownHazards: ["None"],
    firstDueStationId: "A-STK",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "NHS Pathways: a feverish child over three months who is alert, drinking, passing urine, breathing without effort and has no rash reaches a primary-care disposition — seen by a GP today — with fever advice and safety-netting. It is not an ambulance category.",
      "The safety net is the disposal. Tell the parent exactly what to ring 999 for: a rash that does not fade under a glass, breathing that is fast, noisy or hard work, floppy or difficult to wake, not drinking, no wet nappy in twelve hours, a fit.",
      "Paracetamol and ibuprofen can be given to a child over three months; not both at once unless one has failed. Keep her drinking. Do not cool her with a wet flannel or strip her off.",
    ],
  },

  methane: {
    M: "No",
    E: "14 Shaw Road, Heaton Moor, Stockport, SK4 4AG",
    T: "Febrile illness, child of 3 — alert, drinking, no rash, breathing normally. NHS 111 line",
    H: "None",
    A: "Front door onto Shaw Road; mother to answer",
    N: "One — female, 3, unwell but well",
    emergencyServices: "None deployed — GP in hours, fever advice and the ring-back list",
  },

  // One slot, held for the run where the picture changes. A well febrile
  // three-year-old does not need a crew; a floppy one with a rash needs
  // the nearest one there is.
  pda: [
    {
      id: "dca1",
      label: "Ambulance (held, not sent)",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-STK",
      notes:
        "Not for this call. Held for the one run in ten where the picture changes — a non-blanching rash, floppy, fast or noisy breathing, hard to wake. Then it is a Category 1 and this goes; until then a well febrile three-year-old does not need a crew",
    },
  ],

  evaluation: {
    targets: [
      {
        metric: "Disposal",
        target: "closed at the desk — GP in hours, with fever advice and the ring-back list; no crew sent",
      },
      {
        metric: "Safety net",
        target:
          "the mother told exactly what to ring 999 for: a rash that does not fade under a glass, fast or noisy breathing, floppy or hard to wake, not drinking, no wet nappy in twelve hours",
      },
      {
        metric: "Key questions",
        target: "breathing, rash and drinking asked and answered before the call is closed",
      },
      {
        metric: "Change of picture",
        target: "in the run where the rash comes up: regraded Category 1 and a crew mobilised within 90 seconds of hearing it",
      },
    ],
    lesson:
      "Nothing about this call needs an ambulance, and the pull to send one anyway is the exercise. She is frightened, it is her daughter, and a crew on the doorstep would make the morning feel safer for an hour. But the child is awake, drinking, pink, breathing without effort, with no rash and a neck she turns to watch the telly — a viral illness in a well three-year-old, which the GP sees today and nobody else needs to. The skill is not the disposal; it is what you say before you close. A parent who knows exactly what 'worse' looks like — a rash that does not fade under a glass, breathing that is fast or noisy, floppy or hard to wake, not drinking — will ring 999 at the right moment, and a parent who was told 'ring back if you're worried' will not know when that is. One run in ten the rash comes up while she is on the line and the same call is a Category 1. That does not make the closure wrong on the other nine. It makes the question about the rash the most important one you ask.",
  },

  callGrade: {
    scale: "ambulance_arp",
    grade: 5,
    standardMinutes: null,
    basis:
      "NHS Pathways: a feverish child over three months who is alert, drinking, passing urine, breathing without effort and has no rash reaches a primary-care disposition — to be seen by a GP today — not an ambulance response category. The ARP scale has no clock for that; the sim records it as Category 5 (hear and treat, referred to another service) and standardMinutes is null",
  },

  channel: "111",

  disposal: {
    noDeployment: true,
    outcome: "gp_in_hours",
    unlessVariantIds: ["rash"],
    basis:
      "A three-year-old with a temperature who is alert, drinking, passing urine, pink, breathing without effort and has no rash is a viral illness in a well child, and NHS Pathways sends that to primary care the same day — her GP in hours with fever advice and the ring-back list — not to an ambulance or an emergency department",
  },

  scene: {
    viewBox: { x: -30, y: -24, width: 60, height: 48 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -5, y: -16, w: 10, h: 16 }, kind: "target", label: "No. 14" },
      { shape: { x: -30, y: -16, w: 25, h: 16 }, kind: "neighbour", label: "Terrace (west)" },
      { shape: { x: 5, y: -16, w: 25, h: 16 }, kind: "neighbour", label: "Terrace (east)" },
    ],
    roads: [
      { shape: { x: -30, y: -24, w: 60, h: 8 }, kind: "garden", label: "Rear yards" },
      { shape: { x: -30, y: 0, w: 60, h: 2 }, kind: "pavement" },
      { shape: { x: -30, y: 2, w: 60, h: 6 }, kind: "road", label: "Shaw Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -12, y: 5 }, kind: "car" },
      { pos: { x: 12, y: 1 }, kind: "lamppost" },
    ],
    hazards: [],
    casualties: [
      {
        id: "cas-57-isla",
        label: "Female, 3 — febrile, on the sofa in the front room",
        pos: { x: -1, y: -6 },
        severity: "walking",
        discoverAfterMinBa: 0,
        clinical: {
          // A hot, snotty, cross three-year-old with normal numbers for
          // her age and her temperature.
          vitals: { rr: 30, spo2: 98, hr: 132, bpSys: 96, bpDia: 58, gcs: 15, temp: 38.6, bm: 5.4 },
          ageYears: 3,
          presumedCondition: "Febrile illness in a well three-year-old — viral upper respiratory tract infection, no red flags",
          redFlags: [],
          preferredDestination: "non_convey",
          criticalInterventions: [],
        },
      },
    ],
    variants: [
      {
        id: "rash",
        label: "Tonight the temperature is not the illness — a non-blanching rash comes up on her tummy during the call and she goes floppy on the sofa: meningococcal sepsis until proven otherwise",
        probability: 0.1,
        casualty: {
          "cas-57-isla": { severity: "critical", label: "Female, 3 — non-blanching rash, floppy, mottled" },
        },
        clinical: {
          "cas-57-isla": {
            vitals: { rr: 48, spo2: 93, hr: 172, bpSys: 78, bpDia: 44, gcs: 13, temp: 39.6, bm: 4.1 },
            presumedCondition: "Febrile three-year-old with a non-blanching rash, floppy and mottled, capillary refill four seconds — meningococcal sepsis until proven otherwise",
            redFlags: ["hypovolaemic_shock"],
            preferredDestination: "paed_ed",
            criticalInterventions: ["oxygen", "iv_access", "fluids"],
          },
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Shaw Road / front door", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · East", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear yard", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · West", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "mum-first",
      atSec: 5,
      text: "She's got a temperature of 38.6 and she's been up half the night. She's on the sofa. She's drinking her juice. I just want someone to look at her.",
      tone: "info",
    },
    {
      id: "calpol",
      atSec: 90,
      text: "The Calpol's kicking in, I think — she's sat up and she's asking for the telly louder.",
      tone: "info",
    },
    {
      id: "rash",
      atSec: 120,
      requiresVariantIds: ["rash"],
      text: "She's gone floppy — Isla? ISLA. She's not — there's spots on her tummy, red ones, and they're not going when I press. Oh God.",
      tone: "critical",
      effect: {
        regrade: "CAT 1",
        basis: "Non-blanching rash and floppy — meningococcal sepsis until proven otherwise",
        pulseCritical: true,
      },
    },
    {
      id: "settled",
      atSec: 240,
      excludesVariantIds: ["rash"],
      text: "She's eaten half a banana. I feel a bit silly. I'll ring the doctor's again like you said.",
      tone: "info",
    },
    {
      id: "slow-response",
      atSec: 420,
      delayThresholdSec: 900,
      requiresVariantIds: ["rash"],
      text: "She's gone grey round her mouth and her legs are blotchy. Where are they? Please.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  // The call as Hannah has it: on the sofa with Isla half across her
  // lap, the ear thermometer on the arm of the sofa, the telly on, her
  // phone warm from twenty minutes of the GP's hold music. She has read
  // too much and slept too little, and she wants to be told she is daft.
  call: {
    caller: {
      name: "Hannah Birtles",
      phone: "07700 900640",
      relation: "The patient's mother",
      where: "Front room at 14 Shaw Road, Heaton Moor, on her mobile, daughter on the sofa beside her",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "Hi — it's my little girl, she's three. She's had a temperature since last night, it's 38.6 on the ear thermometer, and she's got a cough and a horrible runny nose. I've given her Calpol. I tried the doctor's at eight and I was twelfth in the queue and then it cut me off. I just — I've read about sepsis and I don't know what I'm looking for. Can somebody come and look at her?",
    deflection: "Sorry — I don't — sorry, can you just tell me if she needs to be seen?",
    reassurance: {
      text: "Hannah, you've done the right thing ringing, and I'm going to go through this properly with you. From what you've said so far she's awake and she's drinking, and those are good signs. One question at a time.",
      reply: "Okay. Okay. Sorry. She's — yes. She's watching the telly.",
    },
    answers: {
      h_reason: {
        text: "Her temperature. 38.6 since about ten last night, and it was 38.2 when I did it an hour ago after the Calpol. She's got a cough and her nose is streaming and she's just — not herself. Grizzly. She won't eat her toast.",
        followUps: [
          {
            id: "h_reason_seen_before",
            text: "Has she had temperatures before, and how was she with them?",
            answer: {
              text: "Yes — she's had a couple with colds. She's always been a bit like this with them, clingy. I've just never — it's the sepsis thing. I keep reading it.",
            },
          },
        ],
      },
      h_who: {
        text: "My daughter. Isla. She's three — three in June. It's not me, I'm fine, it's her.",
      },
      h_breathing: {
        text: "Normally, yes. She's got a snotty nose so she's a bit snuffly, but she's not struggling, she's not making any noise with it. She's just said 'Mummy, Bluey' in a whole sentence, so.",
        byVariant: {
          rash: "She's — actually she's breathing fast, now you say. Really fast. Her tummy's going in and out. Is that bad? That's bad, isn't it.",
        },
      },
      h_chest: {
        text: "No. She's not said anything hurts. She's pointed at her throat once, I think it's sore from the cough.",
      },
      h_stroke: {
        text: "No — no, she's fine like that. She's turning her head to watch the telly, she's talking to me, she's moving everything. Nothing like that.",
      },
      h_bleeding: {
        text: "No bleeding. No rash — I've checked her all over this morning because of what I'd read. There's nothing. Her skin's pink, she's warm, there's no spots or anything.",
        byVariant: {
          rash: "There's — hang on. She's got a few spots on her tummy. Little red ones. I thought it was heat from the temperature. You said a glass — hang on. … They're not going. I'm pressing and they're not going. Oh God.",
        },
        followUps: [
          {
            id: "h_bleeding_glass",
            text: "If a rash does come up, do you know the glass test?",
            answer: {
              text: "Press a glass on it and see if it fades? Yes. I've got a glass here. I'll keep checking her.",
            },
          },
        ],
      },
      h_onset: {
        text: "Last night, about ten. She woke up hot and crying. Calpol at ten and again at six this morning. It's about the same, I'd say — the Calpol brings it down for a few hours and then it creeps back.",
      },
      h_temp: {
        text: "38.6 at ten o'clock last night, 38.2 an hour ago on the ear one. She's drinking — she's had most of a beaker of juice and some water. She's had a wet nappy this morning, a proper one. She's alert, she's watching the telly, she's telling me off for talking over it.",
      },
      h_history: {
        text: "Nothing. She's fit and well normally. All her jabs. No allergies that we know of, no medicines, nothing. She was a bit early — thirty-six weeks — but she's been fine since.",
      },
      h_tried: {
        text: "Calpol — children's paracetamol — at ten and again at six. The sachets, the right dose for her age, I checked the box twice. It helped. It brought it down for a few hours both times. I've got Calprofen as well but I wasn't sure if I could give both.",
      },
      h_gp: {
        text: "She's at the Heaton Moor practice, on Shaw Road, it's literally round the corner. I rang at eight on the dot and I was twelfth in the queue and it cut me off after twenty minutes. I've not tried again, I rang you instead.",
      },
      h_able: {
        text: "Yes — I can drive, or I can walk, it's two minutes. My husband can come back from work if I need him. I just need to know whether she needs seeing today or whether I'm being daft.",
      },
      h_worsen: {
        text: "Yes. Yes, straight away. What — what would be worse? Tell me what I'm looking for and I'll ring. I'll ring 999 if it's any of those.",
      },
      h_details: {
        text: "Hannah Birtles. B-I-R-T-L-E-S. This is my mobile, 07700 900640. Isla's date of birth is the ninth of June 2023. 14 Shaw Road, Heaton Moor, SK4 4AG.",
      },
    },
    interjections: [
      {
        atSec: 35,
        text: "Isla, sit down, sweetheart — sorry. She's bouncing on the sofa now. Sit DOWN. Sorry.",
      },
      {
        atSec: 80,
        requiresVariantIds: ["rash"],
        text: "Isla? Isla — she's gone — she's gone all floppy, she's just slumped on me. And there's spots. On her tummy. Red spots. They weren't there, they weren't there before — oh God, oh God.",
        tone: "critical",
        effect: {
          regrade: "CAT 1",
          basis: "Non-blanching rash and floppy — meningococcal sepsis until proven otherwise",
          state: "panicking",
        },
      },
      {
        atSec: 150,
        excludesVariantIds: ["rash"],
        text: "She's asking for a banana. Is that — that's good, isn't it? She's not eaten since yesterday teatime.",
      },
      {
        atSec: 200,
        excludesVariantIds: ["rash"],
        requiresOpened: false,
        text: "I just feel like if I don't get someone to look at her and it's something, I'll never forgive myself. Can't you just send someone to check?",
        tone: "urgent",
      },
      {
        atSec: 260,
        requiresVariantIds: ["rash"],
        requiresOpened: true,
        text: "I've got her on my lap. Her lips have gone a funny colour. Please tell them to hurry.",
        tone: "critical",
      },
    ],
    onDispatch: "Oh thank God. Thank you. I'm — I've got her. The door's open. Please hurry.",
  },
};
