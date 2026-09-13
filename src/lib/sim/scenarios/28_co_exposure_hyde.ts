import type { Scenario } from "../incident_types";

// Scenario 28 — carbon monoxide, multiple casualties, Hyde.
//
// The hazard is invisible, odourless, and has already had four people
// before anybody rang. That is what makes it different from every other
// job in the sim: by the time it is reported, the harm is done and the
// question is how many more.
//
// Two traps for the operator. The first is that it presents as an
// ambulance job — four people unwell in a house — and the ambulance
// service cannot make a house safe. The second is that a crew who walk in
// without monitoring become casualties themselves, which is exactly how
// responders die at these.
//
// So it is joint from the first minute, the fire service goes for the
// atmosphere rather than the patients, and somebody has to think about
// the houses either side, because a shared flue does not respect a party
// wall.
//
// FICTIONAL: the family and the address. Gee Cross and Hyde are real; the
// house is not.

export const scenario28: Scenario = {
  id: "28",
  slug: "28_co_exposure_hyde",
  title: "Carbon monoxide — four unwell, Gee Cross, Hyde",
  type: "special_service_co_exposure",
  patch: "Eastern",
  severity: "high",
  trigger:
    "Four occupants of one house unwell — headaches, nausea, one collapsed. Neighbour reports the same symptoms next door. CO suspected",

  location: {
    address: "31 Higham Lane, Gee Cross, Hyde",
    postcode: "SK14 5LX",
    coords: { lat: 53.4362, lng: -2.0703 },
  },

  property: {
    class: "Semi-detached house — gas central heating, back boiler in the living room chimney breast",
    occupants:
      "Four in the property: two adults, two children. One adult collapsed. Neighbours at no. 33 also reporting headaches",
    vulnerabilities: [
      "Two children in the property",
      "Adjoining house reporting the same symptoms — a shared flue does not respect a party wall",
      "Nobody should enter without monitoring, including the ambulance crew",
    ],
    access: "Front door onto Higham Lane. Driveway. Neighbours at 33 out on the pavement",
    knownHazards: [
      "Carbon monoxide — invisible, odourless, and already at a level that has affected four people",
      "Ignition risk if the source is an unburnt gas escape rather than incomplete combustion",
      "Adjoining property potentially affected through the shared stack",
    ],
    firstDueStationId: "G42",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "Back boiler in the chimney breast; the stack is shared with no. 33.",
      "Gas emergency service required — the fire service can ventilate and monitor but not condemn or isolate the appliance.",
    ],
  },

  methane: {
    M: "No",
    E: "31 Higham Lane, Gee Cross, Hyde, SK14 5LX",
    T: "Suspected carbon monoxide — four casualties in one property, symptoms next door",
    H: "CO at unknown concentration. Shared stack with no. 33. No entry without monitoring",
    A: "Front door and driveway off Higham Lane",
    N: "Four confirmed, one collapsed. Two more reporting symptoms at no. 33",
    emergencyServices: "Fire and ambulance; gas emergency service required",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G42",
      notes:
        "Monitoring and ventilation. The fire service goes for the atmosphere — nobody enters, including the ambulance crew, until it is read",
    },
    {
      id: "pump2",
      label: "Pump 2",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      notes: "No. 33 needs monitoring too, and that is a second crew's job",
    },
    {
      id: "dca1",
      label: "Ambulance 1",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      notes: "Four casualties in one house — one ambulance does not move four people",
    },
    {
      id: "dca2",
      label: "Ambulance 2",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      notes: "Two children among them, and two more symptomatic next door",
    },
    {
      id: "officer",
      label: "Station Manager",
      service: "Fire",
      requiredApplianceTypes: ["FIRE_SM"],
      requiredCapabilities: ["Command"],
      notes: "Multiple casualties across two properties with an invisible hazard",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      {
        metric: "Joint response",
        target: "fire and ambulance together — this is not an ambulance job with a fire footnote",
      },
      {
        metric: "Casualty count",
        target: "two ambulances for four casualties, before anybody asks",
      },
      {
        metric: "Adjoining property",
        target: "no. 33 monitored — a shared flue does not respect a party wall",
      },
    ],
    lesson:
      "By the time this is reported the harm has already happened, and the only question left is how many more. It looks like an ambulance job and it is not: the ambulance service cannot make a house safe, and a crew walking into an unmonitored atmosphere becomes the fifth casualty. Send both, send enough transport for the count you have been given, and think about next door before somebody rings from it.",
  },

  scene: {
    viewBox: { x: -45, y: -35, width: 90, height: 70 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -12, y: -26, w: 22, h: 24 }, kind: "target", label: "No. 31" },
      { shape: { x: 12, y: -26, w: 22, h: 24 }, kind: "neighbour", label: "No. 33 — symptoms" },
      { shape: { x: -38, y: -26, w: 22, h: 24 }, kind: "neighbour", label: "No. 29" },
    ],
    roads: [
      { shape: { x: -6, y: -2, w: 9, h: 12 }, kind: "driveway", label: "Drive" },
      { shape: { x: -45, y: 10, w: 90, h: 2 }, kind: "pavement" },
      { shape: { x: -45, y: 12, w: 90, h: 10 }, kind: "road", label: "Higham Lane" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.4366, lng: -2.0711 }, street: "Higham Lane" }],
    landmarks: [
      { pos: { x: -2, y: 4 }, kind: "car" },
      { pos: { x: 22, y: 16 }, kind: "car" },
      { pos: { x: -32, y: 18 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "co-atmosphere",
        pos: { x: -2, y: -14 },
        kind: "gas",
        label: "Carbon monoxide — invisible, odourless, concentration unknown until monitored",
        knownFromPri: true,
      },
      {
        id: "back-boiler",
        pos: { x: 2, y: -18 },
        kind: "gas",
        label: "Back boiler in the chimney breast — likely source",
        knownFromPri: true,
      },
      {
        id: "shared-stack",
        pos: { x: 11, y: -22 },
        kind: "gas",
        label: "Stack shared with no. 33 — the adjoining house may be affected too",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-28-adult-1",
        label: "Adult — collapsed in the living room",
        pos: { x: -4, y: -16 },
        severity: "critical",
        discoverAfterMinBa: 1,
        clinical: {
          // SpO2 96% on a patient who is unconscious from hypoxia. That is
          // not an error — the oximeter is reading carboxyhaemoglobin as
          // if it were oxygen, and believing it is the trap.
          vitals: { rr: 24, spo2: 96, hr: 122, bpSys: 102, bpDia: 60, gcs: 8, temp: 36.6, bm: 6.3 },
          ageYears: 41,
          presumedCondition: "Carbon monoxide exposure — collapsed, oximetry falsely reassuring",
          redFlags: ["airway_compromise"],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen", "iv_access"],
        },
      },
      {
        id: "cas-28-adult-2",
        label: "Adult — confused, in the hallway",
        pos: { x: 0, y: -10 },
        severity: "serious",
        discoverAfterMinBa: 1,
        clinical: {
          vitals: { rr: 20, spo2: 97, hr: 104, bpSys: 128, bpDia: 78, gcs: 13, temp: 36.8, bm: 5.8 },
          ageYears: 38,
          presumedCondition: "Carbon monoxide exposure — headache, nausea, confused",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen"],
        },
      },
      {
        id: "cas-28-child-1",
        label: "Child — headache and vomiting",
        pos: { x: -6, y: -21 },
        severity: "serious",
        discoverAfterMinBa: 2,
        clinical: {
          // Paediatric observations. Children take up CO faster than
          // adults for the same exposure, which is why the two youngest in
          // this house are worse than the mother.
          vitals: { rr: 28, spo2: 97, hr: 132, bpSys: 98, bpDia: 60, gcs: 14, temp: 37.0, bm: 5.4 },
          ageYears: 12,
          presumedCondition: "Carbon monoxide exposure — headache and vomiting, child",
          redFlags: [],
          preferredDestination: "paed_ed",
          criticalInterventions: ["oxygen"],
        },
      },
      {
        id: "cas-28-child-2",
        label: "Child — drowsy, upstairs",
        pos: { x: 2, y: -23 },
        severity: "serious",
        discoverAfterMinBa: 3,
        clinical: {
          // Upstairs, so a longer exposure than her sibling, and found
          // last. Drowsy and hard to rouse on saturations of 98%.
          vitals: { rr: 26, spo2: 98, hr: 138, bpSys: 94, bpDia: 56, gcs: 11, temp: 36.9, bm: 5.1 },
          ageYears: 9,
          presumedCondition: "Carbon monoxide exposure — drowsy, difficult to rouse, child",
          redFlags: ["airway_compromise"],
          preferredDestination: "paed_ed",
          criticalInterventions: ["oxygen", "iv_access"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Higham Lane frontage", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 33", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear garden", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 29", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "neighbour-first",
      atSec: 5,
      text: "Something's wrong with the family at 31. She's rung me because they've all got splitting headaches and the little one's been sick, and now her husband's gone down on the living room floor. I've been in there and I've come over funny myself.",
      tone: "critical",
    },
    {
      id: "next-door",
      atSec: 60,
      text: "I'm at 33, next door to them. I've had a headache since yesterday and so has my wife. We thought it was a bug going round. It's not, is it?",
      tone: "urgent",
    },
    {
      id: "boiler",
      atSec: 140,
      probability: 0.75,
      text: "She says the fire in the living room's been playing up — it's one of them back boilers behind the gas fire. It's been going all week with the cold.",
      tone: "urgent",
    },
    {
      id: "drowsy-child",
      atSec: 260,
      probability: 0.55,
      text: "The older one's upstairs and they can't get her to wake up properly. She's breathing but she's not with it.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  // The call as Tony has it: on the drive at 31 with his mobile, having
  // been in and come out again with his head swimming. He lives next
  // door. He does not yet know that matters.
  call: {
    caller: {
      name: "Tony Brierley",
      phone: "07700 900828",
      relation: "Neighbour — rung round by the mother at 31",
      where: "The drive at 31 Higham Lane, a few steps back from the open front door",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "31 Higham Lane, Gee Cross, in Hyde. I didn't know who to ask for — the whole family's poorly in there, all four of them, and the dad's collapsed on the front room floor. I've just been in and I've come out feeling sick myself. I think there's something in the house.",
    deflection: "I don't know what it is — that's what I'm telling you, there's nothing to see, they're just all going down — send someone!",
    reassurance: {
      text: "Tony, you've done right ringing. Help's coming, fire and ambulance both. Stay outside, keep them coming out to you, and answer me what you can.",
      reply: "Right. Yeah. Sorry. I'm on the drive. Go on.",
    },
    answers: {
      f_seen: {
        text: "That's the thing — there's nothing. No smoke, no fire, no smell. It's a normal house. But every one of them's got a splitting head, one of the girls has been sick, and Craig's flat out on the front room carpet. And I was only in there two minutes and I came out and the drive was going round. It's the house. There's something in it.",
        tone: "urgent",
        followUps: [
          {
            id: "f_seen_craig",
            text: "The man on the floor — is he awake? Is he breathing?",
            answer: {
              text: "He's breathing. He's not awake — well, he's sort of groaning. Leanne's shaking him and he's not coming round. I saw him yesterday and he was right as rain.",
              tone: "critical",
            },
          },
        ],
      },
      f_where: {
        text: "The front room, mostly — that's where he went down, that's where they were all sat. But it's the whole house. She says the girls have got it too and one of them's been upstairs in bed.",
      },
      f_spread: {
        text: "It's not something you can see spread. But they're all worse than when she rang me — she said headaches, and by the time I got round he was on the floor. And I got it just walking in. So whatever it is, it's still in there.",
        tone: "urgent",
      },
      f_started: {
        text: "She says they've all been off it since last night, and worse this morning — heads, feeling sick. She thought it was a bug. He went down about ten minutes ago, that's when she rang me. I've been round five minutes.",
      },
      f_building: {
        text: "A semi. Normal three-bed semi, brick, gas heating. Two up two down and a kitchen on the back. It's joined on to the next one along.",
      },
      f_inside: {
        text: "All four of them, still. Craig on the floor, Leanne with him — she won't leave him — and the two girls. One's been sick in the kitchen and the other one's still upstairs in bed. I've told Leanne to get them out and she's shouting at me to come and help her lift him.",
        tone: "critical",
        effect: {
          regrade: "EMERGENCY",
          basis: "Four affected in one property, one collapsed — suspected CO, atmosphere unread, nobody safe to enter",
        },
        followUps: [
          {
            id: "f_inside_out",
            text: "Can you get them out — her and the children — without going back in yourself?",
            answer: {
              text: "I've shouted for her to send the girls out to me. One of the girls is coming to the door now. The other one — she'll have to go up for her. Do I go in? Tell me. I'll go in if you tell me to.",
              tone: "urgent",
            },
          },
          {
            id: "f_inside_windows",
            text: "Can she open the windows and doors from where she is?",
            answer: {
              text: "The front door's wide open, I've propped it. I'll shout her to do the front room window. She's not listening to me, she's all over the place herself — she's not making sense.",
            },
          },
        ],
      },
      f_hurt: {
        text: "Craig's the worst — he's out of it on the floor. Leanne's up and about but she's not right, she's confused, she keeps asking me the same thing. One of the girls has been sick twice. And me — I'm alright, I'm just dizzy. I'll be alright.",
        tone: "urgent",
        needsCalm: true,
      },
      f_vulnerable: {
        text: "The two girls. They're twelve and nine. And Craig can't get himself out — he's a big lad, Leanne can't shift him and I don't think I could either. Nobody old, no. It's them.",
      },
      f_hazards: {
        text: "It's gas — gas heating, a gas fire in the front room, a boiler somewhere, same as any house. No cylinders, nothing like that. But I can't smell gas. That's what's frightening me. There's no smell at all.",
        tone: "urgent",
        followUps: [
          {
            id: "f_hazards_alarm",
            text: "Do they have a carbon monoxide alarm — has anything been going off?",
            answer: {
              text: "I don't know. Nothing's going off, I didn't hear anything. I've not got one myself, I keep meaning to — I don't know if they've got one.",
            },
          },
        ],
      },
      f_danger: {
        text: "Only what's in there. Whatever it is, it had me in two minutes — your lot'll be walking into the same. Nothing else. Nobody's kicking off. Cars on the road, the usual.",
      },
      f_access: {
        text: "Front door's open — I've propped it with the mat. There's a drive with a red Corsa on it, they can pull in behind it or stop on the road. Higham Lane, up off Stockport Road at Gee Cross — 31's on the left going up, the one with the grey door. I'm stood outside it.",
      },
      f_safe: {
        text: "I'm on the drive. Outside. I'm not going back in — well, I will if you tell me, for the girls. But I'm out. I feel sick but I'm out.",
        needsCalm: true,
      },
      f_stay: {
        text: "Yeah. Yes. I'm not going anywhere.",
      },
      f_details: {
        text: "Tony Brierley. This is my mobile — 07700 900828.",
      },
    },
    interjections: [
      {
        atSec: 40,
        text: "She's screaming at me — Craig's not answering her, he's gone all floppy. Leanne! Leave him, get the girls out! — She's not listening.",
        tone: "critical",
        effect: { state: "panicking" },
      },
      {
        atSec: 95,
        text: "Is somebody coming? Only if it's what I think it is they're all stood in it while we're talking. What do I do?",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 175,
        text: "One of the girls is out on the doorstep now, she's white as a sheet. Leanne's gone back up the stairs for the other one. I've told her — she's not listening to me.",
        tone: "urgent",
      },
      {
        atSec: 220,
        text: "I can hear a siren — is that yours? Tell them it's the one with the grey door and the red Corsa. And tell them not to just walk in.",
        tone: "urgent",
        requiresOpened: true,
      },
    ],
    onDispatch: "Right. Thank you. Tell them there's nothing to see, it's in the air — tell them to bring whatever it is they use to read it. I'll get everyone out on the drive.",
  },
};
