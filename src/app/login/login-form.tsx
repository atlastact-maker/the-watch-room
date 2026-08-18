"use client";

import { useActionState } from "react";
import { login } from "@/lib/auth/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-4">
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        errors={state?.errors?.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        errors={state?.errors?.password}
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
        {pending ? "Authenticating…" : "Log in"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  errors,
}: {
  label: string;
  name: string;
  type: string;
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
        type={type}
        autoComplete={autoComplete}
        required
        className="block w-full rounded-sm border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-sm text-(--color-text) outline-none transition-colors focus:border-(--color-amber)"
      />
      {errors?.map((msg) => (
        <p key={msg} className="mt-1 text-xs text-(--color-critical)">
          {msg}
        </p>
      ))}
    </div>
  );
}
