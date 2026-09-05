import type { Scenario } from "../incident_types";

// Scenario 39 — domestic in progress, Prosperity Street, Harpurhey.
//
// The single biggest slice of police demand, and the one the desk gets
// wrong most quietly. A neighbour hears screaming and a smash through
// the party wall. Nothing about it is technically hard: two cars, a
// door, an arrest. What it tests is whether the operator treats it like
// the Grade 1 it is, and whether they hold their nerve when the call
// that comes next is the victim ringing to cancel.
//
// Mechanics:
//   - Two response units. Not one — a single officer alone in that house
//     is a second victim, and two officers cannot hold him, talk to her
//     and see to two children at once. Not five either.
//   - The caller feeds the risk questions the call handler asks — the
//     DASH-style cues: children in the house, a weapon, a previous
//     threat to kill. They arrive as answers, the way they do on the
//     line.
//   - The cancel. Before anyone is there, the victim rings from her own
//     phone: it was nothing, it is sorted, she does not want police. She
//     is calm and there is a man's voice near the handset. That call is
//     the risk signal, not the all-clear, and the grade does not move.
//   - Ambulance only if injury is reported. On about a third of nights
//     she comes to the door with a tea towel round her hand; the PDA
//     stays at two and the ambulance is added when the injury appears.
//     The debrief's discipline row reads +1 on those nights, and that
//     is the correct answer, not a mark against it.
//   - A slow response has a cost that is not medical: he leaves in the
//     van before anyone arrives, and an arrest at the door becomes a
//     circulation.
//
// GEOGRAPHY. Prosperity Street is real: a short street of modern
// three-storey terraced townhouses whose west end is about twenty
// metres from Rochdale Road (OSM: building=house, house=terraced,
// building:levels=3). The postcode M40 8EX is verified on postcodes.io
// and sits in Manchester's Harpurhey ward; OSM labels the immediate
// area Collyhurst, and both names are in local use for this stretch of
// Rochdale Road. The house numbers, the people, the history and the
// van are all fictional. Which risk checklist GMP's call handlers run
// in 2026 (DASH or the College's DARA) is not verified here — the
// questions are the same family either way.

export const scenario39: Scenario = {
  id: "39",
  slug: "39_domestic_harpurhey",
  title: "Domestic in progress — Prosperity Street, Harpurhey",
  type: "police_domestic_in_progress",
  patch: "Southern",
  severity: "high",
  trigger:
    "Neighbour hears a woman screaming 'get off me' and a man shouting through the party wall of a terraced townhouse off Rochdale Road, then something smashing. Ongoing. Children believed in the house",

  location: {
    address: "Prosperity Street, Harpurhey, Manchester",
    postcode: "M40 8EX",
    coords: { lat: 53.4999, lng: -2.2186 },
  },

  property: {
    class: "Three-storey modern terraced townhouse, mid-terrace",
    size: "Narrow frontage, about 6.5 m, three floors; party walls both sides",
    materials: "Brick and block, timber floors — sound carries through the party wall, which is how the call came in",
    occupants:
      "Female (31) and male (34), partners; two children (8 and 3) believed upstairs. Neighbours occupied both sides — the caller is through the party wall at the next door",
    vulnerabilities: [
      "Two children in the house while it is happening",
      "Male carries a VIOLENT marker from a previous domestic at this address",
      "Victim withdrew last time — expect pressure on her to do the same again, from the room she is standing in",
      "Weapon status unknown — the caller cannot see in",
    ],
    access:
      "Front door directly onto the Prosperity Street pavement. The street runs off Rochdale Road at its west end; park short on the Rochdale Road side and walk the last few doors — the front windows look straight down the street",
    knownHazards: [
      "Male reported violent; a previous arrest at this address",
      "Broken glass or crockery inside — the smash the caller heard",
      "Three floors — the children are above the incident, not beside it",
    ],
    firstDueStationId: "MP-MCR",
    doorType: "composite",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "Repeat address: one previous domestic here (Feb 2026). Male arrested for assault, released with no further action when the victim withdrew. His VIOLENT marker dates from that job. Same neighbour rang it in.",
      "Two children on the household record, 8 and 3. Any attendance is a safeguarding referral as well as an arrest.",
      "Nearest ambulance station is Philips Park, about a mile and a half east — if an injury is reported, the ambulance is close.",
    ],
  },

  methane: {
    M: "No",
    E: "Prosperity Street, Harpurhey, Manchester, M40 8EX — mid-terrace townhouse, west end of the street off Rochdale Road",
    T: "Domestic in progress — female screaming, male shouting, property being broken; two children believed upstairs",
    H: "Male with a VIOLENT marker; broken glass inside; weapon status unknown",
    A: "Front door onto Prosperity Street. Approach from Rochdale Road and park short of the address",
    N: "Two adults and two children believed inside. No injury reported at the point of call",
    emergencyServices: "Police — two response units. Ambulance only on a report of injury",
  },

  pda: [
    {
      id: "police1",
      label: "Police — first response",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      preferredStationId: "MP-MCR",
      notes:
        "Grade 1. Through the door, one officer to him and one to her, in different rooms. Positive action — if there is evidence of an offence he is arrested, whatever she is saying by then",
    },
    {
      id: "police2",
      label: "Police — second unit",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      preferredStationId: "MP-MCR",
      notes:
        "Not optional. A prisoner, a victim account, two children and a scene cannot be done by one crew, and one officer alone in that house with him is not safe. Two cars is the attendance; it is also the whole attendance",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      {
        metric: "Attendance",
        target: "first unit in attendance inside GMP's 15-minute Grade 1 aspiration",
      },
      {
        metric: "Second unit",
        target: "two units committed, not one — a prisoner, a victim, two children and a scene",
      },
      {
        metric: "The cancel call",
        target: "grade held at 1 and both units kept running when the victim rings to cancel",
      },
      {
        metric: "Ambulance",
        target: "requested on a report of injury and not before",
      },
    ],
    lesson:
      "This is the job the shift is made of, and the one where the desk goes wrong most quietly. Two cars, not one — not because he is big, but because one officer alone in that house is a second victim and two officers cannot hold him, talk to her and see to two children at the same time. The answers you draw out of the caller are the risk assessment before anyone arrives: children in the house, a threat to kill, a weapon you cannot rule out. And then she rings you to cancel. She is calm and there is a man's voice near the phone. That call is not the all-clear. It is the clearest sign yet of what is happening in the room, and the grade stays where it is. Ambulance only when somebody is actually hurt; the moment the tea towel appears, it goes.",
  },

  scene: {
    viewBox: { x: -55, y: -32, width: 110, height: 64 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -42, y: -14, w: 30, h: 10 }, kind: "neighbour", label: "Terrace (north side, west)" },
      { shape: { x: -12, y: -14, w: 7, h: 10 }, kind: "neighbour", label: "No. 12 — caller, through the party wall" },
      { shape: { x: -5, y: -14, w: 7, h: 10 }, kind: "target", label: "No. 14 — target dwelling" },
      { shape: { x: 2, y: -14, w: 48, h: 10 }, kind: "neighbour", label: "Terrace (north side, east)" },
      { shape: { x: -42, y: 8, w: 92, h: 10 }, kind: "neighbour", label: "Terrace (south side)" },
    ],
    roads: [
      { shape: { x: -55, y: -32, w: 9, h: 64 }, kind: "road", label: "Rochdale Road" },
      { shape: { x: -46, y: -4, w: 101, h: 2 }, kind: "pavement" },
      { shape: { x: -46, y: -2, w: 101, h: 6 }, kind: "road", label: "Prosperity Street" },
      { shape: { x: -46, y: 4, w: 101, h: 2 }, kind: "pavement" },
      { shape: { x: -42, y: -28, w: 92, h: 14 }, kind: "garden", label: "Rear gardens" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -1, y: 1 }, kind: "car", label: "White Transit — his, on the front" },
      { pos: { x: -22, y: 1 }, kind: "car" },
      { pos: { x: 20, y: 1 }, kind: "car" },
      { pos: { x: -30, y: 5 }, kind: "lamppost" },
      { pos: { x: 28, y: 5 }, kind: "lamppost" },
      { pos: { x: -44, y: -6 }, kind: "lamppost", label: "Park short — Rochdale Road end" },
    ],
    hazards: [
      {
        id: "suspect",
        pos: { x: -1, y: -9 },
        kind: "structural",
        label: "Male with a VIOLENT marker inside No. 14 — previous domestic at this address",
        knownFromPri: true,
      },
      {
        id: "glass",
        pos: { x: -3, y: -7 },
        kind: "structural",
        label: "Broken glass or crockery — the smash the caller heard",
        knownFromPri: true,
      },
      {
        id: "children",
        pos: { x: 0, y: -12 },
        kind: "structural",
        label: "Two children upstairs — safeguarding from the moment the door opens",
        knownFromPri: true,
      },
      {
        // Not on any record; the first crew sees it as they turn in.
        id: "sightline",
        pos: { x: -1, y: -3 },
        kind: "structural",
        label: "Front windows look straight down Prosperity Street to Rochdale Road — a car pulling up is seen before the door is knocked",
        discoverAfterMinOnScene: 1,
      },
    ],
    casualties: [
      // Present only on the nights the injured beat fires — revealCasualty
      // flips her from absent to present at that moment. Walking wounded:
      // glass cuts and a bruised face, not a trauma job. The ambulance is
      // for the wound and for the record of it.
      {
        id: "cas-39-victim",
        label: "Female, 31 — glass cuts to the left hand and forearm, bruising to the face",
        pos: { x: -2, y: -6 },
        severity: "walking",
        presentProbability: 0,
        discoverAfterMinBa: 0,
        clinical: {
          // Tachycardic from the last twenty minutes, not from blood loss.
          // Everything else is normal; the injury is in the hands and
          // the face, and the story is in the notes.
          vitals: { rr: 20, spo2: 98, hr: 104, bpSys: 128, bpDia: 82, gcs: 15, temp: 36.8, bm: 5.4 },
          ageYears: 31,
          presumedCondition:
            "Lacerations to the left palm and forearm from broken glass, bleeding controlled with a towel; painful bruising to the left cheek — assault",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          criticalInterventions: [],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Prosperity Street / front door", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · East end", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear gardens", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Rochdale Road end", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "first",
      atSec: 4,
      text: "It's next door — number 14, Prosperity Street. She's screaming, proper screaming, 'get off me, get off me', and he's shouting over the top of her. Something's just gone against the wall — a glass or a plate, it smashed. It's still going on now. I can hear him through the wall as I'm talking to you.",
      tone: "critical",
    },
    {
      // The first DASH-style answer. Children in the house changes the
      // grade of everything that follows.
      id: "children",
      atSec: 40,
      text: "Kids — yes. Two. The little girl's about eight and there's a toddler. I can hear the little one crying upstairs now. It's a school night, they'll all be in.",
      tone: "urgent",
    },
    {
      // Weapon: unknown is the honest answer, and the description comes
      // out with it — the arriving crew want to know who they are
      // looking at.
      id: "weapon",
      atSec: 80,
      text: "A weapon — I don't know. I can't see in. He's smashed things before. Last time your lot came he'd put his fist through the kitchen door. I've never seen him with a knife, but I've never been in there when it's going off, have I. He's a big lad, shaved head, grey trackie bottoms. He'd not need one.",
      tone: "urgent",
    },
    {
      // Threat to kill plus a threat tied to leaving: the two heaviest
      // items on the checklist, from a witness rather than the victim.
      id: "threats",
      atSec: 120,
      text: "Has he threatened to kill her — she told me once, out the back, he'd said he'd do it if she ever left him. She made me promise not to ring you. I'm ringing you. It's gone quieter now. I can hear him talking low. I can't hear her at all.",
      tone: "critical",
    },
    {
      // The beat the scenario is built around. Control-room voice, not
      // the neighbour's: it arrives as a second call on the same
      // address, from the victim's own phone. Certain, because the
      // lesson lives here and every run should have to face it.
      id: "cancel",
      atSec: 200,
      text: "CONTROL: second call on this address — the female occupant, from her own mobile. Says it was an argument, it's sorted, nothing is broken and she does not want police. She is calm. There is a male voice close to the phone. Your first caller is still on the line to us saying it was not nothing. Grade unchanged.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "cancel-neighbour",
      atSec: 215,
      requiresFiredIds: ["cancel"],
      text: "She's rung you to cancel? He's stood over her, that's why. I can hear him through the wall telling her what to say. Do not cancel it. Please.",
      tone: "urgent",
    },
    {
      // Roughly one night in three, there is an injury to see, and the
      // ambulance the PDA deliberately left off is added now.
      id: "injured",
      atSec: 250,
      probability: 0.35,
      text: "She's just come to the front door with the little one on her hip — she's got a tea towel round her hand and there's blood down her top, and her face is swelling up. He's pulled her back in and shut it. She's hurt. You need an ambulance as well now.",
      tone: "critical",
      effect: { pulseCritical: true, revealCasualty: "cas-39-victim" },
    },
    {
      // Only on a slow response. Seven minutes with nobody there is
      // inside the 15-minute aspiration and still long enough for it to
      // start again.
      id: "slow",
      atSec: 420,
      delayThresholdSec: 420,
      text: "It's kicked off again. She's screaming again and now the little girl's screaming as well. Where are you? It's been ages.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      // The cost of a slow response on a domestic is not medical. He
      // leaves, and an arrest at the door becomes a circulation for a
      // white Transit heading into town.
      id: "leaving",
      atSec: 600,
      delayThresholdSec: 600,
      probability: 0.5,
      requiresFiredIds: ["slow"],
      text: "He's out. He's got his keys — he's getting in the van, the white Transit with the ladders on. He's pulling off now, down to Rochdale Road, turning left, towards town. She's still inside with the kids.",
      tone: "urgent",
    },
  ],

  callGrade: {
    scale: "police_thrive",
    grade: 1,
    standardMinutes: 15,
    basis:
      "GMP Grade 1 (Immediate): 'Immediate or grade 1 incidents - within 15 minutes' — GMP Chief Constable's Regulation 28 response to HM Senior Coroner Manchester West, 26 Aug 2025; the GMCA GMP Performance Briefing (Jan 2026) calls 15 minutes the force's 'aspired attendance time' (avg 7m52s, 95% within 15 min in 2025). GMP publishes one figure force-wide; there is no separate rural target. Placing a domestic in progress with violence ongoing and children present at Grade 1 on THRIVE (Threat, Harm, Risk, Investigation, Vulnerability, Engagement) is our reading of the published policy, not a GMP-published rule for this call type.",
  },
};
