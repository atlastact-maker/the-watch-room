"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signup } from "@/lib/auth/actions";
import { AdvisorQuestions } from "@/app/components/advisor-questions";
import { Notice } from "@/app/components/notice";
import { Icon } from "@/app/menu/icons";
import styles from "@/app/menu/watch-menu.module.css";

export function SignupForm({ defaultAdvisorOpen = false, defaultPrealpha = false, prealphaCloses = "", prealphaOpen = true }: {
  defaultAdvisorOpen?: boolean;
  defaultPrealpha?: boolean;
  prealphaCloses?: string;
  /** Sign-ups for the Pre-Alpha are being taken; otherwise the request is greyed out. */
  prealphaOpen?: boolean;
}) {
  const [state, action, pending] = useActionState(signup, undefined);
  const [advisorOpen, setAdvisorOpen] = useState(defaultAdvisorOpen);

  // Email confirmation enabled server-side: the account exists but needs
  // the inbox link before login works.
  if (state?.needsConfirmation) {
    return (
      <Notice tone="ok" title="Confirm the email address">
        <p>A confirmation link has been sent to the address given. Open it and the account is live; then sign in.</p>
        <p>Nothing after a couple of minutes? Check the spam folder.</p>
      </Notice>
    );
  }

  const errs = (list?: string[]) => list?.map((m) => <p key={m} className={styles.warning}>{m}</p>);

  return (
    <form action={action} className={styles.feedback}>
      <label htmlFor="callsign">Callsign</label>
      <input id="callsign" name="callsign" type="text" autoComplete="username" placeholder="e.g. OSCAR 21" required />
      {state?.errors?.callsign?.length ? errs(state.errors.callsign) : <small className={styles.hint}>Shown on the console and the service record. 2 to 24 characters.</small>}
      <label htmlFor="email">Email address</label>
      <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      {errs(state?.errors?.email)}
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="new-password" required />
      {state?.errors?.password?.length ? errs(state.errors.password) : <small className={styles.hint}>Minimum 8 characters, including a letter and a number.</small>}

      <div className={`${styles.checks} ${styles.checksStack}`}>
        <label>
          <input type="checkbox" name="acceptTerms" />
          <span>I accept the <Link href="/terms" target="_blank" rel="noopener noreferrer">terms and conditions</Link>.</span>
        </label>
        <label aria-disabled={!prealphaOpen}>
          <input type="checkbox" name="prealpha" defaultChecked={prealphaOpen && defaultPrealpha} disabled={!prealphaOpen} />
          <span>
            Join the Pre-Alpha
            <small>{prealphaOpen ? `Requests access to the closed test. Granted by hand; an email is sent when the desk is open to the account.${prealphaCloses ? ` Sign-ups close on ${prealphaCloses}.` : ""}` : "Sign-ups for the Pre-Alpha are closed. A wider test follows, and this account will be ready for it."}</small>
          </span>
        </label>
        <label>
          <input type="checkbox" name="newsletter" />
          <span>Send development updates to this address.</span>
        </label>
        <label>
          <input type="checkbox" name="advisor" checked={advisorOpen} onChange={(e) => setAdvisorOpen(e.target.checked)} />
          <span>Serving or former emergency services: register as a development advisor.<small>Opens the advisor questionnaire below.</small></span>
        </label>
      </div>
      {errs(state?.errors?.acceptTerms)}

      {advisorOpen && (
        <div className={styles.subPanel}>
          <AdvisorQuestions errors={state?.errors} />
        </div>
      )}

      {errs(state?.errors?.form)}
      <div className={styles.actions}>
        <button type="submit" className={`${styles.primary} ${styles.fullWidth}`} disabled={pending}>{pending ? "Creating account…" : "Create account"} <Icon.arrow /></button>
      </div>
      <p className={styles.formStatus}>The email address is used to sign in, and for development updates only where selected.</p>
    </form>
  );
}
