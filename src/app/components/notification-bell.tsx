"use client";

// The bell on the console's top bar: the count of what is unread, a
// panel of the latest lines, and a pop-up when a new one arrives while
// the console is open. The rows are the account's own under RLS; a
// realtime subscription hears inserts, and a slow poll covers a channel
// that never connects. The desk has its own alerts; this is for the
// console only.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NOTIFICATION_COLUMNS, type NotificationRow } from "@/lib/notifications";
import { sinceLabel } from "@/lib/operators";
import { Icon } from "@/app/menu/icons";
import styles from "@/app/menu/watch-menu.module.css";

const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
const PAGE = 20;
const TOAST_MS = 9000;

export function NotificationBell({ userId, initialUnread = 0, demo }: { userId: string; initialUnread?: number; demo?: NotificationRow | null }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<NotificationRow[] | null>(null);
  const [unread, setUnread] = useState(initialUnread);
  const [toast, setToast] = useState<NotificationRow | null>(demo ?? null);
  const wrap = useRef<HTMLDivElement>(null);
  const seen = useRef(new Set<string>());
  const unreadRef = useRef(initialUnread);
  useEffect(() => { unreadRef.current = unread; }, [unread]);

  const load = useCallback(async (announceNew = false) => {
    if (!configured) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select(NOTIFICATION_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(PAGE);
    if (error || !data) return;
    const list = data as NotificationRow[];
    const fresh = list.filter((r) => !r.read_at && !seen.current.has(r.id));
    for (const r of list) seen.current.add(r.id);
    setRows(list);
    setUnread(list.filter((r) => !r.read_at).length);
    if (announceNew && fresh.length > 0) setToast(fresh[0]);
  }, [userId]);

  // A new row for this account is a pop-up. The poll is the fallback:
  // when the unread count moves while the tab is visible, reload.
  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
        const row = payload.new as NotificationRow;
        if (!row?.id || seen.current.has(row.id)) return;
        seen.current.add(row.id);
        setRows((prev) => (prev ? [row, ...prev].slice(0, PAGE) : prev));
        setUnread((n) => n + 1);
        setToast(row);
      })
      .subscribe();
    const poll = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null)
        .then(({ count, error }) => {
          if (error || count === null || count === unreadRef.current) return;
          void load(count > unreadRef.current);
        });
    }, 60_000);
    return () => {
      void supabase.removeChannel(channel);
      window.clearInterval(poll);
    };
  }, [userId, load]);

  // The pop-up goes by itself.
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast]);

  // The panel closes on a click elsewhere or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && rows === null) void load();
  }

  async function markRead(ids?: string[]) {
    setRows((prev) => prev ? prev.map((r) => (!ids || ids.includes(r.id)) && !r.read_at ? { ...r, read_at: new Date().toISOString() } : r) : prev);
    setUnread((n) => (ids ? Math.max(0, n - ids.length) : 0));
    if (!configured) return;
    await createClient().rpc("notifications_mark_read", { p_ids: ids ?? null });
  }

  return (
    <div className={styles.bellWrap} ref={wrap}>
      <button type="button" className={`${styles.bell} ${unread > 0 ? styles.bellLive : ""}`} onClick={toggle} aria-haspopup="dialog" aria-expanded={open} aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"} title="Notifications">
        <Icon.bell />
        {unread > 0 && <span className={styles.bellCount}>{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className={styles.bellPanel} role="dialog" aria-label="Notifications">
          <div className={styles.bellHead}>
            <strong>Notifications</strong>
            {unread > 0 && <button type="button" className={styles.textButton} onClick={() => void markRead()}>Mark all read</button>}
          </div>
          {rows === null ? (
            <p className={styles.muted}>{configured ? "Loading…" : "Nothing yet."}</p>
          ) : rows.length === 0 ? (
            <p className={styles.muted}>Nothing yet. Colleague requests, acceptances and honours land here.</p>
          ) : (
            <ul className={styles.bellList}>
              {rows.map((r) => (
                <li key={r.id} className={r.read_at ? undefined : styles.bellUnread}>
                  <Link href={r.href || "/colleagues"} onClick={() => { if (!r.read_at) void markRead([r.id]); setOpen(false); }}>
                    <strong>{r.title}</strong>
                    {r.body && <span>{r.body}</span>}
                    <small>{sinceLabel(r.created_at) || "just now"}</small>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className={styles.formStatus}><Link href="/colleagues" onClick={() => setOpen(false)}>Colleagues</Link></p>
        </div>
      )}

      {toast && (
        <div className={styles.toast} role="status">
          <Link href={toast.href || "/colleagues"} onClick={() => { if (!toast.read_at) void markRead([toast.id]); setToast(null); }}>
            <strong>{toast.title}</strong>
            {toast.body && <span>{toast.body}</span>}
          </Link>
          <button type="button" className={styles.toastClose} onClick={() => setToast(null)} aria-label="Dismiss">×</button>
        </div>
      )}
    </div>
  );
}
