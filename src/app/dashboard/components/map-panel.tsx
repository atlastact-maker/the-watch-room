"use client";

import dynamic from "next/dynamic";
import type { Deployment, Incident } from "@/lib/sim/incident_types";
import type { Patch } from "@/lib/sim/areas";
import type { StationWithAppliances } from "../page";

// Leaflet must not run on the server (it touches `window`).
const LeafletMap = dynamic(() => import("./leaflet-map").then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
      Loading map…
    </div>
  ),
});

export function EmbeddedMap({
  stations,
  activeIncident,
  deployments,
  patch,
  onSelectAppliance,
  selectedApplianceId,
  onOpenStationBays,
  onZoomIntoGround,
}: {
  stations: StationWithAppliances[];
  activeIncident: Incident | null;
  deployments: Deployment[];
  patch: Patch | null;
  onSelectAppliance: (applianceId: string) => void;
  selectedApplianceId?: string | null;
  onOpenStationBays?: (stationId: string) => void;
  onZoomIntoGround?: (view: { lat: number; lng: number; zoom: number }) => void;
}) {
  return (
    <div className="absolute inset-0 bg-(--color-bg)">
      <LeafletMap
        stations={stations}
        activeIncident={activeIncident}
        deployments={deployments}
        patch={patch}
        onSelectAppliance={onSelectAppliance}
        selectedApplianceId={selectedApplianceId}
        onOpenStationBays={onOpenStationBays}
        onZoomIntoGround={onZoomIntoGround}
      />
    </div>
  );
}
