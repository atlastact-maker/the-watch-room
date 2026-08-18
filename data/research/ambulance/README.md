# Ambulance service research — The Watch Room

## Status

| Service | Source | Snapshot date | Stations | Status |
|---------|--------|---------------|---------:|--------|
| NWAS (GM area) | User-supplied full station list (U2) + postcodes.io | 2026-04-18 | 34 (25 emergency + 5 PTS + HART + NWAA + OD + BASICS) | Addresses + coords verified from user paste; resource counts still approximate. |

## Point-in-time

Target: **early 2026** (authored 2026-04-18).

## Caveats

- **Town-level only.** Ten NWAS stations in the dataset have town names and approximate coords (borrowed from the nearest GMFRS station in the same town) but no verified street address or postcode. See `gaps.md` P1.
- **Resource counts are approximations.** Every `3x DCA, 1x RRV`-style allocation is a placeholder based on typical urban NWAS station patterns. Not FOI-verified.
- **Verified entries:** HART base (user-supplied verbatim), NWAA Barton (user-confirmed), Wigan + Irlam joint stations (from GMFRS data).
- **BASICS** is modelled as a force-wide capability (volunteer doctor network), not a physical station.

## Files

- `nwas_stations.json` — structured station data.
- `abbreviations.md` — NWAS / UK ambulance terminology glossary.
- `sources.md` — bibliography (user input + internal cross-references + geocoder).
- `gaps.md` — open questions and unverified entries, prioritised.
