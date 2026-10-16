"use client";

import { useActionState } from "react";
import { requestPreAlphaAccess, type PreAlphaFormState } from "@/app/actions/prealpha";
import { Notice } from "@/app/components/notice";
import { Icon } from "@/app/menu/icons";
import styles from "@/app/menu/watch-menu.module.css";

// The one button. Pressing it is the agreement: defects through the
// in-game form, discussion on the Discord, nothing public until the
// doors open. The console variant wears the console's classes; the
// default keeps the account pages' Tailwind styling (/standby).

const TERMS = "By requesting access you agree to keep the pre-alpha within the programme: defects through the in-game form, discussion on the tester channel, and no public footage, screenshots or write-ups until the team confirms the doors are open.";

export function RequestPreAlphaButton({ compact = false, variant = "default" }: { compact?: boolean; variant?: "default" | "console" }) {
  const [state, action, pending] = useActionState<PreAlphaFormState>(requestPreAlphaAccess, undefined);

  if (variant === "console") {
    if (state?.ok) {
      return <div className={`${styles.notice} ${styles.noticeOk}`}><strong>Request received</strong><p>Access is granted by hand, so there is a short wait. An email is sent when the account is on the list, and another when the doors open.</p></div>;
    }
    return (
      <form action={action}>
        <div className={styles.actions}>
          <button type="submit" disabled={pending} className={styles.primary}>{pending ? "Submitting…" : "Request pre-alpha access"} <Icon.arrow /></button>
        </div>
        <p className={styles.formStatus}>{TERMS}</p>
        {state && !state.ok && <p className={styles.warning}>{state.message}</p>}
      </form>
    );
  }

  if (state?.ok) {
    return (
      <Notice tone="ok" title="Request received">
        <p>Access is granted by hand, so there is a short wait. You will get an email when you are on the list, and another when the doors open.</p>
      </Notice>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <button
        type="submit"
        disabled={pending}
        className={`inline-flex min-h-12 items-center justify-center rounded-sm bg-(--color-amber) px-6 py-3 font-mono text-sm font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-amber-400 disabled:opacity-60 ${compact ? "self-start" : "sm:self-start"}`}
      >
        {pending ? "Sending…" : "Request pre-alpha access"}
      </button>
      <p className={`leading-relaxed text-(--color-text-dim) ${compact ? "text-[11px]" : "text-[12px]"}`}>{TERMS}</p>
      {state && !state.ok && <p className="text-sm text-(--color-critical)">{state.message}</p>}
    </form>
  );
}
