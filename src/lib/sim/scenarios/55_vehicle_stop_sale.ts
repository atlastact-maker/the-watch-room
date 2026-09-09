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
};
