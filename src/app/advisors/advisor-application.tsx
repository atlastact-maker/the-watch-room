"use client";

// The application itself — the shared advisor questionnaire wired to the
// saveAdvisorProfile action. Rendered only for signed-in operators; the
// logged-out state lives on the page and routes into signup instead.

import Link from "next/link";
import { useActionState } from "react";
import { saveAdvisorProfile } from "@/lib/auth/actions";
import {
  AdvisorQuestions,
  type AdvisorDefaults,
} from "@/app/components/advisor-questions";

export function AdvisorApplication({
  defaults,
  registered,
}: {
  defaults: AdvisorDefaults;
  registered: boolean;
}) {
  const [state, action, pending] = useActionState(saveAdvisorProfile, undefined);

  // Submitted this visit — replace the form with the receipt rather than
  // leaving a filled-in form the operator might submit twice.
  if (state?.ok) {
    return (
      <div className="rounded-sm border border-(--color-ok)/40 bg-(--color-ok)/5 px-5 py-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-(--color-ok)">
          ✓ Application received
        </p>
        <p className="mt-2.5 text-sm leading-relaxed text-(--color-text-muted)">
          {state.message ??
            "Registered — thank you. We'll be in touch as development needs you."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-[0.2em]">
          <Link href="/menu" className="text-(--color-amber) hover:text-amber-400">
            Back to ops centre →
          </Link>
          <Link href="/settings" className="text-(--color-text-dim) hover:text-(--color-text)">
            Edit in settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <AdvisorQuestions defaults={defaults} errors={state?.errors} showIntro={false} />

      {state?.errors?.form?.map((msg) => (
        <p key={msg} className="text-sm text-(--color-critical)">
          {msg}
        </p>
      ))}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex h-12 items-center justify-center rounded-sm border border-(--color-info)/60 bg-(--color-info)/10 px-6 font-mono text-[11px] uppercase tracking-[0.2em] text-(--color-info) transition-colors hover:bg-(--color-info)/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending
          ? "Sending…"
          : registered
            ? "Update my application"
            : "Submit application"}
      </button>

      <p className="text-[11px] leading-relaxed text-(--color-text-dim)">
        You can change any of this, or withdraw entirely, from Settings at any
        time.
      </p>
    </form>
  );
}
