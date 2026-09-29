"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasAdminAccess } from "@/lib/auth/operator-access";
import { isBugStatus } from "@/lib/bug-reports";
import { sendEmail } from "@/lib/email/send";
import { advisorAcceptedEmail } from "@/lib/email/advisor-accepted";
import { advisorDeclinedEmail } from "@/lib/email/advisor-declined";
import { testerAcceptedEmail } from "@/lib/email/tester-accepted";
import { testerInvitedEmail } from "@/lib/email/tester-invited";
import { doorsOpenEmail } from "@/lib/email/doors-open";
import { PREALPHA_DOORS_KEY, prealphaDoors } from "@/lib/prealpha";

// Server actions for the admin area. Every one re-checks admin access
// app-side AND relies on the database functions checking is_admin()
// again — the app check gives a clean error, the database check is the
// one that cannot be bypassed.

async function adminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await hasAdminAccess(supabase, user.email))) {
    throw new Error("admin only");
  }
  return supabase;
}

export type RoleValue = "admin" | "operator" | "advisor";
export type IconValue = "fire" | "ambulance" | "police" | "control" | "specialist";

/** Accept an application / set someone's role. Icon empty = derive from
 *  their advisor application, same as the rest of the app.
 *
 *  Granting 'advisor' to someone who did not already hold it is what
 *  "reviewed" means, so that is where the applicant gets told. */
/** The first line of the note that carries an accepted advisor's
 *  application, so it is written once and recognisable on the record. */
const APPLICATION_NOTE_PREFIX = "Advisor application (accepted)";

export async function setRole(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "") as RoleValue;
  const iconRaw = String(formData.get("icon") ?? "").trim();
  const typedNote = String(formData.get("note") ?? "").trim();
  // The Accept advisor button carries the application's own words, so
  // accepting someone puts what they told us on their record rather
  // than leaving it on the applications tab to be found again later.
  const userId = String(formData.get("userId") ?? "").trim();
  const application = String(formData.get("application") ?? "").trim();
  if (!email || !["admin", "operator", "advisor"].includes(role)) return;
  const icon = ["fire", "ambulance", "police", "control", "specialist"].includes(iconRaw)
    ? (iconRaw as IconValue)
    : null;
  const supabase = await adminClient();

  // What they hold now, read before the write: re-saving a row to fix a
  // note or an insignia must not send the acceptance email a second
  // time. Only the transition into 'advisor' counts.
  const { data: roles } = await supabase.rpc("admin_list_roles");
  const previous = (roles as { email: string; role: string }[] | null)?.find(
    (r) => r.email.trim().toLowerCase() === email.toLowerCase(),
  );
  const newlyAdvisor = role === "advisor" && previous?.role !== "advisor";

  // The role note: what the admin typed, or, on acceptance, the first
  // line of the application (service, standing, force area) so the
  // Current advisors table says who this is without a second look.
  const note = typedNote || (newlyAdvisor && application ? application.split("\n")[0].slice(0, 200) : "");
  const { error } = await supabase.rpc("admin_upsert_role", {
    p_email: email,
    p_role: role,
    p_icon: icon,
    p_note: note || null,
  });
  if (error) throw new Error(error.message);

  // The full application, as an admin note on the account, once.
  if (newlyAdvisor && userId && application) {
    const { data: existing } = await supabase.rpc("admin_notes_all");
    const already = ((existing ?? []) as { subject_user_id: string; note: string }[]).some(
      (n) => n.subject_user_id === userId && n.note.startsWith(APPLICATION_NOTE_PREFIX),
    );
    if (!already) {
      const { error: noteError } = await supabase.rpc("admin_add_note", {
        p_user_id: userId,
        p_note: `${APPLICATION_NOTE_PREFIX}\n${application}`.slice(0, 4000),
      });
      if (noteError) console.error(`advisor application note not saved for ${email}: ${noteError.message}`);
    }
  }

  if (newlyAdvisor) {
    // Best-effort by design: sendEmail never throws, and the acceptance
    // stands whether or not the mail goes out. A failure is logged for
    // the Vercel runtime logs rather than shown to the admin, who has
    // already been told the role was set.
    const { subject, html } = advisorAcceptedEmail();
    const result = await sendEmail({ to: email, subject, html });
    if (!result.sent) {
      console.error(`advisor acceptance email not sent to ${email}: ${result.reason}`);
    }
  }

  revalidatePath("/admin");
}

/** Decline an application, or take a decline back. Declining records the
 *  decision on the application (migration 010) and tells the applicant,
 *  so "reviewed and turned down" stops looking like "nobody has looked".
 *
 *  The database returns whether the call actually changed the decision,
 *  so pressing Decline twice cannot email someone twice. Undoing a
 *  decline sends nothing: it returns them to waiting, which they were
 *  already told about. */
export async function setAdvisorDecline(formData: FormData): Promise<void> {
  const userId = String(formData.get("userId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const declined = String(formData.get("declined") ?? "") === "true";
  if (!userId) return;
  const supabase = await adminClient();
  const { data: changed, error } = await supabase.rpc("admin_set_advisor_decline", {
    p_user_id: userId,
    p_declined: declined,
  });
  if (error) throw new Error(error.message);

  if (changed === true && declined && email) {
    // Best-effort, as with acceptance: the decision stands whether or
    // not the mail goes out.
    const { subject, html } = advisorDeclinedEmail();
    const result = await sendEmail({ to: email, subject, html });
    if (!result.sent) {
      console.error(`advisor decline email not sent to ${email}: ${result.reason}`);
    }
  }

  revalidatePath("/admin");
}

/** Revoke someone's role entirely — back to standby. */
export async function deleteRole(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;
  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_delete_role", { p_email: email });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** Tick or untick "Discord permission given" against a role. The site
 *  role and the Discord role are granted by hand in two different places,
 *  and this is the only record of whether the second has been done. */
export async function setDiscordGranted(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;
  const granted = String(formData.get("granted") ?? "") === "true";
  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_set_discord_granted", {
    p_email: email,
    p_granted: granted,
  });
  // The function only exists once migration 015 has been run. Until then
  // PostgREST reports it missing from the schema cache; that is a banner
  // on the page, not an error page. (redirect throws, so it stays outside
  // any try/catch.)
  if (error?.message?.includes("admin_set_discord_granted")) {
    redirect("/admin?missing=015");
  }
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** Tick or untick someone as a closed pre-alpha tester. A ticked account
 *  can open the game without holding a role; the admin area stays
 *  admin-only. */
export async function setTester(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;
  const tester = String(formData.get("tester") ?? "") === "true";
  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_set_tester", {
    p_email: email,
    p_tester: tester,
  });
  if (error?.message?.includes("admin_set_tester")) {
    redirect("/admin?missing=016");
  }
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** Open or close a scenario to testers. */
export async function setScenarioReleased(formData: FormData): Promise<void> {
  const id = String(formData.get("scenarioId") ?? "").trim();
  if (!id) return;
  const released = String(formData.get("released") ?? "") === "true";
  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_set_scenario_released", {
    p_scenario_id: id,
    p_released: released,
  });
  if (error?.message?.includes("admin_set_scenario_released")) {
    redirect("/admin?missing=018&tab=scenarios");
  }
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** Decide a pre-alpha application. Accepting ticks the tester row in
 *  the database function and emails the applicant once — the function
 *  says whether the status actually changed. */
export async function decideTesterApplication(formData: FormData): Promise<void> {
  const userId = String(formData.get("userId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!userId || !["pending", "accepted", "declined"].includes(status)) return;
  const supabase = await adminClient();
  const { data: changed, error } = await supabase.rpc("admin_decide_tester_application", {
    p_user_id: userId,
    p_status: status,
    p_note: note || null,
  });
  if (error?.message?.includes("admin_decide_tester_application")) {
    redirect("/admin?missing=020&tab=prealpha");
  }
  if (error) throw new Error(error.message);
  if (changed === true && status === "accepted" && email) {
    const { subject, html } = testerAcceptedEmail({ doorsOpen: (await prealphaDoors(supabase)).open });
    const result = await sendEmail({ to: email, subject, html });
    if (!result.sent) console.error(`tester acceptance email not sent to ${email}: ${result.reason}`);
  }
  revalidatePath("/admin");
  revalidatePath("/prealpha");
}

/** Invite an account to the pre-alpha: mint (or re-use) the token and
 *  email the link. The link is the grant; see migration 021. */
export async function inviteTester(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;
  const supabase = await adminClient();
  const { data: token, error } = await supabase.rpc("admin_invite_tester", { p_email: email });
  if (error?.message?.includes("admin_invite_tester")) {
    redirect("/admin?missing=021&tab=users");
  }
  if (error) throw new Error(error.message);
  if (typeof token !== "string" || !token) throw new Error("no invite token returned");
  const { subject, html } = testerInvitedEmail(token, { doorsOpen: (await prealphaDoors(supabase)).open });
  const result = await sendEmail({ to: email, subject, html });
  if (!result.sent) console.error(`tester invite email not sent to ${email}: ${result.reason}`);
  revalidatePath("/admin");
  redirect(`/admin?tab=users&invited=${encodeURIComponent(email)}${result.sent ? "" : "&mail=0"}`);
}

/** Grant every pending pre-alpha request in one go: the same decision
 *  RPC per row, so the tester rows and the emails behave exactly as a
 *  single Accept would. */
export async function acceptAllPendingTesterApplications(): Promise<void> {
  const supabase = await adminClient();
  const { data, error } = await supabase.rpc("admin_list_tester_applications", { p_limit: 500 });
  if (error?.message?.includes("admin_list_tester_applications")) {
    redirect("/admin?missing=020&tab=prealpha");
  }
  if (error) throw new Error(error.message);
  const pending = ((data ?? []) as { user_id: string; email: string; status: string }[]).filter((a) => a.status === "pending");
  const doorsOpen = (await prealphaDoors(supabase)).open;
  for (const a of pending) {
    const { data: changed, error: decideError } = await supabase.rpc("admin_decide_tester_application", {
      p_user_id: a.user_id,
      p_status: "accepted",
      p_note: null,
    });
    if (decideError) throw new Error(decideError.message);
    if (changed === true && a.email) {
      const { subject, html } = testerAcceptedEmail({ doorsOpen });
      const result = await sendEmail({ to: a.email, subject, html });
      if (!result.sent) console.error(`tester acceptance email not sent to ${a.email}: ${result.reason}`);
    }
  }
  revalidatePath("/admin");
  revalidatePath("/prealpha");
  revalidatePath("/standby");
}

/** Open or close the pre-alpha doors (migration 022). Closed: testers
 *  stay on standby, told they are in. Open: the desk. */
export async function setPrealphaDoors(formData: FormData): Promise<void> {
  const value = String(formData.get("doors") ?? "") === "open" ? "open" : "closed";
  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_set_site_setting", { p_key: PREALPHA_DOORS_KEY, p_value: value });
  if (error?.message?.includes("admin_set_site_setting")) {
    redirect("/admin?missing=022&tab=prealpha");
  }
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/prealpha");
  revalidatePath("/standby");
  revalidatePath("/menu");
  redirect("/admin?tab=prealpha");
}

/** Tell every tester the doors are open: one email each to the accounts
 *  on the tester list (ticked, accepted or invited alike). */
export async function notifyTestersDoorsOpen(): Promise<void> {
  const supabase = await adminClient();
  const { data, error } = await supabase.rpc("admin_list_users", { p_limit: 200 });
  if (error) throw new Error(error.message);
  const testers = ((data ?? []) as { email: string; tester: boolean; assigned_role: string | null }[]).filter((u) => u.tester && u.assigned_role !== "admin");
  const { subject, html } = doorsOpenEmail();
  let sent = 0;
  for (const t of testers) {
    const result = await sendEmail({ to: t.email, subject, html });
    if (result.sent) sent += 1;
    else console.error(`doors-open email not sent to ${t.email}: ${result.reason}`);
  }
  redirect(`/admin?tab=prealpha&notified=${sent}&of=${testers.length}`);
}

/** Triage a bug report: status, and a note if one was typed. */
export async function setBugReport(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !isBugStatus(status)) return;
  const noteRaw = formData.get("note");
  const note = typeof noteRaw === "string" ? noteRaw.trim().slice(0, 2000) : null;
  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_set_bug_report", {
    p_id: id,
    p_status: status,
    p_note: note,
  });
  if (error?.message?.includes("admin_set_bug_report")) {
    redirect("/admin?missing=017&tab=bugs");
  }
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** Suspend or reinstate an account. A banned account cannot sign in or
 *  refresh its session; an already-live session lasts until its token
 *  expires (about an hour). */
export async function setBan(formData: FormData): Promise<void> {
  const userId = String(formData.get("userId") ?? "").trim();
  const banned = String(formData.get("banned") ?? "") === "true";
  if (!userId) return;
  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_set_ban", {
    p_user_id: userId,
    p_banned: banned,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** Permanently remove an account. Cascades take the advisor application
 *  and career stats with it. The database refuses this against admins
 *  and against yourself, whatever the UI does. */
export async function deleteUser(formData: FormData): Promise<void> {
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) return;
  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_delete_user", { p_user_id: userId });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** Add a note to someone's profile. The author is taken from the JWT in
 *  the database, not from anything the client sends, so a note can never
 *  be written under another admin's name. */
export async function addAdminNote(formData: FormData): Promise<void> {
  const userId = String(formData.get("userId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!userId || !note) return;
  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_add_note", {
    p_user_id: userId,
    p_note: note,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** Remove a note. Any admin can delete any note — this is a shared
 *  record, and a note nobody can remove is a note nobody writes
 *  honestly. */
export async function deleteAdminNote(formData: FormData): Promise<void> {
  const noteId = String(formData.get("noteId") ?? "").trim();
  if (!noteId) return;
  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_delete_note", {
    p_note_id: noteId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
