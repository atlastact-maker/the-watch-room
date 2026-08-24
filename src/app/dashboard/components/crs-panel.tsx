"use client";

// Crash Recovery System panel — the MDT's CRS tab for vehicle-based
// incidents. Mirrors the datasheet style crews actually use: a top-down
// vehicle schematic with safety-critical components highlighted, a
// colour legend, and the cutting/isolation guidance beside it. Light
// CAD styling to match the tablet's other information tabs.

import { useState } from "react";
import type { CrsComponent, CrsVehicle } from "@/lib/sim/incident_types";

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

export function CrsPanel({ vehicles }: { vehicles: CrsVehicle[] }) {
  const [idx, setIdx] = useState(0);
  const v = vehicles[Math.min(idx, vehicles.length - 1)];
  if (!v) return null;
  const fuel = FUEL_LABEL[v.fuel];
  const usedKinds = [...new Set(v.components.map((c) => c.kind))];

  return (
    <div>
      {/* Vehicle selector */}
      {vehicles.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {vehicles.map((veh, i) => (
            <button
              key={veh.id}
              type="button"
              onClick={() => setIdx(i)}
              className={
                "rounded-sm border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors " +
                (i === idx
                  ? "border-amber-500 bg-[#fde047] text-black"
                  : "border-zinc-400 bg-white text-zinc-600 hover:bg-zinc-100")
              }
            >
              {veh.make} {veh.model.split(" ")[0]} · {veh.vrm}
            </button>
          ))}
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
        </div>

        <div className="grid gap-3 p-3 sm:grid-cols-[220px_1fr]">
          {/* Schematic */}
          <div>
            <VehicleSchematic vehicle={v} />
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
          </div>

          {/* Guidance */}
          <div>
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
  );
}

/** Top-down schematic, nose-up. Component coords are % of a 100×200 canvas. */
function VehicleSchematic({ vehicle }: { vehicle: CrsVehicle }) {
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
        if (c.kind === "airbag") {
          return <circle key={i} cx={cx} cy={cy} r={5.5} fill={st.fill} stroke={st.stroke} strokeWidth={1.5} />;
        }
        if (c.kind === "curtain_airbag") {
          const h = c.h ?? 50;
          return (
            <rect key={i} x={cx - 2} y={cy - h / 2 + 20} width={4} height={h} rx={2} fill={st.fill} stroke={st.stroke} strokeWidth={1} />
          );
        }
        if (c.kind === "reinforcement") {
          const w = c.w ?? 6;
          const h = c.h ?? 36;
          return (
            <g key={i}>
              <rect x={cx} y={cy} width={w} height={h} fill={st.fill} stroke={st.stroke} strokeWidth={1} />
              <line x1={cx} y1={cy + h * 0.33} x2={cx + w} y2={cy + h * 0.2} stroke="#fecaca" strokeWidth={1} />
              <line x1={cx} y1={cy + h * 0.66} x2={cx + w} y2={cy + h * 0.53} stroke="#fecaca" strokeWidth={1} />
            </g>
          );
        }
        if (c.kind === "gas_strut") {
          return <rect key={i} x={cx - 1.5} y={cy - 8} width={3} height={16} rx={1.5} fill={st.fill} stroke={st.stroke} strokeWidth={1} />;
        }
        if (c.kind === "pretensioner") {
          return (
            <g key={i}>
              <rect x={cx - 4} y={cy - 4} width={8} height={8} rx={1.5} fill={st.fill} stroke={st.stroke} strokeWidth={1} />
            </g>
          );
        }
        // labelled boxes: batteries, SRS, fuel tank
        const w = c.w ?? 16;
        const h = c.h ?? 11;
        return (
          <g key={i}>
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
      })}
    </svg>
  );
}
