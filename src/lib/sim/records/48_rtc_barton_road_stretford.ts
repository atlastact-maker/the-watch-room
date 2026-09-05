import type { RecordSet } from "../records";

// Records for scenario 48 — RTC, damage only, Barton Road, Stretford.
//
// Four people, two cars, one junction. The thing worth finding here is
// the BMW: a MID check with no policy on it explains, before the car
// arrives, why one driver will not hand over his details. Nothing in
// these records says which way the slow-attendance roll lands — the
// husband is recorded as on his way, not as about to be in a fight.
//
// Everyone here is fictional, and so are the house numbers. The streets
// are real.

export const records48: RecordSet = {
  scenarioId: "48",
  people: [
    {
      id: "p48-grundy",
      name: "GRUNDY, Paul",
      sex: "M",
      age: 61,
      address: "231 Barton Road, Stretford, Manchester",
      postcode: "M32 9RA",
      phone: "0161 496 0418",
      roles: ["caller", "witness"],
      notes: [
        "Resident opposite the junction and the informant. On the footway outside his own house, watching both drivers.",
        "Retired. Calm on the line. Has asked both drivers whether they are hurt and says neither is.",
      ],
      scenarioId: "48",
    },
    {
      id: "p48-ashcroft-linda",
      name: "ASHCROFT, Linda",
      sex: "F",
      age: 56,
      address: "14 Moss Park Road, Stretford, Manchester",
      postcode: "M32",
      phone: "07700 900174",
      roles: ["keeper", "witness"],
      notes: [
        "Driver of the Toyota. Pulled out of Moss Park Road to turn towards Park Road; says the BMW was 'flying'. Uninjured, shaken.",
        "No trace on police systems. Full licence; insured on the vehicle per MID.",
        "Has rung her husband Graham from the scene — see record.",
      ],
      scenarioId: "48",
      vehicleIds: ["v48-yaris"],
    },
    {
      id: "p48-preston",
      name: "PRESTON, Callum",
      sex: "M",
      age: 24,
      address: "37 Winster Avenue, Stretford, Manchester",
      postcode: "M32",
      phone: "07700 900531",
      roles: ["keeper", "suspect"],
      notes: [
        "Driver of the BMW. Says the Toyota pulled out on him without looking. Uninjured. Verbally aggressive towards the other driver from the outset, per the caller.",
        "Registered keeper of the BMW since March 2025. MID shows no live policy on it — see the vehicle record.",
        "One previous: s.5 Public Order Act 1986, Stretford, 2023 — community resolution. Nothing since.",
      ],
      scenarioId: "48",
      vehicleIds: ["v48-bmw"],
    },
    {
      id: "p48-ashcroft-graham",
      name: "ASHCROFT, Graham",
      sex: "M",
      age: 58,
      address: "14 Moss Park Road, Stretford, Manchester",
      postcode: "M32",
      phone: "07700 900175",
      roles: ["witness"],
      notes: [
        "Husband of the Toyota driver. Rung by her from the scene and driving over from work in Trafford Park; not on scene at the time of the call.",
        "No trace.",
      ],
      scenarioId: "48",
    },
  ],
  vehicles: [
    {
      id: "v48-yaris",
      vrm: "MJ16 RWL",
      make: "Toyota",
      model: "Yaris",
      colour: "Silver",
      keeperId: "p48-ashcroft-linda",
      keeperName: "ASHCROFT, Linda — Moss Park Road, Stretford M32",
      notes: [
        "The Toyota. Front nearside taken out, wheel pushed back under the arch — will not roll. Recovery required.",
        "MID: insured. MOT current. No markers.",
      ],
      scenarioId: "48",
    },
    {
      id: "v48-bmw",
      vrm: "MV67 HKD",
      make: "BMW",
      model: "118d (1 Series)",
      colour: "Black",
      keeperId: "p48-preston",
      keeperName: "PRESTON, Callum — Winster Avenue, Stretford M32",
      markers: ["NO INSURANCE"],
      notes: [
        "The BMW. Front offside damage, headlamp gone, bumper hanging, coolant on the road under it. Driveable in theory; not before the road is clear.",
        "MID: no live policy recorded against this VRM at the time of the check. Not conclusive on its own — a policy bought today can lag the database — but it is the first question on scene and, if it stands, a s.143 Road Traffic Act 1988 offence with seizure under s.165A.",
        "Keeper since 03/2025. MOT current. No PNC report.",
      ],
      scenarioId: "48",
    },
  ],
  places: [
    {
      id: "pl48-junction",
      kind: "landmark",
      name: "Barton Road / Moss Park Road junction",
      address: "Barton Road at Moss Park Road, Stretford, Manchester",
      postcode: "M32 9RA",
      coords: { lat: 53.4479, lng: -2.3156 },
      notes: [
        "Two-lane 30 mph borough road with housing either side. Moss Park Road (20 mph residential) joins from the west and Barton Road bends here; the German church is on the north side a little further along towards Park Road.",
        "Bus route, with stops either side of the junction. No hard shoulder and no verge — a protecting vehicle sits in a live lane.",
        "Approach from Park Road to the east or from Sevenways to the north-west; Moss Park Road from the west avoids the queue.",
      ],
      scenarioId: "48",
    },
  ],
};
