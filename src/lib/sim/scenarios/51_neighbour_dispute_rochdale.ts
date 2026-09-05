import type { Scenario } from "../incident_types";

// Scenario 51 — neighbour dispute, repeat caller, Kirkholt, Rochdale.
//
// The grading job. The desk has heard from this address twice already
// this week — music on Monday, a fence panel on Wednesday — and both went
// to slow time, correctly. Tonight it is the same caller, the same
// neighbour, the same fence, and one new sentence: "he said he'd burn us
// out".
//
// So the mechanic is not the drive. It is what the operator does with the
// caller still on the line: reads the history, hears the words change,
// and grades this one differently from the two before it. GMP has had no
// Grade 3 to fall back on since February 2022 — everything below Grade 2
// is central resolution, a call-back, and she has already had one of
// those go unanswered. A threat to set fire to an occupied house is Grade
// 2 at the least: one car, inside the hour, and the log says why.
//
// Then the neighbour rings. He always does. Same location, different
// caller, his own version of it — and the operator who opens that as a
// second job has sent one officer to knock on one door when there are
// two.
//
// One car. Nobody is hurt and nobody is inside with anybody. Roughly one
// night in three the man comes back out to the fence with a lighter, and
// that is where the grade would move again; the rest of the time he goes
// in and the job is two doors and a fence. A slow response makes it a
// public-order job instead, because the husband stops waiting.
//
// FICTIONAL: everyone in it, both households, the house numbers and the
// call history. Daventry Road on the Kirkholt estate is real; nothing
// here happened on it. The sketch runs the road north–south, which is
// how the mapped segments lie overall — the exact kerb line is schematic.

export const scenario51: Scenario = {
  id: "51",
  slug: "51_neighbour_dispute_rochdale",
  title: "Neighbour dispute, repeat caller — Daventry Road, Kirkholt",
  type: "police_neighbour_dispute",
  patch: "Eastern",
  severity: "moderate",
  trigger:
    "Third call this week from 61 Daventry Road about the neighbour at 63. Shouting over the garden fence again, and tonight he has told the caller he will burn them out. Nothing alight, nobody hurt, caller still on the line",

  location: {
    address: "61 Daventry Road, Kirkholt, Rochdale",
    postcode: "OL11 2HY",
    coords: { lat: 53.598, lng: -2.1573 },
  },

  property: {
    class:
      "Post-war council-built semi-detached house — two storey, brick, rear garden with a shared boundary fence to no. 63",
    occupants:
      "61: the caller and her husband. 63: the neighbour, his partner and a child of nine. Both households at home",
    vulnerabilities: [
      "Child at no. 63",
      "Party wall — a fire in one house is a fire in both",
      "Repeat caller who has not spoken to an officer this week and no longer believes one is coming",
      "Husband at 61 who wants to go round",
    ],
    access:
      "Daventry Road, front doors side by side. Rear gardens through each house or by the side gates; the fence can be seen from either kitchen",
    knownHazards: [
      "Verbal threat to set fire to the house — nothing alight, no accelerant seen",
      "Two households who each expect the officer to take their side",
    ],
    firstDueStationId: "MP-RCH",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwellings. What the desk has is the log: three contacts from 61 this week (music Monday, fence panel kicked through and shouting Wednesday, tonight) and one from 63 on the Wednesday about being filmed. All graded for central resolution. Nothing attended.",
      "REPEAT CALLER flag on 61. A call-back was attempted Thursday, no answer, message left. She has not spoken to an officer this week and she says so.",
      "The neighbourhood team has the fence as an open ASB case with the landlord at 63. Four complaints from 61 in six months should clear the ASB Case Review threshold — the Anti-social Behaviour, Crime and Policing Act 2014 caps it at three qualifying complaints in six months — worth telling her, it is the first thing this week anyone will have offered her.",
      "Semi pair on a party wall. 'Burn you out' is a threat to two houses, not one, and there is a nine-year-old in the second.",
    ],
  },

  methane: {
    M: "No",
    E: "61 and 63 Daventry Road, Kirkholt, Rochdale, OL11 2HY — adjoining semis",
    T: "Neighbour dispute, repeat caller — verbal threat to set fire to the house, made over the garden fence. No weapon seen, nothing alight",
    H: "Threat of fire not acted on; a husband who wants to go round; two households who will each want the officer on their side",
    A: "Daventry Road. Front doors side by side; rear gardens through each house or the side gates",
    N: "None injured. Four adults and one child across the two addresses",
    emergencyServices: "Police only — one response unit. No fire or ambulance attendance unless something changes",
  },

  pda: [
    {
      id: "police1",
      label: "Police — response unit",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      preferredStationId: "MP-RCH",
      notes:
        "One car, two front doors. Nobody is hurt and nobody is inside with anybody; the officer's job is to knock on both and to know the history before they do. A second car is yours to add if the lighter comes out or the husband goes round — it is not on the attendance because most nights it is not needed",
    },
  ],

  evaluation: {
    targets: [
      {
        metric: "Grading",
        target: "Grade 2 on the threat — not the slow-time grade the first two calls got, and not another call-back",
      },
      { metric: "Time-to-mobilise", target: "< 3 minutes, with the caller still on the line" },
      {
        metric: "Attendance",
        target: "one unit in attendance well inside the one-hour Grade 2 standard",
      },
      {
        metric: "Two callers, one job",
        target: "the 999 from no. 63 linked to this log, not opened as a second incident",
      },
      {
        metric: "History passed",
        target: "crew told it is the third call this week, what the first two were, and that there is a child at 63",
      },
    ],
    lesson:
      "The third call in a week from the same address is the one you are most tempted to grade like the first two, and it is the one you cannot. The desk knows this pair: a fence panel, some music, two households who cannot stand each other, and that is why the earlier calls went to slow time, and it was right. Tonight the words changed. 'He'll burn us out' is a threat to set fire to an occupied house, and whether or not he means it, it is an offence and it is a Harm and a Risk you cannot leave on a call-back list. So it goes Grade 2 and a car goes while she is still on the line, not after. Then the neighbour rings. He always does. Do not open a second job; it is the same job with two callers, and the officer who knows that before they knock is the one who gets both doors opened. Read the history to the crew, tell them there is a child at 63, and if the lighter comes out the grade goes up again and you say so on the log before anybody asks you why.",
  },

  // Top-down sketch — a 60 m run of Daventry Road with the pair of
  // semis on its east side. The fence between the two rear gardens is
  // the whole argument; the two front doors are six metres apart, which
  // is the thing an officer notices on arrival and the caller's husband
  // has already noticed.
  scene: {
    viewBox: { x: -30, y: -32, width: 70, height: 64 },
    compassNorth: "up",
    buildings: [
      { shape: { x: 4, y: -12, w: 10, h: 12 }, kind: "target", label: "No. 61 — caller" },
      { shape: { x: 4, y: 0, w: 10, h: 12 }, kind: "neighbour", label: "No. 63 — neighbour" },
      { shape: { x: 4, y: -30, w: 10, h: 14 }, kind: "neighbour", label: "Nos. 57–59" },
      { shape: { x: 4, y: 16, w: 10, h: 14 }, kind: "neighbour", label: "Nos. 65–67" },
      { shape: { x: -30, y: -26, w: 10, h: 20 }, kind: "other", label: "Semis (west side)" },
      { shape: { x: -30, y: 4, w: 10, h: 20 }, kind: "other", label: "Semis (west side)" },
    ],
    roads: [
      { shape: { x: -16, y: -32, w: 2, h: 64 }, kind: "pavement" },
      { shape: { x: -14, y: -32, w: 8, h: 64 }, kind: "road", label: "Daventry Road" },
      { shape: { x: -6, y: -32, w: 2, h: 64 }, kind: "pavement" },
      { shape: { x: -4, y: -12, w: 8, h: 12 }, kind: "garden", label: "Front — 61" },
      { shape: { x: -4, y: 0, w: 8, h: 12 }, kind: "garden", label: "Front — 63" },
      { shape: { x: -4, y: -14, w: 18, h: 2 }, kind: "driveway", label: "Side gate — 61" },
      { shape: { x: -4, y: 12, w: 18, h: 2 }, kind: "driveway", label: "Side gate — 63" },
      { shape: { x: 14, y: -12, w: 24, h: 12 }, kind: "garden", label: "Rear garden — 61" },
      { shape: { x: 14, y: 0, w: 24, h: 12 }, kind: "garden", label: "Rear garden — 63" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -10, y: -20 }, kind: "car", label: "Parked cars" },
      { pos: { x: -10, y: 18 }, kind: "car" },
      { pos: { x: -5, y: -6 }, kind: "lamppost" },
      { pos: { x: 32, y: -7 }, kind: "tree" },
      { pos: { x: 34, y: 8 }, kind: "other", label: "Shed — 63" },
    ],
    hazards: [
      {
        id: "fence-line",
        pos: { x: 26, y: 0 },
        kind: "structural",
        label: "Shared boundary fence — the flashpoint. New panel disputed; one panel kicked through on Wednesday",
        knownFromPri: true,
      },
      {
        id: "fire-threat",
        pos: { x: 9, y: -6 },
        kind: "structural",
        label: "Verbal threat to set fire to no. 61 — nothing alight. Party wall to 63; child at 63",
        knownFromPri: true,
      },
      {
        id: "front-doors",
        pos: { x: 0, y: -1 },
        kind: "structural",
        label: "Two front doors six metres apart — the husband at 61 wants to use his",
        knownFromPri: true,
      },
    ],
    // Nobody is hurt. A lighter held up over a fence is a grading
    // problem, not a patient.
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Daventry Road / front doors", face: "front", bearingDeg: 270 },
      { id: 2, label: "Sector 2 · Rear gardens / fence line", face: "rear", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · No. 61 — the caller", face: "left", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 63 — the neighbour", face: "right", bearingDeg: 180 },
    ],
  },

  // The caller is Janice at 61 unless the beat says otherwise. Two beats
  // are the desk relaying the second 999, from 63, because that is how
  // the operator would hear it — not from him, from the handler who took
  // it.
  informantScript: [
    {
      id: "caller-first",
      atSec: 5,
      text: "It's Janice Holroyd, 61 Daventry Road, Kirkholt. You've had me twice this week already about next door. He's at it again — he's been out the back shouting over the fence at my Barry for ten minutes. And this time he's said he'll burn us out. Them's his words. 'I'll burn the pair of you out.'",
      tone: "urgent",
    },
    {
      // The grading pressure, from her side of it. She is not wrong.
      id: "not-a-phone-call",
      atSec: 40,
      text: "Last time somebody was going to ring me back and nobody did. I'm not having another phone call. He has said he will set fire to my house with us in it. I want somebody here.",
      tone: "urgent",
    },
    {
      // The mundane truth underneath the threat. The desk needs both.
      id: "the-fence",
      atSec: 90,
      text: "It's the fence panel again, before you ask. Barry put the new one up at the weekend and he reckons it's six inches on his side. It isn't. Then the music went on, then he came out. It's the same every time, only he's never said that before.",
      tone: "info",
    },
    {
      // Control-room voice. The second caller is the other household.
      id: "neighbour-calls",
      atSec: 150,
      text: "Second 999 into the same location — this one is from 63. Male, gives his name as Lee Duckworth. Says the man at 61 has been filming him over the fence and called his partner something he will not repeat, and he wants police because he is sick of being made out to be the problem. Two logs open on the pair of them now.",
      tone: "info",
    },
    {
      id: "neighbour-version",
      atSec: 180,
      requiresFiredIds: ["neighbour-calls"],
      text: "63 is asking whether the officer is coming to see him as well or just her. He says he never said burn — he says he said he'd have them out of here, meaning the housing, and that she twists everything. He has a lad of nine in the house and he wants that on the log.",
      tone: "info",
    },
    // --- The roll. One night in three he comes back out. ---------------
    {
      id: "lighter",
      atSec: 240,
      probability: 0.3,
      suppressesIds: ["gone-in"],
      text: "He's back out. He's stood at the fence with a lighter in his hand. He's not lit anything, he's just stood there flicking it and looking at our kitchen window. Barry's at the back door and I'm hanging on to him.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      // The landing for the lighter night. He goes in, but the operator
      // who has just lifted the grade needs to hear that he has, and
      // that the threat has not gone in with him.
      id: "lighter-in",
      atSec: 330,
      requiresFiredIds: ["lighter"],
      text: "He's gone in. He held it up at our window first, flicked it, then went in and slammed the door. The music's gone up. Barry's saying he's not going to bed while that man's got a lighter and a grudge, and I don't blame him.",
      tone: "urgent",
    },
    {
      // Certain, so that the two nights in three the lighter does not
      // appear still resolve. If both were rolled a share of runs would
      // hear neither and the caller would never say what he did next.
      id: "gone-in",
      atSec: 260,
      suppressesIds: ["lighter"],
      text: "He's gone back in. The music's still going but he's gone in, and I've got Barry in as well. I'm not saying it's over, because it never is. But he's in.",
      tone: "info",
    },
    // --- Only on a slow response. Fifteen minutes is nothing against a
    // one-hour standard and everything to a woman on her third call. ----
    {
      id: "slow-barry-out",
      atSec: 900,
      delayThresholdSec: 900,
      text: "That's a quarter of an hour, and I've rung you three times this week. Barry's gone out the front to have it out with him and I can't stop him — he's sixty-one and he's had enough. If somebody gets hurt now that is on you, not me.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      // Control-room voice again. Both callers, one question.
      id: "slow-both-doors",
      atSec: 1140,
      delayThresholdSec: 1140,
      requiresFiredIds: ["neighbour-calls", "slow-barry-out"],
      text: "63 back on the line. The male from 61 is at his front door banging on it and he is not opening it, and the lad is crying. Both callers are now asking the same question, which is where you are.",
      tone: "critical",
    },
  ],

  callGrade: {
    scale: "police_thrive",
    grade: 2,
    standardMinutes: 60,
    basis:
      "GMP Grade 2 (Priority): attendance within one hour — Chief Constable's Regulation 28 response to HM Senior Coroner Manchester West, 26 Aug 2025 ('Priority or grade 2 - within 1 hour'), and the GMCA GMP Performance Briefing of Jan 2026, which calls the hour GMP's 'aspired attendance time' (77% met in 2025). Nothing below Grade 2 is an attendance in GMP terms: GMP removed Grades 3 to 5 in February 2022 (GMP FOI 01/FOI/24/012708/K), so the two earlier calls this week sat at Grade C, central resolution. The threat to burn the house out is what lifts this one — a threat to destroy property by fire is an offence in its own right (Criminal Damage Act 1971 s.2) and, made against an occupied house on a party wall, a threat of serious harm. Grade 1 turns on a real and immediate risk: a man at the fence with a lighter is closer to it than a man shouting over it, and the log should say which.",
  },
};
