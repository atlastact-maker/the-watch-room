import type { SupabaseClient } from "@supabase/supabase-js";

// The bell: what an operator should hear about, written by the database
// as a side effect of the colleague and honour functions (migration
// 029) and read here under RLS as the operator's own rows.

export type NotificationKind = "colleague_request" | "colleague_accepted" | "honour_granted" | "programme";

export type NotificationRow = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  created_at: string;
  read_at: string | null;
};

export const NOTIFICATION_COLUMNS = "id, kind, title, body, href, created_at, read_at";

/** Unread rows for the signed-in account, for the bell's count. 0 when
 *  the table is not there yet. */
export async function unreadNotificationCount(supabase: SupabaseClient, userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);
    return error ? 0 : count ?? 0;
  } catch {
    return 0;
  }
}
