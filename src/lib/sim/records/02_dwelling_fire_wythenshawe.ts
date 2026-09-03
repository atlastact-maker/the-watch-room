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
// 8 and 5) are all recorded. The boy (5) is the scene's cas-1 — present on
// about two-thirds of runs, asleep in the back bedroom, and slower to wake
// because of his hearing impairment. The father (38) is cas-2, who only
// exists when the second-casualty beat fires on a slow attendance; his
// record reads as an occupant accounted for at the time of the call, with
// the informant's warning that he wants to go back in.
//
// There are no CRS vehicles in this scenario. The two vehicles are the
// kerbside "Parked" cars the scene draws either side of the driveway —
// the family's and the neighbour's — because they are what police will
// be asked to move for the aerial pitch.
//
// Everyone and every vehicle below is fictional. The street is real and
// the house numbers follow the scenario's own scene (283 / 285 / 287).

export const records02: RecordSet = {
  scenarioId: "02",

  people: [
    {
      id: "p02-caller-hargreaves",
      name: "HARGREAVES, Pauline",
      sex: "F",
      age: 67,
      address: "287 Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22 4QR",
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
      address: "287 Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22 4QR",
      phone: "0161 496 0287",
      roles: ["occupant"],
      notes: [
        "Occupant of no. 287, the attached semi. Inside the property at the time of the call — reported banging on the party wall, says there is heat coming through it.",
        "To be brought out to the pavement; no. 287 is the exposure if the fire is not knocked down.",
      ],
      scenarioId: "02",
    },
    {
      id: "p02-occupant-marsh-kelly",
      name: "MARSH, Kelly",
      sex: "F",
      age: 41,
      address: "285 Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22 4QR",
      phone: "07700 900187",
      roles: ["occupant", "caller"],
      notes: [
        "On the line from the caller's handset — outside no. 287 with her daughter. States her son (5) was asleep in the back bedroom and she cannot get back in; hallway smoke-logged.",
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
      address: "285 Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22 4QR",
      phone: "07700 900233",
      roles: ["occupant", "patient"],
      notes: [
        "Occupant of no. 285 — accounted for on the pavement at 02:34 per the informant. Informant states he wants to go back in for his son; crews to be told if he does.",
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
      address: "285 Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22 4QR",
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
      address: "285 Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22 4QR",
      roles: ["occupant", "patient"],
      markers: ["CHILD", "VULNERABLE"],
      notes: [
        "Son of the family at no. 285. Informant states he was asleep in the rear first-floor bedroom and has not been seen since the alarm.",
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
      address: "283 Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22 4QR",
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
        "Parked kerbside on Hollyhedge Road outside no. 283 / 285 — the driveway of no. 285 is clear. May need moving for the aerial pitch.",
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
        "Parked kerbside on Hollyhedge Road outside no. 287. Keys with the caller on the pavement.",
        "No markers.",
      ],
      scenarioId: "02",
    },
  ],

  places: [
    {
      id: "pl02-neighbour-287",
      kind: "premises",
      name: "287 Hollyhedge Road — attached neighbour (caller)",
      address: "287 Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22 4QR",
      coords: { lat: 53.3878415, lng: -2.2447021 },
      notes: [
        "Semi-detached partner of no. 285 — shared party wall. The fire is into this property at about 6 m radius (roughly 15 unsuppressed minutes from a kitchen seat).",
        "Occupants: 2 — HARGREAVES Pauline (67, the caller, outside) and Graham (69, inside at the time of the call).",
        "Same council-built stock as no. 285: 1950s brick cavity wall, slate roof, uPVC multi-point front door. Gas meter in the cupboard under the stairs, mirror-image of no. 285.",
      ],
      scenarioId: "02",
    },
    {
      id: "pl02-neighbour-283",
      kind: "premises",
      name: "283 Hollyhedge Road — neighbour",
      address: "283 Hollyhedge Road, Wythenshawe, Manchester",
      postcode: "M22 4QR",
      coords: { lat: 53.3878415, lng: -2.2450646 },
      notes: [
        "Next house on the west side of no. 285, separated by the driveway — not attached. Occupant: IQBAL Nasreen (54), out on the pavement.",
        "Outside garden tap at the side of the property. Precautionary evacuation if the fire develops through the roof.",
      ],
      scenarioId: "02",
    },
  ],
};
