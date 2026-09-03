// The standard attendance per incident type — transcribed from
// data/research/fire/pda.md, where every row carries its source.
//
// The honest position first: GMFRS's own matrix ("Incident Type List and
// GMFRS Response Matrix") is withheld — three FOI requests refused, one
// with a response file literally titled "neither confirm nor deny" (S23),
// and Lancashire, London and West Midlands refuse on the same
// national-security ground. So very little here is a GMFRS number. What
// IS sourced for GMFRS is used as such: the high-rise attendance as it
// stood in June 2017 (S5), the AFA attendance policy (S17, S18), and the
// mobilising rules (S9, S10). The shape of everything else follows the
// Cumbria list as held on the same NWFC mobilising system (S26) and
// London's published policy (S29, S30, S34), and the numbers are the
// sim's modelled choice — tagged so on every template, with the reason.
//
// A template is a set of PdaSlots in the same shape the scenarios use,
// so the checklist, the proposal and the fill state work on either.

import type { IncidentTypeCode, PdaSlot } from "./incident_types";

export type PdaSource = "GMFRS" | "NWFC-CUM" | "LFB" | "NOG" | "modelled" | "scenario";

export type PdaTemplate = {
  type: IncidentTypeCode;
  label: string;
  slots: PdaSlot[];
  /** The strongest source behind the attendance as a whole. */
  source: PdaSource;
  /** One line per slot group: what it leans on, with the S-numbers. */
  basis: string[];
  /** Where the sourced picture and the sim's choice part company. */
  note?: string;
};

const pump = (id: string, label: string, notes?: string): PdaSlot => ({
  id,
  label,
  service: "Fire",
  requiredApplianceTypes: ["WrL", "WrT", "TRU_pump"],
  requiredCapabilities: ["BA"],
  notes,
});

const officer = (notes = "Nearest Station Manager — the officer on every NWFC-format life-risk PDA (S26), and on GMFRS's own 2017 high-rise PDA (S5)"): PdaSlot => ({
  id: "officer",
  label: "Station Manager",
  service: "Fire",
  // A real officer, since there is one now — the slot used to ask for a
  // command vehicle, which is not the same thing at all.
  requiredApplianceTypes: ["FIRE_SM"],
  requiredCapabilities: ["Command"],
  notes,
});

const ambulance = (notes = "One DCA with the PDA when persons are reported or believed involved — London's written rule (S34), adopted for NWAS as the nearest sourced analogue"): PdaSlot => ({
  id: "ambulance",
  label: "Ambulance",
  service: "Ambulance",
  requiredApplianceTypes: ["DCA"],
  requiredCapabilities: ["Medical"],
  notes,
});

export const STANDARD_PDA_TEMPLATES: Partial<Record<IncidentTypeCode, PdaTemplate>> = {
  automatic_fire_alarm: {
    type: "automatic_fire_alarm",
    label: "Automatic fire alarm — commercial premises",
    source: "GMFRS",
    slots: [pump("pump1", "Pump 1", "One pumping appliance — the attendance at every sourced service (S26 Cumbria on NWFC, S34 London)")],
    basis: [
      "[GMFRS] From 1 Aug 2020, no attendance to an AFA at premises without sleeping accommodation between 08:00 and 19:00 unless a fire is believed — S17, S18",
      "[NWFC-CUM] Commercial AFA = 1 PUMP — S26",
      "[LFB] Commercial AFA = one pumping appliance — S34",
    ],
    note: "In trading hours this call would be challenged and not attended under GMFRS policy; the realistic trigger is the ARC or security reporting signs of fire.",
  },
  healthcare_premises_fire_alarm: {
    type: "healthcare_premises_fire_alarm",
    label: "Automatic fire alarm — hospital / sleeping risk",
    source: "GMFRS",
    slots: [
      pump("pump1", "Pump 1", "Attended at any hour — hospitals are exempt from the daytime non-attendance policy (S18)"),
      pump("pump2", "Pump 2", "Sleeping-risk uplift — the sim's choice, not a sourced number; no sourced service sends more than one pump to a hospital alarm"),
    ],
    basis: [
      "[GMFRS] Hospitals and high-rise exempt from AFA non-attendance — S18; number of pumps not published — S17",
      "[NWFC-CUM] Residential AFA = 1 PUMP; residential-care building fire = 3 PUMPS + nearest SM — S26",
      "[LFB] Hospitals always attended for an AFA — S35",
      "[MODELLED] Second pump for a 700-bed hospital; 3 pumps + SM + aerial on request once fire is confirmed",
    ],
  },
  dwelling_fire_persons_reported: {
    type: "dwelling_fire_persons_reported",
    label: "Dwelling fire, persons reported",
    source: "NWFC-CUM",
    slots: [
      pump("pump1", "Pump 1", "First in attendance — primary BA team"),
      pump("pump2", "Pump 2", "Second BA team, second jet, search"),
      pump("pump3", "Pump 3", "Persons-reported uplift — 3 PUMPS (ANY) on the NWFC-format row (S26); London adds for persons reported (S32)"),
      officer(),
      ambulance(),
    ],
    basis: [
      "[GMFRS] A 'two pumps' PDA is two tenders and eight firefighters; a command structure is mobilised at once to a house fire — S9",
      "[GMFRS] Every PDA is built on a minimum crew of four — S10",
      "[NWFC-CUM] PERSONS REPORTED FIRE = 3 PUMPS (ANY), NEAREST SM — S26",
      "[LFB] Single private dwelling = pump ladder + pump; more if persons involved; ambulance ordered on initial mobilisation when persons are believed involved — S30, S32, S34",
      "[MODELLED] Aerial off the PDA (unsupported anywhere sourced); police informed, not mobilised (S34)",
    ],
    note: "The scenario's aerial and Group Manager are heavier than any sourced attendance; both belong to the make-up.",
  },
  high_rise_dwelling_fire: {
    type: "high_rise_dwelling_fire",
    label: "High-rise dwelling fire, persons reported",
    source: "GMFRS",
    slots: [
      pump("pump1", "Pump 1"),
      pump("pump2", "Pump 2"),
      pump("pump3", "Pump 3"),
      pump("pump4", "Pump 4", "Four pumping appliances for all high-rise fires — GMFRS, 14 Jun 2017 (S5)"),
      pump("pump5", "Pump 5", "Five where persons are reported trapped — GMFRS (S5)"),
      {
        id: "aerial",
        label: "Aerial",
        service: "Fire",
        requiredApplianceTypes: ["TL", "HLP"],
        requiredCapabilities: ["Aerial"],
        notes: "Nearest aerial appliance, on the PDA from 23 Jun 2017 (S5); 20-minute special-appliance standard to all high-rise buildings (S19, S20)",
      },
      pump("support", "Support pump", "Sent with the aerial — GMFRS (S5)"),
      officer("Nearest Station Manager — GMFRS's own 2017 high-rise PDA (S5)"),
      ambulance(),
    ],
    basis: [
      "[GMFRS] 4 pumps + nearest SM for all high-rise fires; 5 where persons trapped; nearest aerial with support pump from 23 Jun 2017 — S5",
      "[GMFRS] The 2019 Fire Cover Review increased the high-rise attendance again; the new number is not published — S6",
      "[LFB] Five fire engines and an aerial automatically; ten with multiple calls and cladding — S29",
      "[MODELLED] Five is therefore a floor, not a guess; BASU and CSU belong to the make-up",
    ],
  },
  rtc_entrapment: {
    type: "rtc_entrapment",
    label: "RTC, persons trapped",
    source: "NWFC-CUM",
    slots: [
      {
        id: "rescue",
        label: "Rescue pump",
        service: "Fire",
        requiredApplianceTypes: ["TRU_pump", "TRU_van"],
        requiredCapabilities: [],
        notes: "Heavy extrication — the 'large vehicles' shape once an HGV is involved (S26)",
      },
      pump("pump1", "Pump 1"),
      pump("pump2", "Pump 2"),
      officer(),
      ambulance("DCA plus HART for entrapment — HART's own tasking criteria (S43)"),
    ],
    basis: [
      "[NWFC-CUM] RTC PERSONS TRAPPED, small vehicles = 2 PUMPS (ANY) + NEAREST SM; large vehicles = rescue unit + support + 2 pumps + SM — S26",
      "[MODELLED] Aerial off the PDA; GMP traffic and National Highways attend on their own 999 call, not a fire slot",
    ],
  },
  industrial_fire: {
    type: "industrial_fire",
    label: "Industrial / commercial fire",
    source: "modelled",
    slots: [
      pump("pump1", "Pump 1"),
      pump("pump2", "Pump 2"),
      pump("pump3", "Pump 3", "Generic 'large industrial premises with PRI' special attendance — the sim's choice"),
      officer("Nearest Station Manager — acetylene on site"),
      ambulance("Two staff unaccounted for is persons involved"),
    ],
    basis: [
      "[NWFC-CUM] Commercial/industrial building fire = 2 PUMPS — S26",
      "[HUMBERSIDE] Specials are not normally on an initial PDA; they come on the IC's request — S37",
      "[MODELLED] Third pump for a PRI premises; aerial, HVP and BFU on confirmation",
    ],
  },
  hazmat_chemical_leak: {
    type: "hazmat_chemical_leak",
    label: "Hazmat — chemical release",
    source: "modelled",
    slots: [
      pump("pump1", "Pump 1", "Detection-equipped first pump (S26 'pump with detection kit')"),
      pump("pump2", "Pump 2"),
      pump("pump3", "Pump 3", "Persons-involved uplift — gas-leak shape"),
      {
        id: "epu",
        label: "Environmental protection",
        service: "Fire",
        requiredApplianceTypes: ["PM"],
        requiredCapabilities: [],
        notes: "Prime mover with the environmental protection pod",
      },
      {
        id: "dim",
        label: "DIM",
        service: "Fire",
        requiredApplianceTypes: ["DIM"],
        requiredCapabilities: ["HAZMAT_DIM"],
        notes: "Detection, identification and monitoring — GMFRS carries one; Cumbria substitutes a pump-borne kit",
      },
      officer("Nearest Station Manager; duty NILO / hazmat adviser informed"),
      ambulance("DCA plus HART for decontamination"),
    ],
    basis: [
      "[NWFC-CUM] HAZMAT small = 1 pump with detection kit + 2 pumps; large adds nearest SM — S26",
      "[LFB] Hazmat level 2 = 2 pumps + FRU + hazmat officer — S30",
      "[MODELLED] Three pumps, EPU and DIM as the GMFRS-fleet equivalent of that shape",
    ],
  },
  wildfire_moorland: {
    type: "wildfire_moorland",
    label: "Moorland / wildfire",
    source: "NWFC-CUM",
    slots: [
      pump("pump1", "Pump 1"),
      {
        id: "wfu1",
        label: "Wildfire unit",
        service: "Fire",
        requiredApplianceTypes: ["WFU", "ATV"],
        requiredCapabilities: [],
        notes: "GMFRS stations moorland-fringe wildfire units",
      },
    ],
    basis: [
      "[NWFC-CUM] Small fires / grass / moorland = 1 PUMP; forest fire adds SM — S26",
      "[MODELLED] Second pump + nearest SM on confirmation of a running moorland fire; further WFUs, DIM and mutual aid on the make-up",
    ],
    note: "The scenario's three WFUs and Group Manager at the call are the make-up, not the attendance.",
  },
  education_premises_fire: {
    type: "education_premises_fire",
    label: "School / education premises fire",
    source: "NWFC-CUM",
    slots: [pump("pump1", "Pump 1"), pump("pump2", "Pump 2")],
    basis: [
      "[NWFC-CUM] Building fire = 2 PUMPS — S26",
      "[MODELLED] Nothing else until confirmation; SM on 'make pumps 4'; aerial off the PDA",
    ],
  },
  special_service_water_rescue: {
    type: "special_service_water_rescue",
    label: "Water rescue",
    source: "NWFC-CUM",
    slots: [
      {
        id: "wiu",
        label: "Water incident unit",
        service: "Fire",
        requiredApplianceTypes: ["WIU"],
        requiredCapabilities: ["WaterRescue"],
        notes: "Boat and team",
      },
      pump("pump1", "Pump 1", "Water-rescue-capable station"),
      pump("pump2", "Pump 2"),
      officer(),
      ambulance("DCA plus HART — inland water is a HART capability"),
    ],
    basis: [
      "[NWFC-CUM] RESCUE OF PERSON IN WATER = pump with water rescue team, pump WR, pump, SM — S26",
      "[MODELLED] TRU off the PDA; police attend on their own 999 call for a possible suicide attempt",
    ],
  },
  police_firearms_incident: {
    type: "police_firearms_incident",
    label: "Firearms incident (police-led)",
    source: "modelled",
    slots: [
      { id: "resp1", label: "Response 1", service: "Police", requiredApplianceTypes: ["Police_Response"], requiredCapabilities: ["Police_Response"], notes: "Hold, contain, outer cordon" },
      { id: "resp2", label: "Response 2", service: "Police", requiredApplianceTypes: ["Police_Response"], requiredCapabilities: ["Police_Response"] },
      { id: "arv1", label: "ARV 1", service: "Police", requiredApplianceTypes: ["Police_ARV"], requiredCapabilities: [], notes: "Front containment" },
      { id: "arv2", label: "ARV 2", service: "Police", requiredApplianceTypes: ["Police_ARV"], requiredCapabilities: [], notes: "Rear containment" },
      { id: "amb", label: "Ambulance (RVP)", service: "Ambulance", requiredApplianceTypes: ["DCA"], requiredCapabilities: ["Medical"], notes: "Staged at the RVP until the scene is declared safe" },
    ],
    basis: ["[MODELLED] Not a fire PDA. GMP publishes no firearms attendance; the shape follows College of Policing APP for spontaneous firearms incidents (S44)"],
  },
  ambulance_cardiac_arrest: {
    type: "ambulance_cardiac_arrest",
    label: "Cardiac arrest (ambulance-led)",
    source: "NOG",
    slots: [
      { id: "rrv", label: "RRV", service: "Ambulance", requiredApplianceTypes: ["RRV"], requiredCapabilities: ["Medical"], notes: "First resource" },
      { id: "dca1", label: "DCA 1", service: "Ambulance", requiredApplianceTypes: ["DCA"], requiredCapabilities: ["Medical"], notes: "Conveying crew" },
      { id: "dca2", label: "DCA 2", service: "Ambulance", requiredApplianceTypes: ["DCA"], requiredCapabilities: ["Medical"], notes: "Backup crew" },
    ],
    basis: [
      "[NOG] Category 1 — the fastest response; ARP's C1 standard (S45)",
      "[MODELLED] Critical care car / HEMS by tasking criteria; duty officer for scene management; no fire co-responder",
    ],
  },
};
