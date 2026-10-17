import type { SupabaseClient, User } from "@supabase/supabase-js";
import { accessProfile, isTester } from "@/lib/auth/operator-access";
import { discordBotConfigured, grantDiscordRoles, type DiscordRoleKey } from "./guild";

// Which Discord roles an account is due, and seeing that a linked account
// has them. Called where an account's standing is read anyway — the
// callback after a Discord sign-in or link, the standby page, the
// briefing — and remembered on the account so Discord is asked once per
// role, with an hour's grace after a failure rather than a call on every
// visit.

const RETRY_MS = 60 * 60 * 1000;

type RolesMeta = { discord_id?: unknown; discord_roles?: Record<string, string>; discord_roles_attempted_at?: string };

/** Tester when on the Pre-Alpha list or holding the desk by role;
 *  advisor when on the programme. */
export async function dueDiscordRoles(supabase: SupabaseClient, email: string | null | undefined): Promise<DiscordRoleKey[]> {
  const [{ tester }, profile] = await Promise.all([isTester(supabase, email), accessProfile(supabase, email)]);
  const due: DiscordRoleKey[] = [];
  if (tester || profile.role === "operator" || profile.role === "admin") due.push("tester");
  if (profile.role === "advisor") due.push("advisor");
  return due;
}

/** Give a linked account the roles it is due, once. Best effort: nothing
 *  here stops a page or a sign-in. */
export async function ensureDiscordRoles(supabase: SupabaseClient, user: User, opts: { accessToken?: string | null; force?: boolean } = {}): Promise<void> {
  if (!discordBotConfigured()) return;
  const meta = (user.user_metadata ?? {}) as RolesMeta;
  const discordId = typeof meta.discord_id === "string" ? meta.discord_id : null;
  if (!discordId) return;
  const held = meta.discord_roles ?? {};
  const attempted = meta.discord_roles_attempted_at ? Date.parse(meta.discord_roles_attempted_at) : 0;
  if (!opts.force && attempted && Date.now() - attempted < RETRY_MS) return;
  try {
    const due = await dueDiscordRoles(supabase, user.email);
    const missing = due.filter((k) => !held[k]);
    if (missing.length === 0) return;
    const result = await grantDiscordRoles(discordId, missing, opts.accessToken);
    const now = new Date().toISOString();
    const roles = { ...held, ...Object.fromEntries(result.granted.map((k) => [k, now])) };
    await supabase.auth.updateUser({ data: { discord_roles: roles, discord_roles_attempted_at: now } });
    if (result.reason) console.error(`discord roles for ${user.email ?? user.id}: ${result.reason}`);
  } catch (e) {
    console.error(`discord roles for ${user.email ?? user.id}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
