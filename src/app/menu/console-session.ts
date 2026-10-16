import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server";
import { hasAdminAccess, hasShiftAccess } from "@/lib/auth/operator-access";
import { viewingAsTester } from "@/lib/auth/view-as";
import type { ConsoleUser } from "./console-shell";

// Who is sitting at the console, resolved once for every page of it:
// the account card, whether the administration link shows, and the
// admin's "view as tester" switch. One resolver so no two pages disagree.

export type ConsoleSession = ConsoleUser & { userId: string; hasShift: boolean; realAdmin: boolean };

/** The signed-in account, or null when nobody is signed in. */
export async function consoleSessionIfSignedIn(): Promise<ConsoleSession | null> {
  const { supabase, user } = await currentUser();
  if (!user) return null;
  const [hasShift, realAdmin, testerCookie] = await Promise.all([
    hasShiftAccess(supabase, user.email),
    hasAdminAccess(supabase, user.email),
    viewingAsTester(),
  ]);
  // A real admin may be looking at the place as a tester would.
  const asTester = realAdmin && testerCookie;
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    userId: user.id,
    hasShift,
    realAdmin,
    callsign: typeof metadata.callsign === "string" ? metadata.callsign : "",
    email: user.email ?? "",
    discord: typeof metadata.advisor_discord === "string" ? metadata.advisor_discord : "",
    isAdmin: realAdmin && !asTester,
    viewAs: realAdmin ? (asTester ? "tester" : "admin") : null,
  };
}

/** The console's gate: a signed-in account with shift access. Anyone
 *  else lands on the login page or their own standing. Advisor
 *  acceptance alone never admits a player to the console. */
export async function consoleSession(): Promise<ConsoleSession> {
  const session = await consoleSessionIfSignedIn();
  if (!session) redirect("/login");
  if (!session.hasShift) redirect("/standby");
  return session;
}

/** Just the fields the frame renders. */
export function consoleUser({ callsign, email, discord, isAdmin, viewAs }: ConsoleSession): ConsoleUser {
  return { callsign, email, discord, isAdmin, viewAs };
}
