"use client";

// Gameplay trailer — vertical 9:16, ~34 s, auto-looping.
//
// The "first login" cut: a player lands on the site, creates an
// operator account and drops into the ops-centre menu.
//
// Beats:
//   1. browser — URL types out, landing page materialises, cursor → SIGN UP
//   2. signup  — terminal registration form filling itself in
//   3. menu    — ops centre builds, cursor hovers START SHIFT, click
//   4. standby — STAND BY… IN DEVELOPMENT… COMING SOON → title
//
// Same stage conventions as trailer3: clean 9:16 frame, all controls
// outside it, loops automatically for easy screen capture.

import { useEffect, useRef, useState } from "react";

type Scene = "browser" | "signup" | "menu" | "standby";

const TIMELINE: { scene: Scene; ms: number }[] = [
  { scene: "browser", ms: 8000 },
  { scene: "signup", ms: 10000 },
  { scene: "menu", ms: 8500 },
  { scene: "standby", ms: 9500 },
];
const TOTAL_MS = TIMELINE.reduce((s, t) => s + t.ms, 0);

const URL_TEXT = "the-watch-room.vercel.app";
const CALLSIGN_TEXT = "WR-104";
const EMAIL_TEXT = "operator@outlook.com";
const PASSWORD_TEXT = "•••••••••••••";

const CONSOLE_LINES: { time: string; text: string; service: "F" | "A" | "P" }[] = [
  { time: "19:42:11", text: "Cat 2 · chest pain · Salford M6", service: "A" },
  { time: "19:42:38", text: "Grade 1 · RTC · damage only · Bury BL9", service: "P" },
  { time: "19:43:02", text: "AFA · commercial premises · Stockport SK1", service: "F" },
];

export default function Trailer4Page() {
  const [runId, setRunId] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const toggleSound = () => {
    if (soundOn) {
      audioRef.current?.close().catch(() => {});
      audioRef.current = null;
      setSoundOn(false);
      return;
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    audioRef.current = new Ctor();
    setSoundOn(true);
    setRunId((r) => r + 1);
  };

  // ---- suspense bed (retimed from the TikTok cut) ----
  const musicNodesRef = useRef<AudioScheduledSourceNode[]>([]);
  const musicGainRef = useRef<GainNode | null>(null);
  const stopMusic = () => {
    const ctx = audioRef.current;
    if (musicGainRef.current && ctx) {
      try {
        const g = musicGainRef.current.gain;
        g.cancelScheduledValues(ctx.currentTime);
        g.setValueAtTime(g.value, ctx.currentTime);
        g.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      } catch {}
    }
    for (const n of musicNodesRef.current) {
      try {
        n.stop(audioRef.current ? audioRef.current.currentTime + 0.25 : 0);
      } catch {}
    }
    musicNodesRef.current = [];
    musicGainRef.current = null;
  };
  const startMusic = () => {
    const ctx = audioRef.current;
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const END = 37;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.5, t0);
    master.gain.setValueAtTime(0.5, t0 + END - 0.4);
    master.gain.linearRampToValueAtTime(0, t0 + END);
    master.connect(ctx.destination);
    musicGainRef.current = master;
    const nodes = musicNodesRef.current;

    // Sub drone — D1 saws through a breathing lowpass.
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 260;
    droneFilter.Q.value = 3;
    for (const det of [0, 7]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = 36.71;
      o.detune.value = det;
      o.connect(droneFilter);
      o.start(t0);
      o.stop(t0 + END);
      nodes.push(o);
    }
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0, t0);
    droneGain.gain.linearRampToValueAtTime(0.2, t0 + 2);
    droneGain.gain.linearRampToValueAtTime(0.2, t0 + END - 1);
    droneGain.gain.linearRampToValueAtTime(0, t0 + END);
    droneFilter.connect(droneGain);
    droneGain.connect(master);
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.09;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 120;
    lfo.connect(lfoG);
    lfoG.connect(droneFilter.frequency);
    lfo.start(t0);
    lfo.stop(t0 + END);
    nodes.push(lfo);

    // Heartbeat — tightening through the flow, cut for the build-up.
    const kick = (when: number, gain: number) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(110, when);
      o.frequency.exponentialRampToValueAtTime(38, when + 0.09);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(gain, when + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.3);
      o.connect(g);
      g.connect(master);
      o.start(when);
      o.stop(when + 0.32);
      nodes.push(o);
    };
    const plan: { until: number; interval: number; gain: number }[] = [
      { until: 8, interval: 1.5, gain: 0.14 },
      { until: 18, interval: 1.1, gain: 0.18 },
      { until: 26.9, interval: 0.82, gain: 0.25 },
    ];
    let tk = 0.8;
    for (const seg of plan) {
      while (tk < seg.until) {
        kick(t0 + tk, seg.gain);
        tk += seg.interval;
      }
    }
    kick(t0 + 34.3, 0.5); // boom under the title

    // Tension strings — swell under the menu build, hard cut at STAND BY.
    const strFilter = ctx.createBiquadFilter();
    strFilter.type = "lowpass";
    strFilter.frequency.setValueAtTime(500, t0 + 8);
    strFilter.frequency.linearRampToValueAtTime(1500, t0 + 27);
    for (const f of [220, 261.63]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.detune.value = (Math.floor(f) % 7) - 3;
      o.connect(strFilter);
      o.start(t0 + 8);
      o.stop(t0 + 27.2);
      nodes.push(o);
    }
    const strGain = ctx.createGain();
    strGain.gain.setValueAtTime(0, t0 + 8);
    strGain.gain.linearRampToValueAtTime(0.045, t0 + 18);
    strGain.gain.linearRampToValueAtTime(0.12, t0 + 26.9);
    strGain.gain.linearRampToValueAtTime(0, t0 + 27.15);
    strFilter.connect(strGain);
    strGain.connect(master);

    // D-minor swell under the title.
    for (const f of [146.83, 174.61, 220]) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0 + 34.3);
      g.gain.linearRampToValueAtTime(0.09, t0 + 35.3);
      g.gain.linearRampToValueAtTime(0.09, t0 + 36.3);
      g.gain.linearRampToValueAtTime(0, t0 + 36.9);
      o.connect(g);
      g.connect(master);
      o.start(t0 + 34.3);
      o.stop(t0 + 37);
      nodes.push(o);
    }
  };
  useEffect(() => {
    if (!soundOn || !audioRef.current) return;
    startMusic();
    return () => stopMusic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, soundOn]);

  // ---- synth helpers ----
  const tone = (
    freq: number,
    atSec: number,
    durSec: number,
    gain: number,
    type: OscillatorType = "square",
  ) => {
    const ctx = audioRef.current;
    if (!ctx) return;
    const t0 = ctx.currentTime + atSec;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
    g.gain.linearRampToValueAtTime(gain, t0 + durSec - 0.012);
    g.gain.linearRampToValueAtTime(0, t0 + durSec);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + durSec + 0.01);
  };
  const playClick = () => {
    const ctx = audioRef.current;
    if (!ctx) return;
    const dur = 0.025;
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 3200;
    const g = ctx.createGain();
    g.gain.value = 0.09;
    noise.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    noise.start();
  };
  const playTick = () => tone(620, 0, 0.03, 0.04, "sine");
  const playSelect = () => {
    tone(880, 0, 0.05, 0.055);
    tone(1245, 0.07, 0.06, 0.055);
  };
  const playStamp = () => {
    tone(660, 0, 0.07, 0.06);
    tone(880, 0.1, 0.07, 0.06);
    tone(1100, 0.2, 0.09, 0.06);
  };
  const playFeed = () => tone(840, 0, 0.05, 0.03, "sine");

  useEffect(() => {
    startRef.current = performance.now();
    setElapsed(0);
    const id = window.setInterval(() => {
      const e = performance.now() - startRef.current;
      if (e >= TOTAL_MS + 1200) {
        setRunId((r) => r + 1);
        return;
      }
      setElapsed(e);
    }, 100);
    return () => window.clearInterval(id);
  }, [runId]);

  let acc = 0;
  let scene: Scene = "browser";
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

      {!soundOn && (
        <button
          onClick={toggleSound}
          className="absolute bottom-5 left-5 z-50 rounded-full border border-zinc-700 bg-black/70 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-zinc-300 md:hidden"
        >
          ♪ sound
        </button>
      )}

      <div className="absolute left-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 text-[10px] uppercase tracking-[0.3em] text-zinc-600 md:flex">
        <span>9:16</span>
        <span>gameplay cut</span>
        <button onClick={() => setRunId((r) => r + 1)} className="text-zinc-400 hover:text-zinc-100">
          ▸ replay
        </button>
        <button
          onClick={toggleSound}
          className={soundOn ? "text-amber-400 hover:text-amber-300" : "text-zinc-400 hover:text-zinc-100"}
        >
          {soundOn ? "♪ sound on" : "♪ sound off"}
        </button>
        <span className="text-zinc-700">loops auto</span>
      </div>

      {/* The 9:16 stage */}
      <div
        key={runId}
        className="relative overflow-hidden bg-[#050507]"
        style={{ height: "100vh", aspectRatio: "9 / 16", maxWidth: "100vw" }}
      >
        <div className="scan pointer-events-none absolute inset-0 z-30" />
        <div className="vignette pointer-events-none absolute inset-0 z-30" />

        {scene === "browser" && (
          <SceneBrowser localMs={local} onType={soundOn ? playClick : undefined} onFeed={soundOn ? playFeed : undefined} onSelect={soundOn ? playSelect : undefined} />
        )}
        {scene === "signup" && (
          <SceneSignup
            localMs={local}
            onType={soundOn ? playClick : undefined}
            onTick={soundOn ? playTick : undefined}
            onStamp={soundOn ? playStamp : undefined}
          />
        )}
        {scene === "menu" && (
          <SceneMenu localMs={local} onTile={soundOn ? playTick : undefined} onSelect={soundOn ? playSelect : undefined} />
        )}
        {scene === "standby" && <SceneStandby localMs={local} />}
      </div>
    </div>
  );
}

/* ------------------------- shared chrome bits ------------------------- */

function Cursor({ x, y, click }: { x: number; y: number; click?: boolean }) {
  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{ left: `${x}%`, top: `${y}%`, transition: "left 0.9s cubic-bezier(.3,.7,.3,1), top 0.9s cubic-bezier(.3,.7,.3,1)" }}
    >
      {click && <span className="absolute -left-3 -top-3 size-7 animate-[clickRing_0.5s_ease-out] rounded-full border-2 border-amber-400" />}
      <svg width="20" height="22" viewBox="0 0 20 22" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))" }}>
        <path d="M2 1 L2 17 L6.5 13.5 L9.5 20 L12.5 18.6 L9.6 12.4 L15.4 12 Z" fill="#fff" stroke="#000" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

/* ------------------------------ scene 1 ------------------------------ */

function SceneBrowser({
  localMs,
  onType,
  onFeed,
  onSelect,
}: {
  localMs: number;
  onType?: () => void;
  onFeed?: () => void;
  onSelect?: () => void;
}) {
  const pageIn = localMs >= 2600;
  const cursorToSignup = localMs >= 6200;
  const clicked = localMs >= 7300;
  const feedFired = useRef<Set<number>>(new Set());
  useEffect(() => {
    CONSOLE_LINES.forEach((_, i) => {
      const at = 3600 + i * 900;
      if (localMs >= at && !feedFired.current.has(i)) {
        feedFired.current.add(i);
        onFeed?.();
      }
    });
    if (clicked && !feedFired.current.has(99)) {
      feedFired.current.add(99);
      onSelect?.();
    }
  }, [localMs, clicked, onFeed, onSelect]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col px-4 pt-14">
      {/* Browser chrome */}
      <div className="animate-[fadeIn_0.6s_ease-out] overflow-hidden rounded-lg border border-zinc-800 bg-[#0c0c10] shadow-2xl shadow-black">
        <div className="flex items-center gap-2 border-b border-zinc-800 bg-[#111116] px-3 py-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <div className="ml-2 flex h-7 flex-1 items-center gap-2 rounded-md bg-[#1a1a20] px-3 text-[12px] text-zinc-300">
            <span className="text-zinc-600">https://</span>
            <TypeLine text={URL_TEXT} startDelayMs={600} charMs={55} onChar={onType} className="text-zinc-100" />
          </div>
        </div>

        {/* Landing page */}
        <div className="relative h-[430px] bg-[#060608]">
          {!pageIn ? (
            <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.3em] text-zinc-700">
              {localMs >= 2100 ? "loading…" : " "}
            </div>
          ) : (
            <div className="animate-[fadeIn_0.7s_ease-out] flex h-full flex-col px-5 pt-6">
              <div className="text-[9px] uppercase tracking-[0.3em] text-amber-500/80">
                Emergency Services Incident Management Simulator
              </div>
              <div className="mt-3 text-[30px] font-bold leading-none tracking-tight text-zinc-50">
                THE WATCH
                <br />
                ROOM
              </div>
              <div className="mt-2 text-[12px] font-bold uppercase tracking-[0.18em] text-amber-400">
                You&apos;re in command and control.
              </div>
              <div className="mt-3 flex gap-2">
                <span className="rounded-sm border border-zinc-700 px-2 py-0.5 text-[9px] uppercase tracking-widest text-zinc-400">
                  Real stations
                </span>
                <span className="rounded-sm border border-zinc-700 px-2 py-0.5 text-[9px] uppercase tracking-widest text-zinc-400">
                  Real resources
                </span>
              </div>

              {/* Mini live console */}
              <div className="mt-4 rounded-sm border border-zinc-800 bg-[#0a0a0e]/90 p-3">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.25em] text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-red-500" />
                    NWRC
                  </span>
                  <span>Dispatch feed · simulation</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {CONSOLE_LINES.map((l, i) => (
                    <div
                      key={l.text}
                      className="flex gap-2 text-[10.5px] opacity-0"
                      style={{ animation: `slideIn 0.4s ${(3600 - 2600 + i * 900) / 1000}s ease-out forwards` }}
                    >
                      <span className="tabular-nums text-zinc-600">{l.time}</span>
                      <span style={{ color: l.service === "F" ? "#ef4444" : l.service === "A" ? "#10b981" : "#3b82f6" }}>▌</span>
                      <span className="text-zinc-400">{l.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA row */}
              <div className="mt-5 flex gap-3">
                <div
                  className={
                    "rounded-sm border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors " +
                    (clicked
                      ? "border-amber-300 bg-amber-400 text-black"
                      : cursorToSignup
                        ? "border-amber-400 bg-amber-400/20 text-amber-300"
                        : "border-amber-400/60 bg-amber-400/10 text-amber-400")
                  }
                >
                  Sign up
                </div>
                <div className="rounded-sm border border-zinc-700 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                  Log in
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {pageIn && <Cursor x={cursorToSignup ? 24 : 70} y={cursorToSignup ? 66.5 : 82} click={clicked} />}

      <div className="mt-6 text-center text-[10px] uppercase tracking-[0.4em] text-zinc-600 opacity-0 animate-[fadeIn_0.8s_5s_ease-out_forwards]">
        Take the 999s. Run the board.
      </div>
    </div>
  );
}

/* ------------------------------ scene 2 ------------------------------ */

function SceneSignup({
  localMs,
  onType,
  onTick,
  onStamp,
}: {
  localMs: number;
  onType?: () => void;
  onTick?: () => void;
  onStamp?: () => void;
}) {
  const ticked = localMs >= 6600;
  const submitted = localMs >= 7800;
  const created = localMs >= 8600;
  const fired = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (ticked && !fired.current.has("tick")) {
      fired.current.add("tick");
      onTick?.();
    }
    if (submitted && !fired.current.has("sub")) {
      fired.current.add("sub");
      onTick?.();
    }
    if (created && !fired.current.has("stamp")) {
      fired.current.add("stamp");
      onStamp?.();
    }
  }, [ticked, submitted, created, onTick, onStamp]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-center px-6">
      <div className="text-[10px] uppercase tracking-[0.4em] text-zinc-600">the-watch-room.vercel.app/signup</div>

      <div className="mt-4 animate-[alertIn_0.5s_ease-out] rounded-sm border border-zinc-800 bg-[#0a0a0e] p-5 shadow-2xl shadow-black">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-amber-400">
            <span className="size-1.5 rounded-full bg-amber-400" />
            New operator registration
          </span>
          <span className="text-[10px] tabular-nums text-zinc-500">19:43 UTC</span>
        </div>

        <Field label="Callsign">
          <TypeLine text={CALLSIGN_TEXT} startDelayMs={900} charMs={90} onChar={onType} className="text-[15px] text-zinc-50" />
        </Field>
        <Field label="Email">
          <TypeLine text={EMAIL_TEXT} startDelayMs={1900} charMs={55} onChar={onType} className="text-[15px] text-zinc-50" />
        </Field>
        <Field label="Password">
          <TypeLine text={PASSWORD_TEXT} startDelayMs={3600} charMs={100} onChar={onType} className="text-[15px] tracking-[0.2em] text-zinc-50" />
        </Field>

        <div className="mt-4 flex items-center gap-2.5">
          <span
            className={
              "flex size-4 items-center justify-center rounded-[3px] border text-[11px] font-bold " +
              (ticked ? "border-amber-400 bg-amber-400 text-black" : "border-zinc-600 text-transparent")
            }
          >
            ✓
          </span>
          <span className="text-[11px] text-zinc-400">
            I accept the <span className="text-amber-400/80 underline">terms &amp; conditions</span>
          </span>
        </div>

        <div
          className={
            "mt-5 rounded-sm border py-2.5 text-center text-[12px] font-bold uppercase tracking-[0.25em] transition-colors " +
            (submitted
              ? "border-amber-300 bg-amber-400 text-black"
              : "border-amber-400/60 bg-amber-400/10 text-amber-400")
          }
        >
          Create account
        </div>

        {created && (
          <div className="mt-4 animate-[alertIn_0.4s_ease-out] rounded-sm border border-emerald-500/60 bg-emerald-500/10 px-3 py-2.5 text-center">
            <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-emerald-400">
              ✓ Account created
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-zinc-400">
              Welcome to the watch, {CALLSIGN_TEXT}
            </div>
          </div>
        )}
      </div>

      <Cursor x={submitted ? 50 : 78} y={submitted ? 63 : 84} click={submitted && localMs < 8600} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">{label}</div>
      <div className="mt-1 flex h-9 items-center rounded-sm border border-zinc-700 bg-[#111116] px-3">{children}</div>
    </div>
  );
}

/* ------------------------------ scene 3 ------------------------------ */

const MENU_TILES: { label: string; sub: string; badge?: string; amber?: boolean }[] = [
  { label: "Start Shift", sub: "Pick your start time. Take the calls.", amber: true },
  { label: "Campaign", sub: "Persistent shifts", badge: "Coming soon" },
  { label: "Joint Response", sub: "Crew one shift between operators", badge: "Multiplayer · in development" },
  { label: "Service Record", sub: "Your career on the patch" },
];

function SceneMenu({
  localMs,
  onTile,
  onSelect,
}: {
  localMs: number;
  onTile?: () => void;
  onSelect?: () => void;
}) {
  const authDone = localMs >= 1100;
  const cursorToStart = localMs >= 5200;
  const clicked = localMs >= 7200;
  const fired = useRef<Set<number>>(new Set());
  useEffect(() => {
    MENU_TILES.forEach((_, i) => {
      const at = 1500 + i * 550;
      if (localMs >= at && !fired.current.has(i)) {
        fired.current.add(i);
        onTile?.();
      }
    });
    if (clicked && !fired.current.has(99)) {
      fired.current.add(99);
      onSelect?.();
    }
  }, [localMs, clicked, onTile, onSelect]);

  if (!authDone) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="text-[12px] uppercase tracking-[0.4em] text-zinc-500 animate-[pulse_0.7s_ease-in-out_infinite]">
          Authenticating…
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col px-6 pt-12">
      {/* Operator strip */}
      <div className="animate-[fadeIn_0.5s_ease-out] flex items-center justify-between border-b border-zinc-800 pb-3 text-[10px] uppercase tracking-[0.25em]">
        <span className="flex items-center gap-2 text-zinc-400">
          <span className="size-1.5 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-amber-400" />
          The Watch Room <span className="text-zinc-700">/</span> Ops Centre
        </span>
        <span className="text-amber-400">{CALLSIGN_TEXT}</span>
      </div>

      <div className="mt-6 animate-[fadeIn_0.6s_0.2s_ease-out_both]">
        <div className="text-[10px] uppercase tracking-[0.35em] text-amber-500/80">
          Welcome back, {CALLSIGN_TEXT}
        </div>
        <div className="mt-2 text-[30px] font-bold tracking-tight text-zinc-50">Take the chair.</div>
      </div>

      <div className="mt-6 space-y-3">
        {MENU_TILES.map((t, i) => (
          <div
            key={t.label}
            className={
              "rounded-sm border p-4 opacity-0 " +
              (t.amber
                ? clicked
                  ? "border-amber-300 bg-amber-400/30"
                  : cursorToStart
                    ? "border-amber-400 bg-amber-400/20"
                    : "border-amber-400/60 bg-amber-400/10"
                : "border-zinc-800 bg-zinc-900/40")
            }
            style={{ animation: `tileIn 0.5s ${(1500 + i * 550) / 1000}s cubic-bezier(.2,.8,.2,1) forwards` }}
          >
            <div className="flex items-center justify-between">
              <span
                className={
                  "text-[13px] font-bold uppercase tracking-[0.2em] " +
                  (t.amber ? "text-amber-400" : "text-zinc-300")
                }
              >
                {t.label}
              </span>
              {t.badge ? (
                <span className="rounded-sm border border-zinc-700 px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-zinc-500">
                  {t.badge}
                </span>
              ) : (
                <span className={"text-[13px] " + (t.amber ? "text-amber-400" : "text-zinc-500")}>→</span>
              )}
            </div>
            <div className="mt-1.5 text-[11px] text-zinc-500">{t.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-auto pb-8 text-center text-[9px] uppercase tracking-[0.3em] text-zinc-700 opacity-0 animate-[fadeIn_0.6s_4s_ease-out_forwards]">
        Simulation — no real emergency data
      </div>

      <Cursor x={cursorToStart ? 50 : 80} y={cursorToStart ? 36 : 70} click={clicked} />
    </div>
  );
}

/* ------------------------------ scene 4 ------------------------------ */

function SceneStandby({ localMs }: { localMs: number }) {
  const stage = localMs < 2200 ? 0 : localMs < 4400 ? 1 : localMs < 6600 ? 2 : 3;
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 px-8 text-center">
      {stage === 0 && (
        <div
          className="animate-[fadeIn_0.5s_ease-out] text-[34px] font-bold tracking-[0.18em] text-zinc-200"
          style={{ textShadow: "0 0 24px rgba(255,255,255,0.25)" }}
        >
          STAND BY…
        </div>
      )}
      {stage === 1 && (
        <div
          className="animate-[fadeIn_0.5s_ease-out] text-[34px] font-bold tracking-[0.18em] text-amber-400"
          style={{ textShadow: "0 0 24px rgba(251,191,36,0.45)" }}
        >
          IN DEVELOPMENT…
        </div>
      )}
      {stage === 2 && (
        <div
          className="animate-[fadeIn_0.5s_ease-out] text-[44px] font-bold tracking-[0.16em] text-white"
          style={{ textShadow: "0 0 28px rgba(255,255,255,0.4)" }}
        >
          COMING SOON
        </div>
      )}
      {stage === 3 && (
        <>
          <div
            className="animate-[titleIn_1s_cubic-bezier(.2,.8,.2,1)_forwards] text-[48px] font-bold leading-tight tracking-tight text-white"
            style={{ textShadow: "0 0 32px rgba(255,255,255,0.3)" }}
          >
            THE WATCH
            <br />
            ROOM
          </div>
          <div className="animate-[fadeIn_0.8s_0.7s_ease-out_both] text-[15px] font-bold uppercase tracking-[0.3em] text-amber-400">
            You&apos;re in command and control.
          </div>
          <div className="animate-[fadeIn_0.8s_1.2s_ease-out_both] text-[11px] uppercase tracking-[0.3em] text-zinc-400">
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
  onChar,
}: {
  text: string;
  startDelayMs: number;
  charMs: number;
  className?: string;
  onChar?: () => void;
}) {
  const [shown, setShown] = useState("");
  const [started, setStarted] = useState(false);
  const onCharRef = useRef(onChar);
  useEffect(() => {
    onCharRef.current = onChar;
  }, [onChar]);
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
@keyframes tileIn {
  from { opacity: 0; transform: translateY(14px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes clickRing {
  from { opacity: 0.9; transform: scale(0.4); }
  to   { opacity: 0; transform: scale(1.6); }
}
.scan {
  background-image: linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px);
}
.vignette {
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%);
}
`;
