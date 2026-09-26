import type { Scenario } from "../incident_types";

// Scenario 40 — burglary in progress, Ladythorn Road, Bramhall.
//
// The quiet Grade 1. Everything about this job is decided by how much
// noise the response makes on the way in. The occupier is upstairs with
// two people below her, whispering into the phone, and the first thing
// she says is do not send sirens — because the moment the offenders hear
// a two-tone on Bramhall Lane they are out of the patio doors and over
// the back fence, and what was an in-progress burglary with the offenders
// inside becomes a search of dark gardens for two people who are gone.
//
// So the mechanics are: silent approach from the A5102, front and rear
// covered before anyone goes near the door (two units — a house with one
// side covered is not contained), and the dog asked for at the start,
// because both dog vans are the best part of twenty minutes away and a
// track goes cold in less. Meanwhile the caller wants to go downstairs with a hockey stick
// and the operator's other job is to make sure she does not.
//
// Roughly six nights in ten they leave out the back before anyone
// arrives, and the car that was waiting across the road pulls off after
// them. The other four they are still inside when the first unit gets
// there, and on a slow response the caller hears them on the stairs.
//
// Run-to-run variants, drawn once per call:
//   base        — the pair and the car, as above; the 60/40 roll on
//                 whether they are gone before the first unit.
//   gone-early  — they were done in two minutes: out over the fence
//                 and the Audi away before anyone had turned off the
//                 A5102. A search from the start, and the dog is the job.
//   lone        — one man, no car: an opportunist on foot who got in
//                 through the unlocked patio door, hears her on the
//                 phone, and walks out of the front towards the main
//                 road. No plate to run; a description and a direction.
//   tried-door  — the pair, and one of them comes up the stairs and
//                 tries the bedroom handle before they run. The operator
//                 has to hold her still and silent through it.
//
// GEOGRAPHY, verified against OpenStreetMap ways and postcodes.io:
// Ladythorn Road SK7 2ES is a real residential road in Pownall Green,
// Bramhall, running north-west to south-east from Bramhall Lane South
// (A5102) — it crosses Dairyground Road 50 m in from the A5102 — to a
// south-east end. Ladythorn Crescent is a loop off its north-east side:
// it leaves Ladythorn Road about 60 m north-west of the house, runs
// round behind the north-east-side houses, and rejoins Ladythorn Road at
// the south-east end about 170 m from the house. Rossall Drive comes in
// from the south-west side opposite the Crescent's north-west junction.
// The house, its number, its occupants and the offenders are FICTIONAL.
// Housing on Ladythorn Road itself is not mapped in OSM; "detached" is
// the typology of the surrounding streets, not a claim about any real
// plot. The burglary series in the PRI is invented for the sim and is
// not a statement about real crime on these roads.

export const scenario40: Scenario = {
  id: "40",
  slug: "40_burglary_bramhall",
  title: "Burglary in progress — Ladythorn Road, Bramhall",
  type: "police_burglary_in_progress",
  patch: "Southern",
  severity: "high",
  trigger:
    "999 from the occupier, upstairs in a detached house — somebody is on the ground floor, torchlight moving through the hall. She is whispering and asks for no sirens",

  location: {
    address: "Ladythorn Road, Bramhall, Stockport",
    postcode: "SK7 2ES",
    coords: { lat: 53.3603, lng: -2.158 },
  },

  property: {
    class: "Detached dwelling — two storey, 1930s, set back behind a front garden with a drive down one side",
    size: "~150 m² over two floors; long rear garden to a fence at the bottom",
    materials: "Brick, tiled roof, uPVC windows; uPVC patio doors at the rear onto the garden",
    occupants:
      "One — the occupier, female (~58), upstairs in the front bedroom with the door locked. Husband away overnight. Two offenders believed on the ground floor; a third in a car on the road",
    vulnerabilities: [
      "The occupier is alone upstairs with the offenders directly below her, and wants to go down",
      "Rear garden backs onto the gardens of the Ladythorn Crescent houses behind — an unlit line out the back that comes out on a different road",
      "Detached: no party wall, so nobody next door hears anything or knows anything is happening",
    ],
    access:
      "Front door and drive onto Ladythorn Road; side gate on the drive to the rear garden. The rear is reached on foot from Ladythorn Crescent, which loops off Ladythorn Road behind the house — go in at its far, south-east end, about 170 m down the road, so the unit never passes the front; the near junction is 60 m north-west of the house and in view of it. Ladythorn Road runs off Bramhall Lane South (A5102) at its north-west end, about 370 m away — silent from that junction: lights off, no sirens, and units hold short of the house",
    knownHazards: [
      "Two offenders inside, tools presumed — a torch and whatever forced the patio doors",
      "Dark rear gardens and six-foot fences — a foot chase over ground nobody has seen",
      "A vehicle waiting on the road with its engine running and a driver in it",
    ],
    firstDueStationId: "MP-STK",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling. No previous calls from this address.",
      "Local knowledge file: two rear-entry burglaries in the early hours on Ladythorn Crescent and Rossall Drive in the last six weeks, both through patio doors while the occupiers slept. This fits the pattern.",
      "Caller has asked for a silent approach. No sirens and no blues from the Bramhall Lane South junction; units hold short of the address, out of sight of the front windows.",
      "The way out is the back: over the bottom fence into the Ladythorn Crescent gardens. The second unit goes into the Crescent from its far, south-east end — not the junction beside the house — and covers that road on foot, not the front.",
    ],
  },

  methane: {
    M: "No",
    E: "Ladythorn Road, Bramhall, Stockport, SK7 2ES — detached house on the north-east side, a few doors south-east of where Ladythorn Crescent leaves the road; Rossall Drive comes in opposite",
    T: "Burglary in progress — occupier upstairs, two offenders on the ground floor, a vehicle waiting on the road",
    H: "Offenders inside and unknown; dark rear gardens and fences; a driver in a running car",
    A: "Silent from the A5102 — no sirens, lights off from the junction, 370 m out. Front held on Ladythorn Road; rear covered on foot from Ladythorn Crescent, entered at its south-east end",
    N: "One — the occupier, uninjured, upstairs behind a locked door. Nobody else in the house",
    emergencyServices:
      "Police only. Two response units for containment and a dog for the track. No ambulance unless something changes",
  },

  pda: [
    {
      id: "police1",
      label: "Police — front containment",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      preferredStationId: "MP-STK",
      notes:
        "First unit. Silent from the A5102 and hold on Ladythorn Road with eyes on the front door and the car. Nobody goes to the door until the rear is covered",
    },
    {
      id: "police2",
      label: "Police — rear containment",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      preferredStationId: "MP-STK",
      notes:
        "Into Ladythorn Crescent from its south-east end — the near junction is in sight of the front windows — then on foot to the back fences. The back is where they will go; with only the front covered the containment is not one",
    },
    {
      id: "dog",
      label: "Dog unit",
      service: "Police",
      requiredApplianceTypes: ["Police_Dog"],
      requiredCapabilities: ["Police_Dog"],
      notes:
        "For the track when they run. Trafford and the Openshaw base both hold one and either is the best part of twenty minutes from Bramhall — ask at the start, not after the fence",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      {
        metric: "Silent approach",
        target: "no sirens or blues from the Bramhall Lane South junction — the caller asked, and the offenders are listening",
      },
      {
        metric: "Containment",
        target: "front AND rear covered before anyone goes to the door — two units, not one",
      },
      {
        metric: "Dog unit",
        target: "requested at the outset, before they run — not after",
      },
      {
        metric: "Occupier",
        target: "kept upstairs behind the locked door and talked out of going down",
      },
    ],
    lesson:
      "A burglary in progress is the one Grade 1 where the noise you make on the way is the thing that decides it. She asked for no sirens and she was right: the moment they hear you coming they are over the back fence and gone, and everything after that is a search. So the approach is silent from the main road, the first unit holds on the front with eyes on the door and the car, and nobody goes to that door until the second unit has the back — a house with one side covered is not contained, it is a house with a police car parked outside it. Ask for the dog before they run, because the track goes cold in minutes and the dog is the best part of twenty away. And keep talking to her. She wants to go down and it is her house, and your job is to make sure she does not, because the only person who can get hurt tonight is the one who meets them on the stairs.",
  },

  // Schematic. Ladythorn Road actually bears about 125 degrees here
  // (north-west to south-east); the scene draws it horizontally with the
  // house on its north-east side, so "up" is north-east and the sector
  // bearings, not the picture, are what is true to the compass. The road
  // behind is the north arm of the Ladythorn Crescent loop, drawn straight;
  // its two junctions with Ladythorn Road are off the picture to the left
  // (60 m) and right (170 m).
  scene: {
    viewBox: { x: -60, y: -78, width: 120, height: 110 },
    compassNorth: "up",
    buildings: [
      {
        shape: { x: -12, y: -14, w: 24, h: 16 },
        kind: "target",
        label: "No. 14 — detached, occupier upstairs front",
      },
      { shape: { x: -50, y: -14, w: 24, h: 16 }, kind: "neighbour", label: "Neighbour (north-west)" },
      { shape: { x: 26, y: -14, w: 24, h: 16 }, kind: "neighbour", label: "Neighbour (south-east)" },
      { shape: { x: -52, y: -68, w: 22, h: 10 }, kind: "neighbour", label: "Ladythorn Crescent (rear)" },
      { shape: { x: -14, y: -68, w: 24, h: 10 }, kind: "neighbour", label: "Ladythorn Crescent (rear)" },
      { shape: { x: 26, y: -68, w: 22, h: 10 }, kind: "neighbour", label: "Ladythorn Crescent (rear)" },
    ],
    roads: [
      { shape: { x: -60, y: 17, w: 120, h: 3 }, kind: "pavement" },
      { shape: { x: -60, y: 20, w: 120, h: 8 }, kind: "road", label: "Ladythorn Road" },
      { shape: { x: -60, y: 28, w: 120, h: 2 }, kind: "pavement" },
      { shape: { x: -13, y: 2, w: 25, h: 15 }, kind: "garden", label: "Front garden" },
      { shape: { x: -22, y: -14, w: 9, h: 31 }, kind: "driveway", label: "Drive and side gate" },
      { shape: { x: -22, y: -42, w: 46, h: 28 }, kind: "garden", label: "Rear garden" },
      { shape: { x: -60, y: -58, w: 120, h: 16 }, kind: "garden", label: "Ladythorn Crescent back gardens" },
      { shape: { x: -60, y: -70, w: 120, h: 2 }, kind: "pavement" },
      { shape: { x: -60, y: -78, w: 120, h: 8 }, kind: "road", label: "Ladythorn Crescent" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: 32, y: 24 }, kind: "car", label: "Dark Audi — engine running, no lights" },
      { pos: { x: -44, y: 18 }, kind: "lamppost" },
      { pos: { x: 44, y: 18 }, kind: "lamppost" },
      { pos: { x: 14, y: -36 }, kind: "tree" },
      { pos: { x: -16, y: -30 }, kind: "tree" },
      { pos: { x: -40, y: -50 }, kind: "tree" },
      { pos: { x: -56, y: 31 }, kind: "other", label: "NW — Ladythorn Crescent leaves the road 60 m; Bramhall Lane South (A5102) 370 m" },
      { pos: { x: 56, y: 31 }, kind: "other", label: "SE — Ladythorn Crescent rejoins, 170 m: rear unit's way in" },
    ],
    hazards: [
      {
        id: "offenders",
        pos: { x: 0, y: -11 },
        kind: "structural",
        label: "Two offenders on the ground floor — torchlight through the back room and hall",
        knownFromPri: true,
      },
      {
        id: "occupier",
        pos: { x: -4, y: -2 },
        kind: "structural",
        label: "Occupier upstairs, front bedroom, door locked — wants to come down",
        knownFromPri: true,
      },
      {
        id: "back-fence",
        pos: { x: 0, y: -43 },
        kind: "structural",
        label: "Bottom fence — the line out over the Crescent gardens, unlit",
        knownFromPri: true,
      },
      {
        id: "vehicle",
        pos: { x: 32, y: 22 },
        kind: "structural",
        label: "Vehicle waiting across the road with a driver in it",
        knownFromPri: true,
      },
      {
        id: "patio",
        pos: { x: 2, y: -15 },
        kind: "structural",
        label: "Patio doors — point of entry, forced at the lock",
        discoverAfterMinOnScene: 2,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Front — Ladythorn Road", face: "front", bearingDeg: 225 },
      { id: 2, label: "Sector 2 · South-east — to the far Crescent junction", face: "right", bearingDeg: 135 },
      { id: 3, label: "Sector 3 · Rear — gardens and Ladythorn Crescent", face: "rear", bearingDeg: 45 },
      { id: 4, label: "Sector 4 · North-west — to the A5102", face: "left", bearingDeg: 315 },
    ],
    variants: [
      {
        id: "gone-early",
        label: "Tonight they were over the back fence and the car gone inside two minutes — a search from the start",
        probability: 0.3,
      },
      {
        id: "lone",
        label: "Tonight it was one man on foot, no car — he heard her on the phone and walked out of the front",
        probability: 0.2,
        hazards: {
          remove: ["offenders", "vehicle"],
          add: [
            {
              id: "offender-lone",
              pos: { x: 0, y: -11 },
              kind: "structural",
              label: "One offender on the ground floor — on foot, no vehicle; came in through the unlocked patio door",
              knownFromPri: true,
            },
          ],
        },
      },
      {
        id: "tried-door",
        label: "Tonight one of them came up the stairs and tried the bedroom door before they ran",
        probability: 0.15,
      },
    ],
  },

  // The occupier, whispering from the front bedroom. She hangs up when
  // the first unit lands, so everything here happens before anyone is
  // there — which is the point.
  informantScript: [
    {
      id: "whisper-first",
      atSec: 4,
      text: "I'm upstairs. There's somebody in my house. I can see torchlight going across the hall under the bedroom door — I'm whispering because they're right underneath me. Please don't send them with sirens. If they hear sirens they'll know I've rung you.",
      tone: "critical",
    },
    {
      id: "two-of-them",
      atSec: 35,
      text: "There's two of them. I can hear them talking, low. They've gone through to the back room — that's where the patio doors are, I think that's how they've got in. My husband's away. It's just me.",
      tone: "urgent",
    },
    {
      // Certain, because the plate is the one thing the desk can act on
      // from here: it is on record and it comes back interesting.
      id: "car-waiting",
      atSec: 70,
      excludesVariantIds: ["lone"],
      text: "There's a car across the road with its engine running and no lights on. A dark one, an Audi I think, and there's somebody sat in the driver's seat. I can read the plate from here — MK68 XWP.",
      tone: "urgent",
    },
    {
      // Lone run: what she can hear is one set of feet, and no car.
      id: "lone-one",
      atSec: 70,
      requiresVariantIds: ["lone"],
      text: "I've been listening. It's one. One set of footsteps, one voice — he's talking low, on a phone I think. And there's no car out there, I've looked — the road's empty. He's on his own.",
      tone: "urgent",
    },
    {
      // Seven nights in ten she wants to go down. The follow-on is the
      // operator having talked her out of it; there is no beat where she
      // goes, because that is not a thing the desk lets happen.
      id: "wants-down",
      atSec: 105,
      probability: 0.7,
      text: "I want to go down there. I've got a hockey stick behind the door. It's my house, I'm not sitting up here while they go through it —",
      tone: "urgent",
    },
    {
      id: "stays-put",
      atSec: 140,
      requiresFiredIds: ["wants-down"],
      text: "All right. All right. I've locked the bedroom door like you said and I'm sat on the floor by the wardrobe, away from it. I'm not going down. But please hurry.",
      tone: "info",
    },
    // --- gone-early: done and gone before the first car is off the A5102.
    {
      id: "early-leave",
      atSec: 110,
      requiresVariantIds: ["gone-early"],
      suppressesIds: ["still-inside", "back-leave"],
      text: "The patio door — that's the patio door going. They're out. I'm at the back window — two of them over the bottom fence, quick, one's got a bag, into the Crescent gardens. They've gone. They've just gone.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "early-car-off",
      atSec: 130,
      requiresVariantIds: ["gone-early"],
      text: "And the car's gone. It pulled off with no lights, down towards the Crescent end where they went over. Dark Audi, MK68 XWP — I'm sure of the plate. There's nobody here now. It's just me and the house.",
      tone: "urgent",
    },
    // --- lone: he hears her, stops, and walks out of the front. ----------
    {
      id: "lone-heard",
      atSec: 170,
      requiresVariantIds: ["lone"],
      text: "He's stopped. It's gone quiet — he's stopped moving. I think he's heard me. I think he knows somebody's up here. I'm not saying anything else —",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "lone-front",
      atSec: 205,
      requiresVariantIds: ["lone"],
      suppressesIds: ["still-inside", "back-leave"],
      text: "The front door. He's gone out the front — I'm at the window — one man, walking fast, not running, up towards the main road. Dark jacket with the hood up, a rucksack. On foot. There's no car, he's just walking.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    // --- tried-door: one of them comes up. ------------------------------
    {
      id: "landing",
      atSec: 190,
      requiresVariantIds: ["tried-door"],
      text: "Somebody's on the stairs. On the landing — right outside. I can see the torch under the door. The handle — he's just tried the handle. I'm holding it. I'm not making a sound.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "door-run",
      atSec: 215,
      requiresVariantIds: ["tried-door"],
      suppressesIds: ["still-inside", "back-leave"],
      text: "He's gone back down. He said something to the other one and they've — that's the patio door. They've run. Out the back, over the fence, both of them. Oh God. Oh God, I thought he was coming through.",
      tone: "critical",
    },
    {
      id: "door-car-off",
      atSec: 235,
      requiresVariantIds: ["tried-door"],
      text: "The car's pulled off. Down the road, no lights, towards the Crescent end. They've all gone. I'm still holding this door handle and I can't let go of it.",
      tone: "urgent",
    },
    // --- The base roll. Most nights they are gone before anyone arrives. -
    {
      id: "back-leave",
      atSec: 230,
      probability: 0.6,
      excludesVariantIds: ["gone-early", "lone", "tried-door"],
      suppressesIds: ["still-inside"],
      text: "That's the patio door. They've gone out the back — I'm at the back window now, there's two of them going over the fence at the bottom of the garden, towards the Crescent. One of them's got a bag.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "car-off",
      atSec: 255,
      requiresFiredIds: ["back-leave"],
      text: "The car's just pulled off. No lights on. It's gone down the road towards the Crescent end, the same way they went. Dark Audi, I'm sure of that now.",
      tone: "urgent",
    },
    // --- The other four nights: still in when the first unit lands. ----
    {
      // No probability, deliberately. back-leave has taken its 60%; this
      // is the rest and it has to be certain, or some nights she never
      // says either and the question of where they are is left open.
      id: "still-inside",
      atSec: 260,
      excludesVariantIds: ["gone-early", "lone", "tried-door"],
      text: "They're still in. The torch is in the front room now, right below me. I can hear drawers going. There's still nobody out there, is there — I can't see anybody on the road.",
      tone: "urgent",
    },
    {
      // Only on a slow night, and only if they are still in the house.
      // GMP's own average for a Grade 1 is under eight minutes; at nine
      // with nobody there, they have finished downstairs.
      id: "on-stairs",
      atSec: 330,
      delayThresholdSec: 540,
      requiresFiredIds: ["still-inside"],
      text: "They're on the stairs. I can hear them on the stairs. I've got my back against the door — where are they, where ARE they?",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  callGrade: {
    scale: "police_thrive",
    grade: 1,
    standardMinutes: 15,
    basis:
      "Burglary in progress with the occupier in the house and offenders on the premises — a crime in progress with an immediate threat to a person, which GMP grades Grade 1 Immediate. The 15-minute figure is GMP's own published Grade 1 attendance target: Chief Constable's Regulation 28 response to HM Senior Coroner Manchester West, 26 Aug 2025 ('Immediate or grade 1 incidents - within 15 minutes'), and the GMCA GMP Performance Briefing, Jan 2026 (average 7m52s, 95% within 15 minutes in 2025). GMP publishes one force-wide figure; there is no separate rural target.",
  },

  // The call as Judith has it: on her mobile on the floor of the front
  // bedroom, back to the locked door, whispering, with two men going
  // through the rooms underneath her. She rang Michael first and got his
  // voicemail. The one thing she asks for is quiet.
  call: {
    caller: {
      name: "Judith Hargreaves",
      phone: "07700 900418",
      relation: "The occupier — alone in the house, husband away overnight",
      where: "The front bedroom at 14 Ladythorn Road, on the floor with her back to the locked door, whispering",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "Fourteen Ladythorn Road, Bramhall — Stockport. I'm whispering, I have to whisper. There's someone in my house. They're downstairs, right underneath me, I can see a torch going along the hall under the door. I'm in the bedroom with the door locked, on my own. Please — no sirens. Please don't send them with sirens.",
    openingByVariant: {
      lone: "Fourteen Ladythorn Road, Bramhall — Stockport. I'm whispering, I have to whisper. There's someone in my house. Downstairs, right underneath me — I can see a torch going along the hall under the door. One person, I think. I'm in the bedroom with the door locked, on my own. Please — no sirens.",
    },
    deflection: "I can't — I can't talk any louder, they're right under me — just send somebody. Quietly.",
    reassurance: {
      text: "Judith, listen to me. Officers are coming, and they are coming quietly. Stay where you are, stay behind that door, and keep your voice low. I'm not going anywhere.",
      reply: "All right. All right. I'm here. I'm keeping still.",
    },
    answers: {
      p_happening: {
        text: "There are people in my house — downstairs. I was in bed. I heard a crack, like wood going, and then moving about. I can see a torch going across the hall from under the bedroom door. They're going through the rooms. I'm upstairs on my own with the door locked and I'm whispering because they're right underneath me.",
        tone: "critical",
        followUps: [
          {
            id: "p_happening_torch",
            text: "Where is the torch now — which room are they in?",
            answer: {
              text: "It went along the hall and into the back — the back room, where the patio doors are. Now it's — I think the kitchen. They're not rushing. They're taking their time, that's what frightens me.",
              tone: "urgent",
            },
          },
        ],
      },
      p_ongoing: {
        text: "Yes. They're in the house now. A drawer's just gone — I can hear them. They're still down there.",
        byVariant: {
          lone: "Yes. He's in the house now. A drawer's just gone — I can hear him. He's still down there.",
        },
        tone: "critical",
      },
      p_weapons: {
        text: "I haven't seen them. I've seen a torch under a door, that's all. I don't know what they've got — they got in somehow, they've forced something. I'm not opening this door to find out.",
        byVariant: {
          lone: "I haven't seen him. I've seen a torch under a door, that's all. I don't know what he's got. I didn't hear anything break — I think the patio door was on the latch. Michael's always on at me about it.",
        },
        tone: "urgent",
        followUps: [
          {
            id: "p_weapons_sound",
            text: "Did you hear anything that sounded like a tool — a bar, glass breaking?",
            answer: {
              text: "One crack, when they came in — like a door being forced, wood going. No glass. Nothing since. They're quiet. They're good at it, that's the thing. This isn't their first.",
              byVariant: {
                lone: "No. Nothing. No crack, no glass. I woke up because the boards went in the hall, not because of a noise at the door. I think he just walked in.",
              },
            },
          },
        ],
      },
      p_injured: {
        text: "No. No, I'm all right. They don't know I'm here — I don't think they know I'm here. I'm all right as long as they stay downstairs.",
        tone: "urgent",
      },
      p_who: {
        text: "Two of them, I think. I can hear two voices — men, low, I can't make out what they're saying. I've not seen them. Two.",
        byVariant: {
          lone: "One, I think. One set of footsteps — and one voice, low, like he's on a phone. A man. I've not seen him. I think it's just one.",
        },
      },
      p_description: {
        text: "I can't. I haven't seen them — only the torch. Men, from the voices. Two. That's all I can tell you, and I'm not opening the door to look.",
        byVariant: {
          lone: "I can't. I haven't seen him — only the torch. A man, from the voice. One. That's all I can tell you, and I'm not opening the door to look.",
        },
      },
      p_direction: {
        text: "They've not gone anywhere — they're still down there. I've not heard a door go, they've not gone out. I haven't looked out the front, I daren't move about, the boards creak in this room.",
        followUps: [
          {
            id: "p_direction_window",
            text: "Can you get to the window without making a noise, and tell me what is on the road?",
            answer: {
              text: "Hold on. Right — I'm at the window. There's a car across the road with no lights on — I can hear its engine, it's running. There's somebody sat in it. A dark one. I'll try and get the number.",
              byVariant: {
                lone: "Hold on. Right — I'm at the window. There's nothing. No car, nobody on the road — just the street lamps. If he came in a car he's not left it out the front.",
              },
              tone: "urgent",
            },
          },
        ],
      },
      p_drink: {
        text: "I've no idea. I shouldn't think so — they're not falling about, they're quiet. They know what they're doing.",
      },
      p_known: {
        text: "No. God, no. I don't know anybody who'd — no. We've been here twenty-two years and never had so much as the shed broken into.",
      },
      p_vulnerable: {
        text: "Me. I'm on my own in the house — my husband's away with work, I rang him before I rang you and got his voicemail. I'm fifty-eight and there are two men downstairs who don't know I'm here. Nobody else — no children, nobody. Just me.",
        tone: "urgent",
        followUps: [
          {
            id: "p_vulnerable_door",
            text: "Is the bedroom door locked, and would it hold?",
            answer: {
              text: "It's locked — it's an old key, it's in the lock and I've turned it. It's a wooden door. It'd not stop anybody who wanted to come through it. I've got my back against it.",
              tone: "urgent",
            },
          },
        ],
      },
      p_where: {
        text: "Fourteen Ladythorn Road, Bramhall — SK7 2ES. You come in off Bramhall Lane South, the main road. We're on the left, a few doors past where the Crescent goes off — detached, with the drive down the side. And please — from the main road, no lights, no sirens. The car will hear them before you're anywhere near.",
      },
      p_safe: {
        text: "For now. As long as they stay downstairs. I'm behind a locked door in the front bedroom, on the floor. If they come up the stairs I'm not safe at all.",
        byVariant: {
          lone: "For now. As long as he stays downstairs. I'm behind a locked door in the front bedroom, on the floor. If he comes up the stairs I'm not safe at all.",
        },
        tone: "urgent",
      },
      p_seen: {
        text: "I'm in it. I'm in the house with them. I heard them come in and I can see the torch. Nobody's told me anything — I'm the one it's happening to.",
      },
      p_details: {
        text: "Judith Hargreaves. It's my mobile — 07700 900418. If the line goes, don't ring me back — the phone will make a noise. Please don't ring me back.",
      },
    },
    interjections: [
      {
        atSec: 50,
        excludesVariantIds: ["lone"],
        text: "They're in the back room. The sideboard — I can hear the drawers, the cutlery. That's Michael's mother's silver. They're not rushing. They think nobody's in.",
        tone: "urgent",
      },
      {
        atSec: 50,
        requiresVariantIds: ["lone"],
        text: "He's in the back room. The sideboard — I can hear the drawers, the cutlery. That's Michael's mother's silver. He's not rushing. He thinks nobody's in.",
        tone: "urgent",
      },
      {
        atSec: 90,
        excludesVariantIds: ["lone"],
        text: "One of them's just laughed. Quiet — they're laughing, in my house. I'm sorry. I'm all right. I'm all right.",
        tone: "urgent",
      },
      {
        atSec: 90,
        requiresVariantIds: ["lone"],
        text: "He's talking again — to somebody on a phone, it must be. Low. Telling them what's here, I expect. In my house. I'm sorry. I'm all right. I'm all right.",
        tone: "urgent",
      },
      {
        atSec: 150,
        text: "Is anybody coming? You've not told me anybody's coming. They're still down there and I'm still up here and I don't — how long? How long will they be?",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 200,
        text: "I can't hear anything outside. No sirens. Good — that's good, that's what I asked for. Are they close? Tell them I'm upstairs at the front, in case they think I'm one of them.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Thank you. No sirens — you've told them? Tell them I'm upstairs at the front, and I'm not coming down until they say my name.",

    // Read after Send, while the units are silent from the A5102. The
    // two that matter are the two that keep her out of the stairwell:
    // stay put, and stay quiet. The window is useful; the name at the
    // door is what stops her opening it to the wrong person.
    preArrival: [
      {
        id: "stay",
        text: "Judith, stay exactly where you are — upstairs, behind that locked door, on the floor away from it. Do not go down, whatever you hear. Nothing down there is worth meeting them on the stairs for.",
        key: true,
        reply: "I'm not moving. I've got my back to the wardrobe. I'm not going down. I promise you I'm not going down.",
        replyByVariant: {
          "tried-door": "I'm not moving. I've got my back to the wardrobe. If they come up — I'm not moving.",
        },
        effect: { state: "calm" },
      },
      {
        id: "quiet",
        text: "Put your phone on silent now and turn the screen right down. Keep whispering. If you have to stop talking, don't hang up — just put the phone down beside you and I'll stay on.",
        key: true,
        reply: "It's on silent. Screen's down. I'll put it on the floor if I have to — I won't hang up.",
      },
      {
        id: "no-answer",
        text: "If anyone comes up the stairs, don't open the door and don't answer them. Stay still and let them think the room is empty. If they come through it, get to the window and shout — then they'll go.",
        key: true,
        reply: "Let them think it's empty. All right. And the window if — all right. I've heard you.",
        replyByVariant: {
          lone: "Let him think it's empty. All right. And the window if — all right. I've heard you.",
        },
      },
      {
        id: "window",
        text: "If you can get to the front window without a sound, keep an eye on the road. Tell me the second the car moves, or if anyone comes out of the house.",
        reply: "I can see the road from the bed if I kneel up. The car's still there. I'll tell you the second it goes.",
        replyByVariant: {
          lone: "I can see the road from the bed if I kneel up. There's still nobody out there. I'll tell you the second anything moves.",
          "gone-early": "I'm at the window. There's nothing now — car's gone, they've gone. I'll tell you if anybody comes back.",
        },
      },
      {
        id: "name",
        text: "The officers will say your name at the bedroom door when they get to you — 'Judith, it's the police'. Don't open it to anyone who doesn't.",
        reply: "My name. Not till they say my name. I won't open it before that.",
      },
    ],
  },
};
