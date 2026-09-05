import type { Scenario } from "../incident_types";

// Scenario 30 — unresponsive male in a park, Leigh.
//
// Ambulance-led, and the police question sits underneath it the whole
// time. He is unresponsive with shallow breathing and there is drug
// paraphernalia beside him; his friend is there and frightened, and the
// friend is the reason to think carefully about what you send.
//
// If police arrive first and obviously, the friend leaves. The friend is
// the only person who knows what he has taken and when, and that
// information is worth more clinically than anything on the scene. So the
// operator's decision is whether police are needed at all — and the
// honest answer here is that they are not, unless the crew ask.
//
// This is the counterweight to scenario 22, where police leading is
// exactly right. Same instinct, opposite answer, and knowing which is
// which is the skill.
//
// HANDLED PLAINLY. No substance is named, no quantity, no method. The
// job is written from the desk's side: what to send and what not to.
//
// FICTIONAL: both young men and the park. Leigh and Pennington Flash are
// real; this park is not.

export const scenario30: Scenario = {
  id: "30",
  slug: "30_overdose_leigh",
  title: "Unresponsive male — park, Leigh",
  type: "ambulance_overdose",
  patch: "Western",
  severity: "high",
  trigger:
    "Category 1 — male in his twenties, unresponsive, breathing shallow and slow. Friend on scene. Suspected overdose",

  location: {
    address: "Pennington Park, off St Helens Road, Leigh",
    postcode: "WN7 4JD",
    coords: { lat: 53.4901, lng: -2.5228 },
  },

  property: {
    class: "Public park — patient on grass near the bandstand, some distance from the road",
    occupants: "Two — the patient and his friend. Park otherwise quiet",
    vulnerabilities: [
      "The friend is the only person who knows what has been taken and when",
      "He is frightened of the police and will leave if they arrive in numbers",
      "Patient is roughly 150 m from the nearest vehicle access",
    ],
    access:
      "Park gates off St Helens Road. A vehicle can get to the bandstand along the service path; the friend can meet the crew at the gate",
    knownHazards: [
      "Sharps on the ground beside the patient",
      "Carry distance from the vehicle if the service path is gated",
    ],
    // Leigh has no ambulance station of its own — the nearest is Wigan,
    // which is a longer run than the address suggests.
    firstDueStationId: "A-WIG",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — public open space.",
      "Service path from the gates to the bandstand is usable by an ambulance; the gate padlock code is held by the parks team.",
      "Police are NOT automatically required. They are for the crew's safety if it is asked for, not as a default.",
    ],
  },

  methane: {
    M: "No",
    E: "Pennington Park, off St Helens Road, Leigh, WN7 4JD",
    T: "Unresponsive male, breathing shallow and slow. Suspected overdose",
    H: "Sharps on the ground. Carry distance from the vehicle",
    A: "Park gates off St Helens Road, then the service path to the bandstand",
    N: "One — male, twenties, unresponsive. One friend on scene",
    emergencyServices: "Ambulance. Police on request only",
  },

  pda: [
    {
      id: "rrv1",
      label: "Rapid response vehicle",
      service: "Ambulance",
      requiredApplianceTypes: ["RRV"],
      requiredCapabilities: [],
      preferredStationId: "A-WIG",
      notes: "Nearest thing with a clinician in it. Category 1 — get somebody to him",
    },
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-WIG",
      notes: "He is going to hospital, and an RRV cannot take him",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "C1 response", target: "on scene inside 15 minutes at the 90th centile" },
      {
        metric: "Conveying resource",
        target: "a DCA as well as the RRV — a solo responder cannot take him",
      },
      {
        metric: "Police",
        target: "not sent by default — the friend holds the clinical history and will leave",
      },
    ],
    lesson:
      "The counterweight to the multi-storey. There, police leading is exactly right; here, sending them because the call mentions drugs costs you the one person who knows what was taken and when. Send clinicians, get the friend to meet them at the gate, and keep police available for if the crew ask. Knowing which of those two jobs you are looking at is the skill.",
  },

  scene: {
    viewBox: { x: -60, y: -45, width: 120, height: 90 },
    compassNorth: "up",
    // A hundred and fifty metres of grass from the gate.
    egressExtraSeconds: 180,
    buildings: [
      { shape: { x: -8, y: -22, w: 16, h: 12 }, kind: "neighbour", label: "Bandstand" },
      { shape: { x: 34, y: 18, w: 14, h: 10 }, kind: "neighbour", label: "Park keeper's hut" },
    ],
    roads: [
      { shape: { x: -4, y: -10, w: 6, h: 42 }, kind: "pavement", label: "Service path" },
      { shape: { x: -60, y: 32, w: 120, h: 4 }, kind: "driveway", label: "Park gates" },
      { shape: { x: -60, y: 36, w: 120, h: 9 }, kind: "road", label: "St Helens Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -30, y: 40 }, kind: "lamppost" },
      { pos: { x: 26, y: 40 }, kind: "lamppost" },
      { pos: { x: 14, y: 38 }, kind: "car" },
    ],
    hazards: [
      {
        id: "sharps",
        pos: { x: 2, y: -14 },
        kind: "chemical",
        label: "Sharps on the ground beside the patient",
        knownFromPri: true,
      },
      {
        id: "carry",
        pos: { x: -2, y: 8 },
        kind: "structural",
        label: "Roughly 150 m from the gates unless the service path is opened",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-30-male",
        label: "Male, twenties — unresponsive, breathing shallow",
        pos: { x: 0, y: -15 },
        severity: "critical",
        discoverAfterMinBa: 0,
        clinical: {
          // The picture that makes naloxone the answer: respiratory rate on
          // the floor with everything else still holding up.
          vitals: { rr: 6, spo2: 84, hr: 58, bpSys: 104, bpDia: 62, gcs: 6, temp: 35.8, bm: 5.4 },
          ageYears: 26,
          presumedCondition: "Reduced consciousness with respiratory depression — opioid toxicity suspected",
          redFlags: ["overdose_opioid", "airway_compromise"],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["naloxone", "oxygen", "iv_access"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Gates / St Helens Road", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Keeper's hut", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Bandstand", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Open park", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "friend-first",
      atSec: 5,
      text: "My mate's gone over — he's not answering me and his breathing's gone all slow and shallow. We're in the park by the bandstand. Please just send somebody.",
      tone: "critical",
    },
    {
      id: "what-taken",
      atSec: 50,
      text: "He's had something, yeah. I'll tell your paramedic exactly what when they get here. Are the police coming? Because I can't be here if the police come.",
      tone: "urgent",
    },
    {
      id: "gate",
      atSec: 120,
      probability: 0.85,
      text: "I'll go down to the gates and wave them in — there's a path they can drive up if the gate's open. It's a fair walk otherwise.",
      tone: "info",
    },
    {
      id: "breathing-worse",
      atSec: 220,
      probability: 0.5,
      text: "He's making a horrible noise now when he breathes and he's gone a funny colour round his lips. He's still not answering me.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],
};
