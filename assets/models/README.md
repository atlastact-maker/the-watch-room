# 3D models

Source models for the plan-view scenes. Each one is rendered from directly
above into a sprite by `scripts/render-model-sprites.mjs`, which writes
`public/models/<key>.png` and `src/app/dashboard/vector/scene/model-sprites.ts`
(the sprite's size in metres). The scenes place the sprite in their own
metre space, so a model only needs to be the right size.

## Exporting from Meshy

- **GLB (glTF 2.0 binary)**, textures embedded, PBR metallic-roughness.
- **Metres, Y up** (glTF's convention), real-world size: a person about
  1.75 m, a car about 4.4 m, hydraulic spreaders about 1 m.
- **One file per thing.** Rigged characters carry their animation clips in
  the same file, named plainly (`idle`, `kneel_idle`, `cpr`, `walk`).
- **Remesh to a sensible count**: about 20k triangles for a person, 30–50k
  for a vehicle, under 15k for kit. Textures at 2K or less.
- Right-hand drive for vehicles; a roof as its own mesh or material lets
  the crash scene fade it so the driver stays visible.

## Adding one

1. Drop the GLB in here. Shrink it first so the repo stays light:
   `npx @gltf-transform/cli resize --width 1024 --height 1024 in.glb tmp.glb`
   then `npx @gltf-transform/cli webp tmp.glb assets/models/<name>.glb`
   (6.7 MB → 0.8 MB for the spreaders).
2. Add a row to `MODELS` in `scripts/render-model-sprites.mjs` with the
   `yaw` that turns the model's business end to +x.
3. `CHROMIUM_PATH=<chromium> node scripts/render-model-sprites.mjs <key>`
   and look at the PNG.
4. Use `MODEL_SPRITES.<key>` in the scene.

| File | Key | What |
| --- | --- | --- |
| `hydraulic-spreaders.glb` | `spreaders` | Hydraulic rescue spreaders on the RTC stage's salvage sheet and at the door. |
| `hydraulic-cutters.glb` (to come) | `cutters` | The rescue cutters. The RTC stage draws them until the model lands; a `cutters` row in `MODELS` with the blades turned to +x, rendered, replaces the drawing with no other change. |
| `hems-doctor.glb` | `hems_doctor` | A HEMS doctor with the emergency medical backpack on his back — two Meshy exports put together by a script (the person scaled to 1.78 m with his feet at the origin, the pack turned straps-in and set on the shoulder blades), the pack's yellow straps, handle and loops recoloured black in its texture first, shoulder straps generated over his shoulders and down his chest), textures at 1K WebP. Standing in an A-pose; faces +x once drawn, the pack behind him. |
| `firefighter.glb` | `firefighter_run`, `firefighter_walk`, `firefighter_stand` | A firefighter with a Mixamo rig and two clips, `Running` and `Walking`, each rendered as a sheet of frames, and one pose of the walk with the feet together as the standing figure. The crews run in with it when a job starts, walk between jobs and back to the appliance, stand by it, and go to the kit and back on the ground view. |

## Putting two together

`scripts/compose-models.mjs` stands one model on another and writes a
single GLB: the base scaled to a height in metres with its feet at the
origin, the part scaled to its own height, turned about the vertical and
its centre set at a point in metres from the base's feet (x across, y up,
z towards the base's front). Textures come out at 1K WebP. The HEMS doctor:

```
node scripts/compose-models.mjs doctor.glb backpack.glb assets/models/hems-doctor.glb \
     --height 1.78 --part-height 0.55 --part-yaw 180 --part-at 0,1.21,-0.28 --names doctor,backpack --straps
```

Meshy models face +z, so a backpack whose straps are on its -z side goes
on at a yaw of 180 with a negative z. `--straps` adds two black webbing
straps with a reflective band, up out of the pack, over the shoulders and
down the chest: their path is found by casting rays at the person's mesh
round each shoulder and down the front, so they lie on the body.

## Animations

A model with animation clips becomes a sheet of frames: the entry in
`MODELS` names the `clip` and how many `frames` to keep, the script poses
the model through the clip and lays the frames in a row, and the metadata
carries the count, the frame rate and the columns.
`scene/model-sprite.tsx` plays a sheet in a scene (`<ModelSprite id="firefighter_run" at={[x, y]} a={deg} />`).
Clips should be in place (no root motion) and loop; a person faces +x
once drawn, which for a Mixamo rig means `yaw: 90`. `at` starts the
frames that far into the clip (a fraction of it), so `frames: 1` with an
`at` is one chosen pose — the standing firefighter is the walk a quarter
of the way through, where the feet pass.
