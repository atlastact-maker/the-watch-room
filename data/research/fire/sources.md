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
