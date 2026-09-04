# What fire and ambulance actually get sent to

A working catalogue for building scenarios. Organised the way the real
classifications are, then filtered down to what makes a DISTINCT job for
this sim — two incident types that put the same appliances on the same
ground and ask the operator the same question are one scenario with two
titles, not two scenarios.

**Confidence, stated up front.** The fire classification is the Home
Office Incident Recording System's, which is published and used for the
national statistics — the three top-level categories and the main
sub-headings are solid. The ambulance response categories C1–C5 are the
Ambulance Response Programme's and are equally public. The AMPDS chief
complaint list is a commercial product (Priority Dispatch Corp) and the
protocol set below is from general familiarity rather than a document in
front of me — treat the individual card numbers as UNVERIFIED and check
before any of them appear in the UI as fact. Nothing here is transcribed
from a force or trust document.

Marked `[SIM]` where scenario 01–12 already covers it.

---

## FIRE — Incident Recording System, three top-level categories

### 1. Fires

**Primary fires** — anything involving property, casualties, or five or
more appliances.

| Job | Notes for a scenario |
|---|---|
| Dwelling fire — house | The bread and butter. Persons reported changes everything. `[SIM 02]` |
| Dwelling fire — purpose-built flat | Compartmentation, stay-put, one entrance. `[SIM 07]` |
| Dwelling fire — HMO / bedsit | Sleeping risk, poor compartmentation, uncertain occupancy |
| Dwelling fire — bungalow / sheltered housing | Vulnerable occupants, care staff on site |
| Caravan / park home / mobile home | Fast fire growth, LPG, often remote from hydrants |
| High-rise — above the reach of an aerial | Firefighting shaft, riser, evacuation strategy `[SIM 07]` |
| Other building — retail | Out-of-hours entry, shutters, stock loading |
| Other building — industrial / warehouse | `[SIM 04]` |
| Other building — hospital / care home | Progressive horizontal evacuation, no full evac `[SIM 10 alarm]` |
| Other building — school | Out of hours mostly; roof voids `[SIM 08]` |
| Other building — hotel / hostel | Sleeping risk, transient occupants, language |
| Other building — place of worship | Large volume, heritage, water supplies |
| Other building — agricultural | Remote, water shortage, livestock, hay/straw |
| Other building — derelict | No life risk but persistent; arson |
| Road vehicle — car | Very common, usually one pump |
| Road vehicle — HGV / bus | Load unknown, tachograph, passengers |
| Road vehicle — EV / lithium battery | Re-ignition, immersion, prolonged cooling |
| Rail vehicle | Traction current isolation, access |
| Aircraft | Airport RVP, standby categories |
| Boat / vessel | Marina, canal, confined |

**Secondary fires** — small outdoor fires not involving property.

| Job | Notes |
|---|---|
| Refuse / skip / wheelie bin | Volume job, often deliberate |
| Grassland, heath, moorland | `[SIM 05]` |
| Woodland / forestry | Access, water relay |
| Standing crop / stubble | Seasonal, farm machinery assistance |
| Loose refuse, fly-tipping | |
| Derelict vehicle | |

**Chimney fires** — their own IRS category. One pump, quick, seasonal.

### 2. Special Services — non-fire emergencies

This is where the variety is, and where the sim is thinnest.

| Job | Notes for a scenario |
|---|---|
| RTC — persons trapped | `[SIM 03]` |
| RTC — persons NOT trapped, making safe | Different job entirely: no extrication |
| RTC — HGV / bus / multi-vehicle | Extended cordon, motorway closure |
| Extrication from machinery | Farm, industrial, stabilisation |
| Release from lift | Very common, low drama, good for volume |
| Rescue from height / rope rescue | Line rescue teams |
| Rescue from below ground / confined space | Sewers, silos, tanks — gas monitoring |
| Rescue from water — inland | `[SIM 09]` |
| Rescue from water — ice | Seasonal |
| Rescue from mud / silt | Estuary, canal bank |
| Rescue from collapsed structure | USAR, prolonged |
| Flooding — property | Pumping out, sandbags, high-volume pump |
| Flooding — wide area | Multi-agency, evacuation |
| Water supply to other agencies | Drought, mains failure |
| Hazmat — chemical spill/leak | `[SIM 06]` |
| Hazmat — gas leak (natural gas) | Cordon, gas board, no ignition source |
| Hazmat — fuel spill on carriageway | Environmental protection |
| Hazmat — suspicious package / white powder | Police-led, JESIP |
| Hazmat — radiation | Rare, specialist |
| Effecting entry — concern for welfare | Very common; door forced for ambulance |
| Effecting entry — for the ambulance service | Bariatric, collapse behind door |
| Bariatric assistance to ambulance | Manual handling, no fire risk at all |
| Assist ambulance — co-responding | Some services only |
| Assist police — forced entry, searching | |
| Suicide intervention — person at height | Negotiator-led, fire in support |
| Removal of object from person | Ring, machinery, railings |
| Animal rescue — large animal | Horse in ditch, cattle |
| Animal rescue — from height or water | |
| Making safe — unsafe structure | Storm damage, masonry |
| Making safe — after an RTC | Fuel, battery, debris |
| Standby / cover move | Not an incident but occupies an appliance |
| Advice only | |

### 3. False alarms — the largest single category in reality

| Job | Notes |
|---|---|
| AFA — due to apparatus | `[SIM 01]` |
| Good intent — smoke seen, well-meaning caller | The chip-pan that was steam |
| Malicious | Repeat locations, call challenge |

---

## AMBULANCE

### Response categories (Ambulance Response Programme, England)

Public and well documented. These set the CLOCK, and the clock is the
operator's problem, which makes them the right spine for scenarios.

| Category | Meaning | Target |
|---|---|---|
| **C1** | Life-threatening — cardiac arrest, not breathing, unconscious | Mean 7 min, 90th centile 15 min |
| **C1T** | C1 needing transport | |
| **C2** | Emergency — stroke, chest pain, sepsis, major trauma | Mean 18 min, 90th centile 40 min |
| **C3** | Urgent — non-severe falls, abdominal pain | 90th centile 120 min |
| **C4** | Less urgent — assessed and may be referred | 90th centile 180 min |
| **C5** | Telephone assessment / non-emergency | |

### Chief complaints — the jobs themselves

**UNVERIFIED as a card list.** AMPDS is a commercial product and the
protocol numbering below is from familiarity, not a document. The
COMPLAINTS are real and universal; do not print card numbers in the UI
until someone checks them.

| Job | Likely category | Notes for a scenario |
|---|---|---|
| Cardiac / respiratory arrest | C1 | `[SIM 12]` |
| Not breathing / ineffective breathing | C1 | |
| Choking | C1 | Fast resolution or fast deterioration |
| Anaphylaxis | C1 | Adrenaline, time-critical |
| Catastrophic haemorrhage | C1 | |
| Unconscious / fainting | C1/C2 | Huge volume, wide differential |
| Hanging / strangulation | C1 | |
| Drowning | C1 | Joint with fire `[SIM 09 adjacent]` |
| Electrocution | C1/C2 | Isolation before approach |
| Stroke / TIA | C2 | Thrombolysis window — a real clock |
| Chest pain / suspected MI | C2 | PPCI centre, bypass local ED |
| Sepsis | C2 | |
| Major trauma | C2 | Trauma centre triage, HEMS |
| Stab / gunshot / penetrating trauma | C2 | Police scene safety first |
| Burns / explosion | C2 | Burns centre |
| Seizures / convulsions | C2 | Status epilepticus |
| Breathing problems — asthma, COPD | C2 | |
| Overdose / poisoning | C2/C3 | Mental health pathway |
| Psychiatric / suicide attempt | C2/C3 | Police, s136, safeguarding |
| Pregnancy / childbirth | C1–C3 | Imminent birth, cord prolapse |
| Falls — elderly, non-injury | C3 | The volume job. Long waits, lift assist |
| Falls — with injury | C2/C3 | Fractured NOF |
| Abdominal pain | C3 | |
| Diabetic problems | C2/C3 | Often treat and leave |
| Allergic reaction, non-anaphylaxis | C3 | |
| Assault | C2/C3 | Police joint |
| Traffic collision — injuries | C1–C2 | Joint with fire `[SIM 03]` |
| Heat / cold exposure | C2/C3 | Seasonal, homeless |
| Carbon monoxide / inhalation | C1/C2 | Joint with fire, multiple casualties |
| Headache | C3 | |
| Back pain | C3/C4 | |
| Eye problems | C4 | |
| Sick person — undifferentiated | C3/C4 | The commonest of the lot |
| Unknown problem / man down | C1 until proven otherwise | |
| Interfacility transfer | C4/C5 | Occupies a DCA for hours |
| Healthcare professional admission | C2–C4 | GP has already seen them |

---

## What this means for the sim

The twelve scenarios cover **eleven fire-side jobs and one ambulance
job**, and every one of them is a big set-piece. The catalogue above is
mostly NOT set-pieces, and that is the gap:

1. **Volume jobs are missing entirely.** Lift releases, bin fires, car
   fires, effecting entry, elderly fallers. These are what a shift is
   actually made of, and without them the board is never quietly busy —
   it is either empty or on fire.
2. **The ambulance side is one scenario.** C1–C5 is a ready-made spine:
   the category sets the clock, and the clock is the operator's problem.
3. **False alarms are the largest real category** and the sim has one.
4. **Special services outnumber fires in reality** and the sim has three.

A sensible next step is a tranche of SHORT jobs — one or two units, a few
minutes, no ground view needed — so the stack has something on it between
the set-pieces. Delegation and the make-up mechanic already make those
playable without ceremony.
