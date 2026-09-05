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
};
