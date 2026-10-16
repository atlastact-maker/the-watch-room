import Link from "next/link";
import styles from "@/app/menu/watch-menu.module.css";
import { ForgotPasswordForm } from "./forgot-form";

export function ForgotView() {
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Operator access</p>
          <h1 className={styles.pageTitle}>Reset password</h1>
          <p className={styles.lede}>Enter the account email address and a reset link will be sent to it.</p>
        </div>
      </header>
      <section className={`${styles.panel} ${styles.section}`}>
        <ForgotPasswordForm />
      </section>
      <p className={`${styles.muted} ${styles.section}`}>Password remembered? <Link className={styles.textLink} href="/login">Sign in</Link>.</p>
    </>
  );
}
