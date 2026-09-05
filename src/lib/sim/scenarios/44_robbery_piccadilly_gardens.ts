import type { Scenario } from "../incident_types";

// Scenario 44 — knife-point robbery, Piccadilly Gardens.
//
// The circulation job. A man has had his phone taken at the point of a
// knife and the offender is on foot somewhere between here and the
// Arndale, and every minute the description sits on the desk waiting to
// be complete is a minute he uses. The caller gives it in pieces, because
// that is how people give descriptions, and the operator's work is to
// pass each piece on as it lands rather than wait for the whole picture.
//
// So the attendance is split, not stacked. One car to the victim — first
// account, the cut on his hand, a statement while it is fresh. Two on the
// line he ran, which is Market Street towards the Arndale and High Street,
// and the CCTV control room told at once because they cover that ground
// faster than any car does. On a fair share of runs a plain-clothes
// officer who happens to be on Market Street stops him before the cars
// get near him; on the rest CCTV loses him at High Street and the search is what
// is left.
//
// There is no ambulance. The injury is a cut across the palm that has all
// but stopped, and the officer's first-aid kit and a walk-in centre are
// the right answer to it. An RRV sent to a dressing in the city centre is
// a resource taken off a chest pain in Ancoats. For the same reason there
// is no authored casualty: the sim scores every casualty on delivery to
// hospital, and this man does not go to hospital.
//
// Grade 1 on THRIVE — a bladed article used, the offender at large in a
// crowded place, and a second victim who may not have come forward yet.
//
// FICTIONAL: everyone in it. Piccadilly Gardens, Market Street, the tram
// stop and the bus stands on Parker Street are real; the people, the
// phone and the second robbery are not.

export const scenario44: Scenario = {
  id: "44",
  slug: "44_robbery_piccadilly_gardens",
  title: "Knife-point robbery — Piccadilly Gardens",
  type: "police_robbery_knife",
  patch: "Southern",
  severity: "high",
  trigger:
    "Male robbed at knife-point in Piccadilly Gardens, mobile phone taken. Offender on foot towards Market Street. Victim calling on a friend's phone, small cut to the hand",

  location: {
    // M1 1RG resolves to the gardens themselves (postcodes.io centroid
    // 53.480457, -2.236304). The coordinates sit on the gardens at the
    // Market Street corner, about seventy-five metres north-west of it (checked
    // against the centroid, not against mapped geometry).
    address: "Piccadilly Gardens, Market Street corner, Manchester",
    postcode: "M1 1RG",
    coords: { lat: 53.481, lng: -2.237 },
  },

  property: {
    class: "City-centre public square — pedestrianised, with the tram stop and the bus stands on its edges",
    occupants:
      "Busy at any hour. Shoppers, people waiting for trams and buses, and a floating population the desk knows well",
    vulnerabilities: [
      "Offender armed with a knife and still in the immediate area on foot",
      "Crowded pedestrian space — a chase through it is a risk to everybody in it",
      "Victim's memory of the description is degrading by the minute; a second victim may not have come forward yet",
    ],
    access:
      "Vehicles to the kerb on Piccadilly or Mosley Street. The gardens and Market Street are pedestrianised — officers go in on foot from there",
    knownHazards: [
      "Bladed article — small knife seen and used",
      "Tram movements on Piccadilly and Mosley Street; buses on Parker Street",
      "Crowd, and phones filming",
    ],
    firstDueStationId: "MP-MCR",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — public open space.",
      "Repeat location for theft from the person and robbery on the local knowledge file. Offenders run west along Market Street or north up Oldham Street; the Arndale gives them a roof to disappear under.",
      "City-centre CCTV control room has cameras on the gardens, the tram stop and Market Street. Give them the description as soon as you have any of it — they cover that ground faster than a car does.",
      "Market Street is pedestrianised, with trams on the Piccadilly end. Cars stop at the kerb on Piccadilly or Mosley Street and the officers walk.",
    ],
  },

  methane: {
    M: "No",
    E: "Piccadilly Gardens, Market Street corner, Manchester, M1 1RG",
    T: "Robbery from the person — knife produced, mobile phone taken. Offender on foot towards Market Street, last seen within the last two minutes",
    H: "Bladed article; offender at large in a crowded pedestrian area; trams and buses on three sides",
    A: "Kerb on Piccadilly or Mosley Street, then on foot. Market Street and the gardens are closed to vehicles",
    N: "One — the victim, a cut across the palm that has all but stopped. Not asking for an ambulance. A second victim from earlier is possible",
    emergencyServices:
      "Police only. No ambulance — the cut is a dressing and a walk-in centre, not a conveyance",
  },

  pda: [
    {
      id: "police1",
      label: "Police — to the victim",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      preferredStationId: "MP-MCR",
      notes:
        "Stays with him. First account, the rest of the description, the cut on his hand, and a statement while it is fresh. Not part of the search",
    },
    {
      id: "police2",
      label: "Police — area search, Market Street",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      notes:
        "The line he ran — Market Street towards the Arndale and High Street. On foot from the Piccadilly kerb; nobody drives down Market Street",
    },
    {
      id: "police3",
      label: "Police — area search, Oldham Street side",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      notes:
        "The other way out — Oldham Street and the Northern Quarter, and the bus stands where the second victim is if there is one. Two on the search and one with the victim is the whole attendance; a fourth car adds nothing he cannot outrun",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 60 seconds" },
      {
        metric: "Circulation",
        target: "description passed to units and CCTV as each piece lands — not held for the full picture",
      },
      {
        metric: "Split attendance",
        target: "one unit with the victim, two on the line he ran; nobody stacked at the gardens",
      },
      {
        metric: "Victim",
        target: "first account and the cut checked at scene; no ambulance sent to a dressing",
      },
      {
        metric: "First unit on scene",
        target: "< 8 minutes — a city-centre Grade 1 against GMP's 15-minute aspiration",
      },
    ],
    lesson:
      "The job is not at Piccadilly Gardens. The job is wherever he is now, and the only thing that finds him is a description that leaves the desk before it is finished. Pass each piece as it comes — the jacket, then the trousers, then the bag — to the cars and to the CCTV room, because a camera on Market Street will have him before a car has parked. Split the attendance: one with the victim for the first account and the cut on his hand, two on the line he ran, and stop there. He does not need an ambulance; he needs a dressing, a statement while he still remembers the face, and the second victim linked to him before she goes home and the pattern goes with her.",
  },

  // Top-down scene — the gardens at the Market Street corner. Piccadilly
  // and the tram stop along the north edge, Market Street leaving the
  // north-west corner, Mosley Street down the west side, Parker Street and
  // the bus stands along the south. Schematic — the real gardens are
  // wedge-shaped and the streets run at angles; this keeps the four ways
  // out where the operator needs them.
  scene: {
    viewBox: { x: -90, y: -60, width: 180, height: 120 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -90, y: -60, w: 40, h: 16 }, kind: "neighbour", label: "Retail — Market Street / Piccadilly corner" },
      { shape: { x: -44, y: -60, w: 90, h: 14 }, kind: "neighbour", label: "Piccadilly frontage — retail" },
      { shape: { x: 64, y: -60, w: 26, h: 16 }, kind: "neighbour", label: "Retail — Oldham Street corner" },
      { shape: { x: -90, y: -16, w: 24, h: 76 }, kind: "neighbour", label: "Mosley Street frontage — offices" },
      { shape: { x: -52, y: 46, w: 92, h: 14 }, kind: "neighbour", label: "Piccadilly Plaza" },
    ],
    roads: [
      // The open ground of the gardens. No building to target — the
      // "target" here is a man who has already left.
      { shape: { x: -50, y: -30, w: 100, h: 60 }, kind: "garden", label: "Piccadilly Gardens" },
      { shape: { x: -90, y: -44, w: 180, h: 12 }, kind: "road", label: "Piccadilly — tram stop, bus lanes" },
      { shape: { x: -90, y: -32, w: 180, h: 2 }, kind: "pavement" },
      { shape: { x: -90, y: -30, w: 40, h: 12 }, kind: "pavement", label: "Market Street — pedestrianised, trams at this end" },
      { shape: { x: 50, y: -60, w: 12, h: 16 }, kind: "road", label: "Oldham Street" },
      { shape: { x: -64, y: -18, w: 12, h: 78 }, kind: "road", label: "Mosley Street — trams" },
      { shape: { x: -52, y: 30, w: 142, h: 2 }, kind: "pavement" },
      { shape: { x: -52, y: 32, w: 142, h: 12 }, kind: "road", label: "Parker Street — bus stands" },
      { shape: { x: 52, y: -30, w: 38, h: 60 }, kind: "road", label: "Bus station" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -20, y: -38 }, kind: "other", label: "Piccadilly Gardens Metrolink stop" },
      { pos: { x: 10, y: 4 }, kind: "other", label: "Queen Victoria statue" },
      { pos: { x: -30, y: 10 }, kind: "tree" },
      { pos: { x: 0, y: -14 }, kind: "tree" },
      { pos: { x: 30, y: 16 }, kind: "tree" },
      { pos: { x: -46, y: -34 }, kind: "lamppost", label: "Kerb — Piccadilly / Market St corner" },
      { pos: { x: -70, y: 24 }, kind: "lamppost", label: "Kerb — Mosley Street" },
      { pos: { x: 20, y: 38 }, kind: "car", label: "Buses" },
      { pos: { x: 60, y: 38 }, kind: "car", label: "Buses" },
    ],
    hazards: [
      {
        id: "knife",
        pos: { x: -60, y: -24 },
        kind: "structural",
        label: "Offender armed with a small knife — on foot along Market Street towards the Arndale",
        knownFromPri: true,
      },
      {
        id: "crowd",
        pos: { x: -10, y: -4 },
        kind: "structural",
        label: "Crowded pedestrian space — onlookers, phones out; no vehicle pursuit through it",
        knownFromPri: true,
      },
      {
        id: "trams",
        pos: { x: -58, y: 10 },
        kind: "structural",
        label: "Live tram movements on Mosley Street and at the stop — officers on foot cross with care",
        discoverAfterMinOnScene: 1,
      },
    ],
    // No casualty authored. The cut on the victim's palm is a dressing and
    // a walk-in centre; the sim scores every casualty on hospital delivery,
    // and this man does not go to hospital.
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Market Street corner / victim", face: "front", bearingDeg: 270 },
      { id: 2, label: "Sector 2 · Piccadilly / tram stop", face: "rear", bearingDeg: 0 },
      { id: 3, label: "Sector 3 · Oldham Street / bus station", face: "right", bearingDeg: 90 },
      { id: 4, label: "Sector 4 · Parker Street / Mosley Street", face: "left", bearingDeg: 180 },
    ],
  },

  // The caller is the victim, on his friend's phone. The description comes
  // out of him in the order it comes back to him, which is not the order a
  // circulation form wants it in. The CCTV control room and the second
  // caller reach the operator through the desk and are marked as such.
  //
  // A city-centre car from Bootle Street is on the gardens in three or four
  // minutes, and the caller clears the line when it lands — so the beats
  // sit tight. On a quick response the officers get there before the
  // detention plays out; on a slow one the caller says so.
  informantScript: [
    {
      id: "victim-first",
      atSec: 4,
      text: "I've just been robbed — he had a knife. Piccadilly Gardens, the Market Street end, right on the corner by the tram stop. He's taken my phone, I'm on my mate's. He's run off up Market Street, towards the Arndale. Thirty seconds ago, less.",
      tone: "critical",
    },
    {
      id: "description-1",
      atSec: 28,
      text: "White lad, young — eighteen, twenty. Black puffer jacket, hood up. He had a snood or a mask thing pulled up over his nose, I only really saw his eyes. Bit taller than me, so five ten, five eleven.",
      tone: "urgent",
    },
    {
      id: "injury-check",
      atSec: 52,
      text: "My hand — yeah, it's cut. Across the palm, I must have grabbed at the blade. It's not deep, it's pretty much stopped, my mate's wrapped his hoodie round it. I don't need an ambulance, I need you to find him.",
      tone: "info",
    },
    {
      id: "description-2",
      atSec: 76,
      text: "Grey tracksuit bottoms, black trainers, and a black cap under the hood. He's got a small black bag across his chest — he put my phone in that. The knife was small, silver, folding — like a lock knife. He's put it in his jacket pocket, right side.",
      tone: "urgent",
    },
    {
      id: "phone-details",
      atSec: 100,
      text: "It's an iPhone 14, black, cracked screen, clear case. I've logged into Find My on my mate's phone — it's showing on Market Street, up near the Arndale, and it was moving. The IMEI's on the box at home, my mate can ring my flatmate for it.",
      tone: "info",
    },
    {
      // The control room voice. Certain, because the brief is that CCTV
      // has him; whether they keep him is the roll below.
      id: "cctv-has-him",
      atSec: 118,
      text: "CCTV control room on the line: we have a male matching — black puffer, hood up, grey bottoms, bag across the chest — walking fast on Market Street outbound, just passing the Arndale entrance. Not running now. We're tracking him camera to camera.",
      tone: "urgent",
    },
    {
      // The link. Two in half an hour is a pattern, and the second victim
      // is the one who makes it chargeable as a series.
      id: "second-victim",
      atSec: 138,
      probability: 0.7,
      text: "Desk: we've a second caller — a woman at the bus stands on Parker Street, ringing from a shop landline. Phone taken at knife-point about twenty minutes before yours. Same description: black puffer, snood, small silver knife. That's two in half an hour. Linking the logs now.",
      tone: "urgent",
    },
    // --- The roll. Roughly one run in two he is stopped on the street. --
    {
      id: "cctv-detained",
      atSec: 158,
      probability: 0.55,
      requiresFiredIds: ["cctv-has-him"],
      suppressesIds: ["cctv-lost"],
      text: "CCTV: he's been stopped. Outside the Arndale on Market Street — a plain-clothes officer who was passing has him on the ground, one detained. Something silver's been kicked away across the flags, it's still on the floor. Your officer's on his own with him and a crowd's forming — get him a car.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      // No probability, deliberately. cctv-detained has already taken its
      // 55%; this is the rest and it has to be certain, or a share of runs
      // hear neither and the camera trail just stops.
      id: "cctv-lost",
      atSec: 180,
      requiresFiredIds: ["cctv-has-him"],
      suppressesIds: ["cctv-detained"],
      text: "CCTV: we've lost him at the High Street junction. Last camera had him turning north towards the Northern Quarter about ninety seconds ago — could be into the Arndale by the High Street doors, could be up Tib Street. Your units want to be on High Street, not the gardens.",
      tone: "urgent",
    },
    {
      id: "detained-victim",
      atSec: 200,
      requiresFiredIds: ["cctv-detained"],
      text: "My mate's just said they've got someone outside the Arndale, it's all over his phone. Is that him? Do I need to come and look at him? I'll do a statement now, whatever you need, before I forget his face.",
      tone: "info",
    },
    {
      // Only on a slow response — seven minutes with nobody on the gardens
      // is a long time in the city centre.
      id: "slow-response",
      atSec: 250,
      delayThresholdSec: 420,
      text: "Are you actually sending someone? I've been stood here ages. My hand's come through the hoodie again and there's a lad over there filming me. He could be anywhere by now, he could be on a tram.",
      tone: "urgent",
      effect: { pulseCritical: true },
    },
  ],

  callGrade: {
    scale: "police_thrive",
    grade: 1,
    standardMinutes: 15,
    basis:
      "GMP Grade 1 (Immediate) — 'within 15 minutes', GMP's own published aspired attendance time, force-wide with no urban/rural split (Chief Constable's Regulation 28 response to HM Senior Coroner Manchester West, 26 Aug 2025; GMCA GMP Performance Briefing, Jan 2026 — 95% within 15 min in 2025, average 7m52s). Robbery with a bladed article, offender at large on foot in a crowded place: Threat and Harm both live on THRIVE.",
  },
};
