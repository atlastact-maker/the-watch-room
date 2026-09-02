"use client";

import { useState } from "react";
import { Rnd } from "react-rnd";
import { CAD_VARS } from "./cad-theme";
import { CAPABILITIES_BY_TYPE } from "@/lib/sim/incident_types";
import { lookupKit } from "@/lib/sim/kit_catalog";
import type { Appliance, CrewMember } from "@/lib/sim/types";

type Props = {
  appliance: Appliance;
  onClose: () => void;
  onRefuel: (applianceId: string) => void;
  onRefillWater: (applianceId: string) => void;
  onSendToMaintenance: (applianceId: string) => void;
  onStandDownForWelfare: (applianceId: string) => void;
};

export function DraggableVehiclePanel({
  appliance,
  onClose,
  onRefuel,
  onRefillWater,
  onSendToMaintenance,
  onStandDownForWelfare,
}: Props) {
  return (
    <Rnd
      default={{
        x: typeof window !== "undefined" ? window.innerWidth / 2 - 280 : 300,
        y: 100,
        width: 560,
        height: typeof window !== "undefined" ? Math.min(720, window.innerHeight - 140) : 620,
      }}
      minWidth={380}
      minHeight={360}
      bounds="window"
      dragHandleClassName="drag-handle"
      className="z-[1100]"
    >
      {/* Same CAD chassis as the rest of the suite. Blue header — this is
          a vehicle record, the CAD's other reference view alongside the
          call stack. The VRM sits in its own block the way a real record
          card carries a plate. */}
      <div
        style={CAD_VARS}
        className="flex h-full w-full flex-col overflow-hidden rounded-sm border-2 border-zinc-500 bg-(--color-bg) text-(--color-text) shadow-2xl shadow-black/60"
      >
        <div className="drag-handle flex cursor-move items-stretch justify-between bg-[#1d4ed8] font-mono text-[11px] font-bold text-white">
          <div className="flex min-w-0 items-center gap-2 px-3 py-1 tracking-[0.15em]">
            <span className="truncate uppercase">Vehicle · {appliance.callsign}</span>
            <span className="shrink-0 bg-black/25 px-1.5 text-[10px] tracking-[0.1em]">
              {appliance.vrm}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex shrink-0 items-center bg-[#1e40af] px-3 transition-colors hover:bg-[#dc2626]"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
            {appliance.service} · {appliance.stationId}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            {appliance.make} <span className="text-(--color-text-muted)">{appliance.model}</span>
          </h1>
          <p className="mt-1 font-mono text-sm text-(--color-info)">
            {appliance.vrm} · {appliance.typeName}
          </p>

          <section className="mt-6 grid gap-3">
            <Gauge label="Fuel" pct={appliance.fuelPct} colour="amber" />
            {appliance.waterLitres > 0 && (
              <Gauge
                label={`Water (${appliance.waterLitres.toLocaleString()} L max)`}
                pct={appliance.waterPct}
                colour="info"
              />
            )}
            <Gauge label="Condition" pct={appliance.conditionPct} colour="ok" />
          </section>

          <section className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ActionButton
              label="Refuel"
              disabled={appliance.fuelPct >= 100}
              onClick={() => onRefuel(appliance.id)}
            />
            {appliance.waterLitres > 0 && (
              <ActionButton
                label="Refill water"
                disabled={appliance.waterPct >= 100}
                onClick={() => onRefillWater(appliance.id)}
              />
            )}
            <ActionButton
              label="Maintenance"
              tone="critical"
              onClick={() => onSendToMaintenance(appliance.id)}
            />
            <ActionButton
              label="Welfare break"
              tone="info"
              onClick={() => onStandDownForWelfare(appliance.id)}
            />
          </section>

          <section className="mt-6">
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber-dim)">
              Crew · {appliance.crewMembers.length}/{appliance.crew.min}
              {appliance.crew.max > appliance.crew.min && `–${appliance.crew.max}`}
            </h2>
            {appliance.crewMembers.length === 0 ? (
              <div className="mt-2 rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/40 px-3 py-3 text-xs text-(--color-text-dim)">
                Not crewed directly by this service.
              </div>
            ) : (
              <ul className="mt-2 grid gap-1.5">
                {appliance.crewMembers.map((c) => (
                  <CrewRow key={c.id} member={c} />
                ))}
              </ul>
            )}
          </section>

          <section className="mt-6">
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber-dim)">
              Capabilities
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(CAPABILITIES_BY_TYPE[appliance.type] ?? []).map((c) => (
                <span
                  key={c}
                  className="rounded-sm border border-(--color-amber)/40 bg-(--color-amber)/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)"
                >
                  {c}
                </span>
              ))}
              {(CAPABILITIES_BY_TYPE[appliance.type] ?? []).length === 0 && (
                <span className="text-xs text-(--color-text-dim)">
                  No specialist capability tags.
                </span>
              )}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber-dim)">
              Equipment on board · click for detail
            </h2>
            <ul className="mt-2 grid gap-1.5">
              {appliance.kit.map((k) => (
                <KitItem key={k} name={k} />
              ))}
              {appliance.kit.length === 0 && (
                <li className="text-xs text-(--color-text-dim)">No equipment recorded.</li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </Rnd>
  );
}

function Gauge({
  label,
  pct,
  colour,
}: {
  label: string;
  pct: number;
  colour: "amber" | "info" | "ok";
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const fill =
    colour === "amber"
      ? "bg-(--color-amber)"
      : colour === "info"
        ? "bg-(--color-info)"
        : "bg-(--color-ok)";
  const textTone = pct < 25 ? "text-(--color-critical)" : "text-(--color-text)";
  return (
    <div>
      <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
        <span>{label}</span>
        <span className={textTone}>{Math.round(clamped)}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-sm border border-(--color-border-subtle) bg-(--color-bg)">
        <div className={`h-full ${fill}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "critical" | "info";
}) {
  const base =
    "rounded-sm border px-2 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const toneCls =
    tone === "critical"
      ? "border-(--color-border) text-(--color-text) hover:border-(--color-critical) hover:text-(--color-critical)"
      : tone === "info"
        ? "border-(--color-border) text-(--color-text) hover:border-(--color-info) hover:text-(--color-info)"
        : "border-(--color-amber)/50 bg-(--color-amber)/10 text-(--color-amber) hover:bg-(--color-amber)/20";
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`${base} ${toneCls}`}>
      {label}
    </button>
  );
}

function CrewRow({ member }: { member: CrewMember }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface-raised)">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-(--color-bg)"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-(--color-text)">{member.name}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
            {member.role}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
          {member.yearsService}y · {open ? "Hide ▾" : "Detail ▸"}
        </span>
      </button>
      {open && (
        <div className="border-t border-(--color-border-subtle) px-3 py-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber-dim)">
            Training & qualifications
          </p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {member.quals.map((q) => (
              <li
                key={q}
                className="rounded-sm border border-(--color-border-subtle) bg-(--color-bg) px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text)"
              >
                {q}
              </li>
            ))}
          </ul>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
            {member.yearsService} years service
          </p>
        </div>
      )}
    </li>
  );
}

function KitItem({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const info = lookupKit(name);
  return (
    <li className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface-raised)">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-(--color-bg)"
      >
        <span className="text-sm">{name}</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
          {info ? (open ? "Hide ▾" : "Detail ▸") : "No detail"}
        </span>
      </button>
      {open && info && (
        <div className="border-t border-(--color-border-subtle) px-3 py-3">
          <p className="text-xs text-(--color-text)">{info.description}</p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-(--color-amber-dim)">
            Use
          </p>
          <p className="mt-1 text-xs text-(--color-text-muted)">{info.use}</p>
        </div>
      )}
    </li>
  );
}
