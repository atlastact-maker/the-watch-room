"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/auth/actions";
import { Notice } from "@/app/components/notice";
import { Icon } from "@/app/menu/icons";
import styles from "@/app/menu/watch-menu.module.css";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);
  if (state?.ok && state.message) {
    return <Notice tone="ok" title="Check the inbox" className={styles.section}><p>{state.message}</p></Notice>;
  }
  return (
    <form action={action} className={styles.feedback}>
      <label htmlFor="email">Account email address</label>
      <input id="email" name="email" type="email" autoComplete="email" required />
      {state?.errors?.email?.map((m) => <p key={m} className={styles.warning}>{m}</p>)}
      {state?.errors?.form?.map((m) => <p key={m} className={styles.warning}>{m}</p>)}
      <div className={styles.actions}>
        <button type="submit" className={`${styles.primary} ${styles.fullWidth}`} disabled={pending}>{pending ? "Sending…" : "Send reset link"} <Icon.arrow /></button>
      </div>
    </form>
  );
}
