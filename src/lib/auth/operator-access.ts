import type { SupabaseClient } from "@supabase/supabase-js";
import {
  serviceKeyFor,
  type ServiceKey,
} from "@/app/components/service-insignia";

// Closed development: the game is locked while accounts and advisor
// sign-ups stay open. Signing up is the advisor programme's front door,
// so registration must keep working — what is gated is the operator
// side: the menu and the shift itself.
//
// Two ways in, checked in order:
//
//  1. The env/default allowlist — OPERATOR_ALLOWLIST (comma-separated
//     emails), with the developer's own account as the zero-config
//     default. This path needs no database, so a broken or missing
//     user_roles table can never lock the developer out.
//
//  2. A row in public.user_roles (migration 004) — assigned from the
//     Supabase Table editor, two clicks and no redeploy. Keyed by email
//     so a tester can be pre-authorised before they have signed up.

const DEFAULT_OPERATORS = ["atlastact@gmail.com"];

export function isOperator(email: string | undefined | null): boolean {
  if (!email) return false;
  const raw = process.env.OPERATOR_ALLOWLIST;
  const list = raw
    ? raw
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    : DEFAULT_OPERATORS;
  return list.includes(email.trim().toLowerCase());
}

export type AccessRole = "admin" | "operator" | "advisor";

export type AccessProfile = {
  role: AccessRole | null;
  /** Emoji set by the developer in the user_roles table; "" for none. */
  icon: string;
};

/** The account's assigned role and icon, from user_roles (migrations
 *  004/005). Null role when unassigned, the table is missing, or the
 *  lookup fails — callers treat that as plain standby. */
export async function accessProfile(
  supabase: SupabaseClient,
  email: string | undefined | null,
): Promise<AccessProfile> {
  if (!email) return { role: null, icon: "" };
  try {
    // ilike with no wildcard = case-insensitive equality; RLS restricts
    // the query to the caller's own row anyway.
    const { data } = await supabase
      .from("user_roles")
      .select("role, icon")
      .ilike("email", email.trim())
      .maybeSingle();
    const role = data?.role;
    return {
      role:
        role === "admin" || role === "operator" || role === "advisor"
          ? role
          : null,
      icon: typeof data?.icon === "string" ? data.icon : "",
    };
  } catch {
    return { role: null, icon: "" };
  }
}

/** The insignia this account wears, as a ServiceKey for the
 *  service-insignia components. The icon column in user_roles overrides
 *  when it holds a valid key (fire / ambulance / police / control /
 *  specialist); otherwise the key derives from the service declared on
 *  the advisor application, so accepting an application is one row with
 *  nothing extra to fill in. Reads the caller's own advisors row, which
 *  RLS permits. */
export async function resolveInsignia(
  supabase: SupabaseClient,
  userId: string | undefined | null,
  assignedIcon: string,
): Promise<ServiceKey | null> {
  const override = assignedIcon.trim().toLowerCase();
  if (
    override === "fire" ||
    override === "ambulance" ||
    override === "police" ||
    override === "control" ||
    override === "specialist"
  ) {
    return override;
  }
  if (!userId) return null;
  try {
    const { data } = await supabase
      .from("advisors")
      .select("service")
      .eq("user_id", userId)
      .maybeSingle();
    return serviceKeyFor(data?.service);
  } catch {
    return null;
  }
}

/** Whether this account may open the menu and run a shift. Advisor is
 *  deliberately not enough — advising is about authenticity review, and
 *  an advisor is promoted to operator per person when playtesting is
 *  wanted. */
export async function hasShiftAccess(
  supabase: SupabaseClient,
  email: string | undefined | null,
): Promise<boolean> {
  if (isOperator(email)) return true;
  const { role } = await accessProfile(supabase, email);
  return role === "admin" || role === "operator";
}

/** Whether this account may open the admin area. Stricter than shift
 *  access on purpose: the env allowlist admits testers to play, not to
 *  read applications — admin is the assigned role only, with the
 *  developer's own account hardwired as bootstrap so a fresh database
 *  can never lock the one person who administers it out. */
const DEFAULT_ADMINS = ["atlastact@gmail.com"];

export async function hasAdminAccess(
  supabase: SupabaseClient,
  email: string | undefined | null,
): Promise<boolean> {
  if (email && DEFAULT_ADMINS.includes(email.trim().toLowerCase())) return true;
  const { role } = await accessProfile(supabase, email);
  return role === "admin";
}
