# Scenario 04 — Industrial fire, plastics warehouse, Trafford Park

```yaml
type: industrial_fire
patch: Southern
severity: major
trigger: 999 call from neighbouring unit; smoke plume visible from M60
```

## Static facts

- **Address:** Albright Plastics Ltd (synthetic), Mosley Road, Trafford Park, Manchester M17 1FE
- **Coords:** approx 53.4694, -2.3284
- **Property class:** large industrial unit, ~8,000 m² portal frame, 12m roof clearance, plastic injection moulding
- **Occupants:** two-shift operation — night shift 12 staff, day shift 80
- **Hazards:** bulk polypropylene granulate (~1,500 t), polyurethane foam stock, hydraulic oil (2,000 L), plant oil (800 L), nitrogen + acetylene cylinders in maintenance bay
- **Access:** yard with HGV turning circle; one main door, two emergency egresses; service road via Trafford Wharf Road
- **First-due station:** G10 Stretford (1× WrL, 1× TL, 1× PM with HVP / HVHL pods)

## PRI (synthetic)

- Formal PRI on file (industrial; possibly COMAH lower-tier depending on stock).
- Bulk polypropylene granulate — high calorific value, runs molten when burning.
- Compressed nitrogen + acetylene in identified maintenance bay.
- Hydraulic fluid + plant oil tanks in plant room with bunding.
- Sprinklers throughout but rated only for ordinary hazard (Class A) — not bulk plastic specific.
- Smoke vents in roof, automatic with manual override at panel.
- 24/7 emergency contact via duty manager number; site plan annexed.

## METHANE — initial call

| | |
|---|---|
| **M** Major incident | Possible — large smoke plume visible from M60 |
| **E** Exact location | Albright Plastics, Mosley Road, Trafford Park, M17 1FE |
| **T** Type | Working fire — heavy smoke from roof vents; sprinklers activated; fire reported in raw material storage |
| **H** Bulk plastics, hydraulic oil, gas cylinders in maintenance bay; egress routes need confirming |
| **A** Yard access via Trafford Wharf Road; second appliance route Mosley Road |
| **N** 2 shift workers unaccounted for — last seen in dispatch office |
| **E** Fire (large), NWAS (precaution), GMP (smoke-plume cordon), Environment Agency (run-off concern), local authority |

## Recommended PDA

| Slot | Type / capability | Notes |
|---|---|---|
| Pump 1 | WrL G10 Stretford | First-attack BA team |
| Pump 2 | WrL G13 Moss Side | Second BA + RIT cover |
| ALP | TL G10 Stretford | Roof / smoke-vent management, water tower if needed |
| HVP pod | PM G10 Stretford with HVP | Sustained water for bulk fire |
| BFU | from G11 Sale or G53 Farnworth | Foam for plastic / oil fire |
| FDO | Group Manager | Industrial = automatic; major = brigade manager possible |
| Make pumps | 6 likely on confirmation | Pre-flag G14 Withington, G15 Wythenshawe |

## Dynamic rolls (per playthrough)

| Roll | Distribution |
|---|---|
| `time_of_day` | 50% night shift (12 staff, simpler evac) / 50% day shift (80 staff, complex) |
| `ignition_source` | 30% electrical machinery / 30% friction in granulate hopper / 25% smoking near solvent / 15% deliberate |
| `sprinkler_effectiveness` | 70% containing in raw material area / 20% partial / 10% failed (overwhelmed by load) |
| `gas_cylinder_exposure_clock` | BLEVE risk window opens at ~25 min if fire reaches maintenance bay |
| `weather_wind` | direction + speed — affects smoke plume drift (M60, residential west of site) |
| `staff_unaccounted_truth` | 30% one missing / 30% two missing / 30% all out / 10% three missing |

## Escalation triggers

- "BLEVE risk identified" → **200 m cordon**, evacuate adjacent units, withdraw firefighters from blast zone.
- "Staff confirmed inside" → BA snatch rescue, additional BA teams, BASU from G31 Littleborough (long range — flag ETA early).
- "Sprinkler failed" → **make pumps 8**, HVP setup essential, second HVHL.
- "Smoke plume affecting M60" → Highways closure / partial closure request.

## Game evaluation

Priorities:
- Cylinder management — get the cordon right early
- HVP setup time critical for sustained suppression of bulk plastic fire
- Environmental run-off control (BFU + EPU pod, not just water)
- Don't lose anyone in the cylinder zone — withdraw if BLEVE clock active

Targets:
- First attendance: **< 10 minutes**
- HVP in operation: **< 35 minutes**
- BA snatch (if staff inside): **< 18 minutes** of arrival
