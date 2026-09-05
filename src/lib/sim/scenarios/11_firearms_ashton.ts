import type { Scenario } from "../incident_types";

/**
 * Firearms incident — armed male at a terraced dwelling, Curzon Road,
 * Ashton-under-Lyne. Domestic-linked: neighbour reports a man screaming
 * at his partner, seen in the back yard with what looks like a handgun,
 * now back inside with the partner believed in the house.
 *
 * The first POLICE-LED scenario: the PDA is GMP plus one ambulance
 * staged at the RVP. Tests armed-incident doctrine — response officers
 * HOLD and contain rather than approach, ARVs take the containment,
 * cordons and a road closure seal the street, the dog and NPAS cover
 * the rear, and the DCA stages until the scene is declared safe.
 *
 * Outcomes roll per playthrough on the informant engine:
 *   ~65% — contained stand-off ending in a negotiated surrender
 *          (half of those: the weapon turns out to be an air pistol)
 *   ~35% — a shot is heard inside; the partner is revealed as a
 *          casualty and the job becomes an emergency entry + trauma
 *          conveyance under armed cover.
 *
 * Street and coordinates are real (Curzon Road OL6, north of Ashton
 * town centre); the house number is fictional by design — no real
 * address gets painted as a firearms job.
 */
export const scenario11: Scenario = {
  id: "11",
  slug: "11_firearms_ashton",
  title: "Firearms Incident — Curzon Road, Ashton-under-Lyne",
  type: "police_firearms_incident",
  patch: "Eastern",
  severity: "high",
  trigger:
    "999 from a neighbour — man screaming at his partner next door, seen in the back yard holding what looks like a handgun, now back inside",

  location: {
    address: "Curzon Road, Ashton-under-Lyne",
    postcode: "OL6 9LD",
    coords: { lat: 53.4959, lng: -2.0866 },
  },

  property: {
    class: "Two-storey Victorian terraced dwelling, mid-terrace",
    size: "~85 m² over two floors; rear yard onto a shared alley",
    materials: "Brick, timber floors, slate roof — party walls both sides",
    occupants:
      "Male (~34) armed and agitated; partner (F, ~29) believed inside; neighbouring terraces occupied both sides",
    vulnerabilities: [
      "Partner believed inside with the armed male",
      "Party-wall terraces — neighbours within feet either side",
      "Rear alley gives an unobserved escape line until contained",
    ],
    access:
      "Front door directly onto Curzon Road pavement; rear yard gate onto the back alley (runs the length of the terrace). RVP at the Curzon Road / Katherine Street junction, out of line of sight",
    knownHazards: [
      "Firearm seen — treat as live until proven otherwise",
      "Line of sight from upstairs front windows along the street",
      "Public footfall — school route and corner shop at the junction",
    ],
    firstDueStationId: "MP-TAM",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "Address carries a PNC marker from a previous domestic call (Oct 2025) — no firearms marker until tonight.",
      "Firearms incidents run under an armed policing command structure — ARVs take the containment; unarmed response officers hold the outer cordon and do NOT approach.",
      "RVP: Curzon Road / Katherine Street junction, out of line of sight of the address. Ambulance stages at the RVP until the scene is declared safe.",
      "Rear alley must be contained early — it runs the length of the terrace and exits both ends.",
    ],
  },

  methane: {
    M: "Not declared — single-address armed containment",
    E: "Curzon Road, Ashton-under-Lyne, OL6 — mid-terrace, north of the town centre",
    T: "Firearms incident, domestic-linked — armed male contained to a dwelling, partner believed inside",
    H: "Firearm seen and treated as live; line of sight along the street from upstairs; rear alley escape line",
    A: "Approach from Katherine Street to the RVP only — no marked vehicles into line of sight of the address",
    N: "One person believed at direct risk inside; neighbouring terraces to shelter in place or evacuate via rear",
    emergencyServices:
      "Police-led — ARVs, dog, NPAS overhead; one ambulance staged at RVP",
  },

  pda: [
    {
      id: "response1",
      label: "Response 1 — first on scene",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      preferredStationId: "MP-TAM",
      notes: "HOLD at the junction, eyes on the address — do not approach an armed subject",
    },
    {
      id: "response2",
      label: "Response 2 — outer cordon",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      preferredStationId: "MP-TAM",
      notes: "Outer cordon and road closure — Curzon Road sealed both ends",
    },
    {
      id: "arv1",
      label: "ARV 1 — front containment",
      service: "Police",
      requiredApplianceTypes: ["Police_ARV"],
      requiredCapabilities: ["Police_Armed"],
      notes: "Armed containment on the front elevation from hard cover",
    },
    {
      id: "arv2",
      label: "ARV 2 — rear containment",
      service: "Police",
      requiredApplianceTypes: ["Police_ARV"],
      requiredCapabilities: ["Police_Armed"],
      notes: "Armed containment on the rear alley — both exits",
    },
    {
      id: "dog",
      label: "Dog unit",
      service: "Police",
      requiredApplianceTypes: ["Police_Dog"],
      requiredCapabilities: ["Police_Dog"],
      notes: "Rear alley support — track if the subject decamps",
    },
    {
      id: "npas",
      label: "NPAS 21",
      service: "Police",
      requiredApplianceTypes: ["Police_NPAS"],
      requiredCapabilities: ["Police_Air"],
      notes: "Overhead — thermal on the rear gardens and alley",
    },
    {
      id: "dca_rvp",
      label: "Ambulance — stage at RVP",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      notes: "Stages at the RVP. Does NOT approach until the scene is declared safe",
    },
  ],

  evaluation: {
    targets: [
      { metric: "First response unit in attendance (holding, not approaching)", target: "< 8 minutes" },
      { metric: "Both ARVs in attendance", target: "< 15 minutes" },
      { metric: "Road closure + outer cordon on Curzon Road", target: "< 18 minutes" },
      { metric: "Ambulance staged at RVP before any entry", target: "staged, not committed" },
      { metric: "If a casualty is revealed: conveyed to the MTC", target: "< 30 minutes from reveal" },
    ],
    lesson:
      "Armed incidents invert the usual instinct: the first units' job is to hold, contain and seal — not to approach. Both containment faces matter (the rear alley is the escape line), the road closure protects the public before it protects the scene, and the ambulance stages at the RVP however loud the address gets. If a shot is heard, everything changes at once: entry under armed cover, trauma care, MTC conveyance — and the operator who already had the DCA staged and the road shut is minutes ahead of the one who didn't.",
  },

  informantScript: [
    {
      id: "initial",
      atSec: 3,
      text: "He's screaming at her, proper screaming — and I'm telling you, that was a gun in his hand when he was out the back.",
      tone: "critical",
    },
    {
      id: "back-inside",
      atSec: 25,
      text: "He's gone back in and slammed the door. I can still hear him through the wall.",
      tone: "urgent",
    },
    {
      id: "partner-window",
      atSec: 70,
      text: "She's just been at the upstairs window — she looked terrified, then he pulled her away.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "crowd",
      atSec: 140,
      probability: 0.7,
      text: "There's people coming out on the street now, someone's filming on their phone. Kids as well.",
      tone: "urgent",
    },
    {
      id: "slow-response",
      atSec: 240,
      delayThresholdSec: 480,
      text: "He's out the back again waving it about and screaming at the neighbours — where ARE you?",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    // --- The roll. Roughly one night in three this goes loud. ---------
    {
      id: "shot-heard",
      atSec: 300,
      probability: 0.35,
      suppressesIds: ["surrender", "air-pistol"],
      text: "That was a BANG — oh god, that was a gunshot, that was inside the house!",
      tone: "critical",
      effect: { pulseCritical: true, revealCasualty: "cas-partner" },
    },
    {
      id: "gone-quiet",
      atSec: 340,
      requiresFiredIds: ["shot-heard"],
      text: "The shouting's stopped. It's gone completely quiet in there. Completely quiet.",
      tone: "critical",
    },
    // --- The other two nights in three: contained and talked out. -----
    {
      id: "talking",
      atSec: 420,
      suppressesIds: [],
      probability: 0.9,
      text: "It's calmed down a bit — I can hear him talking now, not screaming. I think he's on the phone to someone.",
      tone: "info",
    },
    {
      // No probability, deliberately. shot-heard has already taken its
      // 35%; this is the other 65% and it has to be certain, or a share
      // of runs hear neither and the stand-off never resolves.
      id: "surrender",
      atSec: 640,
      suppressesIds: ["shot-heard"],
      text: "The front door's opening — he's got his hands on his head, he's coming out slow. The police are shouting instructions at him.",
      tone: "urgent",
    },
    {
      id: "air-pistol",
      atSec: 700,
      probability: 0.5,
      requiresFiredIds: ["surrender"],
      text: "One of the officers just told my husband — it was an air pistol. An air pistol. All of that.",
      tone: "info",
    },
    {
      id: "partner-out",
      atSec: 680,
      requiresFiredIds: ["surrender"],
      requiresAbsentCasualtyIds: ["cas-partner"],
      text: "She's come out the front — she's shaking but she's walking, an officer's got a blanket round her.",
      tone: "info",
    },
  ],

  // Top-down scene — an 80 m stretch of Curzon Road. North side is the
  // target terrace with its rear yards onto the shared alley; the RVP
  // sits off the east end at the Katherine Street junction.
  scene: {
    viewBox: { x: -40, y: -20, width: 80, height: 40 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -38, y: -14, w: 24, h: 8 }, kind: "neighbour", label: "Terrace (west)" },
      {
        shape: { x: -12, y: -14, w: 10, h: 8 },
        kind: "target",
        label: "No. 34 — target dwelling",
      },
      { shape: { x: 0, y: -14, w: 26, h: 8 }, kind: "neighbour", label: "Terrace (east)" },
      { shape: { x: -38, y: 8, w: 60, h: 8 }, kind: "neighbour", label: "Terrace (south side)" },
      { shape: { x: 30, y: -16, w: 8, h: 6 }, kind: "other", label: "Corner shop" },
    ],
    roads: [
      { shape: { x: -40, y: -2, w: 80, h: 6 }, kind: "road", label: "Curzon Road" },
      { shape: { x: -40, y: -4, w: 80, h: 2 }, kind: "pavement", label: "Pavement (north)" },
      { shape: { x: -40, y: 4, w: 80, h: 2 }, kind: "pavement", label: "Pavement (south)" },
      // Rear alley behind the north terrace — the escape line.
      { shape: { x: -40, y: -18, w: 80, h: 2 }, kind: "pavement", label: "Rear alley" },
      { shape: { x: 34, y: -20, w: 6, h: 40 }, kind: "road", label: "Katherine St" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -16, y: 1 }, kind: "car", label: "Parked cars" },
      { pos: { x: 6, y: 1 }, kind: "car" },
      { pos: { x: 20, y: 1 }, kind: "car" },
      { pos: { x: 36, y: 10 }, kind: "lamppost", label: "RVP — Katherine St jct" },
      { pos: { x: -30, y: -19 }, kind: "tree" },
    ],
    // No fire in this scenario — zero seat so the sim has nothing to grow.
    fireSeat: {
      pos: { x: -7, y: -10 },
      radiusM: 0,
      growthRateMpm: 0,
      maxRadiusM: 0,
      material: "structural",
    },
    hazards: [
      {
        id: "armed-subject",
        pos: { x: -7, y: -10 },
        kind: "structural",
        label: "Armed male contained to No. 34 — firearm treated as live",
        knownFromPri: true,
      },
      {
        id: "sightline",
        pos: { x: -7, y: -1 },
        kind: "structural",
        label: "Line of sight along Curzon Rd from the upstairs front window",
        knownFromPri: true,
      },
      {
        id: "rear-alley",
        pos: { x: -7, y: -17 },
        kind: "structural",
        label: "Rear alley uncontained — escape line runs the terrace both ways",
        knownFromPri: true,
      },
      {
        id: "crowd",
        pos: { x: 30, y: 5 },
        kind: "structural",
        label: "Crowd gathering at the shop corner — outer cordon required",
        knownFromPri: false,
        discoverAfterMinOnScene: 2,
      },
    ],
    casualties: [
      // Present only on the ~35% of nights the shot-heard beat fires —
      // revealCasualty flips her from absent to present at that moment.
      {
        id: "cas-partner",
        pos: { x: -7, y: -12 },
        severity: "critical",
        presentProbability: 0,
        discoverAfterMinBa: 0,
        label: "Partner (F, ~29) — gunshot wound, left shoulder",
        clinical: {
          vitals: {
            rr: 24,
            spo2: 92,
            hr: 118,
            bpSys: 102,
            bpDia: 64,
            gcs: 14,
            temp: 36.4,
            bm: 5.9,
          },
          ageYears: 29,
          presumedCondition:
            "Penetrating trauma, left shoulder — significant external haemorrhage, shocked",
          redFlags: ["major_haemorrhage", "hypovolaemic_shock"],
          preferredDestination: "mtc",
          // GM Pathfinder: penetrating trauma goes to MRI.
          injuryPattern: ["penetrating"],
          criticalInterventions: ["oxygen", "iv_access", "tXA", "fluids"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Front containment", face: "front", bearingDeg: 0 },
      { id: 2, label: "Sector 2 · Rear containment / alley", face: "rear", bearingDeg: 180 },
      { id: 3, label: "Sector 3 · Outer cordon / RVP", face: "right", bearingDeg: 90 },
      { id: 4, label: "Sector 4 · Evacuation (west terrace)", face: "left", bearingDeg: 270 },
    ],
  },
};
