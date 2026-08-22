"use client";

// "Property view" for the MDT tablet — a locked aerial photo of the
// actual incident address (Esri World Imagery) with the OSM building
// footprint traced in red, like the property view on a real CAD MDT.

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, Polygon, TileLayer } from "react-leaflet";
import { fetchOsmBuildingPolygon } from "@/lib/sim/osm_building";

export function PropertyAerial({ lat, lng }: { lat: number; lng: number }) {
  const [poly, setPoly] = useState<[number, number][] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchOsmBuildingPolygon({ lat, lng }).then((p) => {
      if (!cancelled) setPoly(p);
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={19}
      zoomControl={false}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      className="h-full w-full"
      style={{ background: "#0a0a0c" }}
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
        maxNativeZoom={19}
        maxZoom={20}
      />
      {poly && poly.length >= 3 && (
        <Polygon
          positions={poly}
          pathOptions={{ color: "#ef4444", weight: 2.5, fill: false }}
          interactive={false}
        />
      )}
    </MapContainer>
  );
}
