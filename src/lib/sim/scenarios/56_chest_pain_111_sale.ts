import type { Scenario } from "../incident_types";

// Scenario 56 — chest pain on the 111 line, Sale. The 999 call that rang
// the wrong number.
//
// Dennis Alcock is sixty-one, a type 2 diabetic, and he has had what he
// is calling indigestion since his dinner. It has not shifted with a
// Rennie, it has made him sweat, and he has rung 111 because he does not
// want to be "one of them that rings an ambulance for wind". Everything
// about how he presents the call says GP in the morning; everything he
// actually answers says acute coronary syndrome — central tightness,
// forty-five minutes, clammy, sick, a diabetic with a father who died at
// sixty of the same thing.
//
// The lesson is the line. NHS 111 is not a quieter 999; it is where a
// share of the 999 calls arrive, played down by the people having them.
// The health adviser's job is to hear the Category 2 inside the
// "indigestion" and move it — an ambulance, now, not an appointment —
// and then do the two things that change his outcome before the crew
// get there: aspirin, and an unlocked door.
//
// The run varies. Seven in ten the first twelve-lead shows nothing acute
// and he goes to the local for a troponin; three in ten it is an
// anterior STEMI and the crew drive past the nearest emergency
// department to a catheter lab.
//
// FICTIONAL: Dennis, his house and the number. Harboro Road in Sale is
// real; no. 66 is not. A-SAL is real from nwas_stations.json.

export const scenario56: Scenario = {
  id: "56",
  slug: "56_chest_pain_111_sale",
  title: "Chest pain on 111 — male 61, Sale",
  type: "ambulance_111_chest_pain",
  patch: "Southern",
  severity: "high",
  trigger:
    "NHS 111 — male 61, 'indigestion' for 45 minutes that has not shifted, sweating, feels sick. Type 2 diabetic. Ringing for himself, sat in his front room. Conscious, breathing, talking in full sentences",

  location: {
    address: "66 Harboro Road, Sale",
    postcode: "M33 5AH",
    coords: { lat: 53.4186, lng: -2.3345 },
  },

  property: {
    class: "Semi-detached house — two storey",
    occupants: "One — the patient, alone. Wife at work until six",
    vulnerabilities: [
      "Type 2 diabetic on metformin — the pain may be duller than the damage",
      "Minimising: has already decided it is indigestion and will take any reason to ring off",
    ],
    access: "Front door off the drive; he can open it himself and has been told to unlock it",
    knownHazards: ["None on scene"],
    firstDueStationId: "A-SAL",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "NHS Pathways: chest pain or tightness in an adult, present now, is an ambulance disposition whatever line it arrived on. A 111 health adviser who reaches it passes the call to the ambulance service and the category goes with it.",
      "Diabetics and the elderly present atypically — less pain, more sweat and nausea. 'Indigestion that will not shift' in a sweating diabetic is cardiac until an ECG says otherwise.",
      "Two things before the crew arrive: 300 mg aspirin chewed if he has it and is not allergic, and the front door unlocked.",
    ],
  },

  methane: {
    M: "No",
    E: "66 Harboro Road, Sale, M33 5AH",
    T: "Chest tightness 45 minutes, sweating and nausea — ACS suspected. Arrived on the 111 line",
    H: "None on scene",
    A: "Front door off the drive; patient can unlock it",
    N: "One — male, 61",
    emergencyServices: "Ambulance — Category 2 once recognised",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-SAL",
      notes:
        "Category 2 — a double-crewed ambulance, because he is going to hospital and a car cannot take him. The nearest DCA, not the nearest RRV",
    },
  ],

  evaluation: {
    targets: [
      {
        metric: "Recognition",
        target: "regraded to a Category 2 ambulance inside the call — not a GP appointment, not a call-back",
      },
      { metric: "Time-to-mobilise", target: "< 90 seconds from the regrade" },
      { metric: "Conveying resource", target: "a DCA — this patient is going in" },
      {
        metric: "Pre-arrival",
        target: "aspirin 300 mg chewed and the front door unlocked before the crew arrive",
      },
    ],
    lesson:
      "He rang 111 because he had already decided it was nothing, and a health adviser who takes the call at his valuation gives him an appointment for the morning he might not see. The job is to hear what he answers rather than how he says it: central pressure for three quarters of an hour, sweating through his shirt, sick with it, diabetic, a father dead at sixty of the same thing. That is a Category 2 ambulance on any line in the country, and the line it arrived on changes nothing except how hard he will argue. Move the grade, send the DCA, and then do the two things that matter before anybody arrives — the aspirin and the door. Three nights in ten the first twelve-lead lights up and the crew drive past the nearest hospital to a catheter lab. The other seven he apologises for wasting everybody's time, which is exactly how it should end.",
  },

  callGrade: {
    scale: "ambulance_arp",
    grade: 2,
    standardMinutes: 18,
    basis:
      "Chest pain in an adult, present at the point of answer, with sweating and nausea — an NHS Pathways ambulance disposition at Category 2 (emergency; mean 18 minutes, 90th centile 40). It arrived on 111 rather than 999; the category does not care which line rang",
  },

  channel: "111",

  scene: {
    viewBox: { x: -40, y: -32, width: 80, height: 64 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -11, y: -22, w: 22, h: 24 }, kind: "target", label: "No. 66" },
      { shape: { x: -33, y: -22, w: 20, h: 24 }, kind: "neighbour", label: "No. 64" },
      { shape: { x: 13, y: -22, w: 20, h: 24 }, kind: "neighbour", label: "No. 68" },
    ],
    roads: [
      { shape: { x: -4, y: 2, w: 9, h: 10 }, kind: "driveway", label: "Drive" },
      { shape: { x: -40, y: 12, w: 80, h: 2 }, kind: "pavement" },
      { shape: { x: -40, y: 14, w: 80, h: 10 }, kind: "road", label: "Harboro Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: 0, y: 6 }, kind: "car" },
      { pos: { x: -26, y: 18 }, kind: "lamppost" },
    ],
    hazards: [],
    casualties: [
      {
        id: "cas-56-alcock",
        label: "Male, 61 — chest tightness, in the armchair in the front room",
        pos: { x: -5, y: -10 },
        severity: "serious",
        discoverAfterMinBa: 0,
        clinical: {
          // Clammy, a little fast, pressure up with the pain. The first
          // trace shows nothing acute; the troponin decides it.
          vitals: { rr: 20, spo2: 96, hr: 96, bpSys: 150, bpDia: 88, gcs: 15, temp: 36.8, bm: 9.4 },
          ageYears: 61,
          presumedCondition: "Central chest pressure for 45 minutes with sweating and nausea in a type 2 diabetic — acute coronary syndrome suspected",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["aspirin", "gtn", "iv_access"],
        },
      },
    ],
    variants: [
      {
        id: "stemi",
        label: "Tonight the twelve-lead lights up — anterior ST elevation on the first trace, and the right hospital is the one with the catheter lab",
        probability: 0.3,
        clinical: {
          "cas-56-alcock": {
            vitals: { rr: 22, spo2: 94, hr: 102, bpSys: 138, bpDia: 84, gcs: 15, temp: 36.8, bm: 9.4 },
            presumedCondition: "Central chest pressure, clammy and nauseated — anterior STEMI on the first twelve-lead",
            redFlags: ["stemi"],
            preferredDestination: "pci",
            criticalInterventions: ["aspirin", "gtn", "oxygen", "iv_access"],
          },
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Front / Harboro Road", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 68 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear garden", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 64 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "self-first",
      atSec: 5,
      text: "It's a tightness, right across the middle. I've had a Rennie. I feel a bit daft, I nearly didn't ring.",
      tone: "info",
    },
    {
      id: "sweat",
      atSec: 70,
      text: "I've gone clammy. I've had to take my jumper off. I feel a bit sick with it now, I'll be honest.",
      tone: "urgent",
    },
    {
      id: "stemi",
      atSec: 240,
      requiresVariantIds: ["stemi"],
      text: "Crew on scene — ST elevation V1 to V4, anterior STEMI. We're pre-alerting the cath lab and going direct. Not the local.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "clear",
      atSec: 240,
      excludesVariantIds: ["stemi"],
      text: "Crew on scene — twelve-lead's not showing anything acute. Sats 96, pressure 150 over 88. We'll take him in to the local for a troponin. He's apologising for wasting our time.",
      tone: "info",
    },
    {
      id: "slow-response",
      atSec: 600,
      delayThresholdSec: 1500,
      text: "I've been sick. I've gone — the wife would say I've gone grey. Is it far, where they're coming from?",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  // The call as Dennis has it: in his armchair on the house phone, the
  // telly on mute, a packet of Rennies on the arm of the chair, ringing
  // the number you ring when it is nothing. He will give the adviser
  // every reason to agree with him.
  call: {
    caller: {
      name: "Dennis Alcock",
      phone: "0161 496 0520",
      relation: "The patient — ringing for himself",
      where: "Armchair in the front room at 66 Harboro Road, on the house phone",
      line: "landline",
      state: "calm",
    },
    opening:
      "Oh, hello. I feel a bit daft ringing, to be honest. I've had indigestion since my dinner and it won't shift — I've had a Rennie and it's done nothing. I just wondered if there's something I can get from the chemist, or whether I should see the doctor tomorrow. It's nothing urgent.",
    answers: {
      h_reason: {
        text: "Indigestion, I think. A tightness, across here — the middle of my chest. It came on after my dinner, about quarter to one, and it's just sat there. It's not agony. It's more like a weight. I keep wanting to belch and it won't come.",
        followUps: [
          {
            id: "h_reason_weight",
            text: "A weight — does it feel like pressure, or more like a burning?",
            answer: {
              text: "Pressure, more than burning. Like somebody's sat on me. I keep rubbing it and it makes no odds.",
            },
          },
        ],
      },
      h_who: {
        text: "Me. It's for me. Dennis Alcock. I'm sixty-one. I'm on my own in the house, the wife's at work till six.",
      },
      h_breathing: {
        text: "I'm breathing alright, yes. I'm talking to you, aren't I? I'll be honest, I was a bit puffed coming back from the kitchen, more than I'd normally be. But I'm not gasping or anything.",
      },
      h_chest: {
        text: "Well — yes. That's what I'm ringing about. It's the middle of my chest and it's gone a bit into my left shoulder now, now you mention it. Not my jaw. My arm feels a bit heavy, but I thought that was from leaning on it.",
        tone: "urgent",
        effect: {
          regrade: "CAT 2",
          basis: "Central chest pressure for forty-five minutes with sweating and nausea in a diabetic — an ambulance disposition, not an appointment",
        },
      },
      h_stroke: {
        text: "No. No, nothing like that. My face is fine, I can talk — I'm talking your ear off. No weakness. It's my chest, not my head.",
      },
      h_bleeding: {
        text: "No bleeding. No rash. Nothing like that, no.",
      },
      h_onset: {
        text: "Quarter to one, near enough, so — three quarters of an hour. It's not got better. If anything it's a bit worse than when I rang. I thought it'd have passed by now.",
        followUps: [
          {
            id: "h_onset_before",
            text: "Have you ever had this before?",
            answer: {
              text: "Not like this. I get heartburn, everybody does. This is different, if I'm honest. It's not going.",
            },
          },
        ],
      },
      h_temp: {
        text: "I've not taken a temperature, I'm not ill like that. I'm hot, though — I've gone sweaty. I had to take my jumper off. I've had a drink of water. I feel a bit sick with it, actually.",
        tone: "urgent",
      },
      h_history: {
        text: "I'm diabetic — type two, tablets, metformin. Blood pressure tablets, ramipril. That's it. No allergies. My dad had a heart attack at sixty, that's why the wife nags me. I'm sixty-one.",
        followUps: [
          {
            id: "h_history_last_bm",
            text: "When did you last check your sugar, and what was it?",
            answer: {
              text: "This morning, it was seven-something. Normal for me.",
            },
          },
        ],
      },
      h_tried: {
        text: "A Rennie. Two Rennies, about twenty minutes ago. They've done nothing, which is what made me ring, because they usually sort it.",
      },
      h_gp: {
        text: "I'm with the practice on Northenden Road. I tried them first — I was number nine in the queue, so I gave up and rang you.",
      },
      h_able: {
        text: "I could drive, I suppose. I feel a bit rough, but — well. I'd rather not, if I'm honest. I don't feel right to drive. The wife's got the other car anyway.",
      },
      h_worsen: {
        text: "Yes. Yes, if it gets worse I'll ring. I've not collapsed, I'm sat here talking to you.",
      },
      h_details: {
        text: "Dennis Alcock. A-L-C-O-C-K. Seventeenth of the fourth, sixty-five. This is the house phone — 0161 496 0520. 66 Harboro Road, Sale.",
      },
    },
    interjections: [
      {
        atSec: 40,
        text: "I've just had a bit of a belch, actually. Hasn't helped. I thought it would.",
      },
      {
        atSec: 110,
        text: "I've gone a bit… I've had to wipe my face. I'm wet through. Is that the indigestion?",
        tone: "urgent",
      },
      {
        atSec: 190,
        text: "Look, if it's going to be a palaver I'll just see the doctor in the morning. I don't want an ambulance sat outside the house for a bit of wind.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 260,
        text: "I've done the door and I've had the aspirin like you said. I'm sat back down. It's — it's still there.",
        requiresOpened: true,
      },
    ],
    onDispatch: "An ambulance? For — right. Right, okay. If you think. I'll unlock the door. The wife's going to go spare.",
    preArrival: [
      {
        id: "aspirin",
        key: true,
        text: "If you have aspirin in the house and you're not allergic to it, I want you to chew one 300 milligram tablet — chew it, don't swallow it whole — and tell me when you've done it.",
        reply: "There's some in the kitchen drawer. Hang on. … Right. Chewed. Tastes awful.",
      },
      {
        id: "door",
        key: true,
        text: "Unlock the front door now and put the outside light on, then come straight back and sit down.",
        reply: "Done. I've left it on the latch.",
      },
      {
        id: "sit",
        text: "Sit down and stay sat — don't go upstairs, don't go and tidy up, don't go out to the car.",
        reply: "I'm sat.",
      },
      {
        id: "nothing",
        text: "Don't eat or drink anything else from now.",
      },
      {
        id: "change",
        text: "If the pain gets a lot worse, if you feel faint, or if you can't catch your breath, ring 999 straight away — don't ring us back, ring 999.",
        reply: "999. Right.",
      },
    ],
  },
};
