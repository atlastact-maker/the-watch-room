import type { RecordSet } from "../records";

// Scenario 04 — Industrial fire, Albright Plastics, Trafford Park.
//
// Everyone here is fictional. Streets are real (Mosley Road, Trafford
// Wharf Road, Third Avenue and the home addresses), unit and house
// numbers are not. Phones are in Ofcom's reserved drama ranges. The
// scenario has no CRS vehicles; the three below are what the scene
// draws in the yard — two staff cars and the HGV trailer — given
// keepers the story can use. The scenario location itself is derived
// automatically and is not repeated here.
//
// The two "unaccounted" on the duty manager's headcount ARE the two
// scene casualties (cas-worker-1, cas-worker-2), so the records agree
// with the property block, the METHANE N line and the informant script.

export const records04: RecordSet = {
  scenarioId: "04",

  people: [
    // The 999 caller — "I'm the manager next door".
    {
      id: "p04-caller-brennan",
      name: "BRENNAN, Siobhan",
      sex: "F",
      age: 52,
      address: "Unit 3, Mosley Road, Trafford Park, Manchester",
      postcode: "M17 1FE",
      phone: "07700 900462",
      roles: ["caller", "witness"],
      notes: [
        "999 caller — site manager, Wharfside Corrugated Ltd, the neighbouring unit to the west (Sector 4). Reports thick black smoke from Albright's roof vents; their staff evacuating into the yard.",
        "Albright duty manager (OKAFOR) is standing with the caller — headcount two short, last seen near the dispatch office.",
        "Stays on the line; has a view of the roller door and the yard from her own yard.",
      ],
      scenarioId: "04",
    },

    // Albright Plastics duty manager — the PRI's 24/7 emergency contact.
    {
      id: "p04-duty-okafor",
      name: "OKAFOR, Victor",
      sex: "M",
      age: 46,
      address: "Albright Plastics Ltd, Mosley Road, Trafford Park, Manchester",
      postcode: "M17 1FE",
      phone: "07700 900251",
      roles: ["witness", "occupant"],
      notes: [
        "24/7 emergency contact on the Albright Plastics PRI — this is the duty mobile.",
        "Headcount at the assembly point two short: HUSSAIN and KOWALSKA, both last seen near the dispatch office, front (SW) corner.",
        "Holds the cylinder register and the site plan annexed to the PRI; knows the smoke-vent override panel by the main office.",
      ],
      scenarioId: "04",
    },

    // Casualty 1 — found by the dispatch office, smoke inhalation.
    {
      id: "p04-patient-hussain",
      name: "HUSSAIN, Adnan",
      sex: "M",
      age: 41,
      address: "112 Derbyshire Lane, Stretford, Manchester",
      phone: "07700 900633",
      roles: ["patient", "occupant"],
      notes: [
        "Unaccounted on the duty manager's headcount — last seen near the dispatch office.",
        "Shift operative, dispatch. Staff car (Astra) parked in the yard, Sector 1.",
      ],
      scenarioId: "04",
      casualtyId: "cas-worker-1",
      vehicleIds: ["v04-astra-hussain"],
    },

    // Casualty 2 — self-extricated to the yard, coughing.
    {
      id: "p04-patient-kowalska",
      name: "KOWALSKA, Marta",
      sex: "F",
      age: 28,
      address: "47 Liverpool Road, Eccles, Manchester",
      phone: "07700 900271",
      roles: ["patient", "occupant"],
      notes: [
        "Unaccounted on the duty manager's headcount — last seen near the dispatch office with HUSSAIN.",
        "Shift operative, dispatch office. Staff car (Fiesta) parked in the yard, Sector 1.",
      ],
      scenarioId: "04",
      casualtyId: "cas-worker-2",
      vehicleIds: ["v04-fiesta-kowalska"],
    },

    // The HGV driver whose trailer is on the yard by the roller door.
    {
      id: "p04-witness-duffy",
      name: "DUFFY, Kevin",
      sex: "M",
      age: 57,
      address: "23 Atherton Road, Hindley, Wigan",
      phone: "07700 900548",
      roles: ["witness"],
      notes: [
        "HGV driver, Barton Freight Services. Was in the yard waiting to load when the alarm went; moved clear to Mosley Road.",
        "Trailer left coupled on the yard near the roller door — cannot be moved without going back in.",
      ],
      scenarioId: "04",
      vehicleIds: ["v04-daf-artic"],
    },
  ],

  vehicles: [
    {
      id: "v04-astra-hussain",
      vrm: "MK19 WFP",
      make: "Vauxhall",
      model: "Astra",
      colour: "Silver",
      keeperId: "p04-patient-hussain",
      keeperName: "HUSSAIN, Adnan",
      notes: [
        "Staff car — parked in the yard, Sector 1, on the molten-run line from the roller door.",
      ],
      scenarioId: "04",
    },
    {
      id: "v04-fiesta-kowalska",
      vrm: "MJ68 XRT",
      make: "Ford",
      model: "Fiesta",
      colour: "Blue",
      keeperId: "p04-patient-kowalska",
      keeperName: "KOWALSKA, Marta",
      notes: [
        "Staff car — parked in the yard, Sector 1, next to the Astra.",
      ],
      scenarioId: "04",
    },
    {
      id: "v04-daf-artic",
      vrm: "PN21 LZD",
      make: "DAF",
      model: "XF 480 tractor unit + curtainsider",
      colour: "White",
      keeperName: "Barton Freight Services Ltd",
      notes: [
        "Artic on the yard near the roller door, driver DUFFY clear. Trailer part-loaded with palletised granulate — combustible load in the yard.",
        "Operator: Barton Freight Services Ltd, Trafford Park. Transport office 0161 496 0512.",
      ],
      scenarioId: "04",
    },
  ],

  places: [
    // The caller's premises — the neighbouring unit to the west.
    {
      id: "pl04-neighbour-unit",
      kind: "premises",
      name: "Wharfside Corrugated Ltd (neighbouring unit)",
      address: "Unit 3, Mosley Road, Trafford Park, Manchester",
      postcode: "M17 1FE",
      coords: { lat: 53.4697, lng: -2.3296 },
      notes: [
        "Caller's premises — manager BRENNAN, landline 0161 496 0731. Shares the west boundary with Albright's yard; Sector 4.",
        "Corrugated board store — combustible stock; exposure if the fire runs west along the shed.",
        "Own yard gives a view of the roller door; useful for the informant and a Sector 4 pump.",
      ],
      scenarioId: "04",
    },

    // The distribution shed to the east — the cylinder-side exposure.
    {
      id: "pl04-distribution-shed",
      kind: "premises",
      name: "Trafford Wharf Distribution — shed (east neighbour)",
      address: "Unit 9, Trafford Wharf Road, Trafford Park, Manchester",
      coords: { lat: 53.4697, lng: -2.3271 },
      notes: [
        "Exposure — east of the maintenance bay (nitrogen + acetylene); inside a 200 m cylinder cordon.",
        "Palletised goods, 24-hour operation — staff on site; evacuate if the BLEVE clock starts.",
        "Duty contact via the security desk, 0161 496 0844.",
      ],
      scenarioId: "04",
    },

    // The nearest housing — the plume's first residential receptor.
    {
      id: "pl04-village",
      kind: "landmark",
      name: "Trafford Park Village (Third / Fourth Avenue)",
      address: "Third Avenue, Trafford Park, Manchester",
      coords: { lat: 53.4678, lng: -2.3312 },
      notes: [
        "Nearest residential to the site — small terraced pocket around Village Circle, south-west of Mosley Road.",
        "Plume receptor on a northerly or easterly wind — warn and inform (stay in, close windows) before any evacuation.",
      ],
      scenarioId: "04",
    },
  ],
};
