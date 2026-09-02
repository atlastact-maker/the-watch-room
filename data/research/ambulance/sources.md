# Sources — Ambulance research

## NWAS

### U1 — User-supplied (2026-04-18, early pass)

- **Provided by:** Luke (project owner)
- **Type:** User domain knowledge
- **Reliability:** Authoritative for the specific facts explicitly stated.
- **Captured facts:**
  - NWAS **HART Manchester** base address: *BTTG Testing & Certification Ltd, 14 Wheel Forge Way, Trafford Park, Stretford, Manchester M17 1EH*.
  - **NWAA** base covering Greater Manchester: **Barton** (City Airport Manchester / Barton Aerodrome).
  - **BASICS** in-scope for the sim.

### U3 — Wigan confirmation (2026-04-19)

- **Provided by:** Luke
- **Type:** User domain knowledge
- **Reliability:** Authoritative for the fact stated.
- **Captured facts:** NWAS still stations an ambulance at the joint Wigan Fire + Ambulance site (Robin Park Road, WN5 0UU), not captured in the U2 paste. Allocation assumed 3× DCA + 1× RRV (typical urban station pattern).

### U2 — User-supplied full NWAS GM station list (2026-04-18)

- **Provided by:** Luke
- **Type:** User domain knowledge / authoritative paste
- **Reliability:** Treated as authoritative for the 30 station addresses.
- **Captured facts:** Complete list of NWAS ambulance stations in Greater Manchester with street, town, and postcode. Includes 25 emergency-response stations and 5 PTS-only sites. Replaces the earlier town-level placeholder set.
- **Post-processing:** All 30 postcodes geocoded via postcodes.io on 2026-04-18; 29 resolved cleanly, M32 0XX (Stretford PTS, Christie Road) failed — M32 outcode centroid substituted with `approximate: true`.

### H1 — postcodes.io geocode (2026-04-18)

- **URL:** https://api.postcodes.io
- **Type:** Primary (open data, ONS / Royal Mail PAF).
- **Used for:** lat/lng for M17 1EH (HART) and M30 7SA (NWAA Barton).

### I1 — GMFRS internal cross-reference

- **File:** `data/research/fire/gmfrs_stations.json`
- **Used for:** joint-station addresses and coords — G54 Wigan (Joint Fire + Ambulance, Robin Park Road WN5 0UU) and G62 Irlam (Joint Fire, Police + Ambulance, Fairhills Road M44 6BA).

### F1 — NWAS FOI2376, callsign prefixes (3 June 2021)

- **URL:** https://www.whatdotheyknow.com/request/vehicle_fleet_numbers_callsigns
- **Type:** Primary — NWAS's own FOI disclosure, answered by Jessica Gregson, Internal Communications Officer.
- **Captured facts:** The complete NWAS over-air callsign prefix table. `A` Ambulance (Emergency) · `U` Urgent Care · `I` Intermediate · `PS` Patient Transport · `R` Rapid Response Vehicle · `QX` Advanced Paramedic · `MX` Medical/Consultant Paramedic · `UX` Responding Clinical Hub Manager · **`Z` Hazardous Area Response Team vehicle** · `CP` Community Specialist Paramedic · `UP` Urgent Care Practitioner · `M` Major Incident Vehicle · `MA` Medical Advisor/MERIT · **`BX` Operational Commander** · `SX` Tactical Commander · `GX` Strategic Commander · `H` HEMS Vehicle · `CR`/`FR` Community First Responder · `SR` Staff Responder · `ER` Enhanced CFR · `FX` Falls Response · `S` See & Treat.
- **Not disclosed:** the number-to-area mapping. NWAS refused it in FOI24459 (3 Mar 2025) and FOI25042 (3 Jun 2025) under **s24, safeguarding national security**. Unit numbers in this project are therefore synthesised, seeded off the station id.
- **Corroboration:** real callsigns appear in the Southport Inquiry NWAS corporate statement (NWAS001083, 8 Jul 2025) — `A611`/`A645` DCAs, `R646` a Senior Paramedic Team Leader on an RRV, `QX616`/`QX617` Advanced Paramedics, `BX1792` an Operational Commander, `MX5877` a MERIT doctor, `H08`/`H58` HEMS. Confirms the format is prefix + digits with **no separator**.

### F2 — NWAS HART fleet FOIs (April 2025)

- **URLs:** https://www.whatdotheyknow.com/request/request_for_list_of_hart_vehicle (FOI24474, 14 Apr 2025, attachment `HART Apr 25.xlsx`) and https://www.whatdotheyknow.com/request/foi_resilience_information (FOI24477, 9 Apr 2025)
- **Type:** Primary — NWAS's own vehicle register and vehicle-role descriptions.
- **Captured facts:** FOI24474 gives the live HART register by division; **Manchester Central (Trafford Park) = 12 vehicles** — 8× MAN TGE 5.160 (in service Sep–Nov 2024), 1× Toyota Hilux Active D-4D 4WD (Jan 2025), 1× DAF LF 45.170 (Mar 2022), 1× Polaris Ranger (Feb 2010), 1× Skoda Kodiaq SE L 4x4 (Sep 2019). FOI24477 gives NWAS's own description of each role: Incident Response Units "crewed by 2 HART Paramedics per vehicle" (3 live + 2 spare), crew carriers "crewed by a full training team of 6" (1 overt, 1 covert), welfare unit, Toyota Hilux "for difficult access or inclement weather", "Polaris 6x6 UTV carried in the rear of a DAF 7.5t carrier", an RRV "for CAT1 life threatening calls", a multi-casualty vehicle, and the PSU / ISU / DECON units.
- **Not disclosed:** individual HART callsigns — "We do not issue call signs or registration numbers due to risk of trojan horse and counter terrorism" (FOI24474). The `Z3xx` block used here is enthusiast observation (`Z301`, `Z304`), **not** an NWAS disclosure.
- **Context:** this is the 3rd-generation national HART fleet specified by NARU — now the **NHS Emergency Capabilities Unit (NHS ECU)**, hosted by London Ambulance Service since April 2024. 136 vehicles across five concepts.

### N1 — NWAS Duty Officer role (NHS Jobs, 3 January 2025)

- **URL:** https://www.jobs.nhs.uk/candidate/jobadvert/C9242-25-0000
- **Type:** Primary — NWAS recruitment advert, ref 242-4523-LR, Band 7.
- **Captured facts:** "the new Duty Officer role … a vital component of our new leadership structure"; "Duty Officers will be **fully trained to NARU Operational Commander level** and provide a 24/7 Operational Command response throughout the whole footprint of the trust"; "qualified commanders … first line response to complex and major incidents".

### N2 — NWAS Annual Report 2024/25

- **URL:** https://www.nwas.nhs.uk/publications/annual-report-2024-25/
- **Type:** Primary — trust annual report.
- **Captured facts:** "There are also **six duty officers, our first line operational leadership response to incidents**, available across the region 24/7." Also records a minimum of six advanced paramedic practitioners on duty region-wide 24/7, and the introduction of sector clinical leads. The Southport statement (para 180) adds that a further eighteen Duty Officers are being recruited to rotate through the EOC as a 24/7 interface between scene commanders and the control rooms.

## Sources still to obtain

Per-town ambulance station addresses, postcodes, and current resource allocations are **not** in the dataset. Candidate sources for the next pass:

- NWAS official site: `nwas.nhs.uk` (current status: returns 404 on public guessed URLs; requires direct browser navigation and paste).
- FOI disclosures on `whatdotheyknow.com`: NWAS has responded to multiple FOIs about station locations and vehicle counts.
- ORCATS / station-finder third-party sites for cross-reference.
- NWAS annual reports and Board papers.
