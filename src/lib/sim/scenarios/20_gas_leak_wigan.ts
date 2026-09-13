import type { Scenario } from "../incident_types";

// Scenario 20 — smell of gas, Wigan.
//
// The lesson is restraint, which nothing else here teaches. The fire
// service cannot fix a gas leak. They can cordon it, evacuate it, stop
// anybody creating an ignition source and stand there — and then they
// wait for the gas emergency service, who are the only people who can
// turn it off.
//
// So sending more pumps achieves nothing at all, and the operator's real
// job on this call is the phone: get the gas emergency number rung, get
// the cordon set, and resist the urge to do something visible. It is the
// opposite instinct to every fire job in the sim.
//
// FICTIONAL: the residents and the house numbers. Ormskirk Road is a real
// Wigan road; the addresses are not.

export const scenario20: Scenario = {
  id: "20",
  slug: "20_gas_leak_wigan",
  title: "Smell of gas — Ormskirk Road, Wigan",
  type: "special_service_gas_leak",
  patch: "Western",
  severity: "moderate",
  trigger:
    "Strong smell of gas in the street outside a terraced row. Several callers. One reports hearing hissing near the pavement",

  location: {
    address: "Outside 62–70 Ormskirk Road, Wigan",
    postcode: "WN5 9ED",
    coords: { lat: 53.5457, lng: -2.6541 },
  },

  property: {
    class: "Terraced residential row — the leak is believed to be in the street, not a property",
    occupants:
      "Row occupied. Elderly resident at no. 66 with restricted mobility per the neighbour",
    vulnerabilities: [
      "Nobody can make this safe except the gas emergency service — the attendance is a cordon and a wait",
      "Elderly resident at no. 66 will not self-evacuate quickly",
    ],
    access: "Ormskirk Road both ends. Terraced row, on-street parking both sides",
    knownHazards: [
      "Any ignition source — doorbells, light switches, a vehicle starting inside the cordon",
      "Gas may be tracking through the ground into cellars rather than dispersing",
    ],
    firstDueStationId: "G54",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — residential street.",
      "Gas emergency service holds the network plans and the isolation points. Nobody else can turn it off.",
      "Cellars in this row per the housing stock — gas tracks into them.",
    ],
  },

  methane: {
    M: "No",
    E: "Outside 62–70 Ormskirk Road, Wigan, WN5 9ED",
    T: "Strong smell of gas in the street; hissing reported at pavement level",
    H: "Any ignition source. Possible tracking into cellars",
    A: "Ormskirk Road from either end; cordon required before crews commit",
    N: "None. Row occupied — elderly resident at no. 66 with restricted mobility",
    emergencyServices: "Fire in attendance; gas emergency service required",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G54",
      notes:
        "One pump. A second achieves nothing — the fire service cannot turn gas off, and the only useful call on this job is to the gas emergency service",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "First attendance", target: "< 10 minutes" },
      {
        metric: "Gas emergency service",
        target: "notified immediately — they are the only people who can stop it",
      },
      {
        metric: "Restraint",
        target: "no make-up: more pumps cannot fix a gas leak",
      },
    ],
    lesson:
      "The only job here where doing more is doing worse. The fire service cordons it, evacuates it, keeps every ignition source away and waits — nobody on that appliance can turn the gas off. Ring the gas emergency service first, set the cordon wide, and resist the urge to send something else so it looks like you are doing something.",
  },

  scene: {
    viewBox: { x: -60, y: -35, width: 120, height: 70 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -50, y: -26, w: 20, h: 24 }, kind: "neighbour", label: "62" },
      { shape: { x: -28, y: -26, w: 20, h: 24 }, kind: "neighbour", label: "64" },
      { shape: { x: -6, y: -26, w: 20, h: 24 }, kind: "target", label: "66 — elderly resident" },
      { shape: { x: 16, y: -26, w: 20, h: 24 }, kind: "neighbour", label: "68" },
      { shape: { x: 38, y: -26, w: 20, h: 24 }, kind: "neighbour", label: "70" },
    ],
    roads: [
      { shape: { x: -60, y: 2, w: 120, h: 2 }, kind: "pavement" },
      { shape: { x: -60, y: 4, w: 120, h: 11 }, kind: "road", label: "Ormskirk Road" },
      { shape: { x: -60, y: 15, w: 120, h: 2 }, kind: "pavement" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.5461, lng: -2.6549 }, street: "Ormskirk Road" }],
    landmarks: [
      { pos: { x: -36, y: 9 }, kind: "car" },
      { pos: { x: 4, y: 9 }, kind: "car" },
      { pos: { x: 30, y: 9 }, kind: "car" },
      { pos: { x: -48, y: 20 }, kind: "lamppost" },
      { pos: { x: 44, y: 20 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "leak-point",
        pos: { x: -2, y: 2 },
        kind: "gas",
        label: "Hissing at pavement level — believed leak point",
        knownFromPri: true,
      },
      {
        id: "ignition",
        pos: { x: 12, y: 8 },
        kind: "electrical",
        label: "Any ignition source — doorbells, switches, a vehicle starting in the cordon",
        knownFromPri: true,
      },
      {
        id: "cellars",
        pos: { x: -6, y: -14 },
        kind: "structural",
        label: "Cellars in this row — gas tracks into them rather than dispersing",
        discoverAfterMinOnScene: 3,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Ormskirk Road frontage", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Towards no. 70", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear entries", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Towards no. 62", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "caller-first",
      atSec: 5,
      text: "There's a really strong smell of gas out on the street here. It's not just me, three or four of us have come out. You can hear it hissing somewhere near the kerb.",
      tone: "urgent",
    },
    {
      id: "no66",
      atSec: 60,
      text: "The lady at 66's still inside — she's ninety-odd and she doesn't move quick. Do you want us to get her out? I don't want to be ringing her doorbell if there's gas about.",
      tone: "urgent",
    },
    {
      id: "gas-board-eta",
      atSec: 190,
      probability: 0.8,
      text: "Somebody's got through to the gas people. They're saying within the hour. It's still hissing and it's if anything worse than it was.",
      tone: "info",
    },
    {
      id: "cellar",
      atSec: 300,
      probability: 0.4,
      text: "The fella at 64 says he can smell it in his cellar now, and he's stood in the street with us. It's got in under the houses.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  // The call as Carol has it: on her mobile on the far pavement with
  // three neighbours and a pram, her own front door open behind her, the
  // hiss coming from the flags outside 66. Nothing to see and nothing to
  // point at. She wants to know who rings the gas people, and she wants
  // somebody to get Mrs Pennington out, and she is scared to press a bell.
  call: {
    caller: {
      name: "Carol Ashcroft",
      phone: "07700 900820",
      relation: "Resident at no. 68",
      where: "Pavement across the road from 66–68 Ormskirk Road, with three or four neighbours",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "Hello — is that the fire brigade? It's Ormskirk Road in Wigan, WN5, outside number 68 — that's me — and 66. There's a smell of gas out in the street, really strong, it's making your eyes water. And there's a hissing coming from the pavement, by the kerb. A few of us have come out. I didn't know who else to ring.",
    deflection: "I don't know, love, I don't know what else to tell you — it's gas, it's in the street, just tell me what we're meant to do!",
    reassurance: {
      text: "Carol, you've done exactly the right thing. A crew is coming, and the gas people are being told. Stay across the road with the others, and just answer what you can.",
      reply: "Right. Okay. Sorry. We're across the road. Go on.",
    },
    answers: {
      f_seen: {
        text: "There's nothing to see — that's what's odd. No smoke, no flames, nothing. It's the smell. Gas, like when you've left the hob on, only out in the road, and it's strong, it catches the back of your throat. And there's a hissing. You can hear it — a hiss, like a tyre going down, coming from the pavement by the kerb outside 66. It's loudest there.",
        tone: "urgent",
        followUps: [
          {
            id: "f_seen_hiss",
            text: "Where exactly is the hissing coming from — a grid, a cover, the ground?",
            answer: {
              text: "The pavement, I think — there's one of them little metal covers in the flags outside 66, the square one, and it's loudest round there. I've not gone right up to it. I don't want to.",
            },
          },
        ],
      },
      f_where: {
        text: "It's not in a house, I don't think. It's outside — in the street, the pavement. It's strongest outside 66 and mine, 68, and it fades off a bit by the time you get down to 62. But you can smell it right along.",
      },
      f_spread: {
        text: "It's hanging about. There's no wind to shift it, it's a still night. It's not got any less since I came out, I'll tell you that.",
      },
      f_started: {
        text: "I noticed it when I went to put the bin out — twenty minutes ago, maybe. Sandra at 70 said she'd smelt it when she got in from work, so an hour, could be. We thought it was somebody's boiler at first.",
      },
      f_building: {
        text: "It's houses. A terrace — a row of old terraces, brick, two up two down, front doors straight onto the pavement. They've all got cellars, these, under the front rooms.",
      },
      f_inside: {
        text: "Most of us are out — there's four of us stood here. Mrs Pennington at 66 is still in. She's ninety-two, she's got a frame, she doesn't come to the door quick and she's deaf. Her lights are on. And I don't know about 62, the young couple — their car's not there so I think they're at work.",
        tone: "urgent",
        followUps: [
          {
            id: "f_inside_alone",
            text: "Is Mrs Pennington on her own in there?",
            answer: {
              text: "On her own, yes. Her daughter comes Tuesdays and Fridays. She's got one of them pendant alarms round her neck but she'll not press it for this, she'd not know anything was wrong.",
            },
          },
          {
            id: "f_inside_others",
            text: "Anyone else still inside along the row?",
            answer: {
              text: "Sandra's out with the baby, him at 64's out here, I'm out. 62's at work, I think — I've knocked and there's nothing. So it's just her. Just Mrs Pennington.",
            },
          },
        ],
      },
      f_hurt: {
        text: "Nobody's hurt. A couple of us feel a bit sick with it, headachy, but that's the smell. Nobody's collapsed or anything.",
      },
      f_vulnerable: {
        text: "Mrs Pennington at 66 — ninety-two, frame, deaf as a post, she'll not get herself out. And there's a baby at 70, but Sandra's got him out here with us, he's in his pram.",
      },
      f_hazards: {
        text: "Well, it's gas, isn't it — that's the hazard. There's cars parked all along, both sides. Somebody had their engine running to move theirs and I made them turn it off — I didn't know if that was right. Nobody's smoking, I've made sure. The street lights are on, I can't do anything about them.",
        tone: "urgent",
        followUps: [
          {
            id: "f_hazards_switches",
            text: "Has anyone gone back into the houses — turned anything on or off?",
            answer: {
              text: "Him at 64 went in for his coat and I shouted at him. He didn't touch anything, he says. All the lights that were on are still on — I didn't know whether to turn ours off or leave it. I've left it.",
            },
          },
        ],
      },
      f_danger: {
        text: "Nothing like that, love. Nobody's being funny. It's just — it's gas, and there's cars, and there's a bus route down here. I don't know what I'm meant to do if a bus comes.",
      },
      f_access: {
        text: "Ormskirk Road — it's a through road, you can come from either end. Cars both sides, always, but there's room down the middle. Number 66's about halfway along the row. There's a lamppost outside 62 and one outside 70, we're in between.",
      },
      f_safe: {
        text: "We're across the road, on the other pavement, all of us. Is that far enough? Should we go further? I'll move everybody if you say.",
      },
      f_stay: {
        text: "Yes. I'm not going back in the house, that's for certain. I'll stay on.",
      },
      f_details: {
        text: "Carol Ashcroft. I'm at 68. It's my mobile — 07700 900820.",
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "Are you ringing the gas people, or is that us? Sandra's looking the number up on her phone. I don't know who does what with this.",
        tone: "urgent",
      },
      {
        atSec: 100,
        text: "Is anybody coming out to us? Only there's a bus due — it comes down here every twenty minutes and it's about now. I don't want it driving through it.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 150,
        text: "Mrs Pennington's light's just gone off in the front — I think she's gone up to bed. She's no idea, bless her. Her window's right over where it's hissing.",
        tone: "urgent",
      },
      {
        atSec: 215,
        text: "There's a fire engine — I can see the blue lights at the top of the road. Tell them not to come right up to it — it's outside 66, tell them to stop at the end.",
        tone: "urgent",
        requiresOpened: true,
      },
    ],
    onDispatch: "Oh, thank you. Tell them it's hissing outside 66, by the kerb, and tell them about Mrs Pennington. We'll stay over here.",
  },
};
