# Scenario 01 — AFA, Trafford Centre

```yaml
type: automatic_fire_alarm
patch: Southern
severity: low
trigger: zone activation on the mall fire panel
```

## Static facts

- **Address:** Trafford Centre, Manchester M17 8AA
- **Coords:** approx 53.4663, -2.3486
- **Property class:** super-regional shopping mall (~190,000 m² retail + leisure), multi-occupier
- **Occupants:** thousands during opening hours; 24/7 security on site
- **Access:** multiple entrances; security to meet at fire panel; service road from Barton Dock Road
- **Known hazards:** large open atriums, multiple commercial kitchens (food court), anchor stores with deep-seated stock fire risk
- **First-due station:** G10 Stretford (1× WrL, 1× TL, 1× PM with HVP / HVHL pods)

## PRI (synthetic)

- Formal PRI on file (major commercial premises).
- Sprinklers throughout; wet and dry risers in malls; multi-zone L1 detection.
- 24/7 keyholder (mall security); designated fire liaison.
- Pre-planned phased evacuation; mall has its own incident response framework integrated with NWFC.

## METHANE — initial call

| | |
|---|---|
| **M** Major incident | No |
| **E** Exact location | Trafford Centre, panel zone N3 (above John Lewis food court), M17 8AA |
| **T** Type | AFA — single zone activation; security investigating |
| **H** Hazards | Public premises occupied; commercial kitchens in zone |
| **A** Access | Service road from Barton Dock Road; security at panel |
| **N** Number of casualties | None reported |
| **E** Emergency services required | Fire only |

## Recommended PDA

| Slot | Type / capability | Notes |
|------|-------------------|-------|
| Pump 1 | WrL with ≥4 BA-trained crew | Standard AFA attendance |

## Dynamic rolls (per playthrough)

| Roll | Distribution |
|---|---|
| `time_of_day` | 60% trading hours (10:00–21:00) / 30% closed / 10% overnight cleaners |
| `alarm_reality` | 75% genuine false (steam/dust) · 15% cooking smoke · 8% small kitchen fire (food court) · 2% confirmed working fire (anchor store electrical) |
| `g10_stretford_state` | 85% pump available / 15% already mobile to a separate AFA |
| `weather_wind` | mostly irrelevant indoors |
| `if_real_fire.sprinkler_activation` | 90% containing / 10% partial / sub-rolls below |

## Escalation triggers

- "Working fire confirmed by security" → **make pumps 2**, request ALP precaution (G10's TL).
- "Smoke logging in atrium" → **make pumps 4** + HVP pod from G10.
- "Sprinkler failure in anchor store" → ALP essential; consider second pump from G13 Moss Side.

## Game evaluation

Targets:
- Time-to-mobilise: **< 90 seconds**
- First attendance: **< 10 minutes**
- Avoid over-mobilisation on confirmed false (small coverage-gap penalty if a second pump committed unnecessarily)

Lesson: trust the panel info, but the 5% that are real are why we go.
