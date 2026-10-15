// Put one model on another: a backpack on a person's back, a tool in a
// hand. Two Meshy exports become one GLB for the sprite pipeline.
//
//   node scripts/compose-models.mjs <base.glb> <part.glb> <out.glb>
//        [--height 1.78] [--part-height 0.55] [--part-yaw 180]
//        [--part-at 0,1.21,-0.25] [--names doctor,backpack] [--no-compress]
//
// The base is scaled to --height metres, stood with its lowest point at
// the origin and its footprint centred on it. The part is scaled to
// --part-height metres, turned --part-yaw degrees about the vertical
// (its +z face then points the other way at 180), and its centre put at
// --part-at: metres from the base's feet, x across, y up, z towards the
// base's front. Textures come out at 1K WebP unless --no-compress.
//
// The HEMS doctor with the medical backpack on:
//   node scripts/compose-models.mjs doctor.glb backpack.glb assets/models/hems-doctor.glb \
//        --height 1.78 --part-height 0.55 --part-yaw 180 --part-at 0,1.21,-0.25 --names doctor,backpack

import { NodeIO, getBounds } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, mergeDocuments, prune, textureCompress, unpartition } from "@gltf-transform/functions";
import sharp from "sharp";

const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith("--"));
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : fallback;
};
if (positional.length < 3) {
  console.error("usage: node scripts/compose-models.mjs <base.glb> <part.glb> <out.glb> [--height m] [--part-height m] [--part-yaw deg] [--part-at x,y,z] [--names base,part] [--no-compress]");
  process.exit(1);
}
const [basePath, partPath, outPath] = positional;
const height = Number(flag("height", "1.78"));
const partHeight = Number(flag("part-height", "0.55"));
const yaw = (Number(flag("part-yaw", "0")) * Math.PI) / 180;
const at = flag("part-at", "0,0,0").split(",").map(Number);
const [baseName, partName] = flag("names", "base,part").split(",");
const compress = !argv.includes("--no-compress");

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const base = await io.read(basePath);
const part = await io.read(partPath);
const size = (b) => [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];
const centre = (b) => [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
const bb = getBounds(base.getRoot().listScenes()[0]);
const pb = getBounds(part.getRoot().listScenes()[0]);
const bs = size(bb), ps = size(pb), pc = centre(pb);

mergeDocuments(base, part);
const root = base.getRoot();
const [baseScene, partScene] = root.listScenes();

// The base: to metres, feet on the ground, centred.
const k = height / bs[1];
const T = [-((bb.min[0] + bb.max[0]) / 2) * k, -bb.min[1] * k, -((bb.min[2] + bb.max[2]) / 2) * k];
const baseNode = base.createNode(baseName).setScale([k, k, k]).setTranslation(T);
for (const n of baseScene.listChildren()) { baseScene.removeChild(n); baseNode.addChild(n); }

// The part: a child of the base node, so sized and placed in the base's own units.
const s = partHeight / (k * ps[1]);
const rot = (v) => [v[0] * Math.cos(yaw) + v[2] * Math.sin(yaw), v[1], -v[0] * Math.sin(yaw) + v[2] * Math.cos(yaw)];
const offset = rot([pc[0] * s, pc[1] * s, pc[2] * s]);
const local = [(at[0] - T[0]) / k - offset[0], (at[1] - T[1]) / k - offset[1], (at[2] - T[2]) / k - offset[2]];
const partNode = base.createNode(partName).setTranslation(local).setRotation([0, Math.sin(yaw / 2), 0, Math.cos(yaw / 2)]).setScale([s, s, s]);
for (const n of partScene.listChildren()) { partScene.removeChild(n); partNode.addChild(n); }
baseNode.addChild(partNode);
baseScene.addChild(baseNode);
baseScene.setName(`${baseName}-with-${partName}`);
partScene.dispose();
const meshes = root.listMeshes();
meshes.forEach((m, i) => { if (!m.getName()) m.setName(i < meshes.length - 1 ? baseName : partName); });

const steps = [dedup(), prune(), unpartition()];
if (compress) steps.push(textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024] }));
await base.transform(...steps);
await io.write(outPath, base);
const out = getBounds(baseScene);
const r3 = (v) => v.map((x) => Math.round(x * 1000) / 1000).join(" ");
console.log(`${outPath}: ${r3(size(out))} m (min ${r3(out.min)}, max ${r3(out.max)}), ${root.listTextures().length} textures, base ×${k.toFixed(3)}, part ×${(k * s).toFixed(3)} at ${at.join(",")} m`);
