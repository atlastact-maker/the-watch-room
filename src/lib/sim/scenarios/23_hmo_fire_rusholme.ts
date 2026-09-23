import type { Scenario } from "../incident_types";

// Scenario 23 — HMO fire, persons reported, Rusholme.
//
// A house fire where nobody can tell you how many people are inside. That
// is the whole difference between this and scenario 02: a family home has
// a known number of occupants and somebody who can account for them. A
// house in multiple occupation has a landlord who does not live there,
// tenants who do not know each other, and a number that changes.
//
// So the operator never gets a clean "persons accounted for". They get
// "there's normally about eight of us but I don't know who's in", and
// they have to resource the uncertainty rather than the count. That means
// a bigger attendance than the visible fire justifies, and it means
// keeping it there until somebody has been through every room.
//
// FICTIONAL: the house, the landlord and every tenant. Dickenson Road is
// a real Rusholme street; the property is not.

export const scenario23: Scenario = {
  id: "23",
  slug: "23_hmo_fire_rusholme",
  title: "House Fire, Persons Reported — HMO, Rusholme",
  type: "hmo_fire",
  patch: "Southern",
  severity: "high",
  trigger:
    "Fire in a shared house. Tenants out on the street but nobody can say how many were in. Smoke showing",

  location: {
    address: "212 Dickenson Road, Rusholme, Manchester",
    postcode: "M14 5HQ",
    coords: { lat: 53.4516, lng: -2.2146 },
  },

  property: {
    class:
      "Large Victorian terrace converted to a house in multiple occupation — eight letting rooms over three floors",
    size: "Three storeys plus a converted cellar room",
    occupants:
      "Unknown. Normally around eight tenants; four are on the street and none can account for the rest",
    vulnerabilities: [
      "Occupancy is unknown and unknowable from outside — nobody here holds a list",
      "Bedroom locks on every door; tenants do not know each other's movements",
      "Converted cellar room with one way out",
    ],
    access:
      "Front door onto Dickenson Road, terraced both sides. Rear yard via a shared entry. Parking heavy on both sides of the road",
    knownHazards: [
      "Room-by-room locks slow any search",
      "Cellar conversion with a single escape route",
      "Compartmentation likely poor — the conversion is old and the last inspection is not on file",
    ],
    firstDueStationId: "G13",
    // A big Victorian timber front door on a rim lock — what the caller
    // describes, and what the Halligan is for.
    doorType: "timber",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "Licensed HMO per the local authority register — no fire service PRI on file; what follows is the licence conditions.",
      "Licence conditions on file: a lock on every letting-room door, and a converted cellar room with a single stair.",
      "Landlord contact held; landlord does not live at the property.",
      "No occupancy list is held by anybody who is on scene.",
    ],
  },

  methane: {
    M: "No",
    E: "212 Dickenson Road, Rusholme, M14 5HQ",
    T: "House fire in a shared house, persons reported, occupancy unknown",
    H: "Room locks; cellar conversion with one way out; unknown compartmentation",
    A: "Front door on Dickenson Road; rear yard via the shared entry. Heavy on-street parking",
    N: "Unknown — four out, normally around eight in the house",
    emergencyServices: "Fire and ambulance required",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G13",
      notes: "First pump — BA and a search",
    },
    {
      id: "pump2",
      label: "Pump 2",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      notes: "Second BA team. Eight locked rooms take more than one crew to clear",
    },
    {
      id: "pump3",
      label: "Pump 3",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      notes:
        "Resource the uncertainty, not the visible fire. Nobody on that street can tell you the house is empty",
    },
    {
      id: "officer",
      label: "Station Manager",
      service: "Fire",
      requiredApplianceTypes: ["FIRE_SM"],
      requiredCapabilities: ["Command"],
      notes: "Persons reported with an unknown count",
    },
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      notes: "Four out already and an unknown number still inside",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "First attendance", target: "< 10 minutes" },
      {
        metric: "Resourcing the unknown",
        target: "three pumps on the initial attendance — the count is not knowable from outside",
      },
      {
        metric: "Search",
        target: "nobody left undiscovered at the stop — the attendance is held for the search, not the fire",
      },
    ],
    lesson:
      "In a family home somebody can tell you who is still inside. In an HMO nobody can, and that changes what you send. You are resourcing the uncertainty rather than the fire, and you keep the attendance there until every locked door has been opened — the fire being out is not the same as the house being clear.",
  },

  scene: {
    viewBox: { x: -32, y: -30, width: 64, height: 56 },
    compassNorth: "up",
    // Three storeys of Victorian terrace with a half-landing.
    egressExtraSeconds: 180,
    // What this building will not take. Prose above; a locked option
    // with its reason on it here.
    egressBlocked: [
      { action: "trolley", reason: "Victorian terrace stair with a half-landing turn, and a cellar room under it — the trolley stays on Dickenson Road" },
    ],
    // A Victorian terrace: seven-metre frontages on shared party walls,
    // fourteen metres deep, a yard behind each, and the shared entry to
    // the yards two doors down as the caller has it.
    buildings: [
      { shape: { x: -17.5, y: -12, w: 7, h: 14 }, kind: "neighbour", label: "208" },
      { shape: { x: -10.5, y: -12, w: 7, h: 14 }, kind: "neighbour", label: "210" },
      { shape: { x: -3.5, y: -12, w: 7, h: 14 }, kind: "target", label: "212 — HMO" },
      { shape: { x: 3.5, y: -12, w: 7, h: 14 }, kind: "neighbour", label: "214" },
      { shape: { x: 10.5, y: -12, w: 7, h: 14 }, kind: "neighbour", label: "216" },
      { shape: { x: 20, y: -12, w: 7, h: 14 }, kind: "neighbour", label: "218" },
    ],
    roads: [
      { shape: { x: -17.5, y: -19, w: 44.5, h: 7 }, kind: "garden", label: "Rear yards" },
      { shape: { x: -32, y: 6, w: 64, h: 2 }, kind: "pavement" },
      { shape: { x: -32, y: 8, w: 64, h: 11 }, kind: "road", label: "Dickenson Road" },
      { shape: { x: 17.5, y: -19, w: 2.5, h: 25 }, kind: "driveway", label: "Shared entry" },
    ],
    hydrants: [
      { label: "H1", coords: { lat: 53.4515, lng: -2.2154 }, street: "Dickenson Road" },
      { label: "H2", coords: { lat: 53.4514, lng: -2.2136 }, street: "Dickenson Road" },
    ],
    landmarks: [
      { pos: { x: -14, y: 13 }, kind: "car" },
      { pos: { x: -2, y: 13 }, kind: "car" },
      { pos: { x: 10, y: 13 }, kind: "car" },
      { pos: { x: 8, y: 7 }, kind: "lamppost" },
    ],
    fireSeat: {
      // First-floor front room, above the caller's — the window the
      // smoke is coming out of faces the road.
      pos: { x: 0, y: -3 },
      radiusM: 2.5,
      // Two jets to turn it; one jet and a BA team only hold it.
      growthRateMpm: 0.4,
      suppressionPerBaMpm: 0.8,
      maxRadiusM: 12,
      material: "structural",
    },
    // The locks and the cellar room are carried in the PRI items and the
    // caller's own words: as hazards they would be offered USAR shoring.
    hazards: [
      {
        // The stair and landings — where an old conversion's
        // compartmentation fails first.
        id: "compartmentation",
        pos: { x: 0, y: -7 },
        kind: "structural",
        label: "Conversion compartmentation unverified — fire spread between rooms",
        discoverAfterMinOnScene: 3,
      },
      {
        // The caller says where the meters are; the crews see the
        // cupboard as they go through the front door.
        id: "meters",
        pos: { x: -2.5, y: 0.5 },
        kind: "gas",
        label: "Gas and electric meters — hall cupboard by the front door",
        discoverAfterMinOnScene: 0,
      },
    ],
    casualties: [
      {
        id: "cas-23-top-floor",
        label: "Occupant — top floor rear room",
        pos: { x: 1.5, y: -10 },
        severity: "serious",
        discoverAfterMinBa: 4,
        presentProbability: 0.55,
        clinical: {
          vitals: { rr: 26, spo2: 91, hr: 118, bpSys: 118, bpDia: 72, gcs: 13, temp: 36.9, bm: 5.7 },
          ageYears: 22,
          presumedCondition: "Smoke inhalation — soot around the mouth, hoarse voice, coughing",
          redFlags: ["airway_compromise"],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen", "iv_access"],
        },
      },
      {
        id: "cas-23-cellar",
        label: "Occupant — cellar room",
        // The cellar room is under the front room, with its one stair
        // coming up into the hall.
        pos: { x: -1.5, y: -1.5 },
        // Serious, not critical: critical is expectant at ten minutes from
        // the send, before a BA team could reach a cellar.
        severity: "serious",
        discoverAfterMinBa: 5,
        presentProbability: 0.3,
        clinical: {
          // Found last, in the cellar room with one way out. Longest
          // exposure of anyone in the house.
          vitals: { rr: 10, spo2: 82, hr: 132, bpSys: 96, bpDia: 58, gcs: 8, temp: 36.4, bm: 5.2 },
          ageYears: 30,
          presumedCondition: "Severe smoke inhalation, unresponsive — prolonged exposure in the cellar room",
          redFlags: ["airway_compromise", "head_injury_severe"],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen", "rsi", "iv_access", "fluids"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Dickenson Road frontage", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · 214 side / entry", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear yard", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · 210 side", face: "left", bearingDeg: 270 },
    ],
    // Tonight's run. The base is the first-floor front room with the
    // persons roll as authored. The others move the seat, and with it
    // where the search starts — or take the people out of the house and
    // leave the search to prove it.
    variants: [
      {
        id: "kitchen",
        label: "The fire started in the ground-floor kitchen at the back — the stair is between the crews and every bedroom",
        probability: 0.25,
        fireSeat: { pos: { x: 0, y: -10 } },
      },
      {
        id: "cellar-fire",
        label: "The seat is the cellar room itself, and the tenant is in it — the crews go straight down",
        probability: 0.15,
        present: ["cas-23-cellar"],
        fireSeat: { pos: { x: -1, y: -1 } },
        casualty: {
          "cas-23-cellar": {
            label: "Occupant — cellar room, the room of origin",
            severity: "serious",
            discoverAfterMinBa: 2,
          },
        },
        clinical: {
          "cas-23-cellar": {
            presumedCondition: "Smoke inhalation and burns to the hands and forearms — was in the room the fire started in, one stair out",
          },
        },
      },
      {
        id: "everyone-out",
        label: "Everyone was out — the landlord's list proved it, but only after every door had been opened",
        probability: 0.2,
        absent: ["cas-23-top-floor", "cas-23-cellar"],
      },
    ],
  },

  informantScript: [
    {
      id: "tenant-first",
      atSec: 20,
      text: "Sam's counting the bikes and the cars out front — he reckons two more are in, at least. The smoke's blacker than it was.",
      tone: "critical",
    },
    {
      id: "how-many",
      atSec: 60,
      text: "Nobody's answering their phones. Chloe's tried the girl on the top floor twice and it's ringing out. Nobody's seen her come down.",
      tone: "urgent",
    },
    {
      id: "cellar-lad",
      atSec: 140,
      probability: 0.5,
      // When the cellar is the fire, the caller already knows about him.
      excludesVariantIds: ["cellar-fire"],
      text: "Somebody's just said there's a lad in the cellar room. I've never met him. I don't know if he's in or not — his light was on earlier.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "cellar-fire-lad",
      atSec: 140,
      requiresVariantIds: ["cellar-fire"],
      text: "Sam's been on his knees at the cellar grate shouting down it — nothing. That lad's not come out, and the door at the bottom of the cellar stairs is shut.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "landlord",
      atSec: 260,
      probability: 0.7,
      excludesVariantIds: ["everyone-out"],
      text: "I've rung the landlord. He says he'll come down but he's in Chester. He reckons there's nine rooms let, not eight.",
      tone: "urgent",
    },
    {
      id: "landlord-count",
      atSec: 260,
      requiresVariantIds: ["everyone-out"],
      text: "I've got the landlord on the other phone. He's gone through his list with me — eight rooms let, and the two I don't know are both away, he's spoken to them. He reckons the house is empty. He reckons.",
      tone: "urgent",
    },
    {
      id: "top-floor-rang-back",
      atSec: 320,
      requiresVariantIds: ["everyone-out"],
      text: "The girl off the top floor's just rung Chloe back — she's at her mum's in Bury. She's fine. That's one.",
      tone: "info",
    },
  ],
  // The call as Tomasz has it: on his mobile on the pavement opposite, in
  // a T-shirt and socks, with three housemates he half knows and the
  // alarm still going through the open door. He can tell the operator how
  // many rooms there are. He cannot tell them who is in them.
  call: {
    caller: {
      name: "Tomasz Nowak",
      phone: "07700 900823",
      relation: "Tenant — ground-floor front room at 212",
      where: "Pavement opposite 212 Dickenson Road, with three other tenants",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "Fire brigade — our house is on fire. 212 Dickenson Road, Rusholme, it's a shared house. There's smoke coming out of the window on the first floor. There's four of us out on the street, but there's more people live here and I don't know who's in. I don't know who's in.",
    openingByVariant: {
      kitchen:
        "Fire brigade — our house is on fire. 212 Dickenson Road, Rusholme, it's a shared house. It's the kitchen, the back downstairs — the smoke's coming through the whole house. There's four of us out on the street, but there's more people live here and I don't know who's in. I don't know who's in.",
      "cellar-fire":
        "Fire brigade — our house is on fire. 212 Dickenson Road, Rusholme, it's a shared house. It's coming up from the cellar — there's smoke out the grate at the front and up through the hall. There's a lad lives down there and he's not come out. There's four of us out, I don't know who else is in.",
    },
    deflection: "I don't know — I don't know who's in, that's what I'm telling you. Just come.",
    reassurance: {
      text: "Tomasz, help is coming. You don't have to know everything — just tell me what you can see and who you've got with you.",
      reply: "Okay. Okay. Sorry. Four of us. Okay.",
    },
    answers: {
      f_seen: {
        text: "Smoke — loads of it, coming out of the first-floor window at the front, the middle one. Grey, going black. I couldn't see flames a minute ago, just smoke, but the room's gone dark behind the glass and the alarm's going off inside, you can hear it from here.",
        byVariant: {
          kitchen:
            "Smoke — it's coming out the front door and the fanlight over it, grey, going black. Sam went round the entry and it's pouring out the kitchen window into the yard. The alarm's going off inside, you can hear it from here.",
          "cellar-fire":
            "Smoke — it's coming out the cellar grate at the front, under my window, and out the front door. Thick, brown, it's rolling along the pavement. I can't see flames. The alarm's going off inside, you can hear it from here.",
        },
        tone: "urgent",
      },
      f_where: {
        text: "First floor, the front. That's the room above mine. I don't know whose it is — somebody new moved in there a month back, I've seen him twice.",
        byVariant: {
          kitchen:
            "Downstairs, the back — the kitchen. Sam saw it when the alarm went, the hob was going, somebody's left a pan. He couldn't get near it.",
          "cellar-fire":
            "The cellar. It's under my room — my floor was warm, I thought it was the heating. The door down to it's in the hall, by the meters.",
        },
        followUps: [
          {
            id: "f_where_stairs",
            text: "Is the smoke on the stairs?",
            answer: {
              text: "Yes — Sam went up when the alarm went and it was all along the first-floor landing, coming under that door and down the stairs at him. He couldn't see up to the top. He came straight back down.",
              byVariant: {
                kitchen:
                  "Yes — it's coming up the hall from the kitchen and straight up the stairs, the stairs are at the back. Sam went up two steps and came back down. He couldn't see the first-floor landing.",
                "cellar-fire":
                  "It's in the hall. It's coming up through the floorboards and round the cellar door, and the hall's where the stairs are. You can't see the bottom of the stairs from the front door.",
              },
              tone: "urgent",
            },
          },
        ],
      },
      f_spread: {
        text: "It's coming out faster than it was. I can see it in the landing window now, the little one on the stairs between the floors. It's not out the top windows yet.",
        byVariant: {
          kitchen:
            "It's coming out faster than it was. It's in the landing window now, the little one on the stairs between the floors — it's gone up the stairs. It's not out the front windows yet.",
          "cellar-fire":
            "It's coming out faster than it was. It's in my room now — the ground-floor front, I can see it behind my curtains. Not upstairs yet, not that I can see.",
        },
        tone: "urgent",
      },
      f_started: {
        text: "Ten minutes? The alarm went off and we thought it was somebody's cooking again, it does that. Then Sam went up to look and smelt it on the landing, and he started banging on doors. We came straight out.",
        byVariant: {
          kitchen:
            "Ten minutes? The alarm went off and we thought it was somebody's cooking again, it does that. It was. Sam went through to the kitchen and it was the hob, the wall behind it was going, and he started banging on doors. We came straight out.",
          "cellar-fire":
            "Ten minutes? The alarm went off and we thought it was somebody's cooking again, it does that. Then I saw the smoke coming round the cellar door in the hall, and Sam started banging on doors. We came straight out.",
        },
      },
      f_building: {
        text: "Big old terrace, three floors, split into rooms — it's an HMO, we all rent a room off the same landlord. Eight rooms, I think, I've never counted. There's a cellar under it and all, I've never been down. Everyone's got their own lock.",
      },
      f_inside: {
        text: "I don't know. That's the thing — I don't know. There's four of us out here. There's about eight rooms and everybody keeps their door shut. I couldn't tell you who's home tonight and who's not.",
        tone: "critical",
        effect: { regrade: "EMERGENCY", basis: "Persons reported — occupancy unknown, nobody on scene can account for the house" },
        followUps: [
          {
            id: "f_inside_who",
            text: "Who is out with you, and which rooms are they from?",
            answer: {
              text: "Me — ground floor front. Sam, he's ground floor back, next to me. A girl off the first floor, Chloe, I think — the back room, she came down through it coughing. And a lad from the top floor, I don't know his name — he was down in the kitchen when it went off. So that's two of us off the ground, one off the first and one off the top. Nobody's out from the room that's burning, and there's more rooms up there than that.",
              tone: "urgent",
            },
          },
          {
            id: "f_inside_knocked",
            text: "Did anyone knock on the other doors on the way out?",
            answer: {
              text: "Sam banged on the first-floor doors when he went up — Chloe came out, nobody else answered. He couldn't get up to the top, the smoke was on the stairs, you couldn't see. I banged on the cellar door from the hall — I don't even know if anyone's living down there at the minute. Nothing.",
              byVariant: {
                "cellar-fire":
                  "Sam banged on the first-floor doors — Chloe came out, nobody else answered, and he couldn't get up to the top. I banged on the cellar door from the hall — it was hot, the door, and the smoke was coming round it. Nothing. I couldn't open it, I'm sorry, I couldn't.",
              },
              tone: "urgent",
            },
          },
        ],
      },
      f_hurt: {
        text: "No — the four of us are alright. Sam and Chloe are coughing a bit, they both got a lungful on the landing, but they're talking, they're alright. Anybody else, I can't tell you.",
      },
      f_vulnerable: {
        text: "Not that I know of. It's all working people and students, nobody old, no kids. But I don't know everybody. I don't know who's in the top rooms.",
        needsCalm: true,
      },
      f_hazards: {
        text: "No gas bottles or anything like that. People cook in their rooms on those little electric hobs, and there's heaters — everybody's got a heater. The meters are in the cupboard in the hall, gas and electric. That's all I know about.",
      },
      f_danger: {
        text: "No. Cars parked both sides, it's rammed, it always is on here. Nobody's kicking off. There's a few people come out from next door to look.",
        needsCalm: true,
      },
      f_access: {
        text: "Front door's on the latch — it'll have swung to behind us, it's a big old timber door, straight off the pavement. Every bedroom's got its own lock though, every door, they'll have to break them. Round the back there's an entry between the houses, two doors down, into the yards. The back door's bolted, always is.",
        tone: "urgent",
      },
      f_safe: {
        text: "I'm across the road on the pavement. We're all over here, well away. I'm in my socks.",
      },
      f_stay: {
        text: "Yeah. Yeah, I'll stay on.",
      },
      f_details: {
        text: "Tomasz Nowak — Tomasz with a z. This is my mobile, 07700 900823.",
      },
    },
    interjections: [
      {
        atSec: 40,
        text: "Sam's just said — he thinks the girl on the top floor's in. Her bike's still chained up out the front and she never goes anywhere without it.",
        tone: "critical",
      },
      {
        atSec: 100,
        excludesVariantIds: ["kitchen", "cellar-fire"],
        text: "There's flames now — the first floor, I can see them, orange in the room. The window's gone — the glass has gone. The smoke's black.",
        tone: "critical",
        effect: { state: "panicking" },
      },
      {
        atSec: 100,
        requiresVariantIds: ["kitchen"],
        text: "Sam's back from the entry — he says the kitchen window's gone and it's flames now, not smoke, the whole back of the house is black. It's going up the stairs.",
        tone: "critical",
        effect: { state: "panicking" },
      },
      {
        atSec: 100,
        requiresVariantIds: ["cellar-fire"],
        text: "There's flames in the grate now — orange, under my window. And the hall's gone, you can't see the stairs from the front door. He's down there. He's under that.",
        tone: "critical",
        effect: { state: "panicking" },
      },
      {
        atSec: 165,
        text: "I can hear sirens — that's them, is it? Coming up from Wilmslow Road?",
        requiresOpened: true,
      },
      {
        atSec: 205,
        text: "Is anyone actually coming? It's been ages. There could be people in there, mate. There could be people in there.",
        tone: "urgent",
        requiresOpened: false,
      },
    ],
    onDispatch: "Okay. Okay. Tell them there might be people in. Tell them we don't know — tell them to go in every room.",
  },
};
