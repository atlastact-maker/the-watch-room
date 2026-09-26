"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { filePreAlphaRequest } from "@/lib/prealpha";

// One press: "Request pre-alpha access". The row is the account's own
// (RLS keeps it that way) and stays pending until an admin grants it.
// There is nothing to fill in; the account already has the callsign and
// email, and the Discord handle comes from settings if it is there.

export type PreAlphaFormState = { ok: true } | { ok: false; message: string } | undefined;

export async function requestPreAlphaAccess(): Promise<PreAlphaFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Log in first." };
  const result = await filePreAlphaRequest(supabase, user);
  if (!result.ok) return { ok: false, message: result.message };
  // Remember the ask on the account too, so a row that goes missing (a
  // reset table, say) is re-filed on the next visit.
  await supabase.auth.updateUser({ data: { prealpha_requested: true } });
  revalidatePath("/prealpha");
  revalidatePath("/standby");
  return { ok: true };
}
