import type { RecordSet } from "../records";

// Records for scenario 40 — burglary in progress, Ladythorn Road, Bramhall.
//
// A burglary in progress puts four things on the desk: the caller, the
// person who is not there but whose house it is, the plate she reads
// off the car across the road, and what that plate comes back to. The
// plate is the searchable one. It returns to a car that is sitting on a
// drive in Sale, which tells the operator more about the people in
// Bramhall than a clean check would have.
//
// Everyone here is fictional, and so is the house number. Nothing
// reveals which way the night rolls — the offenders are recorded as
// being in the house, not as being about to leave it.

export const records40: RecordSet = {
  scenarioId: "40",
  people: [
    {
      id: "p40-hargreaves-judith",
      name: "HARGREAVES, Judith",
      sex: "F",
      age: 58,
      address: "14 Ladythorn Road, Bramhall, Stockport",
      postcode: "SK7 2ES",
      phone: "07700 900418",
      roles: ["caller", "victim", "occupant"],
      notes: [
        "Occupier and the informant. Upstairs in the front bedroom with the door locked; whispering. Asked for a silent approach on the initial call.",
        "Alone in the house — husband away overnight.",
        "No previous contact with police at this address.",
      ],
      scenarioId: "40",
    },
    {
      id: "p40-hargreaves-michael",
      name: "HARGREAVES, Michael",
      sex: "M",
      age: 61,
      address: "14 Ladythorn Road, Bramhall, Stockport",
      postcode: "SK7 2ES",
      phone: "07700 900419",
      roles: ["occupant"],
      notes: [
        "Joint occupier. Away overnight for work and not on scene. Rung by his wife before the 999 call; no answer.",
      ],
      scenarioId: "40",
    },
    {
      id: "p40-whitfield",
      name: "WHITFIELD, Susan",
      sex: "F",
      age: 47,
      address: "Sale, Trafford",
      postcode: "M33",
      phone: "0161 496 0733",
      roles: ["keeper"],
      notes: [
        "Registered keeper of the genuine MK68 XWP — a black Audi A4 Avant that has been on her drive in Sale all evening. Not involved.",
        "Reported the plate cloned in August after a parking charge from a car park she had never used.",
      ],
      scenarioId: "40",
      vehicleIds: ["v40-audi"],
    },
    {
      id: "p40-dunne",
      name: "DUNNE, Kyle",
      sex: "M",
      age: 24,
      address: "Adswood, Stockport",
      postcode: "SK3",
      roles: ["suspect"],
      markers: ["WANTED"],
      notes: [
        "Nominal linked by ANPR intelligence to the cloned MK68 XWP — NOT confirmed as tonight's offender. For information, not for arrest on sight of the car alone.",
        "Previous for burglary dwelling and going equipped. Wanted on a warrant for failing to attend Stockport Magistrates' Court in July.",
        "Known to run from police. No history of violence towards officers.",
      ],
      scenarioId: "40",
    },
  ],
  vehicles: [
    {
      id: "v40-audi",
      vrm: "MK68 XWP",
      make: "Audi",
      model: "A4 Avant",
      colour: "Black",
      keeperId: "p40-whitfield",
      keeperName: "WHITFIELD, Susan — Sale, Trafford M33",
      markers: ["ANPR INTEREST", "CLONED PLATES"],
      notes: [
        "CLONED PLATES — this VRM was captured at two sites thirty miles apart within ten minutes in August. The car carrying it tonight is not the keeper's; the keeper's is on her drive in Sale.",
        "ANPR INTEREST — the clone has been read in the Bramhall and Cheadle Hulme area on two nights that match rear-entry burglaries on Ladythorn Crescent and Rossall Drive. Stop and check the occupants if sighted; do not approach on the plate alone.",
        "Intelligence links the clone to DUNNE, Kyle (Adswood) — unconfirmed.",
      ],
      scenarioId: "40",
    },
  ],
  places: [
    {
      id: "pl40-house",
      kind: "premises",
      name: "14 Ladythorn Road",
      address: "14 Ladythorn Road, Bramhall, Stockport",
      postcode: "SK7 2ES",
      coords: { lat: 53.3603, lng: -2.158 },
      notes: [
        "Detached, two storey, set back behind a front garden with a drive down the north-west side to a side gate. uPVC patio doors at the rear onto a long garden.",
        "Rear garden backs onto the gardens of the Ladythorn Crescent houses behind — the line out the back comes out on a different road from the one you arrive on.",
        "No previous calls. Occupiers HARGREAVES.",
      ],
      scenarioId: "40",
    },
    {
      id: "pl40-crescent",
      kind: "landmark",
      name: "Ladythorn Crescent — rear approach",
      address: "Ladythorn Crescent, Bramhall, Stockport",
      coords: { lat: 53.3594, lng: -2.1556 },
      notes: [
        "The road behind the target — a loop off the north-east side of Ladythorn Road, leaving it 60 m north-west of the house and rejoining at the south-east end about 170 m away. Go in at the south-east end: the near junction is in view of the front windows.",
        "A unit here covers the bottom fences on foot. Unlit gardens between here and the house; this is where a dog track starts.",
      ],
      scenarioId: "40",
    },
  ],
};
