# UK police abbreviations — glossary

Reference glossary of UK policing terms used (or to be used) in the
GMP dataset. This file is written from standard UK policing usage and
does **not** itself depend on the blocked web fetches. Every term below
should still be spot-checked against a primary source (College of
Policing APP or Home Office counting rules) before the dataset ships.

## Roles & units

| Abbrev    | Expansion                                         | Notes |
|-----------|---------------------------------------------------|-------|
| AFO       | Authorised Firearms Officer                       | Individual firearms-trained officer. |
| ARV       | Armed Response Vehicle                            | Marked / semi-marked vehicle crewed by AFOs; primary armed patrol asset. |
| FAIS      | Firearms Action Incident Support                  | Specialist firearms support capability working alongside ARVs; used in GMP to describe enhanced armed support roles. Verify GMP's 2026 usage before shipping. |
| TSG       | Tactical Support Group                            | Force-level public-order / proactive unit. In GMP historically called the TAU (Tactical Aid Unit). Confirm current branding 2026. |
| TAU       | Tactical Aid Unit                                 | GMP's historical name for the TSG-equivalent. Check whether still in use in 2026. |
| PSU       | Police Support Unit                               | Trained public-order serial (1 insp + 3 sgt + 18 PC + medic + driver is the Home Office Level 2 standard). A TSG unit is a PSU; response officers can also form PSUs. |
| RPU       | Roads Policing Unit                               | Traffic officers, ANPR intercept, SCIU support. |
| SCIU      | Serious Collision Investigation Unit              | Forensic collision reconstruction; sits with RPU. |
| NPAS      | National Police Air Service                       | National rotary (and fixed-wing) provider. Replaced individual force air support units in 2012. |
| DSU       | Dog Support Unit                                  | Force dog section (general purpose / firearms support / search / explosives). |
| MIT       | Major Incident Team                               | Homicide / serious crime investigation. |
| SIO       | Senior Investigating Officer                      | Lead detective on a major enquiry. |
| CID       | Criminal Investigation Department                 | Plain-clothes detectives at district level. |
| NPT       | Neighbourhood Policing Team                       | Long-term, geographically-assigned community policing. |
| PCSO      | Police Community Support Officer                  | Uniformed, non-warranted NPT support role. |
| PC        | Police Constable                                  | Warranted officer. |
| Sgt / PS  | Sergeant / Police Sergeant                        | First-line supervisor. |
| Insp      | Inspector                                         | |
| CH Insp   | Chief Inspector                                   | |
| Supt      | Superintendent                                    | District commander rank in GMP's 2022-24 model is usually Ch Supt. |
| Ch Supt   | Chief Superintendent                              | |
| ACC       | Assistant Chief Constable                         | |
| DCC       | Deputy Chief Constable                            | |
| CC        | Chief Constable                                   | |

## Operational terms

| Abbrev | Expansion | Notes |
|--------|-----------|-------|
| Response | (not an abbreviation) | 24/7 999-call-handling patrols. Sometimes written "IR" (Immediate Response). |
| IR        | Immediate Response                            | Grade 1 / emergency patrol tier. |
| S-grade   | Scheduled / Significant response               | Non-emergency booked appointment response. |
| FCR       | Force Control Room                            | Call-handling + dispatch centre. GMP's is at Claytonbrook / Central Park — verify. |
| OCB       | Operational Communications Branch             | Umbrella term for control-room function in some forces. |
| CAD       | Computer-Aided Dispatch                       | The log system. |
| STORM     | —                                             | Common CAD product used by many UK forces (Capita/Sopra); confirm GMP's 2026 system. |
| ANPR      | Automatic Number Plate Recognition            | |
| TPAC      | Tactical Pursuit and Containment              | Authorised pursuit / stinger tactic set. |
| PNC       | Police National Computer                      | |
| PND       | Police National Database                      | |
| MG11/DASH | — | Statement / risk-assessment forms; not relevant to station data. |
| PACE      | Police and Criminal Evidence Act 1984         | Governs custody clock (24h + extensions). |
| CT        | Counter Terrorism                             | |
| CTPNW     | Counter Terrorism Policing North West         | Regional CT unit; GMP is a member force and hosts part of the unit. |
| ROCU      | Regional Organised Crime Unit                 | In the North West: TITAN. Not dispatchable to routine incidents. |

## Station / estate types used in this dataset

Per the brief's `type` enum:

| Value                  | Meaning |
|------------------------|---------|
| `divisional_hq`        | District HQ (main command station for one of the 12 GMP districts). |
| `response_base`        | Station from which response (999) patrols are crewed. May or may not have a public counter. |
| `neighbourhood_station`| Primarily a base for NPT; limited or no response crewing. |
| `specialist_base`      | Any force-wide specialist unit not covered by a more specific enum. |
| `armed_base`           | Firearms unit base (ARV / FAIS / AFO training). |
| `dogs`                 | Dog section kennels / training base. |
| `npas`                 | NPAS rotary (and fixed-wing) operating base covering GMP. |
| `traffic`              | RPU / roads policing base. |
| `crime`                | MIT / serious crime / CID-dominant site. |
| `custody`              | Dedicated custody suite (may be co-located with another type). |
| `other`                | Anything that doesn't fit — use sparingly, explain in `notes`. |

## Geography

GMP's 12 districts after the 2022-24 restructure:

1. Bolton
2. Bury
3. Manchester (City)
4. Manchester (North)
5. Manchester (South)
6. Oldham
7. Rochdale
8. Salford
9. Stockport
10. Tameside
11. Trafford
12. Wigan

(Manchester metropolitan borough is policed as three GMP districts —
City, North, South — because of its size and demand.)

GMFRS patches (for `gmfrs_patch` field) — Southern / Eastern / Western
GM — are defined in the fire research; mapping rule to be confirmed
(see `gaps.md` P2).
