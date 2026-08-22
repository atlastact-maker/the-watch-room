"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginSchema, SignupSchema, type AuthFormState } from "./schemas";

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
  const { error } = await supabase.auth.signUp({
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

  redirect("/menu");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
