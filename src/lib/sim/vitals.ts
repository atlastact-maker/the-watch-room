/**
 * Live vitals model — drives the "numbers change over time" feedback on the
 * treatment tab. Called from dashboard-client on an interval.
 *
 * Rules are intentionally simple; this isn't a physiological simulator.
 * Each active red flag applies a per-second delta; each intervention
 * either clears the flag, reduces its delta, or pushes vitals back toward
 * normal. Values are clamped to plausible ranges so a crashing patient
 * hits rock-bottom (SpO2 → 60, BP → 60) rather than going negative.
 */

import type { PatientClinical, PatientRedFlag } from "./scene";
import type { PatientTreatmentState } from "./incident_types";
import { spo2TargetFor } from "./oxygen";

/** How far back the trend arrows compare. Fast enough to feel live,
 *  slow enough that an arrow means something. */
export const TREND_BASELINE_SEC = 4;

type Vitals = PatientClinical["vitals"];

const MIN = {
  rr: 0,
  spo2: 60,
  hr: 0,
  bpSys: 50,
  bpDia: 30,
  gcs: 3,
  temp: 33,
  bm: 1.5,
} as const;
const MAX = {
  rr: 60,
  spo2: 100,
  hr: 220,
  bpSys: 240,
  bpDia: 130,
  gcs: 15,
  temp: 41,
  bm: 30,
} as const;

function clamp(k: keyof Vitals, v: number): number {
  const lo = MIN[k];
  const hi = MAX[k];
  return Math.max(lo, Math.min(hi, v));
}

function apply(v: Vitals, patch: Partial<Vitals>): Vitals {
  const out = { ...v };
  for (const k of Object.keys(patch) as (keyof Vitals)[]) {
    const delta = patch[k];
    if (delta === undefined) continue;
    out[k] = clamp(k, out[k] + delta);
  }
  return out;
}

/** Target-drift — move v toward target by at most `step` per tick. */
function driftToward(current: number, target: number, step: number): number {
  if (current < target) return Math.min(target, current + step);
  if (current > target) return Math.max(target, current - step);
  return current;
}

/**
 * Advance live vitals by `dtSec` seconds. Returns the new treatment state
 * (liveVitals + prevLiveVitals + activeRedFlags + liveVitalsLastTickAt
 * updated). All other fields pass through unchanged.
 */
export function advanceLiveVitals(
  tx: PatientTreatmentState,
  dtSec: number,
  nowMs: number,
): PatientTreatmentState {
  if (!tx.liveVitals || !tx.surveyCompletedAt) return tx;
  if (dtSec <= 0) return tx;
  // Cap dt at 30 s — if the tab was backgrounded for minutes we don't
  // want a single resume to instantly kill the patient.
  const dt = Math.min(30, dtSec);
  const flags = new Set<PatientRedFlag>(tx.activeRedFlags ?? []);
  let v = tx.liveVitals;

  // ----- Interventions that CLEAR flags outright ------------------------
  // Needle decomp / thoracostomy clears tension pneumothorax.
  if (
    flags.has("tension_pneumothorax") &&
    (tx.breathing.needle_decomp !== undefined ||
      tx.breathing.finger_thoracostomy !== undefined)
  ) {
    flags.delete("tension_pneumothorax");
  }
  // Definitive airway clears airway_compromise.
  if (
    flags.has("airway_compromise") &&
    (tx.airway.igel !== undefined || tx.airway.rsi !== undefined)
  ) {
    flags.delete("airway_compromise");
  }
  // Haemorrhage control clears major_haemorrhage.
  if (
    flags.has("major_haemorrhage") &&
    (tx.packaging.tourniquet !== undefined ||
      tx.packaging.wound_pack !== undefined ||
      tx.packaging.pelvic_binder !== undefined)
  ) {
    flags.delete("major_haemorrhage");
  }
  // Adrenaline IM breaks anaphylaxis.
  if (flags.has("anaphylaxis") && tx.drugs.adrenaline_im_anaphylaxis !== undefined) {
    flags.delete("anaphylaxis");
  }
  // Bronchodilator breaks severe asthma.
  if (flags.has("severe_asthma") && tx.drugs.salbutamol_neb !== undefined) {
    flags.delete("severe_asthma");
  }
  // Glucose corrects hypoglycaemia.
  if (
    flags.has("hypoglycaemia") &&
    (tx.drugs.glucagon_im !== undefined || tx.drugs.dextrose_iv !== undefined)
  ) {
    flags.delete("hypoglycaemia");
  }
  // Midazolam terminates active seizure.
  if (flags.has("seizure_active") && tx.drugs.midazolam_im !== undefined) {
    flags.delete("seizure_active");
  }
  // Naloxone reverses opioid OD.
  if (flags.has("overdose_opioid") && tx.drugs.naloxone !== undefined) {
    flags.delete("overdose_opioid");
  }

  // ----- Active red-flag degradation (per-second rates) -----------------
  // Each branch computes the signed per-second delta contribution from
  // this flag, honouring partial mitigation (e.g. CPR holds SpO2 while
  // cardiac_arrest is still active; oxygen slows airway_compromise decay).
  let dRR = 0;
  let dSpO2 = 0;
  let dHR = 0;
  let dBPs = 0;
  let dBPd = 0;
  let dGCS = 0;
  let dBM = 0;

  const onOxygen = tx.breathing.oxygen_15l !== undefined || tx.breathing.bvm !== undefined;
  const onFluidsOrBlood =
    tx.circulation.fluids_250 !== undefined ||
    tx.circulation.fluids_500 !== undefined ||
    tx.drugs.blood_prbc !== undefined ||
    tx.drugs.blood_plasma !== undefined;
  const onTxA = tx.drugs.tXA_iv !== undefined;
  const onCPR = tx.circulation.cpr !== undefined;

  if (flags.has("cardiac_arrest")) {
    // The floor the patient is held at is a function of how good the
    // compressions actually are, not merely whether someone is doing
    // them. A fresh compressor or a LUCAS perfuses; someone five minutes
    // in does not, and the numbers say so — which is the whole reason the
    // guidance says swap every two minutes. cprQuality is published by
    // the resus tick; the plain onCPR flag is the fallback for a patient
    // being compressed without an arrest board open.
    const q = tx.cprQuality ?? (onCPR ? 0.85 : 0);
    if (q > 0.05) {
      // Perfusion scales with quality: excellent CPR holds SpO2 around
      // 75 and a palpable pressure, failing CPR barely holds anything.
      //
      // The rates are deliberately brisk. Compressions take effect over a
      // handful of beats, and an operator watching the monitor needs to
      // SEE their decision land — at the old rates the saturation moved a
      // point every twelve seconds, which reads as a frozen display.
      dSpO2 += driftRate(v.spo2, 58 + q * 22, 0.35);
      dBPs += driftRate(v.bpSys, 45 + q * 25, 0.55);
      dBPd += driftRate(v.bpDia, 24 + q * 12, 0.3);
      dHR += driftRate(v.hr, 0, 0.2); // compressions don't generate intrinsic rhythm
      dGCS += driftRate(v.gcs, 3, 0.2);
      // Ventilations are being delivered with the compressions.
      dRR += driftRate(v.rr, tx.airway?.igel || tx.airway?.rsi ? 10 : 8, 0.25);
    } else {
      dSpO2 -= 2.0;
      dBPs -= 1.5;
      dBPd -= 1.0;
      dHR -= 1.0;
      dGCS -= 0.5;
    }
  }
  if (flags.has("airway_compromise")) {
    dSpO2 -= onOxygen ? 0.2 : 0.6;
    dRR -= 0.1;
    dGCS -= 0.02;
  }
  if (flags.has("tension_pneumothorax")) {
    dSpO2 -= 0.25;
    dBPs -= 0.4;
    dHR += 0.3;
    dRR += 0.2;
  }
  if (flags.has("hypovolaemic_shock")) {
    const mult = onFluidsOrBlood ? 0.3 : 1;
    dBPs -= 0.35 * mult;
    dBPd -= 0.2 * mult;
    dHR += 0.25 * mult;
  }
  if (flags.has("major_haemorrhage")) {
    const mult = onTxA ? 0.4 : 1;
    dBPs -= 0.5 * mult;
    dHR += 0.3 * mult;
    dSpO2 -= 0.05 * mult;
  }
  if (flags.has("severe_asthma")) {
    dSpO2 -= onOxygen ? 0.1 : 0.3;
    dRR += 0.05;
    dHR += 0.1;
  }
  if (flags.has("anaphylaxis")) {
    dBPs -= 0.6;
    dHR += 0.3;
    dSpO2 -= 0.15;
  }
  if (flags.has("hypoglycaemia")) {
    dBM -= 0.008; // mmol/L per second
    dGCS -= 0.02;
  }
  if (flags.has("seizure_active")) {
    dHR += 0.1;
    dSpO2 -= 0.1;
    dGCS = driftRate(v.gcs, 6, 0.1);
  }
  if (flags.has("head_injury_severe")) {
    dGCS -= 0.03;
    dBPs += 0.05; // Cushing's response
    dHR -= 0.05;
  }
  if (flags.has("overdose_opioid")) {
    dRR -= 0.1;
    dSpO2 -= onOxygen ? 0.1 : 0.4;
    dGCS -= 0.05;
  }
  if (flags.has("stemi")) {
    // STEMI is a destination decision — vitals only drift slightly unless
    // arrest supervenes. We nudge HR up if unrelieved.
    const relieved = tx.drugs.gtn_spray !== undefined || tx.drugs.aspirin_300 !== undefined;
    if (!relieved) {
      dHR += 0.1;
      dBPs -= 0.1;
    }
  }

  // ----- Interventions that RECOVER vitals (no flag required) -----------
  // Oxygen. The saturation is drawn toward whatever the chosen device and
  // flow can actually hold it at — in BOTH directions, which is what makes
  // titrating down a real action rather than a suggestion. Pathology still
  // drags it the other way through the flag deltas above, so a hypoxic
  // patient on a non-rebreathe settles wherever those two balance.
  if (tx.oxygen && tx.oxygen.device !== "none") {
    const target = spo2TargetFor(tx.oxygen.device, tx.oxygen.flowLpm);
    dSpO2 += driftRate(v.spo2, target, v.spo2 < target ? 0.4 : 0.18);
  } else if (onOxygen && v.spo2 < 97) {
    // Legacy path: the old single oxygen action, before delivery was
    // chosen explicitly.
    dSpO2 += driftRate(v.spo2, 97, 0.4);
  } else if (!tx.oxygen && v.spo2 > 99) {
    // Nobody is on 100% breathing room air for long.
    dSpO2 += driftRate(v.spo2, 98, 0.1);
  }
  // Fluids without an active shock flag — small BP bump while running in.
  if (onFluidsOrBlood && v.bpSys < 100 && !flags.has("cardiac_arrest")) {
    dBPs += driftRate(v.bpSys, 100, 0.15);
  }
  // Glucose correction — BM drifts back toward 5.5 once glucose given.
  if (
    v.bm < 4 &&
    (tx.drugs.glucagon_im !== undefined || tx.drugs.dextrose_iv !== undefined)
  ) {
    dBM += driftRate(v.bm, 5.5, 0.05);
  }

  // A patient who is NOT in arrest must not be left reading as pulseless.
  // Nothing in this engine previously drove a heart rate or a conscious
  // level back up, so once an arrest had flattened them they stayed
  // flattened even after ROSC. These are gentle floors, not a cure: the
  // active flags above still pull the other way, so a patient who is
  // still bleeding or hypoxic will not quietly recover on their own.
  if (!flags.has("cardiac_arrest")) {
    if (v.hr < 50) dHR += driftRate(v.hr, 92, 0.5);
    if (v.bpSys < 90) dBPs += driftRate(v.bpSys, 96, 0.35);
    if (v.bpDia < 55) dBPd += driftRate(v.bpDia, 60, 0.2);
    if (v.rr < 8) dRR += driftRate(v.rr, 12, 0.12);
    // Consciousness comes back slowly, and only once there is a pressure
    // to perfuse the brain with.
    if (v.gcs < 14 && v.bpSys > 85 && v.spo2 > 90) {
      dGCS += driftRate(v.gcs, 14, 0.02);
    }
  }

  // ----- Adverse effects -------------------------------------------------
  // Drugs are not free. Each of these is a real, documented effect that a
  // crew would see on the monitor, and each has a window — give a drug and
  // it works on the patient for a while, then fades. Modelled only OUTSIDE
  // arrest: while the heart is stopped there is no circulation to carry
  // them, which is itself why arrest drugs are pushed with a flush.
  if (!flags.has("cardiac_arrest")) {
    const within = (at: number | undefined, sec: number) =>
      at !== undefined && nowMs - at < sec * 1000;

    // Adrenaline. Post-ROSC it drives the heart hard — tachycardia and a
    // pressure overshoot that pushes myocardial oxygen demand up at
    // exactly the wrong moment.
    if (within(tx.drugs.adrenaline_cpr, 240)) {
      dHR += driftRate(v.hr, 130, 0.25);
      dBPs += driftRate(v.bpSys, 165, 0.4);
      dBPd += driftRate(v.bpDia, 95, 0.2);
    }
    // Adrenaline IM for anaphylaxis — same story, smaller.
    if (within(tx.drugs.adrenaline_im_anaphylaxis, 300)) {
      dHR += driftRate(v.hr, 115, 0.12);
    }
    // Amiodarone. Its headline adverse effects are hypotension and
    // bradycardia, which is why it goes in slowly.
    if (within(tx.drugs.amiodarone, 420)) {
      dBPs += driftRate(v.bpSys, 88, 0.25);
      dBPd += driftRate(v.bpDia, 52, 0.15);
      dHR += driftRate(v.hr, 58, 0.1);
    }
    // Naloxone reverses the opiate — and with it the analgesia. The
    // patient wakes agitated and their respiratory rate overshoots.
    if (within(tx.drugs.naloxone, 300)) {
      dRR += driftRate(v.rr, 26, 0.1);
      dHR += driftRate(v.hr, 110, 0.15);
    }
    // Opiates and sedation the other way — respiratory depression.
    if (within(tx.drugs.morphine, 600) || within(tx.drugs.fentanyl, 420)) {
      dRR += driftRate(v.rr, 9, 0.05);
      if (!onOxygen) dSpO2 += driftRate(v.spo2, 92, 0.06);
    }
    if (within(tx.drugs.midazolam_im, 600)) {
      dRR += driftRate(v.rr, 10, 0.05);
      dGCS += driftRate(v.gcs, 10, 0.03);
    }
    // Ketamine at RSI dose and propofol drop the pressure; metaraminol
    // and noradrenaline are given precisely to put it back.
    if (within(tx.drugs.propofol, 420)) {
      dBPs += driftRate(v.bpSys, 85, 0.3);
    }
    if (within(tx.drugs.metaraminol, 420) || within(tx.drugs.noradrenaline, 600)) {
      dBPs += driftRate(v.bpSys, 110, 0.35);
      dBPd += driftRate(v.bpDia, 70, 0.2);
    }
    // GTN drops preload — the reason you check a pressure before giving it.
    if (within(tx.drugs.gtn_spray, 420)) {
      dBPs += driftRate(v.bpSys, 100, 0.2);
    }
    // Salbutamol — the tachycardia and tremor every asthmatic knows.
    if (within(tx.drugs.salbutamol_neb, 420)) {
      dHR += driftRate(v.hr, 118, 0.12);
    }
  }

  const prev = v;
  v = apply(v, {
    rr: dRR * dt,
    spo2: dSpO2 * dt,
    hr: dHR * dt,
    bpSys: dBPs * dt,
    bpDia: dBPd * dt,
    gcs: dGCS * dt,
    bm: dBM * dt,
  });

  // The trend baseline is deliberately NOT the previous tick. The tick is
  // fast so the numbers move smoothly, but a trend arrow drawn against
  // half a second ago would be noise — it needs a few seconds of distance
  // to mean anything. So the baseline only rolls forward every
  // TREND_BASELINE_SEC, and the arrows compare against that.
  const baselineAge = nowMs - (tx.prevLiveVitalsAt ?? 0);
  const rollBaseline = baselineAge >= TREND_BASELINE_SEC * 1000;

  return {
    ...tx,
    liveVitals: v,
    prevLiveVitals: rollBaseline ? prev : (tx.prevLiveVitals ?? prev),
    prevLiveVitalsAt: rollBaseline ? nowMs : (tx.prevLiveVitalsAt ?? nowMs),
    liveVitalsLastTickAt: nowMs,
    activeRedFlags: Array.from(flags),
  };
}

/** Returns a per-second signed rate that drifts `current` toward
 *  `target` by at most `step`. Used to model "intervention holds vitals
 *  at a lower equilibrium" without oscillation. */
function driftRate(current: number, target: number, step: number): number {
  if (current === target) return 0;
  return current < target ? step : -step;
}
