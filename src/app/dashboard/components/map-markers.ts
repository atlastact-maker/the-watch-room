// Dispatcher map markers — faithful implementation of the supplied
// marker pack (assets/map-markers): rounded unit chips with a status
// roundel + callsign, service-coloured border and pointer, heading
// arrow for mobile units, pulsing 999 ring, cluster badge, dashed
// selected ring; red/amber/grey incident triangles.
//
// Every coordinate matches the reference SVGs. Chips anchor at (40,58)
// in an 80×66 viewBox; incident triangles anchor at (40,48). The
// mk-999 / mk-inc animation classes are defined in globals.css.

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

// Service border colours (pack README), refined by appliance type.
export function chipServiceColour(service: ServiceCode, type?: ApplianceTypeCode): string {
  if (service === "Police") return "#1d4ed8";
  if (service === "Ambulance") {
    if (type === "HART_vehicle" || type === "NWAS_IRU" || type === "HEMS") return "#0d9488";
    if (type === "RRV" || type === "QR" || type === "OD" || type === "CCC" || type === "BASICS")
      return "#65a30d";
    return "#15803d"; // DCA and default
  }
  // Fire
  if (
    type === "WrL" ||
    type === "WrT" ||
    type === "L6P" ||
    type === "TRU_pump" ||
    type === undefined
  ) {
    return "#dc2626"; // pump
  }
  return "#9a3412"; // aerial / special
}

export type ChipOpts = {
  callsign: string;
  status: MarkerStatusKey;
  serviceColour: string;
  /** Heading arrow for mobile units — degrees clockwise from north. */
  bearingDeg?: number;
  /** Pulsing ring at the anchor (999 run). */
  ring999?: boolean;
  /** Dashed amber ring around the chip. */
  selected?: boolean;
  /** Off-run styling: 55% opacity + greyscale (pack's status-0 file). */
  dimmed?: boolean;
  /** ×N badge top-right when the chip stands for several units. */
  cluster?: number;
};

/** One unit chip, exactly per the pack anatomy. 80×66, anchor (40,58). */
export function unitChipSvg(o: ChipOpts): string {
  const st = MARKER_STATUS[o.status];
  const cs = o.callsign.toUpperCase().slice(0, 10);
  const csSize = cs.length > 6 ? 8.5 : 11;
  // Reference arrow (rotate 0) points ~56° from north; rotate the
  // difference so the arrow tracks the true course.
  const arrow =
    o.bearingDeg !== undefined
      ? `<path d="M40 58 L58 46 L54 56 L62 54 Z" fill="#a16207" transform="rotate(${Math.round(
          o.bearingDeg - 56,
        )} 40 58)"></path>`
      : "";
  const ring = o.ring999
    ? `<circle class="mk-999" cx="40" cy="58" r="6" fill="none" stroke="#dc2626" stroke-width="2.5"></circle>`
    : "";
  const sel = o.selected
    ? `<rect x="3" y="13" width="74" height="34" rx="8" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="5 3"></rect>`
    : "";
  const cluster =
    o.cluster && o.cluster > 1
      ? `<circle cx="72" cy="18" r="9" fill="#18181b"></circle><text x="72" y="21.5" text-anchor="middle" font-family="ui-monospace, monospace" font-size="9" font-weight="700" fill="#ffffff">×${Math.min(
          o.cluster,
          99,
        )}</text>`
      : "";
  const wrapOpen = o.dimmed ? `<g opacity="0.55" style="filter:grayscale(0.7)">` : `<g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 66" width="80" height="66">
${wrapOpen}
${ring}
${arrow}
${sel}
<path d="M40 58 L33 42 L47 42 Z" fill="#ffffff" stroke="${o.serviceColour}" stroke-width="2"></path>
<circle cx="40" cy="58" r="3" fill="${o.serviceColour}"></circle>
<rect x="8" y="18" width="64" height="24" rx="4" fill="#ffffff" stroke="${o.serviceColour}" stroke-width="2.5"></rect>
<rect x="11" y="21" width="18" height="18" rx="3" fill="${st.colour}"></rect>
<text x="20" y="34" text-anchor="middle" font-family="ui-monospace, monospace" font-size="${
    st.code.length > 1 ? 9 : 12
  }" font-weight="700" fill="#ffffff">${st.code}</text>
<text x="50" y="34" text-anchor="middle" font-family="ui-monospace, monospace" font-size="${csSize}" font-weight="700" fill="#18181b">${cs}</text>
${cluster}
</g>
</svg>`;
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
