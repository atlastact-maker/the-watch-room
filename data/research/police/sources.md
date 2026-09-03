# Sources — GMP stations & specialist bases

Point-in-time target: **2026-04-17**.

## Status

**No sources fetched this pass.** `WebFetch` and `WebSearch` were both
denied in the execution environment. The list below is the intended
primary-source reading order for the next pass, per the task brief's
"Preferred source order". Nothing below has been retrieved and
verified in this pass; do not cite anything here as confirmation of a
station or resource until the URL has been fetched and its content
logged.

## Tier 1 — official GMP

- `https://www.gmp.police.uk/` — force home; entry points into the 12
  district pages and contact-us / stations listings.
- `https://www.gmp.police.uk/police-forces/greater-manchester-police/areas/greater-manchester/au/about-us/`
  — About us / force structure.
- GMP district pages (one per metropolitan borough) — Bolton, Bury,
  Manchester City, Manchester North, Manchester South, Oldham,
  Rochdale, Salford, Stockport, Tameside, Trafford, Wigan. Intended to
  yield district HQ + neighbourhood stations + front-counter opening
  hours.
- `https://www.gmp.police.uk/foi-ai/` — GMP Freedom of Information
  disclosure log. Intended to yield ARV numbers, firearms basing, dog
  unit establishment, TSG strength, custody suite locations and
  operating hours.

## Tier 2 — inspection & governance

- HMICFRS PEEL inspection reports for GMP
  (`https://hmicfrs.justiceinspectorates.gov.uk/police-forces/greater-manchester/`).
  Intended to yield force structure narrative, custody inspection
  (locations + cell counts), and any recent restructure commentary.
- Greater Manchester Combined Authority / Deputy Mayor for Policing
  and Crime publications
  (`https://www.greatermanchester-ca.gov.uk/what-we-do/policing-and-crime/`).
  Intended to yield estate strategy, station closures / openings,
  capital programme.

## Tier 3 — specialist / national

- NPAS (`https://www.npas.police.uk/`) — base list for the North West
  region (historically Barton / Warton — needs 2026 verification; the
  NPAS estate has been reshuffled several times).
- College of Policing APP on Armed Policing — definitions of ARV /
  FAIS / AFO roles for the abbreviations glossary.

## Tier 4 — corroboration only

- `https://en.wikipedia.org/wiki/Greater_Manchester_Police` — useful
  cross-check for district list and historical changes. Not to be
  used as a sole source.
- UK police enthusiast / spotter sites (e.g. policespecials.com
  forums) — corroboration only; never primary.

## Notes

- The 2022–2024 GMP restructure into 12 districts is the current model
  per the task brief; any source older than 2022 that describes GMP as
  having "territorial divisions" is superseded and should be flagged
  `"older_than_2023": true` in notes fields.
- Any source dated before 2023 must be flagged per the authenticity
  bar.

### U7 — GMP callsign scheme, from the project owner

- **Source:** the project owner, in conversation, 2026-09-03.
- **Type:** direct testimony. Not a published document, and not
  independently verifiable — GMP does not publish its callsign scheme,
  and no FOI response covering it has been obtained.
- **What it gives:**
  - Division letters: A City of Manchester, F Salford, G Tameside,
    I Airport, J Stockport, K Bolton, L Wigan, M Trafford, N Bury,
    P Rochdale, Q Oldham.
  - Divisional form — division letter, role letter, shift digit, unit
    number. Role P = normal patrol, T = taser. Shift 1 = early,
    2 = afternoon, 3 = night. Worked example: `KT114` = K division
    taser, early shift.
  - Roads form — unit-type prefix, area digit, shift digit. `XT` road
    patrol, `ME` motorway unit, `XB` SRTT. Shift 1 = early,
    4 = afternoon/lates, 8 = nights. Worked examples: `XT14` = Bolton,
    Bury and Wigan on a late; `XT51` = Salford and Trafford on an early;
    `ME28` = motorway on nights. A roads callsign identifies who covers a
    geographical area on each shift.
- **Confidence:** the four worked examples are reproduced exactly by
  `police-callsigns.ts` and are covered by tests. The gaps in P5 are
  things this source did not cover, not things it got wrong.
- **Supersedes:** the invented scheme previously in `data.ts`, which
  produced `MP-Trafford 12` and `AR-14` and was labelled synthetic in
  its own comment.

### U7 — GMP callsign scheme, from the project owner

- **Source:** the project owner, in conversation, 2026-09-03.
- **Type:** direct testimony. Not a published document and not
  independently verifiable — GMP does not publish its callsign scheme and
  no FOI response covering it has been obtained.
- **Division letters:** A City of Manchester, F Salford, G Tameside,
  I Airport, J Stockport, K Bolton, L Wigan, M Trafford, N Bury,
  P Rochdale, Q Oldham.
- **Divisional form:** division letter, role letter, shift digit, unit
  number. Role P = normal patrol, T = taser. Shift 1 = early,
  2 = afternoon, 3 = night. Worked example: `KT114` = K division taser on
  an early.
- **Roads form:** unit-type prefix, area digit, shift digit. `XT` road
  patrol, `ME` motorway unit, `XB` SRTT. Shift 1 = early, 4 = lates,
  8 = nights. Worked examples: `XT14` = Bolton, Bury and Wigan on a late;
  `XT51` = Salford and Trafford on an early; `ME28` = motorway on nights.
  The callsign shows who covers a geographical area on each shift.
- **Confirmed 2026-09-03:** the digit order is area-then-shift. A later
  message described it as shift-then-area; put to the owner against the
  three worked examples, which only decode one way, the examples were
  confirmed correct.
- **Also confirmed:** one callsign belongs to one vehicle, and there is
  routinely one XT cover per patch plus a number of ME patrols.
- **Confidence:** all four worked examples are reproduced exactly by
  `police-callsigns.ts` and covered by tests. The gaps in P5 are things
  this source did not cover, not things it got wrong.
- **Supersedes:** the invented scheme previously in `data.ts`, which
  produced `MP-Trafford 12` and `AR-14` and was labelled synthetic in its
  own comment.
