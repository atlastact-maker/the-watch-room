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
};
