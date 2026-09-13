import type { Scenario } from "../incident_types";

// Scenario 41 — fight outside licensed premises, Deansgate Locks.
//
// The night-time economy job, and the one where the desk has two voices
// in its ear. The door supervisor rings it in and can see the patient;
// the city centre CCTV control room, having heard it on the venues'
// radio scheme, rings in thirty seconds later on its own line and can
// see everything else — the two offenders walking west, the taxi rank,
// the cab they get into. The caller knows the injury. The cameras know
// the street. An operator who only listens to
// the phone sends everything to the bar and loses the offenders; one who
// only listens to the cameras chases two men down Deansgate while a lad
// with a head injury is being sick on the pavement.
//
// Underneath that it is scenario 35 again: police first, ambulance
// staged close and not stood down, because the people who did this are
// still on the same street. And it is a second job hiding inside the
// first — at 01:40 on Whitworth Street West the taxi rank is its own
// flashpoint, and a car peeled off the patient to deal with it is a car
// that is now doing neither.
//
// The clinical trap is the drink. A 23-year-old at 01:40 who is slurring
// and vomiting is easy to write off as drunk. He went down from a single
// punch and his head hit the kerb; the GCS is 13 and it is moving.
//
// REAL: Whitworth Street West, Deansgate Locks (a row of bars in the
// railway arches on the far side of the Rochdale Canal from the street,
// each reached by its own footbridge, under the Metrolink viaduct), the
// hackney rank at the Deansgate end, and the fact that Manchester runs
// a council CCTV control room linked by radio to city centre venues —
// named generically here on purpose.
// FICTIONAL: the bar, everyone in it, the cab and its plate.

export const scenario41: Scenario = {
  id: "41",
  slug: "41_fight_deansgate_locks",
  title: "Fight outside licensed premises — Deansgate Locks",
  type: "police_fight_night_time_economy",
  patch: "Southern",
  severity: "high",
  trigger:
    "Door supervisor at a bar on Deansgate Locks. Fight on the north pavement of Whitworth Street West, one male down with a head injury, two offenders walking off towards the taxi rank. City centre CCTV picking them up",

  location: {
    address: "Whitworth Street West, Deansgate Locks, Manchester",
    // Deansgate Locks' own postcode. Centroid sits on the Locks walkway;
    // the coords below are the pavement on the street side of the canal.
    postcode: "M1 5LH",
    coords: { lat: 53.4745, lng: -2.25 },
  },

  property: {
    class:
      "City centre street outside licensed premises — railway arches on the far side of the canal, patient on the pavement",
    occupants:
      "Very busy. 01:40 on a weekend: queues outside the arches, a crowd round the patient, the taxi rank at the Deansgate end full",
    vulnerabilities: [
      "Offenders still on the street and being tracked by CCTV — they have not left",
      "Head injury with alcohol on board, so the drink hides the injury",
      "Open water — the Rochdale Canal is immediately behind the pavement",
      "Crowd that has been drinking, including the patient's friends",
    ],
    access:
      "Whitworth Street West from Deansgate (west) or Albion Street (east). The bridges over the canal to the arches are for people, not vehicles. Ambulance staging at the Albion Street end keeps it close and out of the crowd",
    knownHazards: [
      "Ongoing violence — two offenders on the street and a second flashpoint at the rank",
      "Live carriageway with cabs and private hire pulling in across the kerb",
      "Open water behind the pavement, dark, with a crowd that has been drinking",
    ],
    firstDueStationId: "MP-MCR",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — public highway. The arches are licensed premises with their own door teams.",
      "Deansgate Locks' door teams are on a city centre venues' radio scheme that the council CCTV control room listens to. Expect a second informant from the cameras coming through on their own line, and expect them to still have eyes when the caller has none.",
      "Repeat location for weekend violence in the local knowledge file — the desk has had the Locks and the rank at this hour before.",
      "The Rochdale Canal runs between the pavement and the arches. Anybody who goes over the side at 01:40 is a different job.",
    ],
  },

  methane: {
    M: "No",
    E: "Whitworth Street West, Deansgate Locks, Manchester, M1 5LH — north pavement, at the foot of the bridge to the arch",
    T: "Fight outside licensed premises — one casualty with a head injury, two offenders on the street tracked by CCTV, second flashpoint at the taxi rank",
    H: "Ongoing violence; crowd; alcohol; open water behind the pavement; live carriageway",
    A: "Whitworth Street West from Deansgate or Albion Street. Ambulance staged at the Albion Street end until police call it forward",
    N: "One confirmed — male, head injury. More may present from the rank",
    emergencyServices: "Police lead — three cars; ambulance staged and committed on their word",
  },

  // Three cars and an ambulance. A city centre weekend has this many
  // out already; the question is where each one goes, and the answer is
  // three different places on one street.
  pda: [
    {
      id: "police1",
      label: "Police — first car, the patient",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      preferredStationId: "MP-MCR",
      notes:
        "To the patient and the crowd round him. The ambulance goes in on this car's word and not before",
    },
    {
      id: "police2",
      label: "Police — second car, the offenders",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      preferredStationId: "MP-MCR",
      notes:
        "Goes where the cameras say, not to the bar. CCTV has the two males walking west — this car meets them, or the cab they get into",
    },
    {
      id: "police3",
      label: "Police — third car, the taxi rank",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      preferredStationId: "MP-MCR",
      notes:
        "The rank is a separate job on the same street. One car cannot hold a crowd at the bridge and a fight eighty metres away",
    },
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-CEN",
      notes:
        "Staged at the Albion Street end, not stood down. The moment the first car has the pavement they want to be seconds away",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      {
        metric: "Sequence",
        target: "police committed before the ambulance; ambulance staged at the Albion Street end, not stood down",
      },
      {
        metric: "Second flashpoint",
        target: "a car sent to the rank as its own job, not peeled off the patient",
      },
      {
        metric: "Use of CCTV",
        target: "whatever the control room gives — direction, descriptions, names, a cab index — taken down and put on the log as it lands, not held until the picture is complete",
      },
      {
        metric: "Destination",
        target: "head injury with a GCS of 13 and vomiting goes to the major trauma centre, not the nearest A&E",
      },
    ],
    lesson:
      "Two voices, and neither of them has the whole job. The door supervisor can see the patient and nothing else; the CCTV room can see the street and cannot see how bad he is. Your job is to hold both — police first, ambulance staged at the Albion Street end and called forward on the first car's word, a second car sent where the cameras say the offenders are, and a third to the rank because the rank is its own fight and not a detail of this one. Write down what the cameras give you — a description, a name, a cab index, whichever the night hands over — because when the caller hangs up that is all you have left. And do not let 01:40 and a smell of drink explain a GCS of 13. He was punched once and his head hit the kerb. That is a head injury until somebody with a scanner says otherwise.",
  },

  // Whitworth Street West runs east-west. North of it, in order: the
  // pavement where the queues form, the Rochdale Canal, the Locks walkway
  // and the arches under the Metrolink viaduct. Each bar has its own
  // bridge over the canal. Deansgate is off the west end; the rank sits
  // along the north kerb at that end. Deansgate station is beyond the
  // south side.
  scene: {
    viewBox: { x: -90, y: -45, width: 180, height: 80 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -78, y: -30, w: 68, h: 14 }, kind: "neighbour", label: "Railway arches — other bars, under the Metrolink viaduct" },
      { shape: { x: -8, y: -30, w: 16, h: 14 }, kind: "target", label: "Cutwater — arch (fictional)" },
      { shape: { x: 10, y: -30, w: 78, h: 14 }, kind: "neighbour", label: "Railway arches — other bars" },
      { shape: { x: -78, y: 14, w: 166, h: 16 }, kind: "neighbour", label: "South side — station approach" },
    ],
    roads: [
      { shape: { x: -90, y: -45, w: 10, h: 80 }, kind: "road", label: "Deansgate" },
      { shape: { x: -80, y: -16, w: 168, h: 4 }, kind: "pavement", label: "Deansgate Locks walkway" },
      { shape: { x: -80, y: -12, w: 168, h: 8 }, kind: "water", label: "Rochdale Canal" },
      // The bridges. People only — a cab cannot cross and neither can a
      // trolley with anything on it, which is why the patient is on the
      // street side.
      { shape: { x: -61.5, y: -12, w: 3, h: 8 }, kind: "pavement" },
      { shape: { x: -41.5, y: -12, w: 3, h: 8 }, kind: "pavement" },
      { shape: { x: -21.5, y: -12, w: 3, h: 8 }, kind: "pavement" },
      { shape: { x: -1.5, y: -12, w: 3, h: 8 }, kind: "pavement", label: "Bridge — Cutwater" },
      { shape: { x: 18.5, y: -12, w: 3, h: 8 }, kind: "pavement" },
      { shape: { x: 38.5, y: -12, w: 3, h: 8 }, kind: "pavement" },
      { shape: { x: 58.5, y: -12, w: 3, h: 8 }, kind: "pavement" },
      { shape: { x: -80, y: -4, w: 168, h: 4 }, kind: "pavement", label: "North pavement — queues" },
      { shape: { x: -80, y: 0, w: 168, h: 10 }, kind: "road", label: "Whitworth Street West" },
      { shape: { x: -80, y: 10, w: 168, h: 4 }, kind: "pavement" },
      { shape: { x: 58, y: 10, w: 30, h: 4 }, kind: "driveway", label: "Ambulance staging — east end" },
    ],
    hydrants: [],
    landmarks: [
      // The rank is on the carriageway against the north kerb, not on the
      // pavement.
      { pos: { x: -72, y: 1.5 }, kind: "car", label: "Taxi rank — hackney carriages" },
      { pos: { x: -64, y: 1.5 }, kind: "car" },
      { pos: { x: -56, y: 1.5 }, kind: "car" },
      { pos: { x: -48, y: 1.5 }, kind: "car" },
      { pos: { x: -30, y: 12 }, kind: "lamppost" },
      { pos: { x: 30, y: 12 }, kind: "lamppost" },
      { pos: { x: 44, y: 12 }, kind: "other", label: "CCTV column — control room camera" },
    ],
    hazards: [
      {
        id: "crowd",
        pos: { x: 6, y: -2 },
        kind: "structural",
        label: "Crowd round the patient, most of them drinking, his friends among them",
        knownFromPri: true,
      },
      {
        id: "offenders",
        pos: { x: -28, y: -2 },
        kind: "structural",
        label: "Two males walking west along the north pavement toward the rank — CCTV has them",
        knownFromPri: true,
      },
      {
        id: "canal",
        pos: { x: 24, y: -8 },
        kind: "structural",
        label: "Rochdale Canal — open water immediately behind the pavement, dark",
        knownFromPri: true,
      },
      {
        id: "carriageway",
        pos: { x: 30, y: 5 },
        kind: "structural",
        label: "Live carriageway — cabs and private hire pulling in and out across the kerb",
        knownFromPri: true,
      },
      {
        id: "rank-flashpoint",
        pos: { x: -60, y: -2 },
        kind: "structural",
        label: "Taxi rank — head of the queue, the usual second flashpoint on this street",
        knownFromPri: false,
        discoverAfterMinOnScene: 1,
      },
    ],
    casualties: [
      {
        id: "cas-41-holroyd",
        label: "Male, 23 — head injury, vomited, consciousness fluctuating",
        pos: { x: 0, y: -2 },
        severity: "critical",
        discoverAfterMinBa: 0,
        clinical: {
          // Not the rising-pressure picture of scenario 35 yet. Pulse and
          // pressure are ordinary; the GCS is 13 and it has already been
          // lower once. Alcohol on board and a low-normal sugar to go
          // with it. This is the one that gets written off as drunk.
          vitals: { rr: 16, spo2: 96, hr: 92, bpSys: 142, bpDia: 86, gcs: 13, temp: 36.1, bm: 4.7 },
          ageYears: 23,
          presumedCondition:
            "Head injury with reduced and fluctuating consciousness after a fall onto the kerb — vomited once, alcohol on board",
          redFlags: ["head_injury_severe"],
          // GCS 13 after a head strike with vomiting and a period of
          // unconsciousness is a major trauma centre pathway, whatever
          // the hour and whatever he has had to drink.
          preferredDestination: "mtc",
          criticalInterventions: ["oxygen", "iv_access", "spine_board"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · North pavement / patient", face: "front", bearingDeg: 0 },
      { id: 2, label: "Sector 2 · Taxi rank — Deansgate end", face: "left", bearingDeg: 270 },
      { id: 3, label: "Sector 3 · Carriageway / south side", face: "rear", bearingDeg: 180 },
      { id: 4, label: "Sector 4 · East end — ambulance staging", face: "right", bearingDeg: 90 },
    ],
  },

  // Two voices. The door supervisor is the caller; the CCTV control room
  // comes up on the radio scheme and stays with the offenders. Every beat
  // says which of them is talking. Nothing here claims a unit has
  // arrived — the caller clears the line when the first one does.
  informantScript: [
    {
      id: "door-first",
      atSec: 5,
      text: "Door staff at Cutwater, Deansgate Locks, Whitworth Street West. Big fight outside on the pavement — one lad's gone down and cracked his head on the kerb, he's not right, he was out for a bit. Two of them did it and they've walked off towards Deansgate, towards the rank.",
      tone: "critical",
    },
    {
      id: "cctv-eyes",
      atSec: 30,
      text: "City centre CCTV control room — we've picked this up off the door staff on the radio scheme. I've got a camera on Whitworth Street West: two males, one white shirt, one dark jacket, walking west along the pavement on the canal side. I'm staying with them.",
      tone: "urgent",
    },
    {
      id: "patient-vomited",
      atSec: 70,
      text: "Door staff again. He's come round a bit but he's just been sick and he's not making sense. Blood from the back of his head. I've got him on his side and my colleague's a first aider, but there's a crowd and I'd not want your ambulance stood here on their own.",
      tone: "critical",
    },
    // The cameras know a face. Roughly two nights in three they say so,
    // and when they do the door staff can put a name to it — the branch
    // that gives the operator something to search.
    {
      id: "cctv-known",
      atSec: 95,
      probability: 0.7,
      text: "CCTV. The one in the white shirt — my colleague knows him off the scheme, he's been put out of the Locks before. The door lads will have a name for him.",
      tone: "info",
    },
    {
      id: "door-name",
      atSec: 110,
      requiresFiredIds: ["cctv-known"],
      text: "Door staff. Yeah — white shirt is Tyler Farrell, he's barred from half the Locks. The other one's Kieran Dunne, they're always together.",
      tone: "info",
    },
    // The roll. Either the two of them walk into the rank and it goes
    // off, or they get into a cab and are gone. cab-away carries no
    // probability on purpose — it is the other side of rank-flashpoint,
    // and one of the two has to land.
    {
      id: "rank-flashpoint",
      atSec: 130,
      probability: 0.7,
      suppressesIds: ["cab-away"],
      text: "CCTV. It's going off at the rank now. Your two have walked straight into an argument at the head of the queue and it's pushing and shoving — one of the cab drivers has locked himself in his cab. That's a good eighty metres down from your lad on the floor, you'll not cover both with one car.",
      tone: "critical",
    },
    {
      id: "cab-away",
      atSec: 140,
      suppressesIds: ["rank-flashpoint"],
      text: "CCTV. Your two have got straight into a black cab at the head of the rank — index Mike Kilo two one, Echo Yankee Charlie. Pulling out onto Deansgate now, heading north. I'll follow it on the cameras as far as I can.",
      tone: "urgent",
    },
    // Only on a slow night. Five minutes with nobody on the street and
    // the rank stops being an argument.
    {
      id: "rank-worse",
      atSec: 240,
      delayThresholdSec: 300,
      requiresFiredIds: ["rank-flashpoint"],
      text: "CCTV. Still nothing on scene at the rank and it's spreading — a dozen involved now and a bottle's gone. Where are your units?",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "deteriorating",
      atSec: 280,
      probability: 0.4,
      text: "Door staff. He's gone quiet on us again. Eyes rolling. My colleague's not happy with him at all.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  callGrade: {
    scale: "police_thrive",
    grade: 1,
    standardMinutes: 15,
    basis:
      "GMP Grade 1 (Immediate) — 15 minutes, GMP's own published figure: Chief Constable's Regulation 28 response, 26 Aug 2025 (\"Immediate or grade 1 incidents - within 15 minutes\") and GMCA GMP Performance Briefing, Jan 2026 (\"under 15 minutes (our aspired attendance time)\"). Violence in progress with an injured party and offenders still on the street is Grade 1 on GMP's THRIVE. GMP publishes one force-wide figure, no rural split",
  },

  // The call as Emmanuel has it: on his own mobile on the north pavement
  // at the foot of the Cutwater bridge, stood over a lad who went down
  // from one punch, with Sophie holding his head and two hundred people
  // watching. He can see the patient. He cannot see the rank.
  call: {
    caller: {
      name: "Emmanuel Okafor",
      phone: "07700 900377",
      relation: "Door supervisor at Cutwater, Deansgate Locks",
      where: "North pavement of Whitworth Street West, at the foot of the bridge to the arch, stood over the patient",
      line: "mobile",
      state: "calm",
    },
    opening:
      "Police and an ambulance — Cutwater, Deansgate Locks, Whitworth Street West. I'm door staff. We've had a fight on the pavement outside, one lad's gone down and cracked his head on the kerb and he was out cold. He's come round but he's not right. The two that did it have walked off up towards the rank. They've not left the street.",
    deflection: "Hang on — Soph, get them back off him — sorry. Go on.",
    reassurance: {
      text: "Emmanuel, you've done everything right. Officers are coming. Stay with him and keep talking to me.",
      reply: "Yeah. Yeah, I'm here. Go on.",
    },
    answers: {
      p_happening: {
        text: "Fight outside the bar, on the pavement on the canal side. One punch, lad's gone down backwards and his head's hit the kerb. He was out — properly out, twenty, thirty seconds. He's come round now but he's mumbling, he's not making sense. Two lads did it and they've walked off west, towards Deansgate. The rank's that way, and the rank's full.",
        tone: "critical",
        effect: { regrade: "GRADE 1", basis: "Violence in progress — one male with a head injury, two offenders still on the same street" },
        followUps: [
          {
            id: "p_happening_crowd",
            text: "How many people are round him?",
            answer: {
              text: "His mates, four or five of them, and everybody in the queue's turned round to look. Couple of hundred on the pavement between here and the rank. Sophie's keeping his mates off him — they keep trying to sit him up.",
              tone: "urgent",
            },
          },
        ],
      },
      p_ongoing: {
        text: "Not here, no — the two of them have gone. He's on the floor, that's what's still going on. But they've not left, they've walked up the pavement towards the rank and there's a queue up there. I'd not say it's finished.",
        tone: "urgent",
      },
      p_weapons: {
        text: "No. Nothing. Fists — one punch. I didn't see anything in their hands and I was looking, it's the first thing you look for on this door.",
      },
      p_injured: {
        text: "The lad on the floor. Back of his head on the kerb, he was out cold, and now he's come round he's not with it. There's blood at the back of his head — not loads, but it's there. Nobody else hurt that I've seen.",
        tone: "critical",
        followUps: [
          {
            id: "p_injured_breathing",
            text: "Is he breathing normally?",
            answer: {
              text: "He's breathing. Bit snory. We've got him on his side — Sophie's a first aider, she's got his head. He's a bit pale.",
              tone: "urgent",
            },
          },
          {
            id: "p_injured_awake",
            text: "Is he awake and talking to you?",
            answer: {
              text: "Eyes are open. He's saying stuff but it's not making sense — he's asked me what happened three times. His mates are saying he's just drunk. He's not just drunk.",
              tone: "urgent",
            },
          },
        ],
      },
      p_who: {
        text: "Two lads did it — one in a white shirt, one in a dark jacket, twenties, both of them. The lad on the floor, his mates are calling him Connor. Then it's me and my colleague Sophie, and the crowd.",
      },
      p_description: {
        text: "White shirt — short sleeves, dark hair, stocky, shorter of the two. The other one's in a dark jacket, black or navy, jeans, taller and thinner, I think a beard. Both white lads, mid-twenties. Walking, not running. Cocky with it.",
      },
      p_direction: {
        text: "West, along our pavement — the canal side — towards Deansgate and the taxi rank. On foot. I lost them past the next arch, there's a queue there. I can't see the rank from here, there's too many people.",
        tone: "urgent",
        followUps: [
          {
            id: "p_direction_now",
            text: "Can you see them now?",
            answer: {
              text: "No. There's two hundred people between me and the rank. The council cameras cover this whole street and they listen to our radio — they'll have heard me put it out. Ask them.",
            },
          },
        ],
      },
      p_drink: {
        text: "He's had a drink, they all have, it's quarter to two. But he wasn't falling about before. He went down from one punch and his head hit the kerb — that's not the drink, that's his head.",
        tone: "urgent",
      },
      p_known: {
        text: "I know the faces. The one in the white shirt's been put out of the Locks before, I'm nearly sure of it. I'll get you a name — give me a minute, my head's with this lad on the floor.",
      },
      p_vulnerable: {
        text: "Him — he's on the floor with a head injury and he's not with it. And there's the canal right behind us, it's dark and half this crowd have had a skinful. That's what I'm stood on.",
        tone: "urgent",
      },
      p_where: {
        text: "Whitworth Street West, Deansgate Locks — the north pavement, canal side, right at the foot of the bridge to Cutwater. M1 5LH. Bring your ambulance in from the Albion Street end, it's quieter that side — the Deansgate end is the rank and it's chocka.",
      },
      p_safe: {
        text: "I'm alright. I'm stood over him with Sophie. The two that did it have gone. It's the crowd I'm watching, not me.",
      },
      p_seen: {
        text: "I saw it. I was on the bridge end of the door. One punch — I saw it land and I saw him go down. I can pick both of them out.",
      },
      p_details: {
        text: "Emmanuel Okafor. Door supervisor at Cutwater, SIA badge. This is my own mobile — 07700 900377.",
      },
    },
    interjections: [
      {
        atSec: 50,
        text: "Sorry — his mates are trying to sit him up again. I've told them leave him where he is. Soph's got him back on his side.",
        tone: "urgent",
      },
      {
        atSec: 90,
        text: "His mates are telling me he's just pissed. He's not just pissed. I've seen pissed every night for six years — he went down from one punch and his head hit the kerb.",
        tone: "urgent",
      },
      {
        atSec: 150,
        text: "I can hear sirens on Deansgate. Tell them north side, canal side, foot of the Cutwater bridge — I'm in the black coat with the lanyard, stood over him.",
        requiresOpened: true,
      },
      {
        atSec: 200,
        text: "Is anyone actually coming? I've got a full street out here, a lad who's not right on the floor, and the two who did it are still on it. I can't hold this with two of us.",
        tone: "urgent",
        requiresOpened: false,
      },
    ],
    onDispatch: "Good. Tell your ambulance the Albion Street end — I'll walk them in myself once your lot have got the pavement. Foot of the Cutwater bridge.",
  },
};
