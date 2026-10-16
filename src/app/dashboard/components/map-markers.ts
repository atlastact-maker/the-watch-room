// Dispatcher map markers: the unit chip as a Leaflet icon, cached by
// its inputs, and the incident pin. The chip markup itself lives
// in unit-chip.ts, which nothing Leaflet touches, so the tablet can
// draw the same card without pulling the map library into the page.

import L from "leaflet";
import { unitMarkerHtml, type ChipOpts } from "./unit-chip";
import type { ServiceCode } from "@/lib/sim/types";

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

/** The incident pin's box, where its tip sits, and where a popup opens. */
export const INCIDENT_PIN = { size: [64, 64] as [number, number], anchor: [32, 58] as [number, number], popup: [0, -44] as [number, number] };

const PIN_STATE: Record<IncidentMarkerKind, { fill: string; stroke: string }> = {
  unassigned: { fill: "#dc2626", stroke: "#991b1b" },
  assigned: { fill: "#b45309", stroke: "#92400e" },
  closed: { fill: "#6b7280", stroke: "#4b5563" },
};

const GLYPH_COLOUR: Record<ServiceCode, string> = { Fire: "#dc2626", Ambulance: "#15803d", Police: "#1d4ed8" };

/** The service's symbol, drawn in a 14-unit box about (32, 24): a flame,
 *  the star of life, a shield; an exclamation when the job is nobody's
 *  yet. Paths rather than text, so it reads the same on every machine. */
function incidentGlyph(service: ServiceCode | undefined, colour: string): string {
  if (service === "Fire") {
    return `<path d="M32 15.6 C33.6 18.4 37.4 20.7 37.4 24.7 C37.4 27.8 35 30.2 32 30.2 C29 30.2 26.6 27.8 26.6 24.7 C26.6 23 27.3 21.6 28.4 20.5 C28.5 22.1 29.3 23.1 30.4 23.3 C29.9 20.5 30.7 18 32 15.6 Z" fill="${colour}"/><path d="M32 23.2 C32.9 24.4 34.2 25.2 34.2 26.6 C34.2 27.9 33.2 28.8 32 28.8 C30.8 28.8 29.8 27.9 29.8 26.6 C29.8 25.6 30.4 24.9 31 24.4 C31.1 25 31.4 25.4 31.8 25.5 C31.6 24.6 31.7 24 32 23.2 Z" fill="#ffffff"/>`;
  }
  if (service === "Ambulance") {
    return `<g transform="translate(32 24)" fill="${colour}"><rect x="-1.4" y="-7.2" width="2.8" height="14.4" rx="1.4"/><rect x="-1.4" y="-7.2" width="2.8" height="14.4" rx="1.4" transform="rotate(60)"/><rect x="-1.4" y="-7.2" width="2.8" height="14.4" rx="1.4" transform="rotate(120)"/><circle r="2.6" fill="${colour}"/><circle r="1.1" fill="#ffffff"/></g>`;
  }
  if (service === "Police") {
    return `<path d="M32 16.2 L38.4 18.5 V23.2 C38.4 27.3 35.8 30.2 32 31.6 C28.2 30.2 25.6 27.3 25.6 23.2 V18.5 Z" fill="${colour}"/><path d="M28.6 23.6 L31 26 L35.6 20.9" fill="none" stroke="#ffffff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return `<rect x="30.6" y="16.4" width="2.8" height="8.8" rx="1.4" fill="${colour}"/><circle cx="32" cy="28.8" r="1.7" fill="${colour}"/>`;
}

/** The incident pin: a teardrop in the job's state colour — red with a
 *  pulsing halo while nobody is sent, amber once units are assigned, grey
 *  with a tick when it is closed — carrying the service's symbol in a
 *  white disc. 64×64, its tip at (32, 58) on the exact point. */
export function incidentMarkerSvg(kind: IncidentMarkerKind, service?: ServiceCode): string {
  const st = PIN_STATE[kind];
  const id = `mkpin-${kind}`;
  const body = `<path d="M32 58 C32 58 15.5 39.5 15.5 24.5 A16.5 16.5 0 1 1 48.5 24.5 C48.5 39.5 32 58 32 58 Z" fill="${st.fill}" stroke="${st.stroke}" stroke-width="1.4" stroke-linejoin="round" filter="url(#${id})"/>`;
  const disc = `<circle cx="32" cy="24" r="11" fill="#ffffff"/>`;
  const glyph = kind === "closed"
    ? `<path d="M27 24.4 L30.6 27.8 L37 20.6" fill="none" stroke="${st.fill}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`
    : incidentGlyph(service, service ? GLYPH_COLOUR[service] : st.fill);
  const shadow = `<defs><filter id="${id}" x="-40%" y="-30%" width="180%" height="170%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.4" flood-color="#000000" flood-opacity="0.38"/></filter></defs>`;
  const ground = `<ellipse cx="32" cy="58.6" rx="5" ry="1.8" fill="#000000" opacity="0.28"/>`;
  if (kind === "unassigned") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">${shadow}${ground}
<circle class="mk-999" cx="32" cy="24" r="13" fill="none" stroke="${st.fill}" stroke-width="2.2"></circle>
<g class="mk-inc">${body}${disc}${glyph}</g>
</svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">${shadow}${ground}${body}${disc}${glyph}</svg>`;
}
