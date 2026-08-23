"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/auth/actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.ok && state.message) {
    return (
      <div className="rounded-sm border border-(--color-ok)/50 bg-(--color-ok)/10 px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-ok)">
          ✓ Link sent
        </p>
        <p className="mt-1.5 text-sm text-(--color-text-muted)">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1 block font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 w-full rounded-sm border border-(--color-border) bg-(--color-bg) px-3 text-sm text-(--color-text) outline-none focus:border-(--color-amber)"
        />
        {state?.errors?.email?.map((msg) => (
          <p key={msg} className="mt-1 text-sm text-(--color-critical)">
            {msg}
          </p>
        ))}
      </div>

      {state?.errors?.form?.map((msg) => (
        <p key={msg} className="text-sm text-(--color-critical)">
          {msg}
        </p>
      ))}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-sm bg-(--color-amber) font-mono text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
