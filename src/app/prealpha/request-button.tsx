"use client";

import { useActionState } from "react";
import { requestPreAlphaAccess, type PreAlphaFormState } from "@/app/actions/prealpha";
import { Notice } from "@/app/components/notice";
import { Icon } from "@/app/menu/icons";
import styles from "@/app/menu/watch-menu.module.css";

// The one button. Pressing it is the agreement: defects through the
// in-game form, discussion on the tester channel, nothing public until
// the doors open.

export function RequestPreAlphaButton() {
  const [state, action, pending] = useActionState<PreAlphaFormState>(requestPreAlphaAccess, undefined);
  if (state?.ok) {
    return (
      <Notice tone="ok" title="Request received">
        <p>Access is granted by hand, so there is a short wait. An email is sent when the account is on the list, and another when the doors open.</p>
      </Notice>
    );
  }
  return (
    <form action={action}>
      <div className={styles.actions}>
        <button type="submit" disabled={pending} className={styles.primary}>{pending ? "Submitting…" : "Request pre-alpha access"} <Icon.arrow /></button>
      </div>
      <p className={styles.formStatus}>By requesting access you agree to keep the pre-alpha within the programme: defects through the in-game form, discussion on the tester channel, and no public footage, screenshots or write-ups until the team confirms the doors are open.</p>
      {state && !state.ok && <p className={styles.warning}>{state.message}</p>}
    </form>
  );
}
