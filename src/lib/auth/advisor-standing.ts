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
//   accepted  — role 'advisor' assigned in user_roles.
export type AdvisorStanding = "none" | "unfiled" | "pending" | "accepted";

/** Whether the account ticked the advisor box, from auth user_metadata. */
export function advisorApplied(metadata: unknown): boolean {
  return Boolean((metadata as { advisor?: unknown } | null)?.advisor);
}

/** Whether this account's application has reached public.advisors.
 *  Reads the caller's own row, which RLS permits (migration 002).
 *  Any failure counts as "not filed" — the sync then retries, which is
 *  harmless, rather than the applicant being told they are on a list
 *  they are not on. */
async function applicationFiled(
  supabase: SupabaseClient,
  userId: string | undefined | null,
): Promise<boolean> {
  if (!userId) return false;
  try {
    const { data, error } = await supabase
      .from("advisors")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    return !error && Boolean(data);
  } catch {
    return false;
  }
}

/** The account's standing. `role` comes from accessProfile() so the
 *  caller makes one user_roles read rather than two. */
export async function advisorStanding(
  supabase: SupabaseClient,
  user: { id?: string; user_metadata?: unknown } | null,
  role: string | null,
): Promise<AdvisorStanding> {
  if (role === "advisor") return "accepted";
  if (!advisorApplied(user?.user_metadata)) return "none";
  return (await applicationFiled(supabase, user?.id)) ? "pending" : "unfiled";
}
