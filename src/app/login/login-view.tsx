import Link from "next/link";
import { Notice } from "@/app/components/notice";
import styles from "@/app/menu/watch-menu.module.css";
import { LoginForm } from "./login-form";

export function LoginView({ error, next, discordEnabled = false }: { error?: string; next?: string; discordEnabled?: boolean }) {
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Operator access</p>
          <h1 className={styles.pageTitle}>Sign in</h1>
          <p className={styles.lede}>Sign in to the operator console.</p>
        </div>
      </header>
      {error === "verify_failed" && (
        <Notice tone="critical" title="That link did not work">
          <p>It may have expired or already been used. Sign in below, or obtain a fresh link by <Link href="/signup">registering</Link> or <Link href="/forgot-password">resetting the password</Link>.</p>
        </Notice>
      )}
      {error === "discord_denied" && (
        <Notice tone="critical" title="Discord sign-in did not complete">
          <p>Discord reported that the sign-in was cancelled or refused. Try again, or sign in with your email address below.</p>
        </Notice>
      )}
      {error === "discord_unavailable" && (
        <Notice tone="critical" title="Discord sign-in is not available">
          <p>Discord could not be reached, or sign-in with Discord is not switched on for this site yet. Sign in with your email address below.</p>
        </Notice>
      )}
      <section className={`${styles.panel} ${styles.section}`}>
        <LoginForm next={next} discordEnabled={discordEnabled} />
      </section>
      <p className={`${styles.muted} ${styles.section}`}>No account? <Link className={styles.textLink} href="/signup?prealpha=1">Create one</Link>. Serving or former emergency services? <Link className={styles.textLink} href="/signup?advisor=1">Register as a development advisor</Link>.</p>
    </>
  );
}
