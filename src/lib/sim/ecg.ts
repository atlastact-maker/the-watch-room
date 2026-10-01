// ECG and capnography waveform generation.
//
// Pure maths, deliberately: the monitor component just paints whatever
// these return, so the shapes can be checked offline without a browser.
//
// Everything is in millivolt-ish units centred on 0, where a normal R
// wave peaks around 1.0. Time is seconds since the trace started.
//
// The point of drawing a real trace rather than printing "VF" is that
// reading the rhythm is the skill. PEA looks almost normal — organised
// complexes marching across the screen — and the whole trap is that
// there is no pulse to go with them. You cannot show that with a label.

import type { ArrestRhythm } from "./resus";

/** A rhythm the monitor can display, including the ones that are not
 *  arrest rhythms at all: sinus, AF, the three heart blocks and a paced
 *  rhythm. For the blocks `rate` is the VENTRICULAR rate — what the
 *  patient actually has a pulse at — and the atria are drawn around it. */
export type TraceRhythm = ArrestRhythm | "sinus" | "af" | "hb1" | "hb2_m1" | "hb2_m2" | "hb3" | "paced";

/** A P wave on its own, for the beats a block does not conduct. */
function pWave(tb: number, at = 0.09): number {
  return bump(tb, at, 0.032, 0.13);
}

/** QRS and T without the P, starting `q` seconds into the beat. */
function qrst(tb: number, q: number, widen = 0, amp = 1): number {
  let v = 0;
  v += bump(tb, q, 0.013 + widen, -0.10 * amp);
  v += bump(tb, q + 0.025, 0.017 + widen, 1.0 * amp);
  v += bump(tb, q + 0.057, 0.019 + widen, -0.25 * amp);
  v += bump(tb, q + 0.20, 0.06, 0.25 * amp);
  return v;
}

/** The pacing spike: a very narrow, very tall line just before a broad
 *  complex. The thing a crew looks for to confirm capture. */
function pacedComplex(tb: number): number {
  const spike = Math.abs(tb - 0.16) < 0.004 ? 1.4 : 0;
  return spike + qrst(tb, 0.175, 0.012, 0.9);
}

/** Deterministic noise — a cheap hash-based value so a given time always
 *  produces the same sample. Keeps the trace stable if it repaints. */
function noise(t: number, seed = 1): number {
  const x = Math.sin(t * 12.9898 * seed + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/** A smooth bump centred at `centre` with width `w`. The building block
 *  for P and T waves. */
function bump(x: number, centre: number, w: number, h: number): number {
  const d = (x - centre) / w;
  return h * Math.exp(-d * d * 4);
}

/**
 * One normal complex, as a function of SECONDS since the beat started.
 *
 * Deliberately in real time rather than as a fraction of the cycle,
 * because that is how a heart works: the QRS is about 90 ms whether the
 * rate is 40 or 140 — it is the diastolic gap that stretches and
 * shrinks. Doing it proportionally made the QRS sub-pixel at normal
 * sweep speeds and the complexes vanished off the trace entirely.
 */
function sinusComplex(tb: number, widen = 0): number {
  let v = 0;
  v += bump(tb, 0.09, 0.032, 0.13); // P wave, ~80 ms
  // QRS — small Q dip, tall R, S undershoot. ~90 ms end to end.
  v += bump(tb, 0.20, 0.013 + widen, -0.10);
  v += bump(tb, 0.225, 0.017 + widen, 1.0);
  v += bump(tb, 0.257, 0.019 + widen, -0.25);
  v += bump(tb, 0.40, 0.06, 0.25); // T wave, ~160 ms
  return v;
}

/** Broad, regular, no clear P or T — the look of a wide-complex
 *  tachycardia. */
function vtComplex(phase: number): number {
  return Math.sin(phase * Math.PI * 2) * 0.85 + Math.sin(phase * Math.PI * 4) * 0.12;
}

export type EcgOptions = {
  /** Beats per minute for organised rhythms. */
  rate?: number;
  /** Compressions in progress — adds the mechanical artefact that makes a
   *  rhythm unreadable until you pause, which is exactly why the ALS loop
   *  has a rhythm check rather than continuous assessment. */
  compressions?: boolean;
  /** Compression rate; RCUK says 100-120 per minute. */
  compressionRate?: number;
};

/**
 * One ECG sample at time `t` seconds.
 */
export function ecgSample(
  rhythm: TraceRhythm,
  t: number,
  opts: EcgOptions = {},
): number {
  const { compressions = false, compressionRate = 110 } = opts;
  let v = 0;

  switch (rhythm) {
    case "asystole": {
      // Not a perfectly flat line — a real one wanders slightly, which is
      // why "flatline" is confirmed in more than one lead.
      v = noise(t, 3) * 0.02 + Math.sin(t * 0.7) * 0.015;
      break;
    }
    case "vf": {
      // Coarse VF: chaotic, no organised complexes, amplitude wandering.
      const envelope = 0.55 + Math.sin(t * 1.3) * 0.18;
      v =
        (Math.sin(t * 19.3) * 0.5 +
          Math.sin(t * 31.7 + 1.1) * 0.32 +
          Math.sin(t * 47.1 + 2.3) * 0.18 +
          noise(t * 60, 7) * 0.15) *
        envelope;
      break;
    }
    case "pvt": {
      const rate = opts.rate ?? 190;
      const phase = (t * rate) / 60;
      v = vtComplex(phase % 1);
      break;
    }
    case "pea": {
      // The dangerous one: organised, often slow and slightly wide, and
      // indistinguishable from a perfusing rhythm on the screen alone.
      // Only a pulse check or the capnography tells you there is no
      // output behind it.
      const rate = opts.rate ?? 38;
      const period = 60 / rate;
      v = sinusComplex(t % period, 0.008) * 0.75;
      break;
    }
    case "sinus": {
      const rate = opts.rate ?? 78;
      const period = 60 / rate;
      v = sinusComplex(t % period);
      break;
    }
    case "af": {
      // Irregularly irregular: each R-R is the mean nudged by a stable
      // per-beat hash, and the baseline fibrillates where P waves were.
      const rate = opts.rate ?? 110;
      const mean = 60 / rate;
      let beat = Math.floor(t / mean);
      let start = beat * mean + noise(beat, 4) * mean * 0.28;
      if (t < start) { beat -= 1; start = beat * mean + noise(beat, 4) * mean * 0.28; }
      v = qrst(t - start, 0.06) + noise(t * 40, 9) * 0.05 + Math.sin(t * 38) * 0.03;
      break;
    }
    case "hb1": {
      // Every P conducts, after a long PR (~240 ms).
      const rate = opts.rate ?? 64;
      const period = 60 / rate;
      const tb = t % period;
      v = pWave(tb, 0.05) + qrst(tb, 0.29);
      break;
    }
    case "hb2_m1": {
      // Wenckebach 4:3 — the PR stretches beat by beat and the fourth P
      // is dropped. Three ventricular beats per four atrial.
      const vRate = opts.rate ?? 52;
      const aPeriod = 60 / (vRate * 4 / 3);
      const i = Math.floor(t / aPeriod) % 4;
      const tb = t % aPeriod;
      const pr = [0.16, 0.24, 0.32][i] ?? 0;
      v = pWave(tb, 0.05) + (i < 3 ? qrst(tb, 0.05 + pr) : 0);
      break;
    }
    case "hb2_m2": {
      // 2:1 — the PR is fixed and every other P goes nowhere. The one
      // that progresses to complete block without warning.
      const vRate = opts.rate ?? 38;
      const aPeriod = 60 / (vRate * 2);
      const i = Math.floor(t / aPeriod) % 2;
      const tb = t % aPeriod;
      v = pWave(tb, 0.05) + (i === 0 ? qrst(tb, 0.21) : 0);
      break;
    }
    case "hb3": {
      // Complete: the atria at their own rate, the ventricles on a slow
      // broad escape, nothing to do with each other.
      const vRate = opts.rate ?? 34;
      const vPeriod = 60 / vRate;
      const aPeriod = 60 / 82;
      v = pWave(t % aPeriod, 0.05) + qrst(t % vPeriod, 0.12, 0.012, 0.85);
      break;
    }
    case "paced": {
      const rate = opts.rate ?? 70;
      const period = 60 / rate;
      v = pacedComplex(t % period);
      break;
    }
  }

  // Compression artefact rides on top of everything.
  if (compressions) {
    const cPhase = (t * compressionRate) / 60;
    v += Math.sin(cPhase * Math.PI * 2) * 0.34 + noise(t * 25, 11) * 0.05;
  }

  // A little mains/movement noise so it never looks computer-perfect.
  v += noise(t * 90, 5) * 0.012;
  return v;
}

/**
 * Capnography waveform — the square-ish plateau every paramedic knows.
 *
 * Returns kPa. During CPR the waveform is small and the plateau low;
 * post-ROSC it climbs. A flat zero trace means no ventilation is
 * happening at all.
 */
export function capnoSample(t: number, peakKpa: number, ventRate = 10): number {
  if (peakKpa <= 0.05) return 0;
  const phase = ((t * ventRate) / 60) % 1;
  // Expiration occupies roughly the first 45% of the cycle: a fast
  // upstroke, an alveolar plateau that rises very slightly, then a sharp
  // drop as the next breath is delivered.
  if (phase < 0.06) return peakKpa * (phase / 0.06) * 0.92;
  if (phase < 0.42) {
    const p = (phase - 0.06) / 0.36;
    return peakKpa * (0.92 + p * 0.08);
  }
  if (phase < 0.5) {
    const p = (phase - 0.42) / 0.08;
    return peakKpa * (1 - p);
  }
  return 0;
}

/** What the monitor should show as a heart rate for a given rhythm.
 *  VF and asystole have no rate to report. */
export function displayedRate(
  rhythm: TraceRhythm,
  opts: EcgOptions = {},
): number | null {
  switch (rhythm) {
    case "vf":
    case "asystole":
      return null;
    case "pvt":
      return opts.rate ?? 190;
    case "pea":
      return opts.rate ?? 38;
    case "sinus":
      return opts.rate ?? 78;
    case "af":
      return opts.rate ?? 110;
    case "hb1":
      return opts.rate ?? 64;
    case "hb2_m1":
      return opts.rate ?? 52;
    case "hb2_m2":
      return opts.rate ?? 38;
    case "hb3":
      return opts.rate ?? 34;
    case "paced":
      return opts.rate ?? 70;
  }
}

/** Colour convention used on UK monitors: ECG green, SpO2 cyan,
 *  capnography yellow, pressures white. */
export const TRACE_COLOURS = {
  ecg: "#22c55e",
  spo2: "#22d3ee",
  co2: "#facc15",
  bp: "#e5e7eb",
} as const;
