// Oxygen delivery — device, flow rate, and what it actually achieves.
//
// Oxygen was a single button that meant "15 litres through a non-rebreathe",
// which is the right answer for a crashing trauma patient and the wrong
// answer for most of the people an ambulance sees. JRCALC targets a
// saturation, not a flow rate: 94-98% for most patients, 88-92% for
// anyone at risk of hypercapnic respiratory failure, and after a cardiac
// arrest you TITRATE DOWN, because hyperoxia does measurable harm to a
// brain that has just been reperfused.
//
// So the operator picks a device and a flow, and the sim drives the
// saturation toward what that combination can actually deliver. Giving
// too much is now a thing you can do, and post-ROSC it is scored.

export type OxygenDevice =
  | "none"
  | "nasal_cannula"
  | "simple_mask"
  | "venturi"
  | "nrb"
  | "bvm";

export const OXYGEN_DEVICE_LABEL: Record<OxygenDevice, string> = {
  none: "Room air",
  nasal_cannula: "Nasal cannula",
  simple_mask: "Simple face mask",
  venturi: "Venturi mask",
  nrb: "Non-rebreathe mask",
  bvm: "Bag-valve-mask",
};

/** The flow rates each device is actually run at, in L/min. Venturi is
 *  chosen by its percentage rather than its flow, but the flow is fixed
 *  per valve so it still works as a number here. */
export const OXYGEN_FLOWS: Record<OxygenDevice, number[]> = {
  none: [0],
  nasal_cannula: [1, 2, 4, 6],
  simple_mask: [5, 8, 10],
  venturi: [4, 8, 12],
  nrb: [10, 15],
  bvm: [15],
};

export const OXYGEN_HINT: Record<OxygenDevice, string> = {
  none: "No supplemental oxygen. Correct for most patients saturating above 94%.",
  nasal_cannula:
    "Low flow, well tolerated, lets the patient talk and eat. The workhorse for mild hypoxia and for COPD targets.",
  simple_mask: "Mid-range. Bridges the gap between cannulae and a reservoir mask.",
  venturi:
    "Delivers a FIXED percentage regardless of the patient's breathing — the controlled option for someone at risk of hypercapnic failure.",
  nrb: "Reservoir mask at high flow. Trauma, shock, and anyone critically unwell. Do not leave it on a stable patient.",
  bvm: "Assisted ventilation with a reservoir — for inadequate breathing or apnoea, not for a patient breathing for themselves.",
};

/**
 * Approximate delivered FiO2 for a device at a flow rate.
 *
 * Real FiO2 through anything except a Venturi varies with the patient's
 * own minute volume — these are the conventional teaching figures, which
 * is the right level of precision for a simulator.
 */
export function fiO2For(device: OxygenDevice, flowLpm: number): number {
  switch (device) {
    case "none":
      return 0.21;
    case "nasal_cannula":
      // Roughly 4% per litre above room air, capping out around 6 L.
      return Math.min(0.45, 0.21 + Math.min(6, flowLpm) * 0.04);
    case "simple_mask":
      return Math.min(0.6, 0.35 + (Math.min(10, flowLpm) - 5) * 0.05);
    case "venturi":
      // The valve sets it; flow is a proxy for which valve is fitted.
      if (flowLpm <= 4) return 0.28;
      if (flowLpm <= 8) return 0.4;
      return 0.6;
    case "nrb":
      return flowLpm >= 15 ? 0.85 : 0.7;
    case "bvm":
      return 1.0;
  }
}

/**
 * The saturation this delivery can hold a patient at, ignoring whatever
 * pathology is dragging them down — the vitals engine applies that
 * separately. Deliberately allows overshoot above 98 so hyperoxia is
 * reachable, because being able to over-oxygenate is the point.
 */
export function spo2TargetFor(device: OxygenDevice, flowLpm: number): number {
  const f = fiO2For(device, flowLpm);
  if (device === "none") return 95;
  // Maps 0.21 -> 95 through to 1.0 -> 100, with the steep part where the
  // clinically interesting decisions are.
  return Math.max(90, Math.min(100, 95 + (f - 0.21) * 6.5));
}

/** JRCALC target ranges. Most patients want 94-98%; anyone at risk of
 *  hypercapnic respiratory failure (COPD and friends) wants 88-92%. */
export const SPO2_TARGET = { min: 94, max: 98 } as const;
export const SPO2_TARGET_COPD = { min: 88, max: 92 } as const;

export type OxygenState = {
  device: OxygenDevice;
  flowLpm: number;
  /** Epoch ms this delivery was set. */
  at: number;
};

export function oxygenLabel(o: OxygenState | undefined): string {
  if (!o || o.device === "none") return "Room air";
  if (o.device === "venturi") {
    const pct = Math.round(fiO2For(o.device, o.flowLpm) * 100);
    return `Venturi ${pct}%`;
  }
  return `${OXYGEN_DEVICE_LABEL[o.device]} · ${o.flowLpm} L/min`;
}

/** How the current delivery reads against the target range — the line the
 *  panel shows under the control. */
export function oxygenVerdict(
  spo2: number | undefined,
  copdRisk = false,
): { text: string; tone: "good" | "warn" | "bad" } {
  const range = copdRisk ? SPO2_TARGET_COPD : SPO2_TARGET;
  if (spo2 === undefined) return { text: "No saturation reading", tone: "warn" };
  if (spo2 < range.min - 4)
    return { text: `Hypoxic — ${Math.round(spo2)}%, well below target`, tone: "bad" };
  if (spo2 < range.min)
    return { text: `Below target ${range.min}-${range.max}% — increase`, tone: "warn" };
  if (spo2 >= range.max + 2)
    return {
      text: `Over-oxygenated — ${Math.round(spo2)}%, titrate down to ${range.min}-${range.max}%`,
      tone: "bad",
    };
  if (spo2 > range.max)
    return { text: `Slightly above ${range.min}-${range.max}% — ease off`, tone: "warn" };
  return { text: `On target ${range.min}-${range.max}%`, tone: "good" };
}
