"use client";

// Interactive body diagram used in the treatment tab. Renders a stylised
// front-or-back humanoid silhouette, plots injury pins at anatomical
// regions driven by the casualty's red flags, and lets the operator
// click a region to filter interventions down to what's relevant there.

import { useState } from "react";
import type { PatientRedFlag } from "@/lib/sim/scene";
import {
  BODY_REGIONS,
  RED_FLAG_REGIONS,
  regionMeta,
  type BodyRegion,
  type BodyView,
} from "@/lib/sim/body_regions";

const RED_FLAG_LABEL: Record<PatientRedFlag, string> = {
  tension_pneumothorax: "Tension pneumothorax",
  hypovolaemic_shock: "Hypovolaemic shock",
  airway_compromise: "Airway compromise",
  head_injury_severe: "Severe head injury",
  spinal_injury_suspected: "Suspected spinal injury",
  cardiac_arrest: "Cardiac arrest",
  stemi: "STEMI",
  stroke_fast_positive: "Stroke · FAST +",
  anaphylaxis: "Anaphylaxis",
  severe_asthma: "Severe asthma",
  hypoglycaemia: "Hypoglycaemia",
  seizure_active: "Active seizure",
  major_haemorrhage: "Major haemorrhage",
  overdose_opioid: "Opioid overdose",
};

type Props = {
  revealed: PatientRedFlag[];
  active: PatientRedFlag[];
  selected: BodyRegion | null;
  onSelect: (r: BodyRegion | null) => void;
};

export function BodyDiagram({ revealed, active, selected, onSelect }: Props) {
  const [view, setView] = useState<BodyView>("front");

  // Aggregate flags by region so pins are unique per region.
  const flagsPerRegion = new Map<BodyRegion, { flag: PatientRedFlag; isActive: boolean }[]>();
  for (const f of revealed) {
    const regs = RED_FLAG_REGIONS[f] ?? [];
    const isActive = active.includes(f);
    for (const r of regs) {
      if (!flagsPerRegion.has(r)) flagsPerRegion.set(r, []);
      flagsPerRegion.get(r)!.push({ flag: f, isActive });
    }
  }
  const systemicFlags = flagsPerRegion.get("systemic") ?? [];
  const anySystemicActive = systemicFlags.some((f) => f.isActive);

  const visibleRegions = BODY_REGIONS.filter((r) =>
    view === "front" ? r.front : r.back,
  );

  const selectedFlags = selected ? flagsPerRegion.get(selected) ?? [] : null;

  return (
    <div className="flex flex-col gap-2">
      {/* View tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex overflow-hidden rounded-sm border border-(--color-border)">
          {(["front", "back"] as BodyView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={
                "px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors " +
                (view === v
                  ? "bg-(--color-amber)/15 text-(--color-amber)"
                  : "text-(--color-text-dim) hover:text-(--color-text)")
              }
            >
              {v}
            </button>
          ))}
        </div>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:text-(--color-critical)"
          >
            Clear region ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,180px)_minmax(0,1fr)] gap-3">
        {/* SVG body */}
        <div
          className={
            "relative rounded-sm border p-2 " +
            (anySystemicActive
              ? "border-(--color-critical)/60 bg-(--color-critical)/5"
              : "border-(--color-border) bg-(--color-bg)/40")
          }
          style={
            anySystemicActive
              ? { boxShadow: "inset 0 0 24px rgba(239,68,68,0.25)" }
              : undefined
          }
        >
          <svg
            viewBox="0 0 200 400"
            role="img"
            aria-label={`Body diagram · ${view}`}
            className="h-auto w-full"
          >
            <Silhouette view={view} />

            {/* Hotspots — larger transparent hit-targets under the pins,
                so clicking near a region still selects it. */}
            {visibleRegions.map((r) => {
              const pos = view === "front" ? r.front! : r.back!;
              const isSelected = selected === r.code;
              return (
                <g key={r.code}>
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={20}
                      fill="rgba(245,158,11,0.10)"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      strokeDasharray="3 2"
                    />
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={22}
                    fill="transparent"
                    onClick={() => onSelect(isSelected ? null : r.code)}
                    style={{ cursor: "pointer" }}
                  >
                    <title>{r.label}</title>
                  </circle>
                </g>
              );
            })}

            {/* Injury pins */}
            {visibleRegions.map((r) => {
              const flags = flagsPerRegion.get(r.code);
              if (!flags || flags.length === 0) return null;
              const isAnyActive = flags.some((f) => f.isActive);
              const pos = view === "front" ? r.front! : r.back!;
              return (
                <Pin
                  key={`pin-${r.code}`}
                  x={pos.x}
                  y={pos.y}
                  active={isAnyActive}
                  count={flags.length}
                />
              );
            })}
          </svg>
        </div>

        {/* Legend / selected region detail */}
        <div className="min-w-0 space-y-2">
          {selected ? (
            <div className="rounded-sm border border-(--color-amber)/40 bg-(--color-amber)/5 p-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
                  {regionMeta(selected)?.label ?? selected}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                  {selectedFlags?.length ?? 0} finding{(selectedFlags?.length ?? 0) === 1 ? "" : "s"}
                </span>
              </div>
              {selectedFlags && selectedFlags.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {selectedFlags.map((f) => (
                    <li
                      key={f.flag}
                      className={
                        "flex items-center gap-1.5 text-[11px] " +
                        (f.isActive
                          ? "text-(--color-critical)"
                          : "text-(--color-ok) line-through")
                      }
                    >
                      <span
                        className={
                          "inline-block h-1.5 w-1.5 rounded-full " +
                          (f.isActive
                            ? "bg-(--color-critical)"
                            : "bg-(--color-ok)")
                        }
                      />
                      {RED_FLAG_LABEL[f.flag]}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[11px] text-(--color-text-muted)">
                  Nothing flagged at this region. Actions below stay filtered
                  to interventions relevant here — clear to show all.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/40 p-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                Findings map
              </p>
              {revealed.length === 0 ? (
                <p className="mt-1 text-[11px] text-(--color-text-muted)">
                  No red flags surfaced yet. Run the primary survey to reveal
                  where injuries sit on the body.
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-(--color-text-muted)">
                  Click a pin (or a region) to focus the intervention list.
                </p>
              )}
              {systemicFlags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {systemicFlags.map((f) => (
                    <span
                      key={f.flag}
                      className={
                        "rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest " +
                        (f.isActive
                          ? "border-(--color-critical)/60 bg-(--color-critical)/10 text-(--color-critical)"
                          : "border-(--color-ok)/50 bg-(--color-ok)/10 text-(--color-ok) line-through")
                      }
                    >
                      {RED_FLAG_LABEL[f.flag]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Regions summary — small list of every non-empty region so the
              operator can jump straight there from a text row. */}
          {revealed.length > 0 && (
            <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/40 p-2">
              <p className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                Regions
              </p>
              <ul className="mt-1 space-y-0.5">
                {Array.from(flagsPerRegion.entries())
                  .filter(([r]) => r !== "systemic")
                  .map(([r, fs]) => {
                    const anyActive = fs.some((f) => f.isActive);
                    return (
                      <li key={r}>
                        <button
                          type="button"
                          onClick={() => onSelect(selected === r ? null : r)}
                          className={
                            "flex w-full items-center justify-between rounded-sm px-1.5 py-0.5 text-left font-mono text-[10px] transition-colors " +
                            (selected === r
                              ? "bg-(--color-amber)/10 text-(--color-amber)"
                              : anyActive
                                ? "text-(--color-critical) hover:bg-(--color-critical)/5"
                                : "text-(--color-ok) hover:bg-(--color-ok)/5")
                          }
                        >
                          <span className="uppercase tracking-widest">
                            {regionMeta(r)?.label ?? r}
                          </span>
                          <span>{fs.length}</span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Silhouette — deliberately stylised. Simple head/neck/torso/limbs. Both
// views share the same outline; the back view mirrors arm/leg labels but
// the visual shape is symmetrical.
// ---------------------------------------------------------------------------

function Silhouette({ view }: { view: BodyView }) {
  const fill = "rgba(148, 163, 184, 0.18)";
  const stroke = "rgba(148, 163, 184, 0.55)";
  return (
    <g fill={fill} stroke={stroke} strokeWidth={1}>
      {/* Head */}
      <ellipse cx={100} cy={46} rx={22} ry={26} />
      {/* Neck */}
      <rect x={90} y={70} width={20} height={14} rx={3} />
      {/* Torso */}
      <path
        d="M 65 90 Q 60 105 66 130 L 66 195 Q 64 220 74 244 L 126 244 Q 136 220 134 195 L 134 130 Q 140 105 135 90 Z"
      />
      {/* Left arm (viewer's left) */}
      <path d="M 66 90 Q 45 100 42 140 L 40 205 Q 40 220 48 220 Q 55 220 58 205 L 65 145 Q 66 118 66 100 Z" />
      {/* Right arm */}
      <path d="M 134 90 Q 155 100 158 140 L 160 205 Q 160 220 152 220 Q 145 220 142 205 L 135 145 Q 134 118 134 100 Z" />
      {/* Left leg (viewer's left = patient's right in front view, but the
          visual is symmetrical either way) */}
      <path d="M 74 244 Q 68 300 76 360 Q 78 380 88 380 Q 96 380 96 360 L 98 300 Q 99 270 96 244 Z" />
      {/* Right leg */}
      <path d="M 126 244 Q 132 300 124 360 Q 122 380 112 380 Q 104 380 104 360 L 102 300 Q 101 270 104 244 Z" />
      {/* Subtle back-view centre line */}
      {view === "back" && (
        <line
          x1={100}
          y1={90}
          x2={100}
          y2={240}
          stroke="rgba(148,163,184,0.3)"
          strokeDasharray="2 3"
          strokeWidth={0.8}
          fill="none"
        />
      )}
    </g>
  );
}

function Pin({
  x,
  y,
  active,
  count,
}: {
  x: number;
  y: number;
  active: boolean;
  count: number;
}) {
  const colour = active ? "#ef4444" : "#10b981";
  return (
    <g style={{ pointerEvents: "none" }}>
      {active && (
        <circle cx={x} cy={y} r={9}>
          <animate
            attributeName="r"
            values="6;14;6"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.6;0;0.6"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="fill"
            values={`${colour};${colour}`}
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      <circle
        cx={x}
        cy={y}
        r={6}
        fill={colour}
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={0.8}
      />
      {count > 1 && (
        <text
          x={x}
          y={y + 3}
          textAnchor="middle"
          fontSize={9}
          fontFamily="ui-monospace, monospace"
          fontWeight={700}
          fill="#000"
        >
          {count}
        </text>
      )}
    </g>
  );
}
