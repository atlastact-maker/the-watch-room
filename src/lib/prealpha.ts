import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

// The closed pre-alpha: when it opens, who is in it, and where an
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

/** Whether the account asked to join the pre-alpha when it signed up.
 *  The tick rides in user_metadata across the email-confirmation gap
 *  (there is no session to write a row with until the link is clicked);
 *  ensurePreAlphaRequest turns it into the row on the first signed-in
 *  visit. */
export function prealphaRequested(meta: unknown): boolean {
  return !!meta && typeof meta === "object" && (meta as { prealpha_requested?: unknown }).prealpha_requested === true;
}

type MinimalUser = { id: string; email?: string | null; user_metadata?: unknown };

/** File the account's request for pre-alpha access: one pending row,
 *  from the account's own details. Nothing to fill in. */
export async function filePreAlphaRequest(
  supabase: SupabaseClient,
  user: MinimalUser,
): Promise<{ ok: true } | { ok: false; message: string; tableMissing?: boolean }> {
  if (prealphaClosed()) return { ok: false, message: `Sign-ups closed on ${prealphaClosesLabel()}.` };
  if (!prealphaOpen()) return { ok: false, message: "Sign-ups are not open yet." };
  if (!user.email) return { ok: false, message: "Log in first." };
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
      return { ok: false, message: "Pre-alpha access is not set up on the server yet — try again later.", tableMissing: true };
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
  if (!user || current.standing !== "none" || current.tableMissing || !prealphaRequested(user.user_metadata) || !prealphaOpen()) {
    return current;
  }
  const filed = await filePreAlphaRequest(supabase, user);
  if (!filed.ok) return { ...current, tableMissing: filed.tableMissing === true };
  return preAlphaApplication(supabase, user.id);
}

/** What a tester gets and what we ask — the briefing, in one place so
 *  the public page, the accepted view and the email tell the same story. */
export const PREALPHA_ACCESS = [
  { title: "Live jobs across all three services", body: "Fire, ambulance and police jobs, each with several ways it can play out, so no two shifts are the same. The briefing lists what is open; more open as they are signed off." },
  { title: "The whole desk", body: "The 999 call, opening codes and grading, the county board and mobilising, the ground map with crews on foot, the mobile data terminal, casualty care, and the debrief." },
  { title: "A bug report a click away", body: "Help → Report a problem on the desk files straight to the team with the screen, the job and the last minute of the log attached." },
  { title: "The tester room on Discord", body: "A private channel with the developer and the advisors, where the builds are announced and the suggestions get argued over." },
  { title: "Your name on the record", body: "The service record keeps every shift; pre-alpha testers keep theirs when the doors open, with the tester mark against the callsign." },
] as const;

export const PREALPHA_ASKS = [
  "A couple of shifts a week if you can, one if you can't — a shift is twenty minutes to an hour.",
  "Report what breaks through the in-game form, and say what you expected instead.",
  "Keep it in the room: no public footage, screenshots or write-ups until we say the doors are open. Talk about it all you like on the Discord.",
  "Be honest. \"This felt wrong\" from someone who has done the job is worth more than a bug.",
] as const;

export const PREALPHA_NOT_YET = [
  "Every scenario. A small set is open; the rest are being reviewed one at a time.",
  "Multiplayer. One operator, one county, for now.",
  "Mobile. The desk needs a laptop or a desktop screen; the tablet views are for a second screen, not a phone.",
  "Balance. Timings and grades will move as the advisors weigh in. That is the point of you being here.",
] as const;
