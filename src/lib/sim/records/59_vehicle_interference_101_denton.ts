import type { RecordSet } from "../records";

// Records for scenario 59 — vehicle interference in progress on 101,
// Egerton Street, Denton.
//
// The caller at her window, the keepers of the two vehicles he was in,
// and the one name the beat intelligence puts against a slim male in a
// dark hooded top working cars at night in Denton West. He is not
// confirmed as tonight's male and the record says so; a PNC check on
// the description is a lead, not an identification.
//
// Everyone here is fictional, as are the house numbers and both plates.
// Egerton Street, Denton, is real.

export const records59: RecordSet = {
  scenarioId: "59",
  people: [
    {
      id: "p59-caller-kyle",
      name: "KYLE, Bernadette",
      sex: "F",
      ethnicity: "W",
      age: 67,
      address: "9 Egerton Street, Denton",
      postcode: "M34 3PH",
      phone: "07700 900662",
      roles: ["caller", "witness"],
      notes: [
        "Watching from her upstairs front bedroom window with the light off; the offender has not seen her.",
        "Rang 101 rather than 999 because nobody was being hurt. Can describe him and say which way he moves; cannot see his face.",
      ],
      scenarioId: "59",
    },
    {
      id: "p59-mcgrath-paul",
      name: "MCGRATH, Paul",
      sex: "M",
      ethnicity: "W",
      age: 41,
      address: "13 Egerton Street, Denton",
      postcode: "M34 3PH",
      phone: "07700 900673",
      roles: ["keeper", "victim"],
      notes: ["Keeper of the grey Astra the offender was seen inside. Asleep at the time; contact number from the V5."],
      scenarioId: "59",
      vehicleIds: ["v59-astra"],
    },
    {
      id: "p59-boyle-dean",
      name: "BOYLE, Dean",
      sex: "M",
      ethnicity: "W",
      age: 36,
      address: "15 Egerton Street, Denton",
      postcode: "M34 3PH",
      phone: "07700 900695",
      roles: ["keeper", "victim"],
      notes: ["Keeper of the white Berlingo tried after the Astra. Self-employed plasterer; tools in the van overnight."],
      scenarioId: "59",
      vehicleIds: ["v59-van"],
    },
    {
      id: "p59-haworth-tyler",
      name: "HAWORTH, Tyler",
      sex: "M",
      ethnicity: "W",
      age: 19,
      address: "No fixed abode — last known Crown Point, Denton",
      roles: ["suspect"],
      markers: ["DRUGS"],
      notes: [
        "Named on the beat intelligence for the Denton West theft-from-motor-vehicle series since September — slim, dark hooded top, on foot, nights. NOT confirmed as tonight's male; nothing in the caller's description excludes him.",
        "Two previous convictions for theft from a motor vehicle (2024, 2025). Bail conditions expired. No warning markers for violence.",
      ],
      scenarioId: "59",
    },
  ],
  vehicles: [
    {
      id: "v59-astra",
      vrm: "DK19 PXA",
      make: "Vauxhall",
      model: "Astra",
      colour: "Grey",
      keeperId: "p59-mcgrath-paul",
      keeperName: "MCGRATH, Paul — Egerton Street, Denton",
      notes: [
        "Parked outside no. 13 overnight. Interior light on and a male inside at the time of the call — the vehicle he was in. Not known whether it was left unlocked or forced.",
        "No markers.",
      ],
      scenarioId: "59",
    },
    {
      id: "v59-van",
      vrm: "MJ67 KRD",
      make: "Citroën",
      model: "Berlingo",
      colour: "White",
      keeperId: "p59-boyle-dean",
      keeperName: "BOYLE, Dean — Egerton Street, Denton",
      notes: [
        "Parked outside no. 15. Tried after the Astra; the caller saw him with something under his arm as he left it.",
        "No markers.",
      ],
      scenarioId: "59",
    },
  ],
  places: [
    {
      id: "pl59-no9",
      kind: "premises",
      name: "9 Egerton Street, Denton",
      address: "9 Egerton Street, Denton",
      postcode: "M34 3PH",
      coords: { lat: 53.4547, lng: -2.1141 },
      notes: ["The caller's house, west side of the street; upstairs front window looks south down the street towards the Astra and the van."],
      scenarioId: "59",
    },
    {
      id: "pl59-ginnel",
      kind: "landmark",
      name: "Ginnel — Egerton Street to Stockport Road, beside no. 17",
      address: "Egerton Street, Denton",
      coords: { lat: 53.4541, lng: -2.1139 },
      notes: [
        "The way out on foot to Stockport Road. A car arriving with lights or sirens from the Hyde Road end sends him down here.",
        "Denton West theft-from-motor-vehicle series since September: nine offences between midnight and four, one description, nobody arrested.",
      ],
      scenarioId: "59",
    },
  ],
};
