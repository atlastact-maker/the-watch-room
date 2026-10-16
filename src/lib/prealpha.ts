import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

// The closed Pre-Alpha: when it opens, who is in it, and where an
// account stands with it. One place, so the front door, the standby
// page, the application page and the admin tab all agree.
//
// Sign-ups are open now and close at the end of 15th October 2026, as
// announced. PREALPHA_OPENS_AT and PREALPHA_CLOSES_AT in the environment
// move either end without a deploy of copy (an ISO timestamp; "now" for
// the opening, "never" for the close).

export const PREALPHA_DEFAULT_OPENS_AT = 0;
export const PREALPHA_DEFAULT_CLOSES_AT = Date.parse("2026-10-16T00:00:00+01:00");

export function prealphaClosesAt(): number {
  const raw = process.env.PREALPHA_CLOSES_AT?.trim();
  if (!raw) return PREALPHA_DEFAULT_CLOSES_AT;
  if (raw.toLowerCase() === "never") return Number.POSITIVE_INFINITY;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : PREALPHA_DEFAULT_CLOSES_AT;
}

/** Sign-ups have closed: the window ended. */
export function prealphaClosed(now = Date.now()): boolean {
  return now >= prealphaClosesAt();
}

/** The last day sign-ups are taken, as printed: "Thursday 15 October". */
export function prealphaClosesLabel(): string {
  const at = prealphaClosesAt();
  if (!Number.isFinite(at)) return "";
  return new Date(at - 1).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" });
}

export function prealphaOpensAt(): number {
  const raw = process.env.PREALPHA_OPENS_AT?.trim();
  if (!raw) return PREALPHA_DEFAULT_OPENS_AT;
  if (raw.toLowerCase() === "now") return 0;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : PREALPHA_DEFAULT_OPENS_AT;
}

/** Sign-ups are being taken: after the opening, before the close. */
export function prealphaOpen(now = Date.now()): boolean {
  return now >= prealphaOpensAt() && now < prealphaClosesAt();
}

export function prealphaOpensLabel(): string {
  const at = prealphaOpensAt();
  if (at <= 0) return "now";
  return new Date(at).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
}

/** The doors: whether accepts and invites can open the desk yet, or are
 *  only on the list. Flipped from /admin (migration 022). Read once per
 *  request. Before the migration the table is missing and the doors
 *  read as open, which is the behaviour the site had. */
export const PREALPHA_DOORS_KEY = "prealpha_doors";

export const prealphaDoors = cache(async function prealphaDoors(
  supabase: SupabaseClient,
): Promise<{ open: boolean; tableMissing: boolean; lookupFailed: boolean }> {
  try {
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", PREALPHA_DOORS_KEY).maybeSingle();
    if (error) {
      const missing = /site_settings/.test(error.message) || error.code === "42P01";
      return { open: missing, tableMissing: missing, lookupFailed: !missing };
    }
    return { open: (data?.value ?? "open") !== "closed", tableMissing: false, lookupFailed: false };
  } catch {
    return { open: false, tableMissing: false, lookupFailed: true };
  }
});

/** The sign-ups switch (migration 024): closed or open ahead of the
 *  calendar, or empty to follow it. Flipped from /admin; read once per
 *  request. Signed out, the key reads through its own policy; before
 *  the migration a logged-out read sees nothing and follows the
 *  calendar, which is what the site did. */
export const PREALPHA_SIGNUPS_KEY = "prealpha_signups";
export type SignupSwitch = "open" | "closed" | "calendar";

export const prealphaSignupSwitch = cache(async function prealphaSignupSwitch(
  supabase: SupabaseClient,
): Promise<{ value: SignupSwitch; lookupFailed: boolean }> {
  try {
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", PREALPHA_SIGNUPS_KEY).maybeSingle();
    if (error) {
      const missing = /site_settings/.test(error.message) || error.code === "42P01";
      return { value: "calendar", lookupFailed: !missing };
    }
    const v = data?.value;
    return { value: v === "open" || v === "closed" ? v : "calendar", lookupFailed: false };
  } catch {
    return { value: "calendar", lookupFailed: true };
  }
});

/** Whether sign-ups are being taken right now: the switch when it is
 *  set, the calendar otherwise. `closes` and `opens` are the calendar's
 *  dates as printed, empty when the switch decided. */
export type SignupWindow = { open: boolean; closed: boolean; bySwitch: boolean; closes: string; opens: string };

export const prealphaSignups = cache(async function prealphaSignups(supabase: SupabaseClient): Promise<SignupWindow> {
  const { value } = await prealphaSignupSwitch(supabase);
  if (value === "closed") return { open: false, closed: true, bySwitch: true, closes: "", opens: "" };
  if (value === "open") return { open: true, closed: false, bySwitch: true, closes: "", opens: "" };
  return { open: prealphaOpen(), closed: prealphaClosed(), bySwitch: false, closes: prealphaClosesLabel(), opens: prealphaOpensLabel() };
});

export type PreAlphaStanding = "none" | "pending" | "accepted" | "declined";

export type TesterApplication = {
  user_id: string;
  email: string;
  callsign: string;
  discord: string;
  platform: string;
  background: string;
  why: string;
  hours: string;
  agreed: boolean;
  status: PreAlphaStanding;
  note: string;
  created_at: string;
  decided_at: string | null;
};

/** This account's own request, which RLS lets it read. Any failure
 *  reads as "none": the worst case is being invited to request again, and
 *  the upsert then finds the row already there. */
export async function preAlphaApplication(
  supabase: SupabaseClient,
  userId: string | undefined | null,
): Promise<{ standing: PreAlphaStanding; application: TesterApplication | null; tableMissing: boolean }> {
  if (!userId) return { standing: "none", application: null, tableMissing: false };
  try {
    const { data, error } = await supabase
      .from("tester_applications")
      .select("user_id, email, callsign, discord, platform, background, why, hours, agreed, status, note, created_at, decided_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      const missing = /tester_applications/.test(error.message) || error.code === "42P01";
      return { standing: "none", application: null, tableMissing: missing };
    }
    if (!data) return { standing: "none", application: null, tableMissing: false };
    const app = data as TesterApplication;
    return { standing: app.status, application: app, tableMissing: false };
  } catch {
    return { standing: "none", application: null, tableMissing: false };
  }
}

/** Whether the account asked to join the Pre-Alpha when it signed up.
 *  The tick rides in user_metadata across the email-confirmation gap
 *  (there is no session to write a row with until the link is clicked);
 *  ensurePreAlphaRequest turns it into the row on the first signed-in
 *  visit. */
export function prealphaRequested(meta: unknown): boolean {
  return !!meta && typeof meta === "object" && (meta as { prealpha_requested?: unknown }).prealpha_requested === true;
}

type MinimalUser = { id: string; email?: string | null; user_metadata?: unknown };

/** File the account's request for Pre-Alpha access: one pending row,
 *  from the account's own details. Nothing to fill in. */
export async function filePreAlphaRequest(
  supabase: SupabaseClient,
  user: MinimalUser,
): Promise<{ ok: true } | { ok: false; message: string; tableMissing?: boolean }> {
  const signups = await prealphaSignups(supabase);
  if (signups.closed) return { ok: false, message: signups.closes ? `Sign-ups closed on ${signups.closes}.` : "Sign-ups for the Pre-Alpha are closed." };
  if (!signups.open) return { ok: false, message: "Sign-ups are not open yet." };
  if (!user.email) return { ok: false, message: "Sign in first." };
  const meta = (user.user_metadata ?? {}) as { callsign?: unknown; advisor_discord?: unknown };
  const row = {
    user_id: user.id,
    email: user.email,
    callsign: typeof meta.callsign === "string" ? meta.callsign : "",
    discord: typeof meta.advisor_discord === "string" ? meta.advisor_discord : "",
    agreed: true,
    status: "pending" as const,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("tester_applications").upsert(row, { onConflict: "user_id", ignoreDuplicates: true });
  if (error) {
    if (/tester_applications/.test(error.message) || error.code === "42P01") {
      return { ok: false, message: "Pre-Alpha access is not set up on the server yet — try again later.", tableMissing: true };
    }
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

/** The account's standing, after honouring a request made at signup
 *  that has not been filed yet. */
export async function ensurePreAlphaRequest(
  supabase: SupabaseClient,
  user: MinimalUser | null | undefined,
): Promise<{ standing: PreAlphaStanding; application: TesterApplication | null; tableMissing: boolean }> {
  const current = await preAlphaApplication(supabase, user?.id);
  if (!user || current.standing !== "none" || current.tableMissing || !prealphaRequested(user.user_metadata) || !(await prealphaSignups(supabase)).open) {
    return current;
  }
  const filed = await filePreAlphaRequest(supabase, user);
  if (!filed.ok) return { ...current, tableMissing: filed.tableMissing === true };
  return preAlphaApplication(supabase, user.id);
}

/** The programme as announced: dates, access steps, opening scenarios,
 *  systems, asks. Pure constants, kept apart so client components and
 *  email templates can import them without this module's server imports. */
/** The moment a page renders, read once per request so the briefing
 *  can place the programme's dates against it. */
export function programmeClock(): number {
  return Date.now();
}

export { PREALPHA_ACCESS_STEPS, PREALPHA_ASKS, PREALPHA_FOCUS, PREALPHA_KEY_DATES, PREALPHA_NOT_YET, PREALPHA_OPENING_SCENARIOS, PREALPHA_RELEASE_AT, PREALPHA_RELEASE_LABEL, PREALPHA_REVIEW_LABEL } from "./prealpha-programme";
