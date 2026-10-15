// Put one model on another: a backpack on a person's back, a tool in a
// hand. Two Meshy exports become one GLB for the sprite pipeline.
//
//   node scripts/compose-models.mjs <base.glb> <part.glb> <out.glb>
//        [--height 1.78] [--part-height 0.55] [--part-yaw 180]
//        [--part-at 0,1.21,-0.25] [--names doctor,backpack] [--straps]
//        [--part-cut-z -0.14] [--no-compress]
//
// The base is scaled to --height metres, stood with its lowest point at
// the origin and its footprint centred on it. The part is scaled to
// --part-height metres, turned --part-yaw degrees about the vertical
// (its +z face then points the other way at 180), and its centre put at
// --part-at: metres from the base's feet, x across, y up, z towards the
// base's front. Textures come out at 1K WebP unless --no-compress.
//
// --part-cut-z drops the part's triangles that lie wholly behind that z in
// its own units: a pack whose straps are modelled as loops hanging off its
// back loses them, and --straps grows ones that fit the person instead.
//
// --straps, for a pack on a person's back, adds two black webbing straps
// that come up out of the pack, over the shoulders, down the chest and
// round the ribs into the bottom corners of the pack.
// Their path is found on the person: rays cast at the mesh round each
// shoulder and down the front, so the straps lie on the body whatever
// its shape. Sized to the height: 5 cm wide at 1.78 m.
//
// The HEMS doctor with the medical backpack on:
//   node scripts/compose-models.mjs doctor.glb backpack.glb assets/models/hems-doctor.glb \
//        --height 1.78 --part-height 0.55 --part-yaw 180 --part-at 0,1.21,-0.28 --names doctor,backpack --straps

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
const straps = argv.includes("--straps");
const cutZ = flag("part-cut-z", null);

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const base = await io.read(basePath);
const part = await io.read(partPath);
if (cutZ !== null) {
  const z0 = Number(cutZ);
  let dropped = 0;
  for (const mesh of part.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const P = prim.getAttribute("POSITION").getArray();
      const I = prim.getIndices();
      if (!I) continue;
      const idx = I.getArray();
      const kept = [];
      for (let f = 0; f < idx.length; f += 3) {
        const a = idx[f], b = idx[f + 1], c = idx[f + 2];
        if (P[a * 3 + 2] < z0 && P[b * 3 + 2] < z0 && P[c * 3 + 2] < z0) { dropped++; continue; }
        kept.push(a, b, c);
      }
      I.setArray(kept.length > 65535 ? new Uint32Array(kept) : new Uint16Array(kept));
    }
  }
  await part.transform(prune());
  console.log(`cut: dropped ${dropped} triangles of the part behind z=${z0}`);
}
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

if (straps) {
  // The person's triangles in metres, feet at the origin, for the rays.
  const tris = [];
  const mul = (m, v) => [m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]];
  const walk = (node) => {
    const mesh = node.getMesh();
    if (mesh) {
      const M = node.getWorldMatrix();
      for (const prim of mesh.listPrimitives()) {
        const P = prim.getAttribute("POSITION").getArray();
        const I = prim.getIndices()?.getArray();
        const V = [];
        for (let i = 0; i < P.length; i += 3) V.push(mul(M, [P[i], P[i + 1], P[i + 2]]));
        const n = I ? I.length : V.length;
        for (let f = 0; f < n; f += 3) tris.push(I ? [V[I[f]], V[I[f + 1]], V[I[f + 2]]] : [V[f], V[f + 1], V[f + 2]]);
      }
    }
    for (const c of node.listChildren()) if (c !== partNode) walk(c);
  };
  walk(baseNode);
  const hit = (o, d) => {
    let best = Infinity;
    for (const [a, b, c] of tris) {
      const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const p = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]];
      const det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
      if (Math.abs(det) < 1e-12) continue;
      const inv = 1 / det, tv = [o[0] - a[0], o[1] - a[1], o[2] - a[2]];
      const u = (tv[0] * p[0] + tv[1] * p[1] + tv[2] * p[2]) * inv;
      if (u < 0 || u > 1) continue;
      const q = [tv[1] * e1[2] - tv[2] * e1[1], tv[2] * e1[0] - tv[0] * e1[2], tv[0] * e1[1] - tv[1] * e1[0]];
      const v = (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]) * inv;
      if (v < 0 || u + v > 1) continue;
      const t = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) * inv;
      if (t > 1e-6 && t < best) best = t;
    }
    return best;
  };
  const H = height / 1.78;
  const width = 0.05 * H, thick = 0.012 * H, lift = 0.004 * H;
  const pivotY = 0.787 * height, endY = 0.615 * height, x0 = 0.097 * H, drift = 0.02 * H;
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const positions = [], normals = [], uvs = [], indices = [];
  const tape = { positions: [], normals: [], uvs: [], indices: [] };
  for (const side of [-1, 1]) {
    // The centreline: up the back from inside the pack, round the shoulder, down the chest; each point on the body plus a lift.
    const pts = [];
    for (const y of [pivotY - 0.06 * H, pivotY - 0.03 * H, pivotY]) {
      const x = side * x0;
      const t = hit([x, y, -1], [0, 0, 1]);
      if (isFinite(t)) pts.push({ p: [x, y, -1 + t], n: [0, 0, -1] });
    }
    for (let deg = -75; deg <= 90; deg += 7.5) {
      const th = (deg * Math.PI) / 180, d = [0, Math.cos(th), Math.sin(th)];
      const x = side * x0;
      const t = hit([x, pivotY, 0], d);
      if (isFinite(t)) pts.push({ p: [x, pivotY + d[1] * t, d[2] * t], n: d });
    }
    for (let y = pivotY - 0.02 * H; y >= endY; y -= 0.02 * H) {
      const x = side * (x0 + (drift * (pivotY - y)) / (pivotY - endY));
      const t = hit([x, y, 1], [0, 0, -1]);
      if (isFinite(t)) pts.push({ p: [x, y, 1 - t], n: [0, 0, 1] });
    }
    // Round the ribs under the arm — rays out from inside the torso find its side — and into the bottom corner of the pack.
    const chestEnd = pts[pts.length - 1].p;
    const phi0 = Math.atan2(Math.abs(chestEnd[0]), Math.max(0.01, chestEnd[2]));
    const phi1 = (120 * Math.PI) / 180;
    const yLow = endY - 0.135 * H;
    for (let i = 1; i <= 8; i++) {
      const phi = phi0 + (phi1 - phi0) * (i / 8);
      const y = endY + (yLow - endY) * (i / 8);
      const d = [side * Math.sin(phi), 0, Math.cos(phi)];
      const t = hit([0, y, 0], d);
      if (isFinite(t)) pts.push({ p: [d[0] * t, y, d[2] * t], n: d });
    }
    const pw = ps[0] * k * s, pd = ps[2] * k * s, ph = ps[1] * k * s;
    const packFace = at[2] + pd / 2;
    const anchorN = norm([side * 0.4, 0, -1]);
    pts.push({ p: [side * (pw / 2 - 0.05 * H), at[1] - ph / 2 + 0.025 * H, packFace + 0.02 * H], n: anchorN });
    pts.push({ p: [side * (pw / 2 - 0.04 * H), at[1] - ph / 2 + 0.015 * H, packFace - 0.03 * H], n: anchorN });
    // Smooth the line and the normals, then lift off the skin.
    const sm = pts.map((q, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      return { p: q.p.map((v, j) => (a.p[j] + 2 * v + b.p[j]) / 4), n: norm(q.n.map((v, j) => a.n[j] + 2 * v + b.n[j])) };
    });
    for (const q of sm) q.p = q.p.map((v, j) => v + q.n[j] * (lift + thick / 2));
    // The webbing: four faces along the line.
    const N = sm.length;
    const frames = sm.map((q, i) => {
      const a = sm[Math.max(0, i - 1)].p, b = sm[Math.min(N - 1, i + 1)].p;
      const t = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
      const bn = norm(cross(q.n, t));
      const n = norm(cross(t, bn));
      return { p: q.p, t, n, b: bn };
    });
    const faces = [
      { off: (f) => f.n.map((v) => v * (thick / 2)), across: (f) => f.b, nrm: (f) => f.n },
      { off: (f) => f.n.map((v) => -v * (thick / 2)), across: (f) => f.b.map((v) => -v), nrm: (f) => f.n.map((v) => -v) },
      { off: (f) => f.b.map((v) => v * (width / 2)), across: (f) => f.n.map((v) => -v), nrm: (f) => f.b },
      { off: (f) => f.b.map((v) => -v * (width / 2)), across: (f) => f.n, nrm: (f) => f.b.map((v) => -v) },
    ];
    for (const face of faces) {
      const half = face === faces[0] || face === faces[1] ? width / 2 : thick / 2;
      const start = positions.length / 3;
      frames.forEach((f, i) => {
        const o = face.off(f), a = face.across(f), nn = face.nrm(f);
        for (const sgn of [-1, 1]) {
          positions.push(f.p[0] + o[0] + a[0] * half * sgn, f.p[1] + o[1] + a[1] * half * sgn, f.p[2] + o[2] + a[2] * half * sgn);
          normals.push(nn[0], nn[1], nn[2]);
          uvs.push(i / (N - 1), sgn < 0 ? 0 : 1);
        }
        if (i > 0) {
          const v = start + i * 2;
          indices.push(v - 2, v - 1, v, v - 1, v + 1, v);
        }
      });
    }
    // The reflective band down the middle of the outer face, as the pack's own straps have.
    const tapeHalf = 0.0065 * H, tapeStart = tape.positions.length / 3;
    frames.forEach((f, i) => {
      for (const sgn of [-1, 1]) {
        const lift2 = thick / 2 + 0.0015 * H;
        tape.positions.push(f.p[0] + f.n[0] * lift2 + f.b[0] * tapeHalf * sgn, f.p[1] + f.n[1] * lift2 + f.b[1] * tapeHalf * sgn, f.p[2] + f.n[2] * lift2 + f.b[2] * tapeHalf * sgn);
        tape.normals.push(f.n[0], f.n[1], f.n[2]);
        tape.uvs.push(i / (N - 1), sgn < 0 ? 0 : 1);
      }
      if (i > 0) { const v = tapeStart + i * 2; tape.indices.push(v - 2, v - 1, v, v - 1, v + 1, v); }
    });
    // The cut end on the chest.
    const last = frames[N - 1], s0 = positions.length / 3;
    for (const [sb, sn] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      positions.push(last.p[0] + last.b[0] * (width / 2) * sb + last.n[0] * (thick / 2) * sn, last.p[1] + last.b[1] * (width / 2) * sb + last.n[1] * (thick / 2) * sn, last.p[2] + last.b[2] * (width / 2) * sb + last.n[2] * (thick / 2) * sn);
      normals.push(last.t[0], last.t[1], last.t[2]);
      uvs.push(1, sb < 0 ? 0 : 1);
    }
    indices.push(s0, s0 + 1, s0 + 2, s0, s0 + 2, s0 + 3);
  }
  const buffer = root.listBuffers()[0];
  const acc = (arr, type, Ctor) => base.createAccessor().setType(type).setArray(new Ctor(arr)).setBuffer(buffer);
  const material = base.createMaterial("webbing").setBaseColorFactor([0.055, 0.055, 0.06, 1]).setRoughnessFactor(0.9).setMetallicFactor(0).setDoubleSided(true);
  const prim = base.createPrimitive().setAttribute("POSITION", acc(positions, "VEC3", Float32Array)).setAttribute("NORMAL", acc(normals, "VEC3", Float32Array)).setAttribute("TEXCOORD_0", acc(uvs, "VEC2", Float32Array)).setIndices(acc(indices, "SCALAR", Uint32Array)).setMaterial(material);
  const reflective = base.createMaterial("reflective").setBaseColorFactor([0.66, 0.68, 0.7, 1]).setRoughnessFactor(0.4).setMetallicFactor(0.15).setDoubleSided(true);
  const tapePrim = base.createPrimitive().setAttribute("POSITION", acc(tape.positions, "VEC3", Float32Array)).setAttribute("NORMAL", acc(tape.normals, "VEC3", Float32Array)).setAttribute("TEXCOORD_0", acc(tape.uvs, "VEC2", Float32Array)).setIndices(acc(tape.indices, "SCALAR", Uint32Array)).setMaterial(reflective);
  const strapMesh = base.createMesh("straps").addPrimitive(prim).addPrimitive(tapePrim);
  baseScene.addChild(base.createNode("straps").setMesh(strapMesh));
  console.log(`straps: ${positions.length / 3} vertices, ${indices.length / 3} triangles, over ${tris.length} body triangles`);
}

const steps = [dedup(), prune(), unpartition()];
if (compress) steps.push(textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024] }));
await base.transform(...steps);
await io.write(outPath, base);
const out = getBounds(baseScene);
const r3 = (v) => v.map((x) => Math.round(x * 1000) / 1000).join(" ");
console.log(`${outPath}: ${r3(size(out))} m (min ${r3(out.min)}, max ${r3(out.max)}), ${root.listTextures().length} textures, base ×${k.toFixed(3)}, part ×${(k * s).toFixed(3)} at ${at.join(",")} m`);
