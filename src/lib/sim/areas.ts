import type { AreaCode } from "./types";

// The operator's ground: the whole county, one patch.
//
// There used to be three — Southern, Eastern, Western — and the operator
// picked one at the briefing. They were real: GMFRS ran three area
// commands (South, East, West; HQs at Stretford, Rochdale and Bolton) and
// source S1 in data/research/fire/sources.md sections its station list
// exactly that way. But GMFRS since reorganised onto borough commands,
// and every service the operator plays is mobilised today from a single
// county- or region-wide control room — NWFC for fire, the NWAS EOC for
// ambulance, GMP's FCR for police. A control-room operator does not pick
// a third of the county; they take the whole board. So the patch is the
// county.
//
// AreaCode keeps its three borough-group values plus ForceWide. They
// still organise the station data along the historical command lines,
// and ForceWide still decides which assets carry a bare over-air
// callsign. The operator just never chooses between them any more.
export type Patch = "GreaterManchester";
export const PATCH: Patch = "GreaterManchester";
export const PATCH_LABEL = "Greater Manchester";

/** Every station bucket that makes up the patch, in the order the map
 *  layers them. */
export const PATCH_AREAS: AreaCode[] = ["Southern", "Eastern", "Western", "ForceWide"];
