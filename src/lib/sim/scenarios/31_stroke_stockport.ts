import type { Scenario } from "../incident_types";

// Scenario 31 — stroke, Stockport.
//
// The clock on this one did not start when the phone rang. It started
// when she was last seen well, and that is the only time that matters:
// thrombolysis has a window measured from ONSET, and a caller who says
// "she's been like this since I got up" has just told you something more
// important than any of her observations.
//
// So the operator's job includes a question that sounds pedantic and is
// not — when was she last normal? — and a destination that is a
// hyperacute stroke unit rather than the nearest department. A crew who
// arrive in nine minutes and drive to the wrong hospital have lost her
// more time than a crew who took fifteen and went to the right one.
//
// FICTIONAL: Mrs Whitelegg and the address. Bramhall Lane is a real
// Stockport road; the house is not. A-STK is real from
// nwas_stations.json.

export const scenario31: Scenario = {
  id: "31",
  slug: "31_stroke_stockport",
  title: "Stroke — female 71, Stockport",
  type: "ambulance_stroke",
  patch: "Southern",
  severity: "high",
  trigger:
    "Category 2 — 71-year-old female, facial droop and left-sided weakness, slurred speech. Husband called. Time of onset uncertain",

  location: {
    address: "88 Bramhall Lane, Stockport",
    postcode: "SK2 6HP",
    coords: { lat: 53.3961, lng: -2.1571 },
  },

  property: {
    class: "Semi-detached house — patient in an armchair in the front room",
    occupants: "Two — the patient and her husband",
    vulnerabilities: [
      "Time of onset uncertain, which decides whether she is a candidate for thrombolysis",
      "Husband is 74 and distressed; he is also the only witness to when she was last well",
    ],
    access: "Front door, short drive. Husband at the door",
    knownHazards: ["None"],
    firstDueStationId: "A-STK",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "Atrial fibrillation on the ambulance record; on an anticoagulant.",
      "Destination is a hyperacute stroke unit, not the nearest emergency department. The nearest department cannot thrombolyse.",
    ],
  },

  methane: {
    M: "No",
    E: "88 Bramhall Lane, Stockport, SK2 6HP",
    T: "Suspected stroke — facial droop, left-sided weakness, slurred speech",
    H: "None",
    A: "Front door and drive; husband waiting at the door",
    N: "One — female, 71",
    emergencyServices: "Ambulance only",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-STK",
      notes:
        "A DCA. She is going to a stroke unit and an RRV cannot take her there, so a solo responder only starts a second clock",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "C2 response", target: "on scene inside 40 minutes" },
      {
        metric: "Time of onset",
        target: "last-seen-well established on the call, not left to the crew",
      },
      {
        metric: "Destination",
        target: "hyperacute stroke unit — the nearest department cannot thrombolyse",
      },
    ],
    lesson:
      "The clock started before the phone rang. Thrombolysis is timed from when she was last well, so the question that decides this job is a pedantic-sounding one you ask her husband — and the answer changes whether a fast response helps her at all. Then send her past the nearest hospital to one that can treat her. Nine minutes to the wrong door is slower than fifteen to the right one.",
  },

  scene: {
    viewBox: { x: -40, y: -32, width: 80, height: 64 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -12, y: -24, w: 22, h: 24 }, kind: "target", label: "No. 88" },
      { shape: { x: 12, y: -24, w: 20, h: 24 }, kind: "neighbour", label: "No. 90" },
      { shape: { x: -36, y: -24, w: 20, h: 24 }, kind: "neighbour", label: "No. 86" },
    ],
    roads: [
      { shape: { x: -6, y: 0, w: 9, h: 12 }, kind: "driveway", label: "Drive" },
      { shape: { x: -40, y: 12, w: 80, h: 2 }, kind: "pavement" },
      { shape: { x: -40, y: 14, w: 80, h: 10 }, kind: "road", label: "Bramhall Lane" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -2, y: 5 }, kind: "car" },
      { pos: { x: -28, y: 18 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "onset-unknown",
        pos: { x: -4, y: -14 },
        kind: "structural",
        label: "Time of onset uncertain — decides whether thrombolysis is possible at all",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-31-whitelegg",
        label: "Female, 71 — facial droop, left-sided weakness",
        pos: { x: -4, y: -13 },
        severity: "serious",
        discoverAfterMinBa: 0,
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Bramhall Lane / drive", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 90 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear garden", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 86 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "husband-first",
      atSec: 5,
      text: "Something's happened to my wife. Her face has gone down one side and she can't lift her left arm. She's trying to talk but I can't make out what she's saying.",
      tone: "critical",
    },
    {
      id: "onset-vague",
      atSec: 50,
      probability: 0.55,
      suppressesIds: ["onset-known"],
      text: "I don't know when it started, love. She was in the chair when I came down and I thought she'd nodded off. She'd been fine when we went up at half ten last night.",
      tone: "urgent",
    },
    {
      id: "onset-known",
      atSec: 50,
      suppressesIds: ["onset-vague"],
      text: "It was twenty past eight. We were having our tea and she dropped her cup and I looked up and her face had gone. I looked at the clock, twenty past eight.",
      tone: "urgent",
    },
    {
      id: "anticoag",
      atSec: 130,
      probability: 0.8,
      text: "She's on the blood thinners, has been for years — for her heart, the irregular beat. Is that important?",
      tone: "info",
    },
  ],
};
