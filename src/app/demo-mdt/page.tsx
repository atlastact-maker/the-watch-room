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
  { at: 10_200, text: "EVERY RESOURCE. ONE SCREEN." },
  { at: 15_000, text: "ONE CLICK TO MOBILISE" },
  { at: 20_000, text: "FULL UNIT CONTROL — CREW · WATER · ACTIONS" },
  { at: 26_600, text: "HAZARDS AS CREWS FIND THEM" },
  { at: 31_800, text: "CASUALTY BY CASUALTY" },
  { at: 38_400, text: "BA BOARD — WHO'S IN, HOW LONG" },
  { at: 43_400, text: "EVERY DECISION LOGGED" },
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
  // Deployments live in state so the ghost operator's Mobilise click
  // really commits a unit on camera.
  const [deployments, setDeployments] = useState<Deployment[]>(world.deployments);
  useEffect(() => {
    setDeployments(world.deployments);
  }, [world]);

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

  // ---- ghost operator: scripted, human-paced pointer work ----
  useEffect(() => {
    const timers: number[] = [];
    const moveTo = (el: HTMLElement, jitter = 0) => {
      const r = el.getBoundingClientRect();
      setCursor({
        x: r.left + r.width / 2 + jitter,
        y: r.top + r.height / 2,
        click: false,
      });
    };
    /** Nearest scrollable ancestor — the pane we actually need to move. */
    const scrollParentOf = (el: HTMLElement): HTMLElement | null => {
      let p = el.parentElement;
      while (p) {
        const s = window.getComputedStyle(p);
        if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 4) return p;
        p = p.parentElement;
      }
      return null;
    };
    const bringIntoView = (el: HTMLElement) => {
      const sp = scrollParentOf(el);
      if (!sp) return;
      const delta = el.getBoundingClientRect().top - sp.getBoundingClientRect().top;
      sp.scrollTo({
        top: Math.max(0, sp.scrollTop + delta - sp.clientHeight / 2 + el.offsetHeight / 2),
        behavior: "smooth",
      });
    };
    /** Scroll the target's pane, glide to it (long eased travel),
     *  optionally click after settling — re-measuring at click time so
     *  the ring lands exactly on the control. */
    const step = (at: number, find: () => HTMLElement | null, opts?: { click?: boolean; jitter?: number }) => {
      timers.push(
        window.setTimeout(() => {
          const el = find();
          if (!el) return;
          bringIntoView(el);
          timers.push(
            window.setTimeout(() => {
              moveTo(el, opts?.jitter ?? 0);
              if (opts?.click) {
                timers.push(
                  window.setTimeout(() => {
                    const r = el.getBoundingClientRect();
                    setCursor({ x: r.left + r.width / 2 + (opts?.jitter ?? 0), y: r.top + r.height / 2, click: true });
                    el.click();
                    timers.push(window.setTimeout(() => setCursor((c) => (c ? { ...c, click: false } : c)), 520));
                  }, 1000),
                );
              }
            }, 650),
          );
        }, at),
      );
    };
    const buttons = () => Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
    const tab = (label: string) => () => {
      const want = label.toLowerCase();
      return buttons().find((b) => {
        const t = (b.textContent ?? "").trim().toLowerCase();
        return t === want || t.startsWith(want + "·");
      }) ?? null;
    };
    const mobiliseButtons = () =>
      buttons().filter((b) => (b.textContent ?? "").trim().toLowerCase() === "mobilise" && !b.disabled);
    const availableRow = (n: number) => () =>
      (mobiliseButtons()[n]?.closest("li") as HTMLElement | null) ?? null;
    // Prefer a proper pump for the on-camera mobilisation.
    const pumpMobilise = () =>
      mobiliseButtons().find((b) => /water ladder|pump/i.test(b.closest("li")?.textContent ?? "")) ??
      mobiliseButtons()[0] ??
      null;

    step(4_500, tab("call"), { click: true });
    step(9_300, tab("resourcing"), { click: true });
    // run the pointer down the available fleet like a human scanning it
    step(11_800, availableRow(0), { jitter: -40 });
    step(12_900, availableRow(1), { jitter: -25 });
    step(14_000, availableRow(2), { jitter: -35 });
    // …and commit one: MOBILISE a pump
    step(15_200, pumpMobilise, { click: true });
    // open the IC pump's full control page from the committed list
    step(19_400, () => {
      const cs = world.onSceneCallsign.toLowerCase();
      return buttons().find((b) => {
        const t = (b.textContent ?? "").trim().toLowerCase();
        return t.includes(cs) && !t.startsWith("resourcing");
      }) ?? null;
    }, { click: true });
    step(26_000, tab("hazards"), { click: true });
    step(31_200, tab("casualties"), { click: true });
    step(37_800, tab("ba"), { click: true });
    step(42_800, tab("log"), { click: true });
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
              deployments={deployments}
              log={world.log}
              outcome={null}
              onDeploy={(args) =>
                setDeployments((prev) =>
                  prev.some((d) => d.applianceId === args.applianceId)
                    ? prev
                    : [
                        ...prev,
                        {
                          applianceId: args.applianceId,
                          incidentId: world.incident.id,
                          slotId: args.slotId,
                          mobilisedAt: Date.now(),
                          etaSeconds: args.etaSeconds,
                          arrivesAt: Date.now() + args.etaSeconds * 1000,
                          lightState: "999",
                        } as Deployment,
                      ],
                )
              }
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
          style={{
            left: cursor.x,
            top: cursor.y,
            transition:
              "left 1.05s cubic-bezier(0.16, 1, 0.3, 1), top 1.05s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
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
  const scenario = SCENARIOS.find((s) => s.id === "08") ?? SCENARIOS[0];
  const nowMs = Date.now();
  const receivedAt = nowMs - 9 * 60_000;

  const stations: StationWithAppliances[] = STATIONS.map((s) => ({
    ...s,
    appliances: getStationAppliances(s.id),
  }));

  const FRONTLINE = new Set(["WrL", "WrT", "L6P", "TRU_pump"]);
  // First-due station's pump + a support pump from a neighbouring ground.
  const firstDue =
    stations.find((s) => s.id === scenario.property.firstDueStationId && s.appliances.length > 0) ??
    stations.find((s) => s.service === "Fire" && s.appliances.some((a) => FRONTLINE.has(a.type)))!;
  const pumps = firstDue.appliances.filter((a) => FRONTLINE.has(a.type));
  const p1 = pumps[0];
  const supportPumps = stations
    .filter((s) => s.service === "Fire" && s.id !== firstDue.id)
    .flatMap((s) => s.appliances)
    .filter((a) => FRONTLINE.has(a.type) && a.crewMembers.length >= 4);
  const p2 = pumps[1] ?? supportPumps[0];
  const support = supportPumps.find((a) => a.id !== p2?.id);
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
