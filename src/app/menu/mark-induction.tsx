"use client";

import { useEffect } from "react";
import { markInduction, type InductionFlags } from "./induction";

/** Ticks one induction step when the page it belongs to is opened. */
export function MarkInduction({ step }: { step: keyof InductionFlags }) {
  useEffect(() => { markInduction({ [step]: true }); }, [step]);
  return null;
}
