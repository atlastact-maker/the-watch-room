"use client";

// Crash Recovery System panel — the MDT's CRS tab for vehicle-based
// incidents. Mirrors the datasheet style crews actually use: a top-down
// vehicle schematic with safety-critical components highlighted, a
// colour legend, and the cutting/isolation guidance beside it.
//
// Interactive: each datasheet carries "make safe" actions (isolate the
// 12V system, foam-blanket a ruptured tank, restrain gas struts,
// stabilise the vehicle). The operator taps a component or action row,
// picks an on-scene appliance and crew, and a real timed crs_action
// task runs — progress and completion feed straight back onto the
// schematic. Completing every critical action releases a faster,
// controlled extrication.

import { useState } from "react";
import type {
  CrsAction,
  CrsComponent,
  CrsVehicle,
  Task,
} from "@/lib/sim/incident_types";
import { CrewPickerInline, type StartTaskFn } from "./bottom-action-menu";
import type { ResolvedDeployment } from "./incident-view";

const KIND_STYLE: Record<
  CrsComponent["kind"],
  { fill: string; stroke: string; label: string; text?: string }
> = {
  battery_12v: { fill: "#facc15", stroke: "#a16207", label: "12V battery", text: "12V" },
  battery_hv: { fill: "#fb923c", stroke: "#c2410c", label: "HV battery", text: "HV" },
  airbag: { fill: "#ef4444", stroke: "#991b1b", label: "Airbag" },
  curtain_airbag: { fill: "#f87171", stroke: "#991b1b", label: "Curtain airbag" },
  srs_unit: { fill: "#a855f7", stroke: "#6b21a8", label: "SRS unit", text: "SRS" },
  pretensioner: { fill: "#2dd4bf", stroke: "#0f766e", label: "Pretensioner", text: "PT" },
  fuel_tank: { fill: "#60a5fa", stroke: "#1d4ed8", label: "Fuel tank", text: "FUEL" },
  gas_strut: { fill: "#4ade80", stroke: "#15803d", label: "Gas strut" },
  reinforcement: { fill: "#7f1d1d", stroke: "#450a0a", label: "UHSS — do not cut" },
};

const FUEL_LABEL: Record<CrsVehicle["fuel"], { label: string; cls: string }> = {
  petrol: { label: "PETROL", cls: "bg-zinc-700 text-white" },
  diesel: { label: "DIESEL", cls: "bg-zinc-900 text-white" },
  hybrid: { label: "HYBRID", cls: "bg-teal-600 text-white" },
  phev: { label: "PLUG-IN HYBRID", cls: "bg-teal-700 text-white" },
  bev: { label: "ELECTRIC · HV", cls: "bg-orange-600 text-white" },
};

type ActionStatus =
  | { state: "ready" }
  | { state: "active"; task: Task; remainingSec: number }
  | { state: "done"; task: Task };

/** Every distinct action on a vehicle — whole-vehicle actions first, then
 *  component actions, deduped by id (a shared id, e.g. a strut pair, is
 *  one action). */
function actionsOf(v: CrsVehicle): CrsAction[] {
  const out: CrsAction[] = [];
  const seen = new Set<string>();
  for (const a of [
    ...(v.actions ?? []),
    ...v.components.map((c) => c.action).filter((a): a is CrsAction => !!a),
  ]) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    out.push(a);
  }
  return out;
}

function statusOf(
  tasks: Task[] | undefined,
  vehicleId: string,
  actionId: string,
  now: number,
): ActionStatus {
  const match = (tasks ?? []).filter(
    (t) =>
      t.kind === "crs_action" &&
      t.crsVehicleId === vehicleId &&
      t.crsActionId === actionId &&
      t.state !== "aborted",
  );
  const done = match.find((t) => t.state === "completed");
  if (done) return { state: "done", task: done };
  const active = match.find((t) => t.state === "active");
  if (active) {
    const remainingSec = active.completesAt
      ? Math.max(0, Math.ceil((active.completesAt - now) / 1000))
      : 0;
    return { state: "active", task: active, remainingSec };
  }
  return { state: "ready" };
}

function fmtCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m} min` : `${m}m${s}`;
}

export function CrsPanel({
  vehicles,
  onScene,
  tasks,
  busyCrewIds,
  now,
  onStartTask,
}: {
  vehicles: CrsVehicle[];
  /** Fire appliances currently at the incident — the pool CRS actions
   *  draw crew from. Omit (with onStartTask) for a read-only datasheet. */
  onScene?: ResolvedDeployment[];
  tasks?: Task[];
  busyCrewIds?: Set<string>;
  now?: number;
  onStartTask?: StartTaskFn;
}) {
  const [idx, setIdx] = useState(0);
  const [armedActionId, setArmedActionId] = useState<string | null>(null);
  const [pickApplianceId, setPickApplianceId] = useState<string | null>(null);
  const [pickedCrew, setPickedCrew] = useState<string[]>([]);
  const [selInfo, setSelInfo] = useState<string | null>(null);

  const v = vehicles[Math.min(idx, vehicles.length - 1)];
  if (!v) return null;
  const fuel = FUEL_LABEL[v.fuel];
  const usedKinds = [...new Set(v.components.map((c) => c.kind))];
  const tick = now ?? Date.now();
  const interactive = !!onStartTask;
  const busy = busyCrewIds ?? new Set<string>();

  const rows = actionsOf(v);
  const status = (a: CrsAction) => statusOf(tasks, v.id, a.id, tick);

  // "Made safe" — every critical action on this vehicle complete.
  const criticalRows = rows.filter((a) => a.critical);
  const vehicleSafe =
    criticalRows.length > 0 &&
    criticalRows.every((a) => status(a).state === "done");

  // Scene-wide: outstanding critical actions across all CRS vehicles gate
  // the controlled-extrication bonus.
  const allCritical = vehicles.flatMap((veh) =>
    actionsOf(veh)
      .filter((a) => a.critical)
      .map((a) => ({ veh, a })),
  );
  const outstanding = allCritical.filter(
    ({ veh, a }) => statusOf(tasks, veh.id, a.id, tick).state !== "done",
  );

  function disarm() {
    setArmedActionId(null);
    setPickApplianceId(null);
    setPickedCrew([]);
  }

  function selectVehicle(i: number) {
    setIdx(i);
    setSelInfo(null);
    disarm();
  }

  function armAction(a: CrsAction) {
    if (!interactive) return;
    if (status(a).state !== "ready") return;
    setSelInfo(null);
    if (armedActionId === a.id) {
      disarm();
      return;
    }
    setArmedActionId(a.id);
    setPickApplianceId(null);
    setPickedCrew([]);
  }

  function confirmStart(a: CrsAction) {
    if (!onStartTask || !pickApplianceId) return;
    if (pickedCrew.length < a.minCrew) return;
    onStartTask({
      applianceId: pickApplianceId,
      kind: "crs_action",
      assignedCrewIds: pickedCrew,
      crsVehicleId: v.id,
      crsActionId: a.id,
      crsDurationSec: a.durationSec,
      crsLabel: a.label,
      crsDoneMessage: a.done,
    });
    disarm();
  }

  return (
    <div>
      {/* Vehicle selector */}
      {vehicles.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {vehicles.map((veh, i) => {
            const vehCritical = actionsOf(veh).filter((a) => a.critical);
            const safe =
              vehCritical.length > 0 &&
              vehCritical.every(
                (a) => statusOf(tasks, veh.id, a.id, tick).state === "done",
              );
            return (
              <button
                key={veh.id}
                type="button"
                onClick={() => selectVehicle(i)}
                className={
                  "flex items-center gap-1.5 rounded-sm border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors " +
                  (i === idx
                    ? "border-amber-500 bg-[#fde047] text-black"
                    : "border-zinc-400 bg-white text-zinc-600 hover:bg-zinc-100")
                }
              >
                {safe && (
                  <span className="inline-block size-2 rounded-full bg-green-600" />
                )}
                {veh.make} {veh.model.split(" ")[0]} · {veh.vrm}
              </button>
            );
          })}
        </div>
      )}

      {/* Scene-wide extrication readiness */}
      {interactive && allCritical.length > 0 && (
        <div
          className={
            "mt-2 border-l-4 px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest " +
            (outstanding.length === 0
              ? "border-green-600 bg-green-50 text-green-800"
              : "border-amber-500 bg-amber-50 text-amber-800")
          }
        >
          {outstanding.length === 0
            ? "All vehicles made safe — controlled extrication released (cutting time reduced)"
            : `Controlled extrication locked · ${outstanding.length} critical action${outstanding.length === 1 ? "" : "s"} outstanding`}
        </div>
      )}

      {/* Identification strip */}
      <div className="mt-2.5 border border-zinc-400 bg-white">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-zinc-300 bg-[#e7e7ea] px-2.5 py-1.5">
          <span className="font-mono text-[12px] font-bold text-zinc-900">
            {v.make.toUpperCase()} {v.model.toUpperCase()}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            {v.years}
          </span>
          <span className="rounded-[2px] border border-zinc-800 bg-[#fde047] px-1.5 font-mono text-[11px] font-bold tracking-widest text-black">
            {v.vrm}
          </span>
          <span className={`rounded-[2px] px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest ${fuel.cls}`}>
            {fuel.label}
          </span>
          {vehicleSafe && (
            <span className="rounded-[2px] bg-green-600 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest text-white">
              MADE SAFE
            </span>
          )}
        </div>

        <div className="grid gap-3 p-3 sm:grid-cols-[220px_1fr]">
          {/* Schematic */}
          <div>
            <VehicleSchematic
              vehicle={v}
              interactive={interactive}
              statusFor={(actionId) => statusOf(tasks, v.id, actionId, tick).state}
              onPickComponent={(c) => {
                if (c.action) {
                  armAction(c.action);
                } else {
                  disarm();
                  setSelInfo(
                    selInfo === c.label ? null : c.label,
                  );
                }
              }}
              armedActionId={armedActionId}
            />
            {selInfo && (
              <div className="mt-1.5 border-l-4 border-zinc-400 bg-zinc-100 px-2 py-1 text-[11px] leading-snug text-zinc-700">
                {selInfo} — information only. No crew action; keep clear and
                respect deployment zones.
              </div>
            )}
            {/* Legend */}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {usedKinds.map((k) => (
                <span key={k} className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                  <span
                    className="inline-block size-2.5 rounded-[2px] border"
                    style={{ background: KIND_STYLE[k].fill, borderColor: KIND_STYLE[k].stroke }}
                  />
                  {KIND_STYLE[k].label}
                </span>
              ))}
            </div>
            {interactive && (
              <p className="mt-1.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                Tap a highlighted component to task crew against it
              </p>
            )}
          </div>

          {/* Actions + guidance */}
          <div>
            {rows.length > 0 && (
              <>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-700">
                  Make-safe actions
                </div>
                <ul className="mt-1.5 space-y-1.5">
                  {rows.map((a) => (
                    <ActionRow
                      key={a.id}
                      action={a}
                      status={status(a)}
                      interactive={interactive}
                      armed={armedActionId === a.id}
                      onArm={() => armAction(a)}
                      onScene={onScene ?? []}
                      pickApplianceId={pickApplianceId}
                      onPickAppliance={(id) => {
                        setPickApplianceId(id);
                        setPickedCrew([]);
                      }}
                      pickedCrew={pickedCrew}
                      onTogglePick={(id) =>
                        setPickedCrew((prev) =>
                          prev.includes(id)
                            ? prev.filter((x) => x !== id)
                            : [...prev, id],
                        )
                      }
                      busyCrewIds={busy}
                      onCancel={disarm}
                      onConfirm={() => confirmStart(a)}
                    />
                  ))}
                </ul>
              </>
            )}

            <div className={rows.length > 0 ? "mt-3" : ""}>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-700">
                Safety-critical guidance
              </div>
              <ul className="mt-1.5 space-y-1.5">
                {v.notes.map((n) => (
                  <li
                    key={n}
                    className="border-l-4 border-red-500 bg-red-50 px-2 py-1.5 text-[12px] leading-snug text-zinc-900"
                  >
                    {n}
                  </li>
                ))}
              </ul>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                Crash Recovery System · datasheet generated for this incident
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// One make-safe action: status row, then (when armed) the appliance pick
// and the shared crew picker.
// ---------------------------------------------------------------------------

function ActionRow({
  action,
  status,
  interactive,
  armed,
  onArm,
  onScene,
  pickApplianceId,
  onPickAppliance,
  pickedCrew,
  onTogglePick,
  busyCrewIds,
  onCancel,
  onConfirm,
}: {
  action: CrsAction;
  status: ActionStatus;
  interactive: boolean;
  armed: boolean;
  onArm: () => void;
  onScene: ResolvedDeployment[];
  pickApplianceId: string | null;
  onPickAppliance: (id: string) => void;
  pickedCrew: string[];
  onTogglePick: (id: string) => void;
  busyCrewIds: Set<string>;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const picked = onScene.find((r) => r.appliance.id === pickApplianceId) ?? null;
  const meta = [
    fmtDuration(action.durationSec),
    `${action.minCrew}+ crew`,
    ...(action.critical ? ["critical"] : []),
  ].join(" · ");

  return (
    <li
      className={
        "border bg-white " +
        (status.state === "done"
          ? "border-green-600/60"
          : armed
            ? "border-amber-500"
            : "border-zinc-300")
      }
    >
      <button
        type="button"
        onClick={onArm}
        disabled={!interactive || status.state !== "ready"}
        className={
          "flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left " +
          (interactive && status.state === "ready"
            ? "cursor-pointer hover:bg-amber-50"
            : "cursor-default")
        }
      >
        <span className="min-w-0">
          <span className="block text-[12px] font-semibold leading-tight text-zinc-900">
            {action.label}
          </span>
          {action.detail && (
            <span className="block text-[11px] leading-snug text-zinc-600">
              {action.detail}
            </span>
          )}
          <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-widest text-zinc-500">
            {meta}
            {action.requiredEquipment && action.requiredEquipment.length > 0
              ? ` · kit: ${action.requiredEquipment.join(", ").replace(/_/g, " ")}`
              : ""}
          </span>
        </span>
        <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest">
          {status.state === "done" && (
            <span className="text-green-700">✓ Done</span>
          )}
          {status.state === "active" && (
            <span className="animate-pulse text-amber-700">
              {fmtCountdown(status.remainingSec)}
            </span>
          )}
          {status.state === "ready" &&
            (interactive ? (
              <span className={armed ? "text-amber-700" : "text-red-700"}>
                {armed ? "▾ Assign" : "Start"}
              </span>
            ) : (
              <span className="text-zinc-400">Ready</span>
            ))}
        </span>
      </button>

      {armed && status.state === "ready" && (
        <div className="border-t border-zinc-200 px-2 py-2">
          {onScene.length === 0 ? (
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              No fire appliance on scene yet — crews can act once one books
              in attendance.
            </p>
          ) : (
            <>
              <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                From appliance
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {onScene.map((r) => {
                  const free = r.appliance.crewMembers.filter(
                    (m) => !busyCrewIds.has(m.id),
                  ).length;
                  const sel = r.appliance.id === pickApplianceId;
                  return (
                    <button
                      key={r.appliance.id}
                      type="button"
                      onClick={() => onPickAppliance(r.appliance.id)}
                      disabled={free === 0}
                      className={
                        "rounded-sm border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-40 " +
                        (sel
                          ? "border-amber-500 bg-[#fde047] text-black"
                          : "border-zinc-400 bg-white text-zinc-700 hover:bg-zinc-100")
                      }
                    >
                      {r.appliance.callsign} · {free} free
                    </button>
                  );
                })}
              </div>
              {picked && (
                <div className="mt-2">
                  <CrewPickerInline
                    appliance={picked.appliance}
                    deployment={picked.deployment}
                    minCrew={action.minCrew}
                    requiredEquipment={action.requiredEquipment}
                    pickedCrew={pickedCrew}
                    busyCrewIds={busyCrewIds}
                    title={action.label}
                    onTogglePick={onTogglePick}
                    onCancel={onCancel}
                    onConfirm={onConfirm}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Schematic
// ---------------------------------------------------------------------------

/** Where the status badge sits for each component shape. */
function badgePos(c: CrsComponent): { x: number; y: number } {
  switch (c.kind) {
    case "airbag":
      return { x: c.x + 4.5, y: c.y - 4.5 };
    case "curtain_airbag":
      return { x: c.x + 3, y: c.y - (c.h ?? 50) / 2 + 18 };
    case "reinforcement":
      return { x: c.x + (c.w ?? 6), y: c.y };
    case "gas_strut":
      return { x: c.x + 3, y: c.y - 8 };
    case "pretensioner":
      return { x: c.x + 4, y: c.y - 4 };
    default: {
      const w = c.w ?? 16;
      const h = c.h ?? 11;
      return { x: c.x + w / 2, y: c.y - h / 2 };
    }
  }
}

// Base vehicle artwork — Moditech-style cutaway top-downs: body contours,
// lamps and glazing outside, roof removed over the cabin so the seats,
// dash and steering wheel (RHD — right side) show through. Component
// glyphs render on top of these layers.

function BaseDefs({ p }: { p: string }) {
  return (
    <defs>
      <linearGradient id={`${p}-body`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.5" stopColor="#f1f5f9" />
        <stop offset="1" stopColor="#e2e8f0" />
      </linearGradient>
      <linearGradient id={`${p}-glass`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#dbeafe" />
        <stop offset="1" stopColor="#93c5fd" />
      </linearGradient>
    </defs>
  );
}

/** Seat drawn nose-up: squab, then backrest and headrest behind (higher y). */
function Seat({ x, y, w, squab, split }: { x: number; y: number; w: number; squab: number; split?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={squab} rx={3} fill="#cbd5e1" stroke="#64748b" strokeWidth={0.8} />
      {/* bolster stitches */}
      <line x1={x + 2.5} y1={y + 2} x2={x + 2.5} y2={y + squab - 2} stroke="#94a3b8" strokeWidth={0.7} />
      <line x1={x + w - 2.5} y1={y + 2} x2={x + w - 2.5} y2={y + squab - 2} stroke="#94a3b8" strokeWidth={0.7} />
      {split && (
        <line x1={x + w / 2} y1={y + 1} x2={x + w / 2} y2={y + squab + 5} stroke="#94a3b8" strokeWidth={0.8} />
      )}
      <rect x={x} y={y + squab} width={w} height={5} rx={2} fill="#94a3b8" stroke="#64748b" strokeWidth={0.7} />
      {w <= 22 ? (
        <rect x={x + w / 2 - 4} y={y + squab + 5} width={8} height={4} rx={2} fill="#64748b" />
      ) : (
        <>
          <rect x={x + w * 0.22 - 4} y={y + squab + 5} width={8} height={4} rx={2} fill="#64748b" />
          <rect x={x + w * 0.78 - 4} y={y + squab + 5} width={8} height={4} rx={2} fill="#64748b" />
        </>
      )}
    </g>
  );
}

function SteeringWheel({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="none" stroke="#334155" strokeWidth={1.8} />
      <line x1={cx - 5} y1={cy - 1.5} x2={cx + 5} y2={cy - 1.5} stroke="#334155" strokeWidth={1.1} />
      <line x1={cx} y1={cy} x2={cx} y2={cy + 5} stroke="#334155" strokeWidth={1.1} />
      <circle cx={cx} cy={cy} r={2} fill="#334155" />
    </g>
  );
}

function CarBase({ id }: { id: string }) {
  const p = `cs-${id}`;
  return (
    <g>
      <BaseDefs p={p} />
      {/* ground shadow */}
      <ellipse cx={50} cy={100} rx={42} ry={96} fill="#000000" opacity={0.07} />
      {/* tyres */}
      {[
        [4, 36],
        [84, 36],
        [4, 146],
        [84, 146],
      ].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width={12} height={28} rx={3.5} fill="#27272a" />
          <line x1={x + 6} y1={y + 4} x2={x + 6} y2={y + 24} stroke="#3f3f46" strokeWidth={2} />
        </g>
      ))}
      {/* wing mirrors */}
      <line x1={12} y1={52} x2={6} y2={55} stroke="#64748b" strokeWidth={1.4} />
      <rect x={2} y={52.5} width={7} height={6.5} rx={2} fill="#e2e8f0" stroke="#64748b" strokeWidth={0.9} />
      <line x1={88} y1={52} x2={94} y2={55} stroke="#64748b" strokeWidth={1.4} />
      <rect x={91} y={52.5} width={7} height={6.5} rx={2} fill="#e2e8f0" stroke="#64748b" strokeWidth={0.9} />
      {/* body shell */}
      <path
        d="M50 6 C34 6.5 24 9 19 16 C14 24 12 34 12 46 L12 138 C12 158 13 172 16 182 C20 191 32 194 50 194 C68 194 80 191 84 182 C87 172 88 158 88 138 L88 46 C88 34 86 24 81 16 C76 9 66 6.5 50 6 Z"
        fill={`url(#${p}-body)`}
        stroke="#52525b"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* wheel-arch shading */}
      <path d="M12 40 Q17 50 12 64" fill="none" stroke="#94a3b8" strokeWidth={1.2} />
      <path d="M88 40 Q83 50 88 64" fill="none" stroke="#94a3b8" strokeWidth={1.2} />
      <path d="M12 146 Q17 156 12 170" fill="none" stroke="#94a3b8" strokeWidth={1.2} />
      <path d="M88 146 Q83 156 88 170" fill="none" stroke="#94a3b8" strokeWidth={1.2} />
      {/* headlamps + grille */}
      <path d="M20 12 L34 9 L36 14.5 L23 19 Z" fill="#e0f2fe" stroke="#64748b" strokeWidth={0.8} />
      <path d="M80 12 L66 9 L64 14.5 L77 19 Z" fill="#e0f2fe" stroke="#64748b" strokeWidth={0.8} />
      <rect x={42} y={8.5} width={16} height={4} rx={2} fill="#cbd5e1" stroke="#64748b" strokeWidth={0.6} />
      <circle cx={50} cy={10.5} r={1.6} fill="#94a3b8" />
      {/* bonnet creases + shutline */}
      <path d="M30 16 C28 26 27 34 26 43" fill="none" stroke="#cbd5e1" strokeWidth={1} />
      <path d="M70 16 C72 26 73 34 74 43" fill="none" stroke="#cbd5e1" strokeWidth={1} />
      <path d="M14 44 Q50 40 86 44" fill="none" stroke="#94a3b8" strokeWidth={1.2} />
      {/* windscreen */}
      <path
        d="M20 47 C32 44.5 68 44.5 80 47 L74 67 C62 64.5 38 64.5 26 67 Z"
        fill={`url(#${p}-glass)`}
        stroke="#60a5fa"
        strokeWidth={1}
      />
      <path d="M30 63 Q42 58 46 51" fill="none" stroke="#bfdbfe" strokeWidth={1} opacity={0.9} />
      <path d="M52 63 Q64 58 68 51" fill="none" stroke="#bfdbfe" strokeWidth={1} opacity={0.9} />
      {/* cabin floor (roof removed — cutaway) */}
      <rect x={16} y={68} width={68} height={80} rx={6} fill="#f1f5f9" />
      {/* dash + binnacle */}
      <path d="M24 70 L76 70 L74 77 L26 77 Z" fill="#94a3b8" />
      <rect x={58} y={71} width={13} height={4.5} rx={1} fill="#64748b" />
      {/* centre console + gear */}
      <rect x={46} y={78} width={8} height={26} rx={2} fill="#cbd5e1" stroke="#94a3b8" strokeWidth={0.6} />
      <circle cx={50} cy={95} r={1.8} fill="#64748b" />
      {/* front seats — driver on the right (RHD) */}
      <Seat x={28} y={86} w={16} squab={14} />
      <Seat x={56} y={86} w={16} squab={14} />
      <SteeringWheel cx={65} cy={82} />
      {/* rear bench */}
      <Seat x={27} y={116} w={46} squab={16} split />
      {/* parcel shelf */}
      <rect x={24} y={146} width={52} height={4} rx={1.5} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={0.6} />
      {/* rear screen */}
      <path
        d="M26 151 C38 149 62 149 74 151 L80 164 C62 161 38 161 20 164 Z"
        fill={`url(#${p}-glass)`}
        stroke="#60a5fa"
        strokeWidth={1}
      />
      <line x1={26} y1={155} x2={74} y2={155} stroke="#bfdbfe" strokeWidth={0.8} />
      <line x1={24} y1={158.5} x2={76} y2={158.5} stroke="#bfdbfe" strokeWidth={0.8} />
      {/* boot shutline + tail lamps */}
      <path d="M20 167 Q50 171 80 167" fill="none" stroke="#94a3b8" strokeWidth={1.2} />
      <path d="M16 183 Q50 189 84 183" fill="none" stroke="#cbd5e1" strokeWidth={1} />
      <path d="M15 176 L30 179.5 L29 184 L16 181.5 Z" fill="#fca5a5" stroke="#b91c1c" strokeWidth={0.6} />
      <path d="M85 176 L70 179.5 L71 184 L84 181.5 Z" fill="#fca5a5" stroke="#b91c1c" strokeWidth={0.6} />
      {/* roof side rails + headers framing the cutaway */}
      <rect x={22} y={68} width={3.5} height={80} rx={1.7} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={0.7} />
      <rect x={74.5} y={68} width={3.5} height={80} rx={1.7} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={0.7} />
      {/* door shutlines + handles */}
      {[70, 108, 146].map((y) => (
        <g key={y}>
          <line x1={12} y1={y} x2={22} y2={y} stroke="#94a3b8" strokeWidth={0.8} />
          <line x1={78} y1={y} x2={88} y2={y} stroke="#94a3b8" strokeWidth={0.8} />
        </g>
      ))}
      {[86, 122].map((y) => (
        <g key={y}>
          <rect x={13} y={y} width={2.5} height={6} rx={1} fill="#64748b" />
          <rect x={84.5} y={y} width={2.5} height={6} rx={1} fill="#64748b" />
        </g>
      ))}
    </g>
  );
}

function VanBase({ id }: { id: string }) {
  const p = `cs-${id}`;
  return (
    <g>
      <BaseDefs p={p} />
      <ellipse cx={50} cy={100} rx={43} ry={97} fill="#000000" opacity={0.07} />
      {/* tyres */}
      {[
        [4, 38],
        [84, 38],
        [4, 148],
        [84, 148],
      ].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width={12} height={28} rx={3.5} fill="#27272a" />
          <line x1={x + 6} y1={y + 4} x2={x + 6} y2={y + 24} stroke="#3f3f46" strokeWidth={2} />
        </g>
      ))}
      {/* van mirrors — long arms */}
      <line x1={13} y1={40} x2={5} y2={44} stroke="#64748b" strokeWidth={1.4} />
      <rect x={1.5} y={41.5} width={6} height={9} rx={1.5} fill="#e2e8f0" stroke="#64748b" strokeWidth={0.9} />
      <line x1={87} y1={40} x2={95} y2={44} stroke="#64748b" strokeWidth={1.4} />
      <rect x={92.5} y={41.5} width={6} height={9} rx={1.5} fill="#e2e8f0" stroke="#64748b" strokeWidth={0.9} />
      {/* body shell — boxy */}
      <path
        d="M50 5 C36 5 26 7 21 12 C15 18 13 26 13 34 L12 44 L12 180 C12 187 15 191 22 192.5 C32 194 68 194 78 192.5 C85 191 88 187 88 180 L88 44 L87 34 C87 26 85 18 79 12 C74 7 64 5 50 5 Z"
        fill={`url(#${p}-body)`}
        stroke="#52525b"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* arch shading */}
      <path d="M12 42 Q17 52 12 66" fill="none" stroke="#94a3b8" strokeWidth={1.2} />
      <path d="M88 42 Q83 52 88 66" fill="none" stroke="#94a3b8" strokeWidth={1.2} />
      {/* headlamps + grille bars */}
      <path d="M17 10 L34 7.5 L36 13 L21 18 Z" fill="#e0f2fe" stroke="#64748b" strokeWidth={0.8} />
      <path d="M83 10 L66 7.5 L64 13 L79 18 Z" fill="#e0f2fe" stroke="#64748b" strokeWidth={0.8} />
      {[9, 12, 15].map((y) => (
        <rect key={y} x={40} y={y} width={20} height={1.6} rx={0.8} fill="#94a3b8" />
      ))}
      <circle cx={50} cy={12.5} r={2.2} fill="#cbd5e1" stroke="#64748b" strokeWidth={0.6} />
      {/* bonnet creases + shutline */}
      <path d="M28 14 L26 29" stroke="#cbd5e1" strokeWidth={1} />
      <path d="M72 14 L74 29" stroke="#cbd5e1" strokeWidth={1} />
      <path d="M13 31 Q50 27.5 87 31" fill="none" stroke="#94a3b8" strokeWidth={1.2} />
      {/* windscreen */}
      <path
        d="M17 33 C32 30.5 68 30.5 83 33 L79 53 C60 50 40 50 21 53 Z"
        fill={`url(#${p}-glass)`}
        stroke="#60a5fa"
        strokeWidth={1}
      />
      <path d="M28 50 Q40 44 44 36" fill="none" stroke="#bfdbfe" strokeWidth={1} opacity={0.9} />
      <path d="M52 50 Q64 44 68 36" fill="none" stroke="#bfdbfe" strokeWidth={1} opacity={0.9} />
      {/* cab floor (cutaway) */}
      <rect x={15} y={54} width={70} height={44} rx={4} fill="#f1f5f9" />
      {/* dash + binnacle */}
      <path d="M22 56 L78 56 L76 63 L24 63 Z" fill="#94a3b8" />
      <rect x={59} y={57} width={13} height={4.5} rx={1} fill="#64748b" />
      <circle cx={52} cy={80} r={1.8} fill="#64748b" />
      {/* seats — dual passenger bench nearside, driver offside (RHD) */}
      <Seat x={22} y={74} w={26} squab={14} split />
      <Seat x={58} y={74} w={20} squab={14} />
      <SteeringWheel cx={68} cy={72} />
      {/* bulkhead */}
      <rect x={12} y={100} width={76} height={2.5} fill="#71717a" />
      {Array.from({ length: 12 }, (_, i) => 14 + i * 6.4).map((x) => (
        <line key={x} x1={x} y1={100} x2={x + 3} y2={102.5} stroke="#a1a1aa" strokeWidth={0.6} />
      ))}
      {/* load floor + ribs */}
      <rect x={14} y={104} width={72} height={84} rx={2} fill="#f8fafc" stroke="#d4d4d8" strokeWidth={1} />
      {[112, 120.5, 129, 137.5, 146, 154.5, 163, 171.5, 180].map((y) => (
        <line key={y} x1={16} y1={y} x2={84} y2={y} stroke="#e4e4e7" strokeWidth={1.4} />
      ))}
      {/* rear wheel-arch boxes */}
      <rect x={14} y={146} width={8} height={30} rx={2} fill="#d4d4d8" stroke="#94a3b8" strokeWidth={0.8} />
      <rect x={78} y={146} width={8} height={30} rx={2} fill="#d4d4d8" stroke="#94a3b8" strokeWidth={0.8} />
      {/* sliding door (nearside) + cab door handles */}
      <line x1={10.8} y1={106} x2={10.8} y2={144} stroke="#64748b" strokeWidth={1.6} />
      <rect x={13} y={108} width={2.5} height={7} rx={1} fill="#64748b" />
      <rect x={13} y={66} width={2.5} height={7} rx={1} fill="#64748b" />
      <rect x={84.5} y={66} width={2.5} height={7} rx={1} fill="#64748b" />
      {/* rear barn-door split + hinges */}
      <line x1={50} y1={187.5} x2={50} y2={193.5} stroke="#64748b" strokeWidth={1.2} />
      <circle cx={17} cy={190} r={1} fill="#64748b" />
      <circle cx={83} cy={190} r={1} fill="#64748b" />
    </g>
  );
}

/** Top-down schematic, nose-up. Component coords are % of a 100×200 canvas. */
function VehicleSchematic({
  vehicle,
  interactive,
  statusFor,
  onPickComponent,
  armedActionId,
}: {
  vehicle: CrsVehicle;
  interactive?: boolean;
  statusFor?: (actionId: string) => ActionStatus["state"];
  onPickComponent?: (c: CrsComponent) => void;
  armedActionId?: string | null;
}) {
  const van = vehicle.body === "van";
  return (
    <svg viewBox="0 0 100 200" className="w-full max-w-[220px] rounded-sm border border-zinc-300 bg-[#f4f4f5]">
      {van ? <VanBase id={vehicle.id} /> : <CarBase id={vehicle.id} />}

      {/* components */}
      {vehicle.components.map((c, i) => {
        const st = KIND_STYLE[c.kind];
        const cx = c.x;
        const cy = c.y;
        const aState = c.action && statusFor ? statusFor(c.action.id) : null;
        const clickable = !!onPickComponent && (interactive ? true : !c.action);
        const armed = !!c.action && armedActionId === c.action.id;

        let shape: React.ReactNode;
        if (c.kind === "airbag") {
          shape = <circle cx={cx} cy={cy} r={5.5} fill={st.fill} stroke={st.stroke} strokeWidth={1.5} />;
        } else if (c.kind === "curtain_airbag") {
          const h = c.h ?? 50;
          shape = (
            <rect x={cx - 2} y={cy - h / 2 + 20} width={4} height={h} rx={2} fill={st.fill} stroke={st.stroke} strokeWidth={1} />
          );
        } else if (c.kind === "reinforcement") {
          const w = c.w ?? 6;
          const h = c.h ?? 36;
          shape = (
            <g>
              <rect x={cx} y={cy} width={w} height={h} fill={st.fill} stroke={st.stroke} strokeWidth={1} />
              <line x1={cx} y1={cy + h * 0.33} x2={cx + w} y2={cy + h * 0.2} stroke="#fecaca" strokeWidth={1} />
              <line x1={cx} y1={cy + h * 0.66} x2={cx + w} y2={cy + h * 0.53} stroke="#fecaca" strokeWidth={1} />
            </g>
          );
        } else if (c.kind === "gas_strut") {
          shape = <rect x={cx - 1.5} y={cy - 8} width={3} height={16} rx={1.5} fill={st.fill} stroke={st.stroke} strokeWidth={1} />;
        } else if (c.kind === "pretensioner") {
          shape = (
            <rect x={cx - 4} y={cy - 4} width={8} height={8} rx={1.5} fill={st.fill} stroke={st.stroke} strokeWidth={1} />
          );
        } else {
          // labelled boxes: batteries, SRS, fuel tank
          const w = c.w ?? 16;
          const h = c.h ?? 11;
          shape = (
            <g>
              <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={2} fill={st.fill} stroke={st.stroke} strokeWidth={1.5} />
              {st.text && (
                <text
                  x={cx}
                  y={cy + 2.6}
                  textAnchor="middle"
                  fontFamily="ui-monospace, monospace"
                  fontSize={h >= 14 ? 7 : 6}
                  fontWeight={700}
                  fill={c.kind === "fuel_tank" ? "#ffffff" : "#111111"}
                >
                  {st.text}
                </text>
              )}
            </g>
          );
        }

        const badge = badgePos(c);
        return (
          <g
            key={i}
            onClick={clickable ? () => onPickComponent?.(c) : undefined}
            style={clickable ? { cursor: "pointer" } : undefined}
            opacity={aState === "done" ? 0.55 : 1}
          >
            {/* armed halo — the component the operator is tasking */}
            {armed && (
              <circle cx={badge.x - 4} cy={badge.y + 4} r={10} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 2" />
            )}
            {shape}
            {aState === "done" && (
              <g transform={`translate(${badge.x}, ${badge.y})`}>
                <circle r={4.5} fill="#16a34a" stroke="#ffffff" strokeWidth={1} />
                <path d="M -2 0 L -0.6 1.6 L 2.2 -1.8" fill="none" stroke="#ffffff" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )}
            {aState === "active" && (
              <circle cx={badge.x} cy={badge.y} r={4} fill="#f59e0b" stroke="#ffffff" strokeWidth={1}>
                <animate attributeName="opacity" values="1;0.25;1" dur="1.1s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}
