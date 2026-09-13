import type { Scenario } from "../incident_types";

// Scenario 36 — GP admission, Middleton.
//
// The humblest job on the board. A GP has been out, examined her, decided
// she needs admitting, and rung for an ambulance. Nobody is dying and
// nobody is panicking. She is 83, she has a chest infection, and she has
// a bed waiting on a ward.
//
// It is here for two reasons. It is enormously common — a real ambulance
// service runs a great many of these every day — and it is the job an
// operator is most tempted to keep deferring, because every C1 and C2
// that lands is more urgent than she is. She can wait. And wait. And the
// longer she does, the more likely she is to become a C2 on her own.
//
// A doctor has already assessed her. That is worth something: the
// clinical uncertainty other jobs carry is not here, which makes it easy
// to leave and easy to get wrong.
//
// FICTIONAL: Mrs Openshaw, her GP and the address. Rochdale Road in
// Middleton is real; the bungalow is not.

export const scenario36: Scenario = {
  id: "36",
  slug: "36_hcp_admission_middleton",
  title: "GP admission — female 83, Middleton",
  type: "ambulance_hcp_admission",
  patch: "Eastern",
  severity: "moderate",
  trigger:
    "Category 3 — GP request. 83-year-old female, chest infection, requires admission. Bed arranged on the medical assessment unit. GP has left the address",

  location: {
    address: "12 Bowness Court, off Rochdale Road, Middleton",
    postcode: "M24 2QT",
    coords: { lat: 53.5551, lng: -2.1988 },
  },

  property: {
    class: "Warden-assisted bungalow — single storey, level access",
    occupants: "One — the patient. Warden holds a key and is aware",
    vulnerabilities: [
      "83, frail, chest infection. A doctor has already decided she needs to be in hospital",
      "Alone in the property; the warden checks but does not stay",
    ],
    access: "Level access, front door. Warden's office at the head of the court holds a key",
    knownHazards: ["None"],
    firstDueStationId: "A-MID",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — warden-assisted housing.",
      "GP has attended, examined and referred. Bed arranged on the medical assessment unit; the ward is expecting her.",
      "Warden holds a key. Level access throughout.",
    ],
  },

  methane: {
    M: "No",
    E: "12 Bowness Court, off Rochdale Road, Middleton, M24 2QT",
    T: "GP admission — chest infection, bed arranged on the assessment unit",
    H: "None",
    A: "Level access; warden holds a key at the head of the court",
    N: "One — female, 83, conscious and orientated",
    emergencyServices: "Ambulance only",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-MID",
      notes:
        "One DCA. A doctor has already made the clinical decision — this is a journey, and the journey still takes an hour",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "no target — this is not an emergency" },
      { metric: "C3 response", target: "on scene inside 120 minutes" },
      {
        metric: "Deferral",
        target: "not left indefinitely — a deferred admission becomes an emergency",
      },
      {
        metric: "Proportionate response",
        target: "one DCA, no RRV — a clinician has already seen her",
      },
    ],
    lesson:
      "The job you will be most tempted to keep pushing back, because everything else that lands is more urgent than she is. She can wait — and every hour she waits at home with a chest infection makes it likelier she becomes the C2 you were trying to leave room for. A doctor has already done the difficult part. All that is left is the hour of driving nobody wants to spend.",
  },

  scene: {
    viewBox: { x: -40, y: -30, width: 80, height: 60 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -10, y: -20, w: 20, h: 14 }, kind: "target", label: "No. 12" },
      { shape: { x: -34, y: -20, w: 20, h: 14 }, kind: "neighbour", label: "No. 10" },
      { shape: { x: 14, y: -20, w: 20, h: 14 }, kind: "neighbour", label: "No. 14" },
      { shape: { x: 14, y: 2, w: 20, h: 12 }, kind: "neighbour", label: "Warden's office" },
    ],
    roads: [
      { shape: { x: -40, y: -2, w: 80, h: 8 }, kind: "driveway", label: "Bowness Court" },
      { shape: { x: -40, y: 18, w: 80, h: 9 }, kind: "road", label: "Rochdale Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -24, y: 2 }, kind: "car" },
      { pos: { x: -32, y: 22 }, kind: "lamppost" },
    ],
    hazards: [],
    casualties: [
      {
        id: "cas-36-openshaw",
        label: "Female, 83 — chest infection, for admission",
        pos: { x: 0, y: -13 },
        severity: "walking",
        discoverAfterMinBa: 0,
        clinical: {
          // A chest infection in an 83-year-old: febrile, a little fast,
          // saturations sliding. Not an emergency yet, and every hour she
          // waits at home moves her closer to being one.
          vitals: { rr: 24, spo2: 92, hr: 102, bpSys: 118, bpDia: 68, gcs: 15, temp: 38.3, bm: 5.5 },
          ageYears: 83,
          presumedCondition: "Chest infection — GP referred for admission, bed arranged",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Bowness Court", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Warden's office", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 10 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "gp-first",
      atSec: 6,
      text: "It's the surgery — Doctor's been out to Mrs Openshaw at 12 Bowness Court. She's 83, she's got a chest infection and she's not managing at home. He wants her admitting. There's a bed on the assessment unit, they're expecting her.",
      tone: "info",
    },
    {
      id: "warden",
      atSec: 60,
      text: "The warden's got a key and she knows you're coming. Level access all the way in, no steps.",
      tone: "info",
    },
    {
      id: "chasing",
      atSec: 900,
      probability: 0.7,
      text: "Just chasing on Mrs Openshaw. She's sat in her chair with her bag packed. The ward have rung asking where she is.",
      tone: "info",
    },
    {
      id: "worse",
      atSec: 1800,
      probability: 0.35,
      text: "The warden's rung us — she says Mrs Openshaw's breathing has got a lot worse this last hour and she's gone quite drowsy. Can you upgrade it?",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  // The call as Bev has it: on the surgery line at the front desk of the
  // Lakeside Practice with a queue in front of her and Dr Hollins's
  // referral note in her hand. She has not seen Mrs Openshaw. She is
  // reading the doctor's numbers off the form, and she says so.
  call: {
    caller: {
      name: "Bev Tomlinson",
      phone: "0161 496 0360",
      relation: "Practice administrator at the Lakeside Practice, ringing for Dr Hollins",
      where: "The front desk at the Lakeside Practice, Middleton — the surgery, not the patient's address",
      line: "landline",
      state: "calm",
    },
    opening:
      "Hello, it's the Lakeside Practice in Middleton — I'm ringing for Dr Hollins. He's been out on a visit to one of our patients, a Mrs Openshaw, 12 Bowness Court, off Rochdale Road. She's eighty-three, she's got a chest infection and she's not managing at home, and he wants her admitting. He's rung the medical assessment unit and they've got a bed for her. He's asked me to book the ambulance.",
    deflection: "Sorry, love — I've got three at the desk and the other line going. Say that again?",
    reassurance: {
      text: "Bev, I know you're busy. I've nearly got what I need — just stay with me one more minute.",
      reply: "Go on then, love. Quick as you like.",
    },
    answers: {
      a_conscious: {
        text: "Yes — she's awake and she's with it. Doctor's just come back from her, she was sat in her chair talking to him. It's a chest infection, love, she's not collapsed or anything like that.",
      },
      a_breathing: {
        text: "She's short of breath, that's why he wants her in. It's on his note — 'breathless on minimal exertion, respiratory rate twenty-four, saturations ninety-two on air'. I'm reading it off the referral, I've not seen her myself. She's not gasping, she's just not managing.",
        followUps: [
          {
            id: "a_breathing_oxygen",
            text: "Is she on any oxygen at home?",
            answer: {
              text: "No, nothing like that. She's got an inhaler for her chest from last winter, that's all it says.",
            },
          },
        ],
      },
      a_happened: {
        text: "Her daughter rang us this morning — she's been chesty since the weekend, off her food, and this morning she couldn't get from her chair to the kitchen without stopping for breath. Dr Hollins went out on his visits and examined her. He's written 'lower respiratory tract infection, probable pneumonia' — she needs antibiotics through a drip and some oxygen, and she can't have that at home on her own. He rang the assessment unit from her house, they've accepted her, and he's back here now. He left her about twenty minutes ago.",
        followUps: [
          {
            id: "a_happened_temp",
            text: "Has he written a temperature and a pulse?",
            answer: {
              text: "Thirty-eight point three. Pulse a hundred and two, and blood pressure one-eighteen over sixty-eight. It's all on here, I can read you the lot if you want it.",
            },
          },
        ],
      },
      a_when: {
        text: "She's been poorly since the weekend, her daughter said. Worse this morning. Doctor saw her about an hour ago and rang the bed through before he left her.",
      },
      a_now: {
        text: "I've not seen her, love, I'm going off his note. He's written 'alert and orientated, flushed, febrile, tachypnoeic' — hot and breathing fast, in English. He said she was chatty enough with him. She's not confused. He's told her to get her bag packed and she's doing that.",
      },
      a_bleeding: {
        text: "No, nothing like that. It's her chest.",
      },
      a_age: {
        text: "Eighty-three. Irene Openshaw. I've got her date of birth and her NHS number here if you need them for the booking.",
      },
      a_history: {
        text: "She's on a fair bit — I've got her repeat list up. Blood pressure tablets, a water tablet, something for her thyroid, and the blue inhaler. Penicillin allergy — that's flagged on her record, he's put it in capitals on the letter, so the ward knows. No diabetes, no heart trouble that's written down. She had a fall last year, nothing broken.",
        followUps: [
          {
            id: "a_history_meds",
            text: "Will her medication and the letter go with her?",
            answer: {
              text: "Doctor's told her to put her tablets in her bag. He's left the referral letter on her side table for the crew, with a copy of the list.",
            },
          },
        ],
      },
      a_count: {
        text: "Just her. Just Mrs Openshaw.",
      },
      a_danger: {
        text: "It's her bungalow, love. It's fine. She's sat in her chair. No dogs, nothing like that — it's sheltered housing, they're all little bungalows.",
      },
      a_access: {
        text: "12 Bowness Court, off Rochdale Road — it's the sheltered bungalows, the little close set back from the main road. Front door. Doctor says she'll get to the door herself, she's slow but she's on her feet. It's number twelve, she's on the left as you come in.",
        followUps: [
          {
            id: "a_access_warden",
            text: "Is there anyone on site who can let the crew in if she can't get to the door?",
            answer: {
              text: "There's a warden — it's warden-assisted, there's an office on the court. I'd have to find the number. I can ring her if you want me to, so she knows you're coming.",
            },
          },
        ],
      },
      a_with: {
        text: "No, I'm at the surgery — I'm the practice administrator. Doctor's been and gone. She's on her own at home. Her daughter's in Rochdale, she's at work, she's trying to get over.",
      },
      a_instructions: {
        text: "I'm not with her, love — I'm at the surgery. There's nothing I can do for her from here. If you need someone with her I'll ring the warden.",
      },
      a_details: {
        text: "Bev Tomlinson, practice administrator at the Lakeside Practice, Middleton. It's the surgery number, 0161 496 0360 — ask for me, or for Dr Hollins if you need him. He's back in surgery but he'll come out for you.",
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "Sorry — bear with me, I've got a patient at the desk. — Right. Go on.",
      },
      {
        atSec: 100,
        text: "Is that being sent, or is it going on a list? Only Doctor's told her 'this afternoon' and I'd rather not have him promising her something that isn't true.",
        requiresOpened: false,
      },
      {
        atSec: 160,
        text: "Doctor's just put his head round — he says to tell you she lives alone and she's not to be left overnight. That's why he wants her in today, not tomorrow. He says if it's going to be hours, tell him and he'll ring the ward himself.",
      },
      {
        atSec: 210,
        text: "Right — that's booked, is it? I'll ring her and tell her to have her bag by the door, and I'll let the ward know she's on her way. Thank you, love.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Lovely. I'll ring her and tell her to have her bag by the door, and I'll let the ward know. Thanks, love.",
  },
};
