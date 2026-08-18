"use client";

// Story trailer — follows one incident from the caller's first
// sentence to a make-pumps-6 escalation. Same CRT / mono aesthetic
// as the montage trailer at /trailer but told beat-by-beat instead
// of feature-by-feature.
//
// Scene durations MUST stay in sync with SCENE_OFFSETS in ./audio.ts
// so the score (drone, ticks, string swell, impact, title chord)
// lands on the right beats.

import { useEffect, useRef, useState } from "react";
import { TrailerAudioEngine } from "./audio";

type Scene =
  | "silence"
  | "call"
  | "mobilise"
  | "onscene"
  | "escalation"
  | "clock"
  | "title"
  | "end";

const TIMELINE: { scene: Scene; ms: number }[] = [
  { scene: "silence",    ms: 3800 },
  { scene: "call",       ms: 7500 },
  { scene: "mobilise",   ms: 6800 },
  { scene: "onscene",    ms: 8500 },
  { scene: "escalation", ms: 4800 },
  { scene: "clock",      ms: 5400 },
  { scene: "title",      ms: 5000 },
  { scene: "end",        ms: 999_999 },
];

const CALLER_LINE =
  "Three cars piled up... there's smoke... someone's still in the cab...";

const MOBILISE = [
  { call: "G21 WHITEFIELD P1",   type: "Pump ladder",       eta: "04:32" },
  { call: "G21 WHITEFIELD P2",   type: "Second pump",        eta: "04:32" },
  { call: "G14 BURY P1",         type: "Pump ladder",        eta: "06:15" },
  { call: "R2 HEYWOOD",          type: "Technical rescue",   eta: "09:45" },
  { call: "G50 MANCHESTER A3",   type: "Aerial ladder",      eta: "08:20" },
  { call: "NWAS DCA-N14",        type: "Double-crewed amb.", eta: "05:10" },
];

const ONSCENE = [
  "22:52:12  G21-P1  IN ATTENDANCE — establishing water supply",
  "22:52:44  G21-P1  SITREP: fire in engine bay of vehicle 1",
  "22:53:20  G21-P2  CASUALTY LOCATED — driver, unconscious, trapped",
  "22:53:55  NWAS-N14  ON SCENE — pairing to casualty A",
  "22:54:31  G14-P1  HAZARD CONFIRMED — fuel leak, cordon extending",
  "22:55:08  G21-P1  BA TEAM COMMITTED — TOW 08 mins",
  "22:55:47  IC       MAKE PUMPS 6 — request confirmed",
];

export default function Trailer2Page() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  // Wall-clock elapsed time in the current scene. Also drives the HUD
  // countdown. Reset whenever sceneIdx changes.
  const [elapsedMs, setElapsedMs] = useState(0);
  const sceneStartRef = useRef<number>(0);
  const audioRef = useRef<TrailerAudioEngine | null>(null);

  const scene = TIMELINE[sceneIdx].scene;

  // One 100ms tick that owns everything: keeps elapsedMs current and
  // advances the scene when its duration has been reached. This is more
  // robust than one setTimeout-per-scene, which was subject to Strict
  // Mode double-invoke races we couldn't reproduce cleanly.
  useEffect(() => {
    sceneStartRef.current =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    setElapsedMs(0);
  }, [sceneIdx]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const e = now - sceneStartRef.current;
      setElapsedMs(e);
      if (sceneIdx >= TIMELINE.length - 1) return;
      if (e >= TIMELINE[sceneIdx].ms) {
        setSceneIdx((i) => Math.min(i + 1, TIMELINE.length - 1));
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [sceneIdx, playing]);

  // Kill audio on unmount so it doesn't survive a route change.
  useEffect(() => {
    return () => {
      audioRef.current?.stop();
      audioRef.current = null;
    };
  }, []);

  const stopAudio = () => {
    audioRef.current?.stop();
    audioRef.current = null;
  };

  const startAudio = async () => {
    const engine = new TrailerAudioEngine();
    await engine.start();
    audioRef.current = engine;
  };

  const toggleSound = async () => {
    if (soundOn) {
      stopAudio();
      setSoundOn(false);
      return;
    }
    // Enabling sound restarts the timeline so the score lines up with
    // the visuals from the top.
    setSceneIdx(0);
    setPlaying(true);
    await startAudio();
    setSoundOn(true);
  };

  const restart = () => {
    setSceneIdx(0);
    setPlaying(true);
    if (soundOn) {
      stopAudio();
      void startAudio();
    }
  };

  const skip = () => {
    setSceneIdx(TIMELINE.length - 1);
    stopAudio();
    setSoundOn(false);
  };

  const nextScene = () => {
    setSceneIdx((i) => Math.min(i + 1, TIMELINE.length - 1));
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black font-mono text-zinc-100 select-none">
      <style>{KEYFRAMES}</style>

      {/* Overlays — scanlines, vignette, subtle amber wash */}
      <div className="pointer-events-none absolute inset-0 z-30 scanlines" />
      <div className="pointer-events-none absolute inset-0 z-30 vignette" />
      <div className="pointer-events-none absolute inset-0 z-30 amber-wash" />

      {scene === "silence"    && <SceneSilence />}
      {scene === "call"       && (
        <SceneCall audio={soundOn ? audioRef.current : null} />
      )}
      {scene === "mobilise"   && <SceneMobilise />}
      {scene === "onscene"    && <SceneOnScene />}
      {scene === "escalation" && <SceneEscalation />}
      {scene === "clock"      && <SceneClock />}
      {scene === "title"      && (
        <SceneTitle audio={soundOn ? audioRef.current : null} />
      )}
      {scene === "end"        && <SceneEnd onReplay={restart} />}

      {/* HUD */}
      <div className="absolute bottom-4 left-4 z-40 text-[10px] uppercase tracking-[0.3em] text-zinc-500 tabular-nums">
        SOUTHERN SECTOR · REC ● · scene {sceneIdx + 1}/{TIMELINE.length} ·{" "}
        {scene} · {(elapsedMs / 1000).toFixed(1)}s /{" "}
        {(TIMELINE[sceneIdx].ms / 1000).toFixed(1)}s
      </div>
      <div className="absolute bottom-4 right-4 z-40 flex gap-4 text-[10px] uppercase tracking-[0.3em] text-zinc-500">
        <button
          onClick={toggleSound}
          className={
            "transition-colors " +
            (soundOn
              ? "text-amber-400 hover:text-amber-300"
              : "hover:text-zinc-200")
          }
          title={
            soundOn
              ? "Mute score"
              : "Enable score — will restart the trailer"
          }
        >
          {soundOn ? "♪ sound on" : "♪ sound off"}
        </button>
        <button onClick={nextScene} className="hover:text-zinc-200" title="Force next scene">
          ▶ next
        </button>
        <button onClick={restart} className="hover:text-zinc-200">▸ replay</button>
        <button onClick={skip} className="hover:text-zinc-200">⇥ skip</button>
      </div>
    </div>
  );
}

/* --------------------------- Scenes --------------------------- */

function SceneSilence() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6">
      <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-[quiet_2.2s_ease-in-out_infinite]" />
      <div className="text-[10px] uppercase tracking-[0.5em] text-zinc-600 animate-[fadeIn_0.6s_ease-out]">
        22:47 — Quiet
      </div>
      <div className="text-2xl uppercase tracking-[0.4em] text-zinc-300 animate-[fadeIn_1s_0.5s_ease-out_both]">
        Silence
      </div>
    </div>
  );
}

function SceneCall({ audio }: { audio: TrailerAudioEngine | null }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8">
      <div className="mb-8 flex items-center gap-3 text-[10px] uppercase tracking-[0.5em] text-red-400 animate-[pulseText_1.2s_ease-in-out_infinite]">
        <span className="h-2 w-2 rounded-full bg-red-500 animate-[pulse_0.9s_ease-in-out_infinite]" />
        999 · Incoming
      </div>
      <div className="max-w-3xl text-center text-2xl italic leading-relaxed text-zinc-200 md:text-3xl">
        <Typewriter
          text={CALLER_LINE}
          startDelayMs={800}
          charMs={55}
          onChar={audio ? () => audio.click() : undefined}
        />
      </div>
      <div className="mt-10 text-[11px] uppercase tracking-[0.4em] text-zinc-500 animate-[fadeIn_0.9s_3.6s_ease-out_both]">
        22:47:03 · RTC · M60 J17 WBD · persons reported
      </div>
    </div>
  );
}

function SceneMobilise() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-center px-12">
      <div className="mb-5 flex items-baseline justify-between text-[10px] uppercase tracking-[0.4em] text-zinc-500">
        <span>Pre-determined Attendance ▾</span>
        <span className="text-amber-400 animate-[fadeIn_0.4s_ease-out]">MOBILISING</span>
      </div>
      <div className="mx-auto grid w-full max-w-4xl gap-y-1.5">
        {MOBILISE.map((m, i) => (
          <div
            key={i}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] items-baseline gap-6 opacity-0 animate-[dispatchIn_0.7s_ease-out_forwards]"
            style={{ animationDelay: `${0.4 + i * 0.65}s` }}
          >
            <span className="text-[13px] tracking-[0.15em] text-zinc-100">
              {m.call}
            </span>
            <span className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">
              {m.type}
            </span>
            <span className="text-[11px] uppercase tracking-[0.3em] text-amber-400">
              Status 1
            </span>
            <span className="tabular-nums text-[13px] text-zinc-300">
              ETA {m.eta}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center text-[11px] uppercase tracking-[0.4em] text-zinc-500 animate-[fadeIn_0.9s_2.8s_ease-out_both]">
        one command · six callsigns · five minutes
      </div>
    </div>
  );
}

function SceneOnScene() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-center px-12">
      <div className="mb-4 text-[10px] uppercase tracking-[0.4em] text-zinc-500">
        Ground reports · live
      </div>
      <div className="mx-auto w-full max-w-4xl space-y-1.5">
        {ONSCENE.map((line, i) => {
          const isMakePumps = line.includes("MAKE PUMPS");
          return (
            <div
              key={i}
              className="opacity-0 animate-[radioIn_0.55s_ease-out_forwards]"
              style={{ animationDelay: `${0.3 + i * 0.85}s` }}
            >
              <span className={isMakePumps ? "text-red-400" : "text-amber-400"}>▌</span>{" "}
              <span
                className={
                  isMakePumps
                    ? "text-[14px] font-bold uppercase tracking-[0.1em] text-red-300"
                    : "text-[13px] tracking-[0.05em] text-zinc-300"
                }
              >
                {line}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SceneEscalation() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8">
      <div className="text-[10px] uppercase tracking-[0.5em] text-zinc-500 animate-[fadeIn_0.4s_ease-out]">
        Incident escalated
      </div>
      <div className="text-5xl font-bold uppercase tracking-[0.05em] text-red-400 md:text-7xl animate-[titleIn_0.9s_cubic-bezier(.2,.8,.2,1)_forwards]">
        Make Pumps 6
      </div>
      <div className="flex flex-wrap justify-center gap-3 text-[11px] uppercase tracking-[0.35em] text-zinc-400 md:gap-6 md:text-xs">
        {[
          "HEMS requested",
          "HART committed",
          "Police road closures",
          "MTC pre-alert",
          "Silver on scene",
        ].map((t, i) => (
          <span
            key={t}
            className="opacity-0 animate-[chipIn_0.55s_ease-out_forwards]"
            style={{ animationDelay: `${0.9 + i * 0.4}s` }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function SceneClock() {
  // Stopwatch-style counter, 100 ms resolution — feels frantic without
  // being illegible. Runs from the moment the scene mounts.
  const [t, setT] = useState(0);
  useEffect(() => {
    const start =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const id = window.setInterval(() => {
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      setT(now - start);
    }, 60);
    return () => window.clearInterval(id);
  }, []);
  const mm = String(Math.floor(t / 60000)).padStart(2, "0");
  const ss = String(Math.floor((t / 1000) % 60)).padStart(2, "0");
  const cs = String(Math.floor((t / 100) % 10));
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8">
      <div className="text-[10px] uppercase tracking-[0.5em] text-zinc-500 animate-[fadeIn_0.6s_ease-out]">
        Turnout clock
      </div>
      <div className="text-7xl md:text-9xl font-bold tabular-nums tracking-tight">
        00:{mm}:{ss}.<span className="text-red-400">{cs}</span>
      </div>
      <div className="text-2xl md:text-3xl uppercase tracking-[0.35em] text-zinc-200 animate-[fadeIn_0.8s_0.6s_ease-out_both]">
        Every second counts
      </div>
    </div>
  );
}

function SceneTitle({ audio }: { audio: TrailerAudioEngine | null }) {
  // Speak the tagline over the title reveal.
  useEffect(() => {
    if (!audio) return;
    const id = window.setTimeout(() => {
      audio.speak("The Watch Room. Take the chair.", {
        rate: 0.82,
        pitch: 0.85,
        volume: 0.85,
      });
    }, 700);
    return () => window.clearTimeout(id);
  }, [audio]);
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6">
      <div className="text-[10px] uppercase tracking-[0.5em] text-zinc-500 animate-[fadeIn_0.5s_ease-out]">
        A real-time simulation
      </div>
      <div className="animate-[titleIn_1.2s_cubic-bezier(.2,.8,.2,1)_forwards] text-6xl font-bold tracking-tight md:text-8xl">
        THE WATCH ROOM
      </div>
      <div className="mt-2 text-sm uppercase tracking-[0.35em] text-zinc-400 md:text-base animate-[fadeIn_1s_1.2s_ease-out_both]">
        Take the chair.
      </div>
    </div>
  );
}

function SceneEnd({ onReplay }: { onReplay: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-10 animate-[fadeIn_0.8s_ease-out]">
      <div className="text-4xl font-bold tracking-tight md:text-6xl">
        THE WATCH ROOM
      </div>
      <div className="text-xs uppercase tracking-[0.4em] text-zinc-500">
        Coming soon
      </div>
      <div className="flex gap-4">
        <button
          onClick={onReplay}
          className="rounded border border-zinc-700 px-6 py-2 text-[11px] uppercase tracking-[0.4em] text-zinc-300 hover:bg-zinc-900"
        >
          ▸ Play again
        </button>
        <a
          href="/trailer"
          className="rounded border border-zinc-700 px-6 py-2 text-[11px] uppercase tracking-[0.4em] text-zinc-300 hover:bg-zinc-900"
        >
          ⇤ Watch trailer 1
        </a>
      </div>
    </div>
  );
}

/* --------------------------- Typewriter --------------------------- */

function Typewriter({
  text,
  startDelayMs = 0,
  charMs = 40,
  onChar,
}: {
  text: string;
  startDelayMs?: number;
  charMs?: number;
  /** Fired once per revealed character. Used to trigger keyboard-click
   *  audio in sync with the reveal. Whitespace chars still fire so the
   *  cadence of the typing stays audible. */
  onChar?: () => void;
}) {
  const [shown, setShown] = useState("");
  // Keep the latest onChar in a ref so we don't restart the interval
  // when the caller's callback identity changes.
  const onCharRef = useRef(onChar);
  useEffect(() => {
    onCharRef.current = onChar;
  }, [onChar]);

  useEffect(() => {
    let cancelled = false;
    let i = 0;
    const start = window.setTimeout(() => {
      const id = window.setInterval(() => {
        if (cancelled) return;
        i += 1;
        setShown(text.slice(0, i));
        try {
          onCharRef.current?.();
        } catch {}
        if (i >= text.length) window.clearInterval(id);
      }, charMs);
    }, startDelayMs);
    return () => {
      cancelled = true;
      window.clearTimeout(start);
    };
  }, [text, startDelayMs, charMs]);
  return (
    <span>
      &ldquo;{shown}
      <span className="ml-0.5 inline-block h-[1.1em] w-[2px] bg-zinc-400 align-middle animate-[caret_0.9s_steps(1,end)_infinite]" />
      &rdquo;
    </span>
  );
}

/* --------------------------- Keyframes --------------------------- */

const KEYFRAMES = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.3; transform: scale(1.6); }
}
@keyframes pulseText {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.55; }
}
@keyframes quiet {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50%      { opacity: 1;    transform: scale(1.6); }
}
@keyframes dispatchIn {
  from { opacity: 0; transform: translateX(-14px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes radioIn {
  from { opacity: 0; transform: translateY(8px); filter: blur(3px); }
  to   { opacity: 1; transform: translateY(0);  filter: blur(0); }
}
@keyframes chipIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes titleIn {
  0%   { opacity: 0; letter-spacing: 0.6em; transform: scale(0.94); }
  60%  { opacity: 1; }
  100% { opacity: 1; letter-spacing: 0.02em; transform: scale(1); }
}
@keyframes caret {
  0%, 50%   { opacity: 1; }
  51%, 100% { opacity: 0; }
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
.amber-wash {
  background: radial-gradient(ellipse at 50% 55%, rgba(245,158,11,0.05), transparent 60%);
  mix-blend-mode: screen;
}
`;
