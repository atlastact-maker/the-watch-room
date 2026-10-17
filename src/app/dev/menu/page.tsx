"use client";

// Dev harness for the operator console and the public pages: the real
// shells and pages with fixture account details, so each can be looked
// at and screenshotted without a login or Supabase.
//
//   ?view=overview|shift|guide|updates                 a menu view (default overview)
//   ?page=record|library|releases|settings|briefing    another console page instead
//   ?page=profile|colleagues                           the operator profile (&rel=none|colleague|requested|pending|self, &hidden=1) and the colleagues page
//   ?page=landing|login|signup|forgot|reset|terms|standby|invite   a public page
//   ?admin=1                                           show the administrator items
//
// Only served when the server was started with TWR_DEV_HARNESS=1.

import { useEffect, useState } from "react";
import { ReleaseNotes } from "@/app/changelog/release-notes";
import type { StationWithAppliances } from "@/app/dashboard/page";
import { ForgotView } from "@/app/forgot-password/forgot-view";
import { LibraryView } from "@/app/glossary/library-view";
import { LandingView } from "@/app/landing-view";
import { LoginView } from "@/app/login/login-view";
import { ConsoleShell, PublicShell, type NavKey, type PublicLink } from "@/app/menu/console-shell";
import { countyFacts, plateStations } from "@/app/menu/county-facts";
import type { MenuView } from "@/app/menu/menu-types";
import { WatchMenu } from "@/app/menu/watch-menu";
import { PreAlphaBriefing, type BriefingData } from "@/app/prealpha/briefing";
import { InviteView } from "@/app/prealpha/invite/[token]/invite-view";
import { ResetView } from "@/app/reset-password/reset-view";
import { SettingsView } from "@/app/settings/settings-view";
import { SignupView } from "@/app/signup/signup-view";
import { StandbyView } from "@/app/standby/standby-view";
import { StatsView } from "@/app/stats/stats-view";
import { ColleaguesView } from "@/app/colleagues/colleagues-view";
import { ProfileView } from "@/app/operators/[id]/profile-view";
import { evaluateHonours } from "@/lib/awards";
import type { ColleagueRow, OperatorHit, OperatorProfile } from "@/lib/operators";
import { TermsView } from "@/app/terms/terms-view";
import { PREALPHA_ACCESS_STEPS, PREALPHA_ASKS, PREALPHA_FOCUS, PREALPHA_KEY_DATES, PREALPHA_NOT_YET, PREALPHA_OPENING_SCENARIOS, PREALPHA_RELEASE_AT, PREALPHA_RELEASE_LABEL } from "@/lib/prealpha-programme";
import { STATIONS, getStationAppliances } from "@/lib/sim/data";
import { SCENARIO_META } from "@/lib/sim/scenarios/meta";

function param(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

const facts = countyFacts();
const stations = plateStations();
const fleet: StationWithAppliances[] = STATIONS.map((s) => ({ ...s, appliances: getStationAppliances(s.id) }));
const USER = { callsign: "M2 CONTROL", email: "dev@example.test", discord: "watchroom" };
const SIGNUPS = { open: true, closed: false, closes: "16 October", opens: "" };

type ConsolePage = "record" | "library" | "releases" | "settings" | "briefing" | "profile" | "colleagues";
type PublicPage = "landing" | "login" | "signup" | "forgot" | "reset" | "terms" | "standby" | "invite" | "briefing-visitor" | "briefing-waiting";
const CONSOLE: Record<ConsolePage, { title: string; nav: NavKey }> = {
  record: { title: "Service record", nav: "record" },
  library: { title: "Reference library", nav: "library" },
  releases: { title: "Release notes", nav: "updates" },
  settings: { title: "Settings", nav: "settings" },
  briefing: { title: "Pre-Alpha briefing", nav: "briefing" },
  profile: { title: "OSCAR 21", nav: "colleagues" },
  colleagues: { title: "Colleagues", nav: "colleagues" },
};

const NOW = Date.parse("2026-10-17T12:00:00Z");
const MOCK_PROFILE: OperatorProfile = {
  userId: "00000000-0000-4000-8000-000000000001", callsign: "OSCAR 21", joinedAt: "2026-09-02T09:00:00Z", role: "operator", insignia: "fire", advisor: false, tester: true,
  visibility: "open", relation: "none", visible: true,
  stats: {
    score: 212, calls_answered: 61, incidents_resolved: 54, grades: { A: 22, B: 18, C: 9, D: 4, F: 1 }, resources_allocated: 203, first_alloc_sum_sec: 2964, first_alloc_count: 54,
    targets_met: 141, targets_total: 162, casualties_saved: 31, casualties_lost: 3,
    by_type: { dwelling_fire_persons_reported: 14, rtc_entrapment: 9, cardiac_arrest: 8, automatic_fire_alarm: 7, pursuit: 5, vehicle_stop: 4, assault: 3, flooding: 2, missing_person: 2 }, updated_at: "2026-10-17T10:40:00Z",
  },
  rank: 3, players: 48, colleagues: 6,
  awards: [{ id: "a1", key: "commendation", citation: "For the Hough End arrest, worked as a crew would work it.", grantedAt: "2026-10-10T18:00:00Z" }],
  discord: null, lastActive: "2026-10-17T10:40:00Z",
  facts: { joinedAt: "2026-09-02T09:00:00Z", tester: true, advisor: false, bugReports: 6, incidentsResolved: 54, casualtiesSaved: 31, gradeA: 22, graded: 54, meanFirstAllocSec: 54.9, targetsMet: 141, targetsTotal: 162, distinctTypes: 9 },
};
const MOCK_COLLEAGUES: ColleagueRow[] = [
  { userId: "00000000-0000-4000-8000-000000000002", callsign: "BRAVO 4", relation: "pending", since: "2026-10-17T09:12:00Z", insignia: "police", role: null, score: 44, incidentsResolved: 12, lastActive: "2026-10-16T21:00:00Z" },
  { userId: "00000000-0000-4000-8000-000000000003", callsign: "NWAS 1", relation: "colleague", since: "2026-10-02T12:00:00Z", insignia: "ambulance", role: "advisor", score: 158, incidentsResolved: 40, lastActive: "2026-10-17T08:30:00Z" },
  { userId: "00000000-0000-4000-8000-000000000004", callsign: "M2 CONTROL", relation: "colleague", since: "2026-10-05T12:00:00Z", insignia: "control", role: "admin", score: 301, incidentsResolved: 77, lastActive: "2026-10-17T11:55:00Z" },
  { userId: "00000000-0000-4000-8000-000000000005", callsign: "ECHO 9", relation: "requested", since: "2026-10-15T12:00:00Z", insignia: null, role: null, score: 0, incidentsResolved: 0, lastActive: null },
];
const MOCK_FOUND: OperatorHit[] = [
  { userId: "00000000-0000-4000-8000-000000000006", callsign: "TANGO 7", relation: "none", insignia: null, role: null, tester: true, score: 25, incidentsResolved: 7, lastActive: "2026-10-17T11:00:00Z" },
  { userId: "00000000-0000-4000-8000-000000000003", callsign: "NWAS 1", relation: "colleague", insignia: "ambulance", role: "advisor", tester: true, score: 158, incidentsResolved: 40, lastActive: "2026-10-17T08:30:00Z" },
  { userId: "00000000-0000-4000-8000-000000000007", callsign: "KILO 2", relation: "none", insignia: "fire", role: null, tester: false, score: 12, incidentsResolved: 3, lastActive: "2026-10-16T19:00:00Z" },
];
const AUTH_LINKS: PublicLink[] = [{ href: "/prealpha", label: "Pre-Alpha briefing" }, { href: "/login", label: "Sign in", button: true }];
const PUBLIC: Record<PublicPage, { brandLine: string; width: "narrow" | "page" | "wide"; links: PublicLink[]; chip?: string }> = {
  landing: { brandLine: "Incident management simulator", width: "wide", links: [{ href: "/prealpha", label: "Pre-Alpha briefing" }, { href: "/login", label: "Sign in", button: true }, { href: "/signup?prealpha=1", label: "Create an account", primary: true }] },
  login: { brandLine: "Operator access", width: "narrow", links: [{ href: "/prealpha", label: "Pre-Alpha briefing" }, { href: "/signup?prealpha=1", label: "Create an account", primary: true }] },
  signup: { brandLine: "Operator registration", width: "narrow", links: AUTH_LINKS },
  forgot: { brandLine: "Operator access", width: "narrow", links: [{ href: "/login", label: "Sign in", button: true }] },
  reset: { brandLine: "Operator access", width: "narrow", links: [{ href: "/login", label: "Sign in", button: true }] },
  terms: { brandLine: "Terms and conditions", width: "page", links: [{ href: "/login", label: "Sign in" }, { href: "/signup", label: "Create an account", button: true }] },
  standby: { brandLine: "Standing by", width: "page", chip: "Closed Pre-Alpha", links: [{ href: "/prealpha", label: "Pre-Alpha briefing" }, { href: "/settings", label: "Account settings", button: true }] },
  invite: { brandLine: "Closed Pre-Alpha", width: "narrow", chip: "Closed Pre-Alpha", links: AUTH_LINKS },
  "briefing-visitor": { brandLine: "Closed Pre-Alpha", width: "page", links: [{ href: "/login", label: "Sign in" }, { href: "/signup?prealpha=1", label: "Create an account", primary: true }] },
  "briefing-waiting": { brandLine: "Closed Pre-Alpha", width: "page", links: [{ href: "/standby", label: "Your standing", button: true }] },
};
const isConsole = (v: string | null): v is ConsolePage => v !== null && v in CONSOLE;
const isPublic = (v: string | null): v is PublicPage => v !== null && v in PUBLIC;

const BRIEFING: BriefingData = {
  accepted: true, waiting: false, operator: true, invited: false, standing: "accepted", signedIn: true,
  signups: SIGNUPS, tableMissing: false, appliedOn: null,
  openJobs: SCENARIO_META.filter((s) => /Wythenshawe$|Hough End|wanted driver, Sale/.test(s.title)).map((s) => ({ id: s.id, title: s.title, service: s.pda[0]?.service ?? "Fire" })),
  keyDates: PREALPHA_KEY_DATES, accessSteps: PREALPHA_ACCESS_STEPS, opening: PREALPHA_OPENING_SCENARIOS, releaseLabel: PREALPHA_RELEASE_LABEL, releaseAt: PREALPHA_RELEASE_AT, now: Date.parse("2026-10-16T12:00:00Z"),
  focus: PREALPHA_FOCUS, asks: PREALPHA_ASKS, notYet: PREALPHA_NOT_YET,
};

export default function MenuHarness() {
  const [opts, setOpts] = useState<{ view: MenuView; page: string | null; admin: boolean } | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const v = param("view");
      setOpts({ view: v === "shift" || v === "guide" || v === "updates" ? v : "overview", page: param("page"), admin: param("admin") === "1" });
    }, 0);
    return () => clearTimeout(t);
  }, []);
  if (!opts) return null;
  const user = {
    ...USER, isAdmin: opts.admin, viewAs: opts.admin ? ("admin" as const) : null, pending: Number(param("pending") ?? 0) || 0,
    userId: MOCK_PROFILE.userId, unread: Number(param("unread") ?? 0) || 0,
    demoToast: param("toast") === "1" ? { id: "t1", kind: "colleague_request" as const, title: "BRAVO 4 asked to be your colleague", body: "Accept or decline on the Colleagues page.", href: "/colleagues", created_at: new Date(NOW).toISOString(), read_at: null } : null,
  };
  const { page } = opts;

  if (isPublic(page)) {
    const shell = PUBLIC[page];
    return (
      <PublicShell brandLine={shell.brandLine} width={shell.width} links={shell.links} chip={shell.chip}>
        {page === "landing" && <LandingView data={{ open: true, opensOn: "1 September", signups: SIGNUPS, facts, stations }} />}
        {page === "login" && <LoginView error={param("error") ?? undefined} discordEnabled={param("discord") === "1"} />}
        {page === "signup" && <SignupView data={{ open: true, opensOn: "Tuesday 1 September", prealpha: true, advisor: param("advisor") === "1", signups: { open: true, closes: SIGNUPS.closes }, discord: param("discord") !== "0" }} />}
        {page === "forgot" && <ForgotView />}
        {page === "reset" && <ResetView email={param("expired") === "1" ? null : "operator@example.test"} />}
        {page === "terms" && <TermsView />}
        {page === "standby" && <StandbyView data={{ callsign: "OSCAR 21", advisor: (param("advisor") as "pending" | "accepted" | "none" | null) ?? "pending", listed: param("listed") === "1" || param("viewas") === "1", doorsOpen: false, prealpha: { standing: param("listed") === "1" || param("viewas") === "1" ? "accepted" : "none", tableMissing: false }, signups: SIGNUPS, insignia: "fire", programmeOpen: true, opensOn: "Tuesday 1 September", testerView: param("viewas") === "1" }} />}
        {page === "invite" && <InviteView outcome={null} here="/prealpha/invite/00000000-0000-0000-0000-000000000000" />}
        {page === "briefing-visitor" && <PreAlphaBriefing data={{ ...BRIEFING, accepted: false, waiting: false, operator: false, standing: "none", signedIn: false, openJobs: [] }} />}
        {page === "briefing-waiting" && <PreAlphaBriefing data={{ ...BRIEFING, accepted: true, waiting: true, operator: false, invited: param("invited") === "1", standing: "accepted", signedIn: true }} />}
      </PublicShell>
    );
  }
  if (isConsole(page)) {
    const { title, nav } = CONSOLE[page];
    return (
      <ConsoleShell {...user} active={nav} title={title}>
        {page === "record" && <StatsView profile={param("rack") === "1" ? MOCK_PROFILE : null} userId={param("rack") === "1" ? MOCK_PROFILE.userId : undefined} />}
        {page === "profile" && <ProfileView profile={{ ...MOCK_PROFILE, relation: (param("rel") as OperatorProfile["relation"] | null) ?? "none", visible: param("hidden") !== "1", visibility: param("hidden") === "1" ? "colleagues" : "open" }} honours={evaluateHonours(MOCK_PROFILE.facts, MOCK_PROFILE.awards, NOW)} notice={param("notice") ?? undefined} />}
        {page === "colleagues" && <ColleaguesView rows={MOCK_COLLEAGUES} found={MOCK_FOUND} query={param("q") ?? ""} notice={param("notice") ?? undefined} />}
        {page === "library" && <LibraryView stations={fleet} />}
        {page === "releases" && <ReleaseNotes />}
        {page === "settings" && <SettingsView discordEnabled={param("discord") !== "0"} discordNotice={(["linked", "failed", "unlinked"].includes(param("notice") ?? "") ? param("notice") : undefined) as "linked" | "failed" | "unlinked" | undefined} discordReason={param("reason") ?? undefined} />}
        {page === "briefing" && <PreAlphaBriefing data={BRIEFING} />}
      </ConsoleShell>
    );
  }
  return <WatchMenu key={opts.view} view={opts.view} {...user} discord={param("nodiscord") === "1" ? "" : user.discord} facts={facts} stations={stations} systems={{ routing: "own", routingHost: "osrm.thewtchroom.co.uk", mapData: "loaded", mapKinds: ["roads", "hydrants"], account: false, doorsOpen: true, released: 7 }} />;
}
