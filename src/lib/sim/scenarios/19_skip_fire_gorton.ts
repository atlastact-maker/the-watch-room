import type { Scenario } from "../incident_types";

// Scenario 19 — skip fire against a building, Gorton.
//
// A skip fire is one pump and ten quiet minutes. A skip fire ALIGHT
// AGAINST A BUILDING is a building fire that has not started yet, and the
// difference is about four feet.
//
// So the operator gets a routine-sounding call and has to hear the one
// detail that changes it. "There's a skip on fire" is a secondary fire.
// "There's a skip on fire up against the back of the shop" is not, and
// the second pump wants ordering before somebody rings back to say the
// soffit has gone.
//
// The reality roll decides whether it takes hold. Most of the time the
// first pump gets there and it is a skip.
//
// FICTIONAL: the businesses and the caller. Hyde Road is a real Gorton
// road; the parade is not.

export const scenario19: Scenario = {
  id: "19",
  slug: "19_skip_fire_gorton",
  title: "Skip fire — rear of Hyde Road, Gorton",
  type: "secondary_fire_refuse",
  patch: "Southern",
  severity: "moderate",
  trigger:
    "Builders' skip well alight in the rear service yard of a shop parade. Caller says it is up against the back wall of the units",

  location: {
    address: "Service yard rear of 480–492 Hyde Road, Gorton, Manchester",
    postcode: "M18 7EE",
    coords: { lat: 53.4631, lng: -2.1749 },
  },

  property: {
    class: "Shop parade — six single-storey retail units with a shared rear service yard",
    occupants:
      "Evening — units closed. A takeaway at the end of the parade is still trading",
    vulnerabilities: [
      "Skip is against the rear wall of the units, under a timber soffit and a run of plastic guttering",
      "Takeaway at the end is open, with staff and customers inside",
    ],
    access:
      "Service yard entered from the side street. Yard is narrow and part-blocked by parked cars and bins",
    knownHazards: [
      "Gas meters on the rear elevation of two of the units",
      "Unknown skip contents — builders' waste, possibly cylinders",
      "Timber soffit and plastic guttering directly above the skip",
    ],
    firstDueStationId: "G19",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — retail parade.",
      "Rear yard shared by all six units; no separate compartmentation between the roof voids per the last inspection note.",
      "Hydrant on the side street at the yard entrance.",
    ],
  },

  methane: {
    M: "No",
    E: "Service yard rear of 480–492 Hyde Road, Gorton, M18 7EE",
    T: "Skip well alight against the rear wall of a shop parade",
    H: "Gas meters on the rear elevation; unknown skip contents; timber soffit above",
    A: "Service yard from the side street — narrow, part-blocked by parked cars",
    N: "None reported. Takeaway at the end of the parade still trading",
    emergencyServices: "Fire at this time",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G19",
      notes:
        "A skip is one pump. A skip against a building is not — but you send the first one either way and decide on what you are told next",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "First attendance", target: "< 8 minutes" },
      {
        metric: "Hearing the call",
        target: "second pump ordered if the fire is reported against the building",
      },
      {
        metric: "Proportionate response",
        target: "no make-up if it is a skip in the open and stays one",
      },
    ],
    lesson:
      "The difference between a secondary fire and a building fire is about four feet, and it is in the words the caller used rather than in the incident type on your screen. A skip in the middle of a yard is one pump. A skip against a timber soffit with gas meters on the wall is a building fire that has not started yet.",
  },

  scene: {
    viewBox: { x: -55, y: -40, width: 110, height: 80 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -40, y: -30, w: 80, h: 22 }, kind: "target", label: "Shop parade 480–492" },
      { shape: { x: 40, y: -30, w: 14, h: 22 }, kind: "neighbour", label: "Takeaway (open)" },
    ],
    roads: [
      { shape: { x: -55, y: -6, w: 110, h: 16 }, kind: "driveway", label: "Service yard" },
      { shape: { x: -55, y: 12, w: 12, h: 26 }, kind: "driveway", label: "Side street" },
      { shape: { x: -55, y: 30, w: 110, h: 9 }, kind: "road", label: "Hyde Road" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.4634, lng: -2.1756 }, street: "Side street" }],
    landmarks: [
      { pos: { x: -18, y: 2 }, kind: "car" },
      { pos: { x: -6, y: 2 }, kind: "car" },
      { pos: { x: 24, y: 34 }, kind: "lamppost" },
    ],
    fireSeat: {
      pos: { x: 2, y: -6 },
      radiusM: 2.5,
      growthRateMpm: 0.5,
      suppressionPerBaMpm: 0.7,
      maxRadiusM: 9,
      // Builders waste burns like contents until somebody finds out
      // otherwise, which is what unknownMaterial is for.
      material: "structural",
      unknownMaterial: true,
    },
    hazards: [
      {
        id: "gas-meters",
        pos: { x: 8, y: -9 },
        kind: "gas",
        label: "Gas meters on the rear elevation",
        knownFromPri: true,
      },
      {
        id: "soffit",
        pos: { x: 2, y: -9 },
        kind: "structural",
        label: "Timber soffit and plastic guttering directly above the skip",
        knownFromPri: true,
      },
      {
        id: "cylinders",
        pos: { x: 0, y: -5 },
        kind: "gas",
        label: "Cylinders in the skip — builders' waste, contents unconfirmed",
        discoverAfterMinOnScene: 2,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Service yard", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Takeaway end", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Parade frontage", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Side street", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "caller-first",
      atSec: 5,
      text: "There's a skip on fire round the back of the shops on Hyde Road. It's going well, flames a good six foot up. It's right up against the back wall of the units — it's not out in the middle or anything.",
      tone: "urgent",
    },
    {
      id: "takeaway",
      atSec: 60,
      text: "The chippy on the end's still open, there's people in there eating. Do you want me to tell them? The smoke's blowing that way.",
      tone: "info",
    },
    {
      id: "just-a-skip",
      atSec: 170,
      probability: 0.72,
      suppressesIds: ["taking-hold"],
      text: "It's burning itself down a bit now, it's not as high as it was. The wall's just black, I can't see anything actually alight on the building.",
      tone: "info",
    },
    {
      id: "taking-hold",
      atSec: 170,
      suppressesIds: ["just-a-skip"],
      text: "It's got the plastic guttering above it — that's dripping and burning and the wooden bit under the roof has caught. It's going up into the roof.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "bangs",
      atSec: 260,
      probability: 0.4,
      text: "There's been a couple of bangs from inside the skip. Sounds like tins going off, or bottles. I've moved back to the street.",
      tone: "urgent",
    },
  ],

  // The call as Dean has it: on his mobile at the mouth of the service
  // yard, the dog pulling the other way, the skip lighting up the back
  // wall of the parade thirty feet from him. He is not frightened of a
  // skip. He rang because of where it is stood, and he says so early.
  call: {
    caller: {
      name: "Dean Whittaker",
      phone: "07700 900819",
      relation: "Passer-by — lives on the side street, out walking his dog",
      where: "Entrance to the service yard off the side street, thirty feet from the skip",
      line: "mobile",
      state: "calm",
    },
    opening:
      "Fire brigade — there's a skip on fire behind the shops on Hyde Road in Gorton. The parade at 480-odd, the row with the chippy on the end — you go in the side street and the yard's round the back. It's a builders' skip and it's going, flames higher than me. It's stood right against the back wall of the shops, that's why I've rung.",
    deflection: "Mate, I've told you — skip, back of the shops, Hyde Road. Are you sending someone or not?",
    reassurance: {
      text: "Dean, there's a crew on the way. Stay where you are at the yard entrance, and just tell me what it's doing.",
      reply: "Yeah. Alright. It's still going. Go on.",
    },
    answers: {
      f_seen: {
        text: "A big builders' skip, the yellow sort, full up — and the whole lot's alight. Flames going up six, eight foot, loads of sparks, black smoke. It's stood hard up against the back wall of the shops and the flames are going up the brickwork.",
        tone: "urgent",
      },
      f_where: {
        text: "Round the back — the service yard behind the parade. You get in off the side street. The skip's about halfway along the row, behind the third or fourth shop in, tight against the wall. There's a wooden bit under the roof edge right above it, and the guttering.",
        followUps: [
          {
            id: "f_where_units",
            text: "Which shop is it behind — is there anything above them?",
            answer: {
              text: "There's nothing above, they're single storey, the shops. It's behind the vape shop, I think, or the barber's next to it. They're all shut, it's gone eight.",
            },
          },
        ],
      },
      f_spread: {
        text: "It's not caught the building yet — not that I can see. But the flames are right up under that wooden edge and the guttering, the wall's gone black above it, and it's getting bigger, not smaller. If it's going to catch anything it's going to be that.",
        tone: "urgent",
        effect: {
          regrade: "EMERGENCY",
          basis: "Skip well alight hard against the rear wall of an occupied parade — timber soffit and plastic guttering directly above it",
        },
      },
      f_started: {
        text: "Five minutes, maybe? It was already well away when I came round the corner with the dog. I've not seen anyone about — no kids, nobody legging it.",
      },
      f_building: {
        text: "It's a row of shops — six of them, single storey, flat roofs, brick. The yard round the back's for the bins and deliveries. Chippy on the end, and that's still open. The rest are shut.",
      },
      f_inside: {
        text: "The shops are shut, all bar the chippy on the end — that's open, lights on, there's people in there. It's the far end from the skip, though. Nobody's in the yard. I'm the only one out here.",
        followUps: [
          {
            id: "f_inside_takeaway",
            text: "How far is the takeaway from the skip?",
            answer: {
              text: "Five or six shops down — the far end. Same roof, though. It's all one row, joined up.",
            },
          },
        ],
      },
      f_hurt: {
        text: "No. Nobody's hurt. There's nobody anywhere near it.",
      },
      f_vulnerable: {
        text: "Nobody's inside the shops, they're shut. The chippy's got customers but they're up the far end and they can walk out the front. Nothing like that.",
      },
      f_hazards: {
        text: "It's a builders' skip, so — God knows. Rubble, wood, plasterboard, there's an old door sticking out of it. A couple of paint tins on top, the big ones. And there's gas meters on the back wall of two of the shops — the grey boxes — one of them's only a few feet along from the skip.",
        tone: "urgent",
        followUps: [
          {
            id: "f_hazards_cylinders",
            text: "Can you see any gas bottles or cylinders in it — the tall ones, or the barbecue sort?",
            answer: {
              text: "I can't tell — it's all on fire, I'm not going any closer to look. There's stuff in there I can't make out. I wouldn't bet against it, put it that way.",
            },
          },
        ],
      },
      f_danger: {
        text: "Cars — there's two parked in the yard, one's not far off it, ten foot maybe. Big wheelie bins along the wall. Nobody being funny, no. No power lines that I can see.",
      },
      f_access: {
        text: "Off the side street — the turning by the chippy. There's a gap between the end shop and the houses, you drive through into the yard. It's narrow, one car wide, and the yard's part blocked with the cars and the bins. An engine might get in the entrance but I doubt it'll get down to the skip. There's a hydrant on the side street right by the entrance, the little yellow sign.",
        followUps: [
          {
            id: "f_access_gate",
            text: "Is there a gate on the yard entrance, and is it open?",
            answer: {
              text: "There's a gate but it's wide open, it's always open — it's rusted back against the wall, nobody ever shuts it.",
            },
          },
        ],
      },
      f_safe: {
        text: "I'm at the yard entrance, on the side street, thirty foot off it. Me and the dog. I'm not going in.",
      },
      f_stay: {
        text: "Yeah, I'll stay on. The dog's not happy but he'll cope.",
      },
      f_details: {
        text: "Dean Whittaker. I live on the side street, over the road from the yard. This is my mobile — 07700 900819.",
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "It's making a right noise now — crackling, and there's a whoosh every so often, like something's catching in the middle of it.",
        tone: "urgent",
      },
      {
        atSec: 100,
        text: "Is anybody on their way? Only it's not getting any smaller and I'm stood here on my own.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 135,
        text: "There's a lad come out the back door of the chippy to have a look — I've shouted him to get back in and shut the door. He's gone back in.",
      },
      {
        atSec: 190,
        text: "I can hear a siren — that's on Hyde Road, that's coming this way. I'll go to the corner and wave them into the side street, they'll never find the entrance otherwise.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Right. Good. Tell them it's the side street by the chippy, not the front. I'll be on the corner.",
  },
};
