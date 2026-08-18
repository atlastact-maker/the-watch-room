# Scenario 07 — High-rise dwelling fire, Salford Quays

```yaml
type: high_rise_dwelling_fire
patch: Western
severity: major
trigger: 999 call from resident on phone trapped in flat; smoke logging in lobby
```

## Static facts

- **Address:** Quay Heights (synthetic name), Salford Quays, Salford M50
- **Coords:** approx 53.473, -2.292
- **Property class:** 22-storey residential tower, ~150 flats, single staircase, modern (post-Grenfell) cladding compliant (A2 limited combustibility)
- **Occupants:** ~300 residents, mixed demographic
- **Hazards:** sealed glazing reduces ventilation; lift in fire mode (operable by fire service only); dry rising main inlet at ground floor north corner
- **Access:** front entrance off main road; service yard to rear; appliance access on three sides; helipad 200 m away
- **First-due station:** G58 Salford (1× WrL, 1× WrT, 1× SACU)
- **Required specials:** ALP — HLP from G50 Bolton Central

## PRI (synthetic)

- Formal PRI (statutory — high-rise residential).
- Building plans on file at NWFC; lift override controls; dry rising main inlet location annexed.
- Building management — 24/7 concierge.
- **Stay-put policy** for unaffected flats while compartmentation holds.
- Pre-planned evacuation chain if compartmentation compromised.
- Vulnerable persons register (kept by managing agent) — request via concierge on arrival.

## METHANE — initial call

| | |
|---|---|
| **M** Major incident | Possible (depending on compartmentation) |
| **E** Exact location | Quay Heights, Salford Quays M50 — Flat 12B, 12th floor |
| **T** Type | Flat fire — smoke logging in lobby on that floor; resident trapped in flat |
| **H** High-rise; dry rising main available; lift override needed; vulnerable persons register held by concierge |
| **A** Main entrance for BA bridgehead; rear service yard for ALP setup |
| **N** 1 confirmed resident trapped in Flat 12B (on phone with control); unknown others on adjacent floors |
| **E** Fire (lead), NWAS (multiple stand-by), GMP (cordon + traffic), local authority |

## Recommended PDA

| Slot | Type / capability | Notes |
|---|---|---|
| Pump 1 | WrL G58 Salford | First BA team to bridgehead floor |
| Pump 2 | WrT G58 Salford | Second BA team + dry riser pumping |
| Pump 3 | WrL G59 Broughton or G60 Agecroft | Bridgehead support, RIT |
| ALP | HLP G50 Bolton Central | Primary aerial rescue |
| FDO | Group Manager from start | High-rise = automatic |
| BASU | from G31 Littleborough | Long range — pre-flag ETA early |

Likely to escalate to **make pumps 4** at minimum; **make pumps 8 + 2 ALPs** if persons reported confirmed.

## Dynamic rolls (per playthrough)

| Roll | Distribution |
|---|---|
| `time_of_day` | random — night = harder evacuation, fewer informed residents |
| `fire_origin` | 40% kitchen / 30% electrical (charger fault) / 20% candle / 10% deliberate |
| `compartmentation_intact` | 80% yes (saves the rest of the block) / 20% breached (smoke up shaft / through ducts) |
| `dry_riser_serviceable` | 95% yes / 5% damaged or blocked (operator must improvise hose run) |
| `vulnerable_residents_identified` | 25% chance an elderly / mobility-restricted resident on a floor needs assisted evacuation |
| `stay_put_holds` | function of `compartmentation_intact` — if breached, full evac becomes mandatory |

## Escalation triggers

- "Compartmentation breach" → consider **full evacuation**, **make pumps 8**, second ALP.
- "Persons in flat unconscious" → BA snatch rescue, additional BA teams.
- "Smoke to upper floors" → simultaneous evacuation + protect-in-place split.
- "Lift mechanism failure" → BA fatigue increases dramatically (climbing 12 storeys in BA).

## Game evaluation

Targets:
- Bridgehead established: **< 20 minutes** from arrival
- BA crews managed correctly (rotation, BASU staging)
- Stay-put advice maintained as long as compartmentation holds (over-evacuating can itself cause harm)
- Decision made in time if escalation needed
- No firefighter casualty (BASU + bridgehead discipline)

Lesson: high-rise discipline is the opposite of dwelling fire instinct. Methodical bridgehead, BA rotation, **trust the building** until it stops being trustworthy. Operators who rush to evacuate everyone immediately score worse than those who pace and escalate appropriately.
