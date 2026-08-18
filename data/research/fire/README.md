# Fire service research — The Watch Room

## Status

| Service | Source                 | Snapshot date  | Stations | Status        |
|---------|------------------------|----------------|---------:|---------------|
| GMFRS   | Wikipedia oldid (inventory) + official directory (addresses) + postcodes.io (coords) | 2021-01-05 inv / 2026-04-17 addr+coords | 40 open + 1 closed | Inventory + addresses + glossary + coords done. Inventory still 2021-vintage. |
| LFRS    | —                      | —              |        — | Not started   |

## Caveats

- **This is a 2021 snapshot.** The user has chosen to proceed with the 2021 GMFRS data as the working dataset for now. Since 2021, GMFRS has had station closures/mergers, fleet renewal (new Volvo pumps, new aerials), and specials re-allocations. Treat all entries as "as of 2021-01-05" — not current 2026.
- **Wikipedia is a secondary source.** Acceptable for now; replace with primary sources (CRMP, FOI disclosures, official station pages) when available.
- **Several appliance abbreviations on the source page are undefined.** These are preserved verbatim in the JSON. See `abbreviations.md` for decoded vs unverified.
- **No addresses, no coordinates.** Source did not provide them. Will need a later pass.

## Files

- `gmfrs_stations.json` — structured station + appliance data, abbreviations preserved verbatim from source.
- `abbreviations.md` — appliance/equipment abbreviation glossary (confirmed vs unverified).
- `sources.md` — bibliography.
- `gaps.md` — open questions / things to resolve before this data is usable for the sim.
