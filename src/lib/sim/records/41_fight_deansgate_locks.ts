import type { RecordSet } from "../records";

// Records for scenario 41 — fight outside licensed premises, Deansgate
// Locks.
//
// Six people, one cab, two places. The two names the door staff give the
// desk are the point of the set: one of them is on the desk's own system
// with a marker, and the operator only finds that out by running him.
// The cab is here because the cameras read its plate, and a plate the
// operator can search is worth more than one they were told.
//
// Everyone is fictional. Nothing reveals which way the rank rolls — the
// cab driver is recorded as being at the head of the rank, not as having
// driven anybody anywhere.

export const records41: RecordSet = {
  scenarioId: "41",
  people: [
    {
      id: "p41-holroyd",
      name: "HOLROYD, Connor",
      sex: "M",
      age: 23,
      address: "Horwich, Bolton",
      postcode: "BL6",
      phone: "07700 900814",
      roles: ["victim", "patient"],
      notes: [
        "The injured party. On the north pavement outside Cutwater with door staff; went down from a single punch and struck his head on the kerb.",
        "Out for a period, then vomited. Alcohol on board.",
        "Not known to police.",
      ],
      scenarioId: "41",
      casualtyId: "cas-41-holroyd",
    },
    {
      id: "p41-farrell",
      name: "FARRELL, Tyler",
      sex: "M",
      age: 26,
      address: "Beswick, Manchester",
      postcode: "M11",
      roles: ["suspect"],
      markers: ["VIOLENT"],
      notes: [
        "Named on scene by door staff. White shirt.",
        "Excluded from several Deansgate Locks venues after two previous incidents — door teams on the venues' radio scheme know the face.",
        "Conviction for assault occasioning actual bodily harm (2023) — VIOLENT marker.",
      ],
      scenarioId: "41",
    },
    {
      id: "p41-dunne",
      name: "DUNNE, Kieran",
      sex: "M",
      age: 24,
      address: "Openshaw, Manchester",
      postcode: "M11",
      roles: ["suspect"],
      markers: ["WANTED"],
      notes: [
        "Named on scene by door staff as the second male. Dark jacket.",
        "WANTED — warrant for failing to appear at Manchester and Salford Magistrates' Court (public order matter, issued last month).",
        "Associate of FARRELL, Tyler.",
      ],
      scenarioId: "41",
    },
    {
      id: "p41-okafor",
      name: "OKAFOR, Emmanuel",
      sex: "M",
      age: 34,
      address: "Cutwater, Deansgate Locks, Whitworth Street West, Manchester",
      postcode: "M1 5LH",
      phone: "07700 900377",
      roles: ["caller", "witness"],
      notes: [
        "Door supervisor at Cutwater and the informant. SIA-licensed.",
        "Has the injured party in the recovery position on the pavement with a colleague who is a first aider. Holds the venue's radio-scheme handset — that is how the CCTV control room heard it.",
        "Saw the punch and can identify both males.",
      ],
      scenarioId: "41",
    },
    {
      id: "p41-brennan",
      name: "BRENNAN, Sophie",
      sex: "F",
      age: 28,
      address: "Cutwater, Deansgate Locks, Whitworth Street West, Manchester",
      postcode: "M1 5LH",
      phone: "07700 900388",
      roles: ["witness"],
      notes: [
        "Door supervisor at Cutwater and a qualified first aider. With the injured party throughout.",
        "Keeping the crowd, his friends included, off him.",
      ],
      scenarioId: "41",
    },
    {
      id: "p41-whittaker",
      name: "WHITTAKER, Janice",
      sex: "F",
      age: 51,
      address: "City centre CCTV control room, Manchester",
      phone: "0161 496 0455",
      roles: ["witness"],
      notes: [
        "CCTV operator, city centre control room — the second voice on this job. Heard the door staff on the venues' radio scheme and rang it through on the control room's own line.",
        "Has the two males on camera from the bridge outside Cutwater west along Whitworth Street West, and can hold them or a cab as far as the cameras go.",
        "Recording. Footage available to the officer in the case.",
      ],
      scenarioId: "41",
    },
    {
      id: "p41-hussain",
      name: "HUSSAIN, Tariq",
      sex: "M",
      age: 47,
      address: "Longsight, Manchester",
      postcode: "M13",
      phone: "07700 900921",
      roles: ["keeper", "witness"],
      notes: [
        "Hackney carriage driver at the head of the Whitworth Street West rank when it started. Has rung 999 himself.",
        "Registered keeper of the cab.",
      ],
      scenarioId: "41",
      vehicleIds: ["v41-cab"],
    },
  ],
  vehicles: [
    {
      id: "v41-cab",
      vrm: "MK21 EYC",
      make: "LEVC",
      model: "TX",
      colour: "Black",
      keeperId: "p41-hussain",
      keeperName: "HUSSAIN, Tariq — Longsight, Manchester M13",
      notes: [
        "Licensed hackney carriage. At the head of the Whitworth Street West rank at the time of the call.",
        "Index read by the CCTV control room.",
      ],
      scenarioId: "41",
    },
  ],
  places: [
    {
      id: "pl41-scene",
      kind: "scene",
      name: "Deansgate Locks — pavement outside Cutwater",
      address: "Whitworth Street West, Deansgate Locks, Manchester",
      postcode: "M1 5LH",
      coords: { lat: 53.4745, lng: -2.25 },
      notes: [
        "Row of bars in the railway arches on the north side of Whitworth Street West, on the far side of the Rochdale Canal from the street. Each arch has its own footbridge over the canal; the pavement on the street side is where the queues form.",
        "Open water immediately behind the pavement. Metrolink viaduct above the arches; Deansgate station beyond the south side.",
        "Door teams are on a city centre venues' radio scheme that the council CCTV control room listens to — a second informant from the cameras is the norm here.",
        "Repeat location for weekend violence. The rank at the Deansgate end is where the second half of most Locks jobs happens.",
      ],
      scenarioId: "41",
    },
    {
      id: "pl41-rank",
      kind: "landmark",
      name: "Taxi rank — Whitworth Street West, Deansgate end",
      address: "Whitworth Street West, Manchester",
      postcode: "M1 5WY",
      coords: { lat: 53.4744, lng: -2.2508 },
      notes: [
        "Hackney carriage rank along the north kerb at the Deansgate end of Whitworth Street West. Busy from midnight.",
        "Queue-jumping at the head of the rank is the usual start of it. Cabs pull in and out across the kerb the whole time.",
      ],
      scenarioId: "41",
    },
  ],
};
