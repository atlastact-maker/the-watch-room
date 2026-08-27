import type { SupabaseClient } from "@supabase/supabase-js";

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

/** Whether this account may open the menu and run a shift. */
export async function hasShiftAccess(
  supabase: SupabaseClient,
  email: string | undefined | null,
): Promise<boolean> {
  if (isOperator(email)) return true;
  if (!email) return false;
  try {
    // ilike with no wildcard = case-insensitive equality; RLS restricts
    // the query to the caller's own row anyway.
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .ilike("email", email.trim())
      .maybeSingle();
    return data?.role === "admin" || data?.role === "operator";
  } catch {
    // Table missing (migration 004 not run yet) or transient failure —
    // fall back to the allowlist result, which was false.
    return false;
  }
}
