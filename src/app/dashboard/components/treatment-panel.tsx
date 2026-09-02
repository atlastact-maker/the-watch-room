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
  // Severity block in the header, coloured like the MDT's incident strip.
  const sevCls =
    sev === "critical"
      ? "bg-[#dc2626] text-white"
      : sev === "serious"
        ? "bg-[#f59e0b] text-black"
        : "bg-[#15803d] text-white";

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
      // Deliberately UNBOUNDED. bounds="window" pinned the box inside the
      // viewport, which on a busy screen meant it could not be pushed out
      // of the way of the MDT and read as though it were trapped by it.
      // A patient window is something you shove aside, so let it go
      // wherever the operator drags it.
      dragHandleClassName="drag-handle"
      // Above the MDT chassis (z-1250) but below the full-screen overlays
      // — debrief (2000), incoming call (2000), glossary (3000).
      style={{ zIndex: 1400 + index }}
    >
      {/* Same rugged chassis as the MDT, one size down, so a patient
          window reads as another device on the desk rather than a
          browser dialog that wandered in. */}
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[12px] border-[9px] border-[#26262b] bg-[#26262b] shadow-2xl shadow-black/70 ring-1 ring-[#3d3d45]">
        <Screw className="left-[-7px] top-[-7px]" />
        <Screw className="right-[-7px] top-[-7px]" />
        <Screw className="bottom-[-7px] left-[-7px]" />
        <Screw className="bottom-[-7px] right-[-7px]" />

        <div
          style={CAD_VARS}
          className="flex h-full w-full flex-col overflow-hidden rounded-[5px] bg-[#e7e7ea] text-zinc-900"
        >
          {/* Header bar, built like the MDT's sync bar: full-bleed
              colour blocks, no gaps, mono and tracked. */}
          <div className="drag-handle flex cursor-move items-stretch justify-between bg-[#1d4ed8] font-mono text-[11px] font-bold text-white">
            <span className="flex min-w-0 items-center gap-2 px-3 py-1 tracking-[0.15em]">
              <span className="dot-live size-1.5 shrink-0 rounded-full bg-white" />
              <span className="truncate uppercase">Patient · {label}</span>
            </span>
            <span className="flex items-stretch">
              <span
                className={`flex items-center px-3 tracking-[0.1em] ${sevCls}`}
              >
                {sev.toUpperCase()}
              </span>
              {escToClose && (
                <span className="hidden items-center bg-[#1e40af] px-2 text-[9px] tracking-[0.1em] text-white/70 md:flex">
                  ESC
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex items-center bg-[#1e40af] px-3 tracking-[0.1em] transition-colors hover:bg-[#dc2626]"
                title="Close treatment box"
              >
                ✕
              </button>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto bg-(--color-bg) px-3 py-3 text-(--color-text)">
            <TreatmentTab {...treatmentProps} />
          </div>

          {/* Resize affordance — matches the MDT's bottom bezel voice. */}
          <div className="pointer-events-none flex items-center justify-between border-t border-zinc-400 bg-[#e7e7ea] px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.3em] text-zinc-500">
            <span>Drag header to move</span>
            <span>Resize ⟋</span>
          </div>
        </div>
      </div>
    </Rnd>
  );
}

/** The MDT's corner screw, reused so the two devices match. */
function Screw({ className = "" }: { className?: string }) {
  return (
    <div
      className={
        "absolute z-10 size-[6px] rounded-full bg-[#3d3d45] shadow-inner ring-1 ring-[#4c4c55] " +
        className
      }
    >
      <div className="absolute left-1/2 top-1/2 h-[1px] w-[4px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#1b1b1f]" />
    </div>
  );
}
