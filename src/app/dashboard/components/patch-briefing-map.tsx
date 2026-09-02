"use client";

import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Polygon, TileLayer, useMap } from "react-leaflet";
import { PATCH, type Patch } from "@/lib/sim/areas";

// World-covering rectangle used as the outer ring of the grey-out mask;
// the county's ten borough rings are punched into it as holes.
const WORLD_RECT: [number, number][] = [
  [-85, -180],
  [-85, 180],
  [85, 180],
  [85, -180],
];

// Fixed Greater Manchester frame — fitted ONCE on mount, never refitted.
const GM_BOUNDS = L.latLngBounds(
  L.latLng(53.32, -2.78),
  L.latLng(53.7, -1.9),
);

function usePatchBoundary(patch: Patch = PATCH): [number, number][][] | null {
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

function FitGmOnce() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(GM_BOUNDS, { animate: false, padding: [8, 8] });
  }, [map]);
  return null;
}

type Props = {
  patch?: Patch;
};

export function PatchBriefingMap({ patch = PATCH }: Props) {
  const rings = usePatchBoundary(patch);

  return (
    <MapContainer
      center={[53.5, -2.32]}
      zoom={10}
      // Fixed-zoom briefing overview — framed once on all of Greater
      // Manchester; the operator can't zoom in/out (pan still works).
      zoomControl={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      className="h-full w-full rounded-sm"
      style={{ background: "#e8e6e1" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Everything OUTSIDE the county greys out: one world-covering
          polygon with a hole cut per borough. The covered ground stays
          full-colour, so the patch reads instantly. */}
      {rings && rings.length > 0 && (
        <Polygon
          positions={[WORLD_RECT, ...rings]}
          pathOptions={{
            color: "transparent",
            fillColor: "#6b7280",
            fillOpacity: 0.55,
            stroke: false,
          }}
          interactive={false}
        />
      )}
      {rings?.map((ring, i) => (
        <Polygon
          key={i}
          positions={ring}
          pathOptions={{
            // Red outline per borough — this is the ground the operator
            // is signing up to cover for the shift, all ten of them.
            color: "#ef4444",
            weight: 2.5,
            fill: false,
          }}
          interactive={false}
        />
      ))}
      <FitGmOnce />
    </MapContainer>
  );
}
