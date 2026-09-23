import type { Scenario } from "../incident_types";

// Scenario 09 — Water rescue, person in the River Irwell at the Lowry
// footbridge. Converted from the approved brief at
// data/research/fire/scenarios/09_water_rescue_river_irwell.md. Water
// rescues are time-critical and bystander management is half the job —
// the weir at Mode Wheel is ~12 minutes downstream in moderate flow.

export const scenario09: Scenario = {
  id: "09",
  slug: "09_water_rescue_river_irwell",
  title: "Person in Water — River Irwell, Lowry Footbridge",
  type: "special_service_water_rescue",
  patch: "Western",
  severity: "high",
  trigger:
    "999 from a bystander on the Lowry footbridge — adult male in the water, struggling, drifting downstream toward the locks",

  location: {
    address: "River Irwell at the Lowry footbridge, Salford Quays",
    postcode: "M50 3AH",
    coords: { lat: 53.475, lng: -2.299 },
  },

  property: {
    class: "Open water — River Irwell / Manchester Ship Canal reach at Salford Quays",
    size: "River ~40 m wide at the footbridge; casualty ~30 m out, drifting",
    materials: "Cold water (~8 °C), urban river debris, CSO discharge contamination",
    occupants: "1 adult male in the water; bystanders gathering on the bridge and both quaysides",
    vulnerabilities: [
      "Cold-water shock — the survivable window is minutes, not hours",
      "Mode Wheel Locks weir ~400 m downstream — strong recovery hazard",
      "Well-meaning bystanders may enter the water and become casualty two",
    ],
    access:
      "Quayside walkways both sides; vehicles reach the Imperial War Museum side first; bank constrained in places by railings and moorings",
    knownHazards: [
      "Cold water (~8 °C April) — cold shock and rapid incapacitation",
      "Weir at Mode Wheel Locks 400 m downstream",
      "Debris and contaminated water (CSO discharge)",
      "Tidal influence near the Ship Canal",
    ],
    firstDueStationId: "G61",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "Local intel: the Irwell at the Lowry is a known crisis location — mental-health response matters as much as the rescue; GMP attend for that reason, not just the cordon.",
      "Salford Quays water carries cold-shock risk year-round, not just in winter.",
      "Downstream weir at Mode Wheel Locks ~400 m — in moderate flow a drifting casualty reaches it in ~12 minutes.",
      "Throwline boards mounted on the quayside railings either side of the footbridge.",
    ],
  },

  methane: {
    M: "No",
    E: "River Irwell at the Lowry footbridge, Salford Quays M50",
    T: "Person in water — adult male, struggling, ~30 m from the bridge, drifting downstream",
    H: "Cold-water shock, current toward the weir 400 m downstream, debris in the water",
    A: "Quayside both sides; vehicles reach the Imperial War Museum side first",
    N: "1 in the water; bystanders shouting from the bridge",
    emergencyServices:
      "Fire (water rescue), NWAS with HART for the cold-water casualty, GMP for cordon + mental-health support",
  },

  pda: [
    {
      id: "wiu",
      label: "Water Incident Unit",
      service: "Fire",
      requiredApplianceTypes: ["WIU"],
      requiredCapabilities: ["WaterRescue"],
      preferredStationId: "G61",
      notes: "Primary water-rescue team + boat — Eccles carries the patch's WIU",
    },
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G61",
      notes: "Bank rescue — throwlines from the IWM side, eyes on the casualty",
    },
    {
      id: "pump2",
      label: "Pump 2",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G58",
      notes: "Second bank — Lowry side, downstream intercept point before the weir",
    },
    {
      id: "tru",
      label: "Technical Rescue (R57)",
      service: "Fire",
      requiredApplianceTypes: ["TRU_pump"],
      requiredCapabilities: ["WaterRescue"],
      preferredStationId: "G57",
      notes: "Water-rescue trained crew — shore safety and downstream backstop",
    },
    {
      id: "hart",
      label: "NWAS HART",
      service: "Ambulance",
      requiredApplianceTypes: ["HART_vehicle"],
      requiredCapabilities: ["HART"],
      notes: "Cold-water casualty management — rapid rewarming protocol",
    },
    {
      id: "nwas_dca",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      notes: "Conveyance once the casualty is out and through HART's hands",
    },
    {
      id: "police",
      label: "Police",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      notes: "Bystander control on the bridge + mental-health trained officer requested",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Water Incident Unit on scene", target: "< 12 minutes for a survivable rescue" },
      { metric: "Casualty recovered", target: "before the Mode Wheel weir" },
      { metric: "Bystander control", target: "nobody else enters the water" },
      { metric: "Cold-water care", target: "HART involved; rewarming started on the bank" },
    ],
    lesson:
      "Water rescues are time-critical and bystander management is half the job. The clock is the drift toward the weir, not the incident timer — get the downstream backstop set before the boat launches. And the second casualty you should be planning against is the well-meaning member of the public taking their coat off on the quayside.",
  },

  // Schematic — 160m × 90m. The Irwell runs east-west; Lowry footbridge
  // crosses mid-scene; IWM side south (vehicle access first), Lowry north.
  scene: {
    viewBox: { x: -80, y: -45, width: 160, height: 90 },
    compassNorth: "up",
    // Moderate flow, westward towards Mode Wheel: 400 m in about twelve
    // minutes. The Water Incident Unit reaches the edge, launches in a
    // minute and a half, and the boat does three metres a second; a
    // casualty within fifteen metres of the quay gets a throwline instead.
    water: {
      driftMps: 0.55,
      driftBearingDeg: 270,
      weirDistanceM: 400,
      weirLabel: "Mode Wheel Locks weir",
      launchSec: 90,
      boatMps: 3,
      bankRescueRangeM: 15,
    },
    // Bank to the vehicle, over railings and moorings.
    egressExtraSeconds: 180,
    buildings: [
      { shape: { x: -74, y: -42, w: 34, h: 18 }, kind: "neighbour", label: "The Lowry" },
      { shape: { x: 30, y: 26, w: 40, h: 16 }, kind: "neighbour", label: "Imperial War Museum North" },
      // The footbridge — spans the river mid-scene
      { shape: { x: -2, y: -14, w: 5, h: 30 }, kind: "other", label: "Lowry footbridge" },
    ],
    roads: [
      // North quayside (Lowry side)
      { shape: { x: -80, y: -22, w: 160, h: 8 }, kind: "pavement", label: "Quayside — Lowry side" },
      // The river
      { shape: { x: -80, y: -14, w: 160, h: 30 }, kind: "water", label: "River Irwell" },
      // South quayside (IWM side)
      { shape: { x: -80, y: 16, w: 160, h: 8 }, kind: "pavement", label: "Quayside — IWM side" },
      // Vehicle access on the IWM side
      { shape: { x: -80, y: 26, w: 100, h: 10 }, kind: "driveway", label: "Trafford Wharf Road access" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -10, y: -2 }, kind: "other", label: "CASUALTY — drifting west" },
      { pos: { x: 0, y: -18 }, kind: "other", label: "Bystanders on bridge" },
      { pos: { x: 24, y: -18 }, kind: "other", label: "Throwline board" },
      { pos: { x: -30, y: 19 }, kind: "other", label: "Throwline board" },
      { pos: { x: -70, y: 0 }, kind: "other", label: "→ Mode Wheel weir 400 m" },
      { pos: { x: 46, y: -18 }, kind: "other", label: "Moorings" },
      { pos: { x: -40, y: 30 }, kind: "car" },
      { pos: { x: -48, y: 30 }, kind: "car" },
      { pos: { x: 8, y: -20 }, kind: "lamppost" },
      { pos: { x: -36, y: 19 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "weir-downstream",
        pos: { x: -74, y: -6 },
        kind: "structural",
        label: "Mode Wheel Locks weir 400 m downstream — ~12 min drift in moderate flow",
        knownFromPri: true,
      },
      {
        id: "cold-water",
        pos: { x: 14, y: -4 },
        kind: "structural",
        label: "Cold water ~8 °C — cold shock; survivable window is minutes",
        knownFromPri: true,
      },
      {
        id: "cso-contamination",
        pos: { x: 40, y: 6 },
        kind: "chemical",
        label: "CSO discharge — contaminated water; PPE + post-immersion decon",
        knownFromPri: true,
      },
      {
        id: "debris",
        pos: { x: -44, y: 2 },
        kind: "structural",
        label: "Submerged debris — snag risk for swimmers and the boat",
        discoverAfterMinOnScene: 2,
      },
    ],
    casualties: [
      {
        id: "cas-water",
        pos: { x: -10, y: -2 },
        inWater: true,
        severity: "critical",
        discoverAfterMinBa: 0,
        label: "Adult male (~30s) — in the water, cold shock, drifting toward the weir",
        clinical: {
          vitals: {
            rr: 28, spo2: 90, hr: 128, bpSys: 112, bpDia: 74,
            gcs: 13, temp: 33.4, bm: 5.2,
          },
          ageYears: 33,
          presumedCondition:
            "Cold-water immersion — cold shock, early hypothermia, aspiration risk; crisis presentation",
          redFlags: ["airway_compromise"],
          preferredDestination: "nearest_a_e",
          criticalInterventions: [
            // 33.4degC. Everything else on this list matters less than
            // getting her dry, wrapped and into a warm saloon.
            "warming","oxygen", "iv_access"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · IWM bank (access)", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Downstream / weir", face: "left", bearingDeg: 270 },
      { id: 3, label: "Sector 3 · Lowry bank", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Upstream", face: "right", bearingDeg: 90 },
    ],
  },

  informantScript: [
    {
      id: "bystander-first",
      atSec: 4,
      text: "He's in the middle of the river, he's splashing about — he went in off the bridge I think. He's shouting but I can't make out what he's saying.",
      tone: "critical",
    },
    {
      id: "drifting",
      atSec: 45,
      text: "The current's taking him — he's past the bridge now, moving toward the big locks down the way. He's not making any ground toward the side.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "bystander-coat",
      atSec: 90,
      probability: 0.5,
      text: "There's a lad here taking his coat and shoes off, he says he's going in after him — I'm telling him not to but he's not listening to me!",
      tone: "urgent",
      effect: { pulseCritical: true },
    },
    {
      id: "going-quiet",
      atSec: 150,
      delayThresholdSec: 300,
      probability: 0.5,
      text: "He's gone quiet — he's stopped splashing. He's face up but his arms have stopped moving, he's just floating with the current now.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "throwline-short",
      atSec: 200,
      probability: 0.4,
      text: "Someone's got the throwline off the railing and had a go — it landed short, he's too far out. He's maybe forty metres from the bridge now.",
      tone: "urgent",
    },
    {
      id: "nearing-weir",
      atSec: 420,
      delayThresholdSec: 600,
      probability: 0.7,
      text: "You can hear the weir from where he is now — he's two hundred metres off it maybe. Please tell me the boat's close.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  // The call as Rachel has it: on her mobile, back at the rail of the
  // footbridge she had just walked off, watching a man she has never met
  // go under and come up again thirty metres out. The bank is fire-shaped;
  // she answers it about the river, because that is what she has got.
  call: {
    caller: {
      name: "Rachel Holden",
      phone: "07700 900356",
      relation: "Bystander on the Lowry footbridge — eyes on him",
      where: "The Lowry footbridge, IWM end, at the downstream rail",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "There's a man in the river — in the Irwell, at the Lowry, the footbridge at Salford Quays. He's in the water, he's right out in the middle, he's going under. Please, you need to get someone here now, he can't get out.",
    deflection: "I don't know, I don't know — he's in the water, just get someone here!",
    reassurance: {
      text: "Rachel, listen to me. The boat's on its way. Keep your eyes on him and keep talking to me — you're his eyes until they get there.",
      reply: "Okay. Okay. I've got him. I've still got him.",
    },
    answers: {
      f_seen: {
        text: "A man in the water, right out in the middle of the river. He's splashing, he's shouting, and he keeps going under and coming back up. He's fully dressed, he's got a jacket on. He's about thirty metres off the bridge.",
        tone: "critical",
      },
      f_where: {
        text: "There's no building — it's the river, the Irwell, at the Lowry footbridge. He's out towards the middle, just off the bridge on the downstream side, the Lowry side of the water. The water's taking him along, away from the bridge.",
        tone: "urgent",
      },
      f_spread: {
        text: "He's getting further from the bridge. The water's moving, it's taking him along with it — that way, west, towards the locks end. He's still fighting it, his arms are still going.",
        tone: "urgent",
      },
      f_started: {
        text: "Two minutes? Three? I'd walked off the bridge to my car and I heard the splash and the shouting and I've come straight back. Two minutes, no more.",
      },
      f_building: {
        text: "It's the river — the Irwell, at the Quays, the footbridge between the Lowry and the war museum. It's wide here, forty metres or so, and it's deep, it's the ship canal really. The sides are all sheer, there's nothing to grab hold of.",
      },
      f_inside: {
        text: "It's just him in the water. One man. There's people on the bridge with me and there's some lads on the Lowry side by the railing, but nobody else is in. Just him.",
        tone: "urgent",
        followUps: [
          {
            id: "f_inside_who",
            text: "Do you know who he is? Did you see him go in?",
            answer: {
              text: "No, I don't know him. I didn't see him go — I heard it. Someone on the bridge said he climbed over the rail. He's a man, thirties maybe, dark hair, that's all I can tell you from here.",
            },
          },
          {
            id: "f_inside_swimming",
            text: "Is he swimming, or just trying to stay up?",
            answer: {
              text: "He's trying. He's thrashing, his arms are going, and he keeps going under. He's shouting something but I can't hear what.",
              tone: "urgent",
            },
          },
        ],
      },
      f_hurt: {
        text: "I don't know — I can't see any blood or anything. He's in the water, he's freezing, that's what's hurting him. He's gasping, you can hear him gasping from up here.",
        tone: "urgent",
        needsCalm: true,
      },
      f_vulnerable: {
        text: "It's a grown man, he's not a kid. But he can't get himself out, that's the point, he can't get to the side. The walls are sheer, there's no steps, there's nothing.",
        needsCalm: true,
      },
      f_hazards: {
        text: "No — nothing like that, it's the river. The water's freezing though, it's April, it's bitter. And there's the big locks further down, Mode Wheel — the water goes over there. That's what I'm scared of.",
      },
      f_danger: {
        text: "There's people crowding on the bridge, and there's a group of lads on the Lowry side right up against the railing — one of them's leaning right over. I've shouted at them to stay back. The water's filthy as well, it's brown.",
        tone: "urgent",
      },
      f_access: {
        text: "The war museum side — Trafford Wharf Road, you can drive right down to the quayside, my car's parked down there. The Lowry side you get to along the walkway from the Lowry car park but I don't know if you'd get a vehicle down it. There's railings all along both sides.",
      },
      f_safe: {
        text: "Yes, I'm on the bridge, I'm holding the rail. I'm not going anywhere near the water, I can't swim. I'm not going in.",
      },
      f_stay: {
        text: "Yes. Yes, I'll stay, I've got my eyes on him. I'm not taking my eyes off him.",
      },
      f_details: {
        text: "Rachel Holden. This is my mobile — 07700 900356.",
      },
    },
    interjections: [
      {
        atSec: 40,
        text: "He's gone under — he's gone under again — no, no, he's up, he's up. Oh God. He was under for ages that time.",
        tone: "critical",
        effect: { state: "panicking" },
      },
      {
        atSec: 110,
        text: "Are they coming? Is there a boat coming? He can't keep this up, he's going to — please, is someone coming?",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 170,
        text: "I can hear a siren — over the museum side, there's a siren. Is that them? Tell them he's past the bridge, downstream, they need to come along the bank.",
        tone: "urgent",
        requiresOpened: true,
      },
      {
        atSec: 230,
        text: "I'm coming off the bridge — I'm going along the quayside on the museum side, keeping level with him. I've still got him. I've still got him.",
        tone: "urgent",
      },
    ],
    onDispatch: "Thank you. Please tell them to hurry — he's further away every time I look.",
  },
};
