import type { Scenario } from "../incident_types";

// Scenario 26 — flooding of homes, Littleborough.
//
// No fire, no casualty, no clock — and an incident that will run all
// shift and eat every pump you give it. Flooding is the job that breaks
// an operator's instinct to resolve things, because there is nothing to
// resolve: the water goes down when the rain stops.
//
// So the decisions are triage and endurance. Which properties get a pump
// and which get told to go upstairs. Whether to commit the high-volume
// pump, which is a force asset that then is not available anywhere else
// for hours. When to stop pumping out a cellar that is refilling from the
// ground faster than you can empty it.
//
// The right answer is often to do less than the callers want, which is a
// hard thing to hold on the phone.
//
// FICTIONAL: the households and the numbers. Littleborough and the
// Rochdale Canal are real; these properties are not.

export const scenario26: Scenario = {
  id: "26",
  slug: "26_flooding_littleborough",
  title: "Flooding — homes on Canal Street, Littleborough",
  type: "special_service_flooding",
  patch: "Eastern",
  severity: "high",
  trigger:
    "Water entering ground floors of a terrace after prolonged rain. Multiple callers. One elderly resident refusing to leave",

  location: {
    address: "Canal Street, Littleborough, Rochdale",
    postcode: "OL15 8AA",
    coords: { lat: 53.6449, lng: -2.0968 },
  },

  property: {
    class: "Terraced housing beside a watercourse — around fourteen properties affected",
    occupants:
      "Occupied. Most residents upstairs or out with family. One elderly resident at no. 9 will not leave",
    vulnerabilities: [
      "Elderly resident refusing to leave a property with water in the ground floor",
      "Cellars filling from the ground — pumping them out achieves nothing while the level is up",
      "Electricity still on in several properties with water at socket height",
    ],
    access:
      "Canal Street from the main road, but the far end is impassable to an appliance. Approach from the north end only",
    knownHazards: [
      "Standing water of unknown depth over unknown ground — covers, kerbs, a culvert",
      "Live electrics at socket height",
      "Contaminated water — foul drainage surcharging",
    ],
    firstDueStationId: "G31",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — residential street.",
      "Known flood-risk street; has flooded twice in the last decade per the local knowledge file.",
      "High-volume pump is a force asset. Committing it here means it is not available anywhere else for the rest of the shift.",
    ],
  },

  methane: {
    M: "No",
    E: "Canal Street, Littleborough, OL15 8AA",
    T: "Flooding — water entering ground floors of around fourteen terraced properties",
    H: "Standing water over unknown ground; live electrics; contaminated water",
    A: "North end of Canal Street only — the far end is impassable",
    N: "None injured. One elderly resident refusing to leave no. 9",
    emergencyServices: "Fire; local authority and the water company both have an interest",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: [],
      preferredStationId: "G31",
      notes: "First pump — assessment and the resident at no. 9 before any pumping starts",
    },
    {
      id: "pump2",
      label: "Pump 2",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: [],
      notes: "Light portable pumps and the door-to-door. Fourteen properties is a lot of doors",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "First attendance", target: "< 12 minutes" },
      {
        metric: "Triage",
        target: "life risk at no. 9 addressed before any property is pumped",
      },
      {
        metric: "Force assets",
        target: "high-volume pump committed only if it will change the outcome",
      },
    ],
    lesson:
      "There is nothing here to put out and nothing that ends because you did something well. The water goes down when the rain stops. Your decisions are triage — the resident who will not leave comes before anybody's carpet — and endurance, because a high-volume pump committed here is a force asset that is not available anywhere else tonight. Doing less than the callers want is often the right answer, and it is a hard one to hold on the phone.",
  },

  scene: {
    viewBox: { x: -70, y: -40, width: 140, height: 80 },
    compassNorth: "up",
    // Wading out over ground nobody can see.
    egressExtraSeconds: 240,
    // What this building will not take. Prose above; a locked option
    // with its reason on it here.
    egressBlocked: [
      { action: "trolley", reason: "Standing water of unknown depth over unknown ground — nothing on wheels goes down Canal Street" },
      { action: "wheelchair", reason: "Standing water over kerbs, covers and a culvert. Wheels find the hole first" },
    ],
    buildings: [
      { shape: { x: -60, y: -28, w: 18, h: 20 }, kind: "neighbour", label: "1–5" },
      { shape: { x: -40, y: -28, w: 18, h: 20 }, kind: "neighbour", label: "7" },
      { shape: { x: -20, y: -28, w: 18, h: 20 }, kind: "target", label: "9 — resident refusing" },
      { shape: { x: 0, y: -28, w: 18, h: 20 }, kind: "neighbour", label: "11–15" },
      { shape: { x: 20, y: -28, w: 18, h: 20 }, kind: "neighbour", label: "17–21" },
      { shape: { x: 40, y: -28, w: 18, h: 20 }, kind: "neighbour", label: "23–27" },
    ],
    roads: [
      { shape: { x: -70, y: -6, w: 140, h: 12 }, kind: "road", label: "Canal Street — flooded" },
      { shape: { x: -70, y: 8, w: 140, h: 10 }, kind: "driveway", label: "Watercourse" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.6455, lng: -2.0978 }, street: "Canal Street north" }],
    landmarks: [
      { pos: { x: -52, y: 0 }, kind: "car" },
      { pos: { x: 8, y: 0 }, kind: "car" },
      { pos: { x: -64, y: 12 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "unknown-depth",
        pos: { x: 10, y: 0 },
        kind: "structural",
        label: "Standing water of unknown depth — covers, kerbs and a culvert beneath",
        knownFromPri: true,
      },
      {
        id: "live-electrics",
        pos: { x: -18, y: -20 },
        kind: "electrical",
        label: "Electricity still on with water at socket height",
        knownFromPri: true,
      },
      {
        id: "foul-water",
        pos: { x: 30, y: 0 },
        kind: "chemical",
        label: "Foul drainage surcharging — contaminated water",
        discoverAfterMinOnScene: 3,
      },
      {
        id: "far-end",
        pos: { x: 56, y: 0 },
        kind: "structural",
        label: "Far end of the street impassable to an appliance",
        knownFromPri: true,
      },
    ],
    casualties: [
      {
        id: "cas-26-no9",
        label: "Elderly resident, no. 9 — refusing to leave",
        pos: { x: -13, y: -18 },
        severity: "walking",
        discoverAfterMinBa: 0,
        clinical: {
          // Not injured. Cold, stubborn, and standing in water — which is
          // a life risk rather than a clinical one, and the reason he
          // comes before anybody's carpet.
          vitals: { rr: 18, spo2: 96, hr: 88, bpSys: 138, bpDia: 82, gcs: 15, temp: 35.1, bm: 5.4 },
          ageYears: 79,
          presumedCondition: "Cold and immersed to the ankles — refusing to leave the property",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          // Once he does come out, this is the whole of his treatment.
          criticalInterventions: ["warming"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · North end / access", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Far end", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Watercourse", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Terrace frontage", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "resident-first",
      atSec: 6,
      text: "The water's coming in the front door. It's up over the step and it's across the whole street — you can't tell where the kerb is any more. There's about a dozen houses of us down here.",
      tone: "urgent",
    },
    {
      id: "no9",
      atSec: 60,
      text: "The old chap at number nine won't come out. He's stood in his hallway with water round his ankles saying he's not leaving the house. He's on his own.",
      tone: "critical",
    },
    {
      id: "electrics",
      atSec: 140,
      probability: 0.8,
      text: "Somebody's said their sockets are under. Nobody's turned the electric off — I wouldn't know how to get at the box with water in there.",
      tone: "urgent",
    },
    {
      id: "cellar",
      atSec: 320,
      probability: 0.7,
      text: "They're asking if you'll pump their cellars out. I've told them yours are busy but they keep asking. It's filling back up as fast as it goes down anyway from what I can see.",
      tone: "info",
    },
    {
      id: "still-raining",
      atSec: 600,
      probability: 0.75,
      text: "It's still hammering down. It's not going anywhere while this keeps up.",
      tone: "info",
    },
  ],
  // The call as Sandra has it: on her mobile on the front step of no. 11,
  // water over her slippers and the whole of Canal Street a brown river.
  // She has been in to Frank at nine once already. She wants pumps and she
  // wants them now, and she is going to be told there are two.
  call: {
    caller: {
      name: "Sandra Kershaw",
      phone: "07700 900826",
      relation: "Resident at no. 11 — two doors from the gentleman at no. 9",
      where: "Her front step at 11 Canal Street, in and out of no. 9",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "Fire brigade — it's Canal Street in Littleborough, the water's coming in. It's in the house, it's over the front step and it's the whole street, every house, you can't see the road. It's been raining since dinner time and the brook's come over. There's about a dozen of us down here with it in. And there's an old chap at number nine who won't come out.",
    deflection: "Are you sending pumps or not? It's in the house. It's in all of ours.",
    reassurance: {
      text: "Sandra, they are coming. The first thing they'll do is the gentleman at number nine, and then they'll come round every door. Tell me about the water.",
      reply: "…Alright. Alright. As long as somebody's coming.",
    },
    answers: {
      f_seen: {
        text: "Water. Brown water, right across the road, kerb to kerb — you can't tell where the road stops and the pavement starts. It's coming under my front door and it's coming up through the floor from the cellar. It's over the step, four inches in the hall.",
        tone: "urgent",
      },
      f_where: {
        text: "Ground floor — the hall and the front room. The cellar's full, I've not been down. It's the same all along the row. The far end's worse, it's deeper down there, it's up to the window sills at twenty-odd.",
      },
      f_spread: {
        text: "It's coming up. Half an hour ago it was in the road, now it's in the houses. It's still hammering down. It's not going anywhere.",
        tone: "urgent",
      },
      f_started: {
        text: "It's been raining since dinner. The brook came over the road about an hour ago and it's been in the house twenty minutes. It's done this before — twice — but never this quick.",
      },
      f_building: {
        text: "Terraced houses — old stone ones, two up two down, cellars under all of them. Fourteen on this side, facing the brook across the road. There's nothing on the other side but the water.",
      },
      f_inside: {
        text: "Everyone's in, more or less. Most have gone upstairs, a couple have gone to family. But Frank at nine won't leave — he's seventy-nine, he's on his own, and he's told me he's stopping put. I've been in and tried. He's downstairs in it.",
        tone: "urgent",
        effect: { regrade: "EMERGENCY", basis: "Elderly resident refusing to leave a flooded ground floor — life risk before property" },
        followUps: [
          {
            id: "f_inside_frank",
            text: "Is he alright in himself — is he ill, or hurt?",
            answer: {
              text: "He's not ill, he's stubborn. He's cold, though — he's been stood in it in his slippers and he's shivering, and his heating's off because it's under. He's not confused, he knows what he's doing. He just won't do it.",
              tone: "urgent",
            },
          },
          {
            id: "f_inside_count",
            text: "How many of the houses have people in?",
            answer: {
              text: "Fourteen houses. I'd say ten have got somebody in, upstairs. Two have gone to family, I saw them go. Then there's Frank. And the young family at three with the baby, they're upstairs.",
            },
          },
        ],
      },
      f_hurt: {
        text: "No, nobody's hurt. Nobody's fallen or anything. It's cold and it's filthy, that's all. Frank's the only one I'm worried about.",
      },
      f_vulnerable: {
        text: "Frank at nine — seventy-nine, on his own, and he won't come out. There's a baby at number three, they've gone upstairs. Nobody in a wheelchair that I know of on this row.",
      },
      f_hazards: {
        text: "The electric's still on in ours, the lights are on. I've not been near the box. I'd guess it's the same in most of them. No gas bottles or anything, we're all on mains.",
        tone: "urgent",
      },
      f_danger: {
        text: "The water — you can't see what's under it. There's a grid in the road outside seven and the culvert goes under the street by twenty, you'd not know where. The far end's deep, a car got stuck earlier and had to be pushed out. Come in from the top, off the main road.",
      },
      f_access: {
        text: "Come in from the main road end, the top of the street — the bottom end's under, you'll not get a wagon through, it's up to the sills. My door's open, I'm number eleven. Frank's is nine, two down, his door's on the latch — I left it. You'll be wading from about number five.",
      },
      f_safe: {
        text: "I'm on my step. It's over my slippers, that's all. I'm alright. I want to go back in to Frank in a minute.",
      },
      f_stay: {
        text: "I can for a bit. I keep wanting to go and check on him.",
      },
      f_details: {
        text: "Sandra Kershaw, eleven Canal Street. This is my mobile — 07700 900826.",
      },
    },
    interjections: [
      {
        atSec: 50,
        text: "It's coming faster now. I can see it moving down the street — there's a current on it, it's pulling at the wheelie bins.",
        tone: "urgent",
      },
      {
        atSec: 130,
        text: "Karen at seventeen's on the phone to you as well, she says — she's got it in her kitchen. I've said I'm already through. Are you sending more than one?",
      },
      {
        atSec: 190,
        text: "I can see blue lights at the top of the street. That's you, is it? Tell them number nine first. Frank first, before anybody's carpet.",
        requiresOpened: true,
      },
      {
        atSec: 230,
        text: "Is anybody actually coming? It's in all of ours and it's still coming. We're not asking for much. Just somebody.",
        tone: "urgent",
        requiresOpened: false,
      },
    ],
    onDispatch: "Right. Thank you. Number nine first — tell them. I'll go and sit with Frank till they get here.",
  },
};
