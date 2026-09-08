"use client";

// Unit tasking as a desk tile. The MDT is the crew's patient-care
// terminal now, so the prototype's task workspace — tasking cards, the
// catalogue, the numbered task order, the water page — opens here on the
// Dispatch panel bar for whichever committed unit control has in hand.

import { useState } from "react";
import type { Incident, Task } from "@/lib/sim/incident_types";
import type { ResolvedDeployment } from "../components/incident-view";
import { VectorTile, type TileLayout } from "./tile";
import { MdtTaskWorkspace, type TaskWorkspaceProps } from "./mdt-task-workspace";

type Callbacks = Pick<TaskWorkspaceProps, "onStartTask" | "onAbortTask" | "onCompleteTask" | "onSetTaskCrew" | "onNote">;

export function TaskingTile({
  layout,
  area,
  onClose,
  popped,
  onPopOut,
  onDock,
  incident,
  incidentRef,
  resolved,
  tasks,
  now,
  busyCrewIds,
  hazards,
  casualties,
  resolvedIncident,
  unitId,
  onSetUnitId,
  onBeginRoadClosure,
  onStartPump,
  ...callbacks
}: Callbacks & {
  layout: TileLayout;
  area: { w: number; h: number };
  onClose: () => void;
  popped?: boolean;
  onPopOut?: () => void;
  onDock?: () => void;
  incident: Incident | null;
  incidentRef: string;
  resolved: ResolvedDeployment[];
  tasks: Task[];
  now: number;
  busyCrewIds?: Set<string>;
  hazards: { id: string; label: string; kind: string }[];
  casualties: { id: string; label?: string }[];
  resolvedIncident: boolean;
  unitId: string | null;
  onSetUnitId: (id: string | null) => void;
  onBeginRoadClosure?: (applianceId: string, kind: "close_carriageway" | "close_road", crewIds: string[]) => void;
  onStartPump?: (applianceId: string) => void;
}) {
  const [page, setPage] = useState<"actions" | "water">("actions");
  const committed = resolved.filter((r) => r.phase === "at_incident" || r.phase === "mobile");
  const unit = (unitId ? committed.find((r) => r.appliance.id === unitId) : null) ?? committed.find((r) => r.phase === "at_incident") ?? committed[0] ?? null;
  const active = unit ? tasks.filter((t) => t.state === "active" && t.applianceId === unit.appliance.id).length : 0;
  const pumpOperator = unit
    ? unit.appliance.crewMembers.find((c) => c.id === unit.deployment.pumpOperatorCrewId) ??
      unit.appliance.crewMembers.find((c) => /Pump|Driver/i.test(c.role)) ??
      unit.appliance.crewMembers[0]
    : undefined;

  return (
    <VectorTile
      id="tasking"
      title="Unit tasking"
      count={active ? String(active) : undefined}
      layout={layout}
      area={area}
      onClose={onClose}
      popped={popped}
      onPopOut={onPopOut}
      onDock={onDock}
      minWidth={380}
      minHeight={320}
    >
      <div className="vec-tile-sub">
        <strong>{unit ? unit.appliance.callsign : "NO UNIT"}</strong>
        <span>{incident ? incidentRef : "No live incident"}</span>
      </div>
      <div className="vec-patients-filter">
        <span className="lbl">UNIT</span>
        <select
          className="vec-btn"
          style={{ textAlign: "left", fontWeight: 400, minWidth: 0 }}
          aria-label="Unit"
          value={unit?.appliance.id ?? ""}
          onChange={(e) => onSetUnitId(e.target.value || null)}
        >
          {committed.length === 0 && <option value="">No units committed</option>}
          {committed.map((r) => (
            <option key={r.appliance.id} value={r.appliance.id}>
              {r.appliance.callsign} · {r.appliance.typeName} · {r.phase === "at_incident" ? "in attendance" : "mobile"}
            </option>
          ))}
        </select>
        <div className="vec-segments" role="group" aria-label="Page">
          <button type="button" aria-pressed={page === "actions"} onClick={() => setPage("actions")}>Actions</button>
          <button type="button" aria-pressed={page === "water"} onClick={() => setPage("water")} disabled={!unit || unit.appliance.service !== "Fire" || unit.appliance.waterLitres === 0}>Water</button>
        </div>
      </div>
      {!incident || !unit ? (
        <div className="vec-tile-empty">{incident ? "Commit a unit from Mobilising to task its crew" : "Select a live incident first"}</div>
      ) : (
        <div className="vec-mdt-body page vec-tasking">
          <MdtTaskWorkspace
            key={`${page}:${unit.appliance.id}`}
            page={page}
            incident={incident}
            incidentRef={incidentRef}
            appliance={unit.appliance}
            phase={unit.phase}
            onScene={resolved.filter((r) => r.phase === "at_incident").map((r) => r.appliance)}
            tasks={tasks}
            now={now}
            busyCrewIds={busyCrewIds}
            hazards={hazards}
            casualties={casualties}
            resolved={resolvedIncident}
            onBeginRoadClosure={onBeginRoadClosure ? (kind, crewIds) => onBeginRoadClosure(unit.appliance.id, kind, crewIds) : undefined}
            pumpReady={unit.deployment.pumpRunning === true && !!unit.deployment.pumpOperatorCrewId}
            pumpOperatorName={pumpOperator?.name}
            onStartPump={onStartPump && pumpOperator ? () => onStartPump(unit.appliance.id) : undefined}
            {...callbacks}
          />
        </div>
      )}
    </VectorTile>
  );
}
