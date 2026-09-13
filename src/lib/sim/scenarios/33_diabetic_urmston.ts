import type { Scenario } from "../incident_types";

// Scenario 33 — diabetic hypoglycaemia, Urmston.
//
// The job that teaches an operator that not every incident ends at a
// hospital. Give him glucose and in ten minutes he is himself again,
// apologetic, and refusing to go anywhere — and that is the correct
// outcome, not a failure to convey.
//
// Which matters on the board, because this resource comes BACK. Nothing
// else in the sim does that inside the hour. An operator who has learned
// that every ambulance they commit is gone for the shift will hold this
// job unnecessarily; one who knows it is a twenty-minute round trip will
// use it to fill a gap.
//
// The complication is that "treat and leave" is a clinical decision, not
// a dispatch one, and sometimes he does need to go.
//
// FICTIONAL: Mr Ferris and the address. Flixton Road is a real Urmston
// road; the house is not.

export const scenario33: Scenario = {
  id: "33",
  slug: "33_diabetic_urmston",
  title: "Diabetic emergency — male 46, Urmston",
  type: "ambulance_diabetic",
  patch: "Southern",
  severity: "moderate",
  trigger:
    "Category 2 — 46-year-old male, type 1 diabetic, confused and sweating. Wife has tried a sugary drink without success. Conscious",

  location: {
    address: "119 Flixton Road, Urmston, Manchester",
    postcode: "M41 5AN",
    coords: { lat: 53.4471, lng: -2.3548 },
  },

  property: {
    class: "Terraced house — patient in the kitchen",
    occupants: "Two — the patient and his wife",
    vulnerabilities: [
      "Confused and not co-operating with his wife, which is the illness rather than the man",
      "Known type 1 diabetic; this has happened before",
    ],
    access: "Front door onto Flixton Road. Wife will be at the door",
    knownHazards: ["None"],
    firstDueStationId: "A-URM",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "Type 1 diabetic. Three previous hypoglycaemic episodes attended in two years; none conveyed.",
      "A treated hypo often does not go to hospital. This crew may well be clear in twenty minutes.",
    ],
  },

  methane: {
    M: "No",
    E: "119 Flixton Road, Urmston, M41 5AN",
    T: "Diabetic emergency — confused, sweating, not responding to oral glucose",
    H: "None",
    A: "Front door onto Flixton Road; wife at the door",
    N: "One — male, 46, conscious",
    emergencyServices: "Ambulance only",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-URM",
      notes:
        "A DCA, and expect it back. A treated hypo frequently stays at home — this is one of the few jobs that returns a resource inside the hour",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "C2 response", target: "on scene inside 40 minutes" },
      {
        metric: "Proportionate response",
        target: "one resource — this is a drug and twenty minutes, not a convoy",
      },
      {
        metric: "Resource planning",
        target: "the crew treated as returning, not written off for the shift",
      },
    ],
    lesson:
      "Not every job ends at a hospital, and this is the one that proves it. Treat him and in ten minutes he is himself again and refusing to go anywhere, which is the right outcome rather than a failure. On the board that makes this the rare job that gives a resource back inside the hour — worth knowing when you are deciding what you can afford to send.",
  },

  scene: {
    viewBox: { x: -40, y: -30, width: 80, height: 60 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -9, y: -22, w: 18, h: 24 }, kind: "target", label: "No. 119" },
      { shape: { x: -29, y: -22, w: 18, h: 24 }, kind: "neighbour", label: "No. 117" },
      { shape: { x: 11, y: -22, w: 18, h: 24 }, kind: "neighbour", label: "No. 121" },
    ],
    roads: [
      { shape: { x: -40, y: 6, w: 80, h: 2 }, kind: "pavement" },
      { shape: { x: -40, y: 8, w: 80, h: 10 }, kind: "road", label: "Flixton Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -20, y: 12 }, kind: "car" },
      { pos: { x: 8, y: 12 }, kind: "car" },
      { pos: { x: -32, y: 20 }, kind: "lamppost" },
    ],
    hazards: [],
    casualties: [
      {
        id: "cas-33-ferris",
        label: "Male, 46 — hypoglycaemic, confused",
        pos: { x: 0, y: -14 },
        severity: "serious",
        discoverAfterMinBa: 0,
        clinical: {
          // BM 2.1. The generic fallback gave him 5.8, which is a normal
          // blood sugar on a hypoglycaemia job — the single most obviously
          // wrong number the missing clinical data produced.
          vitals: { rr: 20, spo2: 97, hr: 112, bpSys: 138, bpDia: 84, gcs: 12, temp: 36.2, bm: 2.1 },
          ageYears: 46,
          presumedCondition: "Hypoglycaemia — sweating, confusion, combative, not taking oral glucose",
          redFlags: ["hypoglycaemia"],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["glucagon", "iv_access"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Flixton Road frontage", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 121 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear yard", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 117 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "wife-first",
      atSec: 5,
      text: "It's my husband — he's diabetic and he's gone hypo. He's clammy and he's not making sense. I've tried getting a Lucozade into him but he won't have it, he's fighting me off. He's never like this normally.",
      tone: "urgent",
    },
    {
      id: "history",
      atSec: 50,
      text: "He's type one, has been since he was a lad. It's happened before — you came out to him last winter. He'd been out on his bike and not eaten.",
      tone: "info",
    },
    {
      id: "coming-round",
      atSec: 200,
      probability: 0.75,
      suppressesIds: ["not-rousing"],
      text: "He's had a bit of the drink now and he's starting to come round — he's answering me properly. He's saying he doesn't want to go to hospital, he just wants to sit down.",
      tone: "info",
    },
    {
      id: "not-rousing",
      atSec: 200,
      suppressesIds: ["coming-round"],
      text: "He's gone quiet on me now — he's still breathing but he's not answering at all. I can't rouse him.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  // The call as Julie has it: on the house cordless in the kitchen at 119,
  // one hand on the phone and the other keeping Gary off the cooker. She
  // has seen him hypo before. She has never seen him push her.
  call: {
    caller: {
      name: "Julie Ferris",
      phone: "0161 496 0330",
      relation: "The patient's wife",
      where: "The kitchen at the back of 119 Flixton Road, on the cordless, between Gary and the cooker",
      line: "landline",
      state: "anxious",
    },
    opening:
      "It's my husband — he's diabetic and he's having a hypo, a bad one. He's dripping with sweat and he's talking rubbish and he won't take his drink, he keeps knocking it away. 119 Flixton Road, Urmston. I can't get anything into him. I need somebody.",
    deflection: "I can't — Gary, NO — sorry, sorry, I can't hold him and talk to you at the same time.",
    reassurance: {
      text: "Julie, listen. An ambulance is coming. He's not himself and he can't help it — don't get hurt trying to hold him. Just keep the floor clear and keep talking to me.",
      reply: "Okay. Okay. I've let go of him. I'm here.",
    },
    answers: {
      a_conscious: {
        text: "Yes — he's awake, he's stood up. Well, he's up and down. He's looking at me but he's not there, he doesn't know what I'm saying to him. He's not out or anything.",
        tone: "urgent",
      },
      a_breathing: {
        text: "Yes, he's breathing fine — he's breathing fast, but that's because he's fighting me. He's not blue, nothing like that. It's not his breathing.",
      },
      a_happened: {
        text: "He's been out most of the afternoon. He came in about half an hour ago and I thought he was just tired, he was quiet. Then he started with the sweating, and he went all vacant, and when I asked him if he was going low he got nasty with me — he's never nasty. I got the Lucozade out and he won't have it. He clamps his mouth shut and turns his head away like a kid.",
        tone: "urgent",
        followUps: [
          {
            id: "a_happened_drink",
            text: "What have you managed to get into him so far?",
            answer: {
              text: "Nothing. A mouthful of the Lucozade, maybe, and most of that went down his front. I tried a spoon of jam and he spat it at me. I've got the glucose tablets in my hand and he won't open his mouth.",
            },
          },
          {
            id: "a_happened_before",
            text: "Has he gone this low before?",
            answer: {
              text: "He's gone low before, yes, a few times. Never like this. Normally he'll take the drink off me and he's right as rain in ten minutes and a bit sheepish. He's never once pushed me off.",
            },
          },
        ],
      },
      a_when: {
        text: "He came in about half an hour ago. It's the last ten minutes it's got bad. I rang you when he knocked the drink out of my hand — it's all over the floor.",
      },
      a_now: {
        text: "He's dripping — his T-shirt's wet through — and he's grey, a horrible colour. He's shaking. He's talking but it's not words, it's rubbish, and then he laughs at me. He keeps trying to walk off and his legs won't do it. He's got hold of the worktop now.",
        tone: "urgent",
      },
      a_bleeding: {
        text: "No. No blood. He's not fallen — not yet. He's going to, the way he's going.",
      },
      a_age: {
        text: "Forty-six. He's forty-six.",
      },
      a_history: {
        text: "Type one diabetic — since he was a lad. He does his own insulin, the pens, four times a day, and he tests himself. Nothing else wrong with him, he's fit as a flea normally. No allergies. His meter's in his bag on the side but I can't get near him with it — he pulled his hand away when I tried.",
        followUps: [
          {
            id: "a_history_kit",
            text: "Is there a glucagon kit in the house — an orange box, usually in the fridge?",
            answer: {
              text: "The orange box — yes, it's in the fridge door, the nurse gave us it. I've never used it. I don't even know if it's in date. Do I do it? You'll have to tell me how.",
              tone: "urgent",
            },
          },
        ],
      },
      a_count: {
        text: "Just Gary. It's just the two of us in.",
      },
      a_danger: {
        text: "It's our kitchen. It's fine. He's not dangerous — he's not a violent man, it's the sugar. He's just pushing me off. Tell them he'll push them off as well, it's not him, it's not Gary.",
        needsCalm: true,
      },
      a_access: {
        text: "Front door, straight onto Flixton Road — 119, it's the terrace, the red door, near the bus stop by the chippy. There's nowhere to park, they'll have to go on the pavement. I'll — I can't leave him to come to the door.",
        followUps: [
          {
            id: "a_access_door",
            text: "Can you get the front door open without leaving him?",
            answer: {
              text: "It's just down the hall. Hang on — Gary, stay there, stay THERE — right. It's on the latch. It's open. Tell them to come straight through, the kitchen's at the back.",
            },
          },
        ],
      },
      a_with: {
        text: "I'm right here, I'm in the kitchen with him. I've got the phone in one hand and I'm trying to keep him off the cooker with the other.",
      },
      a_instructions: {
        text: "Yes — yes. Tell me. Just tell me what to do with him.",
        tone: "urgent",
      },
      a_details: {
        text: "Julie Ferris. He's Gary. This is the house phone — 0161 496 0330. I'm on the cordless.",
        needsCalm: true,
      },
    },
    interjections: [
      {
        atSec: 55,
        text: "Gary, love, sit down — sit DOWN — he's trying to get to the back door and his legs are going. He's just gone into the table.",
        tone: "urgent",
      },
      {
        atSec: 110,
        text: "He's just shoved me — he's shoved me right into the cooker. Twenty years and he's never once. He doesn't know it's me. He doesn't know it's me.",
        tone: "urgent",
        effect: { state: "panicking" },
      },
      {
        atSec: 150,
        text: "Is somebody actually coming? You've not said. I can't hold him on my own, I've told you what he's like.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 185,
        text: "There's — is that them? There's blue lights out the front, on the road. Do I leave him to let them in? The door's open, tell them it's open.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Thank you. Oh, thank you. Gary — they're coming, love. Sit down. They're coming.",
  },
};
