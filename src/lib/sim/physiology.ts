/**
 * Patient physiology — the engine behind every number on the monitor.
 *
 * The old model gave each red flag a fixed per-second delta and let an
 * intervention delete the flag. This one keeps a small hidden state for
 * the patient — how much blood volume they have, how open the airway is,
 * how tight the chest is, how much opioid is on board — and derives the
 * target vitals from that state on every tick. Interventions and drugs
 * act on the STATE with an onset, a peak and a wear-off, so the numbers
 * follow the way a real patient does: fluids take minutes, adrenaline
 * takes seconds, naloxone wears off before the heroin does.
 *
 * Wrong decisions have their own effects. An oropharyngeal airway in a
 * patient who still has a gag reflex makes them vomit. High-flow oxygen
 * in a CO₂ retainer slows their breathing and clouds them. Fluids that
 * push a bleeding patient's pressure up pop the clot. Aspirin in a
 * patient who told you they cannot take it puts them in anaphylaxis.
 *
 * Pure functions throughout: the dashboard calls advancePhysiology on a
 * timer and canGiveDrug from the medication card. Nothing here touches
 * React or the clock.
 */

import type { PatientClinical, PatientRedFlag, SceneCasualty } from "./scene";
import type { DrugName, PatientTreatmentState, TreatmentEvent } from "./incident_types";
import { fiO2For } from "./oxygen";

type Vitals = PatientClinical["vitals"];

// ---------------------------------------------------------------------------
// Patient profile — who the person is
// ---------------------------------------------------------------------------

export type AllergyReaction = "anaphylaxis" | "angio_oedema" | "rash";

export type PatientAllergy = {
  /** What the patient says — "Penicillin", "NSAIDs / aspirin", "Nuts". */
  agent: string;
  /** Drugs on the formulary that trigger it. Empty for things we do not carry. */
  drugs: DrugName[];
  reaction: AllergyReaction;
};

export type PatientProfile = {
  ageYears: number;
  sex: "male" | "female";
  weightKg: number;
  allergies: PatientAllergy[];
  /** Past medical history, in the words a crew would write it. */
  history: string[];
  /** Regular medications. */
  medications: string[];
  /** CO₂ retainer — the saturation target is 88-92 % and high-flow
   *  oxygen slows their breathing. */
  copdRisk: boolean;
  /** On an anticoagulant — bleeds harder, for longer. */
  anticoagulated: boolean;
  /** On a beta-blocker — the tachycardia that would have warned you of
   *  shock is blunted. */
  betaBlocked: boolean;
  /** Regular opioid use — naloxone wakes them fighting, and the overdose
   *  outlasts the antidote. */
  opioidTolerant: boolean;
  /** Alcohol dependence or prolonged fasting — no glycogen for glucagon
   *  to work on. */
  glycogenDepleted: boolean;
  /** Third trimester — left lateral tilt, aortocaval compression. */
  pregnant: boolean;
  /** Clinical frailty scale 1-9. */
  frailty: number;
  /** What they were doing / what led up to it — the E of SAMPLE. */
  eventsLeadingUp: string;
};

/** Small deterministic PRNG so a casualty is the same person every time
 *  the same scenario runs. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Age and sex from the authored label — "Male, 58 — chest pain",
 *  "Child (5) — back bedroom", "Female, late twenties". */
function parseLabel(label: string | undefined, rnd: () => number): { age?: number; sex?: "male" | "female"; child: boolean } {
  if (!label) return { child: false };
  const l = label.toLowerCase();
  const sex = /\bfemale\b|\bwoman\b|\bgirl\b|\bmother\b|\bwife\b/.test(l) ? "female" : /\bmale\b|\bman\b|\bboy\b|\bfather\b|\bhusband\b/.test(l) ? "male" : undefined;
  const child = /\bchild\b|\bboy\b|\bgirl\b|\binfant\b|\btoddler\b/.test(l);
  const num = l.match(/\((\d{1,2})\)|,\s*(\d{1,2})\b|\b(\d{1,2})\s*(?:yrs|years|y\/o|yo)\b/);
  if (num) {
    const age = Number(num[1] ?? num[2] ?? num[3]);
    if (age > 0 && age < 100) return { age, sex, child: child || age <= 15 };
  }
  const decade = l.match(/\b(teens|twenties|thirties|forties|fifties|sixties|seventies|eighties)\b|\b(\d)0s\b/);
  if (decade) {
    const base = decade[2] ? Number(decade[2]) * 10 : { teens: 13, twenties: 20, thirties: 30, forties: 40, fifties: 50, sixties: 60, seventies: 70, eighties: 80 }[decade[1]!] ?? 40;
    const span = base === 13 ? 6 : 9;
    return { age: base + Math.floor(rnd() * span), sex, child: base <= 13 };
  }
  if (/\belderly\b|\bpensioner\b/.test(l)) return { age: 74 + Math.floor(rnd() * 16), sex, child: false };
  return { sex, child };
}

/** The person behind the casualty. Seeded on incident + casualty so the
 *  same scenario gives the same patient every run, and authored clinical
 *  detail (age, red flags, condition) shapes the history rather than
 *  contradicting it. */
export function generateProfile(seed: string, casualty: SceneCasualty, clinical: PatientClinical | undefined): PatientProfile {
  const rnd = mulberry32(hashSeed(seed));
  const parsed = parseLabel(casualty.label, rnd);
  const age = clinical?.ageYears ?? parsed.age ?? (parsed.child ? 3 + Math.floor(rnd() * 12) : 22 + Math.floor(rnd() * 58));
  const sex: "male" | "female" = parsed.sex ?? (rnd() < 0.52 ? "male" : "female");
  const flags = new Set<PatientRedFlag>(clinical?.redFlags ?? []);
  const condition = (clinical?.presumedCondition ?? "").toLowerCase();
  const weightKg = age <= 15
    ? Math.round(Math.max(4, (age + 4) * 2 + rnd() * 6))
    : Math.round((sex === "male" ? 78 : 66) + (rnd() - 0.5) * 30);

  const history: string[] = [];
  const medications: string[] = [];
  const allergies: PatientAllergy[] = [];
  let copdRisk = false;
  let anticoagulated = false;
  let betaBlocked = false;
  let opioidTolerant = false;
  let glycogenDepleted = false;
  const pregnant = /pregnan|weeks|second stage|labour/.test(condition + (casualty.label ?? "").toLowerCase()) && sex === "female";

  // Condition-driven history: the presentation is usually the patient's
  // own disease showing itself.
  if (flags.has("stemi")) {
    history.push("Ischaemic heart disease", "Hypertension", "Hypercholesterolaemia");
    medications.push("Atorvastatin 40 mg ON", "Ramipril 5 mg OD");
    if (rnd() < 0.55) { medications.push("Bisoprolol 2.5 mg OD"); betaBlocked = true; }
    if (rnd() < 0.35) { history.push("Type 2 diabetes"); medications.push("Metformin 500 mg BD"); }
    if (rnd() < 0.5) history.push("Smoker");
  }
  if (flags.has("stroke_fast_positive")) {
    history.push("Hypertension");
    medications.push("Amlodipine 5 mg OD");
    if (rnd() < 0.45) { history.push("Atrial fibrillation"); medications.push("Apixaban 5 mg BD"); anticoagulated = true; }
  }
  if (flags.has("severe_asthma")) {
    history.push("Asthma — previous ICU admission");
    medications.push("Salbutamol inhaler PRN", "Beclometasone inhaler BD");
    if (rnd() < 0.3) medications.push("Prednisolone — recent course");
  }
  if (flags.has("anaphylaxis")) {
    const agent = ["Peanuts", "Bee sting", "Penicillin", "Shellfish"][Math.floor(rnd() * 4)];
    history.push(`Known ${agent.toLowerCase()} allergy — carries an adrenaline auto-injector`);
    medications.push("Adrenaline auto-injector 300 µg");
    allergies.push({ agent, drugs: agent === "Penicillin" ? [] : [], reaction: "anaphylaxis" });
  }
  if (flags.has("hypoglycaemia")) {
    history.push("Type 1 diabetes");
    medications.push("Insulin glargine ON", "NovoRapid with meals");
    if (rnd() < 0.3) { history.push("Alcohol excess"); glycogenDepleted = true; }
  }
  if (flags.has("seizure_active")) {
    history.push("Epilepsy");
    medications.push(rnd() < 0.5 ? "Levetiracetam 500 mg BD" : "Sodium valproate 500 mg BD");
  }
  if (flags.has("overdose_opioid")) {
    history.push("Opioid dependence");
    opioidTolerant = rnd() < 0.7;
    if (opioidTolerant) medications.push("Methadone 60 mg OD (script)");
    if (rnd() < 0.4) { history.push("Hepatitis C"); }
  }
  if (/copd|emphysema|chest infection|bronchit/.test(condition) || (age >= 60 && rnd() < 0.18)) {
    history.push("COPD");
    medications.push("Tiotropium inhaler OD", "Salbutamol inhaler PRN");
    copdRisk = true;
  }
  if (/dementia/.test(condition) || (age >= 80 && rnd() < 0.25)) history.push("Dementia");
  if (age >= 65) {
    if (rnd() < 0.35 && !history.includes("Hypertension")) { history.push("Hypertension"); medications.push("Ramipril 5 mg OD"); }
    if (rnd() < 0.18 && !anticoagulated) { history.push("Atrial fibrillation"); medications.push("Apixaban 5 mg BD"); anticoagulated = true; }
    if (rnd() < 0.2 && !betaBlocked) { medications.push("Bisoprolol 5 mg OD"); betaBlocked = true; }
    if (rnd() < 0.2) { history.push("Type 2 diabetes"); medications.push("Metformin 1 g BD"); }
    if (rnd() < 0.15) { history.push("Chronic kidney disease"); }
  } else if (age >= 40) {
    if (rnd() < 0.15) { history.push("Hypertension"); medications.push("Amlodipine 5 mg OD"); }
    if (rnd() < 0.1) { history.push("Type 2 diabetes"); medications.push("Metformin 500 mg BD"); }
  }
  if (age >= 16 && rnd() < 0.15) history.push("Anxiety / depression");
  if (age <= 15 && rnd() < 0.15 && !flags.has("severe_asthma")) { history.push("Asthma — mild"); medications.push("Salbutamol inhaler PRN"); }

  // Drug allergies — the ones that matter to a crew's own formulary.
  if (rnd() < 0.12) allergies.push({ agent: "Penicillin", drugs: [], reaction: rnd() < 0.3 ? "anaphylaxis" : "rash" });
  if (rnd() < 0.05) allergies.push({ agent: "NSAIDs / aspirin", drugs: ["aspirin_300"], reaction: rnd() < 0.5 ? "anaphylaxis" : "angio_oedema" });
  if (rnd() < 0.04) allergies.push({ agent: "Morphine / codeine", drugs: ["morphine"], reaction: rnd() < 0.3 ? "anaphylaxis" : "rash" });
  if (rnd() < 0.02) allergies.push({ agent: "Latex", drugs: [], reaction: "rash" });

  const frailty = age >= 85 ? 5 + Math.floor(rnd() * 3) : age >= 70 ? 3 + Math.floor(rnd() * 3) : age >= 50 ? 2 + Math.floor(rnd() * 2) : 1 + Math.floor(rnd() * 2);
  const eventsLeadingUp = clinical?.presumedCondition ?? (casualty.label ?? "Found at the incident");

  return { ageYears: age, sex, weightKg, allergies, history, medications, copdRisk, anticoagulated, betaBlocked, opioidTolerant, glycogenDepleted, pregnant, frailty, eventsLeadingUp };
}

// ---------------------------------------------------------------------------
// Pharmacology — what each drug is and does
// ---------------------------------------------------------------------------

export type DrugRoute = "IV" | "IM" | "PO" | "SL" | "Neb" | "Inhaled";

export type DrugSpec = {
  route: DrugRoute;
  /** Standard adult dose as drawn up. */
  dose: string;
  /** Seconds to first effect, to peak, and until it has worn off. */
  onsetSec: number;
  peakSec: number;
  durationSec: number;
  /** Doses allowed in one episode and the gap between them. */
  maxDoses: number;
  repeatSec: number;
  /** What a crew gives it for. Informational — the sim does not stop an
   *  operator giving a drug without an indication, it lets the effects
   *  speak. */
  indication: string;
  /** Effects at full activity, applied to the target vitals. */
  effects: Partial<{
    hr: number;
    map: number;
    rr: number;
    gcs: number;
    pain: number;
    bronchospasm: number;
    sedation: number;
    opioid: number;
    vaso: number;
  }>;
};

export const PHARMACOLOGY: Record<DrugName, DrugSpec> = {
  paracetamol: { route: "PO", dose: "1 g", onsetSec: 900, peakSec: 2400, durationSec: 14400, maxDoses: 1, repeatSec: 14400, indication: "Mild to moderate pain, pyrexia", effects: { pain: -2 } },
  entonox: { route: "Inhaled", dose: "50 % self-administered", onsetSec: 30, peakSec: 90, durationSec: 240, maxDoses: 99, repeatSec: 0, indication: "Moderate pain — patient must hold the mask", effects: { pain: -3, sedation: 0.1 } },
  morphine: { route: "IV", dose: "2.5–5 mg titrated", onsetSec: 120, peakSec: 600, durationSec: 3600, maxDoses: 4, repeatSec: 300, indication: "Severe pain", effects: { pain: -4, opioid: 0.2 } },
  aspirin_300: { route: "PO", dose: "300 mg chewed", onsetSec: 600, peakSec: 1800, durationSec: 86400, maxDoses: 1, repeatSec: 86400, indication: "Suspected acute coronary syndrome", effects: {} },
  gtn_spray: { route: "SL", dose: "400 µg", onsetSec: 60, peakSec: 180, durationSec: 480, maxDoses: 3, repeatSec: 300, indication: "Cardiac chest pain with a systolic above 90", effects: { map: -12, pain: -2, hr: 6 } },
  salbutamol_neb: { route: "Neb", dose: "5 mg nebulised", onsetSec: 120, peakSec: 600, durationSec: 2400, maxDoses: 4, repeatSec: 300, indication: "Bronchospasm — asthma, COPD, anaphylaxis wheeze", effects: { bronchospasm: -0.45, hr: 22 } },
  ipratropium_neb: { route: "Neb", dose: "500 µg nebulised", onsetSec: 300, peakSec: 1200, durationSec: 4800, maxDoses: 1, repeatSec: 4800, indication: "Severe bronchospasm alongside salbutamol", effects: { bronchospasm: -0.2 } },
  adrenaline_im_anaphylaxis: { route: "IM", dose: "500 µg", onsetSec: 60, peakSec: 240, durationSec: 900, maxDoses: 4, repeatSec: 300, indication: "Anaphylaxis", effects: { hr: 25, map: 18, bronchospasm: -0.4, vaso: 0.5 } },
  adrenaline_cpr: { route: "IV", dose: "1 mg", onsetSec: 20, peakSec: 90, durationSec: 300, maxDoses: 12, repeatSec: 180, indication: "Cardiac arrest, every 3–5 minutes", effects: { hr: 45, map: 40, vaso: 1 } },
  midazolam_im: { route: "IM", dose: "10 mg", onsetSec: 120, peakSec: 600, durationSec: 2400, maxDoses: 2, repeatSec: 600, indication: "Prolonged seizure", effects: { sedation: 0.5, rr: -4, map: -6 } },
  glucagon_im: { route: "IM", dose: "1 mg", onsetSec: 300, peakSec: 900, durationSec: 3600, maxDoses: 1, repeatSec: 3600, indication: "Hypoglycaemia with no IV access", effects: {} },
  dextrose_iv: { route: "IV", dose: "10 % · 100 mL", onsetSec: 45, peakSec: 180, durationSec: 1800, maxDoses: 3, repeatSec: 300, indication: "Hypoglycaemia", effects: {} },
  naloxone: { route: "IM", dose: "400 µg", onsetSec: 90, peakSec: 300, durationSec: 1800, maxDoses: 5, repeatSec: 180, indication: "Opioid toxicity with respiratory depression", effects: { opioid: -0.7, hr: 15 } },
  ondansetron: { route: "IV", dose: "4 mg", onsetSec: 300, peakSec: 900, durationSec: 7200, maxDoses: 1, repeatSec: 7200, indication: "Nausea and vomiting", effects: {} },
  tXA_iv: { route: "IV", dose: "1 g over 10 min", onsetSec: 300, peakSec: 900, durationSec: 28800, maxDoses: 1, repeatSec: 28800, indication: "Significant haemorrhage within 3 hours", effects: {} },
  ketamine_analgesia: { route: "IV", dose: "10–20 mg titrated", onsetSec: 45, peakSec: 180, durationSec: 900, maxDoses: 4, repeatSec: 180, indication: "Severe pain, especially with hypotension", effects: { pain: -5, hr: 10, map: 6, sedation: 0.25 } },
  fentanyl: { route: "IV", dose: "50 µg", onsetSec: 60, peakSec: 300, durationSec: 1800, maxDoses: 4, repeatSec: 300, indication: "Severe pain", effects: { pain: -4, opioid: 0.2 } },
  amiodarone: { route: "IV", dose: "300 mg", onsetSec: 60, peakSec: 300, durationSec: 3600, maxDoses: 2, repeatSec: 600, indication: "Shockable arrest after the third shock", effects: { map: -8, hr: -12 } },
  magnesium_sulfate: { route: "IV", dose: "2 g over 20 min", onsetSec: 300, peakSec: 1200, durationSec: 3600, maxDoses: 1, repeatSec: 3600, indication: "Life-threatening asthma", effects: { bronchospasm: -0.25, map: -5 } },
  hydrocortisone: { route: "IV", dose: "100 mg", onsetSec: 1800, peakSec: 3600, durationSec: 21600, maxDoses: 1, repeatSec: 21600, indication: "Severe asthma, anaphylaxis (late)", effects: { bronchospasm: -0.1 } },
  chlorphenamine: { route: "IV", dose: "10 mg", onsetSec: 600, peakSec: 1800, durationSec: 14400, maxDoses: 1, repeatSec: 14400, indication: "Anaphylaxis — after adrenaline", effects: { sedation: 0.1 } },
  calcium_chloride: { route: "IV", dose: "10 mL 10 %", onsetSec: 30, peakSec: 120, durationSec: 1800, maxDoses: 2, repeatSec: 600, indication: "Hyperkalaemia, calcium-channel blocker toxicity", effects: { map: 4 } },
  ketamine_rsi: { route: "IV", dose: "1–2 mg/kg", onsetSec: 30, peakSec: 60, durationSec: 900, maxDoses: 2, repeatSec: 600, indication: "Induction for RSI", effects: { sedation: 1, map: -8, hr: 8 } },
  rocuronium: { route: "IV", dose: "1.2 mg/kg", onsetSec: 45, peakSec: 90, durationSec: 2400, maxDoses: 2, repeatSec: 1800, indication: "Paralysis for RSI", effects: { sedation: 0.3 } },
  propofol: { route: "IV", dose: "titrated infusion", onsetSec: 30, peakSec: 90, durationSec: 600, maxDoses: 6, repeatSec: 300, indication: "Post-RSI sedation", effects: { sedation: 1, map: -20, rr: -6 } },
  metaraminol: { route: "IV", dose: "0.5 mg", onsetSec: 30, peakSec: 120, durationSec: 900, maxDoses: 6, repeatSec: 180, indication: "Hypotension after induction", effects: { map: 22, vaso: 0.6, hr: -8 } },
  noradrenaline: { route: "IV", dose: "0.05–0.5 µg/kg/min", onsetSec: 45, peakSec: 180, durationSec: 900, maxDoses: 6, repeatSec: 300, indication: "Vasodilatory shock", effects: { map: 28, vaso: 0.8 } },
  blood_prbc: { route: "IV", dose: "1 unit", onsetSec: 120, peakSec: 900, durationSec: 86400, maxDoses: 4, repeatSec: 300, indication: "Haemorrhagic shock", effects: {} },
  blood_plasma: { route: "IV", dose: "1 unit", onsetSec: 120, peakSec: 900, durationSec: 86400, maxDoses: 4, repeatSec: 300, indication: "Haemorrhagic shock alongside red cells", effects: {} },
};

export type DrugDose = { drug: DrugName; at: number; by: string };

/** Fractional activity (0-1) of one dose at `now`: rises to the peak,
 *  holds, then fades out linearly to the end of its duration. */
function doseActivity(spec: DrugSpec, at: number, now: number): number {
  const t = (now - at) / 1000;
  if (t < 0 || t >= spec.durationSec) return 0;
  if (t < spec.onsetSec) return (t / Math.max(1, spec.onsetSec)) * 0.3;
  if (t < spec.peakSec) return 0.3 + 0.7 * ((t - spec.onsetSec) / Math.max(1, spec.peakSec - spec.onsetSec));
  const fade = spec.durationSec - spec.peakSec;
  return Math.max(0, 1 - (t - spec.peakSec) / Math.max(1, fade));
}

/** Activity of a drug summed over every dose, capped at the level a
 *  double dose reaches — the third neb does not do three times the work. */
export function drugActivity(doses: DrugDose[] | undefined, drug: DrugName, now: number): number {
  if (!doses) return 0;
  const spec = PHARMACOLOGY[drug];
  let a = 0;
  for (const d of doses) if (d.drug === drug) a += doseActivity(spec, d.at, now);
  return Math.min(2, a);
}

export function dosesOf(doses: DrugDose[] | undefined, drug: DrugName): DrugDose[] {
  return (doses ?? []).filter((d) => d.drug === drug);
}

export type DrugCheck = { ok: boolean; reason?: string; warning?: string; nextAt?: number };

/** Can this drug be given now, and should it? Hard stops return ok:false
 *  with the reason; things a clinician would think twice about come back
 *  as a warning the card shows but does not enforce. An allergy the crew
 *  has not asked about is deliberately NOT a stop — the record cannot
 *  know what nobody asked. */
export function canGiveDrug(tx: PatientTreatmentState, drug: DrugName, now: number): DrugCheck {
  const spec = PHARMACOLOGY[drug];
  const v = tx.liveVitals ?? tx.revealedVitals;
  const flags = new Set(tx.activeRedFlags ?? tx.revealedRedFlags ?? []);
  const given = dosesOf(tx.doses, drug);
  const last = given[given.length - 1];
  const hasAccess = tx.circulation.iv_access !== undefined || tx.circulation.io_access !== undefined;
  const arrest = flags.has("cardiac_arrest");

  if (spec.route === "IV" && !hasAccess) return { ok: false, reason: "No IV or IO access — cannulate first" };
  if (given.length >= spec.maxDoses) return { ok: false, reason: `Maximum ${spec.maxDoses} dose${spec.maxDoses === 1 ? "" : "s"} already given` };
  if (last && now - last.at < spec.repeatSec * 1000) {
    return { ok: false, reason: `Repeat dose due in ${Math.ceil((spec.repeatSec * 1000 - (now - last.at)) / 1000)} s`, nextAt: last.at + spec.repeatSec * 1000 };
  }
  if (tx.allergiesConfirmedAt && tx.profile) {
    const allergy = tx.profile.allergies.find((a) => a.drugs.includes(drug));
    if (allergy) return { ok: false, reason: `Patient reports ${allergy.agent} allergy — ${allergy.reaction === "rash" ? "rash" : "anaphylaxis"}` };
  }
  if (v && !arrest) {
    if (drug === "gtn_spray" && v.bpSys < 90) return { ok: false, reason: "Systolic below 90 — GTN would drop it further" };
    if ((drug === "morphine" || drug === "fentanyl") && v.rr < 10) return { ok: false, reason: "Respiratory rate below 10 — opioid would stop them breathing" };
    if ((drug === "morphine" || drug === "fentanyl") && v.bpSys < 90) return { ok: false, reason: "Systolic below 90 — consider ketamine instead" };
    if (drug === "entonox" && v.gcs < 15) return { ok: false, reason: "Patient must be alert enough to hold the mask" };
    if (drug === "entonox" && flags.has("tension_pneumothorax")) return { ok: false, reason: "Nitrous oxide expands a pneumothorax" };
    if (drug === "midazolam_im" && !flags.has("seizure_active")) return { ok: true, warning: "No seizure activity — midazolam will only sedate and slow their breathing" };
    if (drug === "adrenaline_im_anaphylaxis" && !flags.has("anaphylaxis") && !flags.has("severe_asthma")) return { ok: true, warning: "No anaphylaxis — adrenaline will drive the heart hard for nothing" };
    if (drug === "naloxone" && !flags.has("overdose_opioid") && (tx.doses ?? []).every((d) => d.drug !== "morphine" && d.drug !== "fentanyl")) return { ok: true, warning: "No opioid on board — naloxone will do nothing" };
    if ((drug === "aspirin_300" || drug === "gtn_spray") && !flags.has("stemi")) return { ok: true, warning: "No cardiac chest pain — no benefit" };
    if (drug === "aspirin_300" && flags.has("major_haemorrhage")) return { ok: true, warning: "Antiplatelet in a bleeding patient" };
    if (drug === "glucagon_im" && tx.profile?.glycogenDepleted) return { ok: true, warning: "Alcohol excess — glycogen stores may be empty; dextrose IV is more reliable" };
  }
  if (drug === "adrenaline_cpr" && !arrest) return { ok: false, reason: "1 mg adrenaline is an arrest dose — not for a patient with a pulse" };
  if (drug === "amiodarone" && !arrest) return { ok: true, warning: "Outside arrest amiodarone drops the pressure and the rate" };
  if ((drug === "ketamine_rsi" || drug === "rocuronium" || drug === "propofol") && tx.airway.rsi === undefined && drug !== "ketamine_rsi") return { ok: true, warning: "Paralysis without a secured airway" };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Physiology state
// ---------------------------------------------------------------------------

export type PhysioState = {
  bloodVolumePct: number;
  bleedRatePctPerMin: number;
  bleedControlled: boolean;
  /** Crystalloid running in — ml and when it started. */
  infusions: { ml: number; at: number }[];
  airwayPatency: number;
  /** Structural airway injury — burns, soot, trauma. Worsens on its own. */
  airwayInjury: number;
  /** Airway swelling from anaphylaxis. Comes down with adrenaline. */
  airwaySwelling: number;
  /** Part of the authored saturation the model cannot explain — pneumonia,
   *  smoke, contusion. Stays for the field; oxygen still works on it. */
  pulmonaryDeficit: number;
  /** A patient breathing against a tight chest tires; then they stop. */
  exhaustion: number;
  seizureCause?: "hypo" | "epileptic";
  tensionSeverity: number;
  bronchospasm: number;
  icp: number;
  pain: number;
  /** Pain the injury causes on its own — what analgesia works against. */
  painBase: number;
  sedation: number;
  opioidLoad: number;
  opioidBase: number;
  hypercapnia: number;
  ischaemia: number;
  anaphylaxis: number;
  seizing: boolean;
  postIctalUntil?: number;
  aspirationUntil?: number;
  suctionUntil?: number;
  hypoxiaSec: number;
  shockSec: number;
  apnoeaSec: number;
  /** Physiology events already announced, so the log says things once. */
  fired: string[];
  reactionAt?: number;
  reactionDrug?: DrugName;
  /** Offsets that make the model's targets equal the authored vitals at
   *  survey time, so the presentation a scenario wrote is the one the
   *  crew sees. */
  calib: Partial<Vitals>;
  ambientCold: boolean;
};

const MIN: Vitals = { rr: 0, spo2: 50, hr: 0, bpSys: 0, bpDia: 0, gcs: 3, temp: 28, bm: 0.5 };
const MAX: Vitals = { rr: 60, spo2: 100, hr: 220, bpSys: 250, bpDia: 140, gcs: 15, temp: 42, bm: 35 };
const clampV = (k: keyof Vitals, x: number) => Math.max(MIN[k], Math.min(MAX[k], x));
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** The hidden state a patient starts with, read off the red flags and
 *  the authored numbers. */
export function initialPhysio(clinical: PatientClinical, profile: PatientProfile | undefined, seed: string): PhysioState {
  const rnd = mulberry32(hashSeed(seed + ":physio"));
  const flags = new Set(clinical.redFlags);
  const v = clinical.vitals;
  const cold = /outdoor|water|weir|river|moor|road|garden|exposure|hypotherm/i.test(clinical.presumedCondition);
  const s: PhysioState = {
    bloodVolumePct: 100,
    bleedRatePctPerMin: 0,
    bleedControlled: false,
    infusions: [],
    airwayPatency: 1,
    airwayInjury: 0,
    airwaySwelling: 0,
    pulmonaryDeficit: 0,
    exhaustion: 0,
    tensionSeverity: 0,
    bronchospasm: 0,
    icp: 0,
    pain: 0,
    painBase: 0,
    sedation: 0,
    opioidLoad: 0,
    opioidBase: 0,
    hypercapnia: 0,
    ischaemia: 0,
    anaphylaxis: 0,
    seizing: false,
    hypoxiaSec: 0,
    shockSec: 0,
    apnoeaSec: 0,
    fired: [],
    calib: {},
    ambientCold: cold,
  };
  if (flags.has("major_haemorrhage")) {
    s.bloodVolumePct = 78 + rnd() * 6;
    s.bleedRatePctPerMin = 1.1 + rnd() * 0.5;
  }
  if (flags.has("hypovolaemic_shock")) {
    s.bloodVolumePct = Math.min(s.bloodVolumePct, 72 + rnd() * 6);
    s.bleedRatePctPerMin = Math.max(s.bleedRatePctPerMin, 0.35 + rnd() * 0.2);
  }
  if (profile?.anticoagulated) s.bleedRatePctPerMin *= 1.4;
  if (flags.has("airway_compromise")) {
    s.airwayInjury = 0.45 + rnd() * 0.15;
    s.airwayPatency = 1 - s.airwayInjury;
  }
  if (flags.has("tension_pneumothorax")) s.tensionSeverity = 0.55 + rnd() * 0.15;
  if (flags.has("severe_asthma")) s.bronchospasm = 0.75 + rnd() * 0.1;
  if (flags.has("anaphylaxis")) { s.anaphylaxis = 0.65 + rnd() * 0.15; s.bronchospasm = Math.max(s.bronchospasm, 0.4); }
  if (flags.has("head_injury_severe")) s.icp = clamp01((15 - v.gcs) / 12) * 0.8 + 0.1;
  if (flags.has("overdose_opioid")) { s.opioidBase = 0.8 + rnd() * 0.15; s.opioidLoad = s.opioidBase; }
  if (flags.has("stemi")) s.ischaemia = 0.55 + rnd() * 0.2;
  if (flags.has("seizure_active")) { s.seizing = true; s.seizureCause = flags.has("hypoglycaemia") ? "hypo" : "epileptic"; }
  // Pain from the presentation.
  const cond = clinical.presumedCondition.toLowerCase();
  s.pain = /fracture|deformity|burn|entrap|crush|amput|glass|laceration|chest pain|stemi|trauma|fall/.test(cond) ? 6 + Math.floor(rnd() * 3) : /pain/.test(cond) ? 4 : v.gcs < 9 ? 0 : 1 + Math.floor(rnd() * 3);
  if (flags.has("stemi")) s.pain = Math.max(s.pain, 7);
  s.painBase = s.pain;
  return s;
}

// ---------------------------------------------------------------------------
// The tick
// ---------------------------------------------------------------------------

function ev(at: number, text: string, tone: "info" | "warn" | "critical" | "good", adverse = false): TreatmentEvent {
  return { kind: "physio", at, text, tone, adverse: adverse || undefined };
}

/** Move `current` toward `target` with a time constant `tauSec`. */
function ease(current: number, target: number, dt: number, tauSec: number): number {
  const k = 1 - Math.exp(-dt / Math.max(0.5, tauSec));
  return current + (target - current) * k;
}

export type TargetVitals = Vitals & { map: number };

/** The vitals this state wants to settle at. Exposed so the UI can show
 *  where a patient is heading and the tests can check the model. */
export function targetVitals(tx: PatientTreatmentState, s: PhysioState, now: number): TargetVitals {
  const p = tx.profile;
  const flags = new Set(tx.activeRedFlags ?? []);
  const act = (d: DrugName) => Math.min(1.2, drugActivity(tx.doses, d, now));
  const age = p?.ageYears ?? 40;
  const child = age <= 12;

  // Drug-derived loads.
  const opioidDrug = act("morphine") * 0.2 + act("fentanyl") * 0.22;
  const naloxone = act("naloxone");
  const opioidLoad = clamp01(s.opioidBase + opioidDrug - naloxone * 0.75);
  const sedation = clamp01(act("midazolam_im") * 0.5 + act("ketamine_rsi") + act("propofol") + act("ketamine_analgesia") * 0.25 + act("chlorphenamine") * 0.08 + act("rocuronium") * 0.3);
  const vaso = clamp01(act("adrenaline_im_anaphylaxis") * 0.5 + act("adrenaline_cpr") + act("metaraminol") * 0.6 + act("noradrenaline") * 0.8);

  // Oxygen actually reaching the lungs.
  const bvm = tx.breathing.bvm !== undefined && (tx.liveVitals?.rr ?? 12) < 8;
  const fio2Set = bvm ? 0.9 : tx.oxygen && tx.oxygen.device !== "none" ? fiO2For(tx.oxygen.device, tx.oxygen.flowLpm) : tx.breathing.oxygen_15l !== undefined && !tx.oxygen ? 0.85 : 0.21;
  const patency = s.airwayPatency;
  const fio2 = 0.21 + (fio2Set - 0.21) * Math.pow(patency, 1.5);
  const oxyFrac = clamp01((fio2 - 0.21) / 0.79);

  // Circulation.
  const volumeFactor = s.bloodVolumePct >= 85 ? 1 : s.bloodVolumePct <= 45 ? 0.2 : 0.2 + 0.8 * ((s.bloodVolumePct - 45) / 40);
  const map0 = child ? 70 : age >= 65 ? 98 : 92;
  let map = map0 * volumeFactor;
  map *= 1 - 0.45 * s.anaphylaxis;
  map *= 1 - 0.35 * s.tensionSeverity;
  map -= sedation * 14 + opioidLoad * 8;
  map += vaso * 22;
  map += s.pain * 1.2;
  map += s.icp * 18;
  map += s.hypercapnia * 5;
  for (const d of Object.keys(PHARMACOLOGY) as DrugName[]) {
    const e = PHARMACOLOGY[d].effects.map;
    if (e) map += e * act(d) * (d === "gtn_spray" && volumeFactor < 0.8 ? 2 : 1);
  }
  if ((tx.liveVitals?.temp ?? 37) < 34) map *= 0.9;
  map = Math.max(0, map);

  const hypoxiaDrive = Math.max(0, 90 - (tx.liveVitals?.spo2 ?? 97));
  let hr = (child ? 105 : age >= 65 ? 74 : 72) + (p?.frailty ?? 1) * 1.5;
  const compensation = (1 - volumeFactor) * 95 * (p?.betaBlocked ? 0.4 : age >= 75 ? 0.7 : 1);
  hr += compensation + hypoxiaDrive * 1.2 + s.pain * 3 + s.anaphylaxis * 40 + s.tensionSeverity * 30 + s.bronchospasm * 15;
  hr -= opioidLoad * 12 + sedation * 12 + s.icp * 25;
  if ((tx.liveVitals?.temp ?? 37) < 34) hr -= 15;
  for (const d of Object.keys(PHARMACOLOGY) as DrugName[]) {
    const e = PHARMACOLOGY[d].effects.hr;
    if (e) hr += e * act(d);
  }
  if (p?.betaBlocked) hr = Math.min(hr, 112);

  // Breathing.
  let rr = (child ? 22 : 14) + (1 - volumeFactor) * 10 + hypoxiaDrive * 0.5 + s.bronchospasm * 12 + s.tensionSeverity * 8 + s.pain * 0.7 + s.anaphylaxis * 8;
  rr -= opioidLoad * 15 + sedation * 7 + s.hypercapnia * 9 + s.icp * 4 + s.exhaustion * 14;
  for (const d of Object.keys(PHARMACOLOGY) as DrugName[]) {
    const e = PHARMACOLOGY[d].effects.rr;
    if (e) rr += e * act(d);
  }
  if (s.seizing) rr = 8;
  if (bvm || tx.airway.rsi !== undefined) rr = 12;

  // Oxygenation: a deficit the pathology causes, offset by the oxygen
  // that can reach the alveoli.
  const base = p?.copdRisk ? 93 : 98;
  const effRR = rr;
  const hypovent = effRR < 8 ? (8 - Math.max(0, effRR)) * 6 : 0;
  let deficit = (1 - patency) * 45 + s.bronchospasm * 22 + s.tensionSeverity * 25 + hypovent + s.hypercapnia * 4 + s.pulmonaryDeficit + s.exhaustion * 30 + (s.aspirationUntil && now < s.aspirationUntil ? 8 : 0) + (s.seizing ? 6 : 0);
  if (volumeFactor < 0.55) deficit += 5;
  if (flags.has("cardiac_arrest")) deficit += 40;
  let spo2 = base - deficit * (1 - 0.72 * oxyFrac) + oxyFrac * 2;
  if (patency < 0.15) spo2 = Math.min(spo2, 60);

  // Consciousness.
  let gcs = 15;
  gcs -= sedation * 10 + opioidLoad * 6 + s.icp * 8 + s.hypercapnia * 6;
  const bm = tx.liveVitals?.bm ?? tx.revealedVitals?.bm ?? 5.5;
  if (bm < 4) gcs -= (4 - bm) * 2.5;
  const liveSpo2 = tx.liveVitals?.spo2 ?? 97;
  if (liveSpo2 < 85) gcs -= (85 - liveSpo2) * 0.4;
  const liveMap = tx.liveVitals ? (tx.liveVitals.bpSys + 2 * tx.liveVitals.bpDia) / 3 : 90;
  if (liveMap < 60) gcs -= (60 - liveMap) * 0.3;
  if (s.seizing) gcs = Math.min(gcs, 5);
  else if (s.postIctalUntil && now < s.postIctalUntil) gcs = Math.min(gcs, 9 + 4 * (1 - (s.postIctalUntil - now) / 600000));
  if (flags.has("cardiac_arrest")) gcs = 3;

  const pulsePressure = 40 * (0.5 + 0.5 * volumeFactor) + vaso * 12;
  let bpSys = map + (2 / 3) * pulsePressure;
  let bpDia = map - (1 / 3) * pulsePressure;
  if (flags.has("cardiac_arrest")) { hr = 0; bpSys = 0; bpDia = 0; rr = 0; }

  const c = s.calib;
  return {
    hr: clampV("hr", hr + (c.hr ?? 0)),
    rr: clampV("rr", rr + (c.rr ?? 0)),
    spo2: clampV("spo2", spo2 + (c.spo2 ?? 0)),
    bpSys: clampV("bpSys", bpSys + (c.bpSys ?? 0)),
    bpDia: clampV("bpDia", bpDia + (c.bpDia ?? 0)),
    gcs: clampV("gcs", gcs + (c.gcs ?? 0)),
    temp: tx.liveVitals?.temp ?? tx.revealedVitals?.temp ?? 36.8,
    bm,
    map,
  };
}

/** Compute calibration offsets so the model reproduces the authored
 *  presentation at survey time. Bounded, so a scenario cannot make the
 *  model nonsensical; a residual the model cannot explain simply persists
 *  as "this patient". */
export function calibrate(tx: PatientTreatmentState, s: PhysioState, authored: Vitals, now: number): PhysioState {
  const t = targetVitals(tx, { ...s, calib: {}, pulmonaryDeficit: 0 }, now);
  const lim = (k: keyof Vitals, x: number, cap: number) => Math.max(-cap, Math.min(cap, authored[k] - x));
  // A saturation lower than the pathology explains is lung: it stays, but
  // oxygen works on it. A higher one is just this patient.
  const pulmonaryDeficit = authored.spo2 < t.spo2 ? Math.min(35, t.spo2 - authored.spo2) : 0;
  return {
    ...s,
    pulmonaryDeficit,
    calib: {
      hr: lim("hr", t.hr, 40),
      rr: lim("rr", t.rr, 12),
      spo2: authored.spo2 >= t.spo2 ? lim("spo2", t.spo2, 6) : 0,
      bpSys: lim("bpSys", t.bpSys, 35),
      bpDia: lim("bpDia", t.bpDia, 25),
      gcs: lim("gcs", t.gcs, 6),
    },
  };
}

/**
 * Advance a patient by `dtSec`. Returns a new treatment record with the
 * live vitals, hidden state, red flags and any physiology events moved
 * on. Records without a completed survey have no physiology yet.
 */
export function advancePhysiology(tx: PatientTreatmentState, dtSec: number, nowMs: number): PatientTreatmentState {
  if (!tx.liveVitals || !tx.surveyCompletedAt || dtSec <= 0) return tx;
  const dt = Math.min(30, dtSec);
  const prevS = tx.physio ?? initialPhysio({ vitals: tx.revealedVitals ?? tx.liveVitals, presumedCondition: tx.revealedCondition ?? "", redFlags: tx.revealedRedFlags ?? [], preferredDestination: tx.preferredDestination ?? "nearest_a_e", criticalInterventions: [] }, tx.profile, tx.casualtyId);
  const s: PhysioState = { ...prevS, fired: [...prevS.fired], infusions: [...prevS.infusions] };
  const flags = new Set<PatientRedFlag>(tx.activeRedFlags ?? []);
  const events: TreatmentEvent[] = [];
  const once = (key: string, text: string, tone: "info" | "warn" | "critical" | "good", adverse = false) => {
    if (s.fired.includes(key)) return;
    s.fired.push(key);
    events.push(ev(nowMs, text, tone, adverse));
  };
  const act = (d: DrugName) => drugActivity(tx.doses, d, nowMs);
  const within = (at: number | undefined, sec: number) => at !== undefined && nowMs - at < sec * 1000;
  const v = tx.liveVitals;
  const p = tx.profile;
  const arrest = flags.has("cardiac_arrest");
  const liveMap = (v.bpSys + 2 * v.bpDia) / 3;

  // ---- Allergic reactions -------------------------------------------------
  if (p && s.reactionAt === undefined) {
    for (const d of tx.doses ?? []) {
      const allergy = p.allergies.find((a) => a.drugs.includes(d.drug));
      if (!allergy || s.fired.includes(`allergy:${d.drug}:${d.at}`)) continue;
      s.fired.push(`allergy:${d.drug}:${d.at}`);
      s.reactionAt = d.at + 45000 + (hashSeed(d.drug + d.at) % 60000);
      s.reactionDrug = d.drug;
    }
  }
  if (s.reactionAt !== undefined && nowMs >= s.reactionAt && p) {
    const allergy = p.allergies.find((a) => a.drugs.includes(s.reactionDrug!));
    if (allergy?.reaction === "rash") {
      once(`rash:${s.reactionAt}`, `Urticarial rash spreading — reaction to ${allergy.agent}`, "warn", true);
      s.pain = Math.min(10, s.pain + 1);
    } else if (allergy) {
      once(`anaphylaxis:${s.reactionAt}`, `ANAPHYLAXIS — ${allergy.agent} reaction: lip swelling, wheeze, pressure falling`, "critical", true);
      s.anaphylaxis = Math.max(s.anaphylaxis, allergy.reaction === "angio_oedema" ? 0.5 : 0.7);
      s.airwaySwelling = Math.max(s.airwaySwelling, allergy.reaction === "angio_oedema" ? 0.5 : 0.25);
      flags.add("anaphylaxis");
    }
    s.reactionAt = undefined;
    s.reactionDrug = undefined;
  }

  // ---- Airway -------------------------------------------------------------
  // Swelling and soiling worsen; adjuncts and definitive airways open it.
  const structural = (tx.revealedRedFlags ?? []).includes("airway_compromise");
  if (structural && s.airwayInjury > 0) s.airwayInjury = clamp01(s.airwayInjury + 0.0010 * dt);
  const adrenalineNow = act("adrenaline_im_anaphylaxis") + act("adrenaline_cpr");
  if (s.anaphylaxis > 0.3 && adrenalineNow < 0.3) s.airwaySwelling = clamp01(s.airwaySwelling + 0.0009 * dt * s.anaphylaxis);
  else s.airwaySwelling = clamp01(s.airwaySwelling - (adrenalineNow > 0.3 ? 0.0025 : 0.0008) * dt);
  const gag = v.gcs > 8 && tx.airway.rsi === undefined;
  let patency = 1 - Math.max(s.airwayInjury, s.airwaySwelling);
  if (tx.airway.igel !== undefined || tx.airway.rsi !== undefined) {
    if (tx.airway.igel !== undefined && gag && !s.fired.includes("igel-gag")) {
      once("igel-gag", "Patient gagged on the i-gel and vomited — aspiration risk", "critical", true);
      s.aspirationUntil = nowMs + 600000;
    } else patency = Math.max(patency, 0.95);
  } else {
    if (tx.airway.opa !== undefined) {
      if (gag) { once("opa-gag", "Gag reflex intact — patient vomited around the oropharyngeal airway", "critical", true); s.aspirationUntil = nowMs + 480000; }
      else patency += 0.35;
    }
    if (tx.airway.npa !== undefined) {
      patency += 0.3;
      if (flags.has("head_injury_severe")) once("npa-bos", "Nasopharyngeal airway with a suspected base-of-skull fracture — bleeding from the nose", "warn", true);
    }
    if (tx.airway.position !== undefined && v.gcs < 9) patency += 0.25;
    if (within(tx.airway.suction, 120)) patency += 0.2;
    if (tx.airway.magill_forceps !== undefined || tx.airway.back_blows !== undefined || tx.airway.abdominal_thrusts !== undefined) patency += 0.3;
  }
  if (s.aspirationUntil && nowMs < s.aspirationUntil) patency -= 0.15;
  s.airwayPatency = clamp01(patency);
  if (flags.has("airway_compromise") && s.airwayPatency > 0.85) { flags.delete("airway_compromise"); s.fired = s.fired.filter((k) => k !== "airway-lost"); once("airway-cleared", "Airway secured — saturation should climb", "good"); }
  else if (!flags.has("airway_compromise") && s.airwayPatency < 0.5) { flags.add("airway_compromise"); s.fired = s.fired.filter((k) => k !== "airway-cleared"); once("airway-lost", "Airway obstructing — stridor, saturation falling", "critical"); }

  // ---- Breathing ----------------------------------------------------------
  if (flags.has("tension_pneumothorax")) {
    if (tx.breathing.finger_thoracostomy !== undefined) { s.tensionSeverity = 0; flags.delete("tension_pneumothorax"); once("thoracostomy", "Chest decompressed — rush of air, pressure recovering", "good"); }
    else if (within(tx.breathing.needle_decomp, 5)) { s.tensionSeverity = Math.min(s.tensionSeverity, 0.15); once("needle", "Needle decompression — hiss of air, chest relieved for now", "good"); }
    else if (tx.breathing.needle_decomp !== undefined) {
      s.tensionSeverity = clamp01(s.tensionSeverity + 0.0004 * dt);
      if (s.tensionSeverity > 0.45) once("reaccumulate", "Tension re-accumulating — the cannula has kinked; consider thoracostomy or a second needle", "critical");
    } else s.tensionSeverity = clamp01(s.tensionSeverity + 0.0012 * dt);
    if (tx.breathing.needle_decomp !== undefined && s.tensionSeverity < 0.2 && !flags.has("tension_pneumothorax")) flags.delete("tension_pneumothorax");
  }
  if (act("entonox") > 0.2 && s.tensionSeverity > 0) { s.tensionSeverity = clamp01(s.tensionSeverity + 0.003 * dt); once("entonox-tension", "Entonox expanding the pneumothorax — patient acutely more breathless", "critical", true); }
  // Bronchospasm: untreated asthma tightens, bronchodilators loosen.
  let bronchoTarget = 0;
  if (flags.has("severe_asthma")) bronchoTarget = 0.9;
  if (flags.has("anaphylaxis")) bronchoTarget = Math.max(bronchoTarget, 0.5 * s.anaphylaxis + 0.2);
  const relief = act("salbutamol_neb") * 0.45 + act("ipratropium_neb") * 0.2 + act("magnesium_sulfate") * 0.25 + act("adrenaline_im_anaphylaxis") * 0.4 + act("hydrocortisone") * 0.1 + act("adrenaline_cpr") * 0.4;
  const bronchoGoal = clamp01(bronchoTarget - relief);
  s.bronchospasm = ease(s.bronchospasm, bronchoGoal, dt, bronchoGoal > s.bronchospasm ? 420 : 240);
  if (flags.has("severe_asthma") && s.bronchospasm < 0.35 && relief > 0.3) { flags.delete("severe_asthma"); once("asthma-broken", "Wheeze easing — air entry returning", "good"); }
  if (flags.has("severe_asthma") && s.bronchospasm > 0.88) once("silent-chest", "Silent chest — exhausted, pre-arrest. Needs adrenaline and ventilation", "critical");
  // Working against a tight chest or a swollen airway tires the patient;
  // a tired patient hypoventilates, and then stops. Ventilating for them
  // (BVM, RSI) lets them rest.
  const working = (s.bronchospasm > 0.75 || s.airwayPatency < 0.55) && tx.breathing.bvm === undefined && tx.airway.rsi === undefined;
  s.exhaustion = clamp01(s.exhaustion + (working ? 0.0009 : -0.0006) * dt);
  if (s.exhaustion > 0.6) once("exhausted", "Tiring — respiratory effort falling off, confused. Ventilate them", "critical");
  // CO₂ retention on high-flow oxygen.
  const fio2 = tx.oxygen && tx.oxygen.device !== "none" ? fiO2For(tx.oxygen.device, tx.oxygen.flowLpm) : tx.breathing.oxygen_15l !== undefined && !tx.oxygen ? 0.85 : 0.21;
  if (p?.copdRisk && fio2 > 0.36 && v.spo2 > 92) {
    s.hypercapnia = clamp01(s.hypercapnia + 0.0009 * dt);
    if (s.hypercapnia > 0.35) once("hypercapnia", "CO₂ retainer on high-flow oxygen — breathing slowing, becoming drowsy. Titrate to 88–92 %", "critical", true);
  } else s.hypercapnia = clamp01(s.hypercapnia - 0.0008 * dt);

  // ---- Circulation ----------------------------------------------------------
  // Bleeding until it is controlled; fluids and blood refill.
  const controlled = tx.packaging.tourniquet !== undefined || tx.packaging.wound_pack !== undefined || tx.packaging.pelvic_binder !== undefined || tx.packaging.traction_splint !== undefined;
  if (controlled && !s.bleedControlled) { s.bleedControlled = true; once("haemostasis", "Haemorrhage controlled — pressure should hold now", "good"); }
  let rate = s.bleedRatePctPerMin;
  if (s.bleedControlled) rate *= tx.packaging.tourniquet !== undefined ? 0.03 : 0.12;
  if (act("tXA_iv") > 0.3) rate *= 0.65;
  if (v.temp < 35) rate *= 1.3;
  if (!s.bleedControlled && liveMap > 82 && s.bleedRatePctPerMin > 0.5) { rate *= 1.6; once("clot-pop", "Pressure pushed above 80 with the bleeding uncontrolled — the clot has gone, bleeding faster", "critical", true); }
  if (flags.has("hypovolaemic_shock") && !flags.has("major_haemorrhage")) rate = Math.min(rate, 0.5);
  s.bloodVolumePct = Math.max(20, s.bloodVolumePct - (rate * dt) / 60);
  // Bolus fluids run in over ten minutes; crystalloid leaks out again.
  for (const inf of s.infusions) {
    const age = (nowMs - inf.at) / 1000;
    if (age < 600) s.bloodVolumePct += ((inf.ml / 5000) * 100 * dt) / 600;
    else if (age < 2400) s.bloodVolumePct -= ((inf.ml / 5000) * 100 * 0.6 * dt) / 1800;
  }
  s.infusions = s.infusions.filter((i) => nowMs - i.at < 2400000);
  for (const d of tx.doses ?? []) {
    if ((d.drug === "blood_prbc" || d.drug === "blood_plasma") && !s.fired.includes(`blood:${d.at}`)) {
      s.fired.push(`blood:${d.at}`);
      s.bloodVolumePct += d.drug === "blood_prbc" ? 7 : 5;
    }
  }
  s.bloodVolumePct = Math.min(105, s.bloodVolumePct);
  if (flags.has("major_haemorrhage") && s.bleedControlled && act("tXA_iv") > 0) flags.delete("major_haemorrhage");
  if (flags.has("hypovolaemic_shock") && s.bloodVolumePct > 84) { flags.delete("hypovolaemic_shock"); once("resuscitated", "Volume restored — pressure and pulse settling", "good"); }
  if (!flags.has("hypovolaemic_shock") && s.bloodVolumePct < 70) { flags.add("hypovolaemic_shock"); once("shocked", "Signs of shock — pale, tachycardic, pressure falling", "critical"); }
  if (act("gtn_spray") > 0.5 && s.bloodVolumePct < 80) once("gtn-drop", "GTN on a depleted patient — pressure has dropped away", "critical", true);

  // Anaphylaxis resolves only with adrenaline.
  if (s.anaphylaxis > 0) {
    const adrenaline = act("adrenaline_im_anaphylaxis") + act("adrenaline_cpr");
    s.anaphylaxis = clamp01(s.anaphylaxis + (adrenaline > 0.2 ? -0.0028 * dt * adrenaline : 0.0007 * dt));
    if (s.anaphylaxis < 0.12 && flags.has("anaphylaxis")) { flags.delete("anaphylaxis"); once("anaphylaxis-settled", "Anaphylaxis settling — watch for a second wave as the adrenaline wears off", "good"); }
    if (flags.has("anaphylaxis") && s.anaphylaxis < 0.3 && adrenaline < 0.1 && s.fired.includes("anaphylaxis-settled")) once("biphasic", "Biphasic reaction — wheeze and flushing returning", "critical");
  }
  if (act("adrenaline_im_anaphylaxis") > 0.5 && s.ischaemia > 0.3) { s.ischaemia = clamp01(s.ischaemia + 0.001 * dt); once("adrenaline-ischaemia", "Adrenaline driving an ischaemic heart — chest pain worse", "critical", true); }

  // Ischaemia: aspirin and oxygen where hypoxic help a little; time does not.
  if (s.ischaemia > 0) {
    let dI = 0.00025;
    if (act("aspirin_300") > 0.2) dI -= 0.0002;
    if (v.spo2 >= 94) dI -= 0.00008;
    if (act("gtn_spray") > 0.3) dI -= 0.00005;
    s.ischaemia = clamp01(s.ischaemia + dI * dt);
  }

  // ---- Disability -----------------------------------------------------------
  // Head injury: pressure rises unless oxygenation and perfusion are held.
  if (flags.has("head_injury_severe")) {
    const wellManaged = v.spo2 >= 94 && liveMap >= 80 && tx.airway.rsi !== undefined;
    const partly = v.spo2 >= 94 && liveMap >= 80;
    s.icp = clamp01(s.icp + (wellManaged ? -0.00005 : partly ? 0.0001 : 0.00035) * dt);
    if (s.icp > 0.7) once("cushing", "Cushing's response — hypertension, bradycardia, irregular breathing. Coning imminent", "critical");
  }
  // Glucose.
  let bm = v.bm;
  if (flags.has("hypoglycaemia")) bm -= 0.006 * dt;
  const dextrose = act("dextrose_iv");
  const glucagon = p?.glycogenDepleted ? 0 : act("glucagon_im");
  if (dextrose > 0.1 && bm < 8) bm += 0.05 * dt * dextrose;
  if (glucagon > 0.1 && bm < 7) bm += 0.012 * dt * glucagon;
  if (p?.glycogenDepleted && act("glucagon_im") > 0.5) once("glucagon-flat", "Glucagon has done nothing — no glycogen to release. Needs IV dextrose", "warn");
  if (flags.has("hypoglycaemia") && bm >= 4) { flags.delete("hypoglycaemia"); once("sugar-up", "BM above 4 — patient rousing", "good"); }
  if (!flags.has("hypoglycaemia") && bm < 3.5 && !dextrose && !glucagon) flags.add("hypoglycaemia");
  // Seizure.
  if (flags.has("seizure_active") && !s.seizing) { s.seizing = true; s.seizureCause = s.seizureCause ?? "epileptic"; }
  if (s.seizing && s.seizureCause === "hypo" && bm >= 4) {
    s.seizing = false;
    s.postIctalUntil = nowMs + 420000;
    flags.delete("seizure_active");
    once("hypo-seizure-stopped", "Seizure stopped as the sugar came up — post-ictal", "good");
  }
  if (s.seizing) {
    if (act("midazolam_im") > 0.3 || act("ketamine_rsi") > 0.3) {
      s.seizing = false;
      s.postIctalUntil = nowMs + 600000;
      flags.delete("seizure_active");
      once("seizure-stopped", "Seizure terminated — post-ictal, snoring respirations", "good");
    } else if (bm < 2.5 && !s.fired.includes("hypo-seizure")) once("hypo-seizure", "Seizing from hypoglycaemia — sugar, not midazolam", "critical");
  } else if (bm < 1.7 && !flags.has("seizure_active") && !(s.postIctalUntil && nowMs < s.postIctalUntil)) { s.seizing = true; s.seizureCause = "hypo"; flags.add("seizure_active"); once("hypo-seizure", "Seizing from hypoglycaemia — sugar, not midazolam", "critical"); }
  if (act("midazolam_im") > 0.6 && !flags.has("seizure_active") && (s.postIctalUntil ?? 0) < nowMs - 300000) once("midaz-sedation", "Midazolam without a seizure — deeply sedated, breathing slowing", "warn", true);

  // Opioid: the overdose outlasts the antidote.
  s.opioidBase = Math.max(0, s.opioidBase - 0.00004 * dt);
  const naloxone = act("naloxone");
  s.opioidLoad = clamp01(s.opioidBase + act("morphine") * 0.2 + act("fentanyl") * 0.22 - naloxone * 0.75);
  if (flags.has("overdose_opioid") && s.opioidLoad < 0.35) { flags.delete("overdose_opioid"); once("naloxone-works", p?.opioidTolerant ? "Naloxone working — patient awake, agitated and withdrawing" : "Naloxone working — breathing picking up, rousing", "good"); }
  if (!flags.has("overdose_opioid") && s.opioidLoad > 0.55 && s.opioidBase > 0.4 && naloxone < 0.3 && s.fired.includes("naloxone-works")) { flags.add("overdose_opioid"); s.fired = s.fired.filter((k) => k !== "naloxone-works" && k !== "renarc"); once("renarc", "Naloxone wearing off — re-narcotising, breathing slowing again", "critical"); }
  const morphineMg = dosesOf(tx.doses, "morphine").filter((d) => nowMs - d.at < 3600000).length * 5;
  if (morphineMg >= 20 && s.opioidLoad > 0.6) once("opioid-toxicity", "Opioid toxicity from titration — pinpoint pupils, respiratory rate falling", "critical", true);
  if (act("salbutamol_neb") > 1.3) once("salbutamol-tachy", "Back-to-back salbutamol — tremor, tachycardia 130s", "warn", true);

  // Pain: analgesia works, splinting works, time does not.
  let painRelief = 0;
  for (const d of Object.keys(PHARMACOLOGY) as DrugName[]) {
    const e = PHARMACOLOGY[d].effects.pain;
    if (e) painRelief += -e * act(d);
  }
  if (tx.packaging.traction_splint !== undefined || tx.packaging.pelvic_binder !== undefined) painRelief += 2;
  if (tx.packaging.dressings !== undefined) painRelief += 0.5;
  s.pain = Math.max(0, Math.min(10, ease(s.pain, Math.max(0, s.painBase - painRelief), dt, 90)));
  s.sedation = clamp01(act("midazolam_im") * 0.5 + act("ketamine_rsi") + act("propofol") + act("ketamine_analgesia") * 0.25);

  // ---- Exposure ---------------------------------------------------------------
  let temp = v.temp;
  const warming = tx.packaging.warming !== undefined;
  if (warming) temp = ease(temp, 36.8, dt, 900);
  else if (s.ambientCold || v.temp < 36) temp -= 0.0004 * dt;
  else temp = ease(temp, 36.8, dt, 3600);
  if (temp < 35 && !warming) once("hypothermia", "Core temperature below 35 — shivering stopped, clotting impaired. Warm them", "warn");

  // ---- Targets and easing ------------------------------------------------------
  const nextTx: PatientTreatmentState = { ...tx, activeRedFlags: Array.from(flags), physio: s };
  const t = targetVitals(nextTx, s, nowMs);
  let next: Vitals;
  if (arrest) {
    // In arrest the numbers are whatever the compressions make them.
    const q = tx.cprQuality ?? (tx.circulation.cpr !== undefined ? 0.85 : 0);
    if (q > 0.05) {
      next = {
        ...v,
        spo2: ease(v.spo2, 58 + q * 22, dt, 20),
        bpSys: ease(v.bpSys, 45 + q * 25, dt, 12),
        bpDia: ease(v.bpDia, 24 + q * 12, dt, 12),
        hr: ease(v.hr, 0, dt, 10),
        gcs: 3,
        rr: ease(v.rr, tx.airway.igel !== undefined || tx.airway.rsi !== undefined ? 10 : 8, dt, 20),
        temp,
        bm,
      };
    } else {
      next = { ...v, spo2: clampV("spo2", v.spo2 - 1.5 * dt), bpSys: clampV("bpSys", v.bpSys - 1.5 * dt), bpDia: clampV("bpDia", v.bpDia - 1 * dt), hr: 0, gcs: 3, rr: 0, temp, bm };
    }
  } else {
    next = {
      hr: ease(v.hr, t.hr, dt, 25),
      rr: ease(v.rr, t.rr, dt, 40),
      spo2: ease(v.spo2, t.spo2, dt, v.spo2 < t.spo2 ? 35 : 60),
      bpSys: ease(v.bpSys, t.bpSys, dt, 45),
      bpDia: ease(v.bpDia, t.bpDia, dt, 45),
      gcs: ease(v.gcs, t.gcs, dt, v.gcs < t.gcs ? 240 : 120),
      temp,
      bm,
    };
  }
  next = { rr: clampV("rr", next.rr), spo2: clampV("spo2", next.spo2), hr: clampV("hr", next.hr), bpSys: clampV("bpSys", next.bpSys), bpDia: clampV("bpDia", next.bpDia), gcs: clampV("gcs", next.gcs), temp: clampV("temp", next.temp), bm: clampV("bm", next.bm) };

  // ---- Deterioration that ends in arrest ---------------------------------------
  if (!arrest) {
    const map = (next.bpSys + 2 * next.bpDia) / 3;
    s.hypoxiaSec = next.spo2 < 60 ? s.hypoxiaSec + dt : Math.max(0, s.hypoxiaSec - dt);
    s.shockSec = map < 38 ? s.shockSec + dt : Math.max(0, s.shockSec - dt);
    s.apnoeaSec = next.rr < 2 && tx.breathing.bvm === undefined ? s.apnoeaSec + dt : Math.max(0, s.apnoeaSec - dt);
    if (next.spo2 < 75 && s.hypoxiaSec === 0) once("hypoxia-warn", "Saturation critically low — peri-arrest", "critical");
    let cause: string | null = null;
    let shockable = false;
    if (s.hypoxiaSec > 60) cause = "hypoxic";
    else if (s.shockSec > 45) cause = "hypovolaemic / obstructive";
    else if (s.apnoeaSec > 90) cause = "respiratory";
    else if (s.ischaemia > 0.35) {
      // Ischaemic VF — a per-minute hazard that treatment cuts.
      const perMin = 0.004 * (1 + s.ischaemia) * (act("aspirin_300") > 0.2 ? 0.6 : 1);
      const roll = mulberry32(hashSeed(`${tx.casualtyId}:${Math.floor(nowMs / 1000)}`))();
      if (roll < (perMin * dt) / 60) { cause = "ischaemic"; shockable = true; }
    }
    if (cause) {
      flags.add("cardiac_arrest");
      next = { ...next, hr: 0, bpSys: 0, bpDia: 0, rr: 0, gcs: 3 };
      events.push(ev(nowMs, `CARDIAC ARREST — ${cause}${shockable ? " · VF" : " · PEA / asystole"}. Start compressions`, "critical"));
      s.hypoxiaSec = 0;
      s.shockSec = 0;
      s.apnoeaSec = 0;
      return {
        ...nextTx,
        liveVitals: next,
        prevLiveVitals: v,
        prevLiveVitalsAt: nowMs,
        liveVitalsLastTickAt: nowMs,
        activeRedFlags: Array.from(flags),
        arrestRhythmHint: shockable ? "shockable" : "non_shockable",
        physio: s,
        events: [...tx.events, ...events],
      };
    }
  }

  const baselineAge = nowMs - (tx.prevLiveVitalsAt ?? 0);
  const roll = baselineAge >= 4000;
  return {
    ...nextTx,
    liveVitals: next,
    prevLiveVitals: roll ? v : (tx.prevLiveVitals ?? v),
    prevLiveVitalsAt: roll ? nowMs : (tx.prevLiveVitalsAt ?? nowMs),
    liveVitalsLastTickAt: nowMs,
    activeRedFlags: Array.from(flags),
    physio: s,
    events: events.length ? [...tx.events, ...events] : tx.events,
  };
}

/** Record a bolus so the tick can run it in over ten minutes. */
export function withInfusion(s: PhysioState | undefined, ml: number, at: number): PhysioState | undefined {
  if (!s) return s;
  return { ...s, infusions: [...s.infusions, { ml, at }] };
}

/** Consciousness wording from the numbers. */
export function consciousnessOf(vitals: Vitals | undefined, physio: PhysioState | undefined): string {
  if (!vitals) return "Not yet assessed";
  if (physio?.seizing) return "Seizing";
  if (vitals.gcs >= 15) return "Alert";
  if (vitals.gcs >= 13) return "Confused";
  if (vitals.gcs >= 9) return "Responds to voice";
  if (vitals.gcs >= 6) return "Responds to pain";
  return "Unresponsive";
}
