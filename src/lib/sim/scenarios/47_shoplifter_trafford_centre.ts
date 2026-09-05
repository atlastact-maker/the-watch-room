import type { Scenario } from "../incident_types";

// Scenario 47 — shoplifter detained, department store, the Trafford Centre.
//
// The quietest job on the stack and the one with the hardest deadline.
// Store security have a man in a back office for two hundred pounds of
// fragrance. He is sat down. Nobody is hurt. On THRIVE he is a Grade 2
// and he will never be anything else — but the store's clock is not his:
// two security officers are holding him on an any-person arrest that
// ends the moment they decide he is not worth the risk, and the manager
// who rings back at five minutes, fifteen and forty is telling the
// operator exactly when that is.
//
// So the pressure is not drama, it is competition. This wants the same
// Trafford response car as every Grade 1 on the patch, and the operator
// has to place it in the queue: not stripped from a domestic to get
// here, not left behind every domestic either. Two things move it up.
// The name he gives, searched, makes him wanted on warrant with a
// history of violence when challenged — which is the operator's reason
// to take the next car that clears rather than the one after. And, on
// roughly half of runs, he kicks off in the office.
//
// The failure beat is the store releasing him at the hour. Not the
// manager being difficult: the job, lost.
//
// FICTIONAL: everyone involved, and the store — Pendle & Marsh does not
// exist. The Trafford Centre is real and is a public place; nothing here
// describes its layout, its security arrangements or its tenants as
// fact. The back office, the stockroom and the staff door are the
// fictional store's.

export const scenario47: Scenario = {
  id: "47",
  slug: "47_shoplifter_trafford_centre",
  title: "Shoplifter detained — Trafford Centre",
  type: "police_shoplifter_detained",
  patch: "Southern",
  severity: "low",
  trigger:
    "Store security have a male detained for theft in the back office of a department store at the Trafford Centre. Compliant at present. Two staff with him. Asking how long",

  location: {
    address: "Pendle & Marsh department store, The Trafford Centre, Trafford Park, Manchester",
    postcode: "M17 8AA",
    coords: { lat: 53.4657, lng: -2.3486 },
  },

  property: {
    class:
      "Department store within a regional shopping centre — back office off the stockroom, upper level, staff door onto the service road",
    occupants:
      "Trading-hours footfall on the concourse. In the office: the detained male and two store security officers. Store manager on the shop floor and on the phone",
    vulnerabilities: [
      "Two security officers holding a man who does not want to be held, on an any-person arrest that ends whenever they decide it is not worth it",
      "Shop floor unstaffed while both of them are in the office — the manager's complaint, and a real one",
      "Staff door onto the service road — his way out the moment they let go",
      "Public concourse — any struggle in the mall draws a crowd and phones",
    ],
    access:
      "Staff entrance off the service road at the rear of the unit; store security will meet the car there and take officers through the stockroom. Not through the mall — the office is not reached from the shop floor and a marked car's worth of noise on the concourse helps nobody",
    knownHazards: [
      "Detained male — compliant now; the name he gave carries a history of violence when challenged",
      "Windowless office, one door",
    ],
    firstDueStationId: "MP-TRA",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — retail premises inside a shopping centre. Store security hold the detained male in a back office off the stockroom; officers are met at the staff entrance on the service road.",
      "Repeat caller. This store rings in a shoplifter most weeks and nearly all of them are compliant. What is different about this one is on PNC, not on the call.",
      "Store staff are holding him on an any-person arrest (s.24A PACE). It has no clock in law but it has one in practice: the store's own policy is to release after an hour if police have not arrived, and the manager will say so.",
      "Response cars for this job come from Trafford. Every Grade 1 on the patch wants the same three cars.",
    ],
  },

  methane: {
    M: "No",
    E: "Pendle & Marsh department store, The Trafford Centre, Trafford Park, M17 8AA — back office off the stockroom, staff entrance on the service road",
    T: "Theft from shop — one male detained by store security on an any-person arrest, compliant at present",
    H: "Confined office with one door; history of violence when challenged; the public concourse if he is brought out the wrong way",
    A: "Service road at the rear of the unit — staff entrance, met by store security. Not through the mall",
    N: "None injured. One male detained; two security officers with him",
    emergencyServices: "Police only — one response car. No ambulance, no fire",
  },

  pda: [
    {
      id: "police1",
      label: "Police — response car",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      preferredStationId: "MP-TRA",
      notes:
        "One car, and the whole attendance. He is detained and sat down; two officers take him from the office to custody. Nothing else goes unless he goes for the door, and even then a second car is a judgement on the night, not a PDA. What this slot competes with is every Grade 1 on the Trafford patch",
    },
  ],

  evaluation: {
    targets: [
      {
        metric: "First attendance",
        target: "< 60 minutes — GMP's published Grade 2 standard, and the store's patience runs out at the same mark",
      },
      {
        metric: "PNC check",
        target:
          "detained male searched on the name and date of birth he gave, before the car arrives — the WANTED marker changes what the officers walk into",
      },
      {
        metric: "Sizing",
        target: "one car; a second only if he goes for the door, not because the manager is shouting",
      },
      {
        metric: "Outcome",
        target: "male still detained when officers walk into the office — released at the hour is the failure",
      },
    ],
    lesson:
      "A shoplifter in a back office is the quietest job on the stack and the one with the hardest deadline. Nothing about him is a Grade 1 and nothing about him ever will be; the clock is the store's, not his. Two security officers are holding a man on an any-person arrest that ends the second they decide he is not worth it, and the manager who rings back at five minutes, fifteen and forty is telling you exactly when that is. Search him early, because the name he gave makes him wanted, and that is your reason to take the next car that clears rather than the one after. Send one car and send it properly. Do not strip a Grade 1 for him, and do not let him sit until the hour either, because the release at sixty minutes is not the store being difficult. It is you having lost the job.",
  },

  // Schematic only. A run of mall units either side of a public
  // concourse; the target store's back office sits at the rear of the
  // unit, reached from the stockroom, with the staff door onto the
  // service road behind. The layout is the fictional store's, not the
  // Trafford Centre's.
  scene: {
    viewBox: { x: -60, y: -40, width: 120, height: 80 },
    compassNorth: "up",
    buildings: [
      {
        shape: { x: -30, y: -26, w: 40, h: 32 },
        kind: "target",
        label: "Pendle & Marsh — back office off the stockroom (rear)",
      },
      { shape: { x: -58, y: -26, w: 26, h: 32 }, kind: "neighbour", label: "Adjoining units" },
      { shape: { x: 12, y: -26, w: 26, h: 32 }, kind: "neighbour", label: "Adjoining units" },
      { shape: { x: 40, y: -26, w: 18, h: 32 }, kind: "other", label: "Mall entrance / lifts" },
      { shape: { x: -58, y: 14, w: 116, h: 12 }, kind: "neighbour", label: "Units — opposite side of the mall" },
    ],
    roads: [
      { shape: { x: -60, y: -40, w: 120, h: 10 }, kind: "road", label: "Service road / staff car park — staff entrance, meet point" },
      { shape: { x: -60, y: -30, w: 120, h: 4 }, kind: "pavement", label: "Service corridor (staff only)" },
      { shape: { x: -60, y: 6, w: 120, h: 8 }, kind: "pavement", label: "Mall concourse (public)" },
      { shape: { x: -60, y: 28, w: 120, h: 12 }, kind: "driveway", label: "Car park" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -40, y: -35 }, kind: "car", label: "Delivery vehicle" },
      { pos: { x: 30, y: -35 }, kind: "lamppost" },
      { pos: { x: -30, y: 34 }, kind: "car" },
      { pos: { x: 0, y: 34 }, kind: "car" },
      { pos: { x: 30, y: 34 }, kind: "car" },
      { pos: { x: -50, y: 30 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "detained-male",
        pos: { x: -14, y: -22 },
        kind: "structural",
        label: "Detained male in the back office — compliant now; history of violence when challenged",
        knownFromPri: true,
      },
      {
        id: "single-door",
        pos: { x: -6, y: -18 },
        kind: "structural",
        label: "Windowless office, one door — the stockroom is the only way in and out",
        knownFromPri: true,
      },
      {
        id: "unstaffed-floor",
        pos: { x: -10, y: -4 },
        kind: "structural",
        label: "Shop floor unstaffed while both security officers are in the office",
        knownFromPri: true,
      },
      {
        id: "concourse",
        pos: { x: 0, y: 10 },
        kind: "structural",
        label: "Public concourse — walking him out through the mall draws a crowd and phones; use the staff door",
        discoverAfterMinOnScene: 1,
      },
    ],
    // Nobody is hurt. No patient, so no casualty.
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Mall concourse / shop floor", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Service road / staff entrance", face: "rear", bearingDeg: 0 },
      { id: 3, label: "Sector 3 · Mall entrance / lifts", face: "right", bearingDeg: 90 },
      { id: 4, label: "Sector 4 · Adjoining units", face: "left", bearingDeg: 270 },
    ],
  },

  // The caller is store security, and then the manager. The script runs
  // until the car arrives; every beat after the first five minutes is
  // the store's patience being spent, and the last two only ever play on
  // a run where the operator has let him sit.
  informantScript: [
    {
      id: "security-first",
      atSec: 5,
      text: "Security at Pendle and Marsh, the Trafford Centre. We've got a male detained for theft — about two hundred pounds of fragrance, straight past the tills. He's in the back office, he's sat down, he's not fighting us. There's two of us with him. How long are you going to be?",
      tone: "info",
    },
    {
      // The cue to search him. Name and date of birth, given freely.
      id: "pnc-details",
      atSec: 60,
      text: "He's given us a name — Callum Deakin, D-E-A-K-I-N, date of birth fourth of the third, ninety-five. No ID on him. He says he's been in here before, and one of the centre security lads reckons he knows the face. Can you run him?",
      tone: "info",
    },
    {
      // The manager's first call. Certain — this is the mechanic.
      id: "manager-first",
      atSec: 300,
      text: "It's the store manager at Pendle and Marsh. I've got two of my security staff sat in an office with this lad and a shop floor with nobody on it. I'm not being funny, but are you actually coming?",
      tone: "urgent",
    },
    // --- The roll. Roughly half of runs he kicks off. ------------------
    {
      id: "aggressive",
      atSec: 480,
      probability: 0.55,
      suppressesIds: ["quiet"],
      text: "He's kicked off. He's up, he's had a go at the door, he's telling my lad he'll put him through the wall. We've had to get hold of him again. He's not going anywhere but this is getting out of hand — you need to get somebody here.",
      tone: "urgent",
      effect: { pulseCritical: true },
    },
    {
      // No probability, deliberately. aggressive has taken its 55%; this
      // is the other 45% and it has to be certain, or a share of runs
      // hear neither and the office goes silent for no reason.
      id: "quiet",
      atSec: 540,
      text: "Nothing's changed here. He's sat on the chair with his head down, he's not said a word for ten minutes. Compliant as anything. Just tell me roughly when, so I can tell my manager something.",
      tone: "info",
    },
    {
      id: "calmer",
      atSec: 660,
      probability: 0.7,
      requiresFiredIds: ["aggressive"],
      text: "He's sat back down. Still gobbing off, but he's not tried the door again. Nobody's hurt. My lad's shaken up, that's all. I'd still like you here sooner rather than later.",
      tone: "info",
    },
    // --- The store's patience, on a slow response only. ----------------
    {
      id: "manager-second",
      atSec: 900,
      delayThresholdSec: 900,
      text: "Store manager again. That's a quarter of an hour. I've got a member of staff who should have gone home by now sat in that office, and my area manager on the other line asking why we bother detaining anybody if this is what happens. What do I tell her?",
      tone: "urgent",
    },
    {
      id: "release-warning",
      atSec: 2400,
      delayThresholdSec: 2400,
      text: "I'm giving you fair warning. If nobody is here by the top of the hour I'm letting him go. Our policy is an hour and I'm not having my staff assaulted over some perfume. I'll send you the CCTV and the name he gave and you can do what you like with it.",
      tone: "urgent",
      effect: { pulseCritical: true },
    },
    {
      // The failure beat. Only ever plays on a run where the car has not
      // arrived inside the hour.
      id: "released",
      atSec: 3600,
      delayThresholdSec: 3600,
      requiresFiredIds: ["release-warning"],
      text: "That's it, he's gone. We've walked him out the staff door and he's away across the staff car park. We've got his face on camera and the name he gave, and that's all we've got. You can cancel your officers.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  callGrade: {
    scale: "police_thrive",
    grade: 2,
    standardMinutes: 60,
    basis:
      "GMP Grade 2 — Priority: attendance 'within 1 hour'. GMP's own published figure, not a generic national one — Chief Constable's Regulation 28 response to HM Senior Coroner Manchester West, 26 Aug 2025 ('Priority or grade 2 - within 1 hour'); GMCA GMP Performance Briefing, Jan 2026 (one hour described as 'our aspired attendance time'; 77% of priority incidents attended within it over the year, up from 68%; average 1h 06m 49s). Both documents re-read for this scenario; neither gives a separate allocation target for grade 2, so none is used here. A shoplifter detained by store staff, compliant and not injured, is priority rather than immediate: no threat to life, offender contained, but a time-limited opportunity that a slow-time response would lose.",
  },
};
