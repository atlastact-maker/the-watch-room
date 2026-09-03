import type { RecordSet } from "../records";

// Scenario 07 — High-rise flat fire, Quay Heights, Salford Quays.
//
// Everyone here is fictional. Quay Heights is a synthetic tower on The
// Quays (a real road); every flat number, phone number and registration
// is invented. Phones sit in Ofcom's reserved drama ranges. The scenario
// location itself is derived by buildRecordIndex() and is NOT repeated
// here — these are the premises the story turns on around it.
//
// The scene lists two casualties: cas-12b (the caller, F ~29, trapped in
// the fire flat) and cas-14th (M ~81, mobility-restricted, 14th floor).
// The informant script has a concierge on a second line and neighbours
// either side of 12B reporting smells but no smoke. The scene draws
// three cars on the front plaza, one in the marked concierge bay.

export const records07: RecordSet = {
  scenarioId: "07",

  people: [
    // The 999 caller — and the Flat 12B casualty. One person, two roles.
    {
      id: "p07-caller-adeyemi",
      name: "ADEYEMI, Tolu",
      sex: "F",
      age: 29,
      address: "Flat 12B, Quay Heights, The Quays, Salford",
      postcode: "M50 3AZ",
      phone: "07700 900429",
      roles: ["caller", "patient", "occupant"],
      scenarioId: "07",
      casualtyId: "cas-12b",
      vehicleIds: ["v07-caller-fiesta"],
      notes: [
        "999 call (this incident): fire in the kitchen of Flat 12B, caller cut off from the front door — bedroom, then bathroom with a wet towel under the door. Kept on the line.",
        "Sole occupant of 12B per managing agent's tenancy list.",
        "No previous 999 contact from this number.",
      ],
    },

    // 14th-floor resident on the vulnerable persons register.
    {
      id: "p07-patient-whittaker",
      name: "WHITTAKER, Dennis",
      sex: "M",
      age: 81,
      address: "Flat 14D, Quay Heights, The Quays, Salford",
      postcode: "M50 3AZ",
      phone: "0161 496 0281",
      roles: ["patient", "occupant"],
      markers: ["MEDICAL", "VULNERABLE"],
      scenarioId: "07",
      casualtyId: "cas-14th",
      notes: [
        "On the Quay Heights vulnerable persons register (managing agent): mobility-restricted, walking frame, cannot manage stairs unaided.",
        "COPD — GP-registered, inhalers only, no home oxygen held. Carer visits mornings.",
        "Previous: NWAS attendance to this address 02/02/26 — COPD exacerbation, conveyed to Salford Royal.",
        "NOK: daughter — contact details held on the register.",
      ],
    },

    // The concierge — second informant on the desk line.
    {
      id: "p07-concierge-hussain",
      name: "HUSSAIN, Faisal",
      sex: "M",
      age: 38,
      address: "Concierge desk (podium), Quay Heights, The Quays, Salford",
      postcode: "M50 3AZ",
      phone: "0161 496 0330",
      roles: ["witness"],
      scenarioId: "07",
      vehicleIds: ["v07-concierge-astra"],
      notes: [
        "Second informant, concierge desk line: fire panel showing 12th floor, lifts grounded at ground in fire mode, vulnerable persons register out for crews.",
        "Quays Estate Management Ltd — night concierge, on duty at time of call. Holds keys to the fire panel, dry riser inlet cabinet and the maintenance van.",
      ],
    },

    // Neighbours either side of 12B — smells but no smoke, stay-put given.
    {
      id: "p07-occupant-12a-kowalska",
      name: "KOWALSKA, Justyna",
      sex: "F",
      age: 34,
      address: "Flat 12A, Quay Heights, The Quays, Salford",
      postcode: "M50 3AZ",
      phone: "07700 900577",
      roles: ["occupant", "witness"],
      scenarioId: "07",
      notes: [
        "Reported a smell of smoke to the concierge — no smoke in the flat. Stay-put advice given per building policy.",
        "Occupancy per managing agent: 2 adults, 1 child (3).",
      ],
    },
    {
      id: "p07-occupant-12c-gallagher",
      name: "GALLAGHER, Connor",
      sex: "M",
      age: 27,
      address: "Flat 12C, Quay Heights, The Quays, Salford",
      postcode: "M50 3AZ",
      phone: "07700 900609",
      roles: ["occupant", "witness"],
      scenarioId: "07",
      notes: [
        "Reported a smell of smoke to the concierge — no smoke in the flat. Stay-put advice given per building policy.",
        "Occupancy per managing agent: 1 adult.",
      ],
    },

    // The flat directly above — where smoke shows first if the riser
    // cupboard lets go.
    {
      id: "p07-occupant-13b-odonnell",
      name: "O'DONNELL, Siobhan",
      sex: "F",
      age: 45,
      address: "Flat 13B, Quay Heights, The Quays, Salford",
      postcode: "M50 3AZ",
      phone: "07700 900744",
      roles: ["occupant"],
      scenarioId: "07",
      notes: [
        "Directly above the fire flat. Contacted by the concierge — stay-put advice given; asked to report any smoke at the riser cupboard on the 13th-floor lobby.",
        "Occupancy per managing agent: 1 adult.",
      ],
    },
  ],

  vehicles: [
    // The three cars drawn on the front plaza. None are CRS vehicles.
    {
      id: "v07-caller-fiesta",
      vrm: "MJ21 WFA",
      make: "Ford",
      model: "Fiesta",
      colour: "Blue",
      keeperId: "p07-caller-adeyemi",
      keeperName: "ADEYEMI, Tolu",
      scenarioId: "07",
      notes: [
        "Parked in a visitor bay on the front plaza — keeper is the trapped occupant of Flat 12B; keys with the keeper.",
        "Keeper address: Flat 12B, Quay Heights, The Quays, Salford.",
      ],
    },
    {
      id: "v07-concierge-astra",
      vrm: "ML68 KDP",
      make: "Vauxhall",
      model: "Astra",
      colour: "Grey",
      keeperId: "p07-concierge-hussain",
      keeperName: "HUSSAIN, Faisal",
      scenarioId: "07",
      notes: [
        "Parked in the marked concierge bay on the front plaza — keeper on duty at the desk and can move it for appliance access.",
      ],
    },
    {
      id: "v07-agent-caddy",
      vrm: "MV70 YRJ",
      make: "Volkswagen",
      model: "Caddy",
      colour: "White",
      keeperName: "Quays Estate Management Ltd",
      scenarioId: "07",
      notes: [
        "Managing agent's sign-written maintenance van, parked on the front plaza — keys held at the concierge desk.",
        "Company keeper — fleet vehicle, no named driver.",
      ],
    },
  ],

  places: [
    // The neighbour tower drawn to the west of Quay Heights.
    {
      id: "pl07-neighbour-tower",
      kind: "premises",
      name: "Westbrook Point (neighbour tower)",
      address: "Westbrook Point, Huron Basin, Salford",
      postcode: "M50 3BJ",
      coords: { lat: 53.4731, lng: -2.2928 },
      scenarioId: "07",
      notes: [
        "18-storey residential tower ~50 m west of Quay Heights, shared plaza. Own concierge; own stay-put policy.",
        "Exposure only — no smoke reported. Appliance access along the shared plaza between the two towers (Sector 4).",
      ],
    },

    // The managing agent — holds the register and the plans.
    {
      id: "pl07-managing-agent",
      kind: "premises",
      name: "Quays Estate Management Ltd (managing agent)",
      address: "Unit 4, Anchorage Quay, Salford",
      postcode: "M50 3XE",
      coords: { lat: 53.4718, lng: -2.2935 },
      scenarioId: "07",
      notes: [
        "Managing agent for Quay Heights and Westbrook Point. Holds the vulnerable persons register and building plans; a copy of the register is kept at the Quay Heights concierge desk.",
        "Office unstaffed overnight — out-of-hours duty manager reached via the concierge desk line.",
      ],
    },

    // Assembly point from the building's fire strategy.
    {
      id: "pl07-assembly-point",
      kind: "landmark",
      name: "Quay Heights assembly point (fire strategy)",
      address: "Quayside promenade, The Quays, Salford",
      postcode: "M50 3AZ",
      coords: { lat: 53.4726, lng: -2.2915 },
      scenarioId: "07",
      notes: [
        "Designated assembly point per the building fire strategy — quayside promenade south-east of the podium, clear of the front plaza and appliance access.",
        "Resident marshalling and head-count against the concierge's tenancy list; police cordon point.",
      ],
    },

    // The helipad the PRI and scene both mention, 200 m north-east.
    {
      id: "pl07-helipad",
      kind: "landmark",
      name: "Helipad — Salford Quays (Quay Heights PRI)",
      address: "Quayside, off Anchorage Quay, Salford",
      postcode: "M50 3XE",
      coords: { lat: 53.4743, lng: -2.2899 },
      scenarioId: "07",
      notes: [
        "Landing area 200 m north-east of the tower per the Quay Heights PRI. Access on foot along the quayside walk; vehicle access from Anchorage Quay.",
        "HEMS option for the Flat 12B casualty if airway compromise progresses.",
      ],
    },
  ],
};
