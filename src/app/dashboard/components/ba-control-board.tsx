"use client";

import { useMemo, useState } from "react";
import type { Appliance } from "@/lib/sim/types";
import type { Task } from "@/lib/sim/incident_types";
import { baWorkingDurationMin } from "@/lib/sim/incident_types";

/**
 * Dräger-style BA Entry Control Board.
 *
 * Rendered when the operator has one or more active `ba_sar` tasks on the
 * selected appliance. Mirrors the physical board kept at the entry point of
 * every UK fire incident: yellow tallies (one per wearer) showing name +
 * starting pressure + time of entry, a traffic-light status indicator, a
 * live pressure gauge, a Time-of-Whistle column and a remarks column the
 * operator can type free-text into.
 *
 * Intentionally decoupled from the Actions tab layout — caller embeds this
 * inside a toggleable panel. See `bottom-action-menu.tsx::ActionsTab`.
 */
export function BaControlBoard({
  appliance,
  baTasks,
  now,
  onUpdateRemarks,
  onUpdateEntryPoint,
  onWithdrawTeam,
}: {
  appliance: Appliance;
  /** All active ba_sar tasks on this appliance. Usually 1, but multi-team
   *  committals are valid — the board shows one section per team. */
  baTasks: Task[];
  now: number;
  onUpdateRemarks?: (taskId: string, text: string) => void;
  onUpdateEntryPoint?: (taskId: string, label: string) => void;
  onWithdrawTeam?: (taskId: string) => void;
}) {
  if (baTasks.length === 0) return null;

  return (
    <div className="rounded-sm border border-(--color-amber) bg-(--color-surface-raised)/70 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
            BA entry control board
          </div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
            Dräger-style · live pressure + TOW
          </div>
        </div>
        <DurationTable />
      </div>

      <div className="space-y-3">
        {baTasks.map((task, i) => (
          <BoardSection
            key={task.id}
            appliance={appliance}
            task={task}
            teamNumber={i + 1}
            now={now}
            onUpdateRemarks={onUpdateRemarks}
            onUpdateEntryPoint={onUpdateEntryPoint}
            onWithdrawTeam={onWithdrawTeam}
          />
        ))}
      </div>
    </div>
  );
}

function BoardSection({
  appliance,
  task,
  teamNumber,
  now,
  onUpdateRemarks,
  onUpdateEntryPoint,
  onWithdrawTeam,
}: {
  appliance: Appliance;
  task: Task;
  teamNumber: number;
  now: number;
  onUpdateRemarks?: (taskId: string, text: string) => void;
  onUpdateEntryPoint?: (taskId: string, label: string) => void;
  onWithdrawTeam?: (taskId: string) => void;
}) {
  const crewIds = task.baCrewIds ?? [];
  const eco = appliance.crewMembers.find((m) => m.id === task.entryControlOfficerId);
  const wearers = useMemo(
    () =>
      crewIds
        .map((id) => appliance.crewMembers.find((m) => m.id === id))
        .filter((m): m is Appliance["crewMembers"][number] => Boolean(m)),
    [crewIds, appliance.crewMembers],
  );

  return (
    <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface)/60 p-2">
      {/* Header strip */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-2">
        <EntryPointField
          value={task.entryPoint}
          onChange={(v) => onUpdateEntryPoint?.(task.id, v)}
        />
        <div className="rounded-sm border border-(--color-border) bg-(--color-surface-raised) px-2 py-1">
          <div className="font-mono text-[8px] uppercase tracking-widest text-(--color-text-dim)">
            Team / Appliance
          </div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-(--color-text)">
            Team {teamNumber} · {appliance.callsign}
          </div>
        </div>
        <div className="rounded-sm border border-(--color-border) bg-(--color-surface-raised) px-2 py-1">
          <div className="font-mono text-[8px] uppercase tracking-widest text-(--color-text-dim)">
            Entry Control Officer
          </div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-(--color-text)">
            {eco?.name ?? "—"}
          </div>
        </div>
      </div>

      {/* Column headings */}
      <div className="mt-2 grid grid-cols-[28px_148px_1fr_88px_72px_1fr_56px] items-center gap-2 border-b border-(--color-border-subtle) pb-1 font-mono text-[8px] uppercase tracking-widest text-(--color-text-dim)">
        <span>St</span>
        <span>Tally</span>
        <span>Pressure</span>
        <span>Entry</span>
        <span>Whistle</span>
        <span>Location / remarks</span>
        <span className="text-right">Action</span>
      </div>

      <div className="divide-y divide-(--color-border-subtle)">
        {wearers.map((m, idx) => {
          const startBar = task.baStartPressure?.[m.id] ?? 300;
          const curBar = task.baPressure?.[m.id] ?? startBar;
          const entryAt = task.baEntryAt?.[m.id] ?? task.startedAt;
          const whistleAt = task.baWhistleAt?.[m.id] ?? entryAt + baWorkingDurationMin(startBar) * 60_000;
          const status = statusFor(curBar, whistleAt, now);
          return (
            <WearerRow
              key={m.id}
              slot={idx + 1}
              name={m.name}
              callsign={appliance.callsign}
              startBar={startBar}
              curBar={curBar}
              entryAt={entryAt}
              whistleAt={whistleAt}
              now={now}
              status={status}
            />
          );
        })}
      </div>

      {/* Remarks + withdraw footer */}
      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
        <RemarksField
          value={task.baRemarks}
          onChange={(v) => onUpdateRemarks?.(task.id, v)}
        />
        {onWithdrawTeam && (
          <button
            type="button"
            onClick={() => onWithdrawTeam(task.id)}
            className="self-stretch rounded-sm border border-(--color-critical)/60 bg-(--color-critical)/10 px-3 font-mono text-[10px] uppercase tracking-widest text-(--color-critical) hover:bg-(--color-critical)/20"
          >
            Withdraw team
          </button>
        )}
      </div>
    </div>
  );
}

function WearerRow({
  slot,
  name,
  callsign,
  startBar,
  curBar,
  entryAt,
  whistleAt,
  now,
  status,
}: {
  slot: number;
  name: string;
  callsign: string;
  startBar: number;
  curBar: number;
  entryAt: number;
  whistleAt: number;
  now: number;
  status: "ok" | "amber" | "red" | "overdue";
}) {
  const msToWhistle = whistleAt - now;
  const tone =
    status === "overdue"
      ? "text-(--color-critical)"
      : status === "red"
        ? "text-(--color-critical)"
        : status === "amber"
          ? "text-(--color-amber)"
          : "text-(--color-text)";

  return (
    <div className="grid grid-cols-[28px_148px_1fr_88px_72px_1fr_56px] items-center gap-2 py-1.5">
      <StatusLight status={status} slot={slot} />

      {/* Yellow tally card — name, callsign, starting pressure, time of entry */}
      <div className="rounded-[2px] border border-amber-700 bg-amber-300 px-1.5 py-0.5 text-amber-950 shadow-inner">
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest">
          <span>{callsign}</span>
          <span>{Math.round(startBar)}</span>
        </div>
        <div className="font-mono text-[10px] font-semibold leading-tight">{name}</div>
        <div className="font-mono text-[8px] uppercase tracking-widest opacity-70">
          entry {fmtClock(entryAt)}
        </div>
      </div>

      {/* Live pressure bar + gauge */}
      <PressureGauge startBar={startBar} curBar={curBar} />

      <span className="font-mono text-[11px] text-(--color-text)">{fmtClock(entryAt)}</span>

      <span className={`font-mono text-[11px] ${tone}`}>
        {msToWhistle > 0 ? fmtMs(msToWhistle) : "NOW"}
      </span>

      <span className="font-mono text-[10px] text-(--color-text-muted)">
        {status === "overdue"
          ? "PAST TOW — initiate rescue"
          : status === "red"
            ? "LOW PRESSURE — recall"
            : status === "amber"
              ? "Monitor"
              : "Working"}
      </span>

      <span className={`text-right font-mono text-[9px] uppercase tracking-widest ${tone}`}>
        {status === "overdue" || status === "red" ? "RECALL" : "OK"}
      </span>
    </div>
  );
}

function PressureGauge({ startBar, curBar }: { startBar: number; curBar: number }) {
  const pct = Math.max(0, Math.min(100, (curBar / startBar) * 100));
  const tone =
    curBar < 60
      ? "bg-(--color-critical)"
      : curBar < 90
        ? "bg-(--color-amber)"
        : "bg-(--color-ok)";
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-2 flex-1 overflow-hidden rounded-sm border border-(--color-border) bg-(--color-surface)">
        <div
          className={`absolute inset-y-0 left-0 ${tone}`}
          style={{ width: `${pct}%`, transition: "width 1s linear" }}
        />
        <div
          className="absolute inset-y-0 border-r border-(--color-amber)/70"
          style={{ left: "30%" }}
          title="Amber threshold (90 bar)"
        />
        <div
          className="absolute inset-y-0 border-r border-(--color-critical)/70"
          style={{ left: "20%" }}
          title="Red threshold (60 bar)"
        />
      </div>
      <span className="w-14 text-right font-mono text-[12px] tabular-nums text-(--color-text)">
        {Math.round(curBar)} <span className="text-[9px] text-(--color-text-dim)">bar</span>
      </span>
    </div>
  );
}

function StatusLight({
  status,
  slot,
}: {
  status: "ok" | "amber" | "red" | "overdue";
  slot: number;
}) {
  const colour =
    status === "ok"
      ? "bg-(--color-ok)"
      : status === "amber"
        ? "bg-(--color-amber)"
        : "bg-(--color-critical)";
  const pulse = status === "overdue" ? "animate-pulse" : "";
  return (
    <div className="flex flex-col items-center">
      <div className={`h-2.5 w-2.5 rounded-full ${colour} ${pulse}`} aria-hidden />
      <div className="font-mono text-[8px] text-(--color-text-dim)">{slot}</div>
    </div>
  );
}

function EntryPointField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(value ?? "");
  return (
    <label className="block rounded-sm border border-(--color-border) bg-(--color-surface-raised) px-2 py-1">
      <div className="font-mono text-[8px] uppercase tracking-widest text-(--color-text-dim)">
        Entry point
      </div>
      <input
        type="text"
        value={local}
        placeholder="EP1 / Front door"
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onChange(local)}
        className="w-full bg-transparent font-mono text-[11px] uppercase tracking-widest text-(--color-text) outline-none placeholder:text-(--color-text-dim)"
      />
    </label>
  );
}

function RemarksField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(value ?? "");
  return (
    <label className="block rounded-sm border border-(--color-border) bg-(--color-surface-raised) px-2 py-1">
      <div className="font-mono text-[8px] uppercase tracking-widest text-(--color-text-dim)">
        Location / remarks
      </div>
      <input
        type="text"
        value={local}
        placeholder="Laying guideline · right-hand lay · …"
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onChange(local)}
        className="w-full bg-transparent font-mono text-[11px] text-(--color-text) outline-none placeholder:text-(--color-text-dim)"
      />
    </label>
  );
}

function DurationTable() {
  // Compact version of the yellow "Working Duration" card on the real board.
  const rows: [number, number][] = [
    [300, 35],
    [200, 30],
    [190, 28],
    [180, 28],
    [170, 26],
    [160, 26],
  ];
  return (
    <div className="rounded-sm border border-(--color-amber)/60 bg-(--color-amber)/10 px-2 py-1">
      <div className="font-mono text-[8px] uppercase tracking-widest text-(--color-amber)">
        Working duration
      </div>
      <div className="mt-0.5 grid grid-cols-[auto_auto] gap-x-3 font-mono text-[9px] leading-tight text-(--color-text-muted)">
        <span className="text-(--color-text-dim)">Bar</span>
        <span className="text-(--color-text-dim)">Min</span>
        {rows.map(([b, m]) => (
          <span key={b} className="contents">
            <span>{b}</span>
            <span>{m}</span>
          </span>
        ))}
      </div>
      <div className="mt-0.5 font-mono text-[8px] uppercase tracking-widest text-(--color-amber)">
        Hard work reduces duration
      </div>
    </div>
  );
}

function statusFor(
  curBar: number,
  whistleAt: number,
  now: number,
): "ok" | "amber" | "red" | "overdue" {
  if (now >= whistleAt) return "overdue";
  if (curBar < 60) return "red";
  if (curBar < 90 || whistleAt - now < 3 * 60_000) return "amber";
  return "ok";
}

function fmtClock(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtMs(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
