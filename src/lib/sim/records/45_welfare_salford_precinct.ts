import type { RecordSet } from "../records";

// Records for scenario 45 — concern for welfare, flat behind Salford
// Precinct.
//
// What the desk would hold when the housing officer rings: the tenant
// and what his landlord's file says about him, the officer on the
// landing, the daughter nobody has rung yet, the neighbour who wants to
// put the door in, and the two cars on Churchill Way — one of which has
// not moved since Thursday.
//
// Nothing here reveals which way the run lands. He is recorded as not
// seen for days, not as dead.
//
// Everyone is fictional, and so are the block number and the housing
// association. Churchill Way and Salford Shopping City are real.

export const records45: RecordSet = {
  scenarioId: "45",
  people: [
    // The tenant. MEDICAL for the heart condition, VULNERABLE for a man
    // in his sixties living alone who has not answered his door.
    {
      id: "p45-gaskell",
      name: "GASKELL, Dennis",
      sex: "M",
      age: 64,
      address: "Flat 6, 18 Churchill Way, Pendleton, Salford",
      postcode: "M6 5QX",
      phone: "0161 496 0296",
      roles: ["occupant"],
      markers: ["MEDICAL", "VULNERABLE"],
      notes: [
        "Lives alone. Tenant of Flat 6 since 2011 on the landlord's file.",
        "Heart condition on the housing file — a hospital admission last year; on a repeat prescription. Nothing more specific held.",
        "Previous: one concern-for-welfare call to this address (2024) from the same landlord — answered the door, no further action.",
        "Next of kin on the housing file: daughter, PILLING, Nicola — Swinton.",
        "Last confirmed sighting Thursday, by the neighbour in Flat 2. Phone to voicemail; car on the road outside not moved.",
      ],
      scenarioId: "45",
      vehicleIds: ["v45-focus"],
    },

    // The informant — on the landing, with a fob and no key.
    {
      id: "p45-ogundipe",
      name: "OGUNDIPE, Bisi",
      sex: "F",
      age: 47,
      address: "c/o Brindle Heath Housing, Eccles (office — home address not held)",
      phone: "07700 900947",
      roles: ["caller", "witness"],
      notes: [
        "Housing officer for the block and the informant. On the first-floor landing outside Flat 6 throughout.",
        "Holds a fob for the communal door. Does NOT hold a key to the flat — her office is checking its key board.",
        "Has dealt with an unattended death in her stock before and says so.",
        "Pool car parked on Churchill Way outside the block.",
      ],
      scenarioId: "45",
      vehicleIds: ["v45-pool-car"],
    },

    // Next of kin. Not rung — the housing officer has held off so it
    // comes from officers, in person.
    {
      id: "p45-pilling",
      name: "PILLING, Nicola",
      sex: "F",
      age: 39,
      address: "Swinton, Salford",
      postcode: "M27",
      phone: "07700 900063",
      roles: [],
      notes: [
        "Daughter and next of kin on the landlord's file for Dennis GASKELL.",
        "Not yet contacted. The housing officer has the number and is holding it for officers.",
        "Ten minutes or so away by car — and told in person, not by phone.",
      ],
      scenarioId: "45",
    },

    // The neighbour downstairs — the last person to see him, and the one
    // who will put the door in himself if nobody comes.
    {
      id: "p45-makin",
      name: "MAKIN, Kevin",
      sex: "M",
      age: 58,
      address: "Flat 2, 18 Churchill Way, Pendleton, Salford",
      postcode: "M6 5QX",
      phone: "07700 900592",
      roles: ["witness"],
      notes: [
        "Neighbour in Flat 2, ground floor, and a friend of the tenant. Last saw him Thursday afternoon.",
        "Reports the television running day and night and the curtains unmoved since the weekend.",
        "On the landing with the housing officer. Talking about forcing the door himself.",
      ],
      scenarioId: "45",
    },
  ],

  vehicles: [
    {
      id: "v45-focus",
      vrm: "YD12 KLR",
      make: "Ford",
      model: "Focus",
      colour: "Silver",
      keeperId: "p45-gaskell",
      keeperName: "GASKELL, Dennis — Flat 6, 18 Churchill Way, Salford M6 5QX",
      notes: [
        "The tenant's car. Parked on Churchill Way outside the block and, per the neighbour, not moved since Thursday.",
        "No markers.",
      ],
      scenarioId: "45",
    },
    {
      id: "v45-pool-car",
      vrm: "MJ21 XNF",
      make: "Vauxhall",
      model: "Corsa",
      colour: "White",
      keeperId: "p45-ogundipe",
      keeperName: "Brindle Heath Housing (pool car)",
      notes: [
        "Housing association pool car, driven by the informant. Parked on Churchill Way outside the block.",
      ],
      scenarioId: "45",
    },
  ],

  places: [
    {
      id: "pl45-block",
      kind: "premises",
      name: "18 Churchill Way — walk-up block",
      address: "18 Churchill Way, Pendleton, Salford",
      postcode: "M6 5QX",
      coords: { lat: 53.486, lng: -2.2834 },
      notes: [
        "Three-storey walk-up, six flats, two per floor off a shared stair. No lift. Flat 6 is first floor.",
        "Communal door on a fob; the housing officer meets units there. Bin store against the west end of the block.",
        "Flat doors uPVC multipoint, fitted in the 2010s — snap the cylinder rather than ram it.",
        "Landlord: Brindle Heath Housing. Keys held on a board at the office, not by officers on the ground. No keyholder on any emergency-service system.",
      ],
      scenarioId: "45",
    },
    // The precinct itself. Real, and here only so the desk can see where
    // the block sits in relation to it — nothing in this job happens
    // inside it.
    {
      id: "pl45-precinct",
      kind: "landmark",
      name: "Salford Shopping City",
      address: "Pendleton Way, Pendleton, Salford",
      coords: { lat: 53.4889, lng: -2.2877 },
      notes: [
        "The precinct. A landmark for units approaching from the A6 — the block is on the estate a few hundred metres to its south-east.",
        "Nothing in this scenario happens inside it.",
      ],
      scenarioId: "45",
    },
  ],
};
