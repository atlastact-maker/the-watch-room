"use client";

// THE PATIENT BOARD. The patient in one glance, the way the fireground
// board shows the fire: where they are on the arc from found to handed
// over, what is going wrong right now, a picture of them with the crew
// and the kit on them, the early warning score that says how worried to
// be, their numbers over the last minutes against the alarm limits, and
// what has been done so far with the time it was done. Read off the
// treatment record; nothing here is decorative.

import { useEffect, useRef } from "react";
import type { PatientTreatmentState, TreatmentEvent } from "@/lib/sim/incident_types";
import { DRUG_LABEL, MONITORING_LABEL } from "@/lib/sim/incident_types";
import type { PatientRedFlag, SceneCasualty } from "@/lib/sim/scene";
import type { ResusState } from "@/lib/sim/resus";
import { downtimeSec } from "@/lib/sim/resus";
import type { CasualtyStage } from "@/lib/sim/incident_sim";
import { news2, type News2 } from "@/lib/sim/news2";
import { recordVitals, vitalsHistory, type VitalsSample } from "@/lib/sim/vitals_history";
import { wasHandled } from "@/lib/sim/scoring";
import { patientLook } from "@/lib/sim/patient_look";
import { patientStage, PATIENT_TRACK, type Tone } from "@/lib/sim/patient_stage";
import { alertTone } from "@/lib/audio/sim-audio";
import { AIRWAY_LABEL, BREATHING_LABEL, CIRC_LABEL, EGRESS_LABEL, PACKAGING_LABEL, RED_FLAG_LABEL } from "../components/treatment-tab";
import { PatientScene, type SceneCrew } from "./patient-scene";

export type PatientBoardProps = {
  casualty: SceneCasualty;
  treatment: PatientTreatmentState | null;
  resus?: ResusState;
  /** The casualty's progression stage from the incident simulation. */
  progression: CasualtyStage;
  /** Who is with the patient, lead first. */
  crew: SceneCrew[];
  now: number;
  /** Fewer rows — the tablet's patient page. */
  compact?: boolean;
};

// The trend window: five minutes to start, so the first readings are
// visible, widening to twenty as the record grows.
const SPAN_MIN_MS = 5 * 60_000;
const SPAN_MAX_MS = 20 * 60_000;
// How long a cue stays up as an alert before it is just history.
const ALERT_MS = 3 * 60_000;

function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function wall(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit" });
}

const BAND_LABEL: Record<News2["band"], string> = { low: "Low", low_medium: "Low–medium", medium: "Medium", high: "High" };
const BAND_TONE: Record<News2["band"], Tone> = { low: "go", low_medium: "warn", medium: "warn", high: "stop" };

/** What a red flag still open asks the crew for, in a few words. */
const FLAG_ASK: Partial<Record<PatientRedFlag, string>> = {
  tension_pneumothorax: "Needle decompression now",
  hypovolaemic_shock: "Stop the bleeding, access, fluids to a radial pulse",
  airway_compromise: "Open and secure the airway",
  head_injury_severe: "Protect the airway, sats and pressure, head up, MTC",
  spinal_injury_suspected: "Immobilise before any move",
  cardiac_arrest: "Compressions and the pads on",
  stemi: "Aspirin, twelve-lead, pre-alert the PCI centre",
  stroke_fast_positive: "Onset time, glucose, hyperacute stroke unit",
  anaphylaxis: "IM adrenaline now",
  severe_asthma: "Nebulised salbutamol, oxygen, steroids",
  hypoglycaemia: "Glucose — oral if swallowing, IV or IM if not",
  seizure_active: "Protect, time it, benzodiazepine past five minutes",
  major_haemorrhage: "Direct pressure, tourniquet or pack, TXA",
  overdose_opioid: "Ventilate, naloxone",
  bradycardia_unstable: "Atropine, then pacing",
  tachycardia_unstable: "Vagal, adenosine or amiodarone, else a synchronised shock",
};

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
  const vals = pts.map((p) => Math.round(pick(p)));
  const lo1 = Math.min(...vals);
  const hi1 = Math.max(...vals);
  const range = vals.length > 1 ? (lo1 === hi1 ? `${lo1}` : `${lo1}–${hi1}`) : null;
  return (
    <div className="pb-trend">
      <div className="hd"><span style={{ color: colour }}>{label}</span><b>{range ?? "—"}{range && <small>{unit}</small>}</b><em className={pts.length < 2 ? "wait" : delta > 0 ? "up" : delta < 0 ? "down" : ""}>{pts.length > 1 ? (delta > 0 ? `▲ ${delta}` : delta < 0 ? `▼ ${-delta}` : "steady") : "collecting"}</em></div>
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

/** The setting from the label: "Male, 58 — central chest pain, sat on the stairs" → "Sat on the stairs". */
function settingOf(label: string | undefined): string | undefined {
  if (!label) return undefined;
  const tail = label.split(/\s[—–-]\s/).pop() ?? label;
  const bits = tail.split(",").map((s) => s.trim()).filter(Boolean);
  if (bits.length < 2) return undefined;
  const last = bits[bits.length - 1];
  return /\b(sat|lying|in|on|at|under|trapped|collapsed|found|behind|beside)\b/i.test(last) ? last.charAt(0).toUpperCase() + last.slice(1).toLowerCase() : undefined;
}

export function PatientBoard({ casualty, treatment, resus, progression, crew, now, compact }: PatientBoardProps) {
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
  const alertNow = !!vitals && vitals.gcs >= 15 && !flags.includes("seizure_active");
  const scoreOf = (v: { rr: number; spo2: number; bpSys: number; hr: number } | undefined) => v && vitals ? news2({ rr: v.rr, spo2: v.spo2, bpSys: v.bpSys, hr: v.hr, temp: vitals.temp, alert: alertNow, onOxygen: onO2 }) : null;
  const score = vitals && surveyDone && !inArrest ? scoreOf(vitals) : null;
  // The score five minutes ago, from the sampled trend (temperature and
  // consciousness are taken as now — neither moves fast).
  const before = hist.find((s) => s.t >= now - 5 * 60_000 - 10_000 && s.t <= now - 5 * 60_000 + 10_000);
  const scoreBefore = before ? scoreOf(before)?.total ?? null : null;
  const scoreTone: Tone = inArrest ? "stop" : score ? BAND_TONE[score.band] : "";
  const inCare = tx?.surveyStartedAt ? now - tx.surveyStartedAt : null;
  const stage = patientStage({ tx, resus, progression, score, scoreBefore, now });
  const look = patientLook(casualty, tx, resus);

  // Flags: the ones still active, with whether the record shows them dealt
  // with; a flag that has cleared counts as handled.
  const flagRows = revealed.map((f: PatientRedFlag) => {
    const active = flags.includes(f);
    const handled = tx ? wasHandled(f, tx) : false;
    return { f, label: RED_FLAG_LABEL[f], state: !active ? "cleared" : handled ? "treated" : "open" };
  });
  const openFlags = flagRows.filter((r) => r.state === "open");
  const events = (tx?.events ?? []).filter((e) => e.kind !== "survey_started").slice().reverse();
  const shown = events.slice(0, compact ? 8 : 12);

  // Alerts: what the patient is doing right now that needs a hand, and
  // the red flags nobody has dealt with yet.
  const cues = events.filter((e): e is Extract<TreatmentEvent, { kind: "physio" }> => e.kind === "physio" && (e.tone === "critical" || e.tone === "warn") && now - e.at < ALERT_MS).slice(0, 2);
  const resusAlerts: { key: string; tone: Tone; title: string; text: string; fresh: boolean }[] = [];
  if (inArrest && resus) {
    if (resus.cyclePausedAt !== undefined) resusAlerts.push({ key: "r-noone", tone: "stop", title: "NO COMPRESSIONS", text: `Nobody on the chest for ${mmss(now - resus.cyclePausedAt)} — put someone on it or fit the LUCAS`, fresh: true });
    if (!look.kit.pads) resusAlerts.push({ key: "r-pads", tone: "stop", title: "PADS NOT ON", text: "No rhythm, no shock until the pads are on the chest", fresh: false });
    if (look.kit.airway === "none" && look.kit.oxygen !== "bvm") resusAlerts.push({ key: "r-airway", tone: "warn", title: "NO AIRWAY", text: "Bag-valve-mask or an i-gel — nothing is ventilating them", fresh: false });
  }
  const alerts: { key: string; tone: Tone; title: string; text: string; fresh: boolean }[] = [
    ...resusAlerts,
    ...cues.map((e) => ({ key: `c-${e.at}`, tone: (e.tone === "critical" ? "stop" : "warn") as Tone, title: e.tone === "critical" ? "PATIENT" : "WATCH", text: e.text, fresh: now - e.at < 20_000 })),
    ...openFlags.filter((r) => !inArrest || r.f !== "cardiac_arrest").slice(0, 2).map((r) => ({ key: `f-${r.f}`, tone: "stop" as Tone, title: r.label.toUpperCase(), text: FLAG_ASK[r.f] ?? "Not yet dealt with", fresh: false })),
  ].slice(0, 3);

  // Sound: a new cue chimes once; a change of stage for the worse chimes.
  // Nothing replays on mount — the record may be minutes old.
  const seenAt = useRef<number | null>(null);
  const seenStage = useRef<string | null>(null);
  const txEvents = tx?.events;
  const lastEventAt = txEvents?.length ? txEvents[txEvents.length - 1].at : 0;
  useEffect(() => {
    if (seenAt.current === null) { seenAt.current = lastEventAt; return; }
    const since = seenAt.current;
    seenAt.current = lastEventAt;
    const rank = { none: 0, good: 1, warn: 2, critical: 3 } as const;
    let worst: keyof typeof rank = "none";
    for (const e of txEvents ?? []) {
      if (e.kind !== "physio" || e.at <= since) continue;
      const t: keyof typeof rank = e.tone === "info" ? "none" : e.tone;
      if (rank[t] > rank[worst]) worst = t;
    }
    if (worst === "critical") alertTone("high");
    else if (worst === "warn") alertTone("med");
    else if (worst === "good") alertTone("low");
  }, [lastEventAt, txEvents]);
  useEffect(() => {
    const k = stage.key;
    if (seenStage.current === null) { seenStage.current = k; return; }
    if (seenStage.current === k) return;
    const prev = seenStage.current;
    seenStage.current = k;
    if (k === "peri_arrest") alertTone("high");
    else if (k === "deteriorating" || k === "life_extinct") alertTone("med");
    else if (k === "rosc" || (k === "stable" && (prev === "deteriorating" || prev === "peri_arrest"))) alertTone("low");
  }, [stage.key]);

  // The label's setting ("sat on the stairs") only while it still holds:
  // a patient who has gone to the floor is not sat anywhere.
  const settingRaw = settingOf(casualty.label);
  const setting = settingRaw && look.posture === "supine" && /\b(sat|sitting|seated|standing|stood)\b/i.test(settingRaw) ? undefined : settingRaw;
  const trackIdx = stage.key === "handed_over" ? PATIENT_TRACK.length : stage.key === "life_extinct" ? PATIENT_TRACK.findIndex((s) => s.key === "arrest") : stage.index;

  return (
    <div className="pb-wrap">
    <div className={`pb-board${compact ? " compact" : ""} ${stage.tone}`}>
      <div className="pb-top">
        <div className={`pb-track ${stage.tone}`}>
          {PATIENT_TRACK.map((s, i) => {
            const state = trackIdx < 0 ? "" : i === trackIdx ? "now" : i < trackIdx ? "past" : "";
            return <div key={s.key} className={`pb-step ${state}`} title={s.label}><i /><span>{s.short}</span></div>;
          })}
        </div>
        <div className={`pb-headline ${stage.tone}`}>
          <b>{stage.label}</b>
          <span>{stage.detail}{inCare !== null ? ` · in care ${mmss(inCare)}` : ""}</span>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="pb-alerts">
          {alerts.map((a) => <div key={a.key} className={`pb-alert ${a.tone}${a.fresh ? " pulse" : ""}`}><b>{a.title}</b><span>{a.text}</span></div>)}
        </div>
      )}

      <div className="pb-main">
        <div className="pb-zone pb-picture">
          <PatientScene look={look} crew={crew} caption={setting} />
        </div>
        <div className="pb-trends">
            <Trend label="HR" unit="bpm" hist={hist} pick={(s) => s.hr} lo={30} hi={180} alarmLow={50} alarmHigh={120} now={now} span={span} colour="#2fd17a" />
            <Trend label="SpO₂" unit="%" hist={hist} pick={(s) => s.spo2} lo={70} hi={100} alarmLow={90} now={now} span={span} colour="#3fd0ea" />
            <Trend label="Sys BP" unit="mmHg" hist={hist} pick={(s) => s.bpSys} lo={50} hi={220} alarmLow={90} now={now} span={span} colour="#ff6b6b" />
            <Trend label="RR" unit="/min" hist={hist} pick={(s) => s.rr} lo={0} hi={50} alarmHigh={30} now={now} span={span} colour="#f3d35a" />
            <div className="pb-axis"><span>{spanMin} min ago</span><span>{Math.round(spanMin / 2)}</span><span>now</span></div>
        </div>

        <div className="pb-zone pb-state">
          <div className={`pb-news ${scoreTone}`}>
            <span className="k">{inArrest ? "Downtime" : "NEWS2"}</span>
            <strong>{inArrest ? mmss(downtimeSec(resus!, now) * 1000) : score ? score.total : "—"}</strong>
            <small>{inArrest ? `cycle ${resus!.cycle + 1} · ${resus!.shocks} shock${resus!.shocks === 1 ? "" : "s"}` : score ? `${BAND_LABEL[score.band]} risk${scoreBefore != null && score.total !== scoreBefore ? ` · ${score.total > scoreBefore ? "up" : "down"} from ${scoreBefore}` : ""}` : surveyDone ? "no observations" : "survey not done"}</small>
            {score && (
              <div className="pb-parts">
                {score.parts.map((p) => <i key={p.key} className={`s${p.score}`} title={`${p.label} ${p.value} · scores ${p.score}`}><b>{p.short}</b><span>{p.score}</span></i>)}
              </div>
            )}
          </div>
          <dl className="pb-facts">
            <dt>Red flags</dt><dd className={openFlags.length ? "stop" : flagRows.length ? "go" : ""}>{flagRows.length ? `${flagRows.length} found · ${openFlags.length ? `${openFlags.length} open` : "all dealt with"}` : surveyDone ? "none" : "—"}</dd>
            <dt>Destination</dt><dd>{tx?.chosenDestination ? tx.chosenDestination.name : surveyDone ? <span className="warn">not yet chosen</span> : "—"}</dd>
            <dt>Pre-alert</dt><dd>{tx?.atmistSentAt ? `ATMIST ${wall(tx.atmistSentAt)}` : tx?.chosenDestination ? <span className="warn">not sent</span> : "—"}</dd>
          </dl>
          {flagRows.length > 0 && (
            <div className="pb-flags">
              {flagRows.map((r) => <span key={r.f} className={r.state}><i />{r.label}<em>{r.state === "cleared" ? "cleared" : r.state === "treated" ? "treated" : "open"}</em></span>)}
            </div>
          )}
        </div>

        <div className="pb-zone pb-record">
          <div className="pb-record-hd">Record</div>
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
    </div>
  );
}
