import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasAdminAccess, hasShiftAccess } from "./operator-access";
import { prealphaDoors } from "@/lib/prealpha";

// "View as tester": an admin's own look at what a tester gets — the
// released scenarios only, no administration link, and the same door —
// without giving up admin. A cookie on the admin's browser, honoured
// only where the account is a real admin; a tester's browser carrying
// it changes nothing. Set and cleared by the action in
// app/actions/view-as.ts.

export const VIEW_AS_COOKIE = "twr_view_as";

export async function viewingAsTester(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(VIEW_AS_COOKIE)?.value === "tester";
}

export type EffectiveAccess = {
  /** Shift access as the person at the keyboard should meet it. */
  hasShift: boolean;
  realAdmin: boolean;
  /** A real admin looking at the place as a tester would. */
  asTester: boolean;
};

/** A real admin viewing as a tester is admitted exactly when an accepted
 *  tester is — only while the Pre-Alpha doors are open — so the switch
 *  shows the closed door too, not just the shorter scenario list.
 *  Everyone else gets their own access. */
export async function effectiveShiftAccess(supabase: SupabaseClient, email: string | undefined | null): Promise<EffectiveAccess> {
  const [hasShiftReal, realAdmin, testerCookie] = await Promise.all([
    hasShiftAccess(supabase, email),
    hasAdminAccess(supabase, email),
    viewingAsTester(),
  ]);
  const asTester = realAdmin && testerCookie;
  const hasShift = asTester ? (await prealphaDoors(supabase)).open : hasShiftReal;
  return { hasShift, realAdmin, asTester };
}
