import type { Scenario } from "../incident_types";

// Scenario 58 — criminal damage reported on 101, Ladythorn Road,
// Bramhall. The crime that never sees a car.
//
// Stuart Penketh came out at eight to go to work and found his car's
// wing mirror hanging by its wire and a key scratch down the passenger
// side, and the neighbour's fence panel booted through between the two
// drives. His doorbell camera has a hooded figure at fourteen minutes
// past two. He is not expecting anybody to come out. He wants a crime
// number for the insurance, and he would like to think somebody will
// look at the footage.
//
// That is exactly what he gets. A crime found at breakfast with the
// offender six hours gone, nobody hurt, nobody at risk and the only
// evidence a doorbell clip is GMP's Central Resolution: recorded, a
// reference issued, the clip requested and secured, the investigation
// run from the desk. Sending a car to look at a wing mirror takes a
// Grade 2 off the road for an hour and achieves nothing the desk cannot.
//
// The call is the 101 bank — what, when, where, who; damage, evidence,
// previous, what the caller wants and when he is about. The desk work
// that matters is the footage: keep it, do not post it, this is how it
// reaches the investigator.
//
// The informant script exists for the operator who sends a car anyway.
// Roughly one run in eight it rewards them: the hooded figure is back
// on the road in daylight looking in cars, and the same job is a Grade
// 1 for the length of time it takes him to see a police car.
//
// FICTIONAL: the Penkethes, the neighbour, both house numbers and the
// footage. Ladythorn Road, Bramhall, is real. MP-STK is Stockport's
// police station.

export const scenario58: Scenario = {
  id: "58",
  slug: "58_criminal_damage_101_bramhall",
  title: "Criminal damage report on 101 — Ladythorn Road, Bramhall",
  type: "police_criminal_damage_report",
  patch: "Southern",
  severity: "low",
  trigger:
    "101 — criminal damage overnight to a car on a driveway, Ladythorn Road, Bramhall: wing mirror smashed and a scratch keyed along the side; the neighbour's fence panel kicked through. Found at 8 am. Nobody seen; doorbell camera has a hooded figure at 02:14. Caller wants a crime number for the insurance",

  location: {
    address: "27 Ladythorn Road, Bramhall, Stockport",
    postcode: "SK7 2HA",
    coords: { lat: 53.3623, lng: -2.1572 },
  },

  property: {
    class: "Detached house with a driveway — residential road",
    occupants: "The caller and his wife; nobody involved is present",
    vulnerabilities: ["None — nobody hurt, nobody threatened, no repeat-victim markers on the address"],
    access: "Driveway off Ladythorn Road; the caller is at home all day",
    knownHazards: ["None"],
    firstDueStationId: "MP-STK",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "Nothing on the address. One other criminal damage report on Ladythorn Road this year — a wing mirror, March, undetected.",
      "GMP Central Resolution: a crime with no suspect present, no ongoing risk and no vulnerability is recorded, given a crime reference and investigated from the desk — footage requested, lines of enquiry logged — without an officer attending. The caller is told what happens next and when he will hear.",
      "Doorbell footage is the only evidence here. Secure it on the call: ask him to keep it, not to share it on social media, and tell him how it reaches the investigator.",
    ],
  },

  methane: {
    M: "No",
    E: "27 Ladythorn Road, Bramhall, SK7 2HA — driveway",
    T: "Criminal damage to a vehicle and a fence, overnight, reported next morning. 101 report",
    H: "None",
    A: "Driveway off Ladythorn Road; caller at home",
    N: "None — nobody hurt, nobody present but the caller",
    emergencyServices: "None deployed. Crime recorded at the desk; footage requested",
  },

  // One slot, held. A crime found at breakfast is nobody's blue light.
  pda: [
    {
      id: "police1",
      label: "Police — response (held, not sent)",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      preferredStationId: "MP-STK",
      notes:
        "Not for this report. Held only for the picture changing — the offender back on the road and in view, or a neighbour reporting someone in a car now. Then it is an in-progress crime and a car goes; a wing mirror found at breakfast does not",
    },
  ],

  evaluation: {
    targets: [
      {
        metric: "Disposal",
        target: "closed at the desk — crime recorded, no attendance",
      },
      {
        metric: "Crime recording",
        target: "a crime reference given on the call — the caller leaves knowing his number and what happens next",
      },
      {
        metric: "Evidence",
        target: "doorbell footage secured — kept, not posted, and how it reaches the investigator explained",
      },
      {
        metric: "Change of picture",
        target: "if the offender comes back into view: regraded Grade 1 and a car mobilised within 90 seconds",
      },
    ],
    lesson:
      "Most of what comes in on 101 is this: a crime that has already happened, to property, with nobody hurt and nobody there. The temptation is to treat a victim's call as a request for a visit, and he is not even making one — he wants a crime number and some sign that somebody will look at the clip. Central Resolution gives him both without a car. The desk work is not nothing: the crime is recorded properly, the reference read back, the footage secured before it goes on Facebook and becomes useless, the neighbour's damage linked to the same report, and the caller told when he will hear and from whom. Do that and he hangs up a satisfied victim; send a car and you have spent a Grade 2 unit on a wing mirror while a real Grade 2 waits. One run in eight the hooded figure walks back down the road in daylight, and the whole thing becomes a Grade 1 for as long as he stays in sight — which is the only moment this job ever needed a blue light.",
  },

  callGrade: {
    scale: "police_thrive",
    grade: "C",
    standardMinutes: null,
    basis:
      "Grade C Central Resolution on GMP's ladder (GMP FOI 01/FOI/24/012708/K, 28 Jun 2024): a report assessed as low risk on THRIVE — no threat, no harm continuing, no vulnerability, offender gone — is resolved by the Crime Recording and Resolution Unit without an officer attending. The FOI attaches no attendance time to Grade C, so standardMinutes is null",
  },

  channel: "101",

  disposal: {
    noDeployment: true,
    outcome: "crime_recorded",
    basis:
      "A crime found at breakfast with the offender long gone, nobody hurt, nobody at risk and the only evidence a doorbell clip is a desk-based investigation under GMP's Central Resolution: the crime is recorded, a reference issued for the insurer, the footage requested and the caller told when he will hear — and no car is sent to look at a wing mirror",
  },

  scene: {
    viewBox: { x: -40, y: -30, width: 80, height: 50 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -10, y: -24, w: 20, h: 14 }, kind: "target", label: "No. 27" },
      { shape: { x: -34, y: -24, w: 20, h: 14 }, kind: "neighbour", label: "No. 25" },
      { shape: { x: 14, y: -24, w: 20, h: 14 }, kind: "neighbour", label: "No. 29" },
    ],
    roads: [
      { shape: { x: -4, y: -10, w: 8, h: 10 }, kind: "driveway", label: "Drive" },
      { shape: { x: -40, y: -10, w: 36, h: 10 }, kind: "garden", label: "Front gardens" },
      { shape: { x: 4, y: -10, w: 36, h: 10 }, kind: "garden" },
      { shape: { x: -40, y: 0, w: 80, h: 2 }, kind: "pavement" },
      { shape: { x: -40, y: 2, w: 80, h: 7 }, kind: "road", label: "Ladythorn Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: 0, y: -5 }, kind: "car", label: "Caller's car — mirror off, keyed" },
      { pos: { x: -13, y: -6 }, kind: "other", label: "Fence panel — kicked through" },
      { pos: { x: 20, y: 1 }, kind: "lamppost" },
    ],
    hazards: [],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Ladythorn Road / drive", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 29 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear garden", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 25 side / fence", face: "left", bearingDeg: 270 },
    ],
  },

  // For the operator who sends a car. Mostly it confirms there was
  // nothing to send one for; one run in eight the figure comes back.
  informantScript: [
    {
      id: "caller-first",
      atSec: 5,
      text: "It's the Octavia on my drive — mirror's hanging off and it's keyed all down the passenger side. And they've put next door's fence panel through. Overnight. I've got it on the doorbell.",
      tone: "info",
    },
    {
      id: "footage",
      atSec: 60,
      text: "I've looked at the doorbell clip again. 02:14 — hood up, dark clothes, comes up the drive from the top of the road, you hear the bang, and they're gone the same way in about fifteen seconds. You can't see a face.",
      tone: "info",
    },
    {
      id: "neighbour",
      atSec: 120,
      probability: 0.5,
      text: "The lady at 31's just come down — hers has been done as well. Both wing mirrors. So that's three of us on the road.",
      tone: "info",
    },
    {
      id: "suspect-back",
      atSec: 240,
      probability: 0.12,
      suppressesIds: ["quiet"],
      text: "Hang on — he's back. I'm sure it's him. Same hoodie, hood up, walking down the road from the top looking in cars. He's on number 23's drive now, looking through the window of their Golf.",
      tone: "urgent",
      effect: {
        regrade: "GRADE 1",
        basis: "Offender back on the road and in view, trying vehicles — in progress",
        pulseCritical: true,
      },
    },
    {
      id: "slow-response",
      atSec: 480,
      delayThresholdSec: 900,
      requiresFiredIds: ["suspect-back"],
      text: "He's gone. Walked off towards Bramhall Lane, not in a hurry. You've missed him. I've got him on the doorbell again, at least, in daylight this time.",
      tone: "urgent",
    },
    {
      id: "quiet",
      atSec: 300,
      suppressesIds: ["suspect-back"],
      text: "Nothing more to report, really. It's the car and the fence. I'll send the clip wherever you want it and I'll let Brian know you've logged his panel on the same report.",
      tone: "info",
    },
  ],

  // The call as Stuart has it: on his drive in his work shoes, phone in
  // one hand, the wing mirror in the other, already late. He knows what
  // 101 is for and he is using it correctly.
  call: {
    caller: {
      name: "Stuart Penketh",
      phone: "07700 900651",
      relation: "The owner of the damaged car — lives at the address",
      where: "His driveway at 27 Ladythorn Road, Bramhall, looking at the car",
      line: "mobile",
      state: "calm",
    },
    opening:
      "Morning. I want to report some damage to my car — somebody's had a go at it overnight on my drive. Wing mirror's hanging off and there's a scratch keyed right down the passenger side. And they've put the neighbour's fence panel through while they were at it. I'm not expecting anybody to come out, to be honest. I need a crime number for the insurance.",
    answers: {
      n_report: {
        text: "Criminal damage. My car — a blue Skoda Octavia, on my own drive — the driver's wing mirror's been kicked or smashed off, it's hanging by the wire, and there's a scratch along the whole passenger side like a key. And next door's fence panel between our drives has been booted through. All overnight.",
        followUps: [
          {
            id: "n_report_else",
            text: "Anything taken from the car, or any attempt to get into it?",
            answer: {
              text: "No. It's locked, nothing's been forced, nothing's gone. It's just damage. Mindless, really.",
            },
          },
        ],
      },
      n_when: {
        text: "Overnight. It was fine when I put the bins out at half ten last night. I found it at eight this morning when I went to go to work. The doorbell camera's got somebody at fourteen minutes past two, so I'd say then.",
      },
      n_where: {
        text: "27 Ladythorn Road, Bramhall. SK7 2HA. On my own driveway, right at the front of the house. The fence is the one between us and number 25.",
      },
      n_suspect: {
        text: "Long gone. There's a figure on the doorbell footage at 02:14 — hood up, dark clothes, you can't see a face — walks up the drive, you hear a bang, and they're gone in about fifteen seconds. I don't know who it is. No idea. I've not fallen out with anybody.",
        followUps: [
          {
            id: "n_suspect_clip",
            text: "What can you make out on the clip — height, build, which way they went?",
            answer: {
              text: "Average height, slim, maybe young from how they move. Dark hoodie, dark bottoms, trainers. They came from the right — the top of the road — and went back the same way. That's all you get, it's grainy.",
            },
          },
        ],
      },
      n_risk: {
        text: "No. Nobody's hurt. We slept through it. There's nobody here but me and the wife, and she's gone to work. It's not that sort of thing — it's a wing mirror.",
      },
      n_vulnerable: {
        text: "No. It's just us two, we're in our fifties, there's no kids here. The neighbours at 25 are an older couple but they've not even noticed the fence yet, I'll knock on in a minute.",
      },
      n_loss: {
        text: "The mirror's hanging off — that's a couple of hundred quid on an Octavia. The scratch is the whole passenger side, both doors and the rear quarter, so that's a paint job. Call it eight hundred, a grand? And one fence panel, about forty quid, which I'll just sort for them.",
      },
      n_evidence: {
        text: "Yes — the doorbell camera. I've got the clip saved, 02:14. You can't see a face but you can see them do it. I've not put it on Facebook or anything. I'll send it to you however you want it.",
        followUps: [
          {
            id: "n_evidence_keep",
            text: "Can you keep that clip and not share it anywhere until an officer has it?",
            answer: {
              text: "Yes, of course. It's in the app, I'll download it as well. Just tell me where it goes.",
            },
          },
        ],
      },
      n_previous: {
        text: "Not to us. Somebody up the road had a mirror done in the spring, I think — there was a post about it on the residents' page. Nothing since. First time for us.",
      },
      n_description: {
        text: "From the clip — hood up, dark hoodie, dark trousers, white trainers. Slim. Moves like a young lad, but I'm guessing. Came from the top of the road and went back that way, towards Bramhall Lane. On foot.",
      },
      n_wants: {
        text: "A crime number, honestly. For the insurance. I'm not expecting a car — I'm not daft, I know you've got better things to do than look at my wing mirror. I'd like to know somebody's going to look at the footage, though. In case it's happening up and down the road.",
      },
      n_available: {
        text: "I work from home Tuesdays and Fridays, otherwise evenings after six. Any of those. Or ring me, this number's fine.",
      },
      n_details: {
        text: "Stuart Penketh. P-E-N-K-E-T-H. 27 Ladythorn Road, Bramhall, SK7 2HA. This is my mobile, 07700 900651.",
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "Hang on — the wife's just texted. She's asking if I've rung you yet. Yes, Lorraine. I'm on with them now.",
      },
      {
        atSec: 120,
        text: "I know how it works, you've not got the officers. I'm not asking for one. I just want it logged properly, with the footage, so if it's a pattern somebody can see it.",
        requiresOpened: false,
      },
      {
        atSec: 200,
        text: "The neighbour's just come out — Brian, from 25. He's seen the fence. He's not happy. He says their motion light came on about two but he thought it was a cat.",
      },
      {
        atSec: 290,
        text: "They're sending somebody? Oh. Right. Well — I'm here. I'll not touch anything.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Oh — right. I wasn't expecting that. Okay. I'll be on the drive.",
  },
};
