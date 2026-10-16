import Link from "next/link";
import { Notice } from "@/app/components/notice";
import { Icon } from "@/app/menu/icons";
import styles from "@/app/menu/watch-menu.module.css";
import { ResetPasswordForm } from "./reset-form";

export function ResetView({ email }: { email: string | null }) {
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Operator access</p>
          <h1 className={styles.pageTitle}>Set a new password</h1>
          {email && <p className={styles.lede}>Signed in as {email}. Choose a new password for the account.</p>}
        </div>
      </header>
      {email ? (
        <section className={`${styles.panel} ${styles.section}`}>
          <ResetPasswordForm />
        </section>
      ) : (
        <>
          <Notice tone="critical" title="This reset link is invalid or has expired"><p>Request a new link and open it from the email within the hour.</p></Notice>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/forgot-password">Request a new link <Icon.arrow /></Link>
            <Link className={styles.button} href="/login">Log in</Link>
          </div>
        </>
      )}
    </>
  );
}
