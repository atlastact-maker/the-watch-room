import type { Scenario } from "../incident_types";

// Scenario 55 — vehicle stop, no insurance, wanted driver, Washway Road,
// Sale.
//
// A test job built for the tablet: the whole thing happens on the MDT.
// A Trafford patrol has a grey Astra in front of it on the A56 with an
// ANPR flag for no insurance, and calls the stop. What the officer does
// next is the exercise. Details from the driver — he gives his real
// name, he always does — and the PNC turns up a warrant. The vehicle
// check confirms the insurance. The car is seized under s165A and
// recovery is requested; a search of it, with grounds, finds nothing
// at all, which is the correct answer. The driver is arrested on the
// warrant and the second unit, a double-crewed van, takes him to
// custody.
//
// Police generated: the patrol's own stop, not a 999 call. The
// informant is the patrol on the air.
//
// FICTIONAL: the driver, the car and the parade. Washway Road is real.

export const scenario55: Scenario = {
  id: "55",
  slug: "55_vehicle_stop_sale",
  title: "Vehicle stop — no insurance, wanted driver, Sale",
  type: "police_vehicle_stop_no_insurance",
  patch: "Southern",
  severity: "low",
  trigger:
    "Trafford patrol calling a vehicle stop on Washway Road, Sale: grey Vauxhall Astra MV15 UKZ, ANPR showing no insurance, one male up. Stopped in the bus lay-by outside the parade. Requesting a second unit for transport",

  location: {
    address: "Washway Road (A56), northbound lay-by outside the parade, Sale",
    postcode: "M33 4BP",
    coords: { lat: 53.4262, lng: -2.3312 },
  },

  property: {
    class: "Bus lay-by on the A56 outside a parade of shops — dual carriageway, 30 mph, daytime traffic",
    occupants: "One male driver in the stopped car. Patrol crew behind it. Shop staff and passers-by on the pavement",
    vulnerabilities: [
      "Live carriageway — officers between the car and the traffic",
      "The driver has a history of violence when challenged; compliant so far",
      "A bus lay-by: the bus will want it back",
    ],
    access: "Northbound A56; the lay-by takes the stopped car and one patrol vehicle. A second unit uses the side road by the parade and walks over",
    knownHazards: [
      "A56 traffic passing at the offside",
      "Driver's PNC record — violence when challenged",
    ],
    firstDueStationId: "MP-TRA",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "Police-generated stop. The patrol is already with the car; the job is what the officer does on the tablet.",
      "The driver gives his real name. Searched with his date of birth he is WANTED on a warrant that is not backed for bail.",
      "The vehicle shows NO INSURANCE. Seize under s165A RTA 1988 and request recovery. A search of the car with grounds finds nothing.",
      "Custody transport is the van: a double-crewed patrol van from Trafford, requested as the second unit.",
    ],
  },

  methane: {
    M: "No",
    E: "Washway Road (A56), northbound bus lay-by outside the parade, Sale, M33",
    T: "Vehicle stop — no insurance on ANPR; driver to be identified",
    H: "Live dual carriageway; driver's history of violence when challenged",
    A: "Northbound A56, lay-by; second unit on the side road by the parade",
    N: "None injured. One male driver, compliant",
    emergencyServices: "Police only — the patrol that made the stop and a van for transport",
  },

  pda: [
    {
      id: "police1",
      label: "Police — patrol car (the stop)",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      preferredStationId: "MP-TRA",
      notes: "The patrol that called the stop. On the MDT: details from the driver, PNC on him and the car, seize the car, search it, arrest on the warrant",
    },
    {
      id: "police2",
      label: "Police — patrol van (transport)",
      service: "Police",
      requiredApplianceTypes: ["Police_Van"],
      requiredCapabilities: [],
      preferredStationId: "MP-TRA",
      notes: "Double crew in the van. Takes the arrested male to custody once the car crew have him cuffed and searched",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Identification", target: "details taken from the driver and a PNC person check run with the date of birth — the WANTED marker is the point of the job" },
      { metric: "Vehicle", target: "PNC vehicle check confirms no insurance; vehicle seized under s165A and recovery requested" },
      { metric: "Search", target: "vehicle searched with a reason, grounds and a power recorded — nothing found is the right answer, and it still goes on the record" },
      { metric: "Arrest and transport", target: "driver arrested on the warrant and conveyed to custody in the van, not the car" },
    ],
    lesson:
      "A no-insurance stop is the most ordinary job on the roads and it is where the wanted turn up, because they drive and they do not insure. Do the stop properly. Details, then the PNC with the date of birth he gives you; the warrant changes everything after that. The car is seized because the law says so, not because you think he is bad, and the search is with grounds and a power and it is recorded even when — especially when — it finds nothing. He goes to custody in the van, with two officers, and the car crew stay with the car until recovery has it.",
  },

  // The stopped car, in the lay-by on the northbound side, nose north.
  sceneVehicles: [
    {
      id: "v55-astra",
      vrm: "MV15 UKZ",
      label: "Grey Vauxhall Astra — stopped, driver in the seat",
      coords: { lat: 53.42635, lng: -2.33095 },
      bearingDeg: 350,
      colour: "#8e949a",
    },
  ],

  scene: {
    viewBox: { x: -60, y: -40, width: 120, height: 80 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -58, y: -38, w: 116, h: 14 }, kind: "neighbour", label: "Parade of shops — newsagent, café, barber" },
      { shape: { x: -58, y: 26, w: 116, h: 12 }, kind: "neighbour", label: "Houses — set back behind the southbound side" },
    ],
    roads: [
      { shape: { x: -60, y: -24, w: 120, h: 6 }, kind: "pavement", label: "Pavement — the parade" },
      { shape: { x: -60, y: -18, w: 120, h: 8 }, kind: "driveway", label: "Bus lay-by — the stopped car and the patrol" },
      { shape: { x: -60, y: -10, w: 120, h: 14 }, kind: "road", label: "A56 Washway Road — northbound" },
      { shape: { x: -60, y: 4, w: 120, h: 14 }, kind: "road", label: "A56 Washway Road — southbound" },
      { shape: { x: -60, y: 18, w: 120, h: 6 }, kind: "pavement", label: "Pavement" },
      { shape: { x: 44, y: -40, w: 8, h: 80 }, kind: "road", label: "Side road — second unit" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -20, y: -14 }, kind: "car", label: "Stopped car — grey Astra MV15 UKZ" },
      { pos: { x: -36, y: -14 }, kind: "car", label: "Patrol car" },
      { pos: { x: -50, y: -26 }, kind: "lamppost" },
      { pos: { x: 20, y: -26 }, kind: "lamppost" },
      { pos: { x: 0, y: 20 }, kind: "tree" },
    ],
    hazards: [
      { id: "traffic", pos: { x: -10, y: -3 }, kind: "structural", label: "Live carriageway at the offside of the stopped car — approach from the nearside", knownFromPri: true },
      { id: "driver", pos: { x: -20, y: -18 }, kind: "structural", label: "Driver — compliant; PNC history of violence when challenged", knownFromPri: true },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Lay-by and the stopped car", face: "front", bearingDeg: 0 },
      { id: 2, label: "Sector 2 · Carriageway", face: "rear", bearingDeg: 180 },
      { id: 3, label: "Sector 3 · Side road — second unit", face: "right", bearingDeg: 90 },
      { id: 4, label: "Sector 4 · The parade", face: "left", bearingDeg: 270 },
    ],
  },

  // The patrol on the air, not a caller. It runs until the second unit
  // lands; the driver stays compliant throughout.
  informantScript: [
    {
      id: "stop-called",
      atSec: 5,
      text: "Trafford patrol — vehicle stop complete, Washway Road northbound, lay-by outside the parade. Grey Astra, Mike Victor one five, Uniform Kilo Zulu. ANPR's given us no insurance. One male driver, he's stayed in the car, he's compliant. Can we have a second unit for transport if this goes the way it looks?",
      tone: "info",
    },
    {
      id: "details",
      atSec: 90,
      text: "Driver's given his details — Callum Deakin, D-E-A-K-I-N, fourth of the third, nineteen ninety-five, Wood Lane, Partington. No licence on him, says he's got one. Running him now on the tablet.",
      tone: "info",
    },
    {
      id: "wanted",
      atSec: 240,
      text: "He's showing wanted — warrant, fail to appear, not backed for bail. And a violence marker. He's still sat in the car and he's still being polite. We'll take him on the warrant when the van's here — where's the second unit?",
      tone: "urgent",
    },
    {
      id: "insurance",
      atSec: 330,
      text: "Vehicle check's back: no policy on the MID since June. We're seizing it under one-six-five-A. Can control put recovery on for us, one grey Astra from the Washway Road lay-by.",
      tone: "info",
    },
    {
      id: "bus",
      atSec: 600,
      delayThresholdSec: 600,
      text: "We've had two buses go past us with the driver making his feelings known. We're fine for now but the sooner the van's here the sooner we're out of the lay-by.",
      tone: "info",
    },
  ],

  callGrade: {
    scale: "police_thrive",
    grade: "P",
    standardMinutes: null,
    basis:
      "GMP Grade P — Police Generated: the patrol's own stop, not a 999 call, so there is no attendance target for the first unit; it is already there. The second unit is a resourcing request from a crew on the ground with a compliant detained person and a seized vehicle. GMP FOI 01/FOI/24/012708/K (Jun 2024) lists Police Generated as dispatch and admin work created by the force itself.",
  },

  // The call as PC Lomas has it: police generated, not a 999 — a
  // Trafford patrol behind a grey Astra in the bus lay-by on the A56,
  // lights on, the driver sat with his hands on the wheel and half the
  // parade watching from their doorways. She has not spoken to him yet.
  // She wants the van rolling before she needs it.
  call: {
    caller: {
      name: "PC Sarah Lomas",
      phone: "07700 900855",
      relation: "Trafford response — the patrol that called the stop; police generated, not a 999",
      where: "In the patrol car behind the stopped Astra in the northbound bus lay-by on Washway Road, then up the nearside to the driver's window",
      line: "mobile",
      state: "calm",
    },
    opening:
      "Control, Trafford patrol — vehicle stop, Washway Road northbound, the bus lay-by outside the parade in Sale. Grey Vauxhall Astra, Mike Victor one five, Uniform Kilo Zulu. ANPR's flagged it no insurance. One male up, he's stayed in the car, hands on the wheel, compliant. I'm calling it before I go up to him. I'll want a second unit for transport if this goes the way these go.",
    deflection: "Control, I've given you the stop. I need the van, not questions.",
    reassurance: {
      text: "Two-four-seven-one, received. The van's being sorted. Stay nearside and keep him in the car.",
      reply: "Received. Nearside, and he's staying put.",
    },
    answers: {
      p_happening: {
        text: "Vehicle stop, police generated. Grey Astra, Mike Victor one five Uniform Kilo Zulu, in the bus lay-by on Washway Road northbound outside the parade. ANPR's given me no insurance. One male driver, on his own, engine off, sat in the seat with his hands where I can see them. Nothing's kicked off. I'm calling it in before I go to the window, and I'll want a second unit for transport if it goes the way these usually go.",
        followUps: [
          {
            id: "p_happening_anpr",
            text: "What did the ANPR give you exactly?",
            answer: {
              text: "No insurance — a MID hit — and there's an interest marker on the plate from roads policing. That's all I've got till I run it properly. I'll do the vehicle on the tablet once I've got him identified. Driver first, car second.",
            },
          },
          {
            id: "p_happening_need",
            text: "What do you need from me?",
            answer: {
              text: "A second unit — the van, double-crewed, for transport. I'm not putting anyone in the back of my car on a dual carriageway. And keep the log open. If he comes back clean I'll cancel the van myself and it's a ticket and a seizure.",
            },
          },
        ],
      },
      p_ongoing: {
        text: "It's a stop — it's ongoing till I say it's not. He's compliant. Engine's off, he's in the driver's seat, I'm behind him with the lights going. Nothing's happening that shouldn't be.",
      },
      p_weapons: {
        text: "Nothing seen. Hands on the wheel, which is what I asked him to do through the window. I've not been in the car and I've not searched him. If that changes you'll hear it on the air before you hear it from me.",
      },
      p_injured: {
        text: "No. Nobody hurt, nobody threatened. It's a traffic stop. He's been polite so far — 'yes officer, no officer'.",
      },
      p_who: {
        text: "One male driver, nobody else in the car — I've had a look through the back window, it's empty bar a coat. I've not got his details yet, I'm about to. Then it's me, my colleague in the car, and half the parade stood in their doorways watching.",
      },
      p_description: {
        text: "White male, thirties, thin build, black puffer jacket, black cap. Sat in the driver's seat of a grey Astra five-door. I'll have a name for you in two minutes — I'd rather give you a name than a jacket.",
      },
      p_direction: {
        text: "He's not going anywhere. Car's stopped, engine's off, I'm parked behind him with the lights on. If he does go it's north up the A56 towards Stretford, and I'll be on the air before he's out of the lay-by. He's shown no sign of it.",
      },
      p_drink: {
        text: "Not that I've seen. He's talking normally through the window, no smell from where I was stood. I'll do him on the breath kit at the door — I do everyone.",
      },
      p_known: {
        text: "Not yet. Never seen him before. I'll know a lot more when I've run him on the tablet with a date of birth — that's the next thing I'm doing.",
      },
      p_vulnerable: {
        text: "Not in the usual sense — no kids in the car, no passengers. The vulnerability here is me and my colleague. The offside of that car is a live carriageway doing thirty, and half of it's doing forty. I'm going up the nearside, pavement side. That's why I want the van on the side road and not in the road.",
      },
      p_where: {
        text: "Washway Road, the A56, northbound — the bus lay-by outside the parade, a newsagent, a café and a barber's. M33 4BP. We're in the lay-by, nose north, patrol car behind the Astra. Second unit: the side road by the parade, walk over. There's no room in here for a third vehicle.",
      },
      p_safe: {
        text: "Safe enough. I'm on the pavement side, my colleague's in the car. Traffic's the risk, not him — so far. There's a bus due, and the driver'll want his lay-by back.",
      },
      p_seen: {
        text: "I'm looking at it. It's my stop — the ANPR pinged in the car, I followed him half a mile and put him in the lay-by. Nobody's told me anything. I'm telling you.",
      },
      p_details: {
        text: "PC Lomas, two-four-seven-one, Trafford response. You've my callsign on the screen. This is the work mobile — 07700 900855.",
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "Stand by — I'm out of the car and going up to him on the nearside. My colleague's stopping in the car with the lights on.",
      },
      {
        atSec: 100,
        text: "Control, can I get an ETA on that second unit? I've a lay-by, a bus due and a male I've not identified yet. I'd rather have the van rolling before I need it than after.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 150,
        text: "He's asked why he's been stopped and I've told him — no insurance showing. He says it's paid. They always say it's paid. He's still being polite.",
      },
      {
        atSec: 200,
        text: "Right — if the van's on its way, tell them the side road by the parade and walk over. There's no room in the lay-by behind me and I don't want a van stood on the carriageway.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Received, thanks. Side road by the parade for the van — I'll wave them over. He's going nowhere.",
  },
};
