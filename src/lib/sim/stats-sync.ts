// Account sync for the career record. localStorage stays the fast local
// store; this layer reconciles it with the per-user row in Supabase so
// the Service Record follows the account across devices and feeds the
// leaderboard. Merging is max-per-counter — counters only ever grow, so
// taking the larger side per field is safe whichever device is stale,
// and a fresh browser can never wipe a real record with zeros.
//
// Everything here is best-effort: no table, no session, or no network
// just falls back to the local record without breaking gameplay.

import { createClient } from "@/lib/supabase/client";
import {
  commandScore,
  emptyStats,
  loadCareerStats,
  saveCareerStats,
  type CareerStats,
  type Grade,
} from "./stats";

type StatsRow = {
  user_id: string;
  callsign: string;
  score: number;
  calls_answered: number;
  incidents_resolved: number;
  grades: Record<string, number>;
  resources_allocated: number;
  first_alloc_sum_sec: number;
  first_alloc_count: number;
  targets_met: number;
  targets_total: number;
  casualties_saved: number;
  casualties_lost: number;
  by_type: Record<string, number>;
  updated_at: string;
};

const GRADE_KEYS: Grade[] = ["A", "B", "C", "D", "F"];

function rowToStats(row: StatsRow): CareerStats {
  const base = emptyStats();
  return {
    ...base,
    callsAnswered: row.calls_answered ?? 0,
    incidentsResolved: row.incidents_resolved ?? 0,
    grades: { ...base.grades, ...(row.grades ?? {}) },
    resourcesAllocated: row.resources_allocated ?? 0,
    firstAllocSumSec: row.first_alloc_sum_sec ?? 0,
    firstAllocCount: row.first_alloc_count ?? 0,
    targetsMet: row.targets_met ?? 0,
    targetsTotal: row.targets_total ?? 0,
    casualtiesSaved: row.casualties_saved ?? 0,
    casualtiesLost: row.casualties_lost ?? 0,
    byType: row.by_type ?? {},
    updatedAt: Date.parse(row.updated_at) || 0,
  };
}

function maxMergeMaps(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = Math.max(out[k] ?? 0, v);
  return out;
}

/** Per-field max merge — see the header comment for why this is safe. */
export function mergeStats(a: CareerStats, b: CareerStats): CareerStats {
  const grades = {} as CareerStats["grades"];
  for (const g of GRADE_KEYS) grades[g] = Math.max(a.grades[g] ?? 0, b.grades[g] ?? 0);
  // Paired fields travel together from whichever side has the bigger pair.
  const alloc =
    b.firstAllocCount > a.firstAllocCount
      ? { firstAllocSumSec: b.firstAllocSumSec, firstAllocCount: b.firstAllocCount }
      : { firstAllocSumSec: a.firstAllocSumSec, firstAllocCount: a.firstAllocCount };
  const targets =
    b.targetsTotal > a.targetsTotal
      ? { targetsMet: b.targetsMet, targetsTotal: b.targetsTotal }
      : { targetsMet: a.targetsMet, targetsTotal: a.targetsTotal };
  return {
    callsAnswered: Math.max(a.callsAnswered, b.callsAnswered),
    incidentsResolved: Math.max(a.incidentsResolved, b.incidentsResolved),
    grades,
    resourcesAllocated: Math.max(a.resourcesAllocated, b.resourcesAllocated),
    ...alloc,
    ...targets,
    casualtiesSaved: Math.max(a.casualtiesSaved, b.casualtiesSaved),
    casualtiesLost: Math.max(a.casualtiesLost, b.casualtiesLost),
    byType: maxMergeMaps(a.byType, b.byType),
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}

/** Reconcile local ↔ account and return the merged record. Falls back to
 *  the local record on any failure. */
export async function syncCareerStats(): Promise<CareerStats> {
  const local = loadCareerStats();
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return local;

    const { data: row, error } = await supabase
      .from("career_stats")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) return local; // table not migrated yet, etc.

    const server = row ? rowToStats(row as StatsRow) : emptyStats();
    const merged = mergeStats(server, local);
    saveCareerStats(merged);

    const callsign =
      ((user.user_metadata as { callsign?: string } | null)?.callsign ?? "OPERATOR")
        .toUpperCase()
        .slice(0, 24);
    await supabase.from("career_stats").upsert({
      user_id: user.id,
      callsign,
      score: commandScore(merged),
      calls_answered: merged.callsAnswered,
      incidents_resolved: merged.incidentsResolved,
      grades: merged.grades,
      resources_allocated: merged.resourcesAllocated,
      first_alloc_sum_sec: merged.firstAllocSumSec,
      first_alloc_count: merged.firstAllocCount,
      targets_met: merged.targetsMet,
      targets_total: merged.targetsTotal,
      casualties_saved: merged.casualtiesSaved,
      casualties_lost: merged.casualtiesLost,
      by_type: merged.byType,
      updated_at: new Date().toISOString(),
    });
    return merged;
  } catch {
    return local;
  }
}

export type LeaderboardRow = {
  rank: number;
  callsign: string;
  score: number;
  incidentsResolved: number;
  casualtiesSaved: number;
  isYou: boolean;
};

/** Top operators by command points. `null` means the leaderboard isn't
 *  available (table missing / offline) rather than merely empty. */
export async function fetchLeaderboard(limit = 20): Promise<LeaderboardRow[] | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("career_stats")
      .select("user_id,callsign,score,incidents_resolved,casualties_saved")
      .order("score", { ascending: false })
      .order("incidents_resolved", { ascending: false })
      .limit(limit);
    if (error || !data) return null;
    return data.map((r, i) => ({
      rank: i + 1,
      callsign: (r.callsign as string) || "OPERATOR",
      score: (r.score as number) ?? 0,
      incidentsResolved: (r.incidents_resolved as number) ?? 0,
      casualtiesSaved: (r.casualties_saved as number) ?? 0,
      isYou: !!user && r.user_id === user.id,
    }));
  } catch {
    return null;
  }
}
