"use client";

// The defibrillator-monitor screen.
//
// A real sweeping trace rather than a label saying "VF", because reading
// the rhythm is the skill the operator is meant to be learning. It sweeps
// left to right at 25 mm/s with an erase bar ahead of the cursor, the way
// a Corpuls or a LIFEPAK does, and it carries the UK colour convention:
// ECG green, capnography yellow, SpO2 cyan, pressures white.
//
// Two details matter more than the prettiness. During compressions the
// trace is buried in mechanical artefact and genuinely cannot be read —
// which is precisely why the ALS loop has a rhythm check every two
// minutes rather than continuous assessment. And PEA draws as organised
// complexes marching across the screen looking entirely perfusing; the
// only thing that gives it away is the absent pulse and the capnography.

import { useEffect, useRef } from "react";
import {
  TRACE_COLOURS,
  capnoSample,
  displayedRate,
  ecgSample,
  type TraceRhythm,
} from "@/lib/sim/ecg";

/** Sweep speed. 25 mm/s is the ECG standard; at roughly 2.4 px/mm this
 *  lands at 60 px per second, which fits ~8 s on a panel-width screen. */
const PX_PER_SEC = 60;
const ECG_H = 92;
const CAPNO_H = 46;
const ERASE_W = 14;

export function MonitorScreen({
  rhythm,
  compressions,
  capnographyOn,
  etco2,
  hr,
  spo2,
  bpSys,
  bpDia,
  leadLabel,
  hasOutput,
}: {
  rhythm: TraceRhythm;
  compressions: boolean;
  capnographyOn: boolean;
  etco2: number;
  hr?: number;
  spo2?: number;
  bpSys?: number;
  bpDia?: number;
  leadLabel: string;
  /** True once there is a pulse — changes what the rate field means. */
  hasOutput: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  // Live values the animation loop reads, so changing them never restarts
  // the sweep.
  const live = useRef({ rhythm, compressions, capnographyOn, etco2 });
  live.current = { rhythm, compressions, capnographyOn, etco2 };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = 0;
    let raf = 0;
    let x = 0;
    let startedAt = performance.now();
    let lastEcgY: number | null = null;
    let lastCapY: number | null = null;

    const capnoTop = () => ECG_H;
    const totalH = () => ECG_H + (live.current.capnographyOn ? CAPNO_H : 0);

    function resize() {
      if (!canvas || !wrap) return;
      width = Math.max(180, wrap.clientWidth);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(totalH() * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${totalH()}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintBackground(ctx);
      x = 0;
      lastEcgY = null;
      lastCapY = null;
      startedAt = performance.now();
    }

    function paintBackground(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = "#05070a";
      ctx.fillRect(0, 0, width, totalH());
      // Faint graticule — 0.2 s / 5 mm squares.
      ctx.strokeStyle = "rgba(148,163,184,0.10)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = 0; gx <= width; gx += 12) {
        ctx.moveTo(gx + 0.5, 0);
        ctx.lineTo(gx + 0.5, totalH());
      }
      for (let gy = 0; gy <= totalH(); gy += 12) {
        ctx.moveTo(0, gy + 0.5);
        ctx.lineTo(width, gy + 0.5);
      }
      ctx.stroke();
      if (live.current.capnographyOn) {
        ctx.strokeStyle = "rgba(148,163,184,0.30)";
        ctx.beginPath();
        ctx.moveTo(0, ECG_H + 0.5);
        ctx.lineTo(width, ECG_H + 0.5);
        ctx.stroke();
      }
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let prevNow = performance.now();
    function frame(now: number) {
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;
      const dt = Math.min(0.25, (now - prevNow) / 1000);
      prevNow = now;
      const advance = dt * PX_PER_SEC;
      const steps = Math.max(1, Math.ceil(advance));
      const stepPx = advance / steps;

      for (let i = 0; i < steps; i++) {
        const prevX = x;
        x += stepPx;
        if (x >= width) {
          x -= width;
          lastEcgY = null;
          lastCapY = null;
        }
        const t = (now - startedAt) / 1000 + (i * stepPx) / PX_PER_SEC;

        // Erase bar ahead of the cursor.
        ctx.fillStyle = "#05070a";
        ctx.fillRect(x, 0, ERASE_W, totalH());
        ctx.strokeStyle = "rgba(148,163,184,0.10)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let gy = 0; gy <= totalH(); gy += 12) {
          ctx.moveTo(x, gy + 0.5);
          ctx.lineTo(x + ERASE_W, gy + 0.5);
        }
        ctx.stroke();
        if (live.current.capnographyOn) {
          ctx.strokeStyle = "rgba(148,163,184,0.30)";
          ctx.beginPath();
          ctx.moveTo(x, ECG_H + 0.5);
          ctx.lineTo(x + ERASE_W, ECG_H + 0.5);
          ctx.stroke();
        }

        // --- ECG ---
        const v = ecgSample(live.current.rhythm, t, {
          compressions: live.current.compressions,
        });
        const mid = ECG_H * 0.62;
        const y = mid - v * (ECG_H * 0.34);
        if (x >= prevX) {
          ctx.strokeStyle = TRACE_COLOURS.ecg;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(prevX, lastEcgY ?? y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        lastEcgY = y;

        // --- Capnography ---
        if (live.current.capnographyOn) {
          const kpa = capnoSample(t, live.current.etco2);
          const base = capnoTop() + CAPNO_H - 8;
          const cy = base - (kpa / 8) * (CAPNO_H - 14);
          if (x >= prevX) {
            ctx.strokeStyle = TRACE_COLOURS.co2;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(prevX, lastCapY ?? cy);
            ctx.lineTo(x, cy);
            ctx.stroke();
          }
          lastCapY = cy;
        }
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // Re-create the loop only when the capnography lane appears or goes,
    // because that changes the canvas height.
  }, [capnographyOn]);

  const rate = displayedRate(rhythm);
  return (
    <div className="overflow-hidden rounded-sm border border-(--color-border)">
      <div className="flex">
        {/* Traces */}
        <div ref={wrapRef} className="min-w-0 flex-1 bg-[#05070a]">
          <canvas ref={canvasRef} className="block" />
        </div>
        {/* Numeric column, as it sits on a real monitor */}
        <div className="w-[74px] shrink-0 border-l border-(--color-border) bg-[#05070a] px-1.5 py-1">
          <Num
            label={leadLabel}
            value={rate === null ? "--" : String(Math.round(hasOutput ? (hr ?? rate) : rate))}
            unit="bpm"
            colour={TRACE_COLOURS.ecg}
          />
          <Num
            label="SpO₂"
            value={hasOutput && spo2 !== undefined ? String(Math.round(spo2)) : "--"}
            unit="%"
            colour={TRACE_COLOURS.spo2}
          />
          <Num
            label="EtCO₂"
            value={capnographyOn ? etco2.toFixed(1) : "--"}
            unit="kPa"
            colour={TRACE_COLOURS.co2}
          />
          <Num
            label="NIBP"
            value={
              hasOutput && bpSys !== undefined && bpDia !== undefined
                ? `${Math.round(bpSys)}/${Math.round(bpDia)}`
                : "--"
            }
            unit=""
            colour={TRACE_COLOURS.bp}
            small
          />
        </div>
      </div>
      {/* Status strip */}
      <div className="flex items-center justify-between gap-2 border-t border-(--color-border) bg-[#0a0d12] px-2 py-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
          {compressions ? "Compression artefact — pause to assess" : "25 mm/s"}
        </span>
        {!hasOutput && (
          <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-critical)">
            No output
          </span>
        )}
      </div>
    </div>
  );
}

function Num({
  label,
  value,
  unit,
  colour,
  small,
}: {
  label: string;
  value: string;
  unit: string;
  colour: string;
  small?: boolean;
}) {
  return (
    <div className="mb-1 leading-none">
      <div className="text-[8px] uppercase tracking-widest" style={{ color: colour, opacity: 0.75 }}>
        {label}
      </div>
      <div
        className={`font-mono tabular-nums ${small ? "text-[13px]" : "text-[17px]"}`}
        style={{ color: colour }}
      >
        {value}
        {unit && <span className="ml-0.5 text-[8px] opacity-70">{unit}</span>}
      </div>
    </div>
  );
}
