"use client";

// Operator induction on the overview: five steps, ticked as they are
// done, gone once they all are or when dismissed.

import Link from "next/link";
import { Icon } from "./icons";
import { markInduction, useInduction } from "./induction";
import { COMMUNITY } from "./menu-types";
import styles from "./watch-menu.module.css";

type Step = { key: string; title: string; hint: string; done: boolean; action: { label: string; href: string; external?: boolean; onClick?: () => void } };

export function InductionPanel({ callsign, discord, played, started }: { callsign: string; discord: string; played: boolean; started: boolean }) {
  const flags = useInduction();
  if (flags.dismissed) return null;
  const steps: Step[] = [
    { key: "callsign", title: "Set your callsign", hint: "Shown on the console, the leaderboard and the service record.", done: !!callsign.trim(), action: { label: "Settings", href: "/settings" } },
    { key: "discord", title: "Add your Discord handle", hint: "Needed to add you to the tester channel and match reports to the account.", done: !!discord.trim(), action: { label: "Settings", href: "/settings" } },
    { key: "joined", title: "Join the tester channel", hint: "Build announcements, test focus and discussion with the development team.", done: !!flags.joined, action: { label: "Open Discord", href: COMMUNITY, external: true, onClick: () => markInduction({ joined: true }) } },
    { key: "briefing", title: "Read the Pre-Alpha briefing", hint: "Scenarios released, the shift procedure and what to test.", done: !!flags.briefing, action: { label: "Briefing", href: "/prealpha", onClick: () => markInduction({ briefing: true }) } },
    { key: "shift", title: "Take a first shift", hint: "Twenty minutes to an hour. The service record opens with the first stop message.", done: played || started, action: { label: "Start shift", href: "/menu?view=shift" } },
  ];
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  return (
    <section className={`${styles.panel} ${styles.induction}`} aria-labelledby="induction-title">
      <div className={styles.panelHead}>
        <h2 id="induction-title">Operator induction</h2>
        <span className={`${styles.chip} ${done > 0 ? styles.chipAmber : ""}`}>{done} of {steps.length} complete</span>
      </div>
      <div className={styles.track} aria-hidden="true"><span className={styles.fill} style={{ width: `${(done / steps.length) * 100}%` }} /></div>
      <ol className={styles.inductionList}>
        {steps.map((s) => (
          <li key={s.key} className={s.done ? styles.done : undefined}>
            {s.key === "joined" || s.key === "briefing" ? (
              <button type="button" role="checkbox" aria-checked={s.done} aria-label={`${s.title} done`} title={s.done ? "Done. Select to clear." : "Select to mark as done."} className={`${styles.tick} ${s.done ? styles.tickOn : ""}`} onClick={() => markInduction({ [s.key]: !s.done })}>✓</button>
            ) : (
              <span className={`${styles.tick} ${s.done ? styles.tickOn : ""}`} aria-hidden="true">✓</span>
            )}
            <span><strong>{s.title}</strong><small>{s.hint}</small></span>
            {!s.done &&
              (s.action.external ? (
                <a className={`${styles.button} ${styles.small}`} href={s.action.href} target="_blank" rel="noreferrer" onClick={s.action.onClick}>{s.action.label} <Icon.external /></a>
              ) : (
                <Link className={`${styles.button} ${styles.small}`} href={s.action.href} onClick={s.action.onClick}>{s.action.label} <Icon.arrow /></Link>
              ))}
          </li>
        ))}
      </ol>
      <p className={styles.formStatus}>
        <button type="button" className={styles.textButton} onClick={() => markInduction({ dismissed: true })}>Dismiss the induction</button>
      </p>
    </section>
  );
}
