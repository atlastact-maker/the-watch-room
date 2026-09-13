import type { Scenario } from "../incident_types";

// Scenario 35 — assault outside licensed premises, Ashton-under-Lyne.
//
// The scene-safety job. There is an injured man on the pavement and the
// people who assaulted him have not gone far, and an ambulance crew who
// arrive first are two more people in the middle of it.
//
// So the sequence matters more than the speed. Police first and the
// ambulance staged nearby — not sent away, staged, because the moment it
// is safe they need to be seconds away rather than minutes. An operator
// who sends the DCA straight in has not saved any time; they have
// created a second incident.
//
// The counterpoint to scenario 30, where police would have driven the
// witness off. Same question — do police go? — with the opposite answer,
// and the difference is whether the danger is to the patient or from him.
//
// FICTIONAL: everyone involved and the premises. Old Street in Ashton is
// real; the bar is not.

export const scenario35: Scenario = {
  id: "35",
  slug: "35_assault_ashton",
  title: "Assault — Old Street, Ashton-under-Lyne",
  type: "ambulance_assault",
  patch: "Eastern",
  severity: "high",
  trigger:
    "Male on the pavement outside licensed premises, head injury, in and out of consciousness. Those responsible still in the area. Door staff with him",

  location: {
    address: "Old Street, Ashton-under-Lyne",
    postcode: "OL6 7SB",
    coords: { lat: 53.4864, lng: -2.0949 },
  },

  property: {
    class: "Town centre street outside licensed premises — patient on the pavement",
    occupants:
      "Busy. Door staff with the patient; a group nearby who are believed to be involved",
    vulnerabilities: [
      "Those responsible are still in the immediate area",
      "Crowd of onlookers, several of whom have been drinking",
      "Head injury with fluctuating consciousness",
    ],
    access:
      "Old Street both ends. A staging point one street back keeps the ambulance close without putting it in the middle",
    knownHazards: [
      "Ongoing risk of violence — the scene is not safe for an unaccompanied crew",
      "Alcohol; crowd; confined street",
    ],
    firstDueStationId: "A-ASH",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — public highway.",
      "Scene is not safe for ambulance until police are in place. Stage, do not stand down.",
      "Repeat location for weekend assaults per the local knowledge file.",
    ],
  },

  methane: {
    M: "No",
    E: "Old Street, Ashton-under-Lyne, OL6 7SB",
    T: "Assault — one casualty with a head injury, offenders still in the area",
    H: "Ongoing violence; crowd; alcohol",
    A: "Old Street both ends. Ambulance staging one street back until police confirm the scene",
    N: "One confirmed. Others may present once the scene is controlled",
    emergencyServices: "Police first; ambulance staged and committed on their word",
  },

  pda: [
    {
      id: "police1",
      label: "Police — first response",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      notes: "First, and before the ambulance. The scene is not safe until they say it is",
    },
    {
      id: "police2",
      label: "Police — second unit",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      notes: "The group nearby, and the crowd. One unit cannot do both",
    },
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-ASH",
      notes:
        "Staged one street back, not stood down. The moment police have it they want to be seconds away",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      {
        metric: "Sequence",
        target: "police committed before the ambulance, not alongside it",
      },
      {
        metric: "Staging",
        target: "ambulance held close rather than stood down — seconds away when it is safe",
      },
      {
        metric: "Head injury",
        target: "fluctuating consciousness treated as time-critical once access is gained",
      },
    ],
    lesson:
      "The opposite answer to the man in the park, and the difference is who the danger is to. Here the threat is still standing there, so a crew who arrive first are two more casualties waiting to happen. Police first, ambulance STAGED — not stood down, staged, one street back — so that the moment the scene is safe they are seconds away rather than minutes. Sending the ambulance straight in saves nothing and can cost you a second incident.",
  },

  scene: {
    viewBox: { x: -60, y: -35, width: 120, height: 70 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -20, y: -26, w: 34, h: 20 }, kind: "target", label: "Licensed premises" },
      { shape: { x: -54, y: -26, w: 30, h: 20 }, kind: "neighbour", label: "Retail units" },
      { shape: { x: 18, y: -26, w: 30, h: 20 }, kind: "neighbour", label: "Retail units" },
    ],
    roads: [
      { shape: { x: -60, y: -4, w: 120, h: 3 }, kind: "pavement" },
      { shape: { x: -60, y: -1, w: 120, h: 11 }, kind: "road", label: "Old Street" },
      { shape: { x: -60, y: 18, w: 40, h: 9 }, kind: "road", label: "Staging — one street back" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -34, y: 4 }, kind: "car" },
      { pos: { x: 24, y: 4 }, kind: "car" },
      { pos: { x: -46, y: 14 }, kind: "lamppost" },
      { pos: { x: 34, y: 14 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "offenders",
        pos: { x: 18, y: -2 },
        kind: "structural",
        label: "Group believed responsible still in the immediate area",
        knownFromPri: true,
      },
      {
        id: "crowd",
        pos: { x: -12, y: -2 },
        kind: "structural",
        label: "Crowd of onlookers, several having been drinking",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-35-male",
        label: "Male, 20s — head injury, consciousness fluctuating",
        pos: { x: -4, y: -3 },
        severity: "critical",
        discoverAfterMinBa: 0,
        clinical: {
          // Bradycardic and hypertensive with a falling GCS — the picture
          // of rising intracranial pressure, not of shock.
          vitals: { rr: 12, spo2: 95, hr: 54, bpSys: 168, bpDia: 96, gcs: 9, temp: 36.5, bm: 5.9 },
          ageYears: 24,
          presumedCondition: "Head injury with fluctuating consciousness — assault",
          redFlags: ["head_injury_severe", "airway_compromise"],
          preferredDestination: "mtc",
          criticalInterventions: ["oxygen", "iv_access", "rsi", "spine_board"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Old Street / patient", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · East end", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Premises frontage", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Staging point", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "door-staff-first",
      atSec: 5,
      text: "Door staff on Old Street. We've a lad on the floor outside — he's taken a bad one to the head. He's opening his eyes then going again. The ones that did it are still stood up the road, they've not gone anywhere.",
      tone: "critical",
    },
    {
      id: "still-there",
      atSec: 45,
      text: "They're still there and they're shouting the odds. There's a crowd building. I'd not want your ambulance crew stood here on their own, if I'm honest.",
      tone: "urgent",
    },
    {
      id: "police-arrive",
      atSec: 200,
      probability: 0.8,
      text: "Police are here. They've moved that lot up the street and it's calmed right down. You can get your ambulance in now.",
      tone: "info",
    },
    {
      id: "worse",
      atSec: 260,
      probability: 0.4,
      text: "He's stopped responding to us altogether now. He's breathing but he's not with us at all.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  // The call as Jason has it: on his own mobile, knelt on the flags outside
  // Sixteen with the lad on his side in front of him, Aaron stood on the
  // door between them and the three up at the kebab shop. He saw every
  // kick. He can still see the three of them.
  call: {
    caller: {
      name: "Jason Kaye",
      phone: "07700 900835",
      relation: "Door supervisor at Sixteen, Old Street — was on the door when it happened",
      where: "The pavement outside Sixteen, Old Street, knelt beside the patient with his colleague on the door",
      line: "mobile",
      state: "calm",
    },
    opening:
      "Police, and an ambulance — Old Street, Ashton, outside Sixteen, the bar. I'm door staff. Three lads have battered one lad on the pavement and kicked him in the head while he was down. He's on the floor and he's going in and out — eyes open, then gone. The three of them are still up the road, they've not gone anywhere.",
    deflection: "Hang on — Aaron, keep them back, keep them THERE — sorry. Go on.",
    reassurance: {
      text: "Jason, you've done everything right. Officers are on their way to you. Keep him on his side and keep talking to me.",
      reply: "Yeah. I'm here. Go on.",
    },
    answers: {
      p_happening: {
        text: "Assault outside the bar — Sixteen, on Old Street. Three lads have set about one lad on the pavement. He's gone down from the first punch and they've kicked him in the head while he was on the floor. It's stopped — they've walked off up the road, but they've only gone as far as the kebab shop. He's on the flags in front of me and he's going in and out. Eyes open, then gone. Eyes open, then gone.",
        tone: "critical",
        effect: { regrade: "GRADE 1", basis: "Violence — one male kicked in the head and losing consciousness, the three responsible still on the same street" },
        followUps: [
          {
            id: "p_happening_kicked",
            text: "Kicked in the head — how many times?",
            answer: {
              text: "Twice that I saw, maybe three. Proper kicks, like a football. Then the one in the grey's stamped on him. I got between them and they backed off — I'm not a small man.",
              tone: "critical",
            },
          },
        ],
      },
      p_ongoing: {
        text: "The hitting's stopped. But they've not gone — they're stood twenty, thirty yards up, outside the kebab shop, and they keep looking back down at us. It's chucking-out time, so there's people everywhere. It's not finished. It's paused.",
        tone: "urgent",
      },
      p_weapons: {
        text: "Nothing I saw. Fists and feet. I looked at their hands when they came past me and they were empty. One of them had a bottle earlier, inside — I took it off him when I put him out and it's in the bin by the door. He's not got it now. They're thirty yards off and it's dark, so I'll not swear to what's in their pockets.",
      },
      p_injured: {
        text: "The lad on the floor — the back of his head, and his face. His head's hit the flags when he went down, then the kicks. There's blood coming out of his left ear, and his nose. He's breathing, but he's not right — he opens his eyes, mumbles, and then he's gone again. Nobody else is hurt. Aaron caught one in the mouth putting them out earlier, that's nothing.",
        tone: "critical",
        followUps: [
          {
            id: "p_injured_breathing",
            text: "Is he breathing normally?",
            answer: {
              text: "He's breathing. It's loud — a bit snory. I've got him on his side so he doesn't choke on it, and I've got a hand on his head keeping it still. I've done the first aid, you have to for the badge.",
              tone: "urgent",
            },
          },
          {
            id: "p_injured_awake",
            text: "When he opens his eyes, does he answer you?",
            answer: {
              text: "Not really. He said 'get off' once. Mostly it's just noise. His eyes roll and then they shut again. That's what's bothering me — I've seen a hundred lads knocked out on this door and they come round and stay round. He keeps going.",
              tone: "critical",
            },
          },
        ],
      },
      p_who: {
        text: "Three lads did it — twenties, all of them. I'd put two of them out of the bar twenty minutes before for hassling a table of girls. The lad on the floor — the girls are calling him Ryan — he's off the same table, I think he'd said something to them on the way out. Then there's me, my colleague Aaron on the door, and forty-odd people stood watching.",
      },
      p_description: {
        text: "The main one, the one that stamped — grey Stone Island jacket, the badge on the arm, dark jeans, shaved head, stocky, five-eight or five-nine. Second one — white T-shirt, tattoos both arms, taller, six foot, dark hair gelled back. Third one's in a black puffer with the hood up, skinnier, younger, I didn't get a proper look at his face. All three white lads, local accents.",
      },
      p_direction: {
        text: "On foot, up Old Street towards Stamford Street — the kebab shop on the corner, they're stood outside it under the light. Thirty yards, if that. Nobody's got in a car. I can see them from here.",
        tone: "urgent",
        followUps: [
          {
            id: "p_direction_now",
            text: "Can you still see them right now?",
            answer: {
              text: "Yeah. All three. Grey jacket's on his phone. If they start walking I'll tell you which way.",
            },
          },
        ],
      },
      p_drink: {
        text: "All of them, yes. They've been on it since teatime by the look of them — that's why I put two of them out. The lad on the floor's had a few as well, but he was walking straight, this isn't the drink. And the one in the grey — his jaw was going, I'd say he's on something. That's a guess.",
      },
      p_known: {
        text: "Not by name. The grey jacket's been in before, I know the face. Aaron scans IDs on the way in, so if they went through the scanner there's a name on our system, and the camera over the door will have all three. I'll check when I've a hand free.",
      },
      p_vulnerable: {
        text: "Him, on the floor — he's the one at risk. He's in and out and he's bleeding from his ear. And there's two girls from that table stood here crying, they're the ones the three of them were bothering, and they've had a drink too. That's it.",
        tone: "urgent",
      },
      p_where: {
        text: "Old Street, Ashton — outside Sixteen, the bar with the red front, about halfway down between the market end and Stamford Street. OL6 7SB. He's on the pavement right outside our door, under the sign.",
      },
      p_safe: {
        text: "I'm alright. It's what I'm for. I'm knelt by him and Aaron's stood on the door between us and them. If they come back down I'll know before you do.",
      },
      p_seen: {
        text: "I saw it. I was on the door — six foot away. I saw the first punch, I saw him go down, and I saw the kicks. So did Aaron. So did the camera over the door.",
      },
      p_details: {
        text: "Jason Kaye — door supervisor at Sixteen, SIA badge, I'll give you the number when you're here. This is my own mobile — 07700 900835.",
      },
    },
    interjections: [
      {
        atSec: 40,
        text: "Oi — OI. Back off. Get behind Aaron. — Sorry. Two of his mates have just come out and they've clocked who did it. Aaron's stood in front of them.",
        tone: "urgent",
      },
      {
        atSec: 95,
        text: "Is anybody coming or what? I've told you what's stood up the road. I've one man on the door and one on the floor.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 140,
        text: "He's just been sick. I've rolled him further onto his side — it's gone all over my knees. He opened his eyes for it and then he's gone again.",
        tone: "critical",
      },
      {
        atSec: 175,
        text: "Sirens — I can hear sirens, from the Stamford Street end by the sound of it. That's you, is it? Tell them the red front, halfway down. I'm in the black coat with the badge on my arm.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Good. Red front, halfway down — I'm in black with the badge on my arm. How long? He needs your ambulance as much as he needs you.",
  },
};
