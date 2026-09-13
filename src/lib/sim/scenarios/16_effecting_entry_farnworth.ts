import type { Scenario } from "../incident_types";

// Scenario 16 — effecting entry, concern for welfare, Farnworth.
//
// The ambulance service is outside a door they cannot get through and the
// person behind it is not answering. Fire go because they have the tools,
// and the whole job is one question: do you force it now, or wait?
//
// It is the AFA's question again, deliberately, and with the opposite
// answer. At a closed commercial unit the sensible thing is to wait for a
// keyholder and accept the twenty-minute limit. Here there is a person on
// the other side, so waiting is the expensive option — but forcing a door
// on somebody who has gone to their daughter's for the weekend is a
// broken door, a distressed family and a complaint, and it happens.
//
// The informant is the ambulance crew already outside, which changes the
// texture: they are not a frightened caller, they are colleagues telling
// the desk what they can see through a letterbox.
//
// FICTIONAL: Mr Sharples, his neighbour and the house number. Egerton
// Street is a real Farnworth street; the address is not.

export const scenario16: Scenario = {
  id: "16",
  slug: "16_effecting_entry_farnworth",
  title: "Effecting entry — concern for welfare, Farnworth",
  type: "special_service_effecting_entry",
  patch: "Western",
  severity: "moderate",
  trigger:
    "Ambulance crew on scene requesting fire service to gain entry. Male, 74, not answering, seen through the letterbox on the floor of the hall",

  location: {
    address: "8 Egerton Street, Farnworth, Bolton",
    postcode: "BL4 7HL",
    coords: { lat: 53.5461, lng: -2.4009 },
  },

  property: {
    class: "Terraced house — two storey, single occupancy",
    occupants:
      "One — Mr Alan Sharples, 74, lives alone. Ambulance crew and a neighbour outside",
    vulnerabilities: [
      "Known to the ambulance service — COPD, on home oxygen",
      "Home oxygen in the property changes what forcing a door means if there is any ignition source behind it",
    ],
    access:
      "Front door onto the street, uPVC with a multipoint lock. Rear yard reached by a shared entry three doors down; back door is a wooden one and likely the softer option",
    knownHazards: [
      "Home oxygen cylinders — no forced entry with any spark or flame source",
      "Terraced row: forcing the wrong door damages somebody else's house",
    ],
    firstDueStationId: "G53",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "Ambulance system flag: home oxygen at this address.",
      "No keyholder recorded. Daughter's number held by the neighbour but unanswered.",
    ],
  },

  methane: {
    M: "No",
    E: "8 Egerton Street, Farnworth, BL4 7HL",
    T: "Concern for welfare — entry required for the ambulance service",
    H: "Home oxygen in the property. Terraced row — adjoining occupied houses",
    A: "Front door uPVC multipoint; rear wooden door via the shared entry",
    N: "One believed inside — male, 74, seen on the hall floor, not responding to shouts",
    emergencyServices: "Ambulance on scene; fire requested for entry",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: [],
      preferredStationId: "G53",
      notes: "One pump. The ambulance are already there — this is a door, not a fire",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "First attendance", target: "< 10 minutes" },
      {
        metric: "Proportionate response",
        target: "one pump — the ambulance service is on scene and needs a door opened",
      },
      {
        metric: "Oxygen",
        target: "home oxygen passed to the crew before they force anything",
      },
    ],
    lesson:
      "The same question as a closed-premises alarm, with the opposite answer. There, waiting for a keyholder is right and the attendance is limited to twenty minutes. Here there is somebody on the floor behind the door, so waiting is the expensive option — but the flag on this address is home oxygen, and a crew who force a door without being told that are walking into a different job than the one they were sent to.",
  },

  scene: {
    viewBox: { x: -45, y: -35, width: 90, height: 70 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -9, y: -24, w: 18, h: 28 }, kind: "target", label: "No. 8" },
      { shape: { x: -29, y: -24, w: 18, h: 28 }, kind: "neighbour", label: "No. 6" },
      { shape: { x: 11, y: -24, w: 18, h: 28 }, kind: "neighbour", label: "No. 10" },
    ],
    roads: [
      { shape: { x: -45, y: 8, w: 90, h: 2 }, kind: "pavement" },
      { shape: { x: -45, y: 10, w: 90, h: 9 }, kind: "road", label: "Egerton Street" },
      { shape: { x: 30, y: -30, w: 6, h: 38 }, kind: "driveway", label: "Shared entry" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.5464, lng: -2.4014 }, street: "Egerton Street" }],
    landmarks: [
      { pos: { x: -20, y: 14 }, kind: "car", label: "Ambulance" },
      { pos: { x: 4, y: 14 }, kind: "car" },
      { pos: { x: -38, y: 6 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "home-oxygen",
        pos: { x: -2, y: -14 },
        kind: "chemical",
        label: "Home oxygen cylinders — no spark or flame source at entry",
        knownFromPri: true,
      },
      {
        id: "rear-door",
        pos: { x: 0, y: -26 },
        kind: "structural",
        label: "Rear wooden door via the shared entry — the softer option",
        discoverAfterMinOnScene: 1,
      },
    ],
    casualties: [
      {
        id: "cas-16-sharples",
        label: "Male, 74 — hall floor, seen through the letterbox",
        pos: { x: -2, y: -10 },
        severity: "serious",
        discoverAfterMinBa: 1,
        clinical: {
          // COPD on home oxygen, found down and cold. Saturations that
          // would frighten you in anybody else are closer to his normal.
          vitals: { rr: 26, spo2: 84, hr: 116, bpSys: 104, bpDia: 62, gcs: 10, temp: 34.9, bm: 4.6 },
          ageYears: 74,
          presumedCondition: "Collapse, unknown down-time — COPD, on home oxygen",
          redFlags: ["airway_compromise"],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen", "iv_access", "warming"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Front / Egerton Street", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 10 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear yard / shared entry", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 6 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "crew-first",
      atSec: 5,
      text: "Ambulance crew outside 8 Egerton Street. We've been called by a neighbour who's not seen him for two days. I can see him through the letterbox, he's on the hall floor and he's not responding to us shouting. We can't get in — can you get fire to us?",
      tone: "critical",
    },
    {
      id: "oxygen-flag",
      atSec: 40,
      text: "Be aware, our system's got him flagged for home oxygen. There'll be cylinders in there. Tell your crew before they start on that door.",
      tone: "urgent",
    },
    {
      id: "breathing",
      atSec: 110,
      probability: 0.7,
      suppressesIds: ["not-breathing"],
      text: "I think I can see his chest moving from here. He's not answering but he's breathing. We just need that door.",
      tone: "urgent",
    },
    {
      id: "not-breathing",
      atSec: 110,
      suppressesIds: ["breathing"],
      text: "I can't see him breathing from here at all. We need that door now — we're going to be straight into a resus the second it's open.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "back-door",
      atSec: 200,
      probability: 0.6,
      text: "The neighbour reckons the back door's only a wooden one and there's an entry three doors down that gets you into the yard. Might be quicker than the front.",
      tone: "info",
    },
  ],

  // The call as Gareth has it: on the crew phone on the front step of
  // no. 8, the letterbox flap held open with two fingers, his crewmate
  // with the neighbour. He has rung with a request, not a plea: he wants
  // a pump, he wants it told about the oxygen, and he wants the door open.
  call: {
    caller: {
      name: "Gareth Lomax",
      phone: "07700 900816",
      relation: "NWAS paramedic — ambulance crew on scene",
      where: "Front step of 8 Egerton Street, at the letterbox, ambulance parked outside",
      line: "mobile",
      state: "calm",
    },
    opening:
      "Hi — NWAS, ambulance crew, we're outside 8 Egerton Street in Farnworth, BL4 7HL. We need fire to us for entry. Seventy-four-year-old male on the hall floor — I can see him through the letterbox, he's not responding to us and we can't get in. Front door's uPVC and it's not going. Can you get a pump to us, please.",
    deflection: "I've given you the address and the job. Are you sending a pump or aren't you?",
    reassurance: {
      text: "Gareth, I've got a pump coming to you and they'll be told about the oxygen. Stay at the door, and tell me the second anything changes.",
      reply: "Right. Understood. Thanks.",
    },
    answers: {
      f_seen: {
        text: "Through the letterbox — a male on the hall floor, about a metre and a half in, lying on his side with his feet towards the door. Not moving. We've been shouting and banging for ten minutes and he's not so much as twitched. No smoke, nothing burning — it's a welfare job. We just need the door.",
        tone: "urgent",
      },
      f_where: {
        text: "The hall, straight behind the front door — ground floor. That's the only room I can see into from here. The hall light's on and there's a light on at the back.",
      },
      f_spread: {
        text: "It's not a fire. Nothing's spreading — there's nothing to spread. We just can't get to him.",
      },
      f_started: {
        text: "We've been here fifteen minutes. The neighbour rang it in about half an hour ago — she's not seen him for two days. So he could have been down a while. I've no way of knowing from here.",
      },
      f_building: {
        text: "Terraced house, two up two down — brick, one of a row. Number 8. Occupied both sides — the neighbour's from number 6, she's here with us.",
      },
      f_inside: {
        text: "One — Alan Sharples, seventy-four, lives on his own. He's on the hall floor. Nobody else in there that anybody knows of.",
        tone: "urgent",
        followUps: [
          {
            id: "f_inside_response",
            text: "Is he responding to anything at all — your voice, the banging?",
            answer: {
              text: "Nothing. We've shouted through the letterbox, hammered the door, banged on the front window — nothing. He's not moved since we got here.",
              tone: "urgent",
            },
          },
          {
            id: "f_inside_breathing",
            text: "Can you see whether he is breathing?",
            answer: {
              text: "Honestly, I can't tell from here. He's side-on and the angle's wrong — I can see his back and his legs, not his chest. I'm not going to guess at it. That's why we need the door.",
              tone: "urgent",
            },
          },
        ],
      },
      f_hurt: {
        text: "We're treating it as a collapse — I can't assess him through a letterbox. No blood that I can see. He's on our system with COPD, so he's not a well man to start with.",
        tone: "urgent",
      },
      f_vulnerable: {
        text: "Him. Seventy-four, lives alone, COPD, on home oxygen. That's the lot — there's nobody else in there.",
      },
      f_hazards: {
        text: "Yes — home oxygen. He's flagged on our system for it, so there'll be cylinders in the house, probably a concentrator as well. Whatever your crew do to that door: no sparks, no cutting gear, no flame. I want them told that before they start, not after.",
        tone: "urgent",
      },
      f_danger: {
        text: "No. Quiet street — it's us, the truck and the neighbour. Nobody's kicking off. The oxygen's the only thing.",
      },
      f_access: {
        text: "Front door's uPVC with a multipoint lock. It's locked and it's solid — we've tried it and it's not shifting. No keysafe. No keyholder that anybody knows of — the neighbour's got a number for his daughter and it's ringing out. It's terraced, there's no gap between the houses. The street's fine for you, on-street parking — we're outside it in the truck and there's room behind us.",
        followUps: [
          {
            id: "f_access_rear",
            text: "Is there a way round to the back?",
            answer: {
              text: "There'll be a yard — it's a terrace — but I've not been round and there's no side way from here. I'll ask the neighbour, she'll know. I'm not leaving him to go poking round the back on my own.",
            },
          },
        ],
      },
      f_safe: {
        text: "We're fine. We're on the pavement at the front door. It's a welfare job — there's no danger to us.",
      },
      f_stay: {
        text: "Yes, I'll keep this line open. I'll stay at the door with him — my crewmate's with the neighbour.",
      },
      f_details: {
        text: "Gareth Lomax, paramedic, NWAS. This is the crew phone — 07700 900816.",
      },
    },
    interjections: [
      {
        atSec: 60,
        text: "Just been back to the letterbox — no change, still not moving. My crewmate's got the neighbour trying the daughter again.",
      },
      {
        atSec: 120,
        text: "Sorry — have you got a crew assigned to this yet? I'm not getting anything back. I've got a man on the floor and I'm stood on his step.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 180,
        text: "I can hear your lot — two-tones coming up from the main road. I'll get the neighbour off the pavement and get the truck moved up.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Thanks. Tell them: uPVC front door, no keyholder, and home oxygen in the house. Say it to them — don't leave it on the screen.",
  },
};
