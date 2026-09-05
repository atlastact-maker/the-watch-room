import type { RecordSet } from "../records";

// Records for scenario 52 — mental health, no immediate risk, Glodwick.
//
// Two people and a house. That is the right size: the whole point of the
// job is that there is nobody here for a police record to be about. The
// son carries a MENTAL HEALTH marker because a previous welfare call put
// one there, and the notes say where each fact came from — most of what
// the desk knows about him it knows because his mother said it, not
// because any police system holds it.
//
// No vehicles. She has walked round; nobody in the script drives.
//
// Nothing here reveals which way the tablets roll lands. He is recorded
// as being inside, awake and texting, which is true on every run when the
// call comes in.
//
// Everyone here is fictional. Waterloo Street is real; no. 47 is not.

export const records52: RecordSet = {
  scenarioId: "52",
  people: [
    {
      id: "p52-mother-crabtree",
      name: "CRABTREE, Lorraine",
      sex: "F",
      age: 58,
      address: "Fitton Hill, Oldham",
      postcode: "OL8",
      phone: "07700 900318",
      roles: ["caller"],
      notes: [
        "Mother of the occupant and the informant. On the pavement outside the address, in text contact with him.",
        "Rang about him once before (November 2025); that call was resolved by phone with no attendance.",
        "Does not hold a key.",
        "Distressed and asking for a police officer rather than an ambulance. That is not a risk indicator — it is a mother.",
      ],
      scenarioId: "52",
    },
    {
      id: "p52-son-crabtree",
      name: "CRABTREE, Daniel",
      sex: "M",
      age: 31,
      address: "47 Waterloo Street, Glodwick, Oldham",
      postcode: "OL4 1ES",
      phone: "07700 900427",
      roles: ["occupant"],
      markers: ["MENTAL HEALTH"],
      notes: [
        "One previous concern-for-welfare log at this address, November 2025, from the same caller — resolved on a call-back with no attendance. Marker raised from that log.",
        "Home treatment team involvement in 2025 following a relationship breakdown; discharged back to GP care in the spring. Reported by his mother on this call — not held on any police system.",
        "Prescribed medication for low mood, which his mother believes he has stopped taking. Her account.",
        "No PNC record. No history of violence, no weapons, no warning markers beyond MENTAL HEALTH.",
        "Lives alone at the address.",
      ],
      scenarioId: "52",
      casualtyId: "cas-52-son",
    },
  ],
  vehicles: [],
  places: [
    {
      id: "pl52-house",
      kind: "premises",
      name: "47 Waterloo Street",
      address: "47 Waterloo Street, Glodwick, Oldham",
      postcode: "OL4 1ES",
      coords: { lat: 53.5367, lng: -2.102 },
      notes: [
        "Mid-terrace, two storey. Front door straight onto the Waterloo Street pavement; rear yard with a gate onto the back alley.",
        "No keyholder recorded. Mother does not hold a key.",
        "No warning markers on the address. One previous log (November 2025), closed by phone without attendance.",
      ],
      scenarioId: "52",
    },
  ],
};
