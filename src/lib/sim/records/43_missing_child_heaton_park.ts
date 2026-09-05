import type { RecordSet } from "../records";

// Records for scenario 43 — missing child, the boating lake, Heaton Park.
//
// A missing-person job is mostly a person record: the child, with the
// description the desk circulates, and the adults around her — the
// mother on the line, the friend she would go with, the member of park
// staff who knows the ground. The family car is here because the desk
// checks it: a car still in the car park is a small fact that shapes the
// search.
//
// Everyone here is fictional; the streets are real, the numbers are not.
// Nothing in these notes says how the scenario ends. The friend is
// recorded as being in the park, which is true on every run.

export const records43: RecordSet = {
  scenarioId: "43",
  people: [
    {
      id: "p43-whittaker-isla",
      name: "WHITTAKER, Isla",
      sex: "F",
      age: 7,
      address: "41 Lansdowne Road, Crumpsall, Manchester",
      postcode: "M8 5SH",
      roles: ["victim"],
      markers: ["MISSING", "CHILD"],
      notes: [
        "MISSING — high risk. Last seen at the water's edge by the Lake Cafe, boating lake, Heaton Park, twenty minutes before the call.",
        "Description: small for seven. Blonde hair in a bobble. Red duffle coat, grey leggings, pink trainers with lights in the soles. Cannot swim.",
        "Year 2 at a primary school in Crumpsall. No previous missing reports. Not known to children's services.",
        "Mother is WHITTAKER, Gemma (caller). Parents separated; father rung by the mother, at work in Bury and on his way.",
      ],
      scenarioId: "43",
    },
    {
      id: "p43-whittaker-gemma",
      name: "WHITTAKER, Gemma",
      sex: "F",
      age: 34,
      address: "41 Lansdowne Road, Crumpsall, Manchester",
      postcode: "M8 5SH",
      phone: "07700 900418",
      roles: ["caller", "witness"],
      notes: [
        "Mother and the first informant. At the Lake Cafe with park staff and her younger child (boy, 4).",
        "Rang 999 after twenty minutes of searching the lakeside path herself. Distressed but giving a clear description.",
        "Has a recent photograph of Isla on her phone — officers to take it off her for circulation.",
      ],
      scenarioId: "43",
      vehicleIds: ["v43-corsa"],
    },
    {
      id: "p43-dunne-karen",
      name: "DUNNE, Karen",
      sex: "F",
      age: 36,
      address: "118 Crescent Road, Crumpsall, Manchester",
      postcode: "M8 0WS",
      phone: "07700 900527",
      roles: ["witness"],
      notes: [
        "Friend of the mother from the school run. In Heaton Park with the family this afternoon, with her own two children.",
        "Named by the mother as someone Isla knows well and would go with.",
      ],
      scenarioId: "43",
    },
    {
      id: "p43-holt-andrew",
      name: "HOLT, Andrew",
      sex: "M",
      age: 47,
      address: "Park staff — Heaton Park, Middleton Road, Manchester",
      postcode: "M25 2SW",
      phone: "0161 496 0731",
      roles: ["caller", "witness"],
      notes: [
        "Park staff on duty at the Lakeside; the second informant, on a separate line from the Lake Cafe.",
        "Has colleagues on the radio at the gates and two walking the water's edge. Knows the ground and every exit — use him, and direct him.",
        "Will meet units at the Lake Car Park entrance off Middleton Road.",
      ],
      scenarioId: "43",
    },
  ],
  vehicles: [
    {
      id: "v43-corsa",
      vrm: "MJ68 HVT",
      make: "Vauxhall",
      model: "Corsa",
      colour: "Silver",
      keeperId: "p43-whittaker-gemma",
      keeperName: "WHITTAKER, Gemma — Lansdowne Road, Crumpsall M8",
      notes: [
        "Family car. Parked in the Lake Car Park off Middleton Road — still there, checked by park staff.",
        "No markers.",
      ],
      scenarioId: "43",
    },
  ],
  places: [
    {
      id: "pl43-lake",
      kind: "landmark",
      name: "Boating lake, Heaton Park",
      address: "Heaton Park, Middleton Road, Manchester",
      postcode: "M25 2SW",
      coords: { lat: 53.5316, lng: -2.2574 },
      notes: [
        "Open water inside the park, about 400 m from the nearest public road. Lake Cafe and the Lakeside Adventure Playground on the south-west shore; the Heaton Park Tramway terminus (Lakeside) on the east side.",
        "Nearest vehicle point is the Lake Car Park off Middleton Road (A576), about 250 m south-east, then the park service road to the cafe. The last stretch to the water's edge is footpath.",
      ],
      scenarioId: "43",
    },
    {
      id: "pl43-lake-car-park",
      kind: "landmark",
      name: "Lake Car Park, Heaton Park",
      address: "Off Middleton Road (A576), Heaton Park, Manchester",
      postcode: "M25 2SW",
      coords: { lat: 53.5295, lng: -2.254 },
      notes: [
        "RVP for the lake. Public car park; park staff will meet units at the entrance.",
        "The service road continues from the car park to the cafe and the lakeside.",
      ],
      scenarioId: "43",
    },
    {
      id: "pl43-park",
      kind: "landmark",
      name: "Heaton Park",
      address: "Middleton Road, Manchester",
      postcode: "M25 2SW",
      coords: { lat: 53.5346, lng: -2.2561 },
      notes: [
        "Municipal park of about 250 hectares, run by Manchester City Council. Gates include Grand Lodge (Bury Old Road at Sheepfoot Lane), Middleton Road, Sheepfoot Lane, St Margaret's Road, and the Metrolink gate by the Heaton Park tram stop on the Bury line; there are other pedestrian entrances.",
        "Heaton Hall, the farm centre and the Temple sit on the high ground 500–700 m north of the lake.",
      ],
      scenarioId: "43",
    },
  ],
};
