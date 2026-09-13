import type { Scenario } from "../incident_types";

/**
 * Cardiac arrest — Sunday league footballer, Hough End playing fields,
 * Chorlton. Witnessed, non-contact collapse of a 23-year-old mid-match;
 * teammates start telephone-guided CPR from the moment he drops.
 *
 * The first AMBULANCE-LED scenario. No fire, no crime — the whole job is
 * the chain of survival, and the operator IS the clock:
 *   - a Category 1 response where the first defib on the chest is all
 *     that matters (RRV first past the post),
 *   - a working arrest that eats resources (two DCAs, critical care,
 *     a duty officer — over-mobilising is the correct answer),
 *   - the classic playing-fields access problem (pitch 11 is ~450 m of
 *     grass from the nearest hard standing — the carry has to be
 *     planned before it's needed, and pitch 12 makes a HEMS LZ),
 *   - skill-weighted outcome: the dice colour the story (community
 *     defib found or not, shockable rhythm or not) but survival runs on
 *     the vitals engine — fast crews + CPR + defib usually get ROSC,
 *     slow play usually doesn't. Post-ROSC conveyance is scored to the
 *     PCI centre, not the nearest A&E.
 *
 * Venue is real (Hough End, Manchester's biggest Sunday league site;
 * the Hough End Centre pavilion fronts Mauldeth Road West). Incident
 * coords are OSM-verified: a mapped grass soccer pitch at the centre of
 * the fields (OSM way 616654223), ~450 m SE of the Hough End Centre car
 * park entrance (junction node 3005535518 at 53.43854, -2.25603). The
 * patient is fictional.
 */
export const scenario12: Scenario = {
  id: "12",
  slug: "12_cardiac_arrest_hough_end",
  title: "Cardiac Arrest — Hough End Playing Fields, Chorlton",
  type: "ambulance_cardiac_arrest",
  patch: "Southern",
  severity: "high",
  trigger:
    "999 from a football coach — player collapsed mid-match with nobody near him, unresponsive, not breathing normally; telephone CPR in progress",

  location: {
    address: "Hough End Playing Fields, Mauldeth Road West, Chorlton-cum-Hardy",
    postcode: "M21 7SX",
    coords: { lat: 53.43622, lng: -2.25033 },
  },

  property: {
    class: "Public playing fields — ~25 grass football pitches either side of a central spine path",
    size: "~50 ha of open grass between Mauldeth Road West and Princess Road (A5103)",
    materials:
      "Open grass; one modern pavilion (the Hough End Centre — changing rooms, café, foyer) on the Mauldeth Road West frontage",
    occupants:
      "Sunday morning fixtures in progress across multiple pitches — two full squads plus spectators at the patient's pitch, families among them",
    vulnerabilities: [
      "Patient is 23 — witnessed, non-contact collapse points at a primary cardiac cause",
      "Pitch 11 is ~450 m of soft ground from the nearest hard standing",
      "Crowd around the patient — teammates, opposition, and family on site",
    ],
    access:
      "Vehicle access via the Hough End Centre car park off Mauldeth Road West; beyond the gate the spine path is foot / 4x4 only. Caller is sending players to marshal the gate",
    knownHazards: [
      "Soft ground after rain — conveying DCA stays on hard standing, kit goes forward by hand",
      "Match-day crowds on every surrounding pitch",
      "Pitch 12 is the candidate HEMS LZ — must be cleared of players before the aircraft commits",
    ],
    firstDueStationId: "A-STP",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "Hough End is Manchester's biggest Sunday league venue — match days put two dozen fixtures on at once. Expect the access gate marshalled by players waving you in.",
      "Community defib (PAD) on the wall of the Hough End Centre foyer, registered on The Circuit — the call handler will direct a runner to it.",
      "NWAA task the Barton crew to young / witnessed arrests — same doctor-paramedic team by air (Helimed) or road (critical care car).",
      "Category 1 call — 7-minute mean standard. Every minute from collapse to defibrillation costs roughly 10% survival.",
    ],
  },

  methane: {
    M: "Not declared — single-patient medical emergency",
    E: "Hough End playing fields, Mauldeth Road West, Chorlton, M21 — pitch 11, mid-fields",
    T: "Cardiac arrest — witnessed non-contact collapse of an adult male mid-match; bystander CPR in progress under telephone guidance",
    H: "Long soft-ground carry to hard standing; match-day crowds; rotor wash if NWAA land on pitch 12",
    A: "Hough End Centre car park off Mauldeth Road West — gate marshalled; foot / 4x4 only beyond, spine path south to the pitches",
    N: "One patient; two squads plus spectators to manage; family on scene",
    emergencyServices:
      "Ambulance-led — RRV first, two DCAs, NWAA critical care, duty officer for scene management",
  },

  pda: [
    {
      id: "rrv",
      label: "RRV — first past the post",
      service: "Ambulance",
      requiredApplianceTypes: ["RRV"],
      requiredCapabilities: ["Medical"],
      preferredStationId: "A-STP",
      notes: "Nothing matters but a defib on the chest — straight through the gate, drive to the pitch if the ground holds",
    },
    {
      id: "dca1",
      label: "DCA 1 — conveying crew",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      preferredStationId: "A-STP",
      notes: "Conveying resource — stage on hard standing at the car park, kit forward by hand",
    },
    {
      id: "dca2",
      label: "DCA 2 — backup crew",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      preferredStationId: "A-SHA",
      notes: "A working arrest eats hands — CPR carousel, kit shuttle, and the 450 m carry out",
    },
    {
      id: "ccc",
      label: "Critical care car — NWAA Barton",
      service: "Ambulance",
      requiredApplianceTypes: ["CCC"],
      requiredCapabilities: ["Medical"],
      preferredStationId: "A-HEMS",
      notes: "Doctor–critical care paramedic team by road — advanced airway and post-ROSC care",
    },
    {
      id: "hems",
      label: "Helimed — NWAA Barton",
      service: "Ambulance",
      requiredApplianceTypes: ["HEMS"],
      requiredCapabilities: ["HEMS"],
      preferredStationId: "A-HEMS",
      notes: "Young witnessed arrest meets NWAA tasking criteria. LZ on pitch 12 — cleared and marked before the aircraft commits",
    },
    {
      id: "od",
      label: "Duty officer",
      service: "Ambulance",
      requiredApplianceTypes: ["OD"],
      requiredCapabilities: ["Command"],
      preferredStationId: "A-OD",
      notes: "Scene management for a prolonged resus — crowd line, family liaison, egress plan",
    },
  ],

  evaluation: {
    targets: [
      { metric: "First defib-carrying resource in attendance", target: "< 7 minutes (Category 1)" },
      { metric: "Crew CPR / defib taken over from bystanders", target: "< 2 minutes from first arrival" },
      { metric: "Backup crew and critical care mobilised", target: "< 15 minutes" },
      { metric: "Egress planned — carry party and route to hard standing", target: "before conveyance, not during" },
      { metric: "Post-ROSC conveyance, pre-alerted", target: "PCI centre — not the nearest A&E" },
    ],
    lesson:
      "An arrest is the purest dispatch job in the game: the patient's survival is a straight line from the operator's first sixty seconds. Every minute from collapse to defibrillation costs roughly 10% — so the RRV goes on the first click, and over-mobilising is the correct answer, because a working arrest on grass needs a CPR carousel, a kit shuttle, a carry party and someone to hold the crowd and the family. Playing fields add the access trap: the job is 450 m from the nearest wheel, so the way OUT has to be planned while the resus is still running. And the save isn't finished at ROSC — a young primary-cardiac arrest belongs at the PCI centre, pre-alerted, not the nearest A&E.",
  },

  informantScript: [
    {
      id: "initial",
      atSec: 3,
      text: "It's one of our players — he's just dropped, nobody near him, no contact, he just went down. He's not waking up.",
      tone: "critical",
    },
    {
      id: "agonal",
      atSec: 20,
      text: "He's making these horrible gasping noises every few seconds — that's not proper breathing, is it?... Okay. Okay. Starting compressions now.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "cpr-going",
      atSec: 55,
      text: "We're on his chest — two of the lads swapping, counting out loud like you said. Hard and fast.",
      tone: "urgent",
    },
    {
      id: "defib-run",
      atSec: 80,
      text: "Someone's sprinting to the Hough End Centre — the manager reckons there's a defib on the wall in the foyer.",
      tone: "info",
    },
    {
      id: "access",
      atSec: 110,
      text: "We're on pitch 11, right in the middle — you can't drive to it. I've sent two lads to the car park on Mauldeth Road West to wave you through the gate.",
      tone: "info",
    },
    // --- Roll 1: is the community defib actually there for them? -------
    {
      id: "defib-found",
      atSec: 150,
      probability: 0.6,
      suppressesIds: ["defib-missing"],
      text: "They've got it — the defib's here! Ripping his shirt off, pads going on like the picture shows.",
      tone: "urgent",
    },
    {
      id: "defib-missing",
      atSec: 160,
      text: "The cabinet's there but it's code-locked and nobody can raise the number — forget it, we're staying on his chest until you get here.",
      tone: "urgent",
    },
    // --- Roll 2: shockable or not — only if the pads went on. ----------
    {
      id: "shock-advised",
      atSec: 210,
      probability: 0.55,
      requiresFiredIds: ["defib-found"],
      suppressesIds: ["no-shock"],
      text: "It's analysing — stand clear — SHOCK ADVISED, pressing the button... it's shocked him. It says carry on with compressions.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "no-shock",
      atSec: 220,
      requiresFiredIds: ["defib-found"],
      text: "It says no shock advised, continue CPR. Does that mean it's not working? We're carrying on regardless.",
      tone: "critical",
    },
    {
      id: "tiring",
      atSec: 300,
      text: "The lads doing compressions are blowing — we're swapping every couple of minutes like you said. He's gone grey. How far away are they?",
      tone: "urgent",
    },
    {
      id: "slow-response",
      atSec: 420,
      delayThresholdSec: 420,
      text: "It's been seven minutes on his chest. His mum's just got to the pitch — someone's holding her back. PLEASE.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  // Top-down scene — the Mauldeth Road West frontage (road, car park,
  // Hough End Centre) along the top, the spine path running south, and
  // the pitches either side. Patient mid-pitch-11; pitch 12 below it is
  // the LZ candidate.
  scene: {
    viewBox: { x: -60, y: -55, width: 120, height: 105 },
    compassNorth: "up",
    buildings: [
      {
        shape: { x: 8, y: -42, w: 26, h: 12 },
        kind: "other",
        label: "Hough End Centre — community defib in foyer",
      },
    ],
    roads: [
      { shape: { x: -60, y: -52, w: 120, h: 6 }, kind: "road", label: "Mauldeth Road West" },
      { shape: { x: -60, y: -46, w: 120, h: 2 }, kind: "pavement", label: "Pavement" },
      { shape: { x: -20, y: -42, w: 24, h: 14 }, kind: "driveway", label: "Car park — RVP / hard standing" },
      { shape: { x: -10, y: -28, w: 4, h: 78 }, kind: "pavement", label: "Spine path (foot / 4x4 only)" },
      { shape: { x: -58, y: -20, w: 44, h: 28 }, kind: "garden", label: "Pitch 10" },
      { shape: { x: -4, y: -18, w: 44, h: 30 }, kind: "garden", label: "Pitch 11 — match abandoned" },
      { shape: { x: -4, y: 16, w: 44, h: 28 }, kind: "garden", label: "Pitch 12 — candidate LZ" },
      { shape: { x: -58, y: 12, w: 44, h: 28 }, kind: "garden", label: "Pitch 9" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -2, y: -3 }, kind: "other", label: "Goalposts" },
      { pos: { x: 38, y: -3 }, kind: "other", label: "Goalposts" },
      { pos: { x: 12, y: -29 }, kind: "other", label: "PAD cabinet — foyer wall" },
      { pos: { x: -14, y: -36 }, kind: "car", label: "Parked cars" },
      { pos: { x: -8, y: -39 }, kind: "car" },
      { pos: { x: -34, y: -44 }, kind: "tree" },
      { pos: { x: 46, y: -44 }, kind: "tree" },
    ],
    // No fire — zero seat so the sim has nothing to grow.
    fireSeat: {
      pos: { x: 55, y: 44 },
      radiusM: 0,
      growthRateMpm: 0,
      maxRadiusM: 0,
      material: "vegetation",
    },
    hazards: [
      {
        id: "egress",
        pos: { x: -8, y: -8 },
        kind: "structural",
        label: "~450 m soft-ground carry from pitch 11 to the car park — build the carry party early",
        knownFromPri: true,
      },
      {
        id: "crowd",
        pos: { x: 14, y: -7 },
        kind: "structural",
        label: "Two squads plus spectators crowding the patient — working space needed",
        knownFromPri: false,
        discoverAfterMinOnScene: 1,
      },
      {
        id: "lz",
        pos: { x: 18, y: 30 },
        kind: "structural",
        label: "Pitch 12 flat and open — HEMS LZ once cleared of players",
        knownFromPri: false,
        discoverAfterMinOnScene: 2,
      },
    ],
    casualties: [
      {
        id: "cas-player",
        pos: { x: 18, y: -3 },
        severity: "critical",
        discoverAfterMinBa: 0,
        label: "Player (M, 23) — collapsed mid-match, in cardiac arrest",
        clinical: {
          vitals: {
            rr: 4,
            spo2: 68,
            hr: 0,
            bpSys: 0,
            bpDia: 0,
            gcs: 3,
            temp: 36.9,
            bm: 6.4,
          },
          ageYears: 23,
          presumedCondition:
            "Witnessed non-contact collapse — cardiac arrest, presumed primary cardiac (young male, ?arrhythmogenic). Bystander CPR from the moment of collapse",
          redFlags: ["cardiac_arrest"],
          preferredDestination: "pci",
          criticalInterventions: ["cpr", "defib", "oxygen", "iv_access"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Patient / resus", face: "front", bearingDeg: 0 },
      { id: 2, label: "Sector 2 · LZ — pitch 12", face: "rear", bearingDeg: 180 },
      { id: 3, label: "Sector 3 · Crowd line / spectators", face: "right", bearingDeg: 90 },
      { id: 4, label: "Sector 4 · Egress — path to car park", face: "left", bearingDeg: 270 },
    ],
  },

  // The call as Daniel has it: on his mobile, on his knees in the middle
  // of pitch 11 with Callum's head by his shin and two of his lads on
  // the chest. He has coached this boy since the under-sixteens. He is
  // talking to the operator and shouting at the pitch at the same time.
  call: {
    caller: {
      name: "Daniel Okafor",
      phone: "07700 900471",
      relation: "Coach of the patient's Sunday league side",
      where: "Kneeling by the patient, centre of pitch 11, Hough End playing fields",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "Ambulance — I need an ambulance, Hough End playing fields in Chorlton, the football pitches off Mauldeth Road West. One of my players has just collapsed. He's just dropped, nobody near him, and he's not waking up. He's twenty-three. Please — quick as you can.",
    deflection: "I don't — I'm doing what you said, I'm doing it, just get them here! He's twenty-three!",
    reassurance: {
      text: "Daniel, the fastest thing we've got is already moving. You and the lads on his chest are what's keeping him alive right now. Keep counting, and stay with me.",
      reply: "Okay. Okay. Keep going, Jordan — that's it, lad, that's it. I'm here.",
    },
    answers: {
      a_conscious: {
        text: "No. No, he's not. I'm shouting at him, I've shaken his shoulders — nothing. His eyes are half open and he's not looking at anything.",
        tone: "critical",
      },
      a_breathing: {
        text: "No — no, it's not right. He's doing this — like a snore, a gasp, every few seconds, and then nothing in between. That's not breathing, is it? That's not proper breathing.",
        tone: "critical",
        effect: { regrade: "CAT 1", basis: "Unresponsive with agonal breathing — cardiac arrest, bystanders on scene" },
      },
      a_happened: {
        text: "We're mid-match, second half. Callum — he's one of ours, centre-mid — he was jogging back for a corner and he just went down. Nobody near him, no tackle, no contact, nothing. Just dropped like someone had switched him off. He's not got up and he's not answering.",
        tone: "urgent",
        followUps: [
          {
            id: "a_happened_contact",
            text: "Was there any contact — a collision, a clash of heads?",
            answer: {
              text: "None. I've said. Nobody within five yards of him. The ref's stood here, he saw it, same as me. It was nothing to do with the game.",
            },
          },
        ],
      },
      a_when: {
        text: "Just now — two minutes? Less. He went down and I was on the phone to you straight away. The ref hadn't even blown up.",
      },
      a_now: {
        text: "He's white. White as a sheet, and there's a bit of blue coming round his mouth. He's not sweating, he's not anything. He's not talking, he's not moving, he's just — lying there. He's not right.",
        tone: "critical",
        followUps: [
          {
            id: "a_now_head",
            text: "Did he hit his head when he went down?",
            answer: {
              text: "No — well, he went down flat, face-first sort of, but it's grass, it's soft. It wasn't a knock. We've rolled him onto his back.",
            },
          },
        ],
      },
      a_bleeding: {
        text: "No. No blood. He didn't hit anything, nobody touched him. There's not a mark on him.",
      },
      a_age: {
        text: "Twenty-three. He's twenty-three. Fit as a fiddle — plays every week, trains twice a week, never misses.",
      },
      a_history: {
        text: "Nothing. Nothing I know of. He's never said anything, he doesn't take anything that I know of — he's a fit young lad. His mum'd know. Someone's trying to ring her.",
        needsCalm: true,
        followUps: [
          {
            id: "a_history_before",
            text: "Has he ever collapsed before, or complained about his chest?",
            answer: {
              text: "Never. He'd have said — you can't hide that in a squad, someone'd know. He was fine at half-time, he was laughing. He was fine.",
            },
          },
        ],
      },
      a_count: {
        text: "Just Callum. Just the one. Everyone else is stood round staring.",
      },
      a_danger: {
        text: "It's a football pitch — it's grass, he's safe where he is. There's a crowd, though. Both teams, the other lot's supporters, kids — I'm trying to get them back off him.",
      },
      a_access: {
        text: "You come in off Mauldeth Road West — the Hough End Centre, the big pavilion, there's a car park in front of it. There's a gate at the bottom of the car park onto a path, and we're down that path — pitch eleven, right in the middle of the fields. You can't drive to it. It's grass all the way, it's been raining, it's four or five hundred metres. I'll get someone up to the gate to wave you in.",
        followUps: [
          {
            id: "a_access_ground",
            text: "Would the ground take a vehicle if they drove onto it?",
            answer: {
              text: "No chance. It's been chucking it down all week — it's mud round the edges, a car'd sink. The path's tarmac but it's only a path, it's not wide.",
            },
          },
        ],
      },
      a_with: {
        text: "Yes — I'm knelt right next to him, his head's by my knee. I've got two of the lads here with me, Jordan and Sam.",
      },
      a_instructions: {
        text: "Yes. Yes. Tell me. Whatever you need — the lads'll do it, I'll tell them what you tell me.",
        tone: "urgent",
      },
      a_details: {
        text: "Daniel Okafor. I'm the coach. This is my mobile — 07700 900471.",
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "The ref's abandoned it — everyone's coming over. GET BACK — sorry, sorry, not you. Give him some room! — Sorry. I'm here.",
        tone: "urgent",
      },
      {
        atSec: 95,
        text: "His lips have gone proper blue now. Oh God. Oh God — come on, Callum, come on, lad. Come on.",
        tone: "critical",
        effect: { state: "panicking" },
      },
      {
        atSec: 140,
        text: "Is anyone actually coming? You've not said. It's been — how long's it been? Please. Please, just tell me someone's coming.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 200,
        text: "I can hear a siren — that's Mauldeth Road, that's coming this way. Is that you? Is that for us?",
        requiresOpened: true,
      },
    ],
    onDispatch: "Thank you. Tell them pitch eleven — tell them to run. Please, tell them to run.",
  },
};
