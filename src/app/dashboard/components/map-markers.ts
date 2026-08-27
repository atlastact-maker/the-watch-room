// Dispatcher map markers.
//
// Units are CAD symbols: a service-coloured square carrying a two-letter
// resource code, a status roundel notched into its top-left, a callsign
// plate flush to its right, and a dot below marking the exact position.
// Three tiers by zoom — symbol only, plus callsign, plus a type line —
// so the marker sheds parts rather than shrinking type past legibility.
// No vehicle artwork, which is what a real mobilising screen shows and
// what keeps the whole fleet covered without new art per type.
//
// Incident triangles are unchanged from the original pack
// (assets/map-markers) and are still SVG, anchored at (40,48) in an
// 80×66 viewBox. The mk-999 / mk-inc animation classes live in
// globals.css; the HTML markers use mk-999-box.

import L from "leaflet";
import type { ApplianceTypeCode, ServiceCode } from "@/lib/sim/types";

// Status codes & colours (pack README).
export const MARKER_STATUS = {
  available: { code: "6", colour: "#15803d" },
  mobile: { code: "1", colour: "#a16207" },
  attendance: { code: "2", colour: "#dc2626" },
  ba: { code: "BA", colour: "#7c3aed" },
  returning: { code: "3", colour: "#0e7490" },
  offRun: { code: "0", colour: "#71717a" },
} as const;
export type MarkerStatusKey = keyof typeof MARKER_STATUS;


/** Two-letter resource code and service colour travel together — they are
 *  two readings of the same fact, so one function owns both and they can
 *  never drift apart. */
export function serviceMarker(
  service: ServiceCode,
  type?: ApplianceTypeCode,
): { colour: string; code: string } {
  if (service === "Police") return { colour: "#1d4ed8", code: "PC" };
  if (type === "ATV") return { colour: "#9a3412", code: "AT" };
  if (service === "Ambulance") {
    if (type === "HART_vehicle" || type === "NWAS_IRU" || type === "HEMS")
      return { colour: "#0d9488", code: "HT" };
    if (type === "RRV" || type === "QR" || type === "OD" || type === "CCC" || type === "BASICS")
      return { colour: "#65a30d", code: "RV" };
    return { colour: "#15803d", code: "DC" };
  }
  if (
    type === "WrL" ||
    type === "WrT" ||
    type === "L6P" ||
    type === "TRU_pump" ||
    type === undefined
  ) {
    return { colour: "#dc2626", code: "P" };
  }
  return { colour: "#9a3412", code: "AL" };
}

/** Service border colours (pack README), refined by appliance type. */
export function chipServiceColour(service: ServiceCode, type?: ApplianceTypeCode): string {
  return serviceMarker(service, type).colour;
}

export type ChipOpts = {
  callsign: string;
  status: MarkerStatusKey;
  serviceColour: string;
  /** Two-letter resource code inside the symbol — P, AL, DC, RV, PC, HT. */
  resourceCode: string;
  /** Current map zoom. Drives which tier of the marker renders. */
  zoom: number;
  /** Second line at the detailed tier, e.g. PUMP · WHITBY. */
  subtitle?: string;
  /** Pulsing ring behind the symbol (999 run). */
  ring999?: boolean;
  /** Dashed amber ring around symbol + plate. */
  selected?: boolean;
  /** Off-run styling: 55% opacity + greyscale. */
  dimmed?: boolean;
  /** xN badge top-right when the marker stands for several units. */
  cluster?: number;

  /** Drop the status roundel and the count badge at the compact tier.
   *  Stations use this: pulled fully back, the colour block alone is the
   *  useful fact and the badges are noise. */
  quietWhenCompact?: boolean;
  /** Scene commander — a solid gold outline on the callsign plate. Kept
   *  distinct from the dashed amber selection ring so the two read apart
   *  when the IC happens to be the selected unit. */
  commander?: boolean;
};

/**
 * The marker sheds parts rather than shrinking type below 8px, so each
 * zoom band gets its own geometry. Values are measured from the design
 * prototype and are final.
 */
export type MarkerTier = "compact" | "standard" | "detailed";

export function markerTierForZoom(zoom: number): MarkerTier {
  if (zoom <= 13) return "compact";
  if (zoom >= 18) return "detailed";
  return "standard";
}

const TIERS = {
  compact: {
    sym: 20,
    radius: "3px",
    codeSize: 9,
    roundel: 12,
    roundelOff: 5,
    numSize: 8,
    border: 1.5,
    plate: false,
    plateFont: 10,
    platePad: 5,
    subtitle: false,
  },
  standard: {
    sym: 24,
    radius: "3px 0 0 3px",
    codeSize: 10,
    roundel: 14,
    roundelOff: 6,
    numSize: 9,
    border: 1.5,
    plate: true,
    plateFont: 10,
    platePad: 5,
    subtitle: false,
  },
  detailed: {
    sym: 30,
    radius: "4px 0 0 4px",
    codeSize: 12,
    roundel: 17,
    roundelOff: 7,
    numSize: 10,
    border: 2,
    plate: true,
    plateFont: 11,
    platePad: 7,
    subtitle: true,
  },
} as const;

const MONO = "var(--font-geist-mono), ui-monospace, monospace";

/** Leader + dot geometry, shared by every tier. */
const LEADER_H = 10;
const SELECTED_LEADER_H = 12;
const DOT = 8;

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

export type UnitMarker = {
  html: string;
  /** Offset of the anchor dot from the marker box's top-left corner. */
  anchor: [number, number];
};

/**
 * One unit marker: service-coloured symbol carrying a two-letter resource
 * code, a status roundel notched into its top-left, and a callsign plate
 * flush to its right. The dot below is the exact map position.
 *
 * Rendered as HTML rather than SVG (which the incident triangles still
 * use) because the plate is text-width-driven and the roundel, cluster
 * badge and 999 ring all overhang the box — all of which CSS does exactly
 * and SVG only by hand-computed approximation.
 */
export function unitMarkerHtml(o: ChipOpts): UnitMarker {
  const tier = markerTierForZoom(o.zoom);
  const t = TIERS[tier];
  const quiet = tier === "compact" && !!o.quietWhenCompact;
  const st = MARKER_STATUS[o.status];
  const cs = o.callsign.toUpperCase().slice(0, 10);

  // The status roundel widens for the two-character BA code.
  const roundelW = st.code.length > 1 ? Math.round(t.roundel * 1.29) : t.roundel;
  const roundelFont = st.code.length > 1 ? t.numSize - 1 : t.numSize;

  const anchorX = t.sym / 2;
  const leaderTop = o.selected ? t.sym + 6 : t.sym;
  const leaderH = o.selected ? SELECTED_LEADER_H : LEADER_H;
  const anchorY = leaderTop + leaderH + DOT / 2;

  const outline = `box-shadow: 0 0 0 1px rgba(0,0,0,0.45);`;

  // Scene commander: the callsign plate is outlined in gold rather than
  // the service colour, so the IC reads at a glance without another badge
  // competing for the corners.
  const GOLD = "#fbbf24";
  const plateBorder = o.commander ? GOLD : o.serviceColour;

  const ring999 = o.ring999
    ? `<div class="mk-999-box" style="position:absolute;left:0;top:0;width:${t.sym}px;height:${t.sym}px;border:2px solid ${o.serviceColour};border-radius:3px;"></div>`
    : "";

  const cluster =
    o.cluster && o.cluster > 1 && !quiet
      ? `<div style="position:absolute;top:-7px;right:-9px;padding:1px 4px;border-radius:2px;background:#18181b;border:1.5px solid #fff;font:700 9px/1.2 ${MONO};color:#fff;white-space:nowrap;">&#215;${Math.min(o.cluster, 99)}</div>`
      : "";

  const roundel = quiet
    ? ""
    : `<div style="position:absolute;top:-${t.roundelOff}px;left:-${t.roundelOff}px;width:${roundelW}px;height:${t.roundel}px;border-radius:2px;border:${t.border}px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,0.4);background:${st.colour};display:flex;align-items:center;justify-content:center;font:700 ${roundelFont}px/1 ${MONO};color:#fff;">${st.code}</div>`;

  const symbol = `<div style="position:relative;width:${t.sym}px;height:${t.sym}px;background:${o.serviceColour};border:${t.border}px solid #fff;border-radius:${t.plate ? t.radius : "3px"};${outline}box-sizing:border-box;display:flex;align-items:center;justify-content:center;font:700 ${t.codeSize}px/1 ${MONO};color:#fff;">${o.resourceCode}${roundel}</div>`;

  const subtitle =
    t.subtitle && o.subtitle
      ? `<div style="font:500 8px/1 ${MONO};color:#71717a;letter-spacing:0.06em;margin-top:1px;">${o.subtitle}</div>`
      : "";

  const plate = t.plate
    ? `<div style="height:${t.sym}px;padding:0 ${t.platePad}px;background:#fff;border:${t.border}px solid ${plateBorder};border-left:none;border-radius:0 ${t.sym >= 30 ? "4px 4px" : "3px 3px"} 0;${outline}box-sizing:border-box;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;font:700 ${t.plateFont}px/1 ${MONO};color:#18181b;white-space:nowrap;">${cs}${subtitle}</div>`
    : "";

  const selection = o.selected
    ? `<div style="position:absolute;left:-6px;top:-6px;right:-6px;bottom:-6px;border:2px dashed #f59e0b;border-radius:7px;"></div>`
    : "";

  const leader = `<div style="position:absolute;left:${anchorX - 0.5}px;top:${leaderTop}px;width:1px;height:${leaderH}px;background:${o.serviceColour};"></div>`;
  const dot = `<div style="position:absolute;left:${anchorX - DOT / 2}px;top:${leaderTop + leaderH}px;width:${DOT}px;height:${DOT}px;border-radius:50%;background:${o.serviceColour};border:1.5px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,0.3);box-sizing:border-box;"></div>`;

  const dim = o.dimmed ? "opacity:0.4;filter:grayscale(0.7);" : o.status === "offRun" ? "opacity:0.55;" : "";

  const html = `<div style="position:relative;${dim}">
  ${ring999}
  <div style="position:relative;display:flex;align-items:flex-start;width:max-content;">${symbol}${plate}${selection}${cluster}</div>
  ${leader}${dot}
</div>`;

  return { html, anchor: [anchorX, anchorY] };
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
