"use client";

// A 3D MODEL IN THE PLAN VIEW. scripts/render-model-sprites.mjs renders
// each model in assets/models from directly above into public/models:
// a single picture for a thing, or a sheet of frames for a clip of
// movement. This lays one in a scene's metre space, centred on `at`,
// turned to `a` degrees, with the soft shadow everything on the ground
// gets — and, for a sheet, plays it: one frame shows through a clip and
// the sheet steps along under it on the clip's own frame rate.

import { MODEL_SPRITES, type ModelSpriteKey } from "./model-sprites";

type Pt = readonly [number, number];
const n2 = (v: number) => (Math.round(v * 1000) / 1000).toString();

export function ModelSprite({ id, at, a = 0, shadow = true, speed = 1, className, style }: { id: ModelSpriteKey; at: Pt; a?: number; shadow?: boolean; /** Playback rate; 0 freezes the first frame. */ speed?: number; className?: string; style?: React.CSSProperties }) {
  const s = MODEL_SPRITES[id] as { href: string; w: number; h: number; frames?: number; fps?: number; cols?: number };
  const frames = s.frames ?? 1;
  const cols = s.cols ?? frames;
  const rows = Math.ceil(frames / cols);
  const clip = `ms-${id}-${Math.round(at[0] * 1000)}-${Math.round(at[1] * 1000)}`;
  const dur = s.fps && speed > 0 ? frames / s.fps / speed : 0;
  // Each frame's top-left in the sheet, as the offset the sheet is moved by to show it.
  const xs = Array.from({ length: frames }, (_, i) => n2(-s.w / 2 - (i % cols) * s.w));
  const ys = Array.from({ length: frames }, (_, i) => n2(-s.h / 2 - Math.floor(i / cols) * s.h));
  return (
    <g className={className} style={style} transform={`translate(${n2(at[0])} ${n2(at[1])}) rotate(${n2(a)})`}>
      {shadow && <ellipse cx={0.04} cy={0.06} rx={s.w * 0.42} ry={s.h * 0.38} fill="#000" opacity={0.4} filter="url(#ps-blur-md)" />}
      <clipPath id={clip}><rect x={-s.w / 2} y={-s.h / 2} width={s.w} height={s.h} /></clipPath>
      <g clipPath={`url(#${clip})`}>
        <image href={s.href} x={-s.w / 2} y={-s.h / 2} width={s.w * cols} height={s.h * rows} preserveAspectRatio="none">
          {frames > 1 && dur > 0 && <animate attributeName="x" calcMode="discrete" values={xs.join(";")} dur={`${n2(dur)}s`} repeatCount="indefinite" />}
          {frames > 1 && dur > 0 && rows > 1 && <animate attributeName="y" calcMode="discrete" values={ys.join(";")} dur={`${n2(dur)}s`} repeatCount="indefinite" />}
        </image>
      </g>
    </g>
  );
}
