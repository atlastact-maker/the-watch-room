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

The scheme itself came from the owner (U7) and is implemented in
`src/lib/sim/police-callsigns.ts`. What is still missing:

- [ ] **Roads areas 2, 3 and 4** — and whether the numbering runs past 5.
  We hold area 1 = Bolton, Bury, Wigan and area 5 = Salford, Trafford,
  plus ME area 2 from the worked example `ME28`. Every other district
  therefore gets NO roads callsign, only a placeholder: a Manchester
  roads bike currently reads `RP-10`, not an `XT`, because borrowing
  area 5 would have put it on Salford and Trafford's ground.
- [ ] **Role letters beyond P (patrol) and T (taser)** — nothing is known
  for armed response, dogs, specialist search, the SIO car or the roads
  motorbike. They keep obviously-synthetic prefixes (`AR-`, `PD-`,
  `POLSA-`, `RP-`) so they cannot be mistaken for real callsigns.
- [ ] **The shift-code conflict.** The owner said traffic patrol "follow
  the same" as divisional, then gave 1 = early, 4 = lates, 8 = nights
  with three worked examples — against 1/2/3 for divisional. The worked
  examples are what the code implements. Worth confirming that divisional
  really is 1/2/3.
- [ ] **What SRTT stands for.** `XB` is implemented; the expansion is not
  written anywhere because we do not know it.
- [ ] **Unit-number ranges** per division — whether they restart each
  shift and how high they run. The sim numbers from 01 upward.
- [ ] **How two cars on the same patch and shift are told apart.** A roads
  callsign names ground and a turn, not a vehicle, so five Eccles cars
  all answer to `XT51`. A dispatch board cannot work like that, so the
  sim appends a letter — `XT51A` … `XT51E`. **That letter is the sim's,
  not GMP's**, and it is labelled as such wherever a callsign is
  explained. If GMP does distinguish them somehow, that is what should
  replace it.
- [ ] **Shift is baked in at build time.** A GMP callsign carries the
  shift, so the same car is `KP114` on an early and `KP314` that night.
  The station list is currently built before the operator picks a shift,
  so the fleet is built for earlies. `buildAppliances` already takes a
  shift; threading the operator's chosen one through means building the
  station list after the briefing rather than before.

## P5 — GMP callsigns

The scheme came from the owner (U7) and lives in
`src/lib/sim/police-callsigns.ts`. What is still missing:

- [ ] **Road-patrol areas beyond 1 and 5.** We hold area 1 = Bolton, Bury,
  Wigan and area 5 = Salford, Trafford. There is routinely one XT cover
  per patch, so the force has as many XT callsigns as it has patches —
  the sim currently issues two, which is certainly fewer than the real
  number. Every other district's roads vehicle gets a placeholder rather
  than borrowing an area that belongs to different ground.
- [ ] **Motorway areas beyond 2.** `ME28` gives us area 2. The owner says
  there are "a number of ME patrols", so there are more areas than that,
  and the sim can only name one until we have them.
- [ ] **Role letters beyond P (patrol) and T (taser)** — nothing is known
  for armed response, dogs, specialist search, the SIO car or a roads
  motorbike. They keep obviously-synthetic prefixes (`AR-`, `PD-`,
  `POLSA-`, `RP-`) so they cannot be mistaken for real callsigns.
- [ ] **The shift-code conflict.** The owner said traffic "follow the
  same" as divisional, then gave 1 = early, 4 = lates, 8 = nights with
  three worked examples — against 1/2/3 for divisional. The worked
  examples are what the code implements. Confirmed 2026-09-03 that the
  digit order is area-then-shift; the divisional 1/2/3 is still
  unconfirmed.
- [ ] **What SRTT stands for.** `XB` is implemented; the expansion is not
  written down because we do not know it.
- [ ] **Unit-number ranges** per division — whether they restart each
  shift and how high they run. The sim numbers from 01 upward.
- [ ] **Shift is baked in at build time.** A GMP callsign carries the
  shift, so the same car is `KP114` on an early and `KP314` that night.
  The station list is built before the operator picks a shift, so the
  fleet is built for earlies. `buildAppliances` already takes a shift;
  threading the operator's choice through means building the station list
  after the briefing rather than before.

Settled 2026-09-03, so not gaps: one callsign belongs to one vehicle (an
earlier pass had five cars sharing XT51 and papered over it with a letter
suffix — removed), and there is routinely one XT cover per patch plus a
number of ME patrols.
