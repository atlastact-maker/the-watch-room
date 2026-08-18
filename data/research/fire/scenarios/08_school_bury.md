# Scenario 08 — School fire, secondary school, Bury (evening)

```yaml
type: education_premises_fire
patch: Eastern
severity: moderate
trigger: caretaker activates alarm + 999 call; sprinkler activation in tech block
```

## Static facts

- **Address:** Hawthorne Brook High School (synthetic), Manchester Road, Bury BL9 9XX
- **Coords:** approx 53.591, -2.305
- **Property class:** 1970s secondary school complex — 3-storey main block, separate sports hall and tech block, ~9,000 m² footprint
- **Occupants:** out-of-hours — caretaker on site, evening swimming club using sports hall (~25 swimmers + 2 instructors)
- **Hazards:** chemistry lab on second floor of main block (acids, flammables); IT server room adjacent; sports hall pool plant (chlorine in plant room)
- **Access:** main car park front; service yard rear (locked, caretaker has keys); fire panel in main reception
- **First-due station:** G36 Bury (1× WrL, 1× PM+EPU, 1× WFU)

## PRI (synthetic)

- Formal PRI (large education premises).
- Sprinklers in main block only; **not in older tech block** — significant.
- Wet rising main main entrance; dry rising main tech block.
- Caretaker holds keys; LA emergency contact via switchboard.
- Chemistry lab inventory annexed (acids, flammables).
- Pool plant emergency stop in plant room; chlorine isolation valve.

## METHANE — initial call

| | |
|---|---|
| **M** Major incident | No |
| **E** Exact location | Hawthorne Brook High School, Manchester Road BL9 9XX — tech block, ground floor design tech room |
| **T** Type | Smoke from tech block; fire visible in design tech room — caretaker activated alarm and called |
| **H** Chemistry lab on opposite block (separate fire compartment); IT server room adjacent; swimming club in sports hall (separate block); pool chlorine in plant room |
| **A** Main car park clear; tech block from rear yard (caretaker meeting on arrival) |
| **N** 25 swimmers + 2 instructors evacuating sports hall as precaution; caretaker out |
| **E** Fire (lead), NWAS (precaution), GMP (traffic + parents arriving), local authority duty officer |

## Recommended PDA

| Slot | Type / capability | Notes |
|---|---|---|
| Pump 1 | WrL G36 Bury | First attack tech block |
| Pump 2 | WrL G37 Whitefield or G34 Hollins | Support, second jet |
| ALP | HLP G50 Bolton Central | Long ETA — only Western/Eastern aerial available |
| FDO | Group Manager | Commercial premises + school = automatic |

Likely **make pumps 4** if working fire confirmed.

## Dynamic rolls (per playthrough)

| Roll | Distribution |
|---|---|
| `time_of_day` | fixed evening (18:00–21:00) — swimming club active |
| `fire_origin` | 50% electrical in design tech (lathe / kiln) / 30% deliberate (lit through window) / 20% kitchen kit smouldering |
| `spread_to_chemistry_block` | 15% chance — separate block but air-bridge connects |
| `spread_to_servers_room` | 30% chance — adjacent to design tech |
| `swimmers_evacuated_speed` | 70% smoothly / 20% one fainter or panic / 10% one missing in changing rooms |
| `parents_arriving` | 60% within 20 min — significant traffic + welfare issue |

## Escalation triggers

- "Spread to chemistry block" → multi-pump, evacuation extended, DIM if fumes detected.
- "Server room involved" → CO2 suppression, electrical isolation, IT recovery considerations.
- "Parents arriving en masse" → GMP welfare cordon, school plan invoked, LA duty officer essential.
- "Swimmer missing in changing rooms" → BA snatch search of pool block.

## Game evaluation

Targets:
- Pupils + staff accounted for early — welfare scoring is significant
- Tech block fire knocked down before chemistry exposure
- Parents managed (GMP role) — **penalty if fire crews dragged into welfare** (it's not their job)
- Property loss minimised

Lesson: school fires out-of-hours are mostly about **controlling the people response** — parents, head teacher, governors, media. Operators who let fire crews get sucked into welfare instead of firefighting score worse.
