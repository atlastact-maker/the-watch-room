"use client";

// Pre-arrival instructions — opened by clicking an en-route mover on the
// main dispatch map (outside ground view). Lets the operator transmit
// orders the crew will action the moment they book in attendance:
//
//   Fire (BA-capable):  pre-commit BA wearers so they rig en route
//   Ambulance/medical:  pre-pair to a known casualty
//
// Everything here drives the same deployment state the ground view uses,
// so instructions given from the map carry straight through.

import { Rnd } from "react-rnd";
import type { Appliance } from "@/lib/sim/types";
import type { Deployment } from "@/lib/sim/incident_types";
import { CAPABILITIES_BY_TYPE } from "@/lib/sim/incident_types";
import type { SceneCasualty } from "@/lib/sim/scene";

type Props = {
  appliance: Appliance;
  deployment: Deployment;
  now: number;
  /** Casualties already located on scene — pairing targets for medical crews. */
  casualties: SceneCasualty[];
  onSetPreCommitBaCrew: (applianceId: string, crewIds: string[]) => void;
  onSetTreatingCasualty: (applianceId: string, casualtyId: string | null) => void;
  onClose: () => void;
};

type BodyProps = Omit<Props, "onClose">;

/**
 * The pre-arrival instructions themselves. Rendered inline in the MDT's
 * Resourcing pane, and inside the floating shell below when the operator
 * clicks an en-route unit on the dispatch map (where there is no MDT).
 */
export function PreArrivalBody({
  appliance,
  deployment,
  now,
  casualties,
  onSetPreCommitBaCrew,
  onSetTreatingCasualty,
}: BodyProps) {
  const caps = CAPABILITIES_BY_TYPE[appliance.type] ?? [];
  const baCapable = caps.includes("BA");
  const medical =
    appliance.service === "Ambulance" ||
    ["HEMS", "CCC", "BASICS", "QR"].includes(appliance.type);
  const preCommit = deployment.preCommitBaCrewIds ?? [];
  void now;
  return (
        <div className="flex flex-col gap-4 px-4 py-4">
          <p className="font-mono text-[10px] uppercase leading-relaxed tracking-widest text-(--color-text-dim)">
            Instructions transmit over airwave — the crew actions them the
            moment they book in attendance.
          </p>

          {baCapable && (
            <section>
              <h2 className="mb-1.5 font-mono text-[11px] uppercase tracking-widest text-(--color-amber-dim)">
                Rig in BA en route
              </h2>
              <ul className="grid gap-1">
                {appliance.crewMembers.map((m) => {
                  const on = preCommit.includes(m.id);
                  return (
                    <li key={m.id}>
                      <label className="flex cursor-pointer items-center justify-between gap-2 rounded-sm border border-(--color-border-subtle) bg-(--color-bg) px-2.5 py-1.5 select-none hover:border-(--color-amber-dim)">
                        <span className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() =>
                              onSetPreCommitBaCrew(
                                appliance.id,
                                on
                                  ? preCommit.filter((id) => id !== m.id)
                                  : [...preCommit, m.id],
                              )
                            }
                            className="size-3.5 shrink-0 cursor-pointer accent-(--color-amber)"
                          />
                          <span className="font-mono text-xs text-(--color-text)">
                            {m.name}
                          </span>
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                          {m.role}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              {preCommit.length > 0 && (
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-(--color-ok)">
                  {preCommit.length} wearer{preCommit.length === 1 ? "" : "s"} rigging
                  en route — they stage at the entry point on arrival and
                  wait for your commit order
                </p>
              )}
            </section>
          )}

          {medical && (
            <section>
              <h2 className="mb-1.5 font-mono text-[11px] uppercase tracking-widest text-(--color-amber-dim)">
                Pair to casualty on arrival
              </h2>
              {casualties.length === 0 ? (
                <p className="text-xs text-(--color-text-muted)">
                  No casualties located yet — pairing opens once crews find
                  someone.
                </p>
              ) : (
                <select
                  value={deployment.treatingCasualtyId ?? ""}
                  onChange={(e) =>
                    onSetTreatingCasualty(
                      appliance.id,
                      e.target.value === "" ? null : e.target.value,
                    )
                  }
                  className="h-9 w-full rounded-sm border border-(--color-border) bg-(--color-bg) px-2.5 font-mono text-xs text-(--color-text) outline-none focus:border-(--color-amber)"
                >
                  <option value="">No pre-assignment</option>
                  {casualties.map((c) => (
                    <option key={c.id} value={c.id}>
                      {(c.label ?? c.id) + " · " + c.severity}
                    </option>
                  ))}
                </select>
              )}
            </section>
          )}

          {!baCapable && !medical && (
            <p className="text-xs text-(--color-text-muted)">
              No pre-arrival options for this unit type — it books in and
              takes tasking on scene.
            </p>
          )}
        </div>
  );
}

export function PreArrivalPanel({
  appliance,
  deployment,
  now,
  casualties,
  onSetPreCommitBaCrew,
  onSetTreatingCasualty,
  onClose,
}: Props) {
  const awaitingLz = !!deployment.hemsFlight && !deployment.parkingPos;
  const etaMs = deployment.arrivesAt - now;
  const etaLabel = awaitingLz
    ? "awaiting LZ"
    : etaMs > 0
      ? fmtMs(etaMs)
      : "arriving";

  return (
    <Rnd
      default={{
        x: typeof window !== "undefined" ? window.innerWidth / 2 - 210 : 300,
        y: 120,
        width: 420,
        height: "auto",
      }}
      minWidth={340}
      bounds="window"
      dragHandleClassName="drag-handle"
      enableResizing={false}
      // Above the fullscreen ground view (1200) and MDT (1250) so inbound
      // chips can open it for en-route pre-allocation.
      className="z-[1290]"
    >
      <div className="flex w-full flex-col overflow-hidden rounded-sm border border-(--color-amber)/50 bg-(--color-surface) shadow-2xl shadow-black/60">
        <div className="drag-handle flex cursor-move items-center justify-between gap-2 border-b border-(--color-border-subtle) bg-(--color-amber)/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
          <div className="flex items-center gap-2">
            <span className="dot-live size-1.5 rounded-full bg-(--color-amber)" />
            <span>Pre-arrival · {appliance.callsign}</span>
            <span className="opacity-60">|</span>
            <span className="text-(--color-text-dim)">ETA {etaLabel}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-2 py-0.5 text-(--color-text-dim) hover:bg-(--color-bg) hover:text-(--color-critical)"
            title="Close"
          >
            ✕
          </button>
        </div>

        <PreArrivalBody
          appliance={appliance}
          deployment={deployment}
          now={now}
          casualties={casualties}
          onSetPreCommitBaCrew={onSetPreCommitBaCrew}
          onSetTreatingCasualty={onSetTreatingCasualty}
        />
      </div>
    </Rnd>
  );
}

function fmtMs(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
