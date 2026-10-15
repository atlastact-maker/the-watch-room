import type { RecordSet } from "../records";

// Records for scenario 61 — concern for welfare from a housing officer,
// Milner Court, Peel Green.
//
// The tenant behind the door, the housing officer at it and the
// neighbour who raised it. Nothing here says which way the run rolls:
// Ronald is recorded as a vulnerable man unseen for five days, not as
// alive or dead.
//
// Everyone here is fictional, and so are Milner Court and Barton Brook
// Housing. Peel Green Road is real.

export const records61: RecordSet = {
  scenarioId: "61",
  people: [
    {
      id: "p61-caller-adebayo",
      name: "ADEBAYO, Femi",
      sex: "M",
      ethnicity: "N",
      age: 38,
      address: "Barton Brook Housing — Peel Green neighbourhood office",
      phone: "07700 900684",
      roles: ["caller", "witness"],
      notes: [
        "Housing officer for Milner Court. At the front door of Flat 6 with the neighbour from Flat 5; has knocked, shouted, phoned, and rung the GP, Salford Royal and the out-of-hours service before calling.",
        "Holds no key — the tenant changed the barrel. Will stay at the door until officers arrive.",
      ],
      scenarioId: "61",
    },
    {
      id: "p61-casey-ronald",
      name: "CASEY, Ronald",
      sex: "M",
      ethnicity: "W",
      age: 74,
      address: "Flat 6, Milner Court, Peel Green Road, Peel Green, Eccles",
      postcode: "M30 7HR",
      phone: "0161 496 0540",
      roles: ["occupant"],
      markers: ["MEDICAL", "VULNERABLE"],
      notes: [
        "Sole tenant since 2011. COPD on home oxygen — concentrator and cylinders in the living room. Mobility scooter kept under a cover by the front door.",
        "Lives alone; no next of kin on the housing file. Not seen by his neighbour since Thursday; mobile to voicemail, landline rings out.",
        "One previous log at the address: ambulance attended February 2026 for breathlessness, conveyed to Salford Royal and discharged. Nothing else — no violence, no weapons, no markers on the door.",
      ],
      scenarioId: "61",
    },
    {
      id: "p61-hurst-maureen",
      name: "HURST, Maureen",
      sex: "F",
      ethnicity: "W",
      age: 71,
      address: "Flat 5, Milner Court, Peel Green Road, Peel Green, Eccles",
      postcode: "M30 7HR",
      phone: "0161 496 0541",
      roles: ["witness"],
      notes: [
        "Next-door neighbour of fifteen years; rang the housing association this morning. Last saw him on Thursday; heard him coughing through the wall on Wednesday night and nothing since.",
        "Says his television is always on and has not been since Thursday night. Can see his coat on the hook through the letterbox.",
      ],
      scenarioId: "61",
    },
  ],
  vehicles: [],
  places: [
    {
      id: "pl61-milner-court",
      kind: "premises",
      name: "Milner Court, Peel Green Road",
      address: "Milner Court, Peel Green Road, Peel Green, Eccles",
      postcode: "M30 7HR",
      coords: { lat: 53.479, lng: -2.362 },
      notes: [
        "Low-rise housing-association block of six flats, two storey, set back from Peel Green Road behind a shared path. Flat 6 is the ground-floor end flat at the east end, with a ramp.",
        "Flat 6: uPVC front door, deadlocked, no key held by the landlord. Rear door onto a small fenced yard; gate bolted from inside. Home oxygen in the flat — no naked flames on entry.",
        "Bin store beside the Flat 6 door.",
      ],
      scenarioId: "61",
    },
  ],
};
