# Scenarios — index

All ten drafted 2026-04-18. Approved set: index + worked example (#02) signed off; remaining nine drafted in the same format.

| #  | Title                                                  | Patch    | Type                          | Severity | File |
|----|--------------------------------------------------------|----------|-------------------------------|----------|------|
| 01 | AFA — Trafford Centre, retail                          | Southern | Automatic Fire Alarm          | low      | [01_afa_trafford_centre.md](01_afa_trafford_centre.md) |
| 02 | House fire, persons reported — Wythenshawe semi (3am)  | Southern | Dwelling fire, persons rpt'd  | high     | [02_dwelling_fire_wythenshawe.md](02_dwelling_fire_wythenshawe.md) |
| 03 | RTC entrapment — M61 J6 northbound                     | Western  | Road Traffic Collision        | high     | [03_rtc_m61_j6.md](03_rtc_m61_j6.md) |
| 04 | Industrial fire — plastics warehouse, Trafford Park    | Southern | Commercial / industrial fire  | major    | [04_industrial_trafford_park.md](04_industrial_trafford_park.md) |
| 05 | Moorland fire — Saddleworth Moor, summer               | Eastern  | Wildfire                      | major    | [05_wildfire_saddleworth.md](05_wildfire_saddleworth.md) |
| 06 | Chemical leak — rail freight, Stockport                | Southern | HAZMAT                        | high     | [06_chemical_stockport_rail.md](06_chemical_stockport_rail.md) |
| 07 | High-rise fire — Salford Quays apartment block         | Western  | High-rise dwelling fire       | major    | [07_high_rise_salford_quays.md](07_high_rise_salford_quays.md) |
| 08 | School fire — secondary school, Bury (evening)         | Eastern  | Commercial premises fire      | moderate | [08_school_bury.md](08_school_bury.md) |
| 09 | Water rescue — person in River Irwell, Salford         | Western  | Special service — water       | high     | [09_water_rescue_river_irwell.md](09_water_rescue_river_irwell.md) |
| 10 | Hospital alarm — Royal Bolton Hospital                 | Western  | Healthcare premises           | moderate | [10_hospital_royal_bolton.md](10_hospital_royal_bolton.md) |

Coverage:
- **Patches:** 4 Southern · 2 Eastern · 4 Western
- **Types:** 1 AFA, 1 dwelling, 1 high-rise, 1 industrial, 1 wildfire, 1 chemical, 1 RTC, 1 school, 1 water rescue, 1 healthcare
- **Severity:** 1 low · 2 moderate · 4 high · 3 major
- **Time-of-day mix:** #02 night-locked, #08 evening-locked, #05 summer-only; others roll per playthrough

User actions:
1. Read each scenario file. Flag any tone, content, or detail you want changed before they're wired into the engine.
2. Approve, and I'll start the engine build (incident model → deployment UI → OSRM ETA → map ghost movers).
