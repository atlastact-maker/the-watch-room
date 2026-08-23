"use client";

// Station bay view — a top-down look inside a fire station's appliance
// bays, reproducing the reference artwork 1:1: header with yellow station
// badge, wall pillars and lintel, contiguous concrete bay modules with
// expansion joints, edge hatching, marked box, ghost bay number and oil
// staining, roller-shutter thresholds with a status-coloured light bar,
// and vehicle top-down art. A unit that's out leaves an empty bay (floor
// shadow, tyre marks, wheel chocks, BAY EMPTY) and its status word
// flashes slowly on the apron; off the run parks a 34% ghost.

import { Rnd } from "react-rnd";
import type { Deployment, Incident } from "@/lib/sim/incident_types";
import type { Appliance } from "@/lib/sim/types";
import type { StationWithAppliances } from "../page";

// Reference geometry (canvas units). Modules are contiguous.
const MOD_W = 360;
const MARGIN = 80;
const SLAB_TOP = 150;
const SLAB_BOT = 690;
const SVG_H = 880;

const MONO = "var(--font-geist-mono), ui-monospace, monospace";

// Reference palette: amber = available, blue = out the door, grey = off.
const C_AVAIL = "#fbbf24";
const C_OUT = "#60a5fa";
const C_OFF = "#5a5a63";
const C_TEXT = "#f4f4f5";
const C_DIM = "#8b8b93";

type BayArt = { href: string; w: number; h: number; scale: number; y: number };

/** Detailed bay art per appliance type, with reference placement. */
function artFor(type: Appliance["type"]): BayArt | null {
  switch (type) {
    case "WrL":
    case "WrT":
    case "L6P":
    case "TRU_pump":
      return { href: "/appliances/twr-bay-pump.svg", w: 260, h: 540, scale: 0.711, y: 217.365 };
    case "TL":
    case "HLP":
      return { href: "/appliances/twr-bay-alp.svg", w: 280, h: 680, scale: 0.914, y: 40.233 };
    default:
      return null;
  }
}

/** Whether the vehicle is physically in its bay right now. */
function inBay(a: Appliance): boolean {
  return a.status === 7 || a.status === 8;
}

function statusWord(a: Appliance): string {
  switch (a.status) {
    case 1: return "MOBILE";
    case 2: return "ON SCENE";
    case 3: return "STOP MSG";
    case 4: return "RETURNING";
    case 5: return "AT HOSPITAL";
    case 6: return "MOBILE AVAIL";
    case 8: return "OFF THE RUN";
    default: return "AVAILABLE";
  }
}

/** Short type caption matching the reference wording. */
function typeCaption(a: Appliance): string {
  switch (a.type) {
    case "WrL":
    case "WrT":
      return "PUMP";
    case "L6P": return "LIGHT PUMP";
    case "TRU_pump": return "TECHNICAL RESCUE PUMP";
    case "TL":
    case "HLP":
      return "AERIAL LADDER PLATFORM";
    default:
      return a.typeName.toUpperCase().slice(0, 30);
  }
}

export function StationBayPanel({
  station,
  onClose,
  onSelectAppliance,
  deployments,
  activeIncident,
  now,
}: {
  station: StationWithAppliances;
  onClose: () => void;
  onSelectAppliance?: (applianceId: string) => void;
  deployments?: Deployment[];
  activeIncident?: Incident | null;
  now?: number;
}) {
  const bays = station.appliances;
  const n = Math.max(1, bays.length);
  // Canvas never narrower than a 2-bay reference frame, so the header
  // always has room; a smaller garage is centred between its own walls.
  const svgW = Math.max(880, MARGIN * 2 + n * MOD_W);
  const gx0 = (svgW - n * MOD_W) / 2;
  const nAvail = bays.filter((a) => a.status === 7).length;
  const nOff = bays.filter((a) => a.status === 8).length;
  const nOut = bays.length - nAvail - nOff;

  const rawName = station.name.toUpperCase();
  const staffing = (station.staffing ?? "Wholetime").split("/")[0].trim().toUpperCase();
  const badgeW = 32 + station.id.length * 16;

  // Approximate rendered width of monospace text (Geist Mono ≈ 0.6em advance).
  const monoW = (t: string, size: number, ls: number) =>
    t.length * size * 0.6 + Math.max(0, t.length - 1) * ls;

  const summary = `${nAvail} AVAILABLE / ${nOut} MOBILE / ${nOff} OFF`;
  const summaryW = monoW(summary, 19, 2);
  const titleX = MARGIN + badgeW + 18;
  const titleRoom = svgW - MARGIN - summaryW - 30 - titleX;
  // Fit the title without ever touching the summary block: full name at
  // reference size, then shrink, then drop the FIRE STATION suffix, then
  // squeeze the glyphs as a last resort.
  const fullTitle = rawName.includes("FIRE STATION") ? rawName : `${rawName} FIRE STATION`;
  let title = fullTitle;
  let titleLs = 5;
  let titleSize = Math.min(25, (titleRoom - (title.length - 1) * titleLs) / (title.length * 0.6));
  if (titleSize < 18) {
    titleLs = 2;
    titleSize = Math.min(25, (titleRoom - (title.length - 1) * titleLs) / (title.length * 0.6));
  }
  if (titleSize < 15 && title !== rawName) {
    title = rawName;
    titleLs = 3;
    titleSize = Math.min(25, (titleRoom - (title.length - 1) * titleLs) / (title.length * 0.6));
  }
  titleSize = Math.max(12, titleSize);
  const titleSqueeze = monoW(title, titleSize, titleLs) > titleRoom;

  /** Detail line under the status word (reference: "DWELLING FIRE · ETA 4 MIN"). */
  function detailFor(a: Appliance): string | null {
    if (a.status === 8) return (a.note ?? "CREW SHORTFALL").toUpperCase().slice(0, 34);
    if (inBay(a)) return null;
    const dep = deployments?.find((d) => d.applianceId === a.id);
    if (!dep) return null;
    const incidentLabel = activeIncident
      ? activeIncident.scenario.type.replace(/[_-]+/g, " ").toUpperCase()
      : null;
    const etaMin = Math.ceil((dep.arrivesAt - (now ?? Date.now())) / 60000);
    if (etaMin > 0) return `${incidentLabel ?? "INCIDENT"} · ETA ${etaMin} MIN`;
    return incidentLabel;
  }

  return (
    <Rnd
      default={{
        x: 50,
        y: 70,
        width: Math.min(1020, 260 + Math.max(2, n) * 250),
        height: typeof window !== "undefined" ? Math.min(790, window.innerHeight - 110) : 700,
      }}
      minWidth={460}
      minHeight={400}
      bounds="window"
      dragHandleClassName="drag-handle"
      className="z-[1120]"
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-sm border border-(--color-border-subtle) bg-[#050507] shadow-2xl shadow-black/60">
        <div className="drag-handle flex cursor-move items-center justify-between border-b border-(--color-border-subtle) bg-[#0a0a0e] px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
          <span>Station · {station.id}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-2 py-0.5 hover:bg-(--color-bg) hover:text-(--color-critical)"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
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
              <linearGradient id="sb-wallv" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8f8f99" />
                <stop offset="30%" stopColor="#6b6b75" />
                <stop offset="100%" stopColor="#3c3c45" />
              </linearGradient>
              <linearGradient id="sb-wallh" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8f8f99" />
                <stop offset="30%" stopColor="#6b6b75" />
                <stop offset="100%" stopColor="#3c3c45" />
              </linearGradient>
              <linearGradient id="sb-shutter" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4a4a52" />
                <stop offset="50%" stopColor="#5e5e68" />
                <stop offset="100%" stopColor="#33333a" />
              </linearGradient>
              <linearGradient id="sb-apron" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#141419" />
                <stop offset="100%" stopColor="#0a0a0e" />
              </linearGradient>
              <linearGradient id="sb-tyre" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#101015" stopOpacity="0" />
                <stop offset="22%" stopColor="#101015" stopOpacity="0.3" />
                <stop offset="60%" stopColor="#101015" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#101015" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="sb-oil" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
              <filter id="sb-soft" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
              <filter id="sb-soft-s" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
              <radialGradient id="sb-vig" cx="50%" cy="45%" r="72%">
                <stop offset="0%" stopColor="#000" stopOpacity="0" />
                <stop offset="72%" stopColor="#000" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.7" />
              </radialGradient>
            </defs>

            {/* Backdrop + apron */}
            <rect width={svgW} height={SVG_H} fill="#050507" />
            <rect x={0} y={SLAB_BOT} width={svgW} height={SVG_H - SLAB_BOT} fill="url(#sb-apron)" />

            {bays.map((a, i) => {
              const x0 = gx0 + i * MOD_W;
              const cx = x0 + MOD_W / 2;
              const art = artFor(a.type);
              const out = !inBay(a);
              const offRun = a.status === 8;
              const stripColour = offRun ? C_OFF : out ? C_OUT : C_AVAIL;
              const detail = detailFor(a);
              return (
                <g
                  key={a.id}
                  onClick={() => onSelectAppliance?.(a.id)}
                  style={{ cursor: onSelectAppliance ? "pointer" : "default" }}
                >
                  {/* Concrete slab */}
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

                  {/* Ghost bay number */}
                  <text
                    x={x0 + 331}
                    y={246}
                    textAnchor="end"
                    fontFamily={MONO}
                    fontWeight={800}
                    fontSize={67}
                    fill="#ffffff"
                    opacity={0.07}
                  >
                    {i + 1}
                  </text>

                  {/* Occupied bay: vehicle art (34% ghost when off the run) */}
                  {!out &&
                    (() => {
                      if (art) {
                        const w = art.w * art.scale;
                        const h = art.h * art.scale;
                        return (
                          <image
                            href={art.href}
                            x={cx - w / 2}
                            y={art.y}
                            width={w}
                            height={h}
                            opacity={offRun ? 0.34 : 1}
                          />
                        );
                      }
                      return (
                        <g opacity={offRun ? 0.34 : 1}>
                          <rect x={cx - 62} y={240} width={124} height={330} rx={10} fill="#b91c1c" stroke="#0a0a0c" strokeWidth={2} />
                          <rect x={cx - 62} y={516} width={124} height={54} rx={10} fill="#7f1d1d" />
                          <rect x={cx - 46} y={526} width={92} height={20} rx={4} fill="#1e293b" />
                        </g>
                      );
                    })()}

                  {/* Empty bay: floor shadow, tyre marks, chocks, BAY EMPTY */}
                  {out && (
                    <>
                      <rect x={cx - 60} y={260} width={16} height={390} fill="url(#sb-tyre)" filter="url(#sb-soft-s)" />
                      <rect x={cx + 44} y={260} width={16} height={390} fill="url(#sb-tyre)" filter="url(#sb-soft-s)" />
                      <ellipse cx={cx} cy={400} rx={86} ry={170} fill="#000" opacity={0.16} filter="url(#sb-soft)" />
                      <rect x={cx - 73} y={554} width={22} height={13} rx={3} fill="#8a6a12" opacity={0.8} />
                      <rect x={cx + 51} y={554} width={22} height={13} rx={3} fill="#8a6a12" opacity={0.8} />
                      <text
                        x={cx}
                        y={400}
                        textAnchor="middle"
                        fontFamily={MONO}
                        fontSize={20}
                        letterSpacing={4}
                        fill="#ffffff"
                        opacity={0.16}
                      >
                        BAY EMPTY
                      </text>
                    </>
                  )}

                  {/* Roller-shutter threshold */}
                  <rect x={x0 + 4} y={664} width={MOD_W - 8} height={26} fill="url(#sb-shutter)" />
                  {[668, 674, 680, 686].map((y) => (
                    <line key={y} x1={x0 + 4} y1={y} x2={x0 + MOD_W - 4} y2={y} stroke="#26262c" strokeWidth={2} opacity={0.7} />
                  ))}
                  <rect x={x0 + 4} y={664} width={MOD_W - 8} height={2} fill="#a6a6b0" opacity={0.6} />

                  {/* Status light bar on the door line */}
                  <rect x={x0 + 4} y={688} width={MOD_W - 8} height={12} fill={stripColour} opacity={0.3} filter="url(#sb-soft-s)" />
                  <rect x={x0 + 4} y={690} width={MOD_W - 8} height={6} fill={stripColour} />

                  {/* Apron captions */}
                  <text x={cx} y={742.4} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={27} letterSpacing={2} fill={offRun ? C_OFF : C_TEXT}>
                    {a.callsign}
                  </text>
                  <text x={cx} y={768.2} textAnchor="middle" fontFamily={MONO} fontSize={13.5} letterSpacing={3} fill={offRun ? C_OFF : C_DIM}>
                    {typeCaption(a)}
                  </text>
                  <text
                    x={cx}
                    y={796}
                    textAnchor="middle"
                    fontFamily={MONO}
                    fontWeight={700}
                    fontSize={14.5}
                    letterSpacing={3}
                    fill={stripColour}
                    className={out ? "sb-blink" : undefined}
                  >
                    {statusWord(a)}
                  </text>
                  {detail && (
                    <text x={cx} y={820} textAnchor="middle" fontFamily={MONO} fontSize={12.5} letterSpacing={2} fill={offRun ? C_OFF : C_DIM}>
                      {detail}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Lintel across the door line */}
            <rect x={gx0 - 12} y={140} width={n * MOD_W + 32} height={16} fill="#000" opacity={0.75} filter="url(#sb-soft)" />
            <rect x={gx0 - 16} y={134} width={n * MOD_W + 32} height={16} fill="url(#sb-wallh)" />
            <rect x={gx0 - 16} y={134} width={n * MOD_W + 32} height={2} fill="#c2c2cb" opacity={0.55} />

            {/* Side walls + dividers */}
            {[gx0 - 16, gx0 + n * MOD_W, ...Array.from({ length: n - 1 }, (_, k) => gx0 + (k + 1) * MOD_W - 8)].map((wx) => (
              <g key={wx}>
                <rect x={wx + 4} y={140} width={16} height={556} fill="#000" opacity={0.75} filter="url(#sb-soft)" />
                <rect x={wx} y={134} width={16} height={556} fill="url(#sb-wallv)" />
                <rect x={wx} y={134} width={2} height={556} fill="#c2c2cb" opacity={0.55} />
              </g>
            ))}

            {/* Vignette */}
            <rect width={svgW} height={SVG_H} fill="url(#sb-vig)" pointerEvents="none" />

            {/* Header: station badge + name */}
            <rect x={80} y={46} width={badgeW} height={42} rx={4} fill={C_AVAIL} />
            <text x={80 + badgeW / 2} y={76.4} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={27} fill="#050507">
              {station.id}
            </text>
            <text
              x={titleX}
              y={70.4}
              fontFamily={MONO}
              fontWeight={700}
              fontSize={titleSize}
              letterSpacing={titleLs}
              fill={C_TEXT}
              {...(titleSqueeze ? { textLength: titleRoom, lengthAdjust: "spacingAndGlyphs" as const } : {})}
            >
              {title}
            </text>
            <text x={titleX} y={94.2} fontFamily={MONO} fontSize={14.9} letterSpacing={6} fill={C_DIM}>
              APPLIANCE BAYS
            </text>

            {/* Header: availability summary */}
            <text x={svgW - 80} y={71.9} textAnchor="end" fontFamily={MONO} fontWeight={700} fontSize={19} letterSpacing={2} fill={C_TEXT}>
              {summary}
            </text>
            <text x={svgW - 80} y={95.5} textAnchor="end" fontFamily={MONO} fontSize={15} letterSpacing={3} fill={C_DIM}>
              {staffing} / {n} {n === 1 ? "BAY" : "BAYS"}
            </text>
          </svg>
        </div>
      </div>
    </Rnd>
  );
}
