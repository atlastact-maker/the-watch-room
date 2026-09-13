import type { Scenario } from "../incident_types";

// Scenario 10 — Fire alarm, Royal Bolton Hospital. Converted from the
// approved brief at data/research/fire/scenarios/10_hospital_royal_bolton.md.
// The hospital is real; the ward layout, alarm zones and PRI content are
// synthetic. Hospitals are the only premises where the default response
// is NOT evacuation — staged response is the law, and the trust fire
// team holds the building knowledge.

export const scenario10: Scenario = {
  id: "10",
  slug: "10_hospital_royal_bolton",
  title: "Hospital Alarm — Royal Bolton, Ward 19",
  type: "healthcare_premises_fire_alarm",
  patch: "Western",
  severity: "moderate",
  trigger:
    "Ward alarm zone activation — Block C 3rd floor; staff report smoke in the ward pantry; trust fire team responding internally",

  location: {
    address: "Royal Bolton Hospital, Minerva Road, Farnworth, Bolton",
    postcode: "BL4 0JR",
    coords: { lat: 53.555, lng: -2.434 },
  },

  property: {
    class: "Large district general hospital — 700+ beds across multiple linked blocks",
    size: "Block A admin, Block B outpatients, Block C inpatient wards, Block D ITU/theatres",
    materials: "Mixed-age NHS estate — concrete frame blocks, link corridors, service risers",
    occupants:
      "Thousands — patients, staff and visitors; many critical-care patients non-ambulant. Ward 19 (affected) is frail elderly, 24 beds",
    vulnerabilities: [
      "Frail elderly on the affected ward — moving them is itself a clinical risk",
      "ITU and theatres in the adjacent block — any escalation touches them",
    ],
    access:
      "Block C entrance via Minerva Road; trust fire officer meets crews on arrival; helipad on site",
    knownHazards: [
      "Medical gases — piped oxygen + bulk VIE compound; nitrous oxide manifold",
      "Pharmacy controlled drugs store",
      "MRI suite — magnet always on; no ferrous equipment",
      "Lifts in fire mode on the affected block",
    ],
    firstDueStationId: "G53",
    doorType: "composite",
  },

  pri: {
    hasFormalPri: true,
    items: [
      "Statutory healthcare PRI — detailed plans, evacuation zones and fire compartments by ward, annexed.",
      "Trust fire team and hospital fire safety officer on site 24/7 — they hold the building knowledge; work with them, not over them.",
      "Staged evacuation policy: Stage 1 defend in place + investigate · Stage 2 horizontal to the next compartment · Stage 3 vertical down · Stage 4 full evacuation (last resort).",
      "Piped medical gas isolation valves at each ward entrance; bulk oxygen VIE compound outside Block D — isolation by estates only.",
      "Critical care has standby ambulance + theatre evacuation chains pre-planned with NWAS.",
    ],
  },

  methane: {
    M: "Possible — depends on whether the alarm is real and its size",
    E: "Royal Bolton Hospital, Minerva Road BL4 0JR — Block C, 3rd floor, ward 19",
    T: "Fire alarm activation — smoke reported by staff in the ward pantry area",
    H: "Patients in adjacent wards (frail elderly), piped oxygen, medication trolleys",
    A: "Block C entrance via Minerva Road; trust fire officer meeting crews on arrival",
    N: "None reported as casualties; staff moving ward 19 patients horizontally as a Stage 2 precaution",
    emergencyServices:
      "Fire (lead), trust fire officer co-ordinating internally, NWAS liaison already on site",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G53",
      notes: "First BA team — investigate ward 19 pantry with the trust fire officer",
    },
    {
      id: "pump2",
      label: "Pump 2",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G53",
      notes: "Second BA team — Farnworth runs two pumps; compartment cover on ward 20",
    },
    {
      id: "pump3",
      label: "Pump 3",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G50",
      notes: "Bridgehead support + rapid-intervention cover from Bolton Central",
    },
    {
      id: "alp",
      label: "Aerial (HLP)",
      service: "Fire",
      requiredApplianceTypes: ["HLP", "TL"],
      requiredCapabilities: ["Aerial"],
      preferredStationId: "G50",
      notes: "Precaution — Block C elevation if the compartment is lost",
    },
    {
      id: "nwas_liaison",
      label: "NWAS liaison",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: ["Medical"],
      notes: "On-site liaison — any patient moves beyond Stage 2 need NWAS in the loop",
    },
  ],

  evaluation: {
    targets: [
      {
        metric: "Joint working",
        target: "trust fire team integrated — not bypassed",
      },
      {
        metric: "Evacuation discipline",
        target: "stages followed in order; no premature full evacuation",
      },
      { metric: "Compartmentation", target: "held at ward 19; fire dealt with inside one compartment" },
      { metric: "Handover", target: "clean handover to the trust fire safety advisor at close" },
    ],
    lesson:
      "Hospitals are the only premises where the default response is NOT evacuation — staged response is the law. Moving frail patients kills more of them than smoke does at this scale. Work with the trust fire team, follow the stages, and treat 'get everyone out' as the last resort it's designed to be.",
  },

  // Schematic — 180m × 120m of the campus. Block C (target) centre, A/B
  // west, D east with the VIE compound; Minerva Road along the south.
  scene: {
    viewBox: { x: -90, y: -60, width: 180, height: 120 },
    compassNorth: "up",
    buildings: [
      {
        shape: { x: -22, y: -30, w: 44, h: 18 },
        kind: "target",
        label: "Block C — inpatient wards (ward 19, 3rd floor)",
      },
      {
        shape: { x: -84, y: -26, w: 26, h: 22 },
        kind: "neighbour",
        label: "Block A — admin",
      },
      {
        shape: { x: -52, y: -32, w: 24, h: 24 },
        kind: "neighbour",
        label: "Block B — outpatients",
      },
      {
        shape: { x: 28, y: -34, w: 34, h: 26 },
        kind: "neighbour",
        label: "Block D — ITU / theatres",
      },
      // Link corridor between C and D
      { shape: { x: 22, y: -24, w: 6, h: 6 }, kind: "other", label: "Link" },
      { shape: { x: -28, y: -24, w: 6, h: 6 }, kind: "other", label: "Link" },
    ],
    roads: [
      // Internal circulation + drop-off
      { shape: { x: -60, y: -6, w: 120, h: 12 }, kind: "driveway", label: "Internal road / drop-off" },
      { shape: { x: -12, y: 6, w: 24, h: 18 }, kind: "driveway", label: "Block C forecourt" },
      // Car parks
      { shape: { x: -88, y: 6, w: 50, h: 22 }, kind: "driveway", label: "Visitor car park" },
      { shape: { x: 44, y: 6, w: 42, h: 22 }, kind: "driveway", label: "Staff car park" },
      // Minerva Road along the south
      { shape: { x: -90, y: 32, w: 180, h: 2 }, kind: "pavement" },
      { shape: { x: -90, y: 34, w: 180, h: 10 }, kind: "road", label: "Minerva Road" },
      { shape: { x: -90, y: 44, w: 180, h: 2 }, kind: "pavement" },
      // Green space north
      { shape: { x: -90, y: -60, w: 180, h: 22 }, kind: "garden" },
    ],
    hydrants: [
      { label: "H1", coords: { lat: 53.5545, lng: -2.4352 }, street: "Minerva Road" },
      { label: "H2", coords: { lat: 53.5557, lng: -2.4329 }, street: "Site entrance" },
      { label: "H3", coords: { lat: 53.5559, lng: -2.4361 }, street: "Internal road" },
    ],
    landmarks: [
      { pos: { x: 70, y: -44 }, kind: "other", label: "Helipad" },
      { pos: { x: 40, y: -2 }, kind: "car", label: "Trust fire team van" },
      { pos: { x: -50, y: 12 }, kind: "car" },
      { pos: { x: -58, y: 12 }, kind: "car" },
      { pos: { x: 52, y: 12 }, kind: "car" },
      { pos: { x: -20, y: 0 }, kind: "lamppost" },
      { pos: { x: 20, y: 0 }, kind: "lamppost" },
      { pos: { x: -80, y: -34 }, kind: "tree" },
      { pos: { x: 80, y: 26 }, kind: "tree" },
    ],
    // Ward 19 pantry — dormant seat. Half of all runs the trust officer
    // stands it down as a burnt-out appliance; the other half his
    // "confirmed-small" beat ignites a real one-room electrical fire
    // (and can escalate into the corridor void on slow responses).
    fireSeat: {
      pos: { x: 12, y: -22 },
      radiusM: 0,
      growthRateMpm: 0,
      suppressionPerBaMpm: 0.1,
      maxRadiusM: 8,
      material: "electrical",
      unknownMaterial: true,
    },
    hazards: [
      {
        id: "medical-gas",
        pos: { x: -6, y: -26 },
        kind: "cylinders",
        label: "Piped oxygen — ward isolation valve at the ward 19 entrance",
        knownFromPri: true,
      },
      {
        id: "vie-compound",
        pos: { x: 56, y: -6 },
        kind: "cylinders",
        label: "Bulk oxygen VIE compound — estates isolation only",
        knownFromPri: true,
      },
      {
        id: "mri-suite",
        pos: { x: -44, y: -20 },
        kind: "electrical",
        label: "MRI suite (Block B) — magnet always on; NO ferrous equipment",
        knownFromPri: true,
      },
      {
        id: "pharmacy",
        pos: { x: -70, y: -16 },
        kind: "chemical",
        label: "Pharmacy — controlled drugs store (Block A ground)",
        knownFromPri: true,
      },
      {
        // Isolating this restores water effectiveness on the pantry's
        // electrical fire when the confirmed-small roll lands.
        id: "ward19-supply",
        pos: { x: 8, y: -26 },
        kind: "electrical",
        label: "Ward 19 pantry ring main — isolate at the ward distribution board",
        discoverAfterMinOnScene: 2,
      },
    ],
    casualties: [
      {
        id: "cas-ward19",
        pos: { x: 6, y: -18 },
        severity: "serious",
        discoverAfterMinBa: 5,
        label: "Ward 19 patient (F, ~84) — smoke-affected during the horizontal move, COPD",
        clinical: {
          vitals: {
            rr: 26, spo2: 88, hr: 108, bpSys: 152, bpDia: 88,
            gcs: 14, temp: 36.5, bm: 7.2,
          },
          ageYears: 84,
          presumedCondition: "Smoke exposure on background COPD — bronchospasm",
          redFlags: ["severe_asthma"],
          preferredDestination: "non_convey",
          criticalInterventions: ["oxygen", "salbutamol_neb"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Block C front", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Block D / ITU side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear / green space", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Blocks A-B side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "trust-officer-first",
      atSec: 8,
      text: "Trust fire officer here — panel's showing ward 19, Block C third floor. Staff are reporting smoke in the pantry. I'm heading up now; my team are checking the compartment doors.",
      tone: "urgent",
    },
    {
      id: "stage2-precaution",
      atSec: 60,
      text: "Ward staff have started a Stage 2 move as a precaution — the six nearest beds are going horizontally into ward 20's compartment. It's calm, they drill this.",
      tone: "info",
    },
    {
      id: "meet-point",
      atSec: 90,
      text: "I'll meet your crews at the Block C entrance off Minerva Road with the plans and the gas isolation locations. Lifts are in fire mode.",
      tone: "info",
    },
    // The reality roll — a coin flip between a real one-room fire and a
    // burnt-out toaster. Mutually exclusive; each run hears exactly one.
    {
      id: "confirmed-small",
      atSec: 140,
      probability: 0.5,
      suppressesIds: ["stood-down"],
      text: "Update — my officer's at the pantry. It's a counter-top appliance well alight and it's got into the cupboard above, but it's one room. Door's shut, compartment's good. Your BA crew can make this quick work.",
      tone: "urgent",
      effect: { igniteFire: { radiusM: 1.2, growthRateMpm: 0.12 } },
    },
    {
      id: "stood-down",
      atSec: 155,
      suppressesIds: ["confirmed-small"],
      text: "Stand your crews easy — it's a burnt-out toaster, nothing's spread. We're ventilating the smell, resetting the panel, and reversing the Stage 2 move. Appreciate the attendance.",
      tone: "info",
    },
    {
      id: "corridor-smoke",
      atSec: 220,
      delayThresholdSec: 420,
      probability: 0.35,
      requiresFiredIds: ["confirmed-small"],
      text: "It's not holding as clean as I'd like — smoke's found the corridor ceiling void. We're extending the Stage 2 to the whole of ward 19 and I want your crews on the void.",
      tone: "critical",
      effect: { igniteFire: { radiusM: 0.8, growthRateMpm: 0.08 }, pulseCritical: true },
    },
    {
      id: "patient-affected",
      atSec: 280,
      probability: 0.6,
      requiresFiredIds: ["confirmed-small"],
      text: "One of the ward 19 patients is struggling — elderly lady with COPD, took some smoke during the move. Ward staff have oxygen on her; your NWAS liaison's been told.",
      tone: "urgent",
    },
    {
      id: "itu-question",
      atSec: 340,
      delayThresholdSec: 540,
      probability: 0.3,
      text: "ITU are asking whether they should prepare — I've told them Stage 1, defend in place, nothing's crossing the link corridor. Confirm your read when you can.",
      tone: "info",
    },
  ],

  // The call as Michael has it: on his mobile on the Block C stairwell,
  // radio in the other hand, the panel print-out in his head. He has not
  // seen the pantry yet and he will not pretend he has. He has rung with
  // a request, not a plea, and he expects to be met with the same.
  call: {
    caller: {
      name: "Michael Crompton",
      phone: "07700 900513",
      relation: "Trust duty fire officer, Royal Bolton Hospital",
      where: "Block C stairwell, second-floor landing, heading up to ward 19",
      line: "mobile",
      state: "calm",
    },
    opening:
      "Royal Bolton Hospital, trust fire officer — Michael Crompton. I've got a confirmed alarm on Block C, third floor, ward 19. Ward staff are reporting smoke in the pantry, a smell of burning. I'm on my way up to it now and my team are checking the compartment. I'd like a fire attendance to the Block C entrance off Minerva Road, please.",
    deflection: "I've given you what I've got. Are they mobilised?",
    reassurance: {
      text: "Michael, they're mobilised. Keep going — what have you got now?",
      reply: "Right. Understood.",
    },
    answers: {
      f_seen: {
        text: "I've not got eyes on it yet — I'm on the stairs. What I've got is the panel: one smoke head in the ward 19 pantry, Block C third floor, and the nurse in charge on the phone saying there's smoke in the pantry and a burning smell. Smoke, not flames. That's all I've got until I'm up there.",
      },
      f_where: {
        text: "Block C, third floor, ward 19 — the pantry, that's the little ward kitchen off the corridor, about a third of the way down. Block C's the inpatient block, the middle one on the site.",
      },
      f_spread: {
        text: "I've no reason to think so yet. The pantry's got a fire door on it and the ward's its own compartment — the whole floor's split, ward 19 and ward 20 are separate compartments. Nothing else has come up on the panel: one head, one zone.",
      },
      f_started: {
        text: "The panel activated three minutes ago, near enough. The nurse says she smelt burning a minute or two before that. So five minutes, tops.",
      },
      f_building: {
        text: "District general hospital — Royal Bolton. Block C's the inpatient block, concrete frame, sixties-seventies build, link corridors across to Block D on the same floor — that's ITU and theatres. Seven hundred-odd beds across the site.",
      },
      f_inside: {
        text: "Ward 19's full — it's a 24-bed frail elderly ward, they're all in bed and most of them can't walk. Ward staff are with them, six or seven nurses and HCAs at this time of night. Nobody's evacuating — we're Stage 1, defend in place, while I get up there and look. Anjali, the nurse in charge, has got the beds nearest the pantry ready to go horizontal into ward 20 the second I call it. That's our policy and it's the right one.",
        followUps: [
          {
            id: "f_inside_stage",
            text: "What does Stage 1 mean for the crews coming in?",
            answer: {
              text: "Nothing moves unless it has to. Patients stay where they are behind the compartment doors. If I need to, we go to Stage 2 — horizontal, into the next ward along — and I'll tell you the moment that happens. Nobody goes down a staircase unless I say so.",
            },
          },
          {
            id: "f_inside_ward20",
            text: "What about the wards either side?",
            answer: {
              text: "Ward 20's the other side of the compartment door — another 24 beds, general medical. The floors below are wards as well. Everyone's Stage 1, staying put.",
            },
          },
        ],
      },
      f_hurt: {
        text: "No. Nobody hurt reported, nobody's been in smoke that I know of. The nurse in charge smelt it and shut the pantry door — she's done exactly right.",
      },
      f_vulnerable: {
        text: "All of them, frankly. Ward 19 is frail elderly — twenty-four of them, most non-ambulant, some on oxygen, a few with dementia. Moving them is a risk in itself, which is why we don't unless we have to. That's the whole point of staging it.",
      },
      f_hazards: {
        text: "Piped oxygen on every ward — there's an isolation valve at the ward 19 entrance, my team can shut it if you want it shut. The bulk oxygen's the VIE compound outside Block D, estates only touch that. Nitrous manifold. Pharmacy's got the controlled drugs store, that's Block A. And MRI in Block B — the magnet's always on, nothing ferrous goes in that room, ever. It's all on the PRI you hold for us.",
      },
      f_danger: {
        text: "Lifts'll be in fire mode on Block C, so it's the stairs. Beyond that, no — it's a hospital, everyone's where they should be. Keep your appliances off the helipad, it's marked.",
      },
      f_access: {
        text: "Block C entrance, off Minerva Road — come in at the main site entrance, follow the internal road round and it's the middle block, it's signed. One of my team will be on the door. Bridgehead on the second-floor landing, one below the ward.",
        followUps: [
          {
            id: "f_access_vehicles",
            text: "Is there room for four appliances at Block C?",
            answer: {
              text: "The forecourt takes two, and the internal road's wide enough to hold the rest without blocking the drop-off. Keep the ambulance bay clear — that's the Block D side. The helipad's north-east, don't put anything on it.",
            },
          },
        ],
      },
      f_safe: {
        text: "I'm fine — I'm on the Block C stairwell, second floor, nothing's on the stairs. I've got a radio and my team's with me.",
      },
      f_stay: {
        text: "I'll stay on as long as I can, but I'll be on the radio to my team as well, so bear with me if I go quiet.",
      },
      f_details: {
        text: "Michael Crompton, trust duty fire officer, Royal Bolton. This is my mobile, 07700 900513 — if it drops, go through switchboard, 0161 496 0400, and ask for the fire team bleep.",
      },
    },
    interjections: [
      {
        atSec: 40,
        text: "Hold on — Craig's on the radio. Compartment doors at the ward 19 and 20 junction are shut and holding, nothing showing on the ward 20 side. Good.",
      },
      {
        atSec: 100,
        text: "Are you mobilising, or are you waiting on me to confirm it? I'd rather have them turning round on the forecourt than not here.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 150,
        text: "I can hear them coming up Minerva Road. I'm heading down to the entrance now with the plans.",
        requiresOpened: true,
      },
      {
        atSec: 200,
        text: "Estates duty engineer's on his way over to us — Imran — for the gas side, in case your crews want anything isolated.",
      },
    ],
    onDispatch: "Understood. Block C entrance, Minerva Road. We'll be ready for them.",
  },
};
