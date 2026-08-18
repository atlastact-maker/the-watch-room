"use client";

import dynamic from "next/dynamic";
import type { Appliance } from "@/lib/sim/types";
import type { Deployment, Incident, Task, TaskKind } from "@/lib/sim/incident_types";
import type { IncidentSimState } from "@/lib/sim/incident_sim";
import type { ResolvedDeployment } from "./incident-view";

const LeafletGroundMap = dynamic(
  () => import("./leaflet-ground-map").then((m) => m.LeafletGroundMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
        Loading ground map…
      </div>
    ),
  },
);

export type ResolvedOnSceneDeployment = {
  deployment: Deployment;
  appliance: Appliance;
};

export function GroundSceneMap(props: {
  incident: Incident;
  resolved: ResolvedDeployment[];
  onScene: ResolvedOnSceneDeployment[];
  enRoute: ResolvedOnSceneDeployment[];
  sim: IncidentSimState;
  tasks: Task[];
  sceneCommanderApplianceId: string | null;
  crewAir: Record<string, number>;
  busyCrewIds: Set<string>;
  vehicleGauges: Record<string, { fuelPct: number; waterPct: number; conditionPct: number }>;
  selectedApplianceId: string | null;
  now: number;
  onSetParkingPos: (applianceId: string, lat: number, lng: number, bearingDeg: number) => void;
  rotatePendingApplianceId: string | null;
  onClearRotatePending: () => void;
  nightMode?: boolean;
  onStartTask: (args: {
    applianceId: string;
    kind: TaskKind;
    assignedCrewIds: string[];
    hydrantId?: string;
    sourceApplianceId?: string;
    hoseType?: import("@/lib/sim/incident_types").HoseType;
    kitKind?: import("@/lib/sim/incident_types").KitKind;
    hazardId?: string;
    mitigationMethod?: string;
  }) => void;
  onAbortTask: (taskId: string) => void;
  onSelectAppliance: (id: string | null) => void;
}) {
  return (
    <div className="absolute inset-0">
      <LeafletGroundMap {...props} />
    </div>
  );
}
