# Sources

## GMFRS

### S1 — Wikipedia, "Greater Manchester Fire and Rescue Service" (revision oldid=998453378)

> **Also supplied by S1:** the Southern / Eastern / Western grouping in
> `gmfrs_stations.json`. The revision sections its station list under
> those three headings and states GMFRS ran three area commands (South,
> East, West; HQs Stretford, Rochdale, Bolton) before reorganising onto
> borough commands. The grouping is therefore historical, not invented —
> and since 2026-09-02 the sim's operator patch is the whole county
> (`src/lib/sim/areas.ts`), with the three names kept only to organise
> the data.

- **URL:** https://en.wikipedia.org/w/index.php?title=Greater_Manchester_Fire_and_Rescue_Service&oldid=998453378
- **Revision date:** 5 January 2021, 12:59 UTC
- **Type:** Secondary (Wikipedia)
- **Reliability:** Moderate. Wikipedia station inventories tend to be enthusiast-maintained and reasonably accurate at time of writing, but not an official source. No explicit citations on the page for individual station complements.
- **Fetched:** 2026-04-17
- **Used for:** entire GMFRS station list and appliance complement in `gmfrs_stations.json`.
- **Known limitations:** snapshot is over 5 years old; several appliance abbreviations are not defined on the source page.

### S2 — User-supplied GMFRS appliance glossary (2026-04-17)

- **Provided by:** Luke (project owner)
- **Date received:** 2026-04-17
- **Type:** User domain knowledge
- **Reliability:** Authoritative for GMFRS appliance code definitions and call-sign categories. Used as the definitive reference for decoding all appliance abbreviations in `gmfrs_stations.json`.
- **Used for:** entire `abbreviations.md` glossary; verbatim copy preserved in `gmfrs_appliance_glossary_source.md`.
- **Limitations:** does not cover HPV (which appears in the 2021 dataset but is not in this glossary — possibly a typo for HVP).

### S4 — postcodes.io (geocoding)

- **URL:** https://api.postcodes.io
- **Type:** Primary (open data, sourced from ONS / Royal Mail PAF)
- **Reliability:** Authoritative for UK postcode → lat/lng + admin geography mapping. Free, no key required, bulk endpoint supports up to 100 postcodes per call.
- **Fetched:** 2026-04-17
- **Used for:** lat/lng coordinates, admin district, electoral ward, parliamentary constituency, police force area for every GMFRS station with a postcode. See `scripts/geocode-fire.mjs`.

### S3 — GMFRS station directory (manchesterfire.gov.uk/your-area)

- **URL:** https://manchesterfire.gov.uk/your-area/
- **Type:** Primary (official GMFRS website)
- **Reliability:** Authoritative for current station list and addresses.
- **Fetched:** 2026-04-17 (page returned 403 to automated fetchers; content supplied by user via copy/paste)
- **Used for:** addresses, postcodes, current-station verification, multi-agency station notes (Irlam, Mossley, Wigan).
- **Confirms:** GMFRS currently has 40 stations (one fewer than 2021). The single closure since 2021 is **G21 Stockport** (confirmed by user 2026-04-17).

## LFRS

(none yet)

## Pre-determined attendances (feeds `pda.md`, compiled 2026-09-03)

Numbering continues the S-scheme. Scope: [GMFRS] = GMFRS-specific; comparable services named; [NOG] = national guidance.

### S5 — GMFRS FOI "Highrise PDA", ref FOI13072017-1805 (WhatDoTheyKnow)

- **URL:** https://www.whatdotheyknow.com/request/highrise_pda_12 (answer inside attachment "DD FOI13072017 1805.docx")
- **Date:** 4 August 2017
- **Type:** Primary (FOI disclosure by GMFRS) — [GMFRS]
- **Reliability:** High.
- **Used for:** GMFRS high-rise PDA as at 14 June 2017 (4 pumps + nearest Station Manager; 5 if persons trapped) and the 23 June 2017 addition of the nearest aerial appliance with support pump.

### S6 — HMICFRS, Fire & Rescue Service inspection 2021/22 — Greater Manchester — Effectiveness

- **URL:** https://hmicfrs.justiceinspectorates.gov.uk/frs-assessment/frs-2021/greater-manchester/effectiveness/
- **Date:** 15 December 2021
- **Type:** Primary (inspectorate) — [GMFRS]
- **Reliability:** High.
- **Used for:** 2019 Fire Cover Review "resulted in an increased attendance to high-rise incidents" (unquantified); AFA policy effect (25% fewer AFA incidents, 40% fewer mobilisations).

### S7 — GMFRS news, "Firefighters take part in 10-pump high rise exercise"

- **URL:** https://manchesterfire.gov.uk/news/firefighters-take-part-in-10-pump-high-rise-exercise
- **Date:** 18 February 2022
- **Type:** Primary (official GMFRS) — [GMFRS]
- **Reliability:** Medium — an exercise, indicative of make-up composition only.
- **Used for:** 10-pump high-rise make-up including TL, Command Support Unit, BA Unit, AIR Unit.

### S8 — GMFRS news, "Firefighters and police officers praised after swift response to Manchester high-rise fire"

- **URL:** https://manchesterfire.gov.uk/news/firefighters-and-police-officers-praised-after-swift-response-to-manchester-high-rise-fire
- **Date:** undated page; fetched 2026-09-03
- **Type:** Primary (official GMFRS) — [GMFRS]
- **Reliability:** Medium — a single actual attendance, not a PDA.
- **Used for:** six engines (Broughton, Gorton, Philips Park, Salford) plus ALP from Manchester Central.

### S9 — The Kerslake Report (independent review of the Manchester Arena attack response)

- **URL:** https://www.jesip.org.uk/uploads/media/Documents%20Products/Kerslake_Report_Manchester_Are.pdf
- **Date:** 27 March 2018
- **Type:** Primary (independent review; paras 3.141–3.145, 3.152–3.154, 5.131, 5.194) — [GMFRS]
- **Reliability:** High.
- **Used for:** PDA definition in GMFRS terms ("two pumps" = two tenders, eight firefighters; senior rider is IC); pre-alert mechanism (GPS-based, expires after five minutes); "BOMB" action plan (inform NILO, obtain RVP; four pumps grouped at Philips Park); "command structure" PDA to ordinary incidents and 5 min 41 s to first IC information.

### S10 — GMFRS Programme for Change — Outline Business Case, March 2019

- **URL:** https://manchesterfire.gov.uk/media/1503/pfc-outline-business-case-final-march-2019.pdf
- **Date:** March 2019 (paras 235–239)
- **Type:** Primary (official GMFRS) — [GMFRS]
- **Reliability:** High.
- **Used for:** PDAs held in the "Incident Type List and GMFRS Response Matrix"; built from task analysis, crewing, incident type, equipment, risk; NWFC selects quickest engines regardless of crewing; all PDAs built on a minimum crew of four; crewing model 5 on the first engine, 4 on the second.

### S11 — Manchester Arena Inquiry, Volume 2-I: Emergency Response

- **URL:** https://assets.publishing.service.gov.uk/media/6363d508e90e0705a935f36d/MAI-Vol2-_Part_i_Accessible_.pdf
- **Date:** 3 November 2022 (paras 12.448–12.449, 12.526–12.527, 12.560, 12.563, 12.573–12.584, 15.13)
- **Type:** Primary (statutory inquiry) — [GMFRS]; the NWAS paragraphs are [NOG]-grade for the ambulance side
- **Reliability:** High.
- **Used for:** NWFC dispatch model (incident type, priority 1 = most serious, PDAs for certain locations/types, GMFRS action plans followed without discretion); "EXPLOSION" action plan (TRU + appliances + SM + NILO to scene) and its post-Arena revision; Operation Plato Standby/Implementation/Stand-down plans; NWAS had no major-incident PDA in 2017.

### S12 — GMFRS Integrated Risk Management Plan 2016–2020, Supporting Information

- **URL:** https://manchesterfire.gov.uk/media/1092/irmp-supporting-documentation-2016-20.pdf
- **Date:** 2016 (pp. 17, 23, 24)
- **Type:** Primary (official GMFRS) — [GMFRS]
- **Reliability:** High for its period; response standards since superseded (see S13, S14).
- **Used for:** NWFC mobilises the nearest appliance across the four counties (since May 2014); modelling uses the PDA for each incident type; Risk Category 1–4 response standards (<5, <7, <12, <17 min).

### S13 — GMFRS Mid-Year Performance Report, April–September 2023 (GMCA Police, Fire & Crime Panel)

- **URL:** https://democracy.greatermanchester-ca.gov.uk/documents/s30845/GMFRS%20Mid-Year%20Performance%20Report%2023-24%20Final.pdf
- **Date:** November 2023
- **Type:** Primary (GMCA governance papers) — [GMFRS]
- **Reliability:** High.
- **Used for:** life-risk response standard (10 min from call at NWFC, 80%); target 7 min 30 s; performance 84% / 7 min 35 s; house fires and RTCs defined as life-risk incidents.

### S14 — GMFRS Response Strategy 2022–2025

- **URL:** https://democracy.greatermanchester-ca.gov.uk/documents/s20752/GMFRS%20Response%20Strategy%202022-25.pdf
- **Date:** 2022
- **Type:** Primary (official GMFRS via GMCA) — [GMFRS]
- **Reliability:** High. The cardiac-arrest co-responding sentence was captured truncated by the hunt ("The Fire Brigade's Union had some…") — re-read before relying on current status.
- **Used for:** response standard is for the first fire engine, target 7 min 30 s; HIRE / Immediate Building Evacuation (IBE) additional resources and The Cube (18 engines from four other FRSs for cover); GMFRS "first fire and rescue service to mobilise all its firefighters to cardiac arrests".

### S15 — HMICFRS, An inspection of Greater Manchester Fire and Rescue Service 2023–25 (PDF)

- **URL:** https://s3-eu-west-2.amazonaws.com/assets-hmicfrs.justiceinspectorates.gov.uk/uploads/frs-assessment-2023-25-greater-manchester.pdf
- **Date:** 8 March 2024 (pp. 21–23)
- **Type:** Primary (inspectorate) — [GMFRS]
- **Reliability:** High.
- **Used for:** 41 stations, 50 fire engines, 99.6% availability (2022/23); dwelling primary fire response 6 min 39 s; 7 min 21 s to life-risk (May 2023); AFAs 30% of calls (14,950 of 49,671).

### S16 — HMICFRS, Fire & Rescue Service inspection 2018/19 — Greater Manchester — Effectiveness

- **URL:** https://hmicfrs.justiceinspectorates.gov.uk/frs-assessment/frs-2018/greater-manchester/effectiveness/
- **Date:** 20 June 2019
- **Type:** Primary (inspectorate) — [GMFRS]
- **Reliability:** High.
- **Used for:** resilience planning assumptions (two simultaneous 10-engine incidents, one hazmat, or one 25-engine incident); 54 engines normally available; cross-border mobilisation for speed.

### S17 — GMFRS, Business Safety — False Alarms ("Our Response")

- **URL:** https://manchesterfire.gov.uk/your-safety/business-safety/fire-safety-law/false-alarms/
- **Date:** policy effective 1 August 2020; page fetched 2026-09-03
- **Type:** Primary (official GMFRS) — [GMFRS]
- **Reliability:** High.
- **Used for:** no attendance 08:00–19:00 to AFAs at premises with no sleeping accommodation unless the caller reasonably believes a fire; always respond to reports of fire; ARC must hold premises type / sleeping status; 20-minute limit at closed premises. Says nothing about the number of pumps sent when an AFA is attended.

### S18 — FSM Magazine, "Daytime automatic alarm response ended by GMFRS"

- **URL:** https://www.fsmatters.com/automatic-alarm-response-ended-GMFRS
- **Date:** 30 May 2019
- **Type:** Secondary (trade press reporting GMFRS) — [GMFRS]
- **Reliability:** Medium.
- **Used for:** 2019 policy launch; exemptions for high-rise buildings and hospitals; ~14,000 false alarms in 2017/18.

### S19 — GMFRS Fire Cover Review 2023, "Enhancing our special appliances"

- **URL:** https://www.manchesterfire.gov.uk/fire-plan/fire-plan-2021-2025/fire-cover-review-2023/enhancing-our-special-appliances/
- **Date:** 2023. **Page removed by 2026-09-03**; wording captured from search-engine snippets of the page.
- **Type:** Primary (official GMFRS), but snippet-only — [GMFRS]
- **Reliability:** Medium (snippets). Corroborated by S20.
- **Used for:** 20-minute special-appliance attendance standard for cage rescue across GM and to all high-rise buildings; aerial fleet of seven; TL Stretford → Oldham; HRETs at Whitefield and Wigan added to Salford's; HRETs have no cage rescue.

### S20 — GMFRS / GMCA, Consultation Report: Fire Cover Review and Special Appliance Review (Appendix A) and PFCP paper "GMFRS Fire Cover Review – Consultation Activities & Outcomes"

- **URL:** https://manchesterfire.gov.uk/media/okjdwa0y/appendix-a-fire-cover-review_consultation-report-280923.pdf
- **Date:** 28 September 2023 (consultation report); 20 November 2023 (PFCP outcomes paper)
- **Type:** Primary (official GMFRS / GMCA) — [GMFRS]
- **Reliability:** High.
- **Used for:** relocate one TL Stretford → Oldham; replace three Hydraulic Platform Vehicles with HRETs; enhance Water Incident Units; +1 wholetime pump at Manchester Central; Enhanced Rescue Stations at Leigh and Ashton; all special-appliance proposals approved.

### S21 — GMFRS news, "Greater Manchester expands its frontline fire fleet following additional investment…"

- **URL:** https://manchesterfire.gov.uk/news/greater-manchester-expands-its-frontline-fire-fleet-following-additional-investment-in-keeping-local-communities-safe
- **Date:** September 2025
- **Type:** Primary (official GMFRS) — [GMFRS]
- **Reliability:** High.
- **Used for:** 52 fire engines; 51st at Manchester Central (Dec 2024); 52nd at Moss Side (19 Sep 2025).

### S22 — GMFRS Fire and Rescue Declaration — Annual Statement of Assurance 2024/25

- **URL:** https://manchesterfire.gov.uk/media/2wvbs4q5/gmfrs-assurance-declaration-2024-25-guidance.pdf
- **Date:** June 2025 (p. 25)
- **Type:** Primary (official GMFRS) — [GMFRS]
- **Reliability:** High.
- **Used for:** Major Incident PDA mobilises a Station Manager to GMP's Force Operations Centre as GMFRS Liaison Officer.

### S23 — WhatDoTheyKnow: GMFRS / NWFC PDA disclosure refusals

- **URLs:** https://www.whatdotheyknow.com/request/pdas_2 (GMFRS, refused 22 Oct 2019, "neither confirm nor deny"); https://www.whatdotheyknow.com/request/pre_determined_attendances_for_g (NWFC 16 Oct 2025 redirect → GMCA refused 12 Nov 2025, "information exempt"); https://www.whatdotheyknow.com/request/pre_determine (fire-in-the-open PDAs, refused 22 Dec 2025)
- **Date:** 2019-10-22 / 2025-11-12 / 2025-12-22
- **Type:** Primary (FOI correspondence) — [GMFRS]
- **Reliability:** High.
- **Used for:** the GMFRS PDA matrix is withheld; NWFC directs PDA requests to GMFRS HQ.

### S24 — WhatDoTheyKnow: "Fire incidents" FOI to GMFRS (8+ appliances, three years to Sept 2014)

- **URL:** https://www.whatdotheyknow.com/request/fire_incidents_5
- **Date:** 16 October 2014
- **Type:** Primary (FOI disclosure; attachment "Copy of FOI 8plusapps 3.xlsx") — [GMFRS]
- **Reliability:** High. Not yet downloaded or parsed.
- **Used for:** existence of a make-up-size dataset (date, appliances, callsigns, specials, officers) for calibrating escalations.

### S25 — North West Fire Control website (home-page statistics; Mobilising System Solution contract page)

- **URL:** https://www.nwfirecontrol.com/
- **Date:** statistics April–September 2023; Frequentis contract 20 January 2025
- **Type:** Primary (NWFC) — [GMFRS]
- **Reliability:** Medium (marketing statistics).
- **Used for:** 80-second average dispatch; 5.7-second average call answer; new Frequentis mobilising system.

### S26 — WhatDoTheyKnow: "Pre Determined Attendances for Cumbria FRS" — NWFC spreadsheet "Freedom of Information.Cumbria.xlsx"

- **URL:** https://www.whatdotheyknow.com/request/pre_determined_attendances_for_c
- **Date:** 16 October 2025 (file modified 2025-10-15; NWFC later issued a recall but the file remains public)
- **Type:** Primary (FOI disclosure by NWFC) — **Cumbria FRS, comparable service on the same control room**. NOT GMFRS.
- **Reliability:** High for Cumbria. Its value for GM is the *format* of an NWFC incident-type list (type → sub-type → "N PUMPS (ANY), NEAREST SM"; "Inform Duty ILO"; 1-pump PDA met by RRV/SIU), not the numbers.
- **Used for:** every [NWFC-CUM] row in `pda.md` — persons reported 3 PUMPS + SM; domestic/commercial building fire 2 PUMPS; high-rise 3 PUMPS + SM; AFA 1 PUMP; RTC persons trapped 2 PUMPS + SM (large vehicles add ERU/rescue pump); water rescue 3 pumps + SM; hazmat small/large; gas leak; cylinders; terrorist 6P 2SM JICU; explosion 2 PUMPS + SM; bomb unexploded NO ATTENDANCE; moorland 1 PUMP; forest 2 PUMPS + SM; vehicle fires; NWAS gaining entry 1 PUMP; NWAS Red One cardiac arrest NO ATTENDANCE; IBE incident type.

### S27 — WhatDoTheyKnow: Lancashire FRS PDA refusals

- **URL:** https://www.whatdotheyknow.com/request/pre_determined_attendances_pda_f_2 (and "Lancashire PDA List")
- **Date:** 6 January 2026
- **Type:** Primary (FOI correspondence) — Lancashire FRS (NWFC-served neighbour)
- **Reliability:** High.
- **Used for:** PDAs held but withheld under FOIA s.24(2), s.31(3), s.38(2).

### S28 — Lancashire Fire and Rescue Service, Response Strategy 2022–2027

- **URL:** https://www.lancsfirerescue.org.uk/about/publications/response-strategy-2022-2027
- **Date:** 2022
- **Type:** Primary (official LFRS) — Lancashire FRS (same control room)
- **Reliability:** High.
- **Used for:** response standards (critical fire 6/8/10/12 min by risk area; critical special service 13 min); NWFC AVLS road-speed mobilising of the nearest resources rather than station boundaries; PDAs defined per incident type.

### S29 — London Fire Brigade, Grenfell Tower Investigation and Review Team (GTIRT) — "Pre-Determined Attendance"

- **URL:** https://www.london-fire.gov.uk/about-us/grenfell-tower-investigation-and-review-team-gtirt/
- **Date:** fetched 2026-09-03 (post-Grenfell policy)
- **Type:** Primary (official LFB) — LFB
- **Reliability:** High.
- **Used for:** high-rise PDA 5 engines + aerial; 10 + aerial for multiple calls and a reported cladding fire.

### S30 — London Fire Brigade FOI response 8541.1

- **URL:** https://www.london-fire.gov.uk/media/8981/foia85411.pdf
- **Date:** 27 March 2024
- **Type:** Primary (FOI disclosure) — LFB
- **Reliability:** High.
- **Used for:** single-private-dwelling initial PDA = pump ladder + pump (9 firefighters, 5 + 4); 6/8-minute first/second engine targets; officer thresholds (senior rider up to 4 pumps; Station Commander at 5–6); Mobilising Policy 412 covers appliances, officers and external agencies.

### S31 — London Fire Brigade, "Pre-Determined Attendance" web page, and FOI 8227.1

- **URL:** https://london-fire.gov.uk/about-us/services-and-facilities/techniques-and-procedures/pre-determined-attendance
- **Date:** FOI 8227.1 18 January 2024; page fetched 2026-09-03
- **Type:** Primary (official LFB) — LFB
- **Reliability:** High.
- **Used for:** PDA is the minimum; uplift for multiple calls or persons involved; "special attendances" for known-risk locations; full list in Policy 412, exempt under FOIA s.24.

### S32 — London Fire Brigade FOI response 8014.1 ("PDA appliances")

- **URL:** https://www.london-fire.gov.uk/media/awaiinbh/foia80141-pda-appliances-response.pdf
- **Date:** 14 November 2023
- **Type:** Primary (FOI disclosure) — LFB
- **Reliability:** High.
- **Used for:** PDA definition ("determined minimum level of response"); more resources when many calls or people reported.

### S33 — London Fire Brigade FOI responses 6805.1 (and 6380.1)

- **URL:** https://www.london-fire.gov.uk/media/6979/foi-response-68051.pdf
- **Date:** 6 September 2022 (6805.1)
- **Type:** Primary (FOI disclosure) — LFB
- **Reliability:** High.
- **Used for:** LFB holds a PDA for every incident type but refuses disclosure under FOIA s.24; Policy 412 Appendix 4 (officer thresholds) redacted.

### S34 — London Fire Brigade Policy 412, Mobilising policy (2016 version; Grenfell Tower Inquiry exhibit LFB00001531)

- **URL:** https://webarchive.nationalarchives.gov.uk/ukgwa/20250319155650mp_/https://assets.grenfelltowerinquiry.org.uk/LFB00001531.pdf
- **Date:** issued 26 October 2005; reviewed as current 15 July 2016
- **Type:** Primary (LFB policy document, via UK Government Web Archive) — LFB. Superseded in parts (AFA hours: see S35).
- **Reliability:** High for its date. Appendix 2 table reconstructed from OCR (medium).
- **Used for:** s.3.1/4.1 commercial AFA = one pumping appliance, non-commercial AFA = normal PDA, call filtering 06:00–21:00; Appendix 2 premises classification (hospital, schools = "Commercial"; care home, HMO, flats, hostels, hospices = Non-Commercial); s.14.2 ambulance ordered on initial mobilisation only when persons believed involved, always on a "persons reported" message; s.15.1 police only on IC request, informed of major incidents, persons-reported fires and any incident where an ambulance is ordered for a member of the public.

### S35 — London Fire Brigade, AFA policy page (current; effective 29 October 2024)

- **URL:** https://www.london-fire.gov.uk/safety/the-workplace/automatic-fire-alarms/afa-policy/
- **Date:** effective 29 October 2024 (per LFB news release "Keeping Communities Safe"); page fetched 2026-09-03
- **Type:** Primary (official LFB) — LFB
- **Reliability:** High.
- **Used for:** no attendance to AFAs 07:00–20:30 unless a caller confirms fire; all AFAs attended 20:30–07:00; always-attended premises list (dwellings, flats incl. high-rise, HMOs, hospitals, care/nursing homes, hospices, children's homes, sheltered/extra-care housing, student halls, boarding schools, hotels, hostels, prisons, Grade 1/2/2* listed buildings, schools, nurseries, designated buildings of public significance).

### S36 — Northamptonshire FRS FOI NFRS2019-28-28, "Pre-Determined Attendance plan for high rise"

- **URL:** https://www.northantsfire.gov.uk/wp-content/uploads/2019/07/NFRS2019-28-28PDAplan.pdf
- **Date:** 25 June 2019
- **Type:** Primary (FOI disclosure) — Northamptonshire FRS
- **Reliability:** High.
- **Used for:** high-rise PDA history 2009 / 2012 / 2019 (2019: 5 pumps, Aerial Rescue Pump, Cobra Intervention Vehicle, Joint Command Unit + support pump, Group Commander IC, 2 further officers).

### S37 — Humberside Fire & Rescue Service, Emergency Call Management and Mobilising Policy v1.1

- **URL:** https://d85dsqxzgf7l9.cloudfront.net/files/Policies/Emergency-Call-Management-and-MobilisingPolicy.pdf
- **Date:** July 2023
- **Type:** Primary (published service policy) — Humberside FRS
- **Reliability:** High.
- **Used for:** PDA definition; special appliances not normally on the initial PDA (IC request); fire control announces major-incident declarations to police and ambulance on Airwave.

### S38 — Essex County Fire & Rescue Service FOI/3974/2019, "Operational Information — Pre-Determined Attendances"

- **URL:** https://www.essex-fire.gov.uk/foi-3974-2019-pre-determined-attendances (also https://www.transparency.essex-fire.gov.uk/information/FOI__3974_2019_-_Pre-determined_attendances/)
- **Date:** 2019
- **Type:** Primary (FOI disclosure) — Essex FRS
- **Reliability:** High.
- **Used for:** ECFRS uses "offers"; high-rise: 4 pumps + Level 2 IC for AFAs, 6 pumps + Level 2 IC + 2 Level 2 Command Support Officers + Incident Command Unit for fire; aerials only on IC request; no Fire Rescue Units; unchanged 2010–2019.

### S39 — Essex County Fire & Rescue Service, fire-safety consultation guidance PDF (untitled; "Fire Alarm Management" section)

- **URL:** https://www.essex-fire.gov.uk/sites/default/files/2025-07/pdf_1677775247.pdf
- **Date:** uploaded July 2025 (document undated)
- **Type:** Primary (official ECFRS building-regulations consultation guidance) — Essex FRS
- **Reliability:** Medium (untitled standard-letter extract; extracted with pdftotext).
- **Used for:** "premises presenting a risk to life in connection with the provision of sleeping accommodation, schools and premises that have an intrinsically high fire risk … will receive a full and immediate pre-determined attendance (PDA) appropriate to the risk" on the AFA alone; all other premises are not mobilised to on an AFA, but a 999 call confirming fire gets a full response.

### S40 — West Midlands Fire Service FOI 21111, "Full PDAs"

- **URL:** https://www.wmfs.net/foi/21111-full-pdas/
- **Date:** 20 September 2021
- **Type:** Primary (FOI disclosure) — WMFS. **Page is bot-gated to automated fetchers**; content known only from search-engine summaries.
- **Reliability:** Medium (snippet-only).
- **Used for:** full PDAs for locations attracting a specific attendance refused under FOIA s.24; WMFS "operates call challenging and dynamic risk assessments so the proposed attendance can be moved up or down". The "AFA; 1 Pump or Car Fire; 1 Pump" wording in the summary appears to be the requester's example and is not treated as a WMFS figure.

### S41 — Fire Brigades Union, "Fire and rescue service pre-determined attendance (PDA) at tower blocks"

- **URL:** https://www.fbu.org.uk/sites/default/files/publications/Fire%20and%20rescue%20service%20pre-determined%20attendance%20at%20tower%20blocks%20%28004%29.pdf
- **Date:** data as of 14 July 2017; published 15 July 2017
- **Type:** Secondary (union survey of services) — [NOG]-grade national comparison
- **Reliability:** Medium. The per-service table (1st–8th pump, aerial) is rendered as graphics; the Greater Manchester row was not machine-readable in the hunt.
- **Used for:** the notes — minimum PDA can vary once further information is received; crewing 4–5 per appliance; further appliances/ALPs on request.

### S42 — NFCC / UKFRS National Operational Guidance: "Use technology to mobilise fire and rescue service resources" and "Appropriate deployment of resources"

- **URLs:** https://www.ukfrs.com/index.php/guidance/search/use-technology-mobilise-fire-and-rescue-service-resources ; https://www.ukfrs.com/guidance/search/appropriate-deployment-resources
- **Date:** undated guidance pages. **Both now 301-redirect to an nfcc.org.uk search that returns no results (2026-09-03)**; wording is a precise paraphrase from search-engine snippets.
- **Type:** Primary (national guidance), snippet-only — [NOG]
- **Reliability:** Medium.
- **Used for:** mobilising systems display predetermined attendances from the gazetteer and incident type list and the nearest resource via AVLS; assessment of the incident dictates the response either at the time of call by reference to PDAs or through fireground requests; dynamic mobilising used to develop PDAs.

### S43 — NHS England, Ambulance Response Programme Review (Gateway 08296)

- **URL:** https://www.england.nhs.uk/wp-content/uploads/2018/10/ambulance-response-programme-review.pdf
- **Date:** May 2018
- **Type:** Primary (NHS England) — [NOG] (ambulance side)
- **Reliability:** High. Extracted with pdftotext.
- **Used for:** Category 1 = "A time critical life-threatening event requiring immediate intervention or resuscitation" with standards mean 7 minutes / 90th centile 15 minutes ("Mean 00:07:00, 90th centile 00:15:00"); Category 1 examples "include Cardiac arrest, anaphylaxis…"; the Category 1 Transport (C1T) indicator for arrival of a transporting vehicle.

### S44 — South East Coast Ambulance Service, "Response time targets" (Ambulance Response Programme)

- **URL:** https://www.secamb.nhs.uk/what-we-do/ambulance-response-programme/
- **Date:** fetched 2026-09-03
- **Type:** Primary (an NHS ambulance trust restating the national standard) — [NOG]
- **Reliability:** High for the standard wording; not NWAS.
- **Used for:** Category 1 "for calls to people with immediately life-threatening and time critical injuries and illnesses"; "seven minutes" mean; "at least 9 out of 10 times before 15 minutes".

### S45 — College of Policing, Authorised Professional Practice — Armed policing: "Armed deployment"

- **URL:** https://www.college.police.uk/app/armed-policing/armed-deployment
- **Date:** undated APP page. **Returns HTTP 403 to automated fetchers**; wording is a paraphrase from search-engine snippets.
- **Type:** Primary (national police guidance), snippet-only — [NOG]
- **Reliability:** Medium.
- **Used for:** initial authority for AFO deployment from an accredited SFC or TFC; in spontaneous incidents the authorising officer must instigate a command structure as soon as practicable; unarmed responders coordinated with AFOs and subject to risk assessment.

### S46 — College of Policing, Code of Practice on Armed Policing and Police use of Less Lethal Weapons

- **URL:** https://assets.publishing.service.gov.uk/media/5e1db464ed915d7c7c39788c/CCS207_CCS0120853800-001_Code-of-Practice-on-Armed-Policing_Print__17_.pdf
- **Date:** January 2020 (laid before Parliament under s.39A(5) Police Act 1996)
- **Type:** Primary (statutory code) — [NOG]
- **Reliability:** High. Extracted with pdftotext. Contains principles only — no ARV numbers.
- **Used for:** "The police service in England and Wales has long been generally unarmed. The use of firearms by the police should always be a last resort … where an operational need arises, authorised firearms officers should be available to be deployed."
