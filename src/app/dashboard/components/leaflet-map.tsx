"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { Deployment, Incident } from "@/lib/sim/incident_types";
import { interpolateAlongRoute } from "@/lib/sim/eta";
import type { ApplianceTypeCode, AreaCode, ServiceCode } from "@/lib/sim/types";
import {
  chipServiceColour,
  incidentMarkerSvg,
  serviceMarker,
  unitMarkerHtml,
  type ChipOpts,
  type IncidentMarkerKind,
} from "./map-markers";
import type { StationWithAppliances } from "../page";

// Service identity colours — fire engines are red, ambulances green,
// police blue. Used for station plaques and responding movers alike.
const SERVICE_COLOUR: Record<ServiceCode, string> = {
  Fire: "#ef4444",
  Ambulance: "#10b981",
  Police: "#3b82f6",
};

/** Stood-down / non-emergency movement (returning to station, offloading
 *  at hospital, rehab) renders yellow regardless of service. */
const STANDDOWN_COLOUR = "#eab308";

// ---------------------------------------------------------------------------
// Marker icons
// ---------------------------------------------------------------------------

/**
 * Station marker — rounded plaque with a service-specific glyph. Mirrors
 * the real signage you see on UK emergency services buildings:
 *
 *   Fire      — eight-pointed Maltese cross on red (international fire symbol)
 *   Ambulance — Star of Life on green (standard UK ambulance service mark)
 *   Police    — Battenberg chequer band on blue (UK police livery)
 *
 * Approximate-location stations get a dashed outer border so the operator
 * can see at a glance which entries the research data hasn't fully
 * verified yet.
 */
/** The marker's width is set by its callsign plate, so the box is left to
 *  size itself and only the anchor is pinned. Leaving iconSize off keeps
 *  the roundel, cluster badge and 999 ring free to overhang. */
function chipIcon(opts: ChipOpts): L.DivIcon {
  const m = unitMarkerHtml(opts);
  return L.divIcon({
    className: "",
    iconAnchor: m.anchor,
    popupAnchor: [0, -m.anchor[1]],
    html: m.html,
  });
}

/** Live map zoom, so markers can pick their tier. */
function useMapZoom(): number {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useEffect(() => {
    const sync = () => setZoom(map.getZoom());
    map.on("zoom", sync);
    map.on("zoomend", sync);
    return () => {
      map.off("zoom", sync);
      map.off("zoomend", sync);
    };
  }, [map]);
  return zoom;
}

/** Station chip — the station id as the callsign, roundel 6 while any
 *  appliance is ready (0 dims the chip otherwise), ×N for multi-bay
 *  stations, service colour on the border per the marker pack. */
function stationIcon(
  service: ServiceCode,
  stationId: string,
  applianceCount: number,
  anyAvailable: boolean,
  zoom: number,
): L.DivIcon {
  return chipIcon({
    callsign: stationId,
    status: anyAvailable ? "available" : "offRun",
    serviceColour: chipServiceColour(service),
    // Stations are not units and have no type code of their own; ST is
    // assigned per the pack rule that every symbol carries two letters.
    resourceCode: "ST",
    zoom,
    dimmed: !anyAvailable,
    cluster: applianceCount,
  });
}

/** Mover chip — status roundel per phase, heading arrow + pulsing 999
 *  ring while blue-lighting, dashed ring when selected. */
export function movingIcon(
  callsign: string,
  service: ServiceCode,
  phase: "outbound" | "hospital_leg" | "at_hospital" | "return",
  zoom: number,
  applianceType?: ApplianceTypeCode,
  bearingDeg?: number,
  selected = false,
): L.DivIcon {
  const status =
    phase === "at_hospital" ? "attendance" : phase === "return" ? "returning" : "mobile";
  const responding = phase === "outbound" || phase === "hospital_leg";
  const sm = serviceMarker(service, applianceType);
  return chipIcon({
    callsign,
    status,
    serviceColour: sm.colour,
    resourceCode: sm.code,
    zoom,
    bearingDeg: responding ? bearingDeg : undefined,
    ring999: responding,
    selected,
  });
}

/** Direction of travel at fraction t along a route — bearing of the small
 *  step ahead, degrees clockwise from north. */
function routeBearingAt(routeCoords: [number, number][], t: number): number {
  const a = interpolateAlongRoute(routeCoords, Math.min(0.999, t));
  const b = interpolateAlongRoute(routeCoords, Math.min(1, Math.min(0.999, t) + 0.004));
  const dLat = b[0] - a[0];
  const dLng = (b[1] - a[1]) * Math.cos((a[0] * Math.PI) / 180);
  if (dLat === 0 && dLng === 0) return 0;
  return ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;
}

// ---------------------------------------------------------------------------
// Patch boundary — real GM metropolitan borough polygons fetched from
// OpenStreetMap via our server-side Overpass proxy. One ring per borough
// in the patch. The rings are rendered as "holes" in a world-covering dark
// mask so only the covered area remains visible, and as a coloured stroke
// around each borough for the outline.
// ---------------------------------------------------------------------------

// World-covering ring used as the outer polygon for the grey-out mask. Each
// borough ring becomes a hole, so the mask darkens everything outside the
// patch while keeping the covered ground fully visible.
const WORLD_RECT: [number, number][] = [
  [-85, -180],
  [-85, 180],
  [85, 180],
  [85, -180],
];

/** Fetch the real borough boundaries for the operator's patch from the
 *  server-side OSM proxy. Returns one outer ring per borough. */
/** Borough rings never change during a shift, and these layers now mount
 *  and unmount every time the operator changes detent — so cache per patch
 *  rather than paying a round trip each swap. */
const patchBoundaryCache = new Map<string, [number, number][][]>();

function usePatchBoundary(patch: AreaCode | null): [number, number][][] | null {
  const [rings, setRings] = useState<[number, number][][] | null>(
    () => (patch ? (patchBoundaryCache.get(patch) ?? null) : null),
  );
  useEffect(() => {
    if (!patch || patch === "ForceWide") {
      setRings(null);
      return;
    }
    const cached = patchBoundaryCache.get(patch);
    if (cached) {
      setRings(cached);
      return;
    }
    let cancelled = false;
    setRings(null);
    fetch(`/api/patch-boundary?patch=${encodeURIComponent(patch)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { rings?: [number, number][][] } | null) => {
        if (cancelled) return;
        if (data?.rings && data.rings.length > 0) {
          patchBoundaryCache.set(patch, data.rings);
          setRings(data.rings);
        }
      })
      .catch(() => {
        /* swallow — the map still renders without a boundary */
      });
    return () => {
      cancelled = true;
    };
  }, [patch]);
  return rings;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = {
  stations: StationWithAppliances[];
  activeIncident: Incident | null;
  deployments: Deployment[];
  patch: AreaCode | null;
  onSelectAppliance: (applianceId: string) => void;
  selectedApplianceId?: string | null;
  /** Opens the top-down appliance-bay view for a fire station. */
  onOpenStationBays?: (stationId: string) => void;
};

export function LeafletMap({
  stations,
  activeIncident,
  deployments,
  patch,
  onSelectAppliance,
  selectedApplianceId,
  onOpenStationBays,
}: Props) {
  const center: [number, number] = activeIncident
    ? [
        activeIncident.scenario.location.coords.lat,
        activeIncident.scenario.location.coords.lng,
      ]
    : stations.length > 0
      ? [
          stations.reduce((s, st) => s + st.coords.lat, 0) / stations.length,
          stations.reduce((s, st) => s + st.coords.lng, 0) / stations.length,
        ]
      : [53.48, -2.24];

  // Real GM borough boundaries for the operator's patch (fetched from OSM

  const patchLabel = patch && patch !== "ForceWide" ? `${patch} Command` : null;

  return (
    <div className="relative h-full w-full">
      {patchLabel && (
        <div
          className="pointer-events-none absolute left-16 top-3 z-[1000] rounded-sm border border-(--color-amber)/60 bg-(--color-bg)/80 px-2.5 py-1 backdrop-blur-sm"
          style={{ boxShadow: "0 0 8px rgba(251,191,36,0.25)" }}
        >
          <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-amber-dim)">
            Operator patch
          </div>
          <div className="font-mono text-[12px] font-semibold tracking-widest text-(--color-amber)">
            {patchLabel}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-(--color-text-dim)">
            <span
              className="inline-block h-0.5 w-4 rounded-full"
              style={{ background: "#fbbf24", boxShadow: "0 0 4px rgba(251,191,36,0.8)" }}
            />
            <span>Metropolitan borough boundary</span>
          </div>
        </div>
      )}
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom
      className="h-full w-full bg-[#050507]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxNativeZoom={19}
        maxZoom={20}
      />
      <PatchLayers
        stations={stations}
        activeIncident={activeIncident}
        deployments={deployments}
        patch={patch}
        onSelectAppliance={onSelectAppliance}
        selectedApplianceId={selectedApplianceId}
        onOpenStationBays={onOpenStationBays}
      />
    </MapContainer>
    </div>
  );
}

/**
 * Patch-scale Leaflet layers: borough boundary, stations, en-route ghost
 * movers and the incident marker.
 *
 * Split out of LeafletMap so the same layers can be dropped into any
 * MapContainer. The persistent map draws them at the Patch and Approach
 * detents and swaps to the ground layers past the detail threshold.
 */
export function PatchLayers({
  stations,
  activeIncident,
  deployments,
  patch,
  onSelectAppliance,
  selectedApplianceId,
  onOpenStationBays,
}: Props) {
  // Markers pick their tier from live zoom — symbol only when pulled back,
  // symbol + callsign at working scale, plus a type line on the ground.
  const zoom = useMapZoom();

  // Internal high-frequency clock so ghost-movers animate smoothly between
  // the dashboard-client's 1Hz status ticks.
  const [mapNow, setMapNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setMapNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  // via our server-side Overpass proxy). One ring per borough.
  const patchRings = usePatchBoundary(patch);

  const inFlight = useMemo(() => {
    if (!activeIncident) return [];
    const incidentCoords = activeIncident.scenario.location.coords;
    const out: {
      key: string;
      applianceId: string;
      callsign: string;
      service: ServiceCode;
      currentCoords: [number, number];
      routeCoords: [number, number][] | null;
      t: number;
      etaRemainingSec: number;
      phase: "outbound" | "hospital_leg" | "at_hospital" | "return";
      applianceType: import("@/lib/sim/types").ApplianceTypeCode;
      hospitalName?: string;
    }[] = [];
    for (const d of deployments) {
      const station = stations.find((s) =>
        s.appliances.some((a) => a.id === d.applianceId),
      );
      if (!station) continue;
      const appliance = station.appliances.find((a) => a.id === d.applianceId);
      if (!appliance) continue;

      // Return leg: hospital/incident → station
      if (
        d.returnStartedAt &&
        d.returnArrivesAt &&
        mapNow >= d.returnStartedAt
      ) {
        if (mapNow >= d.returnArrivesAt) continue; // already home
        const returnTotal = Math.max(
          1,
          (d.returnEtaSeconds ?? (d.returnArrivesAt - d.returnStartedAt) / 1000) * 1000,
        );
        const t = Math.min(1, Math.max(0, (mapNow - d.returnStartedAt) / returnTotal));
        const fromCoords = d.hospitalCoords ?? incidentCoords;
        const routeCoords: [number, number][] =
          d.returnRouteCoords && d.returnRouteCoords.length >= 2
            ? d.returnRouteCoords
            : [
                [fromCoords.lat, fromCoords.lng],
                [station.coords.lat, station.coords.lng],
              ];
        out.push({
          key: `${d.applianceId}-ret`,
          applianceId: d.applianceId,
          callsign: appliance.callsign,
          applianceType: appliance.type,
          service: appliance.service,
          currentCoords: interpolateAlongRoute(routeCoords, t),
          routeCoords,
          t,
          etaRemainingSec: Math.max(0, (d.returnArrivesAt - mapNow) / 1000),
          phase: "return",
          hospitalName: d.hospitalName,
        });
        continue;
      }

      // At hospital: stationary marker at the hospital coords, counting down
      // the offload window.
      if (
        d.hospitalArrivesAt &&
        d.offloadEndsAt &&
        d.hospitalCoords &&
        mapNow >= d.hospitalArrivesAt &&
        mapNow < d.offloadEndsAt
      ) {
        out.push({
          key: `${d.applianceId}-hosp`,
          applianceId: d.applianceId,
          callsign: appliance.callsign,
          applianceType: appliance.type,
          service: appliance.service,
          currentCoords: [d.hospitalCoords.lat, d.hospitalCoords.lng],
          routeCoords: null,
          t: (mapNow - d.hospitalArrivesAt) / (d.offloadEndsAt - d.hospitalArrivesAt),
          etaRemainingSec: Math.max(0, (d.offloadEndsAt - mapNow) / 1000),
          phase: "at_hospital",
          hospitalName: d.hospitalName,
        });
        continue;
      }

      // Hospital leg: incident → hospital
      if (
        d.hospitalLegStartedAt &&
        d.hospitalArrivesAt &&
        d.hospitalCoords &&
        mapNow < d.hospitalArrivesAt
      ) {
        const total = Math.max(
          1,
          (d.hospitalEtaSeconds ?? (d.hospitalArrivesAt - d.hospitalLegStartedAt) / 1000) * 1000,
        );
        const t = Math.min(1, Math.max(0, (mapNow - d.hospitalLegStartedAt) / total));
        const routeCoords: [number, number][] =
          d.hospitalRouteCoords && d.hospitalRouteCoords.length >= 2
            ? d.hospitalRouteCoords
            : [
                [incidentCoords.lat, incidentCoords.lng],
                [d.hospitalCoords.lat, d.hospitalCoords.lng],
              ];
        out.push({
          key: `${d.applianceId}-toh`,
          applianceId: d.applianceId,
          callsign: appliance.callsign,
          applianceType: appliance.type,
          service: appliance.service,
          currentCoords: interpolateAlongRoute(routeCoords, t),
          routeCoords,
          t,
          etaRemainingSec: Math.max(0, (d.hospitalArrivesAt - mapNow) / 1000),
          phase: "hospital_leg",
          hospitalName: d.hospitalName,
        });
        continue;
      }

      // Outbound leg
      if (mapNow >= d.arrivesAt) continue; // already on scene — drawn in incident popup
      const total = Math.max(1, d.etaSeconds * 1000);
      const t = Math.min(1, Math.max(0, (mapNow - d.mobilisedAt) / total));
      const routeCoords: [number, number][] =
        d.routeCoords && d.routeCoords.length >= 2
          ? d.routeCoords
          : [
              [station.coords.lat, station.coords.lng],
              [incidentCoords.lat, incidentCoords.lng],
            ];
      out.push({
        key: d.applianceId,
        applianceId: d.applianceId,
        callsign: appliance.callsign,
        applianceType: appliance.type,
        service: appliance.service,
        currentCoords: interpolateAlongRoute(routeCoords, t),
        routeCoords,
        t,
        etaRemainingSec: Math.max(0, (d.arrivesAt - mapNow) / 1000),
        phase: "outbound",
      });
    }
    return out;
  }, [deployments, stations, mapNow, activeIncident]);

  const arrivedAppliances = useMemo(() => {
    if (!activeIncident) return [];
    const out: { id: string; callsign: string }[] = [];
    for (const d of deployments) {
      if (mapNow < d.arrivesAt) continue;
      const station = stations.find((s) =>
        s.appliances.some((a) => a.id === d.applianceId),
      );
      const appliance = station?.appliances.find((a) => a.id === d.applianceId);
      if (appliance) out.push({ id: appliance.id, callsign: appliance.callsign });
    }
    return out;
  }, [deployments, stations, mapNow, activeIncident]);
  return (
    <>

      {/* Patch coverage mask + outline. Out-of-patch ground fades to dark
          via a single world-rect polygon with a hole cut out per borough;
          the covered boroughs are then stroked individually so the real
          Greater Manchester command boundaries read clearly — shared
          across all three services the operator runs from this patch. */}
      {patchRings && patchRings.length > 0 && (
        <>
          <Polygon
            positions={[WORLD_RECT, ...patchRings]}
            pathOptions={{
              color: "transparent",
              fillColor: "#0a0a0c",
              fillOpacity: 0.55,
              stroke: false,
            }}
            interactive={false}
          />
          {/* Per-borough stroke — thin, soft, with a subtle glow so it reads
              at low zoom without dominating the map. */}
          {patchRings.map((ring, i) => (
            <Polygon
              key={`pb-halo-${i}`}
              positions={ring}
              pathOptions={{
                color: "#fbbf24",
                weight: 4,
                opacity: 0.18,
                fill: false,
                lineCap: "round",
                lineJoin: "round",
              }}
              interactive={false}
            />
          ))}
          {patchRings.map((ring, i) => (
            <Polygon
              key={`pb-line-${i}`}
              positions={ring}
              pathOptions={{
                color: "#fbbf24",
                weight: 1.5,
                opacity: 0.85,
                fill: false,
                lineCap: "round",
                lineJoin: "round",
              }}
              interactive={false}
            />
          ))}
        </>
      )}

      {/* Stations */}
      {stations.map((s) => {
        const deployable = s.appliances.filter(
          (a) => a.status === 7 && a.crew.current >= a.crew.min,
        ).length;
        return (
          <Marker
            key={s.id}
            position={[s.coords.lat, s.coords.lng]}
            icon={stationIcon(
              s.service,
              s.id,
              s.appliances.length,
              s.appliances.some((a) => a.status === 7),
              zoom,
            )}
          >
            <Popup>
              <div
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  color: "#0a0a0c",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    opacity: 0.6,
                  }}
                >
                  {s.id} · {s.staffing}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  {s.address}, {s.town} {s.postcode}
                </div>
                <div style={{ fontSize: 11, marginTop: 6 }}>
                  {deployable}/{s.appliances.length} appliances ready
                </div>
                {s.service === "Fire" && onOpenStationBays && (
                  <button
                    type="button"
                    onClick={() => onOpenStationBays(s.id)}
                    style={{
                      marginTop: 8,
                      width: "100%",
                      padding: "5px 8px",
                      background: "#b91c1c",
                      color: "#fff",
                      border: "none",
                      borderRadius: 3,
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      cursor: "pointer",
                    }}
                  >
                    Open appliance bays →
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Ghost-mover trails: full route polyline, colour depends on phase/service */}
      {inFlight.map((m) =>
        m.routeCoords ? (
          <Polyline
            key={`${m.key}-trail`}
            positions={m.routeCoords}
            pathOptions={{
              color:
                m.phase === "return" || m.phase === "at_hospital"
                  ? STANDDOWN_COLOUR
                  : SERVICE_COLOUR[m.service],
              weight: 2,
              opacity: 0.45,
              dashArray: "4 6",
            }}
          />
        ) : null,
      )}

      {/* Ghost-mover markers (with callsign labels) */}
      {inFlight.map((m) => (
        <Marker
          key={`${m.key}-mover`}
          position={m.currentCoords}
          icon={movingIcon(
            m.callsign,
            m.service,
            m.phase,
            zoom,
            m.applianceType,
            m.routeCoords && (m.phase === "outbound" || m.phase === "hospital_leg")
              ? routeBearingAt(m.routeCoords, m.t)
              : undefined,
            selectedApplianceId === m.applianceId,
          )}
          eventHandlers={{ click: () => onSelectAppliance(m.applianceId) }}
        />
      ))}

      {/* Active incident */}
      {activeIncident && (
        <Marker
          position={[
            activeIncident.scenario.location.coords.lat,
            activeIncident.scenario.location.coords.lng,
          ]}
          icon={L.divIcon({
            className: "",
            iconSize: [80, 66],
            iconAnchor: [40, 48],
            popupAnchor: [0, -36],
            html: incidentMarkerSvg(
              (activeIncident.resolvedAt
                ? "closed"
                : deployments.length > 0
                  ? "assigned"
                  : "unassigned") as IncidentMarkerKind,
            ),
          })}
        >
          <Popup>
            <div
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                color: "#0a0a0c",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#b91c1c",
                }}
              >
                Incident #{activeIncident.scenario.id} · {activeIncident.scenario.severity}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                {activeIncident.scenario.title}
              </div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                {activeIncident.scenario.location.address},{" "}
                {activeIncident.scenario.location.postcode}
              </div>
              <div
                style={{
                  fontSize: 11,
                  marginTop: 8,
                  paddingTop: 6,
                  borderTop: "1px solid rgba(0,0,0,0.1)",
                }}
              >
                <strong>In attendance ({arrivedAppliances.length})</strong>
                {arrivedAppliances.length === 0 ? (
                  <div style={{ marginTop: 2, opacity: 0.6 }}>None yet.</div>
                ) : (
                  <ul style={{ marginTop: 2, paddingLeft: 14 }}>
                    {arrivedAppliances.map((a) => (
                      <li key={a.id}>{a.callsign}</li>
                    ))}
                  </ul>
                )}
                <div style={{ marginTop: 4 }}>
                  Mobile: {inFlight.length}
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}
