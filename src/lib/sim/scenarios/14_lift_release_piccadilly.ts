import type { Scenario } from "../incident_types";

// Scenario 14 — persons shut in a lift, Manchester city centre.
//
// The purest volume job there is. One pump, ten minutes, nobody hurt, and
// it happens constantly. Its entire value to this sim is that it takes a
// city-centre pump off the run for a quarter of an hour, and city-centre
// pumps are the ones everything else wants.
//
// The one decision in it is whether this stays a lift release. Four people
// in a stalled car on a warm evening is a nuisance; one of them being
// diabetic and going quiet is a different job with a different service on
// it. The operator finds out by listening, not by sending more.
//
// FICTIONAL: the building, the lift engineer's firm, and everyone in the
// car. Dale Street is a real city-centre street; the premises is not.

export const scenario14: Scenario = {
  id: "14",
  slug: "14_lift_release_piccadilly",
  title: "Persons in lift — Dale Street, Manchester",
  type: "special_service_lift_release",
  patch: "Southern",
  severity: "low",
  trigger:
    "Four persons shut in a lift between floors in a converted office block. Building manager on scene; lift engineer called but two hours away",

  location: {
    address: "Wheelwright House, Dale Street, Manchester",
    postcode: "M1 2HF",
    coords: { lat: 53.4816, lng: -2.2306 },
  },

  property: {
    class: "Converted Victorian warehouse — offices over ground-floor retail, six storeys",
    size: "Six floors, single passenger lift serving all",
    occupants:
      "Evening — most offices closed. Four persons in the car; building manager and a cleaner elsewhere in the building",
    vulnerabilities: [
      "One occupant of the car is diabetic and has not eaten since lunch",
      "Lift is the only one in the building — no second car to work from",
    ],
    access:
      "Main entrance on Dale Street, building manager holding it open. Lift motor room at sixth-floor level, keys with the manager",
    knownHazards: [
      "Car is stalled between the third and fourth floors — a drop below the doors if they are opened wrong",
      "Loading bay on the side street is the only place to put an appliance; Dale Street itself is red route",
    ],
    firstDueStationId: "G16",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — routine commercial premises.",
      "Building manager holds motor room keys and the lift maintenance contract details.",
      "Lift last serviced within the year per the notice in the car.",
    ],
  },

  methane: {
    M: "No",
    E: "Wheelwright House, Dale Street, M1 2HF",
    T: "Persons shut in a lift between the third and fourth floors",
    H: "Shaft drop if doors are opened at the wrong level; one occupant diabetic",
    A: "Dale Street main entrance; appliance to the loading bay on the side street",
    N: "Four in the car, all conscious and talking. None injured",
    emergencyServices: "Fire only at this time",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: [],
      preferredStationId: "G16",
      notes:
        "One pump. A lift release is a lift release — the second pump goes when somebody in the car stops being well, not before",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "First attendance", target: "< 10 minutes" },
      {
        metric: "Proportionate response",
        target: "one pump unless the call changes",
      },
      {
        metric: "Escalation",
        target: "ambulance ordered if the diabetic occupant deteriorates",
      },
    ],
    lesson:
      "Nothing here is difficult and that is the point — it will occupy a city-centre pump for a quarter of an hour, and a city-centre pump is what the next job will want. Listen to the informant rather than sending more: this becomes a medical job by what you are told, not by what you send.",
  },

  scene: {
    viewBox: { x: -50, y: -40, width: 100, height: 80 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -16, y: -30, w: 34, h: 40 }, kind: "target", label: "Wheelwright House" },
      { shape: { x: -46, y: -30, w: 26, h: 40 }, kind: "neighbour", label: "Adjoining offices" },
      { shape: { x: 22, y: -30, w: 24, h: 40 }, kind: "neighbour", label: "Retail unit" },
    ],
    roads: [
      { shape: { x: -50, y: 14, w: 100, h: 2 }, kind: "pavement" },
      { shape: { x: -50, y: 16, w: 100, h: 10 }, kind: "road", label: "Dale Street" },
      { shape: { x: 18, y: -34, w: 10, h: 48 }, kind: "driveway", label: "Loading bay" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.4818, lng: -2.2311 }, street: "Dale Street" }],
    landmarks: [
      { pos: { x: -30, y: 20 }, kind: "car" },
      { pos: { x: 34, y: 20 }, kind: "lamppost" },
      { pos: { x: -40, y: 20 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "shaft-drop",
        pos: { x: 0, y: -12 },
        kind: "structural",
        label: "Car stalled between floors — shaft drop below the doors",
        knownFromPri: true,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Dale Street entrance", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Loading bay", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Adjoining offices", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "manager-first",
      atSec: 6,
      text: "Building manager at Wheelwright House. We've four people stuck in the lift, somewhere between three and four. They're all fine, I've got them on the intercom. Our engineer says he's two hours away, which is no good to anybody.",
      tone: "info",
    },
    {
      id: "keys",
      atSec: 45,
      text: "I've got the motor room keys here and I'll meet your crew at the front. There's a loading bay round the side you can get the engine into — Dale Street's a red route, they'll get a ticket.",
      tone: "info",
    },
    {
      id: "all-well",
      atSec: 150,
      probability: 0.78,
      suppressesIds: ["diabetic-unwell"],
      text: "They're all still fine. Bit warm and a bit fed up. One of them's asking if they'll be out before the match starts.",
      tone: "info",
    },
    {
      id: "diabetic-unwell",
      atSec: 150,
      suppressesIds: ["all-well"],
      text: "One of the lads in there is diabetic and he says he's gone shaky and sweaty — he's not had anything since dinner. The others are saying he's gone a funny colour. Can you get somebody?",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "worse",
      atSec: 330,
      probability: 0.8,
      requiresFiredIds: ["diabetic-unwell"],
      text: "He's sat down on the floor of the car now and he's not really answering them properly. They're getting worried in there.",
      tone: "urgent",
    },
  ],

  // The call as Daniel has it: on the office cordless in the ground-floor
  // lobby at Wheelwright House, the lift intercom panel beside him with
  // Nadia's voice coming out of it. He has done the lift company and he
  // has done the checklist. Now he wants somebody with a key.
  call: {
    caller: {
      name: "Daniel Okonkwo",
      phone: "0161 496 0140",
      relation: "Building manager, Wheelwright House",
      where: "Ground-floor lobby at Wheelwright House, at the lift intercom panel",
      line: "landline",
      state: "calm",
    },
    opening:
      "Hello — it's not a fire, I should say that first. I'm the building manager at Wheelwright House on Dale Street, in town. I've got four people stuck in our lift between the third and fourth floors. They're all fine, I've got them on the intercom. Our lift company are saying two hours, which is no good to anybody, and one of the four's diabetic. Can you send somebody to get them out?",
    deflection: "I've told you what it is — four people, one lift, one diabetic. Is somebody coming or not?",
    reassurance: {
      text: "Daniel, a crew is coming to you. Keep them talking on that intercom, and keep everybody off the landing doors.",
      reply: "Fine. Yes. I'm doing that.",
    },
    answers: {
      f_seen: {
        text: "Nothing to see, honestly — I'm at the intercom panel down in the lobby. The lift's stuck between three and four. I've been up: the landing doors are shut on both floors and the indicator's dead. You can hear them through the doors if you shout.",
      },
      f_where: {
        text: "The lift shaft — it's the only lift, it runs up the middle of the building. The car's somewhere between the third floor and the fourth. It's six storeys, offices.",
      },
      f_spread: {
        text: "It's not a fire. Nothing's spreading, there's nothing to spread. No smoke, no smell, no alarms — it's just stopped. Between floors.",
      },
      f_started: {
        text: "Twenty-five minutes, near enough. They rang down on the intercom at ten past, I rang the lift company first like we're supposed to, they said two hours, so I've rung you.",
      },
      f_building: {
        text: "Converted warehouse — Victorian, six floors, offices above a shop on the ground floor. Wheelwright House, Dale Street, M1. It's evening, most of the offices have gone home. In the building it's me, a cleaner up on five, and the four in the lift.",
      },
      f_inside: {
        text: "Four in the lift. Two men and two women, from the fourth-floor office — they were on their way down. They're all talking, they're all on their feet. Nobody else in the building apart from me and the cleaner.",
        followUps: [
          {
            id: "f_inside_names",
            text: "Do you know who is in there?",
            answer: {
              text: "I've got names for two. Nadia Bashir, she's the one doing the talking on the intercom, and Ryan Hoyle — he's the diabetic one. The other two I don't know, same office.",
            },
          },
          {
            id: "f_inside_talk",
            text: "Can you speak to them?",
            answer: {
              text: "Yes, on the intercom — there's a button in the car, it rings through to this panel. I've told them to stay off the doors and not try anything clever. They're being sensible.",
            },
          },
        ],
      },
      f_hurt: {
        text: "No, nobody. It stopped with a jolt, they said, but nobody went over. They're stood up, they're warm, they're fed up. That's the extent of it.",
      },
      f_vulnerable: {
        text: "One of them — Ryan — he's diabetic. Type one, on insulin. He's told Nadia he's not eaten since lunchtime and he's got nothing on him. He says he's alright for the minute. I'd sooner not find out how long a minute is.",
        tone: "urgent",
      },
      f_hazards: {
        text: "No. It's an office building. Nothing stored, no gas, no cylinders — the motor room's up top and that's all electric. That's your lot.",
      },
      f_danger: {
        text: "No. It's quiet. The only thing — where the car is, between floors, if anybody forced the landing doors on three there's a drop into the shaft under it. I've told the ones in the car not to touch the doors and I've kept everyone off the landings.",
      },
      f_access: {
        text: "Main entrance on Dale Street — I'll be stood in it. I've got the motor room keys in my pocket, the motor room's on the sixth, top of the stairs. There's a lift landing on every floor; three and four are where they'll want to be.",
        followUps: [
          {
            id: "f_access_park",
            text: "Is there somewhere the appliance can stop?",
            answer: {
              text: "Not on Dale Street, it's a red route, you'll get done. There's a loading bay round the side, on the side street — I'll unbolt the gate on it. It takes a lorry, it'll take a fire engine.",
            },
          },
        ],
      },
      f_safe: {
        text: "I'm fine. I'm in the lobby, nothing's going to happen to me.",
      },
      f_stay: {
        text: "Yes, I'll stay on. I've got the intercom right here, so I can tell you if anything changes with them.",
      },
      f_details: {
        text: "Daniel Okonkwo, building manager. This is the office line — 0161 496 0140.",
      },
    },
    interjections: [
      {
        atSec: 50,
        text: "Hang on — yes, Nadia, I'm on to the fire brigade now, sit tight. Sorry. They're asking how long.",
      },
      {
        atSec: 110,
        text: "Sorry, are you actually sending anybody? I know it's not a fire. I've got a diabetic lad in a metal box and an engineer two hours away, so I'd like a straight answer.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 170,
        text: "Nadia says it's getting warm in there — the fan's not running. I've told them to stop pressing the alarm bell, it's doing nothing except deafening the cleaner.",
      },
      {
        atSec: 220,
        text: "I can hear a siren on Dale Street. I'll go and open up — I'm on the cordless, I'll keep you on.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Right. Thank you. I'll be at the front door with the keys.",
  },
};
