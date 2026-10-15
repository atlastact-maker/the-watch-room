"use client";

// THE RTC STAGE — scene management for a road traffic collision, laid
// out the way casualty care is: the crash fills the Fire tab, the cards
// float over it, and the jobs sit on a round bar along the foot.
//
//   ┌ FIRE & RESCUE COMMAND ──────────────────────────────────────────────┐
//   │ track · headline      THE CAR, THE CREW AT WORK       facts · flags │
//   │ release clock                                         record        │
//   │ vehicles                                   (or the open section)    │
//   └─────────────────────────────────────────────────────────────────────┘
//    Command | Vehicle | Make safe · Glass · Space · Extricate · Hazards · Casualties | Log
//
// Every job is the same simulator task the three-column page ran: a
// crs_action on the vehicle with crew assigned, timed and logged, or the
// rtc_extrication that releases the casualty. The picture reads the tasks
// back — blocks in, glass out, doors off, roof gone, the ram on the dash
// — so what the crew have done is what the operator sees.

import { useState, type ReactNode } from "react";
import type { Appliance } from "@/lib/sim/types";
import type { CrsAction, CrsVehicle, Incident, LogEntry, Task } from "@/lib/sim/incident_types";
import { scopeOfApplianceType } from "@/lib/sim/incident_types";
import type { IncidentSimState } from "@/lib/sim/incident_sim";
import type { ResolvedDeployment } from "../components/incident-view";
import type { TaskWorkspaceProps } from "./mdt-task-workspace";
import { patientLook } from "@/lib/sim/patient_look";
import { RtcScene, WALK_OFF_MS, type RtcWork, type RtcFinished } from "./scene/plan-rtc";
import { trafficState, laneLabel } from "@/lib/sim/traffic";
import type { SceneCrew } from "./patient-scene";

export type RtcPanel = "vehicle" | "road" | "safe" | "glass" | "space" | "extricate" | "hazards" | "casualties" | "log";

export type RtcStageProps = {
  incident: Incident;
  appliance: Appliance;
  tasks: Task[];
  log: LogEntry[];
  now: number;
  resolved: ResolvedDeployment[];
  sim: IncidentSimState | null;
  freeCrew: Appliance["crewMembers"];
  canAct: boolean;
  resolvedIncident?: boolean;
  vehicleId: string | null;
  onPickVehicle: (id: string) => void;
  panel: RtcPanel | null;
  onPanel: (p: RtcPanel | null) => void;
  onStartTask?: TaskWorkspaceProps["onStartTask"];
  onAbortTask?: (taskId: string) => void;
  /** Assistance messages to control: police for the road, National Highways. */
  onRequestSupport?: (kind: string, applianceId: string) => void;
  /** Back to the command pages. */
  onBack: () => void;
  tablet?: boolean;
  /** The hour of the day, for the light on the picture. */
  hour?: number;
  rain?: boolean;
};

/** The standard space-creation set on any vehicle at an RTC. The
 *  datasheet's own make-safe actions come first; these follow, each
 *  behind the one it depends on — nobody cuts a roof before the glass
 *  is managed or rolls a dash on a car that is still rocking. Ids are
 *  `std-*` so a datasheet's own "stabilise" or "glass" replaces them. */
export type SpaceAction = {
  id: string;
  label: string;
  detail: string;
  durationSec: number;
  minCrew: number;
  after?: string[];
  kit?: string;
  critical?: boolean;
  done: (vrm: string) => string;
};
export const SPACE_CREATION: SpaceAction[] = [
  { id: "std-stabilise", label: "Stabilise vehicle", detail: "Blocks and chocks under the sills — kill the movement before anyone leans in", durationSec: 120, minCrew: 2, critical: true, done: (v) => `${v} stabilised on blocks and chocks — no movement on the shell` },
  { id: "std-glass", label: "Glass management", detail: "Film the screen, take the side glass out under control", durationSec: 90, minCrew: 1, done: (v) => `${v} glass managed — screen filmed, side glass removed` },
  { id: "std-doors-off", label: "Doors off", detail: "Spread the hinges, pop the latch — driver's door first, then the rear", durationSec: 180, minCrew: 2, after: ["stabilise"], kit: "Hydraulic", done: (v) => `${v} doors off — side access to the casualty` },
  { id: "std-third-door", label: "Third door conversion", detail: "B-pillar out with the rear door — full side access for the board", durationSec: 240, minCrew: 3, after: ["doors-off"], kit: "Hydraulic", done: (v) => `${v} third door conversion complete — B-pillar out, full side access` },
  { id: "std-roof-flap", label: "Roof flap", detail: "Cut the A- and B-pillars, fold the roof back over the boot", durationSec: 240, minCrew: 3, after: ["glass", "stabilise"], kit: "Hydraulic", done: (v) => `${v} roof flapped back — access from above` },
  { id: "std-roof-off", label: "Roof off", detail: "All pillars cut, roof lifted clear — full access from above", durationSec: 300, minCrew: 4, after: ["glass", "stabilise"], kit: "Hydraulic", done: (v) => `${v} roof off and clear — full access from above` },
  { id: "std-dash-roll", label: "Dash roll", detail: "Relief cuts at the A-pillar base, ram footed on the sill — lift the dash off the legs", durationSec: 240, minCrew: 3, after: ["stabilise", "doors-off"], kit: "Hydraulic", done: (v) => `${v} dash rolled — legs free of the pedal box` },
];
const SPACE_KEYS = new Set(["doors-off", "third-door", "roof-flap", "roof-off", "dash-roll"]);

/** Every distinct make-safe action on a datasheet — whole-vehicle first,
 *  then the components', deduped by id (a shared id is one job). */
export function datasheetActions(v: CrsVehicle): CrsAction[] {
  const out: CrsAction[] = [];
  const seen = new Set<string>();
  for (const a of [...(v.actions ?? []), ...v.components.map((c) => c.action).filter((a): a is CrsAction => !!a)]) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    out.push(a);
  }
  return out;
}

type Tone = "go" | "warn" | "stop" | "";
const STRIP = (id: string) => id.replace(/^std-/, "");

const TRACK: { key: string; short: string; label: string }[] = [
  { key: "scene", short: "Scene", label: "Crews on scene" },
  { key: "safe", short: "Safe", label: "Vehicle made safe" },
  { key: "stable", short: "Blocks", label: "Stabilised on blocks" },
  { key: "glass", short: "Glass", label: "Glass managed" },
  { key: "access", short: "Doors", label: "Doors off" },
  { key: "space", short: "Space", label: "Space created" },
  { key: "release", short: "Out", label: "Casualty released" },
  { key: "handover", short: "Handed", label: "With the ambulance" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const I = {
  command: <Icon d="M4 4h16v6H4zM4 14h16v6H4z" />,
  car: <Icon d="M5 13l2-5h10l2 5M4 13h16v5H4zM7 18v2m10-2v2M7 15h2m6 0h2" />,
  bolt: <Icon d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  glass: <Icon d="M4 5h16v11H4zM4 16l4-6 4 5 3-3 5 4M9 20h6" />,
  cut: <Icon d="M6 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM8.5 10.5 20 4M8.5 13.5 20 20" />,
  lane: <Icon d="M4 3v18M20 3v18M12 3v4m0 3v4m0 3v4" />,
  exit: <Icon d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10" />,
  warn: <Icon d="M12 3l9 16H3zM12 10v4m0 3h.01" />,
  people: <Icon d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm7 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20a7 7 0 0 1 14 0m1-1a5 5 0 0 1 5 1" />,
  clock: <Icon d="M12 8v5l3 2m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
};

function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function wall(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit" });
}

function Group({ title, extra, children }: { title: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="cc-group">
      <header><span>{title}</span>{extra}</header>
      <div className="cc-group-body">{children}</div>
    </section>
  );
}

export function RtcStage(props: RtcStageProps) {
  const { incident, appliance, tasks, log, now, resolved, sim, freeCrew, canAct, panel, onPanel } = props;
  const sc = incident.scenario;
  const crsVehicles = sc.crs ?? [];
  const vehicle = crsVehicles.find((v) => v.id === props.vehicleId) ?? crsVehicles[0] ?? null;
  const [showComponents, setShowComponents] = useState(true);
  const onScene = resolved.filter((r) => r.phase === "at_incident");
  const fireOnScene = onScene.filter((r) => r.appliance.service === "Fire");
  const callsignOf = (applianceId: string) => resolved.find((r) => r.appliance.id === applianceId)?.appliance.callsign ?? applianceId;

  // ---- What has been done to each vehicle -----------------------------------
  const crsState = (vehicleId: string, actionId: string): { state: "ready" } | { state: "active"; task: Task } | { state: "done"; task: Task } => {
    const list = tasks.filter((t) => t.kind === "crs_action" && t.crsVehicleId === vehicleId && t.crsActionId === actionId && t.state !== "aborted");
    const done = list.find((t) => t.state === "completed");
    if (done) return { state: "done", task: done };
    const running = list.find((t) => t.state === "active");
    return running ? { state: "active", task: running } : { state: "ready" };
  };
  const keyDone = (v: CrsVehicle, key: string) => crsState(v.id, key).state === "done" || crsState(v.id, `std-${key}`).state === "done";
  const carriesKit = (needle: string) => appliance.kit.some((k) => k.toLowerCase().includes(needle.toLowerCase()));
  const stdFor = (v: CrsVehicle) => SPACE_CREATION.filter((a) => !datasheetActions(v).some((d) => `std-${d.id}` === a.id));
  const criticalOf = (v: CrsVehicle) => [...datasheetActions(v).filter((a) => a.critical).map((a) => a.id), ...stdFor(v).filter((a) => a.critical).map((a) => a.id)];
  const madeSafe = (v: CrsVehicle) => criticalOf(v).every((id) => crsState(v.id, id).state === "done");
  const criticalDone = (v: CrsVehicle) => criticalOf(v).filter((id) => crsState(v.id, id).state === "done").length;
  const doneKeys = (v: CrsVehicle) => new Set(tasks.filter((t) => t.kind === "crs_action" && t.crsVehicleId === v.id && t.state === "completed" && t.crsActionId).map((t) => STRIP(t.crsActionId!)));
  // Where a crew came from: the last job on the same appliance that ended
  // in the couple of minutes before this one started. Without one they
  // run in from the appliance; with one they walk over from it.
  const endOf = (t: Task) => (t.state === "completed" ? t.completesAt ?? t.startedAt : t.endedAt ?? t.startedAt);
  const crsJobs = tasks.filter((t) => t.kind === "crs_action" && t.crsActionId);
  const cameFrom = (applianceId: string, startedAt: number) => {
    const prev = crsJobs.filter((p) => p.applianceId === applianceId && p.state !== "active" && endOf(p) <= startedAt && startedAt - endOf(p) < 120_000).sort((a, b) => endOf(b) - endOf(a))[0];
    return prev ? { key: prev.crsActionId!, endedAt: endOf(prev) } : undefined;
  };
  const workingOn = (v: CrsVehicle): RtcWork[] => crsJobs.filter((t) => t.crsVehicleId === v.id && t.state === "active").map((t) => ({ key: t.crsActionId!, crew: t.assignedCrewIds.length, startedAt: t.startedAt, applianceId: t.applianceId, prev: cameFrom(t.applianceId, t.startedAt) }));
  const finishedOn = (v: CrsVehicle): RtcFinished[] => crsJobs
    .filter((t) => t.crsVehicleId === v.id && t.state !== "active" && now - endOf(t) >= 0 && now - endOf(t) < WALK_OFF_MS)
    .filter((t) => !tasks.some((n) => (n.kind === "crs_action" || n.kind === "rtc_extrication") && n.state === "active" && n.applianceId === t.applianceId && n.startedAt >= endOf(t)))
    .map((t) => ({ key: t.crsActionId!, crew: t.assignedCrewIds.length, endedAt: endOf(t), applianceId: t.applianceId }));
  const extrication = tasks.find((t) => t.kind === "rtc_extrication" && t.state === "active") ?? tasks.find((t) => t.kind === "rtc_extrication" && t.state === "completed");
  const extricationState: "none" | "active" | "done" = extrication ? (extrication.state === "completed" ? "done" : "active") : "none";
  const allSafe = crsVehicles.length > 0 && crsVehicles.every(madeSafe);

  // ---- The road the job is on ---------------------------------------------------
  const carriageway = sc.scene?.carriageway ?? null;
  const highwaysAskedAt = carriageway ? log.filter((e) => e.id.startsWith(`hw-ask:${incident.id}:`)).map((e) => e.timestamp)[0] ?? null : null;
  const traffic = carriageway ? trafficState(carriageway, tasks, now, highwaysAskedAt) : null;
  const policeOnScene = onScene.filter((r) => r.appliance.service === "Police");
  const myFendOff = tasks.find((t) => t.kind === "fend_off" && t.applianceId === appliance.id && t.state !== "aborted") ?? null;
  const trafficJobs = tasks.filter((t) => (t.kind === "fend_off" || t.kind === "lane_closure" || t.kind === "rolling_road_block" || t.kind === "carriageway_closure") && t.state !== "aborted");
  const trafficJobLabel = (t: Task) => `${callsignOf(t.applianceId)} · ${t.kind === "fend_off" ? "fend-off" : t.kind === "lane_closure" ? `${laneLabel(t.lanes ?? [])} closed` : t.kind === "rolling_road_block" ? `rolling block from ${t.junction ?? "the junction"}` : `closed at ${t.junction ?? "the junction"}`}`;
  const laneNumbers = carriageway ? Array.from({ length: carriageway.lanes }, (_, i) => i + 1) : [];
  const laneState = (l: number) => (!traffic ? "closed" : traffic.blocked.includes(l) ? "blocked" : traffic.live.includes(l) ? "live" : traffic.held ? "held" : "closed");

  // ---- The people in the cars -----------------------------------------------------
  const casualties = sim?.foundCasualties ?? sc.scene?.casualties ?? [];
  const carLandmarks = (sc.scene?.landmarks ?? []).filter((l) => l.kind === "car");
  const near = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y) < 1.5;
  const casualtiesOf = (v: CrsVehicle) => {
    const i = crsVehicles.indexOf(v);
    const lm = carLandmarks[i];
    const byPos = lm ? casualties.filter((c) => near(c.pos, lm.pos)) : [];
    if (byPos.length) return byPos;
    return i === 0 ? casualties.filter((c) => c.trappedUntilExtricated) : [];
  };
  const trappedIn = (v: CrsVehicle) => casualtiesOf(v).filter((c) => c.trappedUntilExtricated && extricationState !== "done");
  const trappedAll = casualties.filter((c) => c.trappedUntilExtricated);
  const medicsWith = (casualtyId: string): SceneCrew[] => onScene
    .filter((r) => r.appliance.service === "Ambulance" && r.deployment.treatingCasualtyId === casualtyId)
    .map((r) => ({ callsign: r.appliance.callsign, role: r.appliance.type === "HEMS" ? "Doctor" : "Paramedic", service: "Ambulance" as const, scope: scopeOfApplianceType(r.appliance.type) }));

  // ---- Where the job is: the track, the headline, the clock ----------------
  const v = vehicle;
  const vDone = v ? doneKeys(v) : new Set<string>();
  const vWorking = v ? workingOn(v) : [];
  const milestones = v ? [
    fireOnScene.length > 0,
    datasheetActions(v).filter((a) => a.critical && a.id !== "stabilise").every((a) => crsState(v.id, a.id).state === "done") && fireOnScene.length > 0,
    keyDone(v, "stabilise"),
    keyDone(v, "glass"),
    keyDone(v, "doors-off") || keyDone(v, "third-door"),
    keyDone(v, "roof-flap") || keyDone(v, "roof-off") || keyDone(v, "dash-roll"),
    extricationState === "done",
    extricationState === "done" && trappedAll.some((c) => medicsWith(c.id).length > 0),
  ] : [];
  let trackIdx = -1;
  for (let i = 0; i < milestones.length; i++) { if (milestones[i]) trackIdx = i; else break; }
  const firstFireAt = fireOnScene.length ? Math.min(...fireOnScene.map((r) => r.deployment.arrivesAt)) : null;
  const releaseMs = extrication && extrication.state === "completed" && firstFireAt !== null ? (extrication.completesAt ?? now) - firstFireAt : firstFireAt !== null ? now - firstFireAt : null;
  const clockTone: Tone = releaseMs === null ? "" : extricationState === "done" ? "go" : trappedAll.length === 0 ? "" : releaseMs < 10 * 60_000 ? "go" : releaseMs < 20 * 60_000 ? "warn" : "stop";
  const workLabel = (key: string) => [...SPACE_CREATION.map((a) => ({ id: a.id, label: a.label })), ...(v ? datasheetActions(v).map((a) => ({ id: a.id, label: a.label })) : [])].find((a) => STRIP(a.id) === STRIP(key))?.label ?? "Working";
  const headline: { text: string; detail: string; tone: Tone } = !v
    ? { text: "NO VEHICLES", detail: "Nothing to make safe on this job", tone: "" }
    : extricationState === "done"
      ? { text: "CASUALTY RELEASED", detail: `${allSafe ? "Controlled release" : "Released on a live vehicle"} · ${wall(extrication!.completesAt ?? now)}`, tone: "go" }
      : extricationState === "active"
        ? { text: madeSafe(v) ? "CUTTING" : "CUTTING · VEHICLE NOT SAFE", detail: `${callsignOf(extrication!.applianceId)} · ${mmss((extrication!.completesAt ?? now) - now)} to go`, tone: madeSafe(v) ? "warn" : "stop" }
        : vWorking.length
          ? { text: workLabel(vWorking[0].key).toUpperCase(), detail: vWorking.map((w) => { const st = crsState(v.id, w.key); return st.state === "active" ? `${callsignOf(st.task.applianceId)} · ${mmss((st.task.completesAt ?? now) - now)} to go` : ""; }).filter(Boolean).join(" · "), tone: "warn" }
          : madeSafe(v)
            ? { text: "MADE SAFE", detail: "Every critical action done — controlled release available", tone: "go" }
            : { text: "NOT MADE SAFE", detail: `${criticalOf(v).length - criticalDone(v)} of ${criticalOf(v).length} critical outstanding · ${v.vrm}`, tone: fireOnScene.length ? "stop" : "warn" };

  // ---- Alerts: the one thing standing between the crew and the cut -----------
  const fuelComp = v?.components.find((c) => c.kind === "fuel_tank" && c.action);
  const fuelOpen = !!v && !!fuelComp?.action && crsState(v.id, fuelComp.action.id).state !== "done";
  const alerts: { key: string; tone: Tone; title: string; text: string; fresh?: boolean }[] = [];
  if (traffic && carriageway && !traffic.protected && fireOnScene.length) alerts.push({ key: "road", tone: "stop", title: traffic.headline, text: traffic.fendOff ? `Fend-off only — ${laneLabel(carriageway.mustClose)} shut or a block from ${carriageway.upstream} before the cut` : `Fend off · police to shut ${laneLabel(carriageway.mustClose)} · block from ${carriageway.upstream}`, fresh: extricationState === "active" || vWorking.length > 0 });
  if (extricationState === "active" && !allSafe) alerts.push({ key: "live", tone: "stop", title: "CUTTING ON A LIVE VEHICLE", text: "Critical actions outstanding — this goes in the log and the debrief", fresh: true });
  if (fuelOpen) alerts.push({ key: "fuel", tone: "stop", title: "FUEL ON THE CARRIAGEWAY", text: `${v!.vrm} tank split — blanket and contain it before any sharp work` });
  if (v && !carriesKit("Hydraulic")) alerts.push({ key: "kit", tone: "warn", title: "NO HYDRAULIC KIT", text: `${appliance.callsign} carries none — a rescue pump or the TRU cuts this car` });
  if (trappedAll.length && extricationState !== "done" && releaseMs !== null && releaseMs > 15 * 60_000) alerts.push({ key: "clock", tone: releaseMs > 20 * 60_000 ? "stop" : "warn", title: `RELEASE CLOCK ${mmss(releaseMs)}`, text: "Trapped casualty — twenty minutes from arrival to release is the target", fresh: releaseMs > 20 * 60_000 });
  const shownAlerts = alerts.slice(0, 3);

  // ---- The crew's jobs ------------------------------------------------------------
  function startCrs(veh: CrsVehicle, a: { id: string; label: string; durationSec: number; minCrew: number }, doneMessage: string) {
    const crew = freeCrew.slice(0, a.minCrew).map((c) => c.id);
    if (crew.length < a.minCrew) return;
    props.onStartTask?.({ applianceId: appliance.id, kind: "crs_action", assignedCrewIds: crew, crsVehicleId: veh.id, crsActionId: a.id, crsDurationSec: a.durationSec, crsLabel: `${a.label} · ${veh.vrm}`, crsDoneMessage: doneMessage });
  }
  const actionRow = (veh: CrsVehicle, a: { id: string; label: string; detail?: string; durationSec: number; minCrew: number; critical?: boolean }, doneMessage: string, blockedBy: string | null) => {
    const st = crsState(veh.id, a.id);
    const short = freeCrew.length < a.minCrew;
    const disabled = !canAct || st.state !== "ready" || short || !!blockedBy;
    const hint = blockedBy ?? (short ? `${a.minCrew} needed · ${freeCrew.length} free on ${appliance.callsign}` : `${a.minCrew} crew · ${Math.round(a.durationSec / 60)} min`);
    return (
      <div key={a.id} className={`fc-rtc-action${st.state === "done" ? " done" : st.state === "active" ? " on" : ""}${a.critical ? " critical" : ""}`}>
        <div className="txt">
          <b>{a.label}{a.critical ? <em title="Counts toward the vehicle being made safe">CRITICAL</em> : null}</b>
          <small>{st.state === "done" ? doneMessage : a.detail ?? ""}</small>
          <span className="meta">{st.state === "done" ? `Done ${wall(st.task.completesAt ?? st.task.startedAt)}` : st.state === "active" ? `${callsignOf(st.task.applianceId)} · ${mmss(Math.max(0, (st.task.completesAt ?? now) - now))} to go` : hint}</span>
        </div>
        {st.state === "ready" && <button type="button" className="pc-mini" disabled={disabled} title={hint} onClick={() => startCrs(veh, a, doneMessage)}>Start</button>}
        {st.state === "active" && <button type="button" className="pc-mini" onClick={() => props.onAbortTask?.(st.task.id)}>Abort</button>}
        {st.state === "done" && <span className="fc-rtc-tick">✓</span>}
      </div>
    );
  };
  const stdRow = (veh: CrsVehicle, a: SpaceAction) => {
    const missingKit = a.kit && !carriesKit(a.kit) ? `Needs ${a.kit.toLowerCase()} rescue kit — not on ${appliance.callsign}` : null;
    const waiting = (a.after ?? []).filter((k) => !keyDone(veh, k));
    const blocked = missingKit ?? (waiting.length ? `After ${waiting.map((k) => k.replace(/-/g, " ")).join(" and ")}` : null);
    return actionRow(veh, a, a.done(veh.vrm), blocked);
  };

  // ---- Sections ------------------------------------------------------------------------
  const vehiclePicker = (
    <div className="rs-veh-list">
      {crsVehicles.map((veh) => {
        const safe = madeSafe(veh);
        const trapped = trappedIn(veh).length;
        return (
          <button key={veh.id} type="button" className={`rs-veh${vehicle?.id === veh.id ? " on" : ""}${safe ? " safe" : ""}`} aria-pressed={vehicle?.id === veh.id} onClick={() => props.onPickVehicle(veh.id)}>
            <span className="anpr-plate">{veh.vrm}</span>
            <b>{veh.make} {veh.model}</b>
            <small>{veh.body === "van" ? "LGV" : "CAR"} · {veh.fuel === "bev" ? "ELECTRIC · HV" : veh.fuel === "phev" ? "PLUG-IN HYBRID" : veh.fuel.toUpperCase()}{trapped ? ` · ${trapped} TRAPPED` : ""}</small>
            <em className={safe ? "go" : "warn"}>{safe ? "MADE SAFE" : `${criticalDone(veh)}/${criticalOf(veh).length} critical done`}</em>
          </button>
        );
      })}
      {crsVehicles.length === 0 && <p className="pc-note">No vehicles on this job.</p>}
    </div>
  );
  const vehicleBody = v ? (
    <>
      <Group title="Vehicles" extra={<span className="cc-pill">{crsVehicles.filter(madeSafe).length} of {crsVehicles.length} made safe</span>}>{vehiclePicker}</Group>
      <Group title={`Datasheet · ${v.make} ${v.model}`} extra={<button type="button" className="cc-mini" aria-pressed={showComponents} onClick={() => setShowComponents((x) => !x)}>{showComponents ? "Hide on the car" : "Show on the car"}</button>}>
        <ul className="pc-findings">{v.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
        <div className="fc-rtc-comps">{v.components.map((c, i) => <span key={i} className={`fc-chip ${c.kind}${c.action && crsState(v.id, c.action.id).state === "done" ? " done" : ""}`}>{c.label}{c.action && crsState(v.id, c.action.id).state === "done" ? " ✓" : ""}</span>)}</div>
      </Group>
      <Group title="In the vehicle">
        {casualtiesOf(v).length === 0 ? <p className="cc-line">Nobody in it, or nobody found yet.</p> : casualtiesOf(v).map((c) => <p key={c.id} className={`cc-line${c.trappedUntilExtricated && extricationState !== "done" ? " stop" : ""}`}>{c.label ?? c.id}{c.trappedUntilExtricated ? (extricationState === "done" ? " · released" : " · TRAPPED") : ""}</p>)}
      </Group>
    </>
  ) : <p className="cc-line">No vehicles on this job.</p>;
  const safeBody = v ? (
    <>
      <Group title={`Make safe · ${v.vrm}`} extra={<span className={`cc-pill ${madeSafe(v) ? "go" : "warn"}`}>{madeSafe(v) ? "Made safe" : `${criticalDone(v)} of ${criticalOf(v).length} critical`}</span>}>
        <div className="fc-rtc-actions">
          {datasheetActions(v).filter((a) => a.id !== "glass").map((a) => actionRow(v, a, a.done, null))}
          {stdFor(v).filter((a) => a.id === "std-stabilise").map((a) => stdRow(v, a))}
        </div>
      </Group>
      <p className="cc-line">{freeCrew.length} free on {appliance.callsign}{!carriesKit("Hydraulic") ? " · no hydraulic kit" : ""}. Every critical action done unlocks a controlled release.</p>
    </>
  ) : null;
  const glassBody = v ? (
    <Group title={`Glass · ${v.vrm}`}>
      <div className="fc-rtc-actions">
        {datasheetActions(v).filter((a) => a.id === "glass").map((a) => actionRow(v, a, a.done, null))}
        {stdFor(v).filter((a) => a.id === "std-glass").map((a) => stdRow(v, a))}
      </div>
      <p className="cc-line">Film the screen and take the side glass out before any pillar is cut, so the casualty is not showered in it.</p>
    </Group>
  ) : null;
  const spaceBody = v ? (
    <Group title={`Space creation · ${v.vrm}`} extra={<span className="cc-pill">in the order the car allows</span>}>
      <div className="fc-rtc-actions">{stdFor(v).filter((a) => SPACE_KEYS.has(STRIP(a.id))).map((a) => stdRow(v, a))}</div>
    </Group>
  ) : null;
  const roadBody = carriageway && traffic ? (
    <>
      <Group title={`${carriageway.name} · ${carriageway.upstream} to ${carriageway.downstream}`} extra={<span className={`cc-pill ${traffic.protected ? "go" : "stop"}`}>{traffic.protected ? "Protected" : "Live"}</span>}>
        <div className={`rs-road ${traffic.protected ? "go" : "stop"}`}>
          <b>{traffic.headline}</b>
          <span>{traffic.detail}</span>
          <div className="rs-lanes">
            {carriageway.hardShoulder && <i className="hs">HS<small>hard shoulder</small></i>}
            {laneNumbers.map((l) => { const st = laneState(l); return <i key={l} className={st}>Lane {l}<small>{st === "blocked" ? "the wreck" : st === "live" ? "running past the work" : st === "held" ? `held from ${carriageway.upstream}` : traffic.closedAtJunction ? `shut at ${carriageway.upstream}` : "coned off"}</small></i>; })}
          </div>
        </div>
        <dl className="pb-facts rs-facts">
          <dt>In force</dt><dd className={trafficJobs.some((t) => t.state === "completed") ? "go" : ""}>{trafficJobs.filter((t) => t.state === "completed").map(trafficJobLabel).join(" · ") || "nothing yet"}</dd>
          <dt>Setting up</dt><dd>{trafficJobs.filter((t) => t.state === "active").map((t) => `${trafficJobLabel(t)} · ${mmss(Math.max(0, (t.completesAt ?? now) - now))}`).join(" · ") || "—"}</dd>
          <dt>Police</dt><dd className={policeOnScene.length ? "" : "warn"}>{policeOnScene.length ? policeOnScene.map((r) => r.appliance.callsign).join(" · ") : "none on scene"}</dd>
          <dt>Highways</dt><dd className={traffic.highways === "none" ? "warn" : "go"}>{traffic.highways === "none" ? "not asked" : traffic.highways === "requested" ? "asked — signals to follow" : traffic.highways === "signals" ? `signals set · traffic officers due ${traffic.highwaysDueAt ? wall(traffic.highwaysDueAt) : "soon"}` : traffic.closedAtJunction ? `holding ${carriageway.upstream}` : `on scene at ${carriageway.upstream}`}</dd>
        </dl>
      </Group>
      <Group title={`${appliance.callsign} on the road`}>
        <div className="fc-rtc-actions">
          <div className={`fc-rtc-action${myFendOff?.state === "completed" ? " done" : myFendOff ? " on" : ""}`}>
            <div className="txt">
              <b>Fend-off position</b>
              <small>Park the appliance across the live lanes upstream of the wreck, blues and rear reds on — it takes the hit, not the crew</small>
              <span className="meta">{myFendOff?.state === "completed" ? `In position ${wall(myFendOff.completesAt ?? myFendOff.startedAt)}` : myFendOff ? `${mmss(Math.max(0, (myFendOff.completesAt ?? now) - now))} to go` : "1 crew · 1 min · the appliance itself"}</span>
            </div>
            {!myFendOff && <button type="button" className="pc-mini" disabled={!canAct || freeCrew.length < 1} onClick={() => props.onStartTask?.({ applianceId: appliance.id, kind: "fend_off", assignedCrewIds: freeCrew.slice(0, 1).map((c) => c.id) })}>Start</button>}
            {myFendOff?.state === "active" && <button type="button" className="pc-mini" onClick={() => props.onAbortTask?.(myFendOff.id)}>Abort</button>}
            {myFendOff?.state === "completed" && <span className="fc-rtc-tick">✓</span>}
          </div>
        </div>
        <div className="rs-road-asks">
          <button type="button" className="pc-mini wide" disabled={!props.onRequestSupport || !!props.resolvedIncident} onClick={() => props.onRequestSupport?.("police", appliance.id)}>Ask control for police — the lanes and a block</button>
          <button type="button" className="pc-mini wide" disabled={!props.onRequestSupport || !!props.resolvedIncident || traffic.highways !== "none"} onClick={() => props.onRequestSupport?.("highways", appliance.id)}>{traffic.highways === "none" ? "Ask control for National Highways" : "National Highways asked"}</button>
        </div>
        <p className="cc-line">The lanes, the rolling block from {carriageway.upstream} and the closure are police work, on their tablet&apos;s Traffic tab. National Highways set the signals upstream a couple of minutes after control asks and take the junction when their traffic officers land.</p>
      </Group>
    </>
  ) : <p className="cc-line">This job is not on a running road.</p>;
  const extricateBody = (
    <>
      <Group title="Release the casualty">
        <dl className="pb-facts rs-facts">
          <dt>Vehicles</dt><dd className={allSafe ? "go" : crsVehicles.length ? "stop" : ""}>{crsVehicles.length === 0 ? "—" : allSafe ? "All made safe — controlled release" : crsVehicles.map((veh) => `${veh.vrm}: ${criticalOf(veh).filter((id) => crsState(veh.id, id).state !== "done").length} outstanding`).join(" · ")}</dd>
          <dt>Crew</dt><dd>{freeCrew.length} free · 4 needed{!carriesKit("Hydraulic") ? " · no hydraulic kit" : ""}</dd>
          <dt>Trapped</dt><dd className={trappedAll.length && extricationState !== "done" ? "stop" : ""}>{trappedAll.length ? trappedAll.map((c) => c.label ?? c.id).join(" · ") : "nobody"}</dd>
        </dl>
        {extrication ? (
          <div className={`fc-rtc-action${extrication.state === "completed" ? " done" : " on"}`}>
            <div className="txt"><b>Release the casualty</b><small>{extrication.state === "completed" ? "Casualty released to the ambulance crew" : `${callsignOf(extrication.applianceId)} cutting · ${mmss(Math.max(0, (extrication.completesAt ?? now) - now))} to go`}</small></div>
            {extrication.state === "active" && <button type="button" className="pc-mini" onClick={() => props.onAbortTask?.(extrication.id)}>Abort</button>}
            {extrication.state === "completed" && <span className="fc-rtc-tick">✓</span>}
          </div>
        ) : (
          <>
            {crsVehicles.length > 0 && !allSafe && <div className="cc-banner warn"><b>!</b><div><strong>{crsVehicles.filter((veh) => !madeSafe(veh)).map((veh) => veh.vrm).join(", ")} not made safe</strong><p>Every vehicle on the job is made safe before a controlled release. Cutting before that goes in the log and the debrief.</p></div></div>}
            <button type="button" className={`cc-primary${allSafe ? "" : " stop"}`} disabled={!canAct || crsVehicles.length === 0 || freeCrew.length < 4 || !carriesKit("Hydraulic")} title={!carriesKit("Hydraulic") ? "Hydraulic rescue kit needed" : freeCrew.length < 4 ? `Four hands needed · ${freeCrew.length} free` : ""} onClick={() => props.onStartTask?.({ applianceId: appliance.id, kind: "rtc_extrication", assignedCrewIds: freeCrew.slice(0, 4).map((c) => c.id) })}>
              {I.cut}<span>{allSafe ? "Release the casualty — controlled" : "Release the casualty now"}</span>
            </button>
          </>
        )}
      </Group>
    </>
  );
  const hazards = sim?.visibleHazards ?? [];
  const isolated = (id: string) => !!sim?.mitigatedHazardIds.includes(id);
  const active = tasks.filter((t) => t.state === "active");
  const hazardsBody = (
    <Group title="Hazards" extra={<span className="cc-pill">{hazards.length ? `${hazards.filter((h) => isolated(h.id)).length} of ${hazards.length} made safe` : "none identified"}</span>}>
      {hazards.length === 0 ? <p className="cc-line">No hazard identified yet — a 360 survey finds them.</p> : (
        <div className="cc-iv-list">
          {hazards.map((h) => {
            const working = active.find((t) => t.kind === "mitigate_hazard" && t.hazardId === h.id);
            return (
              <div key={h.id} className={`cc-iv${isolated(h.id) ? " done" : ""}`}>
                <div className="cc-iv-name"><strong>{h.label}</strong><small>{h.kind}</small></div>
                <div className={`cc-iv-status ${isolated(h.id) ? "go" : working ? "warn" : "stop"}`}><i />{isolated(h.id) ? "Made safe" : working ? `${callsignOf(working.applianceId)} · ${mmss((working.completesAt ?? now) - now)}` : "LIVE"}</div>
                <span />
              </div>
            );
          })}
        </div>
      )}
    </Group>
  );
  const casualtiesBody = (
    <Group title="Casualties" extra={<span className="cc-pill">{casualties.length ? `${casualties.length} located` : "none located"}</span>}>
      {casualties.length === 0 ? <p className="cc-line">Nobody located yet.</p> : (
        <div className="cc-iv-list">
          {casualties.map((c) => {
            const stage = sim?.casualtyProgression[c.id]?.stage ?? "located";
            const moving = active.find((t) => t.kind === "extract_casualty" && t.casualtyId === c.id);
            const trapped = !!c.trappedUntilExtricated && extricationState !== "done";
            const medics = medicsWith(c.id);
            return (
              <div key={c.id} className="cc-iv">
                <div className="cc-iv-name"><strong>{c.label ?? c.id}</strong><small>{c.severity}{medics.length ? ` · ${medics.map((m) => m.callsign).join(", ")} with them` : " · no clinician with them"}</small></div>
                <div className={`cc-iv-status ${trapped ? "stop" : stage === "located" ? "warn" : "go"}`}><i />{trapped ? "TRAPPED" : moving ? `Being moved · ${mmss((moving.completesAt ?? now) - now)}` : stage.replace(/_/g, " ")}</div>
                <span />
              </div>
            );
          })}
        </div>
      )}
    </Group>
  );
  const incidentLog = log.filter((e) => e.timestamp >= incident.receivedAt);
  const logBody = (
    <Group title="Incident log">
      <ol className="pb-timeline rs-log">
        {incidentLog.length === 0 && <li className="muted">Nothing logged yet</li>}
        {incidentLog.slice().reverse().slice(0, 40).map((e) => <li key={e.id}><time>{wall(e.timestamp)}</time><span>{e.message}</span></li>)}
      </ol>
    </Group>
  );

  // ---- The floating cards ---------------------------------------------------------
  const track = (
    <div className={`pb-track ${headline.tone}`}>
      {TRACK.map((s, i) => <div key={s.key} className={`pb-step ${trackIdx < 0 ? "" : i === trackIdx ? "now" : i < trackIdx ? "past" : ""}`} title={s.label}><i /><span>{s.short}</span></div>)}
    </div>
  );
  const head = (
    <div className={`pb-headline ${headline.tone}`}>
      <b>{headline.text}</b>
      <span>{headline.detail}</span>
    </div>
  );
  const clock = (
    <div className={`pb-news ${clockTone}`}>
      <span className="k">{extricationState === "done" ? "Released in" : "Release clock"}</span>
      <strong>{releaseMs === null ? "--:--" : mmss(releaseMs)}</strong>
      <small>{firstFireAt === null ? "no fire crew on scene yet" : trappedAll.length ? (extricationState === "done" ? `from ${callsignOf(fireOnScene[0].appliance.id)} arriving` : "target 20:00 from arrival · trapped casualty") : "nobody trapped"}</small>
    </div>
  );
  const vehiclesCard = <div className="rs-vehicles">{vehiclePicker}</div>;
  const medicCallsigns = trappedAll.flatMap((c) => medicsWith(c.id).map((m) => m.callsign));
  const facts = (
    <dl className="pb-facts">
      <dt>Crew</dt><dd>{freeCrew.length} free on {appliance.callsign} · {fireOnScene.length} fire on scene</dd>
      <dt>Kit</dt><dd className={carriesKit("Hydraulic") ? "go" : "stop"}>{carriesKit("Hydraulic") ? "Hydraulic rescue kit" : "No hydraulic kit"}</dd>
      <dt>Trapped</dt><dd className={trappedAll.length && extricationState !== "done" ? "stop" : trappedAll.length ? "go" : ""}>{trappedAll.length ? (extricationState === "done" ? "released" : `${trappedAll.length}`) : "nobody"}</dd>
      <dt>Ambulance</dt><dd className={medicCallsigns.length ? "go" : "warn"}>{medicCallsigns.length ? [...new Set(medicCallsigns)].join(", ") : "not yet with the casualty"}</dd>
    </dl>
  );
  const flagRows = v ? [
    ...datasheetActions(v).filter((a) => a.critical || a.id === "glass").map((a) => ({ key: a.id, label: a.label.replace(/^(Isolate|Foam blanket|Restrain|Stabilise|Contain)\s+/i, (m) => m).replace(/ management$/, ""), state: crsState(v.id, a.id).state })),
    ...(v.components.some((c) => c.kind === "airbag" || c.kind === "curtain_airbag") ? [{ key: "airbags", label: "Airbags", state: v.components.some((c) => c.kind === "battery_12v" && c.action && crsState(v.id, c.action.id).state === "done") ? "done" : "ready" }] : []),
  ] : [];
  const flags = flagRows.length ? (
    <div className="pb-flags">
      {flagRows.map((f) => <span key={f.key} className={f.state === "done" ? "cleared" : f.state === "active" ? "treated" : "open"}><i />{f.label}<em>{f.state === "done" ? "safe" : f.state === "active" ? "working" : "live"}</em></span>)}
    </div>
  ) : null;
  const vrmWords = crsVehicles.map((veh) => veh.vrm);
  const recent = incidentLog.filter((e) => /rtc|extrication|released|crs|stabilis|glass|roof|door|dash|isolat|fuel|blanket|strut|casualty/i.test(e.message) || vrmWords.some((w) => e.message.includes(w))).slice().reverse().slice(0, 10);
  const record = (
    <div className="pb-zone pb-record">
      <div className="pb-record-hd">Record</div>
      <ol className="pb-timeline">
        {recent.length === 0 && <li className="muted">Nothing done to the vehicles yet</li>}
        {recent.map((e) => <li key={e.id} className={/not made safe|live vehicle|outstanding/i.test(e.message) ? "warn" : /released|made safe|isolated|stabilised|contained/i.test(e.message) ? "go" : ""}><time>{wall(e.timestamp)}</time><span>{e.message}</span></li>)}
      </ol>
    </div>
  );

  // ---- The picture ----------------------------------------------------------------
  const vCas = v ? casualtiesOf(v) : [];
  const seatCas = vCas.find((c) => c.trappedUntilExtricated) ?? vCas[0] ?? null;
  const look = seatCas ? patientLook(seatCas, null, undefined, { landed: false }) : null;
  const strip = carriageway && traffic ? (
    <div className={`rs-traffic ${traffic.level}`} aria-label={traffic.headline}>
      {carriageway.hardShoulder && <div className="rs-tl hs"><span>HS</span></div>}
      {laneNumbers.map((l) => {
        const st = laneState(l);
        return (
          <div key={l} className={`rs-tl ${st}`}>
            <span>L{l}</span>
            {st === "live" && <i className="cars"><b /><b /><b /></i>}
            {st === "closed" && <i className="cones"><b /><b /><b /><b /><b /><b /></i>}
            {st === "blocked" && <em>wreck</em>}
            {st === "held" && <em>held from {carriageway.upstream}</em>}
          </div>
        );
      })}
      <div className="rs-tl-cap"><b>{traffic.headline}</b></div>
    </div>
  ) : null;
  const picture = v ? (
    <RtcScene
      vehicle={v}
      done={vDone}
      working={vWorking}
      casualty={seatCas && look ? { look, trapped: !!seatCas.trappedUntilExtricated && extricationState !== "done" } : null}
      medics={seatCas ? medicsWith(seatCas.id) : []}
      extrication={seatCas?.trappedUntilExtricated ? extricationState : "none"}
      extricationCrew={extrication?.assignedCrewIds.length}
      hour={props.hour}
      rain={props.rain}
      now={now}
      finished={finishedOn(v)}
      extricationStartedAt={extricationState === "active" ? extrication?.startedAt : undefined}
      extricationPrev={extricationState === "active" && extrication ? cameFrom(extrication.applianceId, extrication.startedAt) : undefined}
      components={showComponents && panel === "vehicle"}
      caption={sc.property.class || "On the carriageway"}
      words={[`${v.vrm} · ${v.make} ${v.model}`, seatCas ? (seatCas.trappedUntilExtricated && extricationState !== "done" ? "driver trapped" : extricationState === "done" ? "driver released" : "driver in the seat") : "nobody in it"]}
    />
  ) : <div className="rs-empty">No vehicles on this job. When a job carries a crash, the vehicles sit here with their datasheets and the crew make them safe and open them up from this page.</div>;

  // ---- The bar ------------------------------------------------------------------------
  const sections: { key: RtcPanel; label: string; icon: ReactNode; badge?: { count: string; tone: Tone } }[] = [
    { key: "vehicle", label: "Vehicle", icon: I.car },
    { key: "road", label: "Road", icon: I.lane, badge: traffic ? { count: traffic.protected ? "✓" : "!", tone: traffic.protected ? "go" : "stop" } : undefined },
    { key: "safe", label: "Make safe", icon: I.bolt, badge: v ? { count: `${criticalDone(v)}/${criticalOf(v).length}`, tone: madeSafe(v) ? "go" : "warn" } : undefined },
    { key: "glass", label: "Glass", icon: I.glass, badge: v && keyDone(v, "glass") ? { count: "✓", tone: "go" } : undefined },
    { key: "space", label: "Space", icon: I.cut, badge: v ? (() => { const n = stdFor(v).filter((a) => SPACE_KEYS.has(STRIP(a.id)) && crsState(v.id, a.id).state === "done").length; return n ? { count: String(n), tone: "go" as Tone } : undefined; })() : undefined },
    { key: "extricate", label: "Extricate", icon: I.exit, badge: extricationState === "active" ? { count: "!", tone: "warn" } : extricationState === "done" ? { count: "✓", tone: "go" } : undefined },
    { key: "hazards", label: "Hazards", icon: I.warn, badge: hazards.some((h) => !isolated(h.id)) ? { count: String(hazards.filter((h) => !isolated(h.id)).length), tone: "stop" } : undefined },
    { key: "casualties", label: "Casualties", icon: I.people, badge: casualties.length ? { count: String(casualties.length), tone: trappedAll.length && extricationState !== "done" ? "stop" : "go" } : undefined },
  ];
  const barButton = (key: RtcPanel, label: string, icon: ReactNode, badge?: { count: string; tone: Tone }) => (
    <button key={key} type="button" aria-pressed={panel === key} onClick={() => onPanel(panel === key ? null : key)}>
      <i className="ic">{icon}{badge && <small className={badge.tone}>{badge.count}</small>}</i>
      <span>{label}</span>
    </button>
  );
  const panelTitle = panel === "vehicle" ? "VEHICLE" : panel === "road" ? "THE ROAD" : panel === "safe" ? "MAKE SAFE" : panel === "glass" ? "GLASS MANAGEMENT" : panel === "space" ? "SPACE CREATION" : panel === "extricate" ? "EXTRICATION" : panel === "hazards" ? "HAZARDS" : panel === "casualties" ? "CASUALTIES" : panel === "log" ? "LOG" : "";
  const panelSub = v ? `${v.vrm} · ${v.make} ${v.model}` : "";
  const panelBody = panel === "vehicle" ? vehicleBody : panel === "road" ? roadBody : panel === "safe" ? safeBody : panel === "glass" ? glassBody : panel === "space" ? spaceBody : panel === "extricate" ? extricateBody : panel === "hazards" ? hazardsBody : panel === "casualties" ? casualtiesBody : panel === "log" ? logBody : null;

  return (
    <>
      <div className={`rs-body${props.tablet ? " rs-tablet" : ""}`}>
        <div className={`rs-hero ${headline.tone}`}>
          {picture}
          {strip}
          {shownAlerts.length > 0 && (
            <div className="rs-alerts pb-alerts">
              {shownAlerts.map((a) => <div key={a.key} className={`pb-alert ${a.tone}${a.fresh ? " pulse" : ""}`}><b>{a.title}</b><span>{a.text}</span></div>)}
            </div>
          )}
          <div className="rs-left">
            <div className="pb-hero-top">{track}{head}</div>
            {clock}
            {crsVehicles.length > 1 && vehiclesCard}
          </div>
          <div className="rs-right">
            {facts}
            {flags}
            {record}
          </div>
          {panel && (
            <aside className="cc-stage-panel rs-panel" aria-label={panelTitle}>
              <header className="cc-pane-head">
                <h2>{panelTitle}</h2>
                <span>{panelSub}</span>
                <button type="button" className="cc-close" onClick={() => onPanel(null)} aria-label="Close panel">✕</button>
              </header>
              <div className="cc-pane-body">{panelBody}</div>
            </aside>
          )}
        </div>
      </div>
      <footer className="cc-stage-bar rs-bar" aria-label="RTC jobs">
        <div className="grp">
          <button type="button" onClick={props.onBack}><i className="ic">{I.command}</i><span>Command</span></button>
        </div>
        <i className="sep" />
        <div className="grp">{barButton("vehicle", "Vehicle", I.car)}</div>
        <i className="sep" />
        <div className="grp">{sections.slice(1).map((s) => barButton(s.key, s.label, s.icon, s.badge))}</div>
        <i className="sep" />
        <div className="grp">{barButton("log", "Log", I.clock)}</div>
      </footer>
    </>
  );
}
