"use client";

// END OF SHIFT — every job the operator closed, on one screen, with the
// grade each one earned and a way back into its own debrief. Nothing
// here interrupts the shift: it opens when the operator ends it.

import type { IncidentOutcome } from "@/lib/sim/incident_types";

export type ShiftJobSummary = {
  id: string;
  ref: string;
  title: string;
  typeCode: string;
  address: string;
  receivedAt: number;
  resolvedAt: number | null;
  outcome: IncidentOutcome | null;
  resources: number;
  casualtiesSaved: number;
  casualtiesLost: number;
  /** Still on the board, not yet closed. */
  open: boolean;
};

function hm(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit" });
}
function dur(ms: number): string {
  const m = Math.max(0, Math.round(ms / 60000));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

const GRADE_TONE: Record<string, string> = { A: "go", B: "go", C: "warn", D: "stop", F: "stop" };

export function ShiftDebriefScreen({
  jobs,
  shiftStartedAt,
  now,
  operator,
  onReview,
  onBack,
  onLeave,
}: {
  jobs: ShiftJobSummary[];
  shiftStartedAt: number;
  now: number;
  operator: string;
  onReview: (jobId: string) => void;
  onBack: () => void;
  onLeave: () => void;
}) {
  const scored = jobs.filter((j) => j.outcome);
  const openJobs = jobs.filter((j) => j.open && !j.outcome);
  const targetsMet = scored.reduce((n, j) => n + (j.outcome?.passedCount ?? 0), 0);
  const targetsTotal = scored.reduce((n, j) => n + (j.outcome?.totalCount ?? 0), 0);
  const grades = scored.reduce<Record<string, number>>((m, j) => ({ ...m, [j.outcome!.grade]: (m[j.outcome!.grade] ?? 0) + 1 }), {});
  const resources = jobs.reduce((n, j) => n + j.resources, 0);
  const saved = jobs.reduce((n, j) => n + j.casualtiesSaved, 0);
  const lost = jobs.reduce((n, j) => n + j.casualtiesLost, 0);
  const overall = scored.length === 0 ? "—" : (["A", "B", "C", "D", "F"] as const)[Math.min(4, Math.round(scored.reduce((n, j) => n + ["A", "B", "C", "D", "F"].indexOf(j.outcome!.grade), 0) / scored.length))];

  return (
    <div className="vec-shift-debrief" role="dialog" aria-label="End of shift debrief">
      <div className="vec-shift-debrief-inner">
        <header className="vec-shift-head">
          <div>
            <div className="eyebrow">END OF SHIFT · DEBRIEF</div>
            <h1>{operator}</h1>
            <p>{hm(shiftStartedAt)} – {hm(now)} · {dur(now - shiftStartedAt)} on position · {jobs.length} job{jobs.length === 1 ? "" : "s"}</p>
          </div>
          <div className={`vec-shift-grade ${GRADE_TONE[overall] ?? ""}`}>
            <span>{overall}</span>
            <small>{scored.length ? `${targetsMet} / ${targetsTotal} targets met` : "Nothing scored yet"}</small>
          </div>
        </header>

        <section className="vec-shift-stats">
          <div><b>{jobs.length}</b><span>Jobs handled</span></div>
          <div><b>{scored.length}</b><span>Closed and scored</span></div>
          <div><b>{resources}</b><span>Resources mobilised</span></div>
          <div><b>{saved}</b><span>Patients to hospital</span></div>
          <div className={lost ? "stop" : ""}><b>{lost}</b><span>Patients lost</span></div>
          <div><b>{["A", "B", "C", "D", "F"].map((g) => grades[g] ? `${g}×${grades[g]}` : null).filter(Boolean).join(" ") || "—"}</b><span>Grades</span></div>
        </section>

        {openJobs.length > 0 && (
          <p className="vec-shift-warn">{openJobs.length} job{openJobs.length === 1 ? " is" : "s are"} still running without a stop message — leaving now hands {openJobs.length === 1 ? "it" : "them"} over unscored.</p>
        )}

        <section className="vec-shift-jobs">
          <div className="row head"><span>Time</span><span>Job</span><span>Duration</span><span>Resources</span><span>Grade</span><span /></div>
          {jobs.length === 0 && <div className="row"><span /><span>No jobs this shift.</span></div>}
          {jobs.map((j) => (
            <div key={j.id} className={`row${j.open ? " open" : ""}`}>
              <span>{hm(j.receivedAt)}</span>
              <span><b>{j.ref}</b> · {j.title}<small>{j.address}</small></span>
              <span>{j.resolvedAt ? dur(j.resolvedAt - j.receivedAt) : "Running"}</span>
              <span>{j.resources}</span>
              <span className={j.outcome ? `grade ${GRADE_TONE[j.outcome.grade]}` : ""}>{j.outcome ? `${j.outcome.grade} · ${j.outcome.passedCount}/${j.outcome.totalCount}` : j.open ? "Open" : "Unscored"}</span>
              <span>{j.outcome && <button type="button" className="vec-btn" onClick={() => onReview(j.id)}>Review</button>}</span>
            </div>
          ))}
        </section>

        <footer className="vec-shift-foot">
          <button type="button" className="vec-btn" onClick={onBack}>Back to the desk</button>
          <button type="button" className="vec-btn solid" onClick={onLeave}>Leave for the Ops Room</button>
        </footer>
      </div>
    </div>
  );
}
