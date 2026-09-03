import type { RecordSet } from "../records";

// Records for scenario 03 — RTC, persons trapped, M60 westbound J17→J18.
//
// A night-time three-vehicle pile-up on a live carriageway. The 999 comes
// from a passing HGV driver who was two vehicles back and stopped on the
// hard shoulder; a second motorist stopped ahead of him and is with the
// Kia occupants. The desk holds the four casualties the scene lists (one
// per vehicle seat the story fills), the registered keepers of the three
// crashed vehicles — two of them the drivers, the Polo's the driver's
// mother — the courier firm whose Transit is at the front of the wreck,
// and the places the job turns on: the J17 RVP where the rolling block
// starts, the courier depot the van was returning to, and the Heaton Park
// car park that is the only realistic LZ if the aircraft is flying.
//
// Everyone below is fictional. Streets are real; house and unit numbers,
// the people, the firms and the vehicles are not. Phone numbers are in
// Ofcom's reserved drama ranges. The three CRS vehicles reuse the
// scenario's own registrations.

export const records03: RecordSet = {
  scenarioId: "03",

  people: [
    {
      id: "p03-caller-brennan",
      name: "BRENNAN, Darren",
      sex: "M",
      age: 47,
      address: "172 Oldham Road, Rochdale",
      postcode: "OL16 5RJ",
      phone: "07700 900184",
      roles: ["caller"],
      notes: [
        "Calling from the hard shoulder ~50 m east of the wreckage, beacons and hazards on — kept on the line. Reports three vehicles, smoke from the van and the van driver not moving.",
        "HGV driver, Pennine Reach Logistics — was two vehicles behind the Polo and stopped clear of the debris. Not injured, not involved.",
      ],
      scenarioId: "03",
      vehicleIds: ["v03-daf-artic"],
    },
    {
      id: "p03-cas1-hussain",
      name: "HUSSAIN, Tariq",
      sex: "M",
      age: 55,
      address: "46 Tottington Road, Bury",
      postcode: "BL8 1EJ",
      phone: "07700 900239",
      roles: ["patient"],
      notes: [
        "Driver of BN69 KVD — trapped by the steering column, critical. Identity from the depot's run sheet via the transport office, not from the casualty.",
        "Employed driver, Irwell Valley Couriers — night parcel run, on the return leg to the Whitefield depot. Next of kin (wife) held by the depot; contact on request.",
        "No trace PNC.",
      ],
      scenarioId: "03",
      casualtyId: "cas-1",
      vehicleIds: ["v03-transit"],
    },
    {
      id: "p03-cas2-walsh",
      name: "WALSH, Danielle",
      sex: "F",
      age: 34,
      address: "112 Walmersley Road, Bury",
      postcode: "BL9 5BQ",
      phone: "07700 900506",
      roles: ["patient", "keeper"],
      notes: [
        "Driver of MT68 XRF — scalp laceration bleeding heavily, ?C-spine; conscious. Registered keeper of the vehicle.",
        "Travelling home with partner (ADEBAYO, Marcus) — same address.",
        "No trace PNC.",
      ],
      scenarioId: "03",
      casualtyId: "cas-2",
      vehicleIds: ["v03-ceed"],
    },
    {
      id: "p03-cas3-adebayo",
      name: "ADEBAYO, Marcus",
      sex: "M",
      age: 32,
      address: "112 Walmersley Road, Bury",
      postcode: "BL9 5BQ",
      phone: "07700 900507",
      roles: ["patient"],
      notes: [
        "Front-seat passenger, MT68 XRF — chest pain and seatbelt bruising; conscious and holding the driver up per the caller.",
        "Partner of WALSH, Danielle. No trace PNC.",
      ],
      scenarioId: "03",
      casualtyId: "cas-3",
    },
    {
      id: "p03-cas4-kowalski",
      name: "KOWALSKI, Jakub",
      sex: "M",
      age: 22,
      address: "9 Stand Lane, Radcliffe, Manchester",
      postcode: "M26 1LG",
      phone: "07700 900612",
      roles: ["patient"],
      notes: [
        "Driver of DK20 HZE — out of the vehicle and walking, shaken; on the hard shoulder with the caller.",
        "Vehicle registered to his mother at the same address. Full licence held since 06/25.",
        "No trace PNC.",
      ],
      scenarioId: "03",
      casualtyId: "cas-4",
      vehicleIds: ["v03-polo"],
    },
    {
      id: "p03-keeper-kowalska",
      name: "KOWALSKA, Agnieszka",
      sex: "F",
      age: 51,
      address: "9 Stand Lane, Radcliffe, Manchester",
      postcode: "M26 1LG",
      phone: "07700 900613",
      roles: ["keeper"],
      notes: [
        "Registered keeper of DK20 HZE — not at the scene. Son (KOWALSKI, Jakub) is the driver.",
      ],
      scenarioId: "03",
      vehicleIds: ["v03-polo"],
    },
    {
      id: "p03-witness-mensah",
      name: "MENSAH, Kwame",
      sex: "M",
      age: 41,
      address: "231 Bury Old Road, Prestwich, Manchester",
      postcode: "M25 1JF",
      phone: "07700 900377",
      roles: ["witness"],
      notes: [
        "Stopped on the hard shoulder immediately behind the Polo, ahead of the caller's HGV. With the Kia occupants — has a first-aid kit from his car on the driver's head wound.",
        "Second 999 call on the job, 40 seconds after the first — linked to the same incident. Saw the Transit go across the lanes into the Armco and the Kia and Polo run into it.",
      ],
      scenarioId: "03",
      vehicleIds: ["v03-astra"],
    },
  ],

  vehicles: [
    {
      id: "v03-transit",
      vrm: "BN69 KVD",
      make: "Ford",
      model: "Transit 350 L3",
      colour: "White (courier livery)",
      keeperName: "Irwell Valley Couriers Ltd — fleet vehicle",
      notes: [
        "Front vehicle of the three — driver trapped by the steering column; diesel tank split, fuel running down the camber.",
        "Fleet vehicle; keeper is the company, not the driver. Depot transport office holds the run sheet and tracker (0161 496 0312).",
      ],
      scenarioId: "03",
      crsId: "veh-transit",
    },
    {
      id: "v03-ceed",
      vrm: "MT68 XRF",
      make: "Kia",
      model: "Ceed 1.4 T-GDi",
      colour: "Grey",
      keeperId: "p03-cas2-walsh",
      keeperName: "WALSH, Danielle",
      notes: [
        "Middle vehicle — two occupants, both injured, driver serious.",
        "Keeper is the driver. No markers.",
      ],
      scenarioId: "03",
      crsId: "veh-ceed",
    },
    {
      id: "v03-polo",
      vrm: "DK20 HZE",
      make: "Volkswagen",
      model: "Polo 1.0 TSI",
      colour: "Red",
      keeperId: "p03-keeper-kowalska",
      keeperName: "KOWALSKA, Agnieszka",
      notes: [
        "Rear vehicle — driver out and walking. Secondary for extrication; ignition off and handbrake on to be confirmed.",
        "Registered to the driver's mother at the same address. No markers.",
      ],
      scenarioId: "03",
      crsId: "veh-polo",
    },
    {
      id: "v03-daf-artic",
      vrm: "KX70 RVJ",
      make: "DAF",
      model: "XF 480 tractor unit + curtainside trailer",
      colour: "White",
      keeperName: "Pennine Reach Logistics Ltd — fleet vehicle",
      notes: [
        "Caller's HGV — stopped on the hard shoulder ~50 m east of the wreckage, beacons on. Not involved in the collision.",
        "Takes up the hard shoulder behind the scene — will need moving back before the fend-off appliance is positioned.",
      ],
      scenarioId: "03",
    },
    {
      id: "v03-astra",
      vrm: "YK19 LBW",
      make: "Vauxhall",
      model: "Astra",
      colour: "Silver",
      keeperId: "p03-witness-mensah",
      keeperName: "MENSAH, Kwame",
      notes: [
        "Witness's car — on the hard shoulder immediately behind the Polo, hazards on. Not involved.",
      ],
      scenarioId: "03",
    },
  ],

  places: [
    {
      id: "pl03-rvp-j17",
      kind: "landmark",
      name: "M60 J17 Whitefield — RVP / rolling block start",
      address: "M60 Junction 17 (A56 Bury New Road), Whitefield, Manchester",
      postcode: "M45 7SW",
      coords: { lat: 53.5452, lng: -2.2975 },
      notes: [
        "RVP for units not first in attendance — approach westbound from J17 only; the hard shoulder narrows once the rolling block is in.",
        "Rolling block to start from the J17 on-slip — request via National Highways control. Advance warning from the Heaton Park Road overbridge eastwards.",
      ],
      scenarioId: "03",
    },
    {
      id: "pl03-depot-irwell",
      kind: "premises",
      name: "Irwell Valley Couriers Ltd — Whitefield depot",
      address: "Unit 9, Bury New Road, Whitefield, Manchester",
      postcode: "M45 6DL",
      coords: { lat: 53.5512, lng: -2.2988 },
      notes: [
        "Registered keeper of BN69 KVD. Transport office staffed overnight: 0161 496 0312 — holds the run sheet, tracker position and the driver's next-of-kin details.",
        "Van was under 2 km from the depot on its return leg at the time of the collision.",
      ],
      scenarioId: "03",
    },
    {
      id: "pl03-heaton-park-sheepfoot",
      kind: "landmark",
      name: "Heaton Park — Sheepfoot Lane car park (secondary LZ)",
      address: "Sheepfoot Lane, Prestwich, Manchester",
      postcode: "M25 2SW",
      coords: { lat: 53.5442, lng: -2.279 },
      notes: [
        "Hard-standing car park south of the carriageway with a clear approach from the south — usable LZ if the aircraft is night-flying; the overbridge rules out an overhead approach to the scene itself.",
        "No direct access to the carriageway — crew walk-in needs a police vehicle from here via Bury Old Road and the J17 on-slip. Park gates locked overnight; keyholder via the council parks duty officer.",
      ],
      scenarioId: "03",
    },
  ],
};
