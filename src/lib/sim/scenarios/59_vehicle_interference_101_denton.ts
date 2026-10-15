import type { Scenario } from "../incident_types";

// Scenario 59 — vehicle interference in progress, reported on 101,
// Egerton Street, Denton. The 999 call on the wrong line.
//
// Bernadette Kyle is sixty-seven and she is at her bedroom window with
// the light off, watching a lad in a hooded top work his way down the
// parked cars on her street trying door handles. He has just got into
// the grey Astra two doors down; she can see the interior light. She
// has rung 101 because "nobody's being hurt, are they", and she did not
// want to be one of those people who waste 999's time.
//
// The grade is in the answer to one question. A report of someone
// trying car doors, with no confirmation they are still there, is a
// Grade 2 Priority — an hour. "Is the person responsible still there?"
// — "Yes, he's in the car now, I'm looking at him" — is a crime in
// progress with the offender present, and that is Grade 1 Immediate
// whichever number rang. The sim regrades on that answer and the clock
// drops from sixty minutes to fifteen.
//
// Then it is tactics. Two cars, one from each end of the street, no
// lights or sirens on the approach: a man with his head in a glovebox
// hears a siren and is through the ginnel to Stockport Road before
// anybody is out of a seat. The caller is told to stay back from the
// window and keep describing him.
//
// FICTIONAL: Bernadette, the car owners, the suspect and every house
// number. Egerton Street, Denton, is real. MP-TAM is Tameside's police
// station.

export const scenario59: Scenario = {
  id: "59",
  slug: "59_vehicle_interference_101_denton",
  title: "Vehicle interference in progress on 101 — Egerton Street, Denton",
  type: "police_vehicle_interference",
  patch: "Eastern",
  severity: "moderate",
  trigger:
    "101 — caller watching a male in a dark hooded top trying car door handles along Egerton Street, Denton, at ten to midnight. He has just got into a grey Vauxhall Astra two doors down. Still there as the call is answered. Caller 'didn't want to bother 999'",

  location: {
    address: "Egerton Street, Denton",
    postcode: "M34 3PH",
    coords: { lat: 53.4545, lng: -2.114 },
  },

  property: {
    class: "Terraced street — on-street parking both sides",
    occupants: "Caller at her upstairs window at no. 9; the offender in the street; the car owners in bed",
    vulnerabilities: ["None at risk — the caller is indoors and the offender has not seen her"],
    access: "Egerton Street runs between Hyde Road and Stockport Road; the offender is at the Stockport Road end, outside no. 13",
    knownHazards: ["Unknown male — nothing seen in his hands"],
    firstDueStationId: "MP-TAM",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — residential street.",
      "Theft from motor vehicle series on the Denton West beat since September: nine offences, satnavs, bags and cash from unlocked or forced cars between midnight and four, one suspect description — slim male, dark hooded top, on foot. Nobody arrested.",
      "A 101 call about a crime happening now is a 999 call on the wrong line. The grade follows the answer to 'is he still there' — present and in progress is Grade 1 Immediate, whichever number rang.",
      "Approach: two cars, one from each end of the street, no lights or sirens on the approach — he hears a siren and he is through the ginnel to Stockport Road before anybody is out of a car.",
    ],
  },

  methane: {
    M: "No",
    E: "Egerton Street, Denton, M34 3PH — outside no. 13, Stockport Road end",
    T: "Vehicle interference in progress — male in a grey Astra, trying other cars. 101 report, in progress",
    H: "Unknown male, nothing seen in his hands. Caller indoors and unseen",
    A: "Egerton Street from Hyde Road (north) or Stockport Road (south); the ginnel beside no. 17 runs to Stockport Road",
    N: "None injured — the caller is indoors; the car owners are in bed",
    emergencyServices: "Police — two cars, silent approach from both ends",
  },

  pda: [
    {
      id: "police1",
      label: "Police — first car, Stockport Road end",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      preferredStationId: "MP-TAM",
      notes:
        "First car — in from the Stockport Road end, no lights or sirens on the approach. He is in a car with the interior light on and his back to the road: a quiet arrival takes him in it",
    },
    {
      id: "police2",
      label: "Police — second car, Hyde Road end",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      preferredStationId: "MP-TAM",
      notes:
        "Second car — the Hyde Road end. He runs from the first car; the second one is where he runs to. A single car is a foot chase through the ginnels",
    },
  ],

  evaluation: {
    targets: [
      {
        metric: "Grading",
        target: "regraded Grade 1 Immediate on the answer that he is still there — not left as a Grade 2 because it came in on 101",
      },
      { metric: "Time-to-mobilise", target: "< 90 seconds from the regrade" },
      {
        metric: "Approach",
        target: "two cars, both ends of the street, silent approach — the caller told to stay back from the window",
      },
      {
        metric: "Caller",
        target: "kept on the line and describing him until the first car is on the street",
      },
    ],
    lesson:
      "She rang 101 because nobody was being hurt, and if the desk takes the call at the line's valuation it is a Grade 2 — an hour — for a man who will be gone in ten minutes with three cars' worth of other people's property. The 101 bank opens with what and when, and the question that matters is the fourth one: is the person responsible still there? 'Yes, he's in the car now' is a crime in progress with the offender present, and that is Grade 1 on any line in the country. Move the grade the moment you hear it and the clock drops from sixty minutes to fifteen. Then think about how he gets caught rather than how fast somebody gets there: two cars, one each end, no sirens on the way in, and a caller kept at her window with the light off telling you which way he moves. The lesson is not that 101 callers under-report. It is that the grade lives in the answers, not in the number they dialled.",
  },

  callGrade: {
    scale: "police_thrive",
    grade: 2,
    standardMinutes: 60,
    basis:
      "A 101 report of someone trying car doors reads as a Grade 2 Priority on GMP's ladder (GMP FOI 01/FOI/24/012708/K, 28 Jun 2024) — attendance within 60 minutes — until the caller says he is still there. Present and in progress is Grade 1 Immediate, 15 minutes, and the sim moves the grade on that answer; the line it arrived on does not set the grade",
  },

  channel: "101",

  // Egerton Street drawn running north–south: Hyde Road end at the top,
  // Stockport Road end at the bottom. The caller's no. 9 is on the west
  // side; the Astra is two doors south of her.
  scene: {
    viewBox: { x: -30, y: -40, width: 60, height: 80 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -30, y: -40, w: 24, h: 34 }, kind: "neighbour", label: "Terrace (west side, nos. 1–7)" },
      { shape: { x: -30, y: -6, w: 24, h: 6 }, kind: "target", label: "No. 9 — caller, upstairs front window" },
      { shape: { x: -30, y: 0, w: 24, h: 40 }, kind: "neighbour", label: "Terrace (west side, nos. 11–23)" },
      { shape: { x: 6, y: -40, w: 24, h: 80 }, kind: "neighbour", label: "Terrace (east side, evens)" },
    ],
    roads: [
      { shape: { x: -6, y: -40, w: 2, h: 80 }, kind: "pavement" },
      { shape: { x: -4, y: -40, w: 8, h: 80 }, kind: "road", label: "Egerton Street" },
      { shape: { x: 4, y: -40, w: 2, h: 80 }, kind: "pavement" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -2, y: -24 }, kind: "car" },
      { pos: { x: -2, y: -12 }, kind: "car" },
      { pos: { x: -2, y: 14 }, kind: "car", label: "Grey Astra — no. 13, offender inside" },
      { pos: { x: -2, y: 22 }, kind: "car", label: "White van — no. 15" },
      { pos: { x: 2, y: -2 }, kind: "car" },
      { pos: { x: 2, y: 28 }, kind: "car" },
      { pos: { x: -6, y: 30 }, kind: "other", label: "Ginnel to Stockport Road, beside no. 17" },
      { pos: { x: -5, y: -16 }, kind: "lamppost" },
      { pos: { x: 5, y: 14 }, kind: "lamppost" },
    ],
    hazards: [],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Stockport Road end", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · East side (evens)", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Hyde Road end", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · West side (odds)", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "watching",
      atSec: 5,
      text: "He's in the grey Astra outside 13. I can see the inside light on and him going through the glovebox. Hood up. He's not looked up once.",
      tone: "urgent",
    },
    {
      id: "out",
      atSec: 60,
      text: "He's out of the Astra — shut the door dead quiet. He's trying the white van next to it now. He's got something under his arm, like a satnav.",
      tone: "urgent",
    },
    {
      id: "run",
      atSec: 150,
      probability: 0.4,
      suppressesIds: ["stays"],
      text: "He's seen something — he's looked up the road and he's off. Down the ginnel by 17, towards Stockport Road, running. He's got a bag.",
      tone: "urgent",
    },
    {
      id: "stays",
      atSec: 150,
      suppressesIds: ["run"],
      text: "He's still at it. He's in the van now — he's got the side door open. He's taking his time, he thinks nobody's up.",
      tone: "urgent",
    },
    {
      id: "slow-response",
      atSec: 300,
      delayThresholdSec: 600,
      text: "He's walked off towards the Stockport Road lights with a bag over his shoulder. You've missed him. There's three cars on this street he's been in.",
      tone: "urgent",
    },
  ],

  // The call as Bernadette has it: upstairs, light off, an inch of
  // curtain, her mobile pressed to her ear and her voice down to a
  // whisper although he is forty yards away and in a car. She has rung
  // the number she thought was polite.
  call: {
    caller: {
      name: "Bernadette Kyle",
      phone: "07700 900662",
      relation: "Resident at no. 9 — watching from her front bedroom window",
      where: "Upstairs front bedroom, 9 Egerton Street, lights off, curtain pulled back an inch",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "Hello, I hope this is the right number — I didn't want to ring 999 for it. There's a lad on our street going along the cars trying the door handles. He's just got into the grey Astra two doors down, I can see the light on inside it. I'm watching him from my bedroom. Egerton Street in Denton.",
    answers: {
      n_report: {
        text: "Somebody breaking into cars. A lad — a man, young — in a dark hoodie with the hood up. He's been down the street trying every door handle, and he's got into the grey Astra outside number 13. He's in it now. I can see the inside light on and him moving about in it.",
        tone: "urgent",
      },
      n_when: {
        text: "Now. Right now, as I'm talking to you. I first saw him about five minutes ago at the top end, and he's worked his way down. He's in the Astra this minute.",
        tone: "urgent",
      },
      n_where: {
        text: "Egerton Street, Denton. The Stockport Road end — the Astra's outside number 13, that's on my side, two doors down from me. I'm at number 9. M34 3PH.",
      },
      n_suspect: {
        text: "Yes! He's still there — he's in the car now. I'm looking at him. He's got the glovebox open, I can see him going through it. I don't know who he is. I've never seen him before.",
        tone: "urgent",
        effect: {
          regrade: "GRADE 1",
          basis: "Offender present and in the vehicle now — a crime in progress, whichever line it came in on",
        },
        followUps: [
          {
            id: "n_suspect_seen_you",
            text: "Has he seen you — does he know anyone's watching?",
            answer: {
              text: "No. I've got the light off and I'm behind the curtain. He's not looked up once. He's not bothered, he's taking his time.",
            },
          },
        ],
      },
      n_risk: {
        text: "No, nobody's hurt. Everyone's in bed, it's nearly midnight. It's just him and the cars. I'm indoors with the door locked.",
      },
      n_vulnerable: {
        text: "No. No kids out, nobody about. Just me watching and him down there. I'm sixty-seven but I'm fine, I'm indoors.",
      },
      n_loss: {
        text: "I don't know yet. He's in the Astra. He tried the white van next to it and the two cars up from me before that, I think they were locked. The Astra must've been open or he's forced it — I didn't hear glass.",
      },
      n_evidence: {
        text: "There's no cameras on our row that I know of. Number 14 across has one of them doorbells, that might catch him. I'm your witness — I'm watching him do it.",
      },
      n_previous: {
        text: "There's been a few on the Facebook page — cars gone through, satnavs taken, up and down Denton West. A lady on Oldham Street had hers done last week. I've never seen anyone at it before, though.",
      },
      n_description: {
        text: "Slim. Young — the way he moves. Dark hoodie, hood up, dark jogging bottoms, white trainers that catch the light. He came down from the Hyde Road end on foot. He's got a bag over his shoulder, a little one, cross-body.",
        followUps: [
          {
            id: "n_description_face",
            text: "Can you see his face at all?",
            answer: {
              text: "No. The hood's right up and he's got his back to me, mostly. If he turns round I'll tell you.",
            },
          },
        ],
      },
      n_wants: {
        text: "I want somebody to come and catch him! He's in somebody's car right now. I didn't ring 999 because — well, nobody's being hurt, are they? But he's doing it right now.",
        tone: "urgent",
      },
      n_available: {
        text: "I'm here all night, love. I'm not going anywhere. Ring me on this, I'll be stood at this window.",
      },
      n_details: {
        text: "Bernadette Kyle. Mrs. 9 Egerton Street, Denton, M34 3PH. This is my mobile — 07700 900662.",
      },
    },
    interjections: [
      {
        atSec: 40,
        text: "He's got the glovebox open — I can see the light. He's pulling stuff out.",
        tone: "urgent",
      },
      {
        atSec: 100,
        text: "Should I have rung 999? I didn't want to be one of them that wastes your time. Is somebody coming?",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 170,
        text: "He's out — he's shut the door quiet and he's trying the white van now. He's got something under his arm. I've turned my light off so he can't see me.",
      },
      {
        atSec: 240,
        text: "I can hear a car — is that them? Tell them he's at the Stockport Road end, by the van. No sirens, he'll run.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Thank you. Oh, thank you. I'll stay here. Tell them not to put the sirens on, he'll be off like a shot.",
    preArrival: [
      {
        id: "back",
        key: true,
        text: "Stay inside, keep your light off and stay back from the window — don't let him see you.",
        reply: "I'm behind the curtain. He can't see me.",
      },
      {
        id: "noout",
        text: "Don't go out and don't shout at him. Let the officers do it.",
        reply: "I wasn't going to. I'm sixty-seven.",
      },
      {
        id: "watch",
        text: "Keep watching him for me if you can do it safely, and tell me the second he moves — which way, and what he's carrying.",
        reply: "He's still at the van. I'll tell you.",
      },
      {
        id: "officers",
        text: "When the officers arrive, stay inside. They'll knock for you when they want you.",
        reply: "Right.",
      },
    ],
  },
};
