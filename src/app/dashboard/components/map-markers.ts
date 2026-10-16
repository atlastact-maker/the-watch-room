// Dispatcher map markers: the unit chip and the incident box as Leaflet
// icons, cached by their inputs. The chip markup itself lives
// in unit-chip.ts, which nothing Leaflet touches, so the tablet can
// draw the same card without pulling the map library into the page.

import L from "leaflet";
import { incidentMarkerHtml, markerTierForZoom, unitMarkerHtml, type ChipOpts, type IncidentMarkerKind } from "./unit-chip";
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

/** One incident icon per state, service and zoom tier, ever — a fresh
 *  DivIcon each tick would restart the 999 ring from frame zero. */
const INCIDENT_ICON_CACHE = new Map<string, L.DivIcon>();

export function incidentDivIcon(kind: IncidentMarkerKind, service: ServiceCode | undefined, zoom: number): L.DivIcon {
  const key = `${kind}|${service ?? "-"}|${markerTierForZoom(zoom)}`;
  const hit = INCIDENT_ICON_CACHE.get(key);
  if (hit) return hit;
  const m = incidentMarkerHtml({ kind, service, zoom });
  const icon = L.divIcon({
    className: "",
    iconAnchor: m.anchor,
    popupAnchor: [0, -m.anchor[1]],
    html: m.html,
  });
  INCIDENT_ICON_CACHE.set(key, icon);
  return icon;
}
