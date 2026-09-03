// Scenario 12 — Cardiac arrest, Hough End playing fields, Chorlton.
//
// What a control room would hold at the time of the call: the coach on
// the phone, the player on the grass, his mother as next of kin, the
// teammates taking turns on his chest, the runner sent for the defib,
// the two cars they came in, and the three places the job turns on —
// the pavilion with the community defib, the car park gate the players
// are marshalling, and the pitch that becomes the helicopter's LZ.
//
// Every person and vehicle here is fictional. Streets are real; house
// numbers are not. Phones are Ofcom drama-range only. No CRS vehicles
// in this scenario — nothing has crashed.

import type { RecordSet } from "../records";

export const records12: RecordSet = {
  scenarioId: "12",

  people: [
    // The 999 caller — the coach, on pitch 11, running telephone CPR.
    {
      id: "p12-caller-okafor",
      name: "OKAFOR, Daniel",
      sex: "M",
      age: 41,
      address: "63 Egerton Road North, Chorlton-cum-Hardy",
      postcode: "M21 0RZ",
      phone: "07700 900471",
      roles: ["caller", "keeper"],
      notes: [
        "Coach of the patient's Sunday league side — on pitch 11 with the patient, relaying call-handler CPR instructions to the teammates on his chest.",
        "Has sent two players to the Hough End Centre car park on Mauldeth Road West to marshal the gate for crews.",
      ],
      scenarioId: "12",
      vehicleIds: ["v12-transit"],
    },

    // The patient — witnessed non-contact collapse mid-match.
    {
      id: "p12-patient-brennan",
      name: "BRENNAN, Callum",
      sex: "M",
      age: 23,
      address: "27 Merseybank Avenue, Chorlton-cum-Hardy",
      postcode: "M21 7NL",
      phone: "07700 900165",
      roles: ["patient"],
      notes: [
        "Witnessed non-contact collapse mid-match on pitch 11 — agonal breathing, bystander CPR from the moment of collapse.",
        "Next of kin: mother, BRENNAN Sinead, same address.",
        "No previous ambulance contact held for this person.",
      ],
      scenarioId: "12",
      casualtyId: "cas-player",
      vehicleIds: ["v12-corsa"],
    },

    // Mother — next of kin, registered keeper of the car he drove in.
    {
      id: "p12-keeper-brennan",
      name: "BRENNAN, Sinead",
      sex: "F",
      age: 52,
      address: "27 Merseybank Avenue, Chorlton-cum-Hardy",
      postcode: "M21 7NL",
      phone: "07700 900725",
      roles: ["keeper"],
      notes: [
        "Patient's mother and next of kin — same address as the patient.",
        "Registered keeper of the grey Vauxhall Corsa the patient drove to the fixture — parked in the Hough End Centre car park.",
      ],
      scenarioId: "12",
      vehicleIds: ["v12-corsa"],
    },

    // Team manager — knew where the PAD was and sent the runner.
    {
      id: "p12-witness-hussain",
      name: "HUSSAIN, Yasir",
      sex: "M",
      age: 47,
      address: "118 Nell Lane, Chorlton-cum-Hardy",
      postcode: "M21 7SJ",
      phone: "07700 900372",
      roles: ["witness"],
      notes: [
        "Team manager — on pitch 11; knew of the community defib on the Hough End Centre foyer wall and sent a runner for it.",
      ],
      scenarioId: "12",
    },

    // The two lads on his chest.
    {
      id: "p12-witness-walsh",
      name: "WALSH, Jordan",
      sex: "M",
      age: 24,
      address: "9 Keppel Road, Chorlton-cum-Hardy",
      postcode: "M21 0BW",
      phone: "07700 900586",
      roles: ["witness"],
      notes: [
        "Teammate — first on the patient's chest; rotating compressions with ADEYEMI every two minutes on the call handler's count.",
      ],
      scenarioId: "12",
    },
    {
      id: "p12-witness-adeyemi",
      name: "ADEYEMI, Samuel",
      sex: "M",
      age: 22,
      address: "41 Oswald Road, Chorlton-cum-Hardy",
      postcode: "M21 9LG",
      phone: "07700 900629",
      roles: ["witness"],
      notes: [
        "Teammate — second compressor, swapping with WALSH; saw the collapse from a few yards away, no contact with any other player.",
      ],
      scenarioId: "12",
    },

    // The runner sent for the defib.
    {
      id: "p12-witness-kowalski",
      name: "KOWALSKI, Marek",
      sex: "M",
      age: 29,
      address: "76 Withington Road, Whalley Range",
      postcode: "M16 8FD",
      phone: "07700 900344",
      roles: ["witness"],
      notes: [
        "Substitute — sent sprinting to the Hough End Centre foyer for the community defib; call handler to give him the cabinet code.",
      ],
      scenarioId: "12",
    },
  ],

  vehicles: [
    // The patient's car — his mother's, on the car park.
    {
      id: "v12-corsa",
      vrm: "MK19 TWX",
      make: "Vauxhall",
      model: "Corsa",
      colour: "Grey",
      keeperId: "p12-keeper-brennan",
      keeperName: "BRENNAN, Sinead",
      notes: [
        "Parked in the Hough End Centre car park off Mauldeth Road West — driven to the fixture by the patient, keeper is his mother.",
      ],
      scenarioId: "12",
    },

    // The coach's kit van.
    {
      id: "v12-transit",
      vrm: "MA68 RDL",
      make: "Ford",
      model: "Transit Custom",
      colour: "White",
      keeperId: "p12-caller-okafor",
      keeperName: "OKAFOR, Daniel",
      notes: [
        "Team kit van — parked in the Hough End Centre car park; keeper is the 999 caller, on pitch 11 with the patient.",
      ],
      scenarioId: "12",
    },
  ],

  places: [
    // The pavilion — where the community defib lives.
    {
      id: "pl12-hough-end-centre",
      kind: "premises",
      name: "Hough End Centre",
      address: "Hough End Centre, Mauldeth Road West, Chorlton-cum-Hardy",
      postcode: "M21 7SX",
      coords: { lat: 53.4383, lng: -2.2553 },
      notes: [
        "Community defib (PAD) on the foyer wall — code-locked cabinet, registered on The Circuit; the call handler issues the code to the runner.",
        "Changing rooms, café and foyer — pavilion staffed on Sunday match days.",
        "Car park off Mauldeth Road West is the hard standing for every pitch to the south; spine path beyond the gate is foot / 4x4 only.",
      ],
      scenarioId: "12",
    },

    // The gate the players are marshalling — the RVP.
    {
      id: "pl12-car-park-gate",
      kind: "landmark",
      name: "Hough End Centre car park — gate / RVP",
      address: "Mauldeth Road West, Chorlton-cum-Hardy",
      postcode: "M21 7SX",
      coords: { lat: 53.43854, lng: -2.25603 },
      notes: [
        "RVP for the pitches — caller has two players at the gate to wave crews through.",
        "~450 m of soft ground from here to pitch 11 — kit goes forward by hand, conveying DCA stays on the hard standing.",
      ],
      scenarioId: "12",
    },

    // The pitch that becomes the landing zone.
    {
      id: "pl12-pitch-12-lz",
      kind: "landmark",
      name: "Pitch 12 — HEMS landing zone",
      address: "Pitch 12, Hough End Playing Fields, Mauldeth Road West, Chorlton-cum-Hardy",
      postcode: "M21 7SX",
      coords: { lat: 53.43595, lng: -2.25006 },
      notes: [
        "Flat open grass immediately south of pitch 11 — cleared of players and marked before the aircraft commits.",
        "Rotor wash reaches the resus and the crowd line.",
      ],
      scenarioId: "12",
    },
  ],
};
