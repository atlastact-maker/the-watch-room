import type { ApplianceTypeCode, CrewMember, ServiceCode } from "./types";

// Deterministic PRNG seeded by an appliance-specific key so names stay stable
// across server renders.
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

const SURNAMES = [
  "Shaw", "Patel", "Jones", "Smith", "Williams", "Brown", "Taylor", "Davies",
  "Wilson", "Evans", "Thomas", "Khan", "Ahmed", "Begum", "Lee", "Wang", "Robinson",
  "Wright", "Green", "Hall", "Thompson", "Wood", "Walker", "Chen", "Singh", "Kaur",
  "O'Brien", "Murphy", "Kennedy", "Richardson", "Hughes", "Edwards", "Griffiths",
  "Owen", "Rees", "Hassan", "Malik", "Ali", "Hussain", "Iqbal", "Lewis", "Cooper",
  "Turner", "Phillips", "Carter", "Mitchell", "Fletcher", "Parker", "Collins",
  "Harris", "Morgan", "Roberts", "Foster", "Reid", "Bell", "Watson", "Clarke",
  "Kelly", "Young", "Bennett", "Holmes", "Graham", "Palmer", "Mason", "Nolan",
  "Butler", "Hunter", "Barker", "Stone", "Knight", "Walsh", "Russell", "Nguyen",
];

const INITIALS = "ABCDEFGHJKLMNPRST";

function pickName(rnd: () => number): string {
  const i = INITIALS[Math.floor(rnd() * INITIALS.length)];
  const surname = SURNAMES[Math.floor(rnd() * SURNAMES.length)];
  return `${i}. ${surname}`;
}

type RoleTemplate = {
  role: string;
  baseQuals: string[];
  flavourQuals: string[]; // may be sampled on top
  yearsRange: [number, number];
};

const ROLES: Record<string, RoleTemplate> = {
  watch_manager: {
    role: "Watch Manager",
    baseQuals: ["BA Wearer", "Level 2 Incident Command", "First Aid at Work"],
    flavourQuals: ["Tactical Advisor", "JESIP Bronze Commander", "BA Instructor"],
    yearsRange: [12, 30],
  },
  crew_manager: {
    role: "Crew Manager",
    baseQuals: ["BA Wearer", "Level 1 Incident Command", "First Aid at Work"],
    flavourQuals: ["BA Instructor", "RTC Instructor", "Mentor"],
    yearsRange: [8, 25],
  },
  driver_pump: {
    role: "Firefighter · Driver / Pump Op.",
    baseQuals: ["BA Wearer", "LGV / EFAD", "Pump Operator", "First Aid at Work"],
    flavourQuals: ["Driving Instructor", "Hydrant Inspection"],
    yearsRange: [5, 28],
  },
  firefighter: {
    role: "Firefighter",
    baseQuals: ["BA Wearer", "First Aid at Work"],
    flavourQuals: ["BA Instructor", "RTC Instructor", "Sub-Officer I/C", "CFR"],
    yearsRange: [2, 28],
  },
  firefighter_tr: {
    role: "Firefighter (Technical Rescue)",
    baseQuals: ["BA Wearer", "Technical Rescue", "Rope Rescue"],
    flavourQuals: ["TR Instructor", "Swift-Water Rescue"],
    yearsRange: [5, 25],
  },
  firefighter_usar: {
    role: "Firefighter (USAR)",
    baseQuals: ["BA Wearer", "USAR National Course", "Rope Rescue"],
    flavourQuals: ["USAR Team Leader", "Concrete Cutting Specialist"],
    yearsRange: [5, 25],
  },
  firefighter_aerial: {
    role: "Firefighter (Aerial)",
    baseQuals: ["BA Wearer", "Aerial Appliance"],
    flavourQuals: ["Aerial Instructor", "Rope Rescue"],
    yearsRange: [3, 25],
  },
  firefighter_wildfire: {
    role: "Firefighter (Wildfire)",
    baseQuals: ["BA Wearer", "Wildfire Tactical Advisor"],
    flavourQuals: ["Moorland fire — lead"],
    yearsRange: [3, 25],
  },
  firefighter_command: {
    role: "Firefighter (Command Support)",
    baseQuals: ["BA Wearer", "Command Support Operator"],
    flavourQuals: ["JESIP Bronze Commander"],
    yearsRange: [5, 25],
  },
  paramedic: {
    role: "Paramedic",
    baseQuals: ["HCPC Paramedic", "ALS"],
    flavourQuals: ["Mentor", "ECG Interpretation", "Community Paramedic"],
    yearsRange: [1, 25],
  },
  emt: {
    role: "EMT",
    baseQuals: ["IHCD Technician", "ILS"],
    flavourQuals: ["Emergency Driving Instructor"],
    yearsRange: [1, 20],
  },
  advanced_paramedic: {
    role: "Advanced Paramedic",
    baseQuals: [
      "HCPC Paramedic",
      "ALS",
      "Advanced Clinical Practice",
      "Extended Formulary",
    ],
    flavourQuals: ["Prescriber", "Thrombolysis", "Trauma Team Leader"],
    yearsRange: [7, 25],
  },
  ccp: {
    role: "Critical Care Paramedic",
    baseQuals: ["HCPC Paramedic", "ALS", "PGD Critical Care", "APLS", "ATLS"],
    flavourQuals: ["NVG Endorsement", "Pre-hospital Ultrasound"],
    yearsRange: [8, 25],
  },
  doctor: {
    role: "Pre-hospital Doctor",
    baseQuals: ["MBBS", "FRCEM / FFICM", "PHEM sub-specialty"],
    flavourQuals: ["BASICS Member", "Ultrasound Instructor"],
    yearsRange: [5, 25],
  },
  pilot: {
    role: "HEMS Pilot",
    baseQuals: ["CPL(H)", "Instrument Rating", "NVG Qualified"],
    flavourQuals: ["Training Captain", "Performance Class 1"],
    yearsRange: [8, 30],
  },
  hart_responder: {
    role: "HART Responder",
    baseQuals: [
      "HCPC Paramedic",
      "HART National Course",
      "BA Wearer",
      "Confined Space",
      "Rope Rescue",
    ],
    flavourQuals: ["Water Rescue Technician", "CBRN Specialist"],
    yearsRange: [5, 20],
  },
  duty_officer: {
    role: "Duty Officer",
    baseQuals: [
      "HCPC Paramedic",
      "Incident Command",
      "JESIP Tactical Commander",
    ],
    flavourQuals: ["Major Incident Commander", "Former HART"],
    yearsRange: [10, 30],
  },
  basics_doctor: {
    role: "BASICS Volunteer Doctor",
    baseQuals: ["MBBS", "FRCEM / FRCGP", "BASICS Immediate Care"],
    flavourQuals: ["Trauma Team Leader", "APLS Instructor"],
    yearsRange: [8, 30],
  },
  nwas_iru_operator: {
    role: "NWAS IRU Operator",
    baseQuals: ["HCPC Paramedic", "Mass Casualty PPE", "Decontamination"],
    flavourQuals: ["HAZMAT Advisor"],
    yearsRange: [5, 20],
  },
  // ---- GMP ----
  pc_response: {
    role: "Response Officer",
    baseQuals: ["PIP1 Investigator", "Personal Safety Trained", "Emergency Driving"],
    flavourQuals: ["Taser Trained", "Family Liaison"],
    yearsRange: [1, 20],
  },
  sergeant: {
    role: "Sergeant",
    baseQuals: ["PIP1 Investigator", "Public Order Level 2", "Emergency Driving"],
    flavourQuals: ["Silver Commander", "Firearms Tactical Adviser"],
    yearsRange: [6, 25],
  },
  afo: {
    role: "Authorised Firearms Officer",
    baseQuals: ["AFO", "Advanced Driver", "Taser", "Tactical Firearms"],
    flavourQuals: ["Covert Armed Methodology", "Rifle Operator", "Breacher"],
    yearsRange: [5, 20],
  },
  dog_handler: {
    role: "Dog Handler",
    baseQuals: ["Handler Qualification", "General Purpose Dog", "Advanced Driver"],
    flavourQuals: ["Firearms Support Dog", "Explosive Detection"],
    yearsRange: [4, 20],
  },
  npas_pilot: {
    role: "NPAS Pilot",
    baseQuals: ["CPL(H)", "Instrument Rating", "Police-Tactical Flying"],
    flavourQuals: ["NVG Qualified", "Training Captain"],
    yearsRange: [8, 30],
  },
  npas_tfo: {
    role: "Tactical Flight Officer",
    baseQuals: ["TFO Course", "Thermal Imager Operator", "Mapping Downlink"],
    flavourQuals: ["Specialist Search Observer"],
    yearsRange: [3, 20],
  },
  traffic_officer: {
    role: "Roads Policing Officer",
    baseQuals: ["Advanced Driver", "Motorcycle Class 1", "Speed Detection"],
    flavourQuals: ["Collision Investigator", "ANPR Specialist"],
    yearsRange: [3, 25],
  },
  polsa: {
    role: "Police Search Advisor",
    baseQuals: ["POLSA", "Advanced Search", "Public Order Level 2"],
    flavourQuals: ["CBRN Search", "Covert Search"],
    yearsRange: [6, 25],
  },
  sio: {
    role: "Senior Investigating Officer (DCI)",
    baseQuals: ["PIP3 SIO", "Hydra / Minerva Trained", "Gold Commander"],
    flavourQuals: ["Homicide Working Group", "Family Liaison Manager"],
    yearsRange: [12, 30],
  },
};

// Crew composition per appliance type: list of role keys, one per seat.
// For pumps (WrL / WrT / TRU_pump) the composition depends on the
// designator — P1 rides with a Watch Manager officer, P2 with a Crew
// Manager — so those are resolved at build time in buildCrewMembers
// and left as placeholder slots here.
const COMPOSITION: Partial<Record<ApplianceTypeCode, (keyof typeof ROLES)[]>> = {
  WrL: ["crew_manager", "driver_pump", "firefighter", "firefighter", "firefighter"],
  WrT: ["crew_manager", "driver_pump", "firefighter", "firefighter", "firefighter"],
  L6P: ["firefighter_wildfire", "firefighter"],
  TL: ["firefighter_aerial", "firefighter_aerial"],
  HLP: ["firefighter_aerial", "firefighter_aerial"],
  WIU: ["firefighter", "firefighter_tr"],
  ICU: ["firefighter_command", "firefighter_command"],
  CSU: ["firefighter_command", "firefighter_command"],
  OSU: ["firefighter_command", "firefighter"],
  FIU: ["firefighter"],
  BASU: ["firefighter", "firefighter"],
  BFU: ["firefighter", "firefighter"],
  SACU: [], // crewed by Salvation Army, not GMFRS
  WU: ["firefighter"],
  WFU: ["firefighter_wildfire", "firefighter_wildfire"],
  HLL: ["firefighter", "firefighter"],
  PM: ["firefighter", "firefighter"],
  TRU_pump: [
    "crew_manager",
    "driver_pump",
    "firefighter_tr",
    "firefighter_tr",
    "firefighter_tr",
  ],
  TRU_van: ["firefighter_tr", "firefighter_tr"],
  USAR: [
    "firefighter_usar",
    "firefighter_usar",
    "firefighter_usar",
    "firefighter_usar",
    "firefighter_usar",
  ],
  SDU: ["firefighter"],
  DIM: ["firefighter", "firefighter_command"],

  DCA: ["paramedic", "emt"],
  RRV: ["paramedic"],
  HART_vehicle: [
    "hart_responder",
    "hart_responder",
    "hart_responder",
    "hart_responder",
    "hart_responder",
    "hart_responder",
  ],
  NWAS_IRU: ["nwas_iru_operator", "nwas_iru_operator"],
  HEMS: ["pilot", "ccp", "doctor"],
  BASICS: ["basics_doctor"],
  QR: ["advanced_paramedic"],
  OD: ["duty_officer"],
  CCC: ["ccp", "doctor"],

  // GMP
  Police_Response: ["pc_response", "pc_response"],
  Police_ARV: ["sergeant", "afo", "afo"],
  Police_NPAS: ["npas_pilot", "npas_tfo"],
  Police_Dog: ["dog_handler"],
  Police_TraffMot: ["traffic_officer"],
  Police_Search: ["polsa", "pc_response", "pc_response"],
  Police_SIO: ["sio"],
};

export function buildCrewMembers(
  applianceId: string,
  applianceType: ApplianceTypeCode,
  _service: ServiceCode,
  designator?: string,
): CrewMember[] {
  const comp = COMPOSITION[applianceType];
  if (!comp || comp.length === 0) return [];

  // On pumps the first seat is the officer in charge — Watch Manager if
  // this is the station's P1, Crew Manager on P2 / further seconds.
  const isPump = applianceType === "WrL" || applianceType === "WrT" || applianceType === "TRU_pump";
  const roles = comp.slice();
  if (isPump && designator && /^P1$/i.test(designator)) {
    roles[0] = "watch_manager";
  }

  const rnd = mulberry32(seedFromString(applianceId));
  return roles.map((roleKey, i) => {
    const tpl = ROLES[roleKey];
    const name = pickName(rnd);
    const years = Math.round(
      tpl.yearsRange[0] + rnd() * (tpl.yearsRange[1] - tpl.yearsRange[0]),
    );
    // Sprinkle 0–2 flavour quals.
    const extras: string[] = [];
    for (let j = 0; j < 2; j++) {
      if (rnd() < 0.35) {
        const q = tpl.flavourQuals[Math.floor(rnd() * tpl.flavourQuals.length)];
        if (q && !extras.includes(q) && !tpl.baseQuals.includes(q)) extras.push(q);
      }
    }
    return {
      id: `${applianceId}-c${i + 1}`,
      name,
      role: tpl.role,
      quals: [...tpl.baseQuals, ...extras],
      yearsService: years,
    };
  });
}
