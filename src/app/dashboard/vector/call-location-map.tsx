"use client";

// The small caller-location map on the 999 screen. Leaflet, so it must
// only ever render on the client — call-screen loads it with ssr:false.

import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";
import { STREET } from "@/lib/map-basemaps";

function Recentre({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(L.latLng(lat, lng), 16, { animate: false });
  }, [map, lat, lng]);
  return null;
}

export function CallLocationMap({ lat, lng }: { lat: number; lng: number }) {
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
      <CircleMarker center={[lat, lng]} radius={9} pathOptions={{ color: "#1b4d8f", weight: 3, fillColor: "#fff", fillOpacity: 1 }} />
      <Recentre lat={lat} lng={lng} />
    </MapContainer>
  );
}
