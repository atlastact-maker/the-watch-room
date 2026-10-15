// Service coverage — the pre-shift choice of which services the operator
// is covering. A scenario is only available when every service its PDA
// calls for is covered: you can't take a job end-to-end if the crews it
// needs aren't yours to run.

import { CALL_CHANNELS, type CallChannel, type ScenarioMeta } from "./incident_types";
import type { ServiceCode } from "./types";

export const ALL_SERVICES: ServiceCode[] = ["Fire", "Ambulance", "Police"];

export const COVERED_SERVICES_KEY = "twr:covered-services:v1";
export const CALL_CHANNELS_KEY = "twr:call-channels:v1";

/** The service a job's nature belongs to, read off its type. */
export function serviceOfType(type: string): ServiceCode {
  return type.startsWith("ambulance") ? "Ambulance" : type.startsWith("police") ? "Police" : "Fire";
}

/** Unique services this scenario calls for, in display order: its PDA's,
 *  and its own — a call that closes at the desk with nobody sent still
 *  needs the desk that takes that kind of call. */
export function scenarioServices(s: Pick<ScenarioMeta, "pda" | "type">): ServiceCode[] {
  const set = new Set(s.pda.map((slot) => slot.service));
  set.add(serviceOfType(s.type));
  return ALL_SERVICES.filter((svc) => set.has(svc));
}

/** True when every service the scenario needs is in the covered set. */
export function scenarioCovered(
  s: Pick<ScenarioMeta, "pda" | "type">,
  covered: readonly ServiceCode[],
): boolean {
  return scenarioServices(s).every((svc) => covered.includes(svc));
}

/** Parse a persisted list of the lines the desk takes; 999 alone when
 *  nothing is held, and always 999. */
export function parseCallChannels(raw: string | null): CallChannel[] {
  try {
    const arr = JSON.parse(raw ?? "");
    if (Array.isArray(arr)) {
      const valid = CALL_CHANNELS.filter((c) => arr.includes(c));
      return valid.includes("999") ? valid : ["999", ...valid];
    }
  } catch {
    // fall through
  }
  return ["999"];
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
