import type { Scenario } from "../incident_types";

// Scenario 43 — missing child, the boating lake, Heaton Park.
//
// The everything-goes job. A seven-year-old, twenty minutes gone, last
// seen at the water's edge. On the College of Policing risk model that is
// high risk — significant harm "very likely" — and high risk almost always
// means immediate deployment, so the desk sends the lot on the first
// call: cars, the dog, the aircraft. The dog and the aircraft are the two
// things that only get worse the longer you wait on them, which is why
// they go at the same time as the cars and not after the first car has
// had a look.
//
// The water is what grades it. Everything else about the park — the
// size, the gates, the tram stop — is a search problem; the lake is a
// life problem, and it is yards from the last-seen point. So the search
// anchors on the water and stays anchored there, however tempting the
// sighting from the other side of the park.
//
// The other half of the job is the end of it. Most of these children are
// found inside half an hour with somebody who thought somebody else knew,
// and the call comes when the helicopter is airborne, the dog van is on
// the motorway and the cars are still running on blues. The test is
// whether the operator stands it all down at once. In the engine the
// caller's line closes when the first unit lands, so the found beat is
// authored to land at eight minutes — heard on most runs while everything
// is still moving, which is precisely when releasing it matters.
//
// The bad outcome exists, at one run in twenty, because the water is why
// the call is Grade 1 and a scenario that could never go there would be
// teaching the grade without the reason. It is written from the desk's
// side and no further than the desk would hear: she is in, a member of
// staff goes in after her, she is out and breathing and cold. From there
// it is an ambulance job with a paediatric destination and the police
// job is over.
//
// FICTIONAL: the family, the friend, the member of park staff and the
// car. Heaton Park, the boating lake, the Lake Cafe, the adventure
// playground, the tramway terminus, the Lake Car Park and the gates are
// real and are placed from OpenStreetMap. Nothing here describes how the
// park's staff actually work; the radios and the gate call are what any
// large park would do, not a claim about this one.

export const scenario43: Scenario = {
  id: "43",
  slug: "43_missing_child_heaton_park",
  title: "Missing child — boating lake, Heaton Park",
  type: "police_missing_child",
  patch: "Southern",
  severity: "high",
  trigger:
    "999 from a mother at the boating lake in Heaton Park — girl of seven, gone twenty minutes, last seen at the water's edge by the cafe. Red coat. Cannot swim. Park staff searching",

  location: {
    // The lakeside path between the Lake Cafe and the south end of the
    // water. M25 2SW is the park's own postcode and the only one inside
    // it; its centroid sits at Heaton Hall, about 590 m north of here.
    address: "Boating lake (Lake Cafe), Heaton Park, Middleton Road, Manchester",
    postcode: "M25 2SW",
    coords: { lat: 53.5311, lng: -2.2574 },
  },

  property: {
    class:
      "Municipal park — boating lake with a cafe and an adventure playground on its south-west shore, deep inside about 250 hectares of open parkland and woodland",
    size: "The lake sits roughly 400 m from the nearest public road. The park has several gates onto three main roads and a tram stop",
    occupants:
      "Weekend footfall: families on every path, the cafe busy, the playground full. Mother and her four-year-old with park staff at the cafe",
    vulnerabilities: [
      "Seven years old, small for her age, cannot swim",
      "Twenty minutes gone before the call — she could be ten yards away or a mile",
      "Weekend footfall: many children in red coats, many well-meaning sightings",
    ],
    access:
      "No road to the lake. Vehicles come in on the park service roads — Lake Car Park off Middleton Road (A576) and then the service road to the cafe, about 250 m; Grand Lodge on Bury Old Road for the west side. The last 60 m to the water's edge is footpath",
    knownHazards: [
      "Open water — unfenced lake margins yards from the last-seen point; cold water",
      "Multiple exits from the park onto the A576 Middleton Road, the A665 Bury Old Road and the Metrolink stop",
      "Large open area with woodland edges — a small child is out of sight within a hundred metres",
    ],
    firstDueStationId: "MP-MCR",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — public park. Park staff are on site and on a second line; they know the ground and every gate. Use them, and direct them.",
      "High risk on the College of Policing APP: harm assessed as very likely — seven years old, open water within yards of the last-seen point, twenty minutes gone. The APP's high-risk category almost always means immediate deployment, delayed only in exceptional circumstances and not by the desk; command-level involvement in the initial enquiries and staffing; a PolSA if it is not quickly resolved.",
      "The lake is 400 m inside the park. Lake Car Park off Middleton Road (A576) is the nearest vehicle point, then the service road to the cafe. Grand Lodge (Bury Old Road) and St Margaret's Road serve the west and north.",
      "Nothing on this attendance can go in the water. If she is in the lake it is GMFRS water rescue — the water incident units are at Heywood and Eccles — and an NWAS crew from Whitefield or Middleton. Know that before you need it.",
    ],
  },

  methane: {
    M: "No",
    E: "Boating lake, Heaton Park, Manchester M25 2SW — lakeside by the Lake Cafe, 400 m inside the park from Middleton Road",
    T: "High-risk missing child — girl, 7, last seen at the water's edge twenty minutes before the call; open water",
    H: "Open water; a large park with many exits onto busy roads and a tram stop; weekend footfall",
    A: "Park service roads — Lake Car Park off Middleton Road (A576) for the lake; Grand Lodge on Bury Old Road for the west side; NPAS overhead",
    N: "None injured. One child missing; mother and a younger sibling with park staff at the cafe",
    emergencyServices:
      "Police — response units, dog, NPAS; park staff searching under police direction. Fire water rescue and ambulance not committed unless she is found in the water",
  },

  // Four police slots — the cap the police harness puts on a volume job,
  // and about what a district can actually free in the first minutes.
  // Over-mobilising is allowed and on this job it is not wrong; the
  // debrief marks it soft.
  pda: [
    {
      id: "response1",
      label: "Response 1 — the lakeside",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      preferredStationId: "MP-MCR",
      notes:
        "To Mum at the cafe. Description, the photograph off her phone, what Isla was wearing, who else knows her — and the last-seen point walked with her, not described down the phone. The water margin is theirs first",
    },
    {
      id: "response2",
      label: "Response 2 — the ways out",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      preferredStationId: "MP-MCR",
      notes:
        "Not to the lake. Lake Car Park and the Middleton Road gate, then the Metrolink gate — the exits, and anyone leaving with a child who is not theirs. A second car at the cafe is a car wasted",
    },
    {
      id: "dog",
      label: "Dog unit",
      service: "Police",
      requiredApplianceTypes: ["Police_Dog"],
      requiredCapabilities: ["Police_Dog"],
      preferredStationId: "MP-TRA",
      notes:
        "A track from the last-seen point while the scent is fresh and before forty people have walked over it. The one unit that gets less useful every minute you wait on it",
    },
    {
      id: "npas",
      label: "NPAS 21 — overhead",
      service: "Police",
      requiredApplianceTypes: ["Police_NPAS"],
      requiredCapabilities: ["Police_Air"],
      preferredStationId: "MP-NPAS",
      notes:
        "A red coat on open parkland, and thermal along the water margins and the wooded edges. 250 hectares is not searched on foot in the time she has. Ask for it now; cancel it the moment she turns up",
    },
  ],

  evaluation: {
    targets: [
      {
        metric: "Time-to-mobilise",
        target: "< 90 seconds — everything on the PDA in the first call, not one car and see",
      },
      {
        metric: "Attendance",
        target: "first unit at the lakeside inside GMP's 15-minute Grade 1 standard",
      },
      {
        metric: "Search anchored on the water",
        target: "the lake margins covered first and kept covered — a sighting elsewhere moves a car, not the lake",
      },
      {
        metric: "Dog and air asked for early",
        target: "NPAS and the dog requested at the outset, alongside the cars",
      },
      {
        metric: "Stand-down",
        target: "the moment she is found, every unit still running is released — the aircraft first",
      },
    ],
    lesson:
      "A missing seven-year-old next to open water is Grade 1 and everything goes, and you send it all on the first call, not after the first car has had a look. The dog and the aircraft are the two things that only get less useful the longer you wait, so they are asked for at the same time as the cars. Anchor the search on the water and keep it there: a sighting on the far side of the park moves a car, not the lake. Keep an open mind about why she is gone, and let the car on the gates be your hedge. Then the other half of the job. Most of these children are found inside half an hour with a friend, a sibling, a grandparent who thought somebody else knew, and when that call comes you have a helicopter, a dog van and cars still running on blues to a job that is over. Stand them down at once and say so on the log. Releasing quickly is not carelessness; it is what lets you send it all again next time.",
  },

  // Top-down scene — the south end of the boating lake, 260 m by 280 m.
  // The lake outline is the OpenStreetMap water polygon, squared off; the
  // cafe, the adventure playground, the tramway terminus and the paths
  // are placed from the same source. There is no road in frame: the
  // nearest is 400 m away, which is the point.
  scene: {
    viewBox: { x: -120, y: -150, width: 260, height: 280 },
    compassNorth: "up",
    // An ambulance gets to the cafe on the service road; the last stretch
    // from the water's edge is a carry along the path.
    egressExtraSeconds: 90,
    buildings: [
      { shape: { x: 0, y: 16, w: 24, h: 28 }, kind: "target", label: "Lake Cafe — last-seen point" },
    ],
    roads: [
      // The lake, tapering south to the cafe.
      { shape: { x: -40, y: -118, w: 80, h: 40 }, kind: "water", label: "Boating lake" },
      { shape: { x: -42, y: -80, w: 70, h: 40 }, kind: "water" },
      { shape: { x: -30, y: -42, w: 40, h: 33 }, kind: "water" },
      // Lakeside path around the water.
      { shape: { x: -52, y: -128, w: 110, h: 4 }, kind: "pavement", label: "Lakeside path" },
      { shape: { x: -52, y: -124, w: 4, h: 124 }, kind: "pavement" },
      { shape: { x: 54, y: -128, w: 4, h: 124 }, kind: "pavement" },
      { shape: { x: -52, y: -4, w: 110, h: 5 }, kind: "pavement", label: "Water's edge by the cafe" },
      // Adventure playground on the south-west shore.
      { shape: { x: -48, y: 6, w: 46, h: 84 }, kind: "garden", label: "Lakeside Adventure Playground" },
      // Heritage tramway terminus east of the lake.
      { shape: { x: 60, y: -96, w: 6, h: 52 }, kind: "pavement", label: "Heaton Park Tramway — Lakeside terminus" },
      { shape: { x: 66, y: -90, w: 74, h: 4 }, kind: "pavement" },
      // Park service road west of the lake — from Grand Lodge / Bury Old Road.
      { shape: { x: -74, y: -150, w: 7, h: 280 }, kind: "driveway", label: "Park service road (west) — Grand Lodge" },
      // Service road and path south-east to the Lake Car Park.
      { shape: { x: 24, y: 58, w: 116, h: 6 }, kind: "driveway", label: "Service road to Lake Car Park (250 m) / Middleton Road" },
      // Path south towards the Colonnade and Sheepfoot Lane.
      { shape: { x: -2, y: 44, w: 4, h: 86 }, kind: "pavement", label: "Path south — Sheepfoot Lane entrance (400 m)" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: 31, y: 37 }, kind: "other", label: "Lake information board" },
      { pos: { x: -90, y: -100 }, kind: "tree" },
      { pos: { x: -100, y: -40 }, kind: "tree" },
      { pos: { x: -96, y: 60 }, kind: "tree" },
      { pos: { x: 90, y: -130 }, kind: "tree" },
      { pos: { x: 110, y: -40 }, kind: "tree" },
      { pos: { x: 100, y: 100 }, kind: "tree" },
      { pos: { x: 40, y: 110 }, kind: "tree" },
      { pos: { x: 30, y: 8 }, kind: "lamppost" },
      { pos: { x: -56, y: 100 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "open-water",
        pos: { x: -6, y: -70 },
        kind: "structural",
        label: "Open water — the boating lake. Unfenced margins, cold water. This is why the call is Grade 1",
        knownFromPri: true,
      },
      {
        id: "no-road",
        pos: { x: 100, y: 66 },
        kind: "structural",
        label: "No road at the lakeside — vehicles reach the cafe on the park service road; Lake Car Park 250 m, Middleton Road 400 m",
        knownFromPri: true,
      },
      {
        id: "exits",
        pos: { x: -100, y: 110 },
        kind: "structural",
        label: "Many ways out — Sheepfoot Lane 400 m south, the Metrolink gate 570 m west, Middleton Road east. A seven-year-old walks 80 m a minute",
        knownFromPri: true,
      },
      {
        id: "footfall",
        pos: { x: -24, y: 30 },
        kind: "structural",
        label: "Weekend footfall — families, dogs, cyclists on every path; witnesses plentiful and unreliable",
        knownFromPri: false,
        discoverAfterMinOnScene: 2,
      },
    ],
    // Present only on the one run in twenty where the water beat fires;
    // revealCasualty flips her from absent to present at that moment.
    // Conscious, breathing, coughing and cold — a live patient, and a
    // paediatric one, so the destination is the children's ED and not
    // the nearest adult department.
    casualties: [
      {
        id: "cas-43-isla",
        label: "Girl, 7 — brief submersion, out of the water, conscious and cold",
        // On the bank between the water's-edge path and the playground
        // grass — out of the water, where the staff beat puts her.
        pos: { x: -10, y: 3 },
        severity: "serious",
        presentProbability: 0,
        discoverAfterMinBa: 0,
        clinical: {
          // Tachypnoeic and coughing with sats down from aspirated water;
          // tachycardic from cold and fright; GCS 14 because she is
          // crying and confused, not obtunded. Temperature is the number
          // that keeps falling if nobody does anything about it.
          vitals: { rr: 30, spo2: 90, hr: 132, bpSys: 96, bpDia: 60, gcs: 14, temp: 34.6, bm: 5.2 },
          ageYears: 7,
          presumedCondition:
            "Submersion incident — brief immersion in the boating lake, recovered by park staff; conscious, coughing, hypoxic and hypothermic. Any paediatric submersion goes to hospital however well she looks",
          redFlags: ["airway_compromise"],
          preferredDestination: "paed_ed",
          criticalInterventions: ["oxygen", "warming"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Cafe and playground — last-seen point", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Lake margins — the water", face: "rear", bearingDeg: 0 },
      { id: 3, label: "Sector 3 · East — tramway terminus and the Middleton Road side", face: "right", bearingDeg: 90 },
      { id: 4, label: "Sector 4 · West — service road and the Metrolink gate", face: "left", bearingDeg: 270 },
    ],
  },

  // Two voices on the line: the mother first, then park staff on a
  // second line from the cafe. The engine closes the line when the first
  // unit lands, so the found beats sit at eight and thirteen minutes —
  // the first is heard on most runs while everything is still moving,
  // the second is certain and catches the slow ones.
  informantScript: [
    {
      id: "mum-first",
      atSec: 4,
      text: "My little girl's gone. Isla. She's seven. We're at the boating lake in Heaton Park, by the cafe — I bent down to do her brother's shoe and when I looked up she wasn't there. That was twenty minutes ago, I've been up and down the path shouting her name. She's got a red coat on, a red duffle coat. She can't swim.",
      tone: "critical",
    },
    {
      id: "mum-detail",
      atSec: 45,
      text: "She's small for seven. Blonde hair in a bobble, red coat, grey leggings, pink trainers with lights in them. She wanted to feed the ducks — she was right at the edge, that's what's — she was right at the water. There's a man from the park here now, he's got a radio.",
      tone: "urgent",
    },
    {
      id: "staff-line",
      atSec: 100,
      text: "Park staff, on a second line from the cafe at the lake. We've got Mum and the little lad with us. I've put it out on our radios to every gate, and I've asked the lads to stop any little girl in a red coat going out on her own, and to have a good look at anybody leaving with one. Two of mine are walking the water's edge now, one each way round. Where do you want us to meet your officers — Lake Car Park off Middleton Road is nearest for a vehicle.",
      tone: "info",
    },
    {
      // The other reason a child is gone. The desk does not rule it out
      // and the car on the gates is the hedge.
      id: "mum-fear",
      atSec: 200,
      probability: 0.6,
      text: "She wouldn't just wander off, she's not like that, she's clingy if anything. Somebody's taken her. You need to be stopping cars — please — somebody's got her.",
      tone: "urgent",
    },
    {
      // The pull away from the water. The right answer is a car to the
      // Hall and the lake staying covered; the wrong one is everybody up
      // the hill.
      id: "sighting-hall",
      atSec: 320,
      probability: 0.5,
      text: "Park staff again. A woman up at the farm centre has just told one of my lads she saw a little girl in a red coat on her own, heading up the hill towards the Hall, maybe ten minutes since. That's the far side from the lake — a good five hundred metres. Do you want us to pull the lads off the water and send them up there?",
      tone: "urgent",
    },
    // --- The roll. One run in twenty. ------------------------------------
    {
      id: "water",
      atSec: 400,
      probability: 0.05,
      suppressesIds: ["found-friend", "slow-nobody", "found-late"],
      text: "Park staff — she's in the water. She's in the lake, right at the edge by the cafe, one of my lads has gone in — he's got her, he's got her, he's bringing her out. She's coughing. She's breathing. Get an ambulance here. Lake Car Park, Middleton Road, I'll have someone at the gate.",
      tone: "critical",
      effect: { pulseCritical: true, revealCasualty: "cas-43-isla" },
    },
    {
      id: "water-out",
      atSec: 440,
      requiresFiredIds: ["water"],
      text: "She's out on the grass. She's awake, she's crying, she's coughing up water and she's shaking — she's blue round the mouth. We've got coats over her and Mum's with her. How long for the ambulance?",
      tone: "critical",
    },
    // --- The usual ending, at eight minutes. ------------------------------
    {
      id: "found-friend",
      atSec: 480,
      probability: 0.7,
      suppressesIds: ["slow-nobody", "found-late"],
      text: "Stop — stop, she's found. Mum's phone's just gone, it's her friend Karen, she's got Isla. She's had her the whole time. She took her off to find a toilet and then across to the playground, and she thought Gemma had seen them go. She's fine. She's absolutely fine. Mum says to tell you she's sorry. You can stand everybody down.",
      tone: "info",
    },
    {
      // Only on a slow response: nothing on scene at ten minutes, thirty
      // since she went, and the mother is at the water's edge.
      id: "slow-nobody",
      atSec: 600,
      delayThresholdSec: 600,
      text: "Park staff. It's ten minutes since I rang and half an hour since she went, and there's still no police here. Mum's at the water's edge and she's talking about going in. I've got a lad stood with her. I need somebody here now.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      // No probability, deliberately. water took its one in twenty and
      // found-friend its seven in ten; this is what is left and it has to
      // be certain, or a share of slow runs never hear an ending.
      id: "found-late",
      atSec: 780,
      suppressesIds: ["found-friend", "water"],
      text: "Park staff — she's found, she's fine. Mum's friend Karen has just walked back down from the farm centre with her — she'd taken Isla up to see the animals and thought Gemma knew, and her phone's been in her bag the whole time. Not a scratch on her. Mum's got hold of her and won't let go. Stand your lot down, and thank you.",
      tone: "info",
    },
  ],

  callGrade: {
    scale: "police_thrive",
    grade: 1,
    standardMinutes: 15,
    basis:
      "High-risk missing child. College of Policing APP, Missing persons — risk identification, assessment and management (updated 3 Jul 2026): high risk is where 'the risk of significant harm to the subject or the public is assessed as very likely' and the category 'almost always requires the immediate deployment of police resources' — a seven-year-old beside open water, twenty minutes gone, is squarely inside it. GMP Grade 1 Immediate, 15 minutes force-wide: GMP Chief Constable's Regulation 28 response to HM Senior Coroner Manchester West, 26 Aug 2025 ('Immediate or grade 1 incidents – within 15 minutes'), and the GMCA GMP Performance Briefing, Jan 2026 ('under 15 minutes (our aspired attendance time)'). The APP prescribes no THRIVE number; putting an immediate-deployment high-risk missing child at Grade 1 is inference from the APP wording, not a GMP-published mapping.",
  },

  // The call as Gemma has it: on her own mobile outside the Lake Cafe
  // with a four-year-old on her hip, twenty minutes after she looked up
  // and Isla was not there. The water is five yards away and she cannot
  // stop looking at it. Clear on the description; not on much else.
  call: {
    caller: {
      name: "Gemma Whittaker",
      phone: "07700 900418",
      relation: "Mother of the missing child",
      where: "Outside the Lake Cafe at the boating lake, Heaton Park, with her four-year-old son",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "Police — my little girl's gone missing. Isla, she's seven. We're in Heaton Park at the boating lake, by the cafe — she was stood right next to me at the water and I bent down to do her brother's shoe and she'd gone. That's twenty minutes ago, I've been up and down shouting her. She's got a red coat on. She can't swim. Please.",
    deflection: "I don't know, I don't know — just find her, please, please find her!",
    reassurance: {
      text: "Gemma, listen to me. Officers are on their way to you now. I need you to stay by the cafe so she can find you, and keep talking to me.",
      reply: "Okay. Okay. I'm here. I'm by the cafe.",
    },
    answers: {
      p_happening: {
        text: "My daughter's missing. Isla — she's seven. We're at the boating lake in Heaton Park, by the Lake Cafe. She was right by me at the edge feeding the ducks, I looked down for a second and she wasn't there. I've looked for twenty minutes. Red coat, red duffle coat. She can't swim.",
        tone: "critical",
        effect: { regrade: "GRADE 1", basis: "High-risk missing child — seven years old, last seen at the water's edge, twenty minutes gone" },
        followUps: [
          {
            id: "p_happening_lastseen",
            text: "Where exactly was she when you last saw her?",
            answer: {
              text: "Right at the water's edge, by the cafe — the lake side of it. Feeding the ducks, five yards from me. There's no railings, that's the thing, it's just the path and then the water.",
              tone: "critical",
            },
          },
        ],
      },
      p_ongoing: {
        text: "Yes — she's still gone. She's not come back. I've been round the playground twice and up the path both ways shouting her name and nobody's seen her. It's twenty minutes. More.",
        tone: "critical",
      },
      p_weapons: {
        text: "No — no, it's nothing like that. Nobody's — she's just gone. She's a little girl and she's gone.",
      },
      p_injured: {
        text: "Nobody's hurt. I don't — I don't know if she's hurt. I don't know where she is. That's the whole thing.",
        tone: "urgent",
      },
      p_who: {
        text: "Just her — Isla Whittaker, she's seven. I'm here with her little brother, he's four. My friend Karen's in the park with us with her two — she'd gone off to find the toilets before it happened. I've rung her, it's going to voicemail.",
        followUps: [
          {
            id: "p_who_karen",
            text: "Where is Karen now?",
            answer: {
              text: "I don't know. She went to find the toilets with her two, that was before — before Isla. I've rung her twice and it's straight to voicemail. She'd have said if — she'd have said.",
              tone: "urgent",
            },
          },
        ],
      },
      p_description: {
        text: "She's seven but she's small, she looks about five. Long blonde hair in a bobble on top. Red duffle coat with the toggles, grey leggings, pink trainers — the ones with the lights in the heels. She had a bag of bread for the ducks.",
        followUps: [
          {
            id: "p_description_photo",
            text: "Have you got a photograph of her on your phone?",
            answer: {
              text: "Yes — yes, loads, I took one this morning by the car, she's in the same coat. I can send it — tell me where to send it.",
            },
          },
        ],
      },
      p_direction: {
        text: "I don't know. I DON'T know. If I knew which way I'd be — sorry. Sorry. I looked up and she wasn't there. Not on the path, not in the playground. I don't know if she went round the lake or — or the other way, or —",
        tone: "urgent",
        needsCalm: true,
        followUps: [
          {
            id: "p_direction_paths",
            text: "Which ways can she have gone from there?",
            answer: {
              text: "The path goes round the lake both ways. The playground's right there, the adventure one — I've been through it twice. And there's the road down to the car park, she knows the car park, that's where we came in. That's all I can think.",
            },
          },
        ],
      },
      p_drink: {
        text: "What? No — she's seven. No. Nobody's — no.",
        needsCalm: true,
      },
      p_known: {
        text: "There's nobody — nobody's involved, she's just gone. Unless somebody's — no. No. It's just her. She wandered. She must have wandered.",
        tone: "urgent",
      },
      p_vulnerable: {
        text: "She's seven! She can't swim and the water's right there, it's right there, there's nothing stopping her going in. And she'd go with anybody — she's friendly, she'd talk to anybody.",
        tone: "critical",
      },
      p_where: {
        text: "Heaton Park — the boating lake, the Lake Cafe. We're right outside the cafe. You come in off Middleton Road, there's a car park by the lake, and it's up the road from there. I don't know the postcode. It's Heaton Park, everybody knows it.",
      },
      p_safe: {
        text: "I'm fine — it's not me. I'm at the cafe, I've got her brother with me. I'm not going anywhere, I've stayed by the cafe in case she comes back.",
      },
      p_seen: {
        text: "I was there. I was right there. I looked down to do his shoe and when I looked up she'd gone. It was seconds. That was twenty minutes ago. Twenty-five now.",
        tone: "urgent",
      },
      p_details: {
        text: "Gemma Whittaker. It's my mobile — 07700 900418. If I lose you ring me back on it, please. Please ring me back.",
      },
    },
    interjections: [
      {
        atSec: 55,
        text: "Isla! ISLA! — sorry, sorry, I thought — it's another little girl. There's loads of them in red coats. Sorry.",
        tone: "urgent",
      },
      {
        atSec: 130,
        text: "I can't stop looking at the water. It's right there. She was right at the edge — oh God, if she's gone in — she can't swim, she can't swim —",
        tone: "critical",
        effect: { state: "panicking" },
      },
      {
        atSec: 190,
        text: "There's a siren — I can hear a siren on the main road. Is that them? Tell them the cafe, the Lake Cafe, I'm outside the front of it in a green coat with a little boy.",
        requiresOpened: true,
      },
      {
        atSec: 240,
        text: "Is anyone coming? It's been — she's been gone nearly half an hour. Please. Please just send someone.",
        tone: "urgent",
        requiresOpened: false,
      },
    ],
    onDispatch: "Thank you. Thank you. Tell them the cafe — the Lake Cafe, I'll be outside it. Please tell them to hurry.",
  },
};
