import Link from "next/link";
import { Notice } from "@/app/components/notice";
import styles from "@/app/menu/watch-menu.module.css";
import { LoginForm } from "./login-form";

export function LoginView({ error, next }: { error?: string; next?: string }) {
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Operator access</p>
          <h1 className={styles.pageTitle}>Log in</h1>
          <p className={styles.lede}>Sign in to the operator console.</p>
        </div>
      </header>
      {error === "verify_failed" && (
        <Notice tone="critical" title="That link did not work">
          <p>It may have expired or already been used. Log in below, or obtain a fresh link by <Link href="/signup">registering</Link> or <Link href="/forgot-password">resetting the password</Link>.</p>
        </Notice>
      )}
      <section className={`${styles.panel} ${styles.section}`}>
        <LoginForm next={next} />
      </section>
      <p className={`${styles.muted} ${styles.section}`}>No account? <Link className={styles.textLink} href="/signup?prealpha=1">Create one</Link>. Serving or former emergency services? <Link className={styles.textLink} href="/signup?advisor=1">Register as a development advisor</Link>.</p>
    </>
  );
}
