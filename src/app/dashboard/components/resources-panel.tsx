"use client";

import { Rnd } from "react-rnd";
import { ResourcesBoard } from "./resources-board";
import { CAD_VARS } from "./cad-theme";
import type { StationWithAppliances } from "../page";
import type { Eta } from "./deployment-board";

type Props = {
  stations: StationWithAppliances[];
  onSelectAppliance: (applianceId: string) => void;
  onClose: () => void;
  /** When an incident is active the resources panel doubles as the mobilise
   *  list \u2014 each row gets a Mobilise button and an ETA hint. */
  incidentActive?: boolean;
  deployedIds?: Set<string>;
  etas?: Record<string, Eta>;
  onMobilise?: (args: { applianceId: string; stationId: string }) => void;
};

export function DraggableResourcesPanel({
  stations,
  onSelectAppliance,
  onClose,
  incidentActive,
  deployedIds,
  etas,
  onMobilise,
}: Props) {
  return (
    <Rnd
      default={{
        x: typeof window !== "undefined" ? window.innerWidth - 540 : 800,
        y: 80,
        width: 520,
        height: typeof window !== "undefined" ? window.innerHeight - 120 : 700,
      }}
      minWidth={360}
      minHeight={280}
      // Unbounded like the log and the stack — a panel you shove aside
      // should go where it is put.
      dragHandleClassName="drag-handle"
      className="z-[1100]"
    >
      {/* Same chassis as the dispatch log and the call stack: CAD palette,
          full-bleed header, buttons as blocks in the bar. Amber marks it
          out from the log's green and the stack's blue. */}
      <div
        style={CAD_VARS}
        className="flex h-full w-full flex-col overflow-hidden rounded-sm border-2 border-zinc-500 bg-(--color-bg) text-(--color-text) shadow-2xl shadow-black/60"
      >
        <div className="drag-handle flex cursor-move items-stretch justify-between bg-[#b45309] font-mono text-[11px] font-bold text-white">
          <div className="flex min-w-0 items-center gap-2 px-3 py-1 tracking-[0.15em]">
            <span className="dot-live size-1.5 shrink-0 rounded-full bg-white" />
            <span className="truncate uppercase">Resources</span>
            {incidentActive && (
              <span className="shrink-0 bg-[#dc2626] px-1.5 text-[10px]">
                DRAG TO DISPATCH
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center bg-[#92400e] px-3 transition-colors hover:bg-[#dc2626]"
            title="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ResourcesBoard
            stations={stations}
            onSelectAppliance={onSelectAppliance}
            incidentActive={incidentActive}
            deployedIds={deployedIds}
            etas={etas}
            onMobilise={onMobilise}
          />
        </div>
      </div>
    </Rnd>
  );
}
