// Advisor profile sync — advisor details captured at signup live in
// user_metadata (which survives the email-confirmation gap, when no
// session exists to write the table). On the first authenticated visit
// this pushes them into the advisors table so they show up for review.
// Best-effort: missing table / no session / offline all no-op.

import { createClient } from "@/lib/supabase/client";

export async function syncAdvisorProfile(): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const meta = user.user_metadata as {
      advisor?: boolean;
      callsign?: string;
      advisor_service?: string;
      advisor_background?: string;
      advisor_notes?: string;
    } | null;
    if (!meta?.advisor || !meta.advisor_service) return;

    const { data: existing, error } = await supabase
      .from("advisors")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || existing) return;

    await supabase.from("advisors").insert({
      user_id: user.id,
      callsign: (meta.callsign ?? "OPERATOR").slice(0, 24),
      service: meta.advisor_service,
      background: meta.advisor_background ?? "",
      notes: meta.advisor_notes ?? "",
    });
  } catch {
    // best-effort
  }
}
