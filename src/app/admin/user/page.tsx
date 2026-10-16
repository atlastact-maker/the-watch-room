import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasAdminAccess } from "@/lib/auth/operator-access";
import { ServiceBadge, serviceKeyFor } from "@/app/components/service-insignia";
import { labelForType } from "@/lib/sim/pda";
import type { IncidentTypeCode } from "@/lib/sim/incident_types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addAdminNote, decideTesterApplication, deleteAdminNote, setBan, setTester } from "../actions";

// One person, for the admin: the account and its standing, the advisor
// application and the pre-alpha request they filed, their service record
// with its place on the leaderboard, the notes on them and the bugs they
// reported. Reached from any name on the admin lists. Read in one call
// (migration 025); before that function exists the page composes the
// same picture from the older admin functions, short of last sign-in.

export const metadata = { title: "Profile — The Watch Room" };

type Grade = "A" | "B" | "C" | "D" | "F";
const GRADE_ORDER: Grade[] = ["A", "B", "C", "D", "F"];
const GRADE_TONE: Record<Grade, string> = {
  A: "bg-(--color-ok)",
  B: "bg-(--color-ok)/70",
  C: "bg-(--color-amber)",
  D: "bg-(--color-amber-dim)",
  F: "bg-(--color-critical)",
};

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

const btnCls = "rounded-sm border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors";
const inputCls = "rounded-sm border border-(--color-border) bg-(--color-bg) px-2 py-2 font-mono text-[12px] text-(--color-text) placeholder:text-(--color-text-dim) focus:border-(--color-amber) focus:outline-none";

function Chip({ children, tone = "dim", title }: { children: React.ReactNode; tone?: "ok" | "amber" | "info" | "critical" | "dim"; title?: string }) {
  const cls =
    tone === "ok" ? "border-(--color-ok)/60 bg-(--color-ok)/10 text-(--color-ok)"
      : tone === "amber" ? "border-(--color-amber)/60 bg-(--color-amber)/10 text-(--color-amber)"
        : tone === "info" ? "border-(--color-info)/60 bg-(--color-info)/10 text-(--color-info)"
          : tone === "critical" ? "border-(--color-critical)/60 bg-(--color-critical)/10 text-(--color-critical)"
            : "border-(--color-border) text-(--color-text-dim)";
  return <span title={title} className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${cls}`}>{children}</span>;
}

function Tile({ n, label, sub }: { n: string; label: string; sub?: string }) {
  return (
    <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface)/50 px-3 py-2.5">
      <div className="text-xl font-semibold tabular-nums text-(--color-text)">{n}</div>
      <div className="text-[10px] uppercase tracking-widest text-(--color-text-dim)">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-(--color-text-muted)">{sub}</div>}
    </div>
  );
}

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[12px] uppercase tracking-[0.25em] text-(--color-text)">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Fact({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-[12px]">
      <span className="w-28 shrink-0 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">{k}</span>
      <span className="min-w-0 text-(--color-text-muted)">{v}</span>
    </div>
  );
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

  const { profile: p, missing025 } = await loadProfile(supabase, id, email);

  if (!p) {
    return (
      <div className="relative z-10 min-h-[100dvh] px-4 py-6 font-mono sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <Link href="/admin?tab=users" className="text-[11px] uppercase tracking-widest text-(--color-text-dim) hover:text-(--color-amber)">← Admin</Link>
          <p className="border border-(--color-border-subtle) px-4 py-6 text-center text-[12px] text-(--color-text-dim)">
            No account found for {email ?? id}.{missing025 ? " Run supabase/migrations/025_admin_user_profile.sql so profiles can be opened by account id alone." : ""}
          </p>
        </div>
      </div>
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
  const appTone = app?.status === "accepted" ? "ok" : app?.status === "declined" ? "critical" : "amber";

  return (
    <div className="relative z-10 min-h-[100dvh] px-4 py-6 font-mono sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="space-y-3 border-b border-(--color-border-subtle) pb-4">
          <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-widest text-(--color-text-dim)">
            <Link href="/admin?tab=users" className="hover:text-(--color-amber)">← Admin</Link>
            <span className="text-(--color-border)">/</span>
            <span>Profile</span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-xl font-semibold tracking-wide text-(--color-text)">{p.callsign ? p.callsign.toUpperCase() : "(no callsign)"}</h1>
                <span className="break-all text-[12px] text-(--color-text-dim)">{p.email}</span>
                {p.discord && <span className="text-[12px] text-(--color-info)">@{p.discord}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {p.banned && <Chip tone="critical">Banned</Chip>}
                {p.assigned_role && <Chip tone="ok" title={p.role_note || undefined}>{p.assigned_role}{p.role_icon ? ` · ${p.role_icon}` : ""}</Chip>}
                {advisorStanding === "applicant" && <Chip tone="info" title="Has filed the advisor questionnaire — awaiting review">Advisor applicant</Chip>}
                {advisorStanding === "declined" && <Chip title="Advisor application declined">Advisor · declined</Chip>}
                {p.tester && <Chip tone="amber">Tester</Chip>}
                {app && !p.tester && <Chip tone={appTone}>Pre-alpha · {app.status}</Chip>}
                {p.newsletter && <Chip title="Newsletter opt-in">✉ newsletter</Chip>}
              </div>
            </div>
            {insignia && (
              <div className="shrink-0">
                <ServiceBadge service={insignia} role={advisorStanding === "accepted" ? "ADVISOR" : "APPLICANT"} />
              </div>
            )}
          </div>
          <div className="grid gap-1 sm:grid-cols-2">
            <Fact k="Account" v={<>created {fmtDate(p.created_at)}{p.created_at ? ` · ${ago(p.created_at)}` : ""}</>} />
            <Fact k="Last sign-in" v={missing025 ? <span className="text-(--color-text-dim)">needs migration 025</span> : <>{fmtWhen(p.last_sign_in_at)}{p.last_sign_in_at ? ` · ${ago(p.last_sign_in_at)}` : ""}</>} />
            <Fact k="Email" v={missing025 ? <span className="text-(--color-text-dim)">confirmation needs migration 025</span> : p.email_confirmed_at ? `confirmed ${fmtDate(p.email_confirmed_at)}` : <span className="text-(--color-amber)">not confirmed</span>} />
            <Fact k="Last played" v={s ? <>{fmtWhen(s.updated_at)} · {ago(s.updated_at)}</> : <span className="text-(--color-text-dim)">never taken a shift</span>} />
          </div>
          {missing025 && (
            <p className="rounded-sm border border-(--color-amber)/60 bg-(--color-amber)/10 px-3 py-2 text-[11px] text-(--color-amber)">
              Run supabase/migrations/025_admin_user_profile.sql once in the Supabase SQL editor for last sign-in and email confirmation. Everything else on this page is live.
            </p>
          )}
        </div>

        {/* Service record */}
        <Section
          title="Service record"
          right={s ? <span className="text-[11px] uppercase tracking-widest text-(--color-text-dim)">{p.rank ? `#${p.rank} of ${p.players} on the leaderboard` : ""}</span> : undefined}
        >
          {!s ? (
            <p className="border border-(--color-border-subtle) px-4 py-6 text-center text-[12px] text-(--color-text-dim)">
              No service record yet — the row appears after their first shift syncs.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Tile n={String(s.score)} label="Command points" sub={gradedTotal ? `${gradedTotal} graded incidents` : undefined} />
                <Tile n={String(s.calls_answered)} label="Calls answered" />
                <Tile n={String(s.incidents_resolved)} label="Incidents resolved" />
                <Tile n={String(s.resources_allocated)} label="Units mobilised" />
                <Tile n={fmtDuration(avgFirstAlloc)} label="Call to first mobilisation" sub={s.first_alloc_count ? `over ${s.first_alloc_count} incidents` : undefined} />
                <Tile n={targetPct === null ? "—" : `${targetPct}%`} label="Dispatch targets met" sub={s.targets_total ? `${s.targets_met} of ${s.targets_total}` : undefined} />
                <Tile n={String(s.casualties_saved)} label="Casualties to hospital" />
                <Tile n={String(s.casualties_lost)} label="Casualties lost" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface)/40 p-3">
                  <div className="mb-2 text-[10px] uppercase tracking-widest text-(--color-text-dim)">Dispatch grades</div>
                  <div className="space-y-1.5">
                    {GRADE_ORDER.map((g) => (
                      <div key={g} className="flex items-center gap-2 text-[11px]">
                        <span className="w-4 font-semibold text-(--color-text)">{g}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-sm bg-(--color-bg)">
                          <div className={`h-full ${GRADE_TONE[g]}`} style={{ width: `${Math.round((grades[g] / gradeMax) * 100)}%` }} />
                        </div>
                        <span className="w-8 text-right tabular-nums text-(--color-text-muted)">{grades[g]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface)/40 p-3">
                  <div className="mb-2 text-[10px] uppercase tracking-widest text-(--color-text-dim)">Busiest incident types</div>
                  {busiest.length === 0 ? (
                    <p className="text-[11px] text-(--color-text-dim)">Nothing answered yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {busiest.map(([code, n]) => (
                        <div key={code} className="flex items-center gap-2 text-[11px]">
                          <span className="w-40 truncate text-(--color-text)" title={code}>{typeLabel(code)}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-sm bg-(--color-bg)">
                            <div className="h-full bg-(--color-info)" style={{ width: `${Math.round((n / busiestMax) * 100)}%` }} />
                          </div>
                          <span className="w-8 text-right tabular-nums text-(--color-text-muted)">{n}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </Section>

        {/* Pre-alpha */}
        <Section title="Pre-alpha" right={<span className="text-[11px] uppercase tracking-widest text-(--color-text-dim)">{p.tester ? "on the tester list" : "not a tester"}</span>}>
          <div className="rounded-sm border border-(--color-border) bg-(--color-surface)/60 p-4">
            {app ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone={appTone}>{app.status}</Chip>
                    <span className="text-[11px] text-(--color-text-dim)">
                      Requested {fmtDate(app.created_at)}{app.decided_at ? ` · decided ${fmtDate(app.decided_at)}` : ""}
                      {[app.hours, app.platform].filter(Boolean).length > 0 ? ` · ${[app.hours, app.platform].filter(Boolean).join(" · ")}` : ""}
                    </span>
                  </div>
                  {app.background && <Fact k="Background" v={app.background} />}
                  {app.why && <Fact k="Why" v={app.why} />}
                  {app.note && <Fact k="Note" v={<span className="text-(--color-amber)">{app.note}</span>} />}
                </div>
                <form action={decideTesterApplication} className="flex shrink-0 flex-col gap-2 sm:w-56">
                  <input type="hidden" name="userId" value={p.user_id} />
                  <input type="hidden" name="email" value={p.email} />
                  <input name="note" placeholder="Note (optional)" defaultValue={app.note} className={`${inputCls} w-full`} />
                  <div className="flex flex-wrap gap-2">
                    {app.status !== "accepted" && <button type="submit" name="status" value="accepted" className={`${btnCls} border-(--color-ok)/60 text-(--color-ok) hover:bg-(--color-ok)/10`}>Accept</button>}
                    {app.status !== "declined" && <button type="submit" name="status" value="declined" className={`${btnCls} border-(--color-critical)/60 text-(--color-critical) hover:bg-(--color-critical)/10`}>Decline</button>}
                    {app.status !== "pending" && <button type="submit" name="status" value="pending" className={btnCls}>Back to waiting</button>}
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] text-(--color-text-dim)">No pre-alpha request filed.</p>
                {p.assigned_role !== "admin" && (
                  <form action={setTester}>
                    <input type="hidden" name="email" value={p.email} />
                    <input type="hidden" name="tester" value={p.tester ? "false" : "true"} />
                    <button type="submit" className={`${btnCls} ${p.tester ? "border-(--color-amber)/60 text-(--color-amber) hover:bg-(--color-amber)/10" : "border-(--color-ok)/60 text-(--color-ok) hover:bg-(--color-ok)/10"}`}>
                      {p.tester ? "Remove from the tester list" : "Add to the tester list"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </Section>

        {/* Advisor */}
        <Section
          title="Advisor programme"
          right={adv ? <Link href="/admin" className="text-[11px] uppercase tracking-widest text-(--color-text-dim) hover:text-(--color-amber)">Applications tab →</Link> : undefined}
        >
          {!adv ? (
            <p className="border border-(--color-border-subtle) px-4 py-4 text-[12px] text-(--color-text-dim)">Has not filed the advisor questionnaire.</p>
          ) : (
            <div className="space-y-2 rounded-sm border border-(--color-border) bg-(--color-surface)/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                {advisorStanding === "accepted" ? <Chip tone="ok">Advisor</Chip> : advisorStanding === "declined" ? <Chip tone="critical">Declined</Chip> : <Chip tone="amber">Awaiting review</Chip>}
                <span className="text-[11px] uppercase tracking-widest text-(--color-text-dim)">
                  {adv.service}{adv.status ? ` · ${adv.status}` : ""}{adv.force_area ? ` · ${adv.force_area}` : ""}{adv.involvement ? ` · ${adv.involvement}` : ""} · applied {fmtDate(adv.created_at)}
                </span>
              </div>
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {topics.map((t) => <span key={t} className="rounded-sm border border-(--color-border) px-1.5 py-0.5 text-[10px] text-(--color-text-dim)">{t}</span>)}
                </div>
              )}
              {adv.background && <Fact k="Background" v={<span className="whitespace-pre-wrap">{adv.background}</span>} />}
              {adv.notes && <Fact k="Notes" v={<span className="whitespace-pre-wrap">{adv.notes}</span>} />}
              <Fact k="Contact" v={adv.contact_ok ? `happy to be contacted${adv.discord ? ` · @${adv.discord}` : ""}` : "asked not to be contacted"} />
            </div>
          )}
        </Section>

        {/* Notes */}
        <Section title="Admin notes" right={<span className="text-[11px] uppercase tracking-widest text-(--color-text-dim)">{p.notes.length}</span>}>
          <div className="space-y-2">
            {p.notes.map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-3 rounded-sm border border-(--color-border-subtle) bg-(--color-surface)/40 px-3 py-2 text-[12px]">
                <div className="min-w-0">
                  <p className="whitespace-pre-wrap text-(--color-text-muted)">{n.note}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-(--color-text-dim)">{n.author_email} · {fmtWhen(n.created_at)}</p>
                </div>
                <form action={deleteAdminNote}>
                  <input type="hidden" name="noteId" value={n.id} />
                  <button type="submit" className={`${btnCls} border-(--color-border) text-(--color-text-dim) hover:border-(--color-critical) hover:text-(--color-critical)`}>Remove</button>
                </form>
              </div>
            ))}
            <form action={addAdminNote} className="flex flex-col gap-2 sm:flex-row">
              <input type="hidden" name="userId" value={p.user_id} />
              <input name="note" required placeholder="Add a note about this person" className={`${inputCls} flex-1`} />
              <button type="submit" className={`${btnCls} border-(--color-amber)/60 text-(--color-amber) hover:bg-(--color-amber)/15`}>Add note</button>
            </form>
          </div>
        </Section>

        {/* Bug reports */}
        <Section title="Bug reports" right={<span className="text-[11px] uppercase tracking-widest text-(--color-text-dim)">{p.bugs.length}</span>}>
          {p.bugs.length === 0 ? (
            <p className="border border-(--color-border-subtle) px-4 py-4 text-[12px] text-(--color-text-dim)">None filed.</p>
          ) : (
            <div className="divide-y divide-(--color-border-subtle)/50 rounded-sm border border-(--color-border-subtle)">
              {p.bugs.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-[12px]">
                  <Chip tone={b.status === "fixed" || b.status === "closed" ? "ok" : b.status === "looking" ? "amber" : "critical"}>{b.status}</Chip>
                  <span className="text-(--color-text)">{b.summary}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-widest text-(--color-text-dim)">{b.category} · {b.severity} · {fmtDate(b.created_at)}</span>
                </div>
              ))}
              <div className="px-3 py-2 text-right">
                <Link href="/admin?tab=bugs" className="text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:text-(--color-amber)">Bugs tab →</Link>
              </div>
            </div>
          )}
        </Section>

        {/* Account actions */}
        {p.assigned_role !== "admin" && p.user_id !== user.id && (
          <Section title="Account">
            <div className="flex flex-wrap items-center gap-2">
              <form action={setBan}>
                <input type="hidden" name="userId" value={p.user_id} />
                <input type="hidden" name="banned" value={p.banned ? "false" : "true"} />
                <button type="submit" className={`${btnCls} ${p.banned ? "border-(--color-ok)/60 text-(--color-ok) hover:bg-(--color-ok)/10" : "border-(--color-critical)/60 text-(--color-critical) hover:bg-(--color-critical)/10"}`}>
                  {p.banned ? "Lift the ban" : "Ban this account"}
                </button>
              </form>
              {app && (
                <form action={setTester}>
                  <input type="hidden" name="email" value={p.email} />
                  <input type="hidden" name="tester" value={p.tester ? "false" : "true"} />
                  <button type="submit" className={btnCls}>{p.tester ? "Remove from the tester list" : "Add to the tester list"}</button>
                </form>
              )}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
