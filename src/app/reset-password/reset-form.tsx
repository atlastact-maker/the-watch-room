"use client";

import { useActionState } from "react";
import { updatePassword } from "@/lib/auth/actions";
import { Icon } from "@/app/menu/icons";
import styles from "@/app/menu/watch-menu.module.css";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);
  return (
    <form action={action} className={styles.feedback}>
      <label htmlFor="password">New password</label>
      <input id="password" name="password" type="password" autoComplete="new-password" required />
      <small className={styles.hint}>Minimum 8 characters, including a letter and a number.</small>
      {state?.errors?.password?.map((m) => <p key={m} className={styles.warning}>{m}</p>)}
      <label htmlFor="confirm">Confirm new password</label>
      <input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      {state?.errors?.confirm?.map((m) => <p key={m} className={styles.warning}>{m}</p>)}
      {state?.errors?.form?.map((m) => <p key={m} className={styles.warning}>{m}</p>)}
      <div className={styles.actions}>
        <button type="submit" className={`${styles.primary} ${styles.fullWidth}`} disabled={pending}>{pending ? "Saving…" : "Set password and log in"} <Icon.arrow /></button>
      </div>
    </form>
  );
}
