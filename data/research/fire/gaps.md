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
- [ ] **Crew sizes per appliance.** Source gives staffing pattern (wholetime/day/dual/jump) but not riders per pump. UK norm is 4–5 on a pump; need to confirm whether GMFRS uses 4 or 5 in 2021 (this changed historically). *Partly answered 2026-09-03:* GMFRS's March 2019 business case (S10, see `pda.md` §1.2) states the crewing model as **5 on the first fire engine, 4 on the second**, and that every PDA is built on a minimum crew of four. Still open: whether that model survived the 2023 Fire Cover Review and the 52-engine fleet (S21).
- [ ] **Station areas / risk grounds.** Each station has a primary response ground; sim needs these for first-attendance logic and for "who covers when X is mobile".
- [x] **Pre-Determined Attendance (PDA) tables.** Researched 2026-09-03 → [`pda.md`](pda.md) (one table per sim incident type; sources S5–S46). Resolved *as far as it can be*: GMFRS's own matrix is withheld under FOI (three refusals, S23); GMFRS-sourced rows exist for high-rise (S5, S6), AFA policy (S17, S18), the Major Incident PDA (S22), bomb/explosion/Plato plans (S9, S11) and PDA construction rules (S10). Every other figure is a named comparable — chiefly Cumbria's list as held on the shared NWFC system (S26) and London (S29–S35) — or the sim's tagged [MODELLED] choice. Remaining sub-gaps are listed in `pda.md` §16 (current GMFRS high-rise number, pumps to an attended AFA, dwelling/RTC/hazmat/wildfire/water figures, officer thresholds, NWAS/GMP auto-attendance to fires). Next step: transcribe the modelled choices into `src/lib/sim/pda.ts` `STANDARD_PDA` with their scope tags.

## P3 — LFRS

- [ ] **LFRS data not yet collected.** Need a source (Wikipedia LFRS article, official LFRS site, IRMP).

## P4 — Nice to have

- [ ] **Call signs.** Source uses station identifiers (G10–G62) but not appliance call signs. Mobilising messages typically use call signs (e.g. "P50P1" for Bolton Central pump 1).
- [x] **NWFC mobilising rules.** How NWFC actually selects appliances in real life (nearest available, station of first turn-out, etc.). Drives realism of the dispatch suggestions in the sim. *Answered 2026-09-03 in `pda.md` §1.3:* nearest appliance across all four NWFC counties regardless of boundary (S12, S16), by AVLS road speed not station grounds (S28), quickest engines regardless of 4/5 crewing (S10), GPS pre-alert on every 999 call expiring after five minutes (S9), incident type + priority + PDA + GMFRS action plans applied without discretion (S11).
