import type { Scenario } from "../incident_types";

// Scenario 54 — anti-social behaviour, youths on a roof, Haughton Green,
// Denton.
//
// The low-priority job that punishes you for leaving it. Five or six
// kids on the flat roof of the estate parade throwing stones at the cars
// and the bus stop. Nobody hurt, nobody threatened, a Grade 3, and there
// is always something louder on the stack. The temptation is to leave
// it, because most nights they get bored and come down, and most nights
// that is exactly what happens.
//
// The roof is the risk, not the stones. A parade roof is seven metres of
// wet felt with a knee-high parapet and roof lights in it, and
// fourteen-year-olds walk along the edge to make each other laugh. So
// the script carries a roll: if nobody has attended by twelve minutes,
// on six nights in ten one of them comes off the back of it. That is a
// fall from height onto concrete behind a padlocked gate, a child with
// spinal signs, and the job is a Grade 1 with a fifteen-minute clock
// that started the moment he landed. Ambulance, a pump for the ladder
// and the gate, a second car for the mother and the crowd, all at once,
// and all of it avoidable with one car sent when one was free.
//
// GRADING. GMP has not used a Grade 3 since February 2022. On the
// force's own ladder this is a Grade C (Central Resolution) or Grade L
// (Local Tasking) job with no published attendance time. The simulator
// keeps the generic THRIVE 1–4 scale so the three services' grades sit
// side by side, and callGrade.basis says so.
//
// REAL: Mancunian Road, Tatton Road and Two Trees Lane; the estate
// parade beside the Tesco Express; the Haughton Green Oasis centre; the
// bus stop opposite (TfGM 1800EH18121, "Mancunian Road/Library").
// AUTHORED, not surveyed: the parade's construction (two storeys, flat
// felt roof, parapet, roof lights), the rear yard and its gate, and the
// way up. FICTIONAL: everyone in it, the takeaway, both house numbers,
// and the parade's history on the district log.

export const scenario54: Scenario = {
  id: "54",
  slug: "54_asb_youths_denton",
  title: "Anti-social behaviour — youths on the parade roof, Mancunian Road, Denton",
  type: "police_asb_youths",
  patch: "Eastern",
  severity: "moderate",
  trigger:
    "Resident reports five or six youths on the flat roof of the shopping parade on Mancunian Road, Haughton Green, throwing stones at parked cars and the bus stop. Nobody hurt. Grade 3",

  location: {
    address: "Shopping parade, Mancunian Road, Haughton Green, Denton",
    postcode: "M34 7NP",
    coords: { lat: 53.4439, lng: -2.1012 },
  },

  property: {
    class: "1960s estate shopping parade — six shop units, two storeys, flat felt roof with a low parapet",
    size: "About 90 m of frontage onto Mancunian Road; single-storey stores and a gated service yard at the rear",
    materials: "Brick and concrete frame, felt flat roof about 7 m up, knee-high parapet, roof lights",
    occupants:
      "Five or six youths aged about 13–15 on the roof. Takeaway and off-licence still open underneath with customers; the other units shut. People at the bus stop opposite",
    vulnerabilities: [
      "Children at height — the parapet is knee-high, the felt is wet and there are roof lights in it",
      "Stones landing on a public road, a forecourt and a bus stop",
      "A padlocked service yard between the rear of the roof and anybody who might have to reach it",
    ],
    access:
      "Mancunian Road frontage, two-way with forecourt parking. Tatton Road wraps the rear. The service yard gate is padlocked once the shops shut — keyholder is the takeaway. The youths reach the roof off the bin store and a drainpipe; a 13.5 m ladder reaches it properly",
    knownHazards: [
      "Working at height — flat roof about 7 m, low parapet, roof lights",
      "Stones being thrown onto Mancunian Road and the forecourt",
      "Rear service yard gate padlocked",
    ],
    firstDueStationId: "MP-TAM",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — retail parade, not a risk-assessed premises.",
      "Repeat anti-social behaviour location on the district log: youths on this roof reported four times since the clocks went back. Nothing above a Grade 3 before tonight.",
      "Rear service yard gate is padlocked after the shops shut. Keyholder is the takeaway at the east end of the parade (on record).",
      "The neighbourhood team have names for the regulars. 12 Tatton Road is one of the addresses.",
    ],
  },

  methane: {
    M: "No",
    E: "Shopping parade, Mancunian Road, Haughton Green, Denton, M34 7NP",
    T: "Anti-social behaviour — youths on a flat roof throwing stones. Becomes a fall from height if one comes off",
    H: "Height — flat roof about 7 m with a low parapet and roof lights; stones onto the road; padlocked yard at the rear",
    A: "Mancunian Road frontage; Tatton Road to the rear. Yard gate padlocked — key with the takeaway",
    N: "None injured at the point of call. Five or six youths aged about 13–15 on the roof",
    emergencyServices:
      "Police only at the point of call. Ambulance and one fire pump if anyone comes off the roof or will not come down",
  },

  pda: [
    {
      id: "police1",
      label: "Police — first response",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      preferredStationId: "MP-TAM",
      notes:
        "The whole attendance while it is stones. One unit, when one is free — and sooner than the grade suggests, because the roof is the risk, not the stones",
    },
    {
      id: "police2",
      label: "Police — second unit",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      preferredStationId: "MP-TAM",
      notes:
        "Not on the initial attendance. If one comes off the roof this is the scene, the witnesses, the mother and a dozen people filming, and one crew cannot hold all of it",
    },
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      preferredStationId: "A-DUK",
      notes:
        "Only if somebody comes off the roof. A fourteen-year-old off seven metres onto concrete is spinal precautions and a paediatric major trauma centre, not the nearest A&E",
    },
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: [],
      preferredStationId: "G42",
      notes:
        "Only if somebody is still up there, or somebody is down and the gate is shut. A 13.5 m ladder reaches a parade roof and bolt croppers open a padlock. No aerial, and no officer up a drainpipe",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Attendance", target: "a unit assigned within 5 minutes of the call, Grade 3 or not" },
      { metric: "Regrade", target: "ambulance mobilised within 60 seconds of a fall being reported" },
      {
        metric: "Spinal precautions",
        target: "scoop or board and a paediatric major trauma centre, not a walk to the ambulance and the nearest A&E",
      },
      {
        metric: "Working at height",
        target: "a pump and a ladder for anyone still on the roof — nobody climbs a drainpipe after him",
      },
      { metric: "Proportion", target: "one car while it is stones; police, ambulance and one pump once it is not" },
    ],
    lesson:
      "Nobody is hurt and there is a car free, and the temptation is to leave it because in an hour they will be bored and gone, which is true most nights. The roof is the risk, not the stones. A parade roof is seven metres of wet felt with a kerb round it and a drainpipe for a ladder, and fourteen-year-olds walk along the edge to make each other laugh. Send the one car while it is a Grade 3 and it stays one. Leave it and some nights it becomes a fall from height with a child on the concrete behind a padlocked gate, and then you are finding an ambulance, a pump for the ladder and a second car for his mother all at once, against a fifteen-minute clock that started the moment he landed.",
  },

  // Schematic, not to compass: Mancunian Road actually runs north-east to
  // south-west along the parade's front. Drawn here with the road across
  // the top, the parade below it, the gated yard behind, and Tatton Road
  // wrapping the back.
  scene: {
    viewBox: { x: -90, y: -70, width: 180, height: 140 },
    compassNorth: "up",
    // Through the gate and forty metres of yard on a scoop, once the
    // padlock is off. Nothing on wheels goes past the gate.
    egressExtraSeconds: 180,
    egressBlocked: [
      {
        action: "trolley",
        reason: "Padlocked gate and a kerb — the trolley waits on the service road and he comes to it on a scoop",
      },
    ],
    buildings: [
      { shape: { x: -45, y: -14, w: 90, h: 16 }, kind: "target", label: "Parade — six units, flat roof" },
      { shape: { x: -84, y: -16, w: 26, h: 26 }, kind: "neighbour", label: "Tesco Express" },
      { shape: { x: -40, y: 2, w: 10, h: 5 }, kind: "other", label: "Bin store — the way up" },
      { shape: { x: 74, y: -20, w: 14, h: 30 }, kind: "other", label: "Haughton Green Oasis centre" },
      { shape: { x: -80, y: 44, w: 60, h: 14 }, kind: "neighbour", label: "Tatton Road — houses (No. 12 among them)" },
      { shape: { x: -10, y: 44, w: 60, h: 14 }, kind: "neighbour", label: "Tatton Road — houses" },
      { shape: { x: -60, y: -66, w: 50, h: 16 }, kind: "neighbour", label: "Mancunian Road — houses (caller at No. 41)" },
      { shape: { x: 0, y: -66, w: 50, h: 16 }, kind: "neighbour", label: "Mancunian Road — houses" },
    ],
    roads: [
      { shape: { x: -90, y: -40, w: 180, h: 10 }, kind: "road", label: "Mancunian Road" },
      { shape: { x: -90, y: -30, w: 180, h: 3 }, kind: "pavement" },
      { shape: { x: -45, y: -27, w: 90, h: 13 }, kind: "driveway", label: "Forecourt parking" },
      { shape: { x: -56, y: -27, w: 8, h: 29 }, kind: "driveway", label: "Service road — padlocked gate" },
      { shape: { x: -50, y: 2, w: 100, h: 12 }, kind: "driveway", label: "Rear service yard" },
      { shape: { x: 62, y: -40, w: 8, h: 110 }, kind: "road", label: "Tatton Road" },
      { shape: { x: -90, y: 30, w: 160, h: 8 }, kind: "road", label: "Tatton Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -30, y: -21 }, kind: "car", label: "Parked cars — where the stones land" },
      { pos: { x: 0, y: -21 }, kind: "car" },
      { pos: { x: 30, y: -21 }, kind: "car" },
      { pos: { x: -20, y: -43 }, kind: "other", label: "Bus stop — Mancunian Road/Library" },
      { pos: { x: -20, y: 8 }, kind: "car", label: "Takeaway's van — the step up" },
      { pos: { x: -70, y: -28 }, kind: "lamppost" },
      { pos: { x: 58, y: -28 }, kind: "lamppost" },
      { pos: { x: 80, y: 32 }, kind: "tree" },
    ],
    hazards: [
      {
        id: "roof-edge",
        pos: { x: 0, y: -12 },
        kind: "structural",
        label: "Youths on the flat roof — about 7 m, knee-high parapet, walking the edge",
        knownFromPri: true,
      },
      {
        id: "missiles",
        pos: { x: 0, y: -22 },
        kind: "structural",
        label: "Stones coming off the roof onto the forecourt, the road and the bus stop",
        knownFromPri: true,
      },
      {
        id: "yard-gate",
        pos: { x: -52, y: -10 },
        kind: "structural",
        label: "Service yard gate padlocked — keyholder is the takeaway; the youths climb it",
        knownFromPri: true,
      },
      {
        id: "roof-lights",
        pos: { x: 20, y: -6 },
        kind: "structural",
        label: "Fragile roof lights in the flat roof — nobody follows them up without a ladder and a plan",
        knownFromPri: false,
        discoverAfterMinOnScene: 2,
      },
    ],
    casualties: [
      // Absent unless the fall beat fires. revealCasualty flips him in.
      {
        id: "cas-54-fall",
        pos: { x: -8, y: 6 },
        severity: "serious",
        presentProbability: 0,
        discoverAfterMinBa: 0,
        label: "Male, 14 — fall from the roof onto the service yard",
        clinical: {
          // Hurt and frightened rather than shocked: a fast pulse, a
          // normal pressure, talking. The spine is the whole question.
          vitals: { rr: 22, spo2: 97, hr: 114, bpSys: 108, bpDia: 66, gcs: 15, temp: 36.4, bm: 5.6 },
          ageYears: 14,
          presumedCondition:
            "Fall from height, about 7 m onto concrete — lower back pain, altered sensation in both feet, closed deformity of the left wrist",
          redFlags: ["spinal_injury_suspected"],
          // Under sixteen, off more than twice his own height: paediatric
          // major trauma, which in Greater Manchester means RMCH.
          preferredDestination: "mtc",
          criticalInterventions: ["spine_board", "iv_access"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Mancunian Road frontage", face: "front", bearingDeg: 0 },
      { id: 2, label: "Sector 2 · Service road / gate", face: "left", bearingDeg: 270 },
      { id: 3, label: "Sector 3 · Rear yard", face: "rear", bearingDeg: 180 },
      { id: 4, label: "Sector 4 · Tatton Road / Oasis centre", face: "right", bearingDeg: 90 },
    ],
  },

  // The caller is a resident across the road with a bedroom window on the
  // parade. Everything before the fall is a Grade 3 in her voice; the
  // fall is the roll, and everything after it hangs off it.
  informantScript: [
    {
      id: "first",
      atSec: 5,
      text: "It's the shops on Mancunian Road in Haughton Green, the parade next to the Tesco. There's a gang of kids on the roof — five or six of them, and they're only young, thirteen, fourteen. They're throwing stones down at the cars on the front. I'm across the road, I can see them from my bedroom window.",
      tone: "urgent",
    },
    {
      id: "stones",
      atSec: 60,
      text: "One's just hit my car, I heard it go. They're throwing at the bus stop now — there's two women stood there with a pram and they've had to come away from it. The takeaway's still open underneath, there's people going in and out.",
      tone: "urgent",
    },
    {
      id: "named",
      atSec: 150,
      text: "I know one of them. It's Kieran, the Whittaker lad from number 12 Tatton Road, round the back. He's fourteen. His mum works evenings, she's only up the road but she'll not be in till ten. They get up round the back — there's a bin store against the wall and they go off the roof of the takeaway's van on to it and up the drainpipe. The gate's padlocked but they just climb it.",
      tone: "info",
    },
    {
      // Only on a slow response, and not every time.
      id: "slow",
      atSec: 420,
      delayThresholdSec: 420,
      probability: 0.75,
      text: "Is anybody actually coming? It's been getting on for ten minutes. They're sat on the edge now with their legs hanging over, and one of them's walking along the top of the back wall like it's a kerb. It's been raining, that roof will be like glass.",
      tone: "urgent",
    },
    // --- The roll. Nobody there by twelve minutes: six nights in ten one
    // of them comes off. This is the regrade — from here it is a Grade 1
    // with a casualty, and the ambulance and the pump stop being optional.
    {
      id: "fall",
      atSec: 720,
      delayThresholdSec: 720,
      probability: 0.6,
      suppressesIds: ["dispersed"],
      text: "Oh God. One's gone off the back. He's gone off the back of the roof — I heard him land. The others are screaming. I'm going over there. Send an ambulance, send an ambulance now.",
      tone: "critical",
      effect: { pulseCritical: true, revealCasualty: "cas-54-fall" },
    },
    {
      id: "fall-detail",
      atSec: 775,
      requiresFiredIds: ["fall"],
      text: "I'm at the gate, I can see him through it. It's Kieran, it's the Whittaker lad. He's on the concrete by the bins, on his back. He's awake, he's crying — he says his back hurts and he can't feel his feet properly, and his wrist's the wrong shape. His mates are trying to sit him up and I'm shouting at them to leave him be. The gate's padlocked, I can't get in to him.",
      tone: "critical",
    },
    {
      id: "roof-stranded",
      atSec: 835,
      requiresFiredIds: ["fall"],
      probability: 0.7,
      text: "There's still one up there. He's sat down on the roof right by the edge where the other one went and he won't move — he's shaking, he says he can't do the drainpipe. The rest have gone over the back fence.",
      tone: "urgent",
    },
    {
      id: "parent",
      atSec: 920,
      requiresFiredIds: ["fall"],
      probability: 0.6,
      text: "His mum's here, somebody rang her from the takeaway. She's climbed the gate and she's in there with him, and she's screaming at the other kids. There must be a dozen people round the back now, all of them filming.",
      tone: "urgent",
    },
    {
      // The other nights. Nobody came, nobody fell, and they got bored,
      // which is what the operator who left it was counting on.
      id: "dispersed",
      atSec: 1000,
      probability: 0.7,
      text: "They've come down. They went off the back and over the fence towards Two Trees Lane, the lot of them — it's gone quiet. I still want somebody to come, mind. There's a dent in my bonnet and it's not the first time.",
      tone: "info",
    },
  ],

  callGrade: {
    scale: "police_thrive",
    grade: 2,
    standardMinutes: 60,
    basis:
      "Graded 3 on the simulator's generic THRIVE ladder: nuisance and damage, nobody hurt, no immediate risk stated by the caller. GMP itself has not used a Grade 3 since February 2022 — on the force's own ladder this is a Grade C (Central Resolution) or Grade L (Local Tasking) job with no published attendance time (GMP FOI 01/FOI/24/012708/K, 28 Jun 2024). The 'scheduled' label is generic, not GMP wording. If one comes off the roof it is a Grade 1 with GMP's 15-minute aspired attendance (Chief Constable's Regulation 28 response, 26 Aug 2025)",
  },

  // The call as Janet has it: on her mobile at the upstairs front window
  // of no. 41 with the light off, looking straight across Mancunian Road
  // at six shapes on a wet flat roof and her own car on the forecourt
  // under them. She has rung about this lot before. She is not
  // frightened yet. She is waiting to be.
  call: {
    caller: {
      name: "Janet Hough",
      phone: "07700 900431",
      relation: "Resident at no. 41 Mancunian Road, across the road from the parade — has rung about the same group before",
      where: "Her upstairs front window at no. 41, light off, looking straight across at the parade roof and the forecourt",
      line: "mobile",
      state: "calm",
    },
    opening:
      "Hello, yes — it's Haughton Green, the parade of shops on Mancunian Road, next to the Tesco. There's kids up on the roof of it again, five or six of them, and they're throwing stones down — at the cars on the front, at the bus stop. I'm at number 41, straight over the road from it, I'm watching them now from upstairs. I've rung you about this lot before.",
    deflection: "I've told you what's happening — there's children on a roof throwing stones. Are you sending somebody or not?",
    reassurance: {
      text: "Janet, I've got it. I'm getting a car to you. Keep watching them for me and tell me if anything changes.",
      reply: "Right. I'm here. I'm not going anywhere, I've a good view.",
    },
    answers: {
      p_happening: {
        text: "There's five, maybe six kids on the flat roof of the shops — the parade on Mancunian Road, next to the Tesco. They're picking stones up off the roof, it's a felt roof with gravel on it, and lobbing them down at the cars on the forecourt and across the road at the bus stop. Nobody's been hit that I've seen. Not yet. They've been up there a good quarter of an hour.",
        followUps: [
          {
            id: "p_happening_below",
            text: "Is there anyone underneath them — on the forecourt, at the bus stop?",
            answer: {
              text: "There's a couple of cars on the forecourt, mine's one of them. The off-licence is still open, there's a lad stood outside it on his phone with no idea what's above him. And there's always somebody at that stop — there's two there now.",
              tone: "urgent",
            },
          },
        ],
      },
      p_ongoing: {
        text: "Yes — they're still up there and they're still throwing. One's just bent down for another handful. They're not bothered who sees them. They're laughing.",
      },
      p_weapons: {
        text: "Weapons? No. Stones. Bits of the roof, the gravel off it — one of them had a bit of a stick earlier and he's thrown that. Nothing else. They're thirteen, fourteen. It's stones.",
      },
      p_injured: {
        text: "No, nobody's hurt. Nobody's been hit that I've seen. It's the cars that are getting it, and the bus shelter — I heard one go off the glass. They don't think, do they. They don't think where it lands.",
      },
      p_who: {
        text: "Five or six of them. Boys, I think, all of them — hoods up, so I'll not swear to it. Young. Thirteen, fourteen, fifteen at the very most. Nobody with them, nobody in charge of them. That's the point.",
      },
      p_description: {
        text: "Dark clothes, all of them, hoods up. One's in a grey tracksuit, lighter than the rest — he's the one doing most of the throwing. One's smaller than the others, he's stopping back near the middle of the roof. It's dark and they've their hoods up. I'm not going to give you faces from here.",
      },
      p_direction: {
        text: "They're not going anywhere, they're on a roof. They got up round the back somewhere — I can't see the back from here, I've only the front. If they come down it'll be the back, the way they went up, and then they'll be off across the estate. They'll not come down the front, there's nothing to climb.",
      },
      p_drink: {
        text: "I couldn't tell you. They're kids. They're daft with it, but I'd not say they're drunk — they're too quick on their feet for that, more's the pity.",
      },
      p_known: {
        text: "I know the faces — it's the same lot every time, they're off the estate round the back. I couldn't swear to who's who from here, it's dark and they've hoods up. If one of them turns round under the light I'll tell you.",
      },
      p_vulnerable: {
        text: "Them. They're children on a flat roof, two storeys up, and there's only a little kerb of a wall round the edge — it's knee high. It's wet up there, it's been raining. Nobody else is at risk except whoever's under a stone. But if one of them comes off that roof it's concrete.",
        tone: "urgent",
        followUps: [
          {
            id: "p_vulnerable_edge",
            text: "How close to the edge are they?",
            answer: {
              text: "Right on it. They have to be, to throw — they stand at the front wall and lean over to watch where it lands. Every time one of them leans I hold my breath.",
              tone: "urgent",
            },
          },
        ],
      },
      p_where: {
        text: "The parade on Mancunian Road, Haughton Green — the row of shops right next to the Tesco Express, where Tatton Road comes round the back. M34 7NP. The bus stop opposite is the Library one. I'm at number 41, straight across the road, in the upstairs front.",
      },
      p_safe: {
        text: "I'm in my bedroom with the light off so they can't see me watching. I'm fine. My car's not — it's on the forecourt, it's under them. I'm not going out to move it while they're throwing.",
      },
      p_seen: {
        text: "I'm watching them now. I've been watching since they went up. Nobody's told me anything — I'm looking straight at them.",
      },
      p_details: {
        text: "Janet Hough — H-O-U-G-H. 41 Mancunian Road, straight across from the parade. This is my mobile, 07700 900431. You've had it before.",
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "That's another one gone — a big one, that. It's bounced off the forecourt and out into the road, there's a car had to swerve round it.",
        tone: "urgent",
      },
      {
        atSec: 100,
        text: "Are you sending anybody, or is it going on the list again? I've rung twice this month and nobody's come either time. I'm not being funny, but it's kids on a roof.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 150,
        text: "They're daring each other now. One's stood right up on the front wall with his arms out like he's on a diving board, and the others are egging him on. Oh, get down. Get down, you daft —",
        tone: "urgent",
      },
      {
        atSec: 200,
        text: "Right — if they're coming, tell them to come along from the Tesco end, not straight up the front. If the kids see a car they'll bolt over the back, and that's the wrong way to bolt on a wet roof.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Thank you. I'll keep watching. Tell them the Tesco end — and tell them they're only kids, but they're kids on a roof.",
  },
};
