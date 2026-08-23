// Synthesised operations-room audio.
//
// Every sound in the sim is generated on the fly via Web Audio API
// oscillators + envelopes — no binary MP3 / WAV assets to ship, and every
// tone is consistent across devices. Tones chosen to evoke real UK
// Airwave / CAD workstation cues without infringing any real service's
// actual dispatch audio:
//
//   • airwaveClick   — short phosphor-like click on every Status change
//   • incomingCall   — looping 999-style urgent two-tone ring
//   • alertTone      — ascending triad on incident stage up-tick
//     (also used for setbacks / flashover warning)
//   • baLowPressure  — low pressure BA whistle burst
//   • dispatchBeep   — short dispatch-acknowledge chirp
//
// All playback routes through a single user-gesture-unlocked AudioContext
// and a master gain node so a single "mute" or volume slider can attenuate
// everything. Playback is a no-op when the context isn't yet unlocked or
// the user has muted.

const MUTE_KEY = "twr:sound-muted";

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
// Mute preference persists across sessions (set from the Settings page).
let muted =
  typeof window !== "undefined" &&
  (() => {
    try {
      return window.localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  })();

/** Must be called from a user gesture (click/keypress) before any sound
 *  can play. Browsers block AudioContexts until a gesture occurs. Safe
 *  to call repeatedly. */
export function unlockAudio() {
  if (ctx) {
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    return;
  }
  try {
    const Ctor =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ??
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(ctx.destination);
  } catch {
    // Audio unavailable — no-op for the rest of the session.
    ctx = null;
    masterGain = null;
  }
}

export function setMuted(v: boolean) {
  muted = v;
  try {
    window.localStorage.setItem(MUTE_KEY, v ? "1" : "0");
  } catch {
    // preference is best-effort
  }
  if (masterGain && ctx) {
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setTargetAtTime(v ? 0 : 0.6, ctx.currentTime, 0.05);
  }
}

export function isMuted(): boolean {
  return muted;
}

/** Short high-pitched click — fires on every Status change. */
export function airwaveClick() {
  play((c, dest, now) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "square";
    o.frequency.value = 2200;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.08, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    o.connect(g).connect(dest);
    o.start(now);
    o.stop(now + 0.1);
  });
}

/** UK-style two-tone alarm, played three times. Used for incoming 999
 *  calls + the incident alert banner. */
export function incomingCall() {
  play((c, dest, now) => {
    const pattern = [
      { f: 600, t: 0.0 },
      { f: 900, t: 0.28 },
      { f: 600, t: 0.56 },
      { f: 900, t: 0.84 },
      { f: 600, t: 1.12 },
      { f: 900, t: 1.4 },
    ];
    for (const p of pattern) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.value = p.f;
      g.gain.setValueAtTime(0, now + p.t);
      g.gain.linearRampToValueAtTime(0.18, now + p.t + 0.01);
      g.gain.setValueAtTime(0.18, now + p.t + 0.22);
      g.gain.exponentialRampToValueAtTime(0.0001, now + p.t + 0.26);
      o.connect(g).connect(dest);
      o.start(now + p.t);
      o.stop(now + p.t + 0.27);
    }
  });
}

/** Ascending triad — stage-up alarm. Used on fire-stage transitions
 *  (incipient → developing → fully_developed → flashover_risk) and on
 *  setbacks so the operator hears a change without reading the SITREP. */
export function alertTone(urgency: "low" | "med" | "high" = "med") {
  const base = urgency === "high" ? 880 : urgency === "med" ? 660 : 523;
  play((c, dest, now) => {
    const notes = [base, base * 1.25, base * 1.5];
    notes.forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      const t = now + i * 0.11;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(dest);
      o.start(t);
      o.stop(t + 0.19);
    });
  });
}

/** BA low-pressure whistle — evokes the 55-bar whistle on a UK Dräger
 *  set. Three short pulses of a high-pitched sawtooth. */
export function baLowPressure() {
  play((c, dest, now) => {
    for (let i = 0; i < 3; i++) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sawtooth";
      o.frequency.value = 1900;
      const t = now + i * 0.2;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      o.connect(g).connect(dest);
      o.start(t);
      o.stop(t + 0.16);
    }
  });
}

/** Dispatch acknowledge — short low-to-high chirp when the operator hits
 *  Mobilise on an appliance. */
export function dispatchBeep() {
  play((c, dest, now) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(420, now);
    o.frequency.linearRampToValueAtTime(780, now + 0.18);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.14, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    o.connect(g).connect(dest);
    o.start(now);
    o.stop(now + 0.23);
  });
}

// ---- Internals ------------------------------------------------------------

function play(
  build: (c: AudioContext, dest: AudioNode, now: number) => void,
) {
  if (muted) return;
  if (!ctx || !masterGain) return;
  try {
    build(ctx, masterGain, ctx.currentTime);
  } catch {
    // Audio output blocked — ignore.
  }
}
