import type { RecordSet } from "../records";

// Records for scenario 54 — youths on the parade roof, Haughton Green.
//
// A Grade 3 holds the people the desk will actually need if it stops
// being one: the caller, the lad she can put a name to and the mother
// behind him, and the man with the key to the yard gate. The vehicles
// are the two the script touches — the van they climb off and the car
// that took a stone.
//
// Everyone here is fictional, and so are the takeaway and both house
// numbers. Mancunian Road, Tatton Road and the parade are real. Nothing
// reveals which way the fall rolls: the lad is recorded as being on the
// roof, not as being about to come off it.

export const records54: RecordSet = {
  scenarioId: "54",
  people: [
    {
      id: "p54-caller-hough",
      name: "HOUGH, Janet",
      sex: "F",
      age: 58,
      address: "41 Mancunian Road, Haughton Green, Denton",
      postcode: "M34 7GY",
      phone: "07700 900431",
      roles: ["caller", "witness"],
      notes: [
        "Lives across Mancunian Road from the parade; watching from an upstairs front window with a clear view of the roof and the forecourt.",
        "Has rung about the same group before — twice this month by her own account. Knows one of them by name and the family's address.",
        "Her car is on the forecourt and has taken a stone to the bonnet.",
      ],
      scenarioId: "54",
      vehicleIds: ["v54-caller-car"],
    },
    {
      id: "p54-whittaker-kieran",
      name: "WHITTAKER, Kieran",
      sex: "M",
      age: 14,
      address: "12 Tatton Road, Haughton Green, Denton",
      postcode: "M34 7PL",
      roles: ["suspect"],
      markers: ["CHILD"],
      notes: [
        "Named by the caller as one of the group on the parade roof. Fourteen.",
        "Known to the neighbourhood team for anti-social behaviour around the parade — two community resolutions this year, no convictions, nothing recorded for violence.",
        "Mother is Donna WHITTAKER (on record). Works evenings; not at home at the time of the call by the caller's account.",
      ],
      scenarioId: "54",
    },
    {
      id: "p54-whittaker-donna",
      name: "WHITTAKER, Donna",
      sex: "F",
      age: 39,
      address: "12 Tatton Road, Haughton Green, Denton",
      postcode: "M34 7PL",
      phone: "07700 900118",
      roles: ["occupant"],
      notes: [
        "Kieran's mother and next of kin. Works an evening shift locally; the caller says she is not in until ten.",
        "Contact number held from a previous neighbourhood team visit about the parade.",
      ],
      scenarioId: "54",
    },
    {
      id: "p54-akhtar",
      name: "AKHTAR, Sohail",
      sex: "M",
      age: 46,
      address: "Unit 6, Mancunian Road parade, Haughton Green, Denton",
      postcode: "M34 7NP",
      phone: "0161 496 0733",
      roles: ["keeper", "witness"],
      notes: [
        "Runs the takeaway at the east end of the parade, open until eleven. Holds the padlock key for the rear service yard gate.",
        "His van is parked in the yard overnight; the caller says the youths use its roof to reach the bin store and the drainpipe.",
      ],
      scenarioId: "54",
      vehicleIds: ["v54-van"],
    },
  ],
  vehicles: [
    {
      id: "v54-van",
      vrm: "MA19 XKV",
      make: "Ford",
      model: "Transit Connect",
      colour: "White",
      keeperId: "p54-akhtar",
      keeperName: "AKHTAR, Sohail — Mancunian Road parade, Denton",
      notes: [
        "Parked in the rear service yard of the parade overnight. The step the youths use to reach the bin store roof and the drainpipe.",
        "No markers.",
      ],
      scenarioId: "54",
    },
    {
      id: "v54-caller-car",
      vrm: "YD17 RHL",
      make: "Vauxhall",
      model: "Corsa",
      colour: "Silver",
      keeperId: "p54-caller-hough",
      keeperName: "HOUGH, Janet — Mancunian Road, Denton",
      notes: [
        "On the parade forecourt. Dent to the bonnet from a stone off the roof — the criminal damage report, if one is taken.",
      ],
      scenarioId: "54",
    },
  ],
  places: [
    {
      id: "pl54-parade",
      kind: "premises",
      name: "Mancunian Road parade, Haughton Green",
      address: "Shopping parade, Mancunian Road, Haughton Green, Denton",
      postcode: "M34 7NP",
      coords: { lat: 53.4439, lng: -2.1012 },
      notes: [
        "Estate shopping parade beside the Tesco Express. Flat felt roof about 7 m up with a knee-high parapet and roof lights — a fall through is as likely as a fall off.",
        "Rear service yard gated and padlocked once the shops shut; keyholder is the takeaway (AKHTAR, on record). Bin store against the rear wall is the way up.",
        "Repeat anti-social behaviour location on the district log — youths on the roof reported four times since the clocks went back. Nothing above a Grade 3 before tonight.",
      ],
      scenarioId: "54",
    },
    {
      id: "pl54-no12",
      kind: "premises",
      name: "12 Tatton Road",
      address: "12 Tatton Road, Haughton Green, Denton",
      postcode: "M34 7PL",
      coords: { lat: 53.4436, lng: -2.1008 },
      notes: [
        "Home address of Kieran WHITTAKER (14) and his mother Donna. Backs onto the parade's service yard.",
        "One previous neighbourhood team visit about anti-social behaviour at the parade; nothing else on the address.",
      ],
      scenarioId: "54",
    },
    {
      id: "pl54-bus-stop",
      kind: "landmark",
      name: "Bus stop — Mancunian Road/Library",
      address: "Mancunian Road, Haughton Green, Denton",
      coords: { lat: 53.4445, lng: -2.1014 },
      notes: [
        "TfGM stop 1800EH18121, opposite the parade. Anyone waiting here is in the line of the stones.",
      ],
      scenarioId: "54",
    },
  ],
};
