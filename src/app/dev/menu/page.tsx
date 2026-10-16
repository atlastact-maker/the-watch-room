"use client";

// Dev harness for the operator console: the real shell and pages with
// fixture account details, so each can be looked at and screenshotted
// without a login or Supabase.
//
//   ?view=overview|shift|guide|updates                a menu view (default overview)
//   ?page=record|library|releases|settings|briefing   another console page instead
//   ?admin=1                                           show the administrator items
//
// Only served when the server was started with TWR_DEV_HARNESS=1.

import { useEffect, useState } from "react";
import { ReleaseNotes } from "@/app/changelog/release-notes";
import type { StationWithAppliances } from "@/app/dashboard/page";
import { LibraryView } from "@/app/glossary/library-view";
import { ConsoleShell, type NavKey } from "@/app/menu/console-shell";
import { countyFacts, plateStations } from "@/app/menu/county-facts";
import type { MenuView } from "@/app/menu/menu-types";
import { WatchMenu } from "@/app/menu/watch-menu";
import { PreAlphaBriefing, type BriefingData } from "@/app/prealpha/briefing";
import { SettingsView } from "@/app/settings/settings-view";
import { StatsView } from "@/app/stats/stats-view";
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

type Page = "record" | "library" | "releases" | "settings" | "briefing";
const PAGES: Record<Page, { title: string; nav: NavKey }> = {
  record: { title: "Service record", nav: "record" },
  library: { title: "Reference library", nav: "library" },
  releases: { title: "Release notes", nav: "updates" },
  settings: { title: "Settings", nav: "settings" },
  briefing: { title: "Pre-alpha briefing", nav: "briefing" },
};
const isPage = (v: string | null): v is Page => v !== null && v in PAGES;

const BRIEFING: BriefingData = {
  accepted: true, waiting: false, operator: true, invited: false, standing: "accepted", signedIn: true,
  signups: { open: true, closed: false, closes: "", opens: "" }, tableMissing: false, appliedOn: null,
  openJobs: SCENARIO_META.slice(0, 5).map((s) => ({ id: s.id, title: s.title, service: s.pda[0]?.service ?? "Fire" })),
  access: PREALPHA_ACCESS, focus: PREALPHA_FOCUS, asks: PREALPHA_ASKS, notYet: PREALPHA_NOT_YET,
};

export default function MenuHarness() {
  const [opts, setOpts] = useState<{ view: MenuView; page: Page | null; admin: boolean } | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const v = param("view");
      const p = param("page");
      setOpts({ view: v === "shift" || v === "guide" || v === "updates" ? v : "overview", page: isPage(p) ? p : null, admin: param("admin") === "1" });
    }, 0);
    return () => clearTimeout(t);
  }, []);
  if (!opts) return null;
  const user = { ...USER, isAdmin: opts.admin, viewAs: opts.admin ? ("admin" as const) : null };
  if (!opts.page) return <WatchMenu key={opts.view} view={opts.view} userId="dev-user" {...user} facts={facts} stations={stations} />;
  const { title, nav } = PAGES[opts.page];
  return (
    <ConsoleShell {...user} active={nav} title={title}>
      {opts.page === "record" && <StatsView />}
      {opts.page === "library" && <LibraryView stations={fleet} />}
      {opts.page === "releases" && <ReleaseNotes />}
      {opts.page === "settings" && <SettingsView />}
      {opts.page === "briefing" && <PreAlphaBriefing data={BRIEFING} />}
    </ConsoleShell>
  );
}
