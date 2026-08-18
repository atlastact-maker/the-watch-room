# Scenario 10 — Hospital alarm, Royal Bolton Hospital

```yaml
type: healthcare_premises_fire_alarm
patch: Western
severity: moderate
trigger: ward alarm zone activation; staff cooking pantry smoke vs. real
```

## Static facts

- **Address:** Royal Bolton Hospital, Minerva Road, Bolton BL4 0JR
- **Coords:** approx 53.555, -2.434
- **Property class:** large district general hospital, 700+ beds, multiple buildings (Block A admin, Block B outpatients, Block C inpatient wards, Block D ITU/theatres)
- **Occupants:** thousands — patients, staff, visitors; many critical-care patients non-ambulant
- **Hazards:** medical gases (oxygen, nitrous oxide), pharmacy controlled drugs, MRI suite, lifts in fire mode
- **Access:** multiple entrances; trust fire team meets on arrival; helipad on site
- **First-due station:** G53 Farnworth (2× WrL, 1× BFU, 1× PM with UTC pod) — closest to BL4
- **Second-due:** G50 Bolton Central (2× WrL, 1× HLP, 2× PM with HVP / HVHL pods)

## PRI (synthetic)

- Formal PRI on file (statutory — healthcare premises).
- Detailed building plans, evacuation zones, fire compartments by ward.
- Trust fire team and hospital fire safety officer (24/7).
- **Staged evacuation policy:**
  - **Stage 1:** defend in place + investigate.
  - **Stage 2:** horizontal evacuate to next compartment.
  - **Stage 3:** vertical evacuate down (lower floor of same block).
  - **Stage 4:** full evacuation (last resort).
- Critical care has standby ambulances + theatre evacuation chain pre-planned with NWAS.

## METHANE — initial call

| | |
|---|---|
| **M** Major incident | Possible (depending on real / size) |
| **E** Exact location | Royal Bolton Hospital, Minerva Road BL4 0JR — Block C, 3rd floor, ward 19 |
| **T** Type | Fire alarm activation Block C 3rd floor; smoke reported by staff in pantry area |
| **H** Patients in adjacent wards (frail elderly), oxygen lines, medication trolleys |
| **A** Block C entrance via Minerva Road; trust fire officer meeting on arrival |
| **N** None reported as casualty; staff evacuating ward to adjacent compartment as Stage 2 precaution |
| **E** Fire (lead), Trust fire officer co-coordinating, NWAS liaison (already on site) |

## Recommended PDA

| Slot | Type / capability | Notes |
|---|---|---|
| Pump 1 | WrL G53 Farnworth | First BA team |
| Pump 2 | WrL G53 Farnworth | Second BA team (G53 has two pumps) |
| Pump 3 | WrL G50 Bolton Central | Bridgehead support, RIT cover |
| ALP | HLP G50 Bolton Central | Aerial precaution |
| FDO | Group Manager from start | Healthcare = automatic |
| Trust fire team | integrated on arrival | Hospital has its own first response — work with them, not over them |

## Dynamic rolls (per playthrough)

| Roll | Distribution |
|---|---|
| `time_of_day` | random — night = lower visitor density but reduced staff |
| `alarm_reality` | 50% genuine false (staff pantry kettle / toaster) · 30% small fire (toaster on fire, contained) · 15% medium fire (electrical fault in equipment) · 5% serious fire (linen store / patient bed) |
| `affected_ward_vulnerability` | function of which ward — ITU (highest) → frail elderly → general medical → outpatient |
| `evacuation_complexity` | function of ward + time-of-day |
| `nwas_availability` | NWAS local availability affects any onward patient transfer needs |

## Escalation triggers

- "Working fire confirmed" → **make pumps 4**, ALP into position, full PDA executed.
- "Smoke logging in compartment" → trigger **Stage 2** evacuation (horizontal to next compartment).
- "Compartment breach" → **Stage 3** evacuation (vertical, down a floor).
- "Critical care affected" → ambulance escalation, theatre evacuation chain triggered, hospital declared Major Incident with NWAS.

## Game evaluation

Targets:
- Joint working with trust fire team — **don't bypass them** (they hold the building knowledge)
- Evacuation stages followed correctly — **don't over-react** (moving frail patients is itself a risk)
- Patient welfare paramount
- Compartmentation maintained where possible
- Smooth handover to trust fire safety advisor at incident close

Lesson: hospitals are the only premises where the **default response is NOT evacuation**. Staged response is the law. Operators who default to "get everyone out" without working with the trust score badly.
