import type { Scenario } from "../incident_types";

// Scenario 15 — car fire on a live carriageway, A627(M) Chadderton.
//
// A car fire in a car park is one pump and a quiet twenty minutes. The
// same car fire on a live carriageway is a road closure, a police unit, a
// tailback and an hour, and the operator's job is to notice which one they
// have been given before they mobilise.
//
// The second thing it teaches is that a burning car on a motorway is not
// only a fire. Traffic is still passing it at seventy, the crew have to
// work with their backs to it, and roads policing exist for that. This is
// where the XT and ME patrols earn their keep — the nearest ME unit is
// almost certainly closer than anything else.
//
// FICTIONAL: the vehicle, its occupants and the recovery firm. The
// A627(M) and Chadderton are real; the incident is not.

export const scenario15: Scenario = {
  id: "15",
  slug: "15_car_fire_a627m",
  title: "Car fire — A627(M) northbound, Chadderton",
  type: "vehicle_fire",
  patch: "Eastern",
  severity: "moderate",
  trigger:
    "Car well alight on the hard shoulder of the A627(M) northbound. Occupants out and stood on the verge. Multiple callers passing",

  location: {
    address: "A627(M) northbound, between J20 and Chadderton, Oldham",
    postcode: "OL9 8EJ",
    coords: { lat: 53.5507, lng: -2.1229 },
  },

  property: {
    class: "Motor vehicle on a live motorway carriageway — hatchback, well alight",
    occupants:
      "Driver and one passenger, both out of the vehicle and on the nearside verge behind the barrier",
    vulnerabilities: [
      "Live carriageway — traffic passing the incident at speed while the crew work",
      "Occupants are stood on the verge with nowhere to go if a vehicle leaves the carriageway",
    ],
    access:
      "Northbound carriageway only — an appliance overshooting has a long way round. Nearest access from J20",
    knownHazards: [
      "Fuel tank and gas struts",
      "Traffic passing at speed; closure or lane restriction needed before crews work",
      "Smoke across both carriageways if the wind is across",
    ],
    firstDueStationId: "G35",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — highway incident.",
      "Motorway incident: roads policing and National Highways both have an interest.",
      "Recovery required before the carriageway reopens.",
    ],
  },

  methane: {
    M: "No",
    E: "A627(M) northbound between J20 and Chadderton",
    T: "Single vehicle well alight on the hard shoulder, live carriageway",
    H: "Fuel, gas struts, passing traffic at speed",
    A: "Northbound only — nearest access J20. No cross-carriageway access",
    N: "Two out and uninjured on the nearside verge",
    emergencyServices: "Fire and police required; roads policing for the carriageway",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: [],
      preferredStationId: "G35",
      notes: "One pump extinguishes a car. The rest of this attendance is about the road, not the fire",
    },
    {
      id: "roads1",
      label: "Roads policing",
      service: "Police",
      requiredApplianceTypes: ["Police_RPU"],
      requiredCapabilities: [],
      notes:
        "A crew cannot work a carriageway with traffic passing at seventy. The nearest ME unit is usually closer than anything divisional",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "First attendance", target: "< 12 minutes" },
      {
        metric: "Carriageway",
        target: "roads policing mobilised — crews do not work a live carriageway unprotected",
      },
      {
        metric: "Proportionate response",
        target: "one pump — a car fire is a car fire",
      },
    ],
    lesson:
      "Read where it is, not just what it is. The same car burning in a car park is one pump and twenty quiet minutes; on a live carriageway it needs the road shut before anybody gets off the appliance. Send the road protection with the pump, not after somebody asks for it.",
  },

  scene: {
    viewBox: { x: -70, y: -40, width: 140, height: 80 },
    compassNorth: "up",
    buildings: [],
    roads: [
      { shape: { x: -70, y: -22, w: 140, h: 12 }, kind: "road", label: "A627(M) southbound" },
      { shape: { x: -70, y: -8, w: 140, h: 3 }, kind: "pavement", label: "Central reserve" },
      { shape: { x: -70, y: -5, w: 140, h: 12 }, kind: "road", label: "A627(M) northbound" },
      { shape: { x: -70, y: 7, w: 140, h: 6 }, kind: "driveway", label: "Hard shoulder" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -4, y: 10 }, kind: "car", label: "Vehicle involved" },
      { pos: { x: -40, y: 0 }, kind: "car" },
      { pos: { x: 34, y: -16 }, kind: "car" },
      { pos: { x: 52, y: 0 }, kind: "car" },
      { pos: { x: -58, y: 18 }, kind: "lamppost" },
      { pos: { x: 26, y: 18 }, kind: "lamppost" },
    ],
    fireSeat: {
      pos: { x: -4, y: 10 },
      radiusM: 2,
      growthRateMpm: 0.4,
      suppressionPerBaMpm: 0.9,
      maxRadiusM: 5,
      material: "vehicle",
    },
    hazards: [
      {
        id: "live-carriageway",
        pos: { x: 10, y: 0 },
        kind: "structural",
        label: "Live carriageway — traffic passing at speed behind the crew",
        knownFromPri: true,
      },
      {
        id: "fuel-tank",
        pos: { x: -6, y: 11 },
        kind: "chemical",
        label: "Fuel tank and gas struts",
        knownFromPri: true,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Nearside verge", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Northbound approach", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Central reserve", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Ahead of the vehicle", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "passing-caller",
      atSec: 4,
      text: "I'm on the A627 heading north, there's a car on the hard shoulder absolutely blazing. Flames right up over the roof of it. I've gone past it now, I can't stop.",
      tone: "urgent",
    },
    {
      id: "driver-safe",
      atSec: 40,
      text: "This is the driver — it's my car. Me and my mate are out, we're stood behind the barrier on the grass. It just started smoking and then went up. No, nobody's hurt.",
      tone: "info",
    },
    {
      id: "traffic",
      atSec: 110,
      probability: 0.85,
      text: "There's traffic still coming past us really close and the smoke's blowing right across the road. Somebody's going to go into the back of something.",
      tone: "urgent",
    },
    {
      id: "spread-verge",
      atSec: 240,
      probability: 0.35,
      text: "It's caught the grass on the banking now — there's a line of it running up the verge away from the car.",
      tone: "urgent",
      effect: { pulseCritical: true },
    },
  ],

  // The call as Steve has it: hands-free in the outside lane of the
  // A627(M), the fire shrinking in his mirror and the Chadderton roundabout
  // coming up. He saw it for four seconds at seventy. He will tell the
  // operator exactly that and no more than that, and then he has to go.
  call: {
    caller: {
      name: "Stephen Dewhurst",
      phone: "07700 900509",
      relation: "Passing motorist — northbound, unable to stop",
      where: "Driving northbound on the A627(M), hands-free, half a mile past the vehicle",
      line: "mobile",
      state: "calm",
    },
    opening:
      "Yeah, hi — fire brigade. There's a car on fire on the A627(M), the motorway bit going north towards Oldham. It's on the hard shoulder and it's properly going — flames right up over the roof of it. I've just gone past it, I'm on hands-free, I couldn't stop.",
    deflection: "Mate, I've gone past it — I can't tell you more than what I saw. Just get somebody up there.",
    reassurance: {
      text: "Steve, you've done the right thing ringing it in. Keep your eyes on the road, and just tell me what you can see in the mirror.",
      reply: "Yeah. Yeah, alright. Go on.",
    },
    answers: {
      f_seen: {
        text: "A car on the hard shoulder, well alight — the whole front end, and the flames are coming up over the roof. Thick black smoke, loads of it. Blue hatchback, an Astra or something like it. Nobody in it that I could see.",
        tone: "urgent",
      },
      f_where: {
        text: "Northbound, on the hard shoulder. You come on at junction 20 off the M62 and it's a mile, mile and a half up — before you get to the Chadderton end. Just after the bridge. Pretty much halfway along.",
        followUps: [
          {
            id: "f_where_marker",
            text: "Did you see a marker post or a sign near it?",
            answer: {
              text: "No — sorry — I was doing seventy, I was looking at the fire, not the posts. The big blue sign for Oldham and Chadderton is just after it, I think. It's the only car on that hard shoulder, you'll not miss it.",
            },
          },
        ],
      },
      f_spread: {
        text: "It got worse just in the time I was going past. It was the bonnet and now it's the inside as well — I can still see it in my mirror, the smoke's gone right up. It's near the grass on the banking, but I couldn't tell you if it's caught.",
        tone: "urgent",
      },
      f_started: {
        text: "Can't have been long. Nobody was stopped, no cones, nothing — it was just going when I came round the bend. Minutes.",
      },
      f_building: {
        text: "It's a car — a small car, a hatchback. Blue. That's all I could tell you, it's mostly fire now.",
      },
      f_inside: {
        text: "I don't think so. There were two people on the grass behind the barrier, a bit further up from it, stood well back — I'm assuming that's them out of it. I didn't see anybody in the car, but I was past it in a second.",
        tone: "urgent",
        followUps: [
          {
            id: "f_inside_people",
            text: "The two on the verge — could you see if they were alright?",
            answer: {
              text: "Stood up, both of them. One of them was on his phone. They looked alright from what I saw — they weren't on the floor or anything, they were just watching it.",
            },
          },
        ],
      },
      f_hurt: {
        text: "Not that I saw. The two on the verge were on their feet. I can't tell you more than that, I've gone past.",
      },
      f_vulnerable: {
        text: "I couldn't tell you. Two adults, I think — blokes, I'd say. I didn't see any kids, I didn't see a car seat. I wasn't looking for one, mind.",
      },
      f_hazards: {
        text: "It's a car, so there's a tank of petrol or diesel in it, isn't there. I don't know what they've got in the boot — could be anything. There's nothing else near it, it's motorway — grass and the barrier, that's it.",
      },
      f_danger: {
        text: "The traffic. That's your problem — cars are going past it at seventy, nobody's slowing down, they're all rubbernecking and driving straight through the smoke. Lane one's right next to it. Somebody's going to hit something.",
        tone: "urgent",
        followUps: [
          {
            id: "f_danger_smoke",
            text: "Is the smoke going across the carriageway?",
            answer: {
              text: "It was going up when I passed, but there's a bit of a wind — it's leaning over, towards the other side, in my mirror. Both carriageways are going to be in it if it keeps on.",
            },
          },
        ],
      },
      f_access: {
        text: "You'll have to come up from junction 20, the M62 end, northbound — there's nothing in between, no way across from the other side, there's a barrier the whole way. It's on the hard shoulder, so that's blocked where it is. I'd get somebody to shut it, honestly.",
      },
      f_safe: {
        text: "I'm fine, I'm driving. I'm on hands-free and I'm well past it now, heading up to the Chadderton end.",
      },
      f_stay: {
        text: "I can for a couple of minutes. I'm driving, though — when I come off at the roundabout I'll have to go.",
      },
      f_details: {
        text: "Steve Dewhurst — Stephen. This is my mobile, 07700 900509. I'm hands-free in the car.",
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "Is somebody going? It's on a motorway, there's cars flying past it. I've never seen anything go up that fast.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 100,
        text: "I can still see it in my mirror — the smoke's massive now, a big black column. The cars behind me have got their hazards on.",
      },
      {
        atSec: 150,
        text: "Hang on — there's a blue light going down the other side, the southbound. Is that yours? They'll have to go all the way round at 20, they can't get across.",
        requiresOpened: true,
      },
    ],
    drops: {
      atSec: 200,
      text: "Right, I'm coming off at the roundabout, I'm going to lose you. I've told you everything I saw. The driver was on his phone on the verge — he'll have rung you. Good luck.",
    },
    onDispatch: "Good. Tell them it's on the hard shoulder and the traffic's not slowing. I'll keep looking in the mirror while I've got you.",
  },
};
