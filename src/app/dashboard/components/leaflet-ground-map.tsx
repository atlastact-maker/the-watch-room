"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Circle,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Rectangle,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { fetchOsmBuildingPolygon } from "@/lib/sim/osm_building";
import { fetchOsmHydrants, type OsmHydrant } from "@/lib/sim/osm_hydrants";
import {
  fetchOsmRoads,
  snapToNearestRoad,
  snapToNearestRoadWithBearing,
  type OsmRoadWay,
} from "@/lib/sim/osm_roads";
import { metresToLatLng } from "@/lib/sim/scene";
import type {
  Deployment,
  HoseType,
  Incident,
  KitKind,
  Task,
  TaskKind,
} from "@/lib/sim/incident_types";
import type { ApplianceTypeCode, AreaCode, ServiceCode } from "@/lib/sim/types";
import type { StationWithAppliances } from "../page";
import { PatchLayers } from "./leaflet-map";
import { serviceMarker, unitMarkerHtml } from "./map-markers";
import type { IncidentSimState } from "@/lib/sim/incident_sim";
import type { ResolvedOnSceneDeployment } from "./ground-scene-map";
import {
  BasemapToggle,
  MapAttribution,
  useBasemapChoice,
} from "./basemap-controls";
import { VectorBasemap } from "./vector-basemap";
import { STREET } from "@/lib/map-basemaps";
import type { ResolvedDeployment } from "./incident-view";


// -----------------------------------------------------------------------------
// Marker icons
// -----------------------------------------------------------------------------

/** UK Fire Hydrant Indicator plate \u2014 yellow rectangular plate with a bold
 *  black "H", a short pit-distance number, and the hydrant label + optional
 *  street hint underneath. Turns green when an appliance is connected. */
/** MDT-style incident marker — a red crosshair target with a short callout
 *  listing the incident reference, type and address. This is the primary
 *  visual marker for the address; any building polygon from OSM is drawn
 *  as a subtle outline underneath. */
function incidentMdtIcon(args: {
  incidentRef: string;
  typeLabel: string;
  address: string;
  postcode: string;
  showCallout: boolean;
}): L.DivIcon {
  const callout = args.showCallout
    ? `<div style="position:absolute; left:32px; top:2px; width:224px; padding:4px 6px; background:rgba(10,10,12,0.92); border:1px solid #dc2626; border-radius:2px; box-shadow: 0 0 6px rgba(0,0,0,0.6); font-family: var(--font-geist-mono), monospace; color:#f4f4f6; pointer-events:none;">
        <div style="font-size:10px; font-weight:800; letter-spacing:0.08em; color:#dc2626; text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">INC ${escapeHtml(args.incidentRef)} · ${escapeHtml(args.typeLabel)}</div>
        <div style="margin-top:1px; font-size:10px; line-height:1.25; color:#f4f4f6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(args.address)}</div>
        <div style="font-size:9px; letter-spacing:0.06em; color:#cdcdd4; text-transform:uppercase;">${escapeHtml(args.postcode)}</div>
      </div>`
    : "";
  // 260 wide (callout extends to the right); 52 tall. Anchor is the cross-
  // hair's centre so the target lands exactly on the incident lat/lng. We
  // keep the icon size constant whether the callout is shown or not so the
  // anchor maths stay consistent; only the clickable target has
  // pointer-events enabled.
  return L.divIcon({
    className: "",
    iconSize: [260, 52],
    iconAnchor: [12, 26],
    html: `
      <style>
        @keyframes gsm-mdt-ping { 0% { transform:translate(-50%,-50%) scale(0.9); opacity:0.8; } 100% { transform:translate(-50%,-50%) scale(2.2); opacity:0; } }
      </style>
      <div style="position:relative; width:260px; height:52px; pointer-events:none;">
        <!-- Clickable crosshair target at iconAnchor (12, 26) -->
        <div style="position:absolute; left:12px; top:26px; width:0; height:0; pointer-events:auto; cursor:pointer;" title="Toggle incident info">
          <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:28px; height:28px; border-radius:50%; border:2px solid #dc2626; animation: gsm-mdt-ping 1.8s ease-out infinite; pointer-events:none;"></div>
          <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:22px; height:22px; border-radius:50%; border:1.5px solid #dc2626; box-shadow: 0 0 6px rgba(220,38,38,0.6), inset 0 0 3px rgba(220,38,38,0.35); background: rgba(10,10,12,0.35); pointer-events:auto;"></div>
          <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:30px; height:1.5px; background:#dc2626; box-shadow: 0 0 3px rgba(220,38,38,0.8); pointer-events:none;"></div>
          <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:1.5px; height:30px; background:#dc2626; box-shadow: 0 0 3px rgba(220,38,38,0.8); pointer-events:none;"></div>
          <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:5px; height:5px; border-radius:50%; background:#fff; box-shadow: 0 0 4px #dc2626; pointer-events:none;"></div>
        </div>
        ${callout}
      </div>
    `,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatIncidentTypeShort(code: string): string {
  return code
    .replace(/_/g, " ")
    .replace(/\brtc\b/gi, "RTC")
    .replace(/\busar\b/gi, "USAR")
    .replace(/\bhazmat\b/gi, "HAZMAT")
    .replace(/\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .replace(/\b(Rtc|Usar|Hazmat)\b/g, (w) => w.toUpperCase());
}

function hydrantIcon(
  label: string,
  connectedToCallsign?: string,
  street?: string,
): L.DivIcon {
  const connected = !!connectedToCallsign;
  const plateColour = connected ? "#34d399" : "#fde047";
  const plateBorder = connected ? "#059669" : "#a16207";
  const glowColour = connected ? "rgba(52,211,153,0.7)" : "rgba(253,224,71,0.6)";
  const badgeText = connected ? `${label} \u00b7 ${connectedToCallsign}` : label;
  const badgeColour = connected ? "#34d399" : "#fde047";
  return L.divIcon({
    className: "",
    iconSize: [120, 48],
    iconAnchor: [11, 11],
    html: `
      <div style="position: relative; pointer-events: none; width:120px;">
        <!-- FHI plate -->
        <div style="position:relative; width:22px; height:22px; border:1.5px solid ${plateBorder}; background:${plateColour}; border-radius:1px; box-shadow: 0 0 6px ${glowColour}; display:flex; align-items:center; justify-content:center; font-family: var(--font-geist-mono), monospace;">
          <!-- small main-size dial top-right -->
          <span style="position:absolute; top:-5px; right:-5px; background:#0a0a0c; color:${plateColour}; font-size:7px; line-height:1; padding:1px 2px; border-radius:1px; border:1px solid ${plateBorder};">4</span>
          <!-- big H -->
          <span style="color:#0a0a0c; font-size:15px; font-weight:900; line-height:1;">H</span>
          <!-- distance-to-pit bottom -->
          <span style="position:absolute; bottom:-5px; left:-5px; background:#0a0a0c; color:${plateColour}; font-size:7px; line-height:1; padding:1px 2px; border-radius:1px; border:1px solid ${plateBorder};">3</span>
        </div>
        <!-- label + street hint -->
        <div style="position:absolute; left:26px; top:-2px; padding:1px 4px; background: rgba(10,10,12,0.92); border:1px solid ${badgeColour}; color:${badgeColour}; font-family: var(--font-geist-mono), monospace; font-size: 9px; letter-spacing: 0.04em; white-space: nowrap; max-width: 92px; overflow: hidden; text-overflow: ellipsis; border-radius: 2px;">${badgeText}</div>
        ${street ? `<div style="position:absolute; left:26px; top:11px; font-family: var(--font-geist-mono), monospace; font-size: 8px; color:#d1d5db; background: rgba(10,10,12,0.75); padding:0 3px; white-space:nowrap; max-width: 92px; overflow:hidden; text-overflow:ellipsis; border-radius:1px;">${street}</div>` : ""}
      </div>
    `,
  });
}

/**
 * Zoom at which the appliance icon renders at its "reference" pixel size —
 * the look the operator gets one click zoom-out from the ground-map default
 * (default is 19, so 18 is the reference). At zoom levels *below* this we
 * floor the size (don't keep shrinking into nothing on further zoom-out);
 * at zoom levels *above* this we scale up so the vehicle stays proportional
 * to the buildings it's parked next to.
 */
// -----------------------------------------------------------------------------
// Map scale
// -----------------------------------------------------------------------------

/**
 * The map is one continuous surface the operator scrolls. Two zooms
 * matter to the code: where an incident opens, and where the scene layers
 * take over from the patch layers.
 */
const OPENING_ZOOM = 19;
const GROUND_DETAIL_ZOOM = 17;

/** Compute the linear scale factor for the appliance body at a given map
 *  zoom. Each zoom step doubles the tile resolution in principle, but 2x
 *  per step makes the vehicle dominate the view at max zoom — we use a
 *  gentler 1.4x factor that keeps the pump readable without swamping the
 *  surrounding street. Floored at 1.0 at and below the reference zoom. */
/**
 * Vehicle-body scale at the current zoom. Leaflet doubles the pixels-per-
 * metre of the underlying tiles every +1 zoom, so to make a rendered
 * appliance stay the same real-world size we return 2^(zoom - ref). This
 * produces smooth, jump-free scaling across the whole zoom range rather
 * than the previous step-change where the icon was a fixed pixel size
 * below the reference zoom. Extreme zoom-out is clamped at the icon-side
 * (minimum pixel dimensions inside applianceIcon) so vehicles don't
 * disappear at wide views.
 */

/**
 * Given a set of markers at authored parking positions, detect clusters
 * whose members sit within `clusterRadiusM` of each other and spread them
 * in a small circle around the cluster centroid at `spreadM` metres. The
 * input objects are returned with their `pos` swapped for the rendered
 * position; everything else is unchanged.
 *
 * Non-clustered markers are returned untouched. The assignment inside a
 * cluster is deterministic (sorted by id) so the same layout reproduces
 * across renders.
 */
function spreadOverlappingMarkers<T extends { appliance: { id: string }; pos: { lat: number; lng: number } }>(
  markers: T[],
  clusterRadiusM: number,
  spreadM: number,
): T[] {
  if (markers.length < 2) return markers;
  const claimed = new Set<string>();
  const clusters: T[][] = [];
  for (const m of markers) {
    if (claimed.has(m.appliance.id)) continue;
    const group: T[] = [m];
    claimed.add(m.appliance.id);
    for (const other of markers) {
      if (claimed.has(other.appliance.id)) continue;
      if (haversineMetres(m.pos, other.pos) < clusterRadiusM) {
        group.push(other);
        claimed.add(other.appliance.id);
      }
    }
    clusters.push(group);
  }
  const out: T[] = [];
  for (const group of clusters) {
    if (group.length === 1) {
      out.push(group[0]);
      continue;
    }
    // Centroid of this cluster — we'll fan markers around it so the
    // operator's chosen parking point is honoured on average even though
    // individual renders shift slightly.
    const centreLat =
      group.reduce((s, g) => s + g.pos.lat, 0) / group.length;
    const centreLng =
      group.reduce((s, g) => s + g.pos.lng, 0) / group.length;
    const sorted = [...group].sort((a, b) =>
      a.appliance.id.localeCompare(b.appliance.id),
    );
    sorted.forEach((mm, i) => {
      const angle = (i / sorted.length) * 2 * Math.PI;
      const offset = { x: spreadM * Math.cos(angle), y: spreadM * Math.sin(angle) };
      const pos = metresToLatLng({ lat: centreLat, lng: centreLng }, offset);
      out.push({ ...mm, pos });
    });
  }
  return out;
}

function haversineMetres(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * An on-scene appliance, as a CAD symbol marker.
 *
 * This used to draw true-scale top-down artwork. The artwork still exists
 * and is still used where a picture belongs — the resource directory and
 * the station bay view — but the map runs symbology, which is what a real
 * mobilising screen shows and what stays legible at any zoom.
 */
export function applianceIcon(
  callsign: string,
  service: string,
  commander: boolean,
  selected: boolean,
  applianceType: ApplianceTypeCode,
  mapZoom: number,
  showLabel: boolean,
  hovered: boolean,
): L.DivIcon {
  const sm = serviceMarker(service as ServiceCode, applianceType);
  const m = unitMarkerHtml({
    callsign,
    // Anything drawn on the ground map is, by definition, in attendance.
    status: "attendance",
    serviceColour: sm.colour,
    resourceCode: sm.code,
    zoom: mapZoom,
    subtitle: applianceType,
    selected: selected || hovered,
    commander,
  });
  void showLabel; // the plate carries the callsign at every tier now
  return L.divIcon({
    className: "",
    iconAnchor: m.anchor,
    popupAnchor: [0, -m.anchor[1]],
    html: `<div style="pointer-events:auto;cursor:pointer;">${m.html}</div>`,
  });
}

/** A previewed parking position for a unit still en route — the same
 *  marker, dimmed, so the operator can see where it will end up. */
function parkingGhostIcon(
  callsign: string,
  service: string,
  applianceType: ApplianceTypeCode,
  mapZoom: number,
): L.DivIcon {
  const sm = serviceMarker(service as ServiceCode, applianceType);
  const m = unitMarkerHtml({
    callsign,
    status: "mobile",
    serviceColour: sm.colour,
    resourceCode: sm.code,
    zoom: mapZoom,
    dimmed: true,
  });
  return L.divIcon({
    className: "",
    iconAnchor: m.anchor,
    html: `<div style="pointer-events:none;">${m.html}</div>`,
  });
}

function kitIcon(kind: KitKind): L.DivIcon {
  const cfg =
    kind === "aed"
      ? { c: "#10b981", letter: "A", title: "AED" }
      : kind === "first_aid"
        ? { c: "#ef4444", letter: "+", title: "First aid" }
        : kind === "trauma"
          ? { c: "#ef4444", letter: "T", title: "Trauma" }
          : { c: "#f59e0b", letter: "E", title: "Extinguisher" };
  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `
      <div style="position: relative; pointer-events: none;" title="${cfg.title}">
        <div style="width:16px; height:16px; background:${cfg.c}; border:1.5px solid #0a0a0c; border-radius:2px; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 4px ${cfg.c};">
          <span style="color:#0a0a0c; font-family: var(--font-geist-mono), monospace; font-size: 11px; font-weight: 800;">${cfg.letter}</span>
        </div>
      </div>
    `,
  });
}

// -----------------------------------------------------------------------------
// Map click — two-step parking (position then bearing)
// -----------------------------------------------------------------------------

type ParkingState =
  | { phase: "idle" }
  | { phase: "pos"; applianceId: string; callsign: string }
  | {
      phase: "bearing";
      applianceId: string;
      callsign: string;
      pos: { lat: number; lng: number };
    }
  | {
      /** Re-orienting a parked vehicle — we already have a pos, just waiting
       *  for the operator to click the map to set a new facing bearing. */
      phase: "rotate";
      applianceId: string;
      callsign: string;
      pos: { lat: number; lng: number };
    };

/** One-shot helper that centres the map on the incident coords at a sensible
 *  zoom so the address pin always sits in the middle of the viewport. */
/**
 * Centres on the incident when it opens, at working zoom, and then keeps
 * out of the way — the operator drives the map from there.
 */
function OpenOnIncident({
  zoom,
  lat,
  lng,
}: {
  zoom: number;
  lat: number;
  lng: number;
}) {
  const map = useMap();
  const firstRef = useRef(true);
  useEffect(() => {
    if (!firstRef.current) return;
    map.setView([lat, lng], zoom, { animate: false });
    firstRef.current = false;
  }, [zoom, lat, lng, map]);
  return null;
}

/** Hook that relays the current map zoom up to a parent state-setter so
 *  zoom-dependent geometry (appliance marker sizing) can re-render
 *  whenever the operator zooms. */
function ZoomTracker({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMap();
  useEffect(() => {
    onZoom(map.getZoom());
    const h = () => onZoom(map.getZoom());
    map.on("zoomend", h);
    return () => {
      map.off("zoomend", h);
    };
  }, [map, onZoom]);
  return null;
}

function MapClickHandler({
  parking,
  roads,
  closureActive,
  onClosureClick,
  musterActive,
  musterDraft,
  onMusterCentre,
  onMusterRadius,
  onMusterCommit,
  onPickedPos,
  onPickedBearing,
}: {
  parking: ParkingState;
  /** Road polylines to snap parking clicks onto. Empty until Overpass
   *  resolves; in that case we fall through to the raw click. */
  roads: OsmRoadWay[];
  /** True while the operator is placing a road closure — takes priority
   *  over the parking flow for the next click. */
  closureActive: boolean;
  onClosureClick: (lat: number, lng: number, bearingDeg: number) => void;
  musterActive: boolean;
  /** Centre of the muster circle being dragged out, once the first click
   *  has landed. Null before that — the next click sets the centre. */
  musterDraft: { lat: number; lng: number; radiusM: number } | null;
  onMusterCentre: (lat: number, lng: number) => void;
  onMusterRadius: (radiusM: number) => void;
  onMusterCommit: (lat: number, lng: number, radiusM: number) => void;
  onPickedPos: (pos: { lat: number; lng: number }) => void;
  onPickedBearing: (bearingDeg: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (closureActive) {
        // Snap generously (60 m) — closures only make sense on a road.
        // With no snap available, honour the raw click with bearing 0.
        const snapped =
          roads.length > 0
            ? snapToNearestRoadWithBearing(
                { lat: e.latlng.lat, lng: e.latlng.lng },
                roads,
                60,
              )
            : null;
        onClosureClick(
          snapped?.lat ?? e.latlng.lat,
          snapped?.lng ?? e.latlng.lng,
          snapped?.bearingDeg ?? 0,
        );
        return;
      }
      if (musterActive) {
        // Two clicks: the centre, then anywhere on the edge. Between them
        // the circle grows under the cursor so the operator can see the
        // ground they are committing before they commit it.
        if (!musterDraft) {
          onMusterCentre(e.latlng.lat, e.latlng.lng);
        } else {
          onMusterCommit(
            musterDraft.lat,
            musterDraft.lng,
            clampMusterRadius(
              L.latLng(musterDraft.lat, musterDraft.lng).distanceTo(e.latlng),
            ),
          );
        }
        return;
      }
      if (parking.phase === "pos") {
        // Snap the click to the nearest drivable road if one is within
        // ~25 m, otherwise honour the operator's literal click (they may
        // have meant a verge / forecourt / off-road staging).
        const snapped =
          roads.length > 0
            ? snapToNearestRoad(
                { lat: e.latlng.lat, lng: e.latlng.lng },
                roads,
                25,
              )
            : null;
        onPickedPos(
          snapped
            ? { lat: snapped.lat, lng: snapped.lng }
            : { lat: e.latlng.lat, lng: e.latlng.lng },
        );
      } else if (parking.phase === "bearing" || parking.phase === "rotate") {
        const dLat = e.latlng.lat - parking.pos.lat;
        const dLng = e.latlng.lng - parking.pos.lng;
        // Bearing in compass degrees: 0 = north, 90 = east. atan2(east, north).
        const bearing = (Math.atan2(dLng, dLat) * 180) / Math.PI;
        const norm = (bearing + 360) % 360;
        onPickedBearing(norm);
      }
    },
    mousemove(e) {
      if (!musterActive || !musterDraft) return;
      const r = clampMusterRadius(
        L.latLng(musterDraft.lat, musterDraft.lng).distanceTo(e.latlng),
      );
      // mousemove fires far faster than this map wants to re-render, so
      // only redraw once the radius has actually moved.
      if (Math.abs(r - musterDraft.radiusM) < 0.5) return;
      onMusterRadius(r);
    },
  });
  return null;
}

// -----------------------------------------------------------------------------
// Curved polyline fallback when ORS doesn't return a foot route
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Ground-square geometry
// -----------------------------------------------------------------------------

/** Degrees per metre at a given latitude. Latitude is near enough
 *  constant; longitude narrows towards the poles, so a square built from
 *  raw degrees would come out as a rectangle on the ground. */
function degPerMetre(lat: number): { lat: number; lng: number } {
  return {
    lat: 1 / 111320,
    lng: 1 / (111320 * Math.cos((lat * Math.PI) / 180)),
  };
}

/** The four corners of a true-ground square centred on a point. */
function squareCorners(
  lat: number,
  lng: number,
  halfSideM: number,
): [number, number][] {
  const per = degPerMetre(lat);
  const dLat = halfSideM * per.lat;
  const dLng = halfSideM * per.lng;
  return [
    [lat + dLat, lng - dLng],
    [lat + dLat, lng + dLng],
    [lat - dLat, lng + dLng],
    [lat - dLat, lng - dLng],
  ];
}

/** Right-angle brackets at each corner of that square — a landing site
 *  gets its corners marked out, not a continuous painted line. */
function squareCornerBrackets(
  lat: number,
  lng: number,
  halfSideM: number,
  armM: number,
): [number, number][][] {
  const per = degPerMetre(lat);
  const h = halfSideM;
  const a = Math.min(armM, halfSideM);
  const pt = (north: number, east: number): [number, number] => [
    lat + north * per.lat,
    lng + east * per.lng,
  ];
  return [
    [pt(h - a, -h), pt(h, -h), pt(h, -h + a)],
    [pt(h, h - a), pt(h, h), pt(h - a, h)],
    [pt(-h + a, h), pt(-h, h), pt(-h, h - a)],
    [pt(-h, -h + a), pt(-h, -h), pt(-h + a, -h)],
  ];
}

/** A HEMS site is squared off on the deck rather than ringed. We mark
 *  30 m of clear ground with the inner box as the touchdown area. */
const LZ_HALF_SIDE_M = 15;
const LZ_TOUCHDOWN_HALF_M = 7;

/** Muster-area sizing, in metres of radius. Clamped so a stray
 *  double-click still leaves something usable on the ground. */
const MUSTER_MIN_R_M = 10;
const MUSTER_MAX_R_M = 250;

function clampMusterRadius(m: number): number {
  return Math.round(Math.min(MUSTER_MAX_R_M, Math.max(MUSTER_MIN_R_M, m)));
}

/** Casualty muster / evacuation area — green flag with a cross chip and
 *  the radius the operator drew out. */
function musterIcon(radiusM: number): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [180, 46],
    iconAnchor: [8, 44],
    html: `
      <div style="position:relative;font-family:var(--font-geist-mono),monospace;">
        <div style="position:absolute;left:6px;top:0;width:3px;height:44px;background:#e5e7eb;border:1px solid #111;"></div>
        <div style="position:absolute;left:10px;top:2px;background:#15803d;color:#fff;border:1.5px solid #052e16;border-radius:2px;padding:3px 8px;font-size:10px;font-weight:700;letter-spacing:0.08em;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.5);">✚ CASUALTY MUSTER · R ${Math.round(radiusM)} M</div>
      </div>`,
  });
}

/** Centre mark and live radius readout while the circle is being drawn. */
function musterDraftIcon(radiusM: number): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [120, 44],
    iconAnchor: [60, 18],
    html: `
      <div style="position:relative;width:120px;height:44px;pointer-events:none;font-family:var(--font-geist-mono),monospace;">
        <div style="position:absolute;left:60px;top:18px;transform:translate(-50%,-50%);width:16px;height:2px;background:#4ade80;box-shadow:0 0 3px rgba(0,0,0,0.8);"></div>
        <div style="position:absolute;left:60px;top:18px;transform:translate(-50%,-50%);width:2px;height:16px;background:#4ade80;box-shadow:0 0 3px rgba(0,0,0,0.8);"></div>
        <div style="position:absolute;left:60px;top:26px;transform:translateX(-50%);background:rgba(10,10,12,0.92);border:1px solid #4ade80;border-radius:2px;padding:1px 6px;font-size:9px;font-weight:700;color:#4ade80;letter-spacing:0.08em;white-space:nowrap;">R ${Math.round(radiusM)} M</div>
      </div>`,
  });
}

/** Aviation-style helipad "H" with a status chip beneath. Rendered under
 *  the aircraft sprite so a landed HELIMED sits on a marked-out pad. */
function helipadIcon(
  callsign: string,
  phase: "inbound" | "walking" | "ground",
): L.DivIcon {
  const chipColour =
    phase === "inbound" ? "#fbbf24" : "#34d399";
  const chipText =
    phase === "inbound"
      ? `LZ SECURED · ${callsign} INBOUND`
      : phase === "walking"
        ? `${callsign} ON GROUND · CREW WALKING IN`
        : `${callsign} ON GROUND`;
  const blink =
    phase === "inbound"
      ? "animation: lz-blink 1.1s steps(2, start) infinite;"
      : "";
  return L.divIcon({
    className: "",
    iconSize: [220, 110],
    iconAnchor: [110, 40],
    html: `
      <div style="position: relative; width: 220px; height: 110px; pointer-events: none;">
        <div style="
          position: absolute; left: 110px; top: 40px;
          transform: translate(-50%, -50%);
          font-family: var(--font-geist-sans), system-ui, sans-serif;
          font-size: 34px; font-weight: 800; line-height: 1;
          color: rgba(255,255,255,0.9);
          text-shadow: 0 0 6px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9);
          ${blink}
        ">H</div>
        <div style="
          position: absolute; left: 110px; top: 78px;
          transform: translateX(-50%);
          padding: 2px 7px;
          background: rgba(10,10,12,0.92);
          border: 1px solid ${chipColour};
          border-radius: 2px;
          font-family: var(--font-geist-mono), ui-monospace, monospace;
          font-size: 9px; line-height: 1.4;
          letter-spacing: 0.12em;
          color: ${chipColour};
          white-space: nowrap;
          ${blink}
        ">${chipText}</div>
      </div>
      <style>
        @keyframes lz-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      </style>
    `,
  });
}

/** Offset a lat/lng by `meters` along a compass bearing (deg, 0 = north).
 *  Equirectangular — plenty for the tens of metres a closure spans. */
function offsetAlongBearing(
  lat: number,
  lng: number,
  bearingDeg: number,
  meters: number,
): [number, number] {
  const rad = (bearingDeg * Math.PI) / 180;
  const dLat = (meters * Math.cos(rad)) / 111_320;
  const dLng =
    (meters * Math.sin(rad)) / (111_320 * Math.cos((lat * Math.PI) / 180));
  return [lat + dLat, lng + dLng];
}

/** Single top-down traffic cone (concentric rings on a square base) with
 *  a small status chip. Blinks while the crew is still setting out. */
function topDownConeIcon(
  kind: "close_carriageway" | "close_road",
  inForce: boolean,
): L.DivIcon {
  const label = inForce
    ? kind === "close_road"
      ? "ROAD CLOSED"
      : "C'WAY CLOSED"
    : "CLOSING…";
  const chipColour = inForce ? "#ef4444" : "#f59e0b";
  const blink = inForce ? "" : "animation: closure-blink 1s steps(2, start) infinite;";
  return L.divIcon({
    className: "",
    iconSize: [120, 52],
    iconAnchor: [60, 11],
    html: `
      <div style="position: relative; width: 120px; height: 52px; pointer-events: none;">
        <div style="
          position: absolute; left: 60px; top: 11px;
          transform: translate(-50%, -50%);
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.7));
          ${blink}
        ">
          <svg viewBox="0 0 22 22" width="20" height="20" aria-hidden="true">
            <rect x="1" y="1" width="20" height="20" rx="3" fill="#ea580c"></rect>
            <circle cx="11" cy="11" r="7.5" fill="#f97316" stroke="#ffffff" stroke-width="2"></circle>
            <circle cx="11" cy="11" r="3" fill="#fb923c" stroke="#ea580c" stroke-width="1"></circle>
            <circle cx="11" cy="11" r="1.2" fill="#7c2d12"></circle>
          </svg>
        </div>
        <div style="
          position: absolute; left: 60px; top: 30px;
          transform: translateX(-50%);
          padding: 2px 6px;
          background: rgba(10,10,12,0.92);
          border: 1px solid ${chipColour};
          border-radius: 2px;
          font-family: var(--font-geist-mono), ui-monospace, monospace;
          font-size: 9px; line-height: 1;
          letter-spacing: 0.12em;
          color: ${chipColour};
          white-space: nowrap;
        ">${label}</div>
      </div>
      <style>
        @keyframes closure-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      </style>
    `,
  });
}

function curvedPolyline(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  segments = 28,
  curvature = 0.12,
): [number, number][] {
  const dLat = to.lat - from.lat;
  const dLng = to.lng - from.lng;
  const dist = Math.hypot(dLat, dLng) || 1e-9;
  // Perpendicular vector in lat/lng space — fine for the small distances on
  // a scene map and gives a visibly hand-laid curve rather than a straight line.
  const px = -dLng / dist;
  const py = dLat / dist;
  const offset = curvature * dist;
  const cLat = (from.lat + to.lat) / 2 + py * offset;
  const cLng = (from.lng + to.lng) / 2 + px * offset;
  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const u = 1 - t;
    const lat = u * u * from.lat + 2 * u * t * cLat + t * t * to.lat;
    const lng = u * u * from.lng + 2 * u * t * cLng + t * t * to.lng;
    points.push([lat, lng]);
  }
  return points;
}

// Task-start callback signature — used by the LeafletGroundMap props chain.
type StartTaskFn = (args: {
  applianceId: string;
  kind: TaskKind;
  assignedCrewIds: string[];
  hydrantId?: string;
  sourceApplianceId?: string;
  hoseType?: HoseType;
  kitKind?: KitKind;
  hazardId?: string;
  mitigationMethod?: string;
}) => void;


// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export function LeafletGroundMap({
  incident,
  resolved,
  onScene,
  enRoute,
  sim,
  tasks,
  sceneCommanderApplianceId,
  crewAir,
  busyCrewIds,
  vehicleGauges,
  selectedApplianceId,
  onSetParkingPos,
  rotatePendingApplianceId,
  onClearRotatePending,
  now,
  onStartTask,
  onAbortTask,
  onSelectAppliance,
  closurePick,
  onPlaceClosure,
  placePendingApplianceId,
  onClearPlacePending,
  musterPick,
  muster,
  onPlaceMuster,
  stations,
  deployments,
  patch,
  onOpenStationBays,
}: {
  incident: Incident;
  resolved: ResolvedDeployment[];
  onScene: ResolvedOnSceneDeployment[];
  enRoute: ResolvedOnSceneDeployment[];
  sim: IncidentSimState;
  tasks: Task[];
  sceneCommanderApplianceId: string | null;
  crewAir: Record<string, number>;
  busyCrewIds: Set<string>;
  vehicleGauges: Record<string, { fuelPct: number; waterPct: number; conditionPct: number }>;
  selectedApplianceId: string | null;
  now: number;
  onSetParkingPos: (applianceId: string, lat: number, lng: number, bearingDeg: number) => void;
  rotatePendingApplianceId: string | null;
  onClearRotatePending: () => void;
  onStartTask: StartTaskFn;
  onAbortTask: (taskId: string) => void;
  onSelectAppliance: (id: string | null) => void;
  /** Armed by the MDT's Inbound console — the appliance whose two-click
   *  placement (position, then facing) the next map clicks perform. */
  placePendingApplianceId?: string | null;
  onClearPlacePending?: () => void;
  /** Armed by the incident view while the operator places a road closure. */
  closurePick?: { kind: "close_carriageway" | "close_road" } | null;
  /** Patch-scale data, drawn once the operator zooms back out. The same
   *  layers the pre-incident map shows, so zooming out of a job lands the
   *  operator on familiar ground rather than a different screen. */
  stations: StationWithAppliances[];
  deployments: Deployment[];
  patch?: AreaCode | null;
  onOpenStationBays?: (stationId: string) => void;
  musterPick?: boolean;
  muster?: { lat: number; lng: number; radiusM: number } | null;
  onPlaceMuster?: (lat: number, lng: number, radiusM: number) => void;
  onPlaceClosure?: (lat: number, lng: number, bearingDeg: number) => void;
}) {
  const centre: [number, number] = [
    incident.scenario.location.coords.lat,
    incident.scenario.location.coords.lng,
  ];
  const scene = incident.scenario.scene;

  // Parking workflow — user selects an appliance to place, then map-clicks
  // its position, then a second map-click to set its facing direction.
  const [parking, setParking] = useState<ParkingState>({ phase: "idle" });


  // Muster area part-way through being drawn: the first click sets the
  // centre, the cursor grows the radius, the second click commits it.
  const [musterDraft, setMusterDraft] = useState<{
    lat: number;
    lng: number;
    radiusM: number;
  } | null>(null);

  // Cancelling mid-draw (the banner's Cancel, or toggling the button off)
  // must take the half-drawn circle with it, not leave it on the ground.
  useEffect(() => {
    if (!musterPick) setMusterDraft(null);
  }, [musterPick]);

  // Base map — OS cartography when a Data Hub key is configured, with
  // aerial as the toggle. Shared with the dispatch map, remembered per
  // operator.
  const {
    options,
    basemap,
    id: basemapId,
    choose: chooseBasemap,
  } = useBasemapChoice();

  // If the vector style fails to load, drop to raster street tiles rather
  // than leaving the operator a blank board; the console says why. Reset
  // on layer change so switching away and back retries.
  const [vectorFailed, setVectorFailed] = useState(false);
  const onVectorFail = useCallback(() => setVectorFailed(true), []);
  useEffect(() => {
    setVectorFailed(false);
  }, [basemapId]);

  // Whether the red MDT-style info callout next to the incident crosshair is
  // shown. The operator can click the crosshair to toggle it off (less
  // cluttered) and back on. Default on so a fresh incident announces itself.
  const [incidentCalloutOpen, setIncidentCalloutOpen] = useState(true);

  // Current map zoom level — fed into the applianceIcon so the vehicle body
  // scales gently with zoom above the reference zoom, and floors at the
  // reference size below it so appliances stay readable when zoomed out.
  const [mapZoom, setMapZoom] = useState(19);
  // Past the detail threshold the scene layers take over from the patch
  // layers. Driven by live zoom, so it follows the scroll wheel.
  const showGround = mapZoom >= GROUND_DETAIL_ZOOM;
  // Currently hovered appliance marker id. Used to bump the callsign label
  // to its "full" bright form so the operator can identify a specific
  // vehicle without clicking.
  const [hoveredApplianceId, setHoveredApplianceId] = useState<string | null>(null);

  // Fetch the actual OSM building footprint for the incident address so the
  // highlight aligns with the rendered tile rather than a schematic rectangle.
  const [osmBuildingPoly, setOsmBuildingPoly] = useState<[number, number][] | null>(null);
  const incidentLat = incident.scenario.location.coords.lat;
  const incidentLng = incident.scenario.location.coords.lng;
  useEffect(() => {
    let cancelled = false;
    fetchOsmBuildingPolygon({ lat: incidentLat, lng: incidentLng }).then((poly) => {
      if (!cancelled) setOsmBuildingPoly(poly);
    });
    return () => {
      cancelled = true;
    };
  }, [incidentLat, incidentLng]);

  // Real OSM fire hydrants \u2014 fetched once per incident. Labelled H1..HN by
  // proximity. Fall back to the scenario-authored hydrants if Overpass returns
  // nothing.
  const [osmHydrants, setOsmHydrants] = useState<OsmHydrant[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchOsmHydrants({ lat: incidentLat, lng: incidentLng }).then((list) => {
      if (!cancelled) setOsmHydrants(list);
    });
    return () => {
      cancelled = true;
    };
  }, [incidentLat, incidentLng]);

  // Road polylines around the incident — used to snap parking clicks onto
  // the nearest carriageway. Empty until the first Overpass response lands;
  // until then the click handler falls through to the raw lat/lng.
  const [osmRoads, setOsmRoads] = useState<OsmRoadWay[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchOsmRoads({ lat: incidentLat, lng: incidentLng }, 250).then((ways) => {
      if (!cancelled) setOsmRoads(ways);
    });
    return () => {
      cancelled = true;
    };
  }, [incidentLat, incidentLng]);

  // Build the canonical hydrant list used for labels + polylines.
  // Priority:
  //   1. Scenario-authored absolute coords (real kerbside positions from OSM
  //      curated by the scenario author).
  //   2. Real OSM-tagged hydrants near the incident.
  //   3. Scenario-authored scene-metre offsets (legacy / schematic fallback).
  const renderedHydrants: {
    label: string;
    lat: number;
    lng: number;
    sourceId: string;
    street?: string;
  }[] = (() => {
    const scenarioAuthored = (scene?.hydrants ?? []).filter((h) => !!h.coords);
    if (scenarioAuthored.length > 0) {
      return scenarioAuthored.map((h) => ({
        label: h.label,
        lat: h.coords!.lat,
        lng: h.coords!.lng,
        sourceId: `scene:${h.label}`,
        street: h.street,
      }));
    }
    if (osmHydrants && osmHydrants.length > 0) {
      return osmHydrants.slice(0, 8).map((h, i) => ({
        label: `H${i + 1}`,
        lat: h.lat,
        lng: h.lng,
        sourceId: h.id,
      }));
    }
    return (scene?.hydrants ?? [])
      .filter((h) => !!h.pos)
      .map((h) => {
        const p = metresToLatLng(incident.scenario.location.coords, h.pos!);
        return {
          label: h.label,
          lat: p.lat,
          lng: p.lng,
          sourceId: `scene:${h.label}`,
          street: h.street,
        };
      });
  })();

  // On-scene markers: only render appliances whose parking has been set.
  // No more "auto ring" — the operator must place each vehicle deliberately.
  // Vehicles parked within ~6 m of each other are fanned out in a small
  // circle at render time so their bodies and labels don't sit on top of
  // each other. The stored `parkingPos` is unchanged — this is purely a
  // presentation fix so two pumps called to the same bay are still
  // distinguishable on screen.
  const rawOnSceneMarkers = onScene
    .filter((r) => !!r.deployment.parkingPos)
    .map((r) => ({ ...r, pos: r.deployment.parkingPos! }));
  const onSceneMarkers = spreadOverlappingMarkers(rawOnSceneMarkers, 6, 4);

  // En-route ghosts: parked-but-not-yet-arrived appliances. Exclude any
  // deployment that has started its hospital leg — those units have
  // physically left the scene, even though phaseOf still tags them
  // "mobile", and their old parkingPos should not render.
  const ghostMarkers = enRoute
    .filter((r) => r.deployment.parkingPos && !r.deployment.hospitalLegStartedAt)
    .map((r) => ({ ...r, pos: r.deployment.parkingPos! }));

  const hydrantConnections = (() => {
    const m = new Map<string, string>(); // hydrantLabel → callsign
    for (const t of tasks) {
      if (t.kind !== "connect_hydrant" || t.state === "aborted") continue;
      const callsign =
        resolved.find((r) => r.appliance.id === t.applianceId)?.appliance.callsign ?? "";
      if (t.hydrantId) m.set(t.hydrantId, callsign);
    }
    return m;
  })();

  // Awaiting placement — every committed appliance (en-route OR arrived)
  // that the operator has not yet positioned + faced.
  const awaitingPlacement: { applianceId: string; callsign: string; phase: "mobile" | "at_incident" }[] = [];
  for (const r of resolved) {
    if (r.deployment.parkingPos) continue;
    // Same guard the ghost layer uses: a unit on the hospital leg has
    // left the scene even though phaseOf still calls it mobile.
    if (r.deployment.hospitalLegStartedAt) continue;
    if (r.phase !== "mobile" && r.phase !== "at_incident") continue;
    awaitingPlacement.push({
      applianceId: r.deployment.applianceId,
      // A helicopter's placement IS its landing zone — flag it in the
      // panel so the operator knows they're picking an LZ, not a bay.
      callsign: r.deployment.hemsFlight
        ? `${r.appliance.callsign} · SELECT LZ`
        : r.appliance.callsign,
      phase: r.phase,
    });
  }

  // Cancel any in-progress parking workflow if the appliance got placed by
  // another route or was never committed.
  useEffect(() => {
    if (parking.phase === "idle" || parking.phase === "rotate") return;
    const stillAwaiting = awaitingPlacement.some((a) => a.applianceId === parking.applianceId);
    if (!stillAwaiting) {
      setParking({ phase: "idle" });
      onClearPlacePending?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parking, awaitingPlacement]);

  // External arming from the MDT's committed list: arm the two-click
  // placement flow for the requested unit; dropping the request (or the
  // unit becoming placed) stands the flow down.
  useEffect(() => {
    if (!placePendingApplianceId) {
      if (parking.phase === "pos" || parking.phase === "bearing") {
        setParking({ phase: "idle" });
      }
      return;
    }
    const r = resolved.find((x) => x.appliance.id === placePendingApplianceId);
    if (!r || r.deployment.parkingPos) {
      onClearPlacePending?.();
      return;
    }
    setParking({
      phase: "pos",
      applianceId: placePendingApplianceId,
      callsign: r.deployment.hemsFlight
        ? `${r.appliance.callsign} · SELECT LZ`
        : r.appliance.callsign,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placePendingApplianceId]);

  // No auto-park: an arrival stands unplaced until the operator picks
  // its position and facing, armed from the Place button on its row in
  // the MDT's committed list.

  // External request to rotate a parked vehicle. Enter rotate phase with the
  // current parking position as the pivot so the next map click sets the
  // vehicle's new facing bearing.
  useEffect(() => {
    if (!rotatePendingApplianceId) {
      if (parking.phase === "rotate") setParking({ phase: "idle" });
      return;
    }
    const r = resolved.find((x) => x.appliance.id === rotatePendingApplianceId);
    const pos = r?.deployment.parkingPos;
    if (!pos) {
      onClearRotatePending();
      return;
    }
    setParking({
      phase: "rotate",
      applianceId: rotatePendingApplianceId,
      callsign: r!.appliance.callsign,
      pos,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotatePendingApplianceId]);


  return (
    <div className="relative h-full w-full">
    <BasemapToggle
      options={options}
      current={basemapId}
      onChoose={chooseBasemap}
    />
    <MapAttribution basemap={basemap} />
    <PlacementBanner
      parking={parking}
      onCancel={() => {
        if (parking.phase === "rotate") onClearRotatePending();
        else onClearPlacePending?.();
        setParking({ phase: "idle" });
      }}
    />
    <MapContainer
      center={centre}
      zoom={OPENING_ZOOM}
      maxZoom={19}
      minZoom={11}
      scrollWheelZoom
      doubleClickZoom
      touchZoom
      boxZoom
      keyboard
      zoomControl={false}
      attributionControl={false}
      className={"h-full w-full bg-[#050507]" + (basemap.imagery ? " imagery-base" : "")}
    >
      {basemap.styleUrl && !vectorFailed ? (
        <VectorBasemap
          key={basemap.id}
          styleUrl={basemap.styleUrl}
          onFail={onVectorFail}
        />
      ) : (
        <TileLayer
          key={basemap.styleUrl ? `${basemap.id}-fallback` : basemap.id}
          url={basemap.styleUrl ? STREET.url : basemap.url}
          maxNativeZoom={
            basemap.styleUrl ? STREET.maxNativeZoom : basemap.maxNativeZoom
          }
          maxZoom={20}
        />
      )}
      <MapClickHandler
        parking={parking}
        roads={osmRoads}
        closureActive={!!closurePick}
        onClosureClick={(lat, lng, bearingDeg) => onPlaceClosure?.(lat, lng, bearingDeg)}
        musterActive={!!musterPick}
        musterDraft={musterDraft}
        onMusterCentre={(lat, lng) =>
          setMusterDraft({ lat, lng, radiusM: MUSTER_MIN_R_M })
        }
        onMusterRadius={(radiusM) =>
          setMusterDraft((d) => (d ? { ...d, radiusM } : d))
        }
        onMusterCommit={(lat, lng, radiusM) => {
          setMusterDraft(null);
          onPlaceMuster?.(lat, lng, radiusM);
        }}
        onPickedPos={(pos) => {
          if (parking.phase !== "pos") return;
          setParking({
            phase: "bearing",
            applianceId: parking.applianceId,
            callsign: parking.callsign,
            pos,
          });
        }}
        onPickedBearing={(bearingDeg) => {
          if (parking.phase === "bearing") {
            onSetParkingPos(parking.applianceId, parking.pos.lat, parking.pos.lng, bearingDeg);
            setParking({ phase: "idle" });
            onClearPlacePending?.();
          } else if (parking.phase === "rotate") {
            // Re-orienting an already-parked vehicle: reuse the existing
            // position, just update the bearing.
            onSetParkingPos(parking.applianceId, parking.pos.lat, parking.pos.lng, bearingDeg);
            setParking({ phase: "idle" });
            onClearRotatePending();
          }
        }}
      />

      {/* Centres the job when it opens; the operator drives from there. */}
      <OpenOnIncident
        zoom={OPENING_ZOOM}
        lat={incidentLat}
        lng={incidentLng}
      />

      {/* Track zoom so markers and overlays can size themselves to it. */}
      <ZoomTracker onZoom={setMapZoom} />

      {/* Patch and Approach scales. */}
      {!showGround && (
        <PatchLayers
          stations={stations}
          activeIncident={incident}
          deployments={deployments}
          patch={patch ?? null}
          onSelectAppliance={(id) => onSelectAppliance(id)}
          selectedApplianceId={selectedApplianceId}
          onOpenStationBays={onOpenStationBays}
        />
      )}

      {showGround && (
      <>
      {/* Casualty muster / evacuation area. Drawn as ground, not a pin —
          it is the patch the walking wounded are directed to, so its size
          is the operator's call. */}
      {muster && (
        <>
          <Circle
            center={[muster.lat, muster.lng]}
            radius={muster.radiusM}
            pathOptions={{
              color: "#22c55e",
              weight: 2,
              dashArray: "8 5",
              fillColor: "#22c55e",
              fillOpacity: 0.08,
            }}
            interactive={false}
          />
          <Marker
            position={[muster.lat, muster.lng]}
            icon={musterIcon(muster.radiusM)}
            zIndexOffset={800}
          />
        </>
      )}

      {/* Live preview between the two clicks. */}
      {musterDraft && (
        <>
          <Circle
            center={[musterDraft.lat, musterDraft.lng]}
            radius={musterDraft.radiusM}
            pathOptions={{
              color: "#4ade80",
              weight: 2,
              dashArray: "4 4",
              fillColor: "#4ade80",
              fillOpacity: 0.1,
            }}
            interactive={false}
          />
          <Marker
            position={[musterDraft.lat, musterDraft.lng]}
            icon={musterDraftIcon(musterDraft.radiusM)}
            zIndexOffset={900}
          />
        </>
      )}

      {/* Fire-growth overlay — translucent circle whose radius is the
          current modelled fire footprint in metres. Tinted by stage so
          the operator can read "small incipient" vs "approaching
          flashover" at a glance without reading the SITREP. */}
      {sim.fireRadiusM > 0 && (() => {
        const stage = sim.fireStage;
        const style =
          stage === "flashover_risk"
            ? { color: "#dc2626", fillColor: "#dc2626", fillOpacity: 0.32, weight: 2, dashArray: "6 4" }
            : stage === "fully_developed"
              ? { color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.25, weight: 1.5, dashArray: undefined }
              : stage === "developing"
                ? { color: "#f97316", fillColor: "#f97316", fillOpacity: 0.2, weight: 1.5, dashArray: undefined }
                : stage === "incipient"
                  ? { color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 0.15, weight: 1, dashArray: undefined }
                  : stage === "under_control"
                    ? { color: "#10b981", fillColor: "#10b981", fillOpacity: 0.1, weight: 1, dashArray: "3 4" }
                    : { color: "#6b7280", fillColor: "#6b7280", fillOpacity: 0.08, weight: 1, dashArray: "2 4" };
        return (
          <Circle
            center={[incidentLat, incidentLng]}
            radius={sim.fireRadiusM}
            pathOptions={{
              color: style.color,
              fillColor: style.fillColor,
              fillOpacity: style.fillOpacity,
              weight: style.weight,
              dashArray: style.dashArray,
              lineCap: "round",
            }}
            interactive={false}
          />
        );
      })()}

      {/* HEMS landing zone \u2014 marked-out pad at the operator-confirmed LZ:
          dashed touchdown circle (~28 m clear area), aviation H, and a
          live status chip that tracks the aircraft's approach. Renders
          from the moment the LZ is confirmed, under the aircraft sprite. */}
      {resolved
        .filter((r) => r.deployment.hemsFlight && r.deployment.parkingPos)
        .map((r) => {
          const d = r.deployment;
          const pos = d.parkingPos!;
          const touchdownAt = d.arrivesAt - (d.hemsFlight!.walkSec ?? 0) * 1000;
          const phase: "inbound" | "walking" | "ground" =
            now < touchdownAt ? "inbound" : now < d.arrivesAt ? "walking" : "ground";
          return (
            <Fragment key={`lz-${d.applianceId}`}>
              {/* The marked-out landing site. Built from true ground
                  metres so it stays square at any latitude instead of
                  being stretched by the lat/lng grid. */}
              <Polygon
                positions={squareCorners(pos.lat, pos.lng, LZ_HALF_SIDE_M)}
                pathOptions={{
                  color: "#fbbf24",
                  weight: 2,
                  dashArray: "6 6",
                  fillColor: "#fbbf24",
                  fillOpacity: 0.06,
                }}
                interactive={false}
              />
              {squareCornerBrackets(
                pos.lat,
                pos.lng,
                LZ_HALF_SIDE_M,
                4.5,
              ).map((path, i) => (
                <Polyline
                  key={`lz-corner-${d.applianceId}-${i}`}
                  positions={path}
                  pathOptions={{ color: "#fbbf24", weight: 3 }}
                  interactive={false}
                />
              ))}
              <Polygon
                positions={squareCorners(
                  pos.lat,
                  pos.lng,
                  LZ_TOUCHDOWN_HALF_M,
                )}
                pathOptions={{
                  color: "rgba(251,191,36,0.55)",
                  weight: 1.2,
                  fill: false,
                }}
                interactive={false}
              />
              <Marker
                position={[pos.lat, pos.lng]}
                icon={helipadIcon(r.appliance.callsign, phase)}
                interactive={false}
                zIndexOffset={-800}
              />
            </Fragment>
          );
        })}

      {/* Road closures \u2014 three crisp dashes drawn kerb-to-kerb across the
          carriageway (half-width for a single-carriageway closure) with a
          single top-down cone at the middle. Amber while the crew is
          setting out; red once the closure is in force. */}
      {tasks
        .filter(
          (t) =>
            (t.kind === "close_carriageway" || t.kind === "close_road") &&
            t.state !== "aborted" &&
            t.closurePos,
        )
        .map((t) => {
          const pos = t.closurePos!;
          const perp = (t.closureBearingDeg ?? 0) + 90;
          const inForce = t.state === "completed";
          const fullRoad = t.kind === "close_road";
          // Full road: kerb to kerb (\u00b15.5 m). Carriageway: road centre
          // out to one kerb only.
          const from = fullRoad ? -5.5 : 0;
          const to = fullRoad ? 5.5 : 5.5;
          // Exactly three dashes: split the span into 5 slots, draw
          // slots 0/2/4 \u2014 zoom-independent, always tidy.
          const span = to - from;
          const step = span / 5;
          const dashes: [number, number][][] = [0, 2, 4].map((k) => [
            offsetAlongBearing(pos.lat, pos.lng, perp, from + k * step),
            offsetAlongBearing(pos.lat, pos.lng, perp, from + (k + 1) * step),
          ]);
          const colour = inForce ? "#ef4444" : "#f59e0b";
          const coneAt = offsetAlongBearing(
            pos.lat,
            pos.lng,
            perp,
            fullRoad ? 0 : span / 2,
          );
          return (
            <Fragment key={`closure-${t.id}`}>
              {dashes.map((d, i) => (
                <Polyline
                  key={i}
                  positions={d}
                  pathOptions={{
                    color: colour,
                    weight: 4,
                    opacity: inForce ? 0.95 : 0.8,
                    lineCap: "butt",
                  }}
                  interactive={false}
                />
              ))}
              <Marker
                position={coneAt}
                icon={topDownConeIcon(
                  t.kind as "close_carriageway" | "close_road",
                  inForce,
                )}
                interactive={false}
              />
            </Fragment>
          );
        })}

      {/* Subtle building outline (no fill) \u2014 optional spatial hint when OSM
          has a polygon. The primary address marker is the pin below. */}
      {osmBuildingPoly && osmBuildingPoly.length >= 3 && (
        <Polygon
          positions={osmBuildingPoly}
          pathOptions={{
            color: "#ef4444",
            weight: 1.5,
            opacity: 0.75,
            fill: false,
            lineCap: "round",
            lineJoin: "round",
          }}
          interactive={false}
        />
      )}

      {/* Primary address marker — MDT-style crosshair + callout at the
          exact incident lat/lng. The crosshair sits precisely on the point,
          no polygon alignment required. */}
      <Marker
        position={[incidentLat, incidentLng]}
        icon={incidentMdtIcon({
          incidentRef: `#${incident.scenario.id}`,
          typeLabel: formatIncidentTypeShort(incident.scenario.type),
          address: incident.scenario.location.address,
          postcode: incident.scenario.location.postcode,
          showCallout: incidentCalloutOpen,
        })}
        interactive={true}
        eventHandlers={{
          click: () => setIncidentCalloutOpen((v) => !v),
        }}
        zIndexOffset={900}
      />

      {renderedHydrants.map((h) => (
        <Marker
          key={h.sourceId}
          position={[h.lat, h.lng]}
          icon={hydrantIcon(h.label, hydrantConnections.get(h.label), h.street)}
        />
      ))}

      {/* Relay hose lines between appliances — follow foot-route, else a curve */}
      {tasks
        .filter((t) => t.kind === "relay_hose" && t.state !== "aborted")
        .map((t) => {
          const from = onSceneMarkers.find((m) => m.appliance.id === t.sourceApplianceId);
          const to = onSceneMarkers.find((m) => m.appliance.id === t.applianceId);
          if (!from || !to) return null;
          const colour =
            t.hoseType === "LDH_150mm"
              ? "#38bdf8"
              : t.hoseType === "70mm"
                ? "#10b981"
                : "#f59e0b";
          const positions: [number, number][] =
            t.hosePath && t.hosePath.length >= 2
              ? t.hosePath
              : curvedPolyline(from.pos, to.pos);
          return (
            <Fragment key={`rh-${t.id}`}>
              <Polyline
                positions={positions}
                pathOptions={{ color: "#0a0a0c", weight: 6, opacity: 0.55, lineCap: "round" }}
              />
              <Polyline
                positions={positions}
                pathOptions={{ color: colour, weight: 3, opacity: 1, lineCap: "round" }}
              />
            </Fragment>
          );
        })}

      {/* Hydrant → appliance supply lines \u2014 follow foot-route when ORS returned
          a polyline, else a smooth curve. Drawn as a dark halo + a crisp inner
          line for a clean, readable look at any zoom. */}
      {tasks
        .filter((t) => t.kind === "connect_hydrant" && t.state !== "aborted")
        .map((t) => {
          const appliance = onSceneMarkers.find((m) => m.appliance.id === t.applianceId);
          const hydrant = renderedHydrants.find((h) => h.label === t.hydrantId);
          if (!appliance || !hydrant) return null;
          const positions: [number, number][] =
            t.hosePath && t.hosePath.length >= 2
              ? t.hosePath
              : curvedPolyline({ lat: hydrant.lat, lng: hydrant.lng }, appliance.pos);
          return (
            <Fragment key={`ch-${t.id}`}>
              <Polyline
                positions={positions}
                pathOptions={{ color: "#0a0a0c", weight: 6, opacity: 0.55, lineCap: "round" }}
              />
              <Polyline
                positions={positions}
                pathOptions={{ color: "#3b82f6", weight: 3, opacity: 1, lineCap: "round" }}
              />
            </Fragment>
          );
        })}

      {/* Parked on-scene appliances — click selects for the bottom action menu. */}
      {onSceneMarkers.map((m) => {
        const isSelected = selectedApplianceId === m.appliance.id;
        const isHovered = hoveredApplianceId === m.appliance.id;
        const isCommander = sceneCommanderApplianceId === m.appliance.id;
        return (
          <Marker
            key={m.appliance.id}
            position={[m.pos.lat, m.pos.lng]}
            icon={applianceIcon(
              m.appliance.callsign,
              m.appliance.service,
              isCommander,
              isSelected,
              m.appliance.type,
              mapZoom,
              true,
              isHovered,
            )}
            eventHandlers={{
              click: () => onSelectAppliance(m.appliance.id),
              mouseover: () => setHoveredApplianceId(m.appliance.id),
              mouseout: () =>
                setHoveredApplianceId((cur) =>
                  cur === m.appliance.id ? null : cur,
                ),
            }}
          />
        );
      })}

      {/* Deployed kit markers — completed kit_grab tasks drop a kit icon. */}
      {tasks
        .filter((t) => t.kind === "kit_grab" && t.state === "completed")
        .map((t, i) => {
          const src = onSceneMarkers.find((m) => m.appliance.id === t.applianceId);
          if (!src) return null;
          // Drop kit marker mid-way between the parked vehicle and the incident,
          // with a small index offset so multiple kits don't overlap.
          const incLat = incident.scenario.location.coords.lat;
          const incLng = incident.scenario.location.coords.lng;
          const midLat = (src.pos.lat + incLat) / 2;
          const midLng = (src.pos.lng + incLng) / 2;
          const offset = metresToLatLng(
            { lat: midLat, lng: midLng },
            { x: (i % 4) * 2 - 3, y: Math.floor(i / 4) * 2 },
          );
          return (
            <Marker
              key={`kit-${t.id}`}
              position={[offset.lat, offset.lng]}
              icon={kitIcon(t.kitKind!)}
              interactive={false}
            />
          );
        })}

      {/* En-route ghost placements (parking previewed) */}
      {ghostMarkers.map((m) => (
        <Marker
          key={`ghost-${m.appliance.id}`}
          position={[m.pos.lat, m.pos.lng]}
          icon={parkingGhostIcon(
            m.appliance.callsign,
            m.appliance.service,
            m.appliance.type,
            mapZoom,
          )}
          interactive={false}
        />
      ))}

      {/* Bearing preview — a translucent ghost at the chosen position so the
          operator sees what they're rotating during the bearing pick. */}
      {(parking.phase === "bearing" || parking.phase === "rotate") && (
        <Marker
          position={[parking.pos.lat, parking.pos.lng]}
          icon={L.divIcon({
            className: "",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            html: `<div style="width:24px;height:24px;border-radius:50%;border:2px dashed #fde047;background:rgba(253,224,71,0.15);box-shadow:0 0 8px rgba(253,224,71,0.6);"></div>`,
          })}
          interactive={false}
        />
      )}
      </>
      )}
    </MapContainer>
    </div>
  );
}

/** Step banner shown while a placement / LZ pick / rotation is armed
 *  from the MDT. The map itself stays clean otherwise — every unit list
 *  and its actions live on the MDT's Resourcing tab. */
function PlacementBanner({
  parking,
  onCancel,
}: {
  parking: ParkingState;
  onCancel: () => void;
}) {
  if (parking.phase === "idle") return null;
  return (
    <div
      className="pointer-events-auto absolute bottom-4 left-1/2 z-[1300] -translate-x-1/2 rounded-sm border border-(--color-amber)/60 bg-(--color-bg)/95 px-3 py-2 shadow-lg"
      style={{ maxWidth: 460 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
            {parking.phase === "rotate" ? "Rotating" : "Placing"} {parking.callsign}
          </div>
          <div className="mt-0.5 font-mono text-[10px] tracking-widest text-(--color-text)">
            {parking.phase === "pos"
              ? "Step 1 · click on the map to drop the vehicle"
              : parking.phase === "bearing"
                ? "Step 2 · click in the direction the front of the vehicle should face"
                : "Click in the direction the front of the vehicle should face"}
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm border border-(--color-border) px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:border-(--color-amber-dim) hover:text-(--color-amber)"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
