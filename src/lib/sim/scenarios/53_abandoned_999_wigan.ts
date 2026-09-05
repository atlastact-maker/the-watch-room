import type { Scenario } from "../incident_types";

// Scenario 53 — abandoned 999 from a mobile, Kendal Street, Wigan.
//
// The job where nobody has spoken to the desk. A mobile rings 999, the
// BT operator hears people and puts it through, the call handler gets a
// raised male voice and a door, and the line drops. Call-back goes to
// voicemail. What the operator has is a handset location — a circle on
// a street, not a house — and a question: pocket dial, or a domestic
// where the victim could not speak?
//
// The mechanics are the call-backs. They arrive as beats in the call
// handler's voice: voicemail, ringing out, the number matching a
// previous log and turning the circle into a name and a door, and then
// the third call-back,
// which goes one of two ways. About four times in ten a coherent woman
// answers, gives her own name unprompted and accounts for the whole
// thing (a child with the phone), and the job can be resulted. The rest
// of the time she whispers an address and asks for no sirens, and it is
// a domestic with the victim locked in a bathroom.
//
// Graded 2 at the point of answer: attend the plot within the hour
// unless a call-back reaches the caller and she accounts for it. No
// `disposal` is set, deliberately. The closable branch is the minority
// outcome, and even when it fires the closure rests on the call
// handler's judgement that it was the woman herself, coherent and
// unprompted — not on the call having been a false alarm from the
// start. A job that is closable some of the time is a deploy job.
//
// The lesson is about what you do while you wait. A car sent at Grade 2
// while the call-backs run can be turned round on a clean answer; a car
// held for the outcome cannot get the minutes back.
//
// FICTIONAL: everyone in it, the house number and the vehicle. Kendal
// Street in Wallgate, Wigan is real (OSM residential street, postcode
// WN6 7DQ confirmed on postcodes.io); its built form is described only
// as houses both sides because that is all the mapping says. The name
// and door come from the call handler's own log search on the number —
// a network subscriber check is requested but does not come back inside
// the timeline, because in real life it would not.
// Handset-location (AML) accuracy and the Silent Solution mechanism are
// described from public BT / police.uk material, not from any GMP
// document — see the PRI items.

export const scenario53: Scenario = {
  id: "53",
  slug: "53_abandoned_999_wigan",
  title: "Abandoned 999 call — mobile, Wigan",
  type: "police_abandoned_999",
  patch: "Western",
  severity: "moderate",
  trigger:
    "999 from a mobile, nothing said to the call handler. Background: a raised male voice, a door, then the line dropped. Call-back to voicemail. Handset location plots to Kendal Street, Wigan, radius about 30 m",

  location: {
    // The AML plot centre, on the street. Not a house.
    address: "Kendal Street, Wallgate, Wigan — handset location, approximate",
    postcode: "WN6 7DQ",
    coords: { lat: 53.5488, lng: -2.6412 },
  },

  property: {
    class:
      "Residential street — houses both sides. The location is a handset plot with a radius of about 30 m, covering roughly a dozen addresses; it is not a house number until a search on the number makes it one",
    occupants:
      "Unknown. One caller who did not or could not speak; a man's raised voice heard on the line; a door",
    vulnerabilities: [
      "The caller may be someone who cannot speak freely — a domestic where the victim has dialled and hidden the phone",
      "Children may be in the house",
      "Every call-back rings a phone that may be in the wrong hands",
    ],
    access:
      "Kendal Street is reached from the Wallgate side of the town centre. Approach without sirens if this becomes a domestic in a house — a caller who whispers has usually asked for it",
    knownHazards: [
      "Unknown male, agitated — heard, not seen",
      "The plot is approximate. Indoors and between houses the handset fix can be worse than the radius it reports",
    ],
    firstDueStationId: "MP-WIG",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — the location is a handset plot, not an address. AML (Advanced Mobile Location) sends the phone's own satellite / Wi-Fi fix to the 999 platform when the call is made; this one arrived with a radius of about 30 m. The circle is where to start, not where to stop.",
      "Silent 999s from mobiles are normally filtered by BT's Silent Solution unless the caller presses 55. This call was put through because the BT operator could hear people on the line — it is a connected call with content, and it is graded as one.",
      "GMP's grading policy opens an abandoned 999 as a Police Administration (PA) record while THRIVE is applied. The raised voice and the door heard on this one take it to a Grade 2 attendance unless a call-back accounts for it.",
      "The number has gone two ways: an urgent subscriber check to the network, which takes longer than this job has, and the call handler's own search of previous logs, which is the quick route to a name and a door if the number has ever been given to us before. Local knowledge: one previous log on Kendal Street this year, March — a neighbour reporting shouting, attended, verbal only.",
    ],
  },

  methane: {
    M: "No",
    E: "Handset plot — Kendal Street, Wallgate, Wigan, WN6 7DQ. Radius about 30 m. A phone location, not yet an address",
    T: "Abandoned 999 from a mobile — raised male voice and a door heard, then the line dropped; call-back to voicemail. Possible domestic with a caller who cannot speak",
    H: "Unknown male, agitated. Children may be present. Every call-back rings a phone that may be in his hands",
    A: "Kendal Street from the Wallgate side. No sirens on the street once it is a domestic in a house",
    N: "Unknown — nobody has spoken to us yet. Number being searched against previous logs; network subscriber check requested",
    emergencyServices: "Police. Ambulance only if the call-back or the door says injuries",
  },

  pda: [
    {
      id: "police1",
      label: "Police — to the plot",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      preferredStationId: "MP-WIG",
      notes:
        "To the handset plot at Grade 2 while the call-backs run. A car that is moving can be turned round on a clean call-back; one that waited for the outcome cannot get the minutes back",
    },
    {
      id: "police2",
      label: "Police — second unit",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      preferredStationId: "MP-WIG",
      notes:
        "A domestic where the victim cannot speak is two cars at the door, not one — a pair for him, a pair for her and the children. Stand it down if she herself accounts for the call",
    },
  ],

  evaluation: {
    targets: [
      {
        metric: "Time-to-mobilise",
        target: "< 90 seconds — a car sent at Grade 2 while the call-backs run, not after them",
      },
      {
        metric: "Call-back outcome acted on",
        target:
          "clean answer from the woman herself, giving the name on the log: car stood down; whisper: second unit sent and the job treated as a Grade 1 domestic",
      },
      {
        metric: "Approach",
        target: "no sirens on Kendal Street once the caller has asked for none",
      },
      {
        metric: "Attendance",
        target:
          "first unit at the plot well inside the one-hour Grade 2 standard — minutes, not the hour, once she has whispered",
      },
    ],
    lesson:
      "Nobody has spoken to you, so the question is not whether it was a pocket dial; it is what you do while you find out. Send the car at Grade 2 and let the call-backs catch it up. A car that is moving can be turned round on a clean answer — and clean means the woman herself, coherent, unprompted, giving the name on the log and accounting for what was heard. A man who says she is in the bath is not a clean answer. A car held for the outcome cannot get those minutes back, and more often than not the third call-back is a woman whispering an address from a locked bathroom. When it is, it is a domestic with a victim who cannot speak: two cars, no sirens, and stop ringing the phone.",
  },

  // Top-down scene — a 70 m stretch of Kendal Street running north–south,
  // houses both sides. The handset plot sits on the carriageway at the
  // origin; No. 31, the address on the March log, is on the west
  // side inside the circle. Everything drawn is schematic.
  scene: {
    viewBox: { x: -50, y: -35, width: 100, height: 70 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -32, y: -33, w: 22, h: 22 }, kind: "neighbour", label: "Houses (west side)" },
      {
        shape: { x: -32, y: -9, w: 22, h: 8 },
        kind: "target",
        label: "No. 31 — address on the March log",
      },
      { shape: { x: -32, y: 1, w: 22, h: 8 }, kind: "neighbour", label: "No. 29 — neighbour" },
      { shape: { x: -32, y: 11, w: 22, h: 22 }, kind: "neighbour", label: "Houses (west side)" },
      { shape: { x: 10, y: -33, w: 22, h: 66 }, kind: "neighbour", label: "Houses (east side)" },
    ],
    roads: [
      { shape: { x: -10, y: -35, w: 3, h: 70 }, kind: "pavement", label: "Pavement (west)" },
      { shape: { x: -7, y: -35, w: 14, h: 70 }, kind: "road", label: "Kendal Street" },
      { shape: { x: 7, y: -35, w: 3, h: 70 }, kind: "pavement", label: "Pavement (east)" },
      // Rear yards behind the west side — where a back door would come out.
      { shape: { x: -42, y: -33, w: 10, h: 66 }, kind: "garden", label: "Rear yards (west)" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -4, y: -14 }, kind: "car" },
      { pos: { x: -4, y: -4 }, kind: "car", label: "White van outside No. 31" },
      { pos: { x: 4, y: 12 }, kind: "car" },
      { pos: { x: 8, y: -28 }, kind: "lamppost" },
      { pos: { x: -9, y: 22 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "aml-plot",
        pos: { x: 0, y: 0 },
        kind: "structural",
        label: "Handset plot — radius about 30 m. Where the phone was, not necessarily the house",
        knownFromPri: true,
      },
      {
        id: "male-voice",
        pos: { x: -21, y: -6 },
        kind: "structural",
        label: "Raised male voice heard on the open line — who and where is unknown",
        knownFromPri: true,
      },
      {
        id: "quiet-approach",
        pos: { x: 0, y: 30 },
        kind: "structural",
        label: "Approach without sirens — a caller who whispers has asked for it",
        knownFromPri: true,
      },
      {
        // Not on the log until an officer is at the door: the caller told
        // the call handler, but it is the crew who find out where.
        id: "children",
        pos: { x: -27, y: -5 },
        kind: "structural",
        label: "Children in the house — upstairs, with her",
        knownFromPri: false,
        discoverAfterMinOnScene: 1,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · No. 31 frontage / Kendal Street", face: "front", bearingDeg: 90 },
      { id: 2, label: "Sector 2 · Rear yards (west side)", face: "rear", bearingDeg: 270 },
      { id: 3, label: "Sector 3 · North end", face: "left", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · South end / approach", face: "right", bearingDeg: 180 },
    ],
  },

  // The informant is the call handler, not the caller — the caller has
  // not spoken. Each beat is a call-back attempt or what came back from
  // one. Timings are tight because Kendal Street is about a kilometre
  // from Harrogate Street and the third call-back has to land before a
  // promptly-sent car does.
  informantScript: [
    {
      id: "open-line",
      atSec: 4,
      text: "Call handler. Abandoned 999 from a mobile, 07700 900314. Nobody spoke to me. BT put it through because their operator could hear people on the line. What I had before it dropped: a raised male voice, not close to the phone, then a door, then nothing. The handset location has come through — Kendal Street, off Wallgate, radius about thirty metres. That is where the phone was. It is not a house number. First call-back has gone straight to voicemail.",
      tone: "urgent",
    },
    {
      id: "callback-2",
      atSec: 40,
      text: "Second call-back. It rang out this time before the voicemail, so the phone is on and within somebody's reach and they are not answering it. I have put an urgent subscriber check in with the network, and I am running the number through our own logs while I wait.",
      tone: "info",
    },
    {
      id: "log-match",
      atSec: 85,
      text: "The number is on our system. It is the contact number a Leanne HESKETH, 32, gave at 31 Kendal Street — which is inside the plot — on the one previous log at that address, March this year: a neighbour rang about shouting, a car attended, she and her partner Daniel ROTHWELL both said it was an argument and nothing more, no offences disclosed. Two children recorded at the address. Nothing on either of them since. The network check is still out and I am not waiting for it. Third call-back going in now.",
      tone: "info",
    },
    // --- The roll. Four times in ten the third call-back accounts for it.
    {
      id: "callback-kids",
      atSec: 130,
      probability: 0.4,
      suppressesIds: ["callback-whisper"],
      text: "Third call-back — answered. A woman, gives her name as Leanne Hesketh before I have asked for it. Sounds fine, sounds embarrassed. Her lad has had her phone and has been pressing things; the shouting was her partner at the football in the front room and the door was the kids going in and out. I have asked her the questions the long way round — nobody hurt, nobody in the house she does not want there, she is free to talk. Children in the background, telly on. She is coherent and nobody is feeding her the answers. As far as the desk is concerned that accounts for it.",
      tone: "info",
    },
    // --- The other six. No probability, deliberately: callback-kids has
    // taken its 40% and this is the remainder. If both could fail, a
    // share of runs would ring three times and never find out.
    {
      id: "callback-whisper",
      atSec: 140,
      suppressesIds: ["callback-kids"],
      text: "Third call-back — answered, and she is whispering. A woman. 'Please don't ring this phone again. He's downstairs. I'm in the bathroom with the kids. Thirty-one Kendal Street. Don't put your sirens on.' Then she has gone. That is the address on the March log. This is a domestic and she cannot speak — I am regrading it to Grade 1 now.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "whisper-follow",
      atSec: 190,
      requiresFiredIds: ["callback-whisper"],
      text: "I have not rung it back. She asked me not to, and a phone ringing in a bathroom is the last thing she needs. If that number rings 999 again it comes straight to me. Whoever you send: no sirens on the street, and two cars at the door, not one.",
      tone: "urgent",
    },
    {
      id: "open-line-again",
      atSec: 260,
      probability: 0.6,
      requiresFiredIds: ["callback-whisper"],
      text: "That number has rung 999 again — open line, nobody speaking to me. I can hear a child crying close to the phone, and a man's voice through a door: 'Open it, Leanne. I'm not going to do anything.' The line is still open. I am keeping it open.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    // --- Only on a slow response. A car sent at Grade 2 on the first
    // beat is on Kendal Street before either of these can fire.
    {
      id: "neighbour-999",
      atSec: 420,
      delayThresholdSec: 420,
      probability: 0.7,
      requiresFiredIds: ["callback-whisper"],
      text: "Separate 999 — a neighbour at 29 Kendal Street, a Pauline CUNLIFFE. She can hear him through the wall, kicking a door upstairs and shouting. He has been drinking since dinner time, she says, and his white van is outside so he has not gone anywhere. She is the one who rang in March. She is asking where the police are.",
      tone: "critical",
    },
    {
      id: "gone-quiet",
      atSec: 560,
      delayThresholdSec: 560,
      requiresFiredIds: ["callback-whisper"],
      text: "The open line has gone quiet. No child now, no voices, and nobody answers when I speak. It is seven minutes since she whispered and there is no unit on Kendal Street.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  callGrade: {
    scale: "police_thrive",
    grade: 2,
    standardMinutes: 60,
    basis:
      "GMP Grade 2 'Priority' — within 1 hour. GMP's own published figure: Chief Constable's Regulation 28 response to HM Senior Coroner Manchester West, 26 Aug 2025 ('Priority or grade 2 - within 1 hour'); GMCA GMP Performance Briefing, Jan 2026 (one hour is 'our aspired attendance time'; 77% met in 2025, average 1h 06m 49s). GMP's grading policy opens an abandoned 999 as a Police Administration (PA) record 'required to identify the grading by THRIVE' (GMP FOI 01/FOI/24/012708/K, 28 Jun 2024); the raised voice and the door heard on this call take it to a priority attendance unless a call-back accounts for it.",
  },
};
