import type { Scenario } from "../incident_types";

// Scenario 60 — a resident on the floor at a care home, Flixton. The
// fall that needs a lift, not an ambulance.
//
// Tracy Bould is the senior carer on nights at Woodsend Lodge. At ten
// past six one of her carers found Edna Pollitt, eighty-eight, sat on
// her bedroom carpet with her back against the bed, having stood up
// from the commode and slid down. Edna is alert, chatting, telling
// everyone off for fussing. Nothing hurts. She did not hit her head.
// She cannot get herself up, and the home's staff are neither trained
// nor equipped to lift her from the floor — which is correct, and is
// why the lifting service exists.
//
// A non-injured faller who is alert, pain-free, did not strike her head
// and has been down under an hour is not an emergency ambulance. It is
// the Urgent Community Response falls service: a two-hour lifting
// response with a clinical check, a referral to the falls team and no
// A&E trolley at the end of it. The call closes at the desk with the
// staff told what to do in the meantime — keep her warm and
// comfortable on the floor, do not lift, and ring 999 the moment she
// is drowsy, cold, in pain or cannot be roused.
//
// The one question that changes the answer is not "when did you find
// her" but "when was she last seen up". About one run in seven the
// night log says four o'clock, not half past five: she has been on that
// floor for over two hours and she is getting cold, and a long lie at
// eighty-eight is rhabdomyolysis, pressure damage and hypothermia. That
// run is a Category 2 and the disposal does not hold for it
// (`unlessVariantIds`) — closing it at the desk that night is the
// setback.
//
// FICTIONAL: Woodsend Lodge, its staff and its residents. Woodsend Road,
// Flixton, is real. A-URM is real from nwas_stations.json.

export const scenario60: Scenario = {
  id: "60",
  slug: "60_care_home_fall_flixton",
  title: "Care home fall, no injury — female 88, Flixton",
  type: "ambulance_fall_no_injury",
  patch: "Southern",
  severity: "low",
  trigger:
    "Care home — resident, female 88, found on her bedroom floor beside the bed at 06:10. Alert and talking, no pain, no injury seen, did not hit her head. Cannot get herself up; staff not able to lift her. On the floor about ten minutes. Senior carer ringing",

  location: {
    address: "Woodsend Lodge care home, Woodsend Road, Flixton, Urmston",
    postcode: "M41 8QL",
    coords: { lat: 53.442, lng: -2.388 },
  },

  property: {
    class: "Residential care home — 38 beds, two storey, purpose-built",
    occupants: "38 residents and three night staff; the resident in her own ground-floor room",
    vulnerabilities: [
      "Resident is 88 with osteoporosis and mild dementia — a fall with no injury found is still a fall in a frail patient",
      "Staff are not trained or equipped to lift from the floor — the home has a hoist but she is not assessed for it, and no lifting cushion",
    ],
    access: "Main entrance on Woodsend Road, keypad — staff will open. Room 7, ground floor, first corridor on the left",
    knownHazards: ["None"],
    firstDueStationId: "A-URM",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — care home, registered with CQC. Fire plan held by the home.",
      "NWAS falls pathway: a non-injured faller who is alert, has no pain, did not strike their head and has been down under an hour goes to the Urgent Community Response falls service — a two-hour lifting response with a clinical check — rather than an emergency ambulance. The ambulance is for injury, a long lie, or a change in the patient.",
      "Long lie: more than an hour on a hard floor at 88 is rhabdomyolysis, pressure damage and hypothermia. Confirm when she was last seen up, not when she was found.",
      "Care homes cannot lift a resident from the floor without equipment and an assessment, and should not — that is why the lifting service exists.",
    ],
  },

  methane: {
    M: "No",
    E: "Woodsend Lodge care home, Woodsend Road, Flixton, M41 8QL — room 7, ground floor",
    T: "Fall from standing, no injury found — alert, talking, cannot rise. Community line",
    H: "None",
    A: "Main entrance keypad on Woodsend Road; staff to open. Room 7 first left on the ground floor",
    N: "One — female, 88, on the floor, uninjured",
    emergencyServices: "None deployed — falls response (lifting service) referred; GP informed",
  },

  // One slot, held. A non-injured faller with staff beside her goes to
  // the lifting service; the slot is for the run where she does not.
  pda: [
    {
      id: "dca1",
      label: "Ambulance (held, not sent)",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-URM",
      notes:
        "Not for this fall as described. Held for the picture changing — pain in the hip or back, a head strike, a long lie, going cold or drowsy. Then it is a Category 2 and this goes; a non-injured faller with staff beside her goes to the lifting service",
    },
  ],

  evaluation: {
    targets: [
      {
        metric: "Disposal",
        target: "closed at the desk — falls response (lifting service) within two hours; no ambulance",
      },
      {
        metric: "Long lie excluded",
        target: "asked when she was last seen up, not when she was found",
      },
      {
        metric: "Injury excluded",
        target: "pain, head strike, loss of consciousness and movement of all limbs asked before the call closes",
      },
      {
        metric: "Advice",
        target:
          "staff told to keep her warm and comfortable on the floor, not to lift, and to ring 999 if she becomes drowsy, cold, in pain or cannot be roused",
      },
      {
        metric: "Change of picture",
        target: "in the run where it was a two-hour lie: regraded Category 2 and a DCA mobilised within 90 seconds",
      },
    ],
    lesson:
      "Care homes ring about falls every night, and most of them are this: a resident on the carpet, uninjured, alert, cross about the fuss, and a staff team who are rightly not allowed to lift her. An emergency ambulance for that is a crew off the road for an hour, an eighty-eight-year-old on a trolley in a corridor at seven in the morning, and nothing done that a lifting service would not have done better and sooner. The right closure is the falls response — two hours, a lift, a check, a referral — with the staff told how to keep her in the meantime and exactly what would make it a 999 call. The question that decides it is not when she was found but when she was last seen up. One run in seven the night log says four o'clock, and the same woman on the same carpet is a Category 2: two hours down at eighty-eight is muscle breakdown, pressure damage and a core temperature on its way to the floor with her. Ask the question, and listen when the answer changes.",
  },

  callGrade: {
    scale: "ambulance_arp",
    grade: 3,
    standardMinutes: 120,
    basis:
      "NHS Pathways: a fall with no injury, patient alert and on the floor unable to get up, reaches a Category 3 urgent response on the ARP scale — 90th centile 120 minutes, no mean standard — and the falls pathway takes a non-injured faller in a care setting to the Urgent Community Response falls lifting service inside two hours instead of a double-crewed ambulance",
  },

  channel: "community",

  disposal: {
    noDeployment: true,
    outcome: "falls_team",
    unlessVariantIds: ["long-lie"],
    basis:
      "A non-injured fall in a care home — alert, no pain, no head strike, down under fifteen minutes, warm and comfortable with staff beside her — is the case the Urgent Community Response falls service exists for: a two-hour lifting response that gets her up, checks her over and refers her to the falls team, without an emergency ambulance and the A&E trolley that follows it",
  },

  scene: {
    viewBox: { x: -40, y: -30, width: 80, height: 60 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -30, y: -24, w: 60, h: 22 }, kind: "target", label: "Woodsend Lodge — ground floor; room 7 at the west end" },
      { shape: { x: -40, y: -24, w: 8, h: 22 }, kind: "neighbour", label: "Bungalows" },
      { shape: { x: 32, y: -24, w: 8, h: 22 }, kind: "neighbour", label: "Bungalows" },
    ],
    roads: [
      { shape: { x: -10, y: -2, w: 20, h: 8 }, kind: "driveway", label: "Car park / drop-off" },
      { shape: { x: -40, y: 6, w: 80, h: 2 }, kind: "pavement" },
      { shape: { x: -40, y: 8, w: 80, h: 8 }, kind: "road", label: "Woodsend Road" },
      { shape: { x: -40, y: 16, w: 80, h: 14 }, kind: "garden", label: "Fields" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -5, y: 2 }, kind: "car" },
      { pos: { x: 5, y: 2 }, kind: "car" },
      { pos: { x: 0, y: -3 }, kind: "other", label: "Main entrance — keypad" },
      { pos: { x: -25, y: 7 }, kind: "lamppost" },
    ],
    hazards: [],
    casualties: [
      {
        id: "cas-60-pollitt",
        label: "Female, 88 — on the floor beside her bed, room 7, uninjured",
        pos: { x: -24, y: -12 },
        severity: "walking",
        discoverAfterMinBa: 0,
        clinical: {
          // Sat against her bed with a pillow and a blanket, warm, cross.
          vitals: { rr: 18, spo2: 95, hr: 84, bpSys: 142, bpDia: 80, gcs: 15, temp: 36.4, bm: 6.0 },
          ageYears: 88,
          presumedCondition: "Mechanical fall from standing beside the bed, no injury found — unable to rise without assistance",
          redFlags: [],
          preferredDestination: "non_convey",
          criticalInterventions: ["warming"],
        },
      },
    ],
    variants: [
      {
        id: "long-lie",
        label: "Tonight the night log says four o'clock, not half past five — she has been on that floor for over two hours, and she is cold",
        probability: 0.15,
        casualty: {
          "cas-60-pollitt": { severity: "serious", label: "Female, 88 — on the floor over two hours, cold and quiet" },
        },
        clinical: {
          "cas-60-pollitt": {
            vitals: { rr: 20, spo2: 93, hr: 58, bpSys: 104, bpDia: 62, gcs: 14, temp: 34.6, bm: 5.1 },
            presumedCondition: "Long lie — over two hours on a hard floor at 88, hypothermic and dehydrated; rhabdomyolysis and pressure damage likely",
            redFlags: [],
            preferredDestination: "nearest_a_e",
            criticalInterventions: ["warming", "iv_access", "fluids"],
          },
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Woodsend Road / main entrance", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · East wing", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear garden", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · West wing / room 7", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "carer-first",
      atSec: 5,
      text: "It's Edna in room 7 — she's on the floor beside her bed. She's fine, she's chatting, nothing hurts. We just can't get her up.",
      tone: "info",
    },
    {
      id: "obs",
      atSec: 60,
      text: "We've done her obs. Pulse 84, sats 95, she's warm, she's got all her colour. She's asking for a brew.",
      tone: "info",
    },
    {
      id: "long-lie",
      atSec: 120,
      requiresVariantIds: ["long-lie"],
      text: "Hang on — I've just read the night log properly. Her last check was signed at four, not half five. She could have been down two hours. She's gone quiet and she says she's cold.",
      tone: "urgent",
      effect: {
        regrade: "CAT 2",
        basis: "Over two hours on a hard floor at 88 and going cold — a long lie is an ambulance, not a lifting service",
        pulseCritical: true,
      },
    },
    {
      id: "settled",
      atSec: 180,
      excludesVariantIds: ["long-lie"],
      text: "We've got a pillow behind her and a blanket on her and the little heater on. She's comfy. She's telling Kirsty about the war.",
      tone: "info",
    },
    {
      id: "slow-response",
      atSec: 900,
      delayThresholdSec: 1800,
      requiresVariantIds: ["long-lie"],
      text: "She's shivering and she's gone very quiet. Her hands are freezing. How long are they going to be?",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  // The call as Tracy has it: in the doorway of room 7 on the home's
  // cordless, Kirsty sat on the carpet holding Edna's hand, the night
  // log under her arm. She has done this before and she knows what she
  // is asking for; she is not sure which number gives it to her.
  call: {
    caller: {
      name: "Tracy Bould",
      phone: "0161 496 0530",
      relation: "Senior carer on nights at Woodsend Lodge",
      where: "Room 7 doorway, on the home's cordless phone; the resident on the floor beside her bed with a carer sat with her",
      line: "landline",
      state: "calm",
    },
    opening:
      "Hiya, it's Woodsend Lodge, the care home on Woodsend Road in Flixton. I'm the senior on nights. We've got a resident on the floor — Edna, she's eighty-eight. She's gone to use the commode and ended up on the floor beside the bed. She's fine, she's chatting, she's not hurt anywhere that we can see, but she can't get herself up and we can't lift her. I know you're busy, I'm not sure if it's you or the falls people.",
    answers: {
      a_conscious: {
        text: "Yes — fully. She's talking to me now, she's telling Kirsty off for fussing. She knows where she is, she knows what day it is — well, as much as she ever does, she's got a bit of dementia, but she's herself.",
      },
      a_breathing: {
        text: "Normally. She's not short of breath, she's not wheezy, she's talking in full sentences. Her colour's good.",
      },
      a_happened: {
        text: "She's got up to use the commode — she does, about six, every morning — and we think she's sat on the edge of the bed, stood up and her legs have gone. She's sort of slid down. Kirsty found her at ten past six sat on the floor with her back against the bed, legs out in front. She's not hit anything on the way down that we can see — there's nothing near her to hit.",
        followUps: [
          {
            id: "a_happened_last_seen",
            text: "When was she last seen up and well before she was found?",
            answer: {
              text: "Half past five. Kirsty did her round at half five, looked in, she was asleep in bed. Found her at ten past six. So forty minutes at the outside, and she says she'd only just gone down when Kirsty came in.",
              byVariant: {
                "long-lie": "Well — I've just checked the night log while I've been talking to you. Her last check was signed at four, not half five. The half-five one's not signed. So she could have been down since four. Over two hours. She did say she was cold.",
              },
            },
          },
        ],
      },
      a_when: {
        text: "We found her at ten past six, so about ten, fifteen minutes on the floor. She says it had just happened.",
      },
      a_now: {
        text: "She's fine. She's sat up against the bed with a pillow behind her and a blanket over her legs. Good colour, warm, chatting. She's asking for a brew, which I've said no to until somebody tells me she can.",
        byVariant: {
          "long-lie": "She's gone a bit quiet, actually, since I've been on the phone. She was chatty and now she's just — she's shivering. Her hands are cold. Kirsty's put another blanket on her.",
        },
      },
      a_bleeding: {
        text: "No. No bleeding, no cuts, no bruising coming up anywhere. We've had a look at her hips and her back, we've asked her to point to anything that hurts and she says nothing hurts. Her legs are both the same length, both feet pointing the right way.",
        followUps: [
          {
            id: "a_bleeding_head",
            text: "Did she hit her head, and did she lose consciousness at all?",
            answer: {
              text: "No. She says she just slid down. There's nothing near her to hit, the bedside cabinet's the other side. No bump, no graze, and she's been awake the whole time, she says, and Kirsty found her awake and talking.",
            },
          },
        ],
      },
      a_age: {
        text: "Eighty-eight. Eighty-nine in December.",
      },
      a_history: {
        text: "Osteoporosis — she's on alendronate. Mild dementia, vascular. Blood pressure tablets, amlodipine. A bit of heart failure, furosemide in the morning. No diabetes. She had a fall last year, she fractured her wrist in that one, that's why we're careful. No allergies. She's on the falls register with the GP.",
        followUps: [
          {
            id: "a_history_blood",
            text: "Is she on any blood thinners — warfarin, apixaban, anything like that?",
            answer: {
              text: "No. We did check. Just aspirin, the small one, 75. No warfarin or anything.",
            },
          },
        ],
      },
      a_count: {
        text: "Just Edna. Everyone else is asleep. Three of us on.",
      },
      a_danger: {
        text: "It's her bedroom, it's fine. Carpet floor, warm room — the heating's on. Kirsty's sat on the floor with her.",
      },
      a_access: {
        text: "Main entrance on Woodsend Road, there's a keypad — ring the bell and we'll let you in, or I'll have someone stood at the door. She's in room 7, ground floor, first corridor on your left. Wide doors, it's a care home.",
      },
      a_with: {
        text: "Kirsty's with her, one of my carers, she's sat on the floor with her holding her hand. I'm at the door with the phone. I'm not leaving her.",
      },
      a_instructions: {
        text: "Yes. Yes, go on. We've done her obs — do you want them? Pulse 84, sats 95, she's warm. Tell me what you want us to do.",
      },
      a_details: {
        text: "Tracy Bould. B-O-U-L-D. Senior carer, Woodsend Lodge, Woodsend Road, Flixton, M41 8QL. This is the office phone, 0161 496 0530. Edna's date of birth is the 3rd of December 1937.",
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "Kirsty, put the little heater on for her, love. — Sorry. She's fine, she's asking what all the fuss is about.",
      },
      {
        atSec: 100,
        requiresVariantIds: ["long-lie"],
        text: "Hang on — Kirsty's just said. She says on the half-five round she didn't go in, she just looked at the door because the light was off. So the last time anyone actually saw Edna in bed was four. She's — she's been down since four, could be. She's gone very quiet.",
        tone: "urgent",
        effect: {
          regrade: "CAT 2",
          basis: "Over two hours on a hard floor at 88 and going cold — a long lie is an ambulance, not a lifting service",
        },
      },
      {
        atSec: 160,
        excludesVariantIds: ["long-lie"],
        text: "She's asking for her glasses and the paper. I'd say she's alright.",
      },
      {
        atSec: 220,
        excludesVariantIds: ["long-lie"],
        requiresOpened: false,
        text: "Last time we rang about a fall we had an ambulance here in six hours and she was fine the whole time, so if there's a quicker way of getting her up I'm all for it.",
      },
      {
        atSec: 300,
        requiresOpened: true,
        text: "They're coming? Right. I'll put the entrance light on and prop the door. Kirsty, they're coming, love.",
      },
    ],
    onDispatch: "Right. Thank you. I'll have the door open and her file ready.",
  },
};
