// The front door: the console's own face shown to a visitor. The hero
// over the county plate, the county in numbers, the incident lifecycle,
// and the two programmes a visitor can join. It links only where a
// visitor can go: the briefing, registration and login.

import Link from "next/link";
import type { CSSProperties } from "react";
import { CountyPlate, type PlateStation } from "@/app/menu/county-plate";
import { Icon } from "@/app/menu/icons";
import { LIFECYCLE, SERVICE_TINT, serviceName, unitsWord, type CountyFacts } from "@/app/menu/menu-types";
import styles from "@/app/menu/watch-menu.module.css";
import type { ServiceCode } from "@/lib/sim/types";

export type LandingData = {
  /** Registration is open (the announced date has passed). */
  open: boolean;
  /** The date registration opens, for the holding state. */
  opensOn: string;
  signups: { open: boolean; closed: boolean; closes: string; opens: string };
  facts: CountyFacts;
  stations: PlateStation[];
};

export function LandingView({ data }: { data: LandingData }) {
  const { open, opensOn, signups, facts, stations } = data;
  const totalStations = facts.services.reduce((n, s) => n + s.stations, 0);
  const totalAppliances = facts.services.reduce((n, s) => n + s.appliances, 0);
  const signupLine = signups.open
    ? `Sign-ups open${signups.closes ? ` · close ${signups.closes}` : ""}`
    : signups.closed
      ? "Sign-ups closed"
      : `Sign-ups open ${signups.opens}`;

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.brandLine}><span className={styles.liveDot} aria-hidden="true" />Emergency services incident management simulator</p>
          <h1>You&apos;re in<br /><span>command and control.</span></h1>
          <p>Receive the 999 call, mobilise from Greater Manchester&apos;s real station network and take command of the incident ground. Fire &amp; rescue, ambulance and police operations from a single operator position.</p>
          <div className={styles.actions}>
            {open ? <Link className={styles.primary} href="/signup?prealpha=1">Create an account <Icon.arrow /></Link> : <span className={styles.chip}>Registration opens {opensOn}</span>}
            <Link className={styles.button} href="/login">Sign in</Link>
          </div>
          <div className={styles.headMeta} style={{ justifyContent: "flex-start", marginTop: 14 }}>
            <span className={`${styles.chip} ${styles.chipAmber}`}>Closed Pre-Alpha</span>
            <span className={styles.chip}>{signupLine}</span>
          </div>
          <ul className={styles.serviceRow} aria-label="Services modelled">
            {(["Fire", "Ambulance", "Police"] as ServiceCode[]).map((s) => <li key={s}><b style={{ background: SERVICE_TINT[s] }} />{serviceName(s)}</li>)}
          </ul>
        </div>
        <CountyPlate stations={stations} caption={`${totalStations} stations · ${totalAppliances} resources · Greater Manchester`} />
      </section>

      <section className={styles.block}>
        <div className={styles.blockHead}>
          <h2>The county</h2>
          <Link href="/prealpha">Pre-Alpha briefing <Icon.arrow /></Link>
        </div>
        <div className={styles.facts}>
          {facts.services.map((s) => (
            <div key={s.service} className={styles.fact} style={{ "--tint": SERVICE_TINT[s.service] } as CSSProperties}>
              <span className={styles.factBar} aria-hidden="true" />
              <strong>{s.stations}</strong>
              <span>{serviceName(s.service)} stations</span>
              <small>{s.appliances} {unitsWord(s.service)} established</small>
            </div>
          ))}
          <div className={styles.fact} style={{ "--tint": "var(--amber)" } as CSSProperties}>
            <span className={styles.factBar} aria-hidden="true" />
            <strong>{facts.scenarios}</strong>
            <span>incident types modelled</span>
            <small>variant outcomes on every run</small>
          </div>
        </div>
      </section>

      <section className={styles.block}>
        <div className={styles.blockHead}><h2>Incident lifecycle</h2></div>
        <ol className={styles.pillars}>
          {LIFECYCLE.map((s) => <li key={s.n}><span className={styles.stepNo}>{s.n}</span><strong>{s.title}</strong><p>{s.body}</p></li>)}
        </ol>
      </section>

      <div className={`${styles.twoUp} ${styles.section}`}>
        <section className={styles.panel}>
          <p className={styles.eyebrow}>Closed Pre-Alpha · tester programme</p>
          <h2 className={styles.panelTitle}>Test the complete console.</h2>
          <p className={styles.muted}>Fire &amp; rescue, ambulance and police incidents, each with variant outcomes between runs. Testers have the console from call receipt to debrief, in-game defect reporting, and a private tester channel on Discord with the development team and the advisors.</p>
          <p className={styles.muted} style={{ marginTop: 10 }}>
            {signups.closed
              ? "Sign-ups for this round have closed. A wider test follows the Pre-Alpha, and an account created now is ready for it."
              : `Select "Join the Pre-Alpha" at registration, or request access from an existing account. Access is granted by hand and an email is sent when the desk is open to you.${signups.closes ? ` Sign-ups close on ${signups.closes}.` : ""}`}
          </p>
          <div className={styles.actions}>
            {open && !signups.closed && <Link className={styles.primary} href="/signup?prealpha=1">Create an account <Icon.arrow /></Link>}
            <Link className={styles.button} href="/prealpha">Pre-Alpha briefing</Link>
          </div>
        </section>
        <section className={styles.panel}>
          <p className={styles.eyebrow}>Development advisor programme</p>
          <h2 className={styles.panelTitle}>Served in fire, ambulance, police or a control room?</h2>
          <p className={styles.muted}>Serving and former personnel keep the simulation authentic: the occasional question, or reviewing features as they are built. Unpaid and informal, with a say in how the job is portrayed and the advisor mark against the callsign. Advisors test the Pre-Alpha too.</p>
          <div className={styles.actions}>
            {open ? <Link className={styles.button} href="/signup?advisor=1">Apply to the advisor programme <Icon.arrow /></Link> : <span className={styles.chip}>Applications open {opensOn}</span>}
          </div>
        </section>
      </div>
    </>
  );
}
