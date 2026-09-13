import type { Scenario } from "../incident_types";

// Scenario 17 — chest pain, Bury. Category 2.
//
// The decision here is DESTINATION, which is the thing ambulance control
// does that fire control never has to. If this is a STEMI it does not go
// to the nearest hospital — it goes past it, to a heart attack centre,
// because the treatment is a catheter lab and the local ED does not have
// one. Getting that wrong costs heart muscle, and the patient will never
// know it happened.
//
// So the operator's job is not "send an ambulance quickly". It is send
// one, then be ready for the crew to tell you the ECG shows something,
// and know that the answer to that is a longer drive, not a shorter one.
//
// FICTIONAL: Mr Nuttall, his wife and the address. Walmersley Road is a
// real Bury street; the number is not. A-BUR is real from
// nwas_stations.json.

export const scenario17: Scenario = {
  id: "17",
  slug: "17_chest_pain_bury",
  title: "Chest pain — male 58, Bury",
  type: "ambulance_chest_pain",
  patch: "Eastern",
  severity: "high",
  trigger:
    "Category 2 — 58-year-old male, central chest pain radiating to the left arm, sweating and grey. Wife called. Conscious and breathing",

  location: {
    address: "141 Walmersley Road, Bury",
    postcode: "BL9 5DE",
    coords: { lat: 53.6011, lng: -2.2951 },
  },

  property: {
    class: "Semi-detached house — two storey",
    occupants: "Two — the patient and his wife. Both at home",
    vulnerabilities: [
      "Sitting on the stairs when the call was made — a poor place to work and a worse one to carry from",
      "Previous MI four years ago; on medication for it",
    ],
    access: "Front door, driveway. Wife holding the door open",
    knownHazards: ["None on scene"],
    firstDueStationId: "A-BUR",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "Previous myocardial infarction 2022 recorded on the ambulance system; on aspirin and a statin.",
      "Nearest emergency department is Fairfield. Nearest heart attack centre is further, and further is the right answer if the ECG says so.",
    ],
  },

  methane: {
    M: "No",
    E: "141 Walmersley Road, Bury, BL9 5DE",
    T: "Chest pain — one patient, conscious, breathing, sweating and grey",
    H: "None on scene. Patient sat on the stairs — restricted working space",
    A: "Front door and driveway; wife on the door",
    N: "One — male, 58",
    emergencyServices: "Ambulance only",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-BUR",
      notes:
        "Category 2 — a double-crewed ambulance, because this one is going somewhere and an RRV cannot take him",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "C2 response", target: "on scene inside 40 minutes" },
      {
        metric: "Conveying resource",
        target: "a DCA, not a solo responder — this patient needs transport",
      },
      {
        metric: "Destination",
        target: "heart attack centre if the crew report ST elevation, not the nearest ED",
      },
    ],
    lesson:
      "Fire control never chooses a hospital. Ambulance control does, and on this job it is the whole decision. A STEMI goes past the nearest emergency department to a catheter lab, because the nearest department cannot treat it — the right answer is a longer drive. Send a DCA and be ready to send it further than the map suggests.",
  },

  scene: {
    viewBox: { x: -40, y: -32, width: 80, height: 64 },
    compassNorth: "up",
    // What this building will not take. Prose above; a locked option
    // with its reason on it here.
    egressBlocked: [
      { action: "trolley", reason: "He is sat halfway up a domestic staircase — the trolley gets to the hall and no further" },
    ],
    buildings: [
      { shape: { x: -11, y: -22, w: 22, h: 24 }, kind: "target", label: "No. 141" },
      { shape: { x: -33, y: -22, w: 20, h: 24 }, kind: "neighbour", label: "No. 139" },
      { shape: { x: 13, y: -22, w: 20, h: 24 }, kind: "neighbour", label: "No. 143" },
    ],
    roads: [
      { shape: { x: -4, y: 2, w: 9, h: 10 }, kind: "driveway", label: "Drive" },
      { shape: { x: -40, y: 12, w: 80, h: 2 }, kind: "pavement" },
      { shape: { x: -40, y: 14, w: 80, h: 10 }, kind: "road", label: "Walmersley Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: 0, y: 6 }, kind: "car" },
      { pos: { x: -26, y: 18 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "stairs",
        pos: { x: 0, y: -12 },
        kind: "structural",
        label: "Patient on the stairs — restricted working and carrying space",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-17-nuttall",
        label: "Male, 58 — central chest pain, sat on the stairs",
        pos: { x: 0, y: -13 },
        severity: "serious",
        discoverAfterMinBa: 0,
        clinical: {
          // Sweaty, grey, tachycardic and hypertensive with the pain.
          vitals: { rr: 22, spo2: 95, hr: 104, bpSys: 158, bpDia: 92, gcs: 15, temp: 36.6, bm: 6.1 },
          ageYears: 58,
          presumedCondition: "Central chest pain radiating to the left arm — ACS suspected",
          redFlags: ["stemi"],
          // The whole job. A catheter lab, not the hospital down the road.
          preferredDestination: "pci",
          criticalInterventions: ["aspirin", "gtn", "oxygen", "iv_access"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Front / Walmersley Road", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 143 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear garden", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 139 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "wife-first",
      atSec: 5,
      text: "It's my husband — he's got a terrible pain in his chest and it's going down his arm. He's grey and he's soaked through with sweat. He had a heart attack four year ago. He's sat on the stairs, he won't move.",
      tone: "critical",
    },
    {
      id: "aspirin",
      atSec: 55,
      text: "He's took one of his aspirin, is that right? He keeps saying it's just indigestion but he doesn't look right at all.",
      tone: "urgent",
    },
    {
      id: "stemi",
      atSec: 200,
      probability: 0.55,
      suppressesIds: ["settling"],
      text: "Crew on scene — we've got ST elevation on the twelve lead, inferior leads. This is a STEMI. We'll be pre-alerting and going direct to the heart attack centre, not the local.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "settling",
      atSec: 200,
      suppressesIds: ["stemi"],
      text: "Crew on scene — twelve lead's not showing anything acute. Pain's easing with the GTN. We'll still take him in to the local for bloods, but he's stable and comfortable.",
      tone: "info",
    },
  ],

  // The call as Janet has it: on the house phone at the foot of her own
  // stairs, the cord pulled tight, Keith sat six steps up with his fist on
  // his chest telling her not to fuss. She has seen this colour on him
  // once before, four years ago, and he said it was indigestion then too.
  call: {
    caller: {
      name: "Janet Nuttall",
      phone: "0161 496 0170",
      relation: "The patient's wife",
      where: "Foot of the stairs in the hall at 141 Walmersley Road, husband sat halfway up",
      line: "landline",
      state: "anxious",
    },
    opening:
      "It's my husband — 141 Walmersley Road, Bury, the semi with the drive. He's got a pain across his chest, a bad one, and it's gone down his arm, and he's gone a horrible colour. He's sat on the stairs and he won't come down. He's had a heart attack before. Please, can you send someone.",
    deflection: "I don't — I don't know, I can't — just send somebody, please, he's a terrible colour!",
    reassurance: {
      text: "Janet, an ambulance is coming to you. He's awake and he's talking, and that's good. Stay with him, and answer me as best you can.",
      reply: "Right. Yes. Sorry. I'm here — Keith, I'm here, love.",
    },
    answers: {
      a_conscious: {
        text: "Yes — yes, he's awake, he's talking to me. He's telling me not to fuss. He knows where he is, he's just — he's not right. He's grey.",
        tone: "urgent",
      },
      a_breathing: {
        text: "He's breathing. It's fast, though — he says he can't get a proper breath in, like there's a weight on him. He's not wheezing or anything, it's just quick.",
        tone: "urgent",
      },
      a_happened: {
        text: "We were having our tea and he went quiet, and then he said his chest had gone tight. He got up to go and lie down and he only got halfway up the stairs — he sat down and he's not moved since. He says it's like a band, right across here, and it's going down his left arm into his fingers. And he's sweating — he's soaked, his shirt's wet through, and it's not warm in here.",
        tone: "urgent",
        followUps: [
          {
            id: "a_happened_pain",
            text: "Where exactly is the pain — can he point to it?",
            answer: {
              text: "The middle of his chest, he's got his fist on it. Under the bone, he says. And his arm — the left one, all the way down — and up into his jaw a bit now, he says.",
              tone: "urgent",
            },
          },
          {
            id: "a_happened_like",
            text: "Is it like the last time — the heart attack he had before?",
            answer: {
              text: "He says no. But he said no last time an' all, right up until they put him in the ambulance. It looks the same to me. He looks exactly the same.",
              tone: "urgent",
            },
          },
        ],
      },
      a_when: {
        text: "Twenty minutes, maybe. Half six-ish he first said his chest was tight. I thought it was his tea. I should've rung you sooner.",
      },
      a_now: {
        text: "He's grey. Grey, like putty, and there's sweat running off him. He's talking to me but only short — a few words and then he stops to get his breath. He keeps rubbing his arm.",
        tone: "urgent",
        needsCalm: true,
      },
      a_bleeding: {
        text: "No. No, there's no blood, nothing like that. He's not fallen, he's not hurt himself. It's his chest.",
      },
      a_age: {
        text: "Fifty-eight. He was fifty-eight in June.",
      },
      a_history: {
        text: "He had a heart attack four years ago — 2022, it was. They put a stent in, they took him into Manchester for it, past Fairfield. He's on aspirin every day, and a statin, and something for his blood pressure. They're all in the kitchen cupboard, I can get them for you. No diabetes. No allergies that I know of.",
        needsCalm: true,
        followUps: [
          {
            id: "a_history_spray",
            text: "Does he have a spray — a GTN spray, for under his tongue?",
            answer: {
              text: "He did have. I don't know where it is — it'll be out of date, he's not used it in years. He's not been near the doctor's about his heart since the check-ups stopped.",
            },
          },
        ],
      },
      a_count: {
        text: "Just Keith. Just him. It's only the two of us in.",
      },
      a_danger: {
        text: "It's our hall, it's fine. It's just — he's on the stairs, halfway up, and they're steep, and the hall's narrow. I can't get him down on my own and he won't try.",
      },
      a_access: {
        text: "The front door — I'll have it open, I'll put the outside light on. There's a drive, they can pull right onto it, our car's out on the road. The stairs are straight in front of the front door, they'll see him the second they come in. There's nothing in the way — well, the hoover. I'll move the hoover.",
        followUps: [
          {
            id: "a_access_stairs",
            text: "Are the stairs straight, or do they turn?",
            answer: {
              text: "Straight. Straight up from the hall, thirteen of them. He's sat on about the sixth.",
            },
          },
        ],
      },
      a_with: {
        text: "I'm right here, I'm at the bottom of the stairs, I've got hold of his hand. I'm on the house phone, it reaches.",
      },
      a_instructions: {
        text: "Yes. Yes, tell me. What do I do? I'll do it.",
        tone: "urgent",
      },
      a_details: {
        text: "Janet Nuttall. Mrs. It's the house phone — 0161 496 0170.",
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "He's trying to get up — Keith, SIT DOWN. Sit down. — Sorry. He says he wants to go and lie on the bed. I've told him no.",
        tone: "urgent",
      },
      {
        atSec: 110,
        text: "Keith? Keith! — oh God, he'd shut his eyes, I thought — he's alright, he's alright, he's looking at me. He's gone quiet, though. He's gone very quiet.",
        tone: "critical",
        effect: { state: "panicking" },
      },
      {
        atSec: 150,
        text: "Are they coming? You've not said anyone's coming. He's getting worse, I can see him getting worse, please.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 210,
        text: "That's a siren — is that them? I can hear it on the main road. I'm going to open the door. I'll open the door and come straight back.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Thank you. Oh, thank you. I'll get the door. Keith — they're coming, love, they're coming.",
  },
};
