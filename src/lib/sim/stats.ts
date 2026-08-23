// Career statistics — accumulated across every shift on this device.
// Stored in localStorage next to the shift save; written through small
// "bump" mutations at the moments that matter (call answered, resource
// mobilised, incident scored) so the stats page needs no game state.

export type Grade = "A" | "B" | "C" | "D" | "F";

export type CareerStats = {
  /** 999 calls taken (scenarios answered). */
  callsAnswered: number;
  /** Incidents closed with a stop message and scored. */
  incidentsResolved: number;
  /** Dispatch grade counts. */
  grades: Record<Grade, number>;
  /** Individual appliances mobilised across all incidents. */
  resourcesAllocated: number;
  /** Sum + count of call-open → first mobilisation, for the average. */
  firstAllocSumSec: number;
  firstAllocCount: number;
  /** Dispatch targets met / assessed across scored incidents. */
  targetsMet: number;
  targetsTotal: number;
  /** Casualties handed to hospital vs triaged expectant at close. */
  casualtiesSaved: number;
  casualtiesLost: number;
  /** Incidents answered by type code (e.g. dwelling_fire). */
  byType: Record<string, number>;
  updatedAt: number;
};

const KEY = "twr:career-stats:v1";

export function emptyStats(): CareerStats {
  return {
    callsAnswered: 0,
    incidentsResolved: 0,
    grades: { A: 0, B: 0, C: 0, D: 0, F: 0 },
    resourcesAllocated: 0,
    firstAllocSumSec: 0,
    firstAllocCount: 0,
    targetsMet: 0,
    targetsTotal: 0,
    casualtiesSaved: 0,
    casualtiesLost: 0,
    byType: {},
    updatedAt: 0,
  };
}

export function loadCareerStats(): CareerStats {
  if (typeof window === "undefined") return emptyStats();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as Partial<CareerStats>;
    // Merge over defaults so older saves survive shape additions.
    return { ...emptyStats(), ...parsed, grades: { ...emptyStats().grades, ...(parsed.grades ?? {}) } };
  } catch {
    return emptyStats();
  }
}

export function bumpStats(mutate: (s: CareerStats) => void): void {
  if (typeof window === "undefined") return;
  try {
    const s = loadCareerStats();
    mutate(s);
    s.updatedAt = Date.now();
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Stats are best-effort — never let them break gameplay.
  }
}
