"use client";

// THE PATIENT BOARD. The patient in one glance: who they are and how they
// are, the early warning score that says how worried to be, their numbers
// over the last twenty minutes against the alarm limits, the red flags
// and whether each has been dealt with, and what has been done so far
// with the time it was done. Read off the treatment record; nothing here
// is decorative.

import type { ReactNode } from "react";
import type { PatientTreatmentState, TreatmentEvent } from "@/lib/sim/incident_types";
import { DRUG_LABEL, MONITORING_LABEL } from "@/lib/sim/incident_types";
import type { PatientRedFlag, SceneCasualty } from "@/lib/sim/scene";
import type { ResusState } from "@/lib/sim/resus";
import { downtimeSec } from "@/lib/sim/resus";
import { news2, type News2 } from "@/lib/sim/news2";
import { recordVitals, vitalsHistory, type VitalsSample } from "@/lib/sim/vitals_history";
import { wasHandled } from "@/lib/sim/scoring";
import { oxygenLabel } from "@/lib/sim/oxygen";
import { AIRWAY_LABEL, BREATHING_LABEL, CIRC_LABEL, EGRESS_LABEL, PACKAGING_LABEL, RED_FLAG_LABEL } from "../components/treatment-tab";

type Tone = "go" | "warn" | "stop" | "";

export type PatientBoardProps = {
  casualty: SceneCasualty;
  treatment: PatientTreatmentState | null;
  resus?: ResusState;
  now: number;
  /** Who has the patient, for the header. */
  lead?: string;
  /** Fewer rows — the tablet's patient page. */
  compact?: boolean;
};

// The trend window: five minutes to start, so the first readings are
// visible, widening to twenty as the record grows.
const SPAN_MIN_MS = 5 * 60_000;
const SPAN_MAX_MS = 20 * 60_000;

function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function wall(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit" });
}

const BAND_LABEL: Record<News2["band"], string> = { low: "Low", low_medium: "Low–medium", medium: "Medium", high: "High" };
const BAND_TONE: Record<News2["band"], Tone> = { low: "go", low_medium: "warn", medium: "warn", high: "stop" };

function Trend({ label, unit, hist, pick, lo, hi, alarmLow, alarmHigh, now, span, colour }: { label: string; unit: string; hist: readonly VitalsSample[]; pick: (s: VitalsSample) => number; lo: number; hi: number; alarmLow?: number; alarmHigh?: number; now: number; span: number; colour: string }) {
  const from = now - span;
  const pts = hist.filter((p) => p.t >= from);
  const W = 240;
  const H = 44;
  const x = (t: number) => ((t - from) / span) * W;
  const y = (v: number) => H - 2 - ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * (H - 4);
  const last = pts[pts.length - 1];
  const first = pts[0];
  const delta = last && first ? Math.round(pick(last)) - Math.round(pick(first)) : 0;
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)} ${y(pick(p)).toFixed(1)}`).join(" ");
  return (
    <div className="pb-trend">
      <div className="hd"><span style={{ color: colour }}>{label}</span><b>{last ? Math.round(pick(last)) : "—"}<small>{unit}</small></b><em className={delta > 0 ? "up" : delta < 0 ? "down" : ""}>{pts.length > 1 ? (delta > 0 ? `▲ ${delta}` : delta < 0 ? `▼ ${-delta}` : "steady") : ""}</em></div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        {alarmLow !== undefined && <line x1="0" x2={W} y1={y(alarmLow)} y2={y(alarmLow)} className="alarm" />}
        {alarmHigh !== undefined && <line x1="0" x2={W} y1={y(alarmHigh)} y2={y(alarmHigh)} className="alarm" />}
        {pts.length > 1 && <path d={line} style={{ stroke: colour }} />}
        {last && <circle cx={x(last.t)} cy={y(pick(last))} r="2.4" style={{ fill: colour }} />}
      </svg>
    </div>
  );
}

function describe(e: TreatmentEvent): string | null {
  switch (e.kind) {
    case "survey_completed": return "Primary survey complete";
    case "airway": return AIRWAY_LABEL[e.action];
    case "breathing": return BREATHING_LABEL[e.action];
    case "circulation": return CIRC_LABEL[e.action];
    case "drug": return DRUG_LABEL[e.drug];
    case "packaging": return PACKAGING_LABEL[e.action];
    case "egress": return EGRESS_LABEL[e.action];
    case "monitoring": return `${MONITORING_LABEL[e.device]} ${e.off ? "off" : "on"}`;
    case "clinician_on_scene": return `${e.scope.toUpperCase()} on scene`;
    case "destination_set": return `Destination · ${e.name}`;
    case "atmist_sent": return "ATMIST sent";
    case "physio": return e.text;
    case "observation": return e.text;
    case "allergies_confirmed": return `Allergies · ${e.text}`;
    case "drug_refused": return `${DRUG_LABEL[e.drug]} not given`;
    default: return null;
  }
}

export function PatientBoard({ casualty, treatment, resus, now, lead, compact }: PatientBoardProps) {
  const tx = treatment;
  const vitals = tx?.liveVitals ?? tx?.revealedVitals;
  const surveyDone = !!tx?.surveyCompletedAt;
  const inArrest = !!resus && !resus.roscAt && !resus.roleAt;
  const flags = tx?.activeRedFlags ?? tx?.revealedRedFlags ?? [];
  const revealed = tx?.revealedRedFlags ?? [];
  if (vitals && surveyDone) recordVitals(casualty.id, now, vitals);
  const hist = vitalsHistory(casualty.id);
  const span = Math.min(SPAN_MAX_MS, Math.max(SPAN_MIN_MS, hist.length ? now - hist[0].t : 0));
  const spanMin = Math.round(span / 60_000);
  const onO2 = !!tx?.oxygen && tx.oxygen.device !== "none";
  const score = vitals && surveyDone && !inArrest ? news2({ rr: vitals.rr, spo2: vitals.spo2, bpSys: vitals.bpSys, hr: vitals.hr, temp: vitals.temp, alert: vitals.gcs >= 15 && !flags.includes("seizure_active"), onOxygen: onO2 }) : null;
  const scoreTone: Tone = inArrest ? "stop" : score ? BAND_TONE[score.band] : "";
  const inCare = tx?.surveyStartedAt ? now - tx.surveyStartedAt : null;
  // Flags: the ones still active, with whether the record shows them dealt
  // with; a flag that has cleared counts as handled.
  const flagRows = revealed.map((f: PatientRedFlag) => {
    const active = flags.includes(f);
    const handled = tx ? wasHandled(f, tx) : false;
    return { f, label: RED_FLAG_LABEL[f], state: !active ? "cleared" : handled ? "treated" : "open" };
  });
  const openFlags = flagRows.filter((r) => r.state === "open").length;
  const events = (tx?.events ?? []).filter((e) => e.kind !== "survey_started").slice().reverse();
  const shown = events.slice(0, compact ? 6 : 9);
  const given: ReactNode[] = [];
  if (onO2 && tx?.oxygen) given.push(<span key="o2" className="go">{oxygenLabel(tx.oxygen)}</span>);
  for (const d of tx?.doses ?? []) given.push(<span key={`${d.drug}-${d.at}`} className="go">{DRUG_LABEL[d.drug]}</span>);
  for (const k of Object.keys(tx?.airway ?? {}) as (keyof typeof AIRWAY_LABEL)[]) given.push(<span key={`a-${k}`}>{AIRWAY_LABEL[k]}</span>);
  for (const k of Object.keys(tx?.circulation ?? {}) as (keyof typeof CIRC_LABEL)[]) given.push(<span key={`c-${k}`}>{CIRC_LABEL[k]}</span>);
  for (const k of Object.keys(tx?.packaging ?? {}) as (keyof typeof PACKAGING_LABEL)[]) given.push(<span key={`p-${k}`}>{PACKAGING_LABEL[k]}</span>);

  return (
    <div className="pb-wrap">
    <div className={`pb-board${compact ? " compact" : ""}`}>
      <div className="pb-zone pb-state">
        <div className={`pb-news ${scoreTone}`}>
          <span className="k">{inArrest ? "Resuscitation" : "NEWS2"}</span>
          <strong>{inArrest ? mmss(downtimeSec(resus!, now) * 1000) : score ? score.total : "—"}</strong>
          <small>{inArrest ? `downtime · cycle ${resus!.cycle + 1}` : score ? `${BAND_LABEL[score.band]} · ${score.response}` : surveyDone ? "no observations" : "survey not done"}</small>
          {score && (
            <div className="pb-parts">
              {score.parts.map((p) => <i key={p.key} className={`s${p.score}`} title={`${p.label} ${p.value} · scores ${p.score}`}><b>{p.short}</b><span>{p.value}</span></i>)}
            </div>
          )}
        </div>
        <dl className="pb-facts">
          <dt>Time in care</dt><dd>{inCare !== null ? mmss(inCare) : "—"}{lead ? <small> · {lead}</small> : null}</dd>
          <dt>Red flags</dt><dd className={openFlags ? "stop" : flagRows.length ? "go" : ""}>{flagRows.length ? `${flagRows.length} found · ${openFlags ? `${openFlags} open` : "all dealt with"}` : surveyDone ? "none" : "—"}</dd>
          <dt>Monitoring</dt><dd>{tx?.monitoring && Object.keys(tx.monitoring).length ? (Object.keys(tx.monitoring) as (keyof typeof MONITORING_LABEL)[]).map((k) => MONITORING_LABEL[k]).join(" · ") : <span className="warn">nothing attached</span>}</dd>
        </dl>
        {flagRows.length > 0 && (
          <div className="pb-flags">
            {flagRows.map((r) => <span key={r.f} className={r.state}><i />{r.label}<em>{r.state === "cleared" ? "cleared" : r.state === "treated" ? "treated" : "open"}</em></span>)}
          </div>
        )}
      </div>

      <div className="pb-zone pb-trends">
        <Trend label="HR" unit="bpm" hist={hist} pick={(s) => s.hr} lo={30} hi={180} alarmLow={50} alarmHigh={120} now={now} span={span} colour="#16a34a" />
        <Trend label="SpO₂" unit="%" hist={hist} pick={(s) => s.spo2} lo={70} hi={100} alarmLow={90} now={now} span={span} colour="#0891b2" />
        <Trend label="Sys BP" unit="mmHg" hist={hist} pick={(s) => s.bpSys} lo={50} hi={220} alarmLow={90} now={now} span={span} colour="#dc2626" />
        <Trend label="RR" unit="/min" hist={hist} pick={(s) => s.rr} lo={0} hi={50} alarmHigh={30} now={now} span={span} colour="#ca8a04" />
        <div className="pb-axis"><span>{spanMin} min ago</span><span>{Math.round(spanMin / 2)}</span><span>now</span></div>
      </div>

      <div className="pb-zone pb-record">
        <div className="pb-given">{given.length ? given : <span className="muted">Nothing given yet</span>}</div>
        <ol className="pb-timeline">
          {shown.length === 0 && <li className="muted">No care recorded yet</li>}
          {shown.map((e, i) => {
            const text = describe(e);
            if (!text) return null;
            const tone = e.kind === "physio" ? (e.tone === "critical" ? "stop" : e.tone === "warn" ? "warn" : e.tone === "good" ? "go" : "") : e.kind === "drug_refused" ? "warn" : "";
            return <li key={`${e.kind}-${e.at}-${i}`} className={tone}><time>{wall(e.at)}</time><span>{text}</span></li>;
          })}
        </ol>
      </div>
    </div>
    </div>
  );
}
