// Trailer soundscape — musical foundation + UK emergency-service SFX.
// No pre-recorded audio; every layer is synthesised live from oscillators
// plus a couple of noise buffers.
//
// Layers:
//   • Sub drone           (D1 pad, whole trailer)
//   • Faint radio hiss    (low level, sits under everything)
//   • Typewriter clicks   (per-char, fired from <Typewriter/>)
//   • UK "hi-lo" two-tone (call scene — old-school ambulance/fire style)
//   • Pager alert         (mobilise — five-beep attention tone)
//   • Vehicle rumble      (mobilise → onscene)
//   • Wail siren          (onscene — long slow sweep, distant)
//   • Pager + yelp siren  (escalation — no explosion hit)
//   • Clock ticks         (clock scene — 1 tick per second)
//   • Speech voice        (title — "The Watch Room. Take the chair.")
//   • Minor chord swell   (title — under the voice)
//
// Scene offsets MUST stay in sync with the scene durations in page.tsx.

export const SCENE_OFFSETS = {
  silence:    0,
  call:       3.8,
  mobilise:  11.3,
  onscene:   18.1,
  escalation: 26.6,
  clock:     31.4,
  title:     36.8,
  end:       41.8,
};

export class TrailerAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private startedAt = 0;
  private nodes: AudioScheduledSourceNode[] = [];
  private disposed = false;

  async start(): Promise<void> {
    if (this.ctx) return;
    const Ctor =
      typeof window !== "undefined" &&
      (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext);
    if (!Ctor) return;
    this.ctx = new Ctor();
    if (this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch {}
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
    this.startedAt = this.ctx.currentTime;

    // Warm up voices so speak() has something ready.
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.getVoices();
      } catch {}
    }

    this.scheduleSubDrone(42);
    this.scheduleRadioHiss(42);
    this.scheduleHiLoTwoTone(SCENE_OFFSETS.call, 2);
    this.schedulePagerAlert(SCENE_OFFSETS.mobilise);
    this.scheduleEngineRumble(
      SCENE_OFFSETS.mobilise,
      SCENE_OFFSETS.escalation - SCENE_OFFSETS.mobilise,
    );
    this.scheduleWailSiren(
      SCENE_OFFSETS.onscene,
      SCENE_OFFSETS.escalation - SCENE_OFFSETS.onscene,
    );
    // Escalation — layered urgency: fresh pager alert + fast yelp siren.
    this.schedulePagerAlert(SCENE_OFFSETS.escalation);
    this.scheduleYelpSiren(SCENE_OFFSETS.escalation + 1.2, 3.2);
    this.scheduleClockTicks(
      SCENE_OFFSETS.clock,
      SCENE_OFFSETS.title - SCENE_OFFSETS.clock,
    );
    this.scheduleTitleChord(SCENE_OFFSETS.title);
    this.scheduleFadeOut(SCENE_OFFSETS.end - 1.5, SCENE_OFFSETS.end);
  }

  stop(): void {
    if (!this.ctx) return;
    this.disposed = true;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    const t = this.ctx.currentTime;
    if (this.master) {
      try {
        this.master.gain.cancelScheduledValues(t);
        this.master.gain.setValueAtTime(this.master.gain.value, t);
        this.master.gain.linearRampToValueAtTime(0, t + 0.25);
      } catch {}
    }
    for (const n of this.nodes) {
      try {
        n.stop(t + 0.3);
      } catch {}
    }
    const ctx = this.ctx;
    this.ctx = null;
    this.master = null;
    this.nodes = [];
    window.setTimeout(() => {
      try {
        ctx.close();
      } catch {}
    }, 400);
  }

  // -------------------------------------------------------------------
  // Reactive triggers
  // -------------------------------------------------------------------

  /** Typewriter-per-character click. */
  click(): void {
    if (this.disposed || !this.ctx || !this.master) return;
    const ctx = this.ctx;
    const master = this.master;
    const when = ctx.currentTime;
    const dur = 0.025;
    const buf = ctx.createBuffer(
      1,
      Math.max(1, Math.floor(ctx.sampleRate * dur)),
      ctx.sampleRate,
    );
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
    g.gain.value = 0.08;
    noise.connect(filter);
    filter.connect(g);
    g.connect(master);
    noise.start(when);
    this.nodes.push(noise);
  }

  /** Spoken tagline via SpeechSynthesis (browser TTS). */
  speak(
    text: string,
    opts?: { rate?: number; pitch?: number; volume?: number },
  ): void {
    if (this.disposed) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = opts?.rate ?? 0.85;
    utter.pitch = opts?.pitch ?? 0.85;
    utter.volume = opts?.volume ?? 0.8;
    try {
      const voices = window.speechSynthesis.getVoices();
      const uk = voices.find(
        (v) => v.lang && v.lang.toLowerCase().startsWith("en-gb"),
      );
      const en = voices.find(
        (v) => v.lang && v.lang.toLowerCase().startsWith("en"),
      );
      const pick = uk ?? en;
      if (pick) utter.voice = pick;
    } catch {}
    try {
      window.speechSynthesis.speak(utter);
    } catch {}
  }

  // -------------------------------------------------------------------
  // Scheduled layers
  // -------------------------------------------------------------------

  /** D1 sub drone — musical grounding. */
  private scheduleSubDrone(duration: number): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const master = this.master;
    const t0 = this.startedAt;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 280;
    filter.Q.value = 3;

    for (const detune of [0, 6]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = 36.71; // D1
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(t0);
      osc.stop(t0 + duration);
      this.nodes.push(osc);
    }

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.22, t0 + 3);
    g.gain.linearRampToValueAtTime(0.22, t0 + duration - 1);
    g.gain.linearRampToValueAtTime(0, t0 + duration);
    filter.connect(g);
    g.connect(master);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(t0);
    lfo.stop(t0 + duration);
    this.nodes.push(lfo);
  }

  /** Very quiet radio hiss under everything. */
  private scheduleRadioHiss(duration: number): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const master = this.master;
    const t0 = this.startedAt;
    const bufSec = 3;
    const buf = ctx.createBuffer(1, ctx.sampleRate * bufSec, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2600;
    bp.Q.value = 0.8;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.03, t0 + 2);
    g.gain.linearRampToValueAtTime(0.03, t0 + duration - 2);
    g.gain.linearRampToValueAtTime(0, t0 + duration);

    noise.connect(bp);
    bp.connect(g);
    g.connect(master);
    noise.start(t0);
    noise.stop(t0 + duration);
    this.nodes.push(noise);
  }

  /** UK-style "hi-lo" two-tone alerter — alternates between a high and
   *  a low note, half-second each, for `cycles` full HI-LO pairs. */
  private scheduleHiLoTwoTone(offset: number, cycles: number): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const master = this.master;
    const t0 = this.startedAt + offset;
    const hi = 970;
    const lo = 720;

    // Soften with a lowpass so the sawtooth doesn't rip.
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2200;

    const totalNotes = cycles * 2;
    for (let i = 0; i < totalNotes; i++) {
      const when = t0 + i * 0.5;
      const freq = i % 2 === 0 ? hi : lo;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.09, when + 0.03);
      g.gain.linearRampToValueAtTime(0.09, when + 0.45);
      g.gain.linearRampToValueAtTime(0, when + 0.5);
      osc.connect(filter);
      filter.connect(g);
      g.connect(master);
      osc.start(when);
      osc.stop(when + 0.52);
      this.nodes.push(osc);
    }
  }

  /** UK fire-service pager alert — five sharp beeps at ~1400 Hz. */
  private schedulePagerAlert(offset: number): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const master = this.master;
    const t0 = this.startedAt + offset;
    const count = 5;
    for (let i = 0; i < count; i++) {
      const when = t0 + i * 0.22;
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = 1400;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.11, when + 0.008);
      g.gain.linearRampToValueAtTime(0.11, when + 0.14);
      g.gain.linearRampToValueAtTime(0, when + 0.16);
      osc.connect(g);
      g.connect(master);
      osc.start(when);
      osc.stop(when + 0.17);
      this.nodes.push(osc);
    }
  }

  /** Vehicle rumble across mobilise + onscene. */
  private scheduleEngineRumble(offset: number, duration: number): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const master = this.master;
    const t0 = this.startedAt + offset;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 170;
    filter.Q.value = 4;

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 62;
    osc.connect(filter);
    osc.start(t0);
    osc.stop(t0 + duration + 0.5);
    this.nodes.push(osc);

    const bufDur = duration + 1;
    const buf = ctx.createBuffer(
      1,
      Math.floor(ctx.sampleRate * bufDur),
      ctx.sampleRate,
    );
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.connect(filter);
    noise.start(t0);
    noise.stop(t0 + duration + 0.5);
    this.nodes.push(noise);

    // Idle bob.
    const bob = ctx.createOscillator();
    bob.type = "sine";
    bob.frequency.value = 3.3;
    const bobGain = ctx.createGain();
    bobGain.gain.value = 3;
    bob.connect(bobGain);
    bobGain.connect(osc.frequency);
    bob.start(t0);
    bob.stop(t0 + duration + 0.5);
    this.nodes.push(bob);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.09, t0 + 1.5);
    g.gain.linearRampToValueAtTime(0.14, t0 + duration - 1.5);
    g.gain.linearRampToValueAtTime(0, t0 + duration);
    filter.connect(g);
    g.connect(master);
  }

  /** UK "wail" siren — slow ~0.4 Hz sweep. Kept distant / behind
   *  a lowpass so it reads as coming from off-camera. */
  private scheduleWailSiren(offset: number, duration: number): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const master = this.master;
    const t0 = this.startedAt + offset;

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 850;
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.4;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 380;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + duration + 0.5);
    this.nodes.push(lfo);

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1100;
    bp.Q.value = 2.5;
    const distance = ctx.createBiquadFilter();
    distance.type = "lowpass";
    distance.frequency.value = 1200;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.07, t0 + 1);
    g.gain.linearRampToValueAtTime(0.07, t0 + duration - 1);
    g.gain.linearRampToValueAtTime(0, t0 + duration);

    osc.connect(bp);
    bp.connect(distance);
    distance.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.5);
    this.nodes.push(osc);
  }

  /** UK "yelp" siren — the urgent, close-quarters sweep at ~3 Hz.
   *  Used in place of the old impact hit at the escalation. */
  private scheduleYelpSiren(offset: number, duration: number): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const master = this.master;
    const t0 = this.startedAt + offset;

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 900;

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 3.2;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 500;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + duration + 0.3);
    this.nodes.push(lfo);

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1200;
    bp.Q.value = 2;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.12, t0 + 0.25);
    g.gain.linearRampToValueAtTime(0.12, t0 + duration - 0.3);
    g.gain.linearRampToValueAtTime(0, t0 + duration);

    osc.connect(bp);
    bp.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.3);
    this.nodes.push(osc);
  }

  /** Mechanical clock tick, one per second, for the turnout-clock
   *  scene. Short bandpassed noise burst — reads as a wristwatch. */
  private scheduleClockTicks(offset: number, duration: number): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const master = this.master;
    const t0 = this.startedAt + offset;
    const totalTicks = Math.floor(duration);
    for (let i = 0; i < totalTicks; i++) {
      const when = t0 + i * 1.0;
      const dur = 0.035;
      const buf = ctx.createBuffer(
        1,
        Math.max(1, Math.floor(ctx.sampleRate * dur)),
        ctx.sampleRate,
      );
      const data = buf.getChannelData(0);
      for (let j = 0; j < data.length; j++) {
        data[j] = (Math.random() * 2 - 1) * (1 - j / data.length);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2400;
      bp.Q.value = 6;
      const g = ctx.createGain();
      g.gain.value = 0.18;
      noise.connect(bp);
      bp.connect(g);
      g.connect(master);
      noise.start(when);
      this.nodes.push(noise);
    }
  }

  /** D-minor triad swell at the title, under the spoken tagline. */
  private scheduleTitleChord(offset: number): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const master = this.master;
    const t0 = this.startedAt + offset;
    for (const f of [146.83, 174.61, 220]) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.09, t0 + 1.5);
      g.gain.linearRampToValueAtTime(0.09, t0 + 3.5);
      g.gain.linearRampToValueAtTime(0, t0 + 4.8);
      osc.connect(g);
      g.connect(master);
      osc.start(t0);
      osc.stop(t0 + 5);
      this.nodes.push(osc);
    }
  }

  private scheduleFadeOut(startOffset: number, endOffset: number): void {
    if (!this.ctx || !this.master) return;
    const t0 = this.startedAt + startOffset;
    const t1 = this.startedAt + endOffset;
    this.master.gain.setValueAtTime(this.master.gain.value, t0);
    this.master.gain.linearRampToValueAtTime(0, t1);
  }
}
