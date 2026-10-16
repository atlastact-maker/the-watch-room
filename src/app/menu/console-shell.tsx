"use client";

// The frame every page of the operator console sits in: the sidebar of
// places to go, the topbar saying where you are, the account card and
// the footer. Pages render their content as children; the menu's four
// views are one such page, the service record and the reference
// library are others.

import Image from "next/image";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { logout } from "@/lib/auth/actions";
import { LATEST } from "@/lib/changelog";
import { setViewAs } from "@/app/actions/view-as";
import { Icon, type IconName } from "./icons";
import { COMMUNITY, TITLES, viewHref, type MenuView } from "./menu-types";
import styles from "./watch-menu.module.css";

/** Where in the console a page sits: one of the menu's views, or one of
 *  the pages the sidebar links to. Decides which nav item is lit. */
export type NavKey = MenuView | "record" | "library" | "briefing" | "admin" | "settings";

/** The signed-in operator as the frame shows them. */
export type ConsoleUser = {
  callsign: string;
  email: string;
  discord: string;
  isAdmin: boolean;
  viewAs: "admin" | "tester" | null;
};

function LogoutButton() {
  const { pending } = useFormStatus();
  return <button className={styles.logout} disabled={pending} type="submit">{pending ? "Signing out…" : "Log out"}</button>;
}

export function ConsoleShell({ callsign, email, discord, isAdmin, viewAs, active, title, children }: ConsoleUser & { active: NavKey; title: string; children: React.ReactNode }) {
  const nav = (key: NavKey, href: string, icon: IconName, label: string) => {
    const I = Icon[icon];
    const current = active === key;
    return <Link className={current ? styles.active : undefined} href={href} aria-current={current ? "page" : undefined}><I /><span>{label}</span></Link>;
  };
  const ext = (href: string, icon: IconName, label: string) => {
    const I = Icon[icon];
    return <a href={href} target="_blank" rel="noreferrer"><I /><span>{label}</span></a>;
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
          {nav("overview", viewHref("overview"), "home", TITLES.overview)}
          {nav("shift", viewHref("shift"), "shift", "Start shift")}
          {nav("record", "/stats", "record", "Service record")}
          {nav("guide", viewHref("guide"), "guide", TITLES.guide)}
          {nav("library", "/glossary", "library", "Reference library")}
          {nav("briefing", "/prealpha", "briefing", "Pre-alpha briefing")}
          <p>Programme</p>
          {ext(COMMUNITY, "discord", "Tester channel")}
          {nav("updates", viewHref("updates"), "updates", TITLES.updates)}
          <p>Account</p>
          {isAdmin && nav("admin", "/admin", "admin", "Administration")}
          {nav("settings", "/settings", "settings", "Settings")}
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
          <span>Operator console <i>/</i> <strong>{title}</strong></span>
          <span className={styles.topbarRight}><span className={styles.liveDot} aria-hidden="true" />Greater Manchester</span>
        </div>
        <div className={styles.content}>
          {children}
          <footer className={styles.footer}>
            <span>The Watch Room · Emergency services incident management simulator · Not affiliated with any emergency service</span>
            <Link href="/settings" title={`${email}${discord ? ` · Discord: ${discord}` : ""}`}>Account settings</Link>
          </footer>
        </div>
      </main>
    </div>
  );
}

/** The same surface without the sidebar, for pages an account without
 *  shift access may reach: their own settings, the pre-alpha briefing
 *  before the doors open. */
export function PlainShell({ title, chip, back, children }: { title: string; chip?: string; back?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <div className={styles.plain}>
      <div className={styles.plainTop}>
        <Link href="/" className={styles.brand} aria-label="The Watch Room home">
          <Image src="/email-logo.png" width={42} height={32} alt="" />
          <span>The Watch Room<small>{title}</small></span>
        </Link>
        <div className={styles.plainRight}>
          {chip && <span className={`${styles.chip} ${styles.chipAmber}`}>{chip}</span>}
          {back && <Link href={back.href} className={styles.button}>{back.label}</Link>}
        </div>
      </div>
      <div className={styles.plainMain}>
        {children}
        <footer className={styles.footer}>
          <span>The Watch Room · Emergency services incident management simulator · Not affiliated with any emergency service</span>
          <span><Link href="/">Home</Link> · <Link href="/terms">Terms</Link></span>
        </footer>
      </div>
    </div>
  );
}
