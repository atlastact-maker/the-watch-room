"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/operators";

// The colleague system's three moves, each a database function that
// runs as the caller and decides what the caller may do (migration
// 028). The page the form was on gets the outcome as ?notice=.

/** Where to go back to: the page the form was on, if it is on this site. */
function back(formData: FormData, fallback: string): string {
  const next = formData.get("next");
  return typeof next === "string" && /^\/(?!\/)[\w\-./?=&%]*$/.test(next) ? next : fallback;
}

function withNotice(path: string, notice: string): string {
  const url = new URL(path, "http://site.invalid");
  url.searchParams.set("notice", notice);
  return `${url.pathname}${url.search}`;
}

/** The database's refusals, as notice keys the pages know. */
function reasonOf(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("not accepting")) return "private";
  if (m.includes("too many")) return "limit";
  if (m.includes("no such account") || m.includes("not a colleague")) return "missing";
  if (/colleague_request|colleague_respond|colleague_remove|schema cache/.test(m)) return "unavailable";
  return "failed";
}

function refresh(target: string) {
  revalidatePath("/colleagues");
  revalidatePath(`/operators/${target}`);
  revalidatePath("/menu");
}

/** Ask another operator to be a colleague. Asking someone who has
 *  already asked you makes the two of you colleagues at once. */
export async function requestColleague(formData: FormData): Promise<void> {
  const target = String(formData.get("userId") ?? "");
  const to = back(formData, "/colleagues");
  if (!isUuid(target)) redirect(withNotice(to, "missing"));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("colleague_request", { p_user_id: target });
  refresh(target);
  if (error) redirect(withNotice(to, reasonOf(error.message)));
  redirect(withNotice(to, data === "colleague" ? "colleague" : "requested"));
}

/** Accept or decline a request made to you. */
export async function respondColleague(formData: FormData): Promise<void> {
  const target = String(formData.get("userId") ?? "");
  const accept = String(formData.get("accept") ?? "") === "1";
  const to = back(formData, "/colleagues");
  if (!isUuid(target)) redirect(withNotice(to, "missing"));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("colleague_respond", { p_user_id: target, p_accept: accept });
  refresh(target);
  if (error) redirect(withNotice(to, reasonOf(error.message)));
  redirect(withNotice(to, data === true ? (accept ? "accepted" : "declined") : "gone"));
}

/** Part company with a colleague, or take back a request. */
export async function removeColleague(formData: FormData): Promise<void> {
  const target = String(formData.get("userId") ?? "");
  const to = back(formData, "/colleagues");
  if (!isUuid(target)) redirect(withNotice(to, "missing"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("colleague_remove", { p_user_id: target });
  refresh(target);
  if (error) redirect(withNotice(to, reasonOf(error.message)));
  redirect(withNotice(to, "removed"));
}
