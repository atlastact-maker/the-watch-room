import type { RecordSet } from "../records";

// Records for scenario 08 — School fire, Hawthorne Brook High, Bury.
//
// Everyone here is fictional. The school is synthetic (see the scenario
// file); the streets are real Bury streets with fictional house numbers,
// phones sit in Ofcom's reserved drama ranges, and VRMs are made up.
// The scenario location itself is derived by buildRecordIndex() — the
// places below are the premises the story turns on beyond it.
//
// Cast, from the scenario text:
//   • the caretaker — 999 caller, sole keyholder, meets crews at the rear
//     service yard gate ("keys-ready" beat)
//   • a second caller in the houses opposite on Manchester Road (the
//     scene draws six of them; a visible fire brings more than one call)
//   • the swim-squad lad the "swimmer-missing" beat reveals — cas-swimmer
//   • his mother — the "parents-arriving" beat, registered keeper
//   • the two swimming instructors (N: "25 swimmers + 2 instructors")
//   • the headteacher — responsible person on the PRI, not on site
//   • the two cars the scene draws on the front car park ("Staff car",
//     "Caretaker") plus the parent's car

export const records08: RecordSet = {
  scenarioId: "08",

  people: [
    {
      id: "p08-caller-parry",
      name: "PARRY, Malcolm",
      sex: "M",
      age: 58,
      address: "27 Woodhill Road, Bury",
      postcode: "BL8",
      phone: "07700 900445",
      roles: ["caller"],
      notes: [
        "Calling from mobile on the front car park; will meet crews at the rear service yard gate with keys.",
        "Site caretaker — sole keyholder on the PRI list: service yard, pool plant room, tech block switch room.",
        "Previous: keyholder attendance 22/05/26 — intruder alarm, false activation, no offences.",
      ],
      scenarioId: "08",
      vehicleIds: ["v08-caretaker-astra"],
    },
    {
      id: "p08-caller-akhtar",
      name: "AKHTAR, Nasreen",
      sex: "F",
      age: 44,
      address: "231 Manchester Road, Bury",
      postcode: "BL9",
      phone: "07700 900158",
      roles: ["caller"],
      notes: [
        "Second caller — flames visible in the tech block from her front bedroom across Manchester Road; no persons seen at the windows.",
      ],
      scenarioId: "08",
    },
    {
      id: "p08-swimmer-halliwell",
      name: "HALLIWELL, Owen",
      sex: "M",
      age: 14,
      address: "156 Bolton Road, Bury",
      postcode: "BL8",
      roles: ["occupant"],
      markers: ["CHILD"],
      notes: [
        "Evening swim squad member — on the session register held by the lead instructor (OKAFOR).",
        "Next of kin: mother, HALLIWELL, Joanne — 07700 900733.",
      ],
      scenarioId: "08",
      casualtyId: "cas-swimmer",
    },
    {
      id: "p08-parent-halliwell",
      name: "HALLIWELL, Joanne",
      sex: "F",
      age: 41,
      address: "156 Bolton Road, Bury",
      postcode: "BL8",
      phone: "07700 900733",
      roles: ["keeper"],
      notes: [
        "Parent of HALLIWELL, Owen (swim squad) — next-of-kin contact on the swim club session register.",
      ],
      scenarioId: "08",
      vehicleIds: ["v08-parent-qashqai"],
    },
    {
      id: "p08-instructor-okafor",
      name: "OKAFOR, Chidi",
      sex: "M",
      age: 35,
      address: "88 Walmersley Road, Bury",
      postcode: "BL9",
      phone: "07700 900286",
      roles: ["witness"],
      notes: [
        "Lead instructor, evening swimming club (pool hirer) — holds the session register; contact for the head count.",
      ],
      scenarioId: "08",
      vehicleIds: ["v08-instructor-focus"],
    },
    {
      id: "p08-instructor-begum",
      name: "BEGUM, Farhana",
      sex: "F",
      age: 27,
      address: "19 Spring Street, Bury",
      postcode: "BL9",
      phone: "07700 900591",
      roles: ["witness"],
      notes: [
        "Assistant instructor — responsible for the changing-room head count on the way out.",
      ],
      scenarioId: "08",
    },
    {
      id: "p08-head-vaughan",
      name: "VAUGHAN, Helen",
      sex: "F",
      age: 52,
      phone: "07700 900904",
      roles: ["occupant"],
      notes: [
        "Headteacher — responsible person on the PRI; not on site out of hours. Holds the school emergency plan and the swim club hire agreement.",
      ],
      scenarioId: "08",
    },
  ],

  vehicles: [
    {
      id: "v08-caretaker-astra",
      vrm: "MX67 HFP",
      make: "Vauxhall",
      model: "Astra",
      colour: "Silver",
      keeperId: "p08-caller-parry",
      keeperName: "PARRY, Malcolm",
      notes: ["Parked front car park, staff bays by the main entrance."],
      scenarioId: "08",
    },
    {
      id: "v08-instructor-focus",
      vrm: "MJ19 KDW",
      make: "Ford",
      model: "Focus",
      colour: "Blue",
      keeperId: "p08-instructor-okafor",
      keeperName: "OKAFOR, Chidi",
      notes: ["Parked front car park, staff bays — swim club instructor."],
      scenarioId: "08",
    },
    {
      id: "v08-parent-qashqai",
      vrm: "MV21 OTR",
      make: "Nissan",
      model: "Qashqai",
      colour: "White",
      keeperId: "p08-parent-halliwell",
      keeperName: "HALLIWELL, Joanne",
      notes: ["Keeper is the parent of a swim squad member — contact held on the club session register."],
      scenarioId: "08",
    },
  ],

  places: [
    {
      id: "pl08-neighbour-231",
      kind: "premises",
      name: "231 Manchester Road (opposite the school gate)",
      address: "231 Manchester Road, Bury",
      postcode: "BL9",
      // Houses opposite sit ~40 m south of the anchor, across Manchester Road.
      coords: { lat: 53.5906, lng: -2.3053 },
      notes: [
        "Second 999 caller's address — front bedroom overlooks the school frontage and the tech block.",
        "Previous: none held for this address.",
      ],
      scenarioId: "08",
    },
    {
      id: "pl08-la-town-hall",
      kind: "landmark",
      name: "Bury Town Hall — LA duty officer via switchboard",
      address: "Knowsley Street, Bury",
      postcode: "BL9 0SW",
      coords: { lat: 53.5912, lng: -2.2985 },
      notes: [
        "Local authority emergency duty officer — out of hours via switchboard 0161 496 0770 (PRI contact).",
        "Can open a rest centre for swimmers and parents if the evacuation extends beyond the car park.",
      ],
      scenarioId: "08",
    },
    {
      id: "pl08-rvp-bolton-street",
      kind: "landmark",
      name: "Bolton Street station forecourt — parents' RVP",
      address: "Bolton Street, Bury",
      postcode: "BL9",
      coords: { lat: 53.5916, lng: -2.303 },
      notes: [
        "Named in the school emergency plan as the out-of-hours collection point for pool hirers — keeps arriving parents off the front car park and the appliance access road.",
        "Forecourt and car park off Bolton Street; hard standing for an NWAS DCA.",
      ],
      scenarioId: "08",
    },
  ],
};
