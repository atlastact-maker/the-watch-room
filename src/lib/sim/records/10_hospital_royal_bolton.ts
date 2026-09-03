import type { RecordSet } from "../records";

// Scenario 10 — Hospital alarm, Royal Bolton, ward 19. The records a
// control room would hold when the trust fire officer rings in: the
// officer himself, the ward 19 patient who takes smoke during the Stage 2
// move, the ward and trust staff the informant script has talking, and
// the trust fleet vans on the internal road. Every person and vehicle
// here is fictional; the streets are real, the house numbers are not.
// The hospital itself is derived from the scenario location and is not
// repeated here.

export const records10: RecordSet = {
  scenarioId: "10",

  people: [
    {
      id: "p10-caller-crompton",
      name: "CROMPTON, Michael",
      sex: "M",
      age: 47,
      address: "Fire Safety Office, Estates & Facilities, Royal Bolton Hospital, Minerva Road, Farnworth, Bolton",
      postcode: "BL4 0JR",
      phone: "07700 900513",
      roles: ["caller"],
      scenarioId: "10",
      notes: [
        "Caller: trust duty fire officer — on site, panel showing ward 19 Block C 3rd floor; heading up, his team checking the compartment doors",
        "Will meet crews at the Block C entrance off Minerva Road with the ward plans and the gas isolation locations; lifts in fire mode",
        "Call-back via hospital switchboard 0161 496 0400 (fire team bleep) if the mobile drops",
      ],
    },
    {
      id: "p10-patient-kenyon",
      name: "KENYON, Dorothy",
      sex: "F",
      age: 84,
      address: "142 Plodder Lane, Farnworth, Bolton",
      postcode: "BL4",
      roles: ["patient"],
      markers: ["MEDICAL"],
      scenarioId: "10",
      casualtyId: "cas-ward19",
      notes: [
        "Ward 19 inpatient (frail elderly, Block C 3rd floor) — COPD, home oxygen user at her usual address",
        "Listed by ward staff among the six beds moved horizontally into ward 20 as the Stage 2 precaution",
        "NOK: daughter — contact details held by the ward",
      ],
    },
    {
      id: "p10-nurse-mistry",
      name: "MISTRY, Anjali",
      sex: "F",
      age: 38,
      address: "Ward 19, Block C, Royal Bolton Hospital, Minerva Road, Farnworth, Bolton",
      postcode: "BL4 0JR",
      phone: "0161 496 0219",
      roles: ["witness"],
      scenarioId: "10",
      notes: [
        "Ward 19 nurse in charge — first reported smoke in the ward pantry to the trust fire team and operated the call point",
        "Running the Stage 2 move: six nearest beds horizontally into the ward 20 compartment; ward oxygen isolation valve is at the ward entrance",
      ],
    },
    {
      id: "p10-trust-fire-duffy",
      name: "DUFFY, Craig",
      sex: "M",
      age: 34,
      address: "Security lodge, site entrance, Royal Bolton Hospital, Minerva Road, Farnworth, Bolton",
      postcode: "BL4 0JR",
      phone: "07700 900417",
      roles: ["occupant"],
      scenarioId: "10",
      notes: [
        "Trust fire team, second responder — at the ward 19 pantry door; reporting back to the duty fire officer",
        "Checking Block C 3rd floor compartment doors and the corridor ceiling void hatches",
      ],
    },
    {
      id: "p10-fire-safety-adebayo",
      name: "ADEBAYO, Grace",
      sex: "F",
      age: 52,
      address: "Fire Safety Office, Estates & Facilities, Royal Bolton Hospital, Minerva Road, Farnworth, Bolton",
      postcode: "BL4 0JR",
      phone: "07700 900420",
      roles: ["occupant"],
      scenarioId: "10",
      notes: [
        "Trust fire safety advisor — holds the statutory healthcare PRI plans; takes the handover at close",
        "On call out of hours via switchboard 0161 496 0400",
      ],
    },
    {
      id: "p10-estates-siddique",
      name: "SIDDIQUE, Imran",
      sex: "M",
      age: 41,
      address: "Estates workshop, Block D, Royal Bolton Hospital, Minerva Road, Farnworth, Bolton",
      postcode: "BL4 0JR",
      phone: "07700 900431",
      roles: ["occupant"],
      scenarioId: "10",
      vehicleIds: ["v10-estates-van"],
      notes: [
        "Estates duty engineer — medical gases authorised person; only estates isolate the bulk oxygen VIE compound",
        "Holds keys for the ward distribution boards (ward 19 pantry ring main) and the VIE compound gate",
      ],
    },
    {
      id: "p10-itu-walsh",
      name: "WALSH, Sean",
      sex: "M",
      age: 44,
      address: "ITU, Block D, Royal Bolton Hospital, Minerva Road, Farnworth, Bolton",
      postcode: "BL4 0JR",
      phone: "0161 496 0240",
      roles: ["occupant"],
      scenarioId: "10",
      notes: [
        "ITU nurse in charge, Block D — asked whether ITU should prepare; trust fire officer has told them Stage 1, defend in place",
        "Critical care standby ambulance and theatre evacuation chain pre-planned with NWAS; nothing triggered",
      ],
    },
  ],

  vehicles: [
    {
      id: "v10-trust-fire-van",
      vrm: "MV72 FKJ",
      make: "Ford",
      model: "Transit Custom",
      colour: "White (trust fire team livery)",
      keeperName: "Royal Bolton Hospital — Estates & Facilities (trust fleet)",
      scenarioId: "10",
      notes: [
        "Trust fire team response van — on the internal road by the Block C/D link (scene landmark)",
        "Carries the ward plans set, the medical gas isolation keys and the trust fire team radios",
      ],
    },
    {
      id: "v10-estates-van",
      vrm: "MK21 RBW",
      make: "Ford",
      model: "Transit Connect",
      colour: "White",
      keeperName: "Royal Bolton Hospital — Estates & Facilities (trust fleet)",
      scenarioId: "10",
      notes: [
        "Estates on-call van — driven by the duty engineer (SIDDIQUE); parked in the staff car park east of Block D",
      ],
    },
  ],

  places: [
    {
      id: "pl10-block-c-entrance",
      kind: "landmark",
      name: "Block C entrance / RVP — Royal Bolton Hospital",
      address: "Block C forecourt, Royal Bolton Hospital, Minerva Road, Farnworth, Bolton",
      postcode: "BL4 0JR",
      coords: { lat: 53.5549, lng: -2.434 },
      scenarioId: "10",
      notes: [
        "RVP — trust fire officer meets crews here with the ward plans and the gas isolation locations",
        "Lifts in fire mode: stairs only to the 3rd floor; bridgehead on the 2nd floor landing",
      ],
    },
    {
      id: "pl10-ward-20",
      kind: "premises",
      name: "Ward 20 — Stage 2 receiving compartment, Block C 3rd floor",
      address: "Ward 20, Block C, Royal Bolton Hospital, Minerva Road, Farnworth, Bolton",
      postcode: "BL4 0JR",
      coords: { lat: 53.5552, lng: -2.4342 },
      scenarioId: "10",
      notes: [
        "Next fire compartment west of ward 19 — taking the six moved beds; compartment door at the ward 19/20 junction",
        "24-bed general medical; piped oxygen isolation valve at the ward entrance",
      ],
    },
    {
      id: "pl10-vie-compound",
      kind: "premises",
      name: "Bulk oxygen VIE compound — Block D",
      address: "Outside Block D, Royal Bolton Hospital, Minerva Road, Farnworth, Bolton",
      postcode: "BL4 0JR",
      coords: { lat: 53.5551, lng: -2.4332 },
      scenarioId: "10",
      notes: [
        "Vacuum-insulated evaporator, liquid oxygen — isolation by the estates authorised person only",
        "Keep vehicles and ignition sources clear; oxygen-enriched atmosphere if venting",
      ],
    },
    {
      id: "pl10-helipad",
      kind: "landmark",
      name: "Helipad — Royal Bolton Hospital",
      address: "North-east of Block D, Royal Bolton Hospital, Minerva Road, Farnworth, Bolton",
      postcode: "BL4 0JR",
      coords: { lat: 53.5554, lng: -2.4329 },
      scenarioId: "10",
      notes: [
        "Air ambulance landing site — approach over the green space north of the blocks",
        "Not a fire service RVP; keep clear for HEMS if a patient move goes beyond Stage 2",
      ],
    },
    {
      id: "pl10-security-lodge",
      kind: "premises",
      name: "Security lodge / fire panel repeater — site entrance",
      address: "Site entrance, Royal Bolton Hospital, Minerva Road, Farnworth, Bolton",
      postcode: "BL4 0JR",
      coords: { lat: 53.5556, lng: -2.4331 },
      scenarioId: "10",
      notes: [
        "24/7 security desk with the repeater panel — switchboard 0161 496 0400",
        "Trust fire team base; response van parks on the internal road",
      ],
    },
    {
      id: "pl10-patient-home",
      kind: "premises",
      name: "Home address — KENYON, Dorothy",
      address: "142 Plodder Lane, Farnworth, Bolton",
      postcode: "BL4",
      coords: { lat: 53.5566, lng: -2.4318 },
      scenarioId: "10",
      notes: [
        "Home oxygen user — concentrator and ambulatory cylinders on the premises (home oxygen notification on file)",
        "Occupant currently an inpatient at Royal Bolton (ward 19); lives alone",
      ],
    },
  ],
};
