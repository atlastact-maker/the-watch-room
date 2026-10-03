"use client";

// MDT development harness. The real incident MDT, driven by a fixture
// world built from a scenario: two pumps on scene with a BA team in and a
// jet working, the simulator ticking the fire, a crew on the hydrant. For
// looking at the screens and screenshotting them without a shift.
//
//   ?s=02         scenario id (default 02, the Wythenshawe dwelling fire)
//   ?unit=<id>    appliance to open the control page on (default first pump)
//   ?min=14       minutes since the call (default 14)

import { useEffect, useMemo, useState } from "react";
import "../../dashboard/vector/vector.css";
import { PATCH } from "@/lib/sim/areas";
import { DraggableIncidentMdt } from "../../dashboard/components/incident-mdt";
import { SCENARIOS } from "@/lib/sim/scenarios";
import { STATIONS, getStationAppliances } from "@/lib/sim/data";
import { simulateIncident } from "@/lib/sim/incident_sim";
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

  const incident: Incident = { id: "DEV-1", scenarioId: scenario.id, scenario, receivedAt };
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

  const deployments: Deployment[] = [
    mk(p1.id, 13 * 60, 5 * 60, offset(here, -28, -14), { pumpRunning: true, pumpOperatorCrewId: p1.crewMembers[0]?.id, crewEquipment: { [ba1]: ["ba_set", "branch_45mm", "radio"], [ba2]: ["ba_set", "thermal_camera", "radio"] } }),
    mk(p2.id, 12 * 60, 6 * 60, offset(here, 30, -18), { pumpRunning: true, pumpOperatorCrewId: p2.crewMembers[0]?.id, crewEquipment: { [j1]: ["branch_45mm"], [j2]: ["branch_45mm"], [h1]: ["standpipe", "red_key"] } }),
  ];
  if (p3) deployments.push(mk(p3.id, 3 * 60, 6 * 60, null));
  if (dca) deployments.push(mk(dca.id, 9 * 60, 6 * 60, offset(here, -10, 26)));

  const started = nowMs - 6 * 60_000;
  const tasks = [
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
  ] as unknown as Task[];

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

  return { incident, stations, deployments, tasks, crewAir, log, informantLog, etas, vehicleGauges, busyCrewIds: new Set<string>([ba1, ba2, j1, j2]), commanderId: p1.id, unitId: p1.id, baCrews: { [p1.id]: 2 } };
}

export default function MdtHarnessPage() {
  const [now, setNow] = useState(() => Date.now());
  const [world] = useState(() => buildWorld(param("s") ?? "02", Number(param("min") ?? 14)));
  const [unitId, setUnitId] = useState<string | null>(param("unit") ?? world.unitId);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const sim = useMemo(() => simulateIncident(world.incident, world.deployments, world.baCrews, world.tasks, now), [world, now]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0b1118" }}>
      <div style={{ position: "absolute", left: 24, top: 16, width: 1180, height: 820 }}>
        <DraggableIncidentMdt
          incident={world.incident}
          stations={world.stations}
          deployments={world.deployments}
          log={world.log}
          outcome={null}
          onDeploy={() => {}}
          onStandDownForWelfare={() => {}}
          onResolve={() => {}}
          onDismiss={() => {}}
          onClose={() => {}}
          sim={sim}
          tasks={world.tasks}
          now={now}
          informantLog={world.informantLog}
          informantOnCall={false}
          treatmentByCasualtyId={{}}
          hemsFlyable
          etas={world.etas}
          patch={PATCH}
          onStandDown={() => {}}
          sceneCommanderApplianceId={world.commanderId}
          crewAir={world.crewAir}
          busyCrewIds={world.busyCrewIds}
          vehicleGauges={world.vehicleGauges}
          onStartTask={() => {}}
          onAbortTask={() => {}}
          onSetLightState={() => {}}
          onSetPumpRunning={() => {}}
          onSetPumpOperator={() => {}}
          onSetFastAttackDeployed={() => {}}
          onToggleCrewEquipment={() => {}}
          tacticalMode="offensive"
          fatigueByApplianceId={{}}
          structural={{ integrity: 78, collapsedAt: null, evacuatedAt: null, injured: 0 }}
          unitId={unitId}
          onSetUnitId={setUnitId}
        />
      </div>
    </div>
  );
}
