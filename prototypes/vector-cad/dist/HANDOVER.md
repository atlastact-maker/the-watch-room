# VECTOR UI handover — 6 September 2026

## User intent

Luke is building an emergency-service simulator. Existing simulation logic is in this repository and was developed in Claude Code. This session focused on the CAD UI and a rugged tablet-style MDT. Do not replace the simulator with the prototype's mock data. The user wants to continue from a phone with the desktop PC off, so a cloud coding environment and a separately hosted/forwarded preview are still required.

## Current design

- Map-first Dispatch; no F-key toolbar. Toggleable, draggable and edge-resizable panels, with saved local geometry.
- Persistent call alerts and a new 999 call banner even when Calls is closed.
- Dense call stack and live incident rows; clear incident selection and resource attendance.
- Compact address selection and confirmation; expanded address search on demand.
- 14 scripted triage questions per service and a call dialogue. Unasked questions do not block creation; essential caller, location and type checks still apply.
- Escalation with grade/reason and a local review state.
- One incident creation per active call; return to its mobilisation instead of duplicating it.
- Other Services ADD now includes a missing service in the attendance preview and created incident. PASS OVER is a separate simulated state, not live communications.
- Allocation, send, received, accepted, turning out and mobile stages; simulated acknowledgement controls and example timeout warnings.
- Systems workspace: PNC, ANPR, Address Check, Premises Risk, Incident History, Location Tools; one-click copy controls. PNC/ANPR records are fictional.
- Rugged MDT: dark frame, pale bezel, blue-grey screen, left navigation, Actions/Incident/Messages/Crew/Vehicle/Water, local crew task assignment and message history, minimise/restore.
- Separate pop-out windows for floating Dispatch panels, map, Systems and identified boxed Call/Mobilising/Ground panels. Drag detached windows between monitors using their OS title bars. Browser popup permission is required. Dock back or close to return. Some nested cards are part of their containing panel rather than individually detachable.

## Implementation

VECTOR Dispatch.dc.html contains styles, a custom sc-if/sc-for template, embedded mock datasets and the Root logic class (state, renderVals and helper methods). support.js compiles that template into React. It now calls window.vectorPortal for detachable panel nodes, enabling actual React portals into same-origin child windows. popout.js manages those windows and retains detached Dispatch panels when the main screen changes. panel-layout.js manages movement and sizing. copy-tools.js provides delegated clipboard interactions.

Load panel-layout.js, copy-tools.js and popout.js BEFORE support.js. The custom runtime replaces document content and late script ordering previously broke enhancements. Do not convert this file to plain HTML without replacing its runtime.

## Repository integration references

Reviewed src/app/dashboard/components/bottom-action-menu.tsx and src/lib/sim/incident_types.ts. The simulator already contains richer task/capability, equipment and crew checks, BA control, water/pump operations, police closures and patient workflows. Wire the final React UI to those existing callbacks rather than copying prototype task behaviour into production. Treatment is patient-first in the simulator. The repository uses GMP grades 1, 2, C, L and P; some prototype examples still use older numeric grades and need aligning.

## Known limitations and follow-up

- In-memory simulated calls, tasks, messages and incidents reset on reload. Layout geometry alone is persisted locally.
- No real telephony, PNC, ANPR, OS credentials, supervisor notifications or inter-service messaging.
- OS map is a placeholder until the tile proxy is connected. Aerial uses external Esri imagery with attribution. New incident geocoding is incomplete.
- Crew availability in the MDT is a local preview state, not a full reflection of existing Ground tasks; backend checks need integration.
- Pop-out map interaction and answering from a detached call stack were checked in desktop Chromium; mobile popup behaviour and a physical dual-monitor setup have not been tested. The tutorial's dual-display arrangement is explicitly staged.
- Later boxed-panel pop-outs have not all had exhaustive interaction coverage. Check each panel when integrating. Keep the main page open: it owns state and child windows.
- Some sample attendance counts and timers are illustrative. These are interface demonstrations, not verified operational procedures.
- No online deployment was enabled by saving this folder to GitHub. Configure hosting and a cloud environment before the user relies on access with the PC off.

## Verification performed

Inline JavaScript syntax checks; browser navigation and rendering; resource task crew gating/start; movement/resizing; MDT tabs and minimise/restore; separate map and call windows, zoom, answering from the detached stack, retained map on the 999 screen, docking back. During video capture, corrected sending an already allocated resource filling another slot with the same callsign, and made ADD Ambulance appear in the attendance requirements.

## Tutorial deliverables

10-minute 1920x1080 MP4 with British synthetic narration, a cinematic opening and original ambient sound, call-answer animation, staged dual-display demonstration, and adding Ambulance alongside Fire. Full export duration was checked at 10:00 and a complete decode succeeded. Separate cinematic clip is about 29 seconds. The video uses screenshot-based chapters with animated sequences, not continuous live operator footage. Transcript and scene narration are saved here; the MP4 files remain on the original PC.

## Dispatch / resource / MDT update

- Persistent selected-incident strip includes assigned units, attendance shortage and next action.
- Overview and Resources workspace presets; optional edge/panel snapping; explicit Save layout / Restore saved retain geometry and visible panels on the current device.
- Resource cards replace wide resource tables. All filtered candidates stay visible with capability, crew complement, status, ETA and specific blocking reasons. Eligible candidates sort before blocked candidates, then by ETA.
- Shared eligibility gates prevent incompatible, under-complement, unavailable, duplicate or cross-incident mobilisation. Allocate on the mobilisation screen remains separate from Send.
- MDT opens on Incident, with persistent location, hazards and current task/stage guidance. Larger tab, action and attendance controls retain the rugged shell.
- Preview remains simulated. No integration with the production simulator was performed in this update.
- Source regression checks cover eligibility, allocation/send separation, incident selection, acknowledgement and MDT arrival. Browser interaction testing was not performed for this update.

## Detailed MDT tasks

All existing task types now have purpose, equipment focus and three manually recorded milestones. Task briefs accept a location/sector and specific instructions, and reserve named crew. Active tasks support progress reports, pause/resume and completion/cancellation; terminal tasks remain in history and release crew. Completion requires all milestones and an outcome report. Paused tasks retain their crew. Equipment focus is descriptive; no new equipment or operational simulation engine has been connected. History remains in memory and resets on reload. Regression checks cover this lifecycle; browser testing was not performed.

## Selection-based MDT task orders (supersedes detailed task form)

User clarified that task detail must be selectable, not prose input or milestones. Replaced the brief editor and checklist with task method, equipment, working-location and crew selection groups, followed by an assignment summary. Compatible equipment is drawn from the prototype vehicle loadout only; existing deployed inventory and active task reservations block selection. Hose sizes are split into selectable 45 mm and 70 mm options but retain their shared source inventory: quantities are not known, so either reservation conservatively reserves the shared hose stock. Task-specific mandatory sources are checked, including hose and BA for the interior attack option. This is a prototype inventory gate, not a complete operational safety or qualification model. Start, pause, complete and unable-to-complete events retain task configuration in history; completion/cancellation releases equipment and crew. Vehicle inventory reflects active task reservations. No production simulator integration or browser QA was performed.

## Individual stock and scenario competencies

MDT inventory now creates stable, unit-scoped item IDs. Scenario hose stock is explicitly seeded at six 45 mm items and four 70 mm items; BA retains four sets, and other listed equipment defaults to one scenario item. These are demonstration counts, not verified fleet inventories. Legacy deployed groups lack quantities and remain entirely unavailable rather than inventing partial deployment counts. Task forms provide quantity steppers, reserve specific free item IDs, and release only those task reservations on completion/cancellation. Paused assignments retain items. Vehicle item register shows available/deployed/reserved states.

Scenario qualification records show current, expired and unrecorded competencies. They are fictional scenario records, not real qualifications inferred from a role. Specialist requirements can apply to all assigned crew or at least one qualified operator. Explicit state records may replace defaults. BA tasks require a set per selected wearer. Issue revalidates inventory and qualifications and retains a competency snapshot. Tests cover quantities, independent hose groups, release, pause, overbooking, missing/expired qualifications, BA quantity and stale-form rejection. No live fleet/training records, production simulator integration, qualification expiry-date engine or browser QA are included.

## Equipment allocation workflow
Task orders allocate specific scenario asset IDs to shared tasks or named crew. BA requires distinct current wearers. Reserve task → confirm issue/start → complete or cancel → confirm all equipment returned. Pre-issue cancellation releases reservations. Issued items remain unavailable until explicit return; pausing retains allocation. Vehicle register includes task and owner. State remains local and resets on reload; no real stock/training integration. Return confirmation currently applies to all items on the task.

## MDT workflow upgrade (current)
Persistence is now D1-backed through /api/session. The existing owner-private Site uses one saved scenario. Task/crew/equipment state, messages, incident assignments and draft task selections survive reloads. A revision comparison rejects stale saves from another tab or device; it does not merge simultaneous edits. Save failures preserve the current page and provide retry, and leaving with unsaved work raises the browser warning. Earlier notes saying all state resets on reload are superseded.

Task flow: Sent → Accept task → Assigned → Confirm issue & start → In progress → Completed/Cancelled. Individual item outcomes: Returned — serviceable, Damaged, Missing, Awaiting checks. Only serviceable returns release stock. Exceptions remain in the vehicle register and outstanding return queue. Crew handover checks availability and scenario competencies, transfers named equipment ownership and records the event. Task updates are selectable and appear in the task timeline and local simulated control messages.

Validation: Node workflow suite covers acceptance/issue gates, atomic crew/equipment handover, task-linked updates, partial returns, defect resolution, qualifications and stale callbacks. SQLite/API/client tests cover persistence, reload restoration, concurrent write protection, failed save retry and conflict recovery. Browser walkthrough verified task creation, acceptance/issue, handover, task update, completion, damaged-item recording and reload restoration. Desktop and 768×1024 / 1024×768 tablet surfaces were inspected; touch controls use 44px minimum targets. A browser test of clearing damaged equipment was rejected by automatic review; that transition is covered by isolated workflow tests. All browser fixtures stay in preview SQLite and are excluded from production packaging.

Build: npm run build emits a self-contained ESM Worker in dist/server/index.js and embeds the authored public files. D1 migrations are generated by Drizzle and packaged by Sites. Vite serves the same API through a preview-only SQLite adapter. Preview QA routes are available only in the dev server, never the deployed Worker. No live emergency-services integration or real qualification/stock feed is connected.

## Dispatch appearance and selection update
- Clear selection leaves Dispatch with no incident selected; selecting a live row restores incident context. Resource eligibility blocks mobilisation without selection.
- More compact selected incident strip and stronger workspace/panel styling.
- Light/dark mode switch in the main navigation, remembered per browser and applied to detached panels.
- Workflow, layout and session tests passed. Browser checked clear selection, light/dark switching, theme persistence and the 999 screen.

## Production integration (September 2026)

The Dispatch, 999 Call, Mobilising and Ground screens, the tile workspace
and the light/dark theme have been rebuilt in the Next.js app under
`src/app/dashboard/vector/` and are now the on-shift UI at `/dashboard`.
They are wired to the existing simulator (incidents, deployments, PDA,
ETAs, LEDS, ANPR, ground view, MDT) rather than to this prototype's mock
data, as this handover asked. This folder stays as the design reference
and the standalone preview; changes to the live desk belong in the app.
