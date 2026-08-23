"use client";

import { useActionState } from "react";
import { updatePassword } from "@/lib/auth/actions";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);

  return (
    <form action={action} className="space-y-4">
      <Field
        label="New password"
        name="password"
        autoComplete="new-password"
        errors={state?.errors?.password}
      />
      <Field
        label="Confirm new password"
        name="confirm"
        autoComplete="new-password"
        errors={state?.errors?.confirm}
      />

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
        {pending ? "Saving…" : "Set password & log in"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  autoComplete,
  errors,
}: {
  label: string;
  name: string;
  autoComplete: string;
  errors?: string[];
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="password"
        autoComplete={autoComplete}
        required
        className="h-11 w-full rounded-sm border border-(--color-border) bg-(--color-bg) px-3 text-sm text-(--color-text) outline-none focus:border-(--color-amber)"
      />
      {errors?.map((msg) => (
        <p key={msg} className="mt-1 text-sm text-(--color-critical)">
          {msg}
        </p>
      ))}
    </div>
  );
}
