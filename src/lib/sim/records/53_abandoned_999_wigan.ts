import type { RecordSet } from "../records";

// Records for scenario 53 — abandoned 999 from a mobile, Kendal Street,
// Wigan.
//
// An abandoned call holds almost nothing at first: a number and a
// circle on a street. What the log search on the number adds is the
// person who last gave it to us and the door she gave it from, and that
// is what the desk will search. The partner and the neighbour are here because
// the call handler names them; the van because the neighbour does.
//
// Everyone here is fictional. Nothing on these records says which way
// the third call-back goes — the woman is recorded as the person on
// the number, not as a victim, and the partner carries no marker
// because nothing has been disclosed against him. The March log is on
// the file because it would be.

export const records53: RecordSet = {
  scenarioId: "53",
  people: [
    {
      id: "p53-hesketh",
      name: "HESKETH, Leanne",
      sex: "F",
      age: 32,
      address: "31 Kendal Street, Wigan",
      postcode: "WN6 7DQ",
      phone: "07700 900314",
      roles: ["caller", "occupant"],
      notes: [
        "The 999 number is the contact number she gave at 31 Kendal Street on the March log. Network subscriber check requested; not back.",
        "One previous log at the address, March this year: a neighbour reported shouting; officers attended; she and her partner both described an argument; no offences disclosed.",
        "Two children at the address, recorded on the March log.",
      ],
      scenarioId: "53",
    },
    {
      id: "p53-rothwell",
      name: "ROTHWELL, Daniel",
      sex: "M",
      age: 34,
      address: "31 Kendal Street, Wigan",
      postcode: "WN6 7DQ",
      phone: "07700 900871",
      roles: ["occupant"],
      notes: [
        "Partner of the woman on the 999 number and the other party on the March log. Nothing recorded against him.",
        "Registered keeper of a white Ford Transit Custom usually parked outside the address.",
      ],
      scenarioId: "53",
      vehicleIds: ["v53-van"],
    },
    {
      id: "p53-cunliffe",
      name: "CUNLIFFE, Pauline",
      sex: "F",
      age: 63,
      address: "29 Kendal Street, Wigan",
      postcode: "WN6 7DQ",
      phone: "07700 900226",
      roles: ["caller", "witness"],
      notes: [
        "Neighbour at No. 29, next door to No. 31.",
        "Rang in March about shouting from No. 31. Not on scene at the start of this call.",
      ],
      scenarioId: "53",
    },
  ],
  vehicles: [
    {
      id: "v53-van",
      vrm: "MK66 HXR",
      make: "Ford",
      model: "Transit Custom",
      colour: "White",
      keeperId: "p53-rothwell",
      keeperName: "ROTHWELL, Daniel — 31 Kendal Street, Wigan WN6 7DQ",
      notes: [
        "Usually parked on Kendal Street outside No. 31. Its presence is how the neighbour knows he has not left.",
        "Nothing on the record.",
      ],
      scenarioId: "53",
    },
  ],
  places: [
    {
      id: "pl53-plot",
      kind: "landmark",
      name: "Handset plot — Kendal Street",
      address: "Kendal Street, Wallgate, Wigan",
      postcode: "WN6 7DQ",
      coords: { lat: 53.5488, lng: -2.6412 },
      notes: [
        "Handset location from the 999 call: radius about 30 m, centred on the carriageway. Covers roughly a dozen addresses on both sides of the street.",
        "A phone location, not an address. A match on the number against a previous log is what turns it into a door.",
      ],
      scenarioId: "53",
    },
    {
      id: "pl53-house",
      kind: "premises",
      name: "31 Kendal Street",
      address: "31 Kendal Street, Wigan",
      postcode: "WN6 7DQ",
      coords: { lat: 53.5487, lng: -2.6413 },
      notes: [
        "Address given with the 999 number on the March log. West side of the street, inside the handset plot.",
        "One previous log, March this year: neighbour at No. 29 reported shouting; attended; verbal argument; no offences disclosed.",
        "Two children recorded at the address.",
      ],
      scenarioId: "53",
    },
  ],
};
