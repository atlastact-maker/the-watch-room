"use server";

import { signupOpen } from "./signup-window";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { discordBotConfigured } from "@/lib/discord/guild";
import { filePreAlphaRequest, prealphaSignups } from "@/lib/prealpha";
import {
  AdvisorSchema,
  CodeRequestSchema,
  CodeVerifySchema,
  ForgotPasswordSchema,
  LoginSchema,
  ResetPasswordSchema,
  SignupSchema,
  type AuthFormState,
} from "./schemas";

export async function login(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // An unconfirmed address gets its own answer, with the way out.
    if (error.code === "email_not_confirmed" || /not confirmed/i.test(error.message)) {
      return { unconfirmed: parsed.data.email };
    }
    return { errors: { form: [friendlyAuthError(error.message)] } };
  }
  redirect(safeNext(formData.get("next")));
}

/** A link that needed a session first (a Pre-Alpha invitation, say)
 *  comes back as ?next=. Only a path on this site is honoured. */
function safeNext(next: FormDataEntryValue | null): string {
  return typeof next === "string" && /^\/(?!\/)[\w\-./?=&%]*$/.test(next) ? next : "/menu";
}

/** Supabase's error text in the console's own words. The sign-in error
 *  does not say which of the address or the password was wrong. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid_credentials")) return "The email address or password is not recognised. Check both and try again.";
  if (m.includes("rate limit") || m.includes("too many requests") || m.includes("security purposes")) return "Too many attempts in a short time. Wait a minute and try again.";
  if (m.includes("fetch failed") || m.includes("network") || m.includes("econnrefused") || m.includes("url and key are required")) return "The account service could not be reached. Try again in a moment.";
  if (m.includes("not enabled") || m.includes("unsupported provider") || m.includes("provider is not")) return "That sign-in method is not switched on for this site yet.";
  if (m.includes("manual linking")) return "Connecting an account is not switched on for this site yet.";
  return /[.!?]$/.test(message) ? message : `${message}.`;
}

/** Sends the confirmation message again for an address that has not
 *  confirmed. The reply is the same whatever the address, so it does not
 *  say which addresses hold accounts. */
export async function resendConfirmation(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = CodeRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const origin = await siteOrigin();
  const { error } = await supabase.auth.resend({ type: "signup", email: parsed.data.email, options: { emailRedirectTo: `${origin}/auth/confirm` } });
  if (error && !/already confirmed|not found/i.test(error.message)) return { errors: { form: [friendlyAuthError(error.message)] } };
  return { ok: true, message: `If ${parsed.data.email} holds an unconfirmed account, a new confirmation message has been sent to it.` };
}

/** Sign in by emailed code: step one, the code. An address with no
 *  account is told so. Supabase refuses the request for an unknown
 *  address (shouldCreateUser is off), and the page used to show "Code
 *  sent" regardless so as not to say which addresses hold accounts;
 *  on a closed programme that left people waiting for a code that was
 *  never sent, most often after a slip in the address. */
export async function requestSignInCode(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = CodeRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const origin = await siteOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: false, emailRedirectTo: `${origin}/auth/confirm?next=/menu` },
  });
  if (error) {
    if (error.code === "otp_disabled" || /signups not allowed|not found/i.test(error.message)) {
      return { errors: { email: [`No account is registered with ${parsed.data.email}. Check the address, or use the one the account was registered with. New here? Register first.`] } };
    }
    return { errors: { form: [friendlyAuthError(error.message)] } };
  }
  return { codeSent: parsed.data.email };
}

/** Sign in by emailed code: step two, the digits from the message. */
export async function verifySignInCode(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = CodeVerifySchema.safeParse({ email, token: formData.get("token") });
  if (!parsed.success) return { codeSent: email, errors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.token, type: "email" });
  if (error) return { codeSent: email, errors: { token: ["That code is not valid or has expired. Request another and try again."] } };
  redirect(safeNext(formData.get("next")));
}

/** What Discord is asked for: who they are and their address, and, when
 *  the site's bot can put them in the server, leave to do that. */
function discordScopes(): string {
  return discordBotConfigured() ? "identify email guilds.join" : "identify email";
}

/** "Continue with Discord": hands the browser to Discord; Supabase brings
 *  it back to /auth/confirm with a code to exchange. Needs the Discord
 *  provider enabled on the Supabase project. */
export async function signInWithDiscord(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const origin = await siteOrigin();
  const next = safeNext(formData.get("next"));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: { redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`, skipBrowserRedirect: true, scopes: discordScopes() },
  });
  if (error || !data.url) redirect("/login?error=discord_unavailable");
  redirect(data.url);
}

/** "Connect Discord" from Settings: links the Discord identity to the
 *  signed-in account, so the handle is read from Discord itself and the
 *  account can sign in with it. Needs manual linking enabled on the
 *  Supabase project; the reason comes back to Settings when it is not. */
export async function connectDiscord(): Promise<void> {
  const supabase = await createClient();
  const origin = await siteOrigin();
  const { data, error } = await supabase.auth.linkIdentity({
    provider: "discord",
    options: { redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent("/settings?discord=linked")}`, skipBrowserRedirect: true, scopes: discordScopes() },
  });
  if (error || !data.url) redirect(`/settings?discord=failed&reason=${encodeURIComponent(error?.code ?? "no_url")}`);
  redirect(data.url);
}

/** "Disconnect Discord": the identity comes off the account, and with it
 *  the handle and the id that were read from it. Refused while Discord
 *  is the only way into the account. */
export async function disconnectDiscord(): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUserIdentities();
  const identities = data?.identities ?? [];
  const identity = identities.find((i) => i.provider === "discord");
  if (error || !identity) redirect("/settings?discord=failed&reason=identity_not_found");
  if (identities.length < 2) redirect("/settings?discord=failed&reason=single_identity_not_deletable");
  const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);
  if (unlinkError) redirect(`/settings?discord=failed&reason=${encodeURIComponent(unlinkError.code ?? "unlink_failed")}`);
  const { data: { user } } = await supabase.auth.getUser();
  const meta = (user?.user_metadata ?? {}) as { discord_handle_source?: unknown };
  await supabase.auth.updateUser({
    data: {
      discord_id: null, discord_username: null, discord_display: null, discord_avatar: null, discord_linked_at: null, discord_roles: null, discord_roles_attempted_at: null,
      ...(meta.discord_handle_source === "discord" ? { advisor_discord: "", discord_handle_source: null } : {}),
    },
  });
  redirect("/settings?discord=unlinked");
}

export async function signup(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!signupOpen()) {
    return {
      errors: { email: ["Registration opens Tuesday 1st September."] },
    };
  }
  const parsed = SignupSchema.safeParse({
    callsign: formData.get("callsign"),
    email: formData.get("email"),
    password: formData.get("password"),
    // Checkboxes post "on" when ticked and are absent otherwise.
    acceptTerms: formData.get("acceptTerms") === "on",
    newsletter: formData.get("newsletter") === "on",
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // Optional advisor registration — emergency-services personnel offering
  // to help development. Validated only when the box is ticked.
  const wantsAdvisor = formData.get("advisor") === "on";
  let advisor: AdvisorData | null = null;
  if (wantsAdvisor) {
    const adv = advisorFromForm(formData);
    if ("errors" in adv) return { errors: adv.errors };
    advisor = adv.data;
  }

  // "Join the Pre-Alpha": a tick, not a form. It rides in user_metadata
  // like the advisor answers, and becomes the request row on the first
  // signed-in visit (lib/prealpha ensurePreAlphaRequest), or right away
  // below when a session exists.
  const supabase = await createClient();
  // Only while sign-ups are being taken: a tick on a closed form (an old
  // tab, a crafted request) files nothing.
  const wantsPrealpha = formData.get("prealpha") === "on" && (await prealphaSignups(supabase)).open;

  const origin = await siteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Without this the confirmation link comes back to whatever Site
      // URL the Supabase project holds, which is not necessarily the
      // domain the person actually signed up on.
      emailRedirectTo: `${origin}/auth/confirm`,
      // Stored as user_metadata on the Supabase auth user. Advisor info
      // rides along here too so it survives the email-confirmation gap —
      // the advisors table row is written on the first authenticated
      // visit (or immediately below when a session exists).
      data: {
        callsign: parsed.data.callsign,
        newsletter_opt_in: parsed.data.newsletter,
        ...(wantsPrealpha ? { prealpha_requested: true } : {}),
        ...(advisor ? advisorMetadata(advisor) : {}),
      },
    },
  });
  if (error) {
    return { errors: { form: [error.message] } };
  }
  // Session already live (confirmations off) → write the advisor row now.
  if (advisor && data.session && data.user) {
    await supabase.from("advisors").upsert({
      user_id: data.user.id,
      callsign: parsed.data.callsign,
      ...advisorRow(advisor),
    });
  }
  if (wantsPrealpha && data.session && data.user) {
    await filePreAlphaRequest(supabase, data.user);
  }
  // Email confirmation enabled → no session yet. Tell the operator to
  // check their inbox instead of bouncing them off the login wall.
  if (!data.session) {
    return { ok: true, needsConfirmation: true };
  }

  redirect("/menu");
}

/** Join or update the advisor programme from Settings (session required). */
export async function saveAdvisorProfile(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const adv = advisorFromForm(formData);
  if ("errors" in adv) return { errors: adv.errors };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { errors: { form: ["Sign in to register as an advisor."] } };
  }

  const callsign =
    ((user.user_metadata as { callsign?: string } | null)?.callsign ?? "OPERATOR").slice(0, 24);
  await supabase.auth.updateUser({ data: advisorMetadata(adv.data) });
  const { error } = await supabase.from("advisors").upsert({
    user_id: user.id,
    callsign,
    ...advisorRow(adv.data),
  });
  if (error) {
    return {
      errors: { form: ["Could not save — the advisors table may not be set up yet."] },
    };
  }
  return { ok: true, message: "Registered — thank you. We'll be in touch as development needs you." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---- advisor questionnaire ------------------------------------------------

type AdvisorData = {
  service: string;
  status: string;
  background: string;
  force: string;
  topics: string[];
  involvement: string;
  notes: string;
  contactOk: boolean;
  discord: string;
};

/** Parse + validate the advisor questionnaire out of a form post. */
function advisorFromForm(
  formData: FormData,
): { data: AdvisorData } | { errors: NonNullable<AuthFormState>["errors"] } {
  const adv = AdvisorSchema.safeParse({
    advisorService: formData.get("advisorService"),
    advisorStatus: formData.get("advisorStatus"),
    advisorBackground: formData.get("advisorBackground"),
    advisorForce: formData.get("advisorForce") ?? "",
    advisorTopics: formData.getAll("advisorTopics"),
    advisorInvolvement: formData.get("advisorInvolvement"),
    advisorNotes: formData.get("advisorNotes") ?? "",
    advisorContactOk: formData.get("advisorContactOk") === "on",
    advisorDiscord: formData.get("advisorDiscord") ?? "",
  });
  if (!adv.success) return { errors: adv.error.flatten().fieldErrors };
  return {
    data: {
      service: adv.data.advisorService,
      status: adv.data.advisorStatus,
      background: adv.data.advisorBackground,
      force: adv.data.advisorForce ?? "",
      topics: adv.data.advisorTopics,
      involvement: adv.data.advisorInvolvement,
      notes: adv.data.advisorNotes ?? "",
      contactOk: adv.data.advisorContactOk,
      discord: adv.data.advisorDiscord ?? "",
    },
  };
}

/** user_metadata payload for an advisor — survives the confirmation gap. */
function advisorMetadata(a: AdvisorData) {
  return {
    advisor: true,
    advisor_service: a.service,
    advisor_status: a.status,
    advisor_background: a.background,
    advisor_force: a.force,
    advisor_topics: a.topics,
    advisor_involvement: a.involvement,
    advisor_notes: a.notes,
    advisor_contact_ok: a.contactOk,
    advisor_discord: a.discord,
  };
}

/** advisors table row (minus user_id/callsign). */
function advisorRow(a: AdvisorData) {
  return {
    service: a.service,
    status: a.status,
    background: a.background,
    force_area: a.force,
    topics: a.topics,
    involvement: a.involvement,
    notes: a.notes,
    contact_ok: a.contactOk,
    discord: a.discord,
    updated_at: new Date().toISOString(),
  };
}

/** Site origin for auth email redirects — request origin first, then the
 *  canonical deployment. */
async function siteOrigin(): Promise<string> {
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host") ?? "the-watch-room.vercel.app"}`;
}

export async function requestPasswordReset(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = ForgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const origin = await siteOrigin();
  // Two link styles land correctly: token_hash templates hit
  // /auth/confirm?type=recovery&next=/reset-password, and default
  // ConfirmationURL templates redirect to /reset-password?code=…,
  // which the reset page exchanges itself.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password`,
  });
  // Always the same answer — never confirm whether an account exists.
  return {
    ok: true,
    message: "If that email has an account, a reset link is on its way. Check your inbox.",
  };
}

export async function updatePassword(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = ResetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      errors: {
        form: [
          "Could not set the new password — the reset link may have expired. Request a fresh one and try again.",
        ],
      },
    };
  }

  redirect("/menu");
}
