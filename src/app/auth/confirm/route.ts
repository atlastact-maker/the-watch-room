import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=verify_failed", request.url));
}
