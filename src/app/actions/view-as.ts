"use server";

import { cookies } from "next/headers";
import { currentUser } from "@/lib/supabase/server";
import { hasAdminAccess } from "@/lib/auth/operator-access";
import { VIEW_AS_COOKIE } from "@/lib/auth/view-as";

/** Switch an admin's view between their own and a tester's. Anyone who
 *  is not an admin is ignored: the cookie means nothing to their pages
 *  anyway. Takes a form so the ops centre can post it without client
 *  code; the desk calls it directly and reloads. */
export async function setViewAs(formData: FormData): Promise<void> {
  const mode = String(formData.get("mode") ?? "") === "tester" ? "tester" : "admin";
  const { supabase, user } = await currentUser();
  if (!user || !(await hasAdminAccess(supabase, user.email))) return;
  const jar = await cookies();
  if (mode === "tester") {
    jar.set(VIEW_AS_COOKIE, "tester", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 });
  } else {
    jar.delete(VIEW_AS_COOKIE);
  }
}
