import type { SupabaseClient } from "@supabase/supabase-js";

// Where an account stands with the advisor programme — the one place
// that decides, so the standby page, Settings and the applicant all
// agree on the answer.
//
// The subtlety is that an application lives in two places. Ticking the
// box at signup writes user_metadata (which survives the
// email-confirmation gap, when there is no session to write with); the
// row in public.advisors is what the admin area actually reviews. The
// metadata flag alone therefore does NOT mean anyone can see the
// application — hence "unfiled", which used to read as "received".
//
//   none      — never applied.
//   unfiled   — applied in metadata, but no advisors row exists, so the
//               application is invisible to review. Repaired by
//               <AdvisorSync />, which files it and refreshes.
//   pending   — filed, waiting on a decision.
//   declined  — reviewed and turned down (advisors.declined_at, set by an
//               admin). Distinct from pending because "we looked and the
//               answer is no" is not the same as "nobody has looked yet",
//               and the applicant is owed the difference.
//   accepted  — role 'advisor' assigned in user_roles.
export type AdvisorStanding =
  | "none"
  | "unfiled"
  | "pending"
  | "declined"
  | "accepted";

/** Whether the account ticked the advisor box, from auth user_metadata. */
export function advisorApplied(metadata: unknown): boolean {
  return Boolean((metadata as { advisor?: unknown } | null)?.advisor);
}

/** This account's own row in public.advisors, which RLS permits it to
 *  read (migration 002). Any failure counts as "not filed" — the sync
 *  then retries, which is harmless, rather than the applicant being told
 *  they are on a list they are not on. */
async function application(
  supabase: SupabaseClient,
  userId: string | undefined | null,
): Promise<{ filed: boolean; declined: boolean }> {
  const missing = { filed: false, declined: false };
  if (!userId) return missing;
  try {
    const { data, error } = await supabase
      .from("advisors")
      .select("user_id, declined_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (!error) return { filed: Boolean(data), declined: Boolean(data?.declined_at) };

    // declined_at arrives in migration 010. If the deploy is ahead of the
    // migration the select above fails on the unknown column, and reading
    // that as "no application" would tell every waiting applicant their
    // application had not been filed. Fall back to the pre-010 shape.
    const { data: legacy, error: legacyError } = await supabase
      .from("advisors")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (legacyError || !legacy) return missing;
    return { filed: true, declined: false };
  } catch {
    return missing;
  }
}

/** The account's standing. `role` comes from accessProfile() so the
 *  caller makes one user_roles read rather than two. */
export async function advisorStanding(
  supabase: SupabaseClient,
  user: { id?: string; user_metadata?: unknown } | null,
  role: string | null,
): Promise<AdvisorStanding> {
  // Acceptance is checked first, so a decline that was later overturned
  // by granting the role reads as accepted rather than as both.
  if (role === "advisor") return "accepted";
  if (!advisorApplied(user?.user_metadata)) return "none";
  const app = await application(supabase, user?.id);
  if (!app.filed) return "unfiled";
  return app.declined ? "declined" : "pending";
}
