import type { Scenario } from "../incident_types";

// Scenario 42 — fail to stop, A57 Hyde Road, Gorton.
//
// The job the operator does not get to run. A response car tries to stop
// a grey Golf at Belle Vue and it goes, eastbound, sixty in the thirty.
// From that second the pursuit belongs to the pursuing driver and to the
// control room's pursuit tactical adviser: the driver follows and
// commentates, the TacAd advises, the control room grants or withdraws
// the authority to continue. The desk's own job is narrower and faster —
// get the things moving that take time (two tactical-phase RPU cars, the
// aircraft, the dog), hold an ambulance, and carry the proportionality
// question the whole way: what is he wanted for, and what is the risk
// right now?
//
// The wording of authority, phases and discontinuance follows the College
// of Policing APP 'Police pursuits' (updated 4 March 2026): an initial-
// phase driver may be authorised to continue but no tactics exist until a
// tactical-phase advanced driver is behind it with a pursuit commander
// named; the decision to discontinue can be made by the drivers or by
// control room staff, and must be made as soon as the risk becomes
// disproportionate to the reason for the pursuit; once discontinued,
// every authority is withdrawn and a new one is needed to go again. GMP's
// own pursuit policy was not obtained — this is the national APP.
//
// The informant is the control room relaying the pursuing officer's
// commentary — speeds, direction, red lights, pedestrians — so the beats
// are in the desk's voice, not a caller's. Three things happen, on the
// clock and on the dice:
//   - it turns into the 20 mph estate south of Hyde Road, which is the
//     abandon trigger: a stolen Golf and one lad in it does not buy that;
//   - ~35% of nights it crashes anyway after the police drop back, and
//     the driver becomes a live patient (head injury, airway) — the
//     ambulance is then the whole job;
//   - the rest, it is dumped on Far Lane and he goes over the fences onto
//     the Fallowfield Loop, and the dog and the aircraft take over.
//
// Engine note: the informant stops when the first mobilised unit lands
// at the CAD position. A pursuit through Gorton is over in four minutes,
// so the script is compressed to match — the branches roll at ~2¼
// minutes. The dog van at Openshaw is close enough to end the commentary
// early on a fast send, which is the engine's limitation and not a
// reason to send it late.
//
// FICTIONAL: the officer, the keeper, the driver, the Golf and its plate,
// and every house number. Hyde Road, Belle Vue station, the Garratt Way
// retail park, the estate streets, Reddish Lane and the Fallowfield Loop
// are real.

export const scenario42: Scenario = {
  id: "42",
  slug: "42_pursuit_hyde_road",
  title: "Fail to stop — A57 Hyde Road",
  type: "police_fail_to_stop_pursuit",
  patch: "Southern",
  severity: "high",
  trigger:
    "Response car AP314 attempted to stop a grey VW Golf on the A57 Hyde Road at Belle Vue — failed to stop, made off eastbound at speed. Officer single-crewed, commentating, asking for pursuit authority",

  location: {
    address: "A57 Hyde Road, Gorton, Manchester — east of Belle Vue station",
    postcode: "M18 7AF",
    coords: { lat: 53.4621, lng: -2.1785 },
  },

  property: {
    class:
      "Urban A-road — A57 Hyde Road through Gorton, four lanes, 30 mph, retail frontage north and housing south",
    size:
      "About two and a half kilometres of the A57 from Belle Vue to the Reddish Lane lights at Debdale, with a 20 mph residential grid along the whole south side",
    occupants:
      "Evening traffic both ways; pedestrians at the crossings and bus stops; the estate south of the road has people out on it",
    vulnerabilities: [
      "Pedestrian crossings and bus stops the length of the road — people step into it",
      "The estate south of Hyde Road is 20 mph, parked both sides, children out on bikes",
      "The pursuing officer is single-crewed and initial-phase trained — he can follow, he cannot end it",
      "The Fallowfield Loop runs along the south edge of the estate — a driver who dumps the car and goes over the fences is gone in seconds",
    ],
    access:
      "The scene moves. The CAD holds the point of the attempted stop, just east of Belle Vue station. RPU join from Ashton and from Eccles; NPAS from Barton; the dog from Openshaw. Nothing needs to reach this point — everything needs to reach wherever the Golf stops",
    knownHazards: [
      "Speeds of sixty and more in a 30 limit",
      "Red lights and pedestrian crossings run against the signal",
      "Oncoming lane used to overtake",
      "A 20 mph housing estate immediately south of the road",
    ],
    firstDueStationId: "MP-MCR",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — public highway. The 'scene' is wherever the Golf is; the CAD holds the point of the attempted stop.",
      "Pursuit authority sits with the control room, on the pursuit tactical adviser's advice (College of Policing APP, Police pursuits). An initial-phase driver follows and commentates; only a tactical-phase driver in a suitable vehicle, with a pursuit commander named, can bring it to an end. There are no tactics until one is behind it.",
      "Local knowledge: eastbound the A57 runs to the Reddish Lane lights at Debdale and on into Denton. South of Hyde Road is a 20 mph grid — Williams Road, Bakewell Street, Haworth Road, Far Lane, Old Hall Drive — parked solid, with the Fallowfield Loop (the old railway, now a cycle path) along its southern edge. That path is a decamp's natural line.",
      "The Golf carries a STOLEN report and an ANPR marker. The keeper is a burglary victim in Reddish, not the driver.",
    ],
  },

  methane: {
    M: "No",
    E: "A57 Hyde Road, Gorton, M18 — eastbound from Belle Vue; the position moves with the pursuit",
    T: "Fail to stop — stolen grey VW Golf, one occupant, one single-crewed response car behind it in the initial phase; pursuit authority sought",
    H: "Speed in a 30 limit; red lights and crossings; oncoming lane used to overtake; a 20 mph estate south of the road; a decamp across the Fallowfield Loop",
    A: "Not fixed. RPU from Ashton and Eccles, NPAS from Barton, dog from Openshaw — all to wherever it ends, not to the point of the stop",
    N: "None injured yet. The public on Hyde Road and in the estate are the ones at risk; one occupant in the Golf",
    emergencyServices:
      "Police-led — two tactical-phase RPU, NPAS, dog. Ambulance pre-alerted and held; committed only if it crashes",
  },

  // Four police slots is the real shape of a GMP fail-to-stop: the
  // response car already behind it is not the operator's to send, so the
  // attendance is what the initial phase cannot supply — tactical-phase
  // drivers, the aircraft, and a dog for the end of it.
  pda: [
    {
      id: "rpu1",
      label: "RPU 1 — tactical phase, pursuit commander",
      service: "Police",
      requiredApplianceTypes: ["Police_RPU"],
      requiredCapabilities: ["Police_Roads"],
      preferredStationId: "MP-RPU-ASH",
      notes:
        "The pursuit is not the response car's to keep. A tactical-phase advanced driver in a suitable vehicle takes primary and a pursuit commander is named from that car. Until one is behind it there are no tactics — only following",
    },
    {
      id: "rpu2",
      label: "RPU 2 — tactical options ahead",
      service: "Police",
      requiredApplianceTypes: ["Police_RPU"],
      requiredCapabilities: ["Police_Roads"],
      preferredStationId: "MP-RPU",
      notes:
        "Second tactical-phase car. Tyre deflation at the Reddish Lane lights ahead of it, or the second car that any box needs. One RPU cannot end a pursuit on its own",
    },
    {
      id: "npas",
      label: "NPAS — overhead",
      service: "Police",
      requiredApplianceTypes: ["Police_NPAS"],
      requiredCapabilities: ["Police_Air"],
      preferredStationId: "MP-NPAS",
      notes:
        "The aircraft is what lets the cars drop back. Ask in the first minute — it needs lifting time from Barton and the pursuit will not last that long. It earns its keep on the decamp",
    },
    {
      id: "dog",
      label: "Dog unit",
      service: "Police",
      requiredApplianceTypes: ["Police_Dog"],
      requiredCapabilities: ["Police_Dog"],
      preferredStationId: "MP-TAC",
      notes:
        "For the decamp, not the pursuit. A track from a warm car onto the Fallowfield Loop is what finds him; four officers running through back gardens is not",
    },
    {
      id: "dca",
      label: "Ambulance — held",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      preferredStationId: "A-CEN",
      notes:
        "Not for the pursuit. Pre-alert NWAS and hold a crew at the Hyde Road end. On the night it crashes the ambulance is the whole job and the head injury goes to the MTC",
    },
  ],

  evaluation: {
    targets: [
      {
        metric: "Tactical-phase cars mobilised",
        target: "both RPU moving within 60 seconds of the relay — nothing can end this until they are behind it",
      },
      {
        metric: "Aircraft requested",
        target: "NPAS asked for inside two minutes, before the pursuit needs it rather than after",
      },
      {
        metric: "Discontinuance",
        target: "pursuit called off as it enters the estate — a stolen Golf against a 20 limit with children on it is not a close call",
      },
      {
        metric: "Decamp plan",
        target: "dog and aircraft on the Fallowfield Loop within five minutes of the car being dumped",
      },
      {
        metric: "Crash night",
        target: "ambulance with the driver inside 15 minutes of the crash and the head injury conveyed to the MTC",
      },
    ],
    lesson:
      "The pursuit is not yours to run and it is not the response driver's to keep. Your job in the first minute is to get the things moving that take time — two tactical-phase cars, the aircraft, the dog — because a pursuit through Gorton is over in four minutes and none of those is four minutes away. Then carry the proportionality question the whole way: what is he wanted for, and what is the risk right now? A stolen Golf and one lad in it does not buy a run through a 20 limit with children on the pavement, and the moment it turns into the estate the answer is discontinue — lights off, drop back, authority withdrawn, and a new authority needed before anyone goes again. That is not the end of the job. The car stops somewhere, and when it does the dog and the aircraft find him — or, on the night he has put it into a parked car first, the ambulance you held at the Hyde Road end is the whole job.",
  },

  // Top-down — 160 m of Hyde Road just east of Belle Vue station, the
  // point of the attempted stop. Retail frontage and the Garratt Way
  // park to the north; the 20 mph estate to the south. Everything the
  // pursuit does after this happens off the edge of the drawing, which
  // is the point of the drawing.
  scene: {
    viewBox: { x: -80, y: -40, width: 160, height: 80 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -78, y: -36, w: 44, h: 22 }, kind: "neighbour", label: "Retail units — Hyde Road frontage" },
      { shape: { x: -28, y: -36, w: 106, h: 22 }, kind: "neighbour", label: "Garratt Way retail park (Aldi, Tesco Extra beyond)" },
      { shape: { x: -78, y: 14, w: 26, h: 12 }, kind: "other", label: "Belle Vue station — entrance" },
      { shape: { x: -46, y: 14, w: 60, h: 22 }, kind: "neighbour", label: "Terraced housing — Williams Road" },
      { shape: { x: 30, y: 14, w: 48, h: 22 }, kind: "neighbour", label: "Estate — Bakewell Street / Haworth Road" },
    ],
    roads: [
      { shape: { x: -80, y: -11, w: 160, h: 3 }, kind: "pavement", label: "Pavement (north)" },
      { shape: { x: -80, y: -8, w: 160, h: 16 }, kind: "road", label: "A57 Hyde Road — eastbound is the far side" },
      { shape: { x: -80, y: 8, w: 160, h: 3 }, kind: "pavement", label: "Pavement (south)" },
      { shape: { x: 20, y: 11, w: 8, h: 29 }, kind: "road", label: "Side road into the estate (20 mph)" },
      { shape: { x: -78, y: 26, w: 26, h: 10 }, kind: "driveway", label: "Railway cutting — Hope Valley line" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -60, y: 4 }, kind: "car", label: "Traffic — westbound" },
      { pos: { x: -20, y: 4 }, kind: "car" },
      { pos: { x: 40, y: -4 }, kind: "car", label: "Traffic — eastbound" },
      { pos: { x: 66, y: -4 }, kind: "car" },
      { pos: { x: -6, y: -12 }, kind: "other", label: "Signal crossing" },
      { pos: { x: -6, y: 9 }, kind: "other", label: "Signal crossing" },
      { pos: { x: -40, y: 9 }, kind: "other", label: "Bus stop" },
      { pos: { x: 50, y: -12 }, kind: "other", label: "Bus stop" },
      { pos: { x: -70, y: -12 }, kind: "lamppost" },
      { pos: { x: 10, y: -12 }, kind: "lamppost" },
      { pos: { x: 70, y: 9 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "speed",
        pos: { x: 50, y: -4 },
        kind: "structural",
        label: "Golf eastbound at sixty-plus in the 30 — one single-crewed response car behind it, initial phase only",
        knownFromPri: true,
      },
      {
        id: "crossings",
        pos: { x: -6, y: 0 },
        kind: "structural",
        label: "Signal crossings and bus stops — people on both pavements, some of them stepping into the road",
        knownFromPri: true,
      },
      {
        id: "oncoming",
        pos: { x: -30, y: 4 },
        kind: "structural",
        label: "Oncoming lane used to overtake — traffic westbound has nowhere to go",
        knownFromPri: true,
      },
      {
        id: "estate",
        pos: { x: 24, y: 24 },
        kind: "structural",
        label: "20 mph estate south of Hyde Road — parked both sides, children out. The abandon trigger",
        knownFromPri: true,
      },
    ],
    casualties: [
      // Present only on the ~35% of nights the crash beat fires —
      // revealCasualty flips him from absent to present at that moment.
      // Drawn in the estate mouth because that is the only place on the
      // sheet the crash could be; on the ground it is a few streets in.
      {
        id: "cas-42-driver",
        label: "Driver, M, 23 — unrestrained, head injury, airway noisy",
        pos: { x: 24, y: 20 },
        severity: "critical",
        presentProbability: 0,
        discoverAfterMinBa: 0,
        clinical: {
          // Frontal impact into a parked car at speed, no belt. Reduced
          // GCS with a noisy airway and vomiting — the airway is the job
          // before anything else, and the neck is assumed until somebody
          // clears it. Not shocked: the pressure is up, not down.
          vitals: { rr: 22, spo2: 93, hr: 108, bpSys: 138, bpDia: 84, gcs: 12, temp: 36.6, bm: 6.1 },
          ageYears: 23,
          presumedCondition:
            "Head injury with reduced consciousness and a compromised airway — unrestrained driver, high-speed frontal impact",
          redFlags: ["head_injury_severe", "airway_compromise", "spinal_injury_suspected"],
          preferredDestination: "mtc",
          criticalInterventions: ["oxygen", "spine_board", "iv_access"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Hyde Road west / Belle Vue", face: "left", bearingDeg: 270 },
      { id: 2, label: "Sector 2 · Hyde Road east — direction of travel", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Estate south / Fallowfield Loop", face: "rear", bearingDeg: 180 },
      { id: 4, label: "Sector 4 · Retail park north", face: "front", bearingDeg: 0 },
    ],
  },

  // Control room relaying AP314's commentary. The callsign follows the
  // project's GMP scheme (police-callsigns.ts): A = City of Manchester,
  // P = patrol, 3 = nights, unit 14.
  informantScript: [
    {
      id: "relay-first",
      atSec: 4,
      text: "Control room relaying. AP314 has a fail to stop — grey VW Golf, MK66 HZR, attempted stop on Hyde Road at Belle Vue, it's gone eastbound. He's single-crewed and initial-phase trained, and he's asking for authority to continue. Speeds fifty, sixty, in the thirty.",
      tone: "critical",
    },
    {
      id: "tacad-authority",
      atSec: 22,
      text: "Pursuit tactical adviser is on the channel. Initial-phase authority given — he follows and commentates, nothing more. No tactics until a tactical-phase car is behind it. TacAd wants to know where your nearest RPU is and whether the aircraft is up.",
      tone: "urgent",
    },
    {
      id: "pnc-stolen",
      atSec: 50,
      text: "PNC's back on the Golf. STOLEN — taken in a burglary in Reddish two nights ago, keys off the hall table. ANPR marker's on it. So: a stolen car, one lad in it, and nothing else on it so far.",
      tone: "urgent",
    },
    {
      id: "red-lights",
      atSec: 75,
      probability: 0.7,
      text: "Through a red at the crossing outside the retail park — sixty-five past the Tesco, wrong side of the island for the overtake. People on the crossing stepped back. He's still with it, but the commentary's getting quick.",
      tone: "critical",
    },
    // --- The abandon trigger, and the abandon. The engine cannot hear
    // the desk answer, so the TacAd's call and the officer's
    // acknowledgement land in the same beat; the lesson says what the
    // desk should have been saying at the same moment. ------------------
    {
      id: "estate",
      atSec: 100,
      text: "It's gone RIGHT off Hyde Road into the estate — Haworth Road, that grid — twenty limit, cars parked both sides, kids out on bikes. He's asking: do we continue? TacAd's answer is no — for a stolen car with nobody hurt, this is where the risk outruns the offence. Discontinued. AP314 acknowledges: lights off, dropped back, stopped at the Hyde Road end. Authority withdrawn; he needs a new one to go again. Golf last seen still going south toward Far Lane, and still driving like that with nobody behind it.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    // --- The roll. Roughly one night in three it crashes anyway. --------
    {
      id: "crash",
      atSec: 135,
      probability: 0.35,
      requiresFiredIds: ["estate"],
      suppressesIds: ["decamp", "decamp-sighting"],
      text: "It's crashed. A resident's rung it in and AP314 has gone back down — the Golf's into a parked car on Haworth Road, front end gone, driver still in the seat. One occupant. He's conscious but bleeding from the head, he's been sick and his breathing's noisy. Not trapped — the door opens. Officer's asking for an ambulance now.",
      tone: "critical",
      effect: { pulseCritical: true, revealCasualty: "cas-42-driver" },
    },
    // --- The other two nights in three: dumped, and away on foot. No
    // probability, deliberately — crash has taken its share; this is the
    // remainder and it has to be certain. ------------------------------
    {
      id: "decamp",
      atSec: 140,
      requiresFiredIds: ["estate"],
      suppressesIds: ["crash"],
      text: "Stopped dead on Far Lane and he's out — one male, grey hooded top, running, over the back fences toward the Fallowfield Loop, the old railway line. Golf left in the road with the engine running. AP314 is with the car. Dog and aircraft on the area, please — that path runs for miles both ways.",
      tone: "urgent",
    },
    {
      id: "decamp-sighting",
      atSec: 190,
      probability: 0.6,
      requiresFiredIds: ["decamp"],
      text: "Resident on Old Hall Drive has rung 999 — a lad in a grey hooded top has just come through her back garden and over the fence onto the loop, heading west toward Ryder Brow. That's a minute old.",
      tone: "info",
    },
    // --- Slow response. Only if nothing of ours has landed by five
    // minutes; branch-neutral because either branch may have played. ----
    {
      id: "slow",
      atSec: 240,
      delayThresholdSec: 300,
      text: "Five minutes and nothing of yours has arrived. One officer, on his own, with whatever the last message left him — a stolen car, an estate that's out on its doorsteps, and no RPU, no dog and no aircraft. He's asking where they are. So is the TacAd.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  callGrade: {
    scale: "police_thrive",
    grade: 1,
    standardMinutes: 15,
    basis:
      "GMP Grade 1 (Immediate) — a pursuit in progress with the public at risk. 15 minutes is GMP's own published force-wide attendance target: Chief Constable's Regulation 28 response to HM Senior Coroner Manchester West, 26 Aug 2025 ('Immediate or grade 1 incidents - within 15 minutes'), and GMCA GMP Performance Briefing Jan 2026 (95% within 15 min, average 7m52s in 2025). GMP publishes no separate rural figure. Authority, phase and discontinuance wording is the College of Policing APP 'Police pursuits' (updated 4 Mar 2026); GMP's own pursuit policy was not obtained.",
  },
};
