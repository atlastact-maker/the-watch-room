import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasAdminAccess } from "@/lib/auth/operator-access";
import { ServiceBadge, serviceKeyFor } from "@/app/components/service-insignia";
import {
  setRole,
  deleteRole,
  setBan,
  deleteUser,
  setAdvisorDecline,
  addAdminNote,
  deleteAdminNote,
  setDiscordGranted,
} from "./actions";

// The admin area — overview numbers, advisor applications, access roles
// and recent registrations, managed from the site instead of the
// Supabase Table editor. Needs migrations 007 + 008 (the admin_*
// database functions); without them the page says so rather than
// rendering empty tables. Laid out mobile-first: Tuesday's applications
// will be accepted from a phone.

export const metadata = { title: "Admin — The Watch Room" };

type AdvisorRow = {
  user_id: string;
  email: string;
  callsign: string;
  service: string;
  status: string;
  force_area: string;
  topics: unknown;
  involvement: string;
  contact_ok: boolean;
  discord: string;
  background: string;
  notes: string;
  applied_at: string;
  declined_at: string | null;
  assigned_role: "admin" | "operator" | "advisor" | null;
  assigned_icon: string | null;
};

type RoleRow = {
  email: string;
  role: "admin" | "operator" | "advisor";
  icon: string | null;
  note: string;
  created_at: string;
  /** From their advisor application; empty until migration 014 is run. */
  discord: string;
  /** Whether the Discord permission has been handed out for this role.
   *  Undefined until migration 015 is run, which the control treats as
   *  false. */
  discord_granted?: boolean;
};

type Overview = {
  total_accounts: number;
  new_accounts_7d: number;
  newsletter_opt_ins: number;
  applications_total: number;
  applications_pending: number;
  advisors_accepted: number;
  operators_granted: number;
  calls_answered: number;
  incidents_resolved: number;
};

type NoteRow = {
  id: string;
  subject_user_id: string;
  note: string;
  author_email: string;
  created_at: string;
};

type UserRow = {
  user_id: string;
  email: string;
  callsign: string;
  /** From the advisor questionnaire — empty for anyone who never filed
   *  one, and empty for everybody until migration 013 has been run. */
  discord: string;
  created_at: string;
  newsletter: boolean;
  is_advisor_applicant: boolean;
  assigned_role: "admin" | "operator" | "advisor" | null;
  banned: boolean;
};

const inputCls =
  "rounded-sm border border-(--color-border) bg-(--color-bg) px-2 py-2 font-mono text-[12px] text-(--color-text) placeholder:text-(--color-text-dim) focus:border-(--color-amber) focus:outline-none";

const btnCls =
  "rounded-sm border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function Tile({ n, label, tone }: { n: number; label: string; tone?: "amber" }) {
  return (
    <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface)/50 px-3 py-2.5">
      <div
        className={`text-xl font-semibold tabular-nums ${
          tone === "amber" ? "text-(--color-amber)" : "text-(--color-text)"
        }`}
      >
        {n.toLocaleString()}
      </div>
      <div className="mt-0.5 text-[9px] uppercase leading-tight tracking-widest text-(--color-text-dim)">
        {label}
      </div>
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ missing?: string | string[] }>;
}) {
  // A write action that hit a missing database function sends us back
  // here with the migration number, so it can be reported the same way
  // a missing list function is.
  const { missing } = await searchParams;
  const missing015 = missing === "015";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await hasAdminAccess(supabase, user.email))) redirect("/menu");

  const [advisorsRes, rolesRes, overviewRes, usersRes, notesRes] = await Promise.all([
    supabase.rpc("admin_list_advisors"),
    supabase.rpc("admin_list_roles"),
    supabase.rpc("admin_overview"),
    supabase.rpc("admin_list_users", { p_limit: 25 }),
    supabase.rpc("admin_notes_all"),
  ]);

  const firstError =
    advisorsRes.error ?? rolesRes.error ?? overviewRes.error ?? usersRes.error ?? notesRes.error;
  const missing007 = advisorsRes.error?.message?.includes("admin_list_advisors");
  const missing008 = overviewRes.error?.message?.includes("admin_overview");

  const advisors = (advisorsRes.data ?? []) as AdvisorRow[];
  const roles = (rolesRes.data ?? []) as RoleRow[];
  const overview = ((overviewRes.data ?? []) as Overview[])[0];
  const users = (usersRes.data ?? []) as UserRow[];
  // Notes are fetched for every listed account in one call rather than
  // per row — 25 round trips to render a page would be daft.
  const notesByUser = new Map<string, NoteRow[]>();
  for (const n of (notesRes.data ?? []) as NoteRow[]) {
    const list = notesByUser.get(n.subject_user_id) ?? [];
    list.push(n);
    notesByUser.set(n.subject_user_id, list);
  }
  const missing011 = notesRes.error?.message?.includes("admin_notes_all");
  const pending = advisors.filter(
    (a) => a.assigned_role === null && !a.declined_at,
  );

  return (
    <div className="relative z-10 min-h-[100dvh] px-4 py-6 font-mono sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-border-subtle) pb-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-(--color-amber-dim)">
              The Watch Room
            </div>
            <h1 className="mt-1 text-xl uppercase tracking-[0.15em] text-(--color-text)">
              Administration
            </h1>
          </div>
          <Link
            href="/menu"
            className={`${btnCls} border-(--color-border) text-(--color-text-dim) hover:border-(--color-amber) hover:text-(--color-amber)`}
          >
            Ops Centre
          </Link>
        </div>

        {(firstError || missing015) && (
          <div className="rounded-sm border border-(--color-critical)/60 bg-(--color-critical)/10 px-4 py-3 text-[12px] text-(--color-critical)">
            {missing015
              ? "Migration 015 (Discord permission tick) has not been run in Supabase yet — run supabase/migrations/015_roles_discord_granted.sql in the SQL editor, then reload."
              : missing007
              ? "Migration 007 (admin functions) has not been run in Supabase yet — run supabase/migrations/007_admin_functions.sql in the SQL editor, then reload."
              : missing008
                ? "Migration 008 (admin overview) has not been run in Supabase yet — run supabase/migrations/008_admin_overview.sql in the SQL editor, then reload."
                : missing011
                  ? "Migration 011 (admin notes) has not been run in Supabase yet — run supabase/migrations/011_admin_notes.sql in the SQL editor, then reload."
                  : `Database error: ${firstError?.message ?? "unknown"}`}
          </div>
        )}

        {/* Overview */}
        {overview && (
          <section className="space-y-3">
            <h2 className="text-[12px] uppercase tracking-[0.25em] text-(--color-text)">
              Overview
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              <Tile n={overview.total_accounts} label="Accounts" />
              <Tile n={overview.new_accounts_7d} label="New · 7 days" />
              <Tile n={overview.applications_pending} label="Applications pending" tone="amber" />
              <Tile n={overview.advisors_accepted} label="Advisors" />
              <Tile n={overview.operators_granted} label="Operators" />
              <Tile n={overview.newsletter_opt_ins} label="Newsletter" />
              <Tile n={overview.calls_answered} label="Calls answered" />
              <Tile n={overview.incidents_resolved} label="Incidents resolved" />
            </div>
          </section>
        )}

        {/* Advisor applications */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[12px] uppercase tracking-[0.25em] text-(--color-text)">
              Advisor applications
            </h2>
            <span className="text-[11px] uppercase tracking-widest text-(--color-text-dim)">
              {pending.length} awaiting review · {advisors.length} total
            </span>
          </div>

          {advisors.length === 0 ? (
            <p className="border border-(--color-border-subtle) px-4 py-6 text-center text-[12px] text-(--color-text-dim)">
              No applications yet. They land here the moment someone ticks
              the advisor box at signup.
            </p>
          ) : (
            <div className="space-y-3">
              {advisors.map((a) => {
                const insignia = serviceKeyFor(a.service);
                const topics = Array.isArray(a.topics) ? (a.topics as string[]) : [];
                return (
                  <div
                    key={a.user_id}
                    className="rounded-sm border border-(--color-border) bg-(--color-surface)/60 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <span className="text-[14px] font-semibold text-(--color-text)">
                            {a.callsign || "(no callsign)"}
                          </span>
                          <span className="break-all text-[12px] text-(--color-text-dim)">
                            {a.email}
                          </span>
                          {a.assigned_role ? (
                            <span className="rounded-sm border border-(--color-ok)/60 bg-(--color-ok)/10 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-(--color-ok)">
                              {a.assigned_role}
                            </span>
                          ) : a.declined_at ? (
                            <span className="rounded-sm border border-(--color-critical)/60 bg-(--color-critical)/10 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-(--color-critical)">
                              Declined
                            </span>
                          ) : (
                            <span className="rounded-sm border border-(--color-amber)/60 bg-(--color-amber)/10 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-(--color-amber)">
                              Awaiting review
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 text-[11px] uppercase tracking-widest text-(--color-text-dim)">
                          {a.service}
                          {a.status ? ` · ${a.status}` : ""}
                          {a.force_area ? ` · ${a.force_area}` : ""}
                          {" · applied "}
                          {fmtDate(a.applied_at)}
                        </div>
                        {topics.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {topics.map((t) => (
                              <span
                                key={t}
                                className="rounded-sm border border-(--color-border) px-1.5 py-0.5 text-[10px] text-(--color-text-dim)"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        {a.background && (
                          <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-(--color-text-muted)">
                            {a.background}
                          </p>
                        )}
                        <div className="mt-1.5 text-[11px] text-(--color-text-dim)">
                          {a.discord && <>Discord: {a.discord} · </>}
                          Contact OK: {a.contact_ok ? "yes" : "no"}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                        {insignia && (
                          <span className="hidden sm:inline-flex">
                            <ServiceBadge service={insignia} />
                          </span>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {a.assigned_role === null && (
                            <form action={setRole}>
                              <input type="hidden" name="email" value={a.email} />
                              <input type="hidden" name="role" value="advisor" />
                              <button
                                type="submit"
                                className={`${btnCls} border-(--color-ok)/60 text-(--color-ok) hover:bg-(--color-ok)/15`}
                              >
                                Accept advisor
                              </button>
                            </form>
                          )}
                          {a.assigned_role === null && !a.declined_at && (
                            <form action={setAdvisorDecline}>
                              <input type="hidden" name="userId" value={a.user_id} />
                              <input type="hidden" name="email" value={a.email} />
                              <input type="hidden" name="declined" value="true" />
                              <button
                                type="submit"
                                className={`${btnCls} border-(--color-border) text-(--color-text-dim) hover:border-(--color-critical) hover:text-(--color-critical)`}
                              >
                                Decline
                              </button>
                            </form>
                          )}
                          {a.assigned_role === null && a.declined_at && (
                            <form action={setAdvisorDecline}>
                              <input type="hidden" name="userId" value={a.user_id} />
                              <input type="hidden" name="declined" value="false" />
                              <button
                                type="submit"
                                className={`${btnCls} border-(--color-border) text-(--color-text-dim) hover:border-(--color-amber) hover:text-(--color-amber)`}
                              >
                                Undo decline
                              </button>
                            </form>
                          )}
                          {a.assigned_role === "advisor" && (
                            <form action={setRole}>
                              <input type="hidden" name="email" value={a.email} />
                              <input type="hidden" name="role" value="operator" />
                              <button
                                type="submit"
                                className={`${btnCls} border-(--color-amber)/60 text-(--color-amber) hover:bg-(--color-amber)/15`}
                              >
                                Promote to operator
                              </button>
                            </form>
                          )}
                          {a.assigned_role !== null && a.assigned_role !== "admin" && (
                            <form action={deleteRole}>
                              <input type="hidden" name="email" value={a.email} />
                              <button
                                type="submit"
                                className={`${btnCls} border-(--color-border) text-(--color-text-dim) hover:border-(--color-critical) hover:text-(--color-critical)`}
                              >
                                Revoke
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Access roles */}
        <section className="space-y-3">
          <h2 className="text-[12px] uppercase tracking-[0.25em] text-(--color-text)">
            Access roles
          </h2>

          <form
            action={setRole}
            className="grid grid-cols-1 gap-2 rounded-sm border border-(--color-border-subtle) bg-(--color-surface)/40 p-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center"
          >
            <input
              name="email"
              type="email"
              required
              placeholder="email@example.com"
              className={`${inputCls} w-full lg:w-64`}
            />
            <select name="role" className={`${inputCls} w-full lg:w-auto`} defaultValue="operator">
              <option value="operator">operator</option>
              <option value="advisor">advisor</option>
              <option value="admin">admin</option>
            </select>
            <select name="icon" className={`${inputCls} w-full lg:w-auto`} defaultValue="">
              <option value="">icon: from application</option>
              <option value="fire">fire</option>
              <option value="ambulance">ambulance</option>
              <option value="police">police</option>
              <option value="control">control</option>
              <option value="specialist">specialist</option>
            </select>
            <input
              name="note"
              placeholder="note (who is this?)"
              className={`${inputCls} w-full lg:w-56`}
            />
            <button
              type="submit"
              className={`${btnCls} border-(--color-amber)/60 text-(--color-amber) hover:bg-(--color-amber)/15 sm:col-span-2 lg:col-span-1 lg:w-auto`}
            >
              Grant
            </button>
          </form>

          {roles.length > 0 && (
            <div className="overflow-x-auto rounded-sm border border-(--color-border-subtle)">
              <table className="w-full min-w-[660px] text-left text-[12px]">
                <thead>
                  <tr className="border-b border-(--color-border-subtle) text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Icon</th>
                    <th className="px-3 py-2">Discord</th>
                    <th className="px-3 py-2">Note</th>
                    <th className="px-3 py-2">Since</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r) => (
                    <tr key={r.email} className="border-b border-(--color-border-subtle)/50">
                      <td className="px-3 py-2 text-(--color-text)">{r.email}</td>
                      <td className="px-3 py-2 uppercase tracking-widest text-(--color-amber)">
                        {r.role}
                      </td>
                      <td className="px-3 py-2 text-(--color-text-dim)">{r.icon ?? "—"}</td>
                      <td className="px-3 py-2 font-mono text-(--color-info)">
                        <div className="flex items-center gap-2">
                          <span>
                            {r.discord || <span className="text-(--color-text-dim)">—</span>}
                          </span>
                          <form action={setDiscordGranted} className="flex">
                            <input type="hidden" name="email" value={r.email} />
                            <input
                              type="hidden"
                              name="granted"
                              value={r.discord_granted ? "false" : "true"}
                            />
                            <button
                              type="submit"
                              role="checkbox"
                              aria-checked={!!r.discord_granted}
                              aria-label="Discord permission given"
                              title={
                                r.discord_granted
                                  ? "Discord permission given — click to clear"
                                  : "Discord permission not yet given — click to tick"
                              }
                              className={
                                "inline-flex h-5 w-5 items-center justify-center rounded-[2px] border text-[12px] leading-none transition-colors " +
                                (r.discord_granted
                                  ? "border-(--color-ok) bg-(--color-ok)/15 text-(--color-ok)"
                                  : "border-(--color-border) text-transparent hover:border-(--color-ok)/60")
                              }
                            >
                              ✓
                            </button>
                          </form>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-(--color-text-dim)">{r.note || "—"}</td>
                      <td className="px-3 py-2 text-(--color-text-dim)">{fmtDate(r.created_at)}</td>
                      <td className="px-3 py-2 text-right">
                        {r.role !== "admin" && (
                          <form action={deleteRole}>
                            <input type="hidden" name="email" value={r.email} />
                            <button
                              type="submit"
                              className={`${btnCls} border-(--color-border) text-(--color-text-dim) hover:border-(--color-critical) hover:text-(--color-critical)`}
                            >
                              Revoke
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent registrations */}
        {users.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[12px] uppercase tracking-[0.25em] text-(--color-text)">
              Registered users
            </h2>
            <div className="divide-y divide-(--color-border-subtle)/50 rounded-sm border border-(--color-border-subtle)">
              {users.map((u) => (
                <div key={u.user_id} className="px-3 py-2.5 text-[12px]">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold text-(--color-text)">
                      {u.callsign ? u.callsign.toUpperCase() : "—"}
                    </span>
                    <span className="break-all text-(--color-text-dim)">{u.email}</span>
                    {u.discord && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-sm border border-(--color-info)/40 px-1.5 py-0.5 font-mono text-[11px] text-(--color-info)"
                        title="Discord handle, from their advisor application"
                      >
                        <span className="text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                          Discord
                        </span>
                        {u.discord}
                      </span>
                    )}
                    <span className="ml-auto flex items-center gap-2 text-[10px] uppercase tracking-widest">
                      {u.banned && (
                        <span className="rounded-sm border border-(--color-critical)/60 bg-(--color-critical)/10 px-1.5 py-0.5 text-(--color-critical)">
                          Banned
                        </span>
                      )}
                      {u.is_advisor_applicant && (
                        <span className="rounded-sm border border-(--color-info)/50 px-1.5 py-0.5 text-(--color-info)">
                          Applicant
                        </span>
                      )}
                      {u.assigned_role && (
                        <span className="rounded-sm border border-(--color-ok)/50 px-1.5 py-0.5 text-(--color-ok)">
                          {u.assigned_role}
                        </span>
                      )}
                      {u.newsletter && (
                        <span className="text-(--color-text-dim)">✉</span>
                      )}
                      <span className="text-(--color-text-dim)">{fmtDate(u.created_at)}</span>
                    </span>
                  </div>
                  {u.assigned_role !== "admin" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {!u.assigned_role && (
                        <form action={setRole} className="flex items-center gap-1.5">
                          <input type="hidden" name="email" value={u.email} />
                          <select name="role" className={`${inputCls} py-1 text-[11px]`} defaultValue="operator">
                            <option value="operator">operator</option>
                            <option value="advisor">advisor</option>
                          </select>
                          <button
                            type="submit"
                            className={`${btnCls} border-(--color-ok)/60 text-(--color-ok) hover:bg-(--color-ok)/15`}
                          >
                            Grant
                          </button>
                        </form>
                      )}
                      <form action={setBan}>
                        <input type="hidden" name="userId" value={u.user_id} />
                        <input type="hidden" name="banned" value={u.banned ? "false" : "true"} />
                        <button
                          type="submit"
                          className={`${btnCls} ${
                            u.banned
                              ? "border-(--color-ok)/60 text-(--color-ok) hover:bg-(--color-ok)/15"
                              : "border-(--color-amber)/60 text-(--color-amber) hover:bg-(--color-amber)/15"
                          }`}
                        >
                          {u.banned ? "Unban" : "Ban"}
                        </button>
                      </form>
                      {/* Two-step delete with no client JS: the summary
                          opens, the real button confirms. */}
                      <details className="relative">
                        <summary
                          className={`${btnCls} inline-block cursor-pointer list-none border-(--color-border) text-(--color-text-dim) hover:border-(--color-critical) hover:text-(--color-critical)`}
                        >
                          Delete
                        </summary>
                        <form action={deleteUser} className="absolute left-0 top-full z-10 mt-1">
                          <input type="hidden" name="userId" value={u.user_id} />
                          <button
                            type="submit"
                            className={`${btnCls} whitespace-nowrap border-(--color-critical) bg-(--color-critical)/15 text-(--color-critical)`}
                          >
                            Confirm permanent delete
                          </button>
                        </form>
                      </details>
                      <AdminNotes
                        userId={u.user_id}
                        notes={notesByUser.get(u.user_id) ?? []}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/**
 * Notes on one account. Collapsed by default — a user list is for
 * scanning, and notes are for when you have stopped scanning — but the
 * summary carries the count so you can see at a glance which accounts
 * have history without opening anything.
 *
 * No client JS: a <details> for the disclosure, server actions for the
 * writes, same as the rest of this page.
 */
function AdminNotes({
  userId,
  notes,
}: {
  userId: string;
  notes: NoteRow[];
}) {
  return (
    <details className="w-full">
      <summary
        className={`${btnCls} inline-block cursor-pointer list-none border-(--color-info)/50 text-(--color-info) hover:bg-(--color-info)/10`}
      >
        Notes{notes.length > 0 ? ` · ${notes.length}` : ""}
      </summary>

      <div className="mt-2 space-y-1.5 rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/50 p-2">
        <p className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
          Admin only — never shown to the user
        </p>

        {notes.length > 0 && (
          <ul className="space-y-1.5">
            {notes.map((n) => (
              <li
                key={n.id}
                className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface)/60 px-2 py-1.5"
              >
                <p className="text-[12px] leading-snug text-(--color-text)">{n.note}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                  <span className="break-all">{n.author_email}</span>
                  <span>{fmtDate(n.created_at)}</span>
                  <form action={deleteAdminNote} className="ml-auto">
                    <input type="hidden" name="noteId" value={n.id} />
                    <button
                      type="submit"
                      className="uppercase tracking-widest text-(--color-text-dim) hover:text-(--color-critical)"
                      title="Delete this note"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form action={addAdminNote} className="flex flex-col gap-1.5 sm:flex-row">
          <input type="hidden" name="userId" value={userId} />
          <input
            name="note"
            required
            maxLength={1000}
            placeholder="Add a note — why accepted, background, anything worth remembering"
            className={`${inputCls} flex-1`}
          />
          <button
            type="submit"
            className={`${btnCls} shrink-0 border-(--color-ok)/60 text-(--color-ok) hover:bg-(--color-ok)/15`}
          >
            Add note
          </button>
        </form>
      </div>
    </details>
  );
}
