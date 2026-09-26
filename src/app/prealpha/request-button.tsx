"use client";

import { useActionState } from "react";
import { requestPreAlphaAccess, type PreAlphaFormState } from "@/app/actions/prealpha";
import { Notice } from "@/app/components/notice";

// The one button. Pressing it is the agreement: bugs through the in-game
// form, talk on the Discord, nothing public until the doors open.

export function RequestPreAlphaButton({ compact = false }: { compact?: boolean }) {
  const [state, action, pending] = useActionState<PreAlphaFormState>(requestPreAlphaAccess, undefined);

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
      <p className={`leading-relaxed text-(--color-text-dim) ${compact ? "text-[11px]" : "text-[12px]"}`}>
        By requesting access you agree to keep the pre-alpha in the room: bugs through the in-game form, talk on the Discord, and no public footage, screenshots or write-ups until the team says the doors are open.
      </p>
      {state && !state.ok && <p className="text-sm text-(--color-critical)">{state.message}</p>}
    </form>
  );
}
