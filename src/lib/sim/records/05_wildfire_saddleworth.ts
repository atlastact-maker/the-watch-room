import type { RecordSet } from "../records";

// Records for scenario 05 — Moorland Fire, Saddleworth / Wessenden Head.
//
// Everyone here is fictional. Streets are real, house numbers are not.
// Phone numbers are Ofcom's reserved drama range. VRMs are invented.
//
// The scenario has no CRS vehicles; the two cars in the A635 layby are
// scene landmarks ("Walker's car (caller)" and an unlabelled second car)
// and are recorded here as the caller's car and a second car whose
// keeper is known only from the plate. The single scene casualty
// ("cas-walker", F ~60) is linked to the keeper's wife by casualtyId,
// but nothing in her record says so: the desk cannot know at time of
// call that anyone is on the hill — the caller's walker sighting is a
// 50% beat at 130 s, and the walker herself is found by crews sweeping
// the path.

export const records05: RecordSet = {
  scenarioId: "05",

  people: [
    {
      id: "p05-caller-harrison",
      name: "HARRISON, Sophie",
      sex: "F",
      age: 34,
      address: "27 Manchester Road, Mossley, Ashton-under-Lyne",
      phone: "07700 900341",
      roles: ["caller", "keeper"],
      scenarioId: "05",
      vehicleIds: ["v05-caller-octavia"],
      notes: [
        "999 caller 1 — walker, at her car in the A635 layby. Reports a line of flame ~100m wide across the moor above the reservoir, wind pushing it uphill away from her.",
        "No previous contact.",
      ],
    },
    {
      id: "p05-whittaker-pauline",
      name: "SCHOFIELD, Christine",
      sex: "F",
      age: 61,
      address: "14 High Street, Uppermill, Oldham",
      phone: "07700 900518",
      roles: ["witness"],
      scenarioId: "05",
      casualtyId: "cas-walker",
      notes: [
        "Not at the vehicle in the layby — believed walking the Pennine Way with husband Peter (same address), per the keeper check on MV16 RJA.",
        "No medical history held.",
      ],
    },
    {
      id: "p05-whittaker-graham",
      name: "SCHOFIELD, Peter",
      sex: "M",
      age: 63,
      address: "14 High Street, Uppermill, Oldham",
      phone: "07700 900519",
      roles: ["witness", "keeper"],
      scenarioId: "05",
      vehicleIds: ["v05-walkers-golf"],
      notes: [
        "Not at the vehicle in the layby — believed walking the Pennine Way with wife Christine (same address), per the keeper check on MV16 RJA.",
        "Registered keeper of MV16 RJA — the second car in the A635 layby.",
      ],
    },
    {
      id: "p05-booth-neil",
      name: "BOOTH, Neil",
      sex: "M",
      age: 52,
      address: "3 Chew Valley Road, Greenfield, Oldham",
      phone: "07700 900207",
      roles: ["witness", "keeper"],
      scenarioId: "05",
      vehicleIds: ["v05-keeper-hilux"],
      notes: [
        "Moor keeper for the shooting estate — holds the gate key for the track to the shooting cabin; knows the tracks, the boggy ground and the water on the hill.",
        "Listed as estate contact on the moorland fire partnership sheet (National Trust / PDNPA). Can attend with 4×4 and beaters.",
      ],
    },
    {
      id: "p05-akhtar-imran",
      name: "AKHTAR, Imran",
      sex: "M",
      age: 29,
      address: "51 Huddersfield Road, Stalybridge",
      phone: "07700 900776",
      roles: ["caller", "keeper"],
      scenarioId: "05",
      vehicleIds: ["v05-motorist-transit"],
      notes: [
        "999 caller 2 — motorist on the A635, Greenfield-bound. Reports smoke visible from the A635 above the reservoir.",
        "No previous contact.",
      ],
    },
  ],

  vehicles: [
    {
      id: "v05-caller-octavia",
      vrm: "MK19 HZW",
      make: "Skoda",
      model: "Octavia Estate",
      colour: "Grey",
      keeperId: "p05-caller-harrison",
      keeperName: "HARRISON, Sophie",
      scenarioId: "05",
      notes: [
        "Caller 1's car — parked in the A635 layby. Will need moving if the layby is taken as the RVP.",
      ],
    },
    {
      id: "v05-walkers-golf",
      vrm: "MV16 RJA",
      make: "Volkswagen",
      model: "Golf",
      colour: "Blue",
      keeperId: "p05-whittaker-graham",
      keeperName: "SCHOFIELD, Peter",
      scenarioId: "05",
      notes: [
        "Second car in the A635 layby — keeper not at the vehicle.",
      ],
    },
    {
      id: "v05-keeper-hilux",
      vrm: "MF67 VGT",
      make: "Toyota",
      model: "Hilux",
      colour: "Green",
      keeperId: "p05-booth-neil",
      keeperName: "BOOTH, Neil",
      scenarioId: "05",
      notes: [
        "Estate pickup — 4×4, used on the moor tracks. Keeper can open the cabin track gate off the A635.",
      ],
    },
    {
      id: "v05-motorist-transit",
      vrm: "YK20 EJH",
      make: "Ford",
      model: "Transit Custom",
      colour: "White",
      keeperId: "p05-akhtar-imran",
      keeperName: "AKHTAR, Imran",
      scenarioId: "05",
      notes: [
        "Caller 2's van — on the A635, Greenfield-bound.",
      ],
    },
  ],

  places: [
    {
      id: "pl05-layby-a635",
      kind: "landmark",
      name: "A635 layby — staging / RVP",
      address: "Layby, A635 Holmfirth Road (Isle of Skye road), Saddleworth Moor, Greenfield",
      postcode: "OL3 7NN",
      coords: { lat: 53.55225, lng: -1.97392 },
      scenarioId: "05",
      notes: [
        "RVP for the moor — pumps hold here as relay base and crew welfare; wildfire units and 4×4 only beyond the road.",
        "Two cars parked at time of call: caller 1's Skoda (MK19 HZW) and a Golf, MV16 RJA (keeper SCHOFIELD, Peter).",
        "GMP closure point — A635 both directions at the layby if the wind brings smoke across the road.",
      ],
    },
    {
      id: "pl05-pennine-way-crossing",
      kind: "landmark",
      name: "Pennine Way — A635 crossing",
      address: "Pennine Way footpath, crossing the A635 at Wessenden Head, Saddleworth Moor",
      postcode: "OL3 7NN",
      coords: { lat: 53.55215, lng: -1.97488 },
      scenarioId: "05",
      notes: [
        "Footpath access from the road — start point for a sweep of walkers north of the fire line.",
        "Rangers can marshal the path at the road under the PDNPA partnership protocol.",
      ],
    },
    {
      id: "pl05-wessenden-dam",
      kind: "landmark",
      name: "Wessenden Head Reservoir — dam head",
      address: "Wessenden Head Reservoir, off A635, Saddleworth Moor",
      postcode: "OL3 7NN",
      coords: { lat: 53.55345, lng: -1.97582 },
      scenarioId: "05",
      notes: [
        "Water company asset — liaison with United Utilities control before drafting from the reservoir (per PRI).",
        "Bank reached on foot from the Pennine Way; no vehicle access to the water's edge.",
      ],
    },
    {
      id: "pl05-shooting-cabin",
      kind: "premises",
      name: "Shooting cabin (estate)",
      address: "Shooting cabin, moor track off A635 Holmfirth Road, Saddleworth Moor",
      postcode: "OL3 7NN",
      coords: { lat: 53.55228, lng: -1.9762 },
      scenarioId: "05",
      notes: [
        "Unoccupied estate building — stone, no services. Gate on the track from the A635 is padlocked; key held by estate keeper BOOTH, Neil.",
        "Track passable by 4×4 as far as the cabin only — boggy ground beyond, no vehicles.",
      ],
    },
  ],
};
