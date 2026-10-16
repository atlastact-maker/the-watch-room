"use client";

// Sign in: a password, an emailed code, or Discord where the site has it
// switched on. The password field can be shown, says when Caps Lock is
// on, and an unconfirmed address is told so and offered the confirmation
// again.

import Link from "next/link";
import { useActionState, useState, type KeyboardEvent } from "react";
import { login, requestSignInCode, resendConfirmation, signInWithDiscord, verifySignInCode } from "@/lib/auth/actions";
import { Notice } from "@/app/components/notice";
import { Icon } from "@/app/menu/icons";
import styles from "@/app/menu/watch-menu.module.css";

export function LoginForm({ next, discordEnabled }: { next?: string; discordEnabled: boolean }) {
  const [mode, setMode] = useState<"password" | "code">("password");
  return (
    <>
      {discordEnabled && (
        <>
          <form action={signInWithDiscord}>
            {next && <input type="hidden" name="next" value={next} />}
            <button type="submit" className={`${styles.button} ${styles.fullWidth}`}><Icon.discord /> Continue with Discord</button>
          </form>
          <p className={styles.divider}><span>or</span></p>
        </>
      )}
      {mode === "password" ? <PasswordForm next={next} onCode={() => setMode("code")} /> : <CodeForm next={next} onPassword={() => setMode("password")} />}
    </>
  );
}

function PasswordForm({ next, onCode }: { next?: string; onCode: () => void }) {
  const [state, action, pending] = useActionState(login, undefined);
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const watchCaps = (e: KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState("CapsLock"));
  return (
    <>
      <form action={action} className={styles.feedback}>
        {next && <input type="hidden" name="next" value={next} />}
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" required autoFocus defaultValue={state?.unconfirmed} />
        {state?.errors?.email?.map((m) => <p key={m} className={styles.warning}>{m}</p>)}
        <label htmlFor="password">Password</label>
        <div className={styles.pwField}>
          <input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required onKeyDown={watchCaps} onKeyUp={watchCaps} onBlur={() => setCaps(false)} />
          <button type="button" className={styles.pwToggle} onClick={() => setShow((v) => !v)} aria-pressed={show} aria-controls="password" aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</button>
        </div>
        {caps && <p className={styles.warning} role="status">Caps Lock is on.</p>}
        {state?.errors?.password?.map((m) => <p key={m} className={styles.warning}>{m}</p>)}
        {state?.errors?.form?.map((m) => <p key={m} className={styles.warning} role="alert">{m}</p>)}
        <div className={styles.actions}>
          <button type="submit" className={`${styles.primary} ${styles.fullWidth}`} disabled={pending}>{pending ? "Signing in…" : "Sign in"} <Icon.arrow /></button>
        </div>
        <p className={styles.formStatus}>
          <Link className={styles.textLink} href="/forgot-password">Forgotten password?</Link>
          {" · "}
          <button type="button" className={styles.textButton} onClick={onCode}>Sign in with an emailed code</button>
        </p>
      </form>
      {state?.unconfirmed && (
        <Notice tone="amber" title="Email address not yet confirmed">
          <p>An account exists for {state.unconfirmed} but its address has not been confirmed, so it cannot sign in yet. Open the confirmation message that was sent at registration, or request another.</p>
          <ResendForm email={state.unconfirmed} />
        </Notice>
      )}
    </>
  );
}

function ResendForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendConfirmation, undefined);
  return (
    <form action={action} className={styles.actions}>
      <input type="hidden" name="email" value={email} />
      <button type="submit" className={`${styles.button} ${styles.small}`} disabled={pending || state?.ok}>{state?.ok ? "Sent" : pending ? "Sending…" : "Send the confirmation again"}</button>
      {state?.message && <span className={styles.formStatus} role="status">{state.message}</span>}
      {state?.errors?.form?.map((m) => <span key={m} className={styles.warning} role="alert">{m}</span>)}
    </form>
  );
}

function CodeForm({ next, onPassword }: { next?: string; onPassword: () => void }) {
  const [req, requestAction, requesting] = useActionState(requestSignInCode, undefined);
  const [ver, verifyAction, verifying] = useActionState(verifySignInCode, undefined);
  const sentTo = req?.codeSent;
  if (!sentTo) {
    return (
      <form action={requestAction} className={styles.feedback}>
        <p className={styles.muted}>A six-digit code is emailed to the address on the account. It can be used once and expires within the hour.</p>
        <label htmlFor="code-email">Email address</label>
        <input id="code-email" name="email" type="email" autoComplete="email" required autoFocus />
        {req?.errors?.email?.map((m) => <p key={m} className={styles.warning}>{m}</p>)}
        {req?.errors?.form?.map((m) => <p key={m} className={styles.warning} role="alert">{m}</p>)}
        <div className={styles.actions}>
          <button type="submit" className={`${styles.primary} ${styles.fullWidth}`} disabled={requesting}>{requesting ? "Sending…" : "Email me a code"} <Icon.arrow /></button>
        </div>
        <p className={styles.formStatus}><button type="button" className={styles.textButton} onClick={onPassword}>Sign in with a password instead</button></p>
      </form>
    );
  }
  return (
    <>
      <Notice tone="ok" title="Code sent">
        <p>If an account uses {sentTo}, a six-digit code has been sent to it. Enter the code below; the message also carries a button that signs you in directly on the device that opens it.</p>
      </Notice>
      <form action={verifyAction} className={styles.feedback}>
        <input type="hidden" name="email" value={sentTo} />
        {next && <input type="hidden" name="next" value={next} />}
        <label htmlFor="code">Sign-in code</label>
        <input id="code" name="token" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus className={styles.codeInput} placeholder="000000" />
        {ver?.errors?.token?.map((m) => <p key={m} className={styles.warning} role="alert">{m}</p>)}
        {ver?.errors?.form?.map((m) => <p key={m} className={styles.warning} role="alert">{m}</p>)}
        <div className={styles.actions}>
          <button type="submit" className={`${styles.primary} ${styles.fullWidth}`} disabled={verifying}>{verifying ? "Checking…" : "Sign in"} <Icon.arrow /></button>
        </div>
      </form>
      <form action={requestAction} className={styles.formStatus}>
        <input type="hidden" name="email" value={sentTo} />
        <button type="submit" className={styles.textButton} disabled={requesting}>{requesting ? "Sending…" : "Send another code"}</button>
        {" · "}
        <button type="button" className={styles.textButton} onClick={onPassword}>Sign in with a password instead</button>
      </form>
    </>
  );
}
