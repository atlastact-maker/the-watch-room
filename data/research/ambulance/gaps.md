# Gaps — NWAS research

Updated 2026-04-18. Full 30-station dataset now in place; remaining items below.

## P1 — Per-station addresses ✓ resolved

Full station list with verified street + postcode supplied by user 2026-04-18 (source U2). All 29 resolvable postcodes geocoded via postcodes.io. Only M32 0XX (Stretford PTS, Christie Road) failed to resolve — substituted M32 outcode centroid with `approximate: true`.

## P2 — Resource allocations

Per-station `3x DCA / 1x RRV` counts are still sim approximations, not FOI-verified. User paste did not include allocations. Typical patterns used:
- Large urban station (Central, Salford, Stockport, Ashton, Oldham, Rochdale, Bury, Sharston, Bolton North, Bolton South): 3× DCA + 1× RRV
- Smaller station (co-located joints, Ramsbottom, Middleton, Heywood, Blackrod, Swinton, Eccles, Sale, Cheadle, Altrincham, Dukinfield, Glossop, Urmston, Philips Park, Stretford Police, Whitefield): 2× DCA + 1× RRV
- Irlam: 1× DCA (joint fire/police site)
- Advanced Paramedics: 1× QR each at A-CEN (Southern), A-OLD (Eastern), A-BON (Western)
- PTS-only sites (A-AUD, A-BOP, A-OLP, A-STR, Stretford PTS): no emergency allocation

TBC for realism:
- HART vehicle count at Trafford Park — modelled as 3; actual may differ.
- NWAA aircraft type — Airbus H145 assumed.

## P3 — Station-type classification

Some stations are Make-Ready Centres with different crewing models vs. traditional response stations. Not captured in the current dataset. Would affect availability patterns.

## P4 — Air Ambulance cross-base tasking

NWAA flies from Barton, Hawarden (Cheshire) and Blackpool. In high demand a secondary aircraft from another base may be tasked into GM. Not modelled.

## P5 — Wigan ✓ resolved

Resolved 2026-04-19: user confirmed NWAS still stations an ambulance at the joint Wigan Fire + Ambulance site (Robin Park Road, WN5 0UU). Added as `A-WIG` with 3× DCA + 1× RRV (allocation assumed).

## P6 — PTS vs emergency

PTS (Patient Transport Service) sites currently carry no resources. If the sim needs to model patient-transfer pressure or hospital offload relief, these could be given PTS-type vehicles later. Flagged `pts_only: true` in the data.

## P7 — CCP cars (distinct from CCC)

Critical Care Paramedic cars exist separately from the NWAA Critical Care Car. Not in dataset. Could be added if desired.
