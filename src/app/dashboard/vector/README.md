# VECTOR — the on-shift desk

The screen an operator sees on shift (`/dashboard`) is the VECTOR
command-and-control desk from `prototypes/vector-cad`, rebuilt as React
over the simulator that already lives in `dashboard-client.tsx`. Nothing
in here holds mock data: every row on the board is derived from the sim's
incidents, deployments, stations, ETAs and log, and every button calls a
simulator function that was already there.

| File | What it is |
| --- | --- |
| `vector.css` | The design system: light and dark palettes, bars, tiles, cards, tables, screens, plus the overrides that bring the legacy panels' chrome in line. |
| `theme.ts` | Light / dark, remembered under `vector-theme` and stamped on `<html data-cad-theme>`. |
| `chrome.tsx` | Brand strip, menu bar, screen tabs, workspace bar, alerts strip, 999 banner, selected-incident strip, status bar. |
| `tile.tsx` | `VectorTile` — the movable, resizable panel — and the layout store (saved geometry, Overview / Resources presets, snap, Save layout / Restore saved). |
| `dispatch-tiles.tsx` | Calls, Live incidents, Incident details, Scene units, Attendance, Resources, County cover, Standby, Hospitals. |
| `log-tile.tsx` | The shift log as a tile, with the `LOG>` entry line. |
| `mdt-task-workspace.tsx`, `mdt-orders.ts`, `tasking-tile.tsx` | The prototype's task workspace (unit tasking, catalogue, numbered task order, task history, the water page) driving the simulator, with orders kept per incident. Opens from the Dispatch panel bar as **Unit tasking** for the unit in hand. |
| `patient-care.tsx` | Patient Care — one workspace for every casualty on an incident. Opens from the Dispatch panel bar as **Casualties** (the whole incident, for control) and from the MDT as **Patient care** (filtered to that resource's own patients). Either view pops out into its own window. |
| `fire-command.tsx`, `command-store.ts` | FIRE & RESCUE COMMAND — the MDT's Fire module: roles strip, incident summary with the scene plan, assessment, command plan with objectives and a review clock, crew tasking by function, appliances and roles, water supply, BA entry control and the incident log, over Overview · Assessment · Crews · Appliances · Water supply · BA control · Incident log tabs. The commander's own record lives in the store per incident and goes to the shift log when recorded. |
| `police-controls.tsx`, `police-store.ts` | POLICE CONTROLS — the MDT's police module: incident summary, the unit and the person or vehicle in front of it, the scene map, and Resource actions over General · Traffic · People · Vehicles tabs (details, accounts, stop and search, arrest, welfare, vehicle search with reason, grounds and power, closures placed on the map, traffic held and released, scene equipment, support requests), Current activity and the log. Every action is a simulator task on the crew; the people and vehicles are the job's records, "Person 01" until details are taken and confirmed on the PNC. The officer's own record (accounts, welfare, searches, traffic controls, support, the firearms declaration) lives in the store. |
| `pnc-page.tsx` | PNC on the tablet — the enquiry form (Vehicle · Names · Property, reason, incident, unit), recent enquiries and the terminal's block-capital return with Summary / Report details and result paging. Runs the same LEDS enquiries as the desk and writes to the same audit. |
| `subject-tile.tsx` | SUBJECT VEHICLE — the desk's view of the car a job is chasing (engine in `src/lib/sim/subject.ts`, map layer in `components/subject-layer.tsx`): the breadcrumb of camera reads and direction of travel, the live track once a crew has eyes on it, units sent to hold a camera site or junction ahead, area search, and the tactics — stop, follow, TPAC box, stinger, contact — once the track is live. |
| `anpr-page.tsx` | ANPR on the tablet — the car's own camera or a fixed site, a camera view with the plate, live reads with filters, a VRM search over the captured reads, and the selected read's match review (three checks, PNC enquiry, source report, confirm or dismiss). Deterministic traffic, the job's own vehicles slipped in. |
| `vital-monitor.tsx` | The vital signs monitor as one component with its own record per patient — traces, numbers, the NIBP cuff, the 12-lead and the alarm limits — pinned in the tablet's top strip beside the unit selector and used in the casualty care screen's monitor card. |
| `casualty-care.tsx` | CASUALTY CARE — the per-patient screen opened from Patient Care: patient assessment with the body figure and primary survey, the vital signs monitor with sweeping ECG / pleth / resp traces, oxygen and medication, the treatment log, and the Assess · Airway · Breathing · Circulation · Immobilise · Handover bar. Every control calls the simulator's treatment handlers. |
| `call-screen.tsx` | The 999 Call screen: caller strip, location fixes, confirm address, scripted assessment and dialogue, incident type, other services, ready-to-open checklist, CREATE INCIDENT & MOBILISE. |
| `mob-screen.tsx` | The Mobilising screen: attendance slots, resource cards, mobilising message, turnout times, station bays, standby cover. |
| `desk-model.ts` | `useDeskModel` — the one place the tiles' and screens' rows are derived from simulator state. |
| `desk.tsx` | `VectorDesk` — composes the shell, the four screens and the Dispatch workspace around the simulator's map and its existing panels. |

Screens: **Dispatch** (map-first workspace with tiles), **999 Call**,
**Mobilising**, **Ground** (the ground map with the assigned-units strip
for selecting, placing and turning units, and the rugged MDT — now a
patient-care terminal that shows only the CASUALTY CARE screen, on the
tablet or in its own window). F2–F5 switch between them.

The legacy panels (classic call stack, dispatch log, incident card,
resources list, LEDS, ANPR, search, 999 call log, vehicle and pre-arrival
sheets, station bays) still exist and are reachable from the Comms,
Resources and Systems menus; `cad-theme.ts` points their design tokens at
the VECTOR palette so they follow the light / dark switch.
