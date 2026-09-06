# VECTOR CAD / MDT prototype

Latest standalone UI handover from the desktop design session, 6 September 2026.

This folder is the UI prototype. The repository's existing simulator application remains separate. Start here when continuing the design from another computer or a cloud coding session.

## Run

From the repository root:

```sh
node prototypes/vector-cad/serve.cjs
```

Open http://127.0.0.1:8765/. In a cloud environment, set HOST=0.0.0.0 and use that environment's forwarded preview port. There is no npm install step for this standalone prototype; browser internet access is required for the React CDN and map imagery.

For static hosting, publish this directory with index.html as the entry point. Uploading it to GitHub does not itself enable a hosted preview or make the old PC's localhost URL accessible from a phone.

Read [HANDOVER.md](HANDOVER.md) before making further changes. The main editable file is [VECTOR Dispatch.dc.html](VECTOR%20Dispatch.dc.html). Keep its custom runtime scripts alongside it.

## Phone continuation prompt

> Continue the VECTOR UI in prototypes/vector-cad. Read HANDOVER.md and run serve.cjs. Preserve the simulator under src. We are designing the CAD and rugged MDT interface, with a main map, movable/resizable panels, separate pop-out windows, 999 triage and multi-service mobilisation. Show an updated preview of each design change.

## Video

video/ includes the 24-scene narration and the transcript for the 10-minute introduction. The 1080p MP4 and separate cinematic intro are large local deliverables and are not included in this Git commit. Copy those off the original PC separately before expecting to watch them on a phone.
