"use client";

import { Rnd } from "react-rnd";
import { ResourcesBoard } from "./resources-board";
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
      bounds="window"
      dragHandleClassName="drag-handle"
      className="z-[1100]"
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-sm border border-(--color-border) bg-(--color-surface) shadow-2xl shadow-black/60">
        <div className="drag-handle flex cursor-move items-center justify-between border-b border-(--color-border-subtle) bg-(--color-surface-raised) px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
          <div className="flex items-center gap-2">
            <span className="dot-live size-1.5 rounded-full bg-(--color-amber)" />
            <span className="text-(--color-text)">Resources</span>
            {incidentActive && (
              <span className="rounded-sm border border-(--color-critical)/50 bg-(--color-critical)/10 px-1.5 py-0 font-mono text-[9px] uppercase tracking-widest text-(--color-critical)">
                Mobilise mode
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-2 py-0.5 hover:bg-(--color-bg) hover:text-(--color-critical)"
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
