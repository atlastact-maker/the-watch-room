"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
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
  unitDivIcon,
  type ChipOpts,
  type IncidentMarkerKind,
} from "./map-markers";
import type { StationWithAppliances } from "../page";
import {
  BasemapToggle,
  MapAttribution,
  useBasemapChoice,
} from "./basemap-controls";
import { VectorBasemap } from "./vector-basemap";
import { STREET } from "@/lib/map-basemaps";

/** The zoom at which scene detail takes over from patch furniture. One
 *  number shared by both maps: the incident map swaps its layers here,
 *  and the dispatch map hands over to the ground view here. */
export const GROUND_DETAIL_ZOOM = 17;

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

/**
 * Trail styling is constant per colour. Handing Leaflet a fresh options
 * object on every clock tick makes it restyle every dashed line four times
 * a second, which shows up as flicker on the route lines.
 */
const TRAIL_STYLES = new Map<string, L.PathOptions>();
function trailStyle(color: string): L.PathOptions {
  let style = TRAIL_STYLES.get(color);
  if (!style) {
    style = { color, weight: 2, opacity: 0.45, dashArray: "4 6" };
    TRAIL_STYLES.set(color, style);
  }
  return style;
}

// ---------------------------------------------------------------------------
// Marker icons
// ---------------------------------------------------------------------------

/** The incident triangle animates (mk-999 pulse, mk-inc breathe), so it
 *  gets the same treatment as the unit markers: one icon per kind, ever,
 *  or the 250ms clock restarts the animation from frame zero each tick. */
const INCIDENT_ICONS = new Map<IncidentMarkerKind, L.DivIcon>();
function incidentIcon(kind: IncidentMarkerKind): L.DivIcon {
  let icon = INCIDENT_ICONS.get(kind);
  if (!icon) {
    icon = L.divIcon({
      className: "",
      iconSize: [80, 66],
      iconAnchor: [40, 48],
      popupAnchor: [0, -36],
      html: incidentMarkerSvg(kind),
    });
    INCIDENT_ICONS.set(kind, icon);
  }
  return icon;
}

/** The marker's width is set by its callsign plate, so the box is left to
 *  size itself and only the anchor is pinned. Cached by inputs - see
 *  unitDivIcon - so re-renders reuse the same DOM and animations keep
 *  their rhythm. */
function chipIcon(opts: ChipOpts): L.DivIcon {
  return unitDivIcon(opts);
}

/** Fires once each time the operator zooms in past the detail
 *  threshold. The dashboard uses it to open the ground view — zooming
 *  into the job IS the gesture of going to work on it, so the switch
 *  should not need a separate click. Re-arms after zooming back out. */
function ZoomIntoGroundWatcher({ onReach }: { onReach: () => void }) {
  const map = useMap();
  const armedRef = useRef(true);
  useEffect(() => {
    const check = () => {
      const z = map.getZoom();
      if (z >= GROUND_DETAIL_ZOOM && armedRef.current) {
        armedRef.current = false;
        onReach();
      } else if (z < GROUND_DETAIL_ZOOM) {
        armedRef.current = true;
      }
    };
    map.on("zoomend", check);
    return () => {
      map.off("zoomend", check);
    };
  }, [map, onReach]);
  return null;
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

/** Station marker — the station id on the plate, service colour on the
 *  symbol. Pulled fully back the colour block alone is the useful fact, so
 *  the status roundel and bay count drop away below zoom 14. */
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
    // Stations are not units and carry no resource code — the symbol is
    // a plain block of the service colour and the plate does the naming.
    resourceCode: "",
    zoom,
    dimmed: !anyAvailable,
    cluster: applianceCount,
    quietWhenCompact: true,
  });
}

/** Mover marker — status roundel per phase, pulsing 999 ring while
 *  blue-lighting, dashed ring when selected. */
export function movingIcon(
  callsign: string,
  service: ServiceCode,
  phase: "outbound" | "hospital_leg" | "at_hospital" | "return",
  zoom: number,
  applianceType?: ApplianceTypeCode,
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
    ring999: responding,
    selected,
  });
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
  /** Called when the operator zooms in past the ground-detail threshold —
   *  the dashboard opens the ground view on it. */
  onZoomIntoGround?: () => void;
  /** The incident map turns this off above the detail threshold, where
   *  its own crosshair address marker takes over from the triangle.
   *  Stations, movers and trails are NOT gated — a responding unit must
   *  stay visible the whole way in, not vanish at a zoom boundary. */
  showIncidentMarker?: boolean;
};

export function LeafletMap({
  stations,
  activeIncident,
  deployments,
  patch,
  onSelectAppliance,
  selectedApplianceId,
  onOpenStationBays,
  onZoomIntoGround,
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

  const patchLabel = patch && patch !== "ForceWide" ? `${patch} Command` : null;
  const {
    options: basemapOptions,
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
        </div>
      )}
    <BasemapToggle
      options={basemapOptions}
      current={basemapId}
      onChoose={chooseBasemap}
    />
    <MapAttribution basemap={basemap} />
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom
      attributionControl={false}
      className={
        "h-full w-full bg-[#050507]" + (basemap.imagery ? " imagery-base" : "")
      }
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
      {onZoomIntoGround && <ZoomIntoGroundWatcher onReach={onZoomIntoGround} />}
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
 * Patch-scale Leaflet layers: stations, en-route ghost movers and the
 * incident marker.
 *
 * Split out of LeafletMap so the same layers can be dropped into any
 * MapContainer — the incident map draws them once the operator zooms back
 * out past the ground-detail threshold.
 */
export function PatchLayers({
  stations,
  activeIncident,
  deployments,
  patch,
  onSelectAppliance,
  selectedApplianceId,
  onOpenStationBays,
  showIncidentMarker = true,
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

  // Straight-line stand-ins used until a real route comes back from the
  // router. Built once per leg, because the polyline must keep the same
  // array identity between clock ticks — a new array means Leaflet
  // re-simplifies and redraws the whole dashed line, and at 4Hz that is
  // the flicker you see while units are still responding.
  // Keyed by which legs exist, not by the deployments array's identity -
  // sim ticks that recreate the array without changing the legs must not
  // hand every dashed line a fresh coordinates array to redraw.
  const legFingerprint = deployments
    .map((d) => `${d.applianceId}:${d.hospitalCoords ? 1 : 0}`)
    .join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fallbackRoutes = useMemo(() => {
    const out = new Map<string, [number, number][]>();
    if (!activeIncident) return out;
    const inc = activeIncident.scenario.location.coords;
    for (const d of deployments) {
      const station = stations.find((s) =>
        s.appliances.some((a) => a.id === d.applianceId),
      );
      if (!station) continue;
      out.set(d.applianceId, [
        [station.coords.lat, station.coords.lng],
        [inc.lat, inc.lng],
      ]);
      if (d.hospitalCoords) {
        out.set(`${d.applianceId}-toh`, [
          [inc.lat, inc.lng],
          [d.hospitalCoords.lat, d.hospitalCoords.lng],
        ]);
      }
      out.set(`${d.applianceId}-ret`, [
        [
          (d.hospitalCoords ?? inc).lat,
          (d.hospitalCoords ?? inc).lng,
        ],
        [station.coords.lat, station.coords.lng],
      ]);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legFingerprint, stations, activeIncident?.id]);

  const inFlight = useMemo(() => {
    if (!activeIncident) return [];
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
        const routeCoords: [number, number][] =
          d.returnRouteCoords && d.returnRouteCoords.length >= 2
            ? d.returnRouteCoords
            : fallbackRoutes.get(`${d.applianceId}-ret`) ?? [];
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
            : fallbackRoutes.get(`${d.applianceId}-toh`) ?? [];
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
          : fallbackRoutes.get(d.applianceId) ?? [];
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
  }, [deployments, stations, mapNow, activeIncident, fallbackRoutes]);

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
        m.routeCoords && m.routeCoords.length >= 2 ? (
          <Polyline
            key={`${m.key}-trail`}
            positions={m.routeCoords}
            pathOptions={trailStyle(
              m.phase === "return" || m.phase === "at_hospital"
                ? STANDDOWN_COLOUR
                : SERVICE_COLOUR[m.service],
            )}
            interactive={false}
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
            selectedApplianceId === m.applianceId,
          )}
          eventHandlers={{ click: () => onSelectAppliance(m.applianceId) }}
        />
      ))}

      {/* Active incident */}
      {activeIncident && showIncidentMarker && (
        <Marker
          position={[
            activeIncident.scenario.location.coords.lat,
            activeIncident.scenario.location.coords.lng,
          ]}
          icon={incidentIcon(
            activeIncident.resolvedAt
              ? "closed"
              : deployments.length > 0
                ? "assigned"
                : "unassigned",
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
