"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server";
import { hasAdminAccess } from "@/lib/auth/operator-access";
import { VIEW_AS_COOKIE } from "@/lib/auth/view-as";

/** Switch an admin's view between their own and a tester's. Anyone who
 *  is not an admin is ignored: the cookie means nothing to their pages
 *  anyway. Takes a form so the ops centre can post it without client
 *  code; the desk calls it directly and reloads. A `next` field names
 *  where to land afterwards — the standing-by page sends the admin back
 *  to the console, the console sends a new tester view to the overview,
 *  which forwards to standing-by while the doors are closed. */
export async function setViewAs(formData: FormData): Promise<void> {
  const mode = String(formData.get("mode") ?? "") === "tester" ? "tester" : "admin";
  const nextRaw = formData.get("next");
  const next = typeof nextRaw === "string" && /^\/(?!\/)[\w\-./?=&%]*$/.test(nextRaw) ? nextRaw : null;
  const { supabase, user } = await currentUser();
  if (!user || !(await hasAdminAccess(supabase, user.email))) return;
  const jar = await cookies();
  if (mode === "tester") {
    jar.set(VIEW_AS_COOKIE, "tester", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 });
  } else {
    jar.delete(VIEW_AS_COOKIE);
  }
  if (next) redirect(next);
}
