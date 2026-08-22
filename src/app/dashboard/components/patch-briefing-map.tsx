"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { AreaCode, ServiceCode } from "@/lib/sim/types";
import type { StationWithAppliances } from "../page";
import type { Scenario } from "@/lib/sim/incident_types";

type Patch = Exclude<AreaCode, "ForceWide">;

const SERVICE_COLOUR: Record<ServiceCode, string> = {
  Fire: "#f59e0b",
  Ambulance: "#10b981",
  Police: "#6366f1",
};

const SEVERITY_COLOUR: Record<string, string> = {
  low: "#94a3b8",
  moderate: "#eab308",
  high: "#f97316",
  major: "#ef4444",
};

function stationDot(service: ServiceCode): L.DivIcon {
  const c = SERVICE_COLOUR[service];
  return L.divIcon({
    className: "",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    html: `<div style="
      width:10px;height:10px;border-radius:2px;background:${c};
      border:1.5px solid rgba(255,255,255,0.85);
      box-shadow:0 1px 2px rgba(0,0,0,0.6);
    "></div>`,
  });
}

function scenarioPin(index: number, severity: string): L.DivIcon {
  const c = SEVERITY_COLOUR[severity] ?? "#f59e0b";
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="
      width:24px;height:24px;border-radius:999px;background:${c};
      border:2px solid rgba(255,255,255,0.9);
      box-shadow:0 2px 4px rgba(0,0,0,0.6);
      display:flex;align-items:center;justify-content:center;
      font-family:ui-monospace,SFMono-Regular,Consolas,monospace;
      font-size:12px;font-weight:700;color:#000;
    ">${index}</div>`,
  });
}

function usePatchBoundary(patch: Patch): [number, number][][] | null {
  const [rings, setRings] = useState<[number, number][][] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/patch-boundary?patch=${encodeURIComponent(patch)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled || !body) return;
        setRings(body.rings ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [patch]);
  return rings;
}

function FitToPatch({
  stations,
  scenarios,
  rings,
}: {
  stations: StationWithAppliances[];
  scenarios: Scenario[];
  rings: [number, number][][] | null;
}) {
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = [];
    for (const s of stations) pts.push([s.coords.lat, s.coords.lng]);
    for (const s of scenarios)
      pts.push([s.location.coords.lat, s.location.coords.lng]);
    if (rings) for (const ring of rings) for (const p of ring) pts.push(p);
    if (pts.length === 0) return;
    const bounds = L.latLngBounds(pts.map(([a, b]) => L.latLng(a, b)));
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [map, stations, scenarios, rings]);
  return null;
}

type Props = {
  patch: Patch;
  stations: StationWithAppliances[];
  scenarios: Scenario[];
  onSelectScenario?: (scenarioId: string) => void;
};

export function PatchBriefingMap({
  patch,
  stations,
  scenarios,
  onSelectScenario,
}: Props) {
  const rings = usePatchBoundary(patch);

  const centre: [number, number] = useMemo(() => {
    if (stations.length === 0) return [53.48, -2.24];
    const lat = stations.reduce((s, st) => s + st.coords.lat, 0) / stations.length;
    const lng = stations.reduce((s, st) => s + st.coords.lng, 0) / stations.length;
    return [lat, lng];
  }, [stations]);

  return (
    <MapContainer
      center={centre}
      zoom={10}
      scrollWheelZoom
      className="h-full w-full rounded-sm"
      style={{ background: "#0b0f14" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {rings?.map((ring, i) => (
        <Polygon
          key={i}
          positions={ring}
          pathOptions={{
            // Red outline — this is the ground the operator is signing
            // up to cover for the shift.
            color: "#ef4444",
            weight: 2.5,
            fillColor: "#ef4444",
            fillOpacity: 0.05,
          }}
        />
      ))}
      {stations.map((s) => (
        <Marker
          key={s.id}
          position={[s.coords.lat, s.coords.lng]}
          icon={stationDot(s.service)}
        >
          <Popup>
            <div style={{ font: "12px ui-monospace,monospace" }}>
              <strong>{s.name}</strong>
              <br />
              {s.service} · {s.id}
              <br />
              {s.appliances.length} appliances
            </div>
          </Popup>
        </Marker>
      ))}
      {scenarios.map((sc, i) => (
        <Marker
          key={sc.id}
          position={[sc.location.coords.lat, sc.location.coords.lng]}
          icon={scenarioPin(i + 1, sc.severity)}
          eventHandlers={
            onSelectScenario
              ? { click: () => onSelectScenario(sc.id) }
              : undefined
          }
        >
          <Popup>
            <div style={{ font: "12px ui-monospace,monospace", maxWidth: 240 }}>
              <strong>{sc.title}</strong>
              <br />
              <em>{sc.severity}</em> · {sc.type.replace(/_/g, " ")}
              <br />
              {sc.location.address}
            </div>
          </Popup>
        </Marker>
      ))}
      <FitToPatch stations={stations} scenarios={scenarios} rings={rings} />
    </MapContainer>
  );
}
