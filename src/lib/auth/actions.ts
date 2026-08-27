"use server";

import { signupOpen } from "./signup-window";
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
    return { errors: { form: ["Log in to register as an advisor."] } };
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
