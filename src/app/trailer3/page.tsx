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

type Scene = "call" | "allocate" | "comms" | "standby";

const TIMELINE: { scene: Scene; ms: number }[] = [
  { scene: "call", ms: 7500 },
  { scene: "allocate", ms: 7500 },
  { scene: "comms", ms: 9000 },
  { scene: "standby", ms: 9500 },
];
const TOTAL_MS = TIMELINE.reduce((s, t) => s + t.ms, 0);

const ADDRESS_LINES = [
  "HOUSE FIRE — PERSONS REPORTED",
  "285 HOLLYHEDGE ROAD",
  "WYTHENSHAWE · M22 4QR",
  "CALLER STATES CHILD UPSTAIRS",
];

// Scene comms — radio traffic once crews start landing on the job.
const COMMS_LINES: { time: string; cs: string; msg: string; service: "F" | "A" | "P" }[] = [
  { time: "03:19:04", cs: "G15-P1", msg: "IN ATTENDANCE — SMOKE SHOWING", service: "F" },
  { time: "03:19:31", cs: "RP-07", msg: "CARRIAGEWAY CLOSED — CONES OUT", service: "P" },
  { time: "03:20:12", cs: "G15-P1", msg: "BA COMMITTED ×2 — EMERGENCY SEARCH", service: "F" },
  { time: "03:20:44", cs: "A-547", msg: "ON SCENE — CASUALTY IDENTIFIED", service: "A" },
  { time: "03:21:07", cs: "HELIMED 72", msg: "OVERHEAD — REQUEST LZ", service: "A" },
  { time: "03:21:39", cs: "G15-P1", msg: "CASUALTY LOCATED — FIRST FLOOR", service: "F" },
  { time: "03:22:02", cs: "HELIMED 72", msg: "ON THE GROUND — DOCTOR WALKING IN", service: "A" },
  { time: "03:22:28", cs: "G15-P2", msg: "CASUALTY OUT — HANDING OVER", service: "F" },
];

// Allocation board — candidate units the cursor sweeps over. `pick`
// units flash amber and lock in ASSIGNED; the rest stay available.
const ALLOCATE_ROWS: {
  callsign: string;
  detail: string;
  eta: string;
  service: "F" | "A" | "P";
  pick: boolean;
}[] = [
  { callsign: "G15-P1", detail: "Pump ladder · Wythenshawe", eta: "04:32", service: "F", pick: true },
  { callsign: "G15-P2", detail: "Pump · Wythenshawe", eta: "04:32", service: "F", pick: true },
  { callsign: "G50-P1", detail: "Pump ladder · Manchester Central", eta: "06:05", service: "F", pick: true },
  { callsign: "A-547", detail: "Ambulance · Wythenshawe", eta: "05:10", service: "A", pick: true },
  { callsign: "RX-201", detail: "Rapid response · Sale", eta: "07:40", service: "A", pick: false },
  { callsign: "MP66-21", detail: "Police response · City", eta: "06:55", service: "P", pick: true },
  { callsign: "HELIMED 72", detail: "Air ambulance · Barton", eta: "09:15", service: "A", pick: true },
];

export default function Trailer3Page() {
  const [runId, setRunId] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  // Typewriter click audio — opt-in (browsers block audio pre-gesture).
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
    setRunId((r) => r + 1); // restart so the typing scene plays with sound
  };
  // ---- shared little synth helpers ----
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
  const squelch = (atSec: number, gain = 0.05) => {
    const ctx = audioRef.current;
    if (!ctx) return;
    const dur = 0.09;
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const nf = ctx.createBiquadFilter();
    nf.type = "highpass";
    nf.frequency.value = 1800;
    const ng = ctx.createGain();
    ng.gain.value = gain;
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(ctx.destination);
    noise.start(ctx.currentTime + atSec);
  };

  // Radio keying — varied per service so the channel doesn't sound
  // like one repeated sample: fire = single sharp pip, ambulance =
  // softer lower pip, police = double chirp. All get a squelch tail.
  const playBlip = (service: "F" | "A" | "P") => {
    if (service === "F") {
      tone(1150, 0, 0.055, 0.06);
      squelch(0.06);
    } else if (service === "A") {
      tone(840, 0, 0.075, 0.05);
      squelch(0.08, 0.04);
    } else {
      tone(960, 0, 0.035, 0.055);
      tone(960, 0.07, 0.035, 0.055);
      squelch(0.11);
    }
  };

  // Allocation-board sounds: a soft tick as the cursor steps, an
  // ascending two-note chirp when a unit locks in, and a three-note
  // confirmation when the attendance is set.
  const playStep = () => tone(620, 0, 0.03, 0.035, "sine");
  const playAssign = () => {
    tone(880, 0.09, 0.05, 0.055);
    tone(1245, 0.15, 0.06, 0.055);
  };
  const playStamp = () => {
    tone(660, 0, 0.07, 0.06);
    tone(880, 0.1, 0.07, 0.06);
    tone(1100, 0.2, 0.09, 0.06);
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
        <button
          onClick={toggleSound}
          className={soundOn ? "text-amber-400 hover:text-amber-300" : "text-zinc-400 hover:text-zinc-100"}
          title={soundOn ? "Mute typing sound" : "Enable typing sound — restarts the loop"}
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
        {/* texture */}
        <div className="scan pointer-events-none absolute inset-0 z-30" />
        <div className="vignette pointer-events-none absolute inset-0 z-30" />

        {scene === "call" && <SceneCall onType={soundOn ? playClick : undefined} />}
        {scene === "allocate" && (
          <SceneAllocate
            localMs={local}
            onStep={soundOn ? playStep : undefined}
            onAssign={soundOn ? playAssign : undefined}
            onStamp={soundOn ? playStamp : undefined}
          />
        )}
        {scene === "comms" && (
          <SceneComms localMs={local} onBlip={soundOn ? playBlip : undefined} />
        )}
        {scene === "standby" && <SceneStandby localMs={local} />}
      </div>
    </div>
  );
}

/* ------------------------------ scenes ------------------------------ */

function SceneCall({ onType }: { onType?: () => void }) {
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
            onChar={onType}
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

function SceneAllocate({
  localMs,
  onStep,
  onAssign,
  onStamp,
}: {
  localMs: number;
  onStep?: () => void;
  onAssign?: () => void;
  onStamp?: () => void;
}) {
  // A selection cursor sweeps the board, dwelling ~650ms per row.
  // Picked rows flash amber and lock in ASSIGNED; skipped rows stay
  // available. After the sweep, the attendance stamp lands.
  const STEP_MS = 650;
  const cursor = Math.floor(localMs / STEP_MS);
  const sweepDone = cursor >= ALLOCATE_ROWS.length;

  // Sound triggers keyed off cursor movement: tick per step, chirp
  // when the row just passed locked in, stamp when the sweep ends.
  const prevCursorRef = useRef(-1);
  const soundRef = useRef({ onStep, onAssign, onStamp });
  useEffect(() => {
    soundRef.current = { onStep, onAssign, onStamp };
  }, [onStep, onAssign, onStamp]);
  useEffect(() => {
    const prev = prevCursorRef.current;
    if (cursor === prev) return;
    prevCursorRef.current = cursor;
    if (cursor <= prev) return; // remount/reset
    try {
      if (cursor < ALLOCATE_ROWS.length) soundRef.current.onStep?.();
      const justPassed = ALLOCATE_ROWS[cursor - 1];
      if (justPassed?.pick) soundRef.current.onAssign?.();
      if (cursor >= ALLOCATE_ROWS.length && prev < ALLOCATE_ROWS.length) {
        soundRef.current.onStamp?.();
      }
    } catch {}
  }, [cursor]);
  const assigned = ALLOCATE_ROWS.filter((r, i) => r.pick && i < cursor).length;
  const svcColour = (s: "F" | "A" | "P") =>
    s === "F" ? "#ef4444" : s === "A" ? "#10b981" : "#3b82f6";
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-center px-6">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-500">
          Build the attendance
        </span>
        <span className="text-[22px] font-bold tabular-nums text-amber-400">
          {assigned}
        </span>
      </div>
      <ul className="mt-4 space-y-2">
        {ALLOCATE_ROWS.map((r, i) => {
          const visited = i < cursor;
          const active = i === cursor;
          const locked = visited && r.pick;
          return (
            <li
              key={r.callsign}
              className={
                "flex items-center justify-between gap-3 rounded-md border px-3 py-2 transition-all duration-200 " +
                (active
                  ? "scale-[1.02] border-amber-400 bg-amber-400/10"
                  : locked
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : visited
                      ? "border-zinc-800 opacity-45"
                      : "border-zinc-800 bg-zinc-900/60")
              }
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-[2px]"
                  style={{ background: svcColour(r.service) }}
                />
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold tracking-[0.06em]">
                    {r.callsign}
                  </span>
                  <span className="block truncate text-[11px] text-zinc-500">
                    {r.detail}
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-[11px] tabular-nums text-zinc-400">
                  ETA {r.eta}
                </span>
                {locked && (
                  <span className="animate-[slideIn_0.2s_ease-out] rounded-sm bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-black">
                    Assigned
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      {sweepDone && (
        <div className="mt-5 animate-[fadeIn_0.4s_ease-out] text-center text-[13px] font-bold uppercase tracking-[0.3em] text-emerald-400">
          Attendance set — {ALLOCATE_ROWS.filter((r) => r.pick).length} assigned
        </div>
      )}
    </div>
  );
}

function SceneComms({
  localMs,
  onBlip,
}: {
  localMs: number;
  onBlip?: (service: "F" | "A" | "P") => void;
}) {
  const shown = Math.min(COMMS_LINES.length, Math.floor(localMs / 950));
  // One keying blip per transmission as it lands, voiced per service.
  const prevShownRef = useRef(0);
  const onBlipRef = useRef(onBlip);
  useEffect(() => {
    onBlipRef.current = onBlip;
  }, [onBlip]);
  useEffect(() => {
    if (shown > prevShownRef.current) {
      const line = COMMS_LINES[shown - 1];
      try {
        if (line) onBlipRef.current?.(line.service);
      } catch {}
    }
    prevShownRef.current = shown;
  }, [shown]);
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-center px-6">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-zinc-500">
          <span className="size-1.5 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-emerald-400" />
          Scene comms · CH1
        </span>
        <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600">
          live
        </span>
      </div>
      <ul className="mt-4 space-y-2.5">
        {COMMS_LINES.slice(0, shown).map((l) => {
          const colour =
            l.service === "F" ? "#ef4444" : l.service === "A" ? "#10b981" : "#3b82f6";
          return (
            <li key={l.time} className="animate-[slideIn_0.3s_ease-out]">
              <div className="flex items-baseline gap-2 text-[10px] tracking-[0.15em] text-zinc-500">
                <span className="tabular-nums">{l.time}</span>
                <span className="font-bold" style={{ color: colour }}>
                  {l.cs}
                </span>
              </div>
              <div className="mt-0.5 flex gap-2">
                <span style={{ color: colour }}>▌</span>
                <span className="text-[15px] font-bold leading-snug tracking-[0.04em] text-zinc-100">
                  {l.msg}
                </span>
              </div>
            </li>
          );
        })}
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
        <div
          className="animate-[fadeIn_0.5s_ease-out] text-[40px] font-bold tracking-[0.22em] text-white"
          style={{ textShadow: "0 0 24px rgba(255,255,255,0.35)" }}
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
  /** Fired once per revealed character — drives the typing click. */
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
.scan {
  background-image: linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px);
}
.vignette {
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%);
}
`;
