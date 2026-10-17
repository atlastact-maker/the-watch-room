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
import { NotificationBell } from "@/app/components/notification-bell";
import type { NotificationRow } from "@/lib/notifications";
import { COMMUNITY, TITLES, viewHref, type MenuView } from "./menu-types";
import styles from "./watch-menu.module.css";

/** Where in the console a page sits: one of the menu's views, or one of
 *  the pages the sidebar links to. Decides which nav item is lit. */
export type NavKey = MenuView | "record" | "colleagues" | "library" | "briefing" | "admin" | "settings";

/** The signed-in operator as the frame shows them. */
export type ConsoleUser = {
  callsign: string;
  email: string;
  discord: string;
  isAdmin: boolean;
  viewAs: "admin" | "tester" | null;
  /** Colleague requests waiting for an answer, for the sidebar's count. */
  pending?: number;
  /** The account id, for the bell's subscription and the profile link. */
  userId?: string;
  /** Unread notifications, for the bell's count. */
  unread?: number;
  /** A pop-up to show on load (the dev harness). */
  demoToast?: NotificationRow | null;
};

function LogoutButton() {
  const { pending } = useFormStatus();
  return <button className={styles.logout} disabled={pending} type="submit">{pending ? "Signing out…" : "Sign out"}</button>;
}

export function ConsoleShell({ callsign, email, discord, isAdmin, viewAs, pending = 0, userId, unread = 0, demoToast, active, title, children }: ConsoleUser & { active: NavKey; title: string; children: React.ReactNode }) {
  const nav = (key: NavKey, href: string, icon: IconName, label: string, count = 0) => {
    const I = Icon[icon];
    const current = active === key;
    return <Link className={current ? styles.active : undefined} href={href} aria-current={current ? "page" : undefined}><I /><span>{label}</span>{count > 0 && <span className={styles.navBadge} aria-label={`${count} waiting`}>{count}</span>}</Link>;
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
          {nav("colleagues", "/colleagues", "colleagues", "Colleagues", pending)}
          {nav("guide", viewHref("guide"), "guide", TITLES.guide)}
          {nav("briefing", "/prealpha", "briefing", "Pre-Alpha briefing")}
          <p>Programme</p>
          {ext(COMMUNITY, "discord", "Tester channel")}
          {nav("updates", viewHref("updates"), "updates", TITLES.updates)}
          <p>Account</p>
          {isAdmin && nav("admin", "/admin", "admin", "Administration")}
          {nav("settings", "/settings", "settings", "Settings")}
          {/* On phones the account block is a single row with no room for
              the switch, so it rides in the nav strip there instead. */}
          {viewAs && (
            <form action={setViewAs} className={`${styles.navSwitch} ${viewAs === "tester" ? styles.navSwitchOn : ""}`}>
              <input type="hidden" name="mode" value={viewAs === "tester" ? "admin" : "tester"} />{viewAs !== "tester" && <input type="hidden" name="next" value="/menu" />}
              <button type="submit" title={viewAs === "tester" ? "Return to the administrator view" : "View the console and the desk as a tester"}><Icon.eye /><span>{viewAs === "tester" ? "Admin view" : "View as tester"}</span></button>
            </form>
          )}
        </nav>
        <div className={styles.account}>
          <Link href={userId ? `/operators/${userId}` : "/settings"} title={userId ? "Your profile, as other operators see it" : email} className={styles.who}>
            <span className={styles.avatar} aria-hidden="true">{(callsign || email || "?").slice(0, 2).toUpperCase()}</span>
            <span><strong>{callsign || "Operator account"}</strong><small>{viewAs === "tester" ? "Administrator · viewing as tester" : isAdmin ? "Administrator" : "Operator"}</small></span>
          </Link>
          {viewAs && (
            <form action={setViewAs}>
              <input type="hidden" name="mode" value={viewAs === "tester" ? "admin" : "tester"} />{viewAs !== "tester" && <input type="hidden" name="next" value="/menu" />}
              <button className={styles.button} type="submit" title={viewAs === "tester" ? "Return to the administrator view" : "View the console and the desk as a tester"}>{viewAs === "tester" ? "Return to admin view" : "View as tester"}</button>
            </form>
          )}
          <form action={logout}><LogoutButton /></form>
          <p>Greater Manchester<br />Closed Pre-Alpha · Build {LATEST.version}</p>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.topbar}>
          <span>Operator console <i>/</i> <strong>{title}</strong></span>
          <span className={styles.topbarRight}>
            {userId && <NotificationBell userId={userId} initialUnread={unread} demo={demoToast} />}
            <span className={styles.liveDot} aria-hidden="true" />Greater Manchester
          </span>
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

/** The same surface without the sidebar, for everyone the console is not
 *  open to: visitors on the landing page and the registration and login
 *  flow, and signed-in accounts without shift access on their own pages
 *  (standing by, settings, the briefing before the doors open). */
export type PublicLink = { href: string; label: string; primary?: boolean; button?: boolean; external?: boolean };

export function PublicShell({ brandLine = "Incident management simulator", chip, links = [], actions, width = "page", children }: {
  brandLine?: string;
  chip?: string;
  links?: PublicLink[];
  /** Extra controls on the right of the top bar, such as a log-out form. */
  actions?: React.ReactNode;
  width?: "narrow" | "page" | "wide";
  children: React.ReactNode;
}) {
  const cls = width === "narrow" ? styles.plainNarrow : width === "wide" ? styles.plainWide : "";
  return (
    <div className={styles.plain}>
      <div className={styles.plainTop}>
        <Link href="/" className={styles.brand} aria-label="The Watch Room home">
          <Image src="/email-logo.png" width={42} height={32} alt="" />
          <span>The Watch Room<small>{brandLine}</small></span>
        </Link>
        <nav className={styles.plainNav} aria-label="Site">
          {chip && <span className={`${styles.chip} ${styles.chipAmber}`}>{chip}</span>}
          {links.map((l) => {
            const c = l.primary ? styles.primary : l.button ? styles.button : undefined;
            return l.external
              ? <a key={l.href} href={l.href} className={c} target="_blank" rel="noreferrer">{l.label}</a>
              : <Link key={l.href} href={l.href} className={c}>{l.label}</Link>;
          })}
          {actions}
        </nav>
      </div>
      <div className={`${styles.plainMain} ${cls}`}>
        {children}
        <footer className={styles.footer}>
          <span>The Watch Room · Emergency services incident management simulator · Not affiliated with any emergency service</span>
          <span className={styles.footLinks}><a href={COMMUNITY} target="_blank" rel="noreferrer">Discord</a><Link href="/prealpha">Pre-Alpha</Link><Link href="/terms">Terms</Link></span>
        </footer>
      </div>
    </div>
  );
}
