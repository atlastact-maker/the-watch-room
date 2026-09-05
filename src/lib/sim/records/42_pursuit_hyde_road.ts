import type { RecordSet } from "../records";

// Records for scenario 42 — fail to stop, A57 Hyde Road.
//
// A pursuit puts three records on the desk: the car, the person it was
// taken from, and the person believed to be in it. The plate is what the
// operator will actually type, and what comes back — STOLEN, an ANPR
// marker, a keeper who is a burglary victim and not the driver — is the
// whole proportionality question in three lines.
//
// Everyone here is fictional, and so are the house numbers. Nothing
// reveals which way the night's roll lands — the driver is recorded as
// believed to be using the car, not as about to crash it or run.

export const records42: RecordSet = {
  scenarioId: "42",
  people: [
    {
      id: "p42-holt",
      name: "HOLT, Daniel",
      sex: "M",
      age: 31,
      address: "GMP — City of Manchester division, response",
      roles: ["caller", "witness"],
      notes: [
        "Pursuing officer, callsign AP314. Single-crewed response driver, initial-phase pursuit trained — can follow and commentate, cannot run tactics.",
        "Attempted the stop on Hyde Road at Belle Vue for the manner of driving. The Golf accelerated away eastbound before any check had come back.",
        "Commentary relayed through the control room; not on a phone.",
      ],
      scenarioId: "42",
    },
    {
      id: "p42-keeper-whitworth",
      name: "WHITWORTH, Carol",
      sex: "F",
      age: 58,
      address: "14 Lynmouth Avenue, Reddish, Stockport",
      postcode: "SK5 7AL",
      phone: "0161 496 0417",
      roles: ["keeper", "victim"],
      notes: [
        "Registered keeper of MK66 HZR. Reported it stolen two nights ago — keys taken from the hall table in a burglary while she slept upstairs. Crime reference on the CAD.",
        "Not involved tonight. Has asked to be told if the car is found.",
      ],
      scenarioId: "42",
      vehicleIds: ["v42-golf"],
    },
    {
      id: "p42-driver-rourke",
      name: "ROURKE, Kieran",
      sex: "M",
      age: 23,
      address: "Abbey Hey Lane, Gorton, Manchester",
      postcode: "M18 8SA",
      phone: "07700 900118",
      roles: ["suspect"],
      markers: ["WANTED"],
      notes: [
        "Named in intelligence as the person seen using MK66 HZR since it was taken. Not confirmed as tonight's driver until he is stopped.",
        "Description passed by AP314 of the driver: IC1 male, early twenties, grey hooded top — matches.",
        "Wanted on a fail-to-appear warrant for driving while disqualified. Disqualified driver.",
        "Previous for taking without consent and fail to stop. No weapons history recorded.",
      ],
      scenarioId: "42",
      vehicleIds: ["v42-golf"],
    },
  ],
  vehicles: [
    {
      id: "v42-golf",
      vrm: "MK66 HZR",
      make: "Volkswagen",
      model: "Golf 1.6 TDI",
      colour: "Grey",
      keeperId: "p42-keeper-whitworth",
      keeperName: "WHITWORTH, Carol — Reddish, Stockport SK5 7AL",
      markers: ["STOLEN", "ANPR INTEREST"],
      notes: [
        "Reported STOLEN two nights ago — taken with its keys in a burglary at the keeper's address in Reddish. ANPR marker placed the same night.",
        "Read twice since on the A57 corridor, both times eastbound in the early hours. Not stopped.",
        "Tonight: failed to stop for AP314 on Hyde Road at Belle Vue, eastbound. One occupant seen.",
      ],
      scenarioId: "42",
    },
  ],
  places: [
    {
      id: "pl42-scene",
      kind: "scene",
      name: "A57 Hyde Road, Gorton — Belle Vue",
      address: "Hyde Road (A57), Gorton, Manchester",
      postcode: "M18 7AF",
      coords: { lat: 53.4621, lng: -2.1785 },
      notes: [
        "Four-lane urban A-road, 30 mph, signal crossings and bus stops. Garratt Way retail park (Aldi, Tesco Extra) on the north side, housing on the south.",
        "Point of the attempted stop, just east of Belle Vue station. The pursuit ran eastbound from here toward the Reddish Lane lights at Debdale.",
        "South of the road: a 20 mph residential grid — Williams Road, Bakewell Street, Haworth Road, Far Lane, Old Hall Drive — bounded by the Fallowfield Loop cycle path on the old railway line.",
      ],
      scenarioId: "42",
    },
    {
      id: "pl42-keeper-house",
      kind: "premises",
      name: "14 Lynmouth Avenue",
      address: "14 Lynmouth Avenue, Reddish, Stockport",
      postcode: "SK5 7AL",
      coords: { lat: 53.436, lng: -2.1618 },
      notes: [
        "Keeper's address. Burglary two nights ago — entry by the rear door, keys taken from the hall, MK66 HZR driven off the drive. Scene examined; nothing outstanding here tonight.",
      ],
      scenarioId: "42",
    },
    {
      id: "pl42-loop",
      kind: "landmark",
      name: "Fallowfield Loop — Gorton section",
      address: "Fallowfield Loop cycle path, south of Hyde Road, Gorton, Manchester",
      postcode: "M18 7FE",
      coords: { lat: 53.458, lng: -2.165 },
      notes: [
        "Traffic-free path on the old railway line along the south edge of the estate. A decamp's natural line — NPAS thermal and a dog track are what work here, not officers on foot.",
        "Ryder Brow station lies to the west along the Hope Valley line.",
      ],
      scenarioId: "42",
    },
  ],
};
