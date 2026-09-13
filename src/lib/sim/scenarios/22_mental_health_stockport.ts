import type { Scenario } from "../incident_types";

// Scenario 22 — man on the parapet of a multi-storey, Stockport.
//
// A joint job where the fire service is in support and neither of the
// other two is really in charge of the outcome. Police lead — it is their
// negotiator and their power of detention. Ambulance stand off and wait,
// because there is nothing for them to do until there is. Fire bring
// working-at-height equipment and a safety system and otherwise stay out
// of the way.
//
// The operator's job is patience and staging: get the right people there,
// keep them back, and hold a resource on scene for as long as it takes,
// which may be hours. Sending more does not help and a visible approach
// makes it worse.
//
// HANDLED CAREFULLY. Nothing here is graphic, no method is described, and
// the informant is a car park attendant rather than the man himself. The
// job is written from the desk's side: who to send and how to hold it.
//
// FICTIONAL: everyone in it, and the car park. Stockport town centre is
// real; this multi-storey is not.

export const scenario22: Scenario = {
  id: "22",
  slug: "22_mental_health_stockport",
  title: "Concern for safety — multi-storey, Stockport",
  type: "ambulance_mental_health",
  patch: "Southern",
  severity: "high",
  trigger:
    "Male on the wrong side of the parapet on the top deck of a town-centre multi-storey. Car park attendant is talking to him from a distance. Police negotiator requested",

  location: {
    address: "Top deck, Heaton Lane multi-storey car park, Stockport",
    postcode: "SK4 1AR",
    coords: { lat: 53.4098, lng: -2.1652 },
  },

  property: {
    class: "Multi-storey car park — six decks, town centre",
    occupants:
      "Quiet — early evening, few vehicles on the upper decks. Attendant on scene and one member of the public asked to move back",
    vulnerabilities: [
      "Any visible or noisy approach can make this worse — this is a negotiation, not a rescue",
      "Deck is open to the weather and it is cold",
    ],
    access:
      "Vehicle ramp to all decks; a service stair reaches the top deck without coming into his view. Attendant has the barrier key",
    knownHazards: [
      "Working at height for any crew committed to the deck edge",
      "Public still driving up the ramp to park unless the entrance is closed",
    ],
    firstDueStationId: "MP-STK",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — public car park.",
      "Police lead. Negotiator and the power of detention are theirs; fire and ambulance are in support.",
      "Attendant holds the barrier key and can close the entrance ramp.",
    ],
  },

  methane: {
    M: "No",
    E: "Top deck, Heaton Lane multi-storey car park, Stockport, SK4 1AR",
    T: "Concern for safety — one male on the wrong side of the parapet at height",
    H: "Working at height; public still able to drive onto the decks",
    A: "Vehicle ramp to all decks; service stair reaches the top out of his view",
    N: "One — male, conscious and talking to the attendant",
    emergencyServices: "Police leading; ambulance and fire in support",
  },

  pda: [
    {
      id: "police1",
      label: "Police — first response",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      notes: "Police lead. Everything else on this attendance is in support of them",
    },
    {
      id: "police2",
      label: "Police — second unit",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      notes: "Cordon, the ramp, and keeping the public off the decks",
    },
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: [],
      preferredStationId: "G21",
      notes:
        "Working at height equipment and a safety system. Staged out of sight — an appliance arriving noisily on the deck is not help",
    },
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-STK",
      notes: "Stood off at the RVP. There is nothing for them to do until there is",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      {
        metric: "Lead service",
        target: "police mobilised first and identified as leading",
      },
      {
        metric: "Staging",
        target: "fire and ambulance staged out of sight rather than driven onto the deck",
      },
      {
        metric: "Holding",
        target: "resources held on scene — this takes as long as it takes",
      },
    ],
    lesson:
      "You are not going to solve this from the desk and neither is anybody you send. Police lead because it is their negotiator; fire bring height equipment and stay out of the way; ambulance wait for something to do. The mistakes available to control are sending too much, letting it arrive loudly, and standing units down too early. Get them there, keep them back, and hold them.",
  },

  scene: {
    viewBox: { x: -50, y: -40, width: 100, height: 80 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -30, y: -28, w: 60, h: 44 }, kind: "target", label: "Multi-storey — top deck" },
    ],
    roads: [
      { shape: { x: 30, y: -28, w: 12, h: 44 }, kind: "driveway", label: "Vehicle ramp" },
      { shape: { x: -50, y: 20, w: 100, h: 2 }, kind: "pavement" },
      { shape: { x: -50, y: 22, w: 100, h: 10 }, kind: "road", label: "Heaton Lane" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.4102, lng: -2.166 }, street: "Heaton Lane" }],
    landmarks: [
      { pos: { x: -20, y: -6 }, kind: "car" },
      { pos: { x: 6, y: -6 }, kind: "car" },
      { pos: { x: -40, y: 26 }, kind: "lamppost" },
      { pos: { x: 36, y: 26 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "height",
        pos: { x: -26, y: -26 },
        kind: "structural",
        label: "Parapet edge — working at height for anybody committed to it",
        knownFromPri: true,
      },
      {
        id: "public-ramp",
        pos: { x: 34, y: 0 },
        kind: "structural",
        label: "Public still able to drive onto the decks unless the ramp is closed",
        knownFromPri: true,
      },
      {
        id: "service-stair",
        pos: { x: 26, y: -22 },
        kind: "structural",
        label: "Service stair reaches the top deck out of his view",
        discoverAfterMinOnScene: 2,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Heaton Lane / RVP", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Vehicle ramp", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Top deck", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Service stair", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "attendant-first",
      atSec: 6,
      text: "I'm the attendant at the Heaton Lane car park. There's a lad on the top deck who's got over the wall. I'm talking to him from a good way back — he's asked me not to come any closer, so I haven't.",
      tone: "critical",
    },
    {
      id: "keep-back",
      atSec: 55,
      text: "He's still talking to me. He's said he doesn't want a load of people up here. I've moved the one other person who was up here down to the stairs.",
      tone: "urgent",
    },
    {
      id: "ramp",
      atSec: 120,
      probability: 0.85,
      text: "I can shut the entrance ramp if you want — I've got the key. There's still cars coming up to park otherwise.",
      tone: "info",
    },
    {
      id: "talking",
      atSec: 320,
      probability: 0.7,
      text: "He's still there and he's still talking. Your officer's arrived and she's stood where I was, having a word with him. It's quiet up here, which I think is the point.",
      tone: "info",
    },
    {
      id: "long-haul",
      atSec: 700,
      probability: 0.6,
      text: "Nothing's changed. They're still talking. It's been a good while now and it's getting cold up here.",
      tone: "info",
    },
  ],
  // The call as Steve has it: on his own mobile on the top deck of the
  // Heaton Lane multi-storey, forty yards back from a lad who has gone
  // over the parapet and asked him to come no closer. He is keeping his
  // voice down. He has the barrier key in his pocket and no idea what to say.
  call: {
    caller: {
      name: "Steve Ashworth",
      phone: "07700 900822",
      relation: "Car park attendant — on duty at the Heaton Lane multi-storey",
      where: "Top deck, by the service stair door, forty yards from the man",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "Police, please — I'm the attendant at Heaton Lane car park in Stockport, the multi-storey. There's a lad on the top deck who's climbed over the wall, he's on the outside of it. I'm talking to him but he's told me to stay back. I need somebody who knows what they're doing, quick — and quiet, please. No sirens.",
    deflection: "Hang on — hang on, I can't take my eyes off him. Just — just get someone here.",
    reassurance: {
      text: "Steve, you are doing exactly the right thing. Stay where you are, keep your voice down, and just tell me what you can see.",
      reply: "Yeah. Yeah, okay. He's still there. Okay.",
    },
    answers: {
      p_happening: {
        text: "There's a young lad on the top deck, he's got himself over the parapet — the wall at the edge — and he's on the outside of it, holding on to the rail behind him. I've been talking to him from where I am. He asked me not to come any nearer and I haven't.",
        tone: "critical",
        effect: { regrade: "GRADE 1", basis: "Immediate risk to life — male at height on the wrong side of the parapet" },
        followUps: [
          {
            id: "p_happening_where",
            text: "Whereabouts on the deck is he?",
            answer: {
              text: "Far corner, the Heaton Lane side — the bit that looks out over the road. I'm over by the stair door, forty-odd yards off. There's nothing between us, it's all empty bays.",
            },
          },
          {
            id: "p_happening_saying",
            text: "What is he saying to you?",
            answer: {
              text: "Not a lot. He asked me what my name was. He's asked me twice not to come any nearer, so I haven't. I'm just talking to him about nothing — the weather, the car park. I don't know what I'm supposed to say to him.",
              tone: "urgent",
            },
          },
        ],
      },
      p_ongoing: {
        text: "Yes. Right now. He's there now, I'm looking straight at him. He's not moved for a few minutes.",
        tone: "critical",
      },
      p_weapons: {
        text: "No. Nothing like that. He's got both hands on the rail behind him, that's all. There's nothing in his hands.",
      },
      p_injured: {
        text: "No — nobody's hurt. He's not hurt, he's just — he's where he is. I just don't want him to be.",
        tone: "urgent",
      },
      p_who: {
        text: "Just him, on his own. One lad. There was a woman going to her car when I got up here and I've asked her to go down the stairs, and she has. So it's just me and him on the deck.",
        followUps: [
          {
            id: "p_who_public",
            text: "Can anyone else get up there?",
            answer: {
              text: "Cars can still come up the ramp — it's a public car park, the entrance is open. Nobody's come up in the last few minutes but it's early evening, people do.",
              tone: "urgent",
            },
          },
        ],
      },
      p_description: {
        text: "Young lad — twenties, I'd say. White, short dark hair. Dark jacket, a navy one, jeans and trainers. No coat, and it's freezing up here.",
        needsCalm: true,
      },
      p_direction: {
        text: "He's not going anywhere. He's stood where he is. There's a grey Corsa parked up near him on its own — that might be his, it wasn't there an hour ago.",
      },
      p_drink: {
        text: "I couldn't say. He's not slurring, he's not falling about. He sounds — tired, more than anything. Flat. Not drunk, I don't think.",
        needsCalm: true,
      },
      p_known: {
        text: "No. Never seen him before. He said his name's Danny when I asked — that's all he's told me about himself.",
      },
      p_vulnerable: {
        text: "He is. That's why I'm ringing you. He's on the wrong side of a wall six floors up and he's on his own. Nobody else is at risk that I can see.",
        tone: "urgent",
      },
      p_where: {
        text: "Heaton Lane multi-storey, Stockport, the one by the viaduct — SK4 1AR. Top deck, that's level six. Come in off Heaton Lane. There's a service stair at the back that comes out on the deck without him seeing it — it's the door I'm stood at.",
      },
      p_safe: {
        text: "I'm fine. I'm well back, by the stair door. I'm nowhere near the edge and I'm not going near it — he asked me not to and I won't.",
      },
      p_seen: {
        text: "I'm looking at him now. I saw him on the camera in the office first, going over the wall, and I came straight up. That's five minutes ago, maybe ten — I tried talking him back over myself first, then I rang you.",
      },
      p_details: {
        text: "Steve Ashworth. I'm the attendant here, I'm on till ten. This is my own mobile — 07700 900822.",
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "Hold on — he's moved. No — no, he's alright, he's just shifted his hands. God. Sorry. He's still there.",
        tone: "critical",
        effect: { state: "panicking" },
      },
      {
        atSec: 110,
        text: "A car's just come up the ramp — I've waved them back down, they've gone. He noticed. He's looking over at me now. I'm keeping my voice right down.",
        tone: "urgent",
      },
      {
        atSec: 170,
        text: "I can hear a siren, down on the road. He's heard it too, he's gone quiet. Can you tell them — no sirens, please. Not up here.",
        tone: "urgent",
        requiresOpened: true,
      },
      {
        atSec: 210,
        text: "How long are they going to be? I'm on my own up here with him and I don't know what I'm doing. I'm just talking.",
        tone: "urgent",
        requiresOpened: false,
      },
    ],
    onDispatch: "Thank you. Tell them quiet, yeah? He doesn't want a crowd. Send them up the back stairs. I'll stay with him.",
  },
};
