import Link from "next/link";
import { ConsoleShell } from "@/app/menu/console-shell";
import { consoleSession, consoleUser } from "@/app/menu/console-session";
import styles from "@/app/menu/watch-menu.module.css";
import { SCENARIOS } from "@/lib/sim/scenarios";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ownOsrmStatus } from "@/lib/map/osrm";
import { hasAdminAccess } from "@/lib/auth/operator-access";
import { ServiceBadge, serviceKeyFor } from "@/app/components/service-insignia";
import { CopyEmails } from "./copy-emails";
import { Notice } from "@/app/components/notice";
import { SERVICE_TINT, serviceName } from "@/app/menu/menu-types";
import {
  setRole,
  setTester,
  setBugReport,
  setScenarioReleased,
  deleteRole,
  setBan,
  deleteUser,
  setAdvisorDecline,
  addAdminNote,
  deleteAdminNote,
  setDiscordGranted,
  acceptAllPendingTesterApplications,
  decideTesterApplication,
  inviteTester,
  notifyTestersDoorsOpen,
  setPrealphaDoors, setPrealphaSignups,
} from "./actions";
import { type TesterApplication, prealphaClosed, prealphaClosesLabel, prealphaDoors, prealphaOpen, prealphaOpensLabel, prealphaSignupSwitch, prealphaSignups } from "@/lib/prealpha";

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

/** An advisor application in one piece of text: the facts on the first
 *  line, then what they wrote. Goes onto the record when they are
 *  accepted (see setRole). */
function applicationText(a: AdvisorRow): string {
  const topics = Array.isArray(a.topics) ? (a.topics as string[]).filter((t) => typeof t === "string" && t.trim()) : [];
  const facts = [a.service, a.status, a.force_area, a.involvement].map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
  const lines = [facts.join(" · ")];
  if (topics.length) lines.push(`Topics: ${topics.join(", ")}`);
  if (a.discord?.trim()) lines.push(`Discord: ${a.discord.trim()}`);
  if (a.background?.trim()) lines.push("", a.background.trim());
  if (a.notes?.trim()) lines.push("", a.notes.trim());
  return lines.join("\n").trim();
}

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
  /** On the closed Pre-Alpha tester list. Undefined until migration 016
   *  is run, which the control treats as false. */
  tester?: boolean;
};

type AdminTab = "applications" | "users" | "advisors" | "bugs" | "scenarios" | "prealpha";

type BugRow = {
  id: string;
  user_id: string;
  email: string;
  callsign: string;
  category: string;
  severity: string;
  summary: string;
  detail: string;
  context: Record<string, unknown> | null;
  status: string;
  admin_note: string;
  created_at: string;
  updated_at: string;
};

/** The person's page: their account, standing and service record. */
function profileHref(userId: string, email?: string): string {
  return `/admin/user?id=${encodeURIComponent(userId)}${email ? `&e=${encodeURIComponent(email)}` : ""}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ missing?: string | string[]; tab?: string | string[]; invited?: string | string[]; mail?: string | string[]; notified?: string | string[]; of?: string | string[]; q?: string | string[]; page?: string | string[] }>;
}) {
  // A write action that hit a missing database function sends us back
  // here with the migration number, so it can be reported the same way
  // a missing list function is.
  const { missing, tab: tabParam, invited: invitedParam, mail: mailParam, notified: notifiedParam, of: ofParam, q: qParam, page: pageParam } = await searchParams;
  // The Users tab: a search and a page (migration 023).
  const USERS_PAGE = 100;
  const userQuery = typeof qParam === "string" ? qParam.trim().slice(0, 80) : "";
  const userPage = Math.max(1, Number.parseInt(typeof pageParam === "string" ? pageParam : "1", 10) || 1);
  const missing015 = missing === "015";
  const missing016 = missing === "016";
  const missing017 = missing === "017";
  const missing018 = missing === "018";
  const missing020 = missing === "020";
  const missing021 = missing === "021";
  const missing022 = missing === "022";
  const missing023 = missing === "023";
  const notified = typeof notifiedParam === "string" ? `${notifiedParam} of ${typeof ofParam === "string" ? ofParam : "?"}` : null;
  const justInvited = typeof invitedParam === "string" ? invitedParam : null;
  const inviteMailFailed = mailParam === "0";
  // Which of the three lists is on screen. Applications first: it is the
  // one with decisions waiting in it.
  const tab: AdminTab =
    tabParam === "users" || tabParam === "advisors" || tabParam === "bugs" || tabParam === "scenarios" || tabParam === "prealpha"
      ? tabParam
      : "applications";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await hasAdminAccess(supabase, user.email))) redirect("/menu");
  const session = await consoleSession();

  const [advisorsRes, rolesRes, overviewRes, usersResNew, notesRes, bugsRes, releasedRes, mapRes, routing, testerAppsRes, invitesRes, countRes] = await Promise.all([
    supabase.rpc("admin_list_advisors"),
    supabase.rpc("admin_list_roles"),
    supabase.rpc("admin_overview"),
    // Every account, not the newest twenty-five: the advisors who signed up
    // first were dropping off the bottom. 200 is the function's ceiling.
    supabase.rpc("admin_list_users", { p_limit: USERS_PAGE, p_offset: (userPage - 1) * USERS_PAGE, p_query: userQuery || null }),
    supabase.rpc("admin_notes_all"),
    supabase.rpc("admin_list_bug_reports", { p_limit: 200 }),
    supabase.from("released_scenarios").select("scenario_id, note"),
    // Map data (migration 019): what tools/osm-import has loaded, so the
    // Scenarios tab can say whether the desk is on its own roads yet.
    supabase.rpc("osm_map_status"),
    ownOsrmStatus(),
    supabase.rpc("admin_list_tester_applications", { p_limit: 5000 }),
    supabase.rpc("admin_list_tester_invites", { p_limit: 5000 }),
    supabase.rpc("admin_count_users", { p_query: userQuery || null }),
  ]);
  const doors = await prealphaDoors(supabase);
  // Sign-ups: the switch, and what the calendar says underneath it.
  const signupSwitch = (await prealphaSignupSwitch(supabase)).value;
  const signups = await prealphaSignups(supabase);
  const calendar = { open: prealphaOpen(), closed: prealphaClosed(), closes: prealphaClosesLabel(), opens: prealphaOpensLabel() };
  // Before migration 023 the users function has the old one-argument
  // shape; fall back to it so the tab keeps working, capped as before.
  const usersMissing023 = usersResNew.error?.message?.includes("admin_list_users") === true;
  const usersRes = usersMissing023 ? await supabase.rpc("admin_list_users", { p_limit: 200 }) : usersResNew;
  const users = (usersRes.data ?? []) as UserRow[];
  const usersTotal = usersMissing023 ? users.length : Number(countRes.data ?? users.length);
  const usersPages = Math.max(1, Math.ceil(usersTotal / USERS_PAGE));
  // Invitations (migration 021), newest first; one per email is enough
  // for the Users tab, and the first seen is the newest.
  const missingInvites = invitesRes.error?.message?.includes("admin_list_tester_invites") === true;
  const inviteByEmail = new Map<string, { created_at: string; accepted_at: string | null; expires_at: string }>();
  for (const i of (invitesRes.data ?? []) as { email: string; created_at: string; accepted_at: string | null; expires_at: string }[]) {
    const key = i.email.toLowerCase();
    if (!inviteByEmail.has(key)) inviteByEmail.set(key, i);
  }
  const missingTesterApps = testerAppsRes.error?.message?.includes("admin_list_tester_applications") === true;
  const testerApps = (testerAppsRes.data ?? []) as (TesterApplication & { tester: boolean })[];
  const pendingTesterApps = testerApps.filter((a) => a.status === "pending").length;
  const mapStatus = (mapRes.data ?? []) as { kind: string; row_count: number; source: string; imported_at: string }[];
  const missingMap = mapRes.error?.message?.includes("osm_map_status") === true;
  const missingReleased = releasedRes.error?.message?.includes("released_scenarios") === true;
  const released = new Set(((releasedRes.data ?? []) as { scenario_id: string }[]).map((r) => r.scenario_id));
  // Reports are the newest table; before migration 017 the function is
  // missing, which is a banner on its tab rather than an error page.
  const missingBugs = bugsRes.error?.message?.includes("admin_list_bug_reports") === true;
  const bugs = (bugsRes.data ?? []) as BugRow[];
  const openBugs = bugs.filter((b) => b.status === "open" || b.status === "looking").length;

  const firstError =
    advisorsRes.error ?? rolesRes.error ?? overviewRes.error ?? usersRes.error ?? notesRes.error;
  const missing007 = advisorsRes.error?.message?.includes("admin_list_advisors");
  const missing008 = overviewRes.error?.message?.includes("admin_overview");

  const advisors = (advisorsRes.data ?? []) as AdvisorRow[];
  const roles = (rolesRes.data ?? []) as RoleRow[];
  // Rows without the column at all mean PostgREST is still serving the
  // pre-015 shape of admin_list_roles from its schema cache. The ticks
  // then cannot display however the database rows read.
  const rolesLackTick =
    roles.length > 0 && roles.every((r) => r.discord_granted === undefined);
  const overview = ((overviewRes.data ?? []) as Overview[])[0];
  // Same test for the tester tick: rows without the column mean the API
  // is still serving the pre-016 shape of admin_list_users.
  const usersLackTester =
    users.length > 0 && users.every((u) => u.tester === undefined);
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
  // Advisors on the programme (granted advisor, or promoted to operator)
  // with no Discord handle on record: the closed advisor room cannot be
  // given to them until there is one, so they are chased from here.
  const noDiscord = advisors.filter(
    (a) => (a.assigned_role === "advisor" || a.assigned_role === "operator") && !a.discord?.trim(),
  );
  const noDiscordEmails = noDiscord.map((a) => a.email);
  // Advisors by account, for the mark on the Pre-Alpha list: someone who
  // has filed the advisor questionnaire is who the programme wants in
  // first, so they are flagged and sorted to the top of the waiting.
  const advisorByUser = new Map(advisors.map((a) => [a.user_id, a]));
  const advisorByEmail = new Map(advisors.map((a) => [a.email.toLowerCase(), a]));
  const advisorOf = (a: { user_id: string; email: string }) => advisorByUser.get(a.user_id) ?? advisorByEmail.get(a.email.toLowerCase());
  const advisorStanding = (adv: AdvisorRow | undefined): "accepted" | "declined" | "applicant" | null =>
    !adv ? null : adv.assigned_role === "advisor" || adv.assigned_role === "admin" ? "accepted" : adv.declined_at ? "declined" : "applicant";
  const sortedTesterApps = [...testerApps].sort((x, y) => {
    const pendX = x.status === "pending" ? 1 : 0, pendY = y.status === "pending" ? 1 : 0;
    if (pendX !== pendY) return pendY - pendX;
    const advX = advisorStanding(advisorOf(x)) && advisorStanding(advisorOf(x)) !== "declined" ? 1 : 0;
    const advY = advisorStanding(advisorOf(y)) && advisorStanding(advisorOf(y)) !== "declined" ? 1 : 0;
    if (advX !== advY) return advY - advX;
    return Date.parse(y.created_at) - Date.parse(x.created_at);
  });
  const advisorsWaiting = testerApps.filter((a) => a.status === "pending" && advisorStanding(advisorOf(a)) && advisorStanding(advisorOf(a)) !== "declined").length;

  // One sentence on what the database is missing, or null when it is all
  // there. The write actions report the same way through ?missing=.
  const dbProblem =
    missing016 || usersLackTester
      ? "Migration 016 (tester tick) has not reached the app. Run supabase/migrations/016_testers.sql in the Supabase SQL editor, then reload. If it has been run, run  notify pgrst, 'reload schema';  and reload this page."
      : missing015
        ? "Migration 015 (Discord permission tick) has not been run. Run supabase/migrations/015_roles_discord_granted.sql in the SQL editor, then reload."
        : rolesLackTick
          ? "The Discord tick column is not reaching the app: the API is still serving the old shape of admin_list_roles. In the Supabase SQL editor run  notify pgrst, 'reload schema';  then reload this page."
          : missing007
            ? "Migration 007 (admin functions) has not been run. Run supabase/migrations/007_admin_functions.sql in the SQL editor, then reload."
            : missing008
              ? "Migration 008 (admin overview) has not been run. Run supabase/migrations/008_admin_overview.sql in the SQL editor, then reload."
              : missing011
                ? "Migration 011 (admin notes) has not been run. Run supabase/migrations/011_admin_notes.sql in the SQL editor, then reload."
                : firstError
                  ? `Database error: ${firstError.message ?? "unknown"}`
                  : null;

  return (
    <ConsoleShell {...consoleUser(session)} active="admin" title="Administration">
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Administration · programme and accounts</p>
          <h1 className={styles.pageTitle}>Administration</h1>
          <p className={styles.lede}>Pre-Alpha access, advisor applications, access roles, released scenarios, bug reports and accounts.</p>
        </div>
        <div className={styles.headMeta}>
          <span className={`${styles.chip} ${doors.open ? styles.chipOk : styles.chipAmber}`}>Doors {doors.open ? "open" : "closed"}</span>
          <span className={`${styles.chip} ${signups.open ? styles.chipOk : ""}`}>Sign-ups {signups.open ? "open" : "closed"}</span>
        </div>
      </header>

      {dbProblem && (
        <Notice tone="critical" title="Database">
          <p>{dbProblem}</p>
        </Notice>
      )}

      {overview && (
        <section aria-labelledby="admin-overview">
          <div className={styles.blockHead}>
            <h2 id="admin-overview">Overview</h2>
            <span className={styles.chip}>{overview.applications_pending + pendingTesterApps + openBugs} items awaiting action</span>
          </div>
          <div className={styles.stats}>
            <div><strong>{overview.total_accounts.toLocaleString("en-GB")}</strong><span>Accounts</span></div>
            <div><strong>{overview.new_accounts_7d.toLocaleString("en-GB")}</strong><span>New · 7 days</span></div>
            <div className={overview.applications_pending > 0 ? styles.hot : undefined}><strong>{overview.applications_pending.toLocaleString("en-GB")}</strong><span>Applications pending</span></div>
            <div><strong>{overview.advisors_accepted.toLocaleString("en-GB")}</strong><span>Advisors</span></div>
            <div><strong>{overview.operators_granted.toLocaleString("en-GB")}</strong><span>Operators</span></div>
            <div><strong>{overview.newsletter_opt_ins.toLocaleString("en-GB")}</strong><span>Newsletter</span></div>
            <div><strong>{overview.calls_answered.toLocaleString("en-GB")}</strong><span>Calls handled</span></div>
            <div><strong>{overview.incidents_resolved.toLocaleString("en-GB")}</strong><span>Incidents resolved</span></div>
          </div>
        </section>
      )}

      {/* One list at a time, so nothing needs scrolling for. */}
      <nav className={`${styles.tabs} ${styles.section}`} aria-label="Administration sections">
        <TabLink tab="applications" current={tab} label="Advisor applications" count={pending.length} hot={pending.length > 0} />
        <TabLink tab="prealpha" current={tab} label="Pre-Alpha" count={pendingTesterApps} hot={pendingTesterApps > 0} />
        <TabLink tab="bugs" current={tab} label="Bug reports" count={openBugs} hot={openBugs > 0} />
        <TabLink tab="users" current={tab} label="Accounts" count={usersTotal} />
        <TabLink tab="advisors" current={tab} label="Access roles" count={roles.length} />
        <TabLink tab="scenarios" current={tab} label="Scenarios" count={released.size} />
      </nav>

      {/* Advisor applications */}
      {tab === "applications" && (
        <section className={styles.section} aria-labelledby="tab-applications">
          <div className={styles.blockHead}>
            <h2 id="tab-applications">Advisor applications</h2>
            <span className={styles.chip}>{pending.length} awaiting review · {advisors.length} filed</span>
          </div>
          <div className={styles.stack}>
            {noDiscord.length > 0 && (
              <div className={styles.panel}>
                <div className={styles.panelHead}>
                  <h2>Discord handle outstanding</h2>
                  <span className={`${styles.chip} ${styles.chipInfo}`}>{noDiscord.length} advisor{noDiscord.length === 1 ? "" : "s"}</span>
                </div>
                <p className={styles.panelText}>Advisors on the programme with no handle on record. The closed advisor channel cannot be granted until there is one. The addresses below are ready for a BCC field.</p>
                <div className={styles.actions}>
                  <CopyEmails emails={noDiscordEmails} className={`${styles.button} ${styles.small}`} />
                  <a
                    href={`mailto:?bcc=${encodeURIComponent(noDiscordEmails.join(","))}&subject=${encodeURIComponent("The Watch Room advisor programme: your Discord handle")}`}
                    className={`${styles.button} ${styles.small}`}
                  >
                    Email all
                  </a>
                </div>
                <div className={`${styles.rows} ${styles.subPanel}`}>
                  {noDiscord.map((a) => (
                    <div key={a.user_id} className={styles.row}>
                      <span className={styles.rowText}>
                        <Link href={profileHref(a.user_id, a.email)} className={styles.textLink}>{a.callsign || "No callsign"}</Link>
                        {" "}
                        <span className={styles.email}>{a.email}</span>
                      </span>
                      <em>{a.assigned_role}</em>
                    </div>
                  ))}
                </div>
                <p className={styles.pre} style={{ userSelect: "all" }}>{noDiscordEmails.join(", ")}</p>
              </div>
            )}

            {advisors.length === 0 ? (
              <Notice title="No applications filed">
                <p>Applications are filed when an account ticks the advisor box at sign-up.</p>
              </Notice>
            ) : (
              <div className={styles.cards}>
                {advisors.map((a) => {
                  const insignia = serviceKeyFor(a.service);
                  const topics = Array.isArray(a.topics) ? (a.topics as string[]) : [];
                  return (
                    <article key={a.user_id} className={styles.card}>
                      <div>
                        <div className={styles.cardHead}>
                          <Link href={profileHref(a.user_id, a.email)} title="Open their profile and service record"><strong>{a.callsign || "No callsign"}</strong></Link>
                          <span className={styles.email}>{a.email}</span>
                          {a.assigned_role ? (
                            <span className={`${styles.chip} ${styles.chipOk}`}>{a.assigned_role}</span>
                          ) : a.declined_at ? (
                            <span className={`${styles.chip} ${styles.chipStop}`}>Declined</span>
                          ) : (
                            <span className={`${styles.chip} ${styles.chipAmber}`}>Awaiting review</span>
                          )}
                        </div>
                        <p className={styles.cardMeta}>
                          {a.service}
                          {a.status ? ` · ${a.status}` : ""}
                          {a.force_area ? ` · ${a.force_area}` : ""}
                          {" · applied "}
                          {fmtDate(a.applied_at)}
                        </p>
                        {topics.length > 0 && (
                          <div className={styles.tags}>
                            {topics.map((t) => <span key={t}>{t}</span>)}
                          </div>
                        )}
                        {a.background && <p className={styles.cardBody}>{a.background}</p>}
                        {a.notes && <p className={styles.cardBody}>{a.notes}</p>}
                        <p className={styles.cardMeta}>
                          {a.discord?.trim() ? `Discord ${a.discord.trim()}` : "No Discord handle"}
                          {" · "}
                          {a.involvement ? `${a.involvement} · ` : ""}
                          contact {a.contact_ok ? "permitted" : "not permitted"}
                        </p>
                      </div>
                      <div className={styles.cardActions}>
                        {insignia && <div className={styles.legacy}><ServiceBadge service={insignia} role={a.assigned_role ? a.assigned_role.toUpperCase() : "APPLICANT"} /></div>}
                        <div className={styles.actions}>
                          {a.assigned_role === null && (
                            <form action={setRole}>
                              <input type="hidden" name="email" value={a.email} />
                              <input type="hidden" name="role" value="advisor" />
                              <input type="hidden" name="userId" value={a.user_id} />
                              <input type="hidden" name="application" value={applicationText(a)} />
                              {/* The service they said they served in becomes
                                  the insignia on the role, so an accepted
                                  advisor wears it everywhere at once. */}
                              <input type="hidden" name="icon" value={serviceKeyFor(a.service) ?? ""} />
                              <button type="submit" className={`${styles.button} ${styles.small} ${styles.okBtn}`}>Accept as advisor</button>
                            </form>
                          )}
                          {a.assigned_role === null && !a.declined_at && (
                            <form action={setAdvisorDecline}>
                              <input type="hidden" name="userId" value={a.user_id} />
                              <input type="hidden" name="email" value={a.email} />
                              <input type="hidden" name="declined" value="true" />
                              <button type="submit" className={`${styles.button} ${styles.small} ${styles.danger}`}>Decline</button>
                            </form>
                          )}
                          {a.assigned_role === null && a.declined_at && (
                            <form action={setAdvisorDecline}>
                              <input type="hidden" name="userId" value={a.user_id} />
                              <input type="hidden" name="declined" value="false" />
                              <button type="submit" className={`${styles.button} ${styles.small}`}>Reinstate application</button>
                            </form>
                          )}
                          {a.assigned_role === "advisor" && (
                            <form action={setRole}>
                              <input type="hidden" name="email" value={a.email} />
                              <input type="hidden" name="role" value="operator" />
                              <button type="submit" className={`${styles.primary} ${styles.small}`}>Promote to operator</button>
                            </form>
                          )}
                          {a.assigned_role !== null && a.assigned_role !== "admin" && (
                            <form action={deleteRole}>
                              <input type="hidden" name="email" value={a.email} />
                              <button type="submit" className={`${styles.button} ${styles.small} ${styles.danger}`}>Revoke</button>
                            </form>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Scenarios released to testers, with the map and routing status. */}
      {tab === "scenarios" && (
        <section className={styles.section} aria-labelledby="tab-scenarios">
          <div className={styles.blockHead}>
            <h2 id="tab-scenarios">Scenarios released to testers</h2>
            <span className={styles.chip}>{released.size} of {SCENARIOS.length} released · admins see all</span>
          </div>
          <div className={styles.stack}>
            {(missing018 || missingReleased) && (
              <Notice tone="critical" title="Migration 018 (scenario release) has not reached the app">
                <p>Run supabase/migrations/018_released_scenarios.sql in the Supabase SQL editor, then reload. Until it has, testers receive no calls.</p>
              </Notice>
            )}
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <h2>Map data and routing</h2>
                <span className={`${styles.chip} ${routing.configured && routing.reachable ? styles.chipOk : routing.configured ? styles.chipStop : ""}`}>
                  {routing.configured ? (routing.reachable ? "Own routing online" : "Own routing not answering") : "Public routing"}
                </span>
              </div>
              <div className={styles.facts2} style={{ marginTop: 0 }}>
                {missingMap ? (
                  <div className={styles.factRow}><span>Map data</span><span>Migration 019 (map data) has not been run; the desk is asking the public Overpass mirrors for roads and hydrants on every job. Run supabase/migrations/019_osm_map_data.sql in the SQL editor, then load the tables with tools/osm-import.</span></div>
                ) : mapStatus.length === 0 ? (
                  <div className={styles.factRow}><span>Map data</span><span>Tables ready, nothing loaded yet. Run tools/osm-import (npm run import) to load Greater Manchester&apos;s roads and hydrants. Until then the desk falls back to the public Overpass mirrors.</span></div>
                ) : (
                  mapStatus.map((m) => (
                    <div key={m.kind} className={styles.factRow}>
                      <span>{m.kind}</span>
                      <span>{m.row_count.toLocaleString("en-GB")} rows · loaded {new Date(m.imported_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {m.source}</span>
                    </div>
                  ))
                )}
                <div className={styles.factRow}>
                  <span>Routing</span>
                  <span>
                    {routing.configured
                      ? `Own OSRM at ${routing.host} · ${routing.reachable ? "reachable" : "not answering; ETAs are falling back to OpenRouteService and the public demo server"}`
                      : "No OSRM_URL set. ETAs come from OpenRouteService and the public OSRM demo server, which are quota-limited. See tools/osrm/README.md."}
                  </span>
                </div>
              </div>
            </div>
            {(["Fire", "Ambulance", "Police"] as const).map((service) => {
              const rows = SCENARIOS.filter((sc) => (sc.pda[0]?.service ?? "Fire") === service);
              const open = rows.filter((sc) => released.has(sc.id)).length;
              return (
                <div key={service} className={styles.panel}>
                  <div className={styles.panelHead}>
                    <h2><span className={styles.swatch} style={{ background: SERVICE_TINT[service] }} aria-hidden="true" />{serviceName(service)}</h2>
                    <span className={`${styles.chip} ${open > 0 ? styles.chipOk : ""}`}>{open} of {rows.length} released</span>
                  </div>
                  <div className={styles.rows}>
                    {rows.map((sc) => {
                      const on = released.has(sc.id);
                      return (
                        <form key={sc.id} action={setScenarioReleased} className={styles.row}>
                          <input type="hidden" name="scenarioId" value={sc.id} />
                          <input type="hidden" name="released" value={on ? "false" : "true"} />
                          <button
                            type="submit"
                            role="checkbox"
                            aria-checked={on}
                            aria-label={`${sc.title} released to testers`}
                            title={on ? "Released to testers. Select to withdraw." : "Withheld. Select to release to testers."}
                            className={`${styles.tick} ${on ? styles.tickOn : ""}`}
                          >
                            ✓
                          </button>
                          <code>#{sc.id}</code>
                          <span className={`${styles.rowText} ${on ? "" : styles.off}`}>{sc.title}</span>
                          <em>{sc.severity}</em>
                        </form>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Pre-Alpha: the doors, the sign-up switch and the requests. */}
      {tab === "prealpha" && (
        <section className={styles.section} aria-labelledby="tab-prealpha">
          <div className={styles.blockHead}>
            <h2 id="tab-prealpha">Pre-Alpha access</h2>
            <span className={styles.chip}>
              {pendingTesterApps} awaiting decision{advisorsWaiting > 0 ? ` (${advisorsWaiting} advisor${advisorsWaiting === 1 ? "" : "s"})` : ""} · {testerApps.filter((a) => a.status === "accepted").length} accepted · {testerApps.length} filed
            </span>
          </div>
          <div className={styles.stack}>
            <div className={styles.twoUp}>
              {/* The doors. Closed: everyone on the list is told they are
                  in and waits. Open: the desk. */}
              <div className={`${styles.panel} ${doors.open ? styles.panelOk : styles.panelAmber}`}>
                <div className={styles.panelHead}>
                  <h2>Doors</h2>
                  <span className={`${styles.chip} ${doors.open ? styles.chipOk : styles.chipAmber}`}>{doors.open ? "Open" : "Closed"}</span>
                </div>
                <p className={styles.panelText}>
                  {doors.tableMissing
                    ? "Migration 022 (site settings) has not been run, so the doors cannot be closed: every tester can open the desk. Run supabase/migrations/022_site_settings.sql, which starts them closed."
                    : doors.open
                      ? "Every account on the tester list can open the operator console and take a shift."
                      : "Sign-ups, requests, accepts and invitations all work and testers see they are in, but nobody on the list can open the desk until the doors are opened. Admins and operators are not held."}
                </p>
                {!doors.tableMissing && (
                  <div className={styles.actions}>
                    <form action={setPrealphaDoors}>
                      <input type="hidden" name="doors" value={doors.open ? "closed" : "open"} />
                      <button type="submit" className={`${styles.button} ${styles.small} ${doors.open ? "" : styles.okBtn}`}>{doors.open ? "Close the doors" : "Open the doors"}</button>
                    </form>
                    {doors.open && (
                      <form action={notifyTestersDoorsOpen}>
                        <button type="submit" className={`${styles.button} ${styles.small}`} title="One email to every account on the tester list">Email testers: doors open</button>
                      </form>
                    )}
                  </div>
                )}
                {notified && <p className={styles.formStatus} style={{ color: "var(--ok)" }}>Doors-open notice sent to {notified} testers.</p>}
              </div>

              {/* Sign-ups. Closed: the tick at sign-up and the request
                  button are greyed out and nothing new is filed. The
                  calendar still runs underneath; the switch overrides it. */}
              <div className={`${styles.panel} ${signups.open ? styles.panelOk : ""}`}>
                <div className={styles.panelHead}>
                  <h2>Sign-ups</h2>
                  <span className={`${styles.chip} ${signups.open ? styles.chipOk : ""}`}>{signups.open ? "Open" : "Closed"}</span>
                </div>
                <p className={styles.cardMeta} style={{ marginTop: 0 }}>
                  {signupSwitch === "calendar"
                    ? calendar.open
                      ? `By the calendar${calendar.closes ? ` · closes ${calendar.closes}` : ""}`
                      : calendar.closed
                        ? `By the calendar${calendar.closes ? ` · closed ${calendar.closes}` : ""}`
                        : `By the calendar · opens ${calendar.opens}`
                    : `Set by hand${calendar.closed ? " · the calendar has them closed" : calendar.open ? " · the calendar has them open" : ""}`}
                </p>
                <p className={styles.panelText}>
                  {signups.open
                    ? "Anyone can create an account with Join the Pre-Alpha ticked, or press Request Pre-Alpha access from their standby page."
                    : "The Pre-Alpha tick at sign-up and the request button on standby are off. Accounts can still be created and invited by hand."}
                </p>
                <div className={styles.actions}>
                  {signups.open ? (
                    <form action={setPrealphaSignups}>
                      <input type="hidden" name="signups" value="closed" />
                      <button type="submit" className={`${styles.button} ${styles.small}`}>Close sign-ups</button>
                    </form>
                  ) : (
                    <form action={setPrealphaSignups}>
                      <input type="hidden" name="signups" value="open" />
                      <button type="submit" className={`${styles.button} ${styles.small} ${styles.okBtn}`}>Reopen sign-ups</button>
                    </form>
                  )}
                  {signupSwitch !== "calendar" && (
                    <form action={setPrealphaSignups}>
                      <input type="hidden" name="signups" value="calendar" />
                      <button type="submit" className={`${styles.button} ${styles.small}`}>Follow the calendar</button>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {missing022 && (
              <Notice tone="critical" title="Migration 022 (site settings) has not reached the app">
                <p>Run supabase/migrations/022_site_settings.sql in the Supabase SQL editor, then reload.</p>
              </Notice>
            )}
            {(missing020 || missingTesterApps) && (
              <Notice tone="critical" title="Migration 020 (Pre-Alpha applications) has not reached the app">
                <p>Run supabase/migrations/020_prealpha_applications.sql in the Supabase SQL editor, then reload. If it has been run, run <code>notify pgrst, &apos;reload schema&apos;;</code> and reload this page.</p>
              </Notice>
            )}

            <div className={styles.blockHead}>
              <h2>Access requests</h2>
              {pendingTesterApps > 0 && (
                <form action={acceptAllPendingTesterApplications}>
                  <button type="submit" className={`${styles.button} ${styles.small} ${styles.okBtn}`}>Accept all {pendingTesterApps} awaiting decision</button>
                </form>
              )}
            </div>
            {testerApps.length === 0 && !missingTesterApps ? (
              <Notice title="No requests filed">
                <p>Requests are filed when an account ticks Join the Pre-Alpha at sign-up, or presses Request Pre-Alpha access from its standby page.</p>
              </Notice>
            ) : (
              <div className={styles.cards}>
                {sortedTesterApps.map((a) => {
                  const adv = advisorOf(a);
                  const standing = advisorStanding(adv);
                  const flagged = standing !== null && standing !== "declined";
                  return (
                    <article key={a.user_id} className={`${styles.card} ${flagged ? styles.cardFlag : ""}`}>
                      <div>
                        <div className={styles.cardHead}>
                          <Link href={profileHref(a.user_id, a.email)} title="Open their profile and service record"><strong>{a.callsign || "No callsign"}</strong></Link>
                          <span className={styles.email}>{a.email}</span>
                          {a.discord && <span className={`${styles.chip} ${styles.chipInfo}`}>@{a.discord}</span>}
                          <span className={`${styles.chip} ${a.status === "accepted" ? styles.chipOk : a.status === "declined" ? styles.chipStop : styles.chipAmber}`}>
                            {a.status}{a.tester ? " · tester" : ""}
                          </span>
                          {adv && standing && (
                            <span
                              className={`${styles.chip} ${standing === "accepted" ? styles.chipOk : standing === "applicant" ? styles.chipInfo : ""}`}
                              title={standing === "accepted" ? "Holds the advisor role" : standing === "applicant" ? "Has filed the advisor questionnaire; awaiting review under Advisor applications" : "Advisor application declined"}
                            >
                              {standing === "accepted" ? "Advisor" : standing === "applicant" ? "Advisor applicant" : "Advisor · declined"}
                              {adv.service ? ` · ${adv.service}` : ""}
                              {adv.status ? ` · ${adv.status}` : ""}
                            </span>
                          )}
                        </div>
                        <p className={styles.cardMeta}>
                          Requested {fmtDate(a.created_at)}{a.decided_at ? ` · decided ${fmtDate(a.decided_at)}` : ""}
                          {[a.hours, a.platform].filter(Boolean).length > 0 ? ` · ${[a.hours, a.platform].filter(Boolean).join(" · ")}` : ""}
                        </p>
                        {a.background && <p className={styles.cardBody}><b>Background</b> · {a.background}</p>}
                        {a.why && <p className={styles.cardBody}><b>Why</b> · {a.why}</p>}
                        {a.note && <p className={styles.cardBody} style={{ color: "var(--amber)" }}><b>Note</b> · {a.note}</p>}
                      </div>
                      <form action={decideTesterApplication} className={styles.cardForm}>
                        <input type="hidden" name="userId" value={a.user_id} />
                        <input type="hidden" name="email" value={a.email} />
                        <input name="note" placeholder="Decision note (optional)" defaultValue={a.note} className={styles.input} aria-label="Decision note" />
                        <div className={styles.actions}>
                          {a.status !== "accepted" && <button type="submit" name="status" value="accepted" className={`${styles.button} ${styles.small} ${styles.okBtn}`}>Accept</button>}
                          {a.status !== "declined" && <button type="submit" name="status" value="declined" className={`${styles.button} ${styles.small} ${styles.danger}`}>Decline</button>}
                          {a.status !== "pending" && <button type="submit" name="status" value="pending" className={`${styles.button} ${styles.small}`}>Back to pending</button>}
                        </div>
                      </form>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bug reports, with triage. */}
      {tab === "bugs" && (
        <section className={styles.section} aria-labelledby="tab-bugs">
          <div className={styles.blockHead}>
            <h2 id="tab-bugs">Bug reports</h2>
            <span className={styles.chip}>{openBugs} open · {bugs.length} filed</span>
          </div>
          <div className={styles.stack}>
            {(missing017 || missingBugs) && (
              <Notice tone="critical" title="Migration 017 (bug reports) has not reached the app">
                <p>Run supabase/migrations/017_bug_reports.sql in the Supabase SQL editor, then reload. If it has been run, run <code>notify pgrst, &apos;reload schema&apos;;</code> and reload this page.</p>
              </Notice>
            )}
            {!missingBugs && bugs.length === 0 && (
              <Notice title="Nothing filed">
                <p>Testers file from Help, Report a problem on the desk, or from Release notes and feedback on the operator console.</p>
              </Notice>
            )}
            {bugs.length > 0 && (
              <div className={styles.cards}>
                {bugs.map((b) => {
                  const ctx = (b.context ?? {}) as Record<string, unknown>;
                  const logTail = Array.isArray(ctx.logTail) ? (ctx.logTail as unknown[]).filter((l): l is string => typeof l === "string") : [];
                  const known = [
                    ["scenario", ctx.scenario],
                    ["incident", ctx.incidentRef],
                    ["screen", ctx.screen],
                    ["page", ctx.page],
                    ["version", ctx.version],
                    ["viewport", ctx.viewport],
                  ].filter((row): row is [string, string] => typeof row[1] === "string" && row[1].length > 0);
                  const sevChip = b.severity === "blocker" ? styles.chipStop : b.severity === "major" ? styles.chipAmber : "";
                  const statusChip = b.status === "open" ? styles.chipAmber : b.status === "looking" ? styles.chipInfo : b.status === "fixed" ? styles.chipOk : "";
                  return (
                    <article key={b.id} className={styles.card}>
                      <div>
                        <div className={styles.cardHead}>
                          <span className={`${styles.chip} ${sevChip}`}>{b.severity}</span>
                          <strong>{b.summary}</strong>
                          <span className={styles.chip}>{b.category}</span>
                          <span className={`${styles.chip} ${statusChip}`}>{b.status}</span>
                        </div>
                        <p className={styles.cardMeta}>
                          {b.callsign ? `${b.callsign} · ` : ""}
                          <Link href={profileHref(b.user_id, b.email)} className={styles.textLink}>{b.email}</Link>
                          {" · filed "}{fmtDate(b.created_at)}
                        </p>
                        <p className={styles.pre}>{b.detail}</p>
                        {known.length > 0 && (
                          <div className={styles.tags}>
                            {known.map(([k, v]) => <span key={k}>{k} · {v}</span>)}
                          </div>
                        )}
                        {typeof ctx.userAgent === "string" && (
                          <p className={`${styles.hint} ${styles.clip}`} title={ctx.userAgent}>{ctx.userAgent}</p>
                        )}
                        {logTail.length > 0 && (
                          <details className={styles.details}>
                            <summary className={styles.summaryPlain}>Log tail · {logTail.length} lines</summary>
                            <pre className={styles.log}>{logTail.join("\n")}</pre>
                          </details>
                        )}
                      </div>
                      <form action={setBugReport} className={styles.cardForm}>
                        <input type="hidden" name="id" value={b.id} />
                        <select name="status" defaultValue={b.status} className={styles.input} aria-label="Status">
                          <option value="open">Open</option>
                          <option value="looking">Looking into it</option>
                          <option value="fixed">Fixed</option>
                          <option value="closed">Closed</option>
                        </select>
                        <input name="note" defaultValue={b.admin_note} placeholder="Triage note" className={styles.input} aria-label="Triage note" />
                        <div className={styles.actions}>
                          <button type="submit" className={`${styles.button} ${styles.small} ${styles.okBtn}`}>Save</button>
                        </div>
                      </form>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Access roles: everyone who has been granted something, with the
          Discord tick. */}
      {tab === "advisors" && (
        <section className={styles.section} aria-labelledby="tab-advisors">
          <div className={styles.blockHead}>
            <h2 id="tab-advisors">Access roles</h2>
            <span className={styles.chip}>{roles.length} granted</span>
          </div>
          <div className={styles.stack}>
            <div className={styles.panel}>
              <div className={styles.panelHead}><h2>Grant a role</h2></div>
              <form action={setRole} className={styles.grantForm}>
                <input name="email" type="email" required placeholder="email@example.com" className={styles.input} aria-label="Email" />
                <select name="role" className={styles.input} defaultValue="operator" aria-label="Role">
                  <option value="operator">Operator</option>
                  <option value="advisor">Advisor</option>
                  <option value="admin">Admin</option>
                </select>
                <select name="icon" className={styles.input} defaultValue="" aria-label="Insignia">
                  <option value="">Insignia: from application</option>
                  <option value="fire">Fire</option>
                  <option value="ambulance">Ambulance</option>
                  <option value="police">Police</option>
                  <option value="control">Control</option>
                  <option value="specialist">Specialist</option>
                </select>
                <input name="note" placeholder="Note (who is this?)" className={styles.input} aria-label="Note" />
                <button type="submit" className={`${styles.primary} ${styles.small}`}>Grant</button>
              </form>
            </div>

            {roles.length > 0 && (
              <div className={styles.panel}>
                <div className={styles.panelHead}>
                  <h2>Granted</h2>
                  <span className={styles.chip}>{roles.filter((r) => r.discord_granted).length} of {roles.length} on Discord</span>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Insignia</th>
                        <th>Discord</th>
                        <th>Note</th>
                        <th>Since</th>
                        <th><span className={styles.srOnly}>Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((r) => (
                        <tr key={r.email}>
                          <td>{r.email}</td>
                          <td><span className={`${styles.chip} ${styles.chipAmber}`}>{r.role}</span></td>
                          <td>{r.icon ?? "—"}</td>
                          <td>
                            <span className={styles.tickRow}>
                              <form action={setDiscordGranted}>
                                <input type="hidden" name="email" value={r.email} />
                                <input type="hidden" name="granted" value={r.discord_granted ? "false" : "true"} />
                                <button
                                  type="submit"
                                  role="checkbox"
                                  aria-checked={!!r.discord_granted}
                                  aria-label="Discord permission granted"
                                  title={r.discord_granted ? "Discord permission granted. Select to clear." : "Discord permission not yet granted. Select to tick."}
                                  className={`${styles.tick} ${r.discord_granted ? styles.tickOn : ""}`}
                                >
                                  ✓
                                </button>
                              </form>
                              <span>{r.discord || "—"}</span>
                            </span>
                          </td>
                          <td>{r.note || "—"}</td>
                          <td>{fmtDate(r.created_at)}</td>
                          <td>
                            {r.role !== "admin" && (
                              <form action={deleteRole}>
                                <input type="hidden" name="email" value={r.email} />
                                <button type="submit" className={`${styles.button} ${styles.small} ${styles.danger}`}>Revoke</button>
                              </form>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Accounts: search, standing, the tester tick and invitations. */}
      {tab === "users" && (
        <section className={styles.section} aria-labelledby="tab-users">
          <div className={styles.blockHead}>
            <h2 id="tab-users">Accounts</h2>
            <span className={styles.chip}>
              {usersMissing023
                ? `${users.length}${users.length >= 200 ? " · newest 200 shown" : ""}`
                : userQuery
                  ? `${usersTotal} matching · page ${userPage} of ${usersPages}`
                  : `${usersTotal} · page ${userPage} of ${usersPages}`}
            </span>
          </div>
          <form method="get" action="/admin" className={styles.toolbar} role="search">
            <input type="hidden" name="tab" value="users" />
            <label className={styles.search}>
              <span>Search</span>
              <input name="q" defaultValue={userQuery} placeholder="Email, callsign or Discord handle" />
            </label>
            <div className={styles.actions}>
              <button type="submit" className={`${styles.button} ${styles.small}`}>Search</button>
              {userQuery && <Link href="/admin?tab=users" className={`${styles.button} ${styles.small}`}>Clear</Link>}
            </div>
          </form>
          <div className={styles.stack}>
            {(usersMissing023 || missing023) && (
              <Notice tone="amber" title="Migration 023 (admin lists) has not been run">
                <p>Run supabase/migrations/023_admin_lists_uncapped.sql in the Supabase SQL editor, then reload. Until then this tab shows the newest 200 accounts and search is off.</p>
              </Notice>
            )}
            {(missing021 || missingInvites) && (
              <Notice tone="amber" title="Migration 021 (Pre-Alpha invitations) has not reached the app">
                <p>Run supabase/migrations/021_tester_invites.sql in the Supabase SQL editor, then reload. Until then Invite will not work; the Tester tick still does.</p>
              </Notice>
            )}
            {justInvited && (
              <Notice tone={inviteMailFailed ? "critical" : "ok"} title={inviteMailFailed ? "Invitation recorded, email not sent" : "Invitation sent"}>
                <p>
                  {inviteMailFailed
                    ? `The invitation for ${justInvited} is on record, but the email did not send (is RESEND_API_KEY set?). Press Invite again once it is.`
                    : `${justInvited} has been emailed a link. The desk opens to them when they follow it.`}
                </p>
              </Notice>
            )}
            {users.length === 0 && <Notice title={userQuery ? "No accounts match" : "No accounts yet"} />}
            {users.length > 0 && (
              <div className={styles.cards}>
                {users.map((u) => {
                  const invite = inviteByEmail.get(u.email.toLowerCase());
                  return (
                    <article key={u.user_id} className={`${styles.card} ${styles.cardSolo}`}>
                      <div>
                        <div className={styles.cardHead}>
                          <Link href={profileHref(u.user_id, u.email)} title="Open their profile and service record"><strong>{u.callsign ? u.callsign.toUpperCase() : "No callsign"}</strong></Link>
                          <span className={styles.email}>{u.email}</span>
                          {u.discord && <span className={`${styles.chip} ${styles.chipInfo}`} title="Discord handle, from their advisor application">@{u.discord}</span>}
                          {u.banned && <span className={`${styles.chip} ${styles.chipStop}`}>Banned</span>}
                          {u.is_advisor_applicant && <span className={`${styles.chip} ${styles.chipInfo}`}>Advisor applicant</span>}
                          {u.assigned_role && <span className={`${styles.chip} ${styles.chipOk}`}>{u.assigned_role}</span>}
                          {u.tester && <span className={`${styles.chip} ${styles.chipAmber}`}>Tester</span>}
                          {!u.tester && invite && <span className={styles.chip} title={`Invited ${fmtDate(invite.created_at)}`}>Invited</span>}
                          {u.newsletter && <span className={styles.chip} title="Newsletter opt-in">Newsletter</span>}
                          <span className={styles.email}>registered {fmtDate(u.created_at)}</span>
                        </div>
                        {u.assigned_role !== "admin" && (
                          <div className={styles.cardTools}>
                            {/* The Pre-Alpha list: one tick, and they can open
                                the desk without holding a role. */}
                            <form action={setTester} className={styles.tickLabel}>
                              <input type="hidden" name="email" value={u.email} />
                              <input type="hidden" name="tester" value={u.tester ? "false" : "true"} />
                              <button
                                type="submit"
                                role="checkbox"
                                aria-checked={!!u.tester}
                                aria-label="Pre-Alpha tester"
                                title={u.tester ? "On the tester list. Select to remove." : "Not a tester. Select to add to the Pre-Alpha."}
                                className={`${styles.tick} ${styles.tickAmber} ${u.tester ? styles.tickOn : ""}`}
                              >
                                ✓
                              </button>
                              Tester
                            </form>
                            {/* The invitation: an email with a link, and the
                                link is the grant. Re-sends the same link while
                                it is still open. */}
                            {!u.tester && (
                              <form action={inviteTester}>
                                <input type="hidden" name="email" value={u.email} />
                                <button
                                  type="submit"
                                  className={`${styles.button} ${styles.small}`}
                                  title={invite ? "Send the invitation again" : "Email them a link that opens the Pre-Alpha to this account"}
                                >
                                  {invite ? "Re-send invitation" : "Invite to Pre-Alpha"}
                                </button>
                              </form>
                            )}
                            {!u.assigned_role && (
                              <form action={setRole} className={styles.tickRow}>
                                <input type="hidden" name="email" value={u.email} />
                                <select name="role" className={`${styles.input} ${styles.inputSm}`} defaultValue="operator" aria-label="Role to grant">
                                  <option value="operator">Operator</option>
                                  <option value="advisor">Advisor</option>
                                </select>
                                <button type="submit" className={`${styles.button} ${styles.small} ${styles.okBtn}`}>Grant</button>
                              </form>
                            )}
                            <form action={setBan}>
                              <input type="hidden" name="userId" value={u.user_id} />
                              <input type="hidden" name="banned" value={u.banned ? "false" : "true"} />
                              <button type="submit" className={`${styles.button} ${styles.small} ${u.banned ? styles.okBtn : ""}`}>{u.banned ? "Lift ban" : "Ban"}</button>
                            </form>
                            {/* Two-step delete with no client JS: the summary
                                opens, the real button confirms. */}
                            <details className={styles.details}>
                              <summary className={`${styles.button} ${styles.small} ${styles.danger}`}>Delete</summary>
                              <form action={deleteUser} className={styles.confirm}>
                                <input type="hidden" name="userId" value={u.user_id} />
                                <button type="submit" className={`${styles.button} ${styles.small} ${styles.danger}`}>Confirm permanent delete</button>
                              </form>
                            </details>
                            <AdminNotes userId={u.user_id} notes={notesByUser.get(u.user_id) ?? []} />
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            {!usersMissing023 && usersPages > 1 && (
              <nav className={styles.pager} aria-label="Pages of accounts">
                {userPage > 1 ? <Link href={`/admin?tab=users&page=${userPage - 1}${userQuery ? `&q=${encodeURIComponent(userQuery)}` : ""}`} className={`${styles.button} ${styles.small}`}>Newer</Link> : <span />}
                <span>Page {userPage} of {usersPages}</span>
                {userPage < usersPages ? <Link href={`/admin?tab=users&page=${userPage + 1}${userQuery ? `&q=${encodeURIComponent(userQuery)}` : ""}`} className={`${styles.button} ${styles.small}`}>Older</Link> : <span />}
              </nav>
            )}
          </div>
        </section>
      )}
    </ConsoleShell>
  );
}

/** One tab on the administration page, with its count. `hot` marks a
 *  count that is work waiting. */
function TabLink({ tab, current, label, count, hot }: { tab: AdminTab; current: AdminTab; label: string; count: number; hot?: boolean }) {
  const active = tab === current;
  return (
    <Link href={tab === "applications" ? "/admin" : `/admin?tab=${tab}`} aria-current={active ? "page" : undefined} className={hot ? styles.hot : undefined}>
      {label} <em>{count.toLocaleString("en-GB")}</em>
    </Link>
  );
}

/**
 * Notes on one account. Collapsed by default: a list of accounts is for
 * scanning, and notes are for when you have stopped scanning, but the
 * summary carries the count so the accounts with history show at a
 * glance. No client JS: a <details> for the disclosure, server actions
 * for the writes, same as the rest of this page.
 */
function AdminNotes({ userId, notes }: { userId: string; notes: NoteRow[] }) {
  return (
    <details className={`${styles.details} ${styles.fullWidth}`}>
      <summary className={`${styles.button} ${styles.small}`}>Notes{notes.length > 0 ? ` · ${notes.length}` : ""}</summary>
      <div className={styles.subPanel}>
        <p className={styles.cardMeta} style={{ marginTop: 0 }}>Admin only · never shown to the account holder</p>
        {notes.length > 0 && (
          <div className={styles.rows}>
            {notes.map((n) => (
              <div key={n.id} className={styles.row}>
                <span className={styles.rowText}>{n.note}</span>
                <code className={styles.rowEnd}>{n.author_email} · {fmtDate(n.created_at)}</code>
                <form action={deleteAdminNote}>
                  <input type="hidden" name="noteId" value={n.id} />
                  <button type="submit" className={`${styles.button} ${styles.small} ${styles.danger}`} title="Delete this note">Delete</button>
                </form>
              </div>
            ))}
          </div>
        )}
        <form action={addAdminNote} className={styles.inlineForm}>
          <input type="hidden" name="userId" value={userId} />
          <input name="note" required maxLength={1000} placeholder="Add a note: why accepted, background, anything worth keeping" className={styles.input} aria-label="Note" />
          <button type="submit" className={`${styles.button} ${styles.small} ${styles.okBtn}`}>Add note</button>
        </form>
      </div>
    </details>
  );
}
