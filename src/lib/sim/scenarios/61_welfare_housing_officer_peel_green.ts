import type { Scenario } from "../incident_types";

// Scenario 61 — concern for welfare from a housing officer, Milner
// Court, Peel Green. The door only the police can open.
//
// Femi Adebayo is a housing officer standing on the ramp outside Flat 6.
// The tenant, Ronald Casey, is seventy-four, lives alone and has COPD
// on home oxygen. His neighbour has not seen him since Thursday. There
// is post behind the door, two pints of milk on the step, the curtains
// are shut, his phone goes to voicemail and his mobility scooter is
// still under its cover. The housing association holds no key — he
// changed the barrel — and there is no family on file. Femi has rung
// the GP, the hospital and the out-of-hours service. Nobody can get
// through that door except the police, and he has done all the work a
// partner agency can do before asking them to.
//
// Under Right Care Right Person this is still police business: a real
// risk to life, and no other agency able to act. It is a Grade 2 on
// what is known — nothing yet says he is alive and in danger this
// minute — and a Grade 1 the moment there is. About one run in four
// there is: a knock or a groan from the back room while the officer is
// still on the step, and the same call is an immediate with an
// ambulance requested alongside the car. The rest of the time the car
// puts the door in under PACE s.17 and finds what the flies on the
// kitchen window were already saying, and the crew are there for the
// rest of the shift.
//
// Two things to give the crew before they go through the door: the
// home oxygen, and the back gate.
//
// FICTIONAL: Ronald, Femi, Maureen, Barton Brook Housing and Milner
// Court. Peel Green Road is real. MP-SAL is Salford's police station.

export const scenario61: Scenario = {
  id: "61",
  slug: "61_welfare_housing_officer_peel_green",
  title: "Concern for welfare, housing officer — Milner Court, Peel Green",
  type: "police_welfare_partner_referral",
  patch: "Western",
  severity: "moderate",
  trigger:
    "Housing officer at the door of Flat 6, Milner Court, Peel Green Road — tenant Ronald Casey, 74, lives alone with COPD, not seen since Thursday. Post piling behind the door, milk on the step, curtains shut, phone to voicemail, no answer to knocking. No key held, no family on file. Community partner call",

  location: {
    address: "Flat 6, Milner Court, Peel Green Road, Peel Green, Eccles",
    postcode: "M30 7HR",
    coords: { lat: 53.479, lng: -2.362 },
  },

  property: {
    class: "Low-rise block of six housing-association flats — two storey; Flat 6 ground floor at the east end",
    occupants: "One adult male (74) believed inside, alone, unseen for five days. Housing officer and the neighbour from Flat 5 outside",
    vulnerabilities: [
      "74, COPD on home oxygen, lives alone — a man who could be on the floor behind the door",
      "No next of kin on file; the housing association is the only agency in contact",
    ],
    access:
      "Front door of Flat 6 straight off the shared path on Peel Green Road, uPVC with a deadlock — the housing association holds no key since he changed the barrel. Rear door onto a small fenced yard, gate bolted inside",
    knownHazards: [
      "Home oxygen concentrator and cylinders in the flat — no naked flames on entry",
      "Possible sudden death inside — a scene to be preserved as well as a man to be found",
    ],
    firstDueStationId: "MP-SAL",
    doorType: "upvc",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — residential flats. The housing association's tenancy file: Ronald CASEY, 74, sole tenant since 2011, COPD, home oxygen, mobility scooter, no next of kin recorded, last contact a repairs visit in August.",
      "Right Care Right Person (GMP, from 30 September 2024): a concern for welfare is police business where there is a real and immediate risk to life or of serious harm, and where no other agency can reasonably act. A vulnerable man unseen for five days behind a locked door nobody else can open is that — Grade 2 on what is known, Grade 1 the moment there is a sign of life or of distress inside.",
      "Power of entry: PACE s.17(1)(e) — saving life or limb. The car carries the enforcer; GMFRS for the door is a request if the uPVC beats it.",
      "If he is dead, it is a sudden death behind a locked door — the police car's job for the rest of the shift, the coroner's officer informed, the flat preserved.",
    ],
  },

  methane: {
    M: "No",
    E: "Flat 6, Milner Court, Peel Green Road, Peel Green, Eccles, M30 7HR",
    T: "Concern for welfare — vulnerable male, 74, unseen five days, no answer. Partner referral",
    H: "Home oxygen inside — no naked flames. Possible sudden death",
    A: "Front door off the shared path on Peel Green Road, uPVC deadlocked, no key; rear yard gate bolted from inside",
    N: "None known — one adult male inside, unseen for five days; no response to knocking",
    emergencyServices: "Police — one car, PACE s.17 entry. Ambulance requested if there is any sign of life",
  },

  pda: [
    {
      id: "police1",
      label: "Police — response",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      preferredStationId: "MP-SAL",
      notes:
        "One car — a welfare check is one car, and this one puts a door in: PACE s.17 to save life, the enforcer from the boot, GMFRS asked for the door if the uPVC beats it. An ambulance is a request the moment there is a sound from inside, not a slot. If he is dead this crew is there for the rest of the shift",
    },
  ],

  evaluation: {
    targets: [
      {
        metric: "Grading",
        target: "Grade 2 on what is known — not closed as a housing matter, and not a Grade 1 on a smell and a feeling",
      },
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      {
        metric: "Entry",
        target: "PACE s.17 entry on arrival — not a wait for a locksmith or a key",
      },
      {
        metric: "Change of picture",
        target: "a sign of life from inside: regraded Grade 1 and an ambulance requested within 90 seconds of hearing it",
      },
      {
        metric: "Oxygen",
        target: "the crew told about the home oxygen and the back gate before they go through the door",
      },
    ],
    lesson:
      "Right Care Right Person did not stop the police attending concerns for welfare; it stopped them attending the ones another agency should own. This one has no other agency. A housing officer has rung the GP, the hospital and the out-of-hours line, spoken to the neighbour and stood at the door, and the only thing left that anyone can lawfully do is put it in — which is a police power, under PACE s.17, to save life. That makes it police business on the day RCRP went live and every day since. Grade it on what you have: a vulnerable man unseen for five days is a real risk to life, so it is a Grade 2 now, and it becomes a Grade 1 on the first sound from inside — then an ambulance goes with the car. Give the crew the two things that matter before the door: there is oxygen in that flat, and there is a back gate. One run in four he is alive on the back bedroom floor and the minutes count. The rest, the car is there for the rest of the shift, and the job was still theirs.",
  },

  callGrade: {
    scale: "police_thrive",
    grade: 2,
    standardMinutes: 60,
    basis:
      "Grade 2 Priority on GMP's ladder — attendance within 60 minutes (GMP FOI 01/FOI/24/012708/K, 28 Jun 2024). Under Right Care Right Person a concern for welfare is still police business where there is a real risk to life and no other agency can act: a vulnerable man unseen for five days behind a door only the police can lawfully open. Not Grade 1 — nothing yet says he is alive and in danger this minute — and the sim moves it to Grade 1 on the first sound from inside",
  },

  channel: "community",

  scene: {
    viewBox: { x: -40, y: -30, width: 80, height: 40 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -30, y: -20, w: 40, h: 12 }, kind: "neighbour", label: "Milner Court — Flats 1–5" },
      { shape: { x: 10, y: -20, w: 20, h: 12 }, kind: "target", label: "Milner Court — Flat 6, ground floor, east end" },
    ],
    roads: [
      { shape: { x: -40, y: -30, w: 80, h: 10 }, kind: "garden", label: "Rear yards — gates bolted inside" },
      { shape: { x: -40, y: -8, w: 80, h: 2 }, kind: "garden", label: "Front gardens" },
      { shape: { x: -40, y: -6, w: 80, h: 2 }, kind: "pavement", label: "Shared path" },
      { shape: { x: -40, y: -4, w: 80, h: 4 }, kind: "garden", label: "Verge" },
      { shape: { x: -40, y: 0, w: 80, h: 2 }, kind: "pavement" },
      { shape: { x: -40, y: 2, w: 80, h: 8 }, kind: "road", label: "Peel Green Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: 20, y: -7 }, kind: "other", label: "Housing officer and neighbour — on the ramp at the front door of Flat 6" },
      { pos: { x: 23, y: -6.5 }, kind: "other", label: "Milk and post on the step" },
      { pos: { x: 27, y: -6.5 }, kind: "other", label: "Mobility scooter under its cover — not moved" },
      { pos: { x: -10, y: 5 }, kind: "car" },
      { pos: { x: -30, y: 1 }, kind: "lamppost" },
      { pos: { x: 30, y: 1 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "door",
        pos: { x: 20, y: -8.5 },
        kind: "structural",
        label: "Front door uPVC, deadlocked — no key held. PACE s.17 entry; enforcer, or GMFRS for the door",
        knownFromPri: true,
      },
      {
        id: "oxygen",
        pos: { x: 16, y: -14 },
        kind: "cylinders",
        label: "Home oxygen — concentrator and two cylinders by the armchair. No naked flames on entry",
        knownFromPri: true,
      },
    ],
    // Absent unless the groan beat fires (revealCasualty). On the other
    // three runs in four nobody inside is a patient.
    casualties: [
      {
        id: "cas-61-casey",
        label: "Male, 74 — on the back bedroom floor, cold, barely responsive",
        pos: { x: 24, y: -16 },
        severity: "critical",
        presentProbability: 0,
        discoverAfterMinBa: 0,
        discoverAfterMinOnScene: 2,
        clinical: {
          // Days on a floor with COPD: hypoxic, cold, dry, slow.
          vitals: { rr: 26, spo2: 86, hr: 48, bpSys: 92, bpDia: 58, gcs: 13, temp: 33.5, bm: 4.1 },
          ageYears: 74,
          presumedCondition: "Collapsed at home with COPD — hypothermic and dehydrated after a long lie of days, pressure damage likely",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["oxygen", "warming", "iv_access", "fluids"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Peel Green Road / front doors", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · East end / Flat 6 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear yards", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · West end", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "officer-first",
      atSec: 5,
      text: "I'm on the ramp at his door. Post behind it, milk on the step, curtains shut, scooter not moved. Neighbour's not seen him since Thursday. No answer front or back.",
      tone: "info",
    },
    {
      id: "letterbox",
      atSec: 60,
      text: "I've had another look through the letterbox. There's a pile of post, the hall light's on in daylight, and there's flies on the inside of the kitchen window.",
      tone: "info",
    },
    {
      id: "groan",
      atSec: 150,
      probability: 0.25,
      suppressesIds: ["silence"],
      text: "Wait — I shouted again and I think I heard something. A knock, or a groan, from the back room. I can't be sure. I'm shouting again — there. There it is again. He's in there and he's alive.",
      tone: "critical",
      effect: {
        regrade: "GRADE 1",
        basis: "A sign of life behind a locked door — real and immediate risk to life; a car now and an ambulance with it",
        pulseCritical: true,
        revealCasualty: "cas-61-casey",
      },
    },
    {
      id: "silence",
      atSec: 150,
      suppressesIds: ["groan"],
      text: "Nothing. I've knocked and shouted at the front and the back. The neighbour at 5 says the telly's not been on since the weekend, and he always has it on.",
      tone: "info",
    },
    {
      id: "neighbour-key",
      atSec: 240,
      probability: 0.5,
      text: "Maureen's rung the lady at number 3 who used to feed his cat — she thinks she might still have a back gate key. She's coming round.",
      tone: "info",
    },
    {
      id: "slow-response",
      atSec: 600,
      delayThresholdSec: 1800,
      text: "I've been stood at this door an hour now. I've got other calls and I can't leave it. Is anyone actually coming?",
      tone: "urgent",
    },
  ],

  // The call as Femi has it: on the ramp with his work phone and his
  // tablet, the neighbour at his elbow, the smell at the letterbox he
  // does not want to name in front of her. He has done this before and
  // he knows what he is asking for.
  call: {
    caller: {
      name: "Femi Adebayo",
      phone: "07700 900684",
      relation: "Housing officer, Barton Brook Housing — the tenancy's landlord",
      where: "The front door of Flat 6, Milner Court, Peel Green Road, with the neighbour from Flat 5",
      line: "mobile",
      state: "calm",
    },
    opening:
      "Hello, it's Femi Adebayo, I'm a housing officer with Barton Brook Housing. I'm outside one of our flats in Peel Green — Flat 6, Milner Court, on Peel Green Road — and I've got a concern for a tenant. Ronald Casey, he's seventy-four, lives alone, he's got COPD. His neighbour hasn't seen him since Thursday. There's post piled up behind the door, two pints of milk on the step, the curtains are shut and his phone goes straight to voicemail. We don't hold a key. I've knocked front and back and there's nothing.",
    answers: {
      p_happening: {
        text: "Nothing's happening, which is the problem. I'm stood at his front door. He's not answering, he's not been seen for five days, and I can't get in. Everything about the flat says nobody's moved in it since the weekend — the post, the milk, the curtains. I'm worried he's inside and he's either collapsed or he's dead.",
        followUps: [
          {
            id: "p_happening_checks",
            text: "What have you done to try and reach him?",
            answer: {
              text: "Knocked front and back, shouted through the letterbox, rung his mobile and his landline — mobile's voicemail, landline rings out. Rung the GP surgery — they can't tell me much but he's not been in. Our welfare team rang Salford Royal — not admitted. Spoken to the neighbour in 5. There's nobody else. He's got no family on our file.",
            },
          },
        ],
      },
      p_ongoing: {
        text: "Still going on in the sense he's still in there, if he's in there. Nothing's changed in the ten minutes I've been here. No sound, no movement at the curtains. The neighbour says the telly's not been on since Thursday night and it's always on.",
      },
      p_weapons: {
        text: "No. No, nothing like that. He's a seventy-four-year-old man with an oxygen machine. There's no weapons, there's no one else in there. The only thing I'd flag is the oxygen — he's got a concentrator and cylinders in the living room, so no flames or anything if somebody goes in.",
      },
      p_injured: {
        text: "Nobody that I can see. Nobody's threatened anyone. It's just — if he's in there, he's been in there five days without answering a door, and he's not a well man. That's the harm I'm worried about.",
      },
      p_who: {
        text: "Just Ronald, as far as I know. He lives alone. I'm here with Maureen from number 5 — she's the one that rang us this morning, she's been worried since the weekend. So the two of us outside, and him inside, we think.",
      },
      p_description: {
        text: "Ronald Casey. Seventy-four, white, grey hair, thin — he's lost weight this year. Uses a stick in the flat and a mobility scooter outside, and the scooter's still under its cover by the front door, which it never is on a Monday. I've not seen him myself since August.",
      },
      p_direction: {
        text: "He's not gone anywhere. That's the point. The scooter's here, his coat's — Maureen says she can see his coat on the hook through the letterbox. He doesn't go out without the scooter and he doesn't go out without the coat.",
      },
      p_drink: {
        text: "No. Not that I know of, and the neighbour says he doesn't drink, he's not allowed with his chest. No drugs. He's on a lot of medication but it's all prescribed.",
      },
      p_known: {
        text: "He's our tenant — I know him from his file and from a couple of visits. Sole tenant since 2011. COPD, home oxygen, a repairs visit in August for his boiler. He's a quiet man, keeps himself to himself. Maureen's known him fifteen years.",
      },
      p_vulnerable: {
        text: "Yes — very. He's seventy-four, he's got COPD on home oxygen, he lives alone, and there's no family we know of. If he's on the floor in there he's been on it a long time. There's no children involved, nobody else at risk — it's him.",
        tone: "urgent",
        followUps: [
          {
            id: "p_vulnerable_smell",
            text: "Is there any smell at the door, or anything at the windows — flies, anything like that?",
            answer: {
              text: "There's… there's a smell at the letterbox, yes. I didn't want to say it in front of Maureen. It might be the bins, the bin store's right by his door. And there's a few flies on the inside of the kitchen window. I've seen that before, in this job.",
            },
          },
        ],
      },
      p_where: {
        text: "Flat 6, Milner Court, Peel Green Road, Peel Green, Eccles. M30 7HR. It's the low block set back from the road; his is the end flat on the ground floor, east end, the one with the ramp. I'm stood on the ramp.",
      },
      p_safe: {
        text: "Yes, I'm fine. I'm outside the door with Maureen. Nobody's bothering us. It's not that kind of job.",
      },
      p_seen: {
        text: "I've seen the post and the milk and the curtains myself, and I've done the knocking and the phoning myself. The not-seen-since-Thursday is Maureen — she lives next door and she sees him every day, normally. I believe her.",
      },
      p_details: {
        text: "Femi Adebayo. A-D-E-B-A-Y-O. Housing officer, Barton Brook Housing. This is my work mobile, 07700 900684. I'll stay here until somebody comes — I'm not leaving the door.",
      },
    },
    interjections: [
      {
        atSec: 40,
        text: "Maureen's just said he had a bad chest last week — she heard him coughing through the wall on Wednesday night, and then nothing after.",
      },
      {
        atSec: 110,
        text: "I know you've got your Right Care Right Person thing. I've rung the GP and the hospital and the out-of-hours and nobody can get through this door except you. I'm not asking for a welfare check, I'm asking for a door.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 180,
        text: "I've shouted through the letterbox again. Nothing. The hall light's on. In daylight.",
      },
      {
        atSec: 260,
        text: "Thank you. I'll stay at the door. Tell them about the oxygen before they go in, please — and there's a ramp, they can get the car right up.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Thank you. I'll be on the ramp at the door. I'll keep Maureen with me.",
    preArrival: [
      {
        id: "stay",
        key: true,
        text: "Stay at the door, keep trying his phone every couple of minutes, and tell me if you hear anything at all from inside.",
        reply: "Will do. I've got both numbers up.",
      },
      {
        id: "noentry",
        text: "Don't try to force the door yourself, and don't let anyone else. The officers will do that lawfully and safely.",
        reply: "I wasn't going to. It's a uPVC door, I'd not get through it anyway.",
      },
      {
        id: "oxygen",
        key: true,
        text: "Nobody smokes near that door and nobody lights anything — there's oxygen inside.",
        reply: "Understood. Maureen's just put hers out.",
      },
      {
        id: "meet",
        text: "When the officers arrive, meet them on the path and tell them exactly what you've told me — the oxygen, the last time he was seen, and the back gate.",
        reply: "I will.",
      },
    ],
  },
};
