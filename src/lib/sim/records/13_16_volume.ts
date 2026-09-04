import type { RecordSet } from "../records";

// Records for the volume jobs, 13 to 16.
//
// A volume job holds fewer people than a set-piece and that is right — a
// lift release has a building manager and four names, not a casualty
// board. What each one does hold is the person the operator will actually
// end up talking about: the neighbour with the key, the crew outside the
// door, the driver whose car is alight.
//
// Everyone here is fictional. Nothing reveals which way a scenario's
// reality roll lands — the diabetic in the lift is recorded as being in
// the lift, not as being about to go hypo.

export const records13to16: RecordSet[] = [
  // -------------------------------------------------------------------
  // 13 — elderly faller, Withington
  // -------------------------------------------------------------------
  {
    scenarioId: "13",
    people: [
      {
        id: "p13-ashworth",
        name: "ASHWORTH, Doreen",
        sex: "F",
        age: 81,
        address: "26 Burton Road, Withington, Manchester",
        postcode: "M20 3EB",
        phone: "0161 445 0192",
        roles: ["patient"],
        markers: ["VULNERABLE"],
        notes: [
          "Lives alone. Known to the falls team; keysafe fitted at their request.",
          "Two previous falls attended in the last eight months, neither conveyed.",
          "Daughter lives in Leeds and is the next of kin on file.",
        ],
        scenarioId: "13",
      },
      {
        id: "p13-caller-pike",
        name: "PIKE, Maureen",
        sex: "F",
        age: 68,
        address: "28 Burton Road, Withington, Manchester",
        postcode: "M20 3EB",
        phone: "07700 900612",
        roles: ["caller", "witness"],
        notes: [
          "Neighbour at no. 28 and the informant. Holds a key and has let herself in.",
          "On scene with the patient throughout. Cannot lift her alone.",
        ],
        scenarioId: "13",
      },
      {
        id: "p13-daughter",
        name: "ASHWORTH, Katherine",
        sex: "F",
        age: 54,
        address: "Leeds",
        phone: "07700 900733",
        roles: ["occupant"],
        notes: ["Daughter and next of kin. Two hours away. Rung by the neighbour, no answer yet."],
        scenarioId: "13",
      },
    ],
    vehicles: [],
    places: [
      {
        id: "pl13-house",
        kind: "premises",
        name: "26 Burton Road",
        address: "26 Burton Road, Withington, Manchester",
        postcode: "M20 3EB",
        coords: { lat: 53.4322, lng: -2.2295 },
        notes: [
          "Terraced, two up two down. Narrow hallway and a tight stair — no room to work a carry chair at the stair foot.",
          "Keysafe by the meter box. Neighbour at no. 28 also holds a key.",
        ],
        scenarioId: "13",
      },
    ],
  },

  // -------------------------------------------------------------------
  // 14 — persons in lift, Dale Street
  // -------------------------------------------------------------------
  {
    scenarioId: "14",
    people: [
      {
        id: "p14-manager-okonkwo",
        name: "OKONKWO, Daniel",
        sex: "M",
        age: 44,
        address: "Wheelwright House, Dale Street, Manchester",
        postcode: "M1 2HF",
        phone: "0161 236 7741",
        roles: ["caller"],
        notes: [
          "Building manager and the informant. Holds the lift motor room keys and the maintenance contract.",
          "Has the four occupants on the car intercom and is relaying.",
        ],
        scenarioId: "14",
      },
      {
        id: "p14-lift-hoyle",
        name: "HOYLE, Ryan",
        sex: "M",
        age: 29,
        address: "In the lift car, Wheelwright House, Dale Street, Manchester",
        postcode: "M1 2HF",
        phone: "07700 900288",
        roles: ["occupant"],
        markers: ["MEDICAL"],
        notes: [
          "One of four in the car. Type 1 diabetic — has not eaten since lunch, which the building manager passed on the initial call.",
        ],
        scenarioId: "14",
      },
      {
        id: "p14-lift-bashir",
        name: "BASHIR, Nadia",
        sex: "F",
        age: 33,
        address: "In the lift car, Wheelwright House, Dale Street, Manchester",
        postcode: "M1 2HF",
        phone: "07700 900341",
        roles: ["occupant"],
        notes: ["One of four in the car. Speaking to the building manager on the intercom."],
        scenarioId: "14",
      },
    ],
    vehicles: [],
    places: [
      {
        id: "pl14-building",
        kind: "premises",
        name: "Wheelwright House",
        address: "Wheelwright House, Dale Street, Manchester",
        postcode: "M1 2HF",
        coords: { lat: 53.4816, lng: -2.2306 },
        notes: [
          "Converted Victorian warehouse, six storeys, offices over ground-floor retail. Single passenger lift serving all floors.",
          "Motor room at sixth-floor level; keys with the building manager.",
          "Dale Street is a red route — the loading bay on the side street is the only place to put an appliance.",
        ],
        scenarioId: "14",
      },
    ],
  },

  // -------------------------------------------------------------------
  // 15 — car fire, A627(M)
  // -------------------------------------------------------------------
  {
    scenarioId: "15",
    people: [
      {
        id: "p15-driver-birtwistle",
        name: "BIRTWISTLE, Craig",
        sex: "M",
        age: 38,
        address: "Chadderton, Oldham",
        postcode: "OL9",
        phone: "07700 900455",
        roles: ["caller", "witness"],
        notes: [
          "Driver and registered keeper of the vehicle involved. Out and uninjured on the nearside verge with a passenger.",
          "Reports the vehicle smoked and then went up while he was driving.",
        ],
        scenarioId: "15",
        vehicleIds: ["v15-hatchback"],
      },
      {
        id: "p15-passing-caller",
        name: "DEWHURST, Stephen",
        sex: "M",
        age: 51,
        address: "Not on scene — caller passing northbound",
        phone: "07700 900509",
        roles: ["caller"],
        notes: [
          "First caller. Passing northbound and unable to stop. Reported flames over the roof of the vehicle.",
        ],
        scenarioId: "15",
      },
    ],
    vehicles: [
      {
        id: "v15-hatchback",
        vrm: "MF16 UYB",
        make: "Vauxhall",
        model: "Astra",
        colour: "Blue",
        keeperName: "BIRTWISTLE, Craig — Chadderton, Oldham OL9",
        notes: [
          "The vehicle involved. On the hard shoulder of the A627(M) northbound, well alight on arrival.",
          "Recovery required before the carriageway reopens.",
        ],
        scenarioId: "15",
      },
    ],
    places: [
      {
        id: "pl15-carriageway",
        kind: "landmark",
        name: "A627(M) northbound, J20 to Chadderton",
        address: "A627(M) northbound, between J20 and Chadderton, Oldham",
        postcode: "OL9 8EJ",
        coords: { lat: 53.5507, lng: -2.1229 },
        notes: [
          "Live motorway carriageway. Nearest access northbound is J20; no cross-carriageway access.",
          "Roads policing and National Highways both have an interest. Crews do not work this unprotected.",
        ],
        scenarioId: "15",
      },
    ],
  },

  // -------------------------------------------------------------------
  // 16 — effecting entry, Farnworth
  // -------------------------------------------------------------------
  {
    scenarioId: "16",
    people: [
      {
        id: "p16-sharples",
        name: "SHARPLES, Alan",
        sex: "M",
        age: 74,
        address: "8 Egerton Street, Farnworth, Bolton",
        postcode: "BL4 7HL",
        phone: "01204 570188",
        roles: ["patient"],
        markers: ["MEDICAL", "VULNERABLE"],
        notes: [
          "Lives alone. COPD, on home oxygen — cylinders in the property.",
          "Seen through the letterbox on the hall floor, not responding to shouts.",
          "No keyholder recorded on any system.",
        ],
        scenarioId: "16",
      },
      {
        id: "p16-neighbour-crompton",
        name: "CROMPTON, Sheila",
        sex: "F",
        age: 61,
        address: "6 Egerton Street, Farnworth, Bolton",
        postcode: "BL4 7HL",
        phone: "07700 900677",
        roles: ["caller", "witness"],
        notes: [
          "Neighbour who raised it — has not seen him for two days. Holds a number for his daughter, unanswered.",
          "Knows the rear door is wooden and that the shared entry three doors down reaches the yard.",
        ],
        scenarioId: "16",
      },
    ],
    vehicles: [],
    places: [
      {
        id: "pl16-house",
        kind: "premises",
        name: "8 Egerton Street",
        address: "8 Egerton Street, Farnworth, Bolton",
        postcode: "BL4 7HL",
        coords: { lat: 53.5461, lng: -2.4009 },
        notes: [
          "Terraced, two storey. Front door uPVC with a multipoint lock; rear door wooden, reached by the shared entry three doors down.",
          "HOME OXYGEN AT THIS ADDRESS — flagged on the ambulance system. No spark or flame source at entry.",
          "Adjoining houses occupied both sides.",
        ],
        scenarioId: "16",
      },
    ],
  },
];
