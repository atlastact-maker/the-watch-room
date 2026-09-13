import type { Scenario } from "../incident_types";

// Scenario 21 — chimney fire, Marple.
//
// Chimney fires have their own category in the national statistics, which
// tells you how many of them there are. One pump, half an hour, a lot of
// mess and almost never anything worse.
//
// What makes this one worth having is WHERE it is. Marple is day-crewed,
// so outside 08:00–18:00 the pump does not roll in ninety seconds — the
// crew are alerted at home and turn out from there, and the operator
// watches several minutes go by before the appliance moves. This is the
// only scenario in the sim that puts that in front of them, and a chimney
// fire on a cold January night is exactly when it happens.
//
// FICTIONAL: the cottage and its occupants. Church Lane is a real Marple
// street; the property is not.

export const scenario21: Scenario = {
  id: "21",
  slug: "21_chimney_fire_marple",
  title: "Chimney fire — Church Lane, Marple",
  type: "chimney_fire",
  patch: "Southern",
  severity: "low",
  trigger:
    "Chimney fire at a stone cottage. Occupants out. Caller reports flames and sparks from the chimney pot and a roaring noise from the breast",

  location: {
    address: "4 Church Lane, Marple, Stockport",
    postcode: "SK6 7AY",
    coords: { lat: 53.3961, lng: -2.0619 },
  },

  property: {
    class: "Stone-built cottage — two storey, solid fuel stove, thatched-adjacent terrace of three",
    occupants: "Two — both out of the property and at a neighbour's",
    vulnerabilities: [
      "Terrace of three: the chimney stack is shared with next door",
      "Timber lintel over the fireplace opening, common in this stock",
    ],
    access:
      "Church Lane is narrow with parking both sides. An appliance may struggle past the bend; the turning circle is at the church",
    knownHazards: [
      "Shared stack — fire can extend into the neighbouring flue and roof void",
      "Timber lintel over the opening; heat transfer into the roof space",
      "Narrow lane restricting access and any second appliance",
    ],
    firstDueStationId: "G24",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "G24 Marple is DAY CREWED — outside 08:00 to 18:00 the crew are alerted from home and turn out from there.",
      "Terrace of three with a shared stack; the neighbouring flue is in use.",
    ],
  },

  methane: {
    M: "No",
    E: "4 Church Lane, Marple, SK6 7AY",
    T: "Chimney fire — flames from the pot, roaring in the breast",
    H: "Shared stack with the adjoining property; timber lintel; narrow lane",
    A: "Church Lane — narrow, parked both sides, turning circle at the church",
    N: "None — both occupants out at a neighbour's",
    emergencyServices: "Fire only",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G24",
      notes:
        "One pump. Note the station: day crewed, so outside 08:00–18:00 the turnout is from home and the clock runs before anything moves",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds from the desk" },
      {
        metric: "Turnout",
        target: "day-crewed turnout recognised — the appliance will not move for several minutes at night",
      },
      { metric: "First attendance", target: "< 15 minutes, allowing for the turnout" },
      {
        metric: "Extension",
        target: "second pump only if fire extends beyond the flue",
      },
    ],
    lesson:
      "Your mobilising time and your attendance time are different problems. You can get this away in sixty seconds and still watch nothing move for five minutes, because the nearest crew are getting out of bed. Knowing which of your stations are day crewed is knowing what your map actually means after six o'clock.",
  },

  scene: {
    viewBox: { x: -40, y: -35, width: 80, height: 70 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -8, y: -24, w: 17, h: 22 }, kind: "target", label: "No. 4" },
      { shape: { x: -27, y: -24, w: 17, h: 22 }, kind: "neighbour", label: "No. 2 — shared stack" },
      { shape: { x: 11, y: -24, w: 17, h: 22 }, kind: "neighbour", label: "No. 6" },
    ],
    roads: [
      { shape: { x: -40, y: 0, w: 80, h: 2 }, kind: "pavement" },
      { shape: { x: -40, y: 2, w: 80, h: 7 }, kind: "road", label: "Church Lane" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.3958, lng: -2.0627 }, street: "Church Lane" }],
    landmarks: [
      { pos: { x: -22, y: 5 }, kind: "car" },
      { pos: { x: 2, y: 5 }, kind: "car" },
      { pos: { x: 20, y: 5 }, kind: "car" },
      { pos: { x: -34, y: 12 }, kind: "lamppost" },
    ],
    fireSeat: {
      pos: { x: 0, y: -18 },
      radiusM: 1,
      growthRateMpm: 0.12,
      suppressionPerBaMpm: 0.5,
      maxRadiusM: 4,
      material: "structural",
    },
    hazards: [
      {
        id: "shared-stack",
        pos: { x: -6, y: -22 },
        kind: "structural",
        label: "Shared stack with no. 2 — extension into the neighbouring flue",
        knownFromPri: true,
      },
      {
        id: "lintel",
        pos: { x: 0, y: -12 },
        kind: "structural",
        label: "Timber lintel over the fireplace opening",
        discoverAfterMinOnScene: 2,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Church Lane frontage", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 6 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear garden", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 2 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "caller-first",
      atSec: 6,
      text: "It's the chimney — there's flames coming out the top of the pot and sparks going all over. You can hear it roaring in the wall. We've come out, we're next door at number six.",
      tone: "urgent",
    },
    {
      id: "stove",
      atSec: 55,
      text: "We'd had the stove going all day, it's been that cold. I've not had it swept since we moved in, I'll be honest with you.",
      tone: "info",
    },
    {
      id: "settling",
      atSec: 210,
      probability: 0.8,
      suppressesIds: ["extending"],
      text: "It's calming down a bit now — not as many sparks. Still a bit of smoke out the top but it's not roaring like it was.",
      tone: "info",
    },
    {
      id: "extending",
      atSec: 210,
      suppressesIds: ["settling"],
      text: "There's smoke coming out from under the roof tiles now, not just the chimney. And next door say they can smell it upstairs in theirs.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "access",
      atSec: 140,
      probability: 0.5,
      text: "I don't know how your engine's going to get down here, it's parked both sides. There's a turning bit up by the church.",
      tone: "info",
    },
  ],

  // The call as Helen has it: on her mobile at Jean's front window at
  // no. 6, Rob beside her, the pot of their own chimney throwing sparks
  // over the lane. They got out, they shut the stove down, they left the
  // door on the latch. She thinks the station is five minutes away, because it is.
  call: {
    caller: {
      name: "Helen Prescott",
      phone: "07700 900821",
      relation: "Occupant of no. 4 — out, at the neighbour's",
      where: "Front room of no. 6 Church Lane, at the window, husband with her",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "Hi — fire brigade, please. It's 4 Church Lane in Marple, SK6 — the stone cottages by the church. Our chimney's on fire. There's flames coming out of the pot, actual flames, and sparks, and there's a roaring noise in the wall. We've got out, we're next door at number 6. But it's a shared chimney and I don't know what it's doing inside.",
    deflection: "I don't know — I've not been back in and I'm not going back in. Can you just send them?",
    reassurance: {
      text: "Helen, you've done the right thing getting out. A crew is coming. Stay at Jean's, and just tell me what you can see from the window.",
      reply: "Okay. Yes. Sorry. I can see it from here, I'll tell you.",
    },
    answers: {
      f_seen: {
        text: "Flames out of the top of the chimney pot — a foot, two foot high, orange, and sparks, loads of them, going up and coming down all over the roofs. Ours and next door's. And there's a noise — it's roaring, like a jet engine. You could hear it in the wall when we were in, and you can still hear it out in the lane.",
        tone: "urgent",
      },
      f_where: {
        text: "The chimney. The stack on the left of ours as you look at it from the lane — it's the one we share with number 2. The stove's in our living room, on the wall we share with number 2 — that's where it goes up from.",
        followUps: [
          {
            id: "f_where_stove",
            text: "Is the stove door shut?",
            answer: {
              text: "Yes — I shut it, and I shut the vents on it, the little sliders. I read you're meant to. I didn't know what else to do. It was still roaring when we came out.",
            },
          },
        ],
      },
      f_spread: {
        text: "It's just the chimney as far as I can see — the pot. There's no smoke from the roof itself, no flames anywhere else. But the sparks are landing on the slates, ours and both next doors', and it's a shared stack, so I don't know what it's doing on number 2's side.",
        tone: "urgent",
      },
      f_started: {
        text: "The roaring started — fifteen minutes ago? We thought it was the wind at first, it's been blowing. Then Rob went out to the bin and saw the sparks and shouted me. We were straight out.",
      },
      f_building: {
        text: "A stone cottage — old, proper thick stone walls, two floors, slate roof. There's three of them in a row and we're the middle one. Number 2's joined on one side and 6 on the other, that's where we are now.",
      },
      f_inside: {
        text: "No — nobody. It's just me and Rob and we're both out, we're at Jean's at number 6. There's no one in ours.",
        followUps: [
          {
            id: "f_inside_no2",
            text: "And the people at number 2, the other side of the stack — are they in?",
            answer: {
              text: "I think so — their lights are on and their fire's lit, you can see their smoke. I've knocked and they've not come to the door. They're older, Ken and Margaret, they'll have the telly up. Rob's going to try again round the back.",
              tone: "urgent",
            },
          },
        ],
      },
      f_hurt: {
        text: "No, nobody. We're fine. Bit shaken, that's all. Jean's making tea.",
      },
      f_vulnerable: {
        text: "Not in ours, it's just us two. Next door at 2 — Ken and Margaret — they're in their seventies, but they're alright on their feet. Nobody with kids down here.",
      },
      f_hazards: {
        text: "No cylinders, nothing like that. There's the log basket by the stove and a bag of kindling. That's all there is in that room. No paint, no chemicals.",
      },
      f_danger: {
        text: "No. It's a quiet lane. Only thing is the lane itself — it's narrow and there's cars parked both sides, ours included. I can move ours if it helps.",
      },
      f_access: {
        text: "Church Lane — it's off the main road through Marple, by the church. It's narrow, single track once the cars are parked, and there's a bend. The front door of ours is open, it's on the latch, the key's in it. No gates, the door's straight off the lane.",
        followUps: [
          {
            id: "f_access_rear",
            text: "Is there a way round to the back?",
            answer: {
              text: "There's a path down the side of number 6 to the back gardens — it's a footpath, you'd not get a vehicle down it. The back door's locked, but the front's open.",
            },
          },
        ],
      },
      f_safe: {
        text: "We're at Jean's, next door at number 6, in her front room. I'm at the window. Is this far enough? Should we go outside?",
      },
      f_stay: {
        text: "Yes. I'll stay on. I can see the pot from here, I'll tell you if it changes.",
      },
      f_details: {
        text: "Helen Prescott. We live at 4 — we're at 6 now, Jean's. This is my mobile, 07700 900821.",
      },
    },
    interjections: [
      {
        atSec: 40,
        text: "The sparks are going right over the lane now, they're landing on the cars. There's a big one just come down — it's gone out on the road, it's alright.",
      },
      {
        atSec: 90,
        text: "Is somebody coming? Only I thought there was a fire station in Marple, it's not five minutes from here.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 140,
        text: "Rob's been round and got the people at number 2 to the door — the other side of the chimney from us. They're fine, they're going to have a look upstairs and let their fire die down.",
      },
      {
        atSec: 200,
        text: "Still nothing coming, no sirens. You said they were on their way — how far are they coming from? I thought the station was only up the road.",
        tone: "urgent",
        requiresOpened: true,
      },
    ],
    onDispatch: "Thank you. We'll stay at Jean's. Tell them the door's on the latch and it's the middle one of the three.",
  },
};
