"use client";

// CASUALTY CARE — the per-patient screen.
//
//   ┌ PATIENT ASSESSMENT ┬ VITAL SIGNS MONITOR ─────────┬ OXYGEN      ┐
//   │ body · conscious   │ II / Pleth / Resp sweeping   │ MEDICATION  │
//   │ allergies          │ HR · SpO2 · RR · NIBP · TEMP │  (or the    │
//   ├ PRIMARY SURVEY     ├ TREATMENT LOG ───────────────┤  open tab)  │
//   │ A B C D E          │                              │             │
//   └────────────────────┴──────────────────────────────┴─────────────┘
//    Assess · Airway · Breathing · Circulation · Immobilise · Handover
//
// Every number on the monitor is the simulator's live vitals for this
// casualty, every button calls the treatment handler the old tab called,
// and the same gates apply: nothing happens to a patient still inside the
// hazard zone or with no clinician standing over them.

import { useState, type ReactNode } from "react";
import type { Appliance } from "@/lib/sim/types";
import type { SceneCasualty, PatientRedFlag, EgressBlock, HospitalDestinationType } from "@/lib/sim/scene";
import type { Deployment, Incident, Task, PatientTreatmentState, ClinicianScope, AirwayAction, BreathingAction, CirculationAction, DrugName, PackagingAction, EgressAction } from "@/lib/sim/incident_types";
import {
  AIRWAY_MIN_SCOPE,
  BREATHING_MIN_SCOPE,
  DRUG_LABEL,
  DRUG_MIN_SCOPE,
  EGRESS_CLINICAL_BLOCKS,
  EGRESS_SECONDS,
  SCOPE_LEVEL,
  scopeOfApplianceType,
} from "@/lib/sim/incident_types";
import { BODY_REGIONS, RED_FLAG_REGIONS, type BodyRegion } from "@/lib/sim/body_regions";
import { MonitorMeta, VitalMonitorPanel, monitorPicture, useMonitorState } from "./vital-monitor";
import { OXYGEN_DEVICE_LABEL, OXYGEN_FLOWS, OXYGEN_HINT, oxygenLabel, oxygenVerdict, type OxygenDevice } from "@/lib/sim/oxygen";
import { PHARMACOLOGY, canGiveDrug, dosesOf } from "@/lib/sim/physiology";
import { postRoscIssues, type ResusState, type ReversibleCause, type MonitorMode, type AirwayState } from "@/lib/sim/resus";
import {
  AIRWAY_HINT,
  AIRWAY_LABEL,
  BREATHING_HINT,
  BREATHING_LABEL,
  CIRC_HINT,
  CIRC_LABEL,
  CLINICIAN_DESCRIPTION,
  DESTINATION_HINT,
  DESTINATION_LABEL,
  DRUG_HINT,
  EGRESS_HINT,
  EGRESS_LABEL,
  PACKAGING_HINT,
  PACKAGING_LABEL,
  RED_FLAG_LABEL,
  SCOPE_LABEL,
  drugRelevantFor,
} from "../components/treatment-tab";
import { ResusPanel, type CompressorOption } from "../components/resus-panel";
import { isExtractionRequired, type ResolvedDeployment } from "../components/incident-view";
import type { CasualtyStage } from "@/lib/sim/incident_sim";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CareCallbacks = {
  onSetTreatingCasualty?: (applianceId: string, casualtyId: string | null) => void;
  onStartPatientSurvey?: (casualtyId: string) => void;
  onApplyAirway?: (casualtyId: string, action: AirwayAction, by: string) => void;
  onApplyBreathing?: (casualtyId: string, action: BreathingAction, by: string) => void;
  onApplyCirculation?: (casualtyId: string, action: CirculationAction, by: string) => void;
  onSetOxygen?: (casualtyId: string, device: OxygenDevice, flowLpm: number, by: string) => void;
  onSetResusAirway?: (casualtyId: string, airway: "igel" | "ett", by: string) => void;
  onAttachMonitor?: (casualtyId: string, monitor: MonitorMode) => void;
  onToggleCapnography?: (casualtyId: string) => void;
  onSetCompressor?: (casualtyId: string, crew: { id: string; name: string; role: string }) => void;
  onFitLucas?: (casualtyId: string) => void;
  onDeliverShock?: (casualtyId: string) => void;
  onMovePads?: (casualtyId: string) => void;
  onArrestAdrenaline?: (casualtyId: string, by: string) => void;
  onAmiodarone?: (casualtyId: string, by: string) => void;
  onSuspectReversible?: (casualtyId: string, cause: ReversibleCause) => void;
  onTreatReversible?: (casualtyId: string, cause: ReversibleCause) => void;
  onStopResus?: (casualtyId: string) => void;
  onAdministerDrug?: (casualtyId: string, drug: DrugName, by: string) => void;
  onApplyPackaging?: (casualtyId: string, action: PackagingAction, by: string) => void;
  onApplyEgress?: (casualtyId: string, action: EgressAction, by: string) => void;
  egressBlocked?: EgressBlock[];
  egressExtraSeconds?: number;
  onRequestClinician?: (scope: "ap" | "ccc" | "basics" | "hems", casualtyId: string) => void;
  hemsFlyable?: boolean;
  onSetTreatmentDestination?: (casualtyId: string, type: HospitalDestinationType, name: string) => void;
  onSendAtmistPrealert?: (casualtyId: string) => void;
  onConveyCasualtyVia?: (applianceId: string, casualtyId: string) => void;
  /** Ask the patient (or whoever is with them) about allergies. */
  onConfirmAllergies?: (casualtyId: string, by: string) => void;
  /** An observation taken at the patient's side — an NIBP cycle, a
   *  12-lead, an alarm — for the record. */
  onRecordObservation?: (casualtyId: string, text: string, by: string) => void;
};

export type CasualtyCareProps = CareCallbacks & {
  casualty: SceneCasualty;
  stage: CasualtyStage;
  /** The progression grade — critical, serious, minor/walking, expectant. */
  severity: string;
  incident: Incident;
  treatment: PatientTreatmentState | null;
  resus?: ResusState;
  deployments: Deployment[];
  resolved: ResolvedDeployment[];
  tasks: Task[];
  now: number;
  onClose: () => void;
  /** Lifted into its own window. */
  popped?: boolean;
  onPopOut?: () => void;
  onDock?: () => void;
  /** Three columns on a desk; tabbed pages on the tablet. */
  layout?: "full" | "tablet";
};

type CareView = "patient" | "care";


type CareTab = "assess" | "airway" | "breathing" | "circulation" | "immobilise" | "handover";

// Standard adult doses shown on the medication card. The sim records the
// drug and who gave it; the numbers are the JRCALC figures a crew would
// draw up, shown so the order reads like a real one.
const DRUG_DOSE: Record<DrugName, { dose: string; unit: string; route: string }> = {
  paracetamol: { dose: "1", unit: "g", route: "PO" },
  entonox: { dose: "50", unit: "%", route: "Inhaled" },
  morphine: { dose: "5", unit: "mg", route: "IV" },
  aspirin_300: { dose: "300", unit: "mg", route: "PO" },
  gtn_spray: { dose: "400", unit: "µg", route: "SL" },
  salbutamol_neb: { dose: "5", unit: "mg", route: "Neb" },
  ipratropium_neb: { dose: "500", unit: "µg", route: "Neb" },
  adrenaline_im_anaphylaxis: { dose: "500", unit: "µg", route: "IM" },
  adrenaline_cpr: { dose: "1", unit: "mg", route: "IV" },
  midazolam_im: { dose: "10", unit: "mg", route: "IM" },
  glucagon_im: { dose: "1", unit: "mg", route: "IM" },
  dextrose_iv: { dose: "100", unit: "mL", route: "IV" },
  naloxone: { dose: "400", unit: "µg", route: "IM" },
  ondansetron: { dose: "4", unit: "mg", route: "IV" },
  tXA_iv: { dose: "1", unit: "g", route: "IV" },
  ketamine_analgesia: { dose: "20", unit: "mg", route: "IV" },
  fentanyl: { dose: "50", unit: "µg", route: "IV" },
  amiodarone: { dose: "300", unit: "mg", route: "IV" },
  magnesium_sulfate: { dose: "2", unit: "g", route: "IV" },
  hydrocortisone: { dose: "100", unit: "mg", route: "IV" },
  chlorphenamine: { dose: "10", unit: "mg", route: "IV" },
  calcium_chloride: { dose: "10", unit: "mL", route: "IV" },
  ketamine_rsi: { dose: "2", unit: "mg/kg", route: "IV" },
  rocuronium: { dose: "1.2", unit: "mg/kg", route: "IV" },
  propofol: { dose: "1", unit: "mg/kg", route: "IV" },
  metaraminol: { dose: "0.5", unit: "mg", route: "IV" },
  noradrenaline: { dose: "0.1", unit: "µg/kg/min", route: "IV" },
  blood_prbc: { dose: "1", unit: "unit", route: "IV" },
  blood_plasma: { dose: "1", unit: "unit", route: "IV" },
};

const TABS: { key: CareTab; label: string; icon: ReactNode }[] = [
  { key: "assess", label: "Assess", icon: <Icon d="M9 3h6l1 2h3v16H5V5h3l1-2zm0 9 2 2 4-4" /> },
  { key: "airway", label: "Airway", icon: <Icon d="M12 3c-3 0-5 2-5 5v3c0 2-1 3-2 4s0 3 2 3h3v3h4v-3h3c2 0 3-2 2-3s-2-2-2-4V8c0-3-2-5-5-5z" /> },
  { key: "breathing", label: "Breathing", icon: <Icon d="M12 4v8m0 0c-2 0-3 2-3 4s-1 4-3 4-3-2-3-4 1-4 3-4m6 0c2 0 3 2 3 4s1 4 3 4 3-2 3-4-1-4-3-4" /> },
  { key: "circulation", label: "Circulation", icon: <Icon d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10zM5 12h4l1-2 2 4 1-2h6" /> },
  { key: "immobilise", label: "Immobilise", icon: <Icon d="M12 3v18M8 6h8M8 12h8M8 18h8" /> },
  { key: "handover", label: "Handover", icon: <Icon d="M6 3h9l4 4v14H6V3zm3 8h6m-6 4h6m-6-8h3" /> },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function wall(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false });
}

function consciousness(vitals: PatientTreatmentState["liveVitals"], flags: PatientRedFlag[], resus?: ResusState): { text: string; tone: "go" | "warn" | "stop" | "off" } {
  if (resus && !resus.roscAt) return { text: "Cardiac arrest • No output", tone: "stop" };
  if (!vitals) return { text: "Not yet assessed", tone: "off" };
  if (flags.includes("seizure_active")) return { text: "Seizing", tone: "stop" };
  if (vitals.gcs >= 15) return { text: "Conscious • Alert", tone: "go" };
  if (vitals.gcs >= 13) return { text: "Conscious • Confused", tone: "warn" };
  if (vitals.gcs >= 9) return { text: "Responds to voice", tone: "warn" };
  return { text: "Unresponsive", tone: "stop" };
}

// ---------------------------------------------------------------------------
// Body figure
// ---------------------------------------------------------------------------

const REGION_SHAPES: Record<Exclude<BodyRegion, "systemic" | "back">, { d: string }> = {
  head: { d: "M100 18a24 26 0 1 0 0.01 0z" },
  neck: { d: "M90 70h20v16H90z" },
  chest: { d: "M66 86h68v60H66z" },
  abdomen: { d: "M70 146h60v46H70z" },
  pelvis: { d: "M68 192h64v40H68z" },
  left_arm: { d: "M36 92h28l4 118H32z" },
  right_arm: { d: "M136 92h28l4 118h-36z" },
  left_leg: { d: "M70 232h30v150H62z" },
  right_leg: { d: "M100 232h30l8 150h-38z" },
};

function BodyFigure({ flags, selected, onSelect }: { flags: PatientRedFlag[]; selected: BodyRegion | null; onSelect: (r: BodyRegion | null) => void }) {
  const hot = new Set<BodyRegion>();
  for (const f of flags) for (const r of RED_FLAG_REGIONS[f] ?? []) hot.add(r);
  const meta = selected ? BODY_REGIONS.find((r) => r.code === selected) : null;
  return (
    <div className="cc-body">
      <svg viewBox="0 0 200 390" aria-label="Body diagram">
        <path className="cc-body-outline" d="M100 -8a26 28 0 0 1 0 56a26 28 0 0 1 0-56zM88 70h24l6 14h34l14 20l6 108h-30l-6-74v96l10 154h-36l-6-140l-4 0l-6 140h-36l10-154v-96l-6 74h-30l6-108l14-20h34z" />
        {(Object.keys(REGION_SHAPES) as (keyof typeof REGION_SHAPES)[]).map((code) => (
          <path
            key={code}
            d={REGION_SHAPES[code].d}
            className={`cc-region${hot.has(code) ? " hot" : ""}${selected === code ? " sel" : ""}`}
            onClick={() => onSelect(selected === code ? null : code)}
          >
            <title>{BODY_REGIONS.find((r) => r.code === code)?.label}</title>
          </path>
        ))}
        {meta?.front && (
          <g className="cc-callout">
            <line x1={meta.front.x + 18} y1={meta.front.y} x2={182} y2={meta.front.y - 14} />
            <text x={184} y={meta.front.y - 18} textAnchor="end">{meta.label}</text>
            <text x={184} y={meta.front.y - 4} textAnchor="end" className="dim">(selected)</text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The screen
// ---------------------------------------------------------------------------


export function CasualtyCareScreen(props: CasualtyCareProps) {
  const { casualty, stage, severity, incident, treatment, resus, deployments, resolved, tasks, now, onClose } = props;
  const casualtyId = casualty.id;
  const tablet = props.layout === "tablet";
  const [tab, setTab] = useState<CareTab>("assess");
  const [view, setView] = useState<CareView>("patient");
  const [region, setRegion] = useState<BodyRegion | null>(null);
  const [device, setDevice] = useState<OxygenDevice | "">("");
  const [flowIx, setFlowIx] = useState(0);
  const [drug, setDrug] = useState<DrugName | "">("");

  // ---- Who is with the patient --------------------------------------
  const pairedAll = deployments
    .filter((d) => d.treatingCasualtyId === casualtyId)
    .map((d) => {
      const r = resolved.find((x) => x.appliance.id === d.applianceId);
      return r ? { deployment: d, appliance: r.appliance } : null;
    })
    .filter((x): x is { deployment: Deployment; appliance: Appliance } => x !== null);
  const paired = pairedAll.filter((p) => now >= p.deployment.arrivesAt && scopeOfApplianceType(p.appliance.type) !== "none");
  const inbound = pairedAll.filter((p) => now < p.deployment.arrivesAt);
  const scope: ClinicianScope = paired.reduce<ClinicianScope>((best, p) => {
    const s = scopeOfApplianceType(p.appliance.type);
    return SCOPE_LEVEL[s] > SCOPE_LEVEL[best] ? s : best;
  }, paired.length ? "dca" : "none");
  const scopeLvl = SCOPE_LEVEL[scope];
  const lead = paired.find((p) => scopeOfApplianceType(p.appliance.type) === scope);
  const by = lead?.appliance.callsign ?? "Crew";
  const onSceneMedical = resolved
    .filter((r) => r.appliance.service === "Ambulance" && scopeOfApplianceType(r.appliance.type) !== "none" && (r.phase === "at_incident" || r.phase === "at_hospital"))
    .sort((a, b) => SCOPE_LEVEL[scopeOfApplianceType(b.appliance.type)] - SCOPE_LEVEL[scopeOfApplianceType(a.appliance.type)]);

  const extractionRequired = isExtractionRequired(casualty, tasks);
  const convoy = pairedAll.find((p) => p.deployment.hospitalLegStartedAt);
  const conveying = !!convoy;
  const atHospital = !!convoy && convoy.deployment.hospitalArrivesAt !== undefined && now >= convoy.deployment.hospitalArrivesAt;
  const canAct = !extractionRequired && paired.length > 0 && !!treatment && !conveying;

  // ---- Clinical picture ----------------------------------------------
  const surveyRunning = !!treatment?.surveyStartedAt && !treatment.surveyCompletedAt;
  const surveyDone = !!treatment?.surveyCompletedAt;
  const surveySec = surveyRunning ? Math.min(60, Math.max(0, (now - treatment!.surveyStartedAt!) / 1000)) : 0;
  const vitals = treatment?.liveVitals ?? treatment?.revealedVitals;
  const flags = treatment?.activeRedFlags ?? treatment?.revealedRedFlags ?? [];
  const revealedFlags = treatment?.revealedRedFlags ?? [];
  const inArrest = !!resus && !resus.roscAt && !resus.roleAt;
  const state = consciousness(surveyDone ? vitals : undefined, flags, resus);
  const scenarioTime = clock(now - incident.receivedAt);

  // ---- Instruments (the monitor keeps its own record) --------------------
  const monitorState = useMonitorState(casualtyId);
  const { alarming } = monitorPicture(treatment, resus, now, monitorState);

  // ---- Oxygen ----------------------------------------------------------------
  const currentO2 = treatment?.oxygen;
  const flows = device ? OXYGEN_FLOWS[device] : [];
  const flow = flows[Math.min(flowIx, Math.max(0, flows.length - 1))] ?? 0;
  const o2Verdict = oxygenVerdict(vitals?.spo2, treatment?.profile?.copdRisk);

  // ---- Drugs ----------------------------------------------------------------
  const drugs = (Object.keys(DRUG_LABEL) as DrugName[]).filter((d) => drugRelevantFor(d, revealedFlags));
  const drugAllowed = (d: DrugName) => scopeLvl >= SCOPE_LEVEL[DRUG_MIN_SCOPE[d]];
  const dose = drug ? DRUG_DOSE[drug] : null;
  const check = drug && treatment ? canGiveDrug(treatment, drug, now) : null;
  const givenCount = drug && treatment ? dosesOf(treatment.doses, drug).length : 0;
  const spec = drug ? PHARMACOLOGY[drug] : null;
  const profile = treatment?.profile;
  const allergyToDrug = drug && treatment?.allergiesConfirmedAt ? profile?.allergies.find((a) => a.drugs.includes(drug)) : undefined;
  const pain = treatment?.physio?.pain;

  // ---- Egress timer -------------------------------------------------------
  const moves = (Object.entries(treatment?.egress ?? {}) as [EgressAction, number][]).sort((a, b) => b[1] - a[1]);
  const move = moves[0];
  const moveLeft = move ? Math.max(0, move[1] + (EGRESS_SECONDS[move[0]] + (props.egressExtraSeconds ?? 0)) * 1000 - now) : 0;

  // ---- Pieces ----------------------------------------------------------------
  const surveyRows: { k: string; label: string; status: string; tone: "go" | "warn" | "stop" | "off"; tab: CareTab }[] = [
    { k: "A", label: "Airway", tab: "airway", ...(!surveyDone ? na(surveyRunning) : flags.includes("airway_compromise") ? { status: "Compromised", tone: "stop" } : { status: "Patent", tone: "go" }) },
    { k: "B", label: "Breathing", tab: "breathing", ...(!surveyDone || !vitals ? na(surveyRunning) : { status: `RR ${vitals.rr} · SpO₂ ${Math.round(vitals.spo2)}%`, tone: vitals.spo2 < 92 || vitals.rr > 25 || vitals.rr < 10 ? "stop" : vitals.spo2 < 95 ? "warn" : "go" }) },
    { k: "C", label: "Circulation", tab: "circulation", ...(!surveyDone || !vitals ? na(surveyRunning) : inArrest ? { status: "Cardiac arrest", tone: "stop" } : { status: `HR ${vitals.hr} · BP ${vitals.bpSys}/${vitals.bpDia}`, tone: vitals.bpSys < 90 ? "stop" : vitals.hr > 110 || vitals.bpSys < 100 ? "warn" : "go" }) },
    { k: "D", label: "Disability", tab: "assess", ...(!surveyDone || !vitals ? na(surveyRunning) : { status: `GCS ${vitals.gcs} · BM ${vitals.bm}`, tone: vitals.gcs < 9 ? "stop" : vitals.gcs < 13 ? "warn" : "go" }) },
    { k: "E", label: "Exposure", tab: "immobilise", ...(!surveyDone || !vitals ? na(surveyRunning) : { status: `${vitals.temp.toFixed(1)} °C${flags.includes("major_haemorrhage") ? " · haemorrhage" : ""}`, tone: flags.includes("major_haemorrhage") ? "stop" : "go" }) },
  ];

  function actionTile(label: string, hint: string | undefined, done: number | undefined, allowed: boolean, requires: ClinicianScope | undefined, onClick: () => void, key: string, outOfRegion = false) {
    return (
      <button
        key={key}
        type="button"
        className={`cc-action${done !== undefined ? " done" : ""}${outOfRegion ? " dim" : ""}`}
        disabled={!allowed || !canAct || done !== undefined}
        title={hint}
        onClick={onClick}
      >
        <strong>{label}</strong>
        <small>{done !== undefined ? `Done · ${wall(done)}` : !allowed && requires ? `Requires ${SCOPE_LABEL[requires]}` : hint}</small>
      </button>
    );
  }

  const gateCard = extractionRequired ? (
    <Card title="Awaiting extraction" icon="!" tone="stop">
      <p>Casualty is still inside the hazard zone. Treatment starts once a BA crew has carried them to the RVP. Task a crew with Extract casualty on the MDT.</p>
    </Card>
  ) : conveying ? (
    <Card title={atHospital ? "At hospital" : "Conveying"} icon="→" tone="go">
      <p>
        {convoy!.appliance.callsign} · {convoy!.deployment.hospitalName ?? treatment?.chosenDestination?.name ?? "hospital"}
        {!atHospital && convoy!.deployment.hospitalArrivesAt ? ` · ETA ${clock(convoy!.deployment.hospitalArrivesAt - now)}` : atHospital ? " · handing over" : ""}
      </p>
    </Card>
  ) : paired.length === 0 ? (
    <Card title="Assign crew" icon="+" tone="warn">
      {inbound.length > 0 && (
        <p>{inbound.map((p) => `${p.appliance.callsign} running · ETA ${clock(p.deployment.arrivesAt - now)}`).join(" · ")}</p>
      )}
      {onSceneMedical.length === 0 ? (
        <p>No clinician on scene yet. A vehicle carrying a defib is not a clinician — it takes an ambulance resource in attendance.</p>
      ) : (
        <div className="cc-list">
          {onSceneMedical.map((r) => {
            const onOther = !!r.deployment.treatingCasualtyId && r.deployment.treatingCasualtyId !== casualtyId;
            return (
              <button key={r.appliance.id} type="button" className="cc-row" disabled={!props.onSetTreatingCasualty} onClick={() => props.onSetTreatingCasualty?.(r.appliance.id, casualtyId)}>
                <strong>{r.appliance.callsign}</strong>
                <span>{SCOPE_LABEL[scopeOfApplianceType(r.appliance.type)]}{onOther ? " · with another patient" : ""}</span>
                <em>Assign</em>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  ) : null;

  const oxygenCard = (
    <Card title="Oxygen" icon="O₂">
      <label className="cc-field">
        <span>Device</span>
        <select value={device} onChange={(e) => { setDevice(e.target.value as OxygenDevice | ""); setFlowIx(0); }} disabled={!canAct}>
          <option value="">Select device</option>
          {(Object.keys(OXYGEN_DEVICE_LABEL) as OxygenDevice[]).map((d) => (
            <option key={d} value={d}>{OXYGEN_DEVICE_LABEL[d]}</option>
          ))}
        </select>
      </label>
      <div className="cc-field cc-inline">
        <span>Flow rate</span>
        <div className="cc-stepper">
          <button type="button" aria-label="Lower flow" disabled={!device || flowIx <= 0} onClick={() => setFlowIx((i) => Math.max(0, i - 1))}>−</button>
          <output>{device ? flow : ""}</output>
          <button type="button" aria-label="Raise flow" disabled={!device || flowIx >= flows.length - 1} onClick={() => setFlowIx((i) => Math.min(flows.length - 1, i + 1))}>+</button>
        </div>
        <span className="unit">L/min</span>
      </div>
      <div className="cc-field cc-inline">
        <span>Status</span>
        <span className={`cc-status ${currentO2 && currentO2.device !== "none" ? "on" : ""}`}>
          <i />{currentO2 && currentO2.device !== "none" ? `Delivering · ${oxygenLabel(currentO2)}` : "Not delivering"}
        </span>
      </div>
      {surveyDone && <small className={`cc-verdict ${o2Verdict.tone}`}>{o2Verdict.text}</small>}
      {device && <small className="cc-hint">{OXYGEN_HINT[device]}</small>}
      <button type="button" className="cc-primary" disabled={!canAct || !device || !props.onSetOxygen} onClick={() => device && props.onSetOxygen?.(casualtyId, device, flow, by)}>
        <Icon d="M12 4v8m0 0c-2 0-3 2-3 4s-1 4-3 4-3-2-3-4 1-4 3-4m6 0c2 0 3 2 3 4s1 4 3 4 3-2 3-4-1-4-3-4" /> {device === "none" ? "Remove oxygen" : "Apply oxygen"}
      </button>
    </Card>
  );

  const medicationCard = (
    <Card title="Medication" icon="⌇">
      <label className="cc-field">
        <span>Drug</span>
        <select value={drug} onChange={(e) => setDrug(e.target.value as DrugName | "")} disabled={!canAct || !surveyDone}>
          <option value="">Select medication</option>
          {drugs.map((d) => (
            <option key={d} value={d} disabled={!drugAllowed(d)}>
              {DRUG_LABEL[d]}{treatment?.drugs[d] !== undefined ? " · given" : !drugAllowed(d) ? ` · ${SCOPE_LABEL[DRUG_MIN_SCOPE[d]]}` : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="cc-field cc-inline">
        <span>Dose</span>
        <input readOnly value={dose?.dose ?? ""} aria-label="Dose" />
        <input readOnly value={dose?.unit ?? "Select unit"} aria-label="Unit" className="wide" />
      </div>
      <div className="cc-field cc-inline">
        <span>Route</span>
        <input readOnly value={dose?.route ?? "Select route"} aria-label="Route" className="wide" />
      </div>
      {spec && (
        <small className="cc-hint">
          {spec.indication} · onset ~{spec.onsetSec >= 60 ? `${Math.round(spec.onsetSec / 60)} min` : `${spec.onsetSec} s`} · lasts ~{Math.round(spec.durationSec / 60)} min
          {givenCount > 0 ? ` · dose ${givenCount} of ${spec.maxDoses} given` : spec.maxDoses > 1 ? ` · up to ${spec.maxDoses} doses, ${Math.round(spec.repeatSec / 60)} min apart` : ""}
        </small>
      )}
      {drug && DRUG_HINT[drug] && <small className="cc-hint">{DRUG_HINT[drug]}</small>}
      {check && !check.ok && <small className="cc-verdict bad">{check.reason}</small>}
      {check?.ok && check.warning && <small className="cc-verdict warn">{check.warning}</small>}
      {allergyToDrug ? (
        <div className="cc-warn stop">
          <b>!</b>
          <div><strong>ALLERGY: {allergyToDrug.agent}</strong><span>Patient reports {allergyToDrug.reaction === "rash" ? "a rash" : "anaphylaxis"} to this. Do not give.</span></div>
        </div>
      ) : treatment?.allergiesConfirmedAt ? (
        <div className="cc-warn ok">
          <b>✓</b>
          <div><strong>Allergies: {profile && profile.allergies.length ? profile.allergies.map((a) => a.agent).join(", ") : "NKDA"}</strong><span>Confirmed at {wall(treatment.allergiesConfirmedAt)}.</span></div>
        </div>
      ) : (
        <div className="cc-warn">
          <b>!</b>
          <div><strong>Allergies: not confirmed</strong><span>Check allergy status before administering any medication.</span></div>
        </div>
      )}
      <button
        type="button"
        className="cc-primary"
        disabled={!canAct || !drug || !surveyDone || !props.onAdministerDrug || (check !== null && !check.ok)}
        onClick={() => { if (drug) { props.onAdministerDrug?.(casualtyId, drug, by); setDrug(""); } }}
      >
        <Icon d="M4 20l4-4m2-6 8-8m-6 6 6 6m-8-4-3 3 4 4 3-3" /> {givenCount > 0 ? `Administer · repeat dose ${givenCount + 1}` : "Administer"}
      </button>
    </Card>
  );

  function rightColumn(): ReactNode {
    if (gateCard && tab !== "handover") return <>{gateCard}{tab === "assess" && oxygenCard}</>;
    switch (tab) {
      case "assess":
        return <>{oxygenCard}{medicationCard}</>;
      case "airway":
        return (
          <Card title="Airway" icon="A" fill>
            {!surveyDone && <p className="cc-note">Complete the primary survey to unlock interventions.</p>}
            <div className="cc-actions">
              {(Object.keys(AIRWAY_LABEL) as AirwayAction[]).map((a) =>
                actionTile(AIRWAY_LABEL[a], AIRWAY_HINT[a], treatment?.airway[a], surveyDone && scopeLvl >= SCOPE_LEVEL[AIRWAY_MIN_SCOPE[a]], AIRWAY_MIN_SCOPE[a], () => props.onApplyAirway?.(casualtyId, a, by), a, region !== null && region !== "head" && region !== "neck"),
              )}
            </div>
          </Card>
        );
      case "breathing":
        return (
          <>
            <Card title="Breathing" icon="B">
              {!surveyDone && <p className="cc-note">Complete the primary survey to unlock interventions.</p>}
              <div className="cc-actions">
                {(Object.keys(BREATHING_LABEL) as BreathingAction[])
                  .filter((a) => (a !== "needle_decomp" && a !== "finger_thoracostomy") || revealedFlags.includes("tension_pneumothorax"))
                  .map((a) => actionTile(BREATHING_LABEL[a], BREATHING_HINT[a], treatment?.breathing[a], surveyDone && scopeLvl >= SCOPE_LEVEL[BREATHING_MIN_SCOPE[a]], BREATHING_MIN_SCOPE[a], () => props.onApplyBreathing?.(casualtyId, a, by), a, region !== null && region !== "chest" && region !== "head"))}
              </div>
            </Card>
            {oxygenCard}
          </>
        );
      case "circulation":
        return (
          <>
            {resus && (
              <Card title={inArrest ? "Resuscitation · ALS" : resus.roscAt ? "Post-ROSC" : "Resuscitation ended"} icon="♥" tone={inArrest ? "stop" : "go"} fill>
                <div className="cc-legacy">
                  <ResusPanel
                    state={resus}
                    now={now}
                    scope={scope}
                    candidates={paired.flatMap(({ appliance }) => appliance.crewMembers.map((m): CompressorOption => ({ id: m.id, name: m.name, role: m.role, callsign: appliance.callsign })))}
                    lucasAvailable={paired.some(({ appliance }) => appliance.kit.some((k) => /mechanical cpr/i.test(k)))}
                    monitorAvailable={paired.some(({ appliance }) => appliance.kit.some((k) => /cardiac monitor|defib/i.test(k)))}
                    postRoscIssues={postRoscIssues(resus, vitals)}
                    vitals={vitals}
                    onSetAirway={(a: AirwayState) => a !== "none" && props.onSetResusAirway?.(casualtyId, a, by)}
                    onAttachMonitor={(m) => props.onAttachMonitor?.(casualtyId, m)}
                    onToggleCapnography={() => props.onToggleCapnography?.(casualtyId)}
                    onSetCompressor={(c) => props.onSetCompressor?.(casualtyId, c)}
                    onFitLucas={() => props.onFitLucas?.(casualtyId)}
                    onShock={() => props.onDeliverShock?.(casualtyId)}
                    onMovePads={() => props.onMovePads?.(casualtyId)}
                    onAdrenaline={() => props.onArrestAdrenaline?.(casualtyId, by)}
                    onAmiodarone={() => props.onAmiodarone?.(casualtyId, by)}
                    onSuspectReversible={(c) => props.onSuspectReversible?.(casualtyId, c)}
                    onTreatReversible={(c) => props.onTreatReversible?.(casualtyId, c)}
                    onStopResus={() => props.onStopResus?.(casualtyId)}
                  />
                </div>
              </Card>
            )}
            <Card title="Circulation" icon="C">
              {!surveyDone && <p className="cc-note">Complete the primary survey to unlock interventions.</p>}
              <div className="cc-actions">
                {(Object.keys(CIRC_LABEL) as CirculationAction[])
                  .filter((a) => (a !== "cpr" && a !== "defib") || (!resus && flags.includes("cardiac_arrest")))
                  .map((a) => actionTile(CIRC_LABEL[a], CIRC_HINT[a], treatment?.circulation[a], surveyDone, undefined, () => props.onApplyCirculation?.(casualtyId, a, by), a))}
              </div>
            </Card>
            {medicationCard}
          </>
        );
      case "immobilise":
        return (
          <>
            <Card title="Packaging" icon="⊟">
              {!surveyDone && <p className="cc-note">Complete the primary survey to unlock packaging.</p>}
              <div className="cc-actions">
                {(Object.keys(PACKAGING_LABEL) as PackagingAction[]).map((a) =>
                  actionTile(PACKAGING_LABEL[a], PACKAGING_HINT[a], treatment?.packaging[a], surveyDone, undefined, () => props.onApplyPackaging?.(casualtyId, a, by), a),
                )}
              </div>
            </Card>
            <Card title="Egress · to the vehicle" icon="↘">
              <div className="cc-actions">
                {(Object.keys(EGRESS_LABEL) as EgressAction[]).map((a) => {
                  const block = props.egressBlocked?.find((b) => b.action === a);
                  const clinical = EGRESS_CLINICAL_BLOCKS.find((r) => r.actions.includes(a) && flags.includes(r.flag));
                  const reason = block?.reason ?? clinical?.reason;
                  return actionTile(EGRESS_LABEL[a], reason ?? EGRESS_HINT[a], treatment?.egress?.[a], surveyDone && !reason, undefined, () => props.onApplyEgress?.(casualtyId, a, by), a);
                })}
              </div>
              {move && (
                <p className={`cc-note ${moveLeft > 0 ? "warn" : "go"}`}>
                  {EGRESS_LABEL[move[0]]} · {moveLeft > 0 ? `${clock(moveLeft).slice(3)} to the vehicle` : "at the vehicle"}
                </p>
              )}
            </Card>
          </>
        );
      case "handover":
        return (
          <>
            {gateCard}
            <Card title="Additional clinician" icon="+">
              <div className="cc-list">
                {(["ap", "ccc", "basics", "hems"] as const).map((s) => {
                  const alreadyOn = scopeLvl >= SCOPE_LEVEL[s];
                  const br = s === "basics" ? treatment?.basicsRequest : undefined;
                  const pending = !!br && (br.stage === "cih" || br.stage === "broadcast");
                  const left = br ? Math.max(0, Math.ceil((br.nextAt - now) / 1000)) : 0;
                  const description = s === "hems"
                    ? props.hemsFlyable === false ? "Aircraft grounded — NWAA car responds by road" : "Helicopter + doctor team — pick a landing zone on the ground"
                    : br
                      ? br.stage === "cih" ? `With the Complex Incident Hub · ${left} s`
                        : br.stage === "broadcast" ? `Alert to ${br.alerted} handset${br.alerted === 1 ? "" : "s"} · ${left} s to answer`
                        : br.stage === "answered" ? `${br.winnerCallsign ?? "Responder"} answered · mobilising`
                        : br.stage === "declined" ? "Hub declined — NWAA asset instead"
                        : "No response · request again or use NWAA"
                      : CLINICIAN_DESCRIPTION[s];
                  return (
                    <button key={s} type="button" className="cc-row" disabled={alreadyOn || pending || !props.onRequestClinician || extractionRequired} onClick={() => props.onRequestClinician?.(s, casualtyId)}>
                      <strong>{SCOPE_LABEL[s]}{s === "hems" && props.hemsFlyable === false ? " · Night car" : ""}</strong>
                      <span>{description}</span>
                      <em>{alreadyOn ? "On scene" : pending ? "Requested" : br?.stage === "answered" ? "Coming" : "Request"}</em>
                    </button>
                  );
                })}
              </div>
            </Card>
            <Card title="Destination" icon="H">
              <div className="cc-list">
                {(Object.keys(DESTINATION_LABEL) as HospitalDestinationType[]).map((t) => {
                  const preferred = treatment?.preferredDestination === t;
                  const chosen = treatment?.chosenDestination?.type === t;
                  return (
                    <button key={t} type="button" className={`cc-row${chosen ? " chosen" : preferred ? " preferred" : ""}`} title={DESTINATION_HINT[t]} disabled={!canAct || !surveyDone} onClick={() => props.onSetTreatmentDestination?.(casualtyId, t, DESTINATION_LABEL[t])}>
                      <strong>{DESTINATION_LABEL[t]}</strong>
                      <em>{chosen ? "Chosen" : preferred ? "Recommended" : "Select"}</em>
                    </button>
                  );
                })}
              </div>
              {treatment?.chosenDestination && !treatment.atmistSentAt && (
                <button type="button" className="cc-primary" disabled={!canAct} onClick={() => props.onSendAtmistPrealert?.(casualtyId)}>Send ATMIST pre-alert · {treatment.chosenDestination.name}</button>
              )}
              {treatment?.atmistSentAt && <p className="cc-note go">✓ ATMIST pre-alert sent · {wall(treatment.atmistSentAt)}</p>}
            </Card>
            {surveyDone && treatment?.atmistSentAt && !conveying && (
              <Card title="Convey via" icon="→">
                <div className="cc-list">
                  {paired.map((p) => {
                    const canConvey = p.appliance.type === "DCA" || (p.appliance.type === "HEMS" && props.hemsFlyable !== false);
                    return (
                      <button key={p.appliance.id} type="button" className="cc-row" disabled={!canConvey || !props.onConveyCasualtyVia} onClick={() => props.onConveyCasualtyVia?.(p.appliance.id, casualtyId)}>
                        <strong>{p.appliance.callsign}</strong>
                        <span>{SCOPE_LABEL[scopeOfApplianceType(p.appliance.type)]}</span>
                        <em>{canConvey ? "Convey" : "No stretcher"}</em>
                      </button>
                    );
                  })}
                  {paired.every((p) => p.appliance.type !== "DCA" && p.appliance.type !== "HEMS") && <p className="cc-note">Only a DCA or the air ambulance can convey. Pair one to carry this patient.</p>}
                </div>
              </Card>
            )}
          </>
        );
    }
  }

  const headerButtons = (
    <>
      {props.popped ? (
        <button type="button" className="cc-close" onClick={props.onDock}>⤶ Dock</button>
      ) : props.onPopOut ? (
        <button type="button" className="cc-close" onClick={props.onPopOut} title="Open on another screen">↗ Window</button>
      ) : null}
      <button type="button" className="cc-close" onClick={onClose}>✕ Close</button>
    </>
  );

  const patientCard = (
    <Card title="Patient assessment" icon="≡" fill>
      <div className="cc-patient-grid">
        <BodyFigure flags={flags} selected={region} onSelect={setRegion} />
        <div className="cc-patient-details">
          <div className="cc-patient">
            <strong>{(casualty.label ?? casualty.id).toUpperCase()}</strong>
          </div>
          <dl className="cc-facts">
            <dt>Patient</dt>
            <dd>{profile ? `${profile.ageYears <= 15 ? "Child" : "Adult"} · ${profile.sex === "male" ? "Male" : "Female"} · ${profile.ageYears} y · ${profile.weightKg} kg` : casualty.clinical?.ageYears !== undefined ? `Approx. ${casualty.clinical.ageYears} years` : "Age not recorded"}</dd>
            <dt>Triage</dt>
            <dd className={severity === "critical" || severity === "expectant" ? "stop" : severity === "serious" ? "warn" : "go"}>{severity === "critical" ? "P1 · Critical" : severity === "serious" ? "P2 · Serious" : severity === "expectant" ? "P4 · Expectant" : "P3 · Walking"}</dd>
            <dt>Response</dt>
            <dd><span className={`cc-conscious ${state.tone}`}><i />{state.text}</span></dd>
            {pain !== undefined && surveyDone && !inArrest && (<><dt>Pain</dt><dd>{Math.round(pain)} / 10</dd></>)}
            <dt>Crew</dt>
            <dd>{paired.length ? paired.map((p) => `${p.appliance.callsign} · ${SCOPE_LABEL[scopeOfApplianceType(p.appliance.type)]}`).join(", ") : inbound.length ? `${inbound.map((p) => p.appliance.callsign).join(", ")} running` : "No clinician assigned"}</dd>
            <dt>Allergies</dt>
            <dd>
              {treatment?.allergiesConfirmedAt ? (
                <span className={profile && profile.allergies.length ? "stop" : "go"}>{profile && profile.allergies.length ? profile.allergies.map((a) => a.agent).join(", ") : "NKDA"} ✓</span>
              ) : (
                <button type="button" className="cc-mini" disabled={!canAct || !props.onConfirmAllergies} onClick={() => props.onConfirmAllergies?.(casualtyId, by)} title="Ask the patient or whoever is with them">Unknown · ask ›</button>
              )}
            </dd>
          </dl>
          {flags.length > 0 && <div className="cc-flags">{flags.map((f) => <span key={f}>{RED_FLAG_LABEL[f]}</span>)}</div>}
          {region && <p className="cc-note">{BODY_REGIONS.find((r) => r.code === region)?.label} selected — actions for other regions are dimmed.</p>}
        </div>
      </div>
      {surveyDone && profile && (
        <details className="cc-history" open={tablet}>
          <summary>History &amp; medications</summary>
          <p><b>PMH</b> {profile.history.length ? profile.history.join(" · ") : "Nil of note"}</p>
          <p><b>Meds</b> {profile.medications.length ? profile.medications.join(" · ") : "None"}</p>
          <p><b>Events</b> {profile.eventsLeadingUp}</p>
          {profile.copdRisk && <p className="warn">CO₂ retainer — target 88–92 %</p>}
          {profile.anticoagulated && <p className="warn">Anticoagulated — bleeds harder</p>}
          {profile.betaBlocked && <p className="warn">Beta-blocked — tachycardia blunted</p>}
        </details>
      )}
    </Card>
  );

  const surveyCard = (
    <Card title="Primary survey" icon="✓">
      {!surveyDone && (
        <button type="button" className="cc-primary" disabled={!canAct || surveyRunning || !props.onStartPatientSurvey} onClick={() => props.onStartPatientSurvey?.(casualtyId)}>
          {surveyRunning ? `Assessing · ${Math.round(surveySec)}s / 60s` : "Start primary survey · ~60s"}
        </button>
      )}
      {surveyRunning && <div className="cc-bar"><i style={{ width: `${(surveySec / 60) * 100}%` }} /></div>}
      <div className="cc-survey">
        {surveyRows.map((r) => (
          <button key={r.k} type="button" onClick={() => { setTab(r.tab); setView("care"); }}>
            <b>{r.k}</b><span>{r.label}</span><small className={r.tone}>{r.status}</small><em>›</em>
          </button>
        ))}
      </div>
    </Card>
  );

  const monitorCard = (
    <Card
      title="Vital signs monitor"
      icon="⌁"
      fill
      tone={alarming ? "stop" : undefined}
      headerExtra={<MonitorMeta casualtyId={casualtyId} now={now} />}
    >
      <VitalMonitorPanel
        casualtyId={casualtyId}
        treatment={treatment}
        resus={resus}
        paired={paired.length}
        now={now}
        by={by}
        onRecordObservation={props.onRecordObservation}
        onAttachMonitor={props.onAttachMonitor}
      />
    </Card>
  );

  const footer = (
    <footer className="cc-foot">
      {TABS.map((t) => (
        <button key={t.key} type="button" aria-pressed={tab === t.key && (!tablet || view === "care")} onClick={() => { setTab(t.key); setView("care"); }}>
          {t.icon}<span>{t.label}</span>
        </button>
      ))}
    </footer>
  );

  if (tablet) {
    const views: { key: CareView; label: string; badge?: string }[] = [
      { key: "patient", label: "Patient" },
      { key: "care", label: "Care", badge: TABS.find((t) => t.key === tab)?.label },
    ];
    return (
      <div className={`cc-screen cc-tablet${alarming ? " alarming" : ""}`} role="dialog" aria-label={`Casualty care · ${casualty.label ?? casualty.id}`}>
        <header className="cc-head">
          <div className="cc-brand">
            <h1>CASUALTY CARE</h1>
            <span className="cc-who">{(casualty.label ?? casualty.id).toUpperCase()}</span>
          </div>
          <div className="cc-head-right">
            <div className="cc-time"><small>SCENARIO</small><strong>{scenarioTime}</strong></div>
            {headerButtons}
          </div>
        </header>
        <nav className="cc-views" aria-label="Pages">
          {views.map((v) => (
            <button key={v.key} type="button" aria-pressed={view === v.key} onClick={() => setView(v.key)}>
              {v.label}{v.badge && <em>{v.badge}</em>}
            </button>
          ))}
        </nav>
        <main className="cc-main tablet">
          {view === "patient" && (<>{patientCard}{surveyCard}</>)}
          {view === "care" && <div className="cc-col cc-right">{rightColumn()}</div>}
        </main>
        {footer}
      </div>
    );
  }

  return (
    <div className={`cc-screen${alarming ? " alarming" : ""}`} role="dialog" aria-label={`Casualty care · ${casualty.label ?? casualty.id}`}>
      <header className="cc-head">
        <div className="cc-brand">
          <svg viewBox="0 0 40 40" width="32" height="32" aria-hidden="true">
            <path d="M20 2l4 6h-8zM20 38l-4-6h8zM4 11l7 1-4 7zM36 11l-3 8-4-7zM4 29l3-8 4 7zM36 29l-7-1 4-7z" fill="currentColor" />
            <circle cx="20" cy="20" r="9" fill="currentColor" />
            <path d="M18 14h4v4h4v4h-4v4h-4v-4h-4v-4h4z" fill="var(--vec-bar, #1e303c)" />
          </svg>
          <h1>CASUALTY CARE <span>SIMULATION</span></h1>
        </div>
        <div className="cc-head-right">
          <div className="cc-who"><Icon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0" /> <span>{(casualty.label ?? casualty.id).toUpperCase()}</span></div>
          <div className="cc-time"><Icon d="M12 8v5l3 2m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /><div><small>SCENARIO TIME</small><strong>{scenarioTime}</strong></div></div>
          {headerButtons}
        </div>
      </header>

      <main className="cc-main">
        <div className="cc-col">
          {patientCard}
          {surveyCard}
        </div>
        <div className="cc-col cc-centre">
          {monitorCard}
        </div>
        <div className="cc-col cc-right">{rightColumn()}</div>
      </main>
      {footer}
      <div className="cc-stage">{stage === "expectant" ? "EXPECTANT" : stage.replace(/_/g, " ").toUpperCase()} · {SCOPE_LABEL[scope] ?? "No clinician"}{lead ? ` · ${lead.appliance.callsign}` : ""}</div>
    </div>
  );
}

function na(running: boolean): { status: string; tone: "go" | "warn" | "stop" | "off" } {
  return running ? { status: "Assessing…", tone: "warn" } : { status: "Not assessed", tone: "off" };
}

function Card({ title, icon, children, tone, fill, headerExtra }: { title: string; icon: string; children: ReactNode; tone?: "stop" | "warn" | "go"; fill?: boolean; headerExtra?: ReactNode }) {
  return (
    <section className={`cc-card${fill ? " fill" : ""}${tone ? ` ${tone}` : ""}`}>
      <header><b>{icon}</b><span>{title.toUpperCase()}</span>{headerExtra}</header>
      <div className="cc-card-body">{children}</div>
    </section>
  );
}
