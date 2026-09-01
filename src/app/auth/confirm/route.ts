import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase email confirmation links land here. We verify the OTP, which
// sets the session cookies, then redirect onward.
//
// Onward is /standby: the site is closed to all but the advisor
// programme, so a freshly confirmed account is an applicant, and /standby
// is where their standing shows — and where <AdvisorSync /> files the
// application that could not be written before this session existed.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/standby";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=verify_failed", request.url));
}
