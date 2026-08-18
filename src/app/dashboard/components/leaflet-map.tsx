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
} from "react-leaflet";
import type { Deployment, Incident } from "@/lib/sim/incident_types";
import { interpolateAlongRoute } from "@/lib/sim/eta";
import type { AreaCode, ServiceCode } from "@/lib/sim/types";
import type { StationWithAppliances } from "../page";

const SERVICE_COLOUR: Record<ServiceCode, string> = {
  Fire: "#f59e0b",
  Ambulance: "#10b981",
  Police: "#6366f1",
};

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
function stationIcon(service: ServiceCode, approximate?: boolean): L.DivIcon {
  const c = SERVICE_COLOUR[service];
  const stroke = approximate
    ? `border: 1.5px dashed rgba(255,255,255,0.85);`
    : `border: 1.5px solid rgba(255,255,255,0.85);`;
  const glyph =
    service === "Fire"
      ? maltesCrossSvg()
      : service === "Ambulance"
        ? starOfLifeSvg()
        : battenbergSvg();
  return L.divIcon({
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -12],
    html: `
      <div style="
        width: 22px;
        height: 22px;
        border-radius: 4px;
        background: ${c};
        ${stroke}
        box-shadow: 0 1px 2px rgba(0,0,0,0.6), 0 0 0 2px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      ">
        ${glyph}
      </div>
    `,
  });
}

/** Eight-pointed Maltese cross — universal international fire-service
 *  emblem. Rendered in white on the red plaque. */
function maltesCrossSvg(): string {
  return `
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        d="M12 2 L14 8 L20 6 L18 12 L22 14 L16 16 L18 22 L12 20 L6 22 L8 16 L2 14 L6 12 L4 6 L10 8 Z"
        fill="#ffffff" stroke="#00000022" stroke-width="0.4" stroke-linejoin="round"
      />
    </svg>`;
}

/** Star of Life — international symbol for emergency medical services.
 *  Six-pointed star with the Rod of Asclepius (snake on a staff) at its
 *  centre. Simplified to the six points + cross for legibility at 14px. */
function starOfLifeSvg(): string {
  return `
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <g stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none">
        <line x1="12" y1="3" x2="12" y2="21"/>
        <line x1="4"  y1="7.5" x2="20" y2="16.5"/>
        <line x1="4"  y1="16.5" x2="20" y2="7.5"/>
      </g>
      <circle cx="12" cy="12" r="2" fill="#ffffff"/>
    </svg>`;
}

/** UK police Battenberg chequer pattern — two rows of blue/white squares,
 *  the livery markings on UK police vehicles and signage. Legible at 14px
 *  as a compact band with a police "P" centred. */
function battenbergSvg(): string {
  // 6×2 chequer in white-on-transparent so the plaque's blue shows
  // through the clear squares, giving the classic two-tone look.
  const cells: string[] = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 6; col++) {
      const alt = (row + col) % 2 === 0;
      if (!alt) continue;
      const x = col * 4;
      const y = 6 + row * 4;
      cells.push(
        `<rect x="${x}" y="${y}" width="4" height="4" fill="#ffffff"/>`,
      );
    }
  }
  return `
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      ${cells.join("")}
    </svg>`;
}

const incidentIcon = L.divIcon({
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -10],
  html: `
    <div style="position: relative; width: 28px; height: 28px;">
      <div style="
        position: absolute; inset: 0;
        border-radius: 50%;
        background: rgba(239,68,68,0.25);
        animation: incident-pulse 1.4s ease-out infinite;
      "></div>
      <div style="
        position: absolute; left: 8px; top: 8px;
        width: 12px; height: 12px;
        border-radius: 50%;
        background: #ef4444;
        box-shadow: 0 0 0 2px rgba(239,68,68,0.4), 0 0 0 4px rgba(0,0,0,0.55);
      "></div>
    </div>
    <style>
      @keyframes incident-pulse {
        0% { transform: scale(0.6); opacity: 0.9; }
        100% { transform: scale(1.8); opacity: 0; }
      }
    </style>
  `,
});

function movingIcon(
  callsign: string,
  service: ServiceCode,
  phase: "outbound" | "return" = "outbound",
): L.DivIcon {
  const base = SERVICE_COLOUR[service];
  const colour = phase === "return" ? "#38bdf8" : base;
  const glow =
    phase === "return" ? "rgba(56,189,248,0.55)" : `${base}88`;
  return L.divIcon({
    className: "",
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    popupAnchor: [0, -6],
    html: `
      <div style="position: relative;">
        <div style="
          position: absolute; left: -5px; top: -5px;
          width: 10px; height: 10px; border-radius: 50%;
          background: ${colour};
          box-shadow: 0 0 0 2px rgba(0,0,0,0.55), 0 0 8px ${glow};
        "></div>
        <div style="
          position: absolute; left: 10px; top: -8px;
          padding: 2px 5px;
          background: rgba(10,10,12,0.92);
          border: 1px solid ${colour};
          border-radius: 2px;
          font-family: var(--font-geist-mono), ui-monospace, monospace;
          font-size: 10px; line-height: 1;
          color: ${colour};
          letter-spacing: 0.04em;
          white-space: nowrap;
        ">${callsign}</div>
      </div>
    `,
  });
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
function usePatchBoundary(patch: AreaCode | null): [number, number][][] | null {
  const [rings, setRings] = useState<[number, number][][] | null>(null);
  useEffect(() => {
    if (!patch || patch === "ForceWide") {
      setRings(null);
      return;
    }
    let cancelled = false;
    setRings(null);
    fetch(`/api/patch-boundary?patch=${encodeURIComponent(patch)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { rings?: [number, number][][] } | null) => {
        if (cancelled) return;
        if (data?.rings && data.rings.length > 0) setRings(data.rings);
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
};

export function LeafletMap({
  stations,
  activeIncident,
  deployments,
  patch,
  onSelectAppliance,
}: Props) {
  // Internal high-frequency clock so ghost-movers animate smoothly between
  // the dashboard-client's 1Hz status ticks.
  const [mapNow, setMapNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setMapNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

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
            icon={stationIcon(s.service, s.coordsApproximate)}
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
                m.phase === "return"
                  ? "#38bdf8"
                  : m.phase === "hospital_leg"
                    ? "#ef4444"
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
          icon={movingIcon(m.callsign, m.service, mapPhaseToIconPhase(m.phase))}
          eventHandlers={{ click: () => onSelectAppliance(m.applianceId) }}
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
                  color:
                    m.phase === "return"
                      ? "#0284c7"
                      : m.phase === "hospital_leg" || m.phase === "at_hospital"
                        ? "#b91c1c"
                        : "#b4730d",
                }}
              >
                {phaseLabel(m.phase)}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                {m.callsign}
              </div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                {m.phase === "at_hospital" ? (
                  <>
                    At {m.hospitalName ?? "hospital"} · offload ETA {fmtSecs(m.etaRemainingSec)}
                  </>
                ) : m.phase === "hospital_leg" ? (
                  <>
                    → {m.hospitalName ?? "hospital"} · ETA {fmtSecs(m.etaRemainingSec)}
                  </>
                ) : (
                  <>
                    ETA {fmtSecs(m.etaRemainingSec)} · {Math.round(m.t * 100)}% along route
                  </>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Active incident */}
      {activeIncident && (
        <Marker
          position={[
            activeIncident.scenario.location.coords.lat,
            activeIncident.scenario.location.coords.lng,
          ]}
          icon={incidentIcon}
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
    </MapContainer>
    </div>
  );
}

function fmtSecs(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}m ${r}s`;
}

function phaseLabel(phase: "outbound" | "hospital_leg" | "at_hospital" | "return"): string {
  switch (phase) {
    case "outbound":
      return "Status 1 · Mobile to incident";
    case "hospital_leg":
      return "Status 1 · Mobile to hospital";
    case "at_hospital":
      return "Status 5 · At hospital · offloading";
    case "return":
      return "Status 4 · Returning to station";
  }
}

function mapPhaseToIconPhase(
  phase: "outbound" | "hospital_leg" | "at_hospital" | "return",
): "outbound" | "return" {
  // Existing icon only supports outbound vs return colouring. Hospital legs
  // share outbound (amber/service colour); return shares return (cyan).
  return phase === "return" ? "return" : "outbound";
}
