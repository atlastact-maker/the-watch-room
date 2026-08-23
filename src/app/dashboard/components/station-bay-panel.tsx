"use client";

// Station bay view — a top-down look inside a fire station's appliance
// bays, styled after the hand-drawn reference (concrete slab, yellow
// hatched no-parking strips, white bay outlines, ghost bay numbers,
// oil staining, shutter thresholds, tarmac apron).
//
// Fully data-driven: one bay per appliance, the right top-down vehicle
// art parked nose-out, the real callsign on a plate at the threshold —
// and when a unit is out the door, its bay sits empty with a dashed
// ghost outline and a live status tag.

import { Rnd } from "react-rnd";
import { STATUS_LABELS, type Appliance } from "@/lib/sim/types";
import type { StationWithAppliances } from "../page";

const BAY_W = 250;
const DIV_W = 16;
const HATCH_W = 34;
const PAD = 26;
const SLAB_TOP = 30;
const SLAB_BOT = 640;
const APRON_BOT = 790;

/** Top-down art per appliance type; null falls back to a generic block. */
function artFor(type: Appliance["type"]): { href: string; w: number; h: number } | null {
  switch (type) {
    case "WrL":
    case "WrT":
    case "L6P":
      return { href: "/appliances/wrl-pump.svg", w: 170, h: 355 };
    case "TL":
    case "HLP":
      return { href: "/appliances/alp.svg", w: 165, h: 420 };
    case "TRU_pump":
      return { href: "/appliances/tru-pump.svg", w: 165, h: 420 };
    case "TRU_van":
      return { href: "/appliances/tru-van.svg", w: 140, h: 345 };
    case "HEMS":
      return { href: "/appliances/hems-h145.svg", w: 220, h: 275 };
    default:
      return null;
  }
}

/** Whether the vehicle is physically sat in its bay right now. */
function inBay(a: Appliance): boolean {
  return a.status === 7 || a.status === 8;
}

function shortStatus(a: Appliance): string {
  switch (a.status) {
    case 1: return "MOBILE";
    case 2: return "ON SCENE";
    case 3: return "STOP MSG";
    case 4: return "RETURNING";
    case 5: return "AT HOSPITAL";
    case 6: return "MOBILE AVAIL";
    case 8: return "OFF THE RUN";
    default: return STATUS_LABELS[a.status] ?? "";
  }
}

export function StationBayPanel({
  station,
  onClose,
  onSelectAppliance,
}: {
  station: StationWithAppliances;
  onClose: () => void;
  onSelectAppliance?: (applianceId: string) => void;
}) {
  const bays = station.appliances;
  const n = Math.max(1, bays.length);
  const svgW = PAD * 2 + HATCH_W * 2 + n * BAY_W + (n - 1) * DIV_W;
  const svgH = APRON_BOT + 10;
  const ready = bays.filter((a) => a.status === 7).length;

  return (
    <Rnd
      default={{
        x: 60,
        y: 90,
        width: Math.min(980, 240 + n * 190),
        height: typeof window !== "undefined" ? Math.min(720, window.innerHeight - 130) : 640,
      }}
      minWidth={420}
      minHeight={380}
      bounds="window"
      dragHandleClassName="drag-handle"
      className="z-[1120]"
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-sm border border-(--color-critical)/40 bg-(--color-surface) shadow-2xl shadow-black/60">
        <div className="drag-handle flex cursor-move items-center justify-between border-b border-(--color-border-subtle) bg-(--color-critical)/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest">
          <div className="flex items-center gap-2 text-(--color-critical)">
            <span className="dot-live size-1.5 rounded-full bg-(--color-critical)" />
            <span className="text-(--color-text)">{station.id}</span>
            <span className="opacity-60">|</span>
            <span>{station.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-(--color-text-dim)">
              {ready}/{bays.length} in bays · ready
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm px-2 py-0.5 text-(--color-text-dim) hover:bg-(--color-bg) hover:text-(--color-critical)"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-[#050507]">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="h-auto w-full"
            role="img"
            aria-label={`${station.name} appliance bays`}
          >
            <defs>
              <linearGradient id="sb-concrete" x1="0%" y1="0%" x2="18%" y2="100%">
                <stop offset="0%" stopColor="#3e3e44" />
                <stop offset="40%" stopColor="#33333a" />
                <stop offset="100%" stopColor="#26262c" />
              </linearGradient>
              <linearGradient id="sb-apron" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#141419" />
                <stop offset="100%" stopColor="#0a0a0e" />
              </linearGradient>
              <radialGradient id="sb-oil" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
              <pattern
                id="sb-hatch"
                width="16"
                height="16"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="16" height="16" fill="#d8b41a" opacity="0.10" />
                <rect width="7" height="16" fill="#0e0e12" opacity="0.30" />
              </pattern>
            </defs>

            {/* Backdrop + apron */}
            <rect width={svgW} height={svgH} fill="#050507" />
            <rect x={0} y={SLAB_BOT} width={svgW} height={APRON_BOT - SLAB_BOT} fill="url(#sb-apron)" />

            {/* Concrete slab across all bays */}
            <rect
              x={PAD}
              y={SLAB_TOP}
              width={svgW - PAD * 2}
              height={SLAB_BOT - SLAB_TOP}
              fill="url(#sb-concrete)"
            />

            {/* Outer hatched no-parking strips */}
            <rect x={PAD} y={SLAB_TOP + 20} width={HATCH_W} height={SLAB_BOT - SLAB_TOP - 40} fill="url(#sb-hatch)" />
            <rect x={svgW - PAD - HATCH_W} y={SLAB_TOP + 20} width={HATCH_W} height={SLAB_BOT - SLAB_TOP - 40} fill="url(#sb-hatch)" />

            {bays.map((a, i) => {
              const x0 = PAD + HATCH_W + i * (BAY_W + DIV_W);
              const cx = x0 + BAY_W / 2;
              const art = artFor(a.type);
              const parked = inBay(a);
              const offRun = a.status === 8;
              return (
                <g
                  key={a.id}
                  onClick={() => onSelectAppliance?.(a.id)}
                  style={{ cursor: onSelectAppliance ? "pointer" : "default" }}
                >
                  {/* Divider between bays */}
                  {i > 0 && (
                    <>
                      <line x1={x0 - DIV_W / 2} y1={SLAB_TOP + 12} x2={x0 - DIV_W / 2} y2={SLAB_BOT - 12} stroke="#1c1c22" strokeWidth={3} opacity={0.6} />
                      <line x1={x0 - DIV_W / 2 + 2} y1={SLAB_TOP + 12} x2={x0 - DIV_W / 2 + 2} y2={SLAB_BOT - 12} stroke="#4a4a52" strokeWidth={1} opacity={0.35} />
                    </>
                  )}

                  {/* Ghost bay number */}
                  <text
                    x={x0 + BAY_W - 18}
                    y={SLAB_TOP + 70}
                    textAnchor="end"
                    fontFamily="var(--font-geist-sans), sans-serif"
                    fontWeight={800}
                    fontSize={64}
                    fill="#ffffff"
                    opacity={0.07}
                  >
                    {i + 1}
                  </text>

                  {/* Bay outline */}
                  <rect
                    x={x0 + 24}
                    y={SLAB_TOP + 42}
                    width={BAY_W - 48}
                    height={SLAB_BOT - SLAB_TOP - 100}
                    fill="none"
                    stroke="#e9e6dc"
                    strokeWidth={4}
                    opacity={0.3}
                  />

                  {/* Oil staining */}
                  <ellipse cx={cx} cy={(SLAB_TOP + SLAB_BOT) / 2 + 30} rx={62} ry={110} fill="url(#sb-oil)" />
                  <ellipse cx={cx - 26} cy={SLAB_BOT - 110} rx={26} ry={20} fill="url(#sb-oil)" />

                  {/* Shutter threshold at the door line */}
                  <line x1={x0 + 8} y1={SLAB_BOT - 2} x2={x0 + BAY_W - 8} y2={SLAB_BOT - 2} stroke="#1c1c22" strokeWidth={4} />
                  <line x1={x0 + 8} y1={SLAB_BOT + 1} x2={x0 + BAY_W - 8} y2={SLAB_BOT + 1} stroke="#4a4a52" strokeWidth={1.5} opacity={0.5} />

                  {/* Vehicle (nose-out, toward the apron) or empty-bay ghost */}
                  {parked ? (
                    art ? (
                      <image
                        href={art.href}
                        x={cx - art.w / 2}
                        y={(SLAB_TOP + SLAB_BOT) / 2 - art.h / 2 + 10}
                        width={art.w}
                        height={art.h}
                        opacity={offRun ? 0.55 : 1}
                        transform={`rotate(180 ${cx} ${(SLAB_TOP + SLAB_BOT) / 2 + 10})`}
                      />
                    ) : (
                      <g opacity={offRun ? 0.55 : 1}>
                        <rect x={cx - 62} y={(SLAB_TOP + SLAB_BOT) / 2 - 160} width={124} height={330} rx={10} fill="#b91c1c" stroke="#0a0a0c" strokeWidth={2} />
                        <rect x={cx - 62} y={(SLAB_TOP + SLAB_BOT) / 2 + 116} width={124} height={54} rx={10} fill="#7f1d1d" />
                        <rect x={cx - 46} y={(SLAB_TOP + SLAB_BOT) / 2 + 126} width={92} height={20} rx={4} fill="#1e293b" />
                      </g>
                    )
                  ) : (
                    <g>
                      <rect
                        x={cx - 62}
                        y={(SLAB_TOP + SLAB_BOT) / 2 - 160}
                        width={124}
                        height={330}
                        rx={10}
                        fill="none"
                        stroke="#4a4a52"
                        strokeWidth={2.5}
                        strokeDasharray="10 8"
                        opacity={0.5}
                      />
                      <text
                        x={cx}
                        y={(SLAB_TOP + SLAB_BOT) / 2 + 12}
                        textAnchor="middle"
                        fontFamily="var(--font-geist-mono), monospace"
                        fontSize={17}
                        letterSpacing={2}
                        fill="#f59e0b"
                      >
                        {shortStatus(a)}
                      </text>
                    </g>
                  )}

                  {/* Off-run flag over a parked but unavailable vehicle */}
                  {parked && offRun && (
                    <text
                      x={cx}
                      y={SLAB_TOP + 34}
                      textAnchor="middle"
                      fontFamily="var(--font-geist-mono), monospace"
                      fontSize={15}
                      letterSpacing={2}
                      fill="#f87171"
                    >
                      OFF THE RUN
                    </text>
                  )}

                  {/* Callsign plate + type on the apron */}
                  <rect x={cx - 78} y={SLAB_BOT + 26} width={156} height={54} rx={4} fill="#0a0a0c" stroke={parked ? "#34d399" : "#f59e0b"} strokeWidth={1.5} opacity={0.95} />
                  <text
                    x={cx}
                    y={SLAB_BOT + 49}
                    textAnchor="middle"
                    fontFamily="var(--font-geist-mono), monospace"
                    fontWeight={700}
                    fontSize={19}
                    letterSpacing={2}
                    fill={parked ? "#34d399" : "#f59e0b"}
                  >
                    {a.callsign}
                  </text>
                  <text
                    x={cx}
                    y={SLAB_BOT + 70}
                    textAnchor="middle"
                    fontFamily="var(--font-geist-mono), monospace"
                    fontSize={11}
                    letterSpacing={1.5}
                    fill="#a8a8b3"
                  >
                    {a.typeName.toUpperCase().slice(0, 24)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </Rnd>
  );
}
