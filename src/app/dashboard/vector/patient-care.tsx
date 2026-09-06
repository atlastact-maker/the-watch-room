"use client";

// Patient Care — one workspace for every casualty on an incident, opened
// from the desk (CAD → Casualties: the whole incident, so control can
// coordinate crews and transport) and from the tablet (MDT → Patient
// care: the same records, filtered to that resource's own patients).
// Either view lifts into its own window for a second screen. The record
// itself is the simulator's casualty body — survey, ABC, resus, drugs,
// packaging, destination and conveyance — painted in the desk's scheme.

import { useState } from "react";
import type { Deployment, Task } from "@/lib/sim/incident_types";
import { CasualtiesBody, type ResolvedDeployment } from "../components/incident-view";
import { CAD_VARS } from "../components/cad-theme";
import { VectorTile, type TileLayout } from "./tile";

export type CasualtiesBodyProps = Parameters<typeof CasualtiesBody>[0];

export type PatientCareProps = Omit<CasualtiesBodyProps, "sim"> & {
  sim: CasualtiesBodyProps["sim"] | null;
  incidentRef: string;
  /** Open filtered to this resource's patients — the tablet's view. */
  focusApplianceId?: string | null;
};

/** Casualties a resource is responsible for: the patient its crew is
 *  treating or conveying, and any it is carrying out of the building. */
export function assignedCasualtyIds(
  applianceId: string,
  deployments: Deployment[],
  tasks: Task[],
): Set<string> {
  const ids = new Set<string>();
  for (const d of deployments) {
    if (d.applianceId === applianceId && d.treatingCasualtyId) ids.add(d.treatingCasualtyId);
  }
  for (const t of tasks) {
    if (t.applianceId === applianceId && t.kind === "extract_casualty" && t.state === "active" && t.casualtyId) ids.add(t.casualtyId);
  }
  return ids;
}

function stageOf(sim: NonNullable<PatientCareProps["sim"]>, id: string) {
  return sim.casualtyProgression?.[id]?.stage ?? "located";
}

export function PatientCareWorkspace(props: PatientCareProps) {
  const { sim, incidentRef, focusApplianceId, deployments, resolved, tasks, ...body } = props;
  const [filter, setFilter] = useState<string>(focusApplianceId ?? "all");

  if (!sim) {
    return (
      <div className="vec-patients">
        <div className="vec-tile-sub">
          <strong>PATIENT CARE</strong>
          <span>No live incident selected</span>
        </div>
        <div className="vec-tile-empty">Select a live incident to see its casualties</div>
      </div>
    );
  }

  const located = sim.foundCasualties.filter((c) => stageOf(sim, c.id) !== "undiscovered");
  const critical = located.filter((c) => (sim.casualtyProgression?.[c.id]?.severity ?? c.severity) === "critical").length;
  const treating = deployments.filter((d) => d.treatingCasualtyId).length;
  const conveyed = located.filter((c) => ["conveying", "at_hospital"].includes(stageOf(sim, c.id))).length;

  // Resources with patients of their own, plus the tablet's unit even when
  // it has none yet, so its crew sees where they stand.
  const units = resolved
    .map((r) => ({ r, ids: assignedCasualtyIds(r.appliance.id, deployments, tasks) }))
    .filter(({ r, ids }) => ids.size > 0 || r.appliance.id === focusApplianceId);
  const focus = units.find(({ r }) => r.appliance.id === filter);
  const shown = filter === "all" || !focus ? located : located.filter((c) => focus.ids.has(c.id));
  const filteredSim = filter === "all" ? sim : { ...sim, foundCasualties: shown };

  return (
    <div className="vec-patients">
      <div className="vec-tile-sub">
        <strong>PATIENT CARE</strong>
        <span>
          {incidentRef} · {located.length} located{critical ? ` · ${critical} critical` : ""}{treating ? ` · ${treating} treating` : ""}{conveyed ? ` · ${conveyed} to hospital` : ""}
        </span>
      </div>
      <div className="vec-patients-filter">
        <span className="lbl">SHOW</span>
        <div className="vec-segments" role="group" aria-label="Patients by resource">
          <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
            All casualties · {located.length}
          </button>
          {units.map(({ r, ids }) => (
            <button key={r.appliance.id} type="button" aria-pressed={filter === r.appliance.id} onClick={() => setFilter(r.appliance.id)}>
              {r.appliance.callsign} · {ids.size}
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 && filter !== "all" ? (
        <div className="vec-tile-empty">
          No patients assigned to {focus?.r.appliance.callsign ?? "this unit"} · pair a crew from All casualties
        </div>
      ) : (
        <div className="vec-patients-body" style={CAD_VARS}>
          <CasualtiesBody {...body} sim={filteredSim} deployments={deployments} resolved={resolved} tasks={tasks} />
        </div>
      )}
    </div>
  );
}

/** The desk tile: Casualties on the Dispatch panel bar. */
export function PatientCareTile({
  layout,
  area,
  onClose,
  popped,
  onPopOut,
  onDock,
  ...props
}: PatientCareProps & {
  layout: TileLayout;
  area: { w: number; h: number };
  onClose: () => void;
  popped?: boolean;
  onPopOut?: () => void;
  onDock?: () => void;
}) {
  const located = props.sim
    ? props.sim.foundCasualties.filter((c) => stageOf(props.sim!, c.id) !== "undiscovered").length
    : 0;
  return (
    <VectorTile
      id="patients"
      title="Casualties"
      count={located ? String(located) : undefined}
      layout={layout}
      area={area}
      onClose={onClose}
      popped={popped}
      onPopOut={onPopOut}
      onDock={onDock}
      minWidth={360}
      minHeight={300}
    >
      <PatientCareWorkspace {...props} />
    </VectorTile>
  );
}

export type { ResolvedDeployment };
