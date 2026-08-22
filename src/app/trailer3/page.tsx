"use client";

// TikTok cut — vertical 9:16 trailer, ~30 s, auto-looping.
//
// Beats:
//   1. call     — 999 header + incident details typing out
//   2. turnout  — phone-style station alert with a racing countdown
//   3. mobilise — CAD log streaming units to the job + live counter
//   4. standby  — STAND BY… IN DEVELOPMENT… COMING SOON → title
//
// The stage is a clean 9:16 frame centred on screen with all controls
// OUTSIDE it, so a screen recording of the frame needs no cropping of
// UI. The whole thing loops automatically for easy capture.

import { useEffect, useRef, useState } from "react";

type Scene = "call" | "turnout" | "mobilise" | "standby";

const TIMELINE: { scene: Scene; ms: number }[] = [
  { scene: "call", ms: 7500 },
  { scene: "turnout", ms: 6500 },
  { scene: "mobilise", ms: 9000 },
  { scene: "standby", ms: 9500 },
];
const TOTAL_MS = TIMELINE.reduce((s, t) => s + t.ms, 0);

const ADDRESS_LINES = [
  "HOUSE FIRE — PERSONS REPORTED",
  "285 HOLLYHEDGE ROAD",
  "WYTHENSHAWE · M22 4QR",
  "CALLER STATES CHILD UPSTAIRS",
];

const MOBILISE_LINES: { text: string; service: "F" | "A" | "P" | "X" }[] = [
  { text: "G15-P1 · MOBILE", service: "F" },
  { text: "G15-P2 · MOBILE", service: "F" },
  { text: "G50-P1 · MOBILE", service: "F" },
  { text: "A-547 · MOBILE", service: "A" },
  { text: "RX-201 · MOBILE", service: "A" },
  { text: "MP66-21 · MOBILE", service: "P" },
  { text: "G50-A3 · AERIAL MOBILE", service: "F" },
  { text: "HELIMED 72 · LIFTING", service: "A" },
  { text: "MAKE PUMPS 6", service: "X" },
  { text: "RP-07 · CLOSING THE ROAD", service: "P" },
];

export default function Trailer3Page() {
  const [runId, setRunId] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = performance.now();
    setElapsed(0);
    const id = window.setInterval(() => {
      const e = performance.now() - startRef.current;
      if (e >= TOTAL_MS + 1200) {
        // Loop — bump runId so every typewriter/animation remounts.
        setRunId((r) => r + 1);
        return;
      }
      setElapsed(e);
    }, 100);
    return () => window.clearInterval(id);
  }, [runId]);

  // Which scene + local time within it.
  let acc = 0;
  let scene: Scene = "call";
  let local = 0;
  for (const t of TIMELINE) {
    if (elapsed < acc + t.ms) {
      scene = t.scene;
      local = elapsed - acc;
      break;
    }
    acc += t.ms;
    scene = t.scene;
    local = elapsed - acc + t.ms;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black font-mono text-zinc-100 select-none">
      <style>{KEYFRAMES}</style>

      {/* Side-gutter controls — OUTSIDE the 9:16 stage. */}
      <div className="absolute left-4 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-3 text-[10px] uppercase tracking-[0.3em] text-zinc-600">
        <span>9:16</span>
        <span>tiktok cut</span>
        <button
          onClick={() => setRunId((r) => r + 1)}
          className="text-zinc-400 hover:text-zinc-100"
        >
          ▸ replay
        </button>
        <span className="text-zinc-700">loops auto</span>
      </div>

      {/* The 9:16 stage */}
      <div
        key={runId}
        className="relative overflow-hidden bg-[#050507]"
        style={{ height: "100vh", aspectRatio: "9 / 16", maxWidth: "100vw" }}
      >
        {/* texture */}
        <div className="scan pointer-events-none absolute inset-0 z-30" />
        <div className="vignette pointer-events-none absolute inset-0 z-30" />

        {scene === "call" && <SceneCall />}
        {scene === "turnout" && <SceneTurnout localMs={local} />}
        {scene === "mobilise" && <SceneMobilise localMs={local} />}
        {scene === "standby" && <SceneStandby localMs={local} />}
      </div>
    </div>
  );
}

/* ------------------------------ scenes ------------------------------ */

function SceneCall() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-center px-7">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-red-400">
        <span className="size-2 animate-[pulse_0.9s_ease-in-out_infinite] rounded-full bg-red-500" />
        999 · 03:12
      </div>
      <div className="mt-6 space-y-3">
        {ADDRESS_LINES.map((line, i) => (
          <TypeLine
            key={line}
            text={line}
            startDelayMs={500 + i * 1500}
            charMs={38}
            className={
              i === 0
                ? "text-[22px] font-bold leading-snug text-zinc-50"
                : i === ADDRESS_LINES.length - 1
                  ? "text-[15px] text-red-400"
                  : "text-[15px] text-zinc-300"
            }
          />
        ))}
      </div>
      <div className="mt-10 text-[10px] uppercase tracking-[0.4em] text-zinc-600 opacity-0 animate-[fadeIn_0.8s_6s_ease-out_forwards]">
        North West Regional Control
      </div>
    </div>
  );
}

function SceneTurnout({ localMs }: { localMs: number }) {
  // Countdown races from 90.0 down to 0 across the scene.
  const remain = Math.max(0, 90 * (1 - localMs / 5800));
  const done = remain <= 0;
  const ss = String(Math.floor(remain)).padStart(2, "0");
  const ds = String(Math.floor((remain % 1) * 10));
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 px-7">
      {/* Phone-style alert card */}
      <div className="w-full animate-[alertIn_0.4s_cubic-bezier(.2,.9,.3,1.4)_forwards] rounded-2xl border border-zinc-700 bg-zinc-900/95 p-5 shadow-2xl">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-zinc-500">
          <span>NWFC · Turnout</span>
          <span>now</span>
        </div>
        <div className="mt-2 text-[17px] font-bold leading-snug">
          G15 WYTHENSHAWE — TURN OUT
        </div>
        <div className="mt-1 text-[13px] text-zinc-400">
          House fire · persons reported · pump + pump ladder
        </div>
      </div>

      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[0.5em] text-zinc-500">
          Turnout target
        </div>
        <div
          className={
            "mt-2 text-[84px] font-bold leading-none tabular-nums tracking-tight " +
            (done ? "text-emerald-400" : remain < 20 ? "text-red-400" : "text-zinc-50")
          }
        >
          {done ? "GONE" : `${ss}.${ds}`}
        </div>
        {!done && (
          <div className="mt-2 text-[11px] uppercase tracking-[0.4em] text-zinc-500">
            seconds
          </div>
        )}
        {done && (
          <div className="mt-2 animate-[fadeIn_0.3s_ease-out] text-[11px] uppercase tracking-[0.4em] text-emerald-400">
            Doors up · lights on
          </div>
        )}
      </div>
    </div>
  );
}

function SceneMobilise({ localMs }: { localMs: number }) {
  const shown = Math.min(
    MOBILISE_LINES.length,
    Math.floor(localMs / 750),
  );
  const mobile = Math.min(shown, MOBILISE_LINES.filter((l) => l.service !== "X").length);
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-center px-7">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-500">
          Assigned resources
        </span>
        <span className="text-[26px] font-bold tabular-nums text-amber-400">
          {mobile}
        </span>
      </div>
      <ul className="mt-4 space-y-2.5">
        {MOBILISE_LINES.slice(0, shown).map((l) => (
          <li
            key={l.text}
            className="flex items-center gap-3 animate-[slideIn_0.3s_ease-out]"
          >
            <span
              className="inline-block h-3 w-3 rounded-[2px]"
              style={{
                background:
                  l.service === "F"
                    ? "#ef4444"
                    : l.service === "A"
                      ? "#10b981"
                      : l.service === "P"
                        ? "#3b82f6"
                        : "#f59e0b",
              }}
            />
            <span
              className={
                l.service === "X"
                  ? "text-[17px] font-bold tracking-[0.1em] text-amber-400"
                  : "text-[15px] tracking-[0.08em] text-zinc-200"
              }
            >
              {l.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SceneStandby({ localMs }: { localMs: number }) {
  const stage =
    localMs < 2400 ? 0 : localMs < 4800 ? 1 : localMs < 6800 ? 2 : 3;
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 px-7 text-center">
      {stage === 0 && (
        <div className="animate-[fadeIn_0.5s_ease-out] text-[30px] font-bold tracking-[0.25em] text-zinc-200">
          STAND BY…
        </div>
      )}
      {stage === 1 && (
        <div className="animate-[fadeIn_0.5s_ease-out] text-[26px] font-bold tracking-[0.2em] text-amber-400">
          IN DEVELOPMENT…
        </div>
      )}
      {stage === 2 && (
        <div className="animate-[fadeIn_0.5s_ease-out] text-[34px] font-bold tracking-[0.18em] text-zinc-50">
          COMING SOON
        </div>
      )}
      {stage === 3 && (
        <>
          <div className="animate-[titleIn_1s_cubic-bezier(.2,.8,.2,1)_forwards] text-[40px] font-bold leading-tight tracking-tight">
            THE WATCH
            <br />
            ROOM
          </div>
          <div className="animate-[fadeIn_0.8s_0.7s_ease-out_both] text-[11px] uppercase tracking-[0.4em] text-zinc-400">
            Take the chair.
          </div>
          <div className="animate-[fadeIn_0.8s_1.2s_ease-out_both] text-[10px] uppercase tracking-[0.3em] text-zinc-600">
            UK emergency dispatch sim
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------- typewriter ---------------------------- */

function TypeLine({
  text,
  startDelayMs,
  charMs,
  className,
}: {
  text: string;
  startDelayMs: number;
  charMs: number;
  className?: string;
}) {
  const [shown, setShown] = useState("");
  const [started, setStarted] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let i = 0;
    const start = window.setTimeout(() => {
      if (cancelled) return;
      setStarted(true);
      const id = window.setInterval(() => {
        if (cancelled) return;
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length) window.clearInterval(id);
      }, charMs);
    }, startDelayMs);
    return () => {
      cancelled = true;
      window.clearTimeout(start);
    };
  }, [text, startDelayMs, charMs]);
  if (!started) return <div className={className}>&nbsp;</div>;
  const complete = shown.length >= text.length;
  return (
    <div className={className}>
      {shown}
      {!complete && (
        <span className="ml-0.5 inline-block h-[1em] w-[3px] translate-y-[2px] bg-amber-400 animate-[caret_0.8s_steps(1,end)_infinite]" />
      )}
    </div>
  );
}

/* ----------------------------- keyframes ----------------------------- */

const KEYFRAMES = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.3; transform: scale(1.5); }
}
@keyframes caret {
  0%, 50%   { opacity: 1; }
  51%, 100% { opacity: 0; }
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-14px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes alertIn {
  from { opacity: 0; transform: translateY(-30px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes titleIn {
  0%   { opacity: 0; letter-spacing: 0.4em; transform: scale(0.94); }
  60%  { opacity: 1; }
  100% { opacity: 1; letter-spacing: 0em; transform: scale(1); }
}
.scan {
  background-image: linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px);
}
.vignette {
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%);
}
`;
