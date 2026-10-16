import Link from "next/link";
import { COMMUNITY } from "@/app/menu/menu-types";
import styles from "@/app/menu/watch-menu.module.css";
import { SignupForm } from "./signup-form";

export type SignupData = {
  /** Registration is open (the announced date has passed). */
  open: boolean;
  opensOn: string;
  /** Arrived from a Pre-Alpha or advisor link: pre-select the matching box. */
  prealpha: boolean;
  advisor: boolean;
  signups: { open: boolean; closes: string };
};

export function SignupView({ data }: { data: SignupData }) {
  const { open, opensOn, prealpha, advisor, signups } = data;
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Operator registration · closed Pre-Alpha</p>
          <h1 className={styles.pageTitle}>Create an account</h1>
          <p className={styles.lede}>
            {!open
              ? `Registration opens ${opensOn}, alongside the development advisor programme for anyone who has served in fire, ambulance, police or a control room.`
              : prealpha && signups.open
                ? "Joining the Pre-Alpha: the access request below is pre-selected. Create the account and confirm the email address; the request is filed on confirmation."
                : "An account saves progress and carries the service record between devices. The Pre-Alpha is a closed test; select the request below to apply for access."}
          </p>
        </div>
      </header>
      <section className={`${styles.panel} ${styles.section}`}>
        {open ? (
          <SignupForm defaultAdvisorOpen={advisor} defaultPrealpha={prealpha && signups.open} prealphaCloses={signups.open ? signups.closes : ""} prealphaOpen={signups.open} />
        ) : (
          <p className={styles.muted}>Until then, development continues in the open on the <a className={styles.textLink} href={COMMUNITY} target="_blank" rel="noreferrer">Discord</a>.</p>
        )}
      </section>
      <p className={`${styles.muted} ${styles.section}`}>Existing account? <Link className={styles.textLink} href="/login">Sign in</Link>.</p>
    </>
  );
}
