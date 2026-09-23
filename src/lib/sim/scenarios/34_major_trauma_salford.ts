import type { Scenario } from "../incident_types";

// Scenario 34 — fall from height on a building site, Salford.
//
// Major trauma, at the one point in the patch where the trauma centre is
// not a bypass. The nearest emergency department to Ordsall Lane is the
// MRI, and the MRI is itself half of the Greater Manchester major trauma
// centre; Salford Royal is the other half, a kilometre further. So the
// decision here is not "trauma centre or nearest" — it is WHICH trauma
// centre, and the Pathfinder answers it: a pelvis and a right chest wall
// are thoraco-abdominal, and thoraco-abdominal goes to the MRI. Then the
// pre-alert, so the team is stood in resus when the doors open.
//
// It is also the strongest HEMS case in the sim, and not because of the
// flying. HEMS bring a doctor and interventions a road crew cannot do,
// and the site has hard standing the manager can clear for them.
//
// Fire attend for the site rather than the fire: a live construction
// site with open edges, and a man on scaffold boards a couple of metres
// up who has to come down flat. The crew plan the carry; the pump is the
// hands and the working-at-height kit.
//
// Tonight's run is drawn when the call comes in. The base is the pelvis.
// Some nights he landed on his head and the job is the airway and a
// doctor for the RSI — and the Pathfinder sends that to Salford, not the
// MRI. Some nights it is the right chest, tensioning while the crew
// watch. And some nights he got lucky, and the job is not turning a sore
// pelvis into a trauma call it does not need.
//
// FICTIONAL: the site, the firm and the casualty. Ordsall Lane is a real
// Salford road; the development is not.

export const scenario34: Scenario = {
  id: "34",
  slug: "34_major_trauma_salford",
  title: "Fall from height — building site, Ordsall Lane",
  type: "ambulance_major_trauma",
  patch: "Western",
  severity: "high",
  trigger:
    "Category 2 major trauma — male fallen approximately six metres from scaffolding onto a concrete slab, then carried up onto first-lift scaffold boards by workmates. Conscious, leg deformed, pelvic pain",

  location: {
    address: "Construction site, Ordsall Lane, Salford",
    postcode: "M5 3EN",
    coords: { lat: 53.4731, lng: -2.2698 },
  },

  property: {
    class: "Construction site — partially built frame, scaffolded to three levels",
    occupants: "Around twenty on site. Site manager on scene and controlling access",
    vulnerabilities: [
      "Casualty on first-lift scaffolding boards, about two metres up — he cannot come down a ladder",
      "Workmates have already moved him, which nobody wanted but which has happened",
    ],
    access:
      "Site gates off Ordsall Lane, hard standing inside. Site manager holds the gate and can clear a landing area on the slab",
    knownHazards: [
      "Working at height — casualty on scaffold boards",
      "Live site — plant movements, open edges, materials stacked",
    ],
    firstDueStationId: "A-SFD",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — construction site.",
      "Major trauma: the nearest emergency department from here is the MRI, which is itself a major trauma centre site. The decision is which MTC — the Pathfinder sends thoraco-abdominal trauma to the MRI — and pre-alerting it.",
      "Site has hard standing and the manager can clear a landing area — HEMS is viable here.",
    ],
  },

  methane: {
    M: "No",
    E: "Construction site, Ordsall Lane, Salford, M5 3EN",
    T: "Fall from height, approximately 6 m onto a concrete slab. One casualty, now on first-lift scaffold boards",
    H: "Working at height; live construction site",
    A: "Site gates off Ordsall Lane; manager holding the gate, landing area available on the slab",
    N: "One — male, conscious, obvious lower limb deformity, pelvic pain",
    emergencyServices: "Ambulance leading; fire and HEMS to be considered",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-SFD",
      notes: "First road resource. The trauma centre is three kilometres away; the question is which one, and whether they know he is coming",
    },
    {
      id: "hems",
      label: "HEMS",
      service: "Ambulance",
      requiredApplianceTypes: ["HEMS", "CCC"],
      requiredCapabilities: [],
      notes:
        "A doctor and interventions a road crew cannot do. The aircraft by day, the critical care car by night or in weather — the same team either way",
    },
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: [],
      preferredStationId: "G58",
      notes: "A live site with open edges and a man on the boards a couple of metres up. The hands and the working-at-height kit for a carry the crew will have to plan",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      {
        metric: "Trauma triage",
        target: "major trauma centre chosen as soon as the survey is in, and the ATMIST pre-alert sent — the Pathfinder decides which site from the injuries found",
      },
      {
        metric: "HEMS",
        target: "requested early; the site has a landing area and the crew will want the doctor",
      },
      {
        metric: "Fire attendance",
        target: "a pump mobilised — a live site, working at height, and hands for the carry",
      },
    ],
    lesson:
      "Major trauma is usually a bypass decision. Not here: from Ordsall Lane the nearest emergency department is the MRI, and the MRI is a major trauma centre. So the decision is which trauma centre, and the Pathfinder answers it — a pelvis and a right chest wall are thoraco-abdominal, and thoraco-abdominal goes to the MRI, not the kilometre further to Salford; a head with a GCS under 12 goes the other way, to Salford. Read the injuries, choose as soon as the survey is in, send the pre-alert so the team is stood in resus, and ask for HEMS early — not for the speed but for the doctor.",
  },

  scene: {
    viewBox: { x: -60, y: -45, width: 120, height: 90 },
    compassNorth: "up",
    // First-lift scaffold — he has to come down flat before he goes anywhere.
    egressExtraSeconds: 420,
    // What this building will not take. Prose above; a locked option
    // with its reason on it here.
    egressBlocked: [
      { action: "walked", reason: "First-lift scaffold boards. Nobody walks off that, and he could not if he wanted to" },
      { action: "carry_chair", reason: "A chair on a scaffold ladder is how you make a second casualty" },
      { action: "trolley", reason: "He is on boards two metres up — the trolley cannot be got to him" },
      { action: "wheelchair", reason: "Nothing with wheels gets to a first-lift scaffold, and he is not sitting up with that pelvis" },
    ],
    buildings: [
      { shape: { x: -26, y: -32, w: 52, h: 34 }, kind: "target", label: "Frame — scaffolded" },
      { shape: { x: 30, y: -20, w: 20, h: 14 }, kind: "neighbour", label: "Site cabins" },
    ],
    roads: [
      { shape: { x: -50, y: 6, w: 90, h: 18 }, kind: "driveway", label: "Hard standing / landing area" },
      { shape: { x: -60, y: 26, w: 120, h: 4 }, kind: "driveway", label: "Site gates" },
      { shape: { x: -60, y: 30, w: 120, h: 10 }, kind: "road", label: "Ordsall Lane" },
    ],
    hydrants: [{ label: "H1", pos: { x: -30, y: 33 }, street: "Ordsall Lane" }],
    landmarks: [
      { pos: { x: 36, y: 14 }, kind: "car" },
      { pos: { x: 44, y: 14 }, kind: "car" },
      { pos: { x: -44, y: 28 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "height",
        pos: { x: -4, y: -18 },
        kind: "structural",
        label: "Casualty on first-lift scaffolding boards, about two metres up",
        knownFromPri: true,
      },
      {
        id: "live-site",
        pos: { x: 16, y: -6 },
        kind: "structural",
        label: "Live site — plant movements, open edges, stacked materials",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-34-worker",
        label: "Male, 30s — fall approximately 6 m, lower limb deformity, pelvic pain",
        pos: { x: -4, y: -17 },
        severity: "critical",
        // On open boards in plain sight — nobody has to search for him.
        discoverAfterMinBa: 0,
        clinical: {
          // Talking on arrival and quietly bleeding into his pelvis and
          // thigh. The blood pressure is the thing to watch, not the leg.
          vitals: { rr: 26, spo2: 94, hr: 124, bpSys: 96, bpDia: 58, gcs: 14, temp: 36.1, bm: 6.0 },
          ageYears: 34,
          presumedCondition: "Fall from height approximately 6 m — open lower limb deformity, pelvic pain, right-sided chest wall pain",
          redFlags: ["hypovolaemic_shock", "spinal_injury_suspected", "major_haemorrhage"],
          preferredDestination: "mtc",
          // The pelvis and the right chest are what the Pathfinder splits
          // on: thoraco-abdominal to the MRI, not to Salford.
          injuryPattern: ["thoraco_abdominal"],
          criticalInterventions: ["oxygen", "iv_access", "tXA", "pelvic_binder", "spine_board"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Gates / hard standing", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Site cabins", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Frame rear", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Scaffold west", face: "left", bearingDeg: 270 },
    ],
    // Tonight's run. The remainder of the mass is the base: the pelvis.
    variants: [
      {
        id: "head",
        label: "Tonight he landed on his head — GCS falling, airway at risk, and the Pathfinder says Salford",
        probability: 0.25,
        clinical: {
          "cas-34-worker": {
            // Not the pelvis: the hat came off. Cushing's on the monitor,
            // snoring on the boards. The airway is the whole job and the
            // RSI is a doctor's — which is what HEMS or the car are for.
            vitals: { rr: 10, spo2: 88, hr: 62, bpSys: 158, bpDia: 92, gcs: 9, temp: 36.1, bm: 6.0 },
            presumedCondition: "Fall from height approximately 6 m — head injury, reduced GCS, noisy airway, lower limb deformity",
            redFlags: ["head_injury_severe", "airway_compromise", "spinal_injury_suspected"],
            // Cranial, not thoraco-abdominal: GCS under 12 goes to Salford.
            injuryPattern: [],
          },
        },
        casualty: {
          "cas-34-worker": { label: "Male, 30s — fall approximately 6 m, head injury, reduced GCS" },
        },
      },
      {
        id: "chest",
        label: "Tonight the right chest is the problem — a tension developing on the boards",
        probability: 0.2,
        clinical: {
          "cas-34-worker": {
            // The side he landed on. Getting worse by the minute, and the
            // needle is in a DCA's bag.
            vitals: { rr: 34, spo2: 86, hr: 132, bpSys: 88, bpDia: 60, gcs: 14, temp: 36.1, bm: 6.0 },
            presumedCondition: "Fall from height approximately 6 m — right-sided chest injury, increasing breathlessness, lower limb deformity, pelvic pain",
            redFlags: ["tension_pneumothorax", "spinal_injury_suspected", "hypovolaemic_shock"],
          },
        },
        casualty: {
          "cas-34-worker": { label: "Male, 30s — fall approximately 6 m, right chest, struggling to breathe" },
        },
      },
      {
        id: "walked",
        label: "Tonight he got lucky — a broken leg and a sore pelvis, and not much else",
        probability: 0.15,
        clinical: {
          "cas-34-worker": {
            // Same mechanism, same trauma centre. Nothing to bleed, nothing
            // to decompress: the job is not over-treating a stable man.
            vitals: { rr: 20, spo2: 97, hr: 98, bpSys: 128, bpDia: 78, gcs: 15, temp: 36.3, bm: 5.8 },
            presumedCondition: "Fall from height approximately 6 m — closed lower limb deformity, pelvic pain, haemodynamically stable",
            redFlags: ["spinal_injury_suspected"],
            criticalInterventions: ["spine_board"],
          },
        },
        casualty: {
          "cas-34-worker": { severity: "serious", label: "Male, 30s — fall approximately 6 m, lower limb deformity, stable" },
        },
      },
    ],
  },

  informantScript: [
    {
      id: "manager-first",
      atSec: 5,
      text: "Site manager, Ordsall Lane. One of the lads has come off the top of the scaffold — twenty foot, near enough, onto the slab. He's awake and talking but his leg's the wrong shape. They've carried him up onto the first-lift boards, I know they shouldn't have.",
      tone: "critical",
      excludesVariantIds: ["head"],
    },
    {
      id: "manager-first-head",
      atSec: 5,
      text: "Site manager, Ordsall Lane. One of the lads has come off the top of the scaffold — twenty foot, near enough, onto the slab, and he's gone down on his head. He's breathing but he's not making sense. They've carried him up onto the first-lift boards, I know they shouldn't have.",
      tone: "critical",
      requiresVariantIds: ["head"],
    },
    {
      id: "access",
      atSec: 50,
      text: "I'll hold the gates open. There's hard standing inside if you want to bring anything in — I can shift the telehandler if you need the space clearing.",
      tone: "info",
    },
    {
      id: "deteriorating",
      atSec: 210,
      probability: 0.45,
      text: "He's gone very pale and he's not talking as much now. He was chatting away five minutes ago.",
      tone: "critical",
      effect: { pulseCritical: true },
      excludesVariantIds: ["head", "walked"],
    },
    {
      id: "not-making-sense",
      atSec: 200,
      text: "He's stopped answering Kev. He was saying words a minute ago — his wife's name, swearing — and now it's just noise, and he's snoring like he's asleep. Kev's tipped his head back and it's better, but it keeps going again.",
      tone: "critical",
      effect: { pulseCritical: true },
      requiresVariantIds: ["head"],
    },
    {
      id: "going-blue",
      atSec: 240,
      text: "He can't get his breath — he's going blue round the lips and he's grabbing at his right side. Kev says the veins in his neck are standing out. Whatever you're sending, it needs to be quick.",
      tone: "critical",
      effect: { pulseCritical: true },
      requiresVariantIds: ["chest"],
    },
    {
      id: "wants-to-know",
      atSec: 240,
      text: "He's asking if he actually needs an ambulance. He does — he can't put any weight on it and he goes grey when he tries. But he's alright in himself, he's giving the lads grief.",
      tone: "info",
      requiresVariantIds: ["walked"],
    },
    {
      id: "carry",
      survivesArrival: true,
      atSec: 300,
      probability: 0.7,
      text: "Kev's had a look at the ladder. There's no way he's coming down that flat on his back — it's a hatch and a ladder, that's all there is on this side. Whoever comes is going to have to work that out.",
      tone: "urgent",
    },
  ],

  // The call as Dean has it: on his work mobile at the foot of the scaffold
  // ladder, looking up at the first-lift boards where the lads have put
  // Tomek, with the site stopped behind him and the gates already open. He
  // did not see him go; he saw where he landed, and he knows how far it was.
  call: {
    caller: {
      name: "Dean Prescott",
      phone: "07700 900834",
      relation: "Site manager, Pendleton Frame — the casualty is one of his bricklayers",
      where: "On the hard standing at the foot of the scaffold ladder, Ordsall Lane site, looking up at the first-lift boards",
      line: "mobile",
      state: "calm",
    },
    opening:
      "Ambulance. Ordsall Lane, Salford — the building site, Pendleton Frame, just down from the Regent Road lights. I'm the site manager. One of my bricklayers has come off the top of the scaffold onto the concrete — six metres, near enough. He's awake and he's talking to us, but his leg's badly broken, it's bent the wrong way, and he's saying his hip. And he's up on the first-lift boards now — the lads carried him up there before I got to him. I need you here quick.",
    openingByVariant: {
      head: "Ambulance. Ordsall Lane, Salford — the building site, Pendleton Frame, just down from the Regent Road lights. I'm the site manager. One of my bricklayers has come off the top of the scaffold onto the concrete — six metres, near enough — and he's gone down on his head. He's breathing, he's making noises, but he's not making sense, and his leg's bent the wrong way. He's up on the first-lift boards — the lads carried him up there before I got to him. I need you here quick.",
      chest: "Ambulance. Ordsall Lane, Salford — the building site, Pendleton Frame, just down from the Regent Road lights. I'm the site manager. One of my bricklayers has come off the top of the scaffold onto the concrete — six metres, near enough. He's awake but he can't get his breath — he's landed on his side and he's fighting for every one. His leg's bent the wrong way as well. He's up on the first-lift boards — the lads carried him up there before I got to him. I need you here quick.",
      walked: "Ambulance. Ordsall Lane, Salford — the building site, Pendleton Frame, just down from the Regent Road lights. I'm the site manager. One of my bricklayers has come off the top of the scaffold onto the concrete — six metres, near enough. He's alright in himself, he's talking to us, but his leg's broken, it's bent the wrong way, and he can't put any weight on his hip. He's up on the first-lift boards — the lads carried him up there before I got to him.",
    },
    deflection: "Hang on. — Kev, keep him flat, don't let him — sorry. Go on.",
    reassurance: {
      text: "Dean, you've got this well in hand. Help is coming. Keep everyone off him and keep talking to me.",
      reply: "Yeah. Yeah, I'm here. Go on.",
    },
    answers: {
      a_conscious: {
        text: "Yes. He's awake, he's talking to me — he knows where he is, he knows what's happened. He's in a lot of pain, he's shouting when anyone goes near the leg. But he's with us.",
        byVariant: {
          head: "Sort of. His eyes are open some of the time and he'll grab your hand if you talk to him, but he's not talking back — it's noises, not words. Kev says he said his wife's name once. He's not with us, not properly.",
          walked: "Yes. Wide awake, talking, knows exactly what's happened — he's more embarrassed than anything. It's the leg and the hip. He's not going anywhere on them.",
        },
        tone: "urgent",
      },
      a_breathing: {
        text: "Breathing's alright. Fast, but he's talking in sentences. He's not short of breath — he's swearing at the lads that moved him, so there's nothing wrong with his lungs.",
        byVariant: {
          head: "He's breathing, but it's noisy — a snore, like he's asleep on his back. Kev's tipped his chin up and it goes quiet for a bit, then it starts again. It's slow. Slower than I'd like.",
          chest: "No. He can't get a sentence out — two words and he's gasping. Really fast, shallow, and he's holding his right side. It's getting worse while I'm stood here, not better.",
          walked: "Fine. Talking my ear off. A bit fast when the leg gets moved, but he's not short of breath.",
        },
        followUps: [
          {
            id: "a_breathing_chest",
            text: "Any pain in his chest, or trouble getting a breath in?",
            answer: {
              text: "He says his side hurts when he breathes in — the right side, low down. That's the side he landed on, the lads say. He's not gasping. It's the hip and the leg he's shouting about.",
              byVariant: {
                head: "He can't tell me. He's not answering. The breathing's the noisy thing, not the chest — Kev can't see anything wrong with the chest.",
                chest: "Yes — the right side, that's what he's grabbing at. He can't get a breath in, he says it's like something's sat on it. Kev says one side of his chest isn't moving like the other.",
                walked: "He says his side's a bit sore where he landed, but he's breathing fine. It's the hip he's on about.",
              },
              tone: "urgent",
            },
          },
        ],
      },
      a_happened: {
        text: "He was on the top lift of the scaffold, the third, laying blocks. The lads reckon a board went under him — I've not been up to look. He's come down about six metres onto the ground slab, and that's concrete. He's landed on his right side with his leg under him. Before I got there two of the lads had carried him up the ladder onto the first-lift boards, out of the way of the plant, God knows why, they panicked. So he's on the first lift now, a couple of metres up, flat on his back on the boards, and I've told everyone he doesn't move again till you say.",
        byVariant: {
          head: "He was on the top lift of the scaffold, the third, laying blocks. The lads reckon a board went under him — I've not been up to look. He's come down about six metres onto the ground slab, and that's concrete, and he's gone down head first — the hat came off, it's still lying there. His leg's under him as well. Before I got there two of the lads had carried him up the ladder onto the first-lift boards, out of the way of the plant, God knows why, they panicked. So he's on the first lift now, a couple of metres up, flat on his back on the boards, and I've told everyone he doesn't move again till you say.",
        },
        tone: "urgent",
      },
      a_when: {
        text: "Four, five minutes. I was in the cabin — the shout went up, I've run over, and I rang you as soon as I'd seen him.",
      },
      a_now: {
        text: "A bit pale, and he's sweating, but he's with it — chatting away, giving the lads grief. He says his hip's killing him, more than the leg. He can't move the leg at all. He's asked for his missus twice.",
        byVariant: {
          head: "Grey. Not sweating — clammy, cold. His eyes open when Kev shouts him and then they shut again. He's not talking to us. There's a lump coming up on the side of his head you can see from here.",
          chest: "He's a bad colour — grey, going blue round the mouth — and he's sweating through his shirt. He can talk but only a word or two. He's not bothered about the leg, it's the breathing he's frightened of.",
          walked: "Fine colour, bit of a sweat on from the pain. Chatting away, giving the lads grief. Says his hip's sore and he can't move the leg. He's asked for his missus twice.",
        },
      },
      a_bleeding: {
        text: "There's blood on his trouser leg, the right shin — the trousers are torn and it's wet through, and I think the bone's come through. It's soaking, not spurting. Nothing from his head that I can see, and he had his hat on.",
        byVariant: {
          head: "From his head — there's a cut in his scalp on the right where the hat came off, and there's blood coming out of his ear, the right one. It's a lot but it's not spurting. Kev's got a towel on the scalp. The leg's bent but the trousers aren't wet.",
          walked: "A graze on the shin where the trousers are torn — a bit of blood, it's stopped. Nothing from his head, he had his hat on.",
        },
        tone: "urgent",
        followUps: [
          {
            id: "a_bleeding_pressure",
            text: "Is anyone putting pressure on it?",
            answer: {
              text: "Kev's got a clean towel from the cabin on it and he's leaning on it. He's our first aider, he's done the three-day course. He's told the lads nobody straightens that leg.",
            },
          },
        ],
      },
      a_age: {
        text: "Thirty-four. Tomasz Wozniak — Tomek. He's one of the brickies, been with us two years.",
      },
      a_history: {
        text: "Nothing I know of. He's fit, he's a big lad. His induction form's in the cabin — there's next of kin and medical on it, I'll get it pulled. No allergies on it that I remember, I'd have flagged it. He's not on anything as far as I know.",
      },
      a_count: {
        text: "Just him. Nobody else was on that lift. The two that moved him are fine — shaken up, but fine.",
      },
      a_danger: {
        text: "It's a live site but I've stopped it — nothing's moving now. The telehandler's parked up on the hard standing and the keys are in my pocket. There's open edges on the frame behind him, and the hatch on that lift's got no cover. Everyone's in hats and boots. Your crew'll want hats — I've got spares in the cabin.",
        followUps: [
          {
            id: "a_danger_height",
            text: "How high up is he, and how do you get to him?",
            answer: {
              text: "First lift — about two metres off the ground. The scaffold ladder up through the hatch, that's the only way. There's no stair tower on this side of the frame, it's not gone up yet.",
              tone: "urgent",
            },
          },
        ],
      },
      a_access: {
        text: "The site gates on Ordsall Lane — green hoarding, big double gates, the scaffold's right behind them so you can't miss it. The gates are open now, I've put a lad on them, and I'll be stood in them myself in the orange hi-vis. Come straight in — it's concrete inside, hard standing, you can drive right up to the frame.",
        followUps: [
          {
            id: "a_access_slab",
            text: "How much clear space is there on the hard standing inside the gates?",
            answer: {
              text: "The hard standing out front's about forty by twenty and it's flat. The telehandler's on it, and a couple of pallets of blocks by the cabins. What do you need it for?",
            },
          },
        ],
      },
      a_with: {
        text: "I'm at the bottom of the ladder looking up at him. Kev's up there with him, and one of the other lads holding his head still. I can go up if you want me to.",
      },
      a_instructions: {
        text: "Yes. Go on. Kev's first-aid trained — I'll shout it up to him, he'll do it.",
      },
      a_details: {
        text: "Dean Prescott, site manager, Pendleton Frame. It's my work mobile — 07700 900834.",
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "Hang on — Kev, keep him FLAT. Don't let him — sorry. He keeps trying to sit himself up to look at the leg. Kev's got him.",
        tone: "urgent",
        excludesVariantIds: ["head"],
      },
      {
        atSec: 45,
        text: "Hang on — Kev, is he breathing? Is he — sorry. He'd gone quiet. He's snoring again, Kev's got his chin up. Sorry. Go on.",
        tone: "critical",
        requiresVariantIds: ["head"],
      },
      {
        atSec: 100,
        text: "Can you tell me what's coming, and how long? I've a man on the boards with a leg like that and twenty lads stood round looking at me. I need to tell him something.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 160,
        text: "The lads are saying he went off backwards, arms out. The board he was stood on's still up there — cracked clean through, like they said. I'll leave it where it is for the HSE.",
      },
      {
        atSec: 220,
        text: "I can hear you — that's a siren on Regent Road. Gates are open, I'm stood in them, orange vest, white hat. Tell them straight in onto the hard standing, and tell them he's on the first lift, not the ground.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Right. Good. Gates are open — I'll be in them. Tell them to come straight in onto the hard standing, and tell them he's up on the boards, not on the ground. They'll want to think about how they're getting him down flat.",
  },
};
