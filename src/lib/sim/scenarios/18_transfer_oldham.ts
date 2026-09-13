import type { Scenario } from "../incident_types";

// Scenario 18 — interfacility transfer, Oldham. Category 4.
//
// Nothing happens in this job. That is the job.
//
// A stable patient needs moving between hospitals. It is not urgent, it
// is not dramatic, and it will take an ambulance off the board for the
// best part of an hour of compressed time — longer than any other
// scenario here except the moorland fire. This is how resources actually
// disappear in an ambulance service: not to disasters, but to necessary,
// boring work that somebody has to do.
//
// The decision is whether to commit a DCA to it now, or hold it and let
// the hospital wait. Both are defensible. What is not defensible is
// committing your last ambulance to it and then taking a cardiac arrest.
//
// There is deliberately no scene drama and one informant who is a nurse
// with a clipboard, because the pressure is entirely on the board.
//
// FICTIONAL: the patient, the ward and the nurse. The Royal Oldham and
// Wythenshawe are real hospitals; the transfer is not.

export const scenario18: Scenario = {
  id: "18",
  slug: "18_transfer_oldham",
  title: "Transfer — Royal Oldham to Wythenshawe",
  type: "ambulance_transfer",
  patch: "Eastern",
  severity: "low",
  trigger:
    "Category 4 — planned interfacility transfer. Stable patient, ward to ward, no clinical escort required. Receiving unit expecting them",

  location: {
    address: "Ward 12, The Royal Oldham Hospital, Rochdale Road, Oldham",
    postcode: "OL1 2JH",
    coords: { lat: 53.5478, lng: -2.1123 },
  },

  property: {
    class: "Acute hospital — transfer from a ward, not an emergency department",
    occupants: "Ward staff and the patient. Bed ready at the receiving unit",
    vulnerabilities: [
      "Stable, but the receiving unit has a bed held and it will not be held indefinitely",
      "The journey is the job — Oldham to Wythenshawe across the whole force area",
    ],
    access:
      "Ambulance entrance off Rochdale Road, ward 12 on level 3. Lift access; porter will meet the crew",
    knownHazards: ["None"],
    firstDueStationId: "A-OLD",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — routine hospital transfer.",
      "Ward to ward. No clinical escort required; the crew take the handover from the nurse in charge.",
      "Receiving unit is holding a bed and has been told a crew is coming.",
    ],
  },

  methane: {
    M: "No",
    E: "Ward 12, The Royal Oldham Hospital, OL1 2JH",
    T: "Planned transfer — one stable patient, ward to ward",
    H: "None",
    A: "Ambulance entrance off Rochdale Road; ward 12, level 3, porter to meet",
    N: "One — stable, no escort required",
    emergencyServices: "Ambulance only",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-OLD",
      notes:
        "One DCA, and it is gone for the duration. Oldham to Wythenshawe and back is most of what is left of the turn",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "no target — this is not an emergency" },
      { metric: "C4 response", target: "within 180 minutes" },
      {
        metric: "Resource judgement",
        target: "not committed while it would leave the patch without an emergency ambulance",
      },
      {
        metric: "Proportionate response",
        target: "one DCA — no RRV, no HART, nothing on blue lights",
      },
    ],
    lesson:
      "Nothing happens on this job and that is what makes it worth having. It is not urgent and it is not interesting, and it will take an ambulance off your board for the best part of an hour. Resources do not mostly disappear into disasters — they disappear into necessary, boring work. Hold it if the board is thin. Just do not commit your last ambulance to it and then take an arrest.",
  },

  scene: {
    viewBox: { x: -60, y: -40, width: 120, height: 80 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -24, y: -30, w: 52, h: 38 }, kind: "target", label: "Royal Oldham — ward block" },
      { shape: { x: 32, y: -30, w: 24, h: 24 }, kind: "neighbour", label: "Outpatients" },
    ],
    roads: [
      { shape: { x: -30, y: 8, w: 22, h: 12 }, kind: "driveway", label: "Ambulance entrance" },
      { shape: { x: -60, y: 22, w: 120, h: 2 }, kind: "pavement" },
      { shape: { x: -60, y: 24, w: 120, h: 10 }, kind: "road", label: "Rochdale Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -20, y: 13 }, kind: "car" },
      { pos: { x: -8, y: 13 }, kind: "car" },
      { pos: { x: 40, y: 28 }, kind: "lamppost" },
    ],
    hazards: [],
    casualties: [
      {
        id: "cas-18-transfer",
        label: "Transfer patient — stable, on ward 12",
        pos: { x: 0, y: -18 },
        severity: "walking",
        discoverAfterMinBa: 0,
        clinical: {
          // Entirely unremarkable, deliberately. A stable transfer patient
          // has normal observations, which is the whole reason this job
          // keeps getting deferred.
          vitals: { rr: 16, spo2: 97, hr: 78, bpSys: 128, bpDia: 76, gcs: 15, temp: 36.8, bm: 5.6 },
          ageYears: 68,
          presumedCondition: "Stable — ward to ward transfer, no escort required",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          criticalInterventions: [],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Ambulance entrance", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Outpatients", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Ward block rear", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Service road", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "nurse-first",
      atSec: 8,
      text: "Ward 12 at the Royal Oldham. We've a transfer booked to Wythenshawe — he's stable, ready to go, no escort needed. Bed's held at the other end. Any idea on a crew?",
      tone: "info",
    },
    {
      id: "bed-pressure",
      atSec: 300,
      probability: 0.7,
      text: "Just chasing — they're asking at the other end because they want the bed. And I've got somebody in A&E waiting on his once he goes.",
      tone: "info",
    },
    {
      id: "still-waiting",
      atSec: 900,
      probability: 0.6,
      text: "Sorry, me again. He's been sat in the chair with his bag packed since ten. Is anybody coming today?",
      tone: "urgent",
    },
  ],

  // The call as Priya has it: on the ward phone at the nurses' station,
  // the transfer letter under one hand and a buzzer going in bay three,
  // Mr Holt waving at her from the day room. She is not asking for blue
  // lights. She is asking for a time, and she has asked once already.
  call: {
    caller: {
      name: "Priya Chauhan",
      phone: "0161 496 0180",
      relation: "Nurse in charge, Ward 12 — the sending ward",
      where: "Nurses' station, Ward 12, level 3, The Royal Oldham Hospital",
      line: "landline",
      state: "calm",
    },
    opening:
      "Hiya. Ward 12 at the Royal Oldham, it's Priya, I'm nurse in charge. I'm ringing about our transfer to Wythenshawe — Mr Holt. It went on this morning and nobody's rung us back with a time. He's stable, he's dressed and ready, no escort needed, and they're holding a bed for him at the other end. I just need to know whether we're getting a crew and roughly when.",
    deflection: "I've given you all that, love. It's a ward-to-ward transfer, I'm not asking for blue lights. Have you got a crew for us or not?",
    reassurance: {
      text: "Priya, I know you've a bed to turn round and a patient sat waiting. I'll get you a crew and a time as soon as I've one to give you.",
      reply: "Fair enough. Thanks. Sorry — long shift.",
    },
    answers: {
      a_conscious: {
        text: "Yes. Fully. He's doing the crossword. GCS fifteen, if you want it writing down.",
      },
      a_breathing: {
        text: "Normally. Room air, sats ninety-seven, resps sixteen. He's not on oxygen, he's not on anything.",
      },
      a_happened: {
        text: "Nothing's happened — that's rather the point. He's a planned transfer. He came in to us with his chest a fortnight ago, he's been sorted out, and the team at Wythenshawe want him on their ward for the next bit because it's their speciality, not ours. He's been stable four days. Ward to ward, bed to bed.",
        followUps: [
          {
            id: "a_happened_stretcher",
            text: "Does he need a stretcher, or can he sit?",
            answer: {
              text: "He'll sit. He walks with a stick — he's been down to the shop and back this morning. Carry chair's fine, or he'll walk to it. He'd rather walk, to be honest with you.",
            },
          },
          {
            id: "a_happened_escort",
            text: "Is anyone travelling with him?",
            answer: {
              text: "No escort — he doesn't need one, the consultant's signed that off. His notes go with him and the transfer letter's in the front. His wife's driving down separately to meet him there.",
            },
          },
        ],
      },
      a_when: {
        text: "The booking went on at nine this morning, off the ward round. He's been on your list since then. I've got the reference number here if it helps you find it.",
      },
      a_now: {
        text: "He's fine. Pink, warm, dry, chatting. Obs are all normal, I've just done them — one twenty-eight over seventy-six, pulse seventy-eight, temp thirty-six eight. If he looked any different I'd not be sending him.",
      },
      a_bleeding: {
        text: "No. Nothing like that. Nothing dressed, nothing draining, no lines in — I took his cannula out this morning so he'd not travel with it.",
      },
      a_age: {
        text: "Sixty-eight.",
      },
      a_history: {
        text: "It's all in the notes and on the transfer letter — the crew get a proper handover from me when they get up here. He's on his usual tablets, he's had his lunchtime ones, and nothing's due before he gets there. Allergies — penicillin, it's on his wristband.",
      },
      a_count: {
        text: "Just the one. Mr Dennis Holt. One patient, one bed.",
      },
      a_danger: {
        text: "It's a hospital ward, love. It's as safe as it gets. The lift's working, before you ask.",
      },
      a_access: {
        text: "Ambulance entrance off Rochdale Road — the one round the side, not the main front. We're Ward 12, level three, and the big lift's straight opposite the doors. I'll have a porter down at the entrance to meet them and bring them up. Just get the crew to ring the ward when they're five minutes off and I'll have him ready.",
        followUps: [
          {
            id: "a_access_bay",
            text: "Is there somewhere for them to leave the vehicle?",
            answer: {
              text: "There's the bays outside the entrance. If A&E have got them all, they can pull onto the ambulance-only bit by the doors — the porters sort that, it's not a problem for a transfer.",
            },
          },
        ],
      },
      a_with: {
        text: "I'm at the desk. He's in the day room, twenty feet away, I can see him from here — he's waving at me now, he knows I'm ringing about him.",
      },
      a_instructions: {
        text: "I'm a nurse, love. I think we're alright. Tell the crew to come to the desk when they get up here and I'll hand over.",
      },
      a_details: {
        text: "Priya Chauhan, nurse in charge, Ward 12. This is the ward phone — 0161 496 0180. Ask for me, or whoever's on the desk.",
      },
    },
    interjections: [
      {
        atSec: 60,
        text: "Sorry — hang on. Bay three's buzzing, can somebody — thanks. Sorry. Where were we.",
      },
      {
        atSec: 130,
        text: "Is there any chance of a time on it, roughly? Even 'this afternoon' would do. I need to know whether to send him for his dinner or keep him by the door.",
        requiresOpened: false,
      },
      {
        atSec: 200,
        text: "Right, that's grand. I'll ring the porters and get his notes photocopied. Tell the crew to ring the ward when they're five minutes off and he'll be sat by the lift.",
        requiresOpened: true,
      },
    ],
    drops: {
      atSec: 240,
      text: "Right, I've got to go, love — drugs round. You've got the ward number. Ring us with a time, or I'll ring you. Ta-ra.",
    },
    onDispatch: "Lovely. Thank you. I'll tell him — he'll be made up. Get them to ring the ward on the way.",
  },
};
