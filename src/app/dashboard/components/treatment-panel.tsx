"use client";

// Draggable / resizable pop-out box wrapping the treatment tab. Opened
// from a casualty card in the incident view via an "Open treatment ↗"
// button; closes back to the card via the ✕, Esc, or the caller's
// onClose.

import { Rnd } from "react-rnd";
import { useEffect, type ComponentProps } from "react";
import { TreatmentTab } from "./treatment-tab";

type TreatmentProps = ComponentProps<typeof TreatmentTab>;

type Props = TreatmentProps & {
  onClose: () => void;
};

export function DraggableTreatmentPanel({ onClose, ...treatmentProps }: Props) {
  const label = treatmentProps.casualty.label ?? treatmentProps.casualty.id;

  // Esc closes the pop-out. Ignore if focus is inside a form control so
  // the operator doesn't lose in-progress input by accident.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <Rnd
      default={{
        x: typeof window !== "undefined" ? window.innerWidth / 2 - 320 : 300,
        y: 100,
        width: 640,
        height:
          typeof window !== "undefined"
            ? Math.min(760, window.innerHeight - 120)
            : 700,
      }}
      minWidth={480}
      minHeight={420}
      bounds="window"
      dragHandleClassName="drag-handle"
      className="z-[1300]"
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-sm border border-(--color-ok)/40 bg-(--color-surface) shadow-2xl shadow-black/60">
        <div className="drag-handle flex cursor-move items-center justify-between gap-2 border-b border-(--color-border-subtle) bg-(--color-ok)/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-(--color-ok)">
          <div className="flex items-center gap-2">
            <span className="dot-live size-1.5 rounded-full bg-(--color-ok)" />
            <span>Patient · {label}</span>
            <span className="opacity-60">|</span>
            <span className="text-(--color-text-dim)">
              {treatmentProps.casualty.severity}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim) md:inline">
              Esc
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm px-2 py-0.5 text-(--color-text-dim) hover:bg-(--color-bg) hover:text-(--color-critical)"
              title="Close treatment box (Esc)"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <TreatmentTab {...treatmentProps} />
        </div>
      </div>
    </Rnd>
  );
}
