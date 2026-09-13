// Dispatcher map markers: the unit chip as a Leaflet icon, cached by
// its inputs, and the incident triangles. The chip markup itself lives
// in unit-chip.ts, which nothing Leaflet touches, so the tablet can
// draw the same card without pulling the map library into the page.

import L from "leaflet";
import { unitMarkerHtml, type ChipOpts } from "./unit-chip";

export * from "./unit-chip";

/**
 * Icon instances, cached by their inputs.
 *
 * The maps rebuild their markers on a 250ms clock so movers glide, and
 * handing Leaflet a fresh DivIcon each tick replaces the marker's DOM -
 * which restarts every CSS animation on it from frame zero. The 999
 * pulse never got past its first frames and strobed at 4Hz instead of
 * breathing at 1.4s. Same inputs, same instance: Leaflet sees an
 * unchanged icon, the DOM stays put, the animation runs its rhythm.
 */
const ICON_CACHE = new Map<string, L.DivIcon>();

export function unitDivIcon(
  o: ChipOpts,
  opts?: { interactive?: boolean },
): L.DivIcon {
  const interactive = opts?.interactive ?? false;
  const key = JSON.stringify(o) + (interactive ? "|i" : "");
  const hit = ICON_CACHE.get(key);
  if (hit) return hit;
  const m = unitMarkerHtml(o);
  const icon = L.divIcon({
    className: "",
    iconAnchor: m.anchor,
    popupAnchor: [0, -m.anchor[1]],
    html: interactive
      ? `<div style="pointer-events:auto;cursor:pointer;">${m.html}</div>`
      : m.html,
  });
  // Zoom tiers, statuses and callsigns bound the space, but clear it if
  // something unbounded (subtitles per type, say) ever inflates it.
  if (ICON_CACHE.size > 400) ICON_CACHE.clear();
  ICON_CACHE.set(key, icon);
  return icon;
}

export type IncidentMarkerKind = "unassigned" | "assigned" | "closed";

/** Incident triangle, exactly per the pack. 80×66, anchor (40,48). */
export function incidentMarkerSvg(kind: IncidentMarkerKind): string {
  if (kind === "closed") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 66" width="80" height="66">
<g>
<path d="M40 16 L58 48 L22 48 Z" fill="#52525b" stroke="#27272a" stroke-width="1.5"></path>
<path d="M33 40 L39 44 L48 32" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
</g>
</svg>`;
  }
  if (kind === "assigned") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 66" width="80" height="66">
<g>
<path d="M40 16 L58 48 L22 48 Z" fill="#a16207" stroke="#713f12" stroke-width="1.5"></path>
<text x="40" y="43" text-anchor="middle" font-family="ui-monospace, monospace" font-size="18" font-weight="700" fill="#ffffff">!</text>
</g>
</svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 66" width="80" height="66">
<circle class="mk-999" cx="40" cy="40" r="6" fill="none" stroke="#dc2626" stroke-width="2.5"></circle>
<g class="mk-inc">
<path d="M40 16 L58 48 L22 48 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.5"></path>
<text x="40" y="43" text-anchor="middle" font-family="ui-monospace, monospace" font-size="18" font-weight="700" fill="#ffffff">!</text>
</g>
</svg>`;
}
