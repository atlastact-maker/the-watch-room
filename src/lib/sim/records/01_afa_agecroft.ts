import type { RecordSet } from "../records";

// Records for scenario 01 — AFA, Unit 7 Agecroft Commerce Park.
//
// An out-of-hours AFA at a closed unit holds a different set of people
// from a staffed site. Nobody is there. What the desk has is a monitoring
// operator at the other end of a phone line in another county, two names
// on a keyholder list, and the neighbour who happens to be the only human
// within half a mile. The estate's other units are dark.
//
// The keyholder list is the whole scenario: it is the only route into the
// building that is not forcing entry, and the desk should be working it
// from the first minute.
//
// Everyone below is fictional, as is the firm. Addresses are held because
// this is a keyholder account — a monitored alarm contract genuinely does
// record where its keyholders live, since the response time depends on it.

export const records01: RecordSet = {
  scenarioId: "01",

  people: [
    {
      id: "p01-arc-doyle",
      name: "DOYLE, Marianne",
      sex: "F",
      age: 41,
      address: "Northgate Alarm Receiving Centre, Wakefield",
      postcode: "WF2 0XG",
      phone: "0345 060 1188",
      roles: ["caller"],
      notes: [
        "Monitoring operator — passed the zone 2 actuation to NWFC. Has no eyes on the building; everything she reports comes off the panel signal and the account file.",
        "Working the keyholder list. She is the only route to a key, and she is 40 miles away.",
        "Account history: two actuations at this address last winter, both signed off as the heat detector over the wash bay reacting to steam.",
      ],
      scenarioId: "01",
    },
    {
      id: "p01-keyholder-brennand",
      name: "BRENNAND, Colin",
      sex: "M",
      age: 58,
      address: "18 Ashworth Lane, Swinton, Salford",
      postcode: "M27 5PN",
      phone: "07700 900264",
      roles: ["occupant"],
      notes: [
        "First keyholder — owner of the business. Not answering; the ARC has tried the mobile and the landline.",
        "Lives roughly ten minutes from the unit. If he answers, he is the fast way in.",
        "Holds the shutter key, the personnel door key and the alarm engineer's code.",
      ],
      scenarioId: "01",
    },
    {
      id: "p01-keyholder-akhtar",
      name: "AKHTAR, Yusuf",
      sex: "M",
      age: 46,
      address: "7 Ribchester Grove, Whitefield, Bury",
      postcode: "M45 8QL",
      phone: "07700 900833",
      roles: ["occupant"],
      notes: [
        "Second keyholder — works the trade counter. Further out than the owner; twenty-five to thirty minutes from being called to being on site.",
        "Holds the personnel door key only. Cannot raise the roller shutter.",
      ],
      scenarioId: "01",
    },
    {
      id: "p01-neighbour-fenwick",
      name: "FENWICK, Dawn",
      sex: "F",
      age: 51,
      address: "Unit 11, Agecroft Commerce Park, Agecroft Road, Salford",
      postcode: "M27 8UJ",
      phone: "07700 900476",
      roles: ["witness"],
      notes: [
        "Runs the valeting unit at the far end of the estate — on site late doing a stock count, and the only person on the park.",
        "Can see the front of Unit 7 from her doorway. Has no key and no authority over the premises.",
        "Worth having: she knows which units are occupied overnight and where the estate gates and hydrant are.",
      ],
      scenarioId: "01",
    },
  ],

  vehicles: [
    {
      id: "v01-owner-hilux",
      vrm: "MA19 KZT",
      make: "Toyota",
      model: "Hilux Invincible",
      colour: "Silver",
      keeperName: "BRENNAND, Colin — 18 Ashworth Lane, Swinton, Salford M27 5PN",
      notes: [
        "First keyholder's vehicle. Not at the unit — the yard is empty.",
        "Listed on the alarm account as the keyholder vehicle, so a crew watching the estate road knows what is coming.",
      ],
      scenarioId: "01",
    },
    {
      id: "v01-neighbour-berlingo",
      vrm: "YE20 HRO",
      make: "Citroen",
      model: "Berlingo",
      colour: "White (signwritten)",
      keeperName: "FENWICK, Dawn — trading as a vehicle valeting business, Unit 11",
      notes: [
        "Parked outside Unit 11 at the far end of the estate. The only vehicle on the park.",
      ],
      scenarioId: "01",
    },
  ],

  places: [
    {
      id: "pl01-unit7",
      kind: "premises",
      name: "Unit 7 — Brennand Tooling Ltd",
      address: "Unit 7, Agecroft Commerce Park, Agecroft Road, Salford",
      postcode: "M27 8UJ",
      coords: { lat: 53.5063, lng: -2.302 },
      notes: [
        "Light engineering and trade counter. Single storey, mezzanine office over the front. Closed and locked; roller shutter down.",
        "Monitored L3 detection — zone 1 trade counter, zone 2 workshop, zone 3 office mezzanine. No sprinklers, no riser.",
        "Paint and thinners kept in the rear workshop. Quantities not declared to the ARC.",
      ],
      scenarioId: "01",
    },
    {
      id: "pl01-estate-entrance",
      kind: "landmark",
      name: "Agecroft Commerce Park — estate entrance / RVP",
      address: "Estate road off Agecroft Road, Salford",
      postcode: "M27 8UJ",
      coords: { lat: 53.5068, lng: -2.3034 },
      notes: [
        "Gates stand open overnight. Estate road runs the length of the units with a service loop to the rear yards.",
        "Sensible RVP — a keyholder arriving will come this way, and the appliance is not blocking the loop.",
        "Nearest hydrant H1 on the estate road.",
      ],
      scenarioId: "01",
    },
    {
      id: "pl01-rear-yard",
      kind: "landmark",
      name: "Unit 7 rear yard",
      address: "Rear service loop, Agecroft Commerce Park, Agecroft Road, Salford",
      postcode: "M27 8UJ",
      coords: { lat: 53.5059, lng: -2.3016 },
      notes: [
        "Shared yard behind units 6, 7 and 8. Fenced, gate unlocked. Appliance would need to reverse in.",
        "Workshop personnel door and the dust extraction plant are on this elevation — the only side of the unit with a door that is not shuttered.",
      ],
      scenarioId: "01",
    },
    {
      id: "pl01-unit11",
      kind: "premises",
      name: "Unit 11 — vehicle valeting",
      address: "Unit 11, Agecroft Commerce Park, Agecroft Road, Salford",
      postcode: "M27 8UJ",
      coords: { lat: 53.5055, lng: -2.3005 },
      notes: [
        "The only occupied unit on the estate tonight. Lights on, one vehicle outside.",
        "Not affected. Held because the occupier is the only witness available.",
      ],
      scenarioId: "01",
    },
  ],
};
