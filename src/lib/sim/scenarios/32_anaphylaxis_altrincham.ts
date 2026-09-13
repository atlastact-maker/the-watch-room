import type { Scenario } from "../incident_types";

// Scenario 32 — anaphylaxis in a restaurant, Altrincham.
//
// The only ambulance job in the sim where an RRV is the RIGHT first
// answer rather than a compromise. What she needs in the next four
// minutes is adrenaline, not a ride, and a solo responder carries
// adrenaline. Waiting for a DCA because "she'll need transport" is
// solving the second problem before the first.
//
// So it is both: something with a clinician now, and something that can
// take her after. Sending only the DCA is slower to the thing that keeps
// her alive; sending only the RRV strands the crew with a patient they
// cannot move.
//
// FICTIONAL: the diner, her friend and the restaurant. Goose Green in
// Altrincham is real; the premises is not.

export const scenario32: Scenario = {
  id: "32",
  slug: "32_anaphylaxis_altrincham",
  title: "Anaphylaxis — restaurant, Altrincham",
  type: "ambulance_anaphylaxis",
  patch: "Southern",
  severity: "high",
  trigger:
    "Category 1 — female late twenties, known nut allergy, collapsed in a restaurant. Lips and tongue swelling, wheezing. Own auto-injector used once",

  location: {
    address: "Goose Green, Altrincham",
    postcode: "WA14 1DW",
    coords: { lat: 53.3874, lng: -2.3512 },
  },

  property: {
    class: "Restaurant — small dining room over two floors, patient on the ground floor",
    occupants: "Busy — approximately forty covers. Staff clearing a path",
    vulnerabilities: [
      "One auto-injector already used; a second dose may be needed before an ambulance can arrive",
      "Goose Green is pedestrianised — the nearest a vehicle gets is the top of the lane",
    ],
    access:
      "Pedestrianised. Vehicle access from the top of the lane only, then roughly 60 m on foot with a bag",
    knownHazards: ["Crowded dining room; a carry out through tables"],
    firstDueStationId: "A-ALT",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — commercial premises.",
      "Known severe nut allergy on the ambulance record; carries her own auto-injector.",
      "Pedestrianised street — vehicle to the top of the lane, then on foot.",
    ],
  },

  methane: {
    M: "No",
    E: "Goose Green, Altrincham, WA14 1DW",
    T: "Anaphylaxis — airway swelling and wheeze, one auto-injector already given",
    H: "Crowded dining room. Pedestrianised access with a carry out",
    A: "Top of the lane by vehicle, then approximately 60 m on foot",
    N: "One — female, late twenties",
    emergencyServices: "Ambulance only",
  },

  pda: [
    {
      id: "rrv1",
      label: "Rapid response vehicle",
      service: "Ambulance",
      requiredApplianceTypes: ["RRV"],
      requiredCapabilities: [],
      preferredStationId: "A-ALT",
      notes:
        "What she needs in the next four minutes is adrenaline, and an RRV carries it. This is the one job where a solo responder is the right first answer",
    },
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-ALT",
      notes: "And something that can take her afterwards. Both, not either",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "C1 response", target: "first clinician on scene inside 15 minutes" },
      {
        metric: "Nearest clinician",
        target: "RRV sent — the immediate need is a drug, not a vehicle",
      },
      {
        metric: "Transport",
        target: "DCA sent as well — a solo responder cannot move her",
      },
    ],
    lesson:
      "The one job here where a rapid response vehicle is the right answer rather than a compromise. She needs adrenaline in the next few minutes and a solo responder carries it; holding out for an ambulance because she will need transport is solving the second problem first. Send both. And note the street is pedestrianised — the last sixty metres are on foot whatever you send.",
  },

  scene: {
    viewBox: { x: -50, y: -35, width: 100, height: 70 },
    compassNorth: "up",
    // Sixty metres of pedestrianised lane, through forty covers.
    egressExtraSeconds: 180,
    // What this building will not take. Prose above; a locked option
    // with its reason on it here.
    egressBlocked: [
      { action: "trolley", reason: "Pedestrianised, and forty covers between her and the top of the lane — the trolley does not get near" },
    ],
    buildings: [
      { shape: { x: -12, y: -26, w: 24, h: 22 }, kind: "target", label: "Restaurant" },
      { shape: { x: -40, y: -26, w: 26, h: 22 }, kind: "neighbour", label: "Adjoining units" },
      { shape: { x: 14, y: -26, w: 26, h: 22 }, kind: "neighbour", label: "Adjoining units" },
    ],
    roads: [
      { shape: { x: -50, y: -2, w: 100, h: 12 }, kind: "pavement", label: "Goose Green — pedestrianised" },
      { shape: { x: 34, y: 10, w: 16, h: 24 }, kind: "road", label: "Vehicle access — top of the lane" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: 40, y: 22 }, kind: "car" },
      { pos: { x: -30, y: 6 }, kind: "lamppost" },
      { pos: { x: 20, y: 6 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "pedestrianised",
        pos: { x: 20, y: 4 },
        kind: "structural",
        label: "Pedestrianised — approximately 60 m on foot from the nearest vehicle point",
        knownFromPri: true,
      },
      {
        id: "crowded",
        pos: { x: -2, y: -16 },
        kind: "structural",
        label: "Forty covers in a small dining room — carry out through tables",
        discoverAfterMinOnScene: 1,
      },
    ],
    casualties: [
      {
        id: "cas-32-diner",
        label: "Female, late twenties — airway swelling, wheeze",
        pos: { x: -2, y: -15 },
        severity: "critical",
        discoverAfterMinBa: 0,
        clinical: {
          // One auto-injector has already been given and she is rebounding:
          // still tachycardic, still hypotensive, still wheezing.
          vitals: { rr: 30, spo2: 90, hr: 132, bpSys: 84, bpDia: 50, gcs: 14, temp: 36.9, bm: 5.9 },
          ageYears: 28,
          presumedCondition: "Anaphylaxis — airway swelling, wheeze, urticaria, hypotension",
          redFlags: ["anaphylaxis", "airway_compromise"],
          preferredDestination: "nearest_a_e",
          // Adrenaline is the treatment. Everything else supports it.
          criticalInterventions: ["adrenaline_im", "oxygen", "iv_access", "fluids"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Goose Green frontage", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Top of the lane / RVP", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear service", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Adjoining units", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "friend-first",
      atSec: 4,
      text: "My friend's having an allergic reaction — she's got a nut allergy and her lips and tongue have swelled right up. She's wheezing and she's gone blotchy all over. We've used her pen already.",
      tone: "critical",
    },
    {
      id: "one-pen",
      atSec: 45,
      text: "She's only got the one pen with her. It helped for a minute and now she's getting worse again. Should we be doing something else?",
      tone: "critical",
    },
    {
      id: "access",
      atSec: 100,
      probability: 0.85,
      text: "You can't drive down here, it's all pedestrian. If they come to the top of the lane one of the staff will run down and bring them.",
      tone: "info",
    },
    {
      id: "worse",
      atSec: 190,
      probability: 0.5,
      text: "She's struggling to get her breath properly now and she can hardly talk. She's frightened.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  // The call as Leanne has it: on her mobile on the floor of the dining
  // room at Siam Green, Hannah sat up against the wall beside her with
  // forty people watching. She saw the pen go in. She does not know what
  // was in the curry, and she cannot see the top of the lane from here.
  call: {
    caller: {
      name: "Leanne Booth",
      phone: "07700 900832",
      relation: "The patient's friend — they were eating together",
      where: "On the floor of the ground-floor dining room at Siam Green, Goose Green, with Hannah propped against the wall beside her",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "Ambulance — please, quick — my friend's having an allergic reaction, she's got a nut allergy. Her lips have swelled right up and her tongue, and she's wheezing, she can't breathe properly. She's used her pen. We're in a restaurant in Altrincham — Siam Green, on Goose Green, the Thai one. Please hurry.",
    deflection: "I don't know — I don't know — she can't breathe properly, just get someone here!",
    reassurance: {
      text: "Leanne, listen to me. Help is on its way to her right now. You did the right thing with the pen. Keep her sat up, keep her still, and stay with me.",
      reply: "Okay. Okay. I've got her. I'm here.",
    },
    answers: {
      a_conscious: {
        text: "Yes — she's awake, she's looking at me. She's sat on the floor with her back against the wall. She knows what's happening, she's had this before. She keeps squeezing my hand.",
        tone: "urgent",
      },
      a_breathing: {
        text: "No — no, she's wheezing, you can hear it from here, it's like a whistle every time she breathes in. Her lips are massive, they've gone dark, and her tongue's swollen, she keeps trying to swallow. She's breathing but it's not right.",
        tone: "critical",
        followUps: [
          {
            id: "a_breathing_talk",
            text: "Can she talk to you — in full sentences?",
            answer: {
              text: "She can talk, but her voice has gone — it's gone all deep and croaky, it doesn't sound like her. She keeps saying 'I'm alright' and she's not.",
              tone: "urgent",
            },
          },
        ],
      },
      a_happened: {
        text: "We'd just started our mains. She'd asked if there were nuts in it and they said no, the green curry was fine. Two mouthfuls in she said her mouth was tingling. Then her lips started going and she said 'get my bag', and she did the pen herself, in the side of her leg, through her jeans, and held it there. She was alright for a minute. Then she just slid off the chair. We got her sat up against the wall and I rang you.",
        tone: "urgent",
        followUps: [
          {
            id: "a_happened_pen",
            text: "How long ago did she use the pen?",
            answer: {
              text: "Five minutes? Six? Just before I rang you. It's here on the floor, the used one — the orange end's out.",
            },
          },
          {
            id: "a_happened_food",
            text: "Do you know what was actually in the food?",
            answer: {
              text: "The chef's gone to look — the manager's shouting at him. One of the waiters said the sauce might have had peanut in it. I don't know. I don't know, they said it was fine.",
            },
          },
        ],
      },
      a_when: {
        text: "Ten minutes since she said her mouth was tingling — less, maybe. The pen was about five minutes ago. It's all happened so fast, it's gone from nothing to this.",
      },
      a_now: {
        text: "She's bright red in the face and all puffy, her eyes are going. She's covered in blotches — big raised ones, all up her arms and her neck, and she's scratching at them. She's sweaty. She's talking but it's croaky. She's sat up — she wouldn't lie down, she said she couldn't breathe lying down.",
        tone: "urgent",
      },
      a_bleeding: {
        text: "No. No, nothing like that. She's not hurt, she just slid down off the chair onto the floor. I caught her.",
      },
      a_age: {
        text: "Twenty-eight. She's twenty-eight.",
      },
      a_history: {
        text: "The nut allergy — it's really bad, she's had it all her life. She's been in hospital with it twice before, once when she was little and once at uni. She carries the pen everywhere. She's got asthma as well, mild — there's a blue inhaler in her bag, she's had two puffs of that, the manager said to try it. Nothing else. She's not on anything from the doctor.",
      },
      a_count: {
        text: "Just her. Just Hannah. Everyone else is fine — they're all just stood there staring at us.",
      },
      a_danger: {
        text: "It's a restaurant — it's fine, it's just packed. There's tables everywhere and everyone's stood up. The staff are pulling the tables back out of the way.",
        needsCalm: true,
      },
      a_access: {
        text: "Goose Green — it's the pedestrian bit, off Stamford New Road, the cobbled lane with the bars. Siam Green, it's got a green front. You can't get a car down here, there's bollards at the end. The manager's here, he's saying he'll sort it — he's sending one of the lads up to the top.",
        followUps: [
          {
            id: "a_access_floor",
            text: "Which floor is she on?",
            answer: {
              text: "Ground floor, at the back, by the kitchen door. They'll see us as soon as they come in — there's a crowd stood round us.",
            },
          },
        ],
      },
      a_with: {
        text: "I'm on the floor with her, I'm right here. I've got my arm round her, she's leaning on me.",
      },
      a_instructions: {
        text: "Yes — yes. Tell me what to do. Please, tell me.",
        tone: "urgent",
      },
      a_details: {
        text: "Leanne. Leanne Booth. It's my mobile — 07700 900832. She's Hannah. Hannah Pritchard.",
        needsCalm: true,
      },
    },
    interjections: [
      {
        atSec: 60,
        text: "Oh God, her lips — it's going into her neck now, it's all swelling up. Hannah, look at me, look at me. Her eyes are nearly shut, they've gone that puffy.",
        tone: "critical",
        effect: { state: "panicking" },
      },
      {
        atSec: 120,
        text: "Have you sent someone? You've not said — is anyone actually coming? Please. Just tell me they're coming.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 170,
        text: "The manager's brought the first aid box and there's nothing in it, it's plasters. Somebody's got Piriton in their bag — do we give her that? Is there anything else we can do?",
        tone: "urgent",
      },
      {
        atSec: 215,
        text: "Someone's shouting from the door — there's someone in green coming down the lane with a bag. Is that yours? Here! In here! — Sorry. Sorry. He's here.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Thank you — thank you. Hannah, they're coming, babe, they're coming. Please tell them to run.",
  },
};
