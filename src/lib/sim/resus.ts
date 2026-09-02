// Resuscitation — the ALS loop, modelled.
//
// Spec is Resuscitation Council UK Guidelines 2025 (27 Oct 2025) and
// JRCALC; the full reference lives in
// data/research/ambulance/cardiac_arrest_jrcalc.md. Numbers here are UK
// numbers: energies in joules biphasic, end-tidal CO2 in kPa (a UK
// monitor never shows mmHg, and a paramedic says "his end-tidal's two
// point one").
//
// The shape of the thing: a working arrest runs on two-minute cycles.
// Rhythm check, shock or no shock, two minutes of compressions, rhythm
// check again. Everything the operator does hangs off that clock —
// adrenaline every 3-5 minutes, amiodarone at the third and fifth shock,
// swapping the compressor before they tire. This file owns the clock and
// the consequences; the panel just draws it.

import type { CrewMember } from "./types";

/** Underlying rhythm. Not visible to the operator until a monitor is on
 *  the patient — you cannot know VF from asystole by looking. */
export type ArrestRhythm = "vf" | "pvt" | "pea" | "asystole";

export const SHOCKABLE: ArrestRhythm[] = ["vf", "pvt"];
export function isShockable(r: ArrestRhythm): boolean {
  return r === "vf" || r === "pvt";
}

export const RHYTHM_LABEL: Record<ArrestRhythm, string> = {
  vf: "VF — ventricular fibrillation",
  pvt: "Pulseless VT",
  pea: "PEA — pulseless electrical activity",
  asystole: "Asystole",
};

/** What is physically attached to the patient. Each step reveals more:
 *  pads give a rhythm at the rhythm check, 3-lead gives a continuous
 *  trace, 12-lead is post-ROSC and drives the PPCI decision. */
export type MonitorMode = "none" | "pads" | "lead_3" | "lead_12";

export const MONITOR_LABEL: Record<MonitorMode, string> = {
  none: "Not monitored",
  pads: "Defib pads",
  lead_3: "3-lead ECG",
  lead_12: "12-lead ECG",
};

export type AirwayState = "none" | "igel" | "ett";

/** The 4 Hs and 4 Ts. */
export type ReversibleCause =
  | "hypoxia"
  | "hypovolaemia"
  | "hypokalaemia"
  | "hypothermia"
  | "thrombosis"
  | "tension_pneumothorax"
  | "tamponade"
  | "toxins";

export const REVERSIBLE_LABEL: Record<ReversibleCause, string> = {
  hypoxia: "Hypoxia",
  hypovolaemia: "Hypovolaemia",
  hypokalaemia: "Hypo / hyperkalaemia & metabolic",
  hypothermia: "Hypothermia",
  thrombosis: "Thrombosis (coronary or pulmonary)",
  tension_pneumothorax: "Tension pneumothorax",
  tamponade: "Cardiac tamponade",
  toxins: "Toxins",
};

/** What actually reverses each cause, and the lowest clinical tier that
 *  can deliver it. This is where sending the right resource pays off: a
 *  DCA crew can give oxygen and fluids, but a tamponade needs a doctor. */
export const REVERSIBLE_TREATMENT: Record<
  ReversibleCause,
  { action: string; minScope: "dca" | "ap" | "ccc" | "hems"; hint: string }
> = {
  hypoxia: {
    action: "Secure the airway, ventilate with high-flow oxygen",
    minScope: "dca",
    hint: "Commonest and most correctable. Confirm the airway is patent and the chest is rising.",
  },
  hypovolaemia: {
    action: "IV/IO fluids; control haemorrhage",
    minScope: "dca",
    hint: "Bleeding until proven otherwise in trauma. Fluids buy time; blood and surgery fix it.",
  },
  hypokalaemia: {
    action: "Calcium chloride IV",
    minScope: "ap",
    hint: "Suspect in renal patients and crush injury. Calcium protects the myocardium.",
  },
  hypothermia: {
    action: "Rewarm; modified algorithm — withhold drugs below 30 °C",
    minScope: "dca",
    hint: "Nobody is dead until they are warm and dead. Drug intervals double between 30 and 35 °C.",
  },
  thrombosis: {
    action: "Consider PPCI; prolonged CPR and transport with mechanical compressions",
    minScope: "dca",
    hint: "The commonest cause in an adult arrest. A LUCAS makes CPR during transport possible.",
  },
  tension_pneumothorax: {
    action: "Needle decompression, then finger thoracostomy",
    minScope: "dca",
    hint: "Needle first at DCA level; a thoracostomy is the definitive fix and needs a critical care team.",
  },
  tamponade: {
    action: "Resuscitative thoracotomy",
    minScope: "hems",
    hint: "Penetrating chest trauma with a short downtime. Doctor only, and only in a narrow window.",
  },
  toxins: {
    action: "Antidote — naloxone for opioids",
    minScope: "dca",
    hint: "History is everything. Prolonged CPR is justified while the toxin is metabolised.",
  },
};

export type ResusEvent = {
  at: number;
  text: string;
  tone: "info" | "action" | "critical" | "good";
};

export type ResusState = {
  casualtyId: string;
  /** Epoch ms resus started — the downtime clock. */
  startedAt: number;
  rhythm: ArrestRhythm;
  monitor: MonitorMode;
  capnographyOn: boolean;
  airway: AirwayState;
  /** Completed 2-minute cycles. */
  cycle: number;
  cycleStartedAt: number;
  shocks: number;
  lastShockAt?: number;
  /** Rhythm analysis in progress — the monitor is looking at the trace
   *  with hands OFF the chest. Set when a cycle ends, cleared when the
   *  result comes back. */
  analysingSince?: number;
  /** How long this particular analysis takes, seconds. */
  analyseSec?: number;
  adrenalineDoses: number;
  lastAdrenalineAt?: number;
  amiodaroneDoses: number;
  /** Whoever is on the chest right now. */
  compressorCrewId?: string;
  compressorName?: string;
  compressorSinceAt?: number;
  lucasFittedAt?: number;
  padPosition: "antero_lateral" | "antero_posterior";
  /** End-tidal CO2 in kPa. */
  etco2: number;
  roscAt?: number;
  /** How many times this patient has come back and arrested again. */
  reArrests: number;
  /** Last time the post-ROSC re-arrest roll was made. */
  lastPostRoscCheckAt?: number;
  /** Resus stopped without ROSC — recognition of life extinct. */
  roleAt?: number;
  reversibles: Partial<Record<ReversibleCause, "suspected" | "treated">>;
  events: ResusEvent[];
};

// --- Constants, all from RCUK 2025 ---------------------------------------

/** One ALS cycle. */
export const CYCLE_SEC = 120;
/** Adrenaline repeat window — every 3-5 min, i.e. alternate cycles. */
export const ADRENALINE_MIN_SEC = 180;
export const ADRENALINE_MAX_SEC = 300;
/** Compressor fatigue sets in from two minutes; this is why crews swap. */
export const COMPRESSOR_FRESH_SEC = 120;
export const COMPRESSOR_SPENT_SEC = 300;
/** A rhythm check is not instant. The monitor has to look at a clean
 *  trace with nobody touching the patient, which is the whole reason the
 *  pause matters — and the reason a shock decision costs you compressions. */
export const ANALYSE_MIN_SEC = 7;
export const ANALYSE_MAX_SEC = 10;

/** Fitting a LUCAS costs a short pause in compressions. */
export const LUCAS_FIT_SEC = 20;
/** Physiology-guided CPR target. */
export const ETCO2_TARGET_KPA = 3.3;
/** Below this, ROSC is very unlikely — the strongest negative marker. */
export const ETCO2_FUTILE_KPA = 1.33;

/** True while the monitor is analysing. Compressions are off the chest. */
export function isAnalysing(s: ResusState, now: number): boolean {
  if (s.analysingSince === undefined) return false;
  return now < s.analysingSince + (s.analyseSec ?? ANALYSE_MIN_SEC) * 1000;
}

/** Seconds left on the analysis. */
export function analyseRemaining(s: ResusState, now: number): number {
  if (s.analysingSince === undefined) return 0;
  return Math.max(0, (s.analysingSince + (s.analyseSec ?? ANALYSE_MIN_SEC) * 1000 - now) / 1000);
}

export function firstShockJoules(): number {
  // RCUK 2025: at least 150 J for rectilinear or truncated exponential
  // biphasic. Escalate thereafter.
  return 150;
}

export function shockJoules(shockNumber: number): number {
  return Math.min(360, 150 + Math.max(0, shockNumber - 1) * 50);
}

// --- Compression quality --------------------------------------------------

/**
 * How good the compressions are right now, 0-1.
 *
 * A LUCAS holds quality flat — that is the entire clinical argument for
 * it. A human decays: fine for the first two minutes, visibly failing by
 * five, which is exactly why the guidance says swap every cycle.
 */
export function compressionQuality(s: ResusState, now: number): number {
  // Hands off during a rhythm check — that is what a rhythm check IS.
  // The end-tidal sags while it happens, which is the honest cost of a
  // long analysis and the reason the guidance wants the pause short.
  if (isAnalysing(s, now)) return 0;
  if (s.lucasFittedAt !== undefined && now >= s.lucasFittedAt + LUCAS_FIT_SEC * 1000) {
    return 1;
  }
  if (s.compressorCrewId === undefined || s.compressorSinceAt === undefined) return 0;
  const onChestSec = (now - s.compressorSinceAt) / 1000;
  if (onChestSec <= COMPRESSOR_FRESH_SEC) return 1;
  const spent =
    (onChestSec - COMPRESSOR_FRESH_SEC) / (COMPRESSOR_SPENT_SEC - COMPRESSOR_FRESH_SEC);
  return Math.max(0.35, 1 - spent * 0.65);
}

/** ETCO2 follows compression quality — it is the operator's window onto
 *  how good the CPR actually is. Perfusing well sits around the target;
 *  a tiring compressor drags it toward the futile end. */
export function expectedEtco2(s: ResusState, now: number): number {
  if (s.roscAt !== undefined) {
    // With an advanced airway the crew can actually ventilate to a
    // target; bagging a face mask post-arrest tends to under-ventilate.
    return s.airway === "none" ? 6.8 : 5.3;
  }
  const q = compressionQuality(s, now);
  if (q === 0) return 0.6; // nobody on the chest
  const base = 1.0 + q * 2.9;
  // An advanced airway improves the seal, so the reading is truer.
  return s.airway === "none" ? base * 0.85 : base;
}

// --- The loop -------------------------------------------------------------

export function newResusState(casualtyId: string, at: number, rhythm: ArrestRhythm): ResusState {
  return {
    casualtyId,
    startedAt: at,
    rhythm,
    monitor: "none",
    capnographyOn: false,
    airway: "none",
    cycle: 0,
    cycleStartedAt: at,
    shocks: 0,
    adrenalineDoses: 0,
    amiodaroneDoses: 0,
    padPosition: "antero_lateral",
    etco2: 0.6,
    reArrests: 0,
    reversibles: {},
    events: [{ at, text: "Resuscitation commenced", tone: "critical" }],
  };
}

export function secondsIntoCycle(s: ResusState, now: number): number {
  return Math.max(0, (now - s.cycleStartedAt) / 1000);
}

export function secondsToRhythmCheck(s: ResusState, now: number): number {
  return Math.max(0, CYCLE_SEC - secondsIntoCycle(s, now));
}

export function downtimeSec(s: ResusState, now: number): number {
  return Math.max(0, ((s.roscAt ?? s.roleAt ?? now) - s.startedAt) / 1000);
}

/** Adrenaline is due when none has been given (non-shockable: as soon as
 *  access allows; shockable: after the third shock) or when the repeat
 *  window has elapsed. */
export function adrenalineDue(s: ResusState, now: number): boolean {
  if (s.roscAt !== undefined) return false;
  if (s.adrenalineDoses === 0) {
    return isShockable(s.rhythm) ? s.shocks >= 3 : true;
  }
  return now - (s.lastAdrenalineAt ?? 0) >= ADRENALINE_MIN_SEC * 1000;
}

/** Amiodarone: 300 mg after 3 shocks, 150 mg after 5. Shockable only. */
export function amiodaroneDue(s: ResusState): boolean {
  if (s.roscAt !== undefined || !isShockable(s.rhythm)) return false;
  if (s.amiodaroneDoses === 0) return s.shocks >= 3;
  if (s.amiodaroneDoses === 1) return s.shocks >= 5;
  return false;
}

export function amiodaroneDoseMg(s: ResusState): number {
  return s.amiodaroneDoses === 0 ? 300 : 150;
}

/** Still in VF after three shocks — RCUK 2025 says prepare a fresh set of
 *  pads in the anterior-posterior position at the next rhythm check. */
export function refractoryVf(s: ResusState): boolean {
  return (
    isShockable(s.rhythm) &&
    s.shocks >= 3 &&
    s.padPosition === "antero_lateral" &&
    s.roscAt === undefined
  );
}

/**
 * Chance of ROSC at this rhythm check, 0-1.
 *
 * Skill-weighted, as agreed: the dice colour the story but the operator
 * drives the outcome. What moves it is what moves it in real life —
 * compressions that are actually working, a shock delivered early for a
 * shockable rhythm, drugs on time, and a reversible cause found and
 * treated. Shockable rhythms carry a far better prognosis than asystole,
 * and every minute of downtime costs.
 */
export function roscChance(s: ResusState, now: number): number {
  if (s.roscAt !== undefined || s.roleAt !== undefined) return 0;
  const q = compressionQuality(s, now);
  if (q === 0) return 0; // nobody compressing — nothing is happening

  let p = isShockable(s.rhythm) ? 0.16 : 0.04;

  // Compression quality is the single biggest lever.
  p *= 0.35 + q * 0.9;

  // A shockable rhythm that has actually been shocked.
  if (isShockable(s.rhythm)) {
    if (s.shocks === 0) p *= 0.25;
    else p *= 1 + Math.min(0.5, s.shocks * 0.12);
    if (refractoryVf(s)) p *= 0.7; // three failed shocks in the same position
  }

  // Drugs, on time.
  if (s.adrenalineDoses > 0) p *= 1.25;
  if (adrenalineDue(s, now)) p *= 0.8; // overdue
  if (isShockable(s.rhythm) && s.amiodaroneDoses > 0) p *= 1.2;

  // An advanced airway and capnography mean the resus is being run well.
  if (s.airway !== "none") p *= 1.1;

  // Reversible causes: finding and treating one is the whole game in a
  // non-shockable arrest.
  for (const state of Object.values(s.reversibles)) {
    if (state === "treated") p *= 1.6;
  }

  // Downtime. Roughly 10% of survival per minute, floored so a long
  // well-run resus is never quite hopeless.
  const mins = downtimeSec(s, now) / 60;
  p *= Math.max(0.12, Math.pow(0.9, mins));

  return Math.max(0, Math.min(0.85, p));
}

/** What the rhythm becomes after a shock that does not achieve ROSC.
 *  VF commonly degenerates toward asystole as downtime grows. */
export function rhythmAfterFailedShock(
  s: ResusState,
  now: number,
  roll: number,
): ArrestRhythm {
  const mins = downtimeSec(s, now) / 60;
  const degenerate = Math.min(0.5, 0.06 * mins);
  if (roll < degenerate) return "asystole";
  return s.rhythm;
}

// --- Post-ROSC ------------------------------------------------------------

/**
 * Post-ROSC targets, RCUK 2025. Getting a pulse back is the middle of the
 * job, not the end: over-oxygenating and over-ventilating a freshly
 * arrested brain both do harm, and the pressure has to be held up.
 */
export const POST_ROSC = {
  spo2Min: 94,
  spo2Max: 98,
  etco2MinKpa: 4.7,
  etco2MaxKpa: 6.0,
  bpSysMin: 100,
} as const;

export type PostRoscIssue = {
  key: "hypoxia" | "hyperoxia" | "hypocapnia" | "hypercapnia" | "hypotension";
  text: string;
  fix: string;
};

/** What is currently wrong with the post-ROSC patient, in the order a
 *  crew would care about it. Empty means they are being managed well. */
export function postRoscIssues(
  s: ResusState,
  vitals: { spo2: number; bpSys: number } | undefined,
): PostRoscIssue[] {
  if (s.roscAt === undefined) return [];
  const out: PostRoscIssue[] = [];
  if (vitals) {
    if (vitals.spo2 < POST_ROSC.spo2Min)
      out.push({
        key: "hypoxia",
        text: `SpO₂ ${Math.round(vitals.spo2)}% — below ${POST_ROSC.spo2Min}%`,
        fix: "Increase oxygen and ventilate",
      });
    else if (vitals.spo2 > POST_ROSC.spo2Max)
      out.push({
        key: "hyperoxia",
        text: `SpO₂ ${Math.round(vitals.spo2)}% — above ${POST_ROSC.spo2Max}%`,
        fix: "Titrate the oxygen DOWN — hyperoxia harms the brain after an arrest",
      });
    if (vitals.bpSys < POST_ROSC.bpSysMin)
      out.push({
        key: "hypotension",
        text: `Systolic ${Math.round(vitals.bpSys)} — below ${POST_ROSC.bpSysMin}`,
        fix: "Fluids, and a vasopressor if it will not come up",
      });
  }
  if (s.capnographyOn) {
    if (s.etco2 < POST_ROSC.etco2MinKpa)
      out.push({
        key: "hypocapnia",
        text: `End-tidal ${s.etco2.toFixed(1)} kPa — over-ventilating`,
        fix: "Slow the ventilation rate — hypocapnia constricts cerebral vessels",
      });
    else if (s.etco2 > POST_ROSC.etco2MaxKpa)
      out.push({
        key: "hypercapnia",
        text: `End-tidal ${s.etco2.toFixed(1)} kPa — under-ventilating`,
        fix: "Increase the ventilation rate",
      });
  }
  return out;
}

/**
 * Per-minute chance this patient re-arrests.
 *
 * Real ROSC is fragile — re-arrest is common, and it is commonest in the
 * patients who were managed worst. A long downtime, an untreated
 * reversible cause and post-ROSC targets being missed all push it up; a
 * short arrest, an advanced airway and a treated cause pull it down.
 */
export function reArrestChancePerMin(
  s: ResusState,
  now: number,
  issues: PostRoscIssue[],
): number {
  if (s.roscAt === undefined || s.roleAt !== undefined) return 0;
  const arrestMin = (s.roscAt - s.startedAt) / 60000;
  // Calibrated so that roughly a third of patients re-arrest across a
  // typical transport rather than within a minute or two: a well-managed
  // short arrest sits near 1-2% per minute, a long badly-managed one
  // nearer 6-8%, which over a 20-minute run is most of them.
  let p = 0.006 + Math.min(0.024, arrestMin * 0.0018);
  // Every unmanaged post-ROSC problem makes it worse.
  p *= 1 + issues.length * 0.35;
  // A reversible cause actually treated is the strongest protection.
  if (Object.values(s.reversibles).some((r) => r === "treated")) p *= 0.55;
  if (s.airway !== "none") p *= 0.85;
  // The first few minutes after ROSC are the most dangerous.
  const sinceRosc = (now - s.roscAt) / 60000;
  if (sinceRosc < 5) p *= 1.5;
  return Math.max(0, Math.min(0.15, p));
}

/** Human-readable read on the capnography trace — what a crew would
 *  actually say out loud about the number. */
export function etco2Comment(kpa: number, hasRosc: boolean): {
  text: string;
  tone: "good" | "warn" | "bad";
} {
  if (hasRosc) return { text: "Perfusing — output restored", tone: "good" };
  if (kpa < ETCO2_FUTILE_KPA)
    return { text: "Very low — poor prognosis, check compressions", tone: "bad" };
  if (kpa < ETCO2_TARGET_KPA)
    return { text: "Below target — press harder, swap the compressor", tone: "warn" };
  return { text: "On target — compressions are perfusing", tone: "good" };
}

/** Crew who could take a turn on the chest, best first. Anyone can do
 *  compressions — that is the point of them — so this is every rider on
 *  every clinical resource with the patient. */
export function compressorCandidates(
  crews: { callsign: string; members: CrewMember[] }[],
): { id: string; name: string; role: string; callsign: string }[] {
  const out: { id: string; name: string; role: string; callsign: string }[] = [];
  for (const c of crews) {
    for (const m of c.members) {
      out.push({ id: m.id, name: m.name, role: m.role, callsign: c.callsign });
    }
  }
  return out;
}
