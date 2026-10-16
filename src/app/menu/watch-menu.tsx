"use client";

// The operator console: where an operator sits between shifts. A sidebar
// of the places to go, a topbar saying where they are, and one of four
// views: the operations overview, shift configuration, the operator
// guide, and release notes with the reporting form.

import Image from "next/image";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { logout } from "@/lib/auth/actions";
import { LATEST } from "@/lib/changelog";
import { setViewAs } from "@/app/actions/view-as";
import type { PlateStation } from "./county-plate";
import { GuideView } from "./guide-view";
import { Icon, type IconName } from "./icons";
import { COMMUNITY, TITLES, viewHref, type CountyFacts, type MenuView } from "./menu-types";
import { OverviewView } from "./overview-view";
import { ShiftView } from "./shift-view";
import { UpdatesView } from "./updates-view";
import { usePlayerRecord } from "./use-player-record";
import styles from "./watch-menu.module.css";

export type { MenuView } from "./menu-types";

type Props = {
  userId: string;
  callsign: string;
  email: string;
  discord: string;
  isAdmin: boolean;
  view: MenuView;
  viewAs: "admin" | "tester" | null;
  facts: CountyFacts;
  stations: PlateStation[];
};

function LogoutButton() {
  const { pending } = useFormStatus();
  return <button className={styles.logout} disabled={pending} type="submit">{pending ? "Signing out…" : "Log out"}</button>;
}

export function WatchMenu({ userId, callsign, email, discord, isAdmin, view, viewAs, facts, stations }: Props) {
  const record = usePlayerRecord();
  const item = (target: MenuView, icon: IconName, label?: string) => {
    const I = Icon[icon];
    return (
      <Link className={view === target ? styles.active : undefined} href={viewHref(target)} aria-current={view === target ? "page" : undefined} title={TITLES[target]}>
        <I /><span>{label ?? TITLES[target]}</span>
      </Link>
    );
  };
  const link = (href: string, icon: IconName, label: string, external = false) => {
    const I = Icon[icon];
    return external
      ? <a href={href} target="_blank" rel="noreferrer"><I /><span>{label}</span></a>
      : <Link href={href}><I /><span>{label}</span></Link>;
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/menu" className={styles.brand} aria-label="The Watch Room home">
          <Image src="/email-logo.png" width={42} height={32} alt="" />
          <span>The Watch Room<small>Operator console</small></span>
        </Link>
        <nav className={styles.nav} aria-label="Main navigation">
          <p>Operations</p>
          {item("overview", "home")}
          {item("shift", "shift", "Start shift")}
          {link("/stats", "record", "Service record")}
          {item("guide", "guide")}
          {link("/glossary", "library", "Reference library")}
          {link("/prealpha", "briefing", "Pre-alpha briefing")}
          <p>Programme</p>
          {link(COMMUNITY, "discord", "Tester channel", true)}
          {item("updates", "updates")}
          <p>Account</p>
          {isAdmin && link("/admin", "admin", "Administration")}
          {link("/settings", "settings", "Settings")}
        </nav>
        <div className={styles.account}>
          <Link href="/settings" title={email} className={styles.who}>
            <span className={styles.avatar} aria-hidden="true">{(callsign || email || "?").slice(0, 2).toUpperCase()}</span>
            <span><strong>{callsign || "Operator account"}</strong><small>{viewAs === "tester" ? "Administrator · viewing as tester" : isAdmin ? "Administrator" : "Operator"}</small></span>
          </Link>
          {viewAs && (
            <form action={setViewAs}>
              <input type="hidden" name="mode" value={viewAs === "tester" ? "admin" : "tester"} />
              <button className={styles.button} type="submit" title={viewAs === "tester" ? "Return to the administrator view" : "View the console and the desk as a tester"}>{viewAs === "tester" ? "Return to admin view" : "View as tester"}</button>
            </form>
          )}
          <form action={logout}><LogoutButton /></form>
          <p>Greater Manchester<br />Closed pre-alpha · Build {LATEST.version}</p>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.topbar}>
          <span>Operator console <i>/</i> <strong>{TITLES[view]}</strong></span>
          <span className={styles.topbarRight}><span className={styles.liveDot} aria-hidden="true" />Greater Manchester</span>
        </div>
        <div className={styles.content}>
          {view === "overview" && <OverviewView record={record} callsign={callsign} facts={facts} stations={stations} />}
          {view === "shift" && <ShiftView hasSave={!!record.save} ready={record.loaded && !record.unavailable} />}
          {view === "guide" && <GuideView />}
          {view === "updates" && <UpdatesView userId={userId} />}
          <footer className={styles.footer}>
            <span>The Watch Room · Emergency services incident management simulator · Not affiliated with any emergency service</span>
            <Link href="/settings" title={`${email}${discord ? ` · Discord: ${discord}` : ""}`}>Account settings</Link>
          </footer>
        </div>
      </main>
    </div>
  );
}
