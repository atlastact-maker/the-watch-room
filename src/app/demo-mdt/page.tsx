"use client";

// MDT demo — a scripted "ghost operator" drives the REAL incident MDT
// component through its tabs with live mock data: Overview → Call →
// Resourcing (into a unit's control page) → Hazards → Casualties → BA →
// Log, then an end card. 9:16 stage, auto-loops, built for screen
// capture. Public route; nothing here touches real game state.

import { useEffect, useMemo, useRef, useState } from "react";
import { DraggableIncidentMdt } from "../dashboard/components/incident-mdt";
import { SCENARIOS } from "@/lib/sim/scenarios";
import { STATIONS, getStationAppliances } from "@/lib/sim/data";
import type { StationWithAppliances } from "../dashboard/page";
import type {
  Deployment,
  Incident,
  LogEntry,
  Task,
} from "@/lib/sim/incident_types";
import type { IncidentSimState } from "@/lib/sim/incident_sim";
import type { Eta } from "../dashboard/components/deployment-board";

const LOOP_MS = 56_000;

// Caption beats over the stage, keyed to the tab script below.
const CAPTIONS: { at: number; text: string }[] = [
  { at: 300, text: "THE MDT — YOUR INCIDENT TERMINAL" },
  { at: 5_200, text: "THE 999 LINE, LIVE" },
  { at: 11_200, text: "EVERY RESOURCE. ONE SCREEN." },
  { at: 16_800, text: "FULL UNIT CONTROL — CREW · WATER · ACTIONS" },
  { at: 24_200, text: "HAZARDS AS CREWS FIND THEM" },
  { at: 30_200, text: "CASUALTY BY CASUALTY" },
  { at: 37_200, text: "BA BOARD — WHO'S IN, HOW LONG" },
  { at: 42_200, text: "EVERY DECISION LOGGED" },
];

export default function DemoMdtPage() {
  const [runId, setRunId] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  const [cursor, setCursor] = useState<{ x: number; y: number; click: boolean } | null>(null);
  // ?capture=1 hides the operator gutter for clean screen recordings.
  const [captureMode] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("capture"),
  );

  // Fresh demo world each loop.
  const world = useMemo(() => buildWorld(), [runId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear any stored tablet frame so the demo always stages identically.
  useState(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("twr:mdt-frame:v1");
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    startRef.current = performance.now();
    setElapsed(0);
    const id = window.setInterval(() => {
      setNow(Date.now());
      const e = performance.now() - startRef.current;
      if (e >= LOOP_MS) {
        setRunId((r) => r + 1);
        return;
      }
      setElapsed(e);
    }, 250);
    return () => window.clearInterval(id);
  }, [runId]);

  // ---- ghost operator: scripted clicks on the real component ----
  useEffect(() => {
    const timers: number[] = [];
    const clickAt = (at: number, find: () => HTMLElement | null) => {
      timers.push(
        window.setTimeout(() => {
          const el = find();
          if (!el) return;
          const r = el.getBoundingClientRect();
          setCursor({ x: r.left + r.width / 2, y: r.top + r.height / 2, click: false });
          timers.push(
            window.setTimeout(() => {
              setCursor({ x: r.left + r.width / 2, y: r.top + r.height / 2, click: true });
              el.click();
              timers.push(window.setTimeout(() => setCursor((c) => (c ? { ...c, click: false } : c)), 500));
            }, 700),
          );
        }, at),
      );
    };
    const tab = (label: string) => () => {
      const want = label.toLowerCase();
      return (
        Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((b) => {
          const t = (b.textContent ?? "").trim().toLowerCase();
          return t === want || t.startsWith(want + "·");
        }) ?? null
      );
    };
    clickAt(4_500, tab("call"));
    clickAt(10_500, tab("resourcing"));
    // open the first on-scene unit's control page from the committed list
    clickAt(16_000, () => {
      const cs = world.onSceneCallsign.toLowerCase();
      return (
        Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((b) => {
          const t = (b.textContent ?? "").trim().toLowerCase();
          return t.includes(cs) && !t.startsWith("resourcing");
        }) ?? null
      );
    });
    clickAt(23_500, tab("hazards"));
    clickAt(29_500, tab("casualties"));
    clickAt(36_500, tab("ba"));
    clickAt(41_500, tab("log"));
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      setCursor(null);
    };
  }, [runId, world.onSceneCallsign]);

  const caption = [...CAPTIONS].reverse().find((c) => elapsed >= c.at)?.text ?? "";
  const endCard = elapsed >= 47_000;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black font-mono text-zinc-100 select-none">
      <style>{KEYFRAMES}</style>

      {/* 9:16 stage */}
      <div
        key={runId}
        className="relative overflow-hidden bg-[#050507]"
        style={{ height: "100vh", aspectRatio: "9 / 16", maxWidth: "100vw" }}
      >
        <div className="scan pointer-events-none absolute inset-0 z-40" />
        <div className="vignette pointer-events-none absolute inset-0 z-40" />

        {/* caption strip */}
        {!endCard && (
          <div className="absolute inset-x-0 top-[5%] z-30 px-6 text-center">
            <div
              key={caption}
              className="animate-[fadeIn_0.45s_ease-out] text-[17px] font-bold uppercase tracking-[0.22em] text-zinc-100"
              style={{ textShadow: "0 0 18px rgba(251,191,36,0.35)" }}
            >
              {caption}
            </div>
          </div>
        )}

        {/* the real MDT, scaled into the stage */}
        {!endCard && (
          <div
            className="absolute left-1/2 top-[52%] z-10"
            style={{
              width: 930,
              height: 730,
              transform: "translate(-50%, -50%) scale(var(--mdt-scale, 0.52))",
            }}
          >
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
              sim={world.sim}
              tasks={world.tasks}
              now={now}
              informantLog={world.informantLog}
              informantOnCall={false}
              treatmentByCasualtyId={{}}
              hemsFlyable
              etas={world.etas}
              patch={world.incident.scenario.patch}
              onStandDown={() => {}}
              sceneCommanderApplianceId={world.commanderId}
              crewAir={world.crewAir}
              busyCrewIds={world.busyCrewIds}
              vehicleGauges={world.vehicleGauges}
              onStartTask={() => {}}
              onSetLightState={() => {}}
              onSetPumpRunning={() => {}}
              onSetPumpOperator={() => {}}
              onSetFastAttackDeployed={() => {}}
              onToggleCrewEquipment={() => {}}
              tacticalMode="offensive"
              fatigueByApplianceId={{}}
            />
          </div>
        )}

        {/* footer tag */}
        {!endCard && (
          <div className="absolute inset-x-0 bottom-[6%] z-30 text-center text-[10px] uppercase tracking-[0.35em] text-zinc-600">
            The Watch Room · simulation
          </div>
        )}

        {/* end card */}
        {endCard && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 px-8 text-center">
            <div
              className="animate-[titleIn_1s_cubic-bezier(.2,.8,.2,1)_forwards] text-[46px] font-bold leading-tight tracking-tight text-white"
              style={{ textShadow: "0 0 32px rgba(255,255,255,0.3)" }}
            >
              THE WATCH
              <br />
              ROOM
            </div>
            <div className="animate-[fadeIn_0.8s_0.6s_ease-out_both] text-[14px] font-bold uppercase tracking-[0.3em] text-amber-400">
              You&apos;re in command and control.
            </div>
            <div className="animate-[fadeIn_0.8s_1.1s_ease-out_both] text-[11px] uppercase tracking-[0.3em] text-zinc-400">
              In development
            </div>
          </div>
        )}
      </div>

      {/* ghost cursor — viewport coords, above everything */}
      {cursor && !endCard && (
        <div
          className="pointer-events-none fixed z-50"
          style={{ left: cursor.x, top: cursor.y, transition: "left 0.7s cubic-bezier(.3,.7,.3,1), top 0.7s cubic-bezier(.3,.7,.3,1)" }}
        >
          {cursor.click && (
            <span className="absolute -left-3.5 -top-3.5 size-8 animate-[clickRing_0.5s_ease-out] rounded-full border-2 border-amber-400" />
          )}
          <svg width="22" height="24" viewBox="0 0 20 22" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.9))" }}>
            <path d="M2 1 L2 17 L6.5 13.5 L9.5 20 L12.5 18.6 L9.6 12.4 L15.4 12 Z" fill="#fff" stroke="#000" strokeWidth="1.2" />
          </svg>
        </div>
      )}

      {/* replay control outside the stage */}
      <div className={"absolute left-4 top-1/2 z-40 -translate-y-1/2 flex-col gap-3 text-[10px] uppercase tracking-[0.3em] text-zinc-600 " + (captureMode ? "hidden" : "hidden md:flex")}>
        <span>9:16</span>
        <span>mdt demo</span>
        <button onClick={() => setRunId((r) => r + 1)} className="text-zinc-400 hover:text-zinc-100">
          ▸ replay
        </button>
        <span className="text-zinc-700">loops auto</span>
      </div>

      <style>{`
        :root { --mdt-scale: 0.52; }
        @media (min-width: 700px) { :root { --mdt-scale: 0.72; } }
        @media (min-width: 1000px) { :root { --mdt-scale: 1.12; } }
      `}</style>
    </div>
  );
}

/* ------------------------------ mock world ------------------------------ */

function buildWorld() {
  const scenario = SCENARIOS.find((s) => s.id === "02") ?? SCENARIOS[0];
  const nowMs = Date.now();
  const receivedAt = nowMs - 9 * 60_000;

  const stations: StationWithAppliances[] = STATIONS.map((s) => ({
    ...s,
    appliances: getStationAppliances(s.id),
  }));

  // First-due station's pumps + a support pump from anywhere else.
  const firstDue =
    stations.find((s) => s.id === scenario.property.firstDueStationId && s.appliances.length > 0) ??
    stations.find((s) => s.service === "Fire" && s.appliances.length >= 2)!;
  const pumps = firstDue.appliances.filter((a) => a.service === "Fire");
  const p1 = pumps[0];
  const p2 = pumps[1] ?? pumps[0];
  const support = stations
    .filter((s) => s.service === "Fire" && s.id !== firstDue.id)
    .flatMap((s) => s.appliances)
    .find((a) => a.crewMembers.length >= 4);
  const dca = stations
    .filter((s) => s.service === "Ambulance")
    .flatMap((s) => s.appliances)
    .find((a) => a.type === "DCA");

  const incident: Incident = {
    id: "DEMO-1",
    scenarioId: scenario.id,
    scenario,
    receivedAt,
  };

  const mkDep = (applianceId: string, mobilisedAgoSec: number, etaSec: number): Deployment =>
    ({
      applianceId,
      incidentId: "DEMO-1",
      slotId: "extra",
      mobilisedAt: nowMs - mobilisedAgoSec * 1000,
      etaSeconds: etaSec,
      arrivesAt: nowMs - mobilisedAgoSec * 1000 + etaSec * 1000,
      lightState: "999",
    }) as Deployment;

  const deployments: Deployment[] = [
    mkDep(p1.id, 8 * 60, 5 * 60), // on scene 3 min
    mkDep(p2.id, 7 * 60, 6 * 60), // on scene 1 min
  ];
  if (support) deployments.push(mkDep(support.id, 2 * 60, 5 * 60)); // mobile, ~3 min out
  if (dca) deployments.push(mkDep(dca.id, 6 * 60, 5 * 60)); // on scene

  const ba1 = p1.crewMembers[1]?.id ?? p1.crewMembers[0]?.id ?? "c1";
  const ba2 = p1.crewMembers[2]?.id ?? p1.crewMembers[0]?.id ?? "c2";
  const tasks = [
    {
      id: "task-ba",
      applianceId: p1.id,
      kind: "ba_sar",
      state: "active",
      label: "BA search & rescue",
      assignedCrewIds: [ba1, ba2],
      baCrewIds: [ba1, ba2],
      startedAt: nowMs - 3 * 60_000,
      endsAt: nowMs + 9 * 60_000,
      entryPoint: "Front door",
      baMode: "search",
      remarks: "First floor search — left-hand search pattern",
    },
  ] as unknown as Task[];

  const crewAir: Record<string, number> = { [ba1]: 64, [ba2]: 58 };

  const scene = scenario.scene;
  const sim = {
    visibleHazards: (scene?.hazards ?? []).map((h) => ({ id: h.id, label: h.label, kind: h.kind })),
    foundCasualties: scene?.casualties ?? [],
    casualtyProgression: Object.fromEntries(
      (scene?.casualties ?? []).map((c, i) => [
        c.id,
        {
          stage: i === 0 ? "in_treatment" : "located",
          severity: c.severity,
          deteriorateAt: nowMs + (i === 0 ? 4 : 7) * 60_000,
        },
      ]),
    ),
  } as unknown as IncidentSimState;

  const t = (minAgo: number) => nowMs - minAgo * 60_000;
  const log: LogEntry[] = [
    { id: "l1", timestamp: t(9), kind: "incident_opened", message: `Incident opened — ${scenario.title}` },
    { id: "l2", timestamp: t(8.7), kind: "mobilised", message: `Mobilised ${p1.callsign} · ETA 5 min` },
    { id: "l3", timestamp: t(8.5), kind: "mobilised", message: `Mobilised ${p2.callsign} · ETA 6 min` },
    { id: "l4", timestamp: t(3.4), kind: "in_attendance", message: `${p1.callsign} in attendance — smoke showing` },
    { id: "l5", timestamp: t(3), kind: "annotation", message: "360 survey complete — uPVC front door, gas meter under stairs" },
    { id: "l6", timestamp: t(2.8), kind: "ba_committed", message: `BA committed ×2 from ${p1.callsign} — emergency search` },
    { id: "l7", timestamp: t(2.1), kind: "casualty_found", message: "Casualty located — child, back bedroom" },
    { id: "l8", timestamp: t(1.4), kind: "in_attendance", message: `${p2.callsign} in attendance — second jet`},
    { id: "l9", timestamp: t(0.7), kind: "annotation", message: "NWAS crew with casualty — oxygen running" },
  ] as LogEntry[];

  const informantLog = [
    { id: "i1", text: "Please hurry, there's thick smoke coming from the kitchen window!", tone: "urgent", firedAt: t(8.9) },
    { id: "i2", text: "My son's upstairs, he was asleep in the back bedroom.", tone: "critical", firedAt: t(8.4) },
    { id: "i3", text: "The neighbour thinks there's heat coming through the party wall.", tone: "info", firedAt: t(7.6) },
  ] as unknown as NonNullable<Parameters<typeof DraggableIncidentMdt>[0]["informantLog"]>;

  const etas = Object.fromEntries(
    stations.map((s, i) => [s.id, { seconds: 240 + ((i * 37) % 400), meters: 3000 + ((i * 911) % 6000), coords: null }]),
  ) as unknown as Record<string, Eta>;

  const vehicleGauges = Object.fromEntries(
    [p1, p2, support, dca].filter(Boolean).map((a) => [
      a!.id,
      { fuelPct: 82, waterPct: a!.service === "Fire" ? 64 : 100, conditionPct: 96 },
    ]),
  );

  return {
    incident,
    stations,
    deployments,
    tasks,
    crewAir,
    sim,
    log,
    informantLog,
    etas,
    vehicleGauges,
    busyCrewIds: new Set<string>([ba1, ba2]),
    commanderId: p1.id,
    onSceneCallsign: p1.callsign,
  };
}

/* ----------------------------- keyframes ----------------------------- */

const KEYFRAMES = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes titleIn {
  0%   { opacity: 0; letter-spacing: 0.4em; transform: scale(0.94); }
  60%  { opacity: 1; }
  100% { opacity: 1; letter-spacing: 0em; transform: scale(1); }
}
@keyframes clickRing {
  from { opacity: 0.9; transform: scale(0.4); }
  to   { opacity: 0; transform: scale(1.6); }
}
.scan {
  background-image: linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px);
}
.vignette {
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%);
}
`;
