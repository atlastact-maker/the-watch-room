import type { Scenario } from "../incident_types";
import { scenario02 } from "./02_dwelling_fire_wythenshawe";
import { scenario03 } from "./03_rtc_m60_entrapment";

// Registry of available scenarios. Add new scenarios here as they're converted
// from data/research/fire/scenarios/*.md to TypeScript.
export const SCENARIOS: Scenario[] = [scenario02, scenario03];

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
