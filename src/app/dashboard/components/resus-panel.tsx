"use client";

// The resuscitation board — the ALS loop as the operator sees it.
//
// Everything here hangs off the two-minute cycle: the countdown to the
// next rhythm check, the shock count that gates the drugs, and the
// compressor who is quietly getting tired. The clinical rules live in
// src/lib/sim/resus.ts; this file only draws them.
//
// Numbers are UK numbers. End-tidal CO2 reads in kPa because that is
// what a Corpuls or a LIFEPAK shows a British paramedic.

import {
  CYCLE_SEC,
  ETCO2_FUTILE_KPA,
  ETCO2_TARGET_KPA,
  LUCAS_FIT_SEC,
  MONITOR_LABEL,
  POST_ROSC,
  REVERSIBLE_LABEL,
  REVERSIBLE_TREATMENT,
  RHYTHM_LABEL,
  adrenalineDue,
  amiodaroneDoseMg,
  amiodaroneDue,
  compressionQuality,
  downtimeSec,
  etco2Comment,
  isShockable,
  refractoryVf,
  secondsToRhythmCheck,
  shockJoules,
  type AirwayState,
  type MonitorMode,
  type PostRoscIssue,
  type ResusState,
  type ReversibleCause,
} from "@/lib/sim/resus";
import { SCOPE_LEVEL, type ClinicianScope } from "@/lib/sim/incident_types";
import { MonitorScreen } from "./monitor-screen";
import type { PatientClinical } from "@/lib/sim/scene";

export type CompressorOption = {
  id: string;
  name: string;
  role: string;
  callsign: string;
};

export function ResusPanel({
  state,
  now,
  scope,
  candidates,
  lucasAvailable,
  monitorAvailable,
  postRoscIssues,
  vitals,
  onSetAirway,
  onAttachMonitor,
  onToggleCapnography,
  onSetCompressor,
  onFitLucas,
  onShock,
  onMovePads,
  onAdrenaline,
  onAmiodarone,
  onSuspectReversible,
  onTreatReversible,
  onStopResus,
}: {
  state: ResusState;
  now: number;
  scope: ClinicianScope;
  candidates: CompressorOption[];
  lucasAvailable: boolean;
  monitorAvailable: boolean;
  postRoscIssues: PostRoscIssue[];
  vitals?: PatientClinical["vitals"];
  onSetAirway: (a: AirwayState) => void;
  onAttachMonitor: (m: MonitorMode) => void;
  onToggleCapnography: () => void;
  onSetCompressor: (c: CompressorOption) => void;
  onFitLucas: () => void;
  onShock: () => void;
  onMovePads: () => void;
  onAdrenaline: () => void;
  onAmiodarone: () => void;
  onSuspectReversible: (c: ReversibleCause) => void;
  onTreatReversible: (c: ReversibleCause) => void;
  onStopResus: () => void;
}) {
  const rosc = state.roscAt !== undefined;
  const stopped = state.roleAt !== undefined;
  const quality = compressionQuality(state, now);
  const toCheck = secondsToRhythmCheck(state, now);
  const down = downtimeSec(state, now);
  const monitored = state.monitor !== "none";
  const lucasFitting =
    state.lucasFittedAt !== undefined && now < state.lucasFittedAt + LUCAS_FIT_SEC * 1000;
  const lucasOn = state.lucasFittedAt !== undefined && !lucasFitting;
  const etco2 = state.etco2;
  const cap = etco2Comment(etco2, rosc);

  if (stopped) {
    return (
      <div className="rounded-sm border border-(--color-border) bg-(--color-bg)/60 p-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
          Resuscitation discontinued
        </div>
        <p className="mt-1 font-mono text-[10px] leading-snug text-(--color-text-muted)">
          Life recognised extinct after {fmtClock(down)} of resuscitation ·{" "}
          {state.shocks} shock{state.shocks === 1 ? "" : "s"} ·{" "}
          {state.adrenalineDoses} × adrenaline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* ---- ROSC + post-ROSC management ---- */}
      {rosc && (
        <div className="rounded-sm border border-(--color-ok) bg-(--color-ok)/10 p-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-(--color-ok)">
              ROSC — output restored
            </div>
            {state.reArrests > 0 && (
              <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-amber)">
                {state.reArrests} re-arrest{state.reArrests === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <p className="mt-1 font-mono text-[10px] leading-snug text-(--color-text-muted)">
            Down {fmtClock(down)}. This is the middle of the job, not the end —
            a patient who has just been got back can lose output again.
          </p>
          {postRoscIssues.length === 0 ? (
            <p className="mt-1.5 font-mono text-[10px] text-(--color-ok)">
              Targets met — SpO₂ {POST_ROSC.spo2Min}–{POST_ROSC.spo2Max}%,
              end-tidal {POST_ROSC.etco2MinKpa}–{POST_ROSC.etco2MaxKpa} kPa,
              systolic over {POST_ROSC.bpSysMin}. Get a 12-lead and pre-alert
              the PPCI centre.
            </p>
          ) : (
            <div className="mt-1.5 space-y-1">
              {postRoscIssues.map((i) => (
                <div
                  key={i.key}
                  className="rounded-sm border border-(--color-amber)/50 bg-(--color-amber)/5 px-2 py-1"
                >
                  <div className="font-mono text-[10px] text-(--color-amber)">{i.text}</div>
                  <div className="text-[9px] leading-tight text-(--color-text-dim)">
                    {i.fix}
                  </div>
                </div>
              ))}
              <p className="text-[9px] leading-snug text-(--color-text-dim)">
                Every one of these left unmanaged raises the chance of a
                re-arrest.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---- The clock ---- */}
      <div className="grid grid-cols-3 gap-1.5">
        <Stat label="Cycle" value={String(state.cycle + 1)} sub="2 min each" />
        <Stat
          label="Rhythm check"
          value={rosc ? "—" : `${Math.ceil(toCheck)}s`}
          sub={rosc ? "" : toCheck <= 10 ? "stand clear" : "continue CPR"}
          tone={!rosc && toCheck <= 10 ? "amber" : undefined}
        />
        <Stat label="Downtime" value={fmtClock(down)} sub={`${state.shocks} shock${state.shocks === 1 ? "" : "s"}`} />
      </div>
      {!rosc && (
        <div className="h-1 overflow-hidden rounded-sm bg-(--color-bg)">
          <div
            className="h-full bg-(--color-amber)"
            style={{ width: `${((CYCLE_SEC - toCheck) / CYCLE_SEC) * 100}%` }}
          />
        </div>
      )}

      {/* ---- Monitoring ---- */}
      <Group title="Monitoring">
        {!monitorAvailable ? (
          <Note>
            No cardiac monitor on scene. A defibrillator-monitor comes with an
            ambulance resource — until one is with the patient you are working
            blind.
          </Note>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1.5">
              {(["pads", "lead_3", "lead_12"] as MonitorMode[]).map((m) => (
                <Chip
                  key={m}
                  label={MONITOR_LABEL[m]}
                  done={state.monitor === m}
                  onClick={() => onAttachMonitor(m)}
                  title={
                    m === "pads"
                      ? "Defib pads — gives a rhythm at each check and lets you shock."
                      : m === "lead_3"
                        ? "3-lead ECG — continuous rhythm between checks."
                        : "12-lead ECG — post-ROSC, identifies a STEMI and drives the PPCI decision."
                  }
                />
              ))}
            </div>
            <Chip
              label={state.capnographyOn ? "Capnography running" : "Attach capnography"}
              done={state.capnographyOn}
              onClick={onToggleCapnography}
              title="Waveform ETCO₂ — confirms the airway, shows how good the compressions are, and spots ROSC before you feel a pulse."
            />
          </>
        )}

        {/* The screen itself. Nothing until something is on the patient —
            an unmonitored arrest genuinely has no trace to read. */}
        {monitored ? (
          <MonitorScreen
            rhythm={rosc ? "sinus" : state.rhythm}
            compressions={!rosc && quality > 0}
            capnographyOn={state.capnographyOn}
            etco2={etco2}
            hr={vitals?.hr}
            spo2={vitals?.spo2}
            bpSys={vitals?.bpSys}
            bpDia={vitals?.bpDia}
            leadLabel={state.monitor === "lead_12" ? "12-LEAD" : state.monitor === "lead_3" ? "LEAD II" : "PADS"}
            hasOutput={rosc}
          />
        ) : (
          <div className="rounded-sm border border-(--color-border) bg-[#05070a] px-3 py-6 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-text-dim)">
              No trace — nothing attached
            </div>
          </div>
        )}

        {/* What the trace means, in words, under the screen. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <span
            className={`font-mono text-[11px] ${
              monitored
                ? rosc
                  ? "text-(--color-ok)"
                  : isShockable(state.rhythm)
                    ? "text-(--color-critical)"
                    : "text-(--color-text)"
                : "text-(--color-text-dim)"
            }`}
          >
            {rosc
              ? "Organised — output present"
              : monitored
                ? RHYTHM_LABEL[state.rhythm]
                : "Rhythm unknown — not monitored"}
          </span>
          {state.capnographyOn && (
            <span
              className={`font-mono text-[10px] ${
                cap.tone === "good"
                  ? "text-(--color-ok)"
                  : cap.tone === "warn"
                    ? "text-(--color-amber)"
                    : "text-(--color-critical)"
              }`}
            >
              {cap.text} · target ≥{ETCO2_TARGET_KPA} kPa
              {etco2 < ETCO2_FUTILE_KPA ? ` · below ${ETCO2_FUTILE_KPA}` : ""}
            </span>
          )}
        </div>
        {monitored && !rosc && quality > 0 && (
          <Note tone="amber">
            The trace is buried in compression artefact — this is why the
            rhythm is assessed at the two-minute check, not continuously.
          </Note>
        )}
      </Group>

      {/* ---- Compressions ---- */}
      {!rosc && (
        <Group title="Compressions">
          {lucasOn ? (
            <div className="rounded-sm border border-(--color-ok)/40 bg-(--color-ok)/5 px-2 py-1.5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-ok)">
                LUCAS running · 30:2 continuous
              </div>
              <div className="mt-0.5 text-[9px] leading-tight text-(--color-text-dim)">
                Mechanical compressions hold their depth and rate indefinitely,
                and free a pair of hands. It also makes CPR possible on the
                move.
              </div>
            </div>
          ) : lucasFitting ? (
            <Note tone="amber">
              Fitting the LUCAS — compressions are paused. Keep the interruption
              short.
            </Note>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                  On the chest
                </span>
                <span
                  className={`font-mono text-[10px] ${
                    quality >= 0.9
                      ? "text-(--color-ok)"
                      : quality >= 0.6
                        ? "text-(--color-amber)"
                        : "text-(--color-critical)"
                  }`}
                >
                  {state.compressorName
                    ? `${state.compressorName} · ${Math.round(quality * 100)}%`
                    : "Nobody"}
                </span>
              </div>
              {state.compressorName && (
                <div className="h-1 overflow-hidden rounded-sm bg-(--color-bg)">
                  <div
                    className={`h-full ${
                      quality >= 0.9
                        ? "bg-(--color-ok)"
                        : quality >= 0.6
                          ? "bg-(--color-amber)"
                          : "bg-(--color-critical)"
                    }`}
                    style={{ width: `${quality * 100}%` }}
                  />
                </div>
              )}
              {quality < 0.9 && state.compressorName && (
                <Note tone="amber">
                  {state.compressorName} is tiring. Swap the compressor — the
                  guidance says every two minutes for a reason.
                </Note>
              )}
              {candidates.length === 0 ? (
                <Note>No crew on scene to take the chest.</Note>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {candidates.map((c) => (
                    <Chip
                      key={c.id}
                      label={`${c.name}`}
                      sub={`${c.role} · ${c.callsign}`}
                      done={state.compressorCrewId === c.id}
                      onClick={() => onSetCompressor(c)}
                      title={`Put ${c.name} on the chest. They will tire after about two minutes.`}
                    />
                  ))}
                </div>
              )}
              {lucasAvailable && (
                <Chip
                  label="Fit LUCAS — mechanical CPR"
                  onClick={onFitLucas}
                  title={`Costs about ${LUCAS_FIT_SEC}s of paused compressions to fit, then holds quality indefinitely and frees a rescuer.`}
                />
              )}
              {!lucasAvailable && (
                <Note>
                  No mechanical CPR device on scene. LUCAS rides on the advanced
                  paramedic, critical care and HART vehicles — not a standard
                  DCA.
                </Note>
              )}
            </>
          )}
        </Group>
      )}

      {/* ---- Airway ---- */}
      <Group title="Airway">
        <div className="grid grid-cols-2 gap-1.5">
          <Chip
            label="Insert i-gel"
            done={state.airway === "igel"}
            onClick={() => onSetAirway("igel")}
            title="Supraglottic airway. Lets you run continuous compressions and ventilate at 10/min instead of stopping for 30:2."
          />
          <Chip
            label="Intubate · RSI"
            done={state.airway === "ett"}
            disabled={SCOPE_LEVEL[scope] < SCOPE_LEVEL.ccc}
            onClick={() => onSetAirway("ett")}
            title="Tracheal tube. Critical care or HEMS only, and only with a high first-pass success rate."
          />
        </div>
        {state.airway === "none" ? (
          <Note>
            No advanced airway — compressions must pause for ventilations at
            30:2, and the capnography reading is less reliable through a mask.
          </Note>
        ) : (
          <Note>
            Advanced airway in — continuous compressions, ventilate at 10 per
            minute, no pausing.
          </Note>
        )}
      </Group>

      {/* ---- Defibrillation ---- */}
      {!rosc && (
        <Group title="Defibrillation">
          {!monitored ? (
            <Note>Attach pads before you can assess a rhythm or shock.</Note>
          ) : isShockable(state.rhythm) ? (
            <>
              <BigAction
                label={`Shock · ${shockJoules(state.shocks + 1)} J biphasic`}
                detail="Charge during compressions. Peri-shock pause under 5 seconds."
                tone="critical"
                onClick={onShock}
              />
              {refractoryVf(state) && (
                <>
                  <Note tone="amber">
                    Refractory VF — still shockable after three shocks. RCUK 2025
                    says put a fresh set of pads on anterior-posterior.
                  </Note>
                  <Chip label="Move pads to anterior-posterior" onClick={onMovePads} />
                </>
              )}
            </>
          ) : (
            <Note>
              {RHYTHM_LABEL[state.rhythm]} — not shockable. Compressions and
              adrenaline, and hunt the reversible cause.
            </Note>
          )}
        </Group>
      )}

      {/* ---- Drugs ---- */}
      {!rosc && (
        <Group title="Drugs">
          <Chip
            label={`Adrenaline 1 mg IV/IO${state.adrenalineDoses > 0 ? ` · ${state.adrenalineDoses} given` : ""}`}
            due={adrenalineDue(state, now)}
            onClick={onAdrenaline}
            title={
              isShockable(state.rhythm)
                ? "Shockable rhythm: first dose after the third shock, then every 3–5 minutes."
                : "Non-shockable: give as soon as you have access, then every 3–5 minutes."
            }
          />
          <Chip
            label={`Amiodarone ${amiodaroneDoseMg(state)} mg IV${state.amiodaroneDoses > 0 ? ` · ${state.amiodaroneDoses} given` : ""}`}
            due={amiodaroneDue(state)}
            disabled={!isShockable(state.rhythm) || state.amiodaroneDoses >= 2}
            onClick={onAmiodarone}
            title="300 mg after three shocks, 150 mg after five. Shockable rhythms only. Causes hypotension and bradycardia."
          />
          {SCOPE_LEVEL[scope] < SCOPE_LEVEL.ap && (
            <Note>
              Amiodarone is an advanced paramedic drug — request an AP, critical
              care or HEMS if this stays in VF.
            </Note>
          )}
        </Group>
      )}

      {/* ---- Reversible causes ---- */}
      {!rosc && (
        <Group title="Reversible causes · 4 Hs and 4 Ts">
          <div className="grid grid-cols-1 gap-1">
            {(Object.keys(REVERSIBLE_LABEL) as ReversibleCause[]).map((c) => {
              const rx = REVERSIBLE_TREATMENT[c];
              const st = state.reversibles[c];
              const canTreat = SCOPE_LEVEL[scope] >= SCOPE_LEVEL[rx.minScope];
              return (
                <div
                  key={c}
                  className={`rounded-sm border px-2 py-1.5 ${
                    st === "treated"
                      ? "border-(--color-ok)/50 bg-(--color-ok)/5"
                      : st === "suspected"
                        ? "border-(--color-amber)/50 bg-(--color-amber)/5"
                        : "border-(--color-border-subtle) bg-(--color-bg)/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-(--color-text)">
                      {REVERSIBLE_LABEL[c]}
                    </span>
                    <div className="flex gap-1">
                      {st === undefined && (
                        <MiniBtn label="Suspect" onClick={() => onSuspectReversible(c)} />
                      )}
                      {st === "suspected" && (
                        <MiniBtn
                          label={canTreat ? "Treat" : rx.minScope.toUpperCase()}
                          disabled={!canTreat}
                          onClick={() => onTreatReversible(c)}
                          title={
                            canTreat
                              ? rx.action
                              : `Needs ${rx.minScope.toUpperCase()} or higher: ${rx.action}`
                          }
                        />
                      )}
                      {st === "treated" && (
                        <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-ok)">
                          Treated
                        </span>
                      )}
                    </div>
                  </div>
                  {st !== undefined && (
                    <div className="mt-0.5 text-[9px] leading-tight text-(--color-text-dim)">
                      {st === "treated" ? rx.action : rx.hint}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Group>
      )}

      {/* ---- Stop ---- */}
      {!rosc && down > 20 * 60 && (
        <details className="rounded-sm border border-(--color-border-subtle) px-2 py-1.5">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
            Discontinue resuscitation
          </summary>
          <p className="mt-1 text-[9px] leading-snug text-(--color-text-dim)">
            Recognition of life extinct. Considered after prolonged asystole
            with no reversible cause, no ROSC, and an end-tidal that will not
            rise. This ends the resuscitation.
          </p>
          <MiniBtn label="Recognise life extinct" tone="critical" onClick={onStopResus} />
        </details>
      )}
    </div>
  );
}

// --- Small building blocks ------------------------------------------------

function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "amber";
}) {
  return (
    <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/40 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-widest text-(--color-text-dim)">
        {label}
      </div>
      <div
        className={`font-mono text-sm tabular-nums ${
          tone === "amber" ? "text-(--color-amber)" : "text-(--color-text)"
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-[9px] leading-tight text-(--color-text-dim)">{sub}</div>}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-(--color-amber-dim)">
        {title}
      </div>
      {children}
    </div>
  );
}

function Note({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "amber";
}) {
  return (
    <p
      className={`text-[9px] leading-snug ${
        tone === "amber" ? "text-(--color-amber)" : "text-(--color-text-dim)"
      }`}
    >
      {children}
    </p>
  );
}

function Chip({
  label,
  sub,
  done,
  due,
  disabled,
  title,
  onClick,
}: {
  label: string;
  sub?: string;
  done?: boolean;
  due?: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-sm border px-2 py-1.5 text-left transition-colors ${
        done
          ? "border-(--color-ok)/60 bg-(--color-ok)/10 text-(--color-ok)"
          : due
            ? "border-(--color-amber) bg-(--color-amber)/10 text-(--color-amber)"
            : disabled
              ? "border-(--color-border-subtle) text-(--color-text-dim) opacity-50"
              : "border-(--color-border) text-(--color-text) hover:border-(--color-amber)"
      }`}
    >
      <div className="font-mono text-[10px] leading-tight">
        {label}
        {due && <span className="ml-1 uppercase tracking-widest">· due</span>}
      </div>
      {sub && <div className="text-[9px] leading-tight opacity-70">{sub}</div>}
    </button>
  );
}

function BigAction({
  label,
  detail,
  tone,
  onClick,
}: {
  label: string;
  detail: string;
  tone?: "critical";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-sm border px-3 py-2 text-left transition-colors ${
        tone === "critical"
          ? "border-(--color-critical) bg-(--color-critical)/10 text-(--color-critical) hover:bg-(--color-critical)/20"
          : "border-(--color-border) text-(--color-text)"
      }`}
    >
      <div className="font-mono text-[12px] uppercase tracking-widest">{label}</div>
      <div className="mt-0.5 text-[9px] leading-tight opacity-80">{detail}</div>
    </button>
  );
}

function MiniBtn({
  label,
  disabled,
  tone,
  title,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  tone?: "critical";
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest transition-colors ${
        disabled
          ? "border-(--color-border-subtle) text-(--color-text-dim) opacity-50"
          : tone === "critical"
            ? "mt-1 border-(--color-critical) text-(--color-critical) hover:bg-(--color-critical)/10"
            : "border-(--color-border) text-(--color-text-muted) hover:border-(--color-amber) hover:text-(--color-amber)"
      }`}
    >
      {label}
    </button>
  );
}
