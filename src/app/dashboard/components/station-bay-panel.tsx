"use client";

// Station bay view — a top-down look inside a fire station's appliance
// bays, matching the hand-drawn reference module-for-module: 360-wide
// concrete modules with expansion joints, yellow hatched strips down
// both edges, a floor drain channel under the vehicle, white marked
// parking box, ghost bay number, oil staining, and a tarmac apron.
//
// Data-driven per station: each appliance gets a bay with the correct
// callsign plate and the detailed top-down art (pump / aerial from the
// reference set). A unit that's out the door shows as a ~34% ghost of
// itself with tyre marks rolling onto the apron and its status word
// flashing slowly beneath the bay.

import { Rnd } from "react-rnd";
import type { Appliance } from "@/lib/sim/types";
import type { StationWithAppliances } from "../page";

// Reference module geometry (absolute units within the SVG).
const MOD_W = 360;
const GAP = 20;
const MARGIN = 80;
const SLAB_TOP = 150;
const SLAB_BOT = 690;
const SVG_H = 880;

type BayArt = { href: string; w: number; h: number; scale: number };

/** Detailed bay art per appliance type (drawn nose-out already). */
function artFor(type: Appliance["type"]): BayArt | null {
  switch (type) {
    case "WrL":
    case "WrT":
    case "L6P":
    case "TRU_pump":
      return { href: "/appliances/twr-bay-pump.svg", w: 260, h: 540, scale: 0.62 };
    case "TL":
    case "HLP":
      return { href: "/appliances/twr-bay-alp.svg", w: 280, h: 680, scale: 0.5828 };
    default:
      return null;
  }
}

/** Whether the vehicle is physically in its bay right now. */
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
    default: return "IN BAY";
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
  const svgW = MARGIN * 2 + n * MOD_W + (n - 1) * GAP;
  const ready = bays.filter((a) => a.status === 7).length;

  return (
    <Rnd
      default={{
        x: 60,
        y: 90,
        width: Math.min(1040, 220 + n * 250),
        height: typeof window !== "undefined" ? Math.min(740, window.innerHeight - 130) : 660,
      }}
      minWidth={440}
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
              {ready}/{bays.length} on the run
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
            viewBox={`0 0 ${svgW} ${SVG_H}`}
            className="h-auto w-full"
            role="img"
            aria-label={`${station.name} appliance bays`}
          >
            <style>{`
              @keyframes sb-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }
              .sb-blink { animation: sb-blink 2.6s ease-in-out infinite; }
            `}</style>
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
              <linearGradient id="sb-tyre" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#101015" stopOpacity="0" />
                <stop offset="22%" stopColor="#101015" stopOpacity="0.3" />
                <stop offset="60%" stopColor="#101015" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#101015" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Backdrop + apron */}
            <rect width={svgW} height={SVG_H} fill="#050507" />
            <rect x={0} y={SLAB_BOT} width={svgW} height={SVG_H - SLAB_BOT} fill="url(#sb-apron)" />

            {bays.map((a, i) => {
              const x0 = MARGIN + i * (MOD_W + GAP);
              const cx = x0 + 180;
              const art = artFor(a.type);
              const parked = inBay(a);
              const offRun = a.status === 8;
              const status = shortStatus(a);
              return (
                <g
                  key={a.id}
                  onClick={() => onSelectAppliance?.(a.id)}
                  style={{ cursor: onSelectAppliance ? "pointer" : "default" }}
                >
                  {/* Concrete module */}
                  <rect x={x0} y={SLAB_TOP} width={MOD_W} height={SLAB_BOT - SLAB_TOP} fill="url(#sb-concrete)" />

                  {/* Expansion joints */}
                  {[285, 420, 555].map((y) => (
                    <g key={y}>
                      <line x1={x0} y1={y} x2={x0 + MOD_W} y2={y} stroke="#1c1c22" strokeWidth={2} opacity={0.55} />
                      <line x1={x0} y1={y + 2} x2={x0 + MOD_W} y2={y + 2} stroke="#4a4a52" strokeWidth={1} opacity={0.35} />
                    </g>
                  ))}

                  {/* Oil staining */}
                  <ellipse cx={cx} cy={450} rx={88} ry={150} fill="url(#sb-oil)" />
                  <ellipse cx={x0 + 150} cy={580} rx={34} ry={26} fill="url(#sb-oil)" />

                  {/* Marked parking box */}
                  <rect x={x0 + 88} y={188} width={184} height={450} fill="none" stroke="#e9e6dc" strokeWidth={4} opacity={0.3} />

                  {/* Yellow hatched strips, both edges */}
                  {[x0 + 10, x0 + 320].map((hx) => (
                    <g key={hx}>
                      <rect x={hx} y={180} width={30} height={470} fill="#d8b41a" opacity={0.1} />
                      {Array.from({ length: 18 }, (_, k) => (
                        <path
                          key={k}
                          d={`M${hx} ${206 + k * 26} L${hx + 28} ${182 + k * 26}`}
                          stroke="#0e0e12"
                          strokeWidth={7}
                          opacity={0.3}
                        />
                      ))}
                    </g>
                  ))}

                  {/* Floor drain channel */}
                  <rect x={x0 + 172} y={176} width={16} height={482} fill="#2a2a30" />
                  <rect x={x0 + 172} y={176} width={22} height={482} fill="none" stroke="#191920" strokeWidth={2} />
                  {Array.from({ length: 30 }, (_, k) => (
                    <line
                      key={k}
                      x1={x0 + 172}
                      y1={180 + k * 16}
                      x2={x0 + 188}
                      y2={180 + k * 16}
                      stroke="#3a3a42"
                      strokeWidth={1.5}
                      opacity={0.4}
                    />
                  ))}

                  {/* Ghost bay number */}
                  <text
                    x={x0 + 330}
                    y={246}
                    textAnchor="end"
                    fontFamily="var(--font-geist-sans), sans-serif"
                    fontWeight={800}
                    fontSize={64}
                    fill="#ffffff"
                    opacity={0.07}
                  >
                    {i + 1}
                  </text>

                  {/* Tyre marks rolling out — only when the unit is out */}
                  {!parked && (
                    <>
                      <rect x={cx - 46} y={430} width={11} height={SVG_H - 470} fill="url(#sb-tyre)" />
                      <rect x={cx + 35} y={430} width={11} height={SVG_H - 470} fill="url(#sb-tyre)" />
                    </>
                  )}

                  {/* Vehicle — full art when home, ~34% ghost when out */}
                  {(() => {
                    if (art) {
                      const w = art.w * art.scale;
                      const h = art.h * art.scale;
                      return (
                        <image
                          href={art.href}
                          x={cx - w / 2}
                          y={210}
                          width={w}
                          height={h}
                          opacity={parked ? (offRun ? 0.55 : 1) : 0.34}
                        />
                      );
                    }
                    return (
                      <g opacity={parked ? (offRun ? 0.55 : 1) : 0.34}>
                        <rect x={cx - 62} y={230} width={124} height={330} rx={10} fill="#b91c1c" stroke="#0a0a0c" strokeWidth={2} />
                        <rect x={cx - 62} y={506} width={124} height={54} rx={10} fill="#7f1d1d" />
                        <rect x={cx - 46} y={516} width={92} height={20} rx={4} fill="#1e293b" />
                      </g>
                    );
                  })()}

                  {/* Off-run flag over a parked but unavailable vehicle */}
                  {parked && offRun && (
                    <text
                      x={cx}
                      y={SLAB_TOP + 24}
                      textAnchor="middle"
                      fontFamily="var(--font-geist-mono), monospace"
                      fontSize={15}
                      letterSpacing={2}
                      fill="#f87171"
                    >
                      OFF THE RUN
                    </text>
                  )}

                  {/* Callsign plate on the apron */}
                  <rect x={cx - 84} y={SLAB_BOT + 34} width={168} height={72} rx={4} fill="#0a0a0c" stroke={parked && !offRun ? "#34d399" : offRun ? "#f87171" : "#f59e0b"} strokeWidth={1.5} opacity={0.95} />
                  <text
                    x={cx}
                    y={SLAB_BOT + 62}
                    textAnchor="middle"
                    fontFamily="var(--font-geist-mono), monospace"
                    fontWeight={700}
                    fontSize={21}
                    letterSpacing={2}
                    fill={parked && !offRun ? "#34d399" : offRun ? "#f87171" : "#f59e0b"}
                  >
                    {a.callsign}
                  </text>
                  {/* Status word — flashes slowly while the unit is out */}
                  <text
                    x={cx}
                    y={SLAB_BOT + 88}
                    textAnchor="middle"
                    fontFamily="var(--font-geist-mono), monospace"
                    fontSize={14}
                    letterSpacing={3}
                    fill={parked && !offRun ? "#a8a8b3" : offRun ? "#f87171" : "#f59e0b"}
                    className={parked ? undefined : "sb-blink"}
                  >
                    {status}
                  </text>
                  {/* Type caption under the plate */}
                  <text
                    x={cx}
                    y={SLAB_BOT + 128}
                    textAnchor="middle"
                    fontFamily="var(--font-geist-mono), monospace"
                    fontSize={11}
                    letterSpacing={1.5}
                    fill="#6b6b75"
                  >
                    {a.typeName.toUpperCase().slice(0, 28)}
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
