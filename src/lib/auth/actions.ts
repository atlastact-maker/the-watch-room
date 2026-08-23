"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  AdvisorSchema,
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

  // Optional advisor registration — served personnel offering to help
  // development. Validated only when the box is ticked.
  const wantsAdvisor = formData.get("advisor") === "on";
  let advisor: { service: string; background: string; notes: string } | null = null;
  if (wantsAdvisor) {
    const adv = AdvisorSchema.safeParse({
      advisorService: formData.get("advisorService"),
      advisorBackground: formData.get("advisorBackground"),
      advisorNotes: formData.get("advisorNotes") ?? "",
    });
    if (!adv.success) {
      return { errors: adv.error.flatten().fieldErrors };
    }
    advisor = {
      service: adv.data.advisorService,
      background: adv.data.advisorBackground,
      notes: adv.data.advisorNotes ?? "",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Stored as user_metadata on the Supabase auth user. Advisor info
      // rides along here too so it survives the email-confirmation gap —
      // the advisors table row is written on the first authenticated
      // visit (or immediately below when a session exists).
      data: {
        callsign: parsed.data.callsign,
        newsletter_opt_in: parsed.data.newsletter,
        ...(advisor
          ? {
              advisor: true,
              advisor_service: advisor.service,
              advisor_background: advisor.background,
              advisor_notes: advisor.notes,
            }
          : {}),
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
      service: advisor.service,
      background: advisor.background,
      notes: advisor.notes,
      updated_at: new Date().toISOString(),
    });
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
  const parsed = AdvisorSchema.safeParse({
    advisorService: formData.get("advisorService"),
    advisorBackground: formData.get("advisorBackground"),
    advisorNotes: formData.get("advisorNotes") ?? "",
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { errors: { form: ["Log in to register as an advisor."] } };
  }

  const callsign =
    ((user.user_metadata as { callsign?: string } | null)?.callsign ?? "OPERATOR").slice(0, 24);
  await supabase.auth.updateUser({
    data: {
      advisor: true,
      advisor_service: parsed.data.advisorService,
      advisor_background: parsed.data.advisorBackground,
      advisor_notes: parsed.data.advisorNotes ?? "",
    },
  });
  const { error } = await supabase.from("advisors").upsert({
    user_id: user.id,
    callsign,
    service: parsed.data.advisorService,
    background: parsed.data.advisorBackground,
    notes: parsed.data.advisorNotes ?? "",
    updated_at: new Date().toISOString(),
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
