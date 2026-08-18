# Scenario 09 — Water rescue, person in River Irwell, Salford

```yaml
type: special_service_water_rescue
patch: Western
severity: high
trigger: 999 call from bystander on Lowry footbridge
```

## Static facts

- **Location:** River Irwell at the Lowry footbridge, Salford Quays M50 (river runs along the Quays)
- **Coords:** approx 53.475, -2.299
- **Type:** water rescue — person in water
- **Hazards:** cold water (~8 °C April), tidal influence near Manchester Ship Canal, weirs upstream and 400 m downstream, debris, contaminated water (CSO discharge)
- **Access:** Quayside walkways both sides; bridge above; bank constrained in places by railings and moorings
- **First-due station:** G61 Eccles (1× WrL, 1× WIU) — water unit on the patch
- **Other resources:** G58 Salford pump for support, TRU R57 from G57 Leigh (water-rescue trained), MWMRT (Manchester Water Mountain Rescue) if escalation

## PRI (synthetic)

- N/A (open water).
- Local intel:
  - River Irwell at Lowry is a known suicide-attempt location; mental-health response important.
  - Salford Quays water has cold-shock risk year-round.
  - Downstream weir at Mode Wheel Locks ~400 m — strong recovery hazard.

## METHANE — initial call

| | |
|---|---|
| **M** Major incident | No |
| **E** Exact location | River Irwell at Lowry footbridge, Salford Quays M50 |
| **T** Type | Person in water — adult male, struggling, ~30 m from bridge, drifting downstream |
| **H** Cold water shock, current toward weir 400 m downstream, debris in water |
| **A** Quayside both sides; vehicles can reach Imperial War Museum side first |
| **N** 1 in water; bystanders shouting from bridge |
| **E** Fire (water rescue), NWAS (HART for cold-water casualty), GMP (mental-health support, cordon), MWMRT (potentially) |

## Recommended PDA

| Slot | Type / capability | Notes |
|---|---|---|
| WIU | B61B2 from G61 Eccles | Primary water-rescue team + boat |
| Pump 1 | WrL G61 Eccles | Bank rescue, throwlines, support |
| Pump 2 | WrL G58 Salford | Additional bank support, both sides |
| Rescue team | TRU R57 G57 Leigh | Water-rescue trained, shore safety |
| FDO | Group Manager | Special service with life risk |

## Dynamic rolls (per playthrough)

| Roll | Distribution |
|---|---|
| `time_of_day` | random — affects bystander count, lighting, helicopter availability |
| `weather` | rain / wind affects spotting + recovery |
| `casualty_state` | 30% conscious + responsive / 40% conscious + cold-shock (paralysing) / 20% unconscious afloat / 10% submerged |
| `drift_speed` | function of recent rainfall — faster after rain |
| `bystander_in_water` | 10% chance — well-meaning bystander entered water, second casualty |
| `weir_proximity_clock` | casualty drifts 400 m to Mode Wheel Locks weir in ~12 min in moderate flow |

## Escalation triggers

- "Casualty submerged" → switch to recovery mode; body recovery team; dive resources via MWMRT.
- "Bystander entered water" → multi-casualty; second WIU or boat needed.
- "Casualty past weir" → downstream tactics; helicopter request via NPAS.
- "Casualty status: deceased" → handover to GMP; Salford Coroner.

## Game evaluation

Targets:
- WIU on scene: **< 12 minutes** for survivable rescue
- Live casualty recovered before weir
- Bystander control (don't let them enter the water themselves)
- Cold-water management (HART involvement; rapid warming)

Lesson: water rescues are time-critical and **bystander management** is half the job. Operators who don't think about secondary casualty risk (well-meaning members of the public) score worse.
