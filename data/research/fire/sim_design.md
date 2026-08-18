# The Watch Room — sim design

Living document. Last updated 2026-04-18.

## 1. Incidents

### Source
- 10 hand-built scenarios, each in `data/research/fire/scenarios/NN_slug.md`.
- Approved by the user before being wired into the engine.
- Each playthrough rolls dynamic modifiers so the same scenario plays differently.

### Scenario file shape
```
# Scenario NN — short title
type: <e.g. dwelling_fire_persons_reported>
patch: Southern | Eastern | Western
severity: low | moderate | high | major
trigger: <how the call comes in>

## Static facts
- address, postcode, coords
- property class, storeys, occupants, materials
- access details
- known hazards (e.g. gas meter location)
- nearby risk (synthetic PRI content)

## METHANE call (initial)
- M / E / T / H / A / N / E

## Recommended PDA (Pre-Determined Attendance)
- e.g. 2 pumps, 1 ALP, 1 FDO

## Dynamic rolls (per playthrough)
- time_of_day: fixed | random_window
- persons_reality: probabilities of true / inflated / deflated
- weather: probabilities of dry / rain / wind
- fire_spread_rate: function of weather + property
- escalation_triggers: condition → consequence
- resource_strain: probability of nearby station already mobile

## Scoring rubric
- attendance standards (mobilise time, time-on-scene)
- casualty outcome
- property loss %
- coverage left at end (gap risk)
```

### Hydrants
- Synthetic generator places ~3–8 plausible hydrants within 250m of each incident address (clustered along junctions / road centrelines).
- Each hydrant has a flow-rate band (low / standard / high) and a flag for "in-use already" so the operator must choose alternatives.

### PRIs (Premises Risk Information)
- Modelled on real PRI structure; content authored synthetically.
- Schema: substances, structural concerns, evacuation, vulnerable persons, isolation points, contact list, plan attachment ref.

## 2. Deployment

### Capability tags (per appliance / crew)
`BA` · `RTC_extrication` · `WaterRescue` · `Rope` · `USAR` · `HAZMAT_DIM` · `Wildfire` · `Aerial` · `Foam` · `Command`.

Tag inferred from appliance type defaults (e.g. WrL → `BA`; TRU pump → `BA + RTC_extrication + Rope`; DIM → `HAZMAT_DIM`); per-appliance overrides allowed later.

### Requirements per incident
Derived from incident type + property + risks. Scenario file states the recommended slots; the engine fills additional capability requirements from PRIs.

### UX
- One-click mobilise. No confirm modal.
- Suggestion list per slot, sorted by ETA, with capability ticks.
- Click → status flips to **1 (Mobile)**, ghost marker travels station → incident on the map.
- On arrival → **2 (In attendance)**.
- Over-mobilising is allowed. The bottom of the screen gets a soft strain indicator (e.g. "Coverage gap: G50 ground unattended").

### ETA
- **OSRM** (`router.project-osrm.org/route/v1/driving/<lon>,<lat>;<lon>,<lat>?overview=false`) for road routing.
- Fallback: haversine × 35 mph if OSRM is unreachable.
- Cache routes in memory per (station_id, incident_id) to avoid re-querying.

## 3. Status codes (UK fire service mobilising)

`1` Mobile to incident · `2` In attendance · `3` Stop message sent · `4` Returning to station · `5` At hospital · `6` Mobile and available · `7` Available at station · `8` Off the run.

## 4. Scoring (per incident)

| Factor                         | Weight | Notes |
|--------------------------------|--------|-------|
| Time to mobilise               | high   | target < 90s |
| Time to first attendance       | high   | target < 10 min for life risk |
| Time to BA in                  | high   | target < 14 min for survivable casualty |
| PDA conformance                | medium | meet recommended slots |
| Casualty outcome               | high   | function of timeliness + capability |
| Property loss %                | medium | function of fire spread vs. response |
| Neighbour exposure protected   | medium | for terraced / attached |
| Coverage gap left in patch     | low    | over-mobilisation cost |

Aggregated to a per-shift score and a per-campaign rolling average.

## 5. Resource lifecycle model (added 2026-04-18)

Resources are **named units**, not a pool. Each unit lives through a lifecycle across the shift.

### Named statuses (UI labels; internal codes in brackets)

- **Available** (7) — at base, free to dispatch.
- **Mobile** (1) — committed to a call, in transit.
- **On scene** (2) — at the incident.
- **Returning** (4) — heading back to base.
- **Off-run** (8) — unavailable (defect / welfare / training / rehab / end of shift).
- **Transferred** (T) — temporarily sent to another sector. *Not yet modelled.*

### Pre-shift state

At shift start, the sim instantiates each unit individually and rolls an initial state:

- Most units → `Available` at base.
- Some → `Committed` to a pre-existing job (procedurally placed). e.g. a DCA turning back from a morning offload, a fire pump returning from an earlier AFA.
- 1–2 → `Off-run` (defect, welfare, training).

A per-shift **intensity** parameter tunes the distribution:

| Intensity | Available | Committed | Off-run |
|-----------|-----------|-----------|---------|
| Quiet     | ~95%      | ~3%       | ~2%     |
| Normal    | ~80%      | ~15%      | ~5%     |
| Busy      | ~55%      | ~40%      | ~5%     |

### During-shift dynamics

- **Commitment** — a dispatched unit is out of the pool until the job is done *and* the unit returns.
- **Hospital offload** (ambulance) — DCAs arriving at ED may be held 30 min – 3 hrs based on hospital pressure. Model directly as the biggest real-world resource drain in UK ambulance.
- **Refuel / rehab** (fire) — after heavy operations, appliances return to base and are off-run ~20–30 min for refuel / rehab / kit replacement.
- **Welfare** (all services) — crews on extended incidents need breaks. Operator stands them down when they choose; ignoring welfare degrades responsiveness.
- **Defects** — occasional random removal of a unit. Rare but realistic.
- **Hand-back** — at shift end, units still returning become unavailable to the current shift; scoring reflects the state left for the next shift.

### Implementation priority (proposed)

1. **Pre-shift state generator** — trivial roll per appliance at shift entry; biggest "lived-in" feel for minimal code.
2. **Refuel / rehab timer** — on return after a significant incident, appliance sits off-run for 20–30 min before flipping to Available.
3. **Hospital offload** (ambulance) — extend the deployment lifecycle with a hospital phase (held 30 min – 3 hrs with pressure roll). Needs hospital location data (start with the handful of major GM EDs).
4. **Welfare break** UI — operator action; passive degradation if ignored.
5. **Defects** — occasional random event.
6. **Hand-back scoring** — requires shift structure first.
