import type { Scenario } from "../incident_types";

// Scenario 37 — child choking, Cheadle.
//
// The shortest job in the sim and the one with the least room in it. A
// choking either clears in the next two minutes or it becomes a cardiac
// arrest, and nothing the operator sends will arrive inside those two
// minutes. What decides it is the person already in the room.
//
// So this is the job where the CALL is the intervention. The nearest
// resource still goes, immediately and without deliberation, but the
// operator is not really dispatching — they are keeping a frightened
// grandmother on the line and telling her what to do with her hands.
//
// It is also the sharpest test of the "nearest, now" instinct. Anything
// with a clinician in it, whatever it is, whoever it belongs to.
//
// FICTIONAL: the child and her grandmother. Cheadle village is real; the
// house is not.

export const scenario37: Scenario = {
  id: "37",
  slug: "37_choking_cheadle",
  title: "Child choking — Cheadle",
  type: "ambulance_choking",
  patch: "Southern",
  severity: "high",
  trigger:
    "Category 1 — child of three choking, coughing weakly, grandmother on the line. Back blows started under instruction",

  location: {
    address: "9 Ashfield Grove, Cheadle, Stockport",
    postcode: "SK8 1BL",
    coords: { lat: 53.3924, lng: -2.2137 },
  },

  property: {
    class: "Semi-detached house — child in the kitchen",
    occupants: "Two — the child and her grandmother",
    vulnerabilities: [
      "Three years old; the margin between coughing and not breathing is very short",
      "Grandmother is alone with her and is the only intervention available in the next two minutes",
    ],
    access: "Front door, driveway. Front door on the latch at the call taker's request",
    knownHazards: ["None"],
    firstDueStationId: "A-CHE",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "The call is the intervention here. Nothing dispatched arrives inside the window that decides it.",
      "Nearest clinical resource of any kind, immediately — this is not a job for waiting on the right vehicle.",
    ],
  },

  methane: {
    M: "No",
    E: "9 Ashfield Grove, Cheadle, SK8 1BL",
    T: "Child choking — three years old, weak cough, partially obstructed",
    H: "None",
    A: "Front door on the latch; driveway",
    N: "One — female child, three",
    emergencyServices: "Ambulance only",
  },

  pda: [
    {
      id: "rrv1",
      label: "Rapid response vehicle",
      service: "Ambulance",
      requiredApplianceTypes: ["RRV"],
      requiredCapabilities: [],
      preferredStationId: "A-CHE",
      notes: "Whatever is nearest with a clinician in it. Do not deliberate about vehicle type",
    },
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-CHE",
      notes: "Because if this does not clear, she needs taking, and quickly",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 60 seconds — nothing to weigh up" },
      { metric: "C1 response", target: "first clinician on scene inside 15 minutes" },
      {
        metric: "Nearest resource",
        target: "sent immediately, whatever type it is",
      },
      {
        metric: "The call",
        target: "caller kept on the line and instructed — she is the only help in the room",
      },
    ],
    lesson:
      "Nothing you send will arrive inside the two minutes that decide this. The grandmother is the intervention and the call taker is the one directing her, so the dispatch decision is simply: nearest thing with a clinician, now, and an ambulance behind it. This is the job where deliberating about which vehicle is the wrong instinct entirely.",
  },

  scene: {
    viewBox: { x: -35, y: -28, width: 70, height: 56 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -11, y: -20, w: 22, h: 20 }, kind: "target", label: "No. 9" },
      { shape: { x: 13, y: -20, w: 20, h: 20 }, kind: "neighbour", label: "No. 11" },
      { shape: { x: -33, y: -20, w: 20, h: 20 }, kind: "neighbour", label: "No. 7" },
    ],
    roads: [
      { shape: { x: -5, y: 0, w: 9, h: 10 }, kind: "driveway", label: "Drive" },
      { shape: { x: -35, y: 10, w: 70, h: 2 }, kind: "pavement" },
      { shape: { x: -35, y: 12, w: 70, h: 9 }, kind: "road", label: "Ashfield Grove" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -1, y: 4 }, kind: "car" },
      { pos: { x: -26, y: 16 }, kind: "lamppost" },
    ],
    hazards: [],
    casualties: [
      {
        id: "cas-37-child",
        label: "Female child, 3 — partially obstructed airway",
        pos: { x: -2, y: -12 },
        severity: "critical",
        discoverAfterMinBa: 0,
        clinical: {
          // Three years old: paediatric numbers, not adult ones. A heart
          // rate of 150 is normal for her and would be alarming in a man
          // of fifty.
          vitals: { rr: 38, spo2: 86, hr: 150, bpSys: 92, bpDia: 56, gcs: 14, temp: 37.1, bm: 5.2 },
          ageYears: 3,
          presumedCondition: "Partial airway obstruction — foreign body, weak ineffective cough",
          redFlags: ["airway_compromise"],
          preferredDestination: "paed_ed",
          // Oxygen is what you give her afterwards. Getting the
          // obstruction out is the job, and until the airway menu carried
          // back blows and forceps there was no way to do it.
          criticalInterventions: ["foreign_body_removal", "oxygen"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Ashfield Grove / drive", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 11 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear garden", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 7 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "gran-first",
      atSec: 3,
      text: "She's choking — my granddaughter, she's three, she's got something stuck. She's going red and she's coughing but nothing's coming up. Please help me, I don't know what to do.",
      tone: "critical",
    },
    {
      id: "instructed",
      atSec: 30,
      text: "Right — I've got her over my arm like you said. I'm doing it between her shoulders. She's still coughing.",
      tone: "critical",
    },
    {
      id: "cleared",
      atSec: 95,
      probability: 0.7,
      suppressesIds: ["not-cleared"],
      text: "It's come up! It's come out — she's crying, she's really crying. Oh, thank God. She's breathing, she's just upset.",
      tone: "info",
    },
    {
      id: "not-cleared",
      atSec: 95,
      suppressesIds: ["cleared"],
      text: "She's stopped coughing and she's gone floppy on me. She's not making any noise at all now. Please tell me what to do.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  // The call as Yvonne has it: the cordless house phone on loudspeaker on
  // the kitchen worktop, Evie over her arm, nobody else in the house. She
  // rang her daughter first. She knows she should have rung 999 first.
  call: {
    caller: {
      name: "Yvonne Tattersall",
      phone: "0161 496 0370",
      relation: "The child's grandmother — minding her for the afternoon",
      where: "The kitchen at 9 Ashfield Grove, the phone on loudspeaker on the worktop, the child over her arm",
      line: "landline",
      state: "panicking",
    },
    opening:
      "Ambulance — please — 9 Ashfield Grove, Cheadle. It's my granddaughter, she's three, she's choking, she's got a grape stuck, she's coughing and nothing's coming up and she's going a terrible colour. Please tell me what to do. Please.",
    deflection: "I can't — I can't think — she can't breathe, just tell me what to do with her, please!",
    reassurance: {
      text: "Yvonne, listen to me. Help is on its way to you right now, and I'm staying on this line with you. You are the best thing she has got, and I'm going to tell you exactly what to do.",
      reply: "Okay. Okay. I'm listening. Tell me.",
    },
    answers: {
      a_conscious: {
        text: "Yes — yes, she's awake, she's looking right at me. Her eyes are huge. She knows what's happening, that's the worst of it. She's awake.",
        tone: "critical",
      },
      a_breathing: {
        text: "No. No, she's not. She's coughing but it's a tiny little cough, there's nothing coming, and she can't get a breath in between them. She's gone red in the face and her lips are going a funny colour. Oh God.",
        tone: "critical",
        followUps: [
          {
            id: "a_breathing_noise",
            text: "Can she cry, or make any sound?",
            answer: {
              text: "She's trying to cry and it's — it's a squeak. It's not a cry. She can't say anything, she's just looking at me and grabbing at her neck.",
              tone: "critical",
            },
          },
          {
            id: "a_breathing_cough",
            text: "Is the cough bringing anything up at all?",
            answer: {
              text: "Nothing. It was a proper cough when it started, a big one, and it's got smaller and smaller. It's just little ones now. It's not shifting it.",
              tone: "critical",
            },
          },
        ],
      },
      a_happened: {
        text: "She was having her tea at the table — grapes, I gave her grapes, whole ones, I never cut them up, you're meant to cut them up — and she laughed at something on the telly and she just went. She started coughing and grabbing at her throat. It's a grape. I know it's a grape.",
        tone: "urgent",
        followUps: [
          {
            id: "a_happened_mouth",
            text: "Can you see anything in her mouth?",
            answer: {
              text: "I've looked — I can't see it, it's gone right back. I put my finger in and I couldn't feel anything. I shouldn't have done that, should I. I couldn't see it.",
              tone: "urgent",
            },
          },
        ],
      },
      a_when: {
        text: "Just now — two minutes? Three. I rang her mum first, I rang Kate and then I rang you — I didn't know what to do. Three minutes. Four.",
        tone: "urgent",
      },
      a_now: {
        text: "She's red — she's gone from red to a sort of purple round her mouth. She's sweating, her hair's stuck to her head. She can't talk to me. She's just looking at me — her eyes. Please.",
        tone: "critical",
      },
      a_bleeding: {
        text: "No. No, nothing like that, no blood. It's her breathing. It's just her breathing.",
      },
      a_age: {
        text: "Three. She's only three. She's tiny, she's a tiny little thing.",
      },
      a_history: {
        text: "Nothing — she's never had anything wrong with her, she's a healthy little thing. No allergies, she's not on anything. Her mum would know better than me, but there's nothing.",
        needsCalm: true,
      },
      a_count: {
        text: "Just her. Just Evie. It's just me and her in the house.",
      },
      a_danger: {
        text: "It's my kitchen. There's nothing — it's fine, it's just the two of us.",
      },
      a_access: {
        text: "Front door, straight off the drive. Number 9, there's a blue Corsa on the drive. The kitchen's at the back, straight through. I'll get the door — I can't put her down — I'll take her with me.",
        followUps: [
          {
            id: "a_access_latch",
            text: "Can you put the front door on the latch without putting her down?",
            answer: {
              text: "Yes — hang on — right. It's done, it's on the latch, I've got her, I've still got her. They can come straight in. Straight through to the back.",
            },
          },
        ],
      },
      a_with: {
        text: "She's over my arm — I've got her, I've got her right here. The phone's on the side on loudspeaker, I can't hold both.",
      },
      a_instructions: {
        text: "Yes. Yes. Tell me what to do — tell me and I'll do it. Please just tell me.",
        tone: "urgent",
      },
      a_details: {
        text: "Yvonne Tattersall. I'm her nana. It's the house phone — 0161 496 0370. Please hurry.",
        needsCalm: true,
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "Do I do the — the squeezing thing, the Heimlich? Do I do that on her? Do you do that on a little one? Tell me — do I do it?",
        tone: "urgent",
      },
      {
        atSec: 80,
        text: "Is somebody coming? You've not said anybody's coming — is there somebody actually on their way to us? Please say yes.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 120,
        text: "Her mum's on her way — Kate, my daughter, she's coming from work, she said ten minutes. I rang her before I rang you. I should have rung you first, shouldn't I. I should have rung you first.",
      },
      {
        atSec: 160,
        text: "I can hear a siren — is that them? Is that for us? The door'll be on the latch for them — tell them to come straight in, straight through to the back.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Thank you — oh, thank you. The door'll be on the latch for them. Tell them to run in. Tell them the kitchen.",
  },
};
