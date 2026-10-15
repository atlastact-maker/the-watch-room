// Build step: assets/models/*.glb → public/models/<key>.png
//                                  + src/app/dashboard/vector/scene/model-sprites.ts
//
// The plan-view scenes are drawn from directly above, lit from the upper
// left. A 3D model (a Meshy export, say) joins them as a sprite: this
// renders it with three.js in headless Chromium from the same viewpoint
// under the same light, on a transparent ground, at PPM pixels per metre,
// and writes the PNG plus a metadata module (the sprite's size in metres)
// so the scenes can place it with <image> in their metre space.
//
// A model with a clip of movement becomes a sheet of frames instead: the
// clip is stepped through, each pose rendered in the same frame (sized to
// the whole clip, so nothing jumps), the frames laid in rows, and the
// metadata carries the frame count, the frame rate and the columns, for
// scene/model-sprite.tsx to play.
//
// Models are expected in metres, Y up (glTF's convention), as Meshy
// exports them. Each entry says which way the model's "business end" faces
// once drawn: `yaw` turns it about the vertical axis so the sprite ends up
// with that end to the right (+x) and its top edge to the top (-y) of the
// picture, which is how the scenes draw their kit. A character faces +x.
//
// Run:  node scripts/render-model-sprites.mjs            (every model)
//       node scripts/render-model-sprites.mjs spreaders  (one key)
// Needs the project's playwright + three; set CHROMIUM_PATH to a browser
// when Playwright's own is not installed.

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(root, "assets/models");
const OUT_DIR = resolve(root, "public/models");
const OUT_TS = resolve(root, "src/app/dashboard/vector/scene/model-sprites.ts");

/** The models and how each one sits. `ppm` is the sprite's resolution;
 *  the scenes show kit at roughly 90 px per metre, so 400 keeps a small
 *  thing crisp when zoomed without a heavy file, and a person's sheet of
 *  frames stays sane at 220. `clip` names an animation in the file and
 *  `frames` how many poses of it to keep; `at` starts them that far
 *  into the clip (a fraction), so one frame can be a chosen pose. */
const MODELS = {
  spreaders: { file: "hydraulic-spreaders.glb", yaw: 180, ppm: 400, note: "Hydraulic rescue spreaders (Meshy): arms to +x, the hose coupling at -x." },
  firefighter_run: { file: "firefighter.glb", yaw: 90, ppm: 220, clip: "Running", frames: 16, pad: 0.05, note: "A firefighter running (Meshy, Mixamo rig): faces +x, the Running clip in 16 frames." },
  firefighter_walk: { file: "firefighter.glb", yaw: 90, ppm: 220, clip: "Walking", frames: 20, pad: 0.05, note: "A firefighter walking: faces +x, the Walking clip in 20 frames." },
  firefighter_stand: { file: "firefighter.glb", yaw: 90, ppm: 220, clip: "Walking", frames: 1, at: 0.27, pad: 0.05, note: "A firefighter standing: faces +x, one pose of the Walking clip with the feet together." },
  hems_doctor: { file: "hems-doctor.glb", yaw: 90, ppm: 220, pad: 0.05, note: "A HEMS doctor (Meshy) standing with the medical backpack on, arms a little out: faces +x, the pack behind." },
};

const MIME = { ".js": "text/javascript", ".mjs": "text/javascript", ".glb": "model/gltf-binary", ".html": "text/html", ".json": "application/json", ".wasm": "application/wasm" };

/** Serves the project (three from node_modules, the models) and the render
 *  page itself, so the page's module imports are same-origin. */
function serve(dir, page) {
  return new Promise((ok) => {
    const server = createServer((req, res) => {
      const pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (pathname === "/__render.html") { res.writeHead(200, { "content-type": "text/html" }); res.end(page()); return; }
      const path = resolve(dir, "." + pathname);
      if (!path.startsWith(dir) || !existsSync(path) || statSync(path).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { "content-type": MIME[extname(path)] ?? "application/octet-stream", "access-control-allow-origin": "*" });
      res.end(readFileSync(path));
    });
    server.listen(0, "127.0.0.1", () => ok({ server, port: server.address().port }));
  });
}

const PAGE = () => `<!doctype html><html><head>
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
</head><body><script type="module">
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
window.renderModel = async (url, opts) => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const gltf = await new GLTFLoader().loadAsync(url);
  const model = gltf.scene;
  model.rotation.y = (opts.yaw * Math.PI) / 180;
  model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
  scene.add(model);
  // A clip: play it on a mixer and pose the model at any moment of it.
  const skinned = [];
  model.traverse((o) => { if (o.isSkinnedMesh) skinned.push(o); });
  const clip = opts.clip ? (gltf.animations.find((c) => c.name === opts.clip) ?? gltf.animations[0]) : null;
  if (opts.clip && !clip) throw new Error("no animation clip in " + url + " for " + opts.clip);
  const frames = clip ? Math.max(1, opts.frames ?? 12) : 1;
  const mixer = clip ? new THREE.AnimationMixer(model) : null;
  if (mixer) mixer.clipAction(clip).play();
  const poseAt = (t) => {
    if (mixer) mixer.setTime(t);
    model.updateMatrixWorld(true);
    for (const sm of skinned) sm.skeleton.update();
  };
  const bounds = () => {
    if (!skinned.length) return new THREE.Box3().setFromObject(model);
    const b = new THREE.Box3();
    for (const sm of skinned) { sm.computeBoundingBox(); b.union(sm.boundingBox.clone().applyMatrix4(sm.matrixWorld)); }
    return b;
  };
  // The frame: the union of every pose, so the figure never jumps between frames.
  const box = new THREE.Box3();
  const at0 = opts.at ?? 0;
  for (let i = 0; i < frames; i++) { poseAt(clip ? (i / frames + at0) * clip.duration : 0); box.union(bounds()); }
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  model.position.sub(centre);
  // The light the scenes are drawn under: soft sky, the key from the upper left and above.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x5a5a5a, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-3, 6, -3);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const d = Math.max(size.x, size.z) * 0.8;
  Object.assign(key.shadow.camera, { left: -d, right: d, top: d, bottom: -d, near: 0.1, far: 20 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.01;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe8f5, 0.5);
  fill.position.set(3, 4, 3);
  scene.add(fill);
  // From directly above: +x stays to the right, the model's +z runs down the picture.
  const pad = opts.pad ?? 0.03;
  const w = size.x + 2 * pad, h = size.z + 2 * pad;
  const cam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 50);
  cam.position.set(0, 10, 0);
  cam.up.set(0, 0, -1);
  cam.lookAt(0, 0, 0);
  const W = Math.round(w * opts.ppm), H = Math.round(h * opts.ppm);
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  if (!clip) {
    poseAt(0);
    renderer.render(scene, cam);
    return { png: renderer.domElement.toDataURL("image/png"), w, h, W, H, size: [size.x, size.y, size.z] };
  }
  // The sheet: frames in rows no wider than a browser canvas likes.
  const cols = Math.min(frames, Math.max(1, Math.floor(8192 / W)));
  const rows = Math.ceil(frames / cols);
  const sheet = document.createElement("canvas");
  sheet.width = W * cols;
  sheet.height = H * rows;
  const ctx = sheet.getContext("2d");
  for (let i = 0; i < frames; i++) {
    poseAt((i / frames + at0) * clip.duration);
    renderer.render(scene, cam);
    ctx.drawImage(renderer.domElement, (i % cols) * W, Math.floor(i / cols) * H);
  }
  return { png: sheet.toDataURL("image/png"), w, h, W, H, size: [size.x, size.y, size.z], frames, cols, fps: frames / clip.duration, duration: clip.duration, clip: clip.name };
};
window.ready = true;
</script></body></html>`;

async function main() {
  const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(MODELS);
  const { server, port } = await serve(root, PAGE);
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--ignore-gpu-blocklist", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-webgl"],
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.on("pageerror", (e) => console.error("page error:", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.error("console:", m.text()); });
  await page.goto(`http://127.0.0.1:${port}/__render.html`, { waitUntil: "load" });
  await page.waitForFunction(() => window.ready === true, null, { timeout: 30000 });
  mkdirSync(OUT_DIR, { recursive: true });
  const meta = existsSync(OUT_TS) ? readExisting() : {};
  for (const key of keys) {
    const m = MODELS[key];
    if (!m) { console.error(`unknown model "${key}"`); process.exitCode = 1; continue; }
    if (!existsSync(resolve(SRC, m.file))) { console.error(`missing ${resolve(SRC, m.file)}`); process.exitCode = 1; continue; }
    const url = `/assets/models/${m.file}`;
    const out = await page.evaluate((args) => window.renderModel(args.url, args.opts), { url, opts: { yaw: m.yaw, ppm: m.ppm, pad: m.pad, clip: m.clip, frames: m.frames, at: m.at } });
    const png = Buffer.from(out.png.split(",")[1], "base64");
    writeFileSync(resolve(OUT_DIR, `${key}.png`), png);
    meta[key] = { href: `/models/${key}.png`, w: round(out.w), h: round(out.h), note: m.note, ...(out.frames ? { frames: out.frames, fps: round(out.fps), cols: out.cols } : {}) };
    console.log(`${key}: ${out.W}×${out.H}px${out.frames ? ` × ${out.frames} frames of "${out.clip}" (${round(out.duration)} s, ${round(out.fps)} fps, ${out.cols} per row)` : ""}, ${round(out.w)}×${round(out.h)} m (model ${out.size.map(round).join(" × ")} m), ${(png.length / 1024).toFixed(0)} KB`);
  }
  await browser.close();
  server.close();
  writeTs(meta);
}

const round = (v) => Math.round(v * 1000) / 1000;

function readExisting() {
  const m = readFileSync(OUT_TS, "utf8").match(/MODEL_SPRITES[^=]*=\s*(\{[\s\S]*?\n\})\s*(?:satisfies[^;]*)?;/);
  if (!m) return {};
  try { return Function(`return (${m[1]})`)(); } catch { return {}; }
}

function writeTs(meta) {
  const rows = Object.keys(meta).sort().map((k) => {
    const s = meta[k];
    const anim = s.frames ? `, frames: ${s.frames}, fps: ${s.fps}, cols: ${s.cols}` : "";
    return `  ${k}: { href: ${JSON.stringify(s.href)}, w: ${s.w}, h: ${s.h}${anim} }, // ${s.note ?? ""}`;
  }).join("\n");
  writeFileSync(OUT_TS, `// GENERATED by scripts/render-model-sprites.mjs from assets/models — do not edit.
// Each sprite is a 3D model rendered from directly above, lit like the
// plan-view scenes, with its size in metres so a scene can place it in
// its own metre space; a sheet of frames carries its count, frame rate
// and columns. scene/model-sprite.tsx draws and plays them.

export type ModelSprite = { href: string; w: number; h: number; frames?: number; fps?: number; cols?: number };

export const MODEL_SPRITES = {
${rows}
} satisfies Record<string, ModelSprite>;

export type ModelSpriteKey = keyof typeof MODEL_SPRITES;
`);
}

main().catch((e) => { console.error(e); process.exit(1); });
