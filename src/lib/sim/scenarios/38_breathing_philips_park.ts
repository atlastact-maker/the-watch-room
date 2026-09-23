import type { Scenario } from "../incident_types";

// Scenario 38 — acute asthma, Beswick.
//
// The job that changes category while you are looking at it. He starts as
// a breathing difficulty and he can finish as a cardiac arrest, and the
// signal that it is going that way is not more noise — it is less. A
// wheeze means air is moving. A silent chest means it is not.
//
// So the trap is the opposite of the obvious one. The operator hears the
// caller calm down, the patient stop making a fuss, and the temptation is
// to relax. That is exactly the moment to upgrade it.
//
// He is also on the fourth floor of a block with a lift that is out,
// which is a dispatch problem rather than a clinical one: whatever goes
// has to carry its kit up eight flights, and carry him back down them.
//
// FICTIONAL: the patient, his flatmate and the block. Beswick is real;
// this block is not.

export const scenario38: Scenario = {
  id: "38",
  slug: "38_breathing_philips_park",
  title: "Acute asthma — fourth floor, Beswick",
  type: "ambulance_breathing",
  patch: "Southern",
  severity: "high",
  trigger:
    "Category 2 — male 24, known asthmatic, severe attack. Inhaler not helping. Fourth floor, lift out of service",

  location: {
    address: "Flat 14, Ryebank Court, Beswick, Manchester",
    postcode: "M11 3TG",
    coords: { lat: 53.4801, lng: -2.1897 },
  },

  property: {
    class: "Six-storey residential block — patient on the fourth floor",
    occupants: "Two — the patient and his flatmate",
    vulnerabilities: [
      "Lift out of service — eight flights up with kit, and the same back down with him",
      "Known asthmatic with a previous ITU admission on the record",
    ],
    access:
      "Main entrance with a door entry system; flatmate will come down. Stairs only — the lift has been out for a fortnight",
    knownHazards: ["Stair carry, both directions"],
    firstDueStationId: "A-PHP",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — residential block.",
      "Previous intensive care admission for asthma on the ambulance record. That history matters more than today's observations.",
      "Lift out of service. Reported to the housing provider a fortnight ago and still out.",
    ],
  },

  methane: {
    M: "No",
    E: "Flat 14, Ryebank Court, Beswick, M11 3TG",
    T: "Acute asthma — severe, not responding to his own inhaler",
    H: "Stair carry from the fourth floor, both directions",
    A: "Main entrance, door entry; flatmate coming down. Stairs only",
    N: "One — male, 24",
    emergencyServices: "Ambulance only",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-PHP",
      notes: "A DCA. He is going, and carrying him down eight flights is a two-person job at least",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "C2 response", target: "on scene inside 18 minutes" },
      {
        metric: "Escalation",
        target: "upgraded if the caller reports him going quiet — a silent chest is worse, not better",
      },
      {
        metric: "Access",
        target: "lift failure passed to the crew before they arrive with a carry chair",
      },
    ],
    lesson:
      "The one that gets quieter as it gets worse. A wheeze means air is moving; a silent chest means it is not, and the caller telling you he has stopped making a fuss is the moment to upgrade rather than relax. And pass on the lift: a crew who arrive expecting one and find eight flights have lost minutes they will not get back on the way down.",
  },

  scene: {
    viewBox: { x: -45, y: -40, width: 90, height: 80 },
    compassNorth: "up",
    // Eight flights down, with the lift out.
    egressExtraSeconds: 480,
    // What this building will not take. Prose above; a locked option
    // with its reason on it here.
    egressBlocked: [
      { action: "trolley", reason: "Lift out of service — eight flights, and nothing on wheels goes down them" },
      { action: "wheelchair", reason: "Eight flights with the lift out. A wheelchair is a carry with extra weight in it" },
    ],
    buildings: [
      { shape: { x: -18, y: -32, w: 36, h: 34 }, kind: "target", label: "Ryebank Court — flat 14, 4th" },
      { shape: { x: 22, y: -20, w: 20, h: 18 }, kind: "neighbour", label: "Bin store" },
    ],
    roads: [
      { shape: { x: -45, y: 6, w: 90, h: 10 }, kind: "driveway", label: "Parking court" },
      { shape: { x: -45, y: 20, w: 90, h: 9 }, kind: "road", label: "Access road" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.4805, lng: -2.1904 }, street: "Access road" }],
    landmarks: [
      { pos: { x: -30, y: 10 }, kind: "car" },
      { pos: { x: -14, y: 10 }, kind: "car" },
      { pos: { x: 30, y: 24 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "lift-out",
        pos: { x: -6, y: -14 },
        kind: "structural",
        label: "Lift out of service — eight flights with kit, and the carry down",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-38-asthma",
        label: "Male, 24 — severe asthma, fourth floor",
        pos: { x: 0, y: -24 },
        severity: "critical",
        // Found from the open: an ambulance job has no BA search to run.
        discoverAfterMinBa: 0,
        clinical: {
          // Exhausted rather than wheezing: the respiratory rate has come
          // DOWN and the saturations with it, which is the bad direction.
          vitals: { rr: 32, spo2: 88, hr: 128, bpSys: 132, bpDia: 78, gcs: 14, temp: 37.0, bm: 6.0 },
          ageYears: 24,
          presumedCondition: "Acute severe asthma — poor air entry, unable to complete sentences",
          redFlags: ["severe_asthma"],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["salbutamol_neb", "oxygen", "iv_access"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Main entrance", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Bin store side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear elevation", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Parking court", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "flatmate-first",
      atSec: 5,
      text: "My flatmate can't breathe — he's asthmatic and he's had his inhaler about six times and it's doing nothing. He's sat forward on the edge of the bed and he can't get a sentence out. You can hear him wheezing from the hall.",
      tone: "critical",
    },
    {
      id: "lift",
      atSec: 45,
      text: "We're on the fourth. The lift's been out a fortnight so it's the stairs, sorry. I'll come down and let them in.",
      tone: "urgent",
    },
    {
      id: "itu",
      atSec: 120,
      probability: 0.7,
      text: "He was in intensive care with his chest a couple of years back. He's scared, he keeps saying it feels like that time.",
      tone: "urgent",
    },
    {
      id: "silent-chest",
      atSec: 230,
      probability: 0.45,
      text: "He's gone quiet — he's not wheezing any more, he's just sat there. I thought that was a good sign but he looks worse, he's gone grey round the mouth.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  // The call as Josh has it: on his mobile, sat on the edge of Ryan's bed
  // with a hand on his back, four floors up a block whose lift has been
  // out for a fortnight. He can hear the wheeze from the hall. He has
  // never seen his mate like this.
  call: {
    caller: {
      name: "Josh Meredith",
      phone: "07700 900838",
      relation: "The patient's flatmate",
      where: "Ryan's bedroom, flat 14 on the fourth floor of Ryebank Court, sat beside him on the bed",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "Ambulance — Flat 14, Ryebank Court, Beswick, M11. It's my flatmate, he's asthmatic and he's having a really bad attack — he can't breathe properly, he's had his inhaler loads of times and it's not doing anything. He can't talk to me. We're on the fourth floor and the lift's broke.",
    deflection: "I don't know — I don't KNOW, I'm not a doctor — just get someone here, he can't breathe!",
    reassurance: {
      text: "Josh, you're doing everything right. The ambulance is coming. Keep him sat forward, keep him as calm as you can, and tell me what you can see.",
      reply: "Right. Yeah. Okay. Sorry. I'm here. He's — yeah. I'm here.",
    },
    answers: {
      a_conscious: {
        text: "Yeah — yeah, he's awake. He's sat up on the edge of the bed, he's looking at me. He knows what's going on, he's just — he can't talk to me. He gets a word out and then he's got to breathe again.",
        tone: "urgent",
      },
      a_breathing: {
        text: "No. That's the whole thing — he's asthmatic and it's a bad one. He's wheezing, you can hear it from the hall, can you hear that? He's breathing dead fast and his shoulders are going up and down with it. He can't finish a sentence. He's had his inhaler six, seven times and it's done nothing.",
        tone: "critical",
        followUps: [
          {
            id: "a_breathing_sentences",
            text: "Can he speak in full sentences at all?",
            answer: {
              text: "No. One word, two words. He said 'can't' and then 'ring them', and that was two goes. He's nodding and shaking his head at me instead.",
              tone: "critical",
            },
          },
          {
            id: "a_breathing_inhaler",
            text: "Which inhaler has he used, and how many puffs?",
            answer: {
              text: "The blue one — Ventolin, the reliever. He's had it six times at least, more, he just keeps going at it. There's a brown one as well but that's his morning one, he's not touched that. It's the blue one that's meant to sort it and it's not.",
            },
          },
        ],
      },
      a_happened: {
        text: "He's had a bad chest all day — he was coughing before he went to work this morning, said it was a cold. Then about twenty minutes ago he came out of the bathroom and he couldn't get his breath. He got the inhaler and it didn't do anything, and he's got worse since. He's sat on the edge of his bed leaning forward with his hands on his knees. I've never seen him like this.",
        tone: "urgent",
      },
      a_when: {
        text: "The bad bit, twenty minutes? Half an hour, tops. He's been wheezy since he got in from work but it went proper bad about twenty minutes ago. I rang you when he'd had the inhaler five times and it wasn't touching it.",
      },
      a_now: {
        text: "He's white. Pale, and he's sweating buckets, his T-shirt's stuck to him. He's leaning forward on his knees and he can't sit back. He can't talk to me properly, he's mouthing at me. He's scared. I can see he's scared.",
        tone: "critical",
        followUps: [
          {
            id: "a_now_lips",
            text: "What colour are his lips?",
            answer: {
              text: "They're — normal, I think. They're not blue. He's just white in the face. Is that what I watch for? I'll watch for that.",
              tone: "urgent",
            },
          },
        ],
      },
      a_bleeding: {
        text: "No, nothing like that. Nothing's happened to him, it's his chest. It's just his asthma.",
      },
      a_age: {
        text: "Twenty-four. He's twenty-four. Ryan — Ryan Whitehead.",
      },
      a_history: {
        text: "Asthma, bad asthma — he's had it since he was a kid. He's got the blue inhaler and a brown one, and he's on tablets for it as well, I think, there's a box in the kitchen. He's been in hospital with it before, a couple of years back, before I lived here — I don't know the ins and outs of it. Nothing else that I know of. No allergies that I know of.",
        needsCalm: true,
      },
      a_count: {
        text: "Just Ryan. It's just me and him in the flat.",
      },
      a_danger: {
        text: "Yeah, it's just our flat, nothing wrong in here. It's getting him out that's the problem — we're on the fourth floor and the lift's knackered.",
      },
      a_access: {
        text: "Ryebank Court, the main door on the front — it's a buzzer, flat 14. We're on the fourth floor. The lift's out, it's been out two weeks and nobody's fixed it, so it's the stairs all the way up — eight flights, two a floor. Sorry. I'll leave the flat door open.",
        followUps: [
          {
            id: "a_access_door",
            text: "Is there anyone else who can go down to the door, so you can stay with him?",
            answer: {
              text: "No — it's just us. I'll go down when I hear them and come straight back up. The buzzer's rubbish, half the time it doesn't open, it's quicker if I'm stood at the door. I'll not leave him till I hear them.",
            },
          },
        ],
      },
      a_with: {
        text: "Yeah, I'm sat next to him on the bed. I've got my hand on his back. He's leaning on me a bit.",
      },
      a_instructions: {
        text: "Yeah. Yeah, go on, what do I do? I'll do whatever.",
      },
      a_details: {
        text: "Josh Meredith. It's my mobile — 07700 900838. If it cuts out ring it back, I'll be here.",
      },
    },
    interjections: [
      {
        atSec: 50,
        text: "Hang on — he's going at the inhaler again. Ryan, mate — he's had it that many times. Is that bad? Should I take it off him?",
        tone: "urgent",
      },
      {
        atSec: 110,
        text: "He's just grabbed hold of my arm — he's scared, he's proper scared, he's mouthing something at me and I can't tell what he's saying. Ryan. RYAN. I don't know what to do. Tell me what to do.",
        tone: "critical",
        effect: { state: "panicking" },
      },
      {
        atSec: 165,
        text: "Is anyone actually coming? You've not said anyone's coming. He's getting worse, I'm telling you he's getting worse, and I can't get him down eight flights on my own.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 210,
        text: "I can hear a siren — is that you? I'm going down to let them in, I'll be two minutes. Fourth floor, flat 14, the flat door's open. Tell them the lift's out, tell them not to stand there waiting for it.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Thank you. Tell them the lift's out — fourth floor, flat 14, I'll come down and let them in. Tell them to bring a chair or whatever it is. Please be quick.",
  },
};
