import type { Scenario } from "../incident_types";

// Scenario 46 — ANPR hit, stolen vehicle, A580 East Lancashire Road.
//
// Nobody rings 999 for this one. A camera on the East Lancs reads a
// plate, the plate matches something worth acting on, and the ANPR desk
// puts it on the dispatcher: grey Audi A3, eastbound, heading for the
// Walkden Road lights and the M60 a minute and a half beyond them. The
// informant is a colleague, not a member of the public, and the clock is
// the vehicle's, not a caller's.
//
// Three things the job is about, in the order the desk meets them.
//
// The hit is intelligence, not evidence. The plate it is wearing is a
// real plate on an identical grey A3 registered in Tyldesley, flagged
// because it was read in Bolton while the Tyldesley car was on its
// drive. So tonight's read is either the stolen Audi on cloned plates
// or a nurse on her way to work — and on roughly three runs in ten it
// is the nurse. An operator who has already told a roads car to box it
// before intel have rung the keeper has done something to a member of
// the public that cannot be undone.
//
// Where it stops is a decision, not an accident. One roads car can light
// it up at the lights, on a dual carriageway with a queue of public and
// the motorway ninety seconds on; or it can be followed quiet until
// there is a second car behind it and somewhere better to put it. The
// College APP is blunt: pursuits are not authorised without a tactical
// option, so the second car is the plan, not a nicety.
//
// The dog goes on the hit. By the time two men are over the verge and
// into the houses it is too late to start a dog from Stretford.
//
// FICTIONAL: everyone in it, both vehicles, both plates, the house
// numbers and everything said about them. The A580, the A575 Walkden
// Road junction, the M60 at Junction 14, Ellenbrook, Greylag Crescent,
// Bradshaw, Tyldesley and Little Hulton are real. The camera site is
// the sim's: GMP's fixed ANPR positions are not published and none is
// claimed here (see src/lib/sim/anpr.ts and data/research/police/gaps.md).
// Nothing here describes GMP's actual ANPR desk arrangements as fact.

export const scenario46: Scenario = {
  id: "46",
  slug: "46_anpr_hit_a580",
  title: "ANPR hit, stolen vehicle — A580 East Lancashire Road",
  type: "police_anpr_hit_stolen_vehicle",
  patch: "Western",
  severity: "moderate",
  trigger:
    "Fixed ANPR site on the A580 East Lancashire Road at Ellenbrook has hit on a grey Audi A3 eastbound toward the M60. The plate carries a marker: believed cloned onto an identical Audi stolen from a driveway in Bolton overnight. ANPR desk relaying; no member of the public on the line",

  location: {
    // Eastbound carriageway of the A580, about 100 m short of the A575
    // Walkden Road signals. Snaps to "East Lancashire Road" on OSM;
    // M28 7AT (postcodes.io) sits 190 m west on the north side.
    address:
      "A580 East Lancashire Road eastbound, approach to the A575 Walkden Road signals, Worsley, Salford",
    postcode: "M28 7AT",
    coords: { lat: 53.5113, lng: -2.3933 },
  },

  property: {
    class:
      "Urban dual carriageway — A580 East Lancashire Road, eastbound approach to a signalised crossroads with the A575 Walkden Road",
    occupants:
      "Two believed in the vehicle if it is the stolen Audi (two males on the Bolton doorbell footage) — or one, the legitimate keeper, if the plate on the road is her own",
    vulnerabilities: [
      "The driver may be an innocent keeper on cloned plates — a hard stop on the wrong car is a complaint and a trauma that no arrest afterwards repairs",
      "Queue of public at the Walkden Road signals — a stop forced there puts them in the middle of it",
      "M60 Junction 14 about 1.5 km east — the intercept window on the A580 is a few minutes and closes for good on the slip road",
      "Housing both sides of the carriageway — a decamp on foot is into gardens and alleys within seconds",
    ],
    access:
      "Roads units from Eccles come up the M60 to Junction 13 and north on the A575 Walkden Road, arriving at the signals from the south and out of the vehicle's view until the junction; or along the A580 from Junction 14 against its direction. Divisional cars from Salford use the A580 or the A6 and Walkden Road. Nowhere to hold a vehicle safely on the carriageway itself — the stop point is the operator's problem, not the driver's",
    knownHazards: [
      "Live dual carriageway, no hard shoulder — officers on foot at a stop are in lane 1 with traffic passing",
      "Likely fail-to-stop if it is the stolen car: an intel nominal with two previous pursuits is linked to the Bolton MO",
      "Keyless-theft offenders — the keys are in the car and it will be left running if they decamp",
    ],
    firstDueStationId: "MP-SAL",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — public highway. This is an ANPR hit, not a 999 call: the informant is the ANPR desk, and everything it knows comes from the camera image, PNC and the Bolton report.",
      "A hit is intelligence, not evidence. The plate belongs to an identical grey A3 registered in Tyldesley and is flagged as a probable clone — the read is checked against the image and the stolen report, and the Tyldesley keeper is rung, before anyone is told to stop it hard.",
      "Pursuit authority sits with the control room, not the car. College of Policing APP (Police pursuits): authorisation from control room staff, no pursuit without a tactical option, an initial-phase driver alone must call for tactical-phase cover, and the FIM or control room supervisor can discontinue.",
      "M60 Junction 14 is about 1.5 km east of the Walkden Road signals. Past it this is the motorway network and ME units; the sim's own cameras at Junction 12, Simister and the M61 at Farnworth are the next places the plate would show.",
    ],
  },

  methane: {
    M: "No",
    E: "A580 East Lancashire Road eastbound, approach to the A575 Walkden Road signals, Worsley, Salford, M28 — camera site at Ellenbrook, 1.2 km west",
    T: "ANPR hit — grey Audi A3 Sportback on a plate flagged as cloned onto an identical Audi stolen overnight in Bolton, heading east toward the M60",
    H: "Live dual carriageway; likely fail-to-stop if it is the stolen car; decamp on foot into housing; possibility the driver is the innocent keeper",
    A: "Roads from Eccles via M60 J13 and Walkden Road, arriving from the south; divisional from Salford along the A580. No safe holding point on the carriageway — the stop is placed, not improvised",
    N: "None injured. Two believed in the vehicle if it is the stolen car; one, the keeper, if it is not",
    emergencyServices:
      "Police only — roads policing intercept with a second roads car, one divisional car and a dog. NPAS through the FIM if it runs. No ambulance, no fire",
  },

  pda: [
    {
      id: "rpu1",
      label: "Roads — intercept",
      service: "Police",
      requiredApplianceTypes: ["Police_RPU"],
      requiredCapabilities: ["Police_Roads"],
      preferredStationId: "MP-RPU",
      notes:
        "Eccles is the nearest roads base and the M60 puts it at Walkden Road in minutes. Its job is to get behind the Audi and stay there, not to light it up on its own — a single car forcing a stop at the signals is how a hit becomes a pursuit through Walkden",
    },
    {
      id: "rpu2",
      label: "Roads — second vehicle",
      service: "Police",
      requiredApplianceTypes: ["Police_RPU"],
      requiredCapabilities: ["Police_Roads"],
      preferredStationId: "MP-RPU",
      notes:
        "The tactical option. Two cars make a stop; one car makes a hope. APP does not authorise a pursuit without a tactic on the road, so this slot is what turns 'follow and contain' into a plan the FIM can say yes to. Moving before the first car shows blue lights, not after",
    },
    {
      id: "response1",
      label: "Salford response — containment",
      service: "Police",
      requiredApplianceTypes: ["Police_Response"],
      requiredCapabilities: ["Police_Response"],
      preferredStationId: "MP-SAL",
      notes:
        "The Walkden Road junction, the abandoned car if they decamp, the north side of the carriageway if they run on foot. On the clone branch this is the car that talks to a nurse in a lit lay-by and sends her to work. One divisional car, not three — this is a volume job until it is not",
    },
    {
      id: "dog",
      label: "Dog unit",
      service: "Police",
      requiredApplianceTypes: ["Police_Dog"],
      requiredCapabilities: ["Police_Dog"],
      notes:
        "Mobilised on the hit, not on the decamp. Trafford and Openshaw are both a quarter of an hour away and a track goes cold in five minutes on a housing estate. Stood down without embarrassment if the keeper turns out to be driving — a dog cancelled costs nothing, a dog started late costs the job",
    },
  ],

  evaluation: {
    targets: [
      {
        metric: "Verification before commitment",
        target:
          "plate checked against the camera image and the stolen report, and the Tyldesley keeper's answer heard, before any car is told to stop it hard",
      },
      {
        metric: "Second vehicle",
        target:
          "two roads units moving before the first shows blue lights — no forced stop on a dual carriageway with one car and the M60 ninety seconds on",
      },
      {
        metric: "Dog",
        target: "dog mobilised on the hit, not after the decamp",
      },
      {
        metric: "Pursuit authority",
        target:
          "no pursuit without the FIM's authorisation and a tactical option on the road; a discontinue logged if it runs onto the M60 with nothing tactical-phase behind it",
      },
      {
        metric: "In attendance",
        target:
          "< 15 minutes — GMP's Grade 1 standard, and on this job the real window is the few minutes before Junction 14",
      },
    ],
    lesson:
      "An ANPR hit is a plate, not a person. The camera has told you a number went past that matches a car stolen in Bolton; it has not told you who is driving, and on this plate it cannot, because the same number is on a nurse's car in Tyldesley. So the first minute is verification, not mobilisation: the image against the report, intel on the phone to the keeper. Then get a car behind it — behind it, quiet — and get a second one moving before anybody shows a blue light, because the College will not authorise a pursuit without a tactic, and a single car at the Walkden Road signals is not a tactic. It is a queue of public with a stolen Audi in it and the M60 ninety seconds away. Start the dog on the hit. If the keeper turns out to be driving, you have cancelled a dog and stopped a nurse politely in a lit lay-by, which is the right outcome. If she is at home looking at her own car, you already have two roads units, a dog moving and a containment plan, which is the other right outcome. The wrong outcome is the same in both cases: one car, lights on, at the lights.",
  },

  // Top-down schematic of the eastbound approach to the Walkden Road
  // signals. The A580 is drawn horizontal (it actually runs slightly
  // north of east); eastbound is the southern carriageway. Housing either
  // side is schematic — postcodes sit within 130 m of the carriageway on
  // both sides, but no frontage or street layout is claimed. The Greylag
  // Crescent estate is off the west edge of the drawing, north side.
  scene: {
    viewBox: { x: -160, y: -50, width: 280, height: 100 },
    compassNorth: "up",
    buildings: [
      {
        shape: { x: -160, y: -50, w: 240, h: 28 },
        kind: "neighbour",
        label: "Housing — north side (Walkden beyond)",
      },
      {
        shape: { x: -160, y: 20, w: 240, h: 30 },
        kind: "neighbour",
        label: "Housing — south side (Worsley beyond)",
      },
    ],
    roads: [
      { shape: { x: -160, y: -16, w: 256, h: 3 }, kind: "pavement", label: "Verge (north)" },
      {
        shape: { x: -160, y: -13, w: 256, h: 10 },
        kind: "road",
        label: "A580 East Lancashire Road — westbound",
      },
      { shape: { x: -160, y: -3, w: 256, h: 3 }, kind: "pavement", label: "Central reservation" },
      {
        shape: { x: -160, y: 0, w: 256, h: 10 },
        kind: "road",
        label: "A580 East Lancashire Road — eastbound",
      },
      { shape: { x: -160, y: 10, w: 256, h: 3 }, kind: "pavement", label: "Verge / footway (south)" },
      { shape: { x: 96, y: -50, w: 12, h: 100 }, kind: "road", label: "A575 Walkden Road" },
      { shape: { x: 108, y: -13, w: 12, h: 23 }, kind: "road", label: "A580 to M60 J14 (1.5 km)" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -40, y: 6 }, kind: "car", label: "Grey Audi A3 — eastbound" },
      { pos: { x: 20, y: 3 }, kind: "car", label: "Traffic queued for the signals" },
      { pos: { x: 50, y: 7 }, kind: "car" },
      { pos: { x: 74, y: 3 }, kind: "car" },
      { pos: { x: -20, y: -9 }, kind: "car" },
      { pos: { x: 40, y: -6 }, kind: "car" },
      { pos: { x: 90, y: -15 }, kind: "lamppost", label: "Signals — A575 Walkden Road" },
      { pos: { x: -140, y: 13 }, kind: "lamppost" },
      { pos: { x: -60, y: -16 }, kind: "lamppost" },
      { pos: { x: -152, y: -18 }, kind: "other", label: "ANPR site (sim) — 1.2 km west" },
    ],
    hazards: [
      {
        id: "live-carriageway",
        pos: { x: -80, y: 5 },
        kind: "structural",
        label: "Live dual carriageway, no hard shoulder — a stop here puts officers in lane 1 with traffic passing",
        knownFromPri: true,
      },
      {
        id: "signals-queue",
        pos: { x: 60, y: 5 },
        kind: "structural",
        label: "Queue at the Walkden Road signals — a hard stop in it boxes the public in with the vehicle",
        knownFromPri: true,
      },
      {
        id: "m60-escape",
        pos: { x: 114, y: -1 },
        kind: "structural",
        label: "M60 Junction 14 about 1.5 km east — on the motorway this is a network job for ME units",
        knownFromPri: true,
      },
      {
        id: "foot-escape-north",
        pos: { x: -100, y: -24 },
        kind: "structural",
        label: "Housing north of the carriageway — foot escape toward Walkden; the Greylag Crescent estate lies 300 m west",
        knownFromPri: true,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Eastbound carriageway — the stop", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Walkden Road signals / M60 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Westbound carriageway — approach", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · North side — foot escape", face: "left", bearingDeg: 270 },
    ],
  },

  // The ANPR desk, colleague to colleague. The script ends when the
  // first unit reaches the location, so the whole exchange is paced to
  // the roads car's run from Eccles: everything that decides the job is
  // said inside three and a half minutes, and the slow-response beat
  // only fires when nobody has got there in eight.
  informantScript: [
    {
      id: "hit",
      atSec: 4,
      text: "ANPR desk. The East Lancs site at Ellenbrook has just hit — grey Audi A3 Sportback, MA68 KHV, eastbound in the outside lane. The plate's carrying a marker: believed cloned onto an A3 stolen off a drive in Bolton overnight. It's heading for the Walkden Road lights, a couple of minutes if the traffic lets it, and the M60's a minute and a half past that.",
      tone: "critical",
    },
    {
      id: "report",
      atSec: 28,
      text: "The Bolton job is a keyless theft from Bradshaw about half three this morning — keys never left the house, two males on the doorbell camera with their faces covered. That car's true plate is MK19 DWO. MA68 KHV is a real plate on an identical grey A3 registered to a woman in Tyldesley; it went past the M61 at Farnworth at ten past four while hers was on her drive, which is why it's flagged. Intel are ringing her now. Until she answers, what you've got on the East Lancs could be either car.",
      tone: "urgent",
    },
    {
      id: "nominal",
      atSec: 60,
      text: "Intel have a name against the MO — a male from Little Hulton with two fail-to-stops on him and a disqualification, and the keyless Audis round Bolton have been going his way for months. Not confirmed in the car. But if it's him it runs the second it sees a blue light, and you want to have decided where that happens before it does.",
      tone: "urgent",
    },
    {
      id: "stop-or-follow",
      atSec: 95,
      text: "The FIM's asking what tactics you've got before anyone goes blue on it. One roads car can light it up at the Walkden Road lights — a dual carriageway, a queue of public at the signals, and the motorway ninety seconds on. Or it gets followed quiet until there's a second car behind it and somewhere better to put it. Pursuits don't get authorised without a tactical option, so the second car isn't a nicety. Your answer goes in the log either way.",
      tone: "urgent",
    },
    // --- The roll. Three runs in ten it is the nurse. ------------------
    {
      id: "clone",
      atSec: 130,
      probability: 0.3,
      suppressesIds: ["confirmed", "decamp", "runs", "slow"],
      text: "Stop. Intel have the Tyldesley keeper on the phone — she's DRIVING. She's on the East Lancs now, on her way to a shift at Salford Royal, and she had a letter about her plates being cloned a fortnight ago. Whatever's in front of your roads car is almost certainly her, in her own car, with nothing on her. She'll pull in for a check and she's asked for somewhere lit. Stand the dog down. Bolton's Audi is still out there on her plates, so the marker stays live and the next hit is still a hit.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      // No probability, deliberately: clone has taken its 30% and this is
      // the other 70%. It must be certain, or a share of runs never learn
      // which car they are chasing.
      id: "confirmed",
      atSec: 140,
      text: "Tyldesley keeper's answered — she's at home, looking out of the window at her own car on the drive. So the one on the East Lancs is Bolton's Audi on her plates. Confirmed stolen, believed two-up, and whoever's in it knows exactly what it is.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      id: "decamp",
      atSec: 170,
      probability: 0.5,
      requiresFiredIds: ["confirmed"],
      suppressesIds: ["runs"],
      text: "It's stopped. Pulled up the nearside short of the Walkden Road lights, both doors open and two males out — dark clothing, hoods up — over the verge and north into the houses, heading toward Walkden. They've left it running. That's a dog job from the second they went over, and somebody needs to be sat on that Audi before a passer-by decides to move it.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      // The other half of the confirmed runs. Certain once decamp has
      // rolled and missed.
      id: "runs",
      atSec: 190,
      requiresFiredIds: ["confirmed"],
      text: "It's not stopping. Through the Walkden Road lights on red, eastbound, and the M60 at Junction 14 is a minute away. Once it's on the motorway that's a network job — motorway units, the pursuit tactical adviser, and the FIM deciding whether anyone behind it is in a car that's allowed to be. If nobody is, that's a discontinue and a circulation, and every site on the ring stays lit for the plate.",
      tone: "critical",
    },
    {
      // Only on a slow response, and only when it was the stolen car —
      // eight minutes to reach a nurse costs nobody anything.
      id: "slow",
      atSec: 400,
      delayThresholdSec: 480,
      requiresFiredIds: ["confirmed"],
      text: "Eight minutes and nothing of yours is on the East Lancs yet. Whatever this is now — a car sat abandoned short of the lights or a plate gone quiet on every site — the intercept window closed a while ago. It's a search and a circulation, and if there are two men on foot in Walkden the dog's chances go with every minute.",
      tone: "urgent",
    },
  ],

  callGrade: {
    scale: "police_thrive",
    grade: 1,
    standardMinutes: 15,
    basis:
      "GMP Grade 1 — Immediate: attendance 'within 15 minutes'. GMP's own published figure, not a generic national one — Chief Constable's Regulation 28 response to HM Senior Coroner Manchester West, 26 Aug 2025 ('Immediate or grade 1 incidents - within 15 minutes'); GMCA GMP Performance Briefing, Jan 2026 (15 minutes described as 'our aspired attendance time', average 7m52s, 95% within it in 2025). GMP publishes no separate rural figure and none is used. That an ANPR stolen-vehicle hit is graded Immediate is the sim's THRIVE judgement rather than a published GMP rule: a live, moving offence with a window of a few minutes before the M60, likely fail-to-stop offenders, and a real chance the driver is an innocent keeper on cloned plates — which argues for speed in getting a car behind it and against speed in stopping it.",
  },
};
