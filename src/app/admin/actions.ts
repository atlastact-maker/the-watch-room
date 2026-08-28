"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasAdminAccess } from "@/lib/auth/operator-access";

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
 *  their advisor application, same as the rest of the app. */
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
  const { error } = await supabase.rpc("admin_upsert_role", {
    p_email: email,
    p_role: role,
    p_icon: icon,
    p_note: note || null,
  });
  if (error) throw new Error(error.message);
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
