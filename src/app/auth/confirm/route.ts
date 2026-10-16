import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Supabase email confirmation links land here. We establish the session,
// then redirect onward.
//
// Two link styles have to work, because which one arrives depends on the
// project's email template — and the recovery flow already handles both:
//
//   token_hash  a template built on {{ .TokenHash }} calls this route
//               directly, and we verify the OTP ourselves.
//   code        the default {{ .ConfirmationURL }} template goes to
//               Supabase first, which verifies and then redirects here
//               with ?code=… to exchange for a session.
//
// Handling only token_hash sent every default-template confirmation to
// the login page as a failure.
//
// Onward is /standby: the site is closed to all but the advisor
// programme, so a freshly confirmed account is an applicant, and /standby
// is where their standing shows — and where <AdvisorSync /> files the
// application that could not be written before this session existed.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/standby";

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await captureDiscordHandle(supabase);
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=verify_failed", request.url));
}

/** An account that arrived through Discord, by sign-in or by connecting
 *  it in Settings, carries its Discord username in the identity. Copy it
 *  onto the account where Settings and the advisor list read it, when no
 *  handle is held yet. Best effort: a failure here never stops the
 *  sign-in. */
async function captureDiscordHandle(supabase: SupabaseClient): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const identity = user?.identities?.find((i) => i.provider === "discord");
    if (!user || !identity) return;
    const held = (user.user_metadata as { advisor_discord?: unknown } | null)?.advisor_discord;
    if (typeof held === "string" && held.trim()) return;
    const d = (identity.identity_data ?? {}) as Record<string, unknown>;
    const candidate = [d.name, d.preferred_username, d.full_name].find((v): v is string => typeof v === "string" && v.trim().length > 0);
    if (!candidate) return;
    const handle = candidate.trim().replace(/#\d+$/, "").slice(0, 40);
    await supabase.auth.updateUser({ data: { advisor_discord: handle } });
  } catch {
    // The sign-in stands; the handle can be typed in Settings.
  }
}
