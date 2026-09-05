import type { Scenario } from "../incident_types";

// Scenario 48 — RTC, damage only, road blocked. Barton Road, Stretford.
//
// The smallest police job on the shift, and the one most often got wrong
// by sending too much. Two cars have met at the mouth of Moss Park Road,
// nobody is hurt, and the only reason it is a police call at all is that
// they are sat across both lanes of a bus route and one driver is
// shouting at the other. Grade 2 — Priority — which on GMP's published
// standard means an hour.
//
// The mechanics are traffic management, the exchange of details,
// recovery, and time. A blocked borough road does not stay a damage-only
// for long: cars go up the kerb past pedestrians, and two drivers left
// standing in the road together get worse, not better. If the response
// is slow enough the argument becomes a fight, and the job the operator
// eventually sends a car to is an assault at Grade 1. The regrade is a
// probabilistic beat that only exists on a slow attendance — an operator
// who has a car there in twenty minutes never hears it.
//
// One response unit. Not the roads policing unit: a damage-only on a
// 30 mph borough road is response work, and RPU are for the strategic
// network and for the collisions with a casualty and an investigation in
// them. Not fire, not ambulance. The PDA is one slot because the debrief
// scores conformance against the slot count, and an "optional" second
// slot would penalise the correct answer.
//
// Grading: GMP runs Grade 1 (Immediate, 15 min) and Grade 2 (Priority,
// 60 min) — its Grades 3–5 were removed in February 2022 (GMP FOI
// 01/FOI/24/012708/K, as cited in scenario 51). The one-hour figure is
// GMP's own, cited in callGrade.basis.
//
// FICTIONAL: every person and both vehicles. Real: Barton Road, Moss Park
// Road, Park Road, Sevenways, the bus stops, and the German Lutheran
// church (Martin Luther Kirche) which OSM places on the north side of
// Barton Road about 65 m east of the junction, towards Park Road — not on
// the Moss Park Road corner. The house numbers in the records are made up.

export const scenario48: Scenario = {
  id: "48",
  slug: "48_rtc_barton_road_stretford",
  title: "RTC, damage only, road blocked — Barton Road, Stretford",
  type: "police_rtc_damage_only",
  patch: "Southern",
  severity: "low",
  trigger:
    "Two cars in collision on Barton Road, Stretford, at the Moss Park Road junction — a silver Toyota Yaris and a black BMW across both lanes, nothing getting past either way. Both drivers out and uninjured; one of them shouting at the other. Caller is a resident on the footway",

  location: {
    address: "Barton Road at Moss Park Road, Stretford",
    postcode: "M32 9RA",
    coords: { lat: 53.4479, lng: -2.3156 },
  },

  property: {
    class:
      "Public highway — Barton Road, Stretford: two-lane single carriageway, 30 mph, at the Moss Park Road junction. Housing either side, a church a little way along towards Park Road, bus stops both ways",
    occupants:
      "Two drivers, both out of their vehicles and uninjured, one aggressive. The caller on the footway. A queue building in both directions",
    vulnerabilities: [
      "Carriageway blocked both ways — traffic mounting the footway to get past",
      "Argument between the drivers, escalating the longer they are left together",
      "Debris and coolant across the carriageway",
    ],
    access:
      "Barton Road from Park Road to the east or from Sevenways to the north-west; Moss Park Road (20 mph residential) comes in from the west and avoids the queue. No verge and no hard shoulder — the protecting vehicle sits in a live lane, nose-out with rear blues",
    knownHazards: [
      "Live traffic squeezing past the obstruction on both sides",
      "Verbal aggression from one driver towards the other",
      "Glass, plastic and coolant on the road surface",
    ],
    firstDueStationId: "MP-TRA",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — public highway. Barton Road at Moss Park Road is a two-lane 30 mph borough road with housing either side; the German church sits on the north side between here and Park Road; buses use it.",
      "Damage-only collision with the road blocked. Drivers must stop and exchange details under s.170 Road Traffic Act 1988; police attend for the obstruction, for a refusal to exchange, or for an offence — not for the collision itself, which is otherwise a self-report.",
      "Vehicle check on the BMW: MID returns no live policy against the VRM. Read the vehicle record before the car arrives — it is the first question on scene.",
      "Local knowledge: no previous calls to this junction in the last twelve months. Queues back towards Park Road and Sevenways quickly at school run and rush hour.",
    ],
  },

  methane: {
    M: "No",
    E: "Barton Road at the Moss Park Road junction, Stretford, M32 9RA",
    T: "RTC, damage only — two cars across the carriageway, road blocked both directions",
    H: "Live traffic squeezing past; debris and coolant on the road; argument between the drivers",
    A: "Barton Road from Park Road (east) or Sevenways (north-west); Moss Park Road from the west avoids the queue",
    N: "None — both drivers out and uninjured",
    emergencyServices:
      "Police only — one response unit. No ambulance, no fire. RPU not required: borough road, damage only",
  },

  pda: [
    {
      id: "police1",
      label: "Police — response unit",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      preferredStationId: "MP-TRA",
      notes:
        "One car, and it is enough: protect the scene, manage the traffic, exchange the details, get recovery moving. RPU are not on this attendance — a damage-only on a borough 30 is response work; roads policing take the strategic network and the collisions with a casualty or an investigation. Fire and ambulance likewise: nobody is hurt, and coolant is not a fire",
    },
  ],

  evaluation: {
    targets: [
      {
        metric: "Attendance",
        target:
          "one response unit in attendance well inside the 60-minute Grade 2 standard — under 20 minutes, because the road is blocked",
      },
      {
        metric: "Sizing",
        target: "one car. No second unit, no RPU, no fire, no ambulance — nobody is hurt and nothing is leaking that matters",
      },
      {
        metric: "Traffic management",
        target:
          "carriageway protected and the queue managed before anything else — a shunt with cars squeezing past is how a damage-only becomes an injury RTC",
      },
      {
        metric: "Recovery",
        target:
          "recovery requested from scene as soon as the cars are confirmed immobile — the road reopens when they move, not when the paperwork is finished",
      },
      {
        metric: "Regrade",
        target: "if it goes to a fight, regraded Grade 1 at once and a second unit inside 15 minutes",
      },
    ],
    lesson:
      "Nobody is hurt, so this is a Grade 2, and a Grade 2 gets one car. Not two, not the roads policing unit — they are for the motorway and strategic road network and for the collisions with a casualty and an investigation in them — and not the fire service for a puddle of coolant. What earns it a car at all is that the road is blocked, and a blocked road on a borough route does not stay a damage-only for long: cars go up the kerb past a pedestrian, a bus sits across a junction, and two drivers stand in the road shouting at each other for as long as you leave them. The grade gives you an hour. Do not take it. Get the car there, get the carriageway protected, get the details exchanged under a uniform and recovery on the way, and the job is done in forty minutes. Leave it, and the caller will ring back, and what you are sending to will be an assault.",
  },

  callGrade: {
    scale: "police_thrive",
    grade: 2,
    standardMinutes: 60,
    basis:
      "GMP THRIVE Grade 2 — Priority. GMP's published target is attendance within one hour: Chief Constable's Regulation 28 response to HM Senior Coroner Manchester West, 26 Aug 2025 ('Priority or grade 2 — within 1 hour'); the GMCA GMP Performance Briefing of January 2026 calls the hour GMP's 'aspired attendance time' (77% met in 2025, average 1h06m). Grading a damage-only collision Priority because the carriageway is blocked is our application of THRIVE (Threat, Harm, Risk, Investigation, Vulnerability, Engagement), not a GMP-published worked example",
  },

  // Top-down scene. Real geometry, straightened: Barton Road comes in from
  // Park Road heading west-north-west, bends north-north-west at the
  // Moss Park Road junction and carries on to Sevenways. Drawn here as an
  // L — the east arm towards Park Road, the north arm towards Sevenways —
  // with Moss Park Road entering the elbow from the west, which is within
  // about 25 degrees of the real bearings. The two cars sit in the mouth
  // of the junction. Anchor is the junction node.
  scene: {
    viewBox: { x: -60, y: -60, width: 130, height: 100 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -34, y: 7, w: 24, h: 16 }, kind: "neighbour", label: "Housing (Moss Park Road, south side)" },
      { shape: { x: 8, y: -30, w: 12, h: 22 }, kind: "neighbour", label: "Housing (Barton Road, east side)" },
      { shape: { x: -20, y: -58, w: 12, h: 44 }, kind: "neighbour", label: "Housing (Barton Road, west side)" },
      { shape: { x: 22, y: -30, w: 18, h: 22 }, kind: "neighbour", label: "Housing (north side)" },
      { shape: { x: 42, y: -28, w: 16, h: 20 }, kind: "other", label: "German church (Barton Road, north side, by Park Road)" },
      { shape: { x: 12, y: 9, w: 44, h: 18 }, kind: "neighbour", label: "Housing (south side)" },
      { shape: { x: -60, y: -30, w: 44, h: 22 }, kind: "neighbour", label: "Housing (Moss Park Road, north side)" },
    ],
    roads: [
      // Barton Road — east arm, towards Park Road.
      { shape: { x: -5, y: -7, w: 67, h: 2.5 }, kind: "pavement" },
      { shape: { x: -5, y: -4.5, w: 67, h: 9 }, kind: "road", label: "Barton Road — to Park Road" },
      { shape: { x: -5, y: 4.5, w: 67, h: 2.5 }, kind: "pavement" },
      // Barton Road — north arm, towards Sevenways.
      { shape: { x: -7, y: -60, w: 2.5, h: 53 }, kind: "pavement" },
      { shape: { x: -4.5, y: -60, w: 9, h: 64.5 }, kind: "road", label: "Barton Road — to Sevenways" },
      { shape: { x: 4.5, y: -60, w: 2.5, h: 53 }, kind: "pavement" },
      // Moss Park Road — 20 mph residential, entering from the west.
      { shape: { x: -60, y: -3.5, w: 55.5, h: 7 }, kind: "road", label: "Moss Park Road" },
      { shape: { x: -60, y: -6, w: 55.5, h: 2.5 }, kind: "pavement" },
      { shape: { x: -60, y: 3.5, w: 55.5, h: 2.5 }, kind: "pavement" },
      // Park Road runs north from the far end; south of that junction the
      // road continues as the A5181 towards Kingsway and the A56.
      { shape: { x: 62, y: -60, w: 8, h: 56 }, kind: "road", label: "Park Road" },
      { shape: { x: 62, y: 4, w: 8, h: 36 }, kind: "road", label: "Barton Road (A5181) — to Kingsway / A56" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -1, y: -1 }, kind: "car", label: "Silver Toyota Yaris — across both lanes" },
      { pos: { x: 7, y: 1 }, kind: "car", label: "Black BMW 1 Series — nose into the Yaris" },
      { pos: { x: 24, y: -1 }, kind: "car", label: "Queue — eastbound side" },
      { pos: { x: 40, y: -1 }, kind: "car" },
      { pos: { x: 1, y: -26 }, kind: "car", label: "Queue — from Sevenways" },
      { pos: { x: 1, y: -42 }, kind: "car" },
      { pos: { x: 6, y: -48 }, kind: "other", label: "Bus stop" },
      { pos: { x: -6, y: -20 }, kind: "other", label: "Bus stop" },
      { pos: { x: 20, y: -8 }, kind: "lamppost" },
      { pos: { x: 48, y: 6 }, kind: "lamppost" },
      { pos: { x: -8, y: -36 }, kind: "lamppost" },
      { pos: { x: -40, y: 8 }, kind: "tree" },
    ],
    hazards: [
      {
        id: "blocked",
        pos: { x: 3, y: 0 },
        kind: "structural",
        label: "Two vehicles across both lanes at the junction mouth — Barton Road blocked both directions",
        knownFromPri: true,
      },
      {
        id: "debris",
        pos: { x: -2, y: 3 },
        kind: "structural",
        label: "Glass, plastic and a wing mirror across the carriageway",
        knownFromPri: true,
      },
      {
        id: "tempers",
        pos: { x: 10, y: -7 },
        kind: "structural",
        label: "BMW driver aggressive — argument with the other driver ongoing on the footway",
        knownFromPri: true,
      },
      {
        id: "kerb-passing",
        pos: { x: 26, y: -6 },
        kind: "structural",
        label: "Vehicles mounting the north footway to squeeze past — pedestrians at risk",
        discoverAfterMinOnScene: 1,
      },
      {
        id: "coolant",
        pos: { x: 4, y: -3 },
        kind: "chemical",
        label: "Coolant from the BMW pooling under both cars — slippery; not a fire risk, no fire attendance needed",
        discoverAfterMinOnScene: 2,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Junction — the two cars", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Barton Road east — Park Road approach", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Barton Road north — Sevenways approach", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Moss Park Road approach", face: "left", bearingDeg: 270 },
    ],
  },

  // The caller is a resident on the footway. He stays on the line until
  // the first car arrives; everything after the twenty-minute mark only
  // plays on a slow attendance.
  informantScript: [
    {
      id: "first",
      atSec: 5,
      text: "Barton Road in Stretford, at the Moss Park Road junction — just down from the German church, before you get to Park Road. Two cars have gone into each other, a little silver Toyota and a black BMW. They're sat right across the road, nothing's getting past either way. Both drivers are out and walking about.",
      tone: "info",
    },
    {
      id: "shouting",
      atSec: 60,
      text: "The lad out of the BMW is giving her a right mouthful. Says she pulled straight out of Moss Park Road without looking. She's just stood there, she's shaking. Nobody's hurt, I've asked them both.",
      tone: "urgent",
    },
    {
      id: "traffic",
      atSec: 150,
      probability: 0.8,
      text: "It's backing up both ways now. There's a bus stuck behind them and people are trying to squeeze past up the kerb on the church side.",
      tone: "info",
    },
    {
      // Seeds the insurance marker on the vehicle record. The refusal is
      // what a driver with no policy does; the desk that has read the
      // record knows why before the car does.
      id: "details",
      atSec: 420,
      probability: 0.6,
      text: "He won't give her his insurance. He's saying they should just sort it between themselves, cash, no need for the police. She's asked him three times. He's got back in his car and shut the door. I've took his reg down for her — MV67 HKD.",
      tone: "urgent",
    },
    {
      // Slow-response only. Half the time he rings someone.
      id: "brother",
      atSec: 900,
      delayThresholdSec: 900,
      probability: 0.5,
      text: "He's on his phone now, the BMW lad. I heard him say 'get down here'. I don't know who to. I'm just saying.",
      tone: "urgent",
    },
    {
      // Certain on any attendance past twenty minutes. The road, not the
      // drivers, is the hazard the caller sees first.
      id: "slow-20",
      atSec: 1200,
      delayThresholdSec: 1200,
      text: "Is anybody actually coming? It's been twenty minutes. There's cars going up on the pavement to get round and I've had to pull a kid back off the kerb. Someone is going to get hurt here and it won't be from the crash.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      // The other way it can go. If this commits the fight never happens;
      // it suppresses in one direction only, so there is no hole where
      // neither fires — the fight simply rolls on its own.
      id: "calms",
      atSec: 1500,
      delayThresholdSec: 1500,
      probability: 0.45,
      suppressesIds: ["fight", "regrade"],
      text: "It's calmed down a bit. An older fella's turned up — the lad's dad, I think — and he's got him sat on a garden wall. They're swapping details now, so that's something. Road's still blocked though.",
      tone: "info",
    },
    {
      // Forty minutes, nobody there, and the argument becomes an assault.
      // This is the regrade: the operator who left it now has a Grade 1.
      id: "fight",
      atSec: 2400,
      delayThresholdSec: 2400,
      probability: 0.75,
      text: "He's just shoved her — pushed her back against her car. Her husband turned up a few minutes ago and he's gone for him now, the two of them are on the floor in the road. Get somebody here now.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      // The call handler, not the caller: the grade has changed and the
      // attendance has to change with it. Same convention as scenario 53.
      id: "regrade",
      atSec: 2430,
      requiresFiredIds: ["fight"],
      text: "That is an assault in progress and two men on the floor in a live carriageway — I am regrading this to Grade 1 now. It needs a second unit, and the road is still blocked.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],
};
