"use server";

import { currentUser } from "@/lib/supabase/server";
import { hasShiftAccess } from "@/lib/auth/operator-access";
import {
  DETAIL_MAX,
  SUMMARY_MAX,
  isBugCategory,
  isBugSeverity,
  type BugContext,
  type BugReportInput,
} from "@/lib/bug-reports";

export type SubmitBugResult = { ok: true; id: string } | { ok: false; error: string };

/** File a bug report from the desk or the ops centre. The reporter's own
 *  session does the insert, so the table's own policy — insert your own
 *  row — is what allows it, and the identity on the row comes from the
 *  session, never from the form. */
export async function submitBugReport(input: BugReportInput): Promise<SubmitBugResult> {
  const { supabase, user } = await currentUser();
  if (!user) return { ok: false, error: "You are signed out. Sign in and try again." };
  if (!(await hasShiftAccess(supabase, user.email))) {
    return { ok: false, error: "Only testers and operators can file reports." };
  }

  const summary = String(input.summary ?? "").trim().slice(0, SUMMARY_MAX);
  const detail = String(input.detail ?? "").trim().slice(0, DETAIL_MAX);
  if (!summary || !detail) return { ok: false, error: "Add a summary and what happened." };
  const category = isBugCategory(input.category) ? input.category : "broken";
  const severity = isBugSeverity(input.severity) ? input.severity : "minor";

  // Context is trimmed to what the console shows: short strings and a
  // bounded log tail. Anything else the client sent is dropped.
  const c = input.context ?? {};
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);
  const context: BugContext = {
    scenario: str(c.scenario, 120),
    incidentRef: str(c.incidentRef, 40),
    screen: str(c.screen, 40),
    page: str(c.page, 200),
    version: str(c.version, 20),
    viewport: str(c.viewport, 40),
    userAgent: str(c.userAgent, 300),
    logTail: Array.isArray(c.logTail)
      ? c.logTail.filter((l): l is string => typeof l === "string").slice(-25).map((l) => l.slice(0, 300))
      : undefined,
  };

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const { data, error } = await supabase
    .from("bug_reports")
    .insert({
      user_id: user.id,
      email: user.email ?? "",
      callsign: typeof metadata.callsign === "string" ? metadata.callsign : "",
      category,
      severity,
      summary,
      detail,
      context,
    })
    .select("id")
    .single();
  if (error) {
    // Before migration 017 the table does not exist; say so plainly
    // rather than showing a database message to a tester.
    const missing = /bug_reports/.test(error.message) && /not find|does not exist|schema cache/i.test(error.message);
    return {
      ok: false,
      error: missing
        ? "Reports are not switched on yet on this server — tell the team in Discord for now."
        : `Could not file the report: ${error.message}`,
    };
  }
  return { ok: true, id: String(data.id) };
}
