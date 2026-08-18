"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Scene =
  | "boot"
  | "dispatch"
  | "radio"
  | "methane"
  | "triservice"
  | "clock"
  | "title"
  | "end";

const TIMELINE: { scene: Scene; ms: number }[] = [
  { scene: "boot", ms: 2800 },
  { scene: "dispatch", ms: 4200 },
  { scene: "radio", ms: 3800 },
  { scene: "methane", ms: 5600 },
  { scene: "triservice", ms: 3400 },
  { scene: "clock", ms: 3400 },
  { scene: "title", ms: 3800 },
  { scene: "end", ms: 999_999 },
];

const DISPATCH_LINES = [
  "22:47:03  999  RTC, M60 J17 WBD, two vehicles, persons reported",
  "22:47:41  999  PRIMARY FIRE, residential, Bolton BL1",
  "22:48:12  999  ALS, chest pain, Rochdale OL16",
  "22:48:55  GMP  disorder, Piccadilly Gardens, units requested",
  "22:49:20  999  MAKE PUMPS 6, commercial, Salford M5",
  "22:49:44  999  cardiac arrest, CPR in progress, Prestwich",
];

const RADIO_LINES = [
  { call: "MANCHESTER CENTRAL", msg: "G21 mobile from Philips Park" },
  { call: "NORTH WEST CONTROL", msg: "Charlie 7-4 en route, ETA four" },
  { call: "TANGO DELTA 22", msg: "Scene safe, commencing triage" },
  { call: "GM FIRE CONTROL", msg: "Make pumps six, aerial requested" },
  { call: "HART 47", msg: "On scene, hot zone established" },
];

const METHANE = [
  ["M", "Major incident declared"],
  ["E", "Exact location"],
  ["T", "Type of incident"],
  ["H", "Hazards, present and potential"],
  ["A", "Access and egress"],
  ["N", "Number of casualties"],
  ["E", "Emergency services present and required"],
];

export default function TrailerPage() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scene = TIMELINE[sceneIdx].scene;

  useEffect(() => {
    if (!playing) return;
    if (sceneIdx >= TIMELINE.length - 1) return;
    timerRef.current = setTimeout(
      () => setSceneIdx((i) => i + 1),
      TIMELINE[sceneIdx].ms
    );
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sceneIdx, playing]);

  const restart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSceneIdx(0);
    setPlaying(true);
  };

  const skip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSceneIdx(TIMELINE.length - 1);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-zinc-100 font-mono select-none">
      <style>{KEYFRAMES}</style>

      {/* Scanline + vignette overlay always on */}
      <div className="pointer-events-none absolute inset-0 z-30 scanlines" />
      <div className="pointer-events-none absolute inset-0 z-30 vignette" />

      {scene === "boot" && <SceneBoot />}
      {scene === "dispatch" && <SceneDispatch />}
      {scene === "radio" && <SceneRadio />}
      {scene === "methane" && <SceneMethane />}
      {scene === "triservice" && <SceneTriService />}
      {scene === "clock" && <SceneClock />}
      {scene === "title" && <SceneTitle />}
      {scene === "end" && <SceneEnd onReplay={restart} />}

      {/* HUD */}
      <div className="absolute bottom-4 left-4 z-40 text-[10px] tracking-[0.3em] text-zinc-500 uppercase">
        REC ● {new Date().toISOString().replace("T", " ").slice(0, 19)}
      </div>
      <div className="absolute bottom-4 right-4 z-40 flex gap-3 text-[10px] tracking-[0.3em] text-zinc-500 uppercase">
        <button onClick={restart} className="hover:text-zinc-200">
          ▸ replay
        </button>
        <button onClick={skip} className="hover:text-zinc-200">
          ⇥ skip
        </button>
      </div>
    </div>
  );
}

/* --------------------------- Scenes --------------------------- */

function SceneBoot() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 animate-[fadeIn_0.6s_ease-out]">
        <div className="h-2 w-2 rounded-full bg-red-500 animate-[pulse_1s_ease-in-out_infinite]" />
        <div className="text-[10px] tracking-[0.5em] text-zinc-500">
          SYSTEM INITIALISED
        </div>
        <div className="text-xs tracking-[0.3em] text-zinc-400 animate-[flicker_2.4s_steps(6,end)]">
          NORTH WEST REGIONAL CONTROL
        </div>
      </div>
    </div>
  );
}

function SceneDispatch() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-center px-12">
      <div className="mb-6 text-[10px] tracking-[0.4em] text-zinc-500">
        LIVE DISPATCH FEED ▾
      </div>
      <div className="space-y-2 text-sm md:text-base">
        {DISPATCH_LINES.map((line, i) => (
          <div
            key={i}
            className="opacity-0 animate-[dispatchIn_0.5s_ease-out_forwards]"
            style={{ animationDelay: `${i * 0.5}s` }}
          >
            <span className="text-red-400">▌</span>{" "}
            <span className="text-zinc-300">{line}</span>
          </div>
        ))}
      </div>
      <div className="mt-10 text-xs tracking-[0.3em] text-zinc-500 animate-[fadeIn_1s_1.5s_ease-out_both]">
        SIX ACTIVE INCIDENTS — ONE OPERATOR
      </div>
    </div>
  );
}

function SceneRadio() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-12">
      {RADIO_LINES.map((r, i) => (
        <div
          key={i}
          className="opacity-0 animate-[radioIn_0.45s_ease-out_forwards] flex items-baseline gap-4 w-full max-w-3xl"
          style={{ animationDelay: `${i * 0.55}s` }}
        >
          <span className="text-[10px] tracking-[0.3em] text-zinc-500 w-56 shrink-0">
            {r.call}
          </span>
          <span className="text-lg text-zinc-100">“{r.msg}”</span>
        </div>
      ))}
    </div>
  );
}

function SceneMethane() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8">
      <div className="mb-8 text-[10px] tracking-[0.5em] text-red-400 animate-[fadeIn_0.5s_ease-out]">
        ▲ MAJOR INCIDENT DECLARED ▲
      </div>
      <div className="space-y-1.5">
        {METHANE.map(([letter, label], i) => (
          <div
            key={i}
            className="opacity-0 animate-[methaneIn_0.5s_ease-out_forwards] flex items-baseline gap-5"
            style={{ animationDelay: `${0.4 + i * 0.45}s` }}
          >
            <span className="text-4xl md:text-5xl font-bold text-red-400 w-12">
              {letter}
            </span>
            <span className="text-sm md:text-base tracking-[0.15em] text-zinc-300 uppercase">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneTriService() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-10">
      <div className="text-center animate-[fadeIn_0.6s_ease-out]">
        <div className="text-[10px] tracking-[0.5em] text-zinc-500">
          ONE OPERATOR
        </div>
        <div className="mt-2 text-6xl md:text-8xl font-bold tracking-tight">
          THREE SERVICES
        </div>
      </div>
      <div className="flex gap-6 md:gap-10">
        <ServiceBadge
          label="FIRE"
          sub="GREATER MANCHESTER"
          color="bg-red-600"
          delay="0.6s"
        />
        <ServiceBadge
          label="AMBULANCE"
          sub="NORTH WEST"
          color="bg-emerald-500"
          delay="0.9s"
        />
        <ServiceBadge
          label="POLICE"
          sub="GMP / LANCASHIRE"
          color="bg-blue-500"
          delay="1.2s"
        />
      </div>
      <div className="text-xs tracking-[0.3em] text-zinc-500 animate-[fadeIn_1s_1.6s_ease-out_both]">
        JESIP — joint, interoperable, decisive
      </div>
    </div>
  );
}

function ServiceBadge({
  label,
  sub,
  color,
  delay,
}: {
  label: string;
  sub: string;
  color: string;
  delay: string;
}) {
  return (
    <div
      className="opacity-0 animate-[badgeIn_0.5s_ease-out_forwards] flex flex-col items-center gap-2"
      style={{ animationDelay: delay }}
    >
      <div className={`h-14 w-14 md:h-20 md:w-20 rounded ${color}`} />
      <div className="text-sm md:text-base font-bold tracking-[0.2em]">
        {label}
      </div>
      <div className="text-[9px] tracking-[0.3em] text-zinc-500">{sub}</div>
    </div>
  );
}

function SceneClock() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), 100);
    return () => clearInterval(id);
  }, []);
  const ms = t * 100;
  const mm = String(Math.floor(ms / 60000)).padStart(2, "0");
  const ss = String(Math.floor((ms / 1000) % 60)).padStart(2, "0");
  const cs = String(Math.floor((ms / 100) % 10));

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8">
      <div className="text-[10px] tracking-[0.5em] text-zinc-500 animate-[fadeIn_0.6s_ease-out]">
        TIME TO TURNOUT
      </div>
      <div className="text-7xl md:text-9xl font-bold tabular-nums tracking-tight">
        00:{mm}:{ss}.<span className="text-red-400">{cs}</span>
      </div>
      <div className="text-2xl md:text-3xl tracking-[0.2em] text-zinc-200 animate-[fadeIn_0.8s_1s_ease-out_both]">
        EVERY SECOND COUNTS
      </div>
    </div>
  );
}

function SceneTitle() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6">
      <div className="text-[10px] tracking-[0.5em] text-zinc-500 animate-[fadeIn_0.5s_ease-out]">
        A REAL-TIME SIMULATION
      </div>
      <div className="text-6xl md:text-8xl font-bold tracking-tight animate-[titleIn_1.2s_cubic-bezier(.2,.8,.2,1)_forwards]">
        THE WATCH ROOM
      </div>
      <div className="mt-2 text-sm md:text-base tracking-[0.3em] text-zinc-400 animate-[fadeIn_1s_1.2s_ease-out_both]">
        TAKE THE CHAIR
      </div>
    </div>
  );
}

function SceneEnd({ onReplay }: { onReplay: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-10 animate-[fadeIn_0.8s_ease-out]">
      <div className="text-4xl md:text-6xl font-bold tracking-tight">
        THE WATCH ROOM
      </div>
      <div className="text-xs tracking-[0.4em] text-zinc-500">COMING SOON</div>
      <button
        onClick={onReplay}
        className="mt-4 rounded border border-zinc-700 px-6 py-2 text-[11px] tracking-[0.4em] text-zinc-300 hover:bg-zinc-900"
      >
        ▸ PLAY AGAIN
      </button>
    </div>
  );
}

/* --------------------------- Keyframes --------------------------- */

const KEYFRAMES = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes flicker {
  0%, 100% { opacity: 1; }
  10% { opacity: 0.4; }
  12% { opacity: 1; }
  30% { opacity: 0.7; }
  32% { opacity: 1; }
  55% { opacity: 0.3; }
  57% { opacity: 1; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(1.6); }
}
@keyframes dispatchIn {
  from { opacity: 0; transform: translateX(-16px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes radioIn {
  from { opacity: 0; transform: translateY(10px); filter: blur(4px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}
@keyframes methaneIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes badgeIn {
  from { opacity: 0; transform: scale(0.8) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes titleIn {
  0% { opacity: 0; letter-spacing: 0.6em; transform: scale(0.92); }
  60% { opacity: 1; }
  100% { opacity: 1; letter-spacing: -0.02em; transform: scale(1); }
}
.scanlines {
  background: repeating-linear-gradient(
    to bottom,
    rgba(255,255,255,0.03) 0px,
    rgba(255,255,255,0.03) 1px,
    transparent 1px,
    transparent 3px
  );
  mix-blend-mode: overlay;
}
.vignette {
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%);
}
`;
