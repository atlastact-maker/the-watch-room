# Complete VECTOR CAD / MDT project

This is the complete current VECTOR prototype: CAD workspace, call handling, mobilisation, map/vehicle assets, MDT, equipment allocation and returns, crew handovers, task updates, persistent sessions, tests and deployment source. The separate simulator under the repository's `src/` directory is preserved.

## Open immediately

The private hosted version is https://vector-watch-room-preview.s97m78zb2m.chatgpt.site — sign in with the same ChatGPT account on your PC.

## Run on your PC

Install Node.js 22.13 or newer, download or pull this repository, and run from the repository root:

```sh
node prototypes/vector-cad/serve.cjs
```

Then open http://127.0.0.1:8765/ in your browser. On Windows, you can instead double-click `start-vector.cmd` in this folder. Keep the terminal open while using VECTOR. No npm install is needed for this launcher. Do not open the HTML file directly: saving requires the local server.

Sessions are saved in `.local/session.sqlite` on that PC and restored on reload. The PC database and private hosted database are separate; Git does not contain either database. Browser internet access is required for the existing React CDN and external imagery. Use the hosted link if you want to continue the same hosted session across devices.

## Continue development

The main UI is `dist/VECTOR Dispatch.dc.html`; keep its supporting files alongside it. `worker/session.mjs` contains the shared save API. `db/` and `drizzle/` contain its schema and migration. `serve.cjs` supplies SQLite for PC use; hosted Sites supplies D1. Read `dist/HANDOVER.md` for the workflow and validation notes.

For development/build tools, from this folder:

```sh
npm ci
npm test
npm run dev
npm run build
```

`.openai/hosting.json` includes logical database bindings only. Deployment source is included, but a new deployment must be linked to its intended Site before publishing. Do not publish this as static HTML alone: it needs `/api/session`.

All equipment, crew qualifications and control messaging remain scenario data. Save conflict protection prevents silent overwrites; it does not merge simultaneous edits.

The original narration, transcript and subtitle files are preserved under `dist/video/`. The original large MP4 deliverables were not in the Git repository or this workspace and are not part of this upload.
