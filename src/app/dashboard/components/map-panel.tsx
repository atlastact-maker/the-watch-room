"use client";

import dynamic from "next/dynamic";
import type { Deployment, Incident } from "@/lib/sim/incident_types";
import type { Patch } from "@/lib/sim/areas";
import type { MapFocus } from "./leaflet-map";
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
  patrols,
  patch,
  onSelectAppliance,
  selectedApplianceId,
  onOpenStationBays,
  onZoomIntoGround,
  focus,
}: {
  stations: StationWithAppliances[];
  activeIncident: Incident | null;
  deployments: Deployment[];
  /** Roads units out on their patch rather than parked at a base. */
  patrols?: {
    applianceId: string;
    callsign: string;
    circuitLabel: string;
    coords: { lat: number; lng: number };
    bearing: number;
    selected?: boolean;
  }[];
  patch: Patch | null;
  onSelectAppliance: (applianceId: string) => void;
  selectedApplianceId?: string | null;
  onOpenStationBays?: (stationId: string) => void;
  onZoomIntoGround?: (view: { lat: number; lng: number; zoom: number }) => void;
  focus?: MapFocus | null;
}) {
  return (
    <div className="absolute inset-0 bg-(--color-bg)">
      <LeafletMap
        stations={stations}
        activeIncident={activeIncident}
        deployments={deployments}
        patrols={patrols}
        patch={patch}
        onSelectAppliance={onSelectAppliance}
        selectedApplianceId={selectedApplianceId}
        onOpenStationBays={onOpenStationBays}
        onZoomIntoGround={onZoomIntoGround}
        focus={focus}
      />
    </div>
  );
}
