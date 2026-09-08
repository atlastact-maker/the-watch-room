"use client";

// Patient Care — one workspace for every casualty on an incident, opened
// from the desk (CAD → Casualties: the whole incident, so control can
// coordinate crews and transport) and from the tablet (MDT → Patient
// care: the same records, filtered to that resource's own patients).
// Either view lifts into its own window for a second screen. Opening a
// patient brings up the CASUALTY CARE screen — monitor, assessment,
// oxygen, medication, log and the A-B-C action bar — over the desk or in
// a window of its own.

import { useState } from "react";
import { createPortal } from "react-dom";
import type { Deployment, Incident, Task, PatientTreatmentState } from "@/lib/sim/incident_types";
import type { IncidentSimState } from "@/lib/sim/incident_sim";
import type { ResusState } from "@/lib/sim/resus";
import { scopeOfApplianceType } from "@/lib/sim/incident_types";
import type { ResolvedDeployment } from "../components/incident-view";
import { VectorTile, type TileLayout } from "./tile";
import { PopoutWindow, PopoutFrame } from "./popout";
import { CasualtyCareScreen, type CareCallbacks } from "./casualty-care";

export type PatientCareProps = CareCallbacks & {
  sim: IncidentSimState | null;
  incident: Incident | null;
  incidentRef: string;
  deployments: Deployment[];
  resolved: ResolvedDeployment[];
  tasks: Task[];
  now: number;
  treatmentByCasualtyId?: Record<string, PatientTreatmentState>;
  resusByCasualtyId?: Record<string, ResusState>;
  /** Open filtered to this resource's patients — the tablet's view. */
  focusApplianceId?: string | null;
  /** Show the casualty screen in place (the tablet) rather than over the
   *  desk. It can still be lifted into its own window. */
  inline?: boolean;
};

/** Casualties a resource is responsible for: the patient its crew is
 *  treating or conveying, and any it is carrying out of the building. */
export function assignedCasualtyIds(applianceId: string, deployments: Deployment[], tasks: Task[]): Set<string> {
  const ids = new Set<string>();
  for (const d of deployments) {
    if (d.applianceId === applianceId && d.treatingCasualtyId) ids.add(d.treatingCasualtyId);
  }
  for (const t of tasks) {
    if (t.applianceId === applianceId && t.kind === "extract_casualty" && t.state === "active" && t.casualtyId) ids.add(t.casualtyId);
  }
  return ids;
}

function stageLabel(stage: string): string {
  switch (stage) {
    case "located": return "Located";
    case "in_treatment": return "In treatment";
    case "extricated": return "Extricated";
    case "conveying": return "Conveying";
    case "at_hospital": return "At hospital";
    case "expectant": return "Expectant";
    default: return stage.replace(/_/g, " ");
  }
}

export function PatientCareWorkspace(props: PatientCareProps) {
  const { sim, incident, incidentRef, focusApplianceId, inline, deployments, resolved, tasks, now, treatmentByCasualtyId, resusByCasualtyId, ...callbacks } = props;
  const [filter, setFilter] = useState<string>(focusApplianceId ?? "all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [poppedOut, setPoppedOut] = useState(false);

  if (!sim || !incident) {
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

  const stageOf = (id: string) => sim.casualtyProgression?.[id]?.stage ?? "located";
  const severityOf = (c: IncidentSimState["foundCasualties"][number]) => sim.casualtyProgression?.[c.id]?.severity ?? c.severity;
  const located = sim.foundCasualties.filter((c) => stageOf(c.id) !== "undiscovered");
  const critical = located.filter((c) => severityOf(c) === "critical").length;
  const treating = deployments.filter((d) => d.treatingCasualtyId).length;
  const conveyed = located.filter((c) => ["conveying", "at_hospital"].includes(stageOf(c.id))).length;

  // Resources with patients of their own, plus the tablet's unit even when
  // it has none yet, so its crew sees where they stand.
  const units = resolved
    .map((r) => ({ r, ids: assignedCasualtyIds(r.appliance.id, deployments, tasks) }))
    .filter(({ r, ids }) => ids.size > 0 || r.appliance.id === focusApplianceId);
  const focus = units.find(({ r }) => r.appliance.id === filter);
  const shown = filter === "all" || !focus ? located : located.filter((c) => focus.ids.has(c.id));
  const open = openId ? located.find((c) => c.id === openId) ?? null : null;

  const screen = open ? (
    <CasualtyCareScreen
      {...callbacks}
      casualty={open}
      stage={stageOf(open.id)}
      severity={severityOf(open)}
      incident={incident}
      treatment={treatmentByCasualtyId?.[open.id] ?? null}
      resus={resusByCasualtyId?.[open.id]}
      deployments={deployments}
      resolved={resolved}
      tasks={tasks}
      now={now}
      onClose={() => { setOpenId(null); setPoppedOut(false); }}
      popped={poppedOut}
      onPopOut={() => setPoppedOut(true)}
      onDock={() => setPoppedOut(false)}
    />
  ) : null;

  if (inline && screen && !poppedOut) {
    return <div className="vec-patients cc-inline">{screen}</div>;
  }

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
      {poppedOut && open && (
        <div className="vec-patients-note">
          {(open.label ?? open.id).toUpperCase()} is open in its own window ·{" "}
          <button type="button" className="vec-btn" onClick={() => setPoppedOut(false)}>Bring it back</button>
        </div>
      )}
      {shown.length === 0 ? (
        <div className="vec-tile-empty">
          {filter !== "all" ? `No patients assigned to ${focus?.r.appliance.callsign ?? "this unit"} · pair a crew from All casualties` : "No casualties located yet"}
        </div>
      ) : (
        <div className="vec-cas-list">
          {shown.map((c) => {
            const stage = stageOf(c.id);
            const severity = severityOf(c);
            const tx = treatmentByCasualtyId?.[c.id];
            const vitals = tx?.liveVitals ?? tx?.revealedVitals;
            const crews = deployments
              .filter((d) => d.treatingCasualtyId === c.id)
              .map((d) => resolved.find((r) => r.appliance.id === d.applianceId)?.appliance.callsign ?? d.applianceId);
            const carrying = tasks.filter((t) => t.kind === "extract_casualty" && t.state === "active" && t.casualtyId === c.id).map((t) => resolved.find((r) => r.appliance.id === t.applianceId)?.appliance.callsign ?? t.applianceId);
            const medicalOnScene = resolved.filter((r) => r.appliance.service === "Ambulance" && scopeOfApplianceType(r.appliance.type) !== "none" && r.phase === "at_incident");
            const unpaired = crews.length === 0 && stage !== "at_hospital" && stage !== "conveying";
            return (
              <article key={c.id} className={`vec-cas ${severity}${stage === "expectant" ? " expectant" : ""}`}>
                <i className="spine" />
                <div className="who">
                  <strong>{(c.label ?? c.id).toUpperCase()}</strong>
                  <span className={`stage ${stage}`}>{stageLabel(stage)}</span>
                  <span className={`sev ${severity}`}>{severity}</span>
                  {tx?.revealedCondition && <em>{tx.revealedCondition}</em>}
                </div>
                <div className="obs">
                  {vitals ? (
                    <>
                      <span>HR <b>{vitals.hr}</b></span>
                      <span>SpO₂ <b>{Math.round(vitals.spo2)}%</b></span>
                      <span>RR <b>{vitals.rr}</b></span>
                      <span>BP <b>{vitals.bpSys}/{vitals.bpDia}</b></span>
                      <span>GCS <b>{vitals.gcs}</b></span>
                    </>
                  ) : (
                    <span className="dim">{tx?.surveyStartedAt ? "Primary survey in progress" : "No observations yet"}</span>
                  )}
                </div>
                <div className="crew">
                  {crews.map((cs) => <span key={cs} className="chip on">{cs}</span>)}
                  {carrying.map((cs) => <span key={`x${cs}`} className="chip">{cs} · carrying</span>)}
                  {unpaired && (medicalOnScene.length === 0 ? <span className="chip warn">No clinician on scene</span> : <span className="chip warn">Unassigned</span>)}
                </div>
                <button type="button" className="vec-btn primary" onClick={() => setOpenId(c.id)}>Open</button>
              </article>
            );
          })}
        </div>
      )}
      {screen && !poppedOut && !inline && typeof document !== "undefined" && createPortal(<div className="cc-overlay">{screen}</div>, document.body)}
      {screen && poppedOut && open && (
        <PopoutWindow id={`care-${open.id}`} title={`Casualty care · ${open.label ?? open.id}`} width={1400} height={860} onClose={() => setPoppedOut(false)}>
          <PopoutFrame title={`Casualty care · ${open.label ?? open.id}`} onDock={() => setPoppedOut(false)} className="cc-frame">
            {screen}
          </PopoutFrame>
        </PopoutWindow>
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
    ? props.sim.foundCasualties.filter((c) => (props.sim!.casualtyProgression?.[c.id]?.stage ?? "located") !== "undiscovered").length
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
