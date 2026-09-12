import { SAVE_MAX_AGE_MS, SHIFT_SAVE_VERSION } from "./save";
import type { LastShift } from "./stats";
import type { ServiceCode } from "./types";
import type { ShiftIntensity } from "./shift";

export const WATCH_SERVICES: ServiceCode[] = ["Fire", "Ambulance", "Police"];
export type WatchPreparation = { intensity: ShiftIntensity; services: ServiceCode[] };
export type MenuPlayerState = {
  save: { savedAt: number; title: string; intensity: string } | null;
  last: LastShift | null;
};

function parse(raw: string | null): Record<string, unknown> | null {
  try { const value = raw ? JSON.parse(raw) : null; return value && typeof value === "object" && !Array.isArray(value) ? value : null; }
  catch { return null; }
}

/** Read-only projection of the same device saves used by the simulation. */
export function menuPlayerState(saveRaw: string | null, lastRaw: string | null, now: number): MenuPlayerState {
  const saved = parse(saveRaw), last = parse(lastRaw);
  const validSave = (saved?.version === SHIFT_SAVE_VERSION || saved?.version === 2) && saved.patch === "GreaterManchester" &&
    typeof saved.savedAt === "number" && Number.isFinite(saved.savedAt) && saved.savedAt <= now + 60000 && now - saved.savedAt <= SAVE_MAX_AGE_MS &&
    ["quiet", "normal", "busy"].includes(String(saved.intensity)) && Array.isArray(saved.deployments);
  const incident = saved?.activeIncident as { scenario?: { title?: unknown } } | null;
  const validLast = last && ["A", "B", "C", "D", "F"].includes(String(last.grade)) &&
    typeof last.incidentTitle === "string" && typeof last.resolvedAt === "number" && Number.isFinite(last.resolvedAt) &&
    ["targetsMet", "targetsTotal", "resourcesUsed", "casualtiesSaved", "casualtiesLost"].every(k => typeof last[k] === "number" && Number.isFinite(last[k]) && (last[k] as number) >= 0);
  return {
    save: validSave ? { savedAt: saved.savedAt as number, title: typeof incident?.scenario?.title === "string" ? incident.scenario.title : "Area dispatch", intensity: String(saved.intensity) } : null,
    last: validLast ? last as unknown as LastShift : null,
  };
}

export function parseWatchPreparation(params: URLSearchParams): WatchPreparation | null {
  if (params.get("prepared") !== "1") return null;
  const intensity = params.get("intensity");
  if (intensity !== "quiet" && intensity !== "normal" && intensity !== "busy") return null;
  const requested = (params.get("services") ?? "").split(",");
  if (!requested.length || requested.some(s => !WATCH_SERVICES.includes(s as ServiceCode))) return null;
  const services = WATCH_SERVICES.filter(s => requested.includes(s));
  return services.length ? { intensity, services } : null;
}

export function preparedWatchUrl(preparation: WatchPreparation): string {
  const params = new URLSearchParams({ new: "1", prepared: "1", intensity: preparation.intensity, services: preparation.services.join(",") });
  if (!parseWatchPreparation(params)) throw new Error("Choose at least one valid service before starting a watch.");
  return `/dashboard?${params}`;
}
