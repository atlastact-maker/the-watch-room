"use client";

// MDT development harness. The real incident MDT, driven by a fixture
// world built from a scenario: two pumps on scene with a BA team in and a
// jet working, the simulator ticking the fire, a crew on the hydrant. For
// looking at the screens and screenshotting them without a shift.
//
//   ?s=02         scenario id (default 02, the Wythenshawe dwelling fire)
//   ?unit=<id>    appliance to open the control page on (default first pump);
//                 "dca" picks the ambulance, paired to the first casualty
//                 with a survey done, leads and a probe on, oxygen and
//                 aspirin given, so the casualty care screen has a patient
//   ?min=14       minutes since the call (default 14)
//   ?fast=1       tasks started from the screens run twenty times faster
//   ?desk=1       the desk's ground map instead of the tablet
//   ?lanes=1      (RTC, with ?police=1) the roads policing crew closing lane 1
//                 at the scene; ?lanes=done once the closure is in force
//   ?junction=1   (RTC, with ?police=1) the carriageway shut at the junction
//
// Tasks started from the tablet (a CRS action on a vehicle, the
// extrication) run here as local tasks that complete on their clock, so
// the screens that read them back — the RTC stage's picture — can be
// watched without a shift.

import { useEffect, useMemo, useState } from "react";
import "../../dashboard/vector/vector.css";
import { PATCH } from "@/lib/sim/areas";
import { DraggableIncidentMdt } from "../../dashboard/components/incident-mdt";
import { GroundSceneMap } from "../../dashboard/components/ground-scene-map";
import { resolveDeployments } from "../../dashboard/components/incident-view";
import { SCENARIOS } from "@/lib/sim/scenarios";
import { applyVariant } from "@/lib/sim/scene";
import { STATIONS, getStationAppliances } from "@/lib/sim/data";
import { simulateIncident } from "@/lib/sim/incident_sim";
import { busyOn, withCrewAssignment } from "@/lib/sim/crew_assign";
import { advanceLiveVitals } from "@/lib/sim/vitals";
import { calibrate, generateProfile, initialPhysio } from "@/lib/sim/physiology";
import type { PatientTreatmentState } from "@/lib/sim/incident_types";
import { newResusState, type ResusState } from "@/lib/sim/resus";
import type { StationWithAppliances } from "../../dashboard/page";
import type { Deployment, Incident, LogEntry, Task } from "@/lib/sim/incident_types";
import type { Eta } from "../../dashboard/components/deployment-board";

const FRONTLINE = new Set(["WrL", "WrT", "L6P", "TRU_pump"]);

function param(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

function offset(p: { lat: number; lng: number }, dxM: number, dyM: number) {
  return { lat: p.lat + dyM / 111_000, lng: p.lng + dxM / (111_000 * Math.cos((p.lat * Math.PI) / 180)) };
}

function buildWorld(scenarioId: string, minutesIn: number) {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
  // ?place=kitchen puts the casualty somewhere else by adding it to the
  // label (the scene reads the label first); ?pose=sitting|supine likewise.
  const PLACE_WORDS: Record<string, string> = {
    lounge: "in the living room", hallway: "on the hallway floor", bedroom: "in the bedroom", kitchen: "in the kitchen", bathroom: "in the bathroom",
    stairs: "sat on the stairs", ward: "on the ward", restaurant: "in the restaurant", changing_room: "in the changing rooms", shop: "in the shop",
    pavement: "on the pavement", road: "in the road", motorway: "on the hard shoulder of the motorway", pitch: "on the pitch", park: "in the park",
    moor: "on the moor", lakeside: "by the lake", platform: "on the platform", factory: "on the factory floor", site: "on the building site", yard: "in the yard",
  };
  const placeWord = PLACE_WORDS[param("place") ?? ""];
  const poseWord = param("pose") === "sitting" ? "sat up" : param("pose") === "supine" ? "collapsed on the floor" : "";
  // ?variant=<id> plays tonight's run as that scene variant: the casualty
  // the crew find is the variant's, not the base.
  const variantId = param("variant");
  const scenarioTonight = variantId && scenario.scene ? { ...scenario, scene: applyVariant(scenario.scene, variantId).scene } : scenario;
  const first = scenarioTonight.scene?.casualties?.[0];
  const casualty = first && (placeWord || poseWord) ? { ...first, label: `${first.label ?? "Patient"}, ${[poseWord, placeWord].filter(Boolean).join(", ")}` } : first;
  const scenarioForWorld = casualty && first && casualty !== first && scenarioTonight.scene
    ? { ...scenarioTonight, scene: { ...scenarioTonight.scene, casualties: scenarioTonight.scene.casualties?.map((c) => (c.id === casualty.id ? casualty : c)) } }
    : scenarioTonight;
  const nowMs = Date.now();
  const receivedAt = nowMs - minutesIn * 60_000;
  const stations: StationWithAppliances[] = STATIONS.map((s) => ({ ...s, appliances: getStationAppliances(s.id) }));
  const firstDue =
    stations.find((s) => s.id === scenario.property.firstDueStationId && s.appliances.some((a) => FRONTLINE.has(a.type))) ??
    stations.find((s) => s.service === "Fire" && s.appliances.some((a) => FRONTLINE.has(a.type)))!;
  const pumps = firstDue.appliances.filter((a) => FRONTLINE.has(a.type));
  const p1 = pumps[0];
  const others = stations
    .filter((s) => s.service === "Fire" && s.id !== firstDue.id)
    .flatMap((s) => s.appliances)
    .filter((a) => FRONTLINE.has(a.type) && a.crewMembers.length >= 4);
  const p2 = pumps[1] ?? others[0];
  const p3 = others.find((a) => a.id !== p2?.id);
  const dca = stations.filter((s) => s.service === "Ambulance").flatMap((s) => s.appliances).find((a) => a.type === "DCA");
  // A roads policing car for the live carriageway, with ?police=1.
  const rpu = param("police") ? stations.filter((s) => s.service === "Police").flatMap((s) => s.appliances).find((a) => a.type === "Police_RPU") ?? null : null;
  // The air ambulance on the ground beyond the wreck, with ?hems=1.
  const hems = param("hems") ? stations.filter((s) => s.service === "Ambulance").flatMap((s) => s.appliances).find((a) => a.type === "HEMS") ?? null : null;

  const incident: Incident = { id: "DEV-1", scenarioId: scenario.id, scenario: scenarioForWorld, receivedAt };
  const here = scenario.location.coords;
  const mk = (applianceId: string, mobilisedAgoSec: number, etaSec: number, park: { lat: number; lng: number } | null, extra: Partial<Deployment> = {}): Deployment =>
    ({
      applianceId,
      incidentId: "DEV-1",
      slotId: "extra",
      mobilisedAt: nowMs - mobilisedAgoSec * 1000,
      etaSeconds: etaSec,
      arrivesAt: nowMs - mobilisedAgoSec * 1000 + etaSec * 1000,
      lightState: "999",
      parkingPos: park ?? undefined,
      parkingBearingDeg: 90,
      ...extra,
    }) as Deployment;

  const ba1 = p1.crewMembers[1]?.id ?? p1.crewMembers[0].id;
  const ba2 = p1.crewMembers[2]?.id ?? p1.crewMembers[0].id;
  const j1 = p2.crewMembers[1]?.id ?? p2.crewMembers[0].id;
  const j2 = p2.crewMembers[2]?.id ?? p2.crewMembers[0].id;
  const h1 = p2.crewMembers[3]?.id ?? p2.crewMembers[0].id;

  // Parked for a house: either side of the frontage. Parked for a road:
  // along the hard shoulder upstream of the wreck, the ambulance beyond
  // it, the roads policing car furthest back. Scene +y is south, so the
  // offsets' dy is the negative of the scene's y.
  const road = !!scenario.scene?.carriageway;
  const park = (dx: number, dy: number) => offset(here, dx, dy);
  const deployments: Deployment[] = [
    mk(p1.id, 13 * 60, 5 * 60, road ? park(-22, 10.5) : park(-28, -14), { pumpRunning: !road, pumpOperatorCrewId: road ? undefined : p1.crewMembers[0]?.id, crewEquipment: road ? {} : { [ba1]: ["ba_set", "branch_45mm", "radio"], [ba2]: ["ba_set", "thermal_camera", "radio"] } }),
    mk(p2.id, 12 * 60, 6 * 60, road ? park(-31, 10.5) : park(30, -18), { pumpRunning: !road, pumpOperatorCrewId: road ? undefined : p2.crewMembers[0]?.id, crewEquipment: road ? {} : { [j1]: ["branch_45mm"], [j2]: ["branch_45mm"], [h1]: ["standpipe", "red_key"] } }),
  ];
  if (p3) deployments.push(mk(p3.id, 3 * 60, 6 * 60, null));
  if (rpu) deployments.push(mk(rpu.id, 8 * 60, 5 * 60, road ? park(-52, 7.3) : park(-40, -8)));
  if (hems) deployments.push(mk(hems.id, 9 * 60, 5 * 60, road ? park(46, 9.5) : park(24, -34), { parkingBearingDeg: road ? 70 : 20 }));
  // The ambulance crew are with the first casualty: survey done, leads and
  // a probe on, oxygen running, aspirin given.
  const unitParam = param("unit");
  const careMode = unitParam === "dca" && !!dca && !!casualty;
  if (dca) deployments.push(mk(dca.id, 9 * 60, 6 * 60, road ? park(27, 10.5) : park(-10, 26), careMode || (road && casualty) ? { treatingCasualtyId: casualty!.id, treatingSince: nowMs - 5 * 60_000 } : {}));
  let treatment: PatientTreatmentState | null = null;
  let resus: ResusState | null = null;
  if (careMode && casualty) {
    const clinical: NonNullable<typeof casualty.clinical> = casualty.clinical ?? { vitals: { rr: 20, spo2: 95, hr: 98, bpSys: 128, bpDia: 80, gcs: 15, temp: 36.6, bm: 5.8 }, presumedCondition: "Unwell", redFlags: [], preferredDestination: "nearest_a_e" as const, criticalInterventions: [] };
    // An authored arrest has had no output since before the call: no oral
    // aspirin, no nasal cannula — the crew bag him — and the board is open
    // before anything else, the way live play opens it the moment the
    // survey finds no output.
    const authoredArrest = clinical.redFlags.includes("cardiac_arrest");
    // Nobody unresponsive swallows a tablet: a GCS below 9 gets a
    // non-rebreather rather than a cannula, and no aspirin.
    const cannotSwallow = authoredArrest || clinical.vitals.gcs < 9;
    const seed = `DEV-1:${casualty.id}`;
    const profile = generateProfile(seed, casualty, casualty.clinical);
    const by = dca!.callsign;
    const t0 = nowMs - 5 * 60_000;
    const base: PatientTreatmentState = {
      casualtyId: casualty.id,
      profile,
      surveyStartedAt: t0 - 60_000,
      surveyCompletedAt: t0,
      revealedVitals: clinical.vitals,
      revealedCondition: clinical.presumedCondition,
      revealedRedFlags: clinical.redFlags,
      preferredDestination: clinical.preferredDestination,
      postRosc: clinical.postRosc,
      liveVitals: { ...clinical.vitals },
      prevLiveVitals: { ...clinical.vitals },
      prevLiveVitalsAt: nowMs,
      liveVitalsLastTickAt: nowMs,
      activeRedFlags: [...clinical.redFlags],
      allergiesConfirmedAt: t0 + 30_000,
      monitoring: { ecg_leads: t0 + 60_000, spo2_probe: t0 + 50_000 },
      oxygen: authoredArrest ? { device: "bvm", flowLpm: 15, at: t0 + 60_000 } : cannotSwallow ? { device: "nrb", flowLpm: 15, at: t0 + 90_000 } : { device: "nasal_cannula", flowLpm: 2, at: t0 + 90_000 },
      airway: {},
      breathing: authoredArrest ? { bvm: t0 + 60_000 } : { oxygen_15l: t0 + 90_000 },
      circulation: { iv_access: t0 + 150_000 },
      drugs: cannotSwallow ? {} : { aspirin_300: t0 + 120_000 },
      doses: cannotSwallow ? [] : [{ drug: "aspirin_300", at: t0 + 120_000, by }],
      packaging: {},
      egress: {},
      events: [
        { kind: "survey_started", at: t0 - 60_000 },
        { kind: "survey_completed", at: t0 },
        { kind: "allergies_confirmed", at: t0 + 30_000, by, text: profile.allergies.length ? profile.allergies.map((a) => a.agent).join(", ") : "NKDA" },
        { kind: "monitoring", at: t0 + 50_000, by, device: "spo2_probe" },
        { kind: "monitoring", at: t0 + 60_000, by, device: "ecg_leads" },
        ...(authoredArrest
          ? [{ kind: "breathing" as const, action: "bvm" as const, at: t0 + 60_000, by }]
          : cannotSwallow
            ? [{ kind: "breathing" as const, action: "oxygen_15l" as const, at: t0 + 90_000, by }]
            : [
                { kind: "breathing" as const, action: "oxygen_15l" as const, at: t0 + 90_000, by },
                { kind: "drug" as const, drug: "aspirin_300" as const, at: t0 + 120_000, by },
              ]),
        { kind: "circulation", action: "iv_access", at: t0 + 150_000, by },
      ],
    };
    treatment = { ...base, physio: calibrate(base, initialPhysio(clinical, profile, seed), clinical.vitals, nowMs) };
    if (authoredArrest && !param("look")) {
      // Board open and monitored off the leads, nobody on the chest yet;
      // the downtime clock runs from the call, as it does in live play.
      resus = { ...newResusState(casualty.id, t0 - 2 * 60_000, clinical.arrestRhythmHint === "non_shockable" ? "asystole" : "vf"), monitor: "lead_3" };
    }
    // ?look=arrest: the same patient four minutes into a resuscitation —
    // on the floor, pads and an i-gel on, a crew member on the chest.
    if (param("look") === "arrest") {
      const a0 = nowMs - 4 * 60_000;
      treatment = {
        ...treatment,
        liveVitals: { ...clinical.vitals, hr: 0, bpSys: 0, bpDia: 0, spo2: 70, rr: 0, gcs: 3 },
        activeRedFlags: authoredArrest ? [...clinical.redFlags] : [...clinical.redFlags, "cardiac_arrest"],
        revealedRedFlags: authoredArrest ? [...clinical.redFlags] : [...clinical.redFlags, "cardiac_arrest"],
        monitoring: { ...base.monitoring, defib_pads: a0 + 30_000 },
        airway: { igel: a0 + 90_000 },
        breathing: { bvm: a0 + 40_000 },
        circulation: { ...base.circulation, cpr: a0 + 10_000, defib: a0 + 60_000 },
        events: [
          ...base.events,
          { kind: "physio", at: a0, text: "CARDIAC ARREST — collapsed, no output · VF. Start compressions, pads on.", tone: "critical", adverse: true },
          { kind: "monitoring", at: a0 + 30_000, by, device: "defib_pads" },
          { kind: "circulation", action: "defib", at: a0 + 60_000, by },
          { kind: "airway", action: "igel", at: a0 + 90_000, by },
        ],
      };
      resus = { ...newResusState(casualty.id, a0, "vf"), monitor: "pads", airway: "igel", shocks: 1, lastShockAt: a0 + 60_000, cycle: 2, cycleStartedAt: nowMs - 70_000, compressorCrewId: `${dca!.id}-1`, compressorName: by, compressorSinceAt: nowMs - 70_000, cyclePausedAt: undefined, adrenalineDoses: 1, lastAdrenalineAt: a0 + 180_000 };
    }
    // ?look=twelve: the same patient with a 12-lead taken — the chest
    // electrodes on top of the limb leads.
    if (param("look") === "twelve") {
      treatment = {
        ...treatment,
        monitoring: { ...treatment.monitoring, ecg_12: t0 + 200_000 },
        events: [...treatment.events, { kind: "monitoring", at: t0 + 200_000, by, device: "ecg_12" }, { kind: "observation", at: t0 + 200_000, by, text: "12-lead ECG · Sinus rhythm · ST elevation II, III, aVF — inferior STEMI" }],
      };
    }
  }

  const started = nowMs - 6 * 60_000;
  const tasks = [
    ...(careMode && param("rescued") ? [{ id: "t-extract", applianceId: p1.id, kind: "extract_casualty" as const, state: "completed" as const, startedAt: nowMs - 6 * 60_000, endedAt: nowMs - 3 * 60_000, assignedCrewIds: [], casualtyId: casualty!.id }] : []),
    { id: "t-cmd", applianceId: p1.id, kind: "commander", state: "active", startedAt: nowMs - 8 * 60_000, assignedCrewIds: [p1.crewMembers[0].id] },
    { id: "t-survey", applianceId: p1.id, kind: "survey", state: "completed", startedAt: nowMs - 8 * 60_000, durationSec: 90, completesAt: nowMs - 6.5 * 60_000, assignedCrewIds: [p1.crewMembers[0].id] },
    {
      id: "t-ba", applianceId: p1.id, kind: "ba_sar", state: "active", startedAt: started, durationSec: 20 * 60, completesAt: started + 20 * 60_000,
      assignedCrewIds: [ba1, ba2], baCrewIds: [ba1, ba2], baMode: "firefighting", entryPoint: "Front door", baRemarks: "Fire first floor front, left-hand search",
      baStartPressure: { [ba1]: 300, [ba2]: 300 }, baPressure: { [ba1]: 214, [ba2]: 196 }, baEntryAt: { [ba1]: started + 60_000, [ba2]: started + 60_000 },
      baWhistleAt: { [ba1]: started + 22 * 60_000, [ba2]: started + 21 * 60_000 }, entryControlOfficerId: p1.crewMembers[3]?.id,
    },
    { id: "t-jet", applianceId: p2.id, kind: "hose_attack", state: "active", startedAt: nowMs - 4 * 60_000, assignedCrewIds: [j1, j2], attackMode: "exterior_attack", hoseType: "45mm" },
    { id: "t-hyd", applianceId: p2.id, kind: "connect_hydrant", state: "completed", startedAt: nowMs - 5 * 60_000, durationSec: 120, completesAt: nowMs - 3 * 60_000, assignedCrewIds: [h1], hydrantId: "H1" },
  ].filter((t) => !road || t.kind === "commander" || t.kind === "survey" || t.kind === "extract_casualty") as unknown as Task[];
  // The traffic management to look at on a road: lane 1 going in or in
  // force, the carriageway shut at the junction.
  if (road && rpu && param("lanes")) {
    const done = param("lanes") === "done";
    tasks.push({ id: "t-lane", applianceId: rpu.id, kind: "lane_closure", state: done ? "completed" : "active", startedAt: nowMs - (done ? 240_000 : 60_000), durationSec: 180, completesAt: nowMs + (done ? -60_000 : 120_000), assignedCrewIds: rpu.crewMembers.slice(0, 2).map((m) => m.id), lanes: [1] } as unknown as Task);
  }
  if (road && rpu && param("junction")) {
    tasks.push({ id: "t-junction", applianceId: rpu.id, kind: "carriageway_closure", state: "completed", startedAt: nowMs - 600_000, durationSec: 420, completesAt: nowMs - 180_000, assignedCrewIds: rpu.crewMembers.slice(0, 2).map((m) => m.id), junction: "J17" } as unknown as Task);
  }

  const crewAir: Record<string, number> = { [ba1]: 71, [ba2]: 65 };
  const t = (minAgo: number) => nowMs - minAgo * 60_000;
  const log: LogEntry[] = [
    { id: "l1", timestamp: t(minutesIn), kind: "incident_opened", message: `Incident opened — ${scenario.title}` },
    { id: "l2", timestamp: t(minutesIn - 0.4), kind: "mobilised", message: `Mobilised ${p1.callsign} · ETA 5 min` },
    { id: "l3", timestamp: t(minutesIn - 0.6), kind: "mobilised", message: `Mobilised ${p2.callsign} · ETA 6 min` },
    { id: "l4", timestamp: t(8), kind: "in_attendance", message: `${p1.callsign} in attendance — smoke issuing first floor front` },
    { id: "l5", timestamp: t(6.5), kind: "annotation", message: "360 complete — persons reported, gas meter under the stairs" },
    { id: "l6", timestamp: t(6), kind: "ba_committed", message: `BA committed ×2 from ${p1.callsign} — firefighting, front door` },
    { id: "l7", timestamp: t(4), kind: "annotation", message: `${p2.callsign} — jet in use, hydrant supply being laid` },
  ] as LogEntry[];
  const informantLog = [
    { id: "i1", text: "There's smoke pouring out of the upstairs window!", tone: "urgent", firedAt: t(minutesIn - 0.2) },
    { id: "i2", text: "I think the lad from number 12 is still in there.", tone: "critical", firedAt: t(minutesIn - 0.8) },
  ] as unknown as NonNullable<Parameters<typeof DraggableIncidentMdt>[0]["informantLog"]>;
  const etas = Object.fromEntries(stations.map((s, i) => [s.id, { seconds: 240 + ((i * 37) % 400), meters: 3000 + ((i * 911) % 6000), coords: null }])) as unknown as Record<string, Eta>;
  const vehicleGauges = Object.fromEntries([p1, p2, p3, dca].filter(Boolean).map((a) => [a!.id, { fuelPct: 82, waterPct: a!.service === "Fire" ? 58 : 100, conditionPct: 96 }]));

  return { incident, stations, deployments, tasks, crewAir, log, informantLog, etas, vehicleGauges, busyCrewIds: new Set<string>([ba1, ba2, j1, j2]), commanderId: p1.id, unitId: careMode ? dca!.id : unitParam === "rpu" && rpu ? rpu.id : p1.id, rpuId: rpu?.id ?? null, baCrews: { [p1.id]: 2 }, treatment, resus };
}

export default function MdtHarnessPage() {
  const [now, setNow] = useState(() => Date.now());
  const [world] = useState(() => buildWorld(param("s") ?? "02", Number(param("min") ?? 14)));
  // The deployments change under the screens: a clinician sent to a
  // casualty from the ground view is written back here.
  const [deployments, setDeployments] = useState(world.deployments);
  const unitParam = param("unit");
  const [unitId, setUnitId] = useState<string | null>(unitParam && unitParam !== "dca" && unitParam !== "rpu" ? unitParam : world.unitId);
  // What the screens send up to control, kept locally: a Highways request
  // starts the ROC's clock the way it does on the desk.
  const [extraLog, setExtraLog] = useState<LogEntry[]>([]);
  const log = useMemo(() => [...world.log, ...extraLog], [world.log, extraLog]);
  const requestSupport = (kind: string, applianceId: string) => {
    const at = Date.now();
    setExtraLog((l) => [...l, { id: kind === "highways" ? `hw-ask:DEV-1:${at}` : `vec:${at}:${l.length}`, timestamp: at, kind: "annotation", message: `${applianceId} → CONTROL: requests ${kind}` }]);
  };
  const [treatment, setTreatment] = useState<PatientTreatmentState | null>(world.treatment);
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      setTreatment((tx) => (tx && tx.liveVitalsLastTickAt ? advanceLiveVitals(tx, (t - tx.liveVitalsLastTickAt) / 1000, t) : tx));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  const treatmentByCasualtyId = useMemo(() => (treatment ? { [treatment.casualtyId]: treatment } : {}), [treatment]);
  const [extra, setExtra] = useState<Task[]>([]);
  // ?cold=1 — nothing done yet: no jet, no BA team, so the fire is seen
  // as it develops on its own.
  const cold = !!param("cold");
  const tasks = useMemo(() => [...world.tasks.filter((t) => !cold || (t.kind !== "hose_attack" && t.kind !== "ba_sar" && t.kind !== "gain_entry")), ...extra.map((t) => (t.state === "active" && t.completesAt && now >= t.completesAt ? { ...t, state: "completed" as const } : t))], [world.tasks, extra, now, cold]);
  const speed = param("fast") ? 20 : 1;
  const startTask = (args: { applianceId: string; kind: Task["kind"]; assignedCrewIds?: string[]; crsVehicleId?: string; crsActionId?: string; crsDurationSec?: number; crsLabel?: string; crsDoneMessage?: string; lanes?: number[]; junction?: string; attackMode?: Task["attackMode"]; hoseType?: Task["hoseType"]; baMode?: Task["baMode"]; targetCompartmentId?: string; openingId?: string; ventMode?: Task["ventMode"] }) => {
    const t0 = Date.now();
    const base = args.crsDurationSec ?? (args.kind === "rtc_extrication" ? 300 : args.kind === "fend_off" ? 45 : args.kind === "lane_closure" ? 90 + 45 * Math.max(1, args.lanes?.length ?? 1) : args.kind === "rolling_road_block" ? 240 : args.kind === "carriageway_closure" ? 420 : 120);
    const dur = Math.max(3, base / speed);
    setExtra((e) => [...e, { id: `h-${e.length + 1}`, applianceId: args.applianceId, kind: args.kind, state: "active", startedAt: t0, durationSec: dur, completesAt: t0 + dur * 1000, assignedCrewIds: args.assignedCrewIds ?? [], crsVehicleId: args.crsVehicleId, crsActionId: args.crsActionId, crsLabel: args.crsLabel, crsDoneMessage: args.crsDoneMessage, lanes: args.lanes, junction: args.junction, attackMode: args.attackMode, hoseType: args.hoseType, baMode: args.baMode, baCrewIds: args.kind === "ba_sar" ? args.assignedCrewIds ?? [] : undefined, targetCompartmentId: args.targetCompartmentId, openingId: args.openingId, ventMode: args.ventMode } as unknown as Task]);
  };
  const abortTask = (id: string) => setExtra((e) => e.map((t) => (t.id === id ? { ...t, state: "aborted" as const, endedAt: Date.now() } : t)));
  const completeTask = (id: string) => setExtra((e) => e.map((t) => (t.id === id && t.state === "active" ? { ...t, state: "completed" as const } : t)));
  const assignCrew = (applianceId: string, crewId: string, casualtyId: string | null) => {
    const at = Date.now();
    const members = world.stations.flatMap((s) => s.appliances).find((a) => a.id === applianceId)?.crewMembers ?? [];
    setDeployments((prev) => prev.map((d) => (d.applianceId === applianceId ? withCrewAssignment(d, members, busyOn(tasks, applianceId), crewId, casualtyId, at) : d)));
  };
  const sim = useMemo(() => simulateIncident(world.incident, deployments, world.baCrews, tasks, now, treatmentByCasualtyId), [world, deployments, tasks, now, treatmentByCasualtyId]);
  // ?desk=1 — the desk's ground map over the same world, for looking at
  // what the desk draws without a shift.
  const [selectedApplianceId, setSelectedApplianceId] = useState<string | null>(null);
  const resolved = useMemo(() => resolveDeployments(deployments, world.stations, now), [deployments, world.stations, now]);
  if (param("desk")) {
    return (
      <div className="cad-application" style={{ position: "fixed", inset: 0, background: "#0b1118" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <GroundSceneMap
            incident={world.incident}
            resolved={resolved}
            onScene={resolved.filter((r) => r.phase === "at_incident").map((r) => ({ deployment: r.deployment, appliance: r.appliance }))}
            enRoute={resolved.filter((r) => r.phase === "mobile").map((r) => ({ deployment: r.deployment, appliance: r.appliance }))}
            sim={sim}
            tasks={tasks}
            treatmentByCasualtyId={treatmentByCasualtyId}
            sceneCommanderApplianceId={world.commanderId}
            crewAir={world.crewAir}
            busyCrewIds={world.busyCrewIds}
            vehicleGauges={world.vehicleGauges}
            selectedApplianceId={selectedApplianceId}
            now={now}
            onSetParkingPos={(id, lat, lng, bearingDeg) => setDeployments((prev) => prev.map((d) => (d.applianceId === id ? { ...d, parkingPos: { lat, lng }, parkingBearingDeg: bearingDeg } : d)))}
            rotatePendingApplianceId={null}
            onClearRotatePending={() => {}}
            onStartTask={startTask}
            onAbortTask={abortTask}
            onSelectAppliance={setSelectedApplianceId}
            stations={world.stations}
            deployments={deployments}
            patch={PATCH}
            onAssignCrewToCasualty={assignCrew}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="cad-application" style={{ position: "fixed", inset: 0, background: "#0b1118" }}>
      <div style={{ position: "absolute", left: 24, top: 16, width: 1180, height: 820 }}>
        <DraggableIncidentMdt
          incident={world.incident}
          stations={world.stations}
          deployments={deployments}
          log={log}
          outcome={null}
          onDeploy={() => {}}
          onStandDownForWelfare={() => {}}
          onResolve={() => {}}
          onDismiss={() => {}}
          onClose={() => {}}
          sim={sim}
          tasks={tasks}
          now={now}
          informantLog={world.informantLog}
          informantOnCall={false}
          treatmentByCasualtyId={treatmentByCasualtyId}
          resusByCasualtyId={world.resus ? { [world.resus.casualtyId]: world.resus } : undefined}
          ambient={{ hour: Number(param("hour") ?? 13), precip: param("rain") ? "rain" : "clear" }}
          hemsFlyable
          etas={world.etas}
          patch={PATCH}
          onStandDown={() => {}}
          sceneCommanderApplianceId={world.commanderId}
          crewAir={world.crewAir}
          busyCrewIds={world.busyCrewIds}
          vehicleGauges={world.vehicleGauges}
          onStartTask={startTask}
          onAbortTask={abortTask}
          onCompleteTask={completeTask}
          onAssignCrewToCasualty={assignCrew}
          onRequestSupport={requestSupport}
          onSetLightState={() => {}}
          onSetPumpRunning={() => {}}
          onSetPumpOperator={() => {}}
          onSetFastAttackDeployed={() => {}}
          onToggleCrewEquipment={() => {}}
          tacticalMode="offensive"
          fatigueByApplianceId={{}}
          structural={{ integrity: 78, collapsedAt: null, evacuatedAt: null, injured: 0 }}
          unitId={unitId}
          onSetUnitId={(id) => { if (id) setUnitId(id); }}
        />
      </div>
    </div>
  );
}
