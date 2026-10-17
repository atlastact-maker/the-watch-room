import { type EmailOtpType, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureDiscordRoles } from "@/lib/discord/roles";

// Supabase email confirmation links land here, and so does Discord. We
// establish the session, then redirect onward.
//
// Two link styles have to work, because which one arrives depends on the
// project's email template — and the recovery flow already handles both:
//
//   token_hash  a template built on {{ .TokenHash }} calls this route
//               directly, and we verify the OTP ourselves.
//   code        the default {{ .ConfirmationURL }} template goes to
//               Supabase first, which verifies and then redirects here
//               with ?code=… to exchange for a session. A Discord sign-in
//               or a Connect Discord from Settings comes back the same
//               way; a refusal comes back as ?error_code=… instead.
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
  // Settings sent them to Discord to connect the account; anything that
  // goes wrong is reported there, with its reason, not on the login page.
  const linking = next.startsWith("/settings");

  const refused = searchParams.get("error_code") ?? searchParams.get("error");
  if (refused && !code && !token_hash) {
    return NextResponse.redirect(new URL(linking ? `/settings?discord=failed&reason=${encodeURIComponent(refused)}` : "/login?error=discord_denied", request.url));
  }

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await recordDiscordIdentity(supabase, data.session);
      return NextResponse.redirect(new URL(next, request.url));
    }
    if (linking) {
      return NextResponse.redirect(new URL(`/settings?discord=failed&reason=${encodeURIComponent(error.code ?? "exchange_failed")}`, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=verify_failed", request.url));
}

/** An account that arrived through Discord, by sign-in or by connecting
 *  it in Settings, carries the Discord identity: the user id, the
 *  username, the display name, the avatar. Copy them onto the account
 *  where Settings, the admin lists and the bot read them; give an
 *  account that has no callsign yet the username as one; and see that a
 *  linked account on the list has its role in the server, with the
 *  access token this very exchange produced in case it has to be put in
 *  the server first. Best effort: a failure here never stops the
 *  sign-in. */
async function recordDiscordIdentity(supabase: SupabaseClient, session: Session | null): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const identity = user?.identities?.find((i) => i.provider === "discord");
    if (!user || !identity) return;
    const d = (identity.identity_data ?? {}) as Record<string, unknown>;
    const claims = (typeof d.custom_claims === "object" && d.custom_claims ? d.custom_claims : {}) as Record<string, unknown>;
    const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);
    const id = str(d.provider_id) ?? str(d.sub) ?? identity.id;
    // Discord usernames no longer carry a discriminator; an old one reads "#0".
    const username = (str(d.preferred_username) ?? str(d.name) ?? str(d.full_name))?.replace(/#0$/, "").slice(0, 40);
    const display = str(claims.global_name) ?? str(d.full_name) ?? username;
    const avatar = str(d.avatar_url) ?? str(d.picture);
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const update: Record<string, unknown> = {
      discord_id: id,
      discord_username: username ?? null,
      discord_display: display ?? null,
      discord_avatar: avatar ?? null,
      discord_linked_at: str(meta.discord_linked_at) ?? new Date().toISOString(),
    };
    // The handle the programme matches people by: the real one from
    // Discord, unless a different one was typed by hand and kept.
    const held = str(meta.advisor_discord);
    if (username && (!held || meta.discord_handle_source === "discord")) {
      update.advisor_discord = username;
      update.discord_handle_source = "discord";
    }
    if (!str(meta.callsign) && username) update.callsign = username.toUpperCase().slice(0, 24);
    const { data: updated } = await supabase.auth.updateUser({ data: update });
    if (typeof update.advisor_discord === "string") {
      await supabase.from("advisors").update({ discord: update.advisor_discord, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    }
    await ensureDiscordRoles(supabase, updated?.user ?? user, { accessToken: session?.provider_token ?? null, force: true });
  } catch {
    // The sign-in stands; the handle can be typed in Settings.
  }
}
