"use client";

// The small caller-location map on the 999 screen. Leaflet, so it must
// only ever render on the client — call-screen loads it with ssr:false.
//
// Once the job has been sent and the caller is still on the line, the
// units on their way to it are drawn here too: each one on its route,
// the frame widened to hold the caller and everyone coming, and tightened
// again as they close. No stations — this is the caller's corner of the
// patch, not the whole of it.

import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { STREET } from "@/lib/map-basemaps";
import type { ApplianceTypeCode, ServiceCode } from "@/lib/sim/types";
import { movingIcon } from "../components/leaflet-map";

/** A unit the open call's job has on the road, or just arrived. */
export type CallMapUnit = {
  id: string;
  callsign: string;
  service: ServiceCode;
  type: ApplianceTypeCode;
  pos: { lat: number; lng: number };
  /** The road it is taking, while it is still on it. */
  route?: [number, number][];
  arrived: boolean;
  etaSec: number;
};

const SERVICE_COLOUR: Record<ServiceCode, string> = {
  Fire: "#d7263d",
  Ambulance: "#1f9d55",
  Police: "#2563eb",
};

/** Holds the caller and every responding unit in the frame. Refits when
 *  the set of units changes, when one runs out of the frame, and when
 *  they have all closed in enough that the frame can tighten. */
function Frame({ lat, lng, units }: { lat: number; lng: number; units: CallMapUnit[] }) {
  const map = useMap();
  const key = units.map((u) => u.id).sort().join(",");
  const needed = () => L.latLngBounds([L.latLng(lat, lng), ...units.map((u) => L.latLng(u.pos.lat, u.pos.lng))]).pad(0.25);
  useEffect(() => {
    if (units.length === 0) {
      map.setView(L.latLng(lat, lng), 16, { animate: false });
      return;
    }
    map.fitBounds(needed(), { maxZoom: 16, animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, lat, lng, key]);
  useEffect(() => {
    if (units.length === 0) return;
    const view = map.getBounds();
    const outside = units.some((u) => !view.contains(L.latLng(u.pos.lat, u.pos.lng)));
    const tight = L.latLngBounds([L.latLng(lat, lng), ...units.map((u) => L.latLng(u.pos.lat, u.pos.lng))]);
    const tooFar = view.pad(-0.3).contains(tight) && map.getZoom() < 16;
    if (outside || tooFar) map.fitBounds(needed(), { maxZoom: 16, animate: true, duration: 0.6 });
  });
  return null;
}

export function CallLocationMap({ lat, lng, units = [] }: { lat: number; lng: number; units?: CallMapUnit[] }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
      style={{ background: "#dfe4e8" }}
    >
      <TileLayer url={STREET.url} maxNativeZoom={STREET.maxNativeZoom} />
      {units.map((u) =>
        u.route && u.route.length >= 2 ? (
          <Polyline key={`route-${u.id}`} positions={u.route} pathOptions={{ color: SERVICE_COLOUR[u.service], weight: 2.5, opacity: 0.8, dashArray: "5 7" }} interactive={false} />
        ) : null,
      )}
      <CircleMarker center={[lat, lng]} radius={9} pathOptions={{ color: "#1b4d8f", weight: 3, fillColor: "#fff", fillOpacity: 1 }} />
      {units.map((u) => (
        <Marker key={`unit-${u.id}`} position={[u.pos.lat, u.pos.lng]} icon={movingIcon(u.callsign, u.service, u.arrived ? "at_hospital" : "outbound", 15, u.type)} interactive={false} zIndexOffset={400} />
      ))}
      <Frame lat={lat} lng={lng} units={units} />
    </MapContainer>
  );
}
