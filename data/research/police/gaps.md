# Gaps — open questions (GMP)

Anything in this file blocks treating the dataset as sim-ready. The
whole dataset is currently blocked; P1 is the access issue.

## P1 — Critical (blocks any data at all)

- [ ] **Web access denied in this environment.** Both `WebFetch` and
  `WebSearch` returned permission-denied errors on the first calls
  (tested against `gmp.police.uk`). Per the task brief's Method step 3,
  this pass stops without fabricating data. To unblock, either:
  - grant `WebFetch` permission for at least these hosts:
    - `gmp.police.uk`
    - `hmicfrs.justiceinspectorates.gov.uk` /
      `justiceinspectorates.gov.uk`
    - `greatermanchester-ca.gov.uk`
    - `npas.police.uk`
    - `en.wikipedia.org` (corroboration only)
  - or drop copies of the relevant GMP pages / FOI PDFs into the
    working tree for local `Read`.

## P2 — Structural questions to answer on next pass

These are the questions the next research pass must answer per district
and force-wide. Listed here so the next run has a checklist.

### Per district (×12: Bolton, Bury, Manchester City, Manchester North,
Manchester South, Oldham, Rochdale, Salford, Stockport, Tameside,
Trafford, Wigan)

- [ ] Which station is the **District HQ** in 2026? (Several boroughs
  have had HQ moves post-restructure — e.g. the Longsight / Openshaw /
  Grey Mare Lane estate in East Manchester; Bootle Street in Manchester
  City being long closed; verify current HQ for each.)
- [ ] Which stations have a **public front counter** and what are the
  2026 opening hours?
- [ ] Which stations host **response teams** vs **neighbourhood teams
  only**?
- [ ] Which stations host a **custody suite**? Cell count, 24/7 status,
  and whether male / female / youth provision.
- [ ] Addresses + postcodes for every station (so postcodes.io can be
  reused for lat/lng, same pipeline as GMFRS — see
  `scripts/geocode-fire.mjs`).

### Force-wide specialist bases

- [ ] **Tactical Firearms Unit / ARV base(s).** Historic base is
  Openshaw (the old TFU at Chadderton was superseded); confirm 2026
  location(s). How many ARVs on shift across GM? Any satellite bases?
- [ ] **Dogs — kennels / Dog Section HQ.** Historic base Hough End;
  confirm.
- [ ] **TSG / PSU base.** Confirm current home station of the TSG and
  establishment (number of serials).
- [ ] **Roads Policing Unit (RPU) / Serious Collision Investigation
  Unit base(s).** Historic base at Eccles / Salford Precinct area;
  confirm 2026 location.
- [ ] **NPAS coverage of GMP.** Which NPAS base provides rotary cover
  for GM in 2026? (NPAS has closed and re-opened bases since 2020;
  Barton Aerodrome was used as a forward base historically. Confirm.)
- [ ] **Major Incident Team (MIT) / Serious Crime Division bases.**
  Usually clustered at Nexus House / Openshaw; confirm.
- [ ] **Counter Terrorism North West (CTPNW).** Sited at GMP estate but
  regional — note as `force_wide` and flag scope carefully (CTPNW is
  not dispatchable to routine incidents).
- [ ] **Force Control Room / OCB.** Claytonbrook / Central Park
  complex — confirm dispatch centre location and whether it's relevant
  to player-facing dispatch options.

### Mapping to GMFRS patches

- [ ] Decide the `gmfrs_patch` mapping rule. Proposed (to be recorded
  in this file once confirmed by user):
  - Southern GMFRS ≈ Manchester South + Stockport + Trafford + parts
    of Manchester City.
  - Eastern GMFRS ≈ Oldham + Rochdale + Tameside + Manchester North +
    parts of Manchester City.
  - Western GMFRS ≈ Bolton + Bury + Salford + Wigan.
  - Force-wide assets (ARV, TSG, dogs, NPAS, RPU, MIT) → `force_wide`.
  This mapping should be confirmed against the GMFRS research README
  before being committed to the dataset.

## P3 — Data-quality rules for next pass

- [ ] Every entry must have a `sources` array with at least one Tier 1
  or Tier 2 URL from `sources.md`.
- [ ] Any entry whose primary source is older than 2023 gets a note
  flagging the staleness, per the authenticity bar.
- [ ] Closed / consolidated stations (there have been several — e.g.
  Bootle Street, Collyhurst, Stretford old station) must be recorded
  as closed rather than silently omitted, so the sim can distinguish
  "deliberately excluded" from "missed".
- [ ] `verified: false` is acceptable on individual resource lines
  (e.g. exact ARV count per shift is rarely published) but
  `station_verified` should be `true` for every station that ships.

## P4 — Open scope questions for the user

- [ ] Should **British Transport Police** (Piccadilly / Victoria) be
  included? They dispatch to rail incidents inside GM but are a
  separate force — currently out of scope per the brief (which says
  "GMP").
- [ ] Should **MoD Police / CNC** be considered? Almost certainly no
  footprint in GM, but worth a one-line confirmation.
- [ ] Level of detail wanted on **custody**: just location, or cell
  counts + PACE clock management mechanics?
