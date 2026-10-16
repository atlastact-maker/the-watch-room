"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/auth/actions";
import { Icon } from "@/app/menu/icons";
import styles from "@/app/menu/watch-menu.module.css";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className={styles.feedback}>
      {next && <input type="hidden" name="next" value={next} />}
      <label htmlFor="email">Email address</label>
      <input id="email" name="email" type="email" autoComplete="email" required />
      {state?.errors?.email?.map((m) => <p key={m} className={styles.warning}>{m}</p>)}
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required />
      {state?.errors?.password?.map((m) => <p key={m} className={styles.warning}>{m}</p>)}
      {state?.errors?.form?.map((m) => <p key={m} className={styles.warning}>{m}</p>)}
      <div className={styles.actions}>
        <button type="submit" className={`${styles.primary} ${styles.fullWidth}`} disabled={pending}>{pending ? "Signing in…" : "Log in"} <Icon.arrow /></button>
      </div>
      <p className={styles.formStatus}><Link className={styles.textLink} href="/forgot-password">Forgotten password?</Link></p>
    </form>
  );
}
