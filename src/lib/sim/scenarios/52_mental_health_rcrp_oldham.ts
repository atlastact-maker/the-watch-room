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
};
