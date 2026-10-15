import type { RecordSet } from "../records";

// Records for scenario 58 — criminal damage on 101, Ladythorn Road,
// Bramhall.
//
// A desk-closure holds the people the crime report needs: the victim
// and his car, the wife who texted, the neighbour whose fence panel
// goes on the same report. Nobody is named as the offender — the
// footage does not give one, and neither do we.
//
// Everyone here is fictional, as are both house numbers. Ladythorn
// Road, Bramhall, is real.

export const records58: RecordSet = {
  scenarioId: "58",
  people: [
    {
      id: "p58-caller-penketh",
      name: "PENKETH, Stuart",
      sex: "M",
      ethnicity: "W",
      age: 52,
      address: "27 Ladythorn Road, Bramhall, Stockport",
      postcode: "SK7 2HA",
      phone: "07700 900651",
      roles: ["caller", "victim", "keeper"],
      notes: [
        "Owner of the damaged Octavia; found the damage at 08:00 going to work. Rang 101, not 999, and said so.",
        "Holds doorbell camera footage of the offender at 02:14 — asked to keep it and not share it.",
        "Works from home Tuesdays and Fridays; otherwise available after six.",
      ],
      scenarioId: "58",
      vehicleIds: ["v58-octavia"],
    },
    {
      id: "p58-penketh-lorraine",
      name: "PENKETH, Lorraine",
      sex: "F",
      ethnicity: "W",
      age: 50,
      address: "27 Ladythorn Road, Bramhall, Stockport",
      postcode: "SK7 2HA",
      phone: "07700 900706",
      roles: ["occupant"],
      notes: ["The caller's wife. At work at the time of the report; slept through the night."],
      scenarioId: "58",
    },
    {
      id: "p58-fairclough-brian",
      name: "FAIRCLOUGH, Brian",
      sex: "M",
      ethnicity: "W",
      age: 74,
      address: "25 Ladythorn Road, Bramhall, Stockport",
      postcode: "SK7 2HA",
      phone: "0161 496 0550",
      roles: ["victim", "witness"],
      notes: [
        "Neighbour at no. 25; owner of the fence panel kicked through between the two drives. Linked to the same crime report.",
        "His motion-sensor light came on at about 02:00 — he took it for a cat and did not look out.",
      ],
      scenarioId: "58",
    },
  ],
  vehicles: [
    {
      id: "v58-octavia",
      vrm: "YK20 HVB",
      make: "Skoda",
      model: "Octavia",
      colour: "Blue",
      keeperId: "p58-caller-penketh",
      keeperName: "PENKETH, Stuart — Ladythorn Road, Bramhall",
      notes: [
        "On the driveway of no. 27 overnight. Driver's wing mirror smashed off and hanging by its wiring; scratch keyed along the full passenger side.",
        "Locked, not entered, nothing taken. No markers.",
      ],
      scenarioId: "58",
    },
  ],
  places: [
    {
      id: "pl58-no27",
      kind: "premises",
      name: "27 Ladythorn Road, Bramhall",
      address: "27 Ladythorn Road, Bramhall, Stockport",
      postcode: "SK7 2HA",
      coords: { lat: 53.3623, lng: -2.1572 },
      notes: [
        "Detached house with a front driveway; doorbell camera covers the drive and the pavement.",
        "Nothing on the address. One other criminal damage report on the road this year — a wing mirror, March, undetected.",
      ],
      scenarioId: "58",
    },
  ],
};
