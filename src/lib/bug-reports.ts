// The shape of a bug report, shared by the desk's dialog, the ops-centre
// feedback form, the server action that files it and the admin console
// that triages it.

export const BUG_CATEGORIES = [
  { value: "broken", label: "Something is broken" },
  { value: "realism", label: "Gameplay & realism" },
  { value: "suggestion", label: "Suggestion" },
  { value: "accessibility", label: "Accessibility" },
] as const;
export type BugCategory = (typeof BUG_CATEGORIES)[number]["value"];

export const BUG_SEVERITIES = [
  { value: "blocker", label: "Blocker — could not carry on" },
  { value: "major", label: "Major — wrong, but worked around" },
  { value: "minor", label: "Minor — cosmetic or a niggle" },
] as const;
export type BugSeverity = (typeof BUG_SEVERITIES)[number]["value"];

export const BUG_STATUSES = ["open", "looking", "fixed", "closed"] as const;
export type BugStatus = (typeof BUG_STATUSES)[number];

/** What the desk knew when the report was filed. Every field optional:
 *  the ops-centre form has no shift to describe. */
export type BugContext = {
  scenario?: string;
  incidentRef?: string;
  screen?: string;
  page?: string;
  version?: string;
  viewport?: string;
  userAgent?: string;
  /** The last lines of the incident log, oldest first. */
  logTail?: string[];
};

export type BugReportInput = {
  category: BugCategory;
  severity: BugSeverity;
  summary: string;
  detail: string;
  context: BugContext;
};

export const SUMMARY_MAX = 140;
export const DETAIL_MAX = 4000;

export function isBugCategory(v: unknown): v is BugCategory {
  return BUG_CATEGORIES.some((c) => c.value === v);
}
export function isBugSeverity(v: unknown): v is BugSeverity {
  return BUG_SEVERITIES.some((s) => s.value === v);
}
export function isBugStatus(v: unknown): v is BugStatus {
  return (BUG_STATUSES as readonly string[]).includes(String(v));
}
