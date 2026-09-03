import type { RecordSet } from "../records";

// Records for scenario 02 — house fire, persons reported, Hollyhedge Road,
// Wythenshawe.
//
// A 02:34 call from the attached neighbour at no. 287: smoke pouring from
// the upper windows of no. 285 and shouting from inside. The informant
// script shifts voice part-way through — "she's got both kids with her at
// next door's" is the neighbour, "my son's upstairs" and "my husband went
// back in" are the mother — so the desk holds it the way a control room
// would log it: the call is on the neighbour's number, and the mother of
// the family at no. 285 is on the line from the caller's handset.
//
// The family of four on the housing register (adults 41 and 38, children
// 8 and 5) are all recorded — but only as the desk could know them at
// 02:34. The persons reality is rolled per run (about a third of runs the
// whole family is out; on the rest the boy is in the back bedroom, and on
// a slow attendance his father may go back in after him), so nobody here
// is a "patient": the boy (cas-1) and the father (cas-2) keep their
// casualty links for the sim, but their records say where they were when
// the alarm went and that the pavement head-count is still being taken.
// The heat through the party wall, the father going back in and the seat
// of fire are things the crews find out, not things the desk holds.
//
// There are no CRS vehicles in this scenario. The two vehicles are the
// kerbside "Parked" cars the scene draws either side of the driveway —
// the family's and the neighbour's — because they are what police will
// be asked to move for the aerial pitch.
//
// Everyone and every vehicle below is fictional. The street is real, and
// the door numbers in the notes (283 / 285 / 287) follow the scenario's
// own scene — whose target is a real, OSM-verified building — rather than
// the records house rule of a fictional number. So the searchable fields
// stop at the street and the outward code (address "Hollyhedge Road,
// Wythenshawe, Manchester", postcode "M22", no door number in a place
// name or a vehicle note): a search by door number or full postcode does
// not put named occupants on a real front door. The scenario's derived
// scene record carries the full address on its own.

export const records02: RecordSet = {
  scenarioId: "02",

  people: [
    {
      id: "p02-caller-hargreaves",
      name: "HARGREAVES, Pauline",
      sex: "F",
      age: 67,
      address: "Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22",
      phone: "07700 900412",
      roles: ["caller"],
      notes: [
        "02:34 — 999 from this number: smoke from the upper windows of no. 285 and shouting inside. Caller on the pavement outside no. 287, has handed the handset to the mother from no. 285.",
        "Attached neighbour (semi-detached partner). Husband Graham still inside no. 287 at the time of the call.",
        "No previous calls from this number.",
      ],
      scenarioId: "02",
      vehicleIds: ["v02-hargreaves-jazz"],
    },
    {
      id: "p02-occupant-hargreaves-g",
      name: "HARGREAVES, Graham",
      sex: "M",
      age: 69,
      address: "Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22",
      phone: "0161 496 0287",
      roles: ["occupant"],
      notes: [
        "Occupant of no. 287, the attached semi — inside the property at the time of the call; to be brought out to the pavement.",
        "No. 287 is the direct exposure if the fire is not knocked down.",
      ],
      scenarioId: "02",
    },
    {
      id: "p02-occupant-marsh-kelly",
      name: "MARSH, Kelly",
      sex: "F",
      age: 41,
      address: "Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22",
      phone: "07700 900187",
      roles: ["occupant", "caller"],
      notes: [
        "On the line from the caller's handset — outside no. 287 with her daughter. States her son (5) was asleep in the back bedroom when the alarm went; whereabouts being confirmed on the pavement. House reported smoke-logged.",
        "Mother of the family at no. 285 — adults 41 and 38, children 8 and 5 on the housing register.",
        "No previous contact.",
      ],
      scenarioId: "02",
    },
    {
      id: "p02-patient-marsh-daniel",
      name: "MARSH, Daniel",
      sex: "M",
      age: 38,
      address: "Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22",
      phone: "07700 900233",
      roles: ["occupant"],
      notes: [
        "Occupant of no. 285 — accounted for on the pavement at 02:34 per the informant.",
        "Father of the family. Registered keeper of the grey Focus parked kerbside outside.",
      ],
      scenarioId: "02",
      casualtyId: "cas-2",
      vehicleIds: ["v02-marsh-focus"],
    },
    {
      id: "p02-occupant-marsh-ella",
      name: "MARSH, Ella",
      sex: "F",
      age: 8,
      address: "Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22",
      roles: ["occupant"],
      markers: ["CHILD"],
      notes: [
        "Daughter of the family at no. 285. Out of the property and with her mother at no. 287 per the informant.",
      ],
      scenarioId: "02",
    },
    {
      id: "p02-patient-marsh-theo",
      name: "MARSH, Theo",
      sex: "M",
      age: 5,
      address: "Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22",
      roles: ["occupant"],
      markers: ["CHILD", "VULNERABLE"],
      notes: [
        "Son of the family at no. 285. Was asleep in the rear first-floor bedroom when the alarm went; whereabouts being confirmed on the pavement.",
        "Hearing impairment — wears hearing aids, removed at night; slower to wake to an alarm (vulnerability flag on the housing register).",
      ],
      scenarioId: "02",
      casualtyId: "cas-1",
    },
    {
      id: "p02-occupant-iqbal",
      name: "IQBAL, Nasreen",
      sex: "F",
      age: 54,
      address: "Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22",
      phone: "07700 900658",
      roles: ["occupant", "witness"],
      notes: [
        "Occupant of no. 283, the other side of no. 285. Woken by the shouting; on the pavement and able to say who came out of no. 285 and when.",
        "Not attached to the fire property — driveway between. Evacuate as a precaution if the fire develops.",
      ],
      scenarioId: "02",
    },
  ],

  vehicles: [
    {
      id: "v02-marsh-focus",
      vrm: "MV68 XJP",
      make: "Ford",
      model: "Focus",
      colour: "Grey",
      keeperId: "p02-patient-marsh-daniel",
      keeperName: "MARSH, Daniel",
      notes: [
        "Parked kerbside on Hollyhedge Road outside the fire property, west of the driveway — the driveway itself is clear. May need moving for the aerial pitch.",
        "No markers.",
      ],
      scenarioId: "02",
    },
    {
      id: "v02-hargreaves-jazz",
      vrm: "ML21 KHT",
      make: "Honda",
      model: "Jazz",
      colour: "Silver",
      keeperId: "p02-caller-hargreaves",
      keeperName: "HARGREAVES, Pauline",
      notes: [
        "Parked kerbside on Hollyhedge Road outside the attached neighbour's, east of the driveway. Keys with the caller on the pavement.",
        "No markers.",
      ],
      scenarioId: "02",
    },
  ],

  places: [
    {
      id: "pl02-neighbour-287",
      kind: "premises",
      name: "Hollyhedge Road — attached neighbour (caller)",
      address: "Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22",
      coords: { lat: 53.3878415, lng: -2.2447021 },
      notes: [
        "Semi-detached partner of no. 285 — shared party wall; the direct exposure.",
        "Occupants: 2 — HARGREAVES Pauline (67, the caller, outside) and Graham (69, inside at the time of the call).",
        "Same council-built stock as no. 285: 1950s brick cavity wall, slate roof, uPVC multi-point front door. Gas meter in the cupboard under the stairs, mirror-image of no. 285.",
      ],
      scenarioId: "02",
    },
    {
      id: "pl02-neighbour-283",
      kind: "premises",
      name: "Hollyhedge Road — neighbour, west side",
      address: "Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22",
      coords: { lat: 53.3878415, lng: -2.2450646 },
      notes: [
        "Next house on the west side of no. 285, separated by the driveway — not attached. Occupant: IQBAL Nasreen (54), out on the pavement.",
        "Outside garden tap at the side of the property. Precautionary evacuation if the fire develops through the roof.",
      ],
      scenarioId: "02",
    },
  ],
};
