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
  /** A bridge over the carriageway, along x. */
  bridge?: { x: number; w: number };
  /** Where the eye goes first: the box the working-area frame shows, in metres. */
  focus: { x0: number; x1: number; y0: number; y1: number };
};

export type GroundView = RtcGroundView;

const VIEWS: Record<string, GroundView> = {
  // RTC, persons trapped — M60 eastbound between J17 and J18. Three lanes
  // running west to east with the hard shoulder on the north side; the
  // Transit at the front nose-on towards the central reservation, the Kia
  // behind it across lanes 2 and 3, the Polo last; the witness's Astra and
  // the caller's artic pulled onto the hard shoulder behind; the overbridge
  // downstream of the wreck.
  "03": {
    kind: "rtc",
    flow: 1,
    nearside: "top",
    wrecks: [
      { vehicleId: "veh-transit", at: [18, -4], heading: 118 },
      { vehicleId: "veh-ceed", at: [8, -2], heading: 72 },
      { vehicleId: "veh-polo", at: [-2, 0], heading: 104 },
    ],
    holding: [
      { at: [-22, -10.5], heading: 90 }, { at: [-31, -10.5], heading: 90 }, { at: [26, -10.5], heading: 90 },
      { at: [34, -10.5], heading: 90 }, { at: [-58, -10.5], heading: 90 }, { at: [-14, -7.3], heading: 90 },
    ],
    fendOff: { at: [-10.5, -3.0], heading: 128 },
    block: { at: [-50, -3.6], heading: 142 },
    junction: { at: [-57, -7.3], heading: 90 },
    taper: { from: -44, to: -26, until: -8 },
    stopped: [
      { label: "Astra (witness)", kind: "car", paint: "#8f9aa5", at: [-12, -10.4], heading: 90 },
      { label: "HGV (caller)", kind: "artic", at: [-45, -10.35], heading: 90 },
    ],
    bridge: { x: 42, w: 8 },
    focus: { x0: -47, x1: 33, y0: -17, y1: 8 },
  },
};

/** The ground view a job's scenario has, or null when the tablet keeps to Job and Map. */
export function groundViewFor(scenario: Scenario): GroundView | null {
  return VIEWS[scenario.id] ?? null;
}
