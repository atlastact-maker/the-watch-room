// WHICH JOBS HAVE A GROUND VIEW, and what each one's picture needs to
// know beyond the scene itself. The tablet's Incident app offers Ground
// only for a scenario listed here; the rest keep Job and Map. Ground
// views are built scenario by scenario — the road traffic collision on
// the M60 first — and the simpler jobs may never get one.

import type { Scenario } from "@/lib/sim/incident_types";
import type { Pt } from "./plan-figure";

/** Where something sits on the scene, in its metres, and the compass heading it faces (0 north, 90 east). */
export type Placing = { at: Pt; heading: number };

/** A road traffic collision: the carriageway from the scene, the wrecks
 *  placed on it, and where the traffic management puts things. */
export type RtcGroundView = {
  kind: "rtc";
  /** Which way the traffic runs along x: +1 east, -1 west. */
  flow: 1 | -1;
  /** The nearside — lane 1 and the hard shoulder — is the top or the bottom of the picture. */
  nearside: "top" | "bottom";
  /** The wrecks: each CRS vehicle's place on the road and the way it ended up facing. */
  wrecks: ({ vehicleId: string } & Placing)[];
  /** Where a unit that has arrived but not been parked on the map is held, in arrival order. */
  holding: Placing[];
  /** The fend-off: angled across the lanes upstream of the wrecks, the rear to the traffic. */
  fendOff: Placing;
  /** Where a rolling block brings the traffic to a stop, and where a unit holding a closure at the junction is shown. */
  block: Placing;
  junction: Placing;
  /** The cone taper closing lanes at the scene: from the carriageway's edge at `from` to the lane edge at `to`, then along it to `until`. */
  taper: { from: number; to: number; until: number };
  /** Other vehicles stopped on the road: the witnesses', the caller's. */
  stopped: ({ label: string; kind: "car" | "van" | "artic"; paint?: string } & Placing)[];
  /** A bridge over the carriageway, along x — drawn when there is no photograph to show it. */
  bridge?: { x: number; w: number };
  /** Where the eye goes first: the box the working-area frame shows, in metres. */
  focus: { x0: number; x1: number; y0: number; y1: number };
  /** An aerial photograph of the place, laid under the scene: the image
   *  in public, its pixels per metre, and the pixel that sits at the
   *  scene's origin. The scene's roads are authored to its measurements. */
  photo?: {
    href: string;
    ppm: number;
    origin: Pt;
    size: Pt;
    /** Spans of the photograph that stand above the road — bridge decks — drawn back over whatever passes under them, in metres along x. */
    cover?: { x: number; w: number }[];
    /** The photograph's own tones for the road drawn crisp over it: the lanes, the hard shoulders, the central reservation. */
    tones?: { road: string; shoulder: string; reservation: string };
    /** Parts of the road band that stay photographic — the merge and diverge tapers with their chevrons — feathered in over `fadeIn` metres at their start and `fadeOut` at their end. */
    keep?: { x0: number; x1: number; y0: number; y1: number; fadeIn?: number; fadeOut?: number }[];
    /** The lane lines' mark and gap, and an x a mark starts at, so the drawn lines fall where the photograph's do. */
    dashes?: { mark: number; gap: number; phaseX: number };
  };
};

export type GroundView = RtcGroundView;

const VIEWS: Record<string, GroundView> = {
  // RTC, persons trapped — M60 eastbound between J17 and J18. Three lanes
  // running west to east with the hard shoulder on the north side; the
  // Transit at the front nose-on towards the central reservation, the Kia
  // behind it across lanes 2 and 3, the Polo last; the witness's Astra and
  // the caller's artic pulled onto the hard shoulder behind. The ground is
  // the aerial photograph of the junction: the wreck sits just east of its
  // two overbridges, short of the on-slip merge; the rolling block stops
  // the traffic at the bridge. Lane lines in the photograph are 15.2 px
  // apart for 3.65 m lanes, so 4.16 px to the metre; the eastbound nearside
  // edge line is row 455.5 and the scene's x = 0 is column 575.
  "03": {
    kind: "rtc",
    flow: 1,
    nearside: "top",
    photo: {
      href: "/scenes/rtc-m60-j17.jpg", ppm: 4.16, origin: [575, 492.9], size: [1024, 1024],
      cover: [{ x: -121.9, w: 12.7 }, { x: -66.1, w: 12.7 }],
      tones: { road: "#535762", shoulder: "#858381", reservation: "#8a8785" },
      keep: [
        { x0: 24, x1: 110, y0: -12.7, y1: -9, fadeIn: 6 },
        { x0: 28, x1: 110, y0: 18.2, y1: 21.7, fadeIn: 6 },
        { x0: -140, x1: -117, y0: -12.7, y1: -9, fadeOut: 6 },
        { x0: -140, x1: -117, y0: 18.2, y1: 21.7, fadeOut: 6 },
      ],
      dashes: { mark: 2, gap: 7.6, phaseX: -136.3 },
    },
    wrecks: [
      { vehicleId: "veh-transit", at: [18, -4], heading: 118 },
      { vehicleId: "veh-ceed", at: [8, -2], heading: 72 },
      { vehicleId: "veh-polo", at: [-2, 0], heading: 104 },
    ],
    holding: [
      { at: [-22, -10.85], heading: 90 }, { at: [-31, -10.85], heading: 90 }, { at: [27, -10.85], heading: 90 },
      { at: [35, -10.85], heading: 90 }, { at: [-60, -10.85], heading: 90 }, { at: [-16, -7.2], heading: 90 },
    ],
    fendOff: { at: [-10.5, -2.6], heading: 128 },
    block: { at: [-50, -3.6], heading: 142 },
    junction: { at: [-58, -10.85], heading: 90 },
    taper: { from: -44, to: -26, until: -8 },
    stopped: [
      { label: "Astra (witness)", kind: "car", paint: "#8f9aa5", at: [-12, -10.9], heading: 90 },
      { label: "HGV (caller)", kind: "artic", at: [-43, -10.9], heading: 90 },
    ],
    focus: { x0: -62, x1: 36, y0: -21, y1: 13 },
  },
};

/** The ground view a job's scenario has, or null when the tablet keeps to Job and Map. */
export function groundViewFor(scenario: Scenario): GroundView | null {
  return VIEWS[scenario.id] ?? null;
}
