"use client";

// Dev harness for the operator console and the public pages: the real
// shells and pages with fixture account details, so each can be looked
// at and screenshotted without a login or Supabase.
//
//   ?view=overview|shift|guide|updates                 a menu view (default overview)
//   ?page=record|library|releases|settings|briefing    another console page instead
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
import { TermsView } from "@/app/terms/terms-view";
import { PREALPHA_ACCESS, PREALPHA_ASKS, PREALPHA_FOCUS, PREALPHA_NOT_YET } from "@/lib/prealpha";
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

type ConsolePage = "record" | "library" | "releases" | "settings" | "briefing";
type PublicPage = "landing" | "login" | "signup" | "forgot" | "reset" | "terms" | "standby" | "invite" | "briefing-visitor" | "briefing-waiting";
const CONSOLE: Record<ConsolePage, { title: string; nav: NavKey }> = {
  record: { title: "Service record", nav: "record" },
  library: { title: "Reference library", nav: "library" },
  releases: { title: "Release notes", nav: "updates" },
  settings: { title: "Settings", nav: "settings" },
  briefing: { title: "Pre-Alpha briefing", nav: "briefing" },
};
const AUTH_LINKS: PublicLink[] = [{ href: "/prealpha", label: "Pre-Alpha briefing" }, { href: "/login", label: "Log in", button: true }];
const PUBLIC: Record<PublicPage, { brandLine: string; width: "narrow" | "page" | "wide"; links: PublicLink[]; chip?: string }> = {
  landing: { brandLine: "Incident management simulator", width: "wide", links: [{ href: "/prealpha", label: "Pre-Alpha briefing" }, { href: "/login", label: "Log in", button: true }, { href: "/signup?prealpha=1", label: "Create an account", primary: true }] },
  login: { brandLine: "Operator access", width: "narrow", links: [{ href: "/prealpha", label: "Pre-Alpha briefing" }, { href: "/signup?prealpha=1", label: "Create an account", primary: true }] },
  signup: { brandLine: "Operator registration", width: "narrow", links: AUTH_LINKS },
  forgot: { brandLine: "Operator access", width: "narrow", links: [{ href: "/login", label: "Log in", button: true }] },
  reset: { brandLine: "Operator access", width: "narrow", links: [{ href: "/login", label: "Log in", button: true }] },
  terms: { brandLine: "Terms and conditions", width: "page", links: [{ href: "/login", label: "Log in" }, { href: "/signup", label: "Create an account", button: true }] },
  standby: { brandLine: "Standing by", width: "page", chip: "Closed Pre-Alpha", links: [{ href: "/prealpha", label: "Pre-Alpha briefing" }, { href: "/settings", label: "Account settings", button: true }] },
  invite: { brandLine: "Closed Pre-Alpha", width: "narrow", chip: "Closed Pre-Alpha", links: AUTH_LINKS },
  "briefing-visitor": { brandLine: "Closed Pre-Alpha", width: "page", links: [{ href: "/login", label: "Log in" }, { href: "/signup?prealpha=1", label: "Create an account", primary: true }] },
  "briefing-waiting": { brandLine: "Closed Pre-Alpha", width: "page", links: [{ href: "/standby", label: "Your standing", button: true }] },
};
const isConsole = (v: string | null): v is ConsolePage => v !== null && v in CONSOLE;
const isPublic = (v: string | null): v is PublicPage => v !== null && v in PUBLIC;

const BRIEFING: BriefingData = {
  accepted: true, waiting: false, operator: true, invited: false, standing: "accepted", signedIn: true,
  signups: SIGNUPS, tableMissing: false, appliedOn: null,
  openJobs: SCENARIO_META.slice(0, 5).map((s) => ({ id: s.id, title: s.title, service: s.pda[0]?.service ?? "Fire" })),
  access: PREALPHA_ACCESS, focus: PREALPHA_FOCUS, asks: PREALPHA_ASKS, notYet: PREALPHA_NOT_YET,
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
  const user = { ...USER, isAdmin: opts.admin, viewAs: opts.admin ? ("admin" as const) : null };
  const { page } = opts;

  if (isPublic(page)) {
    const shell = PUBLIC[page];
    return (
      <PublicShell brandLine={shell.brandLine} width={shell.width} links={shell.links} chip={shell.chip}>
        {page === "landing" && <LandingView data={{ open: true, opensOn: "1 September", signups: SIGNUPS, facts, stations }} />}
        {page === "login" && <LoginView error={param("error") ?? undefined} />}
        {page === "signup" && <SignupView data={{ open: true, opensOn: "Tuesday 1 September", prealpha: true, advisor: param("advisor") === "1", signups: { open: true, closes: SIGNUPS.closes } }} />}
        {page === "forgot" && <ForgotView />}
        {page === "reset" && <ResetView email={param("expired") === "1" ? null : "operator@example.test"} />}
        {page === "terms" && <TermsView />}
        {page === "standby" && <StandbyView data={{ callsign: "OSCAR 21", advisor: (param("advisor") as "pending" | "accepted" | "none" | null) ?? "pending", listed: param("listed") === "1", doorsOpen: false, prealpha: { standing: param("listed") === "1" ? "accepted" : "none", tableMissing: false }, signups: SIGNUPS, insignia: "fire", programmeOpen: true, opensOn: "Tuesday 1 September" }} />}
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
        {page === "record" && <StatsView />}
        {page === "library" && <LibraryView stations={fleet} />}
        {page === "releases" && <ReleaseNotes />}
        {page === "settings" && <SettingsView />}
        {page === "briefing" && <PreAlphaBriefing data={BRIEFING} />}
      </ConsoleShell>
    );
  }
  return <WatchMenu key={opts.view} view={opts.view} userId="dev-user" {...user} discord={param("nodiscord") === "1" ? "" : user.discord} facts={facts} stations={stations} systems={{ routing: "own", routingHost: "osrm.thewtchroom.co.uk", mapData: "loaded", mapKinds: ["roads", "hydrants"], account: false, doorsOpen: true, released: 7 }} />;
}
