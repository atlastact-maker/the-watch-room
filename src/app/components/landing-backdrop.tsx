"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient "live ops console" backdrop for the landing page.
 *
 * Renders an animated canvas that looks like a watch-room at work — faint
 * grid, fixed station nodes, occasional incident pulses, and response movers
 * converging on them in service colours (red fire, green ambulance, blue
 * police). A rolling CAD ticker on the left reads real radio-style chatter.
 *
 * Everything is procedurally generated so there's no binary asset to ship,
 * and the whole thing bows out on `prefers-reduced-motion` to a single
 * static frame so we don't strobe users with vestibular triggers.
 */
export function LandingBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    // Local non-null alias so inner closures see a narrowed type.
    const ctx: CanvasRenderingContext2D = ctx2d;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Logical (CSS px) dimensions we draw into. We upscale the backing store
    // by DPR so the grid and strokes stay crisp on retina displays.
    let w = 0;
    let h = 0;
    let dpr = 1;
    function resize() {
      if (!canvas) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      seedStations();
    }

    // Station network — a fixed scatter of pale nodes that movers launch
    // from. Seeded by viewport so it's stable per-session but feels organic.
    type Station = { x: number; y: number };
    let stations: Station[] = [];
    function seedStations() {
      stations = [];
      const cols = Math.max(4, Math.floor(w / 180));
      const rows = Math.max(3, Math.floor(h / 180));
      const cellW = w / cols;
      const cellH = h / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Jitter each node within its cell so it doesn't read as a grid.
          const jx = (Math.sin(r * 13.7 + c * 7.1) * 0.5 + 0.5) * cellW * 0.7;
          const jy = (Math.cos(r * 11.3 + c * 9.7) * 0.5 + 0.5) * cellH * 0.7;
          stations.push({
            x: c * cellW + cellW * 0.15 + jx,
            y: r * cellH + cellH * 0.15 + jy,
          });
        }
      }
    }

    type Service = "fire" | "ambulance" | "police";
    const SERVICE_PALETTE: Record<Service, { fill: string; glow: string }> = {
      fire: { fill: "#f87171", glow: "rgba(248,113,113,0.55)" },
      ambulance: { fill: "#34d399", glow: "rgba(52,211,153,0.55)" },
      police: { fill: "#60a5fa", glow: "rgba(96,165,250,0.55)" },
    };

    type Incident = {
      x: number;
      y: number;
      spawnedAt: number;
      lifetimeMs: number;
      primary: Service;
    };
    const incidents: Incident[] = [];

    type Mover = {
      service: Service;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      startAt: number;
      durationMs: number;
      trail: { x: number; y: number; t: number }[];
    };
    const movers: Mover[] = [];

    function pickService(): Service {
      const r = Math.random();
      if (r < 0.5) return "fire";
      if (r < 0.85) return "ambulance";
      return "police";
    }

    function spawnIncident(now: number) {
      const margin = 80;
      const x = margin + Math.random() * Math.max(1, w - margin * 2);
      const y = margin + Math.random() * Math.max(1, h - margin * 2);
      const primary = pickService();
      incidents.push({
        x,
        y,
        spawnedAt: now,
        lifetimeMs: 8000 + Math.random() * 4000,
        primary,
      });
      // Dispatch 2–3 movers from the nearest stations, usually spanning
      // multiple services so the viewer gets the multi-agency story.
      const nearestSorted = stations
        .slice()
        .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
      const count = 2 + (Math.random() < 0.5 ? 1 : 0);
      const serviceOrder: Service[] = [primary];
      // Second/third rollers: vary by weighted roll, biased away from primary.
      for (let i = 1; i < count; i++) {
        const pool: Service[] = ["fire", "ambulance", "police"].filter(
          (s) => s !== primary,
        ) as Service[];
        serviceOrder.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      for (let i = 0; i < count && i < nearestSorted.length; i++) {
        const st = nearestSorted[i];
        movers.push({
          service: serviceOrder[i] ?? primary,
          fromX: st.x,
          fromY: st.y,
          toX: x,
          toY: y,
          startAt: now + i * 400, // staggered start
          durationMs: 4500 + Math.random() * 2500,
          trail: [],
        });
      }
    }

    let lastSpawnAt = 0;
    let rafId = 0;
    function frame(t: number) {
      const now = t;
      // Background wash — slight translucent overlay rather than full clear
      // so a soft trail follows everything. Reduces visual noise + adds
      // depth at no extra cost.
      ctx.fillStyle = "rgba(5,5,7,0.22)";
      ctx.fillRect(0, 0, w * dpr, h * dpr);

      // Reset to a fresh coordinate system scaled by DPR for everything we
      // draw this frame (so our numbers are in CSS pixels).
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      drawGrid();
      drawStations();

      // Spawn incidents on a cadence — slightly random so it doesn't tick.
      if (!reduce && now - lastSpawnAt > 1500 + Math.random() * 1200) {
        spawnIncident(now);
        lastSpawnAt = now;
      }

      // Update + draw movers
      for (let i = movers.length - 1; i >= 0; i--) {
        const m = movers[i];
        const dt = now - m.startAt;
        if (dt < 0) continue;
        const prog = Math.min(1, dt / m.durationMs);
        const { x, y } = curvePoint(m, prog);
        m.trail.push({ x, y, t: now });
        // Cap trail length to avoid unbounded growth over long sessions.
        while (m.trail.length > 32) m.trail.shift();
        drawMoverTrail(m);
        drawMoverDot(m, x, y);
        if (prog >= 1) movers.splice(i, 1);
      }

      // Update + draw incidents
      for (let i = incidents.length - 1; i >= 0; i--) {
        const inc = incidents[i];
        const age = now - inc.spawnedAt;
        if (age > inc.lifetimeMs) {
          incidents.splice(i, 1);
          continue;
        }
        drawIncident(inc, age);
      }

      if (!reduce) rafId = requestAnimationFrame(frame);
    }

    function drawGrid() {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      const step = 48;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawStations() {
      ctx.save();
      for (const s of stations) {
        ctx.fillStyle = "rgba(251,191,36,0.25)";
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(251,191,36,0.18)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawIncident(inc: Incident, age: number) {
      const pal = SERVICE_PALETTE[inc.primary];
      const lifeFrac = age / inc.lifetimeMs;
      const fade = 1 - lifeFrac;
      ctx.save();
      // Expanding ring (pulse)
      const ringAge = (age % 1400) / 1400;
      ctx.globalAlpha = (1 - ringAge) * 0.55 * fade;
      ctx.strokeStyle = pal.fill;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(inc.x, inc.y, 6 + ringAge * 40, 0, Math.PI * 2);
      ctx.stroke();
      // Core dot
      ctx.globalAlpha = 0.85 * fade;
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      ctx.arc(inc.x, inc.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // Cross
      ctx.globalAlpha = 0.55 * fade;
      ctx.strokeStyle = pal.fill;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(inc.x - 10, inc.y);
      ctx.lineTo(inc.x + 10, inc.y);
      ctx.moveTo(inc.x, inc.y - 10);
      ctx.lineTo(inc.x, inc.y + 10);
      ctx.stroke();
      ctx.restore();
    }

    function drawMoverTrail(m: Mover) {
      if (m.trail.length < 2) return;
      const pal = SERVICE_PALETTE[m.service];
      ctx.save();
      ctx.strokeStyle = pal.fill;
      ctx.lineWidth = 1.25;
      for (let i = 1; i < m.trail.length; i++) {
        const a = m.trail[i - 1];
        const b = m.trail[i];
        ctx.globalAlpha = (i / m.trail.length) * 0.35;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawMoverDot(m: Mover, x: number, y: number) {
      const pal = SERVICE_PALETTE[m.service];
      ctx.save();
      ctx.shadowColor = pal.glow;
      ctx.shadowBlur = 8;
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Slight bezier curve so routes don't look like lasers.
    function curvePoint(m: Mover, t: number): { x: number; y: number } {
      const dx = m.toX - m.fromX;
      const dy = m.toY - m.fromY;
      const mx = (m.fromX + m.toX) / 2;
      const my = (m.fromY + m.toY) / 2;
      // Perpendicular offset, scaled by distance and a stable per-mover sign
      // (derived from start time so it doesn't flicker).
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const sign = m.startAt % 2 === 0 ? 1 : -1;
      const bend = Math.min(len * 0.14, 45) * sign;
      const cx = mx + nx * bend;
      const cy = my + ny * bend;
      const u = 1 - t;
      return {
        x: u * u * m.fromX + 2 * u * t * cx + t * t * m.toX,
        y: u * u * m.fromY + 2 * u * t * cy + t * t * m.toY,
      };
    }

    resize();
    // Seed a few incidents immediately so the screen isn't empty on first paint.
    if (!reduce) {
      spawnIncident(0);
      spawnIncident(200);
      spawnIncident(400);
    }

    if (reduce) {
      // Single static frame for reduced-motion users.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#050507";
      ctx.fillRect(0, 0, w, h);
      drawGrid();
      drawStations();
    } else {
      rafId = requestAnimationFrame(frame);
    }

    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Radio-traffic ticker — procedurally shuffled CAD-style log lines. The
  // lines animate in via CSS transitions, restart via React state, and the
  // DOM is small (three lines at any time) so it's cheap.
  useEffect(() => {
    const el = tickerRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const lines = [
      "G50-P1 · Status 1 · mobile Wythenshawe",
      "A-BOL-D3 · Status 5 · at Royal Oldham",
      "G39-P1 · Stop message sent · on scene",
      "HELIMED 72 · requested for trauma",
      "G10-PM1 · mobile carrying HVP",
      "ARV 24 · en route · armed support",
      "G24-R6 · USAR team on scene",
      "Make pumps 6 · 02 Dwelling Fire Wythenshawe",
      "A-MAN-D7 · Status 1 · mobile to RTC",
      "G57-R2 · TRU en route · RTC entrapment",
      "BA crew committed · 2 wearers · 300 bar",
      "Hydrant H2 in use · G12-P1",
      "NPAS 21 · airborne · Stockport",
      "G01-A3 · Aerial cage in use",
      "HART1 · requested · water rescue",
      "Dog unit en route · missing person",
      "OFFICER · scene command · G50 WM",
      "Relay hose 70mm · G12 → G50",
      "Firebreak cut · Wildfire WFU L2",
      "CCC · paediatric trauma · Manchester Royal",
    ];
    let i = 0;
    const push = () => {
      const line = lines[i % lines.length];
      i++;
      const row = document.createElement("div");
      row.className =
        "opacity-0 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) transition-opacity duration-500";
      row.textContent = `⎋ ${line}`;
      el.appendChild(row);
      // Fade in next tick.
      requestAnimationFrame(() => {
        row.style.opacity = "0.65";
      });
      // Keep at most 8 rows on screen.
      while (el.children.length > 8) {
        el.removeChild(el.firstChild!);
      }
    };
    push();
    const id = setInterval(push, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        // Opacity + masks tuned so the animation is felt, not read. Text on
        // top of it stays fully readable.
        style={{
          opacity: 0.55,
          maskImage:
            "radial-gradient(120% 90% at 50% 50%, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 95%)",
          WebkitMaskImage:
            "radial-gradient(120% 90% at 50% 50%, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 95%)",
        }}
      />
      {/* Vignette — pulls focus to the centre text block. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 40%, rgba(5,5,7,0) 40%, rgba(5,5,7,0.55) 80%, rgba(5,5,7,0.85) 100%)",
        }}
      />
      {/* Radio ticker column — bottom-left of the viewport. */}
      <div
        ref={tickerRef}
        className="absolute bottom-4 left-4 flex w-[280px] flex-col gap-0.5 sm:bottom-6 sm:left-6"
        style={{
          maskImage:
            "linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0.9) 60%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0.9) 60%, rgba(0,0,0,0) 100%)",
        }}
      />
    </div>
  );
}
