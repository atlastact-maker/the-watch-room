import type { RecordSet } from "../records";

// Records for scenario 47 — shoplifter detained, the Trafford Centre.
//
// Four people and two places. The one that matters is the detained
// male: the whole point of the job is that the operator searches the
// name he gave and finds a warrant and a violence marker behind a call
// that sounded like nothing. His record is written to reward the search
// without telling the operator which way the aggression roll lands —
// a history of violence when challenged is true on the nights he sits
// quietly too.
//
// Everyone here is fictional, and so is the store. The Trafford Centre
// is real; the place record for it says only what any regional shopping
// centre could be assumed to have, and nothing about its actual
// security arrangements, tenants or layout.

export const records47: RecordSet = {
  scenarioId: "47",
  people: [
    {
      id: "p47-deakin",
      name: "DEAKIN, Callum",
      sex: "M",
      dob: "1995-03-04",
      age: 31,
      address: "Last known: Wood Lane, Partington, Manchester — no fixed address confirmed since February 2026",
      postcode: "M31",
      roles: ["suspect"],
      markers: ["WANTED", "VIOLENT"],
      notes: [
        "WANTED — warrant for fail to appear at the magistrates', theft from shop. Issued June 2026, not backed for bail.",
        "VIOLENT — assaulted a security officer who challenged him at a retail park in Altrincham, November 2024. Community order.",
        "Six previous for theft from shop across Trafford and Salford, all fragrance or spirits. Gives his real name when detained; has used the alias 'Callum DEAN' on street stops.",
        "Store security say he is on the centre's exclusion list — their record, not ours.",
        "Detained by store security at Pendle & Marsh, the Trafford Centre, on an any-person arrest. Compliant at the time of the call.",
      ],
      scenarioId: "47",
    },
    {
      id: "p47-halliwell",
      name: "HALLIWELL, Dean",
      sex: "M",
      age: 38,
      address: "Pendle & Marsh, The Trafford Centre, Trafford Park, Manchester",
      postcode: "M17 8AA",
      phone: "07700 900814",
      roles: ["caller", "witness"],
      notes: [
        "Store security officer and the informant. In the back office with the detained male throughout, with a second officer.",
        "Saw the theft on the shop floor and made the detention at the exit. Has the fragrance recovered and bagged.",
        "Number is the security team's work mobile.",
      ],
      scenarioId: "47",
    },
    {
      id: "p47-mistry",
      name: "MISTRY, Arjun",
      sex: "M",
      age: 24,
      address: "Pendle & Marsh, The Trafford Centre, Trafford Park, Manchester",
      postcode: "M17 8AA",
      roles: ["witness"],
      notes: [
        "Second store security officer, in the office with the detained male. Three months in the job.",
        "Was due off shift shortly after the call came in — which is the manager's point, not his.",
      ],
      scenarioId: "47",
    },
    {
      id: "p47-rathbone",
      name: "RATHBONE, Claire",
      sex: "F",
      age: 45,
      address: "Pendle & Marsh, The Trafford Centre, Trafford Park, Manchester",
      postcode: "M17 8AA",
      phone: "0161 496 0417",
      roles: ["caller"],
      notes: [
        "Store manager. Rings back on the store line; increasingly unhappy about two security staff off the floor.",
        "Holds the CCTV and will provide it. Has said the store will release the male at one hour if police have not arrived — store policy, and she means it.",
      ],
      scenarioId: "47",
    },
  ],
  vehicles: [],
  places: [
    {
      id: "pl47-store",
      kind: "premises",
      name: "Pendle & Marsh — department store, The Trafford Centre",
      address: "Pendle & Marsh, The Trafford Centre, Trafford Park, Manchester",
      postcode: "M17 8AA",
      coords: { lat: 53.4657, lng: -2.3486 },
      notes: [
        "Department store unit on the upper level of the mall. Back office is off the stockroom at the rear of the unit; windowless, one door.",
        "Officers are met at the staff entrance on the service road behind the unit (staff car park) and taken through the stockroom. The office is not reached from the shop floor.",
        "Repeat caller for theft from shop — most weeks. Store policy is to release a detained person after one hour if police have not attended.",
        "Bring a detained person out through the staff door, not across the concourse.",
      ],
      scenarioId: "47",
    },
    {
      id: "pl47-trafford-centre",
      kind: "landmark",
      name: "The Trafford Centre",
      address: "The Trafford Centre, Trafford Park, Manchester",
      postcode: "M17 8AA",
      coords: { lat: 53.4657, lng: -2.3498 },
      notes: [
        "Regional shopping centre, Trafford Park, off the M60. Trafford division ground.",
        "Large enough that 'the Trafford Centre' is not an address for a car — get the store name and the entrance, and have the store meet the officers at it.",
        "Expect store security and centre security to be different people — ask which you are speaking to, and which of them is meeting the car.",
      ],
      scenarioId: "47",
    },
  ],
};
