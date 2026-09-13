import type { Scenario } from "../incident_types";

// Scenario 50 — drink-driver reported, supermarket car park, Bury.
//
// A Grade 2 that is really a race. On paper GMP has an hour for a
// priority call; in practice the whole job is a man in a driver's seat
// who has not yet turned the key, and every second the desk spends
// finishing the call-taking script is a second he has to start the
// engine. Send the nearest car on the location and the plate, then ask
// the rest.
//
// Three things can happen and the operator controls the odds of the
// first: get a unit there inside five minutes and he is arrested in the
// bay, drunk in charge. Miss that and seven nights in ten he drives —
// left onto Pilsworth Road towards the A56 — and the job becomes a
// roads policing job, with the M66 slip road a few hundred metres the
// other way if he had turned right. Some nights he goes into a parked
// car on Manchester Road. Some nights, if nobody is coming, the caller
// loses him at the lights. The rest he pulls in on Manchester Road and
// the engine goes off: still the operator's job, at a new address.
//
// The caller is the other lesson. She is close enough to be noticed and
// she will follow him if she is not told not to. The desk wants her
// where she is, reading out the direction of travel, not behind a drunk
// on a dual carriageway.
//
// Pursuits: College of Policing APP (Police pursuits) — authorisation
// comes from the control room, non-pursuit-trained drivers discontinue
// immediately once a vehicle fails to stop, and roads policing cars
// carry the tactical options. That is why the lesson says roads
// policing, not a response car on his bumper.
//
// REAL: the retail park off Pilsworth Road, Pilsworth Interchange onto
// the M66, the A56 Manchester Road. FICTIONAL: the store is deliberately
// unnamed, and the people, the cars and the plates are invented.

export const scenario50: Scenario = {
  id: "50",
  slug: "50_drink_driver_bury",
  title: "Drink-driver reported — supermarket car park, Bury",
  type: "police_drink_driver",
  patch: "Eastern",
  severity: "moderate",
  trigger:
    "Caller in a supermarket car park off Pilsworth Road, Bury, watched a man stagger across the car park and get into the driver's seat of a silver Ford Focus. Engine not running. Caller has eyes on him from her own car",

  location: {
    address: "Supermarket car park, Pilsworth Road, Bury",
    postcode: "BL9 8RS",
    coords: { lat: 53.5773, lng: -2.2737 },
  },

  property: {
    class:
      "Out-of-town supermarket surface car park — retail park off Pilsworth Road, beside Pilsworth Interchange on the M66",
    occupants:
      "Busy, early evening. Caller in her own car three bays from the subject vehicle; shoppers and trolleys between the rows",
    vulnerabilities: [
      "A drunk driver among pedestrians and trolleys before he even reaches the road",
      "Pilsworth Interchange and the M66 on-slip are under 300 m from the car park exit",
      "Caller is close enough to be noticed, and has said she will follow him if he leaves",
    ],
    access:
      "Retail park service road onto Pilsworth Road — the only vehicle way in or out. Right out of the park is the interchange and the M66; left is the A56 Manchester Road and Bury",
    knownHazards: [
      "Vehicle may move off at any moment — live traffic in the car park aisles",
      "Motorway slip road within a minute's drive of the exit",
    ],
    firstDueStationId: "MP-BUR",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — retail park car park, private land with public access. Any car park cameras are the operator's: retrievable afterwards, not live.",
      "Repeat location on the system for shoplifting and theft from motor vehicles. No drink-drive report here in the last twelve months.",
      "Pilsworth Interchange onto the M66 is under 300 m from the car park exit. A car that reaches the slip road is a motorway job and a roads policing job.",
      "Any pursuit needs control-room authorisation and a pursuit-trained driver in a suitable car (College of Policing APP, Police pursuits). A response officer who is not pursuit-trained must discontinue the moment he fails to stop.",
    ],
  },

  methane: {
    M: "No",
    E: "Supermarket car park, Pilsworth Road, Bury, BL9 8RS — retail park beside Pilsworth Interchange (M66)",
    T: "Drink-driver reported — male seen staggering to a car and getting into the driver's seat; not yet moved off",
    H: "Vehicle may move off into a busy car park; M66 on-slip within 300 m of the exit; caller parked close to the subject",
    A: "Retail park service road off Pilsworth Road — single vehicle entrance and exit",
    N: "None injured — one male in the vehicle, believed drunk; caller in her own car nearby",
    emergencyServices:
      "Police only — one unit, response or roads policing, whichever is nearer. No ambulance unless it becomes a collision",
  },

  // One car. A drink-driver report is a double-crewed unit, not an
  // attendance. The slot takes a response car or a roads car because
  // the nearest of the two is the right answer — Bury's response car is
  // 2.5 km north-west, Whitefield's roads cars come up the A56 from the
  // south. If he moves off, the second car is the operator's call and
  // it should be a roads car.
  pda: [
    {
      id: "unit1",
      label: "First unit — Response or Roads Policing",
      service: "Police",
      requiredApplianceTypes: ["Police_Response", "Police_RPU"],
      requiredCapabilities: [],
      preferredStationId: "MP-BUR",
      notes:
        "Whichever is nearest — Bury's response car or a Whitefield roads car coming up the A56. He is in the driver's seat now and the job is to get there before the engine starts. Roadside breath test, then the arrest",
    },
  ],

  evaluation: {
    targets: [
      {
        metric: "Time-to-mobilise",
        target: "< 60 seconds — send on the location and the plate, finish the questions afterwards",
      },
      {
        metric: "In attendance",
        target: "before he moves off — under five minutes from the call catches him in the bay",
      },
      {
        metric: "Caller management",
        target: "told plainly not to follow; kept on the line for direction of travel instead",
      },
      {
        metric: "If he moves",
        target:
          "roads policing towards the A56 and the interchange — no response car on his bumper without an authorised pursuit",
      },
      {
        metric: "Outcome",
        target:
          "roadside breath test and arrest under s.5 Road Traffic Act 1988, with the 2022 conviction pulled from his record before the unit reaches him",
      },
    ],
    lesson:
      "A Grade 2 is an hour on paper and about five minutes in practice, because the thing that makes this a job is a man in a driver's seat who has not yet turned the key. Send the nearest car the moment you have a location and a plate; do not wait to finish the questions. Tell the caller plainly not to follow. A witness behind a drunk is a second casualty waiting to happen, and you would rather have her parked where she is reading you the direction he went. If he does move off, the answer is roads policing towards the A56 and a car sat on the interchange, not a response car on his bumper: nobody has authorised a pursuit, and a drunk who knows he is being chased drives worse. He has done this before. The previous conviction is on his record before your unit arrives, if anybody looks.",
  },

  // Top-down — the store on the north side, the car park south of it,
  // Pilsworth Road running along the north of the site and down the
  // west side towards the A56, the interchange off the north-east
  // corner. Real layout, simplified.
  scene: {
    viewBox: { x: -130, y: -180, width: 280, height: 260 },
    compassNorth: "up",
    buildings: [
      {
        shape: { x: -42, y: -136, w: 123, h: 127 },
        kind: "target",
        label: "Supermarket — entrance on the south face",
      },
      { shape: { x: -116, y: -145, w: 60, h: 45 }, kind: "neighbour", label: "Retail park units" },
      { shape: { x: -89, y: 14, w: 20, h: 14 }, kind: "other", label: "Filling station" },
    ],
    roads: [
      { shape: { x: -130, y: -165, w: 235, h: 12 }, kind: "road", label: "Pilsworth Road" },
      { shape: { x: 105, y: -172, w: 45, h: 16 }, kind: "road", label: "Pilsworth Interchange → M66" },
      {
        shape: { x: -130, y: -153, w: 12, h: 233 },
        kind: "road",
        label: "Pilsworth Road — south-west to the A56",
      },
      {
        shape: { x: -118, y: -22, w: 27, h: 8 },
        kind: "driveway",
        label: "Service road — the only vehicle way in and out",
      },
      { shape: { x: -91, y: -96, w: 49, h: 90 }, kind: "driveway", label: "Car park — west side" },
      { shape: { x: -91, y: -6, w: 181, h: 84 }, kind: "driveway", label: "Surface car park" },
      { shape: { x: -42, y: -9, w: 123, h: 3 }, kind: "pavement", label: "Store frontage / trolley bays" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: 8, y: 20 }, kind: "car", label: "Silver Focus — subject in the driver's seat" },
      { pos: { x: 30, y: 20 }, kind: "car", label: "Caller's car — three bays along" },
      { pos: { x: -60, y: 20 }, kind: "car" },
      { pos: { x: -30, y: 20 }, kind: "car" },
      { pos: { x: 60, y: 20 }, kind: "car" },
      { pos: { x: -60, y: 52 }, kind: "car" },
      { pos: { x: 10, y: 52 }, kind: "car" },
      { pos: { x: 50, y: 52 }, kind: "car" },
      { pos: { x: -10, y: 6 }, kind: "other", label: "Trolley bay" },
      { pos: { x: -80, y: 0 }, kind: "lamppost" },
      { pos: { x: 100, y: 60 }, kind: "lamppost" },
      { pos: { x: -110, y: 60 }, kind: "tree" },
    ],
    hazards: [
      {
        id: "subject-vehicle",
        pos: { x: 8, y: 22 },
        kind: "structural",
        label: "Silver Ford Focus — male in the driver's seat, believed drunk. Engine off for now",
        knownFromPri: true,
      },
      {
        id: "pedestrians",
        pos: { x: -20, y: 2 },
        kind: "structural",
        label: "Shoppers and trolleys between the car and the exit",
        knownFromPri: true,
      },
      {
        id: "caller-close",
        pos: { x: 30, y: 24 },
        kind: "structural",
        label: "Caller parked three bays along — close enough to be noticed",
        knownFromPri: true,
      },
      {
        id: "interchange",
        pos: { x: 125, y: -164 },
        kind: "structural",
        label: "Pilsworth Interchange — the M66 on-slip is under 300 m from the car park exit",
        knownFromPri: true,
      },
      {
        // What the first officer sees through the window. Not something
        // the caller can see from three bays along.
        id: "open-cans",
        pos: { x: 8, y: 18 },
        kind: "structural",
        label: "Open cans in the passenger footwell — seen on approach",
        discoverAfterMinOnScene: 1,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Car park / subject vehicle", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Service road exit", face: "left", bearingDeg: 270 },
      { id: 3, label: "Sector 3 · Pilsworth Road / interchange", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · East rows", face: "right", bearingDeg: 90 },
    ],
  },

  // The caller, in her own car, on the line until the first unit lands.
  // The race is the moves-off beat: it is gated on nobody having
  // arrived by five minutes, and then it is a 70% roll. Win the race
  // and none of the drive-off branch ever plays.
  informantScript: [
    {
      id: "first-call",
      atSec: 5,
      text: "I'm in the supermarket car park off Pilsworth Road, the big one by the motorway. There's a fella just come out of the shop and he can barely stand — he's gone across the car park like he's on a boat and got in the driver's side of a silver Focus. He's sat in it now. He's not started it.",
      tone: "urgent",
    },
    {
      id: "plate-engine",
      atSec: 60,
      text: "I've got the reg for you — Mike Victor one nine, X-ray Kilo Delta. Silver Ford Focus. And he's just started it. Lights have come on. He's not moved, he's sat there with it running, on his phone I think. I'm three bays along in my car, he's not clocked me.",
      tone: "urgent",
    },
    {
      // The race. Fires only if nobody has arrived by five minutes, and
      // then seven nights in ten. Direction of travel is the one thing
      // the desk needs from her and she gives it.
      id: "moves-off",
      atSec: 300,
      delayThresholdSec: 300,
      probability: 0.7,
      suppressesIds: ["stays-put", "still-sat"],
      text: "He's moving. He's reversed out — he's all over the place, he's nearly had a trolley. He's going down the aisle to the exit... he's out onto the service road. He's turned LEFT onto Pilsworth Road, left, away from the motorway, towards Manchester Road.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      // The other three nights in ten. Certain, so the question the
      // caller raised always resolves one way or the other.
      id: "stays-put",
      atSec: 330,
      text: "He's still sat there. Engine's running, his head's gone back on the headrest. I think he might have nodded off, honestly. He's not going anywhere this minute.",
      tone: "info",
    },
    {
      id: "following",
      atSec: 340,
      requiresFiredIds: ["moves-off"],
      text: "I'm behind him. Before you say it — I'm well back, I'm not doing anything daft. He's on Pilsworth Road heading for Manchester Road and he's drifting over the white line and back. There's a car coming the other way had to brake.",
      tone: "urgent",
    },
    {
      // Four nights in ten on the drive-off branch he does not get far.
      id: "crash",
      atSec: 420,
      requiresFiredIds: ["moves-off"],
      probability: 0.4,
      suppressesIds: ["pulled-in", "lost"],
      text: "He's hit one. He's gone into the back of a parked car on Manchester Road just past the junction — a red Corsa, parked outside the houses, Delta Echo six four. Proper bang. He's not got out, he's still sat there trying to get it going. There's a bloke come out of a house shouting at him. Nobody's hurt that I can see — the Corsa was empty.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
    {
      // Slow-response failure. Only if nobody has arrived by nine
      // minutes, and then a third of the time: she is not going through
      // a red light for him and he is gone.
      id: "lost",
      atSec: 540,
      delayThresholdSec: 540,
      requiresFiredIds: ["moves-off"],
      probability: 0.35,
      suppressesIds: ["pulled-in"],
      text: "I've lost him. He went through the lights at Manchester Road on red and I wasn't following him through that. He turned right, towards Bury, and that's the last I saw of him. There's still not been a police car past me.",
      tone: "critical",
    },
    {
      // Certain, deliberately — crash has taken its 40% and lost its
      // share of the slow nights. Without a certain beat here a run
      // could hear him drive off and never hear how it ended.
      //
      // He stops himself. The caller hangs up the moment any unit
      // arrives, so this beat only ever plays on a run where no car has
      // reached the job — it cannot honestly put a police car behind
      // him. It leaves the operator a stationary drunk at a known
      // location and a witness with eyes on: the job is still theirs.
      id: "pulled-in",
      atSec: 570,
      requiresFiredIds: ["moves-off"],
      suppressesIds: ["crash", "lost"],
      text: "He's stopped. He's pulled in on Manchester Road just past the junction, half up the kerb outside the shops, and the engine's gone off. He's not got out — his head's gone back on the headrest again. I've pulled in well back, I've still got eyes on him. There's not been a police car past me yet. Where are they?",
      tone: "urgent",
    },
    {
      // Slow response on the stays-put branch. Ten minutes and still
      // nobody there; he has woken up.
      id: "still-sat",
      atSec: 600,
      delayThresholdSec: 600,
      requiresFiredIds: ["stays-put"],
      text: "He's awake again. He's just got out, been sick by the trolley bay and got back in. Engine's still running. That's ten minutes now — is anybody actually coming?",
      tone: "urgent",
    },
  ],

  callGrade: {
    scale: "police_thrive",
    grade: 2,
    standardMinutes: 60,
    basis:
      "GMP's own published figure: 'Priority or grade 2 — within 1 hour' (Chief Constable's Regulation 28 response to HM Senior Coroner Manchester West, 26 Aug 2025); the GMCA GMP Performance Briefing of January 2026 reports priority incidents against a one-hour 'aspired attendance time'. Graded priority here as a THRIVE judgement made for this scenario, not a published GMP rule: nobody injured, no violence, the car stationary and the suspect contained by a witness with eyes on. A real handler could defensibly call it Grade 1 once the engine starts — the moment he drives, the threat and harm change and so should the grade",
  },

  // The call as Lisa has it: in her own car with the doors locked, three
  // bays from a silver Focus with a man slumped in the driver's seat,
  // shopping still in the boot. She is not scared of him. She is scared
  // of what he does next, and she has already decided to go after him.
  call: {
    caller: {
      name: "Lisa Greenhalgh",
      phone: "07700 900418",
      relation: "Shopper — a stranger to the driver, three bays from his car",
      where: "Her own car in the supermarket car park, three bays along from the Focus, eyes on the driver",
      line: "mobile",
      state: "anxious",
    },
    opening:
      "Police — there's a man in the supermarket car park off Pilsworth Road in Bury, the big one by the motorway, and he's just got in a car and he can't even stand up. He came out the shop like he was on a boat, he's bounced off a trolley, and he's got in the driver's side of a silver Focus. He's sat in it now. He's not started it. Please, somebody needs to get here before he does.",
    deflection: "I don't know, I don't know — just get somebody here before he starts it!",
    reassurance: {
      text: "Lisa, listen. A car's coming. Stay in your seat, keep your eyes on him, and tell me what he does.",
      reply: "Okay. Okay. I'm watching him. I'm not going anywhere.",
    },
    answers: {
      p_happening: {
        text: "There's a man who can't walk straight sat in the driver's seat of a car. I watched him come out of the shop — he went across the car park holding onto other people's cars, and he's got in a silver Focus, driver's side. He's sat in it. He's not started it. I'm three bays along in my own car and I can see the back of his head.",
        tone: "urgent",
        followUps: [
          {
            id: "p_happening_drunk",
            text: "What makes you think he's been drinking?",
            answer: {
              text: "He couldn't walk. He dropped his keys twice getting the door open. And I was behind him at the self-checkout — he had a bottle of vodka and a bag of ice and he stank of it, I could smell it from where I was stood. I'm not guessing.",
            },
          },
        ],
      },
      p_ongoing: {
        text: "Yes — he's still sat there. Engine's off, lights are off. He's sort of slumped, looking at his phone. He could go any second, that's why I rang.",
        tone: "urgent",
      },
      p_weapons: {
        text: "No — no, nothing like that. It's not that sort of thing. He's just drunk. The only weapon is the car.",
      },
      p_injured: {
        text: "Nobody. Not yet. He's not hit anything — he nearly went over with a trolley, but that was him, not anybody else.",
      },
      p_who: {
        text: "Just him. One man, on his own. Nobody else in the car — front seat's empty, I can't see the back properly but I don't think so. And me, in my car.",
      },
      p_description: {
        text: "Fifties, maybe. Big man, heavy. Bald, or shaved. Grey fleece, jeans, work boots. Silver Ford Focus, the older shape, five-door. It's parked nose-in, three bays down from me towards the trolley bay.",
        followUps: [
          {
            id: "p_description_plate",
            text: "Can you get me the registration?",
            answer: {
              text: "Not from here — it's nose-in and I'm side on to it. I'd have to get out and walk round the back of it, and he'd see me. Give me a minute. I'll try and get it without him clocking me.",
            },
          },
        ],
      },
      p_direction: {
        text: "He's not gone anywhere yet. If he does — there's only one way out of here, the service road onto Pilsworth Road. Right is the motorway, the M66, it's right there. Left is Manchester Road. I'll tell you which.",
      },
      p_drink: {
        text: "Drink — yes. Definitely. I've told you, he was in front of me at the checkout with a bottle of vodka and he couldn't walk to his car. I don't know about drugs. Drink, though, yes.",
      },
      p_known: {
        text: "No. Never seen him before in my life. I just do my shop here.",
      },
      p_vulnerable: {
        text: "The car park's full of people — it's teatime, there's kids in trolleys, there's people loading their boots between him and the exit. If he pulls out into that — that's who's at risk. Everyone.",
        tone: "urgent",
      },
      p_where: {
        text: "The supermarket car park off Pilsworth Road in Bury — the big one by the motorway, by Pilsworth Interchange. BL9 8RS, I think. I'm in the main car park in front of the store, the rows nearest the trolley bay, sort of the middle. He's three bays from me.",
        followUps: [
          {
            id: "p_where_entry",
            text: "How do the officers get into the car park?",
            answer: {
              text: "Off Pilsworth Road — there's a service road by the petrol station, that's the only way in and out for cars. Come in there and the store's on your left, we're in the rows in front of it.",
            },
          },
        ],
      },
      p_safe: {
        text: "I'm in my car with the doors locked and he's not looked my way. I'm fine. But I'm telling you now — if he pulls out, I'm going after him. I'm not losing him and having him hit some kid.",
        tone: "urgent",
        followUps: [
          {
            id: "p_safe_follow",
            text: "I need you to stay exactly where you are. Will you do that for me?",
            answer: {
              text: "I — alright. Alright. I'll stay put. But you'd better be quick, because I'm not promising anything if he goes.",
            },
          },
        ],
      },
      p_seen: {
        text: "Saw it all myself. Watched him from the doors to the car. I've got eyes on him right now — I'm looking straight at the back of his head.",
      },
      p_details: {
        text: "Lisa Greenhalgh. I'm on my mobile — 07700 900418. I'm in a blue Kia, if they want to find me.",
      },
    },
    interjections: [
      {
        atSec: 45,
        text: "He's got his head down on the wheel now. Oh — no, he's up again, he's fumbling with something. Keys, I think. Please hurry.",
        tone: "urgent",
      },
      {
        atSec: 130,
        text: "Is anyone actually coming? Because I'm telling you now, if he pulls out of that bay I'm going after him. I'm not having him kill somebody.",
        tone: "urgent",
        requiresOpened: false,
      },
      {
        atSec: 200,
        text: "I can't see any police yet. Which way are they coming in? There's only the one way in off Pilsworth Road — tell them the service road by the petrol station.",
        requiresOpened: true,
      },
      {
        atSec: 235,
        text: "A woman with a trolley's just walked right past his window and he's not even looked up. He's just staring. It's not right.",
      },
    ],
    onDispatch: "Thank you. Please tell them to hurry. I'm staying here — I'm looking right at him.",
  },
};
