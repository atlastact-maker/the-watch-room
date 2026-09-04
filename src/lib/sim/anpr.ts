// ANPR.
//
// A camera network reads plates and the overwhelming majority are nothing
// at all — that is the defining fact about it. A site on a busy road reads
// tens of thousands a day and a controller never sees one of them. What
// reaches the desk is a HIT: a plate that matched something worth acting
// on, with the site and the direction, in time for a unit to be somewhere
// useful.
//
// So the console is not a list of reads. It is a list of hits, over a
// counter that shows the reads going past underneath, because the counter
// is what makes a hit feel like a hit.
//
// DETERMINISTIC, like the rest of the sim's synthetic data. Reads are not
// stored or randomly emitted — they are a pure function of the site and
// the minute, so the same shift always sees the same traffic, a reload
// does not invent a different day, and nothing accumulates in memory.
//
// THE SITES ARE THE SIM'S. Their coordinates are real places lifted from
// the project's own station files, and the roads named are real roads, but
// GMP's actual camera positions are not published and none is claimed
// here. Flags in data/research/police/gaps.md.

import { generateVehicle, randomVrm } from "./leds-db";
import type { VehicleRecord } from "./records";

export type AnprSite = {
  id: string;
  /** How it reads on the console. */
  name: string;
  road: string;
  coords: { lat: number; lng: number };
  /** Plates a minute past the camera. A motorway site sees far more than
   *  a town centre one, and the difference is the point — most hits come
   *  off the busiest ground. */
  flowPerMin: number;
};

export const ANPR_SITES: AnprSite[] = [
  { id: "A1", name: "M60 J12 Eccles Interchange", road: "M60", coords: { lat: 53.482128, lng: -2.356578 }, flowPerMin: 42 },
  { id: "A2", name: "M60 J18 Simister Island", road: "M60", coords: { lat: 53.555549, lng: -2.295789 }, flowPerMin: 46 },
  { id: "A3", name: "M60 J24 Denton", road: "M60", coords: { lat: 53.448861, lng: -2.08306 }, flowPerMin: 38 },
  { id: "A4", name: "M60 J1 Stockport", road: "M60", coords: { lat: 53.424461, lng: -2.165853 }, flowPerMin: 34 },
  { id: "A5", name: "M61 J4 Farnworth", road: "M61", coords: { lat: 53.575392, lng: -2.435002 }, flowPerMin: 26 },
  { id: "A6", name: "M66 J2 Bury", road: "M66", coords: { lat: 53.598177, lng: -2.300484 }, flowPerMin: 22 },
  { id: "A7", name: "A6 Salford", road: "A6", coords: { lat: 53.480591, lng: -2.270887 }, flowPerMin: 18 },
  { id: "A8", name: "A56 Bury New Road", road: "A56", coords: { lat: 53.511032, lng: -2.263842 }, flowPerMin: 16 },
  { id: "A9", name: "A62 Oldham Road", road: "A62", coords: { lat: 53.542125, lng: -2.095465 }, flowPerMin: 14 },
  { id: "A10", name: "A580 East Lancs, Leigh", road: "A580", coords: { lat: 53.479861, lng: -2.538989 }, flowPerMin: 20 },
  { id: "A11", name: "A34 Kingsway, Cheadle", road: "A34", coords: { lat: 53.394294, lng: -2.352671 }, flowPerMin: 15 },
  { id: "A12", name: "A627(M) Chadderton", road: "A627(M)", coords: { lat: 53.624104, lng: -2.143277 }, flowPerMin: 17 },
];

export type AnprRead = {
  id: string;
  atMs: number;
  siteId: string;
  vrm: string;
  /** Which way past the camera. */
  direction: "NB" | "SB" | "EB" | "WB";
};

export type AnprHit = AnprRead & {
  markers: string[];
  make?: string;
  model?: string;
  colour?: string;
  /** Set once the operator has done something with it. */
  actioned?: boolean;
};

const DIRECTIONS: AnprRead["direction"][] = ["NB", "SB", "EB", "WB"];

/** Markers that put a read in front of the operator. Everything else is
 *  a number going past. */
const ACTIONABLE = new Set(["STOLEN", "ANPR INTEREST", "PNC MARKER", "NO INSURANCE"]);

/** Total plates read across the network in a window. The counter under
 *  the hits — no plate is generated for these, because a quarter of a
 *  million objects a shift would be absurd and nobody looks at them. */
export function readCount(fromMs: number, toMs: number): number {
  const minutes = Math.max(0, (toMs - fromMs) / 60_000);
  const perMin = ANPR_SITES.reduce((n, s) => n + s.flowPerMin, 0);
  return Math.round(minutes * perMin);
}

/** The hits in a window.
 *
 *  Only a small share of traffic is sampled for plate generation — enough
 *  that hits arrive at a believable rate without materialising every
 *  vehicle in Greater Manchester. The sampling is deterministic: the same
 *  minute always yields the same candidates. */
export function hitsBetween(fromMs: number, toMs: number): AnprHit[] {
  const out: AnprHit[] = [];
  const fromMin = Math.floor(fromMs / 60_000);
  const toMin = Math.floor(toMs / 60_000);
  // Guard: a very wide window would walk a lot of minutes for nothing.
  if (toMin < fromMin || toMin - fromMin > 60 * 24) return out;

  for (let minute = fromMin; minute <= toMin; minute++) {
    for (const site of ANPR_SITES) {
      // One candidate per site per minute, weighted by how busy it is.
      // A site reading 42 a minute puts up a candidate more often than
      // one reading 14, which is what makes the motorway sites noisy.
      const draw = unit(`${site.id}:${minute}:draw`);
      if (draw > site.flowPerMin / 60) continue;

      const vrm = randomVrm(`${site.id}:${minute}`);
      const v: VehicleRecord = generateVehicle(vrm);
      const markers = (v.markers ?? []).map(String).filter((m) => ACTIONABLE.has(m));
      if (markers.length === 0) continue;

      const secondsIn = Math.floor(unit(`${site.id}:${minute}:sec`) * 60);
      const atMs = minute * 60_000 + secondsIn * 1000;
      if (atMs < fromMs || atMs > toMs) continue;

      out.push({
        id: `anpr-${site.id}-${minute}`,
        atMs,
        siteId: site.id,
        vrm,
        direction: DIRECTIONS[Math.floor(unit(`${site.id}:${minute}:dir`) * DIRECTIONS.length)],
        markers,
        make: v.make,
        model: v.model,
        colour: v.colour,
      });
    }
  }
  return out.sort((a, b) => b.atMs - a.atMs);
}

/** How loudly a hit should announce itself. */
export function hitTone(h: AnprHit): "critical" | "warn" {
  return h.markers.some((m) => m === "STOLEN" || m === "PNC MARKER" || m === "ANPR INTEREST")
    ? "critical"
    : "warn";
}

export function siteById(id: string): AnprSite | undefined {
  return ANPR_SITES.find((s) => s.id === id);
}

/** Stable 0–1 from a string. Same shape as the rest of the sim's seeds. */
function unit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let x = h >>> 0 || 1;
  x ^= x << 13;
  x >>>= 0;
  x ^= x >> 17;
  x ^= x << 5;
  x >>>= 0;
  return x / 4294967296;
}
