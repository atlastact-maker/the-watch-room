import type { Scenario } from "../incident_types";

// Scenario 01 — AFA, small commercial unit, Agecroft.
//
// WHY IT MOVED. This scenario used to sit at the Trafford Centre. That was
// wrong, and our own research said so: under GMFRS's false-alarm policy
// (S17) an automatic alarm at premises with NO SLEEPING ACCOMMODATION gets
// no attendance at all between 08:00 and 19:00 unless someone reasonably
// believes a fire has broken out. A daytime zone activation at a shopping
// mall is a call-challenge, not a mobilisation — so the scenario was
// teaching an attendance that would not have happened.
//
// Out of hours it is a different call entirely, and that is this one: a
// locked, empty trade unit on an industrial estate, alarm sounding, nobody
// on site, and the nearest keyholder somewhere at home in bed. One pump
// goes. The clock that matters is S17's other limb — attendance at closed
// premises is limited to 20 minutes — which turns "wait and see" into a
// decision with a deadline.
//
// WHAT IS REAL AND WHAT IS NOT.
//   Real:      G60 Agecroft (Bolton Road, Pendlebury, M27 8XS) and its one
//              pump, from gmfrs_stations.json. The 20-minute closed-premises
//              limit and the 08:00-19:00 non-attendance window (S17).
//   Fictional: Brennand Tooling Ltd, and the unit itself. A fictional firm
//              at a real address is the convention here; a real firm named
//              as the site of a fire is not.
//   UNVERIFIED AND NEEDS A LOOK: the estate name, street and postcode below
//              were written from memory, not checked against OS or a
//              directory, and the coordinates are approximate. Confirm the
//              estate exists on Agecroft Road and that G60 really is nearest
//              before this is treated as sourced. Everything else in the
//              file survives the address being corrected.
//
// The false-alarm rate here is deliberately high. The old Trafford Centre
// script rolled a real fire on roughly a quarter of runs, which was about
// two and a half times what its own brief specified and far above reality —
// non-domestic AFAs are overwhelmingly false. Most of the time the crew
// finds a wet detector head and goes home. That is the point of the
// scenario, not a flaw in it.

export const scenario01: Scenario = {
  id: "01",
  slug: "01_afa_agecroft",
  title: "AFA — Brennand Tooling, Agecroft",
  type: "automatic_fire_alarm",
  patch: "Western",
  severity: "low",
  trigger:
    "Alarm receiving centre reporting a fire alarm actuation at an unoccupied commercial unit — zone 2, no signs of fire, keyholder being summoned",

  location: {
    address: "Unit 7, Agecroft Commerce Park, Agecroft Road, Salford",
    postcode: "M27 8UJ",
    coords: { lat: 53.5063, lng: -2.302 },
  },

  property: {
    class: "Small commercial unit — light engineering / trade counter, single storey with a mezzanine office",
    size: "~450 m² under one roof, plus a fenced yard",
    occupants:
      "Closed. Nobody on site — the unit trades 08:00-17:00 Monday to Friday and the estate is empty overnight",
    vulnerabilities: [
      "No sleeping accommodation — under GMFRS policy this call is only attended because it is out of hours",
      "Locked and shuttered; no way in without the keyholder or forcing entry",
    ],
    access:
      "Estate road off Agecroft Road, then the service loop to the rear yard. Gates to the estate stand open; the unit's own roller shutter and personnel door are locked",
    knownHazards: [
      "Small paint and thinners store in the rear workshop — quantities unknown out of hours",
      "Compressor and dust extraction plant in the workshop",
      "Yard is shared with the neighbouring units — appliance may need to reverse in",
    ],
    firstDueStationId: "G60",
    doorType: "steel_security",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No formal PRI — a unit of this size on a general industrial estate would not carry one.",
      "L3 detection to the trade counter, office and circulation; heat detection in the workshop.",
      "Alarm monitored by an ARC; two nominated keyholders on the account.",
      "No sprinklers. No riser. Hydrant on the estate road.",
    ],
  },

  methane: {
    M: "No",
    E: "Unit 7, Agecroft Commerce Park, Agecroft Road, Salford, M27 8UJ",
    T: "AFA — actuation on zone 2, unoccupied premises, no confirmation of fire from any caller",
    H: "Premises closed and locked; paint and thinners store believed in the rear workshop",
    A: "Estate road off Agecroft Road; unit is third on the left, service loop to the rear yard",
    N: "None believed on site — premises unoccupied",
    emergencyServices: "Fire only",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G60",
      notes:
        "One pump. Every sourced comparable for a commercial AFA is a single pumping appliance (S26, S34); GMFRS does not publish its own count (S17 is silent)",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "First attendance", target: "< 10 minutes" },
      {
        metric: "Proportionate response",
        target: "no second pump committed without a confirmed fire",
      },
      {
        metric: "Closed premises",
        target: "keyholder summoned, or the attendance closed inside 20 minutes",
      },
    ],
    lesson:
      "This call is only yours because it is dark. In working hours GMFRS would not attend it at all. So the question is never just 'is it real' — it is how long you hold a pump on a locked empty unit before you accept you cannot check it. Twenty minutes is the policy limit at closed premises. Get the keyholder moving early, because everything else depends on them.",
  },

  // Schematic — Unit 7, its neighbours and the estate road. 140m x 90m.
  scene: {
    viewBox: { x: -70, y: -45, width: 140, height: 90 },
    compassNorth: "up",
    buildings: [
      {
        shape: { x: -14, y: -30, w: 40, h: 26 },
        kind: "target",
        label: "Unit 7 — Brennand Tooling",
      },
      { shape: { x: -60, y: -30, w: 40, h: 26 }, kind: "neighbour", label: "Unit 6" },
      { shape: { x: 32, y: -30, w: 34, h: 26 }, kind: "neighbour", label: "Unit 8" },
    ],
    roads: [
      // Service loop behind the units, into the shared rear yard.
      { shape: { x: -70, y: -42, w: 140, h: 10 }, kind: "driveway", label: "Rear service loop" },
      // Estate road along the front, then the public road.
      { shape: { x: -70, y: 2, w: 140, h: 12 }, kind: "driveway", label: "Estate road" },
      { shape: { x: -70, y: 24, w: 140, h: 2 }, kind: "pavement" },
      { shape: { x: -70, y: 26, w: 140, h: 9 }, kind: "road", label: "Agecroft Road" },
    ],
    hydrants: [
      { label: "H1", coords: { lat: 53.5066, lng: -2.3031 }, street: "Estate road" },
      { label: "H2", coords: { lat: 53.5057, lng: -2.3008 }, street: "Agecroft Road" },
    ],
    landmarks: [
      { pos: { x: 6, y: 6 }, kind: "car", label: "Roller shutter — locked" },
      { pos: { x: -46, y: 8 }, kind: "lamppost" },
      { pos: { x: 44, y: 8 }, kind: "lamppost" },
      { pos: { x: -30, y: 30 }, kind: "lamppost" },
    ],
    // Dormant. Nothing burns unless the working-fire beat rolls true, and
    // it mostly does not.
    fireSeat: {
      pos: { x: 14, y: -18 },
      radiusM: 0,
      growthRateMpm: 0,
      suppressionPerBaMpm: 0.14,
      maxRadiusM: 5,
      material: "electrical",
      unknownMaterial: true,
    },
    hazards: [
      {
        id: "paint-store",
        pos: { x: 18, y: -26 },
        kind: "chemical",
        label: "Paint and thinners store — rear workshop",
        discoverAfterMinOnScene: 3,
      },
      {
        id: "extraction-plant",
        pos: { x: 8, y: -14 },
        kind: "electrical",
        label: "Dust extraction plant — isolator by the personnel door",
        discoverAfterMinOnScene: 2,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Front / estate road", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Unit 8 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear yard", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Unit 6 side", face: "left", bearingDeg: 270 },
    ],
  },

  // The caller is the alarm receiving centre, not a member of the public.
  // They have no eyes on the building — everything they say is off a panel
  // and a contact list, which is exactly why this call is hard.
  informantScript: [
    {
      id: "arc-first",
      atSec: 6,
      text: "Alarm receiving centre. We've a fire alarm actuation at Unit 7 Agecroft Commerce Park, Brennand Tooling — zone 2, that's their workshop. Premises are closed, no signal from anyone on site.",
      tone: "info",
    },
    {
      id: "arc-keyholder",
      atSec: 45,
      text: "I'm working the keyholder list now. First contact isn't picking up. Second keyholder lives out at Whitefield — if he answers, you're looking at twenty-five minutes before he's with you.",
      tone: "info",
    },
    // The reality roll. These two are mutually exclusive and between them
    // they always fire, so no playthrough is left without an answer.
    {
      id: "likely-false",
      atSec: 110,
      probability: 0.88,
      suppressesIds: ["working-fire"],
      text: "No further zones have come in and the panel's steady. For what it's worth, this account actuated twice last winter and both were the heat head over the wash bay picking up steam.",
      tone: "info",
    },
    {
      id: "working-fire",
      atSec: 110,
      suppressesIds: ["likely-false"],
      text: "Second zone just come in — zone 3, that's their office mezzanine. Two zones inside three minutes. I'd treat that as a working fire.",
      tone: "critical",
      effect: { igniteFire: { radiusM: 1.5, growthRateMpm: 0.22 }, pulseCritical: true },
    },
    {
      id: "keyholder-eta",
      atSec: 170,
      probability: 0.75,
      requiresFiredIds: ["likely-false"],
      text: "Second keyholder's answered — he's getting dressed now, reckons half an hour. I've told him your crew's already there.",
      tone: "info",
    },
    {
      id: "keyholder-none",
      atSec: 180,
      probability: 0.9,
      requiresFiredIds: ["working-fire"],
      text: "Still nothing from either keyholder. If your crews need to be in there, you're going in without them.",
      tone: "urgent",
    },
  ],
};
