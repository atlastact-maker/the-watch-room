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

## P5 — GMP callsigns

The scheme came from the owner (U7) and lives in
`src/lib/sim/police-callsigns.ts`.

### Settled

- **Divisional form** — division letter, role letter, shift digit, unit
  number; shifts 1 early, 2 afternoon, 3 night.
- **Roads form** — prefix, area, shift; shifts 1 early, 4 lates, 8 nights.
  The digit order is area-then-shift, confirmed against the owner's own
  worked examples after a later message described it the other way round.
- **All 21 roads covers**, given in full: three road-patrol patches
  (XT area 1 Bolton/Bury/Wigan, area 5 Salford/Trafford, area 7 the south
  district) and four motorway quadrants (ME area 1 north, 2 east, 4 west,
  5 south — there is no area 3), three shifts each. Every one is
  reproduced by the code and covered by tests.
- **One callsign, one vehicle.** An earlier pass had five cars sharing
  XT51 with a letter bolted on; removed.
- **Road-patrol and motorway areas are separate numberings.** XT area 1 is
  Bolton, Bury and Wigan; ME area 1 is the north motorway network. They
  get a table each.
- **Motorbikes are out** of the sim for now, at the owner's direction.

### Still open

- [ ] **Role letters beyond P (patrol) and T (taser)** — nothing is known
  for armed response, dogs, specialist search or the SIO car. They keep
  obviously-synthetic prefixes (`AR-`, `PD-`, `POLSA-`) so they cannot
  be mistaken for real callsigns.
- [ ] **What SRTT stands for.** `XB` is implemented; the expansion is not
  written down because we do not know it. No XB unit is currently
  fielded — we have no areas for it either.
- [ ] **Unit-number ranges** per division: whether they restart each shift
  and how high they run. The sim numbers from 01 upward.
- [ ] **Taser as a thing the sim fields.** `T` is implemented as a role
  letter but there is no taser unit in the fleet, because taser is a
  capability rather than a vehicle type in this sim. Worth deciding
  whether a division should field a dedicated taser car.
- [ ] **Shift is baked in at build time.** A GMP callsign carries the
  shift, so the same car is `KP114` on an early and `KP314` that night,
  and the whole roads board changes with the turn. The station list is
  built before the operator picks a shift, so the fleet is built for
  earlies. `buildAppliances` already takes a shift; threading the
  operator's choice through means building the station list after the
  briefing rather than before. **This is the biggest remaining gap** —
  right now a night shift still shows the early-turn callsigns.
- [ ] **DERIVED, not given:** the districts listed for XT area 7. The
  owner said "the south district, whatever is left"; the sim lists
  Manchester, Stockport, Tameside, Oldham and Rochdale as the remainder,
  which is our arithmetic rather than GMP's wording.
