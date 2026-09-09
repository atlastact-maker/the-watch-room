import type { RecordSet } from "../records";

// Records for scenario 55 — vehicle stop, no insurance, wanted driver,
// Washway Road, Sale.
//
// The driver is Callum DEAKIN, the shoplifter from scenario 47, linked
// here rather than copied so the PNC holds one man with one date of
// birth and one warrant. The car is his, in his name, with no policy on
// the MID since the summer — which is what the ANPR flagged. The search
// of it finds nothing: the job is the insurance and the warrant, not
// what is in the boot.
//
// Everyone is fictional. Washway Road is real; the parade and the
// lay-by are anybody's.

export const records55: RecordSet = {
  scenarioId: "55",
  linkedPeopleIds: ["p47-deakin"],
  people: [
    {
      id: "p55-passenger-none",
      name: "WITNESS — shop staff, Washway Road parade",
      roles: ["witness"],
      scenarioId: "55",
      notes: [
        "Assistant at the newsagent on the parade. Saw the stop from the doorway; nothing to add beyond the driver being on his own and compliant. Willing to give a name if asked.",
      ],
    },
  ],
  vehicles: [
    {
      id: "v55-astra",
      vrm: "MV15 UKZ",
      make: "Vauxhall",
      model: "Astra 1.4 SRi",
      colour: "Grey",
      keeperId: "p47-deakin",
      keeperName: "DEAKIN, Callum — Wood Lane, Partington, Manchester M31",
      markers: ["NO INSURANCE", "ANPR INTEREST"],
      notes: [
        "No policy on the Motor Insurance Database since 14 June 2026. Previous policy lapsed unpaid. ANPR interest marker placed by the roads policing unit in July.",
        "Keeper is the registered keeper since March 2025. MOT valid to February 2027. Taxed.",
        "Read on the A56 Washway Road corridor four times this month, always daytime, always one up.",
      ],
      scenarioId: "55",
    },
  ],
  places: [
    {
      id: "pl55-layby",
      kind: "scene",
      name: "Washway Road (A56) — lay-by outside the parade, Sale",
      address: "Washway Road, Sale, Trafford",
      postcode: "M33",
      coords: { lat: 53.4262, lng: -2.3312 },
      notes: [
        "Bus lay-by outside a parade of shops on the northbound side of the A56. Room for the stopped car and one patrol vehicle behind it; a second unit goes on the side road.",
      ],
      scenarioId: "55",
    },
  ],
};
