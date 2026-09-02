"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasAdminAccess } from "@/lib/auth/operator-access";
import { sendEmail } from "@/lib/email/send";
import { advisorAcceptedEmail } from "@/lib/email/advisor-accepted";
import { advisorDeclinedEmail } from "@/lib/email/advisor-declined";

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
export async function setRole(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "") as RoleValue;
  const iconRaw = String(formData.get("icon") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
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

  const { error } = await supabase.rpc("admin_upsert_role", {
    p_email: email,
    p_role: role,
    p_icon: icon,
    p_note: note || null,
  });
  if (error) throw new Error(error.message);

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
