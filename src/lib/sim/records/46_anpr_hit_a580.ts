import type { RecordSet } from "../records";

// Records for scenario 46 — ANPR hit, stolen vehicle, A580 East
// Lancashire Road.
//
// Two vehicles, and that is the point of the job. The plate the camera
// read belongs to a real car with an innocent keeper in Tyldesley; the
// car it is believed to be cloned onto was stolen from a drive in
// Bolton overnight. Search the VRM and both come back, and the notes
// say which is which — the desk that reads them before committing a
// roads car has done the job; the desk that does not has stopped a
// nurse.
//
// Everyone here is fictional, as are both plates and both house
// numbers. The streets are real. Nothing reveals which way the
// scenario's roll lands: the keeper is recorded as the keeper, not as
// being on the road or at home tonight. The Little Hulton nominal is an
// intelligence association, not an identification, and is written that
// way.

export const records46: RecordSet = {
  scenarioId: "46",
  people: [
    {
      id: "p46-anpr-brennan",
      name: "BRENNAN, Sophie",
      sex: "F",
      age: 33,
      address: "ANPR desk, Force Contact — the informant on this job is a colleague, not a member of the public",
      phone: "0161 496 0731",
      roles: ["caller"],
      notes: [
        "ANPR desk operator relaying the hit and the intel cell's updates. Has the camera image, PNC and the Bolton report in front of her.",
        "The sim places the ANPR desk within Force Contact; GMP's actual arrangement is not claimed.",
      ],
      scenarioId: "46",
    },
    {
      id: "p46-keeper-haworth",
      name: "HAWORTH, Lindsey",
      sex: "F",
      age: 41,
      address: "22 Meanley Street, Tyldesley, Manchester",
      postcode: "M29",
      phone: "07700 900184",
      roles: ["keeper"],
      notes: [
        "Registered keeper of the grey Audi A3 Sportback MA68 KHV — the plate the camera read.",
        "Spoken to at 06:40 this morning after her plate was read on the M61 at Farnworth at 04:12 while her car was on her drive. Told her plates are believed cloned; DVLA and insurer informed. Not a suspect in anything.",
        "Nurse, works shifts at Salford Royal and uses the A580 to get there. Any read of MA68 KHV may be her — verify against the image before a stop.",
      ],
      scenarioId: "46",
      vehicleIds: ["v46-audi-plate"],
    },
    {
      id: "p46-victim-ogden",
      name: "OGDEN, Craig",
      sex: "M",
      age: 37,
      address: "14 Ashdene Crescent, Bradshaw, Bolton",
      postcode: "BL2",
      phone: "07700 900527",
      roles: ["victim", "keeper"],
      notes: [
        "Registered keeper of the grey Audi A3 Sportback MK19 DWO, stolen from his driveway at about 03:30 this morning. Reported at 05:50 on waking.",
        "Keyless theft — both keys still in the house. Doorbell camera shows two males, faces covered, at the car for under two minutes. Footage held by Bolton.",
        "Believes the car had about half a tank. Nothing distinctive on it beyond a child seat in the rear.",
      ],
      scenarioId: "46",
      vehicleIds: ["v46-audi-stolen"],
    },
    {
      id: "p46-nominal-deakin",
      name: "DEAKIN, Ryan",
      sex: "M",
      age: 26,
      address: "Laurel Drive, Little Hulton, Salford",
      postcode: "M38",
      roles: ["suspect"],
      markers: ["WANTED"],
      notes: [
        "INTELLIGENCE ASSOCIATION ONLY — not identified in the vehicle. The intel cell link him to a series of keyless Audi thefts across Bolton and Salford on MO and on previous convictions.",
        "Disqualified from driving until 2027. Two previous fail-to-stop pursuits (2024, 2025), both discontinued by the control room on risk. Expect a vehicle he is in to run from blue lights.",
        "Wanted on a fail-to-appear warrant (Bolton Magistrates, July 2026). No firearms or weapons markers.",
      ],
      scenarioId: "46",
    },
  ],
  vehicles: [
    {
      id: "v46-audi-plate",
      vrm: "MA68 KHV",
      make: "Audi",
      model: "A3 Sportback",
      colour: "Grey",
      keeperId: "p46-keeper-haworth",
      keeperName: "HAWORTH, Lindsey — Meanley Street, Tyldesley M29",
      markers: ["ANPR INTEREST", "CLONED PLATE"],
      notes: [
        "THE PLATE THE CAMERA READ. Legitimate keeper in Tyldesley, spoken to 06:40; her car was on her drive when this plate was read on the M61 at Farnworth at 04:12.",
        "Believed cloned onto the stolen Audi A3 MK19 DWO (Bolton, overnight). Any read of this plate may be either vehicle. Verify the image against the stolen report and ring the keeper before a stop is committed.",
        "Keeper is a shift worker at Salford Royal and drives the A580.",
      ],
      scenarioId: "46",
    },
    {
      id: "v46-audi-stolen",
      vrm: "MK19 DWO",
      make: "Audi",
      model: "A3 Sportback",
      colour: "Grey",
      keeperId: "p46-victim-ogden",
      keeperName: "OGDEN, Craig — Ashdene Crescent, Bradshaw, Bolton BL2",
      markers: ["STOLEN", "ANPR INTEREST"],
      notes: [
        "Stolen from the driveway at Ashdene Crescent, Bradshaw, about 03:30 — keyless, both keys still in the house. Two males on the doorbell footage.",
        "Believed now displaying cloned plates MA68 KHV (see that record). Its own plate has not been read since the theft.",
        "Report live on PNC. Child seat in the rear; otherwise nothing distinctive.",
      ],
      scenarioId: "46",
    },
  ],
  places: [
    {
      id: "pl46-scene",
      kind: "landmark",
      name: "A580 East Lancashire Road — Walkden Road signals, Worsley",
      address: "A580 East Lancashire Road eastbound, at the A575 Walkden Road junction, Worsley, Salford",
      postcode: "M28 7AT",
      coords: { lat: 53.5113, lng: -2.3933 },
      notes: [
        "Dual carriageway, no hard shoulder. Signalised crossroads with the A575 Walkden Road — Walkden to the north, Worsley village and M60 Junction 13 to the south.",
        "M60 Junction 14 about 1.5 km east. Past it the plate is on the motorway network and the next reads are Junction 12, Simister or the M61 at Farnworth.",
        "Housing both sides. The Greylag Crescent estate lies on the north side about 300 m west of the signals.",
      ],
      scenarioId: "46",
    },
    {
      id: "pl46-anpr-site",
      kind: "landmark",
      name: "ANPR site — A580 East Lancashire Road, Ellenbrook (sim)",
      address: "A580 East Lancashire Road eastbound, Ellenbrook, Worsley, Salford",
      coords: { lat: 53.5082, lng: -2.406 },
      notes: [
        "The camera that hit. The sim's own site: GMP's fixed ANPR camera positions are not published and none is claimed here (data/research/police/gaps.md).",
        "About 1.2 km west of the Walkden Road signals; B5232 Newearth Road junction alongside.",
      ],
      scenarioId: "46",
    },
    {
      id: "pl46-bradshaw-drive",
      kind: "premises",
      name: "14 Ashdene Crescent",
      address: "14 Ashdene Crescent, Bradshaw, Bolton",
      postcode: "BL2",
      coords: { lat: 53.6035, lng: -2.3991 },
      notes: [
        "Where the Audi was taken from overnight. Driveway to the front; doorbell camera covers it and the footage is with Bolton.",
        "Nothing for the desk to send here tonight — the scene is the road.",
      ],
      scenarioId: "46",
    },
  ],
};
