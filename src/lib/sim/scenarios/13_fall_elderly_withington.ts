import type { Scenario } from "../incident_types";

// Scenario 13 — elderly faller, Withington. Category 3.
//
// The commonest ambulance job in the country, and the one nothing in this
// sim expressed until now. Every other scenario here is a set-piece where
// the answer is "send everything quickly". This one's answer is that it
// WAITS, and the operator has to sit on it while higher categories keep
// landing.
//
// That is the whole design. A C3 has a ninety-minute target at the 90th
// centile, so holding it is correct — but the person on the floor is 81,
// she has been there since she fell, and the longer she lies the worse
// the outcome gets whatever the category says. Long lies cause pressure
// injuries, rhabdomyolysis and hypothermia; that is why "she is not
// injured" and "this can wait indefinitely" are different statements.
//
// The operator can hand this to the first crew that arrives and never
// think about it again, which is often the right call. The point is that
// it is a call.
//
// FICTIONAL: Mrs Ashworth, her neighbour, the house number and the
// keysafe code. Wilmslow Road and Burton Road are real Withington
// streets; the specific address is not. First-due A-CEN is real from
// nwas_stations.json.

export const scenario13: Scenario = {
  id: "13",
  slug: "13_fall_elderly_withington",
  title: "Fall — elderly female, Withington",
  type: "ambulance_fall_elderly",
  patch: "Southern",
  severity: "moderate",
  trigger:
    "Category 3 — 81-year-old female, fallen at home, conscious and breathing, no obvious injury. Neighbour called; unable to lift her",

  location: {
    address: "26 Burton Road, Withington, Manchester",
    postcode: "M20 3EB",
    coords: { lat: 53.4322, lng: -2.2295 },
  },

  property: {
    class: "Terraced house — two up two down, single occupancy",
    occupants:
      "One — Mrs Doreen Ashworth, 81, lives alone. Neighbour has a key and is on scene",
    vulnerabilities: [
      "Lives alone; daughter is in Leeds and has been rung",
      "On the floor since she fell — she is not sure how long, and that matters more than the category does",
    ],
    access:
      "Front door onto Burton Road. Neighbour at no. 28 holds a key and is waiting at the door. Keysafe by the meter box if she is not",
    knownHazards: [
      "Narrow hallway and a tight stair — no room to work a carry chair at the foot of the stairs",
      "Loose rug at the hall/kitchen threshold, which is probably what did it",
    ],
    firstDueStationId: "A-CEN",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — a private dwelling.",
      "Flagged on the ambulance system as a previous faller: two calls in the last eight months, neither conveyed.",
      "Keysafe fitted at the request of the falls team.",
    ],
  },

  methane: {
    M: "No",
    E: "26 Burton Road, Withington, M20 3EB",
    T: "Fall at home — one patient on the floor, conscious and talking",
    H: "None on scene. Narrow hallway restricts working space",
    A: "Front door; neighbour holding a key. On-street parking, terraced row",
    N: "One — female, 81. Conscious, breathing, denies injury",
    emergencyServices: "Ambulance only at this time",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-CEN",
      notes:
        "Category 3 — one double-crewed ambulance. No RRV: a solo responder cannot lift her, and sending one only starts a clock somebody else has to finish",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 3 minutes" },
      { metric: "C3 response", target: "on scene inside 120 minutes" },
      {
        metric: "Proportionate response",
        target: "no RRV committed — a solo responder cannot lift her",
      },
      {
        metric: "Long lie",
        target: "recognised: this is not the same as an uninjured patient who can wait",
      },
    ],
    lesson:
      "A category is a target, not a diagnosis. Holding a C3 while C1s land is exactly right and you will do it all shift — but a long lie is its own injury, and the clock the category gives you is not the clock she is on. If you are going to hold it, hold it knowingly.",
  },

  // Small scene. She is in the hallway; the work is space, not fire.
  scene: {
    viewBox: { x: -40, y: -30, width: 80, height: 60 },
    compassNorth: "up",
    // What this building will not take. Prose above; a locked option
    // with its reason on it here.
    egressBlocked: [
      { action: "carry_chair", reason: "No room to work a carry chair at the foot of that stair — the neighbour said as much on the phone" },
      { action: "trolley", reason: "Narrow hallway — the trolley comes no further than the front door" },
    ],
    buildings: [
      { shape: { x: -8, y: -20, w: 16, h: 26 }, kind: "target", label: "No. 26" },
      { shape: { x: -26, y: -20, w: 16, h: 26 }, kind: "neighbour", label: "No. 24" },
      { shape: { x: 10, y: -20, w: 16, h: 26 }, kind: "neighbour", label: "No. 28 — keyholder" },
    ],
    roads: [
      { shape: { x: -40, y: 10, w: 80, h: 2 }, kind: "pavement" },
      { shape: { x: -40, y: 12, w: 80, h: 9 }, kind: "road", label: "Burton Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -20, y: 16 }, kind: "car" },
      { pos: { x: 6, y: 16 }, kind: "car" },
      { pos: { x: 22, y: 16 }, kind: "car" },
      { pos: { x: -34, y: 8 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "narrow-hall",
        pos: { x: 0, y: -8 },
        kind: "structural",
        label: "Narrow hallway — no room for a carry chair at the stair foot",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-13-ashworth",
        label: "Female, 81 — on the hallway floor",
        pos: { x: -2, y: -6 },
        // Conscious, talking, not trapped. The problem is that she cannot
        // get up and has been down an unknown time, not that she is badly
        // hurt — and a long lie is its own injury whatever this says.
        severity: "walking",
        // She is in the hallway with the neighbour standing over her.
        // Nobody has to search for her.
        discoverAfterMinBa: 0,
        clinical: {
          // The observations of a long lie rather than an injury: cold,
          // slightly dry, a bit tachycardic. Nothing here is dramatic and
          // that is exactly why she keeps getting left.
          vitals: { rr: 18, spo2: 95, hr: 96, bpSys: 112, bpDia: 68, gcs: 15, temp: 35.4, bm: 5.1 },
          ageYears: 81,
          presumedCondition: "Fall with a prolonged lie — cold, no obvious injury, unable to self-rise",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          // The only thing to do for her, and the whole reason a long lie
          // is its own injury rather than a delay.
          criticalInterventions: ["warming"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Front / Burton Road", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 28 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear yard", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 24 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "neighbour-first",
      atSec: 5,
      text: "It's the lady next door, Doreen — she's on the floor in her hall. I've got a key so I've let myself in. She's talking to me, she just can't get up. I've tried but I can't lift her on my own.",
      tone: "info",
    },
    {
      id: "how-long",
      atSec: 50,
      text: "She says she's been down a while. I don't think she knows how long, love — she went to put the bin out after her programme and that finished at half eight.",
      tone: "info",
    },
    {
      id: "no-injury",
      atSec: 120,
      probability: 0.75,
      suppressesIds: ["hip-pain"],
      text: "She says nothing hurts, she's just cold and a bit embarrassed. I've put a blanket over her. She's chatting away as normal.",
      tone: "info",
    },
    {
      id: "hip-pain",
      atSec: 120,
      suppressesIds: ["no-injury"],
      text: "She's started saying her hip's hurting now she's tried to move. Her leg looks a funny way round to me — turned out, sort of. She's gone very quiet.",
      tone: "urgent",
    },
    {
      id: "still-waiting",
      atSec: 900,
      probability: 0.85,
      text: "Sorry to ring again — is anybody coming? She's still on the floor and she's shivering now. I've put the heating on.",
      tone: "urgent",
    },
  ],

  // The call as Maureen has it: on her mobile, on her knees on the hall
  // carpet at no. 26 with Doreen's hand in hers and the front door on the
  // latch behind her. She has known Doreen thirty years. She is not
  // frightened; she is cross with herself for not coming round sooner.
  call: {
    caller: {
      name: "Maureen Pike",
      phone: "07700 900612",
      relation: "Neighbour at no. 28 — holds a key",
      where: "Kneeling in the hallway at 26 Burton Road, beside the patient",
      line: "mobile",
      state: "calm",
    },
    opening:
      "Hello, love — ambulance, please. It's my neighbour, Doreen, Mrs Ashworth, 26 Burton Road in Withington. She's had a fall in her hall and she's on the floor. She's talking to me, she's alright in herself, but she can't get up and I can't lift her — I've tried. She's eighty-one.",
    deflection: "I've told you, love — she's on the floor and I can't lift her. What else do you want from me?",
    reassurance: {
      text: "Maureen, you're doing everything right. Keep her warm and keep her talking, and I'll sort out getting somebody to you.",
      reply: "Right. Yes. I'll do that. Sorry, love.",
    },
    answers: {
      a_conscious: {
        text: "Yes, she's conscious. She's talking to me — talking sense, she knows who I am, she's asked me to shut the front door. She's just on the floor and she can't get herself up.",
      },
      a_breathing: {
        text: "Yes, she's breathing fine. She's not gasping or wheezing or anything. She's chatting away.",
      },
      a_happened: {
        text: "She's had a fall in her hall — she's on the floor by the kitchen door. She says she went over on that rug of hers, the one at the kitchen doorway, I've told her about it before. I heard her shouting through the wall — we're terraced, you hear everything — so I came round with my key and let myself in. She can't get up and I can't lift her. I'm sixty-eight, I've a bad back myself.",
        followUps: [
          {
            id: "a_happened_position",
            text: "How is she lying — on her back, on her side?",
            answer: {
              text: "On her side, sort of — half on her side, half on her front, with her legs in the kitchen doorway. I've not moved her, I didn't think I should. She's not tried to turn over.",
            },
          },
          {
            id: "a_happened_legs",
            text: "Can she move her legs for you?",
            answer: {
              text: "She's wiggled her feet for me, both of them. She says she'd rather not try any more than that, and I've not made her.",
            },
          },
        ],
      },
      a_when: {
        text: "I don't know, love, and I don't think she does. I've only just found her — I heard her calling and came round. She said she'd been shouting a while before I heard.",
      },
      a_now: {
        text: "She's pale, but then she always is. She's not sweating — she's cold, actually, cold to touch, her hands are like ice. She's talking to me fine. She's more bothered about me seeing her in a state than anything.",
      },
      a_bleeding: {
        text: "No, no blood. Not that I can see. She says she's not banged her head — there's nothing on the carpet, nothing on her.",
      },
      a_age: {
        text: "Eighty-one. She was eighty-one in March.",
      },
      a_history: {
        text: "She's got tablets — a whole tray of them on the side, the blister thing the chemist does. Blood pressure, I know that, and water tablets. I don't know what else. She's fallen before — twice this year, your lot came out but they didn't take her in.",
        followUps: [
          {
            id: "a_history_falls",
            text: "Did she hurt herself the other times?",
            answer: {
              text: "No, just bruises. They got her up, she had a cup of tea and off they went. The falls people put a keysafe on for her after the second one.",
            },
          },
        ],
      },
      a_count: {
        text: "Just Doreen. Just her. She lives on her own — her Katherine's in Leeds, I've tried ringing her and she's not picking up.",
      },
      a_danger: {
        text: "It's fine, love, it's her hallway. It's just narrow, that's all — you couldn't swing a cat in it. And there's that rug. I'll pull it out of the way.",
      },
      a_access: {
        text: "Front door, 26 Burton Road — I'll leave it on the latch and I'll be at it. If I'm not, there's a keysafe by the meter box — I don't know the number off by heart, it's on her calendar in the kitchen, I'll go and look. You'll not get a chair in that hall, mind, it's that narrow, and the stairs come right down to the front door.",
        followUps: [
          {
            id: "a_access_parking",
            text: "Is there anywhere for the ambulance to pull up?",
            answer: {
              text: "It's all on-street, it's a terrace. There's usually a gap — if there's not I'll go and knock on and get somebody moved. They'll manage.",
            },
          },
        ],
      },
      a_with: {
        text: "Yes, I'm knelt next to her. I've got her hand.",
      },
      a_instructions: {
        text: "Yes, go on. What do I do? I've not tried to move her — I didn't want to make it worse.",
      },
      a_details: {
        text: "Maureen Pike. I'm at 28, next door. This is my mobile — 07700 900612.",
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "Hang on, love — she wants her glasses. They're on the — hang on, Doreen, they're here. There you are. Sorry. Where were we?",
      },
      {
        atSec: 100,
        text: "Are you sending somebody? Only I know you're busy, love, I do, but she's on a cold floor and she's not a young woman.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 160,
        text: "I've put a cushion under her head. She's shivering a bit now, she says her hall's like a fridge. Was that alright, moving her head, or should I not have?",
      },
      {
        atSec: 220,
        text: "I'll put the outside light on so they can see the number, and I'll not go anywhere. Do you know how long they'll be, roughly?",
        requiresOpened: true,
      },
    ],
    onDispatch: "Thank you, love. I'll keep her talking. Tell them the door'll be open.",
  },
};
