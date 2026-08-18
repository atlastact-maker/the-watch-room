# Scenario 05 — Wildfire, Saddleworth Moor

```yaml
type: wildfire_moorland
patch: Eastern
severity: major
trigger: walker reports smoke from layby; visible from A635
```

## Static facts

- **Location:** Saddleworth Moor near Wessenden Head Reservoir, OL3
- **Coords:** approx 53.553, -1.974
- **Property class:** open moorland — Peak District National Park, SSSI (Site of Special Scientific Interest), peat substrate
- **Occupants:** none on the moor; walkers possible on PROW footpaths; A635 traffic
- **Hazards:** peat fire (deep-seated, can re-burn for weeks), no road access to source, water sources limited, multi-day commitment
- **Access:** A635 Greenfield–Holmfirth road for staging; ground tracks unsuitable for standard pumps; 4×4 transport needed
- **First-due station:** G41 Mossley (1× WrL, 1× WFU)

## PRI (synthetic)

- N/A (open land).
- Local intel:
  - 2018 Saddleworth fire burned ~7 sq miles; multi-week operation; military assistance via MACA (Military Aid to the Civil Authorities).
  - Peat fires notoriously hard to extinguish; helicopter water-bombing required for any major escalation.
  - National Trust + Peak District NPA partnership protocols on file.

## METHANE — initial call

| | |
|---|---|
| **M** Major incident | Possible (escalates rapidly in summer conditions) |
| **E** Exact location | Wessenden Head, OL3 — visible smoke from A635 layby |
| **T** Type | Wildfire — moorland, ~2 hectares burning, advancing northward at moderate pace |
| **H** Peat substrate (deep-seated risk), public footpaths in area, walkers may be in vicinity |
| **A** A635 layby parking for staging; appliances transition to 4×4 only from there |
| **N** Potential walkers — none confirmed |
| **E** Fire (lead), GMP (A635 closure + walker safety), Mountain Rescue, Peak District rangers, RAF / Air Ambulance for spotting if escalates |

## Recommended PDA

| Slot | Type / capability | Notes |
|---|---|---|
| WFU 1 | WFU G41 Mossley | First wildfire team |
| Pump 1 | WrL G41 Mossley | Water relay base |
| WFU 2 | WFU G36 Bury or G40 Stalybridge | Second wildfire team |
| WFU 3 | WFU G31 Littleborough (also has BASU on station) | Reserve team |
| FDO | Group Manager from start | Wildfire = automatic |
| DIM | DIM unit G38 Ramsbottom | If any industrial waste burning, atmospheric monitoring |
| NWFC mutual aid coordination | National wildfire mutual aid via NWFC | Pre-flag if growth confirmed |

## Dynamic rolls (per playthrough)

| Roll | Distribution |
|---|---|
| `season_month` | June / July / August (summer-only scenario) |
| `weather_temp` | 20–32°C; >28°C drives rapid spread |
| `weather_wind` | direction critical — N wind threatens reservoirs; W wind threatens Greenfield village |
| `time_of_day` | matters for daylight + crew change-out + helicopter ops window |
| `public_in_area` | 40% none / 30% one walker / 20% group of walkers / 10% organised event (running club, dog walkers) |
| `spread_rate_baseline` | function of temp + wind + recent rainfall |
| `aircraft_availability` | 50% chance helicopter spotting available within 90 min |
| `multi_day_commitment` | this scenario becomes multi-day if not contained in first 4 hours |

## Escalation triggers

- "Fire reaches reservoir bank" → environmental + water supply concern; United Utilities involved.
- "Wind shifts toward Greenfield village" → evacuation planning, GMP lead, schools / care homes flagged.
- "Peat ignition confirmed" → multi-week operation; request national resilience; consider MACA escalation.
- "Walker reported missing" → mountain rescue coordination; search overlay across burn area.

## Game evaluation

Targets:
- WFU on scene: **< 30 minutes** (long ground transition)
- Containment line established: **< 4 hours of arrival**
- Public safety + evacuations triggered correctly
- Resource sustainability — don't burn out the patch on day 1

Lesson: this is not an "extinguish it" job. It's a **contain, monitor, sustain** job. Operators who deplete the patch chasing rapid suppression score worse than those who pace the response over the multi-day window.
