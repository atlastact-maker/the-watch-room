// Service coverage — the pre-shift choice of which services the operator
// is covering. A scenario is only available when every service its PDA
// calls for is covered: you can't take a job end-to-end if the crews it
// needs aren't yours to run.

import type { Scenario } from "./incident_types";
import type { ServiceCode } from "./types";

export const ALL_SERVICES: ServiceCode[] = ["Fire", "Ambulance", "Police"];

export const COVERED_SERVICES_KEY = "twr:covered-services:v1";

/** Unique services this scenario's PDA calls for, in display order. */
export function scenarioServices(s: Scenario): ServiceCode[] {
  const set = new Set(s.pda.map((slot) => slot.service));
  return ALL_SERVICES.filter((svc) => set.has(svc));
}

/** True when every service the scenario needs is in the covered set. */
export function scenarioCovered(
  s: Scenario,
  covered: readonly ServiceCode[],
): boolean {
  return scenarioServices(s).every((svc) => covered.includes(svc));
}

/** Parse a persisted covered-services list; falls back to all three. */
export function parseCoveredServices(raw: string | null): ServiceCode[] {
  try {
    const arr = JSON.parse(raw ?? "");
    if (Array.isArray(arr)) {
      const valid = ALL_SERVICES.filter((s) => arr.includes(s));
      if (valid.length > 0) return valid;
    }
  } catch {
    // fall through
  }
  return [...ALL_SERVICES];
}
