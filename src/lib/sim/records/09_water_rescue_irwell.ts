import type { RecordSet } from "../records";

// Scenario 09 — Person in water, River Irwell at the Lowry footbridge.
//
// The records behind the desk's searches for this job: the bystander on
// the bridge who rang it in, the man in the water (linked to the scene
// casualty), his partner at the home address, the two bystanders the
// informant script puts on the quayside, the caller's car on the IWM-side
// access, and the premises either side of the river plus the weir the
// drift clock is running toward. The scenario location itself is derived
// automatically and is not repeated here.
//
// Everyone below is fictional. Streets are real, numbers are not. Phone
// numbers sit in Ofcom's reserved drama ranges (07700 900xxx / 0161 496
// 0xxx). Coordinates are offsets from the scenario anchor that agree with
// the scene schematic — the Lowry north-west of the bridge, the Imperial
// War Museum south-east, Mode Wheel Locks ~400 m west.

const S = "09";

export const records09: RecordSet = {
  scenarioId: S,

  people: [
    // The 999 caller — on the footbridge, stays on the line with eyes on him.
    {
      id: "p09-caller-holden",
      name: "HOLDEN, Rachel",
      sex: "F",
      age: 41,
      address: "163 Monton Road, Eccles",
      postcode: "M30",
      phone: "07700 900356",
      roles: ["caller"],
      scenarioId: S,
      vehicleIds: ["v09-caller-fiesta"],
      notes: [
        "Bystander on the Lowry footbridge — thinks the male went in off the bridge; on the line throughout with eyes on him as he drifts west toward the locks.",
        "Was walking back to her car on the Trafford Wharf Road access (IWM side) when she rang.",
        "No previous.",
      ],
    },

    // The man in the water — scene casualty cas-water. Not named by the
    // caller; the record is what the desk holds once he is identified.
    {
      id: "p09-patient-brennan",
      name: "BRENNAN, Daniel",
      sex: "M",
      age: 34,
      address: "Flat 12, 96 Merchants Quay, Salford Quays",
      postcode: "M50",
      phone: "07700 900206",
      roles: ["patient"],
      markers: ["MENTAL HEALTH"],
      scenarioId: S,
      casualtyId: "cas-water",
      notes: [
        "Not named by the caller — adult male, 30s, entered from the footbridge. Identity to be confirmed on the bank.",
        "Previous: concern-for-welfare call to home address 11/02/26 from partner — located safe and well, referred to the Salford crisis team. No offences.",
        "NOK: partner, Lauren WHITTAKER, same address.",
      ],
    },

    // Partner at the home address — next of kin.
    {
      id: "p09-occupant-whittaker",
      name: "WHITTAKER, Lauren",
      sex: "F",
      age: 32,
      address: "Flat 12, 96 Merchants Quay, Salford Quays",
      postcode: "M50",
      phone: "07700 900127",
      roles: ["occupant"],
      scenarioId: S,
      notes: [
        "Partner of Daniel BRENNAN — next of kin; made the 11/02/26 concern-for-welfare call.",
        "No previous.",
      ],
    },

    // A lad on the Lowry-side quayside, close to the edge — the second
    // casualty the scenario is really about, if the 'bystander-coat' beat
    // fires. The record must not say he has taken his coat off.
    {
      id: "p09-witness-przybylski",
      name: "PRZYBYLSKI, Kacper",
      sex: "M",
      age: 19,
      address: "154 Chorley Road, Swinton",
      postcode: "M27",
      phone: "07700 900768",
      roles: ["witness"],
      scenarioId: S,
      notes: [
        "On the Lowry-side quayside with friends, close to the edge — keep back from the railing until GMP arrive.",
        "No previous.",
      ],
    },

    // The steward who knows the Lowry-side railing throwline board — the
    // 'throwline-short' beat, if it fires. The record must not say a throw
    // has been made.
    {
      id: "p09-witness-adebayo",
      name: "ADEBAYO, Yetunde",
      sex: "F",
      age: 28,
      phone: "07700 900593",
      roles: ["witness"],
      scenarioId: S,
      notes: [
        "Front-of-house steward at The Lowry — knows the throwline board on the railing east of the footbridge.",
        "Contact via The Lowry front of house on 0161 496 0810 if her mobile is unanswered.",
      ],
    },
  ],

  vehicles: [
    // No CRS vehicles in this scenario. The caller's car is one of the two
    // parked on the Trafford Wharf Road access in the scene schematic.
    {
      id: "v09-caller-fiesta",
      vrm: "MF17 UXR",
      make: "Ford",
      model: "Fiesta",
      colour: "Blue",
      keeperId: "p09-caller-holden",
      keeperName: "HOLDEN, Rachel",
      scenarioId: S,
      notes: [
        "Parked on the Trafford Wharf Road quayside access, IWM side — the caller's car; not obstructing appliance access.",
        "Tax current, MOT to 11/26. No reports.",
      ],
    },
  ],

  places: [
    // North bank — the Lowry side. Pump 2's bank and the downstream intercept.
    {
      id: "pl09-lowry",
      kind: "landmark",
      name: "The Lowry",
      address: "Pier 8, The Quays, Salford Quays",
      postcode: "M50 3AZ",
      coords: { lat: 53.4753, lng: -2.29986 },
      scenarioId: S,
      notes: [
        "Theatre and gallery on the north (Lowry-side) quayside — front-of-house stewards on the doors; foyer available as a warm holding area for wet bystanders and witnesses.",
        "Pier 8 car park — RVP for Pump 2 and the Lowry-side intercept team; the quayside walkway runs west from here toward the weir.",
        "Throwline board on the quayside railing east of the footbridge.",
        "Front of house: 0161 496 0810.",
      ],
    },

    // South bank — the IWM side. First vehicle access to the water.
    {
      id: "pl09-iwm-north",
      kind: "landmark",
      name: "Imperial War Museum North",
      address: "Trafford Wharf Road, Trafford Park, Stretford",
      postcode: "M17 1TZ",
      coords: { lat: 53.47469, lng: -2.29824 },
      scenarioId: S,
      notes: [
        "South (IWM-side) quayside — first vehicle access to the water via Trafford Wharf Road; the WIU and Pump 1 reach this bank first.",
        "Bank rescue point: throwline board on the quayside railing west of the footbridge.",
        "Museum security contactable out of hours for quayside access: 0161 496 0455.",
      ],
    },

    // The hazard the clock is running toward.
    {
      id: "pl09-mode-wheel-weir",
      kind: "landmark",
      name: "Mode Wheel Locks — weir",
      address: "Manchester Ship Canal at Mode Wheel Locks, Salford",
      coords: { lat: 53.47499, lng: -2.30505 },
      scenarioId: S,
      notes: [
        "~400 m downstream (west) of the Lowry footbridge — a drifting casualty reaches the weir in ~12 min in moderate flow.",
        "Downstream backstop: the last bank access before the weir is the western end of the Lowry-side quayside walkway — set the intercept here before the boat launches.",
        "Ship Canal lock control (Peel Ports) to be told of a person in the water upstream.",
      ],
    },

    // The patient's home address — where GMP go for the next of kin.
    {
      id: "pl09-home-merchants-quay",
      kind: "premises",
      name: "96 Merchants Quay — patient's home address",
      address: "Flat 12, 96 Merchants Quay, Salford Quays",
      postcode: "M50",
      coords: { lat: 53.47725, lng: -2.29522 },
      scenarioId: S,
      notes: [
        "Home address of Daniel BRENNAN (patient) — partner Lauren WHITTAKER at the address, next of kin.",
        "Previous: concern-for-welfare call 11/02/26 — no offences, referred to the crisis team.",
        "Apartment block ~350 m north-east of the footbridge — on foot to the Quays.",
      ],
    },
  ],
};
