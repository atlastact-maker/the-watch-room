"use client";

// THE GROUND PAGE'S BAR. Under the scene from above, the round buttons
// the casualty-care screen and the RTC stage carry — Casualties, Fire,
// Police, the log — each opening a menu over the picture: who is with
// each casualty and who could be sent to them, the fire crew's jobs on
// the wreck, the police jobs on the road and the help a car can ask
// for, and the service's own module a tap away from each of them.

import { Fragment, useState, type ReactNode } from "react";
import type { Incident, LogEntry, PatientTreatmentState, Task } from "@/lib/sim/incident_types";
import type { IncidentSimState } from "@/lib/sim/incident_sim";
import { busyOn, crewSent } from "@/lib/sim/crew_assign";
import { trafficState } from "@/lib/sim/traffic";
import { approachSummary, contraflowFromLog, isStopped } from "@/lib/sim/road_closure";
import type { ResolvedDeployment } from "./incident-view";
import { assignRowsFor, casualtyShortLabel, type AssignCrewFn } from "./crew-assign-menu";
import { rtcJobs } from "../vector/rtc-state";
import type { RtcPanel } from "../vector/rtc-stage";
import type { FireRequest } from "../vector/fire-command";
import type { PoliceRequest } from "../vector/police-controls";
import { updatePoliceRecord, usePoliceRecord, type SupportKind } from "../vector/police-store";

export type GroundPanelKey = "casualties" | "fire" | "police" | "log";
type Tone = "go" | "warn" | "stop" | "";
export type GroundBadge = { count: string; tone: Tone };

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
const I = {
  job: <Icon d="M9 4h6l1 2h3v14H5V6h3zM8 11h8M8 15h5" />,
  people: <Icon d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm7 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20a7 7 0 0 1 14 0m1-1a5 5 0 0 1 5 1" />,
  fire: <Icon d="M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1.5.6-2.5 1.2-3.3C9.5 9.5 10 11 11 11c0-2.5-.5-5 1-8zM9 19h6" />,
  police: <Icon d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6zM9 12l2 2 4-4" />,
  clock: <Icon d="M12 8v5l3 2m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
};

const triageColour = (severity: string) => (severity === "critical" ? "#ef4444" : severity === "serious" ? "#f5b324" : "#34d399");
const triageLabel = (severity: string) => (severity === "critical" ? "P1" : severity === "serious" ? "P2" : "P3");
const wall = (ts: number) => new Date(ts).toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit" });

type Casualty = IncidentSimState["foundCasualties"][number];
type GroundData = { incident: Incident; resolved: ResolvedDeployment[]; tasks: Task[]; now: number; sim: IncidentSimState | null };

/** The casualties the crews have found, in the order they were found. */
function located(sim: IncidentSimState | null): Casualty[] {
  return (sim?.foundCasualties ?? []).filter((c) => (sim?.casualtyProgression?.[c.id]?.stage ?? "located") !== "undiscovered");
}
const severityOf = (sim: IncidentSimState | null, c: Casualty) => sim?.casualtyProgression?.[c.id]?.severity ?? c.severity;
const stageOf = (sim: IncidentSimState | null, c: Casualty) => (sim?.casualtyProgression?.[c.id]?.stage ?? "located").replace(/_/g, " ");

/** Who each casualty has with them: the ambulance clinicians sent to
 *  them, by their vehicle's callsign. */
function withCasualties(resolved: ResolvedDeployment[], tasks: Task[]): Map<string, { callsign: string; role: string; name: string }[]> {
  const out = new Map<string, { callsign: string; role: string; name: string }[]>();
  for (const r of resolved) {
    if (r.phase !== "at_incident" || r.appliance.service !== "Ambulance") continue;
    for (const s of crewSent(r.deployment, r.appliance.crewMembers, busyOn(tasks, r.appliance.id))) {
      out.set(s.casualtyId, [...(out.get(s.casualtyId) ?? []), { callsign: r.appliance.callsign, role: s.member.role, name: s.member.name }]);
    }
  }
  return out;
}

/** What goes on the bar's buttons: casualties found (red while a P1 has
 *  nobody with them), fire jobs running, and whether the road is protected. */
export function groundBadges(d: GroundData): Partial<Record<GroundPanelKey, GroundBadge>> {
  const out: Partial<Record<GroundPanelKey, GroundBadge>> = {};
  const cas = located(d.sim);
  if (cas.length) {
    const withMap = withCasualties(d.resolved, d.tasks);
    const unattended = cas.some((c) => severityOf(d.sim, c) === "critical" && !withMap.get(c.id)?.length);
    out.casualties = { count: String(cas.length), tone: unattended ? "stop" : "go" };
  }
  const fireIds = new Set(d.resolved.filter((r) => r.appliance.service === "Fire").map((r) => r.appliance.id));
  const fireJobs = d.tasks.filter((t) => t.state === "active" && t.kind !== "commander" && fireIds.has(t.applianceId)).length;
  if (fireJobs) out.fire = { count: String(fireJobs), tone: "warn" };
  const cw = d.incident.scenario.scene?.carriageway;
  if (cw) {
    const t = trafficState(cw, d.tasks, d.now);
    out.police = { count: t.protected ? "✓" : "!", tone: t.protected ? "go" : "stop" };
  }
  return out;
}

export function GroundBar({ panel, onPanel, onJob, badges }: {
  panel: GroundPanelKey | null;
  onPanel: (p: GroundPanelKey | null) => void;
  /** Back to the job's facts and log. */
  onJob: () => void;
  badges: Partial<Record<GroundPanelKey, GroundBadge>>;
}) {
  const btn = (key: GroundPanelKey, label: string, icon: ReactNode) => {
    const b = badges[key];
    return (
      <button key={key} type="button" aria-pressed={panel === key} onClick={() => onPanel(panel === key ? null : key)}>
        <i className="ic">{icon}{b && <small className={b.tone}>{b.count}</small>}</i>
        <span>{label}</span>
      </button>
    );
  };
  return (
    <footer className="cc-stage-bar gv-bar" aria-label="Ground menus">
      <div className="grp">
        <button type="button" onClick={onJob}><i className="ic">{I.job}</i><span>Job</span></button>
      </div>
      <i className="sep" />
      <div className="grp">
        {btn("casualties", "Casualties", I.people)}
        {btn("fire", "Fire", I.fire)}
        {btn("police", "Police", I.police)}
      </div>
      <i className="sep" />
      <div className="grp">{btn("log", "Log", I.clock)}</div>
    </footer>
  );
}

// ---- The menus ------------------------------------------------------------

export type GroundPanelProps = GroundData & {
  panel: GroundPanelKey;
  onClose: () => void;
  log: LogEntry[];
  treatmentByCasualtyId?: Record<string, PatientTreatmentState>;
  /** The unit the tablet is for; the Fire and Police menus task it. */
  unitId: string | null;
  onSelectUnit: (applianceId: string) => void;
  onAssignCrewToCasualty?: AssignCrewFn;
  /** Open the casualty-care screen on this patient. */
  onOpenCasualty: (casualtyId: string) => void;
  onRequestClinician?: (scope: "ap" | "ccc" | "basics" | "hems", casualtyId: string) => void;
  hemsFlyable?: boolean;
  /** Open the Fire module on a page — the RTC stage with a panel up. */
  onOpenFire: (req: Omit<FireRequest, "seq">) => void;
  /** Open the Police module on a page, and a tab of its actions. */
  onOpenPolice: (req: Omit<PoliceRequest, "seq">) => void;
  onRequestSupport?: (kind: SupportKind | string, applianceId: string, detail?: string) => void;
  onNote?: (text: string) => void;
};

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="cc-group">
      <header><span>{title}</span></header>
      <div className="cc-group-body">{children}</div>
    </section>
  );
}

/** One line of a menu: what it is, how it stands, and the one thing to do about it. */
function Row({ title, sub, dot, status, tone = "", action, onAction, disabled, className }: {
  title: ReactNode;
  sub?: ReactNode;
  /** A triage colour on the name. */
  dot?: string;
  status?: ReactNode;
  tone?: Tone;
  action?: string;
  onAction?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={`cc-iv gv-row${className ? ` ${className}` : ""}`}>
      <div className="cc-iv-name">
        <strong>{dot && <i className="gv-tri" style={{ background: dot }} />}{title}</strong>
        {sub && <small>{sub}</small>}
      </div>
      <div className={`cc-iv-status ${tone}`}>{status !== undefined && status !== "" && <><i />{status}</>}</div>
      {action ? <button type="button" className="cc-mini" disabled={disabled} onClick={onAction}>{action}</button> : <span />}
    </div>
  );
}

/** The units of a service on the job, with the one the tablet is for marked. */
function UnitPicker({ units, unitId, onSelect, service }: { units: ResolvedDeployment[]; unitId: string | null; onSelect: (id: string) => void; service: string }) {
  return (
    <Group title={`${service} units`}>
      {units.length === 0 ? (
        <div className="gv-note">No {service.toLowerCase()} unit on this job yet.</div>
      ) : (
        <div className="cc-iv-list">
          {units.map((r) => (
            <Row
              key={r.appliance.id}
              title={r.appliance.callsign}
              sub={`${r.appliance.type} · ${r.appliance.crew.current} crew`}
              status={r.phase === "at_incident" ? "on scene" : r.phase.replace(/_/g, " ")}
              tone={r.phase === "at_incident" ? "go" : "warn"}
              action={r.appliance.id === unitId ? "Selected" : "Select"}
              disabled={r.appliance.id === unitId}
              onAction={() => onSelect(r.appliance.id)}
            />
          ))}
        </div>
      )}
    </Group>
  );
}

function CasualtiesMenu(p: GroundPanelProps & { expanded: string | null; setExpanded: (id: string | null) => void }) {
  const cas = located(p.sim);
  const withMap = withCasualties(p.resolved, p.tasks);
  const onScene = p.resolved.filter((r) => r.phase === "at_incident").map((r) => ({ deployment: r.deployment, appliance: r.appliance }));
  const short = (id: string) => casualtyShortLabel(cas.find((c) => c.id === id)?.label, id);
  if (!cas.length) {
    return (
      <Group title="Casualties">
        <div className="gv-note">No casualties located yet — they appear here as the crews find them.</div>
      </Group>
    );
  }
  return (
    <Group title={`${cas.length} located`}>
      <div className="cc-iv-list">
        {cas.map((c) => {
          const sev = severityOf(p.sim, c);
          const here = withMap.get(c.id) ?? [];
          const open = p.expanded === c.id;
          const condition = p.treatmentByCasualtyId?.[c.id]?.revealedCondition ?? (c.label ?? "").split(" — ")[1] ?? "";
          const rows = open ? assignRowsFor(onScene, p.tasks, c.id, short) : [];
          const callsigns = [...new Set(here.map((h) => h.callsign))];
          return (
            <Fragment key={c.id}>
              <Row
                dot={triageColour(sev)}
                title={`${triageLabel(sev)} · ${casualtyShortLabel(c.label, c.id)}`}
                sub={[stageOf(p.sim, c), condition].filter(Boolean).join(" · ")}
                status={here.length ? callsigns.join(", ") : "nobody with them"}
                tone={here.length ? "go" : sev === "critical" ? "stop" : "warn"}
                action="Open"
                onAction={() => p.onOpenCasualty(c.id)}
              />
              <div className="gv-minis">
                <button type="button" className="cc-mini" aria-pressed={open} onClick={() => p.setExpanded(open ? null : c.id)}>{open ? "Hide crew" : "Send crew…"}</button>
                {p.onRequestClinician && (
                  <>
                    <button type="button" className="cc-mini" onClick={() => p.onRequestClinician?.("ccc", c.id)}>Critical care</button>
                    <button type="button" className="cc-mini" disabled={p.hemsFlyable === false} onClick={() => p.onRequestClinician?.("hems", c.id)}>HEMS</button>
                  </>
                )}
              </div>
              {open && (rows.length === 0 ? (
                <div className="gv-note sub">No ambulance crew on scene yet.</div>
              ) : rows.map((r) => r.members.map((m) => (
                <Row
                  key={`${r.applianceId}:${m.id}`}
                  className="sub"
                  title={m.name}
                  sub={`${r.callsign} · ${m.role}`}
                  status={m.status === "here" ? "with them" : m.status === "busy" ? m.where : m.status === "other" ? `with ${m.where}` : "free"}
                  tone={m.status === "here" ? "go" : m.status === "busy" ? "" : m.status === "other" ? "warn" : "go"}
                  action={m.status === "here" ? "Stand down" : m.status === "busy" ? "Busy" : m.status === "other" ? "Move" : "Send"}
                  disabled={m.status === "busy" || !p.onAssignCrewToCasualty}
                  onAction={() => p.onAssignCrewToCasualty?.(r.applianceId, m.id, m.status === "here" ? null : c.id)}
                />
              ))))}
            </Fragment>
          );
        })}
      </div>
    </Group>
  );
}

function FireMenu(p: GroundPanelProps) {
  const units = p.resolved.filter((r) => r.appliance.service === "Fire");
  const unit = units.find((r) => r.appliance.id === p.unitId) ?? null;
  const picker = <UnitPicker units={units} unitId={p.unitId} onSelect={p.onSelectUnit} service="Fire" />;
  if (!unit) {
    return (
      <>
        {picker}
        <div className="gv-note">Select a fire unit to see its jobs.</div>
      </>
    );
  }
  const jobs = rtcJobs(p.tasks, p.now);
  const cw = p.incident.scenario.scene?.carriageway;
  const traffic = cw ? trafficState(cw, p.tasks, p.now) : null;
  const busy = busyOn(p.tasks, unit.appliance.id);
  const free = unit.appliance.crewMembers.filter((m) => !busy(m.id)).length;
  const crs = p.incident.scenario.crs ?? [];
  const onScene = unit.phase === "at_incident";
  const rtc: { key: RtcPanel; label: string; sub: string; status?: string; tone?: Tone }[] = [
    { key: "vehicle", label: "Vehicle", sub: crs.map((v) => v.vrm).join(", ") || "Datasheets" },
    { key: "road", label: "The road", sub: "Protection and closures", status: traffic ? (traffic.protected ? "protected" : "lanes running") : undefined, tone: traffic ? (traffic.protected ? "go" : "stop") : "" },
    { key: "safe", label: "Make safe", sub: "Isolate and stabilise" },
    { key: "glass", label: "Glass", sub: "Film and remove" },
    { key: "space", label: "Space", sub: "Doors, roof, dash" },
    { key: "extricate", label: "Extricate", sub: "Release the casualty", status: jobs.extricationState === "active" ? "under way" : jobs.extricationState === "done" ? "released" : "not started", tone: jobs.extricationState === "active" ? "warn" : jobs.extricationState === "done" ? "go" : "" },
    { key: "hazards", label: "Hazards", sub: "Fuel, batteries, airbags" },
    { key: "casualties", label: "Casualties", sub: "Who is in the wreck" },
  ];
  return (
    <>
      {units.length > 1 && picker}
      <Group title={`${unit.appliance.callsign} · ${free}/${unit.appliance.crewMembers.length} crew free`}>
        {!onScene && <div className="gv-note">{unit.appliance.callsign} is not on scene yet — its jobs open when it books in.</div>}
        {crs.length > 0 && (
          <div className="cc-iv-list">
            {rtc.map((j) => (
              <Row key={j.key} title={j.label} sub={j.sub} status={j.status} tone={j.tone ?? ""} action="Open" disabled={!onScene} onAction={() => p.onOpenFire({ page: "rtc", panel: j.key })} />
            ))}
          </div>
        )}
        <div className="cc-iv-list">
          <Row title="Actions and tasking" sub="Jets, BA, water, the scene" action="Open" onAction={() => p.onOpenFire({ page: "actions" })} />
          <Row title="Command" sub="Plan, sectors, tactical mode" action="Open" onAction={() => p.onOpenFire({ page: "command" })} />
          <Row title="BA board" sub="Entry control" action="Open" onAction={() => p.onOpenFire({ page: "ba" })} />
          <Row title="Fire log" sub="This unit's record" action="Open" onAction={() => p.onOpenFire({ page: "log" })} />
        </div>
      </Group>
    </>
  );
}

const SUPPORT: { kind: SupportKind; label: string; wording: string }[] = [
  { kind: "roads", label: "Roads policing", wording: "requests a roads policing unit" },
  { kind: "highways", label: "Highways", wording: "requests Highways to attend" },
  { kind: "contraflow", label: "Clear for approach against the flow", wording: "declares the road stopped past the scene — units can come in from the junction ahead" },
  { kind: "recovery", label: "Vehicle recovery", wording: "requests vehicle recovery" },
  { kind: "unit", label: "Additional unit", wording: "requests an additional unit" },
  { kind: "supervisor", label: "Supervisor", wording: "requests a supervisor to attend" },
  { kind: "ambulance", label: "Ambulance", wording: "requests an ambulance to scene" },
  { kind: "custody", label: "Custody transport", wording: "requests custody transport for a detained person" },
  { kind: "arv", label: "Armed response", wording: "requests an ARV" },
  { kind: "dog", label: "Dog unit", wording: "requests a dog unit" },
  { kind: "npas", label: "NPAS", wording: "requests NPAS overhead" },
];

function PoliceMenu(p: GroundPanelProps & { support: { kind: SupportKind; at: number }[] }) {
  const units = p.resolved.filter((r) => r.appliance.service === "Police");
  const unit = units.find((r) => r.appliance.id === p.unitId) ?? null;
  const picker = <UnitPicker units={units} unitId={p.unitId} onSelect={p.onSelectUnit} service="Police" />;
  if (!unit) {
    return (
      <>
        {picker}
        <div className="gv-note">Select a police unit to task it.</div>
      </>
    );
  }
  const cw = p.incident.scenario.scene?.carriageway;
  const traffic = cw ? trafficState(cw, p.tasks, p.now) : null;
  const contraflow = contraflowFromLog(p.log, p.incident.id);
  const last = (kind: SupportKind) => [...p.support].reverse().find((r) => r.kind === kind);
  const request = (kind: SupportKind) => {
    const def = SUPPORT.find((s) => s.kind === kind)!;
    // The same record the Police module keeps, so its own page shows the ask.
    updatePoliceRecord(p.incident.id, (r) => ({ ...r, support: [...r.support, { kind, at: p.now, by: unit.appliance.callsign }] }));
    p.onRequestSupport?.(kind, unit.appliance.id);
    if (!p.onRequestSupport) p.onNote?.(`${unit.appliance.callsign} · ${def.wording}`);
  };
  return (
    <>
      {units.length > 1 && picker}
      {traffic && (
        <Group title="The road">
          <div className="cc-iv-list">
            <Row
              title={traffic.headline}
              sub={traffic.protected ? "Nobody is working beside a running lane" : "Crews are beside running traffic"}
              status={traffic.level}
              tone={traffic.protected ? "go" : "stop"}
              action="Manage"
              onAction={() => p.onOpenPolice({ page: "actions", tab: "traffic" })}
            />
            <Row
              title="Approach"
              sub={approachSummary(traffic, contraflow.on)}
              status={contraflow.on ? "authorised" : isStopped(traffic) ? "road stopped" : "lanes running"}
              tone={contraflow.on ? (isStopped(traffic) ? "go" : "warn") : isStopped(traffic) ? "go" : ""}
            />
          </div>
        </Group>
      )}
      <Group title={`Request · ${unit.appliance.callsign}`}>
        <div className="cc-iv-list">
          {SUPPORT.map((s) => {
            if (s.kind === "contraflow" && (!traffic || contraflow.on)) return null;
            const l = last(s.kind);
            const stoppedOnly = s.kind === "contraflow" && traffic && !isStopped(traffic);
            return <Row key={s.kind} title={s.label} sub={stoppedOnly ? "Not yet — a lane still runs past the scene" : s.wording} status={l ? `asked ${wall(l.at)}` : undefined} tone={l ? "go" : ""} action={stoppedOnly ? undefined : "Request"} onAction={stoppedOnly ? undefined : () => request(s.kind)} />;
          })}
        </div>
      </Group>
      <Group title="Police module">
        <div className="cc-iv-list">
          <Row title="Resource actions" sub="Scene, people, vehicles, traffic" action="Open" onAction={() => p.onOpenPolice({ page: "actions" })} />
          <Row title="PNC" sub="Names, vehicles, addresses" action="Open" onAction={() => p.onOpenPolice({ page: "pnc" })} />
          <Row title="ANPR" sub="Reads and hits" action="Open" onAction={() => p.onOpenPolice({ page: "anpr" })} />
        </div>
      </Group>
    </>
  );
}

export function GroundPanel(props: GroundPanelProps) {
  const { panel, onClose, incident, resolved, log } = props;
  const record = usePoliceRecord(incident.id);
  const [expanded, setExpanded] = useState<string | null>(null);
  const unit = resolved.find((r) => r.appliance.id === props.unitId) ?? null;
  const title = panel === "casualties" ? "CASUALTIES" : panel === "fire" ? "FIRE & RESCUE" : panel === "police" ? "POLICE" : "INCIDENT LOG";
  const sub = panel === "log" ? incident.scenario.title : unit ? `${unit.appliance.callsign} · ${unit.appliance.service}` : "No unit selected";
  const body =
    panel === "casualties" ? <CasualtiesMenu {...props} expanded={expanded} setExpanded={setExpanded} />
    : panel === "fire" ? <FireMenu {...props} />
    : panel === "police" ? <PoliceMenu {...props} support={record.support} />
    : (
      <div className="gv-log">
        {log.filter((e) => e.timestamp >= incident.receivedAt).slice(-60).reverse().map((e) => (
          <div key={e.id}><time>{wall(e.timestamp)}</time><span>{e.message}</span></div>
        ))}
        {log.filter((e) => e.timestamp >= incident.receivedAt).length === 0 && <div className="gv-note">Nothing logged yet.</div>}
      </div>
    );
  return (
    <aside className="cc-stage-panel gv-panel" aria-label={title}>
      <header className="cc-pane-head">
        <h2>{title}</h2>
        <span>{sub}</span>
        <button type="button" className="cc-close" onClick={onClose} aria-label="Close menu">✕</button>
      </header>
      <div className="cc-pane-body">{body}</div>
    </aside>
  );
}
