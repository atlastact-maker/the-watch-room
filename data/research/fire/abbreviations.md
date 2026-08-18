# GMFRS appliance / equipment glossary

Authoritative source: user-supplied glossary 2026-04-17 (preserved verbatim in `gmfrs_appliance_glossary_source.md`). Earlier guesses in this file have been replaced with confirmed entries.

Call-sign convention: GMFRS uses a category letter + number per appliance type. Combined with the station identifier (e.g. G50 Bolton Central) to form full mobilisation call signs.

## Appliances

| Code   | Full name                                       | Call-sign | Notes |
|--------|-------------------------------------------------|-----------|-------|
| WrL    | Water Ladder                                    | P1 / P2   | Standard front-line pump. Most stations have one or two. |
| WrT    | Water Tower                                     | P1        | A pump variant. Source notes G58 Salford has one "(Trial Basis)" in the 2021 dataset. |
| L6P    | Light 6x6 Pump                                  | M2        | Off-road pump. At G51 Bolton North in 2021. |
| TL     | Turntable Ladder                                | A3        | Aerial. |
| HLP    | Hydraulic Platform                              | A1        | Aerial. |
| WIU    | Water Incident Unit                             | B2        | Boat / water rescue. |
| ICU    | Incident Command Unit                           | C1        | Large command vehicle. |
| CSU    | Command Support Unit                            | C2        | Smaller command vehicle. |
| OSU    | Operational Support Unit                        | C3        | Did not appear in 2021 station inventory; may have been introduced since. |
| FIU    | Fire Investigation Unit                         | F1        | Did not appear in 2021 station inventory by this exact code. |
| BASU   | Breathing Apparatus Support Unit                | S1        | |
| BFU    | Bulk Foam Unit                                  | S2        | |
| SACU   | Salvation Army Catering Unit                    | S4        | Third-party catering vehicle housed at fire stations. |
| WU     | Welfare Unit                                    | S3 / S7   | **Correction:** previously guessed "Water Unit" — actually Welfare. |
| WFU    | Wildfire Unit                                   | L2        | **Correction:** previously guessed "Welfare Unit" — actually Wildfire. Critical for moors incidents. |
| HLL    | Hose Laying Lorry & Hose Retrieval Unit         | W2        | |
| PM     | Prime Mover                                     | T6 / T7   | Pod-carrying chassis. Carries swappable pods (see below). |

## Pods (carried by Prime Movers)

| Code   | Full name                                       | Notes |
|--------|-------------------------------------------------|-------|
| EPU    | Environmental Protection Unit                   | At G36 Bury in 2021 (`PM+EPU`). |
| HVP    | High Volume Pump                                | National resilience asset. |
| HVHL   | High Volume Hose Layer                          | Pairs with HVP. |
| UTC    | USAR Timber Carrier                             | "UTC pod" at G53 Farnworth in 2021. Used by USAR for timber/shoring. |

## Technical Response

| Code   | Full name                                       | Call-sign |
|--------|-------------------------------------------------|-----------|
| TRU    | Technical Response Pump                         | R2        |
| TRU    | Technical Response Van                          | R4        |
| USAR   | Urban Search and Rescue Unit                    | R6        |
| SDU    | Search and Rescue Dog Unit                      | R9        |

## CBRN Response

| Code   | Full name                                       | Call-sign |
|--------|-------------------------------------------------|-----------|
| DIM    | Detection, Identification and Monitoring Unit   | H8        |

## Resolved typos

- `HPV` → `HVP` (High Volume Pump). The 2021 source listed `HPV` at G20 Whitehill and G33 Oldham; confirmed 2026-04-17 as a typo of `HVP`. Both entries corrected in `gmfrs_stations.json`. Note: HVP is normally a pod carried on a Prime Mover, but neither station lists a PM in the 2021 inventory — flag in `gaps.md`.

## Staffing terms (for completeness)

- **Wholetime** — full-time professional crew; station permanently crewed.
- **Day Crewed** — crewed during day hours; on-call at night.
- **Dual Crewed** — same crew operates two appliances at the station.
- **Jump Crewed** — crew jumps between primary and secondary appliance as needed.
- **On-call / Retained** — pager-alerted volunteer-pattern crew.
