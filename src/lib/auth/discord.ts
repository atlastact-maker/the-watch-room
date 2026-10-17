import { cache } from "react";

// Whether "Continue with Discord" and "Connect Discord" are offered.
//
// The Supabase project decides: once the Discord provider is enabled
// there (Authentication → Sign In / Providers → Discord) the buttons
// appear, read from the project's own public auth settings and cached
// for five minutes. NEXT_PUBLIC_AUTH_DISCORD still overrides either way:
// 1 forces the buttons on, 0 forces them off, anything else defers to the
// project. Before, the flag alone decided, and a provider switched on in
// the dashboard did nothing until the site was redeployed with it.

export const discordSignInEnabled = cache(async function discordSignInEnabled(): Promise<boolean> {
  const flag = process.env.NEXT_PUBLIC_AUTH_DISCORD;
  if (flag === "1") return true;
  if (flag === "0") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  try {
    // Bounded: the sign-in page must never wait on this call.
    const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, { headers: { apikey: key }, next: { revalidate: 300 }, signal: AbortSignal.timeout(2500) });
    if (!res.ok) return false;
    const body = (await res.json()) as { external?: Record<string, boolean> };
    return body.external?.discord === true;
  } catch {
    return false;
  }
});
