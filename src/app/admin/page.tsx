import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasAdminAccess } from "@/lib/auth/operator-access";
import { ServiceBadge, serviceKeyFor } from "@/app/components/service-insignia";
import { setRole, deleteRole } from "./actions";

// The admin area — advisor applications and access roles, managed from
// the site instead of the Supabase Table editor. Needs migration 007
// (the admin_* database functions); without it the page says so rather
// than rendering empty tables.

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
  assigned_role: "admin" | "operator" | "advisor" | null;
  assigned_icon: string | null;
};

type RoleRow = {
  email: string;
  role: "admin" | "operator" | "advisor";
  icon: string | null;
  note: string;
  created_at: string;
};

const inputCls =
  "rounded-sm border border-(--color-border) bg-(--color-bg) px-2 py-1.5 font-mono text-[12px] text-(--color-text) placeholder:text-(--color-text-dim) focus:border-(--color-amber) focus:outline-none";

const btnCls =
  "rounded-sm border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await hasAdminAccess(supabase, user.email))) redirect("/menu");

  const [advisorsRes, rolesRes] = await Promise.all([
    supabase.rpc("admin_list_advisors"),
    supabase.rpc("admin_list_roles"),
  ]);
  const migrationMissing =
    advisorsRes.error?.message?.includes("admin_list_advisors") ?? false;
  const advisors = (advisorsRes.data ?? []) as AdvisorRow[];
  const roles = (rolesRes.data ?? []) as RoleRow[];
  const pending = advisors.filter((a) => a.assigned_role === null);

  return (
    <div className="relative z-10 min-h-[100dvh] px-6 py-8 font-mono">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-(--color-border-subtle) pb-4">
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

        {(advisorsRes.error || rolesRes.error) && (
          <div className="rounded-sm border border-(--color-critical)/60 bg-(--color-critical)/10 px-4 py-3 text-[12px] text-(--color-critical)">
            {migrationMissing
              ? "Migration 007 (admin functions) has not been run in Supabase yet — run supabase/migrations/007_admin_functions.sql in the SQL editor, then reload."
              : `Database error: ${advisorsRes.error?.message ?? rolesRes.error?.message}`}
          </div>
        )}

        {/* Advisor applications */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
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
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-[14px] font-semibold text-(--color-text)">
                            {a.callsign || "(no callsign)"}
                          </span>
                          <span className="text-[12px] text-(--color-text-dim)">{a.email}</span>
                          {a.assigned_role ? (
                            <span className="rounded-sm border border-(--color-ok)/60 bg-(--color-ok)/10 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-(--color-ok)">
                              {a.assigned_role}
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

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {insignia && <ServiceBadge service={insignia} />}
                        <div className="flex gap-2">
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
            className="flex flex-wrap items-center gap-2 rounded-sm border border-(--color-border-subtle) bg-(--color-surface)/40 p-3"
          >
            <input
              name="email"
              type="email"
              required
              placeholder="email@example.com"
              className={`${inputCls} w-64`}
            />
            <select name="role" className={inputCls} defaultValue="operator">
              <option value="operator">operator</option>
              <option value="advisor">advisor</option>
              <option value="admin">admin</option>
            </select>
            <select name="icon" className={inputCls} defaultValue="">
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
              className={`${inputCls} w-56`}
            />
            <button
              type="submit"
              className={`${btnCls} border-(--color-amber)/60 text-(--color-amber) hover:bg-(--color-amber)/15`}
            >
              Grant
            </button>
          </form>

          {roles.length > 0 && (
            <div className="overflow-x-auto rounded-sm border border-(--color-border-subtle)">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-(--color-border-subtle) text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Icon</th>
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
      </div>
    </div>
  );
}
