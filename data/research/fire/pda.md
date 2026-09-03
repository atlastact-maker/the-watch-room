# Pre-determined attendances (PDAs)

Compiled 2026-09-03 from three web hunts plus a synthesis pass. Source numbers
(S5–S46) are in [`sources.md`](sources.md); the numbering continues that file's
scheme. This document feeds `src/lib/sim/pda.ts` (`STANDARD_PDA`), which is
currently seeded from the scenarios' own authored attendances and tagged
`"scenario"` until the tables below are transcribed.

**Headline finding.** GMFRS's PDA matrix is *not public*. GMFRS answered a 2019
request for all PDAs with "neither confirm nor deny"; North West Fire Control
(NWFC) redirected a 2025 request to GMFRS, whose parent GMCA then refused it as
exempt; a further 2025 request for fire-in-the-open PDAs was refused (S23).
Lancashire (S27), London (S31, S33) and West Midlands (S40) refuse on the same
national-security ground. What *is* sourced for GMFRS is: the high-rise PDA as
it stood in June 2017 (S5), the fact that high-rise attendance was increased
again after the 2019 Fire Cover Review (S6), the construction rules for GMFRS
PDAs (S10), the AFA attendance policy (S17, S18), the Major Incident PDA (S22),
the explosion / bomb / Operation Plato action plans (S9, S11), and the response
standards (S12–S15). Everything else in the tables is either a comparable
service or the sim's own modelled choice, and is tagged as such.

The single most useful comparable is **Cumbria's PDA list as held on the NWFC
mobilising system** (S26) — it leaked via an FOI to NWFC in October 2025 and is
still online. Cumbria, Lancashire, Cheshire and Greater Manchester are all
mobilised by the same control room from the same incident-type list, so the
*shape* of that list (incident type → sub-type → attendance, "NEAREST SM",
"PUMPS (ANY)", "Inform Duty ILO") is almost certainly the shape of the GMFRS
Response Matrix (S10). The *numbers* are Cumbria's, a rural county with a very
different risk profile, and must not be read as GMFRS numbers.

---

## 1. What a PDA is, and how GMFRS is mobilised

### 1.1 Definition

- A PDA is "the number and types of appliances that has been pre-determined to
  be an appropriate response to the type of incident" (Humberside mobilising
  policy, S37). London's phrasing: PDAs "are the determined minimum level of
  response that the Brigade mobilises to certain incident types … The PDA only
  sets out the minimum level of response, so more resources will be mobilised
  in some circumstances (for example if lots of calls are being received, or if
  there are reports of people involved)" (S32; same on S31).
- In GMFRS terms, from the Kerslake Review (S9, paras 3.143–3.145): "a
  Pre-Determined Attendance of, for example, 'two pumps' comprises the
  deployment of two fully equipped fire tenders and eight firefighters. One of
  the firefighters on each 'pump' will hold a more senior rank of which the
  most senior of them will automatically become the Incident Commander."
  Further resources are ordered after the first officer's dynamic risk
  assessment.
- National guidance (NFCC / UKFRS, S42, paraphrase via search index — the pages
  now redirect): mobilising systems display predetermined attendances from an
  address-based gazetteer and an incident type list, and the nearest resource
  via AVLS; "an assessment of the incident dictates the nature of response
  deployed … either at the time of call (by reference to predetermined
  attendances) or through specific requests made from the fireground";
  dynamic mobilising, through audit and review, is used to develop PDAs.

### 1.2 How the GMFRS PDAs are built (S10, GMFRS Programme for Change OBC, March 2019)

> "The mobilising principles which are adopted in North West Fire Control
> (NWFC) are based on the number of fire engines required to be sent to the
> scene of a specific incident type. This is known as pre-determined attendance
> (PDA), and will select the fire engines that will be the quickest to respond,
> regardless of the associated crewing levels … The PDAs in the Incident Type
> List and GMFRS Response Matrix are formed using the above factors [task
> analysis, crewing levels, incident type, equipment and risk] … PDAs are not
> adjusted to the current crewing model of 5 persons on the first fire engine
> and 4 persons on the second fire engine … all our PDAs have been created by
> using a minimum crewing level of four persons …"

So: the matrix is called the **Incident Type List and GMFRS Response Matrix**;
every PDA assumes **four riders per pump**; NWFC picks the **quickest** engines
regardless of whether they carry 4 or 5.

### 1.3 How NWFC mobilises

| Rule | Detail | Scope | Src |
|---|---|---|---|
| Nearest appliance, ignoring county boundaries | "North West Fire Control now mobilises the nearest fire appliance to an incident across the four counties" (Cumbria, Lancashire, GM, Cheshire) — since May 2014 | [GMFRS] | S12 |
| Cross-border for speed | "Cross-border mobilisations are used to achieve the fastest speed of response" | [GMFRS] | S16 |
| AVLS road-speed selection | NWFC mobilises "the nearest resources rather than relying on arbitrary station boundaries" (Lancashire's description of the shared system) | [LFRS] | S28 |
| Incident type + priority + PDA + action plan | CAD operator allocates an incident type and a priority ("1" = most serious); "certain locations and types of incident would have a pre-determined attendance that sets the level of resources sent"; GMFRS-authored action plans must be followed without discretion | [GMFRS] | S11 |
| Pre-alert on every 999 call | GPS-based automatic pre-alert tone to the nearest station/appliance on receipt of a 999 call; expires after five minutes if no full activation | [GMFRS] | S9 |
| Command structure mobilised at once | "In an ordinary incident (e.g. a house fire; a major fire), North West Fire Control would immediately mobilise a Pre-Determined Attendance of a 'command structure' of pumps and crews and an Incident Commander"; first information from the IC after 5 min 41 s on average | [GMFRS] | S9 |
| Dispatch performance | 80-second average dispatch time; 5.7-second average call answer (Apr–Sep 2023); new Frequentis mobilising system contracted 20 Jan 2025 | [GMFRS] | S25 |
| Modelling uses PDA per incident type | IRMP modelling parameters include "the pre-determined attendance for each incident type" and mobilise "the closest available resources" | [GMFRS] | S12 |

### 1.4 Response standards (first fire engine)

| Standard | Value | Scope | Src |
|---|---|---|---|
| Life-risk incidents (house fires, RTCs), current | Within 10 minutes of call receipt at NWFC on 80% of occasions; target 7 min 30 s; actual 84% and 7 min 35 s (Apr–Sep 2023) | [GMFRS] | S13 |
| Definition | Measured for the *first* fire engine, from call handling through turnout and travel; target 7 min 30 s | [GMFRS] | S14 |
| Actuals 2022/23 | Dwelling primary fires 6 min 39 s; life-risk 7 min 21 s (May 2023); 41 stations, 50 fire engines, 99.6% availability | [GMFRS] | S15 |
| Risk-category standards 2016–2020 | RC1 <5 min; RC2 <7; RC3 <12; RC4 <17 (from receipt by the crew to arrival) | [GMFRS] | S12 |
| Lancashire (same control room) | Critical fire 6/8/10/12 min by very-high/high/medium/low risk area; critical special service (RTC, rescue, hazmat) 13 min | [LFRS] | S28 |
| London | First and second engine 6 and 8 minutes London-wide average | [LFB] | S30 |

### 1.5 Fleet, specials and resilience (what the PDAs draw on)

| Fact | Scope | Src |
|---|---|---|
| 50 fire engines (2022/23); 51st at Manchester Central Dec 2024; 52nd at Moss Side 19 Sep 2025 | [GMFRS] | S15, S21 |
| Normally 54 fire engines available (2018/19) | [GMFRS] | S16 |
| Resilience planning assumption: two simultaneous 10-fire-engine incidents (one hazmat) or one 25-fire-engine incident | [GMFRS] | S16 |
| Aerial fleet of seven; 20-minute special-appliance attendance standard for cage-rescue capability across GM and to all high-rise buildings; TL moved Stretford → Oldham; HRETs at Whitefield and Wigan added to Salford's (HRETs have no cage rescue) | [GMFRS] | S19 (page since removed; wording from search snippets), corroborated S20 |
| 2023 Fire Cover Review outcomes: +1 wholetime pump at Manchester Central; Enhanced Rescue Stations at Leigh and Ashton; all special-appliance proposals (replace three HPVs with HRETs, enhance Water Incident Units) | [GMFRS] | S20 |
| Special appliances "will not normally be mobilised as part of an initial PDA but will be mobilised on request from the Incident Commander" | [HUMBERSIDE] | S37 |
| Officer thresholds: senior rider is IC up to 4 pumps; Station Commander mobilised to take charge at 5–6 pumps; higher ranks beyond (exact table redacted) | [LFB] | S30 |
| Officer on NWFC-format PDAs is the nearest **Station Manager** ("NEAREST SM"), on persons-reported fires, RTC persons trapped, hazmat large, water rescue, high-rise, forest fire, cylinders | [NWFC-CUM] | S26 |
| GMFRS 2017 high-rise PDA likewise: "four pumping appliances plus the nearest Station Manager" | [GMFRS] | S5 |

### 1.6 Tag key

| Tag | Meaning |
|---|---|
| `[GMFRS]` | GMFRS-specific and sourced (GMFRS, GMCA, NWFC, HMICFRS inspecting GMFRS, Kerslake, Arena Inquiry) |
| `[NWFC-CUM]` | Cumbria FRS's PDA as held on the NWFC system (same control room as GMFRS) — sourced, **not** GMFRS |
| `[LFB]` `[LFRS]` `[WMFS]` `[ESSEX]` `[NORTHANTS]` `[HUMBERSIDE]` | Named comparable service, sourced |
| `[NOG]` | National guidance: NFCC/UKFRS National Operational Guidance, NHS England Ambulance Response Programme, College of Policing APP / Code of Practice, FBU survey |
| `[MODELLED]` | The sim's inference. Never a GMFRS fact. The "Why" line says what it leans on |

Each table below has one row per **slot × scope**, so a slot can appear several
times (a GMFRS row, a comparable row, a modelled row). "Sim currently authors"
is what the scenario file in `scenarios/` says today; "Sim's modelled choice"
is what this document recommends `STANDARD_PDA` should carry, with the reason.

---

## 2. Automatic fire alarm — commercial / non-sleeping premises

Scenario 01 (Trafford Centre, retail). `IncidentTypeCode: automatic_fire_alarm`.

| Slot | What is sent | Scope | Src |
|---|---|---|---|
| Whole attendance, 08:00–19:00 | **No attendance** to an AFA at premises with no sleeping accommodation "unless the caller reasonably believes a fire to have broken out"; "the fire service will always respond to calls reporting a fire"; the ARC must hold premises type and sleeping status; attendance at closed premises limited to 20 minutes (from 1 Aug 2020) | [GMFRS] | S17 |
| Whole attendance, 08:00–19:00 | Same policy as reported at launch (2019): no attendance to non-residential AFAs in working hours unless the caller or ARC confirms a fire; exemptions include high-rise buildings and hospitals; ~14,000 false alarms in 2017/18 | [GMFRS] | S18 |
| Scale | AFAs were 30% of all emergency calls (14,950 of 49,671, YE Mar 2023); the policy cut those incidents 25% and mobilisations 40% | [GMFRS] | S15 |
| Pump 1, outside 08:00–19:00 | Attended — **number of pumps not published** | [GMFRS] | S17 (silence) |
| Pump 1 | 1 PUMP (commercial AFA / "unable to check"); a 1-pump PDA may be met by a Rapid Response Vehicle or Small Incident Unit | [NWFC-CUM] | S26 |
| Pump 1 | "Calls to commercial premises generated by automatic fire alarms (AFAs) will receive a normal attendance of one pumping appliance"; call filtering 06:00–21:00 (2016 policy) | [LFB] | S34 |
| Whole attendance, 07:00–20:30 | No attendance unless a caller confirms a fire; all AFAs attended 20:30–07:00 (current policy, effective 29 Oct 2024) | [LFB] | S35 |
| Whole attendance | Non-sleeping premises are not mobilised to on an AFA; a 999 call confirming fire "will attract a full response in all instances" | [ESSEX] | S39 |
| Principle | WMFS "operates call challenging and dynamic risk assessments so the proposed attendance can be moved up or down dependent upon the intelligence about the incident"; full PDAs for specific-attendance locations refused under s.24 | [WMFS] | S40 |
| Pump 2+ | Not on the AFA PDA anywhere sourced; a confirmed fire re-types the call to a building fire (Cumbria: commercial/industrial building fire = 2 PUMPS) | [NWFC-CUM] | S26 |
| Aerial | Not on the AFA PDA; specials on IC request | [NWFC-CUM] [HUMBERSIDE] | S26, S37 |
| Officer | None on a 1-pump AFA | [NWFC-CUM] | S26 |
| Ambulance | None — ambulance ordered on initial mobilisation only when persons are believed involved | [LFB] | S34 |
| Police | None — police only on IC request; informed when an ambulance is ordered for a member of the public | [LFB] | S34 |
| Pump 1 | 1 × WrL, BA-capable | [MODELLED] | — |
| Call challenge | A trading-hours AFA at a retail mall is, under S17, a **no-attendance** call unless security/ARC report signs of fire | [MODELLED] | — |

**Sim currently authors:** Pump 1 only (WrL, ≥4 BA crew).

**Sim's modelled choice:** 1 pump, no officer, no aerial, no ambulance, no
police. **Why:** every sourced comparable (Cumbria via the same control room,
London) is one pumping appliance, and GMFRS's own policy is a step *below* that
in daytime. The Trafford Centre scenario as written ("zone activation on the
mall fire panel", 60% during trading hours) would in reality be call-challenged
and not attended — the realistic trigger is the ARC or mall security reporting
a smell of smoke / smoke seen, which turns it into a fire call and keeps the
1-pump attendance honest. Flagged for the scenario author in §16.

---

## 3. Automatic fire alarm — healthcare / sleeping-risk premises

Scenario 10 (Royal Bolton Hospital). `IncidentTypeCode: healthcare_premises_fire_alarm`.

| Slot | What is sent | Scope | Src |
|---|---|---|---|
| Whole attendance | Hospitals and high-rise buildings are **exempt** from the daytime non-attendance policy — an AFA at a hospital is attended at any hour | [GMFRS] | S18 (also implied by S17's "no sleeping accommodation" test) |
| Pump 1 | Attended — **number of pumps not published** | [GMFRS] | S17 (silence) |
| Pump 1 | 1 PUMP for residential AFAs (sheltered housing; "unable to check"; sprinkler) | [NWFC-CUM] | S26 |
| Building fire, residential care | 3 PUMPS (ANY), NEAREST SM — the *confirmed-fire* attendance at a sleeping-risk care premises (no hospital row among the quoted rows) | [NWFC-CUM] | S26 |
| Pump 1 | 2016: hospitals classed "Commercial" for AFA purposes → one pumping appliance; care homes, HMOs, purpose-built flats, hostels, hospices classed Non-Commercial → "the normal attendance for the incident type" | [LFB] | S34 |
| Whole attendance | Current: hospitals, residential care/nursing homes, hospices, children's homes, sheltered/extra-care housing, student halls, hotels, hostels, prisons, schools, nurseries, flats and HMOs are **always attended** for an AFA | [LFB] | S35 |
| Whole attendance | "Premises presenting a risk to life in connection with the provision of sleeping accommodation, schools and premises that have an intrinsically high fire risk … will receive a full and immediate pre-determined attendance (PDA) appropriate to the risk" on the AFA alone, without a separate 999 confirmation | [ESSEX] | S39 |
| Officer | None on the AFA; nearest SM appears only on the confirmed-fire rows | [NWFC-CUM] | S26 |
| Aerial | Not on the AFA PDA | [NWFC-CUM] [HUMBERSIDE] | S26, S37 |
| Ambulance | None on the alarm; hospital has NWAS liaison on site anyway | [LFB] | S34 |
| Police | None | [LFB] | S34 |
| Pump 1 | 1 × WrL | [MODELLED] | — |
| Pump 2 | 1 × WrL — sleeping-risk uplift | [MODELLED] | — |
| Pumps 3+, aerial, officer | On confirmation only: 3 pumps + nearest SM (Cumbria residential-care shape), aerial on request | [MODELLED] | — |

**Sim currently authors:** Pump 1, Pump 2 (both G53 Farnworth), Pump 3 (G50),
HLP (G50), FDO (Group Manager "from start"), trust fire team.

**Sim's modelled choice:** 2 pumps to the alarm; 3 pumps + nearest SM (+ aerial
on request) once smoke or fire is confirmed. **Why:** no sourced service sends
more than one pump to a hospital *alarm*; the sim adds a second because a
700-bed hospital is the one premises where a two-minute head start on a real
fire matters most (staged horizontal evacuation needs hands) — that uplift is
an authored choice, not a sourced one. The scenario's three pumps, aerial and
Group Manager are heavier than anything sourced for an alarm and should move to
the "working fire confirmed" escalation, where the scenario already says "make
pumps 4".

---

## 4. Dwelling fire, persons reported

Scenario 02 (Wythenshawe semi, 02:34). `IncidentTypeCode: dwelling_fire_persons_reported`.

| Slot | What is sent | Scope | Src |
|---|---|---|---|
| Crewing basis | A "two pumps" PDA = two fully equipped tenders and eight firefighters; senior rider is IC (Kerslake's illustration, not stated as the dwelling PDA) | [GMFRS] | S9 |
| Crewing basis | All PDAs built on a minimum crew of four; current model 5 on the first engine, 4 on the second | [GMFRS] | S10 |
| Command | A "command structure" of pumps, crews and an IC is mobilised immediately to a house fire | [GMFRS] | S9 |
| Response time | Dwelling primary fires reached in 6 min 39 s on average (YE Mar 2023); life-risk target 7 min 30 s | [GMFRS] | S15, S14 |
| Pumps 1–3 + officer | PERSONS REPORTED FIRE: **3 PUMPS (ANY), NEAREST SM** | [NWFC-CUM] | S26 |
| Pumps 1–2 | BUILDING FIRE, DOMESTIC (no persons reported): 2 PUMPS | [NWFC-CUM] | S26 |
| Pumps 1–2 | Single private dwelling: pump ladder + pump = 9 firefighters (5 + 4); first/second engine 6 and 8 min | [LFB] | S30 |
| Uplift | More sent "if there are reports of people involved" | [LFB] | S32 |
| Officer | Senior rider commands up to 4 pumps; Station Commander mobilised at 5–6 | [LFB] | S30 |
| Crewing | Minimum PDA "can vary once further information received. Crewing on each appliance may vary between 4 and 5" (FBU tower-block survey note) | [NOG] | S41 |
| Ambulance | "An ambulance will only be requested to attend an incident on the initial mobilisation when it is believed that persons are involved. An ambulance will also be ordered when the request comes from an incident as a 'persons reported message'" | [LFB] | S34 |
| Police | Not mobilised automatically — "only … following a request from the IC"; police are *informed* of persons-reported fires (line partly redacted) and of any incident where an ambulance is ordered for a member of the public | [LFB] | S34 |
| Pump 1 | 1 × WrL, BA | [MODELLED] | — |
| Pump 2 | 1 × WrL, BA | [MODELLED] | — |
| Pump 3 | 1 × WrL, BA | [MODELLED] | — |
| Officer | Nearest Station Manager (sim's "FDO" slot, SM-level) | [MODELLED] | — |
| Aerial | **Off** the PDA — on request | [MODELLED] | — |
| Ambulance | 1 × DCA mobilised with the PDA | [MODELLED] | — |
| Police | **Informed**, not mobilised (sim may still show a unit self-attending) | [MODELLED] | — |

**Sim currently authors:** Pump 1, Pump 2, Aerial (HLP/TL "precaution"), FDO
(Group Manager), Ambulance (NWAS auto), Police (GMP auto).

**Sim's modelled choice:** 3 pumps + nearest SM + 1 ambulance; aerial and
police off the PDA. **Why:** the only NWFC-format persons-reported row we have
(S26) is 3 pumps + SM, and GMFRS's 2017 practice of putting "the nearest
Station Manager" on a life-risk PDA (S5) matches it; London sends 2 pumps to a
plain dwelling fire and adds for persons reported (S30, S32), so 3 is
consistent across services. Ambulance-with-persons-reported is London's written
rule (S34) and the sim adopts it for NWAS as the nearest sourced analogue — the
GM rule was not found. Police auto-mobilisation is *contradicted* by the only
sourced policy (S34), so the sim should downgrade GMP to "informed". The
Group-Manager-on-every-fire pattern in the scenarios is heavier than any
sourced PDA; GMs appear on make-ups, not initial attendances.

---

## 5. High-rise dwelling fire

Scenario 07 (Salford Quays, 22 storeys, flat fire, resident trapped). `IncidentTypeCode: high_rise_dwelling_fire`.

| Slot | What is sent | Scope | Src |
|---|---|---|---|
| Pumps 1–4 + officer (as at 14 Jun 2017) | "Four pumping appliances plus the nearest Station Manager for all High Rise fires" | [GMFRS] | S5 |
| Pump 5 (persons trapped) | "Where persons are reported trapped, we send five pumping appliances" | [GMFRS] | S5 |
| Aerial + support pump (from 23 Jun 2017) | "Our PDA did not include an aerial appliance. However … as of 23rd June our PDA for high rise now includes sending the nearest aerial appliance (with support pump)" | [GMFRS] | S5 |
| Uplift after 2019 | The 2019 Fire Cover Review "has resulted in an increased attendance to high-rise incidents" — new number not published | [GMFRS] | S6 |
| Aerial standard | 20-minute special-appliance attendance standard to all high-rise buildings; seven aerials; TL to Oldham to meet it | [GMFRS] | S19, S20 |
| Make-up indicator | GMFRS "10-pump" high-rise exercise mobilised a Turntable Ladder, Command Support Unit, Breathing Apparatus Unit and AIR Unit (5th/6th-floor flat fire) | [GMFRS] | S7 |
| Actual attendance | Manchester high-rise fire: "Six fire engines from Broughton, Gorton, Philips Park and Salford … plus an aerial ladder platform from Manchester Central" | [GMFRS] | S8 (undated page) |
| Failed-fire-safety building | Beyond the normal fire PDA, the HIRE / Immediate Building Evacuation (IBE) plan adds "extra fire engines, an extra command team dedicated to evacuation, and a specialist officer to advise on the building's fire safety features"; The Cube (Nov 2019) needed 18 engines from four other FRSs for cover | [GMFRS] | S14 |
| Pumps 1–5 + aerial | "Five fire engines and an aerial appliance are automatically sent. Where multiple calls and a cladding fire has been reported, this increases to 10 fire engines and an aerial appliance" (post-Grenfell) | [LFB] | S29 |
| Pumps 1–3 + officer | BUILDING FIRE, HIGHRISE: 3 PUMPS (ANY), NEAREST SM | [NWFC-CUM] | S26 |
| Full PDA (2019) | 5 pumps; 1 Aerial Rescue Pump; 1 Cobra Intervention Vehicle; 1 Joint Command Unit + command-support pump; Group Commander as IC; 2 further officers (2012: 4 pumps + aerial + officer, 5 if fire confirmed; 2009: 3 pumps, 4 if persons reported, + aerial + officer) | [NORTHANTS] | S36 |
| Pumps + officers | AFA at high-rise: 4 pumps + Level 2 IC; fire: 6 pumps + Level 2 IC + 2 Level 2 Command Support Officers + Incident Command Unit; aerial only on IC request; unchanged 2010–2019 | [ESSEX] | S38 |
| Survey | FBU table of 1st–8th pump and aerial per UK service as at 14 Jul 2017 (Greater Manchester row present but rendered as graphics — not machine-readable) | [NOG] | S41 |
| Pumps 1–5 | 5 × WrL/WrT, BA | [MODELLED] | — |
| Aerial | 1 × TL/HLP (nearest, per the 20-min standard) | [MODELLED] | — |
| Support pump | 1 × WrL with the aerial | [MODELLED] | — |
| Officer | Nearest Station Manager | [MODELLED] | — |
| Command / BA support | CSU / BASU on make-up, not on the initial PDA | [MODELLED] | — |
| Ambulance | 1 × DCA (persons reported) | [MODELLED] | — |
| Police | Informed | [MODELLED] | — |

**Sim currently authors:** Pump 1, Pump 2, Pump 3, ALP, FDO (Group Manager),
BASU; text says "make pumps 8 + 2 ALPs if persons reported confirmed".

**Sim's modelled choice:** 5 pumps + nearest aerial + support pump + nearest
SM, plus an ambulance. **Why:** this is GMFRS's own PDA as at 23 June 2017 for
a persons-reported high-rise fire (S5), and the only later GMFRS statement says
the attendance has since been *increased* (S6), so five is a floor, not a
guess. It also matches London's post-Grenfell default (S29). The scenario's
three pumps are too few for a persons-reported high-rise in any sourced service
except rural Cumbria; its BASU is not on any sourced initial PDA (London,
Northants and GMFRS's own exercise put BA/command units on the make-up).

---

## 6. RTC, persons trapped

Scenario 03 (M61 northbound, HGV vs two cars, entrapment). `IncidentTypeCode: rtc_entrapment`.

| Slot | What is sent | Scope | Src |
|---|---|---|---|
| Response standard | RTCs are "life risk incidents" under the 10-minute / 80% standard (target 7 min 30 s) | [GMFRS] | S13 |
| Rescue capability | Enhanced Rescue Stations at Leigh and Ashton (2023 Fire Cover Review) | [GMFRS] | S20 |
| Pumps + officer | RTC PERSONS TRAPPED (SMALL VEHICLES): 2 PUMPS (ANY) + NEAREST SM | [NWFC-CUM] | S26 |
| Rescue unit + pumps + officer | RTC PERSONS TRAPPED (LARGE VEHICLES): ERU + support (or the rescue pump), 2 PUMPS (ANY), NEAREST SM | [NWFC-CUM] | S26 |
| Vehicle fire | RTC FIRE SMALL VEHICLE 1 PUMP; person trapped and on fire 2 PUMPS (ANY) + NEAREST SM | [NWFC-CUM] | S26 |
| Response standard | Critical special service (RTC, rescue, hazmat) 13 minutes | [LFRS] | S28 |
| Specials | Not normally on the initial PDA; on IC request | [HUMBERSIDE] | S37 |
| Ambulance | Ordered on initial mobilisation when persons believed involved | [LFB] | S34 |
| Police | On IC request; informed when an ambulance is ordered for a member of the public (fire-service side only — on a motorway RTC the police are a 999 recipient in their own right) | [LFB] | S34 |
| Rescue pump | 1 × TRU pump (heavy extrication) — "large vehicles" shape because an HGV is involved | [MODELLED] | — |
| Pump 1 | 1 × WrL | [MODELLED] | — |
| Pump 2 | 1 × WrL | [MODELLED] | — |
| Officer | Nearest Station Manager | [MODELLED] | — |
| Aerial | **Off** the PDA | [MODELLED] | — |
| Ambulance | 1 × DCA + HART (entrapment, HGV) | [MODELLED] | — |
| Police / Highways | GMP traffic unit + National Highways — attend on their own 999 call, not on a fire PDA | [MODELLED] | — |

**Sim currently authors:** Rescue Pump (TRU), Pump 1, Pump 2, Aerial
precaution (HLP), FDO (Group Manager), multi-agency (NWAS HART, GMP, Highways)
"auto-mobilised".

**Sim's modelled choice:** TRU pump + 2 pumps + nearest SM; ambulance yes;
aerial off; police and Highways present but *not* as fire-PDA slots. **Why:**
the NWFC-format large-vehicle row (S26) is exactly rescue unit + 2 pumps + SM,
and GMFRS has just created Enhanced Rescue Stations to carry that capability
(S20). No sourced service puts an aerial on an RTC PDA — the scenario's
"fuel-spill ignition cover" aerial is an authored flourish and should be a
request. Ambulance attendance follows London's persons-involved rule (S34);
HART for an HGV entrapment is the sim's call.

---

## 7. Industrial / commercial fire

Scenario 04 (plastics warehouse, Trafford Park). `IncidentTypeCode: industrial_fire`.

| Slot | What is sent | Scope | Src |
|---|---|---|---|
| Planning scale | IRMP resilience scenarios: two simultaneous 10-engine incidents or one 25-engine incident | [GMFRS] | S16 |
| Site-specific PDAs exist | "Certain locations … would have a pre-determined attendance that sets the level of resources sent" | [GMFRS] | S11 |
| Pumps 1–2 | BUILDING FIRE, COMMERCIAL/INDUSTRIAL: 2 PUMPS; FIRE OTHER (default): 2 PUMPS | [NWFC-CUM] | S26 |
| Cylinders | CYLINDER / ACETYLENE: 2 PUMPS + NEAREST SM | [NWFC-CUM] | S26 |
| Site-specific uplift | "Special attendances" for known-risk locations; PDA is a minimum, raised for multiple calls | [LFB] | S31, S32 |
| Specials | HVP, foam, etc. on IC request, not on the initial PDA | [HUMBERSIDE] | S37 |
| Ambulance | Only when persons believed involved | [LFB] | S34 |
| Police | On IC request; informed if an ambulance is ordered | [LFB] | S34 |
| Pump 1 | 1 × WrL | [MODELLED] | — |
| Pump 2 | 1 × WrL | [MODELLED] | — |
| Pump 3 | 1 × WrL — generic "large industrial premises with PRI" special attendance | [MODELLED] | — |
| Officer | Nearest Station Manager (acetylene on site) | [MODELLED] | — |
| Aerial / HVP / BFU | On confirmation or IC request, not on the PDA | [MODELLED] | — |
| Ambulance | 1 × DCA (two staff unaccounted for = persons involved) | [MODELLED] | — |
| Police | Informed | [MODELLED] | — |

**Sim currently authors:** Pump 1, Pump 2, ALP (TL), HVP pod, BFU, FDO (Group
Manager), "make pumps 6 likely".

**Sim's modelled choice:** 3 pumps + nearest SM + ambulance as the
premises-level special attendance; aerial, HVP and foam as the first make-up.
**Why:** the generic NWFC-format commercial/industrial row is 2 pumps (S26) and
GMFRS holds site-specific PDAs (S11, S31) — a PRI'd bulk-plastics unit with
acetylene would plausibly carry a third pump and an officer (Cumbria's own
acetylene row adds the SM), but the sim cannot source that figure. Putting an
aerial, an HVP and a BFU on the *initial* attendance contradicts the one
sourced statement on specials (S37); keep them one click away as the
escalation the scenario already describes.

---

## 8. Chemical / hazmat release

Scenario 06 (rail freight tank wagon, Hazchem 3YE, Stockport). `IncidentTypeCode: hazmat_chemical_leak`.

| Slot | What is sent | Scope | Src |
|---|---|---|---|
| Planning scale | One of the two planned simultaneous 10-engine incidents is a hazmat incident | [GMFRS] | S16 |
| Explosion plan (analogue) | "EXPLOSION" action plan: Technical Response Unit, a number of fire appliances, a Station Manager and the duty NILO direct to scene (2017 wording) | [GMFRS] | S11 |
| Pumps, small scale | HAZMAT SMALL SCALE: 1 PUMP with detection kit (RDEGD) + 2 PUMPS | [NWFC-CUM] | S26 |
| Pumps + EPU + officer, large scale | HAZMAT LARGE SCALE: 1 PUMP with detection kit, Environmental Protection Unit + support, 1 PUMP, SM | [NWFC-CUM] | S26 |
| Radiation | 1 PUMP with RADOS, 1 PUMP, nearest SM | [NWFC-CUM] | S26 |
| Gas leak | Confirmed, persons involved: 3 PUMPS (ANY); ignited: 2 PUMPS | [NWFC-CUM] | S26 |
| CBRNE / body recovery | "Inform Duty ILO" pattern for specialist-advice incident types | [NWFC-CUM] | S26 |
| Response standard | Critical special service incl. hazmat 13 min | [LFRS] | S28 |
| Ambulance | Only when persons believed involved (two exposed staff = yes) | [LFB] | S34 |
| Police | On IC request; informed if ambulance ordered | [LFB] | S34 |
| Pump 1 | 1 × WrL (detection-equipped) | [MODELLED] | — |
| Pump 2 | 1 × WrL | [MODELLED] | — |
| Pump 3 | 1 × WrL (persons involved uplift, gas-leak shape) | [MODELLED] | — |
| EPU | PM + Environmental Protection pod (+ support) | [MODELLED] | — |
| DIM | Detection, Identification & Monitoring unit — GMFRS carries one (station data S1/S2); Cumbria substitutes a pump-borne kit | [MODELLED] | — |
| Officer | Nearest Station Manager; duty NILO / hazmat adviser informed | [MODELLED] | — |
| Ambulance | 1 × DCA + HART (decontamination) | [MODELLED] | — |
| Police | Informed; attends for cordon on request | [MODELLED] | — |

**Sim currently authors:** Pump 1, DIM, EPU pod, Hazmat adviser (NILO), Pump 2,
FDO (Group Manager).

**Sim's modelled choice:** 3 pumps (one detection-equipped) + EPU + DIM +
nearest SM, NILO informed; ambulance + HART. **Why:** the NWFC large-scale
hazmat row (S26) is 2 pumps + EPU + SM; the sim adds a third pump because two
casualties are exposed (Cumbria's own "confirmed persons involved" gas-leak row
goes to 3). The DIM vehicle is a GMFRS-specific asset that Cumbria does not
have in this form; sending it on the PDA rather than on request is the sim's
choice, defensible because a chemical release *is* the DIM's trigger, but
unsourced.

---

## 9. Wildfire / moorland

Scenario 05 (Saddleworth Moor, summer). `IncidentTypeCode: wildfire_moorland`.

| Slot | What is sent | Scope | Src |
|---|---|---|---|
| Fire-in-the-open PDA | Requested under FOI in 2025 — **refused** | [GMFRS] | S23 |
| Pump 1 | SMALL FIRE — MOORLAND/WILDFIRE: 1 PUMP (grass, rubbish, bonfire likewise) | [NWFC-CUM] | S26 |
| Pumps + officer | FOREST FIRE: 2 PUMPS + NEAREST SM | [NWFC-CUM] | S26 |
| Specials | Wildfire units etc. on IC request | [HUMBERSIDE] | S37 |
| Ambulance / police | None on the fire PDA (no persons involved) | [LFB] | S34 |
| Pump 1 | 1 × WrL | [MODELLED] | — |
| WFU 1 | 1 × Wildfire Unit — GMFRS stations moorland-fringe WFUs (S1/S2 station data) | [MODELLED] | — |
| Pump 2 + officer | On confirmation of a running moorland fire: second pump + nearest SM (forest-fire shape) | [MODELLED] | — |
| WFU 2–3, DIM, mutual aid | Make-up | [MODELLED] | — |

**Sim currently authors:** WFU 1, Pump 1, WFU 2, WFU 3, FDO (Group Manager
"from start"), DIM, NWFC mutual-aid coordination.

**Sim's modelled choice:** 1 pump + 1 WFU to the call; second pump + SM +
further WFUs on confirmation. **Why:** the only sourced fire-in-the-open PDAs
(S26) are one pump for a moorland fire and two + SM for a forest fire, and
GMFRS refused to disclose its own (S23). The scenario's four-unit,
GM-from-start attendance is really its confirmed-fire make-up; putting a WFU on
the initial attendance is the sim's one uplift, justified by GMFRS's decision to
base WFUs on the moorland fringe (S1/S2) rather than by any published PDA.

---

## 10. School / education premises fire

Scenario 08 (secondary school, Bury, evening). `IncidentTypeCode: education_premises_fire`.

| Slot | What is sent | Scope | Src |
|---|---|---|---|
| Pumps 1–2 | Confirmed fire: BUILDING FIRE COMMERCIAL/INDUSTRIAL 2 PUMPS; FIRE OTHER default 2 PUMPS (no school row among the quoted rows) | [NWFC-CUM] | S26 |
| AFA at a school | Schools classed "Commercial" for AFA purposes in 2016 (1 pumping appliance) | [LFB] | S34 |
| AFA at a school | Schools and nurseries **always attended** for an AFA under the current policy | [LFB] | S35 |
| AFA at a school | Schools receive "a full and immediate pre-determined attendance" on the AFA alone | [ESSEX] | S39 |
| Officer | Senior rider up to 4 pumps | [LFB] | S30 |
| Aerial | On IC request | [HUMBERSIDE] | S37 |
| Ambulance | Only if persons believed involved (25 swimmers evacuating = precautionary request from the IC, not a PDA slot) | [LFB] | S34 |
| Police | On IC request; parents/traffic is an IC request | [LFB] | S34 |
| Pump 1 | 1 × WrL | [MODELLED] | — |
| Pump 2 | 1 × WrL | [MODELLED] | — |
| Officer | None on the PDA; SM on "make pumps 4" | [MODELLED] | — |
| Aerial | Off the PDA | [MODELLED] | — |

**Sim currently authors:** Pump 1, Pump 2, ALP (HLP from Bolton), FDO (Group
Manager), "make pumps 4 if working fire confirmed".

**Sim's modelled choice:** 2 pumps; nothing else until confirmation. **Why:** a
confirmed fire in a non-sleeping commercial-type building is 2 pumps in the
only NWFC-format list we have (S26) and 2 in London (S30). The sourced
material on schools is all about *AFA* policy (schools are exempt from
non-attendance in London and Essex, S35, S39 — GMFRS's exemption list, S18,
names only high-rise and hospitals in the article we have). The scenario's
aerial and Group Manager are unsourced and heavier than any comparable.

---

## 11. Water rescue

Scenario 09 (person in the Irwell, Salford Quays). `IncidentTypeCode: special_service_water_rescue`.

| Slot | What is sent | Scope | Src |
|---|---|---|---|
| Capability | Water Incident Units' capabilities enhanced under the 2023 Fire Cover Review | [GMFRS] | S20 |
| Pumps + officer | RESCUE OF PERSON IN WATER: 1 PUMP with water rescue team, 1 PUMP with water-rescue capability, 1 PUMP, SM (same for FLOODING — LIFE RISK) | [NWFC-CUM] | S26 |
| Threatening to jump | Pump with water rescue team, 1 pump, SM | [NWFC-CUM] | S26 |
| Body recovery in water | "Inform Duty ILO" — no immediate attendance | [NWFC-CUM] | S26 |
| Response standard | Critical special service 13 min | [LFRS] | S28 |
| Ambulance | Persons involved → ambulance on the initial mobilisation | [LFB] | S34 |
| Police | On IC request; informed when ambulance ordered | [LFB] | S34 |
| WIU | 1 × Water Incident Unit (boat + team) | [MODELLED] | — |
| Pump 1 | 1 × WrL (water-rescue-capable station) | [MODELLED] | — |
| Pump 2 | 1 × WrL | [MODELLED] | — |
| Officer | Nearest Station Manager | [MODELLED] | — |
| TRU | Off the PDA — request if rope/bank access needed | [MODELLED] | — |
| Ambulance | 1 × DCA + HART (inland water is a HART capability) | [MODELLED] | — |
| Police | Attends in practice for a possible suicide attempt — own 999 call, not a fire slot | [MODELLED] | — |

**Sim currently authors:** WIU, Pump 1, Pump 2, Rescue team (TRU), FDO (Group
Manager).

**Sim's modelled choice:** WIU + 2 pumps + nearest SM; ambulance + HART. **Why:**
this is the NWFC-format row (S26) with GMFRS's own WIU standing in for
Cumbria's "pump with water rescue team". The TRU is not on any sourced water
PDA; the officer level again drops from GM to SM per S26/S5.

---

## 12. Firearms incident — police-led (not a fire PDA)

Scenario 11 (Curzon Road, Ashton-under-Lyne). `IncidentTypeCode: police_firearms_incident`.

There is no fire-service PDA for a domestic firearms incident: fire attends only
if asked (Cumbria's "ASSIST OTHER AGENCY — LIFE RISK: 1 PUMP", S26). The
nearest GMFRS material is its terrorism doctrine, which is about *holding*
fire resources until a NILO gives an RVP.

| Slot | What is sent | Scope | Src |
|---|---|---|---|
| Fire — bomb / suspect device (2017) | No immediate mobilisation: NWFC to inform the duty NILO and obtain an RVP; on the night, four pumps grouped at Philips Park | [GMFRS] | S9 |
| Fire — Operation Plato | "Standby" plan: contact the duty NILO before any mobilisation; "Implementation" plan: inform NILO and take advice | [GMFRS] | S11 |
| Fire — exploded device (post-Arena) | NWFC now mobilises firefighters and resources to the scene; the NILO-first requirement has been removed | [GMFRS] | S11 |
| Fire — major incident | Major Incident PDA mobilises a Station Manager to GMP's Force Operations Centre as GMFRS Liaison Officer | [GMFRS] | S22 |
| Fire — assist police, life risk | 1 PUMP; terrorist / suspected Plato: 6 pumps, 2 SM, 1 Joint Incident Command Unit | [NWFC-CUM] | S26 |
| Police — principle | "The police service in England and Wales has long been generally unarmed … where an operational need arises, authorised firearms officers should be available to be deployed" | [NOG] | S46 |
| Police — spontaneous incidents | Initial authority for AFO deployment from an accredited Strategic or Tactical Firearms Commander; "in spontaneous incidents it is the responsibility of the officer authorising the deployment of AFOs to ensure that an appropriate command structure is instigated as soon as practicable"; "the deployment of unarmed responders should be coordinated with that of AFOs, and subject to appropriate risk assessment" (paraphrase via search index — page returns 403 to fetchers) | [NOG] | S45 |
| Response 1–2 | 2 × response units — hold, contain, outer cordon | [MODELLED] | — |
| ARV 1–2 | 2 × Armed Response Vehicles — front and rear containment | [MODELLED] | — |
| Dog, NPAS | Rear-alley track, thermal overhead | [MODELLED] | — |
| Ambulance | 1 × DCA staged at the RVP until the scene is declared safe | [MODELLED] | — |
| Fire | None unless requested | [MODELLED] | — |

**Sim currently authors:** Response 1, Response 2, ARV 1, ARV 2, Dog unit,
NPAS 21, Ambulance staged at RVP.

**Sim's modelled choice:** as authored, all [MODELLED]. **Why:** GMP publishes
no per-incident ARV figure and the College of Policing APP deliberately sets
principles, not numbers. Two ARVs is the widely described spontaneous-incident
minimum but the sim could not source it; the ambulance-at-RVP staging is the
standard "hot/warm/cold zone" practice and equally unsourced here. Nothing in
this table is a GMFRS or GMP fact except the five fire-side rows.

---

## 13. Cardiac arrest — ambulance-led (not a fire PDA)

Scenario 12 (Hough End playing fields). `IncidentTypeCode: ambulance_cardiac_arrest`.

| Slot | What is sent | Scope | Src |
|---|---|---|---|
| Category 1 definition | "A time critical life-threatening event requiring immediate intervention or resuscitation"; examples given elsewhere in the same review "include Cardiac arrest, anaphylaxis …" | [NOG] | S43 |
| Category 1 standard | Mean 00:07:00; 90th centile 00:15:00 (national, since ARP phase 2) | [NOG] | S43 |
| Category 1 wording | "For calls to people with immediately life-threatening and time critical injuries and illnesses" — "seven minutes" average, "at least 9 out of 10 times before 15 minutes" | [NOG] | S44 |
| Transporting vehicle | ARP added a "Category 1 Transport" (C1T) indicator: mean and 90th-centile time for a *transporting* vehicle to reach a Category 1 patient — i.e. a fast first response plus a conveying ambulance is the expected shape | [NOG] | S43 |
| Fire co-responding | "GMFRS was the first fire and rescue service to mobilise all its firefighters to cardiac arrests in support of the ambulance service. The initiative was subsequently undertaken across the country. The Fire Brigade's Union had some…" (sentence truncated in the hunt's capture — current status unclear) | [GMFRS] | S14 |
| Fire co-responding, NWFC list | Incident type "NWAS — RED ONE CARDIAC ARREST" exists on the NWFC list; Cumbria's setting is **NO ATTENDANCE**; GMFRS's current setting unknown | [NWFC-CUM] | S26 |
| Fire — gaining entry for NWAS | NWAS — GAINING ENTRY: 1 PUMP | [NWFC-CUM] | S26 |
| No ambulance major-incident PDA (2017) | NWAS's Major Incident Response Plan had "no specific pre-determined attendance for a Major Incident" | [NOG] | S11 |
| RRV | 1 × Rapid Response Vehicle — first resource | [MODELLED] | — |
| DCA 1 | 1 × conveying ambulance (C1T shape) | [MODELLED] | — |
| DCA 2 | 1 × backup crew | [MODELLED] | — |
| CCC / HEMS | Critical care car; NWAA aircraft if tasking criteria met | [MODELLED] | — |
| Duty officer | Scene management | [MODELLED] | — |
| Fire co-responder | Not modelled — would be 1 × pump with AED if GMFRS still co-responds | [MODELLED] | — |

**Sim currently authors:** RRV, DCA 1, DCA 2, Critical care car, Helimed, Duty
officer.

**Sim's modelled choice:** as authored, all [MODELLED] beyond "fast first
response + conveying ambulance". **Why:** NHS England sets the Category 1
*time* standards and, through the C1T indicator, the two-vehicle shape (S43);
the number of additional crews, the critical-care tasking and the duty officer
are NWAS operational practice the sim could not source. The one GMFRS-specific
fact — that GMFRS crews were mobilised to cardiac arrests (S14) — is captured
truncated and its present status is unknown; the sim does not model a fire
co-responder until it is confirmed.

---

## 14. Cross-cutting: ambulance and police attendance to fire calls

| Question | Answer | Scope | Src |
|---|---|---|---|
| Does NWAS auto-attend a persons-reported fire in GM? | **Not found.** No NWFC/NWAS/GMFRS document located | [GMFRS] | (hunt negative) |
| Does GMP auto-attend fires in GM? | **Not found** | [GMFRS] | (hunt negative) |
| Nearest sourced rule — ambulance | Ambulance on the initial mobilisation only when persons believed involved; always on a "persons reported" message or for an injury | [LFB] | S34 |
| Nearest sourced rule — police | Police only on IC request; informed of major incidents, persons-reported fires (line partly redacted) and any incident where an ambulance is ordered for a member of the public | [LFB] | S34 |
| Major incident, fire → police | GMFRS SM to GMP Force Operations Centre (Major Incident PDA) | [GMFRS] | S22 |
| Major incident, fire control → police & ambulance | Fire control announces a major-incident declaration to police and ambulance on the relevant Airwave channel | [HUMBERSIDE] | S37 |
| Fire → ambulance/police requests | NWFC list carries fire attendances *to* NWAS/police requests (gaining entry 1 PUMP; assist other agency life risk 1 PUMP) — the reverse direction is not on the fire list | [NWFC-CUM] | S26 |
| Sim rule | Ambulance: 1 × DCA with the PDA whenever persons are reported / believed involved (dwelling PR, high-rise PR, RTC trapped, hazmat with casualties, water rescue). Police: **informed**, shown as self-attending only where the police are a 999 recipient in their own right (RTC, water rescue / suicide risk, firearms) | [MODELLED] | — |

**Why:** the sim adopts London's written 2016 rules (S34) as the nearest
sourced analogue for NWAS/GMP behaviour because nothing GM-specific was found.
Scenario 02's "GMP (auto-mobilised)" and 03's "auto-mobilised" multi-agency
line should be softened to "informed / own 999 call".

---

## 15. Escalation ("make-up") calibration points

Not PDAs, but the sourced sizes the sim's make-pumps ladders should land on.

| Incident | Size | Scope | Src |
|---|---|---|---|
| Manchester high-rise fire (actual) | 6 engines + ALP | [GMFRS] | S8 |
| GMFRS high-rise exercise | 10 pumps + TL + CSU + BA Unit + AIR Unit | [GMFRS] | S7 |
| The Cube, Bolton (Nov 2019) | HIRE plan: extra engines, evacuation command team, fire-safety officer; 18 engines from four other FRSs for county cover | [GMFRS] | S14 |
| Planning envelope | 2 × 10-pump (one hazmat) or 1 × 25-pump | [GMFRS] | S16 |
| Historic 8+-appliance incidents | Spreadsheet of every GMFRS incident with 8+ appliances over three years to Sept 2014, with callsigns, specials and officers ("Copy of FOI 8plusapps 3.xlsx") — not yet downloaded/parsed | [GMFRS] | S24 |
| London high-rise, cladding + multiple calls | 10 pumps + aerial | [LFB] | S29 |
| Northants high-rise (2019) | 5 pumps + ARP + CIV + JCU + support pump + GC + 2 officers | [NORTHANTS] | S36 |
| Cumbria terrorist / Plato | 6 pumps, 2 SM, 1 JICU | [NWFC-CUM] | S26 |

---

## 16. What we could not source

Honest gaps, in priority order for the sim.

1. **The GMFRS Incident Type List and Response Matrix itself.** Refused three
   times (2019 GMFRS "neither confirm nor deny"; 2025 NWFC → GMCA "information
   exempt"; 2025 fire-in-the-open refused) (S23). Lancashire (S27), LFB (S31,
   S33) and WMFS (S40) refuse on s.24 national security. No lawful route to the
   live matrix short of a successful ICO appeal.
2. **Current GMFRS high-rise PDA.** Known to be ≥ 5 pumps + aerial + support
   pump + SM (June 2017, S5) and "increased" after 2019 (S6); the new figure is
   unpublished. The FBU's July 2017 table (S41) has a Greater Manchester row
   but it is rendered as graphics in the PDF and was not read — worth opening
   by eye.
3. **Number of pumps GMFRS sends to an attended AFA** (sleeping-risk premises,
   or any premises at night). Policy is sourced (S17, S18); the attendance is
   not.
4. **GMFRS dwelling-fire and persons-reported PDAs.** Only Kerslake's
   illustrative "two pumps = eight firefighters" (S9) and the 4-rider PDA basis
   (S10). Cumbria's 3 + SM (S26) is the proxy.
5. **GMFRS RTC, hazmat, wildfire, school, water-rescue PDAs.** Nothing
   GM-specific beyond response standards and the existence of Enhanced Rescue
   Stations (S20) and enhanced WIUs (S20).
6. **Officer thresholds in GMFRS** (SM vs GM vs AM by pump count). Only the
   2017 high-rise "nearest Station Manager" (S5), the Major Incident SM to FOC
   (S22) and London's 5–6-pump Station Commander threshold (S30).
7. **NWAS and GMP automatic attendance to fire calls in Greater Manchester.**
   Not found; London's 2016 rules (S34) stand in.
8. **Whether GMFRS still mobilises fire crews to cardiac arrests.** The
   Response Strategy sentence (S14) is captured truncated; the NWFC list shows
   Cumbria at "NO ATTENDANCE" (S26). Needs the full S14 paragraph and a
   GMFRS/NWAS statement.
9. **West Midlands figures.** FOI 21111's page is bot-gated; the only
   retrievable content is the refusal and the call-challenge principle (S40).
   The "AFA; 1 Pump or Car Fire; 1 Pump" phrasing in the search summary
   appears to be the *requester's* example, not WMFS's answer, and is not used.
10. **National Operational Guidance on PDAs, verbatim.** The UKFRS pages (S42)
    now redirect to an NFCC search that returns nothing; wording is from search
    snippets only.
11. **Ambulance and police "PDA" numbers.** NHS England sets Category 1 time
    standards and a transporting-vehicle indicator (S43, S44) but no vehicle
    count; the College of Policing APP sets principles (S45, S46) and the page
    is 403 to automated fetchers. GMP publishes no ARV-per-incident figure.
12. **Crew per pump vs PDA basis — partly answered.** S10 gives the 2019 GMFRS
    model (5 on the first engine, 4 on the second; PDAs built on 4). Whether
    that survives the 2023 Fire Cover Review and the 52-engine fleet (S21) is
    not sourced.

### Notes for the scenario author

- **Scenario 01** (Trafford Centre): a trading-hours mall AFA would not be
  attended under S17 without a report of fire. Re-trigger it as "ARC / mall
  security report smoke in zone N3" so the 1-pump attendance is honest.
- **Scenarios 02, 03, 04, 05, 08, 09, 10**: "FDO — Group Manager from start"
  is heavier than any sourced PDA. Nearest **Station Manager** on life-risk
  PDAs (S5, S26); Group Manager on the make-up.
- **Scenarios 02, 03, 08, 10**: aerials are not on any sourced initial PDA
  except high-rise (S5, S29, S36). Move them to the escalation.
- **Scenario 07** (high-rise): three pumps is below GMFRS's own 2017 floor of
  five for persons reported (S5). Raise to 5 + aerial + support pump + SM.
- **Scenario 02** (police "auto-mobilised"): contradicted by the only sourced
  policy (S34). Downgrade to informed.
