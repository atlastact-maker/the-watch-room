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
  // The call as Marianne has it: a headset on the monitoring floor in
  // Wakefield, forty miles from the unit, with a panel signal, an account
  // file and nothing else. She has passed a thousand of these. Everything
  // she gives is off the screen, and she says so whenever it matters.
  call: {
    caller: {
      name: "Marianne Doyle",
      phone: "03069 990118",
      relation: "Alarm receiving centre operator — Northgate ARC, monitoring the unit's fire alarm",
      where: "A desk at Northgate Alarm Receiving Centre, Wakefield — forty miles from the premises, no eyes on the building",
      line: "landline",
      state: "calm",
    },
    opening:
      "Fire control? Northgate ARC, Wakefield, operator Marianne. I've an automatic fire alarm to pass to you. Unit 7, Agecroft Commerce Park, Agecroft Road, Salford, M27 8UJ — that's Brennand Tooling. Zone 2 actuation, single zone. Premises are closed and there's nobody on site that we know of.",
    deflection: "I can only give you what the panel gives me. There's nobody at the site to ask.",
    reassurance: {
      text: "Marianne, that's fine — give me what the panel gives you and we'll work the rest from here.",
      reply: "Understood. Zone 2, single zone, premises closed. Go on.",
    },
    answers: {
      f_seen: {
        text: "Nothing — I can't see anything, I'm in Wakefield. What I've got is a fire signal off their panel: zone 2, which the account has down as the workshop. No call from anyone at the site, no confirmation of a fire from anybody. Just the head.",
      },
      f_where: {
        text: "Zone 2 is the workshop — the back half of the unit. Zone 1's the trade counter at the front, zone 3's the office mezzanine above it. Only the one zone in so far.",
      },
      f_spread: {
        text: "I can't tell you that. All I'd see is another zone dropping in. If it does, you'll hear it from me before you've finished asking.",
      },
      f_started: {
        text: "The signal hit our panel four minutes ago. We hold a short delay on commercial accounts overnight in case a keyholder cancels it — nobody has, so I've passed it.",
      },
      f_building: {
        text: "Small industrial unit — light engineering with a trade counter. Single storey, mezzanine office over the front. The access note has it third on the left off the estate road, in a terrace of units, steel roller shutter across the front.",
      },
      f_inside: {
        text: "Nobody, as far as we know. They trade eight till five, weekdays — there's no sleeping accommodation on the account and nobody's touched the panel from inside. It's the detector, not a person.",
        followUps: [
          {
            id: "f_inside_certain",
            text: "How sure are you that nobody is in there?",
            answer: {
              text: "Not certain — I can't be. What I can tell you is the system was set at ten past five and it's not been unset since. If someone had gone in with the code I'd see it. Nobody has.",
            },
          },
        ],
      },
      f_hurt: {
        text: "Not that I'm aware of. I've had nothing from anyone at the premises — I've only the signal.",
      },
      f_vulnerable: {
        text: "None listed. It's a workshop — no sleeping, no public overnight. It's an empty building until somebody tells me different.",
      },
      f_hazards: {
        text: "The account notes paint and thinners in the rear workshop — quantities not declared to us, I'm afraid. And there's a compressor and a dust extraction plant in the same room. That's all I hold on it.",
        followUps: [
          {
            id: "f_hazards_zone",
            text: "Is the paint in the same zone as the actuation?",
            answer: {
              text: "Yes. Rear workshop — that's zone 2. Same room as the head that's gone.",
            },
          },
        ],
      },
      f_danger: {
        text: "Nothing on the file. I'd expect the estate to be dark at this hour, but I can't speak to traffic or who's about on the ground — I'm not there. Nothing's been reported to us.",
      },
      f_access: {
        text: "It's locked and shuttered. Roller shutter down across the front, and a personnel door round the back off a shared yard. The estate gates stand open overnight. Nobody's getting in without a keyholder — there's two on the account and I'm about to start ringing them.",
        followUps: [
          {
            id: "f_access_keyholders",
            text: "Who are the keyholders, and how far off are they?",
            answer: {
              text: "First is Colin Brennand — he's the owner, lives in Swinton, about ten minutes from the unit. He's got the shutter key and the door. The second's a member of staff, Yusuf Akhtar — he's further out, Bury way, and he's only got the door key. I'll start with Colin.",
            },
          },
          {
            id: "f_access_yard",
            text: "Can an appliance get round the back?",
            answer: {
              text: "There's a service loop behind the units into a shared yard — fenced, the gate's not locked as far as the account goes. The note says it's tight; they'd likely have to reverse in.",
            },
          },
        ],
      },
      f_safe: {
        text: "I'm at a desk in Wakefield, love. I'm fine.",
      },
      f_stay: {
        text: "I can hold while you need me, but I've other accounts coming in. If I have to go I'll ring you straight back on this line the moment anything changes.",
      },
      f_details: {
        text: "Marianne Doyle, Northgate Alarm Receiving Centre, Wakefield. You've got us on 03069 990118 — ask for the fire desk. I'll give you the account number at the end for your log.",
      },
    },
    interjections: [
      {
        atSec: 40,
        text: "Panel's still showing the one zone. Nothing further's come in.",
      },
      {
        atSec: 95,
        text: "Sorry — are you attending this one? I need to log a yes or a no against the account either way.",
        requiresOpened: false,
      },
      {
        atSec: 150,
        text: "I've logged your attendance against the account. When I get a keyholder I'll tell him your crew's already there and to come to the estate gate.",
        requiresOpened: true,
      },
      {
        atSec: 230,
        text: "I've another account calling in, so I'll need to go in a minute. You've got the number — anything else you want from me before I do?",
      },
    ],
    onDispatch: "Noted, thank you. I'll log it and come back to you if another zone drops in, or as soon as I've got a keyholder moving.",
  },
};
