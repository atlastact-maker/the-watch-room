"use client";

// Treatment tab — the ambulance action-menu pane for clinical care of a
// paired casualty. Walks the operator through:
//   1. Primary survey (reveals vitals + red flags)
//   2. A-B-C interventions, gated by the scopes on scene
//   3. Drugs filtered to available scope
//   4. Packaging
//   5. Request additional clinicians (AP / CCC / BASICS / HEMS)
//   6. Destination + ATMIST pre-alert
// Everything below is dispatched via handler props down from dashboard-client.

import { useState } from "react";
import type { Appliance } from "@/lib/sim/types";
import { BodyDiagram } from "./body-diagram";
import {
  AIRWAY_ACTION_REGIONS,
  BREATHING_ACTION_REGIONS,
  CIRCULATION_ACTION_REGIONS,
  DRUG_REGIONS,
  PACKAGING_ACTION_REGIONS,
  actionMatchesRegion,
  type BodyRegion,
} from "@/lib/sim/body_regions";
import type {
  AirwayAction,
  BreathingAction,
  CirculationAction,
  ClinicianScope,
  Deployment,
  DrugName,
  PackagingAction,
  EgressAction,
  PatientTreatmentState,
} from "@/lib/sim/incident_types";
import {
  AIRWAY_MIN_SCOPE,
  EGRESS_CLINICAL_BLOCKS,
  EGRESS_SECONDS,
  BREATHING_MIN_SCOPE,
  DRUG_LABEL,
  DRUG_MIN_SCOPE,
  SCOPE_LEVEL,
  scopeOfApplianceType,
} from "@/lib/sim/incident_types";
import { ResusPanel, type CompressorOption } from "./resus-panel";
import { postRoscIssues } from "@/lib/sim/resus";
import {
  OXYGEN_DEVICE_LABEL,
  OXYGEN_FLOWS,
  OXYGEN_HINT,
  fiO2For,
  oxygenLabel,
  oxygenVerdict,
  type OxygenDevice,
  type OxygenState,
} from "@/lib/sim/oxygen";
import type { AirwayState, MonitorMode, ResusState, ReversibleCause } from "@/lib/sim/resus";
import type {
  HospitalDestinationType,
  PatientClinical,
  PatientRedFlag,
  SceneCasualty,
} from "@/lib/sim/scene";

const SCOPE_LABEL: Record<ClinicianScope, string> = {
  none: "None on scene",
  dca: "Paramedic",
  ap: "Advanced Paramedic",
  ccc: "Critical Care Team",
  basics: "BASICS volunteer doctor",
  hems: "HEMS",
};

const RED_FLAG_LABEL: Record<PatientRedFlag, string> = {
  tension_pneumothorax: "Tension pneumothorax",
  hypovolaemic_shock: "Hypovolaemic shock",
  airway_compromise: "Airway compromise",
  head_injury_severe: "Severe head injury",
  spinal_injury_suspected: "Suspected spinal injury",
  cardiac_arrest: "Cardiac arrest",
  stemi: "STEMI (12-lead)",
  stroke_fast_positive: "Stroke · FAST positive",
  anaphylaxis: "Anaphylaxis",
  severe_asthma: "Severe asthma",
  hypoglycaemia: "Hypoglycaemia",
  seizure_active: "Active seizure",
  major_haemorrhage: "Major haemorrhage",
  overdose_opioid: "Opioid overdose",
};

const DESTINATION_LABEL: Record<HospitalDestinationType, string> = {
  nearest_a_e: "Nearest A&E",
  mtc: "Major Trauma Centre",
  pci: "PCI centre (STEMI)",
  hasu: "Hyperacute Stroke Unit",
  paed_ed: "Paediatric A&E",
  burns: "Burns unit",
  non_convey: "See and treat · non-convey",
};

const AIRWAY_LABEL: Record<AirwayAction, string> = {
  position: "Airway positioning",
  opa: "Insert OPA",
  npa: "Insert NPA",
  igel: "Insert iGel",
  suction: "Suction",
  back_blows: "Back blows",
  abdominal_thrusts: "Abdominal thrusts",
  magill_forceps: "Laryngoscopy · Magill forceps",
  rsi: "RSI · intubate",
};

const BREATHING_LABEL: Record<BreathingAction, string> = {
  oxygen_15l: "Oxygen 15 L NRB",
  bvm: "BVM ventilation",
  needle_decomp: "Needle decompression",
  finger_thoracostomy: "Finger thoracostomy",
};

const CIRC_LABEL: Record<CirculationAction, string> = {
  iv_access: "IV access",
  io_access: "IO access",
  fluids_250: "Crystalloid 250 mL",
  fluids_500: "Crystalloid 500 mL",
  cpr: "CPR cycle",
  defib: "Defibrillate",
};

const PACKAGING_LABEL: Record<PackagingAction, string> = {
  warming: "Active warming",
  assisted_delivery: "Assisted delivery",
  spine_board: "Spine board",
  scoop_stretcher: "Scoop stretcher",
  ked: "KED",
  pelvic_binder: "Pelvic binder",
  tourniquet: "Tourniquet",
  traction_splint: "Traction splint",
  dressings: "Dressings",
  wound_pack: "Wound pack",
};

const CLINICIAN_DESCRIPTION: Record<ClinicianScope, string> = {
  none: "",
  dca: "",
  ap: "Extended formulary · Ketamine, Fentanyl, Amiodarone",
  ccc: "Blood products, finger thoracostomy, RSI (with doctor)",
  basics: "NWPCCC, Warrington-based · rare — an alert, not a dispatch; may not answer",
  hems: "Helicopter + doctor · PHEA, surgical airway, direct MTC",
};

// -- Hover hints — shown on title attribute for each action chip so the
// operator gets a short clinical rationale on mouse-over. Kept terse
// (≤ ~90 chars) so the browser tooltip doesn't wrap too hard.
const AIRWAY_HINT: Record<AirwayAction, string> = {
  position: "Head-tilt / chin-lift. First move for any unconscious airway — no kit needed.",
  opa: "Oropharyngeal airway. For unconscious patients with no gag reflex.",
  npa: "Nasopharyngeal airway. Tolerated by semi-conscious patients; avoid on basal skull #.",
  igel: "Supraglottic airway. Protects a deeply unconscious airway when intubation isn't available.",
  suction: "Clear vomit, blood or secretions from the upper airway.",
  back_blows:
    "Five sharp blows between the shoulder blades. First-line for a choking patient with an ineffective cough.",
  abdominal_thrusts:
    "Five thrusts, alternating with back blows. Chest thrusts instead for an infant under one, or a pregnant patient.",
  magill_forceps:
    "Laryngoscope to look, Magill forceps to remove. For an obstruction you can see and the blows have not shifted.",
  rsi: "Rapid-Sequence Induction. Doctor-led drug-assisted intubation. CCC / HEMS only.",
};

const BREATHING_HINT: Record<BreathingAction, string> = {
  oxygen_15l: "High-flow O₂ via non-rebreathe mask — standard for any hypoxia / major trauma.",
  bvm: "Bag-valve-mask ventilation for inadequate breathing or apnoea.",
  needle_decomp:
    "Tension pneumothorax relief — 14g needle, 2nd IC space mid-clavicular.",
  finger_thoracostomy:
    "Definitive pneumothorax drainage — finger through pleura at 5th IC space. CCC / HEMS.",
};

const CIRC_HINT: Record<CirculationAction, string> = {
  iv_access: "Large-bore cannula, typically ACF. Precursor to fluids / drugs / blood.",
  io_access: "Intraosseous access when IV fails — fast reliable route via humerus or tibia.",
  fluids_250: "Small bolus. Permissive hypotension in trauma — titrate to radial pulse.",
  fluids_500: "Larger bolus. Sepsis / burns / non-traumatic hypovolaemia.",
  cpr: "30:2 chest compressions + ventilations. Minimise pauses; rotate every 2 min.",
  defib: "Shock VF / pulseless VT. 200 J biphasic. Resume CPR immediately after.",
};

const DRUG_HINT: Partial<Record<DrugName, string>> = {
  paracetamol: "Mild–moderate pain, fever. PO or IV.",
  entonox: "Self-administered 50/50 N₂O/O₂ for acute pain. Avoid if pneumothorax.",
  morphine: "Opiate analgesia for moderate–severe pain. Watch respiratory depression.",
  ondansetron: "Anti-emetic — nausea / vomiting prophylaxis before opiates.",
  tXA_iv: "Tranexamic acid — give within 3 hrs of traumatic haemorrhage.",
  fentanyl: "Strong opiate analgesia. AP+. Faster onset than morphine.",
  ketamine_analgesia: "Sub-dissociative pain relief. AP+. Minimal respiratory effect.",
  ketamine_rsi: "Induction agent for RSI. CCC / HEMS only.",
  rocuronium: "Neuromuscular blocker for RSI. CCC / HEMS only.",
  propofol: "Induction / sedation post-RSI. CCC / HEMS only.",
  metaraminol: "Vasopressor for hypotension unresponsive to fluids. CCC+.",
  noradrenaline: "Continuous vasopressor — severe shock. CCC / HEMS.",
  blood_prbc: "Packed red blood cells — major haemorrhage. CCC / HEMS.",
  blood_plasma: "FFP / Lyoplas — trauma-related coagulopathy. CCC / HEMS.",
  aspirin_300: "300 mg chewed — suspected STEMI before conveyance to PCI.",
  gtn_spray: "Sublingual GTN for ischaemic chest pain. Check BP first.",
  salbutamol_neb: "Bronchodilator via nebuliser — acute asthma / COPD.",
  ipratropium_neb: "Anticholinergic bronchodilator — add-on for severe asthma.",
  magnesium_sulfate: "IV Mg — severe asthma resistant to salbutamol. Also obstetric.",
  hydrocortisone: "Steroid — severe asthma, anaphylaxis (late).",
  adrenaline_im_anaphylaxis: "500 μg IM — first-line for anaphylaxis.",
  chlorphenamine: "Anti-histamine — adjunct after adrenaline.",
  adrenaline_cpr: "1 mg IV/IO every 3–5 min during arrest. Not first — follow ALS.",
  amiodarone: "300 mg IV after 3rd shock in VF/pVT. AP+.",
  calcium_chloride: "Hyperkalaemia, CCB overdose, crush injury. CCC+.",
  midazolam_im: "Terminate a prolonged seizure. 10 mg IM adult.",
  glucagon_im: "1 mg IM for hypoglycaemia when IV access unavailable.",
  dextrose_iv: "10% glucose IV bolus — symptomatic hypoglycaemia.",
  naloxone: "Opioid reversal — titrate to respiratory rate, not GCS.",
};

const PACKAGING_HINT: Record<PackagingAction, string> = {
  warming:
    "Blankets, heat pack, warm the saloon. Passive rewarming is all that happens out of hospital — and it is the difference between a cold patient holding and getting colder.",
  assisted_delivery:
    "Deliver in situ. Once the head is visible she is not going anywhere, and you have a second patient coming.",
  spine_board: "Full-spine immobilisation for suspected spinal injury extrication.",
  scoop_stretcher: "Split stretcher — lift onto trolley without axial loading.",
  ked: "Kendrick Extrication Device — seated extrication from vehicles.",
  pelvic_binder: "Apply at greater trochanter level for suspected pelvic #.",
  tourniquet: "Limb catastrophic haemorrhage — apply high & tight, note time.",
  traction_splint: "Mid-shaft femur # — realign and counter-traction.",
  dressings: "Standard wound dressing — bleeding control, sterile cover.",
  wound_pack: "Deep cavity haemorrhage — pack with haemostatic gauze, apply pressure.",
};

const EGRESS_LABEL: Record<EgressAction, string> = {
  walked: "Walked to the vehicle",
  carry_chair: "Carry chair",
  carry_sheet: "Carry sheet",
  manual_carry: "Manual carry",
  trolley: "Trolley",
  vacuum_mattress: "Vacuum mattress",
  wheelchair: "Wheelchair",
};

const EGRESS_HINT: Record<EgressAction, string> = {
  walked:
    "With an arm, if they are steady and nothing is unstable. Quickest by a long way and correct more often than not.",
  carry_chair:
    "Stair chair. The workhorse — but it needs room to turn at the foot of the stairs, and it sits the patient up.",
  carry_sheet:
    "Where a chair will not go: a tight bend, a spiral, a loft ladder. Slower, and it takes more hands.",
  manual_carry:
    "Rough or open ground where nothing rolls. Tiring, slow, and sometimes the only way off.",
  trolley:
    "The ambulance trolley. On the flat, through a door wide enough, with no steps in the way.",
  vacuum_mattress:
    "Moulds around the patient and goes rigid. For a long carry with something unstable in it.",
  wheelchair:
    "Hospital to hospital, or a patient who simply cannot walk far. Not for anything acute.",
};

const DESTINATION_HINT: Record<HospitalDestinationType, string> = {
  nearest_a_e: "Local Emergency Department — default when no specialist need.",
  mtc: "Major Trauma Centre (Salford Royal NW) — multi-system trauma, ISS > 15.",
  pci: "Primary PCI — STEMI confirmed on 12-lead. Target < 120 min call-to-balloon.",
  hasu: "Hyperacute Stroke Unit — FAST+ and within thrombolysis/thrombectomy window.",
  paed_ed: "Paediatric Emergency Dept — children < 16 where specialist cover needed.",
  burns: "Regional burns centre — > 20% BSA, inhalation injury, or special sites.",
  non_convey: "See-and-treat outcome — patient declines or doesn't need conveyance.",
};

export function TreatmentTab({
  casualty,
  treatment,
  pairedDeployments,
  pairedInbound = [],
  resus,
  resusCandidates = [],
  lucasAvailable = false,
  monitorAvailable = false,
  onSetOxygen,
  onSetResusAirway,
  onAttachMonitor,
  onToggleCapnography,
  onSetCompressor,
  onFitLucas,
  onDeliverShock,
  onMovePads,
  onArrestAdrenaline,
  onAmiodarone,
  onSuspectReversible,
  onTreatReversible,
  onStopResus,
  extractionRequired,
  now,
  onStartSurvey,
  onApplyAirway,
  onApplyBreathing,
  onApplyCirculation,
  onAdministerDrug,
  onApplyPackaging,
  onApplyEgress,
  egressBlocked,
  egressExtraSeconds,
  onRequestClinician,
  hemsFlyable,
  onSetDestination,
  onSendAtmist,
  onConveyVia,
}: {
  casualty: SceneCasualty;
  treatment: PatientTreatmentState | null;
  /** On-scene ambulances currently paired with this casualty (in any
   *  phase — at-scene, conveying, or at hospital). Drives the clinical-
   *  scope computation and the conveyance picker. */
  /** Clinicians physically with the patient — already filtered to
   *  arrived units that actually carry a clinical scope. */
  pairedDeployments: { deployment: Deployment; appliance: Appliance }[];
  /** Assigned to this patient but still running. Nothing can be done to
   *  the patient on their account yet, but the panel should say who is
   *  coming and when rather than claiming no crew is assigned. */
  pairedInbound?: { deployment: Deployment; appliance: Appliance }[];
  /** Arrest board — present only while this patient is in cardiac arrest. */
  resus?: ResusState;
  resusCandidates?: CompressorOption[];
  lucasAvailable?: boolean;
  monitorAvailable?: boolean;
  onSetOxygen?: (casualtyId: string, device: OxygenDevice, flowLpm: number, by: string) => void;
  onSetResusAirway?: (a: AirwayState) => void;
  onAttachMonitor?: (m: MonitorMode) => void;
  onToggleCapnography?: () => void;
  onSetCompressor?: (crew: CompressorOption) => void;
  onFitLucas?: () => void;
  onDeliverShock?: () => void;
  onMovePads?: () => void;
  onArrestAdrenaline?: (by: string) => void;
  onAmiodarone?: (by: string) => void;
  onSuspectReversible?: (cause: ReversibleCause) => void;
  onTreatReversible?: (cause: ReversibleCause) => void;
  onStopResus?: () => void;
  /** True while the casualty is still inside the hazard zone and has
   *  not been extracted yet. When true the treatment menu is locked —
   *  paramedics don't enter the fire. */
  extractionRequired: boolean;
  now: number;
  onStartSurvey: (casualtyId: string) => void;
  onApplyAirway: (casualtyId: string, action: AirwayAction, by: string) => void;
  onApplyBreathing: (casualtyId: string, action: BreathingAction, by: string) => void;
  onApplyCirculation: (casualtyId: string, action: CirculationAction, by: string) => void;
  onAdministerDrug: (casualtyId: string, drug: DrugName, by: string) => void;
  onApplyPackaging: (casualtyId: string, action: PackagingAction, by: string) => void;
  onApplyEgress: (casualtyId: string, action: EgressAction, by: string) => void;
  /** Ways out this scene will not allow, each with its reason. */
  egressBlocked?: import("@/lib/sim/scene").EgressBlock[];
  /** Seconds this scene adds to any carry — height, distance, ground. */
  egressExtraSeconds?: number;
  onRequestClinician: (scope: "ap" | "ccc" | "basics" | "hems", casualtyId: string) => void;
  /** Whether the NWAA airframe can fly right now (daylight + weather).
   *  Undefined is treated as flyable. */
  hemsFlyable?: boolean;
  onSetDestination: (casualtyId: string, type: HospitalDestinationType, name: string) => void;
  onSendAtmist: (casualtyId: string) => void;
  /** Kick off the hospital conveyance leg using the picked on-scene
   *  ambulance, carrying the paired casualty. Called after ATMIST has
   *  been sent. */
  onConveyVia?: (applianceId: string, casualtyId: string) => void;
}) {
  const casualtyId = casualty.id;
  // Body-diagram region focus. When null, all actions are shown at full
  // strength; when set, off-region actions dim so the operator can see
  // what's relevant to the site they're working on.
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion | null>(null);

  // Block the whole workflow while a fire-zone casualty awaits
  // extraction — paramedics wait at the RVP, they don't enter.
  if (extractionRequired) {
    return (
      <div className="rounded-sm border border-(--color-critical)/50 bg-(--color-critical)/5 p-3 text-xs">
        <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-critical)">
          Awaiting extraction
        </div>
        <p className="mt-1 font-mono text-[10px] leading-snug text-(--color-text-muted)">
          Casualty is still inside the hazard zone. Treatment starts once BA
          crews have extracted them to the RVP / safe area. Commit a BA team
          and use &ldquo;Extract casualty&rdquo; in the vehicle action panel.
        </p>
      </div>
    );
  }

  // Nothing can be done to a patient nobody is standing over. This gate
  // runs before the treatment record is considered, because the record
  // survives a crew being released — without it, a casualty whose crew
  // had been stood down still offered a primary survey.
  if (pairedDeployments.length === 0) {
    if (pairedInbound.length > 0) {
      const next = pairedInbound.reduce((soonest, p) =>
        p.deployment.arrivesAt < soonest.deployment.arrivesAt ? p : soonest,
      );
      const etaSec = Math.max(0, Math.round((next.deployment.arrivesAt - now) / 1000));
      const etaLabel =
        etaSec >= 3600
          ? "awaiting a landing zone"
          : etaSec >= 60
            ? `${Math.round(etaSec / 60)} min`
            : `${etaSec}s`;
      return (
        <div className="rounded-sm border border-(--color-info)/40 bg-(--color-info)/5 p-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-info)">
            Crew running
          </div>
          <p className="mt-1 font-mono text-[10px] leading-snug text-(--color-text-muted)">
            {next.appliance.callsign} assigned to this patient — ETA {etaLabel}.
            The survey starts when they are physically with the patient, not
            when they are mobilised.
          </p>
          {pairedInbound.length > 1 && (
            <p className="mt-1 font-mono text-[10px] leading-snug text-(--color-text-dim)">
              {pairedInbound.length} resources assigned and running.
            </p>
          )}
        </div>
      );
    }
    return (
      <div className="rounded-sm border border-(--color-amber)/40 bg-(--color-amber)/5 p-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
          No crew assigned
        </div>
        <p className="mt-1 font-mono text-[10px] leading-snug text-(--color-text-muted)">
          Assign a paramedic (or higher-scope clinician) from the list above
          to start the treatment workflow. A vehicle carrying a defib is not
          a clinician — it takes an ambulance resource on scene.
        </p>
      </div>
    );
  }

  if (!treatment) {
    // Paired but the record hasn't been seeded yet — render skeleton.
    return (
      <p className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
        Preparing patient record…
      </p>
    );
  }

  // Scope + paired chip list derived from paired deployments. Conveyance
  // needs a stretcher: only a DCA (box-body ambulance) or the air
  // ambulance can carry the patient — an RRV or critical-care car brings
  // the clinician, not the ride.
  const paired = pairedDeployments.map(({ appliance, deployment }) => ({
    applianceId: deployment.applianceId,
    callsign: appliance.callsign,
    scope: scopeOfApplianceType(appliance.type),
    canConvey:
      appliance.type === "DCA" ||
      (appliance.type === "HEMS" && hemsFlyable !== false),
  }));
  const scope: ClinicianScope = paired.length === 0
    ? "none"
    : paired.reduce(
        (best, p) => (SCOPE_LEVEL[p.scope] > SCOPE_LEVEL[best] ? p.scope : best),
        "dca" as ClinicianScope,
      );
  const scopeLvl = SCOPE_LEVEL[scope];
  // By-label for logging: pick the highest-scope callsign, otherwise "Crew".
  const lead = paired.find((p) => p.scope === scope);
  const byLabel = lead?.callsign ?? "Crew";

  // Lifecycle — derive from any paired deployment.
  const convoy = pairedDeployments.find(({ deployment }) => deployment.hospitalLegStartedAt);
  const conveying = !!convoy;
  const atHospital =
    !!convoy &&
    convoy.deployment.hospitalArrivesAt !== undefined &&
    now >= convoy.deployment.hospitalArrivesAt;
  const surveyRunning =
    treatment.surveyStartedAt !== undefined && !treatment.surveyCompletedAt;
  const surveyDone = !!treatment.surveyCompletedAt;
  const surveyProgressSec = surveyRunning
    ? Math.min(60, Math.max(0, (now - treatment.surveyStartedAt!) / 1000))
    : 0;

  // If we're en route / at hospital, the on-scene menu is no longer
  // relevant — render a monitoring view instead.
  if (conveying || atHospital) {
    return (
      <ConveyingView
        treatment={treatment}
        deployment={convoy!.deployment}
        pairedCasualty={casualty}
        now={now}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* ---- Header: clinical-lead scope banner (patient label lives in
               the enclosing casualty card, so we don't repeat it). ---- */}
      <div className="rounded-sm border border-(--color-ok)/40 bg-(--color-ok)/5 p-2 font-mono text-[10px] uppercase tracking-widest">
        <div className="flex items-center justify-between gap-2">
          <span className="text-(--color-text-dim)">Clinical lead</span>
          <span className="text-(--color-ok)">{SCOPE_LABEL[scope]}</span>
        </div>
      </div>

      {/* ---- Primary survey ---- */}
      {!surveyDone && (
        <Section title="Primary survey">
          {surveyRunning ? (
            <div className="rounded-sm border border-(--color-amber)/40 bg-(--color-amber)/5 p-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
                  Survey in progress
                </span>
                <span className="font-mono text-[11px] tabular-nums text-(--color-amber)">
                  {Math.round(surveyProgressSec)}s / 60s
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-sm bg-(--color-bg)">
                <div
                  className="h-full bg-(--color-amber) transition-all"
                  style={{ width: `${(surveyProgressSec / 60) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <BigBtn
              label="Start primary survey · ~60s"
              detail="Airway · Breathing · Circulation · Disability · Exposure"
              onClick={() => onStartSurvey(casualtyId)}
            />
          )}
        </Section>
      )}

      {/* ---- Resuscitation ----
          Owns the arrest once one is running: the cycle clock, the
          monitor, whoever is on the chest, the shocks and the drugs.
          CPR and defib are deliberately pulled out of the Circulation
          group below so there is exactly one place to run an arrest. */}
      {resus && (
        <Section title="Resuscitation · ALS">
          <ResusPanel
            state={resus}
            now={now}
            scope={scope}
            candidates={resusCandidates}
            lucasAvailable={lucasAvailable}
            monitorAvailable={monitorAvailable}
            postRoscIssues={postRoscIssues(resus, treatment.liveVitals ?? treatment.revealedVitals)}
            vitals={treatment.liveVitals ?? treatment.revealedVitals}
            onSetAirway={(a) => onSetResusAirway?.(a)}
            onAttachMonitor={(m) => onAttachMonitor?.(m)}
            onToggleCapnography={() => onToggleCapnography?.()}
            onSetCompressor={(c) => onSetCompressor?.(c)}
            onFitLucas={() => onFitLucas?.()}
            onShock={() => onDeliverShock?.()}
            onMovePads={() => onMovePads?.()}
            onAdrenaline={() => onArrestAdrenaline?.(byLabel)}
            onAmiodarone={() => onAmiodarone?.(byLabel)}
            onSuspectReversible={(c) => onSuspectReversible?.(c)}
            onTreatReversible={(c) => onTreatReversible?.(c)}
            onStopResus={() => onStopResus?.()}
          />
        </Section>
      )}

      {/* ---- Clinical findings ---- */}
      {surveyDone && (treatment.liveVitals ?? treatment.revealedVitals) && (
        <Section title="Clinical findings">
          <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/40 px-3 py-2">
            <VitalsGrid
              vitals={treatment.liveVitals ?? treatment.revealedVitals!}
              prev={treatment.prevLiveVitals ?? treatment.revealedVitals}
            />
            {treatment.revealedCondition && (
              <p className="mt-2 text-[12px] text-(--color-text)">
                {treatment.revealedCondition}
              </p>
            )}
          </div>
          {(treatment.revealedRedFlags ?? []).length > 0 && (
            <div className="mt-3">
              <BodyDiagram
                revealed={treatment.revealedRedFlags ?? []}
                active={
                  treatment.activeRedFlags ?? treatment.revealedRedFlags ?? []
                }
                selected={selectedRegion}
                onSelect={setSelectedRegion}
              />
            </div>
          )}
        </Section>
      )}

      {/* ---- A-B-C interventions ---- */}
      {surveyDone && (
        <Section title="Interventions · A-B-C">
          <div className="space-y-2">
            <Subgroup label="Airway" regions="head · neck">
              {(Object.keys(AIRWAY_LABEL) as AirwayAction[]).map((a) => {
                const required = AIRWAY_MIN_SCOPE[a];
                const allowed = scopeLvl >= SCOPE_LEVEL[required];
                const done = treatment.airway[a] !== undefined;
                const outOfRegion = !actionMatchesRegion(
                  AIRWAY_ACTION_REGIONS[a],
                  selectedRegion,
                );
                return (
                  <ActionChip
                    key={a}
                    label={AIRWAY_LABEL[a]}
                    done={done}
                    allowed={allowed}
                    requires={required}
                    hint={AIRWAY_HINT[a]}
                    outOfRegion={outOfRegion}
                    onClick={() => onApplyAirway(casualtyId, a, byLabel)}
                  />
                );
              })}
            </Subgroup>
            <Subgroup label="Breathing" regions="chest · head">
              {(Object.keys(BREATHING_LABEL) as BreathingAction[]).map((a) => {
                const required = BREATHING_MIN_SCOPE[a];
                const allowed = scopeLvl >= SCOPE_LEVEL[required];
                const done = treatment.breathing[a] !== undefined;
                // Needle-decomp / thoracostomy only offered when the
                // tension-pneumothorax flag is present.
                const relevant =
                  (a !== "needle_decomp" && a !== "finger_thoracostomy") ||
                  (treatment.revealedRedFlags ?? []).includes("tension_pneumothorax");
                if (!relevant) return null;
                const outOfRegion = !actionMatchesRegion(
                  BREATHING_ACTION_REGIONS[a],
                  selectedRegion,
                );
                return (
                  <ActionChip
                    key={a}
                    label={BREATHING_LABEL[a]}
                    done={done}
                    allowed={allowed}
                    requires={required}
                    hint={BREATHING_HINT[a]}
                    outOfRegion={outOfRegion}
                    onClick={() => onApplyBreathing(casualtyId, a, byLabel)}
                  />
                );
              })}
            </Subgroup>
            {/* Oxygen is a titration, not a switch. JRCALC targets a
                saturation, and after an arrest you come DOWN. */}
            <div className="col-span-full">
              <OxygenControl
                oxygen={treatment.oxygen}
                spo2={(treatment.liveVitals ?? treatment.revealedVitals)?.spo2}
                onSet={(device, flowLpm) =>
                  onSetOxygen?.(casualtyId, device, flowLpm, byLabel)
                }
              />
            </div>
            <Subgroup label="Circulation" regions="chest · arms · legs">
              {(Object.keys(CIRC_LABEL) as CirculationAction[]).map((a) => {
                const done = treatment.circulation[a] !== undefined;
                // CPR/defib only relevant on cardiac arrest.
                const relevant =
                  // CPR and defib belong to the resuscitation board above,
                  // which runs them as a cycle rather than a one-off tick.
                  // They only appear here as a fallback if no arrest board
                  // has been opened for this patient.
                  (a !== "cpr" && a !== "defib") ||
                  (!resus &&
                    (treatment.activeRedFlags ?? treatment.revealedRedFlags ?? []).includes(
                      "cardiac_arrest",
                    ));
                if (!relevant) return null;
                const outOfRegion = !actionMatchesRegion(
                  CIRCULATION_ACTION_REGIONS[a],
                  selectedRegion,
                );
                return (
                  <ActionChip
                    key={a}
                    label={CIRC_LABEL[a]}
                    done={done}
                    allowed
                    hint={CIRC_HINT[a]}
                    outOfRegion={outOfRegion}
                    onClick={() => onApplyCirculation(casualtyId, a, byLabel)}
                  />
                );
              })}
            </Subgroup>
          </div>
        </Section>
      )}

      {/* ---- Drugs ---- */}
      {surveyDone && (
        <Section title="Drugs">
          <div className="grid grid-cols-1 gap-1">
            {(Object.keys(DRUG_LABEL) as DrugName[])
              .filter((d) => drugRelevantFor(d, treatment.revealedRedFlags ?? []))
              .map((d) => {
                const required = DRUG_MIN_SCOPE[d];
                const allowed = scopeLvl >= SCOPE_LEVEL[required];
                const done = treatment.drugs[d] !== undefined;
                const outOfRegion = !actionMatchesRegion(
                  DRUG_REGIONS[d] ?? ["systemic"],
                  selectedRegion,
                );
                return (
                  <ActionChip
                    key={d}
                    label={DRUG_LABEL[d]}
                    done={done}
                    allowed={allowed}
                    requires={required}
                    hint={DRUG_HINT[d]}
                    outOfRegion={outOfRegion}
                    onClick={() => onAdministerDrug(casualtyId, d, byLabel)}
                  />
                );
              })}
          </div>
        </Section>
      )}

      {/* ---- Egress ----
          Not what is strapped to the patient but how they physically
          reach the vehicle, which the building decides more than the
          injury does. A method the scene will not take is shown with the
          reason on it — a greyed button that does not say why is just a
          broken button. */}
      {surveyDone && (
        <Section title="Egress · to the vehicle">
          <div className="grid grid-cols-2 gap-1">
            {(Object.keys(EGRESS_LABEL) as EgressAction[]).map((a) => {
              const done = (treatment.egress ?? {})[a] !== undefined;
              const block = egressBlocked?.find(
                (b: import("@/lib/sim/scene").EgressBlock) => b.action === a,
              );
              // What the patient will take. Live flags, so treating the
              // thing that stopped them walking unlocks walking.
              const flags = treatment.activeRedFlags ?? [];
              const clinical = EGRESS_CLINICAL_BLOCKS.find(
                (r) => r.actions.includes(a) && flags.includes(r.flag),
              );
              const reason = block?.reason ?? clinical?.reason;
              return (
                <ActionChip
                  key={a}
                  label={EGRESS_LABEL[a]}
                  hint={reason ?? EGRESS_HINT[a]}
                  done={done}
                  allowed={!reason}
                  onClick={() => onApplyEgress(casualtyId, a, byLabel)}
                />
              );
            })}
          </div>
          {(() => {
            const moves = (
              Object.entries(treatment.egress ?? {}) as [EgressAction, number][]
            ).sort((a, b) => b[1] - a[1]);
            if (moves.length === 0) return null;
            const [method, startedAt] = moves[0];
            const total =
              (EGRESS_SECONDS[method] + (egressExtraSeconds ?? 0)) * 1000;
            const left = Math.max(0, startedAt + total - now);
            const mins = Math.floor(left / 60000);
            const secs = Math.floor((left % 60000) / 1000);
            return (
              <div
                className={
                  "mt-1.5 font-mono text-[10px] uppercase tracking-widest " +
                  (left > 0 ? "text-(--color-amber)" : "text-(--color-ok)")
                }
              >
                {left > 0
                  ? EGRESS_LABEL[method] +
                    " · " +
                    mins +
                    ":" +
                    String(secs).padStart(2, "0") +
                    " to the vehicle"
                  : EGRESS_LABEL[method] + " · at the vehicle"}
              </div>
            );
          })()}
        </Section>
      )}

      {/* ---- Packaging ---- */}
      {surveyDone && (
        <Section title="Packaging">
          <div className="grid grid-cols-2 gap-1">
            {(Object.keys(PACKAGING_LABEL) as PackagingAction[]).map((a) => {
              const done = treatment.packaging[a] !== undefined;
              const outOfRegion = !actionMatchesRegion(
                PACKAGING_ACTION_REGIONS[a],
                selectedRegion,
              );
              return (
                <ActionChip
                  key={a}
                  label={PACKAGING_LABEL[a]}
                  done={done}
                  allowed
                  hint={PACKAGING_HINT[a]}
                  outOfRegion={outOfRegion}
                  onClick={() => onApplyPackaging(casualtyId, a, byLabel)}
                />
              );
            })}
          </div>
        </Section>
      )}

      {/* ---- Request additional clinicians ---- */}
      {surveyDone && (
        <Section title="Request additional clinician">
          <div className="grid grid-cols-1 gap-1.5">
            {(["ap", "ccc", "basics", "hems"] as const).map((s) => {
              const alreadyOn = scopeLvl >= SCOPE_LEVEL[s];
              // HEMS has two response modes — the airframe (daylight,
              // needs an LZ picked on the ground view) or the NWAA
              // critical-care car overnight / in grounding weather.
              const br = s === "basics" ? treatment.basicsRequest : undefined;
              const brPending = br && (br.stage === "cih" || br.stage === "broadcast");
              const brLeft = br ? Math.max(0, Math.ceil((br.nextAt - now) / 1000)) : 0;
              const description =
                s === "hems"
                  ? hemsFlyable === false
                    ? "Aircraft grounded (night/weather) — NWAA car responds by road: doctor + critical care paramedic"
                    : "Helicopter + doctor team — select a landing zone on the ground view"
                  : br
                    ? br.stage === "cih"
                      ? "With the NWAS Complex Incident Hub · " + brLeft + " s"
                      : br.stage === "broadcast"
                        ? "Alert out to " + br.alerted + " handset" + (br.alerted === 1 ? "" : "s") + " within 20 miles · " + brLeft + " s to answer"
                        : br.stage === "answered"
                          ? (br.winnerCallsign ?? "Responder") + " answered · mobilising from home or work"
                          : br.stage === "declined"
                            ? "Hub declined — NWAA critical care asset instead. Request HEMS or the car"
                            : "No response · nearest scheme cover is Warrington-based · request again or use NWAA"
                    : CLINICIAN_DESCRIPTION[s];
              return (
                <button
                  key={s}
                  type="button"
                  disabled={alreadyOn || !!brPending}
                  onClick={() => onRequestClinician(s, casualtyId)}
                  className={
                    "flex flex-col items-start gap-0.5 rounded-sm border px-2 py-1.5 text-left transition-colors " +
                    (alreadyOn
                      ? "cursor-not-allowed border-(--color-ok)/40 bg-(--color-ok)/5 text-(--color-text-dim)"
                      : "border-(--color-border) hover:border-(--color-amber-dim) text-(--color-text)")
                  }
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-[12px]">
                      {SCOPE_LABEL[s]}
                      {s === "hems" && hemsFlyable === false ? " · Night car" : ""}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-amber)">
                      {alreadyOn ? "On scene" : brPending ? "Requested" : br?.stage === "answered" ? "Coming" : "Request"}
                    </span>
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                    {description}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* ---- Destination + ATMIST ---- */}
      {surveyDone && (
        <Section title="Destination">
          <div className="space-y-1">
            {(Object.keys(DESTINATION_LABEL) as HospitalDestinationType[]).map((t) => {
              const preferred = treatment.preferredDestination === t;
              const chosen = treatment.chosenDestination?.type === t;
              return (
                <button
                  key={t}
                  type="button"
                  title={DESTINATION_HINT[t]}
                  onClick={() => onSetDestination(casualtyId, t, DESTINATION_LABEL[t])}
                  className={
                    "flex w-full items-center justify-between gap-2 rounded-sm border px-2 py-1.5 text-left " +
                    (chosen
                      ? "border-(--color-ok) bg-(--color-ok)/15 text-(--color-ok)"
                      : preferred
                        ? "border-(--color-amber)/60 bg-(--color-amber)/10 text-(--color-text)"
                        : "border-(--color-border-subtle) text-(--color-text) hover:border-(--color-amber-dim)")
                  }
                >
                  <span className="text-[12px]">{DESTINATION_LABEL[t]}</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest">
                    {chosen ? "Chosen" : preferred ? "Recommended" : "Select"}
                  </span>
                </button>
              );
            })}
          </div>
          {treatment.chosenDestination && !treatment.atmistSentAt && (
            <button
              type="button"
              onClick={() => onSendAtmist(casualtyId)}
              className="mt-2 w-full rounded-sm border border-(--color-amber) bg-(--color-amber)/15 px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/25"
            >
              Send ATMIST pre-alert · {treatment.chosenDestination.name}
            </button>
          )}
          {treatment.atmistSentAt && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-(--color-ok)">
              ✓ ATMIST pre-alert sent — receiving unit informed
            </p>
          )}
        </Section>
      )}

      {/* ---- Conveyance picker — stretcher-capable units only ---- */}
      {surveyDone && treatment.atmistSentAt && !conveying && (
        <Section title="Convey via">
          {paired.filter((p) => p.canConvey).length === 0 ? (
            <p className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
              No stretcher unit paired. Only a DCA — or the air ambulance —
              can convey; RRVs and cars stay on scene. Pair a DCA to carry
              this patient.
            </p>
          ) : (
            <div className="space-y-1">
              {paired.map((p) =>
                p.canConvey ? (
                  <button
                    key={p.applianceId}
                    type="button"
                    onClick={() => onConveyVia?.(p.applianceId, casualtyId)}
                    className="flex w-full items-center justify-between gap-2 rounded-sm border border-(--color-info)/60 bg-(--color-info)/10 px-2 py-1.5 text-left text-(--color-info) hover:bg-(--color-info)/20"
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-[12px]">{p.callsign}</span>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                        {SCOPE_LABEL[p.scope]}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-widest">
                      Convey
                    </span>
                  </button>
                ) : (
                  <div
                    key={p.applianceId}
                    className="flex w-full items-center justify-between gap-2 rounded-sm border border-(--color-border-subtle) px-2 py-1.5 opacity-60"
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-[12px] text-(--color-text-dim)">
                        {p.callsign}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-muted)">
                        {SCOPE_LABEL[p.scope]}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-muted)">
                      No stretcher
                    </span>
                  </div>
                ),
              )}
              <p className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                Clinician stays with patient to hospital. Other paired units are released.
              </p>
            </div>
          )}
        </Section>
      )}

      {/* ---- Event timeline ---- */}
      {treatment.events.length > 0 && (
        <Section title="Treatment timeline">
          <ol className="max-h-[180px] overflow-y-auto rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/40 px-2 py-1.5">
            {treatment.events.slice().reverse().map((e, i) => (
              <li
                key={`${e.kind}-${i}-${"at" in e ? e.at : ""}`}
                className="flex gap-2 py-0.5 font-mono text-[10px] leading-snug"
              >
                <span className="shrink-0 text-(--color-text-dim)">
                  {fmtTime("at" in e ? e.at : 0)}
                </span>
                <span className="text-(--color-text)">{describeEvent(e)}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Subgroup({
  label,
  regions,
  children,
}: {
  label: string;
  /** Anatomical regions this subgroup mostly acts on — rendered as a
   *  small hint next to the title so the operator knows why chips dim
   *  when a body-diagram region is picked. */
  regions?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
          {label}
        </div>
        {regions && (
          <div className="font-mono text-[9px] tracking-widest text-(--color-text-dim)/80">
            {regions}
          </div>
        )}
      </div>
      <div className="mt-1 grid grid-cols-2 gap-1">{children}</div>
    </div>
  );
}

function ActionChip({
  label,
  done,
  allowed,
  requires,
  hint,
  onClick,
  outOfRegion,
}: {
  label: string;
  done: boolean;
  allowed: boolean;
  requires?: ClinicianScope;
  /** Clinical hint shown on hover — brief explanation of what the
   *  intervention is and when to use it. Combined with the scope-gate
   *  message if the chip is disabled for scope reasons. */
  hint?: string;
  onClick: () => void;
  /** True when the body diagram has a region selected and this chip's
   *  action isn't relevant to it. The chip still works — it just fades
   *  so the region-relevant options stand out. */
  outOfRegion?: boolean;
}) {
  const tone = done
    ? "border-(--color-ok)/50 bg-(--color-ok)/10 text-(--color-ok)"
    : allowed
      ? "border-(--color-border) bg-(--color-surface-raised) text-(--color-text) hover:border-(--color-amber-dim)"
      : "border-(--color-border)/50 bg-(--color-surface-raised)/40 text-(--color-text-dim)";
  const title = [
    hint,
    !allowed && requires ? `Requires ${SCOPE_LABEL[requires]} or higher` : null,
  ]
    .filter(Boolean)
    .join(" — ");
  return (
    <button
      type="button"
      disabled={!allowed || done}
      onClick={onClick}
      title={title || undefined}
      className={
        "flex items-center justify-between gap-2 rounded-sm border px-2 py-1 text-left transition-colors disabled:cursor-not-allowed " +
        tone +
        (outOfRegion && !done ? " opacity-40" : "")
      }
    >
      <span className="truncate text-[11px]">{done ? "✓ " : ""}{label}</span>
      {!allowed && requires && (
        <span className="font-mono text-[8px] uppercase tracking-widest text-(--color-text-dim)">
          {requires.toUpperCase()}
        </span>
      )}
    </button>
  );
}

function BigBtn({
  label,
  detail,
  onClick,
}: {
  label: string;
  detail?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-start rounded-sm border border-(--color-amber) bg-(--color-amber)/10 px-3 py-2 text-left transition-colors hover:bg-(--color-amber)/20"
    >
      <span className="font-mono text-[12px] uppercase tracking-widest text-(--color-amber)">
        {label}
      </span>
      {detail && (
        <span className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
          {detail}
        </span>
      )}
    </button>
  );
}

function VitalsGrid({
  vitals,
  prev,
}: {
  vitals: PatientClinical["vitals"];
  prev?: PatientClinical["vitals"];
}) {
  const items: { key: string; label: string; value: number; display: string; tone: string; invertArrow?: boolean }[] = [
    { key: "rr", label: "RR", value: vitals.rr, display: `${Math.round(vitals.rr)}`, tone: toneRR(vitals.rr) },
    { key: "spo2", label: "SpO₂", value: vitals.spo2, display: `${Math.round(vitals.spo2)}%`, tone: toneSpO2(vitals.spo2) },
    { key: "hr", label: "HR", value: vitals.hr, display: `${Math.round(vitals.hr)}`, tone: toneHR(vitals.hr) },
    { key: "bpSys", label: "BP", value: vitals.bpSys, display: `${Math.round(vitals.bpSys)}/${Math.round(vitals.bpDia)}`, tone: toneBP(vitals.bpSys) },
    { key: "gcs", label: "GCS", value: vitals.gcs, display: `${Math.round(vitals.gcs)}/15`, tone: toneGCS(vitals.gcs) },
    { key: "temp", label: "Temp", value: vitals.temp, display: `${vitals.temp.toFixed(1)}°`, tone: "text-(--color-text)" },
    { key: "bm", label: "BM", value: vitals.bm, display: `${vitals.bm.toFixed(1)}`, tone: toneBM(vitals.bm) },
  ];
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {items.map((it) => {
        const arrow = trendArrow(it.value, prev ? prev[it.key as keyof PatientClinical["vitals"]] : undefined);
        return (
          <div key={it.key} className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface) px-1.5 py-1">
            <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
              {it.label}
            </div>
            <div className={`flex items-baseline gap-1 font-mono text-[12px] tabular-nums ${it.tone}`}>
              <span>{it.display}</span>
              {arrow && (
                <span className="font-mono text-[10px] text-(--color-text-dim)">{arrow}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Returns ↑ / ↓ if the value has moved > a small noise threshold
 *  since the previous tick, else null. */
function trendArrow(current: number, prev?: number): string | null {
  if (prev === undefined) return null;
  const delta = current - prev;
  if (Math.abs(delta) < 0.3) return null;
  return delta > 0 ? "↑" : "↓";
}

function ConveyingView({
  treatment,
  deployment,
  pairedCasualty,
  now,
}: {
  treatment: PatientTreatmentState;
  deployment: Deployment;
  pairedCasualty: SceneCasualty;
  now: number;
}) {
  const etaSec =
    deployment.hospitalArrivesAt !== undefined
      ? Math.max(0, (deployment.hospitalArrivesAt - now) / 1000)
      : 0;
  const atHospital =
    deployment.hospitalArrivesAt !== undefined && now >= deployment.hospitalArrivesAt;
  return (
    <div className="space-y-3">
      <div className="rounded-sm border border-(--color-info)/40 bg-(--color-info)/5 p-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-info)">
          {atHospital ? "At hospital · offloading" : "En route to hospital"}
        </div>
        <div className="mt-1 text-[13px] text-(--color-text)">
          {pairedCasualty.label ?? pairedCasualty.id}
        </div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
          → {deployment.hospitalName ?? "hospital"} · ETA {fmtMin(etaSec)}
        </div>
        {treatment.atmistSentAt && (
          <div className="mt-2 font-mono text-[9px] uppercase tracking-widest text-(--color-ok)">
            ✓ ATMIST pre-alert sent
          </div>
        )}
      </div>
      {(treatment.liveVitals ?? treatment.revealedVitals) && (
        <Section title="En-route vitals">
          <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/40 px-3 py-2">
            <VitalsGrid
              vitals={treatment.liveVitals ?? treatment.revealedVitals!}
              prev={treatment.prevLiveVitals ?? treatment.revealedVitals}
            />
          </div>
        </Section>
      )}
      <Section title="Treatment given">
        <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/40 px-3 py-2">
          <TreatmentSummary treatment={treatment} />
        </div>
      </Section>
    </div>
  );
}

function TreatmentSummary({ treatment }: { treatment: PatientTreatmentState }) {
  const rows: { label: string; items: string[] }[] = [
    {
      label: "Airway / Breathing",
      items: [
        ...Object.keys(treatment.airway).map((k) => AIRWAY_LABEL[k as AirwayAction]),
        ...Object.keys(treatment.breathing).map((k) => BREATHING_LABEL[k as BreathingAction]),
      ],
    },
    {
      label: "Circulation",
      items: Object.keys(treatment.circulation).map((k) => CIRC_LABEL[k as CirculationAction]),
    },
    {
      label: "Drugs",
      items: Object.keys(treatment.drugs).map((k) => DRUG_LABEL[k as DrugName]),
    },
    {
      label: "Packaging",
      items: Object.keys(treatment.packaging).map((k) => PACKAGING_LABEL[k as PackagingAction]),
    },
  ];
  return (
    <dl className="space-y-1">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[7rem_1fr] gap-2 text-[11px]">
          <dt className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
            {r.label}
          </dt>
          <dd className="text-(--color-text)">
            {r.items.length === 0 ? (
              <span className="text-(--color-text-dim)">—</span>
            ) : (
              r.items.join(", ")
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function drugRelevantFor(drug: DrugName, redFlags: PatientRedFlag[]): boolean {
  // Always show analgesia + IV access drugs. Condition-specific drugs are
  // only offered when the relevant red flag is present so the menu stays
  // focused on this patient.
  switch (drug) {
    case "paracetamol":
    case "entonox":
    case "morphine":
    case "ondansetron":
    case "tXA_iv":
    case "fentanyl":
    case "ketamine_analgesia":
    case "ketamine_rsi":
    case "rocuronium":
    case "propofol":
    case "metaraminol":
    case "noradrenaline":
    case "blood_prbc":
    case "blood_plasma":
      return true;
    case "aspirin_300":
    case "gtn_spray":
      return redFlags.includes("stemi");
    case "salbutamol_neb":
    case "ipratropium_neb":
    case "magnesium_sulfate":
    case "hydrocortisone":
      return redFlags.includes("severe_asthma");
    case "adrenaline_im_anaphylaxis":
    case "chlorphenamine":
      return redFlags.includes("anaphylaxis");
    case "adrenaline_cpr":
    case "amiodarone":
    case "calcium_chloride":
      return redFlags.includes("cardiac_arrest");
    case "midazolam_im":
      return redFlags.includes("seizure_active");
    case "glucagon_im":
    case "dextrose_iv":
      return redFlags.includes("hypoglycaemia");
    case "naloxone":
      return redFlags.includes("overdose_opioid");
  }
}

function describeEvent(e: PatientTreatmentState["events"][number]): string {
  switch (e.kind) {
    case "survey_started":
      return "Primary survey started";
    case "survey_completed":
      return "Primary survey complete · findings revealed";
    case "egress":
      return "Moved · " + EGRESS_LABEL[e.action];
    case "airway":
      return `Airway: ${AIRWAY_LABEL[e.action]} (${e.by})`;
    case "breathing":
      return `Breathing: ${BREATHING_LABEL[e.action]} (${e.by})`;
    case "circulation":
      return `Circulation: ${CIRC_LABEL[e.action]} (${e.by})`;
    case "drug":
      return `Drug: ${DRUG_LABEL[e.drug]} (${e.by})`;
    case "packaging":
      return `Packaging: ${PACKAGING_LABEL[e.action]} (${e.by})`;
    case "clinician_requested":
      return `${SCOPE_LABEL[e.scope]} requested`;
    case "basics_alert":
      return e.stage === "cih"
        ? "BASICS · with the Complex Incident Hub"
        : e.stage === "broadcast"
          ? "BASICS · alert to responder handsets"
          : e.stage === "answered"
            ? `BASICS · ${e.callsign ?? "responder"} answered`
            : e.stage === "declined"
              ? "BASICS · hub declined, NWAA asset instead"
              : "BASICS · no response";
    case "clinician_on_scene":
      return `${SCOPE_LABEL[e.scope]} on scene`;
    case "destination_set":
      return `Destination: ${e.name}`;
    case "atmist_sent":
      return "ATMIST pre-alert sent";
  }
}

function toneRR(v: number): string {
  if (v < 10 || v > 25) return "text-(--color-critical)";
  if (v < 12 || v > 20) return "text-(--color-amber)";
  return "text-(--color-ok)";
}
function toneSpO2(v: number): string {
  if (v < 92) return "text-(--color-critical)";
  if (v < 95) return "text-(--color-amber)";
  return "text-(--color-ok)";
}
function toneHR(v: number): string {
  if (v < 40 || v > 140) return "text-(--color-critical)";
  if (v < 60 || v > 110) return "text-(--color-amber)";
  return "text-(--color-ok)";
}
function toneBP(sys: number): string {
  if (sys < 90) return "text-(--color-critical)";
  if (sys < 100 || sys > 180) return "text-(--color-amber)";
  return "text-(--color-ok)";
}
function toneGCS(v: number): string {
  if (v < 9) return "text-(--color-critical)";
  if (v < 13) return "text-(--color-amber)";
  return "text-(--color-ok)";
}
function toneBM(v: number): string {
  if (v < 3.5 || v > 11) return "text-(--color-critical)";
  if (v < 4 || v > 10) return "text-(--color-amber)";
  return "text-(--color-ok)";
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}
function fmtMin(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

/**
 * Oxygen titration.
 *
 * The old control was a single chip meaning "15 litres through a
 * non-rebreathe" — right for a crashing trauma patient, wrong for most
 * people an ambulance sees, and impossible to turn DOWN. JRCALC targets a
 * saturation rather than a flow, and after a cardiac arrest the whole
 * instruction is to come down off high-flow because hyperoxia harms a
 * brain that has just been reperfused.
 */
function OxygenControl({
  oxygen,
  spo2,
  onSet,
}: {
  oxygen?: OxygenState;
  spo2?: number;
  onSet: (device: OxygenDevice, flowLpm: number) => void;
}) {
  const device = oxygen?.device ?? "none";
  const flow = oxygen?.flowLpm ?? 0;
  const verdict = oxygenVerdict(spo2);
  const fio2 = Math.round(fiO2For(device, flow) * 100);

  return (
    <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/40 p-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-(--color-amber-dim)">
          Oxygen
        </span>
        <span className="font-mono text-[10px] tabular-nums text-(--color-text-muted)">
          {oxygenLabel(oxygen)} · FiO₂ {fio2}%
        </span>
      </div>

      {/* Device */}
      <div className="mt-1.5 grid grid-cols-3 gap-1">
        {(Object.keys(OXYGEN_DEVICE_LABEL) as OxygenDevice[]).map((d) => (
          <button
            key={d}
            type="button"
            title={OXYGEN_HINT[d]}
            onClick={() => onSet(d, OXYGEN_FLOWS[d][OXYGEN_FLOWS[d].length - 1])}
            className={`rounded-sm border px-1.5 py-1 font-mono text-[9px] leading-tight transition-colors ${
              device === d
                ? "border-(--color-ok)/60 bg-(--color-ok)/10 text-(--color-ok)"
                : "border-(--color-border) text-(--color-text-muted) hover:border-(--color-amber) hover:text-(--color-amber)"
            }`}
          >
            {OXYGEN_DEVICE_LABEL[d]}
          </button>
        ))}
      </div>

      {/* Flow, only where there is a choice to make */}
      {device !== "none" && OXYGEN_FLOWS[device].length > 1 && (
        <div className="mt-1.5 flex items-center gap-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
            {device === "venturi" ? "Valve" : "Flow"}
          </span>
          <div className="flex flex-1 gap-1">
            {OXYGEN_FLOWS[device].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onSet(device, f)}
                className={`flex-1 rounded-sm border px-1 py-1 font-mono text-[10px] tabular-nums transition-colors ${
                  flow === f
                    ? "border-(--color-amber) bg-(--color-amber)/10 text-(--color-amber)"
                    : "border-(--color-border) text-(--color-text-muted) hover:border-(--color-amber)"
                }`}
              >
                {device === "venturi"
                  ? `${Math.round(fiO2For(device, f) * 100)}%`
                  : `${f} L`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className={`mt-1.5 font-mono text-[9px] leading-snug ${
          verdict.tone === "good"
            ? "text-(--color-ok)"
            : verdict.tone === "warn"
              ? "text-(--color-amber)"
              : "text-(--color-critical)"
        }`}
      >
        {verdict.text}
      </div>
    </div>
  );
}
