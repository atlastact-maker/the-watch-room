# Gaps — open questions

Anything in this file blocks treating the dataset as sim-ready.

## P1 — Critical (blocks sim use)

- [x] **Currency.** Dataset inventory is from 2021-01-05. Decision (2026-04-17): proceed with 2021 inventory baseline; address data is current (2026-04-17). Per official GMFRS directory, the only post-2021 closure is **G21 Stockport** — flagged with `closedSince2021: true` in `gmfrs_stations.json`. (Earlier confusion: an initial answer also listed Philips Park and Whitehill as closed; cross-checked against the current directory and corrected — both are still open.) Sim should filter G21 out unless running a 2021 historical scenario.
- [ ] **Inventory currency for the 40 still-open stations.** The appliance complements per station are still as of 2021. Five years of fleet renewal and re-allocation is unaccounted for. Decide whether this matters for MVP (probably not for first vertical slice; matters for serious play).
- [x] **Undefined abbreviations.** Resolved 2026-04-17 via user-supplied glossary (`gmfrs_appliance_glossary_source.md`). All resolved except:
  - `HPV` (G20 Whitehill — closed; G33 Oldham — still open) — not in the user glossary. Likely a typo for `HVP` (High Volume Pump), but HVP is a pod requiring a Prime Mover and neither station shows a PM. Confirm: is HPV a typo, a withdrawn appliance type, or a separate vehicle?
- [x] **Corrections from glossary** that affect prior assumptions in `gmfrs_stations.json` semantics (the raw strings are unchanged; just the meaning shifted):
  - `WrT` = Water **Tower**, not Water Tender.
  - `WFU` = **Wildfire** Unit, not Welfare Unit. (Multiple stations on moorland fringe — fits.)
  - `WU` = **Welfare** Unit, not Water Unit. (G42 Hyde and G62 Irlam carry actual welfare vehicles. G62 Irlam therefore has both a Wildfire and a Welfare unit.)

## P2 — Needed before "realistic dispatch"

- [x] **Addresses + postcodes.** Captured 2026-04-17 from official GMFRS directory (source S3). All 40 currently-open stations have street, town and postcode in `gmfrs_stations.json`.
- [x] **Coordinates (lat/lng).** Geocoded 2026-04-17 via postcodes.io (source S4). All 40 open stations have `coords.lat` / `coords.lng` and admin metadata (district, ward, constituency, police force area) in `gmfrs_stations.json`. Reusable script: `scripts/geocode-fire.mjs`.
- [ ] **Crew sizes per appliance.** Source gives staffing pattern (wholetime/day/dual/jump) but not riders per pump. UK norm is 4–5 on a pump; need to confirm whether GMFRS uses 4 or 5 in 2021 (this changed historically).
- [ ] **Station areas / risk grounds.** Each station has a primary response ground; sim needs these for first-attendance logic and for "who covers when X is mobile".
- [ ] **Pre-Determined Attendance (PDA) tables.** What appliances/specials are sent to which incident type. Needed for "right resources to the right job" mechanic.

## P3 — LFRS

- [ ] **LFRS data not yet collected.** Need a source (Wikipedia LFRS article, official LFRS site, IRMP).

## P4 — Nice to have

- [ ] **Call signs.** Source uses station identifiers (G10–G62) but not appliance call signs. Mobilising messages typically use call signs (e.g. "P50P1" for Bolton Central pump 1).
- [ ] **NWFC mobilising rules.** How NWFC actually selects appliances in real life (nearest available, station of first turn-out, etc.). Drives realism of the dispatch suggestions in the sim.
