// Build step: assets/vehicles/*.svg → src/app/dashboard/components/vehicle-sprites.ts
//
// For each vehicle SVG:
//   • prefix every def id (and url(#…) / href reference) so multiple
//     vehicles can be inlined in one DOM without gradient collisions
//   • tag light fittings with classes the ground view's CSS can animate:
//       lt lt-blue|lt-red|lt-amber|lt-head|lt-tail  (from the fill's def)
//       lt-l / lt-r   (left / right of the centreline)
//       lt-f / lt-b   (front / back half)
//     positions come from x/cx (rect/circle/ellipse) or the first path
//     coordinate, corrected for any baked rotate(180 …) wrapper
//   • normalise the root tag to width/height 100% + preserved viewBox
//
// Run:  node scripts/build-vehicle-sprites.mjs

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(root, "assets/vehicles");
const OUT = resolve(root, "src/app/dashboard/components/vehicle-sprites.ts");

// file → sprite key + which appliance types use it
const FILES = {
  "vehicle-fire-pump-v15.svg": { key: "pump" },
  "vehicle-fire-alp-v8.svg": { key: "alp" },
  "vehicle-fire-tru-v5.svg": { key: "tru" },
  "vehicle-fire-tresponseu-v5.svg": { key: "truvan" },
  "vehicle-fire-primemover-v1.svg": { key: "pm" },
  "vehicle-fire-primemover-hoselayer-v1.svg": { key: "hll" },
  "vehicle-fire-primemover-decon-v1.svg": { key: "decon" },
  "vehicle-police-estate-v2.svg": { key: "pol_estate" },
  "vehicle-police-rpu-v15.svg": { key: "pol_rpu" },
  "vehicle-police-x5-v2.svg": { key: "pol_arv" },
  "vehicle-police-unmarked-saloon-v2.svg": { key: "pol_unm_saloon" },
  "vehicle-police-unmarked-v2.svg": { key: "pol_unm" },
  // Station bay artwork (nose-down by design) — used by the bay view only.
  "twr-bay-pump.svg": { key: "bay_pump" },
  "twr-bay-alp.svg": { key: "bay_alp" },
};

// Sprite keys whose art renders nose-DOWN as authored; the generator
// wraps them in a 180° rotation so every sprite ends up nose-up
// (the ground map's convention: front faces -Y, rotated by bearing).
// Populated after visually checking the contact sheet.
const FLIP = new Set([]);

const LIGHT_DEFS = {
  "led-blue": "lt-blue",
  "disc-blue": "lt-blue",
  "led-red": "lt-red",
  "taillight": "lt-red",
  "led-amber": "lt-amber",
  "led-clear": "lt-head",
  "headlight": "lt-head",
};

function firstCoord(tag, attrs) {
  const num = (name) => {
    const m = attrs.match(new RegExp(`${name}="([-0-9.]+)"`));
    return m ? parseFloat(m[1]) : null;
  };
  if (tag === "rect") {
    const x = num("x") ?? 0;
    const y = num("y") ?? 0;
    const w = num("width") ?? 0;
    const h = num("height") ?? 0;
    return { x: x + w / 2, y: y + h / 2 };
  }
  if (tag === "circle" || tag === "ellipse") {
    return { x: num("cx") ?? 0, y: num("cy") ?? 0 };
  }
  if (tag === "path") {
    const m = attrs.match(/d="[Mm]\s*([-0-9.]+)[ ,]([-0-9.]+)/);
    if (m) return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
  }
  if (tag === "polygon" || tag === "polyline") {
    const m = attrs.match(/points="\s*([-0-9.]+)[ ,]([-0-9.]+)/);
    if (m) return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
  }
  return null;
}

const out = [];
const meta = [];
for (const [file, { key }] of Object.entries(FILES)) {
  let s = readFileSync(resolve(SRC, file), "utf8");

  const vb = s.match(/viewBox="([^"]+)"/);
  if (!vb) throw new Error(`${file}: no viewBox`);
  const [vx, vy, vw, vh] = vb[1].split(/\s+/).map(Number);
  const midX = vx + vw / 2;
  const midY = vy + vh / 2;
  const baked180 = /rotate\(180/.test(s);

  // 1. Prefix ids and their references.
  const ids = [...s.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  for (const id of ids) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(`id="${esc}"`, "g"), `id="${key}-${id}"`);
    s = s.replace(new RegExp(`url\\(#${esc}\\)`, "g"), `url(#${key}-${id})`);
    s = s.replace(new RegExp(`href="#${esc}"`, "g"), `href="#${key}-${id}"`);
  }

  // 2. Tag light fittings. Two passes: first collect every fitting's raw
  //    position, then classify each against the FITTINGS' OWN mean —
  //    vehicle artwork is centre-origin inside translated groups, so the
  //    viewBox midpoint is meaningless for left/right.
  // Def ids may carry their own art prefix (pmp-led-blue, alp-led-blue),
  // so match any id that ENDS with the def name.
  const fillRefRe = (defName) =>
    `fill="url\\(#[A-Za-z0-9_-]*${defName}\\)"`;

  const fittings = [];
  for (const defName of Object.keys(LIGHT_DEFS)) {
    const tagRe = new RegExp(`<(rect|circle|ellipse|path|polygon|polyline)([^>]*${fillRefRe(defName)}[^>]*?)(/?)>`, "g");
    let m;
    while ((m = tagRe.exec(s))) {
      const pos = firstCoord(m[1], m[2]);
      if (pos) fittings.push(pos);
    }
  }
  const meanX = fittings.length ? fittings.reduce((n, p) => n + p.x, 0) / fittings.length : midX;
  const meanY = fittings.length ? fittings.reduce((n, p) => n + p.y, 0) / fittings.length : midY;

  for (const [defName, cls] of Object.entries(LIGHT_DEFS)) {
    // match opening tags containing this fill (id matched by suffix)
    const tagRe = new RegExp(`<(rect|circle|ellipse|path|polygon|polyline)([^>]*${fillRefRe(defName)}[^>]*?)(/?)>`, "g");
    s = s.replace(tagRe, (full, tag, attrs, selfClose) => {
      const pos = firstCoord(tag, attrs);
      let sideCls = "";
      let endCls = "";
      if (pos) {
        // dead-centre fittings (|dx| tiny) get no side class — they flash
        // in both phases via the :not() fallback rule
        const dx = pos.x - meanX;
        const dy = pos.y - meanY;
        // baked 180° wrapper flips both axes relative to raw coords
        const left = baked180 ? dx > 0 : dx < 0;
        const front = baked180 ? dy > 0 : dy < 0;
        // FLIP wrapper (applied below) flips again
        const flip = FLIP.has(key);
        if (Math.abs(dx) > 1) sideCls = (flip ? !left : left) ? " lt-l" : " lt-r";
        endCls = (flip ? !front : front) ? " lt-f" : " lt-b";
      }
      const classAttr = ` class="lt ${cls}${sideCls}${endCls}"`;
      // merge with an existing class attribute if present
      if (/class="/.test(attrs)) {
        attrs = attrs.replace(/class="([^"]*)"/, `class="$1 lt ${cls}${sideCls.trim() ? sideCls.trim() : ""}${endCls}"`);
        return `<${tag}${attrs}${selfClose}>`;
      }
      return `<${tag}${attrs}${classAttr}${selfClose}>`;
    });
  }

  // 3. Extract inner content and rebuild a normalised root.
  const openEnd = s.indexOf(">", s.indexOf("<svg")) + 1;
  const closeStart = s.lastIndexOf("</svg>");
  let inner = s.slice(openEnd, closeStart);
  if (FLIP.has(key)) {
    inner = `<g transform="rotate(180 ${midX} ${midY})">${inner}</g>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb[1]}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;

  const lightCount = (svg.match(/class="[^"]*lt /g) || []).length + (svg.match(/class="lt /g) || []).length;
  meta.push(`${key}: ${vw}x${vh} lights=${lightCount} baked180=${baked180}`);
  out.push(`  ${key}: { w: ${vw}, h: ${vh}, svg: ${JSON.stringify(svg)} },`);
}

const ts = `// GENERATED FILE — do not edit by hand.
// Rebuild with: node scripts/build-vehicle-sprites.mjs
// Source artwork: assets/vehicles/*.svg
//
// Each sprite is a self-contained inline SVG (ids namespaced per key)
// with light fittings tagged for the ground view's light-state CSS:
//   .lt-blue / .lt-red / .lt-amber / .lt-head  +  .lt-l/.lt-r  +  .lt-f/.lt-b

export type VehicleSpriteKey =
${Object.values(FILES).map((f) => `  | "${f.key}"`).join("\n")};

export const VEHICLE_SPRITES: Record<VehicleSpriteKey, { w: number; h: number; svg: string }> = {
${out.join("\n")}
};

/** Sprite for an appliance type, or null for types without bespoke art. */
export function spriteKeyForType(type: string): VehicleSpriteKey | null {
  switch (type) {
    case "WrL":
    case "WrT":
    case "L6P":
      return "pump";
    case "TL":
    case "HLP":
      return "alp";
    case "TRU_pump":
      return "tru";
    case "TRU_van":
      return "truvan";
    case "PM":
      return "pm";
    case "HLL":
      return "hll";
    case "SDU":
      return "decon";
    case "Police_Response":
    case "Police_Dog":
      return "pol_estate";
    case "Police_RPU":
      return "pol_rpu";
    case "Police_ARV":
      return "pol_arv";
    case "Police_SIO":
      return "pol_unm_saloon";
    case "Police_Search":
      return "pol_unm";
    default:
      return null;
  }
}
`;
writeFileSync(OUT, ts);
console.log(meta.join("\n"));
console.log("wrote", OUT);
