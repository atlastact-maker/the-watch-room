// Every build, most recent first: the release notes page's content,
// shared with the dev harness.

import Link from "next/link";
import { CHANGELOG, formatEntryDate } from "@/lib/changelog";
import { Icon } from "@/app/menu/icons";
import { COMMUNITY, viewHref } from "@/app/menu/menu-types";
import styles from "@/app/menu/watch-menu.module.css";

export function ReleaseNotes() {
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Release notes · all builds</p>
          <h1 className={styles.pageTitle}>Release notes</h1>
          <p className={styles.lede}>Every build of The Watch Room, most recent first. Items may change again while the pre-alpha runs.</p>
        </div>
        <div className={styles.headMeta}>
          <span className={styles.chip}>{CHANGELOG.length} builds</span>
          <Link className={styles.button} href={viewHref("updates")}>Submit a report <Icon.arrow /></Link>
        </div>
      </header>
      <section className={styles.panel}>
        {CHANGELOG.map((entry) => (
          <article className={styles.update} key={`${entry.version}-${entry.date}`}>
            <p className={styles.eyebrow}>Build {entry.version} · {formatEntryDate(entry.date)}</p>
            <h2>{entry.title}</h2>
            <ul className={styles.bullets}>{entry.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        ))}
      </section>
      <p className={`${styles.muted} ${styles.section}`}>Development notes for each build are posted in the <a className={styles.textLink} href={COMMUNITY} target="_blank" rel="noreferrer">tester channel on Discord</a>.</p>
    </>
  );
}
