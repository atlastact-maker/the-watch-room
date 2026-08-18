# Police service research — The Watch Room

## Status

| Service | Source | Snapshot date | Stations | Status |
|---------|--------|---------------|---------:|--------|
| GMP     | —      | —             | 0        | **Blocked — web access denied.** No data captured. |

## Point-in-time target

Early 2026 (task date: 2026-04-17).

## Verification summary

- Stations captured: **0**
- `station_verified: true`: **0**
- Resources captured: **0**
- `verified: true` resources: **0**

Verification rate: **N/A** — no dataset produced.

## Why empty

Per the task brief ("Method" step 3):

> If WebFetch is denied in your environment, STOP and write gaps.md
> explaining what's needed — do not fabricate from training data.

Both `WebFetch` and `WebSearch` returned "Permission to use … has been
denied" on the first attempts (against `gmp.police.uk` among others).
The authenticity bar ("Never invent") and the preferred-source order
require primary verification from GMP official pages, HMICFRS reports
and GMP FOI logs. Without access to those URLs at runtime, any station
list, ARV/TSG/dogs/NPAS base or resource count I could produce would be
recalled from training data and cannot be cited to a live source.

Rather than emit a plausible-looking but unverifiable dataset, this
research pass deliberately stops and documents the block. See
`gaps.md` for the exact list of URLs / documents needed to unblock.

## Files

- `gmp_stations.json` — empty array (placeholder; no verified entries).
- `sources.md` — bibliography, listing intended primary sources that
  could not be fetched this pass plus any that were confirmed.
- `gaps.md` — open questions and the blocking access issue.
- `abbreviations.md` — UK police terminology glossary (reference-only;
  written from standard UK policing usage, not a station dataset).

## Next pass

To unblock:

1. Grant this environment permission to call `WebFetch` on at least
   `gmp.police.uk`, `justiceinspectorates.gov.uk` (HMICFRS),
   `greatermanchester-ca.gov.uk` (Mayor / Deputy Mayor for Policing
   publications) and `npas.police.uk`; or
2. Export relevant pages / FOI PDFs to the working tree so they can
   be read via `Read`.

Once access is available, the capture loop in the brief ("What to
capture per station / base") can be executed against the 12 GMP
districts plus force-level specialist bases (firearms / TSG / dogs /
NPAS / RPU / custody).
