import type { Scenario } from "../incident_types";

// Scenario 31 — stroke, Stockport.
//
// The clock on this one did not start when the phone rang. It started
// when she was last seen well, and that is the only time that matters:
// thrombolysis has a window measured from ONSET, and a caller who says
// "she's been like this since I got up" has just told you something more
// important than any of her observations.
//
// So the operator's job includes a question that sounds pedantic and is
// not — when was she last normal? — and a destination that is a
// hyperacute stroke unit rather than the nearest department. A crew who
// arrive in nine minutes and drive to the wrong hospital have lost her
// more time than a crew who took fifteen and went to the right one.
//
// FICTIONAL: Mrs Whitelegg and the address. Bramhall Lane is a real
// Stockport road; the house is not. A-STK is real from
// nwas_stations.json.

export const scenario31: Scenario = {
  id: "31",
  slug: "31_stroke_stockport",
  title: "Stroke — female 71, Stockport",
  type: "ambulance_stroke",
  patch: "Southern",
  severity: "high",
  trigger:
    "Category 2 — 71-year-old female, facial droop and left-sided weakness, slurred speech. Husband called. Time of onset uncertain",

  location: {
    address: "88 Bramhall Lane, Stockport",
    postcode: "SK2 6HP",
    coords: { lat: 53.3961, lng: -2.1571 },
  },

  property: {
    class: "Semi-detached house — patient in an armchair in the front room",
    occupants: "Two — the patient and her husband",
    vulnerabilities: [
      "Time of onset uncertain, which decides whether she is a candidate for thrombolysis",
      "Husband is 74 and distressed; he is also the only witness to when she was last well",
    ],
    access: "Front door, short drive. Husband at the door",
    knownHazards: ["None"],
    firstDueStationId: "A-STK",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "Atrial fibrillation on the ambulance record; on an anticoagulant.",
      "Destination is a hyperacute stroke unit, not the nearest emergency department. The nearest department cannot thrombolyse.",
    ],
  },

  methane: {
    M: "No",
    E: "88 Bramhall Lane, Stockport, SK2 6HP",
    T: "Suspected stroke — facial droop, left-sided weakness, slurred speech",
    H: "None",
    A: "Front door and drive; husband waiting at the door",
    N: "One — female, 71",
    emergencyServices: "Ambulance only",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-STK",
      notes:
        "A DCA. She is going to a stroke unit and an RRV cannot take her there, so a solo responder only starts a second clock",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "C2 response", target: "on scene inside 40 minutes" },
      {
        metric: "Time of onset",
        target: "last-seen-well established on the call, not left to the crew",
      },
      {
        metric: "Destination",
        target: "hyperacute stroke unit — the nearest department cannot thrombolyse",
      },
    ],
    lesson:
      "The clock started before the phone rang. Thrombolysis is timed from when she was last well, so the question that decides this job is a pedantic-sounding one you ask her husband — and the answer changes whether a fast response helps her at all. Then send her past the nearest hospital to one that can treat her. Nine minutes to the wrong door is slower than fifteen to the right one.",
  },

  scene: {
    viewBox: { x: -40, y: -32, width: 80, height: 64 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -12, y: -24, w: 22, h: 24 }, kind: "target", label: "No. 88" },
      { shape: { x: 12, y: -24, w: 20, h: 24 }, kind: "neighbour", label: "No. 90" },
      { shape: { x: -36, y: -24, w: 20, h: 24 }, kind: "neighbour", label: "No. 86" },
    ],
    roads: [
      { shape: { x: -6, y: 0, w: 9, h: 12 }, kind: "driveway", label: "Drive" },
      { shape: { x: -40, y: 12, w: 80, h: 2 }, kind: "pavement" },
      { shape: { x: -40, y: 14, w: 80, h: 10 }, kind: "road", label: "Bramhall Lane" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -2, y: 5 }, kind: "car" },
      { pos: { x: -28, y: 18 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "onset-unknown",
        pos: { x: -4, y: -14 },
        kind: "structural",
        label: "Time of onset uncertain — decides whether thrombolysis is possible at all",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-31-whitelegg",
        label: "Female, 71 — facial droop, left-sided weakness",
        pos: { x: -4, y: -13 },
        severity: "serious",
        discoverAfterMinBa: 0,
        clinical: {
          // In atrial fibrillation, which is both why she has had it and a
          // reason the anticoagulant matters to whoever thrombolyses her.
          vitals: { rr: 16, spo2: 96, hr: 96, bpSys: 176, bpDia: 94, gcs: 14, temp: 36.7, bm: 6.4 },
          ageYears: 71,
          presumedCondition: "FAST positive — facial droop, left arm weakness, dysarthria",
          redFlags: ["stroke_fast_positive"],
          // Past the nearest department, to a unit that can thrombolyse.
          preferredDestination: "hasu",
          criticalInterventions: ["oxygen", "iv_access"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Bramhall Lane / drive", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 90 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear garden", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 86 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "husband-first",
      atSec: 5,
      text: "Something's happened to my wife. Her face has gone down one side and she can't lift her left arm. She's trying to talk but I can't make out what she's saying.",
      tone: "critical",
    },
    {
      id: "onset-vague",
      atSec: 50,
      probability: 0.55,
      suppressesIds: ["onset-known"],
      text: "I don't know when it started, love. She was in the chair when I came down and I thought she'd nodded off. She'd been fine when we went up at half ten last night.",
      tone: "urgent",
    },
    {
      id: "onset-known",
      atSec: 50,
      suppressesIds: ["onset-vague"],
      text: "It was twenty past eight. We were having our tea and she dropped her cup and I looked up and her face had gone. I looked at the clock, twenty past eight.",
      tone: "urgent",
    },
    {
      id: "anticoag",
      atSec: 130,
      probability: 0.8,
      text: "She's on the blood thinners, has been for years — for her heart, the irregular beat. Is that important?",
      tone: "info",
    },
  ],

  // The call as Ken has it: on the cordless in the front room at 88
  // Bramhall Lane, standing over Margaret's chair. He is seventy-four and
  // he cannot get his thoughts in a line, and one of them is the answer
  // that decides this job.
  call: {
    caller: {
      name: "Ken Whitelegg",
      phone: "0161 496 0310",
      relation: "The patient's husband",
      where: "Front room at 88 Bramhall Lane, stood beside Margaret's armchair on the cordless",
      line: "landline",
      state: "confused",
    },
    opening:
      "Hello — hello, yes, I need an ambulance for my wife. It's Margaret. Something's — her face isn't right, love, and she's — 88 Bramhall Lane. Stockport. I can't understand what she's saying to me. She's in her chair. What do I do?",
    deflection: "I… sorry, what? What did you — sorry, love. I'm all — say it again.",
    reassurance: {
      text: "Ken, you're doing fine. An ambulance is coming. There's no rush on you — just look at Margaret and tell me what you see, one thing at a time.",
      reply: "Right. Yes. Sorry. One thing at a time. Right.",
    },
    answers: {
      a_conscious: {
        text: "Yes — she's awake, she's looking at me. She knows me. She's trying to tell me something and it's all — it's coming out wrong, like she's had a drink. She's not had a drink.",
        tone: "urgent",
      },
      a_breathing: {
        text: "Breathing? Yes. Yes, she's breathing all right, normal I think. She's not gasping or anything. She's just sat there. Her mouth — one side of it's gone down and there's a bit of dribble. I've wiped it.",
      },
      a_happened: {
        text: "She's in her chair. I looked at her and — her face. The left side, it's dropped, like it's melted, and when I asked her what was wrong the words were all jumbled. And her arm. I told her to hold my hand and the left one just lies there. She can't lift it. She lifted the right one.",
        tone: "urgent",
        followUps: [
          {
            id: "a_happened_smile",
            text: "Ask her to smile for me — does one side of her face not move?",
            answer: {
              text: "Margaret, love, smile — smile for them on the phone. …No. The right side goes up and the left side just — it stays. It doesn't move.",
              tone: "urgent",
            },
          },
        ],
      },
      a_when: {
        text: "I — when did — I'm not sure. I'm trying to think. It's all — I'm sorry, love, I'm all over the place. I can't think when.",
        tone: "urgent",
        needsCalm: true,
        followUps: [
          {
            id: "a_when_lastwell",
            text: "Take your time. When did you last see her as her normal self — talking properly, moving properly?",
            answer: {
              text: "Let me think. Let me — I need to think about this properly. I'll have to look at the clock. Hang on.",
            },
          },
        ],
      },
      a_now: {
        text: "Her colour's all right, I think. She's not sweaty. She's frightened — I can see she's frightened, her eyes are going. She's trying to talk and it's like a mouthful of marbles. She's squeezing my hand with her right one.",
        tone: "urgent",
      },
      a_bleeding: {
        text: "No. No blood. She's not fallen, she's not hurt. She's just sat in her chair like she always does.",
      },
      a_age: {
        text: "She's seventy-one. Seventy-one in March. I'm seventy-four.",
      },
      a_history: {
        text: "She's got — she's got tablets, a lot of tablets. Her heart, there's something with her heart, the doctor's got her on things for it. And her blood pressure. They're all in the kitchen in the — the box with the days on. I can't tell you what they're called, I'd have to go and look, and I don't want to leave her.",
        needsCalm: true,
        followUps: [
          {
            id: "a_history_before",
            text: "Has anything like this happened to her before — a stroke, a mini-stroke?",
            answer: {
              text: "No. Never. Nothing like this. She's had her heart looked at, but never this. Never her face.",
            },
          },
        ],
      },
      a_count: {
        text: "Just Margaret. Just her. It's only the two of us.",
      },
      a_danger: {
        text: "It's our front room, it's — it's fine. It's warm. She's in her armchair by the window. There's nothing — no, it's safe. It's just us.",
      },
      a_access: {
        text: "The front door — I'll open it. There's a short drive, our car's on it — they can pull in behind or stop on the road. 88, it's the semi with the white gate. I'll put the porch light on. I'll stand at the door. No — I'll stay with her. Which do you want me to do?",
        followUps: [
          {
            id: "a_access_door",
            text: "Stay with her for now, Ken. Can they get in if you don't come to the door?",
            answer: {
              text: "It's a Yale. I'll take it off the latch now — hang on. …There. It's open. They can just come in. Straight in, first door on the right.",
            },
          },
        ],
      },
      a_with: {
        text: "I'm right here, I'm stood next to her chair. I've got the cordless. I've got her hand.",
      },
      a_instructions: {
        text: "Yes. Yes, tell me. Slowly, love, tell me slowly and I'll do it.",
      },
      a_details: {
        text: "Ken Whitelegg. Kenneth. And she's Margaret. It's the house phone — 0161 496 0310. I'm on the cordless.",
      },
    },
    interjections: [
      {
        atSec: 40,
        text: "She's crying now. Margaret, love, don't — it's all right, they're coming — she's trying to say something and I can't — I can't make it out. What's she saying? I can't understand her.",
        tone: "urgent",
        effect: { state: "panicking" },
      },
      {
        atSec: 105,
        text: "Is somebody coming? You've not — have you sent them? I don't know if you've sent them. She needs somebody now.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 165,
        text: "I keep thinking about when it started — when she was last right. I'm trying to put a time on it and I can't. It matters, doesn't it. I can tell it matters.",
        tone: "urgent",
      },
      {
        atSec: 225,
        text: "That's a siren, I can hear a siren. Is that for us? I'll go and stand at the door for them — I can still see her from the door. Margaret, love, I'm only at the door.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Thank you. Thank you, love. Margaret — they're coming. They're coming, they'll not be long. Hold my hand.",
  },
};
