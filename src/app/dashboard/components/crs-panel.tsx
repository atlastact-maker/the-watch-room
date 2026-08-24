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
      {/* wheels */}
      {[
        [6, van ? 42 : 38],
        [82, van ? 42 : 38],
        [6, van ? 150 : 148],
        [82, van ? 150 : 148],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={12} height={26} rx={4} fill="#3f3f46" />
      ))}
      {/* body */}
      <rect x={12} y={8} width={76} height={184} rx={van ? 8 : 14} fill="#ffffff" stroke="#52525b" strokeWidth={2} />
      {/* bonnet line + windscreen */}
      {van ? (
        <>
          <line x1={12} y1={30} x2={88} y2={30} stroke="#a1a1aa" strokeWidth={1.5} />
          <path d="M16 32 L84 32 L80 52 L20 52 Z" fill="#bfdbfe" stroke="#60a5fa" strokeWidth={1} />
          {/* bulkhead + load area */}
          <line x1={12} y1={100} x2={88} y2={100} stroke="#71717a" strokeWidth={2} strokeDasharray="4 3" />
          <rect x={18} y={106} width={64} height={80} fill="none" stroke="#d4d4d8" strokeWidth={1.5} />
        </>
      ) : (
        <>
          <line x1={14} y1={44} x2={86} y2={44} stroke="#a1a1aa" strokeWidth={1.5} />
          <path d="M18 48 L82 48 L76 66 L24 66 Z" fill="#bfdbfe" stroke="#60a5fa" strokeWidth={1} />
          <path d="M22 148 L78 148 L74 162 L26 162 Z" fill="#bfdbfe" stroke="#60a5fa" strokeWidth={1} />
          {/* roof */}
          <rect x={24} y={70} width={52} height={74} rx={6} fill="none" stroke="#d4d4d8" strokeWidth={1.5} />
        </>
      )}
      {/* nose marker */}
      <path d="M46 12 L50 4 L54 12 Z" fill="#52525b" />

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
