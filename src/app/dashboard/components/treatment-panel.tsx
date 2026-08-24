"use client";

// Draggable / resizable pop-out box wrapping the treatment tab. Opened
// from a casualty card in the incident view via an "Open treatment ↗"
// button. Several boxes can be open at once — one per casualty, like a
// tab system of patient windows — each cascaded slightly so a fresh box
// never lands exactly on top of the last. Styled in the MDT's light CAD
// theme so patient windows read as part of the CAD suite, not the dark
// ops-room chrome.

import { Rnd } from "react-rnd";
import { useEffect, type ComponentProps } from "react";
import { CAD_VARS } from "./cad-theme";
import { TreatmentTab } from "./treatment-tab";

type TreatmentProps = ComponentProps<typeof TreatmentTab>;

type Props = TreatmentProps & {
  onClose: () => void;
  /** Cascade position — nth open panel offsets down-right. */
  index?: number;
  /** Only the most recently opened panel listens for Esc, so one key
   *  press closes one box, not the whole set. */
  escToClose?: boolean;
};

export function DraggableTreatmentPanel({
  onClose,
  index = 0,
  escToClose = true,
  ...treatmentProps
}: Props) {
  const label = treatmentProps.casualty.label ?? treatmentProps.casualty.id;
  const sev = treatmentProps.casualty.severity;
  const sevCls =
    sev === "critical"
      ? "bg-red-600 text-white"
      : sev === "serious"
        ? "bg-amber-500 text-black"
        : "bg-green-600 text-white";

  // Esc closes the top pop-out. Ignore if focus is inside a form control
  // so the operator doesn't lose in-progress input by accident.
  useEffect(() => {
    if (!escToClose) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, escToClose]);

  const cascade = index * 36;
  return (
    <Rnd
      default={{
        x:
          (typeof window !== "undefined" ? window.innerWidth / 2 - 320 : 300) +
          cascade,
        y: 90 + cascade,
        width: 640,
        height:
          typeof window !== "undefined"
            ? Math.min(760, window.innerHeight - 140)
            : 700,
      }}
      minWidth={480}
      minHeight={420}
      bounds="window"
      dragHandleClassName="drag-handle"
      style={{ zIndex: 1300 + index }}
    >
      <div
        style={CAD_VARS}
        className="flex h-full w-full flex-col overflow-hidden rounded-sm border-2 border-zinc-500 bg-[#f4f4f5] shadow-2xl shadow-black/50"
      >
        <div className="drag-handle flex cursor-move items-center justify-between gap-2 border-b border-zinc-400 bg-[#e7e7ea] px-3 py-2 font-mono text-[10px] uppercase tracking-widest">
          <div className="flex min-w-0 items-center gap-2">
            <span className="dot-live size-1.5 shrink-0 rounded-full bg-green-600" />
            <span className="truncate font-bold text-zinc-900">
              Patient · {label}
            </span>
            <span
              className={`shrink-0 rounded-[2px] px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest ${sevCls}`}
            >
              {sev.toUpperCase()}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {escToClose && (
              <span className="hidden font-mono text-[9px] uppercase tracking-widest text-zinc-500 md:inline">
                Esc
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-zinc-400 bg-white px-2 py-0.5 text-zinc-600 hover:border-red-600 hover:text-red-600"
              title="Close treatment box"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-[#f4f4f5] px-4 py-4">
          <TreatmentTab {...treatmentProps} />
        </div>
      </div>
    </Rnd>
  );
}
