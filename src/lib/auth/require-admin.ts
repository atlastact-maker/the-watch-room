import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasAdminAccess } from "./operator-access";

// Closed site: the advisor programme is the only thing open. Everything
// that is not the landing page, the signup/auth flow, or a signed-in
// account's own standing (/standby, /settings) is administrator-only.
//
// This is the real gate. proxy.ts only does the optimistic session check
// the Next docs call for — it runs on every request including prefetches,
// so a database round-trip belongs here, on the page, not there.
//
// Called from a route's layout.tsx rather than its page, because several
// of the locked routes are client components and cannot await a server
// check themselves. A layout is a server component either way.
export async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Not an error page: an applicant who wanders in lands on their own
  // standing rather than being told off.
  if (!(await hasAdminAccess(supabase, user.email))) redirect("/standby");
}

// A signed-in account's own pages — its standing (/standby) and its
// settings. Not administrator-only: an applicant has to be able to see
// where they stand and re-save their answers.
//
// Enforced here rather than left to proxy.ts alone, because the proxy
// fails open: if the Supabase call it makes throws (an outage, a network
// blip), the request carries on unauthenticated. A page that reads an
// account's own data cannot rely on that.
export async function requireSession(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
}
