// The unit chip the maps draw, as markup.
//
// Units are CAD symbols: a service-coloured square carrying a two-letter
// resource code, a status roundel notched into its top-left, a callsign
// plate flush to its right, and a dot below marking the exact position.
// Three tiers by zoom — symbol only, plus callsign, plus a type line —
// so the marker sheds parts rather than shrinking type past legibility.
// No vehicle artwork, which is what a real mobilising screen shows and
// what keeps the whole fleet covered without new art per type.
//
// The incident is a box in the same language (incidentMarkerHtml below):
// the square in the job's state colour, the service's symbol in white,
// the leader and dot on the point. The mk-999-box pulse lives in
// globals.css.

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
    if (
      type === "HART_vehicle" ||
      type === "NWAS_IRU" ||
      type === "HART_PCV" ||
      type === "HART_ORIRU" ||
      type === "HART_ATV" ||
      type === "HART_carrier" ||
      type === "HART_RRV" ||
      type === "HEMS"
    )
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
  /** Ground view uses a restrained top-down vehicle silhouette; the county
   *  desk keeps the compact CAD chip for dense fleet monitoring. */
  vehicleBody?: boolean;
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

export const TIERS = {
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

export const MONO = "var(--font-geist-mono), ui-monospace, monospace";

/** Leader + dot geometry, shared by every tier. */
export const LEADER_H = 10;
export const SELECTED_LEADER_H = 12;
export const DOT = 8;

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

  const bodyW = o.vehicleBody ? t.sym + (tier === "detailed" ? 12 : 8) : t.sym;
  const bodyH = t.sym;
  const anchorX = bodyW / 2;
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

  const symbol = o.vehicleBody
    ? `<div style="position:relative;width:${bodyW}px;height:${bodyH}px;background:${o.serviceColour};border:${t.border}px solid #f5f5f5;border-radius:3px;${outline}box-sizing:border-box;display:flex;align-items:center;justify-content:center;font:700 ${Math.max(8, t.codeSize - 1)}px/1 ${MONO};color:#fff;">
        <span style="position:absolute;left:22%;right:22%;top:2px;height:${Math.max(5, Math.round(bodyH * 0.34))}px;background:#263241;border:1px solid rgba(255,255,255,.55);border-radius:2px;opacity:.95;"></span>
        <span style="position:absolute;left:-3px;top:3px;width:3px;height:${Math.max(7, bodyH - 8)}px;background:#17191c;border-radius:2px;box-shadow:${bodyW - 3}px 0 0 #17191c;"></span>
        <span style="position:relative;margin-top:${Math.round(bodyH * 0.34)}px;">${o.resourceCode}</span>${roundel}
      </div>`
    : `<div style="position:relative;width:${t.sym}px;height:${t.sym}px;background:${o.serviceColour};border:${t.border}px solid #fff;border-radius:${t.plate ? t.radius : "3px"};${outline}box-sizing:border-box;display:flex;align-items:center;justify-content:center;font:700 ${t.codeSize}px/1 ${MONO};color:#fff;">${o.resourceCode}${roundel}</div>`;

  const subtitle =
    t.subtitle && o.subtitle
      ? `<div style="font:500 8px/1 ${MONO};color:#71717a;letter-spacing:0.06em;margin-top:1px;">${o.subtitle}</div>`
      : "";

  const plate = t.plate
    ? `<div style="height:${bodyH}px;padding:0 ${t.platePad}px;background:#fff;border:${t.border}px solid ${plateBorder};border-left:none;border-radius:0 ${t.sym >= 30 ? "4px 4px" : "3px 3px"} 0;${outline}box-sizing:border-box;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;font:700 ${t.plateFont}px/1 ${MONO};color:#18181b;white-space:nowrap;">${cs}${subtitle}</div>`
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

/* ---- the incident box ---- */

export type IncidentMarkerKind = "unassigned" | "assigned" | "closed";

/** The job's state colours: red until somebody is sent, amber once units
 *  are assigned, grey when it is closed. */
export const INCIDENT_STATE: Record<IncidentMarkerKind, string> = {
  unassigned: "#dc2626",
  assigned: "#b45309",
  closed: "#6b7280",
};

/** The service's symbol in white, in a 16-unit box: a flame, the star of
 *  life, a shield; an exclamation when the job names no service; a tick
 *  once it is closed. Paths, not text, so it reads the same everywhere. */
function incidentGlyphSvg(kind: IncidentMarkerKind, service: ServiceCode | undefined, px: number, ground: string): string {
  const open = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${px}" height="${px}" style="display:block">`;
  let body: string;
  if (kind === "closed") {
    body = `<path d="M3.2 8.4 L6.6 11.7 L12.8 4.8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else if (service === "Fire") {
    body = `<path d="M8 0.6 C9.6 3.4 13.4 5.7 13.4 9.7 C13.4 12.8 11 15.2 8 15.2 C5 15.2 2.6 12.8 2.6 9.7 C2.6 8 3.3 6.6 4.4 5.5 C4.5 7.1 5.3 8.1 6.4 8.3 C5.9 5.5 6.7 3 8 0.6 Z" fill="#fff"/><path d="M8 8.2 C8.9 9.4 10.2 10.2 10.2 11.6 C10.2 12.9 9.2 13.8 8 13.8 C6.8 13.8 5.8 12.9 5.8 11.6 C5.8 10.6 6.4 9.9 7 9.4 C7.1 10 7.4 10.4 7.8 10.5 C7.6 9.6 7.7 9 8 8.2 Z" fill="${ground}"/>`;
  } else if (service === "Ambulance") {
    body = `<g transform="translate(8 8)" fill="#fff"><rect x="-1.3" y="-7.2" width="2.6" height="14.4" rx="1.3"/><rect x="-1.3" y="-7.2" width="2.6" height="14.4" rx="1.3" transform="rotate(60)"/><rect x="-1.3" y="-7.2" width="2.6" height="14.4" rx="1.3" transform="rotate(120)"/><circle r="2.5"/><circle r="1.1" fill="${ground}"/></g>`;
  } else if (service === "Police") {
    body = `<path d="M8 0.4 L14.4 2.7 V7.4 C14.4 11.5 11.8 14.4 8 15.8 C4.2 14.4 1.6 11.5 1.6 7.4 V2.7 Z" fill="#fff"/><path d="M4.8 7.8 L7.1 10.1 L11.5 5.3" fill="none" stroke="${ground}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else {
    body = `<rect x="6.6" y="0.8" width="2.8" height="8.8" rx="1.4" fill="#fff"/><circle cx="8" cy="13.2" r="1.7" fill="#fff"/>`;
  }
  return `${open}${body}</svg>`;
}

/**
 * The incident box: the same square as a unit symbol, in the job's state
 * colour, carrying the service's symbol in white, with the leader and
 * dot below on the exact position. A new job wears the same 999 ring the
 * responding units do until somebody is sent.
 */
export function incidentMarkerHtml(o: { kind: IncidentMarkerKind; service?: ServiceCode; zoom: number }): UnitMarker {
  const t = TIERS[markerTierForZoom(o.zoom)];
  const colour = INCIDENT_STATE[o.kind];
  const anchorX = t.sym / 2;
  const leaderTop = t.sym;
  const anchorY = leaderTop + LEADER_H + DOT / 2;
  const ring = o.kind === "unassigned"
    ? `<div class="mk-999-box" style="position:absolute;left:0;top:0;width:${t.sym}px;height:${t.sym}px;border:2px solid ${colour};border-radius:3px;"></div>`
    : "";
  const glyph = incidentGlyphSvg(o.kind, o.service, Math.round(t.sym * 0.6), colour);
  const symbol = `<div style="position:relative;width:${t.sym}px;height:${t.sym}px;background:${colour};border:${t.border}px solid #fff;border-radius:3px;box-shadow:0 0 0 1px rgba(0,0,0,0.45);box-sizing:border-box;display:flex;align-items:center;justify-content:center;">${glyph}</div>`;
  const leader = `<div style="position:absolute;left:${anchorX - 0.5}px;top:${leaderTop}px;width:1px;height:${LEADER_H}px;background:${colour};"></div>`;
  const dot = `<div style="position:absolute;left:${anchorX - DOT / 2}px;top:${leaderTop + LEADER_H}px;width:${DOT}px;height:${DOT}px;border-radius:50%;background:${colour};border:1.5px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,0.3);box-sizing:border-box;"></div>`;
  const html = `<div data-incident="${o.kind}" style="position:relative;width:${t.sym}px;">${ring}${symbol}${leader}${dot}</div>`;
  return { html, anchor: [anchorX, anchorY] };
}
