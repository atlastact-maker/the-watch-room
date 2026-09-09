"use client";

// The vital signs monitor — three sweeping traces, the numbers beside
// them, the NIBP cuff, the 12-lead and the alarm limits. One patient's
// instruments are one record (an external store keyed by casualty), so
// the tablet's top strip and the casualty care screen show the same cuff
// cycle, the same 12-lead and the same silenced alarm whichever is on
// screen — and the cuff still comes down while the crew is on another
// module.

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { PatientRedFlag } from "@/lib/sim/scene";
import type { PatientTreatmentState } from "@/lib/sim/incident_types";
import { ecgSample, displayedRate, type TraceRhythm } from "@/lib/sim/ecg";
import type { ResusState, MonitorMode } from "@/lib/sim/resus";

export type AlarmConfig = { on: boolean; hrLow: number; hrHigh: number; spo2Low: number; rrHigh: number; sysLow: number };
export const DEFAULT_ALARMS: AlarmConfig = { on: true, hrLow: 50, hrHigh: 120, spo2Low: 90, rrHigh: 30, sysLow: 90 };

export type Ecg12 = { at: number; rhythm: string; findings: string[]; impression: string };

export type MonitorState = {
  nibp: { sys: number; dia: number; at: number } | null;
  measuringSince: number | null;
  nibpAuto: 0 | 2 | 3 | 5;
  ecg12: Ecg12 | null;
  alarmCfg: AlarmConfig;
  alarmPanel: boolean;
  silencedUntil: number;
};

const EMPTY_MONITOR: MonitorState = { nibp: null, measuringSince: null, nibpAuto: 0, ecg12: null, alarmCfg: DEFAULT_ALARMS, alarmPanel: false, silencedUntil: 0 };
const store = new Map<string, MonitorState>();
const listeners = new Set<() => void>();
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
export function readMonitorState(casualtyId: string): MonitorState {
  return store.get(casualtyId) ?? EMPTY_MONITOR;
}
export function updateMonitorState(casualtyId: string, fn: (prev: MonitorState) => MonitorState): void {
  const prev = readMonitorState(casualtyId);
  const next = fn(prev);
  if (next === prev) return;
  store.set(casualtyId, next);
  for (const l of listeners) l();
}
export function useMonitorState(casualtyId: string): MonitorState {
  return useSyncExternalStore(subscribe, () => readMonitorState(casualtyId), () => EMPTY_MONITOR);
}

function wall(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false });
}

function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function hashSeedLocal(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** What the monitor is showing for this patient right now — the numbers,
 *  the rhythm and which limits are breached. Shared by the panel and the
 *  care screen's header. */
export function monitorPicture(treatment: PatientTreatmentState | null, resus: ResusState | undefined, now: number, state: MonitorState) {
  const surveyDone = !!treatment?.surveyCompletedAt;
  const vitals = treatment?.liveVitals ?? treatment?.revealedVitals;
  const flags = treatment?.activeRedFlags ?? treatment?.revealedRedFlags ?? [];
  const inArrest = !!resus && !resus.roscAt && !resus.roleAt;
  const rhythm: TraceRhythm = inArrest ? resus!.rhythm : "sinus";
  const compressions = inArrest && (!!resus!.compressorCrewId || !!resus!.lucasFittedAt);
  const hrShown = surveyDone && vitals ? displayedRate(rhythm, { rate: vitals.hr }) : null;
  const spo2Shown = surveyDone && vitals && !inArrest ? Math.round(vitals.spo2) : null;
  const rrShown = surveyDone && vitals && !inArrest ? Math.round(vitals.rr) : null;
  const updatedAt = treatment?.liveVitalsLastTickAt ?? treatment?.surveyCompletedAt;
  const nibpShown = state.nibp ?? (surveyDone && treatment?.revealedVitals ? { sys: treatment.revealedVitals.bpSys, dia: treatment.revealedVitals.bpDia, at: treatment.surveyCompletedAt ?? now } : null);
  const nibpMap = nibpShown ? Math.round((nibpShown.sys + 2 * nibpShown.dia) / 3) : null;
  const measuring = state.measuringSince !== null;
  const silenced = now < state.silencedUntil;
  const alarmCfg = state.alarmCfg;
  const breaches: string[] = [];
  if (alarmCfg.on && surveyDone && vitals && !inArrest) {
    if (hrShown !== null && hrShown < alarmCfg.hrLow) breaches.push(`HR ${hrShown} low`);
    if (hrShown !== null && hrShown > alarmCfg.hrHigh) breaches.push(`HR ${hrShown} high`);
    if (spo2Shown !== null && spo2Shown < alarmCfg.spo2Low) breaches.push(`SpO₂ ${spo2Shown} low`);
    if (rrShown !== null && rrShown > alarmCfg.rrHigh) breaches.push(`RR ${rrShown} high`);
    if (nibpShown && nibpShown.sys < alarmCfg.sysLow && nibpShown.sys > 0) breaches.push(`Systolic ${nibpShown.sys} low`);
  }
  if (inArrest && alarmCfg.on) breaches.push("No output");
  const alarming = breaches.length > 0 && !silenced;
  return { surveyDone, vitals, flags, inArrest, rhythm, compressions, hrShown, spo2Shown, rrShown, updatedAt, nibpShown, nibpMap, measuring, silenced, breaches, alarming };
}

/** What a 12-lead would show for this patient, read off the physiology
 *  and the history rather than a canned string. */
export function interpretEcg(tx: PatientTreatmentState | null, resus: ResusState | undefined, hr: number | null, flags: PatientRedFlag[], temp: number | undefined): { rhythm: string; findings: string[]; impression: string } {
  const findings: string[] = [];
  const inArrest = !!resus && !resus.roscAt && !resus.roleAt;
  if (inArrest) {
    const r = resus!.rhythm;
    const rhythm = r === "vf" ? "Ventricular fibrillation" : r === "pvt" ? "Pulseless ventricular tachycardia" : r === "pea" ? "Organised rhythm — no pulse (PEA)" : "Asystole";
    return { rhythm, findings: [r === "vf" || r === "pvt" ? "Shockable rhythm — charge and shock" : "Non-shockable — CPR and adrenaline, find the cause"], impression: rhythm };
  }
  const rate = hr ?? 0;
  const af = tx?.profile?.history.some((h) => /atrial fibrillation/i.test(h));
  let rhythm = af ? `Atrial fibrillation, ventricular rate ${rate}` : rate > 100 ? `Sinus tachycardia, ${rate}` : rate < 60 ? `Sinus bradycardia, ${rate}` : `Sinus rhythm, ${rate}`;
  if (af) findings.push("Irregularly irregular, no P waves");
  if (flags.includes("stemi")) {
    const territory = ["anterior (V1–V4)", "inferior (II, III, aVF)", "lateral (I, aVL, V5–V6)"][hashSeedLocal(tx?.casualtyId ?? "") % 3];
    findings.push(`ST elevation ${territory} with reciprocal depression`);
    if (tx?.physio && tx.physio.ischaemia > 0.7) findings.push("Evolving Q waves — established infarct");
  }
  if (temp !== undefined && temp < 32) findings.push("Osborn J waves — hypothermia");
  if (tx?.physio && tx.physio.icp > 0.6) findings.push("Deep T-wave inversion — raised intracranial pressure");
  if (flags.includes("overdose_opioid") || (tx?.physio?.sedation ?? 0) > 0.6) findings.push("Sinus rhythm, slow — no ischaemic change");
  if (rate > 150 && !af) { rhythm = `Narrow-complex tachycardia, ${rate}`; findings.push("Regular narrow complexes — SVT vs sinus tachycardia; look for the cause"); }
  if (findings.length === 0) findings.push("Normal axis, PR 160 ms, QRS 90 ms, QTc 410 ms", "No acute ST change");
  const impression = flags.includes("stemi") ? "STEMI — PPCI centre, pre-alert" : af ? "AF — rate control is a hospital decision" : rate > 100 ? "Sinus tachycardia — treat the cause" : "No acute abnormality";
  return { rhythm, findings, impression };
}

// ---------------------------------------------------------------------------
// The monitor — three sweeping traces and the numbers beside them
// ---------------------------------------------------------------------------

const PX_PER_SEC = 60;
type Lane = { key: string; label: string; colour: string; h: number; ticks: readonly string[] };
const LANES: readonly Lane[] = [
  { key: "ecg", label: "II", colour: "#22c55e", h: 96, ticks: ["1 mV", "0", "-1"] },
  { key: "pleth", label: "Pleth", colour: "#22d3ee", h: 78, ticks: ["100", "50", "0"] },
  { key: "resp", label: "Resp", colour: "#facc15", h: 72, ticks: ["50", "0"] },
];
/** The tablet's monitor: the same three traces at half height so the
 *  strip stays pinned above the pages without eating the screen. */
const LANES_COMPACT: readonly Lane[] = [
  { key: "ecg", label: "II", colour: "#22c55e", h: 52, ticks: ["1 mV", "-1"] },
  { key: "pleth", label: "Pleth", colour: "#22d3ee", h: 40, ticks: ["100", "0"] },
  { key: "resp", label: "Resp", colour: "#facc15", h: 36, ticks: ["50", "0"] },
];

function plethSample(t: number, hr: number, strength: number): number {
  if (hr <= 0) return 0;
  const period = 60 / hr;
  const p = (t % period) / period;
  // Fast upstroke, slower decay with a dicrotic notch on the way down.
  const rise = p < 0.15 ? Math.sin((p / 0.15) * Math.PI * 0.5) : Math.exp(-(p - 0.15) * 5.5) * (1 + 0.18 * Math.exp(-Math.pow((p - 0.42) / 0.05, 2)));
  return rise * strength;
}

export function VitalsMonitor({ rhythm, hr, spo2, rr, compressions, active, compact }: { rhythm: TraceRhythm; hr: number; spo2: number; rr: number; compressions: boolean; active: boolean; compact?: boolean }) {
  const lanes = compact ? LANES_COMPACT : LANES;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const live = useRef({ rhythm, hr, spo2, rr, compressions, active });
  useEffect(() => {
    live.current = { rhythm, hr, spo2, rr, compressions, active };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const total = lanes.reduce((n, l) => n + l.h, 0);
    let width = 0;
    let raf = 0;
    let x = 0;
    let started = performance.now();
    const last: (number | null)[] = lanes.map(() => null);

    function background(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = "#05090e";
      ctx.fillRect(0, 0, width, total);
      ctx.strokeStyle = "rgba(120,150,170,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = 0; gx <= width; gx += 12) { ctx.moveTo(gx + 0.5, 0); ctx.lineTo(gx + 0.5, total); }
      for (let gy = 0; gy <= total; gy += 12) { ctx.moveTo(0, gy + 0.5); ctx.lineTo(width, gy + 0.5); }
      ctx.stroke();
      let y = 0;
      ctx.strokeStyle = "rgba(120,150,170,0.35)";
      for (const l of lanes) {
        y += l.h;
        ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(width, y + 0.5); ctx.stroke();
      }
    }
    function resize() {
      if (!canvas || !wrap) return;
      width = Math.max(200, wrap.clientWidth);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(total * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${total}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      background(ctx);
      x = 0;
      last.fill(null);
      started = performance.now();
    }
    function sample(i: number, t: number): number {
      const v = live.current;
      if (!v.active) return 0;
      if (i === 0) return ecgSample(v.rhythm, t, { rate: v.hr, compressions: v.compressions });
      const output = v.rhythm === "sinus" && v.hr > 0;
      if (i === 1) return output ? plethSample(t, v.hr, Math.max(0.2, Math.min(1, (v.spo2 - 60) / 38))) : 0;
      return v.rr > 0 ? Math.sin((t * v.rr / 60) * Math.PI * 2) : 0;
    }
    function frame(nowMs: number) {
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;
      const t = (nowMs - started) / 1000;
      const targetX = (t * PX_PER_SEC) % width;
      // Draw every column between the last cursor and this one.
      let step = 0;
      while (Math.abs(targetX - x) > 0.5 && step++ < 400) {
        const nx = x + 1 >= width ? 0 : x + 1;
        if (nx === 0) last.fill(null);
        // Erase bar ahead of the cursor.
        ctx.fillStyle = "#05090e";
        ctx.fillRect(nx, 0, 14, total);
        ctx.strokeStyle = "rgba(120,150,170,0.12)";
        ctx.beginPath();
        for (let gy = 0; gy <= total; gy += 12) { ctx.moveTo(nx, gy + 0.5); ctx.lineTo(nx + 14, gy + 0.5); }
        if (Math.floor((nx + 12) / 12) !== Math.floor((nx + 11) / 12)) { const gx = Math.floor((nx + 12) / 12) * 12; ctx.moveTo(gx + 0.5, 0); ctx.lineTo(gx + 0.5, total); }
        ctx.stroke();
        const ts = nx / PX_PER_SEC + Math.floor(t * PX_PER_SEC / width) * (width / PX_PER_SEC);
        let top = 0;
        lanes.forEach((l, i) => {
          const s = sample(i, ts);
          const mid = top + l.h * (i === 0 ? 0.62 : i === 1 ? 0.8 : 0.5);
          const amp = i === 0 ? l.h * 0.36 : i === 1 ? l.h * 0.6 : l.h * 0.3;
          const y = mid - s * amp;
          const prev = last[i];
          if (prev !== null) {
            ctx.strokeStyle = l.colour;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(x, prev);
            ctx.lineTo(nx, y);
            ctx.stroke();
          }
          last[i] = y;
          top += l.h;
        });
        x = nx;
        if (nx === 0) break;
      }
      raf = requestAnimationFrame(frame);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [lanes]);

  return (
    <div className={`cc-traces${compact ? " compact" : ""}`}>
      <div className="cc-trace-labels">
        {lanes.map((l) => (
          <div key={l.key} style={{ height: l.h, color: l.colour }}>
            <b>{l.label}</b>
            {l.ticks.map((t) => <small key={t}>{t}</small>)}
          </div>
        ))}
      </div>
      <div ref={wrapRef} className="cc-trace-canvas"><canvas ref={canvasRef} /></div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The panel — traces, numbers, NIBP, 12-lead and alarms for one patient
// ---------------------------------------------------------------------------

export type VitalMonitorPanelProps = {
  casualtyId: string;
  treatment: PatientTreatmentState | null;
  resus?: ResusState;
  /** Clinicians with the patient — no one, no monitor. */
  paired: number;
  now: number;
  /** Who the observations are recorded by. */
  by: string;
  compact?: boolean;
  onRecordObservation?: (casualtyId: string, text: string, by: string) => void;
  onAttachMonitor?: (casualtyId: string, mode: MonitorMode) => void;
};

export function VitalMonitorPanel(props: VitalMonitorPanelProps) {
  const { casualtyId, treatment, resus, paired, now, by, compact } = props;
  const state = useMonitorState(casualtyId);
  const { nibpAuto, ecg12, alarmCfg, alarmPanel } = state;
  const set = (fn: (m: MonitorState) => MonitorState) => updateMonitorState(casualtyId, fn);
  const setAlarmCfg = (fn: (c: AlarmConfig) => AlarmConfig) => set((m) => ({ ...m, alarmCfg: fn(m.alarmCfg) }));
  const setAlarmPanel = (v: boolean) => set((m) => ({ ...m, alarmPanel: v }));
  const setNibpAuto = (v: 0 | 2 | 3 | 5) => set((m) => ({ ...m, nibpAuto: v }));
  const setMeasuringSince = (v: number | null) => set((m) => ({ ...m, measuringSince: v }));
  const pic = monitorPicture(treatment, resus, now, state);
  const { surveyDone, vitals, flags, rhythm, compressions, hrShown, spo2Shown, rrShown, updatedAt, nibpShown, nibpMap, measuring, silenced, breaches, alarming } = pic;
  const surveyRunning = !!treatment?.surveyStartedAt && !treatment.surveyCompletedAt;
  const connected = surveyDone && paired > 0;
  const measuringSince = state.measuringSince;
  const vitalsRef = useRef<PatientTreatmentState["liveVitals"]>(undefined);
  const lastAlarmRef = useRef<string>("");
  const { onRecordObservation, onAttachMonitor } = props;
  useEffect(() => {
    vitalsRef.current = treatment?.liveVitals;
  });
  const record = (text: string) => onRecordObservation?.(casualtyId, text, by);
  // A cuff cycle takes about eight seconds, then the reading is the
  // pressure the patient had when the cuff came down. Whichever panel
  // is mounted runs the cycle; the reading lands in the shared record.
  useEffect(() => {
    if (measuringSince === null) return;
    const id = window.setTimeout(() => {
      const v = vitalsRef.current;
      const at = Date.now();
      updateMonitorState(casualtyId, (m) => {
        if (m.measuringSince !== measuringSince) return m;
        return { ...m, measuringSince: null, nibp: v ? { sys: Math.round(v.bpSys), dia: Math.round(v.bpDia), at } : m.nibp };
      });
      if (v) {
        const sys = Math.round(v.bpSys);
        const dia = Math.round(v.bpDia);
        onRecordObservation?.(casualtyId, sys === 0 ? "NIBP — no reading, no pulse" : `NIBP ${sys}/${dia} · MAP ${Math.round((sys + 2 * dia) / 3)}`, by);
      }
    }, Math.max(0, 8000 - (Date.now() - measuringSince)));
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measuringSince, casualtyId]);
  useEffect(() => {
    if (!nibpAuto || !surveyDone) return;
    const id = window.setInterval(() => updateMonitorState(casualtyId, (m) => (m.measuringSince === null ? { ...m, measuringSince: Date.now() } : m)), nibpAuto * 60000);
    return () => window.clearInterval(id);
  }, [nibpAuto, surveyDone, casualtyId]);
  // Alarms: a log line on each new breach, once, from whichever panel sees it first.
  const alarmKey = breaches.map((b) => b.replace(/\d+/g, "")).join("|");
  useEffect(() => {
    if (alarmKey === lastAlarmRef.current) return;
    lastAlarmRef.current = alarmKey;
    if (alarmKey && !compact) onRecordObservation?.(casualtyId, `ALARM · ${breaches.join(", ")}`, "Monitor");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarmKey]);
  const takeEcg = () => {
    const r = interpretEcg(treatment, resus, hrShown, flags, vitals?.temp);
    set((m) => ({ ...m, ecg12: { at: now, ...r } }));
    record(`12-lead ECG · ${r.rhythm} · ${r.impression}`);
    if (resus) onAttachMonitor?.(casualtyId, "lead_12");
  };
  const setEcg12 = (v: Ecg12 | null) => set((m) => ({ ...m, ecg12: v }));
  const setSilencedUntil = (v: number) => set((m) => ({ ...m, silencedUntil: v }));

  return (
    <>
      <div className={`cc-monitor${alarming ? " alarm" : ""}${compact ? " compact" : ""}`}>
        <VitalsMonitor rhythm={rhythm} hr={vitals?.hr ?? 0} spo2={vitals?.spo2 ?? 0} rr={vitals?.rr ?? 0} compressions={compressions} active={connected} compact={compact} />
        <div className="cc-numbers">
          <div className={`hr${breaches.some((b) => b.startsWith("HR")) && !silenced ? " alarm" : ""}`}><span>HR <i>♥</i></span><strong>{hrShown ?? "--"}</strong><small>bpm</small></div>
          <div className={`spo2${breaches.some((b) => b.startsWith("SpO")) && !silenced ? " alarm" : ""}`}><span>SpO₂</span><strong>{spo2Shown ?? "--"}</strong><small>%</small></div>
          <div className={`rr${breaches.some((b) => b.startsWith("RR")) && !silenced ? " alarm" : ""}`}><span>RR</span><strong>{rrShown ?? "--"}</strong><small>/min</small></div>
        </div>
        {!surveyDone && (
          <div className="cc-mon-overlay">{paired === 0 ? "NO CLINICIAN WITH PATIENT" : surveyRunning ? "PRIMARY SURVEY IN PROGRESS" : "START THE PRIMARY SURVEY TO CONNECT THE MONITOR"}</div>
        )}
        {alarmPanel && (
          <div className="cc-alarm-panel">
            <strong>ALARM LIMITS</strong>
            <label><span>Alarms</span><button type="button" className="cc-mini" aria-pressed={alarmCfg.on} onClick={() => setAlarmCfg((c) => ({ ...c, on: !c.on }))}>{alarmCfg.on ? "On" : "Off"}</button></label>
            {([["hrLow", "HR low"], ["hrHigh", "HR high"], ["spo2Low", "SpO₂ low"], ["rrHigh", "RR high"], ["sysLow", "Systolic low"]] as const).map(([k, label]) => (
              <label key={k}>
                <span>{label}</span>
                <span className="cc-stepper small">
                  <button type="button" onClick={() => setAlarmCfg((c) => ({ ...c, [k]: c[k] - (k === "spo2Low" ? 1 : 5) }))}>−</button>
                  <output>{alarmCfg[k]}</output>
                  <button type="button" onClick={() => setAlarmCfg((c) => ({ ...c, [k]: c[k] + (k === "spo2Low" ? 1 : 5) }))}>+</button>
                </span>
              </label>
            ))}
            <label><span>NIBP auto-cycle</span>
              <span className="cc-segs">
                {([0, 2, 3, 5] as const).map((m) => (
                  <button key={m} type="button" aria-pressed={nibpAuto === m} onClick={() => setNibpAuto(m)}>{m === 0 ? "Off" : `${m} min`}</button>
                ))}
              </span>
            </label>
            <div className="cc-alarm-actions">
              <button type="button" className="cc-mini" onClick={() => setSilencedUntil(now + 120000)}>Silence 2 min</button>
              <button type="button" className="cc-mini" onClick={() => setAlarmCfg(() => DEFAULT_ALARMS)}>Defaults</button>
              <button type="button" className="cc-mini" onClick={() => setAlarmPanel(false)}>Done</button>
            </div>
          </div>
        )}
        {ecg12 && (
          <div className="cc-ecg12">
            <strong>12-LEAD ECG · {wall(ecg12.at)}</strong>
            <p className="rhythm">{ecg12.rhythm}</p>
            <ul>{ecg12.findings.map((f) => <li key={f}>{f}</li>)}</ul>
            <p className="impression">{ecg12.impression}</p>
            <button type="button" className="cc-mini" onClick={() => setEcg12(null)}>Close</button>
          </div>
        )}
      </div>
      <div className={`cc-mon-strip${compact ? " compact" : ""}`}>
        <div className="cc-nibp">
          <div className={breaches.some((b) => b.startsWith("Systolic")) && !silenced ? "alarm" : ""}><span>NIBP</span><strong>{measuring ? "· · ·" : nibpShown ? `${nibpShown.sys} / ${nibpShown.dia}` : "-- / --"}</strong><small>mmHg{nibpAuto ? ` · auto ${nibpAuto} min` : ""}</small></div>
          <div className="map"><span>MAP</span><strong>{measuring ? "··" : nibpMap ?? "--"}</strong></div>
          <div><span>TEMP</span><strong>{vitals && surveyDone ? vitals.temp.toFixed(1) : "--"}</strong><small>°C</small></div>
          <div className="upd"><span>{measuring ? "Cuff inflating" : "NIBP taken"}</span><strong>{measuring ? "measuring…" : nibpShown ? wall(nibpShown.at) : updatedAt ? wall(updatedAt) : "--:--:--"}</strong></div>
        </div>
        <div className="cc-mon-buttons">
          <button type="button" disabled={!connected} onClick={takeEcg}>12-lead ECG</button>
          <button type="button" disabled={!connected || measuring} onClick={() => setMeasuringSince(now)}>{measuring ? "Measuring…" : "Measure BP"}</button>
          <button type="button" aria-pressed={alarmPanel} onClick={() => setAlarmPanel(!alarmPanel)}>{alarming ? `Alarm · ${breaches[0]}` : silenced ? "Alarms silenced" : "Alarm settings"}</button>
        </div>
      </div>
    </>
  );
}

/** The header line the care screen shows beside the monitor's title. */
export function MonitorMeta({ casualtyId, now, compact }: { casualtyId: string; now: number; compact?: boolean }) {
  const state = useMonitorState(casualtyId);
  const silenced = now < state.silencedUntil;
  return (
    <span className="cc-mon-meta">
      {!compact && "Lead II · 25 mm/s · 10 mm/mV"}
      {silenced && <em>silenced {mmss(state.silencedUntil - now)}</em>}
      <button type="button" title="Alarm settings" aria-pressed={state.alarmPanel} onClick={() => updateMonitorState(casualtyId, (m) => ({ ...m, alarmPanel: !m.alarmPanel }))}>{state.alarmCfg.on ? "🔔" : "🔕"}</button>
    </span>
  );
}
