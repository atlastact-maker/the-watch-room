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
//
// Tonight's run (scene.variants) changes what the pen has done, not the
// lesson. Base: one pen given, rebounding. "no-pen": no auto-injector
// with her, so the RRV's adrenaline is the first she gets. "shellfish":
// it was the prawns, not the curry — same physiology, different history
// for the crew to find. "biphasic": the pen worked and she sounded fine
// on the call; the second wave comes after the desk has sent, and a
// stood-down RRV is the mistake it punishes. Anything that only fits one
// run is gated on it; the static fields stay true of all four.

export const scenario32: Scenario = {
  id: "32",
  slug: "32_anaphylaxis_altrincham",
  title: "Anaphylaxis — restaurant, Altrincham",
  type: "ambulance_anaphylaxis",
  patch: "Southern",
  severity: "high",
  trigger:
    "Category 1 — female late twenties, known severe food allergy, collapsed in a restaurant. Lips and tongue swelling, wheezing. Carries her own auto-injector",

  location: {
    address: "Siam Green (Thai restaurant), Goose Green, Altrincham",
    postcode: "WA14 1DW",
    coords: { lat: 53.3874, lng: -2.3512 },
  },

  property: {
    class: "Restaurant — small dining room over two floors, patient on the ground floor",
    occupants: "Busy — approximately forty covers. Staff clearing a path",
    vulnerabilities: [
      "Adrenaline is the time-critical need — whatever her own pen has or has not done, a dose may be needed before an ambulance can arrive",
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
      "Known severe food allergy on the ambulance record; carries her own auto-injector.",
      "Pedestrianised street — vehicle to the top of the lane, then on foot.",
    ],
  },

  methane: {
    M: "No",
    E: "Siam Green, Goose Green, Altrincham, WA14 1DW — green frontage, pedestrianised lane off Stamford New Road",
    T: "Anaphylaxis — airway swelling and wheeze; own auto-injector status as the caller gives it",
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
      { metric: "C1 response", target: "first clinician on scene and paired to her inside 10 minutes" },
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
      "The one job here where a rapid response vehicle is the right answer rather than a compromise. She needs adrenaline in the next few minutes and a solo responder carries it; holding out for an ambulance because she will need transport is solving the second problem first. Send both. She has ten minutes from the moment you send: pair the first unit to her the second it books in attendance. And note the street is pedestrianised — the last sixty metres are on foot whatever you send.",
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
        pos: { x: -2, y: -14 },
        kind: "structural",
        label: "Forty covers in a small dining room — carry out through tables",
        discoverAfterMinOnScene: 1,
      },
    ],
    casualties: [
      {
        id: "cas-32-diner",
        label: "Female, late twenties — airway swelling, wheeze",
        pos: { x: 4, y: -23 },
        severity: "critical",
        discoverAfterMinBa: 0,
        clinical: {
          // One auto-injector has already been given and she is rebounding:
          // still tachycardic, still hypotensive, still wheezing.
          vitals: { rr: 30, spo2: 90, hr: 132, bpSys: 84, bpDia: 50, gcs: 14, temp: 36.9, bm: 5.9 },
          ageYears: 28,
          presumedCondition: "Anaphylaxis — peanut, known nut allergy, mild asthma; airway swelling, wheeze, urticaria, hypotension",
          // Anaphylaxis alone: the model swells the airway itself and
          // adrenaline is what opens it. A structural airway flag on top
          // made the swelling something no drug could touch.
          redFlags: ["anaphylaxis"],
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
    // Tonight's run. The remainder (0.35) is the base: one pen in, and
    // she is rebounding. The presumed condition names the allergen so the
    // crew's history check agrees with the caller.
    variants: [
      {
        id: "no-pen",
        label: "Tonight she has no auto-injector with her — it is at home in the other bag. Nothing has been given before the first clinician arrives, and she is further down the slope at survey",
        probability: 0.25,
        clinical: {
          "cas-32-diner": {
            vitals: { rr: 34, spo2: 86, hr: 138, bpSys: 76, bpDia: 44, gcs: 13, temp: 36.9, bm: 5.9 },
            presumedCondition: "Anaphylaxis — peanut, known nut allergy, mild asthma; no adrenaline given — airway swelling, wheeze, urticaria, hypotension",
          },
        },
      },
      {
        id: "shellfish",
        label: "Tonight it was the prawns, not the curry — a shellfish allergy, not nuts. Same physiology, different history for the crew to find",
        probability: 0.2,
        clinical: {
          "cas-32-diner": {
            presumedCondition: "Anaphylaxis — prawns, known shellfish allergy, mild asthma; airway swelling, wheeze, urticaria, hypotension",
          },
        },
      },
      {
        id: "biphasic",
        label: "Tonight the pen worked. She sounded better on the call and wanted to go home; the second wave came after the desk had sent, and any RRV stood down on the strength of the first few minutes was the wrong call",
        probability: 0.2,
        clinical: {
          "cas-32-diner": {
            vitals: { rr: 20, spo2: 95, hr: 108, bpSys: 106, bpDia: 68, gcs: 15, temp: 36.9, bm: 5.9 },
            presumedCondition: "Anaphylaxis — peanut, known nut allergy, mild asthma; settled after own adrenaline, second wave beginning — wheeze and flushing returning",
          },
        },
      },
    ],
  },

  informantScript: [
    {
      id: "friend-first",
      atSec: 20,
      text: "She's leaning on me more. Her breathing's got that whistle on every breath now — is someone actually on their way?",
      tone: "critical",
      excludesVariantIds: ["biphasic"],
    },
    {
      id: "settling",
      atSec: 20,
      requiresVariantIds: ["biphasic"],
      text: "She's a bit better, honestly — she's asking for a glass of water and saying she feels daft. Are they still coming? She says she's shaky from the pen, that's all.",
      tone: "info",
    },
    {
      id: "no-pen",
      atSec: 40,
      requiresVariantIds: ["no-pen"],
      text: "She hasn't got her pen. It's not in this bag, it's at home in her work bag — she's only just realised. There's nothing here to give her. The manager's going round the whole room asking if anyone's got one.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "one-pen",
      atSec: 45,
      text: "She's only got the one pen with her. It helped for a minute and now she's getting worse again. Should we be doing something else?",
      tone: "critical",
      excludesVariantIds: ["no-pen", "biphasic"],
    },
    {
      id: "access",
      atSec: 100,
      probability: 0.85,
      text: "The manager's sent a lad up to the top of the lane with a torch to wave them in — he's stood by the bollards.",
      tone: "info",
    },
    {
      id: "worse",
      atSec: 190,
      probability: 0.5,
      text: "She's struggling to get her breath properly now and she can hardly talk. She's frightened.",
      tone: "critical",
      effect: { pulseCritical: true },
      excludesVariantIds: ["biphasic"],
    },
    {
      id: "second-wave",
      atSec: 240,
      requiresVariantIds: ["biphasic"],
      text: "No — no, it's starting again. The wheeze is back and her lips are going up again, and she's gone white. It's like before the pen went in. Please — are they close? Don't let them turn round.",
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
    openingByVariant: {
      "no-pen":
        "Ambulance — please, quick — my friend's having an allergic reaction, she's got a nut allergy. Her lips have swelled right up and her tongue, and she's wheezing, she can't breathe properly. She hasn't got her pen, it's not in her bag. We're in a restaurant in Altrincham — Siam Green, on Goose Green, the Thai one. Please hurry.",
      shellfish:
        "Ambulance — please, quick — my friend's having an allergic reaction, she's got a shellfish allergy and there were prawns in it. Her lips have swelled right up and her tongue, and she's wheezing, she can't breathe properly. She's used her pen. We're in a restaurant in Altrincham — Siam Green, on Goose Green, the Thai one. Please hurry.",
      biphasic:
        "Ambulance, please — my friend's had an allergic reaction, she's got a nut allergy. Her lips and tongue swelled up and she was wheezing, and she's used her pen. She's a bit better now, but they've always told her to ring you when she's had to use it. We're in a restaurant in Altrincham — Siam Green, on Goose Green, the Thai one.",
    },
    deflection: "I don't know — I don't know — she can't breathe properly, just get someone here!",
    reassurance: {
      text: "Leanne, listen to me. Help is on its way to her right now. Keep her sat up, keep her still, and stay with me.",
      reply: "Okay. Okay. I've got her. I'm here.",
    },
    answers: {
      a_conscious: {
        text: "Yes — she's awake, she's looking at me. She's sat on the floor with her back against the wall. She knows what's happening, she's had this before. She keeps squeezing my hand.",
        byVariant: {
          "no-pen": "She's awake but she's going — she's looking at me but she's not really with it, she's stopped answering me. She's sat on the floor with her back against the wall. She's had this before, she knows what it is.",
          biphasic: "Yes, she's fine — she's sat up against the wall, she's talking, she's telling everyone to stop staring. She's had this before. She's saying she wants to go home.",
        },
        tone: "urgent",
      },
      a_breathing: {
        text: "No — no, she's wheezing, you can hear it, it's like a whistle every time she breathes in. Her lips are massive, they've gone a horrible colour, and her tongue's swollen, she keeps trying to swallow. She's breathing but it's not right.",
        byVariant: {
          biphasic: "She was wheezing really badly before the pen — like a whistle every breath. It's eased off since. She's still a bit whistly if you listen for it, and her lips are still puffy, but she's talking to me properly.",
        },
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
        text: "We'd just started our mains. She'd asked if there were nuts in it and they said no, the green curry was fine. Two mouthfuls in she said her mouth was tingling. Then her lips started going and she said 'get my bag', and she did the pen herself, in the side of her leg, through her jeans, and held it there. And then her legs went and she just slid off the chair. We got her sat up against the wall and I rang you.",
        byVariant: {
          "no-pen": "We'd just started our mains. She'd asked if there were nuts in it and they said no, the green curry was fine. Two mouthfuls in she said her mouth was tingling. Then her lips started going and she said 'get my bag' — and it's not in there. The pen. She's changed bags, it's at home. She just looked at me. And then her legs went and she slid off the chair. We got her sat up against the wall and I rang you.",
          shellfish: "We'd just started our mains. She'd told them shellfish when we ordered — she always does — and she had the chicken pad thai. Two mouthfuls in she said her mouth was tingling, and then she pulled a prawn out of it. There were prawns in it. Then her lips started going and she said 'get my bag', and she did the pen herself, in the side of her leg, through her jeans. And then her legs went and she slid off the chair. We got her sat up against the wall and I rang you.",
          biphasic: "We'd just started our mains. She'd asked if there were nuts in it and they said no, the green curry was fine. Two mouthfuls in she said her mouth was tingling, then her lips started going and she did the pen herself, in the side of her leg, through her jeans. Her legs went and she slid off the chair, that's when it was really bad. We got her sat up against the wall and a minute or two later she started coming back — the colour, the breathing. She says she's alright now.",
        },
        tone: "urgent",
        followUps: [
          {
            id: "a_happened_pen",
            text: "How long ago did she use the pen?",
            answer: {
              text: "Five minutes? Six? Just before I rang you. It's here on the floor, the used one — the orange end's out.",
              byVariant: {
                "no-pen": "She hasn't. She hasn't got it with her — it's at home in her work bag, she's just realised. There's nothing. Nobody in here's got one.",
                biphasic: "Seven or eight minutes? It's here on the floor, the used one — the orange end's out. She picked up about two minutes after it went in.",
              },
            },
          },
          {
            id: "a_happened_food",
            text: "Do you know what was actually in the food?",
            answer: {
              text: "The chef's gone to look — the manager's shouting at him. One of the waiters said the sauce might have had peanut in it. I don't know. I don't know, they said it was fine.",
              byVariant: {
                shellfish: "It was the prawns. She'd asked for chicken and told them about the shellfish, and it came out with prawns in — they must have mixed up the plates. The manager's gone white.",
              },
            },
          },
        ],
      },
      a_when: {
        text: "Ten minutes since she said her mouth was tingling — less, maybe. The pen was about five minutes ago. It's all happened so fast, it's gone from nothing to this.",
        byVariant: {
          "no-pen": "Ten minutes since she said her mouth was tingling — less, maybe. Nothing's been given, there's nothing to give. It's all happened so fast, it's gone from nothing to this.",
          biphasic: "About a quarter of an hour since her mouth started tingling. The pen was maybe eight minutes ago, and she came back round a couple of minutes after that.",
        },
      },
      a_now: {
        text: "She's bright red in the face and all puffy, her eyes are going. She's covered in blotches — big raised ones, all up her arms and her neck, and she's scratching at them. She's sweaty. She's talking but it's croaky. She's sat up — she wouldn't lie down, she said she couldn't breathe lying down.",
        byVariant: {
          "no-pen": "She's gone a grey colour round her mouth and her lips are huge, her eyes are nearly shut. She's covered in blotches, all up her arms and her neck. She's sweaty and she's cold. She can hardly get a word out. She's sat up — she wouldn't lie down, she said she couldn't breathe lying down.",
          biphasic: "Her colour's coming back — she was bright red and puffy, and it's going down. Still blotchy on her arms and her lips are still fat. She's pale and shaky and she says she feels sick, she says that's the pen, it always does that. She's sat up, talking normally, well — nearly.",
        },
        tone: "urgent",
      },
      a_bleeding: {
        text: "No. No, nothing like that. She's not hurt, she just slid down off the chair onto the floor. I caught her.",
      },
      a_age: {
        text: "Twenty-eight. She's twenty-eight.",
      },
      a_history: {
        text: "The nut allergy — it's really bad, she's had it all her life. She's been in hospital with it twice before, once when she was little and once at uni. She carries the pen everywhere. She's got asthma as well, mild — there's a blue inhaler in her bag, she's had two puffs of that, the manager said to try it. Nothing else that I know of — no tablets, nothing regular.",
        byVariant: {
          "no-pen": "The nut allergy — it's really bad, she's had it all her life. She's been in hospital with it twice before, once when she was little and once at uni. She carries the pen everywhere, always — except it's in the other bag tonight. She's got asthma as well, mild — there's a blue inhaler in this bag, she's had two puffs of that, the manager said to try it. Nothing else that I know of — no tablets, nothing regular.",
          shellfish: "Shellfish — prawns, crab, all of it. It's really bad, she's had it since she was a teenager. She's been in hospital with it twice before, the last time at uni. She carries the pen everywhere. She's got asthma as well, mild — there's a blue inhaler in her bag, she's had two puffs of that, the manager said to try it. Nothing else that I know of — no tablets, nothing regular.",
        },
      },
      a_count: {
        text: "Just her. Just Hannah. Everyone else is fine — they're all just stood there staring at us.",
      },
      a_danger: {
        text: "It's a restaurant — it's fine, it's just packed. There's tables everywhere and everyone's stood up. The staff are pulling the tables back out of the way.",
        needsCalm: true,
      },
      a_access: {
        text: "Goose Green — it's the pedestrian bit off Stamford New Road, the lane with all the bars. Siam Green, it's got a green front. You can't get a car down here, there's bollards at the end — I don't know where they'd even park, I've never thought about it. The manager's here, he's saying he'll sort it.",
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
        excludesVariantIds: ["biphasic"],
      },
      {
        atSec: 75,
        text: "She's saying she's fine now and she doesn't want an ambulance, she wants to go home and sleep it off. Do I still need you? She's telling me to hang up.",
        tone: "urgent",
        requiresVariantIds: ["biphasic"],
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
        atSec: 300,
        text: "Someone at the door's saying they can hear a siren, up on the main road — is that yours? Is that them? Somebody go up and wave them down — go on, RUN.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Thank you — thank you. Hannah, they're coming, babe, they're coming. Please tell them to run.",
  },
};
