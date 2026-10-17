import Link from "next/link";
import { ConsoleShell } from "@/app/menu/console-shell";
import { consoleSession, consoleUser } from "@/app/menu/console-session";
import styles from "@/app/menu/watch-menu.module.css";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasAdminAccess } from "@/lib/auth/operator-access";
import { ServiceBadge, serviceKeyFor } from "@/app/components/service-insignia";
import { labelForType } from "@/lib/sim/pda";
import type { IncidentTypeCode } from "@/lib/sim/incident_types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addAdminNote, decideTesterApplication, deleteAdminNote, setBan, setTester } from "../actions";

// One person, for the admin: the account and its standing, the advisor
// application and the Pre-Alpha request they filed, their service record
// with its place on the leaderboard, the notes on them and the bugs they
// reported. Reached from any name on the admin lists. Read in one call
// (migration 025); before that function exists the page composes the
// same picture from the older admin functions, short of last sign-in.

export const metadata = { title: "Profile — The Watch Room" };

type Grade = "A" | "B" | "C" | "D" | "F";
const GRADE_ORDER: Grade[] = ["A", "B", "C", "D", "F"];
const GRADE_FILL: Record<Grade, string> = { A: "#4fc16d", B: "#6fcf8a", C: "#e6b65c", D: "#d8a955", F: "#e5736a" };

type StatsRow = {
  user_id: string;
  callsign: string;
  score: number;
  calls_answered: number;
  incidents_resolved: number;
  grades: Partial<Record<Grade, number>> | null;
  resources_allocated: number;
  first_alloc_sum_sec: number;
  first_alloc_count: number;
  targets_met: number;
  targets_total: number;
  casualties_saved: number;
  casualties_lost: number;
  by_type: Record<string, number> | null;
  updated_at: string;
};

type AdvisorJson = {
  user_id: string;
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
  created_at: string;
  declined_at: string | null;
};

type ApplicationJson = {
  user_id: string;
  email: string;
  callsign: string;
  discord: string;
  platform: string;
  background: string;
  why: string;
  hours: string;
  agreed: boolean;
  status: "pending" | "accepted" | "declined";
  note: string;
  created_at: string;
  decided_at: string | null;
};

type NoteJson = { id: string; note: string; author_email: string; created_at: string };
type BugJson = { id: string; category: string; severity: string; summary: string; status: string; created_at: string };

type Profile = {
  user_id: string;
  email: string;
  callsign: string;
  discord: string;
  /** The linked Discord account, when there is one (migration 027). */
  discord_id?: string | null;
  discord_verified?: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  newsletter: boolean;
  banned: boolean;
  tester: boolean;
  assigned_role: "admin" | "operator" | "advisor" | null;
  role_icon: string | null;
  role_note: string;
  advisor: AdvisorJson | null;
  application: ApplicationJson | null;
  stats: StatsRow | null;
  rank: number | null;
  players: number;
  notes: NoteJson[];
  bugs: BugJson[];
};

type Loaded = { profile: Profile | null; via: "rpc" | "fallback"; missing025: boolean };

/** The profile in one call, or composed from the older functions when
 *  migration 025 has not been run. */
async function loadProfile(supabase: SupabaseClient, id: string | null, email: string | null): Promise<Loaded> {
  if (id) {
    const res = await supabase.rpc("admin_user_profile", { p_user_id: id });
    const missing = res.error?.message?.includes("admin_user_profile") === true;
    if (!missing) {
      if (res.error) throw new Error(res.error.message);
      const row = ((res.data ?? []) as Profile[])[0];
      return { profile: row ? { ...row, notes: row.notes ?? [], bugs: row.bugs ?? [] } : null, via: "rpc", missing025: false };
    }
  }
  // The older functions, one list each, filtered here.
  type UserRow = { user_id: string; email: string; callsign: string; discord?: string; created_at: string; newsletter: boolean; assigned_role: Profile["assigned_role"]; banned?: boolean; tester?: boolean };
  let users: UserRow[] = [];
  const paged = await supabase.rpc("admin_list_users", { p_limit: 50, p_offset: 0, p_query: email ?? null });
  if (paged.error?.message?.includes("admin_list_users")) {
    const old = await supabase.rpc("admin_list_users", { p_limit: 200 });
    users = (old.data ?? []) as UserRow[];
  } else {
    users = (paged.data ?? []) as UserRow[];
  }
  const u = users.find((x) => (id ? x.user_id === id : false) || (email ? x.email.toLowerCase() === email.toLowerCase() : false));
  if (!u) return { profile: null, via: "fallback", missing025: true };
  const [advisorsRes, appsRes, notesRes, bugsRes, statsRes, rolesRes] = await Promise.all([
    supabase.rpc("admin_list_advisors"),
    supabase.rpc("admin_list_tester_applications", { p_limit: 5000 }),
    supabase.rpc("admin_list_notes", { p_user_id: u.user_id }),
    supabase.rpc("admin_list_bug_reports", { p_limit: 200 }),
    supabase.from("career_stats").select("*").eq("user_id", u.user_id).maybeSingle(),
    supabase.rpc("admin_list_roles"),
  ]);
  const adv = ((advisorsRes.data ?? []) as (AdvisorJson & { applied_at?: string })[]).find((a) => a.user_id === u.user_id) ?? null;
  const app = ((appsRes.data ?? []) as ApplicationJson[]).find((a) => a.user_id === u.user_id) ?? null;
  const role = ((rolesRes.data ?? []) as { email: string; role: Profile["assigned_role"]; icon: string | null; note: string }[]).find((r) => r.email.toLowerCase() === u.email.toLowerCase());
  const stats = (statsRes.data ?? null) as StatsRow | null;
  let rank: number | null = null;
  let players = 0;
  if (stats) {
    const [above, all] = await Promise.all([
      supabase.from("career_stats").select("user_id", { count: "exact", head: true }).gt("score", stats.score),
      supabase.from("career_stats").select("user_id", { count: "exact", head: true }),
    ]);
    rank = (above.count ?? 0) + 1;
    players = all.count ?? 0;
  }
  return {
    via: "fallback",
    missing025: true,
    profile: {
      user_id: u.user_id,
      email: u.email,
      callsign: u.callsign,
      discord: u.discord ?? adv?.discord ?? app?.discord ?? "",
      created_at: u.created_at,
      last_sign_in_at: null,
      email_confirmed_at: null,
      newsletter: u.newsletter,
      banned: !!u.banned,
      tester: !!u.tester,
      assigned_role: role?.role ?? u.assigned_role ?? null,
      role_icon: role?.icon ?? null,
      role_note: role?.note ?? "",
      advisor: adv ? { ...adv, created_at: adv.created_at ?? adv.applied_at ?? "" } : null,
      application: app,
      stats,
      rank,
      players,
      notes: ((notesRes.data ?? []) as NoteJson[]),
      bugs: ((bugsRes.data ?? []) as (BugJson & { user_id: string })[]).filter((b) => b.user_id === u.user_id),
    },
  };
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function fmtWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${fmtDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function ago(iso: string | null | undefined): string {
  if (!iso) return "";
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return "";
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} h ago`;
  const d = Math.floor(h / 24);
  return `${d} days ago`;
}

function fmtDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

function typeLabel(code: string): string {
  const label = labelForType(code as IncidentTypeCode);
  return label && label !== code ? label : code.replace(/[_-]+/g, " ");
}

export default async function AdminUserPage({ searchParams }: { searchParams: Promise<{ id?: string | string[]; e?: string | string[] }> }) {
  const { id: idParam, e: eParam } = await searchParams;
  const id = typeof idParam === "string" && /^[0-9a-f-]{36}$/i.test(idParam) ? idParam : null;
  const email = typeof eParam === "string" && eParam.includes("@") ? eParam.trim().slice(0, 200) : null;
  if (!id && !email) redirect("/admin?tab=users");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await hasAdminAccess(supabase, user.email))) redirect("/menu");
  const session = await consoleSession();

  const { profile: p, missing025 } = await loadProfile(supabase, id, email);

  if (!p) {
    return (
      <ConsoleShell {...consoleUser(session)} active="admin" title="Account profile">
        <header className={styles.pageHead}>
          <div>
            <p className={styles.eyebrow}>Account profile · administration</p>
            <h1 className={styles.pageTitle}>No account found</h1>
            <p className={styles.lede}>Nothing matches {email ?? id}.{missing025 ? " Run supabase/migrations/025_admin_user_profile.sql so profiles can be opened by account id alone." : ""}</p>
          </div>
        </header>
        <div className={styles.actions}><Link href="/admin?tab=users" className={styles.button}>Registered users</Link></div>
      </ConsoleShell>
    );
  }

  const s = p.stats;
  const grades: Record<Grade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0, ...(s?.grades ?? {}) };
  const gradeMax = Math.max(1, ...GRADE_ORDER.map((g) => grades[g]));
  const gradedTotal = GRADE_ORDER.reduce((n, g) => n + grades[g], 0);
  const avgFirstAlloc = s && s.first_alloc_count > 0 ? s.first_alloc_sum_sec / s.first_alloc_count : 0;
  const targetPct = s && s.targets_total > 0 ? Math.round((s.targets_met / s.targets_total) * 100) : null;
  const busiest = s ? Object.entries(s.by_type ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 6) : [];
  const busiestMax = Math.max(1, ...busiest.map(([, n]) => n));
  const adv = p.advisor;
  const advisorStanding = !adv ? null : p.assigned_role === "advisor" || p.assigned_role === "admin" ? "accepted" : adv.declined_at ? "declined" : "applicant";
  const insignia = adv ? serviceKeyFor(adv.service) : null;
  const topics = Array.isArray(adv?.topics) ? (adv!.topics as string[]).filter((t) => typeof t === "string" && t.trim()) : [];
  const app = p.application;
  const appChip = app?.status === "accepted" ? styles.chipOk : app?.status === "declined" ? styles.chipStop : styles.chipAmber;
  const gradeClass: Record<Grade, string> = { A: styles.gradeA, B: styles.gradeB, C: styles.gradeC, D: styles.gradeD, F: styles.gradeF };

  return (
    <ConsoleShell {...consoleUser(session)} active="admin" title="Account profile">
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}><Link href="/admin?tab=users" className={styles.textLink}>Administration</Link> · account profile</p>
          <h1 className={styles.pageTitle}>{p.callsign ? p.callsign.toUpperCase() : "(no callsign)"}</h1>
          <p className={styles.lede}>{p.email}{p.discord ? ` · @${p.discord}${p.discord_verified ? " ✓ linked Discord account" : ""}` : ""}{p.discord_verified && p.discord_id ? <small> · Discord id {p.discord_id}</small> : null}</p>
          <div className={styles.headMeta} style={{ justifyContent: "flex-start", marginTop: 12 }}>
            {p.banned && <span className={`${styles.chip} ${styles.chipStop}`}>Banned</span>}
            {p.assigned_role && <span className={`${styles.chip} ${styles.chipOk}`} title={p.role_note || undefined}>{p.assigned_role}{p.role_icon ? ` · ${p.role_icon}` : ""}</span>}
            {advisorStanding === "applicant" && <span className={`${styles.chip} ${styles.chipInfo}`} title="Has filed the advisor questionnaire; awaiting review">Advisor applicant</span>}
            {advisorStanding === "declined" && <span className={styles.chip} title="Advisor application declined">Advisor · declined</span>}
            {p.tester && <span className={`${styles.chip} ${styles.chipAmber}`}>Tester</span>}
            {app && !p.tester && <span className={`${styles.chip} ${appChip}`}>Pre-Alpha · {app.status}</span>}
            {p.newsletter && <span className={styles.chip} title="Newsletter opt-in">Newsletter</span>}
          </div>
        </div>
        {insignia && <div className={styles.legacy}><ServiceBadge service={insignia} role={advisorStanding === "accepted" ? "ADVISOR" : "APPLICANT"} /></div>}
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHead}><h2>Account</h2></div>
        <div className={styles.facts2} style={{ marginTop: 0 }}>
          <div className={styles.factRow}><span>Created</span><span>{fmtDate(p.created_at)}{p.created_at ? ` · ${ago(p.created_at)}` : ""}</span></div>
          <div className={styles.factRow}><span>Last sign-in</span><span>{missing025 ? "needs migration 025" : <>{fmtWhen(p.last_sign_in_at)}{p.last_sign_in_at ? ` · ${ago(p.last_sign_in_at)}` : ""}</>}</span></div>
          <div className={styles.factRow}><span>Email</span><span>{missing025 ? "confirmation needs migration 025" : p.email_confirmed_at ? `confirmed ${fmtDate(p.email_confirmed_at)}` : <span style={{ color: "var(--amber)" }}>not confirmed</span>}</span></div>
          <div className={styles.factRow}><span>Last played</span><span>{s ? <>{fmtWhen(s.updated_at)} · {ago(s.updated_at)}</> : "never taken a shift"}</span></div>
        </div>
        {missing025 && <p className={styles.formStatus} style={{ color: "var(--amber)" }}>Run supabase/migrations/025_admin_user_profile.sql once in the Supabase SQL editor for last sign-in and email confirmation. Everything else on this page is live.</p>}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Service record</h2>
          {s && p.rank ? <span className={styles.chip}>#{p.rank} of {p.players} on the leaderboard</span> : null}
        </div>
        {!s ? (
          <p className={styles.muted}>No service record yet. The row appears after their first shift syncs.</p>
        ) : (
          <>
            <div className={styles.stats}>
              <div><strong>{s.score}</strong><span>Command points</span></div>
              <div><strong>{s.calls_answered}</strong><span>Calls handled</span></div>
              <div><strong>{s.incidents_resolved}</strong><span>Incidents resolved</span></div>
              <div><strong>{s.resources_allocated}</strong><span>Resources mobilised</span></div>
              <div><strong>{fmtDuration(avgFirstAlloc)}</strong><span>Mean time to first mobilisation</span></div>
              <div><strong>{targetPct === null ? "—" : `${targetPct}%`}</strong><span>Standards met{s.targets_total ? ` · ${s.targets_met} of ${s.targets_total}` : ""}</span></div>
              <div><strong>{s.casualties_saved}</strong><span>Casualties conveyed</span></div>
              <div><strong>{s.casualties_lost}</strong><span>Casualties deceased</span></div>
            </div>
            <div className={styles.twoCol} style={{ marginTop: 16 }}>
              <div>
                <p className={styles.eyebrow}>Grade distribution · {gradedTotal} graded</p>
                <ul className={styles.bars}>
                  {GRADE_ORDER.map((g) => (
                    <li key={g}>
                      <span className={`${styles.gradeBadge} ${gradeClass[g]}`}>{g}</span>
                      <span className={styles.track}><span className={styles.fill} style={{ width: `${Math.round((grades[g] / gradeMax) * 100)}%`, background: GRADE_FILL[g] }} /></span>
                      <em>{grades[g]}</em>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className={styles.eyebrow}>Incident types · most frequent</p>
                {busiest.length === 0 ? (
                  <p className={styles.muted}>No incidents on record.</p>
                ) : (
                  <ul className={styles.bars}>
                    {busiest.map(([code, n]) => (
                      <li key={code} style={{ gridTemplateColumns: "minmax(0, 150px) minmax(0, 1fr) 36px" }}>
                        <span className={styles.email} style={{ color: "var(--text)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={code}>{typeLabel(code)}</span>
                        <span className={styles.track}><span className={styles.fill} style={{ width: `${Math.round((n / busiestMax) * 100)}%`, background: "#6aa6e8" }} /></span>
                        <em>{n}</em>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Pre-Alpha</h2>
          <span className={`${styles.chip} ${p.tester ? styles.chipAmber : ""}`}>{p.tester ? "On the tester list" : "Not a tester"}</span>
        </div>
        {app ? (
          <div className={styles.card} style={{ padding: 0, border: 0, background: "none" }}>
            <div>
              <div className={styles.cardHead}>
                <span className={`${styles.chip} ${appChip}`}>{app.status}</span>
                <span className={styles.email}>Requested {fmtDate(app.created_at)}{app.decided_at ? ` · decided ${fmtDate(app.decided_at)}` : ""}{[app.hours, app.platform].filter(Boolean).length > 0 ? ` · ${[app.hours, app.platform].filter(Boolean).join(" · ")}` : ""}</span>
              </div>
              {app.background && <div className={styles.factRow} style={{ marginTop: 10 }}><span>Background</span><span>{app.background}</span></div>}
              {app.why && <div className={styles.factRow} style={{ marginTop: 6 }}><span>Why</span><span>{app.why}</span></div>}
              {app.note && <div className={styles.factRow} style={{ marginTop: 6 }}><span>Note</span><span style={{ color: "var(--amber)" }}>{app.note}</span></div>}
            </div>
            <form action={decideTesterApplication} className={styles.cardForm}>
              <input type="hidden" name="userId" value={p.user_id} />
              <input type="hidden" name="email" value={p.email} />
              <input name="note" placeholder="Note (optional)" defaultValue={app.note} className={styles.input} aria-label="Note on this request" />
              <div className={styles.actions}>
                {app.status !== "accepted" && <button type="submit" name="status" value="accepted" className={`${styles.primary} ${styles.small}`}>Accept</button>}
                {app.status !== "declined" && <button type="submit" name="status" value="declined" className={`${styles.button} ${styles.small} ${styles.danger}`}>Decline</button>}
                {app.status !== "pending" && <button type="submit" name="status" value="pending" className={`${styles.button} ${styles.small}`}>Back to pending</button>}
              </div>
            </form>
          </div>
        ) : (
          <div className={styles.switchRow}>
            <p className={styles.muted}>No Pre-Alpha request filed.</p>
            {p.assigned_role !== "admin" && (
              <form action={setTester}>
                <input type="hidden" name="email" value={p.email} />
                <input type="hidden" name="tester" value={p.tester ? "false" : "true"} />
                <button type="submit" className={`${styles.button} ${styles.small} ${p.tester ? styles.danger : styles.okBtn}`}>{p.tester ? "Remove from the tester list" : "Add to the tester list"}</button>
              </form>
            )}
          </div>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Advisor programme</h2>
          {adv && <Link href="/admin" className={styles.textLink} style={{ fontSize: 12 }}>Applications tab</Link>}
        </div>
        {!adv ? (
          <p className={styles.muted}>Has not filed the advisor questionnaire.</p>
        ) : (
          <>
            <div className={styles.cardHead}>
              {advisorStanding === "accepted" ? <span className={`${styles.chip} ${styles.chipOk}`}>Advisor</span> : advisorStanding === "declined" ? <span className={`${styles.chip} ${styles.chipStop}`}>Declined</span> : <span className={`${styles.chip} ${styles.chipAmber}`}>Awaiting review</span>}
              <span className={styles.email}>{adv.service}{adv.status ? ` · ${adv.status}` : ""}{adv.force_area ? ` · ${adv.force_area}` : ""}{adv.involvement ? ` · ${adv.involvement}` : ""} · applied {fmtDate(adv.created_at)}</span>
            </div>
            {topics.length > 0 && <div className={styles.tags}>{topics.map((t) => <span key={t}>{t}</span>)}</div>}
            {adv.background && <div className={styles.factRow} style={{ marginTop: 10 }}><span>Background</span><span className={styles.pre} style={{ marginTop: 0 }}>{adv.background}</span></div>}
            {adv.notes && <div className={styles.factRow} style={{ marginTop: 6 }}><span>Notes</span><span className={styles.pre} style={{ marginTop: 0 }}>{adv.notes}</span></div>}
            <div className={styles.factRow} style={{ marginTop: 6 }}><span>Contact</span><span>{adv.contact_ok ? `permitted${adv.discord ? ` · @${adv.discord}` : ""}` : "asked not to be contacted"}</span></div>
          </>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Admin notes</h2>
          <span className={styles.chip}>{p.notes.length}</span>
        </div>
        <p className={styles.formStatus} style={{ marginTop: 0 }}>Admin only · never shown to the user</p>
        {p.notes.length > 0 && (
          <ul className={styles.kv}>
            {p.notes.map((n) => (
              <li key={n.id}>
                <span>
                  <span style={{ color: "var(--text)", whiteSpace: "pre-wrap" }}>{n.note}</span>
                  <span className={styles.cardMeta} style={{ display: "block" }}>{n.author_email} · {fmtWhen(n.created_at)}</span>
                </span>
                <form action={deleteAdminNote}>
                  <input type="hidden" name="noteId" value={n.id} />
                  <button type="submit" className={`${styles.button} ${styles.small} ${styles.danger}`}>Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addAdminNote} className={styles.inlineForm}>
          <input type="hidden" name="userId" value={p.user_id} />
          <input name="note" required placeholder="Add a note about this account" className={styles.input} aria-label="New note" />
          <button type="submit" className={`${styles.button} ${styles.small} ${styles.okBtn}`}>Add note</button>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Bug reports</h2>
          <span className={styles.chip}>{p.bugs.length}</span>
        </div>
        {p.bugs.length === 0 ? (
          <p className={styles.muted}>None filed.</p>
        ) : (
          <>
            <ul className={styles.kv}>
              {p.bugs.map((b) => (
                <li key={b.id}>
                  <span><span className={`${styles.chip} ${b.status === "fixed" || b.status === "closed" ? styles.chipOk : b.status === "looking" ? styles.chipInfo : styles.chipAmber}`} style={{ marginRight: 8 }}>{b.status}</span>{b.summary}</span>
                  <span>{b.category} · {b.severity} · {fmtDate(b.created_at)}</span>
                </li>
              ))}
            </ul>
            <p className={styles.formStatus}><Link href="/admin?tab=bugs" className={styles.textLink}>Bug reports tab</Link></p>
          </>
        )}
      </section>

      {p.assigned_role !== "admin" && p.user_id !== user.id && (
        <section className={styles.panel}>
          <div className={styles.panelHead}><h2>Account actions</h2></div>
          <div className={styles.actions} style={{ marginTop: 0 }}>
            <form action={setBan}>
              <input type="hidden" name="userId" value={p.user_id} />
              <input type="hidden" name="banned" value={p.banned ? "false" : "true"} />
              <button type="submit" className={`${styles.button} ${styles.small} ${p.banned ? styles.okBtn : styles.danger}`}>{p.banned ? "Lift the ban" : "Ban this account"}</button>
            </form>
            {app && (
              <form action={setTester}>
                <input type="hidden" name="email" value={p.email} />
                <input type="hidden" name="tester" value={p.tester ? "false" : "true"} />
                <button type="submit" className={`${styles.button} ${styles.small}`}>{p.tester ? "Remove from the tester list" : "Add to the tester list"}</button>
              </form>
            )}
          </div>
        </section>
      )}
    </ConsoleShell>
  );
}
