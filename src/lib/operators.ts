import type { SupabaseClient } from "@supabase/supabase-js";
import { serviceKeyFor, type ServiceKey } from "@/app/components/service-insignia";
import { EMPTY_FACTS, type GrantedAward, type HonourFacts } from "./awards";

// Other operators, as the site shows them to a signed-in account: the
// public profile, the colleague list and the operator search. All of it
// comes through the SECURITY DEFINER functions of migration 028, which
// decide what the caller may see; nothing here reads auth.users. Every
// loader reports `missing` when the migration has not been run, so the
// pages can say so instead of failing.

export type Visibility = "open" | "colleagues" | "private";
export type Relation = "self" | "none" | "colleague" | "requested" | "pending" | "declined";
export type Role = "admin" | "operator" | "advisor" | null;

export type ProfileStats = {
  score: number;
  calls_answered: number;
  incidents_resolved: number;
  grades: Partial<Record<"A" | "B" | "C" | "D" | "F", number>> | null;
  resources_allocated: number;
  first_alloc_sum_sec: number;
  first_alloc_count: number;
  targets_met: number;
  targets_total: number;
  casualties_saved: number;
  casualties_lost: number;
  by_type: Record<string, number> | null;
  updated_at: string;
};

export type OperatorProfile = {
  userId: string;
  callsign: string;
  joinedAt: string;
  role: Role;
  insignia: ServiceKey | null;
  advisor: boolean;
  tester: boolean;
  visibility: Visibility;
  relation: Relation;
  /** Whether the record is open to the caller. */
  visible: boolean;
  stats: ProfileStats | null;
  rank: number | null;
  players: number;
  colleagues: number;
  awards: GrantedAward[];
  /** The Discord handle, to self and colleagues only. */
  discord: string | null;
  lastActive: string | null;
  facts: HonourFacts;
};

type ProfileRow = {
  user_id: string;
  callsign: string;
  joined_at: string;
  assigned_role: Role;
  insignia: string | null;
  advisor_service: string | null;
  advisor: boolean;
  tester: boolean;
  visibility: string;
  relation: string;
  visible: boolean;
  stats: ProfileStats | null;
  rank: number | string | null;
  players: number | string;
  colleagues: number | string;
  awards: { id: string; key: string; citation: string; granted_at: string }[] | null;
  discord: string | null;
  facts: {
    incidents?: number; calls?: number; conveyed?: number; grade_a?: number; graded?: number;
    mean_first_alloc?: number | null; targets_met?: number; targets_total?: number; types?: number; bug_reports?: number; last_active?: string | null;
  } | null;
};

const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() && Number.isFinite(Number(v)) ? Number(v) : d);

const INSIGNIA = new Set(["fire", "ambulance", "police", "control", "specialist"]);
export function insigniaOf(icon: string | null | undefined, advisorService?: string | null): ServiceKey | null {
  if (icon && INSIGNIA.has(icon)) return icon as ServiceKey;
  return serviceKeyFor(advisorService ?? null);
}

/** Whether a Supabase error says migration 028 is not there yet. */
function missing028(message: string | undefined): boolean {
  return !!message && /operator_profile|my_colleagues|search_operators|colleague_request|colleague_respond|colleague_remove|public\.colleagues|user_awards|schema cache/i.test(message);
}

export function profileFromRow(row: ProfileRow): OperatorProfile {
  const f = row.facts ?? {};
  const facts: HonourFacts = {
    ...EMPTY_FACTS,
    joinedAt: row.joined_at ?? null,
    tester: !!row.tester,
    advisor: !!row.advisor,
    bugReports: num(f.bug_reports),
    incidentsResolved: num(f.incidents),
    casualtiesSaved: num(f.conveyed),
    gradeA: num(f.grade_a),
    graded: num(f.graded),
    meanFirstAllocSec: typeof f.mean_first_alloc === "number" && Number.isFinite(f.mean_first_alloc) ? f.mean_first_alloc : null,
    targetsMet: num(f.targets_met),
    targetsTotal: num(f.targets_total),
    distinctTypes: num(f.types),
  };
  const visibility: Visibility = row.visibility === "colleagues" || row.visibility === "private" ? row.visibility : "open";
  const relation: Relation = (["self", "none", "colleague", "requested", "pending", "declined"] as Relation[]).includes(row.relation as Relation) ? (row.relation as Relation) : "none";
  return {
    userId: row.user_id,
    callsign: row.callsign || "OPERATOR",
    joinedAt: row.joined_at,
    role: row.assigned_role ?? null,
    insignia: insigniaOf(row.insignia, row.advisor_service),
    advisor: !!row.advisor,
    tester: !!row.tester,
    visibility,
    relation,
    visible: !!row.visible,
    stats: row.visible ? row.stats ?? null : null,
    rank: row.rank === null || row.rank === undefined ? null : num(row.rank, 0) || null,
    players: num(row.players),
    colleagues: num(row.colleagues),
    awards: (row.awards ?? []).map((a) => ({ id: a.id, key: a.key, citation: a.citation ?? "", grantedAt: a.granted_at })),
    discord: row.discord ?? null,
    lastActive: typeof f.last_active === "string" ? f.last_active : null,
    facts,
  };
}

export async function loadOperatorProfile(supabase: SupabaseClient, userId: string): Promise<{ profile: OperatorProfile | null; missing: boolean }> {
  const { data, error } = await supabase.rpc("operator_profile", { p_user_id: userId });
  if (error) {
    if (missing028(error.message)) return { profile: null, missing: true };
    throw new Error(error.message);
  }
  const row = ((data ?? []) as ProfileRow[])[0];
  return { profile: row ? profileFromRow(row) : null, missing: false };
}

export type ColleagueRow = {
  userId: string;
  callsign: string;
  relation: "colleague" | "requested" | "pending";
  since: string;
  insignia: ServiceKey | null;
  role: Role;
  score: number;
  incidentsResolved: number;
  lastActive: string | null;
};

type ColleagueRaw = { user_id: string; callsign: string; relation: string; since: string; insignia: string | null; assigned_role: Role; score: number; incidents_resolved: number; last_active: string | null };

export async function loadColleagues(supabase: SupabaseClient): Promise<{ rows: ColleagueRow[]; missing: boolean }> {
  const { data, error } = await supabase.rpc("my_colleagues");
  if (error) {
    if (missing028(error.message)) return { rows: [], missing: true };
    throw new Error(error.message);
  }
  return {
    missing: false,
    rows: ((data ?? []) as ColleagueRaw[]).map((r) => ({
      userId: r.user_id,
      callsign: r.callsign || "OPERATOR",
      relation: r.relation === "colleague" || r.relation === "requested" ? r.relation : "pending",
      since: r.since,
      insignia: insigniaOf(r.insignia),
      role: r.assigned_role ?? null,
      score: num(r.score),
      incidentsResolved: num(r.incidents_resolved),
      lastActive: r.last_active ?? null,
    })),
  };
}

export type OperatorHit = {
  userId: string;
  callsign: string;
  relation: Relation;
  insignia: ServiceKey | null;
  role: Role;
  tester: boolean;
  score: number;
  incidentsResolved: number;
  lastActive: string | null;
};

type HitRaw = { user_id: string; callsign: string; relation: string; insignia: string | null; assigned_role: Role; tester: boolean; score: number; incidents_resolved: number; last_active: string | null };

export async function searchOperators(supabase: SupabaseClient, query: string, limit = 24): Promise<{ rows: OperatorHit[]; missing: boolean }> {
  const { data, error } = await supabase.rpc("search_operators", { p_query: query.trim() || null, p_limit: limit });
  if (error) {
    if (missing028(error.message)) return { rows: [], missing: true };
    throw new Error(error.message);
  }
  return {
    missing: false,
    rows: ((data ?? []) as HitRaw[]).map((r) => ({
      userId: r.user_id,
      callsign: r.callsign || "OPERATOR",
      relation: (["self", "none", "colleague", "requested", "pending", "declined"] as Relation[]).includes(r.relation as Relation) ? (r.relation as Relation) : "none",
      insignia: insigniaOf(r.insignia),
      role: r.assigned_role ?? null,
      tester: !!r.tester,
      score: num(r.score),
      incidentsResolved: num(r.incidents_resolved),
      lastActive: r.last_active ?? null,
    })),
  };
}

/** Requests waiting for this account, for the sidebar's count. Reads the
 *  caller's own rows under RLS; 0 when the table is not there. */
export async function pendingColleagueCount(supabase: SupabaseClient, userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("colleagues")
      .select("requester_id", { count: "exact", head: true })
      .eq("addressee_id", userId)
      .eq("status", "pending");
    return error ? 0 : count ?? 0;
  } catch {
    return 0;
  }
}

export const isUuid = (s: string | undefined | null): s is string => typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/** "2 days ago", "3 h ago", for a last-active stamp; "" with none. */
export function sinceLabel(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return "";
  const ms = now - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return "";
  const min = Math.floor(ms / 60_000);
  if (min < 2) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 60) return `${d} days ago`;
  const months = Math.floor(d / 30);
  return months < 24 ? `${months} months ago` : `${Math.floor(months / 12)} years ago`;
}

/** 17/10/2026, for joined-on dates. */
export function dateLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export const ROLE_LABEL: Record<"admin" | "operator" | "advisor" | "none", string> = { admin: "Administrator", operator: "Operator", advisor: "Advisor", none: "Operator" };
export const roleLabel = (role: Role) => ROLE_LABEL[role ?? "none"];
