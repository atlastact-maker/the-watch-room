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
//   - The risk cues — the DASH-style questions: children in the house,
//     a weapon, a previous threat to kill — are in the call script as
//     answers. Once the job is sent, the neighbour volunteers what she
//     is hearing as it changes, and does not repeat the call.
//   - The cancel. Before anyone is there, the neighbour hears the victim
//     ring from her own phone: it was nothing, it is sorted, she does
//     not want police. She is calm and he is stood over her. That call
//     is the risk signal, not the all-clear, and the grade does not
//     move. Nothing on the desk needs pressing — the test is what the
//     operator does NOT do.
//   - Tonight's run (scene.variants), drawn once when the call comes
//     in, so the branches agree with each other instead of rolling
//     separate dice: BASE is the story above; WEAPON, the neighbour
//     hears "put the knife down" and a knife is in the house; LEAVES,
//     he is gone in the van before the first car turns in; INJURED, she
//     comes to the door with a tea towel round her hand. The cancel
//     call comes in every one of them.
//   - Ambulance only if injury is reported. On the injured run the PDA
//     stays at two and the ambulance is added when the injury appears.
//     The debrief's discipline row reads +1 on those nights, and that
//     is the correct answer, not a mark against it.
//   - The leaves run has a cost that is not medical: an arrest at the
//     door becomes a plate to find.
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
      "No formal PRI — private dwelling. What follows is from the Feb 2026 log, not a premises record.",
      "Repeat address: one previous domestic here (Feb 2026). Male arrested for assault, released with no further action when the victim withdrew. His VIOLENT marker dates from that job. Same neighbour rang it in.",
      "Two children on the household record, 8 and 3. Any attendance is a safeguarding referral as well as an arrest.",
      "Nearest ambulance station is Philips Park, about a mile south-east — if an injury is reported, the ambulance is close.",
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
      requiredApplianceTypes: ["Police_Response", "Police_Van"],
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
        target: "advice, not a score — when the victim rings to cancel, do not stand the units down or regrade; nothing on the desk needs pressing",
      },
      {
        metric: "Ambulance",
        target: "advice, not a score — requested on a report of injury and not before; the discipline row reads +1 on those nights and that is correct",
      },
    ],
    scored: [{ kind: "hold_after_beat", beatId: "cancel", label: "Units held on the victim's cancel call" }],
    lesson:
      "This is the job the shift is made of, and the one where the desk goes wrong most quietly. Two cars, not one — not because he is big, but because one officer alone in that house is a second victim and two officers cannot hold him, talk to her and see to two children at the same time. The answers you draw out of the caller are the risk assessment before anyone arrives: children in the house, a threat to kill, a weapon you cannot rule out. And then she rings to cancel — the neighbour hears her do it, calm, with him stood over her. That call is not the all-clear. It is the clearest sign yet of what is happening in the room, and the grade stays where it is: nothing on the desk needs pressing, the test is what you do not do. Ambulance only when somebody is actually hurt; the moment the tea towel appears, it goes, and the +1 on the discipline row that night is the right answer.",
  },

  scene: {
    viewBox: { x: -55, y: -32, width: 110, height: 64 },
    compassNorth: "up",
    buildings: [
      // Two houses between No. 12 and the Rochdale Road junction — the
      // caller's "we're up the Rochdale Road end" is true.
      { shape: { x: -26, y: -14, w: 14, h: 10 }, kind: "neighbour", label: "Terrace (north side, west)" },
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
      // Present only on the injured run, and only from the moment the
      // injured beat fires — revealCasualty flips her from absent to
      // present when she comes to the door. Walking wounded:
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
    // Tonight's run. The remainder (0.3) is the base story: no knife
    // heard, nobody hurt that anyone sees, and he is still in the house
    // when the door goes.
    variants: [
      {
        id: "weapon",
        label: "Tonight the neighbour heard 'put the knife down' — a knife in the house",
        probability: 0.2,
        hazards: {
          add: [
            {
              id: "knife",
              pos: { x: 0, y: -8 },
              kind: "structural",
              label: "Knife — the caller heard the victim scream 'put the knife down'; not seen, not ruled out",
              discoverAfterMinOnScene: 0,
            },
          ],
        },
      },
      {
        id: "leaves",
        label: "Tonight he left in the van before the first car turned in",
        probability: 0.25,
        absent: ["cas-39-victim"],
      },
      {
        id: "injured",
        label: "Tonight she came to the door with a tea towel round her hand — ambulance needed",
        probability: 0.25,
      },
    ],
  },

  // These run from the moment the job is sent, in the neighbour's
  // voice, and only say what has CHANGED since the call — the risk
  // questions themselves live in the call script above.
  informantScript: [
    {
      // The children are no longer a fact on a form: the caller can
      // hear one of them.
      id: "children",
      atSec: 40,
      text: "The little one's crying upstairs now — I can hear it through the wall. He's not stopped. She's gone quieter and he hasn't.",
      tone: "urgent",
    },
    {
      // Weapon still unknown; what she can add is history, and who the
      // crew are looking at.
      id: "weapon",
      atSec: 80,
      excludesVariantIds: ["weapon"],
      text: "I still can't tell you if he's got anything in his hand, I can't see in. Last time your lot came he'd put his fist through the kitchen door. He's a big lad, shaved head, grey trackie bottoms — he'd not need a knife.",
      tone: "urgent",
    },
    {
      // The weapon run: she has heard the word twice now. Still not
      // seen — she is through a wall — and that is what the crew are
      // told. The job is already a Grade 1; the knife changes the
      // approach, not the grade.
      id: "knife",
      atSec: 80,
      requiresVariantIds: ["weapon"],
      text: "She's screamed it again — 'put the knife down, Liam, put it down'. That's twice. I can't see it, I'm through the wall, but I know what I heard. He's got a knife in there with her and them kids. Tell them that before they knock.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      // Threat to kill plus a threat tied to leaving: the two heaviest
      // items on the checklist, from a witness rather than the victim.
      id: "threats",
      atSec: 120,
      text: "There's something I should have said. She told me once, out the back, he'd said he'd kill her if she ever left him. She made me promise not to ring you. I'm ringing you. It's gone quieter now — I can hear him talking low. I can't hear her at all.",
      tone: "critical",
    },
    {
      // The beat the scenario is built around: the victim rings to
      // cancel, and the neighbour hears her do it. Certain, because the
      // lesson lives here and every run should have to face it. There
      // is nothing for the operator to press — the test is that they
      // do not stand anyone down.
      id: "cancel",
      atSec: 200,
      text: "She's on her phone — she's ringing you now, I can hear her. Saying it was an argument, it's sorted, nothing's broken, she doesn't want police. She sounds calm. She's not calm. He's stood over her telling her what to say, I can hear him through the wall. Do not cancel it. Please.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      // The injured run: there is an injury to see, and the ambulance
      // the PDA deliberately left off is added now.
      id: "injured",
      atSec: 250,
      requiresVariantIds: ["injured"],
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
      // Not on the leaves run — he is not in the house to start again.
      excludesVariantIds: ["leaves"],
      text: "It's kicked off again. She's screaming again and now the little girl's screaming as well. Where are you? It's been ages.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      // The leaves run. Forty seconds after the cancel, before the first
      // car has turned in, he goes — and an arrest at the door becomes a
      // white Transit somewhere on Rochdale Road. If a unit is there
      // first, the caller has cleared the line and he never gets out.
      id: "leaving",
      atSec: 240,
      requiresVariantIds: ["leaves"],
      text: "He's out. He's got his keys — he's getting in the van, the white Transit with the ladders on. He's gone — down to Rochdale Road, turned left, towards town. You'll want that plate. She's still inside with the kids.",
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

  // The call as Marie has it: on her mobile in her own front room at
  // No. 12, one hand flat on the party wall, hearing every word of it.
  // She rang the February one as well. Leanne asked her not to ring
  // again, and she is ringing.
  call: {
    caller: {
      name: "Marie Holt",
      phone: "07700 900161",
      relation: "Neighbour at No. 12, through the party wall — the same caller as the February job",
      where: "Her own front room at 12 Prosperity Street, a hand on the party wall",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "Police — it's next door to me, 14 Prosperity Street, Harpurhey, off Rochdale Road. He's at her again. She's screaming get off me, get off me, and he's roaring at her, and something's just gone up the wall and smashed. It's happening now, this minute — listen, that's him. There's two kids in that house.",
    reassurance: {
      text: "Marie, you've done the right thing ringing. Officers are on their way. Stay in your house, keep your door locked, and just tell me what you can hear.",
      reply: "I'm not going anywhere. Go on. I'm listening to it.",
    },
    answers: {
      p_happening: {
        text: "He's beating her. I can't see it but I can hear it — she's screaming 'get off me', over and over, and he's shouting over the top of her. Something's gone against the wall and smashed, a glass or a plate. He's still going. That's him now — can you hear that? That's him.",
        tone: "critical",
        followUps: [
          {
            id: "p_happening_hear",
            text: "What can you hear right now?",
            answer: {
              text: "Him. Shouting — 'look what you've made me do', that's what he keeps saying. Her, crying more than screaming now. Banging, like furniture going over. And the little one crying upstairs.",
              tone: "critical",
            },
          },
        ],
      },
      p_ongoing: {
        text: "Yes. It's going on now. I'm stood in my front room with my hand on the wall and I can feel it through the bricks. He's not stopped.",
        tone: "critical",
      },
      p_weapons: {
        text: "I don't know. I can't see in, love, I'm through the wall. I've never seen him with a knife. He's not a man who'd need one — he's twice her size.",
        byVariant: {
          // Heard, not seen — she is through a wall, and says so.
          weapon: "I can't see in, love, I'm through the wall — but she's just screamed 'put it down, put the knife down'. I heard the word. I've never seen him with one, but she's just said it.",
        },
        tone: "urgent",
        followUps: [
          {
            id: "p_weapons_smash",
            text: "What was it that smashed?",
            answer: {
              text: "Glass. It sounded like glass — a glass or a plate, against the wall, hard. There'll be glass all over that floor, and the kids come down barefoot.",
            },
          },
        ],
      },
      p_injured: {
        text: "I don't know — I can't see her. She was screaming, so she's — she was screaming. Nobody's shouted that they're hurt. Threatened — listen to him, that's all it is, one threat after another. I don't know what he's done to her, I only know what I can hear.",
        tone: "urgent",
        followUps: [
          {
            id: "p_injured_last",
            text: "Was she hurt the last time?",
            answer: {
              text: "Split lip and a black eye. She told the police she'd walked into the door. She came to my door after they'd gone — she'd not walked into any door.",
            },
          },
        ],
      },
      p_who: {
        text: "Him and her — Liam Doherty and Leanne, Leanne Whittaker. They're partners, they've been there five years. And the two kiddies, Maisie and little Alfie. That's it. I've not heard another voice, so he's not got a mate round.",
      },
      p_description: {
        text: "Liam's a big lad — six foot odd and heavy with it, shaved head. He came in from work in grey trackie bottoms and a black T-shirt, he's a roofer. Leanne's tiny, five foot nothing, dark hair. You'll know which is which.",
      },
      p_direction: {
        text: "Nobody's gone anywhere — they're all in there. His van's still outside, the white Transit with the ladders on the roof, so he's not left. If he goes, he'll go in that.",
        followUps: [
          {
            id: "p_direction_van",
            text: "Do you know the registration of the van?",
            answer: {
              text: "It's a white Transit, ladders on a rack on the roof, plain, nothing written on it. It starts MV, I know that much, I see it every day. I can't give you the rest without going out, and I'm not going out.",
            },
          },
        ],
      },
      p_drink: {
        text: "He's been drinking — he was carrying cans in when he got home, and he's been at them since. It's always drink with him. Drugs, I couldn't tell you. I'd not be surprised.",
      },
      p_known: {
        text: "I've known them since they moved in, five years. Leanne's a lovely girl. She'll not say a word against him to your lot — she didn't last time and she'll not this time. That's why it's me ringing and not her.",
        tone: "urgent",
      },
      p_vulnerable: {
        text: "The kids. Two of them — Maisie's eight and Alfie's three. They're upstairs — I can hear the little one crying through the wall. And her — she's on her own in there with him.",
        tone: "critical",
      },
      p_where: {
        text: "14 Prosperity Street — the townhouses off Rochdale Road, we're up the Rochdale Road end. 14's the one with the white van outside, and I'm 12, the next door on the Rochdale Road side. M40 8EX. The front doors are straight onto the pavement.",
      },
      p_safe: {
        text: "I'm in my own house with the door locked, I'm fine. I'm not going round — I was told that last time and I'm not daft. He'll know it was me that rang, mind. He knew last time.",
      },
      p_seen: {
        text: "Heard it, not seen it — I can't see in, I'm through the wall. But I've heard every word of it. These walls are paper, you hear their telly through them, never mind this.",
      },
      p_details: {
        text: "Marie Holt. Number 12, next door. It's my mobile — 07700 900161.",
      },
    },
    interjections: [
      {
        atSec: 50,
        text: "That's another one gone — that's a bigger one, a plate, a bowl. And a door's gone into the frame. Liam, LEAVE her — sorry, sorry, I'm shouting at the wall. He can't hear me.",
        tone: "critical",
      },
      {
        atSec: 95,
        text: "He's shouting up the stairs now — at the kids. 'Get back in your room.' The little girl's shouting for her mum. Oh, that poor kid.",
        tone: "urgent",
      },
      {
        atSec: 160,
        text: "Are you sending somebody or what? It's gone quiet in there and I don't like quiet. Last time it went quiet she was at my door with her lip split. Where are they?",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 185,
        text: "I can hear sirens — is that them? Listen — their front window looks straight down the street to Rochdale Road. He'll see the car before they're out of it. Last time he had the door open and a smile on before they'd knocked. Tell them to stop short and walk up.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Good. Thank you. Tell them to stop short of the house — and tell them there's kids in there. I'll leave my door on the latch for her; she knows she can come to me.",
  },
};
