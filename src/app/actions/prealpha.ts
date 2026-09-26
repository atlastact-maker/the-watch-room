"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import { prealphaOpen } from "@/lib/prealpha";

// Filing (or correcting) a pre-alpha application. The row is the
// account's own; RLS keeps it that way, and the status stays pending
// until an admin decides.

const Schema = z.object({
  discord: z.string().trim().max(64, { error: "64 characters max." }),
  platform: z.string().trim().min(2, { error: "Tell us what you'll test on." }).max(160, { error: "160 characters max." }),
  background: z.string().trim().max(600, { error: "600 characters max." }),
  why: z.string().trim().min(10, { error: "A sentence or two." }).max(1200, { error: "1200 characters max." }),
  hours: z.string().trim().min(1, { error: "Pick one." }).max(40),
  agreed: z.literal(true, { error: "You need to agree to keep it in the room." }),
});

export type PreAlphaFormState =
  | { ok: true }
  | { ok: false; errors?: Record<string, string[] | undefined>; message?: string }
  | undefined;

export async function applyForPreAlpha(_prev: PreAlphaFormState, formData: FormData): Promise<PreAlphaFormState> {
  if (!prealphaOpen()) return { ok: false, message: "Applications are not open yet." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { ok: false, message: "Log in first." };

  const parsed = Schema.safeParse({
    discord: formData.get("discord") ?? "",
    platform: formData.get("platform") ?? "",
    background: formData.get("background") ?? "",
    why: formData.get("why") ?? "",
    hours: formData.get("hours") ?? "",
    agreed: formData.get("agreed") === "on" ? true : false,
  });
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (errors[key] ??= []).push(issue.message);
    }
    return { ok: false, errors };
  }
  const metadata = user.user_metadata ?? {};
  const callsign = typeof metadata.callsign === "string" ? metadata.callsign : "";
  const row = {
    user_id: user.id,
    email: user.email,
    callsign,
    discord: parsed.data.discord,
    platform: parsed.data.platform,
    background: parsed.data.background,
    why: parsed.data.why,
    hours: parsed.data.hours,
    agreed: true,
    status: "pending" as const,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("tester_applications").upsert(row, { onConflict: "user_id" });
  if (error) {
    if (/tester_applications/.test(error.message) || error.code === "42P01") {
      return { ok: false, message: "Applications are not set up on the server yet — try again later." };
    }
    // A decided application cannot be rewritten by its owner (RLS); say so
    // rather than failing silently.
    if (/policy|permission|row-level/i.test(error.message)) {
      return { ok: false, message: "Your application has already been reviewed." };
    }
    return { ok: false, message: error.message };
  }
  revalidatePath("/prealpha");
  revalidatePath("/standby");
  return { ok: true };
}
