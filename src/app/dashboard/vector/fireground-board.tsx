"use client";

// THE FIREGROUND BOARD. What the fire is doing, in one glance: where it is
// on its development, which way it is going and how fast, how much of the
// building it has, the smoke, the structure, the water going on against
// it, who is under air and the people still unaccounted for. The scene
// plan sits in the middle of it with the live fire and smoke drawn on.
// Everything on it is read off the simulator; nothing here is decorative.

import type { ReactNode } from "react";
import type { Incident, Task } from "@/lib/sim/incident_types";
import { FAST_ATTACK_FLOW_LPM, HOSE_FLOW_LPM, INTERIOR_BA_DEFAULT_FLOW_LPM, hasWaterSupplyChain } from "@/lib/sim/incident_types";
import type { IncidentSimState } from "@/lib/sim/incident_sim";
import type { ResolvedDeployment } from "../components/incident-view";
import { SceneCanvas } from "../components/scene-canvas";
import { fireHistory, recordFire } from "@/lib/sim/fire_history";

type Tone = "go" | "warn" | "stop" | "";

export type FiregroundBoardProps = {
  incident: Incident;
  sim: IncidentSimState | null;
  tasks: Task[];
  onScene: ResolvedDeployment[];
  now: number;
  structural?: { integrity: number; collapsedAt: number | null; evacuatedAt: number | null; injured: number };
  crewAir?: Record<string, number>;
  waterClock?: Record<string, number | null>;
  vehicleGauges?: Record<string, { fuelPct: number; waterPct: number; conditionPct: number }>;
  /** Hide the scene plan — the tablet strip carries a small one already. */
  compact?: boolean;
};

const STAGES: { key: IncidentSimState["fireStage"]; label: string; short: string }[] = [
  { key: "incipient", label: "Incipient", short: "Incipient" },
  { key: "developing", label: "Developing", short: "Developing" },
  { key: "fully_developed", label: "Fully developed", short: "Fully dev." },
  { key: "flashover_risk", label: "Flashover risk", short: "Flashover" },
  { key: "under_control", label: "Under control", short: "Controlled" },
  { key: "extinguished", label: "Extinguished", short: "Out" },
];

const MATERIAL_LABEL: Record<string, string> = {
  structural: "building fire",
  vehicle: "vehicle fire",
  vegetation: "vegetation fire",
};

const TREND_SPAN_MS = 20 * 60_000;

function FireTrend({ hist, maxR, now, tone }: { hist: readonly { t: number; r: number }[]; maxR: number; now: number; tone: Tone }) {
  const from = now - TREND_SPAN_MS;
  const pts = hist.filter((p) => p.t >= from);
  const W = 300;
  const H = 56;
  const x = (t: number) => ((t - from) / TREND_SPAN_MS) * W;
  const y = (r: number) => H - 3 - (Math.min(r, maxR) / Math.max(1, maxR)) * (H - 8);
  const peak = pts.reduce((m, p) => Math.max(m, p.r), 0);
  if (pts.length < 2) {
    return (
      <div className={`fg-trend ${tone}`}>
        <div className="hd"><span>Fire size · last 20 min</span><span>max {maxR.toFixed(0)} m</span></div>
        <div className="empty">The trace draws as the job runs</div>
      </div>
    );
  }
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p.r).toFixed(1)}`).join(" ");
  const area = `${line} L${x(pts[pts.length - 1].t).toFixed(1)} ${H} L${x(pts[0].t).toFixed(1)} ${H} Z`;
  return (
    <div className={`fg-trend ${tone}`}>
      <div className="hd"><span>Fire size · last 20 min</span><span>peak {peak.toFixed(0)} m · max {maxR.toFixed(0)} m</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" x2={W} y1={y(maxR)} y2={y(maxR)} className="max" />
        <line x1="0" x2={W} y1={y(maxR / 2)} y2={y(maxR / 2)} className="grid" />
        <path d={area} className="area" />
        <path d={line} className="line" />
        <circle cx={x(pts[pts.length - 1].t)} cy={y(pts[pts.length - 1].r)} r="2.5" className="dot" />
      </svg>
      <div className="axis"><span>20 min ago</span><span>10</span><span>now</span></div>
    </div>
  );
}

function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function Meter({ label, value, sub, pct, tone, children }: { label: string; value: ReactNode; sub?: ReactNode; pct?: number | null; tone?: Tone; children?: ReactNode }) {
  return (
    <div className={`fg-meter ${tone ?? ""}`}>
      <span className="k">{label}</span>
      <strong>{value}</strong>
      {sub !== undefined && <small>{sub}</small>}
      {pct !== undefined && pct !== null && (
        <i className="bar"><b style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></i>
      )}
      {children}
    </div>
  );
}

export function FiregroundBoard(props: FiregroundBoardProps) {
  const { incident, sim, tasks, onScene, now, structural, crewAir, compact } = props;
  const sc = incident.scenario;
  const scene = sc.scene;
  const stage = sim?.fireStage ?? "none";
  const tone: Tone = stage === "flashover_risk" || stage === "fully_developed" ? "stop" : stage === "developing" ? "warn" : stage === "under_control" || stage === "extinguished" ? "go" : stage === "incipient" ? "warn" : "";
  const radius = sim?.fireRadiusM ?? 0;
  const maxR = scene?.fireSeat?.maxRadiusM ?? 15;
  const sizePct = maxR > 0 ? (radius / maxR) * 100 : 0;
  const rate = sim?.fireRateMpm ?? 0;
  const trend = rate > 0.05 ? "growing" : rate < -0.05 ? "knocking down" : radius > 0 ? "holding" : "";
  const idx = STAGES.findIndex((s) => s.key === stage);
  const active = tasks.filter((t) => t.state === "active");

  // Water going on, against what is on the ground. A jet's flow is its
  // hose; a BA team in to fight it takes a 45 mm; an aerial's monitor is
  // a 70 mm line's worth.
  const jets = active.filter((t) => t.kind === "hose_attack" || t.kind === "aerial_monitor");
  const baFighting = active.filter((t) => t.kind === "ba_sar" && t.baMode === "firefighting");
  const deploymentOf = (applianceId: string) => onScene.find((r) => r.appliance.id === applianceId)?.deployment;
  const flowOf = (t: Task): number => {
    if (t.kind === "aerial_monitor") return HOSE_FLOW_LPM["70mm"];
    const d = deploymentOf(t.applianceId);
    const riders = t.assignedCrewIds.length ? t.assignedCrewIds : t.baCrewIds ?? [];
    const reel = riders.some((id) => d?.crewEquipment?.[id]?.includes("fast_attack_branch")) && !riders.some((id) => d?.crewEquipment?.[id]?.includes("branch_45mm") || d?.crewEquipment?.[id]?.includes("branch_70mm"));
    if (reel) return FAST_ATTACK_FLOW_LPM;
    if (t.kind === "ba_sar") return INTERIOR_BA_DEFAULT_FLOW_LPM;
    return HOSE_FLOW_LPM[t.hoseType ?? "45mm"];
  };
  const charged = (t: Task) => deploymentOf(t.applianceId)?.pumpRunning === true;
  const lines = [...jets, ...baFighting];
  const flowLpm = lines.filter(charged).reduce((n, t) => n + flowOf(t), 0);
  const dryLines = lines.filter((t) => !charged(t)).length;
  const pumps = onScene.filter((r) => r.appliance.service === "Fire" && r.appliance.waterLitres > 0);
  const supplyRows = pumps.map((r) => {
    const supplied = hasWaterSupplyChain(r.appliance.id, tasks);
    const left = props.waterClock?.[r.appliance.id];
    const pct = Math.round(props.vehicleGauges?.[r.appliance.id]?.waterPct ?? r.appliance.waterPct);
    const text = supplied ? "hydrant" : left != null ? (left <= 0 ? "TANK DRY" : `tank ${pct}% · ${mmss(left * 1000)}`) : `tank ${pct}%`;
    const t: Tone = supplied ? "go" : left != null ? (left <= 0 || left < 120 ? "stop" : left < 300 ? "warn" : "") : pct < 30 ? "stop" : pct < 60 ? "warn" : "";
    return { callsign: r.appliance.callsign, text, tone: t, pumping: r.deployment.pumpRunning === true };
  });
  const waterTone: Tone = supplyRows.some((r) => r.tone === "stop") ? "stop" : supplyRows.some((r) => r.tone === "warn") ? "warn" : flowLpm > 0 ? "go" : "";

  // BA under air, and the lowest cylinder among them.
  const baTeams = active.filter((t) => t.kind === "ba_sar");
  const wearers = baTeams.flatMap((t) => t.baCrewIds ?? t.assignedCrewIds);
  const airs = wearers.map((id) => crewAir?.[id]).filter((x): x is number => x !== undefined);
  const lowestAir = airs.length ? Math.min(...airs) : null;
  const whistles = baTeams.flatMap((t) => Object.values(t.baWhistleAt ?? {}));
  const nextWhistle = whistles.length ? Math.min(...whistles) : null;
  const baTone: Tone = lowestAir !== null && lowestAir < 25 ? "stop" : lowestAir !== null && lowestAir < 45 ? "warn" : baTeams.length ? "go" : "";

  // Persons.
  const located = sim ? sim.foundCasualties.filter((c) => (sim.casualtyProgression[c.id]?.stage ?? "located") !== "undiscovered") : [];
  const planned = sim ? Object.keys(sim.casualtyProgression).filter((id) => !sim.absentCasualtyIds.includes(id)).length : 0;
  const unaccounted = Math.max(0, planned - located.length);
  const reported = sc.type.includes("persons_reported") || planned > 0;
  const personsTone: Tone = unaccounted > 0 ? "stop" : located.length ? "warn" : reported ? "warn" : "go";

  // Utilities, from the hazards the crews have seen.
  const hazards = sim?.visibleHazards ?? [];
  const isolated = (id: string) => !!sim?.mitigatedHazardIds.includes(id);
  const utilities = hazards.filter((h) => h.kind === "gas" || h.kind === "electrical").map((h) => ({ label: h.kind === "gas" ? "Gas" : "Electric", off: isolated(h.id) }));

  const integrity = structural?.integrity ?? 100;
  const collapsed = !!structural?.collapsedAt;
  const structureTone: Tone = collapsed || integrity < 25 ? "stop" : integrity < 55 ? "warn" : "go";
  const isStructure = !!sim?.fireMaterial && sim.fireMaterial !== "vegetation";
  const firstIn = onScene.length ? Math.min(...onScene.map((r) => r.deployment.arrivesAt)) : null;
  // The dashboard records the trace as it ticks the simulation; the board
  // only adds a point when it is the only thing ticking (the harness).
  recordFire(incident.id, now, radius);
  const hist = fireHistory(incident.id);

  const inv = sim?.involvement ?? { room: 0, floor: 0, roof: 0 };
  const segs = (v: number) => Array.from({ length: 10 }, (_, i) => (v * 10 > i + 0.5 ? "on" : ""));

  return (
    <div className={`fg-board${compact ? " compact" : ""}`}>
      <div className="fg-zone fg-zone-state">
      {/* Where the fire is on its development, and which way it is going. */}
      <div className={`fg-track ${tone}`}>
        {STAGES.map((s, i) => {
          const state = stage === "none" ? "" : i === idx ? "now" : i < idx && idx <= 3 ? "past" : idx >= 4 && i <= 3 ? "past" : "";
          return (
            <div key={s.key} className={`fg-stage ${state}`} title={s.label}>
              <i />
              <span>{s.short}</span>
            </div>
          );
        })}
      </div>
      <div className={`fg-headline ${tone}`}>
        <b>{stage === "none" ? "No fire on the ground" : STAGES[idx]?.label ?? stage}</b>
        <span>
          {radius > 0 ? `${radius.toFixed(0)} m · ${trend}${rate !== 0 && Math.abs(rate) >= 0.05 ? ` ${Math.abs(rate).toFixed(1)} m/min` : ""}` : stage === "extinguished" ? "knocked down" : ""}
          {sim?.fireMaterialKnown && sim.fireMaterial ? ` · ${MATERIAL_LABEL[sim.fireMaterial] ?? sim.fireMaterial}` : sim && radius > 0 ? " · material not confirmed" : ""}
          {firstIn !== null ? ` · on scene ${mmss(now - firstIn)}` : ""}
        </span>
      </div>

      {sim?.flashoverCountdownSec != null && (
        <div className="fg-alert pulse"><b>FLASHOVER IN {sim.flashoverCountdownSec}s</b><span>Get them out or get water on it</span></div>
      )}
      {collapsed && <div className="fg-alert"><b>STRUCTURAL COLLAPSE</b><span>Nobody goes back in</span></div>}
      {!collapsed && isStructure && integrity < 25 && <div className="fg-alert"><b>COLLAPSE IMMINENT</b><span>Withdraw crews — structure {Math.round(integrity)}%</span></div>}
      {sim?.exposureBreached && <div className="fg-alert warn"><b>FIRE INTO THE EXPOSURE</b><span>The neighbour is involved</span></div>}
      {sim?.ventilationFedFire && <div className="fg-alert warn"><b>VENTILATION FED THE FIRE</b><span>Air went in before the water</span></div>}
      {supplyRows.some((r) => r.text === "TANK DRY") && <div className="fg-alert"><b>TANK DRY</b><span>{supplyRows.filter((r) => r.text === "TANK DRY").map((r) => r.callsign).join(", ")} — get a supply in</span></div>}
      {(radius > 0 || hist.length > 1) && <FireTrend hist={hist} maxR={maxR} now={now} tone={tone} />}
      </div>

      {!compact && (
        <div className="fg-plan fg-zone">
          {scene ? (
            <SceneCanvas
              scene={scene}
              deployments={onScene.map((r) => ({ deployment: r.deployment, callsign: r.appliance.callsign, service: r.appliance.service }))}
              live={sim ? { fireRadiusM: sim.fireRadiusM, smokeRadiusM: sim.smokeRadiusM, frontOffset: sim.frontOffset } : null}
            />
          ) : (
            <div className="fg-plan-empty">NO SCENE PLAN FOR THIS INCIDENT</div>
          )}
          {scene && radius > 0 && <div className="fg-plan-key"><i className="fire" />fire {radius.toFixed(0)} m<i className="smoke" />smoke {(sim?.smokeRadiusM ?? 0).toFixed(0)} m</div>}
        </div>
      )}

      <div className="fg-meters fg-zone">
        <Meter label="Fire size" value={radius > 0 ? `${radius.toFixed(0)} m` : "—"} sub={radius > 0 ? `of ${maxR.toFixed(0)} m · ${Math.round(sizePct)}%` : "no fire"} pct={sizePct} tone={tone} />
        <Meter label="Smoke" value={sim && sim.smokeRadiusM > 0 ? `${sim.smokeRadiusM.toFixed(0)} m` : "—"} sub={sim?.ventilated ? "ventilated" : sim && sim.smokeRadiusM > 0 ? "from the seat" : "clear"} tone={sim && sim.smokeRadiusM > 12 ? "warn" : ""} />
        {isStructure && (
          <Meter label="Involvement" value={inv.roof >= 0.99 ? "Roof involved" : inv.floor > 0 ? `Floor ${Math.round(inv.floor * 100)}%` : inv.room > 0 ? `Room ${Math.round(inv.room * 100)}%` : "Clear"} tone={inv.roof > 0 ? "stop" : inv.floor > 0 ? "warn" : inv.room > 0.5 ? "warn" : ""}>
            <div className="fg-segs">
              {([["Room", inv.room], ["Floor", inv.floor], ["Roof", inv.roof]] as const).map(([k, v]) => (
                <div key={k} className={v >= 0.99 ? "stop" : v > 0 ? "warn" : ""}><span>{k}</span><i>{segs(v).map((on, j) => <b key={j} className={on} />)}</i><em>{v >= 0.99 ? "involved" : v > 0 ? `${Math.round(v * 100)}%` : "clear"}</em></div>
              ))}
            </div>
          </Meter>
        )}
        {isStructure && (
          <Meter label="Structure" value={collapsed ? "COLLAPSED" : `${Math.round(integrity)}%`} sub={collapsed ? "failed" : integrity < 25 ? "collapse imminent" : integrity < 55 ? "compromised — restrict entry" : integrity < 85 ? "fire-damaged — monitor" : "sound"} pct={collapsed ? 0 : integrity} tone={structureTone} />
        )}
        <Meter label="Water on" value={flowLpm > 0 ? `${flowLpm} L/min` : lines.length ? "0 L/min" : "None"} sub={lines.length ? `${lines.length} line${lines.length === 1 ? "" : "s"}${dryLines ? ` · ${dryLines} not charged` : ""}` : "no line in play"} tone={waterTone}>
          {supplyRows.length > 0 && (
            <div className="fg-rows">
              {supplyRows.map((r) => <div key={r.callsign} className={r.tone}><b>{r.callsign}</b><span>{r.pumping ? "pumping · " : ""}{r.text}</span></div>)}
            </div>
          )}
        </Meter>
        <Meter label="BA" value={baTeams.length ? `${baTeams.length} team${baTeams.length === 1 ? "" : "s"} · ${wearers.length} in` : "Nobody in"} sub={lowestAir !== null ? `lowest air ${Math.round(lowestAir)}%${nextWhistle !== null ? ` · whistle ${nextWhistle > now ? `in ${mmss(nextWhistle - now)}` : "DUE"}` : ""}` : baTeams.length ? "no board" : "—"} pct={lowestAir} tone={baTone} />
        <Meter label="Persons" value={located.length ? `${located.length} located` : reported ? "Reported" : "None reported"} sub={unaccounted > 0 ? `${unaccounted} unaccounted` : located.length ? "all accounted" : reported ? sc.property.occupants : "—"} tone={personsTone} />
        <Meter label="Utilities" value={utilities.length ? "" : "Unknown"} tone={utilities.some((u) => !u.off) ? "stop" : utilities.length ? "go" : ""}>
          {utilities.length > 0 && (
            <div className="fg-chips">
              {utilities.map((u) => <span key={u.label} className={u.off ? "go" : "stop"}>{u.label === "Electric" ? "Elec" : u.label} {u.off ? "off" : "LIVE"}</span>)}
            </div>
          )}
        </Meter>
      </div>
    </div>
  );
}
