# Scenario 06 — Chemical leak, Stockport rail freight depot

```yaml
type: hazmat_chemical_leak
patch: Southern
severity: high
trigger: site control alarm; staff exposure; rail authority paged simultaneously
```

## Static facts

- **Location:** Stockport rail freight terminal (synthetic location), Stockport SK1
- **Coords:** approx 53.408, -2.149
- **Type:** chemical spill / leak from tank wagon
- **Property:** rail freight yard — intermodal containers and tank wagons; 25 kV OLE overhead
- **Hazards:** tank wagon Hazchem panel reads **3YE** (inflammable liquid, water-pollutant, evacuation considered); OLE traction current; drainage runs to River Mersey
- **Access:** rail authority controls site entry; track presence is hazard; security gate
- **First-due station:** G23 Offerton (1× WrL)
- **Required specials:** DIM H8 from G38 Ramsbottom (long ETA from Eastern), EPU pod from G36 Bury PM

## PRI (synthetic)

- Formal PRI — rail freight site.
- Multi-product handling; specific Hazchem panels per consignment.
- Site emergency plan integrated with Network Rail incident protocol.
- 24/7 site liaison; rail isolation procedure (OLE down + traction current off, typical 15–20 min).
- Drain plan annexed; bunding points on site.

## METHANE — initial call

| | |
|---|---|
| **M** Major incident | Possible (depending on dispersion + ignition) |
| **E** Exact location | Stockport rail freight terminal, SK1 — siding 4 |
| **T** Type | Chemical leak — tank wagon Hazchem 3YE; fluid pooling on ballast; vapour visible |
| **H** Inflammable liquid, ignition control critical, OLE 25 kV overhead, drainage to River Mersey |
| **A** Site security gate on Lancashire Hill; OLE isolation in progress (Network Rail confirms 15–20 min) |
| **N** 2 site staff exposed to vapour, both walking wounded but symptomatic |
| **E** Fire (lead, HAZMAT), NWAS (decon), GMP (cordon), Network Rail, Environment Agency, public health (UKHSA) |

## Recommended PDA

| Slot | Type / capability | Notes |
|---|---|---|
| Pump 1 | WrL G23 Offerton | Cordon, BA precaution, casualty stand-off |
| DIM | H8 from G38 Ramsbottom | Chemical ID confirmation; substance verification beyond Hazchem panel |
| EPU pod | PM with EPU from G36 Bury | Bunding, absorbents, drain protection |
| HAZMAT advisor | NILO from FDO pool | Tactical / strategic advice |
| Pump 2 | WrL G14 Withington (Stockport closed; nearest Southern) | Second cordon team |
| FDO | Group Manager from start | HAZMAT = automatic |

## Dynamic rolls (per playthrough)

| Roll | Distribution |
|---|---|
| `time_of_day` | 50% day (more staff exposure risk) / 50% night (skeleton crew) |
| `substance_within_3YE` | rolls between acetone / toluene / methanol — affects volatility, toxicity, water hazard |
| `ignition_proximity` | 70% no nearby ignition / 20% diesel locomotive within 50 m / 10% adjacent passenger line passing during incident |
| `weather_wind` | dispersion direction matters — residential SW |
| `network_rail_isolation_speed` | 70% within 20 min / 30% delays to 45 min |
| `run_off_to_river_chance` | 30% chance Mersey contamination if EPU not deployed in time |
| `casualty_severity_progression` | exposure rolls — light irritation → moderate respiratory → severe |

## Escalation triggers

- "Vapour cloud drifting toward residential" → JESIP-led evacuation; multi-agency coordination at Strategic level.
- "Ignition source detected" → **make pumps 6**, foam ready, withdraw to safe distance.
- "River pollution confirmed" → EA leads recovery; fire in support; environmental cost to score.
- "Second tank involved" → escalate to mass casualty potential; consider closure of major routes.

## Game evaluation

Targets:
- DIM on scene: **< 40 minutes** (acknowledge long Eastern→Southern transit)
- Cordon set correctly — initial 75 m for unknown inflammable; expand on substance ID
- Decon set up before first casualty arrives at safe zone
- River pollution control attempt logged early
- JESIP coordination cleanly handed over to police strategic lead

Lesson: chemical incidents are **about waiting for information**. The first 20 minutes are setup and intel-gathering; the worst operators commit too much too soon and either contaminate kit or miss the right substance-specific response.
