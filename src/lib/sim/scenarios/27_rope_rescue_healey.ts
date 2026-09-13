import type { Scenario } from "../incident_types";

// Scenario 27 — walker fallen down a quarry face, Healey Dell.
//
// A specialist rescue where the specialist resource is a long way away and
// the ordinary resources cannot substitute for it. Three pumps standing at
// the top of a quarry are three pumps standing at the top of a quarry —
// what this needs is a line rescue team, and the operator's decision is to
// order that immediately rather than after the first crew confirms what
// the caller already told them.
//
// The second problem is finding him. "Healey Dell" is several square
// kilometres of wooded clough with three access points, and picking the
// wrong one costs twenty minutes on foot. The caller can see him but
// cannot describe where they are.
//
// FICTIONAL: the walker and his friend. Healey Dell is a real nature
// reserve above Rochdale; the incident is not.

export const scenario27: Scenario = {
  id: "27",
  slug: "27_rope_rescue_healey",
  title: "Rescue from height — Healey Dell, Rochdale",
  type: "special_service_rope_rescue",
  patch: "Eastern",
  severity: "high",
  trigger:
    "Male fallen approximately 12 metres down a disused quarry face. Conscious, friend at the top with him. Access on foot only",

  location: {
    address: "Disused quarry face, Healey Dell nature reserve, Rochdale",
    postcode: "OL12 6BG",
    coords: { lat: 53.6501, lng: -2.1798 },
  },

  property: {
    class: "Wooded clough and disused quarry — nature reserve, no vehicular access to the face",
    occupants: "Two walkers. One fallen, one at the top",
    vulnerabilities: [
      "Casualty is on a ledge with a further drop below him",
      "Access on foot only — the nearest an appliance gets is the reserve car park, then roughly 800 m of path",
      "Light is going and the clough is under tree cover",
    ],
    access:
      "Three ways into the reserve and only one of them is right. Nearest vehicle point is the Broadley car park, then on foot",
    knownHazards: [
      "Loose quarry face above and below the casualty",
      "Further drop beneath the ledge he is on",
      "Steep, wet, wooded ground for the carry out",
    ],
    firstDueStationId: "G30",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — open ground.",
      "Line rescue is a specialist resource and is not on any pump. Ordering it late is the whole failure mode of this incident.",
      "Three access points to the reserve; the Broadley car park is the right one for the quarry face.",
    ],
  },

  methane: {
    M: "No",
    E: "Disused quarry face, Healey Dell, Rochdale, OL12 6BG",
    T: "Male fallen approximately 12 m down a quarry face, conscious, on a ledge",
    H: "Loose face above and below; further drop beneath the ledge; steep wet ground",
    A: "Broadley car park then approximately 800 m on foot — no vehicular access to the face",
    N: "One — male, conscious, friend with him at the top",
    emergencyServices: "Fire with line rescue; ambulance; HEMS if the carry is long",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: [],
      preferredStationId: "G30",
      notes: "First pump to locate and hold. They cannot bring him up and should not try",
    },
    {
      id: "line",
      label: "Line rescue",
      service: "Fire",
      requiredApplianceTypes: ["TRU_pump", "TRU_van"],
      requiredCapabilities: ["Rope"],
      notes:
        "Order it now. It is a long way away and nothing on the first attendance can do its job",
    },
    {
      id: "officer",
      label: "Station Manager",
      service: "Fire",
      requiredApplianceTypes: ["FIRE_SM"],
      requiredCapabilities: ["Command"],
      notes: "Technical rescue at height, in failing light, with a long carry",
    },
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      notes: "At the car park. They are not getting to him either until he comes up",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      {
        metric: "Specialist resource",
        target: "line rescue ordered on the initial attendance, not after confirmation",
      },
      {
        metric: "Access point",
        target: "crews sent to the Broadley car park — the wrong entrance costs twenty minutes on foot",
      },
      { metric: "Proportionate response", target: "no additional pumps — they cannot help" },
    ],
    lesson:
      "Sending more of what cannot help is the failure here. Three pumps at the top of a quarry are three pumps at the top of a quarry. The one resource that matters is a long way off, so it goes on the initial attendance — you order it on what the caller has told you, not after a crew has stood there and confirmed it. And get the access point right first time: on foot, in a wooded clough, the wrong gate is twenty minutes you cannot get back.",
  },

  scene: {
    viewBox: { x: -60, y: -50, width: 120, height: 100 },
    compassNorth: "up",
    // Twelve metres of quarry face, then eight hundred of wet path.
    egressExtraSeconds: 1200,
    // What this building will not take. Prose above; a locked option
    // with its reason on it here.
    egressBlocked: [
      { action: "trolley", reason: "A quarry face and eight hundred metres of steep wet path — nothing with wheels comes down here" },
      { action: "carry_chair", reason: "He is twelve metres down a rock face. A chair is for stairs, not for this" },
      { action: "wheelchair", reason: "No vehicular access to the face, and no path a wheel would stay on if there were" },
    ],
    buildings: [],
    roads: [
      { shape: { x: -56, y: 30, w: 30, h: 14 }, kind: "driveway", label: "Broadley car park" },
      { shape: { x: -30, y: 34, w: 86, h: 6 }, kind: "road", label: "Access road" },
      { shape: { x: -26, y: -10, w: 4, h: 44 }, kind: "pavement", label: "Footpath — 800 m" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -46, y: 36 }, kind: "car" },
      { pos: { x: -38, y: 36 }, kind: "car" },
    ],
    hazards: [
      {
        id: "loose-face",
        pos: { x: 4, y: -26 },
        kind: "structural",
        label: "Loose quarry face above and below the casualty",
        knownFromPri: true,
      },
      {
        id: "further-drop",
        pos: { x: 6, y: -14 },
        kind: "structural",
        label: "Further drop beneath the ledge he is on",
        knownFromPri: true,
      },
      {
        id: "carry-out",
        pos: { x: -14, y: 6 },
        kind: "structural",
        label: "Steep wet wooded ground — the carry out is longer than the rescue",
        discoverAfterMinOnScene: 5,
      },
    ],
    casualties: [
      {
        id: "cas-27-walker",
        label: "Male — on a ledge approximately 12 m down",
        pos: { x: 4, y: -20 },
        severity: "serious",
        discoverAfterMinBa: 4,
        clinical: {
          // A twelve-metre fall onto a ledge, then a long wait in the cold
          // and wet under tree cover. The hypothermia is the part that
          // gets worse while everybody waits for line rescue.
          vitals: { rr: 24, spo2: 94, hr: 112, bpSys: 102, bpDia: 64, gcs: 14, temp: 34.6, bm: 5.0 },
          ageYears: 27,
          presumedCondition: "Fall from height — lower limb injury, prolonged exposure on the ledge",
          redFlags: ["spinal_injury_suspected", "hypovolaemic_shock"],
          // Twelve metres meets the trauma criteria on mechanism alone.
          preferredDestination: "mtc",
          criticalInterventions: ["oxygen", "iv_access", "fluids", "spine_board", "warming"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Top of the face", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Downstream", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Quarry floor", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Footpath / car park", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "friend-first",
      atSec: 6,
      text: "My mate's gone over the edge of the quarry. He's on a bit of a ledge about — I don't know, forty foot down? He's talking to me but he says his leg's bad and he can't move. There's more of a drop underneath him.",
      tone: "critical",
    },
    {
      id: "where",
      atSec: 55,
      text: "I don't know how to tell you where we are. We're in the woods, there's a viaduct thing back that way. We came in past a car park but I couldn't tell you which one.",
      tone: "urgent",
    },
    {
      id: "light",
      atSec: 200,
      probability: 0.8,
      text: "It's getting dark down here under the trees. I've got my phone torch on him but the battery's going.",
      tone: "urgent",
    },
    {
      id: "moving",
      atSec: 340,
      probability: 0.4,
      text: "He's trying to shift himself and stuff's coming loose under him. I've shouted at him to stay still. He's not answering me as much now.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  // The call as Liam has it: flat on his front at the lip of the quarry
  // with his mobile in one hand and the torch on Sam forty foot below.
  // He can see his mate the whole time. He cannot tell anyone where they
  // are.
  call: {
    caller: {
      name: "Liam Ogden",
      phone: "07700 900827",
      relation: "The casualty's friend — the other walker",
      where: "Lying at the top edge of the quarry face, Healey Dell, looking down at Sam",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "Hello? Is that — right, I need the fire brigade, or — I don't know who. My mate's fallen down a quarry. Healey Dell, the nature reserve, up from Rochdale. He's stuck on a ledge, he can't get up, and I can't get down to him. I don't know what to do.",
    deflection: "I don't know — I don't know, I can't see properly from here, just tell me what to do, how do I get him up?",
    reassurance: {
      text: "Liam, listen to me. People are coming who do exactly this. You're doing the right thing staying with him. Keep your torch on him and answer what you can.",
      reply: "Okay. Okay. Sam — Sam, they're coming, mate. Right. Go on.",
    },
    answers: {
      f_seen: {
        text: "He's below me — I'm lying on the edge looking straight down at him. He's on a ledge, a shelf of rock, sort of on his side. He's got one leg twisted under him and it's not right. He's got his face up to me and he's talking, but it's all rock and trees down there, I can only just make him out with the torch.",
        tone: "urgent",
        followUps: [
          {
            id: "f_seen_below",
            text: "What's below the ledge he's on — is it the bottom, or is there more?",
            answer: {
              text: "More. There's more of a drop under him — I can't see the bottom, it just goes black. If he rolls off that ledge he's gone.",
              tone: "critical",
            },
          },
        ],
      },
      f_where: {
        text: "It's not a building — it's a quarry, an old one, in the woods. The face goes straight down from where I am. He's about a third of the way down, on a ledge that sticks out. There's loose stuff all above him and I don't know what's under him.",
      },
      f_spread: {
        text: "It's not — nothing's spreading, it's rock. But bits keep coming off the face, little stones go past him every time I move, so I've stopped moving. He's not going anywhere. He can't.",
        tone: "urgent",
      },
      f_started: {
        text: "Ten minutes? Fifteen? He went over and I was shouting down to him for a bit before I thought to ring. It's — I don't know. It's not long.",
      },
      f_building: {
        text: "It's not a building. It's an old quarry in Healey Dell, the nature reserve. Woods all round it, a path along the top — he stepped off the path to look over and the edge just went under him.",
      },
      f_inside: {
        text: "There's no inside — it's just us two. He's on the ledge and I'm at the top. There's nobody else about, we've not seen a soul for an hour.",
        followUps: [
          {
            id: "f_inside_talking",
            text: "Is he still talking to you — does he know where he is?",
            answer: {
              text: "Yeah, he's talking. He knows what's happened. He keeps saying his leg, and he's cold — he says he's freezing. He's making sense, he's just scared.",
              tone: "urgent",
            },
          },
          {
            id: "f_inside_reach",
            text: "Is there any way to reach him from where you are — no, don't try. Can you see one?",
            answer: {
              text: "No. I've looked. It's straight down and it's all crumbly, I'd go over myself. I threw my coat down for him and it missed and it's gone. I'm not going down there.",
            },
          },
        ],
      },
      f_hurt: {
        text: "Yeah — Sam is. His leg's broke, I'm sure it is, it's bent wrong. He hit his head on the way down I think, there's blood on his face. He landed hard — it's twelve metres, fifteen, onto rock.",
        tone: "critical",
        needsCalm: true,
        effect: {
          regrade: "EMERGENCY",
          basis: "Fall of around 12 m onto a ledge with a further drop beneath — conscious, cannot move; a line rescue and a long carry",
        },
      },
      f_vulnerable: {
        text: "It's just Sam. He's 27, he's fit, he plays five-a-side. But he can't move his leg and he can't get himself up. He's not getting off that ledge on his own.",
      },
      f_hazards: {
        text: "No — nothing like that, it's a nature reserve. It's rock. The face is all loose, bits come off it when you touch it, above him and I think under him too. And it's wet, everything's wet, the path's like a stream.",
      },
      f_danger: {
        text: "The drop. Whoever comes down for him — it's straight down and it's loose. No power lines, nothing like that, and nobody's about. It's steep and wet all the way back to the path though. I don't know how you'd carry anyone out of here.",
      },
      f_access: {
        text: "There's no road. You can't drive to it. We walked in — parked up and walked, half an hour, more, uphill along the river and then up through the trees onto the top path. I don't know how to tell you which way. It's all woods. I'm not from round here.",
        tone: "urgent",
        needsCalm: true,
        followUps: [
          {
            id: "f_access_map",
            text: "Have you got a map on your phone — can you read me what it says where the blue dot is?",
            answer: {
              text: "Hang on — it's — it says Healey Dell, it's just green, it's all green. There's a road off to the right of it, a way off — Whitworth Road? I can't — I've got one bar, it's not loading properly.",
            },
          },
          {
            id: "f_access_hear",
            text: "What can you see or hear from where you are — water, a road, a sign?",
            answer: {
              text: "Trees. Water, below us somewhere — I can hear the river. No signs up here. If I go looking I lose him. I'm not leaving him.",
            },
          },
        ],
      },
      f_safe: {
        text: "I'm lying on the edge. Flat. I'm not going any closer. I'm not leaving him though.",
      },
      f_stay: {
        text: "Yeah. Yes. I'm not going anywhere. Don't leave me on my own with this.",
      },
      f_details: {
        text: "Liam Ogden. It's my mobile — 07700 900827. He's Sam Rigby, the one who's fallen.",
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "Shit — sorry — the edge just went under my hand, a lump of it, I've had to shuffle back. I'm lying flat now. I'm lying flat.",
        tone: "urgent",
        effect: { state: "panicking" },
      },
      {
        atSec: 100,
        text: "Is anyone coming? You've not said. I can't get him up on my own and I don't know how long he's got down there.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 160,
        text: "There's a siren — I can hear a siren, down the valley somewhere. But they'll never find us up here. How are they going to find us?",
        tone: "urgent",
        requiresOpened: true,
      },
      {
        atSec: 240,
        text: "He's asking me if they're coming. He keeps asking. He's shivering that much I can hear his teeth from up here.",
        tone: "urgent",
      },
    ],
    onDispatch: "Thank you. Tell them it's the quarry, in the woods — tell them he's on a ledge. Sam! They're coming, mate. Stay still.",
  },
};
