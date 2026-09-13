import type { Scenario } from "../incident_types";

// Scenario 45 — concern for welfare, flat behind Salford Precinct.
//
// The job that is graded on what might be behind the door rather than on
// what probably is. A housing officer is on a first-floor landing in
// Pendleton: the tenant has not been seen since Thursday, his post is
// jammed in the door, and there is a smell she does not like. Probably he
// has been dead since the weekend, and there is no hurry in that.
// Possibly he is on the floor and still breathing, and there is every
// hurry in that — so it goes out as a Grade 1 and the door goes in on the
// same reasoning.
//
// Two decisions live at the desk. First, entry: officers may force a
// door to save life or limb (PACE 1984 s.17(1)(e)) and normally do it
// themselves; GMFRS come for the door if asked. There is deliberately
// NO fire slot on the attendance — the scorer counts every slot on the
// PDA as owed, and an empty pump slot is a nudge toward sending one by
// default. Fire is asked for off-PDA when the door is beating the
// officers, and the over-commitment row records that it was a choice.
// A key may turn up twenty minutes away, and whether to wait for it is
// the whole question in miniature — you wait on the chance he is dead,
// you force on the chance he is alive. Second, commitment: a sudden
// death does not end when the door opens. The ambulance do the
// recognition of life extinct and clear; the police car stays for the
// coroner's officer, the next of kin and the undertaker, and it is off
// the board for the rest of the shift. The operator who has not noticed
// will try to send it to the next job.
//
// The sudden-death sequence follows general English practice
// (paramedic recognition of life extinct; police hold the scene and the
// coroner's process for an unexpected death; the coroner's undertaker
// removes). GMP's and NWAS's own procedures were not obtained. That
// response officers carry a ram is general UK practice too, not a GMP
// document.
//
// The deceased is NOT modelled as a scene casualty. Casualties are
// patients; he is carried in the beats and in the lesson. About one run
// in five he answers the door in his dressing gown, and the smell was the
// bin store.
//
// Under Right Care Right Person (GMP, from 30 September 2024) a pure
// physical-health concern is signposted to NWAS. This one keeps a police
// response because the locked door and the likely death are police
// functions — that reading of the pathway is ours, not GMP's published
// text.
//
// FICTIONAL: everyone in it, the block number, the flat and the housing
// association. Churchill Way is a real Pendleton street on the estate
// south-east of Salford Shopping City; No. 18 and "Brindle Heath
// Housing" are not real.

export const scenario45: Scenario = {
  id: "45",
  slug: "45_welfare_salford_precinct",
  title: "Concern for welfare — flat, Salford Precinct",
  type: "police_concern_for_welfare",
  patch: "Western",
  severity: "moderate",
  trigger:
    "Housing officer on the landing outside a first-floor flat. Tenant, 64, not seen since Thursday; post jammed in the door; a smell on the landing. No answer to knocking. No key",

  location: {
    address: "Flat 6, 18 Churchill Way, Pendleton, Salford",
    postcode: "M6 5QX",
    coords: { lat: 53.486, lng: -2.2834 },
  },

  property: {
    class: "Three-storey walk-up block of six flats, 1970s — first-floor flat, single occupancy",
    size: "Two-bedroom flat; two flats per floor off a shared stair",
    materials: "Brick and concrete floors; uPVC flat doors fitted in the 2010s",
    occupants:
      "One — Mr Dennis Gaskell, 64, lives alone. Housing officer on the landing; the other five flats occupied",
    vulnerabilities: [
      "Heart condition on the housing file — a hospital stay last year",
      "Not seen for four days; phone straight to voicemail; car outside not moved",
      "If it is a death, the landing fills with neighbours before the door is open",
    ],
    access:
      "Churchill Way, on the estate south-east of Salford Shopping City. Communal door on a fob — the housing officer meets units at it. Flat 6 is first floor off the shared stair; no lift. Flat door is uPVC with a multipoint lock",
    knownHazards: [
      "Possible unattended death behind the door — the flat is a scene until a supervisor says otherwise, and nobody touches anything",
      "Forced entry on a uPVC multipoint — a ram is a coin toss on these; snap the cylinder",
      "Neighbours on a narrow landing while the door goes in",
    ],
    firstDueStationId: "MP-SAL",
    doorType: "upvc",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling in a walk-up block. Communal door on a fob; the caller has a fob but no key to the flat.",
      "Address history: one previous concern for welfare at Flat 6 (2024) — he answered the door. That is the hope and the trap, both.",
      "No keyholder recorded on any system. The landlord's office is checking its key board; a key, if there is one, is twenty minutes away.",
      "Local knowledge: flat doors in these blocks are uPVC multipoint. A ram struggles on them — the slab flexes and the multipoint holds; snapping the cylinder is the surer way in, and GMFRS carry the kit for it.",
    ],
  },

  methane: {
    M: "No",
    E: "Flat 6, 18 Churchill Way, Pendleton, Salford, M6 5QX — first floor, walk-up block",
    T: "Concern for welfare — man, 64, not seen since Thursday; post piling up; smell on the landing. Entry likely to be required",
    H: "Possible unattended death behind the door — scene preservation. Forced entry on a uPVC multipoint. Neighbours on the landing",
    A: "Churchill Way, south-east of the precinct. Communal door on a fob; housing officer meets units there. First floor, no lift",
    N: "None confirmed — one man believed inside",
    emergencyServices:
      "Police lead. Ambulance for the man who may be alive; GMFRS only if asked for the door",
  },

  pda: [
    {
      id: "police1",
      label: "Police — first response",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      preferredStationId: "MP-SAL",
      notes:
        "One car — a welfare check is one car. They can put the door in themselves to save life (PACE s.17) if they have a ram with them; if the uPVC beats them, ask GMFRS for the door — that is a request, not a slot. If it is what the caller thinks, this crew is there for the rest of the shift",
    },
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-SFD",
      notes:
        "For the man who might be alive on the floor. If he is not, the crew do the recognition of life extinct and clear — it is the police car that stays",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "Attendance", target: "< 15 minutes — GMP Grade 1" },
      {
        metric: "Proportionate response",
        target: "one car and an ambulance; a pump asked for off-PDA only when the door is beating the officers",
      },
      {
        metric: "Entry decision",
        target:
          "forced on the chance he is alive, not held for a key on the chance he is not — and not forced by a neighbour because nobody came",
      },
      {
        metric: "Commitment",
        target: "the first car written off for hours once it is a death — the rest of the patch planned without it",
      },
    ],
    lesson:
      "A welfare check is one car, and it is graded on what might be behind the door rather than on what probably is. Probably is a man who has been dead since the weekend, and there is no hurry in that. Possibly is a man on the floor who has been there two days and is still breathing, and there is every hurry in that — so the car goes on the immediate grade and the door goes in on the same reasoning — officers can force it to save life, and you ask for fire when the door is beating them and not before. Then the part the grade never mentions. If he is dead, the ambulance do the recognition of life extinct and clear; your car does not. Coroner's officer, a daughter in Swinton who is told in person, an undertaker who comes when they come — that crew is off your board for the rest of the shift, and the operator who has not written them off will try to send them to the next job.",
  },

  // Top-down — a 100 m run of Churchill Way with the block set back
  // behind a grass frontage. The communal door faces the street; the bin
  // store sits against the block's west end, which matters because it
  // is the innocent explanation for the smell on one run in five.
  scene: {
    viewBox: { x: -50, y: -35, width: 100, height: 70 },
    compassNorth: "up",
    buildings: [
      {
        shape: { x: -16, y: -30, w: 32, h: 14 },
        kind: "target",
        label: "18 Churchill Way — walk-up block (Flat 6, first floor)",
      },
      { shape: { x: -50, y: -30, w: 30, h: 14 }, kind: "neighbour", label: "Neighbouring block" },
      { shape: { x: 20, y: -30, w: 30, h: 14 }, kind: "neighbour", label: "Neighbouring block" },
      { shape: { x: -16, y: -14, w: 6, h: 4 }, kind: "other", label: "Bin store" },
    ],
    roads: [
      { shape: { x: -50, y: -16, w: 100, h: 16 }, kind: "garden", label: "Grass frontage" },
      { shape: { x: -3, y: -16, w: 6, h: 16 }, kind: "driveway", label: "Path to communal door" },
      { shape: { x: -50, y: 0, w: 100, h: 3 }, kind: "pavement" },
      { shape: { x: -50, y: 3, w: 100, h: 9 }, kind: "road", label: "Churchill Way" },
      { shape: { x: -50, y: 12, w: 100, h: 3 }, kind: "pavement" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -20, y: 5 }, kind: "car", label: "Tenant's car — not moved for days" },
      { pos: { x: 14, y: 5 }, kind: "car", label: "Housing officer's pool car" },
      { pos: { x: -40, y: 1 }, kind: "lamppost" },
      { pos: { x: -36, y: -8 }, kind: "tree" },
      { pos: { x: 30, y: -8 }, kind: "tree" },
    ],
    hazards: [
      {
        id: "flat-6",
        pos: { x: 6, y: -24 },
        kind: "structural",
        label: "Flat 6, first floor — man not seen since Thursday; post behind the door; smell on the landing",
        knownFromPri: true,
      },
      {
        id: "communal-door",
        pos: { x: 0, y: -16 },
        kind: "structural",
        label: "Communal door on a fob — housing officer meets units here",
        knownFromPri: true,
      },
      {
        id: "landing",
        pos: { x: -4, y: -22 },
        kind: "structural",
        label: "Neighbours on the first-floor landing — cleared before the door goes in, kept clear after",
        discoverAfterMinOnScene: 1,
      },
      {
        id: "bin-store",
        pos: { x: -13, y: -12 },
        kind: "structural",
        label: "Bin store against the west end of the block — the other explanation for a smell on the landing",
        discoverAfterMinOnScene: 2,
      },
    ],
    // No casualty. If he is alive he is on his feet and arguing; if he is
    // not, he is not a patient, and the job that follows is the point.
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Churchill Way / communal door", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · East end / neighbouring block", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear of block", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · West end / bin store", face: "left", bearingDeg: 270 },
    ],
  },

  // The housing officer, on the landing, until the first unit reaches
  // her. One run in five he opens the door at the two-minute mark and the
  // rest of the script is retired. Otherwise the picture hardens beat by
  // beat, a key may or may not be on its way, and on a slow response the
  // neighbours do what neighbours do.
  informantScript: [
    {
      id: "officer-first",
      atSec: 5,
      text: "It's Bisi Ogundipe, I'm the housing officer for the flats on Churchill Way, behind the precinct. I'm on the first-floor landing outside number 6. It's Mr Gaskell — nobody's seen him since Thursday, there's post jammed in his door, and there's a smell up here I don't like. I've knocked and I've shouted through the letterbox and there's nothing. I haven't got a key to the flat.",
      tone: "urgent",
    },
    {
      id: "history",
      atSec: 45,
      text: "The lad downstairs says his telly's been going day and night and the curtains haven't moved since the weekend. His car's outside and it's not been anywhere. He's got a heart thing — he's on tablets for it, he had a spell in hospital last year. His phone goes straight to voicemail. Do I need an ambulance as well, or is that yours to decide?",
      tone: "info",
    },
    // --- The roll. One run in five he is alive and embarrassed. ----------
    {
      id: "answers-door",
      atSec: 130,
      probability: 0.2,
      suppressesIds: ["no-answer", "key-coming", "next-of-kin", "landing-crowd", "neighbour-entry"],
      text: "Hang on. Hang on — the door's opening. He's here. He's stood in front of me in his dressing gown. He says he's been in bed since Friday with a chest infection and his phone's dead. He's talking, he's on his feet, he's more bothered about the fuss than anything. The smell — he says it's the bin store, the lorry's not been. I'm sorry. I'll stay with him till your officers have had a look.",
      tone: "info",
    },
    {
      id: "relief-follow",
      atSec: 200,
      requiresFiredIds: ["answers-door"],
      text: "He wants me to tell you he's fine and he's not going anywhere in an ambulance. I've told him your officers will want to see him anyway. He's grey, if I'm honest, but he's arguing with me, so he can't be that bad. Do you still want to send someone? That's your call, not mine.",
      tone: "info",
    },
    // --- The other four runs. Certain, so the question always resolves. --
    {
      id: "no-answer",
      atSec: 160,
      suppressesIds: ["answers-door"],
      text: "Still nothing. I've been round to the kitchen window — it looks onto the landing — and the blind's down, but there are flies on the inside of the glass. A lot of them. I've done one of these before, in another block. I think you know what I'm telling you. Are your officers going to put the door in, or do you need the fire brigade for that?",
      tone: "critical",
    },
    {
      id: "key-coming",
      atSec: 230,
      probability: 0.4,
      requiresFiredIds: ["no-answer"],
      text: "My office have rung back. There is a key for that flat on the board after all — one of the lads is bringing it up from Eccles, he says twenty minutes. If your officers would rather not wreck the door it's on its way. I'll leave that with you.",
      tone: "info",
    },
    {
      id: "next-of-kin",
      atSec: 290,
      probability: 0.6,
      requiresFiredIds: ["no-answer"],
      text: "I've found a next of kin on his file — a daughter, Nicola, in Swinton. I've not rung her. I didn't think it should come from me over the phone, not if it's what I think it is. I'll give the number to your officers.",
      tone: "info",
    },
    // --- Slow response only. ---------------------------------------------
    {
      id: "landing-crowd",
      atSec: 420,
      delayThresholdSec: 540,
      requiresFiredIds: ["no-answer"],
      text: "I've got half the block out on this landing now asking me what's going on. Kevin from number 2, his mate — he's saying he'll put the door in himself if nobody comes. I've told him not to. How long are you going to be?",
      tone: "urgent",
    },
    {
      id: "neighbour-entry",
      atSec: 780,
      delayThresholdSec: 840,
      probability: 0.7,
      requiresFiredIds: ["landing-crowd"],
      text: "He's done it. Kevin's shouldered the door before I could stop him. He's in the chair by the window. He's gone — I'm sorry, there's no doubt about it, he's been gone days. I've got everybody back out on the landing and I've pulled the door to. Nobody's touching anything. Please get someone here.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],

  // GMP publishes one Grade 1 figure, force-wide, and calls it both its
  // aspired attendance time and the national target. There is no GMP
  // rural figure, so none is used.
  callGrade: {
    scale: "police_thrive",
    grade: 1,
    standardMinutes: 15,
    basis:
      "GMP's own published Grade 1 (Immediate) figure: 'Immediate or grade 1 incidents - within 15 minutes' (GMP Chief Constable's Regulation 28 response to HM Senior Coroner Manchester West, 26 Aug 2025) and 'under 15 minutes (our aspired attendance time)' (GMCA GMP Performance Briefing, Jan 2026; 95% within 15 min in 2025). Graded 1 on THRIVE because a man may be collapsed behind a locked door — a real and immediate risk to life until proven otherwise — and forcing entry to a private dwelling is a police function. GMP's Right Care Right Person pathway (live 30 Sep 2024) would signpost a pure physical-health concern to NWAS; keeping police on this one for the door and the likely sudden death is our reading of that pathway, not GMP's published text.",
  },

  // The call as Bisi has it: on her work mobile on the first-floor
  // landing at 18 Churchill Way, a few steps back from a door that has
  // post jammed in it and a smell behind it. She has done one of these
  // before. She has a fob for the front door and no key for the flat.
  call: {
    caller: {
      name: "Bisi Ogundipe",
      phone: "07700 900947",
      relation: "Housing officer for the block — Brindle Heath Housing",
      where: "First-floor landing outside Flat 6, 18 Churchill Way, a few steps back from the door",
      line: "mobile",
      state: "calm",
    },
    opening:
      "Police, please — it's a welfare check, I think. My name's Bisi Ogundipe, I'm a housing officer, and I'm stood outside one of our tenants' flats on Churchill Way in Pendleton, behind the precinct — 18 Churchill Way, Flat 6, first floor. He's sixty-four, he lives on his own, and nobody's had sight of him since Thursday. His post's stuck in the door, he's not answering me, and to be honest with you there's a smell on this landing I don't like. I can't get in.",
    deflection: "Sorry — hold on. Kevin, leave it — sorry. Go on.",
    reassurance: {
      text: "Bisi, you've done the right thing ringing. Officers are on their way. Stay on the landing and keep everybody else off it.",
      reply: "Right. Yes. I'm here. I'll keep them back.",
    },
    answers: {
      p_happening: {
        text: "Nothing's happening, that's the trouble. It's a man who hasn't answered his door in four days. Dennis Gaskell, Flat 6, he's sixty-four and he lives on his own. Post's jammed in the door, curtains haven't moved, and there's a smell on the landing. I've knocked, I've shouted, I've rung his phone — it goes straight to voicemail. I can't get in.",
        tone: "urgent",
      },
      p_ongoing: {
        text: "Well — it's not going on, nothing's going on. That's what I'm ringing about. It's four days of nothing. He's not answered, he's not come out, and I'm stood outside a door I can't open.",
      },
      p_weapons: {
        text: "No. No, nothing like that. It's not that sort of call. It's a man in his sixties on his own who hasn't answered his door.",
      },
      p_injured: {
        text: "I don't know. That's why I'm ringing you. He could be on the floor in there — he could be worse. Nobody's threatened anybody. Do you send an ambulance with this, or is that a separate call? I've never been sure.",
        tone: "urgent",
      },
      p_who: {
        text: "Just Mr Gaskell — Dennis Gaskell, sixty-four, lives alone in Flat 6. Then there's me on the landing, and Kevin from Flat 2 downstairs has come up — he's the one who told me Thursday.",
        followUps: [
          {
            id: "p_who_kevin",
            text: "What has Kevin told you?",
            answer: {
              text: "He saw him Thursday afternoon going out to the shop, and nothing since. He says the telly's been on day and night through his ceiling, and the curtains haven't moved. And Dennis's car's outside and it's not been anywhere.",
            },
          },
        ],
      },
      p_description: {
        text: "Sixty-four, white, grey hair, glasses, slight — he's not a big man. I can't tell you what he's wearing because I've not seen him. That's rather the point.",
      },
      p_direction: {
        text: "He's not gone anywhere. His car's outside on the road — silver Focus, it's not moved. That's what worries me. If he'd gone to stay with somebody the car would be gone.",
      },
      p_drink: {
        text: "Not that I know of. He's not a drinker — nothing's ever come to us about that. He's on tablets for his heart. That's all I know.",
      },
      p_known: {
        text: "Yes, he's our tenant — has been since 2011. I've dealt with him a few times, rent things, a repair. Quiet man, keeps himself to himself. We had a call like this about him once before, a couple of years back, and he opened the door and gave me a right look. I'm hoping for the same.",
      },
      p_vulnerable: {
        text: "He is. Sixty-four, on his own, a heart condition — he had a spell in hospital last year, he's on tablets for it. His phone's going straight to voicemail. I'd call that at risk, yes.",
        tone: "urgent",
        followUps: [
          {
            id: "p_vulnerable_heard",
            text: "Can you hear anything from inside?",
            answer: {
              text: "The telly. That's all. It's loud — some quiz thing. No footsteps, nothing when I shout. I've had my ear to the letterbox and it's just the telly.",
              tone: "urgent",
            },
          },
        ],
      },
      p_where: {
        text: "Flat 6, 18 Churchill Way, Pendleton — the estate behind Salford Shopping City, the south-east side. M6 5QX. Three-storey block, six flats. The communal door's on a fob, so your officers won't get in without me — I'll come down and let them in. First floor, no lift. I haven't got a key to the flat itself; my office are checking the board.",
        followUps: [
          {
            id: "p_where_door",
            text: "What sort of door is it on the flat?",
            answer: {
              text: "uPVC — the white plastic ones with the multipoint lock, they all got done about ten years ago. They're solid. I don't know how you'd get through one without wrecking it.",
            },
          },
        ],
      },
      p_safe: {
        text: "I'm fine. I'm on the landing — I've stepped back from his door a bit because of the smell, if I'm honest. Kevin's here, he's alright. Nobody's in any danger except possibly the man behind that door.",
      },
      p_seen: {
        text: "I've seen the post and I've smelt the smell — that's me. The Thursday is Kevin, the neighbour, telling me. I've been to the door myself and shouted through the letterbox and there's nothing.",
      },
      p_details: {
        text: "Bisi Ogundipe — B-I-S-I, then O-G-U-N-D-I-P-E. Housing officer, Brindle Heath Housing. This is my work mobile, 07700 900947.",
      },
    },
    interjections: [
      {
        atSec: 60,
        text: "I've just shouted through the letterbox again. Nothing. The telly's still going in there — I can hear it from here.",
        tone: "urgent",
      },
      {
        atSec: 120,
        text: "It might be the bins, mind. The bin store's on the end of the block and the lorry's not been. I want to say that. I don't think it is, but I want to say it.",
      },
      {
        atSec: 180,
        text: "There's a car — blue lights, just turned onto Churchill Way. I'll go down and let them in with the fob. Tell them number 18, the middle block, the door on the path.",
        requiresOpened: true,
      },
      {
        atSec: 240,
        text: "How long are you going to be? I've got Kevin stood here and another two doors open on this landing wanting to know what's going on. I can't keep them out here indefinitely.",
        tone: "urgent",
        requiresOpened: false,
      },
    ],
    onDispatch: "Thank you. I'll be at the communal door with the fob. Tell them there's no key — they'll want to know that before they get out of the car.",
  },
};
