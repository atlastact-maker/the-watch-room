import Link from "next/link";
import styles from "@/app/menu/watch-menu.module.css";

// Terms and conditions, in plain English, for a hobby simulation game.

const CLAUSES: { title: string; body: React.ReactNode }[] = [
  { title: "What The Watch Room is", body: "The Watch Room is a fictional emergency services incident management simulation game. It is a hobby project. It is not affiliated with, endorsed by, or connected to any real emergency service, including Greater Manchester Fire & Rescue Service, North West Ambulance Service, Greater Manchester Police, or any UK control room. Real station names, locations, appliance types and procedures appear only to make the simulation authentic." },
  { title: "Not for real emergencies", body: "Nothing in this game is operational guidance, training material, or advice for real incidents. In a real emergency, call 999." },
  { title: "Your account", body: "An account is needed to save progress. Keep the login details private and provide a working email address. You are responsible for what happens under your account. Accounts that abuse the service or other players may be suspended or deleted." },
  { title: "Acceptable use", body: "Do not attempt to break, overload, reverse-engineer, or gain unauthorised access to the service or other people's accounts, and do not use the service for anything unlawful." },
  { title: "Your data", body: "The email address, callsign and newsletter preference given at registration are stored, with game progress, so the service can work. Updates and newsletters are sent only where the box was ticked, and the preference can be changed at any time. Data is not sold." },
  { title: "No warranty", body: "The Watch Room is provided as-is, free of charge, while in development. It may go offline, change, break, or lose saved progress at any time, without notice. To the fullest extent the law allows, no liability is accepted for any loss arising from its use." },
  { title: "Changes to these terms", body: "These terms may be updated as the game develops. Continued use of the service after an update counts as acceptance of the new terms. The date above always shows the current version." },
  { title: "Contact", body: <>Questions about these terms or your data: <a className={styles.textLink} href="mailto:thewtchroom@gmail.com">thewtchroom@gmail.com</a>.</> },
];

export function TermsView() {
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Terms and conditions · version 1.0 · last updated 22 Aug 2026</p>
          <h1 className={styles.pageTitle}>Terms and conditions</h1>
          <p className={styles.lede}>Plain-English terms for a hobby simulation game, accepted at registration.</p>
        </div>
      </header>
      <section className={styles.panel}>
        <ol className={styles.clauses}>
          {CLAUSES.map((c, i) => <li key={c.title}><span>{String(i + 1).padStart(2, "0")}</span><h2>{c.title}</h2><p>{c.body}</p></li>)}
        </ol>
      </section>
      <p className={`${styles.muted} ${styles.section}`}><Link className={styles.textLink} href="/signup">Back to registration</Link></p>
    </>
  );
}
