import type { RecordSet } from "../records";

// Records for scenario 39 — domestic in progress, Prosperity Street,
// Harpurhey.
//
// A domestic holds exactly the people the desk will search for: the
// victim, the man with the marker, the neighbour who rang, the two
// children who make it a safeguarding job, and the van he will leave in
// if nobody gets there. Everyone here is fictional; the street is real
// and the house numbers are not.
//
// Nothing reveals which way the injury roll lands. She is recorded as
// the occupant heard screaming, not as a patient — that is decided at
// 250 seconds, not in a file.

export const records39: RecordSet = {
  scenarioId: "39",
  people: [
    {
      id: "p39-whittaker",
      name: "WHITTAKER, Leanne",
      sex: "F",
      age: 31,
      address: "14 Prosperity Street, Harpurhey, Manchester",
      postcode: "M40 8EX",
      phone: "07700 900214",
      roles: ["victim", "occupant"],
      markers: ["VULNERABLE"],
      notes: [
        "Occupant and the female heard screaming through the party wall.",
        "Complainant on the Feb 2026 domestic at this address — assault, arrest, statement withdrawn the same week and no further action.",
        "Mother of both children on the household record. Mobile number held from the Feb 2026 call.",
      ],
      scenarioId: "39",
      casualtyId: "cas-39-victim",
    },
    {
      id: "p39-doherty",
      name: "DOHERTY, Liam",
      sex: "M",
      age: 34,
      address: "14 Prosperity Street, Harpurhey, Manchester",
      postcode: "M40 8EX",
      phone: "07700 900377",
      roles: ["suspect", "occupant"],
      markers: ["VIOLENT"],
      notes: [
        "VIOLENT marker from the Feb 2026 domestic at this address — arrested for assault occasioning actual bodily harm, released with no further action when the complainant withdrew.",
        "Public order matter at Harpurhey District Centre, 2023 — fixed penalty.",
        "Self-employed roofer. Keeper of the white Ford Transit usually parked outside the address.",
        "Description given by the caller: large build, shaved head. Grey tracksuit bottoms tonight.",
      ],
      scenarioId: "39",
      vehicleIds: ["v39-transit"],
    },
    {
      id: "p39-caller-holt",
      name: "HOLT, Marie",
      sex: "F",
      age: 58,
      address: "12 Prosperity Street, Harpurhey, Manchester",
      postcode: "M40 8EX",
      phone: "07700 900161",
      roles: ["caller", "witness"],
      notes: [
        "Neighbour through the party wall and the informant. Also the caller on the Feb 2026 job.",
        "Willing to give a statement. Says the victim asked her not to ring and that she has rung anyway.",
        "Can hear the house from her own front room; has not gone round and has been told not to.",
      ],
      scenarioId: "39",
    },
    {
      id: "p39-child-maisie",
      name: "WHITTAKER, Maisie",
      sex: "F",
      age: 8,
      address: "14 Prosperity Street, Harpurhey, Manchester",
      postcode: "M40 8EX",
      roles: ["occupant"],
      markers: ["CHILD"],
      notes: [
        "Daughter of the female occupant. On the household record; school age.",
        "Believed upstairs while it is happening. Children's services referral follows any attendance.",
      ],
      scenarioId: "39",
    },
    {
      id: "p39-child-alfie",
      name: "DOHERTY, Alfie",
      sex: "M",
      age: 3,
      address: "14 Prosperity Street, Harpurhey, Manchester",
      postcode: "M40 8EX",
      roles: ["occupant"],
      markers: ["CHILD"],
      notes: [
        "Son of both adults. The toddler the caller can hear crying upstairs.",
      ],
      scenarioId: "39",
    },
  ],
  vehicles: [
    {
      id: "v39-transit",
      vrm: "MV17 HZL",
      make: "Ford",
      model: "Transit 350",
      colour: "White",
      keeperId: "p39-doherty",
      keeperName: "DOHERTY, Liam — 14 Prosperity Street, Harpurhey, Manchester M40 8EX",
      markers: [],
      notes: [
        "Usually parked on the street outside No. 14. Roof rack and ladders.",
        "Tax and MOT in date. No markers on the vehicle; the marker is on the keeper.",
        "If he leaves in it before units arrive, circulate — the natural route is down to Rochdale Road and into town.",
      ],
      scenarioId: "39",
    },
  ],
  places: [
    {
      id: "pl39-house",
      kind: "premises",
      name: "14 Prosperity Street",
      address: "14 Prosperity Street, Harpurhey, Manchester",
      postcode: "M40 8EX",
      coords: { lat: 53.4999, lng: -2.2186 },
      notes: [
        "Three-storey terraced townhouse, mid-terrace, party walls to Nos. 12 and 16. Composite front door directly onto the pavement.",
        "Repeat address: domestic Feb 2026 — arrest, no further action on withdrawal. Two children on the household record.",
        "Prosperity Street runs off Rochdale Road at its west end. Front windows look straight down the street.",
      ],
      scenarioId: "39",
    },
    {
      id: "pl39-caller-house",
      kind: "premises",
      name: "12 Prosperity Street",
      address: "12 Prosperity Street, Harpurhey, Manchester",
      postcode: "M40 8EX",
      coords: { lat: 53.4999, lng: -2.2187 },
      notes: [
        "The caller's house, through the party wall from No. 14. She is at home and on the line.",
      ],
      scenarioId: "39",
    },
  ],
};
