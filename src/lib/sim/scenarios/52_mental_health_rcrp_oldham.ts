import type { Scenario } from "../incident_types";

// Scenario 52 — mental health, no immediate risk, Glodwick, Oldham.
//
// The Right Care Right Person job. A mother rings about her grown-up son:
// tearful all week, not eating, today not answering the door to her. She
// is frightened and she wants a police officer, and everything in the
// operator that answers 999 calls for a living wants to give her one.
//
// But he is awake, he is texting her back, he has said he does not want
// to hurt himself, there is no weapon and nobody else in the house. No
// real and immediate risk to life or of serious harm, no crime, no legal
// duty, no child. Since 30 September 2024 GMP has not sent to that. It
// goes to health — NHS 111 option 2, his GP, the crisis team he was under
// last year — and the right thing to do with the call is to close it at
// the desk with a clear route back if anything changes.
//
// So this is the one scenario on the stack where DECLINING is the
// correct action and answering is the mistake. The sim logs it either
// way. The informant script exists for the operator who answers anyway:
// it plays out the THRIVE questions and her answers so they can hear,
// beat by beat, that there is nothing here for a police car.
//
// Then, roughly one run in seven, the picture changes: he texts that he
// has taken tablets. That is a different call — an ambulance first, and
// police because there is now a risk to life behind a locked door. The
// lesson has to be honest that this does not make declining wrong; it
// makes the route back matter. The one Police_Response slot is held for
// exactly that and for nothing else.
//
// GMP does not actually run a Grade 4. Grades 3, 4 and 5 were removed in
// February 2022; the nearest real equivalent is Grade C Central
// Resolution, "No Crime — Advise and Close". The sim's grade 4 stands in
// for that and the callGrade basis says so.
//
// FICTIONAL: the family, the house number and everything said about
// them. Waterloo Street in Glodwick is real (a residential street south-
// east of Oldham town centre); no. 47 and its occupant are not.

export const scenario52: Scenario = {
  id: "52",
  slug: "52_mental_health_rcrp_oldham",
  title: "Mental health, no immediate risk — Waterloo Street, Glodwick",
  type: "police_mental_health_rcrp",
  patch: "Eastern",
  severity: "low",
  trigger:
    "Mother ringing about her adult son, 31, who lives alone. Tearful all week, not eating, today not answering the door to her. Awake and texting her back. No threat to himself or anyone else, no weapon, not detained, not missing",

  location: {
    address: "Waterloo Street, Glodwick, Oldham",
    // On the Waterloo Street carriageway itself (OSM way 210126598), by
    // the real nos. 185/187 which carry OL4 1EN / OL4 1ES. The first
    // draft's point was 100 m south on Brompton Street.
    postcode: "OL4 1ES",
    coords: { lat: 53.5367, lng: -2.102 },
  },

  property: {
    class: "Two-storey terraced dwelling, mid-terrace",
    occupants:
      "One adult male (31) inside, alone, awake and in text contact. His mother is outside on the pavement",
    vulnerabilities: [
      "Mental health — low mood, not eating, home treatment team involvement last year",
      "Caller is distressed and will ask for a police officer because that is the door she thinks he will open. That is not a risk indicator",
    ],
    access:
      "Front door straight onto the Waterloo Street pavement; rear yard gate onto the back alley. No keyholder — his mother does not hold a key",
    knownHazards: ["None reported — no weapon, no threat, nobody else in the property"],
    firstDueStationId: "MP-OLD",
    doorType: "upvc",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "One previous log at this address: concern for welfare from the same caller, November 2025, resolved on a call-back with no attendance. Nothing else on the address — no violence, no weapons, no warning markers on the door.",
      "RCRP (GMP, live from 30 September 2024): a concern for welfare is triaged Physical Health / Mental Health / Social Issues, and police deploy only to a real and immediate risk to life or of serious harm, a crime, or a legal duty. This one is Mental Health with none of those.",
      "Health route: NHS 111 option 2 for urgent mental health, his own GP in hours, and the crisis / home treatment team he was under last year. Tell her what to ring, and tell her to ring 999 back if anything changes.",
    ],
  },

  methane: {
    M: "No",
    E: "Waterloo Street, Glodwick, Oldham, OL4 1ES — mid-terrace",
    T: "Concern for welfare — mental health, no immediate risk. RCRP pathway: Mental Health",
    H: "None reported — no weapon, no threat, nobody else in the property",
    A: "Front door onto the Waterloo Street pavement; rear yard gate onto the back alley. Caller is outside the front door",
    N: "None injured — one adult male inside, awake, texting his mother, declining to open the door",
    emergencyServices:
      "None deployed. Signposted to NHS 111 option 2 / GP / crisis team. Police only if the risk picture changes",
  },

  // One slot, and it is not for this call as graded. A domestic is two
  // cars; a pure mental-health concern with no immediate risk is none.
  pda: [
    {
      id: "police1",
      label: "Police — response (held, not sent)",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      preferredStationId: "MP-OLD",
      notes:
        "Not for this call. Held only for the picture changing — he says he has taken something, he goes quiet and stops answering, a weapon, a threat, a child in the house. Then there is a real and immediate risk to life and a car goes; until then it does not",
    },
  ],

  evaluation: {
    targets: [
      {
        metric: "Disposal",
        target: "declined at the stack and signposted to health — no car sent",
      },
      {
        metric: "Threshold",
        target:
          "decided on the THRIVE answers — no risk to life, no serious harm, no crime, no legal duty, no child — not on how upset she is",
      },
      {
        metric: "Route back",
        target: "caller told to ring 999 again the moment anything changes, and told what 'anything' means",
      },
      {
        metric: "Change of picture",
        target:
          "if he has taken tablets: ambulance requested and a police unit mobilised within 90 seconds of hearing it",
      },
    ],
    lesson:
      "Nothing about this call is an emergency for a police officer, and the pull to send one anyway is the whole exercise. She is upset, he is her son, and a car would make her feel better for an hour. But he is awake, he is answering her, he has said he does not want to hurt himself, there is no weapon and nobody else in the house. No real and immediate risk to life or of serious harm, no crime, no legal duty, no child. Under Right Care Right Person that is a health call, and GMP has not sent to it since September 2024: the answer is 111 option 2, his GP, the team he was under last year, and a plain instruction to ring back if anything changes. Be honest with yourself about the one run in seven where he has taken tablets. That does not mean declining was wrong. It means the threshold moved and the job moved with it — an ambulance first, and a police car because now there IS a risk to life behind a locked door. The skill is not guessing which run you are in. It is deciding on what you have, and leaving the door open to decide again.",
  },

  callGrade: {
    scale: "police_thrive",
    grade: "C",
    standardMinutes: null,
    basis:
      "GMP does not use a Grade 4 — Grades 3, 4 and 5 were removed from its Incident Response Policy in February 2022 with the introduction of Central Resolution (GMP FOI 01/FOI/24/012708/K, 28 Jun 2024). The sim's grade 4 stands in for GMP's nearest equivalent, Grade C Central Resolution — 'assessed as Low Risk using the THRIVE assessment' — in its 'No Crime — Advise and Close' outcome: no recordable crime and no further police response requested or needed, dealt with by the CRRU without an officer attending. The same FOI attaches no attendance time to Grade C and says GMP holds no average response times, so standardMinutes is null",
  },

  // Rendered into the log verbatim after "closed at the desk, no
  // deployment." on a decline, and inside a setback on an answer — so
  // one sentence, no trailing full stop.
  disposal: {
    noDeployment: true,
    basis:
      "Right Care Right Person (GMP, live from 30 September 2024): police attend a concern for welfare only where there is a real and immediate risk to life or of serious harm, a crime, or a legal duty — the National Partnership Agreement threshold of 26 July 2023, with 'real and immediate' meaning present and continuing (College of Policing) — and a man who is awake, texting, unarmed, alone and denies wanting to hurt himself meets none of that, so the call belongs to NHS 111 option 2, his GP or the crisis team, not to a police car",
  },

  // Top-down: a 100 m stretch of Waterloo Street running east-west, the
  // target terrace on the north side with its rear yards onto the back
  // alley. Drawn so that the tablets branch has somewhere to happen; on
  // the correct path nobody ever looks at it.
  scene: {
    viewBox: { x: -50, y: -30, width: 100, height: 60 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -50, y: -19, w: 35, h: 9 }, kind: "neighbour", label: "Terrace (west)" },
      { shape: { x: -15, y: -19, w: 5, h: 9 }, kind: "target", label: "No. 47 — son's address" },
      { shape: { x: -10, y: -19, w: 60, h: 9 }, kind: "neighbour", label: "Terrace (east)" },
      { shape: { x: -50, y: 0, w: 100, h: 9 }, kind: "neighbour", label: "Terrace (south side)" },
    ],
    roads: [
      { shape: { x: -50, y: -26, w: 100, h: 2 }, kind: "pavement", label: "Back alley" },
      { shape: { x: -50, y: -24, w: 100, h: 5 }, kind: "garden", label: "Rear yards" },
      { shape: { x: -50, y: -10, w: 100, h: 2 }, kind: "pavement", label: "Pavement (north)" },
      { shape: { x: -50, y: -8, w: 100, h: 6 }, kind: "road", label: "Waterloo Street" },
      { shape: { x: -50, y: -2, w: 100, h: 2 }, kind: "pavement", label: "Pavement (south)" },
      { shape: { x: -50, y: 9, w: 100, h: 5 }, kind: "garden", label: "Rear yards" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -12.5, y: -9 }, kind: "other", label: "Caller — on the pavement at the front door" },
      { pos: { x: -30, y: -5 }, kind: "car" },
      { pos: { x: 2, y: -5 }, kind: "car" },
      { pos: { x: 22, y: -5 }, kind: "car" },
      { pos: { x: 38, y: -5 }, kind: "car" },
      { pos: { x: -40, y: -9.5 }, kind: "lamppost" },
      { pos: { x: 30, y: -9.5 }, kind: "lamppost" },
    ],
    hazards: [
      {
        id: "door",
        pos: { x: -12.5, y: -10.5 },
        kind: "structural",
        label: "Front door locked from the inside — occupant awake and declining to open. No power of entry on the information held",
        knownFromPri: true,
      },
      {
        id: "rear-yard",
        pos: { x: -12.5, y: -21.5 },
        kind: "structural",
        label: "Rear yard gate onto the back alley, bolted from the inside — the second route to him if the picture changes",
        knownFromPri: false,
        discoverAfterMinOnScene: 1,
      },
    ],
    // Absent unless the tablets beat fires (revealCasualty). On the
    // correct path he is never a patient and never appears here. When he
    // does, he is a paracetamol overdose in its first hour: well, talking,
    // normal numbers — which is exactly what early paracetamol toxicity
    // looks like, and why a crew do not take the numbers as reassurance.
    casualties: [
      {
        id: "cas-52-son",
        pos: { x: -12.5, y: -14 },
        severity: "serious",
        presentProbability: 0,
        discoverAfterMinBa: 0,
        label: "Male, 31 — tablets taken, awake and talking",
        clinical: {
          vitals: { rr: 16, spo2: 97, hr: 98, bpSys: 122, bpDia: 78, gcs: 15, temp: 36.9, bm: 5.6 },
          ageYears: 31,
          presumedCondition:
            "Paracetamol overdose within the last hour, quantity unknown — asymptomatic at this stage, which is what early paracetamol toxicity looks like",
          redFlags: [],
          preferredDestination: "nearest_a_e",
          criticalInterventions: ["iv_access"],
        },
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Waterloo Street / front door", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · East end", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear yards / back alley", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · West end", face: "left", bearingDeg: 270 },
    ],
  },

  // The caller's side of the THRIVE conversation. Written so that the
  // operator who answers can hear every answer that says "no car": no
  // threat, no self-harm, no weapon, nobody else there, awake and in
  // contact. The pressure beat is her asking for an officer anyway.
  informantScript: [
    {
      id: "mum-first",
      atSec: 4,
      text: "It's my son, Daniel. He's thirty-one, he lives on his own on Waterloo Street in Glodwick and he's not coping. He's been crying down the phone at me all week, he's not eating — I've been bringing him meals and they're still on the side. Today he won't answer the door to me. I'm stood outside it now.",
      tone: "info",
    },
    {
      // Threat, harm, risk. Asked straight, answered straight.
      id: "thrive-harm",
      atSec: 35,
      text: "No. No, he's not said anything like that. I asked him straight on Tuesday — do you want to hurt yourself — and he said no, Mum, I just want leaving alone. He's never done anything like that, not even at his worst. There's no one in there with him and there's nothing in that house he'd use. He's not that sort.",
      tone: "info",
    },
    {
      // Vulnerability and engagement: awake, in contact, a history that
      // belongs to health. Note the tablets for his mood — that is the
      // seed the 15% branch grows from.
      id: "thrive-contact",
      atSec: 70,
      text: "He's texting me. Look — just now: 'I'm fine mum go home'. So he's awake and he's answering me, he just won't open the door. He was under the crisis team last year, the home treatment team, after his marriage went. They signed him back to the doctor's in the spring. He's meant to be on tablets for his mood and I don't think he's been taking them.",
      tone: "info",
    },
    {
      // The pull. Seven calls in ten she asks outright, and it is the
      // most reasonable thing in the world to ask.
      id: "wants-police",
      atSec: 130,
      probability: 0.7,
      text: "Can you not just send somebody to knock on? One officer. He'd open the door to a police officer, he'd have to. I don't want an ambulance, he's not ill like that — I just want somebody to look at him who isn't me.",
      tone: "urgent",
    },
    {
      // The call handler has signposted her. Her repeating it back is
      // the route back being set up: what to ring, and when to ring us.
      id: "signposted",
      atSec: 200,
      text: "Right. 111 and press two, the mental health one. And his doctor's in the morning. I've written it down. I'll stop here a bit and keep texting him. And I ring you back if anything changes — anything at all. Yes. I understand.",
      tone: "info",
    },
    // --- The roll. About one run in seven the picture changes. --------
    {
      id: "tablets",
      atSec: 250,
      probability: 0.15,
      suppressesIds: ["settles"],
      text: "He's just texted — oh God. He says he's taken some tablets. 'Taken some tablets don't worry'. Don't worry. He's took something. I'm banging on the door and he's not coming.",
      tone: "critical",
      effect: { pulseCritical: true, revealCasualty: "cas-52-son" },
    },
    {
      id: "tablets-detail",
      atSec: 290,
      requiresFiredIds: ["tablets"],
      text: "I've asked him what and how many and he says paracetamol, about half an hour ago, he won't say how many. I can see the packet on the side through the window and it's open. He's stopped answering me now. He's stopped texting.",
      tone: "critical",
    },
    {
      // Only on the tablets branch, and only if nobody has got there.
      // On the correct path no unit ever arrives, so a delay beat that
      // was not gated on the branch would fire on every declined run.
      id: "slow-response",
      atSec: 420,
      delayThresholdSec: 660,
      requiresFiredIds: ["tablets"],
      text: "Where are they? It's been ages. He's not answering the door and he's not answering his phone and I can't get in. I've tried the back and the yard gate's bolted. Please.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    // --- The other six runs in seven. -----------------------------------
    {
      // No probability, deliberately: tablets has taken its 15%, and this
      // is the rest. If it were also probabilistic a share of runs would
      // hear neither and she would be left outside the door forever.
      id: "settles",
      atSec: 300,
      suppressesIds: ["tablets"],
      text: "He's opened the door. He looks dreadful and he's been crying but he's stood there talking to me. He says he'll ring the doctor's with me in the morning and I can stop tonight. I'm sorry for bothering you. I didn't know who else to ring.",
      tone: "info",
    },
  ],

  // The call as Lorraine has it: on her own mobile on the Waterloo Street
  // pavement, a plate of his tea going cold on the windowsill, knocking
  // on a door her son will not open. He is texting her from behind it.
  // She wants a police officer because that is the door she thinks he
  // will open to, and she will ask for one.
  call: {
    caller: {
      name: "Lorraine Crabtree",
      phone: "07700 900318",
      relation: "The occupant's mother — walked round from Fitton Hill, no key",
      where: "The pavement outside 47 Waterloo Street, at the front door",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "I don't know if this is a 999 or not. It's my son — he's thirty-one, he lives on his own on Waterloo Street in Glodwick, and he won't open the door to me. He's been in a terrible way all week, crying, not eating, and now he's shut himself in. He's in there, I can hear the telly. Can somebody come and knock on? He'd open it to a police officer.",
    deflection: "I don't — sorry, I don't know why you're asking me that. I just want somebody to come and knock on his door.",
    reassurance: {
      text: "Lorraine, you did the right thing ringing. I'm going to go through this with you properly, and then we'll work out together what happens next.",
      reply: "Okay. Okay. Sorry. I'm just stood here and I don't know what to do with myself.",
    },
    answers: {
      p_happening: {
        text: "Nothing's happening — that's just it. He's in there and he won't open the door. It's my son, Daniel. He's thirty-one, he lives on his own at 47 Waterloo Street. He's been in a state all week — crying down the phone at me, not eating. I've come round with his tea like I do every day and he won't come to the door. He's in there. I can hear the telly. I just need somebody to get him to open it.",
        followUps: [
          {
            id: "p_happening_before",
            text: "Has he ever done this before — not answered the door to you?",
            answer: {
              text: "Not to me. Never. He's been low before — last year was bad — but he's always let me in. I'd bring his tea, he'd eat half of it, we'd sit. Today the curtains are shut and he's texted me to go home.",
            },
          },
          {
            id: "p_happening_seen",
            text: "Can you see him at all — through a window, anything?",
            answer: {
              text: "No. The front curtains are shut. There's a light on upstairs and the telly's on. I've not been round the back — I've not wanted to leave the front in case he opens it and I'm not there.",
            },
          },
        ],
      },
      p_ongoing: {
        text: "He's still in there, if that's what you mean. He's not going anywhere and I'm not going anywhere. He texted me a couple of minutes ago — 'leave it mum'. That's all I get off him. So he's awake, he's got his phone in his hand, he's just not coming to the door.",
      },
      p_weapons: {
        text: "No. No, nothing like that. He's a soft lad, Daniel, he wouldn't hurt a fly. There's nothing in that house — it's a two-up two-down with a telly in it. Why would you ask me that?",
      },
      p_injured: {
        text: "Nobody's hurt. He's not hurt. I asked him — has he done anything, is he thinking anything daft — and he said no. He said he's just tired and he wants leaving be. He's not threatened anybody. He'd not threaten anybody. He's just gone into himself.",
        followUps: [
          {
            id: "p_injured_self",
            text: "When you asked him that — what exactly did he say?",
            answer: {
              text: "'No, Mum.' Like I was being daft for asking. 'No, Mum, I'm not going to do anything, I just want to be on my own.' And I believed him. I still believe him. I just don't want him on his own.",
            },
          },
        ],
      },
      p_who: {
        text: "Just Daniel. He's on his own in there — he lives on his own, since last year. There's nobody with him. And me out here on the pavement. That's everyone.",
      },
      p_description: {
        text: "Describe him? He's — five foot ten, dark hair, he'll need a shave. He'll be in his joggers and a T-shirt, he's been in them all week. He's my son. You're not going to have to pick him out of a crowd, he's behind this door.",
      },
      p_direction: {
        text: "He's not gone anywhere, that's the point. He's inside. I don't think he's been out of that house since Sunday. The only place he's going is nowhere, and that's what's frightening me.",
      },
      p_drink: {
        text: "No. He doesn't drink, not really — a can at Christmas. He's never touched drugs, not that I've known, and I'd know. It's not that. It's his head. It's his mood.",
      },
      p_known: {
        text: "He's my son. Daniel Crabtree, thirty-one. I'm his mum, Lorraine. I know him better than anybody alive and I'm telling you he's not right.",
      },
      p_vulnerable: {
        text: "He is. He's not well — it's his nerves, his mental health, whatever you want to call it. He's had proper help for it before and he was doing alright. This week he's gone right down. He's not eating — you can see it in his face. That's what I'd call at risk. He's not a danger to anybody. He's just not looking after himself and I can't get to him.",
        followUps: [
          {
            id: "p_vulnerable_child",
            text: "Is there any child in the house, or anyone who depends on him?",
            answer: {
              text: "No. No children. It's just him. That's half the trouble — there's nobody in there to notice.",
            },
          },
        ],
      },
      p_where: {
        text: "47 Waterloo Street, Glodwick. OL4 1ES. The terrace on the north side — red door, grey wheelie bin out the front, I'm stood right by it. I've walked round from Fitton Hill, it's ten minutes.",
      },
      p_safe: {
        text: "Me? I'm fine. I'm stood on the pavement outside his front door. Nobody's bothering me. It's him I'm ringing about, not me.",
      },
      p_seen: {
        text: "I'm stood here. I've knocked, I've shouted through the letterbox, I've rung him, I've texted him. He's texted me back to go home. That's what I've seen — a shut door and a text. There's nobody to tell me anything.",
      },
      p_details: {
        text: "Lorraine Crabtree. I'm his mum. This is my mobile — 07700 900318. You can ring me back on it, I'll be stood right here.",
      },
    },
    interjections: [
      {
        atSec: 50,
        text: "Hang on — he's texting. …'Leave it mum.' That's all. Leave it. He's awake, then. He's sat in there with his phone, reading me stood outside.",
      },
      {
        atSec: 120,
        text: "You're going to tell me to ring somebody else, aren't you. I can hear it coming. I rang you last November and somebody rang me back the next day. The next day.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 160,
        text: "I've knocked again. He's put the telly up. He's turned it up so he can't hear me. Thirty-one years old and he's turned the telly up on his mum.",
      },
      {
        atSec: 200,
        text: "You're sending somebody? Oh — thank you. Thank you. …Should I tell him? He'll not like it if he thinks I've set the police on him. I won't tell him. I'll just wait.",
        requiresOpened: true,
      },
    ],
    onDispatch: "Thank you. I'll be stood by the door. I won't tell him they're coming — he'd only get himself in a state.",
  },
};
