# Scenario 02 — House Fire, Persons Reported, Wythenshawe

```yaml
type: dwelling_fire_persons_reported
patch: Southern
severity: high
trigger: 999 call from neighbour reporting smoke and shouting
```

## Static facts

- **Address:** 14 Hollyhedge Road, Wythenshawe, Manchester (synthetic address; postcode area M22)
- **Coords:** approx 53.3855, -2.2620
- **Property class:** 1950s council-built semi-detached, 2 storeys, brick cavity wall, slate roof, ~95 m²
- **Occupants on register:** family of four — adults 38 and 41, children 8 and 5
- **Vulnerabilities:** child 5 has a hearing impairment (slower to wake to alarm)
- **Access:** driveway clear, road access fine, dropped kerb; cars commonly parked both sides of road
- **Known hazards on premises:**
  - Gas meter inside cupboard under stairs
  - No asbestos register (residential)
  - Loft converted to bedroom (non-conforming, single staircase)
- **First-due station:** G15 Wythenshawe (2× WrL, wholetime)

## PRI (synthetic)

- No formal PRI (not high-risk premises by class).
- Local intel flag: same street had a fatal house fire in 2019; local commanders prefer 4-pump make-up if persons confirmed.

## METHANE — initial call

| | |
|---|---|
| **M** Major incident | No |
| **E** Exact location | 14 Hollyhedge Road, M22 — neighbour at no. 16 has called |
| **T** Type | House fire — smoke from upper windows, neighbour heard shouting |
| **H** Hazards | Gas meter believed inside, parked cars on road |
| **A** Access | Driveway clear, no width restriction |
| **N** Number of casualties | Unknown — family of 4 believed inside, 02:34 night call |
| **E** Emergency services required | Fire, ambulance running, police TBC for cordon |

## Recommended PDA

| Slot         | Type / capability                    | Notes |
|--------------|--------------------------------------|-------|
| Pump 1       | WrL with ≥4 BA-trained crew          | First in attendance — primary BA team |
| Pump 2       | WrL with ≥4 BA-trained crew          | Second BA team, second jet, search |
| Aerial       | HLP or TL                            | Precaution; rescue platform if upper-floor casualty |
| FDO          | Group Manager / Flexi-Duty Officer    | Persons reported triggers FDO |
| Ambulance    | NWAS (auto-mobilised)                | Casualty handling |
| Police       | GMP (auto-mobilised)                 | Cordon, traffic |

## Dynamic rolls (per playthrough)

| Roll                        | Distribution |
|-----------------------------|--------------|
| `time_of_day`               | Fixed at 02:34 — night call |
| `persons_reality`           | 33% all out / 33% one inside (upstairs back bedroom) / 34% two inside (one unconscious in loft) |
| `weather_wind`              | 60% light / 30% moderate / 10% strong |
| `weather_precipitation`     | 70% dry / 25% drizzle / 5% rain |
| `fire_origin`               | 50% kitchen (chip-pan) / 30% lounge (electrical) / 20% upstairs (cigarette) |
| `fire_spread_rate`          | Function of `weather_wind` and `fire_origin`; faster if wind strong + kitchen origin |
| `neighbour_exposure_clock`  | Spreads to no. 16 (attached side) at ~15 min if not knocked down |
| `g15_wythenshawe_state`     | 80% both pumps available / 20% one pump already mobile to a separate AFA (forces second pump from G14 Withington or G13 Moss Side) |

## Escalation triggers

- "Persons confirmed inside" → make pumps **4** (from 2). Operator should auto-suggest second-due pumps.
- "Fire spreading to attached property" → ALP becomes essential; consider **6 pumps**.
- "BA crew issue distress signal" → mandatory BA support unit (BASU from G31 Littleborough — note long ETA from Eastern patch).

## Game evaluation

Targets:
- Time-to-mobilise first pump: **< 90 seconds**
- First pump in attendance: **< 10 minutes**
- BA in to property: **< 14 minutes** for survivable casualty
- Stop message: depends on outcome

Scoring weights (using the rubric in `../sim_design.md`):
- Time to mobilise + time to attendance dominate
- Casualty outcome dominated by time-to-BA-in
- Property loss penalty if no aerial when fire spreads to second floor / loft
- Neighbour exposure penalty if no. 16 catches fire

## Notes for the engine

- This scenario should be marked as a "training cornerstone" — its PDA logic is the template for all dwelling-fire-persons-reported runs.
- The `child has a hearing impairment` detail should appear in the property tab as a "vulnerable person" amber flag, even though it doesn't change PDA — it changes how the player interprets time pressure.
