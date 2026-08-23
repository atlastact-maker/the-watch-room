"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
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
    return { errors: { form: [error.message] } };
  }

  redirect("/menu");
}

export async function signup(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Stored as user_metadata on the Supabase auth user.
      data: {
        callsign: parsed.data.callsign,
        newsletter_opt_in: parsed.data.newsletter,
      },
    },
  });
  if (error) {
    return { errors: { form: [error.message] } };
  }
  // Email confirmation enabled → no session yet. Tell the operator to
  // check their inbox instead of bouncing them off the login wall.
  if (!data.session) {
    return { ok: true, needsConfirmation: true };
  }

  redirect("/menu");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
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
