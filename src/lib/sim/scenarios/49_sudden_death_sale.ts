import type { Scenario } from "../incident_types";

// Scenario 49 — sudden death, expected, at a care home in Sale Moor.
//
// The job with no urgency in it at all, and that is the point. An
// 89-year-old man on end-of-life care has died in his bed in the small
// hours with a DNACPR in his file. The home has done everything right —
// rung the out-of-hours GP, been told nobody can come for hours, and
// then, not knowing what else to do, rung 999. It arrives on the desk
// as a "sudden death" because that is the incident type the system has,
// and the desk decides what that word costs.
//
// What it should cost is one car, at Grade 2, without lights, for the
// best part of two hours: the officer sees him, reads the file, rings
// the out-of-hours and probably the coroner's officer, and waits for the
// answer. What it costs a careless desk is two cars because the word
// "death" came up, plus an ambulance on lights to a man with a DNACPR,
// and then a Grade 1 in Sale forty minutes later with nothing to send.
//
// The ambulance question is left deliberately ambiguous, because it is
// ambiguous in real life. Nobody on the premises can verify the death
// (residential home, no nurse at night); a paramedic can, if one is
// needed, but that is a slow-time arrangement through the clinical hub
// rather than a DCA mobilised from this desk. There is no ambulance slot
// on the attendance for that reason — an empty slot on the checklist is
// a nudge toward the wrong answer.
//
// Who verifies, who certifies and when the coroner comes into it follow
// general English practice (verification by a nurse or paramedic;
// certificate from a doctor who attended the patient; the coroner only
// where no doctor will certify or an injury may have contributed).
// GMP's and NWAS's own sudden-death procedures were not obtained.
//
// The deceased is NOT modelled as a casualty. There is no patient.
//
// FICTIONAL: the home, its name and number, and everyone in it. Temple
// Road in Sale Moor is real; Whitethorn House is not.

export const scenario49: Scenario = {
  id: "49",
  slug: "49_sudden_death_sale",
  title: "Sudden death, expected — care home, Sale",
  type: "police_sudden_death_expected",
  patch: "Southern",
  severity: "low",
  trigger:
    "999 from the night manager of a residential care home. Resident, 89, on end-of-life care, found dead in bed on the 4 a.m. checks. Expected — DNACPR on file, GP saw him this week. Out-of-hours doctor cannot attend for several hours and nobody on the premises can verify the death",

  location: {
    address: "Whitethorn House, 41 Temple Road, Sale Moor, Sale",
    postcode: "M33 2FQ",
    coords: { lat: 53.4226, lng: -2.3039 },
  },

  property: {
    class: "Residential care home — converted Edwardian villa with a single-storey rear extension, 24 beds, no nursing",
    size: "Main house over two floors plus the extension; room 7 is ground floor, rear of the main house",
    occupants:
      "Night manager and two care assistants on duty. Twenty-three other residents, asleep. The deceased in room 7, door closed, undisturbed. Next of kin on her way",
    vulnerabilities: [
      "Twenty-three elderly residents, several living with dementia — a blue-light arrival in the small hours is a disturbance nobody needs",
      "Nobody on the premises can verify the death: residential, not nursing, and no nurse on at night",
      "Next of kin arriving and wanting answers the officer cannot give until a doctor has decided",
    ],
    access:
      "Front door on Temple Road, keypad, locked overnight — ring and the night manager opens it. Drive takes two cars; the road has residents' parking both sides",
    knownHazards: [
      "None physical. Quiet approach — no lights, no sirens, no radio in the corridor",
    ],
    firstDueStationId: "MP-TRA",
    doorType: "composite",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — care home. Three ambulance attendances at the address in twelve months (two falls, one chest infection); no police history.",
      "Expected death, DNACPR on file, GP saw him this week. If the practice will issue the certificate this is not a coroner's case, and the officer's job is to confirm that and go. It goes to the coroner's officer only if no doctor will certify, or if the fall last month is thought to have contributed.",
      "Nobody at the home can verify the death — residential, no nurse at night, and the district nurses' line has put her through to the out-of-hours GP. If a paramedic ends up verifying, ask for one by phone through the ambulance clinical hub in slow time — it is not a Category 1 and not a DCA from this desk.",
      "One car. It will be off the road for the best part of two hours. Plan the rest of the patch around that before you send it, not after.",
    ],
  },

  methane: {
    M: "No",
    E: "Whitethorn House, Temple Road, Sale Moor, M33 2FQ — residential care home, converted villa",
    T: "Sudden death, expected — 89-year-old resident on end-of-life care, DNACPR on file. Not suspicious. Nobody available to verify or certify until morning",
    H: "None. Residents asleep — quiet approach",
    A: "Temple Road. Front door keypad, night manager opens. Drive holds two cars",
    N: "None — the deceased is not a casualty. Twenty-three other residents, asleep",
    emergencyServices:
      "Police only, one unit, Grade 2. No ambulance: if a paramedic is needed to verify, that is arranged in slow time by phone, not mobilised",
  },

  pda: [
    {
      id: "police1",
      label: "Police — one unit",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: [],
      preferredStationId: "MP-TRA",
      notes:
        "One car is the whole attendance, and single-crewed is fine. The officer sees him, reads the DNACPR, speaks to the out-of-hours doctor and, if no doctor will certify, to the coroner's officer. Nothing about that needs a second unit or a blue light. No ambulance slot on purpose: a paramedic verifying the death, if nobody else can, is a slow-time phone arrangement with the clinical hub, not a DCA sent on the word death",
    },
  ],

  evaluation: {
    targets: [
      {
        metric: "Grade 2 attendance",
        target: "on scene inside 60 minutes of the call, and not on blue lights",
      },
      {
        metric: "Attendance size",
        target: "one unit. Not two, and no ambulance on the strength of the word death",
      },
      {
        metric: "Verification",
        target: "the who-verifies question put to the out-of-hours doctor or the clinical hub by phone, not answered by mobilising a DCA",
      },
      {
        metric: "Holding",
        target: "the unit stays until the doctor or the coroner's officer has decided — ninety minutes to three hours — and is not pulled for the next job",
      },
      {
        metric: "Patch cover",
        target: "the rest of the Trafford patch still covered while this car is off the road — a Grade 1 in Sale during it is not left waiting",
      },
    ],
    lesson:
      "Nothing about this is urgent and everything about it costs you. An 89-year-old man on end-of-life care has died in his bed with a DNACPR in his file, and the only reason the desk knows is that nobody could get a doctor before morning. It is a Grade 2, and it will take one car off the road for the best part of two hours: the officer has to see him, read the file, ring the out-of-hours and probably the coroner's officer, and wait for the answer. The mistakes are all in the sending. Two cars because the word death came up is a car you will want back within the hour. An ambulance on lights to a man with a DNACPR is a crew for nothing, when a paramedic verifying in slow time — if one is needed at all — is a phone call. Send one, send it quietly, and then look after the rest of the patch, because the next Grade 1 in Sale does not care that your car is sat outside a care home waiting for a doctor to ring back.",
  },

  // Top-down scene — a 100 m stretch of Temple Road drawn north-south,
  // with the home on the west side. Nothing here is a hazard in the fire
  // sense; the markers are the things the officer needs to know before
  // the door opens.
  scene: {
    viewBox: { x: -50, y: -35, width: 100, height: 70 },
    compassNorth: "up",
    buildings: [
      {
        shape: { x: -34, y: -14, w: 22, h: 18 },
        kind: "target",
        label: "Whitethorn House — main house (room 7 ground floor, rear)",
      },
      {
        shape: { x: -34, y: 4, w: 16, h: 10 },
        kind: "target",
        label: "Rear extension — bedrooms 17 to 24",
      },
      { shape: { x: -34, y: -33, w: 22, h: 14 }, kind: "neighbour", label: "No. 39" },
      { shape: { x: -34, y: 18, w: 22, h: 14 }, kind: "neighbour", label: "No. 43" },
      { shape: { x: 20, y: -32, w: 26, h: 26 }, kind: "neighbour", label: "Houses (east side)" },
      { shape: { x: 20, y: 2, w: 26, h: 28 }, kind: "neighbour", label: "Houses (east side)" },
    ],
    roads: [
      { shape: { x: 2, y: -35, w: 2, h: 70 }, kind: "pavement" },
      { shape: { x: 4, y: -35, w: 10, h: 70 }, kind: "road", label: "Temple Road" },
      { shape: { x: 14, y: -35, w: 2, h: 70 }, kind: "pavement" },
      { shape: { x: -12, y: -12, w: 14, h: 8 }, kind: "driveway", label: "Drive — two cars" },
      { shape: { x: -50, y: -14, w: 16, h: 28 }, kind: "garden", label: "Rear garden" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -6, y: -8 }, kind: "car", label: "Night manager's car" },
      { pos: { x: 8, y: 14 }, kind: "car", label: "Residents' parking both sides" },
      { pos: { x: 8, y: -24 }, kind: "car" },
      { pos: { x: 16, y: -20 }, kind: "lamppost" },
      { pos: { x: -44, y: -20 }, kind: "tree" },
      { pos: { x: -44, y: 6 }, kind: "tree" },
      {
        pos: { x: -28, y: 0 },
        kind: "other",
        label: "Room 7 — ground floor rear. The deceased, undisturbed, door closed",
      },
    ],
    hazards: [
      {
        id: "keypad",
        pos: { x: -11, y: -6 },
        kind: "structural",
        label: "Front door keypad, locked overnight — ring, the night manager opens it. Do not knock",
        knownFromPri: true,
      },
      {
        id: "residents",
        pos: { x: -23, y: -9 },
        kind: "structural",
        label: "Twenty-three residents asleep, several with dementia — no lights, no noise, radio down in the corridor",
        knownFromPri: true,
      },
      {
        id: "parking",
        pos: { x: 9, y: 4 },
        kind: "structural",
        label: "Drive takes two cars and the road is parked both sides — a second unit blocks Temple Road",
        knownFromPri: true,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Temple Road frontage / drive", face: "front", bearingDeg: 90 },
      { id: 2, label: "Sector 2 · No. 39 side", face: "right", bearingDeg: 0 },
      { id: 3, label: "Sector 3 · Rear garden / extension", face: "rear", bearingDeg: 270 },
      { id: 4, label: "Sector 4 · No. 43 side", face: "left", bearingDeg: 180 },
    ],
  },

  // The night manager. Calm, apologetic, and stuck. Nothing she says
  // gets more urgent because nothing is; what changes with time is how
  // much of her night — and her residents' morning — the wait eats.
  informantScript: [
    {
      id: "first",
      atSec: 5,
      text: "It's Grace, the night manager at Whitethorn House on Temple Road. One of our residents has passed away — Mr Halliwell, he's 89, he was on end-of-life care. Kayleigh found him on the four o'clock checks. It's been expected all week. I've rung the out-of-hours and they've said nobody can come for four or five hours, and I honestly didn't know who else to ring.",
      tone: "info",
    },
    {
      id: "dnacpr",
      atSec: 40,
      text: "There's a DNACPR in his file and a ReSPECT form with it. Nobody's done anything to him — nobody's touched him, he's as Kayleigh found him and his door's shut. His own GP saw him on Tuesday. There's nothing untoward about it at all, I just need somebody to tell me what happens now.",
      tone: "info",
    },
    {
      id: "no-nurse",
      atSec: 100,
      text: "The thing is we're residential, not nursing — there's no nurse on tonight, so none of us can verify him. It's me and two carers and twenty-three other residents asleep. I'm not asking for a blue light, please don't send anyone with the lights on, it'll have half the corridor up.",
      tone: "info",
    },
    {
      id: "daughter-coming",
      atSec: 200,
      probability: 0.75,
      text: "I've rung his daughter, Janet — she'd asked to be rung whatever the hour. She's coming over from Altrincham, she'll be twenty minutes. She's asked whether he can go to the funeral director tonight and I've said I don't know. I don't.",
      tone: "info",
    },
    // --- The roll on who decides. About a third of nights the doctor
    // rings back early and takes the coroner out of it; on some of the
    // rest, the fall last month puts the coroner back in. The two are
    // one-way exclusive — the early call-back suppresses the coroner
    // beat, never the reverse, so there is no hole where neither can
    // fire and no night where both do.
    {
      id: "ooh-callback",
      atSec: 420,
      probability: 0.35,
      suppressesIds: ["coroner-question"],
      text: "The out-of-hours doctor's just rung me back. She's spoken to his practice and they'll do the certificate first thing — she says it doesn't need the coroner, he just needs verifying by a nurse or a paramedic and she can't get anyone to us before eight. So do you still need to send the police? I don't want to waste anybody.",
      tone: "info",
    },
    {
      id: "coroner-question",
      atSec: 480,
      probability: 0.4,
      text: "Sorry — the out-of-hours have rung back. Because he had a fall here last month and went to Wythenshawe for an X-ray, the doctor says she can't say tonight whether it has to go to the coroner. She said the police would sort that out with the coroner's officer. So I suppose it's you after all.",
      tone: "info",
    },
    {
      id: "quiet",
      atSec: 1320,
      probability: 0.5,
      requiresFiredIds: ["daughter-coming"],
      text: "Sorry to ring again. Nothing's changed — Janet's here now and she's sat with him. There's no rush from our end, I just didn't want you to think we'd sorted it ourselves and forget about us.",
      tone: "info",
    },
    // --- Only on a slow response. Forty minutes is inside the Grade 2
    // standard and still long enough for a care home's morning to start
    // arriving; seventy-five is outside it.
    {
      id: "slow-40",
      atSec: 2400,
      delayThresholdSec: 2400,
      text: "It's Grace again from Whitethorn House. It's been forty minutes — are you still sending somebody? I've got to start getting people up at six and his room's on the way to the dining room. I can't keep his door shut and a carer outside it all morning.",
      tone: "urgent",
    },
    {
      id: "slow-75",
      atSec: 4500,
      delayThresholdSec: 4500,
      requiresFiredIds: ["slow-40"],
      text: "Over an hour now. The day staff are in at seven and I'll be handing over a resident who's died with nobody having been. I rang the funeral director and they won't take him until a doctor or the police have said so. His daughter's asking me why a police car hasn't come, and honestly, so am I.",
      tone: "urgent",
    },
  ],

  callGrade: {
    scale: "police_thrive",
    grade: 2,
    standardMinutes: 60,
    basis:
      "GMP Chief Constable's Regulation 28 response to HM Senior Coroner Manchester West, 26 Aug 2025 (judiciary.uk, 2025-0342): \"Priority or grade 2 - within 1 hour\". Corroborated by the GMCA GMP Performance Briefing, January 2026, which calls one hour the force's aspired attendance time for priority incidents (77% met in 2025). Sixty minutes is GMP's own published figure, not a generic one. Grading an expected death Priority — no threat, harm or risk, but a vulnerable premises with nobody able to act, an attendance the coroner's system may need, and a next of kin waiting — is our application of THRIVE, not a GMP-published worked example; GMP's sudden-death procedure, and whether it would attend an expected death at all rather than close it with advice, were not obtained.",
  },
};
