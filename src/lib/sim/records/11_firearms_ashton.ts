// Records for scenario 11 — Firearms Incident, Curzon Road, Ashton-under-Lyne.
//
// Everyone here is FICTIONAL. Streets are real (Curzon Road, Katherine
// Street and Mossley Road — all OL6, north of Ashton town centre); house
// numbers are invented, and the target address follows the scenario's own
// rule that no real address gets painted as a firearms job. Phone numbers
// sit in Ofcom's reserved drama ranges. VRMs are made up.
//
// The scenario location itself (No. 34 Curzon Road) is derived from the
// scenario file by buildRecordIndex() and is not repeated here. The scene
// geometry puts the target at the middle of the north terrace, the caller
// through the east party wall, an elderly neighbour through the west one,
// the corner shop and the RVP off the east end at the Katherine Street
// junction — the coordinates below follow that layout.

import type { RecordSet } from "../records";

export const records11: RecordSet = {
  scenarioId: "11",

  people: [
    // The 999 caller — the neighbour through the party wall, east side.
    {
      id: "p11-caller-brierley",
      name: "BRIERLEY, Joanne",
      sex: "F",
      age: 47,
      address: "Curzon Road, Ashton-under-Lyne",
      postcode: "OL6",
      phone: "07700 900352",
      roles: ["caller", "witness"],
      scenarioId: "11",
      notes: [
        "999 caller — neighbour at No. 36, party wall to No. 34. Reports the male next door screaming at his partner and seen in the rear yard holding what she believes is a handgun; now back inside, door slammed.",
        "Caller at her address with her husband — advised to stay in, away from the front windows and the party wall, and to keep the line open.",
        "No previous calls from this number.",
      ],
    },

    // Her husband — an officer tells him about the air pistol on the
    // nights it turns out to be one.
    {
      id: "p11-witness-brierley-m",
      name: "BRIERLEY, Mark",
      sex: "M",
      age: 49,
      address: "Curzon Road, Ashton-under-Lyne",
      postcode: "OL6",
      phone: "07700 900538",
      roles: ["witness", "occupant", "keeper"],
      vehicleIds: ["v11-focus"],
      scenarioId: "11",
      notes: [
        "Husband of the 999 caller — at No. 36 with her. Heard the shouting through the party wall; did not see the weapon himself.",
        "Registered keeper of the blue Ford Focus parked on Curzon Road outside No. 36.",
      ],
    },

    // The armed male — the subject the containment is built around.
    {
      id: "p11-suspect-keane",
      name: "KEANE, Daniel",
      sex: "M",
      age: 34,
      address: "Curzon Road, Ashton-under-Lyne",
      postcode: "OL6",
      phone: "07700 900136",
      roles: ["suspect", "occupant"],
      markers: ["FIREARMS"],
      vehicleIds: ["v11-astra"],
      scenarioId: "11",
      notes: [
        "FIREARMS marker added tonight on the strength of the 999 call — handgun seen in hand in the rear yard. Treat as armed until proven otherwise.",
        "Previous: domestic call to this address 18/10/25 — verbal argument with partner, no injuries, no offences disclosed, no further action. Address carries the domestic marker.",
        "No firearm or shotgun certificate held. No firearms marker before tonight.",
      ],
    },

    // The partner — believed inside; the casualty on the nights a shot
    // is heard.
    {
      id: "p11-partner-price",
      name: "PRICE, Leah",
      sex: "F",
      age: 29,
      address: "Curzon Road, Ashton-under-Lyne",
      postcode: "OL6",
      phone: "07700 900712",
      roles: ["victim", "patient", "occupant"],
      casualtyId: "cas-partner",
      scenarioId: "11",
      notes: [
        "Believed inside No. 34 with the armed male at time of call — the person at direct risk. Mobile rings out.",
        "Named as the partner at this address on the 18/10/25 domestic log — no injuries, declined referral.",
      ],
    },

    // West-side neighbour — the reason Sector 4 is an evacuation sector.
    {
      id: "p11-occupant-patel",
      name: "PATEL, Hansa",
      sex: "F",
      age: 78,
      address: "Curzon Road, Ashton-under-Lyne",
      postcode: "OL6",
      phone: "0161 496 0384",
      roles: ["occupant"],
      markers: ["VULNERABLE"],
      scenarioId: "11",
      notes: [
        "Lives alone at No. 32 — party wall to No. 34, west side. Will need assistance to evacuate via the rear yard (Sector 4).",
        "Safe and Well visit 03/2024: walking frame, hard of hearing. Daughter is the nominated contact.",
      ],
    },

    // The shopkeeper at the junction — where the crowd gathers.
    {
      id: "p11-witness-raza",
      name: "RAZA, Imran",
      sex: "M",
      age: 41,
      phone: "07700 900265",
      roles: ["witness"],
      scenarioId: "11",
      notes: [
        "Shopkeeper and keyholder — corner shop at the Curzon Road / Katherine Street junction. Shop CCTV covers the junction and the east end of Curzon Road.",
        "Reports a crowd forming outside the shop, some filming on phones, children among them.",
      ],
    },

    // The subject's brother — keeper of the car outside, and a family
    // contact if it comes to talking him out.
    {
      id: "p11-keeper-keane-l",
      name: "KEANE, Liam",
      sex: "M",
      age: 31,
      address: "217 Mossley Road, Ashton-under-Lyne",
      phone: "07700 900887",
      roles: ["keeper"],
      vehicleIds: ["v11-astra"],
      scenarioId: "11",
      notes: [
        "Brother of the subject. Registered keeper of the grey Vauxhall Astra parked outside No. 34 Curzon Road — the subject is the usual driver.",
        "Nothing recorded against. Possible family contact for the negotiating team.",
      ],
    },
  ],

  vehicles: [
    {
      id: "v11-astra",
      vrm: "MF19 HXW",
      make: "Vauxhall",
      model: "Astra",
      colour: "Grey",
      keeperId: "p11-keeper-keane-l",
      keeperName: "KEANE, Liam",
      scenarioId: "11",
      notes: [
        "Parked on Curzon Road outside No. 34 — believed the subject's usual vehicle. Keeper is his brother at Mossley Road.",
        "Tax and MOT in date. No markers.",
      ],
    },
    {
      id: "v11-focus",
      vrm: "MA68 LDT",
      make: "Ford",
      model: "Focus",
      colour: "Blue",
      keeperId: "p11-witness-brierley-m",
      keeperName: "BRIERLEY, Mark",
      scenarioId: "11",
      notes: ["Parked on Curzon Road outside No. 36 — the caller's household car. Not involved."],
    },
  ],

  places: [
    {
      id: "pl11-neighbour-36",
      kind: "premises",
      name: "Curzon Road — caller's address",
      address: "Curzon Road, Ashton-under-Lyne",
      postcode: "OL6",
      coords: { lat: 53.49599, lng: -2.08652 },
      scenarioId: "11",
      notes: [
        "999 caller's address — mid-terrace, party wall to No. 34 on the east side. Two occupants (Brierley) sheltering in place, told to keep away from the front windows.",
        "Rear yard gate onto the shared alley — evacuation route if needed.",
      ],
    },
    {
      id: "pl11-neighbour-32",
      kind: "premises",
      name: "Curzon Road — west neighbour",
      address: "Curzon Road, Ashton-under-Lyne",
      postcode: "OL6",
      coords: { lat: 53.49599, lng: -2.08686 },
      scenarioId: "11",
      notes: [
        "Party wall to No. 34 on the west side. Single elderly occupant, limited mobility — assisted evacuation via the rear (Sector 4).",
        "Safe and Well visit on record 03/2024.",
      ],
    },
    {
      id: "pl11-corner-shop",
      kind: "premises",
      name: "Curzon Corner Store",
      address: "Curzon Road / Katherine Street junction, Ashton-under-Lyne",
      coords: { lat: 53.49602, lng: -2.08609 },
      scenarioId: "11",
      notes: [
        "Corner shop at the Curzon Road / Katherine Street junction — crowd gathering point; the outer cordon line runs here.",
        "CCTV covers the junction and the east end of Curzon Road. Keyholder: Mr I. Raza.",
      ],
    },
    {
      id: "pl11-rvp",
      kind: "landmark",
      name: "RVP — Curzon Road / Katherine Street junction",
      address: "Curzon Road at Katherine Street, Ashton-under-Lyne",
      coords: { lat: 53.49581, lng: -2.08605 },
      scenarioId: "11",
      notes: [
        "Rendezvous point — out of line of sight of No. 34. Ambulance stages here and does not approach until the scene is declared safe.",
        "Approach via Katherine Street only — no marked vehicles into line of sight along Curzon Road.",
      ],
    },
  ],
};
