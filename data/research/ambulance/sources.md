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

## Sources still to obtain

Per-town ambulance station addresses, postcodes, and current resource allocations are **not** in the dataset. Candidate sources for the next pass:

- NWAS official site: `nwas.nhs.uk` (current status: returns 404 on public guessed URLs; requires direct browser navigation and paste).
- FOI disclosures on `whatdotheyknow.com`: NWAS has responded to multiple FOIs about station locations and vehicle counts.
- ORCATS / station-finder third-party sites for cross-reference.
- NWAS annual reports and Board papers.
