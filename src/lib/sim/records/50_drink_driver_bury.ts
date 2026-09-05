import type { RecordSet } from "../records";

// Records for scenario 50 — drink-driver reported, supermarket car park,
// Bury.
//
// Three people and two cars. The driver is the one the operator should
// look up before the unit gets to him: a plate check gives the keeper,
// a person check gives the 2022 conviction, and an officer who knows
// that before the window comes down is better placed than one who
// finds out at custody. The caller is who the desk actually talks to.
// The parked Corsa and its keeper are here so the plate the caller
// reads out can be searched; nothing on their records says what happens
// to the car, because most nights nothing does.
//
// Everyone here is fictional. The plates are invented. The retail park
// and the roads are real; the store is deliberately unnamed.

export const records50: RecordSet = {
  scenarioId: "50",
  people: [
    {
      id: "p50-caller-greenhalgh",
      name: "GREENHALGH, Lisa",
      sex: "F",
      age: 41,
      address: "Unsworth, Bury",
      postcode: "BL9 8",
      phone: "07700 900418",
      roles: ["caller", "witness"],
      notes: [
        "Informant. In her own car three bays from the subject vehicle with eyes on the driver throughout.",
        "Watched him cross the car park from the store entrance and get into the driver's seat. Describes him as unable to walk straight.",
        "Told the call handler she will follow him if he drives off. Needs telling not to.",
      ],
      scenarioId: "50",
    },
    {
      id: "p50-nuttall",
      name: "NUTTALL, Darren",
      sex: "M",
      age: 46,
      address: "Radcliffe, Manchester",
      postcode: "M26",
      phone: "07700 900265",
      roles: ["suspect", "keeper"],
      notes: [
        "Registered keeper of MV19 XKD, the silver Ford Focus the caller is watching.",
        "Previous: driving with excess alcohol (s.5 Road Traffic Act 1988), convicted at the magistrates' court March 2022. Twenty-month disqualification, reduced on completion of the drink-drive rehabilitation course. Licence restored 2023.",
        "Nothing recorded for violence. No warning signals on the record.",
      ],
      scenarioId: "50",
      vehicleIds: ["v50-focus"],
    },
    {
      id: "p50-akhtar",
      name: "AKHTAR, Imran",
      sex: "M",
      age: 38,
      address: "Manchester Road, Bury",
      postcode: "BL9 9",
      phone: "0161 496 0731",
      roles: ["keeper"],
      notes: [
        "Keeper of DE64 LWP, a red Vauxhall Corsa kept on the road outside his home on Manchester Road, south of the Pilsworth Road junction.",
      ],
      scenarioId: "50",
      vehicleIds: ["v50-corsa"],
    },
  ],
  vehicles: [
    {
      id: "v50-focus",
      vrm: "MV19 XKD",
      make: "Ford",
      model: "Focus",
      colour: "Silver",
      keeperId: "p50-nuttall",
      keeperName: "NUTTALL, Darren — Radcliffe, Manchester M26",
      notes: [
        "The subject vehicle. Taxed, insured and MOT current — nothing on the car itself.",
        "Keeper has a previous conviction for driving with excess alcohol (2022). See person record.",
      ],
      scenarioId: "50",
    },
    {
      id: "v50-corsa",
      vrm: "DE64 LWP",
      make: "Vauxhall",
      model: "Corsa",
      colour: "Red",
      keeperId: "p50-akhtar",
      keeperName: "AKHTAR, Imran — Manchester Road, Bury BL9 9",
      notes: [
        "Kept on the road outside the keeper's home on Manchester Road, Bury. Nothing recorded against it.",
      ],
      scenarioId: "50",
    },
  ],
  places: [
    {
      id: "pl50-car-park",
      kind: "landmark",
      name: "Supermarket car park, Pilsworth Road",
      address: "Supermarket car park, Pilsworth Road, Bury",
      postcode: "BL9 8RS",
      coords: { lat: 53.5773, lng: -2.2737 },
      notes: [
        "Out-of-town retail park surface car park, store on the north side. One vehicle entrance and exit via the service road onto Pilsworth Road.",
        "Right out of the park is Pilsworth Interchange and the M66 on-slip, under 300 m. Left is Pilsworth Road south-west to the A56 Manchester Road and Bury.",
        "Repeat location for shoplifting and theft from motor vehicles. No drink-drive report here in the last twelve months.",
      ],
      scenarioId: "50",
    },
    {
      id: "pl50-interchange",
      kind: "landmark",
      name: "Pilsworth Interchange (M66)",
      address: "Pilsworth Interchange, Pilsworth Road, Bury",
      postcode: "BL9 8QZ",
      coords: { lat: 53.5787, lng: -2.2715 },
      notes: [
        "Motorway junction immediately east of the retail park. A vehicle that reaches the slip road is a motorway job and a roads policing job — the nearest roads base is Whitefield.",
      ],
      scenarioId: "50",
    },
  ],
};
