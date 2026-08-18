// Equipment catalog — descriptions and operational use for every kit item
// that appears in appliance loadouts. Click-through in the vehicle panel
// looks up by kit name (exact first, then case-insensitive substring).

export type KitEntry = {
  name: string;
  description: string;
  use: string;
};

const ENTRIES: KitEntry[] = [
  {
    name: "BA sets",
    description:
      "Self-contained Breathing Apparatus. Compressed-air cylinder feeding a face-mask demand valve; ~45 min duration per cylinder at rest, ~25–30 min under working load.",
    use: "Worn by BA-qualified firefighters entering smoke-logged or oxygen-depleted atmospheres. BA entry control board manages wearer tallies and withdrawal times.",
  },
  {
    name: "Spare BA cylinders",
    description:
      "Pre-filled replacement breathing-apparatus cylinders kept on the BA Support Unit (BASU).",
    use: "Swapped onto BA sets during extended incidents so wearers can re-enter without waiting for a compressor refill.",
  },
  {
    name: "Compressor",
    description: "Mobile air compressor for on-scene BA cylinder refilling.",
    use: "Deployed when a protracted incident would exhaust the spare-cylinder pool.",
  },
  {
    name: "Hose",
    description:
      "Mix of 45 mm and 70 mm delivery hose plus suction and high-pressure reels. Stowed on the pump bed and in side lockers.",
    use: "Primary water delivery to jets and branches. 45 mm for close attack, 70 mm for main jets and relay pumping.",
  },
  {
    name: "Bulk hose",
    description:
      "Large-diameter (LDH) hose carried in bulk on a Hose Layer Lorry — typically 150 mm LDH in 50 m lengths.",
    use: "Laid from an open-water source to the incident to feed High Volume Pumping operations.",
  },
  {
    name: "Hose retrieval",
    description: "Powered hose recovery system on the Hose Layer Lorry.",
    use: "Reels large quantities of hose back onto the vehicle after use — saves hours of manual work.",
  },
  {
    name: "13.5m ladder",
    description: "Three-section 13.5 m aluminium-alloy wheeled escape ladder, carried on the pump roof.",
    use: "Access and rescue from first and second floor windows. Standard pump equipment.",
  },
  {
    name: "32m turntable ladder",
    description: "Hydraulically operated turntable ladder with a rescue cage and monitor, reach ~32 m.",
    use: "High-rise access, rooftop attack, rescue of mobility-impaired casualties, overhead water application.",
  },
  {
    name: "Cage rescue",
    description: "Enclosed rescue cage at the tip of an aerial appliance.",
    use: "Safe working platform for firefighters or casualty extraction from height.",
  },
  {
    name: "Hydraulic platform",
    description: "Articulated or telescopic boom with a platform — smoother than a turntable ladder.",
    use: "Aerial rescue, firefighting from height, casualty removal. Typical reach 22–30 m.",
  },
  {
    name: "Rescue cage",
    description: "Alias for Cage rescue — attached platform/basket on an aerial appliance.",
    use: "Safe platform for crew working at height.",
  },
  {
    name: "Boom monitor",
    description: "Remotely-operated water monitor on an extendable boom (Water Tower).",
    use: "Direct large volumes of water from a safe stand-off at fires in deep-seated or collapsing structures.",
  },
  {
    name: "Hydraulic cutters",
    description: "Combined cutter/spreader tools (Holmatro, Lukas or similar) — 'jaws of life'.",
    use: "Vehicle extrication: cut B-pillars, remove roofs, spread door apertures to release trapped casualties.",
  },
  {
    name: "AED",
    description: "Automated External Defibrillator.",
    use: "Carried on most front-line appliances for immediate cardiac arrest response before ambulance arrival.",
  },
  {
    name: "Defib / AED",
    description: "Professional manual/AED combi defibrillator carried on ambulances.",
    use: "Cardiac arrhythmia management during resuscitation — AED mode for untrained bystanders, manual mode for paramedics.",
  },
  {
    name: "Oxygen",
    description: "Medical oxygen cylinders with regulators and masks.",
    use: "Supplemental O2 for trauma, respiratory distress, and smoke inhalation casualties.",
  },
  {
    name: "Paramedic kit",
    description: "Full paramedic drug and intervention kit — airway adjuncts, IV access, controlled drugs.",
    use: "Standard emergency response kit on a Double-Crewed Ambulance; the working toolkit of HCPC-registered paramedics.",
  },
  {
    name: "Airway",
    description: "Advanced airway kit — supraglottic devices, laryngoscopes, endotracheal tubes.",
    use: "Pre-hospital airway management for unconscious or deteriorating casualties.",
  },
  {
    name: "Trolley bed",
    description: "Power-assisted stretcher-bed (Stryker Power-PRO).",
    use: "Casualty transport between incident, ambulance, and hospital. Lowers and raises at the press of a button to reduce crew injury risk.",
  },
  {
    name: "Solo paramedic response",
    description: "Fast-response car equipped for a lone paramedic.",
    use: "Gets a paramedic to the patient quickly; may stabilise pending a transporting ambulance.",
  },
  {
    name: "Critical care / trauma kit",
    description: "Advanced trauma kit — pre-hospital emergency anaesthesia, blood products, thoracostomy, surgical airway.",
    use: "Doctor-paramedic interventions on HEMS aircraft or BASICS responder scenes.",
  },
  {
    name: "Blood",
    description: "Packed red blood cells carried in a temperature-controlled cool box.",
    use: "Pre-hospital transfusion for major haemorrhage — massively improves survival on major trauma.",
  },
  {
    name: "Doctor-paramedic team",
    description: "HEMS crew combination — pilot, critical care paramedic, pre-hospital doctor.",
    use: "Delivers hospital-level critical care to the scene; can perform RSI, pre-hospital surgery, blood transfusion.",
  },
  {
    name: "Volunteer pre-hospital emergency doctor",
    description: "BASICS doctor — GP or hospital doctor trained in immediate care; volunteer scheme.",
    use: "Activated for trauma, paediatric arrest, or entrapment. Self-dispatches from home or work.",
  },
  {
    name: "CBRN PPE",
    description:
      "Gas-tight Chemical, Biological, Radiological, Nuclear protective suits with positive-pressure supplied-air breathing apparatus.",
    use: "Worn by HART for rescue in contaminated or unknown atmospheres.",
  },
  {
    name: "Rope / water / confined-space kit",
    description: "HART specialist kit — line rescue, swift-water, confined-space entry.",
    use: "Enables casualty access and rescue in environments where standard ambulance crews cannot safely work.",
  },
  {
    name: "Casualty decon",
    description: "Portable decontamination shower and run-off containment.",
    use: "Decon a single casualty before loading into the ambulance — prevents secondary contamination of the vehicle and the receiving hospital.",
  },
  {
    name: "Mass casualty decon",
    description: "Inflatable mass decontamination shelters and water heater / shower trains.",
    use: "Decon dozens to hundreds of casualties at a CBRN or major hazmat incident.",
  },
  {
    name: "Specialist PPE",
    description: "Higher-grade PPE than standard clinical uniforms — chemical-resistant, puncture-resistant.",
    use: "Enables ambulance responders to operate in slightly-warmer zones than the standard cold zone.",
  },
  {
    name: "Foam concentrate",
    description: "Bulk supply of firefighting foam concentrate (AFFF or fluorine-free).",
    use: "Metered into the water stream via foam-making branches to form suppression blanket on fuel / flammable-liquid fires.",
  },
  {
    name: "Foam-making branches",
    description: "Branches (nozzles) that aerate a foam solution on delivery.",
    use: "Used with foam concentrate from a BFU to produce suppression foam on fuel spills or petrochemical fires.",
  },
  {
    name: "Gas detection",
    description: "Multi-gas detectors — O2, CO, H2S, LEL (flammable gas).",
    use: "Atmospheric monitoring at hazmat / fire / industrial incidents to identify toxic and explosive hazards.",
  },
  {
    name: "Chemical ID",
    description: "Field chemical identification — Raman spectroscopy (Rigel, TruNarc) and colorimetric tubes.",
    use: "Identify unknown liquids and solids on DIM deployments so tactics can be set properly.",
  },
  {
    name: "Radiation monitoring",
    description: "Personal dosimeters and scintillation survey meters.",
    use: "Detect and measure ionising radiation at CBRN incidents, aligned to UK DIM scheme.",
  },
  {
    name: "Boat",
    description: "Small rigid inflatable powered craft with safety equipment and PFDs.",
    use: "Water rescue from rivers, canals, quays. Typically manned by 3 water-rescue trained crew.",
  },
  {
    name: "Powered craft",
    description: "Larger powered boat — rigid inflatable or aluminium hull.",
    use: "Sustained water operations, multi-casualty water rescue, flood response.",
  },
  {
    name: "Throwlines",
    description: "80–250 m floating rescue lines with a throwing bag.",
    use: "First-strike water rescue — thrown to a conscious casualty in the water to pull them to shore.",
  },
  {
    name: "Dry suits",
    description: "Neoprene or breathable membrane water-rescue suits with seals.",
    use: "Worn for water entry — protects from cold-water shock and hypothermia.",
  },
  {
    name: "Major incident comms",
    description: "Airwave / 4G extender, radio repeaters, mapping laptop.",
    use: "Command-and-control communications hub for large incidents; interop with partner agencies on a joint incident channel.",
  },
  {
    name: "Mapping",
    description: "Large-format printed maps and digital map station.",
    use: "Common operating picture for Silver command; plotting of sectors, cordons, and resource locations.",
  },
  {
    name: "Briefing space",
    description: "Internal table and seating for tactical / strategic command briefings.",
    use: "Sector commanders and multi-agency partners meet to share METHANE updates and agree tactics.",
  },
  {
    name: "Comms",
    description: "Radio, telephony, and data comms kit on a Command Support Unit.",
    use: "Links the incident ground to Control and to partner agencies during smaller but significant jobs.",
  },
  {
    name: "Logging",
    description: "Dedicated logging computer and paper decision log.",
    use: "Captures tactical decisions and timings — central to the JESIP joint-decision model and post-incident review.",
  },
  {
    name: "Operational logistics",
    description: "On-scene supplies — lighting, fuel, food-water, welfare.",
    use: "Sustains firefighters on protracted jobs (hours to days).",
  },
  {
    name: "Investigation kit",
    description: "Fire investigation tools — ignition-source testing, sampling, documentation.",
    use: "Used after fire-out to determine origin and cause; evidence-handling for prosecution if suspected arson.",
  },
  {
    name: "Dog (search)",
    description: "Fire investigation accelerant-detection dog.",
    use: "Sniffs out residual flammable liquid traces — indicates likely ignition sources.",
  },
  {
    name: "Welfare facilities for crews on long incidents",
    description: "Kitchen, toilet, washing, sheltered rest area.",
    use: "Stood up at protracted jobs so crews can rotate through rehab without leaving the ground.",
  },
  {
    name: "Catering (Salvation Army crew, not GMFRS)",
    description: "Salvation Army mobile canteen — hot meals, drinks, welfare chaplain.",
    use: "Feeds firefighters at major and protracted incidents. Staffed by the Salvation Army, hosted at a GMFRS station.",
  },
  {
    name: "Wildfire beaters",
    description: "Flexible rubber-tipped flails for beating out moorland flames.",
    use: "Mechanical suppression at wildfire edge where water is unavailable.",
  },
  {
    name: "Leaf blowers",
    description: "Powerful backpack leaf blowers.",
    use: "Blow flame back onto already-burnt ground, suffocating wildfire edge.",
  },
  {
    name: "Knapsack sprayers",
    description: "Backpack pressurised water sprayers, 16–20 L capacity.",
    use: "Direct-application water suppression on wildfire edge and hot spots.",
  },
  {
    name: "Rope rescue",
    description: "High-angle rope rescue kit — static ropes, harnesses, descenders, anchors.",
    use: "Casualty extraction from height or depth where other approaches are unsafe.",
  },
  {
    name: "Water rescue",
    description: "Swift-water and flood rescue kit — drysuits, fins, helmets, throwlines.",
    use: "Rescue from moving water or flooded structures.",
  },
  {
    name: "Heavy rescue",
    description: "Cribbing, air bags, hydraulic rams beyond standard extrication kit.",
    use: "Lifting and shoring of heavy loads — HGV RTCs, partial collapse, industrial entrapment.",
  },
  {
    name: "Specialist tooling",
    description: "Hand-held hydraulic and pneumatic rescue tools on the TRU van.",
    use: "Specific technical rescue jobs — machinery entrapment, rail incidents, confined-space work.",
  },
  {
    name: "Shoring",
    description: "Timber and pneumatic shoring kit for temporary structural support.",
    use: "USAR deployment — makes collapse voids safe to enter for casualty search and rescue.",
  },
  {
    name: "Lifting",
    description: "High-capacity lifting air bags and hydraulic jacks.",
    use: "Lifting collapsed structural members to free trapped casualties.",
  },
  {
    name: "Search cameras",
    description: "Flexible borescope and thermal imaging cameras.",
    use: "Searching voids for casualty signs — motion, warmth, sound — without disturbing unstable debris.",
  },
  {
    name: "Concrete cutting",
    description: "Diamond chainsaws and hydraulic breakers.",
    use: "Cutting through collapsed concrete to reach trapped casualties (USAR capability).",
  },
  {
    name: "Search dog (handler-led)",
    description: "Search and Rescue dog with dedicated handler.",
    use: "Fast area search for live casualties in collapsed structures, missing-person searches.",
  },
  {
    name: "Booms",
    description: "Absorbent and containment booms for spills.",
    use: "EPU pod — laid in waterways to contain oil/chemical spills and prevent further spread.",
  },
  {
    name: "Absorbents",
    description: "Granular and pad absorbents.",
    use: "Soak up small spills on ground to prevent run-off into drains and waterways.",
  },
  {
    name: "Spill containment",
    description: "Bunding kit, drain mats, portable bunds.",
    use: "Prevent hazardous run-off from reaching storm drains; part of EPU capability.",
  },
  {
    name: "High volume pumping",
    description: "6–7,000 L/min pump driven by a diesel engine on a skid.",
    use: "Dewatering floods, supplying massive quantities of water for tactical fire-ground use; national resilience asset.",
  },
  {
    name: "National resilience asset",
    description: "Nationally-funded specialist asset (HVP, USAR, DIM) available across the UK under mutual aid.",
    use: "Deployed to major incidents; Home Office funding with service hosting and crewing.",
  },
  {
    name: "Bulk LDH hose",
    description: "Large-diameter hose (LDH) carried in bulk (typically 1.5–2 km).",
    use: "Water supply line from open-water source to HVP deployment site.",
  },
  {
    name: "Pairs with HVP",
    description: "HVHL — High Volume Hose Layer pod.",
    use: "Carries the LDH that feeds the HVP pump; laid out as the vehicle drives.",
  },
  {
    name: "Timber for shoring (USAR)",
    description: "Pallet-loaded pre-cut timber for on-site shoring fabrication.",
    use: "Consumables carried by the UTC pod; used by USAR teams for rapid temporary structural support.",
  },
  {
    name: "Pod chassis (carries one pod)",
    description: "A Prime Mover with a pod-loading mechanism — slots and locks interchangeable pods.",
    use: "Carries whichever pod the incident needs (HVP, HVHL, EPU, UTC, welfare, etc).",
  },
  {
    name: "Off-road capability",
    description: "High-clearance 4×4 or 6×6 capability.",
    use: "Access to moorland, off-road, and wildland incidents where standard appliances cannot follow.",
  },
];

export function lookupKit(name: string): KitEntry | null {
  const exact = ENTRIES.find((e) => e.name === name);
  if (exact) return exact;
  const needle = name.toLowerCase();
  return (
    ENTRIES.find((e) => e.name.toLowerCase() === needle) ??
    ENTRIES.find((e) => e.name.toLowerCase().includes(needle)) ??
    ENTRIES.find((e) => needle.includes(e.name.toLowerCase())) ??
    null
  );
}
