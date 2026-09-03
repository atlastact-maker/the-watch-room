// Scenario 06 — Chemical leak, Stockport Rail Freight Terminal. What a
// control room would hold for the job: site control (the 999 caller),
// the two yard staff who walked through the vapour, the security officer
// on the gate, the shunter driver, a resident downwind who rings in about
// the smell, the cars inside the gate and the Network Rail response van,
// and the places around the synthetic yard the job turns on.
//
// Everyone and every vehicle here is fictional. Addresses follow the
// house rule — a real street from the Hillgate / Portwood streets around
// the scene coordinates, a fictional number — and phone numbers sit only
// in Ofcom's reserved drama ranges. The terminal itself is derived from
// the scenario by buildRecordIndex() and is not repeated here; on-site
// points are placed from the scene geometry via the metresToLatLng
// convention (x east, y south, anchored on the scenario coords).

import type { RecordSet } from "../records";

const SCENARIO = "06";

export const records06: RecordSet = {
  scenarioId: SCENARIO,

  people: [
    // --- The 999 caller: site control -------------------------------------
    {
      id: "p06-caller-barlow",
      name: "BARLOW, Craig",
      sex: "M",
      age: 44,
      address: "Site control, Stockport Rail Freight Terminal, Lancashire Hill, Stockport",
      postcode: "SK1 1PE",
      phone: "0161 496 0418",
      roles: ["caller"],
      notes: [
        "999 caller — site control: product coming off wagon 4 in siding 4, pooling under the tank, vapour visible; panel on the wagon reads 3YE. All staff pulled back to the gate.",
        "Terminal shift manager and the PRI site liaison — holds today's consignment sheet at the site office. Call-back on the site control line.",
        "Previous: none.",
      ],
      scenarioId: SCENARIO,
    },

    // --- The two exposed yard staff ---------------------------------------
    {
      id: "p06-patient-hussain",
      name: "HUSSAIN, Imran",
      sex: "M",
      age: 35,
      address: "14 Turncroft Lane, Stockport",
      postcode: "SK1",
      phone: "07700 900314",
      roles: ["patient"],
      markers: ["MEDICAL"],
      notes: [
        "Casualty 1 — at the gatehouse with site control: walked through the vapour before the panel was read; coughing, wheezing badly, breathing getting worse.",
        "MEDICAL: site first-aid register lists him as asthmatic — uses a salbutamol reliever inhaler.",
        "Yard operative, day shift. Car in the staff bay inside the gate (MV68 KTR).",
      ],
      scenarioId: SCENARIO,
      casualtyId: "cas-exposed-1",
      vehicleIds: ["v06-hussain-golf"],
    },
    {
      id: "p06-patient-whittaker",
      name: "WHITTAKER, Gary",
      sex: "M",
      age: 52,
      address: "63 Hempshaw Lane, Stockport",
      postcode: "SK1",
      phone: "07700 900483",
      roles: ["patient"],
      notes: [
        "Casualty 2 — at the gatehouse with site control: found the leak with HUSSAIN; coughing, eyes and throat streaming, anxious but walking.",
        "Yard operative, day shift. No medical history given.",
      ],
      scenarioId: SCENARIO,
      casualtyId: "cas-exposed-2",
    },

    // --- On site with the caller ------------------------------------------
    {
      id: "p06-gate-adebayo",
      name: "ADEBAYO, Funmilayo",
      sex: "F",
      age: 38,
      address: "Gatehouse, Stockport Rail Freight Terminal, Lancashire Hill, Stockport",
      postcode: "SK1 1PE",
      phone: "07700 900602",
      roles: ["occupant"],
      notes: [
        "Site security officer on the gate — the PRI's 24/7 site liaison. Controls entry, holds the gate log, will meet the first appliance at the security gate.",
        "Not exposed — was in the gatehouse when the site alarm went.",
      ],
      scenarioId: SCENARIO,
    },
    {
      id: "p06-shunter-nowak",
      name: "NOWAK, Tomasz",
      sex: "M",
      age: 41,
      address: "c/o Stockport Rail Freight Terminal, Lancashire Hill, Stockport",
      postcode: "SK1 1PE",
      phone: "07700 900188",
      roles: ["witness"],
      notes: [
        "Shunter driver — left the diesel shunter running in siding 6, within 50 m of the leak, when staff were pulled back. Withdrew to the gate; not exposed.",
        "Can shut the shunter down on instruction — not to go back trackside without the incident commander's say-so.",
      ],
      scenarioId: SCENARIO,
    },

    // --- Downwind: the second 999 call ------------------------------------
    {
      id: "p06-caller-dixon",
      name: "DIXON, Marjorie",
      sex: "F",
      age: 71,
      address: "22 Canal Street, Stockport",
      postcode: "SK1",
      phone: "0161 496 0733",
      roles: ["caller"],
      notes: [
        "Second 999 call — resident south-west of the yard: sweet, solvent-type smell in the street and coming in at the back door. Advised to shut windows and doors and stay in; to ring back if it gets stronger.",
        "Previous: none.",
      ],
      scenarioId: SCENARIO,
    },
  ],

  vehicles: [
    {
      id: "v06-hussain-golf",
      vrm: "MV68 KTR",
      make: "Volkswagen",
      model: "Golf",
      colour: "Grey",
      keeperId: "p06-patient-hussain",
      keeperName: "HUSSAIN, Imran",
      notes: [
        "Parked in the staff bay inside the security gate — within the initial 75 m cordon. Keeper is casualty 1.",
      ],
      scenarioId: SCENARIO,
    },
    {
      id: "v06-site-ranger",
      vrm: "YK70 HWC",
      make: "Ford",
      model: "Ranger",
      colour: "White",
      keeperName: "Stockport Rail Freight Terminal — site operator (fleet)",
      notes: [
        "Site yard pick-up kept at the gatehouse. The site liaison uses it to escort vehicles onto the apron — no movement inside the cordon until the incident commander allows it.",
      ],
      scenarioId: SCENARIO,
    },
    {
      id: "v06-nr-mom-van",
      vrm: "BD21 LNP",
      make: "Ford",
      model: "Transit Custom",
      colour: "Orange",
      keeperName: "Network Rail Infrastructure Limited (fleet)",
      notes: [
        "Network Rail Mobile Operations Manager response vehicle — attending for the OLE isolation and the line block; expected at the security gate, reporting to the fire service incident commander.",
      ],
      scenarioId: SCENARIO,
    },
  ],

  places: [
    // On-site points, placed from the scene geometry.
    {
      id: "pl06-gatehouse",
      kind: "premises",
      name: "Site office + gatehouse — Stockport Rail Freight Terminal",
      address: "Security gate, Lancashire Hill, Stockport",
      postcode: "SK1 1PE",
      coords: { lat: 53.40775, lng: -2.15024 },
      notes: [
        "RVP for all services — the 24/7 site liaison on the gate controls entry; nothing goes trackside until Network Rail confirm the OLE dead.",
        "Site control room and site office: today's consignment sheet and the drain plan are held here.",
        "Caller and both exposed staff are at the gatehouse; staff cars parked alongside, inside the gate.",
      ],
      scenarioId: SCENARIO,
    },
    {
      id: "pl06-interceptor-valve",
      kind: "landmark",
      name: "Yard drain interceptor valve — south corner",
      address: "South-west corner of the yard, Stockport Rail Freight Terminal, Lancashire Hill, Stockport",
      postcode: "SK1 1PE",
      coords: { lat: 53.40764, lng: -2.15042 },
      notes: [
        "Drain plan (PRI annex): closing the interceptor isolates the yard drainage from the River Mersey outfall. Bunding points marked on the apron.",
        "First job for the EPU crew — once the pool clears the ballast edge it runs along the drainage channel beside the apron.",
      ],
      scenarioId: SCENARIO,
    },
    {
      id: "pl06-mersey-outfall",
      kind: "landmark",
      name: "Yard drainage outfall — River Mersey",
      address: "Southern boundary, Stockport Rail Freight Terminal, Lancashire Hill, Stockport",
      postcode: "SK1 1PE",
      coords: { lat: 53.40749, lng: -2.14945 },
      notes: [
        "Yard surface water discharges to the Mersey here. Environment Agency to be told at once if run-off passes the interceptor — 3YE is a water pollutant.",
      ],
      scenarioId: SCENARIO,
    },

    // Downwind, south-west of the yard — real streets, fictional numbers.
    {
      id: "pl06-downwind-hillgate",
      kind: "landmark",
      name: "Downwind residential — Middle Hillgate / Canal Street",
      address: "Middle Hillgate, Stockport",
      postcode: "SK1",
      coords: { lat: 53.40668, lng: -2.15468 },
      notes: [
        "Residential streets 250–400 m south-west of the yard — the downwind side. First area for shelter-in-place advice if the vapour drifts; evacuation is a Strategic decision.",
        "Police outer cordon on Lancashire Hill keeps traffic and the public off the frontage.",
      ],
      scenarioId: SCENARIO,
    },
    {
      id: "pl06-dixon-22-canal-street",
      kind: "premises",
      name: "22 Canal Street — second caller",
      address: "22 Canal Street, Stockport",
      postcode: "SK1",
      coords: { lat: 53.40625, lng: -2.15272 },
      notes: [
        "Home of the second 999 caller (DIXON) — solvent smell reaching the street. Advised to shelter in place.",
      ],
      scenarioId: SCENARIO,
    },
  ],
};
