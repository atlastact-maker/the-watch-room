"use client";

// The attendance as a checklist: the slots this job's PDA calls for,
// which are covered, which are still empty — and the mobilising
// system's proposal for the empty ones, nearest available unit per
// slot, accepted in one action or one slot at a time. Sits at the top
// of the deployment board, because it is the first thing a control
// room does with a new job.

import { useMemo, useState } from "react";
import type { Deployment, Incident } from "@/lib/sim/incident_types";
import { pdaFillState, proposePda, STANDARD_PDA } from "@/lib/sim/pda";
import type { StationWithAppliances } from "../page";
import type { DeployArgs, Eta } from "./deployment-board";

export function PdaChecklist({
  incident,
  stations,
  etas,
  deployments,
  onDeploy,
}: {
  incident: Incident;
  stations: StationWithAppliances[];
  etas: Record<string, Eta>;
  deployments: Deployment[];
  onDeploy: (args: DeployArgs) => void;
}) {
  const [showProposal, setShowProposal] = useState(false);
  // Which attendance the checklist is measured against: the job's own
  // authored slots, or the standard for its incident type — the sourced
  // one, where a source exists.
  const [mode, setMode] = useState<"scenario" | "standard">("scenario");
  const [showBasis, setShowBasis] = useState(false);
  const standard = STANDARD_PDA[incident.scenario.type];
  const slots = mode === "standard" && standard ? standard.slots : incident.scenario.pda;

  const { fills, extras } = useMemo(
    () => pdaFillState(incident, deployments, stations, slots),
    [incident, deployments, stations, slots],
  );
  const empty = fills.filter((f) => !f.applianceId).length;
  const proposal = useMemo(
    () => (showProposal ? proposePda(incident, deployments, stations, etas, slots) : null),
    [showProposal, incident, deployments, stations, etas, slots],
  );

  function accept(p: NonNullable<typeof proposal>["proposals"][number]) {
    onDeploy({
      applianceId: p.applianceId,
      slotId: p.slot.id,
      etaSeconds: p.etaSeconds,
      routeMeters: p.routeMeters,
      routeCoords: p.routeCoords,
    });
  }

  if (fills.length === 0) return null;

  return (
    <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface-raised)/40">
      <div className="flex items-center justify-between gap-2 border-b border-(--color-border-subtle) px-2 py-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-(--color-amber)">
            Pre-determined attendance
          </span>
          <span className="font-mono text-[10px] tabular-nums text-(--color-text-dim)">
            {fills.length - empty}/{fills.length}
          </span>
          {standard && standard.source !== "scenario" && (
            <span className="inline-flex overflow-hidden rounded-sm border border-(--color-border)">
              <button
                type="button"
                onClick={() => setMode("scenario")}
                className={
                  "px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest transition-colors " +
                  (mode === "scenario" ? "bg-[#b45309] text-white" : "text-(--color-text-dim) hover:text-(--color-text)")
                }
                title="The attendance authored for this job"
              >
                Job
              </button>
              <button
                type="button"
                onClick={() => setMode("standard")}
                className={
                  "px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest transition-colors " +
                  (mode === "standard" ? "bg-[#b45309] text-white" : "text-(--color-text-dim) hover:text-(--color-text)")
                }
                title={`The standard attendance for ${standard.label} — ${standard.source}`}
              >
                Standard · {standard.source}
              </button>
            </span>
          )}
          {mode === "standard" && standard && (
            <button
              type="button"
              onClick={() => setShowBasis((v) => !v)}
              className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim) underline-offset-2 hover:underline"
            >
              {showBasis ? "hide sources" : "sources"}
            </button>
          )}
        </div>
        {empty > 0 && (
          <button
            type="button"
            onClick={() => setShowProposal((v) => !v)}
            className={
              "rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest transition-colors " +
              (showProposal
                ? "border-(--color-amber) bg-(--color-amber)/15 text-(--color-amber)"
                : "border-(--color-border) text-(--color-text-dim) hover:border-(--color-amber) hover:text-(--color-amber)")
            }
          >
            {showProposal ? "Hide proposal" : "Propose attendance"}
          </button>
        )}
      </div>

      {mode === "standard" && standard && showBasis && (
        <ul className="space-y-1 border-b border-(--color-border-subtle) bg-(--color-bg) px-2 py-1.5 text-[10px] leading-snug text-(--color-text-dim)">
          {standard.basis.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
          {standard.note && <li className="text-(--color-amber)">{standard.note}</li>}
          <li className="text-(--color-text-dim)/70">Full tables: data/research/fire/pda.md</li>
        </ul>
      )}
      <ul className="divide-y divide-(--color-border-subtle)/60">
        {fills.map((f) => {
          const p = proposal?.proposals.find((x) => x.slot.id === f.slot.id);
          return (
            <li key={f.slot.id} className="flex items-center gap-2 px-2 py-1 text-xs">
              <span
                aria-hidden
                className={
                  "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border text-[10px] leading-none " +
                  (f.applianceId
                    ? "border-(--color-ok) bg-(--color-ok)/15 text-(--color-ok)"
                    : "border-(--color-border) text-transparent")
                }
              >
                ✓
              </span>
              <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                {f.slot.label}
              </span>
              {f.applianceId ? (
                <span className="min-w-0 flex-1 truncate font-mono text-(--color-text)" title={f.slot.notes}>
                  {f.callsign}
                </span>
              ) : p ? (
                <>
                  <span className="min-w-0 flex-1 truncate text-(--color-text)" title={f.slot.notes}>
                    <span className="font-mono">{p.callsign}</span>
                    <span className="text-(--color-text-dim)">
                      {" "}· {p.stationName} · {Math.max(1, Math.round(p.etaSeconds / 60))} min
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => accept(p)}
                    className="shrink-0 rounded-sm border border-(--color-amber)/60 bg-(--color-amber)/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/20"
                  >
                    Send
                  </button>
                </>
              ) : (
                <span className="min-w-0 flex-1 truncate text-(--color-text-dim)" title={f.slot.notes}>
                  {f.slot.requiredApplianceTypes.join(" / ")}
                  {proposal && proposal.uncovered.some((u) => u.id === f.slot.id) && (
                    <span className="text-(--color-critical)"> · none available</span>
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {(extras.length > 0 || (proposal && proposal.proposals.length > 1)) && (
        <div className="flex items-center justify-between gap-2 border-t border-(--color-border-subtle) px-2 py-1">
          <span className="truncate font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
            {extras.length > 0 ? `Over and above: ${extras.join(", ")}` : ""}
          </span>
          {proposal && proposal.proposals.length > 1 && (
            <button
              type="button"
              onClick={() => {
                for (const p of proposal.proposals) accept(p);
                setShowProposal(false);
              }}
              className="shrink-0 rounded-sm border border-(--color-amber) bg-(--color-amber) px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white hover:brightness-110"
            >
              Send all {proposal.proposals.length}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
