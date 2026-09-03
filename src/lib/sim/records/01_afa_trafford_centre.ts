import type { RecordSet } from "../records";

// Records for scenario 01 — AFA, Trafford Centre, zone N3.
//
// An AFA from a big multi-occupier site: the call comes from the mall's
// own security control room, not a member of the public, and the people
// the desk holds are the people the building puts in front of the crews —
// the control room supervisor who rang it in, the designated fire liaison
// waiting at the Orient panel, the patrol officer sent up to the ceiling
// void, and the duty manager of the food court unit whose extract sits
// under the activated zone. No casualties are listed on the scene and
// none are recorded here.
//
// Everyone below is fictional. The premises is real; the unit number,
// the people and the vehicle are not. Addresses are work locations on
// the site — nobody's home address is held.

export const records01: RecordSet = {
  scenarioId: "01",

  people: [
    {
      id: "p01-caller-whittaker",
      name: "WHITTAKER, Gemma",
      sex: "F",
      age: 38,
      address: "Security Control Room, The Trafford Centre, Barton Dock Road, Manchester",
      postcode: "M17 8AA",
      phone: "0161 496 0412",
      roles: ["caller"],
      notes: [
        "Duty supervisor, mall security control room — rang in the N3 zone activation; patrol dispatched and CCTV checked before calling.",
        "24/7 keyholder contact for the premises. Holds the panel repeater and the zone plans.",
        "Previous: three AFA calls from this control room in the last 12 months, all confirmed false on arrival.",
      ],
      scenarioId: "01",
    },
    {
      id: "p01-liaison-patel",
      name: "PATEL, Rakesh",
      sex: "M",
      age: 52,
      address: "Orient entrance fire panel, The Trafford Centre, Barton Dock Road, Manchester",
      postcode: "M17 8AA",
      phone: "07700 900318",
      roles: ["occupant"],
      notes: [
        "Designated fire liaison for the site — meeting crews at the Orient entrance panel with zone plans and a mall radio.",
        "Holds keys to the service corridors and risers. If not answering the mobile, raise via the security control room.",
      ],
      scenarioId: "01",
    },
    {
      id: "p01-patrol-okafor",
      name: "OKAFOR, Emeka",
      sex: "M",
      age: 29,
      address: "On patrol — N3 service corridor, The Trafford Centre, Barton Dock Road, Manchester",
      postcode: "M17 8AA",
      phone: "07700 900527",
      roles: ["witness"],
      notes: [
        "Security patrol officer sent to zone N3 by the control room at the time of the call — first eyes on the ceiling void and service corridor.",
        "Reports by radio to security control, not direct to NWFC. Drove the site patrol vehicle to the service road.",
      ],
      scenarioId: "01",
      vehicleIds: ["v01-security-patrol"],
    },
    {
      id: "p01-unit-nowak",
      name: "NOWAK, Agnieszka",
      sex: "F",
      age: 34,
      address: "Unit FC-12, Food Court, The Trafford Centre, Barton Dock Road, Manchester",
      postcode: "M17 8AA",
      phone: "07700 900741",
      roles: ["occupant"],
      notes: [
        "Duty manager, food court unit FC-12 — the kitchen extract from this unit runs into the N3 ceiling void.",
        "Contact obtained via security control. Unit shutters to be pulled on security's instruction if the alarm is confirmed.",
      ],
      scenarioId: "01",
    },
  ],

  vehicles: [
    {
      id: "v01-security-patrol",
      vrm: "MK22 UVF",
      make: "Ford",
      model: "Transit Connect",
      colour: "White (security livery, amber beacons)",
      keeperName: "Trafford Centre site security — fleet vehicle",
      notes: [
        "Mall security patrol vehicle — parked on the N3 service road behind the food court block at the time of the call.",
        "Fleet vehicle; keeper is the site operator, not an individual. No markers.",
      ],
      scenarioId: "01",
    },
  ],

  places: [
    {
      id: "pl01-orient-panel",
      kind: "landmark",
      name: "Orient entrance — fire panel / RVP",
      address: "Orient entrance, The Trafford Centre, Barton Dock Road, Manchester",
      postcode: "M17 8AA",
      coords: { lat: 53.46625, lng: -2.34851 },
      notes: [
        "RVP for attending appliances — the designated fire liaison meets crews here with zone plans and a mall radio.",
        "Main panel repeater for the N zones; L1 detection. Sprinkler and riser status indicated on the panel.",
      ],
      scenarioId: "01",
    },
    {
      id: "pl01-security-control",
      kind: "premises",
      name: "Mall security control room",
      address: "Security Control Room, The Trafford Centre, Barton Dock Road, Manchester",
      postcode: "M17 8AA",
      coords: { lat: 53.46625, lng: -2.34881 },
      notes: [
        "Staffed 24/7 — keyholder contact for the whole site. CCTV coverage of the malls and service corridors.",
        "Originating point of the call. Runs the phased evacuation announcement if the alarm is confirmed.",
      ],
      scenarioId: "01",
    },
    {
      id: "pl01-n3-service-access",
      kind: "landmark",
      name: "N3 service corridor — service road access",
      address: "Service road off Barton Dock Road, The Trafford Centre, Manchester",
      postcode: "M17 8AA",
      coords: { lat: 53.46667, lng: -2.3486 },
      notes: [
        "Steel security shutter — keys held by security. The service corridor runs over the food court block to the N3 riser.",
        "Nearest hydrant H2 on the service road; dry riser inlet at the corridor head.",
      ],
      scenarioId: "01",
    },
    {
      id: "pl01-unit-fc12",
      kind: "premises",
      name: "Unit FC-12, Food Court",
      address: "Unit FC-12, Food Court (upper mall), The Trafford Centre, Barton Dock Road, Manchester",
      postcode: "M17 8AA",
      coords: { lat: 53.46653, lng: -2.34839 },
      notes: [
        "Commercial kitchen — gas appliances on interlock; extract ducting runs into the N3 ceiling void.",
        "Previous: AFA from this unit's extract 22/05/26 — confirmed false, steam off the dishwasher extract.",
      ],
      scenarioId: "01",
    },
  ],
};
