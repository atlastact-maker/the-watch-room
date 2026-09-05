# NWAS / UK ambulance terminology glossary

Scope: terms used in `nwas_stations.json` and general NWAS operational
language. Confidence tags:

- **Confirmed** — definition is standard UK ambulance usage and matches
  the task brief.
- **Likely** — widely used in UK ambulance community; not yet verified
  against an NWAS-specific source in this dataset.
- **Unverified** — needs source check.

## Resource types

| Code | Expansion | Notes | Confidence |
|------|-----------|-------|------------|
| DCA | Double-Crewed Ambulance | Standard front-line emergency ambulance, crewed by two (typically paramedic + technician/ECSW, or paramedic + paramedic). The backbone of NWAS response. | Confirmed |
| RRV | Rapid Response Vehicle | Solo-responder car, usually paramedic. First on scene to stop the clock on Cat-1/Cat-2 calls; not a transporting vehicle. Also called "fast response car". | Confirmed |
| CCP car | Critical Care Paramedic car | Single-responder vehicle crewed by a CCP — an advanced paramedic with an enhanced skill set (e.g. pre-hospital blood, advanced airway, finger thoracostomy). HEMS-adjacent but road-based. | Confirmed |
| HART | Hazardous Area Response Team | National specialist capability (one per ambulance service). CBRN, USAR-adjacent, working-at-height, water, confined-space, marauding-terrorist-firearms-attack (MTFA) roles. Multi-vehicle team (personnel carrier, equipment vehicle, specialist kit). | Confirmed |
| IRU | Incident Response Unit | NWAS major-incident / mass-casualty support asset. Larger equipment vehicle (stretcher stocks, triage kit, PRF stocks, lighting). Not front-line response. | Likely |
| cycle response | Cycle Response Unit | Paramedic on a bicycle, historically deployed in Manchester city centre for rapid access through crowds / pedestrianised zones. Status in 2026 needs verifying. | Likely |
| BASICS | British Association for Immediate Care | National charity (1188273) affiliating around 30 local immediate-care schemes of volunteer clinicians. The scheme whose area reaches Greater Manchester is the **North West Pre-hospital Critical Care Charity (NWPCCC, charity 502386)**, Warrington-based; BASICS' own directory gives its area as Warrington/Appleton, the Cheshire & Merseyside trauma network says it covers Manchester. ~384 incidents in 2024 across four counties. **'BASICS North West' (charity 702500) is a dormant shell — £60 income, £288 expenditure FYE 31 Dec 2025 — and is not the regional branch of anything; the earlier note saying so was wrong.** Responders are alerted by automated text within 20 miles and phoned by the NWAS Complex Incident Hub — not paged. Corrected 2026-09-05. | Confirmed |
| air ambulance | Helicopter Emergency Medical Service (HEMS) | For GM, provided by **North West Air Ambulance Charity (NWAA)**, a charity partnered with NWAS. Crewed with a CCP and, on many shifts, an HEMS doctor. Not to be confused with GNAAS (Great North Air Ambulance, covers Cumbria and the NE). | Confirmed |
| welfare | Welfare vehicle | Non-clinical support vehicle (food, hot drinks, shelter) for long-running incidents. May be NWAS-owned or provided by a voluntary aid society (St John, Red Cross). | Likely |

## Base / facility types

| Type | Meaning | Confidence |
|------|---------|------------|
| ambulance_station | Traditional response base — vehicles parked up, crews book on here. | Confirmed |
| community_resource_centre | NWAS term for a smaller community-facing base, sometimes co-located with other public services. | Likely |
| make_ready_centre | Large consolidated base where ambulances are cleaned, restocked and handed over between shifts. Introduced under NWAS's Make-Ready programme to free clinical crews from vehicle prep. Crews may still book on here or at a satellite standby point. | Confirmed |
| hart_base | Dedicated HART facility with specialist vehicles, training space, decontamination. One per ambulance service in England. | Confirmed |
| air_ambulance | Helicopter base (e.g. Barton, Hawarden, Blackpool for NWAA). Not NWAS-owned but operationally integrated. | Confirmed |
| basics_post | Doctor's home / workplace registered as a BASICS responding location. Not a physical NWAS asset. | Likely |
| other | Anything that doesn't fit — e.g. a standby point at a hospital A&E, a fleet workshop. | Confirmed |

## Other operational terms likely to appear

| Term | Meaning | Confidence |
|------|---------|------------|
| NWAS | North West Ambulance Service NHS Trust | Confirmed |
| NHS | National Health Service | Confirmed |
| HEMS | Helicopter Emergency Medical Service | Confirmed |
| CCP | Critical Care Paramedic | Confirmed |
| ECSW | Emergency Care Support Worker (replaces legacy "Technician" grade at some trusts; second crew member on a DCA) | Likely |
| AMPDS | Advanced Medical Priority Dispatch System — the triage codeset NWAS control uses to categorise 999 calls (Cat 1 / 2 / 3 / 4). | Confirmed |
| PRF | Patient Report Form (clinical record completed per patient) | Confirmed |
| GMFRS | Greater Manchester Fire and Rescue Service — the player's parent service in the sim; NWAS is a partner agency in multi-agency incidents. | Confirmed |
| ORCATS | Station finder/resource website (community-maintained) used here for cross-checking locations, not primary citation. | Confirmed |
| IRMP | Integrated Risk Management Plan — statutory planning document (fire term, but NWAS publishes an equivalent). | Confirmed |
| FOI | Freedom of Information (Act 2000) — NWAS publishes a disclosure log under this regime. | Confirmed |

## Greater Manchester geography (for `gmfrs_patch`)

The sim splits GM into three fire-service patches:

- **Southern** — roughly Manchester city south, Stockport, Trafford, south Salford.
- **Eastern** — roughly Tameside, Oldham, north-east Manchester.
- **Western** — roughly Wigan, Bolton, Bury, north Salford.
- **adjacent** — just outside GMFRS boundary but operationally close
  (Warrington, Rossendale, Glossop, Macclesfield fringe).

These boundaries are the player's patches, not official NWAS
operational areas. NWAS uses its own divisions (historically "Greater
Manchester Area" as one of its four legacy county-based areas); current
2026 structure to be verified.
