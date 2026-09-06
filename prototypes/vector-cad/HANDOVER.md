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
